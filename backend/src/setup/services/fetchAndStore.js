require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });

const https = require('https');
const { pool, initDb } = require('../db');

const DATA_URL = 'https://data.cityofnewyork.us/resource/xjfq-wh2d.json';

function fetchJson(url, headers = {}) {
  const defaultHeaders = {
    'X-App-Token': process.env.SOCRATA_APP_TOKEN || ''
  };
  
  const requestOptions = {
    method: 'GET',
    headers: { ...defaultHeaders, ...headers }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(url, requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(data || '[]');
          resolve(json);
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

function mapRecord(rec) {
  const license = rec.license_number || rec.licenseno || rec.license || rec.driver_license_number || null;
  const name = rec.driver_name || rec.name || rec.licensee_name || null;
  const base_name = rec.base_name || rec.affiliated_base_name || null;
  const base_number = rec.base_number || rec.affiliated_base_number || null;
  const base_address = rec.base_address || rec.affiliated_base_address || rec.address || null;

  // ✅ NEW: extra borough source fields
  const rawBorough =
    rec.borough ||
    rec.driver_borough ||
    rec.base_borough ||
    rec.county ||
    rec.base_county ||
    rec.vehicle_borough ||
    rec.base_city ||
    rec.driver_city ||
    rec['borough (driver)'] ||
    rec['borough (base)'] ||
    null;

  // ✅ Try to normalize borough from multiple possible hints
  const borough =
    normalizeBorough(rawBorough) ||
    inferBoroughFromBaseNumber(base_number) ||
    inferBoroughFromAddress(base_address) ||
    inferBoroughFromBaseName(base_name) || // NEW
    null;

  const active =
    rec.active === true ||
    String(rec.active || '').toLowerCase() === 'true' ||
    rec.active_status === 'Active' ||
    true;

  const dataset_last_updated = rec.dataset_last_updated || rec.last_updated || null;
  return { license, name, borough, active, base_name, base_number, dataset_last_updated };
}

function normalizeBorough(val) {
  if (!val || typeof val !== 'string') return null;
  const s = val.trim().toLowerCase();
  if (['bronx', 'bx'].includes(s)) return 'Bronx';
  if (['brooklyn', 'bk', 'kings'].includes(s)) return 'Brooklyn';
  if (['manhattan', 'ny', 'new york', 'nyc'].includes(s)) return 'Manhattan';
  if (['queens', 'qn'].includes(s)) return 'Queens';
  if (['staten island', 'si', 'richmond'].includes(s)) return 'Staten Island';
  return null;
}

function inferBoroughFromBaseNumber(baseNumber) {
  if (!baseNumber || typeof baseNumber !== 'string') return null;
  const ch = baseNumber.trim().toUpperCase()[0];
  switch (ch) {
    case 'B': return 'Bronx';
    case 'K': return 'Brooklyn';
    case 'M': return 'Manhattan';
    case 'Q': return 'Queens';
    case 'R': return 'Staten Island';
    default: return null;
  }
}

function inferBoroughFromAddress(addr) {
  if (!addr || typeof addr !== 'string') return null;
  const s = addr.toLowerCase();
  if (s.includes('bronx')) return 'Bronx';
  if (s.includes('brooklyn')) return 'Brooklyn';
  if (s.includes('new york') || s.includes('manhattan')) return 'Manhattan';
  if (s.includes('queens')) return 'Queens';
  if (s.includes('staten island')) return 'Staten Island';
  return null;
}

// ✅ NEW: try to guess from base name keywords
function inferBoroughFromBaseName(name) {
  if (!name || typeof name !== 'string') return null;
  const s = name.toLowerCase();
  if (s.includes('bronx')) return 'Bronx';
  if (s.includes('brooklyn')) return 'Brooklyn';
  if (s.includes('manhattan') || s.includes('nyc')) return 'Manhattan';
  if (s.includes('queens')) return 'Queens';
  if (s.includes('staten island')) return 'Staten Island';
  return null;
}

async function upsertDrivers(records) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const text = `INSERT INTO drivers (license_number, driver_name, borough, active, base_name, base_number, dataset_last_updated, updated_at, raw)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), $8)
      ON CONFLICT (license_number)
      DO UPDATE SET driver_name = EXCLUDED.driver_name, borough = EXCLUDED.borough, active = EXCLUDED.active,
        base_name = EXCLUDED.base_name, base_number = EXCLUDED.base_number, dataset_last_updated = EXCLUDED.dataset_last_updated, updated_at = NOW(), raw = EXCLUDED.raw`;

    for (const rec of records) {
      const m = mapRecord(rec);
      if (!m.license) continue;
      await client.query(text, [
        m.license,
        m.name,
        m.borough,
        m.active,
        m.base_name,
        m.base_number,
        m.dataset_last_updated ? new Date(m.dataset_last_updated) : null,
        rec,
      ]);
    }

    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

async function runSync() {
  try {
    await initDb();
  } catch (_) {}
  const headers = {};
  if (process.env.SOCRATA_APP_TOKEN) headers['X-App-Token'] = process.env.SOCRATA_APP_TOKEN;
  const url = `${DATA_URL}?$limit=50000`;
  const data = await fetchJson(url, headers);
  await upsertDrivers(data);
}

module.exports = { runSync, upsertDrivers, mapRecord };

if (require.main === module) {
  runSync()
    .then(() => {
      console.log('✅ Data fetch & store completed.');
      process.exit(0);
    })
    .catch(err => {
      console.error('❌ Error during fetch/store:', err);
      process.exit(1);
    });
}

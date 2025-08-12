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
  // Best-effort mapping without relying on exact field names; many NYC Open Data fields are lower_snake_case strings
  // Fallbacks keep the pipeline resilient if fields differ slightly
  const license = rec.license_number || rec.licenseno || rec.license || rec.driver_license_number || null;
  const name = rec.driver_name || rec.name || rec.licensee_name || null;
  const borough = rec.borough || rec.county || rec.base_borough || null;
  const active = rec.active === true || String(rec.active).toLowerCase() === 'true' || rec.active_status === 'Active' || true;
  const base_name = rec.base_name || rec.affiliated_base_name || null;
  const base_number = rec.base_number || rec.affiliated_base_number || null;
  const dataset_last_updated = rec.dataset_last_updated || rec.last_updated || null;
  return { license, name, borough, active, base_name, base_number, dataset_last_updated };
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
      if (!m.license) continue; // skip rows without a license_number key
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
  // Ensure schema exists before upsert (important for local runs without starting server)
  try {
    await initDb();
  } catch (_) {
    // ignore if already initialized
  }
  const headers = {};
  if (process.env.SOCRATA_APP_TOKEN) headers['X-App-Token'] = process.env.SOCRATA_APP_TOKEN;

  // Pull in pages if dataset is large; start with a single fetch first
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

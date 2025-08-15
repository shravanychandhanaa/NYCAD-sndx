require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const { pool, initDb } = require('./setup/db');
const driversRouter = require('./setup/routes/drivers');
const statsRouter = require('./setup/routes/stats');
const { runSync } = require('./setup/services/fetchAndStore');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/drivers', driversRouter);
app.use('/stats', statsRouter);

// Lightweight proxy to preview raw source fields from NYC Open Data
// Useful when borough data is unavailable in the dataset
app.get('/source/sample', async (req, res) => {
  try {
    const https = require('https');
    const url = new URL('https://data.cityofnewyork.us/resource/xjfq-wh2d.json');
    const limit = parseInt(req.query.limit, 10) || 10;
    url.searchParams.set('$limit', String(Math.max(1, Math.min(limit, 50))));

    const headers = {};
    if (process.env.SOCRATA_APP_TOKEN) {
      headers['X-App-Token'] = process.env.SOCRATA_APP_TOKEN;
    }

    const requestOptions = { method: 'GET', headers };
    const fetchJson = (u) => new Promise((resolve, reject) => {
      const r = https.request(u, requestOptions, (resp) => {
        let data = '';
        resp.on('data', (chunk) => (data += chunk));
        resp.on('end', () => {
          try {
            resolve(JSON.parse(data || '[]'));
          } catch (e) {
            reject(e);
          }
        });
      });
      r.on('error', reject);
      r.end();
    });

    const raw = await fetchJson(url);
    // Project to a concise subset of fields to keep payload small
    const projected = raw.map((r) => ({
      license_number: r.license_number || r.licenseno || r.license || null,
      name: r.name || r.driver_name || r.licensee_name || null,
      type: r.type || null,
      expiration_date: r.expiration_date || null,
      last_date_updated: r.last_date_updated || r.dataset_last_updated || r.last_updated || null,
      last_time_updated: r.last_time_updated || null,
    }));

    res.json({ sample: projected });
  } catch (err) {
    console.error('Error fetching source sample', err);
    res.status(500).json({ error: 'Failed to fetch source sample' });
  }
});

const PORT = process.env.PORT || 4000;

(async () => {
  try {
    await initDb();

    // Schedule daily sync
    const schedule = process.env.CRON_SCHEDULE || '0 3 * * *';
    cron.schedule(schedule, async () => {
      try {
        console.log(`[cron] Starting daily sync at ${new Date().toISOString()}`);
        await runSync();
        console.log('[cron] Sync completed');
      } catch (err) {
        console.error('[cron] Sync failed', err);
      }
    });

    // Allow manual sync via CLI flag --once
    if (process.argv.includes('--once')) {
      await runSync();
      process.exit(0);
    }

    app.listen(PORT, () => console.log(`Backend listening on :${PORT}`));
  } catch (err) {
    console.error('Failed to start server', err);
    process.exit(1);
  }
})();

module.exports = { app, pool };

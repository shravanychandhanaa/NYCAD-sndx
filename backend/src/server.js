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

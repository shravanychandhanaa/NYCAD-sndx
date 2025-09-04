/**
 * Simple script to populate/update the `driver_trends` row for today.
 * Usage:
 *   node src/updateTrends.js
 *
 * It reads DB connection from env vars (defaults chosen to match your docker-compose).
 */

const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.POSTGRES_HOST || process.env.POSTGRES || process.env.DB_HOST || 'postgres',
  user: process.env.POSTGRES_USER || process.env.DB_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || process.env.DB_PASSWORD || 'postgres',
  database: process.env.POSTGRES_DB || process.env.DB_NAME || 'fhv',
  port: parseInt(process.env.POSTGRES_PORT || process.env.DB_PORT || '5432', 10),
  // you can add ssl / other options if needed
});

async function updateTrends() {
  const client = await pool.connect();
  try {
    const query = `
      INSERT INTO driver_trends (date, total_drivers, by_borough)
      VALUES (
        CURRENT_DATE,
        (SELECT COUNT(*) FROM drivers),
        COALESCE(
          (SELECT jsonb_object_agg(borough, count)
           FROM (
             SELECT borough, COUNT(*) as count
             FROM drivers
             WHERE borough IS NOT NULL
             GROUP BY borough
           ) t),
          '{}'::jsonb
        )
      )
      ON CONFLICT (date) DO UPDATE
      SET total_drivers = EXCLUDED.total_drivers,
          by_borough = EXCLUDED.by_borough;
    `;
    await client.query(query);
    console.log('✅ driver_trends updated for', new Date().toISOString());
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  updateTrends().catch(err => {
    console.error('❌ updateTrends failed:', err);
    process.exit(1);
  });
}

module.exports = updateTrends;

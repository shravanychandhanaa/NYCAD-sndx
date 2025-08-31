require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });
const { pool, initDb } = require('../db');
const moment = require('moment');

async function populateTrendData() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get current total drivers and borough distribution
    const totalResult = await client.query('SELECT COUNT(*)::int AS total FROM drivers WHERE active = TRUE');
    const boroughResult = await client.query(`
      SELECT 
        COALESCE(borough, 'Unknown') as borough,
        COUNT(*)::int as count
      FROM drivers
      WHERE active = TRUE
      GROUP BY borough
      ORDER BY borough
    `);

    const totalDrivers = totalResult.rows[0]?.total || 0;
    const byBorough = boroughResult.rows || [];

    // Generate trend data for last 30 days with slight variations
    for (let i = 30; i >= 0; i--) {
      const date = moment().subtract(i, 'days').format('YYYY-MM-DD');
      
      // Add some random variation to make the trend interesting
      const variance = Math.floor(Math.random() * 1000) - 500; // Random number between -500 and 500
      const dayTotal = Math.max(0, totalDrivers + variance);
      
      // Also vary borough distribution slightly
      const dayBorough = byBorough.map(b => ({
        ...b,
        count: Math.max(0, b.count + Math.floor(Math.random() * 100) - 50)
      }));

      await client.query(
        'INSERT INTO driver_trends (date, total_drivers, by_borough) VALUES ($1, $2, $3::jsonb) ON CONFLICT (date) DO UPDATE SET total_drivers = EXCLUDED.total_drivers, by_borough = EXCLUDED.by_borough',
        [date, dayTotal, JSON.stringify(dayBorough)]
      );
    }

    await client.query('COMMIT');
    console.log('✅ Successfully populated trend data');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error populating trend data:', error);
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  initDb()
    .then(populateTrendData)
    .then(() => {
      console.log('✅ Trend data population completed');
      process.exit(0);
    })
    .catch(err => {
      console.error('❌ Error during trend data population:', err);
      process.exit(1);
    });
}

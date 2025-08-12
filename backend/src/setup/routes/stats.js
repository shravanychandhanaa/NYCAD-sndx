const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// GET /stats — total active drivers, count by borough, last updated date
router.get('/', async (_req, res) => {
  try {
    const totalQ = pool.query('SELECT COUNT(*)::int AS total FROM drivers WHERE active = TRUE');
    const boroughQ = pool.query(`
      SELECT COALESCE(borough, 'Unknown') AS borough, COUNT(*)::int AS count
      FROM drivers
      WHERE active = TRUE
      GROUP BY COALESCE(borough, 'Unknown')
      ORDER BY borough
    `);
    
    const updatedQ = pool.query(
      "SELECT MAX(updated_at) AS updated_at, MAX(dataset_last_updated) AS dataset_last_updated FROM drivers"
    );

    const [totalRes, boroughRes, updatedRes] = await Promise.all([totalQ, boroughQ, updatedQ]);

    res.json({
      totalActiveDrivers: totalRes.rows[0].total || 0,
      byBorough: boroughRes.rows,
      lastUpdated: updatedRes.rows[0].dataset_last_updated || updatedRes.rows[0].updated_at,
    });
  } catch (err) {
    console.error('Error fetching stats', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

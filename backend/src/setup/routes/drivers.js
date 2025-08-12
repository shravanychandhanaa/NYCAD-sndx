const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { query, validationResult } = require('express-validator');

// GET /drivers?borough=Queens&search=smith&page=1&limit=25
router.get(
  '/',
  [
    query('borough').optional().isString().trim().isLength({ min: 1, max: 50 }),
    query('search').optional().isString().trim().isLength({ min: 1, max: 100 }),
    query('page').optional().toInt().isInt({ min: 1 }),
    query('limit').optional().toInt().isInt({ min: 1, max: 200 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { borough, search } = req.query;
    const page = req.query.page || 1;
    const limit = req.query.limit || 25;
    const offset = (page - 1) * limit;

    const values = [];
    const wheres = [];

    if (borough) {
      values.push(borough);
      wheres.push(`borough = $${values.length}`);
    }
    if (search) {
      values.push(`%${search.toLowerCase()}%`);
      wheres.push(`LOWER(driver_name) LIKE $${values.length}`);
    }

    const whereSql = wheres.length ? `WHERE ${wheres.join(' AND ')}` : '';

    try {
      const listSql = `SELECT license_number, driver_name, borough, active, base_name, base_number, dataset_last_updated FROM drivers ${whereSql} ORDER BY driver_name ASC LIMIT ${limit} OFFSET ${offset}`;
      const countSql = `SELECT COUNT(*) FROM drivers ${whereSql}`;

      const [listRes, countRes] = await Promise.all([
        pool.query(listSql, values),
        pool.query(countSql, values),
      ]);

      return res.json({
        data: listRes.rows,
        page,
        limit,
        total: parseInt(countRes.rows[0].count, 10),
      });
    } catch (err) {
      console.error('Error fetching drivers', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// GET /drivers/:license
router.get('/:license', async (req, res) => {
  const { license } = req.params;
  if (!license || String(license).length > 50) {
    return res.status(400).json({ error: 'Invalid license' });
  }
  try {
    const { rows } = await pool.query(
      'SELECT * FROM drivers WHERE license_number = $1',
      [license]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    return res.json(rows[0]);
  } catch (err) {
    console.error('Error fetching driver', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

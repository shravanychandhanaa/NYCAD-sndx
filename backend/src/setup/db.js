const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
});

async function initDb() {
  const client = await pool.connect();
  try {
    const initSqlPath = path.join(__dirname, 'init.sql');
    const sql = fs.readFileSync(initSqlPath, 'utf8');
    await client.query(sql);
  } finally {
    client.release();
  }
}

module.exports = { pool, initDb };

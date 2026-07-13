require('dotenv').config();
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;

// Render (and most managed PostgreSQL providers) require SSL.
// For the local docker-compose database SSL is disabled.
const useSSL =
  process.env.PGSSL === 'true' || /render\.com/.test(connectionString || '');

const pool = new Pool({
  connectionString,
  ssl: useSSL ? { rejectUnauthorized: false } : false,
});

const initDb = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      first_name VARCHAR(100) NOT NULL,
      last_name  VARCHAR(100) NOT NULL,
      city       VARCHAR(100),
      address    VARCHAR(200),
      profession VARCHAR(100),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
};

module.exports = { pool, initDb };

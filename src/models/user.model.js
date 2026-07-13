const { pool } = require('../config/db');

const findAll = async () => {
  const { rows } = await pool.query('SELECT * FROM users ORDER BY id');
  return rows;
};

const findById = async (id) => {
  const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  return rows[0] || null;
};

const create = async ({ first_name, last_name, city, address, profession }) => {
  const { rows } = await pool.query(
    `INSERT INTO users (first_name, last_name, city, address, profession)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [first_name, last_name, city, address, profession]
  );
  return rows[0];
};

const update = async (id, { first_name, last_name, city, address, profession }) => {
  const { rows } = await pool.query(
    `UPDATE users
     SET first_name = COALESCE($1, first_name),
         last_name  = COALESCE($2, last_name),
         city       = COALESCE($3, city),
         address    = COALESCE($4, address),
         profession = COALESCE($5, profession)
     WHERE id = $6
     RETURNING *`,
    [first_name, last_name, city, address, profession, id]
  );
  return rows[0] || null;
};

const remove = async (id) => {
  const { rowCount } = await pool.query('DELETE FROM users WHERE id = $1', [id]);
  return rowCount > 0;
};

module.exports = { findAll, findById, create, update, remove };

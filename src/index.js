require('dotenv').config();
const app = require('./app');
const { initDb } = require('./config/db');

const PORT = process.env.PORT || 3000;

const start = async () => {
  try {
    await initDb();
    console.log('Database ready: table "users" verified');
  } catch (err) {
    console.error('Could not initialize database:', err);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
    console.log(`Swagger docs available at /api-docs`);
  });
};

start();

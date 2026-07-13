const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./docs/swagger');
const userRoutes = require('./routes/user.routes');
const { pool } = require('./config/db');

const app = express();

app.use(express.json());

app.use('/api/users', userRoutes);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @openapi
 * /health:
 *   get:
 *     summary: Comprueba el estado del servicio y la conexión a la base de datos
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Servicio y base de datos operativos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 database:
 *                   type: string
 *                   example: connected
 *       503:
 *         description: Sin conexión a la base de datos
 */
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({ status: 'ok', database: 'connected' });
  } catch (err) {
    res.status(503).json({ status: 'error', database: 'disconnected' });
  }
});

app.get('/', (req, res) => {
  res.json({
    message: 'Users API',
    docs: '/api-docs',
    health: '/health',
  });
});

module.exports = app;

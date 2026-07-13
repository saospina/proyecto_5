const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Users API',
      version: '1.0.0',
      description:
        'API REST de gestión de usuarios (CRUD) con Node.js, Express y PostgreSQL. ' +
        'Proyecto 5 — Despliegue en Azure Container Apps con CI/CD.',
    },
    servers: [
      { url: 'http://localhost:3000', description: 'Local' },
    ],
  },
  apis: ['./src/routes/*.js', './src/app.js'],
};

module.exports = swaggerJsdoc(options);

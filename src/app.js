const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./docs/swagger');
const apiRoutes = require('./routes');
const notFoundHandler = require('./middlewares/notFound.middleware');
const errorHandler = require('./middlewares/error.middleware');

const app = express();

// 1. Security HTTP Headers
// Note: contentSecurityPolicy is disabled to allow Swagger UI inline styles and scripts to load cleanly
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);

// 2. Cross-Origin Resource Sharing (CORS)
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// 3. Body Parsers with payload size limits to mitigate DoS attacks
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// 4. Swagger Interactive API Documentation UI
app.use(
  '/api/docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument, {
    customSiteTitle: 'Task Management API Documentation',
    customCss: '.swagger-ui .topbar { display: none }', // Cleaner UI without top bar
  })
);

// Convenience redirect from /docs to /api/docs
app.get('/docs', (req, res) => res.redirect('/api/docs'));

// 5. Welcome / Root route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to the Task Management REST API',
    version: '1.0.0',
    documentation: '/api/docs',
  });
});

// 6. Mount API Routes
app.use('/api', apiRoutes);

// 7. Handle Undefined Routes (404)
app.use(notFoundHandler);

// 8. Global Centralized Error Handler
app.use(errorHandler);

module.exports = app;

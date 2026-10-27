const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const apiRoutes = require('./routes');
const notFoundHandler = require('./middlewares/notFound.middleware');
const errorHandler = require('./middlewares/error.middleware');

const app = express();

// 1. Security HTTP Headers
app.use(helmet());

// 2. Cross-Origin Resource Sharing (CORS)
app.use(
  cors({
    origin: '*', // Configure specific origins in production as needed
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// 3. Body Parsers with payload size limits to mitigate DoS attacks
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// 4. Welcome / Root route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to the Task Management REST API',
    version: '1.0.0',
    documentation: '/api/health',
  });
});

// 5. Mount API Routes
app.use('/api', apiRoutes);

// 6. Handle Undefined Routes (404)
app.use(notFoundHandler);

// 7. Global Centralized Error Handler
app.use(errorHandler);

module.exports = app;

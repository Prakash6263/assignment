const express = require('express');
const authRoutes = require('./auth.routes');
const taskRoutes = require('./task.routes');
const ApiResponse = require('../utils/apiResponse');
const HTTP_STATUS = require('../constants/httpStatusCodes');

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  return ApiResponse.success(res, HTTP_STATUS.OK, 'API service is operational and healthy', {
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Domain routes
router.use('/auth', authRoutes);
router.use('/tasks', taskRoutes);

module.exports = router;

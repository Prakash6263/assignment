const express = require('express');
const authController = require('../controllers/auth.controller');
const {
  validateRegister,
  validateLogin,
  validateRefreshToken,
} = require('../validators/auth.validator');
const { authenticate } = require('../middlewares/auth.middleware');
const { loginRateLimiter } = require('../middlewares/rateLimiter.middleware');

const router = express.Router();

// Public routes
router.post('/register', validateRegister, authController.register);
router.post('/login', loginRateLimiter, validateLogin, authController.login);
router.post('/refresh-token', validateRefreshToken, authController.refreshToken);

// Protected routes
router.get('/me', authenticate, authController.getProfile);
router.post('/logout', authenticate, authController.logout);

module.exports = router;

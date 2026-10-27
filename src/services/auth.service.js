const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const AppError = require('../utils/AppError');
const HTTP_STATUS = require('../constants/httpStatusCodes');
const envConfig = require('../config/env.config');

/**
 * Generate Access Token (short-lived)
 * @param {string} userId
 * @param {string} role
 * @returns {string} JWT Token
 */
const generateAccessToken = (userId, role) => {
  return jwt.sign({ id: userId, role }, envConfig.JWT_SECRET, {
    expiresIn: envConfig.JWT_EXPIRES_IN,
  });
};

/**
 * Generate Refresh Token (long-lived)
 * @param {string} userId
 * @returns {string} JWT Refresh Token
 */
const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, envConfig.JWT_REFRESH_SECRET, {
    expiresIn: envConfig.JWT_REFRESH_EXPIRES_IN,
  });
};

/**
 * Register a new user
 * @param {Object} userData - { name, email, password, role }
 * @returns {Promise<{ user: Object, accessToken: string, refreshToken: string }>}
 */
const registerUser = async ({ name, email, password, role }) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError(
      'An account with this email already exists. Please login or use a different email.',
      HTTP_STATUS.CONFLICT,
      [{ field: 'email', message: 'Email is already registered' }]
    );
  }

  // Create user
  const newUser = await User.create({
    name,
    email,
    password,
    role: role || undefined, // defaults to 'USER' in schema
  });

  const accessToken = generateAccessToken(newUser._id, newUser.role);
  const refreshToken = generateRefreshToken(newUser._id);

  // Store refresh token
  newUser.refreshToken = refreshToken;
  await newUser.save({ validateBeforeSave: false });

  return {
    user: newUser,
    accessToken,
    refreshToken,
  };
};

/**
 * Authenticate existing user and issue access & refresh tokens
 * @param {Object} credentials - { email, password }
 * @returns {Promise<{ user: Object, accessToken: string, refreshToken: string }>}
 */
const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    throw new AppError(
      'Invalid email or password credentials.',
      HTTP_STATUS.UNAUTHORIZED
    );
  }

  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);

  // Update stored refresh token
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  return {
    user,
    accessToken,
    refreshToken,
  };
};

/**
 * Refresh access token using a valid refresh token
 * @param {string} refreshToken
 * @returns {Promise<{ accessToken: string, refreshToken: string }>}
 */
const refreshAccessToken = async (refreshToken) => {
  if (!refreshToken) {
    throw new AppError('Refresh token is required.', HTTP_STATUS.BAD_REQUEST);
  }

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, envConfig.JWT_REFRESH_SECRET);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new AppError('Refresh token has expired. Please log in again.', HTTP_STATUS.UNAUTHORIZED);
    }
    throw new AppError('Invalid refresh token.', HTTP_STATUS.UNAUTHORIZED);
  }

  const user = await User.findById(decoded.id).select('+refreshToken');
  if (!user || user.refreshToken !== refreshToken) {
    throw new AppError('Invalid or revoked refresh token. Please log in again.', HTTP_STATUS.UNAUTHORIZED);
  }

  // Issue new tokens (Token Rotation)
  const newAccessToken = generateAccessToken(user._id, user.role);
  const newRefreshToken = generateRefreshToken(user._id);

  user.refreshToken = newRefreshToken;
  await user.save({ validateBeforeSave: false });

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};

/**
 * Invalidate user refresh token on logout
 * @param {string} userId
 */
const logoutUser = async (userId) => {
  await User.findByIdAndUpdate(userId, { refreshToken: null });
};

/**
 * Retrieve authenticated user profile
 * @param {string} userId
 * @returns {Promise<Object>}
 */
const getUserProfile = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError('User profile not found.', HTTP_STATUS.NOT_FOUND);
  }

  return user;
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  getUserProfile,
};

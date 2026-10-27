const authService = require('../services/auth.service');
const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/apiResponse');
const HTTP_STATUS = require('../constants/httpStatusCodes');

/**
 * Register a new user
 * POST /api/auth/register
 */
const register = catchAsync(async (req, res) => {
  const { name, email, password, role } = req.body;
  const result = await authService.registerUser({ name, email, password, role });

  return ApiResponse.success(
    res,
    HTTP_STATUS.CREATED,
    'User registered successfully.',
    {
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      token: result.accessToken, // Backwards compatible alias
    }
  );
});

/**
 * Login user and issue tokens
 * POST /api/auth/login
 */
const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.loginUser({ email, password });

  return ApiResponse.success(
    res,
    HTTP_STATUS.OK,
    'Login successful.',
    {
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      token: result.accessToken, // Backwards compatible alias
    }
  );
});

/**
 * Refresh access token using refresh token
 * POST /api/auth/refresh-token
 */
const refreshToken = catchAsync(async (req, res) => {
  const { refreshToken } = req.body;
  const tokens = await authService.refreshAccessToken(refreshToken);

  return ApiResponse.success(
    res,
    HTTP_STATUS.OK,
    'Access token refreshed successfully.',
    tokens
  );
});

/**
 * Logout user by clearing refresh token
 * POST /api/auth/logout
 */
const logout = catchAsync(async (req, res) => {
  await authService.logoutUser(req.user._id);

  return ApiResponse.success(
    res,
    HTTP_STATUS.OK,
    'Logged out successfully.'
  );
});

/**
 * Get current authenticated user profile
 * GET /api/auth/me
 */
const getProfile = catchAsync(async (req, res) => {
  const profile = await authService.getUserProfile(req.user._id);

  return ApiResponse.success(
    res,
    HTTP_STATUS.OK,
    'User profile retrieved successfully.',
    { user: profile }
  );
});

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  getProfile,
};

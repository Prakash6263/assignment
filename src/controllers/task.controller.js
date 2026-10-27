const taskService = require('../services/task.service');
const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/apiResponse');
const HTTP_STATUS = require('../constants/httpStatusCodes');

/**
 * Create a new task
 * POST /api/tasks
 */
const createTask = catchAsync(async (req, res) => {
  const task = await taskService.createTask(req.user._id, req.body);

  return ApiResponse.success(
    res,
    HTTP_STATUS.CREATED,
    'Task created successfully',
    task
  );
});

/**
 * Get all tasks for the logged in user
 * GET /api/tasks
 */
const getTasks = catchAsync(async (req, res) => {
  const { tasks, meta } = await taskService.getTasks(req.user._id, req.query);

  return ApiResponse.success(
    res,
    HTTP_STATUS.OK,
    'Tasks retrieved successfully',
    tasks,
    meta
  );
});

/**
 * Get a specific task by ID
 * GET /api/tasks/:id
 */
const getTaskById = catchAsync(async (req, res) => {
  const task = await taskService.getTaskById(req.user._id, req.params.id);

  return ApiResponse.success(
    res,
    HTTP_STATUS.OK,
    'Task retrieved successfully',
    task
  );
});

/**
 * Update an existing task
 * PUT/PATCH /api/tasks/:id
 */
const updateTask = catchAsync(async (req, res) => {
  const updatedTask = await taskService.updateTask(
    req.user._id,
    req.params.id,
    req.body
  );

  return ApiResponse.success(
    res,
    HTTP_STATUS.OK,
    'Task updated successfully',
    updatedTask
  );
});

/**
 * Delete a task
 * DELETE /api/tasks/:id
 */
const deleteTask = catchAsync(async (req, res) => {
  const deletedTask = await taskService.deleteTask(req.user._id, req.params.id);

  return ApiResponse.success(
    res,
    HTTP_STATUS.OK,
    'Task deleted successfully',
    { id: deletedTask.id || deletedTask._id }
  );
});

/**
 * Admin only: View all tasks across all users
 * GET /api/tasks/admin/all
 */
const getAllTasksAdmin = catchAsync(async (req, res) => {
  const { tasks, meta } = await taskService.getAllTasksAdmin(req.query);

  return ApiResponse.success(
    res,
    HTTP_STATUS.OK,
    'All system tasks retrieved successfully (Admin)',
    tasks,
    meta
  );
});

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  getAllTasksAdmin,
};

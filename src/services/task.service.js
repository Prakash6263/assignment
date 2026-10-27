const Task = require('../models/task.model');
const AppError = require('../utils/AppError');
const HTTP_STATUS = require('../constants/httpStatusCodes');

const ALLOWED_SORT_FIELDS = ['createdAt', 'dueDate', 'title', 'priority', 'status'];

/**
 * Create a new task belonging to the authenticated user
 * @param {string} userId - Authenticated user ID
 * @param {Object} taskData - { title, description, priority, status, dueDate }
 * @returns {Promise<Object>}
 */
const createTask = async (userId, taskData) => {
  const task = await Task.create({
    ...taskData,
    user: userId,
  });

  return task;
};

/**
 * List tasks for the authenticated user with pagination, search, status filtering, and sorting
 * @param {string} userId - Authenticated user ID
 * @param {Object} queryOptions - { page, limit, status, priority, search, sortBy, sort, order }
 * @returns {Promise<{ tasks: Array, meta: Object }>}
 */
const getTasks = async (userId, queryOptions) => {
  const page = Math.max(1, parseInt(queryOptions.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(queryOptions.limit, 10) || 10));
  const skip = (page - 1) * limit;

  // Strict user isolation: query filter ALWAYS includes the user's ID
  const filter = { user: userId };

  // Status filter
  if (queryOptions.status) {
    filter.status = queryOptions.status;
  }

  // Priority filter
  if (queryOptions.priority) {
    filter.priority = queryOptions.priority;
  }

  // Search keyword filter across title and description
  if (queryOptions.search && queryOptions.search.trim()) {
    const searchRegex = new RegExp(queryOptions.search.trim(), 'i');
    filter.$or = [{ title: searchRegex }, { description: searchRegex }];
  }

  // Flexible Sorting by createdAt, dueDate, etc.
  let sort = { createdAt: -1 };

  if (queryOptions.sortBy) {
    const [field, direction] = queryOptions.sortBy.split(':');
    if (ALLOWED_SORT_FIELDS.includes(field)) {
      sort = { [field]: direction === 'asc' ? 1 : -1 };
    }
  } else if (queryOptions.sort && ALLOWED_SORT_FIELDS.includes(queryOptions.sort)) {
    const direction = queryOptions.order === 'asc' ? 1 : -1;
    sort = { [queryOptions.sort]: direction };
  }

  const [tasks, total] = await Promise.all([
    Task.find(filter).sort(sort).skip(skip).limit(limit),
    Task.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / limit);

  const meta = {
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
    sortBy: Object.keys(sort)[0],
    sortOrder: Object.values(sort)[0] === 1 ? 'asc' : 'desc',
  };

  return { tasks, meta };
};

/**
 * Get single task by ID ensuring it belongs to the authenticated user
 * @param {string} userId - Authenticated user ID
 * @param {string} taskId - Task ObjectId
 * @returns {Promise<Object>}
 */
const getTaskById = async (userId, taskId) => {
  const task = await Task.findOne({ _id: taskId, user: userId });

  if (!task) {
    throw new AppError(
      'Task not found or you do not have permission to access it.',
      HTTP_STATUS.NOT_FOUND
    );
  }

  return task;
};

/**
 * Update task ensuring it belongs to the authenticated user
 * @param {string} userId - Authenticated user ID
 * @param {string} taskId - Task ObjectId
 * @param {Object} updateData - Allowed fields to update
 * @returns {Promise<Object>}
 */
const updateTask = async (userId, taskId, updateData) => {
  delete updateData.user;
  delete updateData._id;

  const updatedTask = await Task.findOneAndUpdate(
    { _id: taskId, user: userId },
    { $set: updateData },
    { new: true, runValidators: true }
  );

  if (!updatedTask) {
    throw new AppError(
      'Task not found or you do not have permission to modify it.',
      HTTP_STATUS.NOT_FOUND
    );
  }

  return updatedTask;
};

/**
 * Delete task ensuring it belongs to the authenticated user
 * @param {string} userId - Authenticated user ID
 * @param {string} taskId - Task ObjectId
 * @returns {Promise<Object>}
 */
const deleteTask = async (userId, taskId) => {
  const deletedTask = await Task.findOneAndDelete({ _id: taskId, user: userId });

  if (!deletedTask) {
    throw new AppError(
      'Task not found or you do not have permission to delete it.',
      HTTP_STATUS.NOT_FOUND
    );
  }

  return deletedTask;
};

/**
 * Admin: List all tasks in the system across all users
 * @param {Object} queryOptions
 * @returns {Promise<{ tasks: Array, meta: Object }>}
 */
const getAllTasksAdmin = async (queryOptions) => {
  const page = Math.max(1, parseInt(queryOptions.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(queryOptions.limit, 10) || 10));
  const skip = (page - 1) * limit;

  const filter = {};
  if (queryOptions.status) filter.status = queryOptions.status;
  if (queryOptions.priority) filter.priority = queryOptions.priority;

  let sort = { createdAt: -1 };
  if (queryOptions.sortBy) {
    const [field, direction] = queryOptions.sortBy.split(':');
    if (ALLOWED_SORT_FIELDS.includes(field)) {
      sort = { [field]: direction === 'asc' ? 1 : -1 };
    }
  }

  const [tasks, total] = await Promise.all([
    Task.find(filter)
      .populate('user', 'name email role')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Task.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    tasks,
    meta: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  getAllTasksAdmin,
};

const express = require('express');
const taskController = require('../controllers/task.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const { ROLES } = require('../constants/roles');
const {
  validateTaskId,
  validateCreateTask,
  validateUpdateTask,
  validateTaskQuery,
} = require('../validators/task.validator');

const router = express.Router();

// Enforce authentication on all task endpoints
router.use(authenticate);

// Admin-only route: view all system tasks across all users
router.get(
  '/admin/all',
  authorize(ROLES.ADMIN),
  validateTaskQuery,
  taskController.getAllTasksAdmin
);

// Task collection endpoints (authenticated user's own tasks)
router
  .route('/')
  .post(validateCreateTask, taskController.createTask)
  .get(validateTaskQuery, taskController.getTasks);

// Individual task resource endpoints
router
  .route('/:id')
  .get(validateTaskId, taskController.getTaskById)
  .put(validateTaskId, validateUpdateTask, taskController.updateTask)
  .patch(validateTaskId, validateUpdateTask, taskController.updateTask)
  .delete(validateTaskId, taskController.deleteTask);

module.exports = router;

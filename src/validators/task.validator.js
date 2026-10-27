const { z } = require('zod');
const validate = require('../middlewares/validate.middleware');
const { TASK_STATUS_VALUES, TASK_PRIORITY_VALUES } = require('../constants/taskConstants');

const ALLOWED_SORT_FIELDS = ['createdAt', 'dueDate', 'title', 'priority', 'status'];

// MongoDB ObjectId Regex (24-hex characters)
const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

/**
 * Zod Schema for Task ID Param
 */
const taskIdParamSchema = z.object({
  id: z
    .string({ required_error: 'Task ID is required' })
    .regex(
      OBJECT_ID_REGEX,
      'Invalid task ID format. Must be a valid 24-character hexadecimal MongoDB ObjectId.'
    ),
});

/**
 * Zod Schema for Creating a Task
 */
const createTaskSchema = z
  .object({
    title: z
      .string({ required_error: 'Task title is required' })
      .trim()
      .min(1, 'Task title cannot be empty')
      .max(150, 'Task title cannot exceed 150 characters'),
    description: z
      .string()
      .trim()
      .max(1000, 'Description cannot exceed 1000 characters')
      .optional(),
    priority: z
      .enum(TASK_PRIORITY_VALUES, {
        errorMap: () => ({ message: `Priority must be one of: ${TASK_PRIORITY_VALUES.join(', ')}` }),
      })
      .optional(),
    status: z
      .enum(TASK_STATUS_VALUES, {
        errorMap: () => ({ message: `Status must be one of: ${TASK_STATUS_VALUES.join(', ')}` }),
      })
      .optional(),
    dueDate: z
      .string()
      .datetime({ message: 'dueDate must be a valid ISO Date string (e.g. 2026-11-01T00:00:00.000Z)' })
      .optional()
      .nullable(),
  })
  .strict({ message: 'Request contains disallowed fields.' });

/**
 * Zod Schema for Updating a Task (PUT / PATCH)
 */
const updateTaskSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, 'Task title cannot be empty')
      .max(150, 'Task title cannot exceed 150 characters')
      .optional(),
    description: z
      .string()
      .trim()
      .max(1000, 'Description cannot exceed 1000 characters')
      .optional(),
    priority: z
      .enum(TASK_PRIORITY_VALUES, {
        errorMap: () => ({ message: `Priority must be one of: ${TASK_PRIORITY_VALUES.join(', ')}` }),
      })
      .optional(),
    status: z
      .enum(TASK_STATUS_VALUES, {
        errorMap: () => ({ message: `Status must be one of: ${TASK_STATUS_VALUES.join(', ')}` }),
      })
      .optional(),
    dueDate: z
      .string()
      .datetime({ message: 'dueDate must be a valid ISO Date string' })
      .optional()
      .nullable(),
  })
  .strict({ message: 'Request contains disallowed fields. Ownership cannot be transferred.' })
  .refine(
    (data) => Object.keys(data).length > 0,
    'Request body cannot be empty. Provide at least one field to update.'
  );

/**
 * Zod Schema for Task Query Parameters
 */
const taskQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .refine((val) => !isNaN(val) && val >= 1, 'Page must be a positive integer >= 1'),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10))
    .refine((val) => !isNaN(val) && val >= 1 && val <= 100, 'Limit must be an integer between 1 and 100'),
  status: z
    .enum(TASK_STATUS_VALUES, {
      errorMap: () => ({ message: `Status must be one of: ${TASK_STATUS_VALUES.join(', ')}` }),
    })
    .optional(),
  priority: z
    .enum(TASK_PRIORITY_VALUES, {
      errorMap: () => ({ message: `Priority must be one of: ${TASK_PRIORITY_VALUES.join(', ')}` }),
    })
    .optional(),
  search: z.string().trim().optional(),
  sortBy: z
    .string()
    .optional()
    .refine((val) => {
      if (!val) return true;
      const [field, direction] = val.split(':');
      const validField = ALLOWED_SORT_FIELDS.includes(field);
      const validDirection = !direction || ['asc', 'desc'].includes(direction);
      return validField && validDirection;
    }, `Sort format must be <field>:<asc|desc> where field is one of: ${ALLOWED_SORT_FIELDS.join(', ')}`),
  sort: z
    .enum(ALLOWED_SORT_FIELDS, {
      errorMap: () => ({ message: `Sort field must be one of: ${ALLOWED_SORT_FIELDS.join(', ')}` }),
    })
    .optional(),
  order: z.enum(['asc', 'desc']).optional(),
});

module.exports = {
  createTaskSchema,
  updateTaskSchema,
  taskIdParamSchema,
  taskQuerySchema,
  validateCreateTask: validate(createTaskSchema, 'body'),
  validateUpdateTask: validate(updateTaskSchema, 'body'),
  validateTaskId: validate(taskIdParamSchema, 'params'),
  validateTaskQuery: validate(taskQuerySchema, 'query'),
};

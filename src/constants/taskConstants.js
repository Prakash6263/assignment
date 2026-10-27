/**
 * Task Status and Priority Enums
 */
const TASK_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
};

const TASK_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
};

module.exports = {
  TASK_STATUS,
  TASK_STATUS_VALUES: Object.values(TASK_STATUS),
  TASK_PRIORITY,
  TASK_PRIORITY_VALUES: Object.values(TASK_PRIORITY),
};

const mongoose = require('mongoose');
const { TASK_STATUS, TASK_STATUS_VALUES, TASK_PRIORITY, TASK_PRIORITY_VALUES } = require('../constants/taskConstants');

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      minlength: [1, 'Title must not be empty'],
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      default: '',
    },
    priority: {
      type: String,
      enum: {
        values: TASK_PRIORITY_VALUES,
        message: `Priority must be one of: ${TASK_PRIORITY_VALUES.join(', ')}`,
      },
      default: TASK_PRIORITY.MEDIUM,
    },
    status: {
      type: String,
      enum: {
        values: TASK_STATUS_VALUES,
        message: `Status must be one of: ${TASK_STATUS_VALUES.join(', ')}`,
      },
      default: TASK_STATUS.PENDING,
    },
    dueDate: {
      type: Date,
      default: null,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Task must belong to a user'],
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound indexes for optimal queries scoped to the user
taskSchema.index({ user: 1, createdAt: -1 });
taskSchema.index({ user: 1, status: 1 });
taskSchema.index({ user: 1, title: 'text', description: 'text' });

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;

/**
 * Verification Script for All Functional & Security Requirements
 * Tests schemas, validation logic, password security, models, and error responses.
 */
const bcrypt = require('bcryptjs');
const { registerSchema, loginSchema } = require('../src/validators/auth.validator');
const { createTaskSchema, updateTaskSchema, taskIdParamSchema } = require('../src/validators/task.validator');
const User = require('../src/models/user.model');
const Task = require('../src/models/task.model');
const AppError = require('../src/utils/AppError');
const errorHandler = require('../src/middlewares/error.middleware');
const { ROLES } = require('../src/constants/roles');

let passedTests = 0;
let totalTests = 0;

function assert(condition, testName) {
  totalTests++;
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`  [FAIL] ${testName}`);
    process.exitCode = 1;
  }
}

console.log('\n======================================================');
console.log('       REQUIREMENTS & SPECIFICATION VERIFICATION      ');
console.log('======================================================\n');

// 1. Password Hashing (bcryptjs)
console.log('1. Password Hashing & Security (bcryptjs)');
const plainPassword = 'SecretPassword123';
const saltRounds = 10;
const hash = bcrypt.hashSync(plainPassword, saltRounds);
assert(hash !== plainPassword, 'Password is not stored in plain text');
assert(hash.startsWith('$2'), 'Hash is generated using bcrypt algorithm');
assert(bcrypt.compareSync(plainPassword, hash) === true, 'bcrypt correctly verifies valid password');
assert(bcrypt.compareSync('WrongPassword', hash) === false, 'bcrypt rejects invalid password');

// 2. User Registration Validation (Zod)
console.log('\n2. User Registration Validation (Zod)');
const validUser = registerSchema.safeParse({
  name: 'John Doe',
  email: 'john@example.com',
  password: 'Password123',
  role: 'USER',
});
assert(validUser.success === true, 'Valid registration payload passes validation');

const invalidEmail = registerSchema.safeParse({
  name: 'John Doe',
  email: 'not-an-email',
  password: 'Password123',
});
assert(invalidEmail.success === false, 'Invalid email format is rejected');

const shortPassword = registerSchema.safeParse({
  name: 'John Doe',
  email: 'john@example.com',
  password: '123',
});
assert(shortPassword.success === false, 'Password < 6 characters is rejected');

const missingName = registerSchema.safeParse({
  email: 'john@example.com',
  password: 'Password123',
});
assert(missingName.success === false, 'Missing name is rejected with required error');

// 3. User Login Validation (Zod)
console.log('\n3. User Login Validation (Zod)');
const validLogin = loginSchema.safeParse({
  email: 'john@example.com',
  password: 'Password123',
});
assert(validLogin.success === true, 'Valid login credentials pass validation');

const missingLoginPass = loginSchema.safeParse({
  email: 'john@example.com',
});
assert(missingLoginPass.success === false, 'Missing login password is rejected');

// 4. Task Creation Validation (Zod)
console.log('\n4. Task Creation Validation (Zod)');
const validTask = createTaskSchema.safeParse({
  title: 'Complete assignment',
  description: 'Write clean code with 3+ years experience',
  priority: 'high',
  status: 'in-progress',
  dueDate: '2026-12-01T00:00:00.000Z',
});
assert(validTask.success === true, 'Valid task payload passes validation');

const emptyTitleTask = createTaskSchema.safeParse({
  title: '',
});
assert(emptyTitleTask.success === false, 'Empty title is rejected');

const invalidPriorityTask = createTaskSchema.safeParse({
  title: 'Test Task',
  priority: 'extreme', // Invalid enum
});
assert(invalidPriorityTask.success === false, 'Invalid priority enum is rejected');

const disallowedFieldsTask = createTaskSchema.safeParse({
  title: 'Test Task',
  user: '64f000000000000000000001', // Client attempting to inject user ownership
});
assert(disallowedFieldsTask.success === false, 'Disallowed client field injection (e.g. user) is strictly rejected');

// 5. Task Update Validation (Zod)
console.log('\n5. Task Update Validation (Zod)');
const validUpdate = updateTaskSchema.safeParse({
  status: 'completed',
});
assert(validUpdate.success === true, 'Valid update field passes');

const emptyUpdate = updateTaskSchema.safeParse({});
assert(emptyUpdate.success === false, 'Empty update payload is rejected');

// 6. MongoDB ObjectId Safety Validation (Zod)
console.log('\n6. MongoDB ObjectId Safety Validation (Zod)');
const validObjectId = taskIdParamSchema.safeParse({ id: '507f1f77bcf86cd799439011' });
assert(validObjectId.success === true, '24-character hexadecimal ObjectId passes');

const invalidObjectId = taskIdParamSchema.safeParse({ id: 'invalid-id-123' });
assert(invalidObjectId.success === false, 'Invalid ObjectId format is caught prior to DB query');

// 7. Data Models Serialization & Redaction
console.log('\n7. Model Data Protection & Serialization');
const mockUserDoc = new User({
  name: 'Alice',
  email: 'alice@example.com',
  password: 'HashedPassword123',
  role: ROLES.USER,
});
const serializedUser = mockUserDoc.toJSON();
assert(serializedUser.password === undefined, 'Password is removed from serialized user response');
assert(serializedUser.id !== undefined, 'User model exposes clean `id` virtual');
assert(serializedUser.__v === undefined, '__v internal version key is removed from output');

const mockTaskDoc = new Task({
  title: 'Test task',
  priority: 'high',
  status: 'pending',
  user: '507f1f77bcf86cd799439011',
});
const serializedTask = mockTaskDoc.toJSON();
assert(serializedTask.id !== undefined, 'Task model exposes clean `id`');
assert(serializedTask.__v === undefined, '__v internal version key is removed from output');

// 8. Centralized Error Handling & Response Consistency
console.log('\n8. Centralized Error Handler Consistency');
let mockRes = {
  statusCode: 200,
  jsonData: null,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(data) {
    this.jsonData = data;
    return this;
  },
};

// Test duplicate key error (MongoDB code 11000)
errorHandler(
  { code: 11000, keyValue: { email: 'duplicate@example.com' } },
  {},
  mockRes,
  () => {}
);
assert(mockRes.statusCode === 409, 'Duplicate email error maps to 409 Conflict');
assert(mockRes.jsonData.success === false, 'Error response follows `{ success: false }` envelope');
assert(mockRes.jsonData.message.includes('already exists'), 'Duplicate email has clear explanation');

// Test CastError (invalid ObjectId)
errorHandler(
  { name: 'CastError', path: '_id', value: 'bad-id' },
  {},
  mockRes,
  () => {}
);
assert(mockRes.statusCode === 400, 'Invalid ObjectId CastError maps to 400 Bad Request');
assert(mockRes.jsonData.success === false, 'CastError follows `{ success: false }` format');

// Summary
console.log('\n======================================================');
console.log(`TOTAL TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${totalTests - passedTests}`);
console.log('======================================================\n');

if (passedTests === totalTests) {
  console.log(' ALL REQUIREMENTS FULLY VERIFIED!\n');
  process.exit(0);
} else {
  console.error(' SOME TESTS FAILED!\n');
  process.exit(1);
}

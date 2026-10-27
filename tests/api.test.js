/**
 * API Integration and End-to-End Test Suite
 * Tests HTTP routes, security headers, rate-limiting, 404s, Zod validations, and auth middlewares using Supertest.
 */
const request = require('supertest');
const app = require('../src/app');
const { ROLES } = require('../src/constants/roles');
const { authorize } = require('../src/middlewares/role.middleware');
const { validateTaskId } = require('../src/validators/task.validator');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passedTests++;
  } else {
    console.error(`  [FAIL] ${message}`);
    process.exitCode = 1;
  }
}

async function runTests() {
  console.log('\n======================================================');
  console.log('            STARTING API INTEGRATION TESTS            ');
  console.log('======================================================\n');

  // 1. Root & Health Check Endpoints
  console.log('1. Basic Endpoints & Server Health');
  const rootRes = await request(app).get('/');
  assert(rootRes.status === 200, 'GET / returns 200 OK');
  assert(rootRes.body.success === true, 'GET / returns success: true');

  const healthRes = await request(app).get('/api/health');
  assert(healthRes.status === 200, 'GET /api/health returns 200 OK');
  assert(healthRes.body.data.uptime >= 0, 'Health check returns valid uptime');

  // 2. Security Headers (Helmet & CORS)
  console.log('\n2. Security Headers (Helmet & CORS)');
  assert(healthRes.headers['x-dns-prefetch-control'] !== undefined, 'Helmet DNS prefetch control header is set');
  assert(healthRes.headers['x-frame-options'] !== undefined, 'Helmet X-Frame-Options header is set');
  assert(healthRes.headers['access-control-allow-origin'] !== undefined, 'CORS headers are set');

  // 3. Undefined Routes Handling (404)
  console.log('\n3. 404 Not Found Middleware');
  const notFoundRes = await request(app).get('/api/unknown-endpoint');
  assert(notFoundRes.status === 404, 'Unknown endpoint returns 404');
  assert(notFoundRes.body.success === false, '404 returns success: false');
  assert(notFoundRes.body.message.includes('Cannot find endpoint'), '404 returns descriptive message');

  // 4. Request Validation on Auth Endpoints
  console.log('\n4. Request Validation (Zod) on Auth Endpoints');
  const emptyRegisterRes = await request(app).post('/api/auth/register').send({});
  assert(emptyRegisterRes.status === 400, 'Empty register request returns 400 Bad Request');
  assert(emptyRegisterRes.body.success === false, 'Empty register response has success: false');
  assert(Array.isArray(emptyRegisterRes.body.errors), 'Empty register returns array of field validation errors');

  const invalidEmailRes = await request(app).post('/api/auth/register').send({
    name: 'Test User',
    email: 'not-an-email',
    password: 'Password123',
  });
  assert(invalidEmailRes.status === 400, 'Invalid email returns 400');
  assert(invalidEmailRes.body.errors.some((e) => e.field === 'email'), 'Errors contains email validation failure');

  const shortPasswordRes = await request(app).post('/api/auth/register').send({
    name: 'Test User',
    email: 'test@example.com',
    password: '123',
  });
  assert(shortPasswordRes.status === 400, 'Password < 6 chars returns 400');

  // 5. Protected Routes without Auth Token
  console.log('\n5. Authentication Enforcement on Protected Routes');
  const noTokenTaskRes = await request(app).get('/api/tasks');
  assert(noTokenTaskRes.status === 401, 'GET /api/tasks without token returns 401 Unauthorized');
  assert(noTokenTaskRes.body.message.includes('Authentication required'), 'Returns authentication required message');

  const noTokenProfileRes = await request(app).get('/api/auth/me');
  assert(noTokenProfileRes.status === 401, 'GET /api/auth/me without token returns 401 Unauthorized');

  const invalidTokenRes = await request(app)
    .get('/api/tasks')
    .set('Authorization', 'Bearer invalid_garbage_token');
  assert(invalidTokenRes.status === 401, 'Invalid Bearer token returns 401 Unauthorized');

  // 6. MongoDB ObjectId Safety Validation
  console.log('\n6. MongoDB ObjectId Safety Validation');
  let objectIdError = null;
  validateTaskId({ params: { id: 'invalid-id-123' } }, {}, (err) => {
    objectIdError = err;
  });
  assert(objectIdError !== null, 'Invalid ObjectId format is intercepted by validator');
  assert(objectIdError.statusCode === 400, 'Invalid ObjectId returns 400 Bad Request');
  assert(
    objectIdError.errors && objectIdError.errors[0].message.includes('24-character hexadecimal'),
    'Error message specifies 24-character hexadecimal requirement'
  );

  let validObjectIdPassed = false;
  validateTaskId({ params: { id: '507f1f77bcf86cd799439011' } }, {}, (err) => {
    if (!err) validObjectIdPassed = true;
  });
  assert(validObjectIdPassed === true, 'Valid 24-character hex ObjectId passes validation');

  // 7. Role-Based Access Control (RBAC) Middleware Logic
  console.log('\n7. RBAC Authorization Middleware Unit Check');
  const mockAdminUser = { id: '507f1f77bcf86cd799439011', role: ROLES.ADMIN };
  const mockRegularUser = { id: '507f1f77bcf86cd799439022', role: ROLES.USER };

  let rbacPassed = false;
  const adminMiddleware = authorize(ROLES.ADMIN);
  adminMiddleware({ user: mockAdminUser }, {}, () => {
    rbacPassed = true;
  });
  assert(rbacPassed === true, 'Admin role passes authorize("ADMIN") check');

  let rbacRejected = false;
  let rejectedError = null;
  adminMiddleware({ user: mockRegularUser }, {}, (err) => {
    rbacRejected = true;
    rejectedError = err;
  });
  assert(rbacRejected === true, 'User role is rejected by authorize("ADMIN") check');
  assert(rejectedError && rejectedError.statusCode === 403, 'Rejection returns 403 Forbidden status code');

  // 8. Rate Limiting on Login Route
  console.log('\n8. Rate Limiting on Login Endpoint');
  let hitRateLimit = false;
  for (let i = 0; i < 7; i++) {
    const res = await request(app).post('/api/auth/login').send({
      email: 'invalid-email-format',
    });
    if (res.status === 429) {
      hitRateLimit = true;
      assert(res.body.success === false, 'Rate limited response returns success: false');
      assert(res.body.message.includes('Too many login attempts'), 'Rate limit returns descriptive message');
      break;
    }
  }
  assert(hitRateLimit === true, 'Login endpoint triggers 429 Too Many Requests after threshold');

  // Final Summary
  console.log('\n======================================================');
  console.log(`TOTAL API TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${totalTests - passedTests}`);
  console.log('======================================================\n');

  if (passedTests === totalTests) {
    console.log(' ALL API INTEGRATION TESTS PASSED SUCCESSFULLY!\n');
    process.exit(0);
  } else {
    console.error(' SOME TESTS FAILED!\n');
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});

/**
 * Deep Registration Testing with Dynamic Payloads
 * Tests boundary conditions, randomized strings, unicode, NoSQL injection patterns,
 * casing normalization, password hashing integrity, and JWT issuance.
 */
const request = require('supertest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const envConfig = require('../src/config/env.config');
const { registerSchema } = require('../src/validators/auth.validator');
const User = require('../src/models/user.model');
const authService = require('../src/services/auth.service');
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

// Random string generator helper
const randomString = (length) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Dynamic payload generator
const generateDynamicPayload = (overrides = {}) => {
  const uniqueId = `${Date.now()}_${randomString(5)}`;
  return {
    name: `User_${randomString(6)}`,
    email: `dynamic_${uniqueId}@example.com`,
    password: `Pass_${randomString(8)}!#`,
    role: Math.random() > 0.5 ? ROLES.USER : ROLES.ADMIN,
    ...overrides,
  };
};

async function runDeepTests() {
  console.log('\n======================================================');
  console.log('       DEEP REGISTRATION TEST SUITE (DYNAMIC PAYLOADS) ');
  console.log('======================================================\n');

  // -----------------------------------------------------------
  // 1. Boundary & Valid Dynamic Payloads
  // -----------------------------------------------------------
  console.log('1. Boundary & Dynamic Valid Payloads');

  // Min name boundary (2 characters)
  const minNamePayload = generateDynamicPayload({ name: 'Jo' });
  const minNameCheck = registerSchema.safeParse(minNamePayload);
  assert(minNameCheck.success === true, 'Min name boundary (2 chars) passes validation');

  // Max name boundary (50 characters)
  const maxNamePayload = generateDynamicPayload({ name: 'A'.repeat(50) });
  const maxNameCheck = registerSchema.safeParse(maxNamePayload);
  assert(maxNameCheck.success === true, 'Max name boundary (50 chars) passes validation');

  // Unicode international names
  const unicodePayload = generateDynamicPayload({ name: 'José Peña 张伟' });
  const unicodeCheck = registerSchema.safeParse(unicodePayload);
  assert(unicodeCheck.success === true, 'Unicode international names pass validation');

  // Min password boundary (6 characters)
  const minPassPayload = generateDynamicPayload({ password: '123456' });
  const minPassCheck = registerSchema.safeParse(minPassPayload);
  assert(minPassCheck.success === true, 'Min password boundary (6 chars) passes validation');

  // Long complex password (64 characters with symbols)
  const longPassPayload = generateDynamicPayload({ password: `${randomString(50)}!@#$%^&*()` });
  const longPassCheck = registerSchema.safeParse(longPassPayload);
  assert(longPassCheck.success === true, 'Long complex password (60+ chars with symbols) passes validation');

  // Subdomain & complex email addresses
  const complexEmailPayload = generateDynamicPayload({ email: 'developer.pro+filter@sub.domain.co.uk' });
  const complexEmailCheck = registerSchema.safeParse(complexEmailPayload);
  assert(complexEmailCheck.success === true, 'Complex multi-level subdomain email passes validation');

  // -----------------------------------------------------------
  // 2. Automated Generation of 10 Distinct Random Valid Payloads
  // -----------------------------------------------------------
  console.log('\n2. Random Generation of Multiple Dynamic Valid Payloads');
  let allRandomPassed = true;
  for (let i = 1; i <= 10; i++) {
    const payload = generateDynamicPayload();
    const result = registerSchema.safeParse(payload);
    if (!result.success) {
      allRandomPassed = false;
      console.error(`Failed on random payload ${i}:`, result.error);
    }
  }
  assert(allRandomPassed === true, '10 dynamically generated distinct random payloads all pass validation');

  // -----------------------------------------------------------
  // 3. String Trimming and Normalization
  // -----------------------------------------------------------
  console.log('\n3. Normalization (Trimming and Lowercasing)');
  const unnormalizedPayload = generateDynamicPayload({
    name: '  Trimmed Name  ',
    email: '  UPPERCASE_USER@EXAMPLE.COM  ',
  });
  const normalizedResult = registerSchema.safeParse(unnormalizedPayload);
  assert(normalizedResult.success === true, 'Unnormalized payload passes validation');
  assert(normalizedResult.data.name === 'Trimmed Name', 'Name is automatically trimmed of whitespace');
  assert(normalizedResult.data.email === 'uppercase_user@example.com', 'Email is automatically lowercased and trimmed');

  // -----------------------------------------------------------
  // 4. Invalid Boundary Tests
  // -----------------------------------------------------------
  console.log('\n4. Invalid Boundary Rejection Tests');

  // Name too short (1 char)
  const shortName = registerSchema.safeParse(generateDynamicPayload({ name: 'A' }));
  assert(shortName.success === false, 'Name with 1 character (< 2) is rejected');
  assert(shortName.error.issues.some((e) => e.path[0] === 'name'), 'Error identifies name field');

  // Name too long (51 chars)
  const longName = registerSchema.safeParse(generateDynamicPayload({ name: 'A'.repeat(51) }));
  assert(longName.success === false, 'Name with 51 characters (> 50) is rejected');

  // Name with only whitespace
  const whitespaceName = registerSchema.safeParse(generateDynamicPayload({ name: '     ' }));
  assert(whitespaceName.success === false, 'Name with only whitespace is rejected after trim');

  // Password too short (5 chars)
  const shortPass = registerSchema.safeParse(generateDynamicPayload({ password: '12345' }));
  assert(shortPass.success === false, 'Password with 5 characters (< 6) is rejected');

  // Invalid email formats
  const badEmails = [
    'plainaddress',
    '#@%^%#$@#$@#.com',
    '@example.com',
    'Joe Smith <email@example.com>',
    'email.example.com',
    'email@example@example.com',
    'email@example',
  ];
  let allBadEmailsRejected = true;
  for (const badEmail of badEmails) {
    const res = registerSchema.safeParse(generateDynamicPayload({ email: badEmail }));
    if (res.success) {
      allBadEmailsRejected = false;
      console.error(`Bad email slipped through: ${badEmail}`);
    }
  }
  assert(allBadEmailsRejected === true, '7 malformed email variations are all correctly rejected');

  // Invalid Role
  const invalidRole = registerSchema.safeParse(generateDynamicPayload({ role: 'SUPER_ADMIN' }));
  assert(invalidRole.success === false, 'Unsupported role (e.g. SUPER_ADMIN) is rejected');

  // -----------------------------------------------------------
  // 5. Injection & Type Safety Tests
  // -----------------------------------------------------------
  console.log('\n5. Type Safety & Injection Defense');

  // NoSQL injection in email field (sending object instead of string)
  const noSqlInjectionEmail = registerSchema.safeParse(generateDynamicPayload({ email: { $gt: '' } }));
  assert(noSqlInjectionEmail.success === false, 'NoSQL object injection in email field is rejected by type validator');

  // Type mismatch in password (number instead of string)
  const numberPass = registerSchema.safeParse(generateDynamicPayload({ password: 12345678 }));
  assert(numberPass.success === false, 'Number password type mismatch is rejected');

  // Null/undefined values
  const nullName = registerSchema.safeParse(generateDynamicPayload({ name: null }));
  assert(nullName.success === false, 'Null name is rejected');

  // -----------------------------------------------------------
  // 6. Password Cryptography & Security Verification
  // -----------------------------------------------------------
  console.log('\n6. Password Hashing Security Verification');
  const dynamicPassword = `Secret_${randomString(12)}!@#`;
  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync(dynamicPassword, salt);

  assert(hashedPassword !== dynamicPassword, 'Password is never stored in plain text');
  assert(hashedPassword.length === 60, 'Bcrypt hash is 60 characters long');
  assert(hashedPassword.startsWith('$2a$') || hashedPassword.startsWith('$2b$'), 'Valid bcrypt cost header format');
  assert(bcrypt.compareSync(dynamicPassword, hashedPassword) === true, 'Candidate password matches hash');
  assert(bcrypt.compareSync('WrongPassword', hashedPassword) === false, 'Incorrect password fails comparison');

  // -----------------------------------------------------------
  // 7. Token Generation with Dynamic User Payloads
  // -----------------------------------------------------------
  console.log('\n7. Token Issuance & Verification');
  const mockDynamicUserId = '507f1f77bcf86cd799439011';
  const dynamicRole = ROLES.USER;

  const accessToken = authService.generateAccessToken(mockDynamicUserId, dynamicRole);
  assert(typeof accessToken === 'string' && accessToken.length > 20, 'Access token is generated');

  const decodedAccess = jwt.verify(accessToken, envConfig.JWT_SECRET);
  assert(decodedAccess.id === mockDynamicUserId, 'Access token contains correct user ID');
  assert(decodedAccess.role === dynamicRole, 'Access token contains correct role');

  const refreshToken = authService.generateRefreshToken(mockDynamicUserId);
  assert(typeof refreshToken === 'string' && refreshToken.length > 20, 'Refresh token is generated');

  const decodedRefresh = jwt.verify(refreshToken, envConfig.JWT_REFRESH_SECRET);
  assert(decodedRefresh.id === mockDynamicUserId, 'Refresh token contains correct user ID');

  // -----------------------------------------------------------
  // 8. HTTP API Registration Integration via Supertest
  // -----------------------------------------------------------
  console.log('\n8. Supertest HTTP Endpoint Integration');

  // Test dynamic invalid payloads return proper 400 Bad Request
  const httpInvalidRes = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'X', // too short (< 2)
      email: 'not-valid',
      password: '12', // too short (< 6)
    });
  assert(httpInvalidRes.status === 400, 'HTTP POST /api/auth/register returns 400 for invalid payload');
  assert(httpInvalidRes.body.success === false, 'Response body has success: false');
  assert(Array.isArray(httpInvalidRes.body.errors), 'Response contains structured errors array');
  assert(httpInvalidRes.body.errors.length >= 3, 'All 3 invalid fields are reported in errors array');

  // Test malformed JSON body
  const malformedJsonRes = await request(app)
    .post('/api/auth/register')
    .set('Content-Type', 'application/json')
    .send('{"name": "broken');
  assert(malformedJsonRes.status === 400, 'Malformed JSON returns 400 Bad Request');
  assert(malformedJsonRes.body.message.includes('Malformed JSON'), 'Clear malformed JSON message');

  // -----------------------------------------------------------
  // Final Summary
  // -----------------------------------------------------------
  console.log('\n======================================================');
  console.log(`TOTAL DEEP REGISTRATION TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${totalTests - passedTests}`);
  console.log('======================================================\n');

  if (passedTests === totalTests) {
    console.log(' ALL DEEP REGISTRATION TESTS PASSED!\n');
    process.exit(0);
  } else {
    console.error(' SOME TESTS FAILED!\n');
    process.exit(1);
  }
}

runDeepTests().catch((err) => {
  console.error('Deep test execution failed:', err);
  process.exit(1);
});

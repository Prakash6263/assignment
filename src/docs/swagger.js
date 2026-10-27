/**
 * OpenAPI 3.0.0 Specification for Task Management REST API
 */
const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Task Management REST API',
    version: '1.0.0',
    description:
      'A production-grade RESTful API built with Node.js, Express, MongoDB, Zod validation, JWT authentication with refresh token lifecycle, and Role-Based Access Control (RBAC).',
    contact: {
      name: 'Prakash',
      url: 'https://github.com/Prakash6263/assignment',
    },
  },
  servers: [
    {
      url: 'http://localhost:5000/api',
      description: 'Local Development Server',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT access token in the format: Bearer <token>',
      },
    },
    schemas: {
      StandardResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Operation completed successfully' },
          data: { type: 'object' },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Validation failed' },
          errors: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                field: { type: 'string', example: 'email' },
                message: { type: 'string', example: 'Please provide a valid email address' },
              },
            },
          },
        },
      },
      RegisterInput: {
        type: 'object',
        required: ['name', 'email', 'password'],
        properties: {
          name: { type: 'string', example: 'Prakash Developer', minLength: 2, maxLength: 50 },
          email: { type: 'string', format: 'email', example: 'prakash.dev@example.com' },
          password: { type: 'string', format: 'password', example: 'Password123', minLength: 6 },
          role: { type: 'string', enum: ['USER', 'ADMIN'], example: 'USER', default: 'USER' },
        },
      },
      LoginInput: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'prakash.dev@example.com' },
          password: { type: 'string', format: 'password', example: 'Password123' },
        },
      },
      RefreshTokenInput: {
        type: 'object',
        required: ['refreshToken'],
        properties: {
          refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsIn...' },
        },
      },
      TaskInput: {
        type: 'object',
        required: ['title'],
        properties: {
          title: { type: 'string', example: 'Build Authentication Module', minLength: 1, maxLength: 150 },
          description: { type: 'string', example: 'Implement JWT, refresh tokens, and password hashing', maxLength: 1000 },
          priority: { type: 'string', enum: ['low', 'medium', 'high'], default: 'medium', example: 'high' },
          status: { type: 'string', enum: ['pending', 'in-progress', 'completed'], default: 'pending', example: 'in-progress' },
          dueDate: { type: 'string', format: 'date-time', example: '2026-11-01T18:00:00.000Z' },
        },
      },
      TaskUpdateInput: {
        type: 'object',
        properties: {
          title: { type: 'string', example: 'Updated Task Title' },
          description: { type: 'string', example: 'Updated description' },
          priority: { type: 'string', enum: ['low', 'medium', 'high'], example: 'medium' },
          status: { type: 'string', enum: ['pending', 'in-progress', 'completed'], example: 'completed' },
          dueDate: { type: 'string', format: 'date-time', example: '2026-11-05T12:00:00.000Z' },
        },
      },
      Task: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '673f8a000000000000000002' },
          title: { type: 'string', example: 'Complete Assignment' },
          description: { type: 'string', example: 'Write clean code' },
          priority: { type: 'string', example: 'high' },
          status: { type: 'string', example: 'pending' },
          dueDate: { type: 'string', format: 'date-time', example: '2026-11-01T18:00:00.000Z' },
          user: { type: 'string', example: '673f8a000000000000000001' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '673f8a000000000000000001' },
          name: { type: 'string', example: 'Prakash Developer' },
          email: { type: 'string', example: 'prakash.dev@example.com' },
          role: { type: 'string', example: 'USER' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        tags: ['System'],
        summary: 'Health check',
        description: 'Verify API service health and uptime',
        responses: {
          200: {
            description: 'API is healthy',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/StandardResponse' } } },
          },
        },
      },
    },
    '/auth/register': {
      post: {
        tags: ['Authentication'],
        summary: 'Register new user',
        description: 'Registers a new user account with hashed password and returns access & refresh tokens',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterInput' } } },
        },
        responses: {
          201: { description: 'User registered successfully' },
          400: { description: 'Validation failed' },
          409: { description: 'Email already registered' },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Login user',
        description: 'Authenticates credentials and returns JWT access & refresh tokens. Rate limited to 5 attempts per 15 minutes.',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginInput' } } },
        },
        responses: {
          200: { description: 'Login successful' },
          400: { description: 'Validation failed' },
          401: { description: 'Invalid email or password' },
          429: { description: 'Too many login attempts from this IP' },
        },
      },
    },
    '/auth/refresh-token': {
      post: {
        tags: ['Authentication'],
        summary: 'Refresh access token',
        description: 'Issues a new short-lived access token and rotated refresh token',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/RefreshTokenInput' } } },
        },
        responses: {
          200: { description: 'Tokens rotated successfully' },
          400: { description: 'Missing refresh token' },
          401: { description: 'Invalid or expired refresh token' },
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Authentication'],
        summary: 'Get current user profile',
        description: "Returns the authenticated user's profile",
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'Profile retrieved successfully' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/auth/logout': {
      post: {
        tags: ['Authentication'],
        summary: 'Logout user',
        description: 'Invalidates the active refresh token in the database',
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'Logged out successfully' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/tasks': {
      post: {
        tags: ['Tasks'],
        summary: 'Create task',
        description: 'Creates a new task associated with the authenticated user',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/TaskInput' } } },
        },
        responses: {
          201: { description: 'Task created successfully' },
          400: { description: 'Validation failed' },
          401: { description: 'Unauthorized' },
        },
      },
      get: {
        tags: ['Tasks'],
        summary: 'List user tasks',
        description: "Retrieves only the logged-in user's tasks with pagination, filters, and sorting",
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 }, description: 'Page number' },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 }, description: 'Items per page (max 100)' },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['pending', 'in-progress', 'completed'] }, description: 'Filter by status' },
          { name: 'priority', in: 'query', schema: { type: 'string', enum: ['low', 'medium', 'high'] }, description: 'Filter by priority' },
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Text search across title and description' },
          { name: 'sortBy', in: 'query', schema: { type: 'string', example: 'dueDate:asc' }, description: 'Sort format: <field>:<asc|desc>' },
        ],
        responses: {
          200: { description: 'Tasks retrieved successfully' },
          400: { description: 'Invalid query parameters' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/tasks/{id}': {
      get: {
        tags: ['Tasks'],
        summary: 'Get task by ID',
        description: 'Retrieves a single task owned by the authenticated user',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: '24-character hexadecimal MongoDB ObjectId' },
        ],
        responses: {
          200: { description: 'Task retrieved successfully' },
          400: { description: 'Invalid ObjectId format' },
          401: { description: 'Unauthorized' },
          404: { description: 'Task not found or permission denied' },
        },
      },
      put: {
        tags: ['Tasks'],
        summary: 'Update task (full update)',
        description: 'Replaces/updates allowed task fields owned by the authenticated user',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: '24-character hexadecimal MongoDB ObjectId' },
        ],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/TaskUpdateInput' } } },
        },
        responses: {
          200: { description: 'Task updated successfully' },
          400: { description: 'Validation failed' },
          401: { description: 'Unauthorized' },
          404: { description: 'Task not found or permission denied' },
        },
      },
      patch: {
        tags: ['Tasks'],
        summary: 'Update task (partial update)',
        description: 'Partially updates allowed fields on a task owned by the authenticated user',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: '24-character hexadecimal MongoDB ObjectId' },
        ],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/TaskUpdateInput' } } },
        },
        responses: {
          200: { description: 'Task updated successfully' },
          400: { description: 'Validation failed' },
          401: { description: 'Unauthorized' },
          404: { description: 'Task not found or permission denied' },
        },
      },
      delete: {
        tags: ['Tasks'],
        summary: 'Delete task',
        description: 'Deletes a task owned by the authenticated user',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: '24-character hexadecimal MongoDB ObjectId' },
        ],
        responses: {
          200: { description: 'Task deleted successfully' },
          400: { description: 'Invalid ObjectId format' },
          401: { description: 'Unauthorized' },
          404: { description: 'Task not found or permission denied' },
        },
      },
    },
    '/tasks/admin/all': {
      get: {
        tags: ['Admin'],
        summary: 'List all system tasks (Admin Only)',
        description: 'Inspects all tasks across all users in the system with user metadata populated. Requires role: ADMIN.',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'status', in: 'query', schema: { type: 'string' } },
          { name: 'priority', in: 'query', schema: { type: 'string' } },
          { name: 'sortBy', in: 'query', schema: { type: 'string', example: 'createdAt:desc' } },
        ],
        responses: {
          200: { description: 'All tasks retrieved successfully' },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden: Requires ADMIN role' },
        },
      },
    },
  },
};

module.exports = swaggerDocument;

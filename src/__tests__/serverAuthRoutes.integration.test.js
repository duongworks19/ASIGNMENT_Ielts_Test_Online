const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {
  FORGOT_PASSWORD_MESSAGE,
  hashResetToken,
  registerAuthRoutes,
} = require('../../server/authRoutes');

const JWT_SECRET = 'integration-test-secret-that-is-not-used-outside-jest';

function user(overrides = {}) {
  return {
    id: 'u-student-001',
    fullName: 'Student One',
    name: 'Student One',
    email: 'student@example.com',
    passwordHash: bcrypt.hashSync('OldStrong1', 4),
    role: 'student',
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function createHarness(overrides = {}) {
  const routes = {};
  const server = {};
  ['get', 'post', 'patch', 'put', 'delete'].forEach((method) => {
    server[method] = (path, ...handlers) => { routes[`${method.toUpperCase()} ${path}`] = handlers; };
  });
  const data = {
    users: [
      user(),
      user({ id: 'u-teacher-001', fullName: 'Teacher One', name: 'Teacher One', email: 'teacher@example.com', role: 'teacher' }),
      user({ id: 'u-admin-001', fullName: 'Admin One', name: 'Admin One', email: 'admin@example.com', role: 'admin' }),
    ],
    auditLogs: [],
    passwordResetTokens: [],
    enrollments: [], payments: [], transactions: [], testAttempts: [], lessonProgress: [], flashcardProgress: [], courses: [], lessons: [],
    ...overrides,
  };
  const db = {
    data,
    read: jest.fn(async () => undefined),
    write: jest.fn(async () => undefined),
  };
  const bodyParser = (req, res, next) => next();
  registerAuthRoutes({ server, db, bodyParser });

  const invoke = async (method, route, request = {}) => {
    const handlers = routes[`${method.toUpperCase()} ${route}`];
    if (!handlers) throw new Error(`Route not registered: ${method} ${route}`);
    const req = {
      body: {}, headers: {}, params: {}, url: route,
      ...request,
      headers: request.headers || {},
      body: request.body || {},
      params: request.params || {},
    };
    const res = {
      statusCode: 200,
      body: undefined,
      status(code) { this.statusCode = code; return this; },
      json(value) { this.body = value; return this; },
    };
    let index = 0;
    const next = async () => {
      const handler = handlers[index++];
      if (handler) return handler(req, res, next);
      return undefined;
    };
    await next();
    return { status: res.statusCode, body: res.body, req };
  };

  const login = async (email = 'admin@example.com', password = 'OldStrong1') => {
    const response = await invoke('POST', '/auth/login', { body: { email, password } });
    return response.body?.token;
  };
  const bearer = (token) => ({ authorization: `Bearer ${token}` });
  return { data, db, invoke, login, bearer };
}

describe('backend Auth routes integration', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = JWT_SECRET;
    process.env.JWT_EXPIRES_IN = '2h';
    process.env.DEMO_RESET_MODE = 'true';
  });

  afterAll(() => {
    delete process.env.JWT_SECRET;
    delete process.env.JWT_EXPIRES_IN;
    delete process.env.DEMO_RESET_MODE;
  });

  test('health endpoint identifies the custom server with Auth routes enabled', async () => {
    const { invoke } = createHarness();
    const response = await invoke('GET', '/health');
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      status: 'ok',
      service: 'ielts-fer202-custom-server',
      authRoutes: true,
    });
  });

  test('register hashes password, normalizes fields, forces Student/active and sanitizes response', async () => {
    const { data, invoke } = createHarness();
    const response = await invoke('POST', '/auth/register', { body: {
      fullName: '  New   Learner ', email: ' NEW@EXAMPLE.COM ', password: 'StrongPass1', confirmPassword: 'StrongPass1',
      dateOfBirth: '2000-02-29', role: 'admin', status: 'banned',
    } });

    expect(response.status).toBe(201);
    expect(response.body.user).toMatchObject({ fullName: 'New Learner', email: 'new@example.com', role: 'student', status: 'active' });
    expect(response.body.user).not.toHaveProperty('password');
    expect(response.body.user).not.toHaveProperty('passwordHash');
    const stored = data.users.find((entry) => entry.email === 'new@example.com');
    expect(stored.passwordHash).toMatch(/^\$2[aby]\$/);
    await expect(bcrypt.compare('StrongPass1', stored.passwordHash)).resolves.toBe(true);
  });

  test.each([
    [{ email: 'invalid', password: 'StrongPass1', confirmPassword: 'StrongPass1', fullName: 'Valid Name', dateOfBirth: '2000-01-01' }, 'email'],
    [{ email: 'new@example.com', password: 'weak', confirmPassword: 'weak', fullName: 'Valid Name', dateOfBirth: '2000-01-01' }, 'password'],
    [{ email: 'new@example.com', password: 'StrongPass1', confirmPassword: 'Different1', fullName: 'Valid Name', dateOfBirth: '2000-01-01' }, 'confirmPassword'],
    [{ email: 'new@example.com', password: 'StrongPass1', confirmPassword: 'StrongPass1', fullName: 'Valid Name', dateOfBirth: '2001-02-29' }, 'dateOfBirth'],
  ])('register rejects invalid field %s', async (payload, expectedField) => {
    const { invoke } = createHarness();
    const response = await invoke('POST', '/auth/register', { body: payload });
    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
    expect(response.body.errors).toHaveProperty(expectedField);
  });

  test('duplicate registration is case-insensitive', async () => {
    const { invoke } = createHarness();
    const response = await invoke('POST', '/auth/register', { body: {
      fullName: 'Duplicate User', email: ' STUDENT@EXAMPLE.COM ', password: 'StrongPass1', confirmPassword: 'StrongPass1', dateOfBirth: '',
    } });
    expect(response.status).toBe(409);
    expect(response.body.code).toBe('EMAIL_EXISTS');
  });

  test('login returns a signed expiring JWT with minimal payload and sanitized user', async () => {
    const { invoke } = createHarness();
    const response = await invoke('POST', '/auth/login', { body: { email: ' STUDENT@EXAMPLE.COM ', password: 'OldStrong1' } });
    expect(response.status).toBe(200);
    const payload = jwt.verify(response.body.token, JWT_SECRET, { issuer: 'ielts-master-fer202', audience: 'ielts-master-web' });
    expect(payload).toMatchObject({ sub: 'u-student-001', role: 'student' });
    expect(payload.exp).toBeGreaterThan(payload.iat);
    expect(payload).not.toHaveProperty('password');
    expect(response.body.user).not.toHaveProperty('passwordHash');
  });

  test.each([
    ['unknown@example.com', 'OldStrong1', 401, 'INVALID_CREDENTIALS'],
    ['student@example.com', 'WrongStrong1', 401, 'INVALID_CREDENTIALS'],
    ['locked@example.com', 'OldStrong1', 403, 'ACCOUNT_LOCKED'],
    ['banned@example.com', 'OldStrong1', 403, 'ACCOUNT_BANNED'],
  ])('login rejects account case %s', async (email, password, status, code) => {
    const users = [
      user(),
      user({ id: 'u-locked', email: 'locked@example.com', status: 'locked' }),
      user({ id: 'u-banned', email: 'banned@example.com', status: 'banned' }),
    ];
    const { invoke } = createHarness({ users });
    const response = await invoke('POST', '/auth/login', { body: { email, password } });
    expect(response.status).toBe(status);
    expect(response.body.code).toBe(code);
  });

  test('expired lock automatically becomes active while indefinite lock stays blocked', async () => {
    const users = [
      user({ id: 'u-expired', email: 'expired-lock@example.com', status: 'locked', lockedUntil: '2020-01-01T00:00:00.000Z' }),
      user({ id: 'u-indefinite', email: 'indefinite@example.com', status: 'locked' }),
    ];
    const { data, invoke } = createHarness({ users });
    const expired = await invoke('POST', '/auth/login', { body: { email: 'expired-lock@example.com', password: 'OldStrong1' } });
    const indefinite = await invoke('POST', '/auth/login', { body: { email: 'indefinite@example.com', password: 'OldStrong1' } });
    expect(expired.status).toBe(200);
    expect(data.users[0].status).toBe('active');
    expect(data.users[0]).not.toHaveProperty('lockedUntil');
    expect(indefinite.body.code).toBe('ACCOUNT_LOCKED');
  });

  test('auth/me rejects missing, forged and expired tokens', async () => {
    const { invoke, bearer } = createHarness();
    const missing = await invoke('GET', '/auth/me');
    const forged = await invoke('GET', '/auth/me', { headers: bearer('not-a-jwt') });
    const expiredToken = jwt.sign({ sub: 'u-student-001', role: 'student' }, JWT_SECRET, {
      expiresIn: -1, issuer: 'ielts-master-fer202', audience: 'ielts-master-web',
    });
    const expired = await invoke('GET', '/auth/me', { headers: bearer(expiredToken) });
    expect(missing.body.code).toBe('AUTH_REQUIRED');
    expect(forged.body.code).toBe('TOKEN_INVALID');
    expect(expired.body.code).toBe('TOKEN_EXPIRED');
  });

  test('forgot-password returns the same public message for existing and unknown emails and stores only a token hash', async () => {
    const { data, invoke } = createHarness();
    const existing = await invoke('POST', '/auth/forgot-password', { body: { email: 'student@example.com' } });
    const unknown = await invoke('POST', '/auth/forgot-password', { body: { email: 'unknown@example.com' } });
    expect(existing.body.message).toBe(FORGOT_PASSWORD_MESSAGE);
    expect(unknown.body.message).toBe(FORGOT_PASSWORD_MESSAGE);
    expect(existing.body.demoResetUrl).toMatch(/^\/reset-password\?token=/);
    expect(unknown.body).not.toHaveProperty('demoResetUrl');
    expect(data.passwordResetTokens[0].tokenHash).toHaveLength(64);
    expect(JSON.stringify(data.passwordResetTokens[0])).not.toContain(existing.body.demoResetUrl.split('token=')[1]);
  });

  test('reset token is validated for invalid, expired and used states', async () => {
    const invalidHarness = createHarness();
    expect((await invalidHarness.invoke('POST', '/auth/reset-password', { body: {
      token: 'invalid', newPassword: 'NewStrong1', confirmPassword: 'NewStrong1',
    } })).body.code).toBe('RESET_TOKEN_INVALID');

    const expiredHarness = createHarness({ passwordResetTokens: [{
      id: 'prt-001', userId: 'u-student-001', tokenHash: hashResetToken('expired'), expiresAt: '2020-01-01T00:00:00.000Z', usedAt: null,
    }] });
    expect((await expiredHarness.invoke('POST', '/auth/reset-password', { body: {
      token: 'expired', newPassword: 'NewStrong1', confirmPassword: 'NewStrong1',
    } })).body.code).toBe('RESET_TOKEN_EXPIRED');

    const usedHarness = createHarness({ passwordResetTokens: [{
      id: 'prt-001', userId: 'u-student-001', tokenHash: hashResetToken('used'), expiresAt: '2999-01-01T00:00:00.000Z', usedAt: '2026-01-01T00:00:00.000Z',
    }] });
    expect((await usedHarness.invoke('POST', '/auth/reset-password', { body: {
      token: 'used', newPassword: 'NewStrong1', confirmPassword: 'NewStrong1',
    } })).body.code).toBe('RESET_TOKEN_USED');
  });

  test('successful reset changes bcrypt hash and makes token one-use', async () => {
    const expiresAt = new Date(Date.now() + 60_000).toISOString();
    const harness = createHarness({ passwordResetTokens: [{
      id: 'prt-001', userId: 'u-student-001', tokenHash: hashResetToken('valid-token'), expiresAt, usedAt: null,
    }] });
    const first = await harness.invoke('POST', '/auth/reset-password', { body: {
      token: 'valid-token', newPassword: 'NewStrong1', confirmPassword: 'NewStrong1',
    } });
    const second = await harness.invoke('POST', '/auth/reset-password', { body: {
      token: 'valid-token', newPassword: 'AnotherStrong1', confirmPassword: 'AnotherStrong1',
    } });
    expect(first.status).toBe(200);
    await expect(bcrypt.compare('NewStrong1', harness.data.users[0].passwordHash)).resolves.toBe(true);
    expect(harness.data.passwordResetTokens[0].usedAt).toBeTruthy();
    expect(second.body.code).toBe('RESET_TOKEN_USED');
  });

  test('admin APIs enforce role, self-protection, last-admin and reference integrity', async () => {
    const harness = createHarness();
    const studentToken = await harness.login('student@example.com');
    const adminToken = await harness.login();
    expect((await harness.invoke('GET', '/admin/users', { headers: harness.bearer(studentToken) })).status).toBe(403);
    expect((await harness.invoke('PATCH', '/admin/users/:id/status', {
      params: { id: 'u-admin-001' }, headers: harness.bearer(adminToken), body: { status: 'locked' },
    })).body.code).toBe('SELF_STATUS_CHANGE');
    expect((await harness.invoke('PATCH', '/admin/users/:id', {
      params: { id: 'u-admin-001' }, headers: harness.bearer(adminToken), body: { role: 'student' },
    })).body.errors.role).toMatch(/role/i);
    expect((await harness.invoke('DELETE', '/admin/users/:id', {
      params: { id: 'u-admin-001' }, headers: harness.bearer(adminToken),
    })).body.code).toBe('SELF_DELETE');

    harness.data.enrollments.push({ id: 'e-1', userId: 'u-student-001' });
    expect((await harness.invoke('DELETE', '/admin/users/:id', {
      params: { id: 'u-student-001' }, headers: harness.bearer(adminToken),
    })).body.code).toBe('USER_HAS_REFERENCES');
  });

  test('Admin dashboard summary is protected and is calculated from current database collections', async () => {
    const auditLogs = [
      { id: 'log-1', actorId: 'u-admin-001', action: 'CREATE_USER', targetType: 'user', createdAt: '2026-07-19T00:00:00.000Z' },
      { id: 'log-2', actorId: 'u-admin-001', action: 'UPDATE_USER', targetType: 'user', createdAt: '2026-07-20T00:00:00.000Z' },
    ];
    const harness = createHarness({
      courses: [{ id: 'c-1' }, { id: 'c-2' }],
      approvalRequests: [
        { id: 'a-1', status: 'pending' },
        { id: 'a-2', status: 'approved' },
        { id: 'a-3', status: 'pending' },
      ],
      auditLogs,
    });
    const studentToken = await harness.login('student@example.com');
    const denied = await harness.invoke('GET', '/admin/dashboard/summary', { headers: harness.bearer(studentToken) });
    expect(denied.status).toBe(403);

    const adminToken = await harness.login();
    const response = await harness.invoke('GET', '/admin/dashboard/summary', { headers: harness.bearer(adminToken) });
    expect(response.status).toBe(200);
    expect(response.body.data.stats).toEqual({
      totalUsers: 3,
      totalCourses: 2,
      pendingContent: 2,
      totalLogs: 2,
    });
    expect(response.body.data.recentLogs.map((log) => log.id)).toEqual(['log-2', 'log-1']);
    expect(response.body.data.generatedAt).toBeTruthy();
  });

  test('Admin CRUD creates sanitized users and server-generated audit logs', async () => {
    const harness = createHarness();
    const adminToken = await harness.login();
    const headers = harness.bearer(adminToken);
    const created = await harness.invoke('POST', '/admin/users', { headers, body: {
      fullName: 'Managed User', email: 'managed@example.com', password: 'StrongPass1', role: 'teacher', status: 'active',
    } });
    const id = created.body.user.id;
    expect(created.status).toBe(201);
    expect(created.body.user).not.toHaveProperty('passwordHash');

    await harness.invoke('PATCH', '/admin/users/:id', { params: { id }, headers, body: { fullName: 'Managed Teacher', role: 'student' } });
    await harness.invoke('PATCH', '/admin/users/:id/status', { params: { id }, headers, body: { status: 'locked' } });
    const unlocked = await harness.invoke('PATCH', '/admin/users/:id/status', { params: { id }, headers, body: { status: 'active' } });
    expect(unlocked.body.user).not.toHaveProperty('lockedUntil');
    const deleted = await harness.invoke('DELETE', '/admin/users/:id', { params: { id }, headers });
    expect(deleted.status).toBe(200);

    expect(harness.data.auditLogs.map((entry) => entry.action)).toEqual(expect.arrayContaining([
      'CREATE_USER', 'UPDATE_USER', 'CHANGE_USER_ROLE', 'CHANGE_USER_STATUS', 'UNLOCK_USER', 'DELETE_USER',
    ]));
    expect(harness.data.auditLogs.every((entry) => entry.actorId === 'u-admin-001' && entry.targetType === 'user' && entry.createdAt)).toBe(true);
  });

  test('raw sensitive collections are disabled and audit logs are immutable', async () => {
    const { invoke } = createHarness();
    const response = await invoke('GET', '/users');
    expect(response.status).toBe(403);
    expect(response.body.code).toBe('RAW_USERS_DISABLED');

    const resetStore = await invoke('GET', '/passwordResetTokens');
    expect(resetStore.status).toBe(403);
    expect(resetStore.body.code).toBe('RESET_TOKEN_STORE_DISABLED');

    const auditMutation = await invoke('PATCH', '/auditLogs/:id', { params: { id: 'log-001' } });
    expect(auditMutation.status).toBe(403);
    expect(auditMutation.body.code).toBe('AUDIT_LOG_IMMUTABLE');
  });

  test('authenticated Teacher activity logs use token actor while user-admin audit actions stay server-managed', async () => {
    const harness = createHarness();
    const teacherToken = await harness.login('teacher@example.com');
    const headers = harness.bearer(teacherToken);
    const activity = await harness.invoke('POST', '/auditLogs', {
      headers,
      body: { action: 'CREATE_COURSE', userId: 'forged-admin', details: { courseId: 'course-1' } },
    });
    expect(activity.status).toBe(201);
    expect(activity.body).toMatchObject({ actorId: 'u-teacher-001', action: 'CREATE_COURSE' });

    const forgedUserAudit = await harness.invoke('POST', '/auditLogs', {
      headers,
      body: { action: 'CREATE_USER', details: { targetId: 'fake-user' } },
    });
    expect(forgedUserAudit.status).toBe(403);
    expect(forgedUserAudit.body.code).toBe('SERVER_MANAGED_AUDIT_ONLY');

    const studentToken = await harness.login('student@example.com');
    const studentActivity = await harness.invoke('POST', '/auditLogs', {
      headers: harness.bearer(studentToken),
      body: { action: 'CREATE_COURSE', details: { courseId: 'course-2' } },
    });
    expect(studentActivity.status).toBe(403);
    expect(studentActivity.body.code).toBe('FORBIDDEN');
  });
});

const {
  PAYMENT_STATUSES,
  applyProviderPaymentState,
  buildOrderItems,
  buildRevenueReport,
  isPayOSPayment,
  normalizeProviderDateTime,
  registerPaymentRoutes,
} = require('../../server/paymentRoutes');

function course(overrides = {}) {
  return {
    id: 'course-001',
    title: 'IELTS Reading',
    price: 289000,
    status: 'approved',
    teacherId: 'teacher-001',
    enrolledCount: 0,
    ...overrides,
  };
}

function payment(overrides = {}) {
  return {
    id: 'pay-001',
    orderCode: 1784500000000,
    userId: 'student-001',
    courseId: 'course-001',
    items: [{
      courseId: 'course-001',
      courseTitle: 'IELTS Reading',
      type: 'enroll',
      listPrice: 289000,
      amount: 289000,
      discountAmount: 0,
    }],
    originalAmount: 289000,
    discountAmount: 0,
    amount: 289000,
    currency: 'VND',
    method: 'payos',
    provider: 'payos',
    providerStatus: 'PENDING',
    status: PAYMENT_STATUSES.PENDING,
    type: 'enroll',
    description: 'IELTS 1784500000000',
    checkoutUrl: 'https://pay.payos.vn/web/mock',
    paymentLinkId: 'payment-link-001',
    createdAt: '2026-07-20T00:00:00.000Z',
    paidAt: null,
    ...overrides,
  };
}

function createHarness(dataOverrides = {}) {
  const routes = {};
  const server = {};
  ['get', 'post', 'patch', 'put', 'delete'].forEach((method) => {
    server[method] = (path, ...handlers) => {
      routes[`${method.toUpperCase()} ${path}`] = handlers;
    };
  });

  const data = {
    users: [
      { id: 'student-001', fullName: 'Student One', email: 'student@example.com', role: 'student' },
      { id: 'admin-001', fullName: 'Admin One', email: 'admin@example.com', role: 'admin' },
    ],
    courses: [course()],
    enrollments: [],
    payments: [],
    auditLogs: [],
    ...dataOverrides,
  };
  const db = {
    data,
    read: jest.fn(async () => undefined),
    write: jest.fn(async () => undefined),
  };
  const payOSClient = {
    paymentRequests: {
      create: jest.fn(async (payload) => ({
        orderCode: payload.orderCode,
        amount: payload.amount,
        currency: 'VND',
        paymentLinkId: 'payment-link-created',
        checkoutUrl: 'https://pay.payos.vn/web/created',
        status: 'PENDING',
        expiredAt: payload.expiredAt,
      })),
      get: jest.fn(async (orderCode) => ({
        id: 'payment-link-created',
        orderCode,
        amount: 289000,
        amountPaid: 289000,
        status: 'PAID',
        transactions: [{ reference: 'BANK-REF-001', amount: 289000, transactionDateTime: '2026-07-20 10:00:00' }],
      })),
    },
    webhooks: { verify: jest.fn(async (body) => body.data) },
  };
  const bodyParser = (req, res, next) => next();
  const authenticate = (req, res, next) => {
    req.authUser = req.authUser || data.users[0];
    return next();
  };
  const requireRole = (...roles) => (req, res, next) => {
    if (!roles.includes(req.authUser.role)) return res.status(403).json({ code: 'FORBIDDEN' });
    return next();
  };
  registerPaymentRoutes({ server, db, bodyParser, authenticate, requireRole, payOSClient });

  const invoke = async (method, route, request = {}) => {
    const handlers = routes[`${method.toUpperCase()} ${route}`];
    if (!handlers) throw new Error(`Route not registered: ${method} ${route}`);
    const req = {
      body: {},
      headers: {},
      params: {},
      url: route,
      ...request,
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
      return handler ? handler(req, res, next) : undefined;
    };
    await next();
    return { status: res.statusCode, body: res.body };
  };

  return { data, db, invoke, payOSClient };
}

describe('PayOS payment backend', () => {
  beforeAll(() => {
    process.env['payos.return_url'] = 'http://localhost:3000/payment/success';
    process.env['payos.cancel_url'] = 'http://localhost:3000/payment/cancel';
  });

  afterAll(() => {
    delete process.env['payos.return_url'];
    delete process.env['payos.cancel_url'];
  });

  test('allocates discounts across course items without changing the order total', () => {
    const order = buildOrderItems([
      course({ id: 'course-1', price: 100000 }),
      course({ id: 'course-2', price: 200000 }),
      course({ id: 'course-free', price: 0 }),
    ], 'enroll', 'IELTS10');

    expect(order).toMatchObject({ originalAmount: 300000, discountAmount: 30000, amount: 270000 });
    expect(order.items.map((item) => item.amount)).toEqual([90000, 180000, 0]);
    expect(order.items.reduce((sum, item) => sum + item.amount, 0)).toBe(order.amount);
  });

  test('settles a paid order idempotently and creates one enrollment', () => {
    const storedPayment = payment();
    const data = { courses: [course()], enrollments: [], auditLogs: [] };
    const providerPayment = {
      status: 'PAID',
      amountPaid: 289000,
      transactions: [{ reference: 'BANK-REF-001', transactionDateTime: '2026-07-20 10:00:00' }],
    };

    applyProviderPaymentState(data, storedPayment, providerPayment);
    applyProviderPaymentState(data, storedPayment, providerPayment);

    expect(storedPayment).toMatchObject({ status: 'paid', providerReference: 'BANK-REF-001' });
    expect(storedPayment.paidAt).toBe('2026-07-20T03:00:00.000Z');
    expect(data.enrollments).toHaveLength(1);
    expect(data.enrollments[0]).toMatchObject({ userId: 'student-001', courseId: 'course-001', isPremium: true });
    expect(data.courses[0].enrolledCount).toBe(1);
    expect(data.auditLogs.filter((log) => log.action === 'PAYMENT_COMPLETED')).toHaveLength(1);
  });

  test('normalizes PayOS Vietnam transaction timestamps', () => {
    expect(normalizeProviderDateTime('2026-07-20 10:00:00')).toBe('2026-07-20T03:00:00.000Z');
    expect(normalizeProviderDateTime('not-a-date')).toBeNull();
  });

  test('creates PayOS links from database prices and ignores caller supplied amount or user id', async () => {
    const harness = createHarness();
    const response = await harness.invoke('POST', '/payments/create', {
      body: { courseIds: ['course-001'], amount: 1, userId: 'forged-user' },
    });

    expect(response.status).toBe(201);
    expect(harness.payOSClient.paymentRequests.create).toHaveBeenCalledWith(expect.objectContaining({ amount: 289000 }));
    expect(harness.data.payments[0]).toMatchObject({ userId: 'student-001', amount: 289000, provider: 'payos' });
  });

  test('syncs PAID status from PayOS and unlocks the purchased course', async () => {
    const storedPayment = payment();
    const harness = createHarness({ payments: [storedPayment] });
    const response = await harness.invoke('POST', '/payments/:orderCode/sync', {
      params: { orderCode: storedPayment.orderCode },
    });

    expect(response.status).toBe(200);
    expect(response.body.payment.status).toBe('paid');
    expect(harness.data.enrollments).toHaveLength(1);
  });

  test('revenue report assigns bundle revenue to each course and excludes pending orders', () => {
    const paidBundle = payment({
      amount: 450000,
      status: 'paid',
      paidAt: '2026-07-20T10:00:00.000Z',
      items: [
        { courseId: 'course-001', courseTitle: 'IELTS Reading', amount: 200000 },
        { courseId: 'course-002', courseTitle: 'IELTS Listening', amount: 250000 },
      ],
    });
    const data = {
      courses: [course(), course({ id: 'course-002', title: 'IELTS Listening' })],
      users: [{ id: 'teacher-001', fullName: 'Teacher One' }],
    };
    const report = buildRevenueReport([paidBundle, payment({ id: 'pay-002', orderCode: 1784500000001 })], data);

    expect(report.summary).toMatchObject({ totalRevenue: 450000, totalOrders: 1, coursesSold: 2 });
    expect(report.byCourse.map((entry) => [entry.courseId, entry.revenue])).toEqual([
      ['course-002', 250000],
      ['course-001', 200000],
    ]);
    expect(report.byCourse[0].teacherName).toBe('Teacher One');
  });

  test('identifies only structurally valid PayOS payment records', () => {
    expect(isPayOSPayment(payment())).toBe(true);
    expect(isPayOSPayment({ id: 'log-001', action: 'CREATE_COURSE' })).toBe(false);
  });
});

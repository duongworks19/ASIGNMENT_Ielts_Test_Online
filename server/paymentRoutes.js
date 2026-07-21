const { PayOS } = require('@payos/node');

const PAYMENT_STATUSES = {
  PENDING: 'pending',
  PAID: 'paid',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
  FAILED: 'failed',
};

const COUPONS = {
  IELTS10: { type: 'percent', value: 10 },
  SAVE50: { type: 'fixed', value: 50000 },
};

const TERMINAL_PROVIDER_STATUSES = new Set(['CANCELLED', 'EXPIRED', 'FAILED']);

function sendError(res, status, message, code) {
  return res.status(status).json({ message, code });
}

function createId(items, prefix) {
  const max = items.reduce((current, item) => {
    const match = String(item.id || '').match(new RegExp(`^${prefix}(\\d+)$`));
    return match ? Math.max(current, Number(match[1])) : current;
  }, 0);
  return `${prefix}${String(max + 1).padStart(3, '0')}`;
}

function createOrderCode(payments, now = Date.now()) {
  const usedCodes = new Set(payments.map((payment) => Number(payment.orderCode)));
  let orderCode = Number(now);
  while (usedCodes.has(orderCode)) orderCode += 1;
  return orderCode;
}

function normalizeCourseIds(value) {
  const values = Array.isArray(value) ? value : [value];
  return [...new Set(values.map((id) => String(id || '').trim()).filter(Boolean))];
}

function calculateDiscount(total, couponCode) {
  const normalizedCode = String(couponCode || '').trim().toUpperCase();
  const coupon = COUPONS[normalizedCode];
  if (!coupon || total <= 0) return { couponCode: null, discountAmount: 0 };

  const discountAmount = coupon.type === 'percent'
    ? Math.round((total * coupon.value) / 100)
    : Math.min(coupon.value, total);
  return { couponCode: normalizedCode, discountAmount };
}

function buildOrderItems(courses, type = 'enroll', couponCode = '') {
  const pricedItems = courses.map((course) => {
    const listPrice = type === 'upgrade'
      ? Number(course.premiumPrice || 0)
      : Number(course.price || 0);
    return {
      courseId: String(course.id),
      courseTitle: String(course.title || 'Khóa học IELTS'),
      type,
      listPrice: Math.max(0, Math.round(listPrice)),
    };
  });

  const originalAmount = pricedItems.reduce((sum, item) => sum + item.listPrice, 0);
  const discount = calculateDiscount(originalAmount, couponCode);
  const amount = originalAmount - discount.discountAmount;
  let allocatedAmount = 0;
  const lastPricedIndex = pricedItems.reduce(
    (lastIndex, item, index) => (item.listPrice > 0 ? index : lastIndex),
    -1,
  );

  const items = pricedItems.map((item, index) => {
    const itemAmount = item.listPrice <= 0
      ? 0
      : (index === lastPricedIndex
        ? amount - allocatedAmount
        : Math.floor((amount * item.listPrice) / originalAmount));
    allocatedAmount += itemAmount;
    return {
      ...item,
      amount: itemAmount,
      discountAmount: item.listPrice - itemAmount,
    };
  });

  return {
    items,
    originalAmount,
    amount,
    discountAmount: discount.discountAmount,
    couponCode: discount.couponCode,
  };
}

function isPayOSPayment(payment) {
  return Boolean(
    payment
    && payment.provider === 'payos'
    && Number.isSafeInteger(Number(payment.orderCode))
    && payment.userId
    && Array.isArray(payment.items)
    && payment.items.length > 0
    && Number.isFinite(Number(payment.amount)),
  );
}

function mapProviderStatus(status) {
  const normalized = String(status || '').toUpperCase();
  if (normalized === 'PAID') return PAYMENT_STATUSES.PAID;
  if (normalized === 'CANCELLED') return PAYMENT_STATUSES.CANCELLED;
  if (normalized === 'EXPIRED') return PAYMENT_STATUSES.EXPIRED;
  if (normalized === 'FAILED') return PAYMENT_STATUSES.FAILED;
  return PAYMENT_STATUSES.PENDING;
}

function normalizeProviderDateTime(value) {
  if (!value) return null;
  const raw = String(value).trim();
  const vietnamLocal = /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}$/.test(raw)
    ? `${raw.replace(' ', 'T')}+07:00`
    : raw;
  const parsed = new Date(vietnamLocal);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function getPayOSConfig(env = process.env) {
  return {
    clientId: env.PAYOS_CLIENT_ID || env['payos.client_id'],
    apiKey: env.PAYOS_API_KEY || env['payos.api_key'],
    checksumKey: env.PAYOS_CHECKSUM_KEY || env['payos.checksum_key'],
    returnUrl: env.PAYOS_RETURN_URL || env['payos.return_url'],
    cancelUrl: env.PAYOS_CANCEL_URL || env['payos.cancel_url'],
    webhookUrl: env.PAYOS_WEBHOOK_URL || env['payos.webhook_url'],
  };
}

function validatePayOSConfig(config) {
  return ['clientId', 'apiKey', 'checksumKey', 'returnUrl', 'cancelUrl']
    .filter((key) => !config[key]);
}

function getPaymentCourseIds(payment) {
  return payment.items.map((item) => String(item.courseId));
}

function paymentMatchesCourse(payment, courseId) {
  if (!courseId) return true;
  return payment.items.some((item) => String(item.courseId) === String(courseId));
}

function toClientPayment(payment) {
  return {
    id: payment.id,
    orderCode: payment.orderCode,
    userId: payment.userId,
    courseId: payment.courseId || null,
    courseIds: getPaymentCourseIds(payment),
    items: payment.items,
    originalAmount: payment.originalAmount,
    discountAmount: payment.discountAmount,
    amount: payment.amount,
    currency: payment.currency,
    method: payment.method,
    provider: payment.provider,
    providerStatus: payment.providerStatus,
    status: payment.status,
    type: payment.type,
    description: payment.description,
    checkoutUrl: payment.checkoutUrl || null,
    paymentLinkId: payment.paymentLinkId || null,
    providerReference: payment.providerReference || null,
    couponCode: payment.couponCode || null,
    createdAt: payment.createdAt,
    paidAt: payment.paidAt || null,
    cancelledAt: payment.cancelledAt || null,
    expiredAt: payment.expiredAt || null,
  };
}

function ensureEnrollment(data, payment, item, paidAt) {
  data.enrollments = data.enrollments || [];
  const existing = data.enrollments.find((enrollment) => (
    String(enrollment.userId) === String(payment.userId)
    && String(enrollment.courseId) === String(item.courseId)
  ));
  const course = (data.courses || []).find((candidate) => String(candidate.id) === String(item.courseId));
  const grantsPremium = item.type === 'upgrade' || Number(item.listPrice) > 0;

  if (existing) {
    if (grantsPremium) existing.isPremium = true;
    existing.status = existing.status || 'active';
    existing.paymentId = existing.paymentId || payment.id;
    existing.orderCode = existing.orderCode || payment.orderCode;
    return existing;
  }

  const enrollment = {
    id: createId(data.enrollments, 'enrol-'),
    userId: payment.userId,
    courseId: item.courseId,
    progress: 0,
    status: 'active',
    isPremium: grantsPremium,
    paymentId: payment.id,
    orderCode: payment.orderCode,
    enrolledAt: paidAt,
  };
  data.enrollments.push(enrollment);
  if (course) {
    course.enrolledCount = Number(course.enrolledCount || course.students || 0) + 1;
  }
  return enrollment;
}

function addPaymentAuditLog(data, payment, action, createdAt) {
  data.auditLogs = data.auditLogs || [];
  if (data.auditLogs.some((log) => log.action === action && log.targetId === payment.id)) return;
  data.auditLogs.push({
    id: createId(data.auditLogs, 'log-'),
    actorId: payment.userId,
    action,
    targetType: 'payment',
    targetId: payment.id,
    newValue: {
      orderCode: payment.orderCode,
      amount: payment.amount,
      courseIds: getPaymentCourseIds(payment),
    },
    createdAt,
  });
}

function applyProviderPaymentState(data, payment, providerPayment) {
  const providerStatus = String(providerPayment.status || '').toUpperCase();
  const localStatus = mapProviderStatus(providerStatus);
  payment.providerStatus = providerStatus || payment.providerStatus;
  payment.lastSyncedAt = new Date().toISOString();

  if (localStatus === PAYMENT_STATUSES.PAID) {
    const amountPaid = Number(providerPayment.amountPaid ?? providerPayment.amount);
    if (!Number.isFinite(amountPaid) || amountPaid < Number(payment.amount)) {
      const error = new Error('Số tiền PayOS xác nhận không khớp với đơn hàng.');
      error.code = 'PAYMENT_AMOUNT_MISMATCH';
      throw error;
    }

    if (payment.status !== PAYMENT_STATUSES.PAID) {
      const providerTransaction = Array.isArray(providerPayment.transactions)
        ? providerPayment.transactions[providerPayment.transactions.length - 1]
        : providerPayment;
      const paidAt = normalizeProviderDateTime(providerTransaction?.transactionDateTime)
        || new Date().toISOString();
      payment.status = PAYMENT_STATUSES.PAID;
      payment.paidAt = paidAt;
      payment.providerReference = providerTransaction?.reference || payment.providerReference || null;
      payment.providerTransactionDateTime = providerTransaction?.transactionDateTime || null;
      payment.checkoutUrl = null;
      payment.items.forEach((item) => ensureEnrollment(data, payment, item, paidAt));
      addPaymentAuditLog(data, payment, 'PAYMENT_COMPLETED', paidAt);
    }
    return payment;
  }

  if (TERMINAL_PROVIDER_STATUSES.has(providerStatus) && payment.status !== PAYMENT_STATUSES.PAID) {
    payment.status = localStatus;
    payment.checkoutUrl = null;
    if (localStatus === PAYMENT_STATUSES.CANCELLED) {
      payment.cancelledAt = providerPayment.canceledAt || new Date().toISOString();
    }
  }
  return payment;
}

function buildAdminTransaction(payment, data) {
  const user = (data.users || []).find((candidate) => String(candidate.id) === String(payment.userId));
  return {
    ...toClientPayment(payment),
    userName: user?.fullName || user?.name || 'Người dùng đã xóa',
    userEmail: user?.email || '',
    courseTitles: payment.items.map((item) => item.courseTitle),
  };
}

function buildRevenueReport(payments, data) {
  const paidPayments = payments.filter((payment) => payment.status === PAYMENT_STATUSES.PAID);
  const totalRevenue = paidPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const byCourseMap = new Map();
  const byMonthMap = new Map();

  paidPayments.forEach((payment) => {
    const paidAt = new Date(payment.paidAt || payment.createdAt);
    if (!Number.isNaN(paidAt.getTime())) {
      const monthKey = `${paidAt.getFullYear()}-${String(paidAt.getMonth() + 1).padStart(2, '0')}`;
      byMonthMap.set(monthKey, (byMonthMap.get(monthKey) || 0) + Number(payment.amount || 0));
    }

    payment.items.forEach((item) => {
      const course = (data.courses || []).find((candidate) => String(candidate.id) === String(item.courseId));
      const current = byCourseMap.get(item.courseId) || {
        courseId: item.courseId,
        courseTitle: course?.title || item.courseTitle,
        teacherId: course?.teacherId || null,
        teacherName: null,
        revenue: 0,
        sales: 0,
        orderCodes: new Set(),
        buyerIds: new Set(),
      };
      current.revenue += Number(item.amount || 0);
      current.sales += 1;
      current.orderCodes.add(payment.orderCode);
      current.buyerIds.add(payment.userId);
      if (!current.teacherName && current.teacherId) {
        const teacher = (data.users || []).find((user) => String(user.id) === String(current.teacherId));
        current.teacherName = teacher?.fullName || teacher?.name || teacher?.email || null;
      }
      byCourseMap.set(item.courseId, current);
    });
  });

  const byCourse = [...byCourseMap.values()]
    .map((entry) => ({
      courseId: entry.courseId,
      courseTitle: entry.courseTitle,
      teacherId: entry.teacherId,
      teacherName: entry.teacherName,
      revenue: entry.revenue,
      sales: entry.sales,
      orders: entry.orderCodes.size,
      buyers: entry.buyerIds.size,
    }))
    .sort((left, right) => right.revenue - left.revenue);

  const byMonth = [...byMonthMap.entries()]
    .map(([month, revenue]) => ({ month, revenue }))
    .sort((left, right) => left.month.localeCompare(right.month));

  return {
    summary: {
      totalRevenue,
      totalOrders: paidPayments.length,
      averageOrderValue: paidPayments.length ? Math.round(totalRevenue / paidPayments.length) : 0,
      coursesSold: paidPayments.reduce((sum, payment) => sum + payment.items.length, 0),
    },
    byCourse,
    byMonth,
  };
}

function registerPaymentRoutes({ server, db, bodyParser, authenticate, requireRole, payOSClient }) {
  const config = getPayOSConfig();
  let client = payOSClient || null;
  let writeQueue = Promise.resolve();

  const enqueueWrite = (work) => {
    const next = writeQueue.then(work, work);
    writeQueue = next.catch(() => undefined);
    return next;
  };

  const getClient = () => {
    if (client) return client;
    const missing = validatePayOSConfig(config);
    if (missing.length) {
      const error = new Error(`Thiếu cấu hình PayOS: ${missing.join(', ')}`);
      error.code = 'PAYOS_NOT_CONFIGURED';
      throw error;
    }
    client = new PayOS({
      clientId: config.clientId,
      apiKey: config.apiKey,
      checksumKey: config.checksumKey,
    });
    return client;
  };

  const syncFromProvider = async (payment, providerPayment) => enqueueWrite(async () => {
    await db.read();
    const current = (db.data.payments || []).find((entry) => (
      isPayOSPayment(entry) && Number(entry.orderCode) === Number(payment.orderCode)
    ));
    if (!current) return null;
    applyProviderPaymentState(db.data, current, providerPayment);
    await db.write();
    return current;
  });

  server.post('/payments/create', authenticate, requireRole('student'), bodyParser, async (req, res) => {
    return enqueueWrite(async () => {
      try {
        await db.read();
        db.data.payments = db.data.payments || [];
        db.data.enrollments = db.data.enrollments || [];

        const type = req.body?.type === 'upgrade' ? 'upgrade' : 'enroll';
        const requestedIds = normalizeCourseIds(req.body?.courseIds || req.body?.courseId);
        if (!requestedIds.length) {
          return sendError(res, 400, 'Vui lòng chọn ít nhất một khóa học.', 'COURSE_REQUIRED');
        }
        if (type === 'upgrade' && requestedIds.length !== 1) {
          return sendError(res, 400, 'Mỗi đơn nâng cấp chỉ áp dụng cho một khóa học.', 'INVALID_UPGRADE_ORDER');
        }

        const courses = requestedIds.map((courseId) => (
          (db.data.courses || []).find((course) => String(course.id) === courseId)
        ));
        if (courses.some((course) => !course)) {
          return sendError(res, 404, 'Có khóa học không tồn tại.', 'COURSE_NOT_FOUND');
        }
        if (courses.some((course) => !['approved', 'published'].includes(course.status))) {
          return sendError(res, 409, 'Khóa học chưa sẵn sàng để bán.', 'COURSE_NOT_AVAILABLE');
        }

        if (type === 'upgrade') {
          const enrollment = db.data.enrollments.find((entry) => (
            String(entry.userId) === String(req.authUser.id)
            && String(entry.courseId) === requestedIds[0]
          ));
          if (!enrollment) {
            return sendError(res, 409, 'Bạn cần đăng ký khóa học trước khi nâng cấp Premium.', 'ENROLLMENT_REQUIRED');
          }
          if (enrollment.isPremium) {
            return sendError(res, 409, 'Khóa học này đã được nâng cấp Premium.', 'ALREADY_PREMIUM');
          }
        }

        const availableCourses = type === 'upgrade' ? courses : courses.filter((course) => {
          return !db.data.enrollments.some((entry) => (
            String(entry.userId) === String(req.authUser.id)
            && String(entry.courseId) === String(course.id)
          ));
        });
        const skippedCourseIds = requestedIds.filter((courseId) => (
          !availableCourses.some((course) => String(course.id) === courseId)
        ));
        if (!availableCourses.length) {
          return sendError(res, 409, 'Bạn đã sở hữu tất cả khóa học trong đơn.', 'COURSES_ALREADY_OWNED');
        }

        const order = buildOrderItems(availableCourses, type, req.body?.couponCode);
        if (type === 'upgrade' && order.originalAmount <= 0) {
          return sendError(res, 409, 'Khóa học chưa được thiết lập giá nâng cấp.', 'UPGRADE_PRICE_REQUIRED');
        }

        if (order.amount <= 0) {
          const paidAt = new Date().toISOString();
          const freePayment = {
            id: createId(db.data.payments, 'pay-'),
            orderCode: createOrderCode(db.data.payments),
            userId: req.authUser.id,
            courseId: order.items.length === 1 ? order.items[0].courseId : null,
            items: order.items,
            originalAmount: order.originalAmount,
            discountAmount: order.discountAmount,
            amount: 0,
            currency: 'VND',
            method: 'free',
            provider: 'system',
            providerStatus: 'PAID',
            status: PAYMENT_STATUSES.PAID,
            type,
            description: 'FREE ENROLLMENT',
            couponCode: order.couponCode,
            createdAt: paidAt,
            paidAt,
          };
          db.data.payments.push(freePayment);
          order.items.forEach((item) => ensureEnrollment(db.data, freePayment, item, paidAt));
          addPaymentAuditLog(db.data, freePayment, 'PAYMENT_COMPLETED', paidAt);
          await db.write();
          return res.status(201).json({ payment: toClientPayment(freePayment), skippedCourseIds });
        }

        const orderKey = [
          req.authUser.id,
          type,
          order.items.map((item) => item.courseId).sort().join(','),
          order.couponCode || '',
        ].join('|');
        const reusable = db.data.payments.find((payment) => (
          isPayOSPayment(payment)
          && payment.orderKey === orderKey
          && payment.status === PAYMENT_STATUSES.PENDING
          && payment.checkoutUrl
          && Number(payment.expiresAt || 0) * 1000 > Date.now() + 30000
        ));
        if (reusable) {
          return res.json({ payment: toClientPayment(reusable), skippedCourseIds });
        }

        const orderCode = createOrderCode(db.data.payments);
        const expiredAt = Math.floor(Date.now() / 1000) + 15 * 60;
        const description = `IELTS ${orderCode}`;
        const paymentLink = await getClient().paymentRequests.create({
          orderCode,
          amount: order.amount,
          description,
          items: order.items.filter((item) => item.amount > 0).map((item) => ({
            name: item.courseTitle.slice(0, 25),
            quantity: 1,
            price: item.amount,
          })),
          buyerName: req.authUser.fullName || req.authUser.name || undefined,
          buyerEmail: req.authUser.email || undefined,
          returnUrl: config.returnUrl,
          cancelUrl: config.cancelUrl,
          expiredAt,
        });

        const createdAt = new Date().toISOString();
        const payment = {
          id: createId(db.data.payments, 'pay-'),
          orderCode,
          orderKey,
          userId: req.authUser.id,
          courseId: order.items.length === 1 ? order.items[0].courseId : null,
          items: order.items,
          originalAmount: order.originalAmount,
          discountAmount: order.discountAmount,
          amount: order.amount,
          currency: paymentLink.currency || 'VND',
          method: 'payos',
          provider: 'payos',
          providerStatus: paymentLink.status || 'PENDING',
          status: mapProviderStatus(paymentLink.status),
          type,
          description,
          checkoutUrl: paymentLink.checkoutUrl,
          paymentLinkId: paymentLink.paymentLinkId,
          couponCode: order.couponCode,
          createdAt,
          paidAt: null,
          cancelledAt: null,
          expiredAt: paymentLink.expiredAt || expiredAt,
        };
        db.data.payments.push(payment);
        await db.write();
        return res.status(201).json({ payment: toClientPayment(payment), skippedCourseIds });
      } catch (error) {
        console.error('[PayOS] Create payment failed:', error.message);
        const status = error.code === 'PAYOS_NOT_CONFIGURED' ? 503 : 502;
        return sendError(res, status, error.message || 'Không thể tạo link thanh toán PayOS.', error.code || 'PAYOS_CREATE_FAILED');
      }
    });
  });

  server.get('/payments/me', authenticate, async (req, res) => {
    await db.read();
    const url = new URL(req.url, 'http://localhost');
    const courseId = url.searchParams.get('courseId');
    const status = url.searchParams.get('status');
    const payments = (db.data.payments || [])
      .filter(isPayOSPayment)
      .filter((payment) => String(payment.userId) === String(req.authUser.id))
      .filter((payment) => paymentMatchesCourse(payment, courseId))
      .filter((payment) => !status || payment.status === status)
      .sort((left, right) => new Date(right.createdAt || 0) - new Date(left.createdAt || 0))
      .map(toClientPayment);
    return res.json({ data: payments });
  });

  server.post('/payments/:orderCode/sync', authenticate, async (req, res) => {
    try {
      await db.read();
      const payment = (db.data.payments || []).find((entry) => (
        isPayOSPayment(entry) && Number(entry.orderCode) === Number(req.params.orderCode)
      ));
      if (!payment) return sendError(res, 404, 'Không tìm thấy đơn thanh toán.', 'PAYMENT_NOT_FOUND');
      if (String(payment.userId) !== String(req.authUser.id) && req.authUser.role !== 'admin') {
        return sendError(res, 403, 'Bạn không có quyền xem đơn thanh toán này.', 'FORBIDDEN');
      }
      if (payment.status === PAYMENT_STATUSES.PAID) {
        return res.json({ payment: toClientPayment(payment) });
      }

      const providerPayment = await getClient().paymentRequests.get(Number(payment.orderCode));
      const updated = await syncFromProvider(payment, providerPayment);
      return res.json({ payment: toClientPayment(updated) });
    } catch (error) {
      console.error('[PayOS] Sync payment failed:', error.message);
      const status = error.code === 'PAYMENT_AMOUNT_MISMATCH' ? 409 : 502;
      return sendError(res, status, error.message || 'Không thể đồng bộ trạng thái PayOS.', error.code || 'PAYOS_SYNC_FAILED');
    }
  });

  server.post('/payments/payos/webhook', bodyParser, async (req, res) => {
    try {
      const verified = await getClient().webhooks.verify(req.body || {});
      await db.read();
      const payment = (db.data.payments || []).find((entry) => (
        isPayOSPayment(entry) && Number(entry.orderCode) === Number(verified.orderCode)
      ));
      if (!payment) {
        console.warn(`[PayOS] Ignored webhook for unknown order ${verified.orderCode}`);
        return res.json({ success: true });
      }

      const providerPayment = await getClient().paymentRequests.get(Number(payment.orderCode));
      await syncFromProvider(payment, providerPayment);
      return res.json({ success: true });
    } catch (error) {
      console.error('[PayOS] Invalid webhook:', error.message);
      return sendError(res, 400, 'Webhook PayOS không hợp lệ.', 'INVALID_PAYOS_WEBHOOK');
    }
  });

  server.get('/admin/transactions', authenticate, requireRole('admin'), async (req, res) => {
    await db.read();
    const url = new URL(req.url, 'http://localhost');
    const status = url.searchParams.get('status');
    const courseId = url.searchParams.get('courseId');
    const query = String(url.searchParams.get('q') || '').trim().toLowerCase();
    const transactions = (db.data.payments || [])
      .filter(isPayOSPayment)
      .filter((payment) => !status || payment.status === status)
      .filter((payment) => paymentMatchesCourse(payment, courseId))
      .map((payment) => buildAdminTransaction(payment, db.data))
      .filter((payment) => !query || [
        payment.orderCode,
        payment.providerReference,
        payment.userName,
        payment.userEmail,
        ...payment.courseTitles,
      ].some((value) => String(value || '').toLowerCase().includes(query)))
      .sort((left, right) => new Date(right.paidAt || right.createdAt || 0) - new Date(left.paidAt || left.createdAt || 0));
    const paid = transactions.filter((payment) => payment.status === PAYMENT_STATUSES.PAID);
    return res.json({
      data: transactions,
      summary: {
        totalRevenue: paid.reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
        paidOrders: paid.length,
        pendingOrders: transactions.filter((payment) => payment.status === PAYMENT_STATUSES.PENDING).length,
      },
    });
  });

  server.get('/admin/revenue', authenticate, requireRole('admin'), async (req, res) => {
    await db.read();
    const payments = (db.data.payments || []).filter(isPayOSPayment);
    return res.json({ data: buildRevenueReport(payments, db.data) });
  });

  const blockRawPayments = (req, res) => sendError(
    res,
    403,
    'Dữ liệu thanh toán chỉ được truy cập qua endpoint nghiệp vụ PayOS.',
    'RAW_PAYMENT_ACCESS_DISABLED',
  );
  ['get', 'post', 'put', 'patch', 'delete'].forEach((method) => {
    server[method]('/payments', blockRawPayments);
    server[method]('/payments/:id', blockRawPayments);
    server[method]('/transactions', blockRawPayments);
    server[method]('/transactions/:id', blockRawPayments);
  });

  return { config, getClient };
}

module.exports = {
  PAYMENT_STATUSES,
  applyProviderPaymentState,
  buildOrderItems,
  buildRevenueReport,
  calculateDiscount,
  createOrderCode,
  getPayOSConfig,
  isPayOSPayment,
  mapProviderStatus,
  normalizeProviderDateTime,
  normalizeCourseIds,
  registerPaymentRoutes,
};

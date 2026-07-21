const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const VALID_ROLES = ['student', 'teacher', 'admin'];
const ADMIN_CREATABLE_ROLES = ['student', 'teacher'];
const VALID_STATUSES = ['active', 'locked', 'banned'];
const SERVER_MANAGED_USER_ACTIONS = [
  'CREATE_USER',
  'UPDATE_USER',
  'CHANGE_USER_ROLE',
  'CHANGE_USER_STATUS',
  'DELETE_USER',
  'UNLOCK_USER',
];
const DEFAULT_JWT_SECRET = 'fer202-development-only-secret-change-me';
const PASSWORD_PATTERN = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
const FORGOT_PASSWORD_MESSAGE = 'Nếu email tồn tại, hệ thống đã tạo hướng dẫn đặt lại mật khẩu.';

const normalizeEmail = (value = '') => String(value).trim().toLowerCase();
const normalizeName = (value = '') => String(value).trim().replace(/\s+/g, ' ');
const hashResetToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

function sanitizeUser(user) {
  if (!user) return null;
  const {
    password,
    passwordHash,
    resetToken,
    resetTokenHash,
    ...safeUser
  } = user;
  return safeUser;
}

function isValidDateOfBirth(value) {
  if (!value) return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day
    && date <= new Date();
}

function validatePassword(password) {
  return PASSWORD_PATTERN.test(String(password || ''));
}

function sendError(res, status, message, code, errors) {
  return res.status(status).json({ message, code, ...(errors ? { errors } : {}) });
}

function createId(items, prefix) {
  const max = items.reduce((current, item) => {
    const match = String(item.id || '').match(new RegExp(`^${prefix}(\\d+)$`));
    return match ? Math.max(current, Number(match[1])) : current;
  }, 0);
  return `${prefix}${String(max + 1).padStart(3, '0')}`;
}

function registerAuthRoutes({ server, db, bodyParser }) {
  const jwtSecret = process.env.JWT_SECRET || DEFAULT_JWT_SECRET;
  const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '2h';
  const resetTokenMinutes = Math.max(5, Number(process.env.RESET_TOKEN_MINUTES) || 15);
  const demoResetEnabled = process.env.NODE_ENV !== 'production'
    && process.env.DEMO_RESET_MODE !== 'false';

  if (!process.env.JWT_SECRET) {
    console.warn('[Auth] JWT_SECRET is not set. Using the FER202 development-only fallback.');
  }

  const originalRead = db.read.bind(db);
  db.read = async () => {
    await originalRead();
    db.data = db.data || {};
    db.data.users = db.data.users || [];
    db.data.passwordResetTokens = db.data.passwordResetTokens || [];
    db.data.verificationTokens = db.data.verificationTokens || [];
    db.data.auditLogs = db.data.auditLogs || [];
  };
  let userWriteQueue = Promise.resolve();

  const enqueueUserWrite = (work) => {
    const next = userWriteQueue.then(work, work);
    userWriteQueue = next.catch(() => undefined);
    return next;
  };

  const addAuditLog = (actorId, action, targetId, oldValue, newValue) => {
    const log = {
      id: createId(db.data.auditLogs || [], 'log-'),
      actorId,
      action,
      targetType: 'user',
      targetId,
      oldValue: oldValue || null,
      newValue: newValue || null,
      createdAt: new Date().toISOString(),
    };
    db.data.auditLogs.push(log);
    return log;
  };

  const findUserByEmail = (email) => {
    const normalized = normalizeEmail(email);
    return db.data.users.find((user) => normalizeEmail(user.email) === normalized);
  };

  const updateExpiredLock = async (user) => {
    if (user.status !== 'locked' || !user.lockedUntil) return user;
    const expiry = new Date(user.lockedUntil);
    if (!Number.isNaN(expiry.getTime()) && expiry <= new Date()) {
      user.status = 'active';
      delete user.lockedUntil;
      await db.write();
    }
    return user;
  };

  const signAccessToken = (user) => jwt.sign(
    { sub: String(user.id), role: user.role },
    jwtSecret,
    { expiresIn: jwtExpiresIn, issuer: 'ielts-master-fer202', audience: 'ielts-master-web' },
  );

  const authenticate = async (req, res, next) => {
    const header = req.headers.authorization || '';
    const match = header.match(/^Bearer\s+(.+)$/i);
    if (!match) {
      return sendError(res, 401, 'Bạn chưa đăng nhập.', 'AUTH_REQUIRED');
    }

    try {
      const payload = jwt.verify(match[1], jwtSecret, {
        issuer: 'ielts-master-fer202',
        audience: 'ielts-master-web',
      });
      await db.read();
      const user = db.data.users.find((candidate) => String(candidate.id) === String(payload.sub));
      if (!user) {
        return sendError(res, 401, 'Phiên đăng nhập không còn hợp lệ.', 'SESSION_INVALID');
      }
      await updateExpiredLock(user);
      if (user.status === 'locked') {
        return sendError(res, 403, 'Tài khoản đang bị khóa.', 'ACCOUNT_LOCKED');
      }
      if (user.status === 'banned') {
        return sendError(res, 403, 'Tài khoản đã bị cấm.', 'ACCOUNT_BANNED');
      }
      if (user.status !== 'active' || !VALID_ROLES.includes(user.role)) {
        return sendError(res, 403, 'Tài khoản không thể truy cập hệ thống.', 'ACCOUNT_INACTIVE');
      }
      req.authUser = user;
      req.authToken = payload;
      return next();
    } catch (error) {
      const expired = error && error.name === 'TokenExpiredError';
      return sendError(
        res,
        401,
        expired ? 'Phiên đăng nhập đã hết hạn.' : 'Token đăng nhập không hợp lệ.',
        expired ? 'TOKEN_EXPIRED' : 'TOKEN_INVALID',
      );
    }
  };

  const requireRole = (...roles) => (req, res, next) => {
    if (!req.authUser || !roles.includes(req.authUser.role)) {
      return sendError(res, 403, 'Bạn không có quyền thực hiện thao tác này.', 'FORBIDDEN');
    }
    return next();
  };

  const validateCommonUserFields = (payload, { requirePassword = false } = {}) => {
    const errors = {};
    const fullName = normalizeName(payload.fullName || payload.name);
    const email = normalizeEmail(payload.email);

    if (!fullName || fullName.length < 2 || fullName.length > 50) {
      errors.fullName = 'Họ tên phải có từ 2 đến 50 ký tự.';
    } else if (/[\d!@#$%^&*()_+=[\]{};':"\\|,.<>/?]+/.test(fullName)) {
      errors.fullName = 'Họ tên không được chứa số hoặc ký tự đặc biệt.';
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      errors.email = 'Email không hợp lệ.';
    }
    if (!isValidDateOfBirth(payload.dateOfBirth)) {
      errors.dateOfBirth = 'Ngày sinh không hợp lệ hoặc nằm trong tương lai.';
    }
    if (requirePassword && !validatePassword(payload.password)) {
      errors.password = 'Mật khẩu phải có ít nhất 8 ký tự, gồm chữ cái, số và ký tự đặc biệt.';
    }
    return { errors, fullName, email };
  };

  server.get('/health', (req, res) => res.json({
    status: 'ok',
    service: 'ielts-fer202-custom-server',
    authRoutes: true,
    timestamp: new Date().toISOString(),
  }));

  server.post('/auth/register', bodyParser, async (req, res) => {
    const payload = req.body || {};
    const { errors, fullName, email } = validateCommonUserFields(payload, { requirePassword: true });
    if (!payload.confirmPassword || payload.password !== payload.confirmPassword) {
      errors.confirmPassword = 'Mật khẩu xác nhận không khớp.';
    }
    if (Object.keys(errors).length) {
      return sendError(res, 400, 'Dữ liệu đăng ký không hợp lệ.', 'VALIDATION_ERROR', errors);
    }

    return enqueueUserWrite(async () => {
      await db.read();
      if (findUserByEmail(email)) {
        return sendError(res, 409, 'Email đã được đăng ký.', 'EMAIL_EXISTS', { email: 'Email đã được đăng ký.' });
      }
      const now = new Date().toISOString();
      const user = {
        id: createId(db.data.users, 'u-student-'),
        fullName,
        name: fullName,
        email,
        passwordHash: await bcrypt.hash(String(payload.password), 10),
        role: 'student',
        status: 'pending_verification',
        avatar: '',
        dateOfBirth: payload.dateOfBirth || '',
        currentBand: 0,
        targetBand: 0,
        createdAt: now,
        updatedAt: now,
      };
      db.data.users.push(user);
      
      const token = crypto.randomBytes(32).toString('hex');
      db.data.verificationTokens.push({
        id: createId(db.data.verificationTokens, 'vt-'),
        userId: user.id,
        tokenHash: hashResetToken(token),
        expiresAt: new Date(new Date().getTime() + 24 * 60 * 60 * 1000).toISOString(),
        usedAt: null,
        createdAt: now,
      });

      await db.write();

      // Configure nodemailer using environment variables
      const transporter = nodemailer.createTransport({
        host: process.env.MAIL_SMTP_HOST || 'smtp.gmail.com',
        port: Number(process.env.MAIL_SMTP_PORT) || 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.MAIL_SMTP_USERNAME,
          pass: process.env.MAIL_SMTP_PASSWORD,
        },
      });

      const verifyLink = `http://localhost:3000/verify-email?token=${token}`;

      const mailOptions = {
        from: `"${process.env.REACT_APP_NAME || 'IELTS Master'}" <${process.env.MAIL_FROM || process.env.MAIL_SMTP_USERNAME}>`,
        to: email,
        subject: 'Xác thực tài khoản của bạn',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #0f172a; padding: 24px 32px;">
              <h2 style="margin: 0; font-size: 24px;">
                <span style="color: #ffffff;">IELTS</span><span style="color: #fbbf24;">Master</span>
              </h2>
              <div style="color: #94a3b8; font-size: 14px; margin-top: 4px;">Xác thực tài khoản</div>
            </div>
            <div style="padding: 32px; background-color: #ffffff;">
              <p style="font-size: 16px; color: #334155; margin-top: 0;">Xin chào <strong>${fullName}</strong>,</p>
              <p style="font-size: 16px; color: #334155; line-height: 1.5;">Cảm ơn bạn đã đăng ký tài khoản tại IELTS Master. Vui lòng click vào nút bên dưới để xác thực địa chỉ email của bạn. Link này có hiệu lực trong vòng 24 giờ.</p>
              <div style="text-align: center; margin: 32px 0;">
                <a href="${verifyLink}" style="background-color: #4f46e5; color: #ffffff; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">Xác thực tài khoản</a>
              </div>
              <p style="font-size: 14px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 20px; margin-bottom: 0;">Nếu bạn không yêu cầu đăng ký tài khoản, vui lòng bỏ qua email này.</p>
            </div>
          </div>
        `
      };

      try {
        await transporter.sendMail(mailOptions);
        console.log(`[Email] Verification email sent to ${email}`);
      } catch (mailError) {
        console.error('[Email] Failed to send verification email:', mailError);
      }

      return res.status(201).json({ user: sanitizeUser(user), message: 'Vui lòng kiểm tra email để xác thực tài khoản.' });
    });
  });

  server.post('/auth/verify-email', bodyParser, async (req, res) => {
    const token = String((req.body && req.body.token) || '');
    if (!token) return sendError(res, 400, 'Token xác thực là bắt buộc.', 'TOKEN_REQUIRED');

    await db.read();
    const tokenHash = hashResetToken(token);
    const now = new Date();
    
    const tokenEntry = db.data.verificationTokens.find(
      (t) => t.tokenHash === tokenHash && !t.usedAt && new Date(t.expiresAt) > now
    );

    if (!tokenEntry) {
      return sendError(res, 400, 'Token xác thực không hợp lệ hoặc đã hết hạn.', 'INVALID_TOKEN');
    }

    const user = db.data.users.find((u) => u.id === tokenEntry.userId);
    if (!user) {
      return sendError(res, 404, 'Tài khoản không tồn tại.', 'USER_NOT_FOUND');
    }

    user.status = 'active';
    user.updatedAt = now.toISOString();
    tokenEntry.usedAt = now.toISOString();

    await db.write();

    return res.json({ message: 'Tài khoản đã được xác thực thành công.', user: sanitizeUser(user) });
  });

  server.post('/auth/login', bodyParser, async (req, res) => {
    const email = normalizeEmail(req.body && req.body.email);
    const password = String((req.body && req.body.password) || '');
    if (!email || !password) {
      return sendError(res, 400, 'Vui lòng nhập email và mật khẩu.', 'VALIDATION_ERROR');
    }

    await db.read();
    const user = findUserByEmail(email);
    const passwordMatches = Boolean(user && user.passwordHash)
      && await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      return sendError(res, 401, 'Email hoặc mật khẩu không đúng.', 'INVALID_CREDENTIALS');
    }

    await updateExpiredLock(user);
    if (user.status === 'locked') {
      return sendError(res, 403, 'Tài khoản đang bị khóa.', 'ACCOUNT_LOCKED');
    }
    if (user.status === 'banned') {
      return sendError(res, 403, 'Tài khoản đã bị cấm.', 'ACCOUNT_BANNED');
    }
    if (user.status === 'pending_verification') {
      return sendError(res, 403, 'Tài khoản chưa được xác thực. Vui lòng kiểm tra email để kích hoạt.', 'ACCOUNT_PENDING');
    }
    if (user.status !== 'active' || !VALID_ROLES.includes(user.role)) {
      return sendError(res, 403, 'Tài khoản không thể đăng nhập.', 'ACCOUNT_INACTIVE');
    }

    const token = signAccessToken(user);
    const decoded = jwt.decode(token);
    return res.json({
      token,
      expiresAt: new Date(decoded.exp * 1000).toISOString(),
      user: sanitizeUser(user),
    });
  });

  server.get('/auth/me', authenticate, (req, res) => {
    return res.json({ user: sanitizeUser(req.authUser) });
  });

  server.post('/auth/forgot-password', bodyParser, async (req, res) => {
    const email = normalizeEmail(req.body && req.body.email);
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return sendError(res, 400, 'Email không hợp lệ.', 'VALIDATION_ERROR', { email: 'Email không hợp lệ.' });
    }
    await db.read();
    const user = findUserByEmail(email);
    if (!user) {
      return sendError(res, 404, 'Tài khoản không tồn tại trong hệ thống.', 'ACCOUNT_NOT_FOUND', { email: 'Email chưa được đăng ký.' });
    }

    const response = { message: 'Đã gửi email khôi phục thành công. Vui lòng kiểm tra hộp thư của bạn.' };

    const token = crypto.randomBytes(32).toString('hex');
      const now = new Date();
      db.data.passwordResetTokens
        .filter((entry) => entry.userId === user.id && !entry.usedAt)
        .forEach((entry) => { entry.usedAt = now.toISOString(); });
      db.data.passwordResetTokens.push({
        id: createId(db.data.passwordResetTokens, 'prt-'),
        userId: user.id,
        tokenHash: hashResetToken(token),
        expiresAt: new Date(now.getTime() + resetTokenMinutes * 60 * 1000).toISOString(),
        usedAt: null,
        createdAt: now.toISOString(),
      });
      await db.write();

      // Configure nodemailer using environment variables
      const transporter = nodemailer.createTransport({
        host: process.env.MAIL_SMTP_HOST || 'smtp.gmail.com',
        port: Number(process.env.MAIL_SMTP_PORT) || 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.MAIL_SMTP_USERNAME,
          pass: process.env.MAIL_SMTP_PASSWORD,
        },
      });

      const resetLink = `http://localhost:3000/reset-password?token=${token}`;

      const mailOptions = {
        from: `"${process.env.REACT_APP_NAME || 'IELTS Master'}" <${process.env.MAIL_FROM || process.env.MAIL_SMTP_USERNAME}>`,
        to: email,
        subject: 'Yêu cầu đặt lại mật khẩu',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #0f172a; padding: 24px 32px;">
              <h2 style="margin: 0; font-size: 24px;">
                <span style="color: #ffffff;">IELTS</span><span style="color: #fbbf24;">Master</span>
              </h2>
              <div style="color: #94a3b8; font-size: 14px; margin-top: 4px;">Khôi phục mật khẩu</div>
            </div>
            <div style="padding: 32px; background-color: #ffffff;">
              <p style="font-size: 16px; color: #334155; margin-top: 0;">Xin chào,</p>
              <p style="font-size: 16px; color: #334155; line-height: 1.5;">Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản IELTS Master của bạn. Vui lòng click vào nút bên dưới để tạo mật khẩu mới. Link này có hiệu lực trong vòng ${resetTokenMinutes} phút.</p>
              <div style="text-align: center; margin: 32px 0;">
                <a href="${resetLink}" style="background-color: #4f46e5; color: #ffffff; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">Đặt lại mật khẩu</a>
              </div>
              <p style="font-size: 14px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 20px; margin-bottom: 0;">Nếu bạn không yêu cầu khôi phục mật khẩu, tài khoản của bạn vẫn an toàn và bạn có thể bỏ qua email này.</p>
            </div>
          </div>
        `
      };

      try {
        await transporter.sendMail(mailOptions);
        console.log(`[Email] Password reset email sent to ${email}`);
      } catch (mailError) {
        console.error('[Email] Failed to send password reset email:', mailError);
      }

    return res.json(response);
  });

  server.post('/auth/reset-password', bodyParser, async (req, res) => {
    const token = String((req.body && req.body.token) || '');
    const newPassword = String((req.body && req.body.newPassword) || '');
    const confirmPassword = String((req.body && req.body.confirmPassword) || '');
    if (!token) {
      return sendError(res, 400, 'Reset token là bắt buộc.', 'RESET_TOKEN_REQUIRED');
    }
    if (!validatePassword(newPassword)) {
      return sendError(res, 400, 'Mật khẩu mới phải có ít nhất 8 ký tự, gồm chữ cái, số và ký tự đặc biệt.', 'WEAK_PASSWORD');
    }
    if (newPassword !== confirmPassword) {
      return sendError(res, 400, 'Mật khẩu xác nhận không khớp.', 'PASSWORD_MISMATCH');
    }

    return enqueueUserWrite(async () => {
      await db.read();
      const entry = db.data.passwordResetTokens.find((candidate) => candidate.tokenHash === hashResetToken(token));
      if (!entry) {
        return sendError(res, 400, 'Reset token không hợp lệ.', 'RESET_TOKEN_INVALID');
      }
      if (entry.usedAt) {
        return sendError(res, 400, 'Reset token đã được sử dụng.', 'RESET_TOKEN_USED');
      }
      if (new Date(entry.expiresAt) <= new Date()) {
        return sendError(res, 400, 'Reset token đã hết hạn.', 'RESET_TOKEN_EXPIRED');
      }
      const user = db.data.users.find((candidate) => candidate.id === entry.userId);
      if (!user) {
        return sendError(res, 400, 'Reset token không hợp lệ.', 'RESET_TOKEN_INVALID');
      }
      user.passwordHash = await bcrypt.hash(newPassword, 10);
      user.updatedAt = new Date().toISOString();
      entry.usedAt = user.updatedAt;
      await db.write();
      return res.json({ message: 'Đặt lại mật khẩu thành công. Bạn có thể đăng nhập bằng mật khẩu mới.' });
    });
  });

  server.post('/auth/change-password', authenticate, bodyParser, async (req, res) => {
    const currentPassword = String((req.body && req.body.currentPassword) || '');
    const newPassword = String((req.body && req.body.newPassword) || '');
    const confirmPassword = String((req.body && req.body.confirmPassword) || '');
    if (!await bcrypt.compare(currentPassword, req.authUser.passwordHash || '')) {
      return sendError(res, 400, 'Mật khẩu hiện tại không đúng.', 'CURRENT_PASSWORD_INVALID');
    }
    if (!validatePassword(newPassword)) {
      return sendError(res, 400, 'Mật khẩu mới phải có ít nhất 8 ký tự, gồm chữ cái, số và ký tự đặc biệt.', 'WEAK_PASSWORD');
    }
    if (newPassword !== confirmPassword) {
      return sendError(res, 400, 'Mật khẩu xác nhận không khớp.', 'PASSWORD_MISMATCH');
    }
    if (await bcrypt.compare(newPassword, req.authUser.passwordHash)) {
      return sendError(res, 400, 'Mật khẩu mới phải khác mật khẩu hiện tại.', 'PASSWORD_REUSED');
    }
    req.authUser.passwordHash = await bcrypt.hash(newPassword, 10);
    req.authUser.updatedAt = new Date().toISOString();
    await db.write();
    return res.json({ message: 'Đổi mật khẩu thành công.' });
  });

  server.patch('/auth/profile', authenticate, bodyParser, async (req, res) => {
    const payload = req.body || {};
    const errors = {};
    const updates = {};
    if (payload.fullName !== undefined) {
      const fullName = normalizeName(payload.fullName);
      if (fullName.length < 2 || fullName.length > 100) errors.fullName = 'Họ tên phải có từ 2 đến 100 ký tự.';
      else {
        updates.fullName = fullName;
        updates.name = fullName;
      }
    }
    if (payload.dateOfBirth !== undefined) {
      if (!isValidDateOfBirth(payload.dateOfBirth)) errors.dateOfBirth = 'Ngày sinh không hợp lệ hoặc nằm trong tương lai.';
      else updates.dateOfBirth = payload.dateOfBirth;
    }
    if (payload.avatar !== undefined) {
      const avatar = String(payload.avatar || '').trim();
      if (avatar && !/^(https?:\/\/|data:image\/)/i.test(avatar)) errors.avatar = 'Avatar phải là URL http(s) hoặc data image hợp lệ.';
      else updates.avatar = avatar;
    }
    if (req.authUser.role === 'student') {
      ['currentBand', 'targetBand'].forEach((field) => {
        if (payload[field] !== undefined) {
          const value = Number(payload[field]);
          if (!Number.isFinite(value) || value < 0 || value > 9 || value * 2 !== Math.round(value * 2)) {
            errors[field] = 'Band score phải từ 0 đến 9 theo bước 0.5.';
          } else updates[field] = value;
        }
      });
      const currentBand = updates.currentBand ?? Number(req.authUser.currentBand || 0);
      const targetBand = updates.targetBand ?? Number(req.authUser.targetBand || 0);
      if (targetBand < currentBand) errors.targetBand = 'Band mục tiêu phải lớn hơn hoặc bằng band hiện tại.';
    }
    if (Object.keys(errors).length) {
      return sendError(res, 400, 'Dữ liệu hồ sơ không hợp lệ.', 'VALIDATION_ERROR', errors);
    }
    Object.assign(req.authUser, updates, { updatedAt: new Date().toISOString() });
    await db.write();
    return res.json({ user: sanitizeUser(req.authUser) });
  });

  server.get('/teacher/students', authenticate, requireRole('teacher', 'admin'), async (req, res) => {
    await db.read();
    return res.json({
      data: db.data.users
        .filter((user) => user.role === 'student')
        .map((user) => sanitizeUser(user)),
    });
  });

  server.get('/admin/users/summary', authenticate, requireRole('admin'), async (req, res) => {
    await db.read();
    return res.json({
      data: db.data.users.map((user) => ({
        id: user.id,
        fullName: user.fullName || user.name || '',
        name: user.name || user.fullName || '',
        email: user.email,
        role: user.role,
        status: user.status,
      })),
    });
  });

  server.get('/admin/dashboard/summary', authenticate, requireRole('admin'), async (req, res) => {
    await db.read();
    const auditLogs = Array.isArray(db.data.auditLogs) ? db.data.auditLogs : [];
    const recentLogs = [...auditLogs]
      .sort((left, right) => new Date(right.createdAt || 0) - new Date(left.createdAt || 0))
      .slice(0, 5);

    return res.json({
      data: {
        stats: {
          totalUsers: Array.isArray(db.data.users) ? db.data.users.length : 0,
          totalCourses: Array.isArray(db.data.courses) ? db.data.courses.length : 0,
          pendingContent: Array.isArray(db.data.approvalRequests)
            ? db.data.approvalRequests.filter((request) => request.status === 'pending').length
            : 0,
          totalLogs: auditLogs.length,
        },
        recentLogs,
        generatedAt: new Date().toISOString(),
      },
    });
  });

  server.get('/admin/users', authenticate, requireRole('admin'), async (req, res) => {
    await db.read();
    const url = new URL(req.url, 'http://localhost');
    const q = String(url.searchParams.get('q') || '').trim().toLowerCase();
    const role = String(url.searchParams.get('role') || '');
    const status = String(url.searchParams.get('status') || '');
    const page = Math.max(1, Number(url.searchParams.get('page') || url.searchParams.get('_page')) || 1);
    const pageSize = Math.min(50, Math.max(1, Number(url.searchParams.get('pageSize') || url.searchParams.get('_per_page')) || 10));
    if (role && !VALID_ROLES.includes(role)) return sendError(res, 400, 'Role lọc không hợp lệ.', 'INVALID_ROLE');
    if (status && !VALID_STATUSES.includes(status)) return sendError(res, 400, 'Status lọc không hợp lệ.', 'INVALID_STATUS');
    const filtered = db.data.users.filter((user) => {
      const matchesQuery = !q || normalizeName(user.fullName || user.name).toLowerCase().includes(q) || normalizeEmail(user.email).includes(q);
      return matchesQuery && (!role || user.role === role) && (!status || user.status === status);
    });
    const total = filtered.length;
    const data = filtered.slice((page - 1) * pageSize, page * pageSize).map(sanitizeUser);
    return res.json({ data, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) });
  });

  server.get('/admin/users/:id', authenticate, requireRole('admin'), async (req, res) => {
    await db.read();
    const user = db.data.users.find((candidate) => String(candidate.id) === String(req.params.id));
    if (!user) return sendError(res, 404, 'Không tìm thấy người dùng.', 'USER_NOT_FOUND');
    return res.json({ user: sanitizeUser(user) });
  });

  server.post('/admin/users', authenticate, requireRole('admin'), bodyParser, async (req, res) => {
    const payload = req.body || {};
    const { errors, fullName, email } = validateCommonUserFields(payload, { requirePassword: true });
    if (!ADMIN_CREATABLE_ROLES.includes(payload.role)) errors.role = 'Admin chỉ có thể tạo Student hoặc Teacher.';
    if (payload.status !== undefined && !VALID_STATUSES.includes(payload.status)) errors.status = 'Trạng thái không hợp lệ.';
    if (Object.keys(errors).length) return sendError(res, 400, 'Dữ liệu tài khoản không hợp lệ.', 'VALIDATION_ERROR', errors);

    return enqueueUserWrite(async () => {
      await db.read();
      if (findUserByEmail(email)) return sendError(res, 409, 'Email đã tồn tại.', 'EMAIL_EXISTS', { email: 'Email đã tồn tại.' });
      const now = new Date().toISOString();
      const user = {
        id: createId(db.data.users, `u-${payload.role}-`),
        fullName,
        name: fullName,
        email,
        passwordHash: await bcrypt.hash(String(payload.password), 10),
        role: payload.role,
        status: payload.status || 'active',
        avatar: String(payload.avatar || '').trim(),
        dateOfBirth: payload.dateOfBirth || '',
        ...(payload.role === 'student' ? { currentBand: 0, targetBand: 0 } : {}),
        createdAt: now,
        updatedAt: now,
      };
      db.data.users.push(user);
      addAuditLog(req.authUser.id, 'CREATE_USER', user.id, null, sanitizeUser(user));
      await db.write();
      return res.status(201).json({ user: sanitizeUser(user) });
    });
  });

  server.patch('/admin/users/:id', authenticate, requireRole('admin'), bodyParser, async (req, res) => {
    return enqueueUserWrite(async () => {
      await db.read();
      const user = db.data.users.find((candidate) => String(candidate.id) === String(req.params.id));
      if (!user) return sendError(res, 404, 'Không tìm thấy người dùng.', 'USER_NOT_FOUND');
      const payload = req.body || {};
      const errors = {};
      const updates = {};
      if (payload.fullName !== undefined || payload.name !== undefined) {
        const fullName = normalizeName(payload.fullName || payload.name);
        if (fullName.length < 2 || fullName.length > 100) errors.fullName = 'Họ tên phải có từ 2 đến 100 ký tự.';
        else Object.assign(updates, { fullName, name: fullName });
      }
      if (payload.email !== undefined) {
        const email = normalizeEmail(payload.email);
        if (!/^\S+@\S+\.\S+$/.test(email)) errors.email = 'Email không hợp lệ.';
        else if (db.data.users.some((candidate) => candidate.id !== user.id && normalizeEmail(candidate.email) === email)) errors.email = 'Email đã tồn tại.';
        else updates.email = email;
      }
      if (payload.dateOfBirth !== undefined) {
        if (!isValidDateOfBirth(payload.dateOfBirth)) errors.dateOfBirth = 'Ngày sinh không hợp lệ hoặc nằm trong tương lai.';
        else updates.dateOfBirth = payload.dateOfBirth;
      }
      if (payload.avatar !== undefined) updates.avatar = String(payload.avatar || '').trim();
      if (payload.role !== undefined) {
        if (!VALID_ROLES.includes(payload.role)) errors.role = 'Role không hợp lệ.';
        else if (user.id === req.authUser.id && payload.role !== user.role) errors.role = 'Bạn không thể tự thay đổi role của mình.';
        else if (user.role === 'admin' && payload.role !== 'admin' && db.data.users.filter((candidate) => candidate.role === 'admin').length <= 1) errors.role = 'Không thể hạ role của Admin cuối cùng.';
        else updates.role = payload.role;
      }
      if (Object.keys(errors).length) {
        const emailConflict = errors.email === 'Email đã tồn tại.';
        return sendError(res, emailConflict ? 409 : 400, 'Không thể cập nhật tài khoản.', emailConflict ? 'EMAIL_EXISTS' : 'VALIDATION_ERROR', errors);
      }
      const oldSafe = sanitizeUser({ ...user });
      const oldRole = user.role;
      Object.assign(user, updates, { updatedAt: new Date().toISOString() });
      const changedProfile = ['fullName', 'name', 'email', 'dateOfBirth', 'avatar'].some((field) => Object.prototype.hasOwnProperty.call(updates, field));
      if (changedProfile) addAuditLog(req.authUser.id, 'UPDATE_USER', user.id, oldSafe, sanitizeUser(user));
      if (updates.role !== undefined && updates.role !== oldRole) {
        addAuditLog(req.authUser.id, 'CHANGE_USER_ROLE', user.id, { role: oldRole }, { role: user.role });
      }
      await db.write();
      return res.json({ user: sanitizeUser(user) });
    });
  });

  server.patch('/admin/users/:id/status', authenticate, requireRole('admin'), bodyParser, async (req, res) => {
    return enqueueUserWrite(async () => {
      await db.read();
      const user = db.data.users.find((candidate) => String(candidate.id) === String(req.params.id));
      if (!user) return sendError(res, 404, 'Không tìm thấy người dùng.', 'USER_NOT_FOUND');
      const status = String((req.body && req.body.status) || '');
      if (!VALID_STATUSES.includes(status)) return sendError(res, 400, 'Status không hợp lệ.', 'INVALID_STATUS');
      if (user.id === req.authUser.id && status !== user.status) return sendError(res, 403, 'Bạn không thể tự thay đổi trạng thái tài khoản.', 'SELF_STATUS_CHANGE');
      const oldStatus = user.status;
      const oldLockedUntil = user.lockedUntil || null;
      user.status = status;
      if (status === 'active') delete user.lockedUntil;
      else if (status === 'locked') {
        const requestedUntil = req.body && req.body.lockedUntil;
        if (requestedUntil && Number.isNaN(new Date(requestedUntil).getTime())) return sendError(res, 400, 'Thời hạn khóa không hợp lệ.', 'INVALID_LOCK_EXPIRY');
        if (requestedUntil) user.lockedUntil = new Date(requestedUntil).toISOString();
        else delete user.lockedUntil;
      } else delete user.lockedUntil;
      user.updatedAt = new Date().toISOString();
      const action = oldStatus === 'locked' && status === 'active' ? 'UNLOCK_USER' : 'CHANGE_USER_STATUS';
      addAuditLog(
        req.authUser.id,
        action,
        user.id,
        { status: oldStatus, lockedUntil: oldLockedUntil },
        { status: user.status, lockedUntil: user.lockedUntil || null },
      );
      await db.write();
      return res.json({ user: sanitizeUser(user) });
    });
  });

  server.delete('/admin/users/:id', authenticate, requireRole('admin'), async (req, res) => {
    return enqueueUserWrite(async () => {
      await db.read();
      const index = db.data.users.findIndex((candidate) => String(candidate.id) === String(req.params.id));
      if (index === -1) return sendError(res, 404, 'Không tìm thấy người dùng.', 'USER_NOT_FOUND');
      const user = db.data.users[index];
      if (user.id === req.authUser.id) return sendError(res, 403, 'Bạn không thể tự xóa tài khoản của mình.', 'SELF_DELETE');
      if (user.role === 'admin' && db.data.users.filter((candidate) => candidate.role === 'admin').length <= 1) {
        return sendError(res, 409, 'Không thể xóa Admin cuối cùng.', 'LAST_ADMIN');
      }
      const references = [
        ['enrollments', ['userId']],
        ['payments', ['userId']],
        ['transactions', ['userId']],
        ['testAttempts', ['userId']],
        ['lessonProgress', ['userId']],
        ['flashcardProgress', ['userId']],
        ['courses', ['teacherId']],
        ['lessons', ['teacherId']],
      ].filter(([collection, fields]) => (db.data[collection] || []).some((item) => fields.some((field) => String(item[field]) === String(user.id))));
      if (references.length) {
        return sendError(
          res,
          409,
          `Không thể xóa vì tài khoản còn dữ liệu liên quan: ${references.map(([name]) => name).join(', ')}.`,
          'USER_HAS_REFERENCES',
        );
      }
      const oldValue = sanitizeUser(user);
      db.data.users.splice(index, 1);
      db.data.passwordResetTokens = db.data.passwordResetTokens.filter((entry) => entry.userId !== user.id);
      addAuditLog(req.authUser.id, 'DELETE_USER', user.id, oldValue, null);
      await db.write();
      return res.json({ message: 'Xóa tài khoản thành công.' });
    });
  });

  server.get('/admin/audit-logs', authenticate, requireRole('admin'), async (req, res) => {
    await db.read();
    return res.json({ data: db.data.auditLogs || [] });
  });

  server.get('/auditLogs', authenticate, requireRole('admin'), async (req, res) => {
    await db.read();
    return res.json((db.data.auditLogs || []));
  });

  server.post('/auditLogs', authenticate, requireRole('teacher', 'admin'), bodyParser, async (req, res) => {
    const payload = req.body || {};
    const action = String(payload.action || 'UNKNOWN').trim().toUpperCase();
    if (SERVER_MANAGED_USER_ACTIONS.includes(action)) {
      return sendError(
        res,
        403,
        'Audit log quản trị user chỉ được tạo tự động cùng thao tác phía server.',
        'SERVER_MANAGED_AUDIT_ONLY',
      );
    }
    const details = payload.details && typeof payload.details === 'object'
      ? payload.details
      : { value: payload.details || null };
    const log = {
      id: createId(db.data.auditLogs || [], 'log-'),
      actorId: req.authUser.id,
      action,
      targetType: String(payload.targetType || details.targetType || 'activity'),
      targetId: String(payload.targetId || details.targetId || details.id || 'unknown'),
      oldValue: payload.oldValue || null,
      newValue: payload.newValue || details,
      createdAt: new Date().toISOString(),
    };
    db.data.auditLogs.push(log);
    await db.write();
    return res.status(201).json(log);
  });

  const blockResetTokenStore = (req, res) => sendError(
    res,
    403,
    'Kho reset token là dữ liệu nội bộ và không được truy cập trực tiếp.',
    'RESET_TOKEN_STORE_DISABLED',
  );
  server.get('/passwordResetTokens', blockResetTokenStore);
  server.post('/passwordResetTokens', blockResetTokenStore);
  server.put('/passwordResetTokens', blockResetTokenStore);
  server.patch('/passwordResetTokens', blockResetTokenStore);
  server.delete('/passwordResetTokens', blockResetTokenStore);
  server.get('/passwordResetTokens/:id', blockResetTokenStore);
  server.put('/passwordResetTokens/:id', blockResetTokenStore);
  server.patch('/passwordResetTokens/:id', blockResetTokenStore);
  server.delete('/passwordResetTokens/:id', blockResetTokenStore);

  const blockRawAuditMutation = (req, res) => sendError(
    res,
    403,
    'Audit log chỉ được ghi qua endpoint nghiệp vụ và không thể sửa hoặc xóa trực tiếp.',
    'AUDIT_LOG_IMMUTABLE',
  );
  server.get('/auditLogs/:id', blockRawAuditMutation);
  server.put('/auditLogs', blockRawAuditMutation);
  server.patch('/auditLogs', blockRawAuditMutation);
  server.delete('/auditLogs', blockRawAuditMutation);
  server.put('/auditLogs/:id', blockRawAuditMutation);
  server.patch('/auditLogs/:id', blockRawAuditMutation);
  server.delete('/auditLogs/:id', blockRawAuditMutation);

  const blockRawUsers = (req, res) => sendError(
    res,
    403,
    'Raw /users bị vô hiệu hóa. Hãy dùng endpoint Auth, Teacher hoặc Admin phù hợp.',
    'RAW_USERS_DISABLED',
  );
  server.get('/users', blockRawUsers);
  server.post('/users', blockRawUsers);
  server.put('/users', blockRawUsers);
  server.patch('/users', blockRawUsers);
  server.delete('/users', blockRawUsers);
  server.put('/users/:id', blockRawUsers);
  server.patch('/users/:id', blockRawUsers);
  server.delete('/users/:id', blockRawUsers);
  server.get('/users/:id', blockRawUsers);

  return {
    authenticate,
    requireRole,
    sanitizeUser,
  };
}

module.exports = {
  DEFAULT_JWT_SECRET,
  FORGOT_PASSWORD_MESSAGE,
  PASSWORD_PATTERN,
  VALID_ROLES,
  VALID_STATUSES,
  hashResetToken,
  isValidDateOfBirth,
  normalizeEmail,
  sanitizeUser,
  validatePassword,
  registerAuthRoutes,
};

const {
  hashResetToken,
  isValidDateOfBirth,
  normalizeEmail,
  sanitizeUser,
  validatePassword,
} = require('../../server/authRoutes');

describe('backend Auth security helpers', () => {
  test('normalizes email and enforces the documented password rule', () => {
    expect(normalizeEmail('  Admin@Example.COM ')).toBe('admin@example.com');
    expect(validatePassword('StrongPass1')).toBe(true);
    expect(validatePassword('alllowercase1')).toBe(false);
    expect(validatePassword('NOLOWERCASE1')).toBe(false);
    expect(validatePassword('NoNumberHere')).toBe(false);
    expect(validatePassword('Short1A')).toBe(false);
  });

  test('rejects impossible and future dates while accepting leap days', () => {
    expect(isValidDateOfBirth('2000-02-29')).toBe(true);
    expect(isValidDateOfBirth('2001-02-29')).toBe(false);
    expect(isValidDateOfBirth('2020-13-01')).toBe(false);
    expect(isValidDateOfBirth('2999-01-01')).toBe(false);
    expect(isValidDateOfBirth('01/01/2000')).toBe(false);
  });

  test('sanitized responses never contain password material or reset fields', () => {
    expect(sanitizeUser({
      id: 'u-1',
      email: 'a@example.com',
      password: 'plain',
      passwordHash: 'bcrypt-hash',
      resetToken: 'raw',
      resetTokenHash: 'sha256',
    })).toEqual({ id: 'u-1', email: 'a@example.com' });
  });

  test('reset tokens are represented only by deterministic SHA-256 hashes', () => {
    const rawToken = 'a-cryptographically-random-token';
    const hash = hashResetToken(rawToken);
    expect(hash).toHaveLength(64);
    expect(hash).not.toContain(rawToken);
    expect(hashResetToken(rawToken)).toBe(hash);
  });
});

import { getRemainingTime, convertBandScore } from '../quizUtils';

describe('quizUtils - getRemainingTime', () => {
  beforeAll(() => {
    jest.useFakeTimers('modern');
    jest.setSystemTime(new Date('2026-06-11T12:00:00.000Z'));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('returns 00:00 and isExpired when expireAt is in the past', () => {
    const expireAt = new Date('2026-06-11T11:59:00.000Z').getTime();
    const result = getRemainingTime(expireAt);
    expect(result.isExpired).toBe(true);
    expect(result.formatted).toBe('00:00');
    expect(result.totalMs).toBe(0);
  });

  it('returns correct formatted time without hours (MM:SS)', () => {
    const expireAt = new Date('2026-06-11T12:15:30.000Z').getTime(); // 15 mins 30 secs
    const result = getRemainingTime(expireAt);
    expect(result.isExpired).toBe(false);
    expect(result.formatted).toBe('15:30');
    expect(result.isWarning).toBe(false);
  });

  it('returns correct formatted time with hours (HH:MM:SS)', () => {
    const expireAt = new Date('2026-06-11T13:15:30.000Z').getTime(); // 1 hr 15 mins 30 secs
    const result = getRemainingTime(expireAt);
    expect(result.isExpired).toBe(false);
    expect(result.formatted).toBe('01:15:30');
  });

  it('sets isWarning to true when remaining time <= 5 minutes', () => {
    const expireAt = new Date('2026-06-11T12:04:59.000Z').getTime(); // 4 mins 59 secs
    const result = getRemainingTime(expireAt);
    expect(result.isWarning).toBe(true);
  });
});

describe('quizUtils - convertBandScore', () => {
  it('returns 9.0 for perfect score', () => {
    expect(convertBandScore(40, 40)).toBe(9.0);
  });

  it('returns 0.0 for invalid input', () => {
    expect(convertBandScore(-5, 40)).toBe(0.0);
    expect(convertBandScore(20, 0)).toBe(0.0);
    expect(convertBandScore("string", null)).toBe(0.0);
  });

  it('caps score correctly', () => {
    expect(convertBandScore(50, 40)).toBe(9.0);
  });
});

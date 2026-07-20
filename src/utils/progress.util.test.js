/**
 * TRACEABILITY MATRIX — progress.util.js (T005)
 * ─────────────────────────────────────────────────────────────────────────────────────
 * Test Case ID | Requirement / EARS Ref                  | Description
 * ─────────────────────────────────────────────────────────────────────────────────────
 * TC_PU_01     | SPEC §6 Derived Data / Ubiquitous        | calculateProgress normal case
 * TC_PU_02     | SPEC §6 totalApprovedLessons = 0         | calculateProgress returns 0 on zero total
 * TC_PU_03     | SPEC §4 Ubiquitous (0-100 clamp)         | calculateProgress clamps to 100
 * TC_PU_04     | EARS[Unwanted] invalid inputs            | calculateProgress safe on null/undefined
 * TC_PU_05     | SPEC §4 CL-09 getNextLesson             | Returns correct next lesson by order
 * TC_PU_06     | EARS[Edge] last lesson next              | getNextLesson returns null for last lesson
 * TC_PU_07     | SPEC §4 CL-09 getPreviousLesson         | Returns correct previous lesson by order
 * TC_PU_08     | EARS[Edge] first lesson previous        | getPreviousLesson returns null for first lesson
 * TC_PU_09     | EARS[Unwanted] empty lessons array      | getNextLesson/getPreviousLesson safe on empty
 * ─────────────────────────────────────────────────────────────────────────────────────
 */

import { describe, it, expect } from 'vitest';
import { calculateProgress, getNextLesson, getPreviousLesson } from './progress.util';

const LESSONS = [
  { id: 'l-002', title: 'Lesson 2', order: 2 },
  { id: 'l-001', title: 'Lesson 1', order: 1 },
  { id: 'l-003', title: 'Lesson 3', order: 3 },
];

describe('calculateProgress', () => {
  // TC_PU_01
  it('TC_PU_01: calculates correct percentage for partial completion', () => {
    expect(calculateProgress(2, 4)).toBe(50);
    expect(calculateProgress(1, 3)).toBe(33);
    expect(calculateProgress(3, 4)).toBe(75);
  });

  // TC_PU_02
  it('TC_PU_02: returns 0 when totalCount is 0 (no lessons)', () => {
    expect(calculateProgress(0, 0)).toBe(0);
    expect(calculateProgress(5, 0)).toBe(0);
  });

  // TC_PU_03
  it('TC_PU_03: clamps result to 100 maximum', () => {
    expect(calculateProgress(10, 10)).toBe(100);
    expect(calculateProgress(5, 5)).toBe(100);
  });

  // TC_PU_04
  it('TC_PU_04: handles null/undefined inputs gracefully without crashing', () => {
    expect(calculateProgress(null, 5)).toBe(0);
    expect(calculateProgress(undefined, 5)).toBe(0);
    expect(calculateProgress(2, null)).toBe(0);
    expect(calculateProgress(undefined, undefined)).toBe(0);
  });

  it('TC_PU_01b: returns 0 when 0 lessons completed', () => {
    expect(calculateProgress(0, 5)).toBe(0);
  });
});

describe('getNextLesson', () => {
  // TC_PU_05
  it('TC_PU_05: returns the next lesson sorted by order', () => {
    const next = getNextLesson(LESSONS, 'l-001');
    expect(next).not.toBeNull();
    expect(next.id).toBe('l-002');
  });

  it('TC_PU_05b: returns l-003 when current is l-002', () => {
    const next = getNextLesson(LESSONS, 'l-002');
    expect(next?.id).toBe('l-003');
  });

  // TC_PU_06
  it('TC_PU_06: returns null for the last lesson in order', () => {
    const next = getNextLesson(LESSONS, 'l-003');
    expect(next).toBeNull();
  });

  // TC_PU_09
  it('TC_PU_09: returns null when lessons array is empty', () => {
    expect(getNextLesson([], 'l-001')).toBeNull();
    expect(getNextLesson(null, 'l-001')).toBeNull();
  });

  it('TC_PU_09b: returns null when currentLessonId not found', () => {
    expect(getNextLesson(LESSONS, 'non-existent-id')).toBeNull();
  });
});

describe('getPreviousLesson', () => {
  // TC_PU_07
  it('TC_PU_07: returns the previous lesson sorted by order', () => {
    const prev = getPreviousLesson(LESSONS, 'l-002');
    expect(prev).not.toBeNull();
    expect(prev.id).toBe('l-001');
  });

  it('TC_PU_07b: returns l-002 when current is l-003', () => {
    const prev = getPreviousLesson(LESSONS, 'l-003');
    expect(prev?.id).toBe('l-002');
  });

  // TC_PU_08
  it('TC_PU_08: returns null for the first lesson in order', () => {
    const prev = getPreviousLesson(LESSONS, 'l-001');
    expect(prev).toBeNull();
  });

  // TC_PU_09
  it('TC_PU_09: returns null when lessons array is empty', () => {
    expect(getPreviousLesson([], 'l-001')).toBeNull();
    expect(getPreviousLesson(null, 'l-001')).toBeNull();
  });
});

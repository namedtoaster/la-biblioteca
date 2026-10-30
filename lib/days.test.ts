import { describe, expect, it } from 'vitest';
import { dayKey, shiftDay, weeksShowedUp, dayNumber } from './days';
import { QUESTIONS, questionFor } from './questions';

describe('dayKey', () => {
  it('treats 1am as the previous day', () => {
    expect(dayKey(new Date(2026, 9, 30, 1, 0))).toBe('2026-10-29');
  });
  it('starts the new day at 4am', () => {
    expect(dayKey(new Date(2026, 9, 30, 3, 59))).toBe('2026-10-29');
    expect(dayKey(new Date(2026, 9, 30, 4, 0))).toBe('2026-10-30');
  });
});

describe('shiftDay', () => {
  it('crosses month and year boundaries', () => {
    expect(shiftDay('2026-10-31', 1)).toBe('2026-11-01');
    expect(shiftDay('2027-01-01', -1)).toBe('2026-12-31');
  });
});

describe('weeksShowedUp', () => {
  it('counts weeks, not days, with weeks starting Monday', () => {
    // 2026-10-26 is a Monday, 2026-11-01 the Sunday after it.
    expect(weeksShowedUp(['2026-10-26', '2026-10-28', '2026-11-01'])).toBe(1);
    expect(weeksShowedUp(['2026-11-01', '2026-11-02'])).toBe(2);
    expect(weeksShowedUp([])).toBe(0);
  });
});

describe('questionFor', () => {
  it('gives consecutive days different questions and cycles the bank', () => {
    const a = questionFor('2026-10-30');
    expect(questionFor('2026-10-31').id).not.toBe(a.id);
    expect(questionFor(shiftDay('2026-10-30', QUESTIONS.length)).id).toBe(a.id);
    expect(dayNumber('1970-01-01')).toBe(0);
  });
  it('has unique ids', () => {
    expect(new Set(QUESTIONS.map((q) => q.id)).size).toBe(QUESTIONS.length);
  });
});

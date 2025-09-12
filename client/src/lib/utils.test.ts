import { describe, expect, it } from 'bun:test';

import { formatDate, formatNumber } from './utils';

describe('formatDate', () => {
  it('should format a valid date string correctly', () => {
    expect(formatDate('2024-03-15')).toBe('Mar 15, 2024');
  });

  it('should handle ISO date strings', () => {
    expect(formatDate('2024-03-15T10:30:00Z')).toBe('Mar 15, 2024');
  });

  it('should format different months correctly', () => {
    expect(formatDate('2024-01-01')).toBe('Jan 1, 2024');
    expect(formatDate('2024-12-31')).toBe('Dec 31, 2024');
  });

  it('should handle leap year dates', () => {
    expect(formatDate('2024-02-29')).toBe('Feb 29, 2024');
  });

  it('should format past dates correctly', () => {
    expect(formatDate('2020-06-15')).toBe('Jun 15, 2020');
  });
});

describe('formatNumber', () => {
  it('should return string representation for numbers less than 1000', () => {
    expect(formatNumber(0)).toBe('0');
    expect(formatNumber(1)).toBe('1');
    expect(formatNumber(42)).toBe('42');
    expect(formatNumber(999)).toBe('999');
  });

  it('should format numbers 1000 and above with k suffix', () => {
    expect(formatNumber(1000)).toBe('1.0k');
    expect(formatNumber(1234)).toBe('1.2k');
    expect(formatNumber(5678)).toBe('5.7k');
    expect(formatNumber(10000)).toBe('10.0k');
  });

  it('should round to one decimal place', () => {
    expect(formatNumber(1249)).toBe('1.2k');
    expect(formatNumber(1250)).toBe('1.3k');
    expect(formatNumber(1999)).toBe('2.0k');
  });

  it('should handle large numbers', () => {
    expect(formatNumber(100000)).toBe('100.0k');
    expect(formatNumber(999999)).toBe('1000.0k');
  });

  it('should handle negative numbers', () => {
    expect(formatNumber(-500)).toBe('-500');
    expect(formatNumber(-1500)).toBe('-1500');
  });
});

/**
 * Date Helpers 单元测试
 */

import {
  formatDate,
  formatTime,
  formatDateTime,
  formatFriendlyDateTime,
  getCurrentDateStr,
  getCurrentDateTimeStr,
  getCurrentTimestamp,
  getRelativeTime,
  getTimeDiff,
  formatTimeDiff,
  isToday,
  isYesterday,
  isThisWeek,
  isThisMonth,
  isThisYear,
  getDateRange,
  getMonthDates,
  getWeekDates,
  getWorkDays,
  getLastDayOfMonth,
  getFirstDayOfMonth,
  isLeapYear,
  getQuarter,
  addDays,
  subtractDays,
  addHours,
  subtractHours,
  addMinutes,
  subtractMinutes,
  compareDates,
  validateDateRange,
  calculateAge,
  formatAge,
  formatSocialTime,
  DATE_FORMATS,
} from '../dateHelpers';

// Mock dayjs to ensure consistent test results
jest.mock('dayjs', () => {
  const originalDayjs = jest.requireActual('dayjs');
  const mockDayjs = (date?: any) => {
    if (date === undefined) {
      // Default to a fixed date for testing
      return originalDayjs('2023-05-15 10:30:00');
    }
    return originalDayjs(date);
  };
  Object.assign(mockDayjs, originalDayjs);
  return mockDayjs;
});

describe('Date Helpers', () => {
  describe('format functions', () => {
    it('should format date', () => {
      expect(formatDate('2023-05-15')).toBe('2023-05-15');
    });

    it('should format time', () => {
      expect(formatTime('2023-05-15 10:30:00')).toBe('10:30:00');
    });

    it('should format datetime', () => {
      expect(formatDateTime('2023-05-15 10:30:00')).toBe('2023-05-15 10:30:00');
    });

    it('should format friendly datetime', () => {
      expect(formatFriendlyDateTime('2023-05-15 10:30:00')).toBe('2023-05-15 10:30');
    });
  });

  describe('current date functions', () => {
    it('should get current date string', () => {
      const dateStr = getCurrentDateStr();
      expect(dateStr).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should get current datetime string', () => {
      const datetimeStr = getCurrentDateTimeStr();
      expect(datetimeStr).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    });

    it('should get current timestamp', () => {
      const timestamp = getCurrentTimestamp();
      expect(typeof timestamp).toBe('number');
      expect(timestamp).toBeGreaterThan(0);
    });
  });

  describe('relative time functions', () => {
    it('should get relative time', () => {
      const relativeTime = getRelativeTime('2023-05-15 10:25:00');
      expect(typeof relativeTime).toBe('string');
    });

    it('should get time diff', () => {
      const diff = getTimeDiff('2023-05-15 10:00:00', '2023-05-15 10:30:00');
      expect(diff.days).toBe(0);
      expect(diff.hours).toBe(0);
      expect(diff.minutes).toBe(30);
      expect(diff.seconds).toBe(0);
    });

    it('should format time diff', () => {
      const formatted = formatTimeDiff('2023-05-15 10:00:00', '2023-05-15 10:30:00');
      expect(formatted).toBe('30分钟');
    });
  });

  describe('date comparison functions', () => {
    it('should check if today', () => {
      expect(isToday('2023-05-15')).toBe(true);
      expect(isToday('2023-05-14')).toBe(false);
    });

    it('should check if yesterday', () => {
      expect(isYesterday('2023-05-14')).toBe(true);
      expect(isYesterday('2023-05-15')).toBe(false);
    });

    it('should check if this week', () => {
      expect(isThisWeek('2023-05-15')).toBe(true);
    });

    it('should check if this month', () => {
      expect(isThisMonth('2023-05-15')).toBe(true);
      expect(isThisMonth('2023-04-15')).toBe(false);
    });

    it('should check if this year', () => {
      expect(isThisYear('2023-05-15')).toBe(true);
      expect(isThisYear('2022-05-15')).toBe(false);
    });
  });

  describe('date range functions', () => {
    it('should get date range', () => {
      const range = getDateRange('2023-05-01', '2023-05-03');
      expect(range).toHaveLength(3);
    });

    it('should get month dates', () => {
      const dates = getMonthDates(2023, 5);
      expect(dates.length).toBe(31);
    });

    it('should get week dates', () => {
      const dates = getWeekDates('2023-05-15');
      expect(dates).toHaveLength(7);
    });

    it('should get work days', () => {
      const workDays = getWorkDays('2023-05-01', '2023-05-07');
      expect(workDays).toBe(5); // 5 working days in a week
    });
  });

  describe('date properties', () => {
    it('should get last day of month', () => {
      const lastDay = getLastDayOfMonth(2023, 5);
      expect(lastDay.getDate()).toBe(31);
    });

    it('should get first day of month', () => {
      const firstDay = getFirstDayOfMonth(2023, 5);
      expect(firstDay.getDate()).toBe(1);
    });

    it('should check leap year', () => {
      expect(isLeapYear(2020)).toBe(true);
      expect(isLeapYear(2021)).toBe(false);
      expect(isLeapYear(2000)).toBe(true);
      expect(isLeapYear(1900)).toBe(false);
    });

    it('should get quarter', () => {
      expect(getQuarter('2023-01-15')).toBe(1);
      expect(getQuarter('2023-04-15')).toBe(2);
      expect(getQuarter('2023-07-15')).toBe(3);
      expect(getQuarter('2023-10-15')).toBe(4);
    });
  });

  describe('date manipulation', () => {
    it('should add days', () => {
      const result = addDays('2023-05-15', 5);
      expect(result.getDate()).toBe(20);
    });

    it('should subtract days', () => {
      const result = subtractDays('2023-05-15', 5);
      expect(result.getDate()).toBe(10);
    });

    it('should add hours', () => {
      const result = addHours('2023-05-15 10:00:00', 2);
      expect(result.getHours()).toBe(12);
    });

    it('should subtract hours', () => {
      const result = subtractHours('2023-05-15 10:00:00', 2);
      expect(result.getHours()).toBe(8);
    });

    it('should add minutes', () => {
      const result = addMinutes('2023-05-15 10:00:00', 30);
      expect(result.getMinutes()).toBe(30);
    });

    it('should subtract minutes', () => {
      const result = subtractMinutes('2023-05-15 10:30:00', 30);
      expect(result.getMinutes()).toBe(0);
    });
  });

  describe('date comparison', () => {
    it('should compare dates', () => {
      expect(compareDates('2023-05-15', '2023-05-16')).toBe(-1);
      expect(compareDates('2023-05-16', '2023-05-15')).toBe(1);
      expect(compareDates('2023-05-15', '2023-05-15')).toBe(0);
    });

    it('should validate date range', () => {
      expect(validateDateRange('2023-05-15', '2023-05-16')).toBe(true);
      expect(validateDateRange('2023-05-16', '2023-05-15')).toBe(false);
    });
  });

  describe('age calculation', () => {
    it('should calculate age', () => {
      const age = calculateAge('1990-05-15');
      expect(typeof age).toBe('number');
      expect(age).toBeGreaterThan(0);
    });

    it('should format age', () => {
      const formatted = formatAge('1990-05-15');
      expect(typeof formatted).toBe('string');
      expect(formatted).toContain('岁');
    });
  });

  describe('social time', () => {
    it('should format social time', () => {
      const socialTime = formatSocialTime('2023-05-15 10:00:00');
      expect(typeof socialTime).toBe('string');
    });
  });

  describe('DATE_FORMATS', () => {
    it('should have required date formats', () => {
      expect(DATE_FORMATS.DATE).toBe('YYYY-MM-DD');
      expect(DATE_FORMATS.TIME).toBe('HH:mm:ss');
      expect(DATE_FORMATS.DATETIME).toBe('YYYY-MM-DD HH:mm:ss');
    });
  });
});

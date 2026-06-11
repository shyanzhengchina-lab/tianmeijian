/**
 * Formatters 单元测试
 */

import {
  formatDate,
  formatNumber,
  formatCurrency,
  formatPercent,
  formatFileSize,
  truncateText,
  formatPhone,
  formatIdCard,
  getStatusStyle,
} from '../formatters';

describe('Formatters', () => {
  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2023-05-15T10:30:00');
      expect(formatDate(date, 'YYYY-MM-DD')).toBe('2023-05-15');
      expect(formatDate(date, 'YYYY-MM-DD HH:mm:ss')).toBe('2023-05-15 10:30:00');
    });

    it('should handle string date', () => {
      expect(formatDate('2023-05-15', 'YYYY-MM-DD')).toBe('2023-05-15');
    });

    it('should handle timestamp', () => {
      const timestamp = new Date('2023-05-15').getTime();
      expect(formatDate(timestamp, 'YYYY-MM-DD')).toBe('2023-05-15');
    });

    it('should return empty string for invalid date', () => {
      expect(formatDate(null as any)).toBe('');
      expect(formatDate(undefined as any)).toBe('');
      expect(formatDate('invalid')).toBe('');
    });

    it('should use default format', () => {
      const date = new Date('2023-05-15');
      expect(formatDate(date)).toBe('2023-05-15');
    });
  });

  describe('formatNumber', () => {
    it('should format number correctly', () => {
      expect(formatNumber(1234.567, 2)).toBe('1,234.57');
      expect(formatNumber(1234.567, 3)).toBe('1,234.567');
    });

    it('should handle string number', () => {
      expect(formatNumber('1234.567', 2)).toBe('1,234.57');
    });

    it('should return empty string for invalid input', () => {
      expect(formatNumber(null as any)).toBe('');
      expect(formatNumber(undefined as any)).toBe('');
      expect(formatNumber('invalid')).toBe('');
    });

    it('should use default decimals', () => {
      expect(formatNumber(1234.567)).toBe('1,234.57');
    });

    it('should handle zero', () => {
      expect(formatNumber(0)).toBe('0.00');
    });

    it('should handle negative numbers', () => {
      expect(formatNumber(-1234.567, 2)).toBe('-1,234.57');
    });
  });

  describe('formatCurrency', () => {
    it('should format CNY currency', () => {
      expect(formatCurrency(1234.567, 'CNY')).toBe('¥1,234.57');
    });

    it('should format USD currency', () => {
      expect(formatCurrency(1234.567, 'USD')).toBe('$1,234.57');
    });

    it('should format EUR currency', () => {
      expect(formatCurrency(1234.567, 'EUR')).toBe('€1,234.57');
    });

    it('should handle string amount', () => {
      expect(formatCurrency('1234.567', 'CNY')).toBe('¥1,234.57');
    });

    it('should return empty string for invalid input', () => {
      expect(formatCurrency(null as any)).toBe('');
      expect(formatCurrency(undefined as any)).toBe('');
      expect(formatCurrency('invalid')).toBe('');
    });

    it('should use default currency', () => {
      expect(formatCurrency(1234.567)).toBe('¥1,234.57');
    });

    it('should handle zero', () => {
      expect(formatCurrency(0, 'CNY')).toBe('¥0.00');
    });

    it('should handle negative amounts', () => {
      expect(formatCurrency(-1234.567, 'CNY')).toBe('¥-1,234.57');
    });
  });

  describe('formatPercent', () => {
    it('should format percentage correctly', () => {
      expect(formatPercent(0.1234, 2)).toBe('12.34%');
      expect(formatPercent(0.5, 1)).toBe('50.0%');
    });

    it('should handle string value', () => {
      expect(formatPercent('0.1234', 2)).toBe('12.34%');
    });

    it('should return empty string for invalid input', () => {
      expect(formatPercent(null as any)).toBe('');
      expect(formatPercent(undefined as any)).toBe('');
      expect(formatPercent('invalid')).toBe('');
    });

    it('should use default decimals', () => {
      expect(formatPercent(0.1234)).toBe('12.34%');
    });

    it('should handle zero', () => {
      expect(formatPercent(0)).toBe('0.00%');
    });

    it('should handle negative values', () => {
      expect(formatPercent(-0.1234, 2)).toBe('-12.34%');
    });

    it('should handle values > 1', () => {
      expect(formatPercent(1.5, 2)).toBe('150.00%');
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 B');
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1024 * 1024)).toBe('1 MB');
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
      expect(formatFileSize(1024 * 1024 * 1024 * 1024)).toBe('1 TB');
    });

    it('should handle fractional sizes', () => {
      expect(formatFileSize(1536)).toBe('1.5 KB');
      expect(formatFileSize(1536 * 1024)).toBe('1.5 MB');
    });

    it('should handle large numbers', () => {
      expect(formatFileSize(1234567890)).toBe('1.15 GB');
    });
  });

  describe('truncateText', () => {
    it('should truncate text correctly', () => {
      expect(truncateText('Hello World', 5)).toBe('Hello...');
      expect(truncateText('Hello World', 10)).toBe('Hello Worl...');
    });

    it('should not truncate if text is shorter than max length', () => {
      expect(truncateText('Hello', 10)).toBe('Hello');
    });

    it('should handle empty string', () => {
      expect(truncateText('', 10)).toBe('');
    });

    it('should use default max length', () => {
      const longText = 'A'.repeat(100);
      expect(truncateText(longText)).toHaveLength(53); // 50 + '...'
    });

    it('should handle null or undefined', () => {
      expect(truncateText(null as any)).toBe('');
      expect(truncateText(undefined as any)).toBe('');
    });
  });

  describe('formatPhone', () => {
    it('should format Chinese phone number', () => {
      expect(formatPhone('13812345678')).toBe('138 1234 5678');
      expect(formatPhone('138-1234-5678')).toBe('138 1234 5678');
    });

    it('should handle phone with spaces', () => {
      expect(formatPhone('138 1234 5678')).toBe('138 1234 5678');
    });

    it('should return original for non-Chinese phone', () => {
      expect(formatPhone('12345')).toBe('12345');
    });

    it('should handle empty string', () => {
      expect(formatPhone('')).toBe('');
    });
  });

  describe('formatIdCard', () => {
    it('should format ID card correctly', () => {
      expect(formatIdCard('110101199003072345')).toBe('110101****2345');
      expect(formatIdCard('1101011990030723456')).toBe('110101****2345');
    });

    it('should handle short ID card', () => {
      expect(formatIdCard('12345678')).toBe('12345678');
    });

    it('should handle empty string', () => {
      expect(formatIdCard('')).toBe('');
    });
  });

  describe('getStatusStyle', () => {
    it('should return style for active status', () => {
      const style = getStatusStyle('active');
      expect(style.label).toBe('启用');
      expect(style.color).toBe('#52c41a');
    });

    it('should return style for inactive status', () => {
      const style = getStatusStyle('inactive');
      expect(style.label).toBe('禁用');
      expect(style.color).toBe('#cf1322');
    });

    it('should return style for processing status', () => {
      const style = getStatusStyle('processing');
      expect(style.label).toBe('处理中');
      expect(style.color).toBe('#1677ff');
    });

    it('should return style for completed status', () => {
      const style = getStatusStyle('completed');
      expect(style.label).toBe('已完成');
      expect(style.color).toBe('#52c41a');
    });

    it('should return style for failed status', () => {
      const style = getStatusStyle('failed');
      expect(style.label).toBe('失败');
      expect(style.color).toBe('#cf1322');
    });

    it('should use custom status map', () => {
      const customMap = {
        custom: { label: 'Custom', color: '#ff0000' },
      };
      const style = getStatusStyle('custom', customMap);
      expect(style.label).toBe('Custom');
      expect(style.color).toBe('#ff0000');
    });

    it('should return default style for unknown status', () => {
      const style = getStatusStyle('unknown');
      expect(style.label).toBe('unknown');
      expect(style.color).toBe('#8c8c8c');
    });
  });
});

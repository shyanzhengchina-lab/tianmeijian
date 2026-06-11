/**
 * Validators 单元测试
 */

import {
  validationRules,
  isEmpty,
  isEmptyValue,
  isValidPhone,
  isValidEmail,
  isValidUrl,
  isValidIdCard,
  isNumber,
  isInteger,
  isPositiveInteger,
  validateDecimalDigits,
  validateDateRange,
  isValidDate,
  formatValidationError,
  antdValidationRules,
} from '../validators';
import type { Rule } from 'antd/es/form';

describe('Validators', () => {
  describe('validationRules', () => {
    it('should create required rule', () => {
      const rule = validationRules.required('This is required');
      expect((rule as any).required).toBe(true);
      expect((rule as any).message).toBe('This is required');
    });

    it('should create email rule', () => {
      const rule = validationRules.email();
      expect((rule as any).type).toBe('email');
    });

    it('should create phone CN rule', () => {
      const rule = validationRules.phoneCN();
      expect((rule as any).pattern).toBeDefined();
    });

    it('should create phone rule', () => {
      const rule = validationRules.phone();
      expect((rule as any).pattern).toBeDefined();
    });

    it('should create URL rule', () => {
      const rule = validationRules.url();
      expect((rule as any).type).toBe('url');
    });

    it('should create number rule', () => {
      const rule = validationRules.number(0, 100);
      expect((rule as any).type).toBe('number');
      expect((rule as any).min).toBe(0);
      expect((rule as any).max).toBe(100);
    });

    it('should create integer rule', () => {
      const rule = validationRules.integer(0, 100);
      expect((rule as any).type).toBe('integer');
    });

    it('should create length rule', () => {
      const rule = validationRules.length(1, 10);
      expect((rule as any).min).toBe(1);
      expect((rule as any).max).toBe(10);
    });

    it('should create length range rules', () => {
      const rules = validationRules.lengthRange(1, 10);
      expect(rules).toHaveLength(2);
    });

    it('should create password rules', () => {
      const rules = validationRules.password(8);
      expect(rules).toHaveLength(3);
      expect((rules[0] as any).required).toBe(true);
      expect((rules[1] as any).min).toBe(8);
    });

    it('should create amount rule', () => {
      const rule = validationRules.amount(0, 2);
      expect((rule as any).type).toBe('number');
      expect((rule as any).min).toBe(0);
      expect((rule as any).validator).toBeDefined();
    });

    it('should create positive number rule', () => {
      const rule = validationRules.positiveNumber();
      expect((rule as any).type).toBe('number');
      expect((rule as any).min).toBe(0);
    });

    it('should create non-negative number rule', () => {
      const rule = validationRules.nonNegativeNumber();
      expect((rule as any).type).toBe('number');
      expect((rule as any).min).toBe(0);
    });

    it('should create code rule', () => {
      const pattern = /^[A-Z]{2}-\d{4}$/;
      const rule = validationRules.code(pattern, 'AB-1234');
      expect((rule as any).pattern).toBe(pattern);
    });

    it('should create document no rule', () => {
      const rule = validationRules.documentNo('PO');
      expect((rule as any).pattern).toBeDefined();
    });

    it('should create date range rule', () => {
      const rule = validationRules.dateRange();
      expect((rule as any).validator).toBeDefined();
    });

    it('should create number range rule', () => {
      const rule = validationRules.numberRange(0, 100);
      expect((rule as any).type).toBe('number');
      expect((rule as any).min).toBe(0);
      expect((rule as any).max).toBe(100);
    });
  });

  describe('isEmpty', () => {
    it('should return true for null', () => {
      expect(isEmpty(null)).toBe(true);
    });

    it('should return true for undefined', () => {
      expect(isEmpty(undefined)).toBe(true);
    });

    it('should return true for empty string', () => {
      expect(isEmpty('')).toBe(true);
    });

    it('should return true for whitespace string', () => {
      expect(isEmpty('   ')).toBe(true);
    });

    it('should return true for empty array', () => {
      expect(isEmpty([])).toBe(true);
    });

    it('should return false for non-empty values', () => {
      expect(isEmpty('test')).toBe(false);
      expect(isEmpty([1])).toBe(false);
      expect(isEmpty(0)).toBe(false);
      expect(isEmpty(false)).toBe(false);
    });
  });

  describe('isEmptyValue', () => {
    it('should return true for null', () => {
      expect(isEmptyValue(null)).toBe(true);
    });

    it('should return true for undefined', () => {
      expect(isEmptyValue(undefined)).toBe(true);
    });

    it('should return true for empty string', () => {
      expect(isEmptyValue('')).toBe(true);
    });

    it('should return false for falsy values like 0 or false', () => {
      expect(isEmptyValue(0)).toBe(false);
      expect(isEmptyValue(false)).toBe(false);
    });

    it('should return false for non-empty values', () => {
      expect(isEmptyValue('test')).toBe(false);
      expect(isEmptyValue([1])).toBe(false);
    });
  });

  describe('isValidPhone', () => {
    it('should validate valid Chinese phone numbers', () => {
      expect(isValidPhone('13812345678')).toBe(true);
      expect(isValidPhone('18600001111')).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      expect(isValidPhone('12345678901')).toBe(false);
      expect(isValidPhone('1381234567')).toBe(false);
      expect(isValidPhone('138123456789')).toBe(false);
      expect(isValidPhone('abcdefghijk')).toBe(false);
    });
  });

  describe('isValidEmail', () => {
    it('should validate valid emails', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@example.com')).toBe(true);
      expect(isValidEmail('user+tag@example.com')).toBe(true);
    });

    it('should reject invalid emails', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('invalid@')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('invalid@example')).toBe(false);
    });
  });

  describe('isValidUrl', () => {
    it('should validate valid URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://example.com')).toBe(true);
      expect(isValidUrl('https://example.com/path')).toBe(true);
      expect(isValidUrl('https://example.com/path?query=1')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(isValidUrl('not-a-url')).toBe(false);
      expect(isValidUrl('example.com')).toBe(false);
    });
  });

  describe('isValidIdCard', () => {
    it('should validate valid Chinese ID cards', () => {
      expect(isValidIdCard('110101199003072345')).toBe(true);
    });

    it('should reject invalid ID cards', () => {
      expect(isValidIdCard('12345')).toBe(false);
      expect(isValidIdCard('12345678901234567890')).toBe(false);
    });
  });

  describe('isNumber', () => {
    it('should validate numbers', () => {
      expect(isNumber(123)).toBe(true);
      expect(isNumber('123')).toBe(true);
      expect(isNumber('12.34')).toBe(true);
      expect(isNumber(12.34)).toBe(true);
    });

    it('should reject non-numbers', () => {
      expect(isNumber('abc')).toBe(false);
      expect(isNumber('')).toBe(false);
      expect(isNumber(NaN)).toBe(false);
      expect(isNumber(Infinity)).toBe(false);
    });
  });

  describe('isInteger', () => {
    it('should validate integers', () => {
      expect(isInteger(123)).toBe(true);
      expect(isInteger('123')).toBe(true);
      expect(isInteger(0)).toBe(true);
      expect(isInteger(-5)).toBe(true);
    });

    it('should reject non-integers', () => {
      expect(isInteger(12.34)).toBe(false);
      expect(isInteger('12.34')).toBe(false);
      expect(isInteger('abc')).toBe(false);
    });
  });

  describe('isPositiveInteger', () => {
    it('should validate positive integers', () => {
      expect(isPositiveInteger(123)).toBe(true);
      expect(isPositiveInteger('1')).toBe(true);
    });

    it('should reject non-positive integers', () => {
      expect(isPositiveInteger(0)).toBe(false);
      expect(isPositiveInteger(-5)).toBe(false);
      expect(isPositiveInteger(12.34)).toBe(false);
    });
  });

  describe('validateDecimalDigits', () => {
    it('should validate decimal digits', () => {
      expect(validateDecimalDigits(12.345, 2)).toBe(false);
      expect(validateDecimalDigits(12.34, 2)).toBe(true);
      expect(validateDecimalDigits(12.3, 2)).toBe(true);
      expect(validateDecimalDigits(12, 2)).toBe(true);
      expect(validateDecimalDigits(null as any, 2)).toBe(true);
      expect(validateDecimalDigits(undefined as any, 2)).toBe(true);
    });
  });

  describe('validateDateRange', () => {
    it('should validate date range', () => {
      expect(validateDateRange('2023-01-01', '2023-01-02')).toBe(true);
      expect(validateDateRange('2023-01-02', '2023-01-01')).toBe(false);
      expect(validateDateRange('', '2023-01-01')).toBe(true);
      expect(validateDateRange('2023-01-01', '')).toBe(true);
    });
  });

  describe('isValidDate', () => {
    it('should validate dates', () => {
      expect(isValidDate('2023-01-01')).toBe(true);
      expect(isValidDate('2023-01-01T00:00:00')).toBe(true);
      expect(isValidDate('invalid-date')).toBe(false);
    });
  });

  describe('formatValidationError', () => {
    it('should format string errors', () => {
      expect(formatValidationError('Error message')).toBe('Error message');
    });

    it('should format error objects with message', () => {
      expect(formatValidationError({ message: 'Error message' })).toBe('Error message');
    });

    it('should format error objects with errors array', () => {
      const error = {
        errors: [{ message: 'Field error' }],
      };
      expect(formatValidationError(error, 'fieldName')).toBe('fieldNameField error');
    });

    it('should format unknown errors', () => {
      expect(formatValidationError({})).toBe('验证失败');
    });
  });

  describe('antdValidationRules', () => {
    it('should provide input validation rules', () => {
      expect(antdValidationRules.input.required('Required')).toBeDefined();
      expect(antdValidationRules.input.maxLength(10)).toBeDefined();
    });

    it('should provide input number validation rules', () => {
      expect(antdValidationRules.inputNumber.required('Required')).toBeDefined();
      expect(antdValidationRules.inputNumber.number(0, 100)).toBeDefined();
    });

    it('should provide select validation rules', () => {
      expect(antdValidationRules.select.required('Required')).toBeDefined();
    });

    it('should provide date picker validation rules', () => {
      expect(antdValidationRules.datePicker.required('Required')).toBeDefined();
    });

    it('should provide range picker validation rules', () => {
      expect(antdValidationRules.rangePicker.required('Required')).toBeDefined();
    });

    it('should provide text area validation rules', () => {
      expect(antdValidationRules.textArea.required('Required')).toBeDefined();
      expect(antdValidationRules.textArea.maxLength(100)).toBeDefined();
    });
  });
});

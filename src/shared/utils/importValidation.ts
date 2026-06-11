/**
 * Import Validation Utilities
 * Comprehensive format and business validation for import data
 */

import { message } from 'antd';

// ============================================================================
// Validation Types
// ============================================================================

export interface ValidationResult {
  /** Whether validation passed */
  valid: boolean;
  /** Array of validation errors */
  errors: FieldError[];
  /** Array of validation warnings */
  warnings: FieldWarning[];
}

export interface FieldError {
  /** Field name */
  field: string;
  /** Field value that caused error */
  value: any;
  /** Error message */
  message: string;
  /** Error type */
  type: 'required' | 'format' | 'type' | 'business' | 'length' | 'range';
  /** Row number (for batch validation) */
  rowNumber?: number;
}

export interface FieldWarning {
  /** Field name */
  field: string;
  /** Field value that caused warning */
  value: any;
  /** Warning message */
  message: string;
  /** Warning type */
  type: 'format' | 'type' | 'business' | 'length' | 'range';
  /** Row number (for batch validation) */
  rowNumber?: number;
}

export interface ValidationRule {
  /** Field name */
  field: string;
  /** Whether field is required */
  required?: boolean;
  /** Custom validator function */
  validator?: (value: any, field: string) => FieldError | FieldWarning | null;
  /** Minimum value/length */
  min?: number;
  /** Maximum value/length */
  max?: number;
  /** Regular expression pattern */
  pattern?: RegExp;
  /** Custom error message */
  message?: string;
  /** Allowed values */
  allowedValues?: any[];
}

// ============================================================================
// Format Validators
// ============================================================================

/**
 * Format validators for common data types
 */
export const validators = {
  /**
   * Required field validator
   */
  required: (value: any, fieldName: string): FieldError | null => {
    if (value === null || value === undefined || value === '' || (typeof value === 'string' && value.trim() === '')) {
      return {
        field: fieldName,
        value,
        message: `${fieldName}不能为空`,
        type: 'required',
      };
    }
    return null;
  },

  /**
   * Email format validator
   */
  email: (value: any, fieldName: string): FieldError | null => {
    if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return {
        field: fieldName,
        value,
        message: `${fieldName}格式不正确`,
        type: 'format',
      };
    }
    return null;
  },

  /**
   * Phone number validator (Chinese format)
   */
  phone: (value: any, fieldName: string): FieldError | null => {
    if (value && !/^1[3-9]\d{9}$/.test(value)) {
      return {
        field: fieldName,
        value,
        message: `${fieldName}格式不正确`,
        type: 'format',
      };
    }
    return null;
  },

  /**
   * ID card validator (Chinese format)
   */
  idCard: (value: any, fieldName: string): FieldError | null => {
    if (value) {
      // Basic format check (18 digits with X)
      if (!/^\d{17}[\dXx]$/.test(value)) {
        return {
          field: fieldName,
          value,
          message: `${fieldName}格式不正确`,
          type: 'format',
        };
      }

      // Checksum validation
      const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
      const checksums = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'];
      let sum = 0;
      for (let i = 0; i < 17; i++) {
        sum += parseInt(value[i]) * weights[i];
      }
      const expectedChecksum = checksums[sum % 11];
      const actualChecksum = value[17].toUpperCase();

      if (expectedChecksum !== actualChecksum) {
        return {
          field: fieldName,
          value,
          message: `${fieldName}校验码错误`,
          type: 'format',
        };
      }
    }
    return null;
  },

  /**
   * Positive number validator
   */
  positiveNumber: (value: any, fieldName: string): FieldError | null => {
    if (value !== null && value !== undefined && value !== '') {
      const num = Number(value);
      if (isNaN(num) || num <= 0) {
        return {
          field: fieldName,
          value,
          message: `${fieldName}必须是正数`,
          type: 'type',
        };
      }
    }
    return null;
  },

  /**
   * Number validator
   */
  number: (value: any, fieldName: string): FieldError | null => {
    if (value !== null && value !== undefined && value !== '') {
      if (isNaN(Number(value))) {
        return {
          field: fieldName,
          value,
          message: `${fieldName}必须是数字`,
          type: 'type',
        };
      }
    }
    return null;
  },

  /**
   * Date validator
   */
  date: (value: any, fieldName: string): FieldError | null => {
    if (value) {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        return {
          field: fieldName,
          value,
          message: `${fieldName}格式不正确`,
          type: 'format',
        };
      }
    }
    return null;
  },

  /**
   * Date range validator
   */
  dateRange: (value: any, fieldName: string, min?: Date, max?: Date): FieldError | null => {
    if (!value) return null;

    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return {
        field: fieldName,
        value,
        message: `${fieldName}格式不正确`,
        type: 'format',
      };
    }

    if (min && date < min) {
      return {
        field: fieldName,
        value,
        message: `${fieldName}不能早于 ${min.toLocaleDateString()}`,
        type: 'range',
      };
    }

    if (max && date > max) {
      return {
        field: fieldName,
        value,
        message: `${fieldName}不能晚于 ${max.toLocaleDateString()}`,
        type: 'range',
      };
    }

    return null;
  },

  /**
   * String length validator
   */
  length: (value: any, fieldName: string, min?: number, max?: number): FieldError | null => {
    if (value !== null && value !== undefined && value !== '') {
      const length = String(value).length;

      if (min !== undefined && length < min) {
        return {
          field: fieldName,
          value,
          message: `${fieldName}长度不能少于 ${min} 个字符`,
          type: 'length',
        };
      }

      if (max !== undefined && length > max) {
        return {
          field: fieldName,
          value,
          message: `${fieldName}长度不能超过 ${max} 个字符`,
          type: 'length',
        };
      }
    }
    return null;
  },

  /**
   * Number range validator
   */
  range: (value: any, fieldName: string, min?: number, max?: number): FieldError | null => {
    if (value !== null && value !== undefined && value !== '') {
      const num = Number(value);

      if (isNaN(num)) {
        return {
          field: fieldName,
          value,
          message: `${fieldName}必须是数字`,
          type: 'type',
        };
      }

      if (min !== undefined && num < min) {
        return {
          field: fieldName,
          value,
          message: `${fieldName}不能小于 ${min}`,
          type: 'range',
        };
      }

      if (max !== undefined && num > max) {
        return {
          field: fieldName,
          value,
          message: `${fieldName}不能大于 ${max}`,
          type: 'range',
        };
      }
    }
    return null;
  },

  /**
   * Pattern validator
   */
  pattern: (value: any, fieldName: string, pattern: RegExp, errorMessage?: string): FieldError | null => {
    if (value && !pattern.test(value)) {
      return {
        field: fieldName,
        value,
        message: errorMessage || `${fieldName}格式不正确`,
        type: 'format',
      };
    }
    return null;
  },

  /**
   * Enum validator
   */
  enum: (value: any, fieldName: string, allowedValues: any[]): FieldError | null => {
    if (value !== null && value !== undefined && !allowedValues.includes(value)) {
      return {
        field: fieldName,
        value,
        message: `${fieldName}的值必须是: ${allowedValues.join(', ')}`,
        type: 'type',
      };
    }
    return null;
  },
};

// ============================================================================
// Business Validators
// ============================================================================

/**
 * Business-specific validators
 */
export const businessValidators = {
  /**
   * Material code validator (uppercase, alphanumeric, hyphens, underscores)
   */
  materialCode: (value: string): FieldError | null => {
    if (!/^[A-Z0-9\-_]+$/.test(value)) {
      return {
        field: 'code',
        value,
        message: '物料编码只能包含大写字母、数字、横线和下划线',
        type: 'business',
      };
    }
    return null;
  },

  /**
   * Employee code validator
   */
  employeeCode: (value: string): FieldError | null => {
    if (!/^[A-Za-z0-9\-_]+$/.test(value)) {
      return {
        field: 'code',
        value,
        message: '员工工号只能包含字母、数字、横线和下划线',
        type: 'business',
      };
    }
    return null;
  },

  /**
   * Unit code validator
   */
  unitCode: (value: string): FieldError | null => {
    if (!/^[A-Za-z0-9]+$/.test(value)) {
      return {
        field: 'code',
        value,
        message: '单位编码只能包含字母和数字',
        type: 'business',
      };
    }
    return null;
  },

  /**
   * URL validator
   */
  url: (value: string, fieldName: string): FieldError | null => {
    if (value) {
      try {
        new URL(value);
      } catch {
        return {
          field: fieldName,
          value,
          message: `${fieldName}格式不正确`,
          type: 'format',
        };
      }
    }
    return null;
  },
};

// ============================================================================
// Module-Specific Validation Schemas
// ============================================================================

/**
 * Validation schemas for different modules
 */
export const validationSchemas: Record<string, ValidationRule[]> = {
  material: [
    { field: 'code', required: true, validator: businessValidators.materialCode },
    { field: 'name', required: true },
    { field: 'unit', required: true },
    { field: 'category', required: true },
    { field: 'specification', required: false },
    { field: 'price', validator: (v) => validators.number(v, 'price') },
  ],

  employee: [
    { field: 'code', required: true, validator: businessValidators.employeeCode },
    { field: 'name', required: true },
    { field: 'phone', required: true, validator: (v) => validators.phone(v, 'phone') },
    { field: 'idCard', required: true, validator: (v) => validators.idCard(v, 'idCard') },
    { field: 'email', validator: (v) => validators.email(v, 'email') },
    { field: 'gender', allowedValues: ['MALE', 'FEMALE', 'OTHER'] },
  ],

  unit: [
    { field: 'code', required: true, validator: businessValidators.unitCode },
    { field: 'name', required: true },
    { field: 'symbol', required: true },
  ],

  workshop: [
    { field: 'code', required: true },
    { field: 'name', required: true },
    { field: 'location', required: false },
  ],

  workcenter: [
    { field: 'code', required: true },
    { field: 'name', required: true },
    { field: 'workshopCode', required: true },
  ],

  team: [
    { field: 'code', required: true },
    { field: 'name', required: true },
    { field: 'leader', required: true },
  ],

  operation: [
    { field: 'code', required: true },
    { field: 'name', required: true },
    { field: 'cycleTime', validator: (v) => validators.positiveNumber(v, 'cycleTime') },
  ],

  equipment: [
    { field: 'code', required: true },
    { field: 'name', required: true },
    { field: 'model', required: false },
    { field: 'status', allowedValues: ['ACTIVE', 'MAINTENANCE', 'INACTIVE'] },
  ],

  bom: [
    { field: 'materialCode', required: true },
    { field: 'bomCode', required: true },
    { field: 'quantity', validator: (v) => validators.positiveNumber(v, 'quantity') },
  ],

  'qc-scheme': [
    { field: 'code', required: true },
    { field: 'name', required: true },
    { field: 'type', required: true },
  ],

  'qc-item': [
    { field: 'code', required: true },
    { field: 'name', required: true },
    { field: 'type', required: true },
  ],
};

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validate a single object against a schema
 */
export const validateObject = (
  data: Record<string, any>,
  schema: ValidationRule[]
): ValidationResult => {
  const errors: FieldError[] = [];
  const warnings: FieldWarning[] = [];

  for (const rule of schema) {
    const value = data[rule.field];

    // Check required
    if (rule.required) {
      const error = validators.required(value, rule.field);
      if (error) {
        errors.push(error);
        continue; // Skip other validations if required field is empty
      }
    }

    // Skip validation if value is empty and not required
    if (value === null || value === undefined || value === '') {
      continue;
    }

    // Apply custom validator
    if (rule.validator) {
      const result = rule.validator(value, rule.field);
      if (result) {
        if (result.type === 'required' || result.type === 'format' || result.type === 'type') {
          errors.push(result);
        } else {
          warnings.push(result as FieldWarning);
        }
      }
    }

    // Check pattern
    if (rule.pattern) {
      const error = validators.pattern(value, rule.field, rule.pattern, rule.message);
      if (error) {
        errors.push(error);
      }
    }

    // Check allowed values
    if (rule.allowedValues) {
      const error = validators.enum(value, rule.field, rule.allowedValues);
      if (error) {
        errors.push(error);
      }
    }

    // Check min/max for numbers
    if (rule.min !== undefined || rule.max !== undefined) {
      if (typeof value === 'number' || !isNaN(Number(value))) {
        const error = validators.range(value, rule.field, rule.min, rule.max);
        if (error) {
          errors.push(error);
        }
      } else if (typeof value === 'string') {
        const error = validators.length(value, rule.field, rule.min, rule.max);
        if (error) {
          errors.push(error);
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * Validate an array of objects (for batch import)
 */
export const validateBatch = (
  data: Record<string, any>[],
  schema: ValidationRule[]
): ValidationResult => {
  const allErrors: FieldError[] = [];
  const allWarnings: FieldWarning[] = [];

  data.forEach((item, index) => {
    const result = validateObject(item, schema);
    allErrors.push(
      ...result.errors.map(error => ({ ...error, rowNumber: index + 1 }))
    );
    allWarnings.push(
      ...result.warnings.map(warning => ({ ...warning, rowNumber: index + 1 }))
    );
  });

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
  };
};

/**
 * Get validation schema for a module
 */
export const getValidationSchema = (module: string): ValidationRule[] => {
  return validationSchemas[module] || [];
};

/**
 * Validate data for a specific module
 */
export const validateModuleData = (
  module: string,
  data: Record<string, any> | Record<string, any>[]
): ValidationResult => {
  const schema = getValidationSchema(module);

  if (!schema) {
    return { valid: true, errors: [], warnings: [] };
  }

  if (Array.isArray(data)) {
    return validateBatch(data, schema);
  } else {
    return validateObject(data, schema);
  }
};

/**
 * Show validation errors in a message
 */
export const showValidationErrors = (result: ValidationResult): void => {
  if (result.errors.length > 0) {
    const errorMessages = result.errors.slice(0, 5).map(error => {
      const rowInfo = error.rowNumber ? `行 ${error.rowNumber}: ` : '';
      return `${rowInfo}${error.field} - ${error.message}`;
    });

    message.error(
      `验证失败:\n${errorMessages.join('\n')}${
        result.errors.length > 5 ? `\n... 还有 ${result.errors.length - 5} 个错误` : ''
      }`
    );
  }

  if (result.warnings.length > 0) {
    const warningMessages = result.warnings.slice(0, 3).map(warning => {
      const rowInfo = warning.rowNumber ? `行 ${warning.rowNumber}: ` : '';
      return `${rowInfo}${warning.field} - ${warning.message}`;
    });

    message.warning(
      `注意:\n${warningMessages.join('\n')}${
        result.warnings.length > 3 ? `\n... 还有 ${result.warnings.length - 3} 个警告` : ''
      }`
    );
  }
};

export default {
  validators,
  businessValidators,
  validationSchemas,
  validateObject,
  validateBatch,
  validateModuleData,
  showValidationErrors,
};

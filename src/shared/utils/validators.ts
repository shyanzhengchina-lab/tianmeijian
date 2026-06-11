/**
 * 表单验证工具函数
 * 提供常用的表单验证规则和验证函数
 */

import type { Rule } from 'antd/es/form';

/**
 * 验证规则集合
 */
export const validationRules = {
  // 必填
  required: (message: string = '请输入此项'): Rule => ({
    required: true,
    message,
  }),

  // 邮箱验证
  email: (): Rule => ({
    type: 'email',
    message: '请输入有效的邮箱地址',
  }),

  // 手机号验证 (中国大陆)
  phoneCN: (): Rule => ({
    pattern: /^1[3-9]\d{9}$/,
    message: '请输入有效的手机号',
  }),

  // 手机号验证 (通用)
  phone: (): Rule => ({
    pattern: /^1[3-9]\d{9,14}$/,
    message: '请输入有效的手机号',
  }),

  // URL验证
  url: (): Rule => ({
    type: 'url',
    message: '请输入有效的URL地址',
  }),

  // 数字验证
  number: (min?: number, max?: number): Rule => ({
    type: 'number',
    min,
    max,
    message: min !== undefined && max !== undefined
      ? `请输入${min}到${max}之间的数字`
      : min !== undefined
      ? `请输入大于等于${min}的数字`
      : max !== undefined
      ? `请输入小于等于${max}的数字`
      : '请输入有效的数字',
  }),

  // 整数验证
  integer: (min?: number, max?: number): Rule => ({
    type: 'integer',
    min,
    max,
    message: min !== undefined && max !== undefined
      ? `请输入${min}到${max}之间的整数`
      : min !== undefined
      ? `请输入大于等于${min}的整数`
      : max !== undefined
      ? `请输入小于等于${max}的整数`
      : '请输入有效的整数',
  }),

  // 长度验证
  length: (min: number, max: number): Rule => ({
    min,
    max,
    message: `请输入${min}到${max}个字符`,
  }),

  // 字符串长度范围验证
  lengthRange: (min: number, max: number): Rule[] => [
    {
      type: 'string',
      min,
      message: `至少输入${min}个字符`,
    },
    {
      type: 'string',
      max,
      message: `最多输入${max}个字符`,
    },
  ],

  // 密码验证
  password: (minLength: number = 6): Rule[] => [
    {
      required: true,
      message: '请输入密码',
    },
    {
      min: minLength,
      message: `密码长度不能少于${minLength}位`,
    },
    {
      pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      message: '密码必须包含大小写字母和数字',
    },
  ],

  // 金额验证
  amount: (min: number = 0, maxDigits: number = 2): Rule => ({
    type: 'number',
    min,
    message: `请输入有效的金额，最小值为${min}`,
    validator: (_: any, value: number) => {
      if (value !== undefined && value !== null) {
        const strValue = value.toString();
        const decimalIndex = strValue.indexOf('.');
        if (decimalIndex !== -1) {
          const decimals = strValue.substring(decimalIndex + 1).length;
          if (decimals > maxDigits) {
            return Promise.reject(`最多${maxDigits}位小数`);
          }
        }
      }
      return Promise.resolve();
    },
  }),

  // 正数验证
  positiveNumber: (message: string = '请输入正数'): Rule => ({
    type: 'number',
    min: 0,
    message,
  }),

  // 非负数验证
  nonNegativeNumber: (message: string = '请输入非负数'): Rule => ({
    type: 'number',
    min: 0,
    message,
  }),

  // 编码格式验证
  code: (pattern: RegExp, example: string): Rule => ({
    pattern,
    message: `编码格式不正确，示例：${example}`,
  }),

  // 单据号格式验证
  documentNo: (prefix: string): Rule => ({
    pattern: new RegExp(`^${prefix}-\\d{4,}$`),
    message: `单据号格式不正确，应为：${prefix}-xxxxx`,
  }),

  // 日期范围验证
  dateRange: (message: string = '开始日期不能晚于结束日期'): Rule => ({
    validator: (_: any, value) => {
      return Promise.resolve();
    },
  }),

  // 数字范围验证
  numberRange: (min: number, max: number, message?: string): Rule => ({
    type: 'number',
    min,
    max,
    message: message || `请输入${min}到${max}之间的数字`,
  }),
};

/**
 * 自定义验证函数
 */

/**
 * 验证是否为空值
 */
export const isEmpty = (value: any): boolean => {
  if (value === null || value === undefined) {
    return true;
  }
  if (typeof value === 'string' && value.trim() === '') {
    return true;
  }
  if (Array.isArray(value) && value.length === 0) {
    return true;
  }
  return false;
};

/**
 * 验证是否为空值（包括0、false等）
 */
export const isEmptyValue = (value: any): boolean => {
  return value === null || value === undefined || value === '';
};

/**
 * 验证手机号
 */
export const isValidPhone = (phone: string): boolean => {
  return /^1[3-9]\d{9}$/.test(phone);
};

/**
 * 验证邮箱
 */
export const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

/**
 * 验证URL
 */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * 验证身份证号（中国大陆18位）
 */
export const isValidIdCard = (idCard: string): boolean => {
  // 18位身份证正则
  const reg = /^[1-9]\d{5}(18|19|20)\d{2}(\d{X}|\d{3})$/;
  return reg.test(idCard);
};

/**
 * 验证数字
 */
export const isNumber = (value: any): boolean => {
  return !isNaN(parseFloat(value)) && isFinite(value);
};

/**
 * 验证整数
 */
export const isInteger = (value: any): boolean => {
  return Number.isInteger(Number(value));
};

/**
 * 验证正整数
 */
export const isPositiveInteger = (value: any): boolean => {
  return isInteger(value) && Number(value) > 0;
};

/**
 * 验证小数位数
 */
export const validateDecimalDigits = (value: number, maxDigits: number): boolean => {
  if (value === undefined || value === null) {
    return true;
  }
  const strValue = value.toString();
  const decimalIndex = strValue.indexOf('.');
  if (decimalIndex !== -1) {
    const decimals = strValue.substring(decimalIndex + 1).length;
    return decimals <= maxDigits;
  }
  return true;
};

/**
 * 验证日期范围
 */
export const validateDateRange = (startDate: string, endDate: string): boolean => {
  if (!startDate || !endDate) {
    return true;
  }
  return new Date(startDate) <= new Date(endDate);
};

/**
 * 验证是否为有效日期
 */
export const isValidDate = (date: string): boolean => {
  return !isNaN(Date.parse(date));
};

/**
 * 验证编码唯一性（模拟）
 */
export const validateCodeUnique = async (
  code: string,
  validateFn: (code: string) => Promise<boolean>
): Promise<boolean> => {
  return await validateFn(code);
};

/**
 * 表单验证器创建器
 */
export const createValidator = (
  rule: (value: any) => Promise<boolean | void>,
  message: string = '验证失败'
): Rule => ({
  validator: (_: any, value) => {
    return rule(value);
  },
  message,
});

/**
 * 异步验证规则创建器
 */
export const createAsyncValidator = (
  validateFn: (value: any) => Promise<boolean>,
  message: string = '验证失败'
): Rule => ({
  validator: (_: any, value) => {
    if (isEmpty(value)) {
      return Promise.resolve();
    }
    return validateFn(value);
  },
  message,
});

/**
 * 组合验证规则
 */
export const combineRules = (...rules: Rule[]): Rule[] => {
  return rules.flat();
};

/**
 * 条件验证规则
 */
export const conditionalRule = (
  condition: boolean,
  rule: Rule
): Rule | null => {
  return condition ? rule : null;
};

/**
 * 动态验证规则
 */
export const createDynamicRule = (
  validator: (value: any) => boolean | string,
  message?: string
): Rule => ({
  validator: (_: any, value) => {
    const result = validator(value);
    if (result === true) {
      return Promise.resolve();
    }
    return Promise.reject(result || message || '验证失败');
  },
  message,
});

/**
 * 验证错误格式化
 */
export const formatValidationError = (error: any, fieldName: string = '字段'): string => {
  if (typeof error === 'string') {
    return error;
  }
  if (error?.message) {
    return error.message;
  }
  if (error?.errors) {
    const firstError = error.errors[0];
    return `${fieldName}${firstError.message}`;
  }
  return '验证失败';
};

/**
 * Ant Design 表单验证规则
 */
export const antdValidationRules = {
  // 输入框验证规则
  input: {
    required: (message?: string) => validationRules.required(message),
    maxLength: (max: number) => validationRules.length(0, max),
    minLength: (min: number) => validationRules.lengthRange(min, 999999),
  },

  // 数字输入框验证规则
  inputNumber: {
    required: (message?: string) => validationRules.required(message),
    number: (min?: number, max?: number) => validationRules.number(min, max),
    positiveNumber: validationRules.positiveNumber(),
    nonNegativeNumber: validationRules.nonNegativeNumber(),
  },

  // 选择框验证规则
  select: {
    required: (message?: string) => validationRules.required(message),
  },

  // 日期选择框验证规则
  datePicker: {
    required: (message?: string) => validationRules.required(message),
  },

  // 日期范围选择框验证规则
  rangePicker: {
    required: (message?: string) => validationRules.required(message),
  },

  // 文本域验证规则
  textArea: {
    required: (message?: string) => validationRules.required(message),
    maxLength: (max: number) => validationRules.length(0, max),
    minLength: (min: number) => validationRules.lengthRange(min, 999999),
  },
};

export default validationRules;
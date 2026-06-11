/**
 * 数字工具函数
 * 提供常用的数字处理、格式化、计算等工具函数
 */

/**
 * 数字格式化选项
 */
interface NumberFormatOptions {
  decimals?: number;
  thousandsSeparator?: boolean;
  prefix?: string;
  suffix?: string;
  padLeft?: number;
  padRight?: number;
  padChar?: string;
}

/**
 * 默认数字格式化选项
 */
const DEFAULT_FORMAT_OPTIONS: Required<NumberFormatOptions> = {
  decimals: 2,
  thousandsSeparator: true,
  prefix: '',
  suffix: '',
  padLeft: 0,
  padRight: 0,
  padChar: '0',
};

/**
 * 格式化数字
 */
export const formatNumber = (
  num: number | string,
  options: NumberFormatOptions = {}
): string => {
  const opts = { ...DEFAULT_FORMAT_OPTIONS, ...options };
  const number = typeof num === 'string' ? parseFloat(num) : num;

  if (isNaN(number)) return '';

  // 处理小数位数
  let result = number.toFixed(opts.decimals);

  // 处理千分位
  if (opts.thousandsSeparator) {
    const parts = result.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    result = parts.join('.');
  }

  // 处理填充
  if (opts.padLeft > 0) {
    result = result.padStart(opts.padLeft + result.length, opts.padChar);
  }

  if (opts.padRight > 0) {
    result = result.padEnd(opts.padRight + result.length, opts.padChar);
  }

  // 添加前后缀
  return `${opts.prefix}${result}${opts.suffix}`;
};

/**
 * 格式化为百分比
 */
export const formatPercent = (
  num: number | string,
  decimals: number = 2,
  symbol: string = '%'
): string => {
  const number = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(number)) return '';
  return `${(number * 100).toFixed(decimals)}${symbol}`;
};

/**
 * 格式化为货币
 */
export const formatCurrency = (
  num: number | string,
  currency: string = '¥',
  decimals: number = 2
): string => {
  return formatNumber(num, { prefix: currency, decimals });
};

/**
 * 格式化为文件大小
 */
export const formatBytes = (
  bytes: number,
  decimals: number = 2,
  si: boolean = true
): string => {
  if (bytes === 0) return '0 B';

  const units = si
    ? ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
    : ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];

  const unitIndex = Math.floor(Math.log(bytes) / (si ? 3 : Math.log(1024)));
  const value = bytes / Math.pow(si ? 1000 : 1024, unitIndex);

  return `${value.toFixed(decimals)} ${units[unitIndex]}`;
};

/**
 * 格式化为千分位
 */
export const formatThousands = (num: number | string): string => {
  const number = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(number)) return '';
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

/**
 * 数字四舍五入
 */
export const round = (num: number, decimals: number = 0): number => {
  const factor = Math.pow(10, decimals);
  return Math.round(num * factor) / factor;
};

/**
 * 数字向上取整
 */
export const ceil = (num: number, decimals: number = 0): number => {
  const factor = Math.pow(10, decimals);
  return Math.ceil(num * factor) / factor;
};

/**
 * 数字向下取整
 */
export const floor = (num: number, decimals: number = 0): number => {
  const factor = Math.pow(10, decimals);
  return Math.floor(num * factor) / factor;
};

/**
 * 数字截断
 */
export const trunc = (num: number, decimals: number = 0): number => {
  const factor = Math.pow(10, decimals);
  return Math.trunc(num * factor) / factor;
};

/**
 * 数字范围限制
 */
export const clamp = (num: number, min: number, max: number): number => {
  return Math.min(Math.max(num, min), max);
};

/**
 * 数字线性插值
 */
export const lerp = (start: number, end: number, t: number): number => {
  return start + (end - start) * t;
};

/**
 * 数字映射到新范围
 */
export const mapRange = (
  num: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number => {
  return ((num - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
};

/**
 * 数字取绝对值
 */
export const abs = (num: number): number => {
  return Math.abs(num);
};

/**
 * 数字取符号
 */
export const sign = (num: number): number => {
  return Math.sign(num);
};

/**
 * 数字取平方根
 */
export const sqrt = (num: number): number => {
  return Math.sqrt(num);
};

/**
 * 数字取幂
 */
export const pow = (num: number, exponent: number): number => {
  return Math.pow(num, exponent);
};

/**
 * 数字取最大值
 */
export const max = (...nums: number[]): number => {
  return Math.max(...nums);
};

/**
 * 数字取最小值
 */
export const min = (...nums: number[]): number => {
  return Math.min(...nums);
};

/**
 * 数字求和
 */
export const sum = (...nums: number[]): number => {
  return nums.reduce((acc, num) => acc + num, 0);
};

/**
 * 数字求平均值
 */
export const average = (...nums: number[]): number => {
  if (nums.length === 0) return 0;
  return sum(...nums) / nums.length;
};

/**
 * 数字求中位数
 */
export const median = (...nums: number[]): number => {
  if (nums.length === 0) return 0;

  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
};

/**
 * 数字求众数
 */
export const mode = (...nums: number[]): number[] => {
  if (nums.length === 0) return [];

  const frequency: Record<number, number> = {};
  nums.forEach(num => {
    frequency[num] = (frequency[num] || 0) + 1;
  });

  const maxFrequency = Math.max(...Object.values(frequency));
  return Object.keys(frequency)
    .map(Number)
    .filter(num => frequency[num] === maxFrequency);
};

/**
 * 数字求标准差
 */
export const standardDeviation = (...nums: number[]): number => {
  if (nums.length === 0) return 0;

  const avg = average(...nums);
  const squaredDiffs = nums.map(num => Math.pow(num - avg, 2));
  const avgSquaredDiff = average(...squaredDiffs);

  return sqrt(avgSquaredDiff);
};

/**
 * 数字求方差
 */
export const variance = (...nums: number[]): number => {
  return pow(standardDeviation(...nums), 2);
};

/**
 * 数字范围
 */
export const range = (...nums: number[]): { min: number; max: number; range: number } => {
  if (nums.length === 0) return { min: 0, max: 0, range: 0 };

  const minVal = min(...nums);
  const maxVal = max(...nums);

  return { min: minVal, max: maxVal, range: maxVal - minVal };
};

/**
 * 数字范围检查
 */
export const inRange = (num: number, min: number, max: number, inclusive: boolean = true): boolean => {
  if (inclusive) {
    return num >= min && num <= max;
  }
  return num > min && num < max;
};

/**
 * 数字是否为偶数
 */
export const isEven = (num: number): boolean => {
  return num % 2 === 0;
};

/**
 * 数字是否为奇数
 */
export const isOdd = (num: number): boolean => {
  return num % 2 !== 0;
};

/**
 * 数字是否为整数
 */
export const isInteger = (num: number): boolean => {
  return Number.isInteger(num);
};

/**
 * 数字是否为浮点数
 */
export const isFloat = (num: number): boolean => {
  return !isInteger(num) && !isNaN(num);
};

/**
 * 数字是否为正数
 */
export const isPositive = (num: number): boolean => {
  return num > 0;
};

/**
 * 数字是否为负数
 */
export const isNegative = (num: number): boolean => {
  return num < 0;
};

/**
 * 数字是否为零
 */
export const isZero = (num: number): boolean => {
  return num === 0;
};

/**
 * 数字是否为NaN
 */
export const isNaN = (num: number): boolean => {
  return Number.isNaN(num);
};

/**
 * 数字是否为有限数
 */
export const isFinite = (num: number): boolean => {
  return Number.isFinite(num);
};

/**
 * 数字是否为有效数（非NaN且有限）
 */
export const isValidNumber = (num: any): boolean => {
  return typeof num === 'number' && isFinite(num) && !isNaN(num);
};

/**
 * 数字是否相等（考虑浮点数精度）
 */
export const equals = (a: number, b: number, epsilon: number = 0.00001): boolean => {
  return abs(a - b) < epsilon;
};

/**
 * 数字排序
 */
export const sort = (nums: number[], order: 'asc' | 'desc' = 'asc'): number[] => {
  return [...nums].sort((a, b) => {
    return order === 'asc' ? a - b : b - a;
  });
};

/**
 * 数字去重
 */
export const unique = (...nums: number[]): number[] => {
  return [...new Set(nums)];
};

/**
 * 数字分组
 */
export const groupByRange = (
  nums: number[],
  groupSize: number
): number[][] => {
  const groups: number[][] = [];
  const sorted = sort(nums);

  for (let i = 0; i < sorted.length; i += groupSize) {
    groups.push(sorted.slice(i, i + groupSize));
  }

  return groups;
};

/**
 * 数字分桶
 */
export const bucketize = (
  nums: number[],
  bucketSize: number,
  start?: number,
  end?: number
): Map<string, number[]> => {
  const result = new Map<string, number[]>();
  const minVal = start !== undefined ? start : min(...nums);
  const maxVal = end !== undefined ? end : max(...nums);

  for (let i = minVal; i < maxVal; i += bucketSize) {
    const bucketKey = `[${i}, ${i + bucketSize})`;
    const bucketNumbers = nums.filter(num => num >= i && num < i + bucketSize);
    result.set(bucketKey, bucketNumbers);
  }

  return result;
};

/**
 * 数字分位数
 */
export const quantile = (nums: number[], p: number): number => {
  if (nums.length === 0) return 0;
  if (nums.length === 1) return nums[0];

  const sorted = sort(nums);
  const index = (sorted.length - 1) * p;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;

  if (upper >= sorted.length) return sorted[sorted.length - 1];

  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
};

/**
 * 数字百分位数
 */
export const percentile = (nums: number[], p: number): number => {
  return quantile(nums, p / 100);
};

/**
 * 随机整数
 */
export const randomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * 随机浮点数
 */
export const randomFloat = (min: number, max: number): number => {
  return Math.random() * (max - min) + min;
};

/**
 * 随机数从数组中
 */
export const randomFrom = <T>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

/**
 * 随机数生成器（种子）
 */
export const seededRandom = (seed: number): (() => number) => {
  let currentSeed = seed;

  return () => {
    currentSeed = (currentSeed * 9301 + 49297) % 233280;
    return currentSeed / 233280;
  };
};

/**
 * 数字转二进制字符串
 */
export const toBinary = (num: number): string => {
  return num.toString(2);
};

/**
 * 数字转八进制字符串
 */
export const toOctal = (num: number): string => {
  return num.toString(8);
};

/**
 * 数字转十六进制字符串
 */
export const toHex = (num: number): string => {
  return num.toString(16);
};

/**
 * 二进制字符串转数字
 */
export const fromBinary = (binary: string): number => {
  return parseInt(binary, 2);
};

/**
 * 八进制字符串转数字
 */
export const fromOctal = (octal: string): number => {
  return parseInt(octal, 8);
};

/**
 * 十六进制字符串转数字
 */
export const fromHex = (hex: string): number => {
  return parseInt(hex, 16);
};

/**
 * 数字补零
 */
export const padZero = (num: number, length: number = 2): string => {
  return num.toString().padStart(length, '0');
};

/**
 * 数字转罗马数字
 */
export const toRoman = (num: number): string => {
  if (num <= 0 || num > 3999) return '';

  const romanNumerals = [
    { value: 1000, symbol: 'M' },
    { value: 900, symbol: 'CM' },
    { value: 500, symbol: 'D' },
    { value: 400, symbol: 'CD' },
    { value: 100, symbol: 'C' },
    { value: 90, symbol: 'XC' },
    { value: 50, symbol: 'L' },
    { value: 40, symbol: 'XL' },
    { value: 10, symbol: 'X' },
    { value: 9, symbol: 'IX' },
    { value: 5, symbol: 'V' },
    { value: 4, symbol: 'IV' },
    { value: 1, symbol: 'I' },
  ];

  let result = '';
  let remaining = num;

  for (const { value, symbol } of romanNumerals) {
    while (remaining >= value) {
      result += symbol;
      remaining -= value;
    }
  }

  return result;
};

/**
 * 罗马数字转数字
 */
export const fromRoman = (roman: string): number => {
  const romanNumerals: Record<string, number> = {
    'M': 1000, 'CM': 900, 'D': 500, 'CD': 400,
    'C': 100, 'XC': 90, 'L': 50, 'XL': 40,
    'X': 10, 'IX': 9, 'V': 5, 'IV': 4, 'I': 1
  };

  let result = 0;
  let i = 0;

  while (i < roman.length) {
    const twoChar = roman.substr(i, 2);
    const oneChar = roman.substr(i, 1);

    if (romanNumerals[twoChar]) {
      result += romanNumerals[twoChar];
      i += 2;
    } else if (romanNumerals[oneChar]) {
      result += romanNumerals[oneChar];
      i += 1;
    } else {
      return 0; // 无效的罗马数字
    }
  }

  return result;
};

/**
 * 数字转中文数字
 */
export const toChineseNumber = (num: number): string => {
  if (num === 0) return '零';

  const digits = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
  const units = ['', '十', '百', '千', '万', '十万', '百万', '千万', '亿'];

  const str = num.toString();
  let result = '';

  for (let i = 0; i < str.length; i++) {
    const digit = parseInt(str[i]);
    const unit = str.length - i - 1;

    if (digit === 0) {
      if (result[result.length - 1] !== '零') {
        result += '零';
      }
    } else {
      result += digits[digit] + units[unit];
    }
  }

  // 处理连续的零和开头的零
  result = result.replace(/零+/g, '零').replace(/零*$/, '');

  // 处理十几的特殊情况
  if (result.startsWith('一十')) {
    result = result.substring(1);
  }

  return result || '零';
};

/**
 * 中文数字转数字
 */
export const fromChineseNumber = (chinese: string): number => {
  const digits: Record<string, number> = {
    '零': 0, '一': 1, '二': 2, '三': 3, '四': 4,
    '五': 5, '六': 6, '七': 7, '八': 8, '九': 9
  };
  const units: Record<string, number> = {
    '十': 10, '百': 100, '千': 1000, '万': 10000, '亿': 100000000
  };

  let result = 0;
  let temp = 0;

  for (let i = 0; i < chinese.length; i++) {
    const char = chinese[i];

    if (digits[char] !== undefined) {
      temp = digits[char];
    } else if (units[char] !== undefined) {
      if (units[char] >= 10000) {
        result += temp * units[char];
        temp = 0;
      } else {
        temp *= units[char];
        if (i === chinese.length - 1 || units[chinese[i + 1]] >= 10000) {
          result += temp;
          temp = 0;
        }
      }
    }
  }

  return result + temp;
};

export default {
  formatNumber,
  formatPercent,
  formatCurrency,
  formatBytes,
  formatThousands,
  round,
  ceil,
  floor,
  trunc,
  clamp,
  lerp,
  mapRange,
  abs,
  sign,
  sqrt,
  pow,
  max,
  min,
  sum,
  average,
  median,
  mode,
  standardDeviation,
  variance,
  range,
  inRange,
  isEven,
  isOdd,
  isInteger,
  isFloat,
  isPositive,
  isNegative,
  isZero,
  isNaN,
  isFinite,
  isValidNumber,
  equals,
  sort,
  unique,
  groupByRange,
  bucketize,
  quantile,
  percentile,
  randomInt,
  randomFloat,
  randomFrom,
  seededRandom,
  toBinary,
  toOctal,
  toHex,
  fromBinary,
  fromOctal,
  fromHex,
  padZero,
  toRoman,
  fromRoman,
  toChineseNumber,
  fromChineseNumber,
};

/**
 * 字符串工具函数
 * 提供常用的字符串处理、转换、验证等工具函数
 */

/**
 * 常用字符串正则表达式
 */
export const STRING_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_CN: /^1[3-9]\d{9}$/,
  ID_CARD_CN: /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/,
  URL: /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
  NUMBER: /^\d+$/,
  DECIMAL: /^\d+(\.\d+)?$/,
  CHINESE: /^[\u4e00-\u9fa5]+$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
} as const;

/**
 * 字符串截断
 */
export const truncate = (str: string, length: number, suffix: string = '...'): string => {
  if (!str || str.length <= length) return str;
  return str.substring(0, length) + suffix;
};

/**
 * 字符串首字母大写
 */
export const capitalize = (str: string): string => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * 字符串每个单词首字母大写
 */
export const capitalizeWords = (str: string): string => {
  if (!str) return '';
  return str.replace(/\b\w/g, char => char.toUpperCase());
};

/**
 * 字符串转驼峰命名
 */
export const toCamelCase = (str: string): string => {
  if (!str) return '';
  return str
    .replace(/[-_\s]+(.)?/g, (_, char) => (char ? char.toUpperCase() : ''))
    .replace(/^[A-Z]/, char => char.toLowerCase());
};

/**
 * 字符串转帕斯卡命名（大驼峰）
 */
export const toPascalCase = (str: string): string => {
  if (!str) return '';
  return toCamelCase(str).replace(/^[a-z]/, char => char.toUpperCase());
};

/**
 * 字符串转蛇形命名
 */
export const toSnakeCase = (str: string): string => {
  if (!str) return '';
  return str
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[-\s]+/g, '_')
    .toLowerCase();
};

/**
 * 字符串转短横线命名
 */
export const toKebabCase = (str: string): string => {
  if (!str) return '';
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[_\s]+/g, '-')
    .toLowerCase();
};

/**
 * 移除字符串中的HTML标签
 */
export const stripHtml = (html: string): string => {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '');
};

/**
 * 移除字符串中的空格
 */
export const removeSpaces = (str: string): string => {
  if (!str) return '';
  return str.replace(/\s/g, '');
};

/**
 * 移除字符串首尾空格
 */
export const trim = (str: string): string => {
  if (!str) return '';
  return str.trim();
};

/**
 * 移除字符串左侧空格
 */
export const trimLeft = (str: string): string => {
  if (!str) return '';
  return str.trimLeft();
};

/**
 * 移除字符串右侧空格
 */
export const trimRight = (str: string): string => {
  if (!str) return '';
  return str.trimRight();
};

/**
 * 转换字符串中的特殊字符为HTML实体
 */
export const escapeHtml = (html: string): string => {
  if (!html) return '';
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return html.replace(/[&<>"']/g, char => map[char]);
};

/**
 * 反转义HTML实体
 */
export const unescapeHtml = (html: string): string => {
  if (!html) return '';
  const map: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#039;': "'",
  };
  return html.replace(/&amp;|&lt;|&gt;|&quot;|&#039;/g, char => map[char]);
};

/**
 * 生成随机字符串
 */
export const randomString = (length: number = 8, charset?: string): string => {
  const chars = charset || 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * 生成UUID v4
 */
export const uuid = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = Math.random() * 16 | 0;
    const value = char === 'x' ? random : (random & 0x3 | 0x8);
    return value.toString(16);
  });
};

/**
 * 生成短ID
 */
export const shortId = (): string => {
  return randomString(8, '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz');
};

/**
 * 字符串反转
 */
export const reverse = (str: string): string => {
  if (!str) return '';
  return str.split('').reverse().join('');
};

/**
 * 字符串重复
 */
export const repeat = (str: string, times: number): string => {
  if (!str) return '';
  return str.repeat(times);
};

/**
 * 填充字符串（左侧）
 */
export const padLeft = (str: string, length: number, padChar: string = '0'): string => {
  if (!str) return '';
  return str.padStart(length, padChar);
};

/**
 * 填充字符串（右侧）
 */
export const padRight = (str: string, length: number, padChar: string = '0'): string => {
  if (!str) return '';
  return str.padEnd(length, padChar);
};

/**
 * 字符串是否为空
 */
export const isEmpty = (str: string | null | undefined): boolean => {
  return !str || str.trim().length === 0;
};

/**
 * 字符串是否不为空
 */
export const isNotEmpty = (str: string | null | undefined): boolean => {
  return !isEmpty(str);
};

/**
 * 验证邮箱格式
 */
export const isEmail = (str: string): boolean => {
  return STRING_PATTERNS.EMAIL.test(str);
};

/**
 * 验证手机号格式（中国）
 */
export const isPhoneCN = (str: string): boolean => {
  return STRING_PATTERNS.PHONE_CN.test(str);
};

/**
 * 验证身份证号格式（中国）
 */
export const isIdCardCN = (str: string): boolean => {
  return STRING_PATTERNS.ID_CARD_CN.test(str);
};

/**
 * 验证URL格式
 */
export const isUrl = (str: string): boolean => {
  return STRING_PATTERNS.URL.test(str);
};

/**
 * 验证数字格式
 */
export const isNumber = (str: string): boolean => {
  return STRING_PATTERNS.NUMBER.test(str);
};

/**
 * 验证小数格式
 */
export const isDecimal = (str: string): boolean => {
  return STRING_PATTERNS.DECIMAL.test(str);
};

/**
 * 验证中文字符
 */
export const isChinese = (str: string): boolean => {
  return STRING_PATTERNS.CHINESE.test(str);
};

/**
 * 验证密码强度（至少8位，包含大小写字母和数字）
 */
export const isStrongPassword = (str: string): boolean => {
  return STRING_PATTERNS.PASSWORD.test(str);
};

/**
 * 字符串包含检查（忽略大小写）
 */
export const includesIgnoreCase = (str: string, searchStr: string): boolean => {
  if (!str || !searchStr) return false;
  return str.toLowerCase().includes(searchStr.toLowerCase());
};

/**
 * 字符串替换（忽略大小写）
 */
export const replaceIgnoreCase = (str: string, searchStr: string, replacement: string): string => {
  if (!str || !searchStr) return str;
  const regex = new RegExp(searchStr, 'gi');
  return str.replace(regex, replacement);
};

/**
 * 字符串比较（忽略大小写）
 */
export const equalsIgnoreCase = (str1: string, str2: string): boolean => {
  if (str1 === str2) return true;
  if (!str1 || !str2) return false;
  return str1.toLowerCase() === str2.toLowerCase();
};

/**
 * 字符串比较（自然排序）
 */
export const naturalCompare = (str1: string, str2: string): number => {
  return str1.localeCompare(str2, undefined, { numeric: true, sensitivity: 'base' });
};

/**
 * 统计字符串中子字符串出现的次数
 */
export const countOccurrences = (str: string, searchStr: string): number => {
  if (!str || !searchStr) return 0;
  return str.split(searchStr).length - 1;
};

/**
 * 提取字符串中的所有数字
 */
export const extractNumbers = (str: string): number[] => {
  if (!str) return [];
  const matches = str.match(/\d+(\.\d+)?/g);
  return matches ? matches.map(Number) : [];
};

/**
 * 提取字符串中的所有链接
 */
export const extractUrls = (str: string): string[] => {
  if (!str) return [];
  const regex = /(https?:\/\/[^\s]+)/g;
  return str.match(regex) || [];
};

/**
 * 提取字符串中的所有邮箱
 */
export const extractEmails = (str: string): string[] => {
  if (!str) return [];
  const regex = /[^\s@]+@[^\s@]+\.[^\s@]+/g;
  return str.match(regex) || [];
};

/**
 * 高亮字符串中的关键词
 */
export const highlightKeywords = (str: string, keywords: string[], highlightClass: string = 'highlight'): string => {
  if (!str || !keywords || keywords.length === 0) return str;

  let result = str;
  keywords.forEach(keyword => {
    if (!keyword) return;
    const regex = new RegExp(`(${keyword})`, 'gi');
    result = result.replace(regex, `<span class="${highlightClass}">$1</span>`);
  });

  return result;
};

/**
 * 遮盖字符串（用于敏感信息）
 */
export const maskString = (str: string, start: number = 0, end: number = 4, maskChar: string = '*'): string => {
  if (!str) return '';
  if (str.length <= start + end) return str;

  const maskLength = str.length - start - end;
  const mask = maskChar.repeat(maskLength);
  return str.substring(0, start) + mask + str.substring(str.length - end);
};

/**
 * 遮盖手机号
 */
export const maskPhone = (phone: string): string => {
  return maskString(phone, 3, 4);
};

/**
 * 遮盖邮箱
 */
export const maskEmail = (email: string): string => {
  if (!email || !isEmail(email)) return email;
  const [username, domain] = email.split('@');
  const maskedUsername = username.length > 2
    ? username.substring(0, 2) + '*'.repeat(username.length - 2)
    : '*'.repeat(username.length);
  return `${maskedUsername}@${domain}`;
};

/**
 * 字符串相似度计算（Levenshtein距离）
 */
export const levenshteinDistance = (str1: string, str2: string): number => {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

  for (let i = 0; i <= str1.length; i++) {
    matrix[0][i] = i;
  }
  for (let j = 0; j <= str2.length; j++) {
    matrix[j][0] = j;
  }

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }

  return matrix[str2.length][str1.length];
};

/**
 * 字符串相似度百分比
 */
export const similarity = (str1: string, str2: string): number => {
  const distance = levenshteinDistance(str1, str2);
  const maxLength = Math.max(str1.length, str2.length);
  if (maxLength === 0) return 100;
  return ((maxLength - distance) / maxLength) * 100;
};

/**
 * 格式化为文件大小
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * 格式化为电话号码（中国）
 */
export const formatPhoneCN = (phone: string): string => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{3})(\d{4})(\d{4})/, '$1 $2 $3');
  }
  return phone;
};

/**
 * 格式化为身份证号（中国）
 */
export const formatIdCardCN = (idCard: string): string => {
  if (!idCard) return '';
  const cleaned = idCard.replace(/\s/g, '');
  if (cleaned.length === 18) {
    return cleaned.replace(/(\d{6})(\d{8})(\d{4})/, '$1 $2 $3');
  }
  return idCard;
};

/**
 * 格式化为银行卡号
 */
export const formatBankCard = (cardNumber: string): string => {
  if (!cardNumber) return '';
  const cleaned = cardNumber.replace(/\D/g, '');
  return cleaned.replace(/(\d{4})/g, '$1 ').trim();
};

/**
 * 格式化为货币（中文）
 */
export const formatCurrencyCN = (amount: number): string => {
  const units = ['', '万', '亿'];
  const unitIndex = Math.floor(String(amount).length / 4);
  const value = amount / Math.pow(10000, unitIndex);

  if (unitIndex < units.length) {
    return `${value.toFixed(2)}${units[unitIndex]}`;
  }
  return amount.toFixed(2);
};

/**
 * 转换为拼音（简单版）
 */
export const toPinyin = (str: string): string => {
  // 简单的拼音映射（仅示例，实际应使用专业库）
  const pinyinMap: Record<string, string> = {
    '中': 'zhong', '文': 'wen', '测': 'ce', '试': 'shi',
  };

  if (!str) return '';
  return str.split('').map(char => pinyinMap[char] || char).join(' ');
};

/**
 * 转换为拼音首字母
 */
export const toPinyinInitials = (str: string): string => {
  const pinyin = toPinyin(str);
  return pinyin.split(' ').map(word => word.charAt(0).toUpperCase()).join('');
};

export default {
  truncate,
  capitalize,
  capitalizeWords,
  toCamelCase,
  toPascalCase,
  toSnakeCase,
  toKebabCase,
  stripHtml,
  removeSpaces,
  trim,
  trimLeft,
  trimRight,
  escapeHtml,
  unescapeHtml,
  randomString,
  uuid,
  shortId,
  reverse,
  repeat,
  padLeft,
  padRight,
  isEmpty,
  isNotEmpty,
  isEmail,
  isPhoneCN,
  isIdCardCN,
  isUrl,
  isNumber,
  isDecimal,
  isChinese,
  isStrongPassword,
  includesIgnoreCase,
  replaceIgnoreCase,
  equalsIgnoreCase,
  naturalCompare,
  countOccurrences,
  extractNumbers,
  extractUrls,
  extractEmails,
  highlightKeywords,
  maskString,
  maskPhone,
  maskEmail,
  levenshteinDistance,
  similarity,
  formatFileSize,
  formatPhoneCN,
  formatIdCardCN,
  formatBankCard,
  formatCurrencyCN,
  toPinyin,
  toPinyinInitials,
  STRING_PATTERNS,
};

/**
 * 数据格式化工具函数
 */

/**
 * 格式化日期
 */
export function formatDate(date: Date | string | number, format: string = 'YYYY-MM-DD'): string {
  if (!date) return '';

  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
}

/**
 * 格式化数字
 */
export function formatNumber(num: number | string, decimals: number = 2): string {
  if (num === undefined || num === null) return '';
  const number = Number(num);
  if (isNaN(number)) return '';

  return number.toLocaleString('zh-CN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * 格式化货币
 */
export function formatCurrency(amount: number | string, currency: string = 'CNY'): string {
  if (amount === undefined || amount === null) return '';
  const number = Number(amount);
  if (isNaN(number)) return '';

  const currencySymbols: Record<string, string> = {
    CNY: '¥',
    USD: '$',
    EUR: '€',
    IDR: 'Rp',
  };

  const symbol = currencySymbols[currency] || currency;

  return `${symbol}${number.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * 格式化百分比
 */
export function formatPercent(value: number | string, decimals: number = 2): string {
  if (value === undefined || value === null) return '';
  const number = Number(value);
  if (isNaN(number)) return '';

  return `${(number * 100).toFixed(decimals)}%`;
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * 截断文本
 */
export function truncateText(text: string, maxLength: number = 50): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * 格式化手机号
 */
export function formatPhone(phone: string): string {
  if (!phone) return '';

  // 移除所有非数字字符
  const cleaned = phone.replace(/\D/g, '');

  // 中国手机号：11位
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{3})(\d{4})(\d{4})/, '$1 $2 $3');
  }

  return phone;
}

/**
 * 格式化身份证号（脱敏）
 */
export function formatIdCard(idCard: string): string {
  if (!idCard || idCard.length < 8) return idCard;
  const start = idCard.slice(0, 6);
  const end = idCard.slice(-4);
  return `${start}****${end}`;
}

/**
 * 获取状态标签样式
 */
export function getStatusStyle(status: string, statusMap?: Record<string, { label: string; color: string }>) {
  if (statusMap && statusMap[status]) {
    return statusMap[status];
  }

  // 默认状态映射
  const defaultStatusMap: Record<string, { label: string; color: string }> = {
    active: { label: '启用', color: '#52c41a' },
    inactive: { label: '禁用', color: '#cf1322' },
    enabled: { label: '启用', color: '#52c41a' },
    disabled: { label: '禁用', color: '#cf1322' },
    pending: { label: '待处理', color: '#faad14' },
    processing: { label: '处理中', color: '#1677ff' },
    completed: { label: '已完成', color: '#52c41a' },
    failed: { label: '失败', color: '#cf1322' },
    draft: { label: '草稿', color: '#8c8c8c' },
    audited: { label: '已审核', color: '#389e0d' },
    approved: { label: '已批准', color: '#1677FF' },
  };

  return defaultStatusMap[status] || { label: status, color: '#8c8c8c' };
}
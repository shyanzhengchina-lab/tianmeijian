/**
 * 日期时间工具函数
 * 提供常用的日期时间处理、格式化、计算等工具函数
 */

import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/zh-cn';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
dayjs.extend(isSameOrBefore);

dayjs.locale('zh-cn');

/**
 * 常用日期格式
 */
export const DATE_FORMATS = {
  DATE: 'YYYY-MM-DD',
  TIME: 'HH:mm:ss',
  DATETIME: 'YYYY-MM-DD HH:mm:ss',
  DATETIME_MINUTE: 'YYYY-MM-DD HH:mm',
  MONTH: 'YYYY-MM',
  YEAR: 'YYYY',
  WEEK: 'YYYY-ww',
  MONTH_NAME: 'YYYY年MM月',
  MONTH_NAME_SHORT: 'M月',
  MONTH_NAME_EN: 'MMMM',
  QUARTER: 'YYYY-QQ', // 季度 Q1 Q2 Q3 Q4
} as const;

/**
 * 时区信息
 */
export const TIMEZONES = [
  { value: 'Asia/Shanghai', label: '上海 (UTC+8:00)', offset: '+08:00' },
  { value: 'Asia/Beijing', label: '北京 (UTC+8:00)', offset: '+08:00' },
  { value: 'Asia/Chongqing', label: '重庆 (UTC+8:00)', offset: '+08:00' },
  { value: 'Asia/Hong_Kong', label: '香港 (UTC+8:00)', offset: '+08:00' },
] as const;

/**
 * 格式化日期
 */
export const formatDate = (date: Date | string | number, format: string = DATE_FORMATS.DATE): string => {
  return dayjs(date).format(format);
};

/**
 * 格式化时间
 */
export const formatTime = (time: Date | string | number, format: string = DATE_FORMATS.TIME): string => {
  return dayjs(time).format(format);
};

/**
 * 格式化日期时间
 */
export const formatDateTime = (datetime: Date | string | number, format: string = DATE_FORMATS.DATETIME): string => {
  return dayjs(datetime).format(format);
};

/**
 * 格式化为友好的时间显示
 */
export const formatFriendlyDateTime = (datetime: Date | string | number): string => {
  return dayjs(datetime).format('YYYY-MM-DD HH:mm');
};

/**
 * 格式化为日期时间
 */
export const formatDateTimeMinute = (datetime: Date | string | number): string => {
  return dayjs(datetime).format('YYYY-MM-DD HH:mm');
};

/**
 * 格式化为月份名称
 */
export const formatMonthName = (date: Date | string | number, locale: string = 'zh-CN'): string => {
  return dayjs(date).locale(locale).format(DATE_FORMATS.MONTH_NAME_EN);
};

/**
 * 格式化为月份名称（短格式）
 */
export const formatMonthNameShort = (date: Date | string | number): string => {
  return dayjs(date).format(DATE_FORMATS.MONTH_NAME_SHORT);
};

/**
 * 格式化为季度
 */
export const formatQuarter = (date: Date | string | number): string => {
  return dayjs(date).format(DATE_FORMATS.QUARTER);
};

/**
 * 格式化为年份
 */
export const formatYear = (date: Date | string | number): string => {
  return dayjs(date).format(DATE_FORMATS.YEAR);
};

/**
 * 格式化为周
 */
export const formatWeek = (date: Date | string | number): string => {
  return dayjs(date).format(DATE_FORMATS.WEEK);
};

/**
 * 获取当前时间
 */
export const getCurrentDate = (): Date => {
  return new Date();
};

/**
 * 获取当前时间字符串
 */
export const getCurrentDateStr = (): string => {
  return formatDate(getCurrentDate());
};

/**
 * 获取当前时间字符串
 */
export const getCurrentDateTimeStr = (): string => {
  return formatDateTime(getCurrentDate());
};

/**
 * 获取当前时间戳
 */
export const getCurrentTimestamp = (): number => {
  return Date.now();
};

/**
 * 相对时间显示
 */
export const getRelativeTime = (date: Date | string | number): string => {
  const now = dayjs();
  const target = dayjs(date);
  const diff = now.diff(target, 'minute');

  if (diff < 1) {
    return '刚刚';
  } else if (diff < 60) {
    return `${diff}分钟前`;
  } else if (diff < 1440) { // 24小时内
    return `${Math.floor(diff / 60)}小时前`;
  } else if (diff < 43200) { // 30天内
    return `${Math.floor(diff / 1440)}天前`;
  } else {
    return formatDate(date);
  }
};

/**
 * 时间差计算（返回天时分秒）
 */
export const getTimeDiff = (
  startTime: Date | string | number,
  endTime?: Date | string | number
): { days: number; hours: number; minutes: number; seconds: number } => {
  const start = dayjs(startTime);
  const end = dayjs(endTime || getCurrentDate());
  const diff = end.diff(start, 'millisecond');

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60)) / 1000);
  const seconds = Math.floor((diff % 1000) / 1000);

  return { days, hours, minutes, seconds };
};

/**
 * 格式化时间差
 */
export const formatTimeDiff = (
  startTime: Date | string | number,
  endTime?: Date | string | number
): string => {
  const diff = getTimeDiff(startTime, endTime);
  const parts: string[] = [];

  if (diff.days > 0) {
    parts.push(`${diff.days}天`);
  }
  if (diff.hours > 0) {
    parts.push(`${diff.hours}小时`);
  }
  if (diff.minutes > 0) {
    parts.push(`${diff.minutes}分钟`);
  }
  if (diff.seconds > 0) {
    parts.push(`${diff.seconds}秒`);
  }

  return parts.join(' ') || '0秒';
};

/**
 * 判断是否是今天
 */
export const isToday = (date: Date | string | number): boolean => {
  return dayjs(date).isSame(dayjs(), 'day');
};

/**
 * 判断是否是昨天
 */
export const isYesterday = (date: Date | string | number): boolean => {
  return dayjs(date).isSame(dayjs().subtract(1, 'day'), 'day');
};

/**
 * 判断是否是本周
 */
export const isThisWeek = (date: Date | string | number): boolean => {
  return dayjs(date).isSame(dayjs(), 'week');
};

/**
 * 判断是否是本月
 */
export const isThisMonth = (date: Date | string | number): boolean => {
  return dayjs(date).isSame(dayjs(), 'month');
};

/**
 * 判断是否是本年
 */
export const isThisYear = (date: Date | string | number): boolean => {
  return dayjs(date).isSame(dayjs(), 'year');
};

/**
 * 获取日期范围的所有日期
 */
export const getDateRange = (
  startDate: Date | string | number,
  endDate: Date | string | number
): Date[] => {
  const start = dayjs(startDate);
  const end = dayjs(endDate);
  const dates: Date[] = [];
  let current = start.clone();

  while (current.isSameOrBefore(end)) {
    dates.push(current.toDate());
    current = current.add(1, 'day');
  }

  return dates;
};

/**
 * 获取月份的所有日期
 */
export const getMonthDates = (year: number, month: number): Date[] => {
  const date = dayjs().year(year).month(month - 1).date(1);
  const daysInMonth = date.daysInMonth();

  return Array.from({ length: daysInMonth }, (_, i) => {
    return date.add(i, 'day').toDate();
  });
};

/**
 * 获取本周的所有日期
 */
export const getWeekDates = (date?: Date | string | number): Date[] => {
  const d = date ? dayjs(date) : dayjs();
  const start = d.startOf('week');
  const end = d.endOf('week');
  const dates: Date[] = [];

  let current = start.clone();
  while (current.isSameOrBefore(end)) {
    dates.push(current.toDate());
    current = current.add(1, 'day');
  }

  return dates;
};

/**
 * 工作日计算（排除周末）
 */
export const getWorkDays = (
  startDate: Date | string | number,
  endDate?: Date | string | number,
  holidays?: Date[]
): number => {
  const start = dayjs(startDate);
  const end = endDate ? dayjs(endDate) : dayjs();
  const holidaysList = holidays || [];

  let workDays = 0;
  let current = start.clone();

  while (current.isSameOrBefore(end)) {
    const dayOfWeek = current.day();

    // 周末不算工作日
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      current = current.add(1, 'day');
      continue;
    }

    // 检查是否是节假日
    const dateStr = current.format(DATE_FORMATS.DATE);
    const isHoliday = holidaysList.some(h => dayjs(h).isSame(dateStr));

    if (!isHoliday) {
      workDays++;
    }

    current = current.add(1, 'day');
  }

  return workDays;
};

/**
 * 计算两个日期之间的工作日
 */
export const getWorkDaysDiff = (
  startDate: Date | string | number,
  endDate?: Date | string | number,
  holidays?: Date[]
): number => {
  return getWorkDays(startDate, endDate, holidays);
};

/**
 * 获取月份的最后一天
 */
export const getLastDayOfMonth = (year: number, month: number): Date => {
  return dayjs().year(year).month(month - 1).endOf('month').toDate();
};

/**
 * 获取月份的第一天
 */
export const getFirstDayOfMonth = (year: number, month: number): Date => {
  return dayjs().year(year).month(month - 1).startOf('month').toDate();
};

/**
 * 判断闰年
 */
export const isLeapYear = (year: number): boolean => {
  return (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0));
};

/**
 * 获取日期所在季度
 */
export const getQuarter = (date: Date | string | number): number => {
  return Math.ceil((dayjs(date).month() + 1) / 3);
};

/**
 * 添加天数
 */
export const addDays = (date: Date | string | number, days: number): Date => {
  return dayjs(date).add(days, 'day').toDate();
};

/**
 * 减少天数
 */
export const subtractDays = (date: Date | string | number, days: number): Date => {
  return dayjs(date).subtract(days, 'day').toDate();
};

/**
 * 添加小时
 */
export const addHours = (date: Date | string | number, hours: number): Date => {
  return dayjs(date).add(hours, 'hour').toDate();
};

/**
 * 减少小时
 */
export const subtractHours = (date: Date | string | number, hours: number): Date => {
  return dayjs(date).subtract(hours, 'hour').toDate();
};

/**
 * 添加分钟
 */
export const addMinutes = (date: Date | string | number, minutes: number): Date => {
  return dayjs(date).add(minutes, 'minute').toDate();
};

/**
 * 减少分钟
 */
export const subtractMinutes = (date: Date | string | number, minutes: number): Date => {
  return dayjs(date).subtract(minutes, 'minute').toDate();
};

/**
 * 比较两个日期
 */
export const compareDates = (date1: Date | string | number, date2: Date | string | number): number => {
  const d1 = dayjs(date1);
  const d2 = dayjs(date2);
  return d1.isBefore(d2) ? -1 : d1.isAfter(d2) ? 1 : 0;
};

/**
 * 日期范围验证
 */
export const validateDateRange = (
  startDate: Date | string | number,
  endDate: Date | string | number
): boolean => {
  const start = dayjs(startDate);
  const end = dayjs(endDate);
  return start.isSameOrBefore(end);
};

/**
 * 获取时间段文本描述
 */
export const getTimeRangeText = (
  startTime: Date | string | number,
  endTime: Date | string | number
): string => {
  const start = dayjs(startTime);
  const end = dayjs(endTime);

  if (start.isSame(end, 'day')) {
    return formatDate(startTime);
  }

  const startStr = formatTime(startTime);
  const endStr = formatTime(endTime);

  return `${startStr} - ${endStr}`;
};

/**
 * 生成日期序列
 */
export const generateDateSeries = (
  startDate: Date | string | number,
  endDate: Date | string | number,
  format?: string
): string[] => {
  const dates = getDateRange(startDate, endDate);
  const formatStr = format || DATE_FORMATS.DATE;
  return dates.map(d => formatDate(d, formatStr));
};

/**
 * 获取时间轴数据
 */
export const generateTimeline = (
  events: Array<{
    date: Date | string | number;
    title: string;
    description?: string;
  }>,
  format?: string
): Array<{
    date: string;
    title: string;
    description?: string;
  }> => {
  return events.map(event => ({
    date: formatDate(event.date, format),
      title: event.title,
      description: event.description,
    }));
};

/**
 * 计算年龄
 */
export const calculateAge = (birthDate: Date | string | number): number => {
  const now = dayjs();
  const birth = dayjs(birthDate);
  return Math.floor(now.diff(birth, 'year'));
};

/**
 * 格式化年龄显示
 */
export const formatAge = (birthDate: Date | string | number): string => {
  const age = calculateAge(birthDate);

  if (age < 0) return '未知';

  const years = Math.floor(age);
  const months = Math.floor((age - years) * 12);

  if (years === 0) {
    return `${months}个月`;
  }

  if (months === 0) {
    return `${years}岁`;
  }

  return `${years}岁${months > 0 ? `${months}个月` : ''}`;
};

/**
 * 获取时区时间
 */
export const getTimezoneTime = (timezone: string): Date => {
  return dayjs(new Date()).toDate();
};

/**
 * 格式化为相对时间（社交媒体风格）
 */
export const formatSocialTime = (date: Date | string | number): string => {
  const now = dayjs();
  const diff = now.diff(dayjs(date), 'second');

  if (diff < 60) {
    return '刚刚';
  } else if (diff < 3600) {
    return `${Math.floor(diff / 60)}分钟前`;
  } else if (diff < 86400) {
    return `${Math.floor(diff / 3600)}小时前`;
  } else if (diff < 604800) { // 7天内
    return `${Math.floor(diff / 86400)}天前`;
  } else {
    return formatDate(date);
  }
};

export default {
  formatDate,
  formatTime,
  formatDateTime,
  formatFriendlyDateTime,
  formatDateTimeMinute,
  formatMonthName,
  formatMonthNameShort,
  formatQuarter,
  formatYear,
  formatWeek,
  getCurrentDate,
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
  getWorkDaysDiff,
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
  getTimeRangeText,
  generateDateSeries,
  generateTimeline,
  calculateAge,
  formatAge,
  getTimezoneTime,
  formatSocialTime,
  DATE_FORMATS,
  TIMEZONES,
};

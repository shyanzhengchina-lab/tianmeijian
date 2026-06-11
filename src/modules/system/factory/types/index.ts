/**
 * 多工厂管理模块类型定义
 */

import type { PageQuery, PageResult } from '../../../../shared/api/requestTypes';

/**
 * 工厂状态
 */
export type FactoryStatus =
  | 'ACTIVE'      // 生效
  | 'INACTIVE';   // 停用

/**
 * 时区类型
 */
export type Timezone =
  | 'Asia/Shanghai'       // 中国标准时间
  | 'Asia/Jakarta'       // 印尼西部时间
  | 'Asia/Tokyo'         // 日本标准时间
  | 'America/New_York'   // 美国东部时间
  | 'Europe/London';     // 格林威治标准时间

/**
 * 货币类型
 */
export type Currency =
  | 'CNY'   // 人民币
  | 'IDR'   // 印尼盾
  | 'USD'   // 美元
  | 'EUR'   // 欧元
  | 'JPY';  // 日元

/**
 * 语言类型
 */
export type Language =
  | 'zh-CN'  // 简体中文
  | 'zh-TW'  // 繁体中文
  | 'en-US'  // 美式英语
  | 'id-ID'  // 印尼语
  | 'ja-JP'; // 日语

/**
 * 工厂配置接口
 */
export interface FactoryConfig {
  // 基本信息
  id: string;              // 工厂ID
  code: string;            // 工厂编码
  name: string;            // 工厂名称（中文）
  nameEn?: string;         // 工厂名称（英文）

  // 地理位置
  country: string;         // 所在国家
  province?: string;       // 省份/州
  city?: string;           // 城市
  address?: string;        // 详细地址

  // 配置信息
  timezone: Timezone;      // 时区
  currency: Currency;      // 货币
  language: Language;      // 主用语言

  // 状态信息
  status: FactoryStatus;   // 状态
  sortOrder: number;       // 排序

  // 联系信息
  contactPerson?: string;  // 联系人
  contactPhone?: string;   // 联系电话
  contactEmail?: string;   // 联系邮箱

  // 描述信息
  description?: string;    // 描述
  remark?: string;         // 备注

  // 系统信息
  createTime: string;      // 创建时间
  updateTime: string;      // 更新时间
  creatorId: string;       // 创建人ID
  creatorName: string;     // 创建人姓名
  updaterId?: string;      // 更新人ID
  updaterName?: string;    // 更新人姓名
}

/**
 * 工厂查询参数
 */
export interface FactoryQuery extends PageQuery {
  code?: string;           // 工厂编码
  name?: string;           // 工厂名称
  status?: FactoryStatus;  // 状态
  country?: string;        // 所在国家
  startDate?: string;      // 开始日期
  endDate?: string;        // 结束日期
}

/**
 * 创建工厂DTO
 */
export interface CreateFactoryDTO {
  code: string;            // 工厂编码
  name: string;            // 工厂名称
  nameEn?: string;         // 工厂名称（英文）
  country: string;         // 所在国家
  province?: string;       // 省份/州
  city?: string;           // 城市
  address?: string;        // 详细地址
  timezone: Timezone;      // 时区
  currency: Currency;      // 货币
  language: Language;      // 主用语言
  sortOrder: number;       // 排序
  contactPerson?: string;  // 联系人
  contactPhone?: string;   // 联系电话
  contactEmail?: string;   // 联系邮箱
  description?: string;    // 描述
  remark?: string;         // 备注
}

/**
 * 更新工厂DTO
 */
export interface UpdateFactoryDTO extends Partial<CreateFactoryDTO> {
  id: string;              // 工厂ID
}

/**
 * 切换工厂DTO
 */
export interface SwitchFactoryDTO {
  factoryId: string;      // 目标工厂ID
}

/**
 * 用户工厂授权
 */
export interface UserFactoryAuth {
  userId: string;          // 用户ID
  userName: string;        // 用户名
  factoryIds: string[];    // 有权访问的工厂ID列表
  defaultFactoryId: string; // 默认工厂ID
  effectiveDate?: string;  // 生效日期
  expiryDate?: string;     // 失效日期
}

/**
 * 工厂统计信息
 */
export interface FactoryStats {
  factoryId: string;       // 工厂ID
  factoryName: string;     // 工厂名称
  workshopCount: number;    // 车间数量
  workCenterCount: number; // 工作中心数量
  teamCount: number;       // 班组数量
  employeeCount: number;   // 员工数量
  equipmentCount: number;  // 设备数量
  productionOrderCount: number;  // 生产订单数量
  workOrderCount: number; // 生产工单数量
  todayProduction: number; // 今日产量
}

/**
 * 工厂状态映射
 */
export const FACTORY_STATUS_MAP: Record<FactoryStatus, { label: string; color: string; bg: string; border: string }> = {
  ACTIVE: { label: '生效', color: '#52c41a', bg: '#f6ffed', border: '#b7eb8f' },
  INACTIVE: { label: '停用', color: '#bfbfbf', bg: '#f5f5f5', border: '#d9d9d9' },
};

/**
 * 时区映射
 */
export const TIMEZONE_MAP: Record<Timezone, string> = {
  'Asia/Shanghai': '中国标准时间 (UTC+8)',
  'Asia/Jakarta': '印尼西部时间 (UTC+7)',
  'Asia/Tokyo': '日本标准时间 (UTC+9)',
  'America/New_York': '美国东部时间 (UTC-5)',
  'Europe/London': '格林威治标准时间 (UTC+0)',
};

/**
 * 货币映射
 */
export const CURRENCY_MAP: Record<Currency, { label: string; symbol: string }> = {
  CNY: { label: '人民币', symbol: '¥' },
  IDR: { label: '印尼盾', symbol: 'Rp' },
  USD: { label: '美元', symbol: '$' },
  EUR: { label: '欧元', symbol: '€' },
  JPY: { label: '日元', symbol: '¥' },
};

/**
 * 语言映射
 */
export const LANGUAGE_MAP: Record<Language, string> = {
  'zh-CN': '简体中文',
  'zh-TW': '繁体中文',
  'en-US': '美式英语',
  'id-ID': '印尼语',
  'ja-JP': '日语',
};

/**
 * 工厂表格列配置
 */
export const FACTORY_COLUMNS = [
  { key: 'code', title: '工厂编码', width: 120, align: 'center' },
  { key: 'name', title: '工厂名称', width: 180, align: 'center' },
  { key: 'nameEn', title: '英文名称', width: 180, align: 'center' },
  { key: 'country', title: '国家', width: 100, align: 'center' },
  { key: 'timezone', title: '时区', width: 180, align: 'center' },
  { key: 'currency', title: '货币', width: 80, align: 'center' },
  { key: 'language', title: '语言', width: 100, align: 'center' },
  { key: 'status', title: '状态', width: 80, align: 'center' },
  { key: 'sortOrder', title: '排序', width: 80, align: 'center' },
  { key: 'contactPerson', title: '联系人', width: 120, align: 'center' },
  { key: 'contactPhone', title: '联系电话', width: 150, align: 'center' },
  { key: 'creatorName', title: '创建人', width: 120, align: 'center' },
  { key: 'createTime', title: '创建时间', width: 160, align: 'center' },
  { key: 'action', title: '操作', width: 280, align: 'center', fixed: 'right' },
];

export default {
  FACTORY_STATUS_MAP,
  TIMEZONE_MAP,
  CURRENCY_MAP,
  LANGUAGE_MAP,
  FACTORY_COLUMNS,
};
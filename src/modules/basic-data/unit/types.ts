/**
 * 计量单位模块类型定义
 * 保持与现有数据结构完全一致
 */
import type { PageQuery, PageResult } from '../../../shared/api/requestTypes';

// 单位状态
export type UnitStatus = 'active' | 'disabled';

// 单位换算方法
export type UnitMethod = '四舍五入' | '入位' | '去位';

// 单位项目接口
export interface UnitItem {
  id: string;
  code: string;
  name: string;
  enName: string;
  groupId: string;
  groupName: string;
  method: UnitMethod;
  precision: number;
  status: UnitStatus;
  isBase: boolean;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

// 单位分组接口
export interface UnitGroup {
  id: string;
  name: string;
  children?: UnitGroup[];
}

// 单位查询参数
export interface UnitQuery extends PageQuery {
  code?: string;
  name?: string;
  groupId?: string;
  status?: UnitStatus;
  isBase?: boolean;
}

// 创建单位DTO
export interface CreateUnitDTO {
  code: string;
  name: string;
  enName: string;
  groupId: string;
  method: UnitMethod;
  precision: number;
  isBase: boolean;
  status?: UnitStatus;
}

// 更新单位DTO
export interface UpdateUnitDTO extends Partial<CreateUnitDTO> {
  id: string;
}

// 批量操作参数
export interface UnitBatchAction {
  ids: string[];
  action: 'enable' | 'disable' | 'delete' | 'setBase' | 'unsetBase';
  params?: Record<string, any>;
}

// 单位映射（用于显示）
export const UNIT_METHOD_MAP: Record<UnitMethod, { label: string; description: string }> = {
  '四舍五入': { label: '四舍五入', description: '标准四舍五入算法' },
  '入位': { label: '入位', description: '向上取整' },
  '去位': { label: '去位', description: '向下取整' },
};

export const UNIT_STATUS_MAP: Record<UnitStatus, { label: string; color: string; bg: string; border: string }> = {
  active: { label: '启用', color: '#52c41a', bg: '#f6ffed', border: '#b7eb8f' },
  disabled: { label: '禁用', color: '#cf1322', bg: '#fff1f0', border: '#ffa39e' },
};

// 默认单位分组（完全兼容现有数据）
export const DEFAULT_UNIT_GROUPS: UnitGroup[] = [
  {
    id: 'all',
    name: '全部',
    children: [
      { id: 'g1', name: '中医药材' },
      { id: 'g2', name: '统计学单位2' },
      { id: 'g3', name: '标准桶' },
      { id: 'g4', name: 'FUWU 服务' },
      { id: 'g5', name: 'Length 长度' },
      { id: 'g6', name: 'Others 其他' },
      { id: 'g7', name: 'PartsNumber 件数' },
      { id: 'g8', name: 'Time 时间' },
      { id: 'g9', name: 'Volume 体积' },
      { id: 'g10', name: 'Weight 质量' },
      { id: 'g11', name: 'YDW 物流单位' },
      { id: 'g12', name: '包装规格' },
    ],
  },
];

// 默认单位数据（完全兼容现有数据）
export const DEFAULT_UNITS: UnitItem[] = [
  {
    id: '1',
    code: 'fy01',
    name: '斤',
    enName: '',
    groupId: 'g10',
    groupName: '包装材料',
    method: '入位',
    precision: 0,
    status: 'active',
    isBase: false,
  },
  {
    id: '2',
    code: 'MTQ',
    name: '立方米',
    enName: 'Cubic Meters',
    groupId: 'g9',
    groupName: '体积',
    method: '四舍五入',
    precision: 3,
    status: 'active',
    isBase: false,
  },
  {
    id: '3',
    code: 'KWh',
    name: '千瓦时',
    enName: 'Kilowatt-hour',
    groupId: 'g6',
    groupName: '其他',
    method: '四舍五入',
    precision: 2,
    status: 'active',
    isBase: false,
  },
  {
    id: '4',
    code: 'MA',
    name: '毫安',
    enName: '',
    groupId: 'g8',
    groupName: '时间',
    method: '入位',
    precision: 0,
    status: 'active',
    isBase: false,
  },
  {
    id: '5',
    code: 'KV',
    name: '千伏',
    enName: '',
    groupId: 'g8',
    groupName: '时间',
    method: '四舍五入',
    precision: 0,
    status: 'active',
    isBase: true,
  },
  {
    id: '6',
    code: 'CMT',
    name: '厘米',
    enName: 'Centimeters',
    groupId: 'g5',
    groupName: '长度',
    method: '四舍五入',
    precision: 0,
    status: 'active',
    isBase: false,
  },
  {
    id: '7',
    code: 'DMT',
    name: '分米',
    enName: 'Decimeters',
    groupId: 'g5',
    groupName: '长度',
    method: '四舍五入',
    precision: 0,
    status: 'active',
    isBase: false,
  },
  {
    id: '8',
    code: '302',
    name: 'kg',
    enName: '',
    groupId: 'g12',
    groupName: '包装材料',
    method: '入位',
    precision: 2,
    status: 'active',
    isBase: false,
  },
  {
    id: '9',
    code: '301',
    name: '个',
    enName: '',
    groupId: 'g12',
    groupName: '包装材料',
    method: '入位',
    precision: 0,
    status: 'disabled',
    isBase: true,
  },
  {
    id: '10',
    code: 'kg',
    name: 'kg',
    enName: '',
    groupId: 'g7',
    groupName: '原料药单位',
    method: '入位',
    precision: 5,
    status: 'active',
    isBase: false,
  },
  {
    id: '11',
    code: 'g',
    name: 'g',
    enName: '',
    groupId: 'g7',
    groupName: '原料药单位',
    method: '入位',
    precision: 5,
    status: 'active',
    isBase: false,
  },
  {
    id: '12',
    code: '102',
    name: '粒',
    enName: '',
    groupId: 'g1',
    groupName: '中医药材',
    method: '入位',
    precision: 0,
    status: 'active',
    isBase: false,
  },
  {
    id: '13',
    code: 'carLiang',
    name: '辆',
    enName: '',
    groupId: 'g11',
    groupName: '车辆',
    method: '四舍五入',
    precision: 2,
    status: 'active',
    isBase: true,
  },
  {
    id: '14',
    code: 'PCS',
    name: 'PCS',
    enName: 'PCS',
    groupId: 'g7',
    groupName: '件数',
    method: '入位',
    precision: 2,
    status: 'active',
    isBase: false,
  },
  {
    id: '15',
    code: '枚',
    name: '枚',
    enName: '',
    groupId: 'g12',
    groupName: '包装规格',
    method: '入位',
    precision: 2,
    status: 'active',
    isBase: false,
  },
  {
    id: '16',
    code: '块',
    name: '块',
    enName: '',
    groupId: 'g12',
    groupName: '包装规格',
    method: '四舍五入',
    precision: 3,
    status: 'active',
    isBase: false,
  },
  {
    id: '17',
    code: '根',
    name: '根',
    enName: '',
    groupId: 'g12',
    groupName: '包装规格',
    method: '入位',
    precision: 2,
    status: 'active',
    isBase: false,
  },
  {
    id: '18',
    code: 'ml',
    name: '毫升',
    enName: '',
    groupId: 'g1',
    groupName: '中医药材',
    method: '入位',
    precision: 5,
    status: 'active',
    isBase: false,
  },
  {
    id: '19',
    code: 'TONG',
    name: '桶',
    enName: '',
    groupId: 'g1',
    groupName: '中医药材',
    method: '入位',
    precision: 2,
    status: 'active',
    isBase: false,
  },
  {
    id: '20',
    code: 'YDW02',
    name: '金',
    enName: '',
    groupId: 'g12',
    groupName: '包装规格',
    method: '入位',
    precision: 2,
    status: 'active',
    isBase: false,
  },
];
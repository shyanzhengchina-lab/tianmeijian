import type { PageQuery, PageResult } from '../../../shared/api/requestTypes';
// Re-export types from types/index.ts
export * from './types/index';
/**
 * 班组档案模块类型定义
 * 保持与现有数据结构完全一致
 */

// 班组角色
export type TeamRole = '班组长' | '操作工' | 'QC';

// 班组状态
export type TeamStatus = 'ACTIVE' | 'DISABLED';

// 班组接口
export interface Team {
  id: string;
  name: string;
  workCenter: string;
  workshop: string;
  factoryId: string; // 工厂ID
  shiftId?: string;
  leader: string;
  headCount: number;
  remark?: string;
  status: TeamStatus;
  createdAt: string;
  updatedAt: string;
}

// 班次接口（简化版，详细信息在工作中心数据中）
export interface Shift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  code: string;
}

// 班组查询参数
export interface TeamQuery extends PageQuery {
  name?: string;
  workCenter?: string;
  workshop?: string;
  leader?: string;
  status?: TeamStatus;
  shiftId?: string;
}

// 创建班组DTO
export interface CreateTeamDTO {
  name: string;
  workCenter: string;
  workshop: string;
  factoryId: string;
  shiftId?: string;
  leader: string;
  headCount?: number;
  remark?: string;
  status?: TeamStatus;
}

// 更新班组DTO
export interface UpdateTeamDTO extends Partial<CreateTeamDTO> {
  id: string;
}

// 批量操作参数
export interface TeamBatchAction {
  ids: string[];
  action: 'enable' | 'disable' | 'delete';
  params?: Record<string, any>;
}

// 班组角色映射
export const TEAM_ROLE_MAP: Record<TeamRole, { label: string; color: string }> = {
  '班组长': { label: '班组长', color: '#d46b08' },
  '操作工': { label: '操作工', color: '#1677ff' },
  'QC': { label: 'QC', color: '#389e0d' },
};

// 班组状态映射
export const TEAM_STATUS_MAP: Record<TeamStatus, { label: string; color: string; badge: any }> = {
  ACTIVE: { label: '启用', color: '#52c41a', badge: 'success' },
  DISABLED: { label: '禁用', color: '#8c8c8c', badge: 'default' },
};

// 班次颜色映射（从workOrderData中复制）
export const SHIFT_COLOR_MAP: Record<string, string> = {
  'SH01': '#fa8c16',
  'SH02': '#531dab',
  'SH03': '#0958d9',
  'SH04': '#389e0d',
  'SH05': '#722ed1',
  'SH06': '#13c2c2',
};

// 默认班组数据（完全兼容现有数据）
export const DEFAULT_TEAMS: Team[] = [
  {
    id: 'team-001',
    name: '磨削班组',
    workCenter: 'WC-GRIND-01',
    workshop: '精密加工车间',
    factoryId: 'F001',
    shiftId: 'SH01',
    leader: '张组长',
    headCount: 8,
    status: 'ACTIVE',
    remark: '根管锉锥度磨削核心班组',
    createdAt: '2023-01-01',
    updatedAt: '2026-04-01',
  },
  {
    id: 'team-002',
    name: '研磨班组',
    workCenter: 'WC-GRIND-01',
    workshop: '精密加工车间',
    factoryId: 'F001',
    shiftId: 'SH01',
    leader: '李组长',
    headCount: 6,
    status: 'ACTIVE',
    remark: '精密研磨班组，包含外圆、内圆、平端等工序',
    createdAt: '2023-01-01',
    updatedAt: '2026-04-01',
  },
  {
    id: 'team-003',
    name: '质检班组',
    workCenter: 'WC-CLEAN-01',
    workshop: '清洗车间',
    factoryId: 'F001',
    shiftId: 'SH05',
    leader: '王组长',
    headCount: 4,
    status: 'ACTIVE',
    remark: '超声清洗、包装前质检班组',
    createdAt: '2023-06-01',
    updatedAt: '2025-12-15',
  },
  {
    id: 'team-004',
    name: '装配班组',
    workCenter: 'WC-ASM-01',
    workshop: '组装车间',
    factoryId: 'F001',
    shiftId: 'SH03',
    leader: '刘组长',
    headCount: 10,
    status: 'ACTIVE',
    remark: '根管锉锥度磨削后的装配工序班组',
    createdAt: '2024-01-01',
    updatedAt: '2026-03-01',
  },
];

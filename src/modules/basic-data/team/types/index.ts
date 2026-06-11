/**
 * 班组模块类型定义
 */

import type { Team, TeamQuery, CreateTeamDTO, UpdateTeamDTO, TeamStatusAction } from '../api/teamApi';

// Re-export types needed by store
export type { Team, TeamQuery, CreateTeamDTO, UpdateTeamDTO, TeamStatusAction };

/**
 * 班组表格行
 */
export type TeamRow = Team;

/**
 * 班组表单字段
 */
export interface TeamFormField {
  name: string;
  label: string;
  type: 'input' | 'select' | 'textarea' | 'number' | 'datePicker';
  placeholder?: string;
  options?: Array<{ label: string; value: any }>;
  required?: boolean;
  disabled?: boolean;
  rules?: any[];
  span?: number;
}

/**
 * 班组筛选表单字段
 */
export interface TeamFilterFields {
  code?: string;
  name?: string;
  type?: string;
  workCenterId?: string;
  status?: string;
  leaderId?: string;
}

/**
 * 班组操作项
 */
export interface TeamAction {
  key: string;
  label: string;
  icon?: React.ReactNode;
  onClick?: (...args: any[]) => void;
  disabled?: boolean;
  danger?: boolean;
  loading?: boolean;
  showBadge?: boolean;
  badgeCount?: number;
  requirePermission?: string; // 需要的权限
}

/**
 * 班组统计数据
 */
export interface TeamStatistics {
  totalCount: number;
  activeCount: number;
  inactiveCount: number;
  disabledCount?: number;
  typeCount: number;
  totalMembers: number;
  averageMembers: number;
  workCenterStats?: Record<string, number>;
}

/**
 * 班组详情字段
 */
export interface TeamDetailField {
  label: string;
  value: any;
  type?: 'text' | 'tag' | 'date' | 'number' | 'custom';
  render?: (value: any) => React.ReactNode;
  options?: Array<{ label: string; value: any; color?: string }>;
  span?: number;
}

/**
 * 班组导入结果
 */
export interface TeamImportResult {
  successCount: number;
  failureCount: number;
  failedData?: Array<{
    row: number;
    data: any;
    error: string;
  }>;
}

/**
 * 班组导出配置
 */
export interface TeamExportConfig {
  query: TeamQuery;
  selectedIds?: string[];
  fileName?: string;
  exportType?: 'all' | 'selected';
}

/**
 * 班组表格列配置
 */
export interface TeamColumnConfig {
  key: string;
  title: string;
  width?: number | string;
  align?: 'left' | 'center' | 'right';
  fixed?: boolean | 'left' | 'right';
  sorter?: boolean | ((a: Team, b: Team) => number);
  visible?: boolean;
}

export const TEAM_COLUMNS: TeamColumnConfig[] = [
  { key: 'code', title: '班组编码', width: 150, align: 'center', fixed: 'left' },
  { key: 'name', title: '班组名称', width: 200, align: 'center' },
  { key: 'type', title: '班组类型', width: 120, align: 'center' },
  { key: 'workCenterName', title: '工作中心', width: 150, align: 'center' },
  { key: 'leaderName', title: '负责人', width: 120, align: 'center' },
  { key: 'memberCount', title: '成员数', width: 100, align: 'center' },
  { key: 'shift', title: '班次', width: 100, align: 'center' },
  { key: 'workingHours', title: '工作时间', width: 120, align: 'center' },
  { key: 'skillLevel', title: '技能等级', width: 100, align: 'center' },
  { key: 'status', title: '状态', width: 100, align: 'center' },
  { key: 'remark', title: '备注', width: 200, align: 'center' },
  { key: 'createTime', title: '创建时间', width: 160, align: 'center' },
  { key: 'action', title: '操作', width: 250, align: 'center', fixed: 'right' },
];

/**
 * 班组状态映射
 */
export const TEAM_STATUS_MAP = {
  active: { label: '启用', color: '#52c41a', bg: '#f6ffed', border: '#b7eb8f' },
  inactive: { label: '禁用', color: '#ff4d4f', bg: '#fff1f0', border: '#ffa39e' },
};

/**
 * 班组类型映射
 */
export const TEAM_TYPE_MAP = {
  production: { label: '生产班组', color: '#1890ff', bg: '#e6f7ff', border: '#91d5ff' },
  quality: { label: '质检班组', color: '#52c41a', bg: '#f6ffed', border: '#b7eb8f' },
  maintenance: { label: '维护班组', color: '#faad14', bg: '#fffbe6', border: '#ffe58f' },
  other: { label: '其他', color: '#8c8c8c', bg: '#f5f5f5', border: '#d9d9d9' },
};

/**
 * 班组操作按钮工厂函数
 */
export const createTeamActions = (
  onEdit: (record: TeamRow) => void,
  onDelete: (record: TeamRow) => void,
  onViewDetail: (record: TeamRow) => void,
  onManageMembers?: (record: TeamRow) => void,
  onChangeLeader?: (record: TeamRow) => void,
  selectedCount?: number
): TeamAction[] => {
  const actions: TeamAction[] = [
    {
      key: 'edit',
      label: '编辑',
      onClick: onEdit,
      requirePermission: 'team.update',
    },
    {
      key: 'delete',
      label: '删除',
      onClick: onDelete,
      danger: true,
      requirePermission: 'team.delete',
    },
    {
      key: 'detail',
      label: '详情',
      onClick: onViewDetail,
    },
  ];

  if (onManageMembers) {
    actions.push({
      key: 'manage-members',
      label: '成员管理',
      onClick: onManageMembers,
      requirePermission: 'team.manage-members',
    });
  }

  if (onChangeLeader) {
    actions.push({
      key: 'change-leader',
      label: '更换负责人',
      onClick: onChangeLeader,
      requirePermission: 'team.change-leader',
    });
  }

  // 批量操作
  if (selectedCount && selectedCount > 0) {
    actions.push(
      {
        key: 'batch-enable',
        label: `批量启用 (${selectedCount})`,
        requirePermission: 'team.enable',
        showBadge: true,
        badgeCount: selectedCount,
      },
      {
        key: 'batch-disable',
        label: `批量禁用 (${selectedCount})`,
        requirePermission: 'team.disable',
        showBadge: true,
        badgeCount: selectedCount,
      },
      {
        key: 'batch-delete',
        label: `批量删除 (${selectedCount})`,
        danger: true,
        requirePermission: 'team.delete',
        showBadge: true,
        badgeCount: selectedCount,
      }
    );
  }

  return actions;
};

/**
 * 班组表单字段配置
 */
export const TEAM_FORM_FIELDS: TeamFormField[] = [
  {
    name: 'code',
    label: '班组编码',
    type: 'input',
    required: true,
    placeholder: '请输入班组编码',
    span: 12,
  },
  {
    name: 'name',
    label: '班组名称',
    type: 'input',
    required: true,
    placeholder: '请输入班组名称',
    span: 12,
  },
  {
    name: 'type',
    label: '班组类型',
    type: 'select',
    placeholder: '请选择班组类型',
    span: 12,
    options: [
      { label: '生产班组', value: 'production' },
      { label: '质检班组', value: 'quality' },
      { label: '维护班组', value: 'maintenance' },
      { label: '其他', value: 'other' },
    ],
  },
  {
    name: 'workCenterId',
    label: '工作中心',
    type: 'select',
    placeholder: '请选择工作中心',
    span: 12,
  },
  {
    name: 'leaderId',
    label: '负责人',
    type: 'select',
    placeholder: '请选择负责人',
    span: 12,
  },
  {
    name: 'shift',
    label: '班次',
    type: 'input',
    placeholder: '请输入班次',
    span: 12,
  },
  {
    name: 'workingHours',
    label: '工作时间',
    type: 'input',
    placeholder: '请输入工作时间',
    span: 12,
  },
  {
    name: 'skillLevel',
    label: '技能等级',
    type: 'select',
    placeholder: '请选择技能等级',
    span: 12,
    options: [
      { label: '基础', value: 'basic' },
      { label: '中级', value: 'intermediate' },
      { label: '高级', value: 'advanced' },
    ],
  },
  {
    name: 'status',
    label: '状态',
    type: 'select',
    required: true,
    placeholder: '请选择状态',
    options: [
      { label: '启用', value: 'active' },
      { label: '禁用', value: 'inactive' },
    ],
    span: 12,
  },
  {
    name: 'description',
    label: '描述',
    type: 'textarea',
    placeholder: '请输入描述',
    span: 24,
  },
  {
    name: 'remark',
    label: '备注',
    type: 'textarea',
    placeholder: '请输入备注',
    span: 24,
  },
];

export default {
  TEAM_COLUMNS,
  TEAM_STATUS_MAP,
  TEAM_TYPE_MAP,
  createTeamActions,
  TEAM_FORM_FIELDS,
};

/**
 * 员工模块类型定义
 */

import type { Employee, EmployeeQuery, CreateEmployeeDTO, UpdateEmployeeDTO, EmployeeStatusAction } from '../api/employeeApi';

// Re-export API types for convenience
export type { Employee, EmployeeQuery, CreateEmployeeDTO, UpdateEmployeeDTO, EmployeeStatusAction };

/**
 * 员工表格行
 */
export type EmployeeRow = Employee;

/**
 * 员工表单字段
 */
export interface EmployeeFormField {
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
 * 员工筛选表单字段
 */
export interface EmployeeFilterFields {
  code?: string;
  name?: string;
  gender?: string;
  departmentId?: string;
  teamId?: string;
  workCenterId?: string;
  position?: string;
  status?: string;
  skillLevel?: string;
}

/**
 * 员工操作项
 */
export interface EmployeeAction {
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
 * 员工统计数据
 */
export interface EmployeeStatistics {
  totalCount: number;
  activeCount: number;
  inactiveCount: number;
  resignedCount: number;
  maleCount: number;
  femaleCount: number;
  averageSkillLevel: number;
}

/**
 * 员工详情字段
 */
export interface EmployeeDetailField {
  label: string;
  value: any;
  type?: 'text' | 'tag' | 'date' | 'custom';
  render?: (value: any) => React.ReactNode;
  options?: Array<{ label: string; value: any; color?: string }>;
  span?: number;
}

/**
 * 员工导入结果
 */
export interface EmployeeImportResult {
  successCount: number;
  failureCount: number;
  failedData?: Array<{
    row: number;
    data: any;
    error: string;
  }>;
}

/**
 * 员工导出配置
 */
export interface EmployeeExportConfig {
  query: EmployeeQuery;
  selectedIds?: string[];
  fileName?: string;
  exportType?: 'all' | 'selected';
}

/**
 * 员工表格列配置
 */
export interface EmployeeColumnConfig {
  key: string;
  title: string;
  width?: number | string;
  align?: 'left' | 'center' | 'right';
  fixed?: boolean | 'left' | 'right';
  sorter?: boolean | ((a: Employee, b: Employee) => number);
  visible?: boolean;
}

export const EMPLOYEE_COLUMNS: EmployeeColumnConfig[] = [
  { key: 'code', title: '员工编码', width: 120, align: 'center', fixed: 'left' },
  { key: 'name', title: '姓名', width: 100, align: 'center' },
  { key: 'gender', title: '性别', width: 80, align: 'center' },
  { key: 'idCard', title: '身份证', width: 180, align: 'center' },
  { key: 'phone', title: '联系电话', width: 130, align: 'center' },
  { key: 'email', title: '邮箱', width: 200, align: 'center' },
  { key: 'departmentName', title: '部门', width: 150, align: 'center' },
  { key: 'teamName', title: '班组', width: 150, align: 'center' },
  { key: 'position', title: '职位', width: 120, align: 'center' },
  { key: 'skillLevel', title: '技能等级', width: 100, align: 'center' },
  { key: 'workCenterName', title: '工作中心', width: 150, align: 'center' },
  { key: 'hireDate', title: '入职日期', width: 120, align: 'center' },
  { key: 'status', title: '状态', width: 100, align: 'center' },
  { key: 'address', title: '地址', width: 200, align: 'center' },
  { key: 'createTime', title: '创建时间', width: 160, align: 'center' },
  { key: 'action', title: '操作', width: 250, align: 'center', fixed: 'right' },
];

/**
 * 员工状态映射
 */
export const EMPLOYEE_STATUS_MAP = {
  active: { label: '在职', color: '#52c41a', bg: '#f6ffed', border: '#b7eb8f' },
  inactive: { label: '离职', color: '#ff4d4f', bg: '#fff1f0', border: '#ffa39e' },
  resigned: { label: '辞职', color: '#8c8c8c', bg: '#f5f5f5', border: '#d9d9d9' },
};

/**
 * 性别映射
 */
export const GENDER_MAP = {
  male: { label: '男', color: '#1890ff', bg: '#e6f7ff', border: '#91d5ff' },
  female: { label: '女', color: '#eb2f96', bg: '#fff0f6', border: '#ffadd2' },
};

/**
 * 技能等级映射
 */
export const SKILL_LEVEL_MAP = {
  basic: { label: '基础', color: '#8c8c8c', bg: '#f5f5f5', border: '#d9d9d9' },
  intermediate: { label: '中级', color: '#1890ff', bg: '#e6f7ff', border: '#91d5ff' },
  advanced: { label: '高级', color: '#722ed1', bg: '#f9f0ff', border: '#d3adf7' },
  expert: { label: '专家', color: '#fa541c', bg: '#fff7e6', border: '#ffd591' },
};

/**
 * 员工操作按钮工厂函数
 */
export const createEmployeeActions = (
  onEdit: (record: EmployeeRow) => void,
  onDelete: (record: EmployeeRow) => void,
  onViewDetail: (record: EmployeeRow) => void,
  selectedCount?: number
): EmployeeAction[] => {
  const actions: EmployeeAction[] = [
    {
      key: 'edit',
      label: '编辑',
      onClick: onEdit,
      requirePermission: 'employee.update',
    },
    {
      key: 'delete',
      label: '删除',
      onClick: onDelete,
      danger: true,
      requirePermission: 'employee.delete',
    },
    {
      key: 'detail',
      label: '详情',
      onClick: onViewDetail,
    },
  ];

  // 批量操作
  if (selectedCount && selectedCount > 0) {
    actions.push(
      {
        key: 'batch-enable',
        label: `批量在职 (${selectedCount})`,
        requirePermission: 'employee.enable',
        showBadge: true,
        badgeCount: selectedCount,
      },
      {
        key: 'batch-disable',
        label: `批量离职 (${selectedCount})`,
        requirePermission: 'employee.disable',
        showBadge: true,
        badgeCount: selectedCount,
      },
      {
        key: 'batch-delete',
        label: `批量删除 (${selectedCount})`,
        danger: true,
        requirePermission: 'employee.delete',
        showBadge: true,
        badgeCount: selectedCount,
      }
    );
  }

  return actions;
};

/**
 * 员工表单字段配置
 */
export const EMPLOYEE_FORM_FIELDS: EmployeeFormField[] = [
  {
    name: 'code',
    label: '员工编码',
    type: 'input',
    required: true,
    placeholder: '请输入员工编码',
    span: 12,
  },
  {
    name: 'name',
    label: '姓名',
    type: 'input',
    required: true,
    placeholder: '请输入姓名',
    span: 12,
  },
  {
    name: 'gender',
    label: '性别',
    type: 'select',
    placeholder: '请选择性别',
    span: 12,
    options: [
      { label: '男', value: 'male' },
      { label: '女', value: 'female' },
    ],
  },
  {
    name: 'idCard',
    label: '身份证',
    type: 'input',
    placeholder: '请输入身份证',
    span: 12,
  },
  {
    name: 'phone',
    label: '联系电话',
    type: 'input',
    placeholder: '请输入联系电话',
    span: 12,
  },
  {
    name: 'email',
    label: '邮箱',
    type: 'input',
    placeholder: '请输入邮箱',
    span: 12,
  },
  {
    name: 'departmentId',
    label: '部门',
    type: 'select',
    placeholder: '请选择部门',
    span: 12,
  },
  {
    name: 'teamId',
    label: '班组',
    type: 'select',
    placeholder: '请选择班组',
    span: 12,
  },
  {
    name: 'position',
    label: '职位',
    type: 'input',
    placeholder: '请输入职位',
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
      { label: '专家', value: 'expert' },
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
    name: 'hireDate',
    label: '入职日期',
    type: 'datePicker',
    placeholder: '请选择入职日期',
    span: 12,
  },
  {
    name: 'status',
    label: '状态',
    type: 'select',
    required: true,
    placeholder: '请选择状态',
    options: [
      { label: '在职', value: 'active' },
      { label: '离职', value: 'inactive' },
      { label: '辞职', value: 'resigned' },
    ],
    span: 12,
  },
  {
    name: 'address',
    label: '地址',
    type: 'textarea',
    placeholder: '请输入地址',
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
  EMPLOYEE_COLUMNS,
  EMPLOYEE_STATUS_MAP,
  GENDER_MAP,
  SKILL_LEVEL_MAP,
  createEmployeeActions,
  EMPLOYEE_FORM_FIELDS,
};

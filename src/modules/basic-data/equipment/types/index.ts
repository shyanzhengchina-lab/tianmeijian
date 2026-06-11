/**
 * 设备模块类型定义
 */

import type { Equipment, EquipmentQuery, CreateEquipmentDTO, UpdateEquipmentDTO, EquipmentStatusAction, MaintenanceRecord, EquipmentOEE } from '../api/equipmentApi';

// Re-export types needed by store
export type { Equipment, EquipmentQuery, CreateEquipmentDTO, UpdateEquipmentDTO, EquipmentStatusAction, MaintenanceRecord, EquipmentOEE };

/**
 * 设备表格行
 */
export type EquipmentRow = Equipment;

/**
 * 设备表单字段
 */
export interface EquipmentFormField {
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
 * 设备筛选表单字段
 */
export interface EquipmentFilterFields {
  code?: string;
  name?: string;
  category?: string;
  type?: string;
  workCenterId?: string;
  status?: string;
  manufacturer?: string;
  brand?: string;
}

/**
 * 设备操作项
 */
export interface EquipmentAction {
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
 * 设备统计数据
 */
export interface EquipmentStatistics {
  totalCount: number;
  runningCount: number;
  stoppedCount: number;
  maintenanceCount: number;
  scrappedCount: number;
  bottleneckCount: number;
  categoryCount: number;
  averageOEE: number;
  // Additional fields used in components
  activeCount?: number;
  idleCount?: number;
  faultCount?: number;
  avgOee?: number;
}

/**
 * 设备详情字段
 */
export interface EquipmentDetailField {
  label: string;
  value: any;
  type?: 'text' | 'tag' | 'date' | 'currency' | 'number' | 'custom' | 'progress';
  render?: (value: any) => React.ReactNode;
  options?: Array<{ label: string; value: any; color?: string }>;
  span?: number;
}

/**
 * 设备导入结果
 */
export interface EquipmentImportResult {
  successCount: number;
  failureCount: number;
  failedData?: Array<{
    row: number;
    data: any;
    error: string;
  }>;
}

/**
 * 设备导出配置
 */
export interface EquipmentExportConfig {
  query: EquipmentQuery;
  selectedIds?: string[];
  fileName?: string;
  exportType?: 'all' | 'selected';
}

/**
 * 设备表格列配置
 */
export interface EquipmentColumnConfig {
  key: string;
  title: string;
  width?: number | string;
  align?: 'left' | 'center' | 'right';
  fixed?: boolean | 'left' | 'right';
  sorter?: boolean | ((a: Equipment, b: Equipment) => number);
  visible?: boolean;
}

export const EQUIPMENT_COLUMNS: EquipmentColumnConfig[] = [
  { key: 'code', title: '设备编码', width: 150, align: 'center', fixed: 'left' },
  { key: 'name', title: '设备名称', width: 200, align: 'center' },
  { key: 'category', title: '设备分类', width: 120, align: 'center' },
  { key: 'type', title: '设备类型', width: 120, align: 'center' },
  { key: 'model', title: '型号', width: 150, align: 'center' },
  { key: 'brand', title: '品牌', width: 120, align: 'center' },
  { key: 'manufacturer', title: '制造商', width: 150, align: 'center' },
  { key: 'workCenterName', title: '工作中心', width: 150, align: 'center' },
  { key: 'capacity', title: '产能', width: 100, align: 'center' },
  { key: 'oee', title: 'OEE(%)', width: 100, align: 'center' },
  { key: 'isBottleneck', title: '瓶颈设备', width: 100, align: 'center' },
  { key: 'status', title: '状态', width: 100, align: 'center' },
  { key: 'nextMaintenanceDate', title: '下次维护日期', width: 140, align: 'center' },
  { key: 'location', title: '位置', width: 150, align: 'center' },
  { key: 'responsiblePerson', title: '负责人', width: 120, align: 'center' },
  { key: 'createTime', title: '创建时间', width: 160, align: 'center' },
  { key: 'action', title: '操作', width: 280, align: 'center', fixed: 'right' },
];

/**
 * 维护记录表格列配置
 */
export interface MaintenanceRecordColumnConfig {
  key: string;
  title: string;
  width?: number | string;
  align?: 'left' | 'center' | 'right';
  fixed?: boolean | 'left' | 'right';
  sorter?: boolean | ((a: MaintenanceRecord, b: MaintenanceRecord) => number);
  visible?: boolean;
}

export const MAINTENANCE_RECORD_COLUMNS: MaintenanceRecordColumnConfig[] = [
  { key: 'maintenanceType', title: '维护类型', width: 120, align: 'center' },
  { key: 'startDate', title: '开始日期', width: 120, align: 'center' },
  { key: 'endDate', title: '结束日期', width: 120, align: 'center' },
  { key: 'duration', title: '时长(小时)', width: 100, align: 'center' },
  { key: 'description', title: '描述', width: 200, align: 'center' },
  { key: 'cost', title: '成本', width: 100, align: 'center' },
  { key: 'responsiblePerson', title: '负责人', width: 120, align: 'center' },
  { key: 'status', title: '状态', width: 100, align: 'center' },
  { key: 'createTime', title: '创建时间', width: 160, align: 'center' },
  { key: 'action', title: '操作', width: 150, align: 'center', fixed: 'right' },
];

/**
 * 设备状态映射
 */
export const EQUIPMENT_STATUS_MAP = {
  running: { label: '运行中', color: '#52c41a', bg: '#f6ffed', border: '#b7eb8f' },
  stopped: { label: '已停止', color: '#8c8c8c', bg: '#f5f5f5', border: '#d9d9d9' },
  maintenance: { label: '维护中', color: '#faad14', bg: '#fffbe6', border: '#ffe58f' },
  scrapped: { label: '已报废', color: '#ff4d4f', bg: '#fff1f0', border: '#ffa39e' },
};

/**
 * 维护类型映射
 */
export const MAINTENANCE_TYPE_MAP = {
  preventive: { label: '预防性', color: '#1890ff', bg: '#e6f7ff', border: '#91d5ff' },
  corrective: { label: '纠正性', color: '#faad14', bg: '#fffbe6', border: '#ffe58f' },
  predictive: { label: '预测性', color: '#722ed1', bg: '#f9f0ff', border: '#d3adf7' },
};

/**
 * 维护记录状态映射
 */
export const MAINTENANCE_STATUS_MAP = {
  pending: { label: '待处理', color: '#8c8c8c', bg: '#f5f5f5', border: '#d9d9d9' },
  'in-progress': { label: '进行中', color: '#1890ff', bg: '#e6f7ff', border: '#91d5ff' },
  completed: { label: '已完成', color: '#52c41a', bg: '#f6ffed', border: '#b7eb8f' },
  cancelled: { label: '已取消', color: '#ff4d4f', bg: '#fff1f0', border: '#ffa39e' },
};

/**
 * 设备操作按钮工厂函数
 */
export const createEquipmentActions = (
  onEdit: (record: EquipmentRow) => void,
  onDelete: (record: EquipmentRow) => void,
  onViewDetail: (record: EquipmentRow) => void,
  onToggleStatus?: (record: EquipmentRow) => void,
  onMaintenance?: (record: EquipmentRow) => void,
  onOEE?: (record: EquipmentRow) => void,
  onCopy?: (record: EquipmentRow) => void,
  selectedCount?: number
): EquipmentAction[] => {
  const actions: EquipmentAction[] = [
    {
      key: 'edit',
      label: '编辑',
      onClick: onEdit,
      requirePermission: 'equipment.update',
    },
    {
      key: 'delete',
      label: '删除',
      onClick: onDelete,
      danger: true,
      requirePermission: 'equipment.delete',
    },
    {
      key: 'detail',
      label: '详情',
      onClick: onViewDetail,
    },
  ];

  if (onToggleStatus) {
    actions.push({
      key: 'toggle-status',
      label: '启停',
      onClick: onToggleStatus,
      requirePermission: 'equipment.toggle-status',
    });
  }

  if (onMaintenance) {
    actions.push({
      key: 'maintenance',
      label: '维护记录',
      onClick: onMaintenance,
      requirePermission: 'equipment.maintenance',
    });
  }

  if (onOEE) {
    actions.push({
      key: 'oee',
      label: 'OEE分析',
      onClick: onOEE,
      requirePermission: 'equipment.oee',
    });
  }

  if (onCopy) {
    actions.push({
      key: 'copy',
      label: '复制',
      onClick: onCopy,
      requirePermission: 'equipment.create',
    });
  }

  // 批量操作
  if (selectedCount && selectedCount > 0) {
    actions.push(
      {
        key: 'batch-start',
        label: `批量启动 (${selectedCount})`,
        requirePermission: 'equipment.start',
        showBadge: true,
        badgeCount: selectedCount,
      },
      {
        key: 'batch-stop',
        label: `批量停止 (${selectedCount})`,
        requirePermission: 'equipment.stop',
        showBadge: true,
        badgeCount: selectedCount,
      },
      {
        key: 'batch-maintenance',
        label: `批量设为维护 (${selectedCount})`,
        requirePermission: 'equipment.maintenance',
        showBadge: true,
        badgeCount: selectedCount,
      },
      {
        key: 'batch-delete',
        label: `批量删除 (${selectedCount})`,
        danger: true,
        requirePermission: 'equipment.delete',
        showBadge: true,
        badgeCount: selectedCount,
      }
    );
  }

  return actions;
};

/**
 * 设备表单字段配置
 */
export const EQUIPMENT_FORM_FIELDS: EquipmentFormField[] = [
  {
    name: 'code',
    label: '设备编码',
    type: 'input',
    required: true,
    placeholder: '请输入设备编码',
    span: 12,
  },
  {
    name: 'name',
    label: '设备名称',
    type: 'input',
    required: true,
    placeholder: '请输入设备名称',
    span: 12,
  },
  {
    name: 'category',
    label: '设备分类',
    type: 'select',
    placeholder: '请选择设备分类',
    span: 12,
  },
  {
    name: 'type',
    label: '设备类型',
    type: 'select',
    placeholder: '请选择设备类型',
    span: 12,
  },
  {
    name: 'workCenterId',
    label: '工作中心',
    type: 'select',
    placeholder: '请选择工作中心',
    span: 12,
  },
  {
    name: 'model',
    label: '型号',
    type: 'input',
    placeholder: '请输入型号',
    span: 12,
  },
  {
    name: 'brand',
    label: '品牌',
    type: 'input',
    placeholder: '请输入品牌',
    span: 12,
  },
  {
    name: 'manufacturer',
    label: '制造商',
    type: 'input',
    placeholder: '请输入制造商',
    span: 12,
  },
  {
    name: 'serialNumber',
    label: '序列号',
    type: 'input',
    placeholder: '请输入序列号',
    span: 12,
  },
  {
    name: 'specification',
    label: '规格',
    type: 'input',
    placeholder: '请输入规格',
    span: 12,
  },
  {
    name: 'capacity',
    label: '产能',
    type: 'number',
    placeholder: '请输入产能',
    span: 12,
  },
  {
    name: 'purchaseDate',
    label: '购买日期',
    type: 'datePicker',
    placeholder: '请选择购买日期',
    span: 12,
  },
  {
    name: 'warrantyExpiryDate',
    label: '保修到期日期',
    type: 'datePicker',
    placeholder: '请选择保修到期日期',
    span: 12,
  },
  {
    name: 'maintenanceCycle',
    label: '维护周期(天)',
    type: 'number',
    placeholder: '请输入维护周期',
    span: 12,
  },
  {
    name: 'responsiblePerson',
    label: '负责人',
    type: 'input',
    placeholder: '请输入负责人',
    span: 12,
  },
  {
    name: 'location',
    label: '位置',
    type: 'input',
    placeholder: '请输入位置',
    span: 12,
  },
  {
    name: 'cost',
    label: '成本',
    type: 'number',
    placeholder: '请输入成本',
    span: 12,
  },
  {
    name: 'isBottleneck',
    label: '瓶颈设备',
    type: 'select',
    placeholder: '请选择',
    options: [
      { label: '是', value: true },
      { label: '否', value: false },
    ],
    span: 12,
  },
  {
    name: 'status',
    label: '状态',
    type: 'select',
    required: true,
    placeholder: '请选择状态',
    options: [
      { label: '运行中', value: 'running' },
      { label: '已停止', value: 'stopped' },
      { label: '维护中', value: 'maintenance' },
      { label: '已报废', value: 'scrapped' },
    ],
    span: 12,
  },
  {
    name: 'remark',
    label: '备注',
    type: 'textarea',
    placeholder: '请输入备注',
    span: 24,
  },
];

/**
 * 维护记录表单字段配置
 */
export const MAINTENANCE_FORM_FIELDS: EquipmentFormField[] = [
  {
    name: 'maintenanceType',
    label: '维护类型',
    type: 'select',
    required: true,
    placeholder: '请选择维护类型',
    span: 12,
    options: [
      { label: '预防性', value: 'preventive' },
      { label: '纠正性', value: 'corrective' },
      { label: '预测性', value: 'predictive' },
    ],
  },
  {
    name: 'startDate',
    label: '开始日期',
    type: 'datePicker',
    required: true,
    placeholder: '请选择开始日期',
    span: 12,
  },
  {
    name: 'endDate',
    label: '结束日期',
    type: 'datePicker',
    placeholder: '请选择结束日期',
    span: 12,
  },
  {
    name: 'duration',
    label: '时长(小时)',
    type: 'number',
    placeholder: '请输入时长',
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
    name: 'cost',
    label: '成本',
    type: 'number',
    placeholder: '请输入成本',
    span: 12,
  },
  {
    name: 'responsiblePerson',
    label: '负责人',
    type: 'input',
    placeholder: '请输入负责人',
    span: 12,
  },
  {
    name: 'status',
    label: '状态',
    type: 'select',
    required: true,
    placeholder: '请选择状态',
    span: 12,
    options: [
      { label: '待处理', value: 'pending' },
      { label: '进行中', value: 'in-progress' },
      { label: '已完成', value: 'completed' },
      { label: '已取消', value: 'cancelled' },
    ],
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
  EQUIPMENT_COLUMNS,
  MAINTENANCE_RECORD_COLUMNS,
  EQUIPMENT_STATUS_MAP,
  MAINTENANCE_TYPE_MAP,
  MAINTENANCE_STATUS_MAP,
  createEquipmentActions,
  EQUIPMENT_FORM_FIELDS,
  MAINTENANCE_FORM_FIELDS,
};

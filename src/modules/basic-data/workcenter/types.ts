import type { PageQuery, PageResult } from '../../../shared/api/requestTypes';
// Re-export types from types/index.ts
export * from './types/index';
/**
 * 工作中心模块类型定义
 * 保持与现有数据结构完全一致
 */

// 工作中心状态
export type WCStatus = 'ACTIVE' | 'DISABLED' | 'MAINTENANCE';

// 工作中心分类
export type WCCategory = 'MACHINING' | 'INSPECTION' | 'CLEANING' | 'PACKAGING' | 'STERILIZATION' | 'OTHER';

// 工作中心接口
export interface WorkCenter {
  id: string;
  wcCode: string;
  wcName: string;
  category: WCCategory;
  workshop: string;
  leader: string;
  headCount: number;
  shiftCount: number;
  shiftHours: number;
  capacity: number; // 产能（件/班）
  capacityUnit: string;
  equipCount: number;
  location: string;
  costCenter: string;
  status: WCStatus;
  remark?: string;
  createdAt: string;
  updatedAt: string;
}

// 工作中心查询参数
export interface WorkCenterQuery extends PageQuery {
  wcCode?: string;
  wcName?: string;
  category?: WCCategory;
  workshop?: string;
  status?: WCStatus;
  location?: string;
}

// 创建工作中心DTO
export interface CreateWorkCenterDTO {
  wcCode: string;
  wcName: string;
  category: WCCategory;
  workshop: string;
  leader: string;
  headCount: number;
  shiftCount: number;
  shiftHours: number;
  capacity: number;
  capacityUnit: string;
  equipCount: number;
  location: string;
  costCenter: string;
  status?: WCStatus;
  remark?: string;
}

// 更新工作中心DTO
export interface UpdateWorkCenterDTO extends Partial<CreateWorkCenterDTO> {
  id: string;
}

// 批量操作参数
export interface WorkCenterBatchAction {
  ids: string[];
  action: 'enable' | 'disable' | 'delete' | 'setMaintenance' | 'unsetMaintenance';
  params?: Record<string, any>;
}

// 分类映射
export const CATEGORY_MAP: Record<WCCategory, { label: string; color: string }> = {
  MACHINING: { label: '加工中心', color: '#1677FF' },
  INSPECTION: { label: '检验中心', color: '#FA8C16' },
  CLEANING: { label: '清洗中心', color: '#13C2C2' },
  PACKAGING: { label: '包装中心', color: '#52C41A' },
  STERILIZATION: { label: '灭菌中心', color: '#722ED1' },
  OTHER: { label: '其他', color: '#8C8C8C' },
};

// 状态映射
export const STATUS_MAP: Record<WCStatus, { label: string; color: string; badge: any }> = {
  ACTIVE: { label: '正常运行', color: '#52C41A', badge: 'success' },
  DISABLED: { label: '已停用', color: '#8C8C8C', badge: 'default' },
  MAINTENANCE: { label: '整修中', color: '#FAAD14', badge: 'warning' },
};

// 默认工作中心数据（完全兼容现有数据）
export const DEFAULT_WORK_CENTERS: WorkCenter[] = [
  {
    id: 'wc-001',
    wcCode: 'WC-GRIND-01',
    wcName: '数控磨削工作中心',
    category: 'MACHINING',
    workshop: '精密加工车间',
    leader: '张工',
    headCount: 8,
    shiftCount: 2,
    shiftHours: 8,
    capacity: 2000,
    capacityUnit: '件/班',
    equipCount: 3,
    location: 'A区',
    costCenter: 'CC-MFG-001',
    status: 'ACTIVE',
    remark: '根管锉锥度磨削核心区域，瓶颈产能',
    createdAt: '2023-01-01',
    updatedAt: '2026-04-01',
  },
  {
    id: 'wc-002',
    wcCode: 'WC-HT-01',
    wcName: '热处理工作中心',
    category: 'MACHINING',
    workshop: '热处理车间',
    leader: '李工',
    headCount: 4,
    shiftCount: 1,
    shiftHours: 12,
    capacity: 5000,
    capacityUnit: '件/炉次',
    equipCount: 2,
    location: 'B区',
    costCenter: 'CC-MFG-002',
    status: 'ACTIVE',
    remark: '镍钛合金热处理定型，特殊工序',
    createdAt: '2023-01-01',
    updatedAt: '2026-02-10',
  },
  {
    id: 'wc-003',
    wcCode: 'WC-COAT-01',
    wcName: 'PVD涂层工作中心',
    category: 'MACHINING',
    workshop: '涂层车间',
    leader: '王工',
    headCount: 3,
    shiftCount: 1,
    shiftHours: 8,
    capacity: 3000,
    capacityUnit: '件/批',
    equipCount: 1,
    location: 'C区',
    costCenter: 'CC-MFG-003',
    status: 'MAINTENANCE',
    remark: 'PVD镀膜机靶材更换中，预计4月下旬恢复',
    createdAt: '2023-01-01',
    updatedAt: '2026-04-15',
  },
  {
    id: 'wc-004',
    wcCode: 'WC-LASER-01',
    wcName: '激光打标工作中心',
    category: 'MACHINING',
    workshop: '标识车间',
    leader: '陈工',
    headCount: 3,
    shiftCount: 2,
    shiftHours: 8,
    capacity: 4000,
    capacityUnit: '件/班',
    equipCount: 2,
    location: 'D区',
    costCenter: 'CC-MFG-004',
    status: 'ACTIVE',
    remark: 'UDI打标+序列号追溯，GS1-128格式',
    createdAt: '2024-01-01',
    updatedAt: '2026-03-01',
  },
  {
    id: 'wc-005',
    wcCode: 'WC-CLEAN-01',
    wcName: '超声清洗工作中心',
    category: 'CLEANING',
    workshop: '清洗车间',
    leader: '周工',
    headCount: 2,
    shiftCount: 1,
    shiftHours: 8,
    capacity: 1500,
    capacityUnit: '件/班',
    equipCount: 1,
    location: 'E区',
    costCenter: 'CC-MFG-005',
    status: 'ACTIVE',
    remark: '多工位超声波清洗机，支持连续作业',
    createdAt: '2023-06-01',
    updatedAt: '2025-12-15',
  },
];
/**
 * 车间档案模块类型定义
 * 保持与现有数据结构完全一致
 */
import type { PageQuery, PageResult } from '../../../shared/api/requestTypes';

// 车间状态
export type WorkshopStatus = 'ACTIVE' | 'MAINTENANCE' | 'DISABLED';

// 车间类型
export type WorkshopType = 'GRINDING' | 'HEAT_TREATMENT' | 'COATING' | 'LASER' | 'CLEANING' | 'ASSEMBLY' | 'PACKAGING' | 'QC' | 'STORAGE' | 'OTHER';

// 车间接口
export interface Workshop {
  id: string;
  workShopCode: string;
  workShopName: string;
  type: WorkshopType;
  manager: string;
  managerPhone?: string;
  location?: string;
  area?: number;
  headCount?: number;
  workCenterCount?: number;
  cleanLevel?: string;
  status: WorkshopStatus;
  remark?: string;
  createdAt: string;
  updatedAt: string;
}

// 车间查询参数
export interface WorkshopQuery extends PageQuery {
  workShopCode?: string;
  workShopName?: string;
  type?: WorkshopType;
  manager?: string;
  status?: WorkshopStatus;
  location?: string;
}

// 创建车间DTO
export interface CreateWorkshopDTO {
  workShopCode: string;
  workShopName: string;
  type: WorkshopType;
  manager: string;
  managerPhone?: string;
  location?: string;
  area?: number;
  headCount?: number;
  status?: WorkshopStatus;
  remark?: string;
}

// 更新车间DTO
export interface UpdateWorkshopDTO extends Partial<CreateWorkshopDTO> {
  id: string;
}

// 批量操作参数
export interface WorkshopBatchAction {
  ids: string[];
  action: 'enable' | 'disable' | 'delete' | 'setMaintenance' | 'unsetMaintenance';
  params?: Record<string, any>;
}

// 车间类型映射
export const WORKSHOP_TYPE_MAP: Record<WorkshopType, { label: string; color: string }> = {
  GRINDING: { label: '研磨加工', color: '#1677FF' },
  HEAT_TREATMENT: { label: '热处理', color: '#FA8C16' },
  COATING: { label: '涂层处理', color: '#722ED1' },
  LASER: { label: '激光加工', color: '#52C41A' },
  CLEANING: { label: '清洗工序', color: '#13C2C2' },
  ASSEMBLY: { label: '组装工序', color: '#FAAD14' },
  PACKAGING: { label: '包装工序', color: '#EB2F96' },
  QC: { label: '质量检验', color: '#389E0D' },
  STORAGE: { label: '仓储工序', color: '#8C8C8C' },
  OTHER: { label: '其他', color: '#D4380D' },
};

// 车间状态映射
export const WORKSHOP_STATUS_MAP: Record<WorkshopStatus, { label: string; color: string; badge: any }> = {
  ACTIVE: { label: '正常', color: '#52C41A', badge: 'success' },
  MAINTENANCE: { label: '整修中', color: '#FAAD14', badge: 'warning' },
  DISABLED: { label: '停用', color: '#8C8C8C', badge: 'default' },
};

// 默认车间数据（完全兼容现有数据）
export const DEFAULT_WORKSHOPS: Workshop[] = [
  {
    id: 'ws-001',
    workShopCode: 'WS-GRIND',
    workShopName: '精密加工车间',
    type: 'GRINDING',
    manager: '张主任',
    managerPhone: '138****1234',
    location: 'A区一楼',
    area: 1500,
    headCount: 80,
    workCenterCount: 15,
    cleanLevel: '10000级',
    status: 'ACTIVE',
    remark: '主要加工车间，包含精密磨削、研磨、抛光等工序',
    createdAt: '2022-01-01',
    updatedAt: '2026-04-01',
  },
  {
    id: 'ws-002',
    workShopCode: 'WS-HEAT',
    workShopName: '热处理车间',
    type: 'HEAT_TREATMENT',
    manager: '李主任',
    managerPhone: '139****5678',
    location: 'B区二楼',
    area: 800,
    headCount: 25,
    workCenterCount: 8,
    cleanLevel: '1000级',
    status: 'ACTIVE',
    remark: '镍钛合金热处理，包含淬火、退火、时效等工艺',
    createdAt: '2022-03-01',
    updatedAt: '2026-03-15',
  },
  {
    id: 'ws-003',
    workShopCode: 'WS-COAT',
    workShopName: '涂层车间',
    type: 'COATING',
    manager: '王主任',
    managerPhone: '137****9012',
    location: 'C区三楼',
    area: 600,
    headCount: 30,
    workCenterCount: 12,
    cleanLevel: '100级',
    status: 'ACTIVE',
    remark: 'PVD镀膜、阳极氧化等表面处理工艺',
    createdAt: '2022-06-01',
    updatedAt: '2025-12-20',
  },
  {
    id: 'ws-004',
    workShopCode: 'WS-LASER',
    workShopName: '激光车间',
    type: 'LASER',
    manager: '陈主任',
    managerPhone: '136****3456',
    location: 'D区一楼',
    area: 400,
    headCount: 20,
    workCenterCount: 6,
    cleanLevel: '10000级',
    status: 'ACTIVE',
    remark: 'UDI激光打标、激光焊接、激光切割等激光工序',
    createdAt: '2023-01-01',
    updatedAt: '2026-02-01',
  },
];

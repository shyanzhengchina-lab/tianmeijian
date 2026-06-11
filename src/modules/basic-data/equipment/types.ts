import type { PageQuery, PageResult } from '../../../shared/api/requestTypes';
// Re-export types from types/index.ts
export * from './types/index';
/**
 * 设备档案模块类型定义
 * 保持与现有数据结构完全一致
 */

// 设备状态
export type EquipStatus = 'ACTIVE' | 'IDLE' | 'MAINTENANCE' | 'FAULT' | 'SCRAPPED' | 'DISABLED';

// 设备类别
export type EquipCategory = 'MACHINE' | 'INSPECT' | 'CLEAN' | 'COAT' | 'HEAT' | 'PACK' | 'MARK' | 'OTHER';

// 维保类型
export type MaintType = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUAL' | 'SPECIAL';

// 维保状态
export type MaintStatus = 'PENDING' | 'IN_PROGRESS' | 'DONE' | 'OVERDUE' | 'SKIPPED';

// 故障等级
export type FaultLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

// 故障状态
export type FaultStatus = 'REPORTED' | 'ASSIGNED' | 'REPAIRING' | 'PENDING_VERIFY' | 'CLOSED' | 'CANCELLED';

// 校准状态
export type CalibStatus = 'VALID' | 'EXPIRED' | 'PENDING' | 'IN_CALIBRATION' | 'FAILED';

// 备件状态
export type SpareStatus = 'NORMAL' | 'LOW_STOCK' | 'OUT_OF_STOCK';

// 设备档案接口
export interface EquipRecord {
  id: string;
  equipCode: string;          // 设备编码（唯一）
  equipName: string;
  category: EquipCategory;
  model: string;              // 型号规格
  brand: string;              // 品牌/厂商
  serialNo?: string;          // 出厂序列号
  workshop: string;           // 所属车间
  workCenter: string;         // 工作中心
  location: string;           // 安装位置
  purchaseDate: string;       // 购入日期
  installDate?: string;       // 安装验收日期
  warrantyDate: string;       // 保质期至
  assetNo?: string;           // 资产编号
  isSpecialProcess?: boolean; // 是否特殊工序设备（GMP）
  isValidationRequired?: boolean; // 是否需要验证
  precision?: string;         // 精度/关键参数
  status: EquipStatus;
  lastMaintDate?: string;     // 上次保养日期
  nextMaintDate?: string;     // 下次保养日期
  lastCalibDate?: string;     // 上次校准日期（仅检测设备）
  nextCalibDate?: string;     // 下次校准日期
  oeeTarget?: number;         // OEE目标 (%)
  currentOee?: number;        // 当前OEE (%)
  remark?: string;
  attachments?: string[];     // 文件附件列表（文件名）
  qrCode?: string;            // 设备二维码内容
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

// 设备查询参数
export interface EquipmentQuery extends PageQuery {
  equipCode?: string;
  equipName?: string;
  category?: EquipCategory;
  workshop?: string;
  workCenter?: string;
  status?: EquipStatus;
  createdBy?: string;
}

// 创建设备DTO
export interface CreateEquipmentDTO {
  equipCode: string;
  equipName: string;
  category: EquipCategory;
  model: string;
  brand: string;
  serialNo?: string;
  workshop: string;
  workCenter: string;
  location: string;
  purchaseDate: string;
  installDate?: string;
  warrantyDate: string;
  assetNo?: string;
  isSpecialProcess?: boolean;
  isValidationRequired?: boolean;
  precision?: string;
  oeeTarget?: number;
  remark?: string;
  attachments?: string[];
}

// 更新设备DTO
export interface UpdateEquipmentDTO extends Partial<CreateEquipmentDTO> {
  id: string;
}

// 批量操作参数
export interface EquipmentBatchAction {
  ids: string[];
  action: 'activate' | 'deactivate' | 'maintenance' | 'scrapped' | 'delete';
  params?: Record<string, any>;
}

// 设备状态映射
export const EQUIP_STATUS_MAP: Record<EquipStatus, { label: string; color: string; badge: any }> = {
  ACTIVE:     { label: '运行中', color: '#52c41a', badge: 'success' },
  IDLE:       { label: '空闲',   color: '#1677ff', badge: 'processing' },
  MAINTENANCE:{ label: '保养中', color: '#faad14', badge: 'warning' },
  FAULT:      { label: '故障',   color: '#cf1322', badge: 'error' },
  SCRAPPED:   { label: '已报废', color: '#8c8c8c', badge: 'default' },
  DISABLED:    { label: '已停用', color: '#d9d9d9', badge: 'default' },
};

// 设备类别映射
export const EQUIP_CATEGORY_MAP: Record<EquipCategory, { label: string; color: string }> = {
  MACHINE: { label: '加工设备', color: '#1677ff' },
  INSPECT: { label: '检测设备', color: '#52c41a' },
  CLEAN:   { label: '清洗设备', color: '#13c2c2' },
  COAT:    { label: '涂层设备', color: '#722ed1' },
  HEAT:    { label: '热处理设备', color: '#fa8c16' },
  PACK:    { label: '包装设备', color: '#eb2f96' },
  MARK:    { label: '标识设备', color: '#f5222d' },
  OTHER:   { label: '其他设备', color: '#8c8c8c' },
};

// 默认设备数据
export const DEFAULT_EQUIPMENT: EquipRecord[] = [
  {
    id: 'EQ-001',
    equipCode: 'GRIND-001',
    equipName: '数控磨床',
    category: 'MACHINE',
    model: 'CNC-GRIND-200',
    brand: '精密机床厂',
    serialNo: 'S202401001',
    workshop: '精密加工车间',
    workCenter: 'WC-GRIND-01',
    location: 'A区-01号位',
    purchaseDate: '2023-06-15',
    installDate: '2023-07-01',
    warrantyDate: '2025-06-15',
    assetNo: 'ZC-2023-001234',
    isSpecialProcess: true,
    isValidationRequired: true,
    precision: '锥度±0.005mm，直径±0.003mm',
    status: 'ACTIVE',
    lastMaintDate: '2026-04-20',
    nextMaintDate: '2026-05-20',
    oeeTarget: 85,
    currentOee: 82,
    remark: '根管锉锥度磨削核心设备，需每日点检',
    createdAt: '2023-06-15 10:00:00',
    updatedAt: '2026-04-20 16:30:00',
    createdBy: '设备管理员',
  },
  {
    id: 'EQ-002',
    equipCode: 'COAT-001',
    equipName: 'PVD涂层设备',
    category: 'COAT',
    model: 'PVD-3000',
    brand: '真空技术公司',
    serialNo: 'S202402001',
    workshop: '精密加工车间',
    workCenter: 'WC-COAT-01',
    location: 'B区-01号位',
    purchaseDate: '2023-08-01',
    installDate: '2023-09-01',
    warrantyDate: '2025-08-01',
    assetNo: 'ZC-2023-002345',
    isSpecialProcess: true,
    isValidationRequired: true,
    precision: '膜厚0.5±0.1μm',
    status: 'ACTIVE',
    lastMaintDate: '2026-04-18',
    nextMaintDate: '2026-05-18',
    oeeTarget: 80,
    currentOee: 78,
    remark: 'TiN涂层关键设备，需保持真空度1.0×10⁻³Pa',
    createdAt: '2023-08-01 10:00:00',
    updatedAt: '2026-04-18 14:20:00',
    createdBy: '设备管理员',
  },
  {
    id: 'EQ-003',
    equipCode: 'CLEAN-001',
    equipName: '超声波清洗机',
    category: 'CLEAN',
    model: 'US-3000',
    brand: '清洗设备公司',
    serialNo: 'S202403001',
    workshop: '清洗车间',
    workCenter: 'WC-CLEAN-01',
    location: 'A区-01号位',
    purchaseDate: '2023-05-01',
    installDate: '2023-05-20',
    warrantyDate: '2025-05-01',
    assetNo: 'ZC-2023-003456',
    isSpecialProcess: false,
    precision: '洁净度100级',
    status: 'ACTIVE',
    lastMaintDate: '2026-04-15',
    nextMaintDate: '2026-05-15',
    oeeTarget: 90,
    currentOee: 88,
    remark: '标准清洗流程，4道工序',
    createdAt: '2023-05-01 10:00:00',
    updatedAt: '2026-04-15 11:45:00',
    createdBy: '设备管理员',
  },
  {
    id: 'EQ-004',
    equipCode: 'INSPECT-001',
    equipName: '投影仪',
    category: 'INSPECT',
    model: 'PJ-5000',
    brand: '精密仪器厂',
    serialNo: 'S202404001',
    workshop: '精密加工车间',
    workCenter: 'WC-INSPECT-01',
    location: '质检室-01号位',
    purchaseDate: '2023-04-01',
    installDate: '2023-04-15',
    warrantyDate: '2025-04-01',
    assetNo: 'ZC-2023-004567',
    isSpecialProcess: false,
    precision: '±0.005mm',
    status: 'ACTIVE',
    lastMaintDate: '2026-04-10',
    nextMaintDate: '2026-05-10',
    lastCalibDate: '2026-03-15',
    nextCalibDate: '2026-06-15',
    oeeTarget: 95,
    currentOee: 92,
    remark: '关键检测设备，需每季度校准',
    createdAt: '2023-04-01 10:00:00',
    updatedAt: '2026-04-10 09:30:00',
    createdBy: '设备管理员',
  },
];

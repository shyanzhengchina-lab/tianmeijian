import type { PageQuery, PageResult } from '../../../shared/api/requestTypes';
// Re-export types from types/index.ts
export * from './types/index';
/**
 * 质检工作台模块类型定义
 * 保持与现有数据结构完全一致
 */

// 质检状态
export type InspectionStatus = 'PENDING' | 'IN_PROGRESS' | 'PASSED' | 'FAILED' | 'CONDITIONAL';

// 质检类型
export type InspectionType = 'INCOMING' | 'PROCESS' | 'OUTGOING' | 'FINAL';

// 质检单接口
export interface Inspection {
  id: string;
  inspectionNo: string;       // 质检单号
  ticketId?: string;          // 关联浮票ID
  ticketNo?: string;         // 关联浮票号
  workOrderId?: string;       // 关联工单ID
  workOrderNo?: string;      // 关联工单号
  // 产品信息
  productCode: string;
  productName: string;
  productSpec: string;
  batchNo: string;            // 批号
  lotNo?: string;            // 子批号
  // 质检信息
  inspectionType: InspectionType;
  status: InspectionStatus;
  qcSchemeId: string;        // 质检方案ID
  qcSchemeName: string;      // 质检方案名称
  inspector?: string;        // 检验员
  inspectionTime?: string;   // 检验时间
  // 样品信息
  sampleQty: number;         // 抽样数量
  qualifiedQty: number;      // 合格数量
  unqualifiedQty: number;    // 不合格数量
  conditionalQty: number;     // 有条件合格数量
  // 结果信息
  result?: InspectionStatus;
  resultDetails?: string;     // 结果详情
  // 时间信息
  requestTime: string;       // 申请时间
  completeTime?: string;     // 完成时间
  // 其他
  remark?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// 质检项目接口
export interface InspectionItem {
  id: string;
  inspectionId: string;      // 质检单ID
  itemId: string;            // 质检项目ID
  itemCode: string;          // 项目编码
  itemName: string;          // 项目名称
  itemSpec?: string;         // 项目规格
  // 检验方法
  checkMethod: string;       // 检验方法
  checkTool?: string;        // 检验工具
  // 标准
  standardValue?: string;     // 标准值
  tolerance?: string;        // 公差
  unit?: string;             // 单位
  // 检验结果
  result: 'PASS' | 'FAIL' | 'CONDITIONAL';
  actualValue?: string;      // 实测值
  deviation?: string;        // 偏差
  // 检验信息
  inspector?: string;
  inspectionTime?: string;
  // 附件
  attachments?: string[];    // 附件URL列表
  // 备注
  remark?: string;
}

// 质检统计接口
export interface InspectionStatistics {
  id: string;
  inspectionId: string;      // 质检单ID
  // 统计信息
  totalItems: number;        // 总检验项目数
  passedItems: number;       // 合格项目数
  failedItems: number;       // 不合格项目数
  conditionalItems: number;  // 有条件合格项目数
  // 样品统计
  totalSamples: number;      // 总样品数
  qualifiedSamples: number;  // 合格样品数
  unqualifiedSamples: number;// 不合格样品数
  // 不良项目分析
  defectAnalysis: {
    itemId: string;
    itemName: string;
    defectCount: number;
    defectRate: number;
  }[];
}

// 质检单查询参数
export interface InspectionQuery extends PageQuery {
  inspectionNo?: string;
  ticketNo?: string;
  workOrderNo?: string;
  productCode?: string;
  productName?: string;
  batchNo?: string;
  inspectionType?: InspectionType;
  status?: InspectionStatus;
  inspector?: string;
  requestTimeStart?: string;
  requestTimeEnd?: string;
}

// 创建质检单DTO
export interface CreateInspectionDTO {
  inspectionNo: string;
  ticketId?: string;
  ticketNo?: string;
  workOrderId?: string;
  workOrderNo?: string;
  productCode: string;
  productName: string;
  productSpec: string;
  batchNo: string;
  lotNo?: string;
  inspectionType: InspectionType;
  qcSchemeId: string;
  qcSchemeName: string;
  sampleQty: number;
  remark?: string;
}

// 更新质检单DTO
export interface UpdateInspectionDTO extends Partial<CreateInspectionDTO> {
  id: string;
}

// 批量操作参数
export interface InspectionBatchAction {
  ids: string[];
  action: 'start' | 'pass' | 'fail' | 'conditional' | 'delete' | 'assign';
  params?: Record<string, any>;
}

// 质检状态映射
export const INSPECTION_STATUS_MAP: Record<InspectionStatus, { label: string; color: string; badge: any }> = {
  'PENDING':     { label: '待检验',  color: '#8c8c8c', badge: 'default' },
  'IN_PROGRESS': { label: '检验中',  color: '#1677ff', badge: 'processing' },
  'PASSED':      { label: '合格',    color: '#52c41a', badge: 'success' },
  'FAILED':      { label: '不合格',  color: '#ff4d4f', badge: 'error' },
  'CONDITIONAL': { label: '有条件',  color: '#faad14', badge: 'warning' },
};

// 别名导出，兼容旧代码
export const QUALITY_INSPECTION_STATUS_MAP = INSPECTION_STATUS_MAP;

// 质检结果映射（与状态相同，用于不同场景）
export const QUALITY_INSPECTION_RESULT_MAP = INSPECTION_STATUS_MAP;

// 质检类型映射
export const INSPECTION_TYPE_MAP: Record<InspectionType, { label: string; color: string; icon?: string }> = {
  'INCOMING':  { label: '进料检验', color: '#1677ff', icon: '📥' },
  'PROCESS':   { label: '过程检验', color: '#faad14', icon: '🔍' },
  'OUTGOING':  { label: '出货检验', color: '#52c41a', icon: '📤' },
  'FINAL':     { label: '最终检验', color: '#722ed1', icon: '✅' },
};

// 别名导出，兼容旧代码
export const QUALITY_INSPECTION_TYPE_MAP = INSPECTION_TYPE_MAP;

// 默认质检单数据
export const DEFAULT_INSPECTIONS: Inspection[] = [
  {
    id: 'INS-001',
    inspectionNo: 'INS-20260425001',
    ticketId: 'FT-001',
    ticketNo: 'FT-20260425001',
    workOrderId: 'WO-001',
    workOrderNo: 'WO-20260425001',
    productCode: 'FG-RKQ-2504-25',
    productName: '机用根管锉',
    productSpec: '#25/04锥/25mm',
    batchNo: '20260425001',
    lotNo: '001',
    inspectionType: 'PROCESS',
    status: 'IN_PROGRESS',
    qcSchemeId: 'QC-001',
    qcSchemeName: '机用根管锉检验方案',
    inspector: '检验员A',
    sampleQty: 10,
    qualifiedQty: 8,
    unqualifiedQty: 1,
    conditionalQty: 1,
    requestTime: '2026-04-05 13:00:00',
    remark: '过程检验',
    createdBy: '生产调度',
    createdAt: '2026-04-05 13:00:00',
    updatedAt: '2026-04-05 14:30:00',
  },
];

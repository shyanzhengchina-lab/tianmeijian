import type { PageQuery, PageResult } from '../../../shared/api/requestTypes';
// Re-export types from types/index.ts
export * from './types/index';
/**
 * 工序主数据模块类型定义
 * 保持与现有数据结构完全一致
 */

// 工序类别
export type OpCategory = 'PROD' | 'INSP' | 'PACK' | 'SPEC' | 'OUTS';

// 工序状态
export type OpStatus = 'DRAFT' | 'ACTIVE' | 'OBSOLETE' | 'DISABLED';

// 阶段类型
export type PhaseType = 'PREP' | 'LOAD' | 'EXEC' | 'IPQC' | 'OQC' | 'CLEAN' | 'HAND' | 'SPEC';

// 字段输入类型
export type FieldInputType = 'AUTO' | 'MANUAL' | 'SELECT' | 'SCAN' | 'ESIGN' | 'UPLOAD';

// 字段数据类型
export type FieldDataType = 'Decimal' | 'Int' | 'String' | 'Enum' | 'Boolean' | 'DateTime' | 'Date' | 'Image' | 'JSON' | 'Ref';

// 阶段字段接口
export interface PhaseField {
  code: string;
  name: string;
  dataType: FieldDataType;
  required: boolean;
  stdValue?: string;
  unit?: string;
  inputType?: FieldInputType;
  instrument?: string;   // 量具
  remark?: string;
}

// 工序阶段接口
export interface OperationPhase {
  seq: number;          // 10,20,30…
  phaseCode: string;
  phaseName: string;
  phaseType: PhaseType;
  required: boolean;
  eSign: boolean;       // 电子签名
  dualReview: boolean;  // 双人复核
  linkedDoc?: string;   // 关联单据
  remark?: string;      // 阶段备注/特殊控制说明
  fields: PhaseField[];
  photoReq?: 'NONE' | 'OPTIONAL' | 'REQUIRED';
  scanReq?: 'NONE' | 'EQUIP' | 'MATERIAL' | 'PERSON';
  timeoutMin?: number;
}

// 工序接口
export interface Operation {
  id: string;
  opCode: string;
  opName: string;
  opShort: string;           // 简称（PAD用）
  category: OpCategory;
  workshop: string;
  productLine: string;
  workCenter: string;
  equipType: string;
  stdTimeMin: number;        // 标准工时（分钟/件）
  prepTimeMin: number;       // 准备工时（分钟）
  hasFirstPiece: boolean;
  hasLastPiece: boolean;
  hasPatrol: boolean;
  patrolFreq?: number;       // 巡检频次（每N件）
  hasCleanup: boolean;
  envReq?: string;           // 环境要求
  paramTemplate?: string;    // 技术参数模板
  isBottleneck: boolean;
  isReportPoint: boolean;    // 报工点
  isQcPoint: boolean;        // 质检点
  status: OpStatus;
  version: string;
  effectDate: string;
  createdBy: string;
  updatedAt: string;
  remark?: string;
  phases: OperationPhase[];
}

// 工序查询参数
export interface OperationQuery extends PageQuery {
  opCode?: string;
  opName?: string;
  category?: OpCategory;
  workshop?: string;
  workCenter?: string;
  status?: OpStatus;
  createdBy?: string;
}

// 创建工序DTO
export interface CreateOperationDTO {
  opCode: string;
  opName: string;
  opShort: string;
  category: OpCategory;
  workshop: string;
  productLine: string;
  workCenter: string;
  equipType: string;
  stdTimeMin: number;
  prepTimeMin: number;
  hasFirstPiece: boolean;
  hasLastPiece: boolean;
  hasPatrol: boolean;
  patrolFreq?: number;
  hasCleanup: boolean;
  envReq?: string;
  paramTemplate?: string;
  isBottleneck: boolean;
  isReportPoint: boolean;
  isQcPoint: boolean;
  version: string;
  effectDate: string;
  remark?: string;
  phases: Omit<OperationPhase, 'seq'>[];
}

// 更新工序DTO
export interface UpdateOperationDTO extends Partial<CreateOperationDTO> {
  id: string;
}

// 批量操作参数
export interface OperationBatchAction {
  ids: string[];
  action: 'activate' | 'deactivate' | 'obsolete' | 'delete';
  params?: Record<string, any>;
}

// 阶段类型映射
export const PHASE_TYPE_MAP: Record<PhaseType, { label: string; color: string }> = {
  PREP:  { label: '生产准备', color: '#722ED1' },
  LOAD:  { label: '上料核对', color: '#1677FF' },
  EXEC:  { label: '加工执行', color: '#13C2C2' },
  IPQC:  { label: '过程检验', color: '#FA8C16' },
  OQC:   { label: '完工检验', color: '#EB2F96' },
  CLEAN: { label: '清场清洁', color: '#52C41A' },
  HAND:  { label: '工序交接', color: '#8C8C8C' },
  SPEC:  { label: '特殊确认', color: '#E60012' },
};

// 工序类别映射
export const OP_CATEGORY_MAP: Record<OpCategory, { label: string; color: string }> = {
  PROD: { label: '生产工序', color: '#1677FF' },
  INSP: { label: '检验工序', color: '#FA8C16' },
  PACK: { label: '包装工序', color: '#52C41A' },
  SPEC: { label: '特殊工序', color: '#E60012' },
  OUTS: { label: '外协工序', color: '#722ED1' },
};

// 工序状态映射
export const OP_STATUS_MAP: Record<OpStatus, { label: string; color: string; badge: any }> = {
  DRAFT:    { label: '草稿',   color: '#8C8C8C', badge: 'default' },
  ACTIVE:   { label: '已生效', color: '#52C41A', badge: 'success' },
  OBSOLETE: { label: '已失效', color: '#FAAD14', badge: 'warning' },
  DISABLED: { label: '已停用', color: '#FF4D4F', badge: 'error' },
};

// 字段数据类型映射
export const FIELD_DATA_TYPE_MAP: Record<FieldDataType, { label: string; color: string }> = {
  Decimal:  { label: '小数',   color: '#1677FF' },
  Int:      { label: '整数',   color: '#52C41A' },
  String:   { label: '文本',   color: '#FA8C16' },
  Enum:     { label: '枚举',   color: '#722ED1' },
  Boolean:  { label: '布尔',   color: '#13C2C2' },
  DateTime: { label: '日期时间', color: '#EB2F96' },
  Date:     { label: '日期',   color: '#EB2F96' },
  Image:    { label: '图片',   color: '#CF1322' },
  JSON:     { label: 'JSON',  color: '#8C8C8C' },
  Ref:      { label: '引用',   color: '#1890FF' },
};

// 字段输入类型映射
export const FIELD_INPUT_TYPE_MAP: Record<FieldInputType, { label: string; color: string }> = {
  AUTO:   { label: '自动采集', color: '#52C41A' },
  MANUAL: { label: '手动录入', color: '#1677FF' },
  SELECT: { label: '下拉选择', color: '#FA8C16' },
  SCAN:   { label: '扫码',    color: '#722ED1' },
  ESIGN:  { label: '电子签名', color: '#EB2F96' },
  UPLOAD: { label: '上传',    color: '#CF1322' },
};

// 默认工序数据（简化版）
export const DEFAULT_OPERATIONS: Operation[] = [
  {
    id: 'op-001',
    opCode: 'OP-CUT-001',
    opName: '数控磨削',
    opShort: '磨削',
    category: 'PROD',
    workshop: '精密加工车间',
    productLine: '根管锉A线',
    workCenter: 'WC-GRIND-01',
    equipType: '数控磨床',
    stdTimeMin: 4.5,
    prepTimeMin: 30,
    hasFirstPiece: true,
    hasLastPiece: true,
    hasPatrol: true,
    patrolFreq: 50,
    hasCleanup: true,
    envReq: '温度 20±2℃，相对湿度 45~65%，防振',
    paramTemplate: 'TP-GRIND-001',
    isBottleneck: true,
    isReportPoint: true,
    isQcPoint: true,
    status: 'ACTIVE',
    version: 'V1.0',
    effectDate: '2026-01-15',
    createdBy: '工艺工程师',
    updatedAt: '2026-04-01',
    remark: '瓶颈工序，锥度/直径精度关键控制点',
    phases: [],
  },
  {
    id: 'op-002',
    opCode: 'OP-COAT-001',
    opName: 'TiN涂层',
    opShort: '涂层',
    category: 'SPEC',
    workshop: '精密加工车间',
    productLine: '根管锉A线',
    workCenter: 'WC-COAT-01',
    equipType: 'PVD涂层设备',
    stdTimeMin: 2.0,
    prepTimeMin: 60,
    hasFirstPiece: true,
    hasLastPiece: true,
    hasPatrol: false,
    hasCleanup: true,
    envReq: '洁净度100级，防尘、防静电',
    paramTemplate: 'TP-COAT-001',
    isBottleneck: true,
    isReportPoint: true,
    isQcPoint: true,
    status: 'ACTIVE',
    version: 'V1.2',
    effectDate: '2026-01-15',
    createdBy: '工艺工程师',
    updatedAt: '2026-04-01',
    remark: '特殊工序，膜厚0.5±0.1μm，关键控制点',
    phases: [],
  },
  {
    id: 'op-003',
    opCode: 'OP-CLEAN-001',
    opName: '超声清洗',
    opShort: '清洗',
    category: 'PROD',
    workshop: '清洗车间',
    productLine: '根管锉A线',
    workCenter: 'WC-CLEAN-01',
    equipType: '超声波清洗机',
    stdTimeMin: 3.0,
    prepTimeMin: 15,
    hasFirstPiece: false,
    hasLastPiece: false,
    hasPatrol: false,
    hasCleanup: true,
    envReq: '洁净度10000级',
    isBottleneck: false,
    isReportPoint: true,
    isQcPoint: false,
    status: 'ACTIVE',
    version: 'V1.0',
    effectDate: '2026-01-15',
    createdBy: '工艺工程师',
    updatedAt: '2026-04-01',
    remark: '标准清洗流程，4道工序',
    phases: [],
  },
  {
    id: 'op-004',
    opCode: 'OP-ASM-001',
    opName: '装配包装',
    opShort: '装配',
    category: 'PACK',
    workshop: '组装车间',
    productLine: '根管锉A线',
    workCenter: 'WC-ASM-01',
    equipType: '装配台',
    stdTimeMin: 2.5,
    prepTimeMin: 20,
    hasFirstPiece: true,
    hasLastPiece: true,
    hasPatrol: true,
    patrolFreq: 100,
    hasCleanup: true,
    isBottleneck: false,
    isReportPoint: true,
    isQcPoint: true,
    status: 'ACTIVE',
    version: 'V1.0',
    effectDate: '2026-01-15',
    createdBy: '工艺工程师',
    updatedAt: '2026-04-01',
    remark: '最后一道工序，包装前质检',
    phases: [],
  },
];

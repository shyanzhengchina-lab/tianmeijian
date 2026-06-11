/**
 * 质量放行模块类型定义
 */

import type { PageQuery, PageResult } from '../../../../shared/api/requestTypes';

/**
 * 放行状态
 */
export type ReleaseStatus =
  | 'PENDING'         // 待放行
  | 'INSPECTING'      // 检验中
  | 'INSPECTED'       // 已检验
  | 'APPROVED'        // 已批准
  | 'REJECTED'        // 已拒绝
  | 'CANCELLED';      // 已取消

/**
 * 放行类型
 */
export type ReleaseType =
  | 'FIRST_RELEASE'   // 首次放行
  | 'REWORK_RELEASE'  // 返工放行
  | 'EXCEPTION_RELEASE'; // 异常放行

/**
 * 质量放行接口
 */
export interface QualityRelease {
  id: string;
  releaseNo: string; // 放行单号
  workOrderId: string; // 工单ID
  workOrderNo: string; // 工单编号
  productId: string; // 产品ID
  productCode: string; // 产品编码
  productName: string; // 产品名称
  productSpec: string; // 产品规格
  batchNo: string; // 批号

  // 放行状态
  status: ReleaseStatus;
  type: ReleaseType;

  // 数量信息
  productionQty: number; // 生产数量
  qualifiedQty: number; // 合格数量
  unqualifiedQty: number; // 不合格数量
  releaseQty: number; // 放行数量

  // 检验信息
  inspectionResult: 'PASS' | 'FAIL' | 'CONDITIONAL'; // 检验结果
  inspectionId: string; // 检验报告ID
  inspectionNo: string; // 检验报告编号
  inspectorId: string; // 检验员ID
  inspectorName: string; // 检验员姓名
  inspectionTime: string; // 检验时间

  // 质量控制点
  qualityPoints: Array<{
    pointId: string;
    pointName: string;
    pointCode: string;
    standardValue: string;
    actualValue: string;
    result: 'PASS' | 'FAIL' | 'WARNING';
    tolerance: string;
  }>;

  // 审批信息
  approverId: string | null; // 审批人ID
  approverName: string | null; // 审批人姓名
  approveTime: string | null; // 审批时间
  approveComment: string | null; // 审批意见

  // 放行条件
  releaseConditions: string[]; // 放行条件
  conditionsMet: boolean; // 条件是否满足
  missingConditions: string[]; // 未满足的条件

  // 异常处理
  hasException: boolean; // 是否有异常
  exceptionType: string | null; // 异常类型
  exceptionHandling: string | null; // 异常处理方式

  // 文档信息
  documents: Array<{
    documentId: string;
    documentName: string;
    documentType: string;
    uploadTime: string;
    uploaderId: string;
    uploaderName: string;
  }>;

  // 追溯信息
  traceInfo: {
    rawMaterials: Array<{ materialId: string; materialName: string; batchNo: string }>;
    equipment: Array<{ equipmentId: string; equipmentName: string; serialNo: string }>;
    operations: Array<{ opId: string; opName: string; operatorId: string; operatorName: string; time: string }>;
  };

  // 时间信息
  requestTime: string; // 申请时间
  requesterId: string; // 申请人ID
  requesterName: string; // 申请人姓名
  releaseTime: string | null; // 放行时间

  // 系统信息
  createTime: string; // 创建时间
  updateTime: string; // 更新时间
  factoryId: string; // 工厂ID
  remark: string | null; // 备注
}

/**
 * 质量放行查询参数
 */
export interface QualityReleaseQuery extends PageQuery {
  releaseNo?: string; // 放行单号
  workOrderId?: string; // 工单ID
  workOrderNo?: string; // 工单编号
  productCode?: string; // 产品编码
  productName?: string; // 产品名称
  batchNo?: string; // 批号
  status?: ReleaseStatus; // 状态
  type?: ReleaseType; // 类型
  inspectorId?: string; // 检验员ID
  requesterId?: string; // 申请人ID
  startDate?: string; // 开始日期
  endDate?: string; // 结束日期
}

/**
 * 创建质量放行DTO
 */
export interface CreateQualityReleaseDTO {
  workOrderId: string; // 工单ID
  inspectionId: string; // 检验报告ID
  releaseType: ReleaseType; // 放行类型
  releaseQty: number; // 放行数量
  releaseConditions: string[]; // 放行条件
  requesterId: string; // 申请人ID
  remark?: string; // 备注
}

/**
 * 更新质量放行DTO
 */
export interface UpdateQualityReleaseDTO extends Partial<CreateQualityReleaseDTO> {
  id: string; // 放行单ID
}

/**
 * 批准质量放行DTO
 */
export interface ApproveQualityReleaseDTO {
  releaseId: string; // 放行单ID
  approverId: string; // 审批人ID
  approver?: string; // alias for approverId
  approveComment: string; // 审批意见
  conditionsMet: boolean; // 条件是否满足
}

/**
 * 拒绝质量放行DTO
 */
export interface RejectQualityReleaseDTO {
  releaseId: string; // 放行单ID
  approverId: string; // 审批人ID
  approver?: string; // alias for approverId
  rejectReason: string; // 拒绝原因
  suggestion?: string; // 建议
}

/**
 * 取消质量放行DTO
 */
export interface CancelQualityReleaseDTO {
  releaseId: string; // 放行单ID
  cancelReason: string; // 取消原因
}

/**
 * 质量放行状态映射
 */
export const QUALITY_RELEASE_STATUS_MAP: Record<ReleaseStatus, { label: string; color: string; bg: string; border: string }> = {
  PENDING: { label: '待放行', color: '#faad14', bg: '#fffbe6', border: '#ffe58f' },
  INSPECTING: { label: '检验中', color: '#1890ff', bg: '#e6f7ff', border: '#91d5ff' },
  INSPECTED: { label: '已检验', color: '#722ed1', bg: '#f9f0ff', border: '#d3adf7' },
  APPROVED: { label: '已批准', color: '#52c41a', bg: '#f6ffed', border: '#b7eb8f' },
  REJECTED: { label: '已拒绝', color: '#ff4d4f', bg: '#fff1f0', border: '#ffa39e' },
  CANCELLED: { label: '已取消', color: '#bfbfbf', bg: '#f5f5f5', border: '#d9d9d9' },
};

/**
 * 质量放行类型映射
 */
export const QUALITY_RELEASE_TYPE_MAP: Record<ReleaseType, { label: string; color: string; icon: string }> = {
  FIRST_RELEASE: { label: '首次放行', color: '#1890ff', icon: '✅' },
  REWORK_RELEASE: { label: '返工放行', color: '#faad14', icon: '🔄' },
  EXCEPTION_RELEASE: { label: '异常放行', color: '#ff7a45', icon: '⚠️' },
};

/**
 * 质量放行表格列配置
 */
export const QUALITY_RELEASE_COLUMNS = [
  { key: 'releaseNo', title: '放行单号', width: 150, align: 'center', fixed: 'left' },
  { key: 'workOrderNo', title: '工单编号', width: 150, align: 'center' },
  { key: 'productCode', title: '产品编码', width: 120, align: 'center' },
  { key: 'productName', title: '产品名称', width: 200, align: 'center' },
  { key: 'batchNo', title: '批号', width: 120, align: 'center' },
  { key: 'status', title: '状态', width: 100, align: 'center' },
  { key: 'type', title: '类型', width: 120, align: 'center' },
  { key: 'inspectionNo', title: '检验报告编号', width: 150, align: 'center' },
  { key: 'inspectorName', title: '检验员', width: 120, align: 'center' },
  { key: 'productionQty', title: '生产数量', width: 100, align: 'center' },
  { key: 'qualifiedQty', title: '合格数量', width: 100, align: 'center' },
  { key: 'releaseQty', title: '放行数量', width: 100, align: 'center' },
  { key: 'requesterName', title: '申请人', width: 120, align: 'center' },
  { key: 'requestTime', title: '申请时间', width: 160, align: 'center' },
  { key: 'approverName', title: '审批人', width: 120, align: 'center' },
  { key: 'approveTime', title: '审批时间', width: 160, align: 'center' },
  { key: 'action', title: '操作', width: 250, align: 'center', fixed: 'right' },
];

export default {
  QUALITY_RELEASE_STATUS_MAP,
  QUALITY_RELEASE_TYPE_MAP,
  QUALITY_RELEASE_COLUMNS,
};
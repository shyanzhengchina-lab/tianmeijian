/**
 * 质量检验模块类型定义
 */

import type { PageQuery, PageResult } from '../../../../shared/api/requestTypes';

/**
 * 检验状态
 */
export type InspectionStatus =
  | 'PENDING'         // 待检验
  | 'INSPECTING'      // 检验中
  | 'COMPLETED'       // 已完成
  | 'APPROVED'        // 已审核
  | 'REJECTED'        // 已拒绝
  | 'CANCELLED';      // 已取消

/**
 * 检验类型
 */
export type InspectionType =
  | 'INCOMING'        // 进料检验
  | 'PROCESS'         // 过程检验
  | 'FINAL'           // 成品检验
  | 'OUTGOING'        // 出货检验;

/**
 * 检验结果
 */
export type InspectionResult =
  | 'PASS'            // 合格
  | 'FAIL'            // 不合格
  | 'CONDITIONAL';    // 条件合格

/**
 * 质量检验接口
 */
export interface QualityInspection {
  id: string;
  inspectionNo: string; // 检验单号
  inspectionType: InspectionType; // 检验类型
  status: InspectionStatus; // 检验状态

  // 关联信息
  workOrderId?: string; // 工单ID
  workOrderNo?: string; // 工单编号
  materialId?: string; // 物料ID
  materialCode?: string; // 物料编码
  materialName?: string; // 物料名称
  productId?: string; // 产品ID
  productCode?: string; // 产品编码
  productName?: string; // 产品名称
  productSpec?: string; // 产品规格

  // 批次信息
  batchNo: string; // 批号
  lotNo?: string; // 子批号
  supplierId?: string; // 供应商ID
  supplierName?: string; // 供应商名称

  // 数量信息
  inspectionQty: number; // 检验数量
  qualifiedQty: number; // 合格数量
  unqualifiedQty: number; // 不合格数量
  conditionalQty: number; // 条件合格数量

  // 检验结果
  inspectionResult: InspectionResult; // 检验结果
  qualifiedRate: number; // 合格率

  // 检验方案
  schemeId: string; // 检验方案ID
  schemeName: string; // 检验方案名称
  sampleMethod: string; // 抽样方法

  // 检验项目
  inspectionItems: Array<{
    itemId: string; // 检验项目ID
    itemName: string; // 检验项目名称
    itemCode: string; // 检验项目代码
    itemType: 'CRITICAL' | 'MAJOR' | 'MINOR'; // 项目类型
    standardValue: string; // 标准值
    tolerance: string; // 公差范围
    sampleSize: number; // 抽样数量
    checkMethod: string; // 检验方法

    // 检验记录
    actualValue: string; // 实际值
    result: 'PASS' | 'FAIL' | 'CONDITIONAL'; // 结果
    remark?: string; // 备注

    // 图片记录
    images: Array<{
      imageId: string;
      imageUrl: string;
      description: string;
      uploadTime: string;
    }>;
  }>;

  // 不合格处理
  hasDefect: boolean; // 是否有不合格
  defectTypes: Array<{
    defectId: string;
    defectName: string;
    defectCode: string;
    defectCount: number;
    severity: 'CRITICAL' | 'MAJOR' | 'MINOR';
    description: string;
  }>;

  // 处置意见
  disposition: 'ACCEPT' | 'REWORK' | 'SCRAP' | 'RETURN' | 'CONCESSION'; // 处置方式
  dispositionReason: string | null; // 处置原因

  // 人员信息
  inspectorId: string; // 检验员ID
  inspectorName: string; // 检验员姓名
  approverId: string | null; // 审核人ID
  approverName: string | null; // 审核人姓名

  // 时间信息
  planInspectTime: string; // 计划检验时间
  actualInspectTime: string; // 实际检验时间
  approveTime: string | null; // 审核时间

  // 系统信息
  createTime: string; // 创建时间
  updateTime: string; // 更新时间
  factoryId: string; // 工厂ID
  remark: string | null; // 备注
}

/**
 * 质量检验查询参数
 */
export interface QualityInspectionQuery extends PageQuery {
  inspectionNo?: string; // 检验单号
  inspectionType?: InspectionType; // 检验类型
  status?: InspectionStatus; // 状态
  result?: InspectionResult; // 结果
  workOrderNo?: string; // 工单编号
  productCode?: string; // 产品编码
  productName?: string; // 产品名称
  materialCode?: string; // 物料编码
  materialName?: string; // 物料名称
  batchNo?: string; // 批号
  supplierId?: string; // 供应商ID
  inspectorId?: string; // 检验员ID
  startDate?: string; // 开始日期
  endDate?: string; // 结束日期
}

/**
 * 创建质量检验DTO
 */
export interface CreateQualityInspectionDTO {
  inspectionType: InspectionType; // 检验类型
  workOrderId?: string; // 工单ID
  materialId?: string; // 物料ID
  productId?: string; // 产品ID
  batchNo: string; // 批号
  lotNo?: string; // 子批号
  supplierId?: string; // 供应商ID
  inspectionQty: number; // 检验数量
  schemeId: string; // 检验方案ID
  planInspectTime: string; // 计划检验时间
  inspectorId: string; // 检验员ID
  remark?: string; // 备注
}

/**
 * 更新质量检验DTO
 */
export interface UpdateQualityInspectionDTO extends Partial<CreateQualityInspectionDTO> {
  id: string; // 检验单ID
}

/**
 * 提交检验结果DTO
 */
export interface SubmitInspectionResultDTO {
  inspectionId: string; // 检验单ID
  resultDetails?: string; // 结果明细(alias)
  inspectionItems?: Array<{
    itemId: string; // 检验项目ID
    actualValue: string; // 实际值
    result: 'PASS' | 'FAIL' | 'CONDITIONAL'; // 结果
    remark?: string; // 备注
    images?: string[]; // 图片ID列表
  }>;
  inspectionResult?: InspectionResult; // 总体检验结果
  disposition?: 'ACCEPT' | 'REWORK' | 'SCRAP' | 'RETURN' | 'CONCESSION'; // 处置方式
  dispositionReason?: string; // 处置原因
}

/**
 * 审核检验结果DTO
 */
export interface ApproveInspectionDTO {
  inspectionId: string; // 检验单ID
  approverId: string; // 审核人ID
  approver?: string; // alias for approverId
  approveResult: 'APPROVED' | 'REJECTED'; // 审核结果
  approveComment: string; // 审核意见
}

/**
 * 取消检验DTO
 */
export interface CancelInspectionDTO {
  inspectionId: string; // 检验单ID
  cancelReason: string; // 取消原因
}

/**
 * 质量检验状态映射
 */
export const QUALITY_INSPECTION_STATUS_MAP: Record<InspectionStatus, { label: string; color: string; bg: string; border: string }> = {
  PENDING: { label: '待检验', color: '#faad14', bg: '#fffbe6', border: '#ffe58f' },
  INSPECTING: { label: '检验中', color: '#1890ff', bg: '#e6f7ff', border: '#91d5ff' },
  COMPLETED: { label: '已完成', color: '#722ed1', bg: '#f9f0ff', border: '#d3adf7' },
  APPROVED: { label: '已审核', color: '#52c41a', bg: '#f6ffed', border: '#b7eb8f' },
  REJECTED: { label: '已拒绝', color: '#ff4d4f', bg: '#fff1f0', border: '#ffa39e' },
  CANCELLED: { label: '已取消', color: '#bfbfbf', bg: '#f5f5f5', border: '#d9d9d9' },
};

/**
 * 质量检验类型映射
 */
export const QUALITY_INSPECTION_TYPE_MAP: Record<InspectionType, { label: string; color: string; icon: string }> = {
  INCOMING: { label: '进料检验', color: '#1890ff', icon: '📥' },
  PROCESS: { label: '过程检验', color: '#faad14', icon: '⚙️' },
  FINAL: { label: '成品检验', color: '#52c41a', icon: '✅' },
  OUTGOING: { label: '出货检验', color: '#722ed1', icon: '📦' },
};

/**
 * 质量检验结果映射
 */
export const QUALITY_INSPECTION_RESULT_MAP: Record<InspectionResult, { label: string; color: string; icon: string }> = {
  PASS: { label: '合格', color: '#52c41a', icon: '✅' },
  FAIL: { label: '不合格', color: '#ff4d4f', icon: '❌' },
  CONDITIONAL: { label: '条件合格', color: '#faad14', icon: '⚠️' },
};

/**
 * 质量检验表格列配置
 */
export const QUALITY_INSPECTION_COLUMNS = [
  { key: 'inspectionNo', title: '检验单号', width: 150, align: 'center', fixed: 'left' },
  { key: 'inspectionType', title: '检验类型', width: 120, align: 'center' },
  { key: 'status', title: '状态', width: 100, align: 'center' },
  { key: 'workOrderNo', title: '工单编号', width: 150, align: 'center' },
  { key: 'productCode', title: '产品编码', width: 120, align: 'center' },
  { key: 'productName', title: '产品名称', width: 200, align: 'center' },
  { key: 'batchNo', title: '批号', width: 120, align: 'center' },
  { key: 'inspectionQty', title: '检验数量', width: 100, align: 'center' },
  { key: 'qualifiedQty', title: '合格数量', width: 100, align: 'center' },
  { key: 'unqualifiedQty', title: '不合格数量', width: 120, align: 'center' },
  { key: 'inspectionResult', title: '检验结果', width: 100, align: 'center' },
  { key: 'qualifiedRate', title: '合格率', width: 100, align: 'center' },
  { key: 'schemeName', title: '检验方案', width: 150, align: 'center' },
  { key: 'inspectorName', title: '检验员', width: 120, align: 'center' },
  { key: 'planInspectTime', title: '计划检验时间', width: 160, align: 'center' },
  { key: 'actualInspectTime', title: '实际检验时间', width: 160, align: 'center' },
  { key: 'approverName', title: '审核人', width: 120, align: 'center' },
  { key: 'approveTime', title: '审核时间', width: 160, align: 'center' },
  { key: 'action', title: '操作', width: 250, align: 'center', fixed: 'right' },
];

export default {
  QUALITY_INSPECTION_STATUS_MAP,
  QUALITY_INSPECTION_TYPE_MAP,
  QUALITY_INSPECTION_RESULT_MAP,
  QUALITY_INSPECTION_COLUMNS,
};
/**
 * MRB (Material Review Board) 模块类型定义
 */

import type { PageQuery, PageResult } from '../../../../shared/api/requestTypes';

/**
 * MRB评审状态
 */
export type MRBStatus =
  | 'PENDING'         // 待评审
  | 'UNDER_REVIEW'    // 评审中
  | 'COMPLETED'       // 已完成
  | 'IMPLEMENTED'     // 已实施
  | 'CANCELLED';      // 已取消

/**
 * 评审类型
 */
export type MRBReviewType =
  | 'QUALITY'         // 质量评审
  | 'TECHNICAL'       // 技术评审
  | 'JOINT';          // 联合评审

/**
 * 评审结果
 */
export type MRBReviewResult =
  | 'ACCEPT'          // 接受
  | 'REWORK'          // 返工
  | 'SCRAP'           // 报废
  | 'RETURN'          // 退货
  | 'CONCESSION';    // 特采

/**
 * MRB评审会议接口
 */
export interface MRBReview {
  id: string;
  reviewNo: string; // 评审单号
  reviewType: MRBReviewType; // 评审类型
  status: MRBStatus; // 评审状态

  // 关联信息
  inspectionId: string; // 关联检验单ID
  inspectionNo: string; // 关联检验单号
  workOrderId: string; // 工单ID
  workOrderNo: string; // 工单编号
  productCode: string; // 产品编码
  productName: string; // 产品名称
  batchNo: string; // 批号

  // 不合格信息
  defectQty: number; // 不合格数量
  defectRate: number; // 不合格率
  criticalDefects: number; // 严重缺陷数量
  majorDefects: number; // 主要缺陷数量
  minorDefects: number; // 次要缺陷数量

  // 缺陷描述
  defects: Array<{
    defectId: string;
    defectName: string;
    defectCode: string;
    severity: 'CRITICAL' | 'MAJOR' | 'MINOR';
    description: string;
    count: number;
    location?: string; // 缺陷位置
    images: string[]; // 缺陷图片
  }>;

  // 评审信息
  reviewResult: MRBReviewResult; // 评审结果
  dispositionReason: string; // 处置原因
  technicalAnalysis: string; // 技术分析
  rootCause: string; // 根本原因

  // 处置措施
  dispositionActions: Array<{
    actionId: string;
    actionType: 'REWORK' | 'SCRAP' | 'RETURN' | 'CONCESSION';
    description: string;
    responsiblePerson: string;
    deadline: string;
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  }>;

  // 评审人员
  requesterId: string; // 申请人ID
  requesterName: string; // 申请人姓名
  requesterDept: string; // 申请人部门

  reviewTeam: Array<{
    userId: string;
    userName: string;
    userRole: string; // 质量工程师、技术工程师、生产工程师等
    vote: 'AGREE' | 'DISAGREE' | 'ABSTAIN';
    comment?: string;
  }>;

  reviewChairman: string; // 评审组长ID
  chairmanName: string; // 评审组长姓名

  qualityEngineerId: string; // 质量工程师ID
  qualityEngineerName: string; // 质量工程师姓名

  technicalEngineerId: string; // 技术工程师ID
  technicalEngineerName: string; // 技术工程师姓名

  // 会议信息
  meetingTime: string; // 评审会议时间
  meetingLocation: string; // 评审会议地点
  meetingAgenda: string; // 会议议程
  meetingMinutes: string; // 会议纪要

  // 成本估算
  reworkCost?: number; // 返工成本
  scrapCost?: number; // 报废成本
  returnCost?: number; // 退货成本
  totalCost: number; // 总成本

  // 风险评估
  riskAssessment: {
    qualityRisk: 'HIGH' | 'MEDIUM' | 'LOW';
    safetyRisk: 'HIGH' | 'MEDIUM' | 'LOW';
    deliveryRisk: 'HIGH' | 'MEDIUM' | 'LOW';
    description: string;
  };

  // 实施跟踪
  implementationStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  implementationTime: string | null; // 实施时间
  implementationResult: string | null; // 实施结果

  // 时间信息
  requestTime: string; // 申请时间
  reviewTime: string | null; // 评审时间
  completionTime: string | null; // 完成时间

  // 系统信息
  createTime: string; // 创建时间
  updateTime: string; // 更新时间
  factoryId: string; // 工厂ID
  remark: string | null; // 备注
}

/**
 * MRB评审查询参数
 */
export interface MRBReviewQuery extends PageQuery {
  reviewNo?: string; // 评审单号
  reviewType?: MRBReviewType; // 评审类型
  status?: MRBStatus; // 状态
  result?: MRBReviewResult; // 结果
  inspectionNo?: string; // 检验单号
  workOrderNo?: string; // 工单编号
  productCode?: string; // 产品编码
  productName?: string; // 产品名称
  batchNo?: string; // 批号
  requesterId?: string; // 申请人ID
  startDate?: string; // 开始日期
  endDate?: string; // 结束日期
}

/**
 * 创建MRB评审DTO
 */
export interface CreateMRBReviewDTO {
  inspectionId: string; // 检验单ID
  reviewType: MRBReviewType; // 评审类型
  requesterId: string; // 申请人ID
  requesterDept: string; // 申请人部门
  meetingTime: string; // 计划会议时间
  meetingLocation: string; // 会议地点
  meetingAgenda: string; // 会议议程
  reviewTeam: Array<{
    userId: string;
    userRole: string;
  }>;
  qualityEngineerId: string; // 质量工程师ID
  technicalEngineerId: string; // 技术工程师ID
  remark?: string; // 备注
}

/**
 * 更新MRB评审DTO
 */
export interface UpdateMRBReviewDTO extends Partial<CreateMRBReviewDTO> {
  id: string; // 评审单ID
}

/**
 * 提交评审结果DTO
 */
export interface SubmitReviewResultDTO {
  reviewId: string; // 评审单ID
  reviewer?: string; // 评审人(alias)
  dispositionResult?: string; // 处置结果(alias)
  dispositionRemark?: string; // 处置备注(alias)
  reviewResult?: MRBReviewResult; // 评审结果
  dispositionReason: string; // 处置原因
  technicalAnalysis?: string; // 技术分析
  rootCause?: string; // 根本原因
  dispositionActions: Array<{
    actionType: 'REWORK' | 'SCRAP' | 'RETURN' | 'CONCESSION';
    description: string;
    responsiblePerson: string;
    deadline: string;
  }>;
  reworkCost?: number; // 返工成本
  scrapCost?: number; // 报废成本
  returnCost?: number; // 退货成本
  riskAssessment: {
    qualityRisk: 'HIGH' | 'MEDIUM' | 'LOW';
    safetyRisk: 'HIGH' | 'MEDIUM' | 'LOW';
    deliveryRisk: 'HIGH' | 'MEDIUM' | 'LOW';
    description: string;
  };
}

/**
 * 评审员投票DTO
 */
export interface ReviewerVoteDTO {
  reviewId: string; // 评审单ID
  reviewerId: string; // 评审员ID
  reviewerName?: string; // 评审员姓名
  vote: 'AGREE' | 'DISAGREE' | 'ABSTAIN'; // 投票结果
  comment?: string; // 评审意见
}

/**
 * 实施处置措施DTO
 */
export interface ImplementDispositionDTO {
  reviewId: string; // 评审单ID
  actionId: string; // 措施ID
  implementationResult: string; // 实施结果
  implementerId: string; // 实施人ID
  implementerName: string; // 实施人姓名
}

/**
 * 取消评审DTO
 */
export interface CancelReviewDTO {
  reviewId: string; // 评审单ID
  cancelReason: string; // 取消原因
}

/**
 * MRB评审状态映射
 */
export const MRB_STATUS_MAP: Record<MRBStatus, { label: string; color: string; bg: string; border: string }> = {
  PENDING: { label: '待评审', color: '#faad14', bg: '#fffbe6', border: '#ffe58f' },
  UNDER_REVIEW: { label: '评审中', color: '#1890ff', bg: '#e6f7ff', border: '#91d5ff' },
  COMPLETED: { label: '已完成', color: '#722ed1', bg: '#f9f0ff', border: '#d3adf7' },
  IMPLEMENTED: { label: '已实施', color: '#52c41a', bg: '#f6ffed', border: '#b7eb8f' },
  CANCELLED: { label: '已取消', color: '#bfbfbf', bg: '#f5f5f5', border: '#d9d9d9' },
};

/**
 * 评审类型映射
 */
export const MRB_REVIEW_TYPE_MAP: Record<MRBReviewType, { label: string; color: string; icon: string }> = {
  QUALITY: { label: '质量评审', color: '#1890ff', icon: '🔍' },
  TECHNICAL: { label: '技术评审', color: '#faad14', icon: '⚙️' },
  JOINT: { label: '联合评审', color: '#722ed1', icon: '🤝' },
};

/**
 * 评审结果映射
 */
export const MRB_REVIEW_RESULT_MAP: Record<MRBReviewResult, { label: string; color: string; icon: string }> = {
  ACCEPT: { label: '接受', color: '#52c41a', icon: '✅' },
  REWORK: { label: '返工', color: '#faad14', icon: '🔄' },
  SCRAP: { label: '报废', color: '#ff4d4f', icon: '🗑️' },
  RETURN: { label: '退货', color: '#ff7a45', icon: '📦' },
  CONCESSION: { label: '特采', color: '#13c2c2', icon: '⚠️' },
};

/**
 * MRB评审表格列配置
 */
export const MRB_COLUMNS = [
  { key: 'reviewNo', title: '评审单号', width: 150, align: 'center', fixed: 'left' },
  { key: 'reviewType', title: '评审类型', width: 120, align: 'center' },
  { key: 'status', title: '状态', width: 100, align: 'center' },
  { key: 'inspectionNo', title: '检验单号', width: 150, align: 'center' },
  { key: 'workOrderNo', title: '工单编号', width: 150, align: 'center' },
  { key: 'productCode', title: '产品编码', width: 120, align: 'center' },
  { key: 'productName', title: '产品名称', width: 200, align: 'center' },
  { key: 'batchNo', title: '批号', width: 120, align: 'center' },
  { key: 'defectQty', title: '不合格数量', width: 120, align: 'center' },
  { key: 'defectRate', title: '不合格率', width: 100, align: 'center' },
  { key: 'reviewResult', title: '评审结果', width: 100, align: 'center' },
  { key: 'requesterName', title: '申请人', width: 120, align: 'center' },
  { key: 'requesterDept', title: '申请部门', width: 150, align: 'center' },
  { key: 'meetingTime', title: '评审会议时间', width: 160, align: 'center' },
  { key: 'totalCost', title: '总成本', width: 120, align: 'center' },
  { key: 'requestTime', title: '申请时间', width: 160, align: 'center' },
  { key: 'completionTime', title: '完成时间', width: 160, align: 'center' },
  { key: 'action', title: '操作', width: 250, align: 'center', fixed: 'right' },
];

export default {
  MRB_STATUS_MAP,
  MRB_REVIEW_TYPE_MAP,
  MRB_REVIEW_RESULT_MAP,
  MRB_COLUMNS,
};
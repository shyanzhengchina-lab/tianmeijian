/**
 * 生产订单模块类型定义
 */

import type { PageQuery, PageResult } from '../../../../shared/api/requestTypes';

/**
 * 生产订单状态
 */
export type ProductionOrderStatus =
  | 'DRAFT'          // 草稿
  | 'PENDING'        // 待审核
  | 'APPROVED'       // 已审核
  | 'REJECTED'       // 已拒绝
  | 'IN_PRODUCTION'  // 生产中
  | 'COMPLETED'      // 已完成
  | 'CANCELLED';     // 已取消

/**
 * 订单类型
 */
export type ProductionOrderType =
  | 'NORMAL'         // 正常订单
  | 'URGENT'         // 紧急订单
  | 'SAMPLE'         // 试制订单
  | 'RUSH';         // 加急订单

/**
 * 优先级
 */
export type ProductionPriority =
  | 'HIGH'           // 高优先级
  | 'MEDIUM'         // 中优先级
  | 'LOW';           // 低优先级

/**
 * 生产订单接口
 */
export interface ProductionOrder {
  id: string;
  orderNo: string; // 订单编号
  orderType: ProductionOrderType; // 订单类型
  status: ProductionOrderStatus; // 订单状态
  priority: ProductionPriority; // 优先级

  // 客户信息
  customerId: string; // 客户ID
  customerCode: string; // 客户编码
  customerName: string; // 客户名称

  // 产品信息
  productId: string; // 产品ID
  productCode: string; // 产品编码
  productName: string; // 产品名称
  productSpec: string; // 产品规格
  version: string; // 版本号

  // 数量信息
  orderQty: number; // 订单数量
  productionQty: number; // 生产数量
  completedQty: number; // 完成数量
  qualifiedQty: number; // 合格数量
  unqualifiedQty: number; // 不合格数量
  progress: number; // 进度百分比

  // 时间信息
  orderDate: string; // 下单日期
  deliveryDate: string; // 交货日期
  planStartDate: string; // 计划开始日期
  planEndDate: string; // 计划结束日期
  actualStartDate: string | null; // 实际开始日期
  actualEndDate: string | null; // 实际结束日期

  // 价格信息
  unitPrice: number; // 单价
  totalPrice: number; // 总价
  currency: string; // 币种

  // 质量要求
  qualityRequirement: {
    qualityLevel: string; // 质量等级
    acceptanceCriteria: string; // 接收标准
    specialRequirements: string; // 特殊要求
  };

  // 包装要求
  packagingRequirement: {
    packagingType: string; // 包装类型
    packagingSpec: string; // 包装规格
    labelingRequirement: string; // 标签要求
  };

  // 工艺路线
  routingId: string; // 工艺路线ID
  routingName: string; // 工艺路线名称

  // 生产指令
  workOrders: Array<{
    workOrderNo: string; // 工单编号
    workOrderType: string; // 工单类型
    status: string; // 工单状态
    planQty: number; // 计划数量
    completedQty: number; // 完成数量
    startDate: string; // 开始日期
    endDate: string; // 结束日期
  }>;

  // 物料需求
  materialRequirements: Array<{
    materialId: string; // 物料ID
    materialCode: string; // 物料编码
    materialName: string; // 物料名称
    requiredQty: number; // 需求数量
    allocatedQty: number; // 已分配数量
    unit: string; // 单位
    safetyStock: number; // 安全库存
  }>;

  // 资源需求
  resourceRequirements: Array<{
    resourceId: string; // 资源ID
    resourceCode: string; // 资源编码
    resourceName: string; // 资源名称
    resourceType: string; // 资源类型
    requiredQty: number; // 需求数量
    allocatedQty: number; // 已分配数量
  }>;

  // 审核信息
  applicantId: string; // 申请人ID
  applicantName: string; // 申请人姓名
  applicantDept: string; // 申请人部门
  approverId: string | null; // 审批人ID
  approverName: string | null; // 审批人姓名
  approvalTime: string | null; // 审批时间
  approvalComment: string | null; // 审批意见

  // 变更记录
  changeHistory: Array<{
    changeId: string; // 变更ID
    changeType: string; // 变更类型
    changeContent: string; // 变更内容
    changeReason: string; // 变更原因
    changeTime: string; // 变更时间
    changeUser: string; // 变更人
  }>;

  // 附件信息
  attachments: Array<{
    attachmentId: string; // 附件ID
    fileName: string; // 文件名称
    fileType: string; // 文件类型
    fileSize: number; // 文件大小
    uploadTime: string; // 上传时间
    uploader: string; // 上传人
  }>;

  // 备注
  remark: string | null;

  // 系统信息
  createTime: string; // 创建时间
  updateTime: string; // 更新时间
  creatorId: string; // 创建人ID
  creatorName: string; // 创建人姓名
  factoryId: string; // 工厂ID
}

/**
 * 生产订单查询参数
 */
export interface ProductionOrderQuery extends PageQuery {
  orderNo?: string; // 订单编号
  orderType?: ProductionOrderType; // 订单类型
  status?: ProductionOrderStatus; // 状态
  priority?: ProductionPriority; // 优先级
  customerCode?: string; // 客户编码
  customerName?: string; // 客户名称
  productCode?: string; // 产品编码
  productName?: string; // 产品名称
  orderDateStart?: string; // 下单开始日期
  orderDateEnd?: string; // 下单结束日期
  deliveryDateStart?: string; // 交货开始日期
  deliveryDateEnd?: string; // 交货结束日期
  applicantId?: string; // 申请人ID
}

/**
 * 创建生产订单DTO
 */
export interface CreateProductionOrderDTO {
  customerId: string; // 客户ID
  productId: string; // 产品ID
  version: string; // 版本号
  orderQty: number; // 订单数量
  productionQty: number; // 生产数量
  orderType: ProductionOrderType; // 订单类型
  priority: ProductionPriority; // 优先级
  orderDate: string; // 下单日期
  deliveryDate: string; // 交货日期
  planStartDate: string; // 计划开始日期
  planEndDate: string; // 计划结束日期
  unitPrice: number; // 单价
  currency: string; // 币种
  routingId: string; // 工艺路线ID
  qualityRequirement?: {
    qualityLevel: string;
    acceptanceCriteria: string;
    specialRequirements: string;
  };
  packagingRequirement?: {
    packagingType: string;
    packagingSpec: string;
    labelingRequirement: string;
  };
  applicantId: string; // 申请人ID
  remark?: string; // 备注
}

/**
 * 更新生产订单DTO
 */
export interface UpdateProductionOrderDTO extends Partial<CreateProductionOrderDTO> {
  id: string; // 订单ID
}

/**
 * 提交审核DTO
 */
export interface SubmitForApprovalDTO {
  orderId: string; // 订单ID
  id?: string; // alias for orderId
  approverId: string; // 审批人ID
  auditor?: string; // alias for approverId
  comment?: string; // 审批意见
}

/**
 * 审核订单DTO
 */
export interface ApproveOrderDTO {
  orderId: string; // 订单ID
  id?: string; // alias for orderId
  approverId: string; // 审批人ID
  auditor?: string; // alias for approverId
  approvalResult: 'APPROVED' | 'REJECTED'; // 审批结果
  approvalComment: string; // 审批意见
}

/**
 * 开始生产DTO
 */
export interface StartProductionDTO {
  orderId: string; // 订单ID
  id?: string; // alias for orderId
  operatorId: string; // 操作员ID
  comment?: string; // 备注
}

/**
 * 完成订单DTO
 */
export interface CompleteOrderDTO {
  orderId: string; // 订单ID
  id?: string; // alias for orderId
  operatorId: string; // 操作员ID
  completionQty: number; // 完成数量
  qualifiedQty: number; // 合格数量
  unqualifiedQty: number; // 不合格数量
  comment?: string; // 备注
}

/**
 * 取消订单DTO
 */
export interface CancelOrderDTO {
  orderId: string; // 订单ID
  id?: string; // alias for orderId
  cancelReason: string; // 取消原因
  operatorId: string; // 操作员ID
}

/**
 * 订单变更DTO
 */
export interface ChangeOrderDTO {
  orderId: string; // 订单ID
  changeType: string; // 变更类型
  changeContent: string; // 变更内容
  changeReason: string; // 变更原因
  operatorId: string; // 操作员ID
}

/**
 * 生产订单状态映射
 */
export const PRODUCTION_ORDER_STATUS_MAP: Record<ProductionOrderStatus, { label: string; color: string; bg: string; border: string }> = {
  DRAFT: { label: '草稿', color: '#8c8c8c', bg: '#f5f5f5', border: '#d9d9d9' },
  PENDING: { label: '待审核', color: '#faad14', bg: '#fffbe6', border: '#ffe58f' },
  APPROVED: { label: '已审核', color: '#1890ff', bg: '#e6f7ff', border: '#91d5ff' },
  REJECTED: { label: '已拒绝', color: '#ff4d4f', bg: '#fff1f0', border: '#ffa39e' },
  IN_PRODUCTION: { label: '生产中', color: '#52c41a', bg: '#f6ffed', border: '#b7eb8f' },
  COMPLETED: { label: '已完成', color: '#722ed1', bg: '#f9f0ff', border: '#d3adf7' },
  CANCELLED: { label: '已取消', color: '#bfbfbf', bg: '#f5f5f5', border: '#d9d9d9' },
};

/**
 * 订单类型映射
 */
export const PRODUCTION_ORDER_TYPE_MAP: Record<ProductionOrderType, { label: string; color: string; icon: string }> = {
  NORMAL: { label: '正常订单', color: '#1890ff', icon: '📦' },
  URGENT: { label: '紧急订单', color: '#ff4d4f', icon: '🔥' },
  SAMPLE: { label: '试制订单', color: '#faad14', icon: '🧪' },
  RUSH: { label: '加急订单', color: '#ff7a45', icon: '⚡' },
};

/**
 * 优先级映射
 */
export const PRODUCTION_PRIORITY_MAP: Record<ProductionPriority, { label: string; color: string; icon: string }> = {
  HIGH: { label: '高', color: '#ff4d4f', icon: '🔴' },
  MEDIUM: { label: '中', color: '#faad14', icon: '🟡' },
  LOW: { label: '低', color: '#52c41a', icon: '🟢' },
};

/**
 * 生产订单表格列配置
 */
export const PRODUCTION_ORDER_COLUMNS = [
  { key: 'orderNo', title: '订单编号', width: 150, align: 'center', fixed: 'left' },
  { key: 'orderType', title: '订单类型', width: 120, align: 'center' },
  { key: 'status', title: '状态', width: 100, align: 'center' },
  { key: 'priority', title: '优先级', width: 80, align: 'center' },
  { key: 'customerCode', title: '客户编码', width: 120, align: 'center' },
  { key: 'customerName', title: '客户名称', width: 200, align: 'center' },
  { key: 'productCode', title: '产品编码', width: 120, align: 'center' },
  { key: 'productName', title: '产品名称', width: 200, align: 'center' },
  { key: 'productSpec', title: '产品规格', width: 150, align: 'center' },
  { key: 'version', title: '版本号', width: 100, align: 'center' },
  { key: 'orderQty', title: '订单数量', width: 100, align: 'center' },
  { key: 'productionQty', title: '生产数量', width: 100, align: 'center' },
  { key: 'completedQty', title: '完成数量', width: 100, align: 'center' },
  { key: 'progress', title: '进度', width: 120, align: 'center' },
  { key: 'orderDate', title: '下单日期', width: 120, align: 'center' },
  { key: 'deliveryDate', title: '交货日期', width: 120, align: 'center' },
  { key: 'planStartDate', title: '计划开始日期', width: 120, align: 'center' },
  { key: 'planEndDate', title: '计划结束日期', width: 120, align: 'center' },
  { key: 'applicantName', title: '申请人', width: 120, align: 'center' },
  { key: 'approverName', title: '审批人', width: 120, align: 'center' },
  { key: 'totalPrice', title: '总价', width: 120, align: 'right' },
  { key: 'action', title: '操作', width: 280, align: 'center', fixed: 'right' },
];

export default {
  PRODUCTION_ORDER_STATUS_MAP,
  PRODUCTION_ORDER_TYPE_MAP,
  PRODUCTION_PRIORITY_MAP,
  PRODUCTION_ORDER_COLUMNS,
};
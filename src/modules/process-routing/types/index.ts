/**
 * 工艺路径模块类型定义
 */

/**
 * 工艺路径实体
 */
export interface ProcessRouting {
  id: string;
  routingCode: string; // 工艺路径编码
  routingName: string; // 工艺路径名称
  materialId: string; // 物料ID
  materialCode: string; // 物料编码
  materialName: string; // 物料名称
  version: string; // 版本号
  status: 'DRAFT' | 'PUBLISHED' | 'OBSOLETE' | 'DISABLED'; // 状态
  effectiveDate: string; // 生效日期
  expiryDate: string; // 失效日期
  standardCycle: number; // 标准工时（分钟）
  standardCost: number; // 标准成本
  description: string; // 描述
  operations: RoutingOperation[]; // 包含的工序
  createdById: string;
  createdByName: string;
  createdAt: string;
  updatedById: string;
  updatedByName: string;
  updatedAt: string;
}

/**
 * 路由工序关联
 */
export interface RoutingOperation {
  id: string;
  routingId: string;
  operationId: string;
  operationCode: string;
  operationName: string;
  sequence: number; // 序号
  workCenterId: string;
  workCenterCode: string;
  workCenterName: string;
  standardTime: number; // 标准工时
  setupTime: number; // 准备时间
  unitCost: number; // 单位成本
  description: string;
}

/**
 * 查询条件
 */
export interface ProcessRoutingQuery {
  current?: number;
  pageSize?: number;
  routingCode?: string;
  routingName?: string;
  materialCode?: string;
  materialName?: string;
  status?: string;
  version?: string;
  effectiveDateStart?: string;
  effectiveDateEnd?: string;
}

/**
 * 创建DTO
 */
export interface CreateProcessRoutingDTO {
  routingCode: string;
  routingName: string;
  materialId: string;
  version: string;
  effectiveDate: string;
  expiryDate: string;
  standardCycle: number;
  standardCost: number;
  description: string;
  operations: Array<{
    operationId: string;
    sequence: number;
    workCenterId: string;
    standardTime: number;
    setupTime: number;
    unitCost: number;
    description: string;
  }>;
}

/**
 * 更新DTO
 */
export interface UpdateProcessRoutingDTO {
  id: string;
  routingName?: string;
  effectiveDate?: string;
  expiryDate?: string;
  standardCycle?: number;
  standardCost?: number;
  description?: string;
  operations?: Array<{
    id?: string;
    operationId: string;
    sequence: number;
    workCenterId: string;
    standardTime: number;
    setupTime: number;
    unitCost: number;
    description: string;
  }>;
}

/**
 * 批量操作DTO
 */
export interface ProcessRoutingBatchAction {
  action: 'delete' | 'publish' | 'obsolete' | 'enable' | 'disable';
  ids: string[];
  remark?: string;
}

/**
 * 复制DTO
 */
export interface CopyProcessRoutingDTO {
  sourceId: string;
  newRoutingCode: string;
  newRoutingName: string;
  version: string;
}

/**
 * 发布DTO
 */
export interface PublishProcessRoutingDTO {
  id: string;
  publishDate: string;
  publisher: string;
  remark?: string;
}

/**
 * 统计信息
 */
export interface ProcessRoutingStatistics {
  totalCount: number;
  draftCount: number;
  publishedCount: number;
  obsoleteCount: number;
  disabledCount: number;
  materialStats: Record<string, number>;
  avgCycleTime: number;
  avgCost: number;
}

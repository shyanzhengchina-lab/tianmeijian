/**
 * 领料管理模块API服务
 * 领料单管理的完整API对接实现
 */

import { BaseApiService } from '../../../../shared/api/baseApiService';

/**
 * 领料单查询DTO
 */
export interface MaterialIssuanceQueryDTO {
  issuanceNo?: string; // 领料单号
  workOrderNo?: string; // 工单号
  status?: string; // 状态：PENDING/APPROVED/ISSUED/COMPLETED/CANCELLED/REJECTED
  warehouseId?: string; // 仓库ID
  applicantId?: string; // 申请人ID
  startDate?: string; // 开始日期
  endDate?: string; // 结束日期
  currentPage?: number;
  pageSize?: number;
}

/**
 * 领料单操作DTO
 */
export interface MaterialIssuanceOperationDTO {
  issuanceId: string; // 领料单ID
  operatorId: string; // 操作员ID
  operatorName: string; // 操作员姓名
  operationType: 'APPROVE' | 'REJECT' | 'ISSUE' | 'COMPLETE' | 'CANCEL'; // 操作类型
  operationTime: string; // 操作时间
  remark?: string; // 备注
  actualQuantity?: number; // 实际数量（用于领料）
  batchNo?: string; // 批次号（用于领料）
}

/**
 * 退料DTO
 */
export interface ReturnMaterialDTO {
  issuanceId: string; // 领料单ID
  returnItems: Array<{
    issuanceDetailId: string; // 领料明细ID
    materialId: string; // 物料ID
    materialCode: string; // 物料编码
    materialName: string; // 物料名称
    returnQuantity: number; // 退料数量
    returnReason: string; // 退料原因
    warehouseId: string; // 仓库ID
    location?: string; // 库位
  }>;
  operatorId: string; // 操作员ID
  operatorName: string; // 操作员姓名
  returnTime: string; // 退料时间
  remark?: string; // 备注
}

/**
 * 领料单创建DTO
 */
export interface CreateIssuanceDTO {
  issuanceNo: string; // 领料单号
  workOrderId: string; // 工单ID
  workOrderNo: string; // 工单号
  applicantId: string; // 申请人ID
  applicantName: string; // 申请人姓名
  warehouseId: string; // 仓库ID
  expectedDate: string; // 预期日期
  items: Array<{
    materialId: string; // 物料ID
    materialCode: string; // 物料编码
    materialName: string; // 物料名称
    specification?: string; // 规格
    unitId: string; // 单位ID
    unitName: string; // 单位名称
    requiredQuantity: number; // 需求数量
    remark?: string; // 备注
  }>;
  remark?: string; // 备注
}

/**
 * 分页结果DTO
 */
export interface PaginatedResponse<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
  code: number;
  message: string;
}

/**
 * 领料管理模块API服务类
 * 继承基础API服务，实现领料管理相关的所有API调用
 */
export class MaterialIssuanceApiService extends BaseApiService {
  private readonly ISSUANCE_API = '/material-issuance';

  constructor() {
    super();
  }

  /**
   * 获取领料单列表
   */
  async getIssuances(query: MaterialIssuanceQueryDTO): Promise<PaginatedResponse<any>> {
    return await this.get<PaginatedResponse<any>>(`${this.ISSUANCE_API}/page`, query);
  }

  /**
   * 获取领料单详情
   */
  async getIssuanceById(id: string): Promise<any> {
    return await this.get<any>(`${this.ISSUANCE_API}/${id}`);
  }

  /**
   * 创建领料单
   */
  async createIssuance(data: CreateIssuanceDTO): Promise<any> {
    return await this.post<any>(`${this.ISSUANCE_API}`, data);
  }

  /**
   * 更新领料单
   */
  async updateIssuance(data: any): Promise<any> {
    return await this.put<any>(`${this.ISSUANCE_API}`, data);
  }

  /**
   * 删除领料单
   */
  async deleteIssuances(ids: string[]): Promise<any> {
    return await this.delete<any>(`${this.ISSUANCE_API}`, { data: ids });
  }

  /**
   * 审批领料单
   */
  async approveIssuance(data: MaterialIssuanceOperationDTO): Promise<any> {
    return await this.post<any>(`${this.ISSUANCE_API}/${data.issuanceId}/approve`, data);
  }

  /**
   * 拒绝领料单
   */
  async rejectIssuance(data: MaterialIssuanceOperationDTO): Promise<any> {
    return await this.post<any>(`${this.ISSUANCE_API}/${data.issuanceId}/reject`, data);
  }

  /**
   * 领料
   */
  async issueMaterial(data: MaterialIssuanceOperationDTO): Promise<any> {
    return await this.post<any>(`${this.ISSUANCE_API}/${data.issuanceId}/issue`, data);
  }

  /**
   * 完成领料
   */
  async completeIssuance(data: MaterialIssuanceOperationDTO): Promise<any> {
    return await this.post<any>(`${this.ISSUANCE_API}/${data.issuanceId}/complete`, data);
  }

  /**
   * 取消领料单
   */
  async cancelIssuance(data: MaterialIssuanceOperationDTO): Promise<any> {
    return await this.post<any>(`${this.ISSUANCE_API}/${data.issuanceId}/cancel`, data);
  }

  /**
   * 退料
   */
  async returnMaterial(data: ReturnMaterialDTO): Promise<any> {
    return await this.post<any>(`${this.ISSUANCE_API}/return`, data);
  }

  /**
   * 获取领料单明细
   */
  async getIssuanceDetails(issuanceId: string): Promise<any> {
    return await this.get<any>(`${this.ISSUANCE_API}/${issuanceId}/details`);
  }

  /**
   * 获取物料库存信息
   */
  async getMaterialStock(materialId: string, warehouseId: string): Promise<any> {
    return await this.get<any>(`${this.ISSUANCE_API}/material-stock`, {
      materialId,
      warehouseId
    });
  }

  /**
   * 获取仓库列表
   */
  async getWarehouses(): Promise<any> {
    return await this.get<any>(`${this.ISSUANCE_API}/warehouses`);
  }

  /**
   * 获取库位列表
   */
  async getLocations(warehouseId: string): Promise<any> {
    return await this.get<any>(`${this.ISSUANCE_API}/warehouses/${warehouseId}/locations`);
  }

  /**
   * 获取物料批次信息
   */
  async getMaterialBatches(materialId: string, warehouseId: string): Promise<any> {
    return await this.get<any>(`${this.ISSUANCE_API}/material-batches`, {
      materialId,
      warehouseId
    });
  }

  /**
   * 批量审批领料单
   */
  async batchApproveIssuances(issuanceIds: string[], operatorId: string): Promise<any> {
    return await this.post<any>(`${this.ISSUANCE_API}/batch-approve`, {
      issuanceIds,
      operatorId
    });
  }

  /**
   * 批量领料
   */
  async batchIssueMaterials(issuanceIds: string[], operatorId: string): Promise<any> {
    return await this.post<any>(`${this.ISSUANCE_API}/batch-issue`, {
      issuanceIds,
      operatorId
    });
  }

  /**
   * 获取领料单统计信息
   */
  async getIssuanceStats(query: any): Promise<any> {
    return await this.get<any>(`${this.ISSUANCE_API}/stats`, query);
  }

  /**
   * 获取物料消耗统计
   */
  async getMaterialConsumptionStats(query: any): Promise<any> {
    return await this.get<any>(`${this.ISSUANCE_API}/material-consumption-stats`, query);
  }

  /**
   * 导出领料单
   */
  async exportIssuance(issuanceId: string): Promise<any> {
    return await this.get<any>(`${this.ISSUANCE_API}/${issuanceId}/export`, { responseType: 'blob' });
  }

  /**
   * 打印领料单
   */
  async printIssuance(issuanceId: string): Promise<any> {
    return await this.get<any>(`${this.ISSUANCE_API}/${issuanceId}/print`);
  }

  /**
   * 获取领料单历史
   */
  async getIssuanceHistory(issuanceId: string): Promise<any> {
    return await this.get<any>(`${this.ISSUANCE_API}/${issuanceId}/history`);
  }

  /**
   * 获取操作日志
   */
  async getOperationLogs(issuanceId: string): Promise<any> {
    return await this.get<any>(`${this.ISSUANCE_API}/${issuanceId}/operation-logs`);
  }

  /**
   * 验证领料单是否可以审批
   */
  async validateForApproval(issuanceId: string): Promise<any> {
    return await this.get<any>(`${this.ISSUANCE_API}/${issuanceId}/validate/approval`);
  }

  /**
   * 验证领料单是否可以领料
   */
  async validateForIssuance(issuanceId: string): Promise<any> {
    return await this.get<any>(`${this.ISSUANCE_API}/${issuanceId}/validate/issuance`);
  }

  /**
   * 获取退料单列表
   */
  async getReturnList(query: any): Promise<any> {
    return await this.get<any>(`${this.ISSUANCE_API}/returns/page`, query);
  }

  /**
   * 获取退料单详情
   */
  async getReturnById(returnId: string): Promise<any> {
    return await this.get<any>(`${this.ISSUANCE_API}/returns/${returnId}`);
  }

  /**
   * 审批退料单
   */
  async approveReturn(returnId: string, operatorId: string): Promise<any> {
    return await this.post<any>(`${this.ISSUANCE_API}/returns/${returnId}/approve`, { operatorId });
  }

  /**
   * 拒绝退料单
   */
  async rejectReturn(returnId: string, operatorId: string, reason: string): Promise<any> {
    return await this.post<any>(`${this.ISSUANCE_API}/returns/${returnId}/reject`, {
      operatorId,
      reason
    });
  }

  /**
   * 获取物料库存预警
   */
  async getStockAlerts(warehouseId?: string): Promise<any> {
    return await this.get<any>(`${this.ISSUANCE_API}/stock-alerts`, { warehouseId });
  }
}

/**
 * 导出单例实例
 */
export const materialIssuanceApi = new MaterialIssuanceApiService();

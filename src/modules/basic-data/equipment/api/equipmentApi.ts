/**
 * 设备档案API服务
 */

import { apiClient } from '../../../../shared/api';
import type { ApiResponse, PageResult, PageQuery, BatchActionResult } from '../../../../shared/api/requestTypes';

/**
 * 设备实体
 */
export interface Equipment {
  id: string;
  code: string;
  name: string;
  model?: string;
  brand?: string;
  manufacturer?: string;
  serialNumber?: string;
  category?: string; // 设备分类
  type?: string; // 设备类型
  workCenterId?: string;
  workCenterName?: string;
  specification?: string;
  capacity?: number; // 产能
  purchaseDate?: string;
  warrantyExpiryDate?: string;
  status: 'running' | 'stopped' | 'maintenance' | 'scrapped';
  isBottleneck?: boolean; // 是否瓶颈设备
  oee?: number; // 设备综合效率
  availability?: number; // 可利用率
  performanceRate?: number; // 性能效率
  qualityRate?: number; // 质量指数
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  maintenanceCycle?: number; // 维护周期（天）
  responsiblePerson?: string; // 负责人
  location?: string; // 位置
  cost?: number; // 成本
  remark?: string;
  createUserId?: string;
  createTime?: string;
  updateTime?: string;
  createdAt?: string;
  updatedAt?: string;
  // EquipRecord-compatible alias fields
  equipCode?: string;
  equipName?: string;
  serialNo?: string;
  workshop?: string;
  workCenter?: string;
  installDate?: string;
  warrantyDate?: string;
  assetNo?: string;
  isSpecialProcess?: boolean;
  isValidationRequired?: boolean;
  precision?: string;
  lastMaintDate?: string;
  nextMaintDate?: string;
  lastCalibDate?: string;
  nextCalibDate?: string;
  oeeTarget?: number;
  currentOee?: number;
  activeCount?: number;
  idleCount?: number;
  faultCount?: number;
  avgOee?: number;
  [key: string]: any; // allow additional fields
}

/**
 * 设备分类
 */
export type EquipmentCategory = string;

/**
 * 设备类型
 */
export type EquipmentType = string;

/**
 * 设备查询参数
 */
export interface EquipmentQuery extends PageQuery {
  code?: string;
  name?: string;
  category?: string;
  type?: string;
  workCenterId?: string;
  status?: string;
  manufacturer?: string;
  brand?: string;
}

/**
 * 创建设备DTO
 */
export interface CreateEquipmentDTO {
  code: string;
  name: string;
  model?: string;
  brand?: string;
  manufacturer?: string;
  serialNumber?: string;
  category?: string;
  type?: string;
  workCenterId?: string;
  specification?: string;
  capacity?: number;
  purchaseDate?: string;
  warrantyExpiryDate?: string;
  status: string;
  isBottleneck?: boolean;
  maintenanceCycle?: number;
  responsiblePerson?: string;
  location?: string;
  cost?: number;
  remark?: string;
}

/**
 * 更新设备DTO
 */
export interface UpdateEquipmentDTO extends Partial<CreateEquipmentDTO> {
  id: string;
}

/**
 * 设备状态操作
 */
export interface EquipmentStatusAction {
  ids: string[];
  status: 'running' | 'stopped' | 'maintenance' | 'scrapped';
}

/**
 * 设备导入配置
 */
export interface EquipmentImportConfig {
  file: File;
  validate?: boolean;
  updateMode?: 'create' | 'update' | 'skip';
}

/**
 * 设备维护记录
 */
export interface MaintenanceRecord {
  id: string;
  equipmentId: string;
  equipmentName?: string;
  maintenanceType: 'preventive' | 'corrective' | 'predictive';
  startDate: string;
  endDate?: string;
  duration?: number;
  description?: string;
  cost?: number;
  responsiblePerson?: string;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  remark?: string;
  createTime?: string;
}

/**
 * 设备OEE数据
 */
export interface EquipmentOEE {
  equipmentId: string;
  equipmentName?: string;
  date: string;
  oee: number; // 综合设备效率
  availability: number; // 可利用率
  performanceRate: number; // 性能效率
  qualityRate: number; // 质量指数
  totalProduction: number; // 总产量
  goodProduction: number; // 合格产量
  plannedProductionTime: number; // 计划生产时间
  actualProductionTime: number; // 实际生产时间
  downtime: number; // 停机时间
}

/**
 * 设备API服务类
 */
class EquipmentApiService {
  private readonly baseUrl = '/equipment';

  /**
   * 获取设备列表（分页）
   */
  async getEquipments(query: EquipmentQuery): Promise<ApiResponse<PageResult<Equipment>>> {
    return apiClient.getPage(`${this.baseUrl}/list`, query);
  }

  /**
   * 获取所有设备（不分页）
   */
  async getAllEquipments(params?: Record<string, any>): Promise<ApiResponse<Equipment[]>> {
    return apiClient.get(`${this.baseUrl}/all`, params);
  }

  /**
   * 获取设备详情
   */
  async getEquipmentById(id: string): Promise<ApiResponse<Equipment>> {
    return apiClient.get(`${this.baseUrl}/${id}`);
  }

  /**
   * 创建设备
   */
  async createEquipment(data: CreateEquipmentDTO): Promise<ApiResponse<Equipment>> {
    return apiClient.post(`${this.baseUrl}/create`, data);
  }

  /**
   * 更新设备
   */
  async updateEquipment(data: UpdateEquipmentDTO): Promise<ApiResponse<Equipment>> {
    return apiClient.put(`${this.baseUrl}/update`, data);
  }

  /**
   * 删除设备
   */
  async deleteEquipment(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`${this.baseUrl}/${id}`);
  }

  /**
   * 批量删除设备
   */
  async deleteEquipments(ids: string[]): Promise<ApiResponse<BatchActionResult>> {
    return apiClient.post(`${this.baseUrl}/batch-delete`, { params: { ids } });
  }

  /**
   * 更新设备状态
   */
  async updateStatus(action: EquipmentStatusAction): Promise<ApiResponse<BatchActionResult>> {
    return apiClient.put(`${this.baseUrl}/status`, action);
  }

  /**
   * 批量启动设备
   */
  async batchStart(ids: string[]): Promise<ApiResponse<BatchActionResult>> {
    return this.updateStatus({
      ids,
      status: 'running',
    });
  }

  /**
   * 批量停止设备
   */
  async batchStop(ids: string[]): Promise<ApiResponse<BatchActionResult>> {
    return this.updateStatus({
      ids,
      status: 'stopped',
    });
  }

  /**
   * 批量设置维护状态
   */
  async batchSetMaintenance(ids: string[]): Promise<ApiResponse<BatchActionResult>> {
    return this.updateStatus({
      ids,
      status: 'maintenance',
    });
  }

  /**
   * 导入设备
   */
  async importEquipments(config: EquipmentImportConfig): Promise<ApiResponse<BatchActionResult>> {
    const formData = new FormData();
    formData.append('file', config.file);

    const params: Record<string, any> = {};
    if (config.validate) {
      params.validate = 'true';
    }
    if (config.updateMode) {
      params.updateMode = config.updateMode;
    }

    return apiClient.post(`${this.baseUrl}/import`, formData, { params });
  }

  /**
   * 导出设备
   */
  async exportEquipments(query: EquipmentQuery, fileName?: string): Promise<void> {
    return apiClient.export(`${this.baseUrl}/export`, {
      params: query,
      fileName: fileName || 'equipment',
      type: 'excel',
    });
  }

  /**
   * 验证设备编码唯一性
   */
  async checkCodeUnique(code: string, excludeId?: string): Promise<ApiResponse<{ unique: boolean }>> {
    return apiClient.get(`${this.baseUrl}/check-code`, {
      params: { code, excludeId },
    });
  }

  /**
   * 获取可用工作中心列表（用于设备中选择）
   */
  async getAvailableWorkCenters(): Promise<ApiResponse<any[]>> {
    return apiClient.get('/workcenter/all');
  }

  /**
   * 获取设备统计信息
   */
  async getStatistics(): Promise<ApiResponse<{
    totalCount: number;
    runningCount: number;
    stoppedCount: number;
    maintenanceCount: number;
    scrappedCount: number;
    bottleneckCount: number;
    categoryCount: number;
    averageOEE: number;
  }>> {
    return apiClient.get(`${this.baseUrl}/statistics`);
  }

  /**
   * 获取设备维护记录
   */
  async getMaintenanceRecords(equipmentId: string): Promise<ApiResponse<MaintenanceRecord[]>> {
    return apiClient.get(`${this.baseUrl}/${equipmentId}/maintenance-records`);
  }

  /**
   * 创建维护记录
   */
  async createMaintenanceRecord(equipmentId: string, data: Partial<MaintenanceRecord>): Promise<ApiResponse<MaintenanceRecord>> {
    return apiClient.post(`${this.baseUrl}/${equipmentId}/maintenance-records`, data);
  }

  /**
   * 更新维护记录
   */
  async updateMaintenanceRecord(equipmentId: string, recordId: string, data: Partial<MaintenanceRecord>): Promise<ApiResponse<MaintenanceRecord>> {
    return apiClient.put(`${this.baseUrl}/${equipmentId}/maintenance-records/${recordId}`, data);
  }

  /**
   * 删除维护记录
   */
  async deleteMaintenanceRecord(equipmentId: string, recordId: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`${this.baseUrl}/${equipmentId}/maintenance-records/${recordId}`);
  }

  /**
   * 获取设备OEE数据
   */
  async getOEEData(equipmentId: string, startDate: string, endDate: string): Promise<ApiResponse<EquipmentOEE[]>> {
    return apiClient.get(`${this.baseUrl}/${equipmentId}/oee`, {
      params: { startDate, endDate },
    });
  }

  /**
   * 获取瓶颈设备列表
   */
  async getBottleneckEquipments(): Promise<ApiResponse<Equipment[]>> {
    return apiClient.get(`${this.baseUrl}/bottleneck`);
  }

  /**
   * 获取设备分类树
   */
  async getCategoryTree(): Promise<ApiResponse<Array<{
    id: string;
    name: string;
    children?: Array<{ id: string; name: string }>;
  }>>> {
    return apiClient.get(`${this.baseUrl}/category-tree`);
  }

  /**
   * 复制设备
   */
  async copyEquipment(id: string): Promise<ApiResponse<Equipment>> {
    return apiClient.post(`${this.baseUrl}/copy/${id}`);
  }

  /**
   * 批量更新工作中心
   */
  async batchUpdateWorkCenter(ids: string[], workCenterId: string): Promise<ApiResponse<BatchActionResult>> {
    return apiClient.put(`${this.baseUrl}/batch-update-workcenter`, { params: {
      ids,
      workCenterId,
    } });
  }

  /**
   * 获取待维护设备列表
   */
  async getPendingMaintenanceEquipments(): Promise<ApiResponse<Array<{
    equipmentId: string;
    equipmentName: string;
    nextMaintenanceDate: string;
    daysOverdue: number;
  }>>> {
    return apiClient.get(`${this.baseUrl}/pending-maintenance`);
  }

  /**
   * 设备停机/开机
   */
  async toggleEquipmentStatus(id: string, status: 'running' | 'stopped'): Promise<ApiResponse<void>> {
    return apiClient.put(`${this.baseUrl}/${id}/toggle-status`, { params: { status } });
  }

  /**
   * 搜索设备
   */
  async searchEquipments(keyword: string): Promise<ApiResponse<Equipment[]>> {
    return apiClient.get(`${this.baseUrl}/search`, { params: { keyword } });
  }
}

// 创建单例实例
export const equipmentApi = new EquipmentApiService();

export default equipmentApi;

// 导出类型和API

export { EquipmentApiService };

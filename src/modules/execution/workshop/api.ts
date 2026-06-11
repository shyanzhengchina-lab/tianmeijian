/**
 * 车间看板模块API服务
 * 完全兼容现有API接口，保持接口签名不变
 */
import { apiClient } from '../../../shared/api/apiClient';
import type { PageResult } from '../../../shared/api/requestTypes';
import type {
  WorkshopDashboard,
  WorkshopDashboardQuery,
  EquipmentStatus,
  OperationExecution,
  ProductionStatistics,
} from './types';

/**
 * 车间看板API服务类
 * 封装所有车间看板相关的API调用
 */
class WorkshopApiService {
  /**
   * 分页查询车间看板列表
   */
  async getWorkshopDashboards(query: WorkshopDashboardQuery): Promise<PageResult<WorkshopDashboard>> {
    return await apiClient.get<PageResult<WorkshopDashboard>>(
      '/workshop/dashboard/page',
      { params: query }
    );
  }

  /**
   * 获取所有车间看板列表（不分页）
   */
  async getAllWorkshopDashboards(): Promise<WorkshopDashboard[]> {
    return await apiClient.get<WorkshopDashboard[]>('/workshop/dashboard/list');
  }

  /**
   * 根据ID获取车间看板详情
   */
  async getWorkshopDashboardById(id: string): Promise<WorkshopDashboard> {
    return await apiClient.get<WorkshopDashboard>(`/workshop/dashboard/${id}`);
  }

  /**
   * 根据工作中心获取车间看板
   */
  async getWorkshopDashboardByWorkcenter(workcenterId: string): Promise<WorkshopDashboard> {
    return await apiClient.get<WorkshopDashboard>('/workshop/dashboard/workcenter', {
      params: { workcenterId },
    });
  }

  /**
   * 获取车间实时数据（WebSocket推送或轮询）
   */
  async getWorkshopRealtimeData(workcenterId: string): Promise<{
    dashboard: WorkshopDashboard;
    equipmentStatuses: EquipmentStatus[];
    operationExecutions: OperationExecution[];
  }> {
    const response = await apiClient.get<{
      dashboard: WorkshopDashboard;
      equipmentStatuses: EquipmentStatus[];
      operationExecutions: OperationExecution[];
    }>(`/workshop/realtime/${workcenterId}`);
    return (response as any).data;
  }

  /**
   * 获取设备运行状态列表
   */
  async getEquipmentStatuses(workcenterId?: string): Promise<EquipmentStatus[]> {
    return await apiClient.get<EquipmentStatus[]>('/workshop/equipment-status', {
      params: { workcenterId },
    });
  }

  /**
   * 获取单个设备运行状态
   */
  async getEquipmentStatusById(equipmentId: string): Promise<EquipmentStatus> {
    return await apiClient.get<EquipmentStatus>(`/workshop/equipment-status/${equipmentId}`);
  }

  /**
   * 获取工序执行状态列表
   */
  async getOperationExecutions(workcenterId?: string, status?: string): Promise<OperationExecution[]> {
    return await apiClient.get<OperationExecution[]>('/workshop/operation-execution', {
      params: { workcenterId, status },
    });
  }

  /**
   * 获取单个工序执行状态
   */
  async getOperationExecutionById(id: string): Promise<OperationExecution> {
    return await apiClient.get<OperationExecution>(`/workshop/operation-execution/${id}`);
  }

  /**
   * 暂停工序执行
   */
  async pauseOperationExecution(id: string, reason?: string): Promise<void> {
    await apiClient.put<void>(`/workshop/operation-execution/${id}/pause`, { reason });
  }

  /**
   * 恢复工序执行
   */
  async resumeOperationExecution(id: string): Promise<void> {
    await apiClient.put<void>(`/workshop/operation-execution/${id}/resume`);
  }

  /**
   * 获取生产实绩统计
   */
  async getProductionStatistics(workcenterId: string, date: string): Promise<ProductionStatistics> {
    return await apiClient.get<ProductionStatistics>('/workshop/production-statistics', {
      params: { workcenterId, date },
    });
  }

  /**
   * 获取生产实绩统计列表
   */
  async getProductionStatisticsList(workcenterId: string, dateStart?: string, dateEnd?: string): Promise<ProductionStatistics[]> {
    return await apiClient.get<ProductionStatistics[]>('/workshop/production-statistics/list', {
      params: { workcenterId, dateStart, dateEnd },
    });
  }

  /**
   * 获取设备告警列表
   */
  async getEquipmentAlarms(equipmentId?: string, workcenterId?: string, acknowledged?: boolean): Promise<any[]> {
    return await apiClient.get<any[]>('/workshop/equipment-alarms', {
      params: { equipmentId, workcenterId, acknowledged },
    });
  }

  /**
   * 确认设备告警
   */
  async acknowledgeAlarm(alarmId: string, acknowledgedBy: string): Promise<void> {
    await apiClient.put<void>(`/workshop/equipment-alarms/${alarmId}/acknowledge`, {
      acknowledgedBy,
    });
  }

  /**
   * 批量确认设备告警
   */
  async acknowledgeAlarms(alarmIds: string[], acknowledgedBy: string): Promise<void> {
    await apiClient.put<void>('/workshop/equipment-alarms/batch-acknowledge', {
      alarmIds,
      acknowledgedBy,
    });
  }

  /**
   * 获取车间产能分析
   */
  async getCapacityAnalysis(workcenterId: string, startDate: string, endDate: string): Promise<{
    date: string;
    planQty: number;
    actualQty: number;
    qualifiedQty: number;
    efficiency: number;
    utilization: number;
  }[]> {
    const response = await apiClient.get<{
      date: string;
      planQty: number;
      actualQty: number;
      qualifiedQty: number;
      efficiency: number;
      utilization: number;
    }[]>('/workshop/capacity-analysis', {
      params: { workcenterId, startDate, endDate },
    });
    return (response as any).data;
  }

  /**
   * 获取工作中心汇总
   */
  async getWorkcenterSummary(): Promise<{
    totalWorkcenters: number;
    activeWorkcenters: number;
    maintenanceWorkcenters: number;
    stoppedWorkcenters: number;
    totalOrders: number;
    inProgressOrders: number;
    todayActualQty: number;
    todayPlanQty: number;
    todayQualifiedRate: number;
  }> {
    const response = await apiClient.get<{
      totalWorkcenters: number;
      activeWorkcenters: number;
      maintenanceWorkcenters: number;
      stoppedWorkcenters: number;
      totalOrders: number;
      inProgressOrders: number;
      todayActualQty: number;
      todayPlanQty: number;
      todayQualifiedRate: number;
    }>('/workshop/summary');
    return (response as any).data;
  }

  /**
   * 获取车间热力图数据
   */
  async getWorkshopHeatmap(workshopId: string): Promise<{
    workcenterId: string;
    workcenterName: string;
    status: string;
    utilization: number;
    orders: number;
    operators: number;
    equipment: number;
  }[]> {
    const response = await apiClient.get<{
      workcenterId: string;
      workcenterName: string;
      status: string;
      utilization: number;
      orders: number;
      operators: number;
      equipment: number;
    }[]>(`/workshop/heatmap/${workshopId}`);
    return (response as any).data;
  }

  /**
   * 获取实时生产进度
   */
  async getRealtimeProgress(workcenterId: string): Promise<{
    taskId: string;
    taskNo: string;
    productName: string;
    stepName: string;
    operator: string;
    equipment: string;
    progress: number;
    planQty: number;
    actualQty: number;
    estimatedTime: string;
  }[]> {
    const response = await apiClient.get<{
      taskId: string;
      taskNo: string;
      productName: string;
      stepName: string;
      operator: string;
      equipment: string;
      progress: number;
      planQty: number;
      actualQty: number;
      estimatedTime: string;
    }[]>(`/workshop/realtime-progress/${workcenterId}`);
    return (response as any).data;
  }

  /**
   * 导出生产实绩统计
   */
  async exportProductionStatistics(workcenterId: string, dateStart: string, dateEnd: string): Promise<Blob> {
    return await apiClient.get<Blob>('/workshop/export-production-statistics', {
      params: { workcenterId, dateStart, dateEnd },
      responseType: 'blob',
    });
  }

  /**
   * 导出设备运行记录
   */
  async exportEquipmentRecord(equipmentId: string, dateStart: string, dateEnd: string): Promise<Blob> {
    return await apiClient.get<Blob>('/workshop/export-equipment-record', {
      params: { equipmentId, dateStart, dateEnd },
      responseType: 'blob',
    });
  }
}

// 导出API服务单例
export const workshopApi = new WorkshopApiService();

/**
 * 员工档案模块API服务
 * 完全兼容现有API接口，保持接口签名不变
 */
import { apiClient } from '../../../shared/api/apiClient';
import type { PageResult } from '../../../shared/api/requestTypes';
import type {
  Employee,
  EmployeeQuery,
  CreateEmployeeDTO,
  UpdateEmployeeDTO,
  EmployeeBatchAction,
} from './types';

/**
 * 员工API服务类
 * 封装所有员工相关的API调用
 */
class EmployeeApiService {
  /**
   * 分页查询员工列表
   */
  async getEmployees(query: EmployeeQuery): Promise<PageResult<Employee>> {
    return await apiClient.get<PageResult<Employee>>(
      '/employee/page',
      { params: query }
    );
  }

  /**
   * 获取所有员工列表（不分页）
   */
  async getAllEmployees(): Promise<Employee[]> {
    return await apiClient.get<Employee[]>('/employee/list');
  }

  /**
   * 根据ID获取员工详情
   */
  async getEmployeeById(id: string): Promise<Employee> {
    return await apiClient.get<Employee>(`/employee/${id}`);
  }

  /**
   * 根据工号获取员工
   */
  async getEmployeeByCode(code: string): Promise<Employee> {
    return await apiClient.get<Employee>('/employee/byCode', {
      params: { code },
    });
  }

  /**
   * 创建员工
   */
  async createEmployee(data: CreateEmployeeDTO): Promise<Employee> {
    return await apiClient.post<Employee>('/employee', data);
  }

  /**
   * 更新员工
   */
  async updateEmployee(data: UpdateEmployeeDTO): Promise<Employee> {
    return await apiClient.put<Employee>('/employee', data);
  }

  /**
   * 批量删除员工
   */
  async deleteEmployees(ids: string[]): Promise<void> {
    await apiClient.delete<void>('/employee', { data: ids });
  }

  /**
   * 批量操作员工
   */
  async batchEmployees(action: EmployeeBatchAction): Promise<void> {
    await apiClient.put<void>('/employee/batch', action);
  }

  /**
   * 请假员工
   */
  async leaveEmployee(id: string, leaveDate: string): Promise<void> {
    await apiClient.put<void>(`/employee/${id}/leave`, { leaveDate });
  }

  /**
   * 员工离职
   */
  async resignEmployee(id: string, resignDate: string): Promise<void> {
    await apiClient.put<void>(`/employee/${id}/resign`, { resignDate });
  }

  /**
   * 恢复员工
   */
  async activateEmployee(id: string): Promise<void> {
    await apiClient.put<void>(`/employee/${id}/activate`);
  }

  /**
   * 更新员工状态
   */
  async updateStatus(ids: string[], status: 'ACTIVE' | 'LEAVE' | 'RESIGNED'): Promise<void> {
    await apiClient.put<void>('/employee/status', { ids, status });
  }

  /**
   * 检查工号是否存在
   */
  async checkCodeExists(code: string, excludeId?: string): Promise<boolean> {
    return await apiClient.get<boolean>('/employee/checkCode', {
      params: { code, excludeId },
    });
  }

  /**
   * 获取员工统计信息
   */
  async getStatistics(): Promise<{
    totalCount: number;
    activeCount: number;
    leaveCount: number;
    resignedCount: number;
    roleStats: Record<string, number>;
    teamStats: Record<string, number>;
  }> {
    const response = await apiClient.get<{
      totalCount: number;
      activeCount: number;
      leaveCount: number;
      resignedCount: number;
      roleStats: Record<string, number>;
      teamStats: Record<string, number>;
    }>('/employee/statistics');
    return (response as any).data;
  }

  /**
   * 获取班组关联的员工
   */
  async getEmployeesByTeam(teamId: string): Promise<Employee[]> {
    return await apiClient.get<Employee[]>('/employee/byTeam', {
      params: { teamId },
    });
  }

  /**
   * 获取车间关联的员工
   */
  async getEmployeesByWorkshop(workshopCode: string): Promise<Employee[]> {
    return await apiClient.get<Employee[]>('/employee/byWorkshop', {
      params: { workshopCode },
    });
  }

  /**
   * 导入员工
   */
  async importEmployees(file: File): Promise<{ success: number; failed: number }> {
    const formData = new FormData();
    formData.append('file', file);

    return await apiClient.post<{ success: number; failed: number }>(
      '/employee/import',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
  }

  /**
   * 导出员工
   */
  async exportEmployees(query: EmployeeQuery): Promise<Blob> {
    return await apiClient.get<Blob>('/employee/export', {
      params: query,
      responseType: 'blob',
    });
  }

  /**
   * 获取员工技能分布
   */
  async getSkillDistribution(): Promise<Record<string, number>> {
    return await apiClient.get<Record<string, number>>('/employee/skillDistribution');
  }

  /**
   * 更新员工技能
   */
  async updateSkills(id: string, skills: string[]): Promise<void> {
    await apiClient.put<void>(`/employee/${id}/skills`, { skills });
  }

  /**
   * 更新员工证书
   */
  async updateCertifications(id: string, certifications: string[]): Promise<void> {
    await apiClient.put<void>(`/employee/${id}/certifications`, { certifications });
  }
}

// 导出API服务单例
export const employeeApi = new EmployeeApiService();

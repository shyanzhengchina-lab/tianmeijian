/**
 * 班组档案模块API服务
 * 完全兼容现有API接口，保持接口签名不变
 */
import { apiClient } from '../../../shared/api/apiClient';
import type { PageResult } from '../../../shared/api/requestTypes';
import type {
  Team,
  TeamQuery,
  CreateTeamDTO,
  UpdateTeamDTO,
  TeamBatchAction,
} from './types';

/**
 * 班组API服务类
 * 封装所有班组相关的API调用
 */
class TeamApiService {
  /**
   * 分页查询班组列表
   */
  async getTeams(query: TeamQuery): Promise<PageResult<Team>> {
    return await apiClient.get<PageResult<Team>>(
      '/team/page',
      { params: query }
    );
  }

  /**
   * 获取所有班组列表（不分页）
   */
  async getAllTeams(): Promise<Team[]> {
    return await apiClient.get<Team[]>('/team/list');
  }

  /**
   * 根据ID获取班组详情
   */
  async getTeamById(id: string): Promise<Team> {
    return await apiClient.get<Team>(`/team/${id}`);
  }

  /**
   * 创建班组
   */
  async createTeam(data: CreateTeamDTO): Promise<Team> {
    return await apiClient.post<Team>('/team', data);
  }

  /**
   * 更新班组
   */
  async updateTeam(data: UpdateTeamDTO): Promise<Team> {
    return await apiClient.put<Team>('/team', data);
  }

  /**
   * 批量删除班组
   */
  async deleteTeams(ids: string[]): Promise<void> {
    await apiClient.delete<void>('/team', { data: ids });
  }

  /**
   * 批量操作班组
   */
  async batchTeams(action: TeamBatchAction): Promise<void> {
    await apiClient.put<void>('/team/batch', action);
  }

  /**
   * 更新班组状态
   */
  async updateStatus(ids: string[], status: 'ACTIVE' | 'DISABLED'): Promise<void> {
    await apiClient.put<void>('/team/status', { ids, status });
  }

  /**
   * 更新班组负责人
   */
  async updateLeader(id: string, leader: string): Promise<void> {
    await apiClient.put<void>(`/team/${id}/leader`, { leader });
  }

  /**
   * 获取班组统计信息
   */
  async getStatistics(): Promise<{
    totalCount: number;
    activeCount: number;
    disabledCount: number;
    workCenterStats: Record<string, number>;
    workshopStats: Record<string, number>;
  }> {
    const response = await apiClient.get<{
      totalCount: number;
      activeCount: number;
      disabledCount: number;
      workCenterStats: Record<string, number>;
      workshopStats: Record<string, number>;
    }>('/team/statistics');
    return (response as any).data;
  }

  /**
   * 导入班组
   */
  async importTeams(file: File): Promise<{ success: number; failed: number }> {
    const formData = new FormData();
    formData.append('file', file);

    return await apiClient.post<{ success: number; failed: number }>(
      '/team/import',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
  }

  /**
   * 导出班组
   */
  async exportTeams(query: TeamQuery): Promise<Blob> {
    return await apiClient.get<Blob>('/team/export', {
      params: query,
      responseType: 'blob',
    });
  }

  /**
   * 获取班组KPI数据
   */
  async getKpiData(id: string): Promise<any> {
    return await apiClient.get<any>(`/team/${id}/kpi`);
  }
}

// 导出API服务单例
export const teamApi = new TeamApiService();

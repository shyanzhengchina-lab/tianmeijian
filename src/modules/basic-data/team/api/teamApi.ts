/**
 * 班组档案API服务
 */

import { apiClient } from '../../../../shared/api';
import type { ApiResponse, PageResult, PageQuery, BatchActionResult } from '../../../../shared/api/requestTypes';

/**
 * 班组实体
 */
export interface Team {
  id: string;
  code: string;
  name: string;
  type?: 'production' | 'quality' | 'maintenance' | 'other'; // 班组类型
  workCenterId?: string;
  workCenterName?: string;
  leaderId?: string;
  leaderName?: string;
  memberCount?: number;
  description?: string;
  status: 'active' | 'inactive';
  shift?: string; // 班次
  workingHours?: string; // 工作时间
  skillLevel?: 'basic' | 'intermediate' | 'advanced'; // 技能等级
  remark?: string;
  createUserId?: string;
  createTime?: string;
  updateTime?: string;
}

/**
 * 班组类型
 */
export type TeamType = 'production' | 'quality' | 'maintenance' | 'other';

/**
 * 班组查询参数
 */
export interface TeamQuery extends PageQuery {
  code?: string;
  name?: string;
  type?: string;
  workCenterId?: string;
  status?: string;
  leaderId?: string;
}

/**
 * 创建班组DTO
 */
export interface CreateTeamDTO {
  code: string;
  name: string;
  type?: string;
  workCenterId?: string;
  leaderId?: string;
  description?: string;
  status: string;
  shift?: string;
  workingHours?: string;
  skillLevel?: string;
  remark?: string;
}

/**
 * 更新班组DTO
 */
export interface UpdateTeamDTO extends Partial<CreateTeamDTO> {
  id: string;
}

/**
 * 班组状态操作
 */
export interface TeamStatusAction {
  ids: string[];
  status: 'active' | 'inactive';
}

/**
 * 班组导入配置
 */
export interface TeamImportConfig {
  file: File;
  validate?: boolean;
  updateMode?: 'create' | 'update' | 'skip';
}

/**
 * 班组API服务类
 */
class TeamApiService {
  private readonly baseUrl = '/team';

  /**
   * 获取班组列表（分页）
   */
  async getTeams(query: TeamQuery): Promise<ApiResponse<PageResult<Team>>> {
    return apiClient.getPage(`${this.baseUrl}/list`, query);
  }

  /**
   * 获取所有班组（不分页）
   */
  async getAllTeams(params?: Record<string, any>): Promise<ApiResponse<Team[]>> {
    return apiClient.get(`${this.baseUrl}/all`, params);
  }

  /**
   * 获取班组详情
   */
  async getTeamById(id: string): Promise<ApiResponse<Team>> {
    return apiClient.get(`${this.baseUrl}/${id}`);
  }

  /**
   * 创建班组
   */
  async createTeam(data: CreateTeamDTO): Promise<ApiResponse<Team>> {
    return apiClient.post(`${this.baseUrl}/create`, data, {
      showSuccess: true,
      successText: '创建成功',
    });
  }

  /**
   * 更新班组
   */
  async updateTeam(data: UpdateTeamDTO): Promise<ApiResponse<Team>> {
    return apiClient.put(`${this.baseUrl}/update`, data, {
      showSuccess: true,
      successText: '更新成功',
    });
  }

  /**
   * 删除班组
   */
  async deleteTeam(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`${this.baseUrl}/${id}`, undefined, {
      showSuccess: true,
      successText: '删除成功',
    });
  }

  /**
   * 批量删除班组
   */
  async deleteTeams(ids: string[]): Promise<ApiResponse<BatchActionResult>> {
    return apiClient.post(`${this.baseUrl}/batch-delete`, { ids }, {
      showSuccess: true,
      successText: `成功删除${ids.length}条记录`,
    });
  }

  /**
   * 更新班组状态
   */
  async updateStatus(action: TeamStatusAction): Promise<ApiResponse<BatchActionResult>> {
    return apiClient.put(`${this.baseUrl}/status`, action, {
      showSuccess: true,
      successText: `成功更新${action.ids.length}条记录状态`,
    });
  }

  /**
   * 批量启用班组
   */
  async batchEnable(ids: string[]): Promise<ApiResponse<BatchActionResult>> {
    return this.updateStatus({
      ids,
      status: 'active',
    });
  }

  /**
   * 批量禁用班组
   */
  async batchDisable(ids: string[]): Promise<ApiResponse<BatchActionResult>> {
    return this.updateStatus({
      ids,
      status: 'inactive',
    });
  }

  /**
   * 导入班组
   */
  async importTeams(config: TeamImportConfig): Promise<ApiResponse<BatchActionResult>> {
    const formData = new FormData();
    formData.append('file', config.file);

    const requestConfig: Record<string, any> = {
      showSuccess: true,
      successText: '导入成功',
    };

    if (config.validate) {
      requestConfig.validate = 'true';
    }
    if (config.updateMode) {
      requestConfig.updateMode = config.updateMode;
    }

    return apiClient.post(`${this.baseUrl}/import`, formData, requestConfig);
  }

  /**
   * 导出班组
   */
  async exportTeams(query: TeamQuery, fileName?: string): Promise<void> {
    return apiClient.export(`${this.baseUrl}/export`, {
      params: query,
      fileName: fileName || 'team',
      type: 'excel',
    });
  }

  /**
   * 验证班组编码唯一性
   */
  async checkCodeUnique(code: string, excludeId?: string): Promise<ApiResponse<{ unique: boolean }>> {
    return apiClient.get(`${this.baseUrl}/check-code`, { params: {
      code,
      excludeId,
    } });
  }

  /**
   * 获取可用工作中心列表（用于班组中选择）
   */
  async getAvailableWorkCenters(): Promise<ApiResponse<any[]>> {
    return apiClient.get('/workcenter/all');
  }

  /**
   * 获取可用员工列表（用于班组负责人中选择）
   */
  async getAvailableEmployees(): Promise<ApiResponse<any[]>> {
    return apiClient.get('/employee/all');
  }

  /**
   * 获取班组统计信息
   */
  async getStatistics(): Promise<ApiResponse<{
    totalCount: number;
    activeCount: number;
    inactiveCount: number;
    typeCount: number;
    totalMembers: number;
    averageMembers: number;
  }>> {
    return apiClient.get(`${this.baseUrl}/statistics`);
  }

  /**
   * 获取班组员工列表
   */
  async getTeamEmployees(teamId: string): Promise<ApiResponse<any[]>> {
    return apiClient.get(`${this.baseUrl}/${teamId}/employees`);
  }

  /**
   * 添加班组成员
   */
  async addTeamMember(teamId: string, employeeId: string): Promise<ApiResponse<void>> {
    return apiClient.post(`${this.baseUrl}/${teamId}/members`, { employeeId }, {
      showSuccess: true,
      successText: '添加成功',
    });
  }

  /**
   * 移除班组成员
   */
  async removeTeamMember(teamId: string, employeeId: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`${this.baseUrl}/${teamId}/members/${employeeId}`, undefined, {
      showSuccess: true,
      successText: '移除成功',
    });
  }

  /**
   * 更换班组负责人
   */
  async changeTeamLeader(teamId: string, leaderId: string): Promise<ApiResponse<void>> {
    return apiClient.put(`${this.baseUrl}/${teamId}/leader`, { leaderId }, {
      showSuccess: true,
      successText: '更换成功',
    });
  }

  /**
   * 获取班组类型统计
   */
  async getTypeStatistics(): Promise<ApiResponse<Array<{
    type: string;
    typeName: string;
    count: number;
  }>>> {
    return apiClient.get(`${this.baseUrl}/type-statistics`);
  }

  /**
   * 搜索班组
   */
  async searchTeams(keyword: string): Promise<ApiResponse<Team[]>> {
    return apiClient.get(`${this.baseUrl}/search`, { params: { keyword } });
  }
}

// 创建单例实例
export const teamApi = new TeamApiService();

export default teamApi;

// 导出类型和API

export { TeamApiService };

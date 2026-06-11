/**
 * 员工档案API服务
 */

import { apiClient } from '../../../../shared/api';
import type { ApiResponse, PageResult, PageQuery, BatchActionResult } from '../../../../shared/api/requestTypes';

/**
 * 员工实体
 */
export interface Employee {
  id: string;
  code: string;
  name: string;
  gender?: 'male' | 'female';
  idCard?: string;
  phone?: string;
  email?: string;
  departmentId?: string;
  departmentName?: string;
  teamId?: string;
  teamName?: string;
  position?: string; // 职位
  skillLevel?: 'basic' | 'intermediate' | 'advanced' | 'expert'; // 技能等级
  workCenterId?: string;
  workCenterName?: string;
  hireDate?: string; // 入职日期
  status: 'active' | 'inactive' | 'resigned';
  address?: string;
  remark?: string;
  createUserId?: string;
  createTime?: string;
  updateTime?: string;
}

/**
 * 性别
 */
export type Gender = 'male' | 'female';

/**
 * 员工查询参数
 */
export interface EmployeeQuery extends PageQuery {
  code?: string;
  name?: string;
  gender?: string;
  departmentId?: string;
  teamId?: string;
  workCenterId?: string;
  position?: string;
  status?: string;
  skillLevel?: string;
}

/**
 * 创建员工DTO
 */
export interface CreateEmployeeDTO {
  code: string;
  name: string;
  gender?: string;
  idCard?: string;
  phone?: string;
  email?: string;
  departmentId?: string;
  teamId?: string;
  position?: string;
  skillLevel?: string;
  workCenterId?: string;
  hireDate?: string;
  status: string;
  address?: string;
  remark?: string;
}

/**
 * 更新员工DTO
 */
export interface UpdateEmployeeDTO extends Partial<CreateEmployeeDTO> {
  id: string;
}

/**
 * 员工状态操作
 */
export interface EmployeeStatusAction {
  ids: string[];
  status: 'active' | 'inactive' | 'resigned';
}

/**
 * 员工导入配置
 */
export interface EmployeeImportConfig {
  file: File;
  validate?: boolean;
  updateMode?: 'create' | 'update' | 'skip';
}

/**
 * 员工API服务类
 */
class EmployeeApiService {
  private readonly baseUrl = '/employee';

  /**
   * 获取员工列表（分页）
   */
  async getEmployees(query: EmployeeQuery): Promise<ApiResponse<PageResult<Employee>>> {
    return apiClient.getPage(`${this.baseUrl}/list`, query);
  }

  /**
   * 获取所有员工（不分页）
   */
  async getAllEmployees(params?: Record<string, any>): Promise<ApiResponse<Employee[]>> {
    return apiClient.get(`${this.baseUrl}/all`, params);
  }

  /**
   * 获取员工详情
   */
  async getEmployeeById(id: string): Promise<ApiResponse<Employee>> {
    return apiClient.get(`${this.baseUrl}/${id}`);
  }

  /**
   * 创建员工
   */
  async createEmployee(data: CreateEmployeeDTO): Promise<ApiResponse<Employee>> {
    return apiClient.post(`${this.baseUrl}/create`, data, {
      showSuccess: true,
      successText: '创建成功',
    });
  }

  /**
   * 更新员工
   */
  async updateEmployee(data: UpdateEmployeeDTO): Promise<ApiResponse<Employee>> {
    return apiClient.put(`${this.baseUrl}/update`, data, {
      showSuccess: true,
      successText: '更新成功',
    });
  }

  /**
   * 删除员工
   */
  async deleteEmployee(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`${this.baseUrl}/${id}`, { params: {
      showSuccess: true,
      successText: '删除成功',
    } });
  }

  /**
   * 批量删除员工
   */
  async deleteEmployees(ids: string[]): Promise<ApiResponse<BatchActionResult>> {
    return apiClient.post(`${this.baseUrl}/batch-delete`, { ids }, {
      showSuccess: true,
      successText: `成功删除${ids.length}条记录`,
    });
  }

  /**
   * 更新员工状态
   */
  async updateStatus(action: EmployeeStatusAction): Promise<ApiResponse<BatchActionResult>> {
    return apiClient.put(`${this.baseUrl}/status`, action, {
      showSuccess: true,
      successText: `成功更新${action.ids.length}条记录状态`,
    });
  }

  /**
   * 批量启用员工
   */
  async batchEnable(ids: string[]): Promise<ApiResponse<BatchActionResult>> {
    return this.updateStatus({
      ids,
      status: 'active',
    });
  }

  /**
   * 批量禁用员工
   */
  async batchDisable(ids: string[]): Promise<ApiResponse<BatchActionResult>> {
    return this.updateStatus({
      ids,
      status: 'inactive',
    });
  }

  /**
   * 导入员工
   */
  async importEmployees(config: EmployeeImportConfig): Promise<ApiResponse<BatchActionResult>> {
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
   * 导出员工
   */
  async exportEmployees(query: EmployeeQuery, fileName?: string): Promise<void> {
    return apiClient.export(`${this.baseUrl}/export`, {
      params: query,
      fileName: fileName || 'employee',
      type: 'excel',
    });
  }

  /**
   * 验证员工编码唯一性
   */
  async checkCodeUnique(code: string, excludeId?: string): Promise<ApiResponse<{ unique: boolean }>> {
    return apiClient.get(`${this.baseUrl}/check-code`, {
      params: {
        code,
        excludeId,
      },
    });
  }

  /**
   * 验证身份证唯一性
   */
  async checkIdCardUnique(idCard: string, excludeId?: string): Promise<ApiResponse<{ unique: boolean }>> {
    return apiClient.get(`${this.baseUrl}/check-idcard`, {
      params: {
        idCard,
        excludeId,
      },
    });
  }

  /**
   * 获取可用部门列表（用于员工中选择）
   */
  async getAvailableDepartments(): Promise<ApiResponse<any[]>> {
    return apiClient.get('/department/all');
  }

  /**
   * 获取可用班组列表（用于员工中选择）
   */
  async getAvailableTeams(): Promise<ApiResponse<any[]>> {
    return apiClient.get('/team/all');
  }

  /**
   * 获取可用工作中心列表（用于员工中选择）
   */
  async getAvailableWorkCenters(): Promise<ApiResponse<any[]>> {
    return apiClient.get('/workcenter/all');
  }

  /**
   * 获取员工统计信息
   */
  async getStatistics(): Promise<ApiResponse<{
    totalCount: number;
    activeCount: number;
    inactiveCount: number;
    resignedCount: number;
    maleCount: number;
    femaleCount: number;
    averageSkillLevel: number;
  }>> {
    return apiClient.get(`${this.baseUrl}/statistics`);
  }

  /**
   * 获取技能等级统计
   */
  async getSkillLevelStatistics(): Promise<ApiResponse<Array<{
    skillLevel: string;
    skillLevelName: string;
    count: number;
  }>>> {
    return apiClient.get(`${this.baseUrl}/skill-level-statistics`);
  }

  /**
   * 搜索员工
   */
  async searchEmployees(keyword: string): Promise<ApiResponse<Employee[]>> {
    return apiClient.get(`${this.baseUrl}/search`, {
      params: { keyword },
    });
  }
}

// 创建单例实例
export const employeeApi = new EmployeeApiService();

export default employeeApi;

// 导出API服务类
export { EmployeeApiService };

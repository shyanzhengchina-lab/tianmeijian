/**
 * 组织架构模块API服务
 * 组织节点管理的完整API对接实现
 */

import { BaseApiService } from '../../../../shared/api/baseApiService';
import type { PageResult } from '../../../../shared/api/requestTypes';
import type {
  OrgNode,
  OrgNodeQuery,
  CreateOrgNodeDTO,
  UpdateOrgNodeDTO,
  MoveOrgNodeDTO,
} from '../types';

/**
 * 组织树节点DTO
 */
export interface OrgTreeNode extends OrgNode {
  children?: OrgTreeNode[];
  key: string;
  title: string;
  isLeaf?: boolean;
}

/**
 * 组织统计DTO
 */
export interface OrgStatistics {
  totalNodes: number;
  companyCount: number;
  departmentCount: number;
  teamCount: number;
  activeNodes: number;
  inactiveNodes: number;
  totalEmployees: number;
  levelDistribution: Record<number, number>;
}

/**
 * 组织路径DTO
 */
export interface OrgPath {
  nodeId: string;
  nodeName: string;
  nodeType: string;
}

/**
 * 员工分配DTO
 */
export interface EmployeeAssignment {
  nodeId: string;
  employeeIds: string[];
}

/**
 * 分页结果DTO
 */
export interface PaginatedResponse<T> {
  list: T[];
  total: number;
  code: number;
  message: string;
}

/**
 * 组织架构模块API服务类
 * 继承基础API服务，实现组织架构管理的所有API调用
 */
export class OrganizationApiService extends BaseApiService {
  private readonly ORG_API = '/api/system/organization';

  constructor() {
    super();
  }

  /**
   * 获取组织节点列表（分页）
   */
  async getOrgNodes(query: OrgNodeQuery): Promise<PaginatedResponse<OrgNode>> {
    return await this.get<PaginatedResponse<OrgNode>>(
      `${this.ORG_API}/nodes`,
      query
    );
  }

  /**
   * 获取组织节点详情
   */
  async getOrgNodeById(id: string): Promise<OrgNode> {
    return await this.get<OrgNode>(`${this.ORG_API}/nodes/${id}`);
  }

  /**
   * 根据编码获取组织节点
   */
  async getOrgNodeByCode(code: string): Promise<OrgNode> {
    const response = await this.get<PaginatedResponse<OrgNode>>(
      `${this.ORG_API}/nodes/by-code`,
      { nodeCode: code, currentPage: 1, pageSize: 1 }
    );
    return response.list[0];
  }

  /**
   * 获取组织树（树形结构）
   */
  async getOrgTree(parentId?: string): Promise<OrgTreeNode[]> {
    const query = parentId ? { parentId } : {};
    const response = await this.get<PaginatedResponse<OrgNode>>(
      `${this.ORG_API}/tree`,
      query as any
    );
    return this.buildOrgTree(response.list);
  }

  /**
   * 获取组织子节点
   */
  async getOrgChildNodes(parentId: string): Promise<OrgNode[]> {
    const response = await this.get<PaginatedResponse<OrgNode>>(
      `${this.ORG_API}/nodes/${parentId}/children`,
      { currentPage: 1, pageSize: 100 }
    );
    return response.list;
  }

  /**
   * 创建组织节点
   */
  async createOrgNode(data: CreateOrgNodeDTO): Promise<OrgNode> {
    return await this.post<OrgNode>(`${this.ORG_API}/nodes`, data);
  }

  /**
   * 更新组织节点
   */
  async updateOrgNode(data: UpdateOrgNodeDTO): Promise<OrgNode> {
    return await this.put<OrgNode>(`${this.ORG_API}/nodes/${data.id}`, data);
  }

  /**
   * 删除组织节点
   */
  async deleteOrgNodes(ids: string[]): Promise<void> {
    return await this.delete<void>(`${this.ORG_API}/nodes`, { ids });
  }

  /**
   * 移动组织节点
   */
  async moveOrgNode(data: MoveOrgNodeDTO): Promise<void> {
    return await this.post<void>(`${this.ORG_API}/nodes/move`, data);
  }

  /**
   * 批量移动组织节点
   */
  async batchMoveOrgNodes(moves: MoveOrgNodeDTO[]): Promise<void> {
    return await this.post<void>(`${this.ORG_API}/nodes/batch-move`, { moves });
  }

  /**
   * 更新组织节点状态
   */
  async updateOrgNodeStatus(ids: string[], status: 'ACTIVE' | 'INACTIVE'): Promise<void> {
    return await this.post<void>(`${this.ORG_API}/nodes/status`, { ids, status });
  }

  /**
   * 检查节点编码是否存在
   */
  async checkNodeCodeExists(code: string, excludeId?: string): Promise<boolean> {
    const query: any = { nodeCode: code };
    if (excludeId) query.excludeId = excludeId;
    const response = await this.get<{ exists: boolean }>(`${this.ORG_API}/nodes/check-code`, query as any);
    return response.exists;
  }

  /**
   * 获取组织统计信息
   */
  async getOrgStatistics(): Promise<OrgStatistics> {
    return await this.get<OrgStatistics>(`${this.ORG_API}/statistics`);
  }

  /**
   * 获取组织路径
   */
  async getOrgPath(nodeId: string): Promise<OrgPath[]> {
    return await this.get<OrgPath[]>(`${this.ORG_API}/nodes/${nodeId}/path`);
  }

  /**
   * 获取组织节点员工
   */
  async getOrgNodeEmployees(nodeId: string): Promise<any[]> {
    const response = await this.get<PaginatedResponse<any>>(
      `${this.ORG_API}/nodes/${nodeId}/employees`,
      { currentPage: 1, pageSize: 100 }
    );
    return response.list;
  }

  /**
   * 分配员工到组织节点
   */
  async assignEmployeesToNode(data: EmployeeAssignment): Promise<void> {
    return await this.post<void>(`${this.ORG_API}/nodes/${data.nodeId}/employees`, data);
  }

  /**
   * 从组织节点移除员工
   */
  async removeEmployeesFromNode(nodeId: string, employeeIds: string[]): Promise<void> {
    return await this.delete<void>(`${this.ORG_API}/nodes/${nodeId}/employees`, { employeeIds });
  }

  /**
   * 批量更新组织节点
   */
  async batchUpdateOrgNodes(updates: UpdateOrgNodeDTO[]): Promise<void> {
    return await this.post<void>(`${this.ORG_API}/nodes/batch-update`, { updates });
  }

  /**
   * 批量删除组织节点
   */
  async batchDeleteOrgNodes(ids: string[]): Promise<void> {
    return await this.delete<void>(`${this.ORG_API}/nodes/batch`, { ids });
  }

  /**
   * 导出组织架构数据
   */
  async exportOrgData(format: 'excel' | 'csv' = 'excel', nodeId?: string): Promise<any> {
    const url = nodeId ? `${this.ORG_API}/export/${nodeId}` : `${this.ORG_API}/export`;
    return await this.get<any>(url);
  }

  /**
   * 导入组织架构数据
   */
  async importOrgData(file: File): Promise<{ success: number; failed: number; errors: string[] }> {
    return await this.uploadFile<{ success: number; failed: number; errors: string[] }>(
      `${this.ORG_API}/import`,
      file
    );
  }

  /**
   * 获取组织架构日志
   */
  async getOrgLogs(nodeId: string, page?: number, pageSize?: number): Promise<PaginatedResponse<any>> {
    return await this.get<PaginatedResponse<any>>(
      `${this.ORG_API}/nodes/${nodeId}/logs`,
      { currentPage: page || 1, pageSize: pageSize || 20 }
    );
  }

  /**
   * 获取同级组织节点
   */
  async getSiblings(nodeId: string): Promise<OrgNode[]> {
    const response = await this.get<PaginatedResponse<OrgNode>>(
      `${this.ORG_API}/nodes/${nodeId}/siblings`,
      { currentPage: 1, pageSize: 100 }
    );
    return response.list;
  }

  /**
   * 获取组织节点层级
   */
  async getOrgLevels(): Promise<number[]> {
    return await this.get<number[]>(`${this.ORG_API}/levels`);
  }

  /**
   * 根据层级获取组织节点
   */
  async getOrgNodesByLevel(level: number): Promise<OrgNode[]> {
    const response = await this.get<PaginatedResponse<OrgNode>>(
      `${this.ORG_API}/nodes/level/${level}`,
      { currentPage: 1, pageSize: 100 }
    );
    return response.list;
  }

  /**
   * 获取可用的父节点（用于移动节点）
   */
  async getAvailableParentNodes(nodeId: string, nodeType: string): Promise<OrgNode[]> {
    const response = await this.get<PaginatedResponse<OrgNode>>(
      `${this.ORG_API}/nodes/${nodeId}/available-parents`,
      { nodeType, currentPage: 1, pageSize: 100 }
    );
    return response.list;
  }

  /**
   * 同步组织架构到ERP
   */
  async syncOrgToERP(nodeId?: string): Promise<void> {
    const url = nodeId ? `${this.ORG_API}/nodes/${nodeId}/sync-erp` : `${this.ORG_API}/sync-erp`;
    return await this.post<void>(url, {});
  }

  /**
   * 获取组织架构模板
   */
  async getOrgTemplate(): Promise<any> {
    return await this.get<any>(`${this.ORG_API}/template`);
  }

  /**
   * 从模板创建组织架构
   */
  async createOrgFromTemplate(templateId: string, data: any): Promise<OrgNode[]> {
    return await this.post<OrgNode[]>(`${this.ORG_API}/from-template/${templateId}`, data);
  }

  /**
   * 获取组织权限配置
   */
  async getOrgPermissionConfig(nodeId: string): Promise<any> {
    return await this.get<any>(`${this.ORG_API}/nodes/${nodeId}/permission-config`);
  }

  /**
   * 更新组织权限配置
   */
  async updateOrgPermissionConfig(nodeId: string, config: any): Promise<void> {
    return await this.put<void>(`${this.ORG_API}/nodes/${nodeId}/permission-config`, config);
  }

  /**
   * 获取组织数据范围
   */
  async getOrgDataScope(nodeId: string): Promise<any> {
    return await this.get<any>(`${this.ORG_API}/nodes/${nodeId}/data-scope`);
  }

  /**
   * 更新组织数据范围
   */
  async updateOrgDataScope(nodeId: string, dataScope: any): Promise<void> {
    return await this.put<void>(`${this.ORG_API}/nodes/${nodeId}/data-scope`, dataScope);
  }

  /**
   * 获取组织节点负责人
   */
  async getOrgNodeLeaders(nodeId: string): Promise<any[]> {
    return await this.get<any[]>(`${this.ORG_API}/nodes/${nodeId}/leaders`);
  }

  /**
   * 设置组织节点负责人
   */
  async setOrgNodeLeader(nodeId: string, leaderId: string, leaderType: 'leader' | 'deputy'): Promise<void> {
    return await this.post<void>(`${this.ORG_API}/nodes/${nodeId}/leader`, {
      leaderId,
      leaderType,
    });
  }

  /**
   * 获取组织节点下属
   */
  async getOrgNodeSubordinates(leaderId: string): Promise<OrgNode[]> {
    const response = await this.get<PaginatedResponse<OrgNode>>(
      `${this.ORG_API}/leaders/${leaderId}/subordinates`,
      { currentPage: 1, pageSize: 100 }
    );
    return response.list;
  }

  /**
   * 构建组织树（内部方法）
   */
  private buildOrgTree(nodes: OrgNode[]): OrgTreeNode[] {
    const nodeMap = new Map<string, OrgTreeNode>();
    const treeNodes: OrgTreeNode[] = [];

    // 首先创建所有节点
    nodes.forEach(node => {
      nodeMap.set(node.id, {
        ...node,
        key: node.id,
        title: node.nodeName,
        children: [],
      });
    });

    // 构建树形结构
    nodes.forEach(node => {
      const treeNode = nodeMap.get(node.id);
      if (!treeNode) return;

      if (node.parentId && nodeMap.has(node.parentId)) {
        const parent = nodeMap.get(node.parentId);
        if (parent) {
          parent.children!.push(treeNode);
        }
      } else {
        treeNodes.push(treeNode);
      }
    });

    return treeNodes;
  }
}

/**
 * 导出单例实例
 */
export const organizationApi = new OrganizationApiService();

/**
 * 向后兼容的导出
 */
export default organizationApi;

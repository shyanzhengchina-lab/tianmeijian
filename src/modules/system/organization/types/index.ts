/**
 * 组织架构模块类型定义
 */

import type { PageQuery, PageResult } from '../../../../shared/api/requestTypes';

/**
 * 组织节点类型
 */
export type OrgNodeType =
  | 'COMPANY'       // 公司
  | 'DEPARTMENT'    // 部门
  | 'TEAM';         // 班组

/**
 * 组织节点状态
 */
export type OrgNodeStatus =
  | 'ACTIVE'        // 生效
  | 'INACTIVE';     // 停用

/**
 * 组织节点接口
 */
export interface OrgNode {
  id: string;
  nodeCode: string; // 节点编码
  nodeName: string; // 节点名称
  nodeType: OrgNodeType; // 节点类型
  status: OrgNodeStatus; // 状态

  // 层级信息
  parentId: string | null; // 父节点ID
  parentName: string | null; // 父节点名称
  level: number; // 层级
  path: string; // 路径
  sort: number; // 排序

  // 责任人信息
  leaderId: string | null; // 负责人ID
  leaderName: string | null; // 负责人姓名
  deputyLeaderId: string | null; // 副负责人ID
  deputyLeaderName: string | null; // 副负责人姓名

  // 位置信息
  factoryId: string; // 工厂ID
  factoryName: string; // 工厂名称
  workshopId: string | null; // 车间ID
  workshopName: string | null; // 车间名称
  workCenterId: string | null; // 工作中心ID
  workCenterName: string | null; // 工作中心名称

  // 联系信息
  phone: string | null; // 电话
  email: string | null; // 邮箱
  address: string | null; // 地址

  // 描述信息
  description: string | null; // 描述
  remark: string | null; // 备注

  // 统计信息
  employeeCount: number; // 员工数量
  teamCount: number; // 班组数量
  departmentCount: number; // 部门数量

  // 系统信息
  createTime: string; // 创建时间
  updateTime: string; // 更新时间
  creatorId: string; // 创建人ID
  creatorName: string; // 创建人姓名
  updaterId: string | null; // 更新人ID
  updaterName: string | null; // 更新人姓名
}

/**
 * 组织架构查询参数
 */
export interface OrgNodeQuery extends PageQuery {
  nodeCode?: string; // 节点编码
  nodeName?: string; // 节点名称
  nodeType?: OrgNodeType; // 节点类型
  status?: OrgNodeStatus; // 状态
  parentId?: string; // 父节点ID
  level?: number; // 层级
  factoryId?: string; // 工厂ID
  workshopId?: string; // 车间ID
  workCenterId?: string; // 工作中心ID
  leaderId?: string; // 负责人ID
  startDate?: string; // 开始日期
  endDate?: string; // 结束日期
}

/**
 * 创建组织节点DTO
 */
export interface CreateOrgNodeDTO {
  nodeCode: string; // 节点编码
  nodeName: string; // 节点名称
  nodeType: OrgNodeType; // 节点类型
  parentId?: string; // 父节点ID
  sort: number; // 排序
  leaderId?: string; // 负责人ID
  deputyLeaderId?: string; // 副负责人ID
  factoryId: string; // 工厂ID
  workshopId?: string; // 车间ID
  workCenterId?: string; // 工作中心ID
  phone?: string; // 电话
  email?: string; // 邮箱
  address?: string; // 地址
  description?: string; // 描述
  remark?: string; // 备注
}

/**
 * 更新组织节点DTO
 */
export interface UpdateOrgNodeDTO extends Partial<CreateOrgNodeDTO> {
  id: string; // 组织节点ID
}

/**
 * 移动组织节点DTO
 */
export interface MoveOrgNodeDTO {
  nodeId: string; // 节点ID
  targetParentId: string | null; // 目标父节点ID
}

/**
 * 组织节点状态映射
 */
export const ORG_NODE_STATUS_MAP: Record<OrgNodeStatus, { label: string; color: string; bg: string; border: string }> = {
  ACTIVE: { label: '生效', color: '#52c41a', bg: '#f6ffed', border: '#b7eb8f' },
  INACTIVE: { label: '停用', color: '#bfbfbf', bg: '#f5f5f5', border: '#d9d9d9' },
};

/**
 * 组织节点类型映射
 */
export const ORG_NODE_TYPE_MAP: Record<OrgNodeType, { label: string; color: string; icon: string }> = {
  COMPANY: { label: '公司', color: '#1890ff', icon: '🏢' },
  DEPARTMENT: { label: '部门', color: '#52c41a', icon: '🏢' },
  TEAM: { label: '班组', color: '#faad14', icon: '👥' },
};

/**
 * 组织架构表格列配置
 */
export const ORG_NODE_COLUMNS = [
  { key: 'nodeCode', title: '节点编码', width: 150, align: 'center', fixed: 'left' },
  { key: 'nodeName', title: '节点名称', width: 200, align: 'center' },
  { key: 'nodeType', title: '节点类型', width: 120, align: 'center' },
  { key: 'status', title: '状态', width: 100, align: 'center' },
  { key: 'parentName', title: '父节点', width: 150, align: 'center' },
  { key: 'level', title: '层级', width: 80, align: 'center' },
  { key: 'sort', title: '排序', width: 80, align: 'center' },
  { key: 'leaderName', title: '负责人', width: 120, align: 'center' },
  { key: 'factoryName', title: '工厂', width: 150, align: 'center' },
  { key: 'workshopName', title: '车间', width: 150, align: 'center' },
  { key: 'workCenterName', title: '工作中心', width: 150, align: 'center' },
  { key: 'employeeCount', title: '员工数量', width: 100, align: 'center' },
  { key: 'teamCount', title: '班组数量', width: 100, align: 'center' },
  { key: 'departmentCount', title: '部门数量', width: 100, align: 'center' },
  { key: 'phone', title: '电话', width: 150, align: 'center' },
  { key: 'email', title: '邮箱', width: 200, align: 'center' },
  { key: 'creatorName', title: '创建人', width: 120, align: 'center' },
  { key: 'createTime', title: '创建时间', width: 160, align: 'center' },
  { key: 'action', title: '操作', width: 280, align: 'center', fixed: 'right' },
];

export default {
  ORG_NODE_STATUS_MAP,
  ORG_NODE_TYPE_MAP,
  ORG_NODE_COLUMNS,
};
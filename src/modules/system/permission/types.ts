/**
 * 系统权限模块类型定义
 * 保持与现有数据结构完全一致
 */
import type { PageQuery, PageResult } from '../../../shared/api/requestTypes';

// 权限类型
export type PermissionType = 'MENU' | 'BUTTON' | 'API';

// 权限状态
export type PermissionStatus = 'ACTIVE' | 'INACTIVE';

// 系统权限接口
export interface SystemPermission {
  id: string;
  permissionKey: string;     // 权限键
  permissionName: string;     // 权限名称
  permissionType: PermissionType; // 权限类型
  module: string;            // 所属模块
  description?: string;      // 描述
  status: PermissionStatus;  // 状态
  // 其他
  remark?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// 角色接口
export interface Role {
  id: string;
  roleCode: string;          // 角色编码
  roleName: string;          // 角色名称
  // 权限信息
  permissions: string[];     // 权限列表
  permissionCount: number;   // 权限数量
  // 状态信息
  status: PermissionStatus;
  description?: string;      // 描述
  // 其他
  remark?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// 用户角色关联接口
export interface UserRole {
  id: string;
  userId: string;           // 用户ID
  userName: string;         // 用户名
  roleId: string;           // 角色ID
  roleName: string;         // 角色名称
  // 时间信息
  assignDate: string;       // 分配日期
  expireDate?: string;      // 过期日期
  // 其他
  remark?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// 系统权限查询参数
export interface PermissionQuery extends PageQuery {
  permissionKey?: string;
  permissionName?: string;
  permissionType?: PermissionType;
  module?: string;
  status?: PermissionStatus;
}

// 角色查询参数
export interface RoleQuery extends PageQuery {
  roleCode?: string;
  roleName?: string;
  status?: PermissionStatus;
}

// 创建系统权限DTO
export interface CreatePermissionDTO {
  permissionKey: string;
  permissionName: string;
  permissionType: PermissionType;
  module: string;
  description?: string;
  remark?: string;
}

// 更新系统权限DTO
export interface UpdatePermissionDTO extends Partial<CreatePermissionDTO> {
  id: string;
}

// 创建角色DTO
export interface CreateRoleDTO {
  roleCode: string;
  roleName: string;
  permissions: string[];
  status?: PermissionStatus;
  description?: string;
  remark?: string;
}

// 更新角色DTO
export interface UpdateRoleDTO extends Partial<CreateRoleDTO> {
  id: string;
}

// 批量操作参数
export interface PermissionBatchAction {
  ids: string[];
  action: 'activate' | 'deactivate' | 'delete';
  params?: Record<string, any>;
}

// 权限类型映射
export const PERMISSION_TYPE_MAP: Record<PermissionType, { label: string; color: string; icon?: string }> = {
  'MENU':   { label: '菜单',   color: '#1677ff', icon: 'MenuOutlined' },
  'BUTTON': { label: '按钮',   color: '#52c41a', icon: 'ButtonOutlined' },
  'API':    { label: '接口',   color: '#faad14', icon: 'ApiOutlined' },
};

// 权限状态映射
export const PERMISSION_STATUS_MAP: Record<PermissionStatus, { label: string; color: string; badge: any }> = {
  'ACTIVE':   { label: '生效', color: '#52c41a', badge: 'success' },
  'INACTIVE': { label: '停用', color: '#d9d9d9', badge: 'default' },
};

// 默认系统权限数据
export const DEFAULT_PERMISSIONS: SystemPermission[] = [
  {
    id: 'PERM-001',
    permissionKey: 'material:view',
    permissionName: '查看物料',
    permissionType: 'MENU',
    module: 'BASIC_DATA',
    description: '允许查看物料信息',
    status: 'ACTIVE',
    createdBy: '系统管理员',
    createdAt: '2026-01-01 10:00:00',
    updatedAt: '2026-01-01 10:00:00',
  },
];

// 默认角色数据
export const DEFAULT_ROLES: Role[] = [
  {
    id: 'ROLE-001',
    roleCode: 'ADMIN',
    roleName: '管理员',
    permissions: ['*'],
    permissionCount: 999,
    status: 'ACTIVE',
    description: '系统管理员，拥有所有权限',
    createdBy: '系统管理员',
    createdAt: '2026-01-01 10:00:00',
    updatedAt: '2026-01-01 10:00:00',
  },
];

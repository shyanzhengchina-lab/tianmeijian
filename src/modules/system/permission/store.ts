/**
 * 系统权限模块Zustand Store
 * 管理系统权限的本地状态和API调用
 */
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { permissionApi } from './api';
import { DEFAULT_PERMISSIONS, DEFAULT_ROLES } from './types';
import type {
  SystemPermission,
  PermissionQuery,
  CreatePermissionDTO,
  UpdatePermissionDTO,
  PermissionBatchAction,
  Role,
  RoleQuery,
  CreateRoleDTO,
  UpdateRoleDTO,
  UserRole,
} from './types';
import type { PaginationState } from '../../../shared/types/common';

interface PermissionStore {
  // Permissions state
  permissions: SystemPermission[];
  selectedPermissionIds: string[];
  currentPermission: SystemPermission | null;
  permissionFilters: PermissionQuery;
  permissionPagination: PaginationState;
  permissionStatistics: any;

  // Roles state
  roles: Role[];
  selectedRoleIds: string[];
  currentRole: Role | null;
  roleFilters: RoleQuery;
  rolePagination: PaginationState;
  roleStatistics: any;

  // UserRoles state
  userRoles: UserRole[];
  selectedUserRoleIds: string[];
  currentUserRoles: UserRole[];

  // Common state
  loading: boolean;
  error: string | null;

  // Permission actions
  loadPermissions: (query?: PermissionQuery) => Promise<void>;
  loadAllPermissions: () => Promise<void>;
  loadPermissionStatistics: () => Promise<void>;
  createPermission: (data: CreatePermissionDTO) => Promise<void>;
  updatePermission: (data: UpdatePermissionDTO) => Promise<void>;
  batchPermissions: (action: PermissionBatchAction) => Promise<void>;
  activatePermission: (id: string) => Promise<void>;
  deactivatePermission: (id: string) => Promise<void>;

  // Role actions
  loadRoles: (query?: RoleQuery) => Promise<void>;
  loadAllRoles: () => Promise<void>;
  loadRoleStatistics: () => Promise<void>;
  createRole: (data: CreateRoleDTO) => Promise<void>;
  updateRole: (data: UpdateRoleDTO) => Promise<void>;
  batchRoles: (action: PermissionBatchAction) => Promise<void>;
  activateRole: (id: string) => Promise<void>;
  deactivateRole: (id: string) => Promise<void>;
  assignPermissionsToRole: (roleId: string, permissions: string[]) => Promise<void>;

  // UserRole actions
  getUserRoles: (userId: string) => Promise<UserRole[]>;
  assignRoleToUser: (userId: string, roleId: string, expireDate?: string) => Promise<void>;
  revokeUserRole: (userRoleId: string) => Promise<void>;

  // Permission checks
  checkUserPermission: (userId: string, permissionKey: string) => Promise<boolean>;
  getUserPermissions: (userId: string) => Promise<string[]>;

  // State setters
  setPermissionFilters: (filters: Partial<PermissionQuery>) => void;
  setSelectedPermissionIds: (ids: string[]) => void;
  setCurrentPermission: (permission: SystemPermission | null) => void;
  setPermissionPagination: (pagination: Partial<PaginationState>) => void;
  setRoleFilters: (filters: Partial<RoleQuery>) => void;
  setSelectedRoleIds: (ids: string[]) => void;
  setCurrentRole: (role: Role | null) => void;
  setRolePagination: (pagination: Partial<PaginationState>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;

  // 兼容别名
  total: number;
  query: any;
  selectedIds: string[];
  activeTab: string;
  setQuery: (query: any) => void;
  setSelectedIds: (ids: string[]) => void;
  setActiveTab: (tab: string) => void;
  deletePermissions: (ids: string[]) => Promise<void>;
  updatePermissionStatus: (ids: string[], status: string) => Promise<void>;
  deleteRoles: (ids: string[]) => Promise<void>;
  updateRoleStatus: (ids: string[], status: string) => Promise<void>;
  deletePermission: (id: string) => Promise<void>;
  deleteRole: (id: string) => Promise<void>;
  loadUserRoles: (userId: string) => Promise<void>;
  assignRole: (userId: string, roleId: string) => Promise<void>;
  revokeRole: (userRoleId: string) => Promise<void>;
}

export const usePermissionStore = create<PermissionStore>()(immer(
  (set, get) => ({
    // Initial state
    permissions: DEFAULT_PERMISSIONS,
    selectedPermissionIds: [],
    currentPermission: null,
    permissionFilters: {},
    permissionPagination: {
      current: 1,
      pageSize: 15,
      total: DEFAULT_PERMISSIONS.length,
    },
    permissionStatistics: null,

    roles: DEFAULT_ROLES,
    selectedRoleIds: [],
    currentRole: null,
    roleFilters: {},
    rolePagination: {
      current: 1,
      pageSize: 15,
      total: DEFAULT_ROLES.length,
    },
    roleStatistics: null,

    userRoles: [],
    selectedUserRoleIds: [],
    currentUserRoles: [],

    loading: false,
    error: null,

    // Permission actions
    loadPermissions: async (query?: PermissionQuery) => {
      set({ loading: true, error: null });
      try {
        const { permissionFilters: currentFilters, permissionPagination: currentPagination } = get();
        const finalQuery: PermissionQuery = {
          ...currentFilters,
          ...query,
          current: query?.current || currentPagination.current,
          pageSize: query?.pageSize || currentPagination.pageSize,
        };
        const result = await permissionApi.getPermissions(finalQuery);
        set({
          permissions: result.list,
          permissionPagination: {
            current: result.current ?? 1,
            pageSize: result.pageSize ?? 20,
            total: result.total ?? 0,
          },
          loading: false,
        });
      } catch (error: any) {
        set({
          error: error?.message || '加载系统权限列表失败',
          loading: false,
        });
        throw error;
      }
    },

    loadAllPermissions: async () => {
      try {
        const permissions = await permissionApi.getAllPermissions();
        set({ permissions });
      } catch (error: any) {
        console.error('加载所有系统权限失败:', error);
      }
    },

    loadPermissionStatistics: async () => {
      try {
        const statistics = await permissionApi.getStatistics();
        set({ permissionStatistics: statistics });
      } catch (error: any) {
        console.error('加载系统权限统计失败:', error);
      }
    },

    createPermission: async (data: CreatePermissionDTO) => {
      set({ loading: true, error: null });
      try {
        const newPermission = await permissionApi.createPermission(data);
        set(state => {
          state.permissions.unshift(newPermission);
          state.permissionPagination.total += 1;
          state.loading = false;
        });
        await get().loadPermissionStatistics();
      } catch (error: any) {
        set({
          error: error?.message || '创建系统权限失败',
          loading: false,
        });
        throw error;
      }
    },

    updatePermission: async (data: UpdatePermissionDTO) => {
      set({ loading: true, error: null });
      try {
        const updatedPermission = await permissionApi.updatePermission(data);
        set(state => {
          const index = state.permissions.findIndex(perm => perm.id === data.id);
          if (index !== -1) {
            state.permissions[index] = updatedPermission;
          }
          state.loading = false;
        });
      } catch (error: any) {
        set({
          error: error?.message || '更新系统权限失败',
          loading: false,
        });
        throw error;
      }
    },

    batchPermissions: async (action: PermissionBatchAction) => {
      set({ loading: true, error: null });
      try {
        await permissionApi.batchPermissions(action);
        await get().loadPermissions();
        await get().loadPermissionStatistics();
      } catch (error: any) {
        set({
          error: error?.message || '批量操作失败',
          loading: false,
        });
        throw error;
      }
    },

    activatePermission: async (id: string) => {
      set({ loading: true, error: null });
      try {
        await permissionApi.activatePermission(id);
        set(state => {
          const permission = state.permissions.find(perm => perm.id === id);
          if (permission) {
            permission.status = 'ACTIVE';
          }
          state.loading = false;
        });
        await get().loadPermissionStatistics();
      } catch (error: any) {
        set({
          error: error?.message || '启用权限失败',
          loading: false,
        });
        throw error;
      }
    },

    deactivatePermission: async (id: string) => {
      set({ loading: true, error: null });
      try {
        await permissionApi.deactivatePermission(id);
        set(state => {
          const permission = state.permissions.find(perm => perm.id === id);
          if (permission) {
            permission.status = 'INACTIVE';
          }
          state.loading = false;
        });
        await get().loadPermissionStatistics();
      } catch (error: any) {
        set({
          error: error?.message || '停用权限失败',
          loading: false,
        });
        throw error;
      }
    },

    // Role actions
    loadRoles: async (query?: RoleQuery) => {
      set({ loading: true, error: null });
      try {
        const { roleFilters: currentFilters, rolePagination: currentPagination } = get();
        const finalQuery: RoleQuery = {
          ...currentFilters,
          ...query,
          current: query?.current || currentPagination.current,
          pageSize: query?.pageSize || currentPagination.pageSize,
        };
        const result = await permissionApi.getRoles(finalQuery);
        set({
          roles: result.list,
          rolePagination: {
            current: result.current ?? 1,
            pageSize: result.pageSize ?? 20,
            total: result.total ?? 0,
          },
          loading: false,
        });
      } catch (error: any) {
        set({
          error: error?.message || '加载角色列表失败',
          loading: false,
        });
        throw error;
      }
    },

    loadAllRoles: async () => {
      try {
        const roles = await permissionApi.getAllRoles();
        set({ roles });
      } catch (error: any) {
        console.error('加载所有角色失败:', error);
      }
    },

    loadRoleStatistics: async () => {
      try {
        const statistics = await permissionApi.getRoleStatistics();
        set({ roleStatistics: statistics });
      } catch (error: any) {
        console.error('加载角色统计失败:', error);
      }
    },

    createRole: async (data: CreateRoleDTO) => {
      set({ loading: true, error: null });
      try {
        const newRole = await permissionApi.createRole(data);
        set(state => {
          state.roles.unshift(newRole);
          state.rolePagination.total += 1;
          state.loading = false;
        });
        await get().loadRoleStatistics();
      } catch (error: any) {
        set({
          error: error?.message || '创建角色失败',
          loading: false,
        });
        throw error;
      }
    },

    updateRole: async (data: UpdateRoleDTO) => {
      set({ loading: true, error: null });
      try {
        const updatedRole = await permissionApi.updateRole(data);
        set(state => {
          const index = state.roles.findIndex(role => role.id === data.id);
          if (index !== -1) {
            state.roles[index] = updatedRole;
          }
          state.loading = false;
        });
      } catch (error: any) {
        set({
          error: error?.message || '更新角色失败',
          loading: false,
        });
        throw error;
      }
    },

    batchRoles: async (action: PermissionBatchAction) => {
      set({ loading: true, error: null });
      try {
        await permissionApi.batchRoles(action);
        await get().loadRoles();
        await get().loadRoleStatistics();
      } catch (error: any) {
        set({
          error: error?.message || '批量操作失败',
          loading: false,
        });
        throw error;
      }
    },

    activateRole: async (id: string) => {
      set({ loading: true, error: null });
      try {
        await permissionApi.activateRole(id);
        set(state => {
          const role = state.roles.find(r => r.id === id);
          if (role) {
            role.status = 'ACTIVE';
          }
          state.loading = false;
        });
        await get().loadRoleStatistics();
      } catch (error: any) {
        set({
          error: error?.message || '启用角色失败',
          loading: false,
        });
        throw error;
      }
    },

    deactivateRole: async (id: string) => {
      set({ loading: true, error: null });
      try {
        await permissionApi.deactivateRole(id);
        set(state => {
          const role = state.roles.find(r => r.id === id);
          if (role) {
            role.status = 'INACTIVE';
          }
          state.loading = false;
        });
        await get().loadRoleStatistics();
      } catch (error: any) {
        set({
          error: error?.message || '停用角色失败',
          loading: false,
        });
        throw error;
      }
    },

    assignPermissionsToRole: async (roleId: string, permissions: string[]) => {
      set({ loading: true, error: null });
      try {
        await permissionApi.assignPermissionsToRole(roleId, permissions);
        set(state => {
          const role = state.roles.find(r => r.id === roleId);
          if (role) {
            role.permissions = permissions;
            role.permissionCount = permissions.length;
          }
          state.loading = false;
        });
      } catch (error: any) {
        set({
          error: error?.message || '分配权限失败',
          loading: false,
        });
        throw error;
      }
    },

    // UserRole actions
    getUserRoles: async (userId: string) => {
      try {
        const userRoles = await permissionApi.getUserRoles(userId);
        set({ userRoles });
        return userRoles;
      } catch (error: any) {
        console.error('获取用户角色失败:', error);
        return [];
      }
    },

    assignRoleToUser: async (userId: string, roleId: string, expireDate?: string) => {
      set({ loading: true, error: null });
      try {
        await permissionApi.assignRoleToUser(userId, roleId, expireDate);
        await get().getUserRoles(userId);
        set({ loading: false });
      } catch (error: any) {
        set({
          error: error?.message || '分配角色失败',
          loading: false,
        });
        throw error;
      }
    },

    revokeUserRole: async (userRoleId: string) => {
      set({ loading: true, error: null });
      try {
        await permissionApi.revokeUserRole(userRoleId);
        set(state => {
          state.userRoles = state.userRoles.filter(ur => ur.id !== userRoleId);
          state.loading = false;
        });
      } catch (error: any) {
        set({
          error: error?.message || '撤销用户角色失败',
          loading: false,
        });
        throw error;
      }
    },

    // Permission checks
    checkUserPermission: async (userId: string, permissionKey: string): Promise<boolean> => {
      try {
        return await permissionApi.checkUserPermission(userId, permissionKey);
      } catch (error: any) {
        console.error('检查用户权限失败:', error);
        return false;
      }
    },

    getUserPermissions: async (userId: string): Promise<string[]> => {
      try {
        return await permissionApi.getUserPermissions(userId);
      } catch (error: any) {
        console.error('获取用户权限失败:', error);
        return [];
      }
    },

    // State setters
    setPermissionFilters: (filters: Partial<PermissionQuery>) => {
      set(state => {
        state.permissionFilters = { ...state.permissionFilters, ...filters };
        state.permissionPagination.current = 1;
      });
    },

    setSelectedPermissionIds: (ids: string[]) => {
      set({ selectedPermissionIds: ids });
    },

    setCurrentPermission: (permission: SystemPermission | null) => {
      set({ currentPermission: permission });
    },

    setPermissionPagination: (pagination: Partial<PaginationState>) => {
      set(state => {
        state.permissionPagination = { ...state.permissionPagination, ...pagination };
      });
    },

    setRoleFilters: (filters: Partial<RoleQuery>) => {
      set(state => {
        state.roleFilters = { ...state.roleFilters, ...filters };
        state.rolePagination.current = 1;
      });
    },

    setSelectedRoleIds: (ids: string[]) => {
      set({ selectedRoleIds: ids });
    },

    setCurrentRole: (role: Role | null) => {
      set({ currentRole: role });
    },

    setRolePagination: (pagination: Partial<PaginationState>) => {
      set(state => {
        state.rolePagination = { ...state.rolePagination, ...pagination };
      });
    },

    setLoading: (loading: boolean) => {
      set({ loading });
    },

    setError: (error: string | null) => {
      set({ error });
    },

    reset: () => {
      set({
        permissions: DEFAULT_PERMISSIONS,
        selectedPermissionIds: [],
        currentPermission: null,
        permissionFilters: {},
        permissionPagination: {
          current: 1,
          pageSize: 15,
          total: DEFAULT_PERMISSIONS.length,
        },
        permissionStatistics: null,

        roles: DEFAULT_ROLES,
        selectedRoleIds: [],
        currentRole: null,
        roleFilters: {},
        rolePagination: {
          current: 1,
          pageSize: 15,
          total: DEFAULT_ROLES.length,
        },
        roleStatistics: null,

        userRoles: [],
        selectedUserRoleIds: [],
        currentUserRoles: [],

        loading: false,
        error: null,
      });
    },

    // 兼容别名
    get total() { return get().permissionPagination.total + get().rolePagination.total; },
    get query() { return get().permissionFilters; },
    get selectedIds() { return [...get().selectedPermissionIds, ...get().selectedRoleIds]; },
    activeTab: 'permissions',
    setQuery: (query: any) => { get().setPermissionFilters(query); },
    setSelectedIds: (ids: string[]) => { get().setSelectedPermissionIds(ids); },
    setActiveTab: (tab: string) => { set({ activeTab: tab } as any); },
    deletePermissions: async (ids: string[]) => { await get().batchPermissions({ action: 'DELETE', ids } as any); },
    updatePermissionStatus: async (ids: string[], status: string) => { await get().batchPermissions({ action: status, ids } as any); },
    deleteRoles: async (ids: string[]) => { await get().batchRoles({ action: 'DELETE', ids } as any); },
    updateRoleStatus: async (ids: string[], status: string) => { await get().batchRoles({ action: status, ids } as any); },
    deletePermission: async (id: string) => { await get().batchPermissions({ action: 'DELETE', ids: [id] } as any); },
    deleteRole: async (id: string) => { await get().batchRoles({ action: 'DELETE', ids: [id] } as any); },
    loadUserRoles: async (userId: string) => { await get().getUserRoles(userId); },
    assignRole: async (userId: string, roleId: string) => { await get().assignRoleToUser(userId, roleId); },
    revokeRole: async (userRoleId: string) => { await get().revokeUserRole(userRoleId); },
  })
));

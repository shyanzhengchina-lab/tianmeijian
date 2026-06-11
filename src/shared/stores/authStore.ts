/**
 * 认证状态管理 - Zustand实现
 * 管理用户登录状态、用户信息、认证令牌等
 */
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { authApi } from '../api/authApi';
import type {
  UserInfo,
  LoginRequest,
  LoginResponse,
  ChangePasswordRequest,
  UpdateUserRequest,
} from '../api/authApi';

// 用户信息接口（从API导出）
export interface User extends UserInfo {
  // 扩展UserInfo，如果需要额外字段
}

// 登录凭据（从API导出）
export type LoginCredentials = LoginRequest;

/**
 * 规范化 status 字段
 * 后端 SysUser.status 返回 Integer：1=启用，0=禁用
 * 前端 UserInfo.status 使用字符串枚举：'active'|'inactive'|'locked'
 */
function normalizeStatus(
  status: 'active' | 'inactive' | 'locked' | number | undefined
): 'active' | 'inactive' | 'locked' {
  if (status === 1 || status === 'active')   return 'active';
  if (status === 0 || status === 'inactive') return 'inactive';
  if (status === 'locked')                   return 'locked';
  return 'active'; // 未知值默认为 active（兼容旧数据）
}

interface AuthState {
  // 用户认证状态
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  refreshToken: string | null;

  // UI状态
  loading: boolean;
  error: string | null;

  // 权限信息
  permissions: string[];
  roles: Array<{ id: string; name: string; description?: string }>;

  // Actions
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  refreshUserInfo: () => Promise<void>;
  changePassword: (request: ChangePasswordRequest) => Promise<void>;
  updateUser: (request: UpdateUserRequest) => Promise<void>;
  checkPermission: (permission: string) => boolean;
  checkPermissions: (permissions: string[]) => boolean;
  hasRole: (roleId: string) => boolean;
}

const TOKEN_KEY = 'mes_token';
const REFRESH_TOKEN_KEY = 'mes_refresh_token';
const USER_KEY = 'mes_user';
const PERMISSIONS_KEY = 'mes_permissions';
const ROLES_KEY = 'mes_roles';

// 创建Zustand Store
export const useAuthStore = create<AuthState>()(
  immer((set, get) => ({
    // 初始状态
    isAuthenticated: false,
    user: null,
    token: null,
    refreshToken: null,
    loading: false,
    error: null,
    permissions: [],
    roles: [],

    // 初始化：从localStorage加载
    ...(() => {
      const savedToken = localStorage.getItem(TOKEN_KEY);
      const savedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      const savedUser = localStorage.getItem(USER_KEY);
      const savedPermissions = localStorage.getItem(PERMISSIONS_KEY);
      const savedRoles = localStorage.getItem(ROLES_KEY);

      if (savedToken && savedUser) {
        try {
          return {
            isAuthenticated: true,
            token: savedToken,
            refreshToken: savedRefreshToken,
            user: JSON.parse(savedUser) as User,
            permissions: savedPermissions ? JSON.parse(savedPermissions) : [],
            roles: savedRoles ? JSON.parse(savedRoles) : [],
          };
        } catch {
          // 忽略解析错误，保持未登录状态
          return {};
        }
      }
      return {};
    })(),

    // Actions
    login: async (credentials: LoginRequest) => {
      set({ loading: true, error: null });

      try {
        // 调用真实的登录API
        const response = await authApi.login(credentials);

        if (response.code === 200) {
          const { token, refreshToken, user: rawUser } = response.data;

          // 规范化 status 字段：后端返回 Integer(0=禁用,1=启用) → 前端枚举
          const user: User = {
            ...rawUser,
            status: normalizeStatus(rawUser.status),
          };

          // 保存到localStorage
          localStorage.setItem(TOKEN_KEY, token);
          if (refreshToken) {
            localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
          }
          localStorage.setItem(USER_KEY, JSON.stringify(user));

          // 更新状态
          set({
            isAuthenticated: true,
            token,
            refreshToken: refreshToken || null,
            user,
            loading: false,
            error: null,
          });
        } else {
          const errorMessage = response.message || '登录失败，请检查用户名和密码';
          set({
            loading: false,
            error: errorMessage,
          });
          throw new Error(errorMessage);
        }
      } catch (error: any) {
        const errorMessage = error?.response?.data?.message || error?.message || '登录失败，请检查用户名和密码';
        set({
          loading: false,
          error: errorMessage,
        });
        throw error;
      }
    },

    logout: async () => {
      try {
        // 调用登出API
        await authApi.logout();
      } catch (error) {
        console.error('登出API调用失败:', error);
      } finally {
        // 清除localStorage
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(PERMISSIONS_KEY);
        localStorage.removeItem(ROLES_KEY);

        // 清除状态
        set({
          isAuthenticated: false,
          user: null,
          token: null,
          refreshToken: null,
          permissions: [],
          roles: [],
          error: null,
        });

        // 跳转到登录页
        window.location.href = '/login';
      }
    },

    setUser: (user: User) => {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      set({ user });
    },

    setToken: (token: string) => {
      localStorage.setItem(TOKEN_KEY, token);
      set({ token });
    },

    clearAuth: () => {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(PERMISSIONS_KEY);
      localStorage.removeItem(ROLES_KEY);
      set({
        isAuthenticated: false,
        user: null,
        token: null,
        refreshToken: null,
        permissions: [],
        roles: [],
      });
    },

    setLoading: (loading: boolean) => {
      set({ loading });
    },

    setError: (error: string | null) => {
      set({ error });
    },

    refreshUserInfo: async () => {
      set({ loading: true, error: null });

      try {
        const response = await authApi.getCurrentUser();

        if (response.code === 200) {
          const user = response.data;
          localStorage.setItem(USER_KEY, JSON.stringify(user));

          set({
            user,
            permissions: user.permissions || [],
            loading: false,
            error: null,
          });
        }
      } catch (error: any) {
        const errorMessage = error?.response?.data?.message || error?.message || '获取用户信息失败';
        set({
          loading: false,
          error: errorMessage,
        });
        // 如果获取用户信息失败，可能token已过期，需要重新登录
        if (error?.response?.status === 401) {
          get().logout();
        }
      }
    },

    changePassword: async (request: ChangePasswordRequest) => {
      set({ loading: true, error: null });

      try {
        const response = await authApi.changePassword(request);

        if (response.code === 200) {
          set({ loading: false, error: null });
        } else {
          const errorMessage = response.message || '修改密码失败';
          set({
            loading: false,
            error: errorMessage,
          });
          throw new Error(errorMessage);
        }
      } catch (error: any) {
        const errorMessage = error?.response?.data?.message || error?.message || '修改密码失败';
        set({
          loading: false,
          error: errorMessage,
        });
        throw error;
      }
    },

    updateUser: async (request: UpdateUserRequest) => {
      set({ loading: true, error: null });

      try {
        const response = await authApi.updateUser(request);

        if (response.code === 200) {
          const updatedUser = response.data;
          localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));

          set({
            user: updatedUser,
            loading: false,
            error: null,
          });
        } else {
          const errorMessage = response.message || '更新用户信息失败';
          set({
            loading: false,
            error: errorMessage,
          });
          throw new Error(errorMessage);
        }
      } catch (error: any) {
        const errorMessage = error?.response?.data?.message || error?.message || '更新用户信息失败';
        set({
          loading: false,
          error: errorMessage,
        });
        throw error;
      }
    },

    checkPermission: (permission: string) => {
      const { permissions, user } = get();
      // 如果用户是超级管理员（根据实际情况调整），则拥有所有权限
      if (user?.roleIds?.includes('ROLE_SUPER_ADMIN')) {
        return true;
      }
      return permissions.includes(permission);
    },

    checkPermissions: (requiredPermissions: string[]) => {
      const { permissions, user } = get();
      // 如果用户是超级管理员，则拥有所有权限
      if (user?.roleIds?.includes('ROLE_SUPER_ADMIN')) {
        return true;
      }
      return requiredPermissions.every(permission => permissions.includes(permission));
    },

    hasRole: (roleId: string) => {
      const { user } = get();
      return user?.roleIds?.includes(roleId) ?? false;
    },
  }))
);

// 导出便捷函数
export const login = (credentials: LoginCredentials) => useAuthStore.getState().login(credentials);
export const logout = () => useAuthStore.getState().logout();
export const isAuthenticated = () => useAuthStore.getState().isAuthenticated;
export const getCurrentUser = () => useAuthStore.getState().user;
export const getToken = () => useAuthStore.getState().token;
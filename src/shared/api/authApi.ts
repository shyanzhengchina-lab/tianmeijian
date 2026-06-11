/**
 * 用户认证API服务
 * 提供用户登录、登出、获取用户信息等认证相关API调用
 */

import { apiClient } from './apiClient';
import type { ApiResponse } from './requestTypes';

/**
 * 用户登录请求参数
 */
export interface LoginRequest {
  username: string;   // maps to employeeId on backend
  password: string;
  captcha?: string;
  captchaId?: string;
}

/**
 * 用户登录响应
 */
export interface LoginResponse {
  token: string;
  refreshToken?: string;
  tokenType?: string;
  expiresIn?: number;
  user: UserInfo;
}

/**
 * 用户信息
 */
export interface UserInfo {
  id: string;
  username: string;
  realName: string;
  email?: string;
  phone?: string;
  avatar?: string;
  roleIds: string[];
  roleNames?: string[];
  factoryIds: string[];
  defaultFactoryId?: string;
  permissions?: string[];
  status: 'active' | 'inactive' | 'locked';
}

/**
 * 修改密码请求
 */
export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * 更新用户信息请求
 */
export interface UpdateUserRequest {
  realName?: string;
  email?: string;
  phone?: string;
  avatar?: string;
}

/**
 * 权限检查响应
 */
export interface PermissionCheckResponse {
  hasPermission: boolean;
  requiredPermission: string;
}

/**
 * 认证API服务类
 */
class AuthApiService {
  private readonly baseUrl = '/auth';

  /**
   * 用户登录
   */
  async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    // 新后端 (Express) 接受 { username, password }
    // 旧后端 (Spring Boot) 接受 { employeeId, password }
    // 同时发送两个字段，兼容两种后端
    const payload = {
      username: credentials.username,
      employeeId: credentials.username,
      password: credentials.password,
    };
    return apiClient.post(`${this.baseUrl}/login`, payload, {
      skipCache: true,
      skipRetry: true,
    });
  }

  /**
   * 用户登出
   */
  async logout(): Promise<ApiResponse<void>> {
    return apiClient.post(`${this.baseUrl}/logout`, undefined, {
      skipCache: true,
      skipRetry: true,
    });
  }

  /**
   * 获取当前用户信息
   */
  async getCurrentUser(): Promise<ApiResponse<UserInfo>> {
    return apiClient.get(`${this.baseUrl}/user/info`);
  }

  /**
   * 刷新Token
   */
  async refreshToken(refreshToken: string): Promise<ApiResponse<LoginResponse>> {
    return apiClient.post(`${this.baseUrl}/refresh-token`, { refreshToken }, {
      skipCache: true,
      skipRetry: true,
    });
  }

  /**
   * 修改密码
   */
  async changePassword(request: ChangePasswordRequest): Promise<ApiResponse<void>> {
    return apiClient.put(`${this.baseUrl}/change-password`, request);
  }

  /**
   * 更新用户信息
   */
  async updateUser(request: UpdateUserRequest): Promise<ApiResponse<UserInfo>> {
    return apiClient.put(`${this.baseUrl}/user/update`, request);
  }

  /**
   * 检查用户权限
   */
  async checkPermission(permission: string): Promise<ApiResponse<PermissionCheckResponse>> {
    return apiClient.get(`${this.baseUrl}/check-permission`, { params: { permission } });
  }

  /**
   * 批量检查权限
   */
  async checkPermissions(permissions: string[]): Promise<ApiResponse<Record<string, boolean>>> {
    return apiClient.post(`${this.baseUrl}/check-permissions`, { permissions });
  }

  /**
   * 获取用户权限列表
   */
  async getUserPermissions(): Promise<ApiResponse<string[]>> {
    return apiClient.get(`${this.baseUrl}/user/permissions`);
  }

  /**
   * 获取用户角色列表
   */
  async getUserRoles(): Promise<ApiResponse<Array<{ id: string; name: string; description?: string }>>> {
    return apiClient.get(`${this.baseUrl}/user/roles`);
  }

  /**
   * 上传用户头像
   */
  async uploadAvatar(file: File): Promise<ApiResponse<{ avatar: string }>> {
    const formData = new FormData();
    formData.append('file', file);

    return apiClient.post(`${this.baseUrl}/user/avatar`, formData);
  }

  /**
   * 获取用户可访问的工厂列表
   */
  async getUserFactories(): Promise<ApiResponse<Array<{ id: string; name: string; code: string }>>> {
    return apiClient.get(`${this.baseUrl}/user/factories`);
  }

  /**
   * 获取验证码
   */
  async getCaptcha(): Promise<ApiResponse<{ captchaId: string; captchaImage: string }>> {
    return apiClient.get(`${this.baseUrl}/captcha`);
  }

  /**
   * 忘记密码
   */
  async forgotPassword(email: string): Promise<ApiResponse<void>> {
    return apiClient.post(`${this.baseUrl}/forgot-password`, { email });
  }

  /**
   * 重置密码
   */
  async resetPassword(token: string, newPassword: string): Promise<ApiResponse<void>> {
    return apiClient.post(`${this.baseUrl}/reset-password`, { token, newPassword });
  }

  /**
   * 验证Token是否有效
   */
  async validateToken(): Promise<ApiResponse<{ valid: boolean }>> {
    return apiClient.get(`${this.baseUrl}/validate-token`);
  }
}

// 创建单例实例
export const authApi = new AuthApiService();

export default authApi;

export { AuthApiService };

/**
 * 共享API模块统一导出
 */

// API类型定义
export * from './requestTypes';

// API客户端
export { ApiClient, apiClient } from './apiClient';

// 认证API
export { authApi, AuthApiService } from './authApi';
export type {
  LoginRequest,
  LoginResponse,
  UserInfo,
  ChangePasswordRequest,
  UpdateUserRequest,
  PermissionCheckResponse,
} from './authApi';

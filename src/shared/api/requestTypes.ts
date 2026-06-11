/**
 * 通用API请求/响应类型定义
 * 用于类型化API客户端
 */

// 通用API响应结构
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
  timestamp?: number;
}

// 分页参数
export interface PageQuery {
  current?: number;
  pageSize?: number;
  keyword?: string;
  sortBy?: string;
  sortOrder?: 'ascend' | 'descend';
}

// 分页结果（与后端 PageResult<T> 保持一致：list/total/page/pageSize）
export interface PageResult<T> {
  list: T[];
  total: number;
  page?: number;       // 后端字段
  current?: number;    // 前端别名（兼容旧代码）
  pageSize: number;
}

// 批量操作参数
export interface BatchActionParams {
  ids: string[];
  action: string;
  params?: Record<string, any>;
}

// 批量操作结果
export interface BatchActionResult {
  success: number;
  failed: number;
  failedIds?: string[];
  errors?: string[];
}
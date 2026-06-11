/**
 * 共享Hooks模块统一导出
 */

// 表格相关
export { useTable } from './useTable';
export type { TableQuery, TableDataResponse, UseTableOptions, UseTableReturn } from './useTable';

// 表单相关
export { useForm } from './useForm';
export type { FormSubmitResponse, FormValidationRule, FormField, UseFormOptions, UseFormReturn } from './useForm';

// 弹窗相关
export { useModal } from './useModal';

// 权限相关
export { usePermission } from './usePermission';

// 分页相关
export { usePagination, createPaginationConfig } from './usePagination';
export type { PaginationState, UsePaginationOptions, UsePaginationReturn } from './usePagination';

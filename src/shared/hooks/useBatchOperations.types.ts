/**
 * Batch Operations Hook Type Definitions
 * 定义批量操作Hook的TypeScript类型
 */

import { ModalProps } from 'antd';

/**
 * 批量操作配置接口
 * @template T - 数据项类型
 */
export interface BatchOperationConfig<T> {
  /** 批量操作函数 */
  operation: (ids: string[]) => Promise<void>;
  /** 确认消息模板，支持 {count} 变量 */
  confirmation?: string;
  /** 成功消息模板，支持 {count} 变量 */
  successMessage?: string;
  /** 错误消息模板，支持 {count} 变量 */
  errorMessage?: string;
  /** 进度指示器配置 */
  progressConfig?: {
    /** 是否显示进度 */
    showProgress: boolean;
    /** 批处理大小 */
    batchSize?: number;
  };
}

/**
 * 批量操作Hook参数接口
 * @template T - 数据项类型，必须包含 id 字段
 */
export interface UseBatchOperationsParams<T extends { id: string }> {
  /** 数据列表 */
  items: T[];
  /** 选中的ID列表 */
  selectedIds: string[];
  /** 选择变化回调 */
  onSelectionChange: (ids: string[]) => void;
  /** 批量操作配置 */
  operations: {
    /** 批量删除 */
    delete: (ids: string[]) => Promise<void>;
    /** 批量启用（可选） */
    enable?: (ids: string[]) => Promise<void>;
    /** 批量禁用（可选） */
    disable?: (ids: string[]) => Promise<void>;
    /** 批量激活（可选） */
    activate?: (ids: string[]) => Promise<void>;
    /** 批量停用（可选） */
    deactivate?: (ids: string[]) => Promise<void>;
    /** 自定义操作 */
    custom?: { [key: string]: (ids: string[]) => Promise<void> };
  };
  /** 确认消息配置 */
  confirmations?: {
    /** 删除确认消息 */
    delete?: string;
    /** 启用确认消息 */
    enable?: string;
    /** 禁用确认消息 */
    disable?: string;
    /** 激活确认消息 */
    activate?: string;
    /** 停用确认消息 */
    deactivate?: string;
    /** 自定义操作的确认消息 */
    [key: string]: string | undefined;
  };
  /** 操作成功回调 */
  onSuccess?: (message: string) => void;
  /** 操作失败回调 */
  onError?: (error: Error) => void;
  /** 是否在操作成功后清除选择 */
  clearSelectionOnSuccess?: boolean;
  /** 是否显示确认对话框 */
  showConfirmDialog?: boolean;
  /** 模态框配置 */
  modalConfig?: Partial<ModalProps>;
  /** 国际化消息映射 */
  i18n?: {
    /** 默认确认消息 */
    defaultConfirmation: string;
    /** 默认成功消息 */
    defaultSuccessMessage: string;
    /** 默认错误消息 */
    defaultErrorMessage: string;
  };
}

/**
 * 批量操作返回值接口
 */
export interface BatchOperationsReturn {
  /** 行选择处理函数 */
  handleRowSelection: (selectedRowKeys: React.Key[]) => void;
  /** 行选择配置对象 */
  rowSelection: {
    selectedRowKeys: string[];
    onChange: (selectedRowKeys: React.Key[]) => void;
  };
  /** 批量删除处理函数 */
  handleBatchDelete: () => Promise<void>;
  /** 批量启用处理函数 */
  handleBatchEnable?: () => Promise<void>;
  /** 批量禁用处理函数 */
  handleBatchDisable?: () => Promise<void>;
  /** 批量激活处理函数 */
  handleBatchActivate?: () => Promise<void>;
  /** 批量停用处理函数 */
  handleBatchDeactivate?: () => Promise<void>;
  /** 自定义操作列表 */
  customOperations: Array<{
    key: string;
    handler: () => Promise<void>;
  }>;
  /** 操作状态对象 */
  loading: {
    delete: boolean;
    enable?: boolean;
    disable?: boolean;
    activate?: boolean;
    deactivate?: boolean;
    [key: string]: boolean | undefined;
  };
  /** 选中项数量 */
  selectedCount: number;
  /** 是否可以执行批量操作 */
  canExecuteOperations: boolean;
  /** 重置选中项 */
  clearSelection: () => void;
  /** 执行自定义操作 */
  executeCustomOperation: (operationKey: string, operation: (ids: string[]) => Promise<void>, confirmation?: string) => Promise<void>;
}

/**
 * 批量操作状态类型
 */
export type BatchOperationState = 'idle' | 'confirming' | 'executing' | 'success' | 'error';

/**
 * 批量操作错误类型
 */
export class BatchOperationError extends Error {
  public operationType: string;
  public ids: string[];
  public originalError: Error;

  constructor(operationType: string, ids: string[], originalError: Error) {
    super(`Batch ${operationType} operation failed for ${ids.length} items`);
    this.name = 'BatchOperationError';
    this.operationType = operationType;
    this.ids = ids;
    this.originalError = originalError;
  }
}

/**
 * 批量操作结果类型
 */
export interface BatchOperationResult {
  /** 操作类型 */
  operationType: string;
  /** 处理的ID列表 */
  processedIds: string[];
  /** 成功的ID列表 */
  successIds: string[];
  /** 失败的ID列表 */
  failedIds: Array<{
    id: string;
    error: Error;
  }>;
  /** 总耗时（毫秒） */
  duration: number;
  /** 开始时间 */
  startTime: Date;
  /** 结束时间 */
  endTime: Date;
}
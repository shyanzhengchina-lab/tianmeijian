/**
 * Batch Operations Hook
 * 通用的批量操作Hook，用于消除重复代码
 * 支持确认对话框、进度指示、错误处理等
 */

import { useCallback, useState } from 'react';
import { message, Modal } from 'antd';
import type { ModalProps } from 'antd';
import {
  UseBatchOperationsParams,
  BatchOperationsReturn,
  BatchOperationError,
  BatchOperationResult,
} from './useBatchOperations.types';

/**
 * 默认国际化消息
 */
const DEFAULT_I18N = {
  defaultConfirmation: '您确定要{count}个操作吗？',
  defaultSuccessMessage: '成功处理 {count} 个项目',
  defaultErrorMessage: '批量操作失败',
} as const;

/**
 * 批量操作Hook实现
 * @template T - 数据项类型
 * @param params - Hook参数
 * @returns 批量操作相关的函数和状态
 */
export const useBatchOperations = <T extends { id: string }>(
  params: UseBatchOperationsParams<T>
): BatchOperationsReturn => {
  const {
    items,
    selectedIds,
    onSelectionChange,
    operations,
    confirmations = {},
    onSuccess,
    onError,
    clearSelectionOnSuccess = true,
    showConfirmDialog = true,
    modalConfig = {},
    i18n = DEFAULT_I18N,
  } = params;

  // 加载状态管理
  const [loadingStates, setLoadingStates] = useState<{ delete: boolean; enable?: boolean; disable?: boolean; activate?: boolean; deactivate?: boolean; [key: string]: boolean | undefined }>({
    delete: false,
    enable: false,
    disable: false,
    activate: false,
    deactivate: false,
  });

  /**
   * 格式化消息，支持变量替换
   * @param template - 消息模板
   * @param variables - 变量对象
   * @returns 格式化后的消息
   */
  const formatMessage = useCallback(
    (template: string | undefined, variables: Record<string, any>): string => {
      if (!template) return i18n.defaultSuccessMessage;

      return template.replace(/\{(\w+)\}/g, (_, key) => {
        return variables[key] !== undefined ? String(variables[key]) : `{${key}}`;
      });
    },
    [i18n]
  );

  /**
   * 处理操作成功
   * @param operationType - 操作类型
   * @param successCount - 成功数量
   */
  const handleSuccess = useCallback(
    (operationType: string, successCount: number) => {
      const successMsg = confirmations[operationType as keyof typeof confirmations];
      const messageText = formatMessage(successMsg, { count: successCount, operation: operationType });
      message.success(messageText);

      if (onSuccess) {
        onSuccess(messageText);
      }

      // 清除选择
      if (clearSelectionOnSuccess) {
        onSelectionChange([]);
      }
    },
    [confirmations, formatMessage, onSuccess, clearSelectionOnSuccess, onSelectionChange]
  );

  /**
   * 处理操作失败
   * @param operationType - 操作类型
   * @param error - 错误对象
   */
  const handleError = useCallback(
    (operationType: string, error: Error) => {
      const errorMsg = confirmations[operationType as keyof typeof confirmations];
      const messageText = formatMessage(errorMsg, {
        count: selectedIds.length,
        operation: operationType,
        error: error.message,
      });

      message.error(messageText);

      if (onError) {
        onError(error);
      }
    },
    [confirmations, formatMessage, onError, selectedIds.length]
  );

  /**
   * 通用批量操作处理器
   * @param operationType - 操作类型
   * @param operation - 操作函数
   * @param confirmation - 确认消息
   */
  const handleBatchOperation = useCallback(
    async (
      operationType: string,
      operation: (ids: string[]) => Promise<void>,
      confirmation?: string
    ): Promise<void> => {
      if (selectedIds.length === 0) {
        message.warning('请先选择要操作的项目');
        return;
      }

      // 设置加载状态
      setLoadingStates(prev => ({ ...prev, [operationType]: true }));

      try {
        // 确认对话框
        if (showConfirmDialog && confirmation) {
          const confirmationMessage = formatMessage(confirmation, { count: selectedIds.length });

          await new Promise<void>((resolve, reject) => {
            Modal.confirm({
              title: '确认批量操作',
              content: confirmationMessage,
              okText: '确定',
              cancelText: '取消',
              centered: true,
              okType: operationType === 'delete' ? 'danger' : 'primary',
              onOk: () => resolve(),
              onCancel: () => {
                setLoadingStates(prev => ({ ...prev, [operationType]: false }));
                reject(new Error('操作已取消'));
              },
              ...(modalConfig as any),
            });
          });
        }

        // 执行操作
        const startTime = Date.now();
        await operation(selectedIds);
        const duration = Date.now() - startTime;

        // 成功处理
        handleSuccess(operationType, selectedIds.length);

        console.log(`Batch ${operationType} completed in ${duration}ms for ${selectedIds.length} items`);
      } catch (error) {
        if (error instanceof Error && error.message === '操作已取消') {
          // 用户取消操作，不显示错误
          return;
        }

        const operationError = new BatchOperationError(operationType, selectedIds, error as Error);
        handleError(operationType, operationError);
      } finally {
        setLoadingStates(prev => ({ ...prev, [operationType]: false }));
      }
    },
    [
      selectedIds,
      showConfirmDialog,
      modalConfig,
      formatMessage,
      handleSuccess,
      handleError,
      onSelectionChange,
    ]
  );

  /**
   * 行选择处理函数
   */
  const handleRowSelection = useCallback(
    (selectedRowKeys: React.Key[]) => {
      onSelectionChange(selectedRowKeys as string[]);
    },
    [onSelectionChange]
  );

  /**
   * 批量删除
   */
  const handleBatchDelete = useCallback(async () => {
    const confirmation = confirmations.delete || `您确定要删除选中的 ${selectedIds.length} 个项目吗？此操作不可恢复！`;
    await handleBatchOperation('delete', operations.delete, confirmation);
  }, [handleBatchOperation, operations.delete, confirmations.delete, selectedIds.length]);

  /**
   * 批量启用
   */
  const handleBatchEnable = useCallback((): Promise<void> => {
    if (!operations.enable) return Promise.resolve();

    const confirmation = confirmations.enable || `您确定要启用选中的 ${selectedIds.length} 个项目吗？`;
    return handleBatchOperation('enable', operations.enable, confirmation) ?? Promise.resolve();
  }, [handleBatchOperation, operations.enable, confirmations.enable, selectedIds.length]);

  /**
   * 批量禁用
   */
  const handleBatchDisable = useCallback((): Promise<void> => {
    if (!operations.disable) return Promise.resolve();

    const confirmation = confirmations.disable || `您确定要禁用选中的 ${selectedIds.length} 个项目吗？禁用后这些项目将无法使用。`;
    return handleBatchOperation('disable', operations.disable, confirmation) ?? Promise.resolve();
  }, [handleBatchOperation, operations.disable, confirmations.disable, selectedIds.length]);

  /**
   * 批量激活
   */
  const handleBatchActivate = useCallback((): Promise<void> => {
    if (!operations.activate) return Promise.resolve();

    const confirmation = confirmations.activate || `您确定要激活选中的 ${selectedIds.length} 个项目吗？`;
    return handleBatchOperation('activate', operations.activate, confirmation) ?? Promise.resolve();
  }, [handleBatchOperation, operations.activate, confirmations.activate, selectedIds.length]);

  /**
   * 批量停用
   */
  const handleBatchDeactivate = useCallback((): Promise<void> => {
    if (!operations.deactivate) return Promise.resolve();

    const confirmation = confirmations.deactivate || `您确定要停用选中的 ${selectedIds.length} 个项目吗？停用后这些项目将无法使用。`;
    return handleBatchOperation('deactivate', operations.deactivate, confirmation) ?? Promise.resolve();
  }, [handleBatchOperation, operations.deactivate, confirmations.deactivate, selectedIds.length]);

  /**
   * 自定义操作列表
   */
  const customOperations = useCallback(() => {
    if (!operations.custom) return [];

    return Object.entries(operations.custom).map(([key, operation]) => ({
      key,
      handler: () => {
        const confirmation = confirmations[key];
        return handleBatchOperation(key, operation, confirmation);
      },
    }));
  }, [operations.custom, confirmations, handleBatchOperation]);

  /**
   * 清除选择
   */
  const clearSelection = useCallback(() => {
    onSelectionChange([]);
  }, [onSelectionChange]);

  /**
   * 执行自定义操作
   */
  const executeCustomOperation = useCallback(
    async (operationKey: string, operation: (ids: string[]) => Promise<void>, confirmation?: string) => {
      await handleBatchOperation(operationKey, operation, confirmation);
    },
    [handleBatchOperation]
  );

  return {
    // 选择处理器
    handleRowSelection,
    rowSelection: {
      selectedRowKeys: selectedIds,
      onChange: handleRowSelection,
    },

    // 批量操作处理器
    handleBatchDelete,
    handleBatchEnable: operations.enable ? handleBatchEnable : undefined,
    handleBatchDisable: operations.disable ? handleBatchDisable : undefined,
    handleBatchActivate: operations.activate ? handleBatchActivate : undefined,
    handleBatchDeactivate: operations.deactivate ? handleBatchDeactivate : undefined,

    // 自定义操作
    customOperations: customOperations(),

    // 状态
    loading: loadingStates,
    selectedCount: selectedIds.length,
    canExecuteOperations: selectedIds.length > 0,

    // 工具方法
    clearSelection,
    executeCustomOperation,
  };
};

/**
 * 批量操作结果记录器（可选功能）
 * 用于记录详细的批量操作结果
 */
export class BatchOperationLogger {
  private results: BatchOperationResult[] = [];

  /**
   * 记录批量操作结果
   */
  logResult(result: BatchOperationResult) {
    this.results.push(result);
  }

  /**
   * 获取所有结果
   */
  getResults(): BatchOperationResult[] {
    return [...this.results];
  }

  /**
   * 清空结果
   */
  clearResults() {
    this.results = [];
  }

  /**
   * 获取统计信息
   */
  getStatistics() {
    const total = this.results.length;
    const totalItems = this.results.reduce((sum, r) => sum + r.processedIds.length, 0);
    const totalSuccess = this.results.reduce((sum, r) => sum + r.successIds.length, 0);
    const totalFailed = this.results.reduce((sum, r) => sum + r.failedIds.length, 0);
    const avgDuration = total > 0 ? this.results.reduce((sum, r) => sum + r.duration, 0) / total : 0;

    return {
      totalOperations: total,
      totalItemsProcessed: totalItems,
      totalSuccess: totalSuccess,
      totalFailed: totalFailed,
      averageDuration: avgDuration,
      successRate: totalItems > 0 ? (totalSuccess / totalItems) * 100 : 0,
    };
  }
}
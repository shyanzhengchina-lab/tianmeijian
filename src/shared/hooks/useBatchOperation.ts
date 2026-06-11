/**
 * 批量操作Hook
 * 提供批量操作的进度跟踪、错误处理和取消功能
 */

import { useState, useCallback, useRef } from 'react';
import type { BatchProgressState, BatchOperationItem, BatchItemStatus } from '../components/BatchProgressModal';
import { message } from 'antd';

/**
 * 批量操作配置
 */
export interface BatchOperationConfig<T = any> {
  operationName: string;
  operationType: string;
  items: T[];
  getItemId: (item: T) => string;
  getItemName: (item: T) => string;
  operationFn: (item: T, index: number) => Promise<void>;
  batchSize?: number;
  onProgress?: (progress: BatchProgressState) => void;
  onComplete?: (result: BatchOperationResult) => void;
  onError?: (error: Error, item: T) => void;
  showProgressModal?: boolean;
  allowCancel?: boolean;
}

/**
 * 批量操作结果
 */
export interface BatchOperationResult {
  success: boolean;
  total: number;
  successCount: number;
  failedCount: number;
  cancelledCount: number;
  items: BatchOperationItem[];
  errors: Array<{ item: any; error: string }>;
}

/**
 * useBatchOperation Hook 返回值
 */
export interface UseBatchOperationReturn {
  progress: BatchProgressState;
  isOperating: boolean;
  startOperation: <T>(config: BatchOperationConfig<T>) => Promise<BatchOperationResult>;
  cancelOperation: () => void;
  resetProgress: () => void;
}

/**
 * 批量操作Hook
 */
export function useBatchOperation(): UseBatchOperationReturn {
  const [progress, setProgress] = useState<BatchProgressState>({
    visible: false,
    title: '',
    operationType: '',
    total: 0,
    processed: 0,
    successCount: 0,
    failedCount: 0,
    items: [],
    isCancelled: false,
    isComplete: false,
  });

  const [isOperating, setIsOperating] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const currentConfigRef = useRef<BatchOperationConfig<any> | null>(null);

  /**
   * 重置进度
   */
  const resetProgress = useCallback(() => {
    setProgress({
      visible: false,
      title: '',
      operationType: '',
      total: 0,
      processed: 0,
      successCount: 0,
      failedCount: 0,
      items: [],
      isCancelled: false,
      isComplete: false,
    });
    setIsOperating(false);
  }, []);

  /**
   * 取消操作
   */
  const cancelOperation = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setProgress(prev => ({
      ...prev,
      isCancelled: true,
      isComplete: true,
    }));

    message.info('操作已取消');
  }, []);

  /**
   * 更新进度状态
   */
  const updateProgress = useCallback((updates: Partial<BatchProgressState>) => {
    setProgress(prev => {
      const newProgress = { ...prev, ...updates };
      currentConfigRef.current?.onProgress?.(newProgress);
      return newProgress;
    });
  }, []);

  /**
   * 更新单个项目状态
   */
  const updateItemStatus = useCallback((
    itemId: string,
    status: BatchItemStatus,
    error?: string
  ) => {
    setProgress(prev => {
      const updatedItems = prev.items.map(item =>
        item.id === itemId ? { ...item, status, error } : item
      );

      const successCount = updatedItems.filter(i => i.status === 'success').length;
      const failedCount = updatedItems.filter(i => i.status === 'failed').length;
      const processed = updatedItems.filter(i => i.status !== 'pending').length;

      const newProgress = {
        ...prev,
        items: updatedItems,
        successCount,
        failedCount,
        processed,
      };

      currentConfigRef.current?.onProgress?.(newProgress);
      return newProgress;
    });
  }, []);

  /**
   * 开始批量操作
   */
  const startOperation = useCallback(async <T>(config: BatchOperationConfig<T>): Promise<BatchOperationResult> => {
    const {
      operationName,
      operationType,
      items,
      getItemId,
      getItemName,
      operationFn,
      batchSize = 5,
      onProgress,
      onComplete,
      onError,
      showProgressModal = true,
      allowCancel = true,
    } = config;

    // 重置状态
    abortControllerRef.current = new AbortController();
    currentConfigRef.current = config;
    setIsOperating(true);

    // 初始化进度状态
    const initialItems: BatchOperationItem[] = items.map(item => ({
      id: getItemId(item),
      name: getItemName(item),
      status: 'pending',
    }));

    const initialProgress: BatchProgressState = {
      visible: showProgressModal,
      title: operationName,
      operationType,
      total: items.length,
      processed: 0,
      successCount: 0,
      failedCount: 0,
      items: initialItems,
      isCancelled: false,
      isComplete: false,
    };

    setProgress(initialProgress);
    onProgress?.(initialProgress);

    const result: BatchOperationResult = {
      success: false,
      total: items.length,
      successCount: 0,
      failedCount: 0,
      cancelledCount: 0,
      items: initialItems,
      errors: [],
    };

    try {
      // 批量处理
      for (let i = 0; i < items.length; i += batchSize) {
        // 检查是否被取消
        if (abortControllerRef.current?.signal.aborted) {
          break;
        }

        const batch = items.slice(i, i + batchSize);

        // 并发处理当前批次
        await Promise.allSettled(
          batch.map(async (item, batchIndex) => {
            const globalIndex = i + batchIndex;
            const itemId = getItemId(item);

            try {
              // 更新为处理中
              updateItemStatus(itemId, 'processing');

              // 执行操作
              await operationFn(item, globalIndex);

              // 更新为成功
              updateItemStatus(itemId, 'success');
              result.successCount++;
            } catch (error: any) {
              // 更新为失败
              const errorMessage = error?.message || error?.data?.message || '操作失败';
              updateItemStatus(itemId, 'failed', errorMessage);
              result.failedCount++;
              result.errors.push({ item, error: errorMessage });

              // 错误回调
              onError?.(error, item);
            }
          })
        );
      }

      // 处理取消状态
      if (abortControllerRef.current?.signal.aborted) {
        const pendingItems = result.items.filter(i => i.status === 'pending');
        pendingItems.forEach(item => {
          updateItemStatus(item.id, 'cancelled');
        });
        result.cancelledCount = pendingItems.length;
        result.success = false;
      } else {
        result.success = result.failedCount === 0;
      }

      // 标记完成
      updateProgress({
        isComplete: true,
      });

      // 完成回调
      onComplete?.(result);

      // 显示结果消息
      if (result.cancelledCount > 0) {
        message.info(`操作已取消: 成功 ${result.successCount} 项，失败 ${result.failedCount} 项，取消 ${result.cancelledCount} 项`);
      } else if (result.failedCount === 0) {
        message.success(`操作完成: 成功 ${result.successCount} 项`);
      } else {
        message.warning(`操作完成: 成功 ${result.successCount} 项，失败 ${result.failedCount} 项`);
      }

    } catch (error: any) {
      console.error('批量操作异常:', error);
      message.error('批量操作发生异常');
      result.success = false;
    } finally {
      setIsOperating(false);
      abortControllerRef.current = null;
      currentConfigRef.current = null;
    }

    return result;
  }, [updateProgress, updateItemStatus]);

  return {
    progress,
    isOperating,
    startOperation,
    cancelOperation,
    resetProgress,
  };
}

export default useBatchOperation;

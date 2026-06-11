/**
 * useBatchOperations Hook Unit Tests
 * 批量操作Hook的单元测试
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { message } from 'antd';
import { useBatchOperations } from '../useBatchOperations';

// Mock antd message
jest.mock('antd', () => ({
  ...jest.requireActual('antd'),
  message: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
  },
  Modal: {
    confirm: jest.fn(),
  },
}));

describe('useBatchOperations', () => {
  const mockItems = [
    { id: '1', name: 'Item 1' },
    { id: '2', name: 'Item 2' },
    { id: '3', name: 'Item 3' },
  ];

  const mockOperations = {
    delete: jest.fn(),
    enable: jest.fn(),
    disable: jest.fn(),
  };

  const mockConfirmations = {
    delete: 'Delete {count} items?',
    enable: 'Enable {count} items?',
    disable: 'Disable {count} items?',
  };

  let mockSelectedIds: string[] = [];
  const mockOnSelectionChange = jest.fn((ids) => {
    mockSelectedIds = ids;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockSelectedIds = [];
    mockOperations.delete.mockResolvedValue(undefined);
    mockOperations.enable.mockResolvedValue(undefined);
    mockOperations.disable.mockResolvedValue(undefined);
    ((message as any).Modal.confirm as jest.Mock).mockImplementation(({ onOk }) => {
      onOk();
      return Promise.resolve();
    });
  });

  describe('Basic functionality', () => {
    it('should initialize with correct state', () => {
      const { result } = renderHook(() =>
        useBatchOperations({
          items: mockItems,
          selectedIds: [],
          onSelectionChange: mockOnSelectionChange,
          operations: mockOperations,
        })
      );

      expect(result.current.selectedCount).toBe(0);
      expect(result.current.canExecuteOperations).toBe(false);
      expect(result.current.loading.delete).toBe(false);
    });

    it('should update selection count when items are selected', () => {
      const { result } = renderHook(() =>
        useBatchOperations({
          items: mockItems,
          selectedIds: ['1', '2'],
          onSelectionChange: mockOnSelectionChange,
          operations: mockOperations,
        })
      );

      expect(result.current.selectedCount).toBe(2);
      expect(result.current.canExecuteOperations).toBe(true);
    });

    it('should call onSelectionChange when handleRowSelection is called', () => {
      const { result } = renderHook(() =>
        useBatchOperations({
          items: mockItems,
          selectedIds: [],
          onSelectionChange: mockOnSelectionChange,
          operations: mockOperations,
        })
      );

      act(() => {
        result.current.handleRowSelection(['1', '2', '3']);
      });

      expect(mockOnSelectionChange).toHaveBeenCalledWith(['1', '2', '3']);
    });
  });

  describe('Batch delete operation', () => {
    it('should show warning when no items are selected', async () => {
      const { result } = renderHook(() =>
        useBatchOperations({
          items: mockItems,
          selectedIds: [],
          onSelectionChange: mockOnSelectionChange,
          operations: mockOperations,
        })
      );

      await act(async () => {
        await result.current.handleBatchDelete();
      });

      expect(message.warning).toHaveBeenCalledWith('请先选择要操作的项目');
      expect(mockOperations.delete).not.toHaveBeenCalled();
    });

    it('should show confirmation dialog before deleting', async () => {
      const { result } = renderHook(() =>
        useBatchOperations({
          items: mockItems,
          selectedIds: ['1', '2'],
          onSelectionChange: mockOnSelectionChange,
          operations: mockOperations,
          confirmations: mockConfirmations,
          showConfirmDialog: true,
        })
      );

      await act(async () => {
        await result.current.handleBatchDelete();
      });

      expect((message as any).Modal.confirm).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '确认批量操作',
          content: 'Delete 2 items?',
          okText: '确定',
          cancelText: '取消',
          okType: 'danger',
        })
      );
    });

    it('should execute delete operation when confirmed', async () => {
      const { result } = renderHook(() =>
        useBatchOperations({
          items: mockItems,
          selectedIds: ['1', '2'],
          onSelectionChange: mockOnSelectionChange,
          operations: mockOperations,
          confirmations: mockConfirmations,
        })
      );

      await act(async () => {
        await result.current.handleBatchDelete();
      });

      expect(mockOperations.delete).toHaveBeenCalledWith(['1', '2']);
    });

    it('should show success message after successful delete', async () => {
      const { result } = renderHook(() =>
        useBatchOperations({
          items: mockItems,
          selectedIds: ['1', '2'],
          onSelectionChange: mockOnSelectionChange,
          operations: mockOperations,
          confirmations: mockConfirmations,
        })
      );

      await act(async () => {
        await result.current.handleBatchDelete();
      });

      expect(message.success).toHaveBeenCalledWith('Delete 2 items?');
    });

    it('should clear selection after successful delete by default', async () => {
      const { result } = renderHook(() =>
        useBatchOperations({
          items: mockItems,
          selectedIds: ['1', '2'],
          onSelectionChange: mockOnSelectionChange,
          operations: mockOperations,
          confirmations: mockConfirmations,
        })
      );

      await act(async () => {
        await result.current.handleBatchDelete();
      });

      expect(mockOnSelectionChange).toHaveBeenCalledWith([]);
    });

    it('should not clear selection if clearSelectionOnSuccess is false', async () => {
      const { result } = renderHook(() =>
        useBatchOperations({
          items: mockItems,
          selectedIds: ['1', '2'],
          onSelectionChange: mockOnSelectionChange,
          operations: mockOperations,
          confirmations: mockConfirmations,
          clearSelectionOnSuccess: false,
        })
      );

      await act(async () => {
        await result.current.handleBatchDelete();
      });

      expect(mockOnSelectionChange).not.toHaveBeenCalledWith([]);
    });

    it('should handle delete operation errors', async () => {
      const error = new Error('Delete failed');
      mockOperations.delete.mockRejectedValue(error);

      const { result } = renderHook(() =>
        useBatchOperations({
          items: mockItems,
          selectedIds: ['1', '2'],
          onSelectionChange: mockOnSelectionChange,
          operations: mockOperations,
          confirmations: mockConfirmations,
          showConfirmDialog: false, // Skip confirmation for error testing
        })
      );

      await act(async () => {
        await result.current.handleBatchDelete();
      });

      expect(message.error).toHaveBeenCalled();
    });

    it('should not show error when user cancels confirmation', async () => {
      ((message as any).Modal.confirm as jest.Mock).mockImplementation(({ onCancel }) => {
        onCancel();
        return Promise.resolve();
      });

      const { result } = renderHook(() =>
        useBatchOperations({
          items: mockItems,
          selectedIds: ['1', '2'],
          onSelectionChange: mockOnSelectionChange,
          operations: mockOperations,
          confirmations: mockConfirmations,
        })
      );

      await act(async () => {
        await result.current.handleBatchDelete();
      });

      expect(message.error).not.toHaveBeenCalled();
      expect(mockOperations.delete).not.toHaveBeenCalled();
    });
  });

  describe('Batch enable/disable operations', () => {
    it('should not provide handleBatchEnable if enable operation is not defined', () => {
      const { result } = renderHook(() =>
        useBatchOperations({
          items: mockItems,
          selectedIds: ['1'],
          onSelectionChange: mockOnSelectionChange,
          operations: { delete: mockOperations.delete },
        })
      );

      expect(result.current.handleBatchEnable).toBeUndefined();
    });

    it('should execute enable operation', async () => {
      const { result } = renderHook(() =>
        useBatchOperations({
          items: mockItems,
          selectedIds: ['1', '2'],
          onSelectionChange: mockOnSelectionChange,
          operations: mockOperations,
          confirmations: mockConfirmations,
          showConfirmDialog: false,
        })
      );

      await act(async () => {
        await result.current.handleBatchEnable!();
      });

      expect(mockOperations.enable).toHaveBeenCalledWith(['1', '2']);
    });

    it('should execute disable operation', async () => {
      const { result } = renderHook(() =>
        useBatchOperations({
          items: mockItems,
          selectedIds: ['1', '2'],
          onSelectionChange: mockOnSelectionChange,
          operations: mockOperations,
          confirmations: mockConfirmations,
          showConfirmDialog: false,
        })
      );

      await act(async () => {
        await result.current.handleBatchDisable!();
      });

      expect(mockOperations.disable).toHaveBeenCalledWith(['1', '2']);
    });
  });

  describe('Custom operations', () => {
    it('should provide custom operations handlers', () => {
      const customOperation = jest.fn();
      const { result } = renderHook(() =>
        useBatchOperations({
          items: mockItems,
          selectedIds: ['1'],
          onSelectionChange: mockOnSelectionChange,
          operations: {
            delete: mockOperations.delete,
            custom: {
              customOp: customOperation,
            },
          },
        })
      );

      expect(result.current.customOperations).toHaveLength(1);
      expect(result.current.customOperations[0].key).toBe('customOp');
    });

    it('should execute custom operation', async () => {
      const customOperation = jest.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() =>
        useBatchOperations({
          items: mockItems,
          selectedIds: ['1', '2'],
          onSelectionChange: mockOnSelectionChange,
          operations: {
            delete: mockOperations.delete,
            custom: {
              archive: customOperation,
            },
          },
          confirmations: {
            archive: 'Archive {count} items?',
          },
          showConfirmDialog: false,
        })
      );

      await act(async () => {
        await result.current.customOperations[0].handler();
      });

      expect(customOperation).toHaveBeenCalledWith(['1', '2']);
    });

    it('should support executeCustomOperation method', async () => {
      const customOperation = jest.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() =>
        useBatchOperations({
          items: mockItems,
          selectedIds: ['1', '2'],
          onSelectionChange: mockOnSelectionChange,
          operations: { delete: mockOperations.delete },
        })
      );

      await act(async () => {
        await result.current.executeCustomOperation('custom', customOperation, 'Custom op {count} items?');
      });

      expect(customOperation).toHaveBeenCalledWith(['1', '2']);
    });
  });

  describe('Loading states', () => {
    it('should set loading state during operation', async () => {
      let resolveDelete: (value: void) => void;
      const deletePromise = new Promise<void>((resolve) => {
        resolveDelete = resolve;
      });
      mockOperations.delete.mockReturnValue(deletePromise);

      const { result } = renderHook(() =>
        useBatchOperations({
          items: mockItems,
          selectedIds: ['1'],
          onSelectionChange: mockOnSelectionChange,
          operations: mockOperations,
          confirmations: mockConfirmations,
          showConfirmDialog: false,
        })
      );

      act(() => {
        result.current.handleBatchDelete();
      });

      expect(result.current.loading.delete).toBe(true);

      await act(async () => {
        resolveDelete!();
      });

      expect(result.current.loading.delete).toBe(false);
    });
  });

  describe('Clear selection', () => {
    it('should provide clearSelection method', () => {
      const { result } = renderHook(() =>
        useBatchOperations({
          items: mockItems,
          selectedIds: ['1', '2'],
          onSelectionChange: mockOnSelectionChange,
          operations: mockOperations,
        })
      );

      act(() => {
        result.current.clearSelection();
      });

      expect(mockOnSelectionChange).toHaveBeenCalledWith([]);
    });
  });

  describe('Message formatting', () => {
    it('should format messages with count variable', async () => {
      const { result } = renderHook(() =>
        useBatchOperations({
          items: mockItems,
          selectedIds: ['1', '2', '3'],
          onSelectionChange: mockOnSelectionChange,
          operations: mockOperations,
          confirmations: {
            delete: 'Delete exactly {count} items now',
          },
          showConfirmDialog: false,
        })
      );

      await act(async () => {
        await result.current.handleBatchDelete();
      });

      expect(message.success).toHaveBeenCalledWith('Delete exactly 3 items now');
    });

    it('should use default message when no confirmation provided', async () => {
      const { result } = renderHook(() =>
        useBatchOperations({
          items: mockItems,
          selectedIds: ['1'],
          onSelectionChange: mockOnSelectionChange,
          operations: mockOperations,
          showConfirmDialog: false,
        })
      );

      await act(async () => {
        await result.current.handleBatchDelete();
      });

      expect(message.success).toHaveBeenCalledWith('成功处理 1 个项目');
    });
  });

  describe('Success and error callbacks', () => {
    it('should call onSuccess callback when operation succeeds', async () => {
      const onSuccess = jest.fn();
      const { result } = renderHook(() =>
        useBatchOperations({
          items: mockItems,
          selectedIds: ['1'],
          onSelectionChange: mockOnSelectionChange,
          operations: mockOperations,
          confirmations: mockConfirmations,
          onSuccess,
          showConfirmDialog: false,
        })
      );

      await act(async () => {
        await result.current.handleBatchDelete();
      });

      expect(onSuccess).toHaveBeenCalled();
    });

    it('should call onError callback when operation fails', async () => {
      const onError = jest.fn();
      const error = new Error('Operation failed');
      mockOperations.delete.mockRejectedValue(error);

      const { result } = renderHook(() =>
        useBatchOperations({
          items: mockItems,
          selectedIds: ['1'],
          onSelectionChange: mockOnSelectionChange,
          operations: mockOperations,
          onError,
          showConfirmDialog: false,
        })
      );

      await act(async () => {
        await result.current.handleBatchDelete();
      });

      expect(onError).toHaveBeenCalled();
    });
  });
});
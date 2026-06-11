/**
 * Operation Module Batch Operations Hook
 * 工序模块专用的批量操作Hook
 */

import { useOperationStore } from '../store';
import { useBatchOperations } from '../../../../shared/hooks/useBatchOperations';

/**
 * 工序批量操作Hook
 * 简化工序模块的批量操作调用
 */
export const useOperationBatchOperations = () => {
  const store = useOperationStore();

  return useBatchOperations({
    items: store.operations,
    selectedIds: store.selectedIds,
    onSelectionChange: store.setSelectedIds,
    operations: {
      delete: store.deleteOperations,
      activate: undefined, // updateStatus handles this
      deactivate: undefined,
    },
    confirmations: {
      delete: '您确定要删除选中的 {count} 个工序吗？此操作不可恢复！',
      activate: '您确定要生效选中的 {count} 个工序吗？',
      deactivate: '您确定要停用选中的 {count} 个工序吗？停用后这些工序将无法用于生产。',
    },
  });
};
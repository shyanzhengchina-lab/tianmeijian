/**
 * QcItem Module Batch Operations Hook
 * 质检项目模块专用的批量操作Hook
 */

import { useQcItemStore } from '../store';
import { useBatchOperations } from '../../../../shared/hooks/useBatchOperations';

/**
 * 质检项目批量操作Hook
 * 简化质检项目模块的批量操作调用
 */
export const useQcItemBatchOperations = () => {
  const store = useQcItemStore();

  return useBatchOperations({
    items: store.qcItems,
    selectedIds: store.selectedIds,
    onSelectionChange: store.setSelectedIds,
    operations: {
      delete: store.deleteQcItems,
      activate: undefined, // updateStatus handles this
      deactivate: undefined,
    },
    confirmations: {
      delete: '您确定要删除选中的 {count} 个质检项目吗？此操作不可恢复！',
      activate: '您确定要启用选中的 {count} 个质检项目吗？',
      deactivate: '您确定要停用选中的 {count} 个质检项目吗？停用后这些项目将无法使用。',
    },
  });
};
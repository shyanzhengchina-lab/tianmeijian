/**
 * QcScheme Module Batch Operations Hook
 * 质检方案模块专用的批量操作Hook
 */

import { useQcSchemeStore } from '../store';
import { useBatchOperations } from '../../../../shared/hooks/useBatchOperations';

/**
 * 质检方案批量操作Hook
 * 简化质检方案模块的批量操作调用
 */
export const useQcSchemeBatchOperations = () => {
  const store = useQcSchemeStore();

  return useBatchOperations({
    items: store.qcSchemes,
    selectedIds: store.selectedIds,
    onSelectionChange: store.setSelectedIds,
    operations: {
      delete: store.deleteQcSchemes,
      activate: undefined, // updateStatus handles this
      deactivate: undefined,
    },
    confirmations: {
      delete: '您确定要删除选中的 {count} 个质检方案吗？此操作不可恢复！',
      activate: '您确定要启用选中的 {count} 个质检方案吗？',
      deactivate: '您确定要停用选中的 {count} 个质检方案吗？停用后这些方案将无法使用。',
    },
  });
};
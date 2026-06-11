/**
 * BOM Module Batch Operations Hook
 * 物料清单模块专用的批量操作Hook
 */

import { useBomStore } from '../store/bomStore';
import { useBatchOperations } from '../../../../shared/hooks/useBatchOperations';

/**
 * BOM批量操作Hook
 * 简化BOM模块的批量操作调用
 */
export const useBomBatchOperations = () => {
  const store = useBomStore();

  return useBatchOperations({
    items: store.boms,
    selectedIds: store.selectedIds,
    onSelectionChange: store.setSelectedIds,
    operations: {
      delete: store.deleteBoms,
      enable: undefined, // updateBomStatus handles this
      disable: undefined,
    },
    confirmations: {
      delete: '您确定要删除选中的 {count} 个BOM吗？此操作不可恢复！',
      enable: '您确定要启用选中的 {count} 个BOM吗？',
      disable: '您确定要禁用选中的 {count} 个BOM吗？禁用后这些BOM将无法使用。',
    },
  });
};
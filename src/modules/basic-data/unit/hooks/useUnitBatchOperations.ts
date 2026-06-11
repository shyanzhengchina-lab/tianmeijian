/**
 * Unit Module Batch Operations Hook
 * 计量单位模块专用的批量操作Hook
 */

import { useUnitStore } from '../store';
import { useBatchOperations } from '../../../../shared/hooks/useBatchOperations';

/**
 * 计量单位批量操作Hook
 * 简化计量单位模块的批量操作调用
 */
export const useUnitBatchOperations = () => {
  const store = useUnitStore();

  return useBatchOperations({
    items: store.units,
    selectedIds: store.selectedIds,
    onSelectionChange: store.setSelectedIds,
    operations: {
      delete: store.deleteUnits,
      enable: undefined, // updateStatus handles this
      disable: undefined,
    },
    confirmations: {
      delete: '您确定要删除选中的 {count} 个计量单位吗？此操作不可恢复！',
    },
  });
};
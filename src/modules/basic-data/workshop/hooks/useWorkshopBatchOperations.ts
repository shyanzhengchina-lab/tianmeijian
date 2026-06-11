/**
 * Workshop Module Batch Operations Hook
 * 车间模块专用的批量操作Hook
 */

import { useWorkshopStore } from '../store';
import { useBatchOperations } from '../../../../shared/hooks/useBatchOperations';

/**
 * 车间批量操作Hook
 * 简化车间模块的批量操作调用
 */
export const useWorkshopBatchOperations = () => {
  const store = useWorkshopStore();

  return useBatchOperations({
    items: store.workshops,
    selectedIds: store.selectedIds,
    onSelectionChange: store.setSelectedIds,
    operations: {
      delete: store.deleteWorkshops,
      enable: undefined, // updateStatus handles this
      disable: undefined,
    },
    confirmations: {
      delete: '您确定要删除选中的 {count} 个车间吗？此操作不可恢复！',
      enable: '您确定要启用选中的 {count} 个车间吗？',
      disable: '您确定要禁用选中的 {count} 个车间吗？禁用后这些车间将无法使用。',
    },
  });
};
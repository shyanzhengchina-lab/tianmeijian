/**
 * WorkCenter Module Batch Operations Hook
 * 工作中心模块专用的批量操作Hook
 */

import { useWorkCenterStore } from '../store';
import { useBatchOperations } from '../../../../shared/hooks/useBatchOperations';

/**
 * 工作中心批量操作Hook
 * 简化工作中心模块的批量操作调用
 */
export const useWorkCenterBatchOperations = () => {
  const store = useWorkCenterStore();

  return useBatchOperations({
    items: store.workCenters,
    selectedIds: store.selectedIds,
    onSelectionChange: store.setSelectedIds,
    operations: {
      delete: store.deleteWorkCenters,
      enable: undefined, // updateStatus handles this
      disable: undefined,
    },
    confirmations: {
      delete: '您确定要删除选中的 {count} 个工作中心吗？此操作不可恢复！',
      enable: '您确定要启用选中的 {count} 个工作中心吗？',
      disable: '您确定要禁用选中的 {count} 个工作中心吗？禁用后这些工作中心将无法使用。',
    },
  });
};
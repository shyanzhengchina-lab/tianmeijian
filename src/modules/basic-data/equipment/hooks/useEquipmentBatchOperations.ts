/**
 * Equipment Module Batch Operations Hook
 * 设备模块专用的批量操作Hook
 */

import { useEquipmentStore } from '../store';
import { useBatchOperations } from '../../../../shared/hooks/useBatchOperations';

/**
 * 设备批量操作Hook
 * 简化设备模块的批量操作调用
 */
export const useEquipmentBatchOperations = () => {
  const store = useEquipmentStore();

  return useBatchOperations({
    items: store.equipments,
    selectedIds: store.selectedIds,
    onSelectionChange: store.setSelectedIds,
    operations: {
      delete: store.deleteEquipments,
      activate: undefined, // updateStatus handles this
      deactivate: undefined,
    },
    confirmations: {
      delete: '您确定要删除选中的 {count} 个设备吗？此操作不可恢复！',
      activate: '您确定要启用选中的 {count} 个设备吗？',
      deactivate: '您确定要停用选中的 {count} 个设备吗？停用后这些设备将无法使用。',
    },
  });
};
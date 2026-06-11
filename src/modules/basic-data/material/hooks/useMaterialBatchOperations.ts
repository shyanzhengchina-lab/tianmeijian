/**
 * Material Module Batch Operations Hook
 * 物料模块专用的批量操作Hook
 */

import { useMaterialStore } from '../store/materialStore';
import { useBatchOperations } from '../../../../shared/hooks/useBatchOperations';

/**
 * 物料批量操作Hook
 * 简化物料模块的批量操作调用
 */
export const useMaterialBatchOperations = () => {
  const store = useMaterialStore();

  return useBatchOperations({
    items: store.materials,
    selectedIds: store.selectedIds,
    onSelectionChange: store.setSelectedIds,
    operations: {
      delete: store.batchDeleteMaterials,
      enable: store.batchEnableMaterials,
      disable: store.batchDisableMaterials,
    },
    confirmations: {
      delete: '您确定要删除选中的 {count} 个物料吗？此操作不可恢复！',
      enable: '您确定要启用选中的 {count} 个物料吗？',
      disable: '您确定要禁用选中的 {count} 个物料吗？禁用后这些物料将无法使用。',
    },
  });
};
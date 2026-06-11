/**
 * Team Module Batch Operations Hook
 * 班组模块专用的批量操作Hook
 */

import { useTeamStore } from '../store';
import { useBatchOperations } from '../../../../shared/hooks/useBatchOperations';

/**
 * 班组批量操作Hook
 * 简化班组模块的批量操作调用
 */
export const useTeamBatchOperations = () => {
  const store = useTeamStore();

  return useBatchOperations({
    items: store.teams,
    selectedIds: store.selectedIds,
    onSelectionChange: store.setSelectedIds,
    operations: {
      delete: store.deleteTeams,
      enable: undefined, // updateStatus handles this
      disable: undefined,
    },
    confirmations: {
      delete: '您确定要删除选中的 {count} 个班组吗？此操作不可恢复！',
      enable: '您确定要启用选中的 {count} 个班组吗？',
      disable: '您确定要禁用选中的 {count} 个班组吗？禁用后这些班组将无法使用。',
    },
  });
};
/**
 * Employee Module Batch Operations Hook
 * 员工模块专用的批量操作Hook
 */

import { useEmployeeStore } from '../store';
import { useBatchOperations } from '../../../../shared/hooks/useBatchOperations';

/**
 * 员工批量操作Hook
 * 简化员工模块的批量操作调用
 */
export const useEmployeeBatchOperations = () => {
  const store = useEmployeeStore();

  return useBatchOperations({
    items: store.employees,
    selectedIds: store.selectedIds,
    onSelectionChange: store.setSelectedIds,
    operations: {
      delete: store.deleteEmployees,
      activate: undefined, // updateStatus handles this
      custom: {
        leave: async (ids) => store.updateStatus(ids, 'LEAVE'),
        resign: async (ids) => store.updateStatus(ids, 'RESIGNED'),
        recover: async (ids) => store.updateStatus(ids, 'ACTIVE'),
      },
    },
    confirmations: {
      delete: '您确定要删除选中的 {count} 个员工吗？此操作不可恢复！',
      leave: '您确定要将选中的 {count} 个员工设置为请假状态吗？',
      resign: '您确定要将选中的 {count} 个员工设置为离职状态吗？此操作不可撤销！',
      recover: '您确定要恢复选中的 {count} 个员工吗？',
    },
  });
};
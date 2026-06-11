/**
 * Employee Batch Actions Component
 * Handles batch operations for selected employees
 */

import { useCallback } from 'react';
import { message, Modal } from 'antd';

interface EmployeeBatchActionsProps {
  selectedCount: number;
  onBatchActivate: () => void;
  onBatchLeave: () => void;
  onBatchResign: () => void;
  onBatchDelete: () => void;
}

interface BatchAction {
  key: string;
  label: string;
  onClick: () => void;
  danger: boolean;
}

export const EmployeeBatchActions = ({
  selectedCount,
  onBatchActivate,
  onBatchLeave,
  onBatchResign,
  onBatchDelete,
}: EmployeeBatchActionsProps): BatchAction[] => {
  const handleBatchActivate = useCallback(() => {
    if (selectedCount === 0) {
      message.warning('请先选择员工');
      return;
    }

    Modal.confirm({
      title: '确认批量恢复',
      content: `您确定要恢复选中的 ${selectedCount} 个员工吗？`,
      okText: '确定恢复',
      cancelText: '取消',
      centered: true,
      onOk: () => {
        onBatchActivate();
      },
    });
  }, [selectedCount, onBatchActivate]);

  const handleBatchLeave = useCallback(() => {
    if (selectedCount === 0) {
      message.warning('请先选择员工');
      return;
    }

    Modal.confirm({
      title: '确认批量请假',
      content: `您确定要将选中的 ${selectedCount} 个员工设置为请假状态吗？`,
      okText: '确定请假',
      cancelText: '取消',
      centered: true,
      onOk: () => {
        onBatchLeave();
      },
    });
  }, [selectedCount, onBatchLeave]);

  const handleBatchResign = useCallback(() => {
    if (selectedCount === 0) {
      message.warning('请先选择员工');
      return;
    }

    Modal.confirm({
      title: '确认批量离职',
      content: `您确定要将选中的 ${selectedCount} 个员工设置为离职状态吗？此操作不可撤销！`,
      okText: '确定离职',
      okType: 'danger',
      cancelText: '取消',
      centered: true,
      onOk: () => {
        onBatchResign();
      },
    });
  }, [selectedCount, onBatchResign]);

  const handleBatchDelete = useCallback(() => {
    if (selectedCount === 0) {
      message.warning('请先选择员工');
      return;
    }

    Modal.confirm({
      title: '确认批量删除',
      content: `您确定要删除选中的 ${selectedCount} 个员工吗？此操作不可恢复！`,
      okText: '确定删除',
      okType: 'danger',
      cancelText: '取消',
      centered: true,
      onOk: () => {
        onBatchDelete();
      },
    });
  }, [selectedCount, onBatchDelete]);

  return [
    { key: 'activate', label: '恢复', onClick: handleBatchActivate, danger: true },
    { key: 'leave', label: '请假', onClick: handleBatchLeave, danger: true },
    { key: 'resign', label: '离职', onClick: handleBatchResign, danger: true },
    { key: 'delete', label: '删除', onClick: handleBatchDelete, danger: true },
  ];
};
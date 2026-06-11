/**
 * Employee Module Universal CRUD Example
 * Demonstrates how to use UniversalCRUD component for Employee management
 */

import React, { useMemo, useCallback } from 'react';
import { UniversalCRUD } from '../index';
import { useEmployeeStore } from '@/modules/basic-data/employee/store';
import type {
  StatisticItem,
  BatchAction,
  UniversalCRUDProps,
} from '../types';
import {
  UserOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  LogoutOutlined,
  DeleteOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { Modal, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { StatusBadge } from '../../StatusBadge';
import { EMPLOYEE_STATUS_MAP } from '@/modules/basic-data/employee/types';

/**
 * Employee CRUD Component using UniversalCRUD
 * Shows custom actions and permissions
 */
export const EmployeeCRUD: React.FC = () => {
  const store = useEmployeeStore();

  // ===== Custom Column Definition =====
  const employeeColumns: ColumnsType<any> = useMemo(() => [
    {
      title: '工号',
      dataIndex: 'code',
      key: 'code',
      width: 120,
      fixed: 'left',
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 100,
      fixed: 'left',
      render: (text: string, record: any) => (
        <span>
          <UserOutlined style={{ color: '#1677ff', marginRight: 4 }} />
          {text}
          {record.role === '班组长' && <span style={{ marginLeft: 4 }}>★</span>}
        </span>
      ),
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 100,
      render: (role: string) => {
        const roleConfig: any = {
          '班组长': { label: '班组长', color: '#d46b08' },
          '操作工': { label: '操作工', color: '#1677ff' },
          'QC': { label: 'QC', color: '#52c41a' },
        };
        const config = roleConfig[role] || { label: role, color: '#8c8c8c' };
        return (
          <span style={{
            padding: '2px 8px',
            borderRadius: '4px',
            background: `${config.color}15`,
            color: config.color,
            fontSize: '12px',
            fontWeight: 600
          }}>
            {config.label}
          </span>
        );
      },
    },
    {
      title: '班组',
      dataIndex: 'teamName',
      key: 'teamName',
      width: 120,
      render: (teamName: string) => (
        <span>
          <TeamOutlined style={{ color: '#722ed1', marginRight: 4 }} />
          {teamName || '未分配'}
        </span>
      ),
    },
    {
      title: '联系电话',
      dataIndex: 'phone',
      key: 'phone',
      width: 130,
    },
    {
      title: '身份证号',
      dataIndex: 'idCard',
      key: 'idCard',
      width: 180,
      ellipsis: true,
    },
    {
      title: '入职日期',
      dataIndex: 'entryDate',
      key: 'entryDate',
      width: 120,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <StatusBadge status={status} statusMap={EMPLOYEE_STATUS_MAP} />
      ),
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      width: 150,
      ellipsis: true,
      render: (remark: string) => remark || '—',
    },
  ], []);

  // ===== Statistics Configuration =====
  const statistics: StatisticItem[] = useMemo(() => [
    {
      label: '员工总数',
      value: store.statistics?.totalCount || 0,
      icon: <UserOutlined />,
      color: '#1677ff',
    },
    {
      label: '在岗',
      value: store.statistics?.activeCount || 0,
      icon: <CheckCircleOutlined />,
      color: '#52c41a',
    },
    {
      label: '请假',
      value: store.statistics?.leaveCount || 0,
      icon: <ClockCircleOutlined />,
      color: '#faad14',
    },
    {
      label: '离职',
      value: store.statistics?.resignedCount || 0,
      icon: <LogoutOutlined />,
      color: '#f5222d',
    },
  ], [store.statistics]);

  // ===== Custom Row Actions =====
  const customRowActions = [
    {
      key: 'leave',
      label: '请假',
      icon: <ClockCircleOutlined />,
      onClick: async (record: any) => {
        try {
          const leaveDate = new Date().toISOString().split('T')[0];
          await store.leaveEmployee(record.id, leaveDate);
          message.success(`员工 ${record.name} 已设置为请假状态`);
        } catch (error) {
          message.error('设置请假失败');
        }
      },
      show: (record: any) => record.status === 'ACTIVE',
    },
    {
      key: 'resign',
      label: '离职',
      icon: <LogoutOutlined />,
      onClick: async (record: any) => {
        try {
          const resignDate = new Date().toISOString().split('T')[0];
          await store.resignEmployee(record.id, resignDate);
          message.success(`员工 ${record.name} 已设置为离职状态`);
        } catch (error) {
          message.error('设置离职失败');
        }
      },
      danger: true,
      show: (record: any) => record.status === 'ACTIVE',
    },
    {
      key: 'activate',
      label: '恢复',
      icon: <CheckCircleOutlined />,
      onClick: async (record: any) => {
        try {
          await store.activateEmployee(record.id);
          message.success(`员工 ${record.name} 已恢复在岗状态`);
        } catch (error) {
          message.error('恢复员工失败');
        }
      },
      show: (record: any) => record.status === 'LEAVE' || record.status === 'RESIGNED',
    },
  ];

  // ===== Batch Actions Configuration =====
  const batchActions: BatchAction[] = useMemo(() => [
    {
      key: 'batch-activate',
      label: '批量恢复',
      onClick: async () => {
        Modal.confirm({
          title: '确认批量恢复',
          content: `您确定要恢复选中的 ${store.selectedIds.length} 个员工吗？`,
          okText: '确定恢复',
          cancelText: '取消',
          centered: true,
          onOk: async () => {
            try {
              await store.updateStatus(store.selectedIds, 'ACTIVE');
              message.success(`成功恢复 ${store.selectedIds.length} 个员工`);
            } catch (error) {
              message.error('批量恢复失败');
              throw error;
            }
          },
        });
      },
    },
    {
      key: 'batch-leave',
      label: '批量请假',
      onClick: async () => {
        Modal.confirm({
          title: '确认批量请假',
          content: `您确定要将选中的 ${store.selectedIds.length} 个员工设置为请假状态吗？`,
          okText: '确定请假',
          cancelText: '取消',
          centered: true,
          onOk: async () => {
            try {
              await store.updateStatus(store.selectedIds, 'LEAVE');
              message.success(`成功将 ${store.selectedIds.length} 个员工设置为请假状态`);
            } catch (error) {
              message.error('批量请假失败');
              throw error;
            }
          },
        });
      },
    },
    {
      key: 'batch-resign',
      label: '批量离职',
      onClick: async () => {
        Modal.confirm({
          title: '确认批量离职',
          content: `您确定要将选中的 ${store.selectedIds.length} 个员工设置为离职状态吗？此操作不可撤销！`,
          okText: '确定离职',
          okType: 'danger',
          cancelText: '取消',
          centered: true,
          onOk: async () => {
            try {
              await store.updateStatus(store.selectedIds, 'RESIGNED');
              message.success(`成功将 ${store.selectedIds.length} 个员工设置为离职状态`);
            } catch (error) {
              message.error('批量离职失败');
              throw error;
            }
          },
        });
      },
      danger: true,
    },
    {
      key: 'batch-delete',
      label: '批量删除',
      icon: <DeleteOutlined />,
      onClick: async () => {
        Modal.confirm({
          title: '确认批量删除',
          content: `您确定要删除选中的 ${store.selectedIds.length} 个员工吗？此操作不可恢复！`,
          okText: '确定删除',
          okType: 'danger',
          cancelText: '取消',
          centered: true,
          onOk: async () => {
            try {
              await store.deleteEmployees(store.selectedIds);
              message.success(`成功删除 ${store.selectedIds.length} 个员工`);
            } catch (error) {
              message.error('批量删除失败');
              throw error;
            }
          },
        });
      },
      danger: true,
    },
  ], [store.selectedIds]);

  // ===== Event Handlers =====
  const handleCreate = useCallback(() => {
    store.setCurrentEmployee(null);
  }, [store]);

  const handleUpdate = useCallback((employee: any) => {
    store.setCurrentEmployee(employee);
  }, [store]);

  const handleDelete = useCallback(async (employee: any) => {
    try {
      await store.deleteEmployees([employee.id]);
      message.success('删除成功');
    } catch (error) {
      message.error('删除失败');
      throw error;
    }
  }, [store]);

  const handleView = useCallback((employee: any) => {
    store.setCurrentEmployee(employee);
  }, [store]);

  const handleSearch = useCallback((query: string) => {
    store.setFilters({ ...store.filters, keyword: query });
    store.loadEmployees();
  }, [store]);

  const handleRefresh = useCallback(() => {
    store.loadEmployees();
    store.loadStatistics();
  }, [store]);

  // ===== Render =====
  return (
    <UniversalCRUD
      data={store.employees}
      loading={store.loading}
      totalCount={store.pagination?.total}
      columns={employeeColumns}
      rowKey="id"
      rowSelection={{
        selectedRowKeys: store.selectedIds,
        onChange: (keys: React.Key[]) => store.setSelectedIds(keys as string[]),
      } as any}
      batchActions={batchActions}
      showBatchActions={true}
      statistics={statistics}
      showStatistics={true}
      statisticsLayout="horizontal"
      searchable={true}
      searchPlaceholder="搜索工号、姓名..."
      onSearch={handleSearch}
      onCreate={handleCreate}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
      onView={handleView}
      refreshable={true}
      onRefresh={handleRefresh}
      paginatable={true}
      pagination={{
        current: store.pagination?.current || 1,
        pageSize: store.pagination?.pageSize || 15,
        total: store.pagination?.total || 0,
        onChange: (page: number, pageSize: number) => {
          store.setFilters({ current: page, pageSize });
          store.loadEmployees();
        },
      }}
      tableConfig={{
        size: 'middle',
        bordered: true,
        sticky: true,
        scroll: { x: 1400 },
      }}
      title="员工档案"
      rowActions={customRowActions}
      className="employee-crud"
    />
  );
};

export default EmployeeCRUD;

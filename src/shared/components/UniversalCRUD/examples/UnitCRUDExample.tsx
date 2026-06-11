/**
 * Unit Module Universal CRUD Example
 * Demonstrates how to use UniversalCRUD component for Unit management
 */

import React, { useMemo, useCallback } from 'react';
import { UniversalCRUD } from '../index';
import { useUnitStore } from '@/modules/basic-data/unit/store';
import type {
  StatisticItem,
  BatchAction,
  UniversalCRUDProps,
} from '../types';
import {
  DatabaseOutlined,
  CheckCircleOutlined,
  StopOutlined,
  FolderOutlined,
} from '@ant-design/icons';
import { Modal, message, Tag } from 'antd';
import { UNIT_STATUS_MAP } from '@/modules/basic-data/unit/types';
import type { UnitItem } from '@/modules/basic-data/unit/types';

/**
 * Unit CRUD Component using UniversalCRUD
 * Shows tree structure integration and custom actions
 */
export const UnitCRUD: React.FC = () => {
  const store = useUnitStore();

  // ===== Custom Column Definition =====
  const unitColumns = useMemo(() => [
    {
      title: '单位编码',
      dataIndex: 'code',
      key: 'code',
      width: 120,
      fixed: 'left' as const,
    },
    {
      title: '单位名称',
      dataIndex: 'name',
      key: 'name',
      width: 120,
      fixed: 'left' as const,
    },
    {
      title: '英文名称',
      dataIndex: 'enName',
      key: 'enName',
      width: 150,
    },
    {
      title: '单位分组',
      dataIndex: 'groupName',
      key: 'groupName',
      width: 120,
      render: (groupName: string) => (
        <span>
          <FolderOutlined style={{ color: '#FAAD14', marginRight: 4 }} />
          {groupName || '—'}
        </span>
      ),
    },
    {
      title: '换算方法',
      dataIndex: 'method',
      key: 'method',
      width: 100,
      render: (method: string) => {
        const methodMap: any = {
          '四舍五入': { label: '四舍五入', color: '#1677ff' },
          '向上取整': { label: '向上取整', color: '#52c41a' },
          '向下取整': { label: '向下取整', color: '#faad14' },
        };
        const config = methodMap[method] || { label: method, color: '#8c8c8c' };
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
      title: '精度',
      dataIndex: 'precision',
      key: 'precision',
      width: 80,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => {
        const config = UNIT_STATUS_MAP[status as 'active' | 'disabled'];
        return (
          <Tag color={config?.color || 'default'} style={{ fontSize: 12 }}>
            {config?.label || status}
          </Tag>
        );
      },
    },
    {
      title: '基础单位',
      dataIndex: 'isBase',
      key: 'isBase',
      width: 100,
      align: 'center' as 'center',
      render: (isBase: boolean) => (
        <Tag color={isBase ? 'blue' : 'default'} style={{ fontSize: 12 }}>
          {isBase ? '是' : '否'}
        </Tag>
      ),
    },
  ], []);

  // ===== Statistics Configuration =====
  const statistics: StatisticItem[] = useMemo(() => [
    {
      label: '单位总数',
      value: store.units.length,
      icon: <DatabaseOutlined />,
      color: '#1677ff',
    },
    {
      label: '已启用',
      value: store.units.filter((u: UnitItem) => u.status === 'active').length,
      icon: <CheckCircleOutlined />,
      color: '#52c41a',
    },
    {
      label: '已禁用',
      value: store.units.filter((u: UnitItem) => u.status === 'disabled').length,
      icon: <StopOutlined />,
      color: '#ff4d4f',
    },
    {
      label: '基础单位',
      value: store.units.filter((u: UnitItem) => u.isBase).length,
      color: '#722ed1',
    },
  ], [store.units]);

  // ===== Custom Row Actions =====
  const customRowActions = [
    {
      key: 'set-base',
      label: '设为基础',
      icon: <CheckCircleOutlined />,
      onClick: async (record: any) => {
        try {
          await store.setBaseUnit(record.id);
          message.success(`已设置 ${record.name} 为基础单位`);
        } catch (error) {
          message.error('设置基础单位失败');
        }
      },
      show: (record: any) => !record.isBase,
    },
    {
      key: 'unset-base',
      label: '取消基础',
      icon: <StopOutlined />,
      onClick: async (record: any) => {
        try {
          await store.unsetBaseUnit(record.id);
          message.success(`已取消 ${record.name} 的基础单位`);
        } catch (error) {
          message.error('取消基础单位失败');
        }
      },
      show: (record: any) => record.isBase,
    },
  ];

  // ===== Batch Actions Configuration =====
  const batchActions: BatchAction[] = useMemo(() => [
    {
      key: 'batch-enable',
      label: '批量启用',
      onClick: async () => {
        Modal.confirm({
          title: '确认批量启用',
          content: `您确定要启用选中的 ${store.selectedIds.length} 个单位吗？`,
          okText: '确定启用',
          cancelText: '取消',
          centered: true,
          onOk: async () => {
            try {
              await store.updateStatus(store.selectedIds, 'active');
              message.success(`成功启用 ${store.selectedIds.length} 个单位`);
            } catch (error) {
              message.error('启用单位失败');
              throw error;
            }
          },
        });
      },
    },
    {
      key: 'batch-disable',
      label: '批量禁用',
      onClick: async () => {
        Modal.confirm({
          title: '确认批量禁用',
          content: `您确定要禁用选中的 ${store.selectedIds.length} 个单位吗？`,
          okText: '确定禁用',
          okType: 'danger',
          cancelText: '取消',
          centered: true,
          onOk: async () => {
            try {
              await store.updateStatus(store.selectedIds, 'disabled');
              message.success(`成功禁用 ${store.selectedIds.length} 个单位`);
            } catch (error) {
              message.error('禁用单位失败');
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
    store.setCurrentUnit(null);
  }, [store]);

  const handleUpdate = useCallback((unit: any) => {
    store.setCurrentUnit(unit);
  }, [store]);

  const handleDelete = useCallback(async (unit: any) => {
    try {
      await store.deleteUnits([unit.id]);
      message.success('删除成功');
    } catch (error) {
      message.error('删除失败');
      throw error;
    }
  }, [store]);

  const handleSearch = useCallback((query: string) => {
    store.setFilters({ ...store.filters, keyword: query });
    store.loadUnits();
  }, [store]);

  const handleRefresh = useCallback(() => {
    store.loadUnits();
  }, [store]);

  // ===== Render =====
  return (
    <UniversalCRUD
      data={store.units}
      loading={store.loading}
      columns={unitColumns}
      rowKey="id"
      rowSelection={{
        selectedRowKeys: store.selectedIds,
        onChange: (keys: React.Key[]) => store.setSelectedIds(keys as string[]),
      }}
      batchActions={batchActions}
      showBatchActions={true}
      statistics={statistics}
      showStatistics={true}
      statisticsLayout="vertical"
      searchable={true}
      searchPlaceholder="搜索单位编码、名称..."
      onSearch={handleSearch}
      onCreate={handleCreate}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
      refreshable={true}
      onRefresh={handleRefresh}
      paginatable={true}
      pagination={{
        current: store.pagination?.current || 1,
        pageSize: store.pagination?.pageSize || 15,
        total: store.units.length,
        onChange: (page: number, pageSize: number) => {
          store.setFilters({ current: page, pageSize });
          store.loadUnits();
        },
      }}
      tableConfig={{
        size: 'middle',
        bordered: true,
        sticky: true,
        scroll: { x: 1000 },
      }}
      title="计量单位"
      rowActions={customRowActions}
      className="unit-crud"
    />
  );
};

export default UnitCRUD;

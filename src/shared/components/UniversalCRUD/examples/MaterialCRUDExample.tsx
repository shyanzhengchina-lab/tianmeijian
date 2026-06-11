/**
 * Material Module Universal CRUD Example
 * Demonstrates how to use UniversalCRUD component for Material management
 */

import React, { useMemo, useCallback } from 'react';
import { UniversalCRUD } from '../index';
import { useMaterialStore } from '@/modules/basic-data/material/store';
import type {
  StatisticItem,
  BatchAction,
} from '../types';
import {
  DeleteOutlined,
  CheckCircleOutlined,
  StopOutlined,
  DatabaseOutlined,
} from '@ant-design/icons';
import { Modal, message } from 'antd';
import { MATERIAL_COLUMNS } from '@/modules/basic-data/material/types';

/**
 * Material CRUD Component using UniversalCRUD
 * Complete implementation showing all features
 */
export const MaterialCRUD: React.FC = () => {
  const store = useMaterialStore();

  // ===== Statistics Configuration =====
  const statistics: StatisticItem[] = useMemo(() => [
    {
      label: '总物料数',
      value: store.pagination?.total || 0,
      icon: <DatabaseOutlined />,
      color: '#1890ff',
    },
    {
      label: '已启用',
      value: (store.materials || []).filter((m: any) => m.status === 'active').length,
      icon: <CheckCircleOutlined />,
      color: '#52c41a',
    },
    {
      label: '已禁用',
      value: (store.materials || []).filter((m: any) => m.status === 'inactive').length,
      icon: <StopOutlined />,
      color: '#ff4d4f',
    },
    {
      label: '草稿',
      value: (store.materials || []).filter((m: any) => m.status === 'draft').length,
      color: '#faad14',
    },
  ], [store.materials, store.pagination]);

  // ===== Batch Actions Configuration =====
  const batchActions: BatchAction[] = useMemo(() => [
    {
      key: 'batch-delete',
      label: '批量删除',
      icon: <DeleteOutlined />,
      onClick: async () => {
        Modal.confirm({
          title: '确认批量删除',
          content: `您确定要删除选中的 ${store.selectedIds.length} 个物料吗？此操作不可恢复！`,
          okText: '确定删除',
          okType: 'danger',
          cancelText: '取消',
          centered: true,
          onOk: async () => {
            try {
              await store.deleteMaterials(store.selectedIds);
              message.success(`成功删除 ${store.selectedIds.length} 个物料`);
            } catch (error) {
              message.error('批量删除失败');
              throw error;
            }
          },
        });
      },
      danger: true,
    },
    {
      key: 'batch-enable',
      label: '批量启用',
      icon: <CheckCircleOutlined />,
      onClick: async () => {
        Modal.confirm({
          title: '确认批量启用',
          content: `您确定要启用选中的 ${store.selectedIds.length} 个物料吗？`,
          okText: '确定启用',
          cancelText: '取消',
          centered: true,
          onOk: async () => {
            try {
              await store.updateStatus(store.selectedIds, 'active');
              message.success(`成功启用 ${store.selectedIds.length} 个物料`);
            } catch (error) {
              message.error('批量启用失败');
              throw error;
            }
          },
        });
      },
    },
    {
      key: 'batch-disable',
      label: '批量禁用',
      icon: <StopOutlined />,
      onClick: async () => {
        Modal.confirm({
          title: '确认批量禁用',
          content: `您确定要禁用选中的 ${store.selectedIds.length} 个物料吗？`,
          okText: '确定禁用',
          okType: 'danger',
          cancelText: '取消',
          centered: true,
          onOk: async () => {
            try {
              await store.updateStatus(store.selectedIds, 'inactive');
              message.success(`成功禁用 ${store.selectedIds.length} 个物料`);
            } catch (error) {
              message.error('批量禁用失败');
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
    store.setCurrentMaterial(null);
  }, [store]);

  const handleUpdate = useCallback((material: any) => {
    store.setCurrentMaterial(material);
  }, [store]);

  const handleDelete = useCallback(async (material: any) => {
    try {
      await store.deleteMaterials([material.id]);
      message.success('删除成功');
    } catch (error) {
      message.error('删除失败');
      throw error;
    }
  }, [store]);

  const handleSearch = useCallback((query: string) => {
    store.setFilters({ ...store.filters, keyword: query });
    store.loadMaterials();
  }, [store]);

  const handleRefresh = useCallback(() => {
    store.loadMaterials();
  }, [store]);

  const handleExport = useCallback(() => {
    message.info('导出功能待实现');
  }, []);

  const handleImport = useCallback(() => {
    message.info('导入功能待实现');
  }, []);

  // ===== Render =====
  return (
    <UniversalCRUD
      data={store.materials}
      loading={store.loading}
      totalCount={store.pagination?.total}
      columns={MATERIAL_COLUMNS as any}
      rowKey="id"
      rowSelection={{
        selectedRowKeys: store.selectedIds,
        onChange: (keys: React.Key[]) => store.setSelectedIds(keys as string[]),
      }}
      batchActions={batchActions}
      showBatchActions={true}
      statistics={statistics}
      showStatistics={true}
      statisticsLayout="horizontal"
      searchable={true}
      searchPlaceholder="搜索物料编码、名称..."
      onSearch={handleSearch}
      onCreate={handleCreate}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
      refreshable={true}
      onRefresh={handleRefresh}
      exportable={true}
      onExport={handleExport}
      importable={true}
      onImport={handleImport}
      paginatable={true}
      pagination={{
        current: store.pagination?.current || 1,
        pageSize: store.pagination?.pageSize || 15,
        total: store.pagination?.total || 0,
        onChange: (page: number, pageSize: number) => {
          store.setFilters({ ...store.filters, current: page, pageSize });
          store.loadMaterials();
        },
      }}
      tableConfig={{
        size: 'middle',
        bordered: true,
        sticky: true,
        scroll: { x: 1200 },
      }}
      title="物料管理"
      className="material-crud"
    />
  );
};

export default MaterialCRUD;

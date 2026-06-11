import React, { useEffect, useCallback, useMemo, useState } from 'react';
import { Space, Button, message, Popconfirm, Modal } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  ImportOutlined,
  ExportOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { DataTable as DataTableBase } from '../../../../shared/components/DataTable';
import { SearchForm, FormField } from '../../../../shared/components/SearchForm';
import { ActionBar as ActionBarBase, ActionItem } from '../../../../shared/components/ActionBar';
import { FormModal } from '../../../../shared/components/FormModal';
import { DetailDrawer, DetailField } from '../../../../shared/components/DetailDrawer';
import { SimpleStatusBadge } from '../../../../shared/components/StatusBadge';
import { ImportExportModal } from '../../../../shared/components/ImportExportModal';
import { useMaterialStore } from '../store/materialStore';
import {
  MATERIAL_COLUMNS,
  MATERIAL_STATUS_MAP,
  createMaterialActions,
} from '../types';
import type { ImportResult } from '../../../../shared/api/importExportApi';
import { useCurrentUser } from '../../../../shared/hooks/useCurrentUser';
/**
 * 物料列表页面组件 - 完整导入导出示例
 * 演示如何集成ImportExportModal组件
 */


// 导入共享组件
const DataTable = DataTableBase as any;
const ActionBar = ActionBarBase as any;

// 导入物料模块

// 导入用户认证相关

/**
 * MaterialListWithImportExport组件
 * 演示完整的导入导出集成
 */
function MaterialListWithImportExport() {
  // 导入导出模态框状态
  const [showImportExport, setShowImportExport] = useState(false);

  // 获取当前用户信息
  const { addCreatorInfo, hasPermission } = useCurrentUser();

  // 获取物料Store
  const {
    materials,
    total,
    loading,
    query,
    selectedIds,
    selectedMaterials,
    showCreateModal,
    showEditModal,
    showDetailDrawer,
    currentMaterial,
    statistics,

    // Actions
    loadMaterials,
    refreshMaterials,
    createMaterial,
    updateMaterial,
    deleteMaterial,
    batchDeleteMaterials,
    batchEnableMaterials,
    batchDisableMaterials,
    setShowCreateModal: toggleCreateModal,
    setShowEditModal: toggleEditModal,
    setShowDetailDrawer: toggleDetailDrawer,
    setCurrentMaterial,
    setQuery,
    setSelectedIds,
    clearSelection,
    loadStatistics,
  } = useMaterialStore();

  // 初始化数据
  useEffect(() => {
    loadMaterials();
    loadStatistics();
  }, []);

  // 监听查询参数变化，重新加载数据
  useEffect(() => {
    loadMaterials();
  }, [query]);

  // 搜索表单字段
  const searchFields: FormField[] = useMemo(() => [
    { name: 'code', label: '物料编码', type: 'input', placeholder: '请输入物料编码' },
    { name: 'name', label: '物料名称', type: 'input', placeholder: '请输入物料名称' },
    {
      name: 'status',
      label: '状态',
      type: 'select',
      placeholder: '请选择状态',
      options: [
        { label: '全部', value: '' },
        { label: '启用', value: 'active' },
        { label: '禁用', value: 'inactive' },
        { label: '草稿', value: 'draft' },
      ],
    },
    {
      name: 'categoryId',
      label: '物料分类',
      type: 'select',
      placeholder: '请选择物料分类',
      options: [
        { label: '原材料', value: '1' },
        { label: '半成品', value: '2' },
        { label: '成品', value: '3' },
      ],
    },
  ], []);

  /**
   * 导入成功处理
   */
  const handleImportSuccess = useCallback((result: ImportResult) => {
    // 刷新物料列表
    refreshMaterials();

    // 显示成功消息
    if (result.failureCount === 0) {
      message.success(`成功导入 ${result.successCount} 条物料数据`);
    } else {
      message.warning(`导入完成: 成功 ${result.successCount} 条，失败 ${result.failureCount} 条`);
    }

    // 如果有错误，记录到控制台
    if (result.failureCount > 0) {
      console.warn('导入失败的记录:', result.errors);
    }

    // 如果有警告，记录到控制台
    if (result.warnings.length > 0) {
      console.warn('导入警告:', result.warnings);
    }

    // 刷新统计数据
    loadStatistics();
  }, [refreshMaterials, loadStatistics]);

  /**
   * 导入错误处理
   */
  const handleImportError = useCallback((error: Error) => {
    console.error('导入失败:', error);

    // 根据错误类型显示不同的消息
    const errorMsg = error.message.toLowerCase();

    if (errorMsg.includes('network') || errorMsg.includes('timeout')) {
      message.error('网络连接失败，请检查网络后重试');
    } else if (errorMsg.includes('file') || errorMsg.includes('validation')) {
      message.error('文件验证失败，请检查文件格式和内容');
    } else if (errorMsg.includes('duplicate')) {
      message.error('存在重复数据，请检查后重试');
    } else {
      message.error('导入失败: ' + error.message);
    }
  }, []);

  /**
   * 导入进度处理
   */
  const handleImportProgress = useCallback((percent: number) => {
    console.log(`导入进度: ${percent}%`);
    // 可以在这里更新进度条或状态提示
  }, []);

  /**
   * 导出成功处理
   */
  const handleExportSuccess = useCallback(() => {
    message.success('导出成功');
  }, []);

  // 顶部操作栏
  const actionBarActions: ActionItem[] = useMemo(() => [
    {
      key: 'create',
      label: '新建物料',
      icon: <PlusOutlined />,
      onClick: () => {
        setCurrentMaterial(null);
        toggleCreateModal(true);
      },
    },
    {
      key: 'import',
      label: '导入导出',
      icon: <ImportOutlined />,
      onClick: () => {
        setShowImportExport(true);
      },
    },
    {
      key: 'export',
      label: '快速导出',
      icon: <ExportOutlined />,
      onClick: () => {
        setShowImportExport(true);
      },
      disabled: materials.length === 0,
    },
  ], [materials.length, setCurrentMaterial, toggleCreateModal]);

  // 表格列配置
  const tableColumns = useMemo(() => {
    return [
      {
        title: '物料编码',
        dataIndex: 'code',
        key: 'code',
        width: 150,
        fixed: 'left' as const,
      },
      {
        title: '物料名称',
        dataIndex: 'name',
        key: 'name',
        width: 200,
      },
      {
        title: '规格型号',
        dataIndex: 'specification',
        key: 'specification',
        width: 150,
      },
      {
        title: '单位',
        dataIndex: 'unit',
        key: 'unit',
        width: 80,
      },
      {
        title: '分类',
        dataIndex: 'category',
        key: 'category',
        width: 100,
      },
      {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        width: 100,
        render: (status: string) => <SimpleStatusBadge status={status} />,
      },
      {
        title: '创建时间',
        dataIndex: 'createdAt',
        key: 'createdAt',
        width: 160,
        render: (date: string) => (date ? dayjs(date).format('YYYY-MM-DD HH:mm:ss') : '-'),
      },
      {
        title: '操作',
        key: 'action',
        width: 200,
        fixed: 'right' as const,
        render: (_: any, record: any) => (
          <Space size="small">
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => {
                setCurrentMaterial(record);
                toggleDetailDrawer(true);
              }}
            >
              查看
            </Button>
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => {
                setCurrentMaterial(record);
                toggleEditModal(true);
              }}
            >
              编辑
            </Button>
            <Popconfirm
              title="确认删除"
              description="确定要删除这条物料记录吗？"
              onConfirm={() => deleteMaterial(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button
                type="link"
                size="small"
                danger
                icon={<DeleteOutlined />}
              >
                删除
              </Button>
            </Popconfirm>
          </Space>
        ),
      },
    ];
  }, [setCurrentMaterial, toggleDetailDrawer, toggleEditModal, deleteMaterial]);

  // 表单字段
  const formFields: any[] = useMemo(() => [
    { name: 'code', label: '物料编码', type: 'input', required: true, placeholder: '请输入物料编码' },
    { name: 'name', label: '物料名称', type: 'input', required: true, placeholder: '请输入物料名称' },
    { name: 'specification', label: '规格型号', type: 'input', placeholder: '请输入规格型号' },
    { name: 'unit', label: '单位', type: 'input', required: true, placeholder: '请输入单位' },
    { name: 'category', label: '分类', type: 'select', required: true, placeholder: '请选择分类', options: [
      { label: '原材料', value: '1' },
      { label: '半成品', value: '2' },
      { label: '成品', value: '3' },
    ]},
    { name: 'price', label: '单价', type: 'input', placeholder: '请输入单价' },
    { name: 'description', label: '描述', type: 'textarea', placeholder: '请输入描述' },
  ], []);

  // 详情字段
  const detailFields = useMemo(() => (currentMaterial ? [
    { label: '物料编码', value: currentMaterial.code },
    { label: '物料名称', value: currentMaterial.name },
    { label: '规格型号', value: currentMaterial.specification },
    { label: '单位', value: currentMaterial.unit },
    { label: '分类', value: currentMaterial.category },
    { label: '状态', value: <SimpleStatusBadge status={currentMaterial.status} /> },
    { label: '单价', value: currentMaterial.price },
    { label: '描述', value: currentMaterial.description },
    { label: '创建时间', value: currentMaterial.createdAt ? dayjs(currentMaterial.createdAt).format('YYYY-MM-DD HH:mm:ss') : '-' },
    { label: '创建人', value: currentMaterial.createdBy },
  ] : []), [currentMaterial]);

  return (
    <div style={{ padding: '24px' }}>
      {/* 统计卡片 */}
      <div style={{ marginBottom: 16, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {statistics && (
          <>
            <div style={{ padding: 16, background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <div style={{ fontSize: 14, color: '#666' }}>总物料数</div>
              <div style={{ fontSize: 24, fontWeight: 'bold', marginTop: 8 }}>{statistics.totalCount || 0}</div>
            </div>
            <div style={{ padding: 16, background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <div style={{ fontSize: 14, color: '#666' }}>启用状态</div>
              <div style={{ fontSize: 24, fontWeight: 'bold', marginTop: 8, color: '#52c41a' }}>{statistics.activeCount || 0}</div>
            </div>
            <div style={{ padding: 16, background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <div style={{ fontSize: 14, color: '#666' }}>禁用状态</div>
              <div style={{ fontSize: 24, fontWeight: 'bold', marginTop: 8, color: '#ff4d4f' }}>{statistics.inactiveCount || 0}</div>
            </div>
            <div style={{ padding: 16, background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <div style={{ fontSize: 14, color: '#666' }}>草稿状态</div>
              <div style={{ fontSize: 24, fontWeight: 'bold', marginTop: 8, color: '#faad14' }}>{statistics.draftCount || 0}</div>
            </div>
          </>
        )}
      </div>

      {/* 搜索表单 */}
      <SearchForm
        fields={searchFields as FormField[]}
        onSearch={(values) => setQuery(values)}
        onReset={() => setQuery({})}
      />

      {/* 操作栏 */}
      <ActionBar
        title="物料管理"
        actions={actionBarActions}
        selectedCount={selectedIds.length}
        onBatchAction={async (action: any) => {
          switch (action) {
            case 'delete':
              await batchDeleteMaterials(selectedIds);
              break;
            case 'enable':
              await batchEnableMaterials(selectedIds);
              break;
            case 'disable':
              await batchDisableMaterials(selectedIds);
              break;
            default:
              break;
          }
          clearSelection();
        }}
      />

      {/* 数据表格 */}
      <DataTable
        columns={tableColumns}
        dataSource={materials}
        loading={loading}
        rowKey="id"
        pagination={{
          current: query.current || 1,
          pageSize: query.pageSize || 10,
          total,
          onChange: (page: number, pageSize: number) => setQuery({ current: page, pageSize }),
        }}
        rowSelection={{
          selectedRowKeys: selectedIds,
          onChange: (selectedRowKeys: any[]) => setSelectedIds(selectedRowKeys as string[]),
        }}
        scroll={{ x: 1200 }}
      />

      {/* 新建/编辑模态框 */}
      <FormModal
        visible={showCreateModal || showEditModal}
        title={showCreateModal ? '新建物料' : '编辑物料'}
        fields={formFields}
        initialValues={currentMaterial || {}}
        onSubmit={async (values) => {
          const data = addCreatorInfo(values);
          if (showCreateModal) {
            await createMaterial(data);
          } else {
            await updateMaterial({ ...currentMaterial, ...data });
          }
          refreshMaterials();
        }}
        onCancel={() => {
          if (showCreateModal) toggleCreateModal(false);
          if (showEditModal) toggleEditModal(false);
        }}
      />

      {/* 详情抽屉 */}
      <DetailDrawer
        visible={showDetailDrawer}
        title="物料详情"
        fields={detailFields}
        onClose={() => toggleDetailDrawer(false)}
      />

      {/* 导入/导出模态框 */}
      <ImportExportModal
        visible={showImportExport}
        onCancel={() => setShowImportExport(false)}
        module="material"
        moduleName="物料管理"
        onSuccess={handleImportSuccess}
        onError={handleImportError}
        onProgress={handleImportProgress}
      />
    </div>
  );
}

export default MaterialListWithImportExport;

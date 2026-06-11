import React, { useEffect, useCallback, useMemo } from 'react';
import { Space, Button, message, Popconfirm, Modal } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  ExportOutlined,
  ImportOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { DataTable as DataTableBase } from '../../../../shared/components/DataTable';
import { SearchForm, FormField } from '../../../../shared/components/SearchForm';
import { ActionBar, ActionItem } from '../../../../shared/components/ActionBar';
import { FormModal } from '../../../../shared/components/FormModal';
import { DetailDrawer, DetailField } from '../../../../shared/components/DetailDrawer';
import { SimpleStatusBadge } from '../../../../shared/components/StatusBadge';
import { useMaterialStore } from '../store/materialStore';
import {
  MATERIAL_COLUMNS,
  MATERIAL_STATUS_MAP,
  createMaterialActions,
} from '../types';
import { useCurrentUser } from '../../../../shared/hooks/useCurrentUser';
/**
 * 物料列表页面组件
 * 使用通用组件和materialStore构建完整的物料管理页面
 */


// 导入共享组件
const DataTable = DataTableBase as any;

// 导入物料模块

// 导入用户认证相关

/**
 * MaterialList组件
 */
function MaterialList() {
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
      label: '导入',
      icon: <ImportOutlined />,
      onClick: () => message.info('导入功能待实现'),
    },
    {
      key: 'export',
      label: '导出',
      icon: <ExportOutlined />,
      onClick: () => message.info('导出功能待实现'),
      disabled: materials.length === 0,
    },
  ], [materials.length]);

  // 批量操作
  const batchActions: ActionItem[] = useMemo(() => [
    {
      key: 'batch-enable',
      label: '批量启用',
      onClick: () => handleBatchEnable(),
      disabled: selectedIds.length === 0,
    },
    {
      key: 'batch-disable',
      label: '批量禁用',
      onClick: () => handleBatchDisable(),
      disabled: selectedIds.length === 0,
    },
    {
      key: 'batch-delete',
      label: '批量删除',
      onClick: () => handleBatchDelete(),
      disabled: selectedIds.length === 0,
      danger: true,
    },
  ], [selectedIds]);

  // 表格列配置
  const tableColumns = useMemo(() => {
    return MATERIAL_COLUMNS.map(col => {
      if (col.key === 'status') {
        return {
          ...col,
          render: (status: string) => <SimpleStatusBadge status={status} />,
        };
      }
      if (col.key === 'createTime') {
        return {
          ...col,
          render: (text: string) => dayjs(text).format('YYYY-MM-DD HH:mm:ss'),
        };
      }
      if (col.key === 'action') {
        return {
          ...col,
          render: (_: any, record: any) => (
            <Space size="small">
              <Button
                type="link"
                size="small"
                icon={<EyeOutlined />}
                onClick={() => handleViewDetail(record)}
              >
                详情
              </Button>
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleEdit(record)}
              >
                编辑
              </Button>
              <Popconfirm
                title="确定要删除这个物料吗？"
                onConfirm={() => handleDelete(record.id)}
                okText="确定"
                cancelText="取消"
              >
                <Button
                  type="link"
                  size="small"
                  icon={<DeleteOutlined />}
                  danger
                >
                  删除
                </Button>
              </Popconfirm>
            </Space>
          ),
        };
      }
      return col;
    });
  }, []);

  // 搜索处理
  const handleSearch = useCallback((values: any) => {
    // 过滤空值
    const filters = Object.fromEntries(
      Object.entries(values).filter(([_, v]) => v !== '' && v !== undefined && v !== null)
    );
    setQuery({ ...filters, current: 1 });
  }, [setQuery]);

  // 重置处理
  const handleReset = useCallback(() => {
    clearSelection();
    setQuery({ current:1, pageSize: 15 });
  }, [clearSelection, setQuery]);

  // 分页处理
  const handlePageChange = useCallback((page: number, pageSize: number) => {
    setQuery({ current: page, pageSize });
  }, [setQuery]);

  // 刷新处理
  const handleRefresh = useCallback(() => {
    refreshMaterials();
  }, [refreshMaterials]);

  // 行选择处理
  const handleSelectionChange = useCallback((selectedRowKeys: React.Key[]) => {
    setSelectedIds(selectedRowKeys as string[]);
  }, [setSelectedIds]);

  // 新建物料
  const handleCreate = useCallback(async (values: any) => {
    try {
      // 添加创建人信息
      const dataWithUserInfo = addCreatorInfo(values);
      await createMaterial(dataWithUserInfo);
      message.success('创建成功');
    } catch (error) {
      message.error('创建失败');
    }
  }, [createMaterial, addCreatorInfo]);

  // 编辑物料
  const handleEdit = useCallback((record: any) => {
    setCurrentMaterial(record);
    toggleEditModal(true);
  }, [setCurrentMaterial, toggleEditModal]);

  // 更新物料
  const handleUpdate = useCallback(async (values: any) => {
    try {
      await updateMaterial({ ...currentMaterial, ...values });
      message.success('更新成功');
    } catch (error) {
      message.error('更新失败');
    }
  }, [currentMaterial, updateMaterial]);

  // 删除物料
  const handleDelete = useCallback(async (id: string) => {
    try {
      await deleteMaterial(id);
      message.success('删除成功');
    } catch (error) {
      message.error('删除失败');
    }
  }, [deleteMaterial]);

  // 批量删除
  const handleBatchDelete = useCallback(async () => {
    if (selectedIds.length === 0) {
      message.warning('请先选择要删除的物料');
      return;
    }

    Modal.confirm({
      title: '确认批量删除',
      content: `您确定要删除选中的 ${selectedIds.length} 个物料吗？此操作不可恢复！`,
      okText: '确定删除',
      okType: 'danger',
      cancelText: '取消',
      centered: true,
      onOk: async () => {
        try {
          await batchDeleteMaterials(selectedIds);
          message.success(`成功删除 ${selectedIds.length} 个物料`);
        } catch (error) {
          message.error('批量删除失败');
        }
      },
    });
  }, [selectedIds, batchDeleteMaterials]);

  // 批量启用
  const handleBatchEnable = useCallback(async () => {
    if (selectedIds.length === 0) {
      message.warning('请先选择要启用的物料');
      return;
    }

    Modal.confirm({
      title: '确认批量启用',
      content: `您确定要启用选中的 ${selectedIds.length} 个物料吗？`,
      okText: '确定启用',
      cancelText: '取消',
      centered: true,
      onOk: async () => {
        try {
          await batchEnableMaterials(selectedIds);
          message.success(`成功启用 ${selectedIds.length} 个物料`);
        } catch (error) {
          message.error('批量启用失败');
        }
      },
    });
  }, [selectedIds, batchEnableMaterials]);

  // 批量禁用
  const handleBatchDisable = useCallback(async () => {
    if (selectedIds.length === 0) {
      message.warning('请先选择要禁用的物料');
      return;
    }

    Modal.confirm({
      title: '确认批量禁用',
      content: `您确定要禁用选中的 ${selectedIds.length} 个物料吗？禁用后这些物料将无法使用。`,
      okText: '确定禁用',
      okType: 'danger',
      cancelText: '取消',
      centered: true,
      onOk: async () => {
        try {
          await batchDisableMaterials(selectedIds);
          message.success(`成功禁用 ${selectedIds.length} 个物料`);
        } catch (error) {
          message.error('批量禁用失败');
        }
      },
    });
  }, [selectedIds, batchDisableMaterials]);

  // 查看详情
  const handleViewDetail = useCallback((record: any) => {
    setCurrentMaterial(record);
    toggleDetailDrawer(true);
  }, [setCurrentMaterial, toggleDetailDrawer]);

  // 关闭新建弹窗
  const handleCloseCreateModal = useCallback(() => {
    toggleCreateModal(false);
    setCurrentMaterial(null);
  }, [toggleCreateModal, setCurrentMaterial]);

  // 关闭编辑弹窗
  const handleCloseEditModal = useCallback(() => {
    toggleEditModal(false);
    setCurrentMaterial(null);
  }, [toggleEditModal, setCurrentMaterial]);

  // 关闭详情抽屉
  const handleCloseDetailDrawer = useCallback(() => {
    toggleDetailDrawer(false);
    setCurrentMaterial(null);
  }, [toggleDetailDrawer, setCurrentMaterial]);

  // 表单字段配置
  const formFields = useMemo(() => [
    {
      name: 'code',
      label: '物料编码',
      type: 'input' as const,
      placeholder: '请输入物料编码',
      required: true,
      rules: [{ required: true, message: '请输入物料编码' }],
    },
    {
      name: 'name',
      label: '物料名称',
      type: 'input' as const,
      placeholder: '请输入物料名称',
      required: true,
      rules: [{ required: true, message: '请输入物料名称' }],
    },
    {
      name: 'categoryId',
      label: '物料分类',
      type: 'select' as const,
      placeholder: '请选择物料分类',
      required: true,
      options: [
        { label: '原材料', value: '1' },
        { label: '半成品', value: '2' },
        { label: '成品', value: '3' },
      ],
      rules: [{ required: true, message: '请选择物料分类' }],
    },
    {
      name: 'specification',
      label: '规格型号',
      type: 'input' as const,
      placeholder: '请输入规格型号',
    },
    {
      name: 'model',
      label: '型号',
      type: 'input' as const,
      placeholder: '请输入型号',
    },
    {
      name: 'brand',
      label: '品牌',
      type: 'input' as const,
      placeholder: '请输入品牌',
    },
    {
      name: 'manufacturer',
      label: '制造商',
      type: 'input' as const,
      placeholder: '请输入制造商',
    },
    {
      name: 'unitId',
      label: '基本单位',
      type: 'select' as const,
      placeholder: '请选择基本单位',
      options: [
        { label: '个', value: '1' },
        { label: 'kg', value: '2' },
        { label: 'm', value: '3' },
      ],
    },
    {
      name: 'status',
      label: '状态',
      type: 'select' as const,
      placeholder: '请选择状态',
      options: [
        { label: '启用', value: 'active' },
        { label: '禁用', value: 'inactive' },
        { label: '草稿', value: 'draft' },
      ],
    },
    {
      name: 'safetyStock',
      label: '安全库存',
      type: 'number' as const,
      placeholder: '请输入安全库存',
    },
    {
      name: 'minStock',
      label: '最小库存',
      type: 'number' as const,
      placeholder: '请输入最小库存',
    },
    {
      name: 'maxStock',
      label: '最大库存',
      type: 'number' as const,
      placeholder: '请输入最大库存',
    },
    {
      name: 'description',
      label: '备注',
      type: 'textarea' as const,
      placeholder: '请输入备注',
    },
  ], []);

  // 详情字段配置
  const getDetailFields = useCallback((material: any): DetailField[] => {
    return [
      { label: '物料编码', value: material.code, type: 'text' },
      { label: '物料名称', value: material.name, type: 'text' },
      { label: '物料分类', value: material.categoryName, type: 'text' },
      { label: '规格型号', value: material.specification, type: 'text' },
      { label: '型号', value: material.model, type: 'text' },
      { label: '品牌', value: material.brand, type: 'text' },
      { label: '制造商', value: material.manufacturer, type: 'text' },
      { label: '基本单位', value: material.unitName, type: 'text' },
      { label: '状态', value: material.status, type: 'tag' },
      { label: '安全库存', value: material.safetyStock, type: 'number' },
      { label: '最小库存', value: material.minStock, type: 'number' },
      { label: '最大库存', value: material.maxStock, type: 'number' },
      { label: '备注', value: material.description, type: 'text' },
      { label: '创建时间', value: dayjs(material.createTime).format('YYYY-MM-DD HH:mm:ss'), type: 'text' },
      { label: '更新时间', value: dayjs(material.updateTime).format('YYYY-MM-DD HH:mm:ss'), type: 'text' },
    ];
  }, []);

  return (
    <div style={{ padding: '24px', background: '#f0f2f5' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 顶部操作栏 */}
        <ActionBar
          title={`物料管理${statistics ? ` (共 ${total} 条，启用 ${statistics.activeCount} 条)` : ''}`}
          actions={actionBarActions}
          selectedCount={selectedIds.length}
          batchActions={batchActions}
        />

        {/* 搜索表单 */}
        <SearchForm
          fields={searchFields}
          initialValues={{}}
          onSearch={handleSearch}
          onReset={handleReset}
          layout="inline"
        />

        {/* 物料表格 */}
        <DataTable
          data={materials}
          loading={loading}
          rowKey="id"
          columns={tableColumns}
          pagination={{
            current: query.current,
            pageSize: query.pageSize,
            total: total,
            onChange: handlePageChange,
            pageSizeOptions: [10, 15, 20, 50, 100],
            showSizeChanger: true,
            showQuickJumper: true,
          }}
          rowSelection={{
            selectedRowKeys: selectedIds,
            onChange: handleSelectionChange,
          }}
          showActions={true}
          onRefresh={handleRefresh}
          sticky={true}
          extra={
            statistics && (
              <div style={{ padding: '16px 0', display: 'flex', gap: 24, fontSize: 14, color: '#666' }}>
                <span>启用: {statistics.activeCount}</span>
                <span>禁用: {statistics.inactiveCount}</span>
                <span>草稿: {statistics.draftCount}</span>
                <span>分类: {statistics.categoryCount}</span>
              </div>
            )
          }
        />
      </Space>

      {/* 新建物料弹窗 */}
      <FormModal
        visible={showCreateModal}
        title="新建物料"
        mode="create"
        initialValues={{}}
        fields={formFields as FormField[]}
        onSubmit={handleCreate}
        onCancel={handleCloseCreateModal}
        loading={loading}
        width={800}
        submitText="创建"
      />

      {/* 编辑物料弹窗 */}
      <FormModal
        visible={showEditModal}
        title="编辑物料"
        mode="edit"
        initialValues={currentMaterial || {}}
        fields={formFields as FormField[]}
        onSubmit={handleUpdate}
        onCancel={handleCloseEditModal}
        loading={loading}
        width={800}
        submitText="保存"
      />

      {/* 物料详情抽屉 */}
      <DetailDrawer
        visible={showDetailDrawer}
        title="物料详情"
        fields={currentMaterial ? getDetailFields(currentMaterial) : []}
        onClose={handleCloseDetailDrawer}
        width={600}
        showActions={true}
        onEdit={() => {
          handleEdit(currentMaterial!);
          handleCloseDetailDrawer();
        }}
        onDelete={async () => {
          await handleDelete(currentMaterial!.id);
          handleCloseDetailDrawer();
        }}
      />
    </div>
  );
}

export default MaterialList;
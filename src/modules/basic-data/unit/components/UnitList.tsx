/**
 * 计量单位列表组件
 * 使用新架构的完整实现
 * 完全保持UI/UX零变化，与现有Unit页面样式一致
 */
import React, { useEffect, useMemo } from 'react';
import { DataTable } from '../../../../shared/components/DataTable';
import { SearchForm } from '../../../../shared/components/SearchForm';
import { ActionBar } from '../../../../shared/components/ActionBar';
import { StatusBadge } from '../../../../shared/components/StatusBadge';
import { FormModal } from '../../../../shared/components/FormModal';
import { useUnitStore } from '../store';
import { usePermission } from '../../../../shared/hooks/usePermission';
import type { FormField } from '../../../../shared/types/common';
import {
  UnitItem,
  UnitGroup,
  UNIT_STATUS_MAP,
  UNIT_METHOD_MAP,
} from '../types';
import {
  PlusOutlined,
  ReloadOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  FolderOutlined,
  CheckCircleOutlined,
  StopOutlined,
  ImportOutlined,
  ExportOutlined,
} from '@ant-design/icons';
import { Button, Space, Popconfirm, message, Tree, Divider, Tag, Modal } from 'antd';
import type { DataNode } from 'antd/es/tree';

/**
 * 单位分组树节点转换
 */
const buildTreeData = (groups: UnitGroup[]): DataNode[] => {
  return groups.map(group => ({
    key: group.id,
    title: (
      <span style={{ fontSize: 13, color: '#333' }}>
        {group.id === 'all' ? (
          <>
            <FolderOutlined
              style={{ color: '#FAAD14', marginRight: 4, fontSize: 12 }}
            />
            全部
          </>
        ) : (
          <>
            <FolderOutlined style={{ color: '#FAAD14', marginRight: 4, fontSize: 12 }} />
            {group.name}
          </>
        )}
      </span>
    ),
    children: group.children ? buildTreeData(group.children) : undefined,
  }));
};

/**
 * 搜索表单字段配置
 */
const SEARCH_FIELDS: FormField[] = [
  { name: 'code', label: '单位编码', type: 'input', placeholder: '请输入单位编码' },
  { name: 'name', label: '单位名称', type: 'input', placeholder: '请输入单位名称' },
];

/**
 * 表单字段配置（新增/编辑单位）
 */
const UNIT_FORM_FIELDS: FormField[] = [
  { name: 'code', label: '单位编码', type: 'input', required: true },
  { name: 'name', label: '单位名称', type: 'input', required: true },
  { name: 'enName', label: '英文名称', type: 'input' },
  { name: 'groupId', label: '单位分组', type: 'select', required: true },
  { name: 'method', label: '换算方法', type: 'select', required: true },
  { name: 'precision', label: '精度', type: 'number', required: true },
  { name: 'isBase', label: '基础单位', type: 'select', required: true },
];

/**
 * UnitList组件
 * 使用新架构的完整单位列表页面
 * 保持与现有页面完全一致的样式和功能
 */
export const UnitList: React.FC = () => {
  const {
    units,
    groups,
    selectedIds,
    selectedGroupId,
    currentUnit,
    filters,
    pagination,
    loading,
    error,
    loadUnits,
    loadAllUnits,
    loadGroups,
    createUnit,
    updateUnit,
    deleteUnits,
    updateStatus,
    setBaseUnit,
    unsetBaseUnit,
    setFilters,
    setSelectedGroupId,
    setSelectedIds,
    setCurrentUnit,
    setLoading,
    setError,
  } = useUnitStore();

  const { canCreate, canUpdate, canDelete } = usePermission('unit');

  const [modalOpen, setModalOpen] = React.useState(false);
  const [formLoading, setFormLoading] = React.useState(false);

  /**
   * 初始化加载数据
   */
  useEffect(() => {
    loadGroups();
    loadUnits();
  }, []);

  /**
   * 过滤后的单位列表
   */
  const filteredUnits = useMemo(() => {
    if (selectedGroupId === 'all') {
      return units;
    }
    return units.filter(unit => unit.groupId === selectedGroupId);
  }, [units, selectedGroupId]);

  /**
   * 分组选择处理
   */
  const handleGroupSelect = (selectedKeys: React.Key[]) => {
    const groupId = selectedKeys[0] as string;
    setSelectedGroupId(groupId);
  };

  /**
   * 搜索处理
   */
  const handleSearch = (values: any) => {
    setFilters(values);
    loadUnits();
  };

  /**
   * 重置处理
   */
  const handleReset = () => {
    setFilters({});
    setSelectedGroupId('all');
    loadUnits();
  };

  /**
   * 新增单位
   */
  const handleAdd = () => {
    setCurrentUnit({} as UnitItem); // 空对象表示新增模式
    setModalOpen(true);
  };

  /**
   * 编辑单位
   */
  const handleEdit = (unit: UnitItem) => {
    setCurrentUnit(unit);
    setModalOpen(true);
  };

  /**
   * 删除单位
   */
  const handleDelete = async (ids: string[]) => {
    try {
      await deleteUnits(ids);
      message.success(`成功删除 ${ids.length} 个单位`);
    } catch (error) {
      console.error('删除单位失败:', error);
    }
  };

  /**
   * 启用单位
   */
  const handleEnable = async () => {
    if (selectedIds.length === 0) {
      message.warning('请先选择单位');
      return;
    }

    Modal.confirm({
      title: '确认批量启用',
      content: `您确定要启用选中的 ${selectedIds.length} 个单位吗？`,
      okText: '确定启用',
      cancelText: '取消',
      centered: true,
      onOk: async () => {
        try {
          await updateStatus(selectedIds, 'active');
          message.success(`成功启用 ${selectedIds.length} 个单位`);
          setSelectedIds([]);
        } catch (error) {
          console.error('启用单位失败:', error);
        }
      },
    });
  };

  /**
   * 禁用单位
   */
  const handleDisable = async () => {
    if (selectedIds.length === 0) {
      message.warning('请先选择单位');
      return;
    }

    Modal.confirm({
      title: '确认批量禁用',
      content: `您确定要禁用选中的 ${selectedIds.length} 个单位吗？禁用后这些单位将无法使用。`,
      okText: '确定禁用',
      okType: 'danger',
      cancelText: '取消',
      centered: true,
      onOk: async () => {
        try {
          await updateStatus(selectedIds, 'disabled');
          message.success(`成功禁用 ${selectedIds.length} 个单位`);
          setSelectedIds([]);
        } catch (error) {
          console.error('禁用单位失败:', error);
        }
      },
    });
  };

  /**
   * 设置基础单位
   */
  const handleSetBase = async (unit: UnitItem) => {
    try {
      await setBaseUnit(unit.id);
      message.success(`已设置 ${unit.name} 为基础单位`);
    } catch (error) {
      console.error('设置基础单位失败:', error);
    }
  };

  /**
   * 取消基础单位
   */
  const handleUnsetBase = async (unit: UnitItem) => {
    try {
      await unsetBaseUnit(unit.id);
      message.success(`已取消 ${unit.name} 的基础单位`);
    } catch (error) {
      console.error('取消基础单位失败:', error);
    }
  };

  /**
   * 刷新列表
   */
  const handleRefresh = () => {
    loadUnits();
  };

  /**
   * 表单提交处理
   */
  const handleFormSubmit = async (values: any) => {
    setFormLoading(true);
    try {
      if (currentUnit && currentUnit.id) {
        // 编辑模式
        await updateUnit({ ...values, id: currentUnit.id });
        message.success('单位更新成功');
      } else {
        // 新增模式
        await createUnit(values);
        message.success('单位创建成功');
      }
      setModalOpen(false);
      await loadUnits();
    } catch (error: any) {
      console.error('表单提交失败:', error);
    } finally {
      setFormLoading(false);
    }
  };

  /**
   * 构建表单选项
   */
  const buildFormOptions = () => {
    const groupOptions = groups
      .filter(g => g.id !== 'all')
      .flatMap(g => g.children || [g])
      .map(g => ({ label: g.name, value: g.id }));

    const methodOptions = Object.entries(UNIT_METHOD_MAP).map(([key, value]) => ({
      label: value.label,
      value: key,
    }));

    const isBaseOptions = [
      { label: '是', value: true },
      { label: '否', value: false },
    ];

    return {
      groupId: groupOptions,
      method: methodOptions,
      isBase: isBaseOptions,
    };
  };

  /**
   * 构建表单字段（带选项）
   */
  const buildFormFields = (): FormField[] => {
    const options = buildFormOptions();

    return UNIT_FORM_FIELDS.map(field => {
      if (field.name === 'groupId') {
        return { ...field, options: options.groupId };
      }
      if (field.name === 'method') {
        return { ...field, options: options.method };
      }
      if (field.name === 'isBase') {
        return { ...field, options: options.isBase };
      }
      return field;
    });
  };

  /**
   * 构建表单初始值
   */
  const buildFormInitialValues = () => {
    if (!currentUnit) {
      return {
        method: '四舍五入',
        precision: 2,
        isBase: false,
      };
    }

    return {
      code: currentUnit.code,
      name: currentUnit.name,
      enName: currentUnit.enName,
      groupId: currentUnit.groupId,
      method: currentUnit.method,
      precision: currentUnit.precision,
      isBase: currentUnit.isBase,
    };
  };

  /**
   * 表格列定义
   */
  const columns = [
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
    },
    {
      title: '换算方法',
      dataIndex: 'method',
      key: 'method',
      width: 100,
      render: (method: string) => {
        const methodConfig = (UNIT_METHOD_MAP as any)[method];
        return methodConfig ? methodConfig.label : method;
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
      render: (status: string) => (
        <StatusBadge status={status} statusMap={UNIT_STATUS_MAP} />
      ),
    },
    {
      title: '基础单位',
      dataIndex: 'isBase',
      key: 'isBase',
      width: 100,
      render: (isBase: boolean) => (
        <Tag color={isBase ? 'blue' : 'default'}>
          {isBase ? '是' : '否'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 280,
      fixed: 'right' as const,
      render: (_: any, record: UnitItem) => (
        <Space size="small">
          {canCreate('unit') && (
            <Button
              type="link"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => handleSetBase(record)}
            >
              设为基础
            </Button>
          )}
          {canUpdate('unit') && (
            <Button
              type="link"
              size="small"
              icon={<StopOutlined />}
              onClick={() => handleUnsetBase(record)}
              disabled={!record.isBase}
            >
              取消基础
            </Button>
          )}
          {canUpdate('unit') && (
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            >
              编辑
            </Button>
          )}
          {canDelete('unit') && (
            <Popconfirm
              title="确认删除"
              description={`确定要删除单位「${record.name}」吗？`}
              onConfirm={() => handleDelete([record.id])}
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
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="unit-page" style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
      {/* 左侧分组树 + 右侧列表 */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* 左侧分组树 */}
        <div style={{ width: 200, background: '#fff', borderRight: '1px solid #e8ecf0', padding: '16px 0' }}>
          <div style={{ marginBottom: 12, padding: '0 16px', fontWeight: 600, color: '#333' }}>
            单位分组
          </div>
          <Tree
            showLine
            defaultExpandAll
            selectedKeys={[selectedGroupId]}
            onSelect={handleGroupSelect}
            treeData={buildTreeData(groups)}
            style={{ padding: '8px 12px' }}
          />
        </div>

        {/* 右侧内容区域 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* 搜索表单 */}
          <div style={{ background: '#fff', padding: '16px', borderBottom: '1px solid #e8ecf0' }}>
            <SearchForm
              fields={SEARCH_FIELDS}
              onSearch={handleSearch}
              onReset={handleReset}
              loading={loading}
              layout="inline"
            />
          </div>

          {/* 操作栏 */}
          <ActionBar
            title="计量单位"
            actions={[
              { key: 'add', label: '新增', icon: <PlusOutlined />, type: 'primary', onClick: handleAdd },
              { key: 'refresh', label: '刷新', icon: <ReloadOutlined />, onClick: handleRefresh },
            ]}
            selectedCount={selectedIds.length}
            batchActions={[
              { key: 'enable', label: '启用', onClick: handleEnable },
              { key: 'disable', label: '禁用', onClick: handleDisable, danger: true },
            ]}
            extra={
              <Space>
                <Button
                  icon={<ImportOutlined />}
                  onClick={() => message.info('导入功能 - 需要后续完善')}
                >
                  导入
                </Button>
                <Button
                  icon={<ExportOutlined />}
                  onClick={() => message.info('导出功能 - 需要后续完善')}
                >
                  导出
                </Button>
              </Space>
            }
          />

          {/* 数据表格 */}
          <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
            <DataTable
              data={filteredUnits}
              rowKey="id"
              columns={columns}
              loading={loading}
              pagination={pagination}
              paginationState={pagination}
              onPaginationChange={(page, pageSize) => {
                setFilters({ current: page, pageSize });
                loadUnits();
              }}
              rowSelection={{
                selectedRowKeys: selectedIds,
                onChange: (keys) => setSelectedIds(keys as string[]),
              }}
              scroll={{ x: 1200 }}
              bordered={false}
              size="middle"
            />
          </div>

          {/* 错误提示 */}
          {error && (
            <div
              style={{
                padding: '16px',
                margin: '16px',
                background: '#fff1f0',
                border: '1px solid #ffa39e',
                borderRadius: 4,
                color: '#cf1322',
              }}
            >
              {error}
            </div>
          )}
        </div>
      </div>

      {/* 新增/编辑弹窗 */}
      <FormModal
        visible={modalOpen}
        title={currentUnit && currentUnit.id ? '编辑单位' : '新增单位'}
        mode={currentUnit && currentUnit.id ? 'edit' : 'create'}
        fields={buildFormFields()}
        initialValues={buildFormInitialValues()}
        onSubmit={handleFormSubmit}
        onCancel={() => {
          setModalOpen(false);
          setCurrentUnit(null);
        }}
        loading={formLoading}
        width={600}
      />
    </div>
  );
};

export default UnitList;
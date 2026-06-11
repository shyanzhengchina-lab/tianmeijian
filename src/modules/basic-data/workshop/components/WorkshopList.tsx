/**
 * 车间档案列表组件
 * 使用新架构的完整实现
 * 完全保持UI/UX零变化，与现有WorkshopPage样式一致
 */
import React, { useEffect, useState } from 'react';
import { DataTable } from '../../../../shared/components/DataTable';
import { SearchForm } from '../../../../shared/components/SearchForm';
import { ActionBar } from '../../../../shared/components/ActionBar';
import { StatusBadge } from '../../../../shared/components/StatusBadge';
import { DetailDrawer } from '../../../../shared/components/DetailDrawer';
import { FormModal } from '../../../../shared/components/FormModal';
import { useWorkshopStore } from '../store';
import { usePermission } from '../../../../shared/hooks/usePermission';
import type { FormField, DetailField } from '../../../../shared/types/common';
import {
  Workshop,
  WorkshopStatus,
  WorkshopType,
  WORKSHOP_TYPE_MAP,
  WORKSHOP_STATUS_MAP,
} from '../types';
import {
  PlusOutlined,
  ReloadOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  SearchOutlined,
  ApartmentOutlined,
  TeamOutlined,
  BankOutlined,
  ToolOutlined,
  PhoneOutlined,
  CheckCircleOutlined,
  StopOutlined,
} from '@ant-design/icons';
import { Button, Space, Popconfirm, message, Statistic, Row, Col, Divider, Tag, Tabs, Table, Modal } from 'antd';
import type { ColumnsType } from 'antd/es/table';

/**
 * 搜索表单字段配置
 */
const SEARCH_FIELDS: FormField[] = [
  { name: 'workShopCode', label: '车间编码', type: 'input', placeholder: '请输入车间编码' },
  { name: 'workShopName', label: '车间名称', type: 'input', placeholder: '请输入车间名称' },
  {
    name: 'type',
    label: '车间类型',
    type: 'select',
    options: Object.entries(WORKSHOP_TYPE_MAP).map(([key, value]) => ({
      label: value.label,
      value: key,
    })),
  },
  {
    name: 'status',
    label: '状态',
    type: 'select',
    options: [
      { label: '全部', value: '' },
      ...Object.entries(WORKSHOP_STATUS_MAP).map(([key, value]) => ({
        label: value.label,
        value: key,
      })),
    ],
  },
];

/**
 * 表单字段配置（新增/编辑车间）
 */
const WORKSHOP_FORM_FIELDS: FormField[] = [
  { name: 'workShopCode', label: '车间编码', type: 'input', required: true },
  { name: 'workShopName', label: '车间名称', type: 'input', required: true },
  {
    name: 'type',
    label: '车间类型',
    type: 'select',
    required: true,
    options: Object.entries(WORKSHOP_TYPE_MAP).map(([key, value]) => ({
      label: value.label,
      value: key,
    })),
  },
  { name: 'manager', label: '车间主任', type: 'input', required: true },
  { name: 'managerPhone', label: '联系电话', type: 'input' },
  { name: 'location', label: '位置/楼区', type: 'input', required: true },
  { name: 'area', label: '面积(m²)', type: 'number' },
  { name: 'headCount', label: '在编人员', type: 'number', required: true },
  {
    name: 'cleanLevel',
    label: '洁净度',
    type: 'select',
    options: [
      { label: '100级', value: '100' },
      { label: '10000级', value: '1000' },
      { label: '100000级', value: '10000' },
      { label: '300000级', value: '30000' },
    ],
  },
  {
    name: 'status',
    label: '状态',
    type: 'select',
    required: true,
    options: Object.entries(WORKSHOP_STATUS_MAP).map(([key, value]) => ({
      label: value.label,
      value: key,
    })),
  },
  { name: 'remark', label: '备注', type: 'textArea' },
];

/**
 * WorkshopList组件
 * 使用新架构的完整车间列表页面
 * 保持与现有页面完全一致的样式和功能
 */
export const WorkshopList: React.FC = () => {
  const {
    workshops,
    selectedIds,
    currentWorkshop,
    filters,
    pagination,
    loading,
    error,
    statistics,
    currentWorkshopWorkCenters,
    loadWorkshops,
    loadStatistics,
    loadRelatedWorkCenters,
    createWorkshop,
    updateWorkshop,
    deleteWorkshops,
    updateStatus,
    setMaintenance,
    unsetMaintenance,
    updateManager,
    addWorkCenter,
    removeWorkCenter,
    setFilters,
    setSelectedIds,
    setCurrentWorkshop,
    setLoading,
    setError,
  } = useWorkshopStore();

  const { canCreate, canUpdate, canDelete } = usePermission('workshop');

  const [modalOpen, setModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [selectedWorkCenter, setSelectedWorkCenter] = useState<string>('');

  /**
   * 初始化加载数据
   */
  useEffect(() => {
    loadWorkshops();
    loadStatistics();
  }, []);

  /**
   * 搜索处理
   */
  const handleSearch = (values: any) => {
    setFilters(values);
    loadWorkshops();
  };

  /**
   * 重置处理
   */
  const handleReset = () => {
    setFilters({});
    loadWorkshops();
  };

  /**
   * 新增车间
   */
  const handleAdd = () => {
    setCurrentWorkshop({} as Workshop); // 空对象表示新增模式
    setModalOpen(true);
  };

  /**
   * 编辑车间
   */
  const handleEdit = (workshop: Workshop) => {
    setCurrentWorkshop(workshop);
    setModalOpen(true);
  };

  /**
   * 查看详情
   */
  const handleView = (workshop: Workshop) => {
    setCurrentWorkshop(workshop);
    loadRelatedWorkCenters(workshop.id);
    setDetailOpen(true);
  };

  /**
   * 删除车间
   */
  const handleDelete = async (ids: string[]) => {
    try {
      await deleteWorkshops(ids);
      message.success(`成功删除 ${ids.length} 个车间`);
    } catch (error) {
      console.error('删除车间失败:', error);
    }
  };

  /**
   * 启用车间
   */
  const handleEnable = async () => {
    if (selectedIds.length === 0) {
      message.warning('请先选择车间');
      return;
    }

    Modal.confirm({
      title: '确认批量启用',
      content: `您确定要启用选中的 ${selectedIds.length} 个车间吗？`,
      okText: '确定启用',
      cancelText: '取消',
      centered: true,
      onOk: async () => {
        try {
          await updateStatus(selectedIds, 'ACTIVE');
          message.success(`成功启用 ${selectedIds.length} 个车间`);
          setSelectedIds([]);
        } catch (error) {
          console.error('启用车间失败:', error);
        }
      },
    });
  };

  /**
   * 禁用车间
   */
  const handleDisable = async () => {
    if (selectedIds.length === 0) {
      message.warning('请先选择车间');
      return;
    }

    Modal.confirm({
      title: '确认批量禁用',
      content: `您确定要禁用选中的 ${selectedIds.length} 个车间吗？禁用后这些车间将无法使用。`,
      okText: '确定禁用',
      okType: 'danger',
      cancelText: '取消',
      centered: true,
      onOk: async () => {
        try {
          await updateStatus(selectedIds, 'DISABLED');
          message.success(`成功禁用 ${selectedIds.length} 个车间`);
          setSelectedIds([]);
        } catch (error) {
          console.error('禁用车间失败:', error);
        }
      },
    });
  };

  /**
   * 设置整修状态
   */
  const handleSetMaintenance = async (workshop: Workshop) => {
    try {
      await setMaintenance(workshop.id);
      message.success(`已设置 ${workshop.workShopName} 为整修状态`);
    } catch (error) {
      console.error('设置整修状态失败:', error);
    }
  };

  /**
   * 取消整修状态
   */
  const handleUnsetMaintenance = async (workshop: Workshop) => {
    try {
      await unsetMaintenance(workshop.id);
      message.success(`已取消 ${workshop.workShopName} 的整修状态`);
    } catch (error) {
      console.error('取消整修状态失败:', error);
    }
  };

  /**
   * 刷新列表
   */
  const handleRefresh = () => {
    loadWorkshops();
    loadStatistics();
  };

  /**
   * 表单提交处理
   */
  const handleFormSubmit = async (values: any) => {
    setFormLoading(true);
    try {
      if (currentWorkshop && currentWorkshop.id) {
        // 编辑模式
        await updateWorkshop({ ...values, id: currentWorkshop.id });
        message.success('车间更新成功');
      } else {
        // 新增模式
        await createWorkshop(values);
        message.success('车间创建成功');
      }
      setModalOpen(false);
      await loadWorkshops();
    } catch (error: any) {
      console.error('表单提交失败:', error);
    } finally {
      setFormLoading(false);
    }
  };

  /**
   * 构建详情字段
   */
  const buildDetailFields = (): DetailField[] => {
    if (!currentWorkshop) return [];

    const typeConfig = WORKSHOP_TYPE_MAP[currentWorkshop.type];
    const statusConfig = WORKSHOP_STATUS_MAP[currentWorkshop.status];

    return [
      { label: '车间编码', value: currentWorkshop.workShopCode },
      { label: '车间名称', value: currentWorkshop.workShopName },
      { label: '车间类型', value: typeConfig.label, type: 'tag' as const, options: [typeConfig] },
      { label: '车间主任', value: currentWorkshop.manager },
      { label: '联系电话', value: currentWorkshop.managerPhone || '—' },
      { label: '位置/楼区', value: currentWorkshop.location || '—' },
      { label: '面积(m²)', value: currentWorkshop.area ? `${currentWorkshop.area}` : '—' },
      { label: '在编人员', value: currentWorkshop.headCount ? `${currentWorkshop.headCount} 人` : '—' },
      { label: '工作中心数', value: currentWorkshop.workCenterCount ? `${currentWorkshop.workCenterCount} 个` : '—' },
      { label: '洁净度', value: currentWorkshop.cleanLevel || '—' },
      { label: '状态', value: statusConfig.label, type: 'tag' as const, options: [statusConfig] },
      { label: '创建时间', value: currentWorkshop.createdAt },
      { label: '更新时间', value: currentWorkshop.updatedAt },
      { label: '备注', value: currentWorkshop.remark || '—' },
    ];
  };

  /**
   * 表格列定义
   */
  const columns: ColumnsType<Workshop> = [
    {
      title: '车间编码',
      dataIndex: 'workShopCode',
      key: 'workShopCode',
      width: 120,
      fixed: 'left' as const,
    },
    {
      title: '车间名称',
      dataIndex: 'workShopName',
      key: 'workShopName',
      width: 150,
      fixed: 'left' as const,
    },
    {
      title: '车间类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: WorkshopType) => {
        const typeConfig = WORKSHOP_TYPE_MAP[type];
        return (
          <Tag color={typeConfig.color}>
            {typeConfig.label}
          </Tag>
        );
      },
    },
    {
      title: '车间主任',
      dataIndex: 'manager',
      key: 'manager',
      width: 100,
    },
    {
      title: '联系电话',
      dataIndex: 'managerPhone',
      key: 'managerPhone',
      width: 130,
    },
    {
      title: '位置/楼区',
      dataIndex: 'location',
      key: 'location',
      width: 120,
    },
    {
      title: '面积',
      dataIndex: 'area',
      key: 'area',
      width: 100,
      render: (area: number) => area ? `${area} m²` : '—',
    },
    {
      title: '在编人员',
      dataIndex: 'headCount',
      key: 'headCount',
      width: 100,
      align: 'center' as const,
    },
    {
      title: '工作中心',
      dataIndex: 'workCenterCount',
      key: 'workCenterCount',
      width: 100,
      align: 'center' as const,
    },
    {
      title: '洁净度',
      dataIndex: 'cleanLevel',
      key: 'cleanLevel',
      width: 100,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: WorkshopStatus) => (
        <StatusBadge status={status} statusMap={WORKSHOP_STATUS_MAP} />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 280,
      fixed: 'right' as const,
      render: (_: any, record: Workshop) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
          >
            查看
          </Button>
          {canUpdate('workshop') && (
            <>
              {record.status === 'ACTIVE' ? (
                <Button
                  type="link"
                  size="small"
                  icon={<ToolOutlined />}
                  onClick={() => handleSetMaintenance(record)}
                >
                  设置整修
                </Button>
              ) : (
                <Button
                  type="link"
                  size="small"
                  icon={<CheckCircleOutlined />}
                  onClick={() => handleUnsetMaintenance(record)}
                >
                  取消整修
                </Button>
              )}
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleEdit(record)}
              >
                编辑
              </Button>
            </>
          )}
          {canDelete('workshop') && (
            <Popconfirm
              title="确认删除"
              description={`确定要删除车间「${record.workShopName}」吗？`}
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

  /**
   * 工作中心列表列定义
   */
  const wcColumns: ColumnsType<any> = [
    { title: '编码', dataIndex: 'code', width: 130 },
    { title: '名称', dataIndex: 'name', width: 160 },
    { title: '状态', dataIndex: 'status', width: 90, align: 'center' as const },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right' as const,
      render: (text: any, record: any, index: number) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            danger
            onClick={() => removeWorkCenter(currentWorkshop?.id || '', record.id)}
          >
            移除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="workshop-page" style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
      {/* 统计卡片 */}
      {statistics && (
        <div style={{ background: '#fff', padding: '16px', borderBottom: '1px solid #e8ecf0' }}>
          <Row gutter={16}>
            <Col span={6}>
              <Statistic
                title="车间总数"
                value={statistics.totalCount}
                valueStyle={{ color: '#1677ff' }}
                prefix={<ApartmentOutlined style={{ fontSize: 20 }} />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="正常运行"
                value={statistics.activeCount}
                valueStyle={{ color: '#52c41a' }}
                prefix={<CheckCircleOutlined style={{ fontSize: 20, color: '#52c41a' }} />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="已停用"
                value={statistics.disabledCount}
                valueStyle={{ color: '#8c8c8c' }}
                prefix={<StopOutlined style={{ fontSize: 20, color: '#8c8c8c' }} />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="整修中"
                value={statistics.maintenanceCount}
                valueStyle={{ color: '#faad14' }}
                prefix={<ToolOutlined style={{ fontSize: 20, color: '#faad14' }} />}
              />
            </Col>
          </Row>
        </div>
      )}

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
        title="车间档案"
        actions={[
          { key: 'add', label: '新增', icon: <PlusOutlined />, type: 'primary', onClick: handleAdd },
          { key: 'refresh', label: '刷新', icon: <ReloadOutlined />, onClick: handleRefresh },
        ]}
        selectedCount={selectedIds.length}
        batchActions={[
          { key: 'enable', label: '启用', onClick: handleEnable },
          { key: 'disable', label: '禁用', onClick: handleDisable, danger: true },
        ]}
      />

      {/* 数据表格 */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
        <DataTable
          data={workshops}
          rowKey="id"
          columns={columns}
          loading={loading}
          pagination={pagination}
          paginationState={pagination}
          onPaginationChange={(page, pageSize) => {
            setFilters({ current: page, pageSize });
            loadWorkshops();
          }}
          rowSelection={{
            selectedRowKeys: selectedIds,
            onChange: (keys) => setSelectedIds(keys as string[]),
          }}
          scroll={{ x: 1400 }}
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

      {/* 新增/编辑弹窗 */}
      <FormModal
        visible={modalOpen}
        title={currentWorkshop && currentWorkshop.id ? '编辑车间' : '新增车间'}
        mode={currentWorkshop && currentWorkshop.id ? 'edit' : 'create'}
        fields={WORKSHOP_FORM_FIELDS}
        initialValues={currentWorkshop || {}}
        onSubmit={handleFormSubmit}
        onCancel={() => {
          setModalOpen(false);
          setCurrentWorkshop(null);
        }}
        loading={formLoading}
        width={800}
      />

      {/* 详情抽屉 */}
      <DetailDrawer
        visible={detailOpen}
        title="车间档案详情"
        data={currentWorkshop}
        fields={buildDetailFields()}
        onClose={() => setDetailOpen(false)}
        showActions={true}
        actions={[
          {
            key: 'edit',
            label: '编辑',
            icon: <EditOutlined />,
            onClick: () => {
              setDetailOpen(false);
              handleEdit(currentWorkshop!);
            },
            disabled: !canUpdate('workshop'),
          },
        ]}
        width={600}
        extra={
          <Tabs
            defaultActiveKey="workcenters"
            items={[
              {
                key: 'workcenters',
                label: `工作中心 (${currentWorkshopWorkCenters.length})`,
              },
            ]}
          >
            <div style={{ padding: '12px' }}>
              <Table
                size="small"
                dataSource={currentWorkshopWorkCenters}
                columns={wcColumns}
                rowKey="id"
                pagination={false}
                bordered
              />
            </div>
          </Tabs>
        }
      />
    </div>
  );
};

export default WorkshopList;
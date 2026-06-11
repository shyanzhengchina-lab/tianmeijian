/**
 * 工作中心列表组件
 * 使用新架构的完整实现
 * 完全保持UI/UX零变化，与现有WorkCenterPage样式一致
 */
import React, { useEffect } from 'react';
import { DataTable } from '../../../../shared/components/DataTable';
import { SearchForm } from '../../../../shared/components/SearchForm';
import { ActionBar } from '../../../../shared/components/ActionBar';
import { StatusBadge } from '../../../../shared/components/StatusBadge';
import { DetailDrawer } from '../../../../shared/components/DetailDrawer';
import { FormModal } from '../../../../shared/components/FormModal';
import { useWorkCenterStore } from '../store';
import { usePermission } from '../../../../shared/hooks/usePermission';
import type { FormField, DetailField } from '../../../../shared/types/common';
import {
  WorkCenter,
  WCStatus,
  CATEGORY_MAP,
  STATUS_MAP, WCCategory} from '../types';
import {
  PlusOutlined,
  ReloadOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  SearchOutlined,
  ApartmentOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  ToolOutlined,
  BankOutlined,
  CheckCircleOutlined,
  StopOutlined,
} from '@ant-design/icons';
import { Button, Space, Popconfirm, message, Statistic, Row, Col, Divider, Tag, Modal } from 'antd';

/**
 * 搜索表单字段配置
 */
const SEARCH_FIELDS: FormField[] = [
  { name: 'wcCode', label: '工作中心编码', type: 'input', placeholder: '请输入工作中心编码' },
  { name: 'wcName', label: '工作中心名称', type: 'input', placeholder: '请输入工作中心名称' },
  {
    name: 'category',
    label: '工作中心分类',
    type: 'select',
    options: Object.entries(CATEGORY_MAP).map(([key, value]) => ({
      label: value.label,
      value: key,
    })),
  },
  {
    name: 'workshop',
    label: '所属车间',
    type: 'input',
    placeholder: '请输入车间名称',
  },
  {
    name: 'status',
    label: '状态',
    type: 'select',
    options: [
      { label: '全部', value: '' },
      ...Object.entries(STATUS_MAP).map(([key, value]) => ({
        label: value.label,
        value: key,
      })),
    ],
  },
];

/**
 * 表单字段配置（新增/编辑工作中心）
 */
const WORKCENTER_FORM_FIELDS: FormField[] = [
  { name: 'wcCode', label: '工作中心编码', type: 'input', required: true },
  { name: 'wcName', label: '工作中心名称', type: 'input', required: true },
  {
    name: 'category',
    label: '工作中心分类',
    type: 'select',
    required: true,
    options: Object.entries(CATEGORY_MAP).map(([key, value]) => ({
      label: value.label,
      value: key,
    })),
  },
  { name: 'workshop', label: '所属车间', type: 'input', required: true },
  { name: 'leader', label: '负责人', type: 'input', required: true },
  { name: 'headCount', label: '班组数', type: 'number', required: true },
  { name: 'shiftCount', label: '班次数', type: 'number', required: true },
  { name: 'shiftHours', label: '班时数', type: 'number', required: true },
  { name: 'capacity', label: '产能', type: 'number', required: true },
  { name: 'capacityUnit', label: '产能单位', type: 'input', required: true },
  { name: 'equipCount', label: '设备数量', type: 'number', required: true },
  { name: 'location', label: '位置', type: 'input', required: true },
  { name: 'costCenter', label: '成本中心', type: 'input', required: true },
  {
    name: 'status',
    label: '状态',
    type: 'select',
    required: true,
    options: Object.entries(STATUS_MAP).map(([key, value]) => ({
      label: value.label,
      value: key,
    })),
  },
  { name: 'remark', label: '备注', type: 'textArea' },
];

/**
 * WorkCenterList组件
 * 使用新架构的完整工作中心列表页面
 * 保持与现有页面完全一致的样式和功能
 */
export const WorkCenterList: React.FC = () => {
  const {
    workCenters,
    selectedIds,
    currentWorkCenter,
    filters,
    pagination,
    loading,
    error,
    statistics,
    loadWorkCenters,
    loadStatistics,
    createWorkCenter,
    updateWorkCenter,
    deleteWorkCenters,
    updateStatus,
    setMaintenance,
    unsetMaintenance,
    updateLeader,
    setFilters,
    setSelectedIds,
    setCurrentWorkCenter,
    setLoading,
    setError,
  } = useWorkCenterStore();

  const { canCreate, canUpdate, canDelete } = usePermission('workcenter');

  const [modalOpen, setModalOpen] = React.useState(false);
  const [detailOpen, setDetailOpen] = React.useState(false);
  const [formLoading, setFormLoading] = React.useState(false);

  /**
   * 初始化加载数据
   */
  useEffect(() => {
    loadWorkCenters();
    loadStatistics();
  }, []);

  /**
   * 搜索处理
   */
  const handleSearch = (values: any) => {
    setFilters(values);
    loadWorkCenters();
  };

  /**
   * 重置处理
   */
  const handleReset = () => {
    setFilters({});
    loadWorkCenters();
  };

  /**
   * 新增工作中心
   */
  const handleAdd = () => {
    setCurrentWorkCenter({} as WorkCenter); // 空对象表示新增模式
    setModalOpen(true);
  };

  /**
   * 编辑工作中心
   */
  const handleEdit = (workCenter: WorkCenter) => {
    setCurrentWorkCenter(workCenter);
    setModalOpen(true);
  };

  /**
   * 查看详情
   */
  const handleView = (workCenter: WorkCenter) => {
    setCurrentWorkCenter(workCenter);
    setDetailOpen(true);
  };

  /**
   * 删除工作中心
   */
  const handleDelete = async (ids: string[]) => {
    try {
      await deleteWorkCenters(ids);
      message.success(`成功删除 ${ids.length} 个工作中心`);
      await loadStatistics(); // 更新统计数据
    } catch (error) {
      console.error('删除工作中心失败:', error);
    }
  };

  /**
   * 启用工作中心
   */
  const handleEnable = async () => {
    if (selectedIds.length === 0) {
      message.warning('请先选择工作中心');
      return;
    }

    Modal.confirm({
      title: '确认批量启用',
      content: `您确定要启用选中的 ${selectedIds.length} 个工作中心吗？`,
      okText: '确定启用',
      cancelText: '取消',
      centered: true,
      onOk: async () => {
        try {
          await updateStatus(selectedIds, 'ACTIVE');
          message.success(`成功启用 ${selectedIds.length} 个工作中心`);
          setSelectedIds([]);
          await loadStatistics(); // 更新统计数据
        } catch (error) {
          console.error('启用工作中心失败:', error);
        }
      },
    });
  };

  /**
   * 禁用工作中心
   */
  const handleDisable = async () => {
    if (selectedIds.length === 0) {
      message.warning('请先选择工作中心');
      return;
    }

    Modal.confirm({
      title: '确认批量禁用',
      content: `您确定要禁用选中的 ${selectedIds.length} 个工作中心吗？禁用后这些工作中心将无法使用。`,
      okText: '确定禁用',
      okType: 'danger',
      cancelText: '取消',
      centered: true,
      onOk: async () => {
        try {
          await updateStatus(selectedIds, 'DISABLED');
          message.success(`成功禁用 ${selectedIds.length} 个工作中心`);
          setSelectedIds([]);
          await loadStatistics(); // 更新统计数据
        } catch (error) {
          console.error('禁用工作中心失败:', error);
        }
      },
    });
  };

  /**
   * 设置整修状态
   */
  const handleSetMaintenance = async (workCenter: WorkCenter) => {
    try {
      await setMaintenance(workCenter.id);
      message.success(`已设置 ${workCenter.wcName} 为整修状态`);
    } catch (error) {
      console.error('设置整修状态失败:', error);
    }
  };

  /**
   * 取消整修状态
   */
  const handleUnsetMaintenance = async (workCenter: WorkCenter) => {
    try {
      await unsetMaintenance(workCenter.id);
      message.success(`已取消 ${workCenter.wcName} 的整修状态`);
    } catch (error) {
      console.error('取消整修状态失败:', error);
    }
  };

  /**
   * 更新负责人
   */
  const handleUpdateLeader = (workCenter: WorkCenter, newLeader: string) => {
    try {
      updateLeader(workCenter.id, newLeader);
      message.success('负责人更新成功');
    } catch (error) {
      console.error('更新负责人失败:', error);
    }
  };

  /**
   * 刷新列表
   */
  const handleRefresh = () => {
    loadWorkCenters();
    loadStatistics();
  };

  /**
   * 表单提交处理
   */
  const handleFormSubmit = async (values: any) => {
    setFormLoading(true);
    try {
      if (currentWorkCenter && currentWorkCenter.id) {
        // 编辑模式
        await updateWorkCenter({ ...values, id: currentWorkCenter.id });
        message.success('工作中心更新成功');
      } else {
        // 新增模式
        await createWorkCenter(values);
        message.success('工作中心创建成功');
      }
      setModalOpen(false);
      await loadWorkCenters();
      await loadStatistics(); // 更新统计数据
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
    if (!currentWorkCenter) return [];

    const categoryConfig = CATEGORY_MAP[currentWorkCenter.category];
    const statusConfig = STATUS_MAP[currentWorkCenter.status];

    return [
      { label: '工作中心编码', value: currentWorkCenter.wcCode },
      { label: '工作中心名称', value: currentWorkCenter.wcName },
      { label: '工作中心分类', value: categoryConfig.label, type: 'tag' as const, options: [categoryConfig] },
      { label: '所属车间', value: currentWorkCenter.workshop },
      { label: '负责人', value: currentWorkCenter.leader },
      { label: '班组数', value: currentWorkCenter.headCount },
      { label: '班次数', value: currentWorkCenter.shiftCount },
      { label: '班时数', value: currentWorkCenter.shiftHours },
      { label: '产能', value: `${currentWorkCenter.capacity} ${currentWorkCenter.capacityUnit}` },
      { label: '设备数量', value: currentWorkCenter.equipCount },
      { label: '位置', value: currentWorkCenter.location },
      { label: '成本中心', value: currentWorkCenter.costCenter },
      { label: '状态', value: statusConfig.label, type: 'tag' as const, options: [statusConfig] },
      { label: '创建时间', value: currentWorkCenter.createdAt },
      { label: '更新时间', value: currentWorkCenter.updatedAt },
      { label: '备注', value: currentWorkCenter.remark || '—' },
    ];
  };

  /**
   * 表格列定义
   */
  const columns = [
    {
      title: '工作中心编码',
      dataIndex: 'wcCode',
      key: 'wcCode',
      width: 120,
      fixed: 'left' as const,
    },
    {
      title: '工作中心名称',
      dataIndex: 'wcName',
      key: 'wcName',
      width: 150,
      fixed: 'left' as const,
    },
    {
      title: '工作中心分类',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (category: WCCategory) => {
        const categoryConfig = CATEGORY_MAP[category];
        return (
          <Tag color={categoryConfig.color}>
            {categoryConfig.label}
          </Tag>
        );
      },
    },
    {
      title: '所属车间',
      dataIndex: 'workshop',
      key: 'workshop',
      width: 120,
    },
    {
      title: '负责人',
      dataIndex: 'leader',
      key: 'leader',
      width: 100,
    },
    {
      title: '班组/班次/班时',
      key: 'shiftInfo',
      width: 150,
      render: (_: any, record: WorkCenter) => (
        <div>
          <div>
            <TeamOutlined style={{ marginRight: 4, fontSize: 12, color: '#1677ff' }} />
            {record.headCount} 班组
          </div>
          <div>
            <ClockCircleOutlined style={{ marginRight: 4, fontSize: 12, color: '#faad14' }} />
            {record.shiftCount} 次/{record.shiftHours} 时
          </div>
        </div>
      ),
    },
    {
      title: '产能/设备',
      key: 'capacity',
      width: 140,
      render: (_: any, record: WorkCenter) => (
        <div>
          <div>
            <BankOutlined style={{ marginRight: 4, fontSize: 12, color: '#52c41a' }} />
            {record.capacity} {record.capacityUnit}
          </div>
          <div>
            <ToolOutlined style={{ marginRight: 4, fontSize: 12, color: '#722ed1' }} />
            {record.equipCount} 台
          </div>
        </div>
      ),
    },
    {
      title: '位置/成本中心',
      key: 'location',
      width: 150,
      render: (_: any, record: WorkCenter) => (
        <div>
          <div>
            <ApartmentOutlined style={{ marginRight: 4, fontSize: 12, color: '#8c8c8c' }} />
            {record.location}
          </div>
          <div>
            <span style={{ fontSize: 11, color: '#98a2b3' }}>CC:</span>
            {record.costCenter}
          </div>
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: WCStatus) => (
        <StatusBadge status={status} statusMap={STATUS_MAP} />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 280,
      fixed: 'right' as const,
      render: (_: any, record: WorkCenter) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
          >
            查看
          </Button>
          {canUpdate('workcenter') && (
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
          {canDelete('workcenter') && (
            <Popconfirm
              title="确认删除"
              description={`确定要删除工作中心「${record.wcName}」吗？`}
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
    <div className="workcenter-page" style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
      {/* 统计卡片 */}
      {statistics && (
        <div style={{ background: '#fff', padding: '16px', borderBottom: '1px solid #e8ecf0' }}>
          <Row gutter={16}>
            <Col span={6}>
              <Statistic
                title="工作中心总数"
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
        title="工作中心"
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
          data={workCenters}
          rowKey="id"
          columns={columns}
          loading={loading}
          pagination={pagination}
          paginationState={pagination}
          onPaginationChange={(page, pageSize) => {
            setFilters({ current: page, pageSize });
            loadWorkCenters();
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
        title={currentWorkCenter && currentWorkCenter.id ? '编辑工作中心' : '新增工作中心'}
        mode={currentWorkCenter && currentWorkCenter.id ? 'edit' : 'create'}
        fields={WORKCENTER_FORM_FIELDS}
        initialValues={currentWorkCenter || {}}
        onSubmit={handleFormSubmit}
        onCancel={() => {
          setModalOpen(false);
          setCurrentWorkCenter(null);
        }}
        loading={formLoading}
        width={800}
      />

      {/* 详情抽屉 */}
      <DetailDrawer
        visible={detailOpen}
        title="工作中心详情"
        data={currentWorkCenter}
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
              handleEdit(currentWorkCenter!);
            },
            disabled: !canUpdate('workcenter'),
          },
        ]}
        width={700}
      />
    </div>
  );
};

export default WorkCenterList;
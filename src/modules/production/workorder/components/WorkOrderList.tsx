import React, { useEffect, useCallback, useMemo } from 'react';
import { Space, Button, message, Popconfirm, Tag, Progress, Statistic, Row, Col } from 'antd';
import {
  PlusOutlined,
  ReloadOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  SendOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  StopOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { DataTable as DataTableBase } from '../../../../shared/components/DataTable';
import { SearchForm, FormField } from '../../../../shared/components/SearchForm';
import { ActionBar, ActionItem } from '../../../../shared/components/ActionBar';
import { FormModal } from '../../../../shared/components/FormModal';
import { DetailDrawer, DetailField } from '../../../../shared/components/DetailDrawer';
import { SimpleStatusBadge } from '../../../../shared/components/StatusBadge';
import { useWorkOrderStore } from '../store/workOrderStore';
import {
  WorkOrder,
  TaskOrder,
  WorkOrderQuery,
  CreateWorkOrderDTO,
  UpdateWorkOrderDTO,
  WORK_ORDER_STATUS_MAP,
  WORK_ORDER_PRIORITY_MAP,
  WORK_ORDER_TYPE_MAP,
  WORK_ORDER_COLUMNS,
  TASK_ORDER_COLUMNS,
  WorkOrderStatistics,
} from '../types';
/**
 * 生产工单列表组件
 * 使用通用组件构建完整的工单管理页面
 */


// 导入共享组件
const DataTable = DataTableBase as any;

// 导入工单模块

/**
 * WorkOrderList组件
 */
function WorkOrderList() {
  // 获取工单Store
  const {
    workOrders,
    total,
    loading,
    query,
    selectedWorkOrderIds,
    currentWorkOrder,
    showWorkOrderDetail,
    statistics,
    activeTab,
    showCreateModal,
    showEditModal,
    showReleaseModal,
    showPauseModal,

    // Actions
    loadWorkOrders,
    refreshWorkOrders,
    createWorkOrder,
    updateWorkOrder,
    deleteWorkOrders,
    batchReleaseWorkOrders,
    batchPauseWorkOrders,
    batchResumeWorkOrders,
    batchCancelWorkOrders,
    setCurrentWorkOrder,
    setShowWorkOrderDetail,
    setActiveTab,
    setShowCreateModal: toggleCreateModal,
    setShowEditModal: toggleEditModal,
    setShowReleaseModal: toggleReleaseModal,
    setShowPauseModal: togglePauseModal,
    loadStatistics,
  } = useWorkOrderStore();

  // 初始化数据
  useEffect(() => {
    loadWorkOrders();
    loadStatistics();
  }, []);

  // 监听查询参数变化，重新加载数据
  useEffect(() => {
    if (activeTab === 'workorder') {
      loadWorkOrders();
    }
  }, [query, activeTab]);

  // 搜索表单字段
  const searchFields: FormField[] = useMemo(() => [
    { name: 'woNo', label: '工单编号', type: 'input', placeholder: '请输入工单编号' },
    { name: 'productName', label: '产品名称', type: 'input', placeholder: '请输入产品名称' },
    {
      name: 'status',
      label: '状态',
      type: 'select',
      placeholder: '请选择状态',
      options: [
        { label: '全部', value: '' },
        ...Object.entries(WORK_ORDER_STATUS_MAP).map(([key, value]) => ({
          label: value.label,
          value: key,
        })),
      ],
    },
    {
      name: 'priority',
      label: '优先级',
      type: 'select',
      placeholder: '请选择优先级',
      options: [
        { label: '全部', value: '' },
        ...Object.entries(WORK_ORDER_PRIORITY_MAP).map(([key, value]) => ({
          label: value.label,
          value: key,
        })),
      ],
    },
    {
      name: 'type',
      label: '类型',
      type: 'select',
      placeholder: '请选择类型',
      options: [
        { label: '全部', value: '' },
        ...Object.entries(WORK_ORDER_TYPE_MAP).map(([key, value]) => ({
          label: value.label,
          value: key,
        })),
      ],
    },
    {
      name: 'workCenter',
      label: '工作中心',
      type: 'select',
      placeholder: '请选择工作中心',
      options: [
        { label: '生产车间', value: 'WC001' },
        { label: '包装车间', value: 'WC002' },
        { label: '组装车间', value: 'WC003' },
      ],
    },
  ], []);

  // 顶部操作栏
  const actionBarActions: ActionItem[] = useMemo(() => [
    {
      key: 'create',
      label: '新建工单',
      icon: <PlusOutlined />,
      onClick: () => {
        setCurrentWorkOrder(null);
        toggleCreateModal(true);
      },
    },
    {
      key: 'refresh',
      label: '刷新',
      icon: <ReloadOutlined />,
      onClick: () => refreshWorkOrders(),
    },
  ], []);

  // 批量操作
  const batchActions: ActionItem[] = useMemo(() => [
    {
      key: 'batch-release',
      label: '批量下发',
      icon: <SendOutlined />,
      onClick: () => {
        if (selectedWorkOrderIds.length === 0) {
          message.warning('请先选择工单');
          return;
        }
        toggleReleaseModal(true);
      },
      disabled: selectedWorkOrderIds.length === 0,
    },
    {
      key: 'batch-pause',
      label: '批量暂停',
      icon: <PauseCircleOutlined />,
      onClick: () => {
        if (selectedWorkOrderIds.length === 0) {
          message.warning('请先选择工单');
          return;
        }
        togglePauseModal(true);
      },
      disabled: selectedWorkOrderIds.length === 0,
    },
    {
      key: 'batch-resume',
      label: '批量恢复',
      icon: <PlayCircleOutlined />,
      onClick: () => {
        if (selectedWorkOrderIds.length === 0) {
          message.warning('请先选择工单');
          return;
        }
        batchResumeWorkOrders(selectedWorkOrderIds);
      },
      disabled: selectedWorkOrderIds.length === 0,
    },
    {
      key: 'batch-cancel',
      label: '批量取消',
      icon: <StopOutlined />,
      onClick: () => {
        if (selectedWorkOrderIds.length === 0) {
          message.warning('请先选择工单');
          return;
        }
        toggleReleaseModal(false);
        batchCancelWorkOrders(selectedWorkOrderIds);
      },
      disabled: selectedWorkOrderIds.length === 0,
      danger: true,
    },
  ], [selectedWorkOrderIds]);

  // 工单表格列配置
  const tableColumns = useMemo(() => {
    return WORK_ORDER_COLUMNS.map(col => {
      if (col.key === 'status') {
        return {
          ...col,
          render: (status: string) => <SimpleStatusBadge status={status} />,
        };
      }
      if (col.key === 'priority') {
        return {
          ...col,
          render: (priority: string) => {
            const priorityConfig = (WORK_ORDER_PRIORITY_MAP as any)[priority];
            return (
              <span>
                {priorityConfig.icon} {priorityConfig.label}
              </span>
            );
          },
        };
      }
      if (col.key === 'type') {
        return {
          ...col,
          render: (type: string) => {
            const typeConfig = (WORK_ORDER_TYPE_MAP as any)[type];
            return (
              <span>
                {typeConfig.icon} {typeConfig.label}
              </span>
            );
          },
        };
      }
      if (col.key === 'progress') {
        return {
          ...col,
          render: (progress: number, record: WorkOrder) => (
            <Progress
              percent={progress}
              status={record.status === 'COMPLETED' ? 'success' : 'active'}
              strokeColor={{
                '0%': '#52c41a',
                '100%': '#52c41a',
              }}
            />
          ),
        };
      }
      if (col.key === 'planStartTime' || col.key === 'planEndTime') {
        return {
          ...col,
          render: (text: string) => dayjs(text).format('YYYY-MM-DD HH:mm'),
        };
      }
      if (col.key === 'action') {
        return {
          ...col,
          render: (_: any, record: WorkOrder) => (
            <Space size="small">
              <Button size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
                详情
              </Button>
              <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
                编辑
              </Button>
              <Popconfirm
                title="确定要删除这个工单吗？"
                onConfirm={() => handleDelete([record.id])}
                okText="确定"
                cancelText="取消"
              >
                <Button size="small" icon={<DeleteOutlined />} danger>
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
    // TODO: 实现搜索逻辑
    console.log('搜索:', values);
  }, []);

  // 重置处理
  const handleReset = useCallback(() => {
    // TODO: 实现重置逻辑
    console.log('重置');
  }, []);

  // 分页处理
  const handlePageChange = useCallback((page: number, pageSize: number) => {
    // TODO: 实现分页逻辑
    console.log('分页:', { page, pageSize });
  }, []);

  // 新建工单
  const handleCreate = useCallback(async (values: CreateWorkOrderDTO) => {
    await createWorkOrder(values);
  }, [createWorkOrder]);

  // 编辑工单
  const handleEdit = useCallback((record: WorkOrder) => {
    setCurrentWorkOrder(record);
    toggleEditModal(true);
  }, [setCurrentWorkOrder, toggleEditModal]);

  // 更新工单
  const handleUpdate = useCallback(async (values: UpdateWorkOrderDTO) => {
    await updateWorkOrder(values);
  }, [updateWorkOrder]);

  // 删除工单
  const handleDelete = useCallback(async (ids: string[]) => {
    await deleteWorkOrders(ids);
  }, [deleteWorkOrders]);

  // 批量下发
  const handleBatchRelease = useCallback(async () => {
    await batchReleaseWorkOrders(selectedWorkOrderIds);
    toggleReleaseModal(false);
  }, [selectedWorkOrderIds, batchReleaseWorkOrders, toggleReleaseModal]);

  // 批量暂停
  const handleBatchPause = useCallback(async () => {
    await batchPauseWorkOrders(selectedWorkOrderIds);
    togglePauseModal(false);
  }, [selectedWorkOrderIds, batchPauseWorkOrders, togglePauseModal]);

  // 查看详情
  const handleViewDetail = useCallback((record: WorkOrder) => {
    setCurrentWorkOrder(record);
    setShowWorkOrderDetail(true);
  }, [setCurrentWorkOrder, setShowWorkOrderDetail]);

  // 关闭详情
  const handleCloseDetail = useCallback(() => {
    setShowWorkOrderDetail(false);
    setCurrentWorkOrder(null);
  }, [setShowWorkOrderDetail, setCurrentWorkOrder]);

  // 详情字段配置
  const getDetailFields = useCallback((wo: WorkOrder): DetailField[] => {
    return [
      { label: '工单编号', value: wo.woNo, type: 'text' },
      { label: '产品名称', value: wo.productName, type: 'text' },
      { label: '产品编码', value: wo.productCode, type: 'text' },
      { label: '产品规格', value: wo.productSpec, type: 'text' },
      { label: '数量', value: wo.quantity, type: 'number' },
      { label: '单位', value: wo.unit, type: 'text' },
      { label: '状态', value: wo.status, type: 'tag' },
      { label: '优先级', value: wo.priority, type: 'text' },
      { label: '类型', value: wo.type, type: 'text' },
      { label: '工作中心', value: wo.workCenter, type: 'text' },
      { label: '操作员', value: wo.operatorName, type: 'text' },
      { label: '计划开始时间', value: dayjs(wo.planStartTime).format('YYYY-MM-DD HH:mm:ss'), type: 'text' },
      { label: '计划结束时间', value: dayjs(wo.planEndTime).format('YYYY-MM-DD HH:mm:ss'), type: 'text' },
      { label: '实际开始时间', value: wo.actualStartTime ? dayjs(wo.actualStartTime).format('YYYY-MM-DD HH:mm:ss') : '-', type: 'text' },
      { label: '实际结束时间', value: wo.actualEndTime ? dayjs(wo.actualEndTime).format('YYYY-MM-DD HH:mm:ss') : '-', type: 'text' },
      { label: '进度', value: wo.progress, type: 'number' },
      { label: '备注', value: wo.remark, type: 'text' },
      { label: '创建时间', value: dayjs(wo.createTime).format('YYYY-MM-DD HH:mm:ss'), type: 'text' },
      { label: '创建人', value: wo.creatorName, type: 'text' },
    ];
  }, []);

  // 工单表单字段配置
  const formFields = useMemo(() => [
    {
      name: 'productName',
      label: '产品名称',
      type: 'input',
      placeholder: '请输入产品名称',
      required: true,
      rules: [{ required: true, message: '请输入产品名称' }],
    },
    {
      name: 'productCode',
      label: '产品编码',
      type: 'input',
      placeholder: '请输入产品编码',
      required: true,
      rules: [{ required: true, message: '请输入产品编码' }],
    },
    {
      name: 'productSpec',
      label: '产品规格',
      type: 'input',
      placeholder: '请输入产品规格',
    },
    {
      name: 'quantity',
      label: '数量',
      type: 'number',
      placeholder: '请输入数量',
      required: true,
      rules: [{ required: true, message: '请输入数量' }],
    },
    {
      name: 'unit',
      label: '单位',
      type: 'select',
      placeholder: '请选择单位',
      required: true,
      options: [
        { label: '个', value: 'PCS' },
        { label: 'kg', value: 'KG' },
        { label: 'm', value: 'M' },
      ],
    },
    {
      name: 'priority',
      label: '优先级',
      type: 'select',
      placeholder: '请选择优先级',
      required: true,
      options: Object.entries(WORK_ORDER_PRIORITY_MAP).map(([key, value]) => ({
        label: value.label,
        value: key,
      })),
    },
    {
      name: 'type',
      label: '类型',
      type: 'select',
      placeholder: '请选择类型',
      options: Object.entries(WORK_ORDER_TYPE_MAP).map(([key, value]) => ({
        label: value.label,
        value: key,
      })),
    },
    {
      name: 'planStartTime',
      label: '计划开始时间',
      type: 'input',
      placeholder: '请选择计划开始时间',
      required: true,
      rules: [{ required: true, message: '请选择计划开始时间' }],
    },
    {
      name: 'planEndTime',
      label: '计划结束时间',
      type: 'input',
      placeholder: '请选择计划结束时间',
      required: true,
      rules: [{ required: true, message: '请选择计划结束时间' }],
    },
    {
      name: 'workCenter',
      label: '工作中心',
      type: 'select',
      placeholder: '请选择工作中心',
      options: [
        { label: '生产车间', value: 'WC001' },
        { label: '包装车间', value: 'WC002' },
        { label: '组装车间', value: 'WC003' },
      ],
    },
    {
      name: 'operatorId',
      label: '操作员',
      type: 'select',
      placeholder: '请选择操作员',
      options: [
        { label: '张三', value: 'OP001' },
        { label: '李四', value: 'OP002' },
        { label: '王五', value: 'OP003' },
      ],
    },
    {
      name: 'remark',
      label: '备注',
      type: 'textArea',
      placeholder: '请输入备注',
    },
  ], []);

  return (
    <div style={{ padding: '24px', background: '#f0f2f5' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 统计信息 */}
        {statistics && (
          <Row gutter={16}>
            <Col span={4}>
              <Statistic
                title="总工单"
                value={statistics.totalCount}
                valueStyle={{ color: '#1890ff' }}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title="草稿"
                value={statistics.draftCount}
                valueStyle={{ color: '#8c8c8c' }}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title="已创建"
                value={statistics.createdCount}
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title="已下发"
                value={statistics.releasedCount}
                valueStyle={{ color: '#faad14' }}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title="执行中"
                value={statistics.inProgressCount}
                valueStyle={{ color: '#1890ff' }}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title="已完成"
                value={statistics.completedCount}
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title="按期交付率"
                value={statistics.onTimeDeliveryRate}
                suffix="%"
                precision={1}
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title="平均周期"
                value={statistics.avgCycleTime}
                suffix="天"
                precision={1}
                valueStyle={{ color: '#1890ff' }}
              />
            </Col>
          </Row>
        )}

        {/* 顶部操作栏 */}
        <ActionBar
          title={`生产工单管理 ${total ? ` (共 ${total} 条)` : ''}`}
          actions={actionBarActions}
          selectedCount={selectedWorkOrderIds.length}
          batchActions={batchActions}
        />

        {/* 搜索表单 */}
        <SearchForm
          fields={searchFields}
          onSearch={handleSearch}
          onReset={handleReset}
          layout="inline"
        />

        {/* 工单表格 */}
        <DataTable
          data={workOrders}
          loading={loading}
          rowKey="id"
          columns={tableColumns as any}
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
            selectedRowKeys: selectedWorkOrderIds,
            onChange: (keys: any[]) => {
              // TODO: 实现行选择逻辑
              console.log('选中行:', keys);
            },
          }}
          showActions={true}
          onRefresh={() => refreshWorkOrders()}
          sticky={true}
          extra={
            statistics && (
              <div style={{ padding: '12px', fontSize: 12, color: '#666' }}>
                <div>生产效率指标</div>
                <div style={{ marginTop: 8 }}>
                  <span>完成数量：{statistics.completedQuantity} / {statistics.totalQuantity}</span>
                </div>
              </div>
            )
          }
        />
      </Space>

      {/* 新建工单弹窗 */}
      <FormModal
        visible={showCreateModal}
        title="新建工单"
        mode="create"
        initialValues={{}}
        fields={formFields as FormField[]}
        onSubmit={handleCreate}
        onCancel={() => toggleCreateModal(false)}
        loading={loading}
        width={800}
        submitText="创建"
      />

      {/* 编辑工单弹窗 */}
      <FormModal
        visible={showEditModal}
        title="编辑工单"
        mode="edit"
        initialValues={currentWorkOrder as any}
        fields={formFields as FormField[]}
        onSubmit={handleUpdate}
        onCancel={() => toggleEditModal(false)}
        loading={loading}
        width={800}
        submitText="保存"
      />

      {/* 批量下发确认弹窗 */}
      <FormModal
        visible={showReleaseModal}
        title="确认批量下发"
        mode="edit"
        initialValues={{}}
        fields={[
          {
            name: 'confirm',
            label: '确认信息',
            type: 'textArea' as const,
            placeholder: '请输入下发说明',
          } as any,
        ]}
        onSubmit={() => handleBatchRelease()}
        onCancel={() => toggleReleaseModal(false)}
        loading={loading}
        width={600}
        submitText="确认下发"
      />

      {/* 批量暂停确认弹窗 */}
      <FormModal
        visible={showPauseModal}
        title="确认批量暂停"
        mode="edit"
        initialValues={{}}
        fields={[
          {
            name: 'reason',
            label: '暂停原因',
            type: 'textArea' as const,
            placeholder: '请输入暂停原因',
          },
        ]}
        onSubmit={() => handleBatchPause()}
        onCancel={() => togglePauseModal(false)}
        loading={loading}
        width={600}
        submitText="确认暂停"
      />

      {/* 工单详情抽屉 */}
      <DetailDrawer
        visible={showWorkOrderDetail}
        title="工单详情"
        fields={currentWorkOrder ? getDetailFields(currentWorkOrder) : []}
        onClose={handleCloseDetail}
        width={700}
        showActions={true}
        onEdit={() => {
          handleEdit(currentWorkOrder!);
          handleCloseDetail();
        }}
        onDelete={async () => {
          await handleDelete([currentWorkOrder!.id]);
          handleCloseDetail();
        }}
      />
    </div>
  );
}

export default WorkOrderList;

import React, { useEffect, useCallback, useMemo } from 'react';
import { Space, Button, message, Popconfirm, Tag, Progress, Modal, Descriptions, Tabs, Card, Row, Col, Spin, Empty } from 'antd';
import {
  PrinterOutlined,
  PlusOutlined,
  ReloadOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  StopOutlined,
  ExclamationCircleOutlined,
  UndoOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { DataTable as DataTableBase } from '../../../../shared/components/DataTable';
import { SearchForm, FormField } from '../../../../shared/components/SearchForm';
import { ActionBar, ActionItem } from '../../../../shared/components/ActionBar';
import { FormModal } from '../../../../shared/components/FormModal';
import { DetailDrawer, DetailField } from '../../../../shared/components/DetailDrawer';
import { SimpleStatusBadge } from '../../../../shared/components/StatusBadge';
import { useFloatTicketStore } from './store/floatTicketStore';
import {
  FloatTicket,
  FloatTicketQuery,
  CreateFloatTicketDTO,
  UpdateFloatTicketDTO,
  FloatTicketStatus,
  FloatTicketType,
  BatchPrintFloatTicketDTO,
  FLOAT_TICKET_STATUS_MAP,
  FLOAT_TICKET_TYPE_MAP,
  FLOAT_TICKET_COLUMNS,
} from './types';
/**
 * 浮票列表组件
 * 使用通用组件构建完整的浮票管理页面
 */


// 导入共享组件
const DataTable = DataTableBase as any;

// 导入浮票模块

/**
 * FloatTicketList组件
 */
function FloatTicketList() {
  // 获取浮票Store
  const {
    floatTickets,
    total,
    loading,
    query,
    selectedTicketIds,
    selectedTickets,
    currentTicket,
    showTicketDetail,
    activeTab,
    showCreateModal,
    showEditModal,
    showPrintModal,
    showReturnModal,
    batchOperationLoading,

    // Actions
    loadFloatTickets,
    refreshFloatTickets,
    createFloatTicket,
    updateFloatTicket,
    deleteFloatTickets,
    passOperation,
    failOperation,
    skipOperation,
    printTicket,
    batchPrintTickets,
    returnTicket,
    setCurrentTicket,
    setShowTicketDetail,
    setActiveTab,
    setShowCreateModal: toggleCreateModal,
    setShowEditModal: toggleEditModal,
    setShowPrintModal: togglePrintModal,
    setShowReturnModal: toggleReturnModal,
    setSelectedTicketIds,
    setQuery,
  } = useFloatTicketStore();

  // 行选择处理
  const handleSelectionChange = useCallback((keys: React.Key[]) => {
    setSelectedTicketIds(keys as string[]);
  }, [setSelectedTicketIds]);

  // 状态筛选处理
  const handleStatusFilter = useCallback((status: string) => {
    setQuery({ status: status as any });
  }, [setQuery]);

  // 初始化数据
  useEffect(() => {
    loadFloatTickets();
  }, []);

  // 搜索表单字段
  const searchFields: FormField[] = useMemo(() => [
    { name: 'ticketNo', label: '浮票编号', type: 'input', placeholder: '请输入浮票编号' },
    { name: 'workOrderId', label: '工单编号', type: 'input', placeholder: '请输入工单编号' },
    { name: 'productName', label: '产品名称', type: 'input', placeholder: '请输入产品名称' },
    {
      name: 'status',
      label: '状态',
      type: 'select',
      placeholder: '请选择状态',
      options: [
        { label: '全部', value: '' },
        ...Object.entries(FLOAT_TICKET_STATUS_MAP).map(([key, val]) => ({
          label: (val as any).label,
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
        ...Object.entries(FLOAT_TICKET_TYPE_MAP).map(([key, val]) => ({
          label: (val as any).label,
          value: key,
        })),
      ],
    },
    {
      name: 'currentOpId',
      label: '当前工序',
      type: 'select',
      placeholder: '请选择当前工序',
      options: [
        { label: '全部', value: '' },
        { label: '压片工序', value: 'OP001' },
        { label: '包装工序', value: 'OP002' },
        { label: '干燥工序', value: 'OP003' },
        { label: '混合工序', value: 'OP004' },
      ],
    },
  ], []);

  // 顶部操作栏
  const actionBarActions: ActionItem[] = useMemo(() => [
    {
      key: 'create',
      label: '新建浮票',
      icon: <PlusOutlined />,
      onClick: () => {
        setCurrentTicket(null);
        toggleCreateModal(true);
      },
    },
    {
      key: 'refresh',
      label: '刷新',
      icon: <ReloadOutlined />,
      onClick: () => refreshFloatTickets(),
    },
    {
      key: 'batch-print',
      label: '批量打印',
      icon: <PrinterOutlined />,
      onClick: () => {
        if (selectedTicketIds.length === 0) {
          message.warning('请先选择浮票');
          return;
        }
        togglePrintModal(true);
      },
      disabled: selectedTicketIds.length === 0,
    },
  ], []);

  // 浮票表格列配置
  const floatTicketColumns = useMemo(() => {
    return FLOAT_TICKET_COLUMNS.map((col: any) => {
      if (col.key === 'status') {
        return {
          ...col,
          render: (status: string) => <SimpleStatusBadge status={status} />,
        };
      }
      if (col.key === 'type') {
        return {
          ...col,
          render: (type: string) => {
            const typeConfig = (FLOAT_TICKET_TYPE_MAP as any)[type];
            return (
              <Space>
                {typeConfig.icon} {typeConfig.label}
              </Space>
            );
          },
        };
      }
      if (col.key === 'progress') {
        return {
          ...col,
          render: (progress: number, record: FloatTicket) => {
            if (record.status === 'COMPLETED' && record.progress === 100) {
              return <Tag color="success">已完成</Tag>;
            }
            return (
              <Progress
                percent={progress}
                status={record.status === 'COMPLETED' ? 'success' : 'active'}
                strokeColor={{
                  '0%': '#52c41a',
                  '100%': '#52c41a',
                }}
                format={(percent) => `${(percent ?? 0).toFixed(1)}%`}
              />
            );
          },
        };
      }
      if (col.key === 'action') {
        return {
          ...col,
          render: (_: any, record: FloatTicket) => (
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
                disabled={record.status !== 'CREATED'}
              >
                编辑
              </Button>
              <Popconfirm
                title="确定要删除这个浮票吗？"
                onConfirm={() => handleDelete([record.id])}
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
              {record.status === 'IN_PROGRESS' && (
                <Button
                  type="link"
                  size="small"
                  icon={<StopOutlined />}
                  onClick={() => handlePause(record)}
                >
                  暂停
                </Button>
              )}
              {record.status === 'PAUSED' && (
                <Button
                  type="link"
                  size="small"
                  icon={<PlayCircleOutlined />}
                  onClick={() => handleResume(record)}
                >
                  恢复
                </Button>
              )}
            </Space>
          ),
        };
      }
      return col;
    });
  }, []);

  // 搜索处理
  const handleSearch = useCallback((values: any) => {
    console.log('搜索:', values);
    // TODO: 实现搜索逻辑
  }, []);

  // 重置处理
  const handleReset = useCallback(() => {
    console.log('重置');
    // TODO: 实现重置逻辑
  }, []);

  // 分页处理
  const handlePageChange = useCallback((page: number, pageSize: number) => {
    // TODO: 实现分页逻辑
    console.log('分页:', { page, pageSize });
  }, []);

  // 刷新处理（带提示）
  const handleRefresh = useCallback(() => {
    loadFloatTickets();
    message.success('刷新成功');
  }, [loadFloatTickets]);

  // 新建浮票
  const handleCreate = useCallback(async (values: any) => {
    const createData: CreateFloatTicketDTO = {
      workOrderId: values.workOrderId,
      batchNo: values.batchNo || '',
      ticketType: 'NORMAL',
      quantity: parseInt(values.quantity, 10),
      currentOpId: values.currentOpId,
      workstationId: values.workstationId,
      operatorId: values.operatorId,
      priority: values.priority || 'NORMAL',
      remark: values.remark,
    };

    await createFloatTicket(createData);
    toggleCreateModal(false);
  }, [createFloatTicket, toggleCreateModal]);

  // 编辑浮票
  const handleEdit = useCallback((record: FloatTicket) => {
    setCurrentTicket(record);
    toggleEditModal(true);
  }, [setCurrentTicket, toggleEditModal]);

  // 更新浮票
  const handleUpdate = useCallback(async (values: any) => {
    if (!currentTicket) return;

    const updateData: UpdateFloatTicketDTO = {
      id: currentTicket.id,
      quantity: parseInt(values.quantity, 10),
      operatorId: values.operatorId,
      priority: values.priority,
      remark: values.remark,
    };

    await updateFloatTicket(updateData);
    toggleEditModal(false);
  }, [updateFloatTicket, toggleEditModal]);

  // 删除浮票
  const handleDelete = useCallback(async (ids: string[]) => {
    await deleteFloatTickets(ids);
  }, [deleteFloatTickets]);

  // 查看详情
  const handleViewDetail = useCallback((record: FloatTicket) => {
    setCurrentTicket(record);
    setShowTicketDetail(true);
  }, [setCurrentTicket, setShowTicketDetail]);

  // 暂停浮票
  const handlePause = useCallback(async (record: FloatTicket) => {
    if (record.status !== 'IN_PROGRESS') {
      message.warning('只有执行中的浮票可以暂停');
      return;
    }

    await failOperation({
      action: 'FAIL',
      ticketId: record.id,
      opId: record.currentOpId,
      qty: 0,
      remark: '手动暂停',
    });
  }, [failOperation]);

  // 恢复浮票
  const handleResume = useCallback(async (record: FloatTicket) => {
    if (record.status !== 'PAUSED') {
      message.warning('只有已暂停的浮票可以恢复');
      return;
    }

    await passOperation({
      action: 'PASS',
      ticketId: record.id,
      opId: record.currentOpId,
      qty: 0,
      remark: '手动恢复',
    });
  }, [passOperation]);

  // 过站浮票
  const handlePass = useCallback(async (record: FloatTicket) => {
    await passOperation({
      action: 'PASS',
      ticketId: record.id,
      opId: record.currentOpId,
      qty: record.quantity ?? 0,
      remark: '手动过站',
    });
  }, [passOperation]);

  // 失败处理浮票
  const handleFail = useCallback(async (record: FloatTicket) => {
    await failOperation({
      action: 'FAIL',
      ticketId: record.id,
      opId: record.currentOpId,
      qty: 0,
      remark: '手动标记失败',
    });
  }, [failOperation]);

  // 跳过工序
  const handleSkip = useCallback(async (record: FloatTicket) => {
    await skipOperation({
      action: 'REWORK',
      ticketId: record.id,
      opId: record.currentOpId,
      qty: 0,
      remark: '手动跳过',
    });
  }, [skipOperation]);

  // 打印浮票
  const handlePrint = useCallback(async (record: FloatTicket) => {
    await printTicket(record.id);
    message.success('打印任务已添加到队列');
  }, [printTicket]);

  // 批量打印
  const handleBatchPrint = useCallback(() => {
    const tickets = selectedTickets.filter((t: FloatTicket) => t.status === 'CREATED');
    if (tickets.length === 0) {
      message.warning('请先选择已创建的浮票');
      return;
    }

    const printData: BatchPrintFloatTicketDTO = {
      workOrderId: tickets[0]?.workOrderId || '',
      batchSize: tickets.length,
      printer: '默认打印机',
    };

    batchPrintTickets(printData);
    togglePrintModal(false);
  }, [batchPrintTickets, selectedTickets, togglePrintModal]);

  // 返工浮票
  const handleReturn = useCallback(async (record: FloatTicket) => {
    if (record.type !== 'RETURNED') {
      message.warning('只有返工类型的浮票可以返工');
      return;
    }

    setCurrentTicket(record);
    toggleReturnModal(true);
  }, [setCurrentTicket, toggleReturnModal]);

  // 确认返工
  const handleReturnConfirm = useCallback(async () => {
    if (!currentTicket) return;

    await returnTicket({
      ticketId: currentTicket.id,
      returnOpId: currentTicket.currentOpId,
      returnQty: 0,
      returnReason: '生产完成正常返工',
    });

    toggleReturnModal(false);
    setShowTicketDetail(true);
  }, [returnTicket, toggleReturnModal, setShowTicketDetail]);

  // 关闭详情
  const handleCloseDetail = useCallback(() => {
    setShowTicketDetail(false);
    setCurrentTicket(null);
  }, [setShowTicketDetail, setCurrentTicket]);

  // 关闭创建弹窗
  const handleCloseCreateModal = useCallback(() => {
    toggleCreateModal(false);
    setCurrentTicket(null);
  }, [toggleCreateModal, setCurrentTicket]);

  // 关闭编辑弹窗
  const handleCloseEditModal = useCallback(() => {
    toggleEditModal(false);
    setCurrentTicket(null);
  }, [toggleEditModal, setCurrentTicket]);

  // 关闭打印弹窗
  const handleClosePrintModal = useCallback(() => {
    togglePrintModal(false);
  }, [togglePrintModal]);

  // 关闭返工弹窗
  const handleCloseReturnModal = useCallback(() => {
    toggleReturnModal(false);
  }, [toggleReturnModal]);

  // 浮票状态过滤
  const statusFilter = useMemo(() => [
    { label: '全部', value: '' },
    { label: '已创建', value: 'CREATED' },
    { label: '已打印', value: 'PINTED' },
    { label: '执行中', value: 'IN_PROGRESS' },
    { label: '已过站', value: 'PASSED' },
    { label: '已取消', value: 'CANCELLED' },
  ], []);

  // 详情字段配置
  const getDetailFields = useCallback((ticket: FloatTicket): DetailField[] => {
    return [
      { label: '浮票编号', value: ticket.ticketNo, type: 'text' },
      { label: '工单编号', value: ticket.workOrderNo, type: 'text' },
      { label: '批号', value: ticket.batchNo, type: 'text' },
      { label: '产品名称', value: ticket.productName, type: 'text' },
      { label: '产品编码', value: ticket.productCode, type: 'text' },
      { label: '产品规格', value: ticket.productSpec, type: 'text' },
      { label: '数量', value: ticket.quantity, type: 'number' },
      { label: '类型', value: ticket.type, type: 'text' },
      { label: '状态', value: ticket.status, type: 'tag' },
      { label: '当前工序', value: ticket.currentOpName, type: 'text' },
      { label: '工位', value: ticket.workstationName, type: 'text' },
      { label: '操作员', value: ticket.operatorName, type: 'text' },
      { label: '创建时间', value: dayjs(ticket.createTime).format('YYYY-MM-DD HH:mm:ss'), type: 'text' },
    ];
  }, []);

  // 创建浮票表单字段
  const formFields = useMemo(() => [
    {
      name: 'workOrderId',
      label: '工单ID',
      type: 'select',
      placeholder: '请选择工单',
      options: [
        { label: 'WO202505001', value: 'WO202505001' },
        { label: 'WO202505002', value: 'WO202505002' },
        { label: 'WO202505003', value: 'WO202505003' },
      ],
      required: true,
      rules: [{ required: true, message: '请选择工单' }],
    },
    {
      name: 'batchNo',
      label: '批号',
      type: 'input',
      placeholder: '请输入批号',
      rules: [{ required: true, message: '请输入批号' }],
    },
    {
      name: 'quantity',
      label: '数量',
      type: 'number',
      placeholder: '请输入数量',
      required: true,
      rules: [{ required: true, message: '请输入数量', min: 1 }],
    },
    {
      name: 'currentOpId',
      label: '当前工序',
      type: 'select',
      placeholder: '请选择工序',
      options: [
        { label: '全部', value: '' },
        { label: '压片工序', value: 'OP001' },
        { label: '包装工序', value: 'OP002' },
        { label: '干燥工序', value: 'OP003' },
        { label: '混合工序', value: 'OP004' },
      ],
      required: true,
      rules: [{ required: true, message: '请选择工序' }],
    },
    {
      name: 'workstationId',
      label: '工位',
      type: 'select',
      placeholder: '请选择工位',
      options: [
        { label: '全部', value: '' },
        { label: '压片工位', value: 'WS001' },
        { label: '包装工位', value: 'WS002' },
        { label: '干燥工位', value: 'WS003' },
      ],
      required: true,
      rules: [{ required: true, message: '请选择工位' }],
    },
    {
      name: 'operatorId',
      label: '操作员',
      type: 'select',
      placeholder: '请选择操作员',
      options: [
        { label: '全部', value: '' },
        { label: '张三', value: 'OP001' },
        { label: '李四', value: 'OP002' },
        { label: '王五', value: 'OP003' },
      ],
      required: true,
      rules: [{ required: true, message: '请选择操作员' }],
    },
    {
      name: 'priority',
      label: '优先级',
      type: 'select',
      placeholder: '请选择优先级',
      options: [
        { label: '全部', value: '' },
        { label: '紧急', value: 'HIGH' },
        { label: '高', value: 'NORMAL' },
        { label: '低', value: 'LOW' },
      ],
      defaultValue: 'NORMAL',
    },
    {
      name: 'ticketType',
      label: '浮票类型',
      type: 'select',
      placeholder: '请选择类型',
      options: [
        { label: '全部', value: '' },
        { label: '正常浮票', value: 'NORMAL' },
        { label: '异常浮票', value: 'EXCEPTION' },
        { label: '返工浮票', value: 'RETURNED' },
      ],
      required: true,
      defaultValue: 'NORMAL',
    },
    {
      name: 'remark',
      label: '备注',
      type: 'textArea' as const,
      placeholder: '请输入备注',
      rows: 4,
    },
  ] as FormField[], []);

  return (
    <div style={{ padding: '24px', background: '#f0f2f5' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 顶部操作栏 */}
        <ActionBar
          title="浮票管理"
          actions={actionBarActions}
          selectedCount={selectedTicketIds.length}
          extra={
            activeTab === 'list' && (
              <Space>
                <Button
                  icon={<PrinterOutlined />}
                  onClick={() => handleBatchPrint()}
                  disabled={selectedTicketIds.length === 0}
                >
                  批量打印
                </Button>
                {batchOperationLoading && (
                  <Spin size="small" />
                )}
              </Space>
            )}
        />

        {/* 搜索表单 */}
        <SearchForm
          fields={searchFields}
          onSearch={handleSearch}
          onReset={handleReset}
          layout="inline"
        />

        {/* Tab切换和筛选 */}
        <Row gutter={16}>
          <Col span={18}>
            <Tabs
              activeKey={activeTab}
              items={[
                {
                  key: 'list',
                  label: '浮票列表',
                  children: (
                    <Card bordered={false}>
                      <DataTable
                        data={floatTickets}
                        loading={loading}
                        rowKey="id"
                        columns={floatTicketColumns}
                        pagination={{
                          current: query.current,
                          pageSize: query.pageSize,
                          total: total,
                          onChange: handlePageChange,
                          pageSizeOptions: [10, 20, 50, 100],
                          showSizeChanger: true,
                          showQuickJumper: true,
                        }}
                        rowSelection={{
                          selectedRowKeys: selectedTicketIds,
                          onChange: handleSelectionChange,
                        }}
                        onRefresh={handleRefresh}
                        onRowClick={(record: any) => handleViewDetail(record as FloatTicket)}
                        sticky={true}
                      />
                    </Card>
                  ),
                },
                {
                  key: 'detail',
                  label: '浮票详情',
                  children: (
                    <Card
                      bordered={false}
                      style={{ minHeight: 400 }}
                      extra={
                        <Space>
                          {currentTicket && (
                            <>
                              <Button
                                icon={<EditOutlined />}
                                onClick={() => handleEdit(currentTicket)}
                                disabled={currentTicket.status !== 'CREATED'}
                              >
                                编辑
                              </Button>
                              <Button
                                icon={<DeleteOutlined />}
                                onClick={() => handleDelete([currentTicket.id])}
                                danger
                              >
                                删除
                              </Button>
                            </>
                          )}
                          <Button
                            icon={<ReloadOutlined />}
                            onClick={() => loadFloatTickets()}
                          >
                            刷新
                          </Button>
                        </Space>
                      }
                    >
                      {currentTicket ? (
                        <Descriptions
                          column={2}
                          size="middle"
                          bordered
                          items={getDetailFields(currentTicket)}
                          extra={
                            <Space>
                              {currentTicket.status === 'IN_PROGRESS' && (
                                <Button
                                  icon={<StopOutlined />}
                                  onClick={() => handlePause(currentTicket)}
                                >
                                  暂停
                                </Button>
                              )}
                              {currentTicket.status === 'PASSED' && (
                                <Button
                                  icon={<PlayCircleOutlined />}
                                  onClick={() => handleResume(currentTicket)}
                                >
                                  恢复
                                </Button>
                              )}
                              {currentTicket.type === 'RETURNED' && (
                                <Button
                                  type="primary"
                                  icon={<UndoOutlined />}
                                  onClick={() => handleReturn(currentTicket)}
                                >
                                  返工
                                </Button>
                              )}
                            </Space>
                          }
                        />
                      ) : (
                        <Empty
                          description="请从列表中选择浮票查看详情"
                          image={<ExclamationCircleOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />}
                        />
                      )}
                    </Card>
                  ),
                },
              ]}
            />
          </Col>
          <Col span={6}>
            <Card title="状态筛选" bordered={false}>
              <Space direction="vertical" style={{ width: '100%' }}>
                {statusFilter.map(filter => (
                  <Tag
                    key={filter.value}
                    color={filter.value === '' ? 'blue' : 'default'}
                    style={{
                      cursor: 'pointer',
                      marginBottom: 8,
                      ...(query.status === filter.value ? { backgroundColor: '#e6f7ff', borderColor: '#1890ff' } : {}),
                    }}
                    onClick={() => handleStatusFilter(filter.value)}
                  >
                    {filter.label} {filter.value !== '' && `(${query.status === filter.value ? 0 : '0'})`}
                  </Tag>
                ))}
              </Space>
            </Card>
          </Col>
        </Row>

        {/* 新建浮票弹窗 */}
        <FormModal
          visible={showCreateModal}
          title="新建浮票"
          mode="create"
          initialValues={{}}
          fields={formFields}
          onSubmit={handleCreate}
          onCancel={handleCloseCreateModal}
          loading={loading}
          width={800}
          submitText="创建"
        />

        {/* 编辑浮票弹窗 */}
        <FormModal
          visible={showEditModal}
          title="编辑浮票"
          mode="edit"
          initialValues={currentTicket || {}}
          fields={formFields}
          onSubmit={handleUpdate}
          onCancel={handleCloseEditModal}
          loading={loading}
          width={800}
          submitText="保存"
        />

        {/* 批量打印弹窗 */}
        <Modal
          title="确认批量打印"
          open={showPrintModal}
          onOk={handleBatchPrint}
          onCancel={handleClosePrintModal}
          okText="确认打印"
          cancelText="取消"
        >
          <p>您将批量打印 {selectedTickets.length} 个浮票，确认继续？</p>
          <p style={{ color: '#1890ff', marginTop: 16 }}>
            打印机：默认打印机
          <br />
            打印份数：{selectedTickets.filter((t: FloatTicket) => t.status === 'CREATED').length} 份
          </p>
        </Modal>

        {/* 返工浮票弹窗 */}
        <Modal
          title="确认返工"
          open={showReturnModal}
          onOk={handleReturnConfirm}
          onCancel={handleCloseReturnModal}
          okText="确认返工"
          cancelText="取消"
        >
          <p>您确认要将浮票 {currentTicket?.ticketNo} 标记为返工吗？</p>
          <Descriptions column={1} size="middle" bordered>
            <Descriptions.Item label="产品名称">
              {currentTicket?.productName}
            </Descriptions.Item>
            <Descriptions.Item label="当前工序">
              {currentTicket?.currentOpName}
            </Descriptions.Item>
            <Descriptions.Item label="当前数量">
              {currentTicket?.quantity}
            </Descriptions.Item>
            <Descriptions.Item label="工序完成度">
              {currentTicket?.progress}
            </Descriptions.Item>
          </Descriptions>
          <p style={{ color: '#faad14', marginTop: 16 }}>
            返工后将记录原因：<strong>生产完成正常返工</strong>
          </p>
        </Modal>

        {/* 浮票详情抽屉 */}
        <DetailDrawer
          visible={showTicketDetail}
          title="浮票详情"
          fields={currentTicket ? getDetailFields(currentTicket) : []}
          onClose={handleCloseDetail}
          width={700}
          showActions={true}
          onEdit={() => {
            handleEdit(currentTicket!);
            handleCloseDetail();
          }}
          onDelete={() => {
            handleDelete([currentTicket!.id]);
            handleCloseDetail();
          }}
        />
      </Space>
    </div>
  );
}

export default FloatTicketList;
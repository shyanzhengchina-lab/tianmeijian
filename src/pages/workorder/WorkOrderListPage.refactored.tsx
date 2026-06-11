/**
 * 生产工单页面 - 重构版
 * 使用通用组件DataTable、SearchForm、ActionBar、FormModal、DetailDrawer
 * 大幅简化代码，提高可维护性
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Space, Button, Tag, message } from 'antd';
import { ReloadOutlined, PlusOutlined, DownloadOutlined, PrinterOutlined, EyeOutlined, SendOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

// 导入通用组件
import { DataTable, DataTableProps } from '@/shared/components/DataTable';
import { SearchForm, SearchFormProps, FormField } from '@/shared/components/SearchForm';
import { ActionBar, ActionItem, ActionBarProps } from '@/shared/components/ActionBar';
import { DetailDrawer, DetailDrawerProps, DetailField } from '@/shared/components/DetailDrawer';
import { FormModal, FormModalProps, FormField as FormFieldType } from '@/shared/components/FormModal';
import { StatusBadge, SimpleStatusBadge } from '@/shared/components/StatusBadge';

// 导入API和数据（暂时保持原有逻辑）
import {
  WorkOrder, TaskOrder, FloatTicketV2,
  WO_STATUS, TASK_STATUS, FT_STATUS, WOStatus, FTStatus,
  PRIORITY_MAP, ROUTING_MASTERS, ROUTING_STEPS,
  WORK_CENTERS, SHIFTS, TEAMS, OPERATORS, PAD_STATIONS, EQUIPMENTS,
  FINISHED_GOODS, FinishedGood,
  genWONo, genTaskNo,
} from './workOrderData';
import { useWorkOrderStore } from '../../modules/production/workorder/store/workOrderStore';

// Mock data for demonstration
const mockWorkOrders: WorkOrder[] = [];
const mockTaskOrders: TaskOrder[] = [];
const mockFloatTicketsV2: FloatTicketV2[] = [];

/**
 * 工单状态映射
 */
const WORK_ORDER_STATUS_MAP = {
  DRAFT: { label: '草稿', color: '#8c8c8c', bg: '#f5f5f5', border: '#d9d9d9' },
  CREATED: { label: '已创建', color: '#1890ff', bg: '#e6f7ff', border: '#91d5ff' },
  RELEASED: { label: '已下发', color: '#52c41a', bg: '#f6ffed', border: '#b7eb8f' },
  IN_PROGRESS: { label: '执行中', color: '#faad14', bg: '#fffbe6', border: '#ffe58f' },
  PAUSED: { label: '已暂停', color: '#8c8c8c', bg: '#f5f5f5', border: '#d9d9d9' },
  COMPLETED: { label: '已完成', color: '#52c41a', bg: '#f6ffed', border: '#b7eb8f' },
  CANCELLED: { label: '已取消', color: '#ff4d4f', bg: '#fff1f0', border: '#ffa39e' },
};

/**
 * 任务单状态映射
 */
const TASK_STATUS_MAP = {
  DRAFT: { label: '草稿', color: '#8c8c8c', bg: '#f5f5f5', border: '#d9d9d9' },
  CREATED: { label: '已创建', color: '#1890ff', bg: '#e6f7ff', border: '#91d5ff' },
  RELEASED: { label: '已下发', color: '#52c41a', bg: '#f6ffed', border: '#b7eb8f' },
  IN_PROGRESS: { label: '执行中', color: '#faad14', bg: '#fffbe6', border: '#ffe58f' },
  PAUSED: { label: '已暂停', color: '#8c8c8c', bg: '#f5f5f5', border: '#d9d9d9' },
  COMPLETED: { label: '已完成', color: '#52c41a', bg: '#f6ffed', border: '#b7eb8f' },
  CANCELLED: { label: '已取消', color: '#ff4d4f', bg: '#fff1f0', border: '#ffa39e' },
};

// Placeholder handlers — real implementations are defined inside the component
// These exist only so module-level column defs can reference them without TS errors
let handleViewDetail: (record: any) => void = () => {};
let handleExport: (record?: any) => void = () => {};
let handlePrintTask: (record: any) => void = () => {};

/**
 * 工单表格列配置
 */
const WORK_ORDER_COLUMNS = [
  {
    key: 'woNo',
    title: '工单编号',
    width: 120,
    align: 'center',
    fixed: 'left',
    sorter: (a: any, b: any) => a.woNo.localeCompare(b.woNo),
  },
  {
    key: 'product',
    title: '产品',
    width: 150,
    align: 'center',
  },
  {
    key: 'routingCode',
    title: '工艺路径',
    width: 120,
    align: 'center',
  },
  {
    key: 'planQty',
    title: '计划数量',
    width: 100,
    align: 'center',
  },
  {
    key: 'status',
    title: '状态',
    width: 100,
    align: 'center',
    render: (status: string) => <SimpleStatusBadge status={status} />,
  },
  {
    key: 'progress',
    title: '进度',
    width: 120,
    align: 'center',
    render: (text: any, record: WorkOrder) => {
      if (!record.actualQty) return <span>-</span>;
      const pct = record.planQty > 0 ? Math.round((record.actualQty / record.planQty) * 100) : 0;
      return (
        <div style={{ width: '100%' }}>
          <div style={{ width: `${pct}%`, background: '#52c41a', height: 8, borderRadius: 4 }} />
        </div>
      );
    },
  },
  {
    key: 'createTime',
    title: '创建时间',
    width: 160,
    align: 'center',
    sorter: (a: any, b: any) => dayjs(a.createTime).unix() - dayjs(b.createTime).unix(),
  },
  {
    key: 'action',
    title: '操作',
    width: 200,
    align: 'center',
    fixed: 'right',
    render: (_: any, record: WorkOrder) => (
      <Space>
        <Button size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
          详情
        </Button>
        <Button size="small" icon={<DownloadOutlined />} onClick={() => handleExport(record)}>
          导出
        </Button>
      </Space>
    ),
  },
];

/**
 * 任务单表格列配置
 */
const TASK_ORDER_COLUMNS = [
  {
    key: 'taskNo',
    title: '任务单编号',
    width: 150,
    align: 'center',
    fixed: 'left',
  },
  {
    key: 'status',
    title: '状态',
    width: 100,
    align: 'center',
    render: (status: string) => <SimpleStatusBadge status={status} />,
  },
  {
    key: 'workCenter',
    title: '工作中心',
    width: 120,
    align: 'center',
  },
  {
    key: 'operator',
    title: '操作员',
    width: 120,
    align: 'center',
  },
  {
    key: 'planStart',
    title: '计划开始',
    width: 120,
    align: 'center',
  },
  {
    key: 'planEnd',
    title: '计划结束',
    width: 120,
    align: 'center',
  },
  {
    key: 'reportQty',
    title: '报工数量',
    width: 100,
    align: 'center',
  },
  {
    key: 'padStation',
    title: '投料站',
    width: 100,
    align: 'center',
  },
  {
    key: 'action',
    title: '操作',
    width: 150,
    align: 'center',
    render: (_: any, record: TaskOrder) => (
      <Space>
        <Button size="small" icon={<PrinterOutlined />} onClick={() => handlePrintTask(record)}>
          打印
        </Button>
      </Space>
    ),
  },
];

/**
 * 浮票表格列配置
 */
const FLOAT_TICKET_COLUMNS = [
  {
    key: 'ticketNo',
    title: '浮票编号',
    width: 120,
    align: 'center',
    fixed: 'left',
  },
  {
    key: 'status',
    title: '状态',
    width: 100,
    align: 'center',
    render: (status: string) => <SimpleStatusBadge status={status} />,
  },
  {
    key: 'currentOp',
    title: '当前工序',
    width: 150,
    align: 'center',
  },
  {
    key: 'printTime',
    title: '打印时间',
    width: 160,
    align: 'center',
  },
  {
    key: 'action',
    title: '操作',
    width: 150,
    align: 'center',
    render: (_: any, record: FloatTicketV2) => (
      <Space>
        <Button size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
          详情
        </Button>
      </Space>
    ),
  },
];

/**
 * WorkOrderListPage组件
 */
function WorkOrderListPage() {
  // State
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [taskOrders, setTaskOrders] = useState<TaskOrder[]>([]);
  const [floatTickets, setFloatTickets] = useState<FloatTicketV2[]>([]);
  const [selectedWorkOrderIds, setSelectedWorkOrderIds] = useState<React.Key[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'workOrder' | 'taskOrder' | 'floatTicket'>('workOrder');

  // 加载数据
  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'workOrder') {
        // TODO: 调用API加载工单数据
        setWorkOrders(mockWorkOrders);
      } else if (activeTab === 'taskOrder') {
        // TODO: 调用API加载任务单数据
        setTaskOrders(mockTaskOrders);
      } else {
        // TODO: 调用API加载浮票数据
        setFloatTickets(mockFloatTicketsV2);
      }
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 搜索表单字段
  const searchFields: FormField[] = [
    { name: 'woNo', label: '工单编号', type: 'input' },
    { name: 'status', label: '状态', type: 'select', options: [
      { label: '草稿', value: 'DRAFT' },
      { label: '已创建', value: 'CREATED' },
      { label: '已下发', value: 'RELEASED' },
      { label: '执行中', value: 'IN_PROGRESS' },
      { label: '已暂停', value: 'PAUSED' },
      { label: '已完成', value: 'COMPLETED' },
    ] },
    { name: 'workCenter', label: '工作中心', type: 'select', options: [
      { label: '生产车间', value: 'WC001' },
      { label: '包装车间', value: 'WC002' },
    ] },
  ];

  // 顶部操作栏
  const workOrderActions: ActionItem[] = [
    {
      key: 'create',
      label: '新建工单',
      icon: <PlusOutlined />,
      onClick: () => handleCreateWorkOrder(),
    },
    {
      key: 'batch-release',
      label: '批量下发',
      icon: <SendOutlined />,
      onClick: () => handleBatchRelease(),
    },
  ];

  // 顶部操作栏
  const taskOrderActions: ActionItem[] = [
    {
      key: 'create',
      label: '新建任务单',
      icon: <PlusOutlined />,
      onClick: () => handleCreateTaskOrder(),
    },
  ];

  // 顶部操作栏
  const floatTicketActions: ActionItem[] = [
    {
      key: 'create',
      label: '新建浮票',
      icon: <PlusOutlined />,
      onClick: () => handleCreateFloatTicket(),
    },
  ];

  // 表格操作
  const workOrderTableActions: ActionItem[] = [
    {
      key: 'refresh',
      label: '刷新',
      icon: <ReloadOutlined />,
      onClick: () => loadData(),
    },
    {
      key: 'export',
      label: '导出',
      icon: <DownloadOutlined />,
      onClick: () => handleExport(),
    },
  ];

  // 事件处理
  const handleCreateWorkOrder = useCallback(() => {
    // TODO: 打开新建工单表单
    message.info('新建工单功能待实现');
  }, []);

  const handleBatchRelease = useCallback(() => {
    // TODO: 批量下发工单
    message.info('批量下发功能待实现');
  }, []);

  const handleCreateTaskOrder = useCallback(() => {
    // TODO: 打开新建任务单表单
    message.info('新建任务单功能待实现');
  }, []);

  const handleCreateFloatTicket = useCallback(() => {
    // TODO: 打开新建浮票表单
    message.info('新建浮票功能待实现');
  }, []);

  const handleViewDetail = useCallback((record: any) => {
    if (activeTab === 'workOrder') {
      showWorkOrderDetail(record);
    } else if (activeTab === 'taskOrder') {
      showTaskOrderDetail(record);
    } else {
      showFloatTicketDetail(record);
    }
  }, [activeTab]);

  const handleExport = useCallback(() => {
    // TODO: 导出功能
    message.info('导出功能待实现');
  }, []);

  const handlePrintTask = useCallback((record: any) => {
    // TODO: 打印任务单
    message.info('打印功能待实现');
  }, []);

  const handleSearch = useCallback((values: any) => {
    console.log('搜索:', values);
    // TODO: 实现搜索逻辑
  }, []);

  const handleWorkOrderSelectionChange = useCallback((selectedRowKeys: React.Key[], selectedRows: WorkOrder[]) => {
    setSelectedWorkOrderIds(selectedRowKeys);
  }, []);

  // 工单详情弹窗
  const [showWorkOrderModal, setShowWorkOrderModal] = useState(false);
  const [currentWorkOrder, setCurrentWorkOrder] = useState<WorkOrder | null>(null);

  // 任务单详情抽屉
  const [showTaskOrderDrawer, setShowTaskOrderDrawer] = useState(false);
  const [currentTaskOrder, setCurrentTaskOrder] = useState<TaskOrder | null>(null);

  // 浮票详情抽屉
  const [showFloatTicketDrawer, setShowFloatTicketDrawer] = useState(false);
  const [currentFloatTicket, setCurrentFloatTicket] = useState<FloatTicketV2 | null>(null);

  // 工单详情字段
  const getWorkOrderDetailFields = (wo: WorkOrder): DetailField[] => [
    { label: '工单编号', value: wo.woNo },
    { label: '产品', value: `${wo.productName} ${wo.productSpec || ''}` },
    { label: '工艺路径', value: wo.routingCode },
    { label: '计划数量', value: wo.planQty },
    { label: '实际数量', value: wo.actualQty },
    { label: '状态', value: wo.status, type: 'tag' },
    { label: '创建时间', value: dayjs(wo.createTime).format('YYYY-MM-DD HH:mm:ss'), type: 'date' },
  ];

  // 任务单详情字段
  const getTaskOrderDetailFields = (to: TaskOrder): DetailField[] => [
    { label: '任务单编号', value: to.taskNo },
    { label: '工单编号', value: to.woNo },
    { label: '工作中心', value: to.workCenter },
    { label: '操作员', value: to.operator },
    { label: '计划开始', value: to.planStart },
    { label: '计划结束', value: to.planEnd },
    { label: '报工数量', value: to.reportQty },
    { label: '投料站', value: to.padStation },
    { label: '状态', value: to.status, type: 'tag' },
  ];

  // 浮票详情字段
  const getFloatTicketDetailFields = (ft: FloatTicketV2): DetailField[] => [
    { label: '浮票编号', value: ft.ticketNo },
    { label: '状态', value: ft.status, type: 'tag' },
    { label: '当前工序', value: ft.currentOp },
    { label: '打印时间', value: ft.printTime },
  ];

  // 详情弹窗
  const showWorkOrderDetail = useCallback((wo: WorkOrder) => {
    setCurrentWorkOrder(wo);
    setShowWorkOrderModal(true);
  }, []);

  const showTaskOrderDetail = useCallback((to: TaskOrder) => {
    setCurrentTaskOrder(to);
    setShowTaskOrderDrawer(true);
  }, []);

  const showFloatTicketDetail = useCallback((ft: FloatTicketV2) => {
    setCurrentFloatTicket(ft);
    setShowFloatTicketDrawer(true);
  }, []);

  // 关闭详情
  const closeWorkOrderDetail = useCallback(() => {
    setShowWorkOrderModal(false);
    setCurrentWorkOrder(null);
  }, []);

  const closeTaskOrderDetail = useCallback(() => {
    setShowTaskOrderDrawer(false);
    setCurrentTaskOrder(null);
  }, []);

  const closeFloatTicketDetail = useCallback(() => {
    setShowFloatTicketDrawer(false);
    setCurrentFloatTicket(null);
  }, []);

  // Tab切换
  const handleTabChange = useCallback((key: string) => {
    setActiveTab(key as 'workOrder' | 'taskOrder' | 'floatTicket');
    setSelectedWorkOrderIds([]);
    }, []);

  return (
    <div style={{ padding: '24px', background: '#f0f2f5' }}>
      <Space direction="vertical" size="large">
        {/* 顶部操作栏 */}
        <ActionBar
          title="生产工单管理"
          actions={activeTab === 'workOrder' ? workOrderActions : (activeTab === 'taskOrder' ? taskOrderActions : floatTicketActions)}
          extra={
            <Tag color="blue">
              共 {activeTab === 'workOrder' ? workOrders.length : activeTab === 'taskOrder' ? taskOrders.length : floatTickets.length} 条
            </Tag>
          }
        />

        {/* 搜索表单 */}
        <SearchForm
          fields={searchFields}
          onSearch={handleSearch}
          layout="inline"
        />

        {/* Tab切换 */}
        <div style={{ marginBottom: 16 }}>
          <Space>
            <Button
              type={activeTab === 'workOrder' ? 'primary' : 'default'}
              onClick={() => handleTabChange('workOrder')}
            >
              工单
            </Button>
            <Button
              type={activeTab === 'taskOrder' ? 'primary' : 'default'}
              onClick={() => handleTabChange('taskOrder')}
            >
              任务单
            </Button>
            <Button
              type={activeTab === 'floatTicket' ? 'primary' : 'default'}
              onClick={() => handleTabChange('floatTicket')}
            >
              浮票
            </Button>
          </Space>
        </div>

        {/* 工单表格 */}
        {activeTab === 'workOrder' && (
          <DataTable
            data={workOrders}
            loading={loading}
            rowKey="id"
            columns={WORK_ORDER_COLUMNS as any}
            rowSelection={{
              selectedRowKeys: selectedWorkOrderIds,
              onChange: handleWorkOrderSelectionChange,
            }}
            actions={workOrderTableActions}
          />
        )}

        {/* 任务单表格 */}
        {activeTab === 'taskOrder' && (
          <DataTable
            data={taskOrders}
            loading={loading}
            rowKey="id"
            columns={TASK_ORDER_COLUMNS as any}
            actions={workOrderTableActions}
          />
        )}

        {/* 浮票表格 */}
        {activeTab === 'floatTicket' && (
          <DataTable
            data={floatTickets}
            loading={loading}
            rowKey="id"
            columns={FLOAT_TICKET_COLUMNS as any}
            actions={workOrderTableActions}
          />
        )}
      </Space>

      {/* 工单详情弹窗 */}
      <FormModal
        visible={showWorkOrderModal}
        title="工单详情"
        fields={[]}
        onSubmit={() => {}}
        onCancel={closeWorkOrderDetail}
        width={800}
      >
        <DetailDrawer
          visible={showWorkOrderModal}
          title="工单详情"
          fields={currentWorkOrder ? getWorkOrderDetailFields(currentWorkOrder) : []}
          onClose={closeWorkOrderDetail}
        />
      </FormModal>

      {/* 任务单详情抽屉 */}
      <DetailDrawer
        visible={showTaskOrderDrawer}
        title="任务单详情"
        fields={currentTaskOrder ? getTaskOrderDetailFields(currentTaskOrder) : []}
        onClose={closeTaskOrderDetail}
      />

      {/* 浮票详情抽屉 */}
      <DetailDrawer
        visible={showFloatTicketDrawer}
        title="浮票详情"
        fields={currentFloatTicket ? getFloatTicketDetailFields(currentFloatTicket) : []}
        onClose={closeFloatTicketDetail}
      />
    </div>
  );
}

export default WorkOrderListPage;

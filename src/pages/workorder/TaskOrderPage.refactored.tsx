/**
 * 生产任务单页面 - 重构版（简化示例）
 * 使用通用组件DataTable、SearchForm、ActionBar、FormModal、DetailDrawer
 * 展示如何使用通用组件重构大型页面
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Space, Button, message } from 'antd';
import { ReloadOutlined, PlusOutlined, PrinterOutlined, EyeOutlined } from '@ant-design/icons';

// 导入通用组件
import { DataTable } from '@/shared/components/DataTable';
import { SearchForm, FormField } from '@/shared/components/SearchForm';
import { ActionBar, ActionItem } from '@/shared/components/ActionBar';
import { DetailDrawer, DetailField } from '@/shared/components/DetailDrawer';
import { SimpleStatusBadge } from '@/shared/components/StatusBadge';

// 临时使用原有数据
import { TaskOrder } from './workOrderData';

/**
 * 任务单状态映射
 */
const TASK_ORDER_STATUS_MAP = {
  DRAFT: { label: '草稿', color: '#8c8c8c', bg: '#f5f5f5', border: '#d9d9d9' },
  RELEASED: { label: '已下发', color: '#52c41a', bg: '#f6ffed', border: '#b7eb8f' },
  IN_PROGRESS: { label: '执行中', color: '#faad14', bg: '#fffbe6', border: '#ffe58f' },
  PAUSED: { label: '已暂停', color: '#8c8c8c', bg: '#f5f5f5', border: '#d9d9d9' },
  COMPLETED: { label: '已完成', color: '#52c41a', bg: '#f6ffed', border: '#b7eb8f' },
  CANCELLED: { label: '已取消', color: '#ff4d4f', bg: '#fff1f0', border: '#ffa39e' },
};

/**
 * TaskOrderPage组件
 */
function TaskOrderPage() {
  // State
  const [taskOrders, setTaskOrders] = useState<TaskOrder[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDetailDrawer, setShowDetailDrawer] = useState(false);
  const [currentTaskOrder, setCurrentTaskOrder] = useState<TaskOrder | null>(null);

  // 事件处理
  const handleCreate = useCallback(() => {
    message.info('新建任务单功能待实现');
  }, []);

  const handleViewDetail = useCallback((record: TaskOrder) => {
    setCurrentTaskOrder(record);
    setShowDetailDrawer(true);
  }, []);

  const handlePrint = useCallback((record: TaskOrder) => {
    message.info('打印功能待实现');
  }, []);

  const handleSearch = useCallback((values: any) => {
    console.log('搜索:', values);
    // TODO: 实现搜索逻辑
  }, []);

  const handleSelectionChange = useCallback((selectedRowKeys: React.Key[], selectedRows: TaskOrder[]) => {
    setSelectedRowKeys(selectedRowKeys);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setShowDetailDrawer(false);
    setCurrentTaskOrder(null);
  }, []);

  // 加载数据
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // TODO: 调用API加载数据
      // setTaskOrders(response.data);
      console.log('加载数据...');
      setLoading(false);
    } catch (error) {
      message.error('加载数据失败');
      setLoading(false);
    }
  };

  // 搜索表单字段
  const searchFields: FormField[] = [
    { name: 'taskNo', label: '任务单编号', type: 'input' },
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
  const actionBarActions: ActionItem[] = [
    {
      key: 'create',
      label: '新建任务单',
      icon: <PlusOutlined />,
      onClick: () => handleCreate(),
    },
    {
      key: 'refresh',
      label: '刷新',
      icon: <ReloadOutlined />,
      onClick: () => loadData(),
    },
  ];

  // 详情字段
  const getDetailFields = (task: TaskOrder): DetailField[] => {
    return [
      { label: '任务单编号', value: task.taskNo, type: 'text' },
      { label: '工单编号', value: task.woNo, type: 'text' },
      { label: '状态', value: task.status, type: 'tag' },
      { label: '工作中心', value: task.workCenter, type: 'text' },
      { label: '操作员', value: task.operator, type: 'text' },
      { label: '计划开始', value: task.planStart, type: 'text' },
      { label: '计划结束', value: task.planEnd, type: 'text' },
      { label: '报工数量', value: task.reportQty, type: 'number' },
      { label: '投料站', value: task.padStation, type: 'text' },
    ];
  };

  // 任务单表格列配置
  const TASK_ORDER_COLUMNS: any[] = [
    {
      key: 'taskNo',
      title: '任务单编号',
      width: 120,
      align: 'center',
      fixed: 'left',
    },
    {
      key: 'woNo',
      title: '工单编号',
      width: 120,
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
      width: 140,
      align: 'center',
    },
    {
      key: 'planEnd',
      title: '计划结束',
      width: 140,
      align: 'center',
    },
    {
      key: 'reportQty',
      title: '报工数量',
      width: 100,
      align: 'center',
    },
    {
      key: 'action',
      title: '操作',
      width: 150,
      align: 'center',
      fixed: 'right',
      render: (_: any, record: TaskOrder) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            详情
          </Button>
          <Button size="small" icon={<PrinterOutlined />} onClick={() => handlePrint(record)}>
            打印
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px', background: '#f0f2f5' }}>
      <Space direction="vertical" size="large">
        {/* 顶部操作栏 */}
        <ActionBar
          title="生产任务单管理"
          actions={actionBarActions}
        />

        {/* 搜索表单 */}
        <SearchForm
          fields={searchFields}
          onSearch={handleSearch}
          layout="inline"
        />

        {/* 任务单表格 */}
        <DataTable
          data={taskOrders}
          loading={loading}
          rowKey="id"
          columns={TASK_ORDER_COLUMNS}
          rowSelection={{
            selectedRowKeys,
            onChange: handleSelectionChange,
          }}
          showRefresh={true}
          onRefresh={loadData}
        />
      </Space>

      {/* 详情抽屉 */}
      <DetailDrawer
        visible={showDetailDrawer}
        title="任务单详情"
        fields={currentTaskOrder ? getDetailFields(currentTaskOrder) : []}
        onClose={handleCloseDetail}
      />
    </div>
  );
}

export default TaskOrderPage;
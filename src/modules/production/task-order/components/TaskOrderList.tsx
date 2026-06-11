/**
 * 生产任务单列表组件
 * 提供完整的任务单管理功能：查询、新增、编辑、删除、分配、开始、完成、暂停、恢复、取消
 */

import React, { useEffect } from 'react';
import { Space, message, Modal, Select, Button } from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, UserOutlined, PlayCircleOutlined,
  CheckCircleOutlined, PauseCircleOutlined, PlaySquareOutlined, StopOutlined,
  ExportOutlined, TeamOutlined
} from '@ant-design/icons';
import { DataTable, SearchForm, ActionBar, FormModal, DetailDrawer, StatusBadge } from '../../../../shared/components';
import { useTaskOrderStore } from '../store';
import { TO_STATUS_MAP, TO_PRIORITY_MAP } from '../types';
import type { TaskOrder, TaskOrderQuery } from '../types';

const { Option } = Select;

export const TaskOrderList: React.FC = () => {
  const store = useTaskOrderStore() as any;
  const {
    taskOrders, selectedIds, currentTaskOrder, filters, pagination, loading, error,
    loadTaskOrders, createTaskOrder, updateTaskOrder, deleteTaskOrders,
    assignTaskOrder, startTaskOrder, completeTaskOrder, pauseTaskOrder,
    resumeTaskOrder, cancelTaskOrder, exportTaskOrders,
    setFilters, setSelectedIds, setCurrentTaskOrder, setPagination,
  } = store;

  useEffect(() => {
    loadTaskOrders();
  }, []);

  // 搜索字段配置
  const searchFields = [
    {
      name: 'taskNo',
      label: '任务单号',
      type: 'input' as const,
      placeholder: '请输入任务单号',
      width: 200,
    },
    {
      name: 'woNo',
      label: '工单号',
      type: 'input' as const,
      placeholder: '请输入工单号',
      width: 180,
    },
    {
      name: 'productCode',
      label: '产品编码',
      type: 'input' as const,
      placeholder: '请输入产品编码',
      width: 180,
    },
    {
      name: 'productName',
      label: '产品名称',
      type: 'input' as const,
      placeholder: '请输入产品名称',
      width: 180,
    },
    {
      name: 'status',
      label: '状态',
      type: 'select' as const,
      placeholder: '请选择状态',
      width: 140,
      options: Object.entries(TO_STATUS_MAP).map(([key, value]) => ({
        label: value.label,
        value: key,
      })),
    },
    {
      name: 'priority',
      label: '优先级',
      type: 'select' as const,
      placeholder: '请选择优先级',
      width: 120,
      options: Object.entries(TO_PRIORITY_MAP).map(([key, value]) => ({
        label: value.label,
        value: key,
      })),
    },
    {
      name: 'stepCode',
      label: '工序编码',
      type: 'input' as const,
      placeholder: '请输入工序编码',
      width: 140,
    },
  ];

  // 表格列定义
  const columns = [
    {
      title: '任务单号',
      dataIndex: 'taskNo',
      width: 160,
      fixed: 'left' as const,
    },
    {
      title: '工单号',
      dataIndex: 'woNo',
      width: 140,
    },
    {
      title: '生产订单',
      dataIndex: 'poNo',
      width: 140,
    },
    {
      title: '产品编码',
      dataIndex: 'productCode',
      width: 150,
    },
    {
      title: '产品名称',
      dataIndex: 'productName',
      width: 150,
      ellipsis: true,
    },
    {
      title: '产品规格',
      dataIndex: 'productSpec',
      width: 140,
      ellipsis: true,
    },
    {
      title: '任务名称',
      dataIndex: 'taskName',
      width: 150,
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      align: 'center' as const,
      render: (status: string) => (
        <StatusBadge status={status} statusMap={TO_STATUS_MAP} />
      ),
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      width: 80,
      align: 'center' as const,
      render: (priority: string) => {
        const config = TO_PRIORITY_MAP[priority as keyof typeof TO_PRIORITY_MAP];
        return config ? (
          <span style={{ color: config.color, fontWeight: 'bold' }}>
            {config.label}
          </span>
        ) : '-';
      },
    },
    {
      title: '工序',
      dataIndex: 'stepName',
      width: 120,
    },
    {
      title: '工作中心',
      dataIndex: 'workcenterName',
      width: 120,
    },
    {
      title: '班组',
      dataIndex: 'teamName',
      width: 100,
    },
    {
      title: '操作员',
      dataIndex: 'operatorName',
      width: 100,
    },
    {
      title: '计划数量',
      dataIndex: 'planQty',
      width: 100,
      align: 'right' as const,
      render: (qty: number) => qty.toLocaleString(),
    },
    {
      title: '实际数量',
      dataIndex: 'actualQty',
      width: 100,
      align: 'right' as const,
      render: (qty: number) => qty.toLocaleString(),
    },
    {
      title: '合格数量',
      dataIndex: 'qualifiedQty',
      width: 100,
      align: 'right' as const,
      render: (qty: number) => qty.toLocaleString(),
    },
    {
      title: '计划开始时间',
      dataIndex: 'planStartTime',
      width: 160,
    },
    {
      title: '计划结束时间',
      dataIndex: 'planEndTime',
      width: 160,
    },
    {
      title: '操作',
      key: 'action',
      width: 220,
      fixed: 'right' as const,
      align: 'center' as const,
      render: (_: any, record: TaskOrder) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            icon={<UserOutlined />}
            onClick={() => handleAssign(record)}
            disabled={record.status !== 'PENDING'}
          >
            分配
          </Button>
          <Button
            type="link"
            size="small"
            icon={<PlayCircleOutlined />}
            onClick={() => handleStart(record)}
            disabled={record.status !== 'ASSIGNED'}
          >
            开始
          </Button>
          <Button
            type="link"
            size="small"
            icon={<CheckCircleOutlined />}
            onClick={() => handleComplete(record)}
            disabled={record.status !== 'IN_PROGRESS'}
          >
            完成
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete([record.id])}
            disabled={record.status !== 'PENDING'}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  // 状态管理
  const [modalVisible, setModalVisible] = React.useState(false);
  const [modalMode, setModalMode] = React.useState<'create' | 'edit'>('create');
  const [detailVisible, setDetailVisible] = React.useState(false);

  // 搜索处理
  const handleSearch = (values: TaskOrderQuery) => {
    setFilters(values);
    setPagination({ current: 1, pageSize: pagination.pageSize });
    loadTaskOrders();
  };

  // 重置搜索
  const handleReset = () => {
    setFilters({});
    setPagination({ current: 1, pageSize: pagination.pageSize });
    loadTaskOrders();
  };

  // 新增任务
  const handleCreate = () => {
    setModalMode('create');
    setModalVisible(true);
  };

  // 编辑任务
  const handleEdit = (record: TaskOrder) => {
    setCurrentTaskOrder(record);
    setModalMode('edit');
    setModalVisible(true);
  };

  // 查看详情
  const handleDetail = (record: TaskOrder) => {
    setCurrentTaskOrder(record);
    setDetailVisible(true);
  };

  // 删除任务
  const handleDelete = (ids: string[]) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除选中的 ${ids.length} 个任务单吗？`,
      onOk: async () => {
        await deleteTaskOrders(ids);
        message.success('删除成功');
      },
    });
  };

  // 分配任务
  const handleAssign = (record: TaskOrder) => {
    setCurrentTaskOrder(record);
    // TODO: 打开分配对话框
    message.info('分配功能待实现');
  };

  // 开始任务
  const handleStart = (record: TaskOrder) => {
    Modal.confirm({
      title: '确认开始',
      content: `确定要开始任务 ${record.taskNo} 吗？`,
      onOk: async () => {
        await startTaskOrder(record.id);
        message.success('开始成功');
      },
    });
  };

  // 完成任务
  const handleComplete = (record: TaskOrder) => {
    Modal.confirm({
      title: '确认完成',
      content: `确定要完成任务 ${record.taskNo} 吗？`,
      onOk: async () => {
        await completeTaskOrder(record.id);
        message.success('完成成功');
      },
    });
  };

  // 暂停任务
  const handlePause = (ids: string[]) => {
    Modal.confirm({
      title: '确认暂停',
      content: `确定要暂停选中的 ${ids.length} 个任务吗？`,
      onOk: async () => {
        await pauseTaskOrder(ids[0]);
        message.success('暂停成功');
      },
    });
  };

  // 恢复任务
  const handleResume = (ids: string[]) => {
    Modal.confirm({
      title: '确认恢复',
      content: `确定要恢复选中的 ${ids.length} 个任务吗？`,
      onOk: async () => {
        await resumeTaskOrder(ids[0]);
        message.success('恢复成功');
      },
    });
  };

  // 取消任务
  const handleCancel = (ids: string[]) => {
    Modal.confirm({
      title: '确认取消',
      content: `确定要取消选中的 ${ids.length} 个任务吗？`,
      onOk: async () => {
        await cancelTaskOrder(ids[0]);
        message.success('取消成功');
      },
    });
  };

  // 导出任务
  const handleExport = () => {
    Modal.confirm({
      title: '确认导出',
      content: `确定要导出选中的 ${selectedIds.length} 个任务单吗？`,
      onOk: async () => {
        await exportTaskOrders({ ids: selectedIds } as any);
        message.success('导出成功');
      },
    });
  };

  // 表单提交
  const handleFormSubmit = async (values: any) => {
    try {
      if (modalMode === 'create') {
        await createTaskOrder(values);
        message.success('创建成功');
      } else {
        await updateTaskOrder({ id: currentTaskOrder!.id, ...values });
        message.success('更新成功');
      }
      setModalVisible(false);
      loadTaskOrders();
    } catch (err) {
      message.error(modalMode === 'create' ? '创建失败' : '更新失败');
    }
  };

  // 批量操作菜单
  const batchActions = [
    {
      key: 'assign',
      label: '分配',
      icon: <UserOutlined />,
      onClick: () => {
        if (selectedIds.length === 0) {
          message.warning('请先选择要分配的任务单');
          return;
        }
        // TODO: 打开批量分配对话框
        message.info('批量分配功能待实现');
      },
    },
    {
      key: 'start',
      label: '开始',
      icon: <PlayCircleOutlined />,
      onClick: () => {
        if (selectedIds.length === 0) {
          message.warning('请先选择要开始的任务单');
          return;
        }
        Modal.confirm({
          title: '确认开始',
          content: `确定要开始选中的 ${selectedIds.length} 个任务吗？`,
          onOk: async () => {
            await Promise.all(selectedIds.map((id: string) => startTaskOrder(id)));
            message.success('开始成功');
          },
        });
      },
    },
    {
      key: 'complete',
      label: '完成',
      icon: <CheckCircleOutlined />,
      onClick: () => {
        if (selectedIds.length === 0) {
          message.warning('请先选择要完成的任务单');
          return;
        }
        Modal.confirm({
          title: '确认完成',
          content: `确定要完成选中的 ${selectedIds.length} 个任务吗？`,
          onOk: async () => {
            await Promise.all(selectedIds.map((id: string) => completeTaskOrder(id)));
            message.success('完成成功');
          },
        });
      },
    },
    {
      key: 'pause',
      label: '暂停',
      icon: <PauseCircleOutlined />,
      onClick: () => {
        if (selectedIds.length === 0) {
          message.warning('请先选择要暂停的任务单');
          return;
        }
        handlePause(selectedIds);
      },
    },
    {
      key: 'resume',
      label: '恢复',
      icon: <PlaySquareOutlined />,
      onClick: () => {
        if (selectedIds.length === 0) {
          message.warning('请先选择要恢复的任务单');
          return;
        }
        handleResume(selectedIds);
      },
    },
    {
      key: 'cancel',
      label: '取消',
      icon: <StopOutlined />,
      onClick: () => {
        if (selectedIds.length === 0) {
          message.warning('请先选择要取消的任务单');
          return;
        }
        handleCancel(selectedIds);
      },
    },
    {
      key: 'delete',
      label: '删除',
      icon: <DeleteOutlined />,
      danger: true,
      onClick: () => {
        if (selectedIds.length === 0) {
          message.warning('请先选择要删除的任务单');
          return;
        }
        handleDelete(selectedIds);
      },
    },
  ];

  return (
    <div style={{ padding: '16px' }}>
      <ActionBar
        title="生产任务单"
        actions={[
          {
            key: 'create',
            label: '新增',
            type: 'primary',
            icon: <PlusOutlined />,
            onClick: handleCreate,
          },
        ]}
        selectedCount={selectedIds.length}
        batchActions={batchActions}
        extra={
          <Button
            icon={<ExportOutlined />}
            onClick={handleExport}
            disabled={selectedIds.length === 0}
          >
            导出
          </Button>
        }
      />

      <SearchForm
        fields={searchFields}
        onSearch={handleSearch}
        onReset={handleReset}
        loading={loading}
      />

      <DataTable
        rowKey="id"
        columns={columns}
        dataSource={taskOrders}
        loading={loading}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条`,
          onChange: (page, pageSize) => {
            setPagination({ current: page, pageSize });
            loadTaskOrders();
          },
        }}
        rowSelection={{
          selectedRowKeys: selectedIds,
          onChange: (keys) => setSelectedIds(keys as string[]),
        }}
        onRow={(record) => ({
          onDoubleClick: () => handleDetail(record),
        })}
        scroll={{ x: 2000 }}
      />

      {/* 表单弹窗 */}
      <FormModal
        visible={modalVisible}
        title={modalMode === 'create' ? '新增生产任务单' : '编辑生产任务单'}
        mode={modalMode}
        initialValues={currentTaskOrder || undefined}
        onSubmit={handleFormSubmit}
        onCancel={() => {
          setModalVisible(false);
          setCurrentTaskOrder(null);
        }}
        loading={loading}
        width={900}
        formComponent={React.lazy(() => import('./TaskOrderForm'))}
      />

      {/* 详情抽屉 */}
      <DetailDrawer
        visible={detailVisible}
        title="任务单详情"
        onClose={() => {
          setDetailVisible(false);
          setCurrentTaskOrder(null);
        }}
        width={800}
        detailComponent={React.lazy(() => import('./TaskOrderDetail'))}
        data={currentTaskOrder}
      />
    </div>
  );
};

export default TaskOrderList;

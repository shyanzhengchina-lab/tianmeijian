/**
 * 工序执行任务列表组件
 * 提供完整的执行任务管理功能：查询、新增、编辑、删除、开始、暂停、恢复、完成、取消
 */

import React, { useEffect } from 'react';
import { Space, message, Modal, Button } from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, PlayCircleOutlined,
  CheckCircleOutlined, PauseCircleOutlined, PlaySquareOutlined,
  StopOutlined, ExportOutlined, ToolOutlined
} from '@ant-design/icons';
import { DataTable, SearchForm, ActionBar, FormModal, DetailDrawer, StatusBadge } from '../../../../shared/components';
import { usePadExecutionStore } from '../store';
import { EXECUTION_STATUS_MAP, EXECUTION_MODE_MAP } from '../types';
import type { PadExecutionTask, PadExecutionTaskQuery } from '../types';

export const PadExecutionList: React.FC = () => {
  const {
    padTasks, selectedIds, currentPadTask, filters, pagination, loading, error,
    loadPadTasks, createPadTask, updatePadTask, deletePadTasks,
    startPadTask, pausePadTask, resumePadTask, completePadTask,
    cancelPadTask, exportPadTasks,
    setFilters, setSelectedIds, setCurrentPadTask, setPagination,
  } = usePadExecutionStore();

  useEffect(() => {
    loadPadTasks();
  }, []);

  // 搜索字段配置
  const searchFields = [
    {
      name: 'taskNo',
      label: '任务编号',
      type: 'input' as const,
      placeholder: '请输入任务编号',
      width: 160,
    },
    {
      name: 'workOrderNo',
      label: '工单号',
      type: 'input' as const,
      placeholder: '请输入工单号',
      width: 160,
    },
    {
      name: 'productCode',
      label: '产品编码',
      type: 'input' as const,
      placeholder: '请输入产品编码',
      width: 150,
    },
    {
      name: 'productName',
      label: '产品名称',
      type: 'input' as const,
      placeholder: '请输入产品名称',
      width: 150,
    },
    {
      name: 'stepCode',
      label: '工序编码',
      type: 'input' as const,
      placeholder: '请输入工序编码',
      width: 130,
    },
    {
      name: 'status',
      label: '状态',
      type: 'select' as const,
      placeholder: '请选择状态',
      width: 120,
      options: Object.entries(EXECUTION_STATUS_MAP).map(([key, value]) => ({
        label: value.label,
        value: key,
      })),
    },
    {
      name: 'executionMode',
      label: '执行模式',
      type: 'select' as const,
      placeholder: '请选择模式',
      width: 120,
      options: Object.entries(EXECUTION_MODE_MAP).map(([key, value]) => ({
        label: value.label,
        value: key,
      })),
    },
    {
      name: 'operatorName',
      label: '操作员',
      type: 'input' as const,
      placeholder: '请输入操作员',
      width: 120,
    },
    {
      name: 'equipmentId',
      label: '设备',
      type: 'input' as const,
      placeholder: '请输入设备',
      width: 120,
    },
  ];

  // 表格列定义
  const columns = [
    {
      title: '任务编号',
      dataIndex: 'taskNo',
      width: 140,
      fixed: 'left' as const,
    },
    {
      title: '工单号',
      dataIndex: 'workOrderNo',
      width: 140,
    },
    {
      title: '产品编码',
      dataIndex: 'productCode',
      width: 140,
    },
    {
      title: '产品名称',
      dataIndex: 'productName',
      width: 140,
      ellipsis: true,
    },
    {
      title: '工序编码',
      dataIndex: 'stepCode',
      width: 110,
    },
    {
      title: '工序名称',
      dataIndex: 'stepName',
      width: 120,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      align: 'center' as const,
      render: (status: string) => (
        <StatusBadge status={status} statusMap={EXECUTION_STATUS_MAP} />
      ),
    },
    {
      title: '执行模式',
      dataIndex: 'executionMode',
      width: 100,
      align: 'center' as const,
      render: (mode: string) => {
        const config = EXECUTION_MODE_MAP[mode as keyof typeof EXECUTION_MODE_MAP];
        return config ? (
          <span style={{ color: config.color, fontWeight: 'bold' }}>
            {config.label}
          </span>
        ) : '-';
      },
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
      title: '进度',
      dataIndex: 'progress',
      width: 120,
      align: 'center' as const,
      render: (progress: number) => `${progress}%`,
    },
    {
      title: '操作员',
      dataIndex: 'operatorName',
      width: 100,
    },
    {
      title: '设备',
      dataIndex: 'equipmentName',
      width: 130,
      ellipsis: true,
    },
    {
      title: '工作中心',
      dataIndex: 'workcenterName',
      width: 120,
    },
    {
      title: '计划开始时间',
      dataIndex: 'planStartTime',
      width: 160,
    },
    {
      title: '操作',
      key: 'action',
      width: 280,
      fixed: 'right' as const,
      align: 'center' as const,
      render: (_: any, record: PadExecutionTask) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            disabled={record.status !== 'PENDING'}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            icon={<PlayCircleOutlined />}
            onClick={() => handleStart(record)}
            disabled={record.status !== 'PENDING'}
          >
            开始
          </Button>
          <Button
            type="link"
            size="small"
            icon={<PauseCircleOutlined />}
            onClick={() => handlePause(record)}
            disabled={record.status !== 'RUNNING'}
          >
            暂停
          </Button>
          <Button
            type="link"
            size="small"
            icon={<PlaySquareOutlined />}
            onClick={() => handleResume(record)}
            disabled={record.status !== 'PAUSED'}
          >
            恢复
          </Button>
          <Button
            type="link"
            size="small"
            icon={<CheckCircleOutlined />}
            onClick={() => handleComplete(record)}
            disabled={record.status !== 'RUNNING'}
          >
            完成
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<StopOutlined />}
            onClick={() => handleCancel([record.id])}
            disabled={['COMPLETED', 'CANCELLED'].includes(record.status)}
          >
            取消
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
  const handleSearch = (values: PadExecutionTaskQuery) => {
    setFilters(values);
    setPagination({ current: 1, pageSize: pagination.pageSize });
    loadPadTasks();
  };

  // 重置搜索
  const handleReset = () => {
    setFilters({});
    setPagination({ current: 1, pageSize: pagination.pageSize });
    loadPadTasks();
  };

  // 新增任务
  const handleCreate = () => {
    setModalMode('create');
    setModalVisible(true);
  };

  // 编辑任务
  const handleEdit = (record: PadExecutionTask) => {
    setCurrentPadTask(record);
    setModalMode('edit');
    setModalVisible(true);
  };

  // 查看详情
  const handleDetail = (record: PadExecutionTask) => {
    setCurrentPadTask(record);
    setDetailVisible(true);
  };

  // 删除任务
  const handleDelete = (ids: string[]) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除选中的 ${ids.length} 个执行任务吗？`,
      onOk: async () => {
        await deletePadTasks(ids);
        message.success('删除成功');
      },
    });
  };

  // 开始任务
  const handleStart = (record: PadExecutionTask) => {
    Modal.confirm({
      title: '确认开始',
      content: `确定要开始执行任务 ${record.taskNo} 吗？`,
      onOk: async () => {
        await startPadTask(record.id);
        message.success('开始成功');
      },
    });
  };

  // 暂停任务
  const handlePause = (record: PadExecutionTask) => {
    Modal.confirm({
      title: '确认暂停',
      content: `确定要暂停执行任务 ${record.taskNo} 吗？`,
      onOk: async () => {
        await pausePadTask(record.id);
        message.success('暂停成功');
      },
    });
  };

  // 恢复任务
  const handleResume = (record: PadExecutionTask) => {
    Modal.confirm({
      title: '确认恢复',
      content: `确定要恢复执行任务 ${record.taskNo} 吗？`,
      onOk: async () => {
        await resumePadTask(record.id);
        message.success('恢复成功');
      },
    });
  };

  // 完成任务
  const handleComplete = (record: PadExecutionTask) => {
    Modal.confirm({
      title: '确认完成',
      content: `确定要完成执行任务 ${record.taskNo} 吗？`,
      onOk: async () => {
        await completePadTask(record.id);
        message.success('完成成功');
      },
    });
  };

  // 取消任务
  const handleCancel = (ids: string[]) => {
    Modal.confirm({
      title: '确认取消',
      content: `确定要取消选中的 ${ids.length} 个任务吗？`,
      onOk: async () => {
        await Promise.all(ids.map((id: string) => cancelPadTask(id)));
        message.success('取消成功');
      },
    });
  };

  // 导出任务
  const handleExport = () => {
    Modal.confirm({
      title: '确认导出',
      content: `确定要导出选中的 ${selectedIds.length} 个任务吗？`,
      onOk: async () => {
        await exportPadTasks({ ids: selectedIds } as any);
        message.success('导出成功');
      },
    });
  };

  // 表单提交
  const handleFormSubmit = async (values: any) => {
    try {
      if (modalMode === 'create') {
        await createPadTask(values);
        message.success('创建成功');
      } else {
        await updatePadTask(currentPadTask!.id, values);
        message.success('更新成功');
      }
      setModalVisible(false);
      loadPadTasks();
    } catch (err) {
      message.error(modalMode === 'create' ? '创建失败' : '更新失败');
    }
  };

  // 批量操作菜单
  const batchActions = [
    {
      key: 'start',
      label: '开始',
      icon: <PlayCircleOutlined />,
      onClick: () => {
        if (selectedIds.length === 0) {
          message.warning('请先选择要开始的任务');
          return;
        }
        Modal.confirm({
          title: '确认开始',
          content: `确定要开始选中的 ${selectedIds.length} 个任务吗？`,
          onOk: async () => {
            await Promise.all(selectedIds.map(id => startPadTask(id)));
            message.success('开始成功');
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
          message.warning('请先选择要暂停的任务');
          return;
        }
        Modal.confirm({
          title: '确认暂停',
          content: `确定要暂停选中的 ${selectedIds.length} 个任务吗？`,
          onOk: async () => {
            await Promise.all(selectedIds.map(id => pausePadTask(id)));
            message.success('暂停成功');
          },
        });
      },
    },
    {
      key: 'resume',
      label: '恢复',
      icon: <PlaySquareOutlined />,
      onClick: () => {
        if (selectedIds.length === 0) {
          message.warning('请先选择要恢复的任务');
          return;
        }
        Modal.confirm({
          title: '确认恢复',
          content: `确定要恢复选中的 ${selectedIds.length} 个任务吗？`,
          onOk: async () => {
            await Promise.all(selectedIds.map(id => resumePadTask(id)));
            message.success('恢复成功');
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
          message.warning('请先选择要完成的任务');
          return;
        }
        Modal.confirm({
          title: '确认完成',
          content: `确定要完成选中的 ${selectedIds.length} 个任务吗？`,
          onOk: async () => {
            await Promise.all(selectedIds.map(id => completePadTask(id)));
            message.success('完成成功');
          },
        });
      },
    },
    {
      key: 'cancel',
      label: '取消',
      icon: <StopOutlined />,
      onClick: () => {
        if (selectedIds.length === 0) {
          message.warning('请先选择要取消的任务');
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
          message.warning('请先选择要删除的任务');
          return;
        }
        handleDelete(selectedIds);
      },
    },
  ];

  return (
    <div style={{ padding: '16px' }}>
      <ActionBar
        title="工序执行任务"
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
        dataSource={padTasks}
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
            loadPadTasks();
          },
        }}
        rowSelection={{
          selectedRowKeys: selectedIds,
          onChange: (keys) => setSelectedIds(keys as string[]),
        }}
        onRow={(record) => ({
          onDoubleClick: () => handleDetail(record),
        })}
        scroll={{ x: 2100 }}
      />

      {/* 表单弹窗 */}
      <FormModal
        visible={modalVisible}
        title={modalMode === 'create' ? '新增工序执行任务' : '编辑工序执行任务'}
        mode={modalMode}
        initialValues={currentPadTask || undefined}
        onSubmit={handleFormSubmit}
        onCancel={() => {
          setModalVisible(false);
          setCurrentPadTask(null);
        }}
        loading={loading}
        width={900}
        formComponent={React.lazy(() => import('./PadExecutionForm'))}
      />

      {/* 详情抽屉 */}
      <DetailDrawer
        visible={detailVisible}
        title="执行任务详情"
        onClose={() => {
          setDetailVisible(false);
          setCurrentPadTask(null);
        }}
        width={800}
        detailComponent={React.lazy(() => import('./PadExecutionDetail'))}
        data={currentPadTask}
      />
    </div>
  );
};

export default PadExecutionList;

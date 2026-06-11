/**
 * 倒冲监控列表组件
 */

import React, { useEffect } from 'react';
import { Table, Button, Space, Tag, message, Popconfirm, Dropdown, Input, DatePicker } from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import {
  PlusOutlined, SearchOutlined, ReloadOutlined, ExportOutlined, EditOutlined, DeleteOutlined,
  EyeOutlined, PlayCircleOutlined, SyncOutlined, StopOutlined, DownloadOutlined,
  FileExcelOutlined, FileOutlined, VerticalLeftOutlined, VerticalRightOutlined
} from '@ant-design/icons';
import { BACKFLUSH_STATUS_MAP } from '../types';
import { useBackflushMonitorStore } from '../store';
import type { BackflushMonitor } from '../types';

const { RangePicker } = DatePicker;

const BackflushMonitorList: React.FC = () => {
  const {
    backflushMonitors,
    loading,
    filters,
    selectedIds,
    pagination,
    loadBackflushMonitors,
    setFilters,
    setSelectedIds,
    setPagination,
    resetFilters,
    deleteBackflushMonitor,
    triggerBackflush,
    retryBackflush,
    cancelBackflush,
    batchTrigger,
    batchRetry,
    batchCancel,
    exportData,
    showDetail,
    showCreateForm,
    showEditForm,
  } = useBackflushMonitorStore();

  useEffect(() => {
    loadBackflushMonitors();
  }, [loadBackflushMonitors]);

  const handleTableChange = (newPagination: TablePaginationConfig) => {
    setPagination({
      current: newPagination.current || 1,
      pageSize: newPagination.pageSize || 10,
    });
    loadBackflushMonitors();
  };

  const handleSearch = () => {
    setPagination({ current: 1 });
    loadBackflushMonitors();
  };

  const handleReset = () => {
    resetFilters();
  };

  const handleDelete = async (ids: string[]) => {
    try {
      await deleteBackflushMonitor(ids);
      message.success('删除成功');
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleBatchTrigger = async () => {
    try {
      await batchTrigger(selectedIds);
      message.success('批量触发成功');
    } catch (error) {
      message.error('批量触发失败');
    }
  };

  const handleBatchRetry = async () => {
    try {
      await batchRetry(selectedIds);
      message.success('批量重试成功');
    } catch (error) {
      message.error('批量重试失败');
    }
  };

  const handleBatchCancel = async () => {
    try {
      await batchCancel(selectedIds);
      message.success('批量取消成功');
    } catch (error) {
      message.error('批量取消失败');
    }
  };

  const handleExport = (format: 'excel' | 'csv') => {
    exportData(format);
    message.success(`正在导出${format === 'excel' ? 'Excel' : 'CSV'}文件`);
  };

  const exportMenuItems = [
    {
      key: 'excel',
      label: '导出 Excel',
      icon: <FileExcelOutlined />,
      onClick: () => handleExport('excel'),
    },
    {
      key: 'csv',
      label: '导出 CSV',
      icon: <FileOutlined />,
      onClick: () => handleExport('csv'),
    },
  ];

  const batchMenuItems = [
    {
      key: 'trigger',
      label: '批量触发',
      icon: <PlayCircleOutlined />,
      onClick: handleBatchTrigger,
    },
    {
      key: 'retry',
      label: '批量重试',
      icon: <SyncOutlined />,
      onClick: handleBatchRetry,
    },
    {
      key: 'cancel',
      label: '批量取消',
      icon: <StopOutlined />,
      onClick: handleBatchCancel,
    },
  ];

  const columns: ColumnsType<BackflushMonitor> = [
    {
      title: '监控单号',
      dataIndex: 'monitorNo',
      width: 150,
      fixed: 'left',
    },
    {
      title: '工单号',
      dataIndex: 'workOrderNo',
      width: 120,
    },
    {
      title: '任务单号',
      dataIndex: 'taskOrderNo',
      width: 120,
    },
    {
      title: '工序编码',
      dataIndex: 'operationCode',
      width: 100,
    },
    {
      title: '工序名称',
      dataIndex: 'operationName',
      width: 120,
      ellipsis: true,
    },
    {
      title: '产品编码',
      dataIndex: 'productCode',
      width: 120,
    },
    {
      title: '产品名称',
      dataIndex: 'productName',
      width: 150,
      ellipsis: true,
    },
    {
      title: '完成数量',
      dataIndex: 'completedQty',
      width: 100,
      align: 'right' as const,
      render: (qty: number) => qty?.toLocaleString() || '-',
    },
    {
      title: '倒冲数量',
      dataIndex: 'backflushQty',
      width: 100,
      align: 'right' as const,
      render: (qty: number) => qty?.toLocaleString() || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status: string) => {
        const config = BACKFLUSH_STATUS_MAP[status as keyof typeof BACKFLUSH_STATUS_MAP];
        return (
          <Tag color={config.color} style={{ fontWeight: 500 }}>
            {config.label}
          </Tag>
        );
      },
    },
    {
      title: '倒冲时间',
      dataIndex: 'backflushTime',
      width: 150,
    },
    {
      title: '备注',
      dataIndex: 'remark',
      width: 150,
      ellipsis: true,
    },
    {
      title: '创建人',
      dataIndex: 'createdBy',
      width: 100,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 150,
    },
    {
      title: '操作',
      key: 'action',
      width: 250,
      fixed: 'right',
      render: (_: any, record: BackflushMonitor) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => showDetail(record)}
          >
            查看
          </Button>
          {record.status === 'PENDING' && (
            <>
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => showEditForm(record)}
              >
                编辑
              </Button>
              <Popconfirm
                title="确定删除吗？"
                onConfirm={() => handleDelete([record.id])}
                okText="确定"
                cancelText="取消"
              >
                <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                  删除
                </Button>
              </Popconfirm>
              <Popconfirm
                title="确定触发倒冲吗？"
                onConfirm={() => triggerBackflush(record.id)}
                okText="确定"
                cancelText="取消"
              >
                <Button type="link" size="small" icon={<PlayCircleOutlined />}>
                  触发
                </Button>
              </Popconfirm>
            </>
          )}
          {record.status === 'FAILED' && (
            <Popconfirm
              title="确定重试吗？"
              onConfirm={() => retryBackflush(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button type="link" size="small" icon={<SyncOutlined />}>
                重试
              </Button>
            </Popconfirm>
          )}
          {['PENDING', 'RUNNING'].includes(record.status) && (
            <Popconfirm
              title="确定取消吗？"
              onConfirm={() => cancelBackflush(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button type="link" size="small" danger icon={<StopOutlined />}>
                取消
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* 操作栏 */}
      <div style={{ marginBottom: 16 }}>
        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={showCreateForm}
          >
            新建
          </Button>
          {selectedIds.length > 0 && (
            <Dropdown menu={{ items: batchMenuItems }}>
              <Button>
                <Space>
                  批量操作 <VerticalLeftOutlined />
                </Space>
              </Button>
            </Dropdown>
          )}
          <Button icon={<ExportOutlined />}>
            <Space>
              导出 <DownloadOutlined />
            </Space>
          </Button>
          <Dropdown menu={{ items: exportMenuItems }}>
            <Button icon={<DownloadOutlined />}>
              选择格式
            </Button>
          </Dropdown>
          <Button icon={<ReloadOutlined />} onClick={() => loadBackflushMonitors()}>
            刷新
          </Button>
        </Space>
      </div>

      {/* 筛选栏 */}
      <div style={{ marginBottom: 16, background: '#f5f5f5', padding: 16, borderRadius: 4 }}>
        <Space wrap>
          <Input
            placeholder="监控单号"
            value={filters.monitorNo}
            onChange={(e) => setFilters({ monitorNo: e.target.value })}
            style={{ width: 150 }}
            allowClear
          />
          <Input
            placeholder="工单号"
            value={filters.workOrderNo}
            onChange={(e) => setFilters({ workOrderNo: e.target.value })}
            style={{ width: 150 }}
            allowClear
          />
          <Input
            placeholder="任务单号"
            value={filters.taskOrderNo}
            onChange={(e) => setFilters({ taskOrderNo: e.target.value })}
            style={{ width: 150 }}
            allowClear
          />
          <Input
            placeholder="产品编码"
            value={filters.productCode}
            onChange={(e) => setFilters({ productCode: e.target.value })}
            style={{ width: 150 }}
            allowClear
          />
          <Input
            placeholder="工序编码"
            value={filters.operationCode}
            onChange={(e) => setFilters({ operationCode: e.target.value })}
            style={{ width: 120 }}
            allowClear
          />
          <RangePicker
            value={filters.backflushTimeStart && filters.backflushTimeEnd ? [
              filters.backflushTimeStart as any,
              filters.backflushTimeEnd as any
            ] : undefined}
            onChange={(dates) => setFilters({
              backflushTimeStart: dates?.[0] ? dates[0].format('YYYY-MM-DD') : undefined,
              backflushTimeEnd: dates?.[1] ? dates[1].format('YYYY-MM-DD') : undefined,
            })}
            placeholder={['倒冲开始日期', '倒冲结束日期']}
          />
          <Button
            type="primary"
            icon={<SearchOutlined />}
            onClick={handleSearch}
          >
            搜索
          </Button>
          <Button icon={<ReloadOutlined />} onClick={handleReset}>
            重置
          </Button>
        </Space>
      </div>

      {/* 数据表格 */}
      <Table
        columns={columns}
        dataSource={backflushMonitors}
        rowKey="id"
        loading={loading}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
          pageSizeOptions: ['10', '20', '50', '100'],
        }}
        onChange={handleTableChange}
        rowSelection={{
          selectedRowKeys: selectedIds,
          onChange: (keys: any[]) => setSelectedIds(keys as string[]),
        }}
        scroll={{ x: 2100 }}
        size="middle"
      />
    </div>
  );
};

export default BackflushMonitorList;

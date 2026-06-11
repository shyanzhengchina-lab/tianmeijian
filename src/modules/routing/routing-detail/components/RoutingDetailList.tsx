/**
 * 工艺明细列表组件
 */

import React, { useEffect } from 'react';
import { Table, Button, Space, Tag, message, Popconfirm, Dropdown, Input, Select } from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import {
  PlusOutlined, SearchOutlined, ReloadOutlined, ExportOutlined, EditOutlined, DeleteOutlined,
  EyeOutlined, CheckCircleOutlined, StopOutlined, DownloadOutlined,
  FileExcelOutlined, FileOutlined
} from '@ant-design/icons';
import { ROUTING_DETAIL_STATUS_MAP } from '../types';
import { useRoutingDetailStore } from '../store';
import type { RoutingDetail } from '../types';

const { Option } = Select;

const RoutingDetailList: React.FC = () => {
  const {
    routingDetails,
    loading,
    filters,
    selectedIds,
    pagination,
    loadRoutingDetails,
    setFilters,
    setSelectedIds,
    setPagination,
    resetFilters,
    deleteRoutingDetail,
    activateRoutingDetail,
    deactivateRoutingDetail,
    batchActivate,
    batchDeactivate,
    exportData,
    showDetail,
    showCreateForm,
    showEditForm,
  } = useRoutingDetailStore();

  useEffect(() => {
    loadRoutingDetails();
  }, [loadRoutingDetails]);

  const handleTableChange = (newPagination: TablePaginationConfig) => {
    setPagination({
      current: newPagination.current || 1,
      pageSize: newPagination.pageSize || 10,
    });
    loadRoutingDetails();
  };

  const handleSearch = () => {
    setPagination({ current: 1 });
    loadRoutingDetails();
  };

  const handleReset = () => {
    resetFilters();
  };

  const handleDelete = async (ids: string[]) => {
    try {
      await deleteRoutingDetail(ids);
      message.success('删除成功');
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleBatchActivate = async () => {
    try {
      await batchActivate(selectedIds);
      message.success('批量启用成功');
    } catch (error) {
      message.error('批量启用失败');
    }
  };

  const handleBatchDeactivate = async () => {
    try {
      await batchDeactivate(selectedIds);
      message.success('批量停用成功');
    } catch (error) {
      message.error('批量停用失败');
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
      key: 'activate',
      label: '批量启用',
      icon: <CheckCircleOutlined />,
      onClick: handleBatchActivate,
    },
    {
      key: 'deactivate',
      label: '批量停用',
      icon: <StopOutlined />,
      onClick: handleBatchDeactivate,
    },
  ];

  const columns: ColumnsType<RoutingDetail> = [
    {
      title: '工艺路线号',
      dataIndex: 'routingNo',
      width: 120,
      fixed: 'left',
    },
    {
      title: '工序编码',
      dataIndex: 'operationCode',
      width: 120,
    },
    {
      title: '工序名称',
      dataIndex: 'operationName',
      width: 150,
      ellipsis: true,
    },
    {
      title: '工序描述',
      dataIndex: 'operationDesc',
      width: 200,
      ellipsis: true,
    },
    {
      title: '序号',
      dataIndex: 'sequence',
      width: 80,
      align: 'right' as const,
    },
    {
      title: '工作中心',
      dataIndex: 'workCenter',
      width: 120,
    },
    {
      title: '设备',
      dataIndex: 'equipment',
      width: 120,
    },
    {
      title: '标准时间(分钟)',
      dataIndex: 'standardTime',
      width: 120,
      align: 'right' as const,
      render: (time: number) => time?.toFixed(2) || '-',
    },
    {
      title: '准备时间(分钟)',
      dataIndex: 'setupTime',
      width: 120,
      align: 'right' as const,
      render: (time: number) => time?.toFixed(2) || '-',
    },
    {
      title: '人工时间(分钟)',
      dataIndex: 'laborTime',
      width: 120,
      align: 'right' as const,
      render: (time: number) => time?.toFixed(2) || '-',
    },
    {
      title: '机器时间(分钟)',
      dataIndex: 'machineTime',
      width: 120,
      align: 'right' as const,
      render: (time: number) => time?.toFixed(2) || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status: string) => {
        const config = ROUTING_DETAIL_STATUS_MAP[status as keyof typeof ROUTING_DETAIL_STATUS_MAP];
        return (
          <Tag color={config.color} style={{ fontWeight: 500 }}>
            {config.label}
          </Tag>
        );
      },
    },
    {
      title: '备注',
      dataIndex: 'remarks',
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
      render: (_: any, record: RoutingDetail) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => showDetail(record)}
          >
            查看
          </Button>
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
          {record.status === 'ACTIVE' && (
            <Popconfirm
              title="确定停用吗？"
              onConfirm={() => deactivateRoutingDetail(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button type="link" size="small" icon={<StopOutlined />}>
                停用
              </Button>
            </Popconfirm>
          )}
          {record.status === 'INACTIVE' && (
            <Popconfirm
              title="确定启用吗？"
              onConfirm={() => activateRoutingDetail(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button type="link" size="small" icon={<CheckCircleOutlined />}>
                启用
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
                批量操作
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
          <Button icon={<ReloadOutlined />} onClick={() => loadRoutingDetails()}>
            刷新
          </Button>
        </Space>
      </div>

      {/* 筛选栏 */}
      <div style={{ marginBottom: 16, background: '#f5f5f5', padding: 16, borderRadius: 4 }}>
        <Space wrap>
          <Input
            placeholder="工艺路线号"
            value={filters.routingNo}
            onChange={(e) => setFilters({ routingNo: e.target.value })}
            style={{ width: 150 }}
            allowClear
          />
          <Input
            placeholder="工序编码"
            value={filters.operationCode}
            onChange={(e) => setFilters({ operationCode: e.target.value })}
            style={{ width: 150 }}
            allowClear
          />
          <Input
            placeholder="工序名称"
            value={filters.operationName}
            onChange={(e) => setFilters({ operationName: e.target.value })}
            style={{ width: 150 }}
            allowClear
          />
          <Input
            placeholder="工作中心"
            value={filters.workCenter}
            onChange={(e) => setFilters({ workCenter: e.target.value })}
            style={{ width: 150 }}
            allowClear
          />
          <Select
            placeholder="状态"
            value={filters.status}
            onChange={(value) => setFilters({ status: value })}
            style={{ width: 120 }}
            allowClear
          >
            <Option value="ACTIVE">启用</Option>
            <Option value="INACTIVE">停用</Option>
            <Option value="ARCHIVED">归档</Option>
          </Select>
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
        dataSource={routingDetails}
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

export default RoutingDetailList;

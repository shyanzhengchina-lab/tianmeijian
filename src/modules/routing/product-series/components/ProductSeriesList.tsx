/**
 * 产品系列列表组件
 */

import React, { useEffect } from 'react';
import { Table, Button, Space, Tag, message, Popconfirm, Dropdown, Input, Select } from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import {
  PlusOutlined, SearchOutlined, ReloadOutlined, ExportOutlined, EditOutlined, DeleteOutlined,
  EyeOutlined, CheckCircleOutlined, StopOutlined, DownloadOutlined,
  FileExcelOutlined, FileOutlined
} from '@ant-design/icons';
import { PRODUCT_SERIES_STATUS_MAP } from '../types';
import { useProductSeriesStore } from '../store';
import type { ProductSeries } from '../types';

const { Option } = Select;

const ProductSeriesList: React.FC = () => {
  const {
    productSeries,
    loading,
    filters,
    selectedIds,
    pagination,
    loadProductSeries,
    setFilters,
    setSelectedIds,
    setPagination,
    resetFilters,
    deleteProductSeries,
    activateProductSeries,
    deactivateProductSeries,
    batchActivate,
    batchDeactivate,
    exportData,
    showDetail,
    showCreateForm,
    showEditForm,
  } = useProductSeriesStore();

  useEffect(() => {
    loadProductSeries();
  }, [loadProductSeries]);

  const handleTableChange = (newPagination: TablePaginationConfig) => {
    setPagination({
      current: newPagination.current || 1,
      pageSize: newPagination.pageSize || 10,
    });
    loadProductSeries();
  };

  const handleSearch = () => {
    setPagination({ current: 1 });
    loadProductSeries();
  };

  const handleReset = () => {
    resetFilters();
  };

  const handleDelete = async (ids: string[]) => {
    try {
      await deleteProductSeries(ids);
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

  const columns: ColumnsType<ProductSeries> = [
    {
      title: '系列编码',
      dataIndex: 'seriesCode',
      width: 150,
      fixed: 'left',
    },
    {
      title: '系列名称',
      dataIndex: 'seriesName',
      width: 150,
    },
    {
      title: '系列描述',
      dataIndex: 'description',
      width: 200,
      ellipsis: true,
    },
    {
      title: '类别',
      dataIndex: 'category',
      width: 120,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status: string) => {
        const config = PRODUCT_SERIES_STATUS_MAP[status as keyof typeof PRODUCT_SERIES_STATUS_MAP];
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
      render: (_: any, record: ProductSeries) => (
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
              onConfirm={() => deactivateProductSeries(record.id)}
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
              onConfirm={() => activateProductSeries(record.id)}
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
          <Button icon={<ReloadOutlined />} onClick={() => loadProductSeries()}>
            刷新
          </Button>
        </Space>
      </div>

      {/* 筛选栏 */}
      <div style={{ marginBottom: 16, background: '#f5f5f5', padding: 16, borderRadius: 4 }}>
        <Space wrap>
          <Input
            placeholder="系列编码"
            value={filters.seriesCode}
            onChange={(e) => setFilters({ seriesCode: e.target.value })}
            style={{ width: 150 }}
            allowClear
          />
          <Input
            placeholder="系列名称"
            value={filters.seriesName}
            onChange={(e) => setFilters({ seriesName: e.target.value })}
            style={{ width: 150 }}
            allowClear
          />
          <Input
            placeholder="类别"
            value={filters.category}
            onChange={(e) => setFilters({ category: e.target.value })}
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
        dataSource={productSeries}
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
        scroll={{ x: 1400 }}
        size="middle"
      />
    </div>
  );
};

export default ProductSeriesList;

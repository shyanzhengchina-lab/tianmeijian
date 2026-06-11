/**
 * 生产工单列表组件
 */

import React, { useEffect } from 'react';
import { Table, Button, Space, Tag, message, Popconfirm, Dropdown, Input, Select, DatePicker } from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import {
  PlusOutlined, SearchOutlined, ReloadOutlined, ExportOutlined, EditOutlined, DeleteOutlined,
  EyeOutlined, PlayCircleOutlined, PauseCircleOutlined, StopOutlined, CheckCircleOutlined,
  DownloadOutlined, FileExcelOutlined, FileTextOutlined, VerticalLeftOutlined, VerticalRightOutlined
} from '@ant-design/icons';
import { WO_STATUS_MAP, WO_TYPE_MAP } from '../types';
import { useWorkOrderStore } from '../store';
import type { WorkOrder } from '../types';

const { Option } = Select;
const { RangePicker } = DatePicker;

const WorkOrderList: React.FC = () => {
  const {
    workOrders,
    loading,
    filters,
    selectedIds,
    pagination,
    loadWorkOrders,
    setFilters,
    setSelectedIds,
    setPagination,
    resetFilters,
    deleteWorkOrder,
    releaseWorkOrder,
    suspendWorkOrder,
    resumeWorkOrder,
    closeWorkOrder,
    batchRelease,
    batchSuspend,
    batchResume,
    batchClose,
    exportData,
    showDetail,
    showCreateForm,
    showEditForm,
    setShowDetail,
    setShowCreateForm,
    setShowEditForm,
    setCurrentWorkOrder,
  } = useWorkOrderStore();

  useEffect(() => {
    loadWorkOrders();
  }, [loadWorkOrders]);

  const handleTableChange = (newPagination: TablePaginationConfig) => {
    setPagination({
      current: newPagination.current || 1,
      pageSize: newPagination.pageSize || 10,
    });
    loadWorkOrders();
  };

  const handleSearch = () => {
    setPagination({ current: 1 });
    loadWorkOrders();
  };

  const handleReset = () => {
    resetFilters();
  };

  const handleDelete = async (ids: string[]) => {
    try {
      await deleteWorkOrder(ids[0] || '');  // store alias takes single id
      message.success('删除成功');
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleBatchRelease = async () => {
    try {
      await batchRelease(selectedIds);
      message.success('批量发布成功');
    } catch (error) {
      message.error('批量发布失败');
    }
  };

  const handleBatchSuspend = async () => {
    try {
      await batchSuspend(selectedIds);
      message.success('批量暂停成功');
    } catch (error) {
      message.error('批量暂停失败');
    }
  };

  const handleBatchResume = async () => {
    try {
      await batchResume(selectedIds);
      message.success('批量恢复成功');
    } catch (error) {
      message.error('批量恢复失败');
    }
  };

  const handleBatchClose = async () => {
    try {
      await batchClose(selectedIds);
      message.success('批量关闭成功');
    } catch (error) {
      message.error('批量关闭失败');
    }
  };

  const handleExport = (format: 'excel' | 'csv') => {
    exportData(undefined);  // format handled differently
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
      icon: <FileTextOutlined />,
      onClick: () => handleExport('csv'),
    },
  ];

  const batchMenuItems = [
    {
      key: 'release',
      label: '批量发布',
      icon: <PlayCircleOutlined />,
      onClick: handleBatchRelease,
    },
    {
      key: 'suspend',
      label: '批量暂停',
      icon: <PauseCircleOutlined />,
      onClick: handleBatchSuspend,
    },
    {
      key: 'resume',
      label: '批量恢复',
      icon: <CheckCircleOutlined />,
      onClick: handleBatchResume,
    },
    {
      key: 'close',
      label: '批量关闭',
      icon: <StopOutlined />,
      onClick: handleBatchClose,
    },
  ];

  const columns: ColumnsType<WorkOrder> = [
    {
      title: '工单号',
      dataIndex: 'woNo',
      width: 150,
      fixed: 'left',
    },
    {
      title: '生产订单号',
      dataIndex: 'poNo',
      width: 150,
    },
    {
      title: '销售订单号',
      dataIndex: 'soNo',
      width: 150,
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
      title: '产品规格',
      dataIndex: 'productSpec',
      width: 150,
      ellipsis: true,
    },
    {
      title: '工单类型',
      dataIndex: 'woType',
      width: 100,
      render: (type: string) => {
        const config = WO_TYPE_MAP[type as keyof typeof WO_TYPE_MAP];
        return (
          <Tag color={config.color} style={{ fontWeight: 500 }}>
            {config.label}
          </Tag>
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status: string) => {
        const config = WO_STATUS_MAP[status as keyof typeof WO_STATUS_MAP];
        return (
          <Tag color={config.color} style={{ fontWeight: 500 }}>
            {config.label}
          </Tag>
        );
      },
    },
    {
      title: '计划数量',
      dataIndex: 'planQty',
      width: 100,
      align: 'right' as const,
      render: (qty: number) => qty?.toLocaleString() || '-',
    },
    {
      title: '实际数量',
      dataIndex: 'actualQty',
      width: 100,
      align: 'right' as const,
      render: (qty: number) => qty?.toLocaleString() || '-',
    },
    {
      title: '合格数量',
      dataIndex: 'qualifiedQty',
      width: 100,
      align: 'right' as const,
      render: (qty: number) => qty?.toLocaleString() || '-',
    },
    {
      title: '计划开始日期',
      dataIndex: 'planStartDate',
      width: 120,
    },
    {
      title: '计划结束日期',
      dataIndex: 'planEndDate',
      width: 120,
    },
    {
      title: '当前工序',
      dataIndex: 'currentStep',
      width: 120,
    },
    {
      title: '工作中心',
      dataIndex: 'workcenterId',
      width: 120,
    },
    {
      title: '班组',
      dataIndex: 'teamId',
      width: 100,
    },
    {
      title: '操作员',
      dataIndex: 'operator',
      width: 100,
    },
    {
      title: '备注',
      dataIndex: 'remark',
      width: 150,
      ellipsis: true,
    },
    {
      title: '操作',
      key: 'action',
      width: 300,
      fixed: 'right',
      render: (_: any, record: WorkOrder) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => { setCurrentWorkOrder(record); setShowDetail(true); }}
          >
            查看
          </Button>
          {record.status === 'DRAFT' && (
            <>
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => { setCurrentWorkOrder(record); setShowEditForm(true); }}
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
            </>
          )}
          {record.status === 'DRAFT' && (
            <Popconfirm
              title="确定发布吗？"
              onConfirm={() => releaseWorkOrder(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button type="link" size="small" icon={<PlayCircleOutlined />}>
                发布
              </Button>
            </Popconfirm>
          )}
          {record.status === 'RELEASED' && (
            <Popconfirm
              title="确定暂停吗？"
              onConfirm={() => suspendWorkOrder(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button type="link" size="small" icon={<PauseCircleOutlined />}>
                暂停
              </Button>
            </Popconfirm>
          )}
          {record.status === 'SUSPENDED' && (
            <Popconfirm
              title="确定恢复吗？"
              onConfirm={() => resumeWorkOrder(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button type="link" size="small" icon={<CheckCircleOutlined />}>
                恢复
              </Button>
            </Popconfirm>
          )}
          {['RELEASED', 'IN_PROGRESS', 'SUSPENDED', 'COMPLETED'].includes(record.status) && (
            <Popconfirm
              title="确定关闭吗？"
              onConfirm={() => closeWorkOrder(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button type="link" size="small" icon={<StopOutlined />}>
                关闭
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
            onClick={() => setShowCreateForm(true)}
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
          <Button icon={<ReloadOutlined />} onClick={() => loadWorkOrders()}>
            刷新
          </Button>
        </Space>
      </div>

      {/* 筛选栏 */}
      <div style={{ marginBottom: 16, background: '#f5f5f5', padding: 16, borderRadius: 4 }}>
        <Space wrap>
          <Input
            placeholder="工单号"
            value={filters.woNo}
            onChange={(e) => setFilters({ woNo: e.target.value })}
            style={{ width: 150 }}
            allowClear
          />
          <Input
            placeholder="生产订单号"
            value={filters.poNo}
            onChange={(e) => setFilters({ poNo: e.target.value })}
            style={{ width: 150 }}
            allowClear
          />
          <Input
            placeholder="销售订单号"
            value={filters.soNo}
            onChange={(e) => setFilters({ soNo: e.target.value })}
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
            placeholder="产品名称"
            value={filters.productName}
            onChange={(e) => setFilters({ productName: e.target.value })}
            style={{ width: 150 }}
            allowClear
          />
          <Input
            placeholder="工作中心"
            value={filters.workcenterId}
            onChange={(e) => setFilters({ workcenterId: e.target.value })}
            style={{ width: 150 }}
            allowClear
          />
          <Select
            placeholder="工单类型"
            value={filters.woType}
            onChange={(value) => setFilters({ woType: value })}
            style={{ width: 120 }}
            allowClear
          >
            <Option value="PRODUCTION">生产</Option>
            <Option value="REWORK">返工</Option>
            <Option value="SAMPLE">样品</Option>
            <Option value="TEST">测试</Option>
          </Select>
          <Select
            placeholder="状态"
            value={filters.status}
            onChange={(value) => setFilters({ status: value })}
            style={{ width: 120 }}
            allowClear
          >
            <Option value="DRAFT">草稿</Option>
            <Option value="RELEASED">已发布</Option>
            <Option value="IN_PROGRESS">生产中</Option>
            <Option value="COMPLETED">已完成</Option>
            <Option value="CLOSED">已关闭</Option>
            <Option value="SUSPENDED">已暂停</Option>
          </Select>
          <RangePicker
            value={filters.planStartDateStart && filters.planStartDateEnd ? [
              filters.planStartDateStart as any,
              filters.planStartDateEnd as any
            ] : undefined}
            onChange={(dates) => setFilters({
              planStartDateStart: dates?.[0] ? dates[0].format('YYYY-MM-DD') : undefined,
              planStartDateEnd: dates?.[1] ? dates[1].format('YYYY-MM-DD') : undefined,
            })}
            placeholder={['计划开始日期', '计划结束日期']}
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
        dataSource={workOrders}
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
        scroll={{ x: 2800 }}
        size="middle"
      />
    </div>
  );
};

export default WorkOrderList;

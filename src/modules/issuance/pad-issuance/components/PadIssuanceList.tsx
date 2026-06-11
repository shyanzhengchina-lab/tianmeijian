/**
 * 工位领料列表组件
 */

import React, { useEffect } from 'react';
import { Table, Button, Space, Tag, message, Popconfirm, Dropdown, Input, DatePicker } from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import {
  PlusOutlined, SearchOutlined, ReloadOutlined, ExportOutlined, EditOutlined, DeleteOutlined,
  EyeOutlined, CheckCircleOutlined, StopOutlined, ShoppingCartOutlined, DownloadOutlined,
  FileExcelOutlined, FileTextOutlined, VerticalLeftOutlined, VerticalRightOutlined
} from '@ant-design/icons';
import { PAD_ISSUANCE_STATUS_MAP } from '../types';
import { usePadIssuanceStore } from '../store';
import type { PadIssuance } from '../types';

const { RangePicker } = DatePicker;

const PadIssuanceList: React.FC = () => {
  const {
    padIssuances,
    loading,
    filters,
    selectedIds,
    pagination,
    loadPadIssuances,
    setFilters,
    setSelectedIds,
    setPagination,
    resetFilters,
    deletePadIssuance,
    submitForApproval,
    approve,
    reject,
    issue,
    cancel,
    complete,
    batchApprove,
    batchReject,
    batchIssue,
    batchCancel,
    exportData,
    showDetail,
    showCreateForm,
    showEditForm,
  } = usePadIssuanceStore();

  useEffect(() => {
    loadPadIssuances();
  }, [loadPadIssuances]);

  const handleTableChange = (newPagination: TablePaginationConfig) => {
    setPagination({
      current: newPagination.current || 1,
      pageSize: newPagination.pageSize || 10,
    });
    loadPadIssuances();
  };

  const handleSearch = () => {
    setPagination({ current: 1 });
    loadPadIssuances();
  };

  const handleReset = () => {
    resetFilters();
  };

  const handleDelete = async (ids: string[]) => {
    try {
      await deletePadIssuance(ids);
      message.success('删除成功');
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleBatchApprove = async () => {
    try {
      await batchApprove(selectedIds);
      message.success('批量批准成功');
    } catch (error) {
      message.error('批量批准失败');
    }
  };

  const handleBatchReject = async () => {
    try {
      await batchReject(selectedIds);
      message.success('批量拒绝成功');
    } catch (error) {
      message.error('批量拒绝失败');
    }
  };

  const handleBatchIssue = async () => {
    try {
      await batchIssue(selectedIds);
      message.success('批量发料成功');
    } catch (error) {
      message.error('批量发料失败');
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
      icon: <FileTextOutlined />,
      onClick: () => handleExport('csv'),
    },
  ];

  const batchMenuItems = [
    {
      key: 'approve',
      label: '批量批准',
      icon: <CheckCircleOutlined />,
      onClick: handleBatchApprove,
    },
    {
      key: 'reject',
      label: '批量拒绝',
      icon: <StopOutlined />,
      onClick: handleBatchReject,
    },
    {
      key: 'issue',
      label: '批量发料',
      icon: <ShoppingCartOutlined />,
      onClick: handleBatchIssue,
    },
    {
      key: 'cancel',
      label: '批量取消',
      icon: <StopOutlined />,
      onClick: handleBatchCancel,
    },
  ];

  const columns: ColumnsType<PadIssuance> = [
    {
      title: '领料单号',
      dataIndex: 'issuanceNo',
      width: 150,
      fixed: 'left',
    },
    {
      title: '任务单号',
      dataIndex: 'taskNo',
      width: 120,
    },
    {
      title: '工单号',
      dataIndex: 'workOrderNo',
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
      title: '工位',
      dataIndex: 'workstation',
      width: 100,
    },
    {
      title: '操作人',
      dataIndex: 'worker',
      width: 100,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status: string) => {
        const config = PAD_ISSUANCE_STATUS_MAP[status as keyof typeof PAD_ISSUANCE_STATUS_MAP];
        return (
          <Tag color={config.color} style={{ fontWeight: 500 }}>
            {config.label}
          </Tag>
        );
      },
    },
    {
      title: '申请日期',
      dataIndex: 'requestDate',
      width: 120,
    },
    {
      title: '要求日期',
      dataIndex: 'requiredDate',
      width: 120,
    },
    {
      title: '申请人',
      dataIndex: 'requestBy',
      width: 100,
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
      width: 200,
      fixed: 'right',
      render: (_: any, record: PadIssuance) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => showDetail(record)}
          >
            查看
          </Button>
          {record.status === 'DRAFT' && (
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
            </>
          )}
          {record.status === 'DRAFT' && (
            <Popconfirm
              title="确定提交审批吗？"
              onConfirm={() => submitForApproval(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button type="link" size="small" icon={<VerticalRightOutlined />}>
                提交
              </Button>
            </Popconfirm>
          )}
          {record.status === 'SUBMITTED' && (
            <Popconfirm
              title="确定批准吗？"
              onConfirm={() => approve(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button type="link" size="small" icon={<CheckCircleOutlined />}>
                批准
              </Button>
            </Popconfirm>
          )}
          {record.status === 'SUBMITTED' && (
            <Popconfirm
              title="确定拒绝吗？"
              onConfirm={() => reject(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button type="link" size="small" danger icon={<StopOutlined />}>
                拒绝
              </Button>
            </Popconfirm>
          )}
          {record.status === 'APPROVED' && (
            <Popconfirm
              title="确定发料吗？"
              onConfirm={() => issue(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button type="link" size="small" icon={<ShoppingCartOutlined />}>
                发料
              </Button>
            </Popconfirm>
          )}
          {record.status === 'ISSUED' && (
            <Popconfirm
              title="确定完成吗？"
              onConfirm={() => complete(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button type="link" size="small" icon={<CheckCircleOutlined />}>
                完成
              </Button>
            </Popconfirm>
          )}
          {['DRAFT', 'SUBMITTED'].includes(record.status) && (
            <Popconfirm
              title="确定取消吗？"
              onConfirm={() => cancel(record.id)}
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
          <Button icon={<ReloadOutlined />} onClick={() => loadPadIssuances()}>
            刷新
          </Button>
        </Space>
      </div>

      {/* 筛选栏 */}
      <div style={{ marginBottom: 16, background: '#f5f5f5', padding: 16, borderRadius: 4 }}>
        <Space wrap>
          <Input
            placeholder="领料单号"
            value={filters.issuanceNo}
            onChange={(e) => setFilters({ issuanceNo: e.target.value })}
            style={{ width: 150 }}
            allowClear
          />
          <Input
            placeholder="任务单号"
            value={filters.taskNo}
            onChange={(e) => setFilters({ taskNo: e.target.value })}
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
            placeholder="工序编码"
            value={filters.operationCode}
            onChange={(e) => setFilters({ operationCode: e.target.value })}
            style={{ width: 120 }}
            allowClear
          />
          <Input
            placeholder="工位"
            value={filters.workstation}
            onChange={(e) => setFilters({ workstation: e.target.value })}
            style={{ width: 120 }}
            allowClear
          />
          <RangePicker
            value={filters.requestDateStart && filters.requestDateEnd ? [
              filters.requestDateStart as any,
              filters.requestDateEnd as any
            ] : undefined}
            onChange={(dates) => setFilters({
              requestDateStart: dates?.[0] ? dates[0].format('YYYY-MM-DD') : undefined,
              requestDateEnd: dates?.[1] ? dates[1].format('YYYY-MM-DD') : undefined,
            })}
            placeholder={['申请开始日期', '申请结束日期']}
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
        dataSource={padIssuances}
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
        scroll={{ x: 2000 }}
        size="middle"
      />
    </div>
  );
};

export default PadIssuanceList;

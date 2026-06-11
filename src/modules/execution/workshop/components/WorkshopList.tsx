/**
 * 车间看板列表组件
 * 展示所有车间看板的概览信息
 */

import React, { useEffect } from 'react';
import { Table, Button, Space, Tag, Input, Select, Statistic, Row, Col } from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import {
  PlusOutlined, SearchOutlined, ReloadOutlined, EyeOutlined,
  ApartmentOutlined, UserOutlined, CheckCircleOutlined,
  ClockCircleOutlined, WarningOutlined
} from '@ant-design/icons';
import { WORKSHOP_STATUS_MAP } from '../types';
import { useWorkshopStore } from '../store';
import type { WorkshopDashboard } from '../types';

const { Option } = Select;

const WorkshopList: React.FC = () => {
  const {
    workshopDashboards,
    loading,
    filters,
    selectedIds,
    pagination,
    loadWorkshopDashboards,
    loadAllWorkshopDashboards,
    setFilters,
    setSelectedIds,
    setPagination,
    showWorkshopDetail,
  } = useWorkshopStore();

  useEffect(() => {
    loadWorkshopDashboards();
  }, [loadWorkshopDashboards]);

  const handleTableChange = (newPagination: TablePaginationConfig) => {
    setPagination({
      current: newPagination.current || 1,
      pageSize: newPagination.pageSize || 10,
    });
    loadWorkshopDashboards();
  };

  const handleSearch = () => {
    setPagination({ current: 1 });
    loadWorkshopDashboards();
  };

  const handleReset = () => {
    setFilters({});
    loadWorkshopDashboards();
  };

  const exportMenuItems = [
    {
      key: 'statistics',
      label: '导出生产实绩',
      icon: <CheckCircleOutlined />,
      onClick: () => console.log('Export statistics'),
    },
  ];

  const columns: ColumnsType<WorkshopDashboard> = [
    {
      title: '车间名称',
      dataIndex: 'workshopName',
      width: 150,
      fixed: 'left',
    },
    {
      title: '工作中心',
      dataIndex: 'workcenterName',
      width: 150,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status: string) => {
        const config = WORKSHOP_STATUS_MAP[status as keyof typeof WORKSHOP_STATUS_MAP];
        return (
          <Tag color={config.color} style={{ fontWeight: 500 }}>
            {config.label}
          </Tag>
        );
      },
    },
    {
      title: '工单统计',
      width: 200,
      render: (_: any, record: WorkshopDashboard) => (
        <Row gutter={4}>
          <Col span={8}>
            <Statistic
              title="总数"
              value={record.totalOrders}
              valueStyle={{ fontSize: '12px' }}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="进行中"
              value={record.inProgressOrders}
              valueStyle={{ fontSize: '12px', color: '#1677ff' }}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="已完成"
              value={record.completedOrders}
              valueStyle={{ fontSize: '12px', color: '#52c41a' }}
            />
          </Col>
        </Row>
      ),
    },
    {
      title: '人员统计',
      width: 180,
      render: (_: any, record: WorkshopDashboard) => (
        <Row gutter={4}>
          <Col span={8}>
            <Statistic
              title="总数"
              value={record.totalOperators}
              valueStyle={{ fontSize: '12px' }}
              prefix={<UserOutlined />}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="在岗"
              value={record.presentOperators}
              valueStyle={{ fontSize: '12px', color: '#52c41a' }}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="缺勤"
              value={record.absentOperators}
              valueStyle={{ fontSize: '12px', color: '#ff4d4f' }}
            />
          </Col>
        </Row>
      ),
    },
    {
      title: '设备统计',
      width: 220,
      render: (_: any, record: WorkshopDashboard) => (
        <Space size="small">
          <Tag icon={<CheckCircleOutlined />} color="success">运行: {record.runningEquipment}</Tag>
          <Tag icon={<ClockCircleOutlined />} color="default">空闲: {record.idleEquipment}</Tag>
          <Tag icon={<WarningOutlined />} color="warning">维护: {record.maintenanceEquipment}</Tag>
          <Tag color="default">停机: {record.stoppedEquipment}</Tag>
        </Space>
      ),
    },
    {
      title: '每日产能',
      width: 180,
      render: (_: any, record: WorkshopDashboard) => (
        <Row gutter={4}>
          <Col span={12}>
            <Statistic
              title="计划"
              value={record.dailyPlanQty}
              valueStyle={{ fontSize: '12px' }}
            />
          </Col>
          <Col span={12}>
            <Statistic
              title="实际"
              value={record.dailyActualQty}
              valueStyle={{ fontSize: '12px', color: '#1677ff' }}
            />
          </Col>
        </Row>
      ),
    },
    {
      title: '合格率',
      dataIndex: 'dailyQualifiedRate',
      width: 100,
      align: 'right' as const,
      render: (rate: number) => `${rate?.toFixed(1)}%`,
    },
    {
      title: '更新时间',
      dataIndex: 'updateTime',
      width: 150,
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_: any, record: WorkshopDashboard) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => console.log('view', record)}
          >
            查看
          </Button>
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
            onClick={() => console.log('Create new workshop')}
          >
            新建
          </Button>
          <Button icon={<ReloadOutlined />} onClick={() => loadWorkshopDashboards()}>
            刷新
          </Button>
        </Space>
      </div>

      {/* 筛选栏 */}
      <div style={{ marginBottom: 16, background: '#f5f5f5', padding: 16, borderRadius: 4 }}>
        <Space wrap>
          <Input
            placeholder="车间名称"
            value={filters.workshopId}
            onChange={(e) => setFilters({ workshopId: e.target.value })}
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
            placeholder="状态"
            value={filters.status}
            onChange={(value) => setFilters({ status: value })}
            style={{ width: 120 }}
            allowClear
          >
            <Option value="ACTIVE">正常</Option>
            <Option value="MAINTENANCE">维护</Option>
            <Option value="STOPPED">停机</Option>
          </Select>
          <Input
            type="date"
            placeholder="日期"
            value={filters.date}
            onChange={(e) => setFilters({ date: e.target.value })}
            style={{ width: 150 }}
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
        dataSource={workshopDashboards}
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
        scroll={{ x: 1600 }}
        size="middle"
      />
    </div>
  );
};

export default WorkshopList;

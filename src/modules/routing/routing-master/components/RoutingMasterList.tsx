/**
 * 工艺路径主数据列表组件
 * 使用新架构的完整实现
 */

import React, { useEffect, useState } from 'react';
import { DataTable } from '../../../../shared/components/DataTable';
import { SearchForm } from '../../../../shared/components/SearchForm';
import { ActionBar } from '../../../../shared/components/ActionBar';
import { DetailDrawer } from '../../../../shared/components/DetailDrawer';
import { FormModal } from '../../../../shared/components/FormModal';
import { useRoutingMasterStore } from '../store';
import { usePermission } from '../../../../shared/hooks/usePermission';
import type { FormField } from '../../../../shared/types/common';
import {
  RoutingMaster,
  RoutingStatus,
  ROUTING_STATUS_MAP,
} from '../types';
import {
  PlusOutlined, ReloadOutlined, EditOutlined, DeleteOutlined,
  EyeOutlined, CheckCircleOutlined, StopOutlined, FileTextOutlined,
  ApartmentOutlined
} from '@ant-design/icons';
import { Button, Space, Popconfirm, message, Statistic, Row, Col } from 'antd';
import type { ColumnsType } from 'antd/es/table';

/**
 * 搜索表单字段配置
 */
const SEARCH_FIELDS: FormField[] = [
  { name: 'routingCode', label: '工艺路径编码', type: 'input', placeholder: '请输入工艺路径编码' },
  { name: 'routingName', label: '工艺路径名称', type: 'input', placeholder: '请输入工艺路径名称' },
  { name: 'productSeries', label: '产品系列', type: 'input', placeholder: '请输入产品系列' },
  { name: 'productCode', label: '产品编码', type: 'input', placeholder: '请输入产品编码' },
  {
    name: 'status',
    label: '状态',
    type: 'select',
    options: [
      { label: '全部', value: '' },
      ...Object.entries(ROUTING_STATUS_MAP).map(([key, value]) => ({
        label: value.label,
        value: key,
      })),
    ],
  },
];

/**
 * RoutingMasterList组件
 * 使用新架构的完整工艺路径列表页面
 */
export const RoutingMasterList: React.FC = () => {
  const {
    routingMasters,
    selectedIds,
    currentRoutingMaster,
    filters,
    pagination,
    loading,
    error,
    statistics,
    loadRoutingMasters,
    loadStatistics,
    createRoutingMaster,
    updateRoutingMaster,
    deleteRoutingMasters,
    activateRoutingMaster,
    deactivateRoutingMaster,
    approveRoutingMaster,
    archiveRoutingMaster,
    setFilters,
    setSelectedIds,
    setCurrentRoutingMaster,
    setLoading,
    setError,
  } = useRoutingMasterStore();

  const { canCreate, canUpdate, canDelete, canApprove } = usePermission('routing-master');

  const [modalOpen, setModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  /**
   * 初始化加载数据
   */
  useEffect(() => {
    loadRoutingMasters();
    loadStatistics();
  }, []);

  /**
   * 搜索处理
   */
  const handleSearch = (values: any) => {
    setFilters(values);
    loadRoutingMasters();
  };

  /**
   * 重置处理
   */
  const handleReset = () => {
    setFilters({});
    loadRoutingMasters();
  };

  /**
   * 新增工艺路径
   */
  const handleAdd = () => {
    setCurrentRoutingMaster({} as RoutingMaster); // 空对象表示新增模式
    setModalOpen(true);
  };

  /**
   * 编辑工艺路径
   */
  const handleEdit = (routingMaster: RoutingMaster) => {
    setCurrentRoutingMaster(routingMaster);
    setModalOpen(true);
  };

  /**
   * 查看详情
   */
  const handleView = (routingMaster: RoutingMaster) => {
    setCurrentRoutingMaster(routingMaster);
    setDetailOpen(true);
  };

  /**
   * 删除工艺路径
   */
  const handleDelete = async (ids: string[]) => {
    try {
      await deleteRoutingMasters(ids);
      message.success(`成功删除 ${ids.length} 个工艺路径`);
    } catch (error) {
      console.error('删除工艺路径失败:', error);
    }
  };

  /**
   * 启用工艺路径
   */
  const handleActivate = async (routingMaster: RoutingMaster) => {
    try {
      await activateRoutingMaster(routingMaster.id);
      message.success(`工艺路径 ${routingMaster.routingName} 启用成功`);
    } catch (error) {
      console.error('启用工艺路径失败:', error);
    }
  };

  /**
   * 停用工艺路径
   */
  const handleDeactivate = async (routingMaster: RoutingMaster) => {
    try {
      await deactivateRoutingMaster(routingMaster.id);
      message.success(`工艺路径 ${routingMaster.routingName} 停用成功`);
    } catch (error) {
      console.error('停用工艺路径失败:', error);
    }
  };

  /**
   * 批准工艺路径
   */
  const handleApprove = async (routingMaster: RoutingMaster) => {
    try {
      await approveRoutingMaster(routingMaster.id, '当前用户');
      message.success(`工艺路径 ${routingMaster.routingName} 批准成功`);
    } catch (error) {
      console.error('批准工艺路径失败:', error);
    }
  };

  /**
   * 归档工艺路径
   */
  const handleArchive = async (routingMaster: RoutingMaster) => {
    try {
      await archiveRoutingMaster(routingMaster.id);
      message.success(`工艺路径 ${routingMaster.routingName} 归档成功`);
    } catch (error) {
      console.error('归档工艺路径失败:', error);
    }
  };

  /**
   * 刷新列表
   */
  const handleRefresh = () => {
    loadRoutingMasters();
    loadStatistics();
  };

  /**
   * 表格列定义
   */
  const columns: ColumnsType<RoutingMaster> = [
    {
      title: '工艺路径编码',
      dataIndex: 'routingCode',
      key: 'routingCode',
      width: 180,
      fixed: 'left' as const,
    },
    {
      title: '工艺路径名称',
      dataIndex: 'routingName',
      key: 'routingName',
      width: 200,
    },
    {
      title: '产品系列',
      dataIndex: 'productSeries',
      key: 'productSeries',
      width: 120,
    },
    {
      title: '产品编码',
      dataIndex: 'productCode',
      key: 'productCode',
      width: 150,
    },
    {
      title: '产品名称',
      dataIndex: 'productName',
      key: 'productName',
      width: 150,
    },
    {
      title: 'BOM版本',
      dataIndex: 'bomVersion',
      key: 'bomVersion',
      width: 100,
    },
    {
      title: '工艺版本',
      dataIndex: 'routingVersion',
      key: 'routingVersion',
      width: 100,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: RoutingStatus) => {
        const statusConfig = ROUTING_STATUS_MAP[status];
        return (
          <span style={{
            display: 'inline-block',
            width: '12px',
            height: '12px',
            borderRadius: '2px',
            background: statusConfig.color,
            marginRight: '8px'
          }}></span>
        );
      },
    },
    {
      title: '生效日期',
      dataIndex: 'effectiveDate',
      key: 'effectiveDate',
      width: 110,
    },
    {
      title: '失效日期',
      dataIndex: 'expiryDate',
      key: 'expiryDate',
      width: 110,
    },
    {
      title: '批准人',
      dataIndex: 'approvedBy',
      key: 'approvedBy',
      width: 100,
    },
    {
      title: '操作',
      key: 'action',
      width: 300,
      fixed: 'right' as const,
      render: (_: any, record: RoutingMaster) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
          >
            查看
          </Button>
          {canUpdate('routing-master') && record.status === 'INACTIVE' && (
            <Button
              type="link"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => handleActivate(record)}
            >
              启用
            </Button>
          )}
          {canUpdate('routing-master') && record.status === 'ACTIVE' && (
            <Button
              type="link"
              size="small"
              icon={<StopOutlined />}
              onClick={() => handleDeactivate(record)}
            >
              停用
            </Button>
          )}
          {canApprove('routing-master') && record.status === 'DRAFT' && (
            <Button
              type="link"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => handleApprove(record)}
            >
              批准
            </Button>
          )}
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          {canDelete('routing-master') && (
            <Popconfirm
              title="确认删除"
              description={`确定要删除工艺路径「${record.routingName}」吗？`}
              onConfirm={() => handleDelete([record.id])}
              okText="确定"
              cancelText="取消"
            >
              <Button
                type="link"
                size="small"
                danger
                icon={<DeleteOutlined />}
              >
                删除
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="routing-master-page" style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
      {/* 统计卡片 */}
      {statistics && (
        <div style={{ background: '#fff', padding: '16px', borderBottom: '1px solid #e8ecf0' }}>
          <Row gutter={16}>
            <Col span={6}>
              <Statistic
                title="路径总数"
                value={statistics.totalCount}
                valueStyle={{ color: '#1677ff' }}
                prefix={<FileTextOutlined style={{ fontSize: 20 }} />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="草稿"
                value={statistics.draftCount}
                valueStyle={{ color: '#8c8c8c' }}
                prefix={<FileTextOutlined style={{ fontSize: 20, color: '#8c8c8c' }} />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="已生效"
                value={statistics.activeCount}
                valueStyle={{ color: '#52c41a' }}
                prefix={<CheckCircleOutlined style={{ fontSize: 20, color: '#52c41a' }} />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="已停用"
                value={statistics.inactiveCount}
                valueStyle={{ color: '#d9d9d9' }}
                prefix={<StopOutlined style={{ fontSize: 20, color: '#d9d9d9' }} />}
              />
            </Col>
          </Row>
        </div>
      )}

      {/* 搜索表单 */}
      <div style={{ background: '#fff', padding: '16px', borderBottom: '1px solid #e8ecf0' }}>
        <SearchForm
          fields={SEARCH_FIELDS}
          onSearch={handleSearch}
          onReset={handleReset}
          loading={loading}
          layout="inline"
        />
      </div>

      {/* 操作栏 */}
      <ActionBar
        title="工艺路径主数据"
        actions={[
          { key: 'add', label: '新增', icon: <PlusOutlined />, type: 'primary', onClick: handleAdd },
          { key: 'refresh', label: '刷新', icon: <ReloadOutlined />, onClick: handleRefresh },
        ]}
        selectedCount={selectedIds.length}
      />

      {/* 数据表格 */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
        <DataTable
          data={routingMasters}
          rowKey="id"
          columns={columns}
          loading={loading}
          pagination={pagination}
          paginationState={pagination}
          onPaginationChange={(page, pageSize) => {
            setFilters({ current: page, pageSize });
            loadRoutingMasters();
          }}
          rowSelection={{
            selectedRowKeys: selectedIds,
            onChange: (keys) => setSelectedIds(keys as string[]),
          }}
          scroll={{ x: 1600 }}
          bordered={false}
          size="middle"
        />
      </div>

      {/* 错误提示 */}
      {error && (
        <div
          style={{
            padding: '16px',
            margin: '16px',
            background: '#fff1f0',
            border: '1px solid #ffa39e',
            borderRadius: 4,
            color: '#cf1322',
          }}
        >
          {error}
        </div>
      )}

      {/* 详情抽屉 */}
      <DetailDrawer
        visible={detailOpen}
        title="工艺路径详情"
        data={currentRoutingMaster}
        fields={currentRoutingMaster ? [
          { label: '工艺路径编码', value: currentRoutingMaster.routingCode },
          { label: '工艺路径名称', value: currentRoutingMaster.routingName },
          { label: '产品系列', value: currentRoutingMaster.productSeries },
          { label: '产品编码', value: currentRoutingMaster.productCode },
          { label: '产品名称', value: currentRoutingMaster.productName },
          { label: 'BOM版本', value: currentRoutingMaster.bomVersion },
          { label: '工艺版本', value: currentRoutingMaster.routingVersion },
          { label: '状态', value: ROUTING_STATUS_MAP[currentRoutingMaster.status]?.label },
          { label: '生效日期', value: currentRoutingMaster.effectiveDate },
          { label: '失效日期', value: currentRoutingMaster.expiryDate || '永久有效' },
          { label: '批准人', value: currentRoutingMaster.approvedBy || '待批准' },
          { label: '批准时间', value: currentRoutingMaster.approvalTime || '待批准' },
          { label: '描述', value: currentRoutingMaster.description || '无' },
          { label: '备注', value: currentRoutingMaster.remark || '无' },
          { label: '创建时间', value: currentRoutingMaster.createdAt },
          { label: '更新时间', value: currentRoutingMaster.updatedAt },
        ] : []}
        onClose={() => setDetailOpen(false)}
        showActions={true}
        actions={[
          {
            key: 'edit',
            label: '编辑',
            icon: <EditOutlined />,
            onClick: () => {
              setDetailOpen(false);
              handleEdit(currentRoutingMaster!);
            },
            disabled: !canUpdate('routing-master'),
          },
        ]}
        width={700}
      />
    </div>
  );
};

export default RoutingMasterList;

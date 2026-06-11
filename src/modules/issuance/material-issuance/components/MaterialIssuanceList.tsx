/**
 * 物料领用列表组件
 * 提供完整的物料领用管理功能：查询、新增、编辑、删除、提交、批准、拒绝、发料、取消
 */

import React, { useEffect } from 'react';
import { Space, message, Modal, Button } from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, PlayCircleOutlined,
  CheckCircleOutlined, StopOutlined, ExportOutlined, FileTextOutlined,
  ShoppingCartOutlined
} from '@ant-design/icons';
import { DataTable, SearchForm, ActionBar, FormModal, DetailDrawer, StatusBadge } from '../../../../shared/components';
import type { FormField } from '../../../../shared/components/SearchForm';
import { useMaterialIssuanceStore } from '../store';
import { ISSUANCE_STATUS_MAP } from '../types';
import type { MaterialIssuance, IssuanceQuery } from '../types';

export const MaterialIssuanceList: React.FC = () => {
  const {
    issuances, selectedIds, currentIssuance, filters, pagination, loading, error,
    loadIssuances, createIssuance, updateIssuance, deleteIssuances,
    submitIssuance, approveIssuance, rejectIssuance,
    issuePartialIssuance, cancelIssuance, exportIssuances,
    setFilters, setSelectedIds, setCurrentIssuance, setPagination,
  } = useMaterialIssuanceStore();

  useEffect(() => {
    loadIssuances();
  }, []);

  // 搜索字段配置
  const searchFields = [
    {
      name: 'issuanceNo',
      label: '领料单号',
      type: 'input' as const,
      placeholder: '请输入领料单号',
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
      name: 'status',
      label: '状态',
      type: 'select' as const,
      placeholder: '请选择状态',
      width: 120,
      options: Object.entries(ISSUANCE_STATUS_MAP).map(([key, value]) => ({
        label: value.label,
        value: key,
      })),
    },
    {
      name: 'requestBy',
      label: '申请人',
      type: 'input' as const,
      placeholder: '请输入申请人',
      width: 120,
    },
    {
      name: 'requestDateStart',
      label: '申请日期开始',
      type: 'date' as const,
      placeholder: '请选择开始日期',
      width: 150,
    },
    {
      name: 'requestDateEnd',
      label: '申请日期结束',
      type: 'date' as const,
      placeholder: '请选择结束日期',
      width: 150,
    },
  ];

  // 表格列定义
  const columns = [
    {
      title: '领料单号',
      dataIndex: 'issuanceNo',
      width: 160,
      fixed: 'left' as const,
    },
    {
      title: '工单号',
      dataIndex: 'workOrderNo',
      width: 140,
    },
    {
      title: '生产订单ID',
      dataIndex: 'productionOrderId',
      width: 140,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      align: 'center' as const,
      render: (status: string) => (
        <StatusBadge status={status} statusMap={ISSUANCE_STATUS_MAP} />
      ),
    },
    {
      title: '申请日期',
      dataIndex: 'requestDate',
      width: 140,
    },
    {
      title: '要求日期',
      dataIndex: 'requiredDate',
      width: 140,
    },
    {
      title: '申请人',
      dataIndex: 'requestBy',
      width: 100,
    },
    {
      title: '批准人',
      dataIndex: 'approvedBy',
      width: 100,
    },
    {
      title: '发料人',
      dataIndex: 'issuedBy',
      width: 100,
    },
    {
      title: '提交时间',
      dataIndex: 'submitTime',
      width: 160,
    },
    {
      title: '批准时间',
      dataIndex: 'approveTime',
      width: 160,
    },
    {
      title: '完成时间',
      dataIndex: 'completeTime',
      width: 160,
    },
    {
      title: '操作',
      key: 'action',
      width: 300,
      fixed: 'right' as const,
      align: 'center' as const,
      render: (_: any, record: MaterialIssuance) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            disabled={record.status !== 'DRAFT'}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            icon={<PlayCircleOutlined />}
            onClick={() => handleSubmit(record)}
            disabled={record.status !== 'DRAFT'}
          >
            提交
          </Button>
          <Button
            type="link"
            size="small"
            icon={<CheckCircleOutlined />}
            onClick={() => handleApprove(record)}
            disabled={record.status !== 'SUBMITTED'}
          >
            批准
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<StopOutlined />}
            onClick={() => handleReject(record)}
            disabled={record.status !== 'SUBMITTED'}
          >
            拒绝
          </Button>
          <Button
            type="link"
            size="small"
            icon={<ShoppingCartOutlined />}
            onClick={() => handleIssue(record)}
            disabled={record.status !== 'APPROVED'}
          >
            发料
          </Button>
          <Button
            type="link"
            size="small"
            icon={<ShoppingCartOutlined />}
            onClick={() => handlePartialIssue(record)}
            disabled={record.status !== 'APPROVED'}
          >
            部分发料
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<StopOutlined />}
            onClick={() => handleCancel(record)}
            disabled={['DRAFT', 'SUBMITTED'].includes(record.status)}
          >
            取消
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete([record.id])}
            disabled={record.status !== 'DRAFT'}
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
  const handleSearch = (values: IssuanceQuery) => {
    setFilters(values);
    setPagination({ current: 1, pageSize: pagination.pageSize });
    loadIssuances();
  };

  // 重置搜索
  const handleReset = () => {
    setFilters({});
    setPagination({ current: 1, pageSize: pagination.pageSize });
    loadIssuances();
  };

  // 新增领料单
  const handleCreate = () => {
    setModalMode('create');
    setModalVisible(true);
  };

  // 编辑领料单
  const handleEdit = (record: MaterialIssuance) => {
    setCurrentIssuance(record);
    setModalMode('edit');
    setModalVisible(true);
  };

  // 查看详情
  const handleDetail = (record: MaterialIssuance) => {
    setCurrentIssuance(record);
    setDetailVisible(true);
  };

  // 删除领料单
  const handleDelete = (ids: string[]) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除选中的 ${ids.length} 个领料单吗？`,
      onOk: async () => {
        await deleteIssuances(ids);
        message.success('删除成功');
      },
    });
  };

  // 提交领料单
  const handleSubmit = (record: MaterialIssuance) => {
    Modal.confirm({
      title: '确认提交',
      content: `确定要提交领料单 ${record.issuanceNo} 吗？`,
      onOk: async () => {
        await submitIssuance(record.id);
        message.success('提交成功');
      },
    });
  };

  // 批准领料单
  const handleApprove = (record: MaterialIssuance) => {
    Modal.confirm({
      title: '确认批准',
      content: `确定要批准领料单 ${record.issuanceNo} 吗？`,
      onOk: async () => {
        await approveIssuance(record.id);
        message.success('批准成功');
      },
    });
  };

  // 拒绝领料单
  const handleReject = (record: MaterialIssuance) => {
    Modal.confirm({
      title: '确认拒绝',
      content: `确定要拒绝领料单 ${record.issuanceNo} 吗？`,
      onOk: async () => {
        await rejectIssuance(record.id);
        message.success('拒绝成功');
      },
    });
  };

  // 发料
  const handleIssue = (record: MaterialIssuance) => {
    Modal.confirm({
      title: '确认发料',
      content: `确定要完成领料单 ${record.issuanceNo} 的发料吗？`,
      onOk: async () => {
        await issuePartialIssuance(record.id);
        message.success('发料成功');
      },
    });
  };

  // 部分发料
  const handlePartialIssue = (record: MaterialIssuance) => {
    setCurrentIssuance(record);
    // TODO: 打开部分发料对话框
    message.info('部分发料功能待实现');
  };

  // 取消领料单
  const handleCancel = (record: MaterialIssuance) => {
    Modal.confirm({
      title: '确认取消',
      content: `确定要取消领料单 ${record.issuanceNo} 吗？`,
      onOk: async () => {
        await cancelIssuance(record.id);
        message.success('取消成功');
      },
    });
  };

  // 导出领料单
  const handleExport = () => {
    Modal.confirm({
      title: '确认导出',
      content: `确定要导出选中的 ${selectedIds.length} 个领料单吗？`,
      onOk: async () => {
        await exportIssuances(selectedIds);
        message.success('导出成功');
      },
    });
  };

  // 表单提交
  const handleFormSubmit = async (values: any) => {
    try {
      if (modalMode === 'create') {
        await createIssuance(values);
        message.success('创建成功');
      } else {
        await updateIssuance(currentIssuance!.id, values);
        message.success('更新成功');
      }
      setModalVisible(false);
      loadIssuances();
    } catch (err) {
      message.error(modalMode === 'create' ? '创建失败' : '更新失败');
    }
  };

  // 批量操作菜单
  const batchActions = [
    {
      key: 'submit',
      label: '提交',
      icon: <PlayCircleOutlined />,
      onClick: () => {
        if (selectedIds.length === 0) {
          message.warning('请先选择要提交的领料单');
          return;
        }
        Modal.confirm({
          title: '确认提交',
          content: `确定要提交选中的 ${selectedIds.length} 个领料单吗？`,
          onOk: async () => {
            await Promise.all(selectedIds.map(id => submitIssuance(id)));
            message.success('提交成功');
          },
        });
      },
    },
    {
      key: 'approve',
      label: '批准',
      icon: <CheckCircleOutlined />,
      onClick: () => {
        if (selectedIds.length === 0) {
          message.warning('请先选择要批准的领料单');
          return;
        }
        Modal.confirm({
          title: '确认批准',
          content: `确定要批准选中的 ${selectedIds.length} 个领料单吗？`,
          onOk: async () => {
            await Promise.all(selectedIds.map(id => approveIssuance(id)));
            message.success('批准成功');
          },
        });
      },
    },
    {
      key: 'reject',
      label: '拒绝',
      icon: <StopOutlined />,
      onClick: () => {
        if (selectedIds.length === 0) {
          message.warning('请先选择要拒绝的领料单');
          return;
        }
        Modal.confirm({
          title: '确认拒绝',
          content: `确定要拒绝选中的 ${selectedIds.length} 个领料单吗？`,
          onOk: async () => {
            await Promise.all(selectedIds.map(id => rejectIssuance(id)));
            message.success('拒绝成功');
          },
        });
      },
    },
    {
      key: 'delete',
      label: '删除',
      icon: <DeleteOutlined />,
      danger: true,
      onClick: () => {
        if (selectedIds.length === 0) {
          message.warning('请先选择要删除的领料单');
          return;
        }
        handleDelete(selectedIds);
      },
    },
  ];

  return (
    <div style={{ padding: '16px' }}>
      <ActionBar
        title="物料领用"
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
        fields={searchFields as FormField[]}
        onSearch={handleSearch}
        onReset={handleReset}
        loading={loading}
      />

      <DataTable
        rowKey="id"
        columns={columns}
        dataSource={issuances}
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
            loadIssuances();
          },
        }}
        rowSelection={{
          selectedRowKeys: selectedIds,
          onChange: (keys) => setSelectedIds(keys as string[]),
        }}
        onRow={(record) => ({
          onDoubleClick: () => handleDetail(record),
        })}
        scroll={{ x: 1900 }}
      />

      {/* 表单弹窗 */}
      <FormModal
        visible={modalVisible}
        title={modalMode === 'create' ? '新增物料领用单' : '编辑物料领用单'}
        mode={modalMode}
        initialValues={currentIssuance || undefined}
        onSubmit={handleFormSubmit}
        onCancel={() => {
          setModalVisible(false);
          setCurrentIssuance(null);
        }}
        loading={loading}
        width={1000}
        formComponent={React.lazy(() => import('./MaterialIssuanceForm'))}
      />

      {/* 详情抽屉 */}
      <DetailDrawer
        visible={detailVisible}
        title="物料领用详情"
        onClose={() => {
          setDetailVisible(false);
          setCurrentIssuance(null);
        }}
        width={900}
        detailComponent={React.lazy(() => import('./MaterialIssuanceDetail'))}
        data={currentIssuance}
      />
    </div>
  );
};

export default MaterialIssuanceList;

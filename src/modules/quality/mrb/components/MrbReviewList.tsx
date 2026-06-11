/**
 * MRB评审单列表组件
 * 提供完整的MRB评审管理功能：查询、新增、编辑、删除、开始、批准、拒绝、关闭
 */

import React, { useEffect } from 'react';
import { Space, message, Modal, Button } from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, PlayCircleOutlined,
  CheckCircleOutlined, StopOutlined, ExportOutlined, FileTextOutlined
} from '@ant-design/icons';
import { DataTable, SearchForm, ActionBar, FormModal, DetailDrawer, StatusBadge } from '../../../../shared/components';
import { useMrbStore } from '../store';
import { MRB_STATUS_MAP } from '../types';
import type { MrbReview, MrbReviewQuery } from '../types';

export const MrbReviewList: React.FC = () => {
  const {
    mrbReviews, selectedIds, currentMrbReview, filters, pagination, loading, error,
    loadMrbReviews, createMrbReview, updateMrbReview, deleteMrbReviews,
    startMrbReview, approveMrbReview, rejectMrbReview, closeMrbReview,
    exportMrbReviews,
    setFilters, setSelectedIds, setCurrentMrbReview, setPagination,
  } = useMrbStore();

  useEffect(() => {
    loadMrbReviews();
  }, []);

  // 搜索字段配置
  const searchFields = [
    {
      name: 'mrbNo',
      label: 'MRB编号',
      type: 'input' as const,
      placeholder: '请输入MRB编号',
      width: 160,
    },
    {
      name: 'inspectionNo',
      label: '质检单号',
      type: 'input' as const,
      placeholder: '请输入质检单号',
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
      name: 'batchNo',
      label: '批号',
      type: 'input' as const,
      placeholder: '请输入批号',
      width: 140,
    },
    {
      name: 'defectLevel',
      label: '不良等级',
      type: 'select' as const,
      placeholder: '请选择等级',
      width: 120,
      options: [
        { label: '轻微', value: 'MINOR' },
        { label: '主要', value: 'MAJOR' },
        { label: '严重', value: 'CRITICAL' },
      ],
    },
    {
      name: 'status',
      label: '状态',
      type: 'select' as const,
      placeholder: '请选择状态',
      width: 120,
      options: Object.entries(MRB_STATUS_MAP).map(([key, value]) => ({
        label: value.label,
        value: key,
      })),
    },
    {
      name: 'reviewer',
      label: '评审人',
      type: 'input' as const,
      placeholder: '请输入评审人',
      width: 120,
    },
  ];

  // 表格列定义
  const columns = [
    {
      title: 'MRB编号',
      dataIndex: 'mrbNo',
      width: 160,
      fixed: 'left' as const,
    },
    {
      title: '质检单号',
      dataIndex: 'inspectionNo',
      width: 160,
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
      title: '批号',
      dataIndex: 'batchNo',
      width: 120,
    },
    {
      title: '数量',
      dataIndex: 'qty',
      width: 100,
      align: 'right' as const,
      render: (qty: number) => qty.toLocaleString(),
    },
    {
      title: '不良等级',
      dataIndex: 'defectLevel',
      width: 100,
      align: 'center' as const,
      render: (level: string) => {
        const colors = { MINOR: '#52c41a', MAJOR: '#faad14', CRITICAL: '#ff4d4f' };
        const labels = { MINOR: '轻微', MAJOR: '主要', CRITICAL: '严重' };
        return (
          <span style={{ color: colors[level as keyof typeof colors], fontWeight: 'bold' }}>
            {labels[level as keyof typeof labels]}
          </span>
        );
      },
    },
    {
      title: '不良描述',
      dataIndex: 'defectDescription',
      width: 180,
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      align: 'center' as const,
      render: (status: string) => (
        <StatusBadge status={status} statusMap={MRB_STATUS_MAP} />
      ),
    },
    {
      title: '处理结果',
      dataIndex: 'dispositionResult',
      width: 120,
      ellipsis: true,
    },
    {
      title: '评审人',
      dataIndex: 'reviewer',
      width: 100,
    },
    {
      title: '申请时间',
      dataIndex: 'requestTime',
      width: 160,
    },
    {
      title: '评审时间',
      dataIndex: 'reviewTime',
      width: 160,
    },
    {
      title: '操作',
      key: 'action',
      width: 280,
      fixed: 'right' as const,
      align: 'center' as const,
      render: (_: any, record: MrbReview) => (
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
            icon={<CheckCircleOutlined />}
            onClick={() => handleApprove(record)}
            disabled={record.status !== 'IN_REVIEW'}
          >
            批准
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<StopOutlined />}
            onClick={() => handleReject(record)}
            disabled={record.status !== 'IN_REVIEW'}
          >
            拒绝
          </Button>
          <Button
            type="link"
            size="small"
            icon={<StopOutlined />}
            onClick={() => handleClose(record)}
            disabled={record.status !== 'APPROVED'}
          >
            关闭
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
  const handleSearch = (values: MrbReviewQuery) => {
    setFilters(values);
    setPagination({ current: 1, pageSize: pagination.pageSize });
    loadMrbReviews();
  };

  // 重置搜索
  const handleReset = () => {
    setFilters({});
    setPagination({ current: 1, pageSize: pagination.pageSize });
    loadMrbReviews();
  };

  // 新增MRB
  const handleCreate = () => {
    setModalMode('create');
    setModalVisible(true);
  };

  // 编辑MRB
  const handleEdit = (record: MrbReview) => {
    setCurrentMrbReview(record);
    setModalMode('edit');
    setModalVisible(true);
  };

  // 查看详情
  const handleDetail = (record: MrbReview) => {
    setCurrentMrbReview(record);
    setDetailVisible(true);
  };

  // 删除MRB
  const handleDelete = (ids: string[]) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除选中的 ${ids.length} 个MRB评审单吗？`,
      onOk: async () => {
        await deleteMrbReviews(ids);
        message.success('删除成功');
      },
    });
  };

  // 开始评审
  const handleStart = (record: MrbReview) => {
    Modal.confirm({
      title: '确认开始',
      content: `确定要开始评审 ${record.mrbNo} 吗？`,
      onOk: async () => {
        await startMrbReview(record.id);
        message.success('开始成功');
      },
    });
  };

  // 批准MRB
  const handleApprove = (record: MrbReview) => {
    Modal.confirm({
      title: '确认批准',
      content: `确定要批准MRB评审 ${record.mrbNo} 吗？`,
      onOk: async () => {
        await approveMrbReview(record.id);
        message.success('批准成功');
      },
    });
  };

  // 拒绝MRB
  const handleReject = (record: MrbReview) => {
    Modal.confirm({
      title: '确认拒绝',
      content: `确定要拒绝MRB评审 ${record.mrbNo} 吗？`,
      onOk: async () => {
        await rejectMrbReview(record.id);
        message.success('拒绝成功');
      },
    });
  };

  // 关闭MRB
  const handleClose = (record: MrbReview) => {
    Modal.confirm({
      title: '确认关闭',
      content: `确定要关闭MRB评审 ${record.mrbNo} 吗？`,
      onOk: async () => {
        await closeMrbReview(record.id);
        message.success('关闭成功');
      },
    });
  };

  // 导出MRB
  const handleExport = () => {
    Modal.confirm({
      title: '确认导出',
      content: `确定要导出选中的 ${selectedIds.length} 个MRB评审单吗？`,
      onOk: async () => {
        await exportMrbReviews(selectedIds);
        message.success('导出成功');
      },
    });
  };

  // 表单提交
  const handleFormSubmit = async (values: any) => {
    try {
      if (modalMode === 'create') {
        await createMrbReview(values);
        message.success('创建成功');
      } else {
        await updateMrbReview({ id: currentMrbReview!.id, ...values } as any);
        message.success('更新成功');
      }
      setModalVisible(false);
      loadMrbReviews();
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
          message.warning('请先选择要开始的MRB');
          return;
        }
        Modal.confirm({
          title: '确认开始',
          content: `确定要开始选中的 ${selectedIds.length} 个MRB评审吗？`,
          onOk: async () => {
            await Promise.all(selectedIds.map(id => startMrbReview(id)));
            message.success('开始成功');
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
          message.warning('请先选择要批准的MRB');
          return;
        }
        Modal.confirm({
          title: '确认批准',
          content: `确定要批准选中的 ${selectedIds.length} 个MRB评审吗？`,
          onOk: async () => {
            await Promise.all(selectedIds.map(id => approveMrbReview(id)));
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
          message.warning('请先选择要拒绝的MRB');
          return;
        }
        Modal.confirm({
          title: '确认拒绝',
          content: `确定要拒绝选中的 ${selectedIds.length} 个MRB评审吗？`,
          onOk: async () => {
            await Promise.all(selectedIds.map(id => rejectMrbReview(id)));
            message.success('拒绝成功');
          },
        });
      },
    },
    {
      key: 'close',
      label: '关闭',
      icon: <StopOutlined />,
      onClick: () => {
        if (selectedIds.length === 0) {
          message.warning('请先选择要关闭的MRB');
          return;
        }
        Modal.confirm({
          title: '确认关闭',
          content: `确定要关闭选中的 ${selectedIds.length} 个MRB评审吗？`,
          onOk: async () => {
            await Promise.all(selectedIds.map(id => closeMrbReview(id)));
            message.success('关闭成功');
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
          message.warning('请先选择要删除的MRB');
          return;
        }
        handleDelete(selectedIds);
      },
    },
  ];

  return (
    <div style={{ padding: '16px' }}>
      <ActionBar
        title="MRB评审"
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
        dataSource={mrbReviews}
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
            loadMrbReviews();
          },
        }}
        rowSelection={{
          selectedRowKeys: selectedIds,
          onChange: (keys) => setSelectedIds(keys as string[]),
        }}
        onRow={(record) => ({
          onDoubleClick: () => handleDetail(record),
        })}
        scroll={{ x: 2200 }}
      />

      {/* 表单弹窗 */}
      <FormModal
        visible={modalVisible}
        title={modalMode === 'create' ? '新增MRB评审单' : '编辑MRB评审单'}
        mode={modalMode}
        initialValues={currentMrbReview || undefined}
        onSubmit={handleFormSubmit}
        onCancel={() => {
          setModalVisible(false);
          setCurrentMrbReview(null);
        }}
        loading={loading}
        width={900}
        formComponent={React.lazy(() => import('./MrbReviewForm'))}
      />

      {/* 详情抽屉 */}
      <DetailDrawer
        visible={detailVisible}
        title="MRB评审详情"
        onClose={() => {
          setDetailVisible(false);
          setCurrentMrbReview(null);
        }}
        width={800}
        detailComponent={React.lazy(() => import('./MrbReviewDetail'))}
        data={currentMrbReview}
      />
    </div>
  );
};

export default MrbReviewList;

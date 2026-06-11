/**
 * 质量放行列表组件
 * 提供完整的质量放行管理功能：查询、新增、编辑、删除、批准、拒绝、取消
 */

import React, { useEffect } from 'react';
import { Space, message, Modal, Button } from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, CheckCircleOutlined,
  StopOutlined, ExportOutlined, SafetyOutlined
} from '@ant-design/icons';
import { DataTable, SearchForm, ActionBar, FormModal, DetailDrawer, StatusBadge } from '../../../../shared/components';
import { useQualityReleaseStore } from '../store';
import { RELEASE_STATUS_MAP, RELEASE_TYPE_MAP } from '../types';
import type { QualityRelease, QualityReleaseQuery } from '../types';

export const QualityReleaseList: React.FC = () => {
  const {
    qualityReleases, selectedIds, currentQualityRelease, filters, pagination, loading, error,
    loadQualityReleases, createQualityRelease, updateQualityRelease, deleteQualityReleases,
    approveQualityRelease, rejectQualityRelease, cancelQualityRelease,
    exportQualityReleases,
    setFilters, setSelectedIds, setCurrentQualityRelease, setPagination,
  } = useQualityReleaseStore();

  useEffect(() => {
    loadQualityReleases();
  }, []);

  // 搜索字段配置
  const searchFields = [
    {
      name: 'releaseNo',
      label: '放行单号',
      type: 'input' as const,
      placeholder: '请输入放行单号',
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
      name: 'releaseType',
      label: '放行类型',
      type: 'select' as const,
      placeholder: '请选择类型',
      width: 120,
      options: Object.entries(RELEASE_TYPE_MAP).map(([key, value]) => ({
        label: value.label,
        value: key,
      })),
    },
    {
      name: 'status',
      label: '状态',
      type: 'select' as const,
      placeholder: '请选择状态',
      width: 120,
      options: Object.entries(RELEASE_STATUS_MAP).map(([key, value]) => ({
        label: value.label,
        value: key,
      })),
    },
    {
      name: 'requester',
      label: '申请人',
      type: 'input' as const,
      placeholder: '请输入申请人',
      width: 120,
    },
  ];

  // 表格列定义
  const columns = [
    {
      title: '放行单号',
      dataIndex: 'releaseNo',
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
      title: '子批号',
      dataIndex: 'lotNo',
      width: 100,
    },
    {
      title: '数量',
      dataIndex: 'qty',
      width: 100,
      align: 'right' as const,
      render: (qty: number) => qty.toLocaleString(),
    },
    {
      title: '放行类型',
      dataIndex: 'releaseType',
      width: 110,
      align: 'center' as const,
      render: (type: string) => {
        const config = RELEASE_TYPE_MAP[type as keyof typeof RELEASE_TYPE_MAP];
        return config ? (
          <span style={{ color: config.color, fontWeight: 'bold' }}>
            {config.label}
          </span>
        ) : '-';
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      align: 'center' as const,
      render: (status: string) => (
        <StatusBadge status={status} statusMap={RELEASE_STATUS_MAP} />
      ),
    },
    {
      title: '申请人',
      dataIndex: 'requester',
      width: 100,
    },
    {
      title: '批准人',
      dataIndex: 'approver',
      width: 100,
    },
    {
      title: '申请时间',
      dataIndex: 'requestTime',
      width: 160,
    },
    {
      title: '批准时间',
      dataIndex: 'approvalTime',
      width: 160,
    },
    {
      title: '操作',
      key: 'action',
      width: 240,
      fixed: 'right' as const,
      align: 'center' as const,
      render: (_: any, record: QualityRelease) => (
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
            icon={<CheckCircleOutlined />}
            onClick={() => handleApprove(record)}
            disabled={record.status !== 'PENDING'}
          >
            批准
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<StopOutlined />}
            onClick={() => handleReject(record)}
            disabled={record.status !== 'PENDING'}
          >
            拒绝
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<StopOutlined />}
            onClick={() => handleCancel(record)}
            disabled={record.status !== 'PENDING'}
          >
            取消
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
  const handleSearch = (values: QualityReleaseQuery) => {
    setFilters(values);
    setPagination({ current: 1, pageSize: pagination.pageSize });
    loadQualityReleases();
  };

  // 重置搜索
  const handleReset = () => {
    setFilters({});
    setPagination({ current: 1, pageSize: pagination.pageSize });
    loadQualityReleases();
  };

  // 新增放行单
  const handleCreate = () => {
    setModalMode('create');
    setModalVisible(true);
  };

  // 编辑放行单
  const handleEdit = (record: QualityRelease) => {
    setCurrentQualityRelease(record);
    setModalMode('edit');
    setModalVisible(true);
  };

  // 查看详情
  const handleDetail = (record: QualityRelease) => {
    setCurrentQualityRelease(record);
    setDetailVisible(true);
  };

  // 删除放行单
  const handleDelete = (ids: string[]) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除选中的 ${ids.length} 个放行单吗？`,
      onOk: async () => {
        await deleteQualityReleases(ids);
        message.success('删除成功');
      },
    });
  };

  // 批准放行
  const handleApprove = (record: QualityRelease) => {
    Modal.confirm({
      title: '确认批准',
      content: `确定要批准放行 ${record.releaseNo} 吗？`,
      onOk: async () => {
        await approveQualityRelease(record.id);
        message.success('批准成功');
      },
    });
  };

  // 拒绝放行
  const handleReject = (record: QualityRelease) => {
    Modal.confirm({
      title: '确认拒绝',
      content: `确定要拒绝放行 ${record.releaseNo} 吗？`,
      onOk: async () => {
        await rejectQualityRelease(record.id);
        message.success('拒绝成功');
      },
    });
  };

  // 取消放行
  const handleCancel = (record: QualityRelease) => {
    Modal.confirm({
      title: '确认取消',
      content: `确定要取消放行 ${record.releaseNo} 吗？`,
      onOk: async () => {
        await cancelQualityRelease(record.id);
        message.success('取消成功');
      },
    });
  };

  // 导出放行单
  const handleExport = () => {
    Modal.confirm({
      title: '确认导出',
      content: `确定要导出选中的 ${selectedIds.length} 个放行单吗？`,
      onOk: async () => {
        await exportQualityReleases(selectedIds);
        message.success('导出成功');
      },
    });
  };

  // 表单提交
  const handleFormSubmit = async (values: any) => {
    try {
      if (modalMode === 'create') {
        await createQualityRelease(values);
        message.success('创建成功');
      } else {
        await updateQualityRelease({ id: currentQualityRelease!.id, ...values } as any);
        message.success('更新成功');
      }
      setModalVisible(false);
      loadQualityReleases();
    } catch (err) {
      message.error(modalMode === 'create' ? '创建失败' : '更新失败');
    }
  };

  // 批量操作菜单
  const batchActions = [
    {
      key: 'approve',
      label: '批准',
      icon: <CheckCircleOutlined />,
      onClick: () => {
        if (selectedIds.length === 0) {
          message.warning('请先选择要批准的放行单');
          return;
        }
        Modal.confirm({
          title: '确认批准',
          content: `确定要批准选中的 ${selectedIds.length} 个放行单吗？`,
          onOk: async () => {
            await Promise.all(selectedIds.map(id => approveQualityRelease(id)));
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
          message.warning('请先选择要拒绝的放行单');
          return;
        }
        Modal.confirm({
          title: '确认拒绝',
          content: `确定要拒绝选中的 ${selectedIds.length} 个放行单吗？`,
          onOk: async () => {
            await Promise.all(selectedIds.map(id => rejectQualityRelease(id)));
            message.success('拒绝成功');
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
          message.warning('请先选择要取消的放行单');
          return;
        }
        Modal.confirm({
          title: '确认取消',
          content: `确定要取消选中的 ${selectedIds.length} 个放行单吗？`,
          onOk: async () => {
            await Promise.all(selectedIds.map(id => cancelQualityRelease(id)));
            message.success('取消成功');
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
          message.warning('请先选择要删除的放行单');
          return;
        }
        handleDelete(selectedIds);
      },
    },
  ];

  return (
    <div style={{ padding: '16px' }}>
      <ActionBar
        title="质量放行"
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
        dataSource={qualityReleases}
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
            loadQualityReleases();
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
        title={modalMode === 'create' ? '新增质量放行单' : '编辑质量放行单'}
        mode={modalMode}
        initialValues={currentQualityRelease || undefined}
        onSubmit={handleFormSubmit}
        onCancel={() => {
          setModalVisible(false);
          setCurrentQualityRelease(null);
        }}
        loading={loading}
        width={900}
        formComponent={React.lazy(() => import('./QualityReleaseForm'))}
      />

      {/* 详情抽屉 */}
      <DetailDrawer
        visible={detailVisible}
        title="质量放行详情"
        onClose={() => {
          setDetailVisible(false);
          setCurrentQualityRelease(null);
        }}
        width={800}
        detailComponent={React.lazy(() => import('./QualityReleaseDetail'))}
        data={currentQualityRelease}
      />
    </div>
  );
};

export default QualityReleaseList;

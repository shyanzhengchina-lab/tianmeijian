/**
 * 质检工作台列表组件
 * 提供完整的质检单管理功能：查询、新增、编辑、删除、开始、判定、分配
 */

import React, { useEffect } from 'react';
import { Space, message, Modal, Button } from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, PlayCircleOutlined,
  CheckCircleOutlined, StopOutlined, ExportOutlined, SafetyOutlined,
  TeamOutlined
} from '@ant-design/icons';
import { DataTable, SearchForm, ActionBar, FormModal, DetailDrawer, StatusBadge } from '../../../../shared/components';
import { useInspectionStore } from '../store';
import { INSPECTION_STATUS_MAP, INSPECTION_TYPE_MAP } from '../types';
import type { Inspection, InspectionQuery } from '../types';

export const InspectionList: React.FC = () => {
  const {
    inspections, selectedIds, currentInspection, filters, pagination, loading, error,
    loadInspections, createInspection, updateInspection, deleteInspections,
    startInspection, passInspection, failInspection,
    conditionalInspection, assignInspection, exportInspections,
    setFilters, setSelectedIds, setCurrentInspection, setPagination,
  } = useInspectionStore();

  useEffect(() => {
    loadInspections();
  }, []);

  // 搜索字段配置
  const searchFields = [
    {
      name: 'inspectionNo',
      label: '质检单号',
      type: 'input' as const,
      placeholder: '请输入质检单号',
      width: 160,
    },
    {
      name: 'ticketNo',
      label: '浮票号',
      type: 'input' as const,
      placeholder: '请输入浮票号',
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
      name: 'inspectionType',
      label: '质检类型',
      type: 'select' as const,
      placeholder: '请选择类型',
      width: 120,
      options: Object.entries(INSPECTION_TYPE_MAP).map(([key, value]) => ({
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
      options: Object.entries(INSPECTION_STATUS_MAP).map(([key, value]) => ({
        label: value.label,
        value: key,
      })),
    },
    {
      name: 'inspector',
      label: '检验员',
      type: 'input' as const,
      placeholder: '请输入检验员',
      width: 120,
    },
  ];

  // 表格列定义
  const columns = [
    {
      title: '质检单号',
      dataIndex: 'inspectionNo',
      width: 160,
      fixed: 'left' as const,
    },
    {
      title: '浮票号',
      dataIndex: 'ticketNo',
      width: 140,
    },
    {
      title: '工单号',
      dataIndex: 'workOrderNo',
      width: 140,
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
      title: '质检类型',
      dataIndex: 'inspectionType',
      width: 110,
      align: 'center' as const,
      render: (type: string) => {
        const config = INSPECTION_TYPE_MAP[type as keyof typeof INSPECTION_TYPE_MAP];
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
        <StatusBadge status={status} statusMap={INSPECTION_STATUS_MAP} />
      ),
    },
    {
      title: '质检方案',
      dataIndex: 'qcSchemeName',
      width: 150,
      ellipsis: true,
    },
    {
      title: '检验员',
      dataIndex: 'inspector',
      width: 100,
    },
    {
      title: '抽样数量',
      dataIndex: 'sampleQty',
      width: 100,
      align: 'right' as const,
      render: (qty: number) => qty.toLocaleString(),
    },
    {
      title: '合格数量',
      dataIndex: 'qualifiedQty',
      width: 100,
      align: 'right' as const,
      render: (qty: number) => qty.toLocaleString(),
    },
    {
      title: '不合格数量',
      dataIndex: 'unqualifiedQty',
      width: 100,
      align: 'right' as const,
      render: (qty: number) => qty.toLocaleString(),
    },
    {
      title: '有条件数量',
      dataIndex: 'conditionalQty',
      width: 100,
      align: 'right' as const,
      render: (qty: number) => qty?.toLocaleString() || 0,
    },
    {
      title: '申请时间',
      dataIndex: 'requestTime',
      width: 160,
    },
    {
      title: '检验时间',
      dataIndex: 'inspectionTime',
      width: 160,
    },
    {
      title: '操作',
      key: 'action',
      width: 300,
      fixed: 'right' as const,
      align: 'center' as const,
      render: (_: any, record: Inspection) => (
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
            icon={<TeamOutlined />}
            onClick={() => handleAssign(record)}
            disabled={record.status !== 'PENDING'}
          >
            分配
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
            onClick={() => handlePass(record)}
            disabled={record.status !== 'IN_PROGRESS'}
          >
            合格
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<StopOutlined />}
            onClick={() => handleFail(record)}
            disabled={record.status !== 'IN_PROGRESS'}
          >
            不合格
          </Button>
          <Button
            type="link"
            size="small"
            icon={<SafetyOutlined />}
            onClick={() => handleConditional(record)}
            disabled={record.status !== 'IN_PROGRESS'}
          >
            有条件
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
  const handleSearch = (values: InspectionQuery) => {
    setFilters(values);
    setPagination({ current: 1, pageSize: pagination.pageSize });
    loadInspections();
  };

  // 重置搜索
  const handleReset = () => {
    setFilters({});
    setPagination({ current: 1, pageSize: pagination.pageSize });
    loadInspections();
  };

  // 新增质检单
  const handleCreate = () => {
    setModalMode('create');
    setModalVisible(true);
  };

  // 编辑质检单
  const handleEdit = (record: Inspection) => {
    setCurrentInspection(record);
    setModalMode('edit');
    setModalVisible(true);
  };

  // 查看详情
  const handleDetail = (record: Inspection) => {
    setCurrentInspection(record);
    setDetailVisible(true);
  };

  // 删除质检单
  const handleDelete = (ids: string[]) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除选中的 ${ids.length} 个质检单吗？`,
      onOk: async () => {
        await deleteInspections(ids);
        message.success('删除成功');
      },
    });
  };

  // 开始质检
  const handleStart = (record: Inspection) => {
    Modal.confirm({
      title: '确认开始',
      content: `确定要开始质检 ${record.inspectionNo} 吗？`,
      onOk: async () => {
        await startInspection(record.id);
        message.success('开始成功');
      },
    });
  };

  // 质检合格
  const handlePass = (record: Inspection) => {
    Modal.confirm({
      title: '确认合格',
      content: `确定要判定质检 ${record.inspectionNo} 为合格吗？`,
      onOk: async () => {
        await passInspection(record.id);
        message.success('判定成功');
      },
    });
  };

  // 质检不合格
  const handleFail = (record: Inspection) => {
    Modal.confirm({
      title: '确认不合格',
      content: `确定要判定质检 ${record.inspectionNo} 为不合格吗？`,
      onOk: async () => {
        await failInspection(record.id);
        message.success('判定成功');
      },
    });
  };

  // 质检有条件
  const handleConditional = (record: Inspection) => {
    Modal.confirm({
      title: '确认有条件',
      content: `确定要判定质检 ${record.inspectionNo} 为有条件合格吗？`,
      onOk: async () => {
        await conditionalInspection(record.id);
        message.success('判定成功');
      },
    });
  };

  // 分配质检
  const handleAssign = (record: Inspection) => {
    setCurrentInspection(record);
    // TODO: 打开分配对话框
    message.info('分配功能待实现');
  };

  // 导出质检单
  const handleExport = () => {
    Modal.confirm({
      title: '确认导出',
      content: `确定要导出选中的 ${selectedIds.length} 个质检单吗？`,
      onOk: async () => {
        await exportInspections(selectedIds);
        message.success('导出成功');
      },
    });
  };

  // 表单提交
  const handleFormSubmit = async (values: any) => {
    try {
      if (modalMode === 'create') {
        await createInspection(values);
        message.success('创建成功');
      } else {
        await updateInspection(currentInspection!.id, values);
        message.success('更新成功');
      }
      setModalVisible(false);
      loadInspections();
    } catch (err) {
      message.error(modalMode === 'create' ? '创建失败' : '更新失败');
    }
  };

  // 批量操作菜单
  const batchActions = [
    {
      key: 'assign',
      label: '分配',
      icon: <TeamOutlined />,
      onClick: () => {
        if (selectedIds.length === 0) {
          message.warning('请先选择要分配的质检单');
          return;
        }
        // TODO: 打开批量分配对话框
        message.info('批量分配功能待实现');
      },
    },
    {
      key: 'start',
      label: '开始',
      icon: <PlayCircleOutlined />,
      onClick: () => {
        if (selectedIds.length === 0) {
          message.warning('请先选择要开始的质检单');
          return;
        }
        Modal.confirm({
          title: '确认开始',
          content: `确定要开始选中的 ${selectedIds.length} 个质检吗？`,
          onOk: async () => {
            await Promise.all(selectedIds.map(id => startInspection(id)));
            message.success('开始成功');
          },
        });
      },
    },
    {
      key: 'pass',
      label: '合格',
      icon: <CheckCircleOutlined />,
      onClick: () => {
        if (selectedIds.length === 0) {
          message.warning('请先选择要判定的质检单');
          return;
        }
        Modal.confirm({
          title: '确认合格',
          content: `确定要判定选中的 ${selectedIds.length} 个质检为合格吗？`,
          onOk: async () => {
            await Promise.all(selectedIds.map(id => passInspection(id)));
            message.success('判定成功');
          },
        });
      },
    },
    {
      key: 'fail',
      label: '不合格',
      icon: <StopOutlined />,
      onClick: () => {
        if (selectedIds.length === 0) {
          message.warning('请先选择要判定的质检单');
          return;
        }
        Modal.confirm({
          title: '确认不合格',
          content: `确定要判定选中的 ${selectedIds.length} 个质检为不合格吗？`,
          onOk: async () => {
            await Promise.all(selectedIds.map(id => failInspection(id)));
            message.success('判定成功');
          },
        });
      },
    },
    {
      key: 'conditional',
      label: '有条件',
      icon: <SafetyOutlined />,
      onClick: () => {
        if (selectedIds.length === 0) {
          message.warning('请先选择要判定的质检单');
          return;
        }
        Modal.confirm({
          title: '确认有条件',
          content: `确定要判定选中的 ${selectedIds.length} 个质检为有条件合格吗？`,
          onOk: async () => {
            await Promise.all(selectedIds.map(id => conditionalInspection(id)));
            message.success('判定成功');
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
          message.warning('请先选择要删除的质检单');
          return;
        }
        handleDelete(selectedIds);
      },
    },
  ];

  return (
    <div style={{ padding: '16px' }}>
      <ActionBar
        title="质检工作台"
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
        dataSource={inspections}
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
            loadInspections();
          },
        }}
        rowSelection={{
          selectedRowKeys: selectedIds,
          onChange: (keys) => setSelectedIds(keys as string[]),
        }}
        onRow={(record) => ({
          onDoubleClick: () => handleDetail(record),
        })}
        scroll={{ x: 2300 }}
      />

      {/* 表单弹窗 */}
      <FormModal
        visible={modalVisible}
        title={modalMode === 'create' ? '新增质检单' : '编辑质检单'}
        mode={modalMode}
        initialValues={currentInspection || undefined}
        onSubmit={handleFormSubmit}
        onCancel={() => {
          setModalVisible(false);
          setCurrentInspection(null);
        }}
        loading={loading}
        width={900}
        formComponent={React.lazy(() => import('./InspectionForm'))}
      />

      {/* 详情抽屉 */}
      <DetailDrawer
        visible={detailVisible}
        title="质检单详情"
        onClose={() => {
          setDetailVisible(false);
          setCurrentInspection(null);
        }}
        width={900}
        detailComponent={React.lazy(() => import('./InspectionDetail'))}
        data={currentInspection}
      />
    </div>
  );
};

export default InspectionList;

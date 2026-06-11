/**
 * 批生产浮票列表组件
 * 提供完整的浮票管理功能：查询、新增、编辑、删除、发布、开始、完成、质检、取消
 */

import React, { useEffect } from 'react';
import { Space, message, Modal, Button } from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, PlayCircleOutlined,
  CheckCircleOutlined, StopOutlined, ExportOutlined, SafetyOutlined,
  RocketOutlined, WarningOutlined
} from '@ant-design/icons';
import { DataTable, SearchForm, ActionBar, FormModal, DetailDrawer, StatusBadge } from '../../../../shared/components';
import { useFloatTicketStore } from '../store';
import { FLOAT_TICKET_STATUS_MAP, FLOAT_TICKET_TYPE_MAP, QC_RESULT_MAP } from '../types';
import type { FloatTicket, FloatTicketQuery } from '../types';

export const FloatTicketList: React.FC = () => {
  const {
    floatTickets, selectedIds, currentFloatTicket, filters, pagination, loading, error,
    loadFloatTickets, createFloatTicket, updateFloatTicket, deleteFloatTickets,
    releaseFloatTicket, startFloatTicket, completeFloatTicket,
    cancelFloatTicket, qcFloatTicket, exportFloatTickets,
    setFilters, setSelectedIds, setCurrentFloatTicket, setPagination,
  } = useFloatTicketStore();

  useEffect(() => {
    loadFloatTickets();
  }, []);

  // 搜索字段配置
  const searchFields = [
    {
      name: 'ticketNo',
      label: '浮票号',
      type: 'input' as const,
      placeholder: '请输入浮票号',
      width: 180,
    },
    {
      name: 'workOrderNo',
      label: '工单号',
      type: 'input' as const,
      placeholder: '请输入工单号',
      width: 180,
    },
    {
      name: 'productionOrderNo',
      label: '生产订单',
      type: 'input' as const,
      placeholder: '请输入生产订单',
      width: 160,
    },
    {
      name: 'productCode',
      label: '产品编码',
      type: 'input' as const,
      placeholder: '请输入产品编码',
      width: 160,
    },
    {
      name: 'batchNo',
      label: '批号',
      type: 'input' as const,
      placeholder: '请输入批号',
      width: 140,
    },
    {
      name: 'status',
      label: '状态',
      type: 'select' as const,
      placeholder: '请选择状态',
      width: 120,
      options: Object.entries(FLOAT_TICKET_STATUS_MAP).map(([key, value]) => ({
        label: value.label,
        value: key,
      })),
    },
    {
      name: 'ticketType',
      label: '浮票类型',
      type: 'select' as const,
      placeholder: '请选择类型',
      width: 120,
      options: Object.entries(FLOAT_TICKET_TYPE_MAP).map(([key, value]) => ({
        label: value.label,
        value: key,
      })),
    },
    {
      name: 'qcResult',
      label: '质检结果',
      type: 'select' as const,
      placeholder: '请选择结果',
      width: 120,
      options: Object.entries(QC_RESULT_MAP).map(([key, value]) => ({
        label: value.label,
        value: key,
      })),
    },
    {
      name: 'currentWorkcenter',
      label: '当前工作中心',
      type: 'input' as const,
      placeholder: '请输入工作中心',
      width: 140,
    },
  ];

  // 表格列定义
  const columns = [
    {
      title: '浮票号',
      dataIndex: 'ticketNo',
      width: 160,
      fixed: 'left' as const,
    },
    {
      title: '工单号',
      dataIndex: 'workOrderNo',
      width: 140,
    },
    {
      title: '生产订单',
      dataIndex: 'productionOrderNo',
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
      title: '状态',
      dataIndex: 'status',
      width: 100,
      align: 'center' as const,
      render: (status: string) => (
        <StatusBadge status={status} statusMap={FLOAT_TICKET_STATUS_MAP} />
      ),
    },
    {
      title: '类型',
      dataIndex: 'ticketType',
      width: 100,
      align: 'center' as const,
      render: (type: string) => {
        const config = FLOAT_TICKET_TYPE_MAP[type as keyof typeof FLOAT_TICKET_TYPE_MAP];
        return config ? (
          <span style={{ color: config.color, fontWeight: 'bold' }}>
            {config.label}
          </span>
        ) : '-';
      },
    },
    {
      title: '计划数量',
      dataIndex: 'planQty',
      width: 100,
      align: 'right' as const,
      render: (qty: number) => qty.toLocaleString(),
    },
    {
      title: '实际数量',
      dataIndex: 'actualQty',
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
      title: '质检结果',
      dataIndex: 'qcResult',
      width: 100,
      align: 'center' as const,
      render: (result: string) => {
        if (!result) return '-';
        const config = QC_RESULT_MAP[result as keyof typeof QC_RESULT_MAP];
        return config ? (
          <span style={{ color: config.color, fontWeight: 'bold' }}>
            {config.label}
          </span>
        ) : result;
      },
    },
    {
      title: '当前工序',
      dataIndex: 'currentWorkcenter',
      width: 120,
    },
    {
      title: '操作员',
      dataIndex: 'currentOperator',
      width: 100,
    },
    {
      title: '发布时间',
      dataIndex: 'releaseTime',
      width: 160,
    },
    {
      title: '开始时间',
      dataIndex: 'startTime',
      width: 160,
    },
    {
      title: '操作',
      key: 'action',
      width: 280,
      fixed: 'right' as const,
      align: 'center' as const,
      render: (_: any, record: FloatTicket) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            disabled={record.status !== 'CREATED'}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            icon={<RocketOutlined />}
            onClick={() => handleRelease(record)}
            disabled={record.status !== 'CREATED'}
          >
            发布
          </Button>
          <Button
            type="link"
            size="small"
            icon={<PlayCircleOutlined />}
            onClick={() => handleStart(record)}
            disabled={record.status !== 'RELEASED'}
          >
            开始
          </Button>
          <Button
            type="link"
            size="small"
            icon={<CheckCircleOutlined />}
            onClick={() => handleComplete(record)}
            disabled={record.status !== 'IN_PROCESS'}
          >
            完成
          </Button>
          <Button
            type="link"
            size="small"
            icon={<SafetyOutlined />}
            onClick={() => handleQc(record)}
            disabled={record.status !== 'QC_PENDING'}
          >
            质检
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete([record.id])}
            disabled={record.status !== 'CREATED'}
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
  const handleSearch = (values: FloatTicketQuery) => {
    setFilters(values);
    setPagination({ current: 1, pageSize: pagination.pageSize });
    loadFloatTickets();
  };

  // 重置搜索
  const handleReset = () => {
    setFilters({});
    setPagination({ current: 1, pageSize: pagination.pageSize });
    loadFloatTickets();
  };

  // 新增浮票
  const handleCreate = () => {
    setModalMode('create');
    setModalVisible(true);
  };

  // 编辑浮票
  const handleEdit = (record: FloatTicket) => {
    setCurrentFloatTicket(record);
    setModalMode('edit');
    setModalVisible(true);
  };

  // 查看详情
  const handleDetail = (record: FloatTicket) => {
    setCurrentFloatTicket(record);
    setDetailVisible(true);
  };

  // 删除浮票
  const handleDelete = (ids: string[]) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除选中的 ${ids.length} 个浮票吗？`,
      onOk: async () => {
        await deleteFloatTickets(ids);
        message.success('删除成功');
      },
    });
  };

  // 发布浮票
  const handleRelease = (record: FloatTicket) => {
    Modal.confirm({
      title: '确认发布',
      content: `确定要发布浮票 ${record.ticketNo} 吗？`,
      onOk: async () => {
        await releaseFloatTicket(record.id);
        message.success('发布成功');
      },
    });
  };

  // 开始浮票
  const handleStart = (record: FloatTicket) => {
    Modal.confirm({
      title: '确认开始',
      content: `确定要开始浮票 ${record.ticketNo} 吗？`,
      onOk: async () => {
        await startFloatTicket(record.id);
        message.success('开始成功');
      },
    });
  };

  // 完成浮票
  const handleComplete = (record: FloatTicket) => {
    Modal.confirm({
      title: '确认完成',
      content: `确定要完成浮票 ${record.ticketNo} 吗？`,
      onOk: async () => {
        await completeFloatTicket(record.id);
        message.success('完成成功');
      },
    });
  };

  // 质检浮票
  const handleQc = (record: FloatTicket) => {
    setCurrentFloatTicket(record);
    // TODO: 打开质检对话框
    message.info('质检功能待实现');
  };

  // 取消浮票
  const handleCancel = (ids: string[]) => {
    Modal.confirm({
      title: '确认取消',
      content: `确定要取消选中的 ${ids.length} 个浮票吗？`,
      onOk: async () => {
        await cancelFloatTicket(Array.isArray(ids) ? ids[0] : ids);
        message.success('取消成功');
      },
    });
  };

  // 导出浮票
  const handleExport = () => {
    Modal.confirm({
      title: '确认导出',
      content: `确定要导出选中的 ${selectedIds.length} 个浮票吗？`,
      onOk: async () => {
        await exportFloatTickets({ ids: selectedIds } as any);
        message.success('导出成功');
      },
    });
  };

  // 表单提交
  const handleFormSubmit = async (values: any) => {
    try {
      if (modalMode === 'create') {
        await createFloatTicket(values);
        message.success('创建成功');
      } else {
        await updateFloatTicket({ id: currentFloatTicket!.id, ...values });
        message.success('更新成功');
      }
      setModalVisible(false);
      loadFloatTickets();
    } catch (err) {
      message.error(modalMode === 'create' ? '创建失败' : '更新失败');
    }
  };

  // 批量操作菜单
  const batchActions = [
    {
      key: 'release',
      label: '发布',
      icon: <RocketOutlined />,
      onClick: () => {
        if (selectedIds.length === 0) {
          message.warning('请先选择要发布的浮票');
          return;
        }
        Modal.confirm({
          title: '确认发布',
          content: `确定要发布选中的 ${selectedIds.length} 个浮票吗？`,
          onOk: async () => {
            await Promise.all(selectedIds.map(id => releaseFloatTicket(id)));
            message.success('发布成功');
          },
        });
      },
    },
    {
      key: 'start',
      label: '开始',
      icon: <PlayCircleOutlined />,
      onClick: () => {
        if (selectedIds.length === 0) {
          message.warning('请先选择要开始的浮票');
          return;
        }
        Modal.confirm({
          title: '确认开始',
          content: `确定要开始选中的 ${selectedIds.length} 个浮票吗？`,
          onOk: async () => {
            await Promise.all(selectedIds.map(id => startFloatTicket(id)));
            message.success('开始成功');
          },
        });
      },
    },
    {
      key: 'complete',
      label: '完成',
      icon: <CheckCircleOutlined />,
      onClick: () => {
        if (selectedIds.length === 0) {
          message.warning('请先选择要完成的浮票');
          return;
        }
        Modal.confirm({
          title: '确认完成',
          content: `确定要完成选中的 ${selectedIds.length} 个浮票吗？`,
          onOk: async () => {
            await Promise.all(selectedIds.map(id => completeFloatTicket(id)));
            message.success('完成成功');
          },
        });
      },
    },
    {
      key: 'qc',
      label: '质检',
      icon: <SafetyOutlined />,
      onClick: () => {
        if (selectedIds.length === 0) {
          message.warning('请先选择要质检的浮票');
          return;
        }
        // TODO: 打开批量质检对话框
        message.info('批量质检功能待实现');
      },
    },
    {
      key: 'cancel',
      label: '取消',
      icon: <WarningOutlined />,
      onClick: () => {
        if (selectedIds.length === 0) {
          message.warning('请先选择要取消的浮票');
          return;
        }
        handleCancel(selectedIds);
      },
    },
    {
      key: 'delete',
      label: '删除',
      icon: <DeleteOutlined />,
      danger: true,
      onClick: () => {
        if (selectedIds.length === 0) {
          message.warning('请先选择要删除的浮票');
          return;
        }
        handleDelete(selectedIds);
      },
    },
  ];

  return (
    <div style={{ padding: '16px' }}>
      <ActionBar
        title="批生产浮票"
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
        dataSource={floatTickets}
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
            loadFloatTickets();
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
        title={modalMode === 'create' ? '新增批生产浮票' : '编辑批生产浮票'}
        mode={modalMode}
        initialValues={currentFloatTicket || undefined}
        onSubmit={handleFormSubmit}
        onCancel={() => {
          setModalVisible(false);
          setCurrentFloatTicket(null);
        }}
        loading={loading}
        width={1000}
        formComponent={React.lazy(() => import('./FloatTicketForm'))}
      />

      {/* 详情抽屉 */}
      <DetailDrawer
        visible={detailVisible}
        title="浮票详情"
        onClose={() => {
          setDetailVisible(false);
          setCurrentFloatTicket(null);
        }}
        width={900}
        detailComponent={React.lazy(() => import('./FloatTicketDetail'))}
        data={currentFloatTicket}
      />
    </div>
  );
};

export default FloatTicketList;

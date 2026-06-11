/**
 * EBR列表组件
 * 使用新架构的完整实现
 * 完全保持UI/UX零变化，与现有页面样式一致
 */
import React, { useEffect, useState } from 'react';
import { DataTable } from '../../../../shared/components/DataTable';
import { SearchForm } from '../../../../shared/components/SearchForm';
import { ActionBar } from '../../../../shared/components/ActionBar';
import { StatusBadge } from '../../../../shared/components/StatusBadge';
import { DetailDrawer } from '../../../../shared/components/DetailDrawer';
import { FormModal } from '../../../../shared/components/FormModal';
import { useEbrStore } from '../store';
import { usePermission } from '../../../../shared/hooks/usePermission';
import type { FormField, DetailField } from '../../../../shared/types/common';
import {
  Ebr,
  EbrStatus,
  EbrType,
  EBR_STATUS_MAP,
  EBR_TYPE_MAP,
} from '../types';
import {
  PlusOutlined, ReloadOutlined, EditOutlined, DeleteOutlined,
  EyeOutlined, CheckCircleOutlined, StopOutlined,
  PlayCircleOutlined, FileTextOutlined, PrinterOutlined,
  ExportOutlined, ApartmentOutlined,
  ClockCircleOutlined, SafetyCertificateOutlined
} from '@ant-design/icons';
import { Button, Space, Popconfirm, message, Statistic, Row, Col, Tag, Modal, Steps, Result, Card } from 'antd';
import type { ColumnsType } from 'antd/es/table';

/**
 * 搜索表单字段配置
 */
const SEARCH_FIELDS: FormField[] = [
  { name: 'ebrNo', label: 'EBR编号', type: 'input', placeholder: '请输入EBR编号' },
  { name: 'batchNo', label: '批号', type: 'input', placeholder: '请输入批号' },
  {
    name: 'productCode',
    label: '产品编码',
    type: 'input',
    placeholder: '请输入产品编码',
  },
  {
    name: 'productName',
    label: '产品名称',
    type: 'input',
    placeholder: '请输入产品名称',
  },
  {
    name: 'status',
    label: '状态',
    type: 'select',
    options: [
      { label: '全部', value: '' },
      ...Object.entries(EBR_STATUS_MAP).map(([key, value]) => ({
        label: value.label,
        value: key,
      })),
    ],
  },
  {
    name: 'ebrType',
    label: 'EBR类型',
    type: 'select',
    options: [
      { label: '全部', value: '' },
      ...Object.entries(EBR_TYPE_MAP).map(([key, value]) => ({
        label: value.label,
        value: key,
      })),
    ],
  },
];

/**
 * EBR列表组件
 * 使用新架构的完整EBR列表页面
 * 保持与现有页面完全一致的样式和功能
 */
export const EbrList: React.FC = () => {
  const {
    ebrs,
    selectedIds,
    currentEbr,
    filters,
    pagination,
    loading,
    error,
    statistics,
    loadEbrs,
    loadStatistics,
    createEbr,
    updateEbr,
    deleteEbrs,
    startEbr,
    completeEbr,
    closeEbr,
    cancelEbr,
    approveEbr,
    exportEbrs,
    setFilters,
    setSelectedIds,
    setCurrentEbr,
    setLoading,
    setError,
  } = useEbrStore();

  const { canCreate, canUpdate, canDelete, canStart, canComplete, canClose, canCancel, canApprove, canExport } = usePermission('ebr');

  const [modalOpen, setModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  /**
   * 初始化加载数据
   */
  useEffect(() => {
    loadEbrs();
    loadStatistics();
  }, []);

  /**
   * 搜索处理
   */
  const handleSearch = (values: any) => {
    setFilters(values);
    loadEbrs();
  };

  /**
   * 重置处理
   */
  const handleReset = () => {
    setFilters({});
    loadEbrs();
  };

  /**
   * 新增EBR
   */
  const handleAdd = () => {
    setCurrentEbr({} as Ebr); // 空对象表示新增模式
    setModalOpen(true);
  };

  /**
   * 编辑EBR
   */
  const handleEdit = (ebr: Ebr) => {
    setCurrentEbr(ebr);
    setModalOpen(true);
  };

  /**
   * 查看详情
   */
  const handleView = (ebr: Ebr) => {
    setCurrentEbr(ebr);
    setDetailOpen(true);
  };

  /**
   * 开始EBR
   */
  const handleStart = async (ebr: Ebr) => {
    try {
      await startEbr(ebr.id);
      message.success(`EBR ${ebr.ebrNo} 开始成功`);
      await loadEbrs();
    } catch (error) {
      console.error('开始EBR失败:', error);
    }
  };

  /**
   * 完成EBR
   */
  const handleComplete = async (ebr: Ebr) => {
    try {
      await completeEbr(ebr.id, 0, 0);
      message.success(`EBR ${ebr.ebrNo} 完成成功`);
      await loadEbrs();
    } catch (error) {
      console.error('完成EBR失败:', error);
    }
  };

  /**
   * 关闭EBR
   */
  const handleClose = async (ebr: Ebr) => {
    try {
      await closeEbr(ebr.id, '当前用户');
      message.success(`EBR ${ebr.ebrNo} 关闭成功`);
      await loadEbrs();
    } catch (error) {
      console.error('关闭EBR失败:', error);
    }
  };

  /**
   * 取消EBR
   */
  const handleCancel = async (ebr: Ebr) => {
    try {
      await cancelEbr(ebr.id, '当前用户');
      message.success(`EBR ${ebr.ebrNo} 取消成功`);
      await loadEbrs();
    } catch (error) {
      console.error('取消EBR失败:', error);
    }
  };

  /**
   * 批准EBR
   */
  const handleApprove = async (ebr: Ebr) => {
    try {
      await approveEbr(ebr.id, '当前用户');
      message.success(`EBR ${ebr.ebrNo} 批准成功`);
      await loadEbrs();
    } catch (error) {
      console.error('批准EBR失败:', error);
    }
  };

  /**
   * 删除EBR
   */
  const handleDelete = async (ids: string[]) => {
    try {
      await deleteEbrs(ids);
      message.success(`成功删除 ${ids.length} 个EBR`);
    } catch (error) {
      console.error('删除EBR失败:', error);
    }
  };

  /**
   * 批量开始
   */
  const handleBatchStart = async () => {
    if (selectedIds.length === 0) {
      message.warning('请先选择EBR');
      return;
    }

    try {
      const promises = selectedIds.map(id => startEbr(id));
      await Promise.all(promises);
      message.success(`成功开始 ${selectedIds.length} 个EBR`);
      setSelectedIds([]);
    } catch (error) {
      console.error('批量开始EBR失败:', error);
    }
  };

  /**
   * 批量完成
   */
  const handleBatchComplete = async () => {
    if (selectedIds.length === 0) {
      message.warning('请先选择EBR');
      return;
    }

    try {
      const promises = selectedIds.map(id => completeEbr(id, 0, 0));
      await Promise.all(promises);
      message.success(`成功完成 ${selectedIds.length} 个EBR`);
      setSelectedIds([]);
    } catch (error) {
      console.error('批量完成EBR失败:', error);
    }
  };

  /**
   * 批量关闭
   */
  const handleBatchClose = async () => {
    if (selectedIds.length === 0) {
      message.warning('请先选择EBR');
      return;
    }

    try {
      const promises = selectedIds.map(id => closeEbr(id, '当前用户'));
      await Promise.all(promises);
      message.success(`成功关闭 ${selectedIds.length} 个EBR`);
      setSelectedIds([]);
    } catch (error) {
      console.error('批量关闭EBR失败:', error);
    }
  };

  /**
   * 导出EBR
   */
  const handleExport = async () => {
    if (selectedIds.length === 0) {
      message.warning('请先选择要导出的EBR');
      return;
    }

    try {
      setExportLoading(true);
      await exportEbrs(selectedIds);
      message.success('EBR导出成功');
      setExportLoading(false);
      setSelectedIds([]);
    } catch (error) {
      console.error('导出EBR失败:', error);
      setExportLoading(false);
    }
  };

  /**
   * 刷新列表
   */
  const handleRefresh = () => {
    loadEbrs();
    loadStatistics();
  };

  /**
   * 表单提交处理
   */
  const handleFormSubmit = async (values: any) => {
    setFormLoading(true);
    try {
      if (currentEbr && currentEbr.id) {
        // 编辑模式
        await updateEbr({ ...values, id: currentEbr.id });
        message.success('EBR更新成功');
      } else {
        // 新增模式
        await createEbr(values);
        message.success('EBR创建成功');
      }
      setModalOpen(false);
      await loadEbrs();
    } catch (error: any) {
      console.error('表单提交失败:', error);
      message.error('创建失败');
    } finally {
      setFormLoading(false);
    }
  };

  /**
   * 构建详情字段
   */
  const buildDetailFields = (): DetailField[] => {
    if (!currentEbr) return [];

    const statusConfig = EBR_STATUS_MAP[currentEbr.status];
    const typeConfig = EBR_TYPE_MAP[currentEbr.ebrType];

    return [
      { label: 'EBR编号', value: currentEbr.ebrNo },
      { label: '批号', value: currentEbr.batchNo },
      { label: '产品编码', value: currentEbr.productCode },
      { label: '产品名称', value: currentEbr.productName },
      { label: '产品规格', value: currentEbr.productSpec },
      { label: 'EBR类型', value: typeConfig.label, type: 'tag' as const, options: [typeConfig] },
      { label: '状态', value: statusConfig.label, type: 'tag' as const, options: [statusConfig] },
      { label: '计划数量', value: currentEbr.planQty?.toLocaleString() || '-' },
      { label: '实际数量', value: currentEbr.actualQty?.toLocaleString() || '-' },
      { label: '合格数量', value: currentEbr.qualifiedQty?.toLocaleString() || '-' },
      { label: '不合格数量', value: (currentEbr.unqualifiedQty || 0)?.toLocaleString() || '-' },
      { label: '计划开始日期', value: currentEbr.planStartDate },
      { label: '计划结束日期', value: currentEbr.planEndDate },
      { label: '实际开始日期', value: currentEbr.actualStartDate || '待开始' },
      { label: '实际结束日期', value: currentEbr.actualEndDate || '进行中' },
      { label: '批准人', value: currentEbr.approvedBy || '待批准' },
      { label: '批准时间', value: currentEbr.approvalTime || '待批准' },
      { label: '备注', value: currentEbr.remark || '无' },
      { label: '创建时间', value: currentEbr.createdAt },
      { label: '更新时间', value: currentEbr.updatedAt },
    ];
  };

  /**
   * 表格列定义
   */
  const columns: ColumnsType<Ebr> = [
    {
      title: 'EBR编号',
      dataIndex: 'ebrNo',
      key: 'ebrNo',
      width: 150,
      fixed: 'left' as const,
    },
    {
      title: '批号',
      dataIndex: 'batchNo',
      key: 'batchNo',
      width: 120,
    },
    {
      title: '产品编码',
      dataIndex: 'productCode',
      key: 'productCode',
      width: 120,
    },
    {
      title: '产品名称',
      dataIndex: 'productName',
      key: 'productName',
      width: 150,
    },
    {
      title: '产品规格',
      dataIndex: 'productSpec',
      key: 'productSpec',
      width: 150,
    },
    {
      title: 'EBR类型',
      dataIndex: 'ebrType',
      key: 'ebrType',
      width: 100,
      render: (type: EbrType) => {
        const typeConfig = EBR_TYPE_MAP[type];
        return <Tag color={typeConfig.color}>{typeConfig.label}</Tag>;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: EbrStatus) => (
        <StatusBadge status={status} statusMap={EBR_STATUS_MAP} />
      ),
    },
    {
      title: '计划数量',
      dataIndex: 'planQty',
      key: 'planQty',
      width: 100,
      align: 'right' as const,
      render: (planQty: number) => planQty?.toLocaleString() || '-',
    },
    {
      title: '实际数量',
      dataIndex: 'actualQty',
      key: 'actualQty',
      width: 100,
      align: 'right' as const,
      render: (actualQty: number) => actualQty?.toLocaleString() || '-',
    },
    {
      title: '计划开始日期',
      dataIndex: 'planStartDate',
      key: 'planStartDate',
      width: 110,
    },
    {
      title: '计划结束日期',
      dataIndex: 'planEndDate',
      key: 'planEndDate',
      width: 110,
    },
    {
      title: '操作',
      key: 'action',
      width: 300,
      fixed: 'right' as const,
      render: (_: any, record: Ebr) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
          >
            详情
          </Button>
          {canUpdate('ebr') && record.status === 'CREATED' && (
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            >
              编辑
            </Button>
          )}
          {canStart('ebr') && record.status === 'CREATED' && (
            <Button
              type="link"
              size="small"
              icon={<PlayCircleOutlined />}
              onClick={() => handleStart(record)}
            >
              开始
            </Button>
          )}
          {canStart('ebr') && record.status === 'IN_PROGRESS' && (
            <Button
              type="link"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => handleComplete(record)}
            >
              完成
            </Button>
          )}
          {canClose('ebr') && (record.status === 'IN_PROGRESS' || record.status === 'COMPLETED') && (
            <Button
              type="link"
              size="small"
              icon={<StopOutlined />}
              onClick={() => handleClose(record)}
            >
              关闭
            </Button>
          )}
          {canCancel('ebr') && record.status === 'CREATED' && (
            <Button
              type="link"
              size="small"
              icon={<StopOutlined />}
              onClick={() => handleCancel(record)}
            >
              取消
            </Button>
          )}
          {canApprove('ebr') && record.status === 'IN_PROGRESS' && (
            <Button
              type="link"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => handleApprove(record)}
            >
              批准
            </Button>
          )}
          {canDelete('ebr') && (
            <Popconfirm
              title="确认删除"
              description={`确定要删除EBR「${record.ebrNo}」吗？`}
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
    <div className="ebr-page" style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
      {/* 统计卡片 */}
      {statistics && (
        <div style={{ background: '#fff', padding: '16px', borderBottom: '1px solid #e8ecf0' }}>
          <Row gutter={16}>
            <Col span={6}>
              <Statistic
                title="EBR总数"
                value={statistics.totalCount}
                valueStyle={{ color: '#1677ff' }}
                prefix={<FileTextOutlined style={{ fontSize: 20 }} />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="已创建"
                value={statistics.createdCount}
                valueStyle={{ color: '#8c8c8c' }}
                prefix={<ClockCircleOutlined style={{ fontSize: 20, color: '#8c8c8c' }} />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="进行中"
                value={statistics.inProgressCount}
                valueStyle={{ color: '#1677ff' }}
                prefix={<PlayCircleOutlined style={{ fontSize: 20, color: '#1677ff' }} />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="已完成"
                value={statistics.completedCount}
                valueStyle={{ color: '#52c41a' }}
                prefix={<CheckCircleOutlined style={{ fontSize: 20, color: '#52c41a' }} />}
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
        title="电子批记录"
        actions={[
          { key: 'add', label: '新增', icon: <PlusOutlined />, type: 'primary', onClick: handleAdd },
          { key: 'refresh', label: '刷新', icon: <ReloadOutlined />, onClick: handleRefresh },
        ]}
        selectedCount={selectedIds.length}
        batchActions={[
          { key: 'start', label: '开始', onClick: handleBatchStart },
          { key: 'complete', label: '完成', onClick: handleBatchComplete },
          { key: 'close', label: '关闭', onClick: handleBatchClose },
          { key: 'export', label: '导出', onClick: handleExport, icon: <ExportOutlined /> },
        ]}
      />

      {/* 数据表格 */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
        <DataTable
          data={ebrs}
          rowKey="id"
          columns={columns}
          loading={loading}
          pagination={pagination}
          paginationState={pagination}
          onPaginationChange={(page, pageSize) => {
            setFilters({ current: page, pageSize });
            loadEbrs();
          }}
          rowSelection={{
            selectedRowKeys: selectedIds,
            onChange: (keys) => setSelectedIds(keys as string[]),
          }}
          scroll={{ x: 1800 }}
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
        title="EBR详情"
        data={currentEbr}
        fields={buildDetailFields()}
        onClose={() => setDetailOpen(false)}
        showActions={true}
        actions={[
          {
            key: 'edit',
            label: '编辑',
            icon: <EditOutlined />,
            onClick: () => {
              setDetailOpen(false);
              handleEdit(currentEbr!);
            },
            disabled: !canUpdate('ebr') || currentEbr!.status !== 'CREATED',
          },
          {
            key: 'export',
            label: '导出',
            icon: <ExportOutlined />,
            onClick: () => {
              setDetailOpen(false);
              handleExport();
            },
          },
        ]}
        width={800}
      />

      {/* 新增/编辑弹窗 */}
      <FormModal
        visible={modalOpen}
        title={currentEbr && currentEbr.id ? '编辑EBR' : '新增EBR'}
        mode={currentEbr && currentEbr.id ? 'edit' : 'create'}
        fields={[
          { name: 'ebrNo', label: 'EBR编号', type: 'input', required: true },
          { name: 'batchNo', label: '批号', type: 'input', required: true },
          { name: 'productCode', label: '产品编码', type: 'input', required: true },
          { name: 'productName', label: '产品名称', type: 'input', required: true },
          { name: 'productSpec', label: '产品规格', type: 'input', required: true },
          {
            name: 'ebrType',
            label: 'EBR类型',
            type: 'select',
            required: true,
            options: Object.entries(EBR_TYPE_MAP).map(([key, value]) => ({
              label: value.label,
              value: key,
            })),
          },
          { name: 'planQty', label: '计划数量', type: 'number', required: true },
          { name: 'planStartDate', label: '计划开始日期', type: 'datePicker', required: true },
          { name: 'planEndDate', label: '计划结束日期', type: 'datePicker' },
          { name: 'remark', label: '备注', type: 'textArea' },
        ]}
        initialValues={currentEbr || {}}
        onSubmit={handleFormSubmit}
        onCancel={() => {
          setModalOpen(false);
          setCurrentEbr(null);
        }}
        loading={formLoading}
        width={700}
      />

      {/* 导出弹窗 */}
      <Modal
        title="导出EBR"
        open={exportModalOpen}
        onCancel={() => setExportModalOpen(false)}
        footer={null}
        width={600}
      >
        <Result
          icon={<ExportOutlined />}
          status="info"
          title="选择导出格式"
          subTitle={`已选择 ${selectedIds.length} 个EBR`}
          extra={
            <Button
              type="link"
              onClick={() => setExportModalOpen(false)}
            >
              取消
            </Button>
          }
        >
          <div style={{ marginTop: '16px', marginBottom: '24px' }}>
            <div style={{ marginBottom: '12px' }}>请选择导出格式:</div>
            <Row gutter={16}>
              <Col span={12}>
                <Card
                  hoverable
                  onClick={() => {
                    message.info('开始导出PDF格式...');
                  }}
                  style={{ textAlign: 'center', cursor: 'pointer' }}
                >
                  <FileTextOutlined style={{ fontSize: '32px', marginBottom: '8px', color: '#1677ff' }} />
                  <div style={{ fontSize: '14px', color: '#666' }}>PDF格式</div>
                </Card>
              </Col>
              <Col span={12}>
                <Card
                  hoverable
                  onClick={() => {
                    message.info('开始导出Excel格式...');
                    setExportModalOpen(false);
                  }}
                  style={{ textAlign: 'center', cursor: 'pointer' }}
                >
                  <PrinterOutlined style={{ fontSize: '32px', marginBottom: '8px', color: '#52c41a' }} />
                  <div style={{ fontSize: '14px', color: '#666' }}>Excel格式</div>
                </Card>
              </Col>
            </Row>
          </div>
          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontSize: '12px', color: '#666' }}>导出说明：</div>
            <div style={{ padding: '12px', background: '#f5f5f5', borderRadius: '4px' }}>
              • 支持PDF和Excel格式导出
            </div>
            </div>
        </Result>
      </Modal>
    </div>
  );
};

export default EbrList;

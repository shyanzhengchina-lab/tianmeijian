/**
 * 工序主数据列表组件
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
import { useOperationStore } from '../store';
import { usePermission } from '../../../../shared/hooks/usePermission';
import type { FormField, DetailField } from '../../../../shared/types/common';
import {
  Operation,
  OpStatus,
  OpCategory,
  OP_STATUS_MAP,
  OP_CATEGORY_MAP,
} from '../types';
import {
  PlusOutlined,
  ReloadOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  StopOutlined,
  CopyOutlined,
  FileTextOutlined,
  ThunderboltOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { Button, Space, Popconfirm, message, Statistic, Row, Col, Tag, Tabs, Table, Modal } from 'antd';
import type { ColumnsType } from 'antd/es/table';

/**
 * 搜索表单字段配置
 */
const SEARCH_FIELDS: FormField[] = [
  { name: 'opCode', label: '工序编码', type: 'input', placeholder: '请输入工序编码' },
  { name: 'opName', label: '工序名称', type: 'input', placeholder: '请输入工序名称' },
  {
    name: 'category',
    label: '工序类别',
    type: 'select',
    options: [
      { label: '全部', value: '' },
      ...Object.entries(OP_CATEGORY_MAP).map(([key, value]) => ({
        label: value.label,
        value: key,
      })),
    ],
  },
  {
    name: 'status',
    label: '状态',
    type: 'select',
    options: [
      { label: '全部', value: '' },
      ...Object.entries(OP_STATUS_MAP).map(([key, value]) => ({
        label: value.label,
        value: key,
      })),
    ],
  },
  { name: 'workCenter', label: '工作中心', type: 'input', placeholder: '请输入工作中心' },
];

/**
 * 表单字段配置（新增/编辑工序）
 */
const OPERATION_FORM_FIELDS: FormField[] = [
  { name: 'opCode', label: '工序编码', type: 'input', required: true },
  { name: 'opName', label: '工序名称', type: 'input', required: true },
  { name: 'opShort', label: '简称', type: 'input', required: true },
  {
    name: 'category',
    label: '工序类别',
    type: 'select',
    required: true,
    options: Object.entries(OP_CATEGORY_MAP).map(([key, value]) => ({
      label: value.label,
      value: key,
    })),
  },
  { name: 'workshop', label: '车间', type: 'input', required: true },
  { name: 'productLine', label: '产线', type: 'input', required: true },
  { name: 'workCenter', label: '工作中心', type: 'input', required: true },
  { name: 'equipType', label: '设备类型', type: 'input', required: true },
  { name: 'stdTimeMin', label: '标准工时(分钟)', type: 'number', required: true },
  { name: 'prepTimeMin', label: '准备工时(分钟)', type: 'number', required: true },
  {
    name: 'hasFirstPiece',
    label: '需要首检',
    type: 'switch',
  },
  {
    name: 'hasLastPiece',
    label: '需要末检',
    type: 'switch',
  },
  {
    name: 'hasPatrol',
    label: '需要巡检',
    type: 'switch',
  },
  { name: 'patrolFreq', label: '巡检频次(件)', type: 'number' },
  {
    name: 'hasCleanup',
    label: '需要清场',
    type: 'switch',
  },
  { name: 'envReq', label: '环境要求', type: 'textArea' },
  { name: 'paramTemplate', label: '技术参数模板', type: 'input' },
  {
    name: 'isBottleneck',
    label: '瓶颈工序',
    type: 'switch',
  },
  {
    name: 'isReportPoint',
    label: '报工点',
    type: 'switch',
  },
  {
    name: 'isQcPoint',
    label: '质检点',
    type: 'switch',
  },
  { name: 'version', label: '版本', type: 'input', required: true },
  { name: 'effectDate', label: '生效日期', type: 'datePicker', required: true },
  { name: 'remark', label: '备注', type: 'textArea' },
];

/**
 * OperationList组件
 * 使用新架构的完整工序列表页面
 * 保持与现有页面完全一致的样式和功能
 */
export const OperationList: React.FC = () => {
  const {
    operations,
    selectedIds,
    currentOperation,
    filters,
    pagination,
    loading,
    error,
    statistics,
    loadOperations,
    loadStatistics,
    createOperation,
    updateOperation,
    deleteOperations,
    activateOperation,
    deactivateOperation,
    obsoleteOperation,
    updateStatus,
    copyOperation,
    setFilters,
    setSelectedIds,
    setCurrentOperation,
    setLoading,
    setError,
  } = useOperationStore();

  const { canCreate, canUpdate, canDelete, canActivate } = usePermission('operation');

  const [modalOpen, setModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  /**
   * 初始化加载数据
   */
  useEffect(() => {
    loadOperations();
    loadStatistics();
  }, []);

  /**
   * 搜索处理
   */
  const handleSearch = (values: any) => {
    setFilters(values);
    loadOperations();
  };

  /**
   * 重置处理
   */
  const handleReset = () => {
    setFilters({});
    loadOperations();
  };

  /**
   * 新增工序
   */
  const handleAdd = () => {
    setCurrentOperation({} as Operation); // 空对象表示新增模式
    setModalOpen(true);
  };

  /**
   * 编辑工序
   */
  const handleEdit = (operation: Operation) => {
    setCurrentOperation(operation);
    setModalOpen(true);
  };

  /**
   * 查看详情
   */
  const handleView = (operation: Operation) => {
    setCurrentOperation(operation);
    setDetailOpen(true);
  };

  /**
   * 删除工序
   */
  const handleDelete = async (ids: string[]) => {
    try {
      await deleteOperations(ids);
      message.success(`成功删除 ${ids.length} 个工序`);
    } catch (error) {
      console.error('删除工序失败:', error);
    }
  };

  /**
   * 生效工序
   */
  const handleActivate = async (operation: Operation) => {
    try {
      await activateOperation(operation.id);
      message.success(`工序 ${operation.opName} 生效成功`);
    } catch (error) {
      console.error('生效工序失败:', error);
    }
  };

  /**
   * 停用工序
   */
  const handleDeactivate = async (operation: Operation) => {
    try {
      await deactivateOperation(operation.id);
      message.success(`工序 ${operation.opName} 停用成功`);
    } catch (error) {
      console.error('停用工序失败:', error);
    }
  };

  /**
   * 作废工序
   */
  const handleObsolete = async (operation: Operation) => {
    try {
      await obsoleteOperation(operation.id);
      message.success(`工序 ${operation.opName} 作废成功`);
    } catch (error) {
      console.error('作废工序失败:', error);
    }
  };

  /**
   * 批量生效
   */
  const handleBatchActivate = async () => {
    if (selectedIds.length === 0) {
      message.warning('请先选择工序');
      return;
    }

    Modal.confirm({
      title: '确认批量生效',
      content: `您确定要生效选中的 ${selectedIds.length} 个工序吗？生效后这些工序将可用于生产。`,
      okText: '确定生效',
      cancelText: '取消',
      centered: true,
      onOk: async () => {
        try {
          await updateStatus(selectedIds, 'ACTIVE');
          message.success(`成功生效 ${selectedIds.length} 个工序`);
          setSelectedIds([]);
        } catch (error) {
          console.error('批量生效失败:', error);
        }
      },
    });
  };

  /**
   * 批量停用
   */
  const handleBatchDeactivate = async () => {
    if (selectedIds.length === 0) {
      message.warning('请先选择工序');
      return;
    }

    Modal.confirm({
      title: '确认批量停用',
      content: `您确定要停用选中的 ${selectedIds.length} 个工序吗？停用后这些工序将无法用于生产。`,
      okText: '确定停用',
      okType: 'danger',
      cancelText: '取消',
      centered: true,
      onOk: async () => {
        try {
          await updateStatus(selectedIds, 'DISABLED');
          message.success(`成功停用 ${selectedIds.length} 个工序`);
          setSelectedIds([]);
        } catch (error) {
          console.error('批量停用失败:', error);
        }
      },
    });
  };

  /**
   * 复制工序
   */
  const handleCopy = async (operation: Operation) => {
    try {
      await copyOperation(operation.id);
      message.success(`工序 ${operation.opName} 复制成功`);
    } catch (error) {
      console.error('复制工序失败:', error);
    }
  };

  /**
   * 刷新列表
   */
  const handleRefresh = () => {
    loadOperations();
    loadStatistics();
  };

  /**
   * 表单提交处理
   */
  const handleFormSubmit = async (values: any) => {
    setFormLoading(true);
    try {
      if (currentOperation && currentOperation.id) {
        // 编辑模式
        await updateOperation({ ...values, id: currentOperation.id });
        message.success('工序更新成功');
      } else {
        // 新增模式 — routingStepId 为可选（DB 已改为 NULL DEFAULT NULL）
        await createOperation({ routingStepId: null, ...values, phases: [] });
        message.success('工序创建成功');
      }
      setModalOpen(false);
      await loadOperations();
    } catch (error: any) {
      console.error('表单提交失败:', error);
    } finally {
      setFormLoading(false);
    }
  };

  /**
   * 构建详情字段
   */
  const buildDetailFields = (): DetailField[] => {
    if (!currentOperation) return [];

    const categoryConfig = OP_CATEGORY_MAP[currentOperation.category] ?? { label: currentOperation.category, color: 'default' };
    const statusConfig = OP_STATUS_MAP[currentOperation.status];

    return [
      { label: '工序编码', value: currentOperation.opCode },
      { label: '工序名称', value: currentOperation.opName },
      { label: '简称', value: currentOperation.opShort },
      { label: '工序类别', value: categoryConfig.label, type: 'tag' as const, options: [categoryConfig] },
      { label: '车间', value: currentOperation.workshop },
      { label: '产线', value: currentOperation.productLine },
      { label: '工作中心', value: currentOperation.workCenter },
      { label: '设备类型', value: currentOperation.equipType },
      { label: '标准工时', value: `${currentOperation.stdTimeMin} 分钟` },
      { label: '准备工时', value: `${currentOperation.prepTimeMin} 分钟` },
      { label: '需要首检', value: currentOperation.hasFirstPiece ? '是' : '否' },
      { label: '需要末检', value: currentOperation.hasLastPiece ? '是' : '否' },
      { label: '需要巡检', value: currentOperation.hasPatrol ? '是' : '否' },
      { label: '巡检频次', value: currentOperation.patrolFreq ? `每${currentOperation.patrolFreq}件` : '—' },
      { label: '需要清场', value: currentOperation.hasCleanup ? '是' : '否' },
      { label: '环境要求', value: currentOperation.envReq || '—' },
      { label: '技术参数模板', value: currentOperation.paramTemplate || '—' },
      { label: '瓶颈工序', value: currentOperation.isBottleneck ? '是' : '否' },
      { label: '报工点', value: currentOperation.isReportPoint ? '是' : '否' },
      { label: '质检点', value: currentOperation.isQcPoint ? '是' : '否' },
      { label: '版本', value: currentOperation.version },
      { label: '生效日期', value: currentOperation.effectDate },
      { label: '状态', value: statusConfig.label, type: 'tag' as const, options: [statusConfig] },
      { label: '创建人', value: currentOperation.createdBy },
      { label: '更新时间', value: currentOperation.updatedAt },
      { label: '备注', value: currentOperation.remark || '—' },
    ];
  };

  /**
   * 表格列定义
   */
  const columns: ColumnsType<Operation> = [
    {
      title: '工序编码',
      dataIndex: 'opCode',
      key: 'opCode',
      width: 130,
      fixed: 'left' as const,
    },
    {
      title: '工序名称',
      dataIndex: 'opName',
      key: 'opName',
      width: 150,
    },
    {
      title: '简称',
      dataIndex: 'opShort',
      key: 'opShort',
      width: 80,
    },
    {
      title: '工序类别',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: (category: OpCategory) => {
        const categoryConfig = OP_CATEGORY_MAP[category] ?? { label: category ?? '-', color: 'default' };
        return (
          <Tag color={categoryConfig.color}>
            {categoryConfig.label}
          </Tag>
        );
      },
    },
    {
      title: '工作中心',
      dataIndex: 'workCenter',
      key: 'workCenter',
      width: 130,
    },
    {
      title: '设备类型',
      dataIndex: 'equipType',
      key: 'equipType',
      width: 120,
    },
    {
      title: '标准工时',
      dataIndex: 'stdTimeMin',
      key: 'stdTimeMin',
      width: 100,
      render: (time: number) => `${time} 分钟`,
    },
    {
      title: '瓶颈',
      dataIndex: 'isBottleneck',
      key: 'isBottleneck',
      width: 80,
      align: 'center' as const,
      render: (isBottleneck: boolean) => (
        isBottleneck ? <ThunderboltOutlined style={{ color: '#faad14' }} /> : '—'
      ),
    },
    {
      title: '质检点',
      dataIndex: 'isQcPoint',
      key: 'isQcPoint',
      width: 80,
      align: 'center' as const,
      render: (isQcPoint: boolean) => (
        isQcPoint ? <SafetyCertificateOutlined style={{ color: '#52c41a' }} /> : '—'
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: OpStatus) => (
        <StatusBadge status={status} statusMap={OP_STATUS_MAP} />
      ),
    },
    {
      title: '版本',
      dataIndex: 'version',
      key: 'version',
      width: 80,
    },
    {
      title: '操作',
      key: 'action',
      width: 320,
      fixed: 'right' as const,
      render: (_: any, record: Operation) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
          >
            查看
          </Button>
          {canUpdate('operation') && record.status === 'DRAFT' && (
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            >
              编辑
            </Button>
          )}
          {canActivate('operation') && record.status === 'DRAFT' && (
            <Button
              type="link"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => handleActivate(record)}
            >
              生效
            </Button>
          )}
          {canActivate('operation') && record.status === 'ACTIVE' && (
            <Button
              type="link"
              size="small"
              icon={<StopOutlined />}
              onClick={() => handleDeactivate(record)}
            >
              停用
            </Button>
          )}
          {canActivate('operation') && record.status === 'ACTIVE' && (
            <Button
              type="link"
              size="small"
              icon={<StopOutlined />}
              onClick={() => handleObsolete(record)}
            >
              作废
            </Button>
          )}
          <Button
            type="link"
            size="small"
            icon={<CopyOutlined />}
            onClick={() => handleCopy(record)}
          >
            复制
          </Button>
          {canDelete('operation') && record.status === 'DRAFT' && (
            <Popconfirm
              title="确认删除"
              description={`确定要删除工序「${record.opName}」吗？`}
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
    <div className="operation-page" style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
      {/* 统计卡片 */}
      {statistics && (
        <div style={{ background: '#fff', padding: '16px', borderBottom: '1px solid #e8ecf0' }}>
          <Row gutter={16}>
            <Col span={4}>
              <Statistic
                title="工序总数"
                value={statistics.totalCount}
                valueStyle={{ color: '#1677ff' }}
                prefix={<FileTextOutlined style={{ fontSize: 20 }} />}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title="草稿"
                value={statistics.draftCount}
                valueStyle={{ color: '#8c8c8c' }}
                prefix={<FileTextOutlined style={{ fontSize: 20, color: '#8c8c8c' }} />}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title="已生效"
                value={statistics.activeCount}
                valueStyle={{ color: '#52c41a' }}
                prefix={<CheckCircleOutlined style={{ fontSize: 20, color: '#52c41a' }} />}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title="已停用"
                value={statistics.disabledCount}
                valueStyle={{ color: '#cf1322' }}
                prefix={<StopOutlined style={{ fontSize: 20, color: '#cf1322' }} />}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title="瓶颈工序"
                value={statistics.bottleneckCount}
                valueStyle={{ color: '#faad14' }}
                prefix={<ThunderboltOutlined style={{ fontSize: 20, color: '#faad14' }} />}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title="质检点"
                value={statistics.qcPointCount}
                valueStyle={{ color: '#52c41a' }}
                prefix={<SafetyCertificateOutlined style={{ fontSize: 20, color: '#52c41a' }} />}
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
        title="工序主数据"
        actions={[
          { key: 'add', label: '新增', icon: <PlusOutlined />, type: 'primary', onClick: handleAdd },
          { key: 'refresh', label: '刷新', icon: <ReloadOutlined />, onClick: handleRefresh },
        ]}
        selectedCount={selectedIds.length}
        batchActions={[
          { key: 'activate', label: '生效', onClick: handleBatchActivate },
          { key: 'deactivate', label: '停用', onClick: handleBatchDeactivate, danger: true },
        ]}
      />

      {/* 数据表格 */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
        <DataTable
          data={operations}
          rowKey="id"
          columns={columns}
          loading={loading}
          pagination={pagination}
          paginationState={pagination}
          onPaginationChange={(page, pageSize) => {
            setFilters({ current: page, pageSize });
            loadOperations();
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

      {/* 新增/编辑弹窗 */}
      <FormModal
        visible={modalOpen}
        title={currentOperation && currentOperation.id ? '编辑工序' : '新增工序'}
        mode={currentOperation && currentOperation.id ? 'edit' : 'create'}
        fields={OPERATION_FORM_FIELDS}
        initialValues={currentOperation || {}}
        onSubmit={handleFormSubmit}
        onCancel={() => {
          setModalOpen(false);
          setCurrentOperation(null);
        }}
        loading={formLoading}
        width={900}
      />

      {/* 详情抽屉 */}
      <DetailDrawer
        visible={detailOpen}
        title="工序主数据详情"
        data={currentOperation}
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
              handleEdit(currentOperation!);
            },
            disabled: !canUpdate('operation') || currentOperation?.status !== 'DRAFT',
          },
          {
            key: 'copy',
            label: '复制',
            icon: <CopyOutlined />,
            onClick: () => {
              handleCopy(currentOperation!);
            },
          },
        ]}
        width={900}
        extra={
          currentOperation && currentOperation.phases && currentOperation.phases.length > 0 && (
            <Tabs
              defaultActiveKey="phases"
              items={[
                {
                  key: 'phases',
                  label: `工序阶段 (${currentOperation.phases.length})`,
                },
              ]}
            >
              <div style={{ padding: '12px' }}>
                <Table
                  size="small"
                  dataSource={currentOperation.phases}
                  columns={[
                    { title: '序号', dataIndex: 'seq', width: 60, align: 'center' as const },
                    { title: '阶段编码', dataIndex: 'phaseCode', width: 120 },
                    { title: '阶段名称', dataIndex: 'phaseName', width: 120 },
                    { title: '字段数', dataIndex: 'fields', width: 80, render: (fields: any[]) => fields.length },
                    { title: '电子签名', dataIndex: 'eSign', width: 80, align: 'center' as const, render: (eSign: boolean) => eSign ? '是' : '否' },
                    { title: '双人复核', dataIndex: 'dualReview', width: 80, align: 'center' as const, render: (dualReview: boolean) => dualReview ? '是' : '否' },
                    { title: '备注', dataIndex: 'remark', width: 200, ellipsis: true },
                  ]}
                  rowKey="phaseCode"
                  pagination={false}
                  bordered
                />
              </div>
            </Tabs>
          )
        }
      />
    </div>
  );
};

export default OperationList;

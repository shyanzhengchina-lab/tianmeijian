/**
 * 质检方案列表组件
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
import { useQcSchemeStore } from '../store';
import { usePermission } from '../../../../shared/hooks/usePermission';
import type { FormField, DetailField } from '../../../../shared/types/common';
import {
  QcScheme,
  QcSchemeStatus,
  QcSchemeType,
  QC_SCHEME_STATUS_MAP,
  QC_SCHEME_TYPE_MAP,
  QC_SAMPLING_TYPE_MAP,
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
  AuditOutlined,
  FileTextOutlined,
  ExperimentOutlined,
} from '@ant-design/icons';
import { Button, Space, Popconfirm, message, Statistic, Row, Col, Tag, Tabs, Table, Modal } from 'antd';
import type { ColumnsType } from 'antd/es/table';

/**
 * 搜索表单字段配置
 */
const SEARCH_FIELDS: FormField[] = [
  { name: 'schemeCode', label: '方案编码', type: 'input', placeholder: '请输入方案编码' },
  { name: 'schemeName', label: '方案名称', type: 'input', placeholder: '请输入方案名称' },
  {
    name: 'schemeType',
    label: '检验类型',
    type: 'select',
    options: [
      { label: '全部', value: '' },
      ...Object.entries(QC_SCHEME_TYPE_MAP).map(([key, value]) => ({
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
      ...Object.entries(QC_SCHEME_STATUS_MAP).map(([key, value]) => ({
        label: value.label,
        value: key,
      })),
    ],
  },
];

/**
 * 表单字段配置（新增/编辑质检方案）
 */
const QC_SCHEME_FORM_FIELDS: FormField[] = [
  { name: 'schemeCode', label: '方案编码', type: 'input', required: true },
  { name: 'schemeName', label: '方案名称', type: 'input', required: true },
  {
    name: 'schemeType',
    label: '检验类型',
    type: 'select',
    required: true,
    options: Object.entries(QC_SCHEME_TYPE_MAP).map(([key, value]) => ({
      label: value.label,
      value: key,
    })),
  },
  { name: 'productModel', label: '适用产品型号', type: 'input' },
  { name: 'materialCode', label: '适用物料编码', type: 'input' },
  { name: 'operationCode', label: '适用工序编码', type: 'input' },
  { name: 'operationSeq', label: '工序序号', type: 'number' },
  {
    name: 'samplingType',
    label: '抽样规则',
    type: 'select',
    required: true,
    options: Object.entries(QC_SAMPLING_TYPE_MAP).map(([key, value]) => ({
      label: value.label,
      value: key,
    })),
  },
  { name: 'aqlLevel', label: 'AQL水平', type: 'input' },
  { name: 'sampleSize', label: '固定样本量', type: 'number' },
  { name: 'samplePercent', label: '百分比(%)', type: 'number' },
  {
    name: 'status',
    label: '状态',
    type: 'select',
    required: true,
    options: Object.entries(QC_SCHEME_STATUS_MAP).map(([key, value]) => ({
      label: value.label,
      value: key,
    })),
  },
  { name: 'version', label: '版本', type: 'input', required: true },
  { name: 'effectiveDate', label: '生效日期', type: 'datePicker', required: true },
  { name: 'expiryDate', label: '失效日期', type: 'datePicker' },
  { name: 'remark', label: '备注', type: 'textArea' },
];

/**
 * QcSchemeList组件
 * 使用新架构的完整质检方案列表页面
 * 保持与现有页面完全一致的样式和功能
 */
export const QcSchemeList: React.FC = () => {
  const {
    qcSchemes,
    selectedIds,
    currentQcScheme,
    filters,
    pagination,
    loading,
    error,
    statistics,
    loadQcSchemes,
    loadStatistics,
    createQcScheme,
    updateQcScheme,
    deleteQcSchemes,
    activateQcScheme,
    deactivateQcScheme,
    approveQcScheme,
    updateStatus,
    copyQcScheme,
    setFilters,
    setSelectedIds,
    setCurrentQcScheme,
    setLoading,
    setError,
  } = useQcSchemeStore();

  const { canCreate, canUpdate, canDelete, canApprove } = usePermission('qc-scheme');

  const [modalOpen, setModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  /**
   * 初始化加载数据
   */
  useEffect(() => {
    loadQcSchemes();
    loadStatistics();
  }, []);

  /**
   * 搜索处理
   */
  const handleSearch = (values: any) => {
    setFilters(values);
    loadQcSchemes();
  };

  /**
   * 重置处理
   */
  const handleReset = () => {
    setFilters({});
    loadQcSchemes();
  };

  /**
   * 新增质检方案
   */
  const handleAdd = () => {
    setCurrentQcScheme({} as QcScheme); // 空对象表示新增模式
    setModalOpen(true);
  };

  /**
   * 编辑质检方案
   */
  const handleEdit = (qcScheme: QcScheme) => {
    setCurrentQcScheme(qcScheme);
    setModalOpen(true);
  };

  /**
   * 查看详情
   */
  const handleView = (qcScheme: QcScheme) => {
    setCurrentQcScheme(qcScheme);
    setDetailOpen(true);
  };

  /**
   * 删除质检方案
   */
  const handleDelete = async (ids: string[]) => {
    try {
      await deleteQcSchemes(ids);
      message.success(`成功删除 ${ids.length} 个质检方案`);
    } catch (error) {
      console.error('删除质检方案失败:', error);
    }
  };

  /**
   * 启用质检方案
   */
  const handleActivate = async (qcScheme: QcScheme) => {
    try {
      await activateQcScheme(qcScheme.id);
      message.success(`质检方案 ${qcScheme.schemeName} 启用成功`);
    } catch (error) {
      console.error('启用质检方案失败:', error);
    }
  };

  /**
   * 停用质检方案
   */
  const handleDeactivate = async (qcScheme: QcScheme) => {
    try {
      await deactivateQcScheme(qcScheme.id);
      message.success(`质检方案 ${qcScheme.schemeName} 停用成功`);
    } catch (error) {
      console.error('停用质检方案失败:', error);
    }
  };

  /**
   * 批准质检方案
   */
  const handleApprove = async (qcScheme: QcScheme) => {
    try {
      await approveQcScheme(qcScheme.id, '当前用户');
      message.success(`质检方案 ${qcScheme.schemeName} 批准成功`);
    } catch (error) {
      console.error('批准质检方案失败:', error);
    }
  };

  /**
   * 批量启用
   */
  const handleBatchActivate = async () => {
    if (selectedIds.length === 0) {
      message.warning('请先选择质检方案');
      return;
    }

    Modal.confirm({
      title: '确认批量启用',
      content: `您确定要启用选中的 ${selectedIds.length} 个质检方案吗？`,
      okText: '确定启用',
      cancelText: '取消',
      centered: true,
      onOk: async () => {
        try {
          await updateStatus(selectedIds, 'ACTIVE');
          message.success(`成功启用 ${selectedIds.length} 个质检方案`);
          setSelectedIds([]);
        } catch (error) {
          console.error('批量启用失败:', error);
        }
      },
    });
  };

  /**
   * 批量停用
   */
  const handleBatchDeactivate = async () => {
    if (selectedIds.length === 0) {
      message.warning('请先选择质检方案');
      return;
    }

    Modal.confirm({
      title: '确认批量停用',
      content: `您确定要停用选中的 ${selectedIds.length} 个质检方案吗？停用后这些方案将无法使用。`,
      okText: '确定停用',
      okType: 'danger',
      cancelText: '取消',
      centered: true,
      onOk: async () => {
        try {
          await updateStatus(selectedIds, 'INACTIVE');
          message.success(`成功停用 ${selectedIds.length} 个质检方案`);
          setSelectedIds([]);
        } catch (error) {
          console.error('批量停用失败:', error);
        }
      },
    });
  };

  /**
   * 复制质检方案
   */
  const handleCopy = async (qcScheme: QcScheme) => {
    try {
      const newSchemeCode = `${qcScheme.schemeCode}-COPY`;
      await copyQcScheme(qcScheme.id, newSchemeCode);
      message.success(`质检方案 ${qcScheme.schemeName} 复制成功`);
    } catch (error) {
      console.error('复制质检方案失败:', error);
    }
  };

  /**
   * 刷新列表
   */
  const handleRefresh = () => {
    loadQcSchemes();
    loadStatistics();
  };

  /**
   * 表单提交处理
   */
  const handleFormSubmit = async (values: any) => {
    setFormLoading(true);
    // Convert string status to Integer for backend
    const statusIntMap: Record<string, number> = { DRAFT: 0, ACTIVE: 1, INACTIVE: 2 };
    const backendValues = {
      ...values,
      status: statusIntMap[values.status] ?? 1,
    };
    try {
      if (currentQcScheme && currentQcScheme.id) {
        // 编辑模式
        await updateQcScheme({ ...backendValues, id: currentQcScheme.id });
        message.success('质检方案更新成功');
      } else {
        // 新增模式
        await createQcScheme({ ...backendValues, items: [] });
        message.success('质检方案创建成功');
      }
      setModalOpen(false);
      await loadQcSchemes();
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
    if (!currentQcScheme) return [];

    const typeConfig = (QC_SCHEME_TYPE_MAP as any)[currentQcScheme.schemeType];
    const statusConfig = QC_SCHEME_STATUS_MAP[currentQcScheme.status];

    return [
      { label: '方案编码', value: currentQcScheme.schemeCode },
      { label: '方案名称', value: currentQcScheme.schemeName },
      { label: '检验类型', value: typeConfig.label, type: 'tag' as const, options: [typeConfig] },
      { label: '适用产品型号', value: currentQcScheme.productModel || '—' },
      { label: '适用物料编码', value: currentQcScheme.materialCode || '—' },
      { label: '适用工序编码', value: currentQcScheme.operationCode || '—' },
      { label: '适用工序序号', value: currentQcScheme.operationSeq ? `${currentQcScheme.operationSeq}` : '—' },
      { label: '检验项数量', value: currentQcScheme.items.length ? `${currentQcScheme.items.length} 项` : '—' },
      { label: '状态', value: statusConfig.label, type: 'tag' as const, options: [statusConfig] },
      { label: '版本', value: currentQcScheme.version },
      { label: '生效日期', value: currentQcScheme.effectiveDate },
      { label: '失效日期', value: currentQcScheme.expiryDate || '—' },
      { label: '批准人', value: currentQcScheme.approvedBy || '—' },
      { label: '备注', value: currentQcScheme.remark || '—' },
    ];
  };

  /**
   * 表格列定义
   */
  const columns: ColumnsType<QcScheme> = [
    {
      title: '方案编码',
      dataIndex: 'schemeCode',
      key: 'schemeCode',
      width: 150,
      fixed: 'left' as const,
    },
    {
      title: '方案名称',
      dataIndex: 'schemeName',
      key: 'schemeName',
      width: 200,
    },
    {
      title: '检验类型',
      dataIndex: 'schemeType',
      key: 'schemeType',
      width: 120,
      render: (type: QcSchemeType) => {
        const typeConfig = (QC_SCHEME_TYPE_MAP as any)[type];
        return (
          <Tag color={typeConfig.color}>
            {typeConfig.label}
          </Tag>
        );
      },
    },
    {
      title: '适用对象',
      key: 'applicable',
      width: 200,
      render: (_: any, record: QcScheme) => {
        const parts = [];
        if (record.productModel) parts.push(`产品: ${record.productModel}`);
        if (record.materialCode) parts.push(`物料: ${record.materialCode}`);
        if (record.operationCode) parts.push(`工序: ${record.operationCode}`);
        return parts.join(' | ');
      },
    },
    {
      title: '检验项数',
      dataIndex: 'items',
      key: 'items',
      width: 100,
      align: 'center' as const,
      render: (items: any[]) => `${items.length} 项`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: QcSchemeStatus) => (
        <StatusBadge status={status} statusMap={QC_SCHEME_STATUS_MAP} />
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
      width: 300,
      fixed: 'right' as const,
      render: (_: any, record: QcScheme) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
          >
            查看
          </Button>
          {canUpdate('qc-scheme') && (
            <>
              {record.status === 'INACTIVE' && (
                <Button
                  type="link"
                  size="small"
                  icon={<CheckCircleOutlined />}
                  onClick={() => handleActivate(record)}
                >
                  启用
                </Button>
              )}
              {record.status === 'ACTIVE' && (
                <Button
                  type="link"
                  size="small"
                  icon={<StopOutlined />}
                  onClick={() => handleDeactivate(record)}
                >
                  停用
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
            </>
          )}
          {canApprove('qc-scheme') && record.status === 'DRAFT' && (
            <Button
              type="link"
              size="small"
              icon={<AuditOutlined />}
              onClick={() => handleApprove(record)}
            >
              批准
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
          {canDelete('qc-scheme') && record.status === 'DRAFT' && (
            <Popconfirm
              title="确认删除"
              description={`确定要删除质检方案「${record.schemeName}」吗？`}
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

  /**
   * 检验项列表列定义
   */
  const itemColumns: ColumnsType<any> = [
    { title: '序号', dataIndex: 'seqNo', width: 60, align: 'center' as const },
    { title: '项目编码', dataIndex: 'itemCode', width: 120 },
    { title: '项目名称', dataIndex: 'itemName', width: 150 },
    {
      title: '标准值',
      dataIndex: 'standardValue',
      width: 150,
      render: (value: string, record: any) => {
        if (record.minValue !== undefined && record.maxValue !== undefined) {
          return `${record.minValue}~${record.maxValue}`;
        }
        return value || '—';
      },
    },
    { title: '单位', dataIndex: 'unit', width: 80 },
    { title: '关键项', dataIndex: 'isCritical', width: 80, align: 'center' as const, render: (isCritical: boolean) => isCritical ? '是' : '否' },
    { title: '必检项', dataIndex: 'isRequired', width: 80, align: 'center' as const, render: (isRequired: boolean) => isRequired ? '是' : '否' },
    { title: '启用', dataIndex: 'enabled', width: 80, align: 'center' as const, render: (enabled: boolean) => enabled ? '是' : '否' },
  ];

  return (
    <div className="qc-scheme-page" style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
      {/* 统计卡片 */}
      {statistics && (
        <div style={{ background: '#fff', padding: '16px', borderBottom: '1px solid #e8ecf0' }}>
          <Row gutter={16}>
            <Col span={4}>
              <Statistic
                title="方案总数"
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
                prefix={<ExperimentOutlined style={{ fontSize: 20, color: '#8c8c8c' }} />}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title="已启用"
                value={statistics.activeCount}
                valueStyle={{ color: '#52c41a' }}
                prefix={<CheckCircleOutlined style={{ fontSize: 20, color: '#52c41a' }} />}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title="已停用"
                value={statistics.inactiveCount}
                valueStyle={{ color: '#d9d9d9' }}
                prefix={<StopOutlined style={{ fontSize: 20, color: '#d9d9d9' }} />}
              />
            </Col>
            <Col span={8}>
              <div style={{ fontSize: 14, color: '#64748b', textAlign: 'center', paddingTop: 10 }}>
                检验类型分布:
                {Object.entries(statistics.typeStats).map(([type, count]) => (
                  <Tag key={type} style={{ marginLeft: 4 }}>{(QC_SCHEME_TYPE_MAP as any)[type]?.label}: {count}</Tag>
                ))}
              </div>
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
        title="质检方案档案"
        actions={[
          { key: 'add', label: '新增', icon: <PlusOutlined />, type: 'primary', onClick: handleAdd },
          { key: 'refresh', label: '刷新', icon: <ReloadOutlined />, onClick: handleRefresh },
        ]}
        selectedCount={selectedIds.length}
        batchActions={[
          { key: 'activate', label: '启用', onClick: handleBatchActivate },
          { key: 'deactivate', label: '停用', onClick: handleBatchDeactivate, danger: true },
        ]}
      />

      {/* 数据表格 */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
        <DataTable
          data={qcSchemes}
          rowKey="id"
          columns={columns}
          loading={loading}
          pagination={pagination}
          paginationState={pagination}
          onPaginationChange={(page, pageSize) => {
            setFilters({ current: page, pageSize });
            loadQcSchemes();
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
        title={currentQcScheme && currentQcScheme.id ? '编辑质检方案' : '新增质检方案'}
        mode={currentQcScheme && currentQcScheme.id ? 'edit' : 'create'}
        fields={QC_SCHEME_FORM_FIELDS}
        initialValues={currentQcScheme || {}}
        onSubmit={handleFormSubmit}
        onCancel={() => {
          setModalOpen(false);
          setCurrentQcScheme(null);
        }}
        loading={formLoading}
        width={900}
      />

      {/* 详情抽屉 */}
      <DetailDrawer
        visible={detailOpen}
        title="质检方案详情"
        data={currentQcScheme}
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
              handleEdit(currentQcScheme!);
            },
            disabled: !canUpdate('qc-scheme'),
          },
          {
            key: 'copy',
            label: '复制',
            icon: <CopyOutlined />,
            onClick: () => {
              handleCopy(currentQcScheme!);
            },
          },
        ]}
        width={800}
        extra={
          currentQcScheme && (
            <Tabs
              defaultActiveKey="items"
              items={[
                {
                  key: 'items',
                  label: `检验项 (${currentQcScheme.items.length})`,
                },
              ]}
            >
              <div style={{ padding: '12px' }}>
                <Table
                  size="small"
                  dataSource={currentQcScheme.items}
                  columns={itemColumns}
                  rowKey="seqNo"
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

export default QcSchemeList;

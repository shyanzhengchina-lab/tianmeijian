/**
 * 质检项目列表组件
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
import { useQcItemStore } from '../store';
import { usePermission } from '../../../../shared/hooks/usePermission';
import type { FormField, DetailField } from '../../../../shared/types/common';
import {
  QcItem,
  QcItemStatus,
  QcItemCategory,
  QcStandardType,
  QC_ITEM_STATUS_MAP,
  QC_ITEM_CATEGORY_MAP,
  QC_STANDARD_TYPE_MAP,
  QC_APPLY_TYPE_MAP,
  INSTRUMENT_OPTIONS,
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
  ExperimentOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { Button, Space, Popconfirm, message, Statistic, Row, Col, Tag, Checkbox, Modal } from 'antd';
import type { ColumnsType } from 'antd/es/table';

/**
 * 搜索表单字段配置
 */
const SEARCH_FIELDS: FormField[] = [
  { name: 'itemCode', label: '项目编码', type: 'input', placeholder: '请输入项目编码' },
  { name: 'itemName', label: '项目名称', type: 'input', placeholder: '请输入项目名称' },
  {
    name: 'category',
    label: '大类',
    type: 'select',
    options: [
      { label: '全部', value: '' },
      ...Object.entries(QC_ITEM_CATEGORY_MAP).map(([key, value]) => ({
        label: value.label,
        value: key,
      })),
    ],
  },
  {
    name: 'standardType',
    label: '标准值类型',
    type: 'select',
    options: [
      { label: '全部', value: '' },
      ...Object.entries(QC_STANDARD_TYPE_MAP).map(([key, value]) => ({
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
      ...Object.entries(QC_ITEM_STATUS_MAP).map(([key, value]) => ({
        label: value.label,
        value: key,
      })),
    ],
  },
  {
    name: 'applyType',
    label: '检验类型',
    type: 'select',
    options: [
      { label: '全部', value: '' },
      ...Object.entries(QC_APPLY_TYPE_MAP).map(([key, value]) => ({
        label: value.label,
        value: key,
      })),
    ],
  },
];

/**
 * 表单字段配置（新增/编辑质检项目）
 */
const QC_ITEM_FORM_FIELDS: FormField[] = [
  { name: 'itemCode', label: '项目编码', type: 'input', required: true },
  { name: 'itemName', label: '项目名称', type: 'input', required: true },
  {
    name: 'category',
    label: '大类',
    type: 'select',
    required: true,
    options: Object.entries(QC_ITEM_CATEGORY_MAP).map(([key, value]) => ({
      label: value.label,
      value: key,
    })),
  },
  {
    name: 'standardType',
    label: '标准值类型',
    type: 'select',
    required: true,
    options: Object.entries(QC_STANDARD_TYPE_MAP).map(([key, value]) => ({
      label: value.label,
      value: key,
    })),
  },
  { name: 'standardValue', label: '标准值描述', type: 'input' },
  { name: 'minValue', label: '下限值', type: 'number' },
  { name: 'maxValue', label: '上限值', type: 'number' },
  { name: 'unit', label: '单位', type: 'input' },
  { name: 'instrumentType', label: '量具', type: 'select', options: INSTRUMENT_OPTIONS.map(inst => ({ label: inst, value: inst })) },
  {
    name: 'isCritical',
    label: '关键项',
    type: 'switch',
  },
  {
    name: 'isRequired',
    label: '必检项',
    type: 'switch',
  },
  {
    name: 'applyTypes',
    label: '适用检验类型',
    type: 'select',
    mode: 'multiple',
    options: Object.entries(QC_APPLY_TYPE_MAP).map(([key, value]) => ({
      label: value.label,
      value: key,
    })),
  },
  { name: 'refStandard', label: '引用标准', type: 'input' },
  {
    name: 'status',
    label: '状态',
    type: 'select',
    required: true,
    options: Object.entries(QC_ITEM_STATUS_MAP).map(([key, value]) => ({
      label: value.label,
      value: key,
    })),
  },
  { name: 'version', label: '版本', type: 'input' },
  { name: 'remark', label: '备注', type: 'textArea' },
];

/**
 * QcItemList组件
 * 使用新架构的完整质检项目列表页面
 * 保持与现有页面完全一致的样式和功能
 */
export const QcItemList: React.FC = () => {
  const {
    qcItems,
    selectedIds,
    currentQcItem,
    filters,
    pagination,
    loading,
    error,
    statistics,
    loadQcItems,
    loadStatistics,
    createQcItem,
    updateQcItem,
    deleteQcItems,
    activateQcItem,
    deactivateQcItem,
    updateStatus,
    copyQcItem,
    setFilters,
    setSelectedIds,
    setCurrentQcItem,
    setLoading,
    setError,
  } = useQcItemStore();

  const { canCreate, canUpdate, canDelete } = usePermission('qc-item');

  const [modalOpen, setModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  /**
   * 初始化加载数据
   */
  useEffect(() => {
    loadQcItems();
    loadStatistics();
  }, []);

  /**
   * 搜索处理
   */
  const handleSearch = (values: any) => {
    setFilters(values);
    loadQcItems();
  };

  /**
   * 重置处理
   */
  const handleReset = () => {
    setFilters({});
    loadQcItems();
  };

  /**
   * 新增质检项目
   */
  const handleAdd = () => {
    setCurrentQcItem({} as QcItem); // 空对象表示新增模式
    setModalOpen(true);
  };

  /**
   * 编辑质检项目
   */
  const handleEdit = (qcItem: QcItem) => {
    setCurrentQcItem(qcItem);
    setModalOpen(true);
  };

  /**
   * 查看详情
   */
  const handleView = (qcItem: QcItem) => {
    setCurrentQcItem(qcItem);
    setDetailOpen(true);
  };

  /**
   * 删除质检项目
   */
  const handleDelete = async (ids: string[]) => {
    try {
      await deleteQcItems(ids);
      message.success(`成功删除 ${ids.length} 个质检项目`);
    } catch (error) {
      console.error('删除质检项目失败:', error);
    }
  };

  /**
   * 启用质检项目
   */
  const handleActivate = async (qcItem: QcItem) => {
    try {
      await activateQcItem(qcItem.id);
      message.success(`质检项目 ${qcItem.itemName} 启用成功`);
    } catch (error) {
      console.error('启用质检项目失败:', error);
    }
  };

  /**
   * 停用质检项目
   */
  const handleDeactivate = async (qcItem: QcItem) => {
    try {
      await deactivateQcItem(qcItem.id);
      message.success(`质检项目 ${qcItem.itemName} 停用成功`);
    } catch (error) {
      console.error('停用质检项目失败:', error);
    }
  };

  /**
   * 批量启用
   */
  const handleBatchActivate = async () => {
    if (selectedIds.length === 0) {
      message.warning('请先选择质检项目');
      return;
    }

    Modal.confirm({
      title: '确认批量启用',
      content: `您确定要启用选中的 ${selectedIds.length} 个质检项目吗？`,
      okText: '确定启用',
      cancelText: '取消',
      centered: true,
      onOk: async () => {
        try {
          await updateStatus(selectedIds, 'ACTIVE');
          message.success(`成功启用 ${selectedIds.length} 个质检项目`);
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
      message.warning('请先选择质检项目');
      return;
    }

    Modal.confirm({
      title: '确认批量停用',
      content: `您确定要停用选中的 ${selectedIds.length} 个质检项目吗？停用后这些项目将无法使用。`,
      okText: '确定停用',
      okType: 'danger',
      cancelText: '取消',
      centered: true,
      onOk: async () => {
        try {
          await updateStatus(selectedIds, 'INACTIVE');
          message.success(`成功停用 ${selectedIds.length} 个质检项目`);
          setSelectedIds([]);
        } catch (error) {
          console.error('批量停用失败:', error);
        }
      },
    });
  };

  /**
   * 复制质检项目
   */
  const handleCopy = async (qcItem: QcItem) => {
    try {
      const newItemCode = `${qcItem.itemCode}-COPY`;
      await copyQcItem(qcItem.id, newItemCode);
      message.success(`质检项目 ${qcItem.itemName} 复制成功`);
    } catch (error) {
      console.error('复制质检项目失败:', error);
    }
  };

  /**
   * 刷新列表
   */
  const handleRefresh = () => {
    loadQcItems();
    loadStatistics();
  };

  /**
   * 表单提交处理
   */
  const handleFormSubmit = async (values: any) => {
    setFormLoading(true);
    try {
      if (currentQcItem && currentQcItem.id) {
        // 编辑模式
        await updateQcItem({ ...values, id: currentQcItem.id });
        message.success('质检项目更新成功');
      } else {
        // 新增模式
        await createQcItem(values);
        message.success('质检项目创建成功');
      }
      setModalOpen(false);
      await loadQcItems();
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
    if (!currentQcItem) return [];

    const categoryConfig = QC_ITEM_CATEGORY_MAP[currentQcItem.category];
    const standardTypeConfig = QC_STANDARD_TYPE_MAP[currentQcItem.standardType];
    const statusConfig = QC_ITEM_STATUS_MAP[currentQcItem.status];

    return [
      { label: '项目编码', value: currentQcItem.itemCode },
      { label: '项目名称', value: currentQcItem.itemName },
      { label: '大类', value: categoryConfig.label, type: 'tag' as const, options: [categoryConfig] },
      { label: '标准值类型', value: standardTypeConfig.label, type: 'tag' as const, options: [standardTypeConfig] },
      { label: '标准值描述', value: currentQcItem.standardValue || '—' },
      { label: '下限值', value: currentQcItem.minValue !== undefined ? `${currentQcItem.minValue}` : '—' },
      { label: '上限值', value: currentQcItem.maxValue !== undefined ? `${currentQcItem.maxValue}` : '—' },
      { label: '单位', value: currentQcItem.unit || '—' },
      { label: '量具', value: currentQcItem.instrumentType || '—' },
      { label: '关键项', value: currentQcItem.isCritical ? '是' : '否' },
      { label: '必检项', value: currentQcItem.isRequired ? '是' : '否' },
      { label: '适用检验类型', value: currentQcItem.applyTypes?.map(type => QC_APPLY_TYPE_MAP[type]?.label).join(', ') || '—' },
      { label: '引用标准', value: currentQcItem.refStandard || '—' },
      { label: '状态', value: statusConfig.label, type: 'tag' as const, options: [statusConfig] },
      { label: '版本', value: currentQcItem.version },
      { label: '创建时间', value: currentQcItem.createdAt },
      { label: '更新时间', value: currentQcItem.updatedAt },
      { label: '备注', value: currentQcItem.remark || '—' },
    ];
  };

  /**
   * 表格列定义
   */
  const columns: ColumnsType<QcItem> = [
    {
      title: '项目编码',
      dataIndex: 'itemCode',
      key: 'itemCode',
      width: 130,
      fixed: 'left' as const,
    },
    {
      title: '项目名称',
      dataIndex: 'itemName',
      key: 'itemName',
      width: 180,
    },
    {
      title: '大类',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: (category: QcItemCategory) => {
        const categoryConfig = QC_ITEM_CATEGORY_MAP[category];
        return (
          <Tag color={categoryConfig.color}>
            {categoryConfig.label}
          </Tag>
        );
      },
    },
    {
      title: '标准值类型',
      dataIndex: 'standardType',
      key: 'standardType',
      width: 100,
      render: (type: QcStandardType) => {
        const typeConfig = QC_STANDARD_TYPE_MAP[type];
        return (
          <Tag color={typeConfig.color}>
            {typeConfig.label}
          </Tag>
        );
      },
    },
    {
      title: '标准值',
      dataIndex: 'standardValue',
      key: 'standardValue',
      width: 150,
    },
    {
      title: '单位',
      dataIndex: 'unit',
      key: 'unit',
      width: 80,
    },
    {
      title: '量具',
      dataIndex: 'instrumentType',
      key: 'instrumentType',
      width: 100,
    },
    {
      title: '关键',
      dataIndex: 'isCritical',
      key: 'isCritical',
      width: 80,
      align: 'center' as const,
      render: (isCritical: boolean) => (
        isCritical ? <ExperimentOutlined style={{ color: '#cf1322' }} /> : '—'
      ),
    },
    {
      title: '适用类型',
      dataIndex: 'applyTypes',
      key: 'applyTypes',
      width: 150,
      render: (applyTypes: string[]) => (
        <Space size="small" wrap>
          {applyTypes?.slice(0, 2).map(type => {
            const config = (QC_APPLY_TYPE_MAP as any)[type];
            return <Tag key={type} color={config.color}>{config.label}</Tag>;
          })}
          {applyTypes?.length > 2 && <Tag>+{applyTypes.length - 2}</Tag>}
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: QcItemStatus) => (
        <StatusBadge status={status} statusMap={QC_ITEM_STATUS_MAP} />
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
      render: (_: any, record: QcItem) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
          >
            查看
          </Button>
          {canUpdate('qc-item') && record.status === 'INACTIVE' && (
            <Button
              type="link"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => handleActivate(record)}
            >
              启用
            </Button>
          )}
          {canUpdate('qc-item') && record.status === 'ACTIVE' && (
            <Button
              type="link"
              size="small"
              icon={<StopOutlined />}
              onClick={() => handleDeactivate(record)}
            >
              停用
            </Button>
          )}
          {canUpdate('qc-item') && (
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            >
              编辑
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
          {canDelete('qc-item') && (
            <Popconfirm
              title="确认删除"
              description={`确定要删除质检项目「${record.itemName}」吗？`}
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
    <div className="qc-item-page" style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
      {/* 统计卡片 */}
      {statistics && (
        <div style={{ background: '#fff', padding: '16px', borderBottom: '1px solid #e8ecf0' }}>
          <Row gutter={16}>
            <Col span={4}>
              <Statistic
                title="质检项目总数"
                value={statistics.totalCount}
                valueStyle={{ color: '#1677ff' }}
                prefix={<SafetyCertificateOutlined style={{ fontSize: 20 }} />}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title="启用"
                value={statistics.activeCount}
                valueStyle={{ color: '#52c41a' }}
                prefix={<CheckCircleOutlined style={{ fontSize: 20, color: '#52c41a' }} />}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title="停用"
                value={statistics.inactiveCount}
                valueStyle={{ color: '#8c8c8c' }}
                prefix={<StopOutlined style={{ fontSize: 20, color: '#8c8c8c' }} />}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title="草稿"
                value={statistics.draftCount}
                valueStyle={{ color: '#faad14' }}
                prefix={<ExperimentOutlined style={{ fontSize: 20, color: '#faad14' }} />}
              />
            </Col>
            <Col span={8}>
              <div style={{ fontSize: 14, color: '#64748b', textAlign: 'center', paddingTop: 10 }}>
                关键项: {statistics.criticalCount} 个 |
                大类: {Object.keys(statistics.categoryStats).length} 类 |
                标准类型: {Object.keys(statistics.standardTypeStats).length} 类
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
        title="质检项目档案"
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
          data={qcItems}
          rowKey="id"
          columns={columns}
          loading={loading}
          pagination={pagination}
          paginationState={pagination}
          onPaginationChange={(page, pageSize) => {
            setFilters({ current: page, pageSize });
            loadQcItems();
          }}
          rowSelection={{
            selectedRowKeys: selectedIds,
            onChange: (keys) => setSelectedIds(keys as string[]),
          }}
          scroll={{ x: 2000 }}
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
        title={currentQcItem && currentQcItem.id ? '编辑质检项目' : '新增质检项目'}
        mode={currentQcItem && currentQcItem.id ? 'edit' : 'create'}
        fields={QC_ITEM_FORM_FIELDS}
        initialValues={currentQcItem || {}}
        onSubmit={handleFormSubmit}
        onCancel={() => {
          setModalOpen(false);
          setCurrentQcItem(null);
        }}
        loading={formLoading}
        width={900}
      />

      {/* 详情抽屉 */}
      <DetailDrawer
        visible={detailOpen}
        title="质检项目详情"
        data={currentQcItem}
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
              handleEdit(currentQcItem!);
            },
            disabled: !canUpdate('qc-item'),
          },
          {
            key: 'copy',
            label: '复制',
            icon: <CopyOutlined />,
            onClick: () => {
              handleCopy(currentQcItem!);
            },
          },
        ]}
        width={700}
      />
    </div>
  );
};

export default QcItemList;

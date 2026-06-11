/**
 * 物料清单(BOM)列表组件
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
import { useBomStore } from '../store/bomStore';
import { usePermission } from '../../../../shared/hooks/usePermission';
import type { FormField } from '../../../../shared/types/common';
import type { DetailField } from '../../../../shared/components/DetailDrawer';
import {
  BomHeader,
  BomStatus,
  BomType,
  BOM_STATUS_MAP,
  BOM_TYPE_MAP,
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
  DownloadOutlined,
} from '@ant-design/icons';
import { Button, Space, Popconfirm, message, Statistic, Row, Col, Tag, Tabs, Table, Modal } from 'antd';
import type { ColumnsType } from 'antd/es/table';

/**
 * 搜索表单字段配置
 */
const SEARCH_FIELDS: FormField[] = [
  { name: 'code', label: '母件编码', type: 'input', placeholder: '请输入母件编码' },
  { name: 'name', label: '物料名称', type: 'input', placeholder: '请输入物料名称' },
  {
    name: 'bomType',
    label: 'BOM类型',
    type: 'select',
    options: [
      { label: '全部', value: '' },
      ...Object.entries(BOM_TYPE_MAP).map(([key, value]) => ({
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
      ...Object.entries(BOM_STATUS_MAP).map(([key, value]) => ({
        label: value.label,
        value: key,
      })),
    ],
  },
  { name: 'createdBy', label: '创建人', type: 'input', placeholder: '请输入创建人' },
];

/**
 * 表单字段配置（新增/编辑BOM头）
 */
const BOM_FORM_FIELDS: FormField[] = [
  { name: 'code', label: '母件编码', type: 'input', required: true },
  { name: 'name', label: '物料名称', type: 'input', required: true },
  { name: 'spec', label: '规格型号', type: 'input' },
  { name: 'unit', label: '单位', type: 'input', required: true },
  { name: 'version', label: '版本号', type: 'input', required: true },
  {
    name: 'bomType',
    label: 'BOM类型',
    type: 'select',
    required: true,
    options: Object.entries(BOM_TYPE_MAP).map(([key, value]) => ({
      label: value.label,
      value: key,
    })),
  },
  { name: 'mainQty', label: '主批量', type: 'number', required: true },
  { name: 'mainUnit', label: '主单位', type: 'input', required: true },
  { name: 'batchQty', label: '批量', type: 'number', required: true },
  { name: 'calcUnit', label: '计量单位', type: 'input', required: true },
  { name: 'effectDate', label: '生效日期', type: 'datePicker', required: true },
  { name: 'remark', label: '备注', type: 'textArea' },
];

/**
 * BomList组件
 * 使用新架构的完整BOM列表页面
 * 保持与现有页面完全一致的样式和功能
 */
export const BomList: React.FC = () => {
  const {
    boms,
    selectedIds,
    currentBom,
    filters,
    pagination,
    loading,
    error,
    statistics,
    loadBoms,
    loadStatistics,
    createBom,
    updateBom,
    deleteBoms,
    reviewBom,
    unreviewBom,
    approveBom,
    updateBomStatus: updateStatus,
    copyBom,
    setFilters,
    setSelectedIds,
    setCurrentBom,
    setLoading,
    setError,
  } = useBomStore();

  const { canCreate, canUpdate, canDelete, canReview, canApprove } = usePermission('bom');

  const [modalOpen, setModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  /**
   * 初始化加载数据
   */
  useEffect(() => {
    loadBoms();
    loadStatistics();
  }, []);

  /**
   * 搜索处理
   */
  const handleSearch = (values: any) => {
    setFilters(values);
    loadBoms();
  };

  /**
   * 重置处理
   */
  const handleReset = () => {
    setFilters({});
    loadBoms();
  };

  /**
   * 新增BOM
   */
  const handleAdd = () => {
    setCurrentBom({} as BomHeader); // 空对象表示新增模式
    setModalOpen(true);
  };

  /**
   * 编辑BOM
   */
  const handleEdit = (bom: BomHeader) => {
    setCurrentBom(bom);
    setModalOpen(true);
  };

  /**
   * 查看详情
   */
  const handleView = (bom: BomHeader) => {
    setCurrentBom(bom);
    setDetailOpen(true);
  };

  /**
   * 删除BOM
   */
  const handleDelete = async (ids: string[]) => {
    try {
      await deleteBoms(ids);
      message.success(`成功删除 ${ids.length} 个BOM`);
    } catch (error) {
      console.error('删除BOM失败:', error);
    }
  };

  /**
   * 审核BOM
   */
  const handleReview = async (bom: BomHeader) => {
    try {
      await reviewBom(bom.id, '当前用户');
      message.success(`BOM ${bom.code} 审核成功`);
    } catch (error) {
      console.error('审核BOM失败:', error);
    }
  };

  /**
   * 撤销审核
   */
  const handleUnreview = async (bom: BomHeader) => {
    try {
      await unreviewBom(bom.id);
      message.success(`BOM ${bom.code} 撤销审核成功`);
    } catch (error) {
      console.error('撤销审核失败:', error);
    }
  };

  /**
   * 批准BOM
   */
  const handleApprove = async (bom: BomHeader) => {
    try {
      await approveBom(bom.id, '当前用户');
      message.success(`BOM ${bom.code} 批准成功`);
    } catch (error) {
      console.error('批准BOM失败:', error);
    }
  };

  /**
   * 禁用BOM
   */
  const handleDisable = async () => {
    if (selectedIds.length === 0) {
      message.warning('请先选择BOM');
      return;
    }

    Modal.confirm({
      title: '确认批量禁用',
      content: `您确定要禁用选中的 ${selectedIds.length} 个BOM吗？禁用后这些BOM将无法使用。`,
      okText: '确定禁用',
      okType: 'danger',
      cancelText: '取消',
      centered: true,
      onOk: async () => {
        try {
          await updateStatus(selectedIds, 'disabled');
          message.success(`成功禁用 ${selectedIds.length} 个BOM`);
          setSelectedIds([]);
        } catch (error) {
          console.error('禁用BOM失败:', error);
        }
      },
    });
  };

  /**
   * 启用BOM
   */
  const handleEnable = async () => {
    if (selectedIds.length === 0) {
      message.warning('请先选择BOM');
      return;
    }

    Modal.confirm({
      title: '确认批量启用',
      content: `您确定要启用选中的 ${selectedIds.length} 个BOM吗？`,
      okText: '确定启用',
      cancelText: '取消',
      centered: true,
      onOk: async () => {
        try {
          await updateStatus(selectedIds, 'draft');
          message.success(`成功启用 ${selectedIds.length} 个BOM`);
          setSelectedIds([]);
        } catch (error) {
          console.error('启用BOM失败:', error);
        }
      },
    });
  };

  /**
   * 复制BOM
   */
  const handleCopy = async (bom: BomHeader) => {
    try {
      await copyBom(bom.id);
      message.success(`BOM ${bom.code} 复制成功`);
    } catch (error) {
      console.error('复制BOM失败:', error);
    }
  };

  /**
   * 刷新列表
   */
  const handleRefresh = () => {
    loadBoms();
    loadStatistics();
  };

  /**
   * 表单提交处理
   */
  const handleFormSubmit = async (values: any) => {
    setFormLoading(true);
    try {
      if (currentBom && currentBom.id) {
        // 编辑模式
        await updateBom({ ...values, id: currentBom.id });
        message.success('BOM更新成功');
      } else {
        // 新增模式
        await createBom({ ...values, children: [] });
        message.success('BOM创建成功');
      }
      setModalOpen(false);
      await loadBoms();
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
    if (!currentBom) return [];

    const typeConfig = BOM_TYPE_MAP[currentBom.bomType];
    const statusConfig = BOM_STATUS_MAP[currentBom.status];

    return [
      { label: '母件编码', value: currentBom.code },
      { label: '物料名称', value: currentBom.name },
      { label: '规格型号', value: currentBom.spec || '—' },
      { label: '单位', value: currentBom.unit },
      { label: '版本号', value: currentBom.version },
      { label: 'BOM类型', value: typeConfig.label, type: 'tag' as const, options: [{ label: typeConfig.label, value: currentBom.bomType, color: typeConfig.color }] },
      { label: '主批量', value: `${currentBom.mainQty} ${currentBom.mainUnit}` },
      { label: '批量', value: `${currentBom.batchQty} ${currentBom.calcUnit}` },
      { label: '生效日期', value: currentBom.effectDate },
      { label: '状态', value: statusConfig.label, type: 'tag' as const, options: [{ label: statusConfig.label, value: currentBom.status, color: statusConfig.color }] },
      { label: '创建人', value: currentBom.createdBy },
      { label: '创建时间', value: currentBom.createdAt },
      { label: '审核人', value: currentBom.auditedBy || '—' },
      { label: '审核时间', value: currentBom.auditedAt || '—' },
      { label: '备注', value: currentBom.remark || '—' },
    ];
  };

  /**
   * 表格列定义
   */
  const columns: ColumnsType<BomHeader> = [
    {
      title: '母件编码',
      dataIndex: 'code',
      key: 'code',
      width: 150,
      fixed: 'left' as const,
    },
    {
      title: '物料名称',
      dataIndex: 'name',
      key: 'name',
      width: 150,
    },
    {
      title: '规格型号',
      dataIndex: 'spec',
      key: 'spec',
      width: 180,
      ellipsis: true,
    },
    {
      title: '版本',
      dataIndex: 'version',
      key: 'version',
      width: 80,
    },
    {
      title: 'BOM类型',
      dataIndex: 'bomType',
      key: 'bomType',
      width: 100,
      render: (type: BomType) => {
        const typeConfig = BOM_TYPE_MAP[type];
        return (
          <Tag color={typeConfig.color}>
            {typeConfig.label}
          </Tag>
        );
      },
    },
    {
      title: '主批量',
      dataIndex: 'mainQty',
      key: 'mainQty',
      width: 100,
      render: (qty: number, record: BomHeader) => `${qty} ${record.mainUnit}`,
    },
    {
      title: '批量',
      dataIndex: 'batchQty',
      key: 'batchQty',
      width: 100,
      render: (qty: number, record: BomHeader) => `${qty} ${record.calcUnit}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: BomStatus) => (
        <StatusBadge status={status} statusMap={BOM_STATUS_MAP} />
      ),
    },
    {
      title: '创建人',
      dataIndex: 'createdBy',
      key: 'createdBy',
      width: 100,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
    },
    {
      title: '操作',
      key: 'action',
      width: 320,
      fixed: 'right' as const,
      render: (_: any, record: BomHeader) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
          >
            查看
          </Button>
          {canUpdate('bom') && record.status === 'draft' && (
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            >
              编辑
            </Button>
          )}
          {canReview('bom') && record.status === 'draft' && (
            <Button
              type="link"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => handleReview(record)}
            >
              审核
            </Button>
          )}
          {canReview('bom') && record.status === 'audited' && (
            <Button
              type="link"
              size="small"
              icon={<StopOutlined />}
              onClick={() => handleUnreview(record)}
            >
              撤销审核
            </Button>
          )}
          {canApprove('bom') && record.status === 'audited' && (
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
            icon={<CopyOutlined />}
            onClick={() => handleCopy(record)}
          >
            复制
          </Button>
          {canDelete('bom') && record.status === 'draft' && (
            <Popconfirm
              title="确认删除"
              description={`确定要删除BOM「${record.code}」吗？`}
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
   * BOM子件列表列定义
   */
  const childColumns: ColumnsType<any> = [
    { title: '行号', dataIndex: 'rowNo', width: 60, align: 'center' as const },
    { title: '子件编码', dataIndex: 'childCode', width: 150 },
    { title: '子件名称', dataIndex: 'childName', width: 150 },
    { title: '规格型号', dataIndex: 'spec', width: 200, ellipsis: true },
    {
      title: '类型',
      dataIndex: 'type',
      width: 80,
      render: (type: string) => {
        const typeMap: Record<string, string> = {
          '主料': '#cf1322',
          '辅料': '#1677ff',
          '包材': '#52c41a',
          '模具': '#faad14',
        };
        return <Tag color={typeMap[type] || 'default'}>{type}</Tag>;
      },
    },
    { title: '子件数量', dataIndex: 'childQty', width: 100, align: 'right' as const },
    { title: '计量单位', dataIndex: 'calcUnit', width: 100 },
    {
      title: '损耗率',
      dataIndex: 'scrapRate',
      width: 80,
      align: 'right' as const,
      render: (rate: number) => rate ? `${rate}%` : '—',
    },
    {
      title: '领料方式',
      dataIndex: 'issueType',
      width: 100,
    },
    {
      title: '关键物料',
      dataIndex: 'keyMaterial',
      width: 80,
      align: 'center' as const,
      render: (keyMaterial: boolean) => keyMaterial ? '是' : '否',
    },
    { title: '自由项说明', dataIndex: 'freeDesc', width: 200, ellipsis: true },
  ];

  return (
    <div className="bom-page" style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
      {/* 统计卡片 */}
      {statistics && (
        <div style={{ background: '#fff', padding: '16px', borderBottom: '1px solid #e8ecf0' }}>
          <Row gutter={16}>
            <Col span={4}>
              <Statistic
                title="BOM总数"
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
                title="已审核"
                value={statistics.auditedCount}
                valueStyle={{ color: '#52c41a' }}
                prefix={<CheckCircleOutlined style={{ fontSize: 20, color: '#52c41a' }} />}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title="已批准"
                value={statistics.approvedCount}
                valueStyle={{ color: '#1677ff' }}
                prefix={<CheckCircleOutlined style={{ fontSize: 20, color: '#1677ff' }} />}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title="已禁用"
                value={statistics.disabledCount}
                valueStyle={{ color: '#cf1322' }}
                prefix={<StopOutlined style={{ fontSize: 20, color: '#cf1322' }} />}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title="主BOM数"
                value={statistics.typeStats['主BOM'] || 0}
                valueStyle={{ color: '#722ed1' }}
                prefix={<FileTextOutlined style={{ fontSize: 20, color: '#722ed1' }} />}
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
        title="物料清单(BOM)"
        actions={[
          { key: 'add', label: '新增', icon: <PlusOutlined />, type: 'primary', onClick: handleAdd },
          { key: 'refresh', label: '刷新', icon: <ReloadOutlined />, onClick: handleRefresh },
        ]}
        selectedCount={selectedIds.length}
        batchActions={[
          { key: 'enable', label: '启用', onClick: handleEnable },
          { key: 'disable', label: '禁用', onClick: handleDisable, danger: true },
        ]}
      />

      {/* 数据表格 */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
        <DataTable
          data={boms}
          rowKey="id"
          columns={columns as any}
          loading={loading}
          pagination={pagination}
          paginationState={pagination}
          onPaginationChange={(page, pageSize) => {
            setFilters({ current: page, pageSize });
            loadBoms();
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

      {/* 新增/编辑弹窗 */}
      <FormModal
        visible={modalOpen}
        title={currentBom && currentBom.id ? '编辑BOM' : '新增BOM'}
        mode={currentBom && currentBom.id ? 'edit' : 'create'}
        fields={BOM_FORM_FIELDS}
        initialValues={currentBom || {}}
        onSubmit={handleFormSubmit}
        onCancel={() => {
          setModalOpen(false);
          setCurrentBom(null);
        }}
        loading={formLoading}
        width={800}
      />

      {/* 详情抽屉 */}
      <DetailDrawer
        visible={detailOpen}
        title="物料清单(BOM)详情"
        fields={buildDetailFields()}
        onClose={() => setDetailOpen(false)}
        showActions={true}
        onEdit={() => {
          setDetailOpen(false);
          handleEdit(currentBom!);
        }}
        width={800}
        extra={
          currentBom && (
            <Tabs
              defaultActiveKey="children"
              items={[
                {
                  key: 'children',
                  label: `BOM明细 (${currentBom.children?.length || 0})`,
                },
              ]}
            >
              <div style={{ padding: '12px' }}>
                <Table
                  size="small"
                  dataSource={currentBom.children || []}
                  columns={childColumns}
                  rowKey="id"
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

export default BomList;

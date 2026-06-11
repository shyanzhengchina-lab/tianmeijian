/**
 * 设备档案列表组件
 * 使用新架构的完整实现
 * 完全保持UI/UX零变化，与现有页面样式一致
 */
import React, { useEffect, useState, useMemo } from 'react';
import { DataTable } from '../../../../shared/components/DataTable';
import { SearchForm } from '../../../../shared/components/SearchForm';
import { ActionBar } from '../../../../shared/components/ActionBar';
import { StatusBadge } from '../../../../shared/components/StatusBadge';
import { DetailDrawer } from '../../../../shared/components/DetailDrawer';
import { getWorkshopList } from '../../../../api/workshops';
import { getWorkCenterList } from '../../../../api/workCenters';
import { FormModal } from '../../../../shared/components/FormModal';
import type { FormField } from '../../../../shared/types/common';
import type { DetailField } from '../../../../shared/types/common';
import { useEquipmentStore } from '../store';
import { usePermission } from '../../../../shared/hooks/usePermission';
import {
  EquipRecord,
  EquipStatus,
  EquipCategory,
  EQUIP_STATUS_MAP,
  EQUIP_CATEGORY_MAP,
} from '../types';
import {
  PlusOutlined,
  ReloadOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  StopOutlined,
  ToolOutlined,
  QrcodeOutlined,
  DashboardOutlined,
  WarningOutlined,
  FileImageOutlined,
} from '@ant-design/icons';
import { Button, Space, Popconfirm, message, Statistic, Row, Col, Tag, Progress, Modal } from 'antd';
import type { ColumnsType } from 'antd/es/table';

/**
 * 搜索表单字段配置
 */
const SEARCH_FIELDS: FormField[] = [
  { name: 'equipCode', label: '设备编码', type: 'input', placeholder: '请输入设备编码' },
  { name: 'equipName', label: '设备名称', type: 'input', placeholder: '请输入设备名称' },
  {
    name: 'category',
    label: '设备类别',
    type: 'select',
    options: [
      { label: '全部', value: '' },
      ...Object.entries(EQUIP_CATEGORY_MAP).map(([key, value]) => ({
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
      ...Object.entries(EQUIP_STATUS_MAP).map(([key, value]) => ({
        label: value.label,
        value: key,
      })),
    ],
  },
  { name: 'workCenter', label: '工作中心', type: 'input', placeholder: '请输入工作中心' },
];

/**
 * 表单字段配置（静态部分，不含车间/工作中心 — 这两个动态加载）
 */
const EQUIPMENT_FORM_FIELDS_STATIC: FormField[] = [
  { name: 'equipCode', label: '设备编码', type: 'input', required: true },
  { name: 'equipName', label: '设备名称', type: 'input', required: true },
  {
    name: 'category',
    label: '设备类别',
    type: 'select',
    required: true,
    options: Object.entries(EQUIP_CATEGORY_MAP).map(([key, value]) => ({
      label: value.label,
      value: key,
    })),
  },
  {
    name: 'status',
    label: '状态',
    type: 'select',
    options: [
      { label: '正常使用', value: 'ACTIVE' },
      { label: '空闲', value: 'IDLE' },
      { label: '保养中', value: 'MAINTENANCE' },
      { label: '故障', value: 'FAULT' },
      { label: '停用', value: 'DISABLED' },
    ],
  },
  { name: 'precision', label: '精度/规格', type: 'input', placeholder: '如：±0.002mm' },
  { name: 'model', label: '型号', type: 'input', required: true },
  { name: 'brand', label: '品牌/厂商', type: 'input' },
  // workshop 和 workCenter 由组件内动态插入
  { name: 'location', label: '位置', type: 'input', placeholder: '如：A区-01号' },
  { name: 'purchaseDate', label: '购入日期', type: 'datePicker' },
  { name: 'warrantyDate', label: '保质期至', type: 'datePicker' },
  { name: 'lastMaintDate', label: '上次保养日期', type: 'datePicker' },
  { name: 'nextMaintDate', label: '下次保养日期', type: 'datePicker' },
  { name: 'remark', label: '备注', type: 'textArea' },
];

/**
 * EquipmentList组件
 * 使用新架构的完整设备列表页面
 * 保持与现有页面完全一致的样式和功能
 */
export const EquipmentList: React.FC = () => {
  const {
    equipments,
    selectedIds,
    currentEquipment: _currentEquipment,
    filters,
    pagination,
    loading,
    error,
    statistics,
    loadEquipments,
    loadStatistics,
    createEquipment,
    updateEquipment,
    deleteEquipments,
    activateEquipment,
    deactivateEquipment,
    scrapEquipment,
    setMaintenance,
    unsetMaintenance,
    updateStatus,
    setFilters,
    setSelectedIds,
    setCurrentEquipment: _setCurrentEquipment,
    setLoading,
    setError,
  } = useEquipmentStore();
  const currentEquipment = _currentEquipment as unknown as EquipRecord | null;
  const setCurrentEquipment = _setCurrentEquipment as unknown as (e: EquipRecord | null) => void;

  const { canCreate, canUpdate, canDelete, canMaintain } = usePermission('equipment');

  const [modalOpen, setModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  // ── 车间选项（从 API 动态加载）──────────────────────────────────
  const [workshopOptions, setWorkshopOptions] = useState<{ label: string; value: string }[]>([]);
  const [workCenterOptions, setWorkCenterOptions] = useState<{ label: string; value: string }[]>([]);

  const loadDropdownData = async () => {
    try {
      const [wsResp, wcResp] = await Promise.allSettled([
        getWorkshopList() as any,
        getWorkCenterList() as any,
      ]);
      if (wsResp.status === 'fulfilled') {
        const wsList: any[] = wsResp.value?.data ?? [];
        setWorkshopOptions(wsList.map((w: any) => ({
          label: `${w.name}${w.code ? `（${w.code}）` : ''}`,
          value: w.name ?? '',
        })));
      }
      if (wcResp.status === 'fulfilled') {
        const wcList: any[] = wcResp.value?.data ?? [];
        setWorkCenterOptions(wcList.map((w: any) => ({
          label: `${w.name}${w.code ? `（${w.code}）` : ''}`,
          value: w.name ?? '',
        })));
      }
    } catch { /* ignore, user can still type manually */ }
  };

  // ── 动态表单字段（插入车间/工作中心的 Select）───────────────────
  const equipmentFormFields = useMemo((): FormField[] => [
    { name: 'equipCode',  label: '设备编码',   type: 'input',      required: true },
    { name: 'equipName',  label: '设备名称',   type: 'input',      required: true },
    {
      name: 'category', label: '设备类别', type: 'select', required: true,
      options: Object.entries(EQUIP_CATEGORY_MAP).map(([key, value]) => ({
        label: (value as any).label, value: key,
      })),
    },
    {
      name: 'status', label: '状态', type: 'select',
      options: [
        { label: '正常使用',  value: 'ACTIVE' },
        { label: '空闲',     value: 'IDLE' },
        { label: '保养中',   value: 'MAINTENANCE' },
        { label: '故障',     value: 'FAULT' },
        { label: '停用',     value: 'DISABLED' },
      ],
    },
    { name: 'precision',  label: '精度/规格',  type: 'input',  placeholder: '如：±0.002mm' },
    { name: 'model',      label: '型号',       type: 'input',  required: true },
    { name: 'brand',      label: '品牌/厂商',  type: 'input' },
    // ── 所属车间 — 从车间档案选择 ──────────────────────────────────
    {
      name: 'workshop',
      label: '所属车间',
      type: 'select',
      required: true,
      placeholder: '从车间档案选择',
      options: workshopOptions,
    },
    // ── 工作中心 — 从工作中心档案选择 ─────────────────────────────
    {
      name: 'workCenter',
      label: '工作中心',
      type: 'select',
      placeholder: '从工作中心选择',
      options: workCenterOptions,
    },
    { name: 'location',       label: '位置',       type: 'input',     placeholder: '如：A区-01号' },
    { name: 'purchaseDate',   label: '购入日期',   type: 'datePicker' },
    { name: 'warrantyDate',   label: '保质期至',   type: 'datePicker' },
    { name: 'lastMaintDate',  label: '上次保养日期', type: 'datePicker' },
    { name: 'nextMaintDate',  label: '下次保养日期', type: 'datePicker' },
    { name: 'remark',         label: '备注',       type: 'textArea' },
  ], [workshopOptions, workCenterOptions]);

  /**
   * 初始化加载数据
   */
  useEffect(() => {
    loadEquipments();
    loadStatistics();
    loadDropdownData();  // 加载车间/工作中心下拉选项
  }, []);

  /**
   * 搜索处理
   */
  const handleSearch = (values: any) => {
    setFilters(values);
    loadEquipments();
  };

  /**
   * 重置处理
   */
  const handleReset = () => {
    setFilters({});
    loadEquipments();
  };

  /**
   * 新增设备
   */
  const handleAdd = () => {
    setCurrentEquipment({} as EquipRecord); // 空对象表示新增模式
    setModalOpen(true);
  };

  /**
   * 编辑设备
   */
  const handleEdit = (equipment: EquipRecord) => {
    setCurrentEquipment(equipment);
    setModalOpen(true);
  };

  /**
   * 查看详情
   */
  const handleView = (equipment: EquipRecord) => {
    setCurrentEquipment(equipment);
    setDetailOpen(true);
  };

  /**
   * 删除设备
   */
  const handleDelete = async (ids: string[]) => {
    try {
      await deleteEquipments(ids);
      message.success(`成功删除 ${ids.length} 个设备`);
    } catch (error) {
      console.error('删除设备失败:', error);
    }
  };

  /**
   * 启用设备
   */
  const handleActivate = async (equipment: EquipRecord) => {
    try {
      await activateEquipment(equipment.id);
      message.success(`设备 ${equipment.equipName} 启用成功`);
    } catch (error) {
      console.error('启用设备失败:', error);
    }
  };

  /**
   * 停用设备
   */
  const handleDeactivate = async (equipment: EquipRecord) => {
    try {
      await deactivateEquipment(equipment.id);
      message.success(`设备 ${equipment.equipName} 停用成功`);
    } catch (error) {
      console.error('停用设备失败:', error);
    }
  };

  /**
   * 报废设备
   */
  const handleScrap = async (equipment: EquipRecord) => {
    try {
      await scrapEquipment(equipment.id);
      message.success(`设备 ${equipment.equipName} 报废成功`);
    } catch (error) {
      console.error('报废设备失败:', error);
    }
  };

  /**
   * 设置保养状态
   */
  const handleSetMaintenance = async (equipment: EquipRecord) => {
    try {
      await setMaintenance(equipment.id);
      message.success(`设备 ${equipment.equipName} 已设置为保养状态`);
    } catch (error) {
      console.error('设置保养状态失败:', error);
    }
  };

  /**
   * 取消保养状态
   */
  const handleUnsetMaintenance = async (equipment: EquipRecord) => {
    try {
      await unsetMaintenance(equipment.id);
      message.success(`设备 ${equipment.equipName} 已取消保养状态`);
    } catch (error) {
      console.error('取消保养状态失败:', error);
    }
  };

  /**
   * 批量启用
   */
  const handleBatchActivate = async () => {
    if (selectedIds.length === 0) {
      message.warning('请先选择设备');
      return;
    }

    Modal.confirm({
      title: '确认批量启用',
      content: `您确定要启用选中的 ${selectedIds.length} 个设备吗？`,
      okText: '确定启用',
      cancelText: '取消',
      centered: true,
      onOk: async () => {
        try {
          await updateStatus(selectedIds, 'ACTIVE');
          message.success(`成功启用 ${selectedIds.length} 个设备`);
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
      message.warning('请先选择设备');
      return;
    }

    Modal.confirm({
      title: '确认批量停用',
      content: `您确定要停用选中的 ${selectedIds.length} 个设备吗？停用后这些设备将无法使用。`,
      okText: '确定停用',
      okType: 'danger',
      cancelText: '取消',
      centered: true,
      onOk: async () => {
        try {
          await updateStatus(selectedIds, 'DISABLED');
          message.success(`成功停用 ${selectedIds.length} 个设备`);
          setSelectedIds([]);
        } catch (error) {
          console.error('批量停用失败:', error);
        }
      },
    });
  };

  /**
   * 刷新列表
   */
  const handleRefresh = () => {
    loadEquipments();
    loadStatistics();
  };

  /**
   * 表单提交处理
   */
  const handleFormSubmit = async (values: any) => {
    setFormLoading(true);
    try {
      if (currentEquipment && currentEquipment.id) {
        // 编辑模式
        await updateEquipment({ ...values, id: currentEquipment.id });
        message.success('设备更新成功');
      } else {
        // 新增模式
        await createEquipment(values);
        message.success('设备创建成功');
      }
      setModalOpen(false);
      await loadEquipments();
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
    if (!currentEquipment) return [];

    const categoryConfig = EQUIP_CATEGORY_MAP[currentEquipment.category];
    const statusConfig = EQUIP_STATUS_MAP[currentEquipment.status];

    return [
      { label: '设备编码', value: currentEquipment.equipCode },
      { label: '设备名称', value: currentEquipment.equipName },
      { label: '型号规格', value: currentEquipment.model },
      { label: '品牌/厂商', value: currentEquipment.brand },
      { label: '出厂序列号', value: currentEquipment.serialNo || '—' },
      { label: '设备类别', value: categoryConfig.label, type: 'tag' as const, options: [categoryConfig] },
      { label: '所属车间', value: currentEquipment.workshop },
      { label: '工作中心', value: currentEquipment.workCenter },
      { label: '安装位置', value: currentEquipment.location },
      { label: '购入日期', value: currentEquipment.purchaseDate },
      { label: '安装验收日期', value: currentEquipment.installDate || '—' },
      { label: '保质期至', value: currentEquipment.warrantyDate },
      { label: '资产编号', value: currentEquipment.assetNo || '—' },
      { label: '特殊工序设备', value: currentEquipment.isSpecialProcess ? '是' : '否' },
      { label: '需要验证', value: currentEquipment.isValidationRequired ? '是' : '否' },
      { label: '精度/关键参数', value: currentEquipment.precision || '—' },
      { label: '状态', value: statusConfig.label, type: 'tag' as const, options: [statusConfig] },
      { label: '上次保养日期', value: currentEquipment.lastMaintDate || '—' },
      { label: '下次保养日期', value: currentEquipment.nextMaintDate || '—' },
      { label: '上次校准日期', value: currentEquipment.lastCalibDate || '—' },
      { label: '下次校准日期', value: currentEquipment.nextCalibDate || '—' },
      { label: 'OEE目标', value: currentEquipment.oeeTarget ? `${currentEquipment.oeeTarget}%` : '—' },
      { label: '当前OEE', value: currentEquipment.currentOee ? `${currentEquipment.currentOee}%` : '—' },
      { label: '创建时间', value: currentEquipment.createdAt },
      { label: '更新时间', value: currentEquipment.updatedAt },
      { label: '备注', value: currentEquipment.remark || '—' },
    ];
  };

  /**
   * 表格列定义
   */
  const columns: ColumnsType<EquipRecord> = [
    {
      title: '设备编码',
      dataIndex: 'equipCode',
      key: 'equipCode',
      width: 130,
      fixed: 'left' as const,
    },
    {
      title: '设备名称',
      dataIndex: 'equipName',
      key: 'equipName',
      width: 150,
    },
    {
      title: '设备类别',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: (category: EquipCategory) => {
        const categoryConfig = EQUIP_CATEGORY_MAP[category];
        return (
          <Tag color={categoryConfig.color}>
            {categoryConfig.label}
          </Tag>
        );
      },
    },
    {
      title: '型号规格',
      dataIndex: 'model',
      key: 'model',
      width: 120,
    },
    {
      title: '工作中心',
      dataIndex: 'workCenter',
      key: 'workCenter',
      width: 130,
    },
    {
      title: '安装位置',
      dataIndex: 'location',
      key: 'location',
      width: 120,
    },
    {
      title: '当前OEE',
      dataIndex: 'currentOee',
      key: 'currentOee',
      width: 100,
      align: 'center' as const,
      render: (oee: number) => (
        <Progress
          percent={oee}
          size="small"
          strokeColor={oee >= 80 ? '#52c41a' : oee >= 60 ? '#faad14' : '#cf1322'}
        />
      ),
    },
    {
      title: '下次保养',
      dataIndex: 'nextMaintDate',
      key: 'nextMaintDate',
      width: 120,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: EquipStatus) => (
        <StatusBadge status={status} statusMap={EQUIP_STATUS_MAP} />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 300,
      fixed: 'right' as const,
      render: (_: any, record: EquipRecord) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
          >
            查看
          </Button>
          {canUpdate('equipment') && record.status === 'ACTIVE' && (
            <>
              {(record.status as string) !== 'MAINTENANCE' ? (
                <Button
                  type="link"
                  size="small"
                  icon={<ToolOutlined />}
                  onClick={() => handleSetMaintenance(record)}
                >
                  保养
                </Button>
              ) : (
                <Button
                  type="link"
                  size="small"
                  icon={<CheckCircleOutlined />}
                  onClick={() => handleUnsetMaintenance(record)}
                >
                  恢复
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
          {canUpdate('equipment') && record.status === 'ACTIVE' && (
            <Button
              type="link"
              size="small"
              icon={<StopOutlined />}
              onClick={() => handleDeactivate(record)}
            >
              停用
            </Button>
          )}
          {canUpdate('equipment') && record.status === 'DISABLED' && (
            <Button
              type="link"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => handleActivate(record)}
            >
              启用
            </Button>
          )}
          {canUpdate('equipment') && record.status === 'ACTIVE' && (
            <Button
              type="link"
              size="small"
              icon={<WarningOutlined />}
              onClick={() => handleScrap(record)}
            >
              报废
            </Button>
          )}
          {canDelete('equipment') && (
            <Popconfirm
              title="确认删除"
              description={`确定要删除设备「${record.equipName}」吗？`}
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
    <div className="equipment-page" style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
      {/* 统计卡片 */}
      {statistics && (
        <div style={{ background: '#fff', padding: '16px', borderBottom: '1px solid #e8ecf0' }}>
          <Row gutter={16}>
            <Col span={3}>
              <Statistic
                title="设备总数"
                value={statistics.totalCount}
                valueStyle={{ color: '#1677ff' }}
                prefix={<DashboardOutlined style={{ fontSize: 20 }} />}
              />
            </Col>
            <Col span={3}>
              <Statistic
                title="运行中"
                value={statistics.activeCount}
                valueStyle={{ color: '#52c41a' }}
                prefix={<CheckCircleOutlined style={{ fontSize: 20, color: '#52c41a' }} />}
              />
            </Col>
            <Col span={3}>
              <Statistic
                title="空闲"
                value={statistics.idleCount}
                valueStyle={{ color: '#1677ff' }}
                prefix={<DashboardOutlined style={{ fontSize: 20, color: '#1677ff' }} />}
              />
            </Col>
            <Col span={3}>
              <Statistic
                title="保养中"
                value={statistics.maintenanceCount}
                valueStyle={{ color: '#faad14' }}
                prefix={<ToolOutlined style={{ fontSize: 20, color: '#faad14' }} />}
              />
            </Col>
            <Col span={3}>
              <Statistic
                title="故障"
                value={statistics.faultCount}
                valueStyle={{ color: '#cf1322' }}
                prefix={<WarningOutlined style={{ fontSize: 20, color: '#cf1322' }} />}
              />
            </Col>
            <Col span={3}>
              <Statistic
                title="平均OEE"
                value={statistics.avgOee}
                suffix="%"
                precision={1}
                valueStyle={{ color: '#722ed1' }}
                prefix={<DashboardOutlined style={{ fontSize: 20, color: '#722ed1' }} />}
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
        title="设备档案"
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
          data={equipments}
          rowKey="id"
          columns={columns}
          loading={loading}
          pagination={pagination}
          paginationState={pagination}
          onPaginationChange={(page, pageSize) => {
            setFilters({ current: page, pageSize });
            loadEquipments();
          }}
          rowSelection={{
            selectedRowKeys: selectedIds,
            onChange: (keys) => setSelectedIds(keys as string[]),
          }}
          scroll={{ x: 1700 }}
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
        title={currentEquipment && currentEquipment.id ? '编辑设备' : '新增设备'}
        mode={currentEquipment && currentEquipment.id ? 'edit' : 'create'}
        fields={equipmentFormFields}
        initialValues={currentEquipment || {}}
        onSubmit={handleFormSubmit}
        onCancel={() => {
          setModalOpen(false);
          setCurrentEquipment(null);
        }}
        loading={formLoading}
        width={900}
      />

      {/* 详情抽屉 */}
      <DetailDrawer
        visible={detailOpen}
        title="设备档案详情"
        data={currentEquipment}
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
              handleEdit(currentEquipment!);
            },
            disabled: !canUpdate('equipment'),
          },
          {
            key: 'qrCode',
            label: '二维码',
            icon: <QrcodeOutlined />,
            onClick: () => {
              message.success('二维码功能待实现');
            },
          },
          {
            key: 'oee',
            label: 'OEE分析',
            icon: <DashboardOutlined />,
            onClick: () => {
              message.success('OEE分析功能待实现');
            },
          },
        ]}
        width={800}
      />
    </div>
  );
};

export default EquipmentList;

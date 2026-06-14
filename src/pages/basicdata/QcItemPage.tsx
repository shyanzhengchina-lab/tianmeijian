/**
 * 质检项目档案
 * 功能：增删改查质检项目；按大类/类型/适用场景筛选；查看引用方案
 */
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import {
  getInspectionItemList, createInspectionItem, updateInspectionItem,
  deleteInspectionItem, InspectionItemRecord,
} from '../../api/inspectionItems';
import {
  Button, Input, Select, Modal, Form, message, Tag, Popconfirm,
  Tooltip, Drawer, Badge, Space, Table, Row, Col, Card,
  Divider, Alert, Switch, Checkbox, Typography,
} from 'antd';
import {
  PlusOutlined, SearchOutlined, ReloadOutlined,
  EditOutlined, DeleteOutlined, EyeOutlined,
  CheckCircleOutlined, ExperimentOutlined, FileSearchOutlined,
  AuditOutlined, TagsOutlined, LinkOutlined,
} from '@ant-design/icons';
import {
  QcItem, QcItemCategory, QcStandardType, QcApplyType, QcItemStatus,
  QC_ITEM_CATEGORY_MAP, QC_STANDARD_TYPE_MAP, QC_APPLY_TYPE_MAP,
  mockQcItems, mockQcSchemes, genQcItemCode,
} from './qmsBaseData';

const { Option } = Select;
const { TextArea } = Input;
const { Text, Title } = Typography;

// ─── 工具 ────────────────────────────────────────────────────
const ALL_CATEGORIES = Object.keys(QC_ITEM_CATEGORY_MAP) as QcItemCategory[];
const ALL_STANDARD_TYPES = Object.keys(QC_STANDARD_TYPE_MAP) as QcStandardType[];
const ALL_APPLY_TYPES = Object.keys(QC_APPLY_TYPE_MAP) as QcApplyType[];

const STATUS_MAP: Record<QcItemStatus, { label: string; color: string }> = {
  ACTIVE:   { label: '启用',   color: 'success' },
  INACTIVE: { label: '停用',   color: 'default' },
  DRAFT:    { label: '草稿',   color: 'warning' },
};

const INSTRUMENT_OPTIONS = [
  '千分尺', '投影仪', '游标卡尺', '粗糙度仪', '硬度仪',
  '扭力测试仪', '弯曲测试仪', '圆度仪', '目视', '量规', '扫码枪',
];

// ─── 前后端 category 映射 ──────────────────────────────────
const CATEGORY_TO_API: Record<QcItemCategory, string> = {
  SIZE: '尺寸', APPEARANCE: '外观', PERFORMANCE: '性能',
  CHEMICAL: '化学', MICROBIAL: '微生物', PHYSICAL: '物理', DOCUMENT: '文件',
};
const API_TO_CATEGORY: Record<string, QcItemCategory> = {
  '尺寸': 'SIZE', '外观': 'APPEARANCE', '性能': 'PERFORMANCE',
  '化学': 'CHEMICAL', '微生物': 'MICROBIAL', '物理': 'PHYSICAL', '文件': 'DOCUMENT',
  SIZE: 'SIZE', APPEARANCE: 'APPEARANCE', PERFORMANCE: 'PERFORMANCE',
  CHEMICAL: 'CHEMICAL', MICROBIAL: 'MICROBIAL', PHYSICAL: 'PHYSICAL', DOCUMENT: 'DOCUMENT',
};

function mapApiToQcItem(item: InspectionItemRecord): QcItem {
  // 后端compat路由返回双字段（item_code & code / item_name & name 等），全兼容
  const raw = item as any;
  return {
    id:            String(raw.id ?? ''),
    itemCode:      raw.itemCode   ?? raw.item_code  ?? raw.code  ?? '',
    itemName:      raw.itemName   ?? raw.item_name  ?? raw.name  ?? '',
    category:      API_TO_CATEGORY[raw.itemType ?? raw.item_type ?? raw.category ?? ''] ?? 'APPEARANCE',
    standardType:  'NUMERIC' as const,
    standardValue: raw.specText   ?? raw.spec_text  ?? raw.standard ?? '',
    minValue:      raw.specMin    ?? raw.spec_min   ?? raw.minValue   ?? undefined,
    maxValue:      raw.specMax    ?? raw.spec_max   ?? raw.maxValue   ?? undefined,
    unit:          raw.unitName   ?? raw.unit_name  ?? raw.unit  ?? '',
    instrumentType: raw.testMethod ?? raw.test_method ?? raw.method ?? '',
    isCritical:    raw.isKeyItem === 1,
    isRequired:    true,
    applyTypes:    [],
    status:        (raw.status === 1 ? 'ACTIVE' : raw.status === 0 ? 'INACTIVE' : 'ACTIVE') as QcItemStatus,
    version:       'V1.0',
    createdAt:     raw.createTime ?? raw.create_time ?? '',
    updatedAt:     raw.updateTime ?? raw.update_time ?? raw.createTime ?? '',
  };
}

// ─── 类型 ────────────────────────────────────────────────────
type EditItem = Partial<QcItem> & { applyTypes: QcApplyType[] };

function initEdit(base?: QcItem): EditItem {
  if (base) return { ...base, applyTypes: base.applyTypes || [] };
  return {
    itemCode: genQcItemCode(),
    itemName: '',
    category: 'SIZE',
    standardType: 'NUMERIC',
    isCritical: false,
    isRequired: true,
    applyTypes: [],
    status: 'ACTIVE',
    version: 'V1.0',
  };
}

// ─── 主组件 ──────────────────────────────────────────────────
// 快速过滤类型
type QuickFilter = 'ALL' | 'ACTIVE' | 'CRITICAL' | 'REFERENCED';

const QcItemPage: React.FC = () => {
  // bip_qc_items 存储的空数组[]也算"未初始化"，此时用mockQcItems填充
  const [rawItems, setItems] = useLocalStorage<QcItem[]>('bip_qc_items', mockQcItems);
  const items: QcItem[] = (rawItems && rawItems.length > 0) ? rawItems : mockQcItems;
  const [apiSaving, setApiSaving] = useState(false);

  // ── 确保初始化时有mock数据（处理localStorage空值情况）─────────
  useEffect(() => {
    setItems(prev => (prev && prev.length > 0) ? prev : mockQcItems);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── 从后端加载质检项目（API-first replace）─────────────────
  const loadFromApi = useCallback(async () => {
    try {
      const resp = await getInspectionItemList() as any;
      const apiList: any[] = resp?.data ?? [];
      if (apiList.length > 0) {
        setItems(apiList.map(mapApiToQcItem));
      }
      // API返回空时保持mockQcItems，不清空
    } catch { /* 保留 mock */ }
  }, [setItems]);
  useEffect(() => { loadFromApi(); }, [loadFromApi]);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<QcItemCategory | 'ALL'>('ALL');
  const [filterType, setFilterType] = useState<QcStandardType | 'ALL'>('ALL');
  const [filterApply, setFilterApply] = useState<QcApplyType | 'ALL'>('ALL');
  const [filterStatus, setFilterStatus] = useState<QcItemStatus | 'ALL'>('ALL');
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('ALL');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<EditItem>(initEdit());
  const [isNew, setIsNew] = useState(true);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<QcItem | null>(null);

  // 引用本项目的方案数（需在 filtered 之前定义）
  const schemeRefCount = (itemId: string) =>
    mockQcSchemes.filter(s => s.items.some(si => si.itemId === itemId)).length;

  // 过滤
  const filtered = useMemo(() => {
    return items.filter(it => {
      // 快速卡片过滤
      if (quickFilter === 'ACTIVE' && it.status !== 'ACTIVE') return false;
      if (quickFilter === 'CRITICAL' && !it.isCritical) return false;
      if (quickFilter === 'REFERENCED' && schemeRefCount(it.id) === 0) return false;
      // 工具栏过滤
      if (filterCategory !== 'ALL' && it.category !== filterCategory) return false;
      if (filterType !== 'ALL' && it.standardType !== filterType) return false;
      if (filterApply !== 'ALL' && !it.applyTypes.includes(filterApply)) return false;
      if (filterStatus !== 'ALL' && it.status !== filterStatus) return false;
      if (search) {
        const s = search.toLowerCase();
        return it.itemCode.toLowerCase().includes(s) || it.itemName.toLowerCase().includes(s);
      }
      return true;
    });
  }, [items, filterCategory, filterType, filterApply, filterStatus, search, quickFilter]);

  // ── CRUD ──
  const openNew = () => { setEditing(initEdit()); setIsNew(true); setModalOpen(true); };
  const openEdit = (item: QcItem) => { setEditing(initEdit(item)); setIsNew(false); setModalOpen(true); };
  const openDetail = (item: QcItem) => { setDetailItem(item); setDetailOpen(true); };

  const handleSave = async () => {
    if (!editing.itemName?.trim()) { message.error('请填写项目名称'); return; }

    const payload: InspectionItemRecord = {
      code:      editing.itemCode || genQcItemCode(),
      name:      editing.itemName!,
      category:  CATEGORY_TO_API[editing.category as QcItemCategory ?? 'SIZE'],
      standard:  editing.standardValue ?? '',
      unit:      editing.unit ?? '',
      minValue:  editing.minValue,
      maxValue:  editing.maxValue,
      method:    editing.instrumentType ?? '',
      isKeyItem: (editing.isCritical ?? false) ? 1 : 0,
      status:    editing.status === 'INACTIVE' ? 0 : 1,
    };

    setApiSaving(true);
    try {
      if (isNew) {
        const resp = await createInspectionItem(payload) as any;
        const saved = mapApiToQcItem(resp?.data ?? { ...payload, id: Date.now() });
        setItems(prev => [saved, ...prev]);
        message.success(`质检项目「${saved.itemName}」已创建`);
      } else {
        const numId = Number(editing.id);
        if (!isNaN(numId) && numId > 0) {
          const resp = await updateInspectionItem(numId, payload) as any;
          const saved = mapApiToQcItem(resp?.data ?? { ...payload, id: editing.id });
          setItems(prev => prev.map(it => it.id === editing.id ? saved : it));
        } else {
          setItems(prev => prev.map(it =>
            it.id === editing.id ? { ...it, ...editing, updatedAt: new Date().toLocaleString('zh-CN') } as QcItem : it
          ));
        }
        message.success(`质检项目「${editing.itemName}」已更新`);
      }
    } catch (err: any) {
      message.error('保存失败：' + (err?.message ?? '网络错误'));
      return;
    } finally { setApiSaving(false); }
    setModalOpen(false);
  };

  const handleDelete = async (item: QcItem) => {
    const numId = Number(item.id);
    try {
      if (!isNaN(numId) && numId > 0) {
        await deleteInspectionItem(numId);
      }
      setItems(prev => prev.filter(it => it.id !== item.id));
      message.success('已删除');
    } catch (err: any) {
      message.error('删除失败：' + (err?.message ?? '网络错误'));
    }
  };

  const handleToggleStatus = async (item: QcItem) => {
    const next = item.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const numId = Number(item.id);
    try {
      if (!isNaN(numId) && numId > 0) {
        await updateInspectionItem(numId, { status: next === 'ACTIVE' ? 1 : 0 });
      }
      setItems(prev => prev.map(it =>
        it.id === item.id ? { ...it, status: next, updatedAt: new Date().toLocaleString('zh-CN') } : it
      ));
      message.success(next === 'ACTIVE' ? '已启用' : '已停用');
    } catch (err: any) {
      message.error('操作失败：' + (err?.message ?? ''));
    }
  };

  // ── 表格列 ──
  const columns = [
    {
      title: '编码', dataIndex: 'itemCode', width: 150,
      render: (v: string) => <Text code style={{ fontSize: 12 }}>{v}</Text>,
    },
    {
      title: '项目名称', dataIndex: 'itemName', width: 160,
      render: (v: string, r: QcItem) => (
        <Space>
          <Text strong style={{ fontSize: 13 }}>{v}</Text>
          {r.isCritical && <Tag color="red" style={{ fontSize: 11, padding: '0 4px' }}>关键</Tag>}
        </Space>
      ),
    },
    {
      title: '大类', dataIndex: 'category', width: 80,
      render: (v: QcItemCategory) => {
        const m = QC_ITEM_CATEGORY_MAP[v] ?? { color: 'default', label: v ?? '-' };
        return (
          <Tag color={m.color} style={{ fontSize: 11 }}>
            {m.label}
          </Tag>
        );
      },
    },
    {
      title: '标准类型', dataIndex: 'standardType', width: 90,
      render: (v: QcStandardType) => {
        const m = QC_STANDARD_TYPE_MAP[v] ?? { color: 'default', label: v ?? '-' };
        return (
          <Tag color={m.color} style={{ fontSize: 11 }}>
            {m.label}
          </Tag>
        );
      },
    },
    {
      title: '标准值/选项', width: 180,
      render: (_: unknown, r: QcItem) => {
        if (r.standardType === 'NUMERIC') {
          return <Text style={{ fontSize: 12 }}>{r.standardValue || '—'}{r.unit ? ` ${r.unit}` : ''}</Text>;
        }
        if (r.standardType === 'ENUM') {
          return (
            <Space size={2} wrap>
              {(r.enumOptions || []).map(o => <Tag key={o} style={{ fontSize: 11 }}>{o}</Tag>)}
            </Space>
          );
        }
        return <Text type="secondary" style={{ fontSize: 12 }}>是/否</Text>;
      },
    },
    {
      title: '量具', dataIndex: 'instrumentType', width: 100,
      render: (v?: string) => v ? <Text style={{ fontSize: 12 }}>{v}</Text> : <Text type="secondary">—</Text>,
    },
    {
      title: '适用类型', dataIndex: 'applyTypes', width: 200,
      render: (v: QcApplyType[]) => (
        <Space size={2} wrap>
          {v.map(t => <Tag key={t} color="geekblue" style={{ fontSize: 10, padding: '0 4px' }}>{QC_APPLY_TYPE_MAP[t]}</Tag>)}
        </Space>
      ),
    },
    {
      title: '引用方案', width: 80,
      render: (_: unknown, r: QcItem) => {
        const cnt = schemeRefCount(r.id);
        return cnt > 0
          ? <Badge count={cnt} style={{ backgroundColor: '#1890ff' }} />
          : <Text type="secondary">—</Text>;
      },
    },
    {
      title: '状态', dataIndex: 'status', width: 80,
      render: (v: QcItemStatus, r: QcItem) => (
        <Tag
          color={(STATUS_MAP[v] ?? { color: 'default' }).color}
          style={{ cursor: 'pointer', fontSize: 12 }}
          onClick={() => handleToggleStatus(r)}
        >
          {(STATUS_MAP[v] ?? { label: String(v ?? '-') }).label}
        </Tag>
      ),
    },
    {
      title: '操作', width: 120, fixed: 'right' as const,
      render: (_: unknown, r: QcItem) => (
        <Space size={4}>
          <Tooltip title="查看详情">
            <Button size="small" icon={<EyeOutlined />} onClick={() => openDetail(r)} />
          </Tooltip>
          <Tooltip title="编辑">
            <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)} />
          </Tooltip>
          <Popconfirm
            title={`确认删除「${r.itemName}」？`}
            description={schemeRefCount(r.id) > 0 ? '该项目已被方案引用，无法删除' : '删除后不可恢复'}
            onConfirm={() => handleDelete(r)}
            okText="删除" cancelText="取消" okButtonProps={{ danger: true }}
          >
            <Tooltip title="删除">
              <Button size="small" icon={<DeleteOutlined />} danger />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // ── 引用该项目的方案列表（详情用）
  const refSchemes = detailItem
    ? mockQcSchemes.filter(s => s.items.some(si => si.itemId === detailItem.id))
    : [];

  return (
    <div style={{ padding: '0 0 24px' }}>
      {/* 统计卡片（点击快速过滤） */}
      <Row gutter={12} style={{ marginBottom: 16 }}>
        {([
          { key: 'ALL' as QuickFilter,        label: '全部项目',     value: items.length,                                           color: '#1890ff' },
          { key: 'ACTIVE' as QuickFilter,     label: '启用中',       value: items.filter(i => i.status === 'ACTIVE').length,        color: '#52c41a' },
          { key: 'CRITICAL' as QuickFilter,   label: '关键项目',     value: items.filter(i => i.isCritical).length,                 color: '#ff4d4f' },
          { key: 'REFERENCED' as QuickFilter, label: '已被方案引用', value: items.filter(i => schemeRefCount(i.id) > 0).length,    color: '#722ed1' },
        ] as { key: QuickFilter; label: string; value: number; color: string }[]).map(c => {
          const isActive = quickFilter === c.key;
          return (
            <Col key={c.key} xs={12} sm={6}>
              <Card
                size="small"
                onClick={() => setQuickFilter(isActive ? 'ALL' : c.key)}
                style={{
                  textAlign: 'center',
                  borderTop: `3px solid ${c.color}`,
                  cursor: 'pointer',
                  background: isActive ? c.color + '12' : '#fff',
                  boxShadow: isActive ? `0 0 0 2px ${c.color}` : undefined,
                  transition: 'all 0.2s',
                  userSelect: 'none',
                }}
              >
                <div style={{ fontSize: 26, fontWeight: 700, color: c.color, lineHeight: 1.2 }}>{c.value}</div>
                <div style={{ fontSize: 12, color: isActive ? c.color : '#888', fontWeight: isActive ? 600 : 400, marginTop: 2 }}>
                  {c.label}
                  {isActive && <span style={{ marginLeft: 4, fontSize: 10 }}>✓ 过滤中</span>}
                </div>
              </Card>
            </Col>
          );
        })}
      </Row>

      {/* 工具栏 */}
      <Card size="small" style={{ marginBottom: 12 }}>
        <Row gutter={[8, 8]} align="middle">
          <Col flex="auto">
            <Space size={8} wrap>
              <Input
                prefix={<SearchOutlined />}
                placeholder="搜索编码/名称"
                value={search}
                onChange={e => setSearch(e.target.value)}
                allowClear
                style={{ width: 200 }}
              />
              <Select value={filterCategory} onChange={v => setFilterCategory(v)} style={{ width: 110 }}>
                <Option value="ALL">全部大类</Option>
                {ALL_CATEGORIES.map(c => (
                  <Option key={c} value={c}>{QC_ITEM_CATEGORY_MAP[c].label}</Option>
                ))}
              </Select>
              <Select value={filterType} onChange={v => setFilterType(v)} style={{ width: 110 }}>
                <Option value="ALL">全部类型</Option>
                {ALL_STANDARD_TYPES.map(t => (
                  <Option key={t} value={t}>{QC_STANDARD_TYPE_MAP[t].label}</Option>
                ))}
              </Select>
              <Select value={filterApply} onChange={v => setFilterApply(v)} style={{ width: 120 }}>
                <Option value="ALL">全部适用</Option>
                {ALL_APPLY_TYPES.map(t => (
                  <Option key={t} value={t}>{QC_APPLY_TYPE_MAP[t]}</Option>
                ))}
              </Select>
              <Select value={filterStatus} onChange={v => setFilterStatus(v)} style={{ width: 100 }}>
                <Option value="ALL">全部状态</Option>
                <Option value="ACTIVE">启用</Option>
                <Option value="INACTIVE">停用</Option>
                <Option value="DRAFT">草稿</Option>
              </Select>
              <Button icon={<ReloadOutlined />} onClick={() => {
                setSearch(''); setFilterCategory('ALL'); setFilterType('ALL');
                setFilterApply('ALL'); setFilterStatus('ALL');
              }}>重置</Button>
            </Space>
          </Col>
          <Col>
            <Button type="primary" icon={<PlusOutlined />} onClick={openNew}>
              新建项目
            </Button>
          </Col>
        </Row>
      </Card>

      <Alert
        type="info" showIcon style={{ marginBottom: 12, fontSize: 12 }}
        message="质检项目是质检方案的基本单元。创建项目后，可在「质检方案档案」中将其组装成方案，应用于IQC来料检验、IPQC过程检验、FQC成品检验等场景。"
      />

      {/* 表格 */}
      <Table
        dataSource={filtered}
        columns={columns}
        rowKey="id"
        size="small"
        scroll={{ x: 1200 }}
        pagination={{ pageSize: 15, showSizeChanger: true, showTotal: t => `共 ${t} 条` }}
      />

      {/* ── 新建/编辑 Modal ── */}
      <Modal
        title={isNew ? '新建质检项目' : `编辑质检项目 — ${editing.itemName}`}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => setModalOpen(false)}
        width={720}
        okText="保存"
        cancelText="取消"
        confirmLoading={apiSaving}
        destroyOnClose
      >
        <Row gutter={16}>
          <Col span={12}>
            <div style={{ marginBottom: 8 }}>
              <label style={{ fontSize: 13, fontWeight: 600 }}>项目编码 <span style={{ color: '#ff4d4f' }}>*</span></label>
              <Input
                value={editing.itemCode}
                onChange={e => setEditing(p => ({ ...p, itemCode: e.target.value }))}
                style={{ marginTop: 4 }}
                placeholder="自动生成，可修改"
              />
            </div>
          </Col>
          <Col span={12}>
            <div style={{ marginBottom: 8 }}>
              <label style={{ fontSize: 13, fontWeight: 600 }}>项目名称 <span style={{ color: '#ff4d4f' }}>*</span></label>
              <Input
                value={editing.itemName}
                onChange={e => setEditing(p => ({ ...p, itemName: e.target.value }))}
                style={{ marginTop: 4 }}
                placeholder="如：外径D1"
              />
            </div>
          </Col>
          <Col span={12}>
            <div style={{ marginBottom: 8 }}>
              <label style={{ fontSize: 13, fontWeight: 600 }}>项目大类 <span style={{ color: '#ff4d4f' }}>*</span></label>
              <Select
                value={editing.category}
                onChange={v => setEditing(p => ({ ...p, category: v }))}
                style={{ width: '100%', marginTop: 4 }}
              >
                {ALL_CATEGORIES.map(c => (
                  <Option key={c} value={c}>
                    <Tag color={QC_ITEM_CATEGORY_MAP[c].color}>{QC_ITEM_CATEGORY_MAP[c].label}</Tag>
                  </Option>
                ))}
              </Select>
            </div>
          </Col>
          <Col span={12}>
            <div style={{ marginBottom: 8 }}>
              <label style={{ fontSize: 13, fontWeight: 600 }}>标准值类型 <span style={{ color: '#ff4d4f' }}>*</span></label>
              <Select
                value={editing.standardType}
                onChange={v => setEditing(p => ({ ...p, standardType: v }))}
                style={{ width: '100%', marginTop: 4 }}
              >
                {ALL_STANDARD_TYPES.map(t => (
                  <Option key={t} value={t}>{QC_STANDARD_TYPE_MAP[t].label}</Option>
                ))}
              </Select>
            </div>
          </Col>

          {/* 数值型字段 */}
          {editing.standardType === 'NUMERIC' && (
            <>
              <Col span={24}>
                <div style={{ marginBottom: 8 }}>
                  <label style={{ fontSize: 13, fontWeight: 600 }}>标准值描述</label>
                  <Input
                    value={editing.standardValue}
                    onChange={e => setEditing(p => ({ ...p, standardValue: e.target.value }))}
                    style={{ marginTop: 4 }}
                    placeholder="如：0.250±0.005 或 ≥标准要求值"
                  />
                </div>
              </Col>
              <Col span={8}>
                <div style={{ marginBottom: 8 }}>
                  <label style={{ fontSize: 13 }}>最小值</label>
                  <Input
                    type="number"
                    value={editing.minValue}
                    onChange={e => setEditing(p => ({ ...p, minValue: e.target.value ? Number(e.target.value) : undefined }))}
                    style={{ marginTop: 4 }}
                    placeholder="下限"
                  />
                </div>
              </Col>
              <Col span={8}>
                <div style={{ marginBottom: 8 }}>
                  <label style={{ fontSize: 13 }}>最大值</label>
                  <Input
                    type="number"
                    value={editing.maxValue}
                    onChange={e => setEditing(p => ({ ...p, maxValue: e.target.value ? Number(e.target.value) : undefined }))}
                    style={{ marginTop: 4 }}
                    placeholder="上限"
                  />
                </div>
              </Col>
              <Col span={8}>
                <div style={{ marginBottom: 8 }}>
                  <label style={{ fontSize: 13 }}>单位</label>
                  <Input
                    value={editing.unit}
                    onChange={e => setEditing(p => ({ ...p, unit: e.target.value }))}
                    style={{ marginTop: 4 }}
                    placeholder="如：mm、℃"
                  />
                </div>
              </Col>
            </>
          )}

          {/* 枚举型字段 */}
          {editing.standardType === 'ENUM' && (
            <Col span={24}>
              <div style={{ marginBottom: 8 }}>
                <label style={{ fontSize: 13, fontWeight: 600 }}>枚举选项（回车分隔）</label>
                <Select
                  mode="tags"
                  value={editing.enumOptions || []}
                  onChange={v => setEditing(p => ({ ...p, enumOptions: v }))}
                  style={{ width: '100%', marginTop: 4 }}
                  placeholder="输入选项后回车，如：合格、不合格"
                  tokenSeparators={[',']}
                />
              </div>
            </Col>
          )}

          <Col span={12}>
            <div style={{ marginBottom: 8 }}>
              <label style={{ fontSize: 13, fontWeight: 600 }}>所需量具</label>
              <Select
                value={editing.instrumentType}
                onChange={v => setEditing(p => ({ ...p, instrumentType: v }))}
                style={{ width: '100%', marginTop: 4 }}
                allowClear
                placeholder="选择量具"
              >
                {INSTRUMENT_OPTIONS.map(o => <Option key={o} value={o}>{o}</Option>)}
              </Select>
            </div>
          </Col>
          <Col span={12}>
            <div style={{ marginBottom: 8 }}>
              <label style={{ fontSize: 13, fontWeight: 600 }}>引用标准</label>
              <Input
                value={editing.refStandard}
                onChange={e => setEditing(p => ({ ...p, refStandard: e.target.value }))}
                style={{ marginTop: 4 }}
                placeholder="如：YY 0462-2023"
              />
            </div>
          </Col>

          <Col span={24}>
            <div style={{ marginBottom: 8 }}>
              <label style={{ fontSize: 13, fontWeight: 600 }}>适用检验类型 <span style={{ color: '#ff4d4f' }}>*</span></label>
              <div style={{ marginTop: 4 }}>
                <Checkbox.Group
                  value={editing.applyTypes}
                  onChange={v => setEditing(p => ({ ...p, applyTypes: v as QcApplyType[] }))}
                >
                  <Row gutter={[8, 8]}>
                    {ALL_APPLY_TYPES.map(t => (
                      <Col key={t} span={8}>
                        <Checkbox value={t}>{QC_APPLY_TYPE_MAP[t]}</Checkbox>
                      </Col>
                    ))}
                  </Row>
                </Checkbox.Group>
              </div>
            </div>
          </Col>

          <Col span={12}>
            <Space size={24}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600 }}>关键项</label>
                <div style={{ marginTop: 4 }}>
                  <Switch
                    checked={editing.isCritical}
                    onChange={v => setEditing(p => ({ ...p, isCritical: v }))}
                    checkedChildren="关键"
                    unCheckedChildren="非关键"
                  />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600 }}>必检</label>
                <div style={{ marginTop: 4 }}>
                  <Switch
                    checked={editing.isRequired}
                    onChange={v => setEditing(p => ({ ...p, isRequired: v }))}
                    checkedChildren="必检"
                    unCheckedChildren="选检"
                  />
                </div>
              </div>
            </Space>
          </Col>
          <Col span={12}>
            <div style={{ marginBottom: 8 }}>
              <label style={{ fontSize: 13, fontWeight: 600 }}>状态</label>
              <Select
                value={editing.status}
                onChange={v => setEditing(p => ({ ...p, status: v }))}
                style={{ width: '100%', marginTop: 4 }}
              >
                <Option value="DRAFT">草稿</Option>
                <Option value="ACTIVE">启用</Option>
                <Option value="INACTIVE">停用</Option>
              </Select>
            </div>
          </Col>

          <Col span={24}>
            <div style={{ marginBottom: 8 }}>
              <label style={{ fontSize: 13 }}>备注</label>
              <TextArea
                value={editing.remark}
                onChange={e => setEditing(p => ({ ...p, remark: e.target.value }))}
                style={{ marginTop: 4 }}
                rows={2}
                placeholder="可选备注"
              />
            </div>
          </Col>
        </Row>
      </Modal>

      {/* ── 详情 Drawer ── */}
      <Drawer
        title={<Space><AuditOutlined /><span>质检项目详情</span></Space>}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        width={560}
      >
        {detailItem && (
          <Space direction="vertical" style={{ width: '100%' }} size={14}>
            <Card size="small" title="基本信息">
              <Row gutter={[16, 10]}>
                <Col span={24}>
                  <Text type="secondary">项目名称：</Text>
                  <Text strong style={{ fontSize: 15 }}>{detailItem.itemName}</Text>
                  {detailItem.isCritical && <Tag color="red" style={{ marginLeft: 8 }}>关键项</Tag>}
                </Col>
                <Col span={12}><Text type="secondary">编码：</Text><Text code>{detailItem.itemCode}</Text></Col>
                <Col span={12}><Text type="secondary">版本：</Text><Text>{detailItem.version}</Text></Col>
                <Col span={12}>
                  <Text type="secondary">大类：</Text>
                  <Tag color={(QC_ITEM_CATEGORY_MAP[detailItem.category] ?? { color: 'default' }).color}>
                    {(QC_ITEM_CATEGORY_MAP[detailItem.category] ?? { label: detailItem.category ?? '-' }).label}
                  </Tag>
                </Col>
                <Col span={12}>
                  <Text type="secondary">标准类型：</Text>
                  <Tag color={(QC_STANDARD_TYPE_MAP[detailItem.standardType] ?? { color: 'default' }).color}>
                    {(QC_STANDARD_TYPE_MAP[detailItem.standardType] ?? { label: detailItem.standardType ?? '-' }).label}
                  </Tag>
                </Col>
                <Col span={12}><Text type="secondary">状态：</Text><Tag color={(STATUS_MAP[detailItem.status] ?? { color: 'default' }).color}>{(STATUS_MAP[detailItem.status] ?? { label: String(detailItem.status ?? '-') }).label}</Tag></Col>
                <Col span={12}><Text type="secondary">必检：</Text><Tag color={detailItem.isRequired ? 'blue' : 'default'}>{detailItem.isRequired ? '是' : '否'}</Tag></Col>
              </Row>
            </Card>

            <Card size="small" title="检验标准">
              {detailItem.standardType === 'NUMERIC' && (
                <Row gutter={[16, 8]}>
                  <Col span={24}><Text type="secondary">标准值描述：</Text><Text strong>{detailItem.standardValue || '—'}</Text></Col>
                  <Col span={8}><Text type="secondary">下限：</Text><Text>{detailItem.minValue ?? '—'} {detailItem.unit}</Text></Col>
                  <Col span={8}><Text type="secondary">上限：</Text><Text>{detailItem.maxValue ?? '—'} {detailItem.unit}</Text></Col>
                  <Col span={8}><Text type="secondary">单位：</Text><Text>{detailItem.unit || '—'}</Text></Col>
                </Row>
              )}
              {detailItem.standardType === 'ENUM' && (
                <>
                  <Text type="secondary">合格选项：</Text>
                  <Space size={4} wrap style={{ marginTop: 4 }}>
                    {(detailItem.enumOptions || []).map(o => <Tag key={o}>{o}</Tag>)}
                  </Space>
                </>
              )}
              {detailItem.standardType === 'BOOLEAN' && (
                <Text type="secondary">判断方式：是/否（通过/不通过）</Text>
              )}
              {detailItem.instrumentType && (
                <div style={{ marginTop: 8 }}>
                  <Text type="secondary">所需量具：</Text>
                  <Tag color="geekblue">{detailItem.instrumentType}</Tag>
                </div>
              )}
              {detailItem.refStandard && (
                <div style={{ marginTop: 8 }}>
                  <Text type="secondary">引用标准：</Text>
                  <Text>{detailItem.refStandard}</Text>
                </div>
              )}
            </Card>

            <Card size="small" title="适用检验类型">
              <Space size={4} wrap>
                {detailItem.applyTypes.map(t => (
                  <Tag key={t} color="geekblue">{QC_APPLY_TYPE_MAP[t]}</Tag>
                ))}
              </Space>
            </Card>

            <Card size="small" title={<Space><LinkOutlined />被引用的质检方案（{refSchemes.length}个）</Space>}>
              {refSchemes.length === 0
                ? <Text type="secondary">暂无方案引用此项目</Text>
                : refSchemes.map(s => (
                  <div key={s.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '6px 0', borderBottom: '1px solid #f0f0f0',
                  }}>
                    <Space>
                      <Text code style={{ fontSize: 11 }}>{s.schemeCode}</Text>
                      <Text style={{ fontSize: 13 }}>{s.schemeName}</Text>
                    </Space>
                    <Tag color="blue" style={{ fontSize: 11 }}>
                      {s.schemeType}
                    </Tag>
                  </div>
                ))
              }
            </Card>

            {detailItem.remark && (
              <Card size="small" title="备注">
                <Text type="secondary">{detailItem.remark}</Text>
              </Card>
            )}

            <div style={{ color: '#bbb', fontSize: 11 }}>
              创建：{detailItem.createdAt} | 更新：{detailItem.updatedAt}
            </div>
          </Space>
        )}
      </Drawer>
    </div>
  );
};

export default QcItemPage;

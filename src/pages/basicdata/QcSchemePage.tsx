/**
 * 质检方案档案
 * 功能：管理质检方案（IQC/IPQC/FQC/OQC等）；方案内添加/排序质检项目；
 *       查看关联的检验任务；一键跳转到质检工作台发起检验
 */
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { getQcSchemeList } from '../../api/qcSchemes';
import { getInspectionItemList, InspectionItemRecord } from '../../api/inspectionItems';
import {
  Button, Input, Select, Modal, message, Tag, Popconfirm,
  Tooltip, Drawer, Space, Table, Row, Col, Card,
  Divider, Alert, Switch, Typography, Badge, Steps,
  InputNumber, Form, Tabs,
} from 'antd';
import {
  PlusOutlined, SearchOutlined, ReloadOutlined,
  EditOutlined, DeleteOutlined, EyeOutlined,
  AuditOutlined, CopyOutlined, ArrowUpOutlined, ArrowDownOutlined,
  CheckCircleOutlined, ExperimentOutlined, SolutionOutlined,
  SafetyCertificateOutlined, AppstoreOutlined, SettingOutlined,
} from '@ant-design/icons';
import {
  QcScheme, QcSchemeItem, QcSchemeType, QcSchemeStatus, QcSamplingType,
  QcItemCategory, QcItem,
  QC_SCHEME_TYPE_MAP, QC_SCHEME_STATUS_MAP, QC_SAMPLING_TYPE_MAP,
  QC_ITEM_CATEGORY_MAP, QC_STANDARD_TYPE_MAP,
  mockQcSchemes, mockQcItems, genQcSchemeCode,
} from './qmsBaseData';
import { mockInspectionTasks } from '../inspection/qmsData';

const { Option } = Select;
const { TextArea } = Input;
const { Text, Title } = Typography;

// ─── 类型 ────────────────────────────────────────────────────

type EditScheme = Partial<QcScheme> & { items: QcSchemeItem[] };

function initScheme(base?: QcScheme): EditScheme {
  if (base) return { ...base, items: base.items.map(i => ({ ...i })) };
  return {
    schemeCode: '',
    schemeName: '',
    schemeType: 'IQC',
    samplingType: 'AQL',
    aqlLevel: '1.0',
    status: 'DRAFT',
    version: 'V1.0',
    effectiveDate: new Date().toISOString().slice(0, 10),
    items: [],
  };
}

// ─── 主组件 ──────────────────────────────────────────────────

// ─── 快速过滤 key ────────────────────────────────────────────
type SchemeQuickFilter = 'ALL' | 'ACTIVE' | 'INACTIVE' | 'IQC' | 'IPQC' | 'FQC_OQC';

const QcSchemePage: React.FC = () => {
  const [schemes, setSchemes] = useState<QcScheme[]>(mockQcSchemes);  // 默认使用mock数据，API成功后替换
  const [apiLoading, setApiLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<QcSchemeType | 'ALL'>('ALL');
  const [filterStatus, setFilterStatus] = useState<QcSchemeStatus | 'ALL'>('ALL');
  const [quickFilter, setQuickFilter] = useState<SchemeQuickFilter>('ALL');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<EditScheme>(initScheme());
  const [isNew, setIsNew] = useState(true);
  const [activeTab, setActiveTab] = useState('basic');

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailScheme, setDetailScheme] = useState<QcScheme | null>(null);

  const [addItemOpen, setAddItemOpen] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [itemSearch, setItemSearch] = useState('');
  const [itemFilterCat, setItemFilterCat] = useState<QcItemCategory | 'ALL'>('ALL');

  // ── 质检项目档案（API加载，mock回退） ────────────────────────────
  const [allQcItems, setAllQcItems] = useState<QcItem[]>(mockQcItems);
  const loadQcItems = useCallback(async () => {
    try {
      const resp = await getInspectionItemList() as any;
      const list: InspectionItemRecord[] = resp?.data ?? [];
      if (list.length > 0) {
        // 双字段回退链：兼容 snake_case (DB直出) 与 camelCase (compat路由)
        // DB 使用扩展分类；映射到 QcItemCategory 合法值
        const API_TO_CAT: Record<string, string> = {
          'APPEARANCE':'APPEARANCE','PHYSICAL':'PHYSICAL','CHEMICAL':'CHEMICAL',
          'MICRO':'MICROBIAL','MICROBIAL':'MICROBIAL',
          'PACKAGING':'DOCUMENT','HEAVY_METAL':'CHEMICAL',
          'RELEASE':'DOCUMENT',
          'SIZE':'SIZE','FUNCTION':'PERFORMANCE','PERFORMANCE':'PERFORMANCE',
          'DOCUMENT':'DOCUMENT','OTHER':'DOCUMENT',
        };
        const mapped: QcItem[] = list.map((it: any) => ({
          id:            String(it.id ?? ''),
          itemCode:      it.itemCode   ?? it.item_code  ?? it.code  ?? String(it.id ?? ''),
          itemName:      it.itemName   ?? it.item_name  ?? it.name  ?? '',
          category:      (API_TO_CAT[it.itemType ?? it.item_type ?? it.category ?? ''] ?? 'APPEARANCE') as QcItemCategory,
          standardType:  'NUMERIC' as any,
          standardValue: it.specText   ?? it.spec_text  ?? it.standard ?? undefined,
          minValue:      it.specMin    ?? it.spec_min   ?? it.minValue  ?? undefined,
          maxValue:      it.specMax    ?? it.spec_max   ?? it.maxValue  ?? undefined,
          unit:          it.unitName   ?? it.unit_name  ?? it.unit  ?? undefined,
          instrumentType: it.testMethod ?? it.test_method ?? it.method ?? undefined,
          isCritical:    it.isKeyItem === 1,
          isRequired:    true,
          applyTypes:    [],
          status:        it.status === 0 ? 'INACTIVE' : 'ACTIVE',
          version:       'V1.0',
          createdAt:     it.createTime?.slice(0, 10) ?? '',
          updatedAt:     it.updateTime?.slice(0, 10) ?? '',
        }));
        setAllQcItems(mapped);
      }
    } catch { /* 保留 mock */ }
  }, []);

  useEffect(() => { loadQcItems(); }, [loadQcItems]);

  // ── 从后端加载质检方案 ────────────────────────────────────
  const loadFromApi = useCallback(async () => {
    setApiLoading(true);
    try {
      const resp = await getQcSchemeList() as any;
      const apiList: any[] = resp.data ?? [];
      if (apiList.length > 0) {
        const mapped: QcScheme[] = apiList.map((item: any) => ({
          id:            item.id?.toString() ?? genQcSchemeCode('IQC'),
          schemeCode:    item.schemeCode ?? item.scheme_code ?? item.id?.toString() ?? '',
          schemeName:    item.schemeName ?? item.scheme_name ?? '',
          schemeType:    (item.schemeType ?? item.scheme_type ?? 'IQC') as QcSchemeType,
          samplingType:  (item.samplingType ?? item.sampling_type ?? 'AQL') as any,
          aqlLevel:      item.aqlLevel ?? item.aql_level ?? '1.0',
          status:        (item.status === 0 || item.status === '0') ? 'INACTIVE' : 'ACTIVE',
          version:       item.version ?? 'V1.0',
          effectiveDate: item.effectiveDate ?? item.effective_date ?? '',
          description:   item.description ?? '',
          createdAt:     item.createTime ? item.createTime.slice(0, 10) : '',
          updatedAt:     item.updateTime ? item.updateTime.slice(0, 10) : '',
          items:         [],
        }));
        setSchemes(mapped);
      }
      // API返回空数组时保持mockQcSchemes，不调用 setSchemes([])
    } catch { /* 保留本地状态（mockQcSchemes） */ } finally { setApiLoading(false); }
  }, []);

  useEffect(() => { loadFromApi(); }, [loadFromApi]);

  // ── 筛选 ──
  const filtered = useMemo(() => {
    return schemes.filter(s => {
      // 快速卡片过滤
      if (quickFilter === 'ACTIVE' && s.status !== 'ACTIVE') return false;
      if (quickFilter === 'INACTIVE' && s.status !== 'INACTIVE') return false;
      if (quickFilter === 'IQC' && s.schemeType !== 'IQC') return false;
      if (quickFilter === 'IPQC' && !['IPQC_FIRST', 'IPQC_PATROL', 'IPQC_SELF', 'IPQC_LAST'].includes(s.schemeType)) return false;
      if (quickFilter === 'FQC_OQC' && !['FQC', 'OQC'].includes(s.schemeType)) return false;
      // 工具栏过滤
      if (filterType !== 'ALL' && s.schemeType !== filterType) return false;
      if (filterStatus !== 'ALL' && s.status !== filterStatus) return false;
      if (search) {
        const q = search.toLowerCase();
        return s.schemeCode.toLowerCase().includes(q) || s.schemeName.toLowerCase().includes(q);
      }
      return true;
    });
  }, [schemes, filterType, filterStatus, search, quickFilter]);

  // 该方案关联的检验任务数
  const taskCount = (schemeId: string) =>
    mockInspectionTasks.filter(t => t.schemeId === schemeId).length;

  // ── CRUD ──
  const openNew = () => {
    const s = initScheme();
    s.schemeCode = genQcSchemeCode('IQC');
    setEditing(s); setIsNew(true); setActiveTab('basic'); setModalOpen(true);
  };

  const openEdit = (scheme: QcScheme) => {
    setEditing(initScheme(scheme)); setIsNew(false); setActiveTab('basic'); setModalOpen(true);
  };

  const openDetail = (scheme: QcScheme) => {
    setDetailScheme(scheme); setDetailOpen(true);
  };

  const openCopy = (scheme: QcScheme) => {
    const copy = initScheme(scheme);
    copy.id = undefined;
    copy.schemeCode = genQcSchemeCode(scheme.schemeType);
    copy.schemeName = `${scheme.schemeName}（副本）`;
    copy.status = 'DRAFT';
    copy.createdAt = undefined;
    copy.updatedAt = undefined;
    setEditing(copy); setIsNew(true); setActiveTab('basic'); setModalOpen(true);
    message.info('已复制方案，请修改编码和名称后保存');
  };

  const handleSave = () => {
    if (!editing.schemeName?.trim()) { message.error('请填写方案名称'); return; }
    if (!editing.schemeCode?.trim()) { message.error('请填写方案编码'); return; }
    if (editing.items.length === 0) { message.error('请至少添加一个检验项目'); return; }
    if (!editing.effectiveDate) { message.error('请填写生效日期'); return; }

    const now = new Date().toLocaleString('zh-CN');
    const saved: QcScheme = {
      id: editing.id || `QSCH${Date.now()}`,
      schemeCode: editing.schemeCode!,
      schemeName: editing.schemeName!,
      schemeType: editing.schemeType as QcSchemeType || 'IQC',
      productModel: editing.productModel,
      materialCode: editing.materialCode,
      operationCode: editing.operationCode,
      operationSeq: editing.operationSeq,
      samplingType: editing.samplingType as QcSamplingType || 'AQL',
      aqlLevel: editing.aqlLevel,
      sampleSize: editing.sampleSize,
      samplePercent: editing.samplePercent,
      items: editing.items,
      status: editing.status as QcSchemeStatus || 'DRAFT',
      version: editing.version || 'V1.0',
      effectiveDate: editing.effectiveDate!,
      expiryDate: editing.expiryDate,
      approvedBy: editing.approvedBy,
      remark: editing.remark,
      createdAt: editing.createdAt || now,
      updatedAt: now,
    };

    if (isNew) {
      setSchemes(prev => [saved, ...prev]);
      message.success(`方案「${saved.schemeName}」已创建`);
    } else {
      setSchemes(prev => prev.map(s => s.id === saved.id ? saved : s));
      message.success(`方案「${saved.schemeName}」已更新`);
    }
    setModalOpen(false);
  };

  const handleDelete = (scheme: QcScheme) => {
    const cnt = taskCount(scheme.id);
    if (cnt > 0) { message.error(`方案有 ${cnt} 个关联检验任务，无法删除`); return; }
    setSchemes(prev => prev.filter(s => s.id !== scheme.id));
    message.success('已删除');
  };

  const handleToggleStatus = (scheme: QcScheme) => {
    const next = scheme.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setSchemes(prev => prev.map(s =>
      s.id === scheme.id ? { ...s, status: next, updatedAt: new Date().toLocaleString('zh-CN') } : s
    ));
    message.success(next === 'ACTIVE' ? '已启用' : '已停用');
  };

  // ── 方案项目操作 ──
  const moveItem = (idx: number, dir: 'up' | 'down') => {
    setEditing(prev => {
      const items = [...prev.items];
      const target = dir === 'up' ? idx - 1 : idx + 1;
      if (target < 0 || target >= items.length) return prev;
      [items[idx], items[target]] = [items[target], items[idx]];
      items.forEach((it, i) => { it.seqNo = i + 1; });
      return { ...prev, items };
    });
  };

  const removeItem = (idx: number) => {
    setEditing(prev => {
      const items = prev.items.filter((_, i) => i !== idx);
      items.forEach((it, i) => { it.seqNo = i + 1; });
      return { ...prev, items };
    });
  };

  const toggleItemEnabled = (idx: number) => {
    setEditing(prev => {
      const items = [...prev.items];
      items[idx] = { ...items[idx], enabled: !items[idx].enabled };
      return { ...prev, items };
    });
  };

  // 打开选择检验项目弹窗
  const openAddItem = () => {
    setSelectedItemIds(editing.items.map(si => si.itemId));
    setItemSearch('');
    setItemFilterCat('ALL');
    setAddItemOpen(true);
  };

  // 候选项目列表（从API档案中过滤，未被禁用）
  const candidateItems = useMemo(() => {
    return allQcItems.filter(it => {
      if (it.status !== 'ACTIVE') return false;
      if (itemFilterCat !== 'ALL' && it.category !== itemFilterCat) return false;
      if (itemSearch) {
        const q = itemSearch.toLowerCase();
        return it.itemCode.toLowerCase().includes(q) || it.itemName.toLowerCase().includes(q);
      }
      return true;
    });
  }, [allQcItems, itemSearch, itemFilterCat]);

  const confirmAddItems = () => {
    const currentIds = editing.items.map(si => si.itemId);
    const toAdd = selectedItemIds.filter(id => !currentIds.includes(id));
    const toRemove = currentIds.filter(id => !selectedItemIds.includes(id));

    setEditing(prev => {
      let items = prev.items.filter(si => !toRemove.includes(si.itemId));
      toAdd.forEach(id => {
        const qcItem = allQcItems.find(i => i.id === id)!;
        items.push({
          seqNo: items.length + 1,
          itemId: qcItem.id,
          itemCode: qcItem.itemCode,
          itemName: qcItem.itemName,
          category: qcItem.category,
          standardType: qcItem.standardType,
          standardValue: qcItem.standardValue,
          minValue: qcItem.minValue,
          maxValue: qcItem.maxValue,
          enumOptions: qcItem.enumOptions,
          unit: qcItem.unit,
          instrumentType: qcItem.instrumentType,
          isCritical: qcItem.isCritical,
          isRequired: qcItem.isRequired,
          enabled: true,
        });
      });
      items.forEach((it, i) => { it.seqNo = i + 1; });
      return { ...prev, items };
    });
    setAddItemOpen(false);
    message.success('检验项目已更新');
  };

  // 方案类型变更时自动更新编码
  const handleTypeChange = (type: QcSchemeType) => {
    setEditing(prev => ({ ...prev, schemeType: type, schemeCode: genQcSchemeCode(type) }));
  };

  // ── 表格列 ──
  const ALL_TYPES = Object.keys(QC_SCHEME_TYPE_MAP) as QcSchemeType[];

  const columns = [
    {
      title: '方案编码', dataIndex: 'schemeCode', width: 160,
      render: (v: string) => <Text code style={{ fontSize: 12 }}>{v}</Text>,
    },
    {
      title: '方案名称', dataIndex: 'schemeName', width: 200,
      render: (v: string) => <Text strong style={{ fontSize: 13 }}>{v}</Text>,
    },
    {
      title: '检验类型', dataIndex: 'schemeType', width: 120,
      render: (v: QcSchemeType) => {
        const m = QC_SCHEME_TYPE_MAP[v] ?? { color: 'default', label: v ?? '-' };
        return (
          <Tag color={m.color} style={{ fontSize: 11 }}>
            {m.label}
          </Tag>
        );
      },
    },
    {
      title: '适用对象', width: 160,
      render: (_: unknown, r: QcScheme) => (
        <Space direction="vertical" size={2}>
          {r.productModel && <Text style={{ fontSize: 12 }}>产品：{r.productModel}</Text>}
          {r.materialCode && <Text style={{ fontSize: 12 }}>物料：{r.materialCode}</Text>}
          {r.operationCode && <Text style={{ fontSize: 12 }}>工序：{r.operationCode}</Text>}
          {!r.productModel && !r.materialCode && !r.operationCode &&
            <Text type="secondary" style={{ fontSize: 12 }}>通用</Text>}
        </Space>
      ),
    },
    {
      title: '抽样规则', width: 130,
      render: (_: unknown, r: QcScheme) => (
        <Space direction="vertical" size={2}>
          <Text style={{ fontSize: 12 }}>{QC_SAMPLING_TYPE_MAP[r.samplingType]}</Text>
          {r.aqlLevel && <Text type="secondary" style={{ fontSize: 11 }}>AQL {r.aqlLevel}</Text>}
          {r.sampleSize && <Text type="secondary" style={{ fontSize: 11 }}>n={r.sampleSize}</Text>}
        </Space>
      ),
    },
    {
      title: '项目数', width: 80, align: 'center' as const,
      render: (_: unknown, r: QcScheme) => (
        <Space direction="vertical" size={0} style={{ textAlign: 'center' }}>
          <Badge count={r.items.length} style={{ backgroundColor: '#1890ff' }} />
          <Text style={{ fontSize: 10, color: '#888' }}>
            关键{r.items.filter(i => i.isCritical).length}项
          </Text>
        </Space>
      ),
    },
    {
      title: '关联任务', width: 80, align: 'center' as const,
      render: (_: unknown, r: QcScheme) => {
        const cnt = taskCount(r.id);
        return cnt > 0
          ? <Badge count={cnt} style={{ backgroundColor: '#52c41a' }} />
          : <Text type="secondary">—</Text>;
      },
    },
    {
      title: '版本/生效日期', width: 120,
      render: (_: unknown, r: QcScheme) => (
        <Space direction="vertical" size={2}>
          <Tag color="geekblue" style={{ fontSize: 11 }}>{r.version}</Tag>
          <Text type="secondary" style={{ fontSize: 11 }}>{r.effectiveDate}</Text>
        </Space>
      ),
    },
    {
      title: '状态', dataIndex: 'status', width: 80,
      render: (v: QcSchemeStatus, r: QcScheme) => (
        <Tag
          color={(QC_SCHEME_STATUS_MAP[v] ?? { color: 'default' }).color}
          style={{ cursor: 'pointer', fontSize: 12 }}
          onClick={() => handleToggleStatus(r)}
        >
          {(QC_SCHEME_STATUS_MAP[v] ?? { label: String(v ?? '-') }).label}
        </Tag>
      ),
    },
    {
      title: '操作', width: 160, fixed: 'right' as const,
      render: (_: unknown, r: QcScheme) => (
        <Space size={4}>
          <Tooltip title="查看详情">
            <Button size="small" icon={<EyeOutlined />} onClick={() => openDetail(r)} />
          </Tooltip>
          <Tooltip title="编辑">
            <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)} />
          </Tooltip>
          <Tooltip title="复制">
            <Button size="small" icon={<CopyOutlined />} onClick={() => openCopy(r)} />
          </Tooltip>
          <Popconfirm
            title={`确认删除「${r.schemeName}」？`}
            description={taskCount(r.id) > 0 ? '该方案有关联检验任务，无法删除' : '删除后不可恢复'}
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

  // 方案内检验项目表格列
  const itemColumns = [
    { title: '序号', dataIndex: 'seqNo', width: 55, align: 'center' as const },
    {
      title: '项目编码', dataIndex: 'itemCode', width: 140,
      render: (v: string) => <Text code style={{ fontSize: 11 }}>{v}</Text>,
    },
    {
      title: '项目名称', dataIndex: 'itemName', width: 140,
      render: (v: string, r: QcSchemeItem) => (
        <Space>
          <Text style={{ fontSize: 13 }}>{v}</Text>
          {r.isCritical && <Tag color="red" style={{ fontSize: 10, padding: '0 3px' }}>关键</Tag>}
        </Space>
      ),
    },
    {
      title: '大类', dataIndex: 'category', width: 75,
      render: (v: QcItemCategory) => {
        const m = QC_ITEM_CATEGORY_MAP[v] ?? { color: 'default', label: v ?? '-' };
        return (
          <Tag color={m.color} style={{ fontSize: 10, padding: '0 4px' }}>
            {m.label}
          </Tag>
        );
      },
    },
    {
      title: '标准值', width: 160,
      render: (_: unknown, r: QcSchemeItem) => {
        if (r.standardType === 'NUMERIC') {
          return <Text style={{ fontSize: 12 }}>{r.standardValue || '—'}{r.unit ? ` ${r.unit}` : ''}</Text>;
        }
        if (r.standardType === 'ENUM') {
          return <Text style={{ fontSize: 12 }}>{(r.enumOptions || []).join(' / ')}</Text>;
        }
        return <Text type="secondary" style={{ fontSize: 12 }}>是/否</Text>;
      },
    },
    {
      title: '量具', dataIndex: 'instrumentType', width: 90,
      render: (v?: string) => v ? <Text style={{ fontSize: 12 }}>{v}</Text> : <Text type="secondary">—</Text>,
    },
    {
      title: '启用', width: 65, align: 'center' as const,
      render: (_: unknown, r: QcSchemeItem, idx: number) => (
        <Switch
          size="small"
          checked={r.enabled}
          onChange={() => toggleItemEnabled(idx)}
        />
      ),
    },
    {
      title: '排序', width: 80, align: 'center' as const,
      render: (_: unknown, __: QcSchemeItem, idx: number) => (
        <Space size={2}>
          <Button
            size="small"
            icon={<ArrowUpOutlined />}
            onClick={() => moveItem(idx, 'up')}
            disabled={idx === 0}
          />
          <Button
            size="small"
            icon={<ArrowDownOutlined />}
            onClick={() => moveItem(idx, 'down')}
            disabled={idx === editing.items.length - 1}
          />
        </Space>
      ),
    },
    {
      title: '删除', width: 60, align: 'center' as const,
      render: (_: unknown, __: QcSchemeItem, idx: number) => (
        <Popconfirm title="从方案中移除该项目？" onConfirm={() => removeItem(idx)} okText="移除">
          <Button size="small" icon={<DeleteOutlined />} danger />
        </Popconfirm>
      ),
    },
  ];

  // 关联任务
  const detailTasks = detailScheme
    ? mockInspectionTasks.filter(t => t.schemeId === detailScheme.id)
    : [];

  // ── 统计 ──
  const stats = useMemo(() => ({
    total: schemes.length,
    active: schemes.filter(s => s.status === 'ACTIVE').length,
    inactive: schemes.filter(s => s.status === 'INACTIVE').length,
    iqc: schemes.filter(s => s.schemeType === 'IQC').length,
    ipqc: schemes.filter(s => ['IPQC_FIRST', 'IPQC_PATROL', 'IPQC_SELF', 'IPQC_LAST'].includes(s.schemeType)).length,
    fqc: schemes.filter(s => ['FQC', 'OQC'].includes(s.schemeType)).length,
  }), [schemes]);

  // 快速过滤卡片定义
  const quickCards: { key: SchemeQuickFilter; label: string; value: number; color: string }[] = [
    { key: 'ALL',     label: '全部方案',  value: stats.total,    color: '#1890ff' },
    { key: 'ACTIVE',  label: '启用中',    value: stats.active,   color: '#52c41a' },
    { key: 'INACTIVE',label: '已停用',    value: stats.inactive, color: '#8c8c8c' },
    { key: 'IQC',     label: 'IQC 来料', value: stats.iqc,      color: '#2f54eb' },
    { key: 'IPQC',    label: 'IPQC 过程', value: stats.ipqc,    color: '#722ed1' },
    { key: 'FQC_OQC', label: 'FQC / OQC', value: stats.fqc,    color: '#fa8c16' },
  ];

  const handleQuickFilter = (key: SchemeQuickFilter) => {
    // 再次点击同一卡片 → 回全部
    setQuickFilter(prev => prev === key ? 'ALL' : key);
  };

  return (
    <div style={{ padding: '0 0 24px' }}>
      {/* 统计卡片（点击快速过滤） */}
      <Row gutter={12} style={{ marginBottom: 16 }}>
        {quickCards.map(c => {
          const isActive = quickFilter === c.key;
          return (
            <Col key={c.key} xs={12} sm={4} style={{ marginBottom: 8 }}>
              <Card
                size="small"
                onClick={() => handleQuickFilter(c.key)}
                style={{
                  textAlign: 'center',
                  borderTop: `3px solid ${c.color}`,
                  cursor: 'pointer',
                  background: isActive ? `${c.color}12` : '#fff',
                  boxShadow: isActive ? `0 0 0 2px ${c.color}` : undefined,
                  transition: 'all 0.2s',
                  userSelect: 'none',
                }}
              >
                <div style={{ fontSize: 22, fontWeight: 700, color: c.color, lineHeight: 1.2 }}>{c.value}</div>
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
              <Select value={filterType} onChange={v => setFilterType(v)} style={{ width: 160 }}>
                <Option value="ALL">全部类型</Option>
                {ALL_TYPES.map(t => (
                  <Option key={t} value={t}>{QC_SCHEME_TYPE_MAP[t].label}</Option>
                ))}
              </Select>
              <Select value={filterStatus} onChange={v => setFilterStatus(v)} style={{ width: 110 }}>
                <Option value="ALL">全部状态</Option>
                <Option value="ACTIVE">启用中</Option>
                <Option value="DRAFT">草稿</Option>
                <Option value="INACTIVE">已停用</Option>
              </Select>
              <Button icon={<ReloadOutlined />} loading={apiLoading} onClick={() => {
                setSearch(''); setFilterType('ALL'); setFilterStatus('ALL'); setQuickFilter('ALL'); loadFromApi();
              }}>刷新</Button>
            </Space>
          </Col>
          <Col>
            <Button type="primary" icon={<PlusOutlined />} onClick={openNew}>
              新建方案
            </Button>
          </Col>
        </Row>
      </Card>

      <Alert
        type="info" showIcon style={{ marginBottom: 12, fontSize: 12 }}
        message={
          <span>
            质检方案由多个<Text strong>质检项目</Text>组成，每种检验类型（IQC/IPQC/FQC/OQC）可建立多个方案。
            方案启用后，可在<Text strong style={{ color: '#1890ff' }}>质检工作台</Text>中选择方案创建检验任务。
          </span>
        }
      />

      {/* 主表格 */}
      <Table
        dataSource={filtered}
        columns={columns}
        rowKey="id"
        size="small"
        scroll={{ x: 1400 }}
        pagination={{ pageSize: 10, showSizeChanger: true, showTotal: t => `共 ${t} 条` }}
        expandable={{
          expandedRowRender: (record: QcScheme) => (
            <div style={{ padding: '8px 16px', background: '#fafafa' }}>
              <Text strong style={{ fontSize: 12 }}>检验项目预览：</Text>
              <Space size={4} wrap style={{ marginTop: 6 }}>
                {record.items.filter(i => i.enabled).map(item => (
                  <Tag
                    key={item.itemId}
                    color={item.isCritical ? 'red' : (QC_ITEM_CATEGORY_MAP[item.category] ?? { color: 'default' }).color}
                    style={{ fontSize: 11 }}
                  >
                    {item.seqNo}. {item.itemName}
                    {item.unit ? ` (${item.unit})` : ''}
                  </Tag>
                ))}
              </Space>
            </div>
          ),
        }}
      />

      {/* ─── 新建/编辑 Modal ─── */}
      <Modal
        title={isNew ? '新建质检方案' : `编辑方案 — ${editing.schemeName}`}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => setModalOpen(false)}
        width={860}
        okText="保存方案"
        cancelText="取消"
        destroyOnClose
        styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'basic',
              label: <span><SettingOutlined /> 基本信息</span>,
              children: (
                <Row gutter={16}>
                  <Col span={12}>
                    <div style={{ marginBottom: 12 }}>
                      <label style={{ fontSize: 13, fontWeight: 600 }}>方案编码 <span style={{ color: '#ff4d4f' }}>*</span></label>
                      <Input
                        value={editing.schemeCode}
                        onChange={e => setEditing(p => ({ ...p, schemeCode: e.target.value }))}
                        style={{ marginTop: 4 }}
                        placeholder="自动生成，可修改"
                      />
                    </div>
                  </Col>
                  <Col span={12}>
                    <div style={{ marginBottom: 12 }}>
                      <label style={{ fontSize: 13, fontWeight: 600 }}>方案名称 <span style={{ color: '#ff4d4f' }}>*</span></label>
                      <Input
                        value={editing.schemeName}
                        onChange={e => setEditing(p => ({ ...p, schemeName: e.target.value }))}
                        style={{ marginTop: 4 }}
                        placeholder="如：VitC咋嘌片来料检验方案"
                      />
                    </div>
                  </Col>
                  <Col span={12}>
                    <div style={{ marginBottom: 12 }}>
                      <label style={{ fontSize: 13, fontWeight: 600 }}>检验类型 <span style={{ color: '#ff4d4f' }}>*</span></label>
                      <Select
                        value={editing.schemeType}
                        onChange={handleTypeChange}
                        style={{ width: '100%', marginTop: 4 }}
                      >
                        {(Object.keys(QC_SCHEME_TYPE_MAP) as QcSchemeType[]).map(t => (
                          <Option key={t} value={t}>
                            <Tag color={QC_SCHEME_TYPE_MAP[t].color} style={{ marginRight: 4 }}>
                              {QC_SCHEME_TYPE_MAP[t].shortLabel}
                            </Tag>
                            {QC_SCHEME_TYPE_MAP[t].label}
                          </Option>
                        ))}
                      </Select>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div style={{ marginBottom: 12 }}>
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
                  <Col span={8}>
                    <div style={{ marginBottom: 12 }}>
                      <label style={{ fontSize: 13, fontWeight: 600 }}>适用产品型号</label>
                      <Input
                        value={editing.productModel}
                        onChange={e => setEditing(p => ({ ...p, productModel: e.target.value }))}
                        style={{ marginTop: 4 }}
                        placeholder="如：VitC咋嘌片 / 复合益生菌胶囊"
                      />
                    </div>
                  </Col>
                  <Col span={8}>
                    <div style={{ marginBottom: 12 }}>
                      <label style={{ fontSize: 13, fontWeight: 600 }}>适用物料编码（IQC）</label>
                      <Input
                        value={editing.materialCode}
                        onChange={e => setEditing(p => ({ ...p, materialCode: e.target.value }))}
                        style={{ marginTop: 4 }}
                        placeholder="如：MAT-NiTi"
                      />
                    </div>
                  </Col>
                  <Col span={8}>
                    <div style={{ marginBottom: 12 }}>
                      <label style={{ fontSize: 13, fontWeight: 600 }}>适用工序编码（IPQC）</label>
                      <Input
                        value={editing.operationCode}
                        onChange={e => setEditing(p => ({ ...p, operationCode: e.target.value }))}
                        style={{ marginTop: 4 }}
                        placeholder="如：PKG-04-PRESS"
                      />
                    </div>
                  </Col>

                  <Col span={12}>
                    <div style={{ marginBottom: 12 }}>
                      <label style={{ fontSize: 13, fontWeight: 600 }}>抽样方式 <span style={{ color: '#ff4d4f' }}>*</span></label>
                      <Select
                        value={editing.samplingType}
                        onChange={v => setEditing(p => ({ ...p, samplingType: v }))}
                        style={{ width: '100%', marginTop: 4 }}
                      >
                        {(Object.keys(QC_SAMPLING_TYPE_MAP) as QcSamplingType[]).map(t => (
                          <Option key={t} value={t}>{QC_SAMPLING_TYPE_MAP[t]}</Option>
                        ))}
                      </Select>
                    </div>
                  </Col>
                  <Col span={12}>
                    {editing.samplingType === 'AQL' && (
                      <div style={{ marginBottom: 12 }}>
                        <label style={{ fontSize: 13, fontWeight: 600 }}>AQL水平</label>
                        <Select
                          value={editing.aqlLevel}
                          onChange={v => setEditing(p => ({ ...p, aqlLevel: v }))}
                          style={{ width: '100%', marginTop: 4 }}
                        >
                          {['0.065', '0.1', '0.15', '0.25', '0.40', '0.65', '1.0', '1.5', '2.5', '4.0', '6.5'].map(l => (
                            <Option key={l} value={l}>AQL {l}</Option>
                          ))}
                        </Select>
                      </div>
                    )}
                    {editing.samplingType === 'FIXED' && (
                      <div style={{ marginBottom: 12 }}>
                        <label style={{ fontSize: 13, fontWeight: 600 }}>固定样本量</label>
                        <InputNumber
                          value={editing.sampleSize}
                          onChange={v => setEditing(p => ({ ...p, sampleSize: v ?? undefined }))}
                          style={{ width: '100%', marginTop: 4 }}
                          min={1}
                          placeholder="如：5"
                        />
                      </div>
                    )}
                    {editing.samplingType === 'PERCENT' && (
                      <div style={{ marginBottom: 12 }}>
                        <label style={{ fontSize: 13, fontWeight: 600 }}>抽样比例（%）</label>
                        <InputNumber
                          value={editing.samplePercent}
                          onChange={v => setEditing(p => ({ ...p, samplePercent: v ?? undefined }))}
                          style={{ width: '100%', marginTop: 4 }}
                          min={1} max={100}
                          placeholder="如：10"
                        />
                      </div>
                    )}
                  </Col>

                  <Col span={8}>
                    <div style={{ marginBottom: 12 }}>
                      <label style={{ fontSize: 13, fontWeight: 600 }}>版本号</label>
                      <Input
                        value={editing.version}
                        onChange={e => setEditing(p => ({ ...p, version: e.target.value }))}
                        style={{ marginTop: 4 }}
                        placeholder="如：V1.0"
                      />
                    </div>
                  </Col>
                  <Col span={8}>
                    <div style={{ marginBottom: 12 }}>
                      <label style={{ fontSize: 13, fontWeight: 600 }}>生效日期 <span style={{ color: '#ff4d4f' }}>*</span></label>
                      <Input
                        type="date"
                        value={editing.effectiveDate}
                        onChange={e => setEditing(p => ({ ...p, effectiveDate: e.target.value }))}
                        style={{ marginTop: 4 }}
                      />
                    </div>
                  </Col>
                  <Col span={8}>
                    <div style={{ marginBottom: 12 }}>
                      <label style={{ fontSize: 13, fontWeight: 600 }}>失效日期</label>
                      <Input
                        type="date"
                        value={editing.expiryDate}
                        onChange={e => setEditing(p => ({ ...p, expiryDate: e.target.value }))}
                        style={{ marginTop: 4 }}
                      />
                    </div>
                  </Col>
                  <Col span={12}>
                    <div style={{ marginBottom: 12 }}>
                      <label style={{ fontSize: 13, fontWeight: 600 }}>审批人</label>
                      <Input
                        value={editing.approvedBy}
                        onChange={e => setEditing(p => ({ ...p, approvedBy: e.target.value }))}
                        style={{ marginTop: 4 }}
                        placeholder="如：张伟 (QA经理)"
                      />
                    </div>
                  </Col>
                  <Col span={24}>
                    <div style={{ marginBottom: 12 }}>
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
              ),
            },
            {
              key: 'items',
              label: (
                <span>
                  <ExperimentOutlined /> 检验项目
                  <Badge count={editing.items.length} style={{ marginLeft: 6, backgroundColor: '#1890ff' }} />
                </span>
              ),
              children: (
                <div>
                  <div style={{ marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Space>
                      <Text strong>已选检验项目（{editing.items.length}个，关键{editing.items.filter(i => i.isCritical).length}个）</Text>
                      {editing.items.length === 0 && (
                        <Tag color="warning">请至少添加1个检验项目</Tag>
                      )}
                    </Space>
                    <Button type="primary" icon={<PlusOutlined />} size="small" onClick={openAddItem}>
                      添加项目
                    </Button>
                  </div>
                  {editing.items.length > 0 ? (
                    <Table
                      dataSource={editing.items}
                      columns={itemColumns}
                      rowKey="itemId"
                      size="small"
                      pagination={false}
                      scroll={{ x: 750 }}
                      rowClassName={r => !r.enabled ? 'ant-table-row-disabled' : ''}
                    />
                  ) : (
                    <Alert
                      message="暂无检验项目"
                      description="点击「添加项目」从质检项目档案中选择项目加入本方案"
                      type="warning"
                      showIcon
                    />
                  )}
                </div>
              ),
            },
          ]}
        />
      </Modal>

      {/* ─── 选择质检项目 Modal ─── */}
      <Modal
        title="从质检项目档案中选择"
        open={addItemOpen}
        onOk={confirmAddItems}
        onCancel={() => setAddItemOpen(false)}
        width={760}
        okText="确认添加"
        cancelText="取消"
      >
        <Space style={{ marginBottom: 10 }} size={8} wrap>
          <Input
            prefix={<SearchOutlined />}
            placeholder="搜索项目编码/名称"
            value={itemSearch}
            onChange={e => setItemSearch(e.target.value)}
            allowClear
            style={{ width: 220 }}
          />
          <Select value={itemFilterCat} onChange={v => setItemFilterCat(v)} style={{ width: 110 }}>
            <Option value="ALL">全部大类</Option>
            {(Object.keys(QC_ITEM_CATEGORY_MAP) as QcItemCategory[]).map(c => (
              <Option key={c} value={c}>{QC_ITEM_CATEGORY_MAP[c].label}</Option>
            ))}
          </Select>
        </Space>
        <Table
          dataSource={candidateItems}
          rowKey="id"
          size="small"
          scroll={{ x: 600 }}
          pagination={{ pageSize: 8 }}
          rowSelection={{
            type: 'checkbox',
            selectedRowKeys: selectedItemIds,
            onChange: keys => setSelectedItemIds(keys as string[]),
          }}
          columns={[
            { title: '编码', dataIndex: 'itemCode', width: 140, render: (v: string) => <Text code style={{ fontSize: 11 }}>{v}</Text> },
            {
              title: '名称', dataIndex: 'itemName', width: 130,
              render: (v: string, r: any) => (
                <Space>
                  <Text style={{ fontSize: 13 }}>{v}</Text>
                  {r.isCritical && <Tag color="red" style={{ fontSize: 10, padding: '0 3px' }}>关键</Tag>}
                </Space>
              ),
            },
            {
              title: '大类', dataIndex: 'category', width: 70,
              render: (v: QcItemCategory) => {
                const m = QC_ITEM_CATEGORY_MAP[v] ?? { color: 'default', label: v ?? '-' };
                return <Tag color={m.color} style={{ fontSize: 10 }}>{m.label}</Tag>;
              },
            },
            {
              title: '标准值', width: 160,
              render: (_: unknown, r: any) => {
                if (r.standardType === 'NUMERIC') return <Text style={{ fontSize: 11 }}>{r.standardValue || '—'}{r.unit ? ` ${r.unit}` : ''}</Text>;
                if (r.standardType === 'ENUM') return <Text style={{ fontSize: 11 }}>{(r.enumOptions || []).join(' / ')}</Text>;
                return <Text type="secondary" style={{ fontSize: 11 }}>是/否</Text>;
              },
            },
            { title: '量具', dataIndex: 'instrumentType', width: 80, render: (v?: string) => <Text style={{ fontSize: 11 }}>{v || '—'}</Text> },
          ]}
        />
      </Modal>

      {/* ─── 详情 Drawer ─── */}
      <Drawer
        title={<Space><SafetyCertificateOutlined /><span>质检方案详情</span></Space>}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        width={640}
      >
        {detailScheme && (
          <Space direction="vertical" style={{ width: '100%' }} size={14}>
            {/* 方案信息 */}
            <Card size="small" title="方案信息">
              <Row gutter={[16, 10]}>
                <Col span={24}>
                  <Text strong style={{ fontSize: 16 }}>{detailScheme.schemeName}</Text>
                  <Tag color={(QC_SCHEME_TYPE_MAP[detailScheme.schemeType] ?? { color: 'default' }).color} style={{ marginLeft: 8 }}>
                    {(QC_SCHEME_TYPE_MAP[detailScheme.schemeType] ?? { label: detailScheme.schemeType ?? '-' }).label}
                  </Tag>
                  <Tag color={(QC_SCHEME_STATUS_MAP[detailScheme.status] ?? { color: 'default' }).color}>{(QC_SCHEME_STATUS_MAP[detailScheme.status] ?? { label: String(detailScheme.status ?? '-') }).label}</Tag>
                </Col>
                <Col span={12}><Text type="secondary">编码：</Text><Text code>{detailScheme.schemeCode}</Text></Col>
                <Col span={12}><Text type="secondary">版本：</Text><Tag color="geekblue">{detailScheme.version}</Tag></Col>
                <Col span={12}><Text type="secondary">生效日期：</Text><Text>{detailScheme.effectiveDate}</Text></Col>
                {detailScheme.expiryDate && <Col span={12}><Text type="secondary">失效日期：</Text><Text>{detailScheme.expiryDate}</Text></Col>}
                {detailScheme.productModel && <Col span={12}><Text type="secondary">适用产品：</Text><Text>{detailScheme.productModel}</Text></Col>}
                {detailScheme.materialCode && <Col span={12}><Text type="secondary">适用物料：</Text><Text code>{detailScheme.materialCode}</Text></Col>}
                {detailScheme.operationCode && <Col span={12}><Text type="secondary">适用工序：</Text><Text code>{detailScheme.operationCode}</Text></Col>}
                <Col span={12}>
                  <Text type="secondary">抽样方式：</Text>
                  <Text>{QC_SAMPLING_TYPE_MAP[detailScheme.samplingType]}</Text>
                  {detailScheme.aqlLevel && <Text type="secondary"> (AQL {detailScheme.aqlLevel})</Text>}
                  {detailScheme.sampleSize && <Text type="secondary"> (n={detailScheme.sampleSize})</Text>}
                </Col>
                {detailScheme.approvedBy && <Col span={12}><Text type="secondary">审批人：</Text><Text>{detailScheme.approvedBy}</Text></Col>}
              </Row>
            </Card>

            {/* 检验项目列表 */}
            <Card size="small" title={`检验项目（${detailScheme.items.length}项）`}>
              {detailScheme.items.map((item, idx) => (
                <div key={item.itemId} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '8px 0', borderBottom: idx < detailScheme.items.length - 1 ? '1px solid #f0f0f0' : 'none',
                }}>
                  <Space>
                    <Text type="secondary" style={{ width: 24 }}>{item.seqNo}.</Text>
                    <Tag color={item.isCritical ? 'red' : (QC_ITEM_CATEGORY_MAP[item.category] ?? { color: 'default' }).color} style={{ fontSize: 11 }}>
                      {(QC_ITEM_CATEGORY_MAP[item.category] ?? { label: item.category ?? '-' }).label}
                    </Tag>
                    <Text style={{ fontSize: 13 }}>{item.itemName}</Text>
                    {!item.enabled && <Tag color="default" style={{ fontSize: 10 }}>已禁用</Tag>}
                  </Space>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {item.standardType === 'NUMERIC' && `${item.standardValue || '—'}${item.unit ? ' ' + item.unit : ''}`}
                    {item.standardType === 'ENUM' && (item.enumOptions || []).join('/')}
                    {item.standardType === 'BOOLEAN' && '是/否'}
                  </Text>
                </div>
              ))}
            </Card>

            {/* 关联检验任务 */}
            <Card size="small" title={`关联检验任务（${detailTasks.length}个）`}>
              {detailTasks.length === 0
                ? <Text type="secondary">暂无关联检验任务</Text>
                : detailTasks.map(task => (
                  <div key={task.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '6px 0', borderBottom: '1px solid #f0f0f0',
                  }}>
                    <Space>
                      <Text code style={{ fontSize: 11 }}>{task.taskNo}</Text>
                      <Text style={{ fontSize: 12 }}>{task.productModel || task.batchNo}</Text>
                    </Space>
                    <Space>
                      <Tag color={task.status === 'COMPLETED' ? 'success' : task.status === 'DOING' ? 'processing' : 'default'} style={{ fontSize: 11 }}>
                        {task.status === 'COMPLETED' ? '已完成' : task.status === 'DOING' ? '检验中' : task.status === 'PENDING' ? '待检验' : task.status}
                      </Tag>
                      {task.conclusion && (
                        <Tag color={task.conclusion === 'PASS' ? 'success' : 'error'} style={{ fontSize: 11 }}>
                          {task.conclusion === 'PASS' ? '合格' : '不合格'}
                        </Tag>
                      )}
                    </Space>
                  </div>
                ))
              }
            </Card>

            {detailScheme.remark && (
              <Card size="small" title="备注">
                <Text type="secondary">{detailScheme.remark}</Text>
              </Card>
            )}

            <div style={{ color: '#bbb', fontSize: 11 }}>
              创建：{detailScheme.createdAt} | 更新：{detailScheme.updatedAt}
            </div>
          </Space>
        )}
      </Drawer>
    </div>
  );
};

export default QcSchemePage;

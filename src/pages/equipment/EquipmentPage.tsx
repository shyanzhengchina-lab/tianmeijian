import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { getEquipmentList } from '../../api/equipment';
import { getWorkshopList } from '../../api/workshops';
import { getWorkCenterList } from '../../api/workCenters';
import {
  Table, Button, Input, Select, Space, Tag, Popconfirm, message,
  Row, Col, Modal, Form, Badge, Tooltip, Divider, InputNumber, Descriptions,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined, SearchOutlined, ReloadOutlined, EditOutlined,
  DeleteOutlined, EyeOutlined, CheckCircleOutlined, StopOutlined,
  ExclamationCircleOutlined, ToolOutlined, SettingOutlined,
  CalendarOutlined, WarningOutlined,
} from '@ant-design/icons';

const { Option } = Select;
const { TextArea } = Input;

// ── Types ─────────────────────────────────────────────────
type EquipStatus = 'ACTIVE' | 'DISABLED' | 'MAINTENANCE' | 'SCRAPPED';
type EquipCategory = 'MACHINE' | 'INSPECT' | 'CLEAN' | 'PACK' | 'OTHER';

interface Equipment {
  id: string;
  equipCode: string;
  equipName: string;
  category: EquipCategory;
  model: string;
  brand: string;
  workshop: string;
  workCenter: string;
  location: string;
  purchaseDate: string;
  warrantyDate: string;
  lastMaintDate: string;
  nextMaintDate: string;
  status: EquipStatus;
  precision?: string;
  remark?: string;
  createdAt: string;
  updatedAt: string;
}

const CATEGORY_MAP: Record<EquipCategory, { label: string; color: string }> = {
  MACHINE:  { label: '加工设备', color: '#1677FF' },
  INSPECT:  { label: '检测设备', color: '#FA8C16' },
  CLEAN:    { label: '清洗设备', color: '#13C2C2' },
  PACK:     { label: '包装设备', color: '#52C41A' },
  OTHER:    { label: '其他设备', color: '#8C8C8C' },
};

const STATUS_MAP: Record<EquipStatus, { label: string; color: string; badge: any }> = {
  ACTIVE:      { label: '正常使用', color: '#52C41A', badge: 'success' },
  DISABLED:    { label: '已停用',   color: '#8C8C8C', badge: 'default' },
  MAINTENANCE: { label: '维修中',   color: '#FAAD14', badge: 'warning' },
  SCRAPPED:    { label: '已报废',   color: '#FF4D4F', badge: 'error'   },
};

const genId = () => `eq_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

// ── Mock Data ──────────────────────────────────────────────
const initData: Equipment[] = [
  {
    id: 'eq-001', equipCode: 'EQ-GRIND-001', equipName: '数控五轴磨床',
    category: 'MACHINE', model: 'WALTER HELITRONIC POWER', brand: '瓦尔特',
    workshop: '精密加工车间', workCenter: 'WC-GRIND-01', location: 'A区-01号',
    purchaseDate: '2023-06-01', warrantyDate: '2026-06-01',
    lastMaintDate: '2026-03-15', nextMaintDate: '2026-06-15',
    status: 'ACTIVE', precision: '±0.002mm',
    remark: '主要用于根管锉锥度磨削，瓶颈设备',
    createdAt: '2023-06-01', updatedAt: '2026-03-15',
  },
  {
    id: 'eq-002', equipCode: 'EQ-GRIND-002', equipName: '数控五轴磨床',
    category: 'MACHINE', model: 'WALTER HELITRONIC POWER', brand: '瓦尔特',
    workshop: '精密加工车间', workCenter: 'WC-GRIND-01', location: 'A区-02号',
    purchaseDate: '2023-08-01', warrantyDate: '2026-08-01',
    lastMaintDate: '2026-03-15', nextMaintDate: '2026-06-15',
    status: 'ACTIVE', precision: '±0.002mm',
    remark: '',
    createdAt: '2023-08-01', updatedAt: '2026-03-15',
  },
  {
    id: 'eq-003', equipCode: 'EQ-HT-001', equipName: '镍钛丝热处理炉',
    category: 'MACHINE', model: 'KSL-1400X', brand: '科晶',
    workshop: '热处理车间', workCenter: 'WC-HT-01', location: 'B区-01号',
    purchaseDate: '2023-03-01', warrantyDate: '2026-03-01',
    lastMaintDate: '2026-02-10', nextMaintDate: '2026-05-10',
    status: 'ACTIVE', precision: '±2℃',
    remark: '特殊工序设备，需定期校准温控系统',
    createdAt: '2023-03-01', updatedAt: '2026-02-10',
  },
  {
    id: 'eq-004', equipCode: 'EQ-COAT-001', equipName: 'PVD镀膜机',
    category: 'MACHINE', model: 'PLATIT π80', brand: 'PLATIT',
    workshop: '涂层车间', workCenter: 'WC-COAT-01', location: 'C区-01号',
    purchaseDate: '2022-10-01', warrantyDate: '2025-10-01',
    lastMaintDate: '2026-01-20', nextMaintDate: '2026-04-20',
    status: 'MAINTENANCE', precision: '',
    remark: '靶材更换中，预计4月25日恢复',
    createdAt: '2022-10-01', updatedAt: '2026-04-20',
  },
  {
    id: 'eq-005', equipCode: 'EQ-LASER-001', equipName: '光纤激光打标机',
    category: 'MACHINE', model: 'JPT M7 20W', brand: '杰普特',
    workshop: '标识车间', workCenter: 'WC-LASER-01', location: 'D区-01号',
    purchaseDate: '2024-01-15', warrantyDate: '2027-01-15',
    lastMaintDate: '2026-03-01', nextMaintDate: '2026-06-01',
    status: 'ACTIVE', precision: '0.01mm',
    remark: 'UDI打标专用，需定期清洁镜头',
    createdAt: '2024-01-15', updatedAt: '2026-03-01',
  },
  {
    id: 'eq-006', equipCode: 'EQ-USC-001', equipName: '超声波清洗机',
    category: 'CLEAN', model: 'GT-2200QTS', brand: '固特',
    workshop: '清洗车间', workCenter: 'WC-CLEAN-01', location: 'E区-01号',
    purchaseDate: '2023-05-01', warrantyDate: '2026-05-01',
    lastMaintDate: '2026-02-28', nextMaintDate: '2026-05-28',
    status: 'ACTIVE', precision: '',
    remark: '',
    createdAt: '2023-05-01', updatedAt: '2026-02-28',
  },
  {
    id: 'eq-007', equipCode: 'EQ-INSP-001', equipName: '投影仪（万能工具显微镜）',
    category: 'INSPECT', model: 'PH-A14', brand: '尼康',
    workshop: '检验室', workCenter: 'WC-QC-01', location: 'F区-QC室',
    purchaseDate: '2022-06-01', warrantyDate: '2025-06-01',
    lastMaintDate: '2026-01-10', nextMaintDate: '2026-07-10',
    status: 'ACTIVE', precision: '±0.001mm',
    remark: '每半年由计量所校准',
    createdAt: '2022-06-01', updatedAt: '2026-01-10',
  },
  {
    id: 'eq-008', equipCode: 'EQ-INSP-002', equipName: '扭转试验机',
    category: 'INSPECT', model: 'TT-01', brand: '悦尚自制',
    workshop: '检验室', workCenter: 'WC-QC-01', location: 'F区-QC室',
    purchaseDate: '2024-03-01', warrantyDate: '2027-03-01',
    lastMaintDate: '2026-03-01', nextMaintDate: '2026-09-01',
    status: 'ACTIVE', precision: '0.1N·cm',
    remark: 'ISO 3630-1合规性测试专用',
    createdAt: '2024-03-01', updatedAt: '2026-03-01',
  },
  {
    id: 'eq-009', equipCode: 'EQ-STER-001', equipName: 'EO灭菌柜',
    category: 'OTHER', model: 'HDX-YMQ-100', brand: '华道昕',
    workshop: '灭菌间', workCenter: 'WC-STER-01', location: 'G区-灭菌间',
    purchaseDate: '2021-08-01', warrantyDate: '2024-08-01',
    lastMaintDate: '2026-01-05', nextMaintDate: '2026-04-05',
    status: 'DISABLED', precision: '',
    remark: '保质期已过，待采购新设备，暂停使用',
    createdAt: '2021-08-01', updatedAt: '2026-04-05',
  },
  {
    id: 'eq-010', equipCode: 'EQ-PACK-001', equipName: '全自动热封机',
    category: 'PACK', model: 'SF-300', brand: '顺丰封装',
    workshop: '包装车间', workCenter: 'WC-PACK-01', location: 'H区-01号',
    purchaseDate: '2023-11-01', warrantyDate: '2026-11-01',
    lastMaintDate: '2026-02-20', nextMaintDate: '2026-05-20',
    status: 'ACTIVE', precision: '',
    remark: '初包装热封专用，封口强度≥15N/15mm',
    createdAt: '2023-11-01', updatedAt: '2026-02-20',
  },
];

// 快速过滤 key
type QuickFilter = 'ALL' | 'ACTIVE' | 'MAINTENANCE' | 'DISABLED';

// ════════════════════════════════════════════════════════════
// 主组件
// ════════════════════════════════════════════════════════════
const EquipmentPage: React.FC = () => {
  const [list, setList] = useState<Equipment[]>(initData);
  const [apiLoading, setApiLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filterCat, setFilterCat] = useState<string | undefined>();
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('ALL');
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);

  // 新建/编辑 Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Equipment | null>(null);
  const [form] = Form.useForm();

  // 详情 Modal
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<Equipment | null>(null);

  // ── 从后端加载设备数据 ────────────────────────────────────
  const loadFromApi = useCallback(async () => {
    setApiLoading(true);
    try {
      const resp = await getEquipmentList() as any;
      const apiList: any[] = resp.data ?? [];
      if (apiList.length > 0) {
        const mapped: Equipment[] = apiList.map((item: any) => ({
          id:            item.id?.toString() ?? genId(),
          equipCode:     item.code ?? '',
          equipName:     item.name ?? '',
          category:      (item.category as EquipCategory) ?? 'MACHINE',
          model:         item.model ?? '',
          brand:         item.brand ?? '',
          workshop:      item.workshopName ?? '',
          workCenter:    item.workCenterName ?? '',
          location:      item.location ?? '',
          purchaseDate:  item.purchaseDate ?? '',
          warrantyDate:  item.warrantyDate ?? '',
          lastMaintDate: item.lastMaintDate ?? '',
          nextMaintDate: item.nextMaintDate ?? '',
          status:        item.status === 0 ? 'DISABLED' : 'ACTIVE',
          precision:     item.precision,
          remark:        item.description ?? '',
          createdAt:     item.createTime ? item.createTime.slice(0, 10) : '',
          updatedAt:     item.updateTime ? item.updateTime.slice(0, 10) : '',
        }));
        setList(mapped);
      }
    } catch { /* 保留本地 mock */ } finally { setApiLoading(false); }
  }, []);

  useEffect(() => { loadFromApi(); }, [loadFromApi]);

  // ── 车间 / 工作中心下拉选项 ──────────────────────────────────
  const [workshopOptions, setWorkshopOptions] = useState<{ label: string; value: string }[]>([]);
  const [workCenterOptions, setWorkCenterOptions] = useState<{ label: string; value: string }[]>([]);

  const loadDropdownData = useCallback(async () => {
    try {
      const [wsResp, wcResp] = await Promise.allSettled([
        getWorkshopList() as any,
        getWorkCenterList() as any,
      ]);
      if (wsResp.status === 'fulfilled') {
        const wsList: any[] = wsResp.value?.data ?? [];
        setWorkshopOptions(wsList.map((w: any) => ({
          label: `${w.name ?? ''}${w.code ? `（${w.code}）` : ''}`,
          value: w.name ?? '',
        })));
      }
      if (wcResp.status === 'fulfilled') {
        const wcList: any[] = wcResp.value?.data ?? [];
        setWorkCenterOptions(wcList.map((w: any) => ({
          label: `${w.name ?? ''}${w.code ? `（${w.code}）` : ''}`,
          value: w.name ?? '',
        })));
      }
    } catch { /* 忽略 */ }
  }, []);

  useEffect(() => { loadDropdownData(); }, [loadDropdownData]);

  // ── 过滤 ─────────────────────────────────────────────────
  const filtered = useMemo(() => list.filter(e => {
    // 快速卡片过滤
    if (quickFilter === 'ACTIVE'      && e.status !== 'ACTIVE') return false;
    if (quickFilter === 'MAINTENANCE' && e.status !== 'MAINTENANCE') return false;
    if (quickFilter === 'DISABLED'    && e.status !== 'DISABLED' && e.status !== 'SCRAPPED') return false;
    // 工具栏过滤
    const t = searchText.toLowerCase();
    return (!t || e.equipCode.toLowerCase().includes(t) || e.equipName.includes(t)
              || e.workshop.includes(t) || e.workCenter.includes(t) || e.model.includes(t))
      && (!filterCat    || e.category === filterCat)
      && (!filterStatus || e.status   === filterStatus);
  }), [list, searchText, filterCat, filterStatus, quickFilter]);

  const summary = useMemo(() => ({
    total:       list.length,
    active:      list.filter(e => e.status === 'ACTIVE').length,
    maintenance: list.filter(e => e.status === 'MAINTENANCE').length,
    disabled:    list.filter(e => e.status === 'DISABLED' || e.status === 'SCRAPPED').length,
  }), [list]);

  // 卡片定义（带快速过滤 key）
  const summaryCards: { key: QuickFilter; label: string; value: number; color: string; icon: React.ReactNode }[] = [
    { key: 'ALL',         label: '设备总数',  value: summary.total,       color: '#1677FF', icon: <ToolOutlined /> },
    { key: 'ACTIVE',      label: '正常使用',  value: summary.active,      color: '#52C41A', icon: <CheckCircleOutlined /> },
    { key: 'MAINTENANCE', label: '维修中',    value: summary.maintenance, color: '#FAAD14', icon: <SettingOutlined /> },
    { key: 'DISABLED',    label: '停用/报废', value: summary.disabled,    color: '#8C8C8C', icon: <StopOutlined /> },
  ];

  // ── CRUD ──────────────────────────────────────────────────
  const handleAdd = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ status: 'ACTIVE', category: 'MACHINE' });
    setModalOpen(true);
  };

  const handleEdit = (r: Equipment) => {
    setEditing(r);
    form.setFieldsValue(r);
    setModalOpen(true);
  };

  const handleView = (r: Equipment) => {
    setDetailItem(r);
    setDetailOpen(true);
  };

  const handleDelete = (ids: React.Key[]) => {
    setList(prev => prev.filter(e => !ids.includes(e.id)));
    setSelectedKeys([]);
    message.success(`已删除 ${ids.length} 条设备`);
  };

  const handleStatusChange = (id: string, status: EquipStatus) => {
    setList(prev => prev.map(e => e.id === id
      ? { ...e, status, updatedAt: new Date().toISOString().slice(0, 10) } : e));
    message.success(`设备已${(STATUS_MAP[status] ?? { label: String(status) }).label}`);
  };

  const handleSave = () => {
    form.validateFields().then(vals => {
      if (editing) {
        setList(prev => prev.map(e => e.id === editing.id
          ? { ...e, ...vals, updatedAt: new Date().toISOString().slice(0, 10) } : e));
        message.success('修改成功');
      } else {
        const newItem: Equipment = {
          ...vals,
          id: genId(),
          createdAt: new Date().toISOString().slice(0, 10),
          updatedAt: new Date().toISOString().slice(0, 10),
        };
        setList(prev => [newItem, ...prev]);
        message.success('新增设备成功');
      }
      setModalOpen(false);
    }).catch((err: any) => { if (err?.errorFields) return; });
  };

  // ── 列定义 ───────────────────────────────────────────────
  const columns: ColumnsType<Equipment> = [
    { title: '序号', width: 50, align: 'center',
      render: (_: any, __: any, i: number) => <span style={{ color: '#aaa', fontSize: 12 }}>{i + 1}</span> },
    { title: '设备编码', dataIndex: 'equipCode', width: 150,
      render: (v: string, r: Equipment) => (
        <span style={{ color: '#1677FF', fontWeight: 600, cursor: 'pointer', fontFamily: 'monospace', fontSize: 12 }}
          onClick={() => handleView(r)}>
          <ToolOutlined style={{ marginRight: 4 }} />{v}
        </span>
      ) },
    { title: '设备名称', dataIndex: 'equipName', width: 160,
      render: (v: string) => <span style={{ fontWeight: 500, fontSize: 13 }}>{v}</span> },
    { title: '类别', dataIndex: 'category', width: 90, align: 'center',
      render: (v: EquipCategory) => {
        const m = CATEGORY_MAP[v];
        return <Tag color={m.color} style={{ fontSize: 11 }}>{m.label}</Tag>;
      } },
    { title: '型号', dataIndex: 'model', width: 160,
      render: (v: string) => <span style={{ fontSize: 12, color: '#555', fontFamily: 'monospace' }}>{v}</span> },
    { title: '所属车间', dataIndex: 'workshop', width: 120,
      render: (v: string) => <span style={{ fontSize: 12, color: '#555' }}>{v}</span> },
    { title: '工作中心', dataIndex: 'workCenter', width: 120,
      render: (v: string) => <Tag style={{ fontFamily: 'monospace', fontSize: 11 }}>{v}</Tag> },
    { title: '位置', dataIndex: 'location', width: 100,
      render: (v: string) => <span style={{ fontSize: 12, color: '#888' }}>{v}</span> },
    { title: '下次保养', dataIndex: 'nextMaintDate', width: 100, align: 'center',
      render: (v: string) => {
        const isOverdue = v && new Date(v) < new Date();
        return (
          <Tooltip title={isOverdue ? '保养已逾期！' : ''}>
            <span style={{ fontSize: 12, color: isOverdue ? '#E60012' : '#555', fontWeight: isOverdue ? 600 : 400 }}>
              {isOverdue && <WarningOutlined style={{ marginRight: 3 }} />}{v || '—'}
            </span>
          </Tooltip>
        );
      } },
    { title: '状态', dataIndex: 'status', width: 90, align: 'center',
      render: (v: EquipStatus) => {
        const m = STATUS_MAP[v];
        return <Badge status={m.badge} text={<span style={{ fontSize: 12 }}>{m.label}</span>} />;
      } },
    { title: '操作', width: 200, fixed: 'right',
      render: (_: any, r: Equipment) => (
        <Space size={0} split={<span style={{ color: '#e8e8e8', margin: '0 1px' }}>|</span>}>
          <Button type="link" size="small" icon={<EyeOutlined />}
            style={{ padding: '0 4px', fontSize: 12 }} onClick={() => handleView(r)}>详情</Button>
          <Button type="link" size="small" icon={<EditOutlined />}
            style={{ padding: '0 4px', fontSize: 12 }} onClick={() => handleEdit(r)}>编辑</Button>
          {r.status === 'ACTIVE' && (
            <Popconfirm title="确认停用该设备？" okText="确认停用" cancelText="取消"
              okButtonProps={{ danger: true }}
              onConfirm={() => handleStatusChange(r.id, 'DISABLED')}>
              <Button type="link" size="small" icon={<StopOutlined />}
                style={{ padding: '0 4px', fontSize: 12, color: '#FAAD14' }}>停用</Button>
            </Popconfirm>
          )}
          {r.status === 'DISABLED' && (
            <Button type="link" size="small" icon={<CheckCircleOutlined />}
              style={{ padding: '0 4px', fontSize: 12, color: '#52C41A' }}
              onClick={() => handleStatusChange(r.id, 'ACTIVE')}>启用</Button>
          )}
          {r.status === 'MAINTENANCE' && (
            <Button type="link" size="small" icon={<CheckCircleOutlined />}
              style={{ padding: '0 4px', fontSize: 12, color: '#52C41A' }}
              onClick={() => handleStatusChange(r.id, 'ACTIVE')}>恢复</Button>
          )}
          <Popconfirm title="确认删除该设备？" okText="确认" cancelText="取消"
            icon={<ExclamationCircleOutlined style={{ color: '#E60012' }} />}
            onConfirm={() => handleDelete([r.id])}>
            <Button type="link" danger size="small" style={{ padding: '0 4px', fontSize: 12 }}>删除</Button>
          </Popconfirm>
        </Space>
      ) },
  ];

  return (
    <div style={{ padding: '0 0 16px' }}>
      {/* 汇总卡片（点击快速过滤） */}
      <Row gutter={12} style={{ marginBottom: 12 }}>
        {summaryCards.map(c => {
          const isActive = quickFilter === c.key;
          return (
            <Col key={c.key} span={6}>
              <div
                onClick={() => setQuickFilter(prev => prev === c.key ? 'ALL' : c.key)}
                style={{
                  background: isActive ? `${c.color}10` : '#fff',
                  borderRadius: 8, padding: '10px 16px',
                  border: `1px solid ${isActive ? c.color : '#f0f0f0'}`,
                  display: 'flex', alignItems: 'center', gap: 12,
                  boxShadow: isActive ? `0 0 0 2px ${c.color}40` : '0 1px 4px rgba(0,0,0,.04)',
                  cursor: 'pointer', transition: 'all 0.2s', userSelect: 'none',
                }}
              >
                <div style={{ width: 36, height: 36, borderRadius: 8,
                  background: isActive ? c.color + '30' : c.color + '18',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, color: c.color }}>
                  {c.icon}
                </div>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: c.color, lineHeight: 1.2 }}>{c.value}</div>
                  <div style={{ fontSize: 12, color: isActive ? c.color : '#888', fontWeight: isActive ? 600 : 400 }}>
                    {c.label}{isActive && <span style={{ marginLeft: 4, fontSize: 10 }}>✓ 过滤中</span>}
                  </div>
                </div>
              </div>
            </Col>
          );
        })}
      </Row>

      {/* 搜索栏 */}
      <div style={{ background: '#fff', borderRadius: 8, padding: '10px 14px', marginBottom: 10, border: '1px solid #f0f0f0' }}>
        <Row gutter={10} align="middle">
          <Col flex="none">
            <Input prefix={<SearchOutlined style={{ color: '#bbb' }} />}
              placeholder="设备编码/名称/型号/车间" value={searchText}
              onChange={e => setSearchText(e.target.value)} style={{ width: 230 }} allowClear />
          </Col>
          <Col flex="none">
            <Select placeholder="设备类别" value={filterCat} onChange={setFilterCat} allowClear style={{ width: 120 }}>
              {Object.entries(CATEGORY_MAP).map(([k, v]) => <Option key={k} value={k}>{v.label}</Option>)}
            </Select>
          </Col>
          <Col flex="none">
            <Select placeholder="状态" value={filterStatus} onChange={setFilterStatus} allowClear style={{ width: 110 }}>
              {Object.entries(STATUS_MAP).map(([k, v]) => <Option key={k} value={k}>{v.label}</Option>)}
            </Select>
          </Col>
          <Col flex="none">
            <Button icon={<ReloadOutlined />} loading={apiLoading} onClick={() => { setSearchText(''); setFilterCat(undefined); setFilterStatus(undefined); setQuickFilter('ALL'); loadFromApi(); }}>刷新</Button>
          </Col>
          <Col flex="auto" style={{ textAlign: 'right' }}>
            <Space>
              {selectedKeys.length > 0 && (
                <Popconfirm title={`确认删除 ${selectedKeys.length} 条？`}
                  onConfirm={() => handleDelete(selectedKeys)} okText="确认" cancelText="取消">
                  <Button danger icon={<DeleteOutlined />}>批量删除({selectedKeys.length})</Button>
                </Popconfirm>
              )}
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}
                style={{ background: '#1677FF' }}>新增设备</Button>
            </Space>
          </Col>
        </Row>
      </div>

      {/* 表格 */}
      <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #f0f0f0', overflow: 'hidden' }}>
        <div style={{ padding: '9px 14px', borderBottom: '1px solid #f5f5f5', display: 'flex', alignItems: 'center', gap: 8 }}>
          <ToolOutlined style={{ color: '#1677FF' }} />
          <span style={{ fontWeight: 600, fontSize: 14 }}>设备档案</span>
          <Tag style={{ marginLeft: 4 }}>{filtered.length} 条</Tag>
        </div>
        <Table rowKey="id" dataSource={filtered} columns={columns} size="small"
          scroll={{ x: 1400, y: 'calc(100vh - 360px)' }}
          pagination={{ pageSize: 20, showSizeChanger: true, showQuickJumper: true,
            showTotal: t => `共 ${t} 条`, size: 'small' }}
          rowSelection={{ selectedRowKeys: selectedKeys, onChange: setSelectedKeys }}
        />
      </div>

      {/* ── 新增/编辑 Modal ── */}
      <Modal
        title={
          <Space>
            <span style={{ display: 'inline-block', width: 4, height: 16, background: '#1677FF', borderRadius: 2, verticalAlign: 'middle' }} />
            {editing ? '编辑设备' : '新增设备'}
          </Space>
        }
        open={modalOpen} onOk={handleSave} onCancel={() => setModalOpen(false)}
        okText="保存" cancelText="取消" width={700}
        okButtonProps={{ style: { background: '#1677FF' } }} destroyOnClose>
        <Form form={form} layout="vertical" size="middle" style={{ marginTop: 14 }}>
          <Row gutter={14}>
            <Col span={12}>
              <Form.Item name="equipCode" label="设备编码" rules={[{ required: true, message: '请输入设备编码' }]}>
                <Input placeholder="如：EQ-GRIND-001" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="equipName" label="设备名称" rules={[{ required: true, message: '请输入设备名称' }]}>
                <Input placeholder="如：数控五轴磨床" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="category" label="设备类别" rules={[{ required: true }]}>
                <Select>
                  {Object.entries(CATEGORY_MAP).map(([k, v]) => <Option key={k} value={k}>{v.label}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="status" label="状态">
                <Select>
                  {Object.entries(STATUS_MAP).map(([k, v]) => <Option key={k} value={k}>{v.label}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="precision" label="精度/规格">
                <Input placeholder="如：±0.002mm" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="model" label="型号" rules={[{ required: true, message: '请输入型号' }]}>
                <Input placeholder="如：WALTER HELITRONIC POWER" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="brand" label="品牌/厂商">
                <Input placeholder="如：瓦尔特" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="workshop" label="所属车间" rules={[{ required: true, message: '请选择所属车间' }]}>
                <Select
                  placeholder="从车间档案选择"
                  allowClear showSearch
                  filterOption={(input, opt) =>
                    String((opt as any)?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                  options={workshopOptions}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="workCenter" label="工作中心">
                <Select
                  placeholder="从工作中心选择"
                  allowClear showSearch
                  filterOption={(input, opt) =>
                    String((opt as any)?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                  options={workCenterOptions}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="location" label="位置">
                <Input placeholder="如：A区-01号" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="purchaseDate" label="购入日期">
                <Input placeholder="YYYY-MM-DD" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="warrantyDate" label="保质期至">
                <Input placeholder="YYYY-MM-DD" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="lastMaintDate" label="上次保养日期">
                <Input placeholder="YYYY-MM-DD" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="nextMaintDate" label="下次保养日期">
                <Input placeholder="YYYY-MM-DD" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="remark" label="备注">
                <TextArea rows={2} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* ── 详情 Modal ── */}
      <Modal
        title={
          <Space>
            <ToolOutlined style={{ color: '#1677FF' }} />
            <span>设备详情 — {detailItem?.equipCode}</span>
          </Space>
        }
        open={detailOpen} onCancel={() => setDetailOpen(false)}
        footer={<Button onClick={() => setDetailOpen(false)}>关闭</Button>}
        width={640}>
        {detailItem && (
          <Descriptions bordered size="small" column={2} style={{ marginTop: 12 }}>
            <Descriptions.Item label="设备编码">{detailItem.equipCode}</Descriptions.Item>
            <Descriptions.Item label="设备名称">{detailItem.equipName}</Descriptions.Item>
            <Descriptions.Item label="类别">
              <Tag color={(CATEGORY_MAP[detailItem.category] ?? { color: 'default' }).color}>{(CATEGORY_MAP[detailItem.category] ?? { label: detailItem.category ?? '-' }).label}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <Badge status={(STATUS_MAP[detailItem.status] ?? { badge: 'default' as any }).badge} text={(STATUS_MAP[detailItem.status] ?? { label: String(detailItem.status ?? '-') }).label} />
            </Descriptions.Item>
            <Descriptions.Item label="型号" span={2}>{detailItem.model}</Descriptions.Item>
            <Descriptions.Item label="品牌">{detailItem.brand}</Descriptions.Item>
            <Descriptions.Item label="精度/规格">{detailItem.precision || '—'}</Descriptions.Item>
            <Descriptions.Item label="所属车间">{detailItem.workshop}</Descriptions.Item>
            <Descriptions.Item label="工作中心">{detailItem.workCenter}</Descriptions.Item>
            <Descriptions.Item label="安装位置" span={2}>{detailItem.location}</Descriptions.Item>
            <Descriptions.Item label="购入日期">
              <CalendarOutlined style={{ marginRight: 4 }} />{detailItem.purchaseDate}
            </Descriptions.Item>
            <Descriptions.Item label="保质期至">{detailItem.warrantyDate}</Descriptions.Item>
            <Descriptions.Item label="上次保养">{detailItem.lastMaintDate}</Descriptions.Item>
            <Descriptions.Item label="下次保养">
              {(() => {
                const isOverdue = detailItem.nextMaintDate && new Date(detailItem.nextMaintDate) < new Date();
                return (
                  <span style={{ color: isOverdue ? '#E60012' : undefined, fontWeight: isOverdue ? 600 : undefined }}>
                    {isOverdue && <WarningOutlined style={{ marginRight: 4 }} />}
                    {detailItem.nextMaintDate}
                  </span>
                );
              })()}
            </Descriptions.Item>
            <Descriptions.Item label="备注" span={2}>{detailItem.remark || '—'}</Descriptions.Item>
            <Descriptions.Item label="创建日期">{detailItem.createdAt}</Descriptions.Item>
            <Descriptions.Item label="更新日期">{detailItem.updatedAt}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default EquipmentPage;

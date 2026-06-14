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

// ── Mock Data（API失败时降级，保健品行业设备）─────────────────
const initData: Equipment[] = [
  {
    id: 'eq-001', equipCode: 'EQ-GRAN-001', equipName: '湿法制粒机 #1',
    category: 'MACHINE', model: 'GHL-200', brand: '重庆英格',
    workshop: '固体制剂车间（D级）', workCenter: 'WC-GRAN-01', location: 'A区-01号位',
    purchaseDate: '2023-04-01', warrantyDate: '2026-04-01',
    lastMaintDate: '2026-05-10', nextMaintDate: '2026-06-10',
    status: 'ACTIVE', precision: '搅拌转速±5rpm',
    remark: 'VitC咀嚼片湿法制粒关键工序，需IQ/OQ/PQ验证',
    createdAt: '2023-04-20', updatedAt: '2026-05-10',
  },
  {
    id: 'eq-002', equipCode: 'EQ-FLUID-001', equipName: '流化床干燥机 #1',
    category: 'MACHINE', model: 'FL-200', brand: '常州永信',
    workshop: '固体制剂车间（D级）', workCenter: 'WC-DRY-01', location: 'A区-02号位',
    purchaseDate: '2023-04-01', warrantyDate: '2026-04-01',
    lastMaintDate: '2026-05-12', nextMaintDate: '2026-06-12',
    status: 'ACTIVE', precision: '进风温度±2℃',
    remark: '湿颗粒干燥，过滤袋每月更换',
    createdAt: '2023-04-22', updatedAt: '2026-05-12',
  },
  {
    id: 'eq-003', equipCode: 'EQ-PRESS-001', equipName: '旋转式压片机 #1',
    category: 'MACHINE', model: 'ZP-35', brand: '上海天祥',
    workshop: '固体制剂车间（D级）', workCenter: 'WC-PRESS-01', location: 'B区-01号位',
    purchaseDate: '2023-06-01', warrantyDate: '2026-06-01',
    lastMaintDate: '2026-05-20', nextMaintDate: '2026-06-20',
    status: 'ACTIVE', precision: '片重差异≤±5%',
    remark: 'VitC咀嚼片500mg关键设备；冲模每批检查',
    createdAt: '2023-06-15', updatedAt: '2026-05-20',
  },
  {
    id: 'eq-004', equipCode: 'EQ-COAT-001', equipName: '高效包衣机 BFC-150',
    category: 'MACHINE', model: 'BFC-150', brand: '常州英格',
    workshop: '固体制剂车间（D级）', workCenter: 'WC-COAT-01', location: 'B区-02号位',
    purchaseDate: '2024-01-10', warrantyDate: '2027-01-10',
    lastMaintDate: '2026-05-15', nextMaintDate: '2026-06-15',
    status: 'ACTIVE', precision: '包衣增重率±0.2%',
    remark: 'OPADRY薄膜包衣，关键参数：增重率2~4%',
    createdAt: '2024-01-25', updatedAt: '2026-05-15',
  },
  {
    id: 'eq-005', equipCode: 'EQ-MIX-001', equipName: '三维运动混合机',
    category: 'MACHINE', model: 'SYH-500', brand: '无锡新达',
    workshop: '固体制剂车间（D级）', workCenter: 'WC-MIX-01', location: 'A区-03号位',
    purchaseDate: '2023-05-01', warrantyDate: '2026-05-01',
    lastMaintDate: '2026-04-25', nextMaintDate: '2026-07-25',
    status: 'ACTIVE', precision: '混合转速10~20rpm',
    remark: '总混工序，每季度检查密封圈',
    createdAt: '2023-05-15', updatedAt: '2026-04-25',
  },
  {
    id: 'eq-006', equipCode: 'EQ-COUNT-001', equipName: '全自动数片机',
    category: 'PACK', model: 'PPC-3000', brand: '杭州中亚',
    workshop: '包装车间（D级）', workCenter: 'WC-COUNT-01', location: 'C区-01号位',
    purchaseDate: '2023-09-01', warrantyDate: '2026-09-01',
    lastMaintDate: '2026-05-01', nextMaintDate: '2026-06-01',
    status: 'ACTIVE', precision: '数片精度±0片',
    remark: '内包装瓶装数片，光电传感器每月校准',
    createdAt: '2023-09-15', updatedAt: '2026-05-01',
  },
  {
    id: 'eq-007', equipCode: 'EQ-LABEL-001', equipName: '激光喷码机（批号打印）',
    category: 'MACHINE', model: 'CL-650C', brand: '科迪华激光',
    workshop: '包装车间（D级）', workCenter: 'WC-MARK-01', location: 'C区-02号位',
    purchaseDate: '2024-03-01', warrantyDate: '2027-03-01',
    lastMaintDate: '2026-04-15', nextMaintDate: '2026-07-15',
    status: 'ACTIVE', precision: '字符高度±0.1mm',
    remark: 'GMP批号/生产日期/有效期激光喷印',
    createdAt: '2024-03-15', updatedAt: '2026-04-15',
  },
  {
    id: 'eq-008', equipCode: 'EQ-CAPS-001', equipName: '全自动胶囊充填机',
    category: 'MACHINE', model: 'NJP-1200C', brand: '常州金远',
    workshop: '胶囊充填车间（C级）', workCenter: 'WC-CAPS-01', location: 'A区-01号位（溧水厂）',
    purchaseDate: '2023-07-01', warrantyDate: '2026-07-01',
    lastMaintDate: '2026-05-18', nextMaintDate: '2026-06-18',
    status: 'ACTIVE', precision: '装量差异≤±7.5%',
    remark: '益生菌胶囊关键工序；操作间温度≤20℃',
    createdAt: '2023-07-20', updatedAt: '2026-05-18',
  },
  {
    id: 'eq-009', equipCode: 'EQ-COLDCHAIN-001', equipName: '冷链储存柜（益生菌专用）',
    category: 'OTHER', model: 'YC-1000', brand: '中科美菱',
    workshop: '冷链储存区（≤8℃）', workCenter: 'WC-COLD-01', location: 'G区-冷链1号（溧水厂）',
    purchaseDate: '2023-06-01', warrantyDate: '2026-06-01',
    lastMaintDate: '2026-05-20', nextMaintDate: '2026-06-20',
    status: 'ACTIVE', precision: '温度±0.5℃',
    remark: '益生菌冷链存储，24h温度监控；超标自动报警',
    createdAt: '2023-06-15', updatedAt: '2026-05-20',
  },
  {
    id: 'eq-010', equipCode: 'EQ-HPLC-001', equipName: 'HPLC高效液相色谱仪',
    category: 'INSPECT', model: 'LC-2030C 3D', brand: '岛津（Shimadzu）',
    workshop: '质检实验室', workCenter: 'WC-QC-HPLC', location: 'QC实验室-仪器间A',
    purchaseDate: '2022-08-01', warrantyDate: '2025-08-01',
    lastMaintDate: '2026-04-01', nextMaintDate: '2026-07-01',
    status: 'ACTIVE', precision: 'RSD≤2%，波长精度±0.5nm',
    remark: 'VitC含量HPLC法检测；每季度外部校准',
    createdAt: '2022-08-20', updatedAt: '2026-04-01',
  },
];

// 快速过滤 key
type QuickFilter = 'ALL' | 'ACTIVE' | 'MAINTENANCE' | 'DISABLED';

// ════════════════════════════════════════════════════════════
// 主组件
// ════════════════════════════════════════════════════════════
const EquipmentPage: React.FC = () => {
  const [list, setList] = useState<Equipment[]>([]); // 启动时为空，由 loadFromApi 填充；initData 仅作备用
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
      // 后端返回分页格式 data:{list,total,...}，也兼容直接数组
      const rawData = resp?.data;
      const apiList: any[] = Array.isArray(rawData)
        ? rawData
        : (rawData?.list ?? rawData?.records ?? []);

      // eq_status DB值 → 前端 EquipStatus
      const EQ_STATUS_MAP: Record<string, EquipStatus> = {
        'RUN':     'ACTIVE',
        'RUNNING': 'ACTIVE',
        'STANDBY': 'ACTIVE',
        'FAULT':   'MAINTENANCE',
        'MAINT':   'MAINTENANCE',
        'RETIRE':  'SCRAPPED',
        'STOP':    'DISABLED',
        '0':       'DISABLED',
        '1':       'ACTIVE',
      };

      // eq_type 中文字符串 → 前端 EquipCategory
      const EQ_TYPE_MAP: Record<string, EquipCategory> = {
        '压片设备': 'MACHINE', '混合设备': 'MACHINE', '干燥设备': 'MACHINE',
        '制粒设备': 'MACHINE', '充填设备': 'MACHINE', '包衣设备': 'MACHINE',
        '灌装设备': 'MACHINE', '配料设备': 'MACHINE', '乳化设备': 'MACHINE',
        '滴丸设备': 'MACHINE', '抛光设备': 'MACHINE', '辅助设备': 'MACHINE',
        '灭菌设备': 'MACHINE', '过滤设备': 'MACHINE', '水处理设备': 'MACHINE',
        '软胶囊设备': 'MACHINE',
        '包装设备': 'PACK',
        '检测设备': 'INSPECT', '分析仪器': 'INSPECT', '检验设备': 'INSPECT', '称量设备': 'INSPECT',
        '清洁设备': 'CLEAN', '清洗设备': 'CLEAN',
      };

      const fmt = (d: string | null | undefined) =>
        d ? d.replace('T', ' ').slice(0, 10) : '';

      if (apiList.length > 0) {
        const mapped: Equipment[] = apiList.map((item: any) => ({
          id:            item.id?.toString() ?? genId(),
          // 双字段回退：优先 camelCase，再 snake_case
          equipCode:     item.equipCode   ?? item.eq_code    ?? item.code    ?? '',
          equipName:     item.equipName   ?? item.eq_name    ?? item.name    ?? '',
          category:      EQ_TYPE_MAP[item.eqType ?? item.eq_type ?? item.category ?? ''] ?? 'MACHINE',
          model:         item.eqModel     ?? item.eq_model   ?? item.model   ?? '',
          brand:         item.manufacturer ?? item.brand      ?? '',
          workshop:      item.workshopName ?? item.workshop_name ?? item.workshop ?? '',
          workCenter:    item.workCenterName ?? item.wc_name  ?? item.workCenter ?? '',
          location:      item.location    ?? '',
          purchaseDate:  fmt(item.purchaseDate  ?? item.purchase_date),
          warrantyDate:  fmt(item.warrantyDate  ?? item.warranty_date),
          lastMaintDate: fmt(item.lastMaintDate ?? item.last_maint_date),
          nextMaintDate: fmt(item.nextMaintDate ?? item.next_maint_date),
          status:        EQ_STATUS_MAP[item.eqStatus ?? item.eq_status ?? String(item.status ?? '')] ?? 'ACTIVE',
          precision:     item.precision ?? item.rated_speed ?? undefined,
          remark:        item.description ?? item.remark ?? '',
          createdAt:     fmt(item.createTime  ?? item.create_time),
          updatedAt:     fmt(item.updateTime  ?? item.update_time),
        }));
        setList(mapped);
      } else {
        setList([]);
      }
    } catch (e) {
      console.error('loadFromApi equipment error', e);
      setList(initData); // 网络完全失败时降级到内置 mock
    } finally { setApiLoading(false); }
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
                <Input placeholder="如：EQ-GRAN-001" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="equipName" label="设备名称" rules={[{ required: true, message: '请输入设备名称' }]}>
                <Input placeholder="如：湿法制粒机 #1" />
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
                <Input placeholder="如：GHL-200" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="brand" label="品牌/厂商">
                <Input placeholder="如：重庆英格" />
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

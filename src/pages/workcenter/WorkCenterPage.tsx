import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { getWorkCenterList, createWorkCenter, updateWorkCenter, deleteWorkCenter, batchDeleteWorkCenters } from '../../api/workCenters';
import {
  Table, Button, Input, Select, Space, Tag, Popconfirm, message,
  Row, Col, Modal, Form, Badge, Tooltip, Divider, InputNumber, Descriptions,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined, SearchOutlined, ReloadOutlined, EditOutlined,
  DeleteOutlined, EyeOutlined, CheckCircleOutlined, StopOutlined,
  ExclamationCircleOutlined, ApartmentOutlined, TeamOutlined,
  ClockCircleOutlined, ToolOutlined, BankOutlined,
} from '@ant-design/icons';
import { WORKSHOP_LIST, ACTIVE_WORKSHOPS, WORKSHOP_STATUS_MAP } from '../basicdata/workshopArchiveData';

const { Option } = Select;
const { TextArea } = Input;

// ── Types ─────────────────────────────────────────────────
type WCStatus   = 'ACTIVE' | 'DISABLED' | 'MAINTENANCE';
type WCCategory = 'MACHINING' | 'INSPECTION' | 'CLEANING' | 'PACKAGING' | 'STERILIZATION' | 'OTHER';

interface WorkCenter {
  id: string;
  wcCode: string;
  wcName: string;
  category: WCCategory;
  workshop: string;
  leader: string;
  headCount: number;
  shiftCount: number;
  shiftHours: number;
  capacity: number;         // 产能（件/班）
  capacityUnit: string;
  equipCount: number;
  location: string;
  costCenter: string;
  status: WCStatus;
  remark?: string;
  createdAt: string;
  updatedAt: string;
}

const CATEGORY_MAP: Record<WCCategory, { label: string; color: string }> = {
  MACHINING:     { label: '加工中心',   color: '#1677FF' },
  INSPECTION:    { label: '检验中心',   color: '#FA8C16' },
  CLEANING:      { label: '清洗中心',   color: '#13C2C2' },
  PACKAGING:     { label: '包装中心',   color: '#52C41A' },
  STERILIZATION: { label: '灭菌中心',   color: '#722ED1' },
  OTHER:         { label: '其他',       color: '#8C8C8C' },
};

const STATUS_MAP: Record<WCStatus, { label: string; color: string; badge: any }> = {
  ACTIVE:      { label: '正常运行', color: '#52C41A', badge: 'success' },
  DISABLED:    { label: '已停用',   color: '#8C8C8C', badge: 'default' },
  MAINTENANCE: { label: '整修中',   color: '#FAAD14', badge: 'warning' },
};

const genId = () => `wc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

// ── Mock Data ──────────────────────────────────────────────
const initData: WorkCenter[] = [
  {
    id: 'wc-001', wcCode: 'WC-GRIND-01', wcName: '数控磨削工作中心',
    category: 'MACHINING', workshop: '精密加工车间', leader: '张工',
    headCount: 8, shiftCount: 2, shiftHours: 8, capacity: 2000, capacityUnit: '件/班',
    equipCount: 3, location: 'A区',
    costCenter: 'CC-MFG-001', status: 'ACTIVE',
    remark: '根管锉锥度磨削核心区域，瓶颈产能',
    createdAt: '2023-01-01', updatedAt: '2026-04-01',
  },
  {
    id: 'wc-002', wcCode: 'WC-HT-01', wcName: '热处理工作中心',
    category: 'MACHINING', workshop: '热处理车间', leader: '李工',
    headCount: 4, shiftCount: 1, shiftHours: 12, capacity: 5000, capacityUnit: '件/炉次',
    equipCount: 2, location: 'B区',
    costCenter: 'CC-MFG-002', status: 'ACTIVE',
    remark: '镍钛合金热处理定型，特殊工序',
    createdAt: '2023-01-01', updatedAt: '2026-02-10',
  },
  {
    id: 'wc-003', wcCode: 'WC-COAT-01', wcName: 'PVD涂层工作中心',
    category: 'MACHINING', workshop: '涂层车间', leader: '王工',
    headCount: 3, shiftCount: 1, shiftHours: 8, capacity: 3000, capacityUnit: '件/批',
    equipCount: 1, location: 'C区',
    costCenter: 'CC-MFG-003', status: 'MAINTENANCE',
    remark: 'PVD镀膜机靶材更换中，预计4月下旬恢复',
    createdAt: '2023-01-01', updatedAt: '2026-04-15',
  },
  {
    id: 'wc-004', wcCode: 'WC-LASER-01', wcName: '激光打标工作中心',
    category: 'MACHINING', workshop: '标识车间', leader: '陈工',
    headCount: 3, shiftCount: 2, shiftHours: 8, capacity: 4000, capacityUnit: '件/班',
    equipCount: 2, location: 'D区',
    costCenter: 'CC-MFG-004', status: 'ACTIVE',
    remark: 'UDI打标+序列号追溯，GS1-128格式',
    createdAt: '2024-01-01', updatedAt: '2026-03-01',
  },
  {
    id: 'wc-005', wcCode: 'WC-CLEAN-01', wcName: '超声清洗工作中心',
    category: 'CLEANING', workshop: '清洗车间', leader: '赵工',
    headCount: 3, shiftCount: 2, shiftHours: 8, capacity: 6000, capacityUnit: '件/班',
    equipCount: 2, location: 'E区',
    costCenter: 'CC-MFG-005', status: 'ACTIVE',
    remark: '超声波清洗+洁净度检测',
    createdAt: '2023-01-01', updatedAt: '2026-02-28',
  },
  {
    id: 'wc-006', wcCode: 'WC-QC-01', wcName: '成品检验工作中心',
    category: 'INSPECTION', workshop: '检验室', leader: '质检主任',
    headCount: 6, shiftCount: 1, shiftHours: 8, capacity: 500, capacityUnit: '件/天',
    equipCount: 5, location: 'F区-QC室',
    costCenter: 'CC-QC-001', status: 'ACTIVE',
    remark: '全尺寸检验、扭转/抗弯测试，ISO 3630-1合规',
    createdAt: '2022-06-01', updatedAt: '2026-03-01',
  },
  {
    id: 'wc-007', wcCode: 'WC-STER-01', wcName: 'EO灭菌工作中心',
    category: 'STERILIZATION', workshop: '灭菌间', leader: '灭菌主管',
    headCount: 4, shiftCount: 1, shiftHours: 12, capacity: 20000, capacityUnit: '件/批',
    equipCount: 1, location: 'G区-灭菌间',
    costCenter: 'CC-PACK-001', status: 'DISABLED',
    remark: 'EO灭菌柜保质期到期，停用待采购新设备',
    createdAt: '2021-08-01', updatedAt: '2026-04-05',
  },
  {
    id: 'wc-008', wcCode: 'WC-PACK-01', wcName: '包装工作中心',
    category: 'PACKAGING', workshop: '包装车间', leader: '包装主管',
    headCount: 6, shiftCount: 2, shiftHours: 8, capacity: 8000, capacityUnit: '件/班',
    equipCount: 3, location: 'H区',
    costCenter: 'CC-PACK-002', status: 'ACTIVE',
    remark: '初包装热封+标签打印+装箱，UDI贴标',
    createdAt: '2023-01-01', updatedAt: '2026-02-20',
  },
];

// ════════════════════════════════════════════════════════════
// 主组件
// ════════════════════════════════════════════════════════════
const WorkCenterPage: React.FC = () => {
  const [list, setList] = useState<WorkCenter[]>(initData);
  const [apiLoading, setApiLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filterCat, setFilterCat] = useState<string | undefined>();
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [quickFilter, setQuickFilter] = useState<'ALL' | 'ACTIVE' | 'MAINTENANCE' | 'DISABLED'>('ALL');
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<WorkCenter | null>(null);
  const [form] = Form.useForm();

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<WorkCenter | null>(null);

  // ── 从后端加载工作中心数据 ────────────────────────────────
  const loadFromApi = useCallback(async () => {
    setApiLoading(true);
    try {
      const resp = await getWorkCenterList() as any;
      const apiList: any[] = resp.data ?? [];
      if (apiList.length > 0) {
        const mapped: WorkCenter[] = apiList.map((item: any) => ({
          id:           item.id?.toString() ?? genId(),
          wcCode:       item.code ?? '',
          wcName:       item.name ?? '',
          category:     (item.category as WCCategory) ?? 'MACHINING',
          workshop:     item.workshopName ?? '',
          leader:       item.leaderName ?? '',
          headCount:    0,
          shiftCount:   2,
          shiftHours:   8,
          capacity:     item.capacity ?? 0,
          capacityUnit: item.capacityUnit ?? '件/班',
          equipCount:   item.equipCount ?? 0,
          location:     item.location ?? '',
          costCenter:   item.costCenter ?? '',
          status:       item.status === 0 ? 'DISABLED' : 'ACTIVE',
          remark:       item.description ?? '',
          createdAt:    item.createTime ? item.createTime.slice(0, 10) : '',
          updatedAt:    item.updateTime ? item.updateTime.slice(0, 10) : '',
        }));
        setList(mapped);
      }
    } catch { /* 保留本地 mock */ } finally { setApiLoading(false); }
  }, []);

  useEffect(() => { loadFromApi(); }, [loadFromApi]);

  // ── 过滤 ─────────────────────────────────────────────────
  const filtered = useMemo(() => list.filter(w => {
    if (quickFilter === 'ACTIVE'      && w.status !== 'ACTIVE') return false;
    if (quickFilter === 'MAINTENANCE' && w.status !== 'MAINTENANCE') return false;
    if (quickFilter === 'DISABLED'    && w.status !== 'DISABLED') return false;
    const t = searchText.toLowerCase();
    return (!t || w.wcCode.toLowerCase().includes(t) || w.wcName.includes(t)
              || w.workshop.includes(t) || w.leader.includes(t))
      && (!filterCat    || w.category === filterCat)
      && (!filterStatus || w.status   === filterStatus);
  }), [list, searchText, filterCat, filterStatus, quickFilter]);

  const summary = useMemo(() => ({
    total:       list.length,
    active:      list.filter(w => w.status === 'ACTIVE').length,
    maintenance: list.filter(w => w.status === 'MAINTENANCE').length,
    disabled:    list.filter(w => w.status === 'DISABLED').length,
  }), [list]);

  // ── CRUD ──────────────────────────────────────────────────
  const handleAdd = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({
      status: 'ACTIVE', category: 'MACHINING',
      shiftCount: 2, shiftHours: 8, headCount: 4, equipCount: 1,
      capacity: 1000, capacityUnit: '件/班',
    });
    setModalOpen(true);
  };

  const handleEdit = (r: WorkCenter) => {
    setEditing(r);
    form.setFieldsValue(r);
    setModalOpen(true);
  };

  const handleView = (r: WorkCenter) => {
    setDetailItem(r);
    setDetailOpen(true);
  };

  const handleDelete = async (ids: React.Key[]) => {
    try {
      if (ids.length === 1) {
        const numId = Number(ids[0]);
        if (!isNaN(numId)) await deleteWorkCenter(numId);
      } else {
        const numIds = ids.map(Number).filter(n => !isNaN(n));
        if (numIds.length > 0) await batchDeleteWorkCenters(numIds);
      }
    } catch { /* http interceptor already shows error */ }
    setList(prev => prev.filter(w => !ids.includes(w.id)));
    setSelectedKeys([]);
    message.success(`已删除 ${ids.length} 个工作中心`);
  };

  const handleStatusChange = async (id: string, status: WCStatus) => {
    try {
      const numId = Number(id);
      const statusInt = status === 'ACTIVE' ? 1 : status === 'DISABLED' ? 0 : 2;
      if (!isNaN(numId)) await updateWorkCenter(numId, { status: statusInt });
    } catch { /* fallback to local */ }
    setList(prev => prev.map(w => w.id === id
      ? { ...w, status, updatedAt: new Date().toISOString().slice(0, 10) } : w));
    message.success(`工作中心已${(STATUS_MAP[status] ?? { label: String(status) }).label}`);
  };

  const handleSave = () => {
    form.validateFields().then(async vals => {
      const statusInt = vals.status === 'ACTIVE' ? 1 : vals.status === 'DISABLED' ? 0 : 2;
      const payload = {
        code:         vals.wcCode,
        name:         vals.wcName,
        type:         vals.category,       // backend uses 'type' field
        location:     vals.location,
        costCenter:   vals.costCenter,
        capacity:     vals.capacity,
        capacityUnit: vals.capacityUnit,
        description:  vals.remark,
        status:       statusInt,
      };
      try {
        if (editing) {
          const numId = Number(editing.id);
          if (!isNaN(numId)) await updateWorkCenter(numId, payload);
          setList(prev => prev.map(w => w.id === editing.id
            ? { ...w, ...vals, updatedAt: new Date().toISOString().slice(0, 10) } : w));
          message.success('修改成功');
        } else {
          const resp = await createWorkCenter(payload) as any;
          const newId = resp?.data?.id?.toString() ?? `wc_${Date.now()}`;
          const newItem: WorkCenter = {
            ...vals,
            id: newId,
            createdAt: new Date().toISOString().slice(0, 10),
            updatedAt: new Date().toISOString().slice(0, 10),
          };
          setList(prev => [newItem, ...prev]);
          message.success('新增工作中心成功');
        }
        setModalOpen(false);
      } catch { /* http interceptor shows error; keep modal open */ }
    }).catch((err: any) => { if (err?.errorFields) return; });
  };

  // ── 列定义 ───────────────────────────────────────────────
  const columns: ColumnsType<WorkCenter> = [
    { title: '序号', width: 50, align: 'center',
      render: (_: any, __: any, i: number) => <span style={{ color: '#aaa', fontSize: 12 }}>{i + 1}</span> },
    { title: '工作中心编码', dataIndex: 'wcCode', width: 145,
      render: (v: string, r: WorkCenter) => (
        <span style={{ color: '#1677FF', fontWeight: 600, cursor: 'pointer', fontFamily: 'monospace', fontSize: 12 }}
          onClick={() => handleView(r)}>
          <ApartmentOutlined style={{ marginRight: 4 }} />{v}
        </span>
      ) },
    { title: '工作中心名称', dataIndex: 'wcName', width: 160,
      render: (v: string) => <span style={{ fontWeight: 500, fontSize: 13 }}>{v}</span> },
    { title: '类别', dataIndex: 'category', width: 95, align: 'center',
      render: (v: WCCategory) => {
        const m = CATEGORY_MAP[v];
        return <Tag color={m.color} style={{ fontSize: 11 }}>{m.label}</Tag>;
      } },
    { title: '所属车间', dataIndex: 'workshop', width: 120,
      render: (v: string) => <span style={{ fontSize: 12, color: '#555' }}>{v}</span> },
    { title: '负责人', dataIndex: 'leader', width: 85,
      render: (v: string) => (
        <Space size={4}>
          <TeamOutlined style={{ color: '#888', fontSize: 11 }} />
          <span style={{ fontSize: 12 }}>{v}</span>
        </Space>
      ) },
    { title: '班次/工时', width: 95, align: 'center',
      render: (_: any, r: WorkCenter) => (
        <Space direction="vertical" size={0} style={{ textAlign: 'center' }}>
          <span style={{ fontSize: 12, color: '#1677FF', fontWeight: 600 }}>{r.shiftCount}班</span>
          <span style={{ fontSize: 11, color: '#888' }}>{r.shiftHours}h/班</span>
        </Space>
      ) },
    { title: '人员/设备', width: 90, align: 'center',
      render: (_: any, r: WorkCenter) => (
        <Space direction="vertical" size={0} style={{ textAlign: 'center' }}>
          <span style={{ fontSize: 12 }}><TeamOutlined /> {r.headCount}人</span>
          <span style={{ fontSize: 12 }}><ToolOutlined /> {r.equipCount}台</span>
        </Space>
      ) },
    { title: '标准产能', width: 120, align: 'center',
      render: (_: any, r: WorkCenter) => (
        <Space size={2}>
          <ClockCircleOutlined style={{ color: '#52C41A', fontSize: 11 }} />
          <span style={{ fontWeight: 600, color: '#52C41A', fontSize: 12 }}>{r.capacity.toLocaleString()}</span>
          <span style={{ fontSize: 11, color: '#888' }}>{r.capacityUnit}</span>
        </Space>
      ) },
    { title: '位置', dataIndex: 'location', width: 85,
      render: (v: string) => <span style={{ fontSize: 12, color: '#888' }}>{v}</span> },
    { title: '状态', dataIndex: 'status', width: 90, align: 'center',
      render: (v: WCStatus) => {
        const m = STATUS_MAP[v];
        return <Badge status={m.badge} text={<span style={{ fontSize: 12 }}>{m.label}</span>} />;
      } },
    { title: '操作', width: 195, fixed: 'right',
      render: (_: any, r: WorkCenter) => (
        <Space size={0} split={<span style={{ color: '#e8e8e8', margin: '0 1px' }}>|</span>}>
          <Button type="link" size="small" icon={<EyeOutlined />}
            style={{ padding: '0 4px', fontSize: 12 }} onClick={() => handleView(r)}>详情</Button>
          <Button type="link" size="small" icon={<EditOutlined />}
            style={{ padding: '0 4px', fontSize: 12 }} onClick={() => handleEdit(r)}>编辑</Button>
          {r.status === 'ACTIVE' && (
            <Popconfirm title="确认停用该工作中心？停用后关联工序将无法排程。"
              okText="确认停用" cancelText="取消" okButtonProps={{ danger: true }}
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
          <Popconfirm title="确认删除该工作中心？" okText="确认" cancelText="取消"
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
        {([
          { key: 'ALL',         label: '工作中心总数', value: summary.total,       color: '#1677FF', icon: <ApartmentOutlined /> },
          { key: 'ACTIVE',      label: '正常运行',     value: summary.active,      color: '#52C41A', icon: <CheckCircleOutlined /> },
          { key: 'MAINTENANCE', label: '整修中',       value: summary.maintenance, color: '#FAAD14', icon: <ToolOutlined /> },
          { key: 'DISABLED',    label: '已停用',       value: summary.disabled,    color: '#8C8C8C', icon: <StopOutlined /> },
        ] as { key: 'ALL'|'ACTIVE'|'MAINTENANCE'|'DISABLED'; label: string; value: number; color: string; icon: React.ReactNode }[]).map(c => {
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
              placeholder="编码/名称/车间/负责人" value={searchText}
              onChange={e => setSearchText(e.target.value)} style={{ width: 220 }} allowClear />
          </Col>
          <Col flex="none">
            <Select placeholder="类别" value={filterCat} onChange={setFilterCat} allowClear style={{ width: 120 }}>
              {Object.entries(CATEGORY_MAP).map(([k, v]) => <Option key={k} value={k}>{v.label}</Option>)}
            </Select>
          </Col>
          <Col flex="none">
            <Select placeholder="状态" value={filterStatus} onChange={setFilterStatus} allowClear style={{ width: 110 }}>
              {Object.entries(STATUS_MAP).map(([k, v]) => <Option key={k} value={k}>{v.label}</Option>)}
            </Select>
          </Col>
          <Col flex="none">
            <Button icon={<ReloadOutlined />} loading={apiLoading}
              onClick={() => { setSearchText(''); setFilterCat(undefined); setFilterStatus(undefined); setQuickFilter('ALL'); loadFromApi(); }}>刷新</Button>
          </Col>
          <Col flex="auto" style={{ textAlign: 'right' }}>
            <Space>
              {selectedKeys.length > 0 && (
                <Popconfirm title={`确认删除 ${selectedKeys.length} 个工作中心？`}
                  onConfirm={() => handleDelete(selectedKeys)} okText="确认" cancelText="取消">
                  <Button danger icon={<DeleteOutlined />}>批量删除({selectedKeys.length})</Button>
                </Popconfirm>
              )}
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}
                style={{ background: '#1677FF' }}>新增工作中心</Button>
            </Space>
          </Col>
        </Row>
      </div>

      {/* 表格 */}
      <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #f0f0f0', overflow: 'hidden' }}>
        <div style={{ padding: '9px 14px', borderBottom: '1px solid #f5f5f5', display: 'flex', alignItems: 'center', gap: 8 }}>
          <ApartmentOutlined style={{ color: '#722ED1' }} />
          <span style={{ fontWeight: 600, fontSize: 14 }}>工作中心</span>
          <Tag style={{ marginLeft: 4 }}>{filtered.length} 个</Tag>
        </div>
        <Table rowKey="id" dataSource={filtered} columns={columns} size="small"
          scroll={{ x: 1500, y: 'calc(100vh - 360px)' }}
          pagination={{ pageSize: 20, showSizeChanger: true, showQuickJumper: true,
            showTotal: t => `共 ${t} 个`, size: 'small' }}
          rowSelection={{ selectedRowKeys: selectedKeys, onChange: setSelectedKeys }}
        />
      </div>

      {/* ── 新增/编辑 Modal ── */}
      <Modal
        title={
          <Space>
            <span style={{ display: 'inline-block', width: 4, height: 16, background: '#722ED1', borderRadius: 2, verticalAlign: 'middle' }} />
            {editing ? '编辑工作中心' : '新增工作中心'}
          </Space>
        }
        open={modalOpen} onOk={handleSave} onCancel={() => setModalOpen(false)}
        okText="保存" cancelText="取消" width={680}
        okButtonProps={{ style: { background: '#722ED1', borderColor: '#722ED1' } }} destroyOnClose>
        <Form form={form} layout="vertical" size="middle" style={{ marginTop: 14 }}>
          <Row gutter={14}>
            <Col span={12}>
              <Form.Item name="wcCode" label="工作中心编码" rules={[{ required: true, message: '请输入编码' }]}>
                <Input placeholder="如：WC-GRIND-01" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="wcName" label="工作中心名称" rules={[{ required: true, message: '请输入名称' }]}>
                <Input placeholder="如：数控磨削工作中心" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="category" label="类别" rules={[{ required: true }]}>
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
              <Form.Item name="costCenter" label="成本中心">
                <Input placeholder="如：CC-MFG-001" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="workshop" label="所属车间" rules={[{ required: true, message: '请选择所属车间' }]}>
                <Select
                  placeholder="选择所属车间"
                  showSearch
                  optionFilterProp="label"
                  options={WORKSHOP_LIST.map(ws => ({
                    value: ws.workshopName,
                    label: ws.workshopName,
                    disabled: ws.status === 'DISABLED',
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="leader" label="负责人" rules={[{ required: true }]}>
                <Input placeholder="如：张工" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="location" label="位置">
                <Input placeholder="如：A区" />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Divider style={{ margin: '4px 0 10px' }}>产能配置</Divider>
            </Col>
            <Col span={8}>
              <Form.Item name="headCount" label="人员数量（人）">
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="equipCount" label="设备台数（台）">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="shiftCount" label="班次数（班/天）">
                <InputNumber min={1} max={3} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="shiftHours" label="每班工时（小时）">
                <InputNumber min={1} max={12} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="capacity" label="标准产能">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="capacityUnit" label="产能单位">
                <Input placeholder="件/班" />
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
            <ApartmentOutlined style={{ color: '#722ED1' }} />
            <span>工作中心详情 — {detailItem?.wcCode}</span>
          </Space>
        }
        open={detailOpen} onCancel={() => setDetailOpen(false)}
        footer={<Button onClick={() => setDetailOpen(false)}>关闭</Button>}
        width={640}>
        {detailItem && (
          <Descriptions bordered size="small" column={2} style={{ marginTop: 12 }}>
            <Descriptions.Item label="编码">{detailItem.wcCode}</Descriptions.Item>
            <Descriptions.Item label="名称">{detailItem.wcName}</Descriptions.Item>
            <Descriptions.Item label="类别">
              <Tag color={(CATEGORY_MAP[detailItem.category] ?? { color: 'default' }).color}>{(CATEGORY_MAP[detailItem.category] ?? { label: detailItem.category ?? '-' }).label}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <Badge status={(STATUS_MAP[detailItem.status] ?? { badge: 'default' as any }).badge} text={(STATUS_MAP[detailItem.status] ?? { label: String(detailItem.status ?? '-') }).label} />
            </Descriptions.Item>
            <Descriptions.Item label="所属车间">{detailItem.workshop}</Descriptions.Item>
            <Descriptions.Item label="负责人">{detailItem.leader}</Descriptions.Item>
            <Descriptions.Item label="位置">{detailItem.location}</Descriptions.Item>
            <Descriptions.Item label="成本中心">{detailItem.costCenter || '—'}</Descriptions.Item>
            <Descriptions.Item label="人员数量">{detailItem.headCount} 人</Descriptions.Item>
            <Descriptions.Item label="设备台数">{detailItem.equipCount} 台</Descriptions.Item>
            <Descriptions.Item label="班次">
              {detailItem.shiftCount} 班/天，{detailItem.shiftHours} h/班
            </Descriptions.Item>
            <Descriptions.Item label="标准产能">
              <span style={{ color: '#52C41A', fontWeight: 600 }}>{detailItem.capacity.toLocaleString()}</span>
              {' '}{detailItem.capacityUnit}
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

export default WorkCenterPage;

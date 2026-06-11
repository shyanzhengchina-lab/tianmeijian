/**
 * 车间档案管理页面
 *
 * 功能：
 *   - 车间 CRUD（新增 / 编辑 / 查看 / 删除 / 启用 / 停用）
 *   - KPI 统计卡片（总数 / 正常 / 停用 / 建设中）点击快速过滤
 *   - 在详情抽屉中展示「关联工作中心」与「关联员工」列表
 *   - 车间类型 / 状态过滤 + 搜索
 *
 * 关系模型：
 *   车间 → 工作中心（workCenterData.ts：WORK_CENTER_LIST.workshop === workshopName）
 *   车间 → 员工（EmployeePage 中 employee.workshop === workshopCode，后续迭代补充）
 */
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  getWorkshopList, createWorkshop, updateWorkshop, deleteWorkshop, batchDeleteWorkshops,
} from '../../api/workshops';
import {
  Button, Input, Select, Space, Tag, Popconfirm, message,
  Row, Col, Modal, Form, Badge, Tooltip, Divider, InputNumber,
  Drawer, Descriptions, Tabs,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import Table from 'antd/es/table';
import {
  PlusOutlined, SearchOutlined, ReloadOutlined, EditOutlined,
  DeleteOutlined, EyeOutlined, CheckCircleOutlined, StopOutlined,
  BankOutlined, TeamOutlined, ApartmentOutlined, ToolOutlined,
  PhoneOutlined, EnvironmentOutlined, BuildOutlined,
} from '@ant-design/icons';
import {
  Workshop, WorkshopType, WorkshopStatus,
  WORKSHOP_LIST, WORKSHOP_TYPE_MAP, WORKSHOP_STATUS_MAP,
} from './workshopArchiveData';
import { WORK_CENTER_LIST } from '../workcenter/workCenterData';
import { OPERATORS, TEAMS } from '../workorder/workOrderData';

const { Option } = Select;
const { TextArea } = Input;

const genId = () => `ws_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

// ── 详情抽屉 ────────────────────────────────────────────────────────
const WorkshopDetailDrawer: React.FC<{
  workshop: Workshop | null;
  open: boolean;
  onClose: () => void;
  onEdit: (w: Workshop) => void;
}> = ({ workshop, open, onClose, onEdit }) => {
  if (!workshop) return null;
  const tm = WORKSHOP_TYPE_MAP[workshop.type] ?? { label: workshop.type ?? '-', color: '#aaa' };
  const sm = WORKSHOP_STATUS_MAP[workshop.status] ?? { label: String(workshop.status ?? '-'), color: '#aaa', badge: 'default' };

  // 关联工作中心
  const relatedWorkCenters = WORK_CENTER_LIST.filter(
    wc => wc.workshop === workshop.workshopName,
  );

  // 关联员工：将OPERATORS按照工序号居5姘映到车间
  // OPERATORS按teamId分组，共 6个班组，将其按轮分配到各车间
  // 车间匹配规则：
  //   - 精密加工车间 (WS-GRIND) → TM01, TM05
  //   - 热处理车间 (WS-HT) → TM02 的热处理部分
  //   - 组装车间 (WS-ASM) → TM03
  //   - 包装车间 (WS-PACK) → TM04
  //   - 全线 (WS-QC, WS-STORE) → TM06
  const WORKSHOP_TEAM_MAP: Record<string, string[]> = {
    'WS-GRIND': ['TM01', 'TM05'],
    'WS-HT':    ['TM02'],
    'WS-COAT':  ['TM02'],
    'WS-CLEAN': ['TM05'],
    'WS-ASM':   ['TM03'],
    'WS-PACK':  ['TM04'],
    'WS-QC':    ['TM06'],
    'WS-STORE': ['TM06'],
    'WS-LASER': ['TM04'],
    'WS-STER':  ['TM03'],
  };
  const teamIdsForWorkshop = WORKSHOP_TEAM_MAP[workshop.workshopCode] || [];
  // 如果没有明确映射，尝试从工作中心名称匹配 TEAMS.workCenter
  const relatedTeamIds: Set<string> = teamIdsForWorkshop.length > 0
    ? new Set(teamIdsForWorkshop)
    : new Set(TEAMS.filter(t =>
        relatedWorkCenters.some(wc => t.workCenter.includes(wc.name || '')) ||
        t.workCenter.includes(workshop.workshopName.slice(0, 3))
      ).map(t => t.id));
  const relatedEmployees = OPERATORS.filter(op => relatedTeamIds.has(op.teamId));

  const ROLE_COLOR_MAP: Record<string, string> = {
    '班组长': '#d46b08',
    '操作工': '#1677ff',
    'QC': '#389e0d',
  };

  const wcColumns: ColumnsType<typeof relatedWorkCenters[0]> = [
    { title: '编码', dataIndex: 'code', width: 130,
      render: (v: string) => <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#1677ff' }}>{v}</span> },
    { title: '名称', dataIndex: 'name', width: 160,
      render: (v: string) => <span style={{ fontSize: 12 }}>{v}</span> },
    { title: '状态', dataIndex: 'status', width: 90, align: 'center' as const,
      render: (v: string) => {
        const cfg: Record<string, { label: string; color: string }> = {
          ACTIVE:      { label: '正常', color: '#52c41a' },
          MAINTENANCE: { label: '整修中', color: '#faad14' },
          DISABLED:    { label: '停用', color: '#8c8c8c' },
        };
        const c = cfg[v] || { label: v, color: '#8c8c8c' };
        return <Tag color={c.color} style={{ fontSize: 11 }}>{c.label}</Tag>;
      } },
  ];

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={520}
      title={
        <span>
          <BankOutlined style={{ marginRight: 6, color: tm.color }} />
          车间档案详情
        </span>
      }
      extra={
        <Button type="primary" size="small" icon={<EditOutlined />} onClick={() => onEdit(workshop)}>
          编辑
        </Button>
      }
      styles={{
        header: { background: '#fff', borderBottom: '1px solid #e8ecf0' },
        body:   { background: '#f5f7fa', padding: 16 },
      }}
    >
      {/* 头部卡片 */}
      <div style={{
        background: '#fff', borderRadius: 10, padding: 16, marginBottom: 12,
        border: '1px solid #e8ecf0', display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: 12, background: `${tm.color}15`,
          border: `2px solid ${tm.color}30`, display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: 26, flexShrink: 0,
        }}>
          🏭
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#1d2939' }}>{workshop.workshopName}</div>
          <div style={{ fontSize: 12, color: '#98a2b3', marginTop: 2 }}>{workshop.workshopCode}</div>
          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
            <Tag color={tm.color} style={{ fontSize: 11 }}>{tm.label}</Tag>
            <Badge status={sm.badge} text={<span style={{ fontSize: 11, color: sm.color, fontWeight: 600 }}>{sm.label}</span>} />
          </div>
        </div>
      </div>

      <Tabs
        size="small"
        items={[
          {
            key: 'info',
            label: '基本信息',
            children: (
              <div style={{ background: '#fff', borderRadius: 8, padding: 14, border: '1px solid #e8ecf0' }}>
                {[
                  ['车间编码',   workshop.workshopCode],
                  ['车间名称',   workshop.workshopName],
                  ['车间类型',   (WORKSHOP_TYPE_MAP[workshop.type] ?? { label: workshop.type ?? '-' }).label],
                  ['车间主任',   workshop.manager],
                  ['联系电话',   workshop.managerPhone || '—'],
                  ['位置/楼区',  workshop.location],
                  ['面积(m²)',   workshop.area ? `${workshop.area} m²` : '—'],
                  ['在编人员',   `${workshop.headCount} 人`],
                  ['工作中心数', `${workshop.workCenterCount} 个`],
                  ['洁净度',     workshop.cleanLevel || '—'],
                  ['状态',       (WORKSHOP_STATUS_MAP[workshop.status] ?? { label: String(workshop.status ?? '-') }).label],
                  ['备注',       workshop.remark || '—'],
                  ['创建时间',   workshop.createdAt],
                  ['更新时间',   workshop.updatedAt],
                ].map(([l, v]) => (
                  <div key={l} style={{ display: 'flex', padding: '7px 0', borderBottom: '1px solid #f5f7fa' }}>
                    <span style={{ width: 96, color: '#98a2b3', fontSize: 12, flexShrink: 0 }}>{l}</span>
                    <span style={{ fontSize: 12, color: '#1d2939' }}>{v as string}</span>
                  </div>
                ))}
              </div>
            ),
          },
          {
            key: 'workcenters',
            label: `工作中心 (${relatedWorkCenters.length})`,
            children: (
              <div style={{ background: '#fff', borderRadius: 8, padding: 12, border: '1px solid #e8ecf0' }}>
                {relatedWorkCenters.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#98a2b3', padding: '24px 0', fontSize: 13 }}>
                    <ApartmentOutlined style={{ fontSize: 24, marginBottom: 8, display: 'block' }} />
                    暂无关联工作中心
                  </div>
                ) : (
                  <Table
                    size="small"
                    columns={wcColumns}
                    dataSource={relatedWorkCenters}
                    rowKey="code"
                    pagination={false}
                    bordered={false}
                  />
                )}
              </div>
            ),
          },
          {
            key: 'employees',
            label: `员工 (${relatedEmployees.length})`,
            children: (
              <div style={{ background: '#fff', borderRadius: 8, padding: 12, border: '1px solid #e8ecf0' }}>
                {relatedEmployees.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#98a2b3', padding: '24px 0', fontSize: 13 }}>
                    <TeamOutlined style={{ fontSize: 24, marginBottom: 8, display: 'block' }} />
                    暂无关联员工数据（可在员工档案中配置）
                  </div>
                ) : (
                  <div>
                    {relatedEmployees.map(emp => {
                      const team = TEAMS.find(t => t.id === emp.teamId);
                      const roleColor = ROLE_COLOR_MAP[emp.role] || '#8c8c8c';
                      return (
                        <div
                          key={emp.id}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0',
                            borderBottom: '1px solid #f5f7fa',
                          }}
                        >
                          <div style={{
                            width: 32, height: 32, borderRadius: '50%', background: `${roleColor}15`,
                            border: `1.5px solid ${roleColor}40`, display: 'flex',
                            alignItems: 'center', justifyContent: 'center', fontSize: 13,
                            color: roleColor, fontWeight: 700, flexShrink: 0,
                          }}>
                            {emp.name[0]}
                          </div>
                          <div style={{ flex: 1 }}>
                            <Space size={6}>
                              <span style={{ fontWeight: 600, fontSize: 13 }}>{emp.name}</span>
                              <span style={{ fontSize: 11, color: '#98a2b3' }}>({emp.id})</span>
                              <Tag color={roleColor} style={{ fontSize: 10, padding: '0 5px' }}>
                                {emp.role === '班组长' ? '★ ' : ''}{emp.role}
                              </Tag>
                            </Space>
                            {team && (
                              <div style={{ fontSize: 11, color: '#98a2b3', marginTop: 2 }}>
                                <TeamOutlined style={{ marginRight: 3 }} />{team.name}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ),
          },
        ]}
      />
    </Drawer>
  );
};

// ── 新建/编辑弹窗 ────────────────────────────────────────────────────
const WorkshopFormModal: React.FC<{
  open: boolean;
  editData: Workshop | null;
  onClose: () => void;
  onSaved: (w: Workshop) => void;
}> = ({ open, editData, onClose, onSaved }) => {
  const [form] = Form.useForm();
  const isEdit = !!editData;

  React.useEffect(() => {
    if (open) {
      if (isEdit && editData) {
        form.setFieldsValue(editData);
      } else {
        form.resetFields();
        form.setFieldsValue({ type: 'MACHINING', status: 'ACTIVE', headCount: 0, workCenterCount: 0 });
      }
    }
  }, [open, editData, isEdit, form]);

  const handleOk = () => {
    form.validateFields().then(vals => {
      const now = new Date().toISOString().slice(0, 10);
      const ws: Workshop = isEdit && editData
        ? { ...editData, ...vals, updatedAt: now }
        : { ...vals, id: genId(), createdAt: now, updatedAt: now };
      onSaved(ws);
      message.success(isEdit ? `车间「${vals.workshopName}」已更新` : `车间「${vals.workshopName}」创建成功`);
      onClose();
      form.resetFields();
    }).catch((err: any) => { if (err?.errorFields) return; });
  };

  return (
    <Modal
      open={open}
      title={isEdit ? '✏️ 编辑车间档案' : '🏭 新建车间档案'}
      onCancel={() => { onClose(); form.resetFields(); }}
      onOk={handleOk}
      okText={isEdit ? '保存修改' : '创建车间'}
      cancelText="取消"
      width={640}
      destroyOnClose
    >
      <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="workshopCode" label="车间编码"
              rules={[{ required: true, message: '请输入车间编码' },
                      { pattern: /^WS-[A-Z0-9_-]+$/, message: '格式：WS-XXXX，仅大写字母/数字' }]}>
              <Input placeholder="如 WS-GRIND" style={{ fontFamily: 'monospace' }} disabled={isEdit} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="workshopName" label="车间名称"
              rules={[{ required: true, message: '请输入车间名称' }]}>
              <Input placeholder="如 精密加工车间" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="type" label="车间类型" rules={[{ required: true }]}>
              <Select>
                {Object.entries(WORKSHOP_TYPE_MAP).map(([k, v]) => (
                  <Option key={k} value={k}>
                    <Tag color={v.color} style={{ marginRight: 4 }}>{v.label}</Tag>
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="status" label="状态">
              <Select>
                {Object.entries(WORKSHOP_STATUS_MAP).map(([k, v]) => (
                  <Option key={k} value={k}>
                    <span style={{ color: v.color }}>● {v.label}</span>
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="cleanLevel" label="洁净度（选填）">
              <Select allowClear placeholder="如 十万级">
                {['百级', '千级', '万级', '十万级', '普通区'].map(l => (
                  <Option key={l} value={l}>{l}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="manager" label="车间主任" rules={[{ required: true, message: '请输入车间主任' }]}>
              <Input placeholder="如 张工" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="managerPhone" label="联系电话">
              <Input placeholder="138xxxx0000" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="location" label="位置/楼区" rules={[{ required: true, message: '请输入位置' }]}>
              <Input placeholder="如 A区 1F" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="area" label="面积（m²，选填）">
              <InputNumber min={0} style={{ width: '100%' }} placeholder="如 1200" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="headCount" label="在编人员数">
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="workCenterCount" label="工作中心数">
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item name="remark" label="备注（选填）">
          <TextArea rows={2} placeholder="请输入车间备注信息" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

// ════════════════════════════════════════════════════════════
// 主页面
// ════════════════════════════════════════════════════════════
const WorkshopArchivePage: React.FC = () => {
  const [list, setList] = useState<Workshop[]>(WORKSHOP_LIST);  // 初始用本地 mock 数据，加载后替换
  const [apiLoading, setApiLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filterType, setFilterType] = useState<string | undefined>();
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [quickFilter, setQuickFilter] = useState<'ALL' | WorkshopStatus>('ALL');
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);

  // ── 从后端加载车间数据 ────────────────────────────────────────
  const loadFromApi = useCallback(async () => {
    setApiLoading(true);
    try {
      const resp = await getWorkshopList() as any;
      const apiList: any[] = resp.data ?? [];
      if (apiList.length > 0) {
        // 将后端数据映射到前端 Workshop 类型
        const mapped: Workshop[] = apiList.map((item: any) => ({
          id: item.id?.toString() ?? item.code ?? String(Math.random()),
          workshopCode: item.code ?? '',
          workshopName: item.name ?? '',
          type: ({
            '生产车间': 'MACHINING', '加工车间': 'MACHINING',
            '检验车间': 'INSPECTION', '质检车间': 'INSPECTION',
            '清洗车间': 'CLEANING',
            '灭菌车间': 'STERILIZATION',
            '包装车间': 'PACKAGING',
            '仓储车间': 'WAREHOUSE', '仓储': 'WAREHOUSE',
            '组装车间': 'ASSEMBLY',
          } as any)[item.type] ?? item.type ?? 'MACHINING',
          manager: item.managerName ?? '',
          managerPhone: item.phone ?? '',
          location: item.address ?? '',
          area: undefined,
          headCount: 0,
          workCenterCount: 0,
          cleanLevel: undefined,
          status: item.status === 0 ? 'DISABLED' : 'ACTIVE',
          remark: item.description ?? '',
          createdAt: item.createTime ? item.createTime.slice(0, 10) : '',
          updatedAt: item.updateTime ? item.updateTime.slice(0, 10) : '',
        }));
        setList(mapped);
      }
    } catch {
      // 后端不可用时保留本地 mock 数据，不报错
    } finally {
      setApiLoading(false);
    }
  }, []);

  useEffect(() => { loadFromApi(); }, [loadFromApi]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Workshop | null>(null);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<Workshop | null>(null);

  // ── 过滤 ─────────────────────────────────────────────────
  const filtered = useMemo(() => list.filter(w => {
    if (quickFilter !== 'ALL' && w.status !== quickFilter) return false;
    const t = searchText.toLowerCase();
    return (
      (!t
        || w.workshopCode.toLowerCase().includes(t)
        || w.workshopName.includes(t)
        || w.manager.includes(t)
        || w.location.includes(t))
      && (!filterType   || w.type === filterType)
      && (!filterStatus || w.status === filterStatus)
    );
  }), [list, searchText, filterType, filterStatus, quickFilter]);

  const summary = useMemo(() => ({
    total:        list.length,
    active:       list.filter(w => w.status === 'ACTIVE').length,
    disabled:     list.filter(w => w.status === 'DISABLED').length,
    construction: list.filter(w => w.status === 'CONSTRUCTION').length,
    totalHeads:   list.reduce((s, w) => s + w.headCount, 0),
    totalWC:      list.reduce((s, w) => s + w.workCenterCount, 0),
  }), [list]);

  // ── CRUD ──────────────────────────────────────────────────
  const handleAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const handleEdit = (w: Workshop) => {
    setEditing(w);
    setModalOpen(true);
  };

  const handleView = (w: Workshop) => {
    setDetailItem(w);
    setDetailOpen(true);
  };

  const handleDelete = async (ids: React.Key[]) => {
    try {
      if (ids.length === 1) {
        const id = Number(ids[0]);
        if (!isNaN(id)) await deleteWorkshop(id);
      } else {
        const numIds = ids.map(Number).filter(n => !isNaN(n));
        if (numIds.length > 0) await batchDeleteWorkshops(numIds);
      }
    } catch { /* API error already handled by http interceptor */ }
    setList(prev => prev.filter(w => !ids.includes(w.id)));
    setSelectedKeys([]);
    message.success(`已删除 ${ids.length} 个车间档案`);
  };

  const handleStatusChange = async (id: string, status: WorkshopStatus) => {
    const now = new Date().toISOString().slice(0, 10);
    try {
      const numId = Number(id);
      if (!isNaN(numId)) {
        await updateWorkshop(numId, { status: status === 'ACTIVE' ? 1 : 0 });
      }
    } catch { /* fallback to local */ }
    setList(prev => prev.map(w => w.id === id ? { ...w, status, updatedAt: now } : w));
    message.success(`车间已${(WORKSHOP_STATUS_MAP[status] ?? { label: String(status) }).label}`);
  };

  const handleSaved = async (ws: Workshop) => {
    const isExisting = list.some(w => w.id === ws.id);
    try {
      const payload = {
        code: ws.workshopCode,
        name: ws.workshopName,
        type: ws.type,
        managerName: ws.manager,
        phone: ws.managerPhone,
        address: ws.location,
        description: ws.remark,
        status: ws.status === 'DISABLED' ? 0 : 1,
      };
      if (isExisting) {
        const numId = Number(ws.id);
        if (!isNaN(numId)) await updateWorkshop(numId, payload);
      } else {
        const resp = await createWorkshop(payload) as any;
        // 用后端返回的 id 替换前端生成的临时 id
        if (resp.data?.id) ws = { ...ws, id: resp.data.id.toString() };
      }
    } catch { /* fallback to local */ }
    setList(prev => prev.some(w => w.id === ws.id)
      ? prev.map(w => w.id === ws.id ? ws : w)
      : [ws, ...prev]);
    setModalOpen(false);
  };

  // ── KPI 卡片 ─────────────────────────────────────────────
  const kpiCards = [
    { label: '车间总数',  val: summary.total,        color: '#1677ff', filter: 'ALL' as const },
    { label: '正常运行',  val: summary.active,        color: '#52c41a', filter: 'ACTIVE' as const },
    { label: '已停用',    val: summary.disabled,      color: '#8c8c8c', filter: 'DISABLED' as const },
    { label: '建设中',    val: summary.construction,  color: '#faad14', filter: 'CONSTRUCTION' as const },
  ];

  // ── 列定义 ───────────────────────────────────────────────
  const columns: ColumnsType<Workshop> = [
    { title: '序号', width: 50, align: 'center',
      render: (_: any, __: any, i: number) =>
        <span style={{ color: '#aaa', fontSize: 12 }}>{i + 1}</span> },
    { title: '车间编码', dataIndex: 'workshopCode', width: 120,
      render: (v: string, r: Workshop) => (
        <span style={{ color: '#1677FF', fontWeight: 600, cursor: 'pointer', fontFamily: 'monospace', fontSize: 12 }}
          onClick={() => handleView(r)}>
          <BankOutlined style={{ marginRight: 4 }} />{v}
        </span>
      ) },
    { title: '车间名称', dataIndex: 'workshopName', width: 140,
      render: (v: string) => <span style={{ fontWeight: 600, fontSize: 13 }}>{v}</span> },
    { title: '类型', dataIndex: 'type', width: 95, align: 'center',
      render: (v: WorkshopType) => {
        const m = WORKSHOP_TYPE_MAP[v] ?? { color: 'default', label: v ?? '-' };
        return <Tag color={m.color} style={{ fontSize: 11 }}>{m.label}</Tag>;
      } },
    { title: '车间主任', dataIndex: 'manager', width: 90,
      render: (v: string) => (
        <Space size={4}>
          <TeamOutlined style={{ color: '#888', fontSize: 11 }} />
          <span style={{ fontSize: 12 }}>{v}</span>
        </Space>
      ) },
    { title: '位置', dataIndex: 'location', width: 100,
      render: (v: string) => (
        <Space size={4}>
          <EnvironmentOutlined style={{ color: '#aaa', fontSize: 11 }} />
          <span style={{ fontSize: 12, color: '#555' }}>{v}</span>
        </Space>
      ) },
    { title: '人员/工作中心', width: 120, align: 'center',
      render: (_: any, r: Workshop) => (
        <Space direction="vertical" size={0} style={{ textAlign: 'center' }}>
          <span style={{ fontSize: 12 }}><TeamOutlined style={{ color: '#1677ff' }} /> {r.headCount}人</span>
          <span style={{ fontSize: 12 }}><ApartmentOutlined style={{ color: '#52c41a' }} /> {r.workCenterCount}个</span>
        </Space>
      ) },
    { title: '洁净度', dataIndex: 'cleanLevel', width: 80, align: 'center',
      render: (v: string) =>
        v ? <Tag color="cyan" style={{ fontSize: 11 }}>{v}</Tag>
          : <span style={{ color: '#ddd', fontSize: 11 }}>—</span> },
    { title: '状态', dataIndex: 'status', width: 95, align: 'center',
      render: (v: WorkshopStatus) => {
        const m = WORKSHOP_STATUS_MAP[v] ?? { badge: 'default' as any, label: String(v ?? '-') };
        return <Badge status={m.badge} text={<span style={{ fontSize: 12 }}>{m.label}</span>} />;
      } },
    { title: '更新时间', dataIndex: 'updatedAt', width: 100,
      render: (v: string) => <span style={{ fontSize: 11, color: '#98a2b3' }}>{v}</span> },
    { title: '操作', width: 200, fixed: 'right' as const,
      render: (_: any, r: Workshop) => (
        <Space size={0} split={<span style={{ color: '#e8e8e8', margin: '0 1px' }}>|</span>}>
          <Button type="link" size="small" icon={<EyeOutlined />}
            style={{ padding: '0 4px', fontSize: 12 }} onClick={() => handleView(r)}>详情</Button>
          <Button type="link" size="small" icon={<EditOutlined />}
            style={{ padding: '0 4px', fontSize: 12 }} onClick={() => handleEdit(r)}>编辑</Button>
          {r.status === 'ACTIVE' && (
            <Popconfirm title="确认停用该车间？停用后关联工作中心排程将受影响。"
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
          <Popconfirm
            title="确认删除该车间档案？"
            description="删除后不可恢复，关联的工作中心将失去所属车间"
            okText="确认删除" cancelText="取消" okButtonProps={{ danger: true }}
            onConfirm={() => handleDelete([r.id])}>
            <Button type="link" size="small" icon={<DeleteOutlined />} danger
              style={{ padding: '0 4px', fontSize: 12 }}>删除</Button>
          </Popconfirm>
        </Space>
      ) },
  ];

  const rowSelection = {
    selectedRowKeys: selectedKeys,
    onChange: (keys: React.Key[]) => setSelectedKeys(keys),
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
      {/* 页头 */}
      <div style={{
        background: '#fff', padding: '12px 16px',
        borderBottom: '1px solid #e8ecf0', flexShrink: 0,
      }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: '#1d2939' }}>
          <BankOutlined style={{ color: '#1677ff', marginRight: 8 }} />
          车间档案管理
        </span>
        <span style={{ fontSize: 12, color: '#98a2b3', marginLeft: 12 }}>
          管理生产车间信息，建立车间 → 工作中心 → 员工 的完整组织关系
        </span>
      </div>

      {/* KPI 统计卡片 */}
      <div style={{
        display: 'flex', gap: 10, padding: '10px 16px',
        background: '#fff', borderBottom: '1px solid #e8ecf0',
        flexShrink: 0, flexWrap: 'wrap', alignItems: 'center',
      }}>
        {kpiCards.map(k => {
          const isActive = quickFilter === k.filter;
          return (
            <div
              key={k.label}
              onClick={() => setQuickFilter(isActive && k.filter !== 'ALL' ? 'ALL' : k.filter)}
              style={{
                padding: '8px 18px', borderRadius: 8, textAlign: 'center', minWidth: 80,
                cursor: 'pointer', transition: 'all 0.2s', userSelect: 'none',
                background: isActive ? `${k.color}15` : '#f8faff',
                border: `1px solid ${isActive ? k.color : '#e8ecf0'}`,
                boxShadow: isActive ? `0 0 0 2px ${k.color}30` : undefined,
              }}
            >
              <div style={{ fontSize: 20, fontWeight: 700, color: k.color }}>{k.val}</div>
              <div style={{ fontSize: 11, color: isActive ? k.color : '#98a2b3', fontWeight: isActive ? 600 : 400 }}>
                {k.label}{isActive && k.filter !== 'ALL' ? ' ✓' : ''}
              </div>
            </div>
          );
        })}
        <Divider type="vertical" style={{ height: 36, margin: '0 4px' }} />
        <div style={{ padding: '8px 14px', borderRadius: 8, background: '#f0f9ff', border: '1px solid #bae0ff', textAlign: 'center', minWidth: 80 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#0958d9' }}>{summary.totalHeads}</div>
          <div style={{ fontSize: 11, color: '#0958d9' }}>在编总人数</div>
        </div>
        <div style={{ padding: '8px 14px', borderRadius: 8, background: '#f6ffed', border: '1px solid #b7eb8f', textAlign: 'center', minWidth: 80 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#389e0d' }}>{summary.totalWC}</div>
          <div style={{ fontSize: 11, color: '#389e0d' }}>工作中心总数</div>
        </div>
      </div>

      {/* 工具栏 */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px',
        background: '#fff', borderBottom: '1px solid #e8ecf0', flexShrink: 0, flexWrap: 'wrap',
      }}>
        <Input
          prefix={<SearchOutlined style={{ color: '#aaa' }} />}
          placeholder="搜索车间编码 / 名称 / 主任 / 位置..."
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          style={{ width: 280 }}
          allowClear
        />
        <Select
          placeholder="车间类型"
          value={filterType}
          onChange={setFilterType}
          allowClear
          style={{ width: 120 }}
        >
          {Object.entries(WORKSHOP_TYPE_MAP).map(([k, v]) => (
            <Option key={k} value={k}><Tag color={v.color}>{v.label}</Tag></Option>
          ))}
        </Select>
        <Select
          placeholder="状态"
          value={filterStatus}
          onChange={setFilterStatus}
          allowClear
          style={{ width: 110 }}
        >
          {Object.entries(WORKSHOP_STATUS_MAP).map(([k, v]) => (
            <Option key={k} value={k}><span style={{ color: v.color }}>● {v.label}</span></Option>
          ))}
        </Select>
        {selectedKeys.length > 0 && (
          <Popconfirm
            title={`确认批量删除 ${selectedKeys.length} 个车间？`}
            okText="确认" cancelText="取消" okButtonProps={{ danger: true }}
            onConfirm={() => handleDelete(selectedKeys)}>
            <Button danger icon={<DeleteOutlined />}>
              批量删除({selectedKeys.length})
            </Button>
          </Popconfirm>
        )}
        <div style={{ flex: 1 }} />
        <Button
          icon={<ReloadOutlined />}
          loading={apiLoading}
          onClick={() => {
            setSearchText('');
            setFilterType(undefined);
            setFilterStatus(undefined);
            setQuickFilter('ALL');
            setSelectedKeys([]);
            loadFromApi();
          }}
        >
          刷新
        </Button>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新建车间
        </Button>
      </div>

      {/* 数据表格 */}
      <div style={{ flex: 1, overflow: 'auto', padding: '12px 16px' }}>
        <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e8ecf0', overflow: 'hidden' }}>
          <Table<Workshop>
            size="small"
            rowKey="id"
            loading={apiLoading}
            columns={columns}
            dataSource={filtered}
            rowSelection={rowSelection}
            scroll={{ x: 1200 }}
            pagination={{
              pageSize: 15,
              showSizeChanger: true,
              showTotal: (t: number) => `共 ${t} 个车间`,
            }}
            locale={{ emptyText: '暂无车间数据' }}
          />
        </div>
      </div>

      {/* 详情抽屉 */}
      <WorkshopDetailDrawer
        workshop={detailItem}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        onEdit={w => { setDetailOpen(false); handleEdit(w); }}
      />

      {/* 新建/编辑弹窗 */}
      <WorkshopFormModal
        open={modalOpen}
        editData={editing}
        onClose={() => setModalOpen(false)}
        onSaved={handleSaved}
      />
    </div>
  );
};

export default WorkshopArchivePage;

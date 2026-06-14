import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { getOperationList } from '../../api/operations';
import { getWorkCenterList } from '../../api/workCenters';
import type { WorkCenterRecord } from '../../api/workCenters';
import { getWorkshopList } from '../../api/workshops';
import type { WorkshopRecord } from '../../api/workshops';
import {
  Table, Button, Input, Select, Space, Tag, Popconfirm, message,
  Row, Col, Modal, Form, Drawer, Badge, Tooltip,
  Divider, Switch, InputNumber, Alert, Steps, Card,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined, SearchOutlined, ReloadOutlined, EditOutlined,
  DeleteOutlined, EyeOutlined, ToolOutlined, CheckCircleOutlined,
  StopOutlined, ExclamationCircleOutlined, ApartmentOutlined,
  ClockCircleOutlined, SettingOutlined, ArrowUpOutlined,
  ArrowDownOutlined, UnorderedListOutlined, AppstoreOutlined,
  InfoCircleOutlined, OrderedListOutlined, FormOutlined,
  RightCircleOutlined, BulbOutlined,
} from '@ant-design/icons';
import {
  mockOperations, Operation, OperationPhase, PhaseField,
  OpCategory, OpStatus, PhaseType, FieldDataType, FieldInputType,
  OP_CATEGORY_MAP, OP_STATUS_MAP, PHASE_TYPE_MAP,
} from './operationData';
import { WORK_CENTER_LIST } from '../workcenter/workCenterData';

// ── 工作中心数据从共享模块加载
const WORK_CENTERS = WORK_CENTER_LIST;

// ── 车间静态fallback（API不可用时使用，从WORK_CENTER_LIST推断）
const STATIC_WORKSHOP_FALLBACK: WorkshopRecord[] = Array.from(
  new Set(WORK_CENTER_LIST.map(wc => wc.workshop))
).map((name, idx) => ({ id: idx + 1, name } as WorkshopRecord));

// ── 设备类型枚举（按保健品工序类别归类）
const EQUIP_TYPE_OPTIONS = [
  { group: '制粒/干燥设备', items: ['湿法制粒机', '流化床干燥机', '干法制粒机', '喷雾干燥机'] },
  { group: '混合/压制设备', items: ['三维运动混合机', '槽型混合机', '旋转式压片机', '单冲压片机'] },
  { group: '包衣/充填设备', items: ['高效包衣机', '全自动胶囊充填机', '软胶囊机', '滴丸机'] },
  { group: '包装设备',       items: ['全自动数片机', '全自动装盒机', '铝塑泡罩机', '热收缩包装机'] },
  { group: '标识设备',       items: ['激光喷码机', '喷墨打码机', '热转印打标机'] },
  { group: '冷链设备',       items: ['冷链储存柜', '冷链运输车', '超低温冷藏箱', '温湿度记录仪'] },
  { group: '检验设备',       items: ['HPLC高效液相色谱仪', '溶出度测定仪', '活菌数检测仪', '万分之一天平', '片剂硬度脆碎度仪', '崩解仪'] },
];

const { Option } = Select;
const { TextArea } = Input;

// ── 常量 ────────────────────────────────────────────────────
const PHASE_TYPE_OPTIONS: { value: PhaseType; label: string; desc: string }[] = [
  { value: 'PREP',  label: '生产准备 PREP',  desc: '生产前清场、设备点检、量具校准' },
  { value: 'LOAD',  label: '上料核对 LOAD',  desc: '来料扫码、数量核对、物料确认' },
  { value: 'EXEC',  label: '加工执行 EXEC',  desc: '批量加工主过程，记录设备参数' },
  { value: 'IPQC',  label: '过程检验 IPQC',  desc: '首件/巡检/末件等过程质量控制' },
  { value: 'OQC',   label: '完工检验 OQC',   desc: '批次完工后的成品检验' },
  { value: 'CLEAN', label: '清场清洁 CLEAN', desc: '完工后设备清洁、余料退库' },
  { value: 'HAND',  label: '工序交接 HAND',  desc: '流转卡扫码、工序间数量移交' },
  { value: 'SPEC',  label: '特殊确认 SPEC',  desc: '特殊工艺确认、合规性验证' },
];

// PhaseType → PAD StageCode 对照
const PHASE_TYPE_TO_PAD_STAGE: Partial<Record<PhaseType, string>> = {
  PREP:  '前清场 PRE_CLEAN',
  LOAD:  '物料核对 MAT_VERIFY',
  EXEC:  '数据采集 DATA_COLLECT',
  IPQC:  '首件确认 FIRST_PIECE',
  OQC:   '自检 SELF_CHECK',
  CLEAN: '后清场 POST_CLEAN',
  HAND:  '出站 CHECK_OUT',
  SPEC:  '自检 SELF_CHECK',
};

const DATA_TYPE_OPTIONS: FieldDataType[] = [
  'Decimal','Int','String','Enum','Boolean','DateTime','Date','Image','JSON','Ref',
];

const INPUT_TYPE_OPTIONS: { value: FieldInputType; label: string; color: string }[] = [
  { value: 'AUTO',   label: '自动采集', color: '#13C2C2' },
  { value: 'MANUAL', label: '手工录入', color: '#1677FF' },
  { value: 'SELECT', label: '下拉选择', color: '#722ED1' },
  { value: 'SCAN',   label: '扫码录入', color: '#52C41A' },
  { value: 'ESIGN',  label: '电子签名', color: '#E60012' },
  { value: 'UPLOAD', label: '上传附件', color: '#FA8C16' },
];

const INPUT_TAG: Record<string, { label: string; color: string }> = {
  AUTO:   { label: '自动采集', color: '#13C2C2' },
  MANUAL: { label: '手工录入', color: '#1677FF' },
  SELECT: { label: '下拉选择', color: '#722ED1' },
  SCAN:   { label: '扫码录入', color: '#52C41A' },
  ESIGN:  { label: '电子签名', color: '#E60012' },
  UPLOAD: { label: '上传附件', color: '#FA8C16' },
};

const genId = () => `id_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

// ════════════════════════════════════════════════════════════
// 主组件
// ════════════════════════════════════════════════════════════
const OperationListPage: React.FC = () => {
  const [operations, setOperations] = useLocalStorage<Operation[]>('bip_operations', []);

  // ── 工作中心选项：从API加载，fallback到静态列表 ──
  const [wcOptions, setWcOptions] = useState<WorkCenterRecord[]>([]);
  // ── 车间选项：从车间档案API加载 ──
  const [workshopOptions, setWorkshopOptions] = useState<WorkshopRecord[]>([]);

  useEffect(() => {
    // 并行加载工作中心 + 车间档案
    Promise.allSettled([
      getWorkCenterList() as Promise<any>,
      getWorkshopList()   as Promise<any>,
    ]).then(([wcRes, wsRes]) => {
      // 工作中心
      if (wcRes.status === 'fulfilled') {
        const list: WorkCenterRecord[] = wcRes.value?.data ?? [];
        if (list.length > 0) {
          setWcOptions(list);
        } else {
          setWcOptions(WORK_CENTERS.map(wc => ({
            code: wc.code, name: wc.name, workshopName: wc.workshop,
          } as WorkCenterRecord)));
        }
      } else {
        setWcOptions(WORK_CENTERS.map(wc => ({
          code: wc.code, name: wc.name, workshopName: wc.workshop,
        } as WorkCenterRecord)));
      }
      // 车间档案
      if (wsRes.status === 'fulfilled') {
        const wsList: WorkshopRecord[] = wsRes.value?.data ?? [];
        setWorkshopOptions(wsList.length > 0 ? wsList : STATIC_WORKSHOP_FALLBACK);
      } else {
        setWorkshopOptions(STATIC_WORKSHOP_FALLBACK);
      }
    });
  }, []);
  const [searchText, setSearchText] = useState('');
  const [filterCategory, setFilterCategory] = useState<string | undefined>();
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [quickFilter, setQuickFilter] = useState<'ALL'|'ACTIVE'|'BOTTLENECK'|'SPEC'>('ALL');
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  // ── loadFromApi: 合并后端工序数据 ──
  const loadFromApi = useCallback(async () => {
    try {
      const resp = await getOperationList() as any;
      const apiList: any[] = resp?.data ?? [];
      if (apiList.length > 0) {
        const newOps: Operation[] = apiList.map((item: any) => ({
          id: `api-${item.id}`,
          opCode: item.opCode ?? item.code ?? item.operationCode ?? `OP-${item.id}`,
          opName: item.opName ?? item.name ?? item.operationName ?? '',
          opShort: item.opName ?? item.name ?? '',
          category: (item.opType || 'PROD') as any,
          workshop: item.workshopType ?? '',
          productLine: '',
          workCenter: item.workCenterName ?? '',
          equipType: '',
          stdTimeMin: Number(item.stdTime ?? item.standardTime ?? 0),
          prepTimeMin: 0,
          hasFirstPiece: false,
          hasLastPiece: false,
          hasPatrol: false,
          hasCleanup: false,
          isBottleneck: false,
          isReportPoint: false,
          isQcPoint: false,
          status: 'ACTIVE' as any,
          version: 'V1.0',
          effectDate: item.createTime?.slice(0, 10) ?? '',
          createdBy: item.createBy ?? '',
          updatedAt: item.updateTime ?? '',
          phases: [],
        }));
        setOperations(newOps);  // API-first REPLACE
      }
    } catch { /* backend offline */ }
  }, [setOperations]);

  useEffect(() => { loadFromApi(); }, [loadFromApi]);

  // 新建/编辑工序 Modal
  const [opModalOpen, setOpModalOpen] = useState(false);
  const [editingOp, setEditingOp] = useState<Operation | null>(null);
  const [opForm] = Form.useForm();

  // 阶段管理 Drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [viewingOp, setViewingOp] = useState<Operation | null>(null);

  // ── 过滤 ──────────────────────────────────────────────────
  const filtered = useMemo(() => operations.filter(op => {
    if (quickFilter === 'ACTIVE'     && op.status !== 'ACTIVE') return false;
    if (quickFilter === 'BOTTLENECK' && !op.isBottleneck) return false;
    if (quickFilter === 'SPEC'       && op.category !== 'SPEC') return false;
    const t = searchText.toLowerCase();
    return (!t || op.opCode.toLowerCase().includes(t) || op.opName.includes(t) || op.workshop.includes(t))
      && (!filterCategory || op.category === filterCategory)
      && (!filterStatus   || op.status   === filterStatus);
  }), [operations, searchText, filterCategory, filterStatus, quickFilter]);

  const summary = useMemo(() => ({
    total:      operations.length,
    active:     operations.filter(o => o.status === 'ACTIVE').length,
    bottleneck: operations.filter(o => o.isBottleneck).length,
    spec:       operations.filter(o => o.category === 'SPEC').length,
  }), [operations]);

  // ── 更新单个工序 ────────────────────────────────────────
  const updateOp = (updated: Operation) => {
    setOperations(prev => prev.map(o => o.id === updated.id ? updated : o));
    if (viewingOp?.id === updated.id) setViewingOp(updated);
  };

  // ── 工序 CRUD ─────────────────────────────────────────────
  const handleAdd = () => {
    setEditingOp(null);
    opForm.resetFields();
    opForm.setFieldsValue({ status: 'DRAFT', version: 'V1.0', category: 'PROD',
      hasFirstPiece: false, hasLastPiece: false, hasPatrol: false, hasCleanup: true,
      isBottleneck: false, isReportPoint: true, isQcPoint: false,
      stdTimeMin: 0, prepTimeMin: 0 });
    setOpModalOpen(true);
  };

  const handleEdit = (op: Operation) => {
    setEditingOp(op);
    opForm.setFieldsValue(op);
    setOpModalOpen(true);
  };

  const handleView = (op: Operation) => {
    setViewingOp(op);
    setDrawerOpen(true);
  };

  const handleDelete = (ids: React.Key[]) => {
    setOperations(prev => prev.filter(o => !ids.includes(o.id)));
    setSelectedRowKeys([]);
    message.success(`已删除 ${ids.length} 条工序`);
  };

  const handleStatusChange = (ids: React.Key[], status: OpStatus) => {
    setOperations(prev => prev.map(o =>
      ids.includes(o.id) ? { ...o, status, updatedAt: new Date().toISOString().slice(0, 10) } : o
    ));
    setSelectedRowKeys([]);
    message.success(OP_STATUS_MAP[status].label + ' 操作成功');
  };

  const handleOpSave = () => {
    opForm.validateFields().then(vals => {
      if (editingOp) {
        const updated = { ...editingOp, ...vals, updatedAt: new Date().toISOString().slice(0, 10) };
        updateOp(updated);
        message.success('修改成功');
      } else {
        const newOp: Operation = {
          ...vals,
          id: genId(),
          phases: [],
          createdBy: '当前用户',
          updatedAt: new Date().toISOString().slice(0, 10),
          effectDate: new Date().toISOString().slice(0, 10),
        };
        setOperations(prev => [newOp, ...prev]);
        message.success('新建工序成功');
        // 新建后直接打开阶段配置
        setViewingOp(newOp);
        setOpModalOpen(false);
        setDrawerOpen(true);
        return;
      }
      setOpModalOpen(false);
    }).catch((err: any) => { if (err?.errorFields) return; });
  };

  // ── 列定义 ────────────────────────────────────────────────
  const columns: ColumnsType<Operation> = [
    { title: '序号', width: 50, align: 'center',
      render: (_: any, __: any, i: number) => <span style={{ color: '#aaa', fontSize: 12 }}>{i + 1}</span> },
    { title: '工序编码', dataIndex: 'opCode', width: 155,
      render: (v: string, r: Operation) => (
        <span style={{ color: '#1677FF', fontWeight: 600, cursor: 'pointer', fontFamily: 'monospace', fontSize: 12 }}
          onClick={() => handleView(r)}>
          <ToolOutlined style={{ marginRight: 4 }} />{v}
        </span>
      ) },
    { title: '工序名称', dataIndex: 'opName', width: 120,
      render: (v: string, r: Operation) => (
        <Space size={4}>
          <span style={{ fontWeight: 500, fontSize: 13 }}>{v}</span>
          {r.isBottleneck && <Tooltip title="瓶颈工序"><Badge color="#E60012" dot /></Tooltip>}
        </Space>
      ) },
    { title: '类别', dataIndex: 'category', width: 95, align: 'center',
      render: (v: OpCategory) => {
        const m = OP_CATEGORY_MAP[v];
        if (!m) return <Tag style={{ fontSize: 11 }}>{v ?? '-'}</Tag>;
        return <Tag color={m.color} style={{ fontSize: 11 }}>{m.label}</Tag>;
      } },
    { title: '所属车间', dataIndex: 'workshop', width: 110,
      render: (v: string) => <span style={{ fontSize: 12, color: '#555' }}>{v}</span> },
    { title: '标准工时', dataIndex: 'stdTimeMin', width: 85, align: 'center',
      render: (v: number) => (
        <Space size={2}>
          <ClockCircleOutlined style={{ color: '#1677FF', fontSize: 11 }} />
          <span style={{ fontWeight: 600, color: '#1677FF' }}>{v}</span>
          <span style={{ fontSize: 11, color: '#888' }}>分</span>
        </Space>
      ) },
    {
      title: (
        <Space size={4}>
          <OrderedListOutlined />
          <span>阶段序列</span>
          <Tooltip title="点击「配置阶段」按钮可新增/编辑阶段及字段">
            <InfoCircleOutlined style={{ color: '#aaa', fontSize: 11 }} />
          </Tooltip>
        </Space>
      ),
      width: 340,
      render: (_: any, r: Operation) => {
        if (r.phases.length === 0) {
          return (
            <span style={{ fontSize: 11, color: '#bbb', fontStyle: 'italic' }}>
              暂无阶段 — 点击右侧「配置阶段」添加
            </span>
          );
        }
        return (
          <Space size={3} wrap>
            {r.phases.map((ph, idx) => {
              const pt = PHASE_TYPE_MAP[ph.phaseType];
              return (
                <Tooltip key={ph.phaseCode}
                  title={`${ph.phaseName}（${pt.label}） · ${ph.fields.length}个字段${ph.eSign ? ' · 需签名' : ''}${ph.dualReview ? ' · 双人复核' : ''}`}>
                  <Tag style={{
                    fontSize: 10, padding: '1px 5px', cursor: 'default',
                    color: pt.color, background: pt.color + '15',
                    border: `1px solid ${pt.color}40`, margin: '1px 0',
                  }}>
                    S{idx + 1} {ph.phaseName}
                  </Tag>
                </Tooltip>
              );
            })}
          </Space>
        );
      },
    },
    { title: '控制点', width: 170,
      render: (_: any, r: Operation) => (
        <Space size={2} wrap>
          {r.hasFirstPiece && <Tag color="orange"  style={{ fontSize: 10, padding: '0 3px' }}>首件检验</Tag>}
          {r.hasPatrol     && <Tag color="blue"    style={{ fontSize: 10, padding: '0 3px' }}>过程巡检</Tag>}
          {r.hasLastPiece  && <Tag color="purple"  style={{ fontSize: 10, padding: '0 3px' }}>末件检验</Tag>}
          {r.hasCleanup    && <Tag color="cyan"    style={{ fontSize: 10, padding: '0 3px' }}>完工清场</Tag>}
          {r.isBottleneck  && <Tag color="red"     style={{ fontSize: 10, padding: '0 3px' }}>瓶颈工序</Tag>}
          {r.isReportPoint && <Tag color="geekblue" style={{ fontSize: 10, padding: '0 3px' }}>报工点</Tag>}
          {r.isQcPoint     && <Tag color="volcano" style={{ fontSize: 10, padding: '0 3px' }}>质检点</Tag>}
          {!r.hasFirstPiece && !r.hasPatrol && !r.hasLastPiece && !r.hasCleanup && !r.isBottleneck && !r.isReportPoint && !r.isQcPoint && (
            <span style={{ fontSize: 11, color: '#ccc' }}>—</span>
          )}
        </Space>
      ) },
    { title: '状态', dataIndex: 'status', width: 80, align: 'center',
      render: (v: OpStatus) => {
        const m = OP_STATUS_MAP[v];
        const cm: Record<string, any> = { '#52C41A': 'success', '#FAAD14': 'warning', '#FF4D4F': 'error', '#8C8C8C': 'default' };
        return <Badge status={cm[m.color] || 'default'} text={<span style={{ fontSize: 12 }}>{m.label}</span>} />;
      } },
    { title: '操作', width: 190, fixed: 'right',
      render: (_: any, r: Operation) => (
        <Space size={0} split={<span style={{ color: '#e8e8e8', margin: '0 1px' }}>|</span>}>
          <Button type="link" size="small" icon={<OrderedListOutlined />}
            style={{ padding: '0 5px', fontSize: 12, color: '#1677FF', fontWeight: 600 }}
            onClick={() => handleView(r)}>配置阶段</Button>
          <Button type="link" size="small" icon={<EditOutlined />}
            style={{ padding: '0 4px', fontSize: 12 }} onClick={() => handleEdit(r)}>编辑</Button>
          {r.status === 'DRAFT' && (
            <Button type="link" size="small" icon={<CheckCircleOutlined />}
              style={{ padding: '0 4px', fontSize: 12, color: '#52C41A' }}
              onClick={() => handleStatusChange([r.id], 'ACTIVE')}>生效</Button>
          )}
          {r.status === 'ACTIVE' && (
            <Popconfirm title="确认停用此工序？停用后不可用于生产排程。" okText="确认停用" cancelText="取消"
              okButtonProps={{ danger: true }}
              onConfirm={() => handleStatusChange([r.id], 'DISABLED')}>
              <Button type="link" size="small" icon={<StopOutlined />}
                style={{ padding: '0 4px', fontSize: 12, color: '#FAAD14' }}>停用</Button>
            </Popconfirm>
          )}
          {r.status === 'DISABLED' && (
            <Button type="link" size="small" icon={<CheckCircleOutlined />}
              style={{ padding: '0 4px', fontSize: 12, color: '#52C41A' }}
              onClick={() => handleStatusChange([r.id], 'ACTIVE')}>启用</Button>
          )}
          <Popconfirm title="确认删除此工序？" okText="确认" cancelText="取消"
            icon={<ExclamationCircleOutlined style={{ color: '#E60012' }} />}
            onConfirm={() => handleDelete([r.id])}>
            <Button type="link" danger size="small" style={{ padding: '0 4px', fontSize: 12 }}>删除</Button>
          </Popconfirm>
        </Space>
      ) },
  ];

  return (
    <div style={{ padding: '0 0 16px' }}>
      {/* 操作引导横幅 */}
      <Alert
        type="info"
        showIcon
        icon={<BulbOutlined />}
        style={{ marginBottom: 12, borderRadius: 8, fontSize: 13 }}
        message={
          <span>
            <strong>阶段定义流程：</strong>
            ① 新增工序基本信息 →
            ② 点击「<OrderedListOutlined /> 配置阶段」进入阶段管理 →
            ③ 为每个阶段添加采集字段 →
            ④ 设置电子签名 / 双人复核等控制要求 →
            ⑤ 完成后将状态设为「生效」
          </span>
        }
        closable
      />

      {/* 汇总卡片（点击快速过滤） */}
      <Row gutter={12} style={{ marginBottom: 12 }}>
        {([
          { key: 'ALL',        label: '工序总数', value: summary.total,      color: '#1677FF', icon: <ToolOutlined /> },
          { key: 'ACTIVE',     label: '已生效',   value: summary.active,     color: '#52C41A', icon: <CheckCircleOutlined /> },
          { key: 'BOTTLENECK', label: '瓶颈工序', value: summary.bottleneck, color: '#E60012', icon: <ExclamationCircleOutlined /> },
          { key: 'SPEC',       label: '特殊工序', value: summary.spec,       color: '#722ED1', icon: <SettingOutlined /> },
        ] as { key: 'ALL'|'ACTIVE'|'BOTTLENECK'|'SPEC'; label: string; value: number; color: string; icon: React.ReactNode }[]).map(c => {
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
            <Input prefix={<SearchOutlined style={{ color: '#bbb' }} />} placeholder="工序编码/名称/车间"
              value={searchText} onChange={e => setSearchText(e.target.value)} style={{ width: 210 }} allowClear />
          </Col>
          <Col flex="none">
            <Select placeholder="工序类别" value={filterCategory} onChange={setFilterCategory} allowClear style={{ width: 125 }}>
              {Object.entries(OP_CATEGORY_MAP).map(([k, v]) => <Option key={k} value={k}>{v.label}</Option>)}
            </Select>
          </Col>
          <Col flex="none">
            <Select placeholder="状态" value={filterStatus} onChange={setFilterStatus} allowClear style={{ width: 105 }}>
              {Object.entries(OP_STATUS_MAP).map(([k, v]) => <Option key={k} value={k}>{v.label}</Option>)}
            </Select>
          </Col>
          <Col flex="none">
            <Button icon={<ReloadOutlined />} onClick={() => { setSearchText(''); setFilterCategory(undefined); setFilterStatus(undefined); setQuickFilter('ALL'); }}>重置</Button>
          </Col>
          <Col flex="auto" style={{ textAlign: 'right' }}>
            <Space>
              {selectedRowKeys.length > 0 && (
                <Popconfirm title={`确认删除 ${selectedRowKeys.length} 条？`}
                  onConfirm={() => handleDelete(selectedRowKeys)} okText="确认" cancelText="取消">
                  <Button danger icon={<DeleteOutlined />}>批量删除({selectedRowKeys.length})</Button>
                </Popconfirm>
              )}
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}
                style={{ background: '#1677FF' }}>新增工序</Button>
            </Space>
          </Col>
        </Row>
      </div>

      {/* 表格 */}
      <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #f0f0f0', overflow: 'hidden' }}>
        <div style={{ padding: '9px 14px', borderBottom: '1px solid #f5f5f5', display: 'flex', alignItems: 'center', gap: 8 }}>
          <ApartmentOutlined style={{ color: '#E60012' }} />
          <span style={{ fontWeight: 600, fontSize: 14 }}>工序主数据</span>
          <Tag style={{ marginLeft: 4 }}>{filtered.length} 条</Tag>
          <span style={{ fontSize: 12, color: '#999', marginLeft: 4 }}>
            点击「<strong>配置阶段</strong>」按钮可查看/编辑该工序的阶段定义和采集字段
          </span>
        </div>
        <Table rowKey="id" dataSource={filtered} columns={columns} size="small"
          scroll={{ x: 1400, y: 'calc(100vh - 400px)' }}
          pagination={{ pageSize: 20, showSizeChanger: true, showQuickJumper: true,
            showTotal: t => `共 ${t} 条`, size: 'small' }}
          rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
        />
      </div>

      {/* ── 新建/编辑 工序 Modal ── */}
      <Modal
        title={
          <Space>
            <span style={{ display: 'inline-block', width: 4, height: 16, background: '#E60012', borderRadius: 2, verticalAlign: 'middle' }} />
            {editingOp ? '编辑工序基本信息' : '新增工序'}
          </Space>
        }
        open={opModalOpen} onOk={handleOpSave} onCancel={() => setOpModalOpen(false)}
        okText={editingOp ? '保存' : '保存并配置阶段'} cancelText="取消" width={700}
        okButtonProps={{ style: { background: '#1677FF' } }} destroyOnClose>
        {!editingOp && (
          <Alert type="info" showIcon icon={<InfoCircleOutlined />} style={{ marginBottom: 14, fontSize: 12 }}
            message="保存后将自动跳转到阶段配置界面，您可以为该工序添加阶段和采集字段。" />
        )}
        <Form form={opForm} layout="vertical" size="middle">
          <Row gutter={14}>
            <Col span={12}>
              <Form.Item name="opCode" label="工序编码" rules={[{ required: true, message: '请输入编码' }]}>
                <Input placeholder="如：OP-CUT-001" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="opName" label="工序名称" rules={[{ required: true, message: '请输入名称' }]}>
                <Input placeholder="如：数控磨削" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="opShort" label="简称(PAD显示)">
                <Input placeholder="如：磨削" maxLength={8} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="category" label="工序类别" rules={[{ required: true }]}>
                <Select>
                  {Object.entries(OP_CATEGORY_MAP).map(([k, v]) => <Option key={k} value={k}>{v.label}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="status" label="状态">
                <Select>
                  {Object.entries(OP_STATUS_MAP).map(([k, v]) => <Option key={k} value={k}>{v.label}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="workCenter" label="工作中心" rules={[{ required: false }]}>
                <Select
                  placeholder="请选择工作中心"
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  onChange={(val: string) => {
                    // 优先从API加载的工作中心找所属车间
                    const wcApi = wcOptions.find(w => w.code === val || w.name === val);
                    const workshopName = wcApi?.workshopName
                      ?? WORK_CENTERS.find(w => w.code === val)?.workshop
                      ?? '';
                    if (workshopName) {
                      opForm.setFieldValue('workshop', workshopName);
                    }
                  }}
                  onClear={() => opForm.setFieldValue('workshop', undefined)}
                >
                  {(wcOptions.length > 0 ? wcOptions : WORK_CENTERS.map(wc => ({
                    code: wc.code, name: wc.name, workshopName: wc.workshop, status: 1,
                  } as WorkCenterRecord))).map(wc => (
                    <Option key={wc.code} value={wc.code} label={`${wc.code ?? ''} ${wc.name ?? ''}`}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#1677FF', fontWeight: 600 }}>{wc.code}</span>
                        <span style={{ fontSize: 12, color: '#555', marginLeft: 8 }}>{wc.name}</span>
                      </div>
                      <div style={{ fontSize: 11, color: '#aaa' }}>{wc.workshopName}</div>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="workshop" label="所属车间" rules={[{ required: true, message: '请选择所属车间' }]}>
                <Select
                  placeholder="选择工作中心后自动填充，或手动选择"
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  options={
                    (workshopOptions.length > 0 ? workshopOptions : STATIC_WORKSHOP_FALLBACK)
                      .map(ws => ({ value: ws.name ?? '', label: ws.name ?? '' }))
                  }
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="stdTimeMin" label="标准工时(分/件)">
                <InputNumber min={0} style={{ width: '100%' }} placeholder="4.5" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="prepTimeMin" label="准备工时(分)">
                <InputNumber min={0} style={{ width: '100%' }} placeholder="30" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="version" label="版本号">
                <Input placeholder="V1.0" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="equipType" label="设备类型">
                <Select placeholder="请选择设备类型" allowClear showSearch optionFilterProp="value">
                  {EQUIP_TYPE_OPTIONS.map(group => (
                    <Select.OptGroup key={group.group} label={group.group}>
                      {group.items.map(item => (
                        <Option key={item} value={item}>{item}</Option>
                      ))}
                    </Select.OptGroup>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="paramTemplate" label="技术参数模板">
                <Input placeholder="如：PKG-04-PRESS" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="envReq" label="环境要求">
                <TextArea rows={2} placeholder="温湿度/洁净度/防护要求" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Divider style={{ margin: '4px 0 10px' }}>质量控制点</Divider>
              <Row gutter={12}>
                {[
                  { name: 'hasFirstPiece', label: '首件检验' },
                  { name: 'hasPatrol',     label: '过程巡检' },
                  { name: 'hasLastPiece',  label: '末件检验' },
                  { name: 'hasCleanup',    label: '完工清场' },
                  { name: 'isBottleneck',  label: '瓶颈工序' },
                  { name: 'isReportPoint', label: '报工点'   },
                  { name: 'isQcPoint',     label: '质检点'   },
                ].map(sw => (
                  <Col span={6} key={sw.name}>
                    <Form.Item name={sw.name} valuePropName="checked" style={{ marginBottom: 6 }}>
                      <Switch checkedChildren="是" unCheckedChildren="否" size="small" />
                    </Form.Item>
                    <div style={{ fontSize: 12, color: '#555', marginTop: -4, marginBottom: 8 }}>{sw.label}</div>
                  </Col>
                ))}
              </Row>
            </Col>
            <Col span={24}>
              <Form.Item name="remark" label="备注">
                <TextArea rows={2} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* ── 阶段管理 Drawer ── */}
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <OrderedListOutlined style={{ color: '#1677FF', fontSize: 16 }} />
            <span style={{ fontWeight: 700, fontSize: 15 }}>阶段配置</span>
            {viewingOp && (
              <Space size={6}>
                <Tag style={{ fontFamily: 'monospace', fontSize: 12, background: '#f0f5ff', color: '#1677FF', border: '1px solid #adc6ff' }}>
                  {viewingOp.opCode}
                </Tag>
                <span style={{ fontSize: 13, color: '#333' }}>{viewingOp.opName}</span>
                <Tag color={OP_CATEGORY_MAP[viewingOp.category]?.color} style={{ fontSize: 11 }}>
                  {OP_CATEGORY_MAP[viewingOp.category]?.label ?? viewingOp.category}
                </Tag>
              </Space>
            )}
          </div>
        }
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={980}
        styles={{ body: { padding: '12px 16px', background: '#f4f6fa' } }}
      >
        {viewingOp && (
          <PhaseManager op={viewingOp} onUpdate={updateOp} />
        )}
      </Drawer>
    </div>
  );
};

// ════════════════════════════════════════════════════════════
// PhaseManager — 阶段管理器
// ════════════════════════════════════════════════════════════
interface PhaseManagerProps {
  op: Operation;
  onUpdate: (op: Operation) => void;
}

const PhaseManager: React.FC<PhaseManagerProps> = ({ op, onUpdate }) => {
  const [phases, setPhases] = useState<OperationPhase[]>(op.phases);
  const [activeIdx, setActiveIdx] = useState<number>(0);

  // 阶段 Modal
  const [phaseModalOpen, setPhaseModalOpen] = useState(false);
  const [editingPhase, setEditingPhase] = useState<OperationPhase | null>(null);
  const [editingPhaseIdx, setEditingPhaseIdx] = useState<number>(-1);
  const [phaseForm] = Form.useForm();

  // 字段 Modal
  const [fieldModalOpen, setFieldModalOpen] = useState(false);
  const [editingField, setEditingField] = useState<PhaseField | null>(null);
  const [editingFieldIdx, setEditingFieldIdx] = useState<number>(-1);
  const [fieldForm] = Form.useForm();

  const save = (newPhases: OperationPhase[]) => {
    setPhases(newPhases);
    onUpdate({ ...op, phases: newPhases, updatedAt: new Date().toISOString().slice(0, 10) });
  };

  // ── 阶段操作 ─────────────────────────────────────────────
  const openAddPhase = () => {
    setEditingPhase(null);
    setEditingPhaseIdx(-1);
    const nextSeq = phases.length > 0 ? Math.max(...phases.map(p => p.seq)) + 10 : 10;
    phaseForm.resetFields();
    phaseForm.setFieldsValue({
      seq: nextSeq, phaseType: 'PREP', required: true, eSign: false, dualReview: false,
    });
    setPhaseModalOpen(true);
  };

  const openEditPhase = (ph: OperationPhase, idx: number) => {
    setEditingPhase(ph);
    setEditingPhaseIdx(idx);
    phaseForm.setFieldsValue(ph);
    setPhaseModalOpen(true);
  };

  const handlePhaseSave = () => {
    phaseForm.validateFields().then(vals => {
      const seg = op.opCode.split('-')[1] || 'P';
      const newPhase: OperationPhase = {
        seq:        vals.seq,
        phaseCode:  vals.phaseCode || `${seg}-P${String(Math.ceil(vals.seq / 10)).padStart(2, '0')}`,
        phaseName:  vals.phaseName,
        phaseType:  vals.phaseType,
        required:   vals.required  ?? true,
        eSign:      vals.eSign     ?? false,
        dualReview: vals.dualReview ?? false,
        linkedDoc:  vals.linkedDoc,
        remark:     vals.remark,
        photoReq:   vals.photoReq,
        scanReq:    vals.scanReq,
        timeoutMin: vals.timeoutMin,
        fields:     editingPhase?.fields ?? [],
      };
      let newPhases: OperationPhase[];
      if (editingPhase && editingPhaseIdx >= 0) {
        newPhases = phases.map((p, i) => i === editingPhaseIdx ? newPhase : p);
      } else {
        newPhases = [...phases, newPhase];
      }
      newPhases = newPhases.slice().sort((a, b) => a.seq - b.seq);
      save(newPhases);
      const ni = newPhases.findIndex(p => p.phaseCode === newPhase.phaseCode);
      setActiveIdx(ni >= 0 ? ni : 0);
      setPhaseModalOpen(false);
      message.success(editingPhase ? '阶段已更新' : '阶段已添加，请继续为该阶段添加字段');
    }).catch((err: any) => { if (err?.errorFields) return; });
  };

  const handleDeletePhase = (idx: number) => {
    const newPhases = phases.filter((_, i) => i !== idx);
    save(newPhases);
    setActiveIdx(Math.min(activeIdx, Math.max(0, newPhases.length - 1)));
    message.success('阶段已删除');
  };

  const movePhase = (idx: number, dir: -1 | 1) => {
    const arr = [...phases];
    const target = idx + dir;
    if (target < 0 || target >= arr.length) return;
    const tmpSeq = arr[idx].seq;
    arr[idx] = { ...arr[idx], seq: arr[target].seq };
    arr[target] = { ...arr[target], seq: tmpSeq };
    arr.sort((a, b) => a.seq - b.seq);
    save(arr);
    setActiveIdx(target);
  };

  // ── 字段操作 ─────────────────────────────────────────────
  const openAddField = () => {
    setEditingField(null);
    setEditingFieldIdx(-1);
    fieldForm.resetFields();
    fieldForm.setFieldsValue({ dataType: 'String', required: true, inputType: 'MANUAL' });
    setFieldModalOpen(true);
  };

  const openEditField = (f: PhaseField, fi: number) => {
    setEditingField(f);
    setEditingFieldIdx(fi);
    fieldForm.setFieldsValue(f);
    setFieldModalOpen(true);
  };

  const handleFieldSave = () => {
    fieldForm.validateFields().then(vals => {
      const newField: PhaseField = { ...vals };
      const curPhase = phases[activeIdx];
      if (!curPhase) return;
      let newFields: PhaseField[];
      if (editingField && editingFieldIdx >= 0) {
        newFields = curPhase.fields.map((f, i) => i === editingFieldIdx ? newField : f);
      } else {
        newFields = [...curPhase.fields, newField];
      }
      const newPhases = phases.map((p, i) => i === activeIdx ? { ...p, fields: newFields } : p);
      save(newPhases);
      setFieldModalOpen(false);
      message.success(editingField ? '字段已更新' : '字段已添加');
    }).catch((err: any) => { if (err?.errorFields) return; });
  };

  const handleDeleteField = (fi: number) => {
    const curPhase = phases[activeIdx];
    const newFields = curPhase.fields.filter((_, i) => i !== fi);
    const newPhases = phases.map((p, i) => i === activeIdx ? { ...p, fields: newFields } : p);
    save(newPhases);
    message.success('字段已删除');
  };

  const moveField = (fi: number, dir: -1 | 1) => {
    const curPhase = phases[activeIdx];
    const arr = [...curPhase.fields];
    const target = fi + dir;
    if (target < 0 || target >= arr.length) return;
    [arr[fi], arr[target]] = [arr[target], arr[fi]];
    const newPhases = phases.map((p, i) => i === activeIdx ? { ...p, fields: arr } : p);
    save(newPhases);
  };

  const curPhase = phases[activeIdx];

  // ── 空状态：还没有任何阶段 ─────────────────────────────
  if (phases.length === 0) {
    return (
      <div>
        {/* 操作说明 */}
        <Alert
          type="warning"
          showIcon
          icon={<BulbOutlined />}
          style={{ marginBottom: 16, borderRadius: 8 }}
          message={
            <span style={{ fontSize: 13 }}>
              该工序还未配置任何阶段。阶段是工序在 PAD 上的执行步骤，每个阶段包含若干采集字段。
              <strong> 请点击下方「新增阶段」按钮开始配置。</strong>
            </span>
          }
        />

        {/* 阶段类型说明卡片 */}
        <Card size="small" title={
          <Space><InfoCircleOutlined style={{ color: '#1677FF' }} /><span>阶段类型说明</span></Space>
        } style={{ marginBottom: 16, borderRadius: 8 }}>
          <Row gutter={[10, 8]}>
            {PHASE_TYPE_OPTIONS.map(pt => {
              const m = PHASE_TYPE_MAP[pt.value];
              return (
                <Col span={12} key={pt.value}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '4px 0' }}>
                    <Tag style={{ color: m.color, background: m.color + '15', border: `1px solid ${m.color}40`,
                      fontSize: 11, padding: '0 6px', flexShrink: 0, marginTop: 1 }}>
                      {m.label}
                    </Tag>
                    <span style={{ fontSize: 12, color: '#666', lineHeight: 1.5 }}>{pt.desc}</span>
                  </div>
                </Col>
              );
            })}
          </Row>
        </Card>

        {/* 典型阶段顺序示例 */}
        <Card size="small" title={
          <Space><RightCircleOutlined style={{ color: '#52C41A' }} /><span>典型阶段顺序（参考）</span></Space>
        } style={{ marginBottom: 20, borderRadius: 8 }}>
          <Steps
            size="small"
            direction="horizontal"
            style={{ overflowX: 'auto' }}
            items={[
              { title: '生产准备', description: 'PREP', status: 'wait' },
              { title: '上料核对', description: 'LOAD', status: 'wait' },
              { title: '首件检验', description: 'IPQC', status: 'wait' },
              { title: '批量加工', description: 'EXEC', status: 'wait' },
              { title: '过程巡检', description: 'IPQC', status: 'wait' },
              { title: '完工检验', description: 'OQC',  status: 'wait' },
              { title: '清场清洁', description: 'CLEAN', status: 'wait' },
              { title: '工序交接', description: 'HAND', status: 'wait' },
            ]}
          />
          <div style={{ fontSize: 12, color: '#aaa', marginTop: 8 }}>
            * 根据实际工序需要增减，序号（seq）决定执行顺序
          </div>
        </Card>

        <div style={{ textAlign: 'center' }}>
          <Button type="primary" size="large" icon={<PlusOutlined />}
            style={{ background: '#1677FF', paddingInline: 32 }}
            onClick={openAddPhase}>
            新增第一个阶段
          </Button>
        </div>

        {/* 阶段新增 Modal */}
        <PhaseModal
          open={phaseModalOpen}
          editingPhase={editingPhase}
          phaseForm={phaseForm}
          onOk={handlePhaseSave}
          onCancel={() => setPhaseModalOpen(false)}
        />
      </div>
    );
  }

  return (
    <div>
      {/* 工序摘要栏 */}
      <div style={{ background: '#fff', borderRadius: 8, padding: '10px 14px', marginBottom: 12,
        border: '1px solid #e8e8e8', display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        {[
          { label: '类别',   value: <Tag color={OP_CATEGORY_MAP[op.category]?.color}>{OP_CATEGORY_MAP[op.category]?.label ?? op.category}</Tag> },
          { label: '车间',   value: op.workshop },
          { label: '标准工时', value: <><span style={{ color: '#1677FF', fontWeight: 700 }}>{op.stdTimeMin}</span> 分/件</> },
          { label: '阶段总数', value: <><span style={{ color: '#E60012', fontWeight: 700 }}>{phases.length}</span> 个</> },
          { label: '字段合计', value: <><span style={{ color: '#52C41A', fontWeight: 700 }}>{phases.reduce((s, p) => s + p.fields.length, 0)}</span> 个</> },
        ].map(item => (
          <div key={item.label} style={{ fontSize: 12 }}>
            <span style={{ color: '#888' }}>{item.label}：</span>
            <span style={{ color: '#333' }}>{item.value}</span>
          </div>
        ))}
        <div style={{ marginLeft: 'auto' }}>
          <Button type="primary" icon={<PlusOutlined />} size="small" onClick={openAddPhase}
            style={{ background: '#1677FF' }}>新增阶段</Button>
        </div>
      </div>

      <Row gutter={12}>
        {/* 左栏：阶段列表 */}
        <Col span={8}>
          <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e8e8e8', overflow: 'hidden' }}>
            <div style={{ padding: '8px 12px', borderBottom: '1px solid #f5f5f5',
              background: '#fafafa', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
              <UnorderedListOutlined style={{ color: '#1677FF' }} />
              阶段列表
              <Tag style={{ marginLeft: 'auto', fontSize: 11 }}>{phases.length} 个</Tag>
            </div>
            <div style={{ fontSize: 11, color: '#999', padding: '5px 12px', background: '#fffbe6', borderBottom: '1px solid #f5f5f5' }}>
              💡 点击阶段查看/编辑其字段；拖动 ↑↓ 调整顺序
            </div>
            {phases.map((ph, idx) => {
              const pt = PHASE_TYPE_MAP[ph.phaseType];
              const isActive = idx === activeIdx;
              return (
                <div key={ph.phaseCode + idx}
                  onClick={() => setActiveIdx(idx)}
                  style={{
                    padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid #f5f5f5',
                    background: isActive ? '#e6f4ff' : '#fff',
                    borderLeft: isActive ? '3px solid #1677FF' : '3px solid transparent',
                    transition: 'all .15s',
                  }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Space size={4}>
                      <span style={{ fontSize: 11, color: '#888', minWidth: 20 }}>S{idx + 1}</span>
                      <span style={{ fontWeight: isActive ? 700 : 500, fontSize: 13, color: isActive ? '#1677FF' : '#333' }}>
                        {ph.phaseName}
                      </span>
                    </Space>
                    <Space size={2} onClick={e => e.stopPropagation()}>
                      <Button size="small" type="text" icon={<ArrowUpOutlined />}
                        style={{ padding: '0 2px', height: 20, color: '#888' }}
                        disabled={idx === 0} onClick={() => movePhase(idx, -1)} />
                      <Button size="small" type="text" icon={<ArrowDownOutlined />}
                        style={{ padding: '0 2px', height: 20, color: '#888' }}
                        disabled={idx === phases.length - 1} onClick={() => movePhase(idx, 1)} />
                      <Button size="small" type="text" icon={<EditOutlined />}
                        style={{ padding: '0 2px', height: 20, color: '#1677FF' }}
                        onClick={() => openEditPhase(ph, idx)} />
                      <Popconfirm title="确认删除此阶段？" okText="确认" cancelText="取消"
                        onConfirm={() => handleDeletePhase(idx)}>
                        <Button size="small" type="text" danger icon={<DeleteOutlined />}
                          style={{ padding: '0 2px', height: 20 }} />
                      </Popconfirm>
                    </Space>
                  </div>
                  <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                    <Tag style={{ fontSize: 10, padding: '0 4px', color: pt.color,
                      background: pt.color + '15', border: `1px solid ${pt.color}40` }}>
                      {pt.label}
                    </Tag>
                    {ph.required   && <Tag color="red"    style={{ fontSize: 10, padding: '0 3px' }}>必做</Tag>}
                    {ph.eSign      && <Tag color="orange" style={{ fontSize: 10, padding: '0 3px' }}>签名</Tag>}
                    {ph.dualReview && <Tag color="purple" style={{ fontSize: 10, padding: '0 3px' }}>双人</Tag>}
                    {PHASE_TYPE_TO_PAD_STAGE[ph.phaseType] && (
                      <Tag color="cyan" style={{ fontSize: 10, padding: '0 3px' }}>
                        📱 {PHASE_TYPE_TO_PAD_STAGE[ph.phaseType]}
                      </Tag>
                    )}
                    <span style={{ marginLeft: 'auto', fontSize: 11, color: '#888' }}>
                      {ph.fields.length} 字段
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </Col>

        {/* 右栏：当前阶段字段 */}
        <Col span={16}>
          {curPhase ? (
            <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e8e8e8', overflow: 'hidden' }}>
              {/* 字段列表头 */}
              <div style={{ padding: '8px 14px', borderBottom: '1px solid #f5f5f5',
                background: '#fafafa', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: '#1677FF' }}>{curPhase.phaseName}</span>
                <Tag style={{ fontFamily: 'monospace', fontSize: 11 }}>{curPhase.phaseCode}</Tag>
                <Tag color={PHASE_TYPE_MAP[curPhase.phaseType].color} style={{ fontSize: 11 }}>
                  {PHASE_TYPE_MAP[curPhase.phaseType].label}
                </Tag>
                {PHASE_TYPE_TO_PAD_STAGE[curPhase.phaseType] && (
                  <Tag color="cyan" style={{ fontSize: 11 }}>
                    📱 PAD: {PHASE_TYPE_TO_PAD_STAGE[curPhase.phaseType]}
                  </Tag>
                )}
                {curPhase.linkedDoc && (
                  <Tag color="blue" style={{ fontSize: 11 }}>📄 {curPhase.linkedDoc}</Tag>
                )}
                <Button size="small" type="primary" icon={<PlusOutlined />}
                  style={{ marginLeft: 'auto', background: '#52C41A', borderColor: '#52C41A' }}
                  onClick={openAddField}>新增字段</Button>
              </div>

              {/* 阶段属性条 */}
              <div style={{ padding: '6px 14px', borderBottom: '1px solid #f5f5f5',
                background: '#fffbe6', display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
                {[
                  { label: '必做', val: curPhase.required,   yes: '#52C41A', no: '#ccc' },
                  { label: '电子签名', val: curPhase.eSign,  yes: '#E60012', no: '#ccc' },
                  { label: '双人复核', val: curPhase.dualReview, yes: '#722ED1', no: '#ccc' },
                ].map(a => (
                  <span key={a.label} style={{ fontSize: 12, color: a.val ? a.yes : a.no, fontWeight: a.val ? 600 : 400 }}>
                    {a.val ? '✓' : '—'} {a.label}
                  </span>
                ))}
                {curPhase.timeoutMin && (
                  <span style={{ fontSize: 12, color: '#888' }}>⏱ 超时预警 {curPhase.timeoutMin} 分钟</span>
                )}
                {curPhase.remark && (
                  <span style={{ fontSize: 12, color: '#874d00' }}>💡 {curPhase.remark}</span>
                )}
                <Button type="link" size="small" icon={<EditOutlined />}
                  style={{ marginLeft: 'auto', padding: 0, fontSize: 12 }}
                  onClick={() => openEditPhase(curPhase, activeIdx)}>
                  编辑阶段属性
                </Button>
              </div>

              {/* 字段表格 */}
              {curPhase.fields.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 0', color: '#aaa' }}>
                  <FormOutlined style={{ fontSize: 40, color: '#d9d9d9' }} />
                  <div style={{ fontSize: 14, marginTop: 10, marginBottom: 6 }}>该阶段暂无字段</div>
                  <div style={{ fontSize: 12, color: '#bbb', marginBottom: 16 }}>
                    字段是 PAD 执行时需要填写/采集的数据项，例如：测量值、设备参数、人员签名等
                  </div>
                  <Button type="primary" icon={<PlusOutlined />}
                    style={{ background: '#52C41A', borderColor: '#52C41A' }}
                    onClick={openAddField}>添加第一个字段</Button>
                </div>
              ) : (
                <Table
                  rowKey={(r: PhaseField, i: any) => r.code + i}
                  dataSource={curPhase.fields}
                  size="small"
                  pagination={false}
                  scroll={{ y: 'calc(100vh - 400px)' }}
                  columns={[
                    { title: '#', width: 36, align: 'center',
                      render: (_: any, __: any, i: number) => <span style={{ color: '#aaa', fontSize: 11 }}>{i + 1}</span> },
                    { title: '字段编码', dataIndex: 'code', width: 115,
                      render: (v: string) => <code style={{ fontSize: 11, color: '#666', background: '#f5f5f5', padding: '1px 4px', borderRadius: 3 }}>{v}</code> },
                    { title: '字段名称', dataIndex: 'name', width: 140,
                      render: (v: string, r: PhaseField) => (
                        <Space size={3}>
                          <span style={{ fontSize: 12 }}>{v}</span>
                          {r.required && <span style={{ color: '#E60012', fontSize: 11 }}>*</span>}
                        </Space>
                      ) },
                    { title: '类型', dataIndex: 'dataType', width: 72, align: 'center',
                      render: (v: string) => <Tag style={{ fontSize: 10, padding: '0 3px' }}>{v}</Tag> },
                    { title: '标准值', width: 115,
                      render: (_: any, r: PhaseField) => (
                        <span style={{ fontSize: 11 }}>
                          {r.stdValue || '—'}
                          {r.unit && <span style={{ color: '#888', marginLeft: 3 }}>{r.unit}</span>}
                        </span>
                      ) },
                    { title: '录入方式', dataIndex: 'inputType', width: 82, align: 'center',
                      render: (v: string) => {
                        const t = INPUT_TAG[v] || { label: v, color: '#888' };
                        return <Tag color={t.color} style={{ fontSize: 10, padding: '0 3px' }}>{t.label}</Tag>;
                      } },
                    { title: '量具', dataIndex: 'instrument', width: 85,
                      render: (v: string) => <span style={{ fontSize: 11, color: '#888' }}>{v || '—'}</span> },
                    { title: '操作', width: 95, align: 'center',
                      render: (_: any, r: PhaseField, fi: number) => (
                        <Space size={1}>
                          <Button size="small" type="text" icon={<ArrowUpOutlined />}
                            style={{ padding: '0 2px', height: 20, color: '#888' }}
                            disabled={fi === 0} onClick={() => moveField(fi, -1)} />
                          <Button size="small" type="text" icon={<ArrowDownOutlined />}
                            style={{ padding: '0 2px', height: 20, color: '#888' }}
                            disabled={fi === curPhase.fields.length - 1} onClick={() => moveField(fi, 1)} />
                          <Button size="small" type="text" icon={<EditOutlined />}
                            style={{ padding: '0 2px', height: 20, color: '#1677FF' }}
                            onClick={() => openEditField(r, fi)} />
                          <Popconfirm title="确认删除此字段？"
                            onConfirm={() => handleDeleteField(fi)} okText="确认" cancelText="取消">
                            <Button size="small" type="text" danger icon={<DeleteOutlined />}
                              style={{ padding: '0 2px', height: 20 }} />
                          </Popconfirm>
                        </Space>
                      ) },
                  ]}
                />
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#bbb', background: '#fff', borderRadius: 8, border: '1px solid #f0f0f0' }}>
              请在左侧选择阶段
            </div>
          )}
        </Col>
      </Row>

      {/* 阶段 Modal */}
      <PhaseModal
        open={phaseModalOpen}
        editingPhase={editingPhase}
        phaseForm={phaseForm}
        onOk={handlePhaseSave}
        onCancel={() => setPhaseModalOpen(false)}
      />

      {/* 字段 Modal */}
      <Modal
        title={
          <Space>
            <span style={{ display: 'inline-block', width: 3, height: 14, background: '#52C41A', borderRadius: 2, verticalAlign: 'middle' }} />
            {editingField ? `编辑字段 — ${curPhase?.phaseName}` : `新增字段 — ${curPhase?.phaseName}`}
          </Space>
        }
        open={fieldModalOpen} onOk={handleFieldSave} onCancel={() => setFieldModalOpen(false)}
        okText="保存" cancelText="取消" width={580}
        okButtonProps={{ style: { background: '#52C41A', borderColor: '#52C41A' } }} destroyOnClose>
        <Form form={fieldForm} layout="vertical" size="middle" style={{ marginTop: 12 }}>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="code" label="字段编码" rules={[{ required: true, message: '请填写字段编码' }]}>
                <Input placeholder="如：cut_f1 / ht_s3" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="name" label="字段名称" rules={[{ required: true, message: '请填写字段名称' }]}>
                <Input placeholder="如：外径D1 / 设定保温温度" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="dataType" label="数据类型" rules={[{ required: true }]}>
                <Select>
                  {DATA_TYPE_OPTIONS.map(t => <Option key={t} value={t}>{t}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="inputType" label="录入方式">
                <Select>
                  {INPUT_TYPE_OPTIONS.map(o => (
                    <Option key={o.value} value={o.value}>
                      <Tag color={o.color} style={{ fontSize: 11, padding: '0 4px' }}>{o.label}</Tag>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="required" label="是否必填" valuePropName="checked">
                <Switch checkedChildren="必填" unCheckedChildren="可选" defaultChecked />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="stdValue" label="标准值/范围">
                <Input placeholder="如：0.250±0.005 / 480~520 / 合格/不合格" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="unit" label="单位">
                <Input placeholder="如：mm / ℃ / min / N·cm" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="instrument" label="量具/检测工具">
                <Input placeholder="如：千分尺 / 投影仪 / 维氏硬度计" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="remark" label="说明/备注">
                <Input placeholder="如：不合格时自动阻断 / 系统自动生成" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

// ════════════════════════════════════════════════════════════
// PhaseModal — 阶段新增/编辑表单（独立组件，复用）
// ════════════════════════════════════════════════════════════
interface PhaseModalProps {
  open: boolean;
  editingPhase: OperationPhase | null;
  phaseForm: any;
  onOk: () => void;
  onCancel: () => void;
}

const PhaseModal: React.FC<PhaseModalProps> = ({ open, editingPhase, phaseForm, onOk, onCancel }) => (
  <Modal
    title={
      <Space>
        <span style={{ display: 'inline-block', width: 3, height: 14, background: '#1677FF', borderRadius: 2, verticalAlign: 'middle' }} />
        {editingPhase ? '编辑阶段' : '新增阶段'}
      </Space>
    }
    open={open} onOk={onOk} onCancel={onCancel}
    okText="保存" cancelText="取消" width={620}
    okButtonProps={{ style: { background: '#1677FF' } }} destroyOnClose>
    <Form form={phaseForm} layout="vertical" size="middle" style={{ marginTop: 12 }}>
      <Row gutter={12}>
        <Col span={8}>
          <Form.Item name="seq" label="阶段顺序（seq）" rules={[{ required: true, message: '请填写顺序' }]}
            tooltip="按此数字从小到大排序，如10、20、30…">
            <InputNumber min={1} style={{ width: '100%' }} placeholder="10" />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="phaseCode" label="阶段编码"
            tooltip="可留空，系统自动按工序编码+序号生成">
            <Input placeholder="如 CUT-P01（可留空）" />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="phaseType" label="阶段类型" rules={[{ required: true }]}>
            <Select>
              {PHASE_TYPE_OPTIONS.map(o => (
                <Option key={o.value} value={o.value}>
                  <Tooltip title={o.desc} placement="right">
                    <span>{o.label}</span>
                  </Tooltip>
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col span={24}>
          <Form.Item name="phaseName" label="阶段名称" rules={[{ required: true, message: '请填写阶段名称' }]}>
            <Input placeholder="如：生产前准备 / 首件检验 / 批量磨削 / 工序交接" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="linkedDoc" label="关联单据">
            <Input placeholder="如：首件检验单 / 清场确认单" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="timeoutMin" label="超时预警（分钟）"
            tooltip="超过此时长未完成阶段时触发预警，留空表示不预警">
            <InputNumber min={0} style={{ width: '100%' }} placeholder="如：30（留空不预警）" />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="photoReq" label="拍照要求">
            <Select allowClear placeholder="无要求">
              <Option value="NONE">无</Option>
              <Option value="OPTIONAL">可选拍照</Option>
              <Option value="REQUIRED">强制拍照</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="scanReq" label="扫码要求">
            <Select allowClear placeholder="无要求">
              <Option value="NONE">无</Option>
              <Option value="EQUIP">设备扫码</Option>
              <Option value="MATERIAL">物料扫码</Option>
              <Option value="PERSON">人员扫码</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={24}>
          <Form.Item name="remark" label="备注/特殊控制说明">
            <TextArea rows={2} placeholder="如：不合格时自动阻断后续阶段 / UDI规则校验 / 特殊工艺验证" />
          </Form.Item>
        </Col>
        <Col span={24}>
          <Divider style={{ margin: '4px 0 10px' }}>阶段控制要求</Divider>
          <Row gutter={16}>
            {[
              { name: 'required',   label: '必做阶段', tip: '关闭后 PAD 执行时允许跳过该阶段' },
              { name: 'eSign',      label: '电子签名', tip: '阶段结束时需输入账号密码确认' },
              { name: 'dualReview', label: '双人复核', tip: '需第二人扫码确认，用于关键工序' },
            ].map(sw => (
              <Col span={8} key={sw.name}>
                <Form.Item name={sw.name} valuePropName="checked" style={{ marginBottom: 4 }}>
                  <Switch checkedChildren="是" unCheckedChildren="否" />
                </Form.Item>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#333' }}>{sw.label}</div>
                <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>{sw.tip}</div>
              </Col>
            ))}
          </Row>
        </Col>
      </Row>
    </Form>
  </Modal>
);

export default OperationListPage;

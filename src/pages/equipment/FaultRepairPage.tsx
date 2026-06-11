/**
 * FaultRepairPage.tsx — 故障与维修管理
 * GMP医疗器械MES 设备管理模块 - 故障维修子页
 */
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Table, Button, Input, Select, Space, Tag, message, Badge,
  Row, Col, Modal, Form, Drawer, Descriptions, Divider,
  Timeline, Steps, Alert, Tooltip, Popconfirm,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined, SearchOutlined, ReloadOutlined, EyeOutlined,
  ExclamationCircleOutlined, ToolOutlined, CheckCircleOutlined,
  ClockCircleOutlined, WarningOutlined, FireOutlined, UserOutlined,
  AuditOutlined, SettingOutlined,
} from '@ant-design/icons';
import {
  FaultRecord, FaultStatus, FaultLevel,
  FAULT_LEVEL_MAP, FAULT_STATUS_MAP,
  mockFaultRecords, mockEquipRecords, EquipRecord,
} from './equipmentData';
import { getFaultList, createFault, updateFault } from '../../api/equipmentSub';
import type { FaultRecord as FaultApiRecord } from '../../api/equipmentSub';

const { Option } = Select;
const { TextArea } = Input;

const genId = () => `fr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

const FAULT_STEPS: { key: FaultStatus; title: string; icon: React.ReactNode }[] = [
  { key: 'REPORTED', title: '故障报告', icon: <ExclamationCircleOutlined /> },
  { key: 'ASSIGNED', title: '派工维修', icon: <UserOutlined /> },
  { key: 'REPAIRING', title: '维修中', icon: <ToolOutlined /> },
  { key: 'PENDING_VERIFY', title: '待验收', icon: <AuditOutlined /> },
  { key: 'CLOSED', title: '已关闭', icon: <CheckCircleOutlined /> },
];

export type FaultCardFilter = 'open' | 'critical' | 'today' | 'closed' | undefined;

interface FaultRepairPageProps {
  initialCardFilter?: FaultCardFilter;
}

const FaultRepairPage: React.FC<FaultRepairPageProps> = ({ initialCardFilter }) => {
  const [list, setList] = useState<FaultRecord[]>(mockFaultRecords);

  const loadFromApi = useCallback(async () => {
    try {
      const resp = await getFaultList() as any;
      const apiList: FaultApiRecord[] = resp?.data ?? [];
      if (apiList.length > 0) {
        setList(apiList.map(item => ({
          id: String(item.id ?? ''),
          faultNo: item.faultNo ?? '',
          equipId: item.equipId ?? '',
          equipCode: item.equipCode ?? '',
          equipName: item.equipName ?? '',
          faultTime: item.faultTime ?? '',
          reporter: item.reporter ?? '',
          faultDesc: item.faultDesc ?? '',
          faultLevel: (item.faultLevel ?? 'MEDIUM') as FaultLevel,
          affectedBatch: item.affectedBatch ?? undefined,
          affectedWoNo: item.affectedWoNo ?? undefined,
          status: (item.status ?? 'REPORTED') as FaultStatus,
          assignee: item.assignee ?? undefined,
          diagnose: item.diagnose ?? undefined,
          repairContent: item.repairContent ?? undefined,
          spareParts: item.spareParts ?? undefined,
          repairStart: item.repairStart ?? undefined,
          repairEnd: item.repairEnd ?? undefined,
          downtime: item.downtime ?? undefined,
          rootCause: item.rootCause ?? undefined,
          capaAction: item.capaAction ?? undefined,
          verifier: item.verifier ?? undefined,
          verifyTime: item.verifyTime ?? undefined,
          verifyResult: item.verifyResult ?? undefined,
          remark: item.remark ?? '',
          createdAt: item.createTime ?? '',
          updatedAt: item.createTime ?? '',
        } as unknown as FaultRecord)));
      }
    } catch { /* 后端不可用时保留 mock */ }
  }, []);

  useEffect(() => { loadFromApi(); }, [loadFromApi]);
  const [searchText, setSearchText] = useState('');
  const [filterLevel, setFilterLevel] = useState<string | undefined>();
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [filterEquip, setFilterEquip] = useState<string | undefined>();

  const [reportOpen, setReportOpen] = useState(false);
  const [reportForm] = Form.useForm();

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<FaultRecord | null>(null);

  const [processOpen, setProcessOpen] = useState(false);
  const [processItem, setProcessItem] = useState<FaultRecord | null>(null);
  const [processForm] = Form.useForm();
  const [processAction, setProcessAction] = useState<'assign' | 'repair' | 'verify' | 'close'>('assign');

  // 汇总卡片快速过滤 key — 支持从总览页传入初始过滤
  type CardFilter = FaultCardFilter;
  const [cardFilter, setCardFilter] = useState<CardFilter>(initialCardFilter);

  const handleCardClick = (key: CardFilter) => {
    setCardFilter(prev => prev === key ? undefined : key);
    setFilterStatus(undefined);
  };

  const filtered = useMemo(() => list.filter(f => {
    const t = searchText.toLowerCase();
    if (cardFilter === 'open'     && ['CLOSED', 'CANCELLED'].includes(f.status)) return false;
    if (cardFilter === 'critical' && !(f.faultLevel === 'CRITICAL' && f.status !== 'CLOSED')) return false;
    if (cardFilter === 'today'    && !f.faultTime.startsWith('2026-04-29')) return false;
    if (cardFilter === 'closed'   && f.status !== 'CLOSED') return false;
    return (!t || f.faultNo.toLowerCase().includes(t) || f.equipCode.toLowerCase().includes(t)
      || f.equipName.includes(t) || f.faultDesc.includes(t) || (f.reporter || '').includes(t))
      && (!filterLevel  || f.faultLevel  === filterLevel)
      && (!filterStatus || f.status === filterStatus)
      && (!filterEquip  || f.equipId === filterEquip);
  }), [list, searchText, filterLevel, filterStatus, filterEquip, cardFilter]);

  const summary = useMemo(() => ({
    total:    list.length,
    open:     list.filter(f => !['CLOSED', 'CANCELLED'].includes(f.status)).length,
    critical: list.filter(f => f.faultLevel === 'CRITICAL' && f.status !== 'CLOSED').length,
    today:    list.filter(f => f.faultTime.startsWith('2026-04-29')).length,
    closed:   list.filter(f => f.status === 'CLOSED').length,
  }), [list]);

  const handleReport = () => {
    reportForm.resetFields();
    reportForm.setFieldsValue({ faultLevel: 'MEDIUM', faultTime: new Date().toISOString().slice(0, 16).replace('T', ' ') });
    setReportOpen(true);
  };

  const handleSaveReport = () => {
    reportForm.validateFields().then(async vals => {
      const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
      const equip = mockEquipRecords.find(e => e.id === vals.equipId);
      const payload: FaultApiRecord = {
        equipId: vals.equipId, equipCode: equip?.equipCode ?? '', equipName: equip?.equipName ?? '',
        faultTime: vals.faultTime, reporter: vals.reporter, faultDesc: vals.faultDesc,
        faultLevel: vals.faultLevel, status: 'REPORTED',
      };
      try {
        const resp = await createFault(payload) as any;
        const newRecord: FaultRecord = {
          ...vals, id: String(resp?.data?.id ?? genId()),
          faultNo: resp?.data?.faultNo ?? `FT-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${(list.length+1).toString().padStart(3,'0')}`,
          equipCode: equip?.equipCode || '', equipName: equip?.equipName || '',
          status: 'REPORTED', createdAt: now, updatedAt: now,
        };
        setList(prev => [newRecord, ...prev]);
        message.success(`故障单 ${newRecord.faultNo} 已提交`);
      } catch (err: any) { message.error('提交失败：' + (err?.message ?? '')); return; }
      setReportOpen(false);
    }).catch(() => {});
  };

  const handleView = (r: FaultRecord) => {
    setDetailItem(r);
    setDetailOpen(true);
  };

  const handleProcess = (r: FaultRecord, action: typeof processAction) => {
    setProcessItem(r);
    setProcessAction(action);
    processForm.resetFields();
    setProcessOpen(true);
  };

  const handleSaveProcess = () => {
    processForm.validateFields().then(async vals => {
      const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
      let nextStatus: FaultStatus = processItem!.status;
      if (processAction === 'assign')  nextStatus = 'REPAIRING';
      if (processAction === 'repair')  nextStatus = 'PENDING_VERIFY';
      if (processAction === 'verify')  nextStatus = 'CLOSED';
      if (processAction === 'close')   nextStatus = 'CANCELLED';
      const numId = Number(processItem!.id);
      try {
        if (!isNaN(numId) && numId > 0) {
          await updateFault(numId, { status: nextStatus, ...vals });
        }
      } catch { /* 仍然更新本地 */ }
      setList(prev => prev.map(f => f.id === processItem!.id ? {
        ...f, ...vals, status: nextStatus, updatedAt: now,
        ...(processAction === 'assign'  ? { assignee: vals.assignee } : {}),
        ...(processAction === 'repair'  ? { repairEnd: now, downtime: vals.downtime } : {}),
        ...(processAction === 'verify'  ? { verifier: vals.verifier, verifyTime: now, verifyResult: vals.verifyResult } : {}),
      } : f));
      message.success('处理成功');
      setProcessOpen(false);
    }).catch(() => {});
  };

  const getStatusStepIndex = (status: FaultStatus) => {
    const idx = FAULT_STEPS.findIndex(s => s.key === status);
    return idx >= 0 ? idx : 0;
  };

  const columns: ColumnsType<FaultRecord> = [
    {
      title: '故障单号', dataIndex: 'faultNo', width: 170,
      render: (v: string, r: FaultRecord) => (
        <span style={{ color: '#1677FF', fontWeight: 600, cursor: 'pointer', fontFamily: 'monospace', fontSize: 12 }}
          onClick={() => handleView(r)}>
          {v}
        </span>
      ),
    },
    {
      title: '设备', dataIndex: 'equipCode', width: 180,
      render: (v: string, r: FaultRecord) => (
        <div>
          <div style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 600, color: '#333' }}>{v}</div>
          <div style={{ fontSize: 11, color: '#888' }}>{r.equipName}</div>
        </div>
      ),
    },
    {
      title: '故障等级', dataIndex: 'faultLevel', width: 90, align: 'center',
      render: (v: FaultLevel) => {
        const m = FAULT_LEVEL_MAP[v];
        return <Tag color={m.color} style={{ fontSize: 11, fontWeight: 600 }}>{v === 'CRITICAL' ? <FireOutlined /> : null} {m.label}</Tag>;
      },
    },
    {
      title: '故障描述', dataIndex: 'faultDesc', width: 220,
      render: (v: string) => <Tooltip title={v}><span style={{ fontSize: 12, color: '#333' }}>{v.length > 28 ? v.slice(0, 28) + '…' : v}</span></Tooltip>,
    },
    {
      title: '影响批次', dataIndex: 'affectedBatch', width: 140,
      render: (v?: string, r?: FaultRecord) => v ? (
        <div>
          <Tag color="orange" style={{ fontSize: 11 }}>{v}</Tag>
          {r?.affectedWoNo && <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{r.affectedWoNo}</div>}
        </div>
      ) : <span style={{ color: '#ccc', fontSize: 11 }}>—</span>,
    },
    {
      title: '报告时间', dataIndex: 'faultTime', width: 140,
      render: (v: string) => <span style={{ fontSize: 12, color: '#555' }}>{v}</span>,
    },
    {
      title: '报告人', dataIndex: 'reporter', width: 90,
      render: (v: string) => <span style={{ fontSize: 12 }}>{v}</span>,
    },
    {
      title: '停机时长', dataIndex: 'downtime', width: 90, align: 'center',
      render: (v?: number) => v != null ? (
        <span style={{ fontSize: 12, color: v > 480 ? '#FF4D4F' : v > 120 ? '#FAAD14' : '#52C41A', fontWeight: 600 }}>
          {v >= 60 ? `${Math.floor(v / 60)}h${v % 60 > 0 ? `${v % 60}m` : ''}` : `${v}m`}
        </span>
      ) : <span style={{ color: '#ccc', fontSize: 11 }}>—</span>,
    },
    {
      title: '状态', dataIndex: 'status', width: 100, align: 'center',
      render: (v: FaultStatus) => {
        const m = FAULT_STATUS_MAP[v];
        return <Badge status={m.badge} text={<span style={{ fontSize: 12 }}>{m.label}</span>} />;
      },
    },
    {
      title: '操作', width: 200, fixed: 'right',
      render: (_: any, r: FaultRecord) => (
        <Space size={0} split={<span style={{ color: '#e8e8e8', margin: '0 1px' }}>|</span>}>
          <Button type="link" size="small" icon={<EyeOutlined />} style={{ padding: '0 4px', fontSize: 12 }} onClick={() => handleView(r)}>详情</Button>
          {r.status === 'REPORTED' && (
            <Button type="link" size="small" icon={<UserOutlined />} style={{ padding: '0 4px', fontSize: 12, color: '#722ED1' }} onClick={() => handleProcess(r, 'assign')}>派工</Button>
          )}
          {r.status === 'REPAIRING' && (
            <Button type="link" size="small" icon={<CheckCircleOutlined />} style={{ padding: '0 4px', fontSize: 12, color: '#FAAD14' }} onClick={() => handleProcess(r, 'repair')}>完成维修</Button>
          )}
          {r.status === 'PENDING_VERIFY' && (
            <Button type="link" size="small" icon={<AuditOutlined />} style={{ padding: '0 4px', fontSize: 12, color: '#52C41A' }} onClick={() => handleProcess(r, 'verify')}>验收</Button>
          )}
          {!['CLOSED', 'CANCELLED'].includes(r.status) && (
            <Popconfirm title="确认取消该故障单？" onConfirm={() => handleProcess(r, 'close')} okText="确认" cancelText="取消">
              <Button type="link" size="small" danger style={{ padding: '0 4px', fontSize: 12 }}>取消</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const processActionLabel: Record<string, string> = { assign: '派工维修', repair: '完成维修记录', verify: '验收确认', close: '取消故障单' };

  return (
    <div>
      {/* 汇总卡片（可点击过滤） */}
      <Row gutter={10} style={{ marginBottom: 12 }}>
        {([
          { cardKey: undefined,  label: '故障总数', value: summary.total,    color: '#1677FF' },
          { cardKey: 'open',     label: '未关闭',   value: summary.open,     color: '#FAAD14' },
          { cardKey: 'critical', label: '紧急故障', value: summary.critical, color: '#FF4D4F' },
          { cardKey: 'today',    label: '今日新增', value: summary.today,    color: '#722ED1' },
          { cardKey: 'closed',   label: '已关闭',   value: summary.closed,   color: '#52C41A' },
        ] as { cardKey: CardFilter; label: string; value: number; color: string }[]).map(c => {
          const isActive = cardFilter === c.cardKey;
          return (
            <Col key={c.label} flex="1">
              <Tooltip title={c.cardKey ? `点击筛选"${c.label}"` : '查看全部'}>
                <div
                  onClick={() => handleCardClick(c.cardKey)}
                  style={{
                    background: isActive ? `${c.color}12` : '#fff',
                    border: `1px solid ${isActive ? c.color : '#f0f0f0'}`,
                    borderRadius: 8, padding: '10px 14px',
                    display: 'flex', alignItems: 'center', gap: 10,
                    cursor: 'pointer', transition: 'all 0.2s',
                    boxShadow: isActive ? `0 0 0 2px ${c.color}30` : '0 1px 4px rgba(0,0,0,.04)',
                  }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: c.color + '18',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, color: c.color }}>
                    <ExclamationCircleOutlined />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: c.color }}>{c.value}</div>
                    <div style={{ fontSize: 11, color: isActive ? c.color : '#888' }}>{c.label}</div>
                  </div>
                  {isActive && <div style={{ width: 6, height: 6, borderRadius: '50%', background: c.color }} />}
                </div>
              </Tooltip>
            </Col>
          );
        })}
      </Row>

      {summary.critical > 0 && (
        <Alert type="error" showIcon icon={<FireOutlined />} banner
          message={`当前有 ${summary.critical} 起紧急故障未关闭，请立即处理！`}
          style={{ marginBottom: 10, borderRadius: 8 }} />
      )}

      {/* 搜索栏 */}
      <div style={{ background: '#fff', borderRadius: 8, padding: '10px 14px', marginBottom: 10, border: '1px solid #f0f0f0' }}>
        <Row gutter={10} align="middle">
          <Col flex="none">
            <Input prefix={<SearchOutlined style={{ color: '#bbb' }} />} placeholder="故障单号/设备/描述/报告人"
              value={searchText} onChange={e => setSearchText(e.target.value)} style={{ width: 240 }} allowClear />
          </Col>
          <Col flex="none">
            <Select placeholder="故障等级" value={filterLevel} onChange={setFilterLevel} allowClear style={{ width: 110 }}>
              {Object.entries(FAULT_LEVEL_MAP).map(([k, v]) => <Option key={k} value={k}>{v.label}</Option>)}
            </Select>
          </Col>
          <Col flex="none">
            <Select placeholder="处理状态" value={filterStatus} onChange={setFilterStatus} allowClear style={{ width: 110 }}>
              {Object.entries(FAULT_STATUS_MAP).map(([k, v]) => <Option key={k} value={k}>{v.label}</Option>)}
            </Select>
          </Col>
          <Col flex="none">
            <Select placeholder="所属设备" value={filterEquip} onChange={setFilterEquip} allowClear style={{ width: 180 }}>
              {mockEquipRecords.map(e => <Option key={e.id} value={e.id}>{e.equipCode} {e.equipName}</Option>)}
            </Select>
          </Col>
          <Col flex="none">
            <Button icon={<ReloadOutlined />} onClick={() => { setSearchText(''); setFilterLevel(undefined); setFilterStatus(undefined); setFilterEquip(undefined); setCardFilter(undefined); }}>重置</Button>
          </Col>
          <Col flex="auto" style={{ textAlign: 'right' }}>
            <Button type="primary" danger icon={<PlusOutlined />} onClick={handleReport}>🚨 上报故障</Button>
          </Col>
        </Row>
      </div>

      {/* 表格 */}
      <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #f0f0f0', overflow: 'hidden' }}>
        <div style={{ padding: '8px 14px', borderBottom: '1px solid #f5f5f5', display: 'flex', alignItems: 'center', gap: 8 }}>
          <ExclamationCircleOutlined style={{ color: '#FF4D4F' }} />
          <span style={{ fontWeight: 600, fontSize: 14 }}>故障与维修记录</span>
          <Tag style={{ marginLeft: 4 }}>{filtered.length} 条</Tag>
        </div>
        <Table rowKey="id" dataSource={filtered} columns={columns} size="small"
          scroll={{ x: 1500, y: 'calc(100vh - 380px)' }}
          pagination={{ pageSize: 15, showSizeChanger: true, showTotal: t => `共 ${t} 条`, size: 'small' }}
          rowClassName={r => r.faultLevel === 'CRITICAL' && r.status !== 'CLOSED' ? 'ant-table-row-danger' : ''}
        />
      </div>

      {/* 故障报告 Modal */}
      <Modal title={<Space><FireOutlined style={{ color: '#FF4D4F' }} /><span style={{ color: '#FF4D4F', fontWeight: 700 }}>上报故障</span></Space>}
        open={reportOpen} onOk={handleSaveReport} onCancel={() => setReportOpen(false)}
        okText="提交故障单" cancelText="取消" okButtonProps={{ danger: true }} width={600} destroyOnClose>
        <Alert type="warning" showIcon message="故障上报后将自动冻结相关设备状态，请如实填写故障信息。" style={{ marginBottom: 16 }} />
        <Form form={reportForm} layout="vertical" size="middle">
          <Row gutter={14}>
            <Col span={12}>
              <Form.Item name="equipId" label="故障设备" rules={[{ required: true }]}>
                <Select showSearch optionFilterProp="children">
                  {mockEquipRecords.map(e => <Option key={e.id} value={e.id}>{e.equipCode} — {e.equipName}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="faultTime" label="故障时间" rules={[{ required: true }]}>
                <Input placeholder="YYYY-MM-DD HH:mm" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="faultLevel" label="故障等级" rules={[{ required: true }]}>
                <Select>
                  {Object.entries(FAULT_LEVEL_MAP).map(([k, v]) => <Option key={k} value={k}><Tag color={v.color}>{v.label}</Tag></Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="reporter" label="报告人" rules={[{ required: true }]}>
                <Input placeholder="当前用户姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="affectedBatch" label="影响批号（若有）">
                <Input placeholder="LOT-20260429-001" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="affectedWoNo" label="影响工单号（若有）">
                <Input placeholder="WO-20260429-001" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="faultDesc" label="故障描述" rules={[{ required: true, min: 10, message: '请详细描述故障现象（至少10字）' }]}>
                <TextArea rows={3} placeholder="详细描述故障现象、报警信息等…" showCount maxLength={500} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* 处理 Modal */}
      <Modal title={`${processActionLabel[processAction]} — ${processItem?.faultNo}`}
        open={processOpen} onOk={handleSaveProcess} onCancel={() => setProcessOpen(false)}
        okText="确认" cancelText="取消" width={520} destroyOnClose>
        <Form form={processForm} layout="vertical" size="middle">
          {processAction === 'assign' && (
            <>
              <Form.Item name="assignee" label="维修负责人" rules={[{ required: true }]}><Input placeholder="维修工程师姓名" /></Form.Item>
              <Form.Item name="diagnose" label="初步诊断"><TextArea rows={2} placeholder="故障初步判断" /></Form.Item>
            </>
          )}
          {processAction === 'repair' && (
            <>
              <Form.Item name="diagnose" label="故障诊断" rules={[{ required: true }]}><TextArea rows={2} /></Form.Item>
              <Form.Item name="repairContent" label="维修内容" rules={[{ required: true }]}><TextArea rows={3} placeholder="详细描述维修过程、更换零件等" /></Form.Item>
              <Form.Item name="spareParts" label="更换备件"><Input placeholder="如：供液泵叶轮×1套" /></Form.Item>
              <Form.Item name="downtime" label="停机时长（分钟）"><Input type="number" /></Form.Item>
              <Form.Item name="rootCause" label="根本原因（RCA）"><TextArea rows={2} /></Form.Item>
              <Form.Item name="capaAction" label="CAPA措施"><TextArea rows={2} /></Form.Item>
            </>
          )}
          {processAction === 'verify' && (
            <>
              <Form.Item name="verifier" label="验收人" rules={[{ required: true }]}><Input /></Form.Item>
              <Form.Item name="verifyResult" label="验收结论" rules={[{ required: true }]}><TextArea rows={3} placeholder="设备验收通过/功能正常" /></Form.Item>
            </>
          )}
        </Form>
      </Modal>

      {/* 详情 Drawer */}
      <Drawer title={<Space><ExclamationCircleOutlined style={{ color: '#FF4D4F' }} /><span>故障详情 — {detailItem?.faultNo}</span></Space>}
        open={detailOpen} onClose={() => setDetailOpen(false)} width={680}>
        {detailItem && (
          <div>
            {/* 进度步骤 */}
            <div style={{ background: '#fafafa', border: '1px solid #f0f0f0', borderRadius: 8, padding: '12px 16px', marginBottom: 16 }}>
              <Steps current={getStatusStepIndex(detailItem.status)} size="small"
                status={detailItem.status === 'CANCELLED' ? 'error' : detailItem.status === 'CLOSED' ? 'finish' : 'process'}
                items={FAULT_STEPS.map(s => ({ title: s.title, icon: s.icon }))} />
            </div>

            <Row gutter={12}>
              <Col span={12}>
                <Tag color={(FAULT_LEVEL_MAP[detailItem.faultLevel] ?? { color: 'red' }).color} style={{ fontSize: 13, padding: '4px 10px', fontWeight: 700 }}>
                  {detailItem.faultLevel === 'CRITICAL' ? <FireOutlined /> : <WarningOutlined />} {(FAULT_LEVEL_MAP[detailItem.faultLevel] ?? { label: detailItem.faultLevel ?? '-' }).label}级故障
                </Tag>
              </Col>
              <Col span={12} style={{ textAlign: 'right' }}>
                <Badge status={(FAULT_STATUS_MAP[detailItem.status] ?? { badge: 'default' as any }).badge} text={<span style={{ fontWeight: 600, color: (FAULT_STATUS_MAP[detailItem.status] ?? { color: '#888' }).color }}>{(FAULT_STATUS_MAP[detailItem.status] ?? { label: String(detailItem.status ?? '-') }).label}</span>} />
              </Col>
            </Row>

            <Divider style={{ margin: '12px 0' }} />

            <Descriptions bordered size="small" column={2} labelStyle={{ width: 110, fontWeight: 500 }}>
              <Descriptions.Item label="故障单号" span={2}><span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#1677FF' }}>{detailItem.faultNo}</span></Descriptions.Item>
              <Descriptions.Item label="故障设备"><span style={{ fontFamily: 'monospace' }}>{detailItem.equipCode}</span></Descriptions.Item>
              <Descriptions.Item label="设备名称">{detailItem.equipName}</Descriptions.Item>
              <Descriptions.Item label="故障时间" span={2}><ClockCircleOutlined style={{ marginRight: 4 }} />{detailItem.faultTime}</Descriptions.Item>
              <Descriptions.Item label="报告人">{detailItem.reporter}</Descriptions.Item>
              <Descriptions.Item label="维修负责人">{detailItem.assignee || <span style={{ color: '#ccc' }}>—</span>}</Descriptions.Item>
              <Descriptions.Item label="影响批号">{detailItem.affectedBatch ? <Tag color="orange">{detailItem.affectedBatch}</Tag> : <span style={{ color: '#ccc' }}>无</span>}</Descriptions.Item>
              <Descriptions.Item label="影响工单">{detailItem.affectedWoNo || <span style={{ color: '#ccc' }}>无</span>}</Descriptions.Item>
              <Descriptions.Item label="停机时长">
                {detailItem.downtime != null ? (
                  <span style={{ fontWeight: 600, color: detailItem.downtime > 480 ? '#FF4D4F' : '#FAAD14' }}>
                    {detailItem.downtime >= 60 ? `${Math.floor(detailItem.downtime / 60)}小时${detailItem.downtime % 60 > 0 ? `${detailItem.downtime % 60}分钟` : ''}` : `${detailItem.downtime}分钟`}
                  </span>
                ) : <span style={{ color: '#ccc' }}>—</span>}
              </Descriptions.Item>
              <Descriptions.Item label="维修时间">
                {detailItem.repairStart ? `${detailItem.repairStart}${detailItem.repairEnd ? ` → ${detailItem.repairEnd}` : ' (进行中)'}` : <span style={{ color: '#ccc' }}>—</span>}
              </Descriptions.Item>
            </Descriptions>

            <Divider style={{ margin: '12px 0 8px' }}><span style={{ fontSize: 12, color: '#888' }}>故障详情</span></Divider>
            <Timeline style={{ marginTop: 12 }} items={[
              { color: '#FF4D4F', dot: <ExclamationCircleOutlined />, children: <div><b>故障描述</b><div style={{ color: '#555', marginTop: 4 }}>{detailItem.faultDesc}</div></div> },
              detailItem.diagnose ? { color: '#722ED1', dot: <ToolOutlined />, children: <div><b>故障诊断</b><div style={{ color: '#555', marginTop: 4 }}>{detailItem.diagnose}</div></div> } : null,
              detailItem.repairContent ? { color: '#1677FF', dot: <SettingOutlined />, children: <div><b>维修内容</b><div style={{ color: '#555', marginTop: 4 }}>{detailItem.repairContent}</div>{detailItem.spareParts && <div style={{ marginTop: 4 }}><Tag>更换备件：{detailItem.spareParts}</Tag></div>}</div> } : null,
              detailItem.rootCause ? { color: '#FA8C16', dot: <AuditOutlined />, children: <div><b>根本原因 (RCA)</b><div style={{ color: '#555', marginTop: 4 }}>{detailItem.rootCause}</div></div> } : null,
              detailItem.capaAction ? { color: '#13C2C2', dot: <CheckCircleOutlined />, children: <div><b>CAPA措施</b><div style={{ color: '#555', marginTop: 4 }}>{detailItem.capaAction}</div></div> } : null,
              detailItem.verifyResult ? { color: '#52C41A', dot: <CheckCircleOutlined />, children: <div><b>验收结论</b><div style={{ color: '#555', marginTop: 4 }}>{detailItem.verifyResult}</div>{detailItem.verifier && <Tag style={{ marginTop: 4 }}>验收人：{detailItem.verifier} | {detailItem.verifyTime}</Tag>}</div> } : null,
            ].filter(Boolean) as any} />

            {detailItem.remark && (
              <div style={{ background: '#fffbe6', border: '1px solid #ffe58f', borderRadius: 6, padding: '8px 12px', marginTop: 8, fontSize: 12 }}>
                <WarningOutlined style={{ color: '#FAAD14', marginRight: 6 }} />{detailItem.remark}
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default FaultRepairPage;

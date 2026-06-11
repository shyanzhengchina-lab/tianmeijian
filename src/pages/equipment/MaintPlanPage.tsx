/**
 * MaintPlanPage.tsx — 维保计划管理
 * GMP医疗器械MES 设备管理模块 - 维保计划子页
 */
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Table, Button, Input, Select, Space, Tag, message, Badge,
  Row, Col, Modal, Form, Drawer, Descriptions, Divider,
  Progress, Tooltip, Popconfirm, Calendar, Alert,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined, SearchOutlined, ReloadOutlined, EyeOutlined,
  ToolOutlined, CheckCircleOutlined, WarningOutlined,
  CalendarOutlined, ClockCircleOutlined, UserOutlined,
} from '@ant-design/icons';
import {
  MaintPlan, MaintStatus, MaintType,
  MAINT_TYPE_MAP, MAINT_STATUS_MAP,
  mockMaintPlans, mockEquipRecords, isOverdue, getDaysUntil,
} from './equipmentData';
import { getMaintPlanList, createMaintPlan, updateMaintPlan, deleteMaintPlan } from '../../api/equipmentSub';
import type { MaintPlanRecord } from '../../api/equipmentSub';

const { Option } = Select;
const { TextArea } = Input;

const genId = () => `mp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

export type MaintCardFilter = 'pending' | 'inProgress' | 'done' | 'overdue' | 'upcoming' | undefined;

interface MaintPlanPageProps {
  initialCardFilter?: MaintCardFilter;
}

const MaintPlanPage: React.FC<MaintPlanPageProps> = ({ initialCardFilter }) => {
  const [list, setList] = useState<MaintPlan[]>(mockMaintPlans);

  const loadFromApi = useCallback(async () => {
    try {
      const resp = await getMaintPlanList() as any;
      const apiList: MaintPlanRecord[] = resp?.data ?? [];
      if (apiList.length > 0) {
        setList(apiList.map(item => ({
          id: String(item.id ?? ''),
          planNo: item.planNo ?? '',
          equipId: item.equipId ?? '',
          equipCode: item.equipCode ?? '',
          equipName: item.equipName ?? '',
          maintType: (item.maintType ?? 'MONTHLY') as MaintType,
          maintContent: item.maintContent ?? '',
          planDate: item.planDate ?? '',
          planDuration: item.planDuration ?? 0,
          assignee: item.assignee ?? '',
          status: (item.status ?? 'PENDING') as MaintStatus,
          actualDate: item.actualDate ?? undefined,
          actualDuration: item.actualDuration ?? undefined,
          result: item.result ?? undefined,
          nextPlanDate: item.nextPlanDate ?? undefined,
          remark: item.remark ?? '',
          createdAt: item.createTime ?? '',
          updatedAt: item.updateTime ?? '',
        } as unknown as MaintPlan)));
      }
    } catch { /* 后端不可用时保留 mock */ }
  }, []);

  useEffect(() => { loadFromApi(); }, [loadFromApi]);
  const [searchText, setSearchText] = useState('');
  const [filterType, setFilterType] = useState<string | undefined>();
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [filterEquip, setFilterEquip] = useState<string | undefined>();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<MaintPlan | null>(null);
  const [form] = Form.useForm();

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<MaintPlan | null>(null);

  const [execOpen, setExecOpen] = useState(false);
  const [execItem, setExecItem] = useState<MaintPlan | null>(null);
  const [execForm] = Form.useForm();

  // 支持从总览页传入初始卡片过滤
  const [cardFilter, setCardFilter] = useState<MaintCardFilter>(initialCardFilter);

  const handleCardClick = (key: MaintCardFilter) => {
    setCardFilter(prev => prev === key ? undefined : key);
    setFilterStatus(undefined);
  };

  const filtered = useMemo(() => list.filter(m => {
    const t = searchText.toLowerCase();
    if (cardFilter === 'pending'    && m.status !== 'PENDING') return false;
    if (cardFilter === 'inProgress' && m.status !== 'IN_PROGRESS') return false;
    if (cardFilter === 'done'       && m.status !== 'DONE') return false;
    if (cardFilter === 'overdue'    && !(m.status === 'OVERDUE' || (m.status === 'PENDING' && isOverdue(m.planDate)))) return false;
    if (cardFilter === 'upcoming') {
      const d = getDaysUntil(m.planDate);
      if (!(m.status === 'PENDING' && d !== null && d <= 7 && d >= 0)) return false;
    }
    return (!t || m.planNo.toLowerCase().includes(t) || m.equipCode.toLowerCase().includes(t) || m.equipName.includes(t) || m.maintContent.includes(t))
      && (!filterType   || m.maintType === filterType)
      && (!filterStatus || m.status === filterStatus)
      && (!filterEquip  || m.equipId === filterEquip);
  }), [list, searchText, filterType, filterStatus, filterEquip, cardFilter]);

  const summary = useMemo(() => ({
    total:      list.length,
    pending:    list.filter(m => m.status === 'PENDING').length,
    inProgress: list.filter(m => m.status === 'IN_PROGRESS').length,
    done:       list.filter(m => m.status === 'DONE').length,
    overdue:    list.filter(m => m.status === 'OVERDUE' || (m.status === 'PENDING' && isOverdue(m.planDate))).length,
    upcoming:   list.filter(m => m.status === 'PENDING' && (() => { const d = getDaysUntil(m.planDate); return d !== null && d <= 7 && d >= 0; })()).length,
  }), [list]);

  const handleAdd = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ maintType: 'MONTHLY', status: 'PENDING', planDuration: 4 });
    setModalOpen(true);
  };

  const handleEdit = (r: MaintPlan) => {
    setEditing(r);
    form.setFieldsValue({ ...r });
    setModalOpen(true);
  };

  const handleSave = () => {
    form.validateFields().then(vals => {
      const now = new Date().toISOString().slice(0, 10);
      const equip = mockEquipRecords.find(e => e.id === vals.equipId);
      if (editing) {
        setList(prev => prev.map(m => m.id === editing.id ? { ...m, ...vals, updatedAt: now } : m));
        message.success('维保计划修改成功');
      } else {
        setList(prev => [{
          ...vals, id: genId(),
          planNo: `MP-${now.replace(/-/g, '')}-${(list.length + 1).toString().padStart(3, '0')}`,
          equipCode: equip?.equipCode || '',
          equipName: equip?.equipName || '',
          createdAt: now, updatedAt: now,
        }, ...prev]);
        message.success('维保计划创建成功');
      }
      setModalOpen(false);
    }).catch(() => {});
  };

  const handleExec = (r: MaintPlan) => {
    setExecItem(r);
    execForm.resetFields();
    execForm.setFieldsValue({ actualDate: new Date().toISOString().slice(0, 10), actualDuration: r.planDuration });
    setExecOpen(true);
  };

  const handleSaveExec = () => {
    execForm.validateFields().then(async vals => {
      const numId = Number(execItem!.id);
      try {
        if (!isNaN(numId) && numId > 0) {
          await updateMaintPlan(numId, { status: 'DONE', actualDate: vals.actualDate, actualDuration: vals.actualDuration, result: vals.result });
        }
      } catch { /* 仍然更新本地 */ }
      setList(prev => prev.map(m => m.id === execItem!.id ? {
        ...m, ...vals, status: 'DONE' as MaintStatus, updatedAt: new Date().toISOString().slice(0, 10),
      } : m));
      message.success('维保记录已提交，计划标记为"已完成"');
      setExecOpen(false);
    }).catch(() => {});
  };

  const columns: ColumnsType<MaintPlan> = [
    {
      title: '计划编号', dataIndex: 'planNo', width: 170,
      render: (v: string, r: MaintPlan) => (
        <span style={{ color: '#1677FF', fontWeight: 600, cursor: 'pointer', fontFamily: 'monospace', fontSize: 12 }}
          onClick={() => { setDetailItem(r); setDetailOpen(true); }}>
          {v}
        </span>
      ),
    },
    {
      title: '设备', dataIndex: 'equipCode', width: 180,
      render: (v: string, r: MaintPlan) => (
        <div>
          <div style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 600 }}>{v}</div>
          <div style={{ fontSize: 11, color: '#888' }}>{r.equipName}</div>
        </div>
      ),
    },
    {
      title: '类型', dataIndex: 'maintType', width: 90, align: 'center',
      render: (v: MaintType) => {
        const m = MAINT_TYPE_MAP[v];
        return <Tag color={m.color} style={{ fontSize: 11 }}>{m.label}</Tag>;
      },
    },
    {
      title: '维保内容', dataIndex: 'maintContent', width: 220,
      render: (v: string) => <Tooltip title={v}><span style={{ fontSize: 12 }}>{v.length > 30 ? v.slice(0, 30) + '…' : v}</span></Tooltip>,
    },
    {
      title: '计划日期', dataIndex: 'planDate', width: 110, align: 'center',
      sorter: (a, b) => a.planDate.localeCompare(b.planDate),
      render: (v: string, r: MaintPlan) => {
        const overdue = r.status === 'PENDING' && isOverdue(v);
        const days = getDaysUntil(v);
        const soon = r.status === 'PENDING' && days !== null && days <= 7 && days >= 0;
        return (
          <Tooltip title={overdue ? '已逾期！' : soon ? `${days}天后` : ''}>
            <span style={{ fontSize: 12, color: overdue ? '#FF4D4F' : soon ? '#FAAD14' : '#555', fontWeight: (overdue || soon) ? 600 : 400 }}>
              {(overdue || soon) && <WarningOutlined style={{ marginRight: 3 }} />}{v}
            </span>
          </Tooltip>
        );
      },
    },
    {
      title: '计划工时', dataIndex: 'planDuration', width: 80, align: 'center',
      render: (v: number) => <span style={{ fontSize: 12 }}>{v}h</span>,
    },
    {
      title: '负责人', dataIndex: 'assignee', width: 100,
      render: (v?: string) => v ? <span style={{ fontSize: 12 }}><UserOutlined style={{ marginRight: 4, color: '#888' }} />{v}</span> : <span style={{ color: '#ccc', fontSize: 11 }}>—</span>,
    },
    {
      title: '实际完成', width: 110, align: 'center',
      render: (_: any, r: MaintPlan) => r.actualDate ? (
        <div>
          <div style={{ fontSize: 12, color: '#52C41A' }}>{r.actualDate}</div>
          {r.actualDuration && <div style={{ fontSize: 11, color: '#888' }}>{r.actualDuration}h</div>}
        </div>
      ) : <span style={{ color: '#ccc', fontSize: 11 }}>—</span>,
    },
    {
      title: '状态', dataIndex: 'status', width: 90, align: 'center',
      render: (v: MaintStatus) => {
        const m = MAINT_STATUS_MAP[v];
        return <Badge status={m.badge} text={<span style={{ fontSize: 12 }}>{m.label}</span>} />;
      },
    },
    {
      title: '操作', width: 160, fixed: 'right',
      render: (_: any, r: MaintPlan) => (
        <Space size={0} split={<span style={{ color: '#e8e8e8', margin: '0 1px' }}>|</span>}>
          <Button type="link" size="small" icon={<EyeOutlined />} style={{ padding: '0 4px', fontSize: 12 }}
            onClick={() => { setDetailItem(r); setDetailOpen(true); }}>详情</Button>
          {['PENDING', 'IN_PROGRESS', 'OVERDUE'].includes(r.status) && (
            <>
              <Button type="link" size="small" icon={<CheckCircleOutlined />} style={{ padding: '0 4px', fontSize: 12, color: '#52C41A' }} onClick={() => handleExec(r)}>执行完成</Button>
              <Button type="link" size="small" icon={<ToolOutlined />} style={{ padding: '0 4px', fontSize: 12 }} onClick={() => handleEdit(r)}>编辑</Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* 汇总卡片（可点击过滤） */}
      <Row gutter={10} style={{ marginBottom: 12 }}>
        {([
          { cardKey: undefined,    label: '计划总数',   value: summary.total,      color: '#1677FF' },
          { cardKey: 'pending',    label: '待执行',     value: summary.pending,    color: '#1677FF' },
          { cardKey: 'inProgress', label: '执行中',     value: summary.inProgress, color: '#FAAD14' },
          { cardKey: 'done',       label: '已完成',     value: summary.done,       color: '#52C41A' },
          { cardKey: 'overdue',    label: '已逾期',     value: summary.overdue,    color: '#FF4D4F' },
          { cardKey: 'upcoming',   label: '7天内到期',  value: summary.upcoming,   color: '#FA8C16' },
        ] as { cardKey: MaintCardFilter; label: string; value: number; color: string }[]).map(c => {
          const isActive = cardFilter === c.cardKey;
          return (
            <Col key={c.label} flex="1">
              <Tooltip title={c.cardKey ? `点击筛选"${c.label}"` : '查看全部'}>
                <div
                  onClick={() => handleCardClick(c.cardKey)}
                  style={{
                    background: isActive ? `${c.color}12` : '#fff',
                    border: `1px solid ${isActive ? c.color : (c.value > 0 && (c.label === '已逾期' || c.label === '7天内到期') ? c.color + '60' : '#f0f0f0')}`,
                    borderRadius: 8, padding: '10px 14px',
                    display: 'flex', alignItems: 'center', gap: 10,
                    cursor: 'pointer', transition: 'all 0.2s',
                    boxShadow: isActive ? `0 0 0 2px ${c.color}30` : '0 1px 4px rgba(0,0,0,.04)',
                  }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: c.color + '18',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, color: c.color }}>
                    <CalendarOutlined />
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

      {(summary.overdue > 0 || summary.upcoming > 0) && (
        <Alert type={summary.overdue > 0 ? 'error' : 'warning'} showIcon banner
          message={`${summary.overdue > 0 ? `${summary.overdue}条维保计划已逾期未执行；` : ''}${summary.upcoming > 0 ? `${summary.upcoming}条维保计划7天内到期，请安排执行。` : ''}`}
          style={{ marginBottom: 10, borderRadius: 8 }} />
      )}

      {/* 搜索栏 */}
      <div style={{ background: '#fff', borderRadius: 8, padding: '10px 14px', marginBottom: 10, border: '1px solid #f0f0f0' }}>
        <Row gutter={10} align="middle">
          <Col flex="none">
            <Input prefix={<SearchOutlined style={{ color: '#bbb' }} />} placeholder="计划编号/设备/内容"
              value={searchText} onChange={e => setSearchText(e.target.value)} style={{ width: 220 }} allowClear />
          </Col>
          <Col flex="none">
            <Select placeholder="维保类型" value={filterType} onChange={setFilterType} allowClear style={{ width: 120 }}>
              {Object.entries(MAINT_TYPE_MAP).map(([k, v]) => <Option key={k} value={k}>{v.label}</Option>)}
            </Select>
          </Col>
          <Col flex="none">
            <Select placeholder="状态" value={filterStatus} onChange={setFilterStatus} allowClear style={{ width: 110 }}>
              {Object.entries(MAINT_STATUS_MAP).map(([k, v]) => <Option key={k} value={k}>{v.label}</Option>)}
            </Select>
          </Col>
          <Col flex="none">
            <Select placeholder="所属设备" value={filterEquip} onChange={setFilterEquip} allowClear style={{ width: 180 }}>
              {mockEquipRecords.map(e => <Option key={e.id} value={e.id}>{e.equipCode} {e.equipName}</Option>)}
            </Select>
          </Col>
          <Col flex="none">
            <Button icon={<ReloadOutlined />} onClick={() => { setSearchText(''); setFilterType(undefined); setFilterStatus(undefined); setFilterEquip(undefined); setCardFilter(undefined); }}>重置</Button>
          </Col>
          <Col flex="auto" style={{ textAlign: 'right' }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新建维保计划</Button>
          </Col>
        </Row>
      </div>

      {/* 表格 */}
      <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #f0f0f0', overflow: 'hidden' }}>
        <div style={{ padding: '8px 14px', borderBottom: '1px solid #f5f5f5', display: 'flex', alignItems: 'center', gap: 8 }}>
          <CalendarOutlined style={{ color: '#1677FF' }} />
          <span style={{ fontWeight: 600, fontSize: 14 }}>维保计划列表</span>
          <Tag style={{ marginLeft: 4 }}>{filtered.length} 条</Tag>
        </div>
        <Table rowKey="id" dataSource={filtered} columns={columns} size="small"
          scroll={{ x: 1400, y: 'calc(100vh - 380px)' }}
          pagination={{ pageSize: 15, showSizeChanger: true, showTotal: t => `共 ${t} 条`, size: 'small' }}
          rowClassName={r => r.status === 'OVERDUE' || (r.status === 'PENDING' && isOverdue(r.planDate)) ? 'ant-table-row-overdue' : ''}
        />
      </div>

      {/* 新建/编辑 Modal */}
      <Modal title={editing ? '编辑维保计划' : '新建维保计划'} open={modalOpen} onOk={handleSave} onCancel={() => setModalOpen(false)}
        okText="保存" cancelText="取消" width={640} destroyOnClose>
        <Form form={form} layout="vertical" size="middle" style={{ marginTop: 12 }}>
          <Row gutter={14}>
            <Col span={12}>
              <Form.Item name="equipId" label="设备" rules={[{ required: true }]}>
                <Select showSearch optionFilterProp="children">
                  {mockEquipRecords.map(e => <Option key={e.id} value={e.id}>{e.equipCode} — {e.equipName}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="maintType" label="维保类型" rules={[{ required: true }]}>
                <Select>{Object.entries(MAINT_TYPE_MAP).map(([k, v]) => <Option key={k} value={k}>{v.label}</Option>)}</Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="planDate" label="计划日期" rules={[{ required: true }]}>
                <Input placeholder="YYYY-MM-DD" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="planDuration" label="计划工时(h)" rules={[{ required: true }]}>
                <Input type="number" min={0.5} step={0.5} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="assignee" label="负责人">
                <Input placeholder="维修工程师/外部厂商" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="状态">
                <Select>{Object.entries(MAINT_STATUS_MAP).map(([k, v]) => <Option key={k} value={k}>{v.label}</Option>)}</Select>
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="maintContent" label="维保内容" rules={[{ required: true, min: 5 }]}>
                <TextArea rows={3} placeholder="详细描述维保项目和要求…" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="nextPlanDate" label="下次计划日期">
                <Input placeholder="YYYY-MM-DD" />
              </Form.Item>
            </Col>
            <Col span={24}><Form.Item name="remark" label="备注"><TextArea rows={2} /></Form.Item></Col>
          </Row>
        </Form>
      </Modal>

      {/* 执行记录 Modal */}
      <Modal title={<Space><CheckCircleOutlined style={{ color: '#52C41A' }} /><span>执行完成记录 — {execItem?.planNo}</span></Space>}
        open={execOpen} onOk={handleSaveExec} onCancel={() => setExecOpen(false)}
        okText="确认完成" cancelText="取消" okButtonProps={{ style: { background: '#52C41A', border: 'none' } }} width={540} destroyOnClose>
        {execItem && (
          <div>
            <div style={{ background: '#f6f6f6', borderRadius: 6, padding: '8px 12px', marginBottom: 14, fontSize: 12 }}>
              <b>{execItem.equipCode}</b> | {execItem.equipName} | 计划：{execItem.planDate}<br />
              {execItem.maintContent}
            </div>
            <Form form={execForm} layout="vertical" size="middle">
              <Row gutter={14}>
                <Col span={12}><Form.Item name="actualDate" label="实际完成日期" rules={[{ required: true }]}><Input placeholder="YYYY-MM-DD" /></Form.Item></Col>
                <Col span={12}><Form.Item name="actualDuration" label="实际工时(h)" rules={[{ required: true }]}><Input type="number" min={0.5} step={0.5} /></Form.Item></Col>
                <Col span={24}><Form.Item name="result" label="维保结果" rules={[{ required: true, min: 10 }]}><TextArea rows={3} placeholder="描述实际维保情况、更换零件、检测结果等…" /></Form.Item></Col>
                <Col span={24}><Form.Item name="nextPlanDate" label="下次计划日期"><Input placeholder="YYYY-MM-DD" /></Form.Item></Col>
              </Row>
            </Form>
          </div>
        )}
      </Modal>

      {/* 详情 Drawer */}
      <Drawer title={<Space><CalendarOutlined style={{ color: '#1677FF' }} /><span>维保详情 — {detailItem?.planNo}</span></Space>}
        open={detailOpen} onClose={() => setDetailOpen(false)} width={560}>
        {detailItem && (
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <Tag color={(MAINT_TYPE_MAP[detailItem.maintType] ?? { color: 'default' }).color} style={{ fontSize: 12, padding: '4px 10px' }}>{(MAINT_TYPE_MAP[detailItem.maintType] ?? { label: detailItem.maintType ?? '-' }).label}</Tag>
              <Badge status={(MAINT_STATUS_MAP[detailItem.status] ?? { badge: 'default' as any }).badge} text={<span style={{ fontWeight: 600, color: (MAINT_STATUS_MAP[detailItem.status] ?? { color: '#888' }).color }}>{(MAINT_STATUS_MAP[detailItem.status] ?? { label: String(detailItem.status ?? '-') }).label}</span>} />
            </div>
            <Descriptions bordered size="small" column={2} labelStyle={{ width: 110, fontWeight: 500 }}>
              <Descriptions.Item label="计划编号" span={2}><span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{detailItem.planNo}</span></Descriptions.Item>
              <Descriptions.Item label="设备编码"><span style={{ fontFamily: 'monospace' }}>{detailItem.equipCode}</span></Descriptions.Item>
              <Descriptions.Item label="设备名称">{detailItem.equipName}</Descriptions.Item>
              <Descriptions.Item label="计划日期"><CalendarOutlined style={{ marginRight: 4 }} />{detailItem.planDate}</Descriptions.Item>
              <Descriptions.Item label="计划工时">{detailItem.planDuration}h</Descriptions.Item>
              <Descriptions.Item label="负责人">{detailItem.assignee || '—'}</Descriptions.Item>
              <Descriptions.Item label="下次计划">{detailItem.nextPlanDate || '—'}</Descriptions.Item>
              <Descriptions.Item label="维保内容" span={2}><div style={{ color: '#333' }}>{detailItem.maintContent}</div></Descriptions.Item>
              {detailItem.actualDate && <>
                <Descriptions.Item label="实际完成日期">{detailItem.actualDate}</Descriptions.Item>
                <Descriptions.Item label="实际工时">{detailItem.actualDuration || '—'}h</Descriptions.Item>
                <Descriptions.Item label="维保结果" span={2}>{detailItem.result || '—'}</Descriptions.Item>
              </>}
              {detailItem.remark && <Descriptions.Item label="备注" span={2}>{detailItem.remark}</Descriptions.Item>}
            </Descriptions>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default MaintPlanPage;

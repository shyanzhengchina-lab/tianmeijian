/**
 * CalibrationPage.tsx — 计量校准管理
 * GMP医疗器械MES 设备管理模块 - 计量校准子页
 */
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Table, Button, Input, Select, Space, Tag, message, Badge,
  Row, Col, Modal, Form, Drawer, Descriptions, Divider,
  Alert, Tooltip,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined, SearchOutlined, ReloadOutlined, EyeOutlined,
  CheckCircleOutlined, WarningOutlined, SafetyCertificateOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import {
  CalibRecord, CalibStatus,
  CALIB_STATUS_MAP,
  mockCalibRecords, mockEquipRecords, isOverdue, getDaysUntil,
} from './equipmentData';
import { getCalibrationList, createCalibration, updateCalibration } from '../../api/equipmentSub';
import type { CalibrationRecord } from '../../api/equipmentSub';

const { Option } = Select;
const { TextArea } = Input;

const genId = () => `cb_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

export type CalibCardFilter = 'valid' | 'expired' | 'pending' | 'expiring' | undefined;

interface CalibrationPageProps {
  initialCardFilter?: CalibCardFilter;
}

const CalibrationPage: React.FC<CalibrationPageProps> = ({ initialCardFilter }) => {
  const [list, setList] = useState<CalibRecord[]>(mockCalibRecords);

  const loadFromApi = useCallback(async () => {
    try {
      const resp = await getCalibrationList() as any;
      const apiList: CalibrationRecord[] = resp?.data ?? [];
      if (apiList.length > 0) {
        setList(apiList.map(item => ({
          id: String(item.id ?? ''),
          calibNo: item.calibNo ?? '',
          equipId: item.equipId ?? '',
          equipCode: item.equipCode ?? '',
          equipName: item.equipName ?? '',
          calibType: (item.calibType ?? 'INTERNAL') as 'INTERNAL' | 'EXTERNAL',
          calibOrg: item.calibOrg ?? undefined,
          calibDate: item.calibDate ?? '',
          nextCalibDate: item.nextCalibDate ?? '',
          calibCycle: item.calibCycle ?? 12,
          calibResult: (item.calibResult ?? 'PASS') as 'PASS' | 'FAIL' | 'CONDITIONAL',
          certNo: item.certNo ?? undefined,
          uncertainty: item.uncertainty ?? undefined,
          status: (item.status ?? 'VALID') as CalibStatus,
          measuredValue: item.measuredValue ?? undefined,
          standardValue: item.standardValue ?? undefined,
          deviation: item.deviation ?? undefined,
          operator: item.operator ?? undefined,
          remark: item.remark ?? '',
          createdAt: item.createTime ?? '',
        } as unknown as CalibRecord)));
      }
    } catch { /* 后端不可用时保留 mock */ }
  }, []);

  useEffect(() => { loadFromApi(); }, [loadFromApi]);
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [filterType, setFilterType] = useState<string | undefined>();
  const [filterEquip, setFilterEquip] = useState<string | undefined>();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CalibRecord | null>(null);
  const [form] = Form.useForm();

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<CalibRecord | null>(null);

  // 支持从总览页传入初始卡片过滤
  const [cardFilter, setCardFilter] = useState<CalibCardFilter>(initialCardFilter);

  const handleCardClick = (key: CalibCardFilter) => {
    setCardFilter(prev => prev === key ? undefined : key);
    setFilterStatus(undefined);
  };

  const filtered = useMemo(() => list.filter(c => {
    const t = searchText.toLowerCase();
    if (cardFilter === 'valid'    && c.status !== 'VALID') return false;
    if (cardFilter === 'expired'   && !(c.status === 'EXPIRED' || isOverdue(c.nextCalibDate))) return false;
    if (cardFilter === 'pending'   && c.status !== 'PENDING') return false;
    if (cardFilter === 'expiring') {
      const d = getDaysUntil(c.nextCalibDate);
      if (!(c.status === 'VALID' && d !== null && d <= 30 && d >= 0)) return false;
    }
    return (!t || c.calibNo.toLowerCase().includes(t) || c.equipCode.toLowerCase().includes(t) || c.equipName.includes(t) || (c.certNo || '').includes(t))
      && (!filterStatus || c.status === filterStatus)
      && (!filterType   || c.calibType === filterType)
      && (!filterEquip  || c.equipId === filterEquip);
  }), [list, searchText, filterStatus, filterType, filterEquip, cardFilter]);

  const summary = useMemo(() => ({
    total:   list.length,
    valid:   list.filter(c => c.status === 'VALID').length,
    expired: list.filter(c => c.status === 'EXPIRED' || isOverdue(c.nextCalibDate)).length,
    pending: list.filter(c => c.status === 'PENDING').length,
    expiring: list.filter(c => {
      const d = getDaysUntil(c.nextCalibDate);
      return c.status === 'VALID' && d !== null && d <= 30 && d >= 0;
    }).length,
  }), [list]);

  const handleAdd = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ calibType: 'INTERNAL', calibResult: 'PASS', calibCycle: 6, status: 'VALID', calibDate: new Date().toISOString().slice(0, 10) });
    setModalOpen(true);
  };

  const handleEdit = (r: CalibRecord) => {
    setEditing(r);
    form.setFieldsValue({ ...r });
    setModalOpen(true);
  };

  const handleSave = () => {
    form.validateFields().then(async vals => {
      const now = new Date().toISOString().slice(0, 10);
      const equip = mockEquipRecords.find(e => e.id === vals.equipId);
      const payload: CalibrationRecord = {
        equipId: vals.equipId, equipCode: equip?.equipCode ?? '', equipName: equip?.equipName ?? '',
        calibDate: vals.calibDate, calibOrg: vals.calibOrg, calibResult: vals.calibResult,
        nextCalibDate: vals.nextCalibDate, operator: vals.calibBy, remark: vals.remark,
      };
      try {
        if (editing) {
          const numId = Number(editing.id);
          if (!isNaN(numId) && numId > 0) await updateCalibration(numId, payload);
          setList(prev => prev.map(c => c.id === editing.id ? { ...c, ...vals } : c));
          message.success('校准记录修改成功');
        } else {
          const resp = await createCalibration(payload) as any;
          const newId = String(resp?.data?.id ?? genId());
          setList(prev => [{
            ...vals, id: newId,
            calibNo: resp?.data?.calibNo ?? `CAL-${now.replace(/-/g,'')}-${(list.length+1).toString().padStart(3,'0')}`,
            equipCode: equip?.equipCode || '', equipName: equip?.equipName || '',
            createdAt: now,
          }, ...prev]);
          message.success('校准记录创建成功');
        }
      } catch (err: any) { message.error('保存失败：' + (err?.message ?? '')); return; }
      setModalOpen(false);
    }).catch(() => {});
  };

  const columns: ColumnsType<CalibRecord> = [
    {
      title: '校准编号', dataIndex: 'calibNo', width: 180,
      render: (v: string, r: CalibRecord) => (
        <span style={{ color: '#1677FF', fontWeight: 600, cursor: 'pointer', fontFamily: 'monospace', fontSize: 12 }}
          onClick={() => { setDetailItem(r); setDetailOpen(true); }}>
          <SafetyCertificateOutlined style={{ marginRight: 4 }} />{v}
        </span>
      ),
    },
    {
      title: '设备', dataIndex: 'equipCode', width: 200,
      render: (v: string, r: CalibRecord) => (
        <div>
          <div style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 600 }}>{v}</div>
          <div style={{ fontSize: 11, color: '#888' }}>{r.equipName}</div>
        </div>
      ),
    },
    {
      title: '类型', dataIndex: 'calibType', width: 90, align: 'center',
      render: (v: 'INTERNAL' | 'EXTERNAL') => (
        <Tag color={v === 'EXTERNAL' ? '#722ED1' : '#1677FF'} style={{ fontSize: 11 }}>
          {v === 'EXTERNAL' ? '外部校准' : '内部校准'}
        </Tag>
      ),
    },
    {
      title: '校准机构', dataIndex: 'calibOrg', width: 160,
      render: (v?: string) => v ? <span style={{ fontSize: 12 }}>{v}</span> : <span style={{ color: '#ccc', fontSize: 11 }}>内部</span>,
    },
    {
      title: '校准日期', dataIndex: 'calibDate', width: 105, align: 'center',
      render: (v: string) => <span style={{ fontSize: 12 }}>{v}</span>,
    },
    {
      title: '下次校准', dataIndex: 'nextCalibDate', width: 115, align: 'center',
      sorter: (a, b) => a.nextCalibDate.localeCompare(b.nextCalibDate),
      render: (v: string, r: CalibRecord) => {
        const overdue = isOverdue(v) && r.status !== 'EXPIRED';
        const days = getDaysUntil(v);
        const soon = days !== null && days <= 30 && days >= 0 && r.status === 'VALID';
        return (
          <Tooltip title={overdue ? '已过期！' : soon ? `${days}天后到期` : ''}>
            <span style={{ fontSize: 12, color: overdue ? '#FF4D4F' : soon ? '#FAAD14' : '#555', fontWeight: (overdue || soon) ? 600 : 400 }}>
              {(overdue || soon) && <WarningOutlined style={{ marginRight: 3 }} />}{v}
              {soon && !overdue && <span style={{ fontSize: 10, color: '#888', marginLeft: 4 }}>({days}天)</span>}
            </span>
          </Tooltip>
        );
      },
    },
    {
      title: '周期', dataIndex: 'calibCycle', width: 70, align: 'center',
      render: (v: number) => <span style={{ fontSize: 12 }}>{v}个月</span>,
    },
    {
      title: '校准结果', dataIndex: 'calibResult', width: 90, align: 'center',
      render: (v: 'PASS' | 'FAIL' | 'CONDITIONAL') => (
        <Tag color={v === 'PASS' ? 'success' : v === 'FAIL' ? 'error' : 'warning'} style={{ fontSize: 11 }}>
          {v === 'PASS' ? '合格' : v === 'FAIL' ? '不合格' : '有条件'}
        </Tag>
      ),
    },
    {
      title: '证书编号', dataIndex: 'certNo', width: 140,
      render: (v?: string) => v ? <span style={{ fontFamily: 'monospace', fontSize: 11 }}>{v}</span> : <span style={{ color: '#ccc', fontSize: 11 }}>—</span>,
    },
    {
      title: '状态', dataIndex: 'status', width: 90, align: 'center',
      render: (v: CalibStatus) => {
        const m = CALIB_STATUS_MAP[v];
        return <Badge status={m.badge} text={<span style={{ fontSize: 12 }}>{m.label}</span>} />;
      },
    },
    {
      title: '操作', width: 120, fixed: 'right',
      render: (_: any, r: CalibRecord) => (
        <Space size={0} split={<span style={{ color: '#e8e8e8', margin: '0 1px' }}>|</span>}>
          <Button type="link" size="small" icon={<EyeOutlined />} style={{ padding: '0 4px', fontSize: 12 }}
            onClick={() => { setDetailItem(r); setDetailOpen(true); }}>详情</Button>
          <Button type="link" size="small" style={{ padding: '0 4px', fontSize: 12 }} onClick={() => handleEdit(r)}>编辑</Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* 汇总卡片（可点击过滤） */}
      <Row gutter={10} style={{ marginBottom: 12 }}>
        {([
          { cardKey: undefined,  label: '记录总数',   value: summary.total,    color: '#1677FF' },
          { cardKey: 'valid',    label: '有效',       value: summary.valid,    color: '#52C41A' },
          { cardKey: 'expired',  label: '已过期',     value: summary.expired,  color: '#FF4D4F' },
          { cardKey: 'pending',  label: '待校准',     value: summary.pending,  color: '#FAAD14' },
          { cardKey: 'expiring', label: '30天内到期', value: summary.expiring, color: '#FA8C16' },
        ] as { cardKey: CalibCardFilter; label: string; value: number; color: string }[]).map(c => {
          const isActive = cardFilter === c.cardKey;
          return (
            <Col key={c.label} flex="1">
              <Tooltip title={c.cardKey ? `点击筛选"${c.label}"` : '查看全部'}>
                <div
                  onClick={() => handleCardClick(c.cardKey)}
                  style={{
                    background: isActive ? `${c.color}12` : '#fff',
                    border: `1px solid ${isActive ? c.color : (c.value > 0 && ['已过期', '待校准', '30天内到期'].includes(c.label) ? c.color + '60' : '#f0f0f0')}`,
                    borderRadius: 8, padding: '10px 14px',
                    display: 'flex', alignItems: 'center', gap: 10,
                    cursor: 'pointer', transition: 'all 0.2s',
                    boxShadow: isActive ? `0 0 0 2px ${c.color}30` : '0 1px 4px rgba(0,0,0,.04)',
                  }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: c.color + '18',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, color: c.color }}>
                    <SafetyCertificateOutlined />
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

      {(summary.expired > 0 || summary.expiring > 0) && (
        <Alert type={summary.expired > 0 ? 'error' : 'warning'} showIcon banner
          message={`${summary.expired > 0 ? `${summary.expired}台设备校准已过期，不得用于质量检验；` : ''}${summary.expiring > 0 ? `${summary.expiring}台设备30天内校准到期，请提前安排校准。` : ''}`}
          style={{ marginBottom: 10, borderRadius: 8 }} />
      )}

      {/* 搜索栏 */}
      <div style={{ background: '#fff', borderRadius: 8, padding: '10px 14px', marginBottom: 10, border: '1px solid #f0f0f0' }}>
        <Row gutter={10} align="middle">
          <Col flex="none">
            <Input prefix={<SearchOutlined style={{ color: '#bbb' }} />} placeholder="校准编号/设备/证书编号"
              value={searchText} onChange={e => setSearchText(e.target.value)} style={{ width: 230 }} allowClear />
          </Col>
          <Col flex="none">
            <Select placeholder="校准类型" value={filterType} onChange={setFilterType} allowClear style={{ width: 110 }}>
              <Option value="INTERNAL">内部校准</Option>
              <Option value="EXTERNAL">外部校准</Option>
            </Select>
          </Col>
          <Col flex="none">
            <Select placeholder="状态" value={filterStatus} onChange={setFilterStatus} allowClear style={{ width: 110 }}>
              {Object.entries(CALIB_STATUS_MAP).map(([k, v]) => <Option key={k} value={k}>{v.label}</Option>)}
            </Select>
          </Col>
          <Col flex="none">
            <Select placeholder="所属设备" value={filterEquip} onChange={setFilterEquip} allowClear style={{ width: 180 }}>
              {mockEquipRecords.filter(e => e.category === 'INSPECT' || e.isValidationRequired).map(e => <Option key={e.id} value={e.id}>{e.equipCode} {e.equipName}</Option>)}
            </Select>
          </Col>
          <Col flex="none">
            <Button icon={<ReloadOutlined />} onClick={() => { setSearchText(''); setFilterType(undefined); setFilterStatus(undefined); setFilterEquip(undefined); setCardFilter(undefined); }}>重置</Button>
          </Col>
          <Col flex="auto" style={{ textAlign: 'right' }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} style={{ background: '#722ED1', border: 'none' }}>新增校准记录</Button>
          </Col>
        </Row>
      </div>

      {/* 表格 */}
      <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #f0f0f0', overflow: 'hidden' }}>
        <div style={{ padding: '8px 14px', borderBottom: '1px solid #f5f5f5', display: 'flex', alignItems: 'center', gap: 8 }}>
          <SafetyCertificateOutlined style={{ color: '#722ED1' }} />
          <span style={{ fontWeight: 600, fontSize: 14 }}>计量校准记录</span>
          <Tag style={{ marginLeft: 4 }}>{filtered.length} 条</Tag>
        </div>
        <Table rowKey="id" dataSource={filtered} columns={columns} size="small"
          scroll={{ x: 1400, y: 'calc(100vh - 380px)' }}
          pagination={{ pageSize: 15, showSizeChanger: true, showTotal: t => `共 ${t} 条`, size: 'small' }}
        />
      </div>

      {/* 新增/编辑 Modal */}
      <Modal title={editing ? '编辑校准记录' : '新增校准记录'} open={modalOpen} onOk={handleSave} onCancel={() => setModalOpen(false)}
        okText="保存" cancelText="取消" width={680} destroyOnClose>
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
              <Form.Item name="calibType" label="校准类型" rules={[{ required: true }]}>
                <Select>
                  <Option value="INTERNAL">内部校准</Option>
                  <Option value="EXTERNAL">外部校准</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="calibOrg" label="校准机构（外部）">
                <Input placeholder="如：上海市计量检测技术研究院" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="calibDate" label="校准日期" rules={[{ required: true }]}>
                <Input placeholder="YYYY-MM-DD" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="calibCycle" label="校准周期（月）" rules={[{ required: true }]}>
                <Input type="number" min={1} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="nextCalibDate" label="下次校准日期" rules={[{ required: true }]}>
                <Input placeholder="YYYY-MM-DD" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="calibResult" label="校准结果" rules={[{ required: true }]}>
                <Select>
                  <Option value="PASS"><Tag color="success">合格</Tag></Option>
                  <Option value="FAIL"><Tag color="error">不合格</Tag></Option>
                  <Option value="CONDITIONAL"><Tag color="warning">有条件使用</Tag></Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="状态">
                <Select>{Object.entries(CALIB_STATUS_MAP).map(([k, v]) => <Option key={k} value={k}>{v.label}</Option>)}</Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="certNo" label="证书编号">
                <Input placeholder="SH-MEAS-2026-001234" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="uncertainty" label="不确定度">
                <Input placeholder="U=2μm (k=2)" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="measuredValue" label="测量值">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="standardValue" label="标准值">
                <Input />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="deviation" label="偏差">
                <Input placeholder="如：+0.001mm (合格限：±0.003mm)" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="operator" label="操作人">
                <Input />
              </Form.Item>
            </Col>
            <Col span={24}><Form.Item name="remark" label="备注"><TextArea rows={2} /></Form.Item></Col>
          </Row>
        </Form>
      </Modal>

      {/* 详情 Drawer */}
      <Drawer title={<Space><SafetyCertificateOutlined style={{ color: '#722ED1' }} /><span>校准记录详情 — {detailItem?.calibNo}</span></Space>}
        open={detailOpen} onClose={() => setDetailOpen(false)} width={580}>
        {detailItem && (
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
              <Tag color={detailItem.calibType === 'EXTERNAL' ? '#722ED1' : '#1677FF'} style={{ fontSize: 12, padding: '4px 10px' }}>
                {detailItem.calibType === 'EXTERNAL' ? '外部校准' : '内部校准'}
              </Tag>
              <Tag color={detailItem.calibResult === 'PASS' ? 'success' : detailItem.calibResult === 'FAIL' ? 'error' : 'warning'} style={{ fontSize: 12, padding: '4px 10px' }}>
                校准结果：{detailItem.calibResult === 'PASS' ? '合格' : detailItem.calibResult === 'FAIL' ? '不合格' : '有条件'}
              </Tag>
              <Badge status={(CALIB_STATUS_MAP[detailItem.status] ?? { badge: 'default' as any }).badge} text={<span style={{ fontWeight: 600, color: (CALIB_STATUS_MAP[detailItem.status] ?? { color: '#888' }).color }}>{(CALIB_STATUS_MAP[detailItem.status] ?? { label: String(detailItem.status ?? '-') }).label}</span>} />
            </div>
            <Descriptions bordered size="small" column={2} labelStyle={{ width: 120, fontWeight: 500 }}>
              <Descriptions.Item label="校准编号" span={2}><span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#1677FF' }}>{detailItem.calibNo}</span></Descriptions.Item>
              <Descriptions.Item label="设备编码"><span style={{ fontFamily: 'monospace' }}>{detailItem.equipCode}</span></Descriptions.Item>
              <Descriptions.Item label="设备名称">{detailItem.equipName}</Descriptions.Item>
              <Descriptions.Item label="校准机构" span={2}>{detailItem.calibOrg || '内部（自校准）'}</Descriptions.Item>
              <Descriptions.Item label="校准日期"><CalendarOutlined style={{ marginRight: 4 }} />{detailItem.calibDate}</Descriptions.Item>
              <Descriptions.Item label="下次校准">
                {(() => {
                  const overdue = isOverdue(detailItem.nextCalibDate);
                  const days = getDaysUntil(detailItem.nextCalibDate);
                  return (
                    <span style={{ color: overdue ? '#FF4D4F' : (days !== null && days <= 30) ? '#FAAD14' : undefined }}>
                      {overdue && <WarningOutlined style={{ marginRight: 4 }} />}
                      {detailItem.nextCalibDate}
                      {days !== null && !overdue && <span style={{ color: '#888', fontSize: 11, marginLeft: 6 }}>（{days}天后）</span>}
                      {overdue && <span style={{ color: '#FF4D4F', fontSize: 11, marginLeft: 6 }}>（已过期）</span>}
                    </span>
                  );
                })()}
              </Descriptions.Item>
              <Descriptions.Item label="校准周期">{detailItem.calibCycle}个月</Descriptions.Item>
              <Descriptions.Item label="证书编号"><span style={{ fontFamily: 'monospace', fontSize: 12 }}>{detailItem.certNo || '—'}</span></Descriptions.Item>
              <Descriptions.Item label="不确定度">{detailItem.uncertainty || '—'}</Descriptions.Item>
              <Descriptions.Item label="测量值">{detailItem.measuredValue || '—'}</Descriptions.Item>
              <Descriptions.Item label="标准值">{detailItem.standardValue || '—'}</Descriptions.Item>
              <Descriptions.Item label="偏差" span={2}>{detailItem.deviation || '—'}</Descriptions.Item>
              <Descriptions.Item label="操作人">{detailItem.operator || '—'}</Descriptions.Item>
              <Descriptions.Item label="记录创建">{detailItem.createdAt}</Descriptions.Item>
              {detailItem.remark && <Descriptions.Item label="备注" span={2}>{detailItem.remark}</Descriptions.Item>}
            </Descriptions>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default CalibrationPage;

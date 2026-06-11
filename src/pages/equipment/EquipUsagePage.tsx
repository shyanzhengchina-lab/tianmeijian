/**
 * EquipUsagePage.tsx — 设备使用记录（设备批生产记录）
 * GMP医疗器械MES 设备管理模块
 *
 * 对应PRD：设备批记录模块
 * - 记录每台设备用于哪个批次/工单/操作人
 * - 使用前后清洁确认（GMP要求）
 * - 设备参数记录
 * - 电子签名
 * - 异常标记
 * - 支持按批号/设备/工单双向追溯
 */
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Table, Button, Input, Select, Space, Tag, message, Badge,
  Row, Col, Modal, Form, Drawer, Descriptions, Divider,
  Switch, Alert, Tooltip, Timeline,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined, SearchOutlined, ReloadOutlined, EyeOutlined,
  ToolOutlined, CheckCircleOutlined, CloseCircleOutlined,
  WarningOutlined, ClockCircleOutlined, FileTextOutlined,
  SafetyCertificateOutlined, QrcodeOutlined,
} from '@ant-design/icons';
import {
  EquipUsageRecord,
  mockUsageRecords, mockEquipRecords,
} from './equipmentData';
import { getEquipUsageList, createEquipUsage, updateEquipUsage } from '../../api/equipmentSub';
import type { EquipUsageApiRecord } from '../../api/equipmentSub';

const { Option } = Select;
const { TextArea } = Input;

const genId = () => `eu_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

type CardFilter = 'total' | 'today' | 'abnormal' | 'noSign' | 'noClean' | null;

const EquipUsagePage: React.FC = () => {
  const [list, setList] = useState<EquipUsageRecord[]>(mockUsageRecords);

  const loadFromApi = useCallback(async () => {
    try {
      const resp = await getEquipUsageList() as any;
      const apiList: EquipUsageApiRecord[] = resp?.data ?? [];
      if (apiList.length > 0) {
        setList(apiList.map(item => ({
          id: String(item.id ?? ''),
          usageNo: item.usageNo ?? '',
          equipId: item.equipId ?? '',
          equipCode: item.equipCode ?? '',
          equipName: item.equipName ?? '',
          woId: item.woId ?? undefined,
          woNo: item.woNo ?? undefined,
          taskId: item.taskId ?? undefined,
          taskNo: item.taskNo ?? undefined,
          batchNo: item.batchNo ?? undefined,
          productCode: item.productCode ?? undefined,
          productName: item.productName ?? undefined,
          operator: item.operator ?? '',
          startTime: item.startTime ?? '',
          endTime: item.endTime ?? undefined,
          duration: item.duration ?? undefined,
          setupParams: item.setupParams ?? undefined,
          cleanBefore: item.cleanBefore === 1,
          cleanAfter: item.cleanAfter === 1,
          abnormalFlag: item.abnormalFlag === 1,
          abnormalDesc: item.abnormalDesc ?? undefined,
          operatorSign: item.operatorSign ?? undefined,
          remark: item.remark ?? '',
          createdAt: item.createTime ?? '',
        } as unknown as EquipUsageRecord)));
      }
    } catch { /* 后端不可用时保留 mock */ }
  }, []);

  useEffect(() => { loadFromApi(); }, [loadFromApi]);
  const [searchText, setSearchText] = useState('');
  const [filterEquip, setFilterEquip] = useState<string | undefined>();
  const [filterAbnormal, setFilterAbnormal] = useState<string | undefined>();
  const [activeCard, setActiveCard] = useState<CardFilter>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<EquipUsageRecord | null>(null);

  const handleCardClick = (key: CardFilter) => {
    setActiveCard(prev => prev === key ? null : key);
  };

  const handleReset = () => {
    setSearchText('');
    setFilterEquip(undefined);
    setFilterAbnormal(undefined);
    setActiveCard(null);
  };

  // ── 过滤 ──────────────────────────────────────────────────────
  const filtered = useMemo(() => list.filter(r => {
    // 汇总卡片过滤
    if (activeCard === 'today')    { if (!(r.createdAt === '2026-04-29' || r.startTime?.startsWith('2026-04-29'))) return false; }
    if (activeCard === 'abnormal') { if (!r.abnormalFlag) return false; }
    if (activeCard === 'noSign')   { if (r.operatorSign) return false; }
    if (activeCard === 'noClean')  { if (r.cleanBefore !== false && r.cleanAfter !== false) return false; }
    const t = searchText.toLowerCase();
    return (!t
      || r.usageNo.toLowerCase().includes(t)
      || r.equipCode.toLowerCase().includes(t)
      || r.equipName.includes(t)
      || (r.batchNo || '').includes(t)
      || (r.woNo || '').includes(t)
      || (r.taskNo || '').includes(t)
      || (r.productName || '').includes(t)
      || r.operator.includes(t)
    )
    && (!filterEquip   || r.equipId === filterEquip)
    && (filterAbnormal === undefined || filterAbnormal === ''
      || (filterAbnormal === 'YES' && r.abnormalFlag)
      || (filterAbnormal === 'NO'  && !r.abnormalFlag));
  }), [list, searchText, filterEquip, filterAbnormal, activeCard]);

  const summary = useMemo(() => ({
    total:    list.length,
    abnormal: list.filter(r => r.abnormalFlag).length,
    today:    list.filter(r => r.createdAt === '2026-04-29' || r.startTime?.startsWith('2026-04-29')).length,
    noSign:   list.filter(r => !r.operatorSign).length,
    noClean:  list.filter(r => r.cleanBefore === false || r.cleanAfter === false).length,
  }), [list]);

  // ── 新建记录 ──────────────────────────────────────────────────
  const handleAdd = () => {
    form.resetFields();
    form.setFieldsValue({
      cleanBefore: true,
      cleanAfter: false,
      abnormalFlag: false,
      startTime: new Date().toISOString().slice(0, 16).replace('T', ' '),
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    form.validateFields().then(async vals => {
      const now = new Date().toISOString().slice(0, 10);
      const equip = mockEquipRecords.find(e => e.id === vals.equipId);
      const payload: EquipUsageApiRecord = {
        equipId:      vals.equipId ?? '',
        equipCode:    equip?.equipCode ?? '',
        equipName:    equip?.equipName ?? '',
        woNo:         vals.woNo ?? undefined,
        taskNo:       vals.taskNo ?? undefined,
        batchNo:      vals.batchNo ?? undefined,
        productName:  vals.productName ?? undefined,
        operator:     vals.operator ?? '',
        startTime:    vals.startTime ?? '',
        endTime:      vals.endTime ?? undefined,
        setupParams:  vals.setupParams ?? undefined,
        cleanBefore:  vals.cleanBefore ? 1 : 0,
        cleanAfter:   vals.cleanAfter  ? 1 : 0,
        abnormalFlag: vals.abnormalFlag ? 1 : 0,
        abnormalDesc: vals.abnormalDesc ?? undefined,
        remark:       vals.remark ?? '',
      };
      try {
        const resp = await createEquipUsage(payload) as any;
        const savedId = resp?.data?.id ? String(resp.data.id) : genId();
        const newRec: EquipUsageRecord = {
          ...vals,
          id:          savedId,
          usageNo:     resp?.data?.usageNo ?? `EU-${now.replace(/-/g, '')}-${(list.length + 1).toString().padStart(3, '0')}`,
          equipCode:   equip?.equipCode || '',
          equipName:   equip?.equipName || '',
          cleanBefore: !!vals.cleanBefore,
          cleanAfter:  !!vals.cleanAfter,
          abnormalFlag: !!vals.abnormalFlag,
          createdAt:   now,
        };
        setList(prev => [newRec, ...prev]);
        message.success(`设备使用记录 ${newRec.usageNo} 已创建`);
      } catch {
        // interceptor already toasted; fallback save locally
        const newRec: EquipUsageRecord = {
          ...vals,
          id:          genId(),
          usageNo:     `EU-${now.replace(/-/g, '')}-${(list.length + 1).toString().padStart(3, '0')}`,
          equipCode:   equip?.equipCode || '',
          equipName:   equip?.equipName || '',
          cleanBefore: !!vals.cleanBefore,
          cleanAfter:  !!vals.cleanAfter,
          abnormalFlag: !!vals.abnormalFlag,
          createdAt:   now,
        };
        setList(prev => [newRec, ...prev]);
      }
      setModalOpen(false);
    }).catch(() => {});
  };

  const handleSign = async (id: string) => {
    const userName = '当前操作员';
    const signStr  = `${userName}-${new Date().toISOString().slice(0, 10)}`;
    const numId = Number(id);
    try {
      if (!isNaN(numId) && numId > 0) {
        await updateEquipUsage(numId, { operatorSign: signStr });
      }
    } catch { /* ignore */ }
    setList(prev => prev.map(r => r.id === id ? { ...r, operatorSign: signStr } : r));
    message.success('电子签名完成');
  };

  const handleCloseRecord = async (id: string) => {
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
    const numId = Number(id);
    setList(prev => prev.map(r => {
      if (r.id !== id || r.endTime) return r;
      const start  = new Date(r.startTime).getTime();
      const end    = new Date(now).getTime();
      const mins   = Math.round((end - start) / 60000);
      const updated = { ...r, endTime: now, duration: mins, cleanAfter: true };
      // fire-and-forget API update
      if (!isNaN(numId) && numId > 0) {
        updateEquipUsage(numId, { endTime: now, duration: mins, cleanAfter: 1 }).catch(() => {});
      }
      return updated;
    }));
    message.success('记录已关闭，使用时长已计算');
  };

  // ── 列定义 ────────────────────────────────────────────────────
  const columns: ColumnsType<EquipUsageRecord> = [
    {
      title: '记录编号', dataIndex: 'usageNo', width: 170,
      render: (v: string, r: EquipUsageRecord) => (
        <span
          style={{ color: '#1677FF', fontWeight: 600, cursor: 'pointer', fontFamily: 'monospace', fontSize: 12 }}
          onClick={() => { setDetailItem(r); setDetailOpen(true); }}
        >
          <FileTextOutlined style={{ marginRight: 4 }} />{v}
        </span>
      ),
    },
    {
      title: '设备', dataIndex: 'equipCode', width: 190,
      render: (v: string, r: EquipUsageRecord) => (
        <div>
          <div style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: '#333' }}>{v}</div>
          <div style={{ fontSize: 11, color: '#888' }}>{r.equipName}</div>
        </div>
      ),
    },
    {
      title: '批号 / 工单', dataIndex: 'batchNo', width: 190,
      render: (batchNo: string, r: EquipUsageRecord) => (
        <div>
          {batchNo && <Tag color="geekblue" style={{ fontFamily: 'monospace', fontSize: 11 }}>{batchNo}</Tag>}
          {r.woNo && <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{r.woNo}</div>}
          {r.taskNo && <div style={{ fontSize: 10, color: '#aaa' }}>{r.taskNo}</div>}
        </div>
      ),
    },
    {
      title: '产品', dataIndex: 'productName', width: 140,
      render: (v?: string, r?: EquipUsageRecord) => v ? (
        <div>
          <div style={{ fontSize: 12 }}>{v}</div>
          <div style={{ fontSize: 11, color: '#888', fontFamily: 'monospace' }}>{r?.productCode}</div>
        </div>
      ) : <span style={{ color: '#ccc', fontSize: 11 }}>—</span>,
    },
    {
      title: '操作人', dataIndex: 'operator', width: 90,
      render: (v: string) => <span style={{ fontSize: 12 }}>{v}</span>,
    },
    {
      title: '开始时间', dataIndex: 'startTime', width: 135, align: 'center',
      render: (v: string) => <span style={{ fontSize: 11, color: '#555' }}>{v}</span>,
    },
    {
      title: '结束时间 / 时长', dataIndex: 'endTime', width: 140, align: 'center',
      render: (v?: string, r?: EquipUsageRecord) => v ? (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: '#555' }}>{v}</div>
          {r?.duration && (
            <Tag style={{ fontSize: 10, marginTop: 2 }}>
              {r.duration >= 60 ? `${Math.floor(r.duration / 60)}h${r.duration % 60}m` : `${r.duration}m`}
            </Tag>
          )}
        </div>
      ) : <Tag color="processing" style={{ fontSize: 10 }}>进行中</Tag>,
    },
    {
      title: '清洁确认', width: 110, align: 'center',
      render: (_: any, r: EquipUsageRecord) => (
        <Space direction="vertical" size={2} style={{ lineHeight: 1.2 }}>
          <Tooltip title="使用前清洁">
            <span style={{ fontSize: 11 }}>
              {r.cleanBefore
                ? <CheckCircleOutlined style={{ color: '#52C41A', marginRight: 3 }} />
                : <CloseCircleOutlined style={{ color: '#FF4D4F', marginRight: 3 }} />
              }前
            </span>
          </Tooltip>
          <Tooltip title="使用后清洁">
            <span style={{ fontSize: 11 }}>
              {r.cleanAfter
                ? <CheckCircleOutlined style={{ color: '#52C41A', marginRight: 3 }} />
                : <CloseCircleOutlined style={{ color: '#ccc', marginRight: 3 }} />
              }后
            </span>
          </Tooltip>
        </Space>
      ),
    },
    {
      title: '异常', dataIndex: 'abnormalFlag', width: 70, align: 'center',
      render: (v: boolean) => v
        ? <Tag color="error" style={{ fontSize: 11 }}><WarningOutlined /> 异常</Tag>
        : <Tag color="success" style={{ fontSize: 11 }}>正常</Tag>,
    },
    {
      title: '电子签名', dataIndex: 'operatorSign', width: 130, align: 'center',
      render: (v?: string) => v
        ? <Tooltip title={v}><Tag color="success" style={{ fontSize: 10 }}><SafetyCertificateOutlined /> 已签名</Tag></Tooltip>
        : <Tag color="warning" style={{ fontSize: 10 }}>待签名</Tag>,
    },
    {
      title: '操作', width: 180, fixed: 'right',
      render: (_: any, r: EquipUsageRecord) => (
        <Space size={0} split={<span style={{ color: '#e8e8e8', margin: '0 1px' }}>|</span>}>
          <Button type="link" size="small" icon={<EyeOutlined />}
            style={{ padding: '0 4px', fontSize: 12 }}
            onClick={() => { setDetailItem(r); setDetailOpen(true); }}>详情</Button>
          {!r.endTime && (
            <Button type="link" size="small" icon={<CheckCircleOutlined />}
              style={{ padding: '0 4px', fontSize: 12, color: '#52C41A' }}
              onClick={() => handleCloseRecord(r.id)}>完成</Button>
          )}
          {!r.operatorSign && (
            <Button type="link" size="small" icon={<SafetyCertificateOutlined />}
              style={{ padding: '0 4px', fontSize: 12, color: '#722ED1' }}
              onClick={() => handleSign(r.id)}>签名</Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* 汇总卡片 — 全部可点击过滤 */}
      <Row gutter={10} style={{ marginBottom: 12 }}>
        {([
          { key: 'total'   as CardFilter, label: '记录总数',   value: summary.total,    color: '#1677FF', tooltip: '显示全部记录' },
          { key: 'today'   as CardFilter, label: '今日记录',   value: summary.today,    color: '#52C41A', tooltip: '过滤今日记录' },
          { key: 'abnormal'as CardFilter, label: '异常记录',   value: summary.abnormal, color: '#FF4D4F', tooltip: '过滤异常记录' },
          { key: 'noSign'  as CardFilter, label: '待签名',     value: summary.noSign,   color: '#FAAD14', tooltip: '过滤未签名记录' },
          { key: 'noClean' as CardFilter, label: '清洁未确认', value: summary.noClean,  color: '#FA8C16', tooltip: '过滤清洁未确认记录' },
        ]).map(c => {
          const isActive = activeCard === c.key || (c.key === 'total' && activeCard === null);
          return (
            <Col key={c.label} flex="1">
              <Tooltip title={c.tooltip} placement="bottom">
                <div
                  onClick={() => handleCardClick(c.key === 'total' ? null : c.key)}
                  style={{
                    background: isActive ? c.color + '0f' : '#fff',
                    border: `1px solid ${isActive ? c.color : (c.value > 0 && c.key !== 'total' && c.key !== 'today' ? c.color + '40' : '#f0f0f0')}`,
                    borderRadius: 8, padding: '10px 14px',
                    display: 'flex', alignItems: 'center', gap: 10,
                    cursor: 'pointer',
                    transform: isActive ? 'translateY(-2px)' : 'none',
                    boxShadow: isActive ? `0 4px 12px ${c.color}30` : '0 1px 4px rgba(0,0,0,.04)',
                    transition: 'all 0.18s',
                    position: 'relative',
                  }}
                  onMouseEnter={e => {
                    if (!isActive) {
                      (e.currentTarget as HTMLDivElement).style.borderColor = c.color + '80';
                      (e.currentTarget as HTMLDivElement).style.boxShadow = `0 3px 10px ${c.color}20`;
                      (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-1px)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isActive) {
                      (e.currentTarget as HTMLDivElement).style.borderColor = c.value > 0 && c.key !== 'total' && c.key !== 'today' ? c.color + '40' : '#f0f0f0';
                      (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 4px rgba(0,0,0,.04)';
                      (e.currentTarget as HTMLDivElement).style.transform = 'none';
                    }
                  }}
                >
                  {isActive && (
                    <div style={{
                      position: 'absolute', top: 4, right: 6,
                      width: 6, height: 6, borderRadius: '50%', background: c.color,
                    }} />
                  )}
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: isActive ? c.color + '25' : c.color + '18',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 15, color: c.color,
                  }}>
                    <FileTextOutlined />
                  </div>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: c.color }}>{c.value}</div>
                    <div style={{ fontSize: 11, color: isActive ? c.color : '#888' }}>{c.label}</div>
                  </div>
                </div>
              </Tooltip>
            </Col>
          );
        })}
      </Row>

      {(summary.abnormal > 0 || summary.noClean > 0) && (
        <Alert type="warning" showIcon banner
          message={`${summary.abnormal > 0 ? `${summary.abnormal}条记录存在异常，请复核；` : ''}${summary.noClean > 0 ? `${summary.noClean}条记录清洁确认未完成，不符合GMP要求。` : ''}`}
          style={{ marginBottom: 10, borderRadius: 8 }} />
      )}

      {/* 搜索栏 */}
      <div style={{ background: '#fff', borderRadius: 8, padding: '10px 14px', marginBottom: 10, border: '1px solid #f0f0f0' }}>
        <Row gutter={10} align="middle">
          <Col flex="none">
            <Input
              prefix={<SearchOutlined style={{ color: '#bbb' }} />}
              placeholder="记录编号/批号/工单/设备/产品/操作人"
              value={searchText} onChange={e => setSearchText(e.target.value)}
              style={{ width: 270 }} allowClear />
          </Col>
          <Col flex="none">
            <Select placeholder="所属设备" value={filterEquip} onChange={setFilterEquip} allowClear style={{ width: 200 }}>
              {mockEquipRecords.map(e => (
                <Option key={e.id} value={e.id}>{e.equipCode} — {e.equipName}</Option>
              ))}
            </Select>
          </Col>
          <Col flex="none">
            <Select placeholder="是否异常" value={filterAbnormal} onChange={setFilterAbnormal} allowClear style={{ width: 110 }}>
              <Option value="YES"><Tag color="error">有异常</Tag></Option>
              <Option value="NO"><Tag color="success">正常</Tag></Option>
            </Select>
          </Col>
          <Col flex="none">
            <Button icon={<ReloadOutlined />} onClick={handleReset}>重置</Button>
          </Col>
          <Col flex="auto" style={{ textAlign: 'right' }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}
              style={{ background: '#1677FF' }}>新建使用记录</Button>
          </Col>
        </Row>
      </div>

      {/* 表格 */}
      <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #f0f0f0', overflow: 'hidden' }}>
        <div style={{ padding: '8px 14px', borderBottom: '1px solid #f5f5f5', display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileTextOutlined style={{ color: '#1677FF' }} />
          <span style={{ fontWeight: 600, fontSize: 14 }}>设备使用记录（批生产记录）</span>
          <Tag style={{ marginLeft: 4 }}>{filtered.length} 条</Tag>
          {summary.abnormal > 0 && <Tag color="error"><WarningOutlined /> {summary.abnormal}条异常</Tag>}
          {summary.noSign > 0   && <Tag color="warning">{summary.noSign}条待签名</Tag>}
        </div>
        <Table
          rowKey="id" dataSource={filtered} columns={columns} size="small"
          scroll={{ x: 1600, y: 'calc(100vh - 390px)' }}
          pagination={{ pageSize: 15, showSizeChanger: true, showTotal: t => `共 ${t} 条`, size: 'small' }}
          rowClassName={r => r.abnormalFlag ? 'ant-table-row-warning' : ''}
        />
      </div>

      {/* 新建记录 Modal */}
      <Modal
        title={<Space><FileTextOutlined style={{ color: '#1677FF' }} /><span>新建设备使用记录</span></Space>}
        open={modalOpen} onOk={handleSave} onCancel={() => setModalOpen(false)}
        okText="创建记录" cancelText="取消" width={720} destroyOnClose>
        <Alert
          type="info" showIcon
          message="GMP要求：每次生产使用设备前须确认清洁状态，使用后记录实际参数，操作完成后进行电子签名。"
          style={{ marginBottom: 14 }} />
        <Form form={form} layout="vertical" size="middle">
          <Row gutter={14}>
            <Col span={12}>
              <Form.Item name="equipId" label="使用设备" rules={[{ required: true, message: '请选择设备' }]}>
                <Select showSearch optionFilterProp="children" placeholder="选择设备">
                  {mockEquipRecords.map(e => (
                    <Option key={e.id} value={e.id}>
                      <span style={{ fontFamily: 'monospace' }}>{e.equipCode}</span> — {e.equipName}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="operator" label="操作人" rules={[{ required: true }]}>
                <Input placeholder="操作员姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="batchNo" label="生产批号">
                <Input placeholder="LOT-20260429-001" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="woNo" label="关联工单号">
                <Input placeholder="WO-20260429-001" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="taskNo" label="关联任务单号">
                <Input placeholder="TK-20260429-001-D1" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="productName" label="产品名称">
                <Input placeholder="#25/.04根管锉" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="startTime" label="开始使用时间" rules={[{ required: true }]}>
                <Input placeholder="YYYY-MM-DD HH:mm" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="endTime" label="结束时间（完成后填写）">
                <Input placeholder="YYYY-MM-DD HH:mm" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="setupParams" label="设备参数记录">
                <TextArea rows={2} placeholder="记录本次使用的关键设备参数，如：转速、温度、压力、时间等" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="cleanBefore" label="使用前清洁确认" valuePropName="checked">
                <Switch checkedChildren="✓ 已清洁" unCheckedChildren="✗ 未清洁" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="cleanAfter" label="使用后清洁确认" valuePropName="checked">
                <Switch checkedChildren="✓ 已清洁" unCheckedChildren="等待" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="abnormalFlag" label="是否有异常" valuePropName="checked">
                <Switch checkedChildren="⚠ 有异常" unCheckedChildren="正常" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="abnormalDesc" label="异常描述（有异常时必填）">
                <TextArea rows={2} placeholder="描述异常情况，已采取的措施…" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="remark" label="备注">
                <TextArea rows={1} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* 详情 Drawer */}
      <Drawer
        title={
          <Space>
            <FileTextOutlined style={{ color: '#1677FF' }} />
            <span>使用记录详情 — {detailItem?.usageNo}</span>
            {detailItem?.abnormalFlag && <Tag color="error"><WarningOutlined /> 异常</Tag>}
          </Space>
        }
        open={detailOpen} onClose={() => setDetailOpen(false)} width={640}
        extra={
          <Space>
            {detailItem && !detailItem.operatorSign && (
              <Button type="primary" icon={<SafetyCertificateOutlined />}
                onClick={() => { handleSign(detailItem.id); setDetailOpen(false); }}
                style={{ background: '#722ED1', border: 'none' }}>
                电子签名
              </Button>
            )}
            {detailItem && !detailItem.endTime && (
              <Button icon={<CheckCircleOutlined />} style={{ color: '#52C41A', borderColor: '#52C41A' }}
                onClick={() => { handleCloseRecord(detailItem.id); setDetailOpen(false); }}>
                完成记录
              </Button>
            )}
          </Space>
        }>
        {detailItem && (
          <div>
            {/* 状态概览 */}
            <Row gutter={10} style={{ marginBottom: 14 }}>
              <Col span={8}>
                <div style={{ background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 6, padding: '8px 12px', textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#888' }}>记录状态</div>
                  <div style={{ fontWeight: 700, color: detailItem.endTime ? '#52C41A' : '#1677FF', marginTop: 2 }}>
                    {detailItem.endTime ? '已完成' : '进行中'}
                  </div>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ background: detailItem.abnormalFlag ? '#fff1f0' : '#f6ffed', border: `1px solid ${detailItem.abnormalFlag ? '#ffa39e' : '#b7eb8f'}`, borderRadius: 6, padding: '8px 12px', textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#888' }}>异常状态</div>
                  <div style={{ fontWeight: 700, color: detailItem.abnormalFlag ? '#FF4D4F' : '#52C41A', marginTop: 2 }}>
                    {detailItem.abnormalFlag ? '⚠ 有异常' : '✓ 正常'}
                  </div>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ background: detailItem.operatorSign ? '#f6ffed' : '#fffbe6', border: `1px solid ${detailItem.operatorSign ? '#b7eb8f' : '#ffe58f'}`, borderRadius: 6, padding: '8px 12px', textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#888' }}>电子签名</div>
                  <div style={{ fontWeight: 700, color: detailItem.operatorSign ? '#52C41A' : '#FAAD14', marginTop: 2 }}>
                    {detailItem.operatorSign ? '✓ 已签名' : '待签名'}
                  </div>
                </div>
              </Col>
            </Row>

            <Descriptions bordered size="small" column={2} labelStyle={{ width: 120, fontWeight: 500 }}>
              <Descriptions.Item label="记录编号" span={2}>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#1677FF' }}>{detailItem.usageNo}</span>
              </Descriptions.Item>
              <Descriptions.Item label="使用设备">
                <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{detailItem.equipCode}</span>
              </Descriptions.Item>
              <Descriptions.Item label="设备名称">{detailItem.equipName}</Descriptions.Item>
              <Descriptions.Item label="操作人">{detailItem.operator}</Descriptions.Item>
              <Descriptions.Item label="记录日期">{detailItem.createdAt}</Descriptions.Item>

              <Descriptions.Item label="生产批号">
                {detailItem.batchNo
                  ? <Tag color="geekblue" style={{ fontFamily: 'monospace' }}>{detailItem.batchNo}</Tag>
                  : <span style={{ color: '#ccc' }}>—</span>}
              </Descriptions.Item>
              <Descriptions.Item label="产品">
                {detailItem.productName || <span style={{ color: '#ccc' }}>—</span>}
              </Descriptions.Item>
              <Descriptions.Item label="关联工单">
                {detailItem.woNo ? <span style={{ fontFamily: 'monospace', color: '#1677FF' }}>{detailItem.woNo}</span> : <span style={{ color: '#ccc' }}>—</span>}
              </Descriptions.Item>
              <Descriptions.Item label="关联任务单">
                {detailItem.taskNo ? <span style={{ fontFamily: 'monospace', color: '#722ED1' }}>{detailItem.taskNo}</span> : <span style={{ color: '#ccc' }}>—</span>}
              </Descriptions.Item>

              <Descriptions.Item label="开始时间">
                <ClockCircleOutlined style={{ marginRight: 4 }} />{detailItem.startTime}
              </Descriptions.Item>
              <Descriptions.Item label="结束时间">
                {detailItem.endTime
                  ? <><ClockCircleOutlined style={{ marginRight: 4 }} />{detailItem.endTime}</>
                  : <Tag color="processing">进行中</Tag>}
              </Descriptions.Item>
              <Descriptions.Item label="使用时长" span={2}>
                {detailItem.duration != null
                  ? <Tag style={{ fontSize: 13 }}>
                      {detailItem.duration >= 60
                        ? `${Math.floor(detailItem.duration / 60)} 小时 ${detailItem.duration % 60} 分钟`
                        : `${detailItem.duration} 分钟`}
                    </Tag>
                  : <span style={{ color: '#ccc' }}>—</span>}
              </Descriptions.Item>

              <Descriptions.Item label="使用前清洁">
                {detailItem.cleanBefore
                  ? <><CheckCircleOutlined style={{ color: '#52C41A', marginRight: 4 }} /><span style={{ color: '#52C41A' }}>已确认清洁</span></>
                  : <><CloseCircleOutlined style={{ color: '#FF4D4F', marginRight: 4 }} /><span style={{ color: '#FF4D4F' }}>未确认</span></>}
              </Descriptions.Item>
              <Descriptions.Item label="使用后清洁">
                {detailItem.cleanAfter
                  ? <><CheckCircleOutlined style={{ color: '#52C41A', marginRight: 4 }} /><span style={{ color: '#52C41A' }}>已确认清洁</span></>
                  : <><CloseCircleOutlined style={{ color: '#ccc', marginRight: 4 }} /><span style={{ color: '#ccc' }}>未确认</span></>}
              </Descriptions.Item>
            </Descriptions>

            {/* 设备参数 */}
            {detailItem.setupParams && (
              <>
                <Divider style={{ margin: '14px 0 8px' }}><span style={{ fontSize: 12, color: '#888' }}>设备参数记录</span></Divider>
                <div style={{ background: '#f6f8fa', border: '1px solid #e8e8e8', borderRadius: 6, padding: '10px 14px', fontFamily: 'monospace', fontSize: 12, color: '#333', whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
                  {detailItem.setupParams}
                </div>
              </>
            )}

            {/* 异常描述 */}
            {detailItem.abnormalFlag && (
              <>
                <Divider style={{ margin: '14px 0 8px' }}><span style={{ fontSize: 12, color: '#FF4D4F' }}>⚠ 异常情况</span></Divider>
                <div style={{ background: '#fff1f0', border: '1px solid #ffa39e', borderRadius: 6, padding: '10px 14px', fontSize: 12, color: '#333' }}>
                  {detailItem.abnormalDesc || '（未填写异常描述，请补充）'}
                </div>
              </>
            )}

            {/* 电子签名 */}
            <Divider style={{ margin: '14px 0 8px' }}><span style={{ fontSize: 12, color: '#888' }}>电子签名</span></Divider>
            {detailItem.operatorSign ? (
              <div style={{ background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 6, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <SafetyCertificateOutlined style={{ color: '#52C41A', fontSize: 18 }} />
                <div>
                  <div style={{ fontWeight: 700, color: '#52C41A', fontSize: 13 }}>已完成电子签名</div>
                  <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#555', marginTop: 2 }}>{detailItem.operatorSign}</div>
                </div>
              </div>
            ) : (
              <div style={{ background: '#fffbe6', border: '1px solid #ffe58f', borderRadius: 6, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ color: '#FAAD14', fontSize: 13 }}>
                  <WarningOutlined style={{ marginRight: 6 }} />GMP要求：操作完成后须进行电子签名确认
                </div>
                <Button type="primary" icon={<SafetyCertificateOutlined />}
                  onClick={() => { handleSign(detailItem.id); setDetailOpen(false); }}
                  style={{ background: '#722ED1', border: 'none' }}>
                  立即签名
                </Button>
              </div>
            )}

            {detailItem.remark && (
              <div style={{ marginTop: 12, background: '#fafafa', border: '1px solid #f0f0f0', borderRadius: 6, padding: '8px 12px', fontSize: 12, color: '#888' }}>
                备注：{detailItem.remark}
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default EquipUsagePage;

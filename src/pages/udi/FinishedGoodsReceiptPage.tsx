/**
 * 成品入库页面
 * ================================================================
 * 功能：
 *  1. 列表展示成品入库单
 *  2. 新建入库单时选择生产订单 → 自动携带 UDI 码
 *  3. 确认入库后，将 UDI 记录状态更新为 BOUND
 * ================================================================
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Table, Button, Input, Select, Space, Tag, Modal, Form,
  InputNumber, message, Tooltip, Row, Col, Descriptions, Badge,
  Typography, Card, Statistic, Divider,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined, SearchOutlined, ReloadOutlined, CheckCircleOutlined,
  StopOutlined, EyeOutlined, InboxOutlined, QrcodeOutlined, CopyOutlined,
} from '@ant-design/icons';
import {
  getReceiptList, createReceipt, updateReceipt,
  getUdiList, updateUdiRecord,
} from '../../api/udi';
import type { FinishedGoodsReceipt, UdiRecord } from '../../api/udi';
import {
  loadUdiRecords, saveUdiRecords, getUdiByOrderNo,
} from './udiUtils';

const { Text } = Typography;
const { Option } = Select;

// ── localStorage fallback for receipts ─────────────────────────
const LS_RECEIPTS = 'fg_receipts';

function loadLocalReceipts(): FinishedGoodsReceipt[] {
  try {
    const s = localStorage.getItem(LS_RECEIPTS);
    return s ? JSON.parse(s) : [];
  } catch { return []; }
}

function saveLocalReceipts(list: FinishedGoodsReceipt[]): void {
  localStorage.setItem(LS_RECEIPTS, JSON.stringify(list));
}

// ── Local production order cache (from localStorage bridge) ─────
const LS_POS = 'production_orders_v2';
function loadLocalPos(): any[] {
  try {
    const s = localStorage.getItem(LS_POS);
    return s ? JSON.parse(s) : [];
  } catch { return []; }
}

// ── Auto-generate receipt number ────────────────────────────────
function genReceiptNo(): string {
  const now = new Date();
  const ymd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const seq = String(Math.floor(Math.random() * 900) + 100);
  return `FGR-${ymd}-${seq}`;
}

// ── Status mapping ───────────────────────────────────────────────
const STATUS_MAP: Record<string, { label: string; color: string }> = {
  PENDING:   { label: '待入库', color: 'orange' },
  RECEIVED:  { label: '已入库', color: 'green'  },
  CANCELLED: { label: '已取消', color: 'default' },
};

// ── Detail Modal ─────────────────────────────────────────────────
const DetailModal: React.FC<{
  record: FinishedGoodsReceipt | null;
  open: boolean;
  onClose: () => void;
}> = ({ record, open, onClose }) => {
  if (!record) return null;
  const st = STATUS_MAP[record.status] ?? { label: record.status, color: 'default' };
  return (
    <Modal
      title="入库单详情"
      open={open}
      onCancel={onClose}
      footer={<Button onClick={onClose}>关闭</Button>}
      width={640}
    >
      <Descriptions bordered column={2} size="small" style={{ marginTop: 12 }}>
        <Descriptions.Item label="入库单号" span={2}><Text strong>{record.receiptNo}</Text></Descriptions.Item>
        <Descriptions.Item label="状态">
          <Tag color={st.color}>{st.label}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="入库时间">{record.receiptTime ?? '—'}</Descriptions.Item>
        <Descriptions.Item label="关联生产订单">{record.productionOrderNo ?? '—'}</Descriptions.Item>
        <Descriptions.Item label="物料编码">{record.materialCode ?? '—'}</Descriptions.Item>
        <Descriptions.Item label="物料名称" span={2}>{record.materialName ?? '—'}</Descriptions.Item>
        <Descriptions.Item label="规格型号">{record.spec ?? '—'}</Descriptions.Item>
        <Descriptions.Item label="数量">{record.qty} {record.unitName ?? ''}</Descriptions.Item>
        <Descriptions.Item label="批号">{record.batchNo ?? '—'}</Descriptions.Item>
        <Descriptions.Item label="仓库">{record.warehouseCode ?? '—'}</Descriptions.Item>
        <Descriptions.Item label="库位">{record.locationCode ?? '—'}</Descriptions.Item>
        <Descriptions.Item label="操作人">{record.operator ?? '—'}</Descriptions.Item>
        <Descriptions.Item label="UDI码" span={2}>
          {record.udiString ? (
            <Space>
              <Text code style={{ fontSize: 11 }}>{record.udiString}</Text>
              <Tooltip title="复制UDI">
                <Button
                  size="small" type="link" icon={<CopyOutlined />}
                  onClick={() => { navigator.clipboard.writeText(record.udiString!); message.success('已复制'); }}
                />
              </Tooltip>
            </Space>
          ) : <Text type="secondary">无UDI码</Text>}
        </Descriptions.Item>
        <Descriptions.Item label="备注" span={2}>{record.remark ?? '—'}</Descriptions.Item>
      </Descriptions>
    </Modal>
  );
};

// ── New Receipt Modal ────────────────────────────────────────────
const NewReceiptModal: React.FC<{
  open: boolean;
  onClose: () => void;
  onCreated: (r: FinishedGoodsReceipt) => void;
}> = ({ open, onClose, onCreated }) => {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [pos, setPos] = useState<any[]>([]);
  const [selectedPo, setSelectedPo] = useState<any | null>(null);
  const [matchedUdi, setMatchedUdi] = useState<UdiRecord | null>(null);
  const [previewNo] = useState(genReceiptNo);

  // Load production orders from localStorage
  useEffect(() => {
    if (open) {
      setPos(loadLocalPos());
      setMatchedUdi(null);
      setSelectedPo(null);
      form.resetFields();
      form.setFieldsValue({ receiptNo: previewNo });
    }
  }, [open, form, previewNo]);

  const handlePoSelect = useCallback((poId: string) => {
    const po = pos.find(p => String(p.id) === String(poId));
    if (!po) return;
    setSelectedPo(po);

    // Auto-fill fields from PO
    form.setFieldsValue({
      productionOrderId: po.id,
      productionOrderNo: po.orderNo ?? po.productionOrderNo ?? '',
      materialCode: po.materialCode ?? po.material?.code ?? '',
      materialName: po.materialName ?? po.material?.name ?? po.finishedGoodName ?? '',
      spec: po.spec ?? po.material?.spec ?? '',
      qty: po.quantity ?? po.qty ?? 1,
      unitName: po.unit ?? po.unitName ?? '',
      batchNo: po.batchNo ?? po.orderNo ?? '',
    });

    // Fetch matched UDI from localStorage
    const orderNo = po.orderNo ?? po.productionOrderNo ?? '';
    const udis = getUdiByOrderNo(orderNo);
    if (udis.length > 0) {
      const latestUdi = udis[udis.length - 1];
      setMatchedUdi(latestUdi);
      form.setFieldsValue({ udiString: latestUdi.udiString });
    } else {
      setMatchedUdi(null);
      form.setFieldsValue({ udiString: '' });
    }
  }, [pos, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
      const receipt: FinishedGoodsReceipt = {
        ...values,
        status: 'PENDING' as const,
        createTime: now,
      };

      // Try API first, fallback to localStorage
      let saved: FinishedGoodsReceipt = receipt;
      try {
        const resp = await createReceipt(receipt);
        if (resp?.data) saved = { ...receipt, ...resp.data };
      } catch {
        // localStorage only
        saved = { ...receipt, id: Date.now() };
      }

      // Persist locally
      const localList = loadLocalReceipts();
      saveLocalReceipts([...localList, saved]);

      message.success('入库单已创建');
      onCreated(saved);
      onClose();
    } catch (e: any) {
      if (e?.errorFields) return; // validation error
      message.error('创建失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={
        <span>
          <span style={{
            display: 'inline-block', width: 4, height: 16,
            background: '#52c41a', borderRadius: 2,
            marginRight: 8, verticalAlign: 'middle',
          }} />
          新建成品入库单
        </span>
      }
      open={open}
      onOk={handleOk}
      onCancel={onClose}
      okText="保存"
      cancelText="取消"
      width={700}
      confirmLoading={saving}
      destroyOnClose
    >
      <Form form={form} layout="vertical" size="middle" style={{ marginTop: 16 }}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="receiptNo" label="入库单号" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="productionOrderId" label="关联生产订单">
              <Select
                placeholder="选择生产订单（可选）"
                showSearch
                optionFilterProp="label"
                onChange={handlePoSelect}
                allowClear
              >
                {pos.map(po => (
                  <Option
                    key={String(po.id)}
                    value={String(po.id)}
                    label={po.orderNo ?? po.productionOrderNo ?? String(po.id)}
                  >
                    {po.orderNo ?? po.productionOrderNo ?? po.id}
                    {po.finishedGoodName || po.materialName
                      ? ` — ${po.finishedGoodName ?? po.materialName}`
                      : ''}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={0} style={{ display: 'none' }}>
            <Form.Item name="productionOrderNo"><Input /></Form.Item>
          </Col>

          {/* UDI 预览 */}
          {matchedUdi && (
            <Col span={24}>
              <div style={{
                background: '#f0f9eb', border: '1px solid #b7eb8f',
                borderRadius: 6, padding: '8px 12px', marginBottom: 8,
              }}>
                <Space align="center">
                  <QrcodeOutlined style={{ color: '#52c41a', fontSize: 16 }} />
                  <Text strong style={{ color: '#389e0d' }}>已匹配UDI码：</Text>
                  <Text code style={{ fontSize: 11 }}>{matchedUdi.udiString}</Text>
                </Space>
              </div>
            </Col>
          )}

          <Col span={12}>
            <Form.Item name="materialCode" label="物料编码">
              <Input placeholder="物料编码" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="materialName" label="物料名称" rules={[{ required: true, message: '请填写物料名称' }]}>
              <Input placeholder="物料名称" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="qty" label="入库数量" rules={[{ required: true, message: '请输入数量' }]}>
              <InputNumber min={0.001} precision={3} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="unitName" label="单位">
              <Input placeholder="单位" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="batchNo" label="批号" rules={[{ required: true, message: '请输入批号' }]}>
              <Input placeholder="批号" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="warehouseCode" label="入库仓库">
              <Input placeholder="仓库编码" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="locationCode" label="库位">
              <Input placeholder="库位编码" />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item name="udiString" label="UDI码（自动携带）">
              <Input.TextArea
                rows={2}
                placeholder="选择关联生产订单后自动填入，或手动输入"
                style={{ fontFamily: 'monospace', fontSize: 12 }}
              />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item name="remark" label="备注">
              <Input.TextArea rows={2} placeholder="备注" />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

// ── Main Page ────────────────────────────────────────────────────
const FinishedGoodsReceiptPage: React.FC = () => {
  const [receipts, setReceipts] = useState<FinishedGoodsReceipt[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [newOpen, setNewOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRecord, setDetailRecord] = useState<FinishedGoodsReceipt | null>(null);
  const fetchedRef = useRef(false);

  const loadReceipts = useCallback(async (force = false) => {
    if (fetchedRef.current && !force) return;
    fetchedRef.current = true;
    setLoading(true);
    try {
      const resp = await getReceiptList();
      const apiList: FinishedGoodsReceipt[] = resp?.data ?? [];
      if (apiList.length > 0) {
        setReceipts(apiList);
        saveLocalReceipts(apiList);
      } else {
        setReceipts(loadLocalReceipts());
      }
    } catch {
      setReceipts(loadLocalReceipts());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadReceipts(); }, [loadReceipts]);

  // Confirm receipt (PENDING → RECEIVED)
  const handleReceive = useCallback(async (rec: FinishedGoodsReceipt) => {
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const updated: FinishedGoodsReceipt = { ...rec, status: 'RECEIVED', receiptTime: now };

    // Optimistic UI update
    setReceipts(prev => prev.map(r => r.receiptNo === rec.receiptNo ? updated : r));
    const local = loadLocalReceipts().map(r => r.receiptNo === rec.receiptNo ? updated : r);
    saveLocalReceipts(local);

    // Update UDI record status → BOUND
    if (rec.udiString) {
      const udiList = loadUdiRecords();
      const updatedUdiList = udiList.map(u =>
        u.udiString === rec.udiString
          ? { ...u, status: 'BOUND' as const, receiptNo: rec.receiptNo }
          : u,
      );
      saveUdiRecords(updatedUdiList);

      // Try API
      const matched = udiList.find(u => u.udiString === rec.udiString);
      if (matched?.id) {
        updateUdiRecord(matched.id, { status: 'BOUND', receiptNo: rec.receiptNo }).catch(() => {});
      }
    }

    // Try API for receipt
    if (rec.id) {
      updateReceipt(rec.id, { status: 'RECEIVED', receiptTime: now }).catch(() => {});
    }

    message.success('入库确认成功，UDI状态已更新为「已入库」');
  }, []);

  // Cancel receipt
  const handleCancel = useCallback(async (rec: FinishedGoodsReceipt) => {
    const updated: FinishedGoodsReceipt = { ...rec, status: 'CANCELLED' };
    setReceipts(prev => prev.map(r => r.receiptNo === rec.receiptNo ? updated : r));
    const local = loadLocalReceipts().map(r => r.receiptNo === rec.receiptNo ? updated : r);
    saveLocalReceipts(local);
    if (rec.id) {
      updateReceipt(rec.id, { status: 'CANCELLED' }).catch(() => {});
    }
    message.success('入库单已取消');
  }, []);

  const handleCreated = useCallback((r: FinishedGoodsReceipt) => {
    setReceipts(prev => [r, ...prev]);
  }, []);

  // Summary KPIs
  const summary = {
    total:    receipts.length,
    pending:  receipts.filter(r => r.status === 'PENDING').length,
    received: receipts.filter(r => r.status === 'RECEIVED').length,
    cancelled: receipts.filter(r => r.status === 'CANCELLED').length,
  };

  // Filtered list
  const filtered = receipts.filter(r => {
    const searchLower = searchText.toLowerCase();
    const searchMatch = !searchText
      || r.receiptNo.toLowerCase().includes(searchLower)
      || (r.materialName ?? '').toLowerCase().includes(searchLower)
      || (r.batchNo ?? '').toLowerCase().includes(searchLower)
      || (r.productionOrderNo ?? '').toLowerCase().includes(searchLower);
    const statusMatch = !filterStatus || r.status === filterStatus;
    return searchMatch && statusMatch;
  });

  const columns: ColumnsType<FinishedGoodsReceipt> = [
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      render: (s: string) => {
        const st = STATUS_MAP[s] ?? { label: s, color: 'default' };
        return <Tag color={st.color}>{st.label}</Tag>;
      },
    },
    {
      title: '入库单号',
      dataIndex: 'receiptNo',
      width: 180,
      render: (v: string) => <Text strong style={{ fontSize: 13 }}>{v}</Text>,
    },
    { title: '物料名称', dataIndex: 'materialName', ellipsis: true },
    { title: '批号',     dataIndex: 'batchNo',       width: 130 },
    {
      title: '数量',
      dataIndex: 'qty',
      width: 90,
      render: (v: number, r) => `${v} ${r.unitName ?? ''}`,
    },
    {
      title: 'UDI码',
      dataIndex: 'udiString',
      ellipsis: true,
      render: (v?: string) => v
        ? (
          <Tooltip title={v}>
            <Space>
              <QrcodeOutlined style={{ color: '#52c41a' }} />
              <Text code style={{ fontSize: 11 }}>{v.length > 30 ? v.slice(0, 30) + '…' : v}</Text>
            </Space>
          </Tooltip>
        )
        : <Text type="secondary">—</Text>,
    },
    { title: '关联生产订单', dataIndex: 'productionOrderNo', width: 160 },
    { title: '入库时间',     dataIndex: 'receiptTime',        width: 160,
      render: (v?: string) => v ?? '—' },
    {
      title: '操作',
      width: 160,
      fixed: 'right' as const,
      render: (_: any, record: FinishedGoodsReceipt) => (
        <Space size={4}>
          <Button
            size="small" type="link" icon={<EyeOutlined />}
            onClick={() => { setDetailRecord(record); setDetailOpen(true); }}
          >详情</Button>
          {record.status === 'PENDING' && (
            <Button
              size="small" type="link" icon={<CheckCircleOutlined />}
              style={{ color: '#52c41a' }}
              onClick={() => handleReceive(record)}
            >确认入库</Button>
          )}
          {record.status === 'PENDING' && (
            <Button
              size="small" type="link" danger icon={<StopOutlined />}
              onClick={() => handleCancel(record)}
            >取消</Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '16px 20px', background: '#f5f5f5', minHeight: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a' }}>成品入库管理</div>
        <div style={{ fontSize: 13, color: '#999', marginTop: 4 }}>
          成品生产完成后的入库操作，自动携带生产订单的UDI码
        </div>
      </div>

      {/* KPI Cards */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        {[
          { label: '全部',   value: summary.total,     color: '#1677ff' },
          { label: '待入库', value: summary.pending,   color: '#fa8c16' },
          { label: '已入库', value: summary.received,  color: '#52c41a' },
          { label: '已取消', value: summary.cancelled, color: '#8c8c8c' },
        ].map(item => (
          <Col span={6} key={item.label}>
            <Card size="small" styles={{ body: { padding: '12px 16px' } }}>
              <Statistic
                title={<span style={{ fontSize: 13, color: '#666' }}>{item.label}</span>}
                value={item.value}
                valueStyle={{ color: item.color, fontSize: 24, fontWeight: 700 }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Toolbar */}
      <div style={{
        background: '#fff', borderRadius: 8, padding: '12px 16px',
        marginBottom: 12, display: 'flex', gap: 8, alignItems: 'center',
      }}>
        <Input
          prefix={<SearchOutlined style={{ color: '#bbb' }} />}
          placeholder="搜索入库单号 / 物料名称 / 批号 / 生产订单号"
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          style={{ width: 320 }}
          allowClear
        />
        <Select
          value={filterStatus || undefined}
          onChange={v => setFilterStatus(v ?? '')}
          placeholder="状态筛选"
          allowClear
          style={{ width: 120 }}
        >
          {Object.entries(STATUS_MAP).map(([k, v]) => (
            <Option key={k} value={k}>{v.label}</Option>
          ))}
        </Select>
        <Button icon={<ReloadOutlined />} onClick={() => loadReceipts(true)}>刷新</Button>
        <div style={{ flex: 1 }} />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setNewOpen(true)}
          style={{ background: '#52c41a', borderColor: '#52c41a' }}
        >
          <InboxOutlined /> 新建入库单
        </Button>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 8 }}>
        <Table
          rowKey="receiptNo"
          columns={columns}
          dataSource={filtered}
          loading={loading}
          size="small"
          scroll={{ x: 1200 }}
          pagination={{ pageSize: 15, showSizeChanger: true, showTotal: t => `共 ${t} 条` }}
        />
      </div>

      {/* Modals */}
      <NewReceiptModal open={newOpen} onClose={() => setNewOpen(false)} onCreated={handleCreated} />
      <DetailModal record={detailRecord} open={detailOpen} onClose={() => setDetailOpen(false)} />
    </div>
  );
};

export default FinishedGoodsReceiptPage;

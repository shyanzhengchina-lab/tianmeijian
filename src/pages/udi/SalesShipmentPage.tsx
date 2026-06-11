/**
 * 销售出库页面
 * ================================================================
 * 功能：
 *  1. 列表展示销售出库单
 *  2. 新建出库单时支持扫码/手动输入 UDI
 *  3. UDI 扫码验证：解析 UDI → 比对入库记录 → 标记 scanVerified
 *  4. 确认出库后将 UDI 记录状态更新为 SHIPPED
 * ================================================================
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Table, Button, Input, Select, Space, Tag, Modal, Form,
  InputNumber, message, Tooltip, Row, Col, Descriptions,
  Typography, Card, Statistic, Alert, Badge,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined, SearchOutlined, ReloadOutlined,
  CheckCircleOutlined, StopOutlined, EyeOutlined,
  SendOutlined, QrcodeOutlined, ScanOutlined, CopyOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import {
  getShipmentList, createShipment, updateShipment,
  updateUdiRecord,
} from '../../api/udi';
import type { SalesShipment, UdiRecord } from '../../api/udi';
import {
  parseUdiString, loadUdiRecords, saveUdiRecords,
} from './udiUtils';

const { Text } = Typography;
const { Option } = Select;

// ── localStorage fallback ────────────────────────────────────────
const LS_SHIPMENTS = 'sales_shipments';

function loadLocalShipments(): SalesShipment[] {
  try {
    const s = localStorage.getItem(LS_SHIPMENTS);
    return s ? JSON.parse(s) : [];
  } catch { return []; }
}
function saveLocalShipments(list: SalesShipment[]): void {
  localStorage.setItem(LS_SHIPMENTS, JSON.stringify(list));
}

// ── Auto-generate shipment number ───────────────────────────────
function genShipmentNo(): string {
  const now = new Date();
  const ymd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const seq = String(Math.floor(Math.random() * 900) + 100);
  return `SS-${ymd}-${seq}`;
}

// ── Status mapping ───────────────────────────────────────────────
const STATUS_MAP: Record<string, { label: string; color: string }> = {
  DRAFT:     { label: '草稿',   color: 'default' },
  SHIPPED:   { label: '已出库', color: 'green'   },
  CANCELLED: { label: '已取消', color: 'red'     },
};

// ── UDI Scan Verifier Component ──────────────────────────────────
interface UdiScanResult {
  udiString: string;
  verified: boolean;
  matchedRecord?: UdiRecord;
  error?: string;
  components?: ReturnType<typeof parseUdiString>;
}

const UdiScanInput: React.FC<{
  value?: string;
  onChange?: (v: string) => void;
  onVerified?: (result: UdiScanResult) => void;
}> = ({ value, onChange, onVerified }) => {
  const [scanResult, setScanResult] = useState<UdiScanResult | null>(null);
  const [verifying, setVerifying] = useState(false);

  const handleScan = useCallback(async (input: string) => {
    if (!input.trim()) {
      setScanResult(null);
      return;
    }
    setVerifying(true);
    try {
      const components = parseUdiString(input.trim());
      if (!components || !components.gtin) {
        const result: UdiScanResult = {
          udiString: input,
          verified: false,
          error: 'UDI格式不正确，无法解析',
          components: components ?? undefined,
        };
        setScanResult(result);
        onVerified?.(result);
        return;
      }

      // Match against local UDI records
      const udiList = loadUdiRecords();
      const matched = udiList.find(u =>
        u.udiString === input.trim() ||
        (u.gtin === components.gtin && u.batchNo === components.batchNo),
      );

      if (!matched) {
        const result: UdiScanResult = {
          udiString: input,
          verified: false,
          components,
          error: '未找到匹配的UDI入库记录，请确认产品已入库',
        };
        setScanResult(result);
        onVerified?.(result);
        return;
      }

      if (matched.status === 'SHIPPED') {
        const result: UdiScanResult = {
          udiString: input,
          verified: false,
          components,
          matchedRecord: matched,
          error: '该UDI已出库，不能重复出库',
        };
        setScanResult(result);
        onVerified?.(result);
        return;
      }

      const result: UdiScanResult = {
        udiString: input,
        verified: true,
        components,
        matchedRecord: matched,
      };
      setScanResult(result);
      onVerified?.(result);
    } finally {
      setVerifying(false);
    }
  }, [onVerified]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e.target.value);
  };

  const handlePressEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const v = (e.target as HTMLInputElement).value;
    handleScan(v);
  };

  const handleVerifyClick = () => {
    handleScan(value ?? '');
  };

  return (
    <div>
      <Input
        value={value}
        onChange={handleChange}
        onPressEnter={handlePressEnter}
        placeholder="扫描或输入UDI码，按回车验证"
        prefix={<ScanOutlined style={{ color: '#52c41a' }} />}
        suffix={
          <Button size="small" type="link" loading={verifying} onClick={handleVerifyClick}>
            验证
          </Button>
        }
        style={{ fontFamily: 'monospace', fontSize: 12 }}
      />
      {scanResult && (
        <div style={{ marginTop: 6 }}>
          {scanResult.verified ? (
            <Alert
              type="success"
              icon={<CheckCircleOutlined />}
              showIcon
              message={
                <Space>
                  <Text strong style={{ color: '#52c41a' }}>验证通过</Text>
                  {scanResult.matchedRecord && (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      批号：{scanResult.matchedRecord.batchNo}　
                      物料：{scanResult.matchedRecord.materialName}
                    </Text>
                  )}
                </Space>
              }
              style={{ padding: '4px 8px' }}
            />
          ) : (
            <Alert
              type="error"
              icon={<WarningOutlined />}
              showIcon
              message={<Text style={{ fontSize: 12 }}>{scanResult.error}</Text>}
              style={{ padding: '4px 8px' }}
            />
          )}
          {scanResult.components && (
            <div style={{
              marginTop: 4, fontSize: 11, color: '#666',
              background: '#fafafa', padding: '4px 8px', borderRadius: 4,
            }}>
              GTIN: {scanResult.components.gtin ?? '—'} ｜
              批号: {scanResult.components.batchNo ?? '—'} ｜
              生产日期: {scanResult.components.productionDate ?? '—'} ｜
              有效期: {scanResult.components.expiryDate ?? '—'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── Detail Modal ─────────────────────────────────────────────────
const DetailModal: React.FC<{
  record: SalesShipment | null;
  open: boolean;
  onClose: () => void;
}> = ({ record, open, onClose }) => {
  if (!record) return null;
  const st = STATUS_MAP[record.status] ?? { label: record.status, color: 'default' };
  return (
    <Modal
      title="出库单详情"
      open={open}
      onCancel={onClose}
      footer={<Button onClick={onClose}>关闭</Button>}
      width={640}
    >
      <Descriptions bordered column={2} size="small" style={{ marginTop: 12 }}>
        <Descriptions.Item label="出库单号" span={2}><Text strong>{record.shipmentNo}</Text></Descriptions.Item>
        <Descriptions.Item label="状态">
          <Tag color={st.color}>{st.label}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="出库时间">{record.shipmentTime ?? '—'}</Descriptions.Item>
        <Descriptions.Item label="客户名称">{record.customerName ?? '—'}</Descriptions.Item>
        <Descriptions.Item label="客户编码">{record.customerCode ?? '—'}</Descriptions.Item>
        <Descriptions.Item label="物料编码">{record.materialCode ?? '—'}</Descriptions.Item>
        <Descriptions.Item label="物料名称">{record.materialName ?? '—'}</Descriptions.Item>
        <Descriptions.Item label="规格型号">{record.spec ?? '—'}</Descriptions.Item>
        <Descriptions.Item label="数量">{record.qty} {record.unitName ?? ''}</Descriptions.Item>
        <Descriptions.Item label="批号">{record.batchNo ?? '—'}</Descriptions.Item>
        <Descriptions.Item label="仓库">{record.warehouseCode ?? '—'}</Descriptions.Item>
        <Descriptions.Item label="扫码验证">
          {record.scanVerified
            ? <Badge status="success" text="已验证" />
            : <Badge status="warning" text="未验证" />}
        </Descriptions.Item>
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
        {record.diCode && (
          <Descriptions.Item label="DI编码">{record.diCode}</Descriptions.Item>
        )}
        {record.piString && (
          <Descriptions.Item label="PI信息">{record.piString}</Descriptions.Item>
        )}
        <Descriptions.Item label="备注" span={2}>{record.remark ?? '—'}</Descriptions.Item>
      </Descriptions>
    </Modal>
  );
};

// ── New Shipment Modal ───────────────────────────────────────────
const NewShipmentModal: React.FC<{
  open: boolean;
  onClose: () => void;
  onCreated: (r: SalesShipment) => void;
}> = ({ open, onClose, onCreated }) => {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [scanVerified, setScanVerified] = useState(false);
  const [scanMatchedRecord, setScanMatchedRecord] = useState<UdiRecord | null>(null);
  const [previewNo] = useState(genShipmentNo);

  useEffect(() => {
    if (open) {
      form.resetFields();
      form.setFieldsValue({ shipmentNo: previewNo });
      setScanVerified(false);
      setScanMatchedRecord(null);
    }
  }, [open, form, previewNo]);

  const handleUdiVerified = useCallback((result: UdiScanResult) => {
    setScanVerified(result.verified);
    setScanMatchedRecord(result.matchedRecord ?? null);
    if (result.verified && result.matchedRecord) {
      const r = result.matchedRecord;
      form.setFieldsValue({
        materialCode: r.materialCode ?? form.getFieldValue('materialCode'),
        materialName: r.materialName ?? form.getFieldValue('materialName'),
        batchNo: r.batchNo ?? form.getFieldValue('batchNo'),
        qty: r.qty ?? form.getFieldValue('qty'),
        diCode: r.diCode,
        piString: r.piString,
      });
      message.success('UDI验证通过，物料信息已自动填充');
    }
  }, [form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
      const shipment: SalesShipment = {
        ...values,
        scanVerified,
        status: 'DRAFT' as const,
        createTime: now,
      };

      let saved: SalesShipment = shipment;
      try {
        const resp = await createShipment(shipment);
        if (resp?.data) saved = { ...shipment, ...resp.data };
      } catch {
        saved = { ...shipment, id: Date.now() };
      }

      const localList = loadLocalShipments();
      saveLocalShipments([...localList, saved]);

      message.success('出库单已创建');
      onCreated(saved);
      onClose();
    } catch (e: any) {
      if (e?.errorFields) return;
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
            background: '#1677ff', borderRadius: 2,
            marginRight: 8, verticalAlign: 'middle',
          }} />
          新建销售出库单
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
            <Form.Item name="shipmentNo" label="出库单号" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="customerName" label="客户名称" rules={[{ required: true, message: '请输入客户名称' }]}>
              <Input placeholder="客户名称" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="customerCode" label="客户编码">
              <Input placeholder="客户编码" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="warehouseCode" label="出库仓库">
              <Input placeholder="仓库编码" />
            </Form.Item>
          </Col>

          {/* UDI Scan */}
          <Col span={24}>
            <Form.Item
              name="udiString"
              label={
                <Space>
                  <QrcodeOutlined />
                  UDI扫码验证
                  {scanVerified && <Tag color="success">已验证</Tag>}
                </Space>
              }
            >
              <Form.Item name="udiString" noStyle>
                {({ value, onChange }: any) => (
                  <UdiScanInput
                    value={value}
                    onChange={onChange}
                    onVerified={handleUdiVerified}
                  />
                )}
              </Form.Item>
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item name="materialCode" label="物料编码">
              <Input placeholder="物料编码（扫码后自动填充）" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="materialName" label="物料名称" rules={[{ required: true, message: '请输入物料名称' }]}>
              <Input placeholder="物料名称" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="qty" label="出库数量" rules={[{ required: true, message: '请输入数量' }]}>
              <InputNumber min={0.001} precision={3} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="unitName" label="单位">
              <Input placeholder="单位" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="batchNo" label="批号">
              <Input placeholder="批号（扫码后自动填充）" />
            </Form.Item>
          </Col>
          <Col span={0} style={{ display: 'none' }}>
            <Form.Item name="diCode"><Input /></Form.Item>
            <Form.Item name="piString"><Input /></Form.Item>
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
const SalesShipmentPage: React.FC = () => {
  const [shipments, setShipments] = useState<SalesShipment[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [newOpen, setNewOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRecord, setDetailRecord] = useState<SalesShipment | null>(null);
  const fetchedRef = useRef(false);

  const loadShipments = useCallback(async (force = false) => {
    if (fetchedRef.current && !force) return;
    fetchedRef.current = true;
    setLoading(true);
    try {
      const resp = await getShipmentList();
      const apiList: SalesShipment[] = resp?.data ?? [];
      if (apiList.length > 0) {
        setShipments(apiList);
        saveLocalShipments(apiList);
      } else {
        setShipments(loadLocalShipments());
      }
    } catch {
      setShipments(loadLocalShipments());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadShipments(); }, [loadShipments]);

  // Confirm shipment (DRAFT → SHIPPED)
  const handleShip = useCallback(async (rec: SalesShipment) => {
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const updated: SalesShipment = { ...rec, status: 'SHIPPED', shipmentTime: now };

    setShipments(prev => prev.map(s => s.shipmentNo === rec.shipmentNo ? updated : s));
    const local = loadLocalShipments().map(s => s.shipmentNo === rec.shipmentNo ? updated : s);
    saveLocalShipments(local);

    // Update UDI record status → SHIPPED
    if (rec.udiString) {
      const udiList = loadUdiRecords();
      const updatedUdiList = udiList.map(u =>
        u.udiString === rec.udiString
          ? { ...u, status: 'SHIPPED' as const, shipmentNo: rec.shipmentNo }
          : u,
      );
      saveUdiRecords(updatedUdiList);

      const matched = udiList.find(u => u.udiString === rec.udiString);
      if (matched?.id) {
        updateUdiRecord(matched.id, { status: 'SHIPPED', shipmentNo: rec.shipmentNo }).catch(() => {});
      }
    }

    if (rec.id) {
      updateShipment(rec.id, { status: 'SHIPPED', shipmentTime: now }).catch(() => {});
    }

    message.success('出库确认成功，UDI状态已更新为「已出库」');
  }, []);

  // Cancel shipment
  const handleCancel = useCallback(async (rec: SalesShipment) => {
    const updated: SalesShipment = { ...rec, status: 'CANCELLED' };
    setShipments(prev => prev.map(s => s.shipmentNo === rec.shipmentNo ? updated : s));
    const local = loadLocalShipments().map(s => s.shipmentNo === rec.shipmentNo ? updated : s);
    saveLocalShipments(local);
    if (rec.id) {
      updateShipment(rec.id, { status: 'CANCELLED' }).catch(() => {});
    }
    message.success('出库单已取消');
  }, []);

  const handleCreated = useCallback((r: SalesShipment) => {
    setShipments(prev => [r, ...prev]);
  }, []);

  const summary = {
    total:    shipments.length,
    draft:    shipments.filter(s => s.status === 'DRAFT').length,
    shipped:  shipments.filter(s => s.status === 'SHIPPED').length,
    verified: shipments.filter(s => s.scanVerified).length,
  };

  const filtered = shipments.filter(s => {
    const lower = searchText.toLowerCase();
    const searchMatch = !searchText
      || s.shipmentNo.toLowerCase().includes(lower)
      || (s.customerName ?? '').toLowerCase().includes(lower)
      || (s.materialName ?? '').toLowerCase().includes(lower)
      || (s.batchNo ?? '').toLowerCase().includes(lower);
    const statusMatch = !filterStatus || s.status === filterStatus;
    return searchMatch && statusMatch;
  });

  const columns: ColumnsType<SalesShipment> = [
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
      title: '出库单号',
      dataIndex: 'shipmentNo',
      width: 170,
      render: (v: string) => <Text strong style={{ fontSize: 13 }}>{v}</Text>,
    },
    { title: '客户名称', dataIndex: 'customerName', width: 140, ellipsis: true },
    { title: '物料名称', dataIndex: 'materialName', ellipsis: true },
    { title: '批号',     dataIndex: 'batchNo',       width: 120 },
    {
      title: '数量',
      dataIndex: 'qty',
      width: 90,
      render: (v: number, r) => `${v} ${r.unitName ?? ''}`,
    },
    {
      title: 'UDI验证',
      dataIndex: 'scanVerified',
      width: 100,
      render: (v?: boolean) => v
        ? <Badge status="success" text="已验证" />
        : <Badge status="default" text="未验证" />,
    },
    {
      title: 'UDI码',
      dataIndex: 'udiString',
      ellipsis: true,
      render: (v?: string) => v
        ? (
          <Tooltip title={v}>
            <Space>
              <QrcodeOutlined style={{ color: '#1677ff' }} />
              <Text code style={{ fontSize: 11 }}>{v.length > 28 ? v.slice(0, 28) + '…' : v}</Text>
            </Space>
          </Tooltip>
        )
        : <Text type="secondary">—</Text>,
    },
    {
      title: '出库时间',
      dataIndex: 'shipmentTime',
      width: 150,
      render: (v?: string) => v ?? '—',
    },
    {
      title: '操作',
      width: 160,
      fixed: 'right' as const,
      render: (_: any, record: SalesShipment) => (
        <Space size={4}>
          <Button
            size="small" type="link" icon={<EyeOutlined />}
            onClick={() => { setDetailRecord(record); setDetailOpen(true); }}
          >详情</Button>
          {record.status === 'DRAFT' && (
            <Button
              size="small" type="link" icon={<SendOutlined />}
              style={{ color: '#1677ff' }}
              onClick={() => handleShip(record)}
            >确认出库</Button>
          )}
          {record.status === 'DRAFT' && (
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
        <div style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a' }}>销售出库管理</div>
        <div style={{ fontSize: 13, color: '#999', marginTop: 4 }}>
          销售发货时扫描UDI码验证，确保出库物料可追溯
        </div>
      </div>

      {/* KPI Cards */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        {[
          { label: '全部',   value: summary.total,    color: '#1677ff' },
          { label: '草稿',   value: summary.draft,    color: '#fa8c16' },
          { label: '已出库', value: summary.shipped,  color: '#52c41a' },
          { label: 'UDI已验证', value: summary.verified, color: '#722ed1' },
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
          placeholder="搜索出库单号 / 客户名称 / 物料名称 / 批号"
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          style={{ width: 340 }}
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
        <Button icon={<ReloadOutlined />} onClick={() => loadShipments(true)}>刷新</Button>
        <div style={{ flex: 1 }} />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setNewOpen(true)}
        >
          <SendOutlined /> 新建出库单
        </Button>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 8 }}>
        <Table
          rowKey="shipmentNo"
          columns={columns}
          dataSource={filtered}
          loading={loading}
          size="small"
          scroll={{ x: 1300 }}
          pagination={{ pageSize: 15, showSizeChanger: true, showTotal: t => `共 ${t} 条` }}
        />
      </div>

      {/* Modals */}
      <NewShipmentModal open={newOpen} onClose={() => setNewOpen(false)} onCreated={handleCreated} />
      <DetailModal record={detailRecord} open={detailOpen} onClose={() => setDetailOpen(false)} />
    </div>
  );
};

export default SalesShipmentPage;

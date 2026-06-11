/**
 * UDI 管理页面
 * ================================================================
 * 功能：
 *   1. 从生产订单生成 UDI 码
 *   2. 查看 / 打印 UDI 列表
 *   3. 打印标签（模拟打印窗口，含二维码文字展示）
 *   4. 状态追踪：已生成 → 已打印 → 已入库 → 已出库
 * ================================================================
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Table, Button, Input, Select, Tag, Space, Modal, message, Card,
  Tooltip, Descriptions, Divider, Typography, Badge, Alert, Form,
  DatePicker, InputNumber, Spin,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  QrcodeOutlined, PrinterOutlined, PlusOutlined, ReloadOutlined,
  SearchOutlined, EyeOutlined, CopyOutlined, CheckOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { UdiRecord } from '../../api/udi';
import { getUdiList, createUdiRecord, updateUdiRecord } from '../../api/udi';
import {
  loadUdiRecords, saveUdiRecords, loadPiRule, loadDiMap,
  generateUdiRecord, parseUdiString,
} from './udiUtils';
import { getProductionOrderList } from '../../api/productionOrders';

const { Text } = Typography;
const { Option } = Select;

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  GENERATED: { label: '已生成', color: 'default' },
  PRINTED:   { label: '已打印', color: 'blue' },
  BOUND:     { label: '已入库', color: 'green' },
  SHIPPED:   { label: '已出库', color: 'purple' },
};

// ── UDI 打印卡片 ──────────────────────────────────────────────────
const UdiPrintCard: React.FC<{ record: UdiRecord }> = ({ record }) => {
  const parsed = parseUdiString(record.udiString);
  return (
    <div style={{
      border: '2px solid #333', borderRadius: 8, padding: '16px 20px',
      width: 340, background: '#fff', fontFamily: 'monospace',
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    }}>
      <div style={{ textAlign: 'center', marginBottom: 10 }}>
        <div style={{ fontSize: 11, color: '#667085', letterSpacing: 1 }}>UNIQUE DEVICE IDENTIFIER</div>
        <div style={{ fontSize: 13, fontWeight: 800, color: '#1d2939' }}>
          {record.materialName}
        </div>
      </div>
      {/* 模拟 DataMatrix / QR 码区域 */}
      <div style={{
        width: 80, height: 80, margin: '0 auto 12px',
        background: 'linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000) 0 0 / 8px 8px',
        border: '2px solid #000', borderRadius: 4, position: 'relative',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <QrcodeOutlined style={{ fontSize: 48, color: 'rgba(0,0,0,0.6)' }} />
      </div>
      <div style={{ fontSize: 10, color: '#333', lineHeight: 1.8 }}>
        <div><b>UDI:</b></div>
        <div style={{ fontSize: 9, wordBreak: 'break-all', background: '#f5f5f5', padding: '4px 6px', borderRadius: 4 }}>
          {record.udiString}
        </div>
      </div>
      <Divider style={{ margin: '10px 0' }} />
      <div style={{ fontSize: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
        <div><b>GTIN:</b> {parsed?.gtin}</div>
        <div><b>批号:</b> {record.batchNo}</div>
        {parsed?.productionDate && <div><b>生产日期:</b> {parsed.productionDate}</div>}
        {parsed?.expiryDate    && <div><b>有效期至:</b> {parsed.expiryDate}</div>}
        {record.qty > 0        && <div><b>数量:</b> {record.qty}</div>}
        {record.productionOrderNo && <div style={{ gridColumn: 'span 2' }}><b>生产订单:</b> {record.productionOrderNo}</div>}
      </div>
    </div>
  );
};

// ── 生成 UDI 弹窗 ─────────────────────────────────────────────────
const GenerateUdiModal: React.FC<{
  open: boolean;
  onClose: () => void;
  onGenerated: (records: UdiRecord[]) => void;
}> = ({ open, onClose, onGenerated }) => {
  const [form] = Form.useForm();
  const [poOptions, setPoOptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasDi, setHasDi] = useState(true);

  useEffect(() => {
    if (!open) return;
    getProductionOrderList().then((resp: any) => {
      const pos: any[] = resp?.data ?? [];
      setPoOptions(pos.map(p => ({
        value: p.id,
        label: `${p.orderNo} — ${p.customerName ?? p.materialName ?? ''}`,
        orderNo: p.orderNo,
        materialCode: p.materialCode ?? '',
        materialName: p.customerName ?? p.materialName ?? '',
        totalQuantity: p.totalQuantity ?? 0,
      })));
    }).catch(() => setPoOptions([]));
  }, [open]);

  const handlePoChange = (val: number) => {
    const po = poOptions.find(p => p.value === val);
    if (!po) return;
    form.setFieldsValue({
      batchNo: `YS-${dayjs().format('YYYYMMDD')}-001`,
      qty: po.totalQuantity || 1,
      productionDate: dayjs(),
    });
    // Check DI config
    const diMap = loadDiMap();
    const hasDiConfig = Object.values(diMap).some(d => d.materialCode === po.materialCode);
    setHasDi(hasDiConfig || Object.keys(diMap).length > 0);
  };

  const handleOk = async () => {
    const vals = await form.validateFields();
    setLoading(true);
    try {
      const diMap = loadDiMap();
      const po = poOptions.find(p => p.value === vals.productionOrderId);
      const diList = Object.values(diMap);

      if (diList.length === 0) {
        message.warning('未找到DI配置，请先在「UDI设置」中配置物料DI');
        setLoading(false);
        return;
      }

      const di = diList.find(d => d.materialCode === po?.materialCode) ?? diList[0];
      const rule = loadPiRule();

      const udiRec = generateUdiRecord({
        di,
        rule,
        batchNo: vals.batchNo,
        qty: vals.qty,
        productionDate: vals.productionDate?.toDate() ?? new Date(),
        productionOrderNo: po?.orderNo,
        productionOrderId: vals.productionOrderId,
        materialCode: po?.materialCode ?? di.materialCode,
        materialName: po?.materialName ?? di.materialName,
      });

      // Save to API and localStorage
      try { await createUdiRecord(udiRec); } catch { /* API not ready */ }
      const existing = loadUdiRecords();
      const newRec = { ...udiRec, id: Date.now() };
      saveUdiRecords([newRec, ...existing]);

      message.success('UDI 码已生成');
      onGenerated([newRec]);
      onClose();
      form.resetFields();
    } finally { setLoading(false); }
  };

  return (
    <Modal
      open={open}
      title={<span><QrcodeOutlined style={{ marginRight: 8, color: '#1677ff' }} />从生产订单生成 UDI</span>}
      onCancel={onClose}
      onOk={handleOk}
      okText="生成 UDI"
      cancelText="取消"
      width={560}
      confirmLoading={loading}
      destroyOnClose
    >
      {!hasDi && (
        <Alert type="warning" showIcon
          message="未找到匹配的DI配置，请先在「UDI设置 → 物料DI配置」中为该物料配置GTIN"
          style={{ marginBottom: 16 }}
        />
      )}
      <Form form={form} layout="vertical">
        <Form.Item name="productionOrderId" label="选择生产订单" rules={[{ required: true }]}>
          <Select
            showSearch optionFilterProp="label"
            placeholder="搜索订单号…"
            options={poOptions}
            onChange={handlePoChange}
          />
        </Form.Item>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
          <Form.Item name="batchNo" label="批号" rules={[{ required: true }]}>
            <Input placeholder="YS-20260601-001" />
          </Form.Item>
          <Form.Item name="qty" label="数量（支）" rules={[{ required: true }]}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
        </div>
        <Form.Item name="productionDate" label="生产日期" rules={[{ required: true }]}>
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

// ── 主页面 ────────────────────────────────────────────────────────
const UdiPage: React.FC = () => {
  const [list, setList]           = useState<UdiRecord[]>([]);
  const [loading, setLoading]     = useState(false);
  const [search, setSearch]       = useState('');
  const [filterStatus, setFilter] = useState('ALL');
  const [genOpen, setGenOpen]     = useState(false);
  const [printRec, setPrintRec]   = useState<UdiRecord | null>(null);
  const [detailRec, setDetailRec] = useState<UdiRecord | null>(null);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await getUdiList();
      const apiData: UdiRecord[] = resp?.data ?? [];
      if (apiData.length > 0) {
        setList(apiData);
      } else {
        setList(loadUdiRecords());
      }
    } catch {
      setList(loadUdiRecords());
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadList(); }, [loadList]);

  const handlePrint = async (r: UdiRecord) => {
    setPrintRec(r);
    // Mark as printed
    const updated = { ...r, status: 'PRINTED' as const, printCount: (r.printCount ?? 0) + 1, lastPrintTime: new Date().toLocaleString('zh-CN') };
    try { if (r.id) await updateUdiRecord(Number(r.id), { status: 'PRINTED', printCount: updated.printCount }); } catch { /* ignore */ }
    const records = loadUdiRecords();
    const newList = records.map(x => x.udiString === r.udiString ? updated : x);
    saveUdiRecords(newList);
    setList(prev => prev.map(x => x.udiString === r.udiString ? updated : x));
  };

  const handleDoPrint = () => {
    window.print();
    message.success('已发送打印指令');
    setPrintRec(null);
  };

  const filtered = list.filter(r => {
    const matchSearch = !search ||
      r.udiString.includes(search) ||
      r.batchNo.includes(search) ||
      (r.productionOrderNo || '').includes(search) ||
      (r.materialCode || '').includes(search) ||
      (r.materialName || '').includes(search);
    const matchStatus = filterStatus === 'ALL' || r.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const columns: ColumnsType<UdiRecord> = [
    {
      title: '状态', dataIndex: 'status', width: 90, fixed: 'left',
      render: v => {
        const s = STATUS_MAP[v] ?? { label: v, color: 'default' };
        return <Badge status={v === 'BOUND' ? 'success' : v === 'SHIPPED' ? 'processing' : 'default'} text={<Tag color={s.color}>{s.label}</Tag>} />;
      },
    },
    { title: '物料名称', dataIndex: 'materialName', width: 130 },
    { title: '批号', dataIndex: 'batchNo', width: 160, render: v => <Text code style={{ fontSize: 11 }}>{v}</Text> },
    {
      title: 'UDI 字符串', dataIndex: 'udiString', width: 300, ellipsis: true,
      render: (v: string) => (
        <Tooltip title={v}>
          <Text code style={{ fontSize: 10 }}>{v.slice(0, 60)}{v.length > 60 ? '…' : ''}</Text>
        </Tooltip>
      ),
    },
    { title: '生产日期', dataIndex: 'productionDate', width: 90, render: v => v ? `20${v.slice(0,2)}-${v.slice(2,4)}-${v.slice(4,6)}` : '-' },
    { title: '有效期', dataIndex: 'expiryDate', width: 90, render: v => v ? `20${v.slice(0,2)}-${v.slice(2,4)}-${v.slice(4,6)}` : '-' },
    { title: '数量', dataIndex: 'qty', width: 70, align: 'right' },
    { title: '生产订单', dataIndex: 'productionOrderNo', width: 150 },
    { title: '打印次数', dataIndex: 'printCount', width: 80, align: 'center', render: v => v ?? 0 },
    {
      title: '操作', width: 140, fixed: 'right',
      render: (_, r) => (
        <Space size={4}>
          <Tooltip title="查看详情">
            <Button size="small" type="text" icon={<EyeOutlined />} onClick={() => setDetailRec(r)} />
          </Tooltip>
          <Tooltip title="复制UDI">
            <Button size="small" type="text" icon={<CopyOutlined />}
              onClick={() => { navigator.clipboard?.writeText(r.udiString); message.success('已复制'); }} />
          </Tooltip>
          <Tooltip title="打印标签">
            <Button size="small" type="primary" ghost icon={<PrinterOutlined />} onClick={() => handlePrint(r)}>打印</Button>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '16px 20px', background: '#f5f7fa', minHeight: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <QrcodeOutlined style={{ fontSize: 22, color: '#1677ff' }} />
        <span style={{ fontSize: 18, fontWeight: 700 }}>UDI 码管理</span>
        <Tag color="blue">全程追溯</Tag>
        <span style={{ fontSize: 12, color: '#98a2b3' }}>生成 · 打印 · 入库绑定 · 出库核验</span>
      </div>

      {/* KPI */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        {Object.entries(STATUS_MAP).map(([k, v]) => {
          const cnt = list.filter(r => r.status === k).length;
          return (
            <Card key={k} size="small" style={{ flex: 1, textAlign: 'center', cursor: 'pointer', border: filterStatus === k ? '1.5px solid #1677ff' : undefined }}
              onClick={() => setFilter(prev => prev === k ? 'ALL' : k)}>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#1677ff' }}>{cnt}</div>
              <div style={{ fontSize: 12, color: '#667085' }}>{v.label}</div>
            </Card>
          );
        })}
        <Card size="small" style={{ flex: 1, textAlign: 'center', cursor: 'pointer', border: filterStatus === 'ALL' ? '1.5px solid #1677ff' : undefined }}
          onClick={() => setFilter('ALL')}>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#1d2939' }}>{list.length}</div>
          <div style={{ fontSize: 12, color: '#667085' }}>全部</div>
        </Card>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
        <Input prefix={<SearchOutlined />} placeholder="搜索UDI / 批号 / 订单号 / 物料…"
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ width: 320 }} allowClear />
        <Select value={filterStatus} onChange={setFilter} style={{ width: 120 }}>
          <Option value="ALL">全部状态</Option>
          {Object.entries(STATUS_MAP).map(([k, v]) => <Option key={k} value={k}>{v.label}</Option>)}
        </Select>
        <Button icon={<ReloadOutlined />} onClick={loadList} loading={loading}>刷新</Button>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setGenOpen(true)}>生成 UDI</Button>
      </div>

      {/* Table */}
      <Card>
        <Spin spinning={loading}>
          <Table
            dataSource={filtered}
            columns={columns}
            rowKey={r => r.udiString}
            size="small"
            scroll={{ x: 1200 }}
            pagination={{ pageSize: 15, showTotal: t => `共 ${t} 条` }}
          />
        </Spin>
      </Card>

      {/* Generate modal */}
      <GenerateUdiModal open={genOpen} onClose={() => setGenOpen(false)}
        onGenerated={newRecs => setList(prev => [...newRecs, ...prev])} />

      {/* Detail modal */}
      <Modal
        open={!!detailRec}
        title={<span><FileTextOutlined style={{ marginRight: 8 }} />UDI 详情</span>}
        onCancel={() => setDetailRec(null)}
        footer={[
          <Button key="print" type="primary" icon={<PrinterOutlined />}
            onClick={() => { if (detailRec) { handlePrint(detailRec); setDetailRec(null); } }}>
            打印标签
          </Button>,
          <Button key="close" onClick={() => setDetailRec(null)}>关闭</Button>,
        ]}
        width={600}
      >
        {detailRec && (
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="状态" span={2}>
              <Tag color={STATUS_MAP[detailRec.status]?.color}>{STATUS_MAP[detailRec.status]?.label}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="UDI字符串" span={2}>
              <Text code copyable style={{ fontSize: 11, wordBreak: 'break-all' }}>{detailRec.udiString}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="GTIN">{detailRec.gtin}</Descriptions.Item>
            <Descriptions.Item label="DI编码">{detailRec.diCode}</Descriptions.Item>
            <Descriptions.Item label="批号">{detailRec.batchNo}</Descriptions.Item>
            <Descriptions.Item label="数量">{detailRec.qty}</Descriptions.Item>
            <Descriptions.Item label="生产日期">{detailRec.productionDate}</Descriptions.Item>
            <Descriptions.Item label="有效期">{detailRec.expiryDate}</Descriptions.Item>
            <Descriptions.Item label="物料编码">{detailRec.materialCode}</Descriptions.Item>
            <Descriptions.Item label="物料名称">{detailRec.materialName}</Descriptions.Item>
            <Descriptions.Item label="生产订单" span={2}>{detailRec.productionOrderNo ?? '-'}</Descriptions.Item>
            <Descriptions.Item label="入库单">{detailRec.receiptNo ?? '-'}</Descriptions.Item>
            <Descriptions.Item label="出库单">{detailRec.shipmentNo ?? '-'}</Descriptions.Item>
            <Descriptions.Item label="打印次数">{detailRec.printCount ?? 0}</Descriptions.Item>
            <Descriptions.Item label="最后打印">{detailRec.lastPrintTime ?? '-'}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      {/* Print preview modal */}
      <Modal
        open={!!printRec}
        title={<span><PrinterOutlined style={{ marginRight: 8 }} />打印 UDI 标签</span>}
        onCancel={() => setPrintRec(null)}
        footer={[
          <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={handleDoPrint}>发送打印机</Button>,
          <Button key="close" onClick={() => setPrintRec(null)}>取消</Button>,
        ]}
        width={420}
        centered
      >
        {printRec && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0' }}>
            <UdiPrintCard record={printRec} />
          </div>
        )}
        <div style={{ textAlign: 'center', color: '#98a2b3', fontSize: 12, marginTop: 8 }}>
          <CheckOutlined style={{ color: '#52c41a', marginRight: 4 }} />
          实际生产中将由标签打印机输出 DataMatrix / QR 二维码标签
        </div>
      </Modal>
    </div>
  );
};

export default UdiPage;

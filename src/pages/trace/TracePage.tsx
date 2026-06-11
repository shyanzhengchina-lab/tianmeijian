/**
 * 追溯管理页面 - 正向/逆向追溯 + 条码查询
 * 从真实后端 API 获取数据
 */
import React, { useState } from 'react';
import {
  Card, Row, Col, Input, Button, Tabs, Table, Tag, Timeline,
  Descriptions, Spin, Alert, Select, Steps, Empty, Space, Statistic, Divider
} from 'antd';
import {
  SearchOutlined, NodeIndexOutlined, ApartmentOutlined,
  QrcodeOutlined, CheckCircleOutlined, ClockCircleOutlined,
  ExperimentOutlined, BoxPlotOutlined, ShoppingOutlined,
} from '@ant-design/icons';
import axios from 'axios';

const { Search } = Input;
const { Option } = Select;

interface TraceResult {
  workOrder?: any;
  materials?: any[];
  inspections?: any[];
  batchRecords?: any[];
  rootLot?: any;
  traceTree?: any[];
}

const statusMap: Record<string, { color: string; text: string }> = {
  '1': { color: 'default', text: '待检验' },
  '2': { color: 'processing', text: '检验中' },
  '3': { color: 'success', text: '合格' },
  '4': { color: 'error', text: '不合格' },
  '5': { color: 'warning', text: '待复检' },
};

const woStatusMap: Record<number, { color: string; text: string }> = {
  1: { color: 'default', text: '待生产' },
  2: { color: 'processing', text: '计划中' },
  3: { color: 'blue', text: '生产中' },
  4: { color: 'warning', text: '暂停' },
  5: { color: 'success', text: '已完工' },
  6: { color: 'error', text: '已关闭' },
};

const TracePage: React.FC<{ subPage?: string }> = ({ subPage = 'trace-backward' }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TraceResult | null>(null);
  const [error, setError] = useState<string>('');
  const [searchVal, setSearchVal] = useState('');
  const [activeTab, setActiveTab] = useState(subPage === 'trace-forward' ? 'forward' : subPage === 'trace-barcode' ? 'barcode' : 'backward');

  const token = localStorage.getItem('mes_token') || localStorage.getItem('auth_token') || '';
  const headers = { Authorization: `Bearer ${token}` };

  const handleBackwardSearch = async (value: string) => {
    if (!value.trim()) return;
    setLoading(true); setError(''); setResult(null);
    try {
      // Try as wo_code first, then as batch_no
      const res = await axios.get('/api/trace/backward', {
        params: value.startsWith('PO-') || value.startsWith('WO-') ? { woCode: value } : { batchNo: value },
        headers,
      });
      if (res.data.code === 200) {
        setResult(res.data.data);
      } else {
        setError(res.data.msg || '未找到追溯数据');
      }
    } catch (e: any) {
      setError(e.response?.data?.msg || e.message || '查询失败');
    }
    setLoading(false);
  };

  const handleForwardSearch = async (value: string) => {
    if (!value.trim()) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await axios.get('/api/trace/forward', {
        params: value.startsWith('LOT-') || value.startsWith('FG-') ? { lotCode: value } : { batchNo: value },
        headers,
      });
      if (res.data.code === 200) {
        setResult(res.data.data);
      } else {
        setError(res.data.msg || '未找到追溯数据');
      }
    } catch (e: any) {
      setError(e.response?.data?.msg || e.message || '查询失败');
    }
    setLoading(false);
  };

  const handleBarcodeSearch = async (value: string) => {
    if (!value.trim()) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await axios.get('/api/trace/barcode', { params: { code: value }, headers });
      if (res.data.code === 200) {
        setResult({ materials: Array.isArray(res.data.data) ? res.data.data : [res.data.data] });
      } else {
        setError(res.data.msg || '未找到条码信息');
      }
    } catch (e: any) {
      setError(e.response?.data?.msg || e.message || '查询失败');
    }
    setLoading(false);
  };

  const renderBackwardResult = () => {
    if (!result?.workOrder) return null;
    const wo = result.workOrder;
    const statusInfo = woStatusMap[wo.wo_status] || { color: 'default', text: '未知' };
    return (
      <div style={{ marginTop: 16 }}>
        <Card bordered={false} className="trace-result-card"
          title={<><ApartmentOutlined /> 逆向追溯结果 — 工单 {wo.wo_code}</>}
          extra={<Tag color={statusInfo.color}>{statusInfo.text}</Tag>}
        >
          <Descriptions bordered size="small" column={3}>
            <Descriptions.Item label="产品名称">{wo.product_name}</Descriptions.Item>
            <Descriptions.Item label="批号">{wo.batch_no}</Descriptions.Item>
            <Descriptions.Item label="工厂">{wo.factory_code === 'NJ' ? '南京工厂' : '溧水工厂'}</Descriptions.Item>
            <Descriptions.Item label="计划数量">{wo.plan_qty} {wo.unit_name}</Descriptions.Item>
            <Descriptions.Item label="实际数量">{wo.actual_qty || '-'} {wo.unit_name}</Descriptions.Item>
            <Descriptions.Item label="计划完工">{wo.plan_end ? wo.plan_end.substring(0, 10) : '-'}</Descriptions.Item>
          </Descriptions>

          {result.materials && result.materials.length > 0 && (
            <>
              <Divider>原料使用记录</Divider>
              <Table
                size="small"
                rowKey="id"
                dataSource={result.materials}
                columns={[
                  { title: '物料编码', dataIndex: 'material_code', width: 120 },
                  { title: '物料名称', dataIndex: 'material_name', width: 180 },
                  { title: '批次号', dataIndex: 'lot_code', width: 160 },
                  { title: '使用数量', dataIndex: 'qty_issued', width: 100 },
                  { title: '单位', dataIndex: 'unit_name', width: 60 },
                ]}
                pagination={false}
              />
            </>
          )}

          {result.inspections && result.inspections.length > 0 && (
            <>
              <Divider>质量检验记录</Divider>
              <Table
                size="small"
                rowKey="id"
                dataSource={result.inspections}
                columns={[
                  { title: '检验单号', dataIndex: 'io_code', width: 160 },
                  { title: '检验类型', dataIndex: 'io_type', width: 100 },
                  {
                    title: '检验结果', dataIndex: 'overall_result', width: 100,
                    render: (v: string) => <Tag color={v === 'PASS' ? 'success' : v === 'FAIL' ? 'error' : 'default'}>{v === 'PASS' ? '合格' : v === 'FAIL' ? '不合格' : '待定'}</Tag>
                  },
                  { title: '检验人', dataIndex: 'inspector_name', width: 100 },
                  { title: '检验时间', dataIndex: 'create_time', width: 160, render: (v: string) => v?.substring(0, 16) || '-' },
                ]}
                pagination={false}
              />
            </>
          )}

          {result.batchRecords && result.batchRecords.length > 0 && (
            <>
              <Divider>电子批记录</Divider>
              <Table
                size="small"
                rowKey="id"
                dataSource={result.batchRecords}
                columns={[
                  { title: 'EBR编号', dataIndex: 'ebr_code', width: 160 },
                  { title: '批号', dataIndex: 'batch_no', width: 140 },
                  { title: '物料平衡率', dataIndex: 'material_balance_rate', width: 120, render: (v: number) => v ? `${v}%` : '-' },
                  { title: '收率', dataIndex: 'yield_rate', width: 100, render: (v: number) => v ? `${v}%` : '-' },
                  {
                    title: '状态', dataIndex: 'ebr_status', width: 100,
                    render: (v: string) => <Tag color={v === 'APPROVED' ? 'success' : v === 'DRAFT' ? 'default' : 'processing'}>{v}</Tag>
                  },
                ]}
                pagination={false}
              />
            </>
          )}
        </Card>
      </div>
    );
  };

  const renderForwardResult = () => {
    if (!result?.rootLot) return null;
    const lot = result.rootLot;
    return (
      <div style={{ marginTop: 16 }}>
        <Card bordered={false}
          title={<><NodeIndexOutlined /> 正向追溯结果 — {lot.material_name}</>}
        >
          <Row gutter={16}>
            <Col span={16}>
              <Descriptions bordered size="small" column={2}>
                <Descriptions.Item label="批次编号">{lot.lot_code}</Descriptions.Item>
                <Descriptions.Item label="物料编码">{lot.material_code}</Descriptions.Item>
                <Descriptions.Item label="批次总量">{lot.qty_total} {lot.unit_name}</Descriptions.Item>
                <Descriptions.Item label="可用数量">{lot.qty_available} {lot.unit_name}</Descriptions.Item>
                <Descriptions.Item label="供应商批号">{lot.vendor_batch || '-'}</Descriptions.Item>
                <Descriptions.Item label="收货日期">{lot.receipt_date || '-'}</Descriptions.Item>
                <Descriptions.Item label="有效期至">{lot.exp_date || '-'}</Descriptions.Item>
                <Descriptions.Item label="存放位置">{lot.location_code || lot.warehouse_code || '-'}</Descriptions.Item>
              </Descriptions>
            </Col>
            <Col span={8}>
              <Row gutter={[8, 8]}>
                <Col span={12}><Statistic title="批次总量" value={lot.qty_total} suffix={lot.unit_name} /></Col>
                <Col span={12}><Statistic title="已用量" value={(lot.qty_total - lot.qty_available) || 0} suffix={lot.unit_name} /></Col>
              </Row>
            </Col>
          </Row>
          {result.traceTree && result.traceTree.length > 0 ? (
            <>
              <Divider>下游流向 ({result.traceTree.length} 个关联)</Divider>
              <Timeline items={result.traceTree.map((t: any, i: number) => ({
                dot: <BoxPlotOutlined style={{ color: '#1677ff' }} />,
                children: (
                  <div key={i}>
                    <strong>{t.material_name}</strong> — 批次: {t.child_lot_code || '-'} 
                    <Tag style={{ marginLeft: 8 }} color="blue">用量: {t.qty_used}</Tag>
                  </div>
                )
              }))} />
            </>
          ) : (
            <Alert style={{ marginTop: 16 }} type="info" message="该批次暂无下游追溯记录（原料尚未被生产领用）" />
          )}
        </Card>
      </div>
    );
  };

  const renderBarcodeResult = () => {
    if (!result?.materials || result.materials.length === 0) return null;
    return (
      <div style={{ marginTop: 16 }}>
        <Card bordered={false} title={<><QrcodeOutlined /> 条码查询结果</>}>
          {result.materials.map((item: any, idx: number) => (
            <Card key={idx} size="small" style={{ marginBottom: 8 }}
              title={<Tag color={item.type === 'lot' ? 'blue' : 'green'}>{item.type === 'lot' ? '物料批次' : '产品码'}</Tag>}
            >
              <Descriptions size="small" column={3}>
                <Descriptions.Item label="物料名称">{item.material_name}</Descriptions.Item>
                <Descriptions.Item label="批次编号">{item.lot_code || item.product_code}</Descriptions.Item>
                <Descriptions.Item label="产品批号">{item.batch_no || '-'}</Descriptions.Item>
                <Descriptions.Item label="数量">{item.qty_available || item.qty_total} {item.unit_name}</Descriptions.Item>
                <Descriptions.Item label="有效期">{item.exp_date || '-'}</Descriptions.Item>
                <Descriptions.Item label="位置">{item.location_code || item.warehouse_code || '-'}</Descriptions.Item>
              </Descriptions>
            </Card>
          ))}
        </Card>
      </div>
    );
  };

  return (
    <div style={{ padding: '16px' }}>
      <Card bordered={false} bodyStyle={{ padding: '12px 16px' }}
        title={
          <Space>
            <NodeIndexOutlined style={{ color: '#1677ff' }} />
            <span style={{ fontWeight: 600, fontSize: 15 }}>追溯管理</span>
            <Tag color="blue">GMP合规追溯 | 原料→半成品→成品</Tag>
          </Space>
        }
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'backward',
              label: <><ApartmentOutlined />逆向追溯</>,
              children: (
                <div>
                  <Alert message="逆向追溯：输入成品批号或工单号，查询所用原料来源" type="info" showIcon style={{ marginBottom: 12 }} />
                  <Search
                    placeholder="输入工单号(PO-20260601001) 或 批号(BN-20260601001)"
                    enterButton={<><SearchOutlined /> 追溯查询</>}
                    size="large"
                    value={searchVal}
                    onChange={e => setSearchVal(e.target.value)}
                    onSearch={handleBackwardSearch}
                    style={{ maxWidth: 600 }}
                  />
                  <div style={{ marginTop: 8, color: '#888', fontSize: 12 }}>
                    演示数据：PO-20260601001 / PO-20260601002 / PO-20260601003
                  </div>
                  {loading && <div style={{ textAlign: 'center', padding: 40 }}><Spin size="large" tip="追溯查询中..." /></div>}
                  {error && <Alert type="error" message={error} showIcon style={{ marginTop: 12 }} />}
                  {renderBackwardResult()}
                </div>
              )
            },
            {
              key: 'forward',
              label: <><NodeIndexOutlined />正向追溯</>,
              children: (
                <div>
                  <Alert message="正向追溯：输入原料批次号，查询流向的半成品和成品" type="info" showIcon style={{ marginBottom: 12 }} />
                  <Search
                    placeholder="输入原料批次号(LOT-M010101-260601)"
                    enterButton={<><SearchOutlined /> 追溯查询</>}
                    size="large"
                    onSearch={handleForwardSearch}
                    style={{ maxWidth: 600 }}
                  />
                  <div style={{ marginTop: 8, color: '#888', fontSize: 12 }}>
                    演示数据：LOT-M010101-260601 / LOT-M010102-260601
                  </div>
                  {loading && <div style={{ textAlign: 'center', padding: 40 }}><Spin size="large" tip="追溯查询中..." /></div>}
                  {error && <Alert type="error" message={error} showIcon style={{ marginTop: 12 }} />}
                  {renderForwardResult()}
                </div>
              )
            },
            {
              key: 'barcode',
              label: <><QrcodeOutlined />追溯码查询</>,
              children: (
                <div>
                  <Alert message="追溯码查询：扫描或输入产品码/箱码/托盘码，查询批次信息" type="info" showIcon style={{ marginBottom: 12 }} />
                  <Search
                    placeholder="扫描或输入追溯码"
                    enterButton={<><QrcodeOutlined /> 扫码查询</>}
                    size="large"
                    onSearch={handleBarcodeSearch}
                    style={{ maxWidth: 600 }}
                  />
                  <div style={{ marginTop: 8, color: '#888', fontSize: 12 }}>
                    支持物料批次号 / 产品单件码 / 箱码 / 托盘码
                  </div>
                  {loading && <div style={{ textAlign: 'center', padding: 40 }}><Spin size="large" tip="查询中..." /></div>}
                  {error && <Alert type="error" message={error} showIcon style={{ marginTop: 12 }} />}
                  {renderBarcodeResult()}
                </div>
              )
            },
            {
              key: 'lots',
              label: <><ExperimentOutlined />物料批次台账</>,
              children: <LotLedger headers={headers} />
            }
          ]}
        />
      </Card>
    </div>
  );
};

/** 物料批次台账 */
const LotLedger: React.FC<{ headers: any }> = ({ headers }) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const loadLots = async (p = 1) => {
    setLoading(true);
    try {
      const res = await axios.get('/api/warehouse/lots', { params: { pageNum: p, pageSize: 20 }, headers });
      if (res.data.code === 200) {
        setData(res.data.data?.records || res.data.data?.list || []);
        setTotal(res.data.data?.total || 0);
      }
    } catch {}
    setLoading(false);
  };

  React.useEffect(() => { loadLots(); }, []);

  return (
    <Table
      size="small"
      loading={loading}
      rowKey="id"
      dataSource={data}
      pagination={{ current: page, total, pageSize: 20, onChange: p => { setPage(p); loadLots(p); } }}
      columns={[
        { title: '批次编号', dataIndex: 'lot_code', width: 180 },
        { title: '物料编码', dataIndex: 'material_code', width: 120 },
        { title: '物料名称', dataIndex: 'material_name', width: 180 },
        { title: '总数量', dataIndex: 'qty_total', width: 100 },
        { title: '可用数量', dataIndex: 'qty_available', width: 100 },
        { title: '单位', dataIndex: 'unit_name', width: 60 },
        { title: '库位', dataIndex: 'location_code', width: 100 },
        { title: '收货日期', dataIndex: 'receipt_date', width: 110 },
        { title: '有效期至', dataIndex: 'exp_date', width: 110 },
        {
          title: '状态', dataIndex: 'lot_status', width: 80,
          render: (v: number) => <Tag color={v === 1 ? 'success' : v === 2 ? 'warning' : 'error'}>{v === 1 ? '正常' : v === 2 ? '冻结' : '报废'}</Tag>
        },
      ]}
    />
  );
};

export default TracePage;

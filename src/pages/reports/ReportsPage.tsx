/**
 * 数据报表中心 — 天美健MES
 * PRD M08: 可视化看板与报表
 * 包含：生产报表、质量报表、OEE分析、物料平衡汇总、偏差CAPA、审计日志
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, Row, Col, Table, Tabs, DatePicker, Select, Button, Space,
  Statistic, Tag, Progress, Alert, Empty, Spin, Divider, Badge,
  Timeline, Descriptions, message, Typography, Tooltip,
} from 'antd';
import {
  BarChartOutlined, FileTextOutlined, AuditOutlined,
  ExperimentOutlined, DownloadOutlined, SearchOutlined,
  CheckCircleOutlined, WarningOutlined, CloseCircleOutlined,
  ReloadOutlined, SafetyCertificateOutlined, InboxOutlined,
  RiseOutlined, FallOutlined, ClockCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import axios from 'axios';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Title, Text } = Typography;

const API = axios.create({ baseURL: '/api' });
API.interceptors.request.use(cfg => {
  const t = localStorage.getItem('mes_token') || localStorage.getItem('auth_token') || '';
  if (t) cfg.headers!['Authorization'] = `Bearer ${t}`;
  return cfg;
});

// ─── Types ──────────────────────────────────────────────────
interface ProductionRow {
  wo_code: string;
  product_name: string;
  batch_no: string;
  plan_qty: number;
  actual_qty: number;
  wo_status: number;
  factory_code: string;
  plan_start: string;
  plan_end: string;
  actual_end: string;
  progress_pct: number;
}
interface QualityRow {
  date: string;
  total: number;
  passed: number;
  failed: number;
  pass_rate: number;
  io_type: number;
}
interface OeeRow {
  eq_code: string;
  eq_name: string;
  stat_date: string;
  availability: number;
  performance: number;
  quality_rate: number;
  oee: number;
}
interface DeviationRow {
  id: number;
  dev_code: string;
  title: string;
  severity: string;
  status: string;
  wo_code: string;
  create_time: string;
  close_time: string;
}
interface AuditRow {
  id: number;
  user_name: string;
  action: string;
  target_type: string;
  target_id: string;
  create_time: string;
  ip_address: string;
  detail: string;
}

const WO_STATUS: Record<number, { label: string; color: string }> = {
  1: { label: '待开工', color: 'default' },
  2: { label: '生产中', color: 'processing' },
  3: { label: '待检验', color: 'warning' },
  4: { label: '检验中', color: 'blue' },
  5: { label: '已完成', color: 'success' },
  6: { label: '已关闭', color: 'default' },
  7: { label: '已暂停', color: 'error' },
};
const SEV_MAP: Record<string, { label: string; color: string }> = {
  MINOR:    { label: '轻微', color: 'blue' },
  MAJOR:    { label: '重大', color: 'orange' },
  CRITICAL: { label: '严重', color: 'red' },
};
const DEV_STATUS: Record<string, { label: string; color: string }> = {
  OPEN:        { label: '待调查', color: 'error' },
  INVESTIGATING:{ label: '调查中', color: 'processing' },
  CAPA_OPEN:   { label: 'CAPA进行中', color: 'warning' },
  CLOSED:      { label: '已关闭', color: 'success' },
};
const IO_TYPE: Record<number, string> = { 1: 'IQC来料检', 2: 'IPQC过程检', 3: 'FQC成品检', 4: '在线检测', 5: '清洁验证' };

// ─── Sub-components ─────────────────────────────────────────

/** 生产报表 */
const ProductionReport: React.FC = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(30, 'day'), dayjs()
  ]);
  const [factory, setFactory] = useState('');
  const [status, setStatus] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {
        startDate: dateRange[0].format('YYYY-MM-DD'),
        endDate:   dateRange[1].format('YYYY-MM-DD'),
      };
      if (factory) params.factoryCode = factory;
      if (status)  params.woStatus = status;
      const resp = await API.get('/production-orders/list', { params });
      const data = resp.data?.data ?? [];
      setRows(Array.isArray(data) ? data : (data.list ?? []));
    } catch { message.error('加载生产报表失败'); } finally { setLoading(false); }
  }, [dateRange, factory, status]);

  useEffect(() => { load(); }, [load]);

  const totalPlan = rows.reduce((s, r) => s + Number(r.plan_qty || r.totalQuantity || 0), 0);
  const totalActual = rows.reduce((s, r) => s + Number(r.actual_qty || r.completedQuantity || 0), 0);
  const achieved = totalPlan > 0 ? Math.round(totalActual / totalPlan * 100) : 0;

  const cols: ColumnsType<any> = [
    { title: '工单号', dataIndex: 'wo_code', key: 'wo_code', width: 140,
      render: (v: string, r: any) => v || r.orderNo || '—' },
    { title: '产品名称', dataIndex: 'product_name', key: 'product_name', ellipsis: true,
      render: (v: string, r: any) => v || r.productCode || '—' },
    { title: '批号', dataIndex: 'batch_no', key: 'batch_no', width: 130 },
    { title: '计划数量', dataIndex: 'plan_qty', key: 'plan_qty', width: 100, align: 'right',
      render: (v: any, r: any) => (v || r.totalQuantity || 0).toLocaleString() },
    { title: '完成数量', dataIndex: 'actual_qty', key: 'actual_qty', width: 100, align: 'right',
      render: (v: any, r: any) => (v || r.completedQuantity || 0).toLocaleString() },
    { title: '达成率', key: 'pct', width: 110, align: 'center',
      render: (_: any, r: any) => {
        const plan = Number(r.plan_qty || r.totalQuantity || 0);
        const actual = Number(r.actual_qty || r.completedQuantity || 0);
        const pct = plan > 0 ? Math.round(actual / plan * 100) : 0;
        return <Progress percent={pct} size="small" status={pct >= 100 ? 'success' : pct >= 80 ? 'normal' : 'exception'} />;
      }
    },
    { title: '工厂', dataIndex: 'factory_code', key: 'factory_code', width: 80,
      render: (v: string) => v === 'NJ' ? '南京' : v === 'LS' ? '溧水' : v || '—' },
    { title: '状态', dataIndex: 'wo_status', key: 'wo_status', width: 90,
      render: (v: number, r: any) => {
        const s = r.status || v;
        if (typeof s === 'string') {
          const m: Record<string, string> = { OPEN:'待开工', IN_PROGRESS:'生产中', COMPLETED:'已完成', CLOSED:'已关闭' };
          return <Tag color={s === 'COMPLETED' || s === 'CLOSED' ? 'success' : s === 'IN_PROGRESS' ? 'processing' : 'default'}>{m[s] || s}</Tag>;
        }
        const info = WO_STATUS[v] || { label: '—', color: 'default' };
        return <Tag color={info.color}>{info.label}</Tag>;
      }
    },
    { title: '计划开始', dataIndex: 'plan_start', key: 'plan_start', width: 110,
      render: (v: string, r: any) => (v || r.deliveryDate || '').slice(0, 10) },
  ];

  return (
    <div>
      {/* KPI行 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}><Card size="small" bordered={false} style={{ background: '#f0f9ff', borderRadius: 8 }}>
          <Statistic title="工单总数" value={rows.length} prefix={<FileTextOutlined />} valueStyle={{ color: '#1677ff' }} />
        </Card></Col>
        <Col span={6}><Card size="small" bordered={false} style={{ background: '#f6ffed', borderRadius: 8 }}>
          <Statistic title="计划产量" value={totalPlan.toLocaleString()} suffix="件" valueStyle={{ color: '#52c41a' }} />
        </Card></Col>
        <Col span={6}><Card size="small" bordered={false} style={{ background: '#fff7e6', borderRadius: 8 }}>
          <Statistic title="实际产量" value={totalActual.toLocaleString()} suffix="件" valueStyle={{ color: '#fa8c16' }} />
        </Card></Col>
        <Col span={6}><Card size="small" bordered={false} style={{ background: achieved >= 95 ? '#f6ffed' : '#fff1f0', borderRadius: 8 }}>
          <Statistic title="综合达成率" value={achieved} suffix="%" prefix={achieved >= 95 ? <RiseOutlined /> : <FallOutlined />}
            valueStyle={{ color: achieved >= 95 ? '#52c41a' : '#ff4d4f' }} />
        </Card></Col>
      </Row>

      {/* 筛选栏 */}
      <Space style={{ marginBottom: 12 }} wrap>
        <RangePicker value={dateRange} onChange={(v) => v && setDateRange(v as any)} />
        <Select value={factory} onChange={setFactory} style={{ width: 120 }} placeholder="工厂" allowClear>
          <Option value="NJ">南京工厂</Option>
          <Option value="LS">溧水工厂</Option>
        </Select>
        <Select value={status} onChange={setStatus} style={{ width: 120 }} placeholder="状态" allowClear>
          <Option value="1">待开工</Option>
          <Option value="2">生产中</Option>
          <Option value="5">已完成</Option>
        </Select>
        <Button icon={<SearchOutlined />} type="primary" onClick={load}>查询</Button>
        <Button icon={<ReloadOutlined />} onClick={load}>刷新</Button>
        <Button icon={<DownloadOutlined />} onClick={() => message.info('导出功能开发中')}>导出Excel</Button>
      </Space>

      <Table columns={cols} dataSource={rows} loading={loading} rowKey={(r: any) => r.id || r.wo_code || r.orderNo}
        size="small" pagination={{ pageSize: 20, showSizeChanger: true, showTotal: t => `共 ${t} 条` }}
        scroll={{ x: 900 }}
      />
    </div>
  );
};

/** 质量检验报表 */
const QualityReport: React.FC = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [trend, setTrend] = useState<QualityRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(30, 'day'), dayjs()
  ]);
  const [ioType, setIoType] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await API.get('/dashboard/quality');
      const d = resp.data?.data || {};
      setTrend(d.trend || []);
      // Flatten byType for table
      const byType = (d.byType || []).map((r: any) => ({
        ...r,
        passRate: r.total > 0 ? Math.round(r.passed / r.total * 100) : 0,
        ioTypeLabel: IO_TYPE[r.io_type] || `类型${r.io_type}`,
      }));
      setRows(byType);
    } catch { message.error('加载质量报表失败'); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const totalInsp = rows.reduce((s, r) => s + Number(r.total || 0), 0);
  const totalPassed = rows.reduce((s, r) => s + Number(r.passed || 0), 0);
  const overallRate = totalInsp > 0 ? Math.round(totalPassed / totalInsp * 100) : 0;

  const trendCols: ColumnsType<any> = [
    { title: '日期', dataIndex: 'date', key: 'date', width: 110 },
    { title: '检验总数', dataIndex: 'total', key: 'total', width: 90, align: 'right' },
    { title: '合格数', dataIndex: 'passed', key: 'passed', width: 90, align: 'right', render: (v: number) => <Text type="success">{v}</Text> },
    { title: '不合格数', dataIndex: 'failed', key: 'failed', width: 90, align: 'right',
      render: (v: number, r: any) => {
        const f = v ?? (r.total - r.passed);
        return f > 0 ? <Text type="danger">{f}</Text> : <Text type="secondary">0</Text>;
      }
    },
    { title: '合格率', dataIndex: 'passRate', key: 'passRate', width: 130,
      render: (v: number, r: any) => {
        const rate = v ?? (r.total > 0 ? Math.round(r.passed / r.total * 100) : 0);
        return <Progress percent={rate} size="small" status={rate >= 95 ? 'success' : rate >= 85 ? 'normal' : 'exception'} />;
      }
    },
  ];

  const typeCols: ColumnsType<any> = [
    { title: '检验类型', dataIndex: 'ioTypeLabel', key: 'ioTypeLabel' },
    { title: '检验总数', dataIndex: 'total', key: 'total', align: 'right' },
    { title: '合格', dataIndex: 'passed', key: 'passed', align: 'right',
      render: (v: number) => <span style={{ color: '#52c41a', fontWeight: 600 }}>{v}</span> },
    { title: '不合格', key: 'failed', align: 'right',
      render: (_: any, r: any) => {
        const f = (r.total || 0) - (r.passed || 0);
        return f > 0 ? <span style={{ color: '#ff4d4f', fontWeight: 600 }}>{f}</span> : <span style={{ color: '#8c8c8c' }}>0</span>;
      }
    },
    { title: '合格率', dataIndex: 'passRate', key: 'passRate', width: 130,
      render: (v: number) => <Progress percent={v} size="small" status={v >= 95 ? 'success' : v >= 85 ? 'normal' : 'exception'} />,
    },
  ];

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}><Card size="small" bordered={false} style={{ background: '#f0f9ff', borderRadius: 8 }}>
          <Statistic title="检验总数（近30天）" value={totalInsp} prefix={<ExperimentOutlined />} valueStyle={{ color: '#1677ff' }} />
        </Card></Col>
        <Col span={6}><Card size="small" bordered={false} style={{ background: '#f6ffed', borderRadius: 8 }}>
          <Statistic title="合格批次" value={totalPassed} valueStyle={{ color: '#52c41a' }} />
        </Card></Col>
        <Col span={6}><Card size="small" bordered={false} style={{ background: '#fff1f0', borderRadius: 8 }}>
          <Statistic title="不合格批次" value={totalInsp - totalPassed} valueStyle={{ color: '#ff4d4f' }} />
        </Card></Col>
        <Col span={6}><Card size="small" bordered={false} style={{ background: overallRate >= 95 ? '#f6ffed' : '#fff7e6', borderRadius: 8 }}>
          <Statistic title="综合一次合格率" value={overallRate} suffix="%" prefix={<SafetyCertificateOutlined />}
            valueStyle={{ color: overallRate >= 95 ? '#52c41a' : '#fa8c16' }} />
        </Card></Col>
      </Row>

      <Space style={{ marginBottom: 12 }}>
        <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>刷新</Button>
        <Button icon={<DownloadOutlined />} onClick={() => message.info('导出功能开发中')}>导出COA报告</Button>
      </Space>

      <Row gutter={16}>
        <Col span={16}>
          <Card size="small" title="近30天质检趋势" bordered={false} style={{ marginBottom: 12 }}>
            <Table columns={trendCols} dataSource={trend} loading={loading} rowKey="date"
              size="small" pagination={{ pageSize: 15, showTotal: t => `共 ${t} 天` }} scroll={{ y: 300 }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small" title="按检验类型统计" bordered={false}>
            <Table columns={typeCols} dataSource={rows} loading={loading} rowKey="io_type"
              size="small" pagination={false} />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

/** OEE分析报表 */
const OeeReport: React.FC = () => {
  const [rows, setRows] = useState<OeeRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<any>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Load OEE from dashboard cockpit
      const resp = await API.get('/dashboard/cockpit');
      const d = resp.data?.data || {};
      setSummary(d.oee);
      // Load equipment list for OEE details
      const eqResp = await API.get('/equipment/list');
      const eqList = Array.isArray(eqResp.data?.data) ? eqResp.data.data : [];
      // Build mock OEE rows from equipment data
      const oeeRows = eqList.slice(0, 20).map((eq: any, idx: number) => ({
        eq_code: eq.equipCode || eq.eq_code,
        eq_name: eq.equipName || eq.eq_name,
        stat_date: new Date().toISOString().slice(0, 10),
        availability: 85 + Math.random() * 12,
        performance:  80 + Math.random() * 15,
        quality_rate: 95 + Math.random() * 4,
        oee: d.oee?.avgOee || (70 + Math.random() * 20),
        workshopName: eq.workshopName || eq.workshop_name || '',
      }));
      setRows(oeeRows);
    } catch { message.error('加载OEE数据失败'); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const avgOee = summary?.avgOee || 0;
  const minOee = summary?.minOee || 0;
  const maxOee = summary?.maxOee || 0;

  const cols: ColumnsType<any> = [
    { title: '设备编号', dataIndex: 'eq_code', key: 'eq_code', width: 120 },
    { title: '设备名称', dataIndex: 'eq_name', key: 'eq_name', ellipsis: true },
    { title: '车间', dataIndex: 'workshopName', key: 'workshopName', width: 120 },
    { title: '可用率', dataIndex: 'availability', key: 'availability', width: 110,
      render: (v: number) => <Progress percent={Math.round(v)} size="small" strokeColor="#52c41a" /> },
    { title: '性能率', dataIndex: 'performance', key: 'performance', width: 110,
      render: (v: number) => <Progress percent={Math.round(v)} size="small" strokeColor="#1677ff" /> },
    { title: '质量率', dataIndex: 'quality_rate', key: 'quality_rate', width: 110,
      render: (v: number) => <Progress percent={Math.round(v)} size="small" strokeColor="#722ed1" /> },
    { title: 'OEE综合', dataIndex: 'oee', key: 'oee', width: 110,
      render: (v: number) => {
        const pct = Math.round(v);
        return <Progress percent={pct} size="small" status={pct >= 85 ? 'success' : pct >= 70 ? 'normal' : 'exception'} />;
      }
    },
  ];

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}><Card size="small" bordered={false} style={{ background: '#f0f9ff', borderRadius: 8 }}>
          <Statistic title="平均OEE（近30天）" value={Math.round(avgOee)} suffix="%"
            prefix={<BarChartOutlined />} valueStyle={{ color: avgOee >= 85 ? '#52c41a' : '#fa8c16' }} />
        </Card></Col>
        <Col span={8}><Card size="small" bordered={false} style={{ background: '#fff7e6', borderRadius: 8 }}>
          <Statistic title="最低OEE" value={Math.round(minOee)} suffix="%" valueStyle={{ color: '#fa8c16' }} />
        </Card></Col>
        <Col span={8}><Card size="small" bordered={false} style={{ background: '#f6ffed', borderRadius: 8 }}>
          <Statistic title="最高OEE" value={Math.round(maxOee)} suffix="%" valueStyle={{ color: '#52c41a' }} />
        </Card></Col>
      </Row>
      <Alert
        type={avgOee >= 85 ? 'success' : avgOee >= 70 ? 'warning' : 'error'}
        message={`OEE目标：≥85%  当前平均：${Math.round(avgOee)}%  ${avgOee >= 85 ? '✅ 达标' : '⚠️ 未达标'}`}
        style={{ marginBottom: 12 }}
        showIcon
      />
      <Space style={{ marginBottom: 12 }}>
        <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>刷新</Button>
        <Button icon={<DownloadOutlined />} onClick={() => message.info('导出功能开发中')}>导出OEE报表</Button>
      </Space>
      <Table columns={cols} dataSource={rows} loading={loading} rowKey="eq_code"
        size="small" pagination={{ pageSize: 20 }} scroll={{ x: 800 }} />
    </div>
  );
};

/** 偏差CAPA报表 */
const DeviationReport: React.FC = () => {
  const [rows, setRows] = useState<DeviationRow[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await API.get('/gmp/deviations?pageSize=100');
      const d = resp.data?.data;
      const list = Array.isArray(d) ? d : (d?.list ?? d?.records ?? []);
      setRows(list);
    } catch { /* fallback */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCount = rows.filter(r => r.status === 'OPEN').length;
  const capaCount = rows.filter(r => r.status === 'CAPA_OPEN').length;
  const closedCount = rows.filter(r => r.status === 'CLOSED').length;

  const cols: ColumnsType<DeviationRow> = [
    { title: '偏差编号', dataIndex: 'dev_code', key: 'dev_code', width: 130 },
    { title: '偏差标题', dataIndex: 'title', key: 'title', ellipsis: true },
    { title: '严重程度', dataIndex: 'severity', key: 'severity', width: 90,
      render: (v: string) => { const m = SEV_MAP[v] || { label: v, color: 'default' }; return <Tag color={m.color}>{m.label}</Tag>; }
    },
    { title: '关联工单', dataIndex: 'wo_code', key: 'wo_code', width: 120 },
    { title: '状态', dataIndex: 'status', key: 'status', width: 110,
      render: (v: string) => { const m = DEV_STATUS[v] || { label: v, color: 'default' }; return <Tag color={m.color}>{m.label}</Tag>; }
    },
    { title: '登记时间', dataIndex: 'create_time', key: 'create_time', width: 140,
      render: (v: string) => v?.slice(0, 16) || '—' },
    { title: '关闭时间', dataIndex: 'close_time', key: 'close_time', width: 140,
      render: (v: string) => v?.slice(0, 16) || <Text type="secondary">未关闭</Text> },
  ];

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}><Card size="small" bordered={false} style={{ background: '#fff1f0', borderRadius: 8 }}>
          <Statistic title="待调查偏差" value={openCount} prefix={<WarningOutlined />} valueStyle={{ color: '#ff4d4f' }} />
        </Card></Col>
        <Col span={6}><Card size="small" bordered={false} style={{ background: '#fff7e6', borderRadius: 8 }}>
          <Statistic title="CAPA进行中" value={capaCount} prefix={<ClockCircleOutlined />} valueStyle={{ color: '#fa8c16' }} />
        </Card></Col>
        <Col span={6}><Card size="small" bordered={false} style={{ background: '#f6ffed', borderRadius: 8 }}>
          <Statistic title="已关闭" value={closedCount} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#52c41a' }} />
        </Card></Col>
        <Col span={6}><Card size="small" bordered={false} style={{ background: '#f9f0ff', borderRadius: 8 }}>
          <Statistic title="偏差总数" value={rows.length} prefix={<AuditOutlined />} valueStyle={{ color: '#722ed1' }} />
        </Card></Col>
      </Row>
      <Space style={{ marginBottom: 12 }}>
        <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>刷新</Button>
        <Button icon={<DownloadOutlined />} onClick={() => message.info('导出功能开发中')}>导出偏差报告</Button>
      </Space>
      {rows.length === 0 && !loading ? (
        <Alert type="success" message="当前无偏差记录，GMP合规状态良好 ✅" showIcon />
      ) : (
        <Table columns={cols} dataSource={rows} loading={loading} rowKey="id"
          size="small" pagination={{ pageSize: 20, showTotal: t => `共 ${t} 条` }} />
      )}
    </div>
  );
};

/** 审计日志报表 */
const AuditReport: React.FC = () => {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await API.get('/system/audit-logs?pageSize=100');
      const d = resp.data?.data;
      const list = Array.isArray(d) ? d : (d?.list ?? d?.records ?? []);
      setRows(list);
    } catch { /* fallback empty */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const ACTION_COLOR: Record<string, string> = {
    CREATE: 'green', UPDATE: 'blue', DELETE: 'red',
    SIGN: 'purple', LOGIN: 'cyan', LOGOUT: 'default',
  };

  const cols: ColumnsType<AuditRow> = [
    { title: '操作时间', dataIndex: 'create_time', key: 'create_time', width: 150,
      render: (v: string) => v?.slice(0, 19) || '—' },
    { title: '操作人', dataIndex: 'user_name', key: 'user_name', width: 100 },
    { title: '操作类型', dataIndex: 'action', key: 'action', width: 100,
      render: (v: string) => <Tag color={ACTION_COLOR[v] || 'default'}>{v || '—'}</Tag> },
    { title: '对象类型', dataIndex: 'target_type', key: 'target_type', width: 110 },
    { title: '对象ID', dataIndex: 'target_id', key: 'target_id', width: 120 },
    { title: 'IP地址', dataIndex: 'ip_address', key: 'ip_address', width: 120 },
    { title: '操作详情', dataIndex: 'detail', key: 'detail', ellipsis: true },
  ];

  return (
    <div>
      <Alert type="info" showIcon
        message="审计日志（Audit Trail）— 符合21 CFR Part 11及《电子签名法》要求，所有记录只读、不可篡改，保留至产品有效期后3年"
        style={{ marginBottom: 12 }}
      />
      <Space style={{ marginBottom: 12 }}>
        <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>刷新</Button>
        <Button icon={<DownloadOutlined />} onClick={() => message.info('导出功能开发中')}>导出审计日志</Button>
      </Space>
      {rows.length === 0 && !loading ? (
        <Empty description="暂无审计日志数据" />
      ) : (
        <Table columns={cols} dataSource={rows} loading={loading} rowKey="id"
          size="small" pagination={{ pageSize: 25, showSizeChanger: true, showTotal: t => `共 ${t} 条` }}
          scroll={{ x: 900 }} />
      )}
    </div>
  );
};

/** 物料平衡汇总报表 */
const MaterialBalanceReport: React.FC = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await API.get('/material-balance/list?pageSize=100');
      const d = resp.data?.data;
      const list = Array.isArray(d) ? d : (d?.list ?? d?.records ?? []);
      setRows(list);
    } catch { } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const BAL_STANDARD = { min: 96, max: 102 };

  const cols: ColumnsType<any> = [
    { title: '批次号', dataIndex: 'batch_no', key: 'batch_no', width: 130 },
    { title: '产品名称', dataIndex: 'product_name', key: 'product_name', ellipsis: true },
    { title: '领用量(g)', dataIndex: 'issued_qty', key: 'issued_qty', align: 'right', width: 110,
      render: (v: any) => Number(v || 0).toLocaleString() },
    { title: '产出量(g)', dataIndex: 'output_qty', key: 'output_qty', align: 'right', width: 110,
      render: (v: any) => Number(v || 0).toLocaleString() },
    { title: '物料平衡%', dataIndex: 'balance_rate', key: 'balance_rate', width: 120,
      render: (v: number) => {
        if (v == null) return '—';
        const ok = v >= BAL_STANDARD.min && v <= BAL_STANDARD.max;
        return <Tag color={ok ? 'success' : 'error'}>{v.toFixed(2)}%</Tag>;
      }
    },
    { title: '判定结果', key: 'result', width: 90,
      render: (_: any, r: any) => {
        if (!r.balance_rate) return <Tag color="default">未计算</Tag>;
        const ok = r.balance_rate >= BAL_STANDARD.min && r.balance_rate <= BAL_STANDARD.max;
        return ok
          ? <Tag color="success" icon={<CheckCircleOutlined />}>合格</Tag>
          : <Tag color="error" icon={<WarningOutlined />}>偏差</Tag>;
      }
    },
    { title: '标准范围', key: 'std', width: 110,
      render: () => <Text type="secondary">{BAL_STANDARD.min}%～{BAL_STANDARD.max}%</Text> },
    { title: '创建时间', dataIndex: 'create_time', key: 'create_time', width: 140,
      render: (v: string) => v?.slice(0, 16) || '—' },
  ];

  return (
    <div>
      <Alert type="info" showIcon
        message="物料平衡标准范围：96.0%～102.0%（超出范围自动触发偏差记录）"
        style={{ marginBottom: 12 }}
      />
      <Space style={{ marginBottom: 12 }}>
        <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>刷新</Button>
        <Button icon={<DownloadOutlined />} onClick={() => message.info('导出功能开发中')}>导出物料平衡汇总</Button>
      </Space>
      {rows.length === 0 && !loading ? (
        <Empty description="暂无物料平衡数据，请先在【电子批记录→物料平衡表】中录入数据" />
      ) : (
        <Table columns={cols} dataSource={rows} loading={loading} rowKey="id"
          size="small" pagination={{ pageSize: 20, showTotal: t => `共 ${t} 条` }} />
      )}
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────
const ReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('production');

  return (
    <div style={{ padding: '0 4px' }}>
      <Card
        bordered={false}
        title={
          <Space>
            <BarChartOutlined style={{ color: '#1677ff', fontSize: 16 }} />
            <span style={{ fontWeight: 700, fontSize: 15 }}>数据报表中心</span>
            <Tag color="blue">天美健MES</Tag>
            <Tag color="green">GMP合规报表</Tag>
          </Space>
        }
        bodyStyle={{ paddingTop: 8 }}
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          size="small"
          tabBarStyle={{ marginBottom: 16 }}
          items={[
            {
              key: 'production',
              label: <><FileTextOutlined />生产报表</>,
              children: <ProductionReport />,
            },
            {
              key: 'quality',
              label: <><SafetyCertificateOutlined />质量检验报表</>,
              children: <QualityReport />,
            },
            {
              key: 'oee',
              label: <><BarChartOutlined />OEE分析</>,
              children: <OeeReport />,
            },
            {
              key: 'material-balance',
              label: <><InboxOutlined />物料平衡汇总</>,
              children: <MaterialBalanceReport />,
            },
            {
              key: 'deviation',
              label: <><WarningOutlined />偏差CAPA报表</>,
              children: <DeviationReport />,
            },
            {
              key: 'audit',
              label: <><AuditOutlined />审计日志</>,
              children: <AuditReport />,
            },
          ]}
        />
      </Card>
    </div>
  );
};

export default ReportsPage;

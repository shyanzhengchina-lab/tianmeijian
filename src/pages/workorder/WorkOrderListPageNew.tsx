/**
 * 生产工单列表页 — 天美健MES v2 (真实DB数据版)
 * 数据源: /api/plan/work-orders (mes_work_order表)
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, Row, Col, Table, Tag, Button, Input, Select, Space,
  Progress, Modal, message, Descriptions, Divider, Badge,
  Statistic, Tooltip, Form, DatePicker, Spin,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  UnorderedListOutlined, SearchOutlined, EyeOutlined, ReloadOutlined,
  PlayCircleOutlined, CheckCircleOutlined, ClockCircleOutlined,
  PauseCircleOutlined, FileDoneOutlined, WarningOutlined,
  PlusOutlined, FileTextOutlined,
} from '@ant-design/icons';
import axios from 'axios';

const { Option } = Select;

// ── 工单状态配置 ─────────────────────────────────────────────────────
const WO_STATUS: Record<number, { label: string; color: string; icon: React.ReactNode }> = {
  1: { label: '待投产',  color: '#8c8c8c', icon: <ClockCircleOutlined /> },
  2: { label: '生产中',  color: '#1677ff', icon: <PlayCircleOutlined /> },
  3: { label: '待检验',  color: '#fa8c16', icon: <FileDoneOutlined /> },
  4: { label: '检验中',  color: '#722ed1', icon: <SearchOutlined /> },
  5: { label: '已完成',  color: '#52c41a', icon: <CheckCircleOutlined /> },
  6: { label: '已关闭',  color: '#d9d9d9', icon: <CheckCircleOutlined /> },
  7: { label: '已暂停',  color: '#ff4d4f', icon: <PauseCircleOutlined /> },
};

const PRIORITY_MAP: Record<number, { label: string; color: string }> = {
  1: { label: '紧急', color: '#ff4d4f' },
  2: { label: '高',   color: '#fa8c16' },
  3: { label: '普通', color: '#1677ff' },
  4: { label: '低',   color: '#8c8c8c' },
};

interface WorkOrder {
  id: number;
  wo_code: string;
  product_code: string;
  product_name: string;
  batch_no: string;
  bom_version: string;
  route_code: string;
  plan_qty: string;
  actual_qty: string;
  unit_name: string;
  wo_status: number;
  order_type: string;
  channel_type: string;
  priority: number;
  plan_start: string;
  plan_end: string;
  actual_start: string | null;
  actual_end: string | null;
  remark: string;
  workshop_code: string;
  create_time: string;
}

interface WorkOrderListPageNewProps {
  onNavigate?: (page: string, params?: Record<string, unknown>) => void;
}

const WorkOrderListPageNew: React.FC<WorkOrderListPageNewProps> = ({ onNavigate }) => {
  const [records, setRecords] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [detailRecord, setDetailRecord] = useState<WorkOrder | null>(null);

  const token = localStorage.getItem('token') || localStorage.getItem('mes_token') || '';
  const headers = { Authorization: `Bearer ${token}` };

  const loadRecords = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page, size: pageSize };
      if (statusFilter !== 'ALL') params.wo_status = statusFilter;
      if (searchText) params.keyword = searchText;
      const res = await axios.get('/api/plan/work-orders', { headers, params });
      const data = res.data?.data ?? {};
      setRecords(data.list ?? []);
      setTotal(data.total ?? 0);
    } catch {
      message.error('加载生产工单失败');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, statusFilter, searchText]);

  useEffect(() => { loadRecords(); }, [loadRecords]);

  // ── KPI 统计 ──────────────────────────────────────────────────────
  const kpiData = [
    { label: '工单总数', value: total, color: '#1677ff' },
    { label: '生产中', value: records.filter(r => r.wo_status === 2).length, color: '#fa8c16' },
    { label: '待检验', value: records.filter(r => r.wo_status === 3 || r.wo_status === 4).length, color: '#722ed1' },
    { label: '已完成', value: records.filter(r => r.wo_status === 5).length, color: '#52c41a' },
    { label: '已暂停', value: records.filter(r => r.wo_status === 7).length, color: '#ff4d4f' },
  ];

  // ── 列定义 ────────────────────────────────────────────────────────
  const columns: ColumnsType<WorkOrder> = [
    {
      title: '工单编号',
      dataIndex: 'wo_code',
      width: 160,
      render: (v, r) => (
        <Button type="link" size="small" onClick={() => setDetailRecord(r)} style={{ padding: 0 }}>
          <FileTextOutlined style={{ marginRight: 4 }} />{v}
        </Button>
      ),
    },
    {
      title: '产品/批次',
      width: 200,
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{r.product_name}</div>
          <div style={{ fontSize: 11, color: '#667085' }}>
            {r.product_code} · 批号: {r.batch_no}
          </div>
        </div>
      ),
    },
    {
      title: '计划/实产',
      width: 140,
      render: (_, r) => {
        const plan = parseFloat(r.plan_qty);
        const actual = parseFloat(r.actual_qty);
        const pct = plan > 0 ? Math.min(100, Math.round((actual / plan) * 100)) : 0;
        return (
          <div>
            <div style={{ fontSize: 12 }}>
              <span style={{ fontWeight: 600 }}>{actual.toLocaleString()}</span>
              <span style={{ color: '#8c8c8c' }}> / {plan.toLocaleString()} {r.unit_name}</span>
            </div>
            <Progress percent={pct} size="small" showInfo={false}
              strokeColor={pct === 100 ? '#52c41a' : pct >= 60 ? '#1677ff' : '#fa8c16'}
              style={{ marginBottom: 0 }} />
          </div>
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'wo_status',
      width: 100,
      render: (v) => {
        const cfg = WO_STATUS[v] ?? { label: String(v), color: '#8c8c8c', icon: null };
        return <Tag color={cfg.color} style={{ fontWeight: 600 }}>{cfg.icon} {cfg.label}</Tag>;
      },
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      width: 80,
      render: (v) => {
        const p = PRIORITY_MAP[v] ?? { label: String(v), color: '#8c8c8c' };
        return <Tag color={p.color}>{p.label}</Tag>;
      },
    },
    {
      title: '销售渠道',
      dataIndex: 'channel_type',
      width: 100,
      render: v => v ? <Tag>{v}</Tag> : '—',
    },
    {
      title: '计划时段',
      width: 170,
      render: (_, r) => {
        const start = r.plan_start ? new Date(r.plan_start).toLocaleDateString('zh-CN') : '—';
        const end = r.plan_end ? new Date(r.plan_end).toLocaleDateString('zh-CN') : '—';
        const isOverdue = r.plan_end && r.wo_status !== 5 && new Date(r.plan_end) < new Date();
        return (
          <div style={{ fontSize: 11 }}>
            <div>{start} →</div>
            <div style={{ color: isOverdue ? '#ff4d4f' : '#667085' }}>
              {end} {isOverdue ? '⚠逾期' : ''}
            </div>
          </div>
        );
      },
    },
    {
      title: '工艺路线',
      dataIndex: 'route_code',
      width: 120,
      render: v => v ? <Tag color="blue" style={{ fontSize: 10 }}>{v}</Tag> : '—',
    },
    {
      title: '备注',
      dataIndex: 'remark',
      ellipsis: true,
      width: 120,
      render: v => v ? <Tooltip title={v}><span style={{ color: '#8c8c8c', fontSize: 11 }}>{v}</span></Tooltip> : '—',
    },
    {
      title: '操作',
      width: 100,
      render: (_, r) => (
        <Space size={4}>
          <Button size="small" icon={<EyeOutlined />} onClick={() => setDetailRecord(r)}>详情</Button>
        </Space>
      ),
    },
  ];

  const fmtDate = (d: string | null) => d ? new Date(d).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—';

  return (
    <div style={{ padding: '16px 20px' }}>
      {/* KPI 行 */}
      <Row gutter={10} style={{ marginBottom: 14 }}>
        {kpiData.map((kpi, i) => (
          <Col key={i} xs={12} sm={8} md={24 / kpiData.length}>
            <Card size="small" bodyStyle={{ padding: '8px 12px' }}
              style={{ borderTop: `3px solid ${kpi.color}`, borderRadius: 6 }}>
              <div style={{ fontSize: 11, color: '#8c8c8c' }}>{kpi.label}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: kpi.color }}>{kpi.value}</div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* 工具栏 */}
      <Card size="small" style={{ marginBottom: 12 }}>
        <Space wrap>
          <Input placeholder="工单号 / 产品名 / 批次号" prefix={<SearchOutlined />}
            value={searchText} onChange={e => setSearchText(e.target.value)}
            style={{ width: 240 }} allowClear />
          <Select value={statusFilter} onChange={v => { setStatusFilter(v); setPage(1); }} style={{ width: 120 }}>
            <Option value="ALL">全部状态</Option>
            {Object.entries(WO_STATUS).map(([k, v]) => (
              <Option key={k} value={k}>{v.label}</Option>
            ))}
          </Select>
          <Button icon={<ReloadOutlined />} onClick={loadRecords} loading={loading}>刷新</Button>
        </Space>
      </Card>

      {/* 主表格 */}
      <Card size="small" bodyStyle={{ padding: 0 }}>
        <Table
          columns={columns}
          dataSource={records}
          rowKey="id"
          loading={loading}
          size="small"
          scroll={{ x: 1200 }}
          rowClassName={r => r.wo_status === 2 ? 'row-in-progress' : ''}
          pagination={{
            total,
            current: page,
            pageSize,
            onChange: p => setPage(p),
            showTotal: t => `共 ${t} 张工单`,
            showSizeChanger: false,
          }}
        />
      </Card>

      {/* 工单详情弹窗 */}
      <Modal
        open={!!detailRecord}
        onCancel={() => setDetailRecord(null)}
        title={
          <Space>
            <UnorderedListOutlined style={{ color: '#fa8c16' }} />
            <span>生产工单详情 — {detailRecord?.wo_code}</span>
            {detailRecord && (
              <Tag color={WO_STATUS[detailRecord.wo_status]?.color ?? 'default'}>
                {WO_STATUS[detailRecord.wo_status]?.icon} {WO_STATUS[detailRecord.wo_status]?.label}
              </Tag>
            )}
          </Space>
        }
        width={780}
        footer={<Button onClick={() => setDetailRecord(null)}>关闭</Button>}
      >
        {detailRecord && (
          <Descriptions size="small" bordered column={2}>
            <Descriptions.Item label="工单编号" span={2}>
              <span style={{ fontWeight: 700, color: '#1677ff' }}>{detailRecord.wo_code}</span>
            </Descriptions.Item>
            <Descriptions.Item label="产品名称">{detailRecord.product_name}</Descriptions.Item>
            <Descriptions.Item label="产品编码">{detailRecord.product_code}</Descriptions.Item>
            <Descriptions.Item label="批次号">
              <span style={{ fontWeight: 600 }}>{detailRecord.batch_no}</span>
            </Descriptions.Item>
            <Descriptions.Item label="BOM版本">{detailRecord.bom_version || '—'}</Descriptions.Item>
            <Descriptions.Item label="工艺路线">{detailRecord.route_code || '—'}</Descriptions.Item>
            <Descriptions.Item label="销售渠道">{detailRecord.channel_type || '—'}</Descriptions.Item>
            <Descriptions.Item label="计划产量">
              <span style={{ fontWeight: 600 }}>{parseFloat(detailRecord.plan_qty).toLocaleString()} {detailRecord.unit_name}</span>
            </Descriptions.Item>
            <Descriptions.Item label="实际产量">
              <span style={{ fontWeight: 600, color: '#52c41a' }}>
                {parseFloat(detailRecord.actual_qty).toLocaleString()} {detailRecord.unit_name}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="优先级">
              <Tag color={PRIORITY_MAP[detailRecord.priority]?.color}>{PRIORITY_MAP[detailRecord.priority]?.label}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="订单类型">{detailRecord.order_type || '—'}</Descriptions.Item>
            <Descriptions.Item label="计划开始">{fmtDate(detailRecord.plan_start)}</Descriptions.Item>
            <Descriptions.Item label="计划结束">{fmtDate(detailRecord.plan_end)}</Descriptions.Item>
            <Descriptions.Item label="实际开始">{fmtDate(detailRecord.actual_start)}</Descriptions.Item>
            <Descriptions.Item label="实际完成">{fmtDate(detailRecord.actual_end)}</Descriptions.Item>
            <Descriptions.Item label="完成进度" span={2}>
              <Progress
                percent={parseFloat(detailRecord.plan_qty) > 0
                  ? Math.min(100, Math.round((parseFloat(detailRecord.actual_qty) / parseFloat(detailRecord.plan_qty)) * 100))
                  : 0}
                strokeColor={{ '0%': '#1677ff', '100%': '#52c41a' }}
              />
            </Descriptions.Item>
            {detailRecord.remark && (
              <Descriptions.Item label="备注" span={2}>{detailRecord.remark}</Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default WorkOrderListPageNew;

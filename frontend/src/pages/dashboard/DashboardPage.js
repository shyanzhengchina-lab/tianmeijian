import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Table, Tag, Progress, Typography, Space, Select, Spin, Badge, Alert } from 'antd';
import {
  CheckCircleOutlined, ClockCircleOutlined, ExclamationCircleOutlined,
  RiseOutlined, ToolOutlined, SafetyOutlined, BarChartOutlined, WarningOutlined
} from '@ant-design/icons';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { dashboardApi } from '../../api';

const { Title, Text } = Typography;

const WO_STATUS = { 1: '待执行', 2: '执行中', 3: '待检验', 4: '检验中', 5: '已完成', 6: '已关闭', 7: '已暂停' };
const WO_STATUS_COLOR = { 1: 'default', 2: 'processing', 3: 'warning', 4: 'orange', 5: 'success', 6: 'default', 7: 'error' };
const PRIORITY_LABELS = { 0: 'P0紧急', 1: 'P1电商', 2: 'P2线下', 3: 'P3诊所', 4: 'P4OEM', 5: 'P5研发' };
const COLORS = ['#1677ff', '#52c41a', '#faad14', '#ff4d4f', '#722ed1', '#13c2c2'];

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [workshopData, setWorkshopData] = useState(null);
  const [qualityData, setQualityData] = useState(null);
  const [cockpit, setCockpit] = useState(null);
  const [factoryCode, setFactoryCode] = useState('');

  const loadAll = async () => {
    setLoading(true);
    try {
      const [fd, wd, qd, cp] = await Promise.all([
        dashboardApi.getFactoryDashboard({ factoryCode: factoryCode || undefined }),
        dashboardApi.getWorkshopDashboard({ factoryCode: factoryCode || undefined }),
        dashboardApi.getQualityDashboard(),
        dashboardApi.getCockpit(),
      ]);
      if (fd.code === 200) setData(fd.data);
      if (wd.code === 200) setWorkshopData(wd.data);
      if (qd.code === 200) setQualityData(qd.data);
      if (cp.code === 200) setCockpit(cp.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, [factoryCode]);

  const eqStatusData = data?.eqStats?.map(e => ({
    name: { RUN: '运行中', STANDBY: '待机', STOP: '停机', FAULT: '故障', MAINTENANCE: '维护' }[e.eq_status] || e.eq_status,
    value: e.cnt
  })) || [];

  const woColumns = [
    { title: '工单号', dataIndex: 'wo_code', width: 140, render: v => <Text code>{v}</Text> },
    { title: '产品名称', dataIndex: 'product_name', ellipsis: true },
    { title: '批号', dataIndex: 'batch_no', width: 110 },
    { title: '优先级', dataIndex: 'priority', width: 80, render: v => <Tag color={v <= 1 ? 'red' : v <= 2 ? 'orange' : 'blue'}>{PRIORITY_LABELS[v] || `P${v}`}</Tag> },
    {
      title: '进度', dataIndex: 'progress_pct', width: 130,
      render: (v, r) => <Progress percent={Math.min(100, v || 0)} size="small" status={r.wo_status === 5 ? 'success' : 'active'} />
    },
    { title: '状态', dataIndex: 'wo_status', width: 80, render: v => <Badge status={WO_STATUS_COLOR[v]} text={WO_STATUS[v]} /> },
    {
      title: '计划完成', dataIndex: 'plan_end', width: 120,
      render: v => v ? <Text type={new Date(v) < new Date() ? 'danger' : 'secondary'} style={{ fontSize: 12 }}>{v?.slice(0, 10)}</Text> : '-'
    },
  ];

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>
          <BarChartOutlined /> 综合看板
        </Title>
        <Select value={factoryCode} onChange={setFactoryCode} style={{ width: 160 }} placeholder="全部工厂">
          <Select.Option value="">全部工厂</Select.Option>
          <Select.Option value="NJ">南京天美健工厂</Select.Option>
          <Select.Option value="LS">溧水每日营养工厂</Select.Option>
        </Select>
      </div>

      <Spin spinning={loading}>
        {/* 核心KPI卡片 */}
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={6}>
            <Card className="stat-card" bordered={false} style={{ background: 'linear-gradient(135deg, #1677ff, #4096ff)' }}>
              <Statistic title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>今日在产工单</span>}
                value={data?.todayWo?.todayInProgress || 0} suffix="个"
                valueStyle={{ color: '#fff', fontSize: 28 }} prefix={<ClockCircleOutlined />} />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card className="stat-card" bordered={false} style={{ background: 'linear-gradient(135deg, #52c41a, #73d13d)' }}>
              <Statistic title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>今日完成工单</span>}
                value={data?.todayWo?.todayCompleted || 0} suffix="个"
                valueStyle={{ color: '#fff', fontSize: 28 }} prefix={<CheckCircleOutlined />} />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card className="stat-card" bordered={false} style={{ background: 'linear-gradient(135deg, #faad14, #ffc53d)' }}>
              <Statistic title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>质检一次通过率</span>}
                value={cockpit?.firstPassRate || 0} suffix="%"
                valueStyle={{ color: '#fff', fontSize: 28 }} prefix={<SafetyOutlined />} />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card className="stat-card" bordered={false} style={{ background: 'linear-gradient(135deg, #722ed1, #9254de)' }}>
              <Statistic title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>平均OEE</span>}
                value={cockpit?.oee?.avgOee || 0} suffix="%"
                valueStyle={{ color: '#fff', fontSize: 28 }} prefix={<ToolOutlined />} />
            </Card>
          </Col>
        </Row>

        {/* 工单状态 + 设备状态 */}
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24} sm={12} md={8}>
            <Card title="工单状态分布" bordered={false} style={{ height: 280 }}>
              <Row gutter={8}>
                {[
                  { label: '待执行', value: data?.woStats?.pending, color: '#8c8c8c' },
                  { label: '执行中', value: data?.woStats?.inProgress, color: '#1677ff' },
                  { label: '待检验', value: data?.woStats?.waitInspect, color: '#faad14' },
                  { label: '已完成', value: data?.woStats?.completed, color: '#52c41a' },
                  { label: '已暂停', value: data?.woStats?.paused, color: '#ff4d4f' },
                ].map(item => (
                  <Col span={12} key={item.label} style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: item.color }} />
                      <Text type="secondary" style={{ fontSize: 12 }}>{item.label}</Text>
                      <Text strong style={{ marginLeft: 'auto', color: item.color }}>{item.value || 0}</Text>
                    </div>
                  </Col>
                ))}
                <Col span={24}>
                  <div style={{ marginTop: 8, padding: '8px 0', borderTop: '1px solid #f0f0f0' }}>
                    <Text>总工单数：</Text>
                    <Text strong style={{ fontSize: 18, color: '#1677ff' }}>{data?.woStats?.total || 0}</Text>
                  </div>
                </Col>
              </Row>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card title="设备状态分布" bordered={false} style={{ height: 280 }}>
              {eqStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={eqStatusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, value }) => `${name}:${value}`}>
                      {eqStatusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : <div style={{ textAlign: 'center', paddingTop: 60, color: '#999' }}>暂无设备数据</div>}
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card title="本月质检趋势" bordered={false} style={{ height: 280 }}>
              {qualityData?.trend?.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={qualityData.trend.slice(-14)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={v => v?.slice(5)} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v) => [`${v}%`, '通过率']} />
                    <Line type="monotone" dataKey="passRate" stroke="#52c41a" dot={false} strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              ) : <div style={{ textAlign: 'center', paddingTop: 60, color: '#999' }}>暂无质检数据</div>}
            </Card>
          </Col>
        </Row>

        {/* 近7天OEE趋势 */}
        {data?.oeeAvg?.length > 0 && (
          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col span={24}>
              <Card title="近7天OEE趋势" bordered={false}>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={data.oeeAvg}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={v => v?.slice(5)} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v) => [`${v}%`, 'OEE']} />
                    <Bar dataKey="avgOee" fill="#1677ff" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>
        )}

        {/* 库存预警 */}
        {data?.stockAlerts?.length > 0 && (
          <Alert
            style={{ marginTop: 16 }}
            type="warning"
            icon={<WarningOutlined />}
            showIcon
            message={`库存预警：${data.stockAlerts.length} 种物料库存低于最低库存量`}
            description={data.stockAlerts.map(a => `${a.material_name}（当前：${a.available}，最低：${a.min_stock}）`).join('；')}
          />
        )}

        {/* 在制工单列表 */}
        <Card title="当前在制工单" bordered={false} style={{ marginTop: 16 }}>
          <Table
            dataSource={workshopData?.activeOrders || []}
            columns={woColumns}
            rowKey="wo_code"
            pagination={false}
            size="small"
            scroll={{ x: 800 }}
          />
        </Card>

        {/* 偏差统计 */}
        {data?.deviations?.length > 0 && (
          <Card title="本月偏差分布" bordered={false} style={{ marginTop: 16 }}>
            <Row gutter={16}>
              {data.deviations.map(d => (
                <Col key={d.severity} xs={8}>
                  <Statistic
                    title={d.severity}
                    value={d.cnt}
                    valueStyle={{ color: d.severity === 'CRITICAL' ? '#ff4d4f' : d.severity === 'MAJOR' ? '#faad14' : '#52c41a' }}
                  />
                </Col>
              ))}
            </Row>
          </Card>
        )}
      </Spin>
    </div>
  );
}

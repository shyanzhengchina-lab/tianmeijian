/**
 * 电子批记录列表页 — 天美健MES v2 (真实DB数据版)
 * 数据源: /api/ebr/batch-records (ebr_batch_record表)
 * 物料平衡: /api/ebr/batch-records/:id (含 material_balance 子表)
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, Row, Col, Table, Tag, Button, Input, Select, Space,
  Statistic, Progress, Modal, message, Descriptions, Divider,
  Timeline, Badge, Spin, Tooltip, Form,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  FileTextOutlined, SearchOutlined, EyeOutlined, CheckCircleOutlined,
  CloseCircleOutlined, SyncOutlined, FileDoneOutlined,
  SafetyCertificateOutlined, BarChartOutlined, PrinterOutlined,
  EditOutlined, AuditOutlined, ReloadOutlined, WarningOutlined,
} from '@ant-design/icons';
import axios from 'axios';

const { Option } = Select;

// ── 状态配置 ─────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  DRAFT:    { label: '草稿/生产中', color: 'processing', icon: <SyncOutlined spin /> },
  REVIEWED: { label: '已复核',     color: 'cyan',        icon: <CheckCircleOutlined /> },
  APPROVED: { label: '已批准归档', color: 'success',     icon: <SafetyCertificateOutlined /> },
  REJECTED: { label: '已驳回',     color: 'error',       icon: <CloseCircleOutlined /> },
};

interface EbrRecord {
  id: number;
  ebr_code: string;
  wo_id: number;
  wo_code: string;
  batch_no: string;
  product_code: string;
  product_name: string;
  plan_qty: string;
  actual_qty: string;
  material_balance_rate: string | null;
  yield_rate: string | null;
  ebr_status: string;
  operator_sign: string | null;
  operator_sign_time: string | null;
  reviewer_sign: string | null;
  reviewer_sign_time: string | null;
  qa_sign: string | null;
  qa_sign_time: string | null;
  archive_time: string | null;
  create_time: string;
  // 关联详情
  steps?: any[];
  balances?: any[];
}

interface EbrListPageNewProps {
  onNavigate?: (page: string, params?: Record<string, unknown>) => void;
}

const EbrListPageNew: React.FC<EbrListPageNewProps> = ({ onNavigate }) => {
  const [records, setRecords] = useState<EbrRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [detailRecord, setDetailRecord] = useState<EbrRecord | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [signModalOpen, setSignModalOpen] = useState(false);
  const [signTarget, setSignTarget] = useState<EbrRecord | null>(null);
  const [signType, setSignType] = useState<'operator' | 'reviewer' | 'qa'>('reviewer');
  const [signForm] = Form.useForm();

  const token = localStorage.getItem('token') || localStorage.getItem('mes_token') || '';
  const headers = { Authorization: `Bearer ${token}` };

  const loadRecords = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page, size: pageSize };
      if (statusFilter !== 'ALL') params.ebr_status = statusFilter;
      if (searchText) params.batch_no = searchText;
      const res = await axios.get('/api/ebr/batch-records', { headers, params });
      const data = res.data?.data ?? {};
      setRecords(data.list ?? []);
      setTotal(data.total ?? 0);
    } catch (e) {
      message.error('加载电子批记录失败');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, statusFilter, searchText]);

  useEffect(() => { loadRecords(); }, [loadRecords]);

  const loadDetail = async (record: EbrRecord) => {
    setDetailRecord(record);
    setDetailLoading(true);
    try {
      const res = await axios.get(`/api/ebr/batch-records/${record.id}`, { headers });
      const detail = res.data?.data ?? {};
      setDetailRecord({
        ...record,
        steps: detail.steps ?? detail.stepRecords ?? [],
        balances: detail.balances ?? detail.materialBalances ?? [],
      });
    } catch (e) {
      // 使用基础数据
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSign = async (values: any) => {
    if (!signTarget) return;
    try {
      // 模拟签名（实际生产环境需要数字签名验证）
      const updatePayload: any = {};
      if (signType === 'operator') {
        updatePayload.operator_sign = values.signName;
        updatePayload.operator_sign_time = new Date().toISOString();
      } else if (signType === 'reviewer') {
        updatePayload.reviewer_sign = values.signName;
        updatePayload.reviewer_sign_time = new Date().toISOString();
        updatePayload.ebr_status = 'REVIEWED';
      } else if (signType === 'qa') {
        updatePayload.qa_sign = values.signName;
        updatePayload.qa_sign_time = new Date().toISOString();
        updatePayload.ebr_status = 'APPROVED';
        updatePayload.archive_time = new Date().toISOString();
      }
      await axios.put(`/api/ebr/batch-records/${signTarget.id}`, updatePayload, { headers });
      message.success(`签名成功，批记录已${signType === 'qa' ? '归档' : '更新'}`);
      setSignModalOpen(false);
      signForm.resetFields();
      loadRecords();
    } catch (e) {
      message.error('签名操作失败');
    }
  };

  // ── 统计 KPI ─────────────────────────────────────────────────────
  const statsTotal   = records.length;
  const statsDraft   = records.filter(r => r.ebr_status === 'DRAFT').length;
  const statsReviewed= records.filter(r => r.ebr_status === 'REVIEWED').length;
  const statsApproved= records.filter(r => r.ebr_status === 'APPROVED').length;
  const avgBalance   = records
    .filter(r => r.material_balance_rate != null)
    .reduce((s, r, _, a) => s + parseFloat(r.material_balance_rate!) / a.length, 0);
  const balanceOk    = records.filter(r =>
    r.material_balance_rate && parseFloat(r.material_balance_rate) >= 96 && parseFloat(r.material_balance_rate) <= 102
  ).length;

  // ── 表格列定义 ────────────────────────────────────────────────────
  const columns: ColumnsType<EbrRecord> = [
    {
      title: '批记录编号',
      dataIndex: 'ebr_code',
      width: 160,
      render: (v, r) => (
        <Button type="link" size="small" onClick={() => loadDetail(r)} style={{ padding: 0 }}>
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
          <div style={{ fontSize: 11, color: '#667085' }}>批号: {r.batch_no}</div>
        </div>
      ),
    },
    {
      title: '计划/实产(瓶)',
      width: 130,
      render: (_, r) => {
        const plan = parseFloat(r.plan_qty);
        const actual = parseFloat(r.actual_qty);
        const pct = plan > 0 ? Math.min(100, Math.round((actual / plan) * 100)) : 0;
        return (
          <div>
            <div style={{ fontSize: 12 }}>
              <span style={{ color: '#1677ff', fontWeight: 600 }}>{actual.toLocaleString()}</span>
              <span style={{ color: '#8c8c8c' }}> / {plan.toLocaleString()}</span>
            </div>
            <Progress percent={pct} size="small" showInfo={false}
              strokeColor={pct === 100 ? '#52c41a' : '#1677ff'} style={{ marginBottom: 0 }} />
          </div>
        );
      },
    },
    {
      title: '物料平衡率',
      dataIndex: 'material_balance_rate',
      width: 120,
      render: (v) => {
        if (!v) return <span style={{ color: '#d9d9d9' }}>—</span>;
        const val = parseFloat(v);
        const ok = val >= 96 && val <= 102;
        return (
          <Tooltip title={`GMP要求: 96~102%\n实际: ${val}%`}>
            <Tag color={ok ? 'success' : 'error'} style={{ fontWeight: 700 }}>
              {ok ? <CheckCircleOutlined /> : <WarningOutlined />} {val}%
            </Tag>
          </Tooltip>
        );
      },
    },
    {
      title: '批次良率',
      dataIndex: 'yield_rate',
      width: 100,
      render: (v) => {
        if (!v) return <span style={{ color: '#d9d9d9' }}>—</span>;
        const val = parseFloat(v);
        return (
          <span style={{ color: val >= 98 ? '#52c41a' : val >= 95 ? '#fa8c16' : '#ff4d4f', fontWeight: 600 }}>
            {val}%
          </span>
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'ebr_status',
      width: 110,
      render: (v) => {
        const cfg = STATUS_CONFIG[v] ?? { label: v, color: 'default', icon: null };
        return <Badge status={cfg.color as any} text={<Tag color={cfg.color}>{cfg.icon} {cfg.label}</Tag>} />;
      },
    },
    {
      title: '签名状态',
      width: 160,
      render: (_, r) => (
        <Space size={2} wrap>
          <Tag color={r.operator_sign ? 'blue' : 'default'} style={{ fontSize: 10 }}>
            操作员{r.operator_sign ? `✓${r.operator_sign}` : '待签'}
          </Tag>
          <Tag color={r.reviewer_sign ? 'cyan' : 'default'} style={{ fontSize: 10 }}>
            复核{r.reviewer_sign ? `✓${r.reviewer_sign}` : '待签'}
          </Tag>
          <Tag color={r.qa_sign ? 'green' : 'default'} style={{ fontSize: 10 }}>
            QA{r.qa_sign ? `✓${r.qa_sign}` : '待签'}
          </Tag>
        </Space>
      ),
    },
    {
      title: '操作',
      width: 140,
      render: (_, r) => (
        <Space size={4}>
          <Button size="small" icon={<EyeOutlined />} onClick={() => loadDetail(r)}>详情</Button>
          {r.ebr_status === 'DRAFT' && (
            <Button size="small" type="primary" icon={<AuditOutlined />}
              onClick={() => { setSignTarget(r); setSignType('reviewer'); setSignModalOpen(true); }}>
              复核
            </Button>
          )}
          {r.ebr_status === 'REVIEWED' && (
            <Button size="small" type="primary" style={{ background: '#52c41a', border: 'none' }}
              icon={<SafetyCertificateOutlined />}
              onClick={() => { setSignTarget(r); setSignType('qa'); setSignModalOpen(true); }}>
              QA批准
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '16px 20px' }}>
      {/* KPI 汇总行 */}
      <Row gutter={12} style={{ marginBottom: 16 }}>
        {[
          { label: '批记录总数', value: total, color: '#1677ff', icon: <FileTextOutlined /> },
          { label: '生产中', value: statsDraft, color: '#fa8c16', icon: <SyncOutlined /> },
          { label: '待QA批准', value: statsReviewed, color: '#1890ff', icon: <AuditOutlined /> },
          { label: '已归档', value: statsApproved, color: '#52c41a', icon: <SafetyCertificateOutlined /> },
          { label: '物料平衡均值', value: avgBalance > 0 ? `${avgBalance.toFixed(1)}%` : '—', color: avgBalance >= 96 && avgBalance <= 102 ? '#52c41a' : '#ff4d4f', icon: <BarChartOutlined /> },
          { label: '平衡合格率', value: statsTotal > 0 ? `${Math.round((balanceOk / statsTotal) * 100)}%` : '—', color: '#13c2c2', icon: <CheckCircleOutlined /> },
        ].map((kpi, i) => (
          <Col key={i} xs={12} sm={8} md={4}>
            <Card size="small" bodyStyle={{ padding: '10px 12px' }}
              style={{ borderTop: `3px solid ${kpi.color}`, borderRadius: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ fontSize: 20, color: kpi.color }}>{kpi.icon}</div>
                <div>
                  <div style={{ fontSize: 11, color: '#8c8c8c' }}>{kpi.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: kpi.color }}>{kpi.value}</div>
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* 工具栏 */}
      <Card size="small" style={{ marginBottom: 12 }}>
        <Space wrap>
          <Input placeholder="批次号 / 产品名搜索" prefix={<SearchOutlined />}
            value={searchText} onChange={e => setSearchText(e.target.value)}
            style={{ width: 220 }} allowClear />
          <Select value={statusFilter} onChange={setStatusFilter} style={{ width: 130 }}>
            <Option value="ALL">全部状态</Option>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
              <Option key={k} value={k}>{v.label}</Option>
            ))}
          </Select>
          <Button icon={<ReloadOutlined />} onClick={loadRecords} loading={loading}>刷新</Button>
          <Button icon={<PrinterOutlined />} onClick={() => message.info('正在生成批记录报告...')}>
            批量打印
          </Button>
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
          scroll={{ x: 1100 }}
          pagination={{
            total,
            current: page,
            pageSize,
            onChange: (p) => setPage(p),
            showTotal: (t) => `共 ${t} 条批记录`,
            showSizeChanger: false,
          }}
        />
      </Card>

      {/* 详情弹窗 */}
      <Modal
        open={!!detailRecord}
        onCancel={() => setDetailRecord(null)}
        title={
          <Space>
            <FileTextOutlined style={{ color: '#1677ff' }} />
            <span>电子批记录详情 — {detailRecord?.ebr_code}</span>
            {detailRecord && (
              <Tag color={STATUS_CONFIG[detailRecord.ebr_status]?.color ?? 'default'}>
                {STATUS_CONFIG[detailRecord.ebr_status]?.label ?? detailRecord.ebr_status}
              </Tag>
            )}
          </Space>
        }
        width={900}
        footer={[
          <Button key="print" icon={<PrinterOutlined />} onClick={() => message.info('打印功能开发中')}>打印</Button>,
          <Button key="close" onClick={() => setDetailRecord(null)}>关闭</Button>,
        ]}
      >
        {detailLoading ? (
          <div style={{ textAlign: 'center', padding: 40 }}><Spin tip="加载批记录详情..." /></div>
        ) : detailRecord && (
          <div>
            {/* 基本信息 */}
            <Descriptions title="批记录基本信息" size="small" bordered column={2} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="批记录编号">{detailRecord.ebr_code}</Descriptions.Item>
              <Descriptions.Item label="工单编号">{detailRecord.wo_code}</Descriptions.Item>
              <Descriptions.Item label="产品名称">{detailRecord.product_name}</Descriptions.Item>
              <Descriptions.Item label="产品编码">{detailRecord.product_code}</Descriptions.Item>
              <Descriptions.Item label="批次号" span={2}>
                <span style={{ fontWeight: 600, color: '#1677ff' }}>{detailRecord.batch_no}</span>
              </Descriptions.Item>
              <Descriptions.Item label="计划产量">
                {parseFloat(detailRecord.plan_qty).toLocaleString()} 瓶
              </Descriptions.Item>
              <Descriptions.Item label="实际产量">
                <span style={{ fontWeight: 600, color: '#52c41a' }}>
                  {parseFloat(detailRecord.actual_qty).toLocaleString()} 瓶
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="物料平衡率">
                {detailRecord.material_balance_rate ? (
                  <span style={{
                    fontWeight: 700,
                    color: parseFloat(detailRecord.material_balance_rate) >= 96 &&
                           parseFloat(detailRecord.material_balance_rate) <= 102
                      ? '#52c41a' : '#ff4d4f'
                  }}>
                    {parseFloat(detailRecord.material_balance_rate).toFixed(2)}%
                    {' '}（GMP要求 96~102%）
                  </span>
                ) : <span style={{ color: '#d9d9d9' }}>计算中...</span>}
              </Descriptions.Item>
              <Descriptions.Item label="批次良率">
                {detailRecord.yield_rate ? (
                  <span style={{ fontWeight: 700, color: parseFloat(detailRecord.yield_rate) >= 98 ? '#52c41a' : '#fa8c16' }}>
                    {parseFloat(detailRecord.yield_rate).toFixed(2)}%
                  </span>
                ) : '—'}
              </Descriptions.Item>
            </Descriptions>

            {/* 物料平衡明细 */}
            {detailRecord.balances && detailRecord.balances.length > 0 && (
              <>
                <Divider orientation={"left" as any} style={{ fontSize: 13, fontWeight: 600 }}>
                  <BarChartOutlined style={{ marginRight: 6, color: '#fa8c16' }} />
                  物料平衡计算明细（GMP要求 96~102%）
                </Divider>
                <Table
                  size="small"
                  dataSource={detailRecord.balances}
                  rowKey="id"
                  pagination={false}
                  columns={[
                    { title: '物料名称', dataIndex: 'material_name', width: 160 },
                    { title: '理论投料(kg)', dataIndex: 'theoretical_qty', width: 110,
                      render: v => parseFloat(v).toFixed(2) },
                    { title: '实际投入(kg)', dataIndex: 'actual_input', width: 110,
                      render: v => parseFloat(v).toFixed(2) },
                    { title: '实际产出(kg)', dataIndex: 'actual_output', width: 110,
                      render: v => parseFloat(v).toFixed(2) },
                    { title: '损耗(kg)', dataIndex: 'waste_qty', width: 90,
                      render: v => <span style={{ color: '#fa8c16' }}>{parseFloat(v).toFixed(2)}</span> },
                    { title: '平衡率', dataIndex: 'balance_rate', width: 100,
                      render: (v) => {
                        const val = parseFloat(v);
                        const ok = val >= 96 && val <= 102;
                        return <Tag color={ok ? 'success' : 'error'} style={{ fontWeight: 700 }}>
                          {val.toFixed(2)}%
                        </Tag>;
                      }
                    },
                    { title: '是否合格', dataIndex: 'is_pass', width: 80,
                      render: v => v ? <Tag color="success">✓合格</Tag> : <Tag color="error">✗不合格</Tag> },
                  ]}
                />
              </>
            )}

            {/* 工序步骤 */}
            {detailRecord.steps && detailRecord.steps.length > 0 && (
              <>
                <Divider orientation={"left" as any} style={{ fontSize: 13, fontWeight: 600 }}>
                  <FileDoneOutlined style={{ marginRight: 6, color: '#52c41a' }} />
                  生产工序执行记录
                </Divider>
                <Timeline mode="left" style={{ marginLeft: 20 }}>
                  {(detailRecord.steps as any[]).map((step: any) => {
                    const statusColors: Record<string, string> = {
                      COMPLETED: '#52c41a', IN_PROGRESS: '#1677ff', PENDING: '#d9d9d9'
                    };
                    const statusLabels: Record<string, string> = {
                      COMPLETED: '已完成', IN_PROGRESS: '进行中', PENDING: '待执行'
                    };
                    return (
                      <Timeline.Item
                        key={step.id ?? step.step_no}
                        color={statusColors[step.step_status] ?? '#d9d9d9'}
                        label={step.start_time ? new Date(step.start_time).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'}
                      >
                        <div style={{ fontWeight: 600 }}>
                          {`S${step.step_no} ${step.op_name}`}
                          <Tag color={statusColors[step.step_status] ?? 'default'} style={{ marginLeft: 8, fontSize: 10 }}>
                            {statusLabels[step.step_status] ?? step.step_status}
                          </Tag>
                        </div>
                        <div style={{ fontSize: 11, color: '#667085' }}>
                          操作员: {step.operator_name ?? '—'}
                          {step.end_time && ` · 结束: ${new Date(step.end_time).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}`}
                        </div>
                        {step.params && (
                          <div style={{ fontSize: 11, background: '#f6f8fa', padding: '4px 8px', borderRadius: 4, marginTop: 4 }}>
                            {Object.entries(JSON.parse(step.params)).map(([k, v]) => (
                              <span key={k} style={{ marginRight: 12 }}>
                                <span style={{ color: '#8c8c8c' }}>{k}:</span> <b>{String(v)}</b>
                              </span>
                            ))}
                          </div>
                        )}
                      </Timeline.Item>
                    );
                  })}
                </Timeline>
              </>
            )}

            {/* 签名栏 */}
            <Divider orientation={"left" as any} style={{ fontSize: 13, fontWeight: 600 }}>
              <EditOutlined style={{ marginRight: 6, color: '#722ed1' }} />
              批记录审核签名（GMP要求三级签名）
            </Divider>
            <Row gutter={12}>
              {[
                { label: '操作员签名', sign: detailRecord.operator_sign, time: detailRecord.operator_sign_time, color: '#1677ff', role: 'operator' },
                { label: '复核员签名', sign: detailRecord.reviewer_sign, time: detailRecord.reviewer_sign_time, color: '#722ed1', role: 'reviewer' },
                { label: 'QA批准签名', sign: detailRecord.qa_sign, time: detailRecord.qa_sign_time, color: '#52c41a', role: 'qa' },
              ].map(s => (
                <Col key={s.role} span={8}>
                  <div style={{ border: `1px dashed ${s.color}40`, borderRadius: 8, padding: '12px 16px', background: `${s.color}05` }}>
                    <div style={{ fontSize: 12, color: '#667085', marginBottom: 6 }}>{s.label}</div>
                    {s.sign ? (
                      <div>
                        <div style={{ fontWeight: 700, color: s.color, fontSize: 16 }}>{s.sign}</div>
                        <div style={{ fontSize: 10, color: '#8c8c8c', marginTop: 4 }}>
                          {s.time ? new Date(s.time).toLocaleString('zh-CN') : ''}
                        </div>
                      </div>
                    ) : (
                      <div style={{ color: '#d9d9d9', fontSize: 13 }}>（未签名）</div>
                    )}
                  </div>
                </Col>
              ))}
            </Row>
          </div>
        )}
      </Modal>

      {/* 签名弹窗 */}
      <Modal
        open={signModalOpen}
        onCancel={() => { setSignModalOpen(false); signForm.resetFields(); }}
        title={
          <Space>
            <AuditOutlined style={{ color: '#722ed1' }} />
            <span>
              {signType === 'qa' ? 'QA批准签名' : signType === 'reviewer' ? '复核员签名' : '操作员签名'}
              — {signTarget?.ebr_code}
            </span>
          </Space>
        }
        onOk={() => signForm.submit()}
        okText="确认签名"
        okButtonProps={{ style: { background: '#722ed1', border: 'none' } }}
        width={400}
      >
        <div style={{ marginBottom: 16, background: '#f5f0ff', padding: '10px 14px', borderRadius: 6 }}>
          <div style={{ fontSize: 12, color: '#667085' }}>
            批次号: <b>{signTarget?.batch_no}</b> · 产品: <b>{signTarget?.product_name}</b>
          </div>
          {signType === 'qa' && (
            <div style={{ fontSize: 11, color: '#fa8c16', marginTop: 6 }}>
              ⚠️ QA批准后批记录将归档，请确认物料平衡率在 96~102% 范围内
            </div>
          )}
        </div>
        <Form form={signForm} onFinish={handleSign} layout="vertical">
          <Form.Item name="signName" label="签名人姓名" rules={[{ required: true, message: '请输入签名人姓名' }]}>
            <Input placeholder="请输入您的姓名" prefix={<EditOutlined />} />
          </Form.Item>
          <Form.Item name="password" label="验证密码" rules={[{ required: true, message: '请输入验证密码' }]}>
            <Input.Password placeholder="请输入登录密码以验证身份" />
          </Form.Item>
          <Form.Item name="opinion" label="审核意见">
            <Input.TextArea rows={2} placeholder="可填写审核意见（选填）" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default EbrListPageNew;

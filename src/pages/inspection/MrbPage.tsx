import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { getMrbRecordList } from '../../api/mrbRecords';
import {
  Alert, Badge, Button, Card, Col, Divider, Drawer, Form, Input,
  Modal, Row, Select, Space, Statistic, Table, Tag, Timeline,
  Typography, message, Radio,
} from 'antd';
import {
  AuditOutlined, CheckCircleOutlined, CloseCircleOutlined,
  ExclamationCircleOutlined, EyeOutlined, FileTextOutlined,
  ReloadOutlined, SearchOutlined, ToolOutlined, UserOutlined,
  WarningOutlined, StopOutlined, HistoryOutlined,
} from '@ant-design/icons';
import {
  InspectionTask, Disposition, Conclusion, SchemeType,
  SCHEME_TYPE_MAP, TASK_STATUS_MAP, CONCLUSION_MAP, DISPOSITION_MAP,
  QC_INSPECTORS, mockInspectionTasks,
} from './qmsData';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

// ─── 类型 ─────────────────────────────────────────────────────────────────────

type MrbStatus = 'PENDING' | 'REVIEWING' | 'RESOLVED' | 'CLOSED';
type MrbDecision = 'REWORK' | 'SCRAP' | 'CONCESSION' | 'SORTING' | 'RETEST';

interface MrbRecord {
  id: string;
  mrbNo: string;
  taskId: string;
  taskNo: string;
  schemeType: SchemeType;
  schemeName: string;
  batchNo: string;
  productModel?: string;
  woNo?: string;
  failItems: string[];
  conclusion: Conclusion;
  status: MrbStatus;
  // 评审
  reviewerId?: string;
  reviewerName?: string;
  decision?: MrbDecision;
  decisionRemark?: string;
  reviewTime?: string;
  // 跟踪
  reworkOpId?: string;
  capaNo?: string;
  createdAt: string;
}

const MRB_STATUS_MAP: Record<MrbStatus, { label: string; color: string }> = {
  PENDING:   { label: '待评审', color: 'warning' },
  REVIEWING: { label: '评审中', color: 'processing' },
  RESOLVED:  { label: '已处置', color: 'success' },
  CLOSED:    { label: '已关闭', color: 'default' },
};

const MRB_DECISION_MAP: Record<MrbDecision, { label: string; color: string; desc: string }> = {
  REWORK:      { label: '返工',     color: 'warning', desc: '退回指定工序重新加工' },
  SCRAP:       { label: '报废',     color: 'error',   desc: '整批报废，触发原料补充申请' },
  CONCESSION:  { label: '让步接收', color: 'gold',    desc: '上传让步接收审批单，有条件放行' },
  SORTING:     { label: '挑选使用', color: 'blue',    desc: '全检后挑选合格品使用' },
  RETEST:      { label: '复验',     color: 'purple',  desc: '申请复验，重新检验确认' },
};

// ─── Mock MRB 数据（天美健保健品不合格品评审记录）───────────────────────────

const initMrbRecords = (): MrbRecord[] => [
  {
    id: 'MRB001',
    mrbNo: 'MRB-20260520-001',
    taskId: 'IQC-TMJ-2605-007',
    taskNo: 'IT-20260520-007',
    schemeType: 'IQC',
    schemeName: 'VitC原料来料检验方案',
    batchNo: 'RM-VTC-20260520-002',
    productModel: 'L-抗坏血酸（VitC原料）药用级',
    failItems: ['含量（HPLC）', '重金属（铅）'],
    conclusion: 'FAIL',
    status: 'RESOLVED',
    reviewerId: 'QC004',
    reviewerName: '张伟',
    decision: 'SCRAP',
    decisionRemark: 'VitC含量98.2%（标准≥99.0%），铅含量3.2ppm（标准≤2ppm），全批退货，供应商出具整改报告后方可再次供货',
    reviewTime: '2026-05-20 11:00:00',
    capaNo: 'CAPA-TMJ-2605-001',
    createdAt: '2026-05-20 10:30:00',
  },
  {
    id: 'MRB002',
    mrbNo: 'MRB-20260528-002',
    taskId: 'IPQC-TMJ-2605-012',
    taskNo: 'IT-20260528-012',
    schemeType: 'IPQC',
    schemeName: 'VitC咀嚼片压片过程检验方案',
    batchNo: 'TMJ-VTC-20260528-001',
    productModel: 'VitC咀嚼片 100mg×60片/瓶',
    woNo: 'WO-TMJ-20260528-001',
    failItems: ['片重差异', '硬度'],
    conclusion: 'FAIL',
    status: 'REVIEWING',
    reviewerId: 'QC004',
    reviewerName: '张伟',
    createdAt: '2026-05-28 14:30:00',
  },
  {
    id: 'MRB003',
    mrbNo: 'MRB-20260601-003',
    taskId: 'IQC-TMJ-2606-003',
    taskNo: 'IT-20260601-003',
    schemeType: 'IQC',
    schemeName: '益生菌菌粉来料检验方案',
    batchNo: 'RM-PRO-20260601-001',
    productModel: '鼠李糖乳杆菌 LGG菌粉（活菌数≥2×10¹¹CFU/g）',
    failItems: ['活菌数', '温度记录'],
    conclusion: 'FAIL',
    status: 'RESOLVED',
    reviewerId: 'QC005',
    reviewerName: '王芳',
    decision: 'RETEST',
    decisionRemark: '活菌数1.8×10¹¹CFU/g（标准≥2×10¹¹），温控记录显示运输途中温度曾达12℃超标。复验同意：重新取样在低温条件下复检，同时要求供应商出具冷链运输证明',
    reviewTime: '2026-06-01 16:00:00',
    capaNo: 'CAPA-TMJ-2606-001',
    createdAt: '2026-06-01 14:00:00',
  },
  {
    id: 'MRB004',
    mrbNo: 'MRB-20260608-004',
    taskId: 'FQC-TMJ-2606-008',
    taskNo: 'IT-20260608-008',
    schemeType: 'FQC',
    schemeName: '复合益生菌胶囊成品检验方案',
    batchNo: 'TMJ-PRO-20260608-001',
    productModel: '复合益生菌胶囊 300mg×30粒/盒（冷链≤8℃）',
    woNo: 'WO-TMJ-20260608-001',
    failItems: ['活菌数', '水分'],
    conclusion: 'FAIL',
    status: 'PENDING',
    createdAt: '2026-06-08 10:00:00',
  },
];

// ─── 评审 Modal ───────────────────────────────────────────────────────────────

interface ReviewModalProps {
  record: MrbRecord | null;
  open: boolean;
  onClose: () => void;
  onSave: (id: string, decision: MrbDecision, remark: string, capaNo: string) => void;
}

const ReviewModal: React.FC<ReviewModalProps> = ({ record, open, onClose, onSave }) => {
  const [decision, setDecision] = useState<MrbDecision | undefined>();
  const [remark, setRemark]     = useState('');
  const [capaNo, setCapaNo]     = useState('');
  const [form] = Form.useForm();

  if (!record) return null;

  function handleOk() {
    if (!record)   return;
    if (!decision) { message.warning('请选择处置决定'); return; }
    if (!remark)   { message.warning('请填写处置说明'); return; }
    onSave(record.id, decision, remark, capaNo);
    setDecision(undefined); setRemark(''); setCapaNo('');
  }

  return (
    <Modal
      title={<Space><AuditOutlined />MRB评审 — {record.mrbNo}</Space>}
      open={open}
      onCancel={onClose}
      onOk={handleOk}
      okText="确认评审结论"
      width={680}
    >
      {/* 基本信息 */}
      <Card size="small" style={{ marginBottom: 16, background: '#fff7e6' }}>
        <Row gutter={[12, 8]}>
          <Col span={12}><Text type="secondary">检验任务：</Text><Text strong>{record.taskNo}</Text></Col>
          <Col span={12}><Text type="secondary">批次号：</Text><Text strong>{record.batchNo}</Text></Col>
          <Col span={12}><Text type="secondary">检验类型：</Text>
            <Tag color={SCHEME_TYPE_MAP[record.schemeType]?.color}>
              {SCHEME_TYPE_MAP[record.schemeType]?.label}
            </Tag>
          </Col>
          <Col span={12}><Text type="secondary">检验方案：</Text>{record.schemeName}</Col>
          <Col span={24}>
            <Text type="secondary">不合格项：</Text>
            {record.failItems.map(f => <Tag color="error" key={f}>{f}</Tag>)}
          </Col>
        </Row>
      </Card>

      <Alert
        type="error"
        showIcon
        message="不合格品处置决定"
        description="MRB 评审需由质量工程师确认处置方案，并记录 CAPA 编号"
        style={{ marginBottom: 16 }}
      />

      {/* 处置决定 */}
      <Form layout="vertical">
        <Form.Item label="处置决定" required>
          <Radio.Group value={decision} onChange={e => setDecision(e.target.value)}>
            <Space direction="vertical">
              {Object.entries(MRB_DECISION_MAP).map(([k, v]) => (
                <Radio key={k} value={k}>
                  <Tag color={v.color}>{v.label}</Tag>
                  <Text type="secondary" style={{ fontSize: 12 }}>{v.desc}</Text>
                </Radio>
              ))}
            </Space>
          </Radio.Group>
        </Form.Item>

        <Form.Item label="处置说明" required>
          <TextArea
            rows={3}
            value={remark}
            onChange={e => setRemark(e.target.value)}
            placeholder="详细说明处置原因、措施及责任人"
          />
        </Form.Item>

        <Form.Item label="关联 CAPA 编号">
          <Input
            value={capaNo}
            onChange={e => setCapaNo(e.target.value)}
            placeholder="CAPA-YYYY-NNN（如已建立CAPA请填写）"
            style={{ width: 260 }}
          />
        </Form.Item>

        <Form.Item label="评审人">
          <Select defaultValue="QC004" style={{ width: 200 }}>
            {QC_INSPECTORS.filter(q => q.role.includes('QA')).map(q => (
              <Option key={q.id} value={q.id}>{q.name} — {q.role}</Option>
            ))}
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

// ─── 详情 Drawer ──────────────────────────────────────────────────────────────

interface DetailDrawerProps {
  record: MrbRecord | null;
  task: InspectionTask | null;
  open: boolean;
  onClose: () => void;
}

const DetailDrawer: React.FC<DetailDrawerProps> = ({ record, task, open, onClose }) => {
  if (!record) return null;
  return (
    <Drawer
      title={<Space><FileTextOutlined />MRB 评审单详情</Space>}
      open={open}
      onClose={onClose}
      width={580}
    >
      {/* MRB 信息 */}
      <Card size="small" title="评审单信息" style={{ marginBottom: 16 }}>
        <Row gutter={[12, 8]}>
          <Col span={12}><Text type="secondary">MRB 编号：</Text><Text strong>{record.mrbNo}</Text></Col>
          <Col span={12}>
            <Text type="secondary">状态：</Text>
            <Badge status={
              record.status === 'REVIEWING' ? 'processing' :
              record.status === 'RESOLVED'  ? 'success' : 'default'
            } text={(MRB_STATUS_MAP[record.status] ?? { label: String(record.status ?? '-') }).label} />
          </Col>
          <Col span={12}><Text type="secondary">检验任务：</Text>{record.taskNo}</Col>
          <Col span={12}><Text type="secondary">批次号：</Text><Text strong>{record.batchNo}</Text></Col>
          <Col span={12}><Text type="secondary">产品型号：</Text>{record.productModel || '—'}</Col>
          <Col span={12}><Text type="secondary">关联工单：</Text>{record.woNo || '—'}</Col>
          <Col span={24}>
            <Text type="secondary">不合格项：</Text>
            {record.failItems.map(f => <Tag color="error" key={f}>{f}</Tag>)}
          </Col>
          <Col span={24}>
            <Text type="secondary">检验结论：</Text>
            <Tag color={CONCLUSION_MAP[record.conclusion]?.color}>
              {CONCLUSION_MAP[record.conclusion]?.label}
            </Tag>
          </Col>
        </Row>
      </Card>

      {/* 处置结论 */}
      {record.decision && (
        <Card size="small" title="处置结论" style={{ marginBottom: 16 }}>
          <Row gutter={[12, 8]}>
            <Col span={12}>
              <Text type="secondary">处置决定：</Text>
              <Tag color={(MRB_DECISION_MAP[record.decision] ?? { color: 'default' }).color}>
                {(MRB_DECISION_MAP[record.decision] ?? { label: String(record.decision ?? '-') }).label}
              </Tag>
            </Col>
            <Col span={12}><Text type="secondary">评审人：</Text>{record.reviewerName}</Col>
            <Col span={12}><Text type="secondary">评审时间：</Text>{record.reviewTime}</Col>
            {record.capaNo && (
              <Col span={12}><Text type="secondary">CAPA 编号：</Text><Tag color="blue">{record.capaNo}</Tag></Col>
            )}
            {record.decisionRemark && (
              <Col span={24}>
                <Text type="secondary">处置说明：</Text>
                <div style={{ background: '#f5f5f5', padding: 8, borderRadius: 4, marginTop: 4 }}>
                  {record.decisionRemark}
                </div>
              </Col>
            )}
          </Row>
        </Card>
      )}

      {/* 检验数据 */}
      {task && (
        <Card size="small" title="检验数据明细">
          <Table
            dataSource={task.items}
            rowKey="itemCode"
            pagination={false}
            size="small"
            columns={[
              { title: '检验项', dataIndex: 'itemName', render: (v: string, r: any) => (
                <Space>{r.isCritical && <Tag color="red" style={{ fontSize: 10 }}>关键</Tag>}{v}</Space>
              )},
              { title: '标准值', render: (_: any, r: any) =>
                r.standardValue ? `${r.standardValue} ${r.unit || ''}` :
                r.enumOptions ? r.enumOptions.join('/') : '—'
              },
              { title: '实测值', render: (_: any, r: any) =>
                r.actualValue !== undefined && r.actualValue !== '' ?
                `${r.actualValue} ${r.unit || ''}` : <Text type="secondary">—</Text>
              },
              { title: '判定', dataIndex: 'result', render: (v: string) =>
                v === 'PASS' ? <Tag color="success">合格</Tag> :
                v === 'FAIL' ? <Tag color="error">不合格</Tag> :
                <Tag color="default">待检</Tag>
              },
            ]}
            rowClassName={(r: any) => r.result === 'FAIL' ? 'row-fail-mrb' : ''}
          />
        </Card>
      )}

      {/* 时间线 */}
      <Card size="small" title="处置时间线" style={{ marginTop: 16 }}>
        <Timeline
          items={[
            { color: 'red', children: <><Text strong>检验不合格</Text><br /><Text type="secondary">{record.createdAt} 触发 MRB 评审</Text></> },
            record.status !== 'PENDING' ? {
              color: 'blue',
              children: <><Text strong>MRB 评审开始</Text><br /><Text type="secondary">评审人：{record.reviewerName}</Text></>,
            } : { color: 'gray', children: <Text type="secondary">等待评审...</Text> },
            record.decision ? {
              color: 'green',
              children: <><Text strong>处置决定：{(MRB_DECISION_MAP[record.decision] ?? { label: String(record.decision ?? '-') }).label}</Text><br /><Text type="secondary">{record.reviewTime}</Text></>,
            } : null,
          ].filter(Boolean) as any[]}
        />
      </Card>

      <style>{`.row-fail-mrb { background: #fff2f0 !important; }`}</style>
    </Drawer>
  );
};

// ─── MRB 卡片 ─────────────────────────────────────────────────────────────────

interface MrbCardProps {
  record: MrbRecord;
  onView: () => void;
  onReview: () => void;
}

const MrbCard: React.FC<MrbCardProps> = ({ record, onView, onReview }) => {
  const statusInfo = MRB_STATUS_MAP[record.status];
  return (
    <Card
      size="small"
      style={{
        marginBottom: 10,
        borderLeft: `4px solid ${record.status === 'PENDING' || record.status === 'REVIEWING' ? '#ff4d4f' : '#52c41a'}`,
      }}
      bodyStyle={{ padding: '10px 14px' }}
    >
      <Row align="middle" gutter={8}>
        <Col flex="1">
          <Space size={6} wrap>
            <Text strong style={{ fontSize: 13 }}>{record.mrbNo}</Text>
            <Tag color={SCHEME_TYPE_MAP[record.schemeType]?.color} style={{ fontSize: 11 }}>
              {SCHEME_TYPE_MAP[record.schemeType]?.label}
            </Tag>
            <Badge
              status={statusInfo.color as any}
              text={<Text style={{ fontSize: 12 }}>{statusInfo.label}</Text>}
            />
            {record.decision && (
              <Tag color={(MRB_DECISION_MAP[record.decision] ?? { color: 'default' }).color}>
                {(MRB_DECISION_MAP[record.decision] ?? { label: String(record.decision ?? '-') }).label}
              </Tag>
            )}
          </Space>
          <br />
          <Space size={16} style={{ marginTop: 4 }} wrap>
            <Text type="secondary" style={{ fontSize: 12 }}>方案：{record.schemeName}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>批次：<Text strong>{record.batchNo}</Text></Text>
            {record.woNo && <Text type="secondary" style={{ fontSize: 12 }}>工单：{record.woNo}</Text>}
            <Space size={4}>
              <WarningOutlined style={{ color: '#ff4d4f' }} />
              <Text style={{ fontSize: 12, color: '#ff4d4f' }}>
                不合格项：{record.failItems.join('、')}
              </Text>
            </Space>
            {record.capaNo && (
              <Tag color="blue" style={{ fontSize: 11 }}><HistoryOutlined /> {record.capaNo}</Tag>
            )}
          </Space>
        </Col>
        <Col>
          <Space size={4}>
            <Button size="small" icon={<EyeOutlined />} onClick={onView}>详情</Button>
            {(record.status === 'PENDING' || record.status === 'REVIEWING') && (
              <Button size="small" type="primary" danger icon={<AuditOutlined />} onClick={onReview}>
                评审
              </Button>
            )}
          </Space>
        </Col>
      </Row>
    </Card>
  );
};

// ─── 主页面 ───────────────────────────────────────────────────────────────────

const MrbPage: React.FC = () => {
  const [records, setRecords] = useLocalStorage<MrbRecord[]>('bip_mrb_records', initMrbRecords());
  const [searchText, setSearch]   = useState('');
  const [statusFilter, setStatus] = useState<MrbStatus | 'ALL'>('ALL');
  const [detailRecord, setDetail] = useState<MrbRecord | null>(null);
  const [reviewRecord, setReview] = useState<MrbRecord | null>(null);
  const [msgApi, ctxHolder]       = message.useMessage();

  // ── loadFromApi: 合并后端MRB数据 ──
  const loadFromApi = useCallback(async () => {
    try {
      const resp = await getMrbRecordList() as any;
      const apiList: any[] = resp?.data ?? [];
      if (apiList.length > 0) {
        const mapped: MrbRecord[] = apiList.map((item: any) => ({
          id: `api-${item.id}`,
          mrbNo: item.mrbNo ?? `MRB-${item.id}`,
          taskId: item.taskId ? String(item.taskId) : '',
          taskNo: item.taskId ? String(item.taskId) : '',
          schemeType: 'FQC' as SchemeType,
          schemeName: item.failureType ?? 'MRB',
          batchNo: item.batchNo ?? '',
          woNo: '',
          failItems: item.failureDesc ? [item.failureDesc] : [],
          conclusion: 'FAIL' as Conclusion,
          status: (['PENDING','REVIEWING','RESOLVED','CLOSED'].includes(item.status ?? '')
            ? item.status : 'PENDING') as MrbStatus,
          reviewerName: item.dispositionBy ?? '',
          decision: undefined,
          decisionRemark: item.dispositionDesc ?? '',
          reviewTime: item.dispositionTime ?? '',
          createdAt: item.createTime ?? new Date().toLocaleString(),
        }));
        setRecords(mapped);  // API-first REPLACE
      }
    } catch { /* backend offline */ }
  }, [setRecords]);

  useEffect(() => { loadFromApi(); }, [loadFromApi]);

  // 联动检验任务
  const detailTask = useMemo(() => {
    if (!detailRecord) return null;
    return mockInspectionTasks.find(t => t.id === detailRecord.taskId) || null;
  }, [detailRecord]);

  const filtered = useMemo(() => {
    return records.filter(r => {
      const matchSearch = !searchText ||
        r.mrbNo.includes(searchText) ||
        r.batchNo.includes(searchText) ||
        r.taskNo.includes(searchText);
      const matchStatus = statusFilter === 'ALL' || r.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [records, searchText, statusFilter]);

  const kpi = useMemo(() => ({
    pending:   records.filter(r => r.status === 'PENDING').length,
    reviewing: records.filter(r => r.status === 'REVIEWING').length,
    resolved:  records.filter(r => r.status === 'RESOLVED').length,
    total:     records.length,
  }), [records]);

  function handleReviewSave(id: string, decision: MrbDecision, remark: string, capaNo: string) {
    setRecords(prev => prev.map(r => r.id === id ? {
      ...r,
      status: 'RESOLVED',
      decision,
      decisionRemark: remark,
      capaNo: capaNo || undefined,
      reviewTime: new Date().toLocaleString(),
      reviewerName: '张伟',
    } : r));
    setReview(null);
    msgApi.success(`MRB 评审完成，处置决定：${(MRB_DECISION_MAP[decision] ?? { label: String(decision ?? '-') }).label}`);
  }

  return (
    <div style={{ padding: '16px 20px', background: '#f5f6fa', minHeight: '100vh' }}>
      {ctxHolder}

      <div style={{ marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>
          <FileTextOutlined style={{ marginRight: 8, color: '#ff4d4f' }} />
          MRB 不合格品评审
        </Title>
        <Text type="secondary">Material Review Board — 不合格品处置决策中心</Text>
      </div>

      {/* KPI */}
      <Row gutter={12} style={{ marginBottom: 16 }}>
        {[
          { title: '待评审', value: kpi.pending,   color: '#ff4d4f', filter: 'PENDING' },
          { title: '评审中', value: kpi.reviewing, color: '#faad14', filter: 'REVIEWING' },
          { title: '已处置', value: kpi.resolved,  color: '#52c41a', filter: 'RESOLVED' },
          { title: '合计',   value: kpi.total,     color: '#595959', filter: 'ALL' },
        ].map(item => (
          <Col key={item.filter} span={6}>
            <Card
              size="small"
              hoverable
              style={{
                borderTop: `3px solid ${item.color}`,
                cursor: 'pointer',
                background: statusFilter === item.filter ? '#e6f4ff' : '#fff',
              }}
              bodyStyle={{ padding: '10px 14px' }}
              onClick={() => setStatus(item.filter as any)}
            >
              <div style={{ color: '#8c8c8c', fontSize: 12 }}>{item.title}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: item.color }}>{item.value}</div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* 待评审预警 */}
      {kpi.pending > 0 && (
        <Alert
          type="error"
          showIcon
          icon={<ExclamationCircleOutlined />}
          message={`当前有 ${kpi.pending} 条不合格记录待评审，请及时处置！`}
          style={{ marginBottom: 12 }}
        />
      )}

      {/* 工具栏 */}
      <Card size="small" style={{ marginBottom: 12 }} bodyStyle={{ padding: '8px 12px' }}>
        <Row justify="space-between">
          <Col>
            <Space>
              <Input
                placeholder="搜索MRB编号/批次/任务"
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={e => setSearch(e.target.value)}
                style={{ width: 240 }}
                allowClear
              />
              <Select value={statusFilter} onChange={v => setStatus(v)} style={{ width: 130 }}>
                <Option value="ALL">全部状态</Option>
                {Object.entries(MRB_STATUS_MAP).map(([k, v]) => (
                  <Option key={k} value={k}>{v.label}</Option>
                ))}
              </Select>
              <Button icon={<ReloadOutlined />} onClick={() => { setSearch(''); setStatus('ALL'); }}>重置</Button>
            </Space>
          </Col>
          <Col><Text type="secondary" style={{ fontSize: 12 }}>共 {filtered.length} 条</Text></Col>
        </Row>
      </Card>

      {/* 列表 */}
      {filtered.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: 40 }}>
          <CheckCircleOutlined style={{ fontSize: 40, color: '#52c41a', display: 'block', marginBottom: 12 }} />
          <Text type="secondary">暂无不合格品待评审，质量状态良好</Text>
        </Card>
      ) : (
        filtered.map(r => (
          <MrbCard
            key={r.id}
            record={r}
            onView={() => setDetail(r)}
            onReview={() => setReview(r)}
          />
        ))
      )}

      {/* 详情 */}
      <DetailDrawer record={detailRecord} task={detailTask} open={!!detailRecord} onClose={() => setDetail(null)} />

      {/* 评审 Modal */}
      <ReviewModal record={reviewRecord} open={!!reviewRecord} onClose={() => setReview(null)} onSave={handleReviewSave} />
    </div>
  );
};

export default MrbPage;

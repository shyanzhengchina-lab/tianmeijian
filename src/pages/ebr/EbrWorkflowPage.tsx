/**
 * EbrWorkflowPage.tsx — 电子批记录完整审批工作流
 * ================================================================
 * PRD §5 完整实现：
 *   - BatchRecord: DRAFT → IN_PROGRESS → UNDER_REVIEW → APPROVED → ARCHIVED
 *   - 三级电子签名：操作人 / 审核人 / QA审批
 *   - 工序记录（br_operation）可视化
 *   - 批记录审批五步骤流程
 *   - GMP合规：ALCOA+ 字段展示
 * ================================================================
 */
import React, { useState, useMemo } from 'react';
import {
  Card, Table, Tag, Button, Modal, Form, Input, Select, Steps,
  Space, Row, Col, Statistic, Alert, Descriptions, Timeline,
  Divider, Typography, Badge, Tabs, Progress, message, Tooltip,
  Checkbox, DatePicker, Popconfirm,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  FileDoneOutlined, CheckCircleOutlined, ClockCircleOutlined,
  AuditOutlined, SafetyCertificateOutlined, UserOutlined,
  FileTextOutlined, LockOutlined, UnlockOutlined, EditOutlined,
  SendOutlined, EyeOutlined, WarningOutlined, PlusOutlined,
  HistoryOutlined, TeamOutlined, PrinterOutlined, StarOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Text, Title, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

// ── 类型定义（PRD §1.1 BatchRecord）─────────────────────────────
type BatchRecordStatus = 'DRAFT' | 'IN_PROGRESS' | 'UNDER_REVIEW' | 'APPROVED' | 'ARCHIVED' | 'REJECTED';
type OpRecordStatus = 'PENDING' | 'PRE_CHECK' | 'IN_PROGRESS' | 'COMPLETED' | 'DEVIATION' | 'SKIP';
type SignType = 'OPERATE' | 'REVIEW' | 'QA_APPROVE';

interface ElectronicSignature {
  userId: string;
  userName: string;
  role: string;
  signType: SignType;
  signedAt: string;
  meaning: string;
  ipAddress: string;
}

interface OperationRecord {
  recordId: string;
  operationCode: string;
  operationName: string;
  operationSeq: number;
  status: OpRecordStatus;
  actualStart: string | null;
  actualEnd: string | null;
  operatorName: string | null;
  reviewerName: string | null;
  qaCheckerName: string | null;
  temperature?: string;
  humidity?: string;
  materialBalanceRate?: number;
  materialBalanceStatus?: 'WITHIN_RANGE' | 'BELOW_LOWER_LIMIT' | 'ABOVE_UPPER_LIMIT' | 'NOT_APPLICABLE';
  yieldRate?: number;
  deviationId?: string;
  remarks?: string;
}

interface BatchRecord {
  id: string;
  brId: string;        // BR-WO-YYYYMMDD-NNNN
  brType: 'PRODUCTION' | 'PACKAGING';
  woNumber: string;
  productCode: string;
  productName: string;
  batchNo: string;
  batchSize: number;
  dosageForm: string;
  produceDate: string;
  expiryDate: string;
  workshopName: string;
  status: BatchRecordStatus;
  operations: OperationRecord[];
  // 签名
  submittedBy?: string;
  submittedAt?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  approvedByQa?: string;
  approvedAtQa?: string;
  // 关联
  signatures: ElectronicSignature[];
  createdAt: string;
}

// ── 状态映射 ───────────────────────────────────────────────────
const BR_STATUS: Record<BatchRecordStatus, { label: string; color: string; step: number; icon: React.ReactNode }> = {
  DRAFT:        { label: '草稿', color: 'default', step: 0, icon: <EditOutlined /> },
  IN_PROGRESS:  { label: '执行中', color: 'processing', step: 1, icon: <ClockCircleOutlined /> },
  UNDER_REVIEW: { label: '审核中', color: 'warning', step: 2, icon: <AuditOutlined /> },
  APPROVED:     { label: 'QA已批准', color: 'success', step: 3, icon: <SafetyCertificateOutlined /> },
  ARCHIVED:     { label: '已归档', color: 'cyan', step: 4, icon: <FileDoneOutlined /> },
  REJECTED:     { label: '已驳回', color: 'error', step: -1, icon: <WarningOutlined /> },
};

const OP_STATUS: Record<OpRecordStatus, { label: string; color: string }> = {
  PENDING:     { label: '待执行', color: 'default' },
  PRE_CHECK:   { label: '再确认中', color: 'processing' },
  IN_PROGRESS: { label: '执行中', color: 'blue' },
  COMPLETED:   { label: '已完工', color: 'success' },
  DEVIATION:   { label: '偏差拦截', color: 'error' },
  SKIP:        { label: '已跳过', color: 'warning' },
};

// ── 演示数据 ───────────────────────────────────────────────────
function makeOps(batchNo: string): OperationRecord[] {
  const isGranule = batchNo.includes('001');
  return [
    { recordId: `${batchNo}-OP01`, operationCode: 'GD-01', operationName: '称量配料', operationSeq: 1, status: 'COMPLETED',
      actualStart: '2026-06-01 08:15', actualEnd: '2026-06-01 11:20', operatorName: '张建国', reviewerName: '李慧敏', qaCheckerName: 'QA-王芳',
      temperature: '22~24', humidity: '45~55', materialBalanceRate: undefined, materialBalanceStatus: 'NOT_APPLICABLE', remarks: '所有物料四重核对通过' },
    { recordId: `${batchNo}-OP02`, operationCode: 'GD-02', operationName: '混合', operationSeq: 2, status: 'COMPLETED',
      actualStart: '2026-06-01 13:00', actualEnd: '2026-06-01 15:30', operatorName: '张建国', reviewerName: '李慧敏', qaCheckerName: 'QA-王芳',
      temperature: '22~24', humidity: '45~55', materialBalanceRate: 98.4, materialBalanceStatus: 'WITHIN_RANGE', remarks: '混合时间20min，均匀性RSD 3.2%' },
    { recordId: `${batchNo}-OP03`, operationCode: 'GD-03', operationName: '制粒', operationSeq: 3, status: 'COMPLETED',
      actualStart: '2026-06-02 08:00', actualEnd: '2026-06-02 12:00', operatorName: '李慧敏', reviewerName: '张建国', qaCheckerName: 'QA-王芳',
      temperature: '22~24', humidity: '40~50', materialBalanceRate: 97.15, materialBalanceStatus: 'WITHIN_RANGE' },
    { recordId: `${batchNo}-OP04`, operationCode: 'GD-04', operationName: '干燥', operationSeq: 4, status: 'COMPLETED',
      actualStart: '2026-06-02 13:00', actualEnd: '2026-06-02 19:00', operatorName: '王大力', reviewerName: '李慧敏', qaCheckerName: 'QA-王芳',
      temperature: '70±5', humidity: '-', materialBalanceRate: 98.74, materialBalanceStatus: 'WITHIN_RANGE', remarks: '水分控制在3.5%' },
    { recordId: `${batchNo}-OP05`, operationCode: 'GD-05', operationName: '压片', operationSeq: 5, status: isGranule ? 'COMPLETED' : 'IN_PROGRESS',
      actualStart: '2026-06-03 08:00', actualEnd: isGranule ? '2026-06-03 16:00' : null, operatorName: isGranule ? '王大力' : null, reviewerName: isGranule ? '张建国' : null, qaCheckerName: isGranule ? 'QA-王芳' : null,
      temperature: '22~24', humidity: '45~55', materialBalanceRate: isGranule ? 98.11 : undefined, materialBalanceStatus: isGranule ? 'WITHIN_RANGE' : undefined },
    { recordId: `${batchNo}-OP06`, operationCode: 'GD-06', operationName: '铝塑包装', operationSeq: 6, status: isGranule ? 'COMPLETED' : 'PENDING',
      actualStart: isGranule ? '2026-06-04 08:00' : null, actualEnd: isGranule ? '2026-06-04 14:00' : null, operatorName: isGranule ? '陈小红' : null, reviewerName: isGranule ? '王大力' : null, qaCheckerName: isGranule ? 'QA-王芳' : null,
      materialBalanceRate: isGranule ? 97.8 : undefined, materialBalanceStatus: isGranule ? 'WITHIN_RANGE' : undefined },
    { recordId: `${batchNo}-OP07`, operationCode: 'GD-07', operationName: '外包装', operationSeq: 7, status: isGranule ? 'COMPLETED' : 'PENDING',
      actualStart: isGranule ? '2026-06-04 15:00' : null, actualEnd: isGranule ? '2026-06-04 18:00' : null, operatorName: isGranule ? '陈小红' : null, reviewerName: isGranule ? '王大力' : null, qaCheckerName: isGranule ? 'QA-王芳' : null,
      materialBalanceRate: isGranule ? 98.5 : undefined, materialBalanceStatus: isGranule ? 'WITHIN_RANGE' : undefined, yieldRate: isGranule ? 97.2 : undefined },
  ];
}

const DEMO_BATCH_RECORDS: BatchRecord[] = [
  {
    id: 'BR001', brId: 'BR-WO-20260601-0001', brType: 'PRODUCTION',
    woNumber: 'WO-20260601-0001', productCode: 'TMJ-TAB-025', productName: '维生素C片 500mg×60片',
    batchNo: 'B20260601001', batchSize: 90000, dosageForm: '片剂(TAB)',
    produceDate: '2026-06-01', expiryDate: '2028-06-01', workshopName: '固体车间',
    status: 'APPROVED', createdAt: '2026-06-01 07:30',
    submittedBy: '张建国', submittedAt: '2026-06-04 18:30',
    reviewedBy: '车间主管-刘明', reviewedAt: '2026-06-05 09:20',
    approvedByQa: 'QA经理-王芳', approvedAtQa: '2026-06-05 14:00',
    operations: makeOps('B20260601001'),
    signatures: [
      { userId: 'U001', userName: '张建国', role: '操作员', signType: 'OPERATE', signedAt: '2026-06-04 18:28', meaning: '确认本人执行了所述操作，记录真实准确', ipAddress: '192.168.1.101' },
      { userId: 'U002', userName: '刘明', role: '车间主管', signType: 'REVIEW', signedAt: '2026-06-05 09:18', meaning: '确认已复核操作记录，内容完整准确', ipAddress: '192.168.1.102' },
      { userId: 'U003', userName: '王芳', role: 'QA经理', signType: 'QA_APPROVE', signedAt: '2026-06-05 13:58', meaning: '确认质量符合要求，允许成品放行', ipAddress: '192.168.1.105' },
    ],
  },
  {
    id: 'BR002', brId: 'BR-WO-20260603-0002', brType: 'PRODUCTION',
    woNumber: 'WO-20260603-0002', productCode: 'TMJ-SGC-028', productName: '鱼油软胶囊 1000mg×60粒',
    batchNo: 'B20260603002', batchSize: 60000, dosageForm: '软胶囊(SGC)',
    produceDate: '2026-06-03', expiryDate: '2028-06-03', workshopName: '软胶囊车间',
    status: 'IN_PROGRESS', createdAt: '2026-06-03 08:00',
    operations: makeOps('B20260603002'), signatures: [],
  },
  {
    id: 'BR003', brId: 'BR-WO-20260605-0003', brType: 'PRODUCTION',
    woNumber: 'WO-20260605-0003', productCode: 'TMJ-COL-030', productName: '胶原蛋白液体饮料 10ml×30支',
    batchNo: 'B20260605003', batchSize: 50000, dosageForm: '口服液(LIQ)',
    produceDate: '2026-06-05', expiryDate: '2027-12-05', workshopName: '液体车间',
    status: 'UNDER_REVIEW', createdAt: '2026-06-05 08:00',
    submittedBy: '陈小红', submittedAt: '2026-06-07 17:00',
    operations: makeOps('B20260605003'), signatures: [
      { userId: 'U004', userName: '陈小红', role: '操作员', signType: 'OPERATE', signedAt: '2026-06-07 16:58', meaning: '确认本人执行了所述操作，记录真实准确', ipAddress: '192.168.1.103' },
    ],
  },
];

// ── 主组件 ────────────────────────────────────────────────────
const EbrWorkflowPage: React.FC = () => {
  const [records, setRecords] = useState<BatchRecord[]>(DEMO_BATCH_RECORDS);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selected, setSelected] = useState<BatchRecord | null>(null);
  const [signModalVisible, setSignModalVisible] = useState(false);
  const [signType, setSignType] = useState<'submit' | 'review' | 'qa_approve' | 'reject'>('submit');
  const [rejectModal, setRejectModal] = useState(false);
  const [signForm] = Form.useForm();
  const [rejectForm] = Form.useForm();

  // ── 统计 ──
  const stats = useMemo(() => ({
    total: records.length,
    draft: records.filter(r => r.status === 'DRAFT').length,
    inProgress: records.filter(r => r.status === 'IN_PROGRESS').length,
    underReview: records.filter(r => r.status === 'UNDER_REVIEW').length,
    approved: records.filter(r => r.status === 'APPROVED').length,
    archived: records.filter(r => r.status === 'ARCHIVED').length,
  }), [records]);

  // ── 操作处理 ──
  const handleAction = (record: BatchRecord, action: typeof signType) => {
    setSelected(record);
    setSignType(action);
    signForm.resetFields();
    setSignModalVisible(true);
  };

  const doTransition = () => {
    if (!selected) return;
    signForm.validateFields().then(vals => {
      setRecords(prev => prev.map(r => {
        if (r.id !== selected.id) return r;
        const now = dayjs().format('YYYY-MM-DD HH:mm');
        const sig: ElectronicSignature = {
          userId: vals.userId || 'U_SYS',
          userName: vals.userName || vals.userId,
          role: signType === 'submit' ? '操作员' : signType === 'review' ? '车间主管' : 'QA经理',
          signType: signType === 'submit' ? 'OPERATE' : signType === 'review' ? 'REVIEW' : 'QA_APPROVE',
          signedAt: now,
          meaning: signType === 'submit' ? '确认记录真实准确，申请审核' : signType === 'review' ? '审核完毕，转QA审批' : '确认质量合格，批准放行',
          ipAddress: '192.168.1.100',
        };
        const newStatus: BatchRecordStatus = signType === 'submit' ? 'UNDER_REVIEW' : signType === 'review' ? 'APPROVED' : 'ARCHIVED';
        return { ...r, status: newStatus, signatures: [...r.signatures, sig],
          ...(signType === 'submit' ? { submittedBy: sig.userName, submittedAt: now } : {}),
          ...(signType === 'review' ? { reviewedBy: sig.userName, reviewedAt: now } : {}),
          ...(signType === 'qa_approve' ? { approvedByQa: sig.userName, approvedAtQa: now } : {}),
        };
      }));
      setSignModalVisible(false);
      message.success(`操作成功 ✅`);
    });
  };

  const doReject = () => {
    if (!selected) return;
    rejectForm.validateFields().then(() => {
      setRecords(prev => prev.map(r => r.id === selected.id ? { ...r, status: 'REJECTED' } : r));
      setRejectModal(false);
      message.warning('批记录已驳回');
    });
  };

  // ── 表格列 ──
  const columns: ColumnsType<BatchRecord> = [
    { title: '批记录编号', dataIndex: 'brId', width: 180, render: v => <Text code style={{ fontSize: 12 }}>{v}</Text> },
    { title: '工单', dataIndex: 'woNumber', width: 150, render: v => <Text code>{v}</Text> },
    { title: '产品', dataIndex: 'productName', width: 180 },
    { title: '批号', dataIndex: 'batchNo', width: 130, render: v => <Tag color="blue">{v}</Tag> },
    { title: '剂型', dataIndex: 'dosageForm', width: 90, render: v => <Tag>{v}</Tag> },
    { title: '车间', dataIndex: 'workshopName', width: 90 },
    { title: '状态', dataIndex: 'status', width: 110, render: (v: BatchRecordStatus) => (
      <Badge status={v === 'IN_PROGRESS' ? 'processing' : v === 'APPROVED' ? 'success' : v === 'REJECTED' ? 'error' : 'default'}
        text={<Tag color={BR_STATUS[v].color}>{BR_STATUS[v].icon} {BR_STATUS[v].label}</Tag>}
      />
    )},
    { title: '工序完成', width: 120, render: (_, r) => {
      const done = r.operations.filter(o => o.status === 'COMPLETED' || o.status === 'SKIP').length;
      const total = r.operations.length;
      return <Progress percent={Math.round(done / total * 100)} size="small" style={{ width: 90 }} />;
    }},
    { title: '创建时间', dataIndex: 'createdAt', width: 130 },
    { title: '操作', width: 200, fixed: 'right', render: (_, r) => (
      <Space size={4}>
        <Button size="small" type="link" icon={<EyeOutlined />} onClick={() => { setSelected(r); setDetailVisible(true); }}>详情</Button>
        {r.status === 'IN_PROGRESS' && (
          <Button size="small" type="primary" icon={<SendOutlined />} onClick={() => handleAction(r, 'submit')}>提交审核</Button>
        )}
        {r.status === 'UNDER_REVIEW' && (
          <>
            <Button size="small" type="primary" icon={<CheckCircleOutlined />} onClick={() => handleAction(r, 'review')}>审核通过</Button>
            <Button size="small" danger icon={<WarningOutlined />} onClick={() => { setSelected(r); setRejectModal(true); }}>驳回</Button>
          </>
        )}
        {r.status === 'APPROVED' && (
          <Button size="small" icon={<FileDoneOutlined />} onClick={() => handleAction(r, 'qa_approve')}>QA归档</Button>
        )}
      </Space>
    )},
  ];

  return (
    <div style={{ padding: '0 4px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>
          <AuditOutlined style={{ color: '#1677ff', marginRight: 8 }} />
          电子批记录（EBR）审批工作流
        </Title>
        <Space>
          <Button icon={<PrinterOutlined />}>导出PDF</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => message.info('请从工单页面创建批记录')}>关联工单创建</Button>
        </Space>
      </div>

      {/* 统计 */}
      <Row gutter={12} style={{ marginBottom: 16 }}>
        {[
          { label: '批记录总数', value: stats.total, color: '#1677ff' },
          { label: '执行中', value: stats.inProgress, color: '#faad14' },
          { label: '审核中', value: stats.underReview, color: '#fa8c16' },
          { label: 'QA已批准', value: stats.approved, color: '#52c41a' },
          { label: '已归档', value: stats.archived, color: '#13c2c2' },
        ].map((s, i) => (
          <Col span={i === 0 ? 4 : 5} key={i}>
            <Card size="small" style={{ borderLeft: `3px solid ${s.color}`, textAlign: 'center' }}>
              <Statistic title={s.label} value={s.value} valueStyle={{ color: s.color, fontSize: 20 }} />
            </Card>
          </Col>
        ))}
      </Row>

      {/* 流程图 */}
      <Card size="small" style={{ marginBottom: 12 }}>
        <Steps size="small" current={-1} items={[
          { title: '草稿', description: '工单下达自动创建', icon: <EditOutlined />, status: 'finish' },
          { title: '执行中', description: '工序逐一完工', icon: <ClockCircleOutlined />, status: 'finish' },
          { title: '待审核', description: '车间主管审核', icon: <AuditOutlined />, status: 'process' },
          { title: 'QA批准', description: 'QA经理放行', icon: <SafetyCertificateOutlined />, status: 'wait' },
          { title: '已归档', description: '电子归档完成', icon: <FileDoneOutlined />, status: 'wait' },
        ]} />
      </Card>

      <Table columns={columns} dataSource={records} rowKey="id" size="small" scroll={{ x: 1400 }} />

      {/* 详情抽屉 */}
      <Modal title={<Space><FileTextOutlined />批记录详情 — {selected?.brId}</Space>}
        open={detailVisible} onCancel={() => setDetailVisible(false)}
        footer={null} width={900}
      >
        {selected && (
          <Tabs defaultActiveKey="info" type="card">
            <Tabs.TabPane tab="基本信息" key="info">
              <Descriptions column={3} size="small" bordered>
                <Descriptions.Item label="批记录编号" span={2}><Text code>{selected.brId}</Text></Descriptions.Item>
                <Descriptions.Item label="状态">
                  <Tag color={BR_STATUS[selected.status].color}>{BR_STATUS[selected.status].label}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="工单号"><Text code>{selected.woNumber}</Text></Descriptions.Item>
                <Descriptions.Item label="产品编码">{selected.productCode}</Descriptions.Item>
                <Descriptions.Item label="产品名称">{selected.productName}</Descriptions.Item>
                <Descriptions.Item label="批号"><Tag color="blue">{selected.batchNo}</Tag></Descriptions.Item>
                <Descriptions.Item label="批量">{selected.batchSize.toLocaleString()}</Descriptions.Item>
                <Descriptions.Item label="剂型"><Tag>{selected.dosageForm}</Tag></Descriptions.Item>
                <Descriptions.Item label="生产日期">{selected.produceDate}</Descriptions.Item>
                <Descriptions.Item label="有效期至">{selected.expiryDate}</Descriptions.Item>
                <Descriptions.Item label="生产车间">{selected.workshopName}</Descriptions.Item>
                <Descriptions.Item label="创建时间">{selected.createdAt}</Descriptions.Item>
              </Descriptions>

              <Divider orientation={"left" as any} style={{ fontSize: 12 }}>审批进度</Divider>
              <Steps direction="vertical" size="small" current={BR_STATUS[selected.status].step} items={[
                { title: '批记录创建', description: `${selected.createdAt} 工单下达自动创建`, status: 'finish' },
                { title: '执行中', description: `工序逐一完工，操作员实时记录`, status: selected.status === 'DRAFT' ? 'wait' : 'finish' },
                { title: '提交审核', description: selected.submittedBy ? `${selected.submittedAt} 由 ${selected.submittedBy} 提交` : '等待车间主管提交',
                  status: selected.submittedBy ? 'finish' : 'wait' },
                { title: 'QA审批', description: selected.approvedByQa ? `${selected.approvedAtQa} 由 ${selected.approvedByQa} 批准放行` : '等待QA审批',
                  status: selected.approvedByQa ? 'finish' : 'wait' },
                { title: '归档完成', description: selected.status === 'ARCHIVED' ? '已电子归档' : '等待归档',
                  status: selected.status === 'ARCHIVED' ? 'finish' : 'wait' },
              ]} />
            </Tabs.TabPane>

            <Tabs.TabPane tab={`工序记录 (${selected.operations.length})`} key="operations">
              <Table
                dataSource={selected.operations} rowKey="recordId" size="small" pagination={false}
                columns={[
                  { title: '序', dataIndex: 'operationSeq', width: 40 },
                  { title: '工序', dataIndex: 'operationName', width: 100, render: (v, r) => (
                    <Space><Text>{v}</Text><Text type="secondary" style={{ fontSize: 11 }}>({r.operationCode})</Text></Space>
                  )},
                  { title: '状态', dataIndex: 'status', width: 90, render: (v: OpRecordStatus) => (
                    <Tag color={OP_STATUS[v].color}>{OP_STATUS[v].label}</Tag>
                  )},
                  { title: '开始时间', dataIndex: 'actualStart', width: 130, render: v => v || <Text type="secondary">—</Text> },
                  { title: '完工时间', dataIndex: 'actualEnd', width: 130, render: v => v || <Text type="secondary">—</Text> },
                  { title: '温度/湿度', width: 110, render: (_, r) => r.temperature ? (
                    <Text style={{ fontSize: 11 }}>{r.temperature}℃ / {r.humidity}%</Text>
                  ) : <Text type="secondary">—</Text> },
                  { title: '物料平衡率', width: 110, render: (_, r) => {
                    if (!r.materialBalanceRate) return <Text type="secondary">—</Text>;
                    const ok = r.materialBalanceStatus === 'WITHIN_RANGE';
                    return <Text strong style={{ color: ok ? '#52c41a' : '#ff4d4f' }}>{r.materialBalanceRate}%</Text>;
                  }},
                  { title: '偏差', dataIndex: 'deviationId', width: 100, render: v => v ? <Tag color="red">{v}</Tag> : <Text type="secondary">—</Text> },
                  { title: '操作员', dataIndex: 'operatorName', width: 80 },
                  { title: '复核人', dataIndex: 'reviewerName', width: 80 },
                  { title: 'QA', dataIndex: 'qaCheckerName', width: 80, render: v => v ? <Tag color="purple">{v}</Tag> : <Text type="secondary">—</Text> },
                ] as ColumnsType<OperationRecord>}
              />
            </Tabs.TabPane>

            <Tabs.TabPane tab={`电子签名 (${selected.signatures.length})`} key="signatures">
              {selected.signatures.length === 0 ? (
                <Alert type="info" message="尚无电子签名记录，请按流程执行审批操作" />
              ) : (
                <Timeline items={selected.signatures.map((s, i) => ({
                  color: s.signType === 'OPERATE' ? 'blue' : s.signType === 'REVIEW' ? 'orange' : 'green',
                  children: (
                    <Card size="small" key={i} style={{ marginBottom: 4 }}>
                      <Space direction="vertical" size={2} style={{ width: '100%' }}>
                        <Space>
                          <Tag color={s.signType === 'OPERATE' ? 'blue' : s.signType === 'REVIEW' ? 'orange' : 'green'}>
                            {s.signType === 'OPERATE' ? '操作人签名' : s.signType === 'REVIEW' ? '复核人签名' : 'QA审批签名'}
                          </Tag>
                          <Text strong>{s.userName}</Text>
                          <Text type="secondary">({s.role})</Text>
                        </Space>
                        <Space>
                          <Text type="secondary" style={{ fontSize: 11 }}>签名时间：{s.signedAt}</Text>
                          <Text type="secondary" style={{ fontSize: 11 }}>IP: {s.ipAddress}</Text>
                        </Space>
                        <div style={{ background: '#f5f5f5', borderRadius: 4, padding: '4px 8px', fontSize: 11 }}>
                          <LockOutlined style={{ marginRight: 4, color: '#52c41a' }} />
                          签名含义：{s.meaning}
                        </div>
                        <Text style={{ fontSize: 10, color: '#aaa' }}>
                          用户ID: {s.userId} · 21 CFR Part 11 合规电子签名
                        </Text>
                      </Space>
                    </Card>
                  ),
                }))} />
              )}
              <Alert type="info" showIcon style={{ marginTop: 8 }} icon={<LockOutlined />}
                message="符合 21 CFR Part 11 & GB 17405-1998 — 已签名记录禁止修改，需更正请走追加更正流程"
              />
            </Tabs.TabPane>
          </Tabs>
        )}
      </Modal>

      {/* 签名/操作弹窗 */}
      <Modal title={<Space><LockOutlined style={{ color: '#1677ff' }} />
        {signType === 'submit' ? '提交批记录审核' : signType === 'review' ? '审核批记录' : 'QA审批放行'}
      </Space>} open={signModalVisible} onCancel={() => setSignModalVisible(false)} onOk={doTransition} okText="确认签名">
        <Alert type="info" showIcon style={{ marginBottom: 12 }}
          message={
            signType === 'submit' ? '提交后批记录将锁定，所有工序记录禁止修改。' :
            signType === 'review' ? '请仔细审核所有工序记录、物料平衡、偏差处理情况。' :
            'QA审批放行后，系统将自动通知WMS允许成品入库，并归档批记录。'
          }
        />
        <Form form={signForm} layout="vertical">
          <Form.Item label="操作人姓名" name="userName" rules={[{ required: true, message: '请输入您的姓名' }]}>
            <Input placeholder={signType === 'submit' ? '车间主管姓名' : signType === 'review' ? '生产审核人姓名' : 'QA经理姓名'} />
          </Form.Item>
          <Form.Item label="用户ID/工号" name="userId" rules={[{ required: true }]}>
            <Input placeholder="您的系统工号" />
          </Form.Item>
          <Form.Item label="登录密码（电子签名）" name="password" rules={[{ required: true }]}>
            <Input.Password placeholder="请输入密码以完成电子签名" />
          </Form.Item>
          <Form.Item label="签名含义声明" name="meaning">
            <Input disabled value={
              signType === 'submit' ? '确认本批次生产记录真实、完整、准确，申请审核放行' :
              signType === 'review' ? '确认已复核全部生产记录，符合GMP要求，转QA审批' :
              '确认本批次产品质量检验合格，符合放行标准，批准成品放行'
            } />
          </Form.Item>
          <Alert type="warning" showIcon style={{ fontSize: 11 }}
            message="电子签名具有法律效力，等同于手写签名。请确认您是本人操作，签名后不可撤销。" />
        </Form>
      </Modal>

      {/* 驳回弹窗 */}
      <Modal title={<Space><WarningOutlined style={{ color: '#ff4d4f' }} />驳回批记录</Space>}
        open={rejectModal} onCancel={() => setRejectModal(false)} onOk={doReject} okType="danger" okText="确认驳回">
        <Alert type="error" showIcon message="驳回后相关工序记录将解锁，操作员需整改后重新提交。" style={{ marginBottom: 12 }} />
        <Form form={rejectForm} layout="vertical">
          <Form.Item label="驳回原因" name="reason" rules={[{ required: true, message: '请填写驳回原因' }]}>
            <TextArea rows={3} placeholder="请详细说明驳回原因和整改要求" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default EbrWorkflowPage;

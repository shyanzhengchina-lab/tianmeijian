import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { getQualityReleaseList } from '../../api/qualityReleases';
import {
  Alert, Badge, Button, Card, Col, Divider, Drawer, Form, Input,
  Modal, Row, Select, Space, Statistic, Table, Tag, Timeline,
  Typography, message, DatePicker, Steps, Progress,
} from 'antd';
import {
  AuditOutlined, CheckCircleOutlined, CloseCircleOutlined,
  ExclamationCircleOutlined, EyeOutlined, FileProtectOutlined,
  ReloadOutlined, SearchOutlined, UserOutlined, WarningOutlined,
  SafetyCertificateOutlined, StopOutlined, FileDoneOutlined,
  LockOutlined, UnlockOutlined,
} from '@ant-design/icons';
import {
  QualityRelease, ReleaseType, ReleaseConclusion,
  RELEASE_TYPE_MAP, RELEASE_CONCLUSION_MAP, CONCLUSION_MAP,
  QC_INSPECTORS, mockQualityReleases, mockInspectionTasks,
} from './qmsData';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

// ─── 签名面板 ─────────────────────────────────────────────────────────────────

interface SignPanelProps {
  label: string;
  signed: boolean;
  signerName?: string;
  onSign: () => void;
}

const SignPanel: React.FC<SignPanelProps> = ({ label, signed, signerName, onSign }) => (
  <Card
    size="small"
    style={{
      borderStyle: 'dashed',
      borderColor: signed ? '#52c41a' : '#d9d9d9',
      background: signed ? '#f6ffed' : '#fafafa',
      textAlign: 'center',
      cursor: signed ? 'default' : 'pointer',
    }}
    bodyStyle={{ padding: 16 }}
    onClick={!signed ? onSign : undefined}
  >
    {signed ? (
      <>
        <CheckCircleOutlined style={{ fontSize: 24, color: '#52c41a', display: 'block', marginBottom: 4 }} />
        <Text strong style={{ color: '#52c41a' }}>{signerName}</Text>
        <br />
        <Text type="secondary" style={{ fontSize: 11 }}>{label} — 已签名</Text>
      </>
    ) : (
      <>
        <LockOutlined style={{ fontSize: 24, color: '#bbb', display: 'block', marginBottom: 4 }} />
        <Text type="secondary">{label}</Text>
        <br />
        <Text type="secondary" style={{ fontSize: 11 }}>点击签名</Text>
      </>
    )}
  </Card>
);

// ─── 放行审批 Modal ───────────────────────────────────────────────────────────

interface ApproveModalProps {
  release: QualityRelease | null;
  open: boolean;
  onClose: () => void;
  onApprove: (id: string, conclusion: ReleaseConclusion, rejectReason: string, validUntil: string) => void;
}

const ApproveModal: React.FC<ApproveModalProps> = ({ release, open, onClose, onApprove }) => {
  const [qaId, setQaId]           = useState('QC004');
  const [reviewerId, setReviewer] = useState('QC005');
  const [qaSigned, setQaSigned]   = useState(false);
  const [rvSigned, setRvSigned]   = useState(false);
  const [password, setPassword]   = useState('');
  const [showPwdModal, setShowPwd] = useState<'qa' | 'rv' | null>(null);
  const [conclusion, setConclusion] = useState<ReleaseConclusion>('RELEASED');
  const [rejectReason, setReject]   = useState('');
  const [validUntil, setValidUntil] = useState('');

  if (!release) return null;

  const qaName = QC_INSPECTORS.find(q => q.id === qaId)?.name || '';
  const rvName = QC_INSPECTORS.find(q => q.id === reviewerId)?.name || '';

  // 关联检验任务
  const linkedTasks = mockInspectionTasks.filter(t => release.inspectRecordIds.some(id => id.startsWith('IR')));
  const allPass = linkedTasks.every(t => t.conclusion === 'PASS' || !t.conclusion);

  function handleSignConfirm() {
    if (password !== '123456') { message.error('密码错误，电子签名失败'); return; }
    if (showPwdModal === 'qa')  { setQaSigned(true); }
    else                        { setRvSigned(true);  }
    setShowPwd(null);
    setPassword('');
    message.success('电子签名成功');
  }

  function handleSubmit() {
    if (!release) return;
    if (!qaSigned) { message.warning('请 QA 放行员完成电子签名'); return; }
    const needDualSign = ['FINISHED', 'STERILE'].includes(release.releaseType);
    if (needDualSign && !rvSigned) { message.warning('成品/灭菌放行需要复核员双人签名'); return; }
    if (conclusion === 'REJECTED' && !rejectReason) { message.warning('驳回时需填写原因'); return; }
    onApprove(release.id, conclusion, rejectReason, validUntil);
    // reset
    setQaSigned(false); setRvSigned(false); setPassword('');
    setConclusion('RELEASED'); setReject(''); setValidUntil('');
  }

  const steps = [
    { title: '检验记录核查', icon: <FileProtectOutlined /> },
    { title: 'QA 电子签名',  icon: <UserOutlined /> },
    { title: '放行审批结论', icon: <SafetyCertificateOutlined /> },
  ];
  const currentStep = !qaSigned ? 1 : !rvSigned && ['FINISHED', 'STERILE'].includes(release.releaseType) ? 1 : 2;

  return (
    <Modal
      title={
        <Space>
          <SafetyCertificateOutlined style={{ color: '#52c41a' }} />
          质量放行审批 — {release.releaseNo}
        </Space>
      }
      open={open}
      onCancel={onClose}
      width={720}
      footer={null}
    >
      <Steps items={steps} current={currentStep} size="small" style={{ marginBottom: 20 }} />

      {/* 放行单基本信息 */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={[12, 8]}>
          <Col span={12}><Text type="secondary">放行单号：</Text><Text strong>{release.releaseNo}</Text></Col>
          <Col span={12}>
            <Text type="secondary">放行类型：</Text>
            <Tag color={RELEASE_TYPE_MAP[release.releaseType]?.color}>
              {RELEASE_TYPE_MAP[release.releaseType]?.label}
            </Tag>
          </Col>
          <Col span={12}><Text type="secondary">批次号：</Text><Text strong>{release.batchNo}</Text></Col>
          <Col span={12}><Text type="secondary">产品型号：</Text>{release.productModel || '—'}</Col>
          <Col span={24}>
            <Text type="secondary">关联检验记录：</Text>
            {release.inspectRecordIds.map(id => <Tag key={id} color="blue">{id}</Tag>)}
          </Col>
        </Row>
      </Card>

      {/* 检验记录校验 */}
      <Card size="small" title="检验记录核查" style={{ marginBottom: 16 }}>
        {allPass ? (
          <Alert type="success" showIcon message="所有关联检验记录均已完成且合格，允许放行" />
        ) : (
          <Alert type="error" showIcon message="存在未合格检验记录，禁止放行（需先处置不合格项）" />
        )}
      </Card>

      {/* 放行结论 */}
      <Card size="small" title="放行结论" style={{ marginBottom: 16 }}>
        <Form layout="vertical">
          <Form.Item label="审批结论" required>
            <Select value={conclusion} onChange={v => setConclusion(v)} style={{ width: 200 }}>
              <Option value="RELEASED"><Tag color="success">放行</Tag></Option>
              <Option value="REJECTED"><Tag color="error">驳回</Tag></Option>
              <Option value="HOLD"><Tag color="warning">待审查</Tag></Option>
            </Select>
          </Form.Item>
          {conclusion === 'REJECTED' && (
            <Form.Item label="驳回原因" required>
              <TextArea rows={2} value={rejectReason} onChange={e => setReject(e.target.value)} placeholder="请填写驳回原因" />
            </Form.Item>
          )}
          {(release.releaseType === 'STERILE' || release.releaseType === 'FINISHED') && (
            <Form.Item label="有效期至（可选）">
              <Input
                placeholder="YYYY-MM-DD"
                value={validUntil}
                onChange={e => setValidUntil(e.target.value)}
                style={{ width: 160 }}
              />
            </Form.Item>
          )}
        </Form>
      </Card>

      {/* 电子签名区 */}
      <Card size="small" title="电子签名（双人复核）" style={{ marginBottom: 16 }}>
        <Row gutter={16} style={{ marginBottom: 12 }}>
          <Col span={12}>
            <Form.Item label="QA 放行员">
              <Select value={qaId} onChange={v => { setQaId(v); setQaSigned(false); }} style={{ width: '100%' }}>
                {QC_INSPECTORS.map(q => <Option key={q.id} value={q.id}>{q.name} — {q.role}</Option>)}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="复核员">
              <Select value={reviewerId} onChange={v => { setReviewer(v); setRvSigned(false); }} style={{ width: '100%' }}>
                {QC_INSPECTORS.filter(q => q.id !== qaId).map(q => (
                  <Option key={q.id} value={q.id}>{q.name} — {q.role}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <SignPanel label="QA 放行员" signed={qaSigned} signerName={qaName} onSign={() => setShowPwd('qa')} />
          </Col>
          <Col span={12}>
            <SignPanel label="复核员" signed={rvSigned} signerName={rvName} onSign={() => setShowPwd('rv')} />
          </Col>
        </Row>
      </Card>

      <Row justify="end">
        <Space>
          <Button onClick={onClose}>取消</Button>
          <Button type="primary" icon={<SafetyCertificateOutlined />} onClick={handleSubmit}>
            确认放行审批
          </Button>
        </Space>
      </Row>

      {/* 电子签名密码弹窗 */}
      <Modal
        title={<Space><LockOutlined />电子签名确认</Space>}
        open={!!showPwdModal}
        onCancel={() => { setShowPwd(null); setPassword(''); }}
        onOk={handleSignConfirm}
        okText="确认签名"
        width={340}
      >
        <Alert type="info" showIcon message="请输入您的登录密码完成电子签名（演示密码：123456）" style={{ marginBottom: 12 }} />
        <Input.Password
          placeholder="输入密码"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onPressEnter={handleSignConfirm}
          prefix={<LockOutlined />}
        />
      </Modal>
    </Modal>
  );
};

// ─── 详情 Drawer ──────────────────────────────────────────────────────────────

interface DetailDrawerProps {
  release: QualityRelease | null;
  open: boolean;
  onClose: () => void;
}

const DetailDrawer: React.FC<DetailDrawerProps> = ({ release, open, onClose }) => {
  if (!release) return null;
  const conclusionInfo = RELEASE_CONCLUSION_MAP[release.conclusion];

  return (
    <Drawer
      title={<Space><FileDoneOutlined />质量放行单详情</Space>}
      open={open}
      onClose={onClose}
      width={580}
    >
      <Card size="small" title="放行单信息" style={{ marginBottom: 16 }}>
        <Row gutter={[12, 8]}>
          <Col span={12}><Text type="secondary">放行单号：</Text><Text strong>{release.releaseNo}</Text></Col>
          <Col span={12}>
            <Text type="secondary">结论：</Text>
            <Tag color={conclusionInfo?.color}>{conclusionInfo?.label}</Tag>
          </Col>
          <Col span={12}>
            <Text type="secondary">放行类型：</Text>
            <Tag color={RELEASE_TYPE_MAP[release.releaseType]?.color}>
              {RELEASE_TYPE_MAP[release.releaseType]?.label}
            </Tag>
          </Col>
          <Col span={12}><Text type="secondary">批次号：</Text><Text strong>{release.batchNo}</Text></Col>
          <Col span={12}><Text type="secondary">产品型号：</Text>{release.productModel || '—'}</Col>
          <Col span={12}><Text type="secondary">创建时间：</Text>{release.createdAt}</Col>
          {release.releaseTime && (
            <Col span={12}><Text type="secondary">放行时间：</Text>{release.releaseTime}</Col>
          )}
          {release.validUntil && (
            <Col span={12}><Text type="secondary">有效期至：</Text><Tag color="orange">{release.validUntil}</Tag></Col>
          )}
          <Col span={24}>
            <Text type="secondary">关联检验记录：</Text>
            {release.inspectRecordIds.map(id => <Tag key={id} color="blue">{id}</Tag>)}
          </Col>
          {release.rejectReason && (
            <Col span={24}>
              <Text type="secondary">驳回原因：</Text>
              <div style={{ background: '#fff2f0', padding: 8, borderRadius: 4, marginTop: 4 }}>
                {release.rejectReason}
              </div>
            </Col>
          )}
          {release.remark && (
            <Col span={24}>
              <Text type="secondary">备注：</Text>
              <div style={{ background: '#f5f5f5', padding: 8, borderRadius: 4, marginTop: 4 }}>
                {release.remark}
              </div>
            </Col>
          )}
        </Row>
      </Card>

      {/* 签名信息 */}
      <Card size="small" title="电子签名" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={12}>
            <Text type="secondary">QA 放行员：</Text>
            {release.qaName ? (
              <Tag icon={<CheckCircleOutlined />} color="success">{release.qaName}</Tag>
            ) : <Text type="secondary">未签名</Text>}
          </Col>
          <Col span={12}>
            <Text type="secondary">复核员：</Text>
            {release.reviewerName ? (
              <Tag icon={<CheckCircleOutlined />} color="success">{release.reviewerName}</Tag>
            ) : <Text type="secondary">未签名</Text>}
          </Col>
          {release.qaSign && (
            <Col span={24} style={{ marginTop: 8 }}>
              <Text type="secondary" style={{ fontSize: 11 }}>签名哈希：{release.qaSign}</Text>
            </Col>
          )}
        </Row>
      </Card>

      {/* 时间线 */}
      <Card size="small" title="审批流程">
        <Timeline
          items={[
            { color: 'blue', children: <><Text strong>放行申请创建</Text><br /><Text type="secondary">{release.createdAt}</Text></> },
            release.qaName ? {
              color: 'green',
              children: <><Text strong>QA 签名</Text><br /><Text type="secondary">放行员：{release.qaName}</Text></>,
            } : { color: 'gray', children: <Text type="secondary">等待 QA 签名...</Text> },
            release.reviewerName ? {
              color: 'green',
              children: <><Text strong>复核签名</Text><br /><Text type="secondary">复核员：{release.reviewerName}</Text></>,
            } : null,
            release.releaseTime ? {
              color: release.conclusion === 'RELEASED' ? 'green' : 'red',
              children: (
                <>
                  <Text strong>
                    {release.conclusion === 'RELEASED' ? '放行完成' :
                     release.conclusion === 'REJECTED' ? '审批驳回' : '待进一步审查'}
                  </Text>
                  <br />
                  <Text type="secondary">{release.releaseTime}</Text>
                </>
              ),
            } : null,
          ].filter(Boolean) as any[]}
        />
      </Card>
    </Drawer>
  );
};

// ─── 放行单卡片 ───────────────────────────────────────────────────────────────

interface ReleaseCardProps {
  release: QualityRelease;
  onView: () => void;
  onApprove: () => void;
}

const ReleaseCard: React.FC<ReleaseCardProps> = ({ release, onView, onApprove }) => {
  const conclusionInfo = RELEASE_CONCLUSION_MAP[release.conclusion];
  const typeInfo       = RELEASE_TYPE_MAP[release.releaseType];
  const isPending      = release.conclusion === 'HOLD' && !release.releaseTime;

  return (
    <Card
      size="small"
      style={{
        marginBottom: 10,
        borderLeft: `4px solid ${
          release.conclusion === 'RELEASED' ? '#52c41a' :
          release.conclusion === 'REJECTED' ? '#ff4d4f' : '#faad14'
        }`,
      }}
      bodyStyle={{ padding: '10px 14px' }}
    >
      <Row align="middle" gutter={8}>
        <Col flex="1">
          <Space size={6} wrap>
            <Text strong style={{ fontSize: 13 }}>{release.releaseNo}</Text>
            <Tag color={typeInfo?.color} style={{ fontSize: 11 }}>{typeInfo?.label}</Tag>
            <Tag color={conclusionInfo?.color} style={{ fontSize: 11 }}>
              {conclusionInfo?.label}
            </Tag>
            {!release.qaSign && <Tag color="warning" style={{ fontSize: 11 }}>待签名</Tag>}
          </Space>
          <br />
          <Space size={16} style={{ marginTop: 4 }} wrap>
            <Text type="secondary" style={{ fontSize: 12 }}>批次：<Text strong>{release.batchNo}</Text></Text>
            {release.productModel && (
              <Text type="secondary" style={{ fontSize: 12 }}>产品：{release.productModel}</Text>
            )}
            {release.qaName && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                <UserOutlined /> QA：{release.qaName}
                {release.reviewerName && ` / 复核：${release.reviewerName}`}
              </Text>
            )}
            {release.releaseTime && (
              <Text type="secondary" style={{ fontSize: 12 }}>放行时间：{release.releaseTime}</Text>
            )}
            {release.validUntil && (
              <Tag color="orange" style={{ fontSize: 11 }}>有效至 {release.validUntil}</Tag>
            )}
          </Space>
        </Col>
        <Col>
          <Space size={4}>
            <Button size="small" icon={<EyeOutlined />} onClick={onView}>详情</Button>
            {isPending && (
              <Button size="small" type="primary" icon={<SafetyCertificateOutlined />} onClick={onApprove}>
                审批放行
              </Button>
            )}
            {!release.qaSign && !isPending && (
              <Button size="small" type="primary" icon={<SafetyCertificateOutlined />} onClick={onApprove}>
                审批放行
              </Button>
            )}
          </Space>
        </Col>
      </Row>
    </Card>
  );
};

// ─── 主页面 ───────────────────────────────────────────────────────────────────

const ReleasePage: React.FC = () => {
  const [releases, setReleases] = useLocalStorage<QualityRelease[]>('bip_quality_releases', []);
  const [searchText, setSearch]     = useState('');
  const [typeFilter, setTypeFilter] = useState<ReleaseType | 'ALL'>('ALL');
  const [concFilter, setConcFilter] = useState<ReleaseConclusion | 'ALL'>('ALL');
  const [detailItem, setDetail]     = useState<QualityRelease | null>(null);
  const [approveItem, setApprove]   = useState<QualityRelease | null>(null);
  const [msgApi, ctxHolder]         = message.useMessage();

  // ── loadFromApi: 合并后端放行数据 ──
  const loadFromApi = useCallback(async () => {
    try {
      const resp = await getQualityReleaseList() as any;
      const apiList: any[] = resp?.data ?? [];
      if (apiList.length > 0) {
        const mapped: QualityRelease[] = apiList.map((item: any) => ({
          id: `api-${item.id}`,
          // compat路由返回双字段（releaseNo & id，releaseType，conclusion/status等）
          releaseNo: item.releaseNo ?? `REL-${item.id}`,
          releaseType: (['SEMI_FINISHED','FINISHED','STERILE','MATERIAL'].includes(item.releaseType ?? '')
            ? item.releaseType : 'FINISHED') as ReleaseType,
          taskId: item.taskId ? String(item.taskId) : undefined,
          batchNo: item.batchNo ?? item.batch_no ?? '',
          materialCode: item.materialCode ?? item.material_code ?? '',
          materialName: item.materialName ?? item.material_name ?? '',
          inspectRecordIds: [],
          conclusion: (['RELEASED','REJECTED','HOLD'].includes(item.conclusion ?? item.status ?? '')
            ? (item.conclusion ?? item.status)
            : 'HOLD') as ReleaseConclusion,
          qaName: item.qaName ?? item.approverName ?? item.approver_name ?? '',
          releaseTime: item.releaseTime ?? item.approveTime ?? item.approve_time ?? '',
          createdAt: item.createdAt ?? item.createTime ?? item.create_time ?? new Date().toLocaleString(),
          remark: item.remark ?? '',
        }));
        setReleases(mapped);  // API-first REPLACE
      }
    } catch { /* backend offline */ }
  }, [setReleases]);

  useEffect(() => { loadFromApi(); }, [loadFromApi]);

  const filtered = useMemo(() => {
    return releases.filter(r => {
      const matchSearch = !searchText || r.releaseNo.includes(searchText) || r.batchNo.includes(searchText);
      const matchType   = typeFilter === 'ALL'   || r.releaseType === typeFilter;
      const matchConc   = concFilter === 'ALL'   || r.conclusion === concFilter;
      return matchSearch && matchType && matchConc;
    });
  }, [releases, searchText, typeFilter, concFilter]);

  const kpi = useMemo(() => ({
    pending:  releases.filter(r => !r.releaseTime && r.conclusion === 'HOLD').length,
    released: releases.filter(r => r.conclusion === 'RELEASED').length,
    rejected: releases.filter(r => r.conclusion === 'REJECTED').length,
    needSign: releases.filter(r => !r.qaSign).length,
    total:    releases.length,
  }), [releases]);

  function handleApprove(id: string, conclusion: ReleaseConclusion, rejectReason: string, validUntil: string) {
    setReleases(prev => prev.map(r => r.id === id ? {
      ...r,
      conclusion,
      rejectReason: rejectReason || undefined,
      validUntil: validUntil || undefined,
      qaSign: `SIGN_AUTO_${Date.now()}`,
      reviewerSign: `SIGN_REVIEW_${Date.now()}`,
      releaseTime: new Date().toLocaleString(),
      qaName: QC_INSPECTORS[3].name,
      reviewerName: QC_INSPECTORS[4].name,
    } : r));
    setApprove(null);
    if (conclusion === 'RELEASED') {
      msgApi.success('质量放行审批完成，批次已放行 ✓');
    } else if (conclusion === 'REJECTED') {
      msgApi.error('放行驳回，已通知生产部门处置');
    } else {
      msgApi.warning('放行单已标记为待审查状态');
    }
  }

  return (
    <div style={{ padding: '16px 20px', background: '#f5f6fa', minHeight: '100vh' }}>
      {ctxHolder}

      <div style={{ marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>
          <SafetyCertificateOutlined style={{ marginRight: 8, color: '#52c41a' }} />
          质量放行管理
        </Title>
        <Text type="secondary">Quality Release — QA 电子签名放行 · 全批次追溯 · ISO 13485 合规</Text>
      </div>

      {/* KPI */}
      <Row gutter={12} style={{ marginBottom: 16 }}>
        {[
          { title: '待放行审批', value: kpi.pending,  color: '#faad14', filter: 'pending', icon: <ExclamationCircleOutlined /> },
          { title: '待签名',     value: kpi.needSign, color: '#1890ff', filter: 'needSign', icon: <LockOutlined /> },
          { title: '已放行',     value: kpi.released, color: '#52c41a', filter: 'released', icon: <CheckCircleOutlined /> },
          { title: '已驳回',     value: kpi.rejected, color: '#ff4d4f', filter: 'rejected', icon: <CloseCircleOutlined /> },
          { title: '合计',       value: kpi.total,    color: '#595959', filter: 'all', icon: <FileDoneOutlined /> },
        ].map(item => (
          <Col key={item.filter} span={item.filter === 'all' ? 4 : 5}>
            <Card
              size="small"
              style={{ borderTop: `3px solid ${item.color}` }}
              bodyStyle={{ padding: '10px 14px' }}
            >
              <Row align="middle" justify="space-between">
                <Col>
                  <div style={{ color: '#8c8c8c', fontSize: 12 }}>{item.title}</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: item.color }}>{item.value}</div>
                </Col>
                <Col>
                  <span style={{ fontSize: 24, color: item.color, opacity: 0.2 }}>{item.icon}</span>
                </Col>
              </Row>
            </Card>
          </Col>
        ))}
      </Row>

      {/* 待审批提醒 */}
      {kpi.needSign > 0 && (
        <Alert
          type="warning"
          showIcon
          message={`有 ${kpi.needSign} 张放行单待 QA 电子签名，请及时处理！`}
          style={{ marginBottom: 12 }}
        />
      )}

      {/* 工具栏 */}
      <Card size="small" style={{ marginBottom: 12 }} bodyStyle={{ padding: '8px 12px' }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <Input
                placeholder="搜索放行单号/批次号"
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={e => setSearch(e.target.value)}
                style={{ width: 220 }}
                allowClear
              />
              <Select value={typeFilter} onChange={v => setTypeFilter(v)} style={{ width: 140 }}>
                <Option value="ALL">全部类型</Option>
                {Object.entries(RELEASE_TYPE_MAP).map(([k, v]) => (
                  <Option key={k} value={k}>{v.label}</Option>
                ))}
              </Select>
              <Select value={concFilter} onChange={v => setConcFilter(v)} style={{ width: 130 }}>
                <Option value="ALL">全部结论</Option>
                {Object.entries(RELEASE_CONCLUSION_MAP).map(([k, v]) => (
                  <Option key={k} value={k}>{v.label}</Option>
                ))}
              </Select>
              <Button icon={<ReloadOutlined />} onClick={() => { setSearch(''); setTypeFilter('ALL'); setConcFilter('ALL'); }}>重置</Button>
            </Space>
          </Col>
          <Col><Text type="secondary" style={{ fontSize: 12 }}>共 {filtered.length} 条</Text></Col>
        </Row>
      </Card>

      {/* 列表 */}
      {filtered.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: 40 }}>
          <FileDoneOutlined style={{ fontSize: 40, color: '#d9d9d9', display: 'block', marginBottom: 12 }} />
          <Text type="secondary">暂无放行单</Text>
        </Card>
      ) : (
        filtered.map(r => (
          <ReleaseCard
            key={r.id}
            release={r}
            onView={() => setDetail(r)}
            onApprove={() => setApprove(r)}
          />
        ))
      )}

      {/* 详情 */}
      <DetailDrawer release={detailItem} open={!!detailItem} onClose={() => setDetail(null)} />

      {/* 审批 Modal */}
      <ApproveModal release={approveItem} open={!!approveItem} onClose={() => setApprove(null)} onApprove={handleApprove} />
    </div>
  );
};

export default ReleasePage;

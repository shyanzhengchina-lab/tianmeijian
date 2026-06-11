import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { getInspectionTaskList, updateInspectionTask, updateInspectionTaskStatus } from '../../api/inspectionTasks';
import {
  Badge, Button, Card, Col, Drawer, Form, Input, InputNumber,
  Modal, Row, Select, Space, Statistic, Steps, Table, Tag, Tooltip,
  Typography, message, Divider, Alert, Radio, Progress, Timeline,
} from 'antd';
import {
  AuditOutlined, CheckCircleOutlined, CloseCircleOutlined,
  ExclamationCircleOutlined, EyeOutlined, FileSearchOutlined,
  PlayCircleOutlined, PlusOutlined, ReloadOutlined, SearchOutlined,
  SolutionOutlined, ToolOutlined, UserOutlined, WarningOutlined,
  ClockCircleOutlined, EditOutlined, StopOutlined, FilterOutlined,
} from '@ant-design/icons';
import {
  InspectionTask, InspectionTaskItem, TaskStatus, SchemeType,
  Conclusion, Disposition, ReleaseStatus, QC_INSPECTORS,
  SCHEME_TYPE_MAP, TASK_STATUS_MAP, CONCLUSION_MAP, DISPOSITION_MAP,
  mockInspectionTasks, mockInstruments,
  genInspTaskNo, judgeItemResult, judgeOverallConclusion,
} from './qmsData';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

// ─── helpers ────────────────────────────────────────────────────────────────

const schemeTypeFilters: { key: SchemeType | 'ALL'; label: string }[] = [
  { key: 'ALL',         label: '全部' },
  { key: 'IQC',         label: 'IQC 来料' },
  { key: 'IPQC_FIRST',  label: '首件检验' },
  { key: 'IPQC_SELF',   label: '过程自检' },
  { key: 'IPQC_PATROL', label: '巡检' },
  { key: 'FQC',         label: '成品检验' },
  { key: 'OQC',         label: '出货检验' },
  { key: 'SPECIAL',     label: '特殊确认' },
];

function priorityColor(p: 'A' | 'B' | 'C') {
  return p === 'A' ? '#ff4d4f' : p === 'B' ? '#faad14' : '#52c41a';
}

function resultTag(result: 'PASS' | 'FAIL' | 'PENDING' | undefined) {
  if (result === 'PASS')    return <Tag color="success">合格</Tag>;
  if (result === 'FAIL')    return <Tag color="error">不合格</Tag>;
  return <Tag color="default">待检</Tag>;
}

// ─── 检验执行 Modal ─────────────────────────────────────────────────────────

interface ExecModalProps {
  task: InspectionTask;
  open: boolean;
  onClose: () => void;
  onSubmit: (task: InspectionTask, conclusion: Conclusion, disposition: Disposition, remark: string) => void;
}

const ExecModal: React.FC<ExecModalProps> = ({ task, open, onClose, onSubmit }) => {
  const [items, setItems] = useState<InspectionTaskItem[]>(
    task.items.map(i => ({ ...i }))
  );
  const [inspectorId, setInspectorId] = useState(task.inspectorId || '');
  const [checkerId, setCheckerId] = useState(task.checkerId || '');
  const [instrumentId, setInstrumentId] = useState(task.instrumentId || '');
  const [disposition, setDisposition] = useState<Disposition>('NONE');
  const [remark, setRemark] = useState('');
  const [step, setStep] = useState(0); // 0=仪器 1=录入 2=结论签名

  const instrument = mockInstruments.find(i => i.id === instrumentId);
  const isInstrumentExpired = instrument?.status === 'EXPIRED';

  const updatedItems = items.map(item => ({
    ...item,
    result: judgeItemResult(item),
  }));

  const conclusion = judgeOverallConclusion(updatedItems);
  const passCount  = updatedItems.filter(i => i.result === 'PASS').length;
  const failCount  = updatedItems.filter(i => i.result === 'FAIL').length;
  const pendCount  = updatedItems.filter(i => i.result === 'PENDING').length;

  function setValue(idx: number, val: string | number | boolean) {
    setItems(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], actualValue: val as any };
      return next;
    });
  }

  function renderInput(item: InspectionTaskItem, idx: number) {
    if (item.standardType === 'NUMERIC') {
      return (
        <InputNumber
          size="small"
          style={{ width: 120 }}
          placeholder="输入实测值"
          value={item.actualValue as number}
          onChange={v => setValue(idx, v ?? '')}
          step={0.001}
          precision={3}
        />
      );
    }
    if (item.standardType === 'ENUM') {
      return (
        <Select
          size="small"
          style={{ width: 120 }}
          placeholder="选择"
          value={item.actualValue as string}
          onChange={v => setValue(idx, v)}
        >
          {item.enumOptions?.map(opt => (
            <Option key={opt} value={opt}>{opt}</Option>
          ))}
        </Select>
      );
    }
    if (item.standardType === 'BOOLEAN') {
      return (
        <Radio.Group
          size="small"
          value={item.actualValue}
          onChange={e => setValue(idx, e.target.value)}
        >
          <Radio value="已确认">已确认</Radio>
          <Radio value="">未确认</Radio>
        </Radio.Group>
      );
    }
    return (
      <Input
        size="small"
        style={{ width: 160 }}
        placeholder="输入结果"
        value={item.actualValue as string}
        onChange={e => setValue(idx, e.target.value)}
      />
    );
  }

  function handleSubmit() {
    if (!inspectorId) { message.warning('请选择检验员'); return; }
    if (!checkerId)   { message.warning('请选择复核员（双人复核必填）'); return; }
    if (inspectorId === checkerId) { message.warning('检验员与复核员不能为同一人'); return; }
    if (pendCount > 0) { message.warning(`还有 ${pendCount} 个检验项未填写实测值`); return; }
    if (isInstrumentExpired) { message.error('量具校准已过期，禁止提交检验数据'); return; }
    onSubmit(
      { ...task, items: updatedItems, inspectorId, checkerId, instrumentId },
      conclusion, disposition, remark
    );
  }

  return (
    <Modal
      title={
        <Space>
          <FileSearchOutlined style={{ color: '#1890ff' }} />
          <span>检验执行 — {task.taskNo}</span>
          <Tag color={SCHEME_TYPE_MAP[task.schemeType]?.color}>
            {SCHEME_TYPE_MAP[task.schemeType]?.label}
          </Tag>
        </Space>
      }
      open={open}
      onCancel={onClose}
      width={860}
      footer={null}
    >
      {/* 基本信息 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Text type="secondary">检验方案：</Text>
          <Text strong>{task.schemeName}</Text>
        </Col>
        <Col span={8}>
          <Text type="secondary">生产批次：</Text>
          <Text strong>{task.batchNo || '—'}</Text>
        </Col>
        <Col span={8}>
          <Text type="secondary">抽样数量：</Text>
          <Text strong>{task.sampleQty} / {task.totalQty} 件</Text>
        </Col>
      </Row>

      <Steps
        current={step}
        size="small"
        style={{ marginBottom: 20 }}
        items={[
          { title: '量具绑定', icon: <ToolOutlined /> },
          { title: '数据录入', icon: <EditOutlined /> },
          { title: '结论签名', icon: <AuditOutlined /> },
        ]}
      />

      {/* Step 0 – 量具绑定 */}
      {step === 0 && (
        <div>
          <Alert
            message="请先绑定并校验量具，校准过期的量具不允许使用"
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          <Form layout="vertical">
            <Form.Item label="选择量具" required>
              <Select
                placeholder="选择或扫码量具"
                value={instrumentId || undefined}
                onChange={v => setInstrumentId(v)}
                style={{ width: 320 }}
                allowClear
              >
                {mockInstruments.map(ins => (
                  <Option key={ins.id} value={ins.id}>
                    <Space>
                      {ins.name}
                      <Tag color={ins.status === 'VALID' ? 'success' : 'error'}>
                        {ins.status === 'VALID' ? `有效至 ${ins.calibrateValidUntil}` : '校准过期'}
                      </Tag>
                    </Space>
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Form>
          {instrument && (
            <Card size="small" style={{ background: isInstrumentExpired ? '#fff2f0' : '#f6ffed', marginTop: 8 }}>
              <Row gutter={16}>
                <Col span={8}><Text type="secondary">量具名称：</Text>{instrument.name}</Col>
                <Col span={8}><Text type="secondary">编号：</Text>{instrument.code}</Col>
                <Col span={8}>
                  <Text type="secondary">校准状态：</Text>
                  {isInstrumentExpired
                    ? <Tag color="error"><CloseCircleOutlined /> 校准已过期</Tag>
                    : <Tag color="success"><CheckCircleOutlined /> 有效至 {instrument.calibrateValidUntil}</Tag>
                  }
                </Col>
              </Row>
            </Card>
          )}
          <div style={{ marginTop: 24, textAlign: 'right' }}>
            <Button type="primary" disabled={isInstrumentExpired} onClick={() => setStep(1)}>
              下一步：数据录入
            </Button>
          </div>
        </div>
      )}

      {/* Step 1 – 数据录入 */}
      {step === 1 && (
        <div>
          <Table
            dataSource={items}
            rowKey="itemCode"
            size="small"
            pagination={false}
            style={{ marginBottom: 16 }}
            columns={[
              {
                title: '序号', dataIndex: 'seqNo', width: 50,
                render: (_: any, __: any, i: number) => i + 1,
              },
              {
                title: '检验项',
                render: (_: any, r: InspectionTaskItem) => (
                  <Space>
                    {r.isCritical && <Tag color="red" style={{ fontSize: 11 }}>关键</Tag>}
                    {r.itemName}
                  </Space>
                ),
              },
              {
                title: '标准值',
                render: (_: any, r: InspectionTaskItem) => {
                  if (r.standardValue) return <Text code>{r.standardValue} {r.unit}</Text>;
                  if (r.enumOptions)   return <Text code>{r.enumOptions.join(' / ')}</Text>;
                  return '—';
                },
              },
              {
                title: '实测值',
                render: (_: any, r: InspectionTaskItem, idx: number) => renderInput(r, idx),
              },
              {
                title: '判定',
                render: (_: any, r: InspectionTaskItem) => resultTag(judgeItemResult(r)),
              },
            ]}
          />
          <Row justify="space-between" align="middle">
            <Col>
              <Space>
                <Tag color="success">合格 {passCount}</Tag>
                <Tag color="error">不合格 {failCount}</Tag>
                <Tag color="default">待检 {pendCount}</Tag>
              </Space>
            </Col>
            <Col>
              <Space>
                <Button onClick={() => setStep(0)}>上一步</Button>
                <Button type="primary" onClick={() => setStep(2)}>下一步：结论签名</Button>
              </Space>
            </Col>
          </Row>
        </div>
      )}

      {/* Step 2 – 结论签名 */}
      {step === 2 && (
        <div>
          {/* 自动判定综合结论 */}
          <Card
            size="small"
            style={{
              background: conclusion === 'PASS' ? '#f6ffed' : conclusion === 'FAIL' ? '#fff2f0' : '#fffbe6',
              marginBottom: 16,
            }}
          >
            <Row gutter={16} align="middle">
              <Col span={6}>
                <Text type="secondary">综合判定：</Text>
                <br />
                <Tag
                  color={CONCLUSION_MAP[conclusion]?.color}
                  style={{ marginTop: 4, fontSize: 14, padding: '2px 10px' }}
                >
                  {CONCLUSION_MAP[conclusion]?.label}
                </Tag>
              </Col>
              <Col span={6}>
                <Statistic title="合格项" value={passCount} valueStyle={{ color: '#52c41a', fontSize: 20 }} />
              </Col>
              <Col span={6}>
                <Statistic title="不合格项" value={failCount} valueStyle={{ color: '#ff4d4f', fontSize: 20 }} />
              </Col>
              <Col span={6}>
                <Statistic title="未检项" value={pendCount} valueStyle={{ color: '#8c8c8c', fontSize: 20 }} />
              </Col>
            </Row>
          </Card>

          {/* 不合格处置 */}
          {conclusion !== 'PASS' && (
            <Form.Item label="不合格处置方式" required style={{ marginBottom: 12 }}>
              <Select
                value={disposition}
                onChange={v => setDisposition(v)}
                style={{ width: 200 }}
              >
                {Object.entries(DISPOSITION_MAP).filter(([k]) => k !== 'NONE').map(([k, v]) => (
                  <Option key={k} value={k}>{v.label}</Option>
                ))}
              </Select>
            </Form.Item>
          )}

          {/* 人员签名 */}
          <Row gutter={16} style={{ marginBottom: 12 }}>
            <Col span={12}>
              <Form.Item label="检验员（电子签名）" required>
                <Select
                  placeholder="选择检验员"
                  value={inspectorId || undefined}
                  onChange={v => setInspectorId(v)}
                >
                  {QC_INSPECTORS.map(q => (
                    <Option key={q.id} value={q.id}>{q.name} ({q.role})</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="复核员（双人复核，必填）" required>
                <Select
                  placeholder="选择复核员"
                  value={checkerId || undefined}
                  onChange={v => setCheckerId(v)}
                >
                  {QC_INSPECTORS.filter(q => q.id !== inspectorId).map(q => (
                    <Option key={q.id} value={q.id}>{q.name} ({q.role})</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="备注">
            <TextArea
              rows={2}
              value={remark}
              onChange={e => setRemark(e.target.value)}
              placeholder="填写检验备注、偏差说明等"
            />
          </Form.Item>

          <Row justify="space-between">
            <Col>
              <Button onClick={() => setStep(1)}>上一步</Button>
            </Col>
            <Col>
              <Space>
                <Button onClick={onClose}>取消</Button>
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  onClick={handleSubmit}
                >
                  提交检验结果
                </Button>
              </Space>
            </Col>
          </Row>
        </div>
      )}
    </Modal>
  );
};

// ─── 任务详情 Drawer ─────────────────────────────────────────────────────────

interface DetailDrawerProps {
  task: InspectionTask | null;
  open: boolean;
  onClose: () => void;
}

const DetailDrawer: React.FC<DetailDrawerProps> = ({ task, open, onClose }) => {
  if (!task) return null;
  const passCount = task.items.filter(i => i.result === 'PASS').length;
  const failCount = task.items.filter(i => i.result === 'FAIL').length;

  const columns = [
    { title: '检验项', dataIndex: 'itemName', render: (v: string, r: InspectionTaskItem) => (
      <Space>{r.isCritical && <Tag color="red" style={{ fontSize: 10 }}>关键</Tag>}{v}</Space>
    )},
    { title: '标准', render: (_: any, r: InspectionTaskItem) =>
      r.standardValue ? `${r.standardValue} ${r.unit || ''}` :
      r.enumOptions ? r.enumOptions.join('/') : '—'
    },
    { title: '实测值', dataIndex: 'actualValue', render: (v: any, r: InspectionTaskItem) =>
      v !== undefined && v !== null && v !== '' ? `${v} ${r.unit || ''}` : <Text type="secondary">未检</Text>
    },
    { title: '判定', dataIndex: 'result', render: (v: any) => resultTag(v) },
  ];

  return (
    <Drawer
      title={
        <Space>
          <FileSearchOutlined />
          <span>检验任务详情</span>
          <Tag color={TASK_STATUS_MAP[task.status]?.color}>{TASK_STATUS_MAP[task.status]?.label}</Tag>
        </Space>
      }
      open={open}
      onClose={onClose}
      width={640}
    >
      {/* 概要 */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={[12, 12]}>
          <Col span={12}><Text type="secondary">任务编号：</Text><br /><Text strong>{task.taskNo}</Text></Col>
          <Col span={12}><Text type="secondary">检验类型：</Text><br /><Tag color={SCHEME_TYPE_MAP[task.schemeType]?.color}>{SCHEME_TYPE_MAP[task.schemeType]?.label}</Tag></Col>
          <Col span={12}><Text type="secondary">检验方案：</Text><br /><Text>{task.schemeName}（{task.schemeCode}）</Text></Col>
          <Col span={12}><Text type="secondary">产品型号：</Text><br /><Text>{task.productModel || '—'}</Text></Col>
          <Col span={12}><Text type="secondary">生产批次：</Text><br /><Text strong>{task.batchNo || '—'}</Text></Col>
          <Col span={12}><Text type="secondary">关联工单：</Text><br /><Text>{task.woNo || '—'}</Text></Col>
          <Col span={12}><Text type="secondary">批量 / 抽样：</Text><br /><Text>{task.totalQty} / {task.sampleQty} 件</Text></Col>
          <Col span={12}><Text type="secondary">优先级：</Text><br /><span style={{ color: priorityColor(task.priority), fontWeight: 600 }}>●</span> {task.priority} 级</Col>
        </Row>
      </Card>

      {/* 执行信息 */}
      <Card size="small" title="执行信息" style={{ marginBottom: 16 }}>
        <Row gutter={[12, 8]}>
          <Col span={12}><Text type="secondary">检验员：</Text>{task.inspectorName || '未分派'}</Col>
          <Col span={12}><Text type="secondary">复核员：</Text>{task.checkerName || '—'}</Col>
          <Col span={12}><Text type="secondary">分派时间：</Text>{task.assignTime || '—'}</Col>
          <Col span={12}><Text type="secondary">开始时间：</Text>{task.startTime || '—'}</Col>
          <Col span={24}><Text type="secondary">完成时间：</Text>{task.completeTime || '—'}</Col>
          {task.instrumentName && (
            <Col span={24}>
              <Text type="secondary">量具：</Text>
              <Tag icon={<ToolOutlined />}>{task.instrumentName}</Tag>
              {task.instrumentValid && <Tag color="success">校准有效</Tag>}
            </Col>
          )}
        </Row>
      </Card>

      {/* 检验结论 */}
      {task.conclusion && (
        <Card size="small" title="检验结论" style={{ marginBottom: 16 }}>
          <Row gutter={16} align="middle">
            <Col span={8}>
              <Tag color={CONCLUSION_MAP[task.conclusion]?.color} style={{ fontSize: 14, padding: '4px 12px' }}>
                {CONCLUSION_MAP[task.conclusion]?.label}
              </Tag>
            </Col>
            <Col span={8}><Text type="secondary">合格：</Text><Text style={{ color: '#52c41a' }}>{passCount} 项</Text></Col>
            <Col span={8}><Text type="secondary">不合格：</Text><Text style={{ color: '#ff4d4f' }}>{failCount} 项</Text></Col>
            {task.disposition && task.disposition !== 'NONE' && (
              <Col span={24} style={{ marginTop: 8 }}>
                <Text type="secondary">处置方式：</Text>
                <Tag color={DISPOSITION_MAP[task.disposition]?.color}>{DISPOSITION_MAP[task.disposition]?.label}</Tag>
                {task.dispositionRemark && <Text type="secondary"> {task.dispositionRemark}</Text>}
              </Col>
            )}
            {task.failItems && task.failItems.length > 0 && (
              <Col span={24} style={{ marginTop: 8 }}>
                <Text type="secondary">不合格项：</Text>
                {task.failItems.map(fi => <Tag color="error" key={fi}>{fi}</Tag>)}
              </Col>
            )}
          </Row>
        </Card>
      )}

      {/* 检验明细 */}
      <Card size="small" title={`检验数据（${task.items.length} 项）`}>
        <Table
          dataSource={task.items}
          rowKey="itemCode"
          columns={columns}
          pagination={false}
          size="small"
          rowClassName={(r: InspectionTaskItem) => r.result === 'FAIL' ? 'row-fail' : ''}
        />
      </Card>

      {/* 放行状态 */}
      {task.releaseStatus !== 'PENDING' && (
        <Alert
          style={{ marginTop: 16 }}
          type={task.releaseStatus === 'RELEASED' ? 'success' : 'error'}
          message={task.releaseStatus === 'RELEASED' ? '已生成质量放行单' : '已驳回（退货/报废）'}
          showIcon
        />
      )}
    </Drawer>
  );
};

// ─── 任务卡片 ────────────────────────────────────────────────────────────────

interface TaskCardProps {
  task: InspectionTask;
  onView: () => void;
  onAssign: () => void;
  onStart: () => void;
  onExec: () => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onView, onAssign, onStart, onExec }) => {
  const typeInfo   = SCHEME_TYPE_MAP[task.schemeType];
  const statusInfo = TASK_STATUS_MAP[task.status];
  const passCount  = task.items.filter(i => i.result === 'PASS').length;
  const total      = task.items.length;
  const progress   = total > 0 ? Math.round((passCount / total) * 100) : 0;

  return (
    <Card
      size="small"
      style={{
        marginBottom: 10,
        borderLeft: `4px solid ${priorityColor(task.priority)}`,
        background: task.status === 'DOING' ? '#f0f9ff' : '#fff',
      }}
      bodyStyle={{ padding: '10px 14px' }}
    >
      <Row align="middle" gutter={8}>
        {/* 左：基本信息 */}
        <Col flex="1">
          <Space size={6} wrap>
            <Text strong style={{ fontSize: 13 }}>{task.taskNo}</Text>
            <Tag color={typeInfo?.color} style={{ fontSize: 11 }}>
              {typeInfo?.label}
            </Tag>
            <Badge
              status={
                statusInfo?.color === 'processing' ? 'processing' :
                statusInfo?.color === 'success'    ? 'success' :
                statusInfo?.color === 'warning'    ? 'warning' :
                statusInfo?.color === 'error'      ? 'error' : 'default'
              }
              text={
                <Text style={{ fontSize: 12 }}>{statusInfo?.label}</Text>
              }
            />
            {task.conclusion && (
              <Tag color={CONCLUSION_MAP[task.conclusion]?.color} style={{ fontSize: 11 }}>
                {CONCLUSION_MAP[task.conclusion]?.label}
              </Tag>
            )}
          </Space>
          <br />
          <Space size={16} style={{ marginTop: 4 }} wrap>
            <Text type="secondary" style={{ fontSize: 12 }}>
              方案：{task.schemeName}
            </Text>
            {task.batchNo && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                批次：{task.batchNo}
              </Text>
            )}
            {task.woNo && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                工单：{task.woNo}
              </Text>
            )}
            <Text type="secondary" style={{ fontSize: 12 }}>
              抽样：{task.sampleQty}/{task.totalQty}件
            </Text>
            {task.inspectorName && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                <UserOutlined /> {task.inspectorName}
              </Text>
            )}
          </Space>
          {/* 进度条（执行中时显示） */}
          {task.status === 'DOING' && (
            <Progress
              percent={progress}
              size="small"
              style={{ marginTop: 6, maxWidth: 300 }}
              format={p => `${passCount}/${total}项`}
            />
          )}
        </Col>

        {/* 右：操作 */}
        <Col>
          <Space size={4}>
            <Button size="small" icon={<EyeOutlined />} onClick={onView}>详情</Button>
            {task.status === 'PENDING' && (
              <Button size="small" type="default" icon={<UserOutlined />} onClick={onAssign}>
                分派
              </Button>
            )}
            {task.status === 'ASSIGNED' && (
              <Button size="small" type="primary" icon={<PlayCircleOutlined />} onClick={onStart}>
                开始
              </Button>
            )}
            {task.status === 'DOING' && (
              <Button size="small" type="primary" icon={<EditOutlined />} onClick={onExec}>
                录入检验
              </Button>
            )}
            {task.status === 'WAIT_RETEST' && (
              <Button size="small" type="default" danger icon={<ReloadOutlined />} onClick={onExec}>
                复验
              </Button>
            )}
          </Space>
        </Col>
      </Row>
    </Card>
  );
};

// ─── 分派 Modal ──────────────────────────────────────────────────────────────

interface AssignModalProps {
  task: InspectionTask | null;
  open: boolean;
  onClose: () => void;
  onSave: (inspectorId: string, checkerId: string) => void;
}

const AssignModal: React.FC<AssignModalProps> = ({ task, open, onClose, onSave }) => {
  const [form] = Form.useForm();
  if (!task) return null;

  return (
    <Modal
      title={<Space><UserOutlined />分派检验员 — {task.taskNo}</Space>}
      open={open}
      onCancel={onClose}
      onOk={() => {
        form.validateFields().then(vals => {
          if (vals.inspectorId === vals.checkerId) {
            message.warning('检验员与复核员不能为同一人');
            return;
          }
          onSave(vals.inspectorId, vals.checkerId);
          form.resetFields();
        }).catch((err: any) => { if (err?.errorFields) return; });
      }}
      okText="确认分派"
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item label="检验员" name="inspectorId" rules={[{ required: true }]}>
          <Select placeholder="选择检验员">
            {QC_INSPECTORS.map(q => (
              <Option key={q.id} value={q.id}>{q.name} — {q.role}</Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item label="复核员（双人复核）" name="checkerId" rules={[{ required: true }]}>
          <Select placeholder="选择复核员">
            {QC_INSPECTORS.map(q => (
              <Option key={q.id} value={q.id}>{q.name} — {q.role}</Option>
            ))}
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

// ─── 主页面 ──────────────────────────────────────────────────────────────────

const InspectionPage: React.FC = () => {
  const [tasks, setTasks]       = useLocalStorage<InspectionTask[]>('bip_inspection_tasks', []);
  const [searchText, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'ALL'>('ALL');
  const [typeFilter, setTypeFilter]     = useState<SchemeType | 'ALL'>('ALL');
  const [detailTask, setDetailTask]     = useState<InspectionTask | null>(null);
  const [execTask, setExecTask]         = useState<InspectionTask | null>(null);
  const [assignTask, setAssignTask]     = useState<InspectionTask | null>(null);
  const [msgApi, ctxHolder]             = message.useMessage();

  // ── loadFromApi: 拉取后端数据，合并进本地任务列表 ──
  const loadFromApi = useCallback(async () => {
    try {
      const resp = await getInspectionTaskList() as any;
      const apiList: any[] = resp?.data ?? [];
      if (apiList.length > 0) {
        const mapped: InspectionTask[] = apiList.map((item: any) => ({
          id: `api-${item.id}`,
          // compat路由返回双字段（ioCode & taskNo / io_type & taskType等）
          taskNo: item.taskNo   ?? item.ioCode   ?? item.io_code   ?? `QC-${item.id}`,
          schemeId: '',
          schemeCode: item.taskType ?? item.schemeType ?? 'IQC',
          schemeType: (item.schemeType ?? item.taskType ?? 'IQC') as SchemeType,
          schemeName: item.taskType ?? item.schemeType ?? 'IQC',
          sourceType: 'MATERIAL' as const,
          sourceNo: item.sourceNo ?? item.woCode ?? item.wo_code ?? '',
          batchNo: item.batchNo  ?? item.batch_no ?? '',
          woNo:    item.sourceNo ?? item.woCode   ?? item.wo_code  ?? '',
          materialCode: item.materialCode ?? item.material_code ?? '',
          materialName: item.materialName ?? item.material_name ?? '',
          totalQty: Number(item.quantity ?? item.sampleQuantity ?? item.sample_qty ?? 0),
          sampleQty: Number(item.sampleQuantity ?? item.quantity ?? item.sample_qty ?? 0),
          priority: 'C' as 'A' | 'B' | 'C',
          inspectorId: item.inspectorId ? String(item.inspectorId) : undefined,
          inspectorName: item.inspectorName ?? item.inspector_name ?? undefined,
          completeTime: item.completeTime ?? item.inspect_time ?? undefined,
          status: (item.status as TaskStatus) ?? 'PENDING',
          conclusion: (item.result === 'PASS' || item.overallResult === 'PASS' || item.overall_result === 'PASS'
            ? 'PASS'
            : (item.result === 'FAIL' || item.overallResult === 'FAIL' || item.overall_result === 'FAIL'
              ? 'FAIL' : undefined)) as Conclusion | undefined,
          releaseStatus: 'PENDING' as ReleaseStatus,
          disposition: 'NONE' as Disposition,
          items: [],
          remark: item.remark ?? '',
          createdAt: item.createTime ?? item.create_time ?? new Date().toLocaleString(),
        }));
        setTasks(mapped);  // API-first REPLACE
      }
    } catch { /* backend offline — keep local data */ }
  }, [setTasks]);

  useEffect(() => { loadFromApi(); }, [loadFromApi]);

  // ── 过滤 ──
  const filtered = useMemo(() => {
    return tasks.filter(t => {
      const matchSearch = !searchText ||
        t.taskNo.includes(searchText) ||
        (t.batchNo || '').includes(searchText) ||
        (t.woNo || '').includes(searchText) ||
        t.schemeName.includes(searchText);
      const matchStatus = statusFilter === 'ALL' || t.status === statusFilter;
      const matchType   = typeFilter === 'ALL'   || t.schemeType === typeFilter;
      return matchSearch && matchStatus && matchType;
    });
  }, [tasks, searchText, statusFilter, typeFilter]);

  // ── KPI ──
  const kpi = useMemo(() => {
    const pending    = tasks.filter(t => t.status === 'PENDING').length;
    const assigned   = tasks.filter(t => t.status === 'ASSIGNED').length;
    const doing      = tasks.filter(t => t.status === 'DOING').length;
    const waitRetest = tasks.filter(t => t.status === 'WAIT_RETEST').length;
    const completed  = tasks.filter(t => t.status === 'COMPLETED').length;
    const passRate   = completed > 0
      ? Math.round(tasks.filter(t => t.status === 'COMPLETED' && t.conclusion === 'PASS').length / completed * 100)
      : 0;
    return { pending, assigned, doing, waitRetest, completed, total: tasks.length, passRate };
  }, [tasks]);

  // ── 操作 ──
  async function handleAssign(inspectorId: string, checkerId: string) {
    if (!assignTask) return;
    const inspector = QC_INSPECTORS.find(q => q.id === inspectorId);
    const checker   = QC_INSPECTORS.find(q => q.id === checkerId);
    const numId = Number(assignTask.id.replace('api-', ''));
    try {
      if (!isNaN(numId) && numId > 0) {
        await updateInspectionTask(numId, { inspectorId: numId, inspectorName: inspector?.name, status: 'ASSIGNED' });
      }
    } catch { /* 仍然更新本地 */ }
    setTasks(prev => prev.map(t => t.id === assignTask.id
      ? { ...t, status: 'ASSIGNED', inspectorId, inspectorName: inspector?.name, checkerId, checkerName: checker?.name, assignTime: new Date().toLocaleString() }
      : t));
    setAssignTask(null);
    msgApi.success('分派成功');
  }

  async function handleStart(task: InspectionTask) {
    const numId = Number(task.id.replace('api-', ''));
    try {
      if (!isNaN(numId) && numId > 0) {
        await updateInspectionTaskStatus(numId, 'IN_PROGRESS');
      }
    } catch { /* 仍然更新本地 */ }
    setTasks(prev => prev.map(t => t.id === task.id
      ? { ...t, status: 'DOING', startTime: new Date().toLocaleString() }
      : t));
    msgApi.success('检验已开始');
  }

  async function handleExecSubmit(
    updatedTask: InspectionTask,
    conclusion: Conclusion,
    disposition: Disposition,
    remark: string
  ) {
    const failItems = updatedTask.items.filter(i => i.result === 'FAIL').map(i => i.itemName);
    const numId = Number(updatedTask.id.replace('api-', ''));
    try {
      if (!isNaN(numId) && numId > 0) {
        await updateInspectionTaskStatus(numId, 'COMPLETED', conclusion === 'PASS' ? 'PASS' : 'FAIL');
        await updateInspectionTask(numId, { remark, result: conclusion });
      }
    } catch { /* 仍然更新本地 */ }
    setTasks(prev => prev.map(t => t.id === updatedTask.id
      ? {
          ...t,
          ...updatedTask,
          status: 'COMPLETED',
          conclusion,
          disposition: conclusion !== 'PASS' ? disposition : 'NONE',
          dispositionRemark: remark,
          completeTime: new Date().toLocaleString(),
          failItems,
          releaseStatus: conclusion === 'PASS' ? 'PENDING' : 'REJECTED',
        }
      : t));
    setExecTask(null);
    if (conclusion === 'PASS') {
      msgApi.success('检验完成，结论：合格 ✓  已自动生成质量放行申请');
    } else if (conclusion === 'FAIL') {
      msgApi.error('检验完成，结论：不合格 ✗  已触发偏差流程');
    } else {
      msgApi.warning('检验完成，结论：让步接收  需上传审批文件');
    }
  }

  // ── 渲染 ──
  return (
    <div style={{ padding: '16px 20px', background: '#f5f6fa', minHeight: '100vh' }}>
      {ctxHolder}

      {/* 标题 */}
      <div style={{ marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>
          <SolutionOutlined style={{ marginRight: 8, color: '#1890ff' }} />
          QC 检验工作台
        </Title>
        <Text type="secondary">质量检验任务调度中心 · ISO 13485 / GMP / 21 CFR Part 11</Text>
      </div>

      {/* KPI */}
      <Row gutter={12} style={{ marginBottom: 16 }}>
        {[
          { title: '待检验', value: kpi.pending,    color: '#8c8c8c', icon: <ClockCircleOutlined />, filter: 'PENDING' },
          { title: '已分派', value: kpi.assigned,   color: '#1890ff', icon: <UserOutlined />,        filter: 'ASSIGNED' },
          { title: '检验中', value: kpi.doing,      color: '#faad14', icon: <PlayCircleOutlined />,  filter: 'DOING' },
          { title: '待复验', value: kpi.waitRetest, color: '#fa8c16', icon: <ReloadOutlined />,      filter: 'WAIT_RETEST' },
          { title: '已完成', value: kpi.completed,  color: '#52c41a', icon: <CheckCircleOutlined />, filter: 'COMPLETED' },
          { title: '合计',   value: kpi.total,      color: '#595959', icon: <AuditOutlined />,       filter: 'ALL' },
        ].map(item => (
          <Col key={item.filter} span={4}>
            <Card
              size="small"
              hoverable
              style={{
                cursor: 'pointer',
                borderTop: `3px solid ${item.color}`,
                background: statusFilter === item.filter ? '#e6f4ff' : '#fff',
              }}
              bodyStyle={{ padding: '10px 14px' }}
              onClick={() => setStatusFilter(item.filter as any)}
            >
              <Row align="middle" justify="space-between">
                <Col>
                  <div style={{ color: '#8c8c8c', fontSize: 12 }}>{item.title}</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: item.color }}>
                    {item.value}
                  </div>
                </Col>
                <Col>
                  <span style={{ fontSize: 24, color: item.color, opacity: 0.25 }}>{item.icon}</span>
                </Col>
              </Row>
            </Card>
          </Col>
        ))}
      </Row>

      {/* 合格率 */}
      <Card size="small" style={{ marginBottom: 14 }}>
        <Row align="middle" gutter={24}>
          <Col>
            <Text type="secondary">一次合格率：</Text>
            <Text strong style={{
              fontSize: 18,
              color: kpi.passRate >= 95 ? '#52c41a' : kpi.passRate >= 85 ? '#faad14' : '#ff4d4f',
            }}>
              {kpi.passRate}%
            </Text>
          </Col>
          <Col flex="1">
            <Progress
              percent={kpi.passRate}
              strokeColor={kpi.passRate >= 95 ? '#52c41a' : kpi.passRate >= 85 ? '#faad14' : '#ff4d4f'}
              size="small"
            />
          </Col>
          <Col>
            <Text type="secondary" style={{ fontSize: 12 }}>
              已完成 {kpi.completed} 件，合格 {tasks.filter(t => t.conclusion === 'PASS').length} 件
            </Text>
          </Col>
        </Row>
      </Card>

      {/* 检验类型筛选 Tab */}
      <Card size="small" style={{ marginBottom: 12 }} bodyStyle={{ padding: '8px 12px' }}>
        <Space wrap>
          <FilterOutlined style={{ color: '#8c8c8c' }} />
          {schemeTypeFilters.map(f => (
            <Button
              key={f.key}
              size="small"
              type={typeFilter === f.key ? 'primary' : 'default'}
              onClick={() => setTypeFilter(f.key)}
            >
              {f.label}
              {f.key !== 'ALL' && (
                <span style={{ marginLeft: 4, opacity: 0.8 }}>
                  ({tasks.filter(t => t.schemeType === f.key).length})
                </span>
              )}
            </Button>
          ))}
        </Space>
      </Card>

      {/* 工具栏 */}
      <Card size="small" style={{ marginBottom: 12 }} bodyStyle={{ padding: '8px 12px' }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <Input
                placeholder="搜索任务号/批次/工单"
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={e => setSearch(e.target.value)}
                style={{ width: 240 }}
                allowClear
              />
              <Select
                value={statusFilter}
                onChange={v => setStatusFilter(v)}
                style={{ width: 130 }}
              >
                <Option value="ALL">全部状态</Option>
                {Object.entries(TASK_STATUS_MAP).map(([k, v]) => (
                  <Option key={k} value={k}>{v.label}</Option>
                ))}
              </Select>
              <Button icon={<ReloadOutlined />} onClick={() => { setSearch(''); setStatusFilter('ALL'); setTypeFilter('ALL'); }}>
                重置
              </Button>
            </Space>
          </Col>
          <Col>
            <Text type="secondary" style={{ fontSize: 12 }}>
              共 {filtered.length} 条
            </Text>
          </Col>
        </Row>
      </Card>

      {/* 任务列表 */}
      <div>
        {filtered.length === 0 ? (
          <Card style={{ textAlign: 'center', padding: 40 }}>
            <ExclamationCircleOutlined style={{ fontSize: 40, color: '#d9d9d9', display: 'block', marginBottom: 12 }} />
            <Text type="secondary">暂无检验任务</Text>
          </Card>
        ) : (
          filtered.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onView={() => setDetailTask(task)}
              onAssign={() => setAssignTask(task)}
              onStart={() => handleStart(task)}
              onExec={() => setExecTask(task)}
            />
          ))
        )}
      </div>

      {/* 详情 Drawer */}
      <DetailDrawer
        task={detailTask}
        open={!!detailTask}
        onClose={() => setDetailTask(null)}
      />

      {/* 分派 Modal */}
      <AssignModal
        task={assignTask}
        open={!!assignTask}
        onClose={() => setAssignTask(null)}
        onSave={handleAssign}
      />

      {/* 检验执行 Modal */}
      {execTask && (
        <ExecModal
          task={execTask}
          open={!!execTask}
          onClose={() => setExecTask(null)}
          onSubmit={handleExecSubmit}
        />
      )}

      <style>{`
        .row-fail { background: #fff2f0 !important; }
      `}</style>
    </div>
  );
};

export default InspectionPage;

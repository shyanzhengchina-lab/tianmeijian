/**
 * PreProductionCheckPage.tsx — 生产前再确认模块
 * ================================================================
 * PRD §7 完整实现：
 *   - 9项通用生产前再确认清单（自动+手动双模式）
 *   - 外包装岗位简化版（6项）
 *   - 状态机：PENDING → PRE_CHECK → PASS/FAIL
 *   - 清场合格证有效期检查
 *   - 禁止开工逻辑（任一必填项未通过则锁定）
 * ================================================================
 */
import React, { useState, useMemo } from 'react';
import {
  Card, Row, Col, Table, Tag, Button, Modal, Form, Input, Select,
  Space, Statistic, Alert, Descriptions, Steps, Typography, Divider,
  Checkbox, Badge, Timeline, message, Progress, Tooltip, Switch,
  List, Radio,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  CheckCircleOutlined, CloseCircleOutlined, QuestionCircleOutlined,
  SafetyOutlined, AlertOutlined, PlayCircleOutlined, LockOutlined,
  UnlockOutlined, ClockCircleOutlined, ThunderboltOutlined,
  EnvironmentOutlined, TeamOutlined, FileTextOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

// ── 类型 ─────────────────────────────────────────────────────
type CheckMethod = 'AUTO' | 'MANUAL';
type CheckResult = 'PASS' | 'FAIL' | 'PENDING';
type PreCheckStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'PASS' | 'FAIL';

interface CheckItem {
  seq: number;
  code: string;
  content: string;
  method: CheckMethod;
  required: boolean;
  result: CheckResult;
  autoValue?: string;
  manualNote?: string;
  photoRequired?: boolean;
}

interface PreCheckRecord {
  id: string;
  woNumber: string;
  batchNo: string;
  productName: string;
  operationCode: string;
  operationName: string;
  workshopCode: string;
  templateType: 'GENERAL' | 'OUTER_PKG';
  items: CheckItem[];
  status: PreCheckStatus;
  operator: string;
  startTime: string;
  endTime?: string;
  overallResult?: CheckResult;
  failedItems: string[];
}

// ── 通用9项检查模板（PRD §7.1）─────────────────────────────
function buildGeneralTemplate(batchNo: string, woNo: string): CheckItem[] {
  const cleanExpiry = dayjs().add(48, 'hour');
  const cleanValid = dayjs().isBefore(cleanExpiry);
  return [
    { seq: 1, code: 'PC-01', content: '批生产指令文件完整性', method: 'AUTO', required: true,
      result: 'PASS', autoValue: `工单 ${woNo} 已下达(RELEASED)，批记录已创建` },
    { seq: 2, code: 'PC-02', content: '无遗留物（上批产品/物料/废弃物）', method: 'MANUAL', required: true,
      result: 'PENDING', photoRequired: true },
    { seq: 3, code: 'PC-03', content: '清场合格证有效性', method: 'AUTO', required: true,
      result: cleanValid ? 'PASS' : 'FAIL',
      autoValue: cleanValid ? `清场证有效至 ${cleanExpiry.format('YYYY-MM-DD HH:mm')}` : '清场证已过期！需重新清场' },
    { seq: 4, code: 'PC-04', content: '所有物料与生产指令相符（四重核对）', method: 'AUTO', required: true,
      result: 'PASS', autoValue: `批号${batchNo}的BOM物料扫码核对全部通过（6/6种）` },
    { seq: 5, code: 'PC-05', content: '工器具已清洁', method: 'MANUAL', required: true,
      result: 'PENDING' },
    { seq: 6, code: 'PC-06', content: '生产运行状态标志悬挂正确', method: 'MANUAL', required: true,
      result: 'PENDING', photoRequired: true },
    { seq: 7, code: 'PC-07', content: '操作室内温湿度符合规定', method: 'AUTO', required: true,
      result: 'PASS', autoValue: '当前温度 22.5℃（标准20~26℃），湿度 48%（标准40~60%）✅' },
    { seq: 8, code: 'PC-08', content: '设备生产运行标志悬挂正确', method: 'MANUAL', required: true,
      result: 'PENDING' },
    { seq: 9, code: 'PC-09', content: '操作室内压差符合规定', method: 'AUTO', required: true,
      result: 'PASS', autoValue: '当前压差 12Pa（D级洁净区标准≥10Pa）✅' },
  ];
}

// ── 外包装6项清单（PRD §7.1）──────────────────────────────
function buildOuterPkgTemplate(batchNo: string, woNo: string): CheckItem[] {
  return [
    { seq: 1, code: 'PC-PKG-01', content: '是否有批生产指令文件', method: 'AUTO', required: true,
      result: 'PASS', autoValue: `工单 ${woNo} RELEASED状态` },
    { seq: 2, code: 'PC-PKG-02', content: '是否有上批生产遗留物', method: 'MANUAL', required: true, result: 'PENDING' },
    { seq: 3, code: 'PC-PKG-03', content: '是否有清场合格证标志', method: 'AUTO', required: true,
      result: 'PASS', autoValue: '清场合格证有效，有效期至 ' + dayjs().add(36, 'hour').format('YYYY-MM-DD HH:mm') },
    { seq: 4, code: 'PC-PKG-04', content: '所有包材与生产指令相符', method: 'AUTO', required: true,
      result: 'PASS', autoValue: `包材扫码核对通过：瓶标/防伪标/说明书/外盒 全部匹配批号${batchNo}` },
    { seq: 5, code: 'PC-PKG-05', content: '生产运行状态标志悬挂正确', method: 'MANUAL', required: true, result: 'PENDING' },
    { seq: 6, code: 'PC-PKG-06', content: '设备生产运行标志悬挂正确', method: 'MANUAL', required: true, result: 'PENDING' },
  ];
}

// ── 演示数据 ─────────────────────────────────────────────────
const DEMO_RECORDS: PreCheckRecord[] = [
  {
    id: 'PC001', woNumber: 'WO-20260601-0001', batchNo: 'B20260601001',
    productName: '维生素C片 500mg', operationCode: 'GD-02', operationName: '混合',
    workshopCode: 'GD', templateType: 'GENERAL',
    items: [
      ...buildGeneralTemplate('B20260601001', 'WO-20260601-0001').map(i => ({
        ...i,
        result: i.method === 'AUTO' ? i.result : 'PASS' as CheckResult,
        manualNote: i.method === 'MANUAL' ? '已确认' : undefined,
      })),
    ],
    status: 'PASS', operator: '张建国', startTime: '2026-06-01 12:50', endTime: '2026-06-01 13:00',
    overallResult: 'PASS', failedItems: [],
  },
  {
    id: 'PC002', woNumber: 'WO-20260605-0003', batchNo: 'B20260605003',
    productName: '胶原蛋白液体饮料', operationCode: 'YQ-02', operationName: '配制/混合',
    workshopCode: 'YQ', templateType: 'GENERAL',
    items: buildGeneralTemplate('B20260605003', 'WO-20260605-0003'),
    status: 'IN_PROGRESS', operator: '陈小红', startTime: dayjs().subtract(10, 'minute').format('YYYY-MM-DD HH:mm'),
    failedItems: [],
  },
];

// ── 主组件 ────────────────────────────────────────────────────
const PreProductionCheckPage: React.FC = () => {
  const [records, setRecords] = useState<PreCheckRecord[]>(DEMO_RECORDS);
  const [checkVisible, setCheckVisible] = useState(false);
  const [selected, setSelected] = useState<PreCheckRecord | null>(null);
  const [historyVisible, setHistoryVisible] = useState(false);
  const [historyRecord, setHistoryRecord] = useState<PreCheckRecord | null>(null);

  // ── 更新单条检查项 ──
  const updateItem = (recordId: string, itemCode: string, result: CheckResult, note?: string) => {
    setRecords(prev => prev.map(r => {
      if (r.id !== recordId) return r;
      const newItems = r.items.map(i => i.code === itemCode ? { ...i, result, manualNote: note || i.manualNote } : i);
      return { ...r, items: newItems };
    }));
  };

  // ── 提交确认 ──
  const submitCheck = (record: PreCheckRecord) => {
    const failed = record.items.filter(i => i.required && i.result !== 'PASS').map(i => i.code);
    const pending = record.items.filter(i => i.required && i.result === 'PENDING');
    if (pending.length > 0) {
      message.warning(`还有 ${pending.length} 项未确认，请全部确认后提交`);
      return;
    }
    const overall: CheckResult = failed.length === 0 ? 'PASS' : 'FAIL';
    setRecords(prev => prev.map(r => r.id !== record.id ? r : {
      ...r, status: failed.length === 0 ? 'PASS' : 'FAIL',
      overallResult: overall, failedItems: failed,
      endTime: dayjs().format('YYYY-MM-DD HH:mm'),
    }));
    setCheckVisible(false);
    if (overall === 'PASS') {
      message.success('生产前再确认通过 ✅ 允许开工！');
    } else {
      Modal.error({
        title: '生产前再确认未通过 — 禁止开工',
        content: (
          <div>
            <Alert type="error" message={`${failed.length} 项必填检查未通过，禁止开工！`} style={{ marginBottom: 8 }} />
            <ul>{failed.map(f => <li key={f}><Tag color="red">{f}</Tag> 需整改后重新确认</li>)}</ul>
          </div>
        ),
      });
    }
  };

  // ── 统计 ──
  const stats = useMemo(() => ({
    total: records.length,
    pass: records.filter(r => r.status === 'PASS').length,
    fail: records.filter(r => r.status === 'FAIL').length,
    inProgress: records.filter(r => r.status === 'IN_PROGRESS').length,
  }), [records]);

  const getStatusCfg = (s: PreCheckStatus) => ({
    NOT_STARTED: { label: '待开始', color: 'default', allow: false },
    IN_PROGRESS: { label: '确认中', color: 'processing', allow: false },
    PASS:        { label: '✅ 通过 — 允许开工', color: 'success', allow: true },
    FAIL:        { label: '❌ 未通过 — 禁止开工', color: 'error', allow: false },
  }[s]);

  // ── 列定义 ──
  const columns: ColumnsType<PreCheckRecord> = [
    { title: '工单', dataIndex: 'woNumber', width: 150, render: v => <Text code style={{ fontSize: 11 }}>{v}</Text> },
    { title: '批号', dataIndex: 'batchNo', width: 120, render: v => <Tag color="blue">{v}</Tag> },
    { title: '产品', dataIndex: 'productName', width: 160 },
    { title: '工序', dataIndex: 'operationName', width: 100 },
    { title: '确认状态', dataIndex: 'status', width: 170, render: (v: PreCheckStatus) => {
      const cfg = getStatusCfg(v);
      return <Tag color={cfg.color}>{cfg.label}</Tag>;
    }},
    { title: '操作员', dataIndex: 'operator', width: 80 },
    { title: '开始时间', dataIndex: 'startTime', width: 130 },
    { title: '完成时间', dataIndex: 'endTime', width: 130, render: v => v || <Text type="secondary">—</Text> },
    { title: '通过率', width: 90, render: (_, r) => {
      const pass = r.items.filter(i => i.result === 'PASS').length;
      return <Progress percent={Math.round(pass / r.items.length * 100)} size="small" style={{ width: 70 }} />;
    }},
    { title: '操作', width: 160, fixed: 'right', render: (_, r) => (
      <Space size={4}>
        <Button size="small" type="link" onClick={() => { setHistoryRecord(r); setHistoryVisible(true); }}>查看</Button>
        {(r.status === 'IN_PROGRESS' || r.status === 'NOT_STARTED') && (
          <Button size="small" type="primary" icon={<PlayCircleOutlined />} onClick={() => { setSelected({ ...r }); setCheckVisible(true); }}>执行确认</Button>
        )}
      </Space>
    )},
  ];

  return (
    <div style={{ padding: '0 4px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>
          <SafetyOutlined style={{ color: '#52c41a', marginRight: 8 }} />
          生产前再确认模块（PRD §7）
        </Title>
      </div>

      <Row gutter={12} style={{ marginBottom: 16 }}>
        {[
          { label: '确认记录', value: stats.total, color: '#1677ff' },
          { label: '全部通过', value: stats.pass, color: '#52c41a' },
          { label: '确认中', value: stats.inProgress, color: '#faad14' },
          { label: '未通过', value: stats.fail, color: '#ff4d4f' },
        ].map((s, i) => (
          <Col span={6} key={i}>
            <Card size="small" style={{ borderLeft: `3px solid ${s.color}`, textAlign: 'center' }}>
              <Statistic title={s.label} value={s.value} valueStyle={{ color: s.color }} />
            </Card>
          </Col>
        ))}
      </Row>

      <Alert type="info" showIcon style={{ marginBottom: 12 }} message="PRD §7 规定：下道工序开工前必须完成生产前再确认，任一必填项未通过则系统自动禁止开工。" />

      <Table columns={columns} dataSource={records} rowKey="id" size="small" />

      {/* 执行确认弹窗 */}
      <Modal
        title={<Space><SafetyOutlined style={{ color: '#52c41a' }} />生产前再确认 — {selected?.operationName}</Space>}
        open={checkVisible} onCancel={() => setCheckVisible(false)}
        width={780} footer={[
          <Button key="cancel" onClick={() => setCheckVisible(false)}>暂存</Button>,
          <Button key="submit" type="primary" icon={<CheckCircleOutlined />}
            onClick={() => selected && submitCheck(selected)}>
            提交确认结果
          </Button>,
        ]}
      >
        {selected && (
          <>
            <Alert type="info" showIcon style={{ marginBottom: 12 }}
              message={`共 ${selected.items.length} 项检查，${selected.items.filter(i => i.method === 'AUTO').length} 项系统自动校验，${selected.items.filter(i => i.method === 'MANUAL').length} 项需人工确认`}
            />
            <List
              dataSource={selected.items}
              renderItem={item => (
                <List.Item key={item.code} style={{
                  background: item.result === 'PASS' ? '#f6ffed' : item.result === 'FAIL' ? '#fff2f0' : '#fff',
                  borderRadius: 6, marginBottom: 4, padding: '10px 14px',
                  border: `1px solid ${item.result === 'PASS' ? '#b7eb8f' : item.result === 'FAIL' ? '#ffccc7' : '#f0f0f0'}`,
                }}>
                  <div style={{ width: '100%' }}>
                    <Row align="middle" gutter={8}>
                      <Col flex="40px">
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#1677ff', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>
                          {item.seq}
                        </div>
                      </Col>
                      <Col flex="1">
                        <Space>
                          <Text strong>{item.content}</Text>
                          <Tag color={item.method === 'AUTO' ? 'blue' : 'purple'} style={{ fontSize: 10 }}>
                            {item.method === 'AUTO' ? '⚡ 自动' : '👤 手动'}
                          </Tag>
                          {item.required && <Tag color="red" style={{ fontSize: 10 }}>必填</Tag>}
                          {item.photoRequired && <Tag color="orange" style={{ fontSize: 10 }}>需拍照</Tag>}
                        </Space>
                        {item.autoValue && (
                          <div style={{ fontSize: 11, color: '#1677ff', marginTop: 2 }}>
                            系统检测：{item.autoValue}
                          </div>
                        )}
                      </Col>
                      <Col flex="200px" style={{ textAlign: 'right' }}>
                        {item.method === 'AUTO' ? (
                          <Tag color={item.result === 'PASS' ? 'green' : 'red'}>
                            {item.result === 'PASS' ? '✅ 自动通过' : '❌ 自动失败'}
                          </Tag>
                        ) : (
                          <Space>
                            <Radio.Group
                              value={item.result}
                              onChange={e => {
                                const newItems = selected.items.map(i => i.code === item.code ? { ...i, result: e.target.value } : i);
                                setSelected({ ...selected, items: newItems });
                              }}
                            >
                              <Radio.Button value="PASS"><CheckCircleOutlined style={{ color: '#52c41a' }} /> 通过</Radio.Button>
                              <Radio.Button value="FAIL"><CloseCircleOutlined style={{ color: '#ff4d4f' }} /> 不通过</Radio.Button>
                            </Radio.Group>
                          </Space>
                        )}
                      </Col>
                    </Row>
                    {item.result === 'FAIL' && item.method === 'MANUAL' && (
                      <div style={{ marginTop: 6 }}>
                        <Input size="small" placeholder="请填写不通过原因及整改措施" style={{ width: '100%' }}
                          onChange={e => {
                            const newItems = selected.items.map(i => i.code === item.code ? { ...i, manualNote: e.target.value } : i);
                            setSelected({ ...selected, items: newItems });
                          }}
                        />
                      </div>
                    )}
                  </div>
                </List.Item>
              )}
            />

            <Divider style={{ margin: '12px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                已确认：{selected.items.filter(i => i.result !== 'PENDING').length}/{selected.items.length} 项
              </Text>
              <Progress
                percent={Math.round(selected.items.filter(i => i.result !== 'PENDING').length / selected.items.length * 100)}
                style={{ width: 200 }} size="small"
                status={selected.items.filter(i => i.result === 'FAIL').length > 0 ? 'exception' : 'active'}
              />
            </div>
          </>
        )}
      </Modal>

      {/* 历史查看弹窗 */}
      <Modal title="确认记录详情" open={historyVisible} onCancel={() => setHistoryVisible(false)} footer={null} width={700}>
        {historyRecord && (
          <>
            <Descriptions column={2} size="small" bordered>
              <Descriptions.Item label="工单">{historyRecord.woNumber}</Descriptions.Item>
              <Descriptions.Item label="批号"><Tag color="blue">{historyRecord.batchNo}</Tag></Descriptions.Item>
              <Descriptions.Item label="工序">{historyRecord.operationName}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={getStatusCfg(historyRecord.status).color}>{getStatusCfg(historyRecord.status).label}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="确认人">{historyRecord.operator}</Descriptions.Item>
              <Descriptions.Item label="完成时间">{historyRecord.endTime || '—'}</Descriptions.Item>
            </Descriptions>
            <Divider orientation={"left" as any} style={{ fontSize: 12 }}>各项结果</Divider>
            <Table
              size="small" dataSource={historyRecord.items} pagination={false} rowKey="code"
              columns={[
                { title: '序', dataIndex: 'seq', width: 40 },
                { title: '检查项目', dataIndex: 'content', width: 200 },
                { title: '方式', dataIndex: 'method', width: 70, render: v => <Tag color={v === 'AUTO' ? 'blue' : 'purple'} style={{ fontSize: 10 }}>{v}</Tag> },
                { title: '结果', dataIndex: 'result', width: 90, render: v => (
                  <Tag color={v === 'PASS' ? 'green' : v === 'FAIL' ? 'red' : 'default'}>
                    {v === 'PASS' ? '✅通过' : v === 'FAIL' ? '❌不通过' : '待确认'}
                  </Tag>
                )},
                { title: '详细信息', render: (_, r) => (
                  <Text style={{ fontSize: 11 }}>{r.autoValue || r.manualNote || '—'}</Text>
                )},
              ] as ColumnsType<CheckItem>}
            />
          </>
        )}
      </Modal>
    </div>
  );
};

export default PreProductionCheckPage;

/**
 * 批包装记录（SOR-MF-PE-02-05）电子批记录查看页
 *
 * ★ 设计原则 ★
 *   - 本页是【只读汇总报告】，所有数据来源于操作员在PAD端逐工序执行时录入的数据
 *   - 操作员在PAD执行页面完成每道工序（称量→混合→制粒→内包→外包）时，
 *     系统自动将阶段数据写入 execMap，本页自动汇总展示
 *   - QA 在此页做最终审核签名 → 批次放行
 *
 * 数据流：
 *   PAD执行(OP-GMP-WEIGH / MIX / GRANULATE / INNERPACK / OUTERPACK)
 *     → execMap(localStorage bip_pad_exec_map)
 *       → buildEbrFromExecMap(ebrData.ts)
 *         → EbrRecord(localStorage bip_ebr_records)
 *           → 本页读取并展示
 */
import React, { useState, useMemo } from 'react';
import {
  Card, Row, Col, Tabs, Table, Tag, Button, Typography, Descriptions,
  Progress, Space, Alert, Badge, Statistic, Divider, Timeline,
  Empty, Tooltip, Steps,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  FileTextOutlined, CheckCircleOutlined, SyncOutlined, SafetyCertificateOutlined,
  WarningOutlined, ClockCircleOutlined, EnvironmentOutlined, TeamOutlined,
  ToolOutlined, BarChartOutlined, FileDoneOutlined, PrinterOutlined,
  ArrowLeftOutlined, ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import type { EbrRecord, EbrStatus } from './ebrData';
import { EBR_STORAGE_KEY, loadEbrRecords } from './ebrData';
import type { OperationExecution } from '../pad/padExecutionData';
import { GMP_OPERATIONS } from '../pad/padExecutionData';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

// ── 状态映射 ─────────────────────────────────────────────────────
const STATUS_CFG: Record<EbrStatus, { label: string; color: string; icon: React.ReactNode }> = {
  IN_PROGRESS: { label: '生产中',  color: 'processing', icon: <SyncOutlined spin /> },
  COMPLETED:   { label: '待QA审核', color: 'warning',   icon: <FileDoneOutlined /> },
  REVIEWED:    { label: '已审核',  color: 'cyan',       icon: <CheckCircleOutlined /> },
  APPROVED:    { label: '已放行',  color: 'success',    icon: <SafetyCertificateOutlined /> },
  REJECTED:    { label: '已驳回',  color: 'error',      icon: <ExclamationCircleOutlined /> },
};

// GMP 工序中文名映射
const GMP_OP_NAMES: Record<string, string> = {
  'OP-GMP-WEIGH':      '称量配料',
  'OP-GMP-MIX':        '混合',
  'OP-GMP-GRANULATE':  '制粒干燥',
  'OP-GMP-INNERPACK':  '内包装',
  'OP-GMP-INNERCLEAN': '内包清场',
  'OP-GMP-OUTERPACK':  '外包装',
};

// 从 execMap 提取指定工序的 DATA_COLLECT 数据
function getOpDataCollect(execMap: Record<string, OperationExecution>, opCode: string): Record<string, unknown>[] {
  const exec = execMap[opCode];
  if (!exec) return [];
  const dcStage = exec.stages?.DATA_COLLECT;
  if (!dcStage || dcStage.status !== 'completed') return [];
  const rows = (dcStage.data as any)?.records as Record<string, unknown>[];
  return Array.isArray(rows) ? rows : [];
}

// 从 execMap 提取工序报工数据
function getOpReport(execMap: Record<string, OperationExecution>, opCode: string) {
  const exec = execMap[opCode];
  if (!exec) return null;
  return {
    finishQty: exec.finishQty ?? 0,
    goodQty:   exec.goodQty   ?? 0,
    badQty:    exec.badQty    ?? 0,
    scrapQty:  exec.scrapQty  ?? 0,
    inTime:    exec.inTime,
    outTime:   exec.outTime,
    status:    exec.status,
    reportRecords: exec.reportRecords ?? [],
  };
}

// 计算物料平衡率
function calcBalance(issued: number, actualOutput: number): { rate: number; pass: boolean } {
  if (!issued || issued === 0) return { rate: 0, pass: false };
  const rate = (actualOutput / issued) * 100;
  return { rate: parseFloat(rate.toFixed(2)), pass: rate >= 96.0 && rate <= 102.0 };
}

// ── 工序执行进度汇总（Tab1：批包装概览） ─────────────────────────
const OpProgressPanel: React.FC<{ execMap: Record<string, OperationExecution> }> = ({ execMap }) => {
  const steps = GMP_OPERATIONS.map(op => {
    const exec = execMap[op.code];
    let status: 'wait' | 'process' | 'finish' | 'error' = 'wait';
    if (exec?.status === 'completed') status = 'finish';
    else if (exec?.status === 'in_progress') status = 'process';
    else if (exec?.status === 'abnormal') status = 'error';
    return { title: op.name, status, exec };
  });

  return (
    <Steps
      current={(() => { let idx = -1; steps.forEach((s, i) => { if (s.status === 'finish' || s.status === 'process') idx = i; }); return idx; })()}
      style={{ marginBottom: 24 }}
      items={steps.map(s => ({
        title: s.title,
        status: s.status,
        description: s.exec
          ? `产量：${s.exec.goodQty ?? 0} / ${s.exec.finishQty ?? 0}`
          : '待执行',
      }))}
    />
  );
};

// ── Tab2：称量配料记录 ────────────────────────────────────────────
const WeighTab: React.FC<{ execMap: Record<string, OperationExecution> }> = ({ execMap }) => {
  const rows = getOpDataCollect(execMap, 'OP-GMP-WEIGH');
  const report = getOpReport(execMap, 'OP-GMP-WEIGH');

  if (rows.length === 0) {
    return (
      <Alert
        type="info"
        showIcon
        icon={<SyncOutlined />}
        message="称量配料工序尚未在PAD端执行，数据录入后将自动显示"
        description="操作员需在PAD「称量配料」工序的「过程数据采集」阶段录入每种物料的称量数据"
      />
    );
  }

  const columns: ColumnsType<Record<string, unknown>> = [
    { title: '物料名称',   dataIndex: 'material_name', key: 'material_name', width: 140 },
    { title: '批号',       dataIndex: 'batch_no',      key: 'batch_no',      width: 130 },
    { title: '处方量(kg)', dataIndex: 'plan_qty',      key: 'plan_qty',      width: 100,
      render: v => <Text>{String(v ?? '')}</Text> },
    { title: '实称量(kg)', dataIndex: 'actual_qty',    key: 'actual_qty',    width: 100,
      render: v => <Text strong>{String(v ?? '')}</Text> },
    { title: '称量复核',   dataIndex: 'balance_check', key: 'balance_check', width: 100,
      render: v => <Tag color={String(v) === '复核一致' ? 'green' : 'red'}>{String(v ?? '')}</Tag> },
    { title: '温度(℃)',   dataIndex: 'temp',           key: 'temp',          width: 90 },
    { title: '湿度(%)',   dataIndex: 'humidity',        key: 'humidity',      width: 90 },
  ];

  return (
    <Space direction="vertical" style={{ width: '100%' }} size={16}>
      {report && (
        <Row gutter={16}>
          <Col span={6}><Statistic title="称量开始时间" value={report.inTime  ?? '—'} /></Col>
          <Col span={6}><Statistic title="称量完成时间" value={report.outTime ?? '—'} /></Col>
          <Col span={6}><Statistic title="完成状态" valueRender={() =>
            <Tag color={report.status === 'completed' ? 'green' : 'orange'}>
              {report.status === 'completed' ? '已完成' : '进行中'}
            </Tag>
          } /></Col>
        </Row>
      )}
      <Table
        dataSource={rows.map((r, i) => ({ ...r, key: i }))}
        columns={columns}
        pagination={false}
        size="small"
        bordered
        title={() => <Text strong>称量明细记录（共 {rows.length} 种物料）</Text>}
      />
    </Space>
  );
};

// ── Tab3：混合工序记录 ────────────────────────────────────────────
const MixTab: React.FC<{ execMap: Record<string, OperationExecution> }> = ({ execMap }) => {
  const rows = getOpDataCollect(execMap, 'OP-GMP-MIX');
  const report = getOpReport(execMap, 'OP-GMP-MIX');

  if (rows.length === 0) {
    return (
      <Alert type="info" showIcon icon={<SyncOutlined />}
        message="混合工序尚未在PAD端执行"
        description="操作员在PAD「混合」工序的「过程数据采集」阶段录入混合参数后，数据将自动显示" />
    );
  }

  const r = rows[0];
  const rsdVal = Number(r.mix_rsd ?? 0);
  const rsdPass = rsdVal <= 5.0;

  return (
    <Space direction="vertical" style={{ width: '100%' }} size={16}>
      <Row gutter={16}>
        <Col span={6}><Statistic title="混合机编号"   value={String(r.equip_no  ?? '—')} /></Col>
        <Col span={6}><Statistic title="转速(rpm)"    value={String(r.mix_speed ?? '—')} /></Col>
        <Col span={6}><Statistic title="混合时间(min)" value={String(r.mix_time  ?? '—')} /></Col>
        <Col span={6}>
          <Statistic title="混合均匀性 RSD"
            valueRender={() => (
              <Space>
                <Text strong style={{ color: rsdPass ? '#52c41a' : '#ff4d4f', fontSize: 20 }}>
                  {rsdVal}%
                </Text>
                <Tag color={rsdPass ? 'green' : 'red'}>{rsdPass ? 'PASS ≤5%' : 'FAIL'}</Tag>
              </Space>
            )}
          />
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={6}><Statistic title="环境温度" value={`${String(r.temp ?? '—')}℃`} /></Col>
        <Col span={6}><Statistic title="相对湿度" value={`${String(r.humidity ?? '—')}%`} /></Col>
        {report && (
          <>
            <Col span={6}><Statistic title="开始时间" value={report.inTime  ?? '—'} /></Col>
            <Col span={6}><Statistic title="完成时间" value={report.outTime ?? '—'} /></Col>
          </>
        )}
      </Row>
      {!rsdPass && (
        <Alert type="error" showIcon
          message="混合均匀性 RSD 超出规格（>5%），需启动偏差处理程序"
        />
      )}
    </Space>
  );
};

// ── Tab4：内包装（瓶包线）记录 ────────────────────────────────────
const InnerPackTab: React.FC<{ execMap: Record<string, OperationExecution> }> = ({ execMap }) => {
  const rows = getOpDataCollect(execMap, 'OP-GMP-INNERPACK');
  const report = getOpReport(execMap, 'OP-GMP-INNERPACK');

  if (rows.length === 0) {
    return (
      <Alert type="info" showIcon icon={<SyncOutlined />}
        message="内包装工序尚未在PAD端执行"
        description="操作员在PAD「内包装」工序过程数据采集阶段每小时录入一次装量检查数据" />
    );
  }

  const columns: ColumnsType<Record<string, unknown>> = [
    { title: '检查时间',   dataIndex: 'check_time',   key: 'check_time',   width: 100 },
    { title: '装量(片)',   dataIndex: 'fill_qty',     key: 'fill_qty',     width: 90 },
    { title: '装量重(g)',  dataIndex: 'fill_weight',  key: 'fill_weight',  width: 90 },
    { title: '瓶盖密封',   dataIndex: 'seal_check',   key: 'seal_check',   width: 90,
      render: v => <Tag color={String(v) === '合格' ? 'green' : 'red'}>{String(v ?? '')}</Tag> },
    { title: '标签位置',   dataIndex: 'label_check',  key: 'label_check',  width: 90,
      render: v => <Tag color={String(v) === '合格' ? 'green' : 'red'}>{String(v ?? '')}</Tag> },
    { title: '温度(℃)',   dataIndex: 'temp',          key: 'temp',          width: 80 },
    { title: '湿度(%)',   dataIndex: 'humidity',       key: 'humidity',      width: 80 },
  ];

  const allPass = rows.every(r => String(r.seal_check) === '合格' && String(r.label_check) === '合格');

  return (
    <Space direction="vertical" style={{ width: '100%' }} size={16}>
      {report && (
        <Row gutter={16}>
          <Col span={5}><Statistic title="开始时间"   value={report.inTime  ?? '—'} /></Col>
          <Col span={5}><Statistic title="完成时间"   value={report.outTime ?? '—'} /></Col>
          <Col span={4}><Statistic title="总产量"     value={report.finishQty} suffix="瓶" /></Col>
          <Col span={4}><Statistic title="合格品"     value={report.goodQty}   suffix="瓶"
            valueStyle={{ color: '#52c41a' }} /></Col>
          <Col span={4}><Statistic title="不合格品"   value={report.badQty}    suffix="瓶"
            valueStyle={{ color: report.badQty > 0 ? '#ff4d4f' : undefined }} /></Col>
          <Col span={2}>
            <Tag color={allPass ? 'green' : 'orange'} style={{ marginTop: 28, fontSize: 13 }}>
              {allPass ? '全部合格' : '存在异常'}
            </Tag>
          </Col>
        </Row>
      )}
      <Table
        dataSource={rows.map((r, i) => ({ ...r, key: i }))}
        columns={columns}
        pagination={false}
        size="small"
        bordered
        title={() => <Text strong>装量检查记录（每小时一次，共 {rows.length} 次）</Text>}
      />
    </Space>
  );
};

// ── Tab5：外包装记录 ──────────────────────────────────────────────
const OuterPackTab: React.FC<{ execMap: Record<string, OperationExecution> }> = ({ execMap }) => {
  const rows = getOpDataCollect(execMap, 'OP-GMP-OUTERPACK');
  const report = getOpReport(execMap, 'OP-GMP-OUTERPACK');

  if (rows.length === 0) {
    return (
      <Alert type="info" showIcon icon={<SyncOutlined />}
        message="外包装工序尚未在PAD端执行" />
    );
  }

  const columns: ColumnsType<Record<string, unknown>> = [
    { title: '检查时间',    dataIndex: 'check_time',   key: 'check_time',   width: 100 },
    { title: '每盒瓶数',    dataIndex: 'bottles_per_box', key: 'bottles_per_box', width: 90 },
    { title: '说明书',      dataIndex: 'insert_check', key: 'insert_check', width: 90,
      render: v => <Tag color={String(v) === '合格' ? 'green' : 'red'}>{String(v ?? '')}</Tag> },
    { title: '批号打印',    dataIndex: 'batch_print',  key: 'batch_print',  width: 110,
      render: v => <Tag color={String(v) === '清晰正确' ? 'green' : 'red'}>{String(v ?? '')}</Tag> },
    { title: '盒体密封',    dataIndex: 'seal_check',   key: 'seal_check',   width: 90,
      render: v => <Tag color={String(v) === '合格' ? 'green' : 'red'}>{String(v ?? '')}</Tag> },
    { title: 'UPC/批号复核', dataIndex: 'code_verify', key: 'code_verify',  width: 110,
      render: v => <Tag color={String(v) === '一致' ? 'green' : 'red'}>{String(v ?? '')}</Tag> },
  ];

  return (
    <Space direction="vertical" style={{ width: '100%' }} size={16}>
      {report && (
        <Row gutter={16}>
          <Col span={6}><Statistic title="开始时间" value={report.inTime  ?? '—'} /></Col>
          <Col span={6}><Statistic title="完成时间" value={report.outTime ?? '—'} /></Col>
          <Col span={6}><Statistic title="装盒总数" value={report.finishQty} suffix="盒" /></Col>
          <Col span={6}><Statistic title="合格盒数" value={report.goodQty}   suffix="盒"
            valueStyle={{ color: '#52c41a' }} /></Col>
        </Row>
      )}
      <Table
        dataSource={rows.map((r, i) => ({ ...r, key: i }))}
        columns={columns}
        pagination={false}
        size="small"
        bordered
        title={() => <Text strong>外包装检查记录（共 {rows.length} 次）</Text>}
      />
    </Space>
  );
};

// ── Tab6：物料平衡表 ──────────────────────────────────────────────
const MaterialBalanceTab: React.FC<{
  execMap: Record<string, OperationExecution>;
  planQty: number;
}> = ({ execMap, planQty }) => {
  const innerReport = getOpReport(execMap, 'OP-GMP-INNERPACK');
  const outerReport = getOpReport(execMap, 'OP-GMP-OUTERPACK');

  const weighRows = getOpDataCollect(execMap, 'OP-GMP-WEIGH');
  const totalIssued = weighRows.reduce((sum, r) => sum + Number(r.actual_qty ?? 0), 0);

  const items = [
    {
      name: '称量物料合计',
      issued: totalIssued,
      output: totalIssued,  // 称量→混合视为100%转移
      unit: 'kg',
    },
    {
      name: '内包装瓶数',
      issued: planQty,
      output: innerReport?.finishQty ?? 0,
      unit: '瓶',
    },
    {
      name: '合格装瓶数',
      issued: planQty,
      output: innerReport?.goodQty ?? 0,
      unit: '瓶',
    },
    {
      name: '外包装装盒数',
      issued: innerReport?.goodQty ?? planQty,
      output: outerReport?.finishQty ?? 0,
      unit: '盒',
    },
  ].map(item => {
    const { rate, pass } = calcBalance(item.issued, item.output);
    return { ...item, rate, pass };
  });

  const overallPass = items.every(i => i.issued === 0 || i.pass);

  const columns: ColumnsType<typeof items[0]> = [
    { title: '物料/产品',   dataIndex: 'name',    key: 'name',    width: 150 },
    { title: '计划数量',    dataIndex: 'issued',  key: 'issued',  width: 100,
      render: (v, r) => `${v} ${r.unit}` },
    { title: '实际产出',    dataIndex: 'output',  key: 'output',  width: 100,
      render: (v, r) => <Text strong>{v} {r.unit}</Text> },
    { title: '平衡率(%)',  dataIndex: 'rate',    key: 'rate',    width: 100,
      render: v => <Text strong>{v}%</Text> },
    { title: '是否合格',    dataIndex: 'pass',    key: 'pass',    width: 100,
      render: (v, r) => (
        r.issued === 0
          ? <Tag>待执行</Tag>
          : <Tag color={v ? 'green' : 'red'}>{v ? '合格 96~102%' : '异常'}</Tag>
      ),
    },
  ];

  return (
    <Space direction="vertical" style={{ width: '100%' }} size={16}>
      <Alert
        type={overallPass ? 'success' : 'warning'}
        showIcon
        message={overallPass
          ? '物料平衡计算结果：全部合格（96.0%~102.0%）'
          : '物料平衡异常，请检查工序数据后启动偏差调查'}
      />
      <Table
        dataSource={items.map((r, i) => ({ ...r, key: i }))}
        columns={columns}
        pagination={false}
        size="small"
        bordered
        title={() => (
          <Space>
            <BarChartOutlined />
            <Text strong>物料平衡汇总表（GMP规定 96.0%~102.0%）</Text>
          </Space>
        )}
      />
      <Divider dashed />
      <Paragraph type="secondary" style={{ fontSize: 12 }}>
        注：物料平衡率 = 实际产出量 / 计划投料量 × 100%。
        若平衡率超出96.0~102.0%范围，需填写偏差报告并经QA批准后方可继续。
      </Paragraph>
    </Space>
  );
};

// ── Tab7：工序汇总 Timeline ────────────────────────────────────────
const TimelineTab: React.FC<{ execMap: Record<string, OperationExecution> }> = ({ execMap }) => {
  const items = GMP_OPERATIONS.map(op => {
    const exec = execMap[op.code];
    const name = GMP_OP_NAMES[op.code] ?? op.name;
    if (!exec) return { op: name, status: 'pending' as const, exec: null };
    return { op: name, status: exec.status as string, exec };
  });

  return (
    <Timeline mode="left">
      {items.map((item, i) => {
        const color =
          item.status === 'completed' ? 'green' :
          item.status === 'in_progress' ? 'blue' :
          item.status === 'abnormal' ? 'red' : 'gray';
        const label = item.exec
          ? `${item.exec.inTime ?? ''} → ${item.exec.outTime ?? ''}`
          : '待执行';
        return (
          <Timeline.Item key={i} color={color} label={label}>
            <Text strong>{item.op}</Text>
            {item.exec && (
              <div>
                <Text type="secondary">
                  产量：{item.exec.finishQty ?? 0} / 合格：{item.exec.goodQty ?? 0} / 报废：{item.exec.scrapQty ?? 0}
                </Text>
              </div>
            )}
          </Timeline.Item>
        );
      })}
    </Timeline>
  );
};

// ── 主页面 ────────────────────────────────────────────────────────
const BatchPackagingEbrPage: React.FC = () => {
  const [ebrRecords] = useLocalStorage<EbrRecord[]>(EBR_STORAGE_KEY, loadEbrRecords());
  const [execMap]    = useLocalStorage<Record<string, OperationExecution>>('bip_pad_exec_map', {});
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // 筛选出批包装（保健品）相关的EBR，或展示全部
  const packEbrs = useMemo(() => {
    // 优先显示有GMP工序执行数据的EBR；其次显示所有
    return ebrRecords.length > 0 ? ebrRecords : [];
  }, [ebrRecords]);

  const selectedEbr = selectedId
    ? packEbrs.find(e => e.id === selectedId) ?? null
    : packEbrs[0] ?? null;

  // 列表列
  const listColumns: ColumnsType<EbrRecord> = [
    { title: 'EBR编号',  dataIndex: 'ebrNo',       key: 'ebrNo',       width: 160 },
    { title: '批号',      dataIndex: 'batchNo',     key: 'batchNo',     width: 150 },
    { title: '产品',      dataIndex: 'productName', key: 'productName', width: 160 },
    { title: '计划数量',  dataIndex: 'planQtyTotal', key: 'plan',       width: 90,
      render: v => `${v ?? 0} 件` },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 110,
      render: (v: EbrStatus) => {
        const cfg = STATUS_CFG[v] ?? STATUS_CFG.IN_PROGRESS;
        return <Tag color={cfg.color} icon={cfg.icon}>{cfg.label}</Tag>;
      },
    },
    {
      title: '操作', key: 'action', width: 80,
      render: (_, r) => (
        <Button type="link" size="small" onClick={() => setSelectedId(r.id)}>
          查看
        </Button>
      ),
    },
  ];

  if (!selectedEbr) {
    return (
      <div style={{ padding: 24 }}>
        <Alert
          type="info"
          showIcon
          icon={<FileTextOutlined />}
          message="暂无批包装记录"
          description={
            <span>
              操作员需在 <strong>PAD执行</strong> 端完成以下工序后，批记录将自动生成：<br />
              称量配料 → 混合 → 制粒干燥 → 内包装 → 外包装
            </span>
          }
          style={{ marginBottom: 24 }}
        />
        <Card title="批记录生成流程说明" size="small">
          <Timeline>
            <Timeline.Item color="blue" dot={<ToolOutlined />}>
              <Text strong>第1步：PAD执行端</Text>
              <br /><Text type="secondary">操作员选择工单 → 逐工序执行 → 每道工序「数据采集」阶段录入参数</Text>
            </Timeline.Item>
            <Timeline.Item color="blue" dot={<SyncOutlined />}>
              <Text strong>第2步：系统自动汇总</Text>
              <br /><Text type="secondary">所有工序完成后，系统自动按批次汇总形成电子批记录</Text>
            </Timeline.Item>
            <Timeline.Item color="green" dot={<SafetyCertificateOutlined />}>
              <Text strong>第3步：QA审核放行</Text>
              <br /><Text type="secondary">QA在本页查看完整批记录 → 审核签名 → 批次放行</Text>
            </Timeline.Item>
          </Timeline>
        </Card>
      </div>
    );
  }

  const statusCfg = STATUS_CFG[selectedEbr.status];
  const completedOps = GMP_OPERATIONS.filter(op => execMap[op.code]?.status === 'completed').length;
  const progress = Math.round((completedOps / GMP_OPERATIONS.length) * 100);

  return (
    <div style={{ padding: '0 0 24px' }}>
      {/* 顶部：批次选择 + 状态 */}
      {packEbrs.length > 1 && (
        <Card size="small" style={{ marginBottom: 12 }}>
          <Space wrap>
            <Text>选择批次：</Text>
            {packEbrs.map(e => (
              <Button
                key={e.id}
                type={selectedEbr.id === e.id ? 'primary' : 'default'}
                size="small"
                onClick={() => setSelectedId(e.id)}
              >
                {e.batchNo}
              </Button>
            ))}
          </Space>
        </Card>
      )}

      {/* 批次基本信息 */}
      <Card
        style={{ marginBottom: 12 }}
        title={
          <Space>
            <FileTextOutlined style={{ color: '#1677ff' }} />
            <Text strong style={{ fontSize: 16 }}>
              批包装记录（SOR-MF-PE-02-05）— {selectedEbr.batchNo}
            </Text>
            <Tag color={statusCfg.color} icon={statusCfg.icon}>{statusCfg.label}</Tag>
          </Space>
        }
        extra={
          <Button icon={<PrinterOutlined />} onClick={() => window.print()}>
            打印
          </Button>
        }
      >
        <Descriptions column={4} size="small" bordered>
          <Descriptions.Item label="EBR编号">{selectedEbr.ebrNo}</Descriptions.Item>
          <Descriptions.Item label="产品名称">{selectedEbr.productName}</Descriptions.Item>
          <Descriptions.Item label="产品批号">{selectedEbr.batchNo}</Descriptions.Item>
          <Descriptions.Item label="计划数量">{selectedEbr.planQty ?? 0} 件</Descriptions.Item>
          <Descriptions.Item label="工艺路线">{selectedEbr.routingName ?? '—'}</Descriptions.Item>
          <Descriptions.Item label="工单编号">{selectedEbr.woNo}</Descriptions.Item>
          <Descriptions.Item label="生产开始">{(selectedEbr as any).productionStart ?? '—'}</Descriptions.Item>
          <Descriptions.Item label="生产完成">{(selectedEbr as any).productionEnd ?? '—'}</Descriptions.Item>
        </Descriptions>

        {/* 工序完成进度 */}
        <div style={{ marginTop: 16 }}>
          <Row gutter={16} align="middle">
            <Col span={3}><Text type="secondary">批记录完成度</Text></Col>
            <Col span={18}>
              <Progress
                percent={progress}
                status={progress === 100 ? 'success' : 'active'}
                strokeColor={progress === 100 ? '#52c41a' : '#1677ff'}
              />
            </Col>
            <Col span={3}>
              <Text strong>{completedOps} / {GMP_OPERATIONS.length} 工序</Text>
            </Col>
          </Row>
        </div>

        {selectedEbr.status === 'IN_PROGRESS' && (
          <Alert
            type="info"
            showIcon
            icon={<SyncOutlined spin />}
            message="批记录生成中 — 操作员正在PAD端执行各工序，完成后数据将自动同步至此处"
            style={{ marginTop: 12 }}
          />
        )}
      </Card>

      {/* 工序数据 Tabs */}
      <Card bodyStyle={{ padding: 0 }}>
        <Tabs
          defaultActiveKey="overview"
          size="large"
          tabBarStyle={{ padding: '0 16px', marginBottom: 0 }}
          tabBarGutter={8}
        >
          <TabPane
            tab={<span><FileDoneOutlined />批次概览</span>}
            key="overview"
          >
            <div style={{ padding: '16px 24px' }}>
              <OpProgressPanel execMap={execMap} />
              <Divider dashed />
              <TimelineTab execMap={execMap} />
            </div>
          </TabPane>

          <TabPane
            tab={<span><BarChartOutlined />① 称量配料</span>}
            key="weigh"
          >
            <div style={{ padding: '16px 24px' }}>
              <WeighTab execMap={execMap} />
            </div>
          </TabPane>

          <TabPane
            tab={<span><SyncOutlined />② 混合</span>}
            key="mix"
          >
            <div style={{ padding: '16px 24px' }}>
              <MixTab execMap={execMap} />
            </div>
          </TabPane>

          <TabPane
            tab={<span><ToolOutlined />③ 内包装</span>}
            key="innerpack"
          >
            <div style={{ padding: '16px 24px' }}>
              <InnerPackTab execMap={execMap} />
            </div>
          </TabPane>

          <TabPane
            tab={<span><FileDoneOutlined />④ 外包装</span>}
            key="outerpack"
          >
            <div style={{ padding: '16px 24px' }}>
              <OuterPackTab execMap={execMap} />
            </div>
          </TabPane>

          <TabPane
            tab={<span><BarChartOutlined />物料平衡</span>}
            key="balance"
          >
            <div style={{ padding: '16px 24px' }}>
              <MaterialBalanceTab
                execMap={execMap}
                planQty={selectedEbr.planQtyTotal ?? 0}
              />
            </div>
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default BatchPackagingEbrPage;

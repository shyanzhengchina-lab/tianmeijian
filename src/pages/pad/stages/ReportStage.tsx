/**
 * ReportStage.tsx — 报工阶段（支持同一工序多次报工）
 * 文档依据：PAD 17工序演示.docx §五、§六
 *
 * 核心逻辑：
 *   - 阶段（Phase）是一次性质量门：前清场/首件只做一次
 *   - 报工（Report）是产量记录：可多次，每次累加
 *   - 末次报工后 → 触发 POST_CLEAN → CHECK_OUT
 *   - 提交后弹出「继续加工 / 本工序完工」两路分支
 */
import React, { useState } from 'react';
import {
  Button, Card, Space, Typography, Tag, Alert, Row, Col,
  Select, DatePicker, Checkbox, message, Divider, Input,
  Modal, Badge, Statistic, Progress,
} from 'antd';
import {
  CheckCircleOutlined, EditOutlined, ScanOutlined,
  HistoryOutlined, PlusCircleOutlined, FlagOutlined,
} from '@ant-design/icons';
import type { StageExecution, WorkOrder, ReportRecord } from '../padExecutionData';
import dayjs from 'dayjs';
import PadNumPad from '../components/PadNumPad';
import PadCamera, { CapturedPhoto } from '../components/PadCamera';

const { Text, Title } = Typography;
const { Option } = Select;

interface ReportStageProps {
  workOrder: WorkOrder;
  opCode: string;
  /** 来自 OperationExecution 的已有报工记录（多次报工历史） */
  reportRecords: ReportRecord[];
  execution: StageExecution;
  /** isLastReport=true → 完成报工后触发 POST_CLEAN 流程 */
  onComplete: (data: Record<string, unknown>, isLastReport: boolean) => void;
  onESign: (cb: () => void) => void;
  needsQcWriteback?: boolean;
}

const BAD_REASONS = [
  '装量偏差', '外观不合格', '密封异常', '重量超差',
  '设备故障停机', '物料批号不符', '环境条件偏差', '操作失误', '微生物污染风险',
];

const EQUIP_BY_OP: Record<string, Array<{ id: string; name: string }>> = {
  // ── GMP 保健品工序设备 ─────────────────────────────────────────
  'OP-GMP-WEIGH':      [{ id: 'EQ-BAL01', name: '电子天平-BAL01（量程60kg）' }, { id: 'EQ-BAL02', name: '电子天平-BAL02（量程6kg）' }],
  'OP-GMP-MIX':        [{ id: 'EQ-MIX01', name: '三维运动混合机-MIX01' }],
  'OP-GMP-GRANULATE':  [{ id: 'EQ-GRA01', name: '湿法制粒机-GRA01' }, { id: 'EQ-DRY01', name: '沸腾干燥机-DRY01' }],
  'OP-GMP-COATING':    [{ id: 'EQ-BY01', name: '薄膜包衣机-BY01' }, { id: 'EQ-BY02', name: '薄膜包衣机-BY02' }],
  'OP-GMP-INNERPACK':  [{ id: 'EQ-BTP01', name: '全自动瓶包机-BTP01' }, { id: 'EQ-BTP02', name: '全自动瓶包机-BTP02' }],
  'OP-GMP-INNERCLEAN': [{ id: 'EQ-VAC01', name: '工业吸尘器-VAC01' }],
  'OP-GMP-OUTERPACK':  [{ id: 'EQ-CTN01', name: '装盒机-CTN01' }, { id: 'EQ-CSE01', name: '装箱机-CSE01' }],
  'OP-PROBIO-FILL':    [{ id: 'EQ-CAP01', name: '全自动胶囊充填机-CAP01' }, { id: 'EQ-CAP02', name: '全自动胶囊充填机-CAP02' }],
};

const PROCESS_PARAMS: Record<string, Array<{ label: string; value: string; unit: string }>> = {
  // ── GMP 保健品工序工艺参数 ──────────────────────────────────────
  'OP-GMP-WEIGH':     [{ label: '称量精度', value: '±0.1%', unit: '' }, { label: '环境温度', value: '22±2', unit: '℃' }, { label: '相对湿度', value: '55±5', unit: '%' }],
  'OP-GMP-MIX':       [{ label: '混合转速', value: '12', unit: 'rpm' }, { label: '混合时间', value: '20', unit: 'min' }, { label: '混合均匀度(RSD)', value: '≤5', unit: '%' }],
  'OP-GMP-GRANULATE': [{ label: '进风温度', value: '55±5', unit: '℃' }, { label: '出风温度', value: '40±5', unit: '℃' }, { label: '干燥时间', value: '60', unit: 'min' }, { label: '颗粒水分', value: '≤3.0', unit: '%' }],
  'OP-GMP-COATING':   [{ label: '进风温度', value: '45±5', unit: '℃' }, { label: '出风温度', value: '40±5', unit: '℃' }, { label: '包衣液喷速', value: '8~12', unit: 'g/min' }, { label: '锅转速', value: '4~6', unit: 'rpm' }, { label: '终止增重率', value: '2~4', unit: '%' }],
  'OP-GMP-INNERPACK': [{ label: '装量范围', value: '±5%', unit: '' }, { label: '生产速度', value: '60', unit: '瓶/min' }, { label: '封口温度', value: '180±10', unit: '℃' }],
  'OP-GMP-INNERCLEAN':[{ label: '清场方式', value: '湿法清洁', unit: '' }, { label: '清洁剂', value: '纯化水', unit: '' }],
  'OP-GMP-OUTERPACK': [{ label: '每盒装量', value: '60', unit: '粒/盒' }, { label: '每箱装量', value: '48', unit: '盒/箱' }, { label: '封箱方式', value: '热熔胶', unit: '' }],
  'OP-PROBIO-FILL':   [{ label: '充填量', value: '400±10', unit: 'mg/粒' }, { label: '充填速度', value: '35000', unit: '粒/h' }, { label: '装量差异', value: '±5%', unit: '' }],
};
const DEFAULT_PARAMS = [{ label: '生产班次', value: '白班', unit: '' }, { label: '生产批次', value: '-', unit: '' }];

const SHIFT_OPTIONS = ['白班', '中班', '夜班', '早班'];

// ── 历史报工浮层 ────────────────────────────────────────────────
const HistoryDrawer: React.FC<{
  open: boolean;
  onClose: () => void;
  records: ReportRecord[];
  planQty: number;
}> = ({ open, onClose, records, planQty }) => {
  const totalFinish = records.reduce((s, r) => s + r.finishQty, 0);
  const totalGood   = records.reduce((s, r) => s + r.goodQty, 0);
  const totalBad    = records.reduce((s, r) => s + r.badQty, 0);
  const pct = planQty > 0 ? Math.min(100, Math.round((totalFinish / planQty) * 100)) : 0;

  return (
    <Modal
      open={open}
      title={<Space><HistoryOutlined style={{ color: '#1677ff' }} />本工序报工历史</Space>}
      footer={<Button onClick={onClose}>关闭</Button>}
      onCancel={onClose}
      width={520}
    >
      {/* 汇总进度 */}
      <div style={{ background: '#f0f7ff', borderRadius: 8, padding: '12px 16px', marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <Text strong>累计进度：{totalFinish.toLocaleString()} / {planQty.toLocaleString()} 件</Text>
          <Tag color={pct >= 100 ? 'success' : 'processing'}>{pct}%</Tag>
        </div>
        <Progress percent={pct} strokeColor={pct >= 100 ? '#52c41a' : '#1677ff'} size="small" />
        <Row gutter={16} style={{ marginTop: 8 }}>
          <Col span={8}><Text type="secondary" style={{ fontSize: 12 }}>合格：</Text><Text strong style={{ color: '#52c41a' }}>{totalGood.toLocaleString()}</Text></Col>
          <Col span={8}><Text type="secondary" style={{ fontSize: 12 }}>不良：</Text><Text strong style={{ color: '#ff4d4f' }}>{totalBad.toLocaleString()}</Text></Col>
          <Col span={8}><Text type="secondary" style={{ fontSize: 12 }}>报废：</Text><Text strong style={{ color: '#8c8c8c' }}>{(totalFinish - totalGood - totalBad).toLocaleString()}</Text></Col>
        </Row>
      </div>

      {/* 各次报工明细 */}
      <Space direction="vertical" style={{ width: '100%' }} size={10}>
        {records.length === 0 && (
          <div style={{ textAlign: 'center', color: '#bfbfbf', padding: 20 }}>暂无报工记录</div>
        )}
        {records.map(r => (
          <Card
            key={r.seq}
            size="small"
            style={{ borderRadius: 8, borderColor: r.isLastReport ? '#b7eb8f' : '#d9d9d9',
              background: r.isLastReport ? '#f6ffed' : '#fff' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <Space>
                <Badge count={`#${r.seq}`} style={{ background: r.isLastReport ? '#52c41a' : '#1677ff' }} />
                <Text strong style={{ fontSize: 13 }}>{r.shiftName}</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>{r.reportTime}</Text>
                {r.isLastReport && <Tag color="success" style={{ fontSize: 11 }}>末次报工</Tag>}
              </Space>
              <Tag color="blue" style={{ fontSize: 12 }}>完工 {r.finishQty.toLocaleString()} 件</Tag>
            </div>
            <Row gutter={16}>
              <Col span={6}><Text type="secondary" style={{ fontSize: 11 }}>合格：</Text><Text style={{ color: '#52c41a', fontSize: 12 }}>{r.goodQty}</Text></Col>
              <Col span={6}><Text type="secondary" style={{ fontSize: 11 }}>不良：</Text><Text style={{ color: r.badQty > 0 ? '#ff4d4f' : '#8c8c8c', fontSize: 12 }}>{r.badQty}</Text></Col>
              <Col span={6}><Text type="secondary" style={{ fontSize: 11 }}>报废：</Text><Text style={{ fontSize: 12 }}>{r.scrapQty}</Text></Col>
              <Col span={6}><Text type="secondary" style={{ fontSize: 11 }}>设备：</Text><Text style={{ fontSize: 11 }}>{r.equipName}</Text></Col>
            </Row>
            {r.badReasons && r.badReasons !== '' && (
              <div style={{ marginTop: 4 }}>
                <Text type="secondary" style={{ fontSize: 11 }}>不良原因：{r.badReasons}</Text>
              </div>
            )}
            {r.operator && (
              <div style={{ marginTop: 2 }}>
                <Text type="secondary" style={{ fontSize: 11 }}>操作员：{r.operator}
                  {r.photoCount ? `  |  📷 ${r.photoCount}张` : ''}
                </Text>
              </div>
            )}
          </Card>
        ))}
      </Space>
    </Modal>
  );
};

// ── 完工确认弹窗（末次报工分支） ────────────────────────────────
const FinishConfirmModal: React.FC<{
  open: boolean;
  totalFinish: number;
  planQty: number;
  onContinue: () => void;
  onLastReport: () => void;
  onCancel: () => void;
}> = ({ open, totalFinish, planQty, onContinue, onLastReport, onCancel }) => {
  const remain = Math.max(0, planQty - totalFinish);
  const isOver = totalFinish >= planQty;
  return (
    <Modal
      open={open}
      title={<Space><CheckCircleOutlined style={{ color: '#52c41a' }} />报工提交成功</Space>}
      footer={null}
      onCancel={onCancel}
      closable={false}
      width={460}
    >
      <div style={{ padding: '8px 0' }}>
        <div style={{ background: '#f0f7ff', borderRadius: 8, padding: '12px 16px', marginBottom: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 14, color: '#344054', marginBottom: 6 }}>本次报工已记录</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: isOver ? '#52c41a' : '#1677ff' }}>
            累计完工：{totalFinish.toLocaleString()} / {planQty.toLocaleString()} 件
          </div>
          {!isOver && (
            <div style={{ fontSize: 13, color: '#667085', marginTop: 4 }}>
              剩余：<span style={{ color: '#faad14', fontWeight: 600 }}>{remain.toLocaleString()} 件</span>
            </div>
          )}
          {isOver && (
            <Tag color="success" style={{ marginTop: 6, fontSize: 12 }}>✓ 已达计划数量</Tag>
          )}
        </div>

        <div style={{ marginBottom: 12, fontSize: 13, color: '#344054', fontWeight: 600, textAlign: 'center' }}>
          请选择下一步操作：
        </div>

        <Space direction="vertical" style={{ width: '100%' }} size={10}>
          {!isOver && (
            <Button
              type="primary"
              size="large"
              block
              icon={<PlusCircleOutlined />}
              onClick={onContinue}
              style={{ height: 52, fontSize: 15, fontWeight: 700, background: '#1677ff' }}
            >
              继续加工（本批次未完工，继续下一次报工）
            </Button>
          )}
          <Button
            type={isOver ? 'primary' : 'default'}
            size="large"
            block
            icon={<FlagOutlined />}
            onClick={onLastReport}
            style={{
              height: 52, fontSize: 15, fontWeight: 700,
              background: isOver ? '#52c41a' : undefined,
              borderColor: isOver ? '#52c41a' : '#ff4d4f',
              color: isOver ? '#fff' : '#ff4d4f',
            }}
          >
            {isOver ? '✅ 本工序完工（进入后清场）' : '🏁 本批次完工（末次报工，进入后清场）'}
          </Button>
          {!isOver && (
            <Button size="large" block onClick={onCancel}
              style={{ height: 44, fontSize: 13, color: '#8c8c8c' }}>
              取消（返回报工界面）
            </Button>
          )}
        </Space>
      </div>
    </Modal>
  );
};

// ══════════════════════════════════════════════════════════════
// 主组件
// ══════════════════════════════════════════════════════════════
const ReportStage: React.FC<ReportStageProps> = ({
  workOrder, opCode, reportRecords, execution, onComplete, onESign, needsQcWriteback,
}) => {
  const equipList    = EQUIP_BY_OP[opCode] || [{ id: 'EQ-001', name: '通用设备-001' }];
  const processParams = PROCESS_PARAMS[opCode] || DEFAULT_PARAMS;

  // ── 表单状态 ──
  const [shift,      setShift]      = useState('白班');
  const [equip,      setEquip]      = useState('');
  const [finishQty,  setFinishQty]  = useState<number | null>(null);
  const [goodQty,    setGoodQty]    = useState<number | null>(null);
  const [badQty,     setBadQty]     = useState<number | null>(0);
  const [scrapQty,   setScrapQty]   = useState<number | null>(0);
  const [badReasons, setBadReasons] = useState<string[]>([]);
  const [otherReason,setOtherReason]= useState('');
  const [photos,     setPhotos]     = useState<CapturedPhoto[]>([]);
  const [signed,     setSigned]     = useState(false);
  // ── UI 状态 ──
  const [historyOpen,    setHistoryOpen]    = useState(false);
  const [finishConfirm,  setFinishConfirm]  = useState(false);
  const [submittedRecord, setSubmittedRecord] = useState<ReportRecord | null>(null);

  // ── 派生量 ──
  const bQty = badQty ?? 0;
  const sQty = scrapQty ?? 0;
  const effectiveGoodQty = needsQcWriteback
    ? (goodQty ?? 0)
    : ((finishQty ?? 0) - bQty - sQty);

  const prevTotal = reportRecords.reduce((s, r) => s + r.finishQty, 0);
  const newTotal  = prevTotal + (finishQty ?? 0);
  const remain    = Math.max(0, workOrder.planQty - prevTotal);

  const qtyBalanced = finishQty !== null
    && finishQty >= 0
    && finishQty === effectiveGoodQty + bQty + sQty;

  const canSubmit = !!equip && finishQty !== null && finishQty > 0
    && qtyBalanced && signed && photos.length >= 1;

  const thisSeq = reportRecords.length + 1;
  const isCompleted = execution.status === 'completed';

  // ── 处理器 ──
  const handleSign = () => {
    onESign(() => { setSigned(true); message.success('电子签名完成'); });
  };

  const handleEquipScan = () => {
    const first = equipList[0];
    setEquip(first.id);
    message.success(`设备 ${first.name} 扫码绑定成功`);
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    const now = dayjs().format('YYYY-MM-DD HH:mm');
    const record: ReportRecord = {
      seq:         thisSeq,
      shiftName:   shift,
      finishQty:   finishQty!,
      goodQty:     effectiveGoodQty,
      badQty:      bQty,
      scrapQty:    sQty,
      equipId:     equip,
      equipName:   equipList.find(e => e.id === equip)?.name || equip,
      operator:    '张三(1001)',
      reportTime:  now,
      isLastReport: false,  // 先设 false，由弹窗分支决定
      badReasons:  [...badReasons, otherReason].filter(Boolean).join('，'),
      photoCount:  photos.length,
      params:      processParams as unknown as Record<string, unknown>,
    };
    setSubmittedRecord(record);
    setFinishConfirm(true);
  };

  const resetForm = () => {
    setFinishQty(null);
    setGoodQty(null);
    setBadQty(0);
    setScrapQty(0);
    setBadReasons([]);
    setOtherReason('');
    setPhotos([]);
    setSigned(false);
  };

  const handleContinueWork = () => {
    if (!submittedRecord) return;
    // 记录本次报工（非末次），然后重置表单继续
    const rec = { ...submittedRecord, isLastReport: false };
    onComplete({
      // 本次报工数据（追加到 reportRecords 列表）
      newRecord:     rec,
      isLastReport:  false,
      // 汇总数据（用于 OperationExecution 累计字段）
      totalFinishQty: prevTotal + rec.finishQty,
      totalGoodQty:   reportRecords.reduce((s, r) => s + r.goodQty, 0) + rec.goodQty,
      totalBadQty:    reportRecords.reduce((s, r) => s + r.badQty, 0) + rec.badQty,
      totalScrapQty:  reportRecords.reduce((s, r) => s + r.scrapQty, 0) + rec.scrapQty,
    }, false);
    setFinishConfirm(false);
    setSubmittedRecord(null);
    resetForm();
    message.success(`第 ${rec.seq} 次报工已记录（${rec.finishQty.toLocaleString()} 件），请继续加工`);
  };

  const handleLastReport = () => {
    if (!submittedRecord) return;
    const rec = { ...submittedRecord, isLastReport: true };
    onComplete({
      newRecord:     rec,
      isLastReport:  true,
      totalFinishQty: prevTotal + rec.finishQty,
      totalGoodQty:   reportRecords.reduce((s, r) => s + r.goodQty, 0) + rec.goodQty,
      totalBadQty:    reportRecords.reduce((s, r) => s + r.badQty, 0) + rec.badQty,
      totalScrapQty:  reportRecords.reduce((s, r) => s + r.scrapQty, 0) + rec.scrapQty,
    }, true);
    setFinishConfirm(false);
    setSubmittedRecord(null);
    message.success(`末次报工完成！累计 ${(prevTotal + rec.finishQty).toLocaleString()} 件 → 进入后清场`);
  };

  // ── 已完成（末次报工后） ──
  if (isCompleted) {
    const totalFinish = reportRecords.reduce((s, r) => s + r.finishQty, 0);
    const totalGood   = reportRecords.reduce((s, r) => s + r.goodQty, 0);
    const totalBad    = reportRecords.reduce((s, r) => s + r.badQty, 0);
    const totalScrap  = reportRecords.reduce((s, r) => s + r.scrapQty, 0);

    return (
      <Card style={{ background: '#f6ffed', border: '2px solid #b7eb8f', borderRadius: 10 }}>
        <Space direction="vertical" style={{ width: '100%' }} size={8}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Space>
              <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 20 }} />
              <Text strong style={{ color: '#52c41a', fontSize: 14 }}>
                报工已完成（共 {reportRecords.length} 次）
              </Text>
            </Space>
            <Button size="small" icon={<HistoryOutlined />} onClick={() => setHistoryOpen(true)}>
              查看明细
            </Button>
          </div>
          <Row gutter={24}>
            <Col><Statistic title="完工" value={totalFinish} suffix="件" valueStyle={{ color: '#1890ff', fontSize: 16 }} /></Col>
            <Col><Statistic title="合格" value={totalGood}   suffix="件" valueStyle={{ color: '#52c41a', fontSize: 16 }} /></Col>
            <Col><Statistic title="不良" value={totalBad}    suffix="件" valueStyle={{ color: '#ff4d4f', fontSize: 16 }} /></Col>
            <Col><Statistic title="报废" value={totalScrap}  suffix="件" valueStyle={{ color: '#8c8c8c', fontSize: 16 }} /></Col>
          </Row>
        </Space>
        <HistoryDrawer open={historyOpen} onClose={() => setHistoryOpen(false)}
          records={reportRecords} planQty={workOrder.planQty} />
      </Card>
    );
  }

  // ── 表单主体 ──
  return (
    <div>
      {/* 进度横幅 */}
      {reportRecords.length > 0 && (
        <Card
          size="small"
          style={{ marginBottom: 12, borderRadius: 10, background: '#fffbe6', border: '1px solid #ffe58f' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Space>
              <Tag color="gold">第 {thisSeq} 次报工</Tag>
              <Text style={{ fontSize: 13 }}>
                已累计：<b style={{ color: '#1677ff' }}>{prevTotal.toLocaleString()}</b> / {workOrder.planQty.toLocaleString()} 件
                &nbsp;（剩余 <b style={{ color: '#faad14' }}>{remain.toLocaleString()}</b> 件）
              </Text>
            </Space>
            <Button
              size="small"
              icon={<HistoryOutlined />}
              onClick={() => setHistoryOpen(true)}
            >
              历史报工 ({reportRecords.length})
            </Button>
          </div>
          <Progress
            percent={Math.min(100, Math.round((prevTotal / workOrder.planQty) * 100))}
            size="small"
            style={{ marginTop: 6, marginBottom: 0 }}
            strokeColor="#1677ff"
          />
        </Card>
      )}

      <Card
        title={
          <Space>
            <span>📝</span>
            <span>报工{reportRecords.length > 0 ? `（第 ${thisSeq} 次）` : ''}</span>
          </Space>
        }
        style={{ marginBottom: 14, borderRadius: 10 }}
      >
        <Space direction="vertical" style={{ width: '100%' }} size={14}>
          {needsQcWriteback && (
            <Alert type="warning"
              message="本工序合格数量需 QC 检验完成后回写。请先填写完工数量，合格数量留空或待 QA 回写。"
              showIcon />
          )}

          {/* 生产信息 */}
          <Card size="small" title={<Text strong style={{ fontSize: 13 }}>生产信息</Text>} style={{ borderRadius: 8 }}>
            <Row gutter={[20, 12]} align="middle">
              <Col xs={24} sm={7}>
                <Space direction="vertical" size={4}>
                  <Text type="secondary" style={{ fontSize: 12 }}>班次</Text>
                  <Select size="large" style={{ width: 130 }} value={shift} onChange={setShift}>
                    {SHIFT_OPTIONS.map(s => <Option key={s} value={s}>{s}</Option>)}
                  </Select>
                </Space>
              </Col>
              <Col xs={24} sm={7}>
                <Space direction="vertical" size={4}>
                  <Text type="secondary" style={{ fontSize: 12 }}>生产日期</Text>
                  <DatePicker size="large" style={{ width: 160 }} defaultValue={dayjs()} format="YYYY-MM-DD" />
                </Space>
              </Col>
              <Col xs={24} sm={10}>
                <Space direction="vertical" size={4}>
                  <Text type="secondary" style={{ fontSize: 12 }}>设备编号</Text>
                  <Space>
                    <Select size="large" style={{ width: 200 }} placeholder="选择或扫码设备"
                      value={equip || undefined} onChange={v => setEquip(v)}>
                      {equipList.map(e => <Option key={e.id} value={e.id}>{e.name}</Option>)}
                    </Select>
                    <Button icon={<ScanOutlined />} size="large" onClick={handleEquipScan}>扫码</Button>
                  </Space>
                </Space>
              </Col>
            </Row>
            <Row style={{ marginTop: 12 }}>
              <Col>
                <Space direction="vertical" size={4}>
                  <Text type="secondary" style={{ fontSize: 12 }}>生产人员</Text>
                  <Tag color="blue" style={{ fontSize: 13, padding: '5px 12px' }}>张三 (1001)</Tag>
                </Space>
              </Col>
            </Row>
          </Card>

          {/* 数量录入 */}
          <Card size="small" title={<Text strong style={{ fontSize: 13 }}>数量录入（点击数字区域弹出键盘）</Text>} style={{ borderRadius: 8 }}>
            <Space direction="vertical" style={{ width: '100%' }} size={14}>

              {/* 计划/剩余数量（只读） */}
              <Row gutter={16} align="middle">
                <Col span={6}><Text strong style={{ fontSize: 14 }}>本次计划：</Text></Col>
                <Col span={18}>
                  <Space size={16}>
                    <Text style={{ fontSize: 18, fontWeight: 700, color: '#595959', fontFamily: 'monospace' }}>
                      {remain.toLocaleString()} 件
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      (工序计划 {workOrder.planQty.toLocaleString()}，已完 {prevTotal.toLocaleString()})
                    </Text>
                  </Space>
                </Col>
              </Row>

              {/* 完工数量 */}
              <Row gutter={16} align="middle">
                <Col span={6}><Text strong style={{ fontSize: 14 }}>完工数量：</Text></Col>
                <Col span={14}>
                  <PadNumPad
                    value={finishQty}
                    onChange={setFinishQty}
                    precision={0}
                    allowDecimal={false}
                    unit="件"
                    label="完工数量"
                    min={0}
                    max={remain + 50}
                    width={180}
                    height={56}
                    fontSize={17}
                    validTag={
                      finishQty !== null
                        ? <Tag color="processing" style={{ marginLeft: 8, fontSize: 12 }}>已填写</Tag>
                        : undefined
                    }
                  />
                </Col>
                {finishQty !== null && (
                  <Col span={4}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      累计将达：<br />
                      <b style={{ color: newTotal >= workOrder.planQty ? '#52c41a' : '#1677ff', fontSize: 13 }}>
                        {newTotal.toLocaleString()}
                      </b>
                    </Text>
                  </Col>
                )}
              </Row>

              {/* 合格数量 */}
              <Row gutter={16} align="middle">
                <Col span={6}>
                  <Space>
                    <Text strong style={{ fontSize: 14 }}>合格数量：</Text>
                    {needsQcWriteback && <Tag color="orange" style={{ fontSize: 11 }}>QC回写</Tag>}
                  </Space>
                </Col>
                <Col span={14}>
                  {needsQcWriteback ? (
                    <PadNumPad
                      value={goodQty}
                      onChange={setGoodQty}
                      precision={0}
                      allowDecimal={false}
                      unit="件"
                      label="合格数量（QC回写）"
                      min={0}
                      width={180}
                      height={56}
                      fontSize={17}
                      placeholder="等待QC回写"
                    />
                  ) : (
                    <Text style={{ fontSize: 20, fontWeight: 700, color: '#52c41a', fontFamily: 'monospace' }}>
                      {finishQty !== null ? Math.max(0, finishQty - bQty - sQty) : '—'} 件
                      <Text type="secondary" style={{ fontSize: 12, marginLeft: 6 }}>(自动计算)</Text>
                    </Text>
                  )}
                </Col>
              </Row>

              {/* 不良数量 */}
              <Row gutter={16} align="middle">
                <Col span={6}><Text strong style={{ fontSize: 14 }}>不良数量：</Text></Col>
                <Col span={14}>
                  <PadNumPad
                    value={badQty}
                    onChange={setBadQty}
                    precision={0}
                    allowDecimal={false}
                    unit="件"
                    label="不良数量"
                    min={0}
                    width={180}
                    height={56}
                    fontSize={17}
                    validTag={
                      bQty > 0
                        ? <Tag color="error" style={{ marginLeft: 8, fontSize: 12 }}>有不良</Tag>
                        : <Tag color="success" style={{ marginLeft: 8, fontSize: 12 }}>无不良</Tag>
                    }
                  />
                </Col>
              </Row>

              {/* 报废数量 */}
              <Row gutter={16} align="middle">
                <Col span={6}><Text strong style={{ fontSize: 14 }}>报废数量：</Text></Col>
                <Col span={14}>
                  <PadNumPad
                    value={scrapQty}
                    onChange={setScrapQty}
                    precision={0}
                    allowDecimal={false}
                    unit="件"
                    label="报废数量"
                    min={0}
                    width={180}
                    height={56}
                    fontSize={17}
                    validTag={
                      sQty > 0
                        ? <Tag color="warning" style={{ marginLeft: 8, fontSize: 12 }}>有报废</Tag>
                        : <Tag color="success" style={{ marginLeft: 8, fontSize: 12 }}>无报废</Tag>
                    }
                  />
                </Col>
              </Row>

              {/* 数量校验 */}
              {finishQty !== null && (
                <Alert
                  type={qtyBalanced ? 'success' : 'error'}
                  showIcon
                  message={
                    qtyBalanced
                      ? `✓ 数量校验通过：${finishQty} = ${effectiveGoodQty}（合格）+ ${bQty}（不良）+ ${sQty}（报废）`
                      : `✗ 数量不平衡：完工 ${finishQty} ≠ 合格 ${effectiveGoodQty} + 不良 ${bQty} + 报废 ${sQty} = ${effectiveGoodQty + bQty + sQty}`
                  }
                />
              )}
            </Space>
          </Card>

          {/* 工艺参数 */}
          <Card size="small" title={<Text strong style={{ fontSize: 13 }}>工艺参数（设备自动采集）</Text>} style={{ borderRadius: 8 }}>
            <Row gutter={[20, 8]}>
              {processParams.map(p => (
                <Col key={p.label} xs={12} sm={6}>
                  <Text type="secondary" style={{ fontSize: 12 }}>{p.label}：</Text>
                  <Text strong style={{ fontSize: 13 }}>{p.value}{p.unit}</Text>
                </Col>
              ))}
            </Row>
          </Card>

          {/* 不良原因 */}
          {(bQty > 0 || sQty > 0) && (
            <Card size="small" title={<Text strong style={{ fontSize: 13 }}>不良原因（多选）</Text>}
              style={{ borderRadius: 8, background: '#fff7e6' }}>
              <Space direction="vertical" style={{ width: '100%' }} size={10}>
                <Checkbox.Group value={badReasons} onChange={v => setBadReasons(v as string[])}>
                  <Row gutter={[12, 8]}>
                    {BAD_REASONS.map(r => (
                      <Col key={r} span={8}>
                        <Checkbox value={r} style={{ fontSize: 13 }}>{r}</Checkbox>
                      </Col>
                    ))}
                  </Row>
                </Checkbox.Group>
                <Space>
                  <Text style={{ fontSize: 13 }}>其他原因：</Text>
                  <Input size="large" style={{ width: 300, fontSize: 13 }} placeholder="请填写其他不良原因"
                    value={otherReason} onChange={e => setOtherReason(e.target.value)} />
                </Space>
              </Space>
            </Card>
          )}

          {/* 报工拍照 */}
          <Card size="small" title={<Text strong style={{ fontSize: 13 }}>现场拍照留证（至少1张）</Text>} style={{ borderRadius: 8 }}>
            <PadCamera
              photos={photos}
              onChange={setPhotos}
              minCount={1}
              maxCount={6}
              label="现场拍照"
            />
          </Card>

          <Divider style={{ margin: '6px 0' }} />

          {/* 签名 */}
          <Row justify="end" align="middle">
            <Col>
              <Space size={12}>
                <Text strong style={{ fontSize: 14 }}>操作员电子签名：</Text>
                {signed ? (
                  <Tag color="success" style={{ fontSize: 13, padding: '4px 12px' }}>✓ 张三 已签名</Tag>
                ) : (
                  <Button icon={<EditOutlined />} size="large"
                    style={{ height: 44, fontSize: 14, background: '#722ed1', color: '#fff', border: 'none' }}
                    onClick={handleSign}
                    disabled={!qtyBalanced || finishQty === null}>
                    电子签名
                  </Button>
                )}
              </Space>
            </Col>
          </Row>
        </Space>
      </Card>

      {/* 提交按钮 */}
      <div style={{ textAlign: 'right' }}>
        <Button type="primary" size="large" disabled={!canSubmit} onClick={handleSubmit}
          style={{ height: 52, fontSize: 16, paddingInline: 36, fontWeight: 700 }}>
          ✅ 提交本次报工
        </Button>
      </div>

      {/* 历史报工弹窗 */}
      <HistoryDrawer
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        records={reportRecords}
        planQty={workOrder.planQty}
      />

      {/* 完工分支弹窗 */}
      <FinishConfirmModal
        open={finishConfirm}
        totalFinish={prevTotal + (submittedRecord?.finishQty ?? 0)}
        planQty={workOrder.planQty}
        onContinue={handleContinueWork}
        onLastReport={handleLastReport}
        onCancel={() => setFinishConfirm(false)}
      />
    </div>
  );
};

export default ReportStage;

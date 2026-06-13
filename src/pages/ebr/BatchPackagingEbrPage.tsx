/**
 * 批包装记录（EBR）— 天美健MES
 * 文件编号：SOR-MF-PE-02-05
 * 按原纸质批记录 1:1 电子化实现
 * =====================================================================
 * 结构：
 *  1. 批包装指令
 *  2. 瓶包线岗位生产记录 + 清场记录
 *  3. 外包装岗位生产记录 + 清场记录
 *  4. 各工序QA监控记录
 *  5. 物料平衡表
 *  6. 成品检验报告
 *  7. 成品放行审核单
 * =====================================================================
 */
import React, { useState, useCallback } from 'react';
import {
  Card, Tabs, Form, Input, InputNumber, Select, Table, Button, Space,
  Divider, Tag, Alert, Modal, message, Checkbox, Row, Col,
  Descriptions, Steps, DatePicker, TimePicker, Typography, Badge,
  Tooltip, Progress, Radio,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  CheckCircleOutlined, PrinterOutlined, SaveOutlined,
  LockOutlined, UnlockOutlined, AuditOutlined, FileProtectOutlined,
  ExperimentOutlined, SafetyCertificateOutlined, ThunderboltOutlined,
  UserOutlined, ClockCircleOutlined, FileTextOutlined,
  WarningOutlined, InfoCircleOutlined, CheckSquareOutlined,
  CalculatorOutlined, FormOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Text, Title, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

// ─── 类型定义 ─────────────────────────────────────────────────────────
interface EbrHeader {
  productName: string;
  productCode: string;
  batchNo: string;
  batchSize: number;
  batchUnit: string;
  productionDate: string;
  expiryDate: string;
  orderNo: string;
  docNo: string;
  version: string;
  workshopCode: string;
  routingCode: string;
  issuer: string;
  issueDate: string;
}

interface PreConfirmItem {
  key: string;
  label: string;
  yes: boolean | null;
  remark: string;
}

interface BottleLineRecord {
  // 领料
  semiFgWeight: string;
  semiFgBatchNo: string;
  semiFgOperator: string;
  // 装粒
  fillQty: number;
  fillUnit: string;
  fillSpec: string;
  // 旋盖扭矩
  capTorque: string;
  // 贴标批号
  labelBatchNo: string;
  labelMfgDate: string;
  labelExpiry: string;
  labelOperator: string;
  labelReviewer: string;
  // 生产数量
  bottleIn: number;
  bottleOut: number;
  bottleScrap: number;
  // 设备
  equipList: Array<{ name: string; code: string; status: string }>;
}

interface EnvRecord {
  time: string;
  temp: string;
  humidity: string;
  operator: string;
}

interface FillCheckRecord {
  time: string;
  sampleNo: string;
  fillWeight: string;
  deviation: string;
  pass: boolean;
  operator: string;
}

interface CleanupRecord {
  items: Array<{ key: string; label: string; method: string; done: boolean }>;
  cleanOperator: string;
  cleanTime: string;
  reviewOperator: string;
  reviewTime: string;
  qaOperator: string;
  qaTime: string;
  certNo: string;
  certValid: boolean;
  remark: string;
}

interface OuterPackRecord {
  boxFillQty: number;
  boxPerCase: number;
  leafletBatchNo: string;
  // 实际数量
  boxIn: number;
  boxOut: number;
  boxScrap: number;
  caseOut: number;
  operator: string;
  reviewer: string;
}

interface QaMonitorRecord {
  station: string;
  checkTime: string;
  checkItem: string;
  standard: string;
  result: string;
  pass: boolean;
  qaName: string;
  remark: string;
}

interface MaterialBalanceItem {
  name: string;
  code: string;
  unit: string;
  issued: number;
  actual: number;
  remainder: number;
  scrap: number;
  rate: number;
  pass: boolean;
  remark: string;
}

interface FinalQcReport {
  reportNo: string;
  sampleDate: string;
  sampleQty: string;
  inspector: string;
  reviewer: string;
  checkItems: Array<{
    item: string;
    standard: string;
    result: string;
    pass: boolean;
  }>;
  conclusion: 'PASS' | 'FAIL' | 'PENDING';
  conclusionRemark: string;
}

interface ReleaseRecord {
  reviewItems: Array<{ item: string; pass: boolean; reviewer: string; remark: string }>;
  qaReviewer: string;
  qaDate: string;
  decision: 'RELEASE' | 'REJECT' | 'PENDING';
  decisionRemark: string;
}

// ─── 初始数据 ──────────────────────────────────────────────────────────
const DEFAULT_HEADER: EbrHeader = {
  productName: '复方氨酚烷胺胶囊',
  productCode: 'CP-001',
  batchNo: '',
  batchSize: 5000,
  batchUnit: '盒',
  productionDate: dayjs().format('YYYY-MM-DD'),
  expiryDate: dayjs().add(24, 'month').format('YYYY-MM-DD'),
  orderNo: '',
  docNo: 'SOR-MF-PE-02-05',
  version: 'V3.0',
  workshopCode: 'NJ-BZ',
  routingCode: 'NJ-GD-TAB-001',
  issuer: 'QA李工',
  issueDate: dayjs().format('YYYY-MM-DD'),
};

const PRE_CONFIRM_ITEMS: PreConfirmItem[] = [
  { key: 'has_instruction',   label: '是否有批生产指令文件',            yes: null, remark: '' },
  { key: 'no_residue',        label: '是否有上批生产遗留物',            yes: null, remark: '' },
  { key: 'has_cleanup_cert',  label: '是否有清场合格证标志',            yes: null, remark: '' },
  { key: 'material_match',    label: '所有物料与生产指令相符（品名/批号/数量）', yes: null, remark: '' },
  { key: 'tools_cleaned',     label: '工器具已清洁（状态标志悬挂正确）', yes: null, remark: '' },
  { key: 'room_status_sign',  label: '生产运行状态标志悬挂正确',        yes: null, remark: '' },
  { key: 'env_temp_humid_ok', label: '操作室内温湿度符合规定（T:18-26℃ RH:45-65%）', yes: null, remark: '' },
  { key: 'equip_sign_ok',     label: '设备生产运行标志悬挂正确',        yes: null, remark: '' },
  { key: 'pressure_diff_ok',  label: '操作室内压差符合规定（≥5Pa）',   yes: null, remark: '' },
];

const BOTTLE_LINE_EQUIP = [
  { name: '高速自动理瓶机',    code: 'LB-001' },
  { name: '高速塞干燥剂机',    code: 'GZJ-001' },
  { name: '电子数粒机',        code: 'SLJ-001' },
  { name: '高速搓式旋盖机',    code: 'XGJ-001' },
  { name: '立式自动贴标机',    code: 'TBJ-001' },
];

const CLEANUP_ITEMS_BOTTLE = [
  { key: 'floor',    label: '地面', method: '用饮用水擦拭，再用纯化水擦拭' },
  { key: 'wall',     label: '墙壁及顶棚', method: '用饮用水擦拭' },
  { key: 'equip_surface', label: '设备外表面', method: '用饮用水擦拭，再用75%乙醇擦拭' },
  { key: 'equip_inner',   label: '设备接触面', method: '拆卸清洗，灭菌处理' },
  { key: 'window',   label: '门窗及台面', method: '用饮用水擦拭，再用纯化水擦拭' },
  { key: 'material', label: '剩余物料清除', method: '退回仓库，填写退料单' },
  { key: 'label',    label: '标签及文件', method: '收回归档，废弃标签毁形' },
  { key: 'waste',    label: '废弃物处置', method: '按废弃物管理规程处理' },
];

const QA_MONITOR_STATIONS = [
  { station: '理瓶', items: ['瓶子外观', '清洁度'] },
  { station: '塞干燥剂', items: ['干燥剂数量', '干燥剂外观'] },
  { station: '数粒充填', items: ['装量', '外观（无破损）', '异物检查'] },
  { station: '旋盖', items: ['扭矩', '密封性'] },
  { station: '贴标', items: ['批号日期', '标签位置', '标签外观'] },
  { station: '装盒', items: ['说明书', '装盒数量', '盒外观'] },
];

const FINAL_QC_ITEMS_LIST = [
  { item: '【外观】胶囊外观', standard: '表面光滑，无破损，颜色均匀' },
  { item: '【鉴别】薄层色谱鉴别', standard: '与对照品色谱相对应斑点一致' },
  { item: '【崩解时限】', standard: '≤30分钟' },
  { item: '【溶出度】', standard: '45分钟溶出量≥75%' },
  { item: '【含量均匀度】', standard: 'AV值≤15' },
  { item: '【含量测定】对乙酰氨基酚', standard: '95.0%-105.0%' },
  { item: '【含量测定】金刚烷胺', standard: '95.0%-105.0%' },
  { item: '【有关物质】', standard: '任一杂质≤0.1%，总杂质≤0.5%' },
  { item: '【水分】', standard: '≤7.0%' },
  { item: '【装量差异】', standard: '±7.5%' },
  { item: '【微生物限度】需氧菌总数', standard: '≤1000CFU/g' },
  { item: '【微生物限度】霉菌和酵母菌', standard: '≤100CFU/g' },
  { item: '【包装完整性】铝塑板泡罩', standard: '无破损，封口严密' },
  { item: '【标签】批号、日期印刷', standard: '清晰正确，符合规定' },
];

const RELEASE_REVIEW_ITEMS = [
  { item: '批包装记录完整性检查（所有表格已填写，无空白项）' },
  { item: '批记录数据真实性审核（原始数据与复核一致）' },
  { item: '过程检验结果均符合标准' },
  { item: '物料平衡率在96.0%-102.0%范围内' },
  { item: '成品检验全项目合格' },
  { item: '清场合格证在有效期内（固体制剂72小时）' },
  { item: '偏差处理完毕（如有偏差，已按偏差处理程序处理）' },
  { item: '生产过程中无未处理的异常事件' },
  { item: '电子签名合规性确认' },
];

// ─── 主组件 ─────────────────────────────────────────────────────────────
const BatchPackagingEbrPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('1');
  const [locked, setLocked] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // 各表单数据
  const [header, setHeader] = useState<EbrHeader>(DEFAULT_HEADER);
  const [preConfirm, setPreConfirm] = useState<PreConfirmItem[]>(PRE_CONFIRM_ITEMS.map(i => ({ ...i })));
  const [preOperator, setPreOperator] = useState('');
  const [preReviewer, setPreReviewer] = useState('');

  // 瓶包线记录
  const [bottleRecord, setBottleRecord] = useState<Partial<BottleLineRecord>>({
    semiFgWeight: '',
    fillQty: 10,
    fillUnit: '粒/瓶',
    bottleIn: 5100,
    bottleOut: 5000,
    bottleScrap: 100,
    equipList: BOTTLE_LINE_EQUIP.map(e => ({ ...e, status: 'NORMAL' })),
  });

  // 环境记录
  const [envRecords, setEnvRecords] = useState<EnvRecord[]>([
    { time: '08:00', temp: '22', humidity: '52', operator: '' },
    { time: '10:00', temp: '23', humidity: '54', operator: '' },
    { time: '12:00', temp: '23', humidity: '55', operator: '' },
    { time: '14:00', temp: '22', humidity: '53', operator: '' },
    { time: '16:00', temp: '21', humidity: '50', operator: '' },
  ]);

  // 装量检查记录
  const [fillChecks, setFillChecks] = useState<FillCheckRecord[]>([
    { time: '09:00', sampleNo: '1', fillWeight: '', deviation: '', pass: true, operator: '' },
    { time: '11:00', sampleNo: '2', fillWeight: '', deviation: '', pass: true, operator: '' },
    { time: '13:00', sampleNo: '3', fillWeight: '', deviation: '', pass: true, operator: '' },
    { time: '15:00', sampleNo: '4', fillWeight: '', deviation: '', pass: true, operator: '' },
  ]);

  // 瓶包线清场
  const [bottleCleanup, setBottleCleanup] = useState<CleanupRecord>({
    items: CLEANUP_ITEMS_BOTTLE.map(i => ({ ...i, done: false })),
    cleanOperator: '', cleanTime: '',
    reviewOperator: '', reviewTime: '',
    qaOperator: '', qaTime: '',
    certNo: `CLN-${dayjs().format('YYYYMMDD')}-BZ`,
    certValid: false, remark: '',
  });

  // 外包装记录
  const [outerPack, setOuterPack] = useState<Partial<OuterPackRecord>>({
    boxFillQty: 1, boxPerCase: 200, boxIn: 5000, boxOut: 4980, boxScrap: 20, caseOut: 24,
    operator: '', reviewer: '',
  });

  // 外包装清场
  const [outerCleanup, setOuterCleanup] = useState<CleanupRecord>({
    items: CLEANUP_ITEMS_BOTTLE.map(i => ({ ...i, done: false })),
    cleanOperator: '', cleanTime: '',
    reviewOperator: '', reviewTime: '',
    qaOperator: '', qaTime: '',
    certNo: `CLN-${dayjs().format('YYYYMMDD')}-WBZ`,
    certValid: false, remark: '',
  });

  // QA监控
  const [qaRecords, setQaRecords] = useState<QaMonitorRecord[]>(
    QA_MONITOR_STATIONS.flatMap(st => st.items.map(item => ({
      station: st.station, checkTime: '', checkItem: item,
      standard: '符合规定', result: '', pass: true, qaName: 'QA李工', remark: '',
    })))
  );

  // 物料平衡
  const [materialBalance, setMaterialBalance] = useState<MaterialBalanceItem[]>([
    { name: '复方氨酚烷胺胶囊半成品', code: 'BCP-001', unit: 'kg', issued: 25.0, actual: 0, remainder: 0, scrap: 0, rate: 0, pass: false, remark: '' },
    { name: '铝塑泡罩板', code: 'PK-001', unit: '片', issued: 5200, actual: 0, remainder: 0, scrap: 0, rate: 0, pass: false, remark: '' },
    { name: '药盒（折叠纸盒）', code: 'PK-002', unit: '个', issued: 5100, actual: 0, remainder: 0, scrap: 0, rate: 0, pass: false, remark: '' },
    { name: '说明书', code: 'PK-003', unit: '张', issued: 5100, actual: 0, remainder: 0, scrap: 0, rate: 0, pass: false, remark: '' },
    { name: '干燥剂', code: 'PK-004', unit: '袋', issued: 5100, actual: 0, remainder: 0, scrap: 0, rate: 0, pass: false, remark: '' },
    { name: '标签', code: 'PK-005', unit: '张', issued: 5200, actual: 0, remainder: 0, scrap: 0, rate: 0, pass: false, remark: '' },
    { name: '箱', code: 'PK-006', unit: '个', issued: 30, actual: 0, remainder: 0, scrap: 0, rate: 0, pass: false, remark: '' },
  ]);

  // 成品检验
  const [finalQc, setFinalQc] = useState<FinalQcReport>({
    reportNo: `QCR-${dayjs().format('YYYYMMDD')}-001`,
    sampleDate: dayjs().format('YYYY-MM-DD'),
    sampleQty: '留样200粒，检验用30粒',
    inspector: 'QC张工',
    reviewer: 'QA李工',
    checkItems: FINAL_QC_ITEMS_LIST.map(i => ({ ...i, result: '', pass: true })),
    conclusion: 'PENDING',
    conclusionRemark: '',
  });

  // 放行审核
  const [releaseRecord, setReleaseRecord] = useState<ReleaseRecord>({
    reviewItems: RELEASE_REVIEW_ITEMS.map(i => ({ ...i, pass: false, reviewer: 'QA李工', remark: '' })),
    qaReviewer: 'QA李工',
    qaDate: dayjs().format('YYYY-MM-DD'),
    decision: 'PENDING',
    decisionRemark: '',
  });

  // ─── 辅助函数 ────────────────────────────────────────────────────────
  const updatePreConfirm = (key: string, field: keyof PreConfirmItem, val: any) => {
    setPreConfirm(prev => prev.map(item => item.key === key ? { ...item, [field]: val } : item));
  };

  const updateEnvRecord = (idx: number, field: keyof EnvRecord, val: string) => {
    setEnvRecords(prev => { const next = [...prev]; next[idx] = { ...next[idx], [field]: val }; return next; });
  };

  const updateFillCheck = (idx: number, field: keyof FillCheckRecord, val: any) => {
    setFillChecks(prev => { const next = [...prev]; next[idx] = { ...next[idx], [field]: val }; return next; });
  };

  const updateMaterialBalance = (idx: number, field: keyof MaterialBalanceItem, val: any) => {
    setMaterialBalance(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: val };
      // 自动计算平衡率
      const item = next[idx];
      const actual = Number(item.actual) || 0;
      const issued = Number(item.issued) || 1;
      item.rate = parseFloat(((actual / issued) * 100).toFixed(2));
      item.pass = item.rate >= 96.0 && item.rate <= 102.0;
      return next;
    });
  };

  const updateFinalQcItem = (idx: number, field: string, val: any) => {
    setFinalQc(prev => {
      const items = [...prev.checkItems];
      items[idx] = { ...items[idx], [field]: val };
      return { ...prev, checkItems: items };
    });
  };

  const updateReleaseItem = (idx: number, field: string, val: any) => {
    setReleaseRecord(prev => {
      const items = [...prev.reviewItems];
      items[idx] = { ...items[idx], [field]: val };
      return { ...prev, reviewItems: items };
    });
  };

  // 计算整体完成率
  const calcProgress = () => {
    const checks = [
      preConfirm.every(i => i.yes !== null),
      !!bottleRecord.semiFgWeight && !!preOperator,
      envRecords.some(r => !!r.operator),
      fillChecks.some(r => !!r.operator),
      bottleCleanup.certValid,
      !!outerPack.operator,
      outerCleanup.certValid,
      qaRecords.some(r => !!r.result),
      materialBalance.some(m => m.actual > 0),
      finalQc.conclusion !== 'PENDING',
      releaseRecord.decision !== 'PENDING',
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  };

  const handleSave = () => {
    const data = { header, preConfirm, bottleRecord, envRecords, fillChecks, bottleCleanup, outerPack, outerCleanup, qaRecords, materialBalance, finalQc, releaseRecord, savedAt: new Date().toISOString() };
    localStorage.setItem(`ebr_batch_pkg_${header.batchNo || 'draft'}`, JSON.stringify(data));
    message.success('批包装记录已保存');
  };

  const handleSubmit = () => {
    Modal.confirm({
      title: '提交批包装记录',
      icon: <FileProtectOutlined style={{ color: '#52c41a' }} />,
      content: (
        <div>
          <p>确认提交批次 <strong>{header.batchNo}</strong> 的批包装记录？</p>
          <Alert type="warning" message="提交后记录将被锁定，不可再修改。请确认所有数据已填写完整且经过复核。" showIcon />
        </div>
      ),
      okText: '确认提交并锁定',
      okType: 'danger',
      onOk: () => {
        handleSave();
        setLocked(true);
        setSubmitted(true);
        message.success('批包装记录已提交，等待QA归档审核');
      },
    });
  };

  const progress = calcProgress();

  // ─── Tab项 ─────────────────────────────────────────────────────────
  const tabItems = [
    {
      key: '1',
      label: <span><FileTextOutlined />批包装指令</span>,
      children: <Tab1BatchInstruction
        header={header} onHeaderChange={setHeader}
        locked={locked} />,
    },
    {
      key: '2',
      label: <span><CheckSquareOutlined />生产前确认</span>,
      children: <Tab2PreConfirm
        items={preConfirm} onUpdate={updatePreConfirm}
        operator={preOperator} onOperatorChange={setPreOperator}
        reviewer={preReviewer} onReviewerChange={setPreReviewer}
        locked={locked} />,
    },
    {
      key: '3',
      label: <span><ThunderboltOutlined />瓶包线记录</span>,
      children: <Tab3BottleLine
        record={bottleRecord} onRecordChange={setBottleRecord}
        envRecords={envRecords} onEnvChange={updateEnvRecord}
        fillChecks={fillChecks} onFillChange={updateFillCheck}
        locked={locked} />,
    },
    {
      key: '4',
      label: <span><CheckCircleOutlined />瓶包线清场</span>,
      children: <Tab4Cleanup
        title="瓶包线" cleanup={bottleCleanup}
        onCleanupChange={setBottleCleanup}
        locked={locked} />,
    },
    {
      key: '5',
      label: <span><FormOutlined />外包装记录</span>,
      children: <Tab5OuterPack
        record={outerPack} onRecordChange={setOuterPack}
        cleanup={outerCleanup} onCleanupChange={setOuterCleanup}
        locked={locked} />,
    },
    {
      key: '6',
      label: <span><AuditOutlined />QA监控记录</span>,
      children: <Tab6QaMonitor records={qaRecords} onUpdate={setQaRecords} locked={locked} />,
    },
    {
      key: '7',
      label: <span><CalculatorOutlined />物料平衡</span>,
      children: <Tab7MaterialBalance items={materialBalance} onUpdate={updateMaterialBalance} locked={locked} />,
    },
    {
      key: '8',
      label: <span><ExperimentOutlined />成品检验</span>,
      children: <Tab8FinalQc report={finalQc} onReportChange={setFinalQc} onItemChange={updateFinalQcItem} locked={locked} />,
    },
    {
      key: '9',
      label: <span><SafetyCertificateOutlined />成品放行</span>,
      children: <Tab9Release record={releaseRecord} onRecordChange={setReleaseRecord} onItemChange={updateReleaseItem} locked={locked} />,
    },
  ];

  return (
    <div style={{ padding: '16px 20px' }}>
      {/* 页头 */}
      <Card size="small" bodyStyle={{ padding: '12px 16px' }}
        style={{ marginBottom: 12, background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)' }}>
        <Row align="middle" justify="space-between">
          <Col>
            <Space>
              <FileProtectOutlined style={{ color: '#fff', fontSize: 20 }} />
              <div>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>
                  批包装记录（盒装） SOR-MF-PE-02-05
                </div>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>
                  {header.productName} · 批号: {header.batchNo || '未填写'} · 版本: {header.version}
                </div>
              </div>
            </Space>
          </Col>
          <Col>
            <Space>
              <div style={{ color: '#fff', textAlign: 'right' }}>
                <div style={{ fontSize: 11, opacity: 0.7 }}>完成进度</div>
                <Progress
                  percent={progress}
                  size="small"
                  style={{ width: 120, marginBottom: 0 }}
                  strokeColor={{ '0%': '#fadb14', '100%': '#52c41a' }}
                  trailColor="rgba(255,255,255,0.2)"
                />
              </div>
              {locked ? (
                <Tag color="success" icon={<LockOutlined />} style={{ fontSize: 12, padding: '4px 10px' }}>
                  已锁定
                </Tag>
              ) : (
                <Tag color="warning" icon={<UnlockOutlined />} style={{ fontSize: 12, padding: '4px 10px' }}>
                  编辑中
                </Tag>
              )}
              <Button icon={<SaveOutlined />} size="small" onClick={handleSave}
                style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff' }}>
                保存
              </Button>
              {!locked && (
                <Button icon={<FileProtectOutlined />} size="small" type="primary"
                  onClick={handleSubmit} style={{ background: '#52c41a', border: 'none' }}>
                  提交归档
                </Button>
              )}
              <Button icon={<PrinterOutlined />} size="small"
                style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff' }}
                onClick={() => message.info('打印功能：将生成标准格式的批包装记录PDF')}>
                打印
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Tab内容 */}
      <Card size="small" bodyStyle={{ padding: 0 }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          tabBarStyle={{ padding: '0 16px', marginBottom: 0 }}
        />
      </Card>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// Tab 1: 批包装指令
// ═══════════════════════════════════════════════════════════════════════
const Tab1BatchInstruction: React.FC<{
  header: EbrHeader;
  onHeaderChange: (h: EbrHeader) => void;
  locked: boolean;
}> = ({ header, onHeaderChange, locked }) => {
  const update = (field: keyof EbrHeader, val: string | number) =>
    onHeaderChange({ ...header, [field]: val });

  return (
    <div style={{ padding: 20 }}>
      <Alert type="info" showIcon icon={<InfoCircleOutlined />}
        message="批包装指令由QA部门根据批生产指令发放，车间依据本指令执行生产，不得擅自更改。"
        style={{ marginBottom: 16 }} />

      <Title level={5} style={{ color: '#1a237e', borderBottom: '2px solid #1a237e', paddingBottom: 6 }}>
        一、批产品基本信息
      </Title>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}><label style={{ fontSize: 12, color: '#8c8c8c' }}>产品名称</label>
          <Input value={header.productName} disabled={locked} style={{ marginTop: 4 }}
            onChange={e => update('productName', e.target.value)} /></Col>
        <Col span={8}><label style={{ fontSize: 12, color: '#8c8c8c' }}>产品编码</label>
          <Input value={header.productCode} disabled={locked} style={{ marginTop: 4 }}
            onChange={e => update('productCode', e.target.value)} /></Col>
        <Col span={8}><label style={{ fontSize: 12, color: '#8c8c8c' }}>批号</label>
          <Input value={header.batchNo} disabled={locked} style={{ marginTop: 4 }}
            onChange={e => update('batchNo', e.target.value)} placeholder="如：20260601001" /></Col>
        <Col span={8} style={{ marginTop: 12 }}><label style={{ fontSize: 12, color: '#8c8c8c' }}>批量</label>
          <Input.Group compact style={{ marginTop: 4, display: 'flex' }}>
            <InputNumber value={header.batchSize} min={1} disabled={locked} style={{ width: '70%' }}
              onChange={v => update('batchSize', v ?? 0)} />
            <Select value={header.batchUnit} disabled={locked} style={{ width: '30%' }}
              onChange={v => update('batchUnit', v)}>
              <Option value="盒">盒</Option>
              <Option value="瓶">瓶</Option>
              <Option value="粒">粒</Option>
            </Select>
          </Input.Group></Col>
        <Col span={8} style={{ marginTop: 12 }}><label style={{ fontSize: 12, color: '#8c8c8c' }}>生产日期</label>
          <Input value={header.productionDate} disabled={locked} style={{ marginTop: 4 }}
            onChange={e => update('productionDate', e.target.value)} type="date" /></Col>
        <Col span={8} style={{ marginTop: 12 }}><label style={{ fontSize: 12, color: '#8c8c8c' }}>有效期至</label>
          <Input value={header.expiryDate} disabled={locked} style={{ marginTop: 4 }}
            onChange={e => update('expiryDate', e.target.value)} type="date" /></Col>
        <Col span={8} style={{ marginTop: 12 }}><label style={{ fontSize: 12, color: '#8c8c8c' }}>生产订单号</label>
          <Input value={header.orderNo} disabled={locked} style={{ marginTop: 4 }}
            onChange={e => update('orderNo', e.target.value)} placeholder="MO-XXXXXXXX-XXX" /></Col>
        <Col span={8} style={{ marginTop: 12 }}><label style={{ fontSize: 12, color: '#8c8c8c' }}>文件编号</label>
          <Input value={header.docNo} disabled={true} style={{ marginTop: 4, background: '#fafafa' }} /></Col>
        <Col span={8} style={{ marginTop: 12 }}><label style={{ fontSize: 12, color: '#8c8c8c' }}>版本号</label>
          <Input value={header.version} disabled={locked} style={{ marginTop: 4 }}
            onChange={e => update('version', e.target.value)} /></Col>
      </Row>

      <Title level={5} style={{ color: '#1a237e', borderBottom: '2px solid #1a237e', paddingBottom: 6 }}>
        二、生产信息
      </Title>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}><label style={{ fontSize: 12, color: '#8c8c8c' }}>车间/包装线</label>
          <Input value={header.workshopCode} disabled={locked} style={{ marginTop: 4 }}
            onChange={e => update('workshopCode', e.target.value)} /></Col>
        <Col span={8}><label style={{ fontSize: 12, color: '#8c8c8c' }}>工艺路线</label>
          <Input value={header.routingCode} disabled={locked} style={{ marginTop: 4 }}
            onChange={e => update('routingCode', e.target.value)} /></Col>
        <Col span={8}><label style={{ fontSize: 12, color: '#8c8c8c' }}>QA发放人</label>
          <Input value={header.issuer} disabled={locked} style={{ marginTop: 4 }}
            onChange={e => update('issuer', e.target.value)} /></Col>
        <Col span={8} style={{ marginTop: 12 }}><label style={{ fontSize: 12, color: '#8c8c8c' }}>发放日期</label>
          <Input value={header.issueDate} disabled={locked} style={{ marginTop: 4 }}
            onChange={e => update('issueDate', e.target.value)} type="date" /></Col>
      </Row>

      <Title level={5} style={{ color: '#1a237e', borderBottom: '2px solid #1a237e', paddingBottom: 6 }}>
        三、包装操作指令摘要
      </Title>
      <div style={{ background: '#f6f8ff', border: '1px solid #d6e4ff', borderRadius: 6, padding: 16 }}>
        {[
          { step: '1', op: '理瓶', equip: '高速自动理瓶机', note: '拣出破损、污染瓶，确认清场合格证' },
          { step: '2', op: '放干燥剂', equip: '高速塞干燥剂机', note: '干燥剂规格：1g/袋，每瓶1袋' },
          { step: '3', op: '装粒（数粒充填）', equip: '电子数粒机', note: '装量：10粒/瓶（按批包装指令），允偏±2粒' },
          { step: '4', op: '旋盖', equip: '高速搓式旋盖机', note: '旋盖扭矩2.5-3.5N·m，每30min抽检5瓶' },
          { step: '5', op: '贴标', equip: '立式自动贴标机', note: '核对批号、生产日期、有效期，确认与指令一致' },
          { step: '6', op: '装盒', equip: '装盒机', note: '每盒1瓶+1张说明书，折叠纸盒封口' },
          { step: '7', op: '装箱', equip: '封箱机', note: '每箱200盒，贴箱外标签，验码入库' },
        ].map(row => (
          <Row key={row.step} gutter={8} style={{ borderBottom: '1px solid #e6f0ff', padding: '8px 0', alignItems: 'center' }}>
            <Col flex="40px"><Tag color="blue" style={{ width: 28, textAlign: 'center' }}>S{row.step}</Tag></Col>
            <Col flex="100px"><span style={{ fontWeight: 600 }}>{row.op}</span></Col>
            <Col flex="160px"><Tag color="default" style={{ fontSize: 11 }}>{row.equip}</Tag></Col>
            <Col flex="1"><span style={{ fontSize: 12, color: '#595959' }}>{row.note}</span></Col>
          </Row>
        ))}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// Tab 2: 生产前再确认（9项核查）
// ═══════════════════════════════════════════════════════════════════════
const Tab2PreConfirm: React.FC<{
  items: PreConfirmItem[];
  onUpdate: (key: string, field: keyof PreConfirmItem, val: any) => void;
  operator: string; onOperatorChange: (v: string) => void;
  reviewer: string; onReviewerChange: (v: string) => void;
  locked: boolean;
}> = ({ items, onUpdate, operator, onOperatorChange, reviewer, onReviewerChange, locked }) => {
  const allDone = items.every(i => i.yes !== null);
  const hasNo = items.some(i => i.yes === false);

  return (
    <div style={{ padding: 20 }}>
      <Alert
        type={allDone ? (hasNo ? 'error' : 'success') : 'warning'}
        showIcon
        message={allDone ? (hasNo ? '存在核查不合格项，不得开始生产！' : '生产前确认全部合格，可以开始生产') : '请完成所有生产前确认项目（共9项）'}
        style={{ marginBottom: 16 }}
      />

      <Title level={5} style={{ color: '#1a237e', borderBottom: '2px solid #1a237e', paddingBottom: 6 }}>
        生产前再确认核查表（开工前必须完成全部9项确认）
      </Title>

      <div style={{ border: '1px solid #f0f0f0', borderRadius: 6, overflow: 'hidden', marginBottom: 16 }}>
        <div style={{ background: '#1a237e', color: '#fff', padding: '8px 16px', display: 'grid', gridTemplateColumns: '40px 1fr 120px 1fr', gap: 12, fontSize: 12, fontWeight: 600 }}>
          <span>序号</span><span>核查项目</span><span>核查结果</span><span>备注/偏差说明</span>
        </div>
        {items.map((item, idx) => (
          <div key={item.key} style={{
            padding: '10px 16px', display: 'grid', gridTemplateColumns: '40px 1fr 120px 1fr',
            gap: 12, alignItems: 'center', borderTop: '1px solid #f0f0f0', fontSize: 13,
            background: item.yes === false ? '#fff2f0' : item.yes === true ? '#f6ffed' : 'white',
          }}>
            <Tag color={item.yes === true ? 'green' : item.yes === false ? 'red' : 'default'}
              style={{ textAlign: 'center', width: 28 }}>
              {idx + 1}
            </Tag>
            <span>{item.label}</span>
            <Radio.Group
              value={item.yes}
              disabled={locked}
              onChange={e => onUpdate(item.key, 'yes', e.target.value)}
            >
              <Radio value={true} style={{ color: '#52c41a', fontWeight: 600 }}>是</Radio>
              <Radio value={false} style={{ color: '#ff4d4f', fontWeight: 600 }}>否</Radio>
            </Radio.Group>
            <Input size="small" value={item.remark} disabled={locked}
              onChange={e => onUpdate(item.key, 'remark', e.target.value)}
              placeholder="如选否，须填写说明" />
          </div>
        ))}
      </div>

      <Divider />
      <Row gutter={16}>
        <Col span={8}>
          <label style={{ fontSize: 12, color: '#8c8c8c' }}>确认操作员（签名）</label>
          <Input value={operator} disabled={locked} style={{ marginTop: 4 }}
            onChange={e => onOperatorChange(e.target.value)} placeholder="操作员签名" />
        </Col>
        <Col span={8}>
          <label style={{ fontSize: 12, color: '#8c8c8c' }}>班组长复核（签名）</label>
          <Input value={reviewer} disabled={locked} style={{ marginTop: 4 }}
            onChange={e => onReviewerChange(e.target.value)} placeholder="班组长签名" />
        </Col>
        <Col span={8}>
          <label style={{ fontSize: 12, color: '#8c8c8c' }}>确认时间</label>
          <Input value={new Date().toLocaleString('zh-CN')} disabled style={{ marginTop: 4, background: '#fafafa' }} />
        </Col>
      </Row>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// Tab 3: 瓶包线岗位生产记录
// ═══════════════════════════════════════════════════════════════════════
const Tab3BottleLine: React.FC<{
  record: Partial<BottleLineRecord>;
  onRecordChange: (r: Partial<BottleLineRecord>) => void;
  envRecords: EnvRecord[];
  onEnvChange: (idx: number, field: keyof EnvRecord, val: string) => void;
  fillChecks: FillCheckRecord[];
  onFillChange: (idx: number, field: keyof FillCheckRecord, val: any) => void;
  locked: boolean;
}> = ({ record, onRecordChange, envRecords, onEnvChange, fillChecks, onFillChange, locked }) => {
  const update = (field: keyof BottleLineRecord, val: any) =>
    onRecordChange({ ...record, [field]: val });

  return (
    <div style={{ padding: 20 }}>
      {/* 领料 */}
      <Title level={5} style={{ color: '#1a237e', borderBottom: '2px solid #1a237e', paddingBottom: 6 }}>
        一、领取待内包装半成品
      </Title>
      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col span={8}><label style={{ fontSize: 12, color: '#8c8c8c' }}>领取重量（kg）</label>
          <InputNumber value={record.semiFgWeight ? Number(record.semiFgWeight) : undefined}
            disabled={locked} style={{ width: '100%', marginTop: 4 }} min={0} step={0.1}
            onChange={v => update('semiFgWeight', v?.toString() ?? '')} placeholder="填写领取重量" /></Col>
        <Col span={8}><label style={{ fontSize: 12, color: '#8c8c8c' }}>半成品批号</label>
          <Input value={record.semiFgBatchNo || ''} disabled={locked} style={{ marginTop: 4 }}
            onChange={e => update('semiFgBatchNo', e.target.value)} /></Col>
        <Col span={8}><label style={{ fontSize: 12, color: '#8c8c8c' }}>领料员（签名）</label>
          <Input value={record.semiFgOperator || ''} disabled={locked} style={{ marginTop: 4 }}
            onChange={e => update('semiFgOperator', e.target.value)} /></Col>
      </Row>

      {/* 操作步骤与记录 */}
      <Title level={5} style={{ color: '#1a237e', borderBottom: '2px solid #1a237e', paddingBottom: 6 }}>
        二、各工步操作记录
      </Title>
      <div style={{ border: '1px solid #f0f0f0', borderRadius: 6, overflow: 'hidden', marginBottom: 20 }}>
        <div style={{ background: '#1a237e', color: '#fff', padding: '8px 16px', display: 'grid', gridTemplateColumns: '120px 1fr 2fr', gap: 12, fontSize: 12, fontWeight: 600 }}>
          <span>工步</span><span>操作指令</span><span>操作记录（实际执行情况）</span>
        </div>
        {[
          { step: '理瓶', instruction: '启动高速自动理瓶机，剔除破损、不合格瓶，计数入线瓶数', field: 'bottleIn' as keyof BottleLineRecord, type: 'number', placeholder: '入线瓶数（支）' },
          { step: '放干燥剂', instruction: '塞干燥剂机参数设定：每瓶1袋干燥剂，确认机器正常运行', field: null, type: 'text', placeholder: '填写运行情况' },
          { step: '数粒充填', instruction: `装量规格：${record.fillQty ?? 10}${record.fillUnit ?? '粒/瓶'}，按30min频率抽检装量`, field: null, type: 'text', placeholder: '填写运行情况' },
          { step: '旋盖', instruction: '扭矩设定：2.5-3.5N·m，每30min抽检5瓶，记录扭矩值', field: 'capTorque' as keyof BottleLineRecord, type: 'text', placeholder: '填写扭矩范围（N·m）' },
          { step: '贴标', instruction: '核对标签批号/生产日期/有效期，与指令完全一致后上机', field: 'labelBatchNo' as keyof BottleLineRecord, type: 'text', placeholder: '标签批号' },
        ].map(row => (
          <div key={row.step} style={{
            padding: '10px 16px', display: 'grid', gridTemplateColumns: '120px 1fr 2fr',
            gap: 12, alignItems: 'center', borderTop: '1px solid #f0f0f0',
          }}>
            <Tag color="blue" style={{ textAlign: 'center' }}>{row.step}</Tag>
            <span style={{ fontSize: 12, color: '#595959' }}>{row.instruction}</span>
            {row.type === 'number' && row.field ? (
              <InputNumber value={Number(record[row.field]) || undefined} disabled={locked}
                style={{ width: '50%' }} min={0}
                onChange={v => update(row.field!, v ?? 0)}
                placeholder={row.placeholder} addonAfter="支" />
            ) : row.field ? (
              <Input value={String(record[row.field] || '')} disabled={locked}
                onChange={e => update(row.field!, e.target.value)}
                placeholder={row.placeholder} />
            ) : (
              <Input disabled={locked} placeholder={row.placeholder} />
            )}
          </div>
        ))}
        <div style={{ padding: '10px 16px', display: 'grid', gridTemplateColumns: '120px 1fr 2fr', gap: 12, alignItems: 'center', borderTop: '1px solid #f0f0f0' }}>
          <Tag color="green" style={{ textAlign: 'center' }}>产出统计</Tag>
          <span style={{ fontSize: 12, color: '#595959' }}>统计内包装产出数量及废品数量，计算物料平衡率</span>
          <Row gutter={8}>
            <Col span={8}><InputNumber value={record.bottleOut} disabled={locked} style={{ width: '100%' }} min={0}
              onChange={v => update('bottleOut', v ?? 0)} placeholder="产出支数" addonAfter="支" /></Col>
            <Col span={8}><InputNumber value={record.bottleScrap} disabled={locked} style={{ width: '100%' }} min={0}
              onChange={v => update('bottleScrap', v ?? 0)} placeholder="废品数" addonAfter="支" /></Col>
          </Row>
        </div>
      </div>

      {/* 环境记录 */}
      <Title level={5} style={{ color: '#1a237e', borderBottom: '2px solid #1a237e', paddingBottom: 6 }}>
        三、环境温湿度记录（每小时至少记录一次）
      </Title>
      <div style={{ border: '1px solid #f0f0f0', borderRadius: 6, overflow: 'hidden', marginBottom: 20 }}>
        <div style={{ background: '#fafafa', padding: '8px 16px', display: 'grid', gridTemplateColumns: '80px 100px 100px 1fr', gap: 12, fontWeight: 600, fontSize: 12, color: '#595959' }}>
          <span>时间</span><span>温度(℃)</span><span>相对湿度(%)</span><span>记录人签名</span>
        </div>
        {envRecords.map((row, idx) => (
          <div key={idx} style={{
            padding: '6px 16px', display: 'grid', gridTemplateColumns: '80px 100px 100px 1fr',
            gap: 12, alignItems: 'center', borderTop: '1px solid #f0f0f0',
            background: (Number(row.temp) < 18 || Number(row.temp) > 26 || Number(row.humidity) < 45 || Number(row.humidity) > 65)
              ? '#fff2f0' : 'white',
          }}>
            <Input value={row.time} disabled={locked} size="small"
              onChange={e => onEnvChange(idx, 'time', e.target.value)} />
            <Input value={row.temp} disabled={locked} size="small" addonAfter="℃"
              onChange={e => onEnvChange(idx, 'temp', e.target.value)}
              style={{ borderColor: (Number(row.temp) < 18 || Number(row.temp) > 26) ? '#ff4d4f' : undefined }} />
            <Input value={row.humidity} disabled={locked} size="small" addonAfter="%"
              onChange={e => onEnvChange(idx, 'humidity', e.target.value)}
              style={{ borderColor: (Number(row.humidity) < 45 || Number(row.humidity) > 65) ? '#ff4d4f' : undefined }} />
            <Input value={row.operator} disabled={locked} size="small"
              onChange={e => onEnvChange(idx, 'operator', e.target.value)} placeholder="操作员签名" />
          </div>
        ))}
      </div>
      <Alert type="warning" showIcon message="温湿度要求：温度18-26℃，相对湿度45%-65%。超标须立即处理并填写偏差报告。" style={{ marginBottom: 16 }} />

      {/* 装量检查记录 */}
      <Title level={5} style={{ color: '#1a237e', borderBottom: '2px solid #1a237e', paddingBottom: 6 }}>
        四、装量检查记录（每30min抽检）
      </Title>
      <div style={{ border: '1px solid #f0f0f0', borderRadius: 6, overflow: 'hidden' }}>
        <div style={{ background: '#fafafa', padding: '8px 16px', display: 'grid', gridTemplateColumns: '80px 60px 100px 100px 80px 1fr', gap: 12, fontWeight: 600, fontSize: 12, color: '#595959' }}>
          <span>抽检时间</span><span>样品号</span><span>实测装量</span><span>偏差%</span><span>判定</span><span>操作员签名</span>
        </div>
        {fillChecks.map((row, idx) => (
          <div key={idx} style={{
            padding: '6px 16px', display: 'grid', gridTemplateColumns: '80px 60px 100px 100px 80px 1fr',
            gap: 12, alignItems: 'center', borderTop: '1px solid #f0f0f0',
            background: !row.pass ? '#fff2f0' : 'white',
          }}>
            <Input value={row.time} size="small" disabled={locked}
              onChange={e => onFillChange(idx, 'time', e.target.value)} />
            <Input value={row.sampleNo} size="small" disabled={locked}
              onChange={e => onFillChange(idx, 'sampleNo', e.target.value)} />
            <Input value={row.fillWeight} size="small" disabled={locked}
              onChange={e => onFillChange(idx, 'fillWeight', e.target.value)} placeholder="粒数或重量" />
            <Input value={row.deviation} size="small" disabled={locked}
              onChange={e => onFillChange(idx, 'deviation', e.target.value)} placeholder="±X%" />
            <Select value={row.pass ? 'pass' : 'fail'} size="small" disabled={locked}
              onChange={v => onFillChange(idx, 'pass', v === 'pass')}>
              <Option value="pass"><span style={{ color: '#52c41a' }}>合格</span></Option>
              <Option value="fail"><span style={{ color: '#ff4d4f' }}>不合格</span></Option>
            </Select>
            <Input value={row.operator} size="small" disabled={locked}
              onChange={e => onFillChange(idx, 'operator', e.target.value)} placeholder="签名" />
          </div>
        ))}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// Tab 4/外包装: 清场记录（复用组件）
// ═══════════════════════════════════════════════════════════════════════
const Tab4Cleanup: React.FC<{
  title: string;
  cleanup: CleanupRecord;
  onCleanupChange: (c: CleanupRecord) => void;
  locked: boolean;
}> = ({ title, cleanup, onCleanupChange, locked }) => {
  const update = (field: keyof CleanupRecord, val: any) =>
    onCleanupChange({ ...cleanup, [field]: val });

  const toggleItem = (key: string) => {
    onCleanupChange({
      ...cleanup,
      items: cleanup.items.map(i => i.key === key ? { ...i, done: !i.done } : i),
    });
  };

  const allDone = cleanup.items.every(i => i.done);

  return (
    <div style={{ padding: 20 }}>
      <Alert
        type={allDone && cleanup.certValid ? 'success' : 'warning'}
        showIcon
        message={allDone && cleanup.certValid ? `${title}清场合格，清场合格证有效` : `请完成${title}清场并获取清场合格证`}
        style={{ marginBottom: 16 }}
      />

      <Title level={5} style={{ color: '#1a237e', borderBottom: '2px solid #1a237e', paddingBottom: 6 }}>
        {title}清场记录（GMP要求：固体制剂清场合格证有效期72小时）
      </Title>

      <div style={{ border: '1px solid #f0f0f0', borderRadius: 6, overflow: 'hidden', marginBottom: 16 }}>
        <div style={{ background: '#fafafa', padding: '8px 16px', display: 'grid', gridTemplateColumns: '1fr 2fr 80px', gap: 12, fontWeight: 600, fontSize: 12, color: '#595959' }}>
          <span>清场项目</span><span>清场方法/要求</span><span>完成确认</span>
        </div>
        {cleanup.items.map(item => (
          <div key={item.key} style={{
            padding: '10px 16px', display: 'grid', gridTemplateColumns: '1fr 2fr 80px',
            gap: 12, alignItems: 'center', borderTop: '1px solid #f0f0f0',
            background: item.done ? '#f6ffed' : 'white',
          }}>
            <span style={{ fontWeight: item.done ? 600 : 400 }}>{item.label}</span>
            <span style={{ fontSize: 12, color: '#595959' }}>{item.method}</span>
            <Checkbox checked={item.done} disabled={locked} onChange={() => toggleItem(item.key)}>
              {item.done ? <span style={{ color: '#52c41a' }}>已完成</span> : '待完成'}
            </Checkbox>
          </div>
        ))}
      </div>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}><label style={{ fontSize: 12, color: '#8c8c8c' }}>清场操作人（签名）</label>
          <Input value={cleanup.cleanOperator} disabled={locked} style={{ marginTop: 4 }}
            onChange={e => update('cleanOperator', e.target.value)} /></Col>
        <Col span={8}><label style={{ fontSize: 12, color: '#8c8c8c' }}>清场完成时间</label>
          <Input value={cleanup.cleanTime} disabled={locked} style={{ marginTop: 4 }} type="datetime-local"
            onChange={e => update('cleanTime', e.target.value)} /></Col>
        <Col span={8}><label style={{ fontSize: 12, color: '#8c8c8c' }}>班组长复核（签名）</label>
          <Input value={cleanup.reviewOperator} disabled={locked} style={{ marginTop: 4 }}
            onChange={e => update('reviewOperator', e.target.value)} /></Col>
        <Col span={8} style={{ marginTop: 12 }}><label style={{ fontSize: 12, color: '#8c8c8c' }}>QA检查员（签名）</label>
          <Input value={cleanup.qaOperator} disabled={locked} style={{ marginTop: 4 }}
            onChange={e => update('qaOperator', e.target.value)} /></Col>
        <Col span={8} style={{ marginTop: 12 }}><label style={{ fontSize: 12, color: '#8c8c8c' }}>QA检查时间</label>
          <Input value={cleanup.qaTime} disabled={locked} style={{ marginTop: 4 }} type="datetime-local"
            onChange={e => update('qaTime', e.target.value)} /></Col>
        <Col span={8} style={{ marginTop: 12 }}><label style={{ fontSize: 12, color: '#8c8c8c' }}>清场合格证编号</label>
          <Input value={cleanup.certNo} disabled={locked} style={{ marginTop: 4 }}
            onChange={e => update('certNo', e.target.value)} /></Col>
      </Row>

      {/* 清场合格证 */}
      <div style={{
        border: `2px solid ${cleanup.certValid ? '#52c41a' : '#faad14'}`,
        borderRadius: 8, padding: 16, background: cleanup.certValid ? '#f6ffed' : '#fffbe6',
        textAlign: 'center',
      }}>
        <Title level={5} style={{ color: cleanup.certValid ? '#52c41a' : '#d48806', margin: 0 }}>
          {cleanup.certValid ? '✓ 清场合格证（有效）' : '⚠ 清场合格证（未发放）'}
        </Title>
        <div style={{ fontSize: 12, color: '#595959', margin: '8px 0' }}>
          证号：{cleanup.certNo} · 有效期：72小时（固体制剂）
        </div>
        <Checkbox checked={cleanup.certValid} disabled={locked}
          onChange={e => update('certValid', e.target.checked)}
          style={{ fontWeight: 600 }}>
          QA确认清场合格，发放清场合格证
        </Checkbox>
      </div>

      {cleanup.remark && (
        <div style={{ marginTop: 12 }}>
          <label style={{ fontSize: 12, color: '#8c8c8c' }}>备注/偏差说明</label>
          <TextArea value={cleanup.remark} disabled={locked} rows={2} style={{ marginTop: 4 }}
            onChange={e => update('remark', e.target.value)} />
        </div>
      )}
      {!cleanup.remark && !locked && (
        <div style={{ marginTop: 12 }}>
          <label style={{ fontSize: 12, color: '#8c8c8c' }}>备注/偏差说明</label>
          <TextArea rows={2} style={{ marginTop: 4 }} placeholder="如有偏差或特殊情况，请填写说明..."
            onChange={e => update('remark', e.target.value)} />
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// Tab 5: 外包装岗位生产记录 + 清场
// ═══════════════════════════════════════════════════════════════════════
const Tab5OuterPack: React.FC<{
  record: Partial<OuterPackRecord>;
  onRecordChange: (r: Partial<OuterPackRecord>) => void;
  cleanup: CleanupRecord;
  onCleanupChange: (c: CleanupRecord) => void;
  locked: boolean;
}> = ({ record, onRecordChange, cleanup, onCleanupChange, locked }) => {
  const update = (field: keyof OuterPackRecord, val: any) =>
    onRecordChange({ ...record, [field]: val });

  return (
    <div style={{ padding: 20 }}>
      <Title level={5} style={{ color: '#1a237e', borderBottom: '2px solid #1a237e', paddingBottom: 6 }}>
        外包装岗位生产记录
      </Title>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}><label style={{ fontSize: 12, color: '#8c8c8c' }}>每盒装量（瓶/盒）</label>
          <InputNumber value={record.boxFillQty} min={1} disabled={locked} style={{ width: '100%', marginTop: 4 }}
            onChange={v => update('boxFillQty', v ?? 1)} /></Col>
        <Col span={6}><label style={{ fontSize: 12, color: '#8c8c8c' }}>每箱装量（盒/箱）</label>
          <InputNumber value={record.boxPerCase} min={1} disabled={locked} style={{ width: '100%', marginTop: 4 }}
            onChange={v => update('boxPerCase', v ?? 200)} /></Col>
        <Col span={6}><label style={{ fontSize: 12, color: '#8c8c8c' }}>说明书批号</label>
          <Input value={record.leafletBatchNo || ''} disabled={locked} style={{ marginTop: 4 }}
            onChange={e => update('leafletBatchNo', e.target.value)} /></Col>
        <Col span={6}><label style={{ fontSize: 12, color: '#8c8c8c' }}>操作员（签名）</label>
          <Input value={record.operator || ''} disabled={locked} style={{ marginTop: 4 }}
            onChange={e => update('operator', e.target.value)} /></Col>
      </Row>

      <div style={{ border: '1px solid #f0f0f0', borderRadius: 6, overflow: 'hidden', marginBottom: 20 }}>
        <div style={{ background: '#fafafa', padding: '8px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, fontWeight: 600, fontSize: 12, color: '#595959' }}>
          <span>领入盒数（个）</span><span>产出盒数（个）</span><span>废盒数（个）</span><span>装箱数（箱）</span>
        </div>
        <div style={{ padding: '10px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, alignItems: 'center', borderTop: '1px solid #f0f0f0' }}>
          <InputNumber value={record.boxIn} min={0} disabled={locked} style={{ width: '100%' }}
            onChange={v => update('boxIn', v ?? 0)} />
          <InputNumber value={record.boxOut} min={0} disabled={locked} style={{ width: '100%' }}
            onChange={v => update('boxOut', v ?? 0)} />
          <InputNumber value={record.boxScrap} min={0} disabled={locked} style={{ width: '100%' }}
            onChange={v => update('boxScrap', v ?? 0)} />
          <InputNumber value={record.caseOut} min={0} disabled={locked} style={{ width: '100%' }}
            onChange={v => update('caseOut', v ?? 0)} />
        </div>
      </div>

      <Divider>外包装岗位清场记录</Divider>
      <Tab4Cleanup title="外包装" cleanup={cleanup} onCleanupChange={onCleanupChange} locked={locked} />
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// Tab 6: QA监控记录
// ═══════════════════════════════════════════════════════════════════════
const Tab6QaMonitor: React.FC<{
  records: QaMonitorRecord[];
  onUpdate: (r: QaMonitorRecord[]) => void;
  locked: boolean;
}> = ({ records, onUpdate, locked }) => {
  const updateRow = (idx: number, field: keyof QaMonitorRecord, val: any) => {
    onUpdate(records.map((r, i) => i === idx ? { ...r, [field]: val } : r));
  };

  return (
    <div style={{ padding: 20 }}>
      <Alert type="info" showIcon
        message="QA监控记录由QA人员在生产过程中按岗位巡检填写，所有结论均须QA签名确认。"
        style={{ marginBottom: 16 }} />
      <Title level={5} style={{ color: '#1a237e', borderBottom: '2px solid #1a237e', paddingBottom: 6 }}>
        各工序QA巡检监控记录
      </Title>
      <div style={{ border: '1px solid #f0f0f0', borderRadius: 6, overflow: 'hidden' }}>
        <div style={{ background: '#1a237e', color: '#fff', padding: '8px 12px', display: 'grid', gridTemplateColumns: '80px 80px 100px 120px 120px 80px 80px 1fr', gap: 8, fontSize: 12, fontWeight: 600 }}>
          <span>监控站</span><span>检查时间</span><span>检查项目</span><span>质量标准</span><span>实测结果</span><span>判定</span><span>QA签名</span><span>备注</span>
        </div>
        {records.map((row, idx) => (
          <div key={idx} style={{
            padding: '6px 12px', display: 'grid', gridTemplateColumns: '80px 80px 100px 120px 120px 80px 80px 1fr',
            gap: 8, alignItems: 'center', borderTop: '1px solid #f0f0f0', fontSize: 12,
            background: !row.pass ? '#fff2f0' : idx % 2 === 0 ? '#fafafa' : 'white',
          }}>
            <Tag color="blue" style={{ fontSize: 10, textAlign: 'center' }}>{row.station}</Tag>
            <Input size="small" value={row.checkTime} disabled={locked}
              onChange={e => updateRow(idx, 'checkTime', e.target.value)} placeholder="时间" />
            <span style={{ fontSize: 11 }}>{row.checkItem}</span>
            <Input size="small" value={row.standard} disabled={locked}
              onChange={e => updateRow(idx, 'standard', e.target.value)} />
            <Input size="small" value={row.result} disabled={locked}
              onChange={e => updateRow(idx, 'result', e.target.value)} placeholder="填写实测值" />
            <Select size="small" value={row.pass ? 'pass' : 'fail'} disabled={locked}
              onChange={v => updateRow(idx, 'pass', v === 'pass')}>
              <Option value="pass"><span style={{ color: '#52c41a' }}>合格</span></Option>
              <Option value="fail"><span style={{ color: '#ff4d4f' }}>不合格</span></Option>
            </Select>
            <Input size="small" value={row.qaName} disabled={locked}
              onChange={e => updateRow(idx, 'qaName', e.target.value)} />
            <Input size="small" value={row.remark} disabled={locked}
              onChange={e => updateRow(idx, 'remark', e.target.value)} placeholder="备注" />
          </div>
        ))}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// Tab 7: 物料平衡表
// ═══════════════════════════════════════════════════════════════════════
const Tab7MaterialBalance: React.FC<{
  items: MaterialBalanceItem[];
  onUpdate: (idx: number, field: keyof MaterialBalanceItem, val: any) => void;
  locked: boolean;
}> = ({ items, onUpdate, locked }) => {
  const allPass = items.every(i => i.rate === 0 || i.pass);
  const hasCalc = items.some(i => i.actual > 0);

  return (
    <div style={{ padding: 20 }}>
      <Alert
        type={hasCalc ? (allPass ? 'success' : 'error') : 'info'}
        showIcon
        message={hasCalc ? (allPass ? '所有物料平衡率符合GMP要求（96.0%-102.0%）' : '存在物料平衡率超标项，需质量调查') : '请填写实际用量以自动计算物料平衡率'}
        style={{ marginBottom: 16 }}
      />
      <Title level={5} style={{ color: '#1a237e', borderBottom: '2px solid #1a237e', paddingBottom: 6 }}>
        物料平衡计算表（GMP要求：96.0%-102.0%）
      </Title>
      <div style={{ border: '1px solid #f0f0f0', borderRadius: 6, overflow: 'hidden' }}>
        <div style={{ background: '#1a237e', color: '#fff', padding: '8px 12px', display: 'grid', gridTemplateColumns: '1fr 80px 60px 80px 80px 80px 80px 80px 1fr', gap: 8, fontSize: 12, fontWeight: 600 }}>
          <span>物料名称</span><span>物料编码</span><span>单位</span><span>领用量</span><span>实际用量</span><span>剩余量</span><span>废品量</span><span>平衡率%</span><span>备注</span>
        </div>
        {items.map((item, idx) => (
          <div key={idx} style={{
            padding: '8px 12px', display: 'grid', gridTemplateColumns: '1fr 80px 60px 80px 80px 80px 80px 80px 1fr',
            gap: 8, alignItems: 'center', borderTop: '1px solid #f0f0f0', fontSize: 12,
            background: item.actual > 0 && !item.pass ? '#fff2f0' : item.actual > 0 && item.pass ? '#f6ffed' : 'white',
          }}>
            <span style={{ fontWeight: 600 }}>{item.name}</span>
            <span style={{ fontSize: 10, color: '#8c8c8c' }}>{item.code}</span>
            <span>{item.unit}</span>
            <span style={{ fontWeight: 600 }}>{item.issued.toLocaleString()}</span>
            <InputNumber size="small" value={item.actual || undefined} disabled={locked} min={0}
              style={{ width: '100%' }}
              onChange={v => onUpdate(idx, 'actual', v ?? 0)} />
            <InputNumber size="small" value={item.remainder || undefined} disabled={locked} min={0}
              style={{ width: '100%' }}
              onChange={v => onUpdate(idx, 'remainder', v ?? 0)} />
            <InputNumber size="small" value={item.scrap || undefined} disabled={locked} min={0}
              style={{ width: '100%' }}
              onChange={v => onUpdate(idx, 'scrap', v ?? 0)} />
            <div style={{ textAlign: 'center' }}>
              {item.actual > 0 ? (
                <Tag color={item.pass ? 'green' : 'red'} style={{ fontWeight: 700, fontSize: 12 }}>
                  {item.rate}%
                </Tag>
              ) : <span style={{ color: '#d9d9d9' }}>—</span>}
            </div>
            <Input size="small" value={item.remark} disabled={locked}
              onChange={e => onUpdate(idx, 'remark', e.target.value)} placeholder="备注" />
          </div>
        ))}
      </div>
      <div style={{ marginTop: 12, padding: '12px 16px', background: '#f6f8ff', borderRadius: 6, fontSize: 12, color: '#595959' }}>
        <strong>计算公式：</strong>物料平衡率(%) = (实际产出量 ÷ 理论产出量) × 100%；GMP要求：96.0% ≤ 平衡率 ≤ 102.0%；
        超出范围须进行偏差调查并填写偏差报告。
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// Tab 8: 成品检验报告
// ═══════════════════════════════════════════════════════════════════════
const Tab8FinalQc: React.FC<{
  report: FinalQcReport;
  onReportChange: (r: FinalQcReport) => void;
  onItemChange: (idx: number, field: string, val: any) => void;
  locked: boolean;
}> = ({ report, onReportChange, onItemChange, locked }) => {
  const update = (field: keyof FinalQcReport, val: any) =>
    onReportChange({ ...report, [field]: val });

  const failCount = report.checkItems.filter(i => !i.pass).length;

  return (
    <div style={{ padding: 20 }}>
      <Alert
        type={report.conclusion === 'PASS' ? 'success' : report.conclusion === 'FAIL' ? 'error' : 'info'}
        showIcon
        message={report.conclusion === 'PASS' ? '成品全检合格，批次可以放行' : report.conclusion === 'FAIL' ? `成品检验不合格（${failCount}项），不得放行` : '请完成成品检验后填写结论'}
        style={{ marginBottom: 16 }}
      />

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}><label style={{ fontSize: 12, color: '#8c8c8c' }}>检验报告编号</label>
          <Input value={report.reportNo} disabled={locked} style={{ marginTop: 4 }}
            onChange={e => update('reportNo', e.target.value)} /></Col>
        <Col span={6}><label style={{ fontSize: 12, color: '#8c8c8c' }}>取样日期</label>
          <Input value={report.sampleDate} disabled={locked} style={{ marginTop: 4 }} type="date"
            onChange={e => update('sampleDate', e.target.value)} /></Col>
        <Col span={6}><label style={{ fontSize: 12, color: '#8c8c8c' }}>QC检验员</label>
          <Input value={report.inspector} disabled={locked} style={{ marginTop: 4 }}
            onChange={e => update('inspector', e.target.value)} /></Col>
        <Col span={6}><label style={{ fontSize: 12, color: '#8c8c8c' }}>QA审核员</label>
          <Input value={report.reviewer} disabled={locked} style={{ marginTop: 4 }}
            onChange={e => update('reviewer', e.target.value)} /></Col>
        <Col span={24} style={{ marginTop: 12 }}><label style={{ fontSize: 12, color: '#8c8c8c' }}>取样说明</label>
          <Input value={report.sampleQty} disabled={locked} style={{ marginTop: 4 }}
            onChange={e => update('sampleQty', e.target.value)} /></Col>
      </Row>

      <Title level={5} style={{ color: '#1a237e', borderBottom: '2px solid #1a237e', paddingBottom: 6 }}>
        成品全检项目
      </Title>
      <div style={{ border: '1px solid #f0f0f0', borderRadius: 6, overflow: 'hidden', marginBottom: 16 }}>
        <div style={{ background: '#1a237e', color: '#fff', padding: '8px 12px', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 60px', gap: 12, fontSize: 12, fontWeight: 600 }}>
          <span>检验项目</span><span>质量标准</span><span>实测结果</span><span>判定</span>
        </div>
        {report.checkItems.map((item, idx) => (
          <div key={idx} style={{
            padding: '8px 12px', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 60px',
            gap: 12, alignItems: 'center', borderTop: '1px solid #f0f0f0', fontSize: 12,
            background: !item.pass ? '#fff2f0' : idx % 2 === 0 ? '#fafafa' : 'white',
          }}>
            <span>{item.item}</span>
            <span style={{ color: '#8c8c8c', fontSize: 11 }}>{item.standard}</span>
            <Input size="small" value={item.result} disabled={locked}
              onChange={e => onItemChange(idx, 'result', e.target.value)} placeholder="填写实测值" />
            <Select size="small" value={item.pass ? 'pass' : 'fail'} disabled={locked}
              onChange={v => onItemChange(idx, 'pass', v === 'pass')}>
              <Option value="pass"><span style={{ color: '#52c41a' }}>合格</span></Option>
              <Option value="fail"><span style={{ color: '#ff4d4f' }}>不合格</span></Option>
            </Select>
          </div>
        ))}
      </div>

      <Row gutter={16}>
        <Col span={8}><label style={{ fontSize: 12, color: '#8c8c8c' }}>检验结论</label>
          <Select value={report.conclusion} disabled={locked} style={{ width: '100%', marginTop: 4 }}
            onChange={v => update('conclusion', v)}>
            <Option value="PENDING">待定</Option>
            <Option value="PASS"><span style={{ color: '#52c41a', fontWeight: 600 }}>合格（可以放行）</span></Option>
            <Option value="FAIL"><span style={{ color: '#ff4d4f', fontWeight: 600 }}>不合格（不得放行）</span></Option>
          </Select></Col>
        <Col span={16}><label style={{ fontSize: 12, color: '#8c8c8c' }}>结论说明</label>
          <Input value={report.conclusionRemark} disabled={locked} style={{ marginTop: 4 }}
            onChange={e => update('conclusionRemark', e.target.value)}
            placeholder="填写综合检验结论说明..." /></Col>
      </Row>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// Tab 9: 成品放行审核单
// ═══════════════════════════════════════════════════════════════════════
const Tab9Release: React.FC<{
  record: ReleaseRecord;
  onRecordChange: (r: ReleaseRecord) => void;
  onItemChange: (idx: number, field: string, val: any) => void;
  locked: boolean;
}> = ({ record, onRecordChange, onItemChange, locked }) => {
  const update = (field: keyof ReleaseRecord, val: any) =>
    onRecordChange({ ...record, [field]: val });

  const allPass = record.reviewItems.every(i => i.pass);

  return (
    <div style={{ padding: 20 }}>
      <Alert
        type={record.decision === 'RELEASE' ? 'success' : record.decision === 'REJECT' ? 'error' : 'warning'}
        showIcon
        message={record.decision === 'RELEASE' ? '✓ QA已批准放行，批次可以上市销售' : record.decision === 'REJECT' ? '✗ QA拒绝放行，批次须进行偏差处理' : '请QA审核所有项目并作出放行决策'}
        style={{ marginBottom: 16 }}
      />

      <Title level={5} style={{ color: '#1a237e', borderBottom: '2px solid #1a237e', paddingBottom: 6 }}>
        成品放行审核清单（QA放行审核专用）
      </Title>

      <div style={{ border: '1px solid #f0f0f0', borderRadius: 6, overflow: 'hidden', marginBottom: 16 }}>
        <div style={{ background: '#1a237e', color: '#fff', padding: '8px 12px', display: 'grid', gridTemplateColumns: '1fr 80px 100px 1fr', gap: 12, fontSize: 12, fontWeight: 600 }}>
          <span>审核项目</span><span>审核结果</span><span>审核人（签名）</span><span>备注</span>
        </div>
        {record.reviewItems.map((item, idx) => (
          <div key={idx} style={{
            padding: '10px 12px', display: 'grid', gridTemplateColumns: '1fr 80px 100px 1fr',
            gap: 12, alignItems: 'center', borderTop: '1px solid #f0f0f0', fontSize: 12,
            background: !item.pass ? '#fff2f0' : item.pass ? '#f6ffed' : 'white',
          }}>
            <span>{idx + 1}. {item.item}</span>
            <Checkbox checked={item.pass} disabled={locked}
              onChange={e => onItemChange(idx, 'pass', e.target.checked)}>
              {item.pass ? <span style={{ color: '#52c41a', fontWeight: 600 }}>合格</span> : <span style={{ color: '#ff4d4f' }}>待确认</span>}
            </Checkbox>
            <Input size="small" value={item.reviewer} disabled={locked}
              onChange={e => onItemChange(idx, 'reviewer', e.target.value)} />
            <Input size="small" value={item.remark} disabled={locked}
              onChange={e => onItemChange(idx, 'remark', e.target.value)} placeholder="备注" />
          </div>
        ))}
      </div>

      <div style={{ background: '#f6f8ff', border: '2px solid #1a237e', borderRadius: 8, padding: 20 }}>
        <Title level={5} style={{ color: '#1a237e', marginBottom: 16 }}>QA放行决策</Title>
        <Row gutter={16}>
          <Col span={8}><label style={{ fontSize: 12, color: '#8c8c8c' }}>QA审核员（签名）</label>
            <Input value={record.qaReviewer} disabled={locked} style={{ marginTop: 4 }}
              onChange={e => update('qaReviewer', e.target.value)} prefix={<UserOutlined />} /></Col>
          <Col span={8}><label style={{ fontSize: 12, color: '#8c8c8c' }}>审核日期</label>
            <Input value={record.qaDate} disabled={locked} style={{ marginTop: 4 }} type="date"
              onChange={e => update('qaDate', e.target.value)} /></Col>
          <Col span={8}><label style={{ fontSize: 12, color: '#8c8c8c' }}>放行决策</label>
            <Select value={record.decision} disabled={locked} style={{ width: '100%', marginTop: 4 }}
              onChange={v => update('decision', v)}>
              <Option value="PENDING">待决策</Option>
              <Option value="RELEASE"><span style={{ color: '#52c41a', fontWeight: 700 }}>✓ 批准放行</span></Option>
              <Option value="REJECT"><span style={{ color: '#ff4d4f', fontWeight: 700 }}>✗ 拒绝放行</span></Option>
            </Select></Col>
          <Col span={24} style={{ marginTop: 12 }}><label style={{ fontSize: 12, color: '#8c8c8c' }}>放行说明</label>
            <TextArea value={record.decisionRemark} disabled={locked} rows={3} style={{ marginTop: 4 }}
              onChange={e => update('decisionRemark', e.target.value)}
              placeholder="填写放行或拒绝放行的依据说明..." /></Col>
        </Row>
      </div>
    </div>
  );
};

export default BatchPackagingEbrPage;

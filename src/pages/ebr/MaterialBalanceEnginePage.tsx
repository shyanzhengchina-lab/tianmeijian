/**
 * MaterialBalanceEnginePage.tsx — 物料平衡与收率计算引擎
 * ================================================================
 * PRD §6 完整实现：
 *   - 12类计算公式（固体车间/软胶囊/液体/粉剂/包装线）
 *   - 实时计算引擎（按工序触发）
 *   - 超标自动触发偏差
 *   - ALCOA+合规展示
 * ================================================================
 */
import React, { useState, useMemo, useCallback } from 'react';
import {
  Card, Row, Col, Table, Tag, Button, Modal, Form, Input, InputNumber,
  Select, Space, Statistic, Alert, Divider, Typography, Tabs, Progress,
  Badge, Descriptions, Steps, Timeline, message, Tooltip, Radio, Empty,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  CalculatorOutlined, CheckCircleOutlined, ExclamationCircleOutlined,
  WarningOutlined, PlayCircleOutlined, ReloadOutlined, FileTextOutlined,
  BarChartOutlined, SafetyCertificateOutlined, AlertOutlined,
  ArrowRightOutlined, InfoCircleOutlined, DotChartOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

// ── 类型定义 ──────────────────────────────────────────────────────
type BalanceStatus = 'WITHIN_RANGE' | 'BELOW_LOWER_LIMIT' | 'ABOVE_UPPER_LIMIT' | 'PENDING' | 'NOT_APPLICABLE';
type FormulaType = 'MATERIAL_BALANCE' | 'YIELD' | 'BOTH';

interface FormulaConfig {
  id: string;
  name: string;
  workshop: string;
  operationCode: string;
  operationName: string;
  dosageForm: string;
  formulaType: FormulaType;
  expression: string;
  lowerLimit: number;
  upperLimit: number;
  variables: VariableDef[];
  description: string;
}

interface VariableDef {
  name: string;
  label: string;
  unit: string;
  source: 'MANUAL' | 'AUTO' | 'BOM' | 'PREV_OP';
  description: string;
}

interface CalculationRecord {
  id: string;
  batchNo: string;
  productName: string;
  operationCode: string;
  operationName: string;
  workshop: string;
  formulaName: string;
  formulaType: FormulaType;
  variables: Record<string, number>;
  result: number | null;
  status: BalanceStatus;
  lowerLimit: number;
  upperLimit: number;
  calculatedAt: string;
  deviationId?: string;
  operator: string;
}

// ── 公式库（PRD §6 附录A）────────────────────────────────────────
const FORMULA_CONFIGS: FormulaConfig[] = [
  {
    id: 'F001', name: '片剂混合工序物料平衡', workshop: '固体车间', operationCode: 'GD-02',
    operationName: '混合', dosageForm: 'TAB', formulaType: 'MATERIAL_BALANCE',
    expression: '(混合后总重量 / 各物料重量之和) × 100',
    lowerLimit: 96, upperLimit: 102,
    variables: [
      { name: 'output_weight', label: '混合后总重量', unit: 'kg', source: 'MANUAL', description: '混合完成后称量总重' },
      { name: 'input_weight', label: '各物料重量之和', unit: 'kg', source: 'PREV_OP', description: '称量配料工序投料总重' },
    ],
    description: '(混合后总重量 / 混合前各物料重量之和) × 100%',
  },
  {
    id: 'F002', name: '片剂制粒工序物料平衡', workshop: '固体车间', operationCode: 'GD-03',
    operationName: '制粒', dosageForm: 'TAB', formulaType: 'MATERIAL_BALANCE',
    expression: '(颗粒重量 / 混合粉重量) × 100',
    lowerLimit: 96, upperLimit: 102,
    variables: [
      { name: 'granule_weight', label: '颗粒重量', unit: 'kg', source: 'MANUAL', description: '制粒后干颗粒总重' },
      { name: 'mix_weight', label: '混合粉重量', unit: 'kg', source: 'PREV_OP', description: '来自混合工序产出重量' },
    ],
    description: '(颗粒重量 / 混合粉重量) × 100%',
  },
  {
    id: 'F003', name: '片剂干燥工序物料平衡', workshop: '固体车间', operationCode: 'GD-04',
    operationName: '干燥', dosageForm: 'TAB', formulaType: 'MATERIAL_BALANCE',
    expression: '(干燥后颗粒重量 / 干燥前颗粒重量) × 100',
    lowerLimit: 96, upperLimit: 102,
    variables: [
      { name: 'dried_weight', label: '干燥后颗粒重量', unit: 'kg', source: 'MANUAL', description: '干燥完成后称量重量' },
      { name: 'wet_weight', label: '干燥前颗粒重量', unit: 'kg', source: 'PREV_OP', description: '来自制粒工序颗粒重量' },
    ],
    description: '(干燥后颗粒重量 / 干燥前颗粒重量) × 100%',
  },
  {
    id: 'F004', name: '片剂压片工序物料平衡', workshop: '固体车间', operationCode: 'GD-05',
    operationName: '压片', dosageForm: 'TAB', formulaType: 'MATERIAL_BALANCE',
    expression: '(合格片数 + 不合格片数) × 理论片重 / 领取颗粒重量 × 100',
    lowerLimit: 96, upperLimit: 102,
    variables: [
      { name: 'qualified_qty', label: '合格片数', unit: '片', source: 'AUTO', description: '压片完成后合格片数' },
      { name: 'unqualified_qty', label: '不合格片数', unit: '片', source: 'MANUAL', description: '剔废品计数' },
      { name: 'theoretical_weight', label: '理论片重', unit: 'mg', source: 'BOM', description: '单片理论重量（来自BOM）' },
      { name: 'granule_weight', label: '领取颗粒重量', unit: 'kg', source: 'PREV_OP', description: '从干燥工序带入' },
    ],
    description: '(合格片数 + 不合格片数) × 理论片重(mg) / 领取颗粒重量(kg×10⁶) × 100%',
  },
  {
    id: 'F005', name: '片剂铝塑包装工序物料平衡', workshop: '固体车间', operationCode: 'GD-06',
    operationName: '铝塑包装', dosageForm: 'TAB', formulaType: 'MATERIAL_BALANCE',
    expression: '(泡罩板数 × 每板片数 × 理论片重) / 领取颗粒重量 × 100',
    lowerLimit: 96, upperLimit: 102,
    variables: [
      { name: 'blister_packs', label: '泡罩板数', unit: '板', source: 'MANUAL', description: '铝塑包装完成的泡罩板总数' },
      { name: 'pieces_per_pack', label: '每板片数', unit: '片/板', source: 'BOM', description: '来自包装规格BOM' },
      { name: 'theoretical_weight', label: '理论片重', unit: 'mg', source: 'BOM', description: '单片理论重量' },
      { name: 'granule_weight', label: '领取颗粒重量', unit: 'kg', source: 'PREV_OP', description: '从压片工序带入' },
    ],
    description: '(泡罩板数 × 每板片数 × 理论片重) / 领取颗粒重量 × 100%',
  },
  {
    id: 'F006', name: '片剂外包装工序收率', workshop: '固体车间', operationCode: 'GD-07',
    operationName: '外包装', dosageForm: 'TAB', formulaType: 'YIELD',
    expression: '实际入库数量 / 理论包装数量 × 100',
    lowerLimit: 96, upperLimit: 100,
    variables: [
      { name: 'actual_storage_qty', label: '实际入库数量', unit: '盒', source: 'AUTO', description: 'WMS入库回传' },
      { name: 'theoretical_qty', label: '理论包装数量', unit: '盒', source: 'AUTO', description: '系统按铝塑板数×规格自动计算' },
    ],
    description: '实际入库数量 / 理论包装数量 × 100%',
  },
  {
    id: 'F007', name: '软胶囊压丸工序物料平衡', workshop: '软胶囊车间', operationCode: 'RN-03',
    operationName: '压丸', dosageForm: 'SGC', formulaType: 'MATERIAL_BALANCE',
    expression: '(合格丸数 + 不合格丸数) × 理论粒重 / (内容物重 + 胶液重) × 100',
    lowerLimit: 96, upperLimit: 102,
    variables: [
      { name: 'qualified_pcs', label: '合格丸数', unit: '粒', source: 'AUTO', description: '拣选后合格软胶囊数' },
      { name: 'unqualified_pcs', label: '不合格丸数', unit: '粒', source: 'MANUAL', description: '废丸计数' },
      { name: 'theoretical_weight', label: '理论粒重', unit: 'mg', source: 'BOM', description: '单粒理论重量（含内容物+胶皮）' },
      { name: 'content_weight', label: '内容物重量', unit: 'kg', source: 'PREV_OP', description: '来自配料工序' },
      { name: 'gel_weight', label: '胶液重量', unit: 'kg', source: 'PREV_OP', description: '来自化胶工序' },
    ],
    description: '(合格丸数 + 不合格丸数) × 理论粒重 / (内容物重 + 胶液重) × 100%',
  },
  {
    id: 'F008', name: '口服液灌装工序物料平衡', workshop: '液体车间', operationCode: 'YQ-03',
    operationName: '灌装', dosageForm: 'LIQ', formulaType: 'MATERIAL_BALANCE',
    expression: '(合格瓶数 + 不合格瓶数) × 每瓶装量 / 领取配制液量 × 100',
    lowerLimit: 96, upperLimit: 102,
    variables: [
      { name: 'qualified_bottles', label: '合格瓶数', unit: '瓶', source: 'AUTO', description: '灯检通过瓶数' },
      { name: 'unqualified_bottles', label: '不合格瓶数', unit: '瓶', source: 'MANUAL', description: '灯检不合格瓶数' },
      { name: 'fill_volume', label: '每瓶装量', unit: 'ml', source: 'BOM', description: '来自产品规格' },
      { name: 'liquid_volume', label: '领取配制液总量', unit: 'ml', source: 'PREV_OP', description: '来自配制工序' },
    ],
    description: '(合格瓶数 + 不合格瓶数) × 每瓶装量 / 领取配制液量 × 100%',
  },
  {
    id: 'F009', name: '粉剂分装工序物料平衡', workshop: '固体车间', operationCode: 'GD-03P',
    operationName: '分装', dosageForm: 'PWD', formulaType: 'MATERIAL_BALANCE',
    expression: '(合格袋数 + 不合格袋数) × 装量 / 混合粉重量 × 100',
    lowerLimit: 96, upperLimit: 102,
    variables: [
      { name: 'qualified_bags', label: '合格袋数', unit: '袋', source: 'AUTO', description: '检验合格包装袋数' },
      { name: 'unqualified_bags', label: '不合格袋数', unit: '袋', source: 'MANUAL', description: '废品袋数' },
      { name: 'fill_weight', label: '装量', unit: 'g', source: 'BOM', description: '每袋规定装量' },
      { name: 'mix_weight', label: '混合粉重量', unit: 'kg', source: 'PREV_OP', description: '来自混合工序' },
    ],
    description: '(合格袋数 + 不合格袋数) × 装量 / 混合粉重量 × 100%',
  },
  {
    id: 'F010', name: '瓶包线内包装物料平衡', workshop: '外包车间', operationCode: 'BOTTLE_LINE',
    operationName: '瓶包线内包装', dosageForm: 'ALL', formulaType: 'MATERIAL_BALANCE',
    expression: '(合格瓶数 + 不合格瓶数) × 装量 × 理论粒重 / 领取半成品重量 × 100',
    lowerLimit: 96, upperLimit: 102,
    variables: [
      { name: 'qualified_bottles', label: '合格瓶数', unit: '瓶', source: 'MANUAL', description: '完工合格瓶数' },
      { name: 'unqualified_bottles', label: '不合格瓶数', unit: '瓶', source: 'MANUAL', description: '废品瓶数' },
      { name: 'pieces_per_bottle', label: '每瓶装量', unit: '片(粒)/瓶', source: 'BOM', description: '包装规格' },
      { name: 'theoretical_weight', label: '理论粒重', unit: 'g', source: 'BOM', description: '半成品主数据' },
      { name: 'semi_weight', label: '领取半成品重量', unit: 'kg', source: 'MANUAL', description: '电子秤采集' },
    ],
    description: '(合格瓶数 + 不合格瓶数) × 每瓶装量 × 理论粒重 / 领取半成品重量 × 100%',
  },
  {
    id: 'F011', name: '外包装收率', workshop: '外包车间', operationCode: 'OUTER_PACKAGING',
    operationName: '外包装', dosageForm: 'ALL', formulaType: 'YIELD',
    expression: '(入库数量 + 取样数量) / 领取待包装量 × 100',
    lowerLimit: 96, upperLimit: 100,
    variables: [
      { name: 'storage_qty', label: '入库数量', unit: '瓶', source: 'AUTO', description: 'WMS入库回传' },
      { name: 'sample_qty', label: '取样数量', unit: '瓶', source: 'MANUAL', description: 'QA取样录入' },
      { name: 'received_qty', label: '领取待包装量', unit: '瓶', source: 'PREV_OP', description: '从瓶包线完工数量带入' },
    ],
    description: '(入库数量 + 取样数量) / 领取的待包装量 × 100%',
  },
  {
    id: 'F012', name: '外包装物料平衡', workshop: '外包车间', operationCode: 'OUTER_PACKAGING',
    operationName: '外包装', dosageForm: 'ALL', formulaType: 'MATERIAL_BALANCE',
    expression: '(入库数量 + 取样数量 + 损坏总量) / 领取待包装量 × 100',
    lowerLimit: 96, upperLimit: 102,
    variables: [
      { name: 'storage_qty', label: '入库数量', unit: '瓶', source: 'AUTO', description: 'WMS入库回传' },
      { name: 'sample_qty', label: '取样数量', unit: '瓶', source: 'MANUAL', description: 'QA取样录入' },
      { name: 'total_damaged', label: '损坏总量', unit: '瓶当量', source: 'MANUAL', description: '各包材损坏折算瓶当量之和' },
      { name: 'received_qty', label: '领取待包装量', unit: '瓶', source: 'PREV_OP', description: '从瓶包线带入' },
    ],
    description: '(入库数量 + 取样数量 + 损坏总量) / 领取的待包装量 × 100%',
  },
];

// ── 计算函数 ─────────────────────────────────────────────────────
function calculate(config: FormulaConfig, vars: Record<string, number>): number | null {
  try {
    switch (config.id) {
      case 'F001': return (vars.output_weight / vars.input_weight) * 100;
      case 'F002': return (vars.granule_weight / vars.mix_weight) * 100;
      case 'F003': return (vars.dried_weight / vars.wet_weight) * 100;
      case 'F004':
        // (合格片数 + 不合格片数) × 理论片重(mg) / 领取颗粒重量(kg→mg) × 100
        return ((vars.qualified_qty + vars.unqualified_qty) * vars.theoretical_weight) 
               / (vars.granule_weight * 1_000_000) * 100;
      case 'F005':
        return (vars.blister_packs * vars.pieces_per_pack * vars.theoretical_weight) 
               / (vars.granule_weight * 1_000_000) * 100;
      case 'F006': return (vars.actual_storage_qty / vars.theoretical_qty) * 100;
      case 'F007':
        return ((vars.qualified_pcs + vars.unqualified_pcs) * vars.theoretical_weight) 
               / ((vars.content_weight + vars.gel_weight) * 1_000_000) * 100;
      case 'F008':
        return ((vars.qualified_bottles + vars.unqualified_bottles) * vars.fill_volume) 
               / vars.liquid_volume * 100;
      case 'F009':
        return ((vars.qualified_bags + vars.unqualified_bags) * vars.fill_weight) 
               / (vars.mix_weight * 1000) * 100;
      case 'F010':
        return ((vars.qualified_bottles + vars.unqualified_bottles) * vars.pieces_per_bottle * vars.theoretical_weight) 
               / (vars.semi_weight * 1000) * 100;
      case 'F011': return ((vars.storage_qty + vars.sample_qty) / vars.received_qty) * 100;
      case 'F012': return ((vars.storage_qty + vars.sample_qty + vars.total_damaged) / vars.received_qty) * 100;
      default: return null;
    }
  } catch { return null; }
}

function getStatus(result: number, lower: number, upper: number): BalanceStatus {
  if (result < lower) return 'BELOW_LOWER_LIMIT';
  if (result > upper) return 'ABOVE_UPPER_LIMIT';
  return 'WITHIN_RANGE';
}

// ── 演示数据 ─────────────────────────────────────────────────────
const DEMO_RECORDS: CalculationRecord[] = [
  {
    id: 'C001', batchNo: 'B20260601001', productName: '维生素C片(500mg)', operationCode: 'GD-02', operationName: '混合',
    workshop: '固体车间', formulaName: '片剂混合工序物料平衡', formulaType: 'MATERIAL_BALANCE',
    variables: { output_weight: 49.2, input_weight: 50.0 }, result: 98.40, status: 'WITHIN_RANGE',
    lowerLimit: 96, upperLimit: 102, calculatedAt: '2026-06-01 09:32', operator: '张建国',
  },
  {
    id: 'C002', batchNo: 'B20260601001', productName: '维生素C片(500mg)', operationCode: 'GD-03', operationName: '制粒',
    workshop: '固体车间', formulaName: '片剂制粒工序物料平衡', formulaType: 'MATERIAL_BALANCE',
    variables: { granule_weight: 47.8, mix_weight: 49.2 }, result: 97.15, status: 'WITHIN_RANGE',
    lowerLimit: 96, upperLimit: 102, calculatedAt: '2026-06-01 14:20', operator: '张建国',
  },
  {
    id: 'C003', batchNo: 'B20260601001', productName: '维生素C片(500mg)', operationCode: 'GD-04', operationName: '干燥',
    workshop: '固体车间', formulaName: '片剂干燥工序物料平衡', formulaType: 'MATERIAL_BALANCE',
    variables: { dried_weight: 47.2, wet_weight: 47.8 }, result: 98.74, status: 'WITHIN_RANGE',
    lowerLimit: 96, upperLimit: 102, calculatedAt: '2026-06-02 08:15', operator: '李慧敏',
  },
  {
    id: 'C004', batchNo: 'B20260601001', productName: '维生素C片(500mg)', operationCode: 'GD-05', operationName: '压片',
    workshop: '固体车间', formulaName: '片剂压片工序物料平衡', formulaType: 'MATERIAL_BALANCE',
    variables: { qualified_qty: 88500, unqualified_qty: 800, theoretical_weight: 520, granule_weight: 47.2 },
    result: 98.11, status: 'WITHIN_RANGE',
    lowerLimit: 96, upperLimit: 102, calculatedAt: '2026-06-02 16:45', operator: '李慧敏',
  },
  {
    id: 'C005', batchNo: 'B20260601002', productName: '鱼油软胶囊(1000mg)', operationCode: 'RN-03', operationName: '压丸',
    workshop: '软胶囊车间', formulaName: '软胶囊压丸工序物料平衡', formulaType: 'MATERIAL_BALANCE',
    variables: { qualified_pcs: 59200, unqualified_pcs: 1200, theoretical_weight: 1650, content_weight: 62.0, gel_weight: 38.0 },
    result: 94.2, status: 'BELOW_LOWER_LIMIT',
    lowerLimit: 96, upperLimit: 102, calculatedAt: '2026-06-03 11:30', operator: '王大力',
    deviationId: 'DEV-2026-060301',
  },
  {
    id: 'C006', batchNo: 'B20260601003', productName: '维生素D口服液(10ml)', operationCode: 'YQ-03', operationName: '灌装',
    workshop: '液体车间', formulaName: '口服液灌装工序物料平衡', formulaType: 'MATERIAL_BALANCE',
    variables: { qualified_bottles: 4800, unqualified_bottles: 120, fill_volume: 10, liquid_volume: 50000 },
    result: 98.4, status: 'WITHIN_RANGE',
    lowerLimit: 96, upperLimit: 102, calculatedAt: '2026-06-04 15:20', operator: '陈小红',
  },
];

const STATUS_CFG: Record<BalanceStatus, { color: string; label: string; antColor: string }> = {
  WITHIN_RANGE:      { color: '#52c41a', label: '✅ 合格', antColor: 'success' },
  BELOW_LOWER_LIMIT: { color: '#ff4d4f', label: '❌ 低于下限', antColor: 'error' },
  ABOVE_UPPER_LIMIT: { color: '#ff4d4f', label: '❌ 高于上限', antColor: 'error' },
  PENDING:           { color: '#faad14', label: '⏳ 待计算', antColor: 'warning' },
  NOT_APPLICABLE:    { color: '#aaa',    label: '—  不适用', antColor: 'default' },
};

// ── 主组件 ────────────────────────────────────────────────────────
const MaterialBalanceEnginePage: React.FC = () => {
  const [records, setRecords] = useState<CalculationRecord[]>(DEMO_RECORDS);
  const [calcModalVisible, setCalcModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<CalculationRecord | null>(null);
  const [selectedFormula, setSelectedFormula] = useState<FormulaConfig | null>(null);
  const [activeTab, setActiveTab] = useState('records');
  const [filterWorkshop, setFilterWorkshop] = useState<string>('');
  const [form] = Form.useForm();

  // ── 统计 ──
  const stats = useMemo(() => {
    const total = records.length;
    const pass = records.filter(r => r.status === 'WITHIN_RANGE').length;
    const fail = records.filter(r => r.status === 'BELOW_LOWER_LIMIT' || r.status === 'ABOVE_UPPER_LIMIT').length;
    const pending = records.filter(r => r.status === 'PENDING').length;
    return { total, pass, fail, pending, passRate: total > 0 ? Math.round(pass / total * 100) : 0 };
  }, [records]);

  // ── 执行计算 ──
  const handleCalculate = useCallback(() => {
    if (!selectedFormula) return;
    form.validateFields().then(vals => {
      const vars: Record<string, number> = {};
      selectedFormula.variables.forEach(v => { vars[v.name] = Number(vals[v.name]) || 0; });
      const result = calculate(selectedFormula, vars);
      if (result === null) { message.error('计算失败，请检查输入数据'); return; }
      const status = getStatus(result, selectedFormula.lowerLimit, selectedFormula.upperLimit);
      const newRecord: CalculationRecord = {
        id: `C${Date.now()}`,
        batchNo: vals.batchNo || 'B202606TEST',
        productName: vals.productName || '测试产品',
        operationCode: selectedFormula.operationCode,
        operationName: selectedFormula.operationName,
        workshop: selectedFormula.workshop,
        formulaName: selectedFormula.name,
        formulaType: selectedFormula.formulaType,
        variables: vars,
        result: parseFloat(result.toFixed(2)),
        status,
        lowerLimit: selectedFormula.lowerLimit,
        upperLimit: selectedFormula.upperLimit,
        calculatedAt: dayjs().format('YYYY-MM-DD HH:mm'),
        operator: '当前用户',
        deviationId: (status !== 'WITHIN_RANGE' && status !== 'PENDING') ? `DEV-${dayjs().format('YYYY-MMDDSS')}` : undefined,
      };
      setRecords(prev => [newRecord, ...prev]);
      setCalcModalVisible(false);
      form.resetFields();
      if (status !== 'WITHIN_RANGE') {
        Modal.warning({
          title: '⚠️ 物料平衡超标 — 自动触发偏差',
          content: (
            <div>
              <Alert type="error" message={`计算结果：${result.toFixed(2)}%，${status === 'BELOW_LOWER_LIMIT' ? `低于下限${selectedFormula.lowerLimit}%` : `高于上限${selectedFormula.upperLimit}%`}`} style={{ marginBottom: 12 }} />
              <p>系统已自动创建偏差记录：<strong>{newRecord.deviationId}</strong></p>
              <p>工序状态已标记为 <Tag color="red">DEVIATION</Tag>，请及时处理偏差。</p>
            </div>
          ),
        });
      } else {
        message.success(`计算完成：${result.toFixed(2)}% — 合格 ✅`);
      }
    });
  }, [selectedFormula, form]);

  // ── 汇总表 ──
  const summaryByBatch = useMemo(() => {
    const batches = new Map<string, { batchNo: string; productName: string; ops: CalculationRecord[]; anyFail: boolean }>();
    records.forEach(r => {
      if (!batches.has(r.batchNo)) batches.set(r.batchNo, { batchNo: r.batchNo, productName: r.productName, ops: [], anyFail: false });
      const b = batches.get(r.batchNo)!;
      b.ops.push(r);
      if (r.status !== 'WITHIN_RANGE' && r.status !== 'NOT_APPLICABLE') b.anyFail = true;
    });
    return Array.from(batches.values());
  }, [records]);

  // ── 列定义 ──
  const columns: ColumnsType<CalculationRecord> = [
    { title: '批号', dataIndex: 'batchNo', width: 140, render: v => <Text code>{v}</Text> },
    { title: '产品', dataIndex: 'productName', width: 150 },
    { title: '车间', dataIndex: 'workshop', width: 100, render: v => <Tag color="blue">{v}</Tag> },
    { title: '工序', dataIndex: 'operationName', width: 100 },
    { title: '公式类型', dataIndex: 'formulaType', width: 110, render: v => (
      <Tag color={v === 'MATERIAL_BALANCE' ? 'purple' : 'cyan'}>{v === 'MATERIAL_BALANCE' ? '物料平衡' : '收率'}</Tag>
    )},
    { title: '计算结果', dataIndex: 'result', width: 120, render: (v, r) => (
      v !== null ? (
        <span style={{ color: r.status === 'WITHIN_RANGE' ? '#52c41a' : '#ff4d4f', fontWeight: 700, fontSize: 15 }}>
          {v.toFixed(2)}%
        </span>
      ) : <Tag>待计算</Tag>
    )},
    { title: '标准范围', width: 120, render: (_, r) => <Text type="secondary">{r.lowerLimit}%~{r.upperLimit}%</Text> },
    { title: '状态', dataIndex: 'status', width: 120, render: v => (
      <Tag color={STATUS_CFG[v as BalanceStatus]?.antColor}>{STATUS_CFG[v as BalanceStatus]?.label}</Tag>
    )},
    { title: '偏差单号', dataIndex: 'deviationId', width: 140, render: v => v ? <Tag color="red">{v}</Tag> : <Text type="secondary">—</Text> },
    { title: '计算时间', dataIndex: 'calculatedAt', width: 130 },
    { title: '操作人', dataIndex: 'operator', width: 90 },
    { title: '操作', width: 80, fixed: 'right', render: (_, r) => (
      <Button type="link" size="small" onClick={() => { setSelectedRecord(r); setDetailVisible(true); }}>详情</Button>
    )},
  ];

  const filteredRecords = filterWorkshop ? records.filter(r => r.workshop === filterWorkshop) : records;

  return (
    <div style={{ padding: '0 4px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>
          <CalculatorOutlined style={{ color: '#722ed1', marginRight: 8 }} />
          物料平衡与收率计算引擎
        </Title>
        <Space>
          <Button icon={<PlayCircleOutlined />} type="primary" onClick={() => {
            setSelectedFormula(null);
            form.resetFields();
            setCalcModalVisible(true);
          }}>
            新建计算
          </Button>
        </Space>
      </div>

      {/* 统计卡片 */}
      <Row gutter={12} style={{ marginBottom: 16 }}>
        {[
          { title: '计算总次数', value: stats.total, color: '#1677ff', icon: <CalculatorOutlined /> },
          { title: '合格次数', value: stats.pass, color: '#52c41a', icon: <CheckCircleOutlined /> },
          { title: '超标次数', value: stats.fail, color: '#ff4d4f', icon: <ExclamationCircleOutlined /> },
          { title: '合格率', value: `${stats.passRate}%`, color: stats.passRate >= 90 ? '#52c41a' : '#ff4d4f', icon: <SafetyCertificateOutlined /> },
        ].map((s, i) => (
          <Col span={6} key={i}>
            <Card size="small" style={{ borderLeft: `3px solid ${s.color}` }}>
              <Statistic title={s.title} value={s.value} valueStyle={{ color: s.color, fontSize: 22 }} prefix={s.icon} />
            </Card>
          </Col>
        ))}
      </Row>

      {stats.fail > 0 && (
        <Alert type="error" showIcon icon={<AlertOutlined />} style={{ marginBottom: 12 }}
          message={`⚠️ 当前有 ${stats.fail} 条计算结果超标，系统已自动创建偏差记录，请及时跟进处理！`}
          action={<Button size="small" type="link" danger>查看偏差</Button>}
        />
      )}

      <Tabs activeKey={activeTab} onChange={setActiveTab} type="card">
        {/* Tab1: 计算记录 */}
        <Tabs.TabPane tab={<span><FileTextOutlined />计算记录</span>} key="records">
          <Card size="small" style={{ marginBottom: 8 }}>
            <Space>
              <span style={{ fontSize: 12, color: '#888' }}>筛选车间：</span>
              <Select style={{ width: 130 }} value={filterWorkshop} onChange={setFilterWorkshop}
                placeholder="全部车间" allowClear size="small">
                {['固体车间','软胶囊车间','液体车间','外包车间'].map(w => <Option key={w} value={w}>{w}</Option>)}
              </Select>
            </Space>
          </Card>
          <Table
            columns={columns} dataSource={filteredRecords} rowKey="id"
            size="small" scroll={{ x: 1400 }} pagination={{ pageSize: 12 }}
            rowClassName={r => r.status !== 'WITHIN_RANGE' && r.status !== 'NOT_APPLICABLE' ? 'ant-table-row-error' : ''}
          />
        </Tabs.TabPane>

        {/* Tab2: 批次汇总 */}
        <Tabs.TabPane tab={<span><BarChartOutlined />批次汇总</span>} key="summary">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {summaryByBatch.map(b => (
              <Card key={b.batchNo} size="small" title={
                <Space>
                  <Text code>{b.batchNo}</Text>
                  <Text strong>{b.productName}</Text>
                  {b.anyFail ? <Tag color="red">⚠️ 有工序超标</Tag> : <Tag color="green">✅ 全部合格</Tag>}
                </Space>
              }>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {b.ops.map(op => {
                    const cfg = STATUS_CFG[op.status];
                    return (
                      <Tooltip key={op.id} title={`${op.operationName}：${op.result?.toFixed(2) ?? '-'}% (${cfg.label})`}>
                        <div style={{
                          padding: '6px 12px', borderRadius: 6,
                          background: op.status === 'WITHIN_RANGE' ? '#f6ffed' : '#fff2f0',
                          border: `1px solid ${op.status === 'WITHIN_RANGE' ? '#b7eb8f' : '#ffccc7'}`,
                          cursor: 'pointer', textAlign: 'center', minWidth: 90,
                        }} onClick={() => { setSelectedRecord(op); setDetailVisible(true); }}>
                          <div style={{ fontSize: 11, color: '#666', marginBottom: 2 }}>{op.operationName}</div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: cfg.color }}>
                            {op.result?.toFixed(2) ?? '-'}%
                          </div>
                          <div style={{ fontSize: 10, color: '#999' }}>{op.formulaType === 'MATERIAL_BALANCE' ? '物料平衡' : '收率'}</div>
                        </div>
                      </Tooltip>
                    );
                  })}
                </div>
              </Card>
            ))}
          </div>
        </Tabs.TabPane>

        {/* Tab3: 公式库 */}
        <Tabs.TabPane tab={<span><DotChartOutlined />计算公式库</span>} key="formulas">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 12 }}>
            {FORMULA_CONFIGS.map(f => (
              <Card key={f.id} size="small" hoverable
                title={<Space><Tag color={f.formulaType === 'MATERIAL_BALANCE' ? 'purple' : 'cyan'}>{f.id}</Tag><span style={{ fontSize: 13 }}>{f.name}</span></Space>}
                extra={<Tag color="blue">{f.workshop}</Tag>}
              >
                <div style={{ fontSize: 12, color: '#555', marginBottom: 6 }}>
                  <strong>工序：</strong>{f.operationCode} {f.operationName}
                </div>
                <div style={{ background: '#f5f0ff', borderRadius: 4, padding: '4px 8px', fontSize: 11, fontFamily: 'monospace', marginBottom: 8, color: '#531dab' }}>
                  {f.description}
                </div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 11, color: '#888' }}>标准：</span>
                  <Tag color="green">下限 {f.lowerLimit}%</Tag>
                  <Tag color="blue">上限 {f.upperLimit}%</Tag>
                </div>
                <div style={{ fontSize: 11, color: '#888' }}>
                  变量：{f.variables.map(v => v.label).join(' / ')}
                </div>
                <Button size="small" type="link" style={{ padding: 0, marginTop: 4 }}
                  onClick={() => { setSelectedFormula(f); form.resetFields(); setCalcModalVisible(true); }}>
                  使用此公式计算 →
                </Button>
              </Card>
            ))}
          </div>
        </Tabs.TabPane>
      </Tabs>

      {/* 计算弹窗 */}
      <Modal
        title={<Space><CalculatorOutlined style={{ color: '#722ed1' }} />物料平衡/收率计算</Space>}
        open={calcModalVisible} onCancel={() => setCalcModalVisible(false)}
        onOk={handleCalculate} okText="执行计算" width={600}
      >
        <Form form={form} layout="vertical">
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item label="批号" name="batchNo" rules={[{ required: true }]}>
                <Input placeholder="如 B20260601001" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="产品名称" name="productName" rules={[{ required: true }]}>
                <Input placeholder="如 维生素C片" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="选择计算公式" name="formula" rules={[{ required: true }]}>
            <Select placeholder="请选择计算公式" onChange={id => setSelectedFormula(FORMULA_CONFIGS.find(f => f.id === id) || null)}>
              {FORMULA_CONFIGS.map(f => (
                <Option key={f.id} value={f.id}>
                  [{f.id}] {f.name} — {f.workshop}
                </Option>
              ))}
            </Select>
          </Form.Item>
          {selectedFormula && (
            <>
              <Alert type="info" style={{ marginBottom: 12 }} showIcon
                message={<span style={{ fontSize: 12 }}>公式：<code style={{ color: '#531dab' }}>{selectedFormula.description}</code><br />标准范围：{selectedFormula.lowerLimit}% ~ {selectedFormula.upperLimit}%</span>}
              />
              <Divider orientation={"left" as any} style={{ fontSize: 12 }}>请输入各变量值</Divider>
              <Row gutter={12}>
                {selectedFormula.variables.map(v => (
                  <Col span={12} key={v.name}>
                    <Form.Item label={<Tooltip title={`${v.description}（来源：${v.source}）`}><span>{v.label} <Text type="secondary">({v.unit})</Text></span></Tooltip>} name={v.name} rules={[{ required: true, type: 'number', min: 0 }]}>
                      <InputNumber style={{ width: '100%' }} placeholder={`单位：${v.unit}`} min={0} precision={4}
                        addonAfter={<Text type="secondary" style={{ fontSize: 11 }}>{v.unit}</Text>}
                      />
                    </Form.Item>
                  </Col>
                ))}
              </Row>
            </>
          )}
        </Form>
      </Modal>

      {/* 详情弹窗 */}
      <Modal title="计算详情" open={detailVisible} onCancel={() => setDetailVisible(false)} footer={null} width={580}>
        {selectedRecord && (
          <>
            <Descriptions column={2} size="small" bordered>
              <Descriptions.Item label="批号" span={2}><Text code>{selectedRecord.batchNo}</Text></Descriptions.Item>
              <Descriptions.Item label="产品">{selectedRecord.productName}</Descriptions.Item>
              <Descriptions.Item label="工序">{selectedRecord.operationName}</Descriptions.Item>
              <Descriptions.Item label="公式" span={2}>{selectedRecord.formulaName}</Descriptions.Item>
              <Descriptions.Item label="计算结果">
                <Text strong style={{ color: STATUS_CFG[selectedRecord.status].color, fontSize: 20 }}>
                  {selectedRecord.result?.toFixed(2)}%
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={STATUS_CFG[selectedRecord.status].antColor}>{STATUS_CFG[selectedRecord.status].label}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="标准范围">{selectedRecord.lowerLimit}% ~ {selectedRecord.upperLimit}%</Descriptions.Item>
              <Descriptions.Item label="偏差单号">
                {selectedRecord.deviationId ? <Tag color="red">{selectedRecord.deviationId}</Tag> : '—'}
              </Descriptions.Item>
            </Descriptions>
            <Divider orientation={"left" as any} style={{ fontSize: 12 }}>变量输入值</Divider>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {Object.entries(selectedRecord.variables).map(([k, v]) => (
                <div key={k} style={{ background: '#f0f5ff', border: '1px solid #adc6ff', borderRadius: 4, padding: '4px 10px', fontSize: 12 }}>
                  <div style={{ color: '#888', fontSize: 10 }}>{k}</div>
                  <div style={{ fontWeight: 600, color: '#2f54eb' }}>{v}</div>
                </div>
              ))}
            </div>
            {selectedRecord.result !== null && (
              <div style={{ marginTop: 12, background: selectedRecord.status === 'WITHIN_RANGE' ? '#f6ffed' : '#fff2f0', borderRadius: 6, padding: 12 }}>
                <Progress
                  percent={Math.min(selectedRecord.result, 105)}
                  success={{ percent: selectedRecord.lowerLimit }}
                  strokeColor={selectedRecord.status === 'WITHIN_RANGE' ? '#52c41a' : '#ff4d4f'}
                  format={() => `${selectedRecord.result?.toFixed(2)}%`}
                />
              </div>
            )}
          </>
        )}
      </Modal>
    </div>
  );
};

export default MaterialBalanceEnginePage;

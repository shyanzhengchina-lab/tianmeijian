import React, { useState } from 'react';
import { Button, Card, Space, Typography, Tag, Alert, Row, Col, Select, Table, message, Input } from 'antd';
import { PlusOutlined, CheckCircleOutlined, ScanOutlined, SettingOutlined } from '@ant-design/icons';
import type { StageExecution } from '../padExecutionData';
import PadNumPad from '../components/PadNumPad';

const { Text } = Typography;
const { Option } = Select;

interface DataCollectStageProps {
  opCode?: string;
  content?: string;
  execution: StageExecution;
  onComplete: (data: Record<string, unknown>) => void;
}

// ==================== 数据采集字段定义（按工序）====================

interface DcField {
  key: string;
  label: string;
  unit?: string;
  precision?: number;
  spec?: string;
  specMin?: number;
  specMax?: number;
  type: 'number' | 'text' | 'select';
  options?: string[];
  required?: boolean;
  colSpan?: number; // antd 栅格 span
}

interface DcConfig {
  title: string;            // 数采标题
  deviceLabel?: string;     // 设备标签
  fields: DcField[];        // 数采字段
  minRecords: number;       // 至少录入几条
  mockData: Array<Record<string, number | string>>; // 示例数据
}

const DC_CONFIG_BY_OP: Record<string, DcConfig> = {
  // ─── 保健品工序（SOR-MF-PE-02-05 批包装记录） ───────────────────────────

  // 称量配料
  'OP-GMP-WEIGH': {
    title: '称量配料 — 过程数据',
    deviceLabel: '电子天平',
    minRecords: 1,
    fields: [
      { key: 'material_name', label: '物料名称', type: 'text', required: true, colSpan: 12 },
      { key: 'batch_no', label: '物料批号', type: 'text', required: true, colSpan: 12 },
      { key: 'plan_qty', label: '处方量(kg)', unit: 'kg', precision: 3, type: 'number', required: true, colSpan: 8 },
      { key: 'actual_qty', label: '实称量(kg)', unit: 'kg', precision: 3, type: 'number', required: true, colSpan: 8 },
      { key: 'balance_check', label: '称量复核', type: 'select', options: ['复核一致', '不一致'], required: true, colSpan: 8 },
      { key: 'temp', label: '环境温度(℃)', unit: '℃', precision: 1, specMin: 18, specMax: 26, type: 'number', required: true, colSpan: 8 },
      { key: 'humidity', label: '相对湿度(%)', unit: '%', precision: 1, specMin: 45, specMax: 65, type: 'number', required: true, colSpan: 8 },
    ],
    mockData: [{ material_name: '维生素C', batch_no: 'VC-2026-01', plan_qty: 50.000, actual_qty: 50.003, balance_check: '复核一致', temp: 22.1, humidity: 52.3 }],
  },

  // 混合
  'OP-GMP-MIX': {
    title: '混合工序 — 过程参数',
    deviceLabel: '三维混合机',
    minRecords: 1,
    fields: [
      { key: 'equip_no', label: '混合机编号', type: 'text', required: true, colSpan: 8 },
      { key: 'mix_speed', label: '混合转速(rpm)', unit: 'rpm', precision: 0, specMin: 8, specMax: 15, type: 'number', required: true, colSpan: 8 },
      { key: 'mix_time', label: '混合时间(min)', unit: 'min', precision: 0, specMin: 15, specMax: 30, type: 'number', required: true, colSpan: 8 },
      { key: 'mix_rsd', label: '混合均匀性RSD', unit: '%', precision: 2, spec: 'RSD≤5%', specMin: 0, specMax: 5, type: 'number', required: true, colSpan: 8 },
      { key: 'temp', label: '环境温度(℃)', unit: '℃', precision: 1, specMin: 18, specMax: 26, type: 'number', required: true, colSpan: 8 },
      { key: 'humidity', label: '相对湿度(%)', unit: '%', precision: 1, specMin: 45, specMax: 65, type: 'number', required: true, colSpan: 8 },
    ],
    mockData: [{ equip_no: 'MX-001', mix_speed: 12, mix_time: 20, mix_rsd: 2.3, temp: 22.5, humidity: 53.0 }],
  },

  // 制粒/干燥
  'OP-GMP-GRANULATE': {
    title: '制粒干燥 — 过程参数',
    deviceLabel: '湿法制粒机 / 流化床干燥机',
    minRecords: 1,
    fields: [
      { key: 'equip_no', label: '设备编号', type: 'text', required: true, colSpan: 8 },
      { key: 'granule_moisture', label: '颗粒水分(%)', unit: '%', precision: 2, spec: '≤3.0%', specMin: 0, specMax: 3.0, type: 'number', required: true, colSpan: 8 },
      { key: 'granule_size', label: '颗粒粒径(目)', unit: '目', precision: 0, type: 'number', colSpan: 8 },
      { key: 'inlet_temp', label: '进风温度(℃)', unit: '℃', precision: 1, type: 'number', colSpan: 8 },
      { key: 'outlet_temp', label: '出风温度(℃)', unit: '℃', precision: 1, type: 'number', colSpan: 8 },
      { key: 'dry_time', label: '干燥时间(min)', unit: 'min', precision: 0, type: 'number', colSpan: 8 },
    ],
    mockData: [{ equip_no: 'GR-001', granule_moisture: 1.8, granule_size: 20, inlet_temp: 65, outlet_temp: 38, dry_time: 45 }],
  },

  // 包衣（Film Coating）— VitC咀嚼片薄膜包衣，包衣增重率2~4%关键工序
  'OP-GMP-COATING': {
    title: '包衣工序 — 包衣增重率及过程参数监控',
    deviceLabel: '高效包衣机（BFC-150）',
    minRecords: 4,
    fields: [
      { key: 'check_time',   label: '监测时间点',       type: 'text',   required: true,  colSpan: 8 },
      { key: 'weight_gain',  label: '包衣增重率(%)',    unit: '%',      precision: 2, spec: '2.0~4.0%', specMin: 2.0, specMax: 4.0, type: 'number', required: true, colSpan: 8 },
      { key: 'tablet_weight',label: '片重(mg)',         unit: 'mg',     precision: 1, spec: '500±5%', specMin: 475, specMax: 525,  type: 'number', required: true, colSpan: 8 },
      { key: 'inlet_temp',   label: '进风温度(℃)',      unit: '℃',      precision: 1, spec: '40~55℃', specMin: 40, specMax: 55,   type: 'number', required: true, colSpan: 8 },
      { key: 'outlet_temp',  label: '出风温度(℃)',      unit: '℃',      precision: 1, spec: '35~45℃', specMin: 35, specMax: 45,   type: 'number', required: true, colSpan: 8 },
      { key: 'spray_rate',   label: '喷液速率(g/min)',  unit: 'g/min',  precision: 1, spec: '80~120', specMin: 80, specMax: 120,   type: 'number', required: true, colSpan: 8 },
      { key: 'pan_pressure', label: '锅内负压(Pa)',     unit: 'Pa',     precision: 0, spec: '-50~-20', specMin: -50, specMax: -20, type: 'number', required: false, colSpan: 8 },
      { key: 'appearance',   label: '片面外观',         type: 'select', options: ['合格（颜色均匀）', '裂片', '粘连', '花斑'], required: true, colSpan: 8 },
      { key: 'humidity',     label: '操作间湿度(%)',    unit: '%',      precision: 1, specMin: 40, specMax: 65, type: 'number', required: false, colSpan: 8 },
    ],
    mockData: [
      { check_time: '08:30（0.5h）', weight_gain: 0.8,  tablet_weight: 504.1, inlet_temp: 48, outlet_temp: 38, spray_rate: 90,  pan_pressure: -35, appearance: '合格（颜色均匀）', humidity: 52 },
      { check_time: '09:30（1.5h）', weight_gain: 1.6,  tablet_weight: 508.0, inlet_temp: 49, outlet_temp: 39, spray_rate: 95,  pan_pressure: -33, appearance: '合格（颜色均匀）', humidity: 52 },
      { check_time: '10:30（2.5h）', weight_gain: 2.4,  tablet_weight: 512.0, inlet_temp: 50, outlet_temp: 40, spray_rate: 95,  pan_pressure: -32, appearance: '合格（颜色均匀）', humidity: 53 },
      { check_time: '11:15（终点）', weight_gain: 3.2,  tablet_weight: 516.0, inlet_temp: 50, outlet_temp: 41, spray_rate: 90,  pan_pressure: -33, appearance: '合格（颜色均匀）', humidity: 52 },
    ],
  },

  // 内包装（瓶包线）
  'OP-GMP-INNERPACK': {
    title: '内包装（瓶包线） — 过程数据',
    deviceLabel: '全自动数片机 / 瓶包线',
    minRecords: 3,
    fields: [
      { key: 'check_time', label: '检查时间', type: 'text', required: true, colSpan: 8 },
      { key: 'fill_qty', label: '装量(片/粒)', unit: '片', precision: 0, type: 'number', required: true, colSpan: 8 },
      { key: 'fill_weight', label: '装量重(g)', unit: 'g', precision: 2, spec: '±5%', type: 'number', required: true, colSpan: 8 },
      { key: 'seal_check', label: '瓶盖密封', type: 'select', options: ['合格', '不合格'], required: true, colSpan: 8 },
      { key: 'label_check', label: '标签位置', type: 'select', options: ['合格', '不合格'], required: true, colSpan: 8 },
      { key: 'temp', label: '环境温度(℃)', unit: '℃', precision: 1, type: 'number', colSpan: 8 },
      { key: 'humidity', label: '相对湿度(%)', unit: '%', precision: 1, type: 'number', colSpan: 8 },
    ],
    mockData: [
      { check_time: '08:30', fill_qty: 60, fill_weight: 72.15, seal_check: '合格', label_check: '合格', temp: 22.0, humidity: 51.5 },
      { check_time: '10:00', fill_qty: 60, fill_weight: 71.98, seal_check: '合格', label_check: '合格', temp: 22.3, humidity: 52.0 },
      { check_time: '14:00', fill_qty: 60, fill_weight: 72.08, seal_check: '合格', label_check: '合格', temp: 22.1, humidity: 51.8 },
    ],
  },

  // 外包装（装盒/装箱）
  'OP-GMP-OUTERPACK': {
    title: '外包装（装盒/装箱） — 过程数据',
    deviceLabel: '装盒机 / 打码机',
    minRecords: 2,
    fields: [
      { key: 'check_time', label: '检查时间', type: 'text', required: true, colSpan: 8 },
      { key: 'bottles_per_box', label: '每盒瓶数', unit: '瓶', precision: 0, type: 'number', required: true, colSpan: 8 },
      { key: 'insert_check', label: '说明书', type: 'select', options: ['合格', '缺失'], required: true, colSpan: 8 },
      { key: 'batch_print', label: '批号打印', type: 'select', options: ['清晰正确', '不合格'], required: true, colSpan: 8 },
      { key: 'seal_check', label: '盒体密封', type: 'select', options: ['合格', '不合格'], required: true, colSpan: 8 },
      { key: 'code_verify', label: 'UPC/批号复核', type: 'select', options: ['一致', '不一致'], required: true, colSpan: 8 },
    ],
    mockData: [
      { check_time: '09:00', bottles_per_box: 1, insert_check: '合格', batch_print: '清晰正确', seal_check: '合格', code_verify: '一致' },
      { check_time: '13:00', bottles_per_box: 1, insert_check: '合格', batch_print: '清晰正确', seal_check: '合格', code_verify: '一致' },
    ],
  },

  // ─── 天美健保健品GMP工序数据采集 ──────────────────────────────────────────

  // PKG-04 压片工序：抽检片重差异/硬度/脆碎度/外观
  'PKG-04': {
    title: '压片工序 — 过程抽检数据（IPQC）',
    deviceLabel: '电子天平 / 硬度仪',
    minRecords: 3,
    fields: [
      { key: 'weight', label: '片重', unit: 'mg', precision: 1, spec: '100±5%', specMin: 95, specMax: 105, type: 'number', required: true, colSpan: 8 },
      { key: 'hardness', label: '硬度', unit: 'kP', precision: 1, spec: '4.0~8.0', specMin: 4.0, specMax: 8.0, type: 'number', required: true, colSpan: 8 },
      { key: 'friability', label: '脆碎度', type: 'select', options: ['≤0.5% 合格', '>0.5% 不合格'], required: true, colSpan: 8 },
      { key: 'appearance', label: '外观', type: 'select', options: ['合格', '不合格'], required: true, colSpan: 8 },
      { key: 'disintegration', label: '崩解时限', unit: 'min', precision: 1, spec: '≤15min', specMin: 0, specMax: 15, type: 'number', required: false, colSpan: 8 },
    ],
    mockData: [
      { weight: 100.2, hardness: 6.2, friability: '≤0.5% 合格', appearance: '合格', disintegration: 8.5 },
      { weight: 99.8, hardness: 5.8, friability: '≤0.5% 合格', appearance: '合格', disintegration: 9.2 },
      { weight: 100.5, hardness: 6.5, friability: '≤0.5% 合格', appearance: '合格', disintegration: 7.8 },
    ],
  },

  // PKG-05 包衣工序：抽检增重/外观/颜色均一性
  'PKG-05': {
    title: '包衣工序 — 过程检验数据（IPQC）',
    deviceLabel: '电子天平 / 包衣机参数采集',
    minRecords: 1,
    fields: [
      { key: 'weight_gain', label: '包衣增重', unit: '%', precision: 2, spec: '3.0~5.0', specMin: 3.0, specMax: 5.0, type: 'number', required: true, colSpan: 8 },
      { key: 'inlet_temp', label: '进风温度', unit: '℃', precision: 1, spec: '55±5', specMin: 50, specMax: 60, type: 'number', required: true, colSpan: 8 },
      { key: 'appearance', label: '包衣外观', type: 'select', options: ['光滑均匀 合格', '有裂片/粘片 不合格'], required: true, colSpan: 8 },
      { key: 'color_uniform', label: '颜色均一性', type: 'select', options: ['均一', '不均一'], required: true, colSpan: 8 },
    ],
    mockData: [
      { weight_gain: 3.8, inlet_temp: 55.2, appearance: '光滑均匀 合格', color_uniform: '均一' },
    ],
  },
};

// 通用默认配置（GMP保健品过程抽检通用）
const DC_CONFIG_DEFAULT: DcConfig = {
  title: '过程数据采集（GMP）',
  deviceLabel: '检测设备',
  minRecords: 1,
  fields: [
    { key: 'weight', label: '样品重量', unit: 'mg', precision: 1, spec: '标准±5%', type: 'number', required: true, colSpan: 8 },
    { key: 'appearance', label: '外观', type: 'select', options: ['合格', '不合格'], required: true, colSpan: 8 },
    { key: 'remark', label: '备注', type: 'select', options: ['无异常', '有异常'], required: false, colSpan: 8 },
  ],
  mockData: [
    { weight: 300.2, appearance: '合格', remark: '无异常' },
    { weight: 299.8, appearance: '合格', remark: '无异常' },
    { weight: 300.5, appearance: '合格', remark: '无异常' },
  ],
};

// 根据字段值判断是否合格
function isFieldPass(field: DcField, val: number | string | null | undefined): boolean | undefined {
  if (val === null || val === undefined || val === '') return undefined;
  if (field.type === 'number' && field.specMin !== undefined && field.specMax !== undefined) {
    const n = Number(val);
    return n >= field.specMin && n <= field.specMax;
  }
  if (field.type === 'select') {
    const str = String(val);
    return str.includes('合格') || str.includes('符合') || str === '合格批';
  }
  return true;
}

type RecordRow = Record<string, number | string | null>;

const MOCK_DEVICES_BY_OP: Record<string, Array<{ id: string; name: string; type: string }>> = {
  'PKG-04': [
    { id: 'TMJ-BAL-001', name: '电子天平-BAL001', type: '电子天平' },
    { id: 'TMJ-HD-001', name: '硬度测定仪-HD001', type: '硬度仪' },
  ],
  'PKG-05': [
    { id: 'TMJ-BAL-001', name: '电子天平-BAL001', type: '电子天平' },
    { id: 'TMJ-BY-001', name: '包衣机-BY001', type: '包衣机' },
  ],
  default: [
    { id: 'TMJ-BAL-001', name: '电子天平-BAL001', type: '电子天平' },
    { id: 'TMJ-QC-001', name: '紫外分光光度计-UV001', type: '紫外分光' },
    { id: 'TMJ-QC-002', name: 'HPLC色谱仪-HPLC001', type: 'HPLC' },
  ],
};

const DataCollectStage: React.FC<DataCollectStageProps> = ({ opCode = '', content, execution, onComplete }) => {
  const config = DC_CONFIG_BY_OP[opCode] || DC_CONFIG_DEFAULT;
  const deviceList = MOCK_DEVICES_BY_OP[opCode] || MOCK_DEVICES_BY_OP.default;

  const [device, setDevice] = useState('');
  const [records, setRecords] = useState<RecordRow[]>([]);
  // 当前行输入状态
  const [editRow, setEditRow] = useState<RecordRow>(
    Object.fromEntries(config.fields.map(f => [f.key, null]))
  );

  const isCompleted = execution.status === 'completed';

  const canSubmit = !!device && records.length >= config.minRecords;

  const setField = (key: string, val: number | string | null) => {
    setEditRow(prev => ({ ...prev, [key]: val }));
  };

  const handleAddRecord = () => {
    // 检查必填字段
    const missing = config.fields.filter(f => f.required && (editRow[f.key] === null || editRow[f.key] === ''));
    if (missing.length > 0) {
      message.warning(`请填写：${missing.map(f => f.label).join('、')}`);
      return;
    }
    // 判断整体是否合格
    const allPass = config.fields.every(f => {
      const p = isFieldPass(f, editRow[f.key]);
      return p === undefined || p === true;
    });
    const newRow: RecordRow = {
      ...editRow,
      _seq: records.length + 1,
      _result: allPass ? 'pass' : 'fail',
    };
    setRecords(prev => [...prev, newRow]);
    setEditRow(Object.fromEntries(config.fields.map(f => [f.key, null])));
    message.success(`第 ${records.length + 1} 条记录已添加`);
  };

  const handleMockData = () => {
    const mocked = config.mockData.map((d, i) => ({
      ...d,
      _seq: i + 1,
      _result: 'pass',
    }));
    setRecords(mocked);
    setDevice(deviceList[0].id);
    message.success(`已填入 ${mocked.length} 条模拟数据`);
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    onComplete({
      dc_config: opCode,
      dc_table: records,
      dc_device: device,
      dc_device_name: deviceList.find(d => d.id === device)?.name,
      dc_operator: '张三(1001)',
      dc_pass_rate: records.length > 0
        ? Math.round(records.filter(r => r._result === 'pass').length / records.length * 100) + '%'
        : '—',
    });
  };

  if (isCompleted) {
    return (
      <Card style={{ background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 10 }}>
        <Space>
          <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 20 }} />
          <Text strong style={{ color: '#52c41a' }}>数据采集已完成</Text>
          <Tag color="blue">{records.length > 0 ? `${records.length}条记录` : ''}</Tag>
        </Space>
      </Card>
    );
  }

  // 构建表格列
  const tableColumns = [
    { title: '序号', dataIndex: '_seq', width: 55 },
    ...config.fields.map(f => ({
      title: f.label + (f.unit ? `(${f.unit})` : ''),
      dataIndex: f.key,
      render: (val: number | string | null) => {
        if (val === null || val === undefined) return <Text type="secondary">—</Text>;
        const pass = isFieldPass(f, val);
        if (f.type === 'number' && f.specMin !== undefined) {
          return <Text style={{ color: pass ? '#52c41a' : '#ff4d4f', fontWeight: 600 }}>
            {typeof val === 'number' ? val.toFixed(f.precision ?? 3) : val}
          </Text>;
        }
        return <Text>{String(val)}</Text>;
      },
    })),
    {
      title: '综合结果',
      dataIndex: '_result',
      width: 90,
      render: (v: string) => v === 'pass'
        ? <Tag color="success">✓合格</Tag>
        : <Tag color="error">✗不合格</Tag>,
    },
  ];

  const selectedDevice = deviceList.find(d => d.id === device);

  return (
    <div>
      <Card
        title={
          <Space>
            <SettingOutlined style={{ color: '#1890ff' }} />
            <span>数据采集</span>
            {content && <Tag color="blue" style={{ fontWeight: 'normal', fontSize: 12 }}>{content}</Tag>}
          </Space>
        }
        style={{ marginBottom: 14, borderRadius: 10 }}
      >
        <Space direction="vertical" style={{ width: '100%' }} size={14}>
          <Alert
            message={`${config.title} — 至少录入 ${config.minRecords} 条记录，需体现使用的检测设备`}
            type="info" showIcon
          />

          {/* 检测设备绑定 */}
          <Card size="small" title={<Text strong style={{ fontSize: 12 }}>关联检测设备（{config.deviceLabel}）</Text>} style={{ borderRadius: 8 }}>
            <Space size={12} wrap>
              <Select size="large" style={{ width: 230 }} placeholder="选择或扫码检测设备"
                value={device || undefined} onChange={v => setDevice(v)}>
                {deviceList.map(d => (
                  <Option key={d.id} value={d.id}>{d.name}（{d.type}）</Option>
                ))}
              </Select>
              <Button icon={<ScanOutlined />} size="large"
                onClick={() => { setDevice(deviceList[0].id); message.success(`设备 ${deviceList[0].name} 绑定成功，校准有效`); }}>
                扫码绑定
              </Button>
              {selectedDevice && (
                <Space>
                  <Text type="secondary" style={{ fontSize: 12 }}>编号：{selectedDevice.id}</Text>
                  <Tag color="success" style={{ fontSize: 11 }}>✓ 校准有效至 2026-12-31</Tag>
                </Space>
              )}
            </Space>
          </Card>

          {/* 数据输入行 */}
          <Card size="small"
            title={
              <Space>
                <Text strong style={{ fontSize: 12 }}>录入抽检数据</Text>
                <Tag color="processing" style={{ fontSize: 11 }}>已录 {records.length}/{config.minRecords} 条</Tag>
              </Space>
            }
            style={{ borderRadius: 8 }}
          >
            <Space direction="vertical" style={{ width: '100%' }} size={14}>
              <Row gutter={[12, 12]} align="bottom">
                {config.fields.map(f => (
                  <Col key={f.key} xs={24} sm={f.colSpan ?? 8}>
                    <Space direction="vertical" size={4}>
                      <Text style={{ fontSize: 12 }}>
                        {f.label}
                        {f.required && <Text type="danger" style={{ marginLeft: 2 }}>*</Text>}
                        {f.spec && <Text type="secondary" style={{ fontSize: 10, marginLeft: 4 }}>规格：{f.spec}</Text>}
                      </Text>
                      {f.type === 'number' ? (
                        <PadNumPad
                          value={editRow[f.key] as number | null ?? null}
                          onChange={(v) => setField(f.key, v)}
                          precision={f.precision ?? 3}
                          unit={f.unit}
                          label={f.label}
                          spec={f.spec}
                          min={f.specMin !== undefined ? f.specMin * 0.85 : undefined}
                          max={f.specMax !== undefined ? f.specMax * 1.15 : undefined}
                          width={155}
                          height={52}
                          fontSize={14}
                          validTag={
                            editRow[f.key] !== null && editRow[f.key] !== undefined && f.specMin !== undefined
                              ? (isFieldPass(f, editRow[f.key])
                                ? <Tag color="success" style={{ marginLeft: 4, fontSize: 10 }}>✓</Tag>
                                : <Tag color="error" style={{ marginLeft: 4, fontSize: 10 }}>✗</Tag>)
                              : undefined
                          }
                        />
                      ) : f.type === 'select' ? (
                        <Select size="large" style={{ width: 160 }} placeholder="请选择"
                          value={(editRow[f.key] as string) || undefined}
                          onChange={v => setField(f.key, v)}>
                          {(f.options ?? []).map(opt => (
                            <Option key={opt} value={opt}>
                              <Text style={{ color: (opt.includes('合格') && !opt.includes('不')) || opt.includes('符合') || opt === '合格批' ? '#52c41a' : '#ff4d4f' }}>
                                {opt}
                              </Text>
                            </Option>
                          ))}
                        </Select>
                      ) : (
                        <Input size="large" style={{ width: 160 }}
                          value={(editRow[f.key] as string) || ''}
                          onChange={e => setField(f.key, e.target.value)}
                          placeholder={f.label}
                        />
                      )}
                    </Space>
                  </Col>
                ))}
              </Row>
              <Row gutter={12}>
                <Col>
                  <Button icon={<PlusOutlined />} type="primary" size="large"
                    onClick={handleAddRecord}
                    style={{ height: 52, fontSize: 15, paddingInline: 24 }}>
                    + 添加记录
                  </Button>
                </Col>
                <Col>
                  <Button size="large" onClick={handleMockData} style={{ height: 52 }}>
                    📋 填入示例数据
                  </Button>
                </Col>
              </Row>
            </Space>
          </Card>

          {/* 抽检记录汇总表 */}
          {records.length > 0 && (
            <Table
              dataSource={records}
              columns={tableColumns}
              rowKey="_seq"
              pagination={false}
              size="small"
              scroll={{ x: 'max-content' }}
              rowClassName={r => r._result === 'fail' ? 'table-row-error' : ''}
              summary={() => (
                <Table.Summary fixed>
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={tableColumns.length - 1}>
                      <Text strong>
                        共 {records.length} 条 | 合格 {records.filter(r => r._result === 'pass').length} 条
                        {records.some(r => r._result === 'fail') && (
                          <Text type="danger" style={{ marginLeft: 8 }}>
                            ⚠️ 有 {records.filter(r => r._result === 'fail').length} 条不合格，请处理后再提交
                          </Text>
                        )}
                      </Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1}>
                      {records.some(r => r._result === 'fail')
                        ? <Tag color="error">存在不合格</Tag>
                        : <Tag color="success">全部合格</Tag>}
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                </Table.Summary>
              )}
            />
          )}
        </Space>
      </Card>

      <div style={{ textAlign: 'right' }}>
        <Button type="primary" size="large" disabled={!canSubmit} onClick={handleSubmit}
          style={{ height: 52, fontSize: 17, paddingInline: 36, fontWeight: 700 }}>
          ✅ 完成数据采集
        </Button>
      </div>
    </div>
  );
};

export default DataCollectStage;

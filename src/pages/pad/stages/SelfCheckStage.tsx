import React, { useState } from 'react';
import {
  Button, Card, Space, Typography, Tag, Alert, Row, Col,
  Select, message, Divider, Table, Input
} from 'antd';
import { CheckCircleOutlined, ScanOutlined, FileTextOutlined, PlusOutlined } from '@ant-design/icons';
import type { StageExecution } from '../padExecutionData';
import PadNumPad from '../components/PadNumPad';
import PadCamera, { CapturedPhoto } from '../components/PadCamera';

const { Text } = Typography;
const { Option } = Select;

interface SelfCheckStageProps {
  opCode: string;
  opName: string;
  content?: string;
  inspectionRecordName?: string;
  hasQcInspection?: boolean;
  execution: StageExecution;
  onComplete: (data: Record<string, unknown>) => void;
}

interface InspectionRow {
  key: number;
  seq: number;
  d1?: number;
  d2?: number;
  taper?: number;
  appearance: string;
  result: 'pass' | 'fail';
}

const INSPECT_ITEMS_BY_OP: Record<string, Array<{
  key: string; label: string; spec?: string; type: 'measurement' | 'visual' | 'enum';
}>> = {
  // ══════════ 天美健保健品GMP自检项目 ══════════

  // 包衣：增重率 + 外观（每小时10片抽查）
  'OP-GMP-COATING': [
    { key: 'weight_gain', label: '片重增重率（与片芯对比）', spec: '2.0~4.0%', type: 'measurement' },
    { key: 'appearance', label: '外观检查（颜色均匀/无粘连/无裂片，10片目视）', type: 'visual' },
    { key: 'coating_uniform', label: '包衣液雾化均匀性', type: 'enum' },
  ],
  // 内包装：装量 + 密封 + 标签
  'OP-GMP-INNERPACK': [
    { key: 'fill_weight', label: '分装量（净重复核）', spec: '标示装量±5%', type: 'measurement' },
    { key: 'seal_check', label: '密封完整性（无开裂/无漏气）', type: 'visual' },
    { key: 'label_check', label: '标签信息（批号/有效期/条码）', type: 'visual' },
    { key: 'qty_check', label: '数量核对（实物与工单一致）', type: 'enum' },
  ],
  // 外包装：标签/批号/数量
  'OP-GMP-OUTERPACK': [
    { key: 'box_label', label: '彩盒批号打印正确（与批包装指令一致）', type: 'visual' },
    { key: 'insert_check', label: '说明书版本（与注册版本一致）', type: 'visual' },
    { key: 'seal_tape', label: '封口完整（热熔胶/封箱胶带）', type: 'visual' },
    { key: 'qty_check', label: '装盒数量/装箱数量核对', type: 'enum' },
  ],
  // 益生菌胶囊充填：装量 + 密封
  'OP-PROBIO-FILL': [
    { key: 'fill_weight', label: '胶囊装量（抽检10粒平均值）', spec: '400mg±7.5%', type: 'measurement' },
    { key: 'cap_seal', label: '胶囊密封（无漏粉/无裂壳）', type: 'visual' },
    { key: 'cap_appearance', label: '胶囊外观（无变形/颜色均一）', type: 'visual' },
  ],
  // 称量配料：物料平衡
  'OP-GMP-WEIGH': [
    { key: 'balance_check', label: '物料平衡（实称量/处方量，误差≤0.1%）', spec: '±0.1%', type: 'measurement' },
    { key: 'label_verify', label: '物料标签核对（名称/批号/有效期）', type: 'visual' },
    { key: 'env_check', label: '环境条件（温度18~26℃，湿度45~65%）', type: 'enum' },
  ],
  // 混合：均匀性
  'OP-GMP-MIX': [
    { key: 'mix_time', label: '混合时间记录（≥20min）', spec: '≥20min', type: 'measurement' },
    { key: 'mix_uniform', label: '混合均匀性目视（无分层/色差）', type: 'visual' },
    { key: 'rsd_check', label: 'RSD检验结果（≤5%）', type: 'enum' },
  ],
  // 通用 GMP 默认自检项
  default: [
    { key: 'weight_check', label: '重量/装量复核（与处方指令一致）', spec: '±5%', type: 'measurement' },
    { key: 'appearance', label: '外观（颜色/形态/密封/标签，目视合格）', type: 'visual' },
    { key: 'qty_check', label: '数量核对（实物与工单一致）', type: 'enum' },
  ],
};

const PASS_VALUES = ['pass', '合格', '一致', '正常', '可读'];

const SelfCheckStage: React.FC<SelfCheckStageProps> = ({
  opCode, opName, content, inspectionRecordName, hasQcInspection, execution, onComplete
}) => {
  const inspectItems = INSPECT_ITEMS_BY_OP[opCode] || INSPECT_ITEMS_BY_OP.default;
  // 需要显示抽检明细表的工序（有连续测量数据采集需求）— GMP工序用重量复核
  const isGrindOrWash = ['OP-GMP-COATING', 'OP-GMP-INNERPACK', 'OP-PROBIO-FILL'].includes(opCode);

  const [itemResults, setItemResults] = useState<Record<string, string>>(
    Object.fromEntries(inspectItems.map(i => [i.key, '']))
  );
  // measurement type: store numeric value separately, result = pass/fail
  const [itemValues, setItemValues] = useState<Record<string, number | null>>(
    Object.fromEntries(inspectItems.filter(i => i.type === 'measurement').map(i => [i.key, null]))
  );
  const [device, setDevice] = useState('');
  const [deviceScanned, setDeviceScanned] = useState(false);
  const [qcInspector, setQcInspector] = useState('');
  const [inspectRows, setInspectRows] = useState<InspectionRow[]>([]);
  const [editD1, setEditD1] = useState<number | null>(null);
  const [editD2, setEditD2] = useState<number | null>(null);
  const [editAppear, setEditAppear] = useState<'pass' | 'fail'>('pass');
  const [overallResult, setOverallResult] = useState<'' | 'pass' | 'fail'>('');
  const [recordNote, setRecordNote] = useState('');
  const [photos, setPhotos] = useState<CapturedPhoto[]>([]);

  const recordNo = React.useMemo(() => {
    const d = new Date();
    return `JY-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}-${String(Math.floor(Math.random()*999)+1).padStart(3,'0')}`;
  }, []);

  const isCompleted = execution.status === 'completed';

  const allItemsDone = inspectItems.every(i => itemResults[i.key] !== '');
  const canSubmit = allItemsDone && deviceScanned && overallResult !== ''
    && (isGrindOrWash ? inspectRows.length >= 1 : true)
    && photos.length >= 1;

  const handleItemResult = (key: string, val: string) => {
    setItemResults(prev => {
      const updated = { ...prev, [key]: val };
      const allDone = Object.values(updated).every(v => v !== '');
      if (allDone) {
        const allPass = Object.values(updated).every(v => PASS_VALUES.includes(v));
        setOverallResult(allPass ? 'pass' : 'fail');
      }
      return updated;
    });
  };

  const handleMeasureChange = (key: string, v: number | null, spec?: string) => {
    setItemValues(prev => ({ ...prev, [key]: v }));
    if (v === null) {
      handleItemResult(key, '');
      return;
    }
    // Simple pass logic: if spec contains "0.250±0.005" → [0.245, 0.255]
    let isPass = true;
    if (spec) {
      const match = spec.match(/([\d.]+)±([\d.]+)/);
      if (match) {
        const center = parseFloat(match[1]);
        const tol = parseFloat(match[2]);
        isPass = v >= center - tol && v <= center + tol;
      }
    }
    handleItemResult(key, isPass ? 'pass' : 'fail');
  };

  const handleDeviceScan = () => {
    const deviceMap: Record<string, string> = {
      // GMP 保健品工序检验设备
      'OP-GMP-WEIGH':      'TMJ-BAL-001 电子天平（量程60kg，校准有效至2026-12-31）',
      'OP-GMP-MIX':        'TMJ-BAL-001 电子天平 + 均匀性取样管',
      'OP-GMP-GRANULATE':  'TMJ-SFB-001 沸腾干燥机 + TMJ-MS-001 水分测定仪',
      'OP-GMP-COATING':    'TMJ-BAL-002 精密天平（校准有效至2026-12-31）',
      'OP-GMP-INNERPACK':  'TMJ-BAL-002 精密天平 + 气密性检测仪',
      'OP-GMP-OUTERPACK':  'TMJ-SG-001 条码扫码枪 + 目视',
      'OP-PROBIO-FILL':    'TMJ-BAL-003 十万分之一天平（校准有效至2026-09-30）',
      default: 'TMJ-QC-001 综合检验台（校准有效至2026-12-31）',
    };
    const devName = deviceMap[opCode] || deviceMap.default;
    setDevice(devName);
    setDeviceScanned(true);
    message.success(`检测设备 ${devName} 绑定成功，校准状态：有效`);
  };

  const handleAddRow = () => {
    if (editD1 === null) { message.warning('请输入检测值数据'); return; }
    // 根据工序设置合格范围
    const specMap: Record<string, { min: number; max: number }> = {
      'OP-10-GRIND': { min: 0.245, max: 0.255 },
      'OP-30-TAIL': { min: 24.5, max: 25.5 },
      'OP-50-GRIND1': { min: 0.245, max: 0.255 },
      'OP-70-WASH2': { min: 0.245, max: 0.255 },
    };
    const spec = specMap[opCode] || { min: 0.245, max: 0.255 };
    const isPass = (editD1 >= spec.min && editD1 <= spec.max) && editAppear === 'pass';
    const row: InspectionRow = {
      key: inspectRows.length + 1,
      seq: inspectRows.length + 1,
      d1: editD1,
      d2: editD2 ?? undefined,
      appearance: editAppear,
      result: isPass ? 'pass' : 'fail',
    };
    setInspectRows(prev => [...prev, row]);
    setEditD1(null); setEditD2(null);
    message.success(`第 ${row.seq} 条检验记录已添加`);
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    onComplete({
      sc_items: itemResults,
      sc_values: itemValues,
      sc_rows: inspectRows,
      sc_device: device,
      sc_record_no: recordNo,
      sc_qc_inspector: qcInspector || '张三(1001)',
      sc_overall: overallResult,
      sc_note: recordNote,
      sc_photos: photos.length,
      sc_photo_list: photos.map(p => p.timestamp),
      sc_operator: '张三(1001)',
    });
  };

  if (isCompleted) {
    return (
      <Card style={{ background: '#f6ffed', border: '2px solid #b7eb8f', borderRadius: 10 }}>
        <Space direction="vertical" style={{ width: '100%' }} size={4}>
          <Space>
            <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 20 }} />
            <Text strong style={{ color: '#52c41a', fontSize: 14 }}>自检已完成</Text>
            <Tag color="geekblue">{inspectionRecordName || '过程检验记录'}</Tag>
          </Space>
          <Text type="secondary" style={{ fontSize: 12 }}>检验单号：{execution.data?.sc_record_no as string}</Text>
        </Space>
      </Card>
    );
  }

  // 根据工序动态配置抽检明细列（GMP保健品）
  const rowColsConfig: Record<string, Array<{ title: string; dataIndex: string; spec?: { min: number; max: number }; render?: (v: number) => React.ReactNode }>> = {
    'OP-GMP-COATING': [
      { title: '片重增重率(%)', dataIndex: 'd1', spec: { min: 2.0, max: 4.0 } },
    ],
    'OP-GMP-INNERPACK': [
      { title: '净重(g)', dataIndex: 'd1', spec: { min: 28.5, max: 31.5 } },
    ],
    'OP-PROBIO-FILL': [
      { title: '胶囊装量(mg)', dataIndex: 'd1', spec: { min: 370, max: 430 } },
    ],
  };
  const dynCols = rowColsConfig[opCode] || [{ title: '检测值', dataIndex: 'd1' }];

  const rowColumns = [
    { title: '序号', dataIndex: 'seq', width: 55 },
    ...dynCols.map(c => ({
      title: c.title, dataIndex: c.dataIndex,
      render: (v: number) => {
        if (!v) return <Text type="secondary">—</Text>;
        if (c.spec) {
          const ok = v >= c.spec.min && v <= c.spec.max;
          return <Text style={{ color: ok ? '#52c41a' : '#ff4d4f', fontWeight: 600 }}>{v.toFixed(3)}</Text>;
        }
        return <Text>{v.toFixed(3)}</Text>;
      },
    })),
    { title: '外观', dataIndex: 'appearance', render: (v: string) => v === 'pass' ? <Tag color="success">合格</Tag> : <Tag color="error">不合格</Tag> },
    { title: '结果', dataIndex: 'result', render: (v: string) => v === 'pass' ? <Tag color="success">✓合格</Tag> : <Tag color="error">✗不合格</Tag> },
  ];

  return (
    <div>
      <Card
        title={
          <Space>
            <FileTextOutlined style={{ color: '#eb2f96' }} />
            <span>自检（过程检验）</span>
            {inspectionRecordName && <Tag color="magenta">{inspectionRecordName}</Tag>}
          </Space>
        }
        style={{ marginBottom: 14, borderRadius: 10 }}
      >
        <Space direction="vertical" style={{ width: '100%' }} size={14}>
          {content && <Alert message={content} type="info" showIcon style={{ fontSize: 12 }} />}

          {hasQcInspection && isGrindOrWash && (
            <Alert type="warning" showIcon
              message={
                <Space direction="vertical" size={3}>
                  <Text strong style={{ fontSize: 13 }}>⚠️ 现场 QC 检验流程（先报工后检验）：</Text>
                  <Text style={{ fontSize: 12 }}>① 操作员先在【报工】阶段填写完工数量（合格数量留空）</Text>
                  <Text style={{ fontSize: 12 }}>② QA 现场完成检验后，回写合格数量至报工单</Text>
                  <Text style={{ fontSize: 12 }}>③ 本检验记录自动生成独立《{inspectionRecordName}》单据</Text>
                </Space>
              }
            />
          )}

          {/* 检测设备绑定 */}
          <Card size="small" title={<Text strong style={{ fontSize: 12 }}>关联检测设备</Text>} style={{ borderRadius: 8 }}>
            <Space size={10} wrap>
              <Input size="large" style={{ width: 280, fontFamily: 'monospace', fontSize: 13 }}
                placeholder="扫码绑定检测设备" value={device}
                onChange={e => setDevice(e.target.value)} prefix={<ScanOutlined />} />
              <Button icon={<ScanOutlined />} size="large" onClick={handleDeviceScan} style={{ height: 44 }}>
                扫码绑定
              </Button>
              {deviceScanned && <Tag color="success" style={{ fontSize: 12 }}>✓ 校准有效 | {device}</Tag>}
            </Space>
          </Card>

          {/* 检验项 */}
          <Card size="small" title={<Text strong style={{ fontSize: 12 }}>检验项（点击数值框弹出键盘）</Text>} style={{ borderRadius: 8 }}>
            <Space direction="vertical" style={{ width: '100%' }} size={12}>
              {inspectItems.map(item => (
                <Row key={item.key} gutter={[16, 8]} align="middle">
                  <Col xs={24} sm={6}>
                    <Text strong style={{ fontSize: 13 }}>{item.label}</Text>
                    {item.spec && <div><Text type="secondary" style={{ fontSize: 11 }}>规格：{item.spec}</Text></div>}
                  </Col>
                  <Col xs={24} sm={12}>
                    {item.type === 'measurement' ? (
                      <Space wrap>
                        {/* 触屏数字键盘 */}
                        <PadNumPad
                          value={itemValues[item.key] ?? null}
                          onChange={v => handleMeasureChange(item.key, v, item.spec)}
                          precision={3}
                          unit="mm"
                          label={item.label}
                          spec={item.spec}
                          width={160}
                          height={48}
                          fontSize={15}
                        />
                        <Select size="large" style={{ width: 120 }} placeholder="判定"
                          value={itemResults[item.key] || undefined}
                          onChange={v => handleItemResult(item.key, v)}>
                          <Option value="pass"><Text style={{ color: '#52c41a' }}>✓ 合格</Text></Option>
                          <Option value="fail"><Text style={{ color: '#ff4d4f' }}>✗ 不合格</Text></Option>
                        </Select>
                      </Space>
                    ) : item.type === 'visual' ? (
                      <Select size="large" style={{ width: 160 }} placeholder="目视判定"
                        value={itemResults[item.key] || undefined}
                        onChange={v => handleItemResult(item.key, v)}>
                        <Option value="pass"><Text style={{ color: '#52c41a' }}>✓ 合格</Text></Option>
                        <Option value="fail"><Text style={{ color: '#ff4d4f' }}>✗ 不合格</Text></Option>
                      </Select>
                    ) : (
                      <Select size="large" style={{ width: 190 }} placeholder="选择结果"
                        value={itemResults[item.key] || undefined}
                        onChange={v => handleItemResult(item.key, v)}>
                        <Option value="合格"><Text style={{ color: '#52c41a' }}>✓ 合格</Text></Option>
                        <Option value="不合格"><Text style={{ color: '#ff4d4f' }}>✗ 不合格</Text></Option>
                        <Option value="一致"><Text style={{ color: '#52c41a' }}>✓ 一致</Text></Option>
                        <Option value="不一致"><Text style={{ color: '#ff4d4f' }}>✗ 不一致</Text></Option>
                        <Option value="可读"><Text style={{ color: '#52c41a' }}>✓ 可读</Text></Option>
                        <Option value="不可读"><Text style={{ color: '#ff4d4f' }}>✗ 不可读</Text></Option>
                      </Select>
                    )}
                  </Col>
                  <Col xs={24} sm={6}>
                    {itemResults[item.key] && (
                      <Tag color={PASS_VALUES.includes(itemResults[item.key]) ? 'success' : 'error'} style={{ fontSize: 12 }}>
                        {PASS_VALUES.includes(itemResults[item.key]) ? '✓ 通过' : '✗ 不通过'}
                      </Tag>
                    )}
                  </Col>
                </Row>
              ))}
            </Space>
          </Card>

          {/* 抽检记录表 — 触屏键盘录入 */}
          {isGrindOrWash && (() => {
            const isTail = opCode === 'OP-30-TAIL';
            const d1Label = isTail ? '总长' : '外径 D1';
            const d1Spec = isTail ? '24.5 ~ 25.5 mm' : '0.245 ~ 0.255 mm';
            const d1Min = isTail ? 20 : 0.200;
            const d1Max = isTail ? 30 : 0.300;
            const d1Valid = isTail
              ? (editD1 !== null && editD1 >= 24.5 && editD1 <= 25.5)
              : (editD1 !== null && editD1 >= 0.245 && editD1 <= 0.255);
            return (
            <Card size="small" title={<Text strong style={{ fontSize: 12 }}>抽检记录表（至少1条）</Text>} style={{ borderRadius: 8 }}>
              <Space direction="vertical" style={{ width: '100%' }} size={12}>
                <Row gutter={[16, 12]} align="middle">
                  <Col xs={24} sm={6}>
                    <Space direction="vertical" size={4}>
                      <Text style={{ fontSize: 12 }}>{d1Label}</Text>
                      <PadNumPad
                        value={editD1}
                        onChange={setEditD1}
                        precision={3}
                        unit="mm"
                        label={d1Label}
                        spec={d1Spec}
                        min={d1Min}
                        max={d1Max}
                        width={150}
                        height={52}
                        fontSize={15}
                        validTag={
                          editD1 !== null
                            ? (d1Valid
                              ? <Tag color="success" style={{ marginLeft: 4 }}>✓</Tag>
                              : <Tag color="error" style={{ marginLeft: 4 }}>✗</Tag>)
                            : undefined
                        }
                      />
                    </Space>
                  </Col>
                  {!isTail && (
                  <Col xs={24} sm={6}>
                    <Space direction="vertical" size={4}>
                      <Text style={{ fontSize: 12 }}>外径 D2</Text>
                      <PadNumPad
                        value={editD2}
                        onChange={setEditD2}
                        precision={3}
                        unit="mm"
                        label="外径 D2"
                        spec="按规格书"
                        width={150}
                        height={52}
                        fontSize={15}
                      />
                    </Space>
                  </Col>
                  )}
                  <Col xs={24} sm={5}>
                    <Space direction="vertical" size={4}>
                      <Text style={{ fontSize: 12 }}>外观</Text>
                      <Select size="large" style={{ width: 130 }} value={editAppear}
                        onChange={v => setEditAppear(v as 'pass' | 'fail')}>
                        <Option value="pass">✓ 合格</Option>
                        <Option value="fail">✗ 不合格</Option>
                      </Select>
                    </Space>
                  </Col>
                  <Col xs={24} sm={7}>
                    <Space direction="vertical" size={4}>
                      <Text style={{ fontSize: 12 }}>&nbsp;</Text>
                      <Space>
                        <Button icon={<PlusOutlined />} type="primary" size="large"
                          onClick={handleAddRow} style={{ height: 52, fontSize: 14 }}>
                          添加
                        </Button>
                        <Button size="large" style={{ height: 52 }} onClick={() => {
                          // 根据工序填入不同的模拟数据
                          if (isTail) {
                            setInspectRows([
                              { key: 1, seq: 1, d1: 25.0, appearance: 'pass', result: 'pass' },
                              { key: 2, seq: 2, d1: 25.1, appearance: 'pass', result: 'pass' },
                            ]);
                          } else {
                            setInspectRows([
                              { key: 1, seq: 1, d1: 0.251, d2: 0.297, appearance: 'pass', result: 'pass' },
                              { key: 2, seq: 2, d1: 0.252, d2: 0.298, appearance: 'pass', result: 'pass' },
                            ]);
                          }
                          message.success('已填入2条模拟记录');
                        }}>示例</Button>
                      </Space>
                    </Space>
                  </Col>
                </Row>

                {inspectRows.length > 0 && (
                  <Table dataSource={inspectRows} columns={rowColumns} pagination={false} size="small"
                    summary={() => (
                      <Table.Summary.Row>
                        <Table.Summary.Cell index={0} colSpan={rowColumns.length - 1}>
                          <Text strong>合计 {inspectRows.length} 条 | 合格 {inspectRows.filter(r => r.result === 'pass').length} 条</Text>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={1}>
                          {inspectRows.some(r => r.result === 'fail')
                            ? <Tag color="error">有不合格</Tag>
                            : <Tag color="success">全部合格</Tag>}
                        </Table.Summary.Cell>
                      </Table.Summary.Row>
                    )}
                  />
                )}
              </Space>
            </Card>
            );
          })()}

          {/* QC检验员 */}
          {hasQcInspection && (
            <Card size="small" title={<Text strong style={{ fontSize: 12 }}>QC 检验员</Text>} style={{ borderRadius: 8 }}>
              <Space>
                <Input size="large" style={{ width: 220 }} placeholder="QC检验员工号/工牌扫码"
                  value={qcInspector} onChange={e => setQcInspector(e.target.value)} prefix={<ScanOutlined />} />
                <Button size="large" onClick={() => { setQcInspector('陈小燕 QC(1005)'); message.success('QC检验员工牌识别成功'); }}>
                  扫码
                </Button>
                {qcInspector && <Tag color="success">✓ {qcInspector}</Tag>}
              </Space>
            </Card>
          )}

          {/* 检验拍照留证 */}
          <Card size="small" title={<Text strong style={{ fontSize: 12 }}>检验拍照留证（至少1张）</Text>} style={{ borderRadius: 8 }}>
            <PadCamera
              photos={photos}
              onChange={setPhotos}
              minCount={1}
              maxCount={6}
              label="检验拍照"
            />
          </Card>

          <Divider style={{ margin: '6px 0' }} />

          {/* 整体结论 */}
          <Row gutter={16} align="middle">
            <Col span={10}>
              <Space>
                <Text strong style={{ fontSize: 14 }}>整体判定：</Text>
                <Select size="large" style={{ width: 140 }} placeholder="选择结论"
                  value={overallResult || undefined}
                  onChange={v => setOverallResult(v as 'pass' | 'fail')}>
                  <Option value="pass"><Text style={{ color: '#52c41a' }}>✓ 合格</Text></Option>
                  <Option value="fail"><Text style={{ color: '#ff4d4f' }}>✗ 不合格</Text></Option>
                </Select>
              </Space>
            </Col>
            <Col span={14}>
              <Space>
                <Text strong style={{ fontSize: 13 }}>检验单号：</Text>
                <Text code style={{ fontSize: 13 }}>{recordNo}</Text>
                <Tag color="geekblue" style={{ fontSize: 11 }}>{inspectionRecordName || '过程检验记录'}</Tag>
              </Space>
            </Col>
          </Row>

          <Input placeholder="检验备注（可选）" value={recordNote}
            onChange={e => setRecordNote(e.target.value)} size="large" style={{ fontSize: 13 }} />

          {overallResult === 'fail' && (
            <Alert message="⚠️ 检验不合格！将触发异常流程，请联系 QA 处理，产品不可流转至下工序。"
              type="error" showIcon />
          )}
        </Space>
      </Card>

      <div style={{ textAlign: 'right' }}>
        <Space>
          <Button size="large" icon={<FileTextOutlined />}
            onClick={() => message.info('检验单预览（实际项目中弹出检验记录详情页）')}
            style={{ height: 48 }}>
            预览检验单
          </Button>
          <Button type="primary" size="large" disabled={!canSubmit} onClick={handleSubmit}
            style={{ height: 52, fontSize: 16, paddingInline: 32, fontWeight: 700 }}>
            ✅ 提交自检
          </Button>
        </Space>
      </div>
    </div>
  );
};

export default SelfCheckStage;

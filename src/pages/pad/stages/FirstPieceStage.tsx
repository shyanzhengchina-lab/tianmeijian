import React, { useState } from 'react';
import { Button, Card, Space, Typography, Tag, Alert, Row, Col, Select, message } from 'antd';
import { ScanOutlined, CheckCircleOutlined, EditOutlined, ExperimentOutlined } from '@ant-design/icons';
import type { StageExecution } from '../padExecutionData';
import PadNumPad from '../components/PadNumPad';
import PadCamera, { CapturedPhoto } from '../components/PadCamera';

const { Text } = Typography;
const { Option } = Select;

interface FpMeasField {
  key: string;
  label: string;
  spec: string;
  unit: string;
  precision: number;
  min?: number;
  max?: number;
  specMin?: number;
  specMax?: number;
  required?: boolean;
}

interface FpConfig {
  title: string;
  deviceName: string;
  deviceId: string;
  deviceCalibration: string;
  measures: FpMeasField[];
}

// 按工序定义首件检验量测项
const FP_CONFIG_BY_OP: Record<string, FpConfig> = {
  // ══════════ 天美健保健品GMP工序（SOR-MF-PE-02-05）══════════

  // 包衣首件：增重率 + 外观
  'OP-GMP-COATING': {
    title: '包衣首件检验',
    deviceName: '精密分析天平-PHD-0001',
    deviceId: 'PHD-0001',
    deviceCalibration: '2026-12-31',
    measures: [
      { key: 'weight_gain', label: '片重增重率（首次包衣15min后）', spec: '0.5 ~ 1.0 %', unit: '%', precision: 2, min: 0, max: 5, specMin: 0.5, specMax: 1.0, required: true },
      { key: 'core_weight', label: '片芯平均重量', spec: '按批包装指令 ±5%', unit: 'mg', precision: 1, min: 400, max: 600, specMin: 475, specMax: 525, required: true },
      { key: 'coating_weight', label: '包衣片平均重量', spec: '片芯+包衣≤片芯×1.04', unit: 'mg', precision: 1, min: 400, max: 620, specMin: 477.5, specMax: 546, required: true },
      { key: 'appearance', label: '外观检查（颜色/粘连/裂片，10片抽查）', spec: '无粘连、无裂片、色泽均匀', unit: '', precision: 0, required: true },
    ],
  },

  // 内包装首件：装量 + 密封
  'OP-GMP-INNERPACK': {
    title: '内包装首件检验（首瓶装量复核）',
    deviceName: '精密分析天平-PHD-0002',
    deviceId: 'PHD-0002',
    deviceCalibration: '2026-12-31',
    measures: [
      { key: 'fill_weight', label: '首瓶净重（60片）', spec: '按标准装量 ±5%', unit: 'g', precision: 2, min: 25, max: 35, specMin: 28.5, specMax: 31.5, required: true },
      { key: 'seal_check', label: '密封完整性检查（目视/气密性）', spec: '无开裂、无漏气', unit: '', precision: 0, required: true },
      { key: 'label_position', label: '标签位置（对中偏差）', spec: '≤2mm', unit: 'mm', precision: 1, min: 0, max: 5, specMin: 0, specMax: 2, required: true },
    ],
  },

  // 益生菌充填首件：装量 + 外观
  'OP-PROBIO-FILL': {
    title: '胶囊充填首件检验',
    deviceName: '十万分之一天平-PHD-0003',
    deviceId: 'PHD-0003',
    deviceCalibration: '2026-09-30',
    measures: [
      { key: 'cap_fill_wt', label: '胶囊平均装量', spec: '400mg ±7.5%（370~430mg）', unit: 'mg', precision: 1, min: 300, max: 500, specMin: 370, specMax: 430, required: true },
      { key: 'cap_length', label: '胶囊总长（锁紧后）', spec: '21.0 ± 0.5mm（0#）', unit: 'mm', precision: 1, min: 19, max: 23, specMin: 20.5, specMax: 21.5, required: true },
      { key: 'cap_appearance', label: '胶囊外观（目视10粒）', spec: '无裂壳/无变形/密封完好', unit: '', precision: 0, required: true },
    ],
  },
};

// 通用首件检验默认配置（GMP保健品）
const FP_CONFIG_DEFAULT: FpConfig = {
  title: '首件检验（GMP）',
  deviceName: '精密分析天平-PHD-0001',
  deviceId: 'PHD-0001',
  deviceCalibration: '2026-12-31',
  measures: [
    { key: 'weight', label: '产品重量/装量', spec: '按批包装指令 ±5%', unit: 'mg', precision: 1, min: 100, max: 1000, required: true },
    { key: 'appearance', label: '外观检查（颜色/形态/密封）', spec: '符合产品标准', unit: '', precision: 0, required: true },
    { key: 'label_check', label: '标签/批号核对', spec: '与批包装指令一致', unit: '', precision: 0, required: true },
  ],
};

interface FirstPieceStageProps {
  opCode?: string;
  content?: string;
  execution: StageExecution;
  onComplete: (data: Record<string, unknown>) => void;
  onESign: (cb: () => void) => void;
}

const FirstPieceStage: React.FC<FirstPieceStageProps> = ({ opCode = '', content, execution, onComplete, onESign }) => {
  const config = FP_CONFIG_BY_OP[opCode] || FP_CONFIG_DEFAULT;

  const [device, setDevice] = useState('');
  const [deviceScanned, setDeviceScanned] = useState(false);
  const [measValues, setMeasValues] = useState<Record<string, number | null>>(
    Object.fromEntries(config.measures.map(m => [m.key, null]))
  );
  const [photos, setPhotos] = useState<CapturedPhoto[]>([]);
  const [result, setResult] = useState<'' | 'pass' | 'fail'>('');
  const [inspector, setInspector] = useState('');
  const [checker, setChecker] = useState('');
  const [signed, setSigned] = useState(false);
  const isCompleted = execution.status === 'completed';

  const isFieldValid = (field: FpMeasField, val: number | null) => {
    if (val === null) return null;
    if (field.specMin !== undefined && field.specMax !== undefined) {
      return val >= field.specMin && val <= field.specMax;
    }
    if (field.specMin !== undefined) return val >= field.specMin;
    return true; // no spec range
  };

  const allRequiredFilled = config.measures
    .filter(m => m.required !== false)
    .every(m => measValues[m.key] !== null && measValues[m.key] !== undefined);

  const allRequiredPass = config.measures
    .filter(m => m.required !== false && m.specMin !== undefined)
    .every(m => {
      const v = measValues[m.key];
      return v !== null && isFieldValid(m, v) === true;
    });

  const canSubmit =
    deviceScanned &&
    allRequiredFilled &&
    photos.length >= 1 &&
    result === 'pass' &&
    inspector &&
    checker &&
    inspector !== checker &&
    signed;

  const handleDeviceScan = () => {
    setDevice(config.deviceName);
    setDeviceScanned(true);
    message.success(`量具 ${config.deviceName} 识别成功，校准有效期：${config.deviceCalibration} ✓`);
  };

  const handleSign = () => {
    onESign(() => {
      setSigned(true);
      message.success('复核员电子签名完成');
    });
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    onComplete({
      fp_op: opCode,
      fp_device: device,
      fp_device_id: config.deviceId,
      fp_measures: measValues,
      fp_photo: photos.length,
      fp_photos: photos.map(p => p.timestamp),
      fp_result: result,
      fp_inspector: inspector,
      fp_checker: checker,
    });
  };

  if (isCompleted) {
    return (
      <Card style={{ background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 10 }}>
        <Space>
          <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 20 }} />
          <Text strong style={{ color: '#52c41a' }}>首件确认已完成</Text>
        </Space>
      </Card>
    );
  }

  return (
    <div>
      <Card
        title={
          <Space>
            <ExperimentOutlined style={{ color: '#722ed1' }} />
            <span>{config.title}</span>
            {content && (
              <Tag color="purple" style={{ fontWeight: 'normal', fontSize: 12 }}>
                {content}
              </Tag>
            )}
          </Space>
        }
        style={{ marginBottom: 16, borderRadius: 10 }}
      >
        <Space direction="vertical" style={{ width: '100%' }} size={16}>
          <Alert
            message={`首件检验内容：${content || '请按规范进行首件检验，确认参数合格后方可批量生产'}`}
            type="info"
            showIcon
          />

          {/* 量具绑定 */}
          <Card size="small" title="量具 / 检测设备绑定" style={{ borderRadius: 8 }}>
            <Space size={12} wrap>
              <Tag
                style={{
                  fontSize: 14,
                  padding: '4px 12px',
                  background: '#f0f5ff',
                  border: '1px solid #adc6ff',
                  fontFamily: 'monospace',
                }}
              >
                {device || config.deviceName}
              </Tag>
              <Button
                type="primary"
                size="large"
                icon={<ScanOutlined />}
                onClick={handleDeviceScan}
                style={{ height: 46 }}
              >
                扫码绑定量具
              </Button>
              {deviceScanned && (
                <Tag color="success">
                  ✓ {config.deviceName} | 校准有效至 {config.deviceCalibration}
                </Tag>
              )}
            </Space>
          </Card>

          {/* 检验数据 */}
          <Card
            size="small"
            title="首件检验数据（点击数值区域弹出键盘）"
            style={{ borderRadius: 8 }}
          >
            <Space direction="vertical" style={{ width: '100%' }} size={14}>
              {config.measures.map(field => {
                const val = measValues[field.key];
                const valid = isFieldValid(field, val);
                // For non-numeric fields (spec like "目视合格"), show a select
                const isVisual = field.spec === '目视合格' || field.precision === 0;
                return (
                  <Row key={field.key} gutter={[16, 8]} align="middle">
                    <Col span={6}>
                      <Text strong style={{ fontSize: 14 }}>
                        {field.label}
                        {field.required !== false && (
                          <Text type="danger" style={{ marginLeft: 2 }}>
                            *
                          </Text>
                        )}
                      </Text>
                    </Col>
                    <Col span={9}>
                      {isVisual ? (
                        <Select
                          size="large"
                          style={{ width: 160 }}
                          placeholder="选择结果"
                          value={val !== null ? (val === 1 ? '合格' : '不合格') : undefined}
                          onChange={v => setMeasValues(p => ({ ...p, [field.key]: v === '合格' ? 1 : 0 }))}
                        >
                          <Option value="合格">
                            <Text style={{ color: '#52c41a' }}>✓ 合格</Text>
                          </Option>
                          <Option value="不合格">
                            <Text style={{ color: '#ff4d4f' }}>✗ 不合格</Text>
                          </Option>
                        </Select>
                      ) : (
                        <PadNumPad
                          value={val}
                          onChange={v => setMeasValues(p => ({ ...p, [field.key]: v }))}
                          precision={field.precision}
                          unit={field.unit}
                          label={field.label}
                          spec={field.spec}
                          min={field.min}
                          max={field.max}
                          width={180}
                          height={56}
                          fontSize={16}
                        />
                      )}
                    </Col>
                    <Col span={5}>
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        规格：{field.spec}
                      </Text>
                    </Col>
                    <Col span={4}>
                      {val !== null &&
                        (isVisual ? (
                          val === 1 ? (
                            <Tag color="success" style={{ fontSize: 13 }}>✓ 合格</Tag>
                          ) : (
                            <Tag color="error" style={{ fontSize: 13 }}>✗ 不合格</Tag>
                          )
                        ) : valid === true ? (
                          <Tag color="success" style={{ fontSize: 13 }}>✓ 合格</Tag>
                        ) : valid === false ? (
                          <Tag color="error" style={{ fontSize: 13 }}>✗ 超差</Tag>
                        ) : (
                          <Tag color="processing" style={{ fontSize: 13 }}>已录入</Tag>
                        ))}
                    </Col>
                  </Row>
                );
              })}
            </Space>
          </Card>

          {/* 首件照片 */}
          <Card size="small" title="首件照片（至少1张）" style={{ borderRadius: 8 }}>
            <PadCamera
              photos={photos}
              onChange={setPhotos}
              minCount={1}
              maxCount={5}
              label="📷 拍照上传"
            />
          </Card>

          {/* 首件判定 + 双签 */}
          <Card size="small" title="首件判定" style={{ borderRadius: 8 }}>
            <Row gutter={[24, 12]} align="middle">
              <Col xs={24} sm={8}>
                <Space>
                  <Text strong style={{ fontSize: 15 }}>
                    判定结果：
                  </Text>
                  <Select
                    size="large"
                    style={{ width: 140 }}
                    placeholder="选择"
                    value={result || undefined}
                    onChange={v => setResult(v as 'pass' | 'fail')}
                  >
                    <Option value="pass">
                      <Text style={{ color: '#52c41a' }}>✓ 合格</Text>
                    </Option>
                    <Option value="fail">
                      <Text style={{ color: '#ff4d4f' }}>✗ 不合格</Text>
                    </Option>
                  </Select>
                </Space>
              </Col>
              <Col xs={24} sm={8}>
                <Space>
                  <Text strong>检验员：</Text>
                  <Select
                    size="large"
                    style={{ width: 150 }}
                    placeholder="工牌扫码"
                    value={inspector || undefined}
                    onChange={v => setInspector(v)}
                  >
                    <Option value="张三(1001)">张三(1001)</Option>
                    <Option value="王五(1003)">王五(1003)</Option>
                  </Select>
                </Space>
              </Col>
              <Col xs={24} sm={8}>
                <Space>
                  <Text strong>复核员：</Text>
                  <Select
                    size="large"
                    style={{ width: 150 }}
                    placeholder="工牌扫码"
                    value={checker || undefined}
                    onChange={v => setChecker(v)}
                  >
                    <Option value="李四(1002)">李四(1002)</Option>
                    <Option value="赵六(1004)">赵六(1004)</Option>
                  </Select>
                  {checker &&
                    (signed ? (
                      <Tag color="success">✓ 已签名</Tag>
                    ) : (
                      <Button
                        icon={<EditOutlined />}
                        size="small"
                        style={{ background: '#722ed1', color: '#fff', border: 'none' }}
                        onClick={handleSign}
                      >
                        签名
                      </Button>
                    ))}
                </Space>
              </Col>
            </Row>
            {inspector && checker && inspector === checker && (
              <Alert
                message="检验员与复核员不能为同一人！"
                type="error"
                showIcon
                style={{ marginTop: 8 }}
              />
            )}
            {!allRequiredPass && allRequiredFilled && (
              <Alert
                message="⚠️ 存在超差测量项，请先处理不合格项后再判定"
                type="warning"
                showIcon
                style={{ marginTop: 8 }}
              />
            )}
          </Card>

          {result === 'fail' && (
            <Alert
              message="⚠️ 首件不合格！将自动触发偏差流程，阻断批量生产，请填写《首件不合格处置单》"
              type="error"
              showIcon
            />
          )}
        </Space>
      </Card>

      <div style={{ textAlign: 'right' }}>
        <Button
          type="primary"
          size="large"
          disabled={!canSubmit}
          onClick={handleSubmit}
          style={{ height: 52, fontSize: 17, paddingInline: 36 }}
        >
          ✅ 提交首件确认
        </Button>
      </div>
    </div>
  );
};

export default FirstPieceStage;

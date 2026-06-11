/**
 * DynamicPhaseStage — 动态阶段执行组件
 * 根据工序主数据中的 OperationPhase.fields 动态生成 PAD 执行表单
 * 支持：Boolean / Enum / Decimal / Int / String / DateTime / Image / Ref(ESIGN) / SCAN
 */
import React, { useState, useCallback } from 'react';
import {
  Button, Card, Space, Typography, Tag, Alert, Divider,
  Row, Col, Select, Input, message, Badge,
} from 'antd';
import {
  CheckCircleOutlined, CameraOutlined,
  ScanOutlined, ClockCircleOutlined, UserOutlined,
  FileTextOutlined, CheckSquareOutlined,
} from '@ant-design/icons';
import type { OperationPhase, PhaseField } from '../../operation/operationData';
import type { StageExecution } from '../padExecutionData';
import PadNumPad from '../components/PadNumPad';
import PadCamera, { CapturedPhoto } from '../components/PadCamera';

const { Text, Title } = Typography;
const { Option } = Select;

// ─── Enum 选项解析 ─────────────────────────────────────────────
const parseEnumOptions = (stdValue?: string, fieldName?: string): string[] => {
  if (stdValue?.includes('/')) return stdValue.split('/');
  if (fieldName?.includes('判定') || fieldName?.includes('状态')) return ['合格', '不合格'];
  if (fieldName?.includes('完成') || fieldName?.includes('确认')) return ['已完成', '未完成'];
  if (fieldName?.includes('点检') || fieldName?.includes('检查')) return ['正常', '异常'];
  return ['合格', '不合格'];
};

// ─── 单字段渲染 ─────────────────────────────────────────────────
const FieldItem: React.FC<{
  field: PhaseField;
  value: unknown;
  onChange: (val: unknown) => void;
  onESign?: (cb: () => void) => void;
}> = ({ field, value, onChange, onESign }) => {
  const [photos, setPhotos] = useState<CapturedPhoto[]>([]);

  const { code, name, dataType, inputType, stdValue, unit, instrument, remark } = field;

  // Auto fields - show read-only timestamp
  if (inputType === 'AUTO') {
    const now = new Date().toLocaleString('zh-CN');
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <ClockCircleOutlined style={{ color: '#1677ff' }} />
        <Text style={{ fontSize: 13, color: '#52c41a' }}>{(value as string) || now}</Text>
        {!value && (
          <Button size="small" type="link" onClick={() => onChange(now)}>
            记录时间
          </Button>
        )}
      </div>
    );
  }

  // ESIGN fields
  if (inputType === 'ESIGN') {
    const signed = !!value;
    return (
      <Space>
        <Button
          icon={<UserOutlined />}
          type={signed ? 'default' : 'primary'}
          style={signed ? { borderColor: '#52c41a', color: '#52c41a' } : {}}
          onClick={() => {
            if (onESign) {
              onESign(() => onChange(`${name}：张三(1001) ${new Date().toLocaleString('zh-CN')}`));
            } else {
              onChange(`${name}：张三(1001) ${new Date().toLocaleString('zh-CN')}`);
            }
          }}
        >
          {signed ? '✅ 已签名' : `电子签名 — ${name}`}
        </Button>
        {signed && <Text style={{ fontSize: 11, color: '#52c41a' }}>{value as string}</Text>}
      </Space>
    );
  }

  // SCAN fields
  if (inputType === 'SCAN') {
    return (
      <Space>
        <Input
          prefix={<ScanOutlined />}
          placeholder={`扫描 ${name}（条码）`}
          value={value as string}
          onChange={e => onChange(e.target.value)}
          style={{ width: 240 }}
          size="large"
        />
        {remark && <Text type="secondary" style={{ fontSize: 11 }}>{remark}</Text>}
      </Space>
    );
  }

  // UPLOAD / Image fields
  if (inputType === 'UPLOAD' || dataType === 'Image') {
    return (
      <div>
        <PadCamera
          photos={photos}
          onChange={(newPhotos) => {
            setPhotos(newPhotos);
            onChange(newPhotos.map(p => p.dataUrl));
          }}
          minCount={0}
          label={name}
        />
      </div>
    );
  }

  // Boolean fields
  if (dataType === 'Boolean') {
    const boolVal = value as string | undefined;
    return (
      <Space>
        <Button
          size="large"
          type={boolVal === 'TRUE' ? 'primary' : 'default'}
          style={boolVal === 'TRUE' ? { background: '#52c41a', borderColor: '#52c41a' } : {}}
          onClick={() => onChange('TRUE')}
        >
          ✅ 已确认
        </Button>
        <Button
          size="large"
          danger={boolVal === 'FALSE'}
          type={boolVal === 'FALSE' ? 'primary' : 'default'}
          onClick={() => onChange('FALSE')}
        >
          ❌ 未确认
        </Button>
      </Space>
    );
  }

  // Enum fields
  if (dataType === 'Enum') {
    const opts = parseEnumOptions(stdValue, name);
    return (
      <Select
        size="large"
        style={{ minWidth: 160 }}
        placeholder="请选择"
        value={value as string}
        onChange={v => onChange(v)}
        getPopupContainer={t => t.parentElement || document.body}
      >
        {opts.map(o => (
          <Option key={o} value={o}>
            <span style={{ color: (o === '合格' || o === '正常' || o === '已完成' || o === '已转移' || o === '一致') ? '#52c41a' : '#ff4d4f' }}>
              {o}
            </span>
          </Option>
        ))}
      </Select>
    );
  }

  // Decimal / Int — use PadNumPad
  if (dataType === 'Decimal' || dataType === 'Int') {
    const numVal = value as number | null;
    return (
      <Space align="center" wrap>
        <PadNumPad
          value={numVal ?? null}
          onChange={(v) => onChange(v)}
          label={name}
          unit={unit}
          spec={stdValue}
          allowDecimal={dataType === 'Decimal'}
          placeholder={`输入${name}`}
        />
        {stdValue && <Tag color="blue" style={{ fontSize: 11 }}>标准值：{stdValue}</Tag>}
        {instrument && <Tag color="purple" style={{ fontSize: 11 }}>量具：{instrument}</Tag>}
      </Space>
    );
  }

  // String / default text input
  return (
    <Input
      size="large"
      placeholder={`请输入 ${name}`}
      value={value as string}
      onChange={e => onChange(e.target.value)}
      style={{ maxWidth: 300 }}
      suffix={unit ? <Text type="secondary">{unit}</Text> : undefined}
    />
  );
};

// ─── 主组件 ─────────────────────────────────────────────────────
interface DynamicPhaseStageProps {
  phase: OperationPhase;
  execution: StageExecution;
  onComplete: (data: Record<string, unknown>) => void;
  onESign?: (cb: () => void) => void;
}

const DynamicPhaseStage: React.FC<DynamicPhaseStageProps> = ({
  phase, execution, onComplete, onESign,
}) => {
  const isCompleted = execution.status === 'completed';
  const [fieldValues, setFieldValues] = useState<Record<string, unknown>>(
    (execution.data as Record<string, unknown>) || {}
  );

  const handleFieldChange = useCallback((code: string, val: unknown) => {
    setFieldValues(prev => ({ ...prev, [code]: val }));
  }, []);

  const requiredFields = phase.fields.filter(f => f.required && f.inputType !== 'AUTO');
  const allFilled = requiredFields.every(f => {
    const v = fieldValues[f.code];
    return v !== undefined && v !== null && v !== '';
  });

  const handleSubmit = () => {
    if (!allFilled) {
      message.warning('请完成所有必填项');
      return;
    }
    // Auto-fill DateTime fields
    const now = new Date().toLocaleString('zh-CN');
    const finalData: Record<string, unknown> = { ...fieldValues };
    phase.fields.forEach(f => {
      if (f.inputType === 'AUTO' && !finalData[f.code]) {
        finalData[f.code] = now;
      }
    });

    if (phase.eSign && onESign) {
      onESign(() => onComplete(finalData));
    } else {
      onComplete(finalData);
    }
  };

  if (isCompleted) {
    return (
      <Card style={{ borderRadius: 12, border: '2px solid #b7eb8f', background: '#f6ffed' }}>
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a' }} />
          <div style={{ marginTop: 12 }}>
            <Title level={4} style={{ color: '#52c41a', margin: 0 }}>阶段已完成</Title>
            <Text type="secondary" style={{ fontSize: 12 }}>
              完成时间：{execution.endTime}
            </Text>
          </div>
        </div>
      </Card>
    );
  }

  const phaseTypeColors: Record<string, string> = {
    PREP: '#722ED1', LOAD: '#1677FF', EXEC: '#13C2C2',
    IPQC: '#FA8C16', OQC: '#EB2F96', CLEAN: '#52C41A',
    HAND: '#8C8C8C', SPEC: '#E60012',
  };

  return (
    <div style={{ paddingBottom: 20 }}>
      {/* 阶段信息头 */}
      <Card
        style={{ borderRadius: 12, marginBottom: 12, borderColor: phaseTypeColors[phase.phaseType] }}
        bodyStyle={{ padding: '12px 16px' }}
      >
        <Row align="middle" gutter={12}>
          <Col>
            <Badge color={phaseTypeColors[phase.phaseType]} />
          </Col>
          <Col flex={1}>
            <Title level={5} style={{ margin: 0 }}>{phase.phaseName}</Title>
            <Space size={4} style={{ marginTop: 4 }}>
              {phase.photoReq === 'REQUIRED' && (
                <Tag color="orange" icon={<CameraOutlined />}>需拍照</Tag>
              )}
              {phase.eSign && <Tag color="purple" icon={<UserOutlined />}>需签名</Tag>}
              {phase.dualReview && <Tag color="red">双人复核</Tag>}
              {phase.linkedDoc && (
                <Tag color="blue" icon={<FileTextOutlined />}>{phase.linkedDoc}</Tag>
              )}
              {phase.timeoutMin && (
                <Tag icon={<ClockCircleOutlined />}>{phase.timeoutMin}分钟</Tag>
              )}
            </Space>
          </Col>
          <Col>
            <Text type="secondary" style={{ fontSize: 11 }}>
              {requiredFields.length} 个必填项 / {phase.fields.length} 个字段
            </Text>
          </Col>
        </Row>
        {phase.remark && (
          <Alert message={phase.remark} type="info" showIcon style={{ marginTop: 8 }} />
        )}
      </Card>

      {/* 字段列表 */}
      {phase.fields.map((field, idx) => {
        const filled = fieldValues[field.code] !== undefined && fieldValues[field.code] !== null && fieldValues[field.code] !== '';
        return (
          <Card
            key={field.code}
            style={{
              borderRadius: 10, marginBottom: 10,
              borderLeft: `4px solid ${field.required ? (filled ? '#52c41a' : '#faad14') : '#d9d9d9'}`,
            }}
            bodyStyle={{ padding: '12px 16px' }}
          >
            <Row gutter={8} align="top">
              <Col flex="none" style={{ paddingTop: 2 }}>
                <Text type="secondary" style={{ fontSize: 11, fontFamily: 'monospace' }}>
                  {String(idx + 1).padStart(2, '0')}
                </Text>
              </Col>
              <Col flex={1}>
                <div style={{ marginBottom: 8 }}>
                  <Space>
                    <Text style={{ fontWeight: 600, fontSize: 14 }}>{field.name}</Text>
                    {field.required && <Tag color="red" style={{ fontSize: 10 }}>必填</Tag>}
                    {!field.required && <Tag color="default" style={{ fontSize: 10 }}>选填</Tag>}
                    <Tag style={{ fontSize: 10 }}>{field.dataType}</Tag>
                    {filled && <CheckSquareOutlined style={{ color: '#52c41a' }} />}
                  </Space>
                </div>
                <FieldItem
                  field={field}
                  value={fieldValues[field.code]}
                  onChange={(v) => handleFieldChange(field.code, v)}
                  onESign={onESign}
                />
              </Col>
            </Row>
          </Card>
        );
      })}

      <Divider />

      {/* 提交按钮 */}
      <Button
        type="primary"
        size="large"
        block
        disabled={!allFilled}
        onClick={handleSubmit}
        style={{
          height: 52, fontSize: 16, fontWeight: 700, borderRadius: 10,
          background: allFilled ? undefined : '#d9d9d9',
        }}
      >
        {phase.eSign ? `📝 电子签名并完成「${phase.phaseName}」` : `✅ 完成「${phase.phaseName}」`}
      </Button>

      {!allFilled && (
        <Alert
          style={{ marginTop: 8, borderRadius: 8 }}
          type="warning"
          showIcon
          message={`请完成以下必填项：${requiredFields.filter(f => !fieldValues[f.code]).map(f => f.name).join('、')}`}
        />
      )}
    </div>
  );
};

export default DynamicPhaseStage;

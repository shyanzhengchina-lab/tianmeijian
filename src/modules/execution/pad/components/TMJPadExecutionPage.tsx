/**
 * 天美健MES - PAD工序执行主界面（天美健专版）
 * 对应截图：步骤条 + 当前阶段内容区 + 已完成阶段展示
 * 完全基于天美健实际工艺路径（保健品制造GMP）
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  Steps,
  Card,
  Button,
  Space,
  Tag,
  Input,
  Select,
  InputNumber,
  Form,
  Modal,
  message,
  Alert,
  Divider,
  Row,
  Col,
  Table,
  Typography,
  Badge,
  Tooltip,
  Checkbox,
  Descriptions,
  Timeline,
} from 'antd';
import {
  CheckCircleFilled,
  ClockCircleOutlined,
  ScanOutlined,
  CameraOutlined,
  SafetyCertificateOutlined,
  WarningFilled,
  TeamOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  ThunderboltOutlined,
  ExclamationCircleFilled,
  SmileOutlined,
} from '@ant-design/icons';

import type {
  OpPhaseConfig,
  PhaseDefinition,
  PhaseField,
  BomMaterialItem,
} from '../data/tmjPhaseDefinitions';
import {
  TMJ_OP_PHASE_MAP,
  getOpListByRouting,
  TMJ_ROUTINGS,
} from '../data/tmjPhaseDefinitions';

const { Text, Title } = Typography;

// ─────────────────────────────────────────────────────────
// 1. 工单/任务Mock数据（替换原医疗器械数据）
// ─────────────────────────────────────────────────────────

interface TaskBasicInfo {
  woNo: string;
  productName: string;
  productSpec: string;
  batchNo: string;
  planQty: number;
  unit: string;
  routingCode: string;
  opNo: string;
  opName: string;
  workcenterName: string;
  operatorName: string;
  planStartTime: string;
  planEndTime: string;
}

const DEMO_TASKS: TaskBasicInfo[] = [
  {
    woNo: 'WO-20260605-001',
    productName: '维生素C咀嚼片',
    productSpec: '500mg/片 × 60片/瓶',
    batchNo: 'TMJ-VITC-20260605-002',
    planQty: 600000,
    unit: '片',
    routingCode: 'TMJ-VITC-WG-V20',
    opNo: 'OP-40',
    opName: '压片',
    workcenterName: '南京-固体制剂车间',
    operatorName: '张三',
    planStartTime: '2026-06-05 08:00',
    planEndTime: '2026-06-05 16:00',
  },
  {
    woNo: 'WO-20260605-002',
    productName: '维生素C咀嚼片',
    productSpec: '500mg/片 × 60片/瓶',
    batchNo: 'TMJ-VITC-20260605-002',
    planQty: 200,
    unit: 'kg',
    routingCode: 'TMJ-VITC-WG-V20',
    opNo: 'OP-10',
    opName: '称量配料',
    workcenterName: '南京-固体制剂车间',
    operatorName: '李四',
    planStartTime: '2026-06-05 07:30',
    planEndTime: '2026-06-05 12:30',
  },
  {
    woNo: 'WO-20260605-003',
    productName: '益生菌胶囊',
    productSpec: '400mg/粒 × 60粒/瓶',
    batchNo: 'TMJ-PROBIO-20260605-003',
    planQty: 100000,
    unit: '粒',
    routingCode: 'TMJ-PROBIO-CAP-V15',
    opNo: 'OP-40',
    opName: '胶囊充填',
    workcenterName: '廊坊-益生菌冷链车间',
    operatorName: '王五',
    planStartTime: '2026-06-05 09:00',
    planEndTime: '2026-06-05 17:00',
  },
  {
    woNo: 'WO-20260605-004',
    productName: '维生素C咀嚼片（直压）',
    productSpec: '500mg/片 × 60片/瓶',
    batchNo: 'TMJ-VITC-DC-20260605-001',
    planQty: 241,
    unit: 'kg',
    routingCode: 'TMJ-VITC-DC-V10',
    opNo: 'OP-30',
    opName: '总混',
    workcenterName: '南京-固体制剂车间',
    operatorName: '赵六',
    planStartTime: '2026-06-05 10:00',
    planEndTime: '2026-06-05 14:00',
  },
];

// ─────────────────────────────────────────────────────────
// 2. 字段值状态
// ─────────────────────────────────────────────────────────

type FieldValues = Record<string, any>;

// ─────────────────────────────────────────────────────────
// 3. 物料一致确认子组件
// ─────────────────────────────────────────────────────────

interface MaterialVerifyPanelProps {
  bomMaterials: BomMaterialItem[];
  scannedCodes: string[];
  onScan: (code: string) => void;
  onMockScan: () => void;
}

const MaterialVerifyPanel: React.FC<MaterialVerifyPanelProps> = ({
  bomMaterials, scannedCodes, onScan, onMockScan,
}) => {
  const [inputVal, setInputVal] = useState('');

  return (
    <div>
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message={
          <span>
            本工序需核对物料：<strong>名称、批号、数量</strong>，与批生产指令一致；
            检查物料状态标签（"已放行"或"合格"）
          </span>
        }
      />

      {/* 扫码输入区 */}
      <Space.Compact style={{ width: '100%', marginBottom: 16 }}>
        <Input
          prefix={<ScanOutlined />}
          value={inputVal}
          onChange={e => setInputVal(e.target.value)}
          onPressEnter={() => { if (inputVal) { onScan(inputVal); setInputVal(''); } }}
          placeholder="扫描物料条形码"
          size="large"
          style={{ flex: 1 }}
        />
        <Button
          type="primary"
          size="large"
          icon={<ScanOutlined />}
          onClick={() => { if (inputVal) { onScan(inputVal); setInputVal(''); } }}
        >
          扫码
        </Button>
        <Button
          size="large"
          onClick={onMockScan}
        >
          模拟扫描
        </Button>
      </Space.Compact>

      {/* 物料列表 */}
      {scannedCodes.length > 0 && (
        <Table
          dataSource={bomMaterials.slice(0, scannedCodes.length)}
          rowKey="materialCode"
          size="small"
          pagination={false}
          style={{ marginBottom: 16 }}
          columns={[
            { title: '物料名称', dataIndex: 'materialName', width: 200,
              render: (name: string, r: BomMaterialItem) => (
                <Space>
                  {r.isColdChain && <Tag color="blue" style={{ fontSize: 11 }}>❄️冷链</Tag>}
                  {name}
                </Space>
              ),
            },
            { title: '批号', dataIndex: 'batchNo', width: 160 },
            { title: '供应商', dataIndex: 'supplier', width: 120 },
            { title: '有效期', dataIndex: 'expDate', width: 100 },
            {
              title: 'BOM校验',
              width: 90,
              render: () => <Tag color="success" icon={<CheckCircleFilled />}>通过</Tag>,
            },
          ]}
        />
      )}

      {scannedCodes.length < bomMaterials.length && (
        <Alert
          type="warning"
          showIcon
          message={`还剩 ${bomMaterials.length - scannedCodes.length} 种物料未扫码`}
        />
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// 4. 半成品检验Modal
// ─────────────────────────────────────────────────────────

interface QCInspectionModalProps {
  open: boolean;
  onClose: () => void;
  phase: PhaseDefinition;
  task: TaskBasicInfo;
  onComplete: () => void;
}

const QCInspectionModal: React.FC<QCInspectionModalProps> = ({
  open, onClose, phase, task, onComplete,
}) => {
  const [equipScanned, setEquipScanned] = useState(false);
  const [inspectorCode, setInspectorCode] = useState('');
  const [reviewerCode, setReviewerCode] = useState('');
  const [qcConclusion, setQcConclusion] = useState<'pass' | 'fail' | null>(null);
  const [form] = Form.useForm();

  const handleMockEquipScan = () => {
    setEquipScanned(true);
    message.success('检验设备已绑定：PHD-0002 精密天平（校准有效期2026-12-31）');
  };

  const handleGenerate = () => {
    if (!equipScanned) { message.warning('请先扫码绑定检验设备'); return; }
    if (!qcConclusion) { message.warning('请选择检验结论'); return; }
    message.success('《半成品检验记录》已生成并存档（记录编号：TMJ/QR-PRD-002）');
    onComplete();
    onClose();
  };

  return (
    <Modal
      title={
        <Space>
          <SafetyCertificateOutlined style={{ color: '#cf1322' }} />
          <span>半成品检验记录</span>
          <Tag color="blue">TMJ/QR-PRD-002</Tag>
          <Tag color="purple">QC-BCP-20260615-885</Tag>
        </Space>
      }
      open={open}
      onCancel={onClose}
      width={860}
      footer={null}
    >
      {/* ①产品信息 */}
      <Card size="small" title="① 产品信息" style={{ marginBottom: 16 }}>
        <Descriptions column={3} size="small">
          <Descriptions.Item label="产品名称">{task.productName}</Descriptions.Item>
          <Descriptions.Item label="型号/规格">{task.productSpec}</Descriptions.Item>
          <Descriptions.Item label="规格型号">{task.productSpec}</Descriptions.Item>
          <Descriptions.Item label="半成品批号">{task.batchNo}</Descriptions.Item>
          <Descriptions.Item label="送检数量">
            <Input size="small" placeholder="请填写" style={{ width: 100 }} suffix="片" />
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* ②检验设备 */}
      <Card size="small" title="② 检验设备（必须扫码绑定）" style={{ marginBottom: 16 }}>
        <Space.Compact style={{ width: '100%' }}>
          <Input
            prefix={<ScanOutlined />}
            placeholder="扫描绑定 检验设备"
            disabled={equipScanned}
            value={equipScanned ? '已绑定：PHD-0002 精密天平' : ''}
          />
          <Button icon={<ScanOutlined />} onClick={handleMockEquipScan}>模拟扫码</Button>
        </Space.Compact>
        {!equipScanned && (
          <Alert
            type="warning"
            showIcon
            style={{ marginTop: 8 }}
            message="检验设备信息将关联到本检验记录，请务必扫码绑定"
          />
        )}
      </Card>

      {/* ③检验项目录入 */}
      <Card size="small" title="③ 检验项目录入" style={{ marginBottom: 16 }}>
        <Table
          size="small"
          pagination={false}
          dataSource={[
            {
              key: '1',
              opName: '半成品检验',
              item: phase.opName === '素片中检（QC）' ? '片重差异' : '装量差异',
              std: '按《产品技术要求》',
              stdParam: phase.opName === '素片中检（QC）' ? '±5.0%' : '±7.5%',
            },
            {
              key: '2',
              opName: '半成品检验',
              item: phase.opName === '素片中检（QC）' ? '硬度' : '外观',
              std: '按《产品技术要求》',
              stdParam: phase.opName === '素片中检（QC）' ? '80~120 N' : '密封完好，无漏粉',
            },
          ]}
          columns={[
            { title: '工序名称', dataIndex: 'opName', width: 100 },
            { title: '检验项目', dataIndex: 'item', width: 100 },
            { title: '标准要求', dataIndex: 'std', width: 120 },
            { title: '标准参数', dataIndex: 'stdParam', width: 120, render: v => <Text type="danger">{v}</Text> },
            { title: '合格数量', width: 90, render: () => <InputNumber size="small" placeholder="合格数" style={{ width: 80 }} /> },
            { title: '不合格数量及描述', width: 140, render: () => <Input size="small" prefix="不合格:" placeholder="0" style={{ width: 120 }} /> },
            { title: '检验员', width: 100, render: () => <Select size="small" placeholder="选择检验员" style={{ width: 90 }} /> },
            { title: '检验日期', width: 100, render: () => <Text style={{ fontSize: 12 }}>2026-06-15</Text> },
          ]}
        />
      </Card>

      {/* ④检验结论&签名 */}
      <Card size="small" title="④ 检验结论 & 签名" style={{ marginBottom: 16 }}>
        <div style={{ marginBottom: 16 }}>
          <Text strong>检验结论：</Text>
          <Space style={{ marginTop: 8 }}>
            <Button
              type={qcConclusion === 'pass' ? 'primary' : 'default'}
              icon={qcConclusion === 'pass' ? <CheckCircleFilled /> : undefined}
              onClick={() => setQcConclusion('pass')}
              style={{ background: qcConclusion === 'pass' ? '#52c41a' : undefined, borderColor: qcConclusion === 'pass' ? '#52c41a' : undefined }}
            >
              ✅ 本批次产品符合产品技术要求
            </Button>
            <Button
              danger
              type={qcConclusion === 'fail' ? 'primary' : 'default'}
              onClick={() => setQcConclusion('fail')}
            >
              ✗ 本批次不合格
            </Button>
          </Space>
        </div>
        <Row gutter={16}>
          <Col span={12}>
            <div>
              <Text strong>检验员签名</Text>
              <Space.Compact style={{ width: '100%', marginTop: 4 }}>
                <Input placeholder="选择检验员" value={inspectorCode} onChange={e => setInspectorCode(e.target.value)} />
              </Space.Compact>
            </div>
          </Col>
          <Col span={12}>
            <div>
              <Text strong>审核签名</Text>
              <Space.Compact style={{ width: '100%', marginTop: 4 }}>
                <Input placeholder="审核人员（选填）" value={reviewerCode} onChange={e => setReviewerCode(e.target.value)} />
              </Space.Compact>
            </div>
          </Col>
        </Row>
        <Alert
          type="info"
          showIcon
          style={{ marginTop: 12 }}
          message={`本记录为独立存档单据（TMJ/QR-PRD-002），不纳入当前工序批记录，但关联批次号 ${task.batchNo}。`}
        />
      </Card>

      <Button
        type="primary"
        block
        size="large"
        onClick={handleGenerate}
        style={{ background: 'linear-gradient(90deg, #eb2f96, #cf1322)', border: 'none', height: 48, fontSize: 16 }}
        icon={<SafetyCertificateOutlined />}
      >
        生成《半成品检验记录》
      </Button>
    </Modal>
  );
};

// ─────────────────────────────────────────────────────────
// 5. 阶段内容渲染组件
// ─────────────────────────────────────────────────────────

interface PhaseContentProps {
  phase: PhaseDefinition;
  task: TaskBasicInfo;
  values: FieldValues;
  onChange: (key: string, value: any) => void;
  scannedMaterials: string[];
  onMaterialScan: (code: string) => void;
  onMockMaterialScan: () => void;
  onOpenQC: () => void;
}

const PhaseContent: React.FC<PhaseContentProps> = ({
  phase, task, values, onChange,
  scannedMaterials, onMaterialScan, onMockMaterialScan, onOpenQC,
}) => {
  const renderField = (field: PhaseField) => {
    const val = values[field.key];

    switch (field.type) {
      case 'scan':
        return (
          <div key={field.key} style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 500, marginBottom: 6 }}>
              {field.required && <Text type="danger">* </Text>}
              {field.label}
              {field.stdValue && <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>（{field.stdValue}）</Text>}
            </div>
            <Space.Compact style={{ width: '100%' }}>
              <Input
                prefix={<ScanOutlined />}
                placeholder={field.placeholder}
                value={val || ''}
                onChange={e => onChange(field.key, e.target.value)}
                style={{ flex: 1 }}
              />
              <Button
                type="primary"
                icon={<ScanOutlined />}
                onClick={() => onChange(field.key, `SCANNED-${Date.now().toString().slice(-6)}`)}
              >
                扫码
              </Button>
              <Button
                onClick={() => {
                  const mockVals: Record<string, string> = {
                    woScan: task.woNo,
                    equipScan: `EQ-${task.workcenterName.includes('冷链') ? 'COLD' : 'STD'}-001`,
                    scaleScan: 'SCALE-PRC-001',
                    stirMachineScan: 'GRAN-HLSG-001',
                    instrumentScan: 'INSTR-SET-001',
                    fillEquipScan: 'FILL-CAP-001',
                    inspectorScan: '检验员：张QC（工号QC-001）',
                    reviewerScan: '复核员：李QC（工号QC-002）',
                    inspectEquipScan: '检验设备已绑定',
                    sampleBarcode: `SP-${task.batchNo}-001`,
                    sampleScan: `SP-${task.batchNo}-001`,
                    coldChainDocScan: `CC-DOC-${task.batchNo}`,
                    handoverScan: `OP-RECV-001`,
                  };
                  onChange(field.key, mockVals[field.key] || `MOCK-${field.key.toUpperCase()}`);
                  message.success(`${field.label}：扫码成功`);
                }}
              >
                模拟扫描
              </Button>
            </Space.Compact>
            {val && <Tag color="success" style={{ marginTop: 4 }}>✓ 已扫码：{val}</Tag>}
          </div>
        );

      case 'number':
      case 'temperature':
        return (
          <div key={field.key} style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 500, marginBottom: 6 }}>
              {field.required && <Text type="danger">* </Text>}
              {field.label}
              {field.stdValue && (
                <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
                  标准：{field.stdValue}
                </Text>
              )}
              {field.type === 'temperature' && <Tag color="blue" style={{ marginLeft: 8 }}>温度</Tag>}
            </div>
            <Space>
              <InputNumber
                value={val}
                onChange={v => onChange(field.key, v)}
                min={field.min}
                max={field.max}
                precision={3}
                style={{ width: 160 }}
                addonAfter={field.unit}
                placeholder={field.placeholder || '输入数值'}
              />
              {val !== undefined && val !== null && (
                <Tag color={
                  (field.min !== undefined && val < field.min) || (field.max !== undefined && val > field.max)
                    ? 'error' : 'success'
                }>
                  {(field.min !== undefined && val < field.min) || (field.max !== undefined && val > field.max)
                    ? '⚠️ 超出范围' : '✓ 正常'}
                </Tag>
              )}
            </Space>
          </div>
        );

      case 'select':
        return (
          <div key={field.key} style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 500, marginBottom: 6 }}>
              {field.required && <Text type="danger">* </Text>}
              {field.label}
              {field.stdValue && <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>标准：{field.stdValue}</Text>}
            </div>
            <Select
              value={val}
              onChange={v => onChange(field.key, v)}
              style={{ width: '100%' }}
              placeholder={`请选择${field.label}`}
              options={field.options?.map(opt => ({ label: opt, value: opt }))}
            />
          </div>
        );

      case 'text':
        return (
          <div key={field.key} style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 500, marginBottom: 6 }}>
              {field.required && <Text type="danger">* </Text>}
              {field.label}
              {field.stdValue && <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>标准：{field.stdValue}</Text>}
            </div>
            <Input
              value={val || ''}
              onChange={e => onChange(field.key, e.target.value)}
              placeholder={field.placeholder}
            />
          </div>
        );

      case 'signature':
        return (
          <div key={field.key} style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 500, marginBottom: 6 }}>
              {field.required && <Text type="danger">* </Text>}
              {field.label}
              {field.dualSign && <Tag color="red" style={{ marginLeft: 8 }}>👥 双人复核</Tag>}
            </div>
            {val ? (
              <Tag color="success" style={{ fontSize: 14, padding: '6px 16px' }}>
                ✍️ 已签名：{val}
              </Tag>
            ) : (
              <Button
                type={field.dualSign ? 'default' : 'primary'}
                icon={<SafetyCertificateOutlined />}
                style={field.dualSign ? { borderColor: '#722ed1', color: '#722ed1' } : {}}
                onClick={() => {
                  const opName = field.dualSign ? '复核员张QA' : task.operatorName;
                  onChange(field.key, opName);
                  message.success(`${field.label}已完成`);
                }}
              >
                {field.dualSign ? '🔐 双人电子签名' : '✍️ 电子签名'}
              </Button>
            )}
          </div>
        );

      case 'photo':
        return (
          <div key={field.key} style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 500, marginBottom: 6 }}>
              {field.required && <Text type="danger">* </Text>}
              {field.label}
              {field.stdValue && <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>{field.stdValue}</Text>}
            </div>
            {val ? (
              <Tag color="success">
                <CameraOutlined /> 已上传：{val}
              </Tag>
            ) : (
              <Space>
                <Button
                  icon={<CameraOutlined />}
                  style={{ borderColor: '#1677ff', color: '#1677ff' }}
                  onClick={() => {
                    const photoId = `PHOTO-${field.key}-${Date.now().toString().slice(-4)}.jpg`;
                    onChange(field.key, photoId);
                    message.success('照片上传成功');
                  }}
                >
                  拍照上传
                </Button>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  <CameraOutlined /> 已拍：0/1（至少1张）
                </Text>
              </Space>
            )}
          </div>
        );

      case 'checkbox':
        return (
          <div key={field.key} style={{ marginBottom: 16 }}>
            <Checkbox
              checked={!!val}
              onChange={e => onChange(field.key, e.target.checked)}
            >
              <Text strong>{field.required && <Text type="danger">* </Text>}{field.label}</Text>
              {field.stdValue && <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>（{field.stdValue}）</Text>}
            </Checkbox>
          </div>
        );

      case 'datetime':
        return (
          <div key={field.key} style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 500, marginBottom: 6 }}>
              {field.required && <Text type="danger">* </Text>}
              {field.label}
            </div>
            <Input
              type="datetime-local"
              value={val || ''}
              onChange={e => onChange(field.key, e.target.value)}
              style={{ width: 220 }}
            />
          </div>
        );

      case 'table':
        return (
          <div key={field.key} style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 500, marginBottom: 8 }}>
              {field.required && <Text type="danger">* </Text>}
              {field.label}
            </div>
            <Table
              size="small"
              pagination={false}
              dataSource={(val || [{ key: '1' }, { key: '2' }, { key: '3' }])}
              rowKey="key"
              columns={[
                ...(field.tableColumns || []).map(col => ({
                  title: col.label,
                  dataIndex: col.key,
                  width: 130,
                  render: (_: any, __: any, idx: number) => (
                    col.type === 'datetime'
                      ? <Input type="datetime-local" size="small" style={{ width: 160 }} />
                      : col.type === 'text'
                        ? <Input size="small" placeholder={col.label} />
                        : <InputNumber size="small" style={{ width: 90 }} placeholder="0" />
                  ),
                })),
                {
                  title: '操作',
                  width: 60,
                  render: (_: any, __: any, idx: number) => (
                    <Button
                      size="small"
                      type="link"
                      onClick={() => message.success(`第${idx + 1}行已保存`)}
                    >
                      保存
                    </Button>
                  ),
                },
              ]}
            />
            <Button
              size="small"
              style={{ marginTop: 8 }}
              onClick={() => message.success('已添加新行')}
            >
              + 添加记录行
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  // 特殊：清场阶段（SOP步骤列表）
  if (phase.sopSteps && phase.sopSteps.length > 0) {
    return (
      <div>
        <Alert
          type="info"
          showIcon
          message={phase.description}
          style={{ marginBottom: 16 }}
        />
        {phase.sopSteps.map((step, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
              marginBottom: 12,
              padding: '8px 12px',
              background: values[`sop_${idx}`] ? '#f6ffed' : '#fafafa',
              borderRadius: 6,
              border: `1px solid ${values[`sop_${idx}`] ? '#b7eb8f' : '#f0f0f0'}`,
            }}
          >
            <Checkbox
              checked={!!values[`sop_${idx}`]}
              onChange={e => onChange(`sop_${idx}`, e.target.checked)}
              style={{ marginTop: 2 }}
            />
            <div style={{ flex: 1 }}>
              <Text>{idx + 1}. {step}</Text>
            </div>
            {values[`sop_${idx}`] && <Tag color="success">✓ 已完成</Tag>}
          </div>
        ))}
        <Divider />
        {/* 额外字段（如有） */}
        {phase.fields.map(f => renderField(f))}
        <div style={{ marginTop: 16 }}>
          <Button
            type="primary"
            icon={<CameraOutlined />}
            onClick={() => {
              onChange('cleanPhoto', `CLEAN-${Date.now().toString().slice(-4)}.jpg`);
              message.success('清场照片上传成功');
            }}
          >
            拍照上传清场证据
          </Button>
          {values.cleanPhoto && (
            <Tag color="success" style={{ marginLeft: 8 }}>
              <CameraOutlined /> {values.cleanPhoto}
            </Tag>
          )}
        </div>
        <div style={{ marginTop: 12 }}>
          <Button
            type="default"
            icon={<SafetyCertificateOutlined />}
            style={{ borderColor: '#722ed1', color: '#722ed1' }}
            onClick={() => {
              onChange('cleanSign', `${task.operatorName}（QA监督）`);
              message.success('清场确认签字完成');
            }}
          >
            QA签字确认
          </Button>
          {values.cleanSign && <Tag color="purple" style={{ marginLeft: 8 }}>✓ {values.cleanSign}</Tag>}
        </div>
      </div>
    );
  }

  // 物料一致确认阶段
  if (phase.phaseKey === 'material-verify' || phase.phaseKey === 'material-verify-cold' || phase.phaseKey === 'material-verify-cap') {
    if (phase.bomMaterials && phase.bomMaterials.length > 0) {
      return (
        <div>
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
            message={phase.description}
          />
          <MaterialVerifyPanel
            bomMaterials={phase.bomMaterials}
            scannedCodes={scannedMaterials}
            onScan={onMaterialScan}
            onMockScan={onMockMaterialScan}
          />
          <Divider />
          {phase.fields.filter(f => f.type === 'signature').map(f => renderField(f))}
        </div>
      );
    }
  }

  // 进站阶段 — 特殊展示
  if (phase.phaseKey === 'entry') {
    return (
      <div>
        <Alert
          type="info"
          showIcon
          message={phase.description}
          style={{ marginBottom: 16 }}
        />
        {phase.fields.map(f => renderField(f))}
      </div>
    );
  }

  // 通用字段渲染
  return (
    <div>
      {phase.isColdChainCheck && (
        <Alert
          type="warning"
          showIcon
          icon={<WarningFilled />}
          message={
            <span>
              <strong>❄️ 冷链操作提醒：</strong>
              本阶段需保持温度≤8°C，操作时间尽量缩短，益生菌菌粉暴露时间不超过规定限度。
            </span>
          }
          style={{ marginBottom: 16 }}
        />
      )}
      {phase.dualSign && (
        <Alert
          type="error"
          showIcon
          icon={<TeamOutlined />}
          message={<span><strong>👥 双人复核要求：</strong>本阶段为关键操作，必须有操作员 + 复核员（QA/班组长）双人在场并分别签名。</span>}
          style={{ marginBottom: 16 }}
        />
      )}
      <Alert
        type="info"
        showIcon
        message={phase.description}
        style={{ marginBottom: 20 }}
      />

      {/* 如果有QC检验按钮（素片中检/充填中检阶段） */}
      {(phase.phaseKey === 'qc-inspection' || phase.phaseKey === 'capsule-qc') && (
        <Button
          type="primary"
          size="large"
          icon={<SafetyCertificateOutlined />}
          onClick={onOpenQC}
          style={{ marginBottom: 16, background: '#eb2f96', borderColor: '#eb2f96' }}
        >
          打开半成品检验记录表单
        </Button>
      )}

      {phase.fields.map(f => renderField(f))}
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// 6. 主页面组件
// ─────────────────────────────────────────────────────────

export const TMJPadExecutionPage: React.FC = () => {
  // 任务选择
  const [selectedTaskIdx, setSelectedTaskIdx] = useState<number>(0);
  const [currentPhaseIdx, setCurrentPhaseIdx] = useState(0);
  const [completedPhases, setCompletedPhases] = useState<Set<number>>(new Set());
  const [phaseValues, setPhaseValues] = useState<Record<number, FieldValues>>({});
  const [scannedMaterials, setScannedMaterials] = useState<string[]>([]);
  const [qcModalOpen, setQcModalOpen] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [taskStarted, setTaskStarted] = useState(false);

  const task = DEMO_TASKS[selectedTaskIdx];
  const opKey = `${task.routingCode}:${task.opNo}`;
  const opConfig: OpPhaseConfig | undefined = TMJ_OP_PHASE_MAP[opKey];
  const phases = opConfig?.phases || [];

  const currentPhase = phases[currentPhaseIdx];

  // 计时器
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimer = () => {
    if (timerRef.current) return;
    timerRef.current = setInterval(() => setElapsedSeconds(s => s + 1), 1000);
    setTaskStarted(true);
  };

  const formatElapsed = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return h > 0
      ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
      : `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  // 字段值更新
  const handleFieldChange = useCallback((key: string, value: any) => {
    setPhaseValues(prev => ({
      ...prev,
      [currentPhaseIdx]: { ...(prev[currentPhaseIdx] || {}), [key]: value },
    }));
  }, [currentPhaseIdx]);

  const currentValues = phaseValues[currentPhaseIdx] || {};

  // 物料扫码
  const handleMaterialScan = useCallback((code: string) => {
    setScannedMaterials(prev => {
      if (prev.includes(code)) {
        message.warning('该物料已扫码');
        return prev;
      }
      message.success(`物料扫码成功：${code}`);
      return [...prev, code];
    });
  }, []);

  const handleMockMaterialScan = useCallback(() => {
    const materials = currentPhase?.bomMaterials || [];
    const nextIdx = scannedMaterials.length;
    if (nextIdx >= materials.length) {
      message.info('所有物料已扫码完成');
      return;
    }
    const mat = materials[nextIdx];
    setScannedMaterials(prev => [...prev, mat.materialCode]);
    message.success(`模拟扫码：${mat.materialName}（${mat.batchNo}）BOM校验通过`);
  }, [currentPhase, scannedMaterials]);

  // 检查当前阶段是否可以继续
  const canProceed = (): boolean => {
    if (!currentPhase) return true;
    const vals = phaseValues[currentPhaseIdx] || {};

    // 清场阶段：需所有SOP步骤勾选
    if (currentPhase.sopSteps && currentPhase.sopSteps.length > 0) {
      return currentPhase.sopSteps.every((_, idx) => vals[`sop_${idx}`]);
    }

    // 物料一致确认阶段：需所有物料扫码
    if ((currentPhase.phaseKey.includes('material-verify')) && currentPhase.bomMaterials) {
      return scannedMaterials.length >= currentPhase.bomMaterials.length;
    }

    // 必填字段校验（扫码/签名类）
    const requiredScanSign = currentPhase.fields.filter(
      f => f.required && (f.type === 'scan' || f.type === 'signature')
    );
    return requiredScanSign.every(f => !!vals[f.key]);
  };

  // 进入下一阶段
  const handleNext = () => {
    if (!canProceed()) {
      message.warning('请完成当前阶段所有必填项后再继续');
      return;
    }
    setCompletedPhases(prev => new Set([...prev, currentPhaseIdx]));
    if (currentPhaseIdx < phases.length - 1) {
      setCurrentPhaseIdx(currentPhaseIdx + 1);
      setScannedMaterials([]);
      if (!taskStarted) startTimer();
    } else {
      message.success(`工序 ${task.opName} 全部阶段执行完成！`);
    }
  };

  const handlePrev = () => {
    if (currentPhaseIdx > 0) {
      setCurrentPhaseIdx(currentPhaseIdx - 1);
      const prevMats = currentPhase.bomMaterials || [];
      setScannedMaterials([]);
    }
  };

  // 顶部状态色
  const isLastPhase = currentPhaseIdx === phases.length - 1;
  const isColdChain = task.routingCode === 'TMJ-PROBIO-CAP-V15';

  // ─────── 任务选择界面 ─────────────────────────────────────
  if (!taskStarted && currentPhaseIdx === 0 && Object.keys(phaseValues).length === 0) {
    return (
      <div style={{ padding: 24, background: '#f5f7fa', minHeight: '100vh' }}>
        {/* 顶部标题栏 */}
        <div style={{
          background: 'linear-gradient(135deg, #c62828 0%, #b71c1c 100%)',
          borderRadius: 8,
          padding: '16px 24px',
          marginBottom: 24,
          color: '#fff',
        }}>
          <div style={{ fontSize: 20, fontWeight: 700 }}>
            天美健MES · 保健品GMP
          </div>
          <div style={{ fontSize: 13, opacity: 0.85, marginTop: 4 }}>
            PAD工序执行中心 — 选择当前工序任务
          </div>
        </div>

        <Row gutter={16}>
          {DEMO_TASKS.map((t, idx) => {
            const key = `${t.routingCode}:${t.opNo}`;
            const cfg = TMJ_OP_PHASE_MAP[key];
            const isCold = t.routingCode === 'TMJ-PROBIO-CAP-V15';
            return (
              <Col span={12} key={idx} style={{ marginBottom: 16 }}>
                <Card
                  hoverable
                  onClick={() => {
                    setSelectedTaskIdx(idx);
                    setCurrentPhaseIdx(0);
                    setCompletedPhases(new Set());
                    setPhaseValues({});
                    setScannedMaterials([]);
                    setTaskStarted(true);
                    startTimer();
                  }}
                  style={{ border: isCold ? '2px solid #1677ff' : '1px solid #f0f0f0' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <Space style={{ marginBottom: 8 }}>
                        <Tag color="red">{t.opNo}</Tag>
                        <Tag color={isCold ? 'blue' : 'green'}>{t.opName}</Tag>
                        {isCold && <Tag color="blue">❄️ 冷链</Tag>}
                      </Space>
                      <div style={{ fontWeight: 700, fontSize: 16 }}>{t.productName}</div>
                      <div style={{ color: '#666', fontSize: 13 }}>{t.productSpec}</div>
                      <div style={{ color: '#666', fontSize: 13, marginTop: 4 }}>
                        批号：{t.batchNo}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: 12, color: '#999' }}>
                      <div>{t.planStartTime}</div>
                      <div style={{ marginTop: 4 }}>~{t.planEndTime}</div>
                      <div style={{ marginTop: 8, fontWeight: 600, color: '#333' }}>
                        操作员：{t.operatorName}
                      </div>
                    </div>
                  </div>
                  <Divider style={{ margin: '12px 0' }} />
                  <div style={{ fontSize: 12, color: '#999' }}>
                    {t.workcenterName} · 计划量：{t.planQty.toLocaleString()} {t.unit}
                    {cfg && <span style={{ marginLeft: 8 }}>共{cfg.phases.length}个执行阶段</span>}
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      </div>
    );
  }

  // ─────── 执行界面 ─────────────────────────────────────────
  return (
    <div style={{ background: '#f0f2f5', minHeight: '100vh' }}>
      {/* ① 顶部红色标题栏 */}
      <div style={{
        background: isColdChain
          ? 'linear-gradient(135deg, #0050b3 0%, #003a8c 100%)'
          : 'linear-gradient(135deg, #c62828 0%, #b71c1c 100%)',
        color: '#fff',
        padding: '10px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 2px 8px rgba(0,0,0,.15)',
      }}>
        {/* 左侧：返回+任务信息 */}
        <Space>
          <Button
            icon={<ArrowLeftOutlined />}
            size="small"
            ghost
            onClick={() => {
              setTaskStarted(false);
              setCurrentPhaseIdx(0);
              setCompletedPhases(new Set());
              setPhaseValues({});
              setScannedMaterials([]);
              setElapsedSeconds(0);
              if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
            }}
          >
            返回
          </Button>
          <Divider type="vertical" style={{ borderColor: 'rgba(255,255,255,0.4)' }} />
          <Space size={4}>
            {isColdChain && <Tag color="cyan">❄️冷链</Tag>}
            <Text style={{ color: '#fff', fontWeight: 700 }}>工单 {task.woNo}</Text>
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>产品：{task.productName}</Text>
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>规格：{task.productSpec}</Text>
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>批号：{task.batchNo}</Text>
          </Space>
        </Space>
        {/* 右侧：操作员+计时 */}
        <Space>
          <Badge color="lime" text={<span style={{ color: '#fff', fontSize: 13 }}>操作员：{task.operatorName}</span>} />
          <Tag color={completedPhases.size >= phases.length - 1 ? 'success' : 'warning'} style={{ fontSize: 13 }}>
            {completedPhases.size}/{phases.length} 阶段
          </Tag>
          <Tag style={{ background: 'rgba(0,0,0,0.2)', color: '#fff', border: 'none' }}>
            <ClockCircleOutlined /> 进入：{formatElapsed(elapsedSeconds)}
          </Tag>
        </Space>
      </div>

      {/* ② 步骤条 */}
      <div style={{ background: '#fff', padding: '12px 20px', borderBottom: '1px solid #f0f0f0', overflowX: 'auto' }}>
        <Steps
          current={currentPhaseIdx}
          size="small"
          items={phases.map((p, idx) => ({
            title: p.phaseName,
            icon: completedPhases.has(idx)
              ? <CheckCircleFilled style={{ color: '#52c41a' }} />
              : idx === currentPhaseIdx
                ? <ThunderboltOutlined style={{ color: isColdChain ? '#1677ff' : '#cf1322' }} />
                : <ClockCircleOutlined style={{ color: '#bfbfbf' }} />,
            status: completedPhases.has(idx) ? 'finish' : idx === currentPhaseIdx ? 'process' : 'wait',
          }))}
        />
      </div>

      {/* 副标题信息行（仿截图第二行） */}
      <div style={{ background: '#fafafa', padding: '6px 20px', borderBottom: '1px solid #f0f0f0', fontSize: 12, color: '#666' }}>
        <Space split={<Divider type="vertical" />}>
          <span>工单 {task.woNo}</span>
          <span>计划 {task.planQty.toLocaleString()} {task.unit}</span>
          <span>车间：{task.workcenterName}</span>
          <span>应用用时：<Text type="warning">{Math.floor(elapsedSeconds / 60)}分钟</Text></span>
        </Space>
      </div>

      {/* ③ 主内容区 */}
      <div style={{ padding: '16px 20px', display: 'flex', gap: 16 }}>
        {/* 当前阶段内容卡 */}
        <div style={{ flex: 1 }}>
          {currentPhase && (
            <>
              {/* 当前阶段标题Banner */}
              <div style={{
                background: isColdChain ? '#e6f4ff' : '#fff7e6',
                border: `1px solid ${isColdChain ? '#91caff' : '#ffd591'}`,
                borderRadius: '8px 8px 0 0',
                padding: '12px 16px',
                marginBottom: 0,
              }}>
                <Space>
                  <Text strong style={{ fontSize: 16 }}>
                    {currentPhase.icon} 当前阶段：{currentPhase.phaseName}（{currentPhaseIdx + 1}/{phases.length}）
                  </Text>
                  {currentPhase.dualSign && <Tag color="error">👥 双人复核</Tag>}
                  {currentPhase.isColdChainCheck && <Tag color="blue">❄️ 冷链管控</Tag>}
                  {completedPhases.has(currentPhaseIdx) && <Tag color="success">✓ 已完成</Tag>}
                </Space>
                <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>
                  {currentPhase.description}
                </div>
              </div>

              <Card
                bodyStyle={{ paddingTop: 20 }}
                style={{ borderRadius: '0 0 8px 8px', borderTop: 'none' }}
              >
                <PhaseContent
                  phase={currentPhase}
                  task={task}
                  values={currentValues}
                  onChange={handleFieldChange}
                  scannedMaterials={scannedMaterials}
                  onMaterialScan={handleMaterialScan}
                  onMockMaterialScan={handleMockMaterialScan}
                  onOpenQC={() => setQcModalOpen(true)}
                />

                {/* 底部操作按钮 */}
                <Divider />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Button
                    icon={<ArrowLeftOutlined />}
                    onClick={handlePrev}
                    disabled={currentPhaseIdx === 0}
                  >
                    上一阶段
                  </Button>

                  <Space>
                    {!completedPhases.has(currentPhaseIdx) && (
                      <Tooltip title={canProceed() ? '' : '请完成所有必填项'}>
                        <Button
                          type="primary"
                          size="large"
                          icon={isLastPhase ? <CheckCircleFilled /> : <ArrowRightOutlined />}
                          onClick={handleNext}
                          disabled={!canProceed()}
                          style={{
                            background: canProceed()
                              ? (isColdChain ? '#1677ff' : '#cf1322')
                              : undefined,
                            borderColor: canProceed()
                              ? (isColdChain ? '#1677ff' : '#cf1322')
                              : undefined,
                          }}
                        >
                          {isLastPhase
                            ? `完成工序：${task.opName}`
                            : `确认${currentPhase.phaseName}，进入下一阶段`}
                        </Button>
                      </Tooltip>
                    )}
                    {completedPhases.has(currentPhaseIdx) && !isLastPhase && (
                      <Button
                        type="primary"
                        icon={<ArrowRightOutlined />}
                        onClick={() => setCurrentPhaseIdx(i => i + 1)}
                      >
                        下一阶段
                      </Button>
                    )}
                  </Space>
                </div>
              </Card>
            </>
          )}
        </div>

        {/* 右侧：已完成阶段列表 */}
        {completedPhases.size > 0 && (
          <div style={{ width: 220, flexShrink: 0 }}>
            <Card
              size="small"
              title={
                <Space>
                  <CheckCircleFilled style={{ color: '#52c41a' }} />
                  <span>已完成阶段（{completedPhases.size}个）</span>
                </Space>
              }
              style={{ position: 'sticky', top: 16 }}
            >
              <Timeline
                items={Array.from(completedPhases).sort((a, b) => a - b).map(idx => ({
                  color: 'green',
                  children: (
                    <div>
                      <Tag
                        color="success"
                        style={{ marginBottom: 4, cursor: 'pointer' }}
                        onClick={() => setCurrentPhaseIdx(idx)}
                      >
                        ✓ {phases[idx]?.phaseName}
                      </Tag>
                    </div>
                  ),
                }))}
              />
              {/* 快速跳转标签 */}
              <Divider style={{ margin: '8px 0' }} />
              <div style={{ fontSize: 12, color: '#999', textAlign: 'center' }}>点击阶段名可快速查看</div>
            </Card>
          </div>
        )}
      </div>

      {/* QC检验Modal */}
      <QCInspectionModal
        open={qcModalOpen}
        onClose={() => setQcModalOpen(false)}
        phase={currentPhase}
        task={task}
        onComplete={() => {
          handleFieldChange('qcCompleted', true);
          message.success('半成品检验记录已存档');
        }}
      />
    </div>
  );
};

export default TMJPadExecutionPage;

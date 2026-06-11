/**
 * QcInspectionModal — QC 检验记录弹窗（独立单据）
 *
 * ════════════════════════════════════════════════════════
 * 业务背景（研磨一 / 超声波清洗）
 * ════════════════════════════════════════════════════════
 *
 * 触发时机：
 *   研磨一（OP-50-GRIND1）自检阶段完成后，触发 QC 检验。
 *   一次操作需顺序生成两张独立单据（互不依赖，关联同一批次号）：
 *
 *   ① 《数控机床成型检验记录》  文件编号：DK/QR-067
 *      检验项：尺寸、外观
 *      检验设备：自动检测仪（扫码绑定）
 *
 *   ② 《根管锉超声波清洗检验记录》  文件编号：DK/QR-119
 *      检验项：外观（洁净/无油污/无碎屑）
 *      生产设备：超声波清洗机（扫码绑定）
 *
 * 单张记录模式（机床成型 OP-10 / 超声波清洗 OP-70 等）：
 *   直接录入对应检验记录，流程简化为单步。
 *
 * 合格数量回写：
 *   所有检验记录提交后，在报工阶段回写合格数量
 *   （QA 检验完成后，合格数量 = min(各行合格数量)）
 * ════════════════════════════════════════════════════════
 */
import React, { useState, useMemo, useCallback } from 'react';
import { printQcRecords } from '../utils/printUtils';
import type { QcRecord as PrintQcRecord, WorkOrderInfo as PrintWoInfo } from '../utils/printUtils';
import {
  Modal, Button, Card, Space, Typography, Tag, Alert, Row, Col,
  Input, Divider, Descriptions, message, InputNumber, Steps, Tooltip,
  Select,
} from 'antd';
import {
  FileTextOutlined, CheckCircleOutlined, ScanOutlined,
  CloseCircleOutlined, PrinterOutlined, DownloadOutlined,
  UserOutlined, InfoCircleOutlined, RightOutlined, SafetyCertificateOutlined,
} from '@ant-design/icons';
import type { WorkOrder } from '../padExecutionData';

const { Text, Title } = Typography;
const { Option } = Select;

// ─── 检验记录模板（按实物纸质单据定义）─────────────────────────────

interface InspectRow {
  key: string;
  opName: string;        // 工序名称
  item: string;          // 检验项目
  std: string;           // 标准要求
  stdParam: string;      // 标准参数
  hasNgDesc?: boolean;   // 是否录入不合格描述
}

interface InspectTemplate {
  title: string;          // 记录标题
  docNo: string;          // 文件编号
  recordPrefix: string;   // 记录编号前缀
  deviceLabel: string;    // 检验设备标签
  deviceDefault: string;  // 默认检测设备（模拟扫码）
  inspectMethod?: string; // 检验方法说明
  sampleRule: string;
  passStandard: string;
  rows: InspectRow[];
}

const TEMPLATES: Record<string, InspectTemplate> = {

  // ══════════════════════════════════════════════════════════════════
  // 数控机床成型检验记录  文件编号：DK/QR-067
  // ══════════════════════════════════════════════════════════════════
  '机床成型检验记录': {
    title: '数控机床成型检验记录',
    docNo: 'DK/QR-067',
    recordPrefix: 'QC-JC-',
    deviceLabel: '检验设备',
    deviceDefault: 'DKZ-010-自动检测仪',
    sampleRule: 'AQL 1.0（II级，正常检验）',
    passStandard: '所有抽检项目均符合《产品技术要求》',
    rows: [
      {
        key: 'size',
        opName: '数控机床成型',
        item: '尺寸',
        std: '依据《产品技术要求》',
        stdParam: '按照规定的型号规格在"自动检测仪"的程序里选择对应参数',
        hasNgDesc: true,
      },
      {
        key: 'appearance',
        opName: '数控机床成型',
        item: '外观',
        std: '依据《产品技术要求》',
        stdParam: '螺纹应均匀，应无缺口、结点等外观缺陷',
        hasNgDesc: true,
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════
  // 根管锉超声波清洗检验记录  文件编号：DK/QR-119
  // ══════════════════════════════════════════════════════════════════
  '超声波清洗检验记录': {
    title: '根管锉超声波清洗检验记录',
    docNo: 'DK/QR-119',
    recordPrefix: 'QC-QX-',
    deviceLabel: '生产设备（超声波清洗机）',
    deviceDefault: 'DKS-059-超声波清洗机',
    inspectMethod: '显微镜目测，全数检验',
    sampleRule: '全数目视检验',
    passStandard: '产品洁净、无油污、无碎屑残留',
    rows: [
      {
        key: 'appearance',
        opName: '超声波清洗',
        item: '外观',
        std: '经超声波清洗后：产品洁净、无油污、无碎屑残留',
        stdParam: '显微镜目测，全数检验',
        hasNgDesc: false,
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════
  // 半成品检验记录（通用，用于其他工序）
  // ══════════════════════════════════════════════════════════════════
  '半成品检验记录': {
    title: '半成品检验记录',
    docNo: 'DK/QR-088',
    recordPrefix: 'QC-BCP-',
    deviceLabel: '检验设备',
    deviceDefault: 'DKZ-005-通用量具',
    sampleRule: 'AQL 2.5（II级，正常检验）',
    passStandard: '所有抽检项目均符合产品技术要求',
    rows: [
      {
        key: 'dimension',
        opName: '半成品检验',
        item: '尺寸',
        std: '依据《产品技术要求》',
        stdParam: '按图纸要求检验关键尺寸',
        hasNgDesc: true,
      },
      {
        key: 'appearance',
        opName: '半成品检验',
        item: '外观',
        std: '依据《产品技术要求》',
        stdParam: '表面无划伤、毛刺、裂纹等缺陷',
        hasNgDesc: true,
      },
    ],
  },
};

// ─── 每行检验数据 ──────────────────────────────────────────────────

interface RowData {
  passQty: number | null;
  ngQty: number | null;
  ngDesc: string;
  result: 'pass' | 'fail' | 'pending';
  inspector: string;
  inspectDate: string;
}

// ─── 单张检验记录完整状态 ──────────────────────────────────────────

interface RecordState {
  recordNo: string;
  sendQty: number | null;
  device: string;
  deviceScanned: boolean;
  rowData: Record<string, RowData>;
  conclusion: '合格' | '不合格' | '';
  qcSign: string;
  reviewSign: string;
  submitted: boolean;
  submittedAt?: string;
}

// ─── Props ────────────────────────────────────────────────────────

interface QcInspectionModalProps {
  open: boolean;
  onClose: () => void;
  workOrder: WorkOrder;
  /** 单张模式：inspectionRecordName 指定单张记录名 */
  inspectionRecordName?: string;
  /** 双记录模式：dualInspectionRecords 指定两张记录名（顺序生成）*/
  dualInspectionRecords?: string[];
  opName: string;
  opCode: string;
  /** 检验完成后回调，用于向报工阶段回写合格数量 */
  onInspectionComplete?: (passQty: number, ngQty: number) => void;
}

// ─── 辅助函数 ─────────────────────────────────────────────────────

const makeRecordNo = (prefix: string) => {
  const d = new Date();
  const dt = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
  return `${prefix}${dt}-${String(Math.floor(Math.random()*999)+1).padStart(3,'0')}`;
};

const initRowData = (template: InspectTemplate, today: string): Record<string, RowData> => {
  const r: Record<string, RowData> = {};
  template.rows.forEach(row => {
    r[row.key] = { passQty: null, ngQty: null, ngDesc: '', result: 'pending', inspector: '', inspectDate: today };
  });
  return r;
};

const QC_INSPECTORS = ['杨梦珂 (QA-001)', '李敏 (QA-002)', '崔娟 (QA-003)', '方治琴 (QA-004)'];
const QC_REVIEWERS  = ['王质量总监 (MGR-01)', '陈品保经理 (MGR-02)'];

// ─── 单张记录录入面板 ─────────────────────────────────────────────

interface SingleRecordFormProps {
  template: InspectTemplate;
  state: RecordState;
  sendQtyGlobal?: number | null; // 来自外部的送检数量（双记录模式共享）
  workOrder: WorkOrder;
  onChange: (patch: Partial<RecordState>) => void;
  onSubmit: () => void;
}

const SingleRecordForm: React.FC<SingleRecordFormProps> = ({
  template, state, sendQtyGlobal, workOrder, onChange, onSubmit,
}) => {
  const today = new Date().toLocaleDateString('zh-CN', { year:'numeric', month:'2-digit', day:'2-digit'}).replace(/\//g,'-');
  const sendQty = sendQtyGlobal ?? state.sendQty;

  const updateRow = (key: string, field: keyof RowData, value: string | number | null) => {
    const newRowData = { ...state.rowData };
    const row = { ...newRowData[key], [field]: value };
    if (field === 'passQty' && sendQty && value !== null) {
      row.ngQty = Math.max(0, sendQty - (value as number));
      row.result = row.ngQty > 0 ? 'fail' : 'pass';
    }
    if (field === 'ngQty' && sendQty && value !== null) {
      row.passQty = Math.max(0, sendQty - (value as number));
      row.result = (value as number) > 0 ? 'fail' : 'pass';
    }
    newRowData[key] = row;
    onChange({ rowData: newRowData });
  };

  const handleScanDevice = () => {
    onChange({ device: template.deviceDefault, deviceScanned: true });
    message.success(`✅ 设备绑定成功：${template.deviceDefault}`);
  };

  const totalPassQty = Math.min(...template.rows.map(r => state.rowData[r.key]?.passQty ?? (sendQty ?? 0)));
  const totalNgQty = (sendQty ?? 0) - totalPassQty;

  if (state.submitted) {
    return (
      <div style={{ textAlign: 'center', padding: '16px 0' }}>
        <CheckCircleOutlined style={{ fontSize: 52, color: '#52c41a' }} />
        <Title level={4} style={{ color: '#52c41a', marginTop: 10, marginBottom: 4 }}>{template.title}</Title>
        <Tag color="magenta" style={{ fontSize: 13, padding: '3px 12px', marginBottom: 12 }}>{state.recordNo}</Tag>
        <Descriptions column={2} size="small" bordered>
          <Descriptions.Item label="文件编号">{template.docNo}</Descriptions.Item>
          <Descriptions.Item label="半成品批号">{workOrder.batchNo}</Descriptions.Item>
          <Descriptions.Item label="送检数量">{sendQty} 支</Descriptions.Item>
          <Descriptions.Item label="合格数量"><Text style={{ color: '#52c41a', fontWeight: 700 }}>{totalPassQty} 支</Text></Descriptions.Item>
          {totalNgQty > 0 && <Descriptions.Item label="不合格数量" span={2}><Text type="danger" strong>{totalNgQty} 支</Text></Descriptions.Item>}
          <Descriptions.Item label="检验设备" span={2}>{state.device}</Descriptions.Item>
          <Descriptions.Item label="检验结论" span={2}>
            <Tag color={state.conclusion === '合格' ? 'success' : 'error'} style={{ fontSize: 13 }}>
              {state.conclusion === '合格' ? '✅ 本批次产品符合产品技术要求' : '❌ 本批次不合格'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="检验员">{state.qcSign}</Descriptions.Item>
          <Descriptions.Item label="复核">{state.reviewSign || '—'}</Descriptions.Item>
          <Descriptions.Item label="生成时间" span={2}>{state.submittedAt}</Descriptions.Item>
        </Descriptions>
        <Alert
          type="success" showIcon style={{ marginTop: 12, fontSize: 12 }}
          message={`本记录已独立存档（${template.docNo}），关联批次号 ${workOrder.batchNo}，不纳入当前工序批记录。`}
        />
      </div>
    );
  }

  return (
    <div>
      {/* 产品信息 */}
      <Card size="small" title={<Text strong style={{ fontSize: 12 }}>① 产品信息</Text>}
        style={{ marginBottom: 10, borderRadius: 8, background: '#f0f7ff', border: '1px solid #bae0ff' }}>
        <Row gutter={[12, 6]}>
          <Col span={8}><Text type="secondary" style={{ fontSize: 12 }}>产品名称：</Text><Text strong style={{ fontSize: 12 }}>机用根管锉</Text></Col>
          <Col span={8}><Text type="secondary" style={{ fontSize: 12 }}>型号/规格：</Text><Text strong style={{ fontSize: 12, fontFamily: 'monospace' }}>{workOrder.productSpec}</Text></Col>
          <Col span={8}><Text type="secondary" style={{ fontSize: 12 }}>产品长度：</Text><Text strong style={{ fontSize: 12 }}>{workOrder.productSpec?.includes('15') ? '16mm' : '19mm'}</Text></Col>
          <Col span={8}><Text type="secondary" style={{ fontSize: 12 }}>半成品批号：</Text><Text strong style={{ fontSize: 12, fontFamily: 'monospace' }}>{workOrder.batchNo}</Text></Col>
          <Col span={8}>
            <Text type="secondary" style={{ fontSize: 12 }}>送检数量（支）：</Text>
            {sendQtyGlobal != null ? (
              <Text strong style={{ fontSize: 12, color: '#1677ff' }}>{sendQtyGlobal}</Text>
            ) : (
              <InputNumber size="small" min={1} max={9999} style={{ width: 90 }}
                value={state.sendQty ?? undefined} onChange={v => onChange({ sendQty: v ?? null })} placeholder="请填写" />
            )}
          </Col>
          {template.inspectMethod && (
            <Col span={8}><Text type="secondary" style={{ fontSize: 12 }}>检验方法：</Text><Text strong style={{ fontSize: 12 }}>{template.inspectMethod}</Text></Col>
          )}
        </Row>
      </Card>

      {/* 检测设备绑定 */}
      <Card size="small" title={<Text strong style={{ fontSize: 12 }}>② {template.deviceLabel}（必须扫码绑定）</Text>}
        style={{ marginBottom: 10, borderRadius: 8 }}>
        <Space size={10} wrap>
          <Input size="middle" style={{ width: 300, fontFamily: 'monospace', fontSize: 12 }}
            placeholder={`扫码绑定 ${template.deviceLabel}`}
            value={state.device} onChange={e => onChange({ device: e.target.value })} prefix={<ScanOutlined />} />
          <Button icon={<ScanOutlined />} onClick={handleScanDevice}>模拟扫码</Button>
          {state.deviceScanned && <Tag color="success" style={{ fontSize: 11 }}>✓ 已绑定 | {state.device}</Tag>}
        </Space>
        {!state.deviceScanned && (
          <Alert type="warning" showIcon style={{ marginTop: 8, fontSize: 11 }}
            message="检验设备信息将关联到本检验记录，请务必扫码绑定" />
        )}
      </Card>

      {/* 检验项目表 */}
      <Card size="small" title={<Text strong style={{ fontSize: 12 }}>③ 检验项目录入</Text>}
        style={{ marginBottom: 10, borderRadius: 8 }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                {['工序名称','检验项目','标准要求','标准参数','合格数量','不合格数量及描述','检验员','检验日期'].map(h => (
                  <th key={h} style={{ border:'1px solid #d9d9d9', padding:'6px 8px', fontWeight:600, whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {template.rows.map(row => {
                const d = state.rowData[row.key] || { passQty:null, ngQty:null, ngDesc:'', result:'pending', inspector:'', inspectDate: today };
                return (
                  <tr key={row.key}>
                    <td style={{ border:'1px solid #d9d9d9', padding:'8px', whiteSpace:'nowrap', fontWeight:500 }}>{row.opName}</td>
                    <td style={{ border:'1px solid #d9d9d9', padding:'8px', whiteSpace:'nowrap' }}>
                      <Tag color={row.key === 'size' || row.key === 'dimension' ? 'blue' : 'purple'}>{row.item}</Tag>
                    </td>
                    <td style={{ border:'1px solid #d9d9d9', padding:'8px', maxWidth:120 }}>
                      <Text style={{ fontSize:11 }}>{row.std}</Text>
                    </td>
                    <td style={{ border:'1px solid #d9d9d9', padding:'8px', maxWidth:160 }}>
                      <Text style={{ fontSize:11, color:'#1677ff' }}>{row.stdParam}</Text>
                    </td>
                    <td style={{ border:'1px solid #d9d9d9', padding:'8px', textAlign:'center' }}>
                      <InputNumber size="small" min={0} max={sendQty ?? 9999} style={{ width:70 }}
                        value={d.passQty ?? undefined}
                        onChange={v => updateRow(row.key, 'passQty', v ?? null)}
                        placeholder="合格数" />
                    </td>
                    <td style={{ border:'1px solid #d9d9d9', padding:'8px', minWidth:140 }}>
                      <Space direction="vertical" size={4} style={{ width:'100%' }}>
                        <Space size={4}>
                          <Text style={{ fontSize:11 }}>不合格：</Text>
                          <InputNumber size="small" min={0} max={sendQty ?? 9999} style={{ width:60 }}
                            value={d.ngQty ?? undefined}
                            onChange={v => updateRow(row.key, 'ngQty', v ?? null)} />
                          <Text style={{ fontSize:11 }}>支</Text>
                        </Space>
                        {row.hasNgDesc && (d.ngQty ?? 0) > 0 && (
                          <Input size="small" placeholder="描述不合格情况（如：外径偏大 5）"
                            style={{ fontSize:11 }} value={d.ngDesc}
                            onChange={e => updateRow(row.key, 'ngDesc', e.target.value)} />
                        )}
                        {d.result !== 'pending' && (
                          <Tag color={d.result === 'pass' ? 'success' : 'error'} style={{ fontSize:10 }}>
                            {d.result === 'pass' ? '✓ 合格' : '✗ 不合格'}
                          </Tag>
                        )}
                      </Space>
                    </td>
                    <td style={{ border:'1px solid #d9d9d9', padding:'8px' }}>
                      <Select size="small" style={{ width:120 }} placeholder="选择检验员"
                        value={d.inspector || undefined}
                        onChange={v => updateRow(row.key, 'inspector', v)}
                        getPopupContainer={t => t.parentElement || document.body}>
                        {QC_INSPECTORS.map(n => <Option key={n} value={n}><UserOutlined style={{ marginRight:4 }} />{n}</Option>)}
                      </Select>
                    </td>
                    <td style={{ border:'1px solid #d9d9d9', padding:'8px', whiteSpace:'nowrap' }}>
                      <Text style={{ fontSize:11, fontFamily:'monospace' }}>{d.inspectDate}</Text>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 汇总 */}
        {(sendQty ?? 0) > 0 && (
          <div style={{ marginTop:10, padding:'8px 12px', background:'#f6ffed', border:'1px solid #b7eb8f', borderRadius:6 }}>
            <Space size={24}>
              <span style={{ fontSize:12 }}>送检数量：<Text strong>{sendQty}</Text> 支</span>
              <span style={{ fontSize:12 }}>合格数量：<Text strong style={{ color:'#52c41a' }}>{totalPassQty}</Text> 支</span>
              {totalNgQty > 0 && <span style={{ fontSize:12 }}>不合格：<Text strong style={{ color:'#ff4d4f' }}>{totalNgQty}</Text> 支</span>}
              <span style={{ fontSize:12 }}>合格率：<Text strong style={{ color:'#1677ff' }}>
                {sendQty ? ((totalPassQty / sendQty) * 100).toFixed(1) : 0}%
              </Text></span>
            </Space>
          </div>
        )}
      </Card>

      {/* 检验结论 & 签名 */}
      <Card size="small" title={<Text strong style={{ fontSize: 12 }}>④ 检验结论 & 签名</Text>}
        style={{ marginBottom: 10, borderRadius: 8 }}>
        <div style={{ marginBottom:12 }}>
          <Text style={{ fontSize:12, fontWeight:600 }}>检验结论：</Text>
          <div style={{ marginTop:8, display:'flex', gap:12 }}>
            <Button size="large" type={state.conclusion === '合格' ? 'primary' : 'default'}
              style={state.conclusion === '合格' ? { background:'#52c41a', borderColor:'#52c41a', minWidth:200, height:48 } : { minWidth:200, height:48 }}
              onClick={() => onChange({ conclusion: '合格' })}>
              ✅ 本批次产品符合产品技术要求
            </Button>
            <Button size="large" danger type={state.conclusion === '不合格' ? 'primary' : 'default'}
              style={{ minWidth:140, height:48 }}
              onClick={() => onChange({ conclusion: '不合格' })}>
              ❌ 本批次不合格
            </Button>
          </div>
        </div>
        <Divider style={{ margin:'12px 0' }} />
        <Row gutter={[16, 12]}>
          <Col span={12}>
            <Text style={{ fontSize:12 }}>检验员签名 <Tag color="red" style={{ fontSize:9 }}>必填</Tag></Text>
            <Select size="middle" style={{ width:'100%', marginTop:6 }} placeholder="选择检验员"
              value={state.qcSign || undefined} onChange={v => onChange({ qcSign: v })}
              getPopupContainer={t => t.parentElement || document.body}>
              {QC_INSPECTORS.map(n => <Option key={n} value={n}><UserOutlined style={{ marginRight:4 }} />{n}</Option>)}
            </Select>
          </Col>
          <Col span={12}>
            <Text style={{ fontSize:12 }}>审核签名</Text>
            <Select size="middle" style={{ width:'100%', marginTop:6 }} placeholder="审核人员（选填）"
              value={state.reviewSign || undefined} onChange={v => onChange({ reviewSign: v })}
              getPopupContainer={t => t.parentElement || document.body}>
              {QC_REVIEWERS.map(n => <Option key={n} value={n}><UserOutlined style={{ marginRight:4 }} />{n}</Option>)}
            </Select>
          </Col>
        </Row>
      </Card>

      <Alert type="info" showIcon style={{ marginBottom:12, fontSize:11 }} icon={<InfoCircleOutlined />}
        message={
          <span>
            本记录为<strong>独立存档</strong>单据（{template.docNo}），<strong>不纳入当前工序批记录</strong>，
            但关联批次号 <Text code style={{ fontSize:11 }}>{workOrder.batchNo}</Text>。
          </span>
        } />

      <Button type="primary" size="large" block icon={<FileTextOutlined />}
        style={{ height:48, fontSize:14, fontWeight:700, background:'#eb2f96', borderColor:'#eb2f96' }}
        disabled={!state.deviceScanned || !(sendQty) || !state.conclusion || !state.qcSign ||
          !template.rows.every(r => state.rowData[r.key]?.passQty !== null && state.rowData[r.key]?.inspector)}
        onClick={onSubmit}>
        生成《{template.title}》
      </Button>
    </div>
  );
};

// ─── 主组件 ──────────────────────────────────────────────────────

const QcInspectionModal: React.FC<QcInspectionModalProps> = ({
  open, onClose, workOrder, inspectionRecordName, dualInspectionRecords,
  opName, opCode, onInspectionComplete,
}) => {

  // 确定记录列表
  const recordNames = useMemo(() => {
    if (dualInspectionRecords && dualInspectionRecords.length > 0) return dualInspectionRecords;
    return [inspectionRecordName || '半成品检验记录'];
  }, [dualInspectionRecords, inspectionRecordName]);

  const isDual = recordNames.length > 1;

  const today = new Date().toLocaleDateString('zh-CN', { year:'numeric', month:'2-digit', day:'2-digit'}).replace(/\//g,'-');

  // 当前处于哪张记录（双记录模式用）
  const [activeIdx, setActiveIdx] = useState(0);

  // 共享的送检数量（双记录模式第一张填写后，第二张复用）
  const [sharedSendQty, setSharedSendQty] = useState<number | null>(null);

  // 每张记录的状态
  const initRecord = useCallback((name: string): RecordState => {
    const tmpl = TEMPLATES[name] ?? TEMPLATES['半成品检验记录'];
    return {
      recordNo: makeRecordNo(tmpl.recordPrefix),
      sendQty: null,
      device: '',
      deviceScanned: false,
      rowData: initRowData(tmpl, today),
      conclusion: '',
      qcSign: '',
      reviewSign: '',
      submitted: false,
    };
  }, [today]);

  const [records, setRecords] = useState<RecordState[]>(() => recordNames.map(n => initRecord(n)));

  // 全部重置
  const resetAll = useCallback(() => {
    setActiveIdx(0);
    setSharedSendQty(null);
    setRecords(recordNames.map(n => initRecord(n)));
  }, [recordNames, initRecord]);

  const updateRecord = (idx: number, patch: Partial<RecordState>) => {
    setRecords(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], ...patch };
      return next;
    });
    // 双记录模式：第一张的 sendQty 共享给第二张
    if (isDual && idx === 0 && patch.sendQty !== undefined) {
      setSharedSendQty(patch.sendQty ?? null);
    }
  };

  const handleSubmitRecord = (idx: number) => {
    const rec = records[idx];
    const tmpl = TEMPLATES[recordNames[idx]] ?? TEMPLATES['半成品检验记录'];
    const sendQty = isDual ? sharedSendQty : rec.sendQty;

    // Validate
    if (!rec.deviceScanned) { message.warning('请先绑定检测设备'); return; }
    if (!sendQty || sendQty <= 0) { message.warning('请填写送检数量'); return; }
    const allFilled = tmpl.rows.every(r => {
      const d = rec.rowData[r.key];
      return d && d.passQty !== null && d.inspector;
    });
    if (!allFilled) { message.warning('请完善所有检验行的合格数量和检验员'); return; }
    if (!rec.conclusion) { message.warning('请填写检验结论'); return; }
    if (!rec.qcSign) { message.warning('请检验员签名'); return; }

    const now = new Date().toLocaleString('zh-CN');
    updateRecord(idx, { submitted: true, submittedAt: now });
    message.success({ content: `✅ 《${tmpl.title}》已生成，记录编号：${rec.recordNo}`, duration: 5 });

    // 如果双记录模式且这是最后一张，触发完成回调
    if (isDual && idx === recordNames.length - 1) {
      const totalPassQty = Math.min(...tmpl.rows.map(r => rec.rowData[r.key]?.passQty ?? (sendQty ?? 0)));
      const totalNgQty = (sendQty ?? 0) - totalPassQty;
      onInspectionComplete?.(totalPassQty, totalNgQty);
    }

    // 自动切换到下一张（双记录模式）
    if (isDual && idx < recordNames.length - 1) {
      setTimeout(() => setActiveIdx(idx + 1), 800);
    }
  };

  const allSubmitted = records.every(r => r.submitted);

  // ─── Steps（双记录模式） ────────────────────────────────────────
  const stepsItems = isDual ? recordNames.map((name, i) => {
    const tmpl = TEMPLATES[name] ?? TEMPLATES['半成品检验记录'];
    return {
      title: <span style={{ fontSize:12 }}>{tmpl.title}</span>,
      description: <Text type="secondary" style={{ fontSize:11 }}>{tmpl.docNo}</Text>,
      status: records[i].submitted ? 'finish' : i === activeIdx ? 'process' : 'wait' as 'finish' | 'process' | 'wait',
      icon: records[i].submitted ? <CheckCircleOutlined /> : undefined,
    };
  }) : [];

  // ─── 全部完成视图 ────────────────────────────────────────────────
  if (allSubmitted) {
    return (
      <Modal open={open}
        onCancel={() => { resetAll(); onClose(); }}
        title={<Space><SafetyCertificateOutlined style={{ color:'#52c41a' }} /><span>QC检验记录已全部生成</span></Space>}
        width={600} centered
        footer={
          <Space>
            <Button icon={<PrinterOutlined />} onClick={() => {
              const woInfo: PrintWoInfo = {
                productName: workOrder.productName,
                productSpec: workOrder.productSpec,
                batchNo: workOrder.batchNo,
                woNo: workOrder.woNo,
                planQty: workOrder.planQty,
              };
              const printRecords: PrintQcRecord[] = records.map((rec, i) => {
                const tmpl = TEMPLATES[recordNames[i]] ?? TEMPLATES['半成品检验记录'];
                const sendQty = isDual && i > 0 ? sharedSendQty : rec.sendQty;
                return {
                  recordNo: rec.recordNo,
                  title: tmpl.title,
                  docNo: tmpl.docNo,
                  deviceLabel: tmpl.deviceLabel,
                  device: rec.device,
                  sampleRule: tmpl.sampleRule,
                  passStandard: tmpl.passStandard,
                  inspectMethod: tmpl.inspectMethod,
                  sendQty,
                  conclusion: rec.conclusion,
                  qcSign: rec.qcSign,
                  reviewSign: rec.reviewSign,
                  submittedAt: rec.submittedAt,
                  rows: tmpl.rows.map(row => ({
                    key: row.key,
                    opName: row.opName,
                    item: row.item,
                    std: row.std,
                    stdParam: row.stdParam,
                    data: rec.rowData[row.key] ?? { passQty: null, ngQty: null, ngDesc: '', result: 'pending' as const, inspector: '', inspectDate: '' },
                  })),
                };
              });
              printQcRecords(printRecords, woInfo);
            }}>打印全部记录</Button>
            <Button icon={<DownloadOutlined />} onClick={() => {
              message.info('请在打印对话框中选择"另存为PDF"即可导出PDF');
              const woInfo: PrintWoInfo = {
                productName: workOrder.productName,
                productSpec: workOrder.productSpec,
                batchNo: workOrder.batchNo,
                woNo: workOrder.woNo,
                planQty: workOrder.planQty,
              };
              const printRecords: PrintQcRecord[] = records.map((rec, i) => {
                const tmpl = TEMPLATES[recordNames[i]] ?? TEMPLATES['半成品检验记录'];
                const sendQty = isDual && i > 0 ? sharedSendQty : rec.sendQty;
                return {
                  recordNo: rec.recordNo,
                  title: tmpl.title,
                  docNo: tmpl.docNo,
                  deviceLabel: tmpl.deviceLabel,
                  device: rec.device,
                  sampleRule: tmpl.sampleRule,
                  passStandard: tmpl.passStandard,
                  inspectMethod: tmpl.inspectMethod,
                  sendQty,
                  conclusion: rec.conclusion,
                  qcSign: rec.qcSign,
                  reviewSign: rec.reviewSign,
                  submittedAt: rec.submittedAt,
                  rows: tmpl.rows.map(row => ({
                    key: row.key,
                    opName: row.opName,
                    item: row.item,
                    std: row.std,
                    stdParam: row.stdParam,
                    data: rec.rowData[row.key] ?? { passQty: null, ngQty: null, ngDesc: '', result: 'pending' as const, inspector: '', inspectDate: '' },
                  })),
                };
              });
              setTimeout(() => printQcRecords(printRecords, woInfo), 400);
            }}>导出 PDF</Button>
            <Button type="primary" onClick={() => { resetAll(); onClose(); }}>关闭</Button>
          </Space>
        }>
        <div style={{ textAlign:'center', padding:'16px 0 8px' }}>
          <SafetyCertificateOutlined style={{ fontSize:56, color:'#52c41a' }} />
          <Title level={4} style={{ color:'#52c41a', marginTop:10, marginBottom:4 }}>
            {isDual ? '两张独立检验记录均已生成' : '检验记录已生成'}
          </Title>
        </div>
        <Space direction="vertical" style={{ width:'100%' }} size={12}>
          {records.map((rec, i) => {
            const tmpl = TEMPLATES[recordNames[i]] ?? TEMPLATES['半成品检验记录'];
            const sendQty = isDual && i > 0 ? sharedSendQty : rec.sendQty;
            const totalPassQty = Math.min(...tmpl.rows.map(r => rec.rowData[r.key]?.passQty ?? (sendQty ?? 0)));
            return (
              <Card key={i} size="small" style={{ borderColor:'#b7eb8f', background:'#f6ffed' }}>
                <Row justify="space-between" align="middle">
                  <Col>
                    <Text strong style={{ fontSize:13 }}>{tmpl.title}</Text>
                    <Tag color="magenta" style={{ marginLeft:8, fontSize:11 }}>{rec.recordNo}</Tag>
                  </Col>
                  <Col>
                    <Tag color="success">✓ 已存档</Tag>
                  </Col>
                </Row>
                <Row gutter={16} style={{ marginTop:6 }}>
                  <Col><Text type="secondary" style={{ fontSize:12 }}>送检：{sendQty} 支</Text></Col>
                  <Col><Text style={{ fontSize:12, color:'#52c41a' }}>合格：{totalPassQty} 支</Text></Col>
                  <Col><Text type="secondary" style={{ fontSize:12 }}>检验员：{rec.qcSign.split('(')[0]}</Text></Col>
                  <Col><Text type="secondary" style={{ fontSize:12 }}>时间：{rec.submittedAt}</Text></Col>
                </Row>
              </Card>
            );
          })}
        </Space>
        <Alert type="info" showIcon style={{ marginTop:12, fontSize:12 }}
          message={
            <span>
              以上记录均已<strong>独立存档</strong>，关联批次号 <Text code style={{ fontSize:11 }}>{workOrder.batchNo}</Text>，不纳入批记录。
              {isDual && ' QA检验完成后，请将合格数量回写至报工阶段。'}
            </span>
          } />
      </Modal>
    );
  }

  const activeName = recordNames[activeIdx];
  const activeTemplate = TEMPLATES[activeName] ?? TEMPLATES['半成品检验记录'];

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={
        <Space>
          <FileTextOutlined style={{ color:'#eb2f96' }} />
          <span style={{ fontWeight:700 }}>
            {isDual ? `QC检验记录（${activeIdx + 1}/${recordNames.length}）` : activeTemplate.title}
          </span>
          <Tag color="magenta" style={{ fontSize:11 }}>{activeTemplate.docNo}</Tag>
          <Tag color="blue" style={{ fontSize:11 }}>{records[activeIdx].recordNo}</Tag>
          {isDual && <Tag color="orange" style={{ fontSize:11 }}>双单据流程</Tag>}
        </Space>
      }
      width={860}
      centered
      footer={null}
      styles={{ body: { maxHeight:'82vh', overflowY:'auto', padding:'0 20px 16px' } }}
    >
      {/* 双记录模式进度条 */}
      {isDual && (
        <div style={{ marginTop:14, marginBottom:14 }}>
          <Steps size="small" current={activeIdx} items={stepsItems} />
          <Alert type="warning" showIcon style={{ marginTop:10, fontSize:11 }}
            message={
              <span>
                <strong>双单据流程：</strong>请依次完成两张独立检验记录。
                第{activeIdx + 1}张：<Text strong>{activeTemplate.title}</Text>
                {activeIdx === 0 && ' → 完成后自动进入第2张'}
              </span>
            } />
        </div>
      )}

      {/* 单张记录表单 */}
      <SingleRecordForm
        key={activeName + activeIdx}
        template={activeTemplate}
        state={records[activeIdx]}
        sendQtyGlobal={isDual && activeIdx > 0 ? sharedSendQty : undefined}
        workOrder={workOrder}
        onChange={patch => updateRecord(activeIdx, patch)}
        onSubmit={() => handleSubmitRecord(activeIdx)}
      />

      {/* 双记录模式：手动切换已完成的记录（查看） */}
      {isDual && records.some(r => r.submitted) && (
        <div style={{ marginTop:12 }}>
          <Divider style={{ margin:'10px 0', fontSize:12 }}>已完成记录</Divider>
          <Space wrap>
            {records.map((rec, i) => rec.submitted && (
              <Button key={i} size="small" type={activeIdx === i ? 'primary' : 'default'}
                icon={<CheckCircleOutlined />}
                onClick={() => setActiveIdx(i)}
                disabled={!rec.submitted && i !== activeIdx}>
                {TEMPLATES[recordNames[i]]?.title}（已完成）
              </Button>
            ))}
          </Space>
        </div>
      )}
    </Modal>
  );
};

export default QcInspectionModal;

/**
 * EbrEnhancedPage.tsx — 电子批记录（增强版）
 * ================================================================
 * 5类EBR模板：批包装指令 / 岗位生产记录 / 清场记录 / 物料平衡表 / QA监控记录
 * 三级电子签名：操作人 → 复核人 → QA归档
 * 工序节点自动关联EBR模板
 * ================================================================
 */
import React, { useState, useMemo } from 'react';
import {
  Table, Tag, Space, Badge, Button, Modal, Tabs, Alert, Row, Col, Card,
  Steps, Descriptions, Typography, Divider, Input, Select, Timeline,
  Tooltip, Progress, Checkbox, message, Form,
} from 'antd';
import {
  FileDoneOutlined, FileTextOutlined, SafetyCertificateOutlined,
  CheckCircleOutlined, ClockCircleOutlined, UserOutlined, TeamOutlined,
  AuditOutlined, PlusOutlined, EyeOutlined, DownloadOutlined,
  WarningOutlined, ThunderboltOutlined, ExperimentOutlined,
  PrinterOutlined, LockOutlined, UnlockOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useLocalStorage } from '../../hooks/useLocalStorage';

const { Text, Title } = Typography;
const { TextArea } = Input;

// ── EBR模板类型 ─────────────────────────────────────────────────
export type EbrTemplateType =
  | 'BATCH_PKG'     // 批包装指令
  | 'PROD_RECORD'   // 岗位生产记录
  | 'CLEANUP'       // 清场记录
  | 'MAT_BALANCE'   // 物料平衡表
  | 'QA_MONITOR';   // QA监控记录

export type EbrStatus =
  | 'DRAFT'        // 草稿（工序开始自动创建）
  | 'IN_PROGRESS'  // 填写中
  | 'OPERATOR_SIGNED'  // 操作人已签名
  | 'CHECKER_SIGNED'   // 复核人已签名
  | 'QA_ARCHIVED';     // QA归档（最终状态）

// EBR主记录
export interface EbrRecord {
  id: string;
  ebrCode: string;            // EBR编号
  woCode: string;             // 关联工单
  batchNo: string;
  productName: string;
  routingCode: string;
  opCode: string;
  opName: string;
  workshop: string;
  templateType: EbrTemplateType;
  status: EbrStatus;
  startTime: string;
  endTime?: string;
  // 签名
  operatorName?: string;
  operatorSignTime?: string;
  checkerName?: string;
  checkerSignTime?: string;
  qaName?: string;
  qaArchiveTime?: string;
  qaComment?: string;
  // 内容（简化：关键数据点）
  keyDataPoints: Record<string, string>;  // 参数名 → 值
  anomalies?: string;         // 异常记录
  attachments?: string[];     // 附件
}

// EBR模板配置
const EBR_TEMPLATE_CFG: Record<EbrTemplateType, {
  label: string;
  color: string;
  icon: React.ReactNode;
  desc: string;
  sections: string[];  // 必填章节
}> = {
  BATCH_PKG: {
    label: '批包装指令', color: '#1677FF', icon: <FileDoneOutlined />,
    desc: '生产前发布的批包装作业指令，含产品信息/工艺参数/设备清单',
    sections: ['产品信息', '批量/处方', '工艺参数', '使用设备', '起始物料', 'QA审核'],
  },
  PROD_RECORD: {
    label: '岗位生产记录', color: '#52C41A', icon: <FileTextOutlined />,
    desc: '各工序操作过程实时记录，含设备参数/QC数据/异常处理',
    sections: ['工序信息', '设备状态', '过程参数', 'QC检测结果', '异常记录', '工序完成确认'],
  },
  CLEANUP: {
    label: '清场记录', color: '#FA8C16', icon: <SafetyCertificateOutlined />,
    desc: '批次完工清场8项检查记录及合格证',
    sections: ['清场前状态', '8项检查清单', '清洁剂使用', '清场结论', '合格证信息'],
  },
  MAT_BALANCE: {
    label: '物料平衡表', color: '#722ED1', icon: <ExperimentOutlined />,
    desc: '全批次物料投入/产出/损耗平衡计算，标准96%~102%',
    sections: ['投入物料', '产出统计', '损耗分析', '平衡率计算', 'QA批准'],
  },
  QA_MONITOR: {
    label: 'QA监控记录', color: '#E60012', icon: <AuditOutlined />,
    desc: 'QA现场监控记录，含关键工序CCP监控/偏差/CAPA',
    sections: ['监控计划', 'CCP监控记录', '偏差登记', 'CAPA跟踪', '批次评价'],
  },
};

const EBR_STATUS_CFG: Record<EbrStatus, { label: string; color: string }> = {
  DRAFT:           { label: '草稿',     color: '#8C8C8C' },
  IN_PROGRESS:     { label: '填写中',   color: '#1677FF' },
  OPERATOR_SIGNED: { label: '操作人已签', color: '#722ED1' },
  CHECKER_SIGNED:  { label: '复核人已签', color: '#FA8C16' },
  QA_ARCHIVED:     { label: 'QA已归档', color: '#52C41A' },
};

// ── Mock EBR数据 ──────────────────────────────────────────────────
const now = new Date();
const ts = (h: number) => new Date(now.getTime() - h * 3600000).toISOString().slice(0, 16).replace('T', ' ');

const INITIAL_EBRS: EbrRecord[] = [
  {
    id: 'EBR-001', ebrCode: 'EBR-20260612-NJ-001',
    woCode: 'WO-NJ-20260612-001', batchNo: 'BN-20260612-001',
    productName: '维C咀嚼片', routingCode: 'NJ-GD-TAB-001',
    opCode: 'GD-05', opName: '压片（瓶颈工序）',
    workshop: '南京工厂·固体车间', templateType: 'PROD_RECORD',
    status: 'QA_ARCHIVED',
    startTime: ts(8), endTime: ts(0.5),
    operatorName: '王建国', operatorSignTime: ts(1.2),
    checkerName: '赵明辉', checkerSignTime: ts(1.0),
    qaName: '孔翠萍(QA)', qaArchiveTime: ts(0.5), qaComment: '压片参数正常，物料平衡合格，批次放行。',
    keyDataPoints: {
      '压片机型号': 'GZPS-83（83冲）',
      '压片速度': '72000片/min',
      '片重标准': '0.50g±7.5%',
      '实测片重（首件）': '0.502g', '实测片重（末件）': '0.499g',
      '硬度（首件）': '62N', '硬度（末件）': '65N',
      '脆碎度': '0.42%',
      '压片总量': '120kg → 240000片',
      'IPQC结果': '全部合格',
    },
  },
  {
    id: 'EBR-002', ebrCode: 'EBR-20260612-NJ-002',
    woCode: 'WO-NJ-20260612-001', batchNo: 'BN-20260612-001',
    productName: '维C咀嚼片', routingCode: 'NJ-GD-TAB-001',
    opCode: 'ALL', opName: '全批次',
    workshop: '南京工厂·固体车间', templateType: 'MAT_BALANCE',
    status: 'QA_ARCHIVED',
    startTime: ts(0.8), endTime: ts(0.3),
    operatorName: '王建国', operatorSignTime: ts(0.6),
    checkerName: '赵明辉', checkerSignTime: ts(0.5),
    qaName: '孔翠萍(QA)', qaArchiveTime: ts(0.3), qaComment: '物料平衡率98.42%，在标准范围内，批次放行。',
    keyDataPoints: {
      '理论产出量': '100.00kg',
      '实际投入量': '102.50kg',
      '实际产出量（铝塑板）': '98.45kg',
      '废品量': '0.32kg',
      '样品量': '0.50kg',
      '清场残余量': '1.23kg',
      '物料平衡率': '98.42%',
      '是否合格': '✓ 合格（标准96%~102%）',
    },
  },
  {
    id: 'EBR-003', ebrCode: 'EBR-20260612-NJ-003',
    woCode: 'WO-NJ-20260612-002', batchNo: 'BN-20260612-002',
    productName: '钙维生素D软胶囊', routingCode: 'NJ-RN-SGC-001',
    opCode: 'RN-03', opName: '压丸（瓶颈工序）',
    workshop: '南京工厂·软胶囊车间', templateType: 'PROD_RECORD',
    status: 'CHECKER_SIGNED',
    startTime: ts(3), endTime: ts(0.2),
    operatorName: '赵明辉', operatorSignTime: ts(0.8),
    checkerName: '李梅', checkerSignTime: ts(0.5),
    keyDataPoints: {
      '软胶囊机型号': 'YWJ250-IIIA',
      '压丸速度': '23万粒/h',
      '装量差异（首件）': '±3.2%',
      '胶皮厚度（首件）': '0.76mm',
      '压丸总量': '约22.5万粒',
      '不合格品数量': '185粒（外观异形）',
    },
  },
  {
    id: 'EBR-004', ebrCode: 'EBR-20260612-LS-001',
    woCode: 'WO-LS-20260612-003', batchNo: 'BN-20260612-003',
    productName: '葡萄糖酸锌口服液', routingCode: 'LS-YQ-LIQ-001',
    opCode: 'YQ-04', opName: '灭菌（关键控制点）',
    workshop: '溧水工厂·液体车间', templateType: 'QA_MONITOR',
    status: 'OPERATOR_SIGNED',
    startTime: ts(4), endTime: ts(1),
    operatorName: '孙建国', operatorSignTime: ts(1.5),
    keyDataPoints: {
      '灭菌系统': 'SG-2.0（2000L）',
      '灭菌温度（目标）': '121~123℃',
      '灭菌温度（实测）': '121.8℃',
      '灭菌时间': '20分钟',
      '🔑 F0值（实测）': '12.4min（✓ ≥8min合格）',
      'F0数据来源': 'Modbus TCP实时采集',
      'Eurotherm算法版本': 'v3.2.1',
    },
    anomalies: '无偏差',
  },
  {
    id: 'EBR-005', ebrCode: 'EBR-20260612-NJ-005',
    woCode: 'WO-NJ-20260612-002', batchNo: 'BN-20260612-002',
    productName: '钙维生素D软胶囊', routingCode: 'NJ-RN-SGC-001',
    opCode: 'RN-01', opName: '化胶',
    workshop: '南京工厂·软胶囊车间', templateType: 'PROD_RECORD',
    status: 'IN_PROGRESS',
    startTime: ts(5),
    keyDataPoints: {
      '化胶罐型号': 'ZHJG-1',
      '明胶批号': 'GEL-20260601-001',
      '明胶用量': '150kg',
      '甘油用量': '45kg',
      '化胶温度': '65℃（持续记录）',
      '粘度检测': '待完成',
    },
  },
];

// ── EBR详情 Modal ─────────────────────────────────────────────────
const EbrDetailModal: React.FC<{
  ebr: EbrRecord | null;
  onClose: () => void;
  onUpdate: (ebr: EbrRecord) => void;
}> = ({ ebr, onClose, onUpdate }) => {
  const [signerName, setSignerName] = useState('');
  const [qaComment, setQaComment] = useState(ebr?.qaComment ?? '');

  if (!ebr) return null;

  const tplCfg = EBR_TEMPLATE_CFG[ebr.templateType];
  const statusCfg = EBR_STATUS_CFG[ebr.status];

  const currentStep =
    ebr.status === 'DRAFT' || ebr.status === 'IN_PROGRESS' ? 0
    : ebr.status === 'OPERATOR_SIGNED' ? 1
    : ebr.status === 'CHECKER_SIGNED' ? 2
    : ebr.status === 'QA_ARCHIVED' ? 3 : 0;

  const handleOperatorSign = () => {
    if (!signerName.trim()) { message.warning('请输入签名人员'); return; }
    onUpdate({ ...ebr, status: 'OPERATOR_SIGNED', operatorName: signerName, operatorSignTime: new Date().toISOString().slice(0, 16).replace('T', ' ') });
    message.success(`操作人 ${signerName} 签名成功`);
    setSignerName('');
    onClose();
  };
  const handleCheckerSign = () => {
    if (!signerName.trim()) { message.warning('请输入签名人员'); return; }
    onUpdate({ ...ebr, status: 'CHECKER_SIGNED', checkerName: signerName, checkerSignTime: new Date().toISOString().slice(0, 16).replace('T', ' ') });
    message.success(`复核人 ${signerName} 签名成功`);
    setSignerName('');
    onClose();
  };
  const handleQaArchive = () => {
    if (!signerName.trim()) { message.warning('请输入QA人员姓名'); return; }
    onUpdate({
      ...ebr, status: 'QA_ARCHIVED',
      qaName: signerName,
      qaArchiveTime: new Date().toISOString().slice(0, 16).replace('T', ' '),
      qaComment,
    });
    message.success(`QA归档完成！EBR已锁定存档。`);
    setSignerName('');
    onClose();
  };

  return (
    <Modal
      title={
        <Space>
          <span style={{ display: 'inline-block', width: 4, height: 18, background: tplCfg.color, borderRadius: 2 }} />
          <span style={{ color: tplCfg.color }}>{tplCfg.icon}</span>
          <span style={{ fontWeight: 700 }}>
            {tplCfg.label} — {ebr.ebrCode}
          </span>
          <Tag color={statusCfg.color} style={{ fontSize: 11 }}>{statusCfg.label}</Tag>
          {ebr.status === 'QA_ARCHIVED' && <LockOutlined style={{ color: '#52C41A' }} />}
        </Space>
      }
      open={!!ebr}
      onCancel={onClose}
      footer={null}
      width={900}
      bodyStyle={{ padding: '12px 20px' }}
      destroyOnClose
    >
      {/* 三级签名进度 */}
      <Steps
        current={currentStep}
        size="small"
        style={{ marginBottom: 16 }}
        items={[
          { title: '填写中', description: '实时采集/手工录入', icon: <FileTextOutlined /> },
          {
            title: '操作人签名',
            description: ebr.operatorName ? `${ebr.operatorName} ${ebr.operatorSignTime}` : '待签名',
            icon: <UserOutlined />,
          },
          {
            title: '复核人签名',
            description: ebr.checkerName ? `${ebr.checkerName} ${ebr.checkerSignTime}` : '待签名',
            icon: <TeamOutlined />,
          },
          {
            title: 'QA归档',
            description: ebr.qaName ? `${ebr.qaName} ${ebr.qaArchiveTime}` : '待归档',
            icon: <AuditOutlined />,
          },
        ]}
      />

      {/* 基本信息 */}
      <Descriptions size="small" bordered column={3} style={{ marginBottom: 12 }}>
        <Descriptions.Item label="EBR编号"><Text code style={{ fontSize: 11 }}>{ebr.ebrCode}</Text></Descriptions.Item>
        <Descriptions.Item label="批次号"><strong>{ebr.batchNo}</strong></Descriptions.Item>
        <Descriptions.Item label="产品">{ebr.productName}</Descriptions.Item>
        <Descriptions.Item label="工序">{ebr.opCode} {ebr.opName}</Descriptions.Item>
        <Descriptions.Item label="车间">{ebr.workshop}</Descriptions.Item>
        <Descriptions.Item label="工艺路线"><Text code style={{ fontSize: 11 }}>{ebr.routingCode}</Text></Descriptions.Item>
        <Descriptions.Item label="开始时间">{ebr.startTime}</Descriptions.Item>
        <Descriptions.Item label="完成时间">{ebr.endTime ?? '—'}</Descriptions.Item>
        <Descriptions.Item label="模板类型">
          <Tag color={tplCfg.color} style={{ fontSize: 11 }}>{tplCfg.label}</Tag>
        </Descriptions.Item>
      </Descriptions>

      {/* 关键数据 */}
      <div style={{ background: '#FAFAFA', borderRadius: 8, padding: '12px 16px', border: '1px solid #F0F0F0', marginBottom: 12 }}>
        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>
          <ExperimentOutlined style={{ marginRight: 6, color: tplCfg.color }} />
          关键数据记录
        </div>
        <Row gutter={[8, 4]}>
          {Object.entries(ebr.keyDataPoints).map(([k, v]) => (
            <Col span={12} key={k}>
              <div style={{ fontSize: 12, display: 'flex', gap: 6 }}>
                <span style={{ color: '#888', flexShrink: 0 }}>{k}：</span>
                <span style={{
                  fontWeight: k.startsWith('🔑') ? 700 : 500,
                  color: k.startsWith('🔑') ? '#E60012' : '#333',
                }}>{v}</span>
              </div>
            </Col>
          ))}
        </Row>
        {ebr.anomalies && (
          <div style={{ marginTop: 8, padding: '6px 10px', background: '#FFFBE6', borderRadius: 4, fontSize: 12 }}>
            <WarningOutlined style={{ color: '#FA8C16', marginRight: 6 }} />
            <strong>异常记录：</strong>{ebr.anomalies}
          </div>
        )}
      </div>

      {/* QA评审意见（已归档） */}
      {ebr.status === 'QA_ARCHIVED' && ebr.qaComment && (
        <Alert
          type="success" showIcon icon={<SafetyCertificateOutlined />}
          style={{ marginBottom: 12, fontSize: 12 }}
          message={<span><strong>QA批次评审意见：</strong>{ebr.qaComment}</span>}
        />
      )}

      {/* 签名区域 */}
      {ebr.status !== 'QA_ARCHIVED' && (
        <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 12 }}>
          {(ebr.status === 'DRAFT' || ebr.status === 'IN_PROGRESS') && (
            <div style={{ background: '#E6F4FF', borderRadius: 8, padding: '12px 16px', border: '1px solid #BAE7FF' }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>
                <UserOutlined style={{ marginRight: 6, color: '#1677FF' }} />操作人电子签名
              </div>
              <Row gutter={10}>
                <Col span={12}>
                  <Input placeholder="操作人姓名" value={signerName} onChange={e => setSignerName(e.target.value)} />
                </Col>
                <Col span={6}>
                  <Button type="primary" icon={<SafetyCertificateOutlined />}
                    disabled={!signerName.trim()} onClick={handleOperatorSign} style={{ width: '100%' }}>
                    操作人签名
                  </Button>
                </Col>
              </Row>
            </div>
          )}

          {ebr.status === 'OPERATOR_SIGNED' && (
            <div style={{ background: '#F9F0FF', borderRadius: 8, padding: '12px 16px', border: '1px solid #D3ADF7' }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>
                <TeamOutlined style={{ marginRight: 6, color: '#722ED1' }} />复核人电子签名
                <span style={{ fontSize: 11, color: '#888', fontWeight: 400, marginLeft: 8 }}>
                  操作人：{ebr.operatorName}（{ebr.operatorSignTime}）
                </span>
              </div>
              <Row gutter={10}>
                <Col span={12}>
                  <Input placeholder="复核人姓名（不得与操作人相同）" value={signerName} onChange={e => setSignerName(e.target.value)} />
                </Col>
                <Col span={8}>
                  <Button style={{ background: '#722ED1', borderColor: '#722ED1', color: '#fff', width: '100%' }}
                    icon={<SafetyCertificateOutlined />}
                    disabled={!signerName.trim()} onClick={handleCheckerSign}>
                    复核人签名
                  </Button>
                </Col>
              </Row>
            </div>
          )}

          {ebr.status === 'CHECKER_SIGNED' && (
            <div style={{ background: '#FFF2F0', borderRadius: 8, padding: '12px 16px', border: '1px solid #FFCCC7' }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>
                <AuditOutlined style={{ marginRight: 6, color: '#E60012' }} />QA电子签名 + 归档
                <span style={{ fontSize: 11, color: '#888', fontWeight: 400, marginLeft: 8 }}>
                  {ebr.operatorName} / {ebr.checkerName}
                </span>
              </div>
              <Row gutter={10}>
                <Col span={8}>
                  <Input placeholder="QA人员姓名" value={signerName} onChange={e => setSignerName(e.target.value)} />
                </Col>
                <Col span={10}>
                  <Input
                    placeholder="批次评审意见（如：批次放行/偏差评估...）"
                    value={qaComment}
                    onChange={e => setQaComment(e.target.value)}
                  />
                </Col>
                <Col span={6}>
                  <Button danger type="primary"
                    icon={<LockOutlined />}
                    disabled={!signerName.trim()} onClick={handleQaArchive} style={{ width: '100%' }}>
                    QA签名归档
                  </Button>
                </Col>
              </Row>
              <div style={{ fontSize: 11, color: '#888', marginTop: 6 }}>
                归档后EBR锁定，不可再修改，永久留存于电子批记录系统。
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};

// ════════════════════════════════════════════════════════════════
// 主页面
// ════════════════════════════════════════════════════════════════
const EbrEnhancedPage: React.FC = () => {
  const [ebrs, setEbrs] = useLocalStorage<EbrRecord[]>('tmj_ebr_enhanced', INITIAL_EBRS);
  const [viewingEbr, setViewingEbr] = useState<EbrRecord | null>(null);
  const [filterType, setFilterType] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  const handleUpdate = (updated: EbrRecord) => {
    setEbrs(prev => prev.map(e => e.id === updated.id ? updated : e));
  };

  const filtered = useMemo(() =>
    ebrs.filter(e => {
      if (filterType && e.templateType !== filterType) return false;
      if (filterStatus && e.status !== filterStatus) return false;
      return true;
    }), [ebrs, filterType, filterStatus]);

  const summary = useMemo(() => ({
    total: ebrs.length,
    inProgress: ebrs.filter(e => e.status === 'IN_PROGRESS' || e.status === 'DRAFT').length,
    pendingSign: ebrs.filter(e => e.status === 'OPERATOR_SIGNED' || e.status === 'CHECKER_SIGNED').length,
    archived: ebrs.filter(e => e.status === 'QA_ARCHIVED').length,
  }), [ebrs]);

  const columns: ColumnsType<EbrRecord> = [
    { title: 'EBR编号', dataIndex: 'ebrCode', width: 185,
      render: (v: string, r: EbrRecord) => (
        <span style={{ color: '#1677FF', fontWeight: 600, cursor: 'pointer', fontFamily: 'monospace', fontSize: 11 }}
          onClick={() => setViewingEbr(r)}>
          <FileDoneOutlined style={{ marginRight: 4 }} />{v}
        </span>
      ) },
    { title: '模板类型', dataIndex: 'templateType', width: 115,
      render: (v: EbrTemplateType) => {
        const cfg = EBR_TEMPLATE_CFG[v];
        return <Tag color={cfg.color} icon={cfg.icon} style={{ fontSize: 11 }}>{cfg.label}</Tag>;
      } },
    { title: '工单/批次', width: 185,
      render: (_: any, r: EbrRecord) => (
        <Space direction="vertical" size={0}>
          <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#555' }}>{r.woCode}</span>
          <span style={{ fontSize: 11, color: '#888' }}>{r.batchNo} · {r.productName}</span>
        </Space>
      ) },
    { title: '工序', width: 140,
      render: (_: any, r: EbrRecord) => (
        <Space direction="vertical" size={0}>
          <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#1677FF' }}>{r.opCode}</span>
          <span style={{ fontSize: 11, color: '#555' }}>{r.opName}</span>
        </Space>
      ) },
    { title: '三级签名状态', width: 180,
      render: (_: any, r: EbrRecord) => (
        <Space direction="vertical" size={1}>
          <Space size={4}>
            {r.operatorSignTime
              ? <CheckCircleOutlined style={{ color: '#52C41A', fontSize: 11 }} />
              : <ClockCircleOutlined style={{ color: '#d9d9d9', fontSize: 11 }} />}
            <span style={{ fontSize: 11 }}>操作人：{r.operatorName ?? <Text type="secondary">待签</Text>}</span>
          </Space>
          <Space size={4}>
            {r.checkerSignTime
              ? <CheckCircleOutlined style={{ color: '#52C41A', fontSize: 11 }} />
              : <ClockCircleOutlined style={{ color: '#d9d9d9', fontSize: 11 }} />}
            <span style={{ fontSize: 11 }}>复核人：{r.checkerName ?? <Text type="secondary">待签</Text>}</span>
          </Space>
          <Space size={4}>
            {r.qaArchiveTime
              ? <CheckCircleOutlined style={{ color: '#52C41A', fontSize: 11 }} />
              : <ClockCircleOutlined style={{ color: '#d9d9d9', fontSize: 11 }} />}
            <span style={{ fontSize: 11 }}>QA：{r.qaName ?? <Text type="secondary">待归档</Text>}</span>
          </Space>
        </Space>
      ) },
    { title: '状态', dataIndex: 'status', width: 110,
      render: (v: EbrStatus) => {
        const cfg = EBR_STATUS_CFG[v];
        return (
          <Space size={4}>
            {v === 'QA_ARCHIVED' ? <LockOutlined style={{ color: '#52C41A' }} /> : <UnlockOutlined style={{ color: cfg.color }} />}
            <Tag color={cfg.color} style={{ fontSize: 11 }}>{cfg.label}</Tag>
          </Space>
        );
      } },
    { title: '创建/完成时间', width: 150,
      render: (_: any, r: EbrRecord) => (
        <Space direction="vertical" size={0}>
          <span style={{ fontSize: 11, color: '#888' }}>开始：{r.startTime}</span>
          {r.endTime && <span style={{ fontSize: 11, color: '#52C41A' }}>完成：{r.endTime}</span>}
        </Space>
      ) },
    { title: '操作', width: 90, fixed: 'right',
      render: (_: any, r: EbrRecord) => (
        <Space size={0}>
          <Button type="link" size="small" icon={<EyeOutlined />}
            style={{ padding: '0 5px', fontSize: 12, fontWeight: 600, color: '#1677FF' }}
            onClick={() => setViewingEbr(r)}>
            {r.status === 'QA_ARCHIVED' ? '查看' : '签名'}
          </Button>
        </Space>
      ) },
  ];

  return (
    <div style={{ padding: '0 0 16px' }}>
      <Alert
        type="info" showIcon
        style={{ marginBottom: 12, borderRadius: 8, fontSize: 13 }}
        message={
          <span>
            <strong>电子批记录（GMP三级签名）</strong>：
            5类EBR模板（批包装指令/岗位记录/清场记录/物料平衡/QA监控）
            在工序开工时自动创建，执行过程实时填写，
            操作人→复核人→QA三级电子签名后归档锁定。
          </span>
        }
        closable
      />

      {/* 汇总 */}
      <Row gutter={12} style={{ marginBottom: 12 }}>
        {[
          { label: 'EBR总数', value: summary.total, color: '#1677FF', icon: <FileDoneOutlined /> },
          { label: '填写中', value: summary.inProgress, color: '#13C2C2', icon: <FileTextOutlined /> },
          { label: '待签名', value: summary.pendingSign, color: '#FA8C16', icon: <UserOutlined /> },
          { label: 'QA已归档', value: summary.archived, color: '#52C41A', icon: <LockOutlined /> },
        ].map(c => (
          <Col span={6} key={c.label}>
            <Card size="small" bodyStyle={{ padding: '10px 16px' }}
              style={{ border: `1px solid ${c.color}20`, borderRadius: 8 }}>
              <Row align="middle" gutter={10}>
                <Col>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: c.color + '18',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.color, fontSize: 18 }}>
                    {c.icon}
                  </div>
                </Col>
                <Col>
                  <div style={{ fontSize: 22, fontWeight: 700, color: c.color, lineHeight: 1.2 }}>{c.value}</div>
                  <div style={{ fontSize: 12, color: '#888' }}>{c.label}</div>
                </Col>
              </Row>
            </Card>
          </Col>
        ))}
      </Row>

      {/* 过滤 */}
      <div style={{ background: '#fff', borderRadius: 8, padding: '10px 14px', marginBottom: 10, border: '1px solid #f0f0f0' }}>
        <Row gutter={10}>
          <Col flex="none">
            <Select placeholder="EBR模板类型" value={filterType || undefined}
              onChange={setFilterType} allowClear style={{ width: 150 }}
              options={Object.entries(EBR_TEMPLATE_CFG).map(([k, v]) => ({ value: k, label: v.label }))} />
          </Col>
          <Col flex="none">
            <Select placeholder="签名状态" value={filterStatus || undefined}
              onChange={setFilterStatus} allowClear style={{ width: 130 }}
              options={Object.entries(EBR_STATUS_CFG).map(([k, v]) => ({ value: k, label: v.label }))} />
          </Col>
          <Col flex="none">
            <Button icon={<CheckCircleOutlined />} onClick={() => { setFilterType(''); setFilterStatus(''); }}>重置</Button>
          </Col>
        </Row>
      </div>

      {/* 表格 */}
      <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #f0f0f0', overflow: 'hidden' }}>
        <div style={{ padding: '9px 14px', borderBottom: '1px solid #f5f5f5', display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileDoneOutlined style={{ color: '#1677FF' }} />
          <span style={{ fontWeight: 600, fontSize: 14 }}>电子批记录（EBR）</span>
          <Tag style={{ marginLeft: 4 }}>{filtered.length} 条</Tag>
          <span style={{ fontSize: 12, color: '#999' }}>— 点击EBR编号查看详情或执行签名</span>
        </div>
        <Table rowKey="id" dataSource={filtered} columns={columns} size="small"
          scroll={{ x: 1200, y: 'calc(100vh - 420px)' }}
          pagination={{ pageSize: 15, showSizeChanger: true, showTotal: t => `共 ${t} 条`, size: 'small' }} />
      </div>

      <EbrDetailModal ebr={viewingEbr} onClose={() => setViewingEbr(null)} onUpdate={handleUpdate} />
    </div>
  );
};

export default EbrEnhancedPage;

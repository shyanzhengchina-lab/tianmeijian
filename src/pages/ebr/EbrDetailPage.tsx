/**
 * EBR 详情页 — 电子批记录完整展示
 * 数据来源：ebrData.ts EbrRecord（基于 MES 真实工单/任务/检验/浮票数据）
 * 包括：批次信息、任务分配、工序执行明细（routingSteps）、检验记录、偏差、签名链、审核流
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, Row, Col, Space, Typography, Tag, Button, Steps, Timeline,
  Table, Descriptions, Alert, Progress, Tooltip, Modal, Input,
  Badge, Statistic, message, Collapse, Divider,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  ArrowLeftOutlined, PrinterOutlined, CheckCircleOutlined, ClockCircleOutlined,
  SafetyCertificateOutlined, ExclamationCircleOutlined,
  FileTextOutlined, ToolOutlined, BarcodeOutlined, TeamOutlined,
  FileDoneOutlined, CloseCircleOutlined, SyncOutlined, DownloadOutlined,
  WarningOutlined, AuditOutlined, TagsOutlined, ReconciliationOutlined, LinkOutlined,
} from '@ant-design/icons';
import type { EbrRecord, EbrRoutingStep, EbrInspectionRecord, EbrStatus } from './ebrData';
import { getMaterialBalance } from './ebrData';
import { printEbr, exportEbrPdf } from './ebrPrintUtils';
import { MaterialBalanceDetail } from './MaterialBalancePage';
import { mockUsageRecords } from '../equipment/equipmentData';
import type { EquipUsageRecord } from '../equipment/equipmentData';
import { getEbrStepList, getEbrEquipmentUsageList } from '../../api/ebrSub';
import type { EbrStepRecord, EbrEquipmentUsageRecord } from '../../api/ebrSub';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

// ── 状态配置 ────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<EbrStatus, { label: string; color: string; icon: React.ReactNode }> = {
  IN_PROGRESS: { label: '生产中',  color: 'processing', icon: <SyncOutlined spin /> },
  COMPLETED:   { label: '待审核',  color: 'warning',    icon: <FileDoneOutlined /> },
  REVIEWED:    { label: '已审核',  color: 'cyan',       icon: <CheckCircleOutlined /> },
  APPROVED:    { label: '已批准',  color: 'success',    icon: <SafetyCertificateOutlined /> },
  REJECTED:    { label: '已驳回',  color: 'error',      icon: <CloseCircleOutlined /> },
};

const STEP_STATUS_MAP: Record<string, { color: string; label: string }> = {
  COMPLETED:   { color: 'success',    label: '已完成' },
  IN_PROGRESS: { color: 'processing', label: '进行中' },
  PENDING:     { color: 'default',    label: '待执行' },
  DEVIATION:   { color: 'error',      label: '偏差' },
  SKIPPED:     { color: 'default',    label: '跳过' },
};

const INSPECTION_TYPE_MAP: Record<string, { label: string; color: string }> = {
  IQC:         { label: '来料检验', color: 'blue' },
  IPQC_FIRST:  { label: '首件检验', color: 'cyan' },
  IPQC_SELF:   { label: '过程检验', color: 'geekblue' },
  IPQC_PATROL: { label: '巡检',     color: 'purple' },
  FQC:         { label: '成品检验', color: 'orange' },
  OQC:         { label: '出货检验', color: 'gold' },
  SPECIAL:     { label: '特殊检验', color: 'magenta' },
};

// ── 设备使用批记录联动子组件 ────────────────────────────────────────────────────
const EquipUsageSection: React.FC<{ batchNo: string; apiEquipUsages?: EbrEquipmentUsageRecord[] }> = ({ batchNo, apiEquipUsages }) => {
  // 优先用 API 数据；若 API 无数据则降级到 mockUsageRecords（按 batchNo 过滤）
  const mockRecords: EquipUsageRecord[] = mockUsageRecords.filter(r => r.batchNo === batchNo);
  const records: EquipUsageRecord[] = apiEquipUsages && apiEquipUsages.length > 0
    ? apiEquipUsages.map((u, idx) => ({
        id:           String(u.id ?? idx),
        usageNo:      `EU-${String(u.id ?? idx).padStart(6, '0')}`,
        equipCode:    u.equipmentCode ?? '',
        equipName:    u.equipmentName ?? u.equipmentCode ?? '',
        equipType:    u.equipmentType ?? '',
        batchNo,
        startTime:    u.startTime ?? '',
        endTime:      u.endTime   ?? '',
        duration:     u.duration  ?? 0,
        operator:     u.operatorName ?? '',
        cleanBefore:  true,
        cleanAfter:   u.usageStatus !== 'ABNORMAL',
        abnormalFlag: u.usageStatus === 'ABNORMAL',
        operatorSign: u.operatorName ? `${u.operatorName}(signed)` : undefined,
        setupParams:  u.maintenanceRecord ?? undefined,
      } as unknown as EquipUsageRecord))
    : mockRecords;

  const usageColumns: ColumnsType<EquipUsageRecord> = [
    {
      title: '记录编号', dataIndex: 'usageNo', width: 160,
      render: (v: string) => (
        <Text style={{ color: '#1677FF', fontWeight: 600, fontFamily: 'monospace', fontSize: 12 }}>
          {v}
        </Text>
      ),
    },
    {
      title: '设备', width: 200,
      render: (_: unknown, r: EquipUsageRecord) => (
        <Space direction="vertical" size={0}>
          <Text strong style={{ fontSize: 13 }}>{r.equipName}</Text>
          <Text type="secondary" style={{ fontSize: 11, fontFamily: 'monospace' }}>{r.equipCode}</Text>
        </Space>
      ),
    },
    {
      title: '操作员', dataIndex: 'operator', width: 110,
      render: (v: string) => <Tag color="blue">{v}</Tag>,
    },
    {
      title: '开始时间', dataIndex: 'startTime', width: 140,
      render: (v: string) => <Text style={{ fontSize: 12, fontFamily: 'monospace' }}>{v}</Text>,
    },
    {
      title: '结束时间', dataIndex: 'endTime', width: 140,
      render: (v: string) => v ? (
        <Text style={{ fontSize: 12, fontFamily: 'monospace' }}>{v}</Text>
      ) : <Tag color="processing">进行中</Tag>,
    },
    {
      title: '时长', dataIndex: 'duration', width: 80,
      render: (v?: number) => v != null ? (
        <Tag color="cyan">{v >= 60 ? `${Math.floor(v / 60)}h${v % 60 ? `${v % 60}m` : ''}` : `${v}m`}</Tag>
      ) : '—',
    },
    {
      title: '使用前清洁', dataIndex: 'cleanBefore', width: 90, align: 'center' as const,
      render: (v: boolean) => v
        ? <Badge status="success" text={<Text style={{ fontSize: 12, color: '#52c41a' }}>已确认</Text>} />
        : <Badge status="error"   text={<Text style={{ fontSize: 12, color: '#ff4d4f' }}>未确认</Text>} />,
    },
    {
      title: '使用后清洁', dataIndex: 'cleanAfter', width: 90, align: 'center' as const,
      render: (v: boolean) => v
        ? <Badge status="success" text={<Text style={{ fontSize: 12, color: '#52c41a' }}>已确认</Text>} />
        : <Badge status="error"   text={<Text style={{ fontSize: 12, color: '#ff4d4f' }}>未确认</Text>} />,
    },
    {
      title: '异常', dataIndex: 'abnormalFlag', width: 70, align: 'center' as const,
      render: (v: boolean) => v
        ? <Tag color="error" style={{ fontSize: 11 }}>异常</Tag>
        : <Tag color="success" style={{ fontSize: 11 }}>正常</Tag>,
    },
    {
      title: '电子签名', dataIndex: 'operatorSign', width: 140,
      render: (v?: string) => v ? (
        <Space size={4}>
          <CheckCircleOutlined style={{ color: '#52c41a' }} />
          <Text style={{ fontSize: 11 }}>{v}</Text>
        </Space>
      ) : <Tag color="warning">待签名</Tag>,
    },
    {
      title: '工艺参数', dataIndex: 'setupParams', ellipsis: true,
      render: (v?: string) => v ? (
        <Tooltip title={v}>
          <Text style={{ fontSize: 12 }} ellipsis>{v}</Text>
        </Tooltip>
      ) : '—',
    },
  ];

  const abnormalCount = records.filter(r => r.abnormalFlag).length;
  const unsignedCount = records.filter(r => !r.operatorSign).length;
  const cleanIssueCount = records.filter(r => !r.cleanBefore || !r.cleanAfter).length;

  return (
    <Card
      title={
        <Space>
          <ToolOutlined style={{ color: '#1a237e' }} />
          <Text strong>设备使用批记录</Text>
          <Tag color="geekblue">批次：{batchNo}</Tag>
          <Badge count={records.length} showZero style={{ backgroundColor: '#1890ff' }} />
        </Space>
      }
      extra={
        records.length > 0 && (
          <Space>
            {abnormalCount > 0 && <Tag color="error">异常 {abnormalCount} 条</Tag>}
            {unsignedCount > 0 && <Tag color="warning">待签 {unsignedCount} 条</Tag>}
            {cleanIssueCount > 0 && <Tag color="orange">清洁异常 {cleanIssueCount} 条</Tag>}
            {abnormalCount === 0 && unsignedCount === 0 && cleanIssueCount === 0 && (
              <Tag color="success">全部正常</Tag>
            )}
          </Space>
        )
      }
      style={{ marginBottom: 16, borderRadius: 8, border: '1px solid #d6e4ff' }}
    >
      {records.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px 0', color: '#999' }}>
          <ToolOutlined style={{ fontSize: 32, marginBottom: 8 }} />
          <div>批次 {batchNo} 暂无设备使用记录</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>如需添加，请前往 批记录 → 设备使用批记录 页面</div>
        </div>
      ) : (
        <>
          {abnormalCount > 0 && (
            <Alert
              type="warning"
              showIcon
              icon={<ExclamationCircleOutlined />}
              message={`本批次存在 ${abnormalCount} 条异常设备使用记录，请审核时重点关注`}
              style={{ marginBottom: 12 }}
            />
          )}
          <Table<EquipUsageRecord>
            dataSource={records}
            columns={usageColumns}
            rowKey="id"
            size="small"
            pagination={false}
            scroll={{ x: 1400 }}
            rowClassName={(r: EquipUsageRecord) => r.abnormalFlag ? 'ant-table-row-error' : ''}
            style={{ fontSize: 12 }}
            expandable={{
              expandedRowRender: (r: EquipUsageRecord) => (
                <div style={{ padding: '8px 24px', background: '#f6f8fb', borderRadius: 6 }}>
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <div>
                      <Text strong style={{ fontSize: 12 }}>工艺参数：</Text>
                      <Text style={{ fontSize: 12 }}>{r.setupParams || '—'}</Text>
                    </div>
                    {r.abnormalDesc && (
                      <div>
                        <Text strong style={{ fontSize: 12, color: '#ff4d4f' }}>异常描述：</Text>
                        <Text style={{ fontSize: 12, color: '#ff4d4f' }}>{r.abnormalDesc}</Text>
                      </div>
                    )}
                    {r.remark && (
                      <div>
                        <Text strong style={{ fontSize: 12 }}>备注：</Text>
                        <Text style={{ fontSize: 12 }}>{r.remark}</Text>
                      </div>
                    )}
                  </Space>
                </div>
              ),
              rowExpandable: (r: EquipUsageRecord) => !!(r.setupParams || r.abnormalDesc || r.remark),
            }}
          />
          <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
            共 {records.length} 条设备使用记录 | 涉及设备：{[...new Set(records.map(r => r.equipCode))].join('、')}
          </div>
        </>
      )}
    </Card>
  );
};

interface EbrDetailPageProps {
  record: EbrRecord;
  onBack: () => void;
  onUpdate: (updated: EbrRecord) => void;
  onNavigate?: (page: string, params?: Record<string, unknown>) => void;
}

const EbrDetailPage: React.FC<EbrDetailPageProps> = ({ record, onBack, onUpdate, onNavigate }) => {
  const [reviewModal, setReviewModal] = useState(false);
  const [reviewRemark, setReviewRemark] = useState('');
  const [apiSteps, setApiSteps] = useState<EbrStepRecord[]>([]);
  const [apiEquipUsages, setApiEquipUsages] = useState<EbrEquipmentUsageRecord[]>([]);

  // ── 从后端加载工步记录 ──────────────────────────────────────────────
  const loadStepsFromApi = useCallback(async () => {
    try {
      const resp = await getEbrStepList() as any;
      const list: EbrStepRecord[] = resp?.data ?? [];
      if (list.length > 0) setApiSteps(list);
    } catch { /* 后端不可用时保留 mock routingSteps */ }
  }, []);

  // ── 从后端加载设备使用记录 ──────────────────────────────────────────
  const loadEquipmentFromApi = useCallback(async () => {
    try {
      const resp = await getEbrEquipmentUsageList() as any;
      const list: EbrEquipmentUsageRecord[] = resp?.data ?? [];
      if (list.length > 0) setApiEquipUsages(list);
    } catch { /* 后端不可用时降级到 mockUsageRecords */ }
  }, []);

  useEffect(() => {
    loadStepsFromApi();
    loadEquipmentFromApi();
  }, [loadStepsFromApi, loadEquipmentFromApi]);

  // ── 合并 mock routingSteps 与 API 工步数据 ────────────────────────
  // 以 record.routingSteps 为基础；若 API 有同 opNo 的工步则用 API 状态覆盖
  const displaySteps: EbrRoutingStep[] = useCallback(() => {
    if (apiSteps.length === 0) return record.routingSteps;
    const apiMap = new Map<string, EbrStepRecord>();
    apiSteps.forEach(s => {
      const key = s.operationCode ?? `STEP-${s.stepNo ?? s.id}`;
      apiMap.set(key, s);
    });
    const merged = record.routingSteps.map(step => {
      const apiStep = apiMap.get(step.opNo);
      if (!apiStep) return step;
      return {
        ...step,
        status: (apiStep.status ?? step.status) as EbrRoutingStep['status'],
        startedAt:     apiStep.startTime ?? step.startedAt,
        completedAt:   apiStep.endTime   ?? step.completedAt,
        operatorName:  apiStep.operator  ?? step.operatorName,
      };
    });
    // 附加 API 中有但 mock 中没有的工步
    const existingOpNos = new Set(record.routingSteps.map(s => s.opNo));
    apiSteps
      .filter(s => !existingOpNos.has(s.operationCode ?? ''))
      .forEach((s, idx) => {
        merged.push({
          seq:    s.stepNo ?? (record.routingSteps.length + idx + 1) * 10,
          opNo:   s.operationCode ?? `API-${s.id ?? idx}`,
          opName: s.operationName ?? s.stepName ?? '工步',
          stage:  '—',
          workCenter: '—',
          isKeyOp: false,
          mandatoryInspection: false,
          status: (s.status ?? 'PENDING') as EbrRoutingStep['status'],
          startedAt:    s.startTime,
          completedAt:  s.endTime,
          operatorName: s.operator,
        });
      });
    return merged;
  }, [record.routingSteps, apiSteps])();

  const statusCfg = STATUS_CONFIG[record.status];

  // ── 审核提交 ─────────────────────────────────────────────────────
  const handleReview = () => {
    const now = new Date().toLocaleString('zh-CN');
    onUpdate({
      ...record,
      status:      'REVIEWED',
      reviewedBy:  'QA王质检(9999)',
      reviewedAt:  now,
      reviewRemark: reviewRemark || '记录核查完整，符合规范',
      updatedAt:   now,
    });
    setReviewModal(false);
    setReviewRemark('');
    message.success('QA 审核完成');
  };

  const handleApprove = () => {
    Modal.confirm({
      title: '确认批准放行',
      icon: <SafetyCertificateOutlined style={{ color: '#52c41a' }} />,
      content: '批准后不可撤销，请确认所有记录无误。',
      okText: '批准放行',
      okType: 'primary',
      onOk: () => {
        const now = new Date().toLocaleString('zh-CN');
        onUpdate({
          ...record,
          status:        'APPROVED',
          approvedBy:    '批准人赵主任(8888)',
          approvedAt:    now,
          approveRemark: '审核通过，批准放行',
          updatedAt:     now,
        });
        message.success('批次已批准放行');
      },
    });
  };

  const handleReject = () => {
    Modal.confirm({
      title: '驳回批次记录',
      icon: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
      content: '确认驳回该批次记录？驳回后需要补充材料重新提交。',
      okText: '确认驳回',
      okType: 'danger',
      onOk: () => {
        const now = new Date().toLocaleString('zh-CN');
        onUpdate({
          ...record,
          status:       'REJECTED',
          rejectedBy:   '批准人赵主任(8888)',
          rejectedAt:   now,
          rejectReason: '记录不完整，请补充相关材料后重新提交',
          updatedAt:    now,
        });
        message.error('批次记录已驳回');
      },
    });
  };

  // ── 工序执行表格列 ────────────────────────────────────────────────
  const routingColumns: ColumnsType<EbrRoutingStep> = [
    {
      title: '序号',
      dataIndex: 'seq',
      key: 'seq',
      width: 55,
      render: v => <Text style={{ fontSize: 12, fontFamily: 'monospace' }}>{v}</Text>,
    },
    {
      title: '工序编号',
      dataIndex: 'opNo',
      key: 'opNo',
      width: 90,
      render: v => <Tag color="geekblue" style={{ fontSize: 11 }}>{v}</Tag>,
    },
    {
      title: '工序名称',
      key: 'opName',
      width: 140,
      render: (_, r) => (
        <Space direction="vertical" size={1}>
          <Space size={4}>
            <Text strong style={{ fontSize: 13 }}>{r.opName}</Text>
            {r.isKeyOp && <Tag color="red" style={{ fontSize: 10, padding: '0 4px' }}>关键</Tag>}
            {r.mandatoryInspection && <Tag color="orange" style={{ fontSize: 10, padding: '0 4px' }}>必检</Tag>}
          </Space>
          <Text type="secondary" style={{ fontSize: 11 }}>{r.workCenter}</Text>
        </Space>
      ),
    },
    {
      title: '工艺段',
      dataIndex: 'stage',
      key: 'stage',
      width: 100,
      render: v => <Text style={{ fontSize: 12 }}>{v}</Text>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (v: string) => {
        const cfg = STEP_STATUS_MAP[v] ?? { color: 'default', label: v };
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    {
      title: '数量（完工/合格/报废）',
      key: 'qty',
      width: 170,
      render: (_, r) => r.reportQty ? (
        <Space size={4} wrap>
          <Text style={{ fontSize: 12 }}>完工 <Text strong style={{ color: '#1890ff' }}>{r.reportQty}</Text></Text>
          <Text style={{ fontSize: 12 }}>合格 <Text strong style={{ color: '#52c41a' }}>{r.goodQty ?? 0}</Text></Text>
          {(r.scrapQty ?? 0) > 0 && (
            <Text style={{ fontSize: 12 }}>报废 <Text style={{ color: '#ff4d4f' }}>{r.scrapQty}</Text></Text>
          )}
        </Space>
      ) : <Text type="secondary">—</Text>,
    },
    {
      title: '操作员',
      dataIndex: 'operatorName',
      key: 'operatorName',
      width: 130,
      render: v => v ? <Text style={{ fontSize: 12 }}>{v}</Text> : <Text type="secondary">—</Text>,
    },
    {
      title: '设备',
      key: 'equip',
      width: 140,
      render: (_, r) => r.equipName
        ? <Text style={{ fontSize: 12 }}>{r.equipName}</Text>
        : <Text type="secondary">—</Text>,
    },
    {
      title: '开始 / 完成',
      key: 'time',
      width: 170,
      render: (_, r) => (
        <Space direction="vertical" size={1}>
          <Text style={{ fontSize: 11 }}>开始 {r.startedAt ?? '—'}</Text>
          <Text style={{ fontSize: 11 }}>完成 {r.completedAt ?? '—'}</Text>
        </Space>
      ),
    },
    {
      title: '工艺参数',
      key: 'keyData',
      width: 100,
      render: (_, r) => {
        if (!r.keyData || Object.keys(r.keyData).length === 0) return <Text type="secondary">—</Text>;
        const entries = Object.entries(r.keyData);
        return (
          <Tooltip
            title={
              <div>
                {entries.map(([k, v]) => (
                  <div key={k}><Text style={{ color: '#fff', fontSize: 11 }}>{k}：{v}</Text></div>
                ))}
              </div>
            }
          >
            <Tag color="purple" style={{ cursor: 'pointer', fontSize: 11 }}>查看 {entries.length} 项</Tag>
          </Tooltip>
        );
      },
    },
  ];

  // ── 检验记录表格列 ────────────────────────────────────────────────
  const inspColumns: ColumnsType<EbrInspectionRecord> = [
    {
      title: '任务编号',
      dataIndex: 'taskNo',
      key: 'taskNo',
      width: 140,
      render: v => <Text style={{ fontSize: 12, fontFamily: 'monospace' }}>{v}</Text>,
    },
    {
      title: '类型',
      dataIndex: 'schemeType',
      key: 'schemeType',
      width: 90,
      render: (v: string) => {
        const cfg = INSPECTION_TYPE_MAP[v] ?? { label: v, color: 'default' };
        return <Tag color={cfg.color} style={{ fontSize: 11 }}>{cfg.label}</Tag>;
      },
    },
    {
      title: '方案名称',
      dataIndex: 'schemeName',
      key: 'schemeName',
      width: 140,
    },
    {
      title: '关联工序',
      dataIndex: 'opNo',
      key: 'opNo',
      width: 90,
      render: v => v ? <Tag color="geekblue" style={{ fontSize: 11 }}>{v}</Tag> : <Text type="secondary">—</Text>,
    },
    {
      title: '抽检 / 总数',
      key: 'sampleQty',
      width: 100,
      render: (_, r) => <Text style={{ fontSize: 12 }}>{r.sampleQty} / {r.totalQty}</Text>,
    },
    {
      title: '检验员 / 复核',
      key: 'inspector',
      width: 150,
      render: (_, r) => (
        <Space direction="vertical" size={1}>
          <Text style={{ fontSize: 12 }}>{r.inspectorName ?? '—'}</Text>
          {r.checkerName && <Text style={{ fontSize: 11, color: '#888' }}>复核：{r.checkerName}</Text>}
        </Space>
      ),
    },
    {
      title: '结论',
      dataIndex: 'conclusion',
      key: 'conclusion',
      width: 90,
      render: (v?: string) => {
        if (!v || v === 'PENDING') return <Tag color="default">待检</Tag>;
        return v === 'PASS'
          ? <Tag color="success" icon={<CheckCircleOutlined />}>通过</Tag>
          : <Tag color="error"   icon={<CloseCircleOutlined />}>失败</Tag>;
      },
    },
    {
      title: '放行状态',
      dataIndex: 'releaseStatus',
      key: 'releaseStatus',
      width: 90,
      render: (v: string) => {
        const map: Record<string, [string, string]> = {
          RELEASED: ['success', '已放行'],
          REJECTED: ['error',   '已拒绝'],
          PENDING:  ['warning', '待放行'],
        };
        const [color, label] = map[v] ?? ['default', v];
        return <Tag color={color}>{label}</Tag>;
      },
    },
    {
      title: '失败项',
      dataIndex: 'failItems',
      key: 'failItems',
      width: 130,
      render: (v?: string[]) =>
        v && v.length > 0
          ? <Text type="danger" style={{ fontSize: 12 }}>{v.join('、')}</Text>
          : <Text type="secondary">—</Text>,
    },
    {
      title: '开始 / 完成',
      key: 'time',
      width: 160,
      render: (_, r) => (
        <Space direction="vertical" size={1}>
          <Text style={{ fontSize: 11 }}>开始 {r.startTime ?? '—'}</Text>
          <Text style={{ fontSize: 11 }}>完成 {r.completeTime ?? '—'}</Text>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '16px 20px', background: '#f0f2f5', minHeight: '100vh' }}>
      {/* 顶部工具栏 */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={onBack}>返回列表</Button>
            <Title level={4} style={{ margin: 0, color: '#1a237e' }}>
              <FileTextOutlined style={{ marginRight: 8 }} />
              电子批记录详情
            </Title>
            <Tag color="blue" style={{ fontFamily: 'monospace', fontSize: 13 }}>{record.ebrNo}</Tag>
          </Space>
        </Col>
        <Col>
          <Space>
            <Tag color={statusCfg.color} icon={statusCfg.icon} style={{ fontSize: 14, padding: '4px 12px' }}>
              {statusCfg.label}
            </Tag>
            {record.status === 'COMPLETED' && (
              <Button type="primary" icon={<CheckCircleOutlined />} onClick={() => setReviewModal(true)}>
                QA 审核
              </Button>
            )}
            {record.status === 'REVIEWED' && (
              <>
                <Button
                  type="primary"
                  icon={<SafetyCertificateOutlined />}
                  style={{ background: '#52c41a', borderColor: '#52c41a' }}
                  onClick={handleApprove}
                >
                  批准放行
                </Button>
                <Button danger icon={<CloseCircleOutlined />} onClick={handleReject}>
                  驳回
                </Button>
              </>
            )}
            <Button
              icon={<PrinterOutlined />}
              onClick={() => printEbr(record)}
            >
              打印 EBR
            </Button>
            <Button
              icon={<DownloadOutlined />}
              onClick={() => {
                message.loading({ content: '正在生成PDF预览…', key: 'pdf', duration: 2 });
                setTimeout(() => {
                  exportEbrPdf(record);
                  message.success({ content: '已在新窗口打开PDF预览，请按 Ctrl+P → 另存为PDF', key: 'pdf', duration: 5 });
                }, 200);
              }}
            >
              导出 PDF
            </Button>
          </Space>
        </Col>
      </Row>

      {/* 驳回提示 */}
      {record.status === 'REJECTED' && (
        <Alert
          type="error"
          showIcon
          icon={<CloseCircleOutlined />}
          message={`批次记录已被驳回：${record.rejectReason ?? ''}`}
          description={`驳回人：${record.rejectedBy}  |  驳回时间：${record.rejectedAt}`}
          style={{ marginBottom: 16 }}
        />
      )}

      {/* 偏差预警 */}
      {record.deviations.length > 0 && (
        <Alert
          type="warning"
          showIcon
          icon={<WarningOutlined />}
          message={`本批次存在 ${record.deviations.length} 项偏差记录，请在审核时重点关注`}
          style={{ marginBottom: 16 }}
        />
      )}

      {/* ① 批次基本信息 */}
      <Card
        title={<Space><BarcodeOutlined style={{ color: '#1a237e' }} /><Text strong>批次基本信息</Text></Space>}
        style={{ marginBottom: 16, borderRadius: 8 }}
        extra={
          <Space>
            <Tag color="purple">工艺路径：{record.routingCode}</Tag>
            <Tag color="blue">BOM版本：{record.bomVersion}</Tag>
          </Space>
        }
      >
        <Descriptions column={{ xs: 1, sm: 2, md: 4 }} size="small" bordered>
          <Descriptions.Item label="生产订单">{record.poNo ?? '—'}</Descriptions.Item>
          <Descriptions.Item label="工单号">{record.woNo}</Descriptions.Item>
          <Descriptions.Item label="批次号">
            <Text strong style={{ color: '#1a237e', fontFamily: 'monospace' }}>{record.batchNo}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="EBR 编号">
            <Text style={{ fontFamily: 'monospace' }}>{record.ebrNo}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="产品名称">{record.productName}</Descriptions.Item>
          <Descriptions.Item label="产品规格"><Text strong>{record.productSpec}</Text></Descriptions.Item>
          <Descriptions.Item label="产品编码">{record.productCode}</Descriptions.Item>
          <Descriptions.Item label="客户">{record.customer ?? '—'}</Descriptions.Item>
          <Descriptions.Item label="计划数量">{record.planQty} 件</Descriptions.Item>
          <Descriptions.Item label="交货期">{record.deliveryDate ?? '—'}</Descriptions.Item>
          <Descriptions.Item label="优先级">
            <Tag color={record.priority === 'HIGH' ? 'red' : record.priority === 'URGENT' ? 'volcano' : 'blue'}>
              {record.priority === 'HIGH' ? '高' : record.priority === 'URGENT' ? '紧急' : '正常'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="原材料批号">
            <Text style={{ fontFamily: 'monospace' }}>{record.materialLotNo ?? '—'}</Text>
          </Descriptions.Item>
          {record.materialSpec && (
            <Descriptions.Item label="原材料规格">{record.materialSpec}</Descriptions.Item>
          )}
          {record.handleLotNo && (
            <Descriptions.Item label="手柄批号">
              <Text style={{ fontFamily: 'monospace' }}>{record.handleLotNo}</Text>
            </Descriptions.Item>
          )}
          {record.iqcResult && (
            <Descriptions.Item label="IQC 结果">
              <Tag color={record.iqcResult === 'PASS' ? 'success' : record.iqcResult === 'FAIL' ? 'error' : 'warning'}>
                {record.iqcResult === 'PASS' ? '通过' : record.iqcResult === 'FAIL' ? '失败' : '待检'}
              </Tag>
            </Descriptions.Item>
          )}
          <Descriptions.Item label="开始时间">{record.startTime}</Descriptions.Item>
          <Descriptions.Item label="完成时间">{record.endTime ?? '生产中'}</Descriptions.Item>
          <Descriptions.Item label="创建时间">{record.createdAt}</Descriptions.Item>
          <Descriptions.Item label="最后更新">{record.updatedAt}</Descriptions.Item>
        </Descriptions>
      </Card>

      {/* ② 生产汇总 KPI */}
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        {[
          { label: '计划数量', value: record.planQtyTotal,   suffix: '件', color: '#1a237e' },
          { label: '完工数量', value: record.reportQtyTotal, suffix: '件', color: '#1890ff' },
          { label: '合格数量', value: record.goodQtyTotal,   suffix: '件', color: '#52c41a' },
          { label: '报废数量', value: record.scrapQtyTotal,  suffix: '件', color: '#ff4d4f' },
          { label: '检验记录', value: record.inspectionRecords.length, suffix: '项', color: '#722ed1' },
          { label: '综合良率', value: record.yieldRate, suffix: '%',  color: record.yieldRate >= 98 ? '#52c41a' : record.yieldRate >= 95 ? '#fa8c16' : '#ff4d4f' },
        ].map(({ label, value, suffix, color }) => (
          <Col key={label} xs={12} sm={8} md={4}>
            <Card size="small" style={{ borderRadius: 8, textAlign: 'center' }}>
              <Statistic
                title={<span style={{ fontSize: 12 }}>{label}</span>}
                value={value}
                suffix={suffix}
                valueStyle={{ color, fontWeight: 700 }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* ③ 任务分配概览 */}
      {record.tasks.length > 0 && (
        <Card
          title={<Space><TeamOutlined style={{ color: '#1a237e' }} /><Text strong>生产任务分配</Text></Space>}
          style={{ marginBottom: 16, borderRadius: 8 }}
          size="small"
        >
          <Row gutter={[12, 12]}>
            {record.tasks.map(task => (
              <Col key={task.taskNo} xs={24} sm={12} md={8}>
                <Card
                  size="small"
                  style={{ borderRadius: 6, border: `1px solid ${task.status === 'DONE' ? '#b7eb8f' : task.status === 'IN_PROGRESS' ? '#91d5ff' : '#d9d9d9'}` }}
                >
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                      <Text strong style={{ fontSize: 12, fontFamily: 'monospace' }}>{task.taskNo}</Text>
                      <Tag color={task.status === 'DONE' ? 'success' : task.status === 'IN_PROGRESS' ? 'processing' : 'default'} style={{ fontSize: 11 }}>
                        {task.status === 'DONE' ? '已完成' : task.status === 'IN_PROGRESS' ? '进行中' : task.status === 'ASSIGNED' ? '已分配' : '待执行'}
                      </Tag>
                    </div>
                    <Text style={{ fontSize: 12 }}><b>车间：</b>{task.workCenter}</Text>
                    <Text style={{ fontSize: 12 }}><b>班次：</b>{task.shiftName}  <b>班组：</b>{task.team}</Text>
                    <Text style={{ fontSize: 12 }}><b>操作员：</b>{task.operator}</Text>
                    <Text style={{ fontSize: 12 }}><b>范围：</b>{task.stationScope}</Text>
                    {task.reportQty && (
                      <Text style={{ fontSize: 12 }}>
                        <b>完工：</b>{task.reportQty} 件 &nbsp;
                        {task.scrapQty ? <span><b>报废：</b>{task.scrapQty} 件</span> : null}
                      </Text>
                    )}
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      计划 {task.planStart} ~ {task.planEnd}
                    </Text>
                    {task.actualStart && (
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        实际 {task.actualStart}{task.actualEnd ? ` ~ ${task.actualEnd}` : ' ~ 进行中'}
                      </Text>
                    )}
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>
      )}

      {/* ④ 浮票信息 */}
      {record.floatTickets.length > 0 && (
        <Card
          title={<Space><TagsOutlined style={{ color: '#1a237e' }} /><Text strong>生产浮票</Text></Space>}
          style={{ marginBottom: 16, borderRadius: 8 }}
          size="small"
        >
          <Row gutter={[8, 8]}>
            {record.floatTickets.map(ft => (
              <Col key={ft.ticketNo} xs={24} sm={12} md={6}>
                <Card size="small" style={{ borderRadius: 6, background: '#fafafa' }}>
                  <Text strong style={{ fontSize: 12, fontFamily: 'monospace', display: 'block' }}>{ft.ticketNo}</Text>
                  <Text style={{ fontSize: 12 }}>{ft.qty} 件</Text>
                  <div>
                    <Tag color={ft.status === 'ARCHIVED' ? 'default' : ft.status === 'IN_USE' ? 'processing' : 'warning'} style={{ fontSize: 10 }}>
                      {ft.status === 'ARCHIVED' ? '已归档' : ft.status === 'IN_USE' ? '使用中' : ft.status === 'RETURNED' ? '已回收' : ft.status}
                    </Tag>
                  </div>
                  {ft.currentOp && <Text type="secondary" style={{ fontSize: 11 }}>当前：{ft.currentOp}</Text>}
                  {ft.operatorName && <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>操作员：{ft.operatorName}</Text>}
                  {ft.lastUpdateTime && <Text type="secondary" style={{ fontSize: 10 }}>{ft.lastUpdateTime}</Text>}
                </Card>
              </Col>
            ))}
          </Row>
        </Card>
      )}

      {/* ⑤ 工序执行明细 */}
      <Card
        title={<Space><ToolOutlined style={{ color: '#1a237e' }} /><Text strong>工序执行记录（工艺路径明细）</Text></Space>}
        style={{ marginBottom: 16, borderRadius: 8 }}
        extra={
          <Space>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {displaySteps.filter(s => s.status === 'COMPLETED').length} / {displaySteps.length} 道工序完成
            </Text>
            <Progress
              percent={Math.round(
                displaySteps.length > 0
                  ? (displaySteps.filter(s => s.status === 'COMPLETED').length / displaySteps.length) * 100
                  : 0
              )}
              size="small"
              style={{ width: 100 }}
              strokeColor="#1a237e"
            />
          </Space>
        }
      >
        <Table
          columns={routingColumns}
          dataSource={displaySteps}
          rowKey="opNo"
          pagination={false}
          size="small"
          scroll={{ x: 1400 }}
          expandable={{
            expandedRowRender: (r) => {
              if (!r.stagesSnapshot || r.stagesSnapshot.length === 0) {
                return <Text type="secondary" style={{ paddingLeft: 24 }}>暂无阶段执行快照</Text>;
              }
              return (
                <div style={{ padding: '8px 24px', background: '#fafafa' }}>
                  <Text strong style={{ fontSize: 12, color: '#1a237e' }}>
                    {r.opNo} {r.opName} — 阶段执行快照
                  </Text>
                  <Table
                    columns={[
                      { title: '阶段',   dataIndex: 'name',      key: 'name',   width: 120 },
                      { title: '状态',   dataIndex: 'status',    key: 'status', width: 90,
                        render: (v: string) => {
                          const m: Record<string, [string, string]> = {
                            completed:   ['success',    '已完成'],
                            in_progress: ['processing', '进行中'],
                            pending:     ['default',    '待执行'],
                          };
                          const [color, label] = m[v] ?? ['default', v];
                          return <Tag color={color}>{label}</Tag>;
                        }
                      },
                      { title: '开始时间', dataIndex: 'startTime', key: 'startTime', render: v => v || '—' },
                      { title: '结束时间', dataIndex: 'endTime',   key: 'endTime',   render: v => v || '—' },
                      { title: '操作员',   dataIndex: 'operator',  key: 'operator',  render: v => v || '—' },
                    ]}
                    dataSource={r.stagesSnapshot}
                    rowKey="code"
                    pagination={false}
                    size="small"
                    style={{ marginTop: 8 }}
                  />
                  {r.keyData && Object.keys(r.keyData).length > 0 && (
                    <div style={{ marginTop: 10 }}>
                      <Text strong style={{ fontSize: 12 }}>工艺参数：</Text>
                      <Row gutter={[12, 4]} style={{ marginTop: 4 }}>
                        {Object.entries(r.keyData).map(([k, v]) => (
                          <Col key={k} xs={12} sm={8} md={6}>
                            <Text type="secondary" style={{ fontSize: 12 }}>{k}：</Text>
                            <Text strong style={{ fontSize: 12 }}>{v}</Text>
                          </Col>
                        ))}
                      </Row>
                    </div>
                  )}
                </div>
              );
            },
          }}
          rowClassName={(r) => r.deviationFlag ? 'ant-table-row-error' : ''}
        />
      </Card>

      {/* ⑥ 物料平衡表 */}
      {(() => {
        const balanceSheet = getMaterialBalance(record.batchNo);
        if (!balanceSheet) return null;
        const cfg = balanceSheet.balanceStatus === 'NORMAL'
          ? { color: '#52c41a', tagColor: 'success' as const, label: '正常' }
          : balanceSheet.balanceStatus === 'WARNING'
          ? { color: '#faad14', tagColor: 'warning' as const, label: '预警' }
          : { color: '#ff4d4f', tagColor: 'error' as const, label: '异常' };
        return (
          <Card
            title={
              <Space>
                <ReconciliationOutlined style={{ color: '#1a237e' }} />
                <Text strong>物料平衡表</Text>
                <Tag color="geekblue" style={{ fontFamily: 'monospace', fontSize: 11 }}>{record.batchNo}</Tag>
                <Tag color={cfg.tagColor}>平衡率 {balanceSheet.overallBalanceRate.toFixed(2)}% · {cfg.label}</Tag>
              </Space>
            }
            extra={
              <Space>
                <Tag color="purple">GMP §212.110(b)</Tag>
                {balanceSheet.reviewedBy && (
                  <Tag color="success"><CheckCircleOutlined /> 已审核：{balanceSheet.reviewedBy}</Tag>
                )}
                {onNavigate && (
                  <Button
                    size="small" type="link" icon={<LinkOutlined />}
                    style={{ padding: 0, fontSize: 12 }}
                    onClick={() => onNavigate('material-balance', { batchNo: record.batchNo })}
                  >
                    查看完整物料平衡表
                  </Button>
                )}
              </Space>
            }
            style={{ marginBottom: 16, borderRadius: 8, border: `1px solid ${cfg.color}30` }}
          >
            <MaterialBalanceDetail sheet={balanceSheet} compact={true} />
          </Card>
        );
      })()}

      {/* ⑦ 检验记录 */}
      {record.inspectionRecords.length > 0 && (
        <Card
          title={<Space><AuditOutlined style={{ color: '#1a237e' }} /><Text strong>质量检验记录</Text></Space>}
          style={{ marginBottom: 16, borderRadius: 8 }}
        >
          <Table
            columns={inspColumns}
            dataSource={record.inspectionRecords}
            rowKey="taskId"
            pagination={false}
            size="small"
            scroll={{ x: 1200 }}
            expandable={{
              expandedRowRender: (r) => (
                <div style={{ padding: '8px 24px', background: '#fafafa' }}>
                  <Text strong style={{ fontSize: 12, color: '#1a237e' }}>检验项目明细</Text>
                  {r.instrumentName && (
                    <div style={{ margin: '4px 0' }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>检验设备：{r.instrumentName}</Text>
                    </div>
                  )}
                  <Table
                    columns={[
                      { title: '项目名称', dataIndex: 'itemName', key: 'itemName', width: 130 },
                      { title: '类别',     dataIndex: 'category', key: 'category', width: 90 },
                      { title: '标准值',   dataIndex: 'standardValue', key: 'standardValue', width: 130, render: (v, r2: typeof r.items[0]) => v ? `${v}${r2.unit ? ' ' + r2.unit : ''}` : '—' },
                      { title: '实测值',   dataIndex: 'actualValue',   key: 'actualValue',   width: 100, render: (v, r2: typeof r.items[0]) => v != null ? `${v}${r2.unit ? ' ' + r2.unit : ''}` : '—' },
                      { title: '结果',     dataIndex: 'result',        key: 'result',        width: 80,
                        render: (v?: string) => !v || v === 'PENDING'
                          ? <Tag>待检</Tag>
                          : v === 'PASS' ? <Tag color="success">通过</Tag> : <Tag color="error">失败</Tag>
                      },
                      { title: '关键', dataIndex: 'isCritical', key: 'isCritical', width: 65,
                        render: (v: boolean) => v ? <Tag color="red">关键</Tag> : <Tag>普通</Tag>
                      },
                    ]}
                    dataSource={r.items}
                    rowKey="itemCode"
                    pagination={false}
                    size="small"
                    style={{ marginTop: 8 }}
                  />
                  {r.dispositionRemark && (
                    <Alert
                      type="warning"
                      showIcon
                      message={`处置意见：${r.dispositionRemark}`}
                      style={{ marginTop: 8 }}
                    />
                  )}
                </div>
              ),
            }}
          />
        </Card>
      )}

      {/* ⑦ 偏差记录 */}
      {record.deviations.length > 0 && (
        <Card
          title={<Space><WarningOutlined style={{ color: '#fa8c16' }} /><Text strong>偏差 / 异常记录</Text></Space>}
          style={{ marginBottom: 16, borderRadius: 8, border: '1px solid #ffd591' }}
        >
          {record.deviations.map(dev => (
            <Alert
              key={dev.id}
              type="warning"
              showIcon
              icon={<ExclamationCircleOutlined />}
              message={
                <Space>
                  <Tag color="orange">{dev.type}</Tag>
                  <Text strong>{dev.opNo} {dev.opName}</Text>
                  <Text style={{ fontSize: 12 }}>{dev.discoveredAt} by {dev.discoveredBy}</Text>
                </Space>
              }
              description={
                <div>
                  <Paragraph style={{ margin: '4px 0', fontSize: 12 }}><b>描述：</b>{dev.description}</Paragraph>
                  <Paragraph style={{ margin: '4px 0', fontSize: 12 }}><b>处置：</b>{dev.disposition}</Paragraph>
                  {dev.closedAt && (
                    <Paragraph style={{ margin: '4px 0', fontSize: 12 }}>
                      <b>关闭：</b>{dev.closedAt} by {dev.closedBy}
                    </Paragraph>
                  )}
                </div>
              }
              style={{ marginBottom: 8 }}
            />
          ))}
        </Card>
      )}

      {/* ⑦-B OOS 质量决策树（当存在检验失败项时展示） */}
      {(() => {
        const failedInsp = record.inspectionRecords.filter(
          ir => ir.conclusion === 'FAIL' || (ir.failItems && ir.failItems.length > 0)
        );
        if (failedInsp.length === 0) return null;

        const hasCriticalFail = failedInsp.some(ir =>
          ir.items?.some((item: { isCritical?: boolean; result?: string }) => item.isCritical && item.result === 'FAIL')
        );
        const hasOpenDeviation = record.deviations.some(d => !d.closedAt);

        const decisionColor = hasCriticalFail ? '#cf1322' : hasOpenDeviation ? '#fa8c16' : '#52c41a';
        const decisionType: 'error' | 'warning' | 'success' = hasCriticalFail ? 'error' : hasOpenDeviation ? 'warning' : 'success';
        const decisionLabel = hasCriticalFail
          ? '🔴 关键检验失败 — 建议批次暂扣，启动OOS调查（GMP 2010 第224条）'
          : hasOpenDeviation
          ? '🟡 存在未关闭偏差 — 暂停放行，等待CAPA完成后QA决策'
          : '🟢 轻微偏差已关闭 — 可提交QA审批条件放行';

        return (
          <Card
            title={
              <Space>
                <AuditOutlined style={{ color: decisionColor }} />
                <Text strong style={{ color: decisionColor }}>OOS 质量决策树 — 检验失败处置路径</Text>
                <Tag color={hasCriticalFail ? 'error' : hasOpenDeviation ? 'warning' : 'success'}>
                  {failedInsp.length} 项异常
                </Tag>
              </Space>
            }
            style={{ marginBottom: 16, borderRadius: 8, border: `2px solid ${decisionColor}` }}
          >
            <Alert
              type={decisionType}
              showIcon
              message={<Text strong>{decisionLabel}</Text>}
              description={
                <div style={{ marginTop: 8 }}>
                  {/* 失败检验任务明细 */}
                  {failedInsp.map(ir => {
                    const failItemNames: string[] = ir.failItems
                      ?? ir.items?.filter((i: { result?: string }) => i.result === 'FAIL')
                           .map((i: { itemName?: string }) => i.itemName ?? '—')
                      ?? [];
                    const isCrit = ir.items?.some(
                      (i: { isCritical?: boolean; result?: string }) => i.isCritical && i.result === 'FAIL'
                    );
                    return (
                      <div key={ir.taskNo} style={{ marginBottom: 8, padding: '6px 10px', background: '#fff1f0', borderRadius: 4, border: '1px solid #ffccc7' }}>
                        <Space wrap>
                          <Tag color={isCrit ? 'error' : 'warning'}>{isCrit ? '关键失败' : '次要失败'}</Tag>
                          <Text strong style={{ fontSize: 12 }}>{ir.taskNo}</Text>
                          <Text style={{ fontSize: 12 }}>{ir.schemeName}</Text>
                          {failItemNames.length > 0 && (
                            <Text type="danger" style={{ fontSize: 12 }}>失败项：{failItemNames.join('、')}</Text>
                          )}
                        </Space>
                        <div style={{ marginTop: 4, fontSize: 11, color: '#555' }}>
                          <b>GMP处置路径：</b>{' '}
                          {isCrit
                            ? '① 立即停线 → ② 开具OOS/偏差报告 → ③ QA评估影响范围 → ④ 制定CAPA → ⑤ 销毁/退货/降级/复检决策'
                            : '① 记录偏差 → ② 评估对产品质量影响 → ③ 复检或补充测试 → ④ QA审批条件放行'}
                        </div>
                      </div>
                    );
                  })}
                  {/* 关联偏差汇总 */}
                  {record.deviations.length > 0 && (
                    <div style={{ marginTop: 6, fontSize: 11, color: '#666', background: '#fffbe6', padding: '6px 10px', borderRadius: 4, border: '1px solid #ffe58f' }}>
                      <b>关联偏差记录：</b>
                      {record.deviations.map(d => (
                        <span key={d.id ?? d.type} style={{ marginRight: 10 }}>
                          <Tag color={d.closedAt ? 'default' : 'orange'}>{d.id ?? d.type}</Tag>
                          {d.description?.substring(0, 35)}
                          {!d.closedAt && <Text type="warning" style={{ fontSize: 11 }}> [处理中]</Text>}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              }
              style={{ marginBottom: 0 }}
            />
          </Card>
        );
      })()}

      {/* ⑧ 签名链 + 审核流 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} md={14}>
          <Card
            title={<Space><TeamOutlined style={{ color: '#1a237e' }} /><Text strong>执行签名链</Text></Space>}
            style={{ borderRadius: 8, height: '100%' }}
          >
            {record.signatures.length === 0 ? (
              <Text type="secondary">暂无签名记录</Text>
            ) : (
              <Timeline
                items={record.signatures.map(sig => ({
                  color: 'green',
                  dot: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
                  children: (
                    <div>
                      <Space>
                        <Tag color="blue">{sig.role}</Tag>
                        <Text strong>{sig.name}</Text>
                      </Space>
                      <div style={{ marginTop: 2 }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>{sig.signedAt}</Text>
                        {sig.remark && <Text style={{ fontSize: 12, marginLeft: 8 }}>{sig.remark}</Text>}
                      </div>
                    </div>
                  ),
                }))}
              />
            )}
          </Card>
        </Col>
        <Col xs={24} md={10}>
          <Card
            title={<Space><FileDoneOutlined style={{ color: '#1a237e' }} /><Text strong>审核流程</Text></Space>}
            style={{ borderRadius: 8, height: '100%' }}
          >
            <Steps
              direction="vertical"
              size="small"
              current={
                record.status === 'IN_PROGRESS' ? 0 :
                record.status === 'COMPLETED'   ? 1 :
                record.status === 'REVIEWED'    ? 2 :
                record.status === 'APPROVED'    ? 3 : 1
              }
              items={[
                {
                  title: '生产完成',
                  description: record.endTime ? `${record.endTime}` : '进行中',
                  icon: <CheckCircleOutlined />,
                  status: record.status === 'IN_PROGRESS' ? 'process' : 'finish',
                },
                {
                  title: 'QA 审核',
                  description: record.reviewedBy
                    ? `${record.reviewedBy}  ${record.reviewedAt}`
                    : record.status === 'COMPLETED' ? '等待审核' : '待生产完成',
                  icon: <ExclamationCircleOutlined />,
                  status:
                    record.status === 'COMPLETED'  ? 'process' :
                    ['REVIEWED', 'APPROVED', 'REJECTED'].includes(record.status) ? 'finish' : 'wait',
                },
                {
                  title: '批准放行',
                  description: record.approvedBy
                    ? `${record.approvedBy}  ${record.approvedAt}`
                    : record.status === 'REVIEWED' ? '等待批准' : '待审核完成',
                  icon: <SafetyCertificateOutlined />,
                  status:
                    record.status === 'REVIEWED' ? 'process' :
                    record.status === 'APPROVED' ? 'finish'  :
                    record.status === 'REJECTED' ? 'error'   : 'wait',
                },
              ]}
            />

            {/* 审核备注 */}
            {record.reviewRemark && (
              <div style={{ marginTop: 12, padding: '8px 12px', background: '#f6ffed', borderRadius: 6, border: '1px solid #b7eb8f' }}>
                <Text strong style={{ fontSize: 12 }}>审核意见：</Text>
                <Paragraph style={{ margin: '4px 0 0', fontSize: 12 }}>{record.reviewRemark}</Paragraph>
              </div>
            )}
            {record.approveRemark && (
              <div style={{ marginTop: 8, padding: '8px 12px', background: '#f6ffed', borderRadius: 6, border: '1px solid #b7eb8f' }}>
                <Text strong style={{ fontSize: 12 }}>批准意见：</Text>
                <Paragraph style={{ margin: '4px 0 0', fontSize: 12 }}>{record.approveRemark}</Paragraph>
              </div>
            )}
            {record.rejectReason && (
              <div style={{ marginTop: 8, padding: '8px 12px', background: '#fff2f0', borderRadius: 6, border: '1px solid #ffccc7' }}>
                <Text strong style={{ fontSize: 12, color: '#ff4d4f' }}>驳回原因：</Text>
                <Paragraph style={{ margin: '4px 0 0', fontSize: 12, color: '#ff4d4f' }}>{record.rejectReason}</Paragraph>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* ⑨ 设备使用批记录 — 实时联动 */}
      <EquipUsageSection batchNo={record.batchNo} apiEquipUsages={apiEquipUsages} />

      {/* ⑩ 合规性声明 */}
      <Card style={{ borderRadius: 8, background: '#f9f0ff', border: '1px solid #d3adf7' }}>
        <Space align="start">
          <SafetyCertificateOutlined style={{ fontSize: 18, color: '#722ed1', marginTop: 2 }} />
          <div>
            <Text strong style={{ color: '#722ed1' }}>合规性声明</Text>
            <Paragraph style={{ margin: '4px 0 0', fontSize: 12, color: '#555' }}>
              本电子批记录（EBR）由 YonBIP/SY 系统根据生产执行数据自动生成，记录了批次{' '}
              <Text strong>{record.batchNo}</Text> 从原料入库到成品出站的完整生产执行过程，
              涵盖 {displaySteps.length} 道工序的操作员信息、工艺参数、
              设备记录及 {record.inspectionRecords.length} 项质量检验结果，
              满足 GMP 第十四章《文件管理》及 ISO 13485:2016 第4.2条《文件要求》规定。
              记录一经批准不得修改，如需更正须以偏差报告方式处理。
            </Paragraph>
            <Space style={{ marginTop: 4 }}>
              <Tag color="purple">GMP 合规</Tag>
              <Tag color="purple">ISO 13485</Tag>
              <Tag color="purple">21 CFR Part 11</Tag>
              <Tag color="purple">电子签名认证</Tag>
              <Tag color="purple">数据完整性</Tag>
            </Space>
          </div>
        </Space>
      </Card>

      {/* QA 审核 Modal */}
      <Modal
        title={<Space><CheckCircleOutlined style={{ color: '#1890ff' }} /><Text strong>QA 审核</Text></Space>}
        open={reviewModal}
        onOk={handleReview}
        onCancel={() => setReviewModal(false)}
        okText="确认审核通过"
        cancelText="取消"
      >
        <Space direction="vertical" style={{ width: '100%' }} size={12}>
          <Alert
            type="info"
            showIcon
            message={`正在审核批次记录：${record.ebrNo}（${record.batchNo}）`}
            description={`工序完成：${displaySteps.filter(s => s.status === 'COMPLETED').length} / ${displaySteps.length}；检验记录：${record.inspectionRecords.length} 项`}
          />
          <div>
            <Text strong>审核意见：</Text>
            <Input.TextArea
              rows={4}
              value={reviewRemark}
              onChange={e => setReviewRemark(e.target.value)}
              placeholder="请输入审核意见（可选）"
              style={{ marginTop: 8 }}
            />
          </div>
          <Alert
            type="warning"
            showIcon
            message="审核前请确认：所有工序记录完整、数量平衡、签名齐全、无未处理偏差。"
          />
        </Space>
      </Modal>
    </div>
  );
};

export default EbrDetailPage;

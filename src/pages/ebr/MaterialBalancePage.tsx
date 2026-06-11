/**
 * MaterialBalancePage.tsx — 物料平衡表
 * GMP医疗器械MES 批记录模块
 *
 * 功能：
 *   - 按批次查看物料平衡表（主物料投入/产出/损耗/平衡率）
 *   - 工序级物料流转（每道工序投入量→产出量→报废量→直通率→累计良率）
 *   - GMP合规判断：平衡率 ≥98% 正常，95~98% 预警，<95% 异常
 *   - 支持打印/导出
 */
import React, { useState, useMemo, useEffect } from 'react';
import {
  Card, Table, Tag, Row, Col, Space, Typography, Progress,
  Badge, Statistic, Alert, Divider, Tooltip, Select, Button,
  Descriptions, message, Popover, Input, Empty, Pagination, Radio,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  ReconciliationOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  WarningOutlined,
  PrinterOutlined,
  DownloadOutlined,
  SearchOutlined,
  SafetyCertificateOutlined,
  BarChartOutlined,
  FileTextOutlined,
  ArrowRightOutlined,
  LinkOutlined,
  LineChartOutlined,
  FilterOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import {
  ALL_MATERIAL_BALANCES,
  getMaterialBalance,
  type MaterialBalanceSheet,
  type MaterialBalanceRow,
  type OpBalanceRow,
} from './ebrData';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

// ── 状态配置 ─────────────────────────────────────────────────────────
const STATUS_CFG = {
  NORMAL:   { color: '#52c41a', bg: '#f6ffed', border: '#b7eb8f', label: '正常',   icon: <CheckCircleOutlined />,      tagColor: 'success' },
  WARNING:  { color: '#faad14', bg: '#fffbe6', border: '#ffe58f', label: '预警',   icon: <WarningOutlined />,          tagColor: 'warning' },
  ABNORMAL: { color: '#ff4d4f', bg: '#fff2f0', border: '#ffa39e', label: '异常',   icon: <ExclamationCircleOutlined />, tagColor: 'error'   },
} as const;

// ── 物料平衡率色条 ────────────────────────────────────────────────────
function BalanceBar({ rate }: { rate: number }) {
  const color = rate >= 98 ? '#52c41a' : rate >= 95 ? '#faad14' : '#ff4d4f';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Progress
        percent={rate} size="small" showInfo={false} strokeColor={color}
        style={{ flex: 1, minWidth: 80 }}
      />
      <Text strong style={{ color, fontSize: 13, whiteSpace: 'nowrap' }}>{rate.toFixed(2)}%</Text>
    </div>
  );
}

// ── 数量瀑布可视化条 ────────────────────────────────────────────────────────
function QuantityWaterfall({ rows }: { rows: Array<{ seq: number; opNo: string; opName: string; outputQty: number; scrapQty: number }> }) {
  const maxQty = rows[0]?.outputQty ?? 1;
  const stages = rows.slice(0, Math.min(rows.length, 12)); // 最多显示12道
  return (
    <div style={{ marginBottom: 16, padding: '12px 16px', background: '#f8f9ff', borderRadius: 8, border: '1px solid #e8eaf6' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <LineChartOutlined style={{ color: '#722ed1' }} />
        <Text strong style={{ fontSize: 12, color: '#722ed1' }}>数量流转瀑布图（各工序产出量趋势）</Text>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 60 }}>
        {stages.map((r, i) => {
          const h = Math.round((r.outputQty / maxQty) * 52);
          const hasScrap = r.scrapQty > 0;
          const isLast = i === stages.length - 1;
          return (
            <React.Fragment key={r.seq}>
              <Tooltip title={`${r.opNo} ${r.opName}\n产出：${r.outputQty.toLocaleString()}${hasScrap ? `  报废：${r.scrapQty}` : ''}`}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: 0 }}>
                  <div style={{
                    width: '100%', height: h,
                    background: isLast
                      ? 'linear-gradient(180deg,#52c41a,#389e0d)'
                      : hasScrap
                        ? 'linear-gradient(180deg,#fa8c16,#d46b08)'
                        : 'linear-gradient(180deg,#4096ff,#1677ff)',
                    borderRadius: '3px 3px 0 0', cursor: 'default',
                    transition: 'opacity .15s',
                  }} />
                  <div style={{ fontSize: 9, color: '#aaa', marginTop: 2, overflow: 'hidden', textAlign: 'center', width: '100%', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                    {r.opNo}
                  </div>
                </div>
              </Tooltip>
              {!isLast && (
                <div style={{ fontSize: 10, color: '#bbb', marginBottom: 16, flexShrink: 0 }}>›</div>
              )}
            </React.Fragment>
          );
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
        <Space size={4}>
          <div style={{ width: 10, height: 10, background: '#1677ff', borderRadius: 2 }} />
          <Text style={{ fontSize: 10, color: '#888' }}>正常工序</Text>
          <div style={{ width: 10, height: 10, background: '#fa8c16', borderRadius: 2, marginLeft: 6 }} />
          <Text style={{ fontSize: 10, color: '#888' }}>含报废</Text>
          <div style={{ width: 10, height: 10, background: '#52c41a', borderRadius: 2, marginLeft: 6 }} />
          <Text style={{ fontSize: 10, color: '#888' }}>末工序</Text>
        </Space>
        <Text style={{ fontSize: 10, color: '#aaa' }}>悬停查看工序详情</Text>
      </div>
    </div>
  );
}

// ── 物料平衡表详情组件（可嵌入 EbrDetailPage） ────────────────────────
interface BalanceDetailProps {
  sheet: MaterialBalanceSheet;
  compact?: boolean; // 是否精简模式（EbrDetailPage 嵌入用）
}

export const MaterialBalanceDetail: React.FC<BalanceDetailProps> = ({ sheet, compact = false }) => {
  const cfg = STATUS_CFG[sheet.balanceStatus];

  const materialColumns: ColumnsType<MaterialBalanceRow> = [
    {
      title: '序号', dataIndex: 'lineNo', width: 50, align: 'center',
      render: (v: number) => <Text style={{ fontSize: 12 }}>{v}</Text>,
    },
    {
      title: '物料名称', key: 'item', width: 180,
      render: (_: unknown, r: MaterialBalanceRow) => (
        <Space direction="vertical" size={0}>
          <Space size={4}>
            <Text strong style={{ fontSize: 13 }}>{r.itemName}</Text>
            {r.isMainMaterial && <Tag color="blue" style={{ fontSize: 10, padding: '0 4px' }}>主料</Tag>}
          </Space>
          {r.itemSpec && <Text type="secondary" style={{ fontSize: 11 }}>{r.itemSpec}</Text>}
          <Text style={{ fontSize: 11, fontFamily: 'monospace', color: '#999' }}>{r.itemCode}</Text>
        </Space>
      ),
    },
    {
      title: '物料批号', dataIndex: 'lotNo', width: 140,
      render: (v?: string) => v
        ? <Text style={{ fontSize: 12, fontFamily: 'monospace' }}>{v}</Text>
        : <Text type="secondary" style={{ fontSize: 11 }}>—</Text>,
    },
    { title: '单位', dataIndex: 'unit', width: 55, align: 'center',
      render: (v: string) => <Text style={{ fontSize: 12 }}>{v}</Text> },
    {
      title: '理论投料', dataIndex: 'theoreticalQty', width: 85, align: 'right',
      render: (v: number) => <Text style={{ fontSize: 12 }}>{v.toLocaleString()}</Text>,
    },
    {
      title: '实际投料', dataIndex: 'actualInputQty', width: 85, align: 'right',
      render: (v: number) => <Text strong style={{ fontSize: 12, color: '#1677ff' }}>{v.toLocaleString()}</Text>,
    },
    {
      title: '实际产出', dataIndex: 'actualOutputQty', width: 85, align: 'right',
      render: (v: number) => <Text strong style={{ fontSize: 12, color: '#52c41a' }}>{v.toLocaleString()}</Text>,
    },
    {
      title: '报废量', dataIndex: 'scrapQty', width: 75, align: 'right',
      render: (v: number) => <Text style={{ fontSize: 12, color: v > 0 ? '#ff4d4f' : '#aaa' }}>{v.toLocaleString()}</Text>,
    },
    {
      title: '退料量', dataIndex: 'returnQty', width: 75, align: 'right',
      render: (v: number) => <Text style={{ fontSize: 12, color: v > 0 ? '#faad14' : '#aaa' }}>{v.toLocaleString()}</Text>,
    },
    {
      title: '损耗量', dataIndex: 'lossQty', width: 75, align: 'right',
      render: (v: number) => <Text strong style={{ fontSize: 12, color: v > 0 ? '#fa8c16' : '#aaa' }}>{v.toLocaleString()}</Text>,
    },
    {
      title: '理论损耗率', dataIndex: 'theoreticalLossRate', width: 95, align: 'right',
      render: (v: number) => <Text style={{ fontSize: 12 }}>{v.toFixed(2)}%</Text>,
    },
    {
      title: '实际损耗率', dataIndex: 'actualLossRate', width: 95, align: 'right',
      render: (v: number, r: MaterialBalanceRow) => (
        <Text style={{ fontSize: 12, color: v > r.theoreticalLossRate * 2 ? '#ff4d4f' : v > r.theoreticalLossRate ? '#faad14' : '#52c41a', fontWeight: 600 }}>
          {v.toFixed(2)}%
        </Text>
      ),
    },
    {
      title: '物料平衡率', dataIndex: 'balanceRate', width: 160,
      render: (v: number) => <BalanceBar rate={v} />,
    },
    {
      title: '状态', dataIndex: 'status', width: 75, align: 'center',
      render: (v: MaterialBalanceRow['status']) => (
        <Tag color={STATUS_CFG[v].tagColor} style={{ fontSize: 11 }}>{STATUS_CFG[v].label}</Tag>
      ),
    },
    {
      title: '损耗原因', dataIndex: 'lossReason', ellipsis: true,
      render: (v?: string) => v
        ? <Tooltip title={v}><Text style={{ fontSize: 12 }} ellipsis>{v}</Text></Tooltip>
        : <Text type="secondary" style={{ fontSize: 11 }}>—</Text>,
    },
  ];

  const opColumns: ColumnsType<OpBalanceRow> = [
    { title: '序号', dataIndex: 'seq', width: 50, align: 'center',
      render: (v: number) => <Text style={{ fontSize: 11, fontFamily: 'monospace' }}>{v}</Text> },
    { title: '工序编号', dataIndex: 'opNo', width: 80,
      render: (v: string) => <Tag color="geekblue" style={{ fontSize: 11 }}>{v}</Tag> },
    { title: '工序名称', dataIndex: 'opName', width: 140,
      render: (v: string) => <Text strong style={{ fontSize: 13 }}>{v}</Text> },
    { title: '工艺段', dataIndex: 'stage', width: 120,
      render: (v: string) => <Tag color="default" style={{ fontSize: 11 }}>{v}</Tag> },
    { title: '投入量', dataIndex: 'inputQty', width: 80, align: 'right',
      render: (v: number) => <Text style={{ fontSize: 12, color: '#1677ff' }}>{v.toLocaleString()}</Text> },
    { title: '产出量', dataIndex: 'outputQty', width: 80, align: 'right',
      render: (v: number) => <Text strong style={{ fontSize: 12, color: '#52c41a' }}>{v.toLocaleString()}</Text> },
    { title: '报废量', dataIndex: 'scrapQty', width: 75, align: 'right',
      render: (v: number) => <Text style={{ fontSize: 12, color: v > 0 ? '#ff4d4f' : '#bbb' }}>{v}</Text> },
    {
      title: '本工序直通率', dataIndex: 'yieldRate', width: 130,
      render: (v: number) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Progress percent={v} size="small" showInfo={false}
            strokeColor={v >= 99.5 ? '#52c41a' : v >= 99 ? '#faad14' : '#ff4d4f'}
            style={{ flex: 1 }} />
          <Text style={{ fontSize: 11, color: v >= 99.5 ? '#52c41a' : v >= 99 ? '#faad14' : '#ff4d4f', fontWeight: 600 }}>
            {v.toFixed(2)}%
          </Text>
        </div>
      ),
    },
    {
      title: '累计综合良率', dataIndex: 'cumulativeYield', width: 130,
      render: (v: number) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Progress percent={v} size="small" showInfo={false}
            strokeColor={v >= 98 ? '#52c41a' : v >= 95 ? '#faad14' : '#ff4d4f'}
            style={{ flex: 1 }} />
          <Text strong style={{ fontSize: 11, color: v >= 98 ? '#52c41a' : v >= 95 ? '#faad14' : '#ff4d4f' }}>
            {v.toFixed(2)}%
          </Text>
        </div>
      ),
    },
  ];

  return (
    <div>
      {/* 批次汇总 KPI */}
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        {[
          { label: '计划数量',   value: sheet.planQty,          suffix: '件', color: '#1a237e' },
          { label: '实际投料',   value: sheet.actualInputQty,   suffix: '件', color: '#1677ff' },
          { label: '实际产出',   value: sheet.actualOutputQty,  suffix: '件', color: '#52c41a' },
          { label: '总报废量',   value: sheet.totalScrapQty,    suffix: '件', color: '#ff4d4f' },
          { label: '退料量',     value: sheet.totalReturnQty,   suffix: '件', color: '#faad14' },
          { label: '理论损耗率', value: sheet.theoryLossRate,   suffix: '%',  color: '#722ed1' },
          { label: '物料平衡率', value: sheet.overallBalanceRate, suffix: '%', color: cfg.color },
          { label: '综合良率',   value: sheet.overallYieldRate, suffix: '%',  color: sheet.overallYieldRate >= 98 ? '#52c41a' : '#faad14' },
        ].map(({ label, value, suffix, color }) => (
          <Col key={label} xs={12} sm={8} md={6} lg={3}>
            <Card size="small" style={{ borderRadius: 8, textAlign: 'center', border: `1px solid ${color}30` }}>
              <Statistic
                title={<span style={{ fontSize: 11, color: '#888' }}>{label}</span>}
                value={value}
                suffix={<span style={{ fontSize: 12 }}>{suffix}</span>}
                valueStyle={{ fontSize: 20, fontWeight: 800, color }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* 总平衡率状态条 */}
      <div style={{
        background: cfg.bg, border: `1px solid ${cfg.border}`,
        borderRadius: 8, padding: '10px 16px', marginBottom: 16,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <span style={{ fontSize: 18, color: cfg.color }}>{cfg.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Text strong style={{ color: cfg.color }}>总物料平衡率：{sheet.overallBalanceRate.toFixed(2)}%</Text>
            <Tag color={cfg.tagColor}>{cfg.label}</Tag>
            <Text type="secondary" style={{ fontSize: 12 }}>（GMP要求 ≥98%）</Text>
          </div>
          <Progress
            percent={sheet.overallBalanceRate}
            strokeColor={cfg.color}
            trailColor="#f0f0f0"
            showInfo={false}
            size="small"
          />
        </div>
        <div style={{ textAlign: 'right', minWidth: 120 }}>
          <div style={{ fontSize: 11, color: '#888' }}>制表人：{sheet.preparedBy}</div>
          {sheet.reviewedBy && <div style={{ fontSize: 11, color: '#888' }}>审核人：{sheet.reviewedBy}</div>}
          <div style={{ fontSize: 11, color: '#888' }}>{sheet.preparedAt}</div>
        </div>
      </div>

      {/* 偏差预警 */}
      {sheet.deviation && (
        <Alert
          type="warning" showIcon icon={<WarningOutlined />}
          message="存在偏差记录"
          description={sheet.deviation}
          style={{ marginBottom: 12, borderRadius: 8 }}
        />
      )}

      {/* 物料投料平衡表格 */}
      {!compact && (
        <Card
          size="small"
          title={<Space><ReconciliationOutlined style={{ color: '#1677ff' }} /><Text strong>物料投料平衡明细</Text></Space>}
          style={{ marginBottom: 16, borderRadius: 8 }}
        >
          <Table<MaterialBalanceRow>
            dataSource={sheet.materialRows}
            columns={materialColumns}
            rowKey="lineNo"
            size="small"
            pagination={false}
            scroll={{ x: 1500 }}
            rowClassName={(r: MaterialBalanceRow) =>
              r.status === 'ABNORMAL' ? 'ant-table-row-error'
              : r.status === 'WARNING' ? 'ant-table-row-warning' : ''
            }
          />
        </Card>
      )}

      {/* 数量瀑布可视化 */}
      <QuantityWaterfall rows={sheet.opBalanceRows} />

      {/* 工序级物料平衡 */}
      <Card
        size="small"
        title={
          <Space>
            <BarChartOutlined style={{ color: '#722ed1' }} />
            <Text strong>工序级物料流转（投入 → 产出 → 报废 → 直通率）</Text>
          </Space>
        }
        style={{ marginBottom: 16, borderRadius: 8 }}
      >
        <Table<OpBalanceRow>
          dataSource={sheet.opBalanceRows}
          columns={opColumns}
          rowKey="seq"
          size="small"
          pagination={false}
          scroll={{ x: 900 }}
          summary={tableData => {
            const totalScrap = tableData.reduce((s, r) => s + r.scrapQty, 0);
            const firstInput = tableData[0]?.inputQty ?? 0;
            const lastOutput = tableData[tableData.length - 1]?.outputQty ?? 0;
            const finalYield = tableData[tableData.length - 1]?.cumulativeYield ?? 0;
            return (
              <Table.Summary.Row style={{ background: '#f8f9ff', fontWeight: 700 }}>
                <Table.Summary.Cell index={0} colSpan={4}>
                  <Text strong style={{ color: '#1a237e' }}>汇总</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={4} align="right">
                  <Text strong style={{ color: '#1677ff' }}>{firstInput.toLocaleString()}</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={5} align="right">
                  <Text strong style={{ color: '#52c41a' }}>{lastOutput.toLocaleString()}</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={6} align="right">
                  <Text strong style={{ color: '#ff4d4f' }}>{totalScrap.toLocaleString()}</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={7} colSpan={2} align="center">
                  <Text strong style={{ color: finalYield >= 98 ? '#52c41a' : '#faad14' }}>
                    综合良率 {finalYield.toFixed(2)}%
                  </Text>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            );
          }}
        />
      </Card>

      {/* compact 模式下的精简物料表 */}
      {compact && (
        <Card
          size="small"
          title={<Space><ReconciliationOutlined style={{ color: '#1677ff' }} /><Text strong>物料投料平衡明细</Text></Space>}
          style={{ marginBottom: 16, borderRadius: 8 }}
        >
          <Table<MaterialBalanceRow>
            dataSource={sheet.materialRows}
            columns={materialColumns.filter(c => !['lossReason'].includes((c as { dataIndex?: string }).dataIndex ?? ''))}
            rowKey="lineNo"
            size="small"
            pagination={false}
            scroll={{ x: 1300 }}
          />
        </Card>
      )}

      {/* 平衡结论 */}
      <Card
        size="small"
        style={{ borderRadius: 8, background: cfg.bg, border: `1px solid ${cfg.border}` }}
      >
        <Space align="start">
          <SafetyCertificateOutlined style={{ fontSize: 16, color: cfg.color, marginTop: 2 }} />
          <div>
            <Text strong style={{ color: cfg.color }}>物料平衡结论</Text>
            <Paragraph style={{ margin: '4px 0 0', fontSize: 12, color: '#444' }}>
              {sheet.conclusion}
            </Paragraph>
            <Space style={{ marginTop: 6 }}>
              <Tag color="purple">GMP §212.110(b)</Tag>
              <Tag color="purple">ISO 13485 §7.5.1</Tag>
              <Tag color={cfg.tagColor}>平衡率 {sheet.overallBalanceRate.toFixed(2)}%</Tag>
            </Space>
          </div>
        </Space>
      </Card>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════
// 独立页面组件
// ════════════════════════════════════════════════════════════════
interface MaterialBalancePageProps {
  onNavigate?: (page: string, params?: Record<string, unknown>) => void;
  initialBatchNo?: string;
}

const PAGE_SIZE = 8; // 每页显示批次数

const MaterialBalancePage: React.FC<MaterialBalancePageProps> = ({ onNavigate, initialBatchNo }) => {
  const [selectedBatch, setSelectedBatch] = useState<string>(initialBatchNo ?? ALL_MATERIAL_BALANCES[0].batchNo);
  const [searchText, setSearchText]       = useState('');
  const [statusFilter, setStatusFilter]   = useState<'ALL' | 'NORMAL' | 'WARNING' | 'ABNORMAL'>('ALL');
  const [currentPage, setCurrentPage]     = useState(1);

  // 当 initialBatchNo 变化时（跨页跳转携带参数）自动切换选中批次
  useEffect(() => {
    if (initialBatchNo && ALL_MATERIAL_BALANCES.find(s => s.batchNo === initialBatchNo)) {
      setSelectedBatch(initialBatchNo);
      // 找出目标批次在过滤后列表的位置，自动跳页
      setSearchText('');
      setStatusFilter('ALL');
      setCurrentPage(1);
    }
  }, [initialBatchNo]);

  // 搜索+过滤后的列表
  const filteredList = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return ALL_MATERIAL_BALANCES.filter(s => {
      const matchStatus = statusFilter === 'ALL' || s.balanceStatus === statusFilter;
      const matchSearch = !q || [
        s.batchNo, s.ebrNo, s.productName, s.productSpec,
        s.preparedBy, s.reviewedBy ?? '',
      ].some(v => v.toLowerCase().includes(q));
      return matchStatus && matchSearch;
    });
  }, [searchText, statusFilter]);

  // 分页后的列表
  const pagedList = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredList.slice(start, start + PAGE_SIZE);
  }, [filteredList, currentPage]);

  // 搜索/过滤变化时重置页码，并确保选中批次仍可见
  useEffect(() => { setCurrentPage(1); }, [searchText, statusFilter]);

  const sheet = useMemo(() => getMaterialBalance(selectedBatch), [selectedBatch]);

  const statusCounts = useMemo(() => ({
    total:    ALL_MATERIAL_BALANCES.length,
    normal:   ALL_MATERIAL_BALANCES.filter(s => s.balanceStatus === 'NORMAL').length,
    warning:  ALL_MATERIAL_BALANCES.filter(s => s.balanceStatus === 'WARNING').length,
    abnormal: ALL_MATERIAL_BALANCES.filter(s => s.balanceStatus === 'ABNORMAL').length,
  }), []);

  return (
    <div style={{ padding: '0 0 24px' }}>
      {/* ── 页头 ── */}
      <div style={{
        background: 'linear-gradient(135deg, #1a237e 0%, #283593 100%)',
        borderRadius: 12, padding: '14px 20px', marginBottom: 16,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <Space>
          <ReconciliationOutlined style={{ fontSize: 22, color: '#fff' }} />
          <div>
            <Title level={4} style={{ margin: 0, color: '#fff' }}>物料平衡表</Title>
            <Text style={{ color: 'rgba(255,255,255,.7)', fontSize: 11 }}>
              GMP §212.110(b) / ISO 13485 §7.5.1 — 共 {statusCounts.total} 批
            </Text>
          </div>
        </Space>
        <Space>
          {statusCounts.abnormal > 0 && (
            <Tag color="error" style={{ fontSize: 12 }}>
              <ExclamationCircleOutlined /> {statusCounts.abnormal} 批异常
            </Tag>
          )}
          {statusCounts.warning > 0 && (
            <Tag color="warning" style={{ fontSize: 12 }}>
              <WarningOutlined /> {statusCounts.warning} 批预警
            </Tag>
          )}
          <Tag color="success" style={{ fontSize: 12 }}>
            <CheckCircleOutlined /> {statusCounts.normal} 批正常
          </Tag>
        </Space>
      </div>

      {/* ── 主体：左侧批次面板 + 右侧详情 ── */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>

        {/* ── 左侧批次选择面板 ── */}
        <div style={{
          width: 300, flexShrink: 0,
          background: '#fff', borderRadius: 10,
          border: '1px solid #e8eaf6',
          boxShadow: '0 2px 8px rgba(0,0,0,.06)',
          overflow: 'hidden',
        }}>
          {/* 面板标题 */}
          <div style={{
            padding: '10px 14px', background: '#f8f9ff',
            borderBottom: '1px solid #e8eaf6',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <UnorderedListOutlined style={{ color: '#1a237e' }} />
            <Text strong style={{ fontSize: 13 }}>批次列表</Text>
            <Badge
              count={filteredList.length}
              style={{ background: filteredList.length < ALL_MATERIAL_BALANCES.length ? '#1677ff' : '#bbb', fontSize: 10 }}
              overflowCount={999}
            />
          </div>

          {/* 搜索框 */}
          <div style={{ padding: '10px 12px', borderBottom: '1px solid #f0f0f0' }}>
            <Input
              placeholder="搜索批次号 / 产品名 / EBR编号…"
              prefix={<SearchOutlined style={{ color: '#bbb' }} />}
              size="small"
              allowClear
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              style={{ marginBottom: 8 }}
            />
            {/* 状态过滤 */}
            <Radio.Group
              size="small"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              style={{ width: '100%' }}
            >
              {([
                { value: 'ALL',      label: `全部 (${statusCounts.total})`,    color: '#666' },
                { value: 'NORMAL',   label: `正常 (${statusCounts.normal})`,   color: '#52c41a' },
                { value: 'WARNING',  label: `预警 (${statusCounts.warning})`,  color: '#faad14' },
                { value: 'ABNORMAL', label: `异常 (${statusCounts.abnormal})`, color: '#ff4d4f' },
              ] as const).map(({ value, label, color }) => (
                <Radio.Button
                  key={value} value={value}
                  style={{ fontSize: 11, color: statusFilter === value ? color : undefined }}
                >
                  {label}
                </Radio.Button>
              ))}
            </Radio.Group>
          </div>

          {/* 批次列表 */}
          <div style={{ maxHeight: 'calc(100vh - 320px)', minHeight: 300, overflowY: 'auto' }}>
            {pagedList.length === 0 ? (
              <Empty description="无匹配批次" image={Empty.PRESENTED_IMAGE_SIMPLE}
                style={{ padding: '24px 0' }} />
            ) : (
              pagedList.map(s => {
                const cfg = STATUS_CFG[s.balanceStatus];
                const isActive = s.batchNo === selectedBatch;
                return (
                  <div
                    key={s.batchNo}
                    onClick={() => setSelectedBatch(s.batchNo)}
                    style={{
                      padding: '10px 14px',
                      borderBottom: '1px solid #f5f5f5',
                      background: isActive ? cfg.bg : '#fff',
                      borderLeft: `3px solid ${isActive ? cfg.color : 'transparent'}`,
                      cursor: 'pointer',
                      transition: 'all .15s',
                    }}
                    onMouseEnter={e => {
                      if (!isActive) (e.currentTarget as HTMLDivElement).style.background = '#fafafa';
                    }}
                    onMouseLeave={e => {
                      if (!isActive) (e.currentTarget as HTMLDivElement).style.background = '#fff';
                    }}
                  >
                    {/* 批次号 + 状态 */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <Text
                        style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: isActive ? 700 : 500,
                          color: isActive ? cfg.color : '#333' }}
                        ellipsis
                      >
                        {s.batchNo}
                      </Text>
                      <Tag color={cfg.tagColor} style={{ fontSize: 10, padding: '0 4px', margin: 0 }}>
                        {cfg.label}
                      </Tag>
                    </div>
                    {/* 产品名 */}
                    <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }} >
                      {s.productName} · {s.productSpec}
                    </div>
                    {/* 平衡率进度条 */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Progress
                        percent={s.overallBalanceRate} size="small" showInfo={false}
                        strokeColor={cfg.color} style={{ flex: 1, margin: 0 }}
                      />
                      <Text style={{ fontSize: 11, fontWeight: 700, color: cfg.color, minWidth: 44 }}>
                        {s.overallBalanceRate.toFixed(1)}%
                      </Text>
                    </div>
                    {/* EBR + 投/产 */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                      <Text style={{ fontSize: 10, color: '#aaa', fontFamily: 'monospace' }}>{s.ebrNo}</Text>
                      {onNavigate && (
                        <span
                          onClick={e => { e.stopPropagation(); onNavigate('ebr-list', { batchNo: s.batchNo }); }}
                          style={{ fontSize: 10, color: cfg.color, cursor: 'pointer', textDecoration: 'underline' }}
                        >
                          查看批记录
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* 分页 */}
          {filteredList.length > PAGE_SIZE && (
            <div style={{ padding: '8px 12px', borderTop: '1px solid #f0f0f0', textAlign: 'center' }}>
              <Pagination
                simple
                current={currentPage}
                pageSize={PAGE_SIZE}
                total={filteredList.length}
                onChange={p => setCurrentPage(p)}
                size="small"
              />
            </div>
          )}
        </div>

        {/* ── 右侧详情 ── */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {sheet ? (
            <Card
              style={{ borderRadius: 10, border: '1px solid #e8eaf6' }}
              bodyStyle={{ padding: '16px 20px' }}
              title={
                <Space wrap>
                  <FileTextOutlined style={{ color: '#1a237e' }} />
                  <Text strong style={{ fontSize: 14 }}>
                    {sheet.productName} · {sheet.productSpec}
                  </Text>
                  <Tag color="geekblue" style={{ fontFamily: 'monospace', fontSize: 11 }}>{sheet.batchNo}</Tag>
                  <Tag color={STATUS_CFG[sheet.balanceStatus].tagColor}>
                    平衡率 {sheet.overallBalanceRate.toFixed(2)}% · {STATUS_CFG[sheet.balanceStatus].label}
                  </Tag>
                </Space>
              }
              extra={
                <Space>
                  {onNavigate && (
                    <Button
                      size="small" type="primary" icon={<LinkOutlined />}
                      onClick={() => onNavigate('ebr-list', { batchNo: sheet.batchNo })}
                    >
                      查看批记录详情
                    </Button>
                  )}
                  <Button size="small" icon={<PrinterOutlined />} onClick={() => message.info('打印功能开发中')}>打印</Button>
                  <Button size="small" icon={<DownloadOutlined />} onClick={() => message.info('导出PDF开发中')}>导出 PDF</Button>
                </Space>
              }
            >
              <MaterialBalanceDetail sheet={sheet} compact={false} />
            </Card>
          ) : (
            <div style={{
              background: '#fff', borderRadius: 10, border: '1px solid #e8eaf6',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              padding: '80px 0', color: '#bbb',
            }}>
              <ReconciliationOutlined style={{ fontSize: 48, marginBottom: 16 }} />
              <Text type="secondary">请从左侧列表选择批次查看物料平衡表</Text>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MaterialBalancePage;

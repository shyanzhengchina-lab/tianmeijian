/**
 * EBR 列表页 — 电子批记录管理
 * 展示所有批次的执行状态、汇总数据，支持筛选、查看详情、审核放行
 * 数据来源：ebrData.ts (MOCK_EBR_LIST) 基于 MES 真实工单/任务/检验数据
 */
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Card, Row, Col, Table, Tag, Button, Input, Select, Space, Typography,
  Statistic, Progress, Badge, Tooltip, Modal, message, Alert, Spin,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  FileTextOutlined, SearchOutlined, EyeOutlined, CheckCircleOutlined,
  CloseCircleOutlined, SyncOutlined, FileDoneOutlined, ExclamationCircleOutlined,
  PrinterOutlined, BarChartOutlined, SafetyCertificateOutlined,
} from '@ant-design/icons';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import type { EbrRecord, EbrStatus } from './ebrData';
import { MOCK_EBR_LIST, EBR_STORAGE_KEY, EBR_DATA_VERSION, EBR_VERSION_KEY, loadEbrRecords } from './ebrData';
import { getEbrRecordList, updateEbrRecord } from '../../api/ebrRecords';
import { isUserCleared } from '../../store/mesStore';
import EbrDetailPage from './EbrDetailPage';

const { Title, Text } = Typography;
const { Option } = Select;

// ── 状态配置 ────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<EbrStatus, { label: string; color: string; icon: React.ReactNode }> = {
  IN_PROGRESS: { label: '生产中',  color: 'processing', icon: <SyncOutlined spin /> },
  COMPLETED:   { label: '待审核',  color: 'warning',    icon: <FileDoneOutlined /> },
  REVIEWED:    { label: '已审核',  color: 'cyan',       icon: <CheckCircleOutlined /> },
  APPROVED:    { label: '已批准',  color: 'success',    icon: <SafetyCertificateOutlined /> },
  REJECTED:    { label: '已驳回',  color: 'error',      icon: <CloseCircleOutlined /> },
};

interface EbrListPageProps {
  onNavigate?: (page: string, params?: Record<string, unknown>) => void;
  initialBatchNo?: string; // 初始化时自动打开指定批次详情
}

const EbrListPage: React.FC<EbrListPageProps> = ({ onNavigate, initialBatchNo }) => {
  // loadEbrRecords() 会自动检测版本并回填 Mock 数据（修复 localStorage 存空数组问题）
  const [records, setRecords] = useLocalStorage<EbrRecord[]>(EBR_STORAGE_KEY, loadEbrRecords());
  const [searchText, setSearchText]     = useState('');
  const [statusFilter, setStatusFilter] = useState<EbrStatus | 'ALL'>('ALL');
  const [detailRecord, setDetailRecord] = useState<EbrRecord | null>(null);
  const [apiLoading, setApiLoading]     = useState(false);

  // ── 从后端加载 EBR 数据，合并到 localStorage ──────────────────────
  const loadFromApi = useCallback(async () => {
    if (isUserCleared()) return;  // 用户已主动清空，不从 API 重新拉取数据
    setApiLoading(true);
    try {
      const resp = await getEbrRecordList() as any;
      const apiItems: any[] = resp.data ?? [];
      if (apiItems.length > 0) {
        // 后端状态映射（扁平 → 前端 EbrStatus）
        const statusMap: Record<string, EbrStatus> = {
          IN_PROGRESS: 'IN_PROGRESS',
          COMPLETED:   'COMPLETED',
          REVIEWED:    'REVIEWED',
          APPROVED:    'APPROVED',
          REJECTED:    'REJECTED',
        };
        setRecords(prev => {
          // 对已有记录按 batchNo 匹配，以后端状态为准更新；新记录追加为简化 EbrRecord
          const updated = prev.map(r => {
            const apiItem = apiItems.find(
              (a: any) => a.batchNo === r.batchNo || String(a.id) === r.id
            );
            if (!apiItem) return r;
            return {
              ...r,
              status: statusMap[apiItem.status] ?? r.status,
              planQtyTotal:   apiItem.planQuantity    ?? r.planQtyTotal,
              reportQtyTotal: apiItem.completedQuantity ?? r.reportQtyTotal,
              goodQtyTotal:   apiItem.qualifiedQuantity  ?? r.goodQtyTotal,
              scrapQtyTotal:  apiItem.rejectedQuantity   ?? r.scrapQtyTotal,
              yieldRate: apiItem.qualifiedRate != null
                ? Number(apiItem.qualifiedRate)
                : r.yieldRate,
            };
          });
          // 追加后端有、前端没有的新记录（用最简映射）
          const existingBatchNos = new Set(prev.map(r => r.batchNo));
          const now = new Date().toLocaleString('zh-CN');
          const newItems: EbrRecord[] = apiItems
            .filter((a: any) => !existingBatchNos.has(a.batchNo))
            .map((a: any): EbrRecord => ({
              id:            String(a.id),
              ebrNo:         `EBR-${a.batchNo}`,
              status:        statusMap[a.status] ?? 'IN_PROGRESS',
              routingCode:   '',
              routingName:   '',
              bomVersion:    a.bomVersion ?? '',
              woId:          '',
              woNo:          a.batchNo,
              batchNo:       a.batchNo,
              productCode:   a.productCode ?? '',
              productName:   a.productName ?? '',
              productSpec:   '',
              planQty:       Number(a.planQuantity) ?? 0,
              priority:      'NORMAL',
              tasks:         [],
              floatTickets:  [],
              routingSteps:  [],
              planQtyTotal:  Number(a.planQuantity)    ?? 0,
              reportQtyTotal:Number(a.completedQuantity) ?? 0,
              goodQtyTotal:  Number(a.qualifiedQuantity)  ?? 0,
              scrapQtyTotal: Number(a.rejectedQuantity)   ?? 0,
              yieldRate:     Number(a.qualifiedRate)      ?? 0,
              inspectionRecords: [] as import('./ebrData').EbrInspectionRecord[],
              deviations:    [] as import('./ebrData').EbrDeviation[],
              signatures:    [] as import('./ebrData').EbrSignature[],
              startTime:     a.createTime ?? now,
              createdAt:     a.createTime ?? now,
              updatedAt:     a.updateTime ?? now,
              operatorName:  a.operatorName,
            } as EbrRecord));
          return [...updated, ...newItems];
        });
      }
    } catch { /* graceful fallback to localStorage */ } finally {
      setApiLoading(false);
    }
  }, [setRecords]);

  useEffect(() => { loadFromApi(); }, [loadFromApi]);

  // 初始化时如果有指定批次号，自动展开对应详情
  useEffect(() => {
    if (initialBatchNo) {
      const target = records.find(r => r.batchNo === initialBatchNo);
      if (target) setDetailRecord(target);
    }
  // 只在组件挂载时执行一次
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── 统计 ─────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total:      records.length,
    inProgress: records.filter(r => r.status === 'IN_PROGRESS').length,
    completed:  records.filter(r => r.status === 'COMPLETED').length,
    reviewed:   records.filter(r => r.status === 'REVIEWED').length,
    approved:   records.filter(r => r.status === 'APPROVED').length,
    rejected:   records.filter(r => r.status === 'REJECTED').length,
  }), [records]);

  // ── 过滤 ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return records.filter(r => {
      const matchStatus = statusFilter === 'ALL' || r.status === statusFilter;
      const q = searchText.toLowerCase();
      const matchSearch = !q ||
        r.ebrNo.toLowerCase().includes(q) ||
        r.woNo.toLowerCase().includes(q) ||
        r.batchNo.toLowerCase().includes(q) ||
        r.productName.toLowerCase().includes(q) ||
        (r.customer ?? '').toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [records, statusFilter, searchText]);

  // ── 审核操作（async + refreshAfterWrite）────────────────────────
  const handleReview = (record: EbrRecord) => {
    Modal.confirm({
      title: '确认审核',
      icon: <CheckCircleOutlined style={{ color: '#1890ff' }} />,
      content: (
        <div>
          <p>即将对以下批次记录进行 QA 审核：</p>
          <p><Text strong>{record.ebrNo}</Text>（批次：{record.batchNo}）</p>
          <p style={{ color: '#fa8c16', marginTop: 8 }}>审核后状态将变更为「已审核」，请确认所有工序记录无误后操作。</p>
        </div>
      ),
      okText:     '确认审核',
      cancelText: '取消',
      onOk: async () => {
        const now = new Date().toLocaleString('zh-CN');
        const numId = Number(record.id);
        if (!isNaN(numId) && numId > 0) {
          try {
            await updateEbrRecord(numId, { status: 'REVIEWED' });
            await loadFromApi();
          } catch { /* fallback */ }
        }
        setRecords(prev => prev.map(r =>
          r.id === record.id
            ? { ...r, status: 'REVIEWED' as EbrStatus, reviewedBy: 'QA王质检(9999)', reviewedAt: now, reviewRemark: '记录核查完整，符合规范', updatedAt: now }
            : r
        ));
        message.success(`批次记录 ${record.ebrNo} 已完成 QA 审核`);
      },
    });
  };

  const handleApprove = (record: EbrRecord) => {
    Modal.confirm({
      title: '确认批准放行',
      icon: <SafetyCertificateOutlined style={{ color: '#52c41a' }} />,
      content: (
        <div>
          <p>即将批准以下批次放行：</p>
          <p><Text strong>{record.ebrNo}</Text>（批次：{record.batchNo}）</p>
          <Alert type="warning" showIcon message="批准后不可撤销，请确认无误后操作。" style={{ marginTop: 8 }} />
        </div>
      ),
      okText:     '批准放行',
      cancelText: '取消',
      okType:     'primary',
      onOk: async () => {
        const now = new Date().toLocaleString('zh-CN');
        const numId = Number(record.id);
        if (!isNaN(numId) && numId > 0) {
          try {
            await updateEbrRecord(numId, { status: 'APPROVED' });
            await loadFromApi();
          } catch { /* fallback */ }
        }
        setRecords(prev => prev.map(r =>
          r.id === record.id
            ? { ...r, status: 'APPROVED' as EbrStatus, approvedBy: '批准人赵主任(8888)', approvedAt: now, approveRemark: '批准放行', updatedAt: now }
            : r
        ));
        message.success(`批次 ${record.batchNo} 已批准放行`);
      },
    });
  };

  const handleReject = (record: EbrRecord) => {
    Modal.confirm({
      title: '驳回批次记录',
      icon: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
      content: (
        <div>
          <p>即将驳回批次记录：<Text strong>{record.ebrNo}</Text></p>
          <p style={{ color: '#ff4d4f', marginTop: 8 }}>驳回后需要补充整改材料重新提交。</p>
        </div>
      ),
      okText:     '确认驳回',
      cancelText: '取消',
      okType:     'danger',
      onOk: async () => {
        const now = new Date().toLocaleString('zh-CN');
        const numId = Number(record.id);
        if (!isNaN(numId) && numId > 0) {
          try {
            await updateEbrRecord(numId, { status: 'REJECTED' });
            await loadFromApi();
          } catch { /* fallback */ }
        }
        setRecords(prev => prev.map(r =>
          r.id === record.id
            ? { ...r, status: 'REJECTED' as EbrStatus, rejectedBy: '批准人赵主任(8888)', rejectedAt: now, rejectReason: '记录不完整，请补充', updatedAt: now }
            : r
        ));
        message.error(`批次记录 ${record.ebrNo} 已驳回`);
      },
    });
  };

  // ── 表格列 ───────────────────────────────────────────────────────
  const columns: ColumnsType<EbrRecord> = [
    {
      title: 'EBR 编号',
      dataIndex: 'ebrNo',
      key: 'ebrNo',
      width: 170,
      render: (v: string) => (
        <Text strong style={{ fontFamily: 'monospace', fontSize: 13, color: '#1a237e' }}>{v}</Text>
      ),
    },
    {
      title: '工单 / 批次',
      key: 'batch',
      width: 210,
      render: (_, r) => (
        <Space direction="vertical" size={2}>
          <Text style={{ fontSize: 12, color: '#666' }}>{r.woNo}</Text>
          <Text strong style={{ fontSize: 13 }}>{r.batchNo}</Text>
        </Space>
      ),
    },
    {
      title: '产品',
      key: 'product',
      width: 190,
      render: (_, r) => (
        <Space direction="vertical" size={2}>
          <Text strong style={{ fontSize: 13 }}>{r.productName}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>{r.productSpec}</Text>
        </Space>
      ),
    },
    {
      title: '计划 / 完工 / 合格',
      key: 'qty',
      width: 170,
      render: (_, r) => (
        <Space direction="vertical" size={2}>
          <Text style={{ fontSize: 12 }}>
            计划 <Text strong>{r.planQtyTotal}</Text> 件
          </Text>
          <Text style={{ fontSize: 12 }}>
            完工 <Text strong style={{ color: '#1890ff' }}>{r.reportQtyTotal}</Text> |
            合格 <Text strong style={{ color: '#52c41a' }}>{r.goodQtyTotal}</Text>
          </Text>
          {r.scrapQtyTotal > 0 && (
            <Text style={{ fontSize: 12 }}>
              报废 <Text strong style={{ color: '#ff4d4f' }}>{r.scrapQtyTotal}</Text>
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: '良率',
      dataIndex: 'yieldRate',
      key: 'yieldRate',
      width: 110,
      render: (v: number) => (
        <div>
          <Progress
            percent={v}
            size="small"
            strokeColor={v >= 98 ? '#52c41a' : v >= 95 ? '#faad14' : '#ff4d4f'}
            format={p => `${p}%`}
          />
        </div>
      ),
    },
    {
      title: '工序进度',
      key: 'progress',
      width: 150,
      render: (_, r) => {
        const total = r.routingSteps.length;
        const done  = r.routingSteps.filter(s => s.status === 'COMPLETED').length;
        return (
          <Space direction="vertical" size={2}>
            <Text style={{ fontSize: 12 }}>{done} / {total} 道工序</Text>
            <Progress
              percent={total > 0 ? Math.round((done / total) * 100) : 0}
              size="small"
              showInfo={false}
              strokeColor="#1a237e"
            />
          </Space>
        );
      },
    },
    {
      title: '检验记录',
      key: 'inspection',
      width: 100,
      render: (_, r) => {
        const total  = r.inspectionRecords.length;
        const passed = r.inspectionRecords.filter(i => i.conclusion === 'PASS').length;
        const failed = r.inspectionRecords.filter(i => i.conclusion === 'FAIL').length;
        return (
          <Space direction="vertical" size={2}>
            <Text style={{ fontSize: 12 }}>共 {total} 项</Text>
            {failed > 0
              ? <Tag color="error" style={{ fontSize: 11 }}>失败 {failed}</Tag>
              : total > 0
                ? <Tag color="success" style={{ fontSize: 11 }}>全部通过</Tag>
                : <Tag color="default" style={{ fontSize: 11 }}>待检验</Tag>
            }
          </Space>
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (v: EbrStatus) => {
        const cfg = STATUS_CONFIG[v];
        return (
          <Badge
            status={v === 'IN_PROGRESS' ? 'processing' : v === 'APPROVED' ? 'success' : v === 'REJECTED' ? 'error' : 'default'}
            text={<Tag color={cfg.color} icon={cfg.icon}>{cfg.label}</Tag>}
          />
        );
      },
    },
    {
      title: '开始时间',
      dataIndex: 'startTime',
      key: 'startTime',
      width: 145,
      render: (v: string) => <Text style={{ fontSize: 12 }}>{v}</Text>,
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 210,
      render: (_, r) => (
        <Space size={6}>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => setDetailRecord(r)}
          >
            查看
          </Button>
          {r.status === 'COMPLETED' && (
            <Button
              size="small"
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={() => handleReview(r)}
            >
              审核
            </Button>
          )}
          {r.status === 'REVIEWED' && (
            <>
              <Button
                size="small"
                type="primary"
                icon={<SafetyCertificateOutlined />}
                style={{ background: '#52c41a', borderColor: '#52c41a' }}
                onClick={() => handleApprove(r)}
              >
                批准
              </Button>
              <Button
                size="small"
                danger
                icon={<CloseCircleOutlined />}
                onClick={() => handleReject(r)}
              >
                驳回
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  // ── 详情页渲染 ───────────────────────────────────────────────────
  if (detailRecord) {
    return (
      <EbrDetailPage
        record={detailRecord}
        onBack={() => setDetailRecord(null)}
        onUpdate={(updated) => {
          setRecords(prev => prev.map(r => r.id === updated.id ? updated : r));
          setDetailRecord(updated);
        }}
        onNavigate={onNavigate}
      />
    );
  }

  return (
    <div style={{ padding: '16px 20px', background: '#f0f2f5', minHeight: '100vh' }}>
      {/* 页头 */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Space align="center">
            <FileTextOutlined style={{ fontSize: 24, color: '#1a237e' }} />
            <div>
              <Title level={4} style={{ margin: 0, color: '#1a237e' }}>电子批记录（EBR）</Title>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Electronic Batch Record — 基于 MES 生产数据自动生成，满足 GMP / ISO 13485 要求
              </Text>
            </div>
          </Space>
        </Col>
        <Col>
          <Space>
            <Button
              icon={<SyncOutlined />}
              onClick={() => {
                // 清空演示数据（MOCK 已置空，此操作将本地 EBR 记录清除）
                localStorage.setItem(EBR_STORAGE_KEY, JSON.stringify([]));
                localStorage.setItem(EBR_VERSION_KEY,  EBR_DATA_VERSION);
                setRecords([]);
                message.success('EBR 记录已清空');
              }}
            >
              清空批记录
            </Button>
            <Button icon={<PrinterOutlined />} onClick={() => message.info('批量导出功能开发中')}>
              批量导出
            </Button>
          </Space>
        </Col>
      </Row>

      {/* KPI 统计卡 */}
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        {[
          { label: '全部批次', value: stats.total,      color: '#1a237e', icon: <BarChartOutlined /> },
          { label: '生产中',   value: stats.inProgress, color: '#1890ff', icon: <SyncOutlined /> },
          { label: '待审核',   value: stats.completed,  color: '#fa8c16', icon: <FileDoneOutlined /> },
          { label: '已审核',   value: stats.reviewed,   color: '#13c2c2', icon: <CheckCircleOutlined /> },
          { label: '已批准',   value: stats.approved,   color: '#52c41a', icon: <SafetyCertificateOutlined /> },
          { label: '已驳回',   value: stats.rejected,   color: '#ff4d4f', icon: <CloseCircleOutlined /> },
        ].map(({ label, value, color, icon }) => (
          <Col key={label} xs={12} sm={8} md={4}>
            <Card
              size="small"
              style={{ borderRadius: 8, borderTop: `3px solid ${color}`, cursor: 'pointer' }}
              onClick={() => {
                const map: Record<string, EbrStatus | 'ALL'> = {
                  '全部批次': 'ALL', '生产中': 'IN_PROGRESS', '待审核': 'COMPLETED',
                  '已审核': 'REVIEWED', '已批准': 'APPROVED', '已驳回': 'REJECTED',
                };
                setStatusFilter(map[label] ?? 'ALL');
              }}
            >
              <Statistic
                title={<Space size={4}>{icon}<span style={{ fontSize: 12 }}>{label}</span></Space>}
                value={value}
                valueStyle={{ color, fontSize: 22, fontWeight: 700 }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* 筛选栏 */}
      <Card style={{ marginBottom: 16, borderRadius: 8 }}>
        <Row gutter={12} align="middle">
          <Col flex="1">
            <Input
              prefix={<SearchOutlined />}
              placeholder="搜索 EBR编号 / 工单号 / 批次号 / 产品名称"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              allowClear
              size="large"
            />
          </Col>
          <Col>
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              size="large"
              style={{ width: 140 }}
            >
              <Option value="ALL">全部状态</Option>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                <Option key={k} value={k}>
                  <Tag color={v.color}>{v.label}</Tag>
                </Option>
              ))}
            </Select>
          </Col>
          <Col>
            <Tooltip title="从后端刷新">
              <Button
                icon={<SyncOutlined />}
                size="large"
                loading={apiLoading}
                onClick={() => loadFromApi()}
              />
            </Tooltip>
          </Col>
        </Row>
      </Card>

      {/* 表格 */}
      <Card style={{ borderRadius: 8 }}>
        {stats.completed > 0 && (
          <Alert
            type="warning"
            showIcon
            icon={<ExclamationCircleOutlined />}
            message={`有 ${stats.completed} 份批记录已完成生产，等待 QA 审核`}
            style={{ marginBottom: 12 }}
          />
        )}
        <Spin spinning={apiLoading}>
          <Table
            columns={columns}
            dataSource={filtered}
            rowKey="id"
            scroll={{ x: 1400 }}
            pagination={{ pageSize: 10, showSizeChanger: true, showTotal: t => `共 ${t} 条` }}
            rowClassName={(r) => r.status === 'REJECTED' ? 'ebr-row-rejected' : ''}
          />
        </Spin>
      </Card>
    </div>
  );
};

export default EbrListPage;

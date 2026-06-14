/**
 * MaterialIssuancePage.tsx — 工序领料单管理
 * 基于《BOM工序领料PRD.docx》实现
 * 功能：领料单列表 / 详情 / 创建 / 状态流转 / 发料确认
 */
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Table, Tag, Button, Space, Input, Select, Modal, Form,
  Descriptions, Badge, Progress, message, Drawer, Tooltip,
  Row, Col, Statistic, Card, Popconfirm, InputNumber, Divider,
  Alert, Steps,
} from 'antd';
import {
  PlusOutlined, SearchOutlined, ReloadOutlined,
  EyeOutlined, CheckOutlined, CloseOutlined, SendOutlined,
  PrinterOutlined, ExclamationCircleOutlined, InboxOutlined,
  ThunderboltOutlined, TagOutlined, ShopOutlined,
} from '@ant-design/icons';
import {
  IssueOrder, IssueLine, IssueStatus, IssueMethod,
  loadIssueOrders, saveIssueOrders,
  ISSUE_STATUS_LABEL, ISSUE_STATUS_COLOR,
  ISSUE_METHOD_LABEL, ISSUE_METHOD_COLOR,
  PRIORITY_LABEL, PRIORITY_COLOR,
  genIssueNo,
} from '../../store/issuanceStore';
import { getMaterialIssuanceList } from '../../api/materialIssuances';

const { Option } = Select;

// ── 状态步骤条 ────────────────────────────────────────────────────
const STATUS_STEPS: IssueStatus[] = ['PENDING', 'PICKING', 'PICKED', 'RECEIVED'];

const IssueStatusStep: React.FC<{ status: IssueStatus }> = ({ status }) => {
  const idx = STATUS_STEPS.indexOf(status);
  return (
    <Steps
      size="small"
      current={idx < 0 ? 0 : idx}
      status={status === 'EXCEPTION' ? 'error' : status === 'CLOSED' ? 'finish' : 'process'}
      items={STATUS_STEPS.map(s => ({ title: ISSUE_STATUS_LABEL[s] }))}
      style={{ maxWidth: 500 }}
    />
  );
};

// ── 物料行卡片（增强版）──────────────────────────────────────────
const LineCard: React.FC<{ line: IssueLine; onUpdate: (l: IssueLine) => void }> = ({ line, onUpdate }) => {
  const pct = line.planQty > 0 ? Math.round((line.actualQty / line.planQty) * 100) : 0;
  const methodColor = ISSUE_METHOD_COLOR[line.issueMethod];
  // 冷链标识：线边仓或来源仓库含"冷"字
  const isColdChain = (line.wipWarehouse + (line.sourceWarehouse ?? '')).includes('冷');
  // 批次效期告警：最近效期距今 ≤ 180天
  const nearExpiry = line.batchPicks.some(b => {
    if (!b.expiryDate) return false;
    const diff = (new Date(b.expiryDate).getTime() - Date.now()) / 86400000;
    return diff > 0 && diff <= 180;
  });

  const statusBadge = {
    DONE:      <Badge status="success" text={<span style={{ fontSize: 12 }}>已完成</span>} />,
    PENDING:   <Badge status="default" text={<span style={{ fontSize: 12 }}>待拣货</span>} />,
    EXCEPTION: <Badge status="error"   text={<span style={{ fontSize: 12 }}>异常</span>} />,
    SKIP:      <Badge status="warning" text={<span style={{ fontSize: 12 }}>已跳过</span>} />,
  }[line.status] ?? <Badge status="default" text="未知" />;

  return (
    <Card
      size="small"
      style={{
        marginBottom: 10,
        borderLeft: `4px solid ${methodColor}`,
        background: line.status === 'DONE' ? '#f6ffed' : line.status === 'EXCEPTION' ? '#fff2f0' : '#fff',
      }}
      bodyStyle={{ padding: '12px 16px' }}
    >
      {/* ── 行一：物料名 + 编码规格 + 标签 ── */}
      <Row gutter={8} align="middle" style={{ marginBottom: 8 }}>
        <Col flex="none">
          <span style={{
            display: 'inline-block', width: 22, height: 22, lineHeight: '22px',
            textAlign: 'center', background: '#f0f0f0', borderRadius: '50%',
            fontSize: 11, color: '#666', fontWeight: 600,
          }}>
            {line.lineNo}
          </span>
        </Col>
        <Col flex="1">
          <Space size={6} wrap>
            <span style={{ fontWeight: 700, fontSize: 14, color: '#1a1a1a' }}>{line.itemName}</span>
            <Tag style={{ fontSize: 10, lineHeight: '18px', padding: '0 6px', margin: 0 }}
                 color={methodColor}>
              {ISSUE_METHOD_LABEL[line.issueMethod]}
            </Tag>
            {isColdChain && (
              <Tag color="cyan" style={{ fontSize: 10, lineHeight: '18px', padding: '0 6px', margin: 0 }}>
                ❄ 冷链
              </Tag>
            )}
            {nearExpiry && (
              <Tag color="orange" style={{ fontSize: 10, lineHeight: '18px', padding: '0 6px', margin: 0 }}>
                ⚠ 近效期
              </Tag>
            )}
          </Space>
          <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
            {line.itemCode}
            {line.spec ? <Tooltip title={line.spec}><span style={{ cursor: 'help' }}> · {line.spec.length > 30 ? line.spec.slice(0, 30) + '…' : line.spec}</span></Tooltip> : null}
          </div>
        </Col>
        <Col flex="none">
          {statusBadge}
        </Col>
      </Row>

      {/* ── 行二：数量 + 进度 + 仓位 ── */}
      <Row gutter={16} align="middle">
        {/* 需求 / 实发 */}
        <Col span={6}>
          <div style={{ fontSize: 12, color: '#595959' }}>
            计划需求：<b style={{ color: '#1677ff' }}>{line.planQty.toLocaleString()}</b>
            <span style={{ color: '#888', marginLeft: 2 }}>{line.unit}</span>
          </div>
          <div style={{ fontSize: 12, color: '#595959', marginTop: 2 }}>
            实际发料：<b style={{ color: pct >= 100 ? '#52c41a' : pct > 0 ? '#faad14' : '#d9d9d9' }}>
              {line.actualQty.toLocaleString()}
            </b>
            <span style={{ color: '#888', marginLeft: 2 }}>{line.unit}</span>
          </div>
        </Col>

        {/* 进度条 */}
        <Col span={8}>
          <Progress
            percent={pct}
            size="small"
            strokeColor={pct >= 100 ? '#52c41a' : pct > 0 ? '#1677ff' : undefined}
            status={pct >= 100 ? 'success' : pct > 0 ? 'active' : 'normal'}
            format={p => <span style={{ fontSize: 11 }}>{p}%</span>}
          />
        </Col>

        {/* 仓位流向 */}
        <Col span={10}>
          <div style={{ fontSize: 11, color: '#595959' }}>
            <span style={{ color: '#888' }}>来源：</span>
            <b style={{ color: '#262626' }}>{line.sourceWarehouse ?? '—'}</b>
            <span style={{ color: '#bbb', margin: '0 4px' }}>→</span>
            <b style={{ color: isColdChain ? '#13c2c2' : '#722ed1' }}>{line.wipWarehouse}</b>
          </div>
          {line.operationCode && (
            <div style={{ fontSize: 10, color: '#999', marginTop: 2 }}>
              关联工序：{line.operationCode}
            </div>
          )}
        </Col>
      </Row>

      {/* ── 行三：批次明细（有批次时展开显示）── */}
      {line.batchPicks.length > 0 && (
        <div style={{
          marginTop: 10, paddingTop: 8,
          borderTop: '1px dashed #f0f0f0',
        }}>
          <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>
            批次拣货明细（共 {line.batchPicks.length} 个批次）：
          </div>
          <Space size={6} wrap>
            {line.batchPicks.map((b, i) => (
              <Tooltip
                key={i}
                title={
                  <div style={{ fontSize: 12 }}>
                    <div>批次号：{b.batchNo}</div>
                    <div>数量：{b.qty} {line.unit}</div>
                    {b.inboundDate && <div>入库日期：{b.inboundDate}</div>}
                    {b.expiryDate  && <div style={{ color: '#ff7a45' }}>效期至：{b.expiryDate}</div>}
                    <div>来源仓：{b.warehouseCode}</div>
                  </div>
                }
              >
                <Tag
                  style={{ fontSize: 10, cursor: 'default', margin: 0 }}
                  color={b.expiryDate && (new Date(b.expiryDate).getTime() - Date.now()) / 86400000 <= 180 ? 'orange' : 'blue'}
                >
                  {b.batchNo} · {b.qty}{line.unit}
                  {b.expiryDate ? ` · 效期${b.expiryDate}` : ''}
                </Tag>
              </Tooltip>
            ))}
          </Space>
        </div>
      )}

      {/* ── 异常备注 ── */}
      {line.exceptionRemark && (
        <Alert
          type="error" showIcon banner
          message={line.exceptionRemark}
          style={{ marginTop: 8, fontSize: 12, padding: '4px 8px' }}
        />
      )}
    </Card>
  );
};

// ── 主组件 ────────────────────────────────────────────────────────
const MaterialIssuancePage: React.FC = () => {
  const [orders, setOrders]             = useState<IssueOrder[]>(loadIssueOrders);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterKeyword, setFilterKeyword] = useState('');
  const [filterMethod, setFilterMethod] = useState<string>('');
  const [detailOrder, setDetailOrder]   = useState<IssueOrder | null>(null);
  const [detailOpen, setDetailOpen]     = useState(false);
  const [createOpen, setCreateOpen]     = useState(false);
  const [form]                          = Form.useForm();

  // ── 后端数据合并 ──────────────────────────────────────────────
  const loadFromApi = useCallback(async () => {
    try {
      const resp = await getMaterialIssuanceList() as any;
      const apiList: any[] = resp?.data ?? [];
      if (apiList.length > 0) {
        const newOrders: IssueOrder[] = apiList.map(item => ({
          id:            String(item.id),
          issueNo:       item.issuanceNo ?? '',
          woNo:          item.workCenterName ?? '',
          productCode:   '',
          productName:   item.remark ?? '',
          issueMethod:   'PUSH' as const,
          priority:      'MEDIUM' as const,
          warehouse:     item.warehouseName ?? '原料仓',
          wipWarehouse:  item.workCenterName ?? '',
          planDate:      item.requestTime ? item.requestTime.slice(0, 10) : '',
          lines:         [],
          status:        (['PENDING','PICKING','PICKED','RECEIVED','CLOSED','EXCEPTION'].includes(item.status)
                           ? item.status : 'PENDING') as IssueStatus,
          createdBy:     item.requesterName ?? '',
          createdAt:     item.requestTime ?? '',
          remark:        item.remark ?? '',
        }));
        setOrders(newOrders);  // API-first REPLACE
      }
    } catch { /* backend unavailable, use local mock */ }
  }, []);

  useEffect(() => { loadFromApi(); }, [loadFromApi]);

  // ── 统计 ─────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total:     orders.length,
    pending:   orders.filter(o => o.status === 'PENDING').length,
    picking:   orders.filter(o => o.status === 'PICKING').length,
    exception: orders.filter(o => o.status === 'EXCEPTION').length,
    today:     orders.filter(o => o.planDate === '2026-04-30').length,
  }), [orders]);

  // ── 过滤 ─────────────────────────────────────────────────────
  const filtered = useMemo(() => orders.filter(o => {
    if (filterStatus && o.status !== filterStatus) return false;
    if (filterMethod && o.issueMethod !== filterMethod) return false;
    if (filterKeyword) {
      const kw = filterKeyword.toLowerCase();
      return o.issueNo.toLowerCase().includes(kw) ||
             o.woNo.toLowerCase().includes(kw) ||
             o.productName.toLowerCase().includes(kw);
    }
    return true;
  }), [orders, filterStatus, filterMethod, filterKeyword]);

  // ── 操作：状态流转 ───────────────────────────────────────────
  const updateStatus = (id: string, status: IssueStatus, extra?: Partial<IssueOrder>) => {
    const updated = orders.map(o =>
      o.id === id ? { ...o, status, ...extra } : o
    );
    setOrders(updated);
    saveIssueOrders(updated);
    if (detailOrder?.id === id) setDetailOrder(prev => prev ? { ...prev, status, ...extra } : null);
    message.success(`领料单状态已更新：${ISSUE_STATUS_LABEL[status]}`);
  };

  // ── 操作：仓管接单（PENDING → PICKING） ─────────────────────
  const handleStartPick = (order: IssueOrder) => {
    updateStatus(order.id, 'PICKING', { pickedBy: '仓管员', pickedAt: new Date().toLocaleString('zh-CN') });
  };

  // ── 操作：确认发料（PICKING → PICKED） ──────────────────────
  const handleConfirmIssue = (order: IssueOrder) => {
    const allDone = order.lines.every(l => l.status === 'DONE' || l.status === 'SKIP');
    if (!allDone) {
      message.warning('还有物料未完成拣货，请先完成所有物料');
      return;
    }
    updateStatus(order.id, 'PICKED');
  };

  // ── 操作：车间签收（PICKED → RECEIVED） ─────────────────────
  const handleReceive = (order: IssueOrder) => {
    updateStatus(order.id, 'RECEIVED', { receivedBy: '车间操作员', receivedAt: new Date().toLocaleString('zh-CN') });
  };

  // ── 操作：新建领料单 ─────────────────────────────────────────
  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      const newOrder: IssueOrder = {
        id: `ISO${Date.now()}`,
        issueNo: genIssueNo(),
        woNo: values.woNo,
        productCode: values.productCode || 'UNKNOWN',
        productName: values.productName,
        issueMethod: values.issueMethod,
        priority: values.priority,
        warehouse: values.warehouse || 'NJ-RM-原料仓',
        wipWarehouse: values.wipWarehouse || 'WIP-NJ-称量',
        planDate: '2026-04-30',
        status: 'PENDING',
        createdBy: '系统管理员',
        createdAt: new Date().toLocaleString('zh-CN'),
        lines: [],
      };
      const updated = [newOrder, ...orders];
      setOrders(updated);
      saveIssueOrders(updated);
      setCreateOpen(false);
      form.resetFields();
      message.success(`领料单 ${newOrder.issueNo} 创建成功`);
    } catch { /* validation */ }
  };

  // ── 列定义 ───────────────────────────────────────────────────
  const columns = [
    {
      title: '领料单号', dataIndex: 'issueNo', width: 180,
      render: (v: string, r: IssueOrder) => (
        <Button type="link" style={{ padding: 0 }} onClick={() => { setDetailOrder(r); setDetailOpen(true); }}>
          {v}
        </Button>
      ),
    },
    {
      title: '工单', dataIndex: 'woNo', width: 160,
      render: (v: string) => <span style={{ fontSize: 12 }}>{v}</span>,
    },
    { title: '产品', dataIndex: 'productName', width: 140 },
    {
      title: '工序', width: 100,
      render: (_: any, r: IssueOrder) => r.operationName
        ? <span>{r.operationSeq}-{r.operationName}</span>
        : <span style={{ color: '#aaa' }}>全工序</span>,
    },
    {
      title: '领料方式', dataIndex: 'issueMethod', width: 100,
      render: (v: IssueMethod) => (
        <Tag color={ISSUE_METHOD_COLOR[v]} style={{ fontSize: 11 }}>
          {ISSUE_METHOD_LABEL[v]}
        </Tag>
      ),
    },
    {
      title: '优先级', dataIndex: 'priority', width: 80,
      render: (v: string) => (
        <Tag color={PRIORITY_COLOR[v as keyof typeof PRIORITY_COLOR]}>
          {PRIORITY_LABEL[v as keyof typeof PRIORITY_LABEL]}
        </Tag>
      ),
    },
    {
      title: '物料数', width: 80,
      render: (_: any, r: IssueOrder) => {
        const done = r.lines.filter(l => l.status === 'DONE').length;
        return <span>{done}/{r.lines.length}</span>;
      },
    },
    {
      title: '状态', dataIndex: 'status', width: 120,
      render: (v: IssueStatus) => (
        <Badge status={ISSUE_STATUS_COLOR[v] as any} text={ISSUE_STATUS_LABEL[v]} />
      ),
    },
    { title: '计划日期', dataIndex: 'planDate', width: 110 },
    {
      title: '操作', width: 180, fixed: 'right' as const,
      render: (_: any, r: IssueOrder) => (
        <Space size={4}>
          <Button size="small" icon={<EyeOutlined />} onClick={() => { setDetailOrder(r); setDetailOpen(true); }}>
            详情
          </Button>
          {r.status === 'PENDING' && (
            <Button size="small" type="primary" icon={<SendOutlined />} onClick={() => handleStartPick(r)}>
              接单
            </Button>
          )}
          {r.status === 'PICKING' && (
            <Button size="small" type="primary" icon={<CheckOutlined />} onClick={() => handleConfirmIssue(r)}>
              发料
            </Button>
          )}
          {r.status === 'PICKED' && (
            <Button size="small" icon={<InboxOutlined />} onClick={() => handleReceive(r)}>
              签收
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '0 0 24px' }}>
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 20 }}>
        {[
          { title: '今日领料单', value: stats.today, color: '#1677ff', icon: <TagOutlined /> },
          { title: '待拣货', value: stats.pending, color: '#faad14', icon: <ShopOutlined /> },
          { title: '拣货中', value: stats.picking, color: '#1677ff', icon: <SendOutlined /> },
          { title: '异常待处理', value: stats.exception, color: '#f5222d', icon: <ExclamationCircleOutlined /> },
        ].map(s => (
          <Col span={6} key={s.title}>
            <Card size="small" style={{ borderRadius: 10 }}>
              <Statistic title={s.title} value={s.value} prefix={s.icon}
                valueStyle={{ color: s.color, fontSize: 22 }} />
            </Card>
          </Col>
        ))}
      </Row>

      {/* 工具栏 */}
      <Row gutter={12} style={{ marginBottom: 14 }} align="middle">
        <Col>
          <Input
            prefix={<SearchOutlined />}
            placeholder="单号/工单/产品"
            value={filterKeyword}
            onChange={e => setFilterKeyword(e.target.value)}
            style={{ width: 200 }}
          />
        </Col>
        <Col>
          <Select
            value={filterStatus} onChange={setFilterStatus}
            style={{ width: 130 }} placeholder="状态"
          >
            <Option value="">全部状态</Option>
            {Object.entries(ISSUE_STATUS_LABEL).map(([k, v]) => (
              <Option key={k} value={k}>{v}</Option>
            ))}
          </Select>
        </Col>
        <Col>
          <Select value={filterMethod} onChange={setFilterMethod} style={{ width: 130 }} placeholder="领料方式">
            <Option value="">全部方式</Option>
            {Object.entries(ISSUE_METHOD_LABEL).map(([k, v]) => (
              <Option key={k} value={k}>{v}</Option>
            ))}
          </Select>
        </Col>
        <Col>
          <Button icon={<ReloadOutlined />} onClick={() => { setFilterKeyword(''); setFilterStatus(''); setFilterMethod(''); }}>
            重置
          </Button>
        </Col>
        <Col flex="auto" style={{ textAlign: 'right' }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
            新建领料单
          </Button>
        </Col>
      </Row>

      {/* 表格 */}
      <Table
        dataSource={filtered}
        columns={columns}
        rowKey="id"
        size="small"
        pagination={{ pageSize: 10, showSizeChanger: false, showTotal: t => `共 ${t} 条` }}
        scroll={{ x: 1200 }}
        rowClassName={r => r.status === 'EXCEPTION' ? 'row-exception' : ''}
      />

      {/* 详情抽屉 */}
      <Drawer
        title={
          <Space>
            <TagOutlined />
            <span>领料单详情 — {detailOrder?.issueNo}</span>
            {detailOrder && (
              <Tag color={ISSUE_STATUS_COLOR[detailOrder.status] as any}>
                {ISSUE_STATUS_LABEL[detailOrder.status]}
              </Tag>
            )}
          </Space>
        }
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        width={760}
        extra={
          detailOrder && (
            <Space>
              {detailOrder.status === 'PENDING' && (
                <Button type="primary" size="small" onClick={() => handleStartPick(detailOrder)}>
                  接单开始拣货
                </Button>
              )}
              {detailOrder.status === 'PICKING' && (
                <Button type="primary" size="small" onClick={() => handleConfirmIssue(detailOrder)}>
                  确认发料
                </Button>
              )}
              {detailOrder.status === 'PICKED' && (
                <Button size="small" onClick={() => handleReceive(detailOrder)}>
                  车间签收
                </Button>
              )}
              <Button size="small" icon={<PrinterOutlined />}>打印</Button>
            </Space>
          )
        }
      >
        {detailOrder && (
          <div>
            {/* 状态进度 */}
            <div style={{ marginBottom: 20 }}>
              <IssueStatusStep status={detailOrder.status} />
            </div>

            {detailOrder.status === 'EXCEPTION' && (
              <Alert
                type="error" showIcon
                message="领料异常"
                description="部分物料存在缺料或库存异常，请联系仓库主管处理"
                style={{ marginBottom: 14 }}
              />
            )}

            {/* 基本信息 */}
            <Descriptions bordered size="small" column={2} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="领料单号">{detailOrder.issueNo}</Descriptions.Item>
              <Descriptions.Item label="关联工单">{detailOrder.woNo}</Descriptions.Item>
              <Descriptions.Item label="产品">{detailOrder.productName}</Descriptions.Item>
              <Descriptions.Item label="工序">
                {detailOrder.operationSeq ? `${detailOrder.operationSeq}-${detailOrder.operationName}` : '全工序'}
              </Descriptions.Item>
              <Descriptions.Item label="领料方式">
                <Tag color={ISSUE_METHOD_COLOR[detailOrder.issueMethod]}>
                  {ISSUE_METHOD_LABEL[detailOrder.issueMethod]}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="优先级">
                <Tag color={PRIORITY_COLOR[detailOrder.priority]}>
                  {PRIORITY_LABEL[detailOrder.priority]}优先
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="源仓库">{detailOrder.warehouse}</Descriptions.Item>
              <Descriptions.Item label="目标线边仓">
                <span style={{ color: (detailOrder.wipWarehouse ?? '').includes('冷') ? '#13c2c2' : '#722ed1', fontWeight: 600 }}>
                  {detailOrder.wipWarehouse}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="计划日期">{detailOrder.planDate}</Descriptions.Item>
              <Descriptions.Item label="创建人/时间">{detailOrder.createdBy} · {detailOrder.createdAt}</Descriptions.Item>
              {detailOrder.pickedBy && (
                <Descriptions.Item label="拣货人/时间">{detailOrder.pickedBy} · {detailOrder.pickedAt}</Descriptions.Item>
              )}
              {detailOrder.receivedBy && (
                <Descriptions.Item label="签收人/时间">{detailOrder.receivedBy} · {detailOrder.receivedAt}</Descriptions.Item>
              )}
              {detailOrder.moNo && (
                <Descriptions.Item label="关联生产订单">{detailOrder.moNo}</Descriptions.Item>
              )}
              {detailOrder.remark && (
                <Descriptions.Item label="备注" span={2}>
                  <span style={{ color: '#595959' }}>{detailOrder.remark}</span>
                </Descriptions.Item>
              )}
            </Descriptions>

            {/* 物料明细 */}
            <Divider style={{ margin: '12px 0 10px' }}>
              物料明细（共 {detailOrder.lines.length} 种，已完成 {detailOrder.lines.filter(l => l.status === 'DONE').length} 种）
            </Divider>
            {detailOrder.lines.map(line => (
              <LineCard key={line.id} line={line} onUpdate={updatedLine => {
                const newOrder = {
                  ...detailOrder,
                  lines: detailOrder.lines.map(l => l.id === updatedLine.id ? updatedLine : l),
                };
                setDetailOrder(newOrder);
                const updated = orders.map(o => o.id === newOrder.id ? newOrder : o);
                setOrders(updated);
                saveIssueOrders(updated);
              }} />
            ))}

            {/* 发料汇总 */}
            {(detailOrder.status === 'PICKED' || detailOrder.status === 'RECEIVED') && (
              <>
                <Divider style={{ margin: '12px 0 10px' }}>发料汇总</Divider>
                <Table
                  size="small"
                  dataSource={detailOrder.lines.filter(l => l.status === 'DONE')}
                  rowKey="id"
                  pagination={false}
                  columns={[
                    { title: '物料', render: (_: any, r: IssueLine) => `${r.itemCode} ${r.itemName}` },
                    { title: '实发数量', render: (_: any, r: IssueLine) => `${r.actualQty} ${r.unit}` },
                    { title: '批次', render: (_: any, r: IssueLine) => r.batchPicks.map(b => b.batchNo).join(' + ') },
                    { title: '去向', dataIndex: 'wipWarehouse' },
                  ]}
                />
              </>
            )}
          </div>
        )}
      </Drawer>

      {/* 新建领料单弹窗 */}
      <Modal
        open={createOpen}
        title={<><PlusOutlined style={{ marginRight: 6 }} />新建工序领料单</>}
        onOk={handleCreate}
        onCancel={() => { setCreateOpen(false); form.resetFields(); }}
        okText="创建"
        cancelText="取消"
        width={520}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="woNo" label="关联工单号" rules={[{ required: true }]}>
                <Input placeholder="如 WO-20260605-001" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="productName" label="产品名称" rules={[{ required: true }]}>
                <Input placeholder="如 VitC咀嚼片 100mg×60片" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="issueMethod" label="领料方式" initialValue="PUSH" rules={[{ required: true }]}>
                <Select>
                  <Option value="PUSH">主动领料（PUSH）</Option>
                  <Option value="BACKFLUSH">倒扣领料（BACKFLUSH）</Option>
                  <Option value="ON_SITE">现场领料</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="priority" label="优先级" initialValue="MEDIUM" rules={[{ required: true }]}>
                <Select>
                  <Option value="HIGH">高优先级</Option>
                  <Option value="MEDIUM">中优先级</Option>
                  <Option value="LOW">低优先级</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="warehouse" label="领料仓库" initialValue="NJ-RM-原料仓">
                <Select>
                  <Option value="NJ-RM-原料仓">南京-原料仓</Option>
                  <Option value="NJ-PM-包材仓">南京-包材仓</Option>
                  <Option value="LS-COLD-冷库（≤8℃）">溧水-冷库（≤8℃）</Option>
                  <Option value="LS-PM-包材仓">溧水-包材仓</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="wipWarehouse" label="目标线边仓" initialValue="WIP-NJ-称量">
                <Select>
                  <Option value="WIP-NJ-称量">南京-称量线边仓</Option>
                  <Option value="WIP-NJ-制粒">南京-制粒线边仓</Option>
                  <Option value="WIP-NJ-压片">南京-压片线边仓</Option>
                  <Option value="WIP-NJ-内包">南京-内包装线边仓</Option>
                  <Option value="WIP-LS-混合（冷链）">溧水-混合线边仓（冷链）</Option>
                  <Option value="WIP-LS-充填">溧水-充填线边仓</Option>
                  <Option value="WIP-LS-泡罩">溧水-泡罩线边仓</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default MaterialIssuancePage;

import React, { useState, useEffect, useCallback } from 'react';
import { getFloatTicketList, createFloatTicket } from '../../api/floatTickets';
import {
  Button, Input, Select, Drawer, message,
  Modal, Form, InputNumber, Tooltip,
} from 'antd';
import {
  SearchOutlined, PlusOutlined, PrinterOutlined, ReloadOutlined,
  CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined,
  SyncOutlined, EyeOutlined, CopyOutlined, FileTextOutlined,
  CaretRightOutlined, StopOutlined, ExclamationCircleOutlined,
} from '@ant-design/icons';
import {
  mockTickets, FloatTicket, TicketStep, TICKET_STATUS_MAP, ticketSummary, TicketStatus,
} from './floatTicketData';
import { isUserCleared } from '../../store/mesStore';
import './FloatTicketPage.css';

const { Option } = Select;

// ── 步骤状态图标 ─────────────────────────────────────────────────────
const stepStatusIcon = (s: TicketStep['status']) => {
  if (s === 'DONE')    return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
  if (s === 'RUNNING') return <SyncOutlined spin style={{ color: '#1890ff' }} />;
  if (s === 'SKIP')    return <CloseCircleOutlined style={{ color: '#8c8c8c' }} />;
  return <ClockCircleOutlined style={{ color: '#595959' }} />;
};

// ── 工序进度条 ────────────────────────────────────────────────────────
const StepTimeline: React.FC<{ steps: TicketStep[] }> = ({ steps }) => (
  <div className="ft-timeline">
    {steps.map((step, idx) => (
      <div key={step.seq} className={`ft-step ft-step-${step.status.toLowerCase()}`}>
        <div className="ft-step-icon">{stepStatusIcon(step.status)}</div>
        <div className="ft-step-line" style={{ display: idx === steps.length - 1 ? 'none' : undefined }} />
        <div className="ft-step-body">
          <div className="ft-step-title">
            <span className="ft-step-seq">P{idx + 1}</span>
            <span className="ft-step-name">{step.operationName}</span>
            <span className="ft-step-station">{step.stationName}</span>
          </div>
          {step.operator && (
            <div className="ft-step-meta">
              <span>👤 {step.operator}</span>
              {step.startTime && <span>🕒 {step.startTime}{step.endTime ? ` → ${step.endTime}` : ' (进行中)'}</span>}
            </div>
          )}
          {(step.inputQty !== undefined || step.outputQty !== undefined) && (
            <div className="ft-step-qty">
              {step.inputQty !== undefined && <span>投入 <b>{step.inputQty.toLocaleString()}</b></span>}
              {step.outputQty !== undefined && <span>产出 <b style={{ color: '#52c41a' }}>{step.outputQty.toLocaleString()}</b></span>}
              {step.scrapQty !== undefined && step.scrapQty > 0 && <span>报废 <b style={{ color: '#ff4d4f' }}>{step.scrapQty.toLocaleString()}</b></span>}
            </div>
          )}
          {step.checkResult && (
            <div className="ft-step-warn">
              <ExclamationCircleOutlined /> {step.checkResult}
            </div>
          )}
        </div>
      </div>
    ))}
  </div>
);

// ── 浮票详情抽屉 ─────────────────────────────────────────────────────
const TicketDrawer: React.FC<{
  ticket: FloatTicket | null;
  open: boolean;
  onClose: () => void;
}> = ({ ticket, open, onClose }) => {
  if (!ticket) return null;
  const statusConf = TICKET_STATUS_MAP[ticket.status];
  const doneSteps = ticket.steps.filter(s => s.status === 'DONE').length;
  const totalSteps = ticket.steps.filter(s => s.status !== 'SKIP').length;
  const overallPct = totalSteps > 0 ? Math.round((doneSteps / totalSteps) * 100) : 0;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={420}
      title={
        <span style={{ color: '#e8f4fd' }}>
          浮票详情 — <span style={{ color: statusConf.color }}>{statusConf.label}</span>
        </span>
      }
      className="ft-drawer"
      styles={{
        header: { background: '#0f2a4a', borderBottom: '1px solid #1e4a7a' },
        body: { background: '#0f1923', padding: 16 },
      }}
    >
      {/* 基本信息 */}
      <div className="ft-drawer-section">
        <div className="ft-drawer-title">📋 基本信息</div>
        <div className="ft-drawer-row"><span className="fd-label">浮票编号</span><span className="fd-val blue">{ticket.ticketNo}</span></div>
        <div className="ft-drawer-row"><span className="fd-label">生产批号</span>
          <span className="fd-val blue" style={{ cursor: 'pointer' }}
            onClick={() => { navigator.clipboard?.writeText(ticket.batchNo); message.success('批号已复制'); }}>
            {ticket.batchNo} <CopyOutlined style={{ fontSize: 11 }} />
          </span>
        </div>
        <div className="ft-drawer-row"><span className="fd-label">产品</span><span className="fd-val">{ticket.productName}</span></div>
        <div className="ft-drawer-row"><span className="fd-label">规格</span><span className="fd-val">{ticket.productSpec}</span></div>
        <div className="ft-drawer-row"><span className="fd-label">工艺路径</span><span className="fd-val">{ticket.routingName}</span></div>
        <div className="ft-drawer-row"><span className="fd-label">创建人</span><span className="fd-val">{ticket.createdBy}</span></div>
        <div className="ft-drawer-row"><span className="fd-label">创建时间</span><span className="fd-val">{ticket.createdAt}</span></div>
      </div>

      {/* 数量汇总 */}
      <div className="ft-drawer-section">
        <div className="ft-drawer-title">📊 数量汇总</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <div className="ft-qty-card"><div className="ft-qty-val">{ticket.planQty.toLocaleString()}</div><div className="ft-qty-label">计划数</div></div>
          <div className="ft-qty-card ft-qty-green"><div className="ft-qty-val">{(ticket.actualQty ?? 0).toLocaleString()}</div><div className="ft-qty-label">实际数</div></div>
          <div className="ft-qty-card ft-qty-red"><div className="ft-qty-val">{(ticket.scrapQty ?? 0).toLocaleString()}</div><div className="ft-qty-label">报废数</div></div>
        </div>
        {/* 整体进度 */}
        <div style={{ marginTop: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>
            <span>整体进度 ({doneSteps}/{totalSteps} 工序)</span>
            <span style={{ color: overallPct === 100 ? '#52c41a' : '#1890ff' }}>{overallPct}%</span>
          </div>
          <div style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3 }}>
            <div style={{ height: '100%', width: `${overallPct}%`, background: overallPct === 100 ? '#52c41a' : '#1890ff', borderRadius: 3, transition: 'width 0.5s' }} />
          </div>
        </div>
      </div>

      {/* 检验信息 */}
      {ticket.inspector && (
        <div className="ft-drawer-section">
          <div className="ft-drawer-title">🔬 检验信息</div>
          <div className="ft-drawer-row"><span className="fd-label">检验员</span><span className="fd-val">{ticket.inspector}</span></div>
          <div className="ft-drawer-row"><span className="fd-label">检验结果</span>
            <span className="fd-val" style={{ color: ticket.inspectResult === 'PASS' ? '#52c41a' : ticket.inspectResult === 'FAIL' ? '#ff4d4f' : '#faad14' }}>
              {ticket.inspectResult === 'PASS' ? '✅ 通过' : ticket.inspectResult === 'FAIL' ? '❌ 不合格' : '⏳ 待检验'}
            </span>
          </div>
        </div>
      )}

      {/* 备注 */}
      {ticket.remark && (
        <div className="ft-drawer-section" style={{ borderColor: 'rgba(255,77,79,0.3)' }}>
          <div className="ft-drawer-title" style={{ color: '#ff7875' }}>⚠️ 备注</div>
          <div style={{ fontSize: 12, color: '#ff9c9c', lineHeight: 1.6 }}>{ticket.remark}</div>
        </div>
      )}

      {/* 工序流程 */}
      <div className="ft-drawer-section">
        <div className="ft-drawer-title">⚙️ 工序执行记录</div>
        <StepTimeline steps={ticket.steps} />
      </div>

      {/* 操作按钮 */}
      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Button block icon={<PrinterOutlined />}
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#aaa' }}
          onClick={() => message.info('浮票打印功能待集成热敏打印机')}>
          打印纸质浮票
        </Button>
        {ticket.status === 'PENDING' && (
          <Button block type="primary" icon={<CaretRightOutlined />}
            onClick={() => { message.success(`批次 ${ticket.batchNo} 已开工`); onClose(); }}>
            确认开工
          </Button>
        )}
        {ticket.status === 'WAIT_INSPECT' && (
          <Button block icon={<CheckCircleOutlined />}
            style={{ background: '#52c41a', border: 'none', color: '#fff', fontWeight: 600 }}
            onClick={() => { message.success('已通知QC检验'); onClose(); }}>
            通知QC检验
          </Button>
        )}
      </div>
    </Drawer>
  );
};

// ── 主列表页 ─────────────────────────────────────────────────────────
const FloatTicketPage: React.FC = () => {
  const [tickets, setTickets] = useState<FloatTicket[]>(() =>
    isUserCleared() ? [] : mockTickets
  );
  const [apiLoading, setApiLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<FloatTicket | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [form] = Form.useForm();

  const [filterStatus, setFilterStatus] = useState<TicketStatus | 'ALL'>('ALL');
  const [searchText, setSearchText] = useState('');

  // ── 从后端加载流转单数据 ──────────────────────────────────
  const loadFromApi = useCallback(async () => {
    if (isUserCleared()) return;   // 用户已主动清空，不从 API 重新拉取数据
    setApiLoading(true);
    try {
      const resp = await getFloatTicketList() as any;
      const apiList: any[] = resp.data ?? [];
      if (apiList.length > 0) {
        // 后端状态 → 前端 TicketStatus 映射
        const statusMap: Record<string, TicketStatus> = {
          PRINTED:   'PENDING',    // 已打印 → 待开工
          ISSUED:    'PENDING',    // 已发放 → 待开工
          IN_USE:    'RUNNING',    // 在用中 → 在制
          COMPLETED: 'COMPLETED',  // 已完成
          RETURNED:  'COMPLETED',  // 已回收 → 已完成
          SCRAPPED:  'SCRAPPED',   // 已报废
        };
        const mapped: FloatTicket[] = apiList.map((item: any) => ({
          id:           item.id?.toString() ?? String(Date.now()),
          ticketNo:     item.ticketNo ?? item.id?.toString() ?? '',
          batchNo:      item.workOrderNo ?? item.batchNo ?? '',     // 后端 workOrderNo → batchNo
          productCode:  item.productCode ?? '',
          productName:  item.productName ?? '',
          productSpec:  item.productName ?? '',
          routingCode:  '',
          routingName:  item.workshopName ?? '',
          planQty:      item.quantity ?? item.planQty ?? 0,          // 后端 quantity → planQty
          actualQty:    item.actualQty,
          status:       statusMap[item.status] ?? 'PENDING',
          createdAt:    item.createTime ? item.createTime.slice(0, 10) : '',
          createdBy:    item.operatorName ?? '',
          steps:        [],
        }));
        setTickets(mapped);
      }
    } catch { /* 保留本地 mock */ } finally { setApiLoading(false); }
  }, []);

  useEffect(() => { loadFromApi(); }, [loadFromApi]);

  // 实时统计（基于全量 tickets）
  const liveSummary = {
    running:     tickets.filter(t => t.status === 'RUNNING').length,
    pending:     tickets.filter(t => t.status === 'PENDING').length,
    waitInspect: tickets.filter(t => t.status === 'WAIT_INSPECT').length,
    completed:   tickets.filter(t => t.status === 'COMPLETED').length,
    scrapped:    tickets.filter(t => t.status === 'SCRAPPED').length,
    total:       tickets.length,
  };

  const filtered = tickets.filter(t => {
    const statusOk = filterStatus === 'ALL' || t.status === filterStatus;
    const textOk = !searchText || t.ticketNo.includes(searchText) || t.batchNo.includes(searchText) || t.productSpec.includes(searchText);
    return statusOk && textOk;
  });

  const handleView = (t: FloatTicket) => { setSelectedTicket(t); setDrawerOpen(true); };

  const handleCreate = () => {
    form.validateFields().then(async vals => {
      const ticketNo = `FT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(tickets.length + 1).padStart(3, '0')}`;
      // 同步后端
      try {
        await createFloatTicket({
          ticketNo,
          workOrderNo: vals.batchNo,
          productCode: vals.productCode,
          productName: vals.productName,
          quantity:    vals.planQty,
          status:      'PRINTED',
          remark:      vals.remark,
        });
        await loadFromApi();
        message.success(`浮票 ${ticketNo} 创建成功`);
      } catch {
        // fallback 乐观更新
        const newTicket: FloatTicket = {
          id: `FT${Date.now()}`,
          ticketNo,
          batchNo: vals.batchNo,
          productCode: vals.productCode,
          productName: vals.productName,
          productSpec: vals.productSpec ?? '',
          routingCode: 'GMP-PACKAGE-V1',
          routingName: '天美健保健品GMP包装通用方案 V1.0',
          planQty: vals.planQty,
          status: 'PENDING',
          createdAt: new Date().toLocaleString('zh-CN'),
          createdBy: '当前用户',
          steps: [
            { seq: 10, operationCode: 'PKG-01', operationName: '清场确认',      stationCode: 'ST-INNERPACK-01', stationName: '内包装工位', status: 'PENDING' },
            { seq: 20, operationCode: 'PKG-02', operationName: '称量领料',      stationCode: 'ST-INNERPACK-01', stationName: '内包装工位', status: 'PENDING' },
            { seq: 30, operationCode: 'PKG-03', operationName: '数片装瓶',      stationCode: 'ST-COUNT-01',     stationName: '数片工位',   status: 'PENDING' },
            { seq: 40, operationCode: 'PKG-04', operationName: '内包装（加盖/贴标）', stationCode: 'ST-INNERPACK-01', stationName: '内包装工位', status: 'PENDING' },
            { seq: 50, operationCode: 'PKG-05', operationName: '装盒装箱',      stationCode: 'ST-CARTONER-01', stationName: '装盒工位',   status: 'PENDING' },
            { seq: 60, operationCode: 'PKG-06', operationName: '喷码赋码',      stationCode: 'ST-CODE-01',     stationName: '喷码工位',   status: 'PENDING' },
            { seq: 70, operationCode: 'PKG-07', operationName: '物料平衡计算',  stationCode: 'ST-INNERPACK-01', stationName: '内包装工位', status: 'PENDING' },
            { seq: 80, operationCode: 'PKG-08', operationName: 'QA放行审核',    stationCode: 'ST-QC-01',       stationName: 'QA工位',     status: 'PENDING' },
          ],
        };
        setTickets(prev => [newTicket, ...prev]);
        message.success(`浮票 ${ticketNo} 创建成功`);
      }
      setCreateOpen(false);
      form.resetFields();
    }).catch((err: any) => { if (err?.errorFields) return; });
  };

  return (
    <div className="ft-page">
      {/* ── 顶部 KPI 汇总 ── */}
      <div className="ft-header">
        <div className="ft-header-title">
          <FileTextOutlined style={{ color: '#64b5f6', marginRight: 8 }} />
          批生产浮票管理
        </div>
        <div className="ft-kpi-row">
          {(([
            { label: '在制',   val: liveSummary.running,     color: '#52c41a', filter: 'RUNNING'      as TicketStatus | 'ALL' },
            { label: '待开工', val: liveSummary.pending,     color: '#faad14', filter: 'PENDING'      as TicketStatus | 'ALL' },
            { label: '待检验', val: liveSummary.waitInspect, color: '#1890ff', filter: 'WAIT_INSPECT' as TicketStatus | 'ALL' },
            { label: '已完成', val: liveSummary.completed,   color: '#13c2c2', filter: 'COMPLETED'    as TicketStatus | 'ALL' },
            { label: '已报废', val: liveSummary.scrapped,    color: '#ff4d4f', filter: 'SCRAPPED'     as TicketStatus | 'ALL' },
            { label: '合计',   val: liveSummary.total,       color: '#e8f4fd', filter: 'ALL'          as TicketStatus | 'ALL' },
          ])).map(k => {
            const isActive = filterStatus === k.filter;
            return (
              <div
                key={k.label}
                className="ft-kpi"
                onClick={() => setFilterStatus(prev => prev === k.filter ? 'ALL' : k.filter)}
                style={{
                  cursor: 'pointer',
                  outline: isActive && k.filter !== 'ALL' ? `2px solid ${k.color}` : 'none',
                  borderRadius: 6,
                  background: isActive && k.filter !== 'ALL' ? `${k.color}22` : 'transparent',
                  transform: isActive && k.filter !== 'ALL' ? 'scale(1.06)' : 'scale(1)',
                  transition: 'all 0.15s',
                  padding: '2px 6px',
                }}
                title={`点击过滤：${k.label}`}
              >
                <div className="ft-kpi-val" style={{ color: k.color }}>{k.val}</div>
                <div className="ft-kpi-label" style={{ color: isActive && k.filter !== 'ALL' ? k.color : undefined }}>
                  {k.label}{isActive && k.filter !== 'ALL' ? ' ✓' : ''}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 工具栏 ── */}
      <div className="ft-toolbar">
        <div style={{ display: 'flex', gap: 8, flex: 1, flexWrap: 'wrap' }}>
          <Input
            prefix={<SearchOutlined style={{ color: '#666' }} />}
            placeholder="搜索浮票号/批号/规格..."
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            style={{ width: 260, background: '#1a2a3a', border: '1px solid #2a4a6a', color: '#e8f4fd' }}
            allowClear
          />
          <Select
            value={filterStatus}
            onChange={setFilterStatus}
            style={{ width: 140 }}
          >
            <Option value="ALL">全部状态</Option>
            {Object.entries(TICKET_STATUS_MAP).map(([k, v]) => (
              <Option key={k} value={k}>{v.label}</Option>
            ))}
          </Select>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button icon={<ReloadOutlined />} loading={apiLoading} onClick={() => loadFromApi()}
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#aaa' }}>
            刷新
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
            新建浮票
          </Button>
        </div>
      </div>

      {/* ── 浮票卡片列表 ── */}
      <div className="ft-list">
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', padding: '60px 0' }}>
            暂无浮票数据
          </div>
        )}
        {filtered.map(ticket => {
          const sc = TICKET_STATUS_MAP[ticket.status];
          const doneSteps = ticket.steps.filter(s => s.status === 'DONE').length;
          const totalSteps = ticket.steps.filter(s => s.status !== 'SKIP').length;
          const pct = totalSteps > 0 ? Math.round((doneSteps / totalSteps) * 100) : 0;
          return (
            <div key={ticket.id} className="ft-card" onClick={() => handleView(ticket)}>
              {/* 卡片左侧彩色竖线 */}
              <div className="ft-card-accent" style={{ background: sc.color }} />

              {/* 内容区 */}
              <div className="ft-card-body">
                {/* 第一行：浮票号 + 批号 + 状态 */}
                <div className="ft-card-row1">
                  <span className="ft-ticket-no">{ticket.ticketNo}</span>
                  <span className="ft-batch-no">{ticket.batchNo}</span>
                  <span className="ft-status-badge" style={{ color: sc.color, background: sc.bgColor }}>
                    {sc.label}
                  </span>
                </div>

                {/* 第二行：产品信息 */}
                <div className="ft-card-row2">
                  <span className="ft-product">{ticket.productName} — {ticket.productSpec}</span>
                  {ticket.currentOperation && (
                    <span className="ft-current-op">▶ {ticket.currentOperation}</span>
                  )}
                </div>

                {/* 第三行：数量 + 进度 */}
                <div className="ft-card-row3">
                  <div className="ft-qty-pills">
                    <span className="ft-qty-pill">计划 <b>{ticket.planQty.toLocaleString()}</b></span>
                    {ticket.actualQty !== undefined && <span className="ft-qty-pill green">实际 <b>{ticket.actualQty.toLocaleString()}</b></span>}
                    {ticket.scrapQty !== undefined && ticket.scrapQty > 0 && <span className="ft-qty-pill red">报废 <b>{ticket.scrapQty.toLocaleString()}</b></span>}
                  </div>
                  <div className="ft-progress-mini">
                    <div className="ft-progress-track">
                      <div className="ft-progress-fill" style={{ width: `${pct}%`, background: pct === 100 ? '#52c41a' : sc.color }} />
                    </div>
                    <span className="ft-progress-pct">{pct}%</span>
                  </div>
                </div>

                {/* 第四行：时间 + 操作人 */}
                <div className="ft-card-row4">
                  <span className="ft-meta">🕒 {ticket.createdAt}</span>
                  {ticket.startDate && <span className="ft-meta">开工 {ticket.startDate}</span>}
                  <span className="ft-meta">👤 {ticket.createdBy}</span>
                </div>
              </div>

              {/* 右侧操作按钮 */}
              <div className="ft-card-actions">
                <Tooltip title="查看详情">
                  <Button size="small" type="text" icon={<EyeOutlined />}
                    style={{ color: '#40a9ff' }}
                    onClick={e => { e.stopPropagation(); handleView(ticket); }} />
                </Tooltip>
                <Tooltip title="打印浮票">
                  <Button size="small" type="text" icon={<PrinterOutlined />}
                    style={{ color: '#aaa' }}
                    onClick={e => { e.stopPropagation(); message.info('打印功能待接入热敏打印机'); }} />
                </Tooltip>
                {ticket.status === 'RUNNING' && (
                  <Tooltip title="异常上报">
                    <Button size="small" type="text" icon={<StopOutlined />}
                      style={{ color: '#ff7875' }}
                      onClick={e => { e.stopPropagation(); message.warning('已上报异常，等待处理'); }} />
                  </Tooltip>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── 详情抽屉 ── */}
      <TicketDrawer
        ticket={selectedTicket}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />

      {/* ── 新建浮票弹窗 ── */}
      <Modal
        open={createOpen}
        title={<span style={{ color: '#e8f4fd' }}>新建批生产浮票</span>}
        onCancel={() => { setCreateOpen(false); form.resetFields(); }}
        onOk={handleCreate}
        okText="创建"
        cancelText="取消"
        style={{ background: '#0f1923' }}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="batchNo" label="生产批号" rules={[{ required: true, message: '请输入批号' }]}>
            <Input placeholder="如：TMJ-VTC-20260614-001" />
          </Form.Item>
          <Form.Item name="productCode" label="产品编码" rules={[{ required: true }]}>
            <Input placeholder="如：TMJ-VTC-100MG" />
          </Form.Item>
          <Form.Item name="productName" label="产品名称" rules={[{ required: true }]}>
            <Input placeholder="如：VitC咀嚼片" />
          </Form.Item>
          <Form.Item name="productSpec" label="规格型号" rules={[{ required: true }]}>
            <Input placeholder="如：100mg×60片/瓶" />
          </Form.Item>
          <Form.Item name="planQty" label="计划数量（支）" rules={[{ required: true }]}>
            <InputNumber min={1} max={999999} style={{ width: '100%' }} placeholder="10000" />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} placeholder="可选" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default FloatTicketPage;

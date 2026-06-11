/**
 * PadIssuancePage.tsx — PDA工序领料拣货界面
 * 基于《BOM工序领料PRD.docx》附录A：PDA拣货界面设计
 *
 * 流程：任务列表 → 拣货详情（物料列表）→ 扫描拣货 → 拆批拣货 → 发料确认
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Card, Button, Tag, Space, Badge, Progress, Modal, Input,
  InputNumber, message, Steps, Alert, Divider, List, Select,
  Drawer, Radio, Form, Row, Col,
} from 'antd';
import {
  ArrowLeftOutlined, ScanOutlined, CheckCircleFilled,
  WarningOutlined, PlusOutlined, DeleteOutlined,
  PrinterOutlined, SendOutlined, CloseCircleOutlined,
  ExclamationCircleOutlined, ReloadOutlined, InboxOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import {
  IssueOrder, IssueLine, BatchPick, IssueStatus,
  loadIssueOrders, saveIssueOrders, loadWipInventory,
  ISSUE_STATUS_LABEL, ISSUE_STATUS_COLOR,
  ISSUE_METHOD_LABEL, ISSUE_METHOD_COLOR,
  PRIORITY_LABEL, PRIORITY_COLOR,
  allocateBatchFIFO, WipInventory,
} from '../../store/issuanceStore';
import { getPadIssuanceList } from '../../api/padIssuances';

type PadView = 'list' | 'detail' | 'scan' | 'split' | 'confirm' | 'exception';

// ── 模拟批次库存（原料仓） ───────────────────────────────────────
const SOURCE_BATCHES: WipInventory[] = [
  { warehouseCode: 'A1-原料仓', itemCode: 'CH-NITRIDE', itemName: '氮化钛涂层靶材', batchNo: 'BT-20260420-A2', qty: 300, availableQty: 300, lockedQty: 0, unit: 'G', inboundDate: '2026-04-20', expiryDate: '2027-04-20', updatedAt: '2026-04-30' },
  { warehouseCode: 'A1-原料仓', itemCode: 'CH-NITRIDE', itemName: '氮化钛涂层靶材', batchNo: 'BT-20260425-A1', qty: 800, availableQty: 800, lockedQty: 0, unit: 'G', inboundDate: '2026-04-25', expiryDate: '2027-04-25', updatedAt: '2026-04-30' },
  { warehouseCode: 'A1-原料仓', itemCode: 'CH-ADHESIVE', itemName: '涂层粘结剂', batchNo: 'BT-20260428-A1', qty: 600, availableQty: 600, lockedQty: 0, unit: 'ML', inboundDate: '2026-04-28', updatedAt: '2026-04-30' },
  { warehouseCode: 'A1-原料仓', itemCode: 'NW-SS316L', itemName: '不锈钢丝 316L', batchNo: 'BT-20260422-SS', qty: 120, availableQty: 120, lockedQty: 0, unit: 'KG', inboundDate: '2026-04-22', updatedAt: '2026-04-30' },
  { warehouseCode: 'A1-原料仓', itemCode: 'NW-NITI', itemName: '镍钛合金丝', batchNo: 'BT-20260415-NI', qty: 60, availableQty: 60, lockedQty: 0, unit: 'KG', inboundDate: '2026-04-15', updatedAt: '2026-04-30' },
];

const EXCEPTION_OPTIONS = [
  { value: 'STOCK_EMPTY', label: '库存不足（系统有账实物无）' },
  { value: 'NO_RECORD',   label: '库存不足（系统无账）' },
  { value: 'QUALITY_ISSUE', label: '来料不良/质量问题' },
  { value: 'BATCH_MISMATCH', label: '批次信息不符' },
  { value: 'OTHER', label: '其他' },
];

const PadIssuancePage: React.FC = () => {
  const [orders, setOrders]         = useState<IssueOrder[]>(
    loadIssueOrders().filter(o => o.status === 'PICKING' || o.status === 'PENDING')
  );
  const [view, setView]             = useState<PadView>('list');
  const [currentOrder, setCurrentOrder] = useState<IssueOrder | null>(null);
  const [currentLine, setCurrentLine]   = useState<IssueLine | null>(null);

  // 扫描拣货状态
  const [scanInput, setScanInput]   = useState('');
  const [scannedBatch, setScannedBatch] = useState<WipInventory | null>(null);
  const [issueQty, setIssueQty]     = useState<number>(0);
  const [splitPicks, setSplitPicks] = useState<BatchPick[]>([]);

  // 异常上报
  const [excType, setExcType]       = useState('');
  const [excRemark, setExcRemark]   = useState('');

  const scanRef = useRef<any>(null);

  // ── 后端数据合并（仅展示待拣/拣货中） ─────────────────────────
  const loadFromApi = useCallback(async () => {
    try {
      const resp = await getPadIssuanceList() as any;
      const apiList: any[] = resp?.data ?? [];
      if (apiList.length > 0) {
        const newOrders: IssueOrder[] = apiList.map((item: any) => ({
          id:           String(item.id),
          issueNo:      item.issuanceNo ?? '',
          woNo:         item.workOrderNo ?? '',
          productCode:  item.productCode ?? '',
          productName:  item.productName ?? '',
          issueMethod:  'PUSH' as const,
          priority:     'MEDIUM' as const,
          warehouse:    '原料仓',
          wipWarehouse: item.workshopName ?? '',
          planDate:     item.issueDate ?? '',
          lines:        [],
          status:       'PENDING' as IssueStatus,
          createdBy:    item.requesterName ?? '',
          createdAt:    item.createTime ?? '',
        }));
        setOrders(newOrders);  // API-first REPLACE
      }
    } catch { /* backend unavailable */ }
  }, []);

  useEffect(() => { loadFromApi(); }, [loadFromApi]);

  // ── 更新订单并持久化 ─────────────────────────────────────────
  const commitOrder = (updated: IssueOrder) => {
    const newList = orders.map(o => o.id === updated.id ? updated : o);
    setOrders(newList);
    setCurrentOrder(updated);
    // 同时更新全量 store
    const allOrders = loadIssueOrders();
    const allUpdated = allOrders.map(o => o.id === updated.id ? updated : o);
    saveIssueOrders(allUpdated);
  };

  // ── 进入拣货详情 ─────────────────────────────────────────────
  const handleOpenOrder = (order: IssueOrder) => {
    let upd = order;
    if (order.status === 'PENDING') {
      upd = { ...order, status: 'PICKING', pickedBy: '仓管员', pickedAt: new Date().toLocaleString('zh-CN') };
      commitOrder(upd);
    }
    setCurrentOrder(upd);
    setView('detail');
  };

  // ── 进入扫描拣货 ─────────────────────────────────────────────
  const handleScanLine = (line: IssueLine) => {
    setCurrentLine(line);
    setScanInput('');
    setScannedBatch(null);
    setIssueQty(line.planQty);
    setSplitPicks([]);
    setView('scan');
    setTimeout(() => scanRef.current?.focus(), 300);
  };

  // ── 扫码/手动输入批次 ─────────────────────────────────────────
  const handleScan = (val: string) => {
    if (!currentLine) return;
    const batch = SOURCE_BATCHES.find(
      b => b.batchNo === val && b.itemCode === currentLine.itemCode
    );
    if (!batch) {
      message.error(`未找到批次 ${val}，或物料不匹配`);
      return;
    }
    setScannedBatch(batch);
    setScanInput(val);
  };

  // 自动按 FIFO 推荐批次
  const handleAutoFIFO = () => {
    if (!currentLine) return;
    const { picks } = allocateBatchFIFO({
      inventory: SOURCE_BATCHES,
      warehouseCode: currentLine.sourceWarehouse,
      itemCode: currentLine.itemCode,
      needQty: currentLine.planQty,
    });
    if (picks.length === 0) {
      message.error('原料仓无可用库存');
      return;
    }
    if (picks.length === 1) {
      setScannedBatch(SOURCE_BATCHES.find(b => b.batchNo === picks[0].batchNo) || null);
      setScanInput(picks[0].batchNo);
      setIssueQty(picks[0].qty);
    } else {
      // 需要拆批
      setSplitPicks(picks);
      setView('split');
    }
  };

  // ── 确认单批次拣货 ───────────────────────────────────────────
  const handleConfirmScan = () => {
    if (!currentOrder || !currentLine || !scannedBatch) {
      message.warning('请先扫描或选择批次');
      return;
    }
    if (issueQty > scannedBatch.availableQty) {
      message.error(`批次可用量 ${scannedBatch.availableQty}，不足 ${issueQty}`);
      return;
    }
    applyLinePick([{ batchNo: scannedBatch.batchNo, qty: issueQty, inboundDate: scannedBatch.inboundDate, warehouseCode: scannedBatch.warehouseCode }]);
  };

  // ── 确认拆批拣货 ─────────────────────────────────────────────
  const handleConfirmSplit = () => {
    if (splitPicks.length === 0) return;
    applyLinePick(splitPicks);
  };

  const applyLinePick = (picks: BatchPick[]) => {
    if (!currentOrder || !currentLine) return;
    const actualQty = picks.reduce((s, p) => s + p.qty, 0);
    const updatedLine: IssueLine = { ...currentLine, actualQty, batchPicks: picks, status: 'DONE' };
    const updatedOrder = {
      ...currentOrder,
      lines: currentOrder.lines.map(l => l.id === updatedLine.id ? updatedLine : l),
    };
    commitOrder(updatedOrder);
    setCurrentLine(updatedLine);
    message.success(`拣货完成：${currentLine.itemName} × ${actualQty} ${currentLine.unit}`);
    setView('detail');
  };

  // ── 标记缺料/异常 ────────────────────────────────────────────
  const handleSkipLine = () => {
    if (!currentOrder || !currentLine) return;
    if (!excType) { message.warning('请选择异常类型'); return; }
    const updatedLine: IssueLine = { ...currentLine, status: 'EXCEPTION', exceptionType: excType as any, exceptionRemark: excRemark };
    const updatedOrder = {
      ...currentOrder,
      status: 'EXCEPTION' as any,
      lines: currentOrder.lines.map(l => l.id === updatedLine.id ? updatedLine : l),
    };
    commitOrder(updatedOrder);
    message.warning(`已上报缺料异常：${currentLine.itemName}`);
    setView('detail');
  };

  // ── 确认全部完成，进入发料确认 ──────────────────────────────
  const handleAllDone = () => {
    if (!currentOrder) return;
    const allDone = currentOrder.lines.every(l => l.status === 'DONE' || l.status === 'SKIP' || l.status === 'EXCEPTION');
    if (!allDone) { message.warning('还有物料未完成'); return; }
    setView('confirm');
  };

  // ── 提交发料 ─────────────────────────────────────────────────
  const handleSubmit = (print: boolean) => {
    if (!currentOrder) return;
    const updatedOrder = { ...currentOrder, status: 'PICKED' as any };
    commitOrder(updatedOrder);
    if (print) message.success('已打印发料标签并提交');
    else message.success('发料提交成功');
    setView('list');
    setCurrentOrder(null);
  };

  // ──────────────────────────────────────────────────────────────
  // 渲染：任务列表
  // ──────────────────────────────────────────────────────────────
  if (view === 'list') {
    const pending = orders.filter(o => o.status === 'PENDING').length;
    const picking = orders.filter(o => o.status === 'PICKING').length;
    return (
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 4px' }}>
        <Card
          size="small"
          style={{ background: '#c41230', borderRadius: 12, marginBottom: 12 }}
          bodyStyle={{ padding: '12px 16px' }}
        >
          <div style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>🔧 MES-工序领料</div>
          <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 4 }}>
            仓库：A1-原料仓 &nbsp;|&nbsp; 待处理：{pending + picking} 单
          </div>
        </Card>

        <div style={{ marginBottom: 10, display: 'flex', gap: 8 }}>
          <Tag color="#faad14">待接单 {pending}</Tag>
          <Tag color="#1677ff">拣货中 {picking}</Tag>
        </div>

        {orders.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#aaa' }}>
            <InboxOutlined style={{ fontSize: 40 }} />
            <div style={{ marginTop: 8 }}>暂无待处理任务</div>
          </div>
        )}

        {orders.map(order => {
          const doneCnt = order.lines.filter(l => l.status === 'DONE').length;
          return (
            <Card
              key={order.id}
              size="small"
              style={{ marginBottom: 10, borderRadius: 10, borderLeft: `4px solid ${order.status === 'PICKING' ? '#1677ff' : '#faad14'}` }}
              bodyStyle={{ padding: '12px 14px' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{order.issueNo}</div>
                  <div style={{ fontSize: 12, color: '#555', marginTop: 3 }}>
                    工单：{order.woNo}
                  </div>
                  {order.operationName && (
                    <div style={{ fontSize: 12, color: '#555' }}>
                      工序：{order.operationSeq}-{order.operationName}
                    </div>
                  )}
                  <div style={{ fontSize: 12, color: '#555' }}>
                    物料：{order.lines.length}种 &nbsp;
                    <Tag color={PRIORITY_COLOR[order.priority]} style={{ fontSize: 10 }}>
                      {PRIORITY_LABEL[order.priority]}优先
                    </Tag>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <Badge status={ISSUE_STATUS_COLOR[order.status] as any} text={ISSUE_STATUS_LABEL[order.status]} />
                  {order.status === 'PICKING' && (
                    <Progress
                      percent={order.lines.length > 0 ? Math.round(doneCnt / order.lines.length * 100) : 0}
                      size="small" style={{ width: 80, marginTop: 4 }}
                    />
                  )}
                </div>
              </div>
              <Button
                type="primary" block size="small"
                style={{ marginTop: 10, borderRadius: 6 }}
                onClick={() => handleOpenOrder(order)}
              >
                {order.status === 'PENDING' ? '接单开始拣货' : '继续拣货'}
              </Button>
            </Card>
          );
        })}
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────
  // 渲染：拣货详情（物料列表）
  // ──────────────────────────────────────────────────────────────
  if (view === 'detail' && currentOrder) {
    const doneCount = currentOrder.lines.filter(l => l.status === 'DONE').length;
    const allFinished = currentOrder.lines.every(l => l.status === 'DONE' || l.status === 'SKIP' || l.status === 'EXCEPTION');

    return (
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Button icon={<ArrowLeftOutlined />} size="small" onClick={() => setView('list')}>返回</Button>
          <span style={{ fontWeight: 700 }}>{currentOrder.issueNo}</span>
          <Badge status={ISSUE_STATUS_COLOR[currentOrder.status] as any} text={ISSUE_STATUS_LABEL[currentOrder.status]} />
        </div>

        <Card size="small" style={{ marginBottom: 10, borderRadius: 8 }}>
          <div style={{ fontSize: 12, color: '#555', lineHeight: 2 }}>
            <b>工单</b>：{currentOrder.woNo} &nbsp;|&nbsp;
            <b>产品</b>：{currentOrder.productName}
          </div>
          <div style={{ fontSize: 12, color: '#555' }}>
            <b>线边仓</b>：{currentOrder.wipWarehouse}
          </div>
        </Card>

        <div style={{ marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 600 }}>待拣物料 ({doneCount}/{currentOrder.lines.length})</span>
          <Progress
            percent={currentOrder.lines.length > 0 ? Math.round(doneCount / currentOrder.lines.length * 100) : 0}
            size="small" style={{ width: 100 }}
          />
        </div>

        {currentOrder.lines.map(line => (
          <Card
            key={line.id}
            size="small"
            style={{
              marginBottom: 8, borderRadius: 8,
              borderLeft: `4px solid ${line.status === 'DONE' ? '#52c41a' : line.status === 'EXCEPTION' ? '#f5222d' : '#d9d9d9'}`,
            }}
            bodyStyle={{ padding: '10px 12px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{line.itemName}</div>
                <div style={{ fontSize: 11, color: '#888' }}>{line.itemCode}</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>
                  需求：<b>{line.planQty}</b> {line.unit}
                  {line.status === 'DONE' && (
                    <span style={{ color: '#52c41a', marginLeft: 8 }}>
                      实发：<b>{line.actualQty}</b> {line.unit}
                    </span>
                  )}
                </div>
                {line.batchPicks.length > 0 && (
                  <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
                    批次：{line.batchPicks.map(b => b.batchNo).join(' + ')}
                  </div>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                {line.status === 'DONE' && <CheckCircleFilled style={{ color: '#52c41a', fontSize: 20 }} />}
                {line.status === 'EXCEPTION' && <WarningOutlined style={{ color: '#f5222d', fontSize: 20 }} />}
                {line.status === 'PENDING' && (
                  <Button
                    size="small" type="primary"
                    icon={<ScanOutlined />}
                    onClick={() => handleScanLine(line)}
                    style={{ marginTop: 4 }}
                  >
                    扫描拣货
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}

        <Button
          type="primary" block size="large"
          disabled={!allFinished}
          style={{ marginTop: 16, borderRadius: 8, height: 46 }}
          icon={<SendOutlined />}
          onClick={handleAllDone}
        >
          全部完成，提交发料
        </Button>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────
  // 渲染：扫描拣货
  // ──────────────────────────────────────────────────────────────
  if (view === 'scan' && currentLine) {
    const availBatches = SOURCE_BATCHES.filter(
      b => b.itemCode === currentLine.itemCode && b.warehouseCode === currentLine.sourceWarehouse
    ).sort((a, b) => a.inboundDate.localeCompare(b.inboundDate));

    return (
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Button icon={<ArrowLeftOutlined />} size="small" onClick={() => setView('detail')}>返回</Button>
          <span style={{ fontWeight: 700 }}>扫描拣货</span>
        </div>

        <Card size="small" style={{ marginBottom: 10, borderRadius: 8, background: '#f6ffed', border: '1px solid #b7eb8f' }}>
          <div style={{ fontWeight: 600 }}>{currentLine.itemName}</div>
          <div style={{ fontSize: 12, color: '#888' }}>{currentLine.itemCode} · {currentLine.spec}</div>
          <div style={{ fontSize: 13, marginTop: 6 }}>需求：<b>{currentLine.planQty}</b> {currentLine.unit}</div>
        </Card>

        {/* 扫码输入 */}
        <Card size="small" style={{ marginBottom: 10, borderRadius: 8 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>
            <ScanOutlined style={{ marginRight: 6 }} />扫描物料/批次条码
          </div>
          <Input
            ref={scanRef}
            value={scanInput}
            onChange={e => setScanInput(e.target.value)}
            onPressEnter={() => handleScan(scanInput)}
            placeholder="扫描或手动输入批次号"
            suffix={
              <Button size="small" type="primary" onClick={() => handleScan(scanInput)}>确认</Button>
            }
          />
          <Button
            block size="small" style={{ marginTop: 8 }}
            icon={<ThunderboltOutlined />}
            onClick={handleAutoFIFO}
          >
            FIFO 自动推荐批次
          </Button>
        </Card>

        {/* 推荐批次列表 */}
        <div style={{ fontWeight: 600, marginBottom: 8 }}>推荐批次（FIFO/FEFO）：</div>
        {availBatches.map((b, idx) => (
          <Card
            key={b.batchNo}
            size="small"
            onClick={() => { setScannedBatch(b); setScanInput(b.batchNo); setIssueQty(Math.min(currentLine.planQty, b.availableQty)); }}
            style={{
              marginBottom: 6, borderRadius: 8, cursor: 'pointer',
              border: `2px solid ${scannedBatch?.batchNo === b.batchNo ? '#1677ff' : '#f0f0f0'}`,
              background: scannedBatch?.batchNo === b.batchNo ? '#e6f4ff' : '#fff',
            }}
            bodyStyle={{ padding: '8px 12px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <Tag color={idx === 0 ? 'blue' : 'default'} style={{ fontSize: 10 }}>
                  {idx === 0 ? 'FIFO推荐' : `第${idx + 1}优先`}
                </Tag>
                <span style={{ fontWeight: 600, marginLeft: 4 }}>{b.batchNo}</span>
              </div>
              {scannedBatch?.batchNo === b.batchNo && (
                <CheckCircleFilled style={{ color: '#1677ff' }} />
              )}
            </div>
            <div style={{ fontSize: 12, color: '#555', marginTop: 4 }}>
              可用：<b>{b.availableQty}</b> {b.unit} &nbsp;|&nbsp; 入库：{b.inboundDate}
              {b.expiryDate && ` | 效期：${b.expiryDate}`}
            </div>
          </Card>
        ))}

        {/* 实发数量 */}
        {scannedBatch && (
          <Card size="small" style={{ marginTop: 10, borderRadius: 8 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>实发数量：</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Button onClick={() => setIssueQty(q => Math.max(0, q - 1))}>−</Button>
              <InputNumber
                value={issueQty}
                onChange={v => setIssueQty(v ?? 0)}
                min={0}
                max={scannedBatch.availableQty}
                style={{ width: 100 }}
              />
              <span>{currentLine.unit}</span>
              <Button onClick={() => setIssueQty(q => Math.min(scannedBatch.availableQty, q + 1))}>＋</Button>
            </div>
            <div style={{ fontSize: 11, color: '#888', marginTop: 6 }}>
              可用库存：{scannedBatch.availableQty} {currentLine.unit}
            </div>
          </Card>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <Button
            block
            danger
            icon={<WarningOutlined />}
            onClick={() => setView('exception')}
          >
            标记缺料
          </Button>
          <Button
            block type="primary"
            icon={<CheckCircleFilled />}
            disabled={!scannedBatch || issueQty <= 0}
            onClick={handleConfirmScan}
          >
            确认拣货
          </Button>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────
  // 渲染：拆批拣货
  // ──────────────────────────────────────────────────────────────
  if (view === 'split' && currentLine) {
    const total = splitPicks.reduce((s, p) => s + p.qty, 0);
    return (
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Button icon={<ArrowLeftOutlined />} size="small" onClick={() => setView('scan')}>返回</Button>
          <span style={{ fontWeight: 700 }}>拆批拣货</span>
        </div>

        <Card size="small" style={{ marginBottom: 10, borderRadius: 8 }}>
          <div style={{ fontWeight: 600 }}>{currentLine.itemName}</div>
          <div style={{ fontSize: 12 }}>总需求：<b>{currentLine.planQty}</b> {currentLine.unit}</div>
        </Card>

        {splitPicks.map((pick, idx) => {
          const src = SOURCE_BATCHES.find(b => b.batchNo === pick.batchNo);
          return (
            <Card key={idx} size="small" style={{ marginBottom: 8, borderRadius: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <b>批次{idx + 1}</b>：{pick.batchNo}
                  <div style={{ fontSize: 11, color: '#888' }}>可用：{src?.availableQty} {currentLine.unit}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>实发：</span>
                  <InputNumber
                    value={pick.qty}
                    min={0}
                    max={src?.availableQty ?? 999}
                    onChange={v => {
                      const newPicks = [...splitPicks];
                      newPicks[idx] = { ...pick, qty: v ?? 0 };
                      setSplitPicks(newPicks);
                    }}
                    style={{ width: 80 }}
                  />
                </div>
              </div>
            </Card>
          );
        })}

        <Card size="small" style={{ borderRadius: 8, marginTop: 4, background: total >= currentLine.planQty ? '#f6ffed' : '#fff7e6' }}>
          <span style={{ fontWeight: 600 }}>
            已分配：{total} / {currentLine.planQty} {currentLine.unit}
            {total >= currentLine.planQty ? ' ✅' : ` (还差 ${(currentLine.planQty - total).toFixed(2)})`}
          </span>
        </Card>

        <Button
          type="primary" block size="large"
          style={{ marginTop: 14, borderRadius: 8, height: 46 }}
          disabled={total < currentLine.planQty}
          onClick={handleConfirmSplit}
        >
          确认拆批发料
        </Button>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────
  // 渲染：异常上报
  // ──────────────────────────────────────────────────────────────
  if (view === 'exception' && currentLine) {
    return (
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Button icon={<ArrowLeftOutlined />} size="small" onClick={() => setView('scan')}>取消</Button>
          <span style={{ fontWeight: 700, color: '#f5222d' }}>异常上报</span>
        </div>

        <Card size="small" style={{ marginBottom: 12, borderRadius: 8 }}>
          <div><b>物料：</b>{currentLine.itemName}（{currentLine.itemCode}）</div>
          <div><b>需求：</b>{currentLine.planQty} {currentLine.unit}</div>
        </Card>

        <div style={{ marginBottom: 10 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>异常类型：</div>
          <Radio.Group value={excType} onChange={e => setExcType(e.target.value)} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {EXCEPTION_OPTIONS.map(opt => (
              <Radio key={opt.value} value={opt.value} style={{ fontSize: 13 }}>{opt.label}</Radio>
            ))}
          </Radio.Group>
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>备注：</div>
          <Input.TextArea
            rows={3}
            value={excRemark}
            onChange={e => setExcRemark(e.target.value)}
            placeholder="描述异常情况..."
          />
        </div>

        <Button
          danger block size="large"
          icon={<ExclamationCircleOutlined />}
          disabled={!excType}
          onClick={handleSkipLine}
          style={{ borderRadius: 8, height: 46 }}
        >
          提交异常上报
        </Button>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────
  // 渲染：发料确认
  // ──────────────────────────────────────────────────────────────
  if (view === 'confirm' && currentOrder) {
    const doneLines = currentOrder.lines.filter(l => l.status === 'DONE');
    return (
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Button icon={<ArrowLeftOutlined />} size="small" onClick={() => setView('detail')}>返回</Button>
          <span style={{ fontWeight: 700 }}>发料确认</span>
        </div>

        <Alert
          type="success" showIcon
          message={`领料单 ${currentOrder.issueNo} 拣货完成`}
          style={{ borderRadius: 8, marginBottom: 12 }}
        />

        <div style={{ fontWeight: 600, marginBottom: 8 }}>发料汇总：</div>
        {doneLines.map(line => (
          <Card key={line.id} size="small" style={{ marginBottom: 8, borderRadius: 8, border: '1px solid #b7eb8f' }}>
            <div style={{ fontWeight: 600 }}>{line.itemName}</div>
            <div style={{ fontSize: 12, color: '#555' }}>
              {line.actualQty} {line.unit} &nbsp;·&nbsp;
              批次：{line.batchPicks.map(b => b.batchNo).join(' + ')}
            </div>
            <div style={{ fontSize: 12, color: '#888' }}>
              {line.sourceWarehouse} → {line.wipWarehouse}
            </div>
          </Card>
        ))}

        {/* 标签预览 */}
        <Card
          size="small"
          style={{ marginTop: 8, borderRadius: 8, background: '#fafafa', border: '1px dashed #d9d9d9' }}
          title={<><PrinterOutlined style={{ marginRight: 6 }} />发料标签预览</>}
        >
          {doneLines.slice(0, 1).map(line => (
            <div key={line.id} style={{ fontSize: 12, lineHeight: 2 }}>
              <div><b>工单：</b>{currentOrder.woNo}</div>
              <div><b>工序：</b>{currentOrder.operationSeq}-{currentOrder.operationName || '全工序'}</div>
              <div><b>物料：</b>{line.itemCode} {line.itemName}</div>
              <div><b>数量：</b>{line.actualQty} {line.unit}</div>
              <div><b>批次：</b>{line.batchPicks.map(b => b.batchNo).join(' + ')}</div>
              <div><b>线边仓：</b>{line.wipWarehouse}</div>
            </div>
          ))}
        </Card>

        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <Button block icon={<PrinterOutlined />} onClick={() => handleSubmit(true)}>
            打印并提交
          </Button>
          <Button block type="primary" icon={<CheckCircleFilled />} onClick={() => handleSubmit(false)}>
            仅提交
          </Button>
        </div>
      </div>
    );
  }

  return null;
};

export default PadIssuancePage;

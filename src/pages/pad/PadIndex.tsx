import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Modal, Button, Space, Typography, Alert, ConfigProvider, notification } from 'antd';
import {
  FullscreenOutlined, FullscreenExitOutlined,
  MobileOutlined, RotateRightOutlined, FileTextOutlined,
} from '@ant-design/icons';
import type { OperationDef, WorkOrder, OperationExecution } from './padExecutionData';
import { GMP_OPERATIONS, MOCK_WORK_ORDERS, loadPadWorkOrders, writePadExecBackToWo, l2WoToPadWo } from './padExecutionData';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import PadOperationListPage from './PadOperationListPage';
import PadExecutionPage from './PadExecutionPage';
import type { EbrRecord } from '../ebr/ebrData';
import { buildEbrFromExecMap, updateEbr, EBR_STORAGE_KEY, EBR_DATA_VERSION, EBR_VERSION_KEY } from '../ebr/ebrData';
import { getWorkOrderList } from '../../api/workOrders';
import { getFloatTicketList } from '../../api/floatTickets';
import { saveWorkOrders, saveFloatTickets, isUserCleared } from '../../store/mesStore';
import type { WorkOrder as L2WorkOrder, FloatTicketV2, WOStatus } from '../workorder/workOrderData';

const { Text, Title } = Typography;

type View = 'list' | 'execution';

/** 检测是否竖屏 */
const isPortrait = () =>
  typeof window !== 'undefined' && window.innerHeight > window.innerWidth;

/** PAD 工单数据版本，与 EBR_DATA_VERSION 保持同步 */
const PAD_WO_VERSION_KEY = 'bip_pad_wo_version';

/**
 * 当 EBR/工单数据版本升级时，清理旧的 PAD 执行缓存和旧 EBR 缓存。
 * - 清理 execMap / selectedWo / view / currentOpCode（旧工单批号不再有效）
 * - 清理 bip_ebr_records（旧EBR批号与新PAD工单不匹配，全部清空）
 * - 清理 bip_ebr_version（强制下次 loadEbrRecords 重置为空）
 */
function clearStalePadCache(): void {
  try {
    const stored = localStorage.getItem(PAD_WO_VERSION_KEY);
    if (stored !== EBR_DATA_VERSION) {
      // 清空PAD执行相关缓存
      localStorage.removeItem('bip_pad_exec_map');
      localStorage.removeItem('bip_pad_selected_wo');
      localStorage.removeItem('bip_pad_view');
      localStorage.removeItem('bip_pad_current_op_code');
      // 清空旧EBR数据（与新PAD工单批号不匹配的历史记录全部清除）
      localStorage.removeItem(EBR_STORAGE_KEY);
      // 清空旧的按工单分存的 execMap 快照
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k?.startsWith('bip_pad_exec_snap_')) localStorage.removeItem(k);
      }
      localStorage.setItem(EBR_VERSION_KEY, EBR_DATA_VERSION);  // 更新EBR版本
      localStorage.setItem(PAD_WO_VERSION_KEY, EBR_DATA_VERSION);
    }
  } catch { /* ignore */ }
}
// 模块加载时立即执行，确保在 useLocalStorage 初始化之前清理
clearStalePadCache();

const PadIndex: React.FC = () => {
  // 提升到顶层并持久化，使列表页与执行页共享同一份 execMap
  const [execMap, setExecMap]       = useLocalStorage<Record<string, OperationExecution>>('bip_pad_exec_map', {});
  // 初始工单：优先从实际下发/生产中的工单中取第一张，无则 undefined（空状态）
  const [selectedWo, setSelectedWo] = useLocalStorage<WorkOrder | null>(
    'bip_pad_selected_wo',
    (() => {
      const real = loadPadWorkOrders();
      return real.length > 0 ? real[0] : null;
    })(),
  );
  // PAD 可选工单列表（API 更新后刷新）
  const [, setPadWos] = useState<WorkOrder[]>(() => {
    return loadPadWorkOrders();
  });

  // 从后端加载 RELEASED/IN_PROGRESS 工单和流转票，写入 localStorage，供 PAD 使用
  const loadFromApi = useCallback(async () => {
    if (isUserCleared()) return;   // 用户已主动清空，不从 API 重新拉取数据
    try {
      const [woResp, ftResp] = await Promise.all([
        getWorkOrderList({ status: 'RELEASED' }) as any,
        // float-tickets/list 当前后端尚未实现，silent 避免 404 弹 toast
        getFloatTicketList().catch(() => ({ data: [] })) as any,
      ]);
      const apiWos: any[] = woResp.data ?? [];
      const apiFts: any[] = (ftResp?.data ?? []);
      const woStatusMap: Record<string, WOStatus> = {
        DRAFT: 'CREATED', RELEASED: 'RELEASED', IN_PROGRESS: 'IN_PROGRESS',
        COMPLETED: 'COMPLETED', CLOSED: 'CLOSED',
      };
      const l2Wos: L2WorkOrder[] = apiWos.map((item: any) => ({
        id: item.id?.toString() ?? item.workOrderNo,
        woNo: item.workOrderNo ?? '',
        poId: item.orderId?.toString() ?? '',
        poNo: item.orderNo ?? '',
        batchNo: item.workOrderNo ?? '',
        productCode: item.materialCode ?? '',
        productName: item.materialName ?? '',
        productSpec: item.spec ?? '',
        bomVersion: item.bomVersion ?? '',
        routingCode: item.routingId?.toString() ?? '',
        routingName: item.workCenterName ?? '',
        planQty: item.planQuantity ?? 0,
        actualQty: item.completedQuantity ?? 0,
        scrapQty: item.unqualifiedQuantity ?? 0,
        status: (woStatusMap[item.status] ?? 'RELEASED') as WOStatus,
        priority: 'NORMAL' as const,
        planStart: item.startDate ?? '',
        planEnd: item.endDate ?? '',
        createdAt: item.createTime ? item.createTime.slice(0, 10) : '',
        createdBy: item.createBy ?? 'admin',
      }));
      const l2Fts: FloatTicketV2[] = apiFts.map((item: any) => ({
        id: item.id?.toString() ?? item.ticketNo,
        ticketNo: item.ticketNo ?? '',
        woId: item.workOrderId?.toString() ?? '',
        woNo: item.workOrderNo ?? '',
        batchNo: item.workOrderNo ?? '',
        qty: item.quantity ?? 0,
        printTime: item.createTime ?? '',
        status: (item.status as FloatTicketV2['status']) ?? 'PRINTED',
        qrContent: item.ticketNo ?? '',
        operatorName: item.operatorName ?? '',
      }));
      if (l2Wos.length > 0) {
        saveWorkOrders(l2Wos);
        saveFloatTickets(l2Fts);
        const padList = l2Wos
          .filter(w => w.status === 'RELEASED' || w.status === 'IN_PROGRESS')
          .map(w => l2WoToPadWo(w, l2Fts));
        if (padList.length > 0) {
          setPadWos(padList);
          // 如果当前选中的工单在列表中，保持选择；否则切换到第一张
          const current = padList.find(w => w.id === selectedWo?.id);
          if (!current) setSelectedWo(padList[0]);
        }
      }
    } catch { /* 静默回退到 mock 数据 */ }
  }, [selectedWo?.id, setSelectedWo]);

  useEffect(() => { loadFromApi(); }, [loadFromApi]);

  // 持久化当前视图与正在执行的工序编码，刷新后能直接恢复执行现场
  const [view, setView]             = useLocalStorage<View>('bip_pad_view', 'list');
  const [currentOpCode, setCurrentOpCode] = useLocalStorage<string | null>('bip_pad_current_op_code', null);

  // EBR 持久化存储
  const [ebrRecords, setEbrRecords] = useLocalStorage<EbrRecord[]>(EBR_STORAGE_KEY, []);

  // ── 当前工单变化时立即确保 EBR 记录存在 ─────────────────────────
  // 保证批记录打印页在工单选择后立即能读到品名/批号/规格等基础信息
  useEffect(() => {
    if (!selectedWo) return;
    setEbrRecords(prevEbrs => {
      const exists = prevEbrs.some(e => e.woId === selectedWo.id);
      if (exists) return prevEbrs;
      const newEbr = buildEbrFromExecMap(selectedWo, execMap);
      return [newEbr, ...prevEbrs];
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWo?.id]);

  // 根据持久化的 opCode 还原 currentOp 对象（仅 GMP 工序）
  const currentOp: OperationDef | null =
    GMP_OPERATIONS.find(op => op.code === currentOpCode)
    ?? null;
  const currentWo: WorkOrder | null = selectedWo ?? null;

  // ── 全屏 & 横屏 ─────────────────────────────────────────────
  const [isFullscreen, setIsFullscreen]   = useState(false);
  const [portraitWarn, setPortraitWarn]   = useState(isPortrait);
  const containerRef                       = useRef<HTMLDivElement>(null);

  /** 监听屏幕旋转 */
  useEffect(() => {
    const handleResize = () => setPortraitWarn(isPortrait());
    window.addEventListener('resize',       handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize',       handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  /** 监听浏览器全屏变化（ESC 退出时同步） */
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) {
      try {
        await (containerRef.current ?? document.documentElement).requestFullscreen();
        setIsFullscreen(true);
      } catch {
        // Fullscreen not supported / denied — silently ignore
      }
    } else {
      try {
        await document.exitFullscreen();
        setIsFullscreen(false);
      } catch {/* ignore */}
    }
  }, []);

  // ── 工单切换时立即确保 EBR 存在（联动批记录打印页） ─────────────
  const ensureEbrForWo = useCallback(
    (wo: WorkOrder, currentExecMap: Record<string, OperationExecution>) => {
      setEbrRecords(prevEbrs => {
        const exists = prevEbrs.some(e => e.woId === wo.id);
        if (exists) return prevEbrs;
        // 首次选择该工单：立即建一条 IN_PROGRESS EBR（execMap 此时可能为空，但必填字段已从 wo 填入）
        const newEbr = buildEbrFromExecMap(wo, currentExecMap);
        return [newEbr, ...prevEbrs];
      });
    },
    [],
  );

  // ── 导航回调 ─────────────────────────────────────────────────
  const handleStartExecution = useCallback(
    async (op: OperationDef, wo: WorkOrder, map: Record<string, OperationExecution>) => {
      setCurrentOpCode(op.code);
      setSelectedWo(wo);
      setExecMap(map);   // 同步最新 execMap（含新初始化的工序）
      ensureEbrForWo(wo, map);   // 确保 EBR 记录已创建，批记录打印页可立即读到品名/批号
      setView('execution');
      // 自动进入全屏 PAD 模式
      if (!document.fullscreenElement) {
        try {
          await (containerRef.current ?? document.documentElement).requestFullscreen();
          setIsFullscreen(true);
        } catch {
          // 不支持全屏时静默忽略
        }
      }
    },
    []
  );

  const handleUpdateExec = useCallback(
    (code: string, exec: OperationExecution) => {
      setExecMap(prev => {
        const newMap = { ...prev, [code]: exec };
        const wo = selectedWo;
        if (!wo) return newMap;

        // ── 按工单保存 execMap 快照（供批记录打印页多批次切换读取）──────
        try {
          localStorage.setItem(
            `bip_pad_exec_snap_${wo.id}`,
            JSON.stringify(newMap),
          );
        } catch { /* quota ignore */ }

        // ── 同步回 L2 工单进度 ─────────────────────────────────────
        const reportQty = exec.finishQty || 0;
        const scrapQty  = exec.scrapQty  || 0;
        writePadExecBackToWo(wo.id, newMap, reportQty, scrapQty);

        // ── 自动同步 EBR ──────────────────────────────────────────
        setEbrRecords(prevEbrs => {
          const existingIdx = prevEbrs.findIndex(e => e.woId === wo.id);
          if (existingIdx >= 0) {
            // 更新现有 EBR
            const updated = updateEbr(prevEbrs[existingIdx], wo, newMap);
            const next = [...prevEbrs];
            next[existingIdx] = updated;
            // 若状态从 IN_PROGRESS 变为 COMPLETED（全部工序完成），推送通知
            if (prevEbrs[existingIdx].status === 'IN_PROGRESS' && updated.status === 'COMPLETED') {
              notification.success({
                message: '电子批记录已生成',
                description: `批次 ${wo.batchNo} 全部工序已完成，EBR（${updated.ebrNo}）已自动归档，等待 QA 审核。`,
                icon: <FileTextOutlined style={{ color: '#52c41a' }} />,
                duration: 8,
              });
            }
            return next;
          } else {
            // 首次为该工单创建 EBR
            const newEbr = buildEbrFromExecMap(wo, newMap);
            return [newEbr, ...prevEbrs];
          }
        });

        return newMap;
      });
    },
    [selectedWo]
  );

  const handleBack = useCallback(async () => {
    setView('list');
    setCurrentOpCode(null);
    // 返回列表时退出全屏
    if (document.fullscreenElement) {
      try { await document.exitFullscreen(); } catch {/* ignore */}
    }
  }, []);

  // ── 全屏切换按钮（固定右下角） ─────────────────────────────
  const FullscreenBtn = (
    <Button
      shape="circle"
      size="large"
      icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
      title={isFullscreen ? '退出全屏' : '进入全屏 PAD 模式'}
      onClick={toggleFullscreen}
      style={{
        position:   'fixed',
        bottom:     isFullscreen ? 16 : 72,
        right:      isFullscreen ? 16 : 72,
        width:      44,
        height:     44,
        zIndex:     9999,
        background: 'rgba(26,35,126,0.82)',
        color:      '#fff',
        border:     'none',
        boxShadow:  '0 4px 12px rgba(0,0,0,0.35)',
        transition: 'all 0.3s',
      }}
    />
  );

  // ── 竖屏提示 Modal ─────────────────────────────────────────
  const PortraitModal = (
    <Modal
      open={portraitWarn}
      footer={null}
      closable={false}
      centered
      width={320}
      styles={{ mask: { background: 'rgba(0,0,0,0.82)' } }}
    >
      <div style={{ textAlign: 'center', padding: '12px 0' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>
          <RotateRightOutlined style={{ color: '#1890ff' }} />
        </div>
        <Title level={4} style={{ color: '#1a237e', marginBottom: 8 }}>
          请旋转至横屏
        </Title>
        <Text type="secondary" style={{ fontSize: 14 }}>
          本系统专为 10 英寸工业 PAD（1920×1200）横屏模式设计，竖屏使用体验受限。
        </Text>
        <Space direction="vertical" style={{ width: '100%', marginTop: 20 }} size={10}>
          <Alert
            type="info"
            showIcon
            icon={<MobileOutlined />}
            message="请旋转设备至横屏后继续操作"
            style={{ textAlign: 'left', fontSize: 12 }}
          />
          <Button
            type="primary"
            block
            style={{ height: 44 }}
            onClick={() => setPortraitWarn(false)}
          >
            我知道了，继续使用
          </Button>
        </Space>
      </div>
    </Modal>
  );

  return (
    /* ConfigProvider: 全屏模式下所有下拉/弹层挂载到容器内，避免被遮挡 */
    <ConfigProvider
      getPopupContainer={() => containerRef.current ?? document.body}
    >
      <div ref={containerRef} style={{ position: 'relative', minHeight: '100vh' }}>
        {/* 竖屏提示 */}
        {PortraitModal}

        {/* 全屏切换按钮（仅列表页显示） */}
        {view === 'list' && FullscreenBtn}

        {/* 列表页 */}
        {view === 'list' && (
          <PadOperationListPage
            onStartExecution={handleStartExecution}
            execMap={execMap}
            setExecMap={setExecMap}
            selectedWo={selectedWo ?? undefined}
            setSelectedWo={setSelectedWo}
          />
        )}

        {/* ===== 执行页：固定全屏覆盖层，脱离主布局 ===== */}
        {view === 'execution' && currentOp && currentWo && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 1000,
              background: '#f0f2f5',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <PadExecutionPage
              operation={currentOp}
              workOrder={currentWo}
              onBack={handleBack}
              execMap={execMap}
              onUpdateExec={handleUpdateExec}
            />
          </div>
        )}
      </div>
    </ConfigProvider>
  );
};

export default PadIndex;

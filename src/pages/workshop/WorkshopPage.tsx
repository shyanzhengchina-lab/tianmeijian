import React, { useState, useEffect, useCallback } from 'react';
import { Drawer, Tag, Button, Progress, message, Select } from 'antd';
import {
  MonitorOutlined, AlertOutlined, CheckCircleOutlined,
  ClockCircleOutlined, PauseCircleOutlined, ThunderboltOutlined,
  ReloadOutlined, PrinterOutlined, ExclamationCircleOutlined,
} from '@ant-design/icons';
import {
  mockStations,
  StationCard, StationStatus,
} from './workshopData';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { STORE_KEYS } from '../../store/mesStore';
import { getWorkshopList, WorkshopRecord } from '../../api/workshops';
import { getWorkCenterList } from '../../api/workCenters';
import { getTaskOrderList } from '../../api/taskOrders';
import EbrModal from './EbrModal';
import './WorkshopPage.css';
import './EbrModal.css';

const { Option } = Select;

// 状态配置
const STATUS_CONFIG: Record<StationStatus, { label: string; icon: React.ReactNode; dotColor: string }> = {
  RUNNING:       { label: '生产中',   icon: <CheckCircleOutlined />,    dotColor: '#52c41a' },
  WAIT_TRANSFER: { label: '待转移',   icon: <ClockCircleOutlined />,    dotColor: '#faad14' },
  WAIT_INSPECT:  { label: '待检验',   icon: <MonitorOutlined />,        dotColor: '#1890ff' },
  IDLE:          { label: '未开工',   icon: <PauseCircleOutlined />,    dotColor: '#595959' },
  BLOCKED:       { label: '异常停机', icon: <AlertOutlined />,          dotColor: '#ff4d4f' },
};

const WorkshopPage: React.FC = () => {
  // stations 用 useLocalStorage 持久化，刷页后保留工位状态
  const [stations, setStations] = useLocalStorage<StationCard[]>(STORE_KEYS.WORKSHOP_STATIONS, mockStations);
  const [selectedStation, setSelectedStation] = useState<StationCard | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [filterStatus, setFilterStatus] = useState<StationStatus | 'ALL'>('ALL');
  const [ebrOpen, setEbrOpen] = useState(false);
  const [ebrStation, setEbrStation] = useState<StationCard | null>(null);
  const [workshops, setWorkshops] = useState<WorkshopRecord[]>([]);
  const [selectedWorkshop, setSelectedWorkshop] = useState<string>('ALL');
  const [apiLoading, setApiLoading] = useState(false);

  // ── API 加载 ──────────────────────────────────────────────────────
  const loadFromApi = useCallback(async () => {
    setApiLoading(true);
    try {
      // 1. 加载车间列表（master data）
      const wsResp = await getWorkshopList() as any;
      const wsList: WorkshopRecord[] = wsResp?.data ?? wsResp ?? [];
      if (Array.isArray(wsList) && wsList.length > 0) setWorkshops(wsList);

      // 2. 加载工作中心列表，用来补充/替换工位卡片
      const wcResp = await getWorkCenterList() as any;
      const wcList: any[] = wcResp?.data ?? [];
      if (Array.isArray(wcList) && wcList.length > 0) {
        // Merge work-center records into station list:
        // For each work center, find matching station by code or name, or create a new card
        setStations(prev => {
          const result = [...prev];
          for (const wc of wcList) {
            const idx = result.findIndex(
              s => s.stationCode === wc.code || s.stationName === wc.name
            );
            if (idx >= 0) {
              // update name and code from DB
              result[idx] = { ...result[idx], stationCode: wc.code ?? result[idx].stationCode, stationName: wc.name ?? result[idx].stationName };
            }
            // (don't add entirely new blank cards — real stations need all the card fields)
          }
          return result;
        });
      }

      // 3. 加载进行中任务单，合并到工位卡片（用 operationCode 匹配 stationCode）
      const toResp = await getTaskOrderList({ status: 'IN_PROGRESS' }) as any;
      const taskList: any[] = toResp?.data ?? toResp ?? [];
      if (Array.isArray(taskList) && taskList.length > 0) {
        setStations(prev => prev.map(station => {
          const match = taskList.find(
            t => t.operationCode === station.stationCode ||
                 t.workCenterName === station.stationName
          );
          if (!match) return station;
          return {
            ...station,
            batchNo:   match.workOrderNo       ?? station.batchNo,
            planQty:   match.planQuantity       != null ? Number(match.planQuantity)       : station.planQty,
            finishQty: match.completedQuantity  != null ? Number(match.completedQuantity)  : station.finishQty,
            operator:  match.assignedToName     ?? station.operator,
          };
        }));
      }
    } catch { /* graceful fallback to mock */ } finally { setApiLoading(false); }
  }, [setStations]);

  useEffect(() => { loadFromApi(); }, [loadFromApi]);

  // 动态 summary（基于实际工位状态）
  const liveSummary = {
    running:      stations.filter(s => s.status === 'RUNNING').length,
    waitTransfer: stations.filter(s => s.status === 'WAIT_TRANSFER').length,
    waitInspect:  stations.filter(s => s.status === 'WAIT_INSPECT').length,
    idle:         stations.filter(s => s.status === 'IDLE').length,
    blocked:      stations.filter(s => s.status === 'BLOCKED').length,
    todayOutput:  stations.reduce((acc, s) => acc + (s.finishQty ?? 0), 0),
    todayTarget:  stations.reduce((acc, s) => acc + (s.planQty  ?? 0), 0),
  };

  const handleOpenEbr = (station: StationCard) => {
    setEbrStation(station);
    setEbrOpen(true);
  };

  // 实时时钟
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 模拟实时数据刷新（每30秒更新进度）——更新后自动写入 localStorage
  useEffect(() => {
    const refresh = setInterval(() => {
      setStations(prev => prev.map(s => {
        if (s.status === 'RUNNING' && s.finishQty !== undefined && s.planQty) {
          const delta = Math.floor(Math.random() * 20);
          return { ...s, finishQty: Math.min(s.finishQty + delta, s.planQty) };
        }
        return s;
      }));
    }, 30000);
    return () => clearInterval(refresh);
  }, [setStations]);

  const handleCardClick = (station: StationCard) => {
    setSelectedStation(station);
    setDrawerOpen(true);
  };

  // 车间过滤（按工位 stationCode 前缀匹配车间 code）
  const workshopFilteredStations = selectedWorkshop === 'ALL'
    ? stations
    : stations.filter(s => {
        const ws = workshops.find(w => String(w.id) === selectedWorkshop);
        return ws ? s.stationCode.startsWith(ws.code?.split('-')[1] ?? 'XX') : true;
      });

  const handleCopyBatch = (batchNo: string) => {
    navigator.clipboard?.writeText(batchNo).catch(() => {});
    message.success(`批号 ${batchNo} 已复制`);
  };

  const filteredStations = filterStatus === 'ALL'
    ? workshopFilteredStations
    : workshopFilteredStations.filter(s => s.status === filterStatus);

  const timeStr = currentTime.toLocaleString('zh-CN', {
    month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });

  return (
    <div className="workshop-page">
      {/* ── 顶部状态栏 ── */}
      <div className="workshop-header">
        <div className="title-area">
          <MonitorOutlined style={{ color: '#64b5f6', fontSize: 22 }} />
          <span className="ws-title">根管锉车间生产看板</span>
          <span className="ws-time">{timeStr}</span>
        </div>

        <div className="ws-kpi-row">
          {([
            { cls: 'kpi-running',  val: liveSummary.running,                              label: '生产中',   filter: 'RUNNING'       as const },
            { cls: 'kpi-wait',     val: liveSummary.waitTransfer,                         label: '待转移',   filter: 'WAIT_TRANSFER' as const },
            { cls: 'kpi-inspect',  val: liveSummary.waitInspect,                          label: '待检验',   filter: 'WAIT_INSPECT'  as const },
            { cls: 'kpi-idle',     val: liveSummary.idle,                                 label: '闲置',     filter: 'IDLE'          as const },
            { cls: 'kpi-blocked',  val: liveSummary.blocked,                              label: '异常',     filter: 'BLOCKED'       as const },
            { cls: 'kpi-output',   val: `${liveSummary.todayOutput.toLocaleString()}`,    label: '今日产出', filter: 'ALL'            as const },
          ] as { cls: string; val: string | number; label: string; filter: StationStatus | 'ALL' }[]).map(k => {
            const isActive = filterStatus === k.filter && k.filter !== 'ALL';
            return (
              <div
                key={k.label}
                className={`ws-kpi-item ${k.cls}${isActive ? ' kpi-active' : ''}`}
                onClick={() => {
                  if (k.filter === 'ALL') return; // 今日产出不过滤
                  setFilterStatus(prev => prev === k.filter ? 'ALL' : k.filter);
                }}
                style={{
                  cursor: k.filter !== 'ALL' ? 'pointer' : 'default',
                  outline: isActive ? '2px solid rgba(255,255,255,0.6)' : 'none',
                  transform: isActive ? 'scale(1.06)' : 'scale(1)',
                  transition: 'transform 0.15s, outline 0.15s',
                }}
                title={k.filter !== 'ALL' ? `点击过滤：${k.label}` : ''}
              >
                <div className="kpi-val">{k.val}</div>
                <div className="kpi-label">{k.label}{isActive ? ' ✓' : ''}</div>
              </div>
            );
          })}

          {workshops.length > 0 && (
            <Select
              value={selectedWorkshop}
              onChange={setSelectedWorkshop}
              size="small"
              style={{ width: 160, marginLeft: 8 }}
              dropdownStyle={{ fontSize: 12 }}
            >
              <Option value="ALL">全部车间</Option>
              {workshops.map(w => (
                <Option key={String(w.id)} value={String(w.id)}>{w.name}</Option>
              ))}
            </Select>
          )}
          <Button
            size="small"
            icon={<ReloadOutlined />}
            loading={apiLoading}
            onClick={() => { setFilterStatus('ALL'); setSelectedWorkshop('ALL'); loadFromApi().then(() => message.success('数据已刷新')); }}
            style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: '#aaa', marginLeft: 8 }}
          >
            刷新
          </Button>
        </div>
      </div>

      {/* 过滤按钮 */}
      <div style={{
        padding: '8px 16px', background: '#fff',
        borderBottom: '1px solid #e8ecf0',
        display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0, flexWrap: 'wrap',
      }}>
        <span style={{ color: '#98a2b3', fontSize: 12 }}>筛选：</span>
        {[
          { key: 'ALL',           label: `全部 (${workshopFilteredStations.length})` },
          { key: 'RUNNING',       label: `🟢 生产中 (${liveSummary.running})` },
          { key: 'WAIT_TRANSFER', label: `🟡 待转移 (${liveSummary.waitTransfer})` },
          { key: 'WAIT_INSPECT',  label: `🔵 待检验 (${liveSummary.waitInspect})` },
          { key: 'IDLE',          label: `⚫ 闲置 (${liveSummary.idle})` },
          { key: 'BLOCKED',       label: `🔴 异常 (${liveSummary.blocked})` },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilterStatus(f.key as any)}
            style={{
              fontSize: 11, padding: '3px 10px', borderRadius: 12,
              border: filterStatus === f.key ? '1px solid #1677FF' : '1px solid #d0d5dd',
              background: filterStatus === f.key ? '#e6f4ff' : '#f9fafb',
              color: filterStatus === f.key ? '#1677ff' : '#667085',
              cursor: 'pointer',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ── 工位卡片区 ── */}
      <div className="workshop-body">
        <div className="station-grid">
          {filteredStations.map(station => (
            <StationCardItem
              key={station.id}
              station={station}
              onClick={() => handleCardClick(station)}
              onOpenEbr={handleOpenEbr}
            />
          ))}
        </div>
      </div>

      {/* ── 侧边详情抽屉 ── */}
      <Drawer
        title={
          <span style={{ color: '#1d2939' }}>
            <span style={{
              display: 'inline-block', width: 10, height: 10,
              borderRadius: '50%', background: STATUS_CONFIG[selectedStation?.status || 'IDLE'].dotColor,
              marginRight: 8, boxShadow: `0 0 6px ${STATUS_CONFIG[selectedStation?.status || 'IDLE'].dotColor}`,
            }} />
            {selectedStation?.stationName} — {STATUS_CONFIG[selectedStation?.status || 'IDLE'].label}
          </span>
        }
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={360}
        className="station-drawer"
        styles={{ body: { background: '#fff', padding: 16 }, header: { background: '#fff', borderBottom: '1px solid #e8ecf0' } }}
      >
        {selectedStation && <DrawerContent station={selectedStation} onCopyBatch={handleCopyBatch} onOpenEbr={handleOpenEbr} />}
      </Drawer>

      {/* EBR 电子批生产记录弹窗 */}
      <EbrModal
        open={ebrOpen}
        station={ebrStation}
        onClose={() => { setEbrOpen(false); setEbrStation(null); }}
      />
    </div>
  );
};

// ── 工位卡片组件 ──────────────────────────────────────────────────
const StationCardItem: React.FC<{ station: StationCard; onClick: () => void; onOpenEbr: (s: StationCard) => void }> = ({ station, onClick, onOpenEbr }) => {
  const statusConf = STATUS_CONFIG[station.status];
  const progress = station.planQty && station.finishQty
    ? Math.round((station.finishQty / station.planQty) * 100)
    : 0;

  return (
    <div className={`station-card ${station.status}`} onClick={onClick}>
      {/* 卡片标题 */}
      <div className="card-header">
        <div className="status-dot" />
        <span className="station-name">{station.stationName}</span>
        <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 8,
          background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.45)' }}>
          {statusConf.label}
        </span>
        <span className="device-code">{station.deviceCode}</span>
      </div>

      {/* 卡片内容 */}
      <div className="card-body">
        {/* 生产中 */}
        {station.status === 'RUNNING' && (
          <>
            <div className="card-row">
              <span className="row-label">批号</span>
              <span className="row-val highlight">{station.batchNo}</span>
            </div>
            <div className="card-row">
              <span className="row-label">型号</span>
              <span className="row-val">{station.productModel}</span>
            </div>
            <div className="card-row">
              <span className="row-label">当前阶段</span>
              <span className="row-val" style={{ color: '#52c41a' }}>{station.currentStage}</span>
            </div>
            <div className="card-row">
              <span className="row-label">操作员</span>
              <span className="row-val">{station.operator}</span>
            </div>
            <div className="card-progress">
              <div className="progress-label">
                <span>完成 {station.finishQty?.toLocaleString()} / {station.planQty?.toLocaleString()}</span>
                <span style={{ color: '#52c41a', fontWeight: 700 }}>{progress}%</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
            </div>
          </>
        )}

        {/* 待转移 */}
        {station.status === 'WAIT_TRANSFER' && (
          <>
            <div className="card-row">
              <span className="row-label">批号</span>
              <span className="row-val highlight">{station.batchNo}</span>
            </div>
            <div className="card-row">
              <span className="row-label">待转移数量</span>
              <span className="row-val" style={{ color: '#faad14', fontWeight: 700 }}>
                {station.waitTransferQty?.toLocaleString()} 支
              </span>
            </div>
            <div className="card-row">
              <span className="row-label">完成时间</span>
              <span className="row-val">{station.finishTime}</span>
            </div>
            <div className="card-row">
              <span className="row-label">下工序</span>
              <span className="row-val">{station.nextStation}</span>
            </div>
            {(station.stayMinutes || 0) > 20 && (
              <div style={{ marginTop: 6, padding: '4px 8px', background: 'rgba(250,173,20,0.15)',
                borderRadius: 4, fontSize: 11, color: '#faad14' }}>
                ⚠️ 滞留 {station.stayMinutes} 分钟
              </div>
            )}
          </>
        )}

        {/* 待检验 */}
        {station.status === 'WAIT_INSPECT' && (
          <>
            <div className="card-row">
              <span className="row-label">批号</span>
              <span className="row-val highlight">{station.batchNo}</span>
            </div>
            <div className="card-row">
              <span className="row-label">报工数量</span>
              <span className="row-val" style={{ color: '#1890ff', fontWeight: 700 }}>
                {station.reportQty?.toLocaleString()} 支（待QC）
              </span>
            </div>
            <div className="card-row">
              <span className="row-label">报工时间</span>
              <span className="row-val">{station.reportTime}</span>
            </div>
            <div className="card-row">
              <span className="row-label">检验单</span>
              <span className="row-val" style={{ color: '#40a9ff' }}>{station.inspectTicketNo}</span>
            </div>
          </>
        )}

        {/* 闲置 */}
        {station.status === 'IDLE' && (
          <>
            <div style={{ textAlign: 'center', padding: '8px 0', color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
              当前无生产任务
            </div>
            <div className="card-row">
              <span className="row-label">上次批号</span>
              <span className="row-val" style={{ color: '#595959' }}>{station.lastBatchNo}</span>
            </div>
            <div className="card-row">
              <span className="row-label">保养倒计时</span>
              <span className="row-val">{station.maintainCountdown}</span>
            </div>
          </>
        )}

        {/* 异常停机 */}
        {station.status === 'BLOCKED' && (
          <>
            <div className="card-row">
              <span className="row-label">批号</span>
              <span className="row-val highlight">{station.batchNo}</span>
            </div>
            <div style={{ marginTop: 4, padding: '6px 8px',
              background: 'rgba(255,77,79,0.15)', borderRadius: 4,
              fontSize: 12, color: '#ff7875', display: 'flex', gap: 6, alignItems: 'flex-start' }}>
              <ExclamationCircleOutlined style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{station.anomalyDesc}</span>
            </div>
            <div className="card-row" style={{ marginTop: 6 }}>
              <span className="row-label">异常单</span>
              <span className="row-val" style={{ color: '#ff4d4f' }}>{station.anomalyTicketNo}</span>
            </div>
            <div className="card-row">
              <span className="row-label">上报人/时间</span>
              <span className="row-val">{station.reportPerson} {station.anomalyTime}</span>
            </div>
          </>
        )}
      </div>

      {/* 卡片底部按钮 */}
      <div className="card-footer">
        {station.status === 'RUNNING' && (
          <button className="card-btn btn-ghost" onClick={e => { e.stopPropagation(); onOpenEbr(station); }}>查看EBR</button>
        )}
        {station.status === 'WAIT_TRANSFER' && (
          <button className="card-btn btn-warn" onClick={e => { e.stopPropagation(); message.success('已呼叫转运'); }}>
            呼叫转运
          </button>
        )}
        {station.status === 'WAIT_INSPECT' && (
          <button className="card-btn btn-primary" onClick={e => { e.stopPropagation(); message.success('已催促QC'); }}>
            催促QC
          </button>
        )}
        {station.status === 'IDLE' && (
          <button className="card-btn btn-ghost" onClick={e => { e.stopPropagation(); }}>开工准备</button>
        )}
        {station.status === 'BLOCKED' && (
          <button className="card-btn btn-danger" onClick={e => { e.stopPropagation(); message.warning('已上报异常'); }}>
            处理异常
          </button>
        )}
      </div>
    </div>
  );
};

// ── 抽屉内容组件 ────────────────────────────────────────────────
const DrawerContent: React.FC<{
  station: StationCard;
  onCopyBatch: (b: string) => void;
  onOpenEbr?: (s: StationCard) => void;
}> = ({ station, onCopyBatch, onOpenEbr }) => {
  const statusConf = STATUS_CONFIG[station.status];
  const progress = station.planQty && station.finishQty
    ? Math.round((station.finishQty / station.planQty) * 100) : 0;

  return (
    <div>
      <div className="drawer-section">
        <div className="drawer-section-title">工位信息</div>
        <div className="drawer-row"><span className="d-label">工位编码</span><span className="d-val blue">{station.stationCode}</span></div>
        <div className="drawer-row"><span className="d-label">设备编码</span><span className="d-val">{station.deviceCode}</span></div>
        <div className="drawer-row">
          <span className="d-label">当前状态</span>
          <span className="d-val" style={{ color: STATUS_CONFIG[station.status].dotColor }}>
            {statusConf.icon} {statusConf.label}
          </span>
        </div>
      </div>

      {station.batchNo && (
        <div className="drawer-section">
          <div className="drawer-section-title">在制批次</div>
          <div className="drawer-row">
            <span className="d-label">生产批号</span>
            <span className="d-val blue" style={{ cursor: 'pointer' }}
              onClick={() => onCopyBatch(station.batchNo!)}>
              {station.batchNo} 📋
            </span>
          </div>
          <div className="drawer-row"><span className="d-label">产品型号</span><span className="d-val">{station.productModel}</span></div>
          {station.planQty && <div className="drawer-row"><span className="d-label">计划数量</span><span className="d-val">{station.planQty.toLocaleString()} 支</span></div>}
          {station.finishQty !== undefined && (
            <div className="drawer-row">
              <span className="d-label">完成数量</span>
              <span className="d-val green">{station.finishQty.toLocaleString()} 支</span>
            </div>
          )}
          {station.status === 'RUNNING' && station.planQty && (
            <div style={{ marginTop: 10 }}>
              <Progress percent={progress} strokeColor="#52c41a" trailColor="rgba(255,255,255,0.1)"
                format={p => <span style={{ color: '#52c41a' }}>{p}%</span>} />
            </div>
          )}
        </div>
      )}

      {station.status === 'RUNNING' && (
        <div className="drawer-section">
          <div className="drawer-section-title">执行状态</div>
          <div className="drawer-row"><span className="d-label">当前阶段</span><span className="d-val green">{station.currentStage}</span></div>
          <div className="drawer-row"><span className="d-label">操作员</span><span className="d-val">{station.operator}</span></div>
        </div>
      )}

      {station.status === 'WAIT_TRANSFER' && (
        <div className="drawer-section">
          <div className="drawer-section-title">转移信息</div>
          <div className="drawer-row"><span className="d-label">待转数量</span><span className="d-val yellow">{station.waitTransferQty?.toLocaleString()} 支</span></div>
          <div className="drawer-row"><span className="d-label">完成时间</span><span className="d-val">{station.finishTime}</span></div>
          <div className="drawer-row"><span className="d-label">目标工序</span><span className="d-val">{station.nextStation}</span></div>
          <div className="drawer-row"><span className="d-label">滞留时长</span>
            <span className="d-val" style={{ color: (station.stayMinutes || 0) > 20 ? '#faad14' : 'inherit' }}>
              {station.stayMinutes} 分钟 {(station.stayMinutes || 0) > 20 ? '⚠️' : ''}
            </span>
          </div>
        </div>
      )}

      {station.status === 'WAIT_INSPECT' && (
        <div className="drawer-section">
          <div className="drawer-section-title">检验信息</div>
          <div className="drawer-row"><span className="d-label">报工数量</span><span className="d-val blue">{station.reportQty?.toLocaleString()} 支</span></div>
          <div className="drawer-row"><span className="d-label">报工时间</span><span className="d-val">{station.reportTime}</span></div>
          <div className="drawer-row"><span className="d-label">检验单号</span><span className="d-val blue">{station.inspectTicketNo}</span></div>
          <div className="drawer-row"><span className="d-label">QC状态</span><span className="d-val yellow">待检验</span></div>
        </div>
      )}

      {station.status === 'BLOCKED' && (
        <div className="drawer-section">
          <div className="drawer-section-title">异常信息</div>
          <div className="drawer-row"><span className="d-label">异常描述</span><span className="d-val red">{station.anomalyDesc}</span></div>
          <div className="drawer-row"><span className="d-label">NCR单号</span><span className="d-val red">{station.anomalyTicketNo}</span></div>
          <div className="drawer-row"><span className="d-label">上报人</span><span className="d-val">{station.reportPerson}</span></div>
          <div className="drawer-row"><span className="d-label">上报时间</span><span className="d-val">{station.anomalyTime}</span></div>
        </div>
      )}

      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {station.status === 'RUNNING' && onOpenEbr && (
          <Button block type="primary" icon={<CheckCircleOutlined />}
            style={{ background: '#1677ff', borderColor: '#1677ff', fontWeight: 600 }}
            onClick={() => onOpenEbr(station)}>
            查看 / 填写 EBR（确认进入下阶段）
          </Button>
        )}
        <Button block icon={<PrinterOutlined />}
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#aaa' }}
          onClick={() => message.info('浮票打印功能待集成热敏打印机')}>
          打印浮票
        </Button>
        {station.status === 'WAIT_INSPECT' && (
          <Button block type="primary" icon={<ThunderboltOutlined />}
            onClick={() => message.success('已向QC工作台推送高优先级检验任务')}>
            催促QC检验
          </Button>
        )}
        {station.status === 'WAIT_TRANSFER' && (
          <Button block style={{ background: '#faad14', border: 'none', color: '#000', fontWeight: 600 }}
            onClick={() => message.success('已呼叫转运员')}>
            呼叫转运
          </Button>
        )}
      </div>
    </div>
  );
};

export default WorkshopPage;

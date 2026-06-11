/**
 * EquipmentManagementPage.tsx — 设备管理主页
 * GMP医疗器械MES 设备管理模块
 *
 * 功能子模块：
 *   1. 设备档案    — 设备基础信息、状态、OEE
 *   2. 故障与维修  — 故障报告、派工、维修记录、RCA/CAPA
 *   3. 维保计划    — 日常/月度/季度/年度维保计划与执行
 *   4. 计量校准    — 检测设备校准记录与到期提醒
 *   5. 备件管理    — 备件库存、入库/出库、低库存预警
 *
 * v2：总览KPI卡片、告警Tag、待处理事项 均可点击跳转到对应子Tab并激活过滤
 */
import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { Tabs, Badge, Tag, Row, Col, Progress, Tooltip } from 'antd';
import {
  ToolOutlined, ExclamationCircleOutlined, CalendarOutlined,
  SafetyCertificateOutlined, InboxOutlined, WarningOutlined,
  CheckCircleOutlined, DashboardOutlined, FileTextOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import EquipArchivePage, { ArchiveQuickFilter } from './EquipArchivePage';
import FaultRepairPage, { FaultCardFilter } from './FaultRepairPage';
import MaintPlanPage, { MaintCardFilter } from './MaintPlanPage';
import CalibrationPage, { CalibCardFilter } from './CalibrationPage';
import SparePartsPage, { SpareCardFilter } from './SparePartsPage';
import EquipUsagePage from './EquipUsagePage';
import {
  mockEquipRecords, mockFaultRecords, mockMaintPlans, mockCalibRecords, mockSpareparts, mockUsageRecords,
  EQUIP_STATUS_MAP, isOverdue, getDaysUntil,
} from './equipmentData';
import type { EquipRecord, FaultRecord, MaintPlan, CalibRecord, SparePartRecord } from './equipmentData';
import { getEquipmentList } from '../../api/equipment';
import { getFaultList, getMaintPlanList, getCalibrationList, getSparePartList } from '../../api/equipmentSub';

// ══════════════════════════════════════════════════════════════
// 跳转指令类型：tab + 初始卡片过滤
// ══════════════════════════════════════════════════════════════
interface NavTarget {
  tab: string;
  archiveFilter?: ArchiveQuickFilter;
  faultFilter?: FaultCardFilter;
  maintFilter?: MaintCardFilter;
  calibFilter?: CalibCardFilter;
  spareFilter?: SpareCardFilter;
}

// ══════════════════════════════════════════════════════════════
// 总览仪表盘
// ══════════════════════════════════════════════════════════════
interface OverviewDashboardProps {
  onNavigate: (target: NavTarget) => void;
  equipList: EquipRecord[];
  faultList: FaultRecord[];
  maintList: MaintPlan[];
  calibList: CalibRecord[];
  spareList: SparePartRecord[];
}

const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  onNavigate, equipList, faultList, maintList, calibList, spareList,
}) => {
  const equipStats = useMemo(() => ({
    total:       equipList.length,
    active:      equipList.filter(e => e.status === 'ACTIVE').length,
    idle:        equipList.filter(e => e.status === 'IDLE').length,
    fault:       equipList.filter(e => e.status === 'FAULT').length,
    maintenance: equipList.filter(e => e.status === 'MAINTENANCE').length,
    special:     equipList.filter(e => e.isSpecialProcess).length,
    oeeAvg:      (() => {
      const equipsWithOee = equipList.filter(e => e.currentOee != null);
      if (!equipsWithOee.length) return 0;
      return Math.round(equipsWithOee.reduce((s, e) => s + (e.currentOee || 0), 0) / equipsWithOee.length);
    })(),
  }), [equipList]);

  const faultStats = useMemo(() => ({
    open:     faultList.filter(f => !['CLOSED', 'CANCELLED'].includes(f.status)).length,
    critical: faultList.filter(f => f.faultLevel === 'CRITICAL' && f.status !== 'CLOSED').length,
    mttr:     (() => {
      const closed = faultList.filter(f => f.status === 'CLOSED' && f.downtime != null);
      if (!closed.length) return 0;
      return Math.round(closed.reduce((s, f) => s + (f.downtime || 0), 0) / closed.length);
    })(),
  }), [faultList]);

  const maintStats = useMemo(() => ({
    upcoming: maintList.filter(m => { const d = getDaysUntil(m.planDate); return m.status === 'PENDING' && d !== null && d <= 7 && d >= 0; }).length,
    overdue:  maintList.filter(m => m.status === 'OVERDUE' || (m.status === 'PENDING' && isOverdue(m.planDate))).length,
    doneRate: (() => {
      const total = maintList.length;
      const done  = maintList.filter(m => m.status === 'DONE').length;
      return total > 0 ? Math.round((done / total) * 100) : 0;
    })(),
  }), [maintList]);

  const calibStats = useMemo(() => ({
    expired:  calibList.filter(c => c.status === 'EXPIRED' || isOverdue(c.nextCalibDate)).length,
    expiring: calibList.filter(c => { const d = getDaysUntil(c.nextCalibDate); return c.status === 'VALID' && d !== null && d <= 30 && d >= 0; }).length,
  }), [calibList]);

  const spareStats = useMemo(() => ({
    outOfStock: spareList.filter(s => s.status === 'OUT_OF_STOCK').length,
    lowStock:   spareList.filter(s => s.status === 'LOW_STOCK').length,
  }), [spareList]);

  // KPI卡片定义 — 每张卡片绑定一个 navTarget
  type KpiCard = {
    title: string; value: string | number; unit?: string; color: string;
    icon: React.ReactNode; sub?: string; warning?: boolean;
    navTarget: NavTarget; tooltip: string;
  };
  const kpiCards: KpiCard[] = [
    {
      title: '设备总数', value: equipStats.total, unit: '台', color: '#1677FF',
      icon: <ToolOutlined />,
      sub: `运行${equipStats.active} | 空闲${equipStats.idle} | 故障${equipStats.fault}`,
      navTarget: { tab: 'archive' },
      tooltip: '点击查看设备档案',
    },
    {
      title: '综合OEE', value: equipStats.oeeAvg, unit: '%',
      color: equipStats.oeeAvg >= 80 ? '#52C41A' : '#FAAD14',
      icon: <DashboardOutlined />, sub: '目标 85%',
      navTarget: { tab: 'archive' },
      tooltip: '点击查看设备档案（OEE详情）',
    },
    {
      title: '开放故障', value: faultStats.open, unit: '起',
      color: faultStats.open > 0 ? '#FF4D4F' : '#52C41A',
      icon: <ExclamationCircleOutlined />,
      sub: `紧急${faultStats.critical}起 | MTTR ${faultStats.mttr}min`,
      warning: faultStats.critical > 0,
      navTarget: { tab: 'fault', faultFilter: 'open' as FaultCardFilter },
      tooltip: '点击查看未关闭故障',
    },
    {
      title: '维保完成率', value: maintStats.doneRate, unit: '%',
      color: maintStats.doneRate >= 80 ? '#52C41A' : '#FAAD14',
      icon: <CalendarOutlined />,
      sub: `逾期${maintStats.overdue}条 | 7天内${maintStats.upcoming}条`,
      warning: maintStats.overdue > 0,
      navTarget: { tab: 'maint', maintFilter: (maintStats.overdue > 0 ? 'overdue' : 'upcoming') as MaintCardFilter },
      tooltip: maintStats.overdue > 0 ? '点击查看逾期维保计划' : '点击查看7天内到期计划',
    },
    {
      title: '校准异常', value: calibStats.expired + calibStats.expiring, unit: '台',
      color: calibStats.expired > 0 ? '#FF4D4F' : calibStats.expiring > 0 ? '#FAAD14' : '#52C41A',
      icon: <SafetyCertificateOutlined />,
      sub: `已过期${calibStats.expired} | 30天内${calibStats.expiring}`,
      warning: calibStats.expired > 0,
      navTarget: { tab: 'calib', calibFilter: (calibStats.expired > 0 ? 'expired' : 'expiring') as CalibCardFilter },
      tooltip: calibStats.expired > 0 ? '点击查看已过期校准' : '点击查看30天内到期校准',
    },
    {
      title: '备件预警', value: spareStats.outOfStock + spareStats.lowStock, unit: '种',
      color: spareStats.outOfStock > 0 ? '#FF4D4F' : spareStats.lowStock > 0 ? '#FAAD14' : '#52C41A',
      icon: <InboxOutlined />,
      sub: `缺货${spareStats.outOfStock} | 偏低${spareStats.lowStock}`,
      warning: spareStats.outOfStock > 0,
      navTarget: { tab: 'spare', spareFilter: (spareStats.outOfStock > 0 ? 'OUT_OF_STOCK' : 'LOW_STOCK') as SpareCardFilter },
      tooltip: spareStats.outOfStock > 0 ? '点击查看缺货备件' : '点击查看库存偏低备件',
    },
  ];

  const statusBars: { key: ArchiveQuickFilter; label: string; value: number; total: number; color: string; tooltip: string }[] = [
    { key: 'ACTIVE',      label: '运行中', value: equipStats.active,      total: equipStats.total, color: '#52C41A', tooltip: '点击查看运行中设备' },
    { key: 'IDLE',        label: '空闲',   value: equipStats.idle,        total: equipStats.total, color: '#1677FF', tooltip: '点击查看空闲设备' },
    { key: 'MAINTENANCE', label: '维保中', value: equipStats.maintenance, total: equipStats.total, color: '#FAAD14', tooltip: '点击查看维保中设备' },
    { key: 'FAULT',       label: '故障',   value: equipStats.fault,       total: equipStats.total, color: '#FF4D4F', tooltip: '点击查看故障设备' },
  ];

  // 待处理事项（只显示 value > 0 的项）
  type PendingItem = { label: string; value: number; color: string; navTarget: NavTarget; tooltip: string };
  const pendingItems: PendingItem[] = ([
    { label: '开放故障单',     value: faultStats.open,        color: '#FF4D4F', navTarget: { tab: 'fault', faultFilter: 'open' as FaultCardFilter },         tooltip: '查看未关闭故障' },
    { label: '紧急故障',       value: faultStats.critical,    color: '#FF4D4F', navTarget: { tab: 'fault', faultFilter: 'critical' as FaultCardFilter },      tooltip: '查看紧急故障' },
    { label: '逾期维保',       value: maintStats.overdue,     color: '#FA8C16', navTarget: { tab: 'maint', maintFilter: 'overdue' as MaintCardFilter },       tooltip: '查看逾期维保计划' },
    { label: '7天内维保',      value: maintStats.upcoming,    color: '#FAAD14', navTarget: { tab: 'maint', maintFilter: 'upcoming' as MaintCardFilter },      tooltip: '查看7天内到期计划' },
    { label: '校准已过期',     value: calibStats.expired,     color: '#FF4D4F', navTarget: { tab: 'calib', calibFilter: 'expired' as CalibCardFilter },       tooltip: '查看已过期校准记录' },
    { label: '30天内校准到期', value: calibStats.expiring,    color: '#FAAD14', navTarget: { tab: 'calib', calibFilter: 'expiring' as CalibCardFilter },      tooltip: '查看30天内到期校准' },
    { label: '备件缺货',       value: spareStats.outOfStock,  color: '#FF4D4F', navTarget: { tab: 'spare', spareFilter: 'OUT_OF_STOCK' as SpareCardFilter },  tooltip: '查看缺货备件' },
    { label: '备件库存偏低',   value: spareStats.lowStock,    color: '#FAAD14', navTarget: { tab: 'spare', spareFilter: 'LOW_STOCK' as SpareCardFilter },     tooltip: '查看库存偏低备件' },
  ] as PendingItem[]).filter(i => i.value > 0);

  return (
    <div style={{ padding: '0 0 16px' }}>
      {/* KPI 卡片 — 全部可点击 */}
      <Row gutter={12} style={{ marginBottom: 16 }}>
        {kpiCards.map(c => (
          <Col key={c.title} flex="1" style={{ minWidth: 140 }}>
            <Tooltip title={<span>{c.tooltip} <ArrowRightOutlined /></span>} placement="bottom">
              <div
                onClick={() => onNavigate(c.navTarget)}
                style={{
                  background: c.warning ? '#fff1f0' : '#fff',
                  border: `1px solid ${c.warning ? '#ffccc7' : '#f0f0f0'}`,
                  borderRadius: 10, padding: '14px 16px',
                  boxShadow: '0 1px 6px rgba(0,0,0,.05)',
                  cursor: 'pointer',
                  transition: 'all 0.18s',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = `0 4px 16px ${c.color}30`;
                  (e.currentTarget as HTMLDivElement).style.borderColor = c.color + '80';
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 6px rgba(0,0,0,.05)';
                  (e.currentTarget as HTMLDivElement).style.borderColor = c.warning ? '#ffccc7' : '#f0f0f0';
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 10, background: c.color + '18',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: c.color, flexShrink: 0,
                  }}>
                    {c.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, color: '#888', marginBottom: 2 }}>{c.title}</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: c.color, lineHeight: 1.1 }}>
                      {c.value}<span style={{ fontSize: 13, fontWeight: 400, marginLeft: 2 }}>{c.unit}</span>
                      {c.warning && <WarningOutlined style={{ color: '#FF4D4F', fontSize: 13, marginLeft: 6 }} />}
                    </div>
                    {c.sub && (
                      <div style={{ fontSize: 11, color: '#aaa', marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {c.sub}
                      </div>
                    )}
                  </div>
                  <ArrowRightOutlined style={{ color: '#ccc', fontSize: 11, marginTop: 4, flexShrink: 0 }} />
                </div>
              </div>
            </Tooltip>
          </Col>
        ))}
      </Row>

      {/* 设备状态分布 + 待处理事项 */}
      <Row gutter={12}>
        <Col span={12}>
          <div style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: '#333' }}>
              <ToolOutlined style={{ color: '#1677FF', marginRight: 6 }} />设备状态分布
            </div>
            {statusBars.map(s => (
              <Tooltip key={s.key} title={<span>{s.tooltip} <ArrowRightOutlined /></span>} placement="right">
                <div
                  style={{ marginBottom: 10, cursor: 'pointer', borderRadius: 6, padding: '4px 6px', transition: 'background 0.15s' }}
                  onClick={() => onNavigate({ tab: 'archive', archiveFilter: s.key })}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = s.color + '12'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: '#555' }}>{s.label}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: s.color }}>{s.value} 台</span>
                      <ArrowRightOutlined style={{ color: '#ccc', fontSize: 10 }} />
                    </div>
                  </div>
                  <Progress percent={s.total > 0 ? Math.round((s.value / s.total) * 100) : 0}
                    strokeColor={s.color} showInfo={false} size="small" />
                </div>
              </Tooltip>
            ))}
          </div>
        </Col>
        <Col span={12}>
          <div style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: 10, padding: '14px 16px', height: '100%' }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: '#333' }}>
              <ExclamationCircleOutlined style={{ color: '#FF4D4F', marginRight: 6 }} />待处理事项
            </div>
            {pendingItems.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#52C41A', padding: '20px 0', fontSize: 13 }}>
                <CheckCircleOutlined style={{ fontSize: 20, marginBottom: 6, display: 'block' }} />
                当前无待处理事项
              </div>
            ) : (
              pendingItems.map((item, idx) => (
                <Tooltip key={idx} title={<span>{item.tooltip} <ArrowRightOutlined /></span>} placement="right">
                  <div
                    onClick={() => onNavigate(item.navTarget)}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      marginBottom: 7, cursor: 'pointer', borderRadius: 6, padding: '3px 6px',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = item.color + '10'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
                  >
                    <span style={{ fontSize: 12, color: '#555' }}>
                      <WarningOutlined style={{ color: item.color, marginRight: 5 }} />{item.label}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Tag color={item.color === '#FF4D4F' ? 'error' : 'warning'} style={{ fontWeight: 700, margin: 0 }}>
                        {item.value}
                      </Tag>
                      <ArrowRightOutlined style={{ color: '#ccc', fontSize: 10 }} />
                    </div>
                  </div>
                </Tooltip>
              ))
            )}
          </div>
        </Col>
      </Row>

      {/* 特殊工序设备列表 */}
      <div style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: 10, padding: '14px 16px', marginTop: 12 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: '#333' }}>
          <SafetyCertificateOutlined style={{ color: '#722ED1', marginRight: 6 }} />特殊工序设备（GMP管控）
        </div>
        <Row gutter={10}>
          {equipList.filter(e => e.isSpecialProcess).map(eq => (
            <Col key={eq.id} xs={24} sm={12} md={8} lg={6}>
              <Tooltip title="点击查看设备档案" placement="top">
                <div
                  onClick={() => onNavigate({ tab: 'archive' })}
                  style={{
                    border: `1px solid ${(EQUIP_STATUS_MAP[eq.status] ?? { color: '#888' }).color}40`,
                    background: (EQUIP_STATUS_MAP[eq.status] ?? { color: '#888' }).color + '08',
                    borderRadius: 8, padding: '10px 12px',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 10px rgba(0,0,0,.1)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: '#333' }}>{eq.equipCode}</span>
                    <Tag color={(EQUIP_STATUS_MAP[eq.status] ?? { color: 'default' }).color} style={{ fontSize: 10, padding: '0 5px' }}>
                      {(EQUIP_STATUS_MAP[eq.status] ?? { label: String(eq.status ?? '-') }).label}
                    </Tag>
                  </div>
                  <div style={{ fontSize: 12, color: '#555', marginBottom: 4 }}>{eq.equipName}</div>
                  <div style={{ fontSize: 11, color: '#888' }}>{eq.workshop}</div>
                  {eq.currentOee != null && (
                    <div style={{ marginTop: 6 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#aaa' }}>
                        <span>OEE</span>
                        <span style={{ color: eq.currentOee >= (eq.oeeTarget || 85) ? '#52C41A' : '#FAAD14', fontWeight: 600 }}>{eq.currentOee}%</span>
                      </div>
                      <Progress percent={eq.currentOee} showInfo={false} size="small"
                        strokeColor={eq.currentOee >= (eq.oeeTarget || 85) ? '#52C41A' : '#FAAD14'} />
                    </div>
                  )}
                  {isOverdue(eq.nextMaintDate) && (
                    <div style={{ marginTop: 4, fontSize: 10, color: '#FF4D4F', fontWeight: 600 }}>
                      <WarningOutlined style={{ marginRight: 3 }} />保养已逾期
                    </div>
                  )}
                </div>
              </Tooltip>
            </Col>
          ))}
        </Row>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════
// 主页组件
// ══════════════════════════════════════════════════════════════
const EquipmentManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');

  // API 数据 — 用于总览看板统计
  const [equipList, setEquipList] = useState<EquipRecord[]>(mockEquipRecords);
  const [faultList, setFaultList] = useState<FaultRecord[]>(mockFaultRecords);
  const [maintList, setMaintList] = useState<MaintPlan[]>(mockMaintPlans);
  const [calibList, setCalibList] = useState<CalibRecord[]>(mockCalibRecords);
  const [spareList, setSpareList] = useState<SparePartRecord[]>(mockSpareparts);

  // 存储各子页的初始过滤参数（从总览导航过来时设置）
  const [archiveInitFilter, setArchiveInitFilter] = useState<ArchiveQuickFilter | undefined>(undefined);
  const [faultInitFilter, setFaultInitFilter]   = useState<FaultCardFilter>(undefined);
  const [maintInitFilter, setMaintInitFilter]   = useState<MaintCardFilter>(undefined);
  const [calibInitFilter, setCalibInitFilter]   = useState<CalibCardFilter>(undefined);
  const [spareInitFilter, setSpareInitFilter]   = useState<SpareCardFilter>(undefined);

  // 加载总览统计数据
  const loadStats = useCallback(async () => {
    try {
      const [eqResp, ftResp, mpResp, cbResp, spResp] = await Promise.allSettled([
        getEquipmentList() as Promise<any>,
        getFaultList() as Promise<any>,
        getMaintPlanList() as Promise<any>,
        getCalibrationList() as Promise<any>,
        getSparePartList() as Promise<any>,
      ]);
      if (eqResp.status === 'fulfilled' && Array.isArray(eqResp.value?.data) && eqResp.value.data.length > 0) {
        const statusMap: Record<string, string> = { NORMAL: 'ACTIVE', MAINTAIN: 'MAINTENANCE', FAULT: 'FAULT' };
        setEquipList(eqResp.value.data.map((e: any) => ({
          id: String(e.id ?? ''), equipCode: e.code ?? '', equipName: e.name ?? '',
          category: e.category ?? 'MACHINE', model: e.model ?? '', brand: e.brand ?? '',
          workshop: e.workshopName ?? '', workCenter: e.workCenterName ?? '',
          location: e.location ?? '', purchaseDate: e.purchaseDate ?? '', warrantyDate: e.warrantyDate ?? '',
          lastMaintDate: e.lastMaintDate, nextMaintDate: e.nextMaintDate,
          status: statusMap[e.status ?? ''] ?? 'IDLE',
          remark: e.description ?? '', createdAt: e.createTime?.slice(0, 10) ?? '', updatedAt: e.updateTime?.slice(0, 10) ?? '',
        } as EquipRecord)));
      }
      if (ftResp.status === 'fulfilled' && Array.isArray(ftResp.value?.data) && ftResp.value.data.length > 0) {
        setFaultList(ftResp.value.data.map((f: any) => ({
          id: String(f.id ?? ''), faultNo: f.faultNo ?? '', equipId: f.equipId ?? '',
          equipCode: f.equipCode ?? '', equipName: f.equipName ?? '',
          faultTime: f.faultTime ?? '', reporter: f.reporter ?? '',
          faultDesc: f.faultDesc ?? '', faultLevel: f.faultLevel ?? 'LOW',
          status: f.status ?? 'REPORTED', downtime: f.downtime,
          createdAt: f.createTime ?? '', updatedAt: f.createTime ?? '',
        } as FaultRecord)));
      }
      if (mpResp.status === 'fulfilled' && Array.isArray(mpResp.value?.data) && mpResp.value.data.length > 0) {
        setMaintList(mpResp.value.data.map((m: any) => ({
          id: String(m.id ?? ''), planNo: m.planNo ?? '', equipId: m.equipId ?? '',
          equipCode: m.equipCode ?? '', equipName: m.equipName ?? '',
          maintType: m.maintType ?? 'MONTHLY', maintContent: m.maintContent ?? '',
          planDate: m.planDate ?? '', planDuration: m.planDuration ?? 0,
          assignee: m.assignee, status: m.status ?? 'PENDING',
          createdAt: m.createTime ?? '', updatedAt: m.createTime ?? '',
        } as MaintPlan)));
      }
      if (cbResp.status === 'fulfilled' && Array.isArray(cbResp.value?.data) && cbResp.value.data.length > 0) {
        setCalibList(cbResp.value.data.map((c: any) => ({
          id: String(c.id ?? ''), calibNo: c.calibNo ?? '', equipId: c.equipId ?? '',
          equipCode: c.equipCode ?? '', equipName: c.equipName ?? '',
          calibType: c.calibType ?? 'INTERNAL', calibDate: c.calibDate ?? '',
          nextCalibDate: c.nextCalibDate ?? '', calibCycle: c.calibCycle ?? 12,
          calibResult: c.calibResult ?? 'PASS', status: c.status ?? 'VALID',
          createdAt: c.createTime ?? '',
        } as CalibRecord)));
      }
      if (spResp.status === 'fulfilled' && Array.isArray(spResp.value?.data) && spResp.value.data.length > 0) {
        setSpareList(spResp.value.data.map((s: any) => ({
          id: String(s.id ?? ''), partCode: s.partCode ?? '', partName: s.partName ?? '',
          partSpec: s.partSpec ?? '', applicableEquips: [],
          unit: s.unit ?? '件', currentStock: s.currentStock ?? 0,
          safetyStock: s.safetyStock ?? 0, unitCost: s.unitCost ?? 0,
          status: s.status ?? 'NORMAL',
        } as SparePartRecord)));
      }
    } catch { /* 保留 mock */ }
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  // 总览导航回调
  const handleNavigate = useCallback((target: NavTarget) => {
    if (target.archiveFilter !== undefined) setArchiveInitFilter(target.archiveFilter);
    if (target.faultFilter !== undefined) setFaultInitFilter(target.faultFilter);
    if (target.maintFilter !== undefined) setMaintInitFilter(target.maintFilter);
    if (target.calibFilter !== undefined) setCalibInitFilter(target.calibFilter);
    if (target.spareFilter !== undefined) setSpareInitFilter(target.spareFilter);
    setActiveTab(target.tab);
  }, []);

  // 动态计算 badge 数量（使用 API 数据）
  const faultCount = useMemo(() =>
    faultList.filter(f => !['CLOSED', 'CANCELLED'].includes(f.status)).length, [faultList]);
  const maintOverdue = useMemo(() =>
    maintList.filter(m => m.status === 'OVERDUE' || (m.status === 'PENDING' && isOverdue(m.planDate))).length, [maintList]);
  const calibExpired = useMemo(() =>
    calibList.filter(c => c.status === 'EXPIRED' || isOverdue(c.nextCalibDate)).length, [calibList]);
  const spareAlert = useMemo(() =>
    spareList.filter(s => s.status === 'OUT_OF_STOCK').length, [spareList]);
  const usageAbnormal = useMemo(() =>
    mockUsageRecords.filter(r => r.abnormalFlag).length, []);

  const tabItems = [
    {
      key: 'overview',
      label: <span><DashboardOutlined />总览</span>,
      children: <OverviewDashboard
        onNavigate={handleNavigate}
        equipList={equipList}
        faultList={faultList}
        maintList={maintList}
        calibList={calibList}
        spareList={spareList}
      />,
    },
    {
      key: 'archive',
      label: <span><ToolOutlined />设备档案</span>,
      children: <EquipArchivePage key={`archive-${archiveInitFilter}`} initialQuickFilter={archiveInitFilter} />,
    },
    {
      key: 'fault',
      label: (
        <span>
          <ExclamationCircleOutlined />故障维修
          {faultCount > 0 && <Badge count={faultCount} size="small" style={{ marginLeft: 4, backgroundColor: '#FF4D4F' }} />}
        </span>
      ),
      children: <FaultRepairPage key={`fault-${faultInitFilter}`} initialCardFilter={faultInitFilter} />,
    },
    {
      key: 'maint',
      label: (
        <span>
          <CalendarOutlined />维保计划
          {maintOverdue > 0 && <Badge count={maintOverdue} size="small" style={{ marginLeft: 4, backgroundColor: '#FAAD14' }} />}
        </span>
      ),
      children: <MaintPlanPage key={`maint-${maintInitFilter}`} initialCardFilter={maintInitFilter} />,
    },
    {
      key: 'calib',
      label: (
        <span>
          <SafetyCertificateOutlined />计量校准
          {calibExpired > 0 && <Badge count={calibExpired} size="small" style={{ marginLeft: 4, backgroundColor: '#FF4D4F' }} />}
        </span>
      ),
      children: <CalibrationPage key={`calib-${calibInitFilter}`} initialCardFilter={calibInitFilter} />,
    },
    {
      key: 'spare',
      label: (
        <span>
          <InboxOutlined />备件管理
          {spareAlert > 0 && <Badge count={spareAlert} size="small" style={{ marginLeft: 4, backgroundColor: '#FF4D4F' }} />}
        </span>
      ),
      children: <SparePartsPage key={`spare-${spareInitFilter}`} initialCardFilter={spareInitFilter} />,
    },
    {
      key: 'usage',
      label: (
        <span>
          <FileTextOutlined />使用记录
          {usageAbnormal > 0 && <Badge count={usageAbnormal} size="small" style={{ marginLeft: 4, backgroundColor: '#FA8C16' }} />}
        </span>
      ),
      children: <EquipUsagePage />,
    },
  ];

  return (
    <div style={{ padding: '0 0 16px' }}>
      {/* 模块标题 */}
      <div style={{
        background: 'linear-gradient(135deg, #1677FF 0%, #4096FF 100%)',
        borderRadius: 10, padding: '14px 20px', marginBottom: 14,
        display: 'flex', alignItems: 'center', gap: 14,
        boxShadow: '0 2px 10px rgba(22,119,255,0.2)',
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: '#fff',
        }}>
          <ToolOutlined />
        </div>
        <div>
          <div style={{ color: '#fff', fontWeight: 800, fontSize: 18, letterSpacing: 1 }}>设备管理</div>
          <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>
            设备档案 · 故障维修 · 维保计划 · 计量校准 · 备件管理 | GMP合规设备全生命周期管理
          </div>
        </div>
        {/* 右侧告警Tag — 可点击跳转 */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          {faultCount > 0 && (
            <Tooltip title="点击查看未关闭故障">
              <Tag
                color="#FF4D4F"
                style={{ border: 'none', fontWeight: 700, cursor: 'pointer' }}
                onClick={() => handleNavigate({ tab: 'fault', faultFilter: 'open' })}
              >
                <ExclamationCircleOutlined /> {faultCount}起开放故障
              </Tag>
            </Tooltip>
          )}
          {maintOverdue > 0 && (
            <Tooltip title="点击查看逾期维保">
              <Tag
                color="#FAAD14"
                style={{ border: 'none', fontWeight: 700, cursor: 'pointer' }}
                onClick={() => handleNavigate({ tab: 'maint', maintFilter: 'overdue' })}
              >
                <WarningOutlined /> {maintOverdue}条保养逾期
              </Tag>
            </Tooltip>
          )}
          {calibExpired > 0 && (
            <Tooltip title="点击查看过期校准">
              <Tag
                color="#FF4D4F"
                style={{ border: 'none', fontWeight: 700, cursor: 'pointer' }}
                onClick={() => handleNavigate({ tab: 'calib', calibFilter: 'expired' })}
              >
                <SafetyCertificateOutlined /> {calibExpired}台校准过期
              </Tag>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Tab 子页 */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        size="middle"
        style={{ background: 'transparent' }}
        tabBarStyle={{ background: '#fff', borderRadius: '8px 8px 0 0', paddingLeft: 12, marginBottom: 0 }}
      />
    </div>
  );
};

export default EquipmentManagementPage;

/**
 * 增强版甘特图 — PRD §5.5
 * 功能：日/周/双周视图 · 时区色背景 · 工序前驱连线 · 冲突红框高亮
 *       右键菜单（查看BPR/发起偏差/锁定/释放）· 拖拽约束实时反馈
 *       冻结区竖线边界 · 今日线 · 图例 · Tooltip详情
 */
import React, { useMemo, useRef, useState, useCallback } from 'react';
import { Tooltip, Tag, Badge, Dropdown, Modal, Alert, message } from 'antd';
import {
  LockOutlined, WarningOutlined, ThunderboltOutlined,
  CloudOutlined, FileTextOutlined, BugOutlined,
  UnlockOutlined, StopOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { MenuProps } from 'antd';
import {
  ScheduleItem, Resource, ViewMode, TimeZone, Factory,
  SCHEDULE_STATUS_COLOR, SCHEDULE_STATUS_LABEL,
  TIME_ZONE_LABEL, TIME_ZONE_BG, CleanType, CLEAN_TYPE_LABEL,
} from '../../store/schedulingStore';

// ─────────────────────────────────────────────
// 常量
// ─────────────────────────────────────────────
const COL_W: Record<ViewMode, number> = { day: 64, week: 130, biweek: 68 };
const ROW_H        = 56;
const HEADER_H     = 52;
const RES_COL_W    = 192;
const BAR_RADIUS   = 5;
const BAR_MARGIN   = 7;

const TZ_BG_CSS: Record<TimeZone, string> = {
  HISTORY: '#f5f5f5',
  FROZEN:  '#fffbe6',
  ROLLING: '#f0f9ff',
  OUTLOOK: '#faf5ff',
};
const TZ_BORDER: Record<TimeZone, string> = {
  HISTORY: '#e8e8e8',
  FROZEN:  '#ffe58f',
  ROLLING: '#91d5ff',
  OUTLOOK: '#d3adf7',
};

// ─────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────
export interface GanttChartProps {
  items: ScheduleItem[];
  resources: Resource[];
  viewMode: ViewMode;
  startDate: dayjs.Dayjs;
  factoryFilter?: Factory | 'ALL';
  onItemClick?: (item: ScheduleItem) => void;
  onItemRightClick?: (item: ScheduleItem, action: string) => void;
  highlightConflicts?: boolean;
}

// ─────────────────────────────────────────────
// 工具
// ─────────────────────────────────────────────
function getTZ(date: dayjs.Dayjs, today: dayjs.Dayjs): TimeZone {
  const diff = date.startOf('day').diff(today.startOf('day'), 'day');
  if (diff < 0)   return 'HISTORY';
  if (diff <= 2)  return 'FROZEN';
  if (diff <= 14) return 'ROLLING';
  return 'OUTLOOK';
}

// ─────────────────────────────────────────────
// 甘特图主组件
// ─────────────────────────────────────────────
const GanttChart: React.FC<GanttChartProps> = ({
  items, resources, viewMode, startDate,
  factoryFilter = 'ALL', onItemClick, onItemRightClick,
  highlightConflicts = true,
}) => {
  const TODAY = dayjs('2026-06-14');
  const colW   = COL_W[viewMode];
  const scrollRef = useRef<HTMLDivElement>(null);
  const [dragItem, setDragItem] = useState<string|null>(null);
  const [contextItem, setContextItem] = useState<ScheduleItem|null>(null);
  const [conflictModal, setConflictModal] = useState<{item:ScheduleItem; violations:any[]}|null>(null);

  // ── 视图列数 ────────────────────────────────
  const { cols, totalDays } = useMemo(() => {
    if (viewMode === 'day')    return { cols: 24, totalDays: 1 };
    if (viewMode === 'week')   return { cols: 7,  totalDays: 7 };
    return                            { cols: 14, totalDays: 14 };
  }, [viewMode]);

  const totalW = cols * colW;

  // ── 资源过滤 ────────────────────────────────
  const filteredResources = useMemo(() =>
    resources.filter(r => factoryFilter === 'ALL' || r.factory === factoryFilter),
  [resources, factoryFilter]);

  // ── items按资源分组 ─────────────────────────
  const itemsByRes = useMemo(() => {
    const map: Record<string, ScheduleItem[]> = {};
    filteredResources.forEach(r => { map[r.id] = []; });
    items.forEach(i => { if (map[i.resourceId]) map[i.resourceId].push(i); });
    return map;
  }, [items, filteredResources]);

  // ── 位置计算 ────────────────────────────────
  const calcPos = useCallback((item: ScheduleItem) => {
    const s = dayjs(item.startTime);
    const e = dayjs(item.endTime);
    const vEnd = startDate.add(totalDays, 'day');
    if (e.isBefore(startDate) || s.isAfter(vEnd)) return null;

    let left: number, width: number;
    if (viewMode === 'day') {
      const sh = Math.max(0, s.diff(startDate, 'hour', true));
      const eh = Math.min(24, e.diff(startDate, 'hour', true));
      left  = sh * colW;
      width = Math.max(6, (eh - sh) * colW);
    } else {
      const sd = Math.max(0, s.diff(startDate, 'hour', true) / 24);
      const ed = Math.min(totalDays, e.diff(startDate, 'hour', true) / 24);
      left  = sd * colW;
      width = Math.max(8, (ed - sd) * colW);
    }
    return { left, width };
  }, [startDate, totalDays, viewMode, colW]);

  // ── 今日/冻结区边界线 ───────────────────────
  const todayLineLeft = useMemo(() => {
    if (viewMode === 'day') {
      const h = dayjs().diff(startDate, 'hour', true);
      return h >= 0 && h <= 24 ? h * colW : null;
    }
    const d = TODAY.diff(startDate, 'day', true);
    return d >= 0 && d <= totalDays ? d * colW : null;
  }, [viewMode, startDate, TODAY, totalDays, colW]);

  const frozenBoundaryLeft = useMemo(() => {
    // 冻结区右边界 = T+2 结束
    if (viewMode === 'day') return null;
    const frozenEnd = TODAY.add(3, 'day');
    const d = frozenEnd.diff(startDate, 'day', true);
    return d >= 0 && d <= totalDays ? d * colW : null;
  }, [viewMode, startDate, TODAY, totalDays, colW]);

  // ── 表头 ────────────────────────────────────
  const headerCols = useMemo(() => {
    if (viewMode === 'day') {
      return Array.from({ length: 24 }, (_, i) => ({
        label: `${String(i).padStart(2,'0')}:00`,
        date: startDate.hour(i),
        tz: getTZ(startDate, TODAY),
        isToday: startDate.isSame(TODAY, 'day'),
      }));
    }
    return Array.from({ length: cols }, (_, i) => {
      const d = startDate.add(i, 'day');
      const tz = getTZ(d, TODAY);
      return {
        label: viewMode === 'week' ? d.format('MM/DD ddd') : d.format('M/D'),
        date: d,
        tz,
        isToday: d.isSame(TODAY, 'day'),
      };
    });
  }, [viewMode, cols, startDate, TODAY]);

  // ── 右键菜单 ─────────────────────────────────
  const getContextMenu = (item: ScheduleItem): MenuProps['items'] => [
    { key:'bpr',       label:'📄 查看BPR',      icon:<FileTextOutlined />, disabled: item.status==='WAITING' },
    { key:'deviation', label:'🐛 发起偏差',      icon:<BugOutlined /> },
    { type:'divider' },
    { key:'lock',      label:'🔒 锁定资源',      icon:<LockOutlined />,   disabled: item.isLocked },
    { key:'unlock',    label:'🔓 释放资源',       icon:<UnlockOutlined />, disabled: !item.isLocked },
    { type:'divider' },
    { key:'conflict',  label:'⚠️ 查看约束详情',  icon:<WarningOutlined />,
      disabled: item.constraintViolations.length === 0,
      style: item.constraintViolations.length > 0 ? { color:'#f5222d' } : {},
    },
    { key:'force',     label:'🚫 强制推迟4小时', icon:<StopOutlined />,
      style:{ color:'#faad14' },
      disabled: item.isLocked,
    },
  ];

  const handleContextMenuClick = (key: string, item: ScheduleItem) => {
    if (key === 'bpr')       { message.info(`跳转BPR: ${item.woNo}`); onItemRightClick?.(item, 'bpr'); }
    else if (key === 'deviation') { message.warning(`发起偏差: ${item.woNo} - ${item.opName}`); onItemRightClick?.(item, 'deviation'); }
    else if (key === 'lock')  { message.success(`已锁定资源: ${item.resourceName}`); onItemRightClick?.(item, 'lock'); }
    else if (key === 'unlock'){ item.timeZone === 'FROZEN' ? message.warning('冻结区解锁需审批') : message.success(`已释放资源: ${item.resourceName}`); }
    else if (key === 'conflict'){ setConflictModal({ item, violations: item.constraintViolations }); }
    else if (key === 'force') { message.info(`已提交推迟申请: ${item.woNo}`); onItemRightClick?.(item, 'force'); }
  };

  // ── 甘特条样式 ───────────────────────────────
  const barBg = (item: ScheduleItem): string => {
    if (item.isCleaningBar) return item.color ?? '#FAAD14';
    return item.color ?? SCHEDULE_STATUS_COLOR[item.status] ?? '#1890FF';
  };

  const hasHardViolation = (item: ScheduleItem) =>
    item.constraintViolations.some(v => v.severity === 'HARD');

  // ── Tooltip ─────────────────────────────────
  const renderTooltip = (item: ScheduleItem) => (
    <div style={{ minWidth: 210, maxWidth: 290, fontSize: 12 }}>
      <div style={{ fontWeight:700, marginBottom:4, borderBottom:'1px solid rgba(255,255,255,0.15)', paddingBottom:4, fontSize:13 }}>
        {item.isCleaningBar
          ? `🧹 清场 — ${item.resourceName}`
          : `${item.opNo} ${item.opName}`}
      </div>
      {!item.isCleaningBar && <><div><b>工单：</b>{item.woNo}</div><div><b>产品：</b>{item.productName}</div></>}
      <div><b>资源：</b>{item.resourceName}</div>
      <div><b>洁净级：</b>{item.cleanRoomLevel}</div>
      <div><b>开始：</b>{dayjs(item.startTime).format('MM-DD HH:mm')}</div>
      <div><b>结束：</b>{dayjs(item.endTime).format('MM-DD HH:mm')}</div>
      <div><b>时长：</b>{item.durationMinutes}分钟
        {item.cleanType && item.cleanType !== 'NONE' && <span style={{color:'#ffe58f'}}> ({CLEAN_TYPE_LABEL[item.cleanType]})</span>}
      </div>
      <div><b>时区：</b><span style={{color:'#fadb14'}}>{TIME_ZONE_LABEL[item.timeZone]}</span></div>
      <div><b>状态：</b><span style={{color:SCHEDULE_STATUS_COLOR[item.status]}}>{SCHEDULE_STATUS_LABEL[item.status]}</span></div>
      <div><b>软约束分：</b>{item.softScore}</div>
      {item.isColdChain && <div style={{color:'#40a9ff'}}>❄ 冷链全程≤8℃</div>}
      {item.isLocked    && <div style={{color:'#faad14'}}>🔒 冻结锁定（需审批修改）</div>}
      {item.constraintViolations.length > 0 && (
        <div style={{marginTop:4, borderTop:'1px solid rgba(255,255,255,0.15)', paddingTop:4}}>
          {item.constraintViolations.map((v,i) => (
            <div key={i} style={{color: v.severity==='HARD'?'#ff7875':'#ffc53d'}}>
              {v.severity==='HARD'?'🔴':'🟡'} {v.message}
            </div>
          ))}
        </div>
      )}
      {item.notes && <div style={{marginTop:4,color:'#d9d9d9',fontSize:11}}>📝 {item.notes}</div>}
      <div style={{marginTop:6,color:'#aaa',fontSize:10}}>右键查看更多操作</div>
    </div>
  );

  // ── 渲染甘特条 ──────────────────────────────
  const renderBar = (item: ScheduleItem, rowIndex: number) => {
    const pos = calcPos(item);
    if (!pos) return null;

    const bg = barBg(item);
    const isConflict  = highlightConflicts && hasHardViolation(item);
    const isUrgent    = item.priority >= 5 && !item.isCleaningBar;
    const isCleaning  = item.isCleaningBar;
    const isCompleted = item.status === 'COMPLETED';
    const isDragging  = dragItem === item.id;

    return (
      <Dropdown
        key={item.id}
        menu={{
          items: getContextMenu(item),
          onClick: ({ key }) => handleContextMenuClick(key, item),
        }}
        trigger={['contextMenu']}
      >
        <Tooltip
          title={renderTooltip(item)}
          color="#1a1a2e"
          placement="topLeft"
          overlayInnerStyle={{ padding: '8px 10px' }}
          mouseEnterDelay={0.3}
        >
          <div
            onClick={() => onItemClick?.(item)}
            onMouseDown={() => !item.isLocked && setDragItem(item.id)}
            onMouseUp={() => setDragItem(null)}
            style={{
              position: 'absolute',
              left: pos.left + 2,
              width: pos.width - 4,
              top: BAR_MARGIN,
              height: ROW_H - BAR_MARGIN * 2,
              borderRadius: BAR_RADIUS,
              cursor: item.isLocked ? 'not-allowed' : 'pointer',
              background: isCleaning
                ? `repeating-linear-gradient(45deg, ${bg}, ${bg} 6px, rgba(255,255,255,0.15) 6px, rgba(255,255,255,0.15) 12px)`
                : bg,
              opacity: isCompleted ? 0.5 : isDragging ? 0.7 : 1,
              border: isConflict
                ? '2px solid #ff4d4f'
                : isUrgent
                  ? '2px solid #fff566'
                  : item.isLocked
                    ? '2px dashed rgba(255,255,255,0.5)'
                    : '1px solid rgba(0,0,0,0.1)',
              boxShadow: isConflict
                ? '0 0 8px rgba(255,77,79,0.8)'
                : isUrgent
                  ? '0 0 6px rgba(255,245,102,0.6)'
                  : '0 1px 4px rgba(0,0,0,0.15)',
              display: 'flex',
              alignItems: 'center',
              paddingLeft: 6,
              paddingRight: 4,
              overflow: 'hidden',
              transition: 'all 0.15s',
              zIndex: isUrgent ? 4 : isConflict ? 3 : 2,
              userSelect: 'none',
            }}
          >
            {/* 图标区 */}
            <span style={{ color:'#fff', fontSize:11, marginRight:3, flexShrink:0, display:'flex', gap:2 }}>
              {item.isColdChain && <CloudOutlined title="冷链≤8℃" />}
              {item.isLocked    && <LockOutlined title="冻结锁定" />}
              {isConflict       && <WarningOutlined style={{color:'#ffe58f'}} title="硬约束冲突" />}
              {isUrgent && !item.isCleaningBar && <ThunderboltOutlined style={{color:'#fff566'}} title="紧急/插单" />}
            </span>
            {/* 文字 */}
            {pos.width > 38 && (
              <span style={{
                color: '#fff',
                fontSize: pos.width > 90 ? 12 : 10,
                fontWeight: 600,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                lineHeight: 1.2,
                textShadow: '0 1px 2px rgba(0,0,0,0.3)',
              }}>
                {pos.width > 120
                  ? (isCleaning ? `🧹 ${item.opName}` : `${item.opNo} ${item.opName}`)
                  : (isCleaning ? '🧹' : item.opNo)
                }
              </span>
            )}
            {/* 冲突红角标 */}
            {isConflict && (
              <div style={{
                position:'absolute', top:2, right:2,
                width:8, height:8, borderRadius:'50%',
                background:'#ff4d4f', border:'1px solid #fff',
              }} />
            )}
          </div>
        </Tooltip>
      </Dropdown>
    );
  };

  // ── 工序前驱连线（简化版，SVG overlay） ─────
  const renderPredecessorLines = (resourceItems: ScheduleItem[], resourceIndex: number) => {
    const lines: React.ReactNode[] = [];
    resourceItems.forEach(item => {
      if (!item.predecessorId) return;
      const pred = items.find(i => i.id === item.predecessorId);
      if (!pred) return;
      const p1 = calcPos(pred);
      const p2 = calcPos(item);
      if (!p1 || !p2) return;
      // 同资源行连线
      const predRowIdx = filteredResources.findIndex(r => r.id === pred.resourceId);
      if (predRowIdx === resourceIndex) {
        const x1 = p1.left + p1.width;
        const x2 = p2.left;
        const y  = ROW_H / 2;
        if (x2 > x1 + 2) {
          lines.push(
            <svg key={`line-${item.id}`} style={{position:'absolute',left:0,top:0,width:'100%',height:'100%',pointerEvents:'none',overflow:'visible',zIndex:1}}>
              <defs>
                <marker id={`arrow-${item.id}`} markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L6,3 z" fill="#aaa" />
                </marker>
              </defs>
              <path
                d={`M ${x1} ${y} C ${(x1+x2)/2} ${y}, ${(x1+x2)/2} ${y}, ${x2} ${y}`}
                stroke="#bbb" strokeWidth="1.5" fill="none" strokeDasharray="4,3"
                markerEnd={`url(#arrow-${item.id})`}
              />
            </svg>
          );
        }
      }
    });
    return lines;
  };

  if (filteredResources.length === 0) {
    return (
      <div style={{padding:40, textAlign:'center', color:'#bbb', fontSize:14}}>
        暂无资源数据
      </div>
    );
  }

  return (
    <div style={{ border:'1px solid #e8e8e8', borderRadius:10, overflow:'hidden', background:'#fff', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
      <div style={{ display:'flex', overflowX:'auto', overflowY:'auto', maxHeight:620 }} ref={scrollRef}>

        {/* ── 左侧资源列（sticky） ── */}
        <div style={{
          flexShrink:0, width:RES_COL_W,
          borderRight:'2px solid #f0f0f0',
          position:'sticky', left:0, zIndex:20, background:'#fff',
        }}>
          {/* 表头 */}
          <div style={{
            height:HEADER_H, borderBottom:'2px solid #e8e8e8',
            display:'flex', alignItems:'center', paddingLeft:14,
            background:'#fafafa', fontWeight:700, fontSize:13, color:'#262626',
          }}>
            资源 / 工作中心
          </div>
          {/* 资源行 */}
          {filteredResources.map(r => {
            const statusDot: Record<string, string> = {
              AVAILABLE:'#52c41a', OCCUPIED:'#1890ff', CLEANING:'#faad14',
              MAINTENANCE:'#fa8c16', BREAKDOWN:'#f5222d', OFFLINE:'#8c8c8c',
            };
            return (
              <div key={r.id} style={{
                height:ROW_H, borderBottom:'1px solid #f0f0f0',
                display:'flex', alignItems:'center',
                padding:'0 8px 0 10px',
                background: r.factory === 'LS' ? '#f0fff4' : '#fff',
              }}>
                <div style={{ lineHeight:1.4, width:'100%', overflow:'hidden' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                    <span style={{ width:8, height:8, borderRadius:'50%', background: statusDot[r.status] ?? '#8c8c8c', flexShrink:0 }} />
                    <span style={{ fontSize:12, fontWeight:600, color:'#262626', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {r.name}
                    </span>
                  </div>
                  <div style={{ fontSize:11, color:'#8c8c8c', marginTop:2, display:'flex', gap:4, flexWrap:'wrap' }}>
                    <Tag color={r.factory==='NJ'?'blue':'green'} style={{fontSize:10, padding:'0 4px', lineHeight:'16px', margin:0}}>
                      {r.factory==='NJ'?'南京':'溧水'}
                    </Tag>
                    <span>{r.cleanRoomLevel}</span>
                    {r.utilizationPct !== undefined && (
                      <span style={{color: r.utilizationPct>85?'#f5222d': r.utilizationPct>70?'#faad14':'#52c41a'}}>
                        {r.utilizationPct}%
                      </span>
                    )}
                    {r.status === 'BREAKDOWN' && <Tag color="error" style={{fontSize:10,padding:'0 3px',lineHeight:'16px',margin:0}}>⚠故障</Tag>}
                    {r.status === 'CLEANING'  && <Tag color="warning" style={{fontSize:10,padding:'0 3px',lineHeight:'16px',margin:0}}>清场</Tag>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── 右侧甘特区 ── */}
        <div style={{ flex:1, position:'relative', minWidth:totalW }}>
          {/* 表头 */}
          <div style={{
            display:'flex', height:HEADER_H,
            borderBottom:'2px solid #e8e8e8',
            background:'#fafafa',
            position:'sticky', top:0, zIndex:10,
          }}>
            {headerCols.map((col, i) => (
              <div key={i} style={{
                width:colW, flexShrink:0,
                borderRight:'1px solid #e8e8e8',
                display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                fontSize: viewMode==='day' ? 11 : 12,
                fontWeight: col.isToday ? 800 : 500,
                color: col.isToday ? '#1890ff' : '#595959',
                background: col.isToday ? '#e6f7ff' : TZ_BG_CSS[col.tz],
                borderTop: col.tz!=='HISTORY' ? `3px solid ${TZ_BORDER[col.tz]}` : 'none',
                padding:'2px 0',
              }}>
                <span>{col.label}</span>
                {viewMode !== 'day' && (
                  <span style={{fontSize:9, color:'#bfbfbf', marginTop:1}}>
                    {col.tz==='FROZEN'?'冻' : col.tz==='ROLLING'?'滚' : col.tz==='OUTLOOK'?'展' : ''}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* 行内容 */}
          {filteredResources.map((r, rowIndex) => {
            const rowItems = itemsByRes[r.id] ?? [];
            return (
              <div key={r.id} style={{
                height:ROW_H, borderBottom:'1px solid #f0f0f0',
                position:'relative',
                background: r.factory==='LS' ? '#f6fff8' : '#fff',
                display:'flex',
              }}>
                {/* 列背景色 */}
                {headerCols.map((col, i) => (
                  <div key={i} style={{
                    width:colW, flexShrink:0, height:'100%',
                    borderRight:'1px solid #f5f5f5',
                    background: col.isToday ? 'rgba(24,144,255,0.04)' : TZ_BG_CSS[col.tz],
                  }} />
                ))}
                {/* 甘特条 + 连线 */}
                <div style={{position:'absolute',left:0,top:0,width:'100%',height:'100%'}}>
                  {renderPredecessorLines(rowItems, rowIndex)}
                  {rowItems.map(item => renderBar(item, rowIndex))}
                </div>
              </div>
            );
          })}

          {/* 今日竖线（蓝色实线） */}
          {todayLineLeft !== null && (
            <div style={{
              position:'absolute', top:0, left:todayLineLeft,
              width:2, height:'100%', background:'#1890ff',
              opacity:0.7, zIndex:6, pointerEvents:'none',
            }}>
              <div style={{
                position:'absolute', top:HEADER_H-18, left:-16,
                background:'#1890ff', color:'#fff',
                fontSize:10, padding:'1px 4px', borderRadius:3, whiteSpace:'nowrap',
              }}>今天</div>
            </div>
          )}

          {/* 冻结区右边界（橙色虚线） */}
          {frozenBoundaryLeft !== null && (
            <div style={{
              position:'absolute', top:0, left:frozenBoundaryLeft,
              width:2, height:'100%',
              background:'repeating-linear-gradient(to bottom, #faad14, #faad14 6px, transparent 6px, transparent 10px)',
              zIndex:5, pointerEvents:'none',
            }}>
              <div style={{
                position:'absolute', top:HEADER_H-18, left:4,
                background:'#faad14', color:'#fff',
                fontSize:10, padding:'1px 4px', borderRadius:3, whiteSpace:'nowrap',
              }}>冻结区↑</div>
            </div>
          )}
        </div>
      </div>

      {/* ── 图例 ── */}
      <div style={{
        padding:'8px 14px', borderTop:'1px solid #f0f0f0',
        background:'#fafafa', display:'flex', flexWrap:'wrap',
        gap:12, fontSize:11, color:'#595959', alignItems:'center',
      }}>
        <b>状态：</b>
        {([
          ['#52C41A','生产中'], ['#1890FF','待生产'], ['#FAAD14','清场中'],
          ['#722ED1','QC等待'], ['#F5222D','冲突/插单'], ['#8C8C8C','已完成'],
        ] as [string,string][]).map(([c,l]) => (
          <span key={l} style={{display:'flex',alignItems:'center',gap:4}}>
            <span style={{width:14,height:10,background:c,borderRadius:2,display:'inline-block'}}/>
            {l}
          </span>
        ))}
        <span style={{marginLeft:8, display:'flex', alignItems:'center', gap:6}}>
          <b>时区：</b>
          <span style={{background:'#fffbe6',border:'1px solid #ffe58f',padding:'0 4px',borderRadius:2}}>冻结区</span>
          <span style={{background:'#f0f9ff',border:'1px solid #91d5ff',padding:'0 4px',borderRadius:2}}>滚动区</span>
          <span style={{background:'#faf5ff',border:'1px solid #d3adf7',padding:'0 4px',borderRadius:2}}>展望区</span>
        </span>
        <span style={{marginLeft:8, display:'flex', alignItems:'center', gap:6}}>
          <span style={{borderBottom:'2px solid #1890ff', width:24, display:'inline-block'}}/>今日线
          <span style={{borderBottom:'2px dashed #faad14', width:24, display:'inline-block'}}/>冻结边界
        </span>
      </div>

      {/* 约束详情Modal */}
      <Modal
        title={<span>⚠️ 约束冲突详情 — {conflictModal?.item.woNo}</span>}
        open={!!conflictModal}
        onCancel={() => setConflictModal(null)}
        footer={null}
        width={480}
      >
        {conflictModal?.violations.map((v, i) => (
          <Alert
            key={i}
            type={v.severity === 'HARD' ? 'error' : 'warning'}
            showIcon
            message={v.message}
            description={v.suggestion && `建议：${v.suggestion}`}
            style={{ marginBottom: 8 }}
          />
        ))}
      </Modal>
    </div>
  );
};

export default GanttChart;

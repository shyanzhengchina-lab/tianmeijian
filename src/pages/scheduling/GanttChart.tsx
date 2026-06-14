/**
 * 浮动排程甘特图组件
 * PRD §4.1 PG-001 — 交互式甘特图
 * 支持：日/周/双周视图、资源行折叠、颜色编码、时区背景、Tooltip详情、冷链标识
 */
import React, { useMemo, useRef, useState, useCallback } from 'react';
import {
  Tooltip, Tag, Badge, Space, Typography, Empty,
} from 'antd';
import {
  CloudOutlined,
  LockOutlined,
  WarningOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  ScheduleItem,
  Resource,
  ViewMode,
  TimeZone,
  SCHEDULE_STATUS_COLOR,
  SCHEDULE_STATUS_LABEL,
  TIME_ZONE_COLOR,
  TIME_ZONE_LABEL,
  WO_STATUS_LABEL,
  Factory,
} from '../../store/schedulingStore';

const { Text } = Typography;

// ─────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────
interface GanttChartProps {
  items: ScheduleItem[];
  resources: Resource[];
  viewMode: ViewMode;
  startDate: dayjs.Dayjs;       // 视图起始日期
  factoryFilter?: Factory | 'ALL';
  onItemClick?: (item: ScheduleItem) => void;
}

// ─────────────────────────────────────────────
// 常量
// ─────────────────────────────────────────────
const CELL_WIDTH_DAY  = 60;   // 日视图：每小时px
const CELL_WIDTH_WEEK = 120;  // 周视图：每天px
const CELL_WIDTH_BI   = 64;   // 双周视图：每天px
const ROW_HEIGHT = 52;
const HEADER_HEIGHT = 56;
const RESOURCE_COL_WIDTH = 180;

const TIME_ZONE_BG: Record<TimeZone, string> = {
  HISTORY: '#fafafa',
  FROZEN:  '#fffbe6',
  ROLLING: '#e6f7ff',
  OUTLOOK: '#f9f0ff',
};

// ─────────────────────────────────────────────
// 辅助
// ─────────────────────────────────────────────
function getTimeZoneAtDate(date: dayjs.Dayjs, today: dayjs.Dayjs): TimeZone {
  const diff = date.startOf('day').diff(today.startOf('day'), 'day');
  if (diff < 0)  return 'HISTORY';
  if (diff <= 2) return 'FROZEN';
  if (diff <= 14) return 'ROLLING';
  return 'OUTLOOK';
}

function itemBarStyle(item: ScheduleItem): React.CSSProperties {
  const bg = item.color || SCHEDULE_STATUS_COLOR[item.status] || '#1890FF';
  return {
    backgroundColor: bg,
    opacity: item.status === 'COMPLETED' ? 0.55 : 1,
    borderLeft: item.isLocked ? '3px solid #262626' : `3px solid ${bg}`,
  };
}

// ─────────────────────────────────────────────
// 甘特图组件
// ─────────────────────────────────────────────
const GanttChart: React.FC<GanttChartProps> = ({
  items,
  resources,
  viewMode,
  startDate,
  factoryFilter = 'ALL',
  onItemClick,
}) => {
  const today = dayjs('2026-06-14');
  const scrollRef = useRef<HTMLDivElement>(null);

  // ── 视图配置 ─────────────────────────────────
  const { cols, colWidth, totalDays } = useMemo(() => {
    if (viewMode === 'day') {
      // 日视图：24列每列=1小时
      return { cols: 24, colWidth: CELL_WIDTH_DAY, totalDays: 1 };
    } else if (viewMode === 'week') {
      return { cols: 7, colWidth: CELL_WIDTH_WEEK, totalDays: 7 };
    } else {
      return { cols: 14, colWidth: CELL_WIDTH_BI, totalDays: 14 };
    }
  }, [viewMode]);

  const totalWidth = cols * colWidth;

  // ── 资源行（过滤工厂） ──────────────────────
  const filteredResources = useMemo(() =>
    resources.filter(r => factoryFilter === 'ALL' || r.factory === factoryFilter),
  [resources, factoryFilter]);

  // ── 按资源分组items ──────────────────────────
  const itemsByResource = useMemo(() => {
    const map: Record<string, ScheduleItem[]> = {};
    filteredResources.forEach(r => { map[r.id] = []; });
    items.forEach(item => {
      if (map[item.resourceId] !== undefined) {
        map[item.resourceId].push(item);
      }
    });
    return map;
  }, [items, filteredResources]);

  // ── 计算条目在视图中的位置 ──────────────────
  const calcBarPosition = useCallback((item: ScheduleItem) => {
    const start  = dayjs(item.startTime);
    const end    = dayjs(item.endTime);
    const viewStart = startDate;
    const viewEnd   = startDate.add(totalDays, 'day');

    if (end.isBefore(viewStart) || start.isAfter(viewEnd)) return null;

    let leftPx: number;
    let widthPx: number;

    if (viewMode === 'day') {
      // 日视图：按小时定位
      const startHour = Math.max(0, start.diff(viewStart, 'hour', true));
      const endHour   = Math.min(24, end.diff(viewStart, 'hour', true));
      leftPx  = startHour * CELL_WIDTH_DAY;
      widthPx = Math.max(4, (endHour - startHour) * CELL_WIDTH_DAY);
    } else {
      // 周/双周：按天定位
      const startDay = Math.max(0, start.diff(viewStart, 'hour', true) / 24);
      const endDay   = Math.min(totalDays, end.diff(viewStart, 'hour', true) / 24);
      leftPx  = startDay * colWidth;
      widthPx = Math.max(8, (endDay - startDay) * colWidth);
    }

    return { left: leftPx, width: widthPx };
  }, [startDate, totalDays, viewMode, colWidth]);

  // ── 表头列 ──────────────────────────────────
  const headerCols = useMemo(() => {
    if (viewMode === 'day') {
      return Array.from({ length: 24 }, (_, i) => ({
        label: `${String(i).padStart(2, '0')}:00`,
        date: startDate.hour(i),
        tz: getTimeZoneAtDate(startDate, today),
      }));
    }
    return Array.from({ length: cols }, (_, i) => {
      const d = startDate.add(i, 'day');
      return {
        label: viewMode === 'week' ? d.format('MM/DD ddd') : d.format('MM/DD'),
        date: d,
        tz: getTimeZoneAtDate(d, today),
      };
    });
  }, [viewMode, cols, startDate, today]);

  // ── 今日线位置 ───────────────────────────────
  const todayLineLeft = useMemo(() => {
    if (viewMode === 'day') {
      const nowHour = dayjs().diff(startDate, 'hour', true);
      return nowHour >= 0 && nowHour <= 24 ? nowHour * CELL_WIDTH_DAY : null;
    }
    const diffDays = today.diff(startDate, 'day', true);
    return diffDays >= 0 && diffDays <= totalDays ? diffDays * colWidth : null;
  }, [viewMode, startDate, today, totalDays, colWidth]);

  // ── Tooltip内容 ─────────────────────────────
  const renderTooltip = (item: ScheduleItem) => (
    <div style={{ minWidth: 200, maxWidth: 280, fontSize: 12 }}>
      <div style={{ fontWeight: 600, marginBottom: 4, borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: 4 }}>
        {item.opName} — {item.woNo}
      </div>
      <div><b>产品：</b>{item.productName}</div>
      <div><b>工序：</b>{item.opNo} {item.opName}</div>
      <div><b>资源：</b>{item.resourceName}</div>
      <div><b>洁净级：</b>{item.cleanRoomLevel}</div>
      <div><b>开始：</b>{dayjs(item.startTime).format('MM-DD HH:mm')}</div>
      <div><b>结束：</b>{dayjs(item.endTime).format('MM-DD HH:mm')}</div>
      <div><b>时长：</b>{item.durationMinutes}分钟</div>
      <div><b>时区：</b>{TIME_ZONE_LABEL[item.timeZone]}</div>
      <div><b>状态：</b>
        <span style={{ color: SCHEDULE_STATUS_COLOR[item.status] }}>
          {SCHEDULE_STATUS_LABEL[item.status]}
        </span>
      </div>
      <div><b>软约束得分：</b>{item.softScore}</div>
      {item.isColdChain && <div style={{ color: '#40a9ff' }}>❄ 冷链全程≤8℃</div>}
      {item.isLocked    && <div style={{ color: '#faad14' }}>🔒 冻结锁定</div>}
      {item.constraintViolations.length > 0 && (
        <div style={{ marginTop: 4, borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: 4 }}>
          {item.constraintViolations.map((v, i) => (
            <div key={i} style={{ color: v.severity === 'HARD' ? '#ff4d4f' : '#faad14' }}>
              ⚠ {v.message}
              {v.suggestion && <div style={{ color: '#d9d9d9', fontSize: 11 }}>→ {v.suggestion}</div>}
            </div>
          ))}
        </div>
      )}
      {item.notes && <div style={{ marginTop: 4, color: '#d9d9d9' }}>{item.notes}</div>}
    </div>
  );

  // ── 渲染甘特条 ──────────────────────────────
  const renderBar = (item: ScheduleItem) => {
    const pos = calcBarPosition(item);
    if (!pos) return null;

    const isUrgent = item.priority >= 5;
    const hasViolation = item.constraintViolations.length > 0;

    return (
      <Tooltip
        key={item.id}
        title={renderTooltip(item)}
        color="#1d1d1d"
        placement="topLeft"
        overlayInnerStyle={{ padding: 8 }}
      >
        <div
          onClick={() => onItemClick?.(item)}
          style={{
            position: 'absolute',
            left: pos.left,
            width: pos.width,
            top: 8,
            height: ROW_HEIGHT - 16,
            borderRadius: 4,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            paddingLeft: 6,
            paddingRight: 4,
            overflow: 'hidden',
            boxShadow: isUrgent ? '0 0 0 2px #ff4d4f' : hasViolation ? '0 0 0 2px #faad14' : '0 1px 3px rgba(0,0,0,0.18)',
            transition: 'opacity 0.15s',
            userSelect: 'none',
            zIndex: isUrgent ? 3 : 2,
            ...itemBarStyle(item),
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.82')}
          onMouseLeave={e => (e.currentTarget.style.opacity = item.status === 'COMPLETED' ? '0.55' : '1')}
        >
          {/* 图标 */}
          <span style={{ color: '#fff', fontSize: 11, marginRight: 3, flexShrink: 0 }}>
            {item.isColdChain && <CloudOutlined />}
            {item.isLocked    && <LockOutlined style={{ marginLeft: 2 }} />}
            {hasViolation     && <WarningOutlined style={{ marginLeft: 2, color: '#ffe58f' }} />}
            {isUrgent && item.notes?.includes('插单') && <ThunderboltOutlined style={{ marginLeft: 2, color: '#fff566' }} />}
          </span>
          {/* 文本 */}
          {pos.width > 45 && (
            <span style={{
              color: '#fff',
              fontSize: pos.width > 80 ? 12 : 10,
              fontWeight: 500,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              lineHeight: 1.2,
            }}>
              {pos.width > 100 ? `${item.opName}` : item.opNo}
            </span>
          )}
        </div>
      </Tooltip>
    );
  };

  if (filteredResources.length === 0) {
    return <Empty description="暂无资源数据" style={{ padding: 40 }} />;
  }

  return (
    <div style={{
      border: '1px solid #f0f0f0',
      borderRadius: 8,
      overflow: 'hidden',
      background: '#fff',
    }}>
      <div style={{ display: 'flex', overflowX: 'auto', overflowY: 'auto', maxHeight: 600 }} ref={scrollRef}>
        {/* ── 左侧资源列 ── */}
        <div style={{
          flexShrink: 0,
          width: RESOURCE_COL_WIDTH,
          borderRight: '2px solid #f0f0f0',
          zIndex: 10,
          background: '#fff',
          position: 'sticky',
          left: 0,
        }}>
          {/* 表头占位 */}
          <div style={{
            height: HEADER_HEIGHT,
            borderBottom: '2px solid #f0f0f0',
            display: 'flex',
            alignItems: 'center',
            paddingLeft: 12,
            background: '#fafafa',
            fontWeight: 600,
            fontSize: 13,
            color: '#262626',
          }}>
            资源 / 工作中心
          </div>
          {/* 资源行 */}
          {filteredResources.map(r => (
            <div key={r.id} style={{
              height: ROW_HEIGHT,
              borderBottom: '1px solid #f5f5f5',
              display: 'flex',
              alignItems: 'center',
              paddingLeft: 10,
              paddingRight: 8,
              background: r.factory === 'LS' ? '#f0faf0' : '#fff',
            }}>
              <div style={{ lineHeight: 1.3 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: '#262626', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160 }}>
                  {r.name}
                </div>
                <div style={{ fontSize: 11, color: '#8c8c8c', marginTop: 1 }}>
                  <Tag
                    color={r.factory === 'NJ' ? 'blue' : 'green'}
                    style={{ fontSize: 10, padding: '0 3px', lineHeight: '16px' }}
                  >
                    {r.factory === 'NJ' ? '南京' : '溧水'}
                  </Tag>
                  <span style={{ marginLeft: 2 }}>{r.cleanRoomLevel}</span>
                  {r.status === 'BREAKDOWN' && (
                    <Tag color="red" style={{ marginLeft: 4, fontSize: 10, padding: '0 3px', lineHeight: '16px' }}>故障</Tag>
                  )}
                  {r.status === 'CLEANING' && (
                    <Tag color="gold" style={{ marginLeft: 4, fontSize: 10, padding: '0 3px', lineHeight: '16px' }}>清场</Tag>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── 右侧甘特区 ── */}
        <div style={{ flex: 1, position: 'relative', minWidth: totalWidth }}>
          {/* 表头 */}
          <div style={{
            display: 'flex',
            height: HEADER_HEIGHT,
            borderBottom: '2px solid #f0f0f0',
            background: '#fafafa',
            position: 'sticky',
            top: 0,
            zIndex: 5,
          }}>
            {headerCols.map((col, i) => {
              const isToday = col.date.isSame(today, 'day');
              return (
                <div key={i} style={{
                  width: colWidth,
                  flexShrink: 0,
                  borderRight: '1px solid #f0f0f0',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: viewMode === 'day' ? 11 : 12,
                  fontWeight: isToday ? 700 : 500,
                  color: isToday ? '#1890FF' : '#595959',
                  background: isToday ? '#e6f7ff' : TIME_ZONE_BG[col.tz],
                  padding: '2px 0',
                }}>
                  <span>{col.label}</span>
                  {viewMode !== 'day' && (
                    <span style={{
                      fontSize: 9,
                      color: '#bfbfbf',
                      background: TIME_ZONE_BG[col.tz],
                      padding: '0 3px',
                      borderRadius: 2,
                      marginTop: 2,
                    }}>
                      {TIME_ZONE_LABEL[col.tz].split('(')[0]}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* 行背景 + 甘特条 */}
          {filteredResources.map(r => {
            const rowItems = itemsByResource[r.id] || [];
            return (
              <div key={r.id} style={{
                height: ROW_HEIGHT,
                borderBottom: '1px solid #f5f5f5',
                position: 'relative',
                display: 'flex',
                background: r.factory === 'LS' ? '#f6fff6' : '#fff',
              }}>
                {/* 列背景（时区色） */}
                {headerCols.map((col, i) => (
                  <div key={i} style={{
                    width: colWidth,
                    flexShrink: 0,
                    height: '100%',
                    borderRight: '1px solid #f5f5f5',
                    background: col.date.isSame(today, 'day')
                      ? 'rgba(24,144,255,0.04)'
                      : TIME_ZONE_BG[col.tz],
                  }} />
                ))}
                {/* 甘特条（绝对定位） */}
                <div style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' }}>
                  {rowItems.map(item => renderBar(item))}
                </div>
              </div>
            );
          })}

          {/* 今日竖线 */}
          {todayLineLeft !== null && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: todayLineLeft,
              width: 2,
              height: '100%',
              background: '#1890FF',
              opacity: 0.5,
              zIndex: 4,
              pointerEvents: 'none',
            }} />
          )}
        </div>
      </div>

      {/* 图例 */}
      <div style={{
        padding: '8px 12px',
        borderTop: '1px solid #f0f0f0',
        background: '#fafafa',
        display: 'flex',
        flexWrap: 'wrap',
        gap: 12,
        fontSize: 11,
        color: '#595959',
      }}>
        <span style={{ fontWeight: 600 }}>图例：</span>
        {([
          ['#52C41A', '生产中'],
          ['#1890FF', '待生产'],
          ['#FAAD14', '清场中'],
          ['#722ED1', 'QC等待'],
          ['#F5222D', '异常/插单'],
          ['#8C8C8C', '已完成'],
        ] as [string, string][]).map(([c, l]) => (
          <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 12, height: 12, background: c, borderRadius: 2, display: 'inline-block' }} />
            {l}
          </span>
        ))}
        <span style={{ marginLeft: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ background: '#fffbe6', border: '1px solid #faad14', padding: '0 4px', borderRadius: 2 }}>冻结区</span>
          <span style={{ background: '#e6f7ff', border: '1px solid #91d5ff', padding: '0 4px', borderRadius: 2 }}>滚动区</span>
          <span style={{ background: '#fafafa', border: '1px solid #d9d9d9', padding: '0 4px', borderRadius: 2 }}>历史区</span>
        </span>
      </div>
    </div>
  );
};

export default GanttChart;

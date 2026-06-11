import React, { useState, useMemo } from 'react';
import {
  Modal, Timeline, Tag, Button, Table, Tooltip, Empty, Divider, Space, Badge,
} from 'antd';
import {
  HistoryOutlined, DiffOutlined, CheckCircleOutlined, RiseOutlined,
  CopyOutlined, PlayCircleOutlined, StopOutlined, InboxOutlined,
  AuditOutlined, RollbackOutlined,
} from '@ant-design/icons';
import { RoutingMaster, VersionHistoryEntry, RM_STATUS_MAP, mockRoutingMasters } from './seriesData';

interface Props {
  open: boolean;
  routing: RoutingMaster | null;
  onCancel: () => void;
}

const OP_TYPE_CONFIG: Record<VersionHistoryEntry['operationType'], {
  label: string; color: string; icon: React.ReactNode;
}> = {
  CREATE:   { label: '创建',   color: '#1677FF', icon: <CheckCircleOutlined /> },
  UPGRADE:  { label: '升版',   color: '#722ED1', icon: <RiseOutlined /> },
  COPY:     { label: '复制',   color: '#FA8C16', icon: <CopyOutlined /> },
  AUDIT:    { label: '审核',   color: '#FA8C16', icon: <AuditOutlined /> },
  UNAUDIT:  { label: '反审核', color: '#8C8C8C', icon: <RollbackOutlined /> },
  ENABLE:   { label: '启用',   color: '#52C41A', icon: <PlayCircleOutlined /> },
  DISABLE:  { label: '停用',   color: '#FF4D4F', icon: <StopOutlined /> },
  ARCHIVE:  { label: '归档',   color: '#BFBFBF', icon: <InboxOutlined /> },
};

/** 版本对比差异行 */
interface DiffRow {
  key: string;
  dimension: string;
  versionA: string;
  versionB: string;
  diffType: 'same' | 'changed' | 'added' | 'removed';
}

function buildDiffRows(a: RoutingMaster, b: RoutingMaster): DiffRow[] {
  const rows: DiffRow[] = [
    {
      key: 'ops',
      dimension: '工序数量',
      versionA: `${a.opCount} 道`,
      versionB: `${b.opCount} 道`,
      diffType: a.opCount === b.opCount ? 'same' : 'changed',
    },
    {
      key: 'parallel',
      dimension: '并行组数',
      versionA: `${a.parallelGroupCount} 组`,
      versionB: `${b.parallelGroupCount} 组`,
      diffType: a.parallelGroupCount === b.parallelGroupCount ? 'same' : 'changed',
    },
    {
      key: 'time',
      dimension: '总工时(分)',
      versionA: `${a.totalTimeMin}`,
      versionB: `${b.totalTimeMin}`,
      diffType: a.totalTimeMin === b.totalTimeMin ? 'same' : 'changed',
    },
    {
      key: 'spec',
      dimension: '适用规格范围',
      versionA: a.specRangeExpr || '—',
      versionB: b.specRangeExpr || '—',
      diffType: a.specRangeExpr === b.specRangeExpr ? 'same' : 'changed',
    },
    {
      key: 'workshop',
      dimension: '适用车间',
      versionA: a.workshop || '—',
      versionB: b.workshop || '—',
      diffType: a.workshop === b.workshop ? 'same' : 'changed',
    },
    {
      key: 'line',
      dimension: '适用产品线',
      versionA: a.productLine || '—',
      versionB: b.productLine || '—',
      diffType: a.productLine === b.productLine ? 'same' : 'changed',
    },
    {
      key: 'status',
      dimension: '状态',
      versionA: (RM_STATUS_MAP[a.status] ?? { label: String(a.status ?? '-') }).label,
      versionB: (RM_STATUS_MAP[b.status] ?? { label: String(b.status ?? '-') }).label,
      diffType: a.status === b.status ? 'same' : 'changed',
    },
  ];
  return rows;
}

const VersionHistoryModal: React.FC<Props> = ({ open, routing, onCancel }) => {
  const [compareMode, setCompareMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // 获取同编码所有版本
  const allVersions = useMemo(() => {
    if (!routing) return [];
    return mockRoutingMasters
      .filter(r => r.routingCode === routing.routingCode)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [routing]);

  const selectedVersions = useMemo(() =>
    selectedIds.map(id => allVersions.find(v => v.id === id)).filter(Boolean) as RoutingMaster[],
    [selectedIds, allVersions]
  );

  const diffRows = useMemo(() => {
    if (selectedVersions.length !== 2) return [];
    return buildDiffRows(selectedVersions[0], selectedVersions[1]);
  }, [selectedVersions]);

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  };

  const historyItems = routing?.history ?? [];

  const renderDiffBadge = (row: DiffRow, side: 'A' | 'B') => {
    const val = side === 'A' ? row.versionA : row.versionB;
    if (row.diffType === 'same') return <span style={{ color: '#555' }}>{val}</span>;
    if (row.diffType === 'added') {
      return side === 'B'
        ? <span style={{ color: '#52C41A', fontWeight: 600 }}>{val} <Tag color="green" style={{ fontSize: 10 }}>新增</Tag></span>
        : <span style={{ color: '#ccc' }}>—</span>;
    }
    if (row.diffType === 'removed') {
      return side === 'A'
        ? <span style={{ color: '#FF4D4F', fontWeight: 600, textDecoration: 'line-through' }}>{val}</span>
        : <span style={{ color: '#ccc' }}>—</span>;
    }
    // changed
    return (
      <span style={{ color: side === 'B' ? '#FA8C16' : '#FF4D4F', fontWeight: 600 }}>
        {val}
      </span>
    );
  };

  if (!routing) return null;

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 3, height: 16, background: '#722ED1', borderRadius: 2, display: 'inline-block' }} />
          <HistoryOutlined style={{ color: '#722ED1' }} />
          工艺路径历史版本 — <span style={{ fontFamily: 'monospace', color: '#C8000A', marginLeft: 4 }}>{routing.routingCode}</span>
        </div>
      }
      open={open}
      onCancel={() => { setCompareMode(false); setSelectedIds([]); onCancel(); }}
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 12, color: '#888' }}>
            {selectedIds.length === 0 && <span>勾选两个版本后可对比差异</span>}
            {selectedIds.length === 1 && <span style={{ color: '#FA8C16' }}>再选一个版本</span>}
            {selectedIds.length === 2 && (
              <Button size="small" icon={<DiffOutlined />} type="primary"
                style={{ background: '#722ED1', borderColor: '#722ED1' }}
                onClick={() => setCompareMode(true)}>
                对比差异
              </Button>
            )}
          </div>
          <Button onClick={() => { setCompareMode(false); setSelectedIds([]); onCancel(); }}>关闭</Button>
        </div>
      }
      width={820}
      styles={{ body: { padding: '16px 24px', minHeight: 400 } }}
    >
      {!compareMode ? (
        <div style={{ display: 'flex', gap: 24 }}>
          {/* 左：版本时间轴 */}
          <div style={{ width: 300, flexShrink: 0, borderRight: '1px solid #f0f0f0', paddingRight: 20 }}>
            <div style={{ fontSize: 12, color: '#888', fontWeight: 500, marginBottom: 12 }}>
              版本列表（共 {allVersions.length} 个版本）
            </div>

            {allVersions.length === 0 ? (
              <Empty description="暂无版本记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <Timeline
                items={allVersions.map(v => {
                  const st = RM_STATUS_MAP[v.status];
                  const isSelected = selectedIds.includes(v.id);
                  const isCurrentRouting = v.id === routing.id;
                  return {
                    dot: (
                      <div
                        onClick={() => handleToggleSelect(v.id)}
                        style={{
                          width: 14, height: 14, borderRadius: '50%',
                          background: isSelected ? '#722ED1' : st.color,
                          border: `2px solid ${isSelected ? '#722ED1' : st.border}`,
                          cursor: 'pointer',
                          boxShadow: isSelected ? '0 0 0 3px #722ED120' : undefined,
                        }}
                      />
                    ),
                    children: (
                      <div
                        onClick={() => handleToggleSelect(v.id)}
                        style={{
                          cursor: 'pointer',
                          padding: '4px 8px',
                          borderRadius: 6,
                          background: isSelected ? '#f9f0ff' : isCurrentRouting ? '#e6f4ff' : 'transparent',
                          border: isSelected ? '1px solid #d3adf7' : isCurrentRouting ? '1px solid #91caff' : '1px solid transparent',
                          transition: 'all 0.2s',
                          marginBottom: 4,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontWeight: 700, fontSize: 14, color: '#333' }}>{v.version}</span>
                          <span style={{
                            fontSize: 10, padding: '1px 6px', borderRadius: 8,
                            color: st.color, background: st.bg, border: `1px solid ${st.border}`,
                          }}>
                            {st.label}
                          </span>
                          {v.isDefault && <Tag color="blue" style={{ fontSize: 10, padding: '0 4px' }}>默认</Tag>}
                          {isCurrentRouting && <Tag color="geekblue" style={{ fontSize: 10, padding: '0 4px' }}>当前</Tag>}
                        </div>
                        <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>
                          {v.effectiveDate ? `生效：${v.effectiveDate}` : `创建：${v.createdAt}`}
                        </div>
                        {v.upgradeReason && (
                          <div style={{ fontSize: 11, color: '#722ED1', marginTop: 1 }}>
                            原因：{v.upgradeReason}
                          </div>
                        )}
                        <div style={{ fontSize: 11, color: '#bbb', marginTop: 1 }}>
                          {v.opCount} 道工序 · {v.totalTimeMin} 分钟
                        </div>
                      </div>
                    ),
                    color: isSelected ? '#722ED1' : st.color,
                  };
                })}
              />
            )}
          </div>

          {/* 右：操作历史 */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: '#888', fontWeight: 500, marginBottom: 12 }}>
              操作历史（{historyItems.length} 条）
            </div>

            {historyItems.length === 0 ? (
              <Empty description="暂无操作历史" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <Timeline
                items={[...historyItems].reverse().map(h => {
                  const cfg = OP_TYPE_CONFIG[h.operationType];
                  return {
                    dot: (
                      <div style={{
                        width: 20, height: 20, borderRadius: '50%',
                        background: `${cfg.color}20`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, color: cfg.color,
                      }}>
                        {cfg.icon}
                      </div>
                    ),
                    color: cfg.color,
                    children: (
                      <div style={{ paddingBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{
                            fontSize: 11, padding: '1px 6px', borderRadius: 8,
                            color: cfg.color, background: `${cfg.color}15`,
                            border: `1px solid ${cfg.color}30`,
                          }}>{cfg.label}</span>
                          {h.fromVersion && h.toVersion && (
                            <span style={{ fontSize: 12, color: '#555' }}>
                              {h.fromVersion} → <strong>{h.toVersion}</strong>
                            </span>
                          )}
                          {!h.fromVersion && h.toVersion && (
                            <span style={{ fontSize: 12, color: '#555' }}>
                              版本 <strong>{h.toVersion}</strong>
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: '#aaa', marginTop: 3 }}>
                          {h.operationTime} &nbsp;·&nbsp; {h.operator}
                          {h.upgradeEcnNo && <> &nbsp;·&nbsp; ECN: <span style={{ color: '#1677FF' }}>{h.upgradeEcnNo}</span></>}
                        </div>
                        {h.remark && (
                          <div style={{ fontSize: 12, color: '#666', marginTop: 3 }}>{h.remark}</div>
                        )}
                      </div>
                    ),
                  };
                })}
              />
            )}
          </div>
        </div>
      ) : (
        /* 对比视图 */
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: '#333' }}>
              <DiffOutlined style={{ color: '#722ED1', marginRight: 6 }} />
              版本对比：
              <span style={{ color: '#722ED1' }}>{selectedVersions[0]?.version}</span>
              {' vs '}
              <span style={{ color: '#1677FF' }}>{selectedVersions[1]?.version}</span>
            </div>
            <Button size="small" onClick={() => setCompareMode(false)}>返回列表</Button>
          </div>

          <Table
            dataSource={diffRows}
            rowKey="key"
            pagination={false}
            size="small"
            columns={[
              {
                title: '对比维度',
                dataIndex: 'dimension',
                width: 120,
                render: (v: string) => <span style={{ fontWeight: 500, color: '#555' }}>{v}</span>,
              },
              {
                title: (
                  <span>
                    <Tag color="purple" style={{ marginRight: 4 }}>{selectedVersions[0]?.version}</Tag>
                    {RM_STATUS_MAP[selectedVersions[0]?.status ?? 'DRAFT']?.label}
                  </span>
                ),
                dataIndex: 'versionA',
                render: (_: any, row: DiffRow) => renderDiffBadge(row, 'A'),
              },
              {
                title: (
                  <span>
                    <Tag color="blue" style={{ marginRight: 4 }}>{selectedVersions[1]?.version}</Tag>
                    {RM_STATUS_MAP[selectedVersions[1]?.status ?? 'DRAFT']?.label}
                  </span>
                ),
                dataIndex: 'versionB',
                render: (_: any, row: DiffRow) => renderDiffBadge(row, 'B'),
              },
              {
                title: '差异标记',
                width: 100,
                render: (_: any, row: DiffRow) => {
                  if (row.diffType === 'same') return <span style={{ color: '#bbb' }}>—</span>;
                  const map = {
                    changed: <Tag color="orange" style={{ fontSize: 10 }}>已变更</Tag>,
                    added:   <Tag color="green"  style={{ fontSize: 10 }}>新增</Tag>,
                    removed: <Tag color="red"    style={{ fontSize: 10 }}>移除</Tag>,
                  } as Record<string, React.ReactNode>;
                  return map[row.diffType] ?? null;
                },
              },
            ]}
            rowClassName={(row: DiffRow) =>
              row.diffType !== 'same' ? 'diff-row-changed' : ''
            }
          />

          <div style={{ marginTop: 16, padding: '10px 14px', background: '#fafafa', borderRadius: 6, fontSize: 12, color: '#888' }}>
            <Space split={<Divider type="vertical" />}>
              <span><Badge color="orange" /> 已变更：字段值发生修改</span>
              <span><Badge color="green" /> 新增：新版本中增加</span>
              <span><Badge color="red" /> 移除：新版本中删除</span>
            </Space>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default VersionHistoryModal;

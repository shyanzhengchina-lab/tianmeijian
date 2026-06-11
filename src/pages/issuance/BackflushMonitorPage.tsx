/**
 * BackflushMonitorPage.tsx — 倒扣领料监控
 * 基于《BOM工序领料PRD.docx》实现
 * 功能：倒扣执行日志 / 异常预警 / 线边仓库存 / 超耗分析
 */
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Table, Tag, Button, Space, Input, Select, Modal, Form,
  Descriptions, Badge, message, Drawer, Tooltip,
  Row, Col, Statistic, Card, Tabs, Progress, Alert, InputNumber,
  Divider, Typography,
} from 'antd';
import {
  SearchOutlined, ReloadOutlined, EyeOutlined,
  WarningOutlined, CheckCircleOutlined, CloseCircleOutlined,
  ThunderboltOutlined, InboxOutlined, RiseOutlined,
  ExclamationCircleOutlined, SyncOutlined, ToolOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import {
  BackflushLog, WipInventory,
  loadBackflushLogs, saveBackflushLogs,
  loadWipInventory,
  BF_STATUS_LABEL, BF_STATUS_COLOR, BackflushStatus,
  execBackflush,
} from '../../store/issuanceStore';
import { getBackflushLogList } from '../../api/backflushLogs';
import type { BackflushLogRecord } from '../../api/backflushLogs';

const { Option } = Select;
const { Text, Title } = Typography;
const { TabPane } = Tabs;

// ── 安全库存阈值（演示用，实际应从物料档案读取） ──────────────────
const SAFETY_STOCK: Record<string, number> = {
  'RM-NTi-W1':    500,
  'RM-NTi-W2':    300,
  'RM-NTi-W3':    200,
  'PKG-FOIL-35':  1000,
  'PKG-LABEL-A':  2000,
  'LUB-COOL-01':  50,
};

// ── 仓库中文名映射 ────────────────────────────────────────────────
const WH_NAME: Record<string, string> = {
  'WIP-涂层':  'WIP-涂层线边仓',
  'WIP-磨削':  'WIP-磨削线边仓',
  'WIP-切割':  'WIP-切割线边仓',
  'WIP-包装':  'WIP-包装线边仓',
  'WH-RAW':    '原材料仓',
  'WH-FG':     '成品仓',
};

// ── 状态 Tag ─────────────────────────────────────────────────────
const BfStatusTag: React.FC<{ status: BackflushStatus }> = ({ status }) => (
  <Tag color={BF_STATUS_COLOR[status]}>{BF_STATUS_LABEL[status]}</Tag>
);

// ── 触发点中文 ────────────────────────────────────────────────────
const TRIGGER_LABEL: Record<string, string> = {
  OPERATION_REPORT: '工序报工',
  COMPLETE_IN: '完工入库',
};

// ── 统计卡 ────────────────────────────────────────────────────────
const StatCard: React.FC<{
  title: string; value: number | string;
  color?: string; icon: React.ReactNode; sub?: string;
}> = ({ title, value, color = '#1677ff', icon, sub }) => (
  <Card size="small" style={{ borderTop: `3px solid ${color}` }}>
    <Row align="middle" gutter={12}>
      <Col>
        <div style={{ fontSize: 28, color }}>{icon}</div>
      </Col>
      <Col flex={1}>
        <div style={{ fontSize: 24, fontWeight: 700, color }}>{value}</div>
        <div style={{ fontSize: 12, color: '#888' }}>{title}</div>
        {sub && <div style={{ fontSize: 11, color: '#aaa' }}>{sub}</div>}
      </Col>
    </Row>
  </Card>
);

// ── 主组件 ────────────────────────────────────────────────────────
const BackflushMonitorPage: React.FC = () => {
  const [logs, setLogs] = useState<BackflushLog[]>(loadBackflushLogs);

  const loadFromApi = useCallback(async () => {
    try {
      const resp = await getBackflushLogList() as any;
      const apiList: BackflushLogRecord[] = resp?.data ?? [];
      if (apiList.length > 0) {
        const newItems = apiList.map((item, idx) => ({
          id: String(item.id ?? `api-bf-${idx}`),
          woNo: item.woNo ?? '',
          operationSeq: idx + 1,
          operationCode: item.operationCode ?? '',
          triggerPoint: 'OPERATION_REPORT' as const,
          itemCode: item.materialCode ?? '',
          itemName: item.materialName ?? '',
          bomChildQty: Number(item.bomQty ?? 0),
          baseBatchQty: Number(item.bomQty ?? 0),
          reportQty: Number(item.actualQty ?? 0),
          lossRate: 0,
          stdQty: Number(item.bomQty ?? 0),
          actualQty: Number(item.actualQty ?? 0),
          batchNo: item.batchNo ?? undefined,
          wipWarehouse: 'WIP-001',
          status: (item.status === 'SUCCESS' ? 'SUCCESS'
                 : item.status === 'FAILED' ? 'FAILED'
                 : item.status === 'EXCEPTION' ? 'OVER_CONSUME'
                 : 'SUCCESS') as BackflushStatus,
          errorMsg: item.exceptionDesc ?? undefined,
          createdAt: item.execTime ?? item.createTime ?? '',
        } as unknown as BackflushLog));
        setLogs(newItems);  // API-first REPLACE
      }
    } catch { /* 后端不可用时保留 localStorage */ }
  }, []);

  useEffect(() => { loadFromApi(); }, [loadFromApi]);
  const [wipInventory] = useState<WipInventory[]>(loadWipInventory);
  const [activeTab, setActiveTab] = useState('logs');
  const [searchWo, setSearchWo] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterTrigger, setFilterTrigger] = useState<string>('');
  const [detailLog, setDetailLog] = useState<BackflushLog | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [supplementVisible, setSupplementVisible] = useState(false);
  const [supplementLog, setSupplementLog] = useState<BackflushLog | null>(null);
  const [supplementForm] = Form.useForm();

  // ── 过滤 ────────────────────────────────────────────────────────
  const filteredLogs = useMemo(() => {
    return logs.filter(l => {
      if (searchWo && !l.woNo.toLowerCase().includes(searchWo.toLowerCase()) &&
          !l.itemCode.toLowerCase().includes(searchWo.toLowerCase()) &&
          !l.itemName.includes(searchWo)) return false;
      if (filterStatus && l.status !== filterStatus) return false;
      if (filterTrigger && l.triggerPoint !== filterTrigger) return false;
      return true;
    });
  }, [logs, searchWo, filterStatus, filterTrigger]);

  // ── 预警库存（低于安全库存） ────────────────────────────────────
  const lowStockItems = useMemo(() => {
    return wipInventory.filter(inv => {
      const safety = SAFETY_STOCK[inv.itemCode] ?? 0;
      return safety > 0 && inv.availableQty < safety;
    });
  }, [wipInventory]);

  // ── 统计 ────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const today = new Date().toLocaleDateString('zh-CN');
    const todayLogs = logs.filter(l => l.createdAt.startsWith(today.replace(/\//g, '/')));
    return {
      total: logs.length,
      todayTotal: todayLogs.length,
      successCount: logs.filter(l => l.status === 'SUCCESS').length,
      insufficientCount: logs.filter(l => l.status === 'INSUFFICIENT').length,
      overConsumeCount: logs.filter(l => l.status === 'OVER_CONSUME').length,
      lowStockCount: lowStockItems.length,
    };
  }, [logs, lowStockItems]);

  // ── 异常日志 ────────────────────────────────────────────────────
  const exceptionLogs = useMemo(() =>
    logs.filter(l => l.status === 'INSUFFICIENT' || l.status === 'OVER_CONSUME' || l.status === 'FAILED'),
    [logs]
  );

  // ── 补扣操作 ────────────────────────────────────────────────────
  const handleSupplement = (log: BackflushLog) => {
    setSupplementLog(log);
    supplementForm.setFieldsValue({
      qty: Math.max(0, log.stdQty - log.actualQty),
      reason: '',
      approvedBy: '',
    });
    setSupplementVisible(true);
  };

  const handleSupplementConfirm = () => {
    supplementForm.validateFields().then(values => {
      if (!supplementLog) return;
      const newLog: BackflushLog = {
        ...supplementLog,
        id: `BF-SUP-${Date.now()}`,
        status: 'SUPPLEMENT',
        actualQty: values.qty,
        stdQty: values.qty,
        errorMsg: undefined,
        createdAt: new Date().toLocaleString('zh-CN'),
      };
      const updated = [newLog, ...logs];
      setLogs(updated);
      saveBackflushLogs(updated);
      // 同时将原始记录标记已处理
      message.success(`补扣申请已提交，补扣数量：${values.qty}`);
      setSupplementVisible(false);
      supplementForm.resetFields();
    }).catch((err: any) => { if (err?.errorFields) return; });
  };

  // ── 日志列 ─────────────────────────────────────────────────────
  const logColumns: ColumnsType<BackflushLog> = [
    {
      title: '工单号', dataIndex: 'woNo', width: 130,
      render: v => <Text code style={{ fontSize: 12 }}>{v}</Text>,
    },
    {
      title: '工序', width: 100,
      render: (_, r) => <span>{r.operationSeq} · {r.operationCode}</span>,
    },
    {
      title: '触发', dataIndex: 'triggerPoint', width: 90,
      render: v => <Tag color={v === 'OPERATION_REPORT' ? 'blue' : 'purple'}>{TRIGGER_LABEL[v]}</Tag>,
    },
    {
      title: '物料', width: 200,
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 500 }}>{r.itemName}</div>
          <div style={{ fontSize: 11, color: '#888' }}>{r.itemCode}</div>
        </div>
      ),
    },
    { title: '线边仓', dataIndex: 'wipWarehouse', width: 110, render: v => WH_NAME[v] ?? v },
    {
      title: '标准量', dataIndex: 'stdQty', width: 80, align: 'right',
      render: v => v?.toFixed(3),
    },
    {
      title: '实扣量', dataIndex: 'actualQty', width: 80, align: 'right',
      render: (v, r) => {
        const over = r.stdQty > 0 && v > r.stdQty * 1.1;
        return <span style={{ color: over ? '#f5222d' : v < r.stdQty ? '#faad14' : 'inherit' }}>{v?.toFixed(3)}</span>;
      },
    },
    {
      title: '偏差%', width: 75, align: 'right',
      render: (_, r) => {
        if (!r.stdQty) return '-';
        const pct = ((r.actualQty - r.stdQty) / r.stdQty * 100).toFixed(1);
        const color = parseFloat(pct) > 10 ? '#f5222d' : parseFloat(pct) < -5 ? '#faad14' : '#52c41a';
        return <span style={{ color }}>{pct}%</span>;
      },
    },
    {
      title: '状态', dataIndex: 'status', width: 100,
      render: v => <BfStatusTag status={v} />,
      filters: Object.entries(BF_STATUS_LABEL).map(([k, v]) => ({ text: v, value: k })),
      onFilter: (v, r) => r.status === v,
    },
    {
      title: '时间', dataIndex: 'createdAt', width: 130,
      render: v => <span style={{ fontSize: 11, color: '#888' }}>{v}</span>,
    },
    {
      title: '操作', width: 120, fixed: 'right',
      render: (_, r) => (
        <Space size={4}>
          <Button size="small" icon={<EyeOutlined />} onClick={() => { setDetailLog(r); setDetailVisible(true); }}>详情</Button>
          {(r.status === 'INSUFFICIENT') && (
            <Button size="small" type="primary" icon={<ToolOutlined />} danger onClick={() => handleSupplement(r)}>补扣</Button>
          )}
        </Space>
      ),
    },
  ];

  // ── 线边仓库存列 ────────────────────────────────────────────────
  const wipColumns: ColumnsType<WipInventory> = [
    {
      title: '仓库', dataIndex: 'warehouseCode', width: 130,
      render: v => WH_NAME[v] ?? v,
    },
    { title: '物料编码', dataIndex: 'itemCode', width: 130 },
    { title: '物料名称', dataIndex: 'itemName', width: 150 },
    { title: '批次', dataIndex: 'batchNo', width: 120 },
    { title: '入库日期', dataIndex: 'inboundDate', width: 100 },
    { title: '效期', dataIndex: 'expiryDate', width: 100, render: v => v ?? '-' },
    {
      title: '可用数量', dataIndex: 'availableQty', width: 100, align: 'right',
      render: (v, r) => {
        const safety = SAFETY_STOCK[r.itemCode] ?? 0;
        const isLow = safety > 0 && v < safety;
        return <span style={{ color: isLow ? '#f5222d' : 'inherit', fontWeight: isLow ? 700 : 400 }}>{v}</span>;
      },
      sorter: (a, b) => a.availableQty - b.availableQty,
    },
    {
      title: '总数量', dataIndex: 'qty', width: 90, align: 'right',
    },
    {
      title: '库存健康', width: 130,
      render: (_, r) => {
        const safety = SAFETY_STOCK[r.itemCode] ?? 0;
        if (!safety) return <Tag color="default">无安全库存设置</Tag>;
        const pct = Math.min(100, Math.round((r.availableQty / safety) * 100));
        const color = pct < 50 ? '#f5222d' : pct < 80 ? '#faad14' : '#52c41a';
        return (
          <div>
            <Progress percent={pct} size="small" strokeColor={color} showInfo={false} />
            <div style={{ fontSize: 10, color: '#888' }}>{r.availableQty}/{safety}</div>
          </div>
        );
      },
    },
    { title: '更新时间', dataIndex: 'updatedAt', width: 130 },
  ];

  // ── 异常列 ──────────────────────────────────────────────────────
  const exceptionColumns: ColumnsType<BackflushLog> = [
    {
      title: '工单号', dataIndex: 'woNo', width: 130,
      render: v => <Text code style={{ fontSize: 12 }}>{v}</Text>,
    },
    {
      title: '物料', width: 200,
      render: (_, r) => <div><b>{r.itemName}</b><br /><small style={{ color: '#888' }}>{r.itemCode}</small></div>,
    },
    { title: '线边仓', dataIndex: 'wipWarehouse', width: 110, render: v => WH_NAME[v] ?? v },
    {
      title: '异常类型', dataIndex: 'status', width: 100,
      render: v => <BfStatusTag status={v} />,
    },
    {
      title: '缺口', width: 90, align: 'right',
      render: (_, r) => {
        const gap = r.stdQty - r.actualQty;
        return gap > 0 ? <span style={{ color: '#f5222d' }}>-{gap.toFixed(3)}</span> : '-';
      },
    },
    {
      title: '异常描述', dataIndex: 'errorMsg', ellipsis: true,
      render: v => v ?? '-',
    },
    { title: '发生时间', dataIndex: 'createdAt', width: 130 },
    {
      title: '操作', width: 100, fixed: 'right',
      render: (_, r) => (
        <Space size={4}>
          <Button size="small" icon={<EyeOutlined />} onClick={() => { setDetailLog(r); setDetailVisible(true); }}>详情</Button>
          {r.status === 'INSUFFICIENT' && (
            <Button size="small" type="primary" danger icon={<ToolOutlined />} onClick={() => handleSupplement(r)}>补扣</Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '0 4px' }}>
      {/* 统计卡片 */}
      <Row gutter={12} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={8} md={4}>
          <StatCard title="倒扣总次数" value={stats.total} icon={<ThunderboltOutlined />} color="#1677ff" />
        </Col>
        <Col xs={12} sm={8} md={4}>
          <StatCard title="成功次数" value={stats.successCount} icon={<CheckCircleOutlined />} color="#52c41a"
            sub={`${stats.total ? Math.round(stats.successCount / stats.total * 100) : 0}% 成功率`} />
        </Col>
        <Col xs={12} sm={8} md={4}>
          <StatCard title="库存不足" value={stats.insufficientCount} icon={<ExclamationCircleOutlined />} color="#f5222d" />
        </Col>
        <Col xs={12} sm={8} md={4}>
          <StatCard title="超耗次数" value={stats.overConsumeCount} icon={<RiseOutlined />} color="#faad14" />
        </Col>
        <Col xs={12} sm={8} md={4}>
          <StatCard title="库存预警" value={stats.lowStockCount} icon={<WarningOutlined />} color="#ff4d4f"
            sub="低于安全库存" />
        </Col>
        <Col xs={12} sm={8} md={4}>
          <StatCard title="未处理异常" value={exceptionLogs.length} icon={<CloseCircleOutlined />} color="#722ed1" />
        </Col>
      </Row>

      {/* 异常告警横幅 */}
      {exceptionLogs.length > 0 && (
        <Alert
          type="error"
          showIcon
          icon={<WarningOutlined />}
          message={
            <span>
              存在 <strong>{exceptionLogs.length}</strong> 条倒扣异常未处理（库存不足/超耗），请及时处理！
            </span>
          }
          style={{ marginBottom: 14 }}
          action={
            <Button size="small" onClick={() => setActiveTab('exceptions')}>查看异常</Button>
          }
        />
      )}

      {/* Tab */}
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        {/* 倒扣日志 */}
        <TabPane
          tab={<span><ThunderboltOutlined />倒扣执行日志 <Tag>{logs.length}</Tag></span>}
          key="logs"
        >
          {/* 过滤栏 */}
          <Row gutter={8} style={{ marginBottom: 12 }}>
            <Col xs={24} sm={8}>
              <Input
                placeholder="搜索工单号 / 物料编码 / 物料名称"
                prefix={<SearchOutlined />}
                value={searchWo}
                onChange={e => setSearchWo(e.target.value)}
                allowClear
              />
            </Col>
            <Col xs={12} sm={4}>
              <Select placeholder="执行状态" value={filterStatus || undefined}
                onChange={v => setFilterStatus(v ?? '')} allowClear style={{ width: '100%' }}>
                {Object.entries(BF_STATUS_LABEL).map(([k, v]) => (
                  <Option key={k} value={k}>{v}</Option>
                ))}
              </Select>
            </Col>
            <Col xs={12} sm={4}>
              <Select placeholder="触发点" value={filterTrigger || undefined}
                onChange={v => setFilterTrigger(v ?? '')} allowClear style={{ width: '100%' }}>
                <Option value="OPERATION_REPORT">工序报工</Option>
                <Option value="COMPLETE_IN">完工入库</Option>
              </Select>
            </Col>
            <Col>
              <Button icon={<ReloadOutlined />} onClick={() => {
                setSearchWo(''); setFilterStatus(''); setFilterTrigger('');
              }}>重置</Button>
            </Col>
          </Row>

          <Table
            dataSource={filteredLogs}
            columns={logColumns}
            rowKey="id"
            size="small"
            scroll={{ x: 1200 }}
            pagination={{ pageSize: 15, showSizeChanger: true, showTotal: t => `共 ${t} 条` }}
            rowClassName={r =>
              r.status === 'INSUFFICIENT' || r.status === 'FAILED' ? 'ant-table-row-error' :
              r.status === 'OVER_CONSUME' ? 'ant-table-row-warning' : ''
            }
          />
        </TabPane>

        {/* 异常处理 */}
        <TabPane
          tab={
            <span>
              <WarningOutlined style={{ color: exceptionLogs.length > 0 ? '#f5222d' : undefined }} />
              异常处理
              {exceptionLogs.length > 0 && <Badge count={exceptionLogs.length} style={{ marginLeft: 6 }} />}
            </span>
          }
          key="exceptions"
        >
          {exceptionLogs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#888' }}>
              <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a' }} />
              <div style={{ marginTop: 12, fontSize: 16 }}>暂无倒扣异常，一切正常！</div>
            </div>
          ) : (
            <Table
              dataSource={exceptionLogs}
              columns={exceptionColumns}
              rowKey="id"
              size="small"
              scroll={{ x: 1000 }}
              pagination={{ pageSize: 10, showTotal: t => `共 ${t} 条异常` }}
            />
          )}
        </TabPane>

        {/* 线边仓库存 */}
        <TabPane
          tab={
            <span>
              <InboxOutlined />线边仓库存
              {stats.lowStockCount > 0 && <Badge count={stats.lowStockCount} style={{ marginLeft: 6 }} />}
            </span>
          }
          key="inventory"
        >
          {lowStockItems.length > 0 && (
            <Alert
              type="warning"
              showIcon
              message={`${lowStockItems.length} 种物料库存低于安全库存，建议尽快补货！`}
              style={{ marginBottom: 12 }}
            />
          )}
          <Table
            dataSource={wipInventory}
            columns={wipColumns}
            rowKey="id"
            size="small"
            scroll={{ x: 1100 }}
            pagination={{ pageSize: 15, showSizeChanger: true }}
            rowClassName={r => {
              const safety = SAFETY_STOCK[r.itemCode] ?? 0;
              return safety > 0 && r.availableQty < safety ? 'ant-table-row-warning' : '';
            }}
          />
        </TabPane>

        {/* 超耗分析 */}
        <TabPane tab={<span><RiseOutlined />超耗分析</span>} key="overConsume">
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Card title="超耗物料 TOP5" size="small" style={{ marginBottom: 16 }}>
                {logs
                  .filter(l => l.status === 'OVER_CONSUME')
                  .sort((a, b) => (b.actualQty - b.stdQty) - (a.actualQty - a.stdQty))
                  .slice(0, 5)
                  .map((l, i) => {
                    const gap = l.actualQty - l.stdQty;
                    const pct = l.stdQty > 0 ? Math.round(gap / l.stdQty * 100) : 0;
                    return (
                      <div key={l.id} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '8px 0', borderBottom: '1px solid #f0f0f0',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{
                            background: i < 3 ? '#f5222d' : '#faad14',
                            color: '#fff', borderRadius: 4,
                            padding: '2px 6px', fontSize: 12, fontWeight: 700,
                          }}>#{i + 1}</span>
                          <div>
                            <div style={{ fontWeight: 500 }}>{l.itemName}</div>
                            <div style={{ fontSize: 11, color: '#888' }}>{l.itemCode} · {l.woNo}</div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ color: '#f5222d', fontWeight: 700 }}>+{gap.toFixed(3)}</div>
                          <div style={{ fontSize: 11, color: '#faad14' }}>超耗 {pct}%</div>
                        </div>
                      </div>
                    );
                  })}
                {logs.filter(l => l.status === 'OVER_CONSUME').length === 0 && (
                  <div style={{ textAlign: 'center', color: '#52c41a', padding: 24 }}>
                    <CheckCircleOutlined style={{ fontSize: 32 }} />
                    <div style={{ marginTop: 8 }}>暂无超耗记录</div>
                  </div>
                )}
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card title="倒扣执行统计" size="small">
                <Row gutter={16}>
                  <Col span={12}>
                    <Statistic title="总执行次数" value={stats.total} suffix="次"
                      valueStyle={{ color: '#1677ff' }} />
                  </Col>
                  <Col span={12}>
                    <Statistic title="成功率" value={stats.total ? Math.round(stats.successCount / stats.total * 100) : 0}
                      suffix="%" valueStyle={{ color: '#52c41a' }} />
                  </Col>
                </Row>
                <Divider style={{ margin: '12px 0' }} />
                <Row gutter={16}>
                  <Col span={12}>
                    <Statistic title="库存不足次数" value={stats.insufficientCount}
                      valueStyle={{ color: '#f5222d' }} />
                  </Col>
                  <Col span={12}>
                    <Statistic title="超耗次数" value={stats.overConsumeCount}
                      valueStyle={{ color: '#faad14' }} />
                  </Col>
                </Row>
                <Divider style={{ margin: '12px 0' }} />
                <div style={{ marginTop: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ color: '#52c41a' }}>成功</span>
                    <span>{stats.successCount} 次</span>
                  </div>
                  <Progress
                    percent={stats.total ? Math.round(stats.successCount / stats.total * 100) : 0}
                    strokeColor="#52c41a" size="small"
                  />
                </div>
                <div style={{ marginTop: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ color: '#f5222d' }}>库存不足</span>
                    <span>{stats.insufficientCount} 次</span>
                  </div>
                  <Progress
                    percent={stats.total ? Math.round(stats.insufficientCount / stats.total * 100) : 0}
                    strokeColor="#f5222d" size="small"
                  />
                </div>
                <div style={{ marginTop: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ color: '#faad14' }}>超耗</span>
                    <span>{stats.overConsumeCount} 次</span>
                  </div>
                  <Progress
                    percent={stats.total ? Math.round(stats.overConsumeCount / stats.total * 100) : 0}
                    strokeColor="#faad14" size="small"
                  />
                </div>
              </Card>
            </Col>
          </Row>
        </TabPane>
      </Tabs>

      {/* 详情抽屉 */}
      <Drawer
        title="倒扣记录详情"
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
        width={520}
      >
        {detailLog && (
          <>
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="工单号" span={2}>
                <Text code>{detailLog.woNo}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="工序序号">{detailLog.operationSeq}</Descriptions.Item>
              <Descriptions.Item label="工序编码">{detailLog.operationCode}</Descriptions.Item>
              <Descriptions.Item label="触发点" span={2}>
                <Tag color={detailLog.triggerPoint === 'OPERATION_REPORT' ? 'blue' : 'purple'}>
                  {TRIGGER_LABEL[detailLog.triggerPoint]}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="物料编码">{detailLog.itemCode}</Descriptions.Item>
              <Descriptions.Item label="物料名称">{detailLog.itemName}</Descriptions.Item>
              <Descriptions.Item label="BOM子件用量">{detailLog.bomChildQty}</Descriptions.Item>
              <Descriptions.Item label="基础批量">{detailLog.baseBatchQty}</Descriptions.Item>
              <Descriptions.Item label="报工数量">{detailLog.reportQty}</Descriptions.Item>
              <Descriptions.Item label="损耗率">{(detailLog.lossRate * 100).toFixed(1)}%</Descriptions.Item>
              <Descriptions.Item label="标准扣减量">
                <span style={{ fontWeight: 700 }}>{detailLog.stdQty?.toFixed(4)}</span>
              </Descriptions.Item>
              <Descriptions.Item label="实际扣减量">
                <span style={{ fontWeight: 700, color: detailLog.actualQty < detailLog.stdQty ? '#f5222d' : '#52c41a' }}>
                  {detailLog.actualQty?.toFixed(4)}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="线边仓" span={2}>{WH_NAME[detailLog.wipWarehouse] ?? detailLog.wipWarehouse}</Descriptions.Item>
              <Descriptions.Item label="执行状态" span={2}>
                <BfStatusTag status={detailLog.status} />
              </Descriptions.Item>
              {detailLog.errorMsg && (
                <Descriptions.Item label="异常说明" span={2}>
                  <Alert type="error" message={detailLog.errorMsg} style={{ margin: 0 }} />
                </Descriptions.Item>
              )}
              <Descriptions.Item label="执行时间" span={2}>{detailLog.createdAt}</Descriptions.Item>
            </Descriptions>

            {detailLog.status === 'INSUFFICIENT' && (
              <div style={{ marginTop: 16 }}>
                <Alert
                  type="warning"
                  showIcon
                  message="库存不足，需要手动补扣"
                  description={`缺口数量：${(detailLog.stdQty - detailLog.actualQty).toFixed(4)} ${detailLog.itemCode}`}
                  action={
                    <Button size="small" type="primary" danger onClick={() => {
                      setDetailVisible(false);
                      handleSupplement(detailLog);
                    }}>发起补扣</Button>
                  }
                />
              </div>
            )}
          </>
        )}
      </Drawer>

      {/* 补扣 Modal */}
      <Modal
        title={<><ToolOutlined style={{ color: '#f5222d' }} /> 手动补扣申请</>}
        open={supplementVisible}
        onOk={handleSupplementConfirm}
        onCancel={() => { setSupplementVisible(false); supplementForm.resetFields(); }}
        okText="提交补扣"
        okButtonProps={{ danger: true }}
      >
        {supplementLog && (
          <>
            <Alert
              type="info"
              message={`物料：${supplementLog.itemName}（${supplementLog.itemCode}）`}
              description={`工单：${supplementLog.woNo} | 标准量：${supplementLog.stdQty} | 已扣：${supplementLog.actualQty}`}
              style={{ marginBottom: 16 }}
            />
            <Form form={supplementForm} layout="vertical">
              <Form.Item
                label="补扣数量"
                name="qty"
                rules={[{ required: true, message: '请输入补扣数量' }, { type: 'number', min: 0.001, message: '数量必须大于0' }]}
              >
                <InputNumber style={{ width: '100%' }} min={0} step={0.001} precision={3} />
              </Form.Item>
              <Form.Item
                label="补扣原因"
                name="reason"
                rules={[{ required: true, message: '请输入补扣原因' }]}
              >
                <Input.TextArea rows={3} placeholder="请说明库存不足原因（如：线边仓未及时补货、紧急调拨等）" />
              </Form.Item>
              <Form.Item
                label="审批人"
                name="approvedBy"
                rules={[{ required: true, message: '请填写审批人' }]}
              >
                <Input placeholder="审批人姓名" />
              </Form.Item>
            </Form>
          </>
        )}
      </Modal>
    </div>
  );
};

export default BackflushMonitorPage;

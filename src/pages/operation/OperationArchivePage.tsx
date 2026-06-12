/**
 * OperationArchivePage.tsx
 * 工序档案 — 增强版（保健品GMP合规）
 * 含：设备配置、QC参数、GMP要求、标准工时、电子签名、清场要求
 */
import React, { useState, useMemo } from 'react';
import {
  Table, Tag, Space, Badge, Tooltip, Button, Select, Input, Row, Col,
  Drawer, Descriptions, Tabs, Alert, Collapse, Statistic, Card,
  Timeline, Modal, Typography, Divider,
} from 'antd';
import {
  ToolOutlined, CheckCircleOutlined, WarningOutlined, ExclamationCircleOutlined,
  SearchOutlined, FilterOutlined, EyeOutlined, SafetyCertificateOutlined,
  ClockCircleOutlined, ExperimentOutlined, ApartmentOutlined, FireOutlined,
  ThunderboltOutlined, BankOutlined, TeamOutlined, AlertOutlined,
  SettingOutlined, AuditOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import {
  ALL_PHARMA_OPERATIONS, PharmaOperation, InspTrigger, CleanupType,
  ESIGN_LEVEL_LABELS, CLEANUP_TYPE_LABELS, CLEAN_ROOM_COLORS,
} from './pharmaOperationData';
import { useOrgStore, FACTORY_LIST } from '../../store/orgStore';

const { Panel } = Collapse;
const { Text } = Typography;

// ── 辅助标签 ─────────────────────────────────────────────────────
const InspTriggerTag: React.FC<{ trigger: InspTrigger }> = ({ trigger }) => {
  const cfg: Record<InspTrigger, { label: string; color: string; icon: React.ReactNode }> = {
    NONE:          { label: '无检验',     color: '#999',     icon: null },
    AUTO_COMPLETE: { label: '完工自动触发', color: '#1677FF',  icon: <CheckCircleOutlined /> },
    AUTO_START:    { label: '开工触发',   color: '#13C2C2',  icon: <ThunderboltOutlined /> },
    MANUAL:        { label: '手工触发',   color: '#FA8C16',  icon: <ToolOutlined /> },
    FIRST_PIECE:   { label: '首件触发',   color: '#722ED1',  icon: <ExperimentOutlined /> },
    PATROL:        { label: '巡检触发',   color: '#52C41A',  icon: <AuditOutlined /> },
    CRITICAL:      { label: '🔑关键触发', color: '#E60012',  icon: <FireOutlined /> },
  };
  const c = cfg[trigger];
  return (
    <Tag
      color={c.color}
      icon={c.icon}
      style={{ fontSize: 11, padding: '0 5px' }}
    >
      {c.label}
    </Tag>
  );
};

// ── 工序详情 Drawer ───────────────────────────────────────────────
const OperationDetailDrawer: React.FC<{
  op: PharmaOperation | null;
  onClose: () => void;
}> = ({ op, onClose }) => {
  if (!op) return null;

  const eSignCfg = ESIGN_LEVEL_LABELS[op.eSignLevel];
  const cleanupCfg = CLEANUP_TYPE_LABELS[op.cleanupType];
  const cleanRoomColor = CLEAN_ROOM_COLORS[op.cleanRoomLevel];

  return (
    <Drawer
      title={
        <Space>
          <span style={{ display: 'inline-block', width: 4, height: 18, background: '#E60012', borderRadius: 2 }} />
          <span style={{ fontWeight: 700, fontSize: 15 }}>{op.opName} — {op.opCode}</span>
          {op.isBottleneck && <Tag color="red">⚡ 瓶颈</Tag>}
          {op.isCriticalControl && <Tag color="red" style={{ background: '#fff1f0' }}>🔑 关键控制点</Tag>}
        </Space>
      }
      open={!!op}
      onClose={onClose}
      width={820}
      bodyStyle={{ padding: '12px 20px' }}
    >
      {/* GMP告警横幅 */}
      {op.isCriticalControl && (
        <Alert
          type="error"
          showIcon
          icon={<FireOutlined />}
          style={{ marginBottom: 12, borderRadius: 8 }}
          message="关键控制点 (CCP)"
          description="此工序为关键控制点，参数超限须强制停产处置，不得跳过或降级处理。QA现场监控必须到位。"
        />
      )}

      <Tabs
        size="small"
        items={[
          {
            key: 'basic',
            label: <span><ToolOutlined />基本信息</span>,
            children: (
              <Descriptions size="small" bordered column={2} style={{ marginTop: 8 }}>
                <Descriptions.Item label="工序编码" span={1}>
                  <Text code style={{ fontWeight: 600 }}>{op.opCode}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="工序名称" span={1}>
                  <strong>{op.opName}</strong>
                </Descriptions.Item>
                <Descriptions.Item label="所属车间" span={1}>{op.workshop}</Descriptions.Item>
                <Descriptions.Item label="工作中心" span={1}>{op.workCenter}</Descriptions.Item>
                <Descriptions.Item label="适用剂型" span={2}>
                  {op.dosageForms.map(d => <Tag key={d} color="blue" style={{ fontSize: 11 }}>{d}</Tag>)}
                </Descriptions.Item>
                <Descriptions.Item label="标准工时" span={1}>
                  <span style={{ color: '#1677FF', fontWeight: 700 }}>{op.stdTimeMin}min</span>
                  {op.batchSize && <span style={{ color: '#888', fontSize: 12, marginLeft: 6 }}>（{op.batchSize}）</span>}
                </Descriptions.Item>
                <Descriptions.Item label="准备/清场工时" span={1}>
                  准备 <strong>{op.prepTimeMin}min</strong>
                  <span style={{ color: '#888', margin: '0 4px' }}>+</span>
                  清场 <strong>{op.cleanTimeMin}min</strong>
                </Descriptions.Item>
                <Descriptions.Item label="洁净级别" span={1}>
                  <Tag color={cleanRoomColor} style={{ fontWeight: 600 }}>{op.cleanRoomLevel}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="检验触发" span={1}>
                  <InspTriggerTag trigger={op.inspTrigger} />
                  {op.inspSchemeCode && (
                    <Text type="secondary" style={{ fontSize: 11, marginLeft: 6 }}>{op.inspSchemeCode}</Text>
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="电子签名" span={1}>
                  <Tag color={eSignCfg.color} style={{ fontWeight: 600 }}>{eSignCfg.label}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="清场要求" span={1}>
                  <Tag color={cleanupCfg.color}>{cleanupCfg.label}</Tag>
                  <span style={{ fontSize: 11, color: '#888', marginLeft: 6 }}>
                    有效期 <strong>{op.cleanupValidHours}h</strong>
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="双人复核" span={1}>
                  {op.dualPersonCheck
                    ? <Tag color="orange">✓ 需双人复核</Tag>
                    : <Text type="secondary" style={{ fontSize: 12 }}>无要求</Text>}
                </Descriptions.Item>
                <Descriptions.Item label="QA现场监控" span={1}>
                  {op.qaMonitorRequired
                    ? <Tag color="red">✓ QA必须在场</Tag>
                    : <Text type="secondary" style={{ fontSize: 12 }}>无要求</Text>}
                </Descriptions.Item>
                {op.yieldStd && (
                  <Descriptions.Item label="收率标准" span={2}>
                    <span style={{ color: '#52C41A', fontWeight: 600 }}>{op.yieldStd}</span>
                  </Descriptions.Item>
                )}
                {op.remark && (
                  <Descriptions.Item label="备注" span={2}>
                    <Text type="secondary" style={{ fontSize: 12 }}>{op.remark}</Text>
                  </Descriptions.Item>
                )}
              </Descriptions>
            ),
          },
          {
            key: 'equip',
            label: <span><SettingOutlined />核心设备（{op.equipments.length}台）</span>,
            children: (
              <div style={{ marginTop: 8 }}>
                {op.equipments.length === 0 ? (
                  <Text type="secondary">暂无设备配置</Text>
                ) : (
                  op.equipments.map((eq, i) => (
                    <Card
                      key={eq.equipCode}
                      size="small"
                      style={{
                        marginBottom: 8,
                        border: `1px solid ${eq.isPrimary ? '#1677FF40' : '#f0f0f0'}`,
                        background: eq.isPrimary ? '#E6F4FF' : '#fafafa',
                      }}
                    >
                      <Row gutter={12} align="middle">
                        <Col span={1}>
                          <span style={{ color: '#888', fontSize: 12 }}>{i + 1}</span>
                        </Col>
                        <Col span={6}>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>
                            {eq.isPrimary && <Tag color="blue" style={{ fontSize: 10, marginRight: 4 }}>核心</Tag>}
                            {eq.equipName}
                          </div>
                          <div style={{ fontSize: 11, color: '#888' }}>{eq.equipCode}</div>
                        </Col>
                        <Col span={5}>
                          <Text code style={{ fontSize: 11 }}>{eq.model}</Text>
                        </Col>
                        <Col span={3}>
                          <span style={{ fontSize: 12 }}>×{eq.qty}台</span>
                        </Col>
                        <Col span={5}>
                          {eq.autoCollect && eq.protocol ? (
                            <Tag color="green" style={{ fontSize: 10 }}>
                              自动数采 {eq.protocol}
                            </Tag>
                          ) : eq.autoCollect ? (
                            <Tag color="cyan" style={{ fontSize: 10 }}>自动数采</Tag>
                          ) : (
                            <Tag style={{ fontSize: 10 }}>手动记录</Tag>
                          )}
                        </Col>
                        <Col span={4}>
                          {(eq.calibPeriodDays ?? 0) > 0 && (
                            <span style={{ fontSize: 11, color: '#FA8C16' }}>
                              校验周期 {eq.calibPeriodDays}天
                            </span>
                          )}
                        </Col>
                      </Row>
                    </Card>
                  ))
                )}
              </div>
            ),
          },
          {
            key: 'qc',
            label: (
              <span>
                <ExperimentOutlined />
                质量控制（{op.qcParams.length}项）
                {op.qcParams.filter(q => q.isCritical).length > 0 && (
                  <Badge
                    count={op.qcParams.filter(q => q.isCritical).length}
                    style={{ background: '#E60012', marginLeft: 4, fontSize: 10 }}
                  />
                )}
              </span>
            ),
            children: (
              <div style={{ marginTop: 8 }}>
                {op.qcParams.map((qc, i) => (
                  <Card
                    key={qc.paramCode}
                    size="small"
                    style={{
                      marginBottom: 8,
                      border: `1px solid ${qc.isCritical ? '#FF4D4F40' : '#f0f0f0'}`,
                      background: qc.isCritical ? '#FFF2F0' : '#fafafa',
                    }}
                  >
                    <Row gutter={8} align="top">
                      <Col span={7}>
                        <div>
                          {qc.isCritical && (
                            <Tag color="red" style={{ fontSize: 10, padding: '0 3px' }}>关键</Tag>
                          )}
                          <strong style={{ fontSize: 13 }}>{qc.paramName}</strong>
                        </div>
                        <Text code style={{ fontSize: 11 }}>{qc.paramCode}</Text>
                      </Col>
                      <Col span={6}>
                        <div style={{ fontSize: 12 }}>
                          <span style={{ color: '#888' }}>标准范围：</span>
                          {qc.stdMin !== undefined && qc.stdMax !== undefined ? (
                            <span style={{ color: '#1677FF', fontWeight: 600 }}>
                              {qc.stdMin}~{qc.stdMax} {qc.unit}
                            </span>
                          ) : qc.stdMax !== undefined ? (
                            <span style={{ color: '#1677FF', fontWeight: 600 }}>
                              ≤{qc.stdMax} {qc.unit}
                            </span>
                          ) : (
                            <span style={{ color: '#555', fontSize: 11 }}>{qc.stdValue}</span>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: '#888' }}>频次：{qc.inspFreq}</div>
                      </Col>
                      <Col span={5}>
                        <div style={{ fontSize: 11, color: '#555' }}>
                          <strong>检验方法：</strong>{qc.inspMethod}
                        </div>
                      </Col>
                      <Col span={6}>
                        {qc.criticalLimit && (
                          <Alert
                            type="error"
                            showIcon={false}
                            style={{ padding: '2px 8px', fontSize: 11, borderRadius: 4 }}
                            message={<span style={{ fontSize: 10, color: '#E60012' }}>🔴 {qc.criticalLimit}</span>}
                          />
                        )}
                        {qc.actionRequired && !qc.criticalLimit && (
                          <span style={{ fontSize: 11, color: '#FA8C16' }}>⚠ {qc.actionRequired}</span>
                        )}
                      </Col>
                    </Row>
                  </Card>
                ))}
              </div>
            ),
          },
          {
            key: 'gmp',
            label: (
              <span>
                <SafetyCertificateOutlined />
                GMP合规（{op.gmpRequirements.length}项）
                {op.gmpRequirements.filter(g => g.isMandatory).length > 0 && (
                  <Badge
                    count={op.gmpRequirements.filter(g => g.isMandatory).length}
                    style={{ background: '#FA8C16', marginLeft: 4, fontSize: 10 }}
                  />
                )}
              </span>
            ),
            children: (
              <div style={{ marginTop: 8 }}>
                {op.gmpRequirements.length === 0 ? (
                  <Text type="secondary">无特殊GMP要求</Text>
                ) : (
                  op.gmpRequirements.map((gmp, i) => (
                    <Card
                      key={gmp.gmpCode}
                      size="small"
                      style={{
                        marginBottom: 8,
                        borderLeft: `3px solid ${gmp.isMandatory ? '#FA8C16' : '#1677FF'}`,
                        background: gmp.isMandatory ? '#FFFBE6' : '#F6FFED',
                      }}
                    >
                      <Space direction="vertical" size={2} style={{ width: '100%' }}>
                        <Row justify="space-between">
                          <Col>
                            <Tag color={gmp.isMandatory ? 'orange' : 'blue'} style={{ fontSize: 10 }}>
                              {gmp.isMandatory ? '强制要求' : '推荐要求'}
                            </Tag>
                            <Text code style={{ fontSize: 11, marginLeft: 4 }}>{gmp.gmpCode}</Text>
                          </Col>
                          <Col>
                            <Text type="secondary" style={{ fontSize: 11 }}>{gmp.regulation}</Text>
                          </Col>
                        </Row>
                        <div style={{ fontSize: 13, fontWeight: 500, margin: '4px 0' }}>
                          {gmp.requirement}
                        </div>
                        <Row gutter={16}>
                          <Col span={12}>
                            <span style={{ fontSize: 11, color: '#888' }}>
                              <strong>验证方式：</strong>{gmp.verifyMethod}
                            </span>
                          </Col>
                          <Col span={12}>
                            <span style={{ fontSize: 11, color: '#888' }}>
                              <strong>记录文件：</strong>{gmp.docRequired}
                            </span>
                          </Col>
                        </Row>
                      </Space>
                    </Card>
                  ))
                )}
              </div>
            ),
          },
        ]}
      />
    </Drawer>
  );
};

// ════════════════════════════════════════════════════════════════
// 主页面
// ════════════════════════════════════════════════════════════════
const OperationArchivePage: React.FC = () => {
  const { currentFactory } = useOrgStore();
  const [searchText, setSearchText] = useState('');
  const [filterWorkshop, setFilterWorkshop] = useState<string>('');
  const [filterTrigger, setFilterTrigger] = useState<string>('');
  const [filterCritical, setFilterCritical] = useState<boolean | null>(null);
  const [viewingOp, setViewingOp] = useState<PharmaOperation | null>(null);

  // 根据工厂过滤
  const filteredOps = useMemo(() => {
    let list = ALL_PHARMA_OPERATIONS.filter(op => {
      if (currentFactory !== 'ALL' && op.factoryScope !== 'ALL' && op.factoryScope !== currentFactory)
        return false;
      if (searchText) {
        const t = searchText.toLowerCase();
        if (!op.opCode.toLowerCase().includes(t) && !op.opName.includes(t) && !op.workshop.includes(t))
          return false;
      }
      if (filterWorkshop && !op.workshop.includes(filterWorkshop)) return false;
      if (filterTrigger && op.inspTrigger !== filterTrigger) return false;
      if (filterCritical !== null && op.isCriticalControl !== filterCritical) return false;
      return true;
    });
    return list;
  }, [currentFactory, searchText, filterWorkshop, filterTrigger, filterCritical]);

  const summary = useMemo(() => ({
    total: filteredOps.length,
    critical: filteredOps.filter(o => o.isCriticalControl).length,
    bottleneck: filteredOps.filter(o => o.isBottleneck).length,
    autoCollect: filteredOps.filter(o => o.equipments.some(e => e.autoCollect && e.protocol)).length,
  }), [filteredOps]);

  const workshopOptions = useMemo(() => {
    const ws = new Set(ALL_PHARMA_OPERATIONS.map(o => o.workshop));
    return Array.from(ws).map(w => ({ value: w, label: w }));
  }, []);

  const columns: ColumnsType<PharmaOperation> = [
    {
      title: '工序编码', dataIndex: 'opCode', width: 130, fixed: 'left',
      render: (v: string, r: PharmaOperation) => (
        <span
          style={{ color: '#1677FF', fontWeight: 600, cursor: 'pointer', fontFamily: 'monospace', fontSize: 12 }}
          onClick={() => setViewingOp(r)}
        >
          <ToolOutlined style={{ marginRight: 4 }} />{v}
        </span>
      ),
    },
    {
      title: '工序名称', dataIndex: 'opName', width: 115,
      render: (v: string, r: PharmaOperation) => (
        <Space size={4}>
          <span style={{ fontWeight: 500 }}>{v}</span>
          {r.isBottleneck && <Tooltip title="瓶颈工序"><Tag color="red" style={{ fontSize: 10 }}>⚡</Tag></Tooltip>}
          {r.isCriticalControl && <Tooltip title="关键控制点"><Tag color="red" style={{ fontSize: 10, background: '#fff1f0' }}>🔑</Tag></Tooltip>}
        </Space>
      ),
    },
    {
      title: '所属车间', dataIndex: 'workshop', width: 130,
      render: (v: string) => {
        const colorMap: Record<string, string> = {
          'NJ-固体车间': '#1677FF', 'NJ-软胶囊车间': '#722ED1',
          'LS-固体车间': '#13C2C2', 'LS-液体车间': '#52C41A',
          '通用': '#FA8C16',
        };
        return <Tag color={colorMap[v] ?? '#888'} style={{ fontSize: 11 }}>{v}</Tag>;
      },
    },
    {
      title: (
        <Tooltip title="核心设备（含自动数采协议）"><SettingOutlined /> 核心设备</Tooltip>
      ),
      width: 160,
      render: (_: any, r: PharmaOperation) => {
        const primary = r.equipments.find(e => e.isPrimary);
        if (!primary) return <Text type="secondary" style={{ fontSize: 11 }}>—</Text>;
        return (
          <Space direction="vertical" size={0}>
            <span style={{ fontSize: 12, fontWeight: 500 }}>{primary.equipName}</span>
            <Text code style={{ fontSize: 10 }}>{primary.model}</Text>
            {primary.protocol && (
              <Tag color="green" style={{ fontSize: 10, padding: '0 3px', margin: '1px 0' }}>
                {primary.protocol}
              </Tag>
            )}
          </Space>
        );
      },
    },
    {
      title: (
        <Tooltip title="标准工时（min）/ 准备工时 / 清场时间">
          <ClockCircleOutlined /> 工时配置
        </Tooltip>
      ),
      width: 120,
      render: (_: any, r: PharmaOperation) => (
        <Space direction="vertical" size={0}>
          <span style={{ color: '#1677FF', fontWeight: 700, fontSize: 14 }}>{r.stdTimeMin}<span style={{ fontSize: 10, fontWeight: 400 }}>min</span></span>
          <span style={{ fontSize: 10, color: '#888' }}>准备{r.prepTimeMin} / 清场{r.cleanTimeMin}</span>
        </Space>
      ),
    },
    {
      title: 'QC控制',
      width: 100,
      render: (_: any, r: PharmaOperation) => {
        const criticalCount = r.qcParams.filter(q => q.isCritical).length;
        return (
          <Space direction="vertical" size={2}>
            <Space size={4}>
              <Badge count={r.qcParams.length} style={{ background: '#1677FF', fontSize: 10 }} showZero />
              <span style={{ fontSize: 10, color: '#888' }}>QC项</span>
            </Space>
            {criticalCount > 0 && (
              <Space size={4}>
                <Badge count={criticalCount} style={{ background: '#E60012', fontSize: 10 }} />
                <span style={{ fontSize: 10, color: '#E60012' }}>关键项</span>
              </Space>
            )}
          </Space>
        );
      },
    },
    {
      title: 'GMP合规',
      width: 100,
      render: (_: any, r: PharmaOperation) => {
        const mandatoryCount = r.gmpRequirements.filter(g => g.isMandatory).length;
        return (
          <Space direction="vertical" size={2}>
            <Tag
              color={CLEAN_ROOM_COLORS[r.cleanRoomLevel]}
              style={{ fontSize: 10, padding: '0 4px', margin: 0 }}
            >
              {r.cleanRoomLevel}
            </Tag>
            {mandatoryCount > 0 && (
              <span style={{ fontSize: 10, color: '#FA8C16' }}>
                {mandatoryCount}项强制
              </span>
            )}
          </Space>
        );
      },
    },
    {
      title: '检验触发',
      width: 115,
      render: (_: any, r: PharmaOperation) => <InspTriggerTag trigger={r.inspTrigger} />,
    },
    {
      title: '签名/清场',
      width: 140,
      render: (_: any, r: PharmaOperation) => {
        const es = ESIGN_LEVEL_LABELS[r.eSignLevel];
        const cu = CLEANUP_TYPE_LABELS[r.cleanupType];
        return (
          <Space direction="vertical" size={2}>
            <Tag color={es.color} style={{ fontSize: 10, padding: '0 4px', margin: 0 }}>{es.label}</Tag>
            <Space size={3}>
              <Tag color={cu.color} style={{ fontSize: 10, padding: '0 3px', margin: 0 }}>{cu.label}</Tag>
              <span style={{ fontSize: 10, color: '#888' }}>{r.cleanupValidHours}h</span>
            </Space>
          </Space>
        );
      },
    },
    {
      title: '操作', width: 80, fixed: 'right',
      render: (_: any, r: PharmaOperation) => (
        <Button
          type="link" size="small" icon={<EyeOutlined />}
          style={{ padding: '0 6px', fontSize: 12, fontWeight: 600 }}
          onClick={() => setViewingOp(r)}
        >
          详情
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: '0 0 16px' }}>
      {/* 顶部提示 */}
      <Alert
        type="info" showIcon
        style={{ marginBottom: 12, borderRadius: 8, fontSize: 13 }}
        message={
          <span>
            <strong>工序档案（GMP增强版）</strong>：
            涵盖 <strong>{ALL_PHARMA_OPERATIONS.length}</strong> 道工序，含设备配置、QC参数、GMP要求、电子签名和清场有效期定义。
            关键控制点工序（🔑）超参数须强制停产处置。
          </span>
        }
        closable
      />

      {/* 汇总卡片 */}
      <Row gutter={12} style={{ marginBottom: 12 }}>
        {[
          { label: '工序总数', value: summary.total, color: '#1677FF', icon: <ToolOutlined /> },
          { label: '关键控制点', value: summary.critical, color: '#E60012', icon: <FireOutlined /> },
          { label: '瓶颈工序', value: summary.bottleneck, color: '#FA8C16', icon: <ThunderboltOutlined /> },
          { label: '自动数采', value: summary.autoCollect, color: '#52C41A', icon: <ApartmentOutlined /> },
        ].map(c => (
          <Col span={6} key={c.label}>
            <Card size="small" bodyStyle={{ padding: '10px 16px' }}
              style={{ border: `1px solid ${c.color}20`, borderRadius: 8 }}>
              <Row align="middle" gutter={10}>
                <Col>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: c.color + '18',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.color, fontSize: 18 }}>
                    {c.icon}
                  </div>
                </Col>
                <Col>
                  <div style={{ fontSize: 22, fontWeight: 700, color: c.color, lineHeight: 1.2 }}>{c.value}</div>
                  <div style={{ fontSize: 12, color: '#888' }}>{c.label}</div>
                </Col>
              </Row>
            </Card>
          </Col>
        ))}
      </Row>

      {/* 过滤条 */}
      <div style={{ background: '#fff', borderRadius: 8, padding: '10px 14px', marginBottom: 10, border: '1px solid #f0f0f0' }}>
        <Row gutter={10} align="middle">
          <Col flex="none">
            <Input
              prefix={<SearchOutlined style={{ color: '#bbb' }} />}
              placeholder="工序编码/名称/车间"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              style={{ width: 200 }} allowClear
            />
          </Col>
          <Col flex="none">
            <Select
              placeholder="所属车间"
              value={filterWorkshop || undefined}
              onChange={setFilterWorkshop}
              allowClear style={{ width: 140 }}
              options={workshopOptions}
            />
          </Col>
          <Col flex="none">
            <Select
              placeholder="检验触发类型"
              value={filterTrigger || undefined}
              onChange={setFilterTrigger}
              allowClear style={{ width: 140 }}
              options={[
                { value: 'CRITICAL', label: '🔑 关键触发' },
                { value: 'AUTO_COMPLETE', label: '完工自动' },
                { value: 'AUTO_START', label: '开工触发' },
                { value: 'FIRST_PIECE', label: '首件触发' },
                { value: 'PATROL', label: '巡检触发' },
                { value: 'MANUAL', label: '手工触发' },
                { value: 'NONE', label: '无检验' },
              ]}
            />
          </Col>
          <Col flex="none">
            <Select
              placeholder="是否关键控制点"
              value={filterCritical === null ? undefined : String(filterCritical)}
              onChange={v => setFilterCritical(v === undefined ? null : v === 'true')}
              allowClear style={{ width: 140 }}
              options={[
                { value: 'true', label: '🔑 关键控制点' },
                { value: 'false', label: '普通工序' },
              ]}
            />
          </Col>
          <Col flex="none">
            <Button icon={<FilterOutlined />}
              onClick={() => { setSearchText(''); setFilterWorkshop(''); setFilterTrigger(''); setFilterCritical(null); }}>
              重置
            </Button>
          </Col>
          <Col flex="auto" style={{ textAlign: 'right' }}>
            <Tag style={{ fontSize: 12 }}>
              <FilterOutlined /> 显示 {filteredOps.length} / {ALL_PHARMA_OPERATIONS.length} 条
            </Tag>
          </Col>
        </Row>
      </div>

      {/* 表格 */}
      <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #f0f0f0', overflow: 'hidden' }}>
        <div style={{ padding: '9px 14px', borderBottom: '1px solid #f5f5f5', display: 'flex', alignItems: 'center', gap: 8 }}>
          <ToolOutlined style={{ color: '#E60012' }} />
          <span style={{ fontWeight: 600, fontSize: 14 }}>工序档案（GMP增强版）</span>
          <Tag style={{ marginLeft: 4, fontSize: 12 }}>{filteredOps.length} 条</Tag>
          <span style={{ fontSize: 12, color: '#999' }}>
            — 点击工序编码或「详情」查看完整设备/QC/GMP配置
          </span>
        </div>
        <Table
          rowKey="opCode"
          dataSource={filteredOps}
          columns={columns}
          size="small"
          scroll={{ x: 1300, y: 'calc(100vh - 420px)' }}
          pagination={{ pageSize: 20, showSizeChanger: true, showTotal: t => `共 ${t} 条`, size: 'small' }}
          rowClassName={(r: PharmaOperation) =>
            r.isCriticalControl ? 'ant-table-row-critical' : ''
          }
        />
      </div>

      {/* 工序详情 Drawer */}
      <OperationDetailDrawer op={viewingOp} onClose={() => setViewingOp(null)} />

      <style>{`
        .ant-table-row-critical td { background: #FFF9F9 !important; }
      `}</style>
    </div>
  );
};

export default OperationArchivePage;

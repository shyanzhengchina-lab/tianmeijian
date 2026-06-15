import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Card, Row, Col, Tag, Typography, Space, Button, Select, Badge,
  Progress, Avatar, Divider, Alert, Statistic, Modal, message,
  Drawer, Input, Tooltip, Timeline
} from 'antd';
import {
  PlayCircleOutlined, ClockCircleOutlined, CheckCircleOutlined,
  ExclamationCircleOutlined, FileTextOutlined,
  ThunderboltOutlined, UserOutlined, ScanOutlined,
  LogoutOutlined, SettingOutlined, BarcodeOutlined,
  InfoCircleOutlined, WarningOutlined
} from '@ant-design/icons';
import type { WorkOrder, OperationDef, OperationExecution } from './padExecutionData';
import {
  GMP_OPERATIONS, getEnabledStages,
  initOperationExecution, WORKSHOP_COLOR, STAGE_ICON,
  loadPadWorkOrders,
} from './padExecutionData';
import { getWorkOrderList } from '../../api/workOrders';
import type { WorkOrderRecord } from '../../api/workOrders';

const { Text, Title } = Typography;
const { Option } = Select;

interface PadOperationListPageProps {
  onStartExecution: (op: OperationDef, wo: WorkOrder, execMap: Record<string, OperationExecution>) => void;
  execMap: Record<string, OperationExecution>;
  setExecMap: React.Dispatch<React.SetStateAction<Record<string, OperationExecution>>>;
  selectedWo?: WorkOrder;
  setSelectedWo: React.Dispatch<React.SetStateAction<WorkOrder | null>>;
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  locked:      { label: '待上工序', color: '#d9d9d9' },
  ready:       { label: '待进站',   color: '#1890ff' },
  in_progress: { label: '生产中',   color: '#faad14' },
  completed:   { label: '已完成',   color: '#52c41a' },
  abnormal:    { label: '异常',     color: '#ff4d4f' },
};

// Mock 操作员列表（工牌扫码用）— 天美健固体制剂车间
const MOCK_OPERATORS = [
  { id: '1001', name: '张三',   role: '操作员',   dept: '南京-固体制剂车间' },
  { id: '1002', name: '李四',   role: '操作员',   dept: '南京-固体制剂车间' },
  { id: '1003', name: '王五',   role: '操作员',   dept: '廊坊-益生菌冷链车间' },
  { id: '1004', name: '赵六',   role: '班长',     dept: '生产部' },
  { id: '1005', name: '陈小燕', role: '检验员',   dept: '南京-质检中心' },
  { id: '9999', name: 'QA李',  role: 'QA工程师', dept: '质量保证部' },
];

/** 将后端 WorkOrderRecord 映射为 PAD WorkOrder 形状 */
function mapApiWoToPad(w: WorkOrderRecord): WorkOrder {
  const priorityNum = typeof w.status === 'string' ? 0 : 0;
  void priorityNum; // suppress unused warning
  return {
    id:           String(w.id ?? ''),
    woNo:         w.workOrderNo ?? '',
    productName:  w.materialName ?? 'VitC咀嚼片',
    productSpec:  w.spec ?? w.materialCode ?? '',
    batchNo:      (w as any).batchNo ?? '',
    planQty:      w.planQuantity ?? 0,
    customer:     (w as any).customerName ?? '',
    priority:     'B' as WorkOrder['priority'],  // API暂无A/B/C优先级字段，默认B
    planStartDate: w.startDate ?? '',
    floatBarcode:  '',
    materialLotNo: '',
    currentOpSeq:  0,
  };
}

const PadOperationListPage: React.FC<PadOperationListPageProps> = ({
  onStartExecution, execMap, setExecMap, selectedWo, setSelectedWo
}) => {
  // confirmModal removed – clicking a card directly enters execution
  const [detailDrawerOp, setDetailDrawerOp] = useState<OperationDef | null>(null);

  // 始终使用保健品GMP工序
  const activeOps = GMP_OPERATIONS;

  // ── API 工单列表 ──────────────────────────────────────────────
  const [apiWorkOrders, setApiWorkOrders] = useState<WorkOrder[]>([]);

  const loadWorkOrdersFromApi = useCallback(async () => {
    try {
      const resp = await getWorkOrderList() as any;
      const list: WorkOrderRecord[] = resp?.data ?? [];
      if (list.length > 0) {
        setApiWorkOrders(list.map(mapApiWoToPad));
      }
    } catch {
      // 后端不可用时回退到 loadPadWorkOrders()
    }
  }, []);

  useEffect(() => { loadWorkOrdersFromApi(); }, [loadWorkOrdersFromApi]);

  /** 有效工单列表：API优先，回退到本地 */
  const effectiveWorkOrders = apiWorkOrders.length > 0
    ? apiWorkOrders
    : loadPadWorkOrders();

  // ── 操作员登录 ───────────────────────────────────────────────
  const [loginModal, setLoginModal] = useState(true);   // 进入时弹出工牌扫码
  const [badgeInput, setBadgeInput] = useState('');
  const [currentOperator, setCurrentOperator] = useState<typeof MOCK_OPERATORS[0] | null>(null);
  const badgeInputRef = useRef<HTMLInputElement | null>(null);

  // ── 倒计时 / 当前时间 ────────────────────────────────────────
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // ── 工牌扫码登录 ─────────────────────────────────────────────
  const handleBadgeScan = useCallback(() => {
    const op = MOCK_OPERATORS.find(o => o.id === badgeInput.trim());
    if (!op) {
      message.error(`工牌编号 "${badgeInput}" 不存在，请重试`);
      setBadgeInput('');
      return;
    }
    setCurrentOperator(op);
    setLoginModal(false);
    setBadgeInput('');
    message.success(`欢迎，${op.name}（${op.role}）！`);
  }, [badgeInput]);

  const handleSimulateScan = useCallback(() => {
    setBadgeInput('1001');
    setTimeout(() => {
      const op = MOCK_OPERATORS.find(o => o.id === '1001')!;
      setCurrentOperator(op);
      setLoginModal(false);
      message.success(`工牌扫码成功：${op.name}（${op.role}）`);
    }, 200);
  }, []);

  // ── 工序执行 ─────────────────────────────────────────────────
  const getOrInitExec = useCallback((opCode: string): OperationExecution => {
    return execMap[opCode] || initOperationExecution(opCode);
  }, [execMap]);

  // 点击「开始执行/继续执行」直接进入执行页，无需二次确认
  const handleStartOp = (op: OperationDef) => {
    if (!currentOperator) { message.warning('请先扫描工牌登录'); setLoginModal(true); return; }
    if (!selectedWo) { message.warning('暂无可执行的工单，请先创建工单后再来执行'); return; }
    const newExecMap = { ...execMap };
    if (!newExecMap[op.code]) {
      newExecMap[op.code] = initOperationExecution(op.code);
    }
    setExecMap(newExecMap);
    onStartExecution(op, selectedWo, newExecMap);
  };

  // ── 统计 ─────────────────────────────────────────────────────
  const totalVisible    = activeOps.length;
  const completedOps    = activeOps.filter(op => getOrInitExec(op.code).status === 'completed').length;
  const inProgressOps   = activeOps.filter(op => getOrInitExec(op.code).status === 'in_progress').length;
  const abnormalOps     = activeOps.filter(op => getOrInitExec(op.code).status === 'abnormal').length;
  const overallProgress = Math.round((completedOps / totalVisible) * 100);

  // ── 详情 Drawer 数据 ─────────────────────────────────────────
  const detailExec  = detailDrawerOp ? getOrInitExec(detailDrawerOp.code) : null;
  const detailStages = detailDrawerOp ? getEnabledStages(detailDrawerOp) : [];

  return (
    <div style={{ padding: 20, background: '#f0f2f5', minHeight: '100vh' }}>

      {/* ===== 顶部标题栏 ===== */}
      <div style={{
        background: 'linear-gradient(135deg, #C8000A 0%, #a50008 100%)',
        borderRadius: 12,
        padding: '16px 24px',
        marginBottom: 20,
        color: '#fff',
      }}>
        <Row align="middle" justify="space-between">
          <Col>
            <Space size={16} align="center">
              <Avatar size={48} style={{ background: 'rgba(255,255,255,0.15)', fontSize: 24 }}>🏭</Avatar>
              <div>
                <Title level={4} style={{ color: '#fff', margin: 0 }}>
                    天美健MES · 保健品GMP · PAD生产执行
                  </Title>
                <Text style={{ color: '#c5cae9', fontSize: 13 }}>
                  固体制剂 · SOR-MF-PE-02-05 · GMP · ALCOA+
                </Text>
              </div>
            </Space>
          </Col>
          <Col>
            <Space size={24} align="center">
              {/* 统计 */}
              <Statistic
                title={<span style={{ color: '#c5cae9', fontSize: 12 }}>已完成</span>}
                value={completedOps} suffix={`/ ${totalVisible}`}
                valueStyle={{ color: '#52c41a', fontSize: 22 }}
              />
              <Statistic
                title={<span style={{ color: '#c5cae9', fontSize: 12 }}>生产中</span>}
                value={inProgressOps}
                valueStyle={{ color: '#faad14', fontSize: 22 }}
              />
              {abnormalOps > 0 && (
                <Statistic
                  title={<span style={{ color: '#ffccc7', fontSize: 12 }}>异常</span>}
                  value={abnormalOps}
                  valueStyle={{ color: '#ff4d4f', fontSize: 22 }}
                />
              )}
              <div>
                <Text style={{ color: '#c5cae9', fontSize: 12, display: 'block' }}>整体进度</Text>
                <Progress
                  percent={overallProgress}
                  strokeColor="#52c41a"
                  trailColor="rgba(255,255,255,0.2)"
                  style={{ width: 120 }}
                />
              </div>

              {/* 当前时间 */}
              <div style={{ textAlign: 'right' }}>
                <Text style={{ color: '#9fa8da', fontSize: 11, display: 'block' }}>当前时间</Text>
                <Text style={{ color: '#fff', fontSize: 15, fontFamily: 'monospace', fontWeight: 700 }}>
                  {currentTime.toLocaleTimeString('zh-CN')}
                </Text>
                <Text style={{ color: '#9fa8da', fontSize: 11, display: 'block' }}>
                  {currentTime.toLocaleDateString('zh-CN')}
                </Text>
              </div>

              {/* 操作员信息 */}
              {currentOperator ? (
                <Space direction="vertical" size={2} style={{ textAlign: 'right' }}>
                  <Tag color="green" style={{ fontSize: 12 }}>
                    <UserOutlined /> {currentOperator.name} ({currentOperator.id})
                  </Tag>
                  <Text style={{ color: '#c5cae9', fontSize: 11 }}>{currentOperator.role}</Text>
                  <Button
                    size="small"
                    icon={<LogoutOutlined />}
                    style={{ fontSize: 11, height: 22, background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none' }}
                    onClick={() => { setCurrentOperator(null); setLoginModal(true); }}
                  >
                    换班
                  </Button>
                </Space>
              ) : (
                <Button
                  icon={<ScanOutlined />}
                  onClick={() => setLoginModal(true)}
                  style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.4)', height: 40 }}
                >
                  扫码登录
                </Button>
              )}
            </Space>
          </Col>
        </Row>
      </div>



      {/* ===== 工单选择 ===== */}
      <Card style={{ marginBottom: 16, borderRadius: 10 }}>
        <Row align="middle" gutter={24} wrap>
          <Col xs={24} sm={4}>
            <Text strong style={{ fontSize: 14 }}>当前工单：</Text>
          </Col>
          <Col xs={24} sm={10}>
            <Select
              size="large"
              style={{ width: '100%' }}
              value={selectedWo?.id}
              placeholder="暂无可执行工单"
              onChange={id => {
                const wo = effectiveWorkOrders.find(w => w.id === id);
                if (wo) { setSelectedWo(wo); setExecMap({}); }
              }}
            >
              {effectiveWorkOrders.map(wo => (
                <Option key={wo.id} value={wo.id}>
                  <Space>
                    <Tag color={wo.priority === 'A' ? 'red' : wo.priority === 'B' ? 'orange' : 'default'}>
                      {wo.priority}级
                    </Tag>
                    <Text>{wo.woNo}</Text>
                    <Text type="secondary">—</Text>
                    <Text>{wo.productSpec}</Text>
                    <Text type="secondary">× {wo.planQty.toLocaleString()}{wo.productSpec?.includes('粒') ? '粒' : '片'}</Text>
                  </Space>
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={10}>
            <Row gutter={[12, 8]}>
              <Col xs={12} sm={8}>
                <Space direction="vertical" size={0}>
                  <Text type="secondary" style={{ fontSize: 11 }}>批次号</Text>
                  <Text strong style={{ fontFamily: 'monospace', fontSize: 12 }}>{selectedWo?.batchNo ?? '—'}</Text>
                </Space>
              </Col>
              <Col xs={12} sm={8}>
                <Space direction="vertical" size={0}>
                  <Text type="secondary" style={{ fontSize: 11 }}>计划批量</Text>
                  <Text strong style={{ color: '#1890ff', fontSize: 13 }}>{selectedWo?.planQty ?? 0} {selectedWo?.productSpec?.includes('粒') ? '粒' : '片'}</Text>
                </Space>
              </Col>
              <Col xs={12} sm={8}>
                <Space direction="vertical" size={0}>
                  <Text type="secondary" style={{ fontSize: 11 }}>产品规格</Text>
                  <Text strong style={{ fontSize: 12 }}>{selectedWo?.productSpec || '—'}</Text>
                </Space>
              </Col>
              <Col xs={12} sm={8}>
                <Space direction="vertical" size={0}>
                  <Text type="secondary" style={{ fontSize: 11 }}>物料批号</Text>
                  <Text style={{ fontFamily: 'monospace', fontSize: 11, color: '#1677ff' }}>
                    {selectedWo?.materialLotNo ?? '—'}
                  </Text>
                </Space>
              </Col>
              <Col xs={12} sm={8}>
                <Space direction="vertical" size={0}>
                  <Text type="secondary" style={{ fontSize: 11 }}>优先级</Text>
                  <Tag color={selectedWo?.priority === 'A' ? 'red' : selectedWo?.priority === 'B' ? 'orange' : 'default'}
                    style={{ fontSize: 12, padding: '1px 7px' }}>
                    {selectedWo?.priority ?? '—'}级
                  </Tag>
                </Space>
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>

      {/* ===== 异常提示 ===== */}
      {abnormalOps > 0 && (
        <Alert
          type="error" showIcon icon={<WarningOutlined />}
          message={`当前工单存在 ${abnormalOps} 道工序异常挂起，请联系班长/QA处理后继续生产`}
          style={{ marginBottom: 16, borderRadius: 8 }}
        />
      )}

      {/* ===== 工序流程横向导航条 ===== */}
      <Card style={{ marginBottom: 16, borderRadius: 10 }} bodyStyle={{ padding: '12px 16px 8px' }}>
        <div style={{ marginBottom: 6 }}>
          <Text strong style={{ fontSize: 13 }}>📋 工序流转进度</Text>
          <Text type="secondary" style={{ fontSize: 11, marginLeft: 10 }}>
            已完成 {completedOps}/{totalVisible} 道 · 总进度 {overallProgress}%
          </Text>
        </div>
        <div style={{ overflowX: 'auto', paddingBottom: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', minWidth: activeOps.length * 80 }}>
            {activeOps.map((op, idx) => {
              const exec = getOrInitExec(op.code);
              const workshopColor = WORKSHOP_COLOR[op.workshop] || '#1890ff';
              const isDone = exec.status === 'completed';
              const isActive = exec.status === 'in_progress';
              const isAbnormal = exec.status === 'abnormal';
              return (
                <React.Fragment key={op.code}>
                  {/* 节点 */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 64, cursor: 'pointer' }}
                    onClick={() => setDetailDrawerOp(op)}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: isDone ? '#52c41a' : isAbnormal ? '#ff4d4f' : isActive ? '#faad14' : workshopColor,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 700, color: '#fff',
                      border: isActive ? '3px solid #fff' : '2px solid rgba(0,0,0,0.08)',
                      boxShadow: isActive ? `0 0 0 2px #faad14` : isDone ? '0 0 0 2px #52c41a' : 'none',
                      transition: 'all 0.2s',
                    }}>
                      {isDone ? '✓' : isAbnormal ? '!' : op.seq}
                    </div>
                    <Text style={{
                      fontSize: 10, textAlign: 'center', marginTop: 3, lineHeight: '13px',
                      color: isDone ? '#52c41a' : isActive ? '#faad14' : isAbnormal ? '#ff4d4f' : '#595959',
                      fontWeight: isActive ? 700 : 400,
                      maxWidth: 60, wordBreak: 'break-all',
                    }}>
                      {op.name}
                    </Text>
                  </div>
                  {/* 连接线（最后一个不显示） */}
                  {idx < activeOps.length - 1 && (
                    <div style={{
                      flex: 1, height: 3, minWidth: 10,
                      background: isDone ? '#52c41a' : '#e8e8e8',
                      borderRadius: 2, margin: '0 2px', marginBottom: 18,
                      transition: 'background 0.3s',
                    }} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </Card>

      {/* ===== 工序卡片网格 ===== */}
      <Row gutter={[16, 16]}>
        {activeOps.map((op, idx) => {
          const exec = getOrInitExec(op.code);
          const enabledStages = getEnabledStages(op);
          const completedStages = enabledStages.filter(s => exec.stages[s.code]?.status === 'completed').length;
          const stageProgress = enabledStages.length > 0
            ? Math.round((completedStages / enabledStages.length) * 100) : 0;
          const statusCfg = STATUS_LABEL[exec.status] || STATUS_LABEL.ready;
          const workshopColor = WORKSHOP_COLOR[op.workshop] || '#1890ff';

          // 锁定判断（上工序未完成）
          const prevOpIdx = idx - 1;
          const prevOpCompleted = prevOpIdx < 0
            || getOrInitExec(activeOps[prevOpIdx].code).status === 'completed';
          const isLocked = !prevOpCompleted
            && exec.status !== 'in_progress'
            && exec.status !== 'completed';

          // 超时检测（进站时间 > 30 分钟）
          const isOvertime = exec.status === 'in_progress' && exec.inTime
            ? (Date.now() - new Date(exec.inTime.replace(/\//g, '-')).getTime()) / 60000 > 30
            : false;

          return (
            <Col key={op.code} xs={24} sm={12} md={8} lg={6}>
              <Card
                hoverable={!isLocked && exec.status !== 'completed'}
                style={{
                  borderRadius: 12,
                  border: exec.status === 'in_progress' ? '2px solid #faad14'
                    : exec.status === 'completed' ? '2px solid #52c41a'
                    : exec.status === 'abnormal' ? '2px solid #ff4d4f'
                    : isOvertime ? '2px solid #ff7875'
                    : '1px solid #e8e8e8',
                  background: isLocked ? '#fafafa'
                    : exec.status === 'completed' ? '#f6ffed'
                    : exec.status === 'in_progress' ? '#fffbe6'
                    : exec.status === 'abnormal' ? '#fff2f0'
                    : '#fff',
                  opacity: isLocked ? 0.72 : 1,
                  transition: 'all 0.2s',
                }}
                bodyStyle={{ padding: '14px 16px' }}
                extra={
                  <Tooltip title="查看详情">
                    <Button
                      type="text" size="small"
                      icon={<InfoCircleOutlined />}
                      style={{ color: '#8c8c8c' }}
                      onClick={e => { e.stopPropagation(); setDetailDrawerOp(op); }}
                    />
                  </Tooltip>
                }
              >
                {/* 序号 + 名称 */}
                <Row align="middle" justify="space-between" style={{ marginBottom: 8 }}>
                  <Col>
                    <Space>
                      <Avatar
                        size={32}
                        style={{ background: workshopColor, fontSize: 13, fontWeight: 700, flexShrink: 0 }}
                      >
                        {op.seq}
                      </Avatar>
                      <div>
                        <Text strong style={{ fontSize: 15, display: 'block', lineHeight: '20px' }}>
                          {op.name}
                        </Text>
                        {op.alias && (
                          <Text type="secondary" style={{ fontSize: 11 }}>{op.alias}</Text>
                        )}
                      </div>
                    </Space>
                  </Col>
                  <Col>
                    {exec.status === 'completed' &&
                      <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 22 }} />}
                    {exec.status === 'abnormal' &&
                      <ExclamationCircleOutlined style={{ color: '#ff4d4f', fontSize: 22 }} />}
                    {isLocked && exec.status !== 'completed' &&
                      <Badge status="default" text={<Text type="secondary" style={{ fontSize: 11 }}>等待上工序</Text>} />}
                    {isOvertime && exec.status === 'in_progress' && (
                      <Tag color="red" style={{ fontSize: 10 }}>⚠️ 超时</Tag>
                    )}
                  </Col>
                </Row>

                {/* 车间标签 */}
                <Tag color={workshopColor} style={{ fontSize: 11, marginBottom: 8 }}>
                  🏭 {op.workshop}
                </Tag>

                {/* 工序代码 */}
                <div style={{ marginBottom: 6 }}>
                  <Text type="secondary" style={{ fontSize: 11, fontFamily: 'monospace' }}>{op.code}</Text>
                </div>

                {/* 阶段进度 */}
                <div style={{ marginBottom: 10 }}>
                  <Row justify="space-between" style={{ marginBottom: 4 }}>
                    <Text style={{ fontSize: 12, color: '#595959' }}>
                      阶段：{completedStages}/{enabledStages.length}
                    </Text>
                    <Text style={{ fontSize: 12, color: statusCfg.color, fontWeight: 600 }}>
                      {statusCfg.label}
                    </Text>
                  </Row>
                  <Progress
                    percent={stageProgress}
                    size="small"
                    strokeColor={statusCfg.color}
                    showInfo={false}
                    trailColor="#f0f0f0"
                  />
                </div>

                {/* 特殊标记 */}
                <Row gutter={4} style={{ marginBottom: 10 }}>
                  {op.hasQcInspection && (
                    <Col>
                      <Tag color="magenta" style={{ fontSize: 10 }}>
                        <FileTextOutlined /> QC检验
                      </Tag>
                    </Col>
                  )}
                  {enabledStages.some(s => s.requiresESign) && (
                    <Col><Tag color="purple" style={{ fontSize: 10 }}>电子签名</Tag></Col>
                  )}
                  {enabledStages.some(s => s.requiresDualSign) && (
                    <Col><Tag color="geekblue" style={{ fontSize: 10 }}>双人复核</Tag></Col>
                  )}
                  {op.remark && (
                    <Col>
                      <Tooltip title={op.remark}>
                        <Tag color="default" style={{ fontSize: 10, cursor: 'help' }}>备注</Tag>
                      </Tooltip>
                    </Col>
                  )}
                </Row>

                {/* 进站时间 */}
                {exec.inTime && (
                  <div style={{ marginBottom: 8 }}>
                    <Text style={{ fontSize: 11, color: '#8c8c8c' }}>
                      <ClockCircleOutlined /> 进站：{exec.inTime}
                    </Text>
                  </div>
                )}
                {exec.outTime && (
                  <div style={{ marginBottom: 8 }}>
                    <Text style={{ fontSize: 11, color: '#52c41a' }}>
                      <CheckCircleOutlined /> 出站：{exec.outTime}
                    </Text>
                  </div>
                )}

                {/* 操作按钮 */}
                <Button
                  type={exec.status === 'in_progress' ? 'primary' : 'default'}
                  danger={exec.status === 'abnormal'}
                  size="large"
                  block
                  icon={
                    isLocked ? <ClockCircleOutlined />
                      : exec.status === 'completed' ? <CheckCircleOutlined />
                      : exec.status === 'in_progress' ? <ThunderboltOutlined />
                      : <PlayCircleOutlined />
                  }
                  disabled={isLocked || exec.status === 'completed'}
                  onClick={() => handleStartOp(op)}
                  style={{
                    height: 44, fontSize: 14, fontWeight: 600,
                    background: exec.status === 'in_progress' ? '#faad14' : undefined,
                    borderColor: exec.status === 'in_progress' ? '#faad14' : undefined,
                  }}
                >
                  {isLocked ? '等待上工序完成'
                    : exec.status === 'completed' ? '已完成'
                    : exec.status === 'in_progress' ? '继续执行'
                    : '开始执行'}
                </Button>
              </Card>
            </Col>
          );
        })}
      </Row>

      {/* ===== 说明 ===== */}
      <Alert
        style={{ marginTop: 20, borderRadius: 10 }}
        type="info" showIcon
        message="GMP操作说明"
        description={
          <Space direction="vertical" size={4}>
            <Text style={{ fontSize: 13 }}>• 工序顺序：称量配料 → 混合 → 制粒干燥 → 内包装 → 内包清场 → 外包装，前序未完成不可跳过</Text>
            <Text style={{ fontSize: 13 }}>• 「称量配料」工序进站后自动启动称量防错四重核对（品名/批号/规格/数量，±0.5%偏差预警）</Text>
            <Text style={{ fontSize: 13 }}>• 每道工序「前清场」阶段内嵌清场合格证验证（固体车间有效期72h，超期自动锁定）</Text>
            <Text style={{ fontSize: 13 }}>• 「开工前确认」阶段内嵌9项生产前再确认清单，未全部确认禁止开工</Text>
            <Text style={{ fontSize: 13 }}>• 混合/内包装/外包装为关键工序，完成后自动触发质量门控，不合格→BLOCKED+MAJOR偏差</Text>
            <Text style={{ fontSize: 13 }}>• 所有工序完成后，进入「批包装EBR」菜单自动汇总生成批记录报告，物料平衡96.0%～102.0%</Text>
          </Space>
        }
      />

      {/* ===== 工牌扫码登录 Modal ===== */}
      <Modal
        title={
          <Space>
            <ScanOutlined style={{ color: '#1890ff' }} />
            <span>工牌扫码登录</span>
          </Space>
        }
        open={loginModal}
        onCancel={() => setLoginModal(false)}
        closable={true}
        maskClosable={true}
        footer={null}
        centered
      >
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🪪</div>
          <Title level={5} style={{ color: '#595959' }}>请扫描工牌或输入工号登录</Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            PAD 操作前必须绑定操作员身份，符合 ALCOA+ 数据可追溯要求
          </Text>
          <div style={{ marginTop: 24, marginBottom: 16 }}>
            <Input
              ref={badgeInputRef as React.RefObject<any>}
              size="large"
              style={{ width: 280, fontSize: 16, textAlign: 'center', fontFamily: 'monospace' }}
              placeholder="扫描工牌 / 输入工号"
              value={badgeInput}
              onChange={e => setBadgeInput(e.target.value)}
              onPressEnter={handleBadgeScan}
              prefix={<BarcodeOutlined style={{ color: '#8c8c8c' }} />}
              autoFocus
            />
          </div>
          <Space direction="vertical" style={{ width: '100%' }} size={10}>
            <Button
              type="primary" size="large" block
              icon={<ScanOutlined />}
              onClick={handleBadgeScan}
              style={{ height: 48, fontSize: 15 }}
            >
              确认登录
            </Button>
            <Button
              size="large" block
              icon={<UserOutlined />}
              onClick={handleSimulateScan}
              style={{ height: 44 }}
            >
              模拟扫码（演示：工号 1001）
            </Button>
          </Space>
          <Divider />
          <div style={{ textAlign: 'left' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>可用工牌（演示）：</Text>
            <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {MOCK_OPERATORS.map(o => (
                <Tag
                  key={o.id}
                  color="blue"
                  style={{ cursor: 'pointer', fontSize: 12 }}
                  onClick={() => {
                    setBadgeInput(o.id);
                    setTimeout(() => {
                      setCurrentOperator(o);
                      setLoginModal(false);
                      message.success(`欢迎，${o.name}（${o.role}）！`);
                    }, 200);
                  }}
                >
                  {o.id} — {o.name}（{o.role}）
                </Tag>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* 确认 Modal 已移除，点击卡片直接进入执行页 */}

      {/* ===== 工序详情 Drawer ===== */}
      <Drawer
        title={
          detailDrawerOp
            ? <Space>
                <SettingOutlined />
                <span>{detailDrawerOp.seq} — {detailDrawerOp.name}</span>
                <Tag color={WORKSHOP_COLOR[detailDrawerOp.workshop]}>{detailDrawerOp.workshop}</Tag>
              </Space>
            : '工序详情'
        }
        placement="right"
        width={400}
        open={!!detailDrawerOp}
        onClose={() => setDetailDrawerOp(null)}
      >
        {detailDrawerOp && detailExec && (
          <Space direction="vertical" style={{ width: '100%' }} size={16}>
            {/* 基础信息 */}
            <Card size="small" style={{ background: '#f0f5ff' }}>
              <Row gutter={[0, 8]}>
                <Col span={10}><Text type="secondary" style={{ fontSize: 12 }}>工序编码</Text></Col>
                <Col span={14}><Text strong style={{ fontSize: 12, fontFamily: 'monospace' }}>{detailDrawerOp.code}</Text></Col>
                <Col span={10}><Text type="secondary" style={{ fontSize: 12 }}>所属车间</Text></Col>
                <Col span={14}>
                  <Tag color={WORKSHOP_COLOR[detailDrawerOp.workshop]} style={{ fontSize: 11 }}>
                    {detailDrawerOp.workshop}
                  </Tag>
                </Col>
                {detailDrawerOp.alias && <>
                  <Col span={10}><Text type="secondary" style={{ fontSize: 12 }}>工序别名</Text></Col>
                  <Col span={14}><Text style={{ fontSize: 12 }}>{detailDrawerOp.alias}</Text></Col>
                </>}
                {detailDrawerOp.remark && <>
                  <Col span={10}><Text type="secondary" style={{ fontSize: 12 }}>备注</Text></Col>
                  <Col span={14}><Text style={{ fontSize: 12, color: '#faad14' }}>{detailDrawerOp.remark}</Text></Col>
                </>}
                <Col span={10}><Text type="secondary" style={{ fontSize: 12 }}>执行状态</Text></Col>
                <Col span={14}>
                  <Tag color={STATUS_LABEL[detailExec.status]?.color} style={{ fontSize: 12 }}>
                    {STATUS_LABEL[detailExec.status]?.label}
                  </Tag>
                </Col>
              </Row>
            </Card>

            {/* 数量统计（如已进站） */}
            {detailExec.status !== 'ready' && detailExec.status !== 'locked' && (
              <Card size="small" title={<Text strong style={{ fontSize: 13 }}>数量统计</Text>}>
                <Row gutter={16}>
                  <Col span={12}>
                    <Statistic title="完工" value={detailExec.finishQty ?? 0} suffix="件"
                      valueStyle={{ fontSize: 18, color: '#1890ff' }} />
                  </Col>
                  <Col span={12}>
                    <Statistic title="合格" value={detailExec.goodQty ?? 0} suffix="件"
                      valueStyle={{ fontSize: 18, color: '#52c41a' }} />
                  </Col>
                  <Col span={12}>
                    <Statistic title="不良" value={detailExec.badQty ?? 0} suffix="件"
                      valueStyle={{ fontSize: 18, color: '#ff4d4f' }} />
                  </Col>
                  <Col span={12}>
                    <Statistic title="报废" value={detailExec.scrapQty ?? 0} suffix="件"
                      valueStyle={{ fontSize: 18, color: '#8c8c8c' }} />
                  </Col>
                </Row>
              </Card>
            )}

            {/* 阶段时间线 */}
            <Card size="small" title={<Text strong style={{ fontSize: 13 }}>阶段执行情况</Text>}>
              <Timeline
                items={detailStages.map(s => {
                  const exec = detailExec.stages[s.code];
                  const done = exec?.status === 'completed';
                  return {
                    color: done ? 'green' : 'gray',
                    dot: done ? <CheckCircleOutlined style={{ color: '#52c41a' }} /> : undefined,
                    children: (
                      <div>
                        <Text strong style={{ fontSize: 12, color: done ? '#389e0d' : '#8c8c8c' }}>
                          {STAGE_ICON[s.code]} {s.name}
                        </Text>
                        {done && exec?.endTime && (
                          <div>
                            <Text type="secondary" style={{ fontSize: 11 }}>
                              完成：{exec.endTime}
                            </Text>
                          </div>
                        )}
                        {s.requiresESign && (
                          <Tag color="purple" style={{ fontSize: 10 }}>签名</Tag>
                        )}
                        {s.requiresDualSign && (
                          <Tag color="geekblue" style={{ fontSize: 10 }}>双审</Tag>
                        )}
                      </div>
                    ),
                  };
                })}
              />
            </Card>

            {/* 特殊说明 */}
            {detailDrawerOp.hasQcInspection && (
              <Alert
                type="info" showIcon
                message={`本工序关联 QC 检验记录：${detailDrawerOp.inspectionRecordName}`}
                style={{ fontSize: 12 }}
              />
            )}
          </Space>
        )}
      </Drawer>
    </div>
  );
};

export default PadOperationListPage;

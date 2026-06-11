import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Button, Layout, Typography, Tag, Space, Drawer, Modal, Form,
  Input, message, Badge, Alert, Steps, Row, Col, Card,
  Progress, Statistic, Timeline, Divider
} from 'antd';
import {
  LeftOutlined, PauseCircleOutlined, WarningOutlined, ClockCircleOutlined,
  FileTextOutlined, PhoneOutlined, CheckCircleOutlined, LoadingOutlined,
  LockOutlined, TeamOutlined, ExclamationCircleOutlined, InfoCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import type {
  OperationDef, WorkOrder, StageCode, StageExecution,
  OperationExecution, StageConfig, OperationPhase
} from './padExecutionData';
import {
  getEnabledStages, initOperationExecution, getCurrentStage,
  isOperationComplete, buildFloatCells, VISIBLE_OPERATIONS, STAGE_ICON,
  getAllPhasesForOperation
} from './padExecutionData';
import DynamicPhaseStage from './stages/DynamicPhaseStage';
import PreCleanStage from './stages/PreCleanStage';
import CheckInStage from './stages/CheckInStage';
import MatVerifyStage from './stages/MatVerifyStage';
import FirstPieceStage from './stages/FirstPieceStage';
import DataCollectStage from './stages/DataCollectStage';
import SelfCheckStage from './stages/SelfCheckStage';
import PostCleanStage from './stages/PostCleanStage';
import ReportStage from './stages/ReportStage';
import CheckOutStage from './stages/CheckOutStage';
import FloatTicketViewer from './FloatTicketViewer';
import QcInspectionModal from './components/QcInspectionModal';
import { getPadTaskList, updatePadTaskStatus } from '../../api/padTasks';
import type { PadTaskRecord } from '../../api/padTasks';

// ── 数字小键盘密码输入组件 ──────────────────────────────────────────
const NumPadInput: React.FC<{
  value: string;
  onChange: (v: string) => void;
  maxLen?: number;
  label?: string;
}> = ({ value, onChange, maxLen = 6, label }) => {
  const keys = ['1','2','3','4','5','6','7','8','9','','0','⌫'];

  const handleKey = (k: string) => {
    if (k === '⌫') {
      onChange(value.slice(0, -1));
    } else if (k === '') {
      // empty placeholder
    } else if (value.length < maxLen) {
      onChange(value + k);
    }
  };

  const dots = Array.from({ length: maxLen }, (_, i) => i < value.length);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      {label && (
        <div style={{ fontSize: 14, color: '#595959', fontWeight: 600 }}>{label}</div>
      )}
      <div style={{
        display: 'flex', gap: 14, alignItems: 'center',
        background: '#f5f5f5', borderRadius: 12, padding: '12px 24px',
        border: '2px solid #d9d9d9', minWidth: 200, justifyContent: 'center',
      }}>
        {dots.map((filled, i) => (
          <div key={i} style={{
            width: 14, height: 14, borderRadius: '50%',
            background: filled ? '#722ed1' : '#d9d9d9',
            transition: 'background 0.15s',
            boxShadow: filled ? '0 0 6px rgba(114,46,209,0.5)' : 'none',
          }} />
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, width: 264 }}>
        {keys.map((k, i) => (
          <button
            key={i}
            onClick={() => handleKey(k)}
            disabled={k === ''}
            style={{
              height: 64,
              fontSize: k === '⌫' ? 22 : 26,
              fontWeight: 700,
              background: k === '⌫' ? '#fff1f0' : k === '' ? 'transparent' : '#fff',
              color: k === '⌫' ? '#ff4d4f' : '#1a1a1a',
              border: k === '' ? 'none' : '1.5px solid #e0e0e0',
              borderRadius: 12,
              cursor: k === '' ? 'default' : 'pointer',
              boxShadow: k === '' ? 'none' : '0 2px 6px rgba(0,0,0,0.07)',
              transition: 'all 0.12s',
              outline: 'none',
              userSelect: 'none',
            }}
            onMouseDown={e => { if (k !== '') e.currentTarget.style.transform = 'scale(0.93)'; }}
            onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
            onTouchStart={e => { if (k !== '') e.currentTarget.style.transform = 'scale(0.93)'; }}
            onTouchEnd={e => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            {k}
          </button>
        ))}
      </div>
    </div>
  );
};

const { Header, Content, Footer } = Layout;
const { Text, Title } = Typography;

// 超时阈值（分钟）
const TIMEOUT_WARN_MINUTES = 30;

interface PadExecutionPageProps {
  operation: OperationDef;
  workOrder: WorkOrder;
  onBack: () => void;
  execMap: Record<string, OperationExecution>;
  onUpdateExec: (code: string, exec: OperationExecution) => void;
}

const PadExecutionPage: React.FC<PadExecutionPageProps> = ({
  operation, workOrder, onBack, execMap, onUpdateExec
}) => {
  const [execution, setExecution] = useState<OperationExecution>(
    () => execMap[operation.code] || initOperationExecution(operation.code)
  );
  const [padTask, setPadTask] = useState<PadTaskRecord | null>(null);

  // ── 从 API 拉取关联的 PAD 任务 ──────────────────────────────────────
  const loadTaskFromApi = useCallback(async () => {
    try {
      const resp = await getPadTaskList({ status: undefined }) as any;
      const list: PadTaskRecord[] = resp?.data ?? [];
      const matched = list.find(t =>
        t.taskNo === workOrder.woNo ||
        (t.taskNo ?? '').includes(workOrder.woNo) ||
        workOrder.woNo.includes(t.taskNo ?? '')
      );
      if (matched) setPadTask(matched);
    } catch { /* API 不可用时不影响本地执行 */ }
  }, [workOrder.woNo]);

  // 当工序执行状态变化时同步到后端
  const syncStatusToApi = useCallback(async (newStatus: string) => {
    if (!padTask?.id) return;
    try {
      await updatePadTaskStatus(padTask.id, { status: newStatus });
    } catch { /* 后端同步失败不阻塞前端 */ }
  }, [padTask]);

  useEffect(() => { loadTaskFromApi(); }, [loadTaskFromApi]);

  // 工序开始时同步 IN_PROGRESS
  useEffect(() => {
    if (execution.status === 'in_progress' && padTask && padTask.status !== 'IN_PROGRESS') {
      syncStatusToApi('IN_PROGRESS');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [execution.status]);

  // 工序完成时同步 COMPLETED
  useEffect(() => {
    if (execution.status === 'completed' && padTask) {
      syncStatusToApi('COMPLETED');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [execution.status]);

  // 从工序主数据加载阶段 phases 配置（按 masterOpCode 查找）
  const masterPhases = getAllPhasesForOperation(operation.masterOpCode);
  const [currentStageCode, setCurrentStageCode] = useState<StageCode | null>(null);
  const [floatOpen, setFloatOpen] = useState(false);
  const [eSignModal, setESignModal] = useState(false);
  const [eSignCallback, setESignCallback] = useState<(() => void) | null>(null);
  const [eSignPwd, setESignPwd] = useState('');
  const [pauseModal, setPauseModal] = useState(false);
  const [abnormalModal, setAbnormalModal] = useState(false);
  const [abnormalDesc, setAbnormalDesc] = useState('');
  const [abnormalType, setAbnormalType] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [stageEnteredAt, setStageEnteredAt] = useState<Date>(new Date());
  const [stageElapsedMin, setStageElapsedMin] = useState(0);
  const [isTimeout, setIsTimeout] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [qcModalOpen, setQcModalOpen] = useState(false);
  const [form] = Form.useForm();
  const stageEnterRef = useRef<Date>(new Date());

  const enabledStages = getEnabledStages(operation);

  useEffect(() => {
    const cur = getCurrentStage(operation, execution);
    setCurrentStageCode(cur);
    if (cur) {
      const now = new Date();
      setStageEnteredAt(now);
      stageEnterRef.current = now;
      setIsTimeout(false);
    }
  }, [operation, execution]);

  // Clock + timeout tracking
  useEffect(() => {
    const t = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      const elapsed = Math.floor((now.getTime() - stageEnterRef.current.getTime()) / 60000);
      setStageElapsedMin(elapsed);
      if (elapsed >= TIMEOUT_WARN_MINUTES && !isTimeout) {
        setIsTimeout(true);
        message.warning({ content: `⚠️ 当前阶段已超过 ${TIMEOUT_WARN_MINUTES} 分钟，请及时处理！`, duration: 8 });
      }
    }, 1000);
    return () => clearInterval(t);
  }, [isTimeout]);

  useEffect(() => {
    onUpdateExec(operation.code, execution);
  }, [execution, operation.code, onUpdateExec]);

  // Find adjacent operations
  const visibleOps = VISIBLE_OPERATIONS;
  const myIdx = visibleOps.findIndex(o => o.code === operation.code);
  const prevOp = myIdx > 0 ? visibleOps[myIdx - 1] : undefined;
  const nextOp = myIdx < visibleOps.length - 1 ? visibleOps[myIdx + 1] : undefined;

  const handleESign = useCallback((cb: () => void) => {
    setESignCallback(() => cb);
    setESignPwd('');
    setESignModal(true);
  }, []);

  const handleESignConfirm = () => {
    if (eSignPwd !== '1234') {
      message.error('密码错误，请重新输入');
      return;
    }
    setESignModal(false);
    if (eSignCallback) eSignCallback();
    setESignCallback(null);
  };

  const handleStageComplete = (stageCode: StageCode, data: Record<string, unknown>) => {
    const now = new Date().toLocaleString('zh-CN');
    setExecution(prev => {
      const stages = { ...prev.stages };
      stages[stageCode] = {
        ...stages[stageCode],
        status: 'completed',
        endTime: now,
        data,
      };

      let extra: Partial<OperationExecution> = {};
      if (stageCode === 'CHECK_IN') {
        extra = { inTime: now, status: 'in_progress' };
      }
      if (stageCode === 'CHECK_OUT') {
        extra = { outTime: now, status: 'completed' };
      }
      if (stageCode === 'PRE_CLEAN') {
        extra = { preCleanDone: true };
      }
      if (stageCode === 'FIRST_PIECE') {
        extra = { firstPiecePassed: true };
      }
      // Reset timeout on next stage
      stageEnterRef.current = new Date();
      setIsTimeout(false);
      return { ...prev, ...extra, stages };
    });
    const stageName = operation.stages.find(s => s.code === stageCode)?.name ?? stageCode;
    message.success(`✅ ${stageName} 已完成！`);

    // 触发 QC 检验记录弹窗（自检/数据采集完成后，若工序关联QC检验）
    if ((stageCode === 'SELF_CHECK' || stageCode === 'DATA_COLLECT') && operation.hasQcInspection) {
      setTimeout(() => setQcModalOpen(true), 600);
    }
  };

  /**
   * REPORT 阶段专用回调（支持多次报工）
   * isLastReport=false → 追加记录，重置 REPORT 阶段为 pending，推进到 DATA_COLLECT 等待下次
   * isLastReport=true  → 追加记录，标记 REPORT 为 completed，触发 POST_CLEAN
   */
  const handleReportComplete = (data: Record<string, unknown>, isLastReport: boolean) => {
    const now = new Date().toLocaleString('zh-CN');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const newRecord = data.newRecord as any;
    setExecution(prev => {
      const stages = { ...prev.stages };
      const prevRecords = prev.reportRecords || [];
      const updatedRecords = [...prevRecords, newRecord];

      if (isLastReport) {
        // 末次报工：REPORT → completed，后续逻辑自动推进到 POST_CLEAN
        stages['REPORT'] = {
          ...stages['REPORT'],
          status: 'completed',
          endTime: now,
          data: { ...stages['REPORT']?.data, lastRecord: newRecord },
        };
      } else {
        // 非末次报工：REPORT 阶段状态重置为 pending（允许再次执行）
        // DATA_COLLECT 同样重置（允许下次抽检数据采集）
        stages['REPORT'] = {
          ...stages['REPORT'],
          status: 'pending',
          data: { ...stages['REPORT']?.data },
        };
        if (stages['DATA_COLLECT']) {
          stages['DATA_COLLECT'] = {
            ...stages['DATA_COLLECT'],
            status: 'pending',
            data: {},
          };
        }
      }

      stageEnterRef.current = new Date();
      setIsTimeout(false);
      return {
        ...prev,
        reportRecords: updatedRecords,
        finishQty:  data.totalFinishQty as number,
        goodQty:    data.totalGoodQty   as number,
        badQty:     data.totalBadQty    as number,
        scrapQty:   data.totalScrapQty  as number,
        stages,
      };
    });

    if (!isLastReport) {
      message.info('报工已记录，请继续数据采集或直接进行下次报工');
    }
  };

  const handleAbnormal = () => {
    if (!abnormalDesc.trim()) { message.warning('请填写异常描述'); return; }
    setExecution(prev => ({ ...prev, status: 'abnormal' }));
    setAbnormalModal(false);
    setAbnormalDesc('');
    message.warning({ content: '⚠️ 异常已上报！当前工序已挂起，浮漂锁定，需 QA 解锁后方可继续。', duration: 6 });
  };

  const handleResumeAbnormal = () => {
    Modal.confirm({
      title: '确认解除异常挂起？',
      content: '需要班长/QA权限才能解除。请输入授权码（演示：9999）',
      onOk: () => {
        setExecution(prev => ({ ...prev, status: 'in_progress' }));
        message.success('异常已解除，工序恢复正常');
      },
    });
  };

  const completedCount = enabledStages.filter(s => execution.stages[s.code]?.status === 'completed').length;
  const totalStages = enabledStages.length;
  const progressPct = totalStages > 0 ? Math.round((completedCount / totalStages) * 100) : 0;

  const statusColor = execution.status === 'completed' ? '#52c41a'
    : execution.status === 'abnormal' ? '#ff4d4f'
    : execution.status === 'in_progress' ? '#1890ff'
    : '#8c8c8c';

  const currentStageIndex = enabledStages.findIndex(s => s.code === currentStageCode);

  const getStepStatus = (stage: StageConfig) => {
    const exec = execution.stages[stage.code];
    if (!exec) return 'wait';
    if (exec.status === 'completed') return 'finish';
    if (stage.code === currentStageCode) return 'process';
    return 'wait';
  };

  // Compute real checks for checkout
  const stageCompletionChecks = {
    allStagesDone: enabledStages
      .filter(s => s.code !== 'CHECK_OUT')
      .every(s => execution.stages[s.code]?.status === 'completed'),
    reportSubmitted: execution.stages['REPORT']?.status === 'completed',
    postCleanDone: !enabledStages.find(s => s.code === 'POST_CLEAN') ||
      execution.stages['POST_CLEAN']?.status === 'completed',
    noAbnormal: execution.status !== 'abnormal',
  };

  const renderStageContent = (stageCode: StageCode) => {
    const stageExec: StageExecution = execution.stages[stageCode] || { code: stageCode, status: 'pending' as const };
    const stageConf = operation.stages.find(s => s.code === stageCode);
    const stageEnabledIdx = enabledStages.findIndex(s => s.code === stageCode);
    const isLocked = stageEnabledIdx > currentStageIndex && stageExec.status !== 'completed';

    if (isLocked && stageExec.status !== 'completed') {
      return (
        <Card style={{ background: '#f5f5f5', textAlign: 'center', padding: 32, borderRadius: 12 }}>
          <LockOutlined style={{ fontSize: 40, color: '#bfbfbf' }} />
          <div style={{ marginTop: 16 }}>
            <Text type="secondary" style={{ fontSize: 16 }}>请先完成前序阶段</Text>
            <div style={{ marginTop: 8 }}>
              <Text type="secondary" style={{ fontSize: 13 }}>
                当前阶段：{enabledStages[currentStageIndex]?.name || '暂无'}
              </Text>
            </div>
          </div>
        </Card>
      );
    }

    // 优先使用工序主数据 phase 配置（动态渲染），fallback 到静态 Stage 组件
    const masterPhase: OperationPhase | undefined = masterPhases[stageCode];

    // CHECK_IN / REPORT / CHECK_OUT 保持专用静态组件
    const useStaticComponent = (stageCode === 'CHECK_IN' || stageCode === 'REPORT' || stageCode === 'CHECK_OUT');

    if (masterPhase && !useStaticComponent) {
      return (
        <DynamicPhaseStage
          phase={masterPhase}
          execution={stageExec}
          onComplete={d => handleStageComplete(stageCode, d)}
          onESign={handleESign}
        />
      );
    }

    switch (stageCode) {
      case 'PRE_CLEAN':
        return <PreCleanStage opName={operation.name} opCode={operation.code} content={stageConf?.content}
          execution={stageExec} onComplete={d => handleStageComplete('PRE_CLEAN', d)} onESign={handleESign} />;
      case 'CHECK_IN':
        return <CheckInStage workOrder={workOrder} prevOpName={prevOp?.name}
          execution={stageExec} onComplete={d => handleStageComplete('CHECK_IN', d)} onESign={handleESign} />;
      case 'MAT_VERIFY':
        return <MatVerifyStage opCode={operation.code} content={stageConf?.content}
          execution={stageExec} onComplete={d => handleStageComplete('MAT_VERIFY', d)} onESign={handleESign} />;
      case 'FIRST_PIECE':
        return <FirstPieceStage opCode={operation.code} content={stageConf?.content}
          execution={stageExec} onComplete={d => handleStageComplete('FIRST_PIECE', d)} onESign={handleESign} />;
      case 'DATA_COLLECT':
        return <DataCollectStage opCode={operation.code} content={stageConf?.content}
          execution={stageExec} onComplete={d => handleStageComplete('DATA_COLLECT', d)} />;
      case 'SELF_CHECK':
        return <SelfCheckStage opCode={operation.code} opName={operation.name}
          content={stageConf?.content} inspectionRecordName={operation.inspectionRecordName}
          hasQcInspection={operation.hasQcInspection}
          execution={stageExec} onComplete={d => handleStageComplete('SELF_CHECK', d)} />;
      case 'POST_CLEAN':
        return <PostCleanStage opCode={operation.code} content={stageConf?.content} nextOpName={nextOp?.name}
          execution={stageExec} onComplete={d => handleStageComplete('POST_CLEAN', d)} onESign={handleESign} />;
      case 'REPORT':
        return <ReportStage
          workOrder={workOrder}
          opCode={operation.code}
          reportRecords={execution.reportRecords || []}
          needsQcWriteback={['OP-50-GRIND1', 'OP-70-WASH2'].includes(operation.code)}
          execution={stageExec}
          onComplete={handleReportComplete}
          onESign={handleESign}
        />;
      case 'CHECK_OUT':
        return <CheckOutStage workOrder={workOrder} nextOpName={nextOp?.name}
          opName={operation.name} opCode={operation.code}
          stageCompletionChecks={stageCompletionChecks}
          reportData={execution.stages['REPORT']?.data}
          execution={stageExec} onComplete={d => handleStageComplete('CHECK_OUT', d)} onESign={handleESign} />;
      default:
        return null;
    }
  };

  const floatCells = buildFloatCells(execMap);
  const currentStageCfg = operation.stages.find(s => s.code === currentStageCode);

  return (
    <Layout style={{ height: '100%', background: '#f0f2f5', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* ===== 超时横幅 ===== */}
      {isTimeout && currentStageCode && (
        <div style={{
          background: '#ff4d4f', color: '#fff', textAlign: 'center',
          padding: '6px 0', fontSize: 14, fontWeight: 700,
          position: 'sticky', top: 0, zIndex: 200,
          animation: 'pulse 1s infinite',
        }}>
          ⚠️ 当前阶段「{currentStageCfg?.name}」已超过 {stageElapsedMin} 分钟，请加快处理！
        </div>
      )}

      {/* ===== 顶部状态栏 ===== */}
      <Header style={{
        background: execution.status === 'abnormal'
          ? 'linear-gradient(135deg, #a8071a 0%, #cf1322 100%)'
          : 'linear-gradient(135deg, #C8000A 0%, #a50008 100%)',
        height: 60,
        padding: '0 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky', top: isTimeout ? 36 : 0, zIndex: 100,
        transition: 'background 0.3s',
      }}>
        <Space size={12}>
          <Button
            icon={<LeftOutlined />}
            onClick={onBack}
            style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', height: 38 }}
          >返回</Button>
          <Text style={{ color: '#fff', fontSize: 15, fontWeight: 700 }}>🏭 YonBIP/SY 医疗器械</Text>
          <Text style={{ color: '#c5cae9', fontSize: 12 }}>工单：{workOrder.woNo}</Text>
          <Text style={{ color: '#c5cae9', fontSize: 12 }}>产品：{workOrder.productSpec}</Text>
        </Space>
        <Space size={10}>
          {execution.status === 'abnormal' && (
            <Tag color="red" style={{ fontSize: 13, fontWeight: 700, padding: '2px 10px' }}>
              <ExclamationCircleOutlined /> 异常挂起
            </Tag>
          )}
          <Tag color="gold" style={{ fontSize: 13, fontWeight: 700, padding: '2px 10px' }}>
            {operation.seq} {operation.name}
          </Tag>
          <Text style={{ color: '#c5cae9', fontSize: 12 }}>操作员：张三(1001)</Text>
          <Text style={{ color: '#9fa8da', fontSize: 12, fontFamily: 'monospace' }}>
            {currentTime.toLocaleTimeString('zh-CN')}
          </Text>
        </Space>
      </Header>

      {/* ===== 阶段导航条 ===== */}
      <div style={{
        background: '#fff',
        padding: '10px 16px 6px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        position: 'sticky', top: isTimeout ? 96 : 60, zIndex: 99,
      }}>
        <Row align="middle" gutter={12}>
          <Col flex="1">
            <div style={{ overflowX: 'auto', paddingBottom: 4 }}>
              <Steps
                size="small"
                current={currentStageIndex}
                style={{ minWidth: enabledStages.length * 110 }}
                items={enabledStages.map((s) => {
                  const exec = execution.stages[s.code];
                  const isCompleted = exec?.status === 'completed';
                  const isCurrent = s.code === currentStageCode;
                  return {
                    title: (
                      <span style={{
                        fontSize: 12, whiteSpace: 'nowrap',
                        color: isCompleted ? '#52c41a' : isCurrent ? '#1890ff' : '#8c8c8c',
                        fontWeight: isCurrent ? 700 : 400,
                      }}>
                        {STAGE_ICON[s.code]} {s.name}
                      </span>
                    ),
                    status: getStepStatus(s) as 'wait' | 'process' | 'finish' | 'error',
                    icon: isCurrent ? <LoadingOutlined style={{ color: '#1890ff' }} /> : undefined,
                  };
                })}
              />
            </div>
          </Col>
          <Col>
            <Space direction="vertical" size={2} style={{ textAlign: 'center' }}>
              <Progress
                type="circle" percent={progressPct} size={48}
                strokeColor={statusColor}
                format={() => <span style={{ fontSize: 11, fontWeight: 700 }}>{completedCount}/{totalStages}</span>}
              />
            </Space>
          </Col>
        </Row>

        {/* 工单摘要 + 计时 */}
        <Row gutter={20} style={{ marginTop: 6 }}>
          <Col><Text type="secondary" style={{ fontSize: 11 }}>批次：</Text><Text style={{ fontSize: 11, fontFamily: 'monospace' }}>{workOrder.batchNo}</Text></Col>
          <Col><Text type="secondary" style={{ fontSize: 11 }}>计划：</Text><Text strong style={{ fontSize: 11 }}>{workOrder.planQty}支</Text></Col>
          <Col><Text type="secondary" style={{ fontSize: 11 }}>车间：</Text><Text style={{ fontSize: 11 }}>{operation.workshop}</Text></Col>
          {currentStageCode && (
            <Col>
              <Text type="secondary" style={{ fontSize: 11 }}>阶段用时：</Text>
              <Text style={{ fontSize: 11, color: stageElapsedMin >= TIMEOUT_WARN_MINUTES ? '#ff4d4f' : '#1890ff', fontWeight: 600 }}>
                <ClockCircleOutlined /> {stageElapsedMin}分钟
                {stageElapsedMin >= TIMEOUT_WARN_MINUTES && ' ⚠️超时'}
              </Text>
            </Col>
          )}
          {execution.status === 'abnormal' && (
            <Col>
              <Button size="small" danger onClick={handleResumeAbnormal} icon={<CloseCircleOutlined />}>
                QA解除异常
              </Button>
            </Col>
          )}
        </Row>
      </div>

      {/* ===== 主内容区 ===== */}
      <Content style={{ padding: '14px 16px', maxWidth: 980, margin: '0 auto', width: '100%', overflowY: 'auto', flex: 1 }}>
        {/* 工序完成 */}
        {isOperationComplete(operation, execution) && (
          <Alert
            type="success" showIcon icon={<CheckCircleOutlined />}
            message={
              <Space>
                <Text strong style={{ fontSize: 16 }}>🎉 {operation.name} 全部阶段已完成！</Text>
                {nextOp && <Text>下工序：<Tag color="blue">{nextOp.name}</Tag></Text>}
              </Space>
            }
            style={{ marginBottom: 14 }}
          />
        )}

        {/* 异常横幅 */}
        {execution.status === 'abnormal' && (
          <Alert
            type="error" showIcon icon={<ExclamationCircleOutlined />}
            message="⚠️ 当前工序已异常挂起！浮漂已锁定，需 QA 解锁后方可继续生产。"
            action={<Button size="small" danger onClick={handleResumeAbnormal}>QA解除</Button>}
            style={{ marginBottom: 14 }}
          />
        )}

        {currentStageCode ? (
          <div>
            {/* 当前阶段标题卡 */}
            <Card
              style={{
                marginBottom: 14,
                background: 'linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%)',
                border: '1px solid #91d5ff',
                borderRadius: 10,
              }}
              bodyStyle={{ padding: '10px 14px' }}
            >
              <Row align="middle" justify="space-between">
                <Col>
                  <Space>
                    <Text style={{ fontSize: 24 }}>{STAGE_ICON[currentStageCode]}</Text>
                    <div>
                      <Title level={5} style={{ margin: 0, color: '#1890ff' }}>
                        当前阶段：{currentStageCfg?.name}
                        <Text style={{ fontSize: 12, color: '#8c8c8c', marginLeft: 8 }}>
                          ({currentStageIndex + 1}/{totalStages})
                        </Text>
                      </Title>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {currentStageCfg?.content}
                      </Text>
                    </div>
                  </Space>
                </Col>
                <Col>
                  <Space wrap>
                    {currentStageCfg?.requiresESign && (
                      <Tag color="purple" icon={<LockOutlined />} style={{ fontSize: 11 }}>强制签名</Tag>
                    )}
                    {currentStageCfg?.requiresDualSign && (
                      <Tag color="magenta" icon={<TeamOutlined />} style={{ fontSize: 11 }}>双人复核</Tag>
                    )}
                    <Tag color="blue" style={{ fontSize: 11 }}>
                      进入：{stageEnteredAt.toLocaleTimeString('zh-CN')}
                    </Tag>
                  </Space>
                </Col>
              </Row>
            </Card>

            {/* 阶段内容 */}
            {renderStageContent(currentStageCode)}

            {/* 已完成阶段折叠 */}
            {completedCount > 0 && (
              <Card
                size="small"
                title={
                  <Space>
                    <CheckCircleOutlined style={{ color: '#52c41a' }} />
                    <Text type="secondary" style={{ fontSize: 12 }}>已完成阶段（{completedCount}个）</Text>
                    <Button type="link" size="small" style={{ fontSize: 11 }} onClick={() => setHistoryOpen(true)}>
                      查看详情
                    </Button>
                  </Space>
                }
                style={{ marginTop: 14 }}
              >
                <Row gutter={[6, 6]}>
                  {enabledStages
                    .filter(s => execution.stages[s.code]?.status === 'completed')
                    .map(s => (
                      <Col key={s.code}>
                        <Tag color="success" style={{ fontSize: 12, padding: '3px 8px' }}>
                          {STAGE_ICON[s.code]} {s.name} ✓
                        </Tag>
                      </Col>
                    ))}
                </Row>
              </Card>
            )}
          </div>
        ) : (
          // 全部完成
          <Card style={{ borderRadius: 12 }}>
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <CheckCircleOutlined style={{ fontSize: 72, color: '#52c41a' }} />
              <Title level={3} style={{ marginTop: 16, color: '#52c41a' }}>工序全部完成！</Title>
              <Text type="secondary">所有阶段均已完成，电子浮漂已更新，可进行工序流转</Text>
              <Divider />
              <Row gutter={32} justify="center">
                <Col>
                  <Statistic title="完工数量" value={execution.finishQty ?? 0} suffix="件" valueStyle={{ color: '#1890ff' }} />
                </Col>
                <Col>
                  <Statistic title="合格数量" value={execution.goodQty ?? 0} suffix="件" valueStyle={{ color: '#52c41a' }} />
                </Col>
                <Col>
                  <Statistic title="不良数量" value={execution.badQty ?? 0} suffix="件" valueStyle={{ color: '#ff4d4f' }} />
                </Col>
                <Col>
                  <Statistic title="报废数量" value={execution.scrapQty ?? 0} suffix="件" valueStyle={{ color: '#8c8c8c' }} />
                </Col>
                {(execution.reportRecords?.length ?? 0) > 0 && (
                  <Col>
                    <Statistic title="报工次数" value={execution.reportRecords?.length ?? 0} suffix="次" valueStyle={{ color: '#722ed1' }} />
                  </Col>
                )}
              </Row>
              {nextOp && (
                <div style={{ marginTop: 20 }}>
                  <Text>下工序：</Text>
                  <Tag color="blue" style={{ fontSize: 14, padding: '4px 14px' }}>
                    {nextOp.seq} {nextOp.name} — {nextOp.workshop}
                  </Tag>
                </div>
              )}
            </div>
          </Card>
        )}
      </Content>

      {/* ===== 底部操作栏 ===== */}
      <Footer style={{
        background: '#fff',
        padding: '10px 20px',
        boxShadow: '0 -2px 8px rgba(0,0,0,0.08)',
        position: 'sticky', bottom: 0, zIndex: 99,
      }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space size={10}>
              <Button
                size="large"
                icon={<PauseCircleOutlined />}
                style={{ height: 48, fontSize: 14, minWidth: 100, background: '#faad14', color: '#fff', border: 'none' }}
                onClick={() => setPauseModal(true)}
                disabled={execution.status === 'abnormal'}
              >暂 停</Button>
              <Button
                size="large" danger icon={<WarningOutlined />}
                style={{ height: 48, fontSize: 14, minWidth: 110 }}
                onClick={() => setAbnormalModal(true)}
                disabled={execution.status === 'abnormal'}
              >异常上报</Button>
            </Space>
          </Col>
          <Col>
            <Space size={10} align="center">
              <div style={{ textAlign: 'right' }}>
                <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
                  浮漂：{workOrder.floatBarcode}
                </Text>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  <ClockCircleOutlined /> 进度 {completedCount}/{totalStages}
                </Text>
              </div>
              <Progress percent={progressPct} style={{ width: 100 }} size="small" strokeColor={statusColor} showInfo={false} />
              <Text strong style={{ fontSize: 14, color: statusColor }}>{progressPct}%</Text>
            </Space>
          </Col>
        </Row>
      </Footer>

      {/* ===== 浮动按钮 ===== */}
      <div style={{ position: 'fixed', bottom: 72, right: 16, display: 'flex', flexDirection: 'column', gap: 10, zIndex: 200 }}>
        <Button
          type="primary" shape="circle" size="large"
          icon={<FileTextOutlined />}
          title="电子浮漂"
          style={{ width: 50, height: 50, fontSize: 20, background: '#C8000A', border: 'none', boxShadow: '0 4px 12px rgba(200,0,10,0.4)' }}
          onClick={() => setFloatOpen(true)}
        />
        <Button
          shape="circle" size="large" icon={<PhoneOutlined />}
          title="呼叫班长"
          style={{ width: 50, height: 50, fontSize: 20, background: '#ff4d4f', color: '#fff', border: 'none', boxShadow: '0 4px 12px rgba(255,77,79,0.4)' }}
          onClick={() => message.info({ content: '班长呼叫已发出，请等待响应 📞', duration: 4 })}
        />
        <Badge count={completedCount} style={{ backgroundColor: '#52c41a' }}>
          <Button
            shape="circle" size="large" icon={<InfoCircleOutlined />}
            title="执行记录"
            style={{ width: 50, height: 50, fontSize: 18, border: '2px solid #1890ff', color: '#1890ff' }}
            onClick={() => setHistoryOpen(true)}
          />
        </Badge>
        {operation.hasQcInspection && (
          <Button
            shape="circle" size="large"
            icon={<span style={{ fontSize: 20 }}>🔬</span>}
            title="QC检验记录"
            style={{ width: 50, height: 50, background: '#eb2f96', color: '#fff', border: 'none', boxShadow: '0 4px 12px rgba(235,47,150,0.4)' }}
            onClick={() => setQcModalOpen(true)}
          />
        )}
      </div>

      {/* ===== QC 检验记录弹窗 ===== */}
      {/* 业务逻辑：
          • 单记录模式（OP-10机床成型、OP-70清洗二等）：inspectionRecordName 指定单张记录
          • 双记录模式（OP-50研磨一 自检阶段）：dualInspectionRecords 指定两张记录顺序生成
            ① 《数控机床成型检验记录》DK/QR-067 → ② 《根管锉超声波清洗检验记录》DK/QR-119
          • 检验完成后通过 onInspectionComplete 回写合格数量至报工阶段
      */}
      {operation.hasQcInspection && (
        <QcInspectionModal
          open={qcModalOpen}
          onClose={() => setQcModalOpen(false)}
          workOrder={workOrder}
          inspectionRecordName={operation.inspectionRecordName || '半成品检验记录'}
          dualInspectionRecords={operation.dualInspectionRecords}
          opName={operation.name}
          opCode={operation.code}
          onInspectionComplete={(passQty, ngQty) => {
            // 回写合格数量到报工阶段数据（供 REPORT 阶段展示 QA 已确认的合格数量）
            setExecution(prev => ({
              ...prev,
              goodQty: passQty,
              badQty: ngQty,
            }));
            message.success({
              content: `✅ QC检验完成！合格数量 ${passQty} 支已回写至报工阶段`,
              duration: 5,
            });
          }}
        />
      )}

      {/* ===== 电子浮漂 Drawer ===== */}
      <Drawer
        title={
          <Space>
            <FileTextOutlined />
            <span>电子浮漂</span>
            <Tag color="blue">{workOrder.woNo}</Tag>
          </Space>
        }
        placement="right" width={540}
        open={floatOpen} onClose={() => setFloatOpen(false)}
      >
        <FloatTicketViewer workOrder={workOrder} cells={floatCells} currentOpCode={operation.code} />
      </Drawer>

      {/* ===== 执行历史 Drawer ===== */}
      <Drawer
        title={<Space><CheckCircleOutlined style={{ color: '#52c41a' }} /><span>执行记录</span></Space>}
        placement="right" width={400}
        open={historyOpen} onClose={() => setHistoryOpen(false)}
      >
        <Timeline
          items={enabledStages.map(s => {
            const exec = execution.stages[s.code];
            const done = exec?.status === 'completed';
            const isCur = s.code === currentStageCode;
            return {
              color: done ? 'green' : isCur ? 'blue' : 'gray',
              dot: done ? <CheckCircleOutlined /> : isCur ? <LoadingOutlined /> : undefined,
              children: (
                <div>
                  <Text strong style={{ color: done ? '#52c41a' : isCur ? '#1890ff' : '#8c8c8c' }}>
                    {STAGE_ICON[s.code]} {s.name}
                  </Text>
                  {done && exec?.endTime && (
                    <div><Text type="secondary" style={{ fontSize: 11 }}>完成：{exec.endTime}</Text></div>
                  )}
                  {isCur && (
                    <div><Text type="secondary" style={{ fontSize: 11 }}>进行中（{stageElapsedMin}分钟）</Text></div>
                  )}
                </div>
              ),
            };
          })}
        />
      </Drawer>

      {/* ===== 电子签名 Modal ===== */}
      <Modal
        title={<Space><LockOutlined style={{ color: '#722ed1' }} /><span>电子签名确认</span></Space>}
        open={eSignModal}
        onOk={handleESignConfirm}
        onCancel={() => { setESignModal(false); setESignCallback(null); setESignPwd(''); }}
        okText="确认签名" cancelText="取消"
        okButtonProps={{
          size: 'large',
          style: { background: '#722ed1', borderColor: '#722ed1', height: 48, fontSize: 15, minWidth: 120 },
          disabled: eSignPwd.length === 0,
        }}
        cancelButtonProps={{ size: 'large', style: { height: 48, fontSize: 15 } }}
        width={360}
        centered
        destroyOnClose
      >
        <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
          {/* 操作员信息 */}
          <div style={{
            background: '#f9f0ff', borderRadius: 10, padding: '10px 16px', marginBottom: 20,
            border: '1px solid #d3adf7',
          }}>
            <Text style={{ fontSize: 13, color: '#531dab', fontWeight: 600 }}>操作员：张三 (工号：1001)</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 11 }}>
              {new Date().toLocaleString('zh-CN')}
            </Text>
          </div>

          {/* 数字小键盘 */}
          <NumPadInput
            value={eSignPwd}
            onChange={setESignPwd}
            maxLen={4}
            label="请输入操作密码（数字）"
          />

          <div style={{ marginTop: 14 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>演示密码：1234</Text>
          </div>
        </div>
      </Modal>

      {/* ===== 暂停 Modal ===== */}
      <Modal
        title={<Space><PauseCircleOutlined style={{ color: '#faad14' }} /><span>暂停确认</span></Space>}
        open={pauseModal}
        onOk={() => {
          form.validateFields().then(() => {
            setPauseModal(false);
            form.resetFields();
            message.warning({ content: '⏸ 工序已暂停，请及时恢复生产', duration: 4 });
          }).catch((err: any) => { if (err?.errorFields) return; });
        }}
        onCancel={() => { setPauseModal(false); form.resetFields(); }}
        okText="确认暂停" cancelText="取消"
      >
        <Alert message="暂停后工序计时继续，超过30分钟将触发超时预警" type="warning" showIcon style={{ marginBottom: 16 }} />
        <Form form={form} layout="vertical">
          <Form.Item label="暂停原因" name="pauseReason" rules={[{ required: true, message: '请填写暂停原因' }]}>
            <Input.TextArea rows={3} placeholder="请说明暂停原因（如设备故障、待料、换班等）" />
          </Form.Item>
          <Form.Item label="预计恢复时间" name="resumeTime">
            <Input placeholder="如：30分钟后" />
          </Form.Item>
        </Form>
      </Modal>

      {/* ===== 异常上报 Modal ===== */}
      <Modal
        title={<Space><WarningOutlined style={{ color: '#ff4d4f' }} /><span>异常上报</span></Space>}
        open={abnormalModal}
        onOk={handleAbnormal}
        onCancel={() => { setAbnormalModal(false); setAbnormalDesc(''); setAbnormalType(''); }}
        okText="上报异常" cancelText="取消"
        okButtonProps={{ danger: true, size: 'large' }}
        cancelButtonProps={{ size: 'large' }}
      >
        <Alert
          message="上报异常后，当前工序将被挂起，浮漂锁定，需 QA/班长 解锁后方可继续。"
          type="error" showIcon style={{ marginBottom: 16 }}
        />
        <Space direction="vertical" style={{ width: '100%' }} size={12}>
          <div>
            <Text strong>异常类型：</Text>
            <div style={{ marginTop: 6, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['设备故障', '检验不合格', '物料问题', '工艺异常', '安全问题', '其他'].map(t => (
                <Tag
                  key={t}
                  color={abnormalType === t ? 'red' : 'default'}
                  style={{ cursor: 'pointer', fontSize: 13, padding: '4px 10px' }}
                  onClick={() => setAbnormalType(t)}
                >
                  {t}
                </Tag>
              ))}
            </div>
          </div>
          <div>
            <Text strong>异常描述：</Text>
            <Input.TextArea
              rows={4}
              style={{ marginTop: 6 }}
              placeholder="请详细描述异常情况（现象、影响范围、初步判断等）"
              value={abnormalDesc}
              onChange={e => setAbnormalDesc(e.target.value)}
            />
          </div>
        </Space>
      </Modal>
    </Layout>
  );
};

export default PadExecutionPage;

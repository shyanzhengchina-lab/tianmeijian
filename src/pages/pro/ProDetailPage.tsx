import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Button, Tag, Tooltip, Modal, Form, Input, Select,
  Space, Popconfirm, message, Switch, InputNumber,
  Divider, Alert, Row, Col, Drawer, Badge,
} from 'antd';
import {
  ArrowLeftOutlined, PlusOutlined, DeleteOutlined, ExclamationCircleOutlined,
  CheckCircleOutlined, ToolOutlined, EditOutlined,
  ArrowUpOutlined, ArrowDownOutlined, EyeOutlined, InfoCircleOutlined,
  ClockCircleOutlined, AuditOutlined, RollbackOutlined,
  StopOutlined, PlayCircleOutlined, BranchesOutlined,
  SafetyCertificateOutlined, MergeCellsOutlined, SplitCellsOutlined,
  ApartmentOutlined, ThunderboltOutlined, NodeIndexOutlined,
} from '@ant-design/icons';
import {
  ProcessRouting, RoutingGroup, RoutingOpStep,
  ROUTING_STATUS_MAP, calcTotalTime, countAllSteps, canConfigSteps,
} from './proData';
import { mockOperations, Operation, OP_CATEGORY_MAP, PHASE_TYPE_MAP, findOperationByCode, findOperationByName, generateDefaultPhases } from '../operation/operationData';
import { getOperationList } from '../../api/operations';
import {
  RoutingStepRecord,
  getRoutingStepList,
  createRoutingStep,
  updateRoutingStep,
  deleteRoutingStep,
} from '../../api/processRoutings';
import './ProPage.css';

interface Props {
  routing: ProcessRouting;
  onBack: () => void;
  onStatusChange?: (id: string, newStatus: any, extra?: any) => void;
}

const ProDetailPage: React.FC<Props> = ({ routing, onBack }) => {
  const [routingData, setRoutingData] = useState<ProcessRouting>(routing);

  // ── 加载后端步骤，合并进 groups ─────────────────────────────────────
  const loadStepsFromApi = useCallback(async () => {
    const numId = Number(routing.id);
    if (isNaN(numId) || numId <= 0) return;
    try {
      const resp = await getRoutingStepList({ routingId: numId }) as any;
      const steps: any[] = Array.isArray(resp?.data) ? resp.data :
                           Array.isArray(resp)        ? resp : [];
      if (steps.length === 0) return;
      const sorted = [...steps].sort((a, b) =>
        (a.stepNo ?? a.step_no ?? 0) - (b.stepNo ?? b.step_no ?? 0)
      );
      const groups: RoutingGroup[] = sorted.map((s, idx) => ({
        id:  `G${s.id ?? idx}`,
        seq: s.stepNo ?? s.step_no ?? (idx + 1) * 10,
        steps: [{
          id:            `S${s.id ?? idx}`,
          opId:          s.opId   ?? `op-${s.id ?? idx}`,
          opCode:        s.opCode ?? s.stepCode  ?? `STEP-${s.stepNo ?? idx + 1}`,
          opName:        s.opName ?? s.stepName  ?? '',
          opShort:       s.opShort ?? s.opName ?? s.stepName ?? '',
          workCenter:    s.workCenter ?? s.work_center ?? '',
          stdTimeMin:    Number(s.stdTimeMin ?? s.stdTime ?? s.std_time ?? 0),
          isKeyOp:       Boolean(s.isKeyOp ?? s.isKeyProcess ?? s.isKeyStep ?? (s.stepType === 'KEY')),
          isQcPoint:     Boolean(s.isQcPoint ?? s.requireQc ?? s.require_qc ?? (s.stepType === 'QC')),
          isReportPoint: Boolean(s.isReportPoint ?? s.requireEbr ?? s.require_ebr ?? s.reportPoint ?? true),
          phaseCount:    Number(s.phaseCount ?? s.phase_count ?? 1),
          remark:        s.remark ?? s.description ?? '',
        }],
      }));
      setRoutingData(prev => ({ ...prev, groups }));
    } catch { /* graceful: keep existing groups from props */ }
  }, [routing.id]);

  useEffect(() => {
    // Always reload from API to get full step details (opCode/opName/workCenter/etc.)
    // ProListPage only passes empty groups[], so we always need API call here
    loadStepsFromApi();
  }, [loadStepsFromApi]);

  // 选中状态：groupId + stepId
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [selectedStepId, setSelectedStepId] = useState('');

  // ── 工序主数据（API加载，mock回退）──────────────────────────────────
  const [allOperations, setAllOperations] = useState<Operation[]>(mockOperations);
  const loadOperations = useCallback(async () => {
    try {
      const resp = await getOperationList() as any;
      const apiList: any[] = resp?.data ?? [];
      if (apiList.length > 0) {
        const newOps: Operation[] = apiList.map((item: any) => {
          const apiCode = item.operationCode ?? `OP-${item.id}`;
          const apiName = item.operationName ?? '';
          // 从 mockOperations 补充 phases（API 不返回阶段字段）
          // 策略：① opCode精确匹配 → ② opCode前缀匹配 → ③ opName匹配
          const mockOp = findOperationByCode(apiCode)
            ?? findOperationByName(apiName);
          return {
            id:            `api-${item.id}`,
            opCode:        apiCode,
            opName:        apiName,
            opShort:       item.aliasName ?? apiName,
            category:      'PROD' as any,
            workshop:      '',
            productLine:   '',
            workCenter:    item.workCenterName ?? '',
            equipType:     '',
            stdTimeMin:    Number(item.standardTime ?? 0),
            prepTimeMin:   0,
            hasFirstPiece: false,
            hasLastPiece:  false,
            hasPatrol:     false,
            hasCleanup:    false,
            isBottleneck:  item.isKeyOperation === 1,
            isReportPoint: item.reportRequired === 1,
            isQcPoint:     !!item.inspectionTrigger,
            status:        'ACTIVE' as any,
            version:       'V1.0',
            effectDate:    item.createTime?.slice(0, 10) ?? '',
            createdBy:     item.createBy ?? '',
            updatedAt:     item.updateTime ?? '',
            // 优先用 mock 里的 phases（含完整字段定义），API 无此字段
            phases:        mockOp?.phases ?? [],
          };
        });
        // 合并：将 API 数据与 mockOperations 做去重合并
        // mockOperations 中 API 未覆盖到的工序保留（保证 phases 完整性）
        const apiCodes = new Set(newOps.map(o => o.opCode));
        const mockOnly = mockOperations.filter(m => !apiCodes.has(m.opCode));
        setAllOperations([...newOps, ...mockOnly]);
      }
    } catch { /* 保留 mock */ }
  }, []);

  useEffect(() => { loadOperations(); }, [loadOperations]);

  // 工序选择弹窗
  const [opPickerOpen, setOpPickerOpen] = useState(false);
  const [addMode, setAddMode] = useState<'serial' | 'parallel'>('serial');
  const [addToGroupId, setAddToGroupId] = useState('');
  const [opSearch, setOpSearch] = useState('');
  const [opCatFilter, setOpCatFilter] = useState('');

  // 编辑步骤参数弹窗
  const [stepModalOpen, setStepModalOpen] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState('');
  const [editingStep, setEditingStep] = useState<RoutingOpStep | null>(null);
  const [stepForm] = Form.useForm();

  // 编辑组标签弹窗
  const [groupLabelModalOpen, setGroupLabelModalOpen] = useState(false);
  const [editingGroupForLabel, setEditingGroupForLabel] = useState<RoutingGroup | null>(null);
  const [groupLabelForm] = Form.useForm();

  // 工序主数据预览抽屉
  const [previewDrawerOpen, setPreviewDrawerOpen] = useState(false);
  const [previewOp, setPreviewOp] = useState<Operation | null>(null);

  const isEditable = canConfigSteps(routingData.status);

  // ── 统计 ─────────────────────────────────────────────────────────
  const totalTime          = calcTotalTime(routingData.groups);
  const stepCount          = countAllSteps(routingData.groups);
  const groupCount         = routingData.groups.length;
  const parallelGroupCount = routingData.groups.filter(g => g.steps.length > 1).length;
  const keyOpCount         = routingData.groups.flatMap(g => g.steps).filter(s => s.isKeyOp).length;
  const qcCount            = routingData.groups.flatMap(g => g.steps).filter(s => s.isQcPoint).length;

  const statusInfo = ROUTING_STATUS_MAP[routingData.status];

  const currentGroup = routingData.groups.find(g => g.id === selectedGroupId);
  const currentStep  = currentGroup?.steps.find(s => s.id === selectedStepId);

  // ── 工序选择器过滤 ───────────────────────────────────────────────
  const availableOps = useMemo(() => allOperations.filter(op => {
    if (op.status !== 'ACTIVE') return false;
    const catMatch    = !opCatFilter || op.category === opCatFilter;
    const searchMatch = !opSearch
      || op.opCode.toLowerCase().includes(opSearch.toLowerCase())
      || op.opName.includes(opSearch)
      || op.workCenter.includes(opSearch);
    return catMatch && searchMatch;
  }), [allOperations, opSearch, opCatFilter]);

  // ── helpers ──────────────────────────────────────────────────────
  const setGroups = (fn: (prev: RoutingGroup[]) => RoutingGroup[]) =>
    setRoutingData(prev => ({ ...prev, groups: fn(prev.groups) }));

  const reseq = (groups: RoutingGroup[]): RoutingGroup[] =>
    groups.map((g, i) => ({ ...g, seq: (i + 1) * 10 }));

  // ── 打开工序选择 ─────────────────────────────────────────────────
  const openPickSerial = () => {
    setAddMode('serial'); setAddToGroupId('');
    setOpSearch(''); setOpCatFilter('');
    setOpPickerOpen(true);
  };
  const openPickParallel = (groupId: string) => {
    setAddMode('parallel'); setAddToGroupId(groupId);
    setOpSearch(''); setOpCatFilter('');
    setOpPickerOpen(true);
  };

  // ── 从工序主数据添加步骤（含 API 持久化）──────────────────────────
  const handlePickOp = async (op: Operation) => {
    const numRoutingId = Number(routing.id);
    let savedId: string | null = null;

    // Persist to backend if we have a valid numeric routingId
    if (!isNaN(numRoutingId) && numRoutingId > 0) {
      try {
        const nextStepNo = (routingData.groups.length + 1) * 10;
        const payload: RoutingStepRecord = {
          routingId:   numRoutingId,
          stepNo:      addMode === 'serial' ? nextStepNo : nextStepNo,
          stepName:    op.opName,
          stepCode:    op.opCode,
          reportPoint: op.isReportPoint ? 1 : 0,
          stepType:    op.isBottleneck ? 'KEY' : op.isQcPoint ? 'QC' : 'NORMAL',
          description: '',
        };
        const resp = await createRoutingStep(payload) as any;
        const created = resp?.data ?? resp;
        if (created?.id) savedId = `S${created.id}`;
      } catch { /* continue with temp ID */ }
    }

    const newStep: RoutingOpStep = {
      id: savedId ?? `S${Date.now()}`,
      opId: op.id, opCode: op.opCode, opName: op.opName, opShort: op.opShort,
      workCenter: op.workCenter, stdTimeMin: op.stdTimeMin,
      isKeyOp: op.isBottleneck, isQcPoint: op.isQcPoint, isReportPoint: op.isReportPoint,
      phaseCount: op.phases.length,
    };
    if (addMode === 'serial') {
      const newGroup: RoutingGroup = {
        id: `G${Date.now()}`, seq: (routingData.groups.length + 1) * 10, steps: [newStep],
      };
      setGroups(prev => reseq([...prev, newGroup]));
      setSelectedGroupId(newGroup.id);
      setSelectedStepId(newStep.id);
      message.success(`已新增串行工序「${op.opName}」`);
    } else {
      setGroups(prev => prev.map(g =>
        g.id === addToGroupId ? { ...g, steps: [...g.steps, newStep] } : g
      ));
      setSelectedGroupId(addToGroupId);
      setSelectedStepId(newStep.id);
      message.success(`已将「${op.opName}」并行添加到当前组`);
    }
    setOpPickerOpen(false);
  };

  // ── 拆分并行步骤为独立串行组 ─────────────────────────────────────
  const handleSplitOut = (groupId: string, stepId: string) => {
    setGroups(prev => {
      const gIdx = prev.findIndex(g => g.id === groupId);
      if (gIdx === -1) return prev;
      const g = prev[gIdx];
      if (g.steps.length <= 1) { message.warning('只有一个工序，无需拆分'); return prev; }
      const s = g.steps.find(x => x.id === stepId);
      if (!s) return prev;
      const newGroup: RoutingGroup = { id: `G${Date.now()}`, seq: g.seq + 1, steps: [s] };
      const updated = prev.map(x =>
        x.id === groupId ? { ...x, steps: x.steps.filter(x2 => x2.id !== stepId) } : x
      );
      updated.splice(gIdx + 1, 0, newGroup);
      return reseq(updated);
    });
    message.success('已将该工序拆分为独立串行步骤');
  };

  // ── 合并两组为并行组 ─────────────────────────────────────────────
  const handleMergeWithNext = (groupId: string) => {
    setGroups(prev => {
      const gIdx = prev.findIndex(g => g.id === groupId);
      if (gIdx === -1 || gIdx >= prev.length - 1) { message.warning('已是最后一组'); return prev; }
      const g = prev[gIdx], next = prev[gIdx + 1];
      const merged: RoutingGroup = {
        id: g.id, seq: g.seq,
        label: g.label || next.label || '并行处理',
        steps: [...g.steps, ...next.steps],
      };
      const result = [...prev];
      result.splice(gIdx, 2, merged);
      return reseq(result);
    });
    message.success('已将两组合并为并行组');
  };

  // ── 组移上/下 ────────────────────────────────────────────────────
  const moveGroupUp = (idx: number) => {
    if (idx === 0) return;
    setGroups(prev => { const a = [...prev]; [a[idx - 1], a[idx]] = [a[idx], a[idx - 1]]; return reseq(a); });
  };
  const moveGroupDown = (idx: number) => {
    setGroups(prev => {
      if (idx >= prev.length - 1) return prev;
      const a = [...prev]; [a[idx], a[idx + 1]] = [a[idx + 1], a[idx]]; return reseq(a);
    });
  };

  // ── 删除步骤（含 API 同步）────────────────────────────────────────
  const handleDeleteStep = async (groupId: string, stepId: string) => {
    // stepId format: 'S{backendId}', try to parse backendId
    const backendId = parseInt(stepId.replace(/^S/, ''), 10);
    if (!isNaN(backendId) && backendId > 0) {
      try { await deleteRoutingStep(backendId); } catch { /* ignore if not persisted */ }
    }
    setGroups(prev =>
      reseq(prev.map(g =>
        g.id !== groupId ? g : { ...g, steps: g.steps.filter(s => s.id !== stepId) }
      ).filter(g => g.steps.length > 0))
    );
    if (selectedStepId === stepId) { setSelectedStepId(''); setSelectedGroupId(''); }
    message.success('已移除工序');
  };

  // ── 编辑步骤参数 ─────────────────────────────────────────────────
  const handleEditStep = (groupId: string, step: RoutingOpStep) => {
    setEditingGroupId(groupId); setEditingStep(step);
    stepForm.setFieldsValue({ ...step }); setStepModalOpen(true);
  };
  const handleSaveStep = () => {
    stepForm.validateFields().then(async values => {
      // Sync update to backend if step has a persisted ID (format: S{number})
      const backendId = parseInt((editingStep?.id ?? '').replace(/^S/, ''), 10);
      if (!isNaN(backendId) && backendId > 0) {
        try {
          await updateRoutingStep(backendId, {
            stepName:    values.opName    ?? editingStep?.opName,
            description: values.remark   ?? '',
            reportPoint: values.isReportPoint ? 1 : 0,
            stepType:    values.isKeyOp ? 'KEY' : values.isQcPoint ? 'QC' : 'NORMAL',
          });
        } catch { /* graceful: local update still applied */ }
      }
      setGroups(prev => prev.map(g =>
        g.id === editingGroupId
          ? { ...g, steps: g.steps.map(s => s.id === editingStep!.id ? { ...s, ...values } : s) }
          : g
      ));
      setStepModalOpen(false); message.success('参数已更新');
    }).catch((err: any) => { if (err?.errorFields) return; });
  };

  // ── 编辑组标签 ───────────────────────────────────────────────────
  const handleEditGroupLabel = (g: RoutingGroup) => {
    setEditingGroupForLabel(g);
    groupLabelForm.setFieldsValue({ label: g.label || '' });
    setGroupLabelModalOpen(true);
  };
  const handleSaveGroupLabel = () => {
    groupLabelForm.validateFields().then(values => {
      setGroups(prev => prev.map(g =>
        g.id === editingGroupForLabel!.id ? { ...g, label: values.label } : g
      ));
      setGroupLabelModalOpen(false); message.success('标签已更新');
    }).catch((err: any) => { if (err?.errorFields) return; });
  };

  // ── 预览工序主数据 ───────────────────────────────────────────────
  const handlePreviewOp = (opId: string) => {
    // 多策略查找：opId → opCode → opName
    const step = routingData.groups.flatMap(g => g.steps).find(s => s.opId === opId);
    const op = allOperations.find(o => o.id === opId)
      ?? (step ? findOperationByCode(step.opCode) ?? findOperationByName(step.opName) : undefined);
    if (op) { setPreviewOp(op); setPreviewDrawerOpen(true); }
  };

  // ═══════════════════════════════════════════════════════════════════
  //  流程图渲染（竖向，串行从上往下，并行左右展开）
  // ═══════════════════════════════════════════════════════════════════
  const renderFlowDiagram = () => (
    <div className="rfd-wrap">
      {/* 开始端点 */}
      <div className="rfd-terminal">
        <div className="rfd-terminal-dot start" />
        <span className="rfd-terminal-label">开始</span>
      </div>

      {routingData.groups.map((g, gIdx) => {
        const isParallel = g.steps.length > 1;
        const isGroupSel = selectedGroupId === g.id;

        return (
          <React.Fragment key={g.id}>
            {/* 串行连接线 */}
            <div className="rfd-vline" />

            {isParallel ? (
              /* ── 并行组 ── */
              <div className={`rfd-parallel-block ${isGroupSel ? 'sel' : ''}`}>
                {/* 并行头部标签 */}
                <div className="rfd-parallel-header">
                  <div className="rfd-parallel-icon">
                    <ThunderboltOutlined />
                  </div>
                  <span className="rfd-parallel-title">
                    {g.label || `并行执行（${g.steps.length} 道工序同步）`}
                  </span>
                  <span className="rfd-parallel-time">
                    最长 {Math.max(...g.steps.map(s => s.stdTimeMin))} 分钟
                  </span>
                  {isEditable && (
                    <div className="rfd-parallel-acts" onClick={e => e.stopPropagation()}>
                      <Tooltip title="追加并行工序">
                        <button className="rfd-icon-btn green" onClick={() => openPickParallel(g.id)}>
                          <PlusOutlined />
                        </button>
                      </Tooltip>
                      <Tooltip title="编辑并行组标签">
                        <button className="rfd-icon-btn" onClick={() => handleEditGroupLabel(g)}>
                          <EditOutlined />
                        </button>
                      </Tooltip>
                      <Tooltip title="上移">
                        <button className="rfd-icon-btn" disabled={gIdx === 0}
                          onClick={() => moveGroupUp(gIdx)}>
                          <ArrowUpOutlined />
                        </button>
                      </Tooltip>
                      <Tooltip title="下移">
                        <button className="rfd-icon-btn"
                          disabled={gIdx === routingData.groups.length - 1}
                          onClick={() => moveGroupDown(gIdx)}>
                          <ArrowDownOutlined />
                        </button>
                      </Tooltip>
                    </div>
                  )}
                </div>

                {/* 并行泳道 */}
                <div className="rfd-parallel-lanes">
                  {g.steps.map((s, sIdx) => {
                    const isStepSel = selectedStepId === s.id && selectedGroupId === g.id;
                    return (
                      <div
                        key={s.id}
                        className={`rfd-parallel-lane ${isStepSel ? 'sel' : ''} ${s.isKeyOp ? 'key' : ''}`}
                        onClick={() => { setSelectedGroupId(g.id); setSelectedStepId(s.id); }}
                      >
                        <div className="rfd-lane-left">
                          <div className="rfd-lane-idx" style={{ background: s.isKeyOp ? '#FA8C16' : '#722ED1' }}>
                            {sIdx + 1}
                          </div>
                        </div>
                        <div className="rfd-lane-body">
                          <div className="rfd-lane-name">{s.opName}</div>
                          <div className="rfd-lane-meta">
                            <span>{s.workCenter}</span>
                            <span className="dot">·</span>
                            <span className="blue">{s.stdTimeMin} 分</span>
                            <span className="dot">·</span>
                            <span>{s.phaseCount} 个阶段</span>
                            {s.isKeyOp && <span className="rfd-tag key">关键</span>}
                            {s.isQcPoint && <span className="rfd-tag qc">质检</span>}
                            {s.isReportPoint && <span className="rfd-tag rpt">报工</span>}
                          </div>
                        </div>
                        <div className="rfd-lane-acts" onClick={e => e.stopPropagation()}>
                          <Tooltip title="查看工序主数据">
                            <button className="rfd-icon-btn" onClick={() => handlePreviewOp(s.opId)}>
                              <EyeOutlined />
                            </button>
                          </Tooltip>
                          {isEditable && (
                            <>
                              <Tooltip title="编辑参数">
                                <button className="rfd-icon-btn" onClick={() => handleEditStep(g.id, s)}>
                                  <EditOutlined />
                                </button>
                              </Tooltip>
                              <Tooltip title="拆分为独立串行步骤">
                                <button className="rfd-icon-btn orange"
                                  onClick={() => handleSplitOut(g.id, s.id)}>
                                  <SplitCellsOutlined />
                                </button>
                              </Tooltip>
                              <Popconfirm
                                title="确认移除此工序？"
                                icon={<ExclamationCircleOutlined style={{ color: '#E60012' }} />}
                                onConfirm={() => handleDeleteStep(g.id, s.id)}
                                okText="移除" cancelText="取消">
                                <button className="rfd-icon-btn red"><DeleteOutlined /></button>
                              </Popconfirm>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* ── 串行步骤 ── */
              (() => {
                const s = g.steps[0];
                const isStepSel = selectedGroupId === g.id;
                return (
                  <div
                    className={`rfd-serial-node ${isStepSel ? 'sel' : ''} ${s.isKeyOp ? 'key' : ''}`}
                    onClick={() => { setSelectedGroupId(g.id); setSelectedStepId(s.id); }}
                  >
                    <div className="rfd-serial-left">
                      <div className="rfd-serial-idx" style={{ background: s.isKeyOp ? '#FA8C16' : '#1677FF' }}>
                        {gIdx + 1}
                      </div>
                      <div className="rfd-serial-icon">
                        <NodeIndexOutlined style={{ color: '#1677FF', fontSize: 10 }} />
                      </div>
                    </div>
                    <div className="rfd-serial-body">
                      <div className="rfd-serial-name">{s.opName}
                        <span className="rfd-serial-code">{s.opCode}</span>
                      </div>
                      <div className="rfd-serial-meta">
                        <span>{s.workCenter}</span>
                        <span className="dot">·</span>
                        <span className="blue">{s.stdTimeMin} 分</span>
                        <span className="dot">·</span>
                        <span>{s.phaseCount} 个阶段</span>
                        {s.isKeyOp && <span className="rfd-tag key">关键</span>}
                        {s.isQcPoint && <span className="rfd-tag qc">质检</span>}
                        {s.isReportPoint && <span className="rfd-tag rpt">报工</span>}
                      </div>
                    </div>
                    <div className="rfd-serial-acts" onClick={e => e.stopPropagation()}>
                      <Tooltip title="查看工序主数据">
                        <button className="rfd-icon-btn" onClick={() => handlePreviewOp(s.opId)}>
                          <EyeOutlined />
                        </button>
                      </Tooltip>
                      {isEditable && (
                        <>
                          <Tooltip title="编辑参数">
                            <button className="rfd-icon-btn" onClick={() => handleEditStep(g.id, s)}>
                              <EditOutlined />
                            </button>
                          </Tooltip>
                          {gIdx < routingData.groups.length - 1 && (
                            <Tooltip title="与下一步合并为并行组">
                              <button className="rfd-icon-btn purple"
                                onClick={() => handleMergeWithNext(g.id)}>
                                <MergeCellsOutlined />
                              </button>
                            </Tooltip>
                          )}
                          <Tooltip title="向此步添加并行工序">
                            <button className="rfd-icon-btn green"
                              onClick={() => openPickParallel(g.id)}>
                              <PlusOutlined />
                            </button>
                          </Tooltip>
                          <Tooltip title="上移">
                            <button className="rfd-icon-btn" disabled={gIdx === 0}
                              onClick={() => moveGroupUp(gIdx)}>
                              <ArrowUpOutlined />
                            </button>
                          </Tooltip>
                          <Tooltip title="下移">
                            <button className="rfd-icon-btn"
                              disabled={gIdx === routingData.groups.length - 1}
                              onClick={() => moveGroupDown(gIdx)}>
                              <ArrowDownOutlined />
                            </button>
                          </Tooltip>
                          <Popconfirm
                            title="确认移除此工序？"
                            icon={<ExclamationCircleOutlined style={{ color: '#E60012' }} />}
                            onConfirm={() => handleDeleteStep(g.id, s.id)}
                            okText="移除" cancelText="取消">
                            <button className="rfd-icon-btn red"><DeleteOutlined /></button>
                          </Popconfirm>
                        </>
                      )}
                    </div>
                  </div>
                );
              })()
            )}
          </React.Fragment>
        );
      })}

      {/* 结束端点 */}
      <div className="rfd-vline" />
      <div className="rfd-terminal">
        <div className="rfd-terminal-dot end" />
        <span className="rfd-terminal-label end">结束</span>
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════
  //  右侧阶段详情
  // ═══════════════════════════════════════════════════════════════════
  const renderStageDetail = () => {
    if (!currentStep) {
      return (
        <div className="empty-hint">
          <div style={{ fontSize: 52, marginBottom: 12 }}>
            {routingData.groups.length > 0 ? '👆' : '🔧'}
          </div>
          <div style={{ color: '#bbb', fontSize: 14, marginBottom: 8 }}>
            {routingData.groups.length > 0
              ? '点击左侧工序步骤查看阶段详情'
              : isEditable ? '点击「添加工序」开始配置工艺路径' : '暂无工序步骤'}
          </div>
          {routingData.groups.length > 0 && (
            <div className="rfd-help-card">
              <div className="rfd-help-title">串行 / 并行操作说明</div>
              <div className="rfd-help-row">
                <span className="rfd-help-icon blue"><NodeIndexOutlined /></span>
                <span>普通步骤 = <strong>串行</strong>，按顺序依次执行</span>
              </div>
              <div className="rfd-help-row">
                <span className="rfd-help-icon purple"><ThunderboltOutlined /></span>
                <span>并行块 = 多道工序<strong>同时执行</strong>，工时取最长</span>
              </div>
              {isEditable && <>
                <Divider style={{ margin: '8px 0', borderColor: '#f0f0f0' }} />
                <div className="rfd-help-row">
                  <span className="rfd-help-icon purple"><MergeCellsOutlined /></span>
                  <span>点击串行步骤的 <MergeCellsOutlined /> 与下一步合并为并行</span>
                </div>
                <div className="rfd-help-row">
                  <span className="rfd-help-icon green"><PlusOutlined /></span>
                  <span>点击任意步骤的 <PlusOutlined /> 追加并行工序</span>
                </div>
                <div className="rfd-help-row">
                  <span className="rfd-help-icon orange"><SplitCellsOutlined /></span>
                  <span>点击并行步骤的 <SplitCellsOutlined /> 将其拆分为独立串行</span>
                </div>
              </>}
            </div>
          )}
        </div>
      );
    }

    // 多策略查找工序主数据：① opId精确匹配 → ② opCode匹配 → ③ opName模糊匹配 → ④ 自动生成默认阶段
    const op: Operation | undefined =
      allOperations.find(o => o.id === currentStep.opId) ??
      findOperationByCode(currentStep.opCode) ??
      findOperationByName(currentStep.opName);
    // op找不到时用自动生成的默认阶段
    const phases = op?.phases?.length
      ? op.phases
      : generateDefaultPhases(currentStep.opName, currentStep.isQcPoint, currentStep.isKeyOp);
    const isAutoPhase = !op;

    return (
      <>
        <div className="stage-config-header">
          <div style={{ flex: 1 }}>
            {/* 并行组提示横幅 */}
            {currentGroup && currentGroup.steps.length > 1 && (
              <div className="rfd-parallel-banner">
                <ThunderboltOutlined style={{ fontSize: 13 }} />
                <span>
                  此工序属于并行组「{currentGroup.label || '并行处理'}」，
                  与另 {currentGroup.steps.length - 1} 道工序同步执行
                  &nbsp;·&nbsp;组内最长工时 {Math.max(...currentGroup.steps.map(s => s.stdTimeMin))} 分钟
                </span>
              </div>
            )}
            <div className="op-title">
              <span style={{ color: '#C8000A', marginRight: 6, fontFamily: 'monospace', fontSize: 13 }}>
                [{currentStep.opCode}]
              </span>
              {currentStep.opName}
              {currentStep.isKeyOp && <Tag color="orange" style={{ marginLeft: 8, fontSize: 11 }}>关键工序</Tag>}
              {currentStep.isQcPoint && <Tag color="magenta" style={{ marginLeft: 4, fontSize: 11 }}>质检点</Tag>}
              {currentStep.isReportPoint && <Tag color="blue" style={{ marginLeft: 4, fontSize: 11 }}>报工点</Tag>}
            </div>
            <div className="op-meta">
              工作中心：<strong>{currentStep.workCenter}</strong>
              &nbsp;·&nbsp;标准工时：<strong style={{ color: '#1677FF' }}>{currentStep.stdTimeMin} 分钟/件</strong>
              &nbsp;·&nbsp;阶段数：<strong>{currentStep.phaseCount}</strong> 个
              {currentStep.remark && (
                <Tooltip title={currentStep.remark}>
                  <InfoCircleOutlined style={{ marginLeft: 6, color: '#fa8c16' }} />
                </Tooltip>
              )}
            </div>
          </div>
          <Space>
            <Button size="small" icon={<EyeOutlined />}
              onClick={() => handlePreviewOp(currentStep.opId)}>工序主数据</Button>
            {isEditable && (
              <Button size="small" icon={<EditOutlined />}
                onClick={() => handleEditStep(selectedGroupId, currentStep)}>编辑参数</Button>
            )}
          </Space>
        </div>

        <div className="stage-config-body">
          <div style={{ marginBottom: 12, color: '#888', fontSize: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            {isAutoPhase
              ? <><span style={{ color: '#fa8c16', fontWeight: 500 }}>⚡ 自动生成阶段</span><span style={{ color: '#bbb' }}>— 工序主数据未配置，已按GMP规范自动生成标准阶段。如需定制请在工序主数据中维护。</span></>
              : <span>以下为工序主数据定义的阶段（只读预览），如需修改请在工序主数据中维护。</span>
            }
          </div>
          {phases.map((phase, idx) => {
              const typeInfo = PHASE_TYPE_MAP[phase.phaseType];
              return (
                <div key={phase.phaseCode} className="stage-card enabled">
                  <div className="stage-card-header">
                    <div className="stage-order" style={{ background: `${typeInfo.color}20`, color: typeInfo.color }}>{idx + 1}</div>
                    <div className="stage-name">{phase.phaseName}</div>
                    <span className="stage-type-tag" style={{ color: typeInfo.color, borderColor: typeInfo.color, background: `${typeInfo.color}12` }}>
                      {typeInfo.label}
                    </span>
                    {phase.eSign && <Badge color="#722ED1" text={<span style={{ fontSize: 10, color: '#722ED1' }}>电签</span>} />}
                    {phase.dualReview && <Badge color="#E60012" text={<span style={{ fontSize: 10, color: '#E60012' }}>双人</span>} />}
                    {phase.required && <Badge color="#52C41A" text={<span style={{ fontSize: 10, color: '#52C41A' }}>必做</span>} />}
                    <div style={{ marginLeft: 'auto', fontSize: 11, color: '#aaa', display: 'flex', gap: 8 }}>
                      {phase.timeoutMin && <span>超时{phase.timeoutMin}min</span>}
                      <span style={{ fontFamily: 'monospace', color: '#bbb' }}>{phase.phaseCode}</span>
                    </div>
                  </div>
                  {phase.remark && (
                    <div style={{ padding: '4px 12px', background: '#fffbe6', borderBottom: '1px solid #ffe58f', fontSize: 11, color: '#874d00' }}>
                      <ExclamationCircleOutlined style={{ marginRight: 4 }} />{phase.remark}
                    </div>
                  )}
                  {phase.fields.length > 0 && (
                    <div className="stage-card-body">
                      <div className="stage-fields-title">采集字段（{phase.fields.length}个）：</div>
                      {phase.fields.map(f => (
                        <div key={f.code} className="stage-field-row">
                          <span className="field-type-icon">{f.dataType}</span>
                          <span style={{ flex: 1, fontSize: 12 }}>{f.name}</span>
                          {f.unit && <span style={{ color: '#aaa', fontSize: 11 }}>单位：{f.unit}</span>}
                          {f.stdValue && <span style={{ color: '#1677FF', fontSize: 11 }}>标准：{f.stdValue}</span>}
                          {f.required && <Tag color="red" style={{ fontSize: 10, padding: '0 4px' }}>必填</Tag>}
                          {f.inputType && <Tag style={{ fontSize: 10, padding: '0 4px' }}>{f.inputType}</Tag>}
                          {f.instrument && <Tooltip title={`量具：${f.instrument}`}><Tag color="purple" style={{ fontSize: 10, padding: '0 4px' }}>{f.instrument}</Tag></Tooltip>}
                        </div>
                      ))}
                      {phase.linkedDoc && (
                        <div className="stage-remark" style={{ marginTop: 8 }}>
                          <InfoCircleOutlined style={{ marginRight: 4 }} />关联单据：{phase.linkedDoc}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          }
        </div>
      </>
    );
  };

  // ═══════════════════════════════════════════════════════════════════
  //  主渲染
  // ═══════════════════════════════════════════════════════════════════
  return (
    <div className="pro-detail-page">

      {/* ── 顶部 Header ── */}
      <div className="pro-detail-header">
        <div className="header-left">
          <Button icon={<ArrowLeftOutlined />} onClick={onBack} size="small">返回列表</Button>
          <BranchesOutlined style={{ color: '#C8000A', fontSize: 20 }} />
          <div>
            <div className="routing-title">
              {routingData.routingCode}
              <span style={{
                marginLeft: 8, padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 500,
                color: statusInfo.color, background: statusInfo.bg, border: `1px solid ${statusInfo.border}`,
              }}>{statusInfo.label}</span>
              {routingData.isDefault && <Tag color="blue" style={{ marginLeft: 6, fontSize: 11 }}>默认版本</Tag>}
            </div>
            <div className="routing-meta">
              {routingData.routingName}&nbsp;·&nbsp;
              {routingData.productName}（{routingData.productModel}）&nbsp;·&nbsp;
              版本 <strong style={{ color: '#1677FF' }}>{routingData.version}</strong>
            </div>
          </div>
        </div>
        <Space>
          {routingData.status === 'ACTIVE' && routingData.auditBy && (
            <Tooltip title={`审核人：${routingData.auditBy} / ${routingData.auditAt}`}>
              <Tag icon={<SafetyCertificateOutlined />} color="success" style={{ cursor: 'pointer' }}>
                已审核：{routingData.auditBy}
              </Tag>
            </Tooltip>
          )}
          {!isEditable && (
            <Alert type="info" showIcon
              message={`${statusInfo.label}状态下不可修改工序步骤`}
              style={{ padding: '3px 10px', fontSize: 12 }} />
          )}
        </Space>
      </div>

      {/* ── 汇总栏 ── */}
      <div className="routing-summary">
        <span><ClockCircleOutlined style={{ marginRight: 4 }} />总工时：<em>{totalTime.toFixed(1)}</em> 分钟</span>
        <span style={{ color: '#d9d9d9' }}>|</span>
        <span>执行组：<em>{groupCount}</em> 组</span>
        <span style={{ color: '#d9d9d9' }}>|</span>
        <span>工序总计：<em>{stepCount}</em> 道</span>
        {parallelGroupCount > 0 && <>
          <span style={{ color: '#d9d9d9' }}>|</span>
          <span style={{ color: '#722ED1' }}>
            <ThunderboltOutlined style={{ marginRight: 2 }} />并行组：<em>{parallelGroupCount}</em> 组
          </span>
        </>}
        <span style={{ color: '#d9d9d9' }}>|</span>
        <span style={{ color: '#FA8C16' }}>关键工序：<em>{keyOpCount}</em> 道</span>
        <span style={{ color: '#d9d9d9' }}>|</span>
        <span style={{ color: '#EB2F96' }}>质检点：<em>{qcCount}</em> 个</span>
      </div>

      {/* ── 主体（左右双栏）── */}
      <div className="pro-detail-body">

        {/* ═══ 左侧：流程设计 ═══ */}
        <div className="routing-tree-panel">
          <div className="panel-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>
              <BranchesOutlined style={{ marginRight: 6, color: '#C8000A' }} />
              执行流程（{groupCount} 组 / {stepCount} 道工序）
            </span>
            {isEditable && (
              <Button type="primary" size="small" icon={<PlusOutlined />}
                style={{ background: '#C8000A', borderColor: '#C8000A', fontSize: 11 }}
                onClick={openPickSerial}>
                添加工序
              </Button>
            )}
          </div>

          {/* 图例 */}
          {routingData.groups.length > 0 && (
            <div className="rfd-legend">
              <span className="rfd-legend-item">
                <span className="rfd-legend-dot" style={{ background: '#1677FF' }} />
                <span className="rfd-legend-dot2" style={{ borderColor: '#1677FF' }} />
                串行
              </span>
              <span className="rfd-legend-item">
                <span className="rfd-legend-dot" style={{ background: '#722ED1' }} />
                <ThunderboltOutlined style={{ color: '#722ED1', fontSize: 10, margin: '0 2px' }} />
                并行（同时执行，取最长工时）
              </span>
              <span className="rfd-legend-item key">
                <span className="rfd-legend-dot" style={{ background: '#FA8C16' }} />
                关键工序
              </span>
            </div>
          )}

          <div className="routing-tree-scroll">
            {routingData.groups.length === 0 ? (
              <div className="empty-steps-hint">
                <ApartmentOutlined style={{ fontSize: 40, color: '#ddd', display: 'block', marginBottom: 10 }} />
                <div style={{ color: '#bbb', fontSize: 13 }}>暂无工序步骤</div>
                {isEditable && (
                  <Button type="dashed" size="small" icon={<PlusOutlined />} style={{ marginTop: 14 }}
                    onClick={openPickSerial}>从工序主数据添加</Button>
                )}
              </div>
            ) : (
              renderFlowDiagram()
            )}
          </div>
        </div>

        {/* ═══ 右侧：步骤详情 ═══ */}
        <div className="stage-config-panel">
          {renderStageDetail()}
        </div>
      </div>

      {/* ══ 工序选择弹窗 ══ */}
      <Modal
        title={
          <span>
            <PlusOutlined style={{ color: addMode === 'parallel' ? '#722ED1' : '#C8000A', marginRight: 8 }} />
            {addMode === 'serial' ? '添加串行工序（新建执行步骤）' : '添加并行工序（并入当前组同步执行）'}
          </span>
        }
        open={opPickerOpen}
        onCancel={() => setOpPickerOpen(false)}
        footer={null} width={760} destroyOnClose
      >
        {addMode === 'parallel' && (
          <Alert type="info" showIcon style={{ marginBottom: 12, fontSize: 12 }}
            message="并行模式：新工序与当前组内已有工序同步执行，组工时 = 所有并行工序中最长时间" />
        )}
        <Row gutter={10} style={{ marginBottom: 12 }}>
          <Col flex="1">
            <Input placeholder="搜索工序编码 / 名称 / 工作中心"
              value={opSearch} onChange={e => setOpSearch(e.target.value)}
              allowClear prefix={<ToolOutlined style={{ color: '#ccc' }} />} />
          </Col>
          <Col>
            <Select style={{ width: 140 }} placeholder="所有类别" allowClear
              value={opCatFilter || undefined} onChange={v => setOpCatFilter(v || '')}
              options={Object.entries(OP_CATEGORY_MAP).map(([k, v]) => ({ value: k, label: v.label }))} />
          </Col>
        </Row>
        <div style={{ fontSize: 12, color: '#aaa', marginBottom: 10 }}>
          共 {availableOps.length} 条已生效工序
        </div>
        <div className="op-picker-list">
          {availableOps.length === 0
            ? <div style={{ textAlign: 'center', color: '#ccc', padding: '30px 0' }}>无匹配工序</div>
            : availableOps.map(op => {
              const catInfo = OP_CATEGORY_MAP[op.category] ?? { label: op.category ?? '-', color: '#aaa' };
              const alreadyAdded = routingData.groups.some(g => g.steps.some(s => s.opId === op.id));
              return (
                <div key={op.id} className={`op-picker-row ${alreadyAdded ? 'already-added' : ''}`}>
                  <div className="op-picker-cat" style={{ background: catInfo.color + '20', color: catInfo.color }}>{catInfo.label}</div>
                  <div className="op-picker-info">
                    <div className="op-picker-name">
                      <span style={{ fontWeight: 600, color: '#1a1a2e' }}>{op.opName}</span>
                      <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#aaa', marginLeft: 8 }}>{op.opCode}</span>
                      {op.isBottleneck && <Tag color="orange" style={{ fontSize: 10, marginLeft: 4 }}>瓶颈</Tag>}
                      {op.isQcPoint && <Tag color="magenta" style={{ fontSize: 10, marginLeft: 2 }}>质检点</Tag>}
                    </div>
                    <div className="op-picker-meta">
                      <span>工作中心：{op.workCenter}</span>
                      <span>·</span>
                      <span>工时：{op.stdTimeMin}分/件</span>
                      <span>·</span>
                      <span>阶段：{op.phases.length}个</span>
                    </div>
                  </div>
                  <Space>
                    <Tooltip title="预览工序主数据">
                      <Button size="small" icon={<EyeOutlined />}
                        onClick={() => { setPreviewOp(op); setPreviewDrawerOpen(true); }}>预览</Button>
                    </Tooltip>
                    <Button size="small" type="primary"
                      style={{
                        background: alreadyAdded ? '#fa8c16' : (addMode === 'parallel' ? '#722ED1' : '#C8000A'),
                        borderColor: alreadyAdded ? '#fa8c16' : (addMode === 'parallel' ? '#722ED1' : '#C8000A'),
                      }}
                      icon={<PlusOutlined />}
                      onClick={() => handlePickOp(op)}>
                      {alreadyAdded ? '再次添加' : (addMode === 'parallel' ? '并行添加' : '添加')}
                    </Button>
                  </Space>
                </div>
              );
            })
          }
        </div>
      </Modal>

      {/* ══ 编辑步骤参数弹窗 ══ */}
      <Modal
        title={<span><EditOutlined style={{ color: '#1677FF', marginRight: 8 }} />编辑步骤参数 — {editingStep?.opName}</span>}
        open={stepModalOpen} onOk={handleSaveStep} onCancel={() => setStepModalOpen(false)}
        okText="保存" cancelText="取消" width={480}
        okButtonProps={{ style: { background: '#1677FF' } }} destroyOnClose
      >
        <Alert type="info" showIcon style={{ marginBottom: 16 }}
          message="此处修改仅覆盖该路径中的参数，不影响工序主数据" />
        <Form form={stepForm} layout="vertical">
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="workCenter" label="工作中心（覆盖）">
                <Input placeholder="覆盖工序主数据默认值" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="stdTimeMin" label="标准工时（分钟/件）">
                <InputNumber style={{ width: '100%' }} min={0} step={0.5} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="isKeyOp" label="关键工序" valuePropName="checked">
                <Switch checkedChildren="是" unCheckedChildren="否" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="isQcPoint" label="质检点" valuePropName="checked">
                <Switch checkedChildren="是" unCheckedChildren="否" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="isReportPoint" label="报工点" valuePropName="checked">
                <Switch checkedChildren="是" unCheckedChildren="否" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="remark" label="步骤备注">
                <Input.TextArea rows={2} placeholder="在此路径中的特殊要求说明" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* ══ 编辑并行组标签弹窗 ══ */}
      <Modal
        title={<span><ThunderboltOutlined style={{ color: '#722ED1', marginRight: 8 }} />编辑并行组标签</span>}
        open={groupLabelModalOpen} onOk={handleSaveGroupLabel} onCancel={() => setGroupLabelModalOpen(false)}
        okText="保存" cancelText="取消" width={400}
        okButtonProps={{ style: { background: '#722ED1', borderColor: '#722ED1' } }} destroyOnClose
      >
        <Form form={groupLabelForm} layout="vertical">
          <Form.Item name="label" label="并行组说明标签"
            rules={[{ required: true, message: '请输入标签' }]}>
            <Input placeholder="如：同步热处理与涂层" maxLength={20} showCount />
          </Form.Item>
        </Form>
      </Modal>

      {/* ══ 工序主数据预览抽屉 ══ */}
      <Drawer
        title={<span><ToolOutlined style={{ color: '#C8000A', marginRight: 8 }} />工序主数据详情 — {previewOp?.opCode}</span>}
        open={previewDrawerOpen} onClose={() => setPreviewDrawerOpen(false)} width={500}
        extra={<Tag color={previewOp ? OP_CATEGORY_MAP[previewOp.category].color : ''}>{previewOp ? OP_CATEGORY_MAP[previewOp.category].label : ''}</Tag>}
      >
        {previewOp && (
          <div>
            <div className="preview-section">
              <div className="preview-section-title">基础信息</div>
              <Row gutter={[12, 8]} style={{ fontSize: 13 }}>
                <Col span={12}><span className="preview-label">工序编码</span><span style={{ fontFamily: 'monospace', color: '#C8000A' }}>{previewOp.opCode}</span></Col>
                <Col span={12}><span className="preview-label">工序名称</span>{previewOp.opName}</Col>
                <Col span={12}><span className="preview-label">所属车间</span>{previewOp.workshop}</Col>
                <Col span={12}><span className="preview-label">工作中心</span>{previewOp.workCenter}</Col>
                <Col span={12}><span className="preview-label">标准工时</span><strong style={{ color: '#1677FF' }}>{previewOp.stdTimeMin} 分/件</strong></Col>
                <Col span={12}><span className="preview-label">版本</span>{previewOp.version}</Col>
              </Row>
            </div>
            <Divider style={{ margin: '12px 0' }} />
            <div className="preview-section">
              <div className="preview-section-title">控制点</div>
              <Space wrap>
                {previewOp.hasFirstPiece && <Tag color="orange">首件检验</Tag>}
                {previewOp.hasLastPiece && <Tag color="purple">末件检验</Tag>}
                {previewOp.hasPatrol && <Tag color="blue">过程巡检</Tag>}
                {previewOp.hasCleanup && <Tag color="cyan">完工清场</Tag>}
                {previewOp.isBottleneck && <Tag color="red">瓶颈工序</Tag>}
                {previewOp.isQcPoint && <Tag color="magenta">质检点</Tag>}
              </Space>
            </div>
            <Divider style={{ margin: '12px 0' }} />
            <div className="preview-section">
              <div className="preview-section-title">工序阶段（{previewOp.phases.length}个）</div>
              {previewOp.phases.map((phase, idx) => {
                const typeInfo = PHASE_TYPE_MAP[phase.phaseType];
                return (
                  <div key={phase.phaseCode} style={{
                    marginBottom: 8, padding: '8px 12px', borderRadius: 6,
                    border: `1px solid ${typeInfo.color}30`, background: `${typeInfo.color}08`,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ width: 20, height: 20, borderRadius: 4, background: typeInfo.color, color: '#fff', fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{idx + 1}</span>
                      <span style={{ fontWeight: 600 }}>{phase.phaseName}</span>
                      <Tag style={{ fontSize: 10, color: typeInfo.color, borderColor: typeInfo.color, background: `${typeInfo.color}15` }}>{typeInfo.label}</Tag>
                      {phase.required && <Tag color="green" style={{ fontSize: 10 }}>必做</Tag>}
                      {phase.eSign && <Tag color="purple" style={{ fontSize: 10 }}>电签</Tag>}
                    </div>
                    {phase.fields.length > 0 && (
                      <div style={{ fontSize: 11, color: '#888', paddingLeft: 28 }}>
                        采集字段：{phase.fields.map(f => f.name).join('、')}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default ProDetailPage;

// ================================================================
// SyncDiffModal — 工艺路径同步差异对比弹窗
// 功能：展示变体路径 vs 最新源路径的工序差异，支持选择性同步
// ================================================================
import React, { useState, useMemo } from 'react';
import {
  Modal, Button, Tag, Tooltip, Alert, Checkbox, Divider,
  Space, Badge, Row, Col, Typography, Steps, message,
} from 'antd';
import {
  SyncOutlined, PlusCircleOutlined, MinusCircleOutlined,
  EditOutlined, InfoCircleOutlined, CheckCircleOutlined,
  WarningOutlined, ArrowRightOutlined, ClockCircleOutlined,
  BranchesOutlined, SwapOutlined,
} from '@ant-design/icons';
import { RoutingMaster, RMGroup, RMOpStep } from './seriesData';

const { Text, Title } = Typography;

// ── 差异类型 ────────────────────────────────────────────────────────
type DiffType = 'added' | 'removed' | 'modified' | 'unchanged';

interface StepDiff {
  type: DiffType;
  sourceStep?: RMOpStep;    // 源路径中的工序（added / modified / unchanged）
  variantStep?: RMOpStep;   // 变体路径中的工序（removed / modified / unchanged）
  groupSeq: number;
  groupLabel?: string;
  isParallel: boolean;
  changes?: FieldChange[];  // modified 时的具体字段变化
}

interface FieldChange {
  field: string;
  label: string;
  oldVal: string | number | boolean;
  newVal: string | number | boolean;
}

interface GroupDiff {
  type: DiffType;
  seq: number;
  label?: string;
  isParallel: boolean;
  stepDiffs: StepDiff[];
}

interface Props {
  open: boolean;
  variant: RoutingMaster;          // 变体路径（待同步的那条）
  source: RoutingMaster;           // 最新源路径
  onCancel: () => void;
  onConfirm: (
    selectedChanges: string[],     // 选择同步的差异 key 列表
    updatedGroups: RMGroup[],      // 同步后的工序组
  ) => void;
}

// ── 工具函数 ────────────────────────────────────────────────────────
const getStepKey = (step: RMOpStep) => step.opCode;

const compareStep = (src: RMOpStep, vrt: RMOpStep): FieldChange[] => {
  const changes: FieldChange[] = [];
  if (src.stdTimeMin !== vrt.stdTimeMin)
    changes.push({ field: 'stdTimeMin', label: '标准工时', oldVal: `${vrt.stdTimeMin}min`, newVal: `${src.stdTimeMin}min` });
  if (src.workCenter !== vrt.workCenter)
    changes.push({ field: 'workCenter', label: '作业中心', oldVal: vrt.workCenter, newVal: src.workCenter });
  if (src.isKeyOp !== vrt.isKeyOp)
    changes.push({ field: 'isKeyOp', label: '关键工序', oldVal: vrt.isKeyOp ? '是' : '否', newVal: src.isKeyOp ? '是' : '否' });
  if (src.isQcPoint !== vrt.isQcPoint)
    changes.push({ field: 'isQcPoint', label: 'QC检验点', oldVal: vrt.isQcPoint ? '是' : '否', newVal: src.isQcPoint ? '是' : '否' });
  if (src.phaseCount !== vrt.phaseCount)
    changes.push({ field: 'phaseCount', label: '工序段数', oldVal: `${vrt.phaseCount}段`, newVal: `${src.phaseCount}段` });
  return changes;
};

// ── 计算差异 ────────────────────────────────────────────────────────
const calcDiff = (srcGroups: RMGroup[], vrtGroups: RMGroup[]): GroupDiff[] => {
  const result: GroupDiff[] = [];

  // 以源路径为基准，逐组对比
  const srcStepMap = new Map<string, { step: RMOpStep; group: RMGroup }>();
  const vrtStepMap = new Map<string, { step: RMOpStep; group: RMGroup }>();
  srcGroups.forEach(g => g.steps.forEach(s => srcStepMap.set(getStepKey(s), { step: s, group: g })));
  vrtGroups.forEach(g => g.steps.forEach(s => vrtStepMap.set(getStepKey(s), { step: s, group: g })));

  // 按源路径顺序输出每个工序组
  srcGroups.forEach(srcG => {
    const stepDiffs: StepDiff[] = srcG.steps.map(srcStep => {
      const key = getStepKey(srcStep);
      const inVariant = vrtStepMap.get(key);
      if (!inVariant) {
        // 源路径有，变体没有 → 新增
        return {
          type: 'added' as DiffType,
          sourceStep: srcStep,
          groupSeq: srcG.seq,
          groupLabel: srcG.label,
          isParallel: srcG.steps.length > 1,
        };
      }
      const changes = compareStep(srcStep, inVariant.step);
      if (changes.length > 0) {
        return {
          type: 'modified' as DiffType,
          sourceStep: srcStep,
          variantStep: inVariant.step,
          groupSeq: srcG.seq,
          groupLabel: srcG.label,
          isParallel: srcG.steps.length > 1,
          changes,
        };
      }
      return {
        type: 'unchanged' as DiffType,
        sourceStep: srcStep,
        variantStep: inVariant.step,
        groupSeq: srcG.seq,
        groupLabel: srcG.label,
        isParallel: srcG.steps.length > 1,
      };
    });

    const hasChange = stepDiffs.some(d => d.type !== 'unchanged');
    result.push({
      type: hasChange ? 'modified' : 'unchanged',
      seq: srcG.seq,
      label: srcG.label,
      isParallel: srcG.steps.length > 1,
      stepDiffs,
    });
  });

  // 变体路径中有，源路径没有的 → 变体独有（已移除或变体自己加的）
  vrtGroups.forEach(vrtG => {
    vrtG.steps.forEach(vrtStep => {
      const key = getStepKey(vrtStep);
      if (!srcStepMap.has(key)) {
        // 检查是否已在 result 中
        const existing = result.find(g => g.stepDiffs.some(sd => sd.variantStep?.opCode === key));
        if (!existing) {
          const lastSeq = result.length > 0 ? Math.max(...result.map(g => g.seq)) + 5 : 5;
          result.push({
            type: 'modified',
            seq: lastSeq,
            label: vrtG.label,
            isParallel: vrtG.steps.length > 1,
            stepDiffs: [{
              type: 'removed',
              variantStep: vrtStep,
              groupSeq: vrtG.seq,
              isParallel: false,
            }],
          });
        }
      }
    });
  });

  return result.sort((a, b) => a.seq - b.seq);
};

// ── 颜色 & 标签 ──────────────────────────────────────────────────────
const DIFF_CONFIG = {
  added:     { color: '#52C41A', bg: '#f6ffed', border: '#b7eb8f', label: '新增',  icon: <PlusCircleOutlined /> },
  removed:   { color: '#FF4D4F', bg: '#fff2f0', border: '#ffccc7', label: '仅变体', icon: <MinusCircleOutlined /> },
  modified:  { color: '#FA8C16', bg: '#fff7e6', border: '#ffd591', label: '变更',  icon: <EditOutlined /> },
  unchanged: { color: '#8C8C8C', bg: '#fafafa', border: '#d9d9d9', label: '不变',  icon: <CheckCircleOutlined /> },
};

// ── 主组件 ──────────────────────────────────────────────────────────
const SyncDiffModal: React.FC<Props> = ({ open, variant, source, onCancel, onConfirm }) => {
  const diffs = useMemo(() => calcDiff(source.groups ?? [], variant.groups ?? []), [source, variant]);

  // 可同步的差异 key（added / modified）
  const syncableKeys = useMemo(() =>
    diffs.flatMap(g =>
      g.stepDiffs
        .filter(sd => sd.type === 'added' || sd.type === 'modified')
        .map(sd => `${sd.type}:${(sd.sourceStep ?? sd.variantStep)?.opCode ?? ''}`)
    ), [diffs]);

  const [selected, setSelected] = useState<string[]>(syncableKeys);
  const [step, setStep] = useState<0 | 1>(0);   // 0=对比, 1=确认

  const totalAdded    = diffs.flatMap(g => g.stepDiffs).filter(d => d.type === 'added').length;
  const totalModified = diffs.flatMap(g => g.stepDiffs).filter(d => d.type === 'modified').length;
  const totalRemoved  = diffs.flatMap(g => g.stepDiffs).filter(d => d.type === 'removed').length;
  const totalUnchanged= diffs.flatMap(g => g.stepDiffs).filter(d => d.type === 'unchanged').length;
  const hasAnyChange  = totalAdded + totalModified + totalRemoved > 0;

  const toggle = (key: string) =>
    setSelected(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);

  const toggleAll = () =>
    setSelected(selected.length === syncableKeys.length ? [] : [...syncableKeys]);

  // 应用选中的同步项，生成新 groups
  const buildSyncedGroups = (): RMGroup[] => {
    const vrtGroups: RMGroup[] = JSON.parse(JSON.stringify(variant.groups ?? []));
    const srcGroups = source.groups ?? [];

    // 1. 对每个选中的 modified 项：更新变体中对应工序的字段
    selected.filter(k => k.startsWith('modified:')).forEach(k => {
      const opCode = k.replace('modified:', '');
      const srcStep = srcGroups.flatMap(g => g.steps).find(s => s.opCode === opCode);
      if (!srcStep) return;
      vrtGroups.forEach(g => {
        const idx = g.steps.findIndex(s => s.opCode === opCode);
        if (idx >= 0) {
          g.steps[idx] = {
            ...g.steps[idx],
            stdTimeMin: srcStep.stdTimeMin,
            workCenter: srcStep.workCenter,
            isKeyOp: srcStep.isKeyOp,
            isQcPoint: srcStep.isQcPoint,
            phaseCount: srcStep.phaseCount,
          };
        }
      });
    });

    // 2. 对每个选中的 added 项：将源路径新工序插入变体末尾（保持序号顺序）
    selected.filter(k => k.startsWith('added:')).forEach(k => {
      const opCode = k.replace('added:', '');
      const srcEntry = srcGroups.find(g => g.steps.some(s => s.opCode === opCode));
      if (!srcEntry) return;
      const alreadyExists = vrtGroups.some(g => g.steps.some(s => s.opCode === opCode));
      if (alreadyExists) return;
      const newGroup: RMGroup = {
        id: `sync-${Date.now()}-${opCode}`,
        seq: (Math.max(0, ...vrtGroups.map(g => g.seq)) + 10),
        steps: srcEntry.steps
          .filter(s => s.opCode === opCode)
          .map(s => ({ ...s, id: `${s.id}-sync` })),
      };
      vrtGroups.push(newGroup);
    });

    // 重新排序
    return vrtGroups.sort((a, b) => a.seq - b.seq).map((g, i) => ({ ...g, seq: (i + 1) * 10 }));
  };

  const handleConfirm = () => {
    if (step === 0) { setStep(1); return; }
    const syncedGroups = buildSyncedGroups();
    onConfirm(selected, syncedGroups);
    message.success(`已完成同步：${selected.length} 项变更已应用，待同步标记已清除`);
  };

  const handleReset = () => { setSelected(syncableKeys); setStep(0); };

  // ── 渲染单个工序差异行 ─────────────────────────────────────────────
  const renderStepDiff = (sd: StepDiff) => {
    const conf = DIFF_CONFIG[sd.type];
    const step_ = sd.sourceStep ?? sd.variantStep!;
    const key = `${sd.type}:${step_.opCode}`;
    const canSelect = sd.type === 'added' || sd.type === 'modified';

    return (
      <div key={key} style={{
        display: 'flex', alignItems: 'flex-start', gap: 10,
        padding: '8px 12px',
        background: conf.bg,
        border: `1px solid ${conf.border}`,
        borderRadius: 6,
        marginBottom: 6,
        opacity: sd.type === 'unchanged' ? 0.55 : 1,
      }}>
        {/* 选择框 */}
        {canSelect ? (
          <Checkbox
            checked={selected.includes(key)}
            onChange={() => toggle(key)}
            style={{ marginTop: 2, flexShrink: 0 }}
          />
        ) : (
          <div style={{ width: 16, flexShrink: 0 }} />
        )}

        {/* 差异类型标签 */}
        <Tag
          icon={conf.icon}
          color={sd.type === 'added' ? 'success' : sd.type === 'removed' ? 'error' : sd.type === 'modified' ? 'warning' : 'default'}
          style={{ flexShrink: 0, fontSize: 11, marginRight: 0 }}
        >
          {conf.label}
        </Tag>

        {/* 工序信息 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#888' }}>{step_.opCode}</span>
            <span style={{ fontWeight: 600, fontSize: 13 }}>{step_.opName}</span>
            {step_.isKeyOp && <Tag color="red" style={{ fontSize: 10, padding: '0 4px' }}>关键</Tag>}
            {step_.isQcPoint && <Tag color="orange" style={{ fontSize: 10, padding: '0 4px' }}>QC</Tag>}
            {sd.isParallel && <Tag color="purple" style={{ fontSize: 10, padding: '0 4px' }}>并行</Tag>}
          </div>

          {/* 字段变化明细（modified） */}
          {sd.type === 'modified' && sd.changes && sd.changes.length > 0 && (
            <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {sd.changes.map(fc => (
                <div key={fc.field} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  background: '#fff', border: '1px solid #ffd591',
                  borderRadius: 4, padding: '2px 8px', fontSize: 11,
                }}>
                  <span style={{ color: '#8C8C8C' }}>{fc.label}：</span>
                  <span style={{ color: '#FF4D4F', textDecoration: 'line-through' }}>{String(fc.oldVal)}</span>
                  <ArrowRightOutlined style={{ fontSize: 10, color: '#aaa' }} />
                  <span style={{ color: '#52C41A', fontWeight: 600 }}>{String(fc.newVal)}</span>
                </div>
              ))}
            </div>
          )}

          {/* added：显示工时/作业中心 */}
          {sd.type === 'added' && (
            <div style={{ marginTop: 4, fontSize: 11, color: '#888' }}>
              <ClockCircleOutlined style={{ marginRight: 3 }} />{step_.stdTimeMin}min
              <span style={{ margin: '0 8px' }}>·</span>
              {step_.workCenter}
              <span style={{ margin: '0 8px' }}>·</span>
              {step_.phaseCount}个工序段
            </div>
          )}

          {/* removed：变体独有工序提示 */}
          {sd.type === 'removed' && (
            <div style={{ marginTop: 4, fontSize: 11, color: '#FF4D4F' }}>
              <InfoCircleOutlined style={{ marginRight: 3 }} />
              此工序为变体路径独有，不在源路径中，无需同步（保留）
            </div>
          )}
        </div>

        {/* 序号 */}
        <span style={{ fontSize: 11, color: '#bbb', flexShrink: 0 }}>
          #{Math.floor(sd.groupSeq / 10)}
        </span>
      </div>
    );
  };

  // ── 确认步骤内容 ───────────────────────────────────────────────────
  const renderConfirmStep = () => {
    const addedSel    = selected.filter(k => k.startsWith('added:')).length;
    const modifiedSel = selected.filter(k => k.startsWith('modified:')).length;
    return (
      <div style={{ padding: '8px 0' }}>
        <Alert
          type="warning"
          showIcon
          icon={<WarningOutlined />}
          message="请确认以下同步操作"
          description={
            <div style={{ marginTop: 6 }}>
              <div>将对变体路径 <Text strong>{variant.routingCode}</Text> 执行：</div>
              <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                {addedSel > 0 && <li style={{ color: '#52C41A' }}>新增 {addedSel} 道源路径工序（追加至路径末尾，可进入详情页调整顺序）</li>}
                {modifiedSel > 0 && <li style={{ color: '#FA8C16' }}>更新 {modifiedSel} 道工序的参数（工时、作业中心、标志位等）</li>}
                {selected.length === 0 && <li style={{ color: '#8C8C8C' }}>无变更项，仅清除待同步标记</li>}
              </ul>
              <div style={{ marginTop: 8, fontSize: 12, color: '#8C8C8C' }}>
                同步完成后，变体路径状态保持不变，待同步标记将被清除。
              </div>
            </div>
          }
          style={{ marginBottom: 16 }}
        />

        {/* 同步摘要 */}
        <div style={{
          background: '#f9f9f9', border: '1px solid #e8e8e8',
          borderRadius: 8, padding: 16,
        }}>
          <Row gutter={16}>
            <Col span={12}>
              <div style={{ fontSize: 12, color: '#8C8C8C', marginBottom: 4 }}>变体路径</div>
              <div style={{ fontWeight: 600 }}>{variant.routingCode}</div>
              <div style={{ fontSize: 12, color: '#8C8C8C' }}>{variant.version} · {variant.routingName}</div>
            </Col>
            <Col span={12}>
              <div style={{ fontSize: 12, color: '#8C8C8C', marginBottom: 4 }}>同步自源路径</div>
              <div style={{ fontWeight: 600 }}>{source.routingCode}</div>
              <div style={{ fontSize: 12, color: '#8C8C8C' }}>{source.version} · {source.routingName}</div>
            </Col>
          </Row>
          <Divider style={{ margin: '12px 0' }} />
          <Row gutter={16} style={{ textAlign: 'center' }}>
            <Col span={8}>
              <div style={{ color: '#52C41A', fontWeight: 700, fontSize: 20 }}>{addedSel}</div>
              <div style={{ fontSize: 12, color: '#8C8C8C' }}>新增工序</div>
            </Col>
            <Col span={8}>
              <div style={{ color: '#FA8C16', fontWeight: 700, fontSize: 20 }}>{modifiedSel}</div>
              <div style={{ fontSize: 12, color: '#8C8C8C' }}>更新参数</div>
            </Col>
            <Col span={8}>
              <div style={{ color: '#8C8C8C', fontWeight: 700, fontSize: 20 }}>{totalRemoved}</div>
              <div style={{ fontSize: 12, color: '#8C8C8C' }}>保留变体独有</div>
            </Col>
          </Row>
        </div>
      </div>
    );
  };

  return (
    <Modal
      open={open}
      onCancel={() => { handleReset(); onCancel(); }}
      width={820}
      maskClosable={false}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 3, height: 16, background: '#FA8C16', borderRadius: 2, display: 'inline-block' }} />
          <SwapOutlined style={{ color: '#FA8C16' }} />
          <span>工艺路径同步更新</span>
          <Tag color="orange" style={{ marginLeft: 4, fontSize: 11 }}>差异对比</Tag>
        </div>
      }
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 12, color: '#8C8C8C' }}>
            {step === 0 ? (
              <>已选 <Text strong style={{ color: '#1677FF' }}>{selected.length}</Text> / {syncableKeys.length} 项变更</>
            ) : (
              <Button type="link" size="small" onClick={() => setStep(0)} style={{ padding: 0 }}>
                ← 返回修改选择
              </Button>
            )}
          </div>
          <Space>
            <Button onClick={() => { handleReset(); onCancel(); }}>取消</Button>
            {step === 0 && (
              <Button onClick={handleReset}>重置选择</Button>
            )}
            <Button
              type="primary"
              icon={step === 0 ? <ArrowRightOutlined /> : <SyncOutlined />}
              style={{ background: '#FA8C16', borderColor: '#FA8C16' }}
              onClick={handleConfirm}
              disabled={step === 0 && !hasAnyChange}
            >
              {step === 0 ? '下一步：确认同步' : '确认执行同步'}
            </Button>
          </Space>
        </div>
      }
      styles={{ body: { padding: '0 24px', maxHeight: '68vh', overflowY: 'auto' } }}
    >
      {/* ── 步骤条 ── */}
      <Steps
        current={step}
        size="small"
        style={{ padding: '16px 0 12px' }}
        items={[
          { title: '查看差异 & 选择同步项' },
          { title: '确认操作' },
        ]}
      />

      {step === 0 ? (
        <>
          {/* ── 基本信息行 ── */}
          <div style={{
            display: 'flex', gap: 16, padding: '10px 14px',
            background: '#f5f5f5', borderRadius: 8, marginBottom: 12,
            flexWrap: 'wrap',
          }}>
            <div>
              <span style={{ fontSize: 11, color: '#8C8C8C' }}>变体路径  </span>
              <Text strong>{variant.routingCode}</Text>
              <Text style={{ fontSize: 12, color: '#1677FF', marginLeft: 6 }}>{variant.version}</Text>
            </div>
            <div style={{ color: '#d9d9d9' }}>→</div>
            <div>
              <span style={{ fontSize: 11, color: '#8C8C8C' }}>同步自源路径  </span>
              <Text strong>{source.routingCode}</Text>
              <Text style={{ fontSize: 12, color: '#52C41A', marginLeft: 6 }}>{source.version}</Text>
            </div>
            {variant.sourceBaseVersion && (
              <div style={{ fontSize: 11, color: '#FA8C16' }}>
                <InfoCircleOutlined style={{ marginRight: 3 }} />
                变体基于 {variant.sourceBaseVersion} 创建，源已升至 {source.version}
              </div>
            )}
          </div>

          {/* syncNote 提示 */}
          {variant.syncNote && (
            <Alert
              type="info" showIcon
              message="源路径升版说明"
              description={<span style={{ fontSize: 12 }}>{variant.syncNote}</span>}
              style={{ marginBottom: 12 }}
            />
          )}

          {/* ── 统计 + 全选 ── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <Space size={8}>
              {totalAdded > 0 && (
                <Badge count={totalAdded} color="#52C41A">
                  <Tag icon={<PlusCircleOutlined />} color="success">新增工序</Tag>
                </Badge>
              )}
              {totalModified > 0 && (
                <Badge count={totalModified} color="#FA8C16">
                  <Tag icon={<EditOutlined />} color="warning">参数变更</Tag>
                </Badge>
              )}
              {totalRemoved > 0 && (
                <Badge count={totalRemoved} color="#FF4D4F">
                  <Tag icon={<MinusCircleOutlined />} color="error">变体独有</Tag>
                </Badge>
              )}
              {totalUnchanged > 0 && (
                <Tag color="default">{totalUnchanged} 道工序无变化</Tag>
              )}
            </Space>
            {syncableKeys.length > 0 && (
              <Checkbox
                indeterminate={selected.length > 0 && selected.length < syncableKeys.length}
                checked={selected.length === syncableKeys.length}
                onChange={toggleAll}
              >
                <span style={{ fontSize: 12 }}>全选可同步项</span>
              </Checkbox>
            )}
          </div>

          {/* ── 无差异提示 ── */}
          {!hasAnyChange && (
            <Alert
              type="success"
              showIcon
              icon={<CheckCircleOutlined />}
              message="工序内容完全一致，无需同步"
              description="变体路径与源路径的工序组成、参数均无差异，可直接清除待同步标记。"
              style={{ marginBottom: 12 }}
            />
          )}

          {/* ── 差异列表 ── */}
          {diffs.map((gd, gi) => (
            <div key={gi} style={{ marginBottom: gd.type === 'unchanged' ? 2 : 10 }}>
              {/* 并行组标签 */}
              {gd.isParallel && gd.label && (
                <div style={{
                  fontSize: 11, color: '#722ED1', fontWeight: 600,
                  marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  <BranchesOutlined />并行组：{gd.label}
                </div>
              )}
              {gd.stepDiffs.map(sd => renderStepDiff(sd))}
            </div>
          ))}
        </>
      ) : renderConfirmStep()}
    </Modal>
  );
};

export default SyncDiffModal;

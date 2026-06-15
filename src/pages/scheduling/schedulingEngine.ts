/**
 * 浮动排程引擎 — schedulingEngine.ts
 * PRD §5.2 排程算法：前向排程 + EDD优先级 + GMP硬约束校验 + 清场时间计算
 * 纯前端模拟（无后端依赖），可作为 POC 演示
 */
import {
  ScheduleWorkOrder, ScheduleItem, Resource, RoutingOp,
  ConstraintViolation, CleaningTask, CleanCheckItem,
  MOCK_RESOURCES, MOCK_SCHEDULE_WOS, ROUTING_OPS,
  MOCK_CALENDARS, MOCK_CLEANING_TASKS,
  getCleanType, getCleanDurationMinutes, CLEANING_RULES,
  checkConstraints, calcTimeZone,
  SCHEDULE_STATUS_COLOR, CLEAN_STATUS_COLOR,
  WoStatus, TimeZone, Factory, CleanType,
} from '../../store/schedulingStore';

// ─────────────────────────────────────────────────────────────
// 类型
// ─────────────────────────────────────────────────────────────
export interface EngineInput {
  workOrders: ScheduleWorkOrder[];
  resources: Resource[];
  planningHorizonDays: number;       // 排程视野（天）
  frozenZoneDays: number;            // 冻结区（天）
  rollingIntervalHours: number;      // 滚动刷新间隔
  startDate: Date;
  allowCrossShift: boolean;          // 允许跨班
  strategy: SchedulingStrategy;
}

export interface SchedulingStrategy {
  priorityRules: {
    frozenZoneLock: number;   // 权重 999
    dueDate: number;          // 权重 100
    urgentOrder: number;      // 权重 200
    sameProduct: number;      // 权重 50
    equipUtilization: number; // 权重 30
  };
  cleaningRules: {
    sameProductSameSpec: number;  // 分钟
    sameProductDiffSpec: number;
    diffProduct: number;
    similarProduct: number;
  };
}

export const DEFAULT_STRATEGY: SchedulingStrategy = {
  priorityRules: {
    frozenZoneLock: 999,
    dueDate: 100,
    urgentOrder: 200,
    sameProduct: 50,
    equipUtilization: 30,
  },
  cleaningRules: {
    sameProductSameSpec: 0,
    sameProductDiffSpec: 30,
    diffProduct: 60,
    similarProduct: 120,
  },
};

export interface EngineOutput {
  versionId: string;
  generatedAt: string;
  items: ScheduleItem[];
  cleaningTasks: CleaningTask[];
  violations: ConstraintViolation[];
  kpi: {
    utilization: number;
    otdRate: number;
    cleaningWasteH: number;
    urgentCount: number;
    conflictCount: number;
    scheduledCount: number;
    unscheduledCount: number;
  };
  log: EngineLogEntry[];
}

export interface EngineLogEntry {
  level: 'INFO'|'WARN'|'ERROR';
  message: string;
  woNo?: string;
  opNo?: string;
  resourceId?: string;
  timestamp: string;
}

// ─────────────────────────────────────────────────────────────
// 工具函数
// ─────────────────────────────────────────────────────────────

/** 添加分钟 */
function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60000);
}

/** 检查日历可用（节假日/维护排除） */
function isDateAvailable(date: Date, resource: Resource): boolean {
  const cal = MOCK_CALENDARS.find(c => c.id === resource.calendarId);
  if (!cal) return true;
  const dayOfWeek = date.getDay(); // 0=日
  if (!cal.workDays.includes(dayOfWeek)) return false;
  const dateStr = date.toISOString().split('T')[0];
  const ex = cal.exceptions.find(e => e.date === dateStr);
  if (ex && (ex.type === 'HOLIDAY' || ex.type === 'MAINTENANCE' || ex.type === 'BREAKDOWN')) {
    if (!ex.affectedResourceIds || ex.affectedResourceIds.includes(resource.id)) return false;
  }
  return true;
}

/** 取该资源次日08:00（跳过非工作日） */
function nextShiftStart(from: Date, resource: Resource): Date {
  let d = new Date(from);
  d.setDate(d.getDate() + 1);
  d.setHours(8, 0, 0, 0);
  // 最多找14天
  for (let i = 0; i < 14; i++) {
    if (isDateAvailable(d, resource)) return d;
    d.setDate(d.getDate() + 1);
  }
  return d;
}

/** 当日班次结束时间（默认16:00或24:00取较大） */
function shiftEndOfDay(date: Date, resource: Resource): Date {
  const cal = MOCK_CALENDARS.find(c => c.id === resource.calendarId);
  if (!cal || cal.shifts.length === 0) {
    const r = new Date(date); r.setHours(16, 0, 0, 0); return r;
  }
  const lastShift = cal.shifts[cal.shifts.length - 1];
  const endH = lastShift.endHour >= 24 ? 24 : lastShift.endHour;
  const r = new Date(date);
  r.setHours(endH === 24 ? 23 : endH, endH === 24 ? 59 : 0, 0, 0);
  return r;
}

/** 计算最早开始时间（综合考虑前驱完成时间、资源空闲时间、班次开始） */
function calcEarliestStart(
  earliestFromPredecessor: Date,
  resourceFreeAt: Date,
  startDate: Date,
): Date {
  const base = new Date(Math.max(
    earliestFromPredecessor.getTime(),
    resourceFreeAt.getTime(),
    startDate.getTime(),
  ));
  // 对齐到08:00（若当前时间在08:00之前）
  if (base.getHours() < 8) {
    base.setHours(8, 0, 0, 0);
  }
  return base;
}

/** 软约束评分（0~100，越高越优先） */
function softScore(
  resource: Resource,
  wo: ScheduleWorkOrder,
  resourceFreeAt: Date,
  strategy: SchedulingStrategy,
): number {
  let score = 100;
  // 连续生产奖励
  if (resource.lastProductCode === wo.productCode) score += strategy.priorityRules.sameProduct;
  // 利用率均衡（利用率越低奖励越多）
  const util = resource.utilizationPct ?? 50;
  score += Math.round((100 - util) * strategy.priorityRules.equipUtilization / 100);
  // 等待时间惩罚
  const waitH = (resourceFreeAt.getTime() - Date.now()) / 3600000;
  if (waitH > 24) score -= 10;
  return Math.max(0, Math.min(100, score));
}

/** 生成唯一ID */
let idSeq = 1000;
function genId(prefix: string): string {
  return `${prefix}-${Date.now()}-${++idSeq}`;
}

// ─────────────────────────────────────────────────────────────
// 资源时间线管理（追踪每个资源的空闲时间）
// ─────────────────────────────────────────────────────────────
class ResourceTimeline {
  /** 每个资源的最早可用时间 */
  private freeAt: Map<string, Date> = new Map();
  /** 每个资源最后生产的产品 */
  private lastProduct: Map<string, string> = new Map();

  init(resources: Resource[], startDate: Date) {
    resources.forEach(r => {
      this.freeAt.set(r.id, new Date(startDate));
      if (r.lastProductCode) this.lastProduct.set(r.id, r.lastProductCode);
    });
  }

  getFreeAt(resourceId: string): Date {
    return this.freeAt.get(resourceId) ?? new Date();
  }

  getLastProduct(resourceId: string): string | undefined {
    return this.lastProduct.get(resourceId);
  }

  occupy(resourceId: string, endTime: Date, productCode: string) {
    const cur = this.freeAt.get(resourceId);
    if (!cur || endTime > cur) {
      this.freeAt.set(resourceId, endTime);
    }
    this.lastProduct.set(resourceId, productCode);
  }
}

// ─────────────────────────────────────────────────────────────
// 核心排程算法
// ─────────────────────────────────────────────────────────────
export function runSchedulingEngine(input: EngineInput): EngineOutput {
  const { workOrders, resources, planningHorizonDays, frozenZoneDays, startDate, strategy } = input;
  const log: EngineLogEntry[] = [];
  const outputItems: ScheduleItem[] = [];
  const outputCleanTasks: CleaningTask[] = [];
  const allViolations: ConstraintViolation[] = [];

  const ts = () => new Date().toISOString();

  log.push({ level:'INFO', message:`排程引擎启动 — 规划视野 ${planningHorizonDays}天，冻结区 ${frozenZoneDays}天，工单数 ${workOrders.length}`, timestamp:ts() });

  // ── Step 1: EDD排序（综合优先级） ────────────────────────
  const sorted = [...workOrders]
    .filter(w => w.status === 'PENDING' || w.status === 'SCHEDULED')
    .sort((a, b) => {
      // 紧急插单最优先
      if (a.isInsertOrder !== b.isInsertOrder) return a.isInsertOrder ? -1 : 1;
      if (a.isUrgent !== b.isUrgent) return a.isUrgent ? -1 : 1;
      // EDD
      const ddA = new Date(a.dueDate).getTime();
      const ddB = new Date(b.dueDate).getTime();
      if (ddA !== ddB) return ddA - ddB;
      // 优先级
      return b.priority - a.priority;
    });

  log.push({ level:'INFO', message:`EDD排序完成，待排工单: ${sorted.map(w=>w.woNo).join(', ')}`, timestamp:ts() });

  // ── Step 2: 初始化资源时间线 ─────────────────────────────
  const timeline = new ResourceTimeline();
  timeline.init(resources, startDate);

  let scheduledCount = 0;
  let unscheduledCount = 0;

  // ── Step 3: 逐工单排程 ──────────────────────────────────
  for (const wo of sorted) {
    const routing = ROUTING_OPS[wo.routingCode];
    if (!routing) {
      log.push({ level:'WARN', message:`工单 ${wo.woNo} 工艺路径 ${wo.routingCode} 未找到，跳过`, woNo:wo.woNo, timestamp:ts() });
      unscheduledCount++;
      continue;
    }

    log.push({ level:'INFO', message:`开始排程工单 ${wo.woNo} (${wo.productName})，优先级P${wo.priority}，交货期 ${new Date(wo.dueDate).toLocaleDateString()}`, woNo:wo.woNo, timestamp:ts() });

    let predecessorEndTime = new Date(startDate);
    const woItemIds: string[] = [];

    let woCritical = false;  // 是否有HARD约束未满足

    for (const op of routing) {
      // 候选资源
      const candidates = resources.filter(r => op.resourceIds.includes(r.id));
      if (candidates.length === 0) {
        log.push({ level:'ERROR', message:`工序 ${op.opNo} 无可用资源，工单 ${wo.woNo} 排程失败`, woNo:wo.woNo, opNo:op.opNo, timestamp:ts() });
        woCritical = true;
        break;
      }

      // 选最优资源（软约束评分 + 最早空闲）
      let bestResource: Resource | null = null;
      let bestStart: Date | null = null;
      let bestScore = -1;
      let bestViolations: ConstraintViolation[] = [];
      let bestCleanDuration = 0;
      let bestCleanType: CleanType = 'NONE';

      for (const res of candidates) {
        // 硬约束：洁净区
        const levelMap: Record<string, number> = {'D级':1,'C级':2,'B级':3,'A级':4};
        if ((levelMap[res.cleanRoomLevel]??0) < (levelMap[op.requiredCleanRoomLevel]??0)) {
          log.push({ level:'WARN', message:`资源 ${res.name} 洁净级不满足 ${op.opName} 要求`, woNo:wo.woNo, opNo:op.opNo, resourceId:res.id, timestamp:ts() });
          continue;
        }

        // 硬约束：设备状态
        if (res.status === 'BREAKDOWN' || res.status === 'OFFLINE') {
          log.push({ level:'WARN', message:`资源 ${res.name} 当前${res.status}，跳过`, woNo:wo.woNo, resourceId:res.id, timestamp:ts() });
          continue;
        }

        // 计算清场时间
        const prevProduct = timeline.getLastProduct(res.id);
        const cleanType = prevProduct ? getCleanType(prevProduct, wo.productCode) : 'NONE';
        const cleanDuration = CLEANING_RULES[cleanType].durationMinutes;

        // 最早开始时间 = max(前驱完成, 资源空闲+清场, startDate)
        const resourceFree = timeline.getFreeAt(res.id);
        const earliestStart = calcEarliestStart(
          predecessorEndTime,
          addMinutes(resourceFree, cleanDuration),
          startDate,
        );

        // 日历可用性检查
        if (!isDateAvailable(earliestStart, res)) {
          const ns = nextShiftStart(earliestStart, res);
          log.push({ level:'INFO', message:`资源 ${res.name} 在 ${earliestStart.toLocaleDateString()} 不可用（假期/维护），推至 ${ns.toLocaleDateString()}`, timestamp:ts() });
        }

        const setupMin = op.setupMinutes ?? 0;
        const endTime = addMinutes(earliestStart, op.durationMinutes + setupMin);

        // 约束校验
        const violations = checkConstraints(wo, op, res, earliestStart, endTime, prevProduct);

        // 评分（HARD约束不阻断但记录，前端POC允许继续排但标红）
        const sc = softScore(res, wo, resourceFree, strategy) - violations.filter(v=>v.severity==='HARD').length * 20;

        if (sc > bestScore) {
          bestScore = sc;
          bestResource = res;
          bestStart = earliestStart;
          bestViolations = violations;
          bestCleanDuration = cleanDuration;
          bestCleanType = cleanType;
        }
      }

      if (!bestResource || !bestStart) {
        log.push({ level:'ERROR', message:`工单 ${wo.woNo} 工序 ${op.opNo} 无可排资源`, woNo:wo.woNo, opNo:op.opNo, timestamp:ts() });
        unscheduledCount++;
        woCritical = true;
        break;
      }

      // 插入清场条
      if (bestCleanDuration > 0) {
        const cleanStart = timeline.getFreeAt(bestResource.id);
        const cleanEnd   = addMinutes(cleanStart, bestCleanDuration);
        const cleanId    = genId('CTK-ENG');
        const ctkId      = genId('SI-CLN');

        outputItems.push({
          id: ctkId,
          woNo: `CLN-${wo.woNo}`,
          productCode: '',
          productName: `${CLEANING_RULES[bestCleanType].label}`,
          factory: wo.factory,
          opNo: 'CLN',
          opName: CLEANING_RULES[bestCleanType].label,
          resourceId: bestResource.id,
          resourceName: bestResource.name,
          cleanRoomLevel: bestResource.cleanRoomLevel,
          startTime: cleanStart.toISOString(),
          endTime: cleanEnd.toISOString(),
          durationMinutes: bestCleanDuration,
          status: 'CLEANING',
          timeZone: calcTimeZone(cleanStart.toISOString()),
          isLocked: false,
          isColdChain: false,
          constraintViolations: [],
          softScore: 100,
          priority: 5,
          color: CLEANING_RULES[bestCleanType].color,
          isCleaningBar: true,
          cleanType: bestCleanType,
          cleaningTaskId: cleanId,
        });

        // 生成清场任务
        const prevProd = timeline.getLastProduct(bestResource.id) ?? '';
        outputCleanTasks.push({
          id: cleanId,
          resourceId: bestResource.id,
          resourceName: bestResource.name,
          factory: wo.factory,
          prevWoNo: '',
          prevProductCode: prevProd,
          prevProductName: prevProd,
          nextWoNo: wo.woNo,
          nextProductCode: wo.productCode,
          nextProductName: wo.productName,
          cleanType: bestCleanType,
          isSameProduct: prevProd === wo.productCode,
          startTime: cleanStart.toISOString(),
          endTime: cleanEnd.toISOString(),
          durationMinutes: bestCleanDuration,
          status: 'PENDING',
          qaRequired: CLEANING_RULES[bestCleanType].requireQA,
          ebrLinked: true,
          checkItems: CLEANING_RULES[bestCleanType].steps.map((step, i) => ({
            id: `${cleanId}-CC-${i+1}`,
            item: step,
            required: true,
            checked: false,
            photoRequired: CLEANING_RULES[bestCleanType].requirePhoto && i < 2,
          })),
        });

        log.push({ level:'INFO', message:`资源 ${bestResource.name} 插入清场任务（${CLEANING_RULES[bestCleanType].label}，${bestCleanDuration}分钟）`, timestamp:ts() });
      }

      // 生成排程条目
      const setupMin = op.setupMinutes ?? 0;
      const endTime = addMinutes(bestStart, op.durationMinutes + setupMin);
      const tz = calcTimeZone(bestStart.toISOString());
      const isLocked = tz === 'FROZEN' || tz === 'HISTORY';
      const hasHardViolation = bestViolations.some(v => v.severity === 'HARD');

      const itemId = genId('SI-ENG');
      const item: ScheduleItem = {
        id: itemId,
        woNo: wo.woNo,
        productCode: wo.productCode,
        productName: wo.productName,
        factory: wo.factory,
        opNo: op.opNo,
        opName: op.opName,
        resourceId: bestResource.id,
        resourceName: bestResource.name,
        cleanRoomLevel: op.requiredCleanRoomLevel,
        startTime: bestStart.toISOString(),
        endTime: endTime.toISOString(),
        durationMinutes: op.durationMinutes + setupMin,
        status: hasHardViolation ? 'ABNORMAL' : (tz === 'HISTORY' ? 'COMPLETED' : 'WAITING'),
        timeZone: tz,
        isLocked,
        isColdChain: op.isColdChain,
        constraintViolations: bestViolations,
        softScore: bestScore,
        priority: wo.priority,
        color: hasHardViolation ? '#F5222D' : undefined,
        notes: wo.notes,
        predecessorId: woItemIds[woItemIds.length - 1],
      };

      outputItems.push(item);
      woItemIds.push(itemId);
      allViolations.push(...bestViolations);

      // 更新时间线
      timeline.occupy(bestResource.id, endTime, wo.productCode);
      predecessorEndTime = endTime;

      log.push({
        level: hasHardViolation ? 'WARN' : 'INFO',
        message: `已排 ${wo.woNo} ${op.opNo}(${op.opName}) → ${bestResource.name} [${bestStart.toLocaleString()}~${endTime.toLocaleString()}] 软分:${bestScore}`,
        woNo: wo.woNo, opNo: op.opNo, resourceId: bestResource.id, timestamp: ts(),
      });
    }

    if (!woCritical) {
      scheduledCount++;
      log.push({ level:'INFO', message:`工单 ${wo.woNo} 排程完成，共 ${woItemIds.length} 个工序条目`, woNo:wo.woNo, timestamp:ts() });
    }
  }

  // ── Step 4: KPI计算 ──────────────────────────────────────
  const totalSlots = resources.length * planningHorizonDays * 8 * 60;  // 总可用分钟
  const occupiedMins = outputItems
    .filter(i => !i.isCleaningBar)
    .reduce((s, i) => s + i.durationMinutes, 0);
  const cleanWasteMins = outputItems
    .filter(i => i.isCleaningBar)
    .reduce((s, i) => s + i.durationMinutes, 0);
  const utilization = totalSlots > 0 ? Math.min(100, (occupiedMins / totalSlots) * 100) : 0;
  const conflictCount = allViolations.filter(v => v.severity === 'HARD').length;
  const urgentCount = workOrders.filter(w => w.isInsertOrder || w.isUrgent).length;

  // OTD：工单末工序完成时间 vs 交货期
  let otdCount = 0;
  for (const wo of sorted) {
    const woItems = outputItems.filter(i => i.woNo === wo.woNo && !i.isCleaningBar);
    if (woItems.length === 0) continue;
    const lastEnd = Math.max(...woItems.map(i => new Date(i.endTime).getTime()));
    if (lastEnd <= new Date(wo.dueDate).getTime()) otdCount++;
  }
  const otdRate = sorted.length > 0 ? (otdCount / sorted.length) * 100 : 100;

  const kpi = {
    utilization: parseFloat(utilization.toFixed(1)),
    otdRate: parseFloat(otdRate.toFixed(1)),
    cleaningWasteH: parseFloat((cleanWasteMins / 60).toFixed(1)),
    urgentCount,
    conflictCount,
    scheduledCount,
    unscheduledCount,
  };

  const versionId = `VER-ENG-${Date.now()}`;
  log.push({ level:'INFO', message:`排程完成！版本 ${versionId}，已排 ${scheduledCount}，未排 ${unscheduledCount}，冲突 ${conflictCount}，OTD ${kpi.otdRate}%`, timestamp:ts() });

  return {
    versionId,
    generatedAt: new Date().toISOString(),
    items: outputItems,
    cleaningTasks: outputCleanTasks,
    violations: allViolations,
    kpi,
    log,
  };
}

// ─────────────────────────────────────────────────────────────
// 事件重排处理
// ─────────────────────────────────────────────────────────────
export interface RescheduleResult {
  affectedItemIds: string[];
  newItems: ScheduleItem[];
  log: EngineLogEntry[];
  requiresApproval: boolean;
  proposedDelayMinutes: number;
}

export function handleRescheduleEvent(
  eventType: string,
  affectedWoNos: string[],
  impactMinutes: number,
  currentItems: ScheduleItem[],
  frozenZoneDays: number,
): RescheduleResult {
  const log: EngineLogEntry[] = [];
  const ts = () => new Date().toISOString();
  const today = new Date('2026-06-14');

  // 找到受影响的条目
  const affectedItems = currentItems.filter(i => affectedWoNos.includes(i.woNo) && !i.isCleaningBar);

  // 判断是否在冻结区
  const inFrozen = affectedItems.some(i => i.timeZone === 'FROZEN');
  const requiresApproval = inFrozen;

  log.push({ level:'INFO', message:`事件重排触发：${eventType}，影响工单 ${affectedWoNos.join(',')}，影响时长 ${impactMinutes}分钟，${inFrozen ? '冻结区需审批' : '滚动区自动处理'}`, timestamp:ts() });

  // 生成推迟后的条目（克隆+推迟endTime/startTime）
  const newItems: ScheduleItem[] = affectedItems
    .filter(i => i.timeZone !== 'HISTORY' && i.timeZone !== 'FROZEN')
    .map(i => ({
      ...i,
      id: genId('SI-RSC'),
      startTime: addMinutes(new Date(i.startTime), impactMinutes).toISOString(),
      endTime:   addMinutes(new Date(i.endTime),   impactMinutes).toISOString(),
      timeZone:  calcTimeZone(addMinutes(new Date(i.startTime), impactMinutes).toISOString()),
      notes: `[重排] 因 ${eventType} 推迟 ${impactMinutes} 分钟`,
    }));

  log.push({ level:'INFO', message:`已生成 ${newItems.length} 个重排后条目`, timestamp:ts() });

  return {
    affectedItemIds: affectedItems.map(i => i.id),
    newItems,
    log,
    requiresApproval,
    proposedDelayMinutes: impactMinutes,
  };
}

// ─────────────────────────────────────────────────────────────
// 约束实时校验（拖拽时调用）
// ─────────────────────────────────────────────────────────────
export interface DragValidationResult {
  valid: boolean;
  violations: ConstraintViolation[];
  message: string;
}

export function validateDragDrop(
  item: ScheduleItem,
  newStartTime: Date,
  newResourceId: string,
  allItems: ScheduleItem[],
  resources: Resource[],
): DragValidationResult {
  const violations: ConstraintViolation[] = [];

  // 1. 冻结区检查
  const tz = calcTimeZone(newStartTime.toISOString());
  if (tz === 'FROZEN' || tz === 'HISTORY') {
    violations.push({
      ruleId:'CR-DRAG-01', type:'EQUIPMENT_OCCUPATION', severity:'HARD',
      message:'冻结区任务不可直接拖拽，请提交审批申请',
      suggestion:'点击"申请解锁"发起审批流程',
    });
  }

  // 2. 时间重叠检查
  const newEnd = addMinutes(newStartTime, item.durationMinutes);
  const conflicts = allItems.filter(i =>
    i.id !== item.id &&
    i.resourceId === newResourceId &&
    !i.isCleaningBar &&
    new Date(i.startTime) < newEnd &&
    new Date(i.endTime) > newStartTime,
  );
  if (conflicts.length > 0) {
    violations.push({
      ruleId:'CR-DRAG-02', type:'EQUIPMENT_OCCUPATION', severity:'HARD',
      message:`目标时段与 ${conflicts.map(c=>c.woNo).join(',')} 存在时间冲突`,
      suggestion:'请将任务调整到设备空闲时段',
    });
  }

  // 3. 资源洁净区检查
  const res = resources.find(r => r.id === newResourceId);
  if (res) {
    const levelMap: Record<string, number> = {'D级':1,'C级':2,'B级':3,'A级':4};
    const itemLevel = levelMap[item.cleanRoomLevel] ?? 1;
    const resLevel  = levelMap[res.cleanRoomLevel] ?? 1;
    if (resLevel < itemLevel) {
      violations.push({
        ruleId:'CR-DRAG-03', type:'CLEAN_ROOM_LEVEL', severity:'HARD',
        message:`目标资源 ${res.name} 洁净级(${res.cleanRoomLevel})低于工序要求(${item.cleanRoomLevel})`,
        suggestion:'请选择符合洁净级别的目标资源',
      });
    }
  }

  const valid = violations.filter(v => v.severity === 'HARD').length === 0;
  return {
    valid,
    violations,
    message: valid ? '调整有效，约束校验通过' : `存在 ${violations.filter(v=>v.severity==='HARD').length} 个硬约束冲突`,
  };
}

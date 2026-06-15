/**
 * PAD 工序执行数据层
 * 医疗器械MES 工业 PAD 生产执行系统
 * 严格依据 PRD V1.0 | 2026-04-26
 * 17 道工序 × 9 个标准阶段
 */
import type { OperationPhase, PhaseType } from '../operation/operationData';
import { mockOperations } from '../operation/operationData';
import type { WorkOrder as L2WorkOrder, FloatTicketV2 } from '../workorder/workOrderData';
import { isUserCleared } from '../../store/mesStore';

export type { OperationPhase };

// ==================== 类型定义 ====================

export type StageCode =
  | 'PRE_CLEAN'
  | 'CHECK_IN'
  | 'MAT_VERIFY'
  | 'FIRST_PIECE'
  | 'DATA_COLLECT'
  | 'SELF_CHECK'
  | 'POST_CLEAN'
  | 'REPORT'
  | 'CHECK_OUT';

export type StageStatus = 'pending' | 'in_progress' | 'completed' | 'skipped';
export type OperationStatus = 'locked' | 'ready' | 'in_progress' | 'completed' | 'abnormal';

export interface StageConfig {
  code: StageCode;
  name: string;
  enabled: boolean;
  requiresESign?: boolean;    // 强制电子签名
  requiresDualSign?: boolean; // 双人复核
  content?: string;           // 阶段内容说明
}

export interface OperationDef {
  seq: number;                // 工序序号 10/20/30...
  code: string;               // 工序编码
  name: string;               // 工序名称
  alias?: string;             // 别名
  workshop: string;           // 所属车间
  remark?: string;            // 备注
  hidden?: boolean;           // 是否前端隐藏（如热处理/清洗不体现）
  stages: StageConfig[];      // 9 个阶段配置
  hasQcInspection?: boolean;  // 是否触发独立 QC 检验单
  inspectionRecordName?: string; // 检验记录单名称（单张）
  dualInspectionRecords?: string[]; // 双检验记录单名称（如研磨一需同时生成两张独立单据）
  masterOpCode?: string;      // 关联工序主数据编码（用于加载 phases 字段配置）
}

// Mock 工单数据
export interface WorkOrder {
  id: string;
  woNo: string;
  productName: string;
  productSpec: string;
  batchNo: string;
  planQty: number;
  customer?: string;
  priority: 'A' | 'B' | 'C';
  planStartDate: string;
  floatBarcode: string;
  materialLotNo: string;
  handleLotNo?: string;
  limitLotNo?: string;
  currentOpSeq: number;
}

// 阶段执行状态
export interface StageExecution {
  code: StageCode;
  status: StageStatus;
  startTime?: string;
  endTime?: string;
  operator?: string;
  data?: Record<string, unknown>;
}

// ── 单次报工记录（多次报工核心数据结构） ──
export interface ReportRecord {
  seq: number;              // 第几次报工（1-based）
  shiftName: string;        // 班次名称
  finishQty: number;        // 本次完工数量
  goodQty: number;          // 本次合格数量
  badQty: number;           // 本次不良数量
  scrapQty: number;         // 本次报废数量
  equipId: string;          // 使用设备ID
  equipName: string;        // 使用设备名称
  operator: string;         // 操作员
  reportTime: string;       // 报工时间
  isLastReport: boolean;    // 是否末次报工
  params?: Record<string, unknown>;  // 工艺参数快照
  badReasons?: string;      // 不良原因
  photoCount?: number;      // 拍照数量
  remark?: string;
}

// 工序执行状态（每道工序的运行态）
export interface OperationExecution {
  opCode: string;
  status: OperationStatus;
  inTime?: string;
  outTime?: string;
  // 累计汇总（多次报工合计）
  finishQty?: number;
  goodQty?: number;
  badQty?: number;
  scrapQty?: number;
  // 多次报工记录列表
  reportRecords: ReportRecord[];
  // 阶段执行状态（首件/前清场等一次性阶段的锁定态）
  firstPiecePassed?: boolean;  // 首件已合格（后续班次复用）
  preCleanDone?: boolean;      // 前清场已完成（首班）
  stages: Record<StageCode, StageExecution>;
}

// ==================== 9 个标准阶段定义 ====================

const ALL_STAGES: StageConfig[] = [
  { code: 'PRE_CLEAN', name: '前清场', enabled: true, requiresESign: true, content: '设备清场确认' },
  { code: 'CHECK_IN', name: '进站', enabled: true, content: '扫描浮漂条码进站' },
  { code: 'MAT_VERIFY', name: '物料一致确认', enabled: true, content: '扫描物料批号核对BOM' },
  { code: 'FIRST_PIECE', name: '首件确认', enabled: true, requiresDualSign: true, content: '首件检验' },
  { code: 'DATA_COLLECT', name: '数据采集', enabled: true, content: '抽检数据记录' },
  { code: 'SELF_CHECK', name: '自检', enabled: true, content: '过程检验' },
  { code: 'POST_CLEAN', name: '后清场', enabled: true, requiresESign: true, content: '清场并转移产品' },
  { code: 'REPORT', name: '报工', enabled: true, requiresESign: true, content: '数量和参数报工' },
  { code: 'CHECK_OUT', name: '出站', enabled: true, requiresESign: true, content: '扫描浮漂出站' },
];

function makeStages(enabled: Partial<Record<StageCode, boolean>>, content?: Partial<Record<StageCode, string>>): StageConfig[] {
  return ALL_STAGES.map(s => ({
    ...s,
    enabled: enabled[s.code] !== undefined ? enabled[s.code]! : true,
    content: content?.[s.code] ?? s.content,
  }));
}

// ==================== 17 道工序定义（严格按 PRD Excel 阶段开关）====================

export const OPERATIONS: OperationDef[] = [
  // OP-10 机床成型
  {
    seq: 10,
    code: 'OP-10-GRIND',
    name: '机床成型',
    alias: '手柄打码',
    workshop: '精密加工车间',
    stages: makeStages(
      { PRE_CLEAN: true, CHECK_IN: true, MAT_VERIFY: true, FIRST_PIECE: true, DATA_COLLECT: true, SELF_CHECK: false, POST_CLEAN: true, REPORT: true, CHECK_OUT: true },
      {
        MAT_VERIFY: '主料批号、辅料批号',
        FIRST_PIECE: '产品尺寸（外径D1/D2、尖端直径、锥度、螺纹完整性、表面粗糙度Ra）',
        DATA_COLLECT: '生产员工自己抽检数据：设备编号、主轴转速、进给速度、磨削深度、冷却液浓度、计划/实际/不良产量',
        POST_CLEAN: '清理本批次产品，标识并按流程转移；不合格品、废料、尾料分类标识清理出现场',
        REPORT: '生产日期、工艺参数、生产人员、设备、数量',
      }
    ),
    hasQcInspection: true,
    inspectionRecordName: '机床成型检验记录',
    masterOpCode: 'OP-JC-001',
  },

  // OP-20 清洗一
  // 截图: 前清场✓ 进站✓ 物料✓  首件✓  数据采集✓  自检×  后清场✓ 报工✓ 出站✓
  // 共7个阶段：S1前清场(5字段) S2物料一致确认(5字段) S3首件确认(9字段) S4数据采集(9字段)
  //           S5后清场(4字段) S6报工(6字段) S7出站(4字段) 合计42字段
  {
    seq: 20,
    code: 'OP-20-WASH1',
    name: '清洗一',
    workshop: '清洗车间',
    stages: makeStages(
      { PRE_CLEAN: true, CHECK_IN: true, MAT_VERIFY: true, FIRST_PIECE: true, DATA_COLLECT: true, SELF_CHECK: false, POST_CLEAN: true, REPORT: true, CHECK_OUT: true },
      {
        PRE_CLEAN: '确认设备台面、内部无上批遗留产品；确认上一批产品工序转移单已转移；确认本批产品实物与工序转移产品信息一致；确认清洗液在有效期内',
        MAT_VERIFY: '核对工序转移单号、来料批号、来料数量，确认物料外观完好无损',
        FIRST_PIECE: '清洗后首件外观检查：清洗效果/外观/超声频率/清洗温度/清洗时间（双人复核）',
        DATA_COLLECT: '记录设备编号+名称、超声频率、清洗温度、清洗时间、清洗液有效期、计划/实际/不良产量',
        POST_CLEAN: '清理工作台和设备里面的本批次产品，确认无残留；核对产品实物与工序转移单产品信息一致后，将产品与工序转移单按流程转移到下道工序',
        REPORT: '生产日期、工艺参数、生产人员、设备、数量',
      }
    ),
    masterOpCode: 'OP-QX1-001',
  },

  // OP-30 尾部修整
  // Excel: 前清场✓ 进站✓ 物料×  首件×  数据采集×  自检×  后清场✓ 报工✓ 出站✓
  // 共5个阶段：S1前清场(5字段) S2进站(4字段) S3后清场(4字段) S4报工(6字段) S5出站(4字段)
  {
    seq: 30,
    code: 'OP-30-TAIL',
    name: '尾部修整',
    workshop: '精密加工车间',
    stages: makeStages(
      { PRE_CLEAN: true, CHECK_IN: true, MAT_VERIFY: false, FIRST_PIECE: false, DATA_COLLECT: false, SELF_CHECK: false, POST_CLEAN: true, REPORT: true, CHECK_OUT: true },
      {
        PRE_CLEAN: '确认设备台面、内部无上批遗留产品；确认上一批产品工序转移单已转移；确认本批产品实物与工序转移产品信息一致',
        POST_CLEAN: '清理工作台和设备台面的本批次产品，确认无残留；核对产品实物与工序转移单产品信息一致后，将产品与工序转移单按流程转移到下道工序',
        REPORT: '生产日期、工艺参数、生产人员、设备、数量',
      }
    ),
    masterOpCode: 'OP-WBX-001',
  },

  // OP-40 尖部修整
  // Excel: 前清场✓ 进站✓ 物料×  首件×  数据采集×  自检×  后清场✓ 报工✓ 出站✓
  // 共5个阶段：S1前清场(5字段) S2进站(4字段) S3后清场(4字段) S4报工(6字段) S5出站(4字段)
  {
    seq: 40,
    code: 'OP-40-TIP',
    name: '尖部修整',
    workshop: '精密加工车间',
    stages: makeStages(
      { PRE_CLEAN: true, CHECK_IN: true, MAT_VERIFY: false, FIRST_PIECE: false, DATA_COLLECT: false, SELF_CHECK: false, POST_CLEAN: true, REPORT: true, CHECK_OUT: true },
      {
        PRE_CLEAN: '确认设备和工作台面无上批遗留产品；确认上一批产品工序转移单已转移；确认本批产品实物与工序转移产品信息一致',
        POST_CLEAN: '清理工作台和设备台面的本批次产品，确认无残留；核对产品实物与工序转移单产品信息一致后，将产品与工序转移单按流程转移到下道工序',
        REPORT: '生产日期、工艺参数、生产人员、设备、数量',
      }
    ),
    masterOpCode: 'OP-JPX-001',
  },

  // OP-50 研磨一（含自检/QC检验）
  // Excel: 前清场✓ 进站✓ 物料✓  首件✓  数据采集✓  自检✓  后清场✓ 报工✓ 出站✓
  // 共9个阶段：S1前清场(5字段) S2进站(4字段) S3物料一致确认(5字段) S4首件确认(5字段)
  //           S5数据采集(8字段) S6自检(9字段) S7后清场(4字段) S8报工(6字段) S9出站(4字段)
  {
    seq: 50,
    code: 'OP-50-GRIND1',
    name: '研磨一',
    alias: '检验/上色',
    workshop: '精密加工车间',
    remark: '上色',
    stages: makeStages(
      { PRE_CLEAN: true, CHECK_IN: true, MAT_VERIFY: true, FIRST_PIECE: true, DATA_COLLECT: true, SELF_CHECK: true, POST_CLEAN: true, REPORT: true, CHECK_OUT: true },
      {
        PRE_CLEAN: '确认设备台面、内部无上批遗留产品；确认上一批产品工序转移单已转移；确认本批产品实物与工序转移产品信息一致',
        MAT_VERIFY: '核对工序转移单号、来料批号、来料数量，确认半成品外观完好无损',
        FIRST_PIECE: '研磨首件检验：螺纹节距/刃深（槽深）/外观检查（无毛刺/崩刃）',
        DATA_COLLECT: '记录设备编号+名称、砂轮规格、主轴转速、进给速度、计划/实际/不良产量',
        SELF_CHECK: '检验项：尺寸、外观。现场QC检验，先进行报工完工数量，QA检验完成后同步合格数量。单独形成《机床成型检验记录》《超声波清洗检验记录》，记录须关联检测设备信息',
        POST_CLEAN: '清理工作台和设备台面的本批次产品，确认无残留；核对产品实物与工序转移单产品信息一致后，将产品与工序转移单按流程转移到下道工序',
        REPORT: '生产日期、工艺参数、生产人员、设备、数量（合格数量待QA检验完成后回写）',
      }
    ),
    hasQcInspection: true,
    // 研磨一自检阶段同时生成两张独立检验单据：
    // ①《数控机床成型检验记录》DK/QR-067  ②《超声波清洗检验记录》DK/QR-119
    dualInspectionRecords: ['机床成型检验记录', '超声波清洗检验记录'],
    inspectionRecordName: '机床成型检验记录', // 兼容旧字段
    masterOpCode: 'OP-YM1-001',
  },

  // OP-60 热处理/研磨二（前端隐藏）
  // Excel(热处理 研磨二): 前清场✓ 进站✓ 物料×  首件×  数据采集×  自检×  后清场✓ 报工✓ 出站✓
  // 阶段5个：前清场/进站/后清场/报工/出站
  {
    seq: 60,
    code: 'OP-60-HEAT',
    name: '热处理',
    alias: '研磨二',
    workshop: '热处理车间',
    remark: '热处理不体现',
    hidden: true,
    stages: makeStages(
      { PRE_CLEAN: true, CHECK_IN: true, MAT_VERIFY: false, FIRST_PIECE: false, DATA_COLLECT: false, SELF_CHECK: false, POST_CLEAN: true, REPORT: true, CHECK_OUT: true },
      {
        PRE_CLEAN: '确认设备台面、内部无上批遗留产品；确认上一批产品工序转移单已转移；确认本批产品实物与工序转移产品信息一致',
        POST_CLEAN: '清理工作台和设备台面的本批次产品，确认无残留；核对产品实物与工序转移单产品信息一致后，将产品与工序转移单按流程转移到下道工序',
        REPORT: '生产日期、工艺参数、生产人员、设备、数量',
      }
    ),
    masterOpCode: 'OP-RCL-001',
  },

  // OP-70 清洗二（前端隐藏）
  // Excel(清洗、清洗二): 前清场✓ 进站✓ 物料×  首件×  数据采集×  自检✓  后清场✓ 报工✓ 出站✓
  // 阶段6个：前清场/进站/自检/后清场/报工/出站
  // 备注：1.现场QC检验，先进行报工完工数量，QA检验完成同步合格数量；2.此检验记录不体现在批记录中
  {
    seq: 70,
    code: 'OP-70-WASH2',
    name: '清洗',
    alias: '清洗二',
    workshop: '清洗车间',
    remark: '清洗不体现',
    hidden: true,
    stages: makeStages(
      { PRE_CLEAN: true, CHECK_IN: true, MAT_VERIFY: false, FIRST_PIECE: false, DATA_COLLECT: false, SELF_CHECK: true, POST_CLEAN: true, REPORT: true, CHECK_OUT: true },
      {
        PRE_CLEAN: '确认工作台和设备台面无上批遗留产品；确认上一批产品工序转移单已转移；确认本批产品实物与工序转移产品信息一致',
        SELF_CHECK: '检验项：尺寸、外观。关联所使用的检验设备。具体检验内容参考截图。【备注】现场QC检验，先进行报工完工数量，QA检验完成后同步合格数量；此检验记录不体现在批记录中，形成独立《超声波清洗检验记录》',
        POST_CLEAN: '清理工作台和设备台面的本批次产品，确认无残留；核对产品实物与工序转移单产品信息一致后，将产品与工序转移单按流程转移到下道工序',
        REPORT: '生产日期、工艺参数、生产人员、设备、数量',
      }
    ),
    hasQcInspection: true,
    inspectionRecordName: '超声波清洗检验记录',
    masterOpCode: 'OP-QX2-001',
  },

  // OP-80 检验（研磨二后中间检验，工艺路径中不独立体现，此处保留供参考）
  {
    seq: 80,
    code: 'OP-80-INSPECT1',
    name: '检验',
    workshop: '质检车间',
    hidden: true,
    stages: makeStages(
      { PRE_CLEAN: true, CHECK_IN: true, MAT_VERIFY: false, FIRST_PIECE: false, DATA_COLLECT: false, SELF_CHECK: false, POST_CLEAN: true, REPORT: true, CHECK_OUT: true },
      {
        POST_CLEAN: '清理工作台的本批次产品，核对产品实物与转移单信息一致后转移',
        REPORT: '生产日期、检验人员、设备、数量',
      }
    ),
  },

  // OP-90 刻线
  // Excel(划线): 前清场✓ 进站✓ 物料✓(手柄/手柄批号)  首件✓(产品长度/手柄可靠性测试)  数据采集×  自检×  后清场✓ 报工✓ 出站✓
  // 阶段7个：前清场/进站/物料一致确认/首件确认/后清场/报工/出站
  {
    seq: 90,
    code: 'OP-90-LINE',
    name: '刻线',
    workshop: '精密加工车间',
    stages: makeStages(
      { PRE_CLEAN: true, CHECK_IN: true, MAT_VERIFY: true, FIRST_PIECE: true, DATA_COLLECT: false, SELF_CHECK: false, POST_CLEAN: true, REPORT: true, CHECK_OUT: true },
      {
        PRE_CLEAN: '确认工作台和设备台面无上批遗留产品；确认上一批产品工序转移单已转移；确认本批产品实物与工序转移产品信息一致',
        MAT_VERIFY: '手柄、手柄批号',
        FIRST_PIECE: '产品的长度、手柄可靠性测试（需要能体现使用的检测设备信息）',
        POST_CLEAN: '清理工作台面的本批次产品，确认无残留；核对产品实物与工序转移单产品信息一致后，将合格产品与工序转移单按流程转移到下道工序；不合格产品进行隔离标识',
        REPORT: '生产日期、工艺参数、生产人员、设备、数量',
      }
    ),
    masterOpCode: 'OP-KX-001',
  },

  // OP-100 组装
  // Excel(组装): 前清场✓ 进站✓ 物料×  首件×  数据采集×  自检×  后清场✓ 报工✓ 出站✓
  // 阶段5个：前清场/进站/后清场/报工/出站
  {
    seq: 100,
    code: 'OP-100-ASM',
    name: '组装',
    workshop: '组装车间',
    stages: makeStages(
      { PRE_CLEAN: true, CHECK_IN: true, MAT_VERIFY: false, FIRST_PIECE: false, DATA_COLLECT: false, SELF_CHECK: false, POST_CLEAN: true, REPORT: true, CHECK_OUT: true },
      {
        PRE_CLEAN: '确认工作台和设备台面无上批遗留产品；确认上一批产品工序转移单已转移；确认本批产品实物与工序转移产品信息一致',
        POST_CLEAN: '清理工作台面的本批次产品，确认无残留；核对产品实物与工序转移单产品信息一致后，将合格产品与工序转移单按流程转移到下道工序；不合格产品进行隔离标识',
        REPORT: '生产日期、工艺参数、生产人员、设备、数量',
      }
    ),
    masterOpCode: 'OP-ZZ-001',
  },

  // OP-110 环规适配
  // Excel(环规适配): 前清场✓ 进站✓ 物料×  首件×  数据采集×  自检×  后清场✓ 报工✓ 出站✓
  // 阶段5个：前清场/进站/后清场/报工/出站
  {
    seq: 110,
    code: 'OP-110-RING',
    name: '环规适配',
    workshop: '质检车间',
    stages: makeStages(
      { PRE_CLEAN: true, CHECK_IN: true, MAT_VERIFY: false, FIRST_PIECE: false, DATA_COLLECT: false, SELF_CHECK: false, POST_CLEAN: true, REPORT: true, CHECK_OUT: true },
      {
        PRE_CLEAN: '确认工作台面无上批遗留产品；确认上一批产品工序转移单已转移；确认本批产品实物与工序转移产品信息一致',
        POST_CLEAN: '清理工作台面的本批次产品，确认无残留；核对产品实物与工序转移单产品信息一致后，将合格产品与工序转移单按流程转移到下道工序；不合格产品进行隔离标识',
        REPORT: '生产日期、工艺参数、生产人员、设备、数量',
      }
    ),
    masterOpCode: 'OP-HG-001',
  },

  // OP-120 测量长度
  // Excel(测量长度): 前清场✓ 进站✓ 物料×  首件×  数据采集×  自检×  后清场✓ 报工✓ 出站✓
  // 阶段5个：前清场/进站/后清场/报工/出站
  {
    seq: 120,
    code: 'OP-120-MEAS',
    name: '测量长度',
    workshop: '质检车间',
    stages: makeStages(
      { PRE_CLEAN: true, CHECK_IN: true, MAT_VERIFY: false, FIRST_PIECE: false, DATA_COLLECT: false, SELF_CHECK: false, POST_CLEAN: true, REPORT: true, CHECK_OUT: true },
      {
        PRE_CLEAN: '确认工作台面无上批遗留产品；确认上一批产品工序转移单已转移；确认本批产品实物与工序转移产品信息一致',
        POST_CLEAN: '清理工作台面的本批次产品，确认无残留；核对产品实物与工序转移单产品信息一致后，将合格产品与工序转移单按流程转移到下道工序；不合格产品进行隔离标识',
        REPORT: '生产日期、工艺参数、生产人员、设备、数量',
      }
    ),
    masterOpCode: 'OP-CL-001',
  },

  // OP-130 装限位块（含物料）
  // Excel(装限位块): 前清场✓ 进站✓ 物料✓(限位块/批次号)  首件×  数据采集×  自检×  后清场✓ 报工✓ 出站✓
  // 阶段6个：前清场/进站/物料一致确认/后清场/报工/出站
  {
    seq: 130,
    code: 'OP-130-LIMIT',
    name: '装限位块',
    workshop: '组装车间',
    stages: makeStages(
      { PRE_CLEAN: true, CHECK_IN: true, MAT_VERIFY: true, FIRST_PIECE: false, DATA_COLLECT: false, SELF_CHECK: false, POST_CLEAN: true, REPORT: true, CHECK_OUT: true },
      {
        PRE_CLEAN: '确认工作台面无上批遗留产品；确认上一批产品工序转移单已转移；确认本批产品实物与工序转移产品信息一致',
        MAT_VERIFY: '限位块 批次号',
        POST_CLEAN: '清理工作台面的本批次产品，确认无残留；核对产品实物与工序转移单产品信息一致后，将合格产品与工序转移单按流程转移到下道工序；不合格产品进行隔离标识',
        REPORT: '生产日期、工艺参数、生产人员、设备、数量',
      }
    ),
    masterOpCode: 'OP-XWK-001',
  },

  // OP-140 检测合格（AQL半成品综合检验）
  {
    seq: 140,
    code: 'OP-140-INSPECT2',
    name: '检测合格',
    workshop: '质检车间',
    stages: makeStages(
      { PRE_CLEAN: false, CHECK_IN: false, MAT_VERIFY: false, FIRST_PIECE: false, DATA_COLLECT: true, SELF_CHECK: false, POST_CLEAN: false, REPORT: true, CHECK_OUT: true },
      {
        DATA_COLLECT: '检测设备编号(扫码)、抽检数量(AQL)、总长(25.0±0.5mm)、外观检查(无毛刺/崩刃/弯曲)、颜色标识(黄色#26)、检验批次判定、合格/不合格数量',
        REPORT: '生产日期、检验人员、设备、数量',
      }
    ),
    hasQcInspection: true,
    inspectionRecordName: '半成品检验记录',
    masterOpCode: 'OP-JCHE-001',
  },

  // OP-150 半成品入库（特殊：仅自检+报工+出站）
  {
    seq: 150,
    code: 'OP-150-STORE',
    name: '半成品入库',
    workshop: '仓储',
    remark: '现场QC检验',
    stages: makeStages(
      { PRE_CLEAN: false, CHECK_IN: false, MAT_VERIFY: false, FIRST_PIECE: false, DATA_COLLECT: false, SELF_CHECK: true, POST_CLEAN: false, REPORT: true, CHECK_OUT: true },
      {
        SELF_CHECK: '在完成所有工序入库之前，由现场QC进行每批次抽检。检验项：尺寸、颜色标识、外观、杆与操作部分连接强度(≥5N)、抗扭强度(ISO 3630-1)、抗弯强度(ISO 3630-1)。关联检测设备信息，形成《半成品检验记录》',
        REPORT: '入库数量、QC人员、日期、入库货位、入库单号',
      }
    ),
    hasQcInspection: true,
    inspectionRecordName: '半成品检验记录',
    masterOpCode: 'OP-BCR-001',
  },

  // OP-160 手柄打码（含物料）
  {
    seq: 160,
    code: 'OP-160-HANDLE',
    name: '手柄打码',
    workshop: '包装车间',
    stages: makeStages(
      { PRE_CLEAN: true, CHECK_IN: true, MAT_VERIFY: true, FIRST_PIECE: false, DATA_COLLECT: false, SELF_CHECK: false, POST_CLEAN: true, REPORT: true, CHECK_OUT: true },
      {
        MAT_VERIFY: '手柄、包装材料、批号',
        POST_CLEAN: '清理工作台，转移产品',
        REPORT: '生产日期、打码信息、生产人员、设备、数量',
      }
    ),
  },

  // OP-170 上色
  {
    seq: 170,
    code: 'OP-170-COLOR',
    name: '上色',
    workshop: '包装车间',
    stages: makeStages(
      { PRE_CLEAN: true, CHECK_IN: true, MAT_VERIFY: false, FIRST_PIECE: false, DATA_COLLECT: false, SELF_CHECK: false, POST_CLEAN: true, REPORT: true, CHECK_OUT: true },
      {
        POST_CLEAN: '清理工作台，转移产品',
        REPORT: '生产日期、上色参数、生产人员、设备、数量',
      }
    ),
  },
];

// ==================== 保健品/GMP 工序定义（按 SOR-MF-PE-02-05 批包装路线）====================

export const GMP_OPERATIONS: OperationDef[] = [
  // 1. 领料/称量配料
  {
    seq: 10,
    code: 'OP-GMP-WEIGH',
    name: '称量配料',
    workshop: '固体制剂车间',
    remark: '双人复核，物料平衡必填',
    stages: makeStages(
      { PRE_CLEAN: true, CHECK_IN: true, MAT_VERIFY: true, FIRST_PIECE: false, DATA_COLLECT: true, SELF_CHECK: false, POST_CLEAN: false, REPORT: true, CHECK_OUT: true },
      {
        PRE_CLEAN: '确认称量间无上批遗留物料；清场合格证有效期内（72小时）；天平校验合格证在有效期内',
        MAT_VERIFY: '核对物料名称、批号、数量，与批包装指令一致；检查物料状态标签（"已取样"或"合格"）',
        DATA_COLLECT: '每种物料：处方量、实称量、天平编号、称量人、复核人；环境温湿度记录',
        REPORT: '称量总量、物料清单、称量人、复核人签名',
      }
    ),
    hasQcInspection: false,
  },

  // 2. 混合
  {
    seq: 20,
    code: 'OP-GMP-MIX',
    name: '混合',
    workshop: '固体制剂车间',
    stages: makeStages(
      { PRE_CLEAN: true, CHECK_IN: true, MAT_VERIFY: false, FIRST_PIECE: false, DATA_COLLECT: true, SELF_CHECK: false, POST_CLEAN: false, REPORT: true, CHECK_OUT: true },
      {
        PRE_CLEAN: '三维混合机清洁合格证有效；内壁无上批遗留物',
        DATA_COLLECT: '混合机编号、转速(rpm)、混合时间(min)、混合均匀性RSD(≤5%)；环境温度/湿度',
        REPORT: '混合批量、混合参数、操作人签名',
      }
    ),
    hasQcInspection: true,
    inspectionRecordName: '混合均匀性检验记录（RSD≤5%）',
  },

  // 3. 制粒/干燥（可选，粉剂直接跳到内包）
  {
    seq: 30,
    code: 'OP-GMP-GRANULATE',
    name: '制粒干燥',
    workshop: '固体制剂车间',
    stages: makeStages(
      { PRE_CLEAN: true, CHECK_IN: true, MAT_VERIFY: false, FIRST_PIECE: false, DATA_COLLECT: true, SELF_CHECK: false, POST_CLEAN: false, REPORT: true, CHECK_OUT: true },
      {
        PRE_CLEAN: '制粒机/干燥机清洁合格证有效；确认无上批遗留颗粒',
        DATA_COLLECT: '进风温度/出风温度/干燥时间/颗粒水分(≤3.0%)/颗粒粒径(目数)',
        REPORT: '颗粒批量、水分测定结果、操作人签名',
      }
    ),
    hasQcInspection: true,
    inspectionRecordName: '颗粒中间体检验记录',
  },

  // 4. 包衣（Film Coating）—— 压片后包薄膜衣，VitC咀嚼片专用工序
  {
    seq: 35,
    code: 'OP-GMP-COATING',
    name: '包衣',
    workshop: '固体制剂车间',
    remark: '关键工序：包衣增重率2~4%，每小时称重监控；包衣液温度45~55℃；进风温度40~55℃',
    stages: makeStages(
      { PRE_CLEAN: true, CHECK_IN: true, MAT_VERIFY: true, FIRST_PIECE: true, DATA_COLLECT: true, SELF_CHECK: true, POST_CLEAN: true, REPORT: true, CHECK_OUT: true },
      {
        PRE_CLEAN: '包衣机清洁合格证有效（72小时内）；无上批遗留包衣液或片芯；喷枪已清洗并检查无堵塞；进排风过滤器检查合格',
        MAT_VERIFY: '核对包衣预混料（OPADRY等）批号、剩余有效期；称量包衣液浓度（15%±1%）；检查片芯批号与工单一致',
        FIRST_PIECE: '首次包衣15min后抽样10片：测定片重（与片芯对比，增重率0.5~1.0%）；外观检查（无粘连/裂片/花斑）；包衣液雾化均匀性确认',
        DATA_COLLECT: '每小时监测：片重增重率(%)、进风温度(℃)、出风温度(℃)、包衣液喷速(g/min)、锅内负压(Pa)、环境温湿度',
        SELF_CHECK: '操作员自检：随机取10片检查外观（颜色均匀性/裂片/粘连）；末次抽检片重增重率确认达标(2~4%)',
        POST_CLEAN: '清点包衣片芯用量；填写物料平衡表（≥98%）；清洁包衣机喷枪/包衣锅；申请清场合格证',
        REPORT: '包衣批量、终止增重率、操作人、班组长复核、QA抽查记录',
      }
    ),
    hasQcInspection: true,
    inspectionRecordName: '包衣过程检验记录（增重率监控）',
    masterOpCode: 'OP-GMP-COATING',
  },

  // 4. 内包装（瓶包线）—— 对应 SOR-MF-PE-02-05 第3部分
  {
    seq: 40,
    code: 'OP-GMP-INNERPACK',
    name: '内包装',
    workshop: '包装车间',
    remark: '关键工序，QA监控，装量差异检查每小时一次',
    stages: makeStages(
      { PRE_CLEAN: true, CHECK_IN: true, MAT_VERIFY: true, FIRST_PIECE: true, DATA_COLLECT: true, SELF_CHECK: false, POST_CLEAN: true, REPORT: true, CHECK_OUT: true },
      {
        PRE_CLEAN: '包装线清场合格证有效（固体制剂72小时内）；无上批包材、产品遗留；上批清场合格证已撤除',
        MAT_VERIFY: '核对内包材（瓶、盖）批号、数量与指令一致；物料状态标签为"合格"',
        FIRST_PIECE: '首瓶装量复核：按标准装量±5%范围内；首件合格后方可批量生产（双人核对）',
        DATA_COLLECT: '每小时装量检查（5瓶/次）：装量克重；密封检查；标签位置；环境温湿度',
        POST_CLEAN: '清点本工序物料用量；填写物料平衡表；清场并申请清场合格证',
        REPORT: '实际产量、合格品数、不合格品数、操作人、班组长复核',
      }
    ),
    hasQcInspection: true,
    inspectionRecordName: '内包装过程检验记录',
  },

  // 5. 内包装后清场 — 独立记录清场合格证
  {
    seq: 45,
    code: 'OP-GMP-INNERCLEAN',
    name: '内包清场',
    workshop: '包装车间',
    remark: '清场后申请清场合格证，有效期72小时',
    stages: makeStages(
      { PRE_CLEAN: false, CHECK_IN: true, MAT_VERIFY: false, FIRST_PIECE: false, DATA_COLLECT: false, SELF_CHECK: false, POST_CLEAN: true, REPORT: true, CHECK_OUT: false },
      {
        POST_CLEAN: '按清场SOP清洁设备/容器/地面；移除本批所有物料及标识；操作人、班组长、QA三级检查并签字',
        REPORT: '清场开始时间、结束时间、清场人、班组长签名、QA签名、合格证编号',
      }
    ),
  },

  // 6. 外包装（装盒/装箱）—— 对应 SOR-MF-PE-02-05 第5部分
  {
    seq: 50,
    code: 'OP-GMP-OUTERPACK',
    name: '外包装',
    workshop: '包装车间',
    remark: '批号打印、说明书、合格证核对',
    stages: makeStages(
      { PRE_CLEAN: true, CHECK_IN: true, MAT_VERIFY: true, FIRST_PIECE: false, DATA_COLLECT: true, SELF_CHECK: false, POST_CLEAN: true, REPORT: true, CHECK_OUT: true },
      {
        PRE_CLEAN: '外包装区域清场合格证有效；无上批标签、说明书遗留',
        MAT_VERIFY: '核对外包材（纸盒、说明书、合格证）批号、版本号与指令一致',
        DATA_COLLECT: '每盒：瓶数/说明书/批号印刷/密封/UPC复核；每小时记录一次',
        POST_CLEAN: '清点外包材用量；填写物料平衡表；申请清场合格证',
        REPORT: '实际装盒数、装箱数、操作人、班组长复核、QA抽查',
      }
    ),
    hasQcInspection: true,
    inspectionRecordName: '外包装过程检验记录',
  },
];

// ==================== 旧医疗器械 OPERATIONS → 切换为 GMP_OPERATIONS ====================
// VISIBLE_OPERATIONS 现在指向保健品 GMP 工序（所有 GMP_OPERATIONS 均可见）
export const VISIBLE_OPERATIONS = GMP_OPERATIONS.filter(op => !op.hidden);

// 根据 seq 获取工序（优先从 GMP_OPERATIONS 查找，再回退旧 OPERATIONS）
export const getOperationBySeq = (seq: number): OperationDef | undefined =>
  GMP_OPERATIONS.find(op => op.seq === seq) ?? OPERATIONS.find(op => op.seq === seq);

// 根据 code 获取工序（优先从 GMP_OPERATIONS 查找，再回退旧 OPERATIONS）
export const getOperationByCode = (code: string): OperationDef | undefined =>
  GMP_OPERATIONS.find(op => op.code === code) ?? OPERATIONS.find(op => op.code === code);

// 获取工序的启用阶段
export const getEnabledStages = (op: OperationDef): StageConfig[] =>
  op.stages.filter(s => s.enabled);

// ==================== Mock 工单数据（天美健保健品GMP演示工单）====================

export const MOCK_WORK_ORDERS: WorkOrder[] = [
  // WO1：维生素C咀嚼片 500mg × 60粒/瓶，A级紧急工单
  {
    id:              'WO-TMJ-20260605-001',
    woNo:            'WO-20260605-001',
    productName:     '维生素C咀嚼片',
    productSpec:     '500mg/粒 × 60粒/瓶',
    batchNo:         'TMJ-VITC-20260605-001',
    planQty:         200000,
    customer:        '天美健营养品（南京）有限公司',
    priority:        'A',
    planStartDate:   '2026-06-05',
    floatBarcode:    'TMJ-FT-20260605-001',
    materialLotNo:   'RM-VITC-20260605-001',
    currentOpSeq:    10,
  },
  // WO2：复合益生菌胶囊 250mg × 100粒/瓶，B级常规工单
  {
    id:              'WO-TMJ-20260610-001',
    woNo:            'WO-20260610-001',
    productName:     '复合益生菌胶囊',
    productSpec:     '250mg/粒 × 100粒/瓶',
    batchNo:         'TMJ-PROBIO-20260610-001',
    planQty:         50000,
    customer:        '天美健营养品（廊坊）有限公司',
    priority:        'B',
    planStartDate:   '2026-06-10',
    floatBarcode:    'TMJ-FT-20260610-001',
    materialLotNo:   'RM-PROBIO-20260610-001',
    currentOpSeq:    10,
  },
  // WO3：维生素C咀嚼片（盒装） 250mg × 30粒/盒，A级工单
  {
    id:              'WO-TMJ-20260612-001',
    woNo:            'WO-20260612-001',
    productName:     '维生素C咀嚼片',
    productSpec:     '250mg/粒 × 30粒/盒',
    batchNo:         'TMJ-VITC-20260612-001',
    planQty:         60000,
    customer:        '天美健营养品（南京）有限公司',
    priority:        'A',
    planStartDate:   '2026-06-12',
    floatBarcode:    'TMJ-FT-20260612-001',
    materialLotNo:   'RM-VITC-20260612-001',
    currentOpSeq:    10,
  },
];

// ==================== 初始化工序执行状态 ====================

export function initOperationExecution(opCode: string): OperationExecution {
  const op = GMP_OPERATIONS.find(o => o.code === opCode) ?? OPERATIONS.find(o => o.code === opCode);
  const stagesInit: Partial<Record<StageCode, StageExecution>> = {};
  
  ALL_STAGES.forEach(s => {
    stagesInit[s.code] = {
      code: s.code,
      status: 'pending',
      data: {},
    };
  });

  return {
    opCode,
    status: 'ready',
    stages: stagesInit as Record<StageCode, StageExecution>,
    finishQty: 0,
    goodQty: 0,
    badQty: 0,
    scrapQty: 0,
    reportRecords: [],
    firstPiecePassed: false,
    preCleanDone: false,
  };
}

// 获取当前应进入的阶段（第一个 enabled 且 status=pending 的）
export function getCurrentStage(
  op: OperationDef,
  execution: OperationExecution
): StageCode | null {
  const enabled = getEnabledStages(op);
  for (const stage of enabled) {
    const exec = execution.stages[stage.code];
    if (exec.status === 'pending' || exec.status === 'in_progress') {
      return stage.code;
    }
  }
  return null;
}

// 判断工序是否全部完成
export function isOperationComplete(
  op: OperationDef,
  execution: OperationExecution
): boolean {
  const enabled = getEnabledStages(op);
  return enabled.every(s => execution.stages[s.code].status === 'completed');
}

// ==================== 工序浮漂状态（用于电子浮漂预览）====================

export type FloatCellStatus = 'not_started' | 'in_progress' | 'completed' | 'abnormal';

export interface FloatCell {
  seq: number;
  opCode: string;
  name: string;
  hidden: boolean;
  status: FloatCellStatus;
  inTime?: string;
  outTime?: string;
  operator?: string;
}

export function buildFloatCells(
  execMap: Record<string, OperationExecution>
): FloatCell[] {
  return GMP_OPERATIONS.map(op => {
    const exec = execMap[op.code];
    let status: FloatCellStatus = 'not_started';
    if (exec) {
      if (exec.status === 'completed') status = 'completed';
      else if (exec.status === 'in_progress') status = 'in_progress';
      else if (exec.status === 'abnormal') status = 'abnormal';
    }
    return {
      seq: op.seq,
      opCode: op.code,
      name: op.name,
      hidden: op.hidden ?? false,
      status,
      inTime: exec?.inTime,
      outTime: exec?.outTime,
    };
  });
}

// ==================== 车间颜色映射（天美健双工厂GMP） ====================
export const WORKSHOP_COLOR: Record<string, string> = {
  // 南京固体制剂（D级）
  '固体制剂车间':         '#1677ff',
  '固体制剂车间（D级）':  '#1677ff',
  // 溧水益生菌（C级冷链）
  '益生菌车间（C级，≤8℃）': '#13c2c2',
  '溧水冷链仓（≤8℃）':   '#36cfc9',
  // 包装车间
  '包装车间':             '#eb2f96',
  // QC实验室
  'QC实验室':             '#722ed1',
  'QC实验室（低温区）':   '#9254de',
  // 旧车间编码兼容（避免已存localStorage的工单显示无色）
  '精密加工车间':         '#1890ff',
  '清洗车间':             '#13c2c2',
  '热处理车间':           '#fa8c16',
  '质检车间':             '#722ed1',
  '组装车间':             '#52c41a',
  '仓储':                 '#8c8c8c',
};

// ==================== 阶段图标映射 ====================
export const STAGE_ICON: Record<StageCode, string> = {
  PRE_CLEAN: '🧹',
  CHECK_IN: '📥',
  MAT_VERIFY: '📦',
  FIRST_PIECE: '🔬',
  DATA_COLLECT: '📊',
  SELF_CHECK: '✅',
  POST_CLEAN: '🧽',
  REPORT: '📝',
  CHECK_OUT: '📤',
};

// ==================== 工序主数据阶段联动 ====================

// PhaseType → StageCode 映射
const PHASE_TYPE_TO_STAGE: Partial<Record<PhaseType, StageCode>> = {
  PREP:  'PRE_CLEAN',
  LOAD:  'MAT_VERIFY',
  EXEC:  'DATA_COLLECT',
  IPQC:  'FIRST_PIECE',
  OQC:   'SELF_CHECK',
  CLEAN: 'POST_CLEAN',
  HAND:  'CHECK_OUT',
  SPEC:  'SELF_CHECK',
};

// StageCode → PhaseType 反向映射（用于通过 StageCode 查找 PhaseType）
const STAGE_TO_PHASE_TYPE: Partial<Record<StageCode, PhaseType>> = {
  PRE_CLEAN:    'PREP',
  MAT_VERIFY:   'LOAD',
  DATA_COLLECT: 'EXEC',
  FIRST_PIECE:  'IPQC',
  SELF_CHECK:   'OQC',
  POST_CLEAN:   'CLEAN',
  CHECK_OUT:    'HAND',
};

/**
 * 根据 masterOpCode 和 StageCode，查找对应工序主数据的阶段配置
 * 用于 PadExecutionPage 将阶段 phases 传给各 Stage 组件实现动态联动
 */
export function getPhaseForStage(
  masterOpCode: string | undefined,
  stageCode: StageCode
): OperationPhase | undefined {
  if (!masterOpCode) return undefined;
  const op = mockOperations.find(o => o.opCode === masterOpCode);
  if (!op) return undefined;
  const targetPhaseType: PhaseType | undefined = STAGE_TO_PHASE_TYPE[stageCode];
  if (!targetPhaseType) return undefined;
  return op.phases.find(p => p.phaseType === targetPhaseType);
}

// ==================== L2 WorkOrder → PAD WorkOrder 桥接 ====================

/**
 * 将 L2 生产工单（WorkOrderListPage 数据模型）转换为 PAD 执行使用的 WorkOrder。
 * 供 PadOperationListPage 加载真实工单数据。
 */
export function l2WoToPadWo(wo: L2WorkOrder, floatTickets: FloatTicketV2[] = []): WorkOrder {
  // 查找该工单对应的浮票（取第一张有效的）
  const ft = floatTickets.find(f => f.woId === wo.id && (f.status === 'IN_USE' || f.status === 'ISSUED' || f.status === 'PRINTED'));
  return {
    id:            wo.id,
    woNo:          wo.woNo,
    productName:   wo.productName,
    productSpec:   wo.productSpec,
    batchNo:       wo.batchNo,
    planQty:       wo.planQty,
    priority:      wo.priority === 'URGENT' ? 'A' : wo.priority === 'HIGH' ? 'A' : wo.priority === 'NORMAL' ? 'B' : 'C',
    planStartDate: wo.planStart?.slice(0, 10) || new Date().toISOString().slice(0, 10),
    floatBarcode:  ft?.ticketNo || `FT-${wo.batchNo}`,
    materialLotNo: wo.batchNo,
    currentOpSeq:  10,
  };
}

/**
 * 从 localStorage 加载处于「已下发」或「生产中」状态的真实工单并转为 PAD 格式。
 * 若无数据则回退到 MOCK_WORK_ORDERS。
 */
export function loadPadWorkOrders(): WorkOrder[] {
  // 用户已主动清空时，不加载任何 mock 或历史数据
  if (isUserCleared()) return [];
  try {
    const wosRaw = localStorage.getItem('bip_work_orders');
    const ftsRaw = localStorage.getItem('bip_float_tickets');
    const wos: L2WorkOrder[] = wosRaw ? JSON.parse(wosRaw) : [];
    const fts: FloatTicketV2[] = ftsRaw ? JSON.parse(ftsRaw) : [];
    const active = wos.filter(w => w.status === 'RELEASED' || w.status === 'IN_PROGRESS');
    if (active.length > 0) {
      return active.map(w => l2WoToPadWo(w, fts));
    }
  } catch { /* ignore */ }
  // API 和 localStorage 均无数据时，回退到天美健 Demo 工单
  return MOCK_WORK_ORDERS;
}

/**
 * 将 PAD 执行完成的工序数据写回 L2 工单进度（更新 currentOp / progressPct）。
 */
export function writePadExecBackToWo(
  woId: string,
  execMap: Record<string, OperationExecution>,
  reportQty: number,
  scrapQty: number,
): void {
  try {
    const wosRaw = localStorage.getItem('bip_work_orders');
    if (!wosRaw) return;
    const wos: L2WorkOrder[] = JSON.parse(wosRaw);
    const idx = wos.findIndex(w => w.id === woId);
    if (idx < 0) return;

    const completedOps = VISIBLE_OPERATIONS.filter(op => execMap[op.code]?.status === 'completed');
    const progressPct  = Math.round((completedOps.length / VISIBLE_OPERATIONS.length) * 100);

    // 当前工序：取第一个 in_progress 工序，或最后一个 completed 的下一个
    const inPgOp = VISIBLE_OPERATIONS.find(op => execMap[op.code]?.status === 'in_progress');
    const lastDoneIdx = VISIBLE_OPERATIONS.reduce((acc, op, i) =>
      execMap[op.code]?.status === 'completed' ? i : acc, -1);
    const nextOp = !inPgOp && lastDoneIdx < VISIBLE_OPERATIONS.length - 1
      ? VISIBLE_OPERATIONS[lastDoneIdx + 1]
      : undefined;
    const currentOp = inPgOp?.name || nextOp?.name || wos[idx].currentOp;

    const allDone = VISIBLE_OPERATIONS.every(op => execMap[op.code]?.status === 'completed');

    wos[idx] = {
      ...wos[idx],
      progressPct,
      currentOp,
      actualQty:  reportQty || wos[idx].actualQty,
      scrapQty:   scrapQty  || wos[idx].scrapQty,
      status:     allDone
        ? 'COMPLETED'
        : progressPct > 0
          ? 'IN_PROGRESS'
          : wos[idx].status,
      actualStart: wos[idx].actualStart || new Date().toLocaleString('zh-CN'),
      actualEnd:   allDone ? new Date().toLocaleString('zh-CN') : wos[idx].actualEnd,
    };
    localStorage.setItem('bip_work_orders', JSON.stringify(wos));
  } catch { /* ignore */ }
}

/**
 * 获取一个工序所有阶段的 phases 配置映射（StageCode → OperationPhase）
 */
export function getAllPhasesForOperation(
  masterOpCode: string | undefined
): Partial<Record<StageCode, OperationPhase>> {
  if (!masterOpCode) return {};
  const op = mockOperations.find(o => o.opCode === masterOpCode);
  if (!op) return {};
  const result: Partial<Record<StageCode, OperationPhase>> = {};
  op.phases.forEach(phase => {
    const stageCode = PHASE_TYPE_TO_STAGE[phase.phaseType];
    if (stageCode && !result[stageCode]) {
      result[stageCode] = phase;
    }
  });
  return result;
}

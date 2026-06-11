// ============================================================
// 工序主数据 & 工序阶段 数据层
// 医疗器械MES工序PRD v1.0 — 8道工序完整定义
// ============================================================

export type OpCategory = 'PROD' | 'INSP' | 'PACK' | 'SPEC' | 'OUTS';
export type OpStatus = 'DRAFT' | 'ACTIVE' | 'OBSOLETE' | 'DISABLED';
export type PhaseType = 'PREP' | 'LOAD' | 'EXEC' | 'IPQC' | 'OQC' | 'CLEAN' | 'HAND' | 'SPEC';
export type FieldInputType = 'AUTO' | 'MANUAL' | 'SELECT' | 'SCAN' | 'ESIGN' | 'UPLOAD';
export type FieldDataType = 'Decimal' | 'Int' | 'String' | 'Enum' | 'Boolean' | 'DateTime' | 'Date' | 'Image' | 'JSON' | 'Ref';

export interface PhaseField {
  code: string;
  name: string;
  dataType: FieldDataType;
  required: boolean;
  stdValue?: string;
  unit?: string;
  inputType?: FieldInputType;
  instrument?: string;   // 量具
  remark?: string;
}

export interface OperationPhase {
  seq: number;          // 10,20,30…
  phaseCode: string;
  phaseName: string;
  phaseType: PhaseType;
  required: boolean;
  eSign: boolean;       // 电子签名
  dualReview: boolean;  // 双人复核
  linkedDoc?: string;   // 关联单据
  remark?: string;      // 阶段备注/特殊控制说明
  fields: PhaseField[];
  photoReq?: 'NONE' | 'OPTIONAL' | 'REQUIRED';
  scanReq?: 'NONE' | 'EQUIP' | 'MATERIAL' | 'PERSON';
  timeoutMin?: number;
}

export interface Operation {
  id: string;
  opCode: string;
  opName: string;
  opShort: string;           // 简称（PAD用）
  category: OpCategory;
  workshop: string;
  productLine: string;
  workCenter: string;
  equipType: string;
  stdTimeMin: number;        // 标准工时（分钟/件）
  prepTimeMin: number;       // 准备工时（分钟）
  hasFirstPiece: boolean;
  hasLastPiece: boolean;
  hasPatrol: boolean;
  patrolFreq?: number;       // 巡检频次（每N件）
  hasCleanup: boolean;
  envReq?: string;           // 环境要求
  paramTemplate?: string;    // 技术参数模板
  isBottleneck: boolean;
  isReportPoint: boolean;    // 报工点
  isQcPoint: boolean;        // 质检点
  status: OpStatus;
  version: string;
  effectDate: string;
  createdBy: string;
  updatedAt: string;
  remark?: string;
  phases: OperationPhase[];
}

// ============================================================
// 阶段类型映射
// ============================================================
export const PHASE_TYPE_MAP: Record<PhaseType, { label: string; color: string }> = {
  PREP:  { label: '生产准备', color: '#722ED1' },
  LOAD:  { label: '上料核对', color: '#1677FF' },
  EXEC:  { label: '加工执行', color: '#13C2C2' },
  IPQC:  { label: '过程检验', color: '#FA8C16' },
  OQC:   { label: '完工检验', color: '#EB2F96' },
  CLEAN: { label: '清场清洁', color: '#52C41A' },
  HAND:  { label: '工序交接', color: '#8C8C8C' },
  SPEC:  { label: '特殊确认', color: '#E60012' },
};

export const OP_CATEGORY_MAP: Record<OpCategory, { label: string; color: string }> = {
  PROD: { label: '生产工序', color: '#1677FF' },
  INSP: { label: '检验工序', color: '#FA8C16' },
  PACK: { label: '包装工序', color: '#52C41A' },
  SPEC: { label: '特殊工序', color: '#E60012' },
  OUTS: { label: '外协工序', color: '#722ED1' },
};

export const OP_STATUS_MAP: Record<OpStatus, { label: string; color: string }> = {
  DRAFT:    { label: '草稿',   color: '#8C8C8C' },
  ACTIVE:   { label: '已生效', color: '#52C41A' },
  OBSOLETE: { label: '已失效', color: '#FAAD14' },
  DISABLED: { label: '已停用', color: '#FF4D4F' },
};

// ============================================================
// 8 道工序完整 Mock 数据
// ============================================================
export const mockOperations: Operation[] = [
  // ─────────────────────────────────────────────────────────
  // 1. OP-CUT-001  数控磨削
  // ─────────────────────────────────────────────────────────
  {
    id: 'op-001',
    opCode: 'OP-CUT-001',
    opName: '数控磨削',
    opShort: '磨削',
    category: 'PROD',
    workshop: '精密加工车间',
    productLine: '根管锉A线',
    workCenter: 'WC-GRIND-01',
    equipType: '数控磨床',
    stdTimeMin: 4.5,
    prepTimeMin: 30,
    hasFirstPiece: true,
    hasLastPiece: true,
    hasPatrol: true,
    patrolFreq: 50,
    hasCleanup: true,
    envReq: '温度 20±2℃，相对湿度 45~65%，防振',
    paramTemplate: 'TP-GRIND-001',
    isBottleneck: true,
    isReportPoint: true,
    isQcPoint: true,
    status: 'ACTIVE',
    version: 'V1.0',
    effectDate: '2026-01-15',
    createdBy: '工艺工程师',
    updatedAt: '2026-04-01',
    remark: '瓶颈工序，锥度/直径精度关键控制点',
    phases: [
      {
        seq: 10, phaseCode: 'CUT-P01', phaseName: '生产前准备', phaseType: 'PREP',
        required: true, eSign: true, dualReview: false, linkedDoc: '清场检查单',
        photoReq: 'OPTIONAL', scanReq: 'EQUIP', timeoutMin: 30,
        fields: [
          { code: 'prep_c1', name: '清场完成确认', dataType: 'Boolean', required: true, stdValue: 'TRUE', inputType: 'SELECT' },
          { code: 'prep_c2', name: '设备点检结果', dataType: 'Enum', required: true, stdValue: '正常', inputType: 'SELECT' },
          { code: 'prep_c3', name: '量具校准状态', dataType: 'Boolean', required: true, stdValue: 'TRUE', inputType: 'SELECT' },
          { code: 'prep_c4', name: '砂轮安装确认', dataType: 'Boolean', required: true, stdValue: 'TRUE', inputType: 'SELECT' },
          { code: 'prep_c5', name: '冷却液检查', dataType: 'Enum', required: true, stdValue: '正常', inputType: 'SELECT' },
          { code: 'prep_c6', name: '准备完成时间', dataType: 'DateTime', required: true, inputType: 'AUTO' },
        ],
      },
      {
        seq: 20, phaseCode: 'CUT-P02', phaseName: '上料核对', phaseType: 'LOAD',
        required: true, eSign: false, dualReview: false, linkedDoc: '领料记录',
        scanReq: 'MATERIAL',
        fields: [
          { code: 'load_m1', name: '来料批号', dataType: 'String', required: true, inputType: 'SCAN', remark: '扫描物料标签' },
          { code: 'load_m2', name: '来料数量', dataType: 'Int', required: true, unit: '件', inputType: 'MANUAL' },
          { code: 'load_m3', name: '物料确认', dataType: 'Boolean', required: true, stdValue: 'TRUE', inputType: 'SELECT' },
        ],
      },
      {
        seq: 30, phaseCode: 'CUT-P03', phaseName: '首件检验', phaseType: 'IPQC',
        required: true, eSign: true, dualReview: true, linkedDoc: '首件检验单',
        photoReq: 'REQUIRED', timeoutMin: 20,
        fields: [
          { code: 'cut_f1', name: '外径D1（尖端上方3mm）', dataType: 'Decimal', required: true, stdValue: '0.250±0.005', unit: 'mm', instrument: '千分尺', inputType: 'MANUAL' },
          { code: 'cut_f2', name: '外径D2（尖端上方6mm）', dataType: 'Decimal', required: true, stdValue: '按规格', unit: 'mm', instrument: '千分尺', inputType: 'MANUAL' },
          { code: 'cut_f3', name: '尖端直径', dataType: 'Decimal', required: true, stdValue: '0.150±0.005', unit: 'mm', instrument: '投影仪', inputType: 'MANUAL' },
          { code: 'cut_f4', name: '锥度', dataType: 'Decimal', required: true, stdValue: '0.04/0.06/0.02', instrument: '投影仪', inputType: 'MANUAL' },
          { code: 'cut_f5', name: '螺纹完整性', dataType: 'Enum', required: true, stdValue: '合格', instrument: '目视', inputType: 'SELECT' },
          { code: 'cut_f6', name: '表面粗糙度Ra', dataType: 'Decimal', required: true, stdValue: '≤0.8', unit: 'μm', instrument: '粗糙度仪', inputType: 'MANUAL' },
          { code: 'cut_f7', name: '量具校准状态', dataType: 'Boolean', required: true, stdValue: 'TRUE', inputType: 'SELECT' },
          { code: 'cut_f8', name: '首件判定', dataType: 'Enum', required: true, stdValue: '合格/不合格', inputType: 'SELECT', remark: '不合格时自动阻断后续执行阶段' },
          { code: 'cut_f9', name: '检验员', dataType: 'Ref', required: true, inputType: 'ESIGN' },
          { code: 'cut_f10', name: '复核员', dataType: 'Ref', required: true, inputType: 'ESIGN' },
          { code: 'cut_f11', name: '首件照片', dataType: 'Image', required: false, inputType: 'UPLOAD' },
          { code: 'cut_f12', name: '记录时间', dataType: 'DateTime', required: true, inputType: 'AUTO' },
        ],
      },
      {
        seq: 40, phaseCode: 'CUT-P04', phaseName: '批量磨削', phaseType: 'EXEC',
        required: true, eSign: false, dualReview: false, linkedDoc: '加工过程记录',
        fields: [
          { code: 'cut_e1', name: '设备编号', dataType: 'Ref', required: true, inputType: 'SCAN' },
          { code: 'cut_e2', name: '砂轮规格型号', dataType: 'String', required: true, inputType: 'SELECT' },
          { code: 'cut_e3', name: '主轴转速', dataType: 'Int', required: true, stdValue: '3500~4500', unit: 'rpm', inputType: 'AUTO', remark: '设备采集' },
          { code: 'cut_e4', name: '进给速度', dataType: 'Decimal', required: true, stdValue: '0.05~0.20', unit: 'mm/min', inputType: 'AUTO' },
          { code: 'cut_e5', name: '磨削深度', dataType: 'Decimal', required: true, stdValue: '0.01~0.03', unit: 'mm', inputType: 'MANUAL' },
          { code: 'cut_e6', name: '冷却液流量', dataType: 'Decimal', required: true, stdValue: '2.0~3.0', unit: 'L/min', inputType: 'AUTO' },
          { code: 'cut_e7', name: '计划产量', dataType: 'Int', required: true, unit: '件', inputType: 'MANUAL' },
          { code: 'cut_e8', name: '实际产量', dataType: 'Int', required: true, unit: '件', inputType: 'MANUAL' },
          { code: 'cut_e9', name: '不良数量', dataType: 'Int', required: true, stdValue: '0', unit: '件', inputType: 'MANUAL' },
          { code: 'cut_e10', name: '不良原因', dataType: 'String', required: false, inputType: 'SELECT', remark: '可多选' },
          { code: 'cut_e11', name: '磨削开始时间', dataType: 'DateTime', required: true, inputType: 'AUTO' },
          { code: 'cut_e12', name: '磨削结束时间', dataType: 'DateTime', required: true, inputType: 'AUTO' },
        ],
      },
      {
        seq: 50, phaseCode: 'CUT-P05', phaseName: '过程巡检', phaseType: 'IPQC',
        required: false, eSign: true, dualReview: false, linkedDoc: '巡检记录单',
        fields: [
          { code: 'cut_p1', name: '巡检件号', dataType: 'Int', required: true, inputType: 'MANUAL' },
          { code: 'cut_p2', name: '尺寸抽检结果', dataType: 'Enum', required: true, stdValue: '合格/不合格', inputType: 'SELECT' },
          { code: 'cut_p3', name: '外观抽检结果', dataType: 'Enum', required: true, stdValue: '合格/不合格', inputType: 'SELECT' },
          { code: 'cut_p4', name: '巡检员', dataType: 'Ref', required: true, inputType: 'ESIGN' },
        ],
      },
      {
        seq: 60, phaseCode: 'CUT-P06', phaseName: '末件检验', phaseType: 'IPQC',
        required: false, eSign: true, dualReview: false, linkedDoc: '末件检验单',
        fields: [
          { code: 'cut_l1', name: '末件外径D1', dataType: 'Decimal', required: true, stdValue: '0.250±0.005', unit: 'mm', instrument: '千分尺', inputType: 'MANUAL' },
          { code: 'cut_l2', name: '末件锥度', dataType: 'Decimal', required: true, inputType: 'MANUAL' },
          { code: 'cut_l3', name: '末件判定', dataType: 'Enum', required: true, stdValue: '合格/不合格', inputType: 'SELECT' },
          { code: 'cut_l4', name: '检验员', dataType: 'Ref', required: true, inputType: 'ESIGN' },
        ],
      },
      {
        seq: 70, phaseCode: 'CUT-P07', phaseName: '完工清场', phaseType: 'CLEAN',
        required: true, eSign: true, dualReview: false, linkedDoc: '清场确认单',
        fields: [
          { code: 'cln_c1', name: '设备清洁确认', dataType: 'Boolean', required: true, stdValue: 'TRUE', inputType: 'SELECT' },
          { code: 'cln_c2', name: '余料退库确认', dataType: 'Boolean', required: true, stdValue: 'TRUE', inputType: 'SELECT' },
          { code: 'cln_c3', name: '清场人员', dataType: 'Ref', required: true, inputType: 'ESIGN' },
          { code: 'cln_c4', name: '清场完成时间', dataType: 'DateTime', required: true, inputType: 'AUTO' },
        ],
      },
      {
        seq: 80, phaseCode: 'CUT-P08', phaseName: '工序交接', phaseType: 'HAND',
        required: true, eSign: true, dualReview: false, linkedDoc: '工序转移单',
        scanReq: 'MATERIAL',
        fields: [
          { code: 'hnd_h1', name: '交接数量', dataType: 'Int', required: true, unit: '件', inputType: 'MANUAL' },
          { code: 'hnd_h2', name: '不良品数量', dataType: 'Int', required: true, unit: '件', inputType: 'MANUAL' },
          { code: 'hnd_h3', name: '流转卡扫码', dataType: 'String', required: true, inputType: 'SCAN' },
          { code: 'hnd_h4', name: '交出人', dataType: 'Ref', required: true, inputType: 'ESIGN' },
          { code: 'hnd_h5', name: '接收人', dataType: 'Ref', required: true, inputType: 'ESIGN' },
          { code: 'hnd_h6', name: '交接时间', dataType: 'DateTime', required: true, inputType: 'AUTO' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // 2. OP-HT-001  热处理定型（特殊工序）
  // ─────────────────────────────────────────────────────────
  {
    id: 'op-002',
    opCode: 'OP-HT-001',
    opName: '热处理定型',
    opShort: '热处理',
    category: 'SPEC',
    workshop: '热处理车间',
    productLine: '根管锉A线',
    workCenter: 'WC-HT-01',
    equipType: '真空热处理炉',
    stdTimeMin: 120,
    prepTimeMin: 45,
    hasFirstPiece: true,
    hasLastPiece: false,
    hasPatrol: true,
    patrolFreq: 0,
    hasCleanup: true,
    envReq: '独立热处理间，防爆通风，温度记录仪校验有效',
    paramTemplate: 'TP-HT-NITI-001',
    isBottleneck: true,
    isReportPoint: true,
    isQcPoint: true,
    status: 'ACTIVE',
    version: 'V1.0',
    effectDate: '2026-01-15',
    createdBy: '工艺工程师',
    updatedAt: '2026-04-01',
    remark: '特殊工序，需过程确认+双人复核；热电偶校验有效期强制校验',
    phases: [
      {
        seq: 10, phaseCode: 'HT-P01', phaseName: '生产前准备', phaseType: 'PREP',
        required: true, eSign: true, dualReview: false, linkedDoc: '热处理准备单',
        fields: [
          { code: 'ht_prep1', name: '热处理炉点检结果', dataType: 'Enum', required: true, stdValue: '正常', inputType: 'SELECT' },
          { code: 'ht_prep2', name: '热电偶校验有效期', dataType: 'Date', required: true, inputType: 'AUTO', remark: '系统自动校验是否在有效期内' },
          { code: 'ht_prep3', name: '温度记录仪状态', dataType: 'Enum', required: true, stdValue: '正常', inputType: 'SELECT' },
          { code: 'ht_prep4', name: '气氛供应确认', dataType: 'Boolean', required: true, stdValue: 'TRUE', inputType: 'SELECT' },
        ],
      },
      {
        seq: 20, phaseCode: 'HT-P02', phaseName: '上料装炉', phaseType: 'LOAD',
        required: true, eSign: true, dualReview: false, linkedDoc: '装炉记录',
        fields: [
          { code: 'ht_l1', name: '来料批号', dataType: 'String', required: true, inputType: 'SCAN' },
          { code: 'ht_l2', name: '装炉数量', dataType: 'Int', required: true, unit: '件', inputType: 'MANUAL' },
          { code: 'ht_l3', name: '装炉层数', dataType: 'Int', required: true, stdValue: '≤7', unit: '层', inputType: 'MANUAL' },
          { code: 'ht_l4', name: '装炉方式', dataType: 'Enum', required: true, inputType: 'SELECT' },
        ],
      },
      {
        seq: 30, phaseCode: 'HT-P03', phaseName: '过程确认', phaseType: 'SPEC',
        required: true, eSign: true, dualReview: true, linkedDoc: '过程确认单',
        timeoutMin: 15,
        fields: [
          { code: 'ht_s1', name: '热处理炉编号', dataType: 'Ref', required: true, inputType: 'SCAN' },
          { code: 'ht_s2', name: '热电偶校验日期', dataType: 'Date', required: true, inputType: 'AUTO' },
          { code: 'ht_s3', name: '温度程序编号', dataType: 'String', required: true, stdValue: 'TP-NITI-01', inputType: 'SELECT' },
          { code: 'ht_s4', name: '设定升温速率', dataType: 'Decimal', required: true, stdValue: '5.0~8.0', unit: '℃/min', inputType: 'MANUAL' },
          { code: 'ht_s5', name: '设定保温温度', dataType: 'Decimal', required: true, stdValue: '480~520', unit: '℃', inputType: 'MANUAL' },
          { code: 'ht_s6', name: '设定保温时间', dataType: 'Int', required: true, stdValue: '10~15', unit: 'min', inputType: 'MANUAL' },
          { code: 'ht_s7', name: '设定冷却方式', dataType: 'Enum', required: true, stdValue: '水淬/空冷/炉冷', inputType: 'SELECT' },
          { code: 'ht_s8', name: '过程确认签名', dataType: 'Ref', required: true, inputType: 'ESIGN' },
          { code: 'ht_s9', name: '过程确认复核', dataType: 'Ref', required: true, inputType: 'ESIGN', remark: '必须与确认人不同' },
        ],
      },
      {
        seq: 40, phaseCode: 'HT-P04', phaseName: '热处理执行', phaseType: 'EXEC',
        required: true, eSign: true, dualReview: false, linkedDoc: '热处理执行记录',
        fields: [
          { code: 'ht_e1', name: '实际升温曲线', dataType: 'JSON', required: true, inputType: 'AUTO', remark: 'PLC/温控仪每秒1点采集' },
          { code: 'ht_e2', name: '实际保温温度', dataType: 'Decimal', required: true, unit: '℃', inputType: 'AUTO', remark: '热电偶均值' },
          { code: 'ht_e3', name: '实际保温时间', dataType: 'Int', required: true, unit: 'min', inputType: 'AUTO', remark: 'PLC计时' },
          { code: 'ht_e4', name: '实际冷却开始温度', dataType: 'Decimal', required: true, unit: '℃', inputType: 'AUTO' },
          { code: 'ht_e5', name: '炉内真空度', dataType: 'Decimal', required: false, unit: 'Pa', inputType: 'AUTO' },
          { code: 'ht_e6', name: '气氛类型', dataType: 'Enum', required: true, stdValue: '氩气/氮气', inputType: 'SELECT' },
          { code: 'ht_e7', name: '装炉量', dataType: 'Int', required: true, unit: '件', inputType: 'MANUAL' },
          { code: 'ht_e8', name: '热处理批号', dataType: 'String', required: true, inputType: 'AUTO', remark: 'HT-YYYYMMDD-NNN' },
        ],
      },
      {
        seq: 50, phaseCode: 'HT-P05', phaseName: '出炉检验', phaseType: 'IPQC',
        required: true, eSign: true, dualReview: false, linkedDoc: '出炉检验单',
        fields: [
          { code: 'ht_i1', name: '外观颜色', dataType: 'Enum', required: true, stdValue: '均匀金属光泽', instrument: '目视', inputType: 'SELECT' },
          { code: 'ht_i2', name: '表面氧化', dataType: 'Enum', required: true, stdValue: '无', instrument: '目视', inputType: 'SELECT' },
          { code: 'ht_i3', name: '硬度抽检值', dataType: 'Decimal', required: true, stdValue: '按材质标准', instrument: '维氏硬度计', inputType: 'MANUAL' },
          { code: 'ht_i4', name: '回弹角抽检', dataType: 'Decimal', required: false, stdValue: '符合形状记忆特性', instrument: '专用夹具', inputType: 'MANUAL' },
          { code: 'ht_i5', name: '金相抽检图', dataType: 'Image', required: false, instrument: '金相显微镜', inputType: 'UPLOAD' },
          { code: 'ht_i6', name: '出炉判定', dataType: 'Enum', required: true, stdValue: '合格/不合格', inputType: 'SELECT' },
          { code: 'ht_i7', name: '检验员', dataType: 'Ref', required: true, inputType: 'ESIGN' },
        ],
      },
      {
        seq: 60, phaseCode: 'HT-P06', phaseName: '完工清场', phaseType: 'CLEAN',
        required: true, eSign: true, dualReview: false, linkedDoc: '清场确认单',
        fields: [
          { code: 'ht_c1', name: '炉体清洁确认', dataType: 'Boolean', required: true, stdValue: 'TRUE', inputType: 'SELECT' },
          { code: 'ht_c2', name: '余料退库', dataType: 'Boolean', required: true, inputType: 'SELECT' },
          { code: 'ht_c3', name: '清场人员', dataType: 'Ref', required: true, inputType: 'ESIGN' },
        ],
      },
      {
        seq: 70, phaseCode: 'HT-P07', phaseName: '工序交接', phaseType: 'HAND',
        required: true, eSign: true, dualReview: false, linkedDoc: '工序转移单',
        scanReq: 'MATERIAL',
        fields: [
          { code: 'ht_h1', name: '交接数量', dataType: 'Int', required: true, unit: '件', inputType: 'MANUAL' },
          { code: 'ht_h2', name: '热处理批号', dataType: 'String', required: true, inputType: 'AUTO' },
          { code: 'ht_h3', name: '交出人', dataType: 'Ref', required: true, inputType: 'ESIGN' },
          { code: 'ht_h4', name: '接收人', dataType: 'Ref', required: true, inputType: 'ESIGN' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // 3. OP-COAT-001  表面涂层 PVD
  // ─────────────────────────────────────────────────────────
  {
    id: 'op-003',
    opCode: 'OP-COAT-001',
    opName: '表面涂层(PVD)',
    opShort: '涂层',
    category: 'PROD',
    workshop: '涂层车间',
    productLine: '根管锉A线',
    workCenter: 'WC-COAT-01',
    equipType: 'PVD镀膜机',
    stdTimeMin: 60,
    prepTimeMin: 30,
    hasFirstPiece: true,
    hasLastPiece: true,
    hasPatrol: true,
    patrolFreq: 0,
    hasCleanup: true,
    envReq: '洁净室，温度 23±3℃，湿度 ≤50%',
    paramTemplate: 'TP-COAT-001',
    isBottleneck: false,
    isReportPoint: true,
    isQcPoint: true,
    status: 'ACTIVE',
    version: 'V1.0',
    effectDate: '2026-01-15',
    createdBy: '工艺工程师',
    updatedAt: '2026-04-01',
    remark: 'TiN/DLC/ZrN 涂层，厚度1.0~3.0μm；靶材批次全程追溯',
    phases: [
      {
        seq: 10, phaseCode: 'COAT-P01', phaseName: '生产前准备', phaseType: 'PREP',
        required: true, eSign: true, dualReview: false, linkedDoc: '清场检查单',
        fields: [
          { code: 'coat_prep1', name: '镀膜机点检', dataType: 'Enum', required: true, stdValue: '正常', inputType: 'SELECT' },
          { code: 'coat_prep2', name: '靶材状态确认', dataType: 'Enum', required: true, stdValue: '正常', inputType: 'SELECT' },
          { code: 'coat_prep3', name: '真空系统检查', dataType: 'Boolean', required: true, stdValue: 'TRUE', inputType: 'SELECT' },
          { code: 'coat_prep4', name: '气体供应确认', dataType: 'Boolean', required: true, inputType: 'SELECT' },
        ],
      },
      {
        seq: 20, phaseCode: 'COAT-P02', phaseName: '上料核对', phaseType: 'LOAD',
        required: true, eSign: false, dualReview: false,
        fields: [
          { code: 'coat_l1', name: '来料批号', dataType: 'String', required: true, inputType: 'SCAN' },
          { code: 'coat_l2', name: '来料数量', dataType: 'Int', required: true, unit: '件', inputType: 'MANUAL' },
          { code: 'coat_l3', name: '靶材批次号', dataType: 'String', required: true, inputType: 'SCAN' },
        ],
      },
      {
        seq: 30, phaseCode: 'COAT-P03', phaseName: '首件检验(前)', phaseType: 'IPQC',
        required: true, eSign: true, dualReview: false, linkedDoc: '涂层首件检验单',
        fields: [
          { code: 'coat_f1', name: '涂层前外观确认', dataType: 'Enum', required: true, stdValue: '合格', inputType: 'SELECT' },
          { code: 'coat_f2', name: '首件判定', dataType: 'Enum', required: true, inputType: 'SELECT' },
          { code: 'coat_f3', name: '检验员', dataType: 'Ref', required: true, inputType: 'ESIGN' },
        ],
      },
      {
        seq: 40, phaseCode: 'COAT-P04', phaseName: '涂层执行', phaseType: 'EXEC',
        required: true, eSign: true, dualReview: false, linkedDoc: '涂层过程记录',
        fields: [
          { code: 'coat_e1', name: '涂层设备编号', dataType: 'Ref', required: true, inputType: 'SCAN' },
          { code: 'coat_e2', name: '靶材类型', dataType: 'Enum', required: true, stdValue: 'TiN/DLC/ZrN', inputType: 'SELECT' },
          { code: 'coat_e3', name: '靶材批次', dataType: 'String', required: true, inputType: 'SCAN' },
          { code: 'coat_e4', name: '真空室压力', dataType: 'Decimal', required: true, stdValue: '0.1~0.5', unit: 'Pa', inputType: 'AUTO' },
          { code: 'coat_e5', name: '沉积温度', dataType: 'Decimal', required: true, stdValue: '300~450', unit: '℃', inputType: 'AUTO' },
          { code: 'coat_e6', name: '沉积时间', dataType: 'Int', required: true, stdValue: '30~60', unit: 'min', inputType: 'AUTO' },
          { code: 'coat_e7', name: '偏压电压', dataType: 'Int', required: true, stdValue: '-50~-150', unit: 'V', inputType: 'AUTO' },
          { code: 'coat_e8', name: '氩气流量', dataType: 'Decimal', required: true, stdValue: '50~100', unit: 'sccm', inputType: 'AUTO' },
          { code: 'coat_e9', name: '氮气流量', dataType: 'Decimal', required: true, stdValue: '20~50', unit: 'sccm', inputType: 'AUTO' },
        ],
      },
      {
        seq: 50, phaseCode: 'COAT-P05', phaseName: '涂层后检验', phaseType: 'IPQC',
        required: true, eSign: true, dualReview: false, linkedDoc: '涂层检验报告',
        fields: [
          { code: 'coat_i1', name: '涂层厚度', dataType: 'Decimal', required: true, stdValue: '1.0~3.0', unit: 'μm', instrument: '膜厚仪/球磨仪', inputType: 'MANUAL' },
          { code: 'coat_i2', name: '附着力', dataType: 'Enum', required: true, stdValue: '≥3B', instrument: '划格法', inputType: 'SELECT' },
          { code: 'coat_i3', name: '颜色均匀性', dataType: 'Enum', required: true, stdValue: '均匀一致', instrument: '目视/色差仪', inputType: 'SELECT' },
          { code: 'coat_i4', name: '表面粗糙度变化', dataType: 'Decimal', required: false, stdValue: '≤0.2μm增量', instrument: '粗糙度仪', inputType: 'MANUAL' },
          { code: 'coat_i5', name: '涂层判定', dataType: 'Enum', required: true, stdValue: '合格/不合格', inputType: 'SELECT' },
          { code: 'coat_i6', name: '检验员', dataType: 'Ref', required: true, inputType: 'ESIGN' },
        ],
      },
      {
        seq: 60, phaseCode: 'COAT-P06', phaseName: '末件检验', phaseType: 'IPQC',
        required: false, eSign: true, dualReview: false,
        fields: [
          { code: 'coat_l1', name: '末件涂层外观', dataType: 'Enum', required: true, inputType: 'SELECT' },
          { code: 'coat_l2', name: '末件判定', dataType: 'Enum', required: true, inputType: 'SELECT' },
          { code: 'coat_l3', name: '检验员', dataType: 'Ref', required: true, inputType: 'ESIGN' },
        ],
      },
      {
        seq: 70, phaseCode: 'COAT-P07', phaseName: '完工清场', phaseType: 'CLEAN',
        required: true, eSign: true, dualReview: false,
        fields: [
          { code: 'coat_c1', name: '设备清洁确认', dataType: 'Boolean', required: true, inputType: 'SELECT' },
          { code: 'coat_c2', name: '清场人员', dataType: 'Ref', required: true, inputType: 'ESIGN' },
        ],
      },
      {
        seq: 80, phaseCode: 'COAT-P08', phaseName: '工序交接', phaseType: 'HAND',
        required: true, eSign: true, dualReview: false,
        fields: [
          { code: 'coat_h1', name: '交接数量', dataType: 'Int', required: true, unit: '件', inputType: 'MANUAL' },
          { code: 'coat_h2', name: '交出人', dataType: 'Ref', required: true, inputType: 'ESIGN' },
          { code: 'coat_h3', name: '接收人', dataType: 'Ref', required: true, inputType: 'ESIGN' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // 4. OP-LASER-001  激光打标 UDI
  // ─────────────────────────────────────────────────────────
  {
    id: 'op-004',
    opCode: 'OP-LASER-001',
    opName: '激光打标(UDI)',
    opShort: '打标',
    category: 'PROD',
    workshop: '标识车间',
    productLine: '根管锉A线',
    workCenter: 'WC-LASER-01',
    equipType: '光纤激光打标机',
    stdTimeMin: 2,
    prepTimeMin: 15,
    hasFirstPiece: true,
    hasLastPiece: false,
    hasPatrol: true,
    patrolFreq: 100,
    hasCleanup: true,
    envReq: '防尘，激光防护区域，激光功率≥额定值',
    paramTemplate: 'TP-LASER-001',
    isBottleneck: false,
    isReportPoint: true,
    isQcPoint: true,
    status: 'ACTIVE',
    version: 'V1.0',
    effectDate: '2026-01-15',
    createdBy: '工艺工程师',
    updatedAt: '2026-04-01',
    remark: 'UDI合规核心工序，序列号级追溯，GS1-128/HIBCC格式',
    phases: [
      {
        seq: 10, phaseCode: 'LAS-P01', phaseName: '生产前准备', phaseType: 'PREP',
        required: true, eSign: true, dualReview: false, linkedDoc: 'UDI准备确认单',
        remark: 'UDI规则校验',
        fields: [
          { code: 'las_prep1', name: '激光机点检', dataType: 'Enum', required: true, stdValue: '正常', inputType: 'SELECT' },
          { code: 'las_prep2', name: 'UDI模板版本确认', dataType: 'String', required: true, inputType: 'SELECT' },
          { code: 'las_prep3', name: 'GTIN/产品编码确认', dataType: 'Boolean', required: true, stdValue: 'TRUE', inputType: 'SELECT' },
          { code: 'las_prep4', name: '序列号起始值', dataType: 'String', required: true, inputType: 'AUTO', remark: '系统自动分配' },
        ],
      },
      {
        seq: 20, phaseCode: 'LAS-P02', phaseName: '上料核对', phaseType: 'LOAD',
        required: true, eSign: false, dualReview: false,
        scanReq: 'MATERIAL',
        fields: [
          { code: 'las_l1', name: '来料批号', dataType: 'String', required: true, inputType: 'SCAN' },
          { code: 'las_l2', name: '来料数量', dataType: 'Int', required: true, unit: '件', inputType: 'MANUAL' },
        ],
      },
      {
        seq: 30, phaseCode: 'LAS-P03', phaseName: '首件确认', phaseType: 'IPQC',
        required: true, eSign: true, dualReview: false, linkedDoc: 'UDI首件确认单',
        remark: '扫码枪可读性验证',
        fields: [
          { code: 'las_i1', name: 'UDI数据内容', dataType: 'String', required: true, stdValue: 'GTIN+Batch+SN', inputType: 'AUTO', remark: 'GS1-128/HIBCC格式' },
          { code: 'las_i2', name: '人眼可读码', dataType: 'String', required: true, inputType: 'AUTO' },
          { code: 'las_i3', name: '扫码枪验证结果', dataType: 'Boolean', required: true, stdValue: 'TRUE', inputType: 'SCAN', remark: '用扫码枪扫首件' },
          { code: 'las_i4', name: '打标深度', dataType: 'Decimal', required: true, stdValue: '0.01~0.05', unit: 'mm', inputType: 'MANUAL' },
          { code: 'las_i5', name: '打标清晰度', dataType: 'Enum', required: true, stdValue: '清晰', inputType: 'SELECT' },
          { code: 'las_i6', name: '打标位置偏移', dataType: 'Decimal', required: true, stdValue: '≤0.2', unit: 'mm', inputType: 'MANUAL' },
          { code: 'las_i7', name: '序列号起始值', dataType: 'String', required: true, inputType: 'AUTO' },
          { code: 'las_i8', name: '打标模板编号', dataType: 'String', required: true, inputType: 'SELECT' },
          { code: 'las_i9', name: '首件判定', dataType: 'Enum', required: true, inputType: 'SELECT' },
          { code: 'las_i10', name: '检验员', dataType: 'Ref', required: true, inputType: 'ESIGN' },
        ],
      },
      {
        seq: 40, phaseCode: 'LAS-P04', phaseName: '批量打标', phaseType: 'EXEC',
        required: true, eSign: false, dualReview: false, linkedDoc: '打标执行记录',
        remark: '序列号级关联',
        fields: [
          { code: 'las_e1', name: '激光功率', dataType: 'Decimal', required: true, unit: 'W', inputType: 'AUTO' },
          { code: 'las_e2', name: '打标速度', dataType: 'Int', required: true, unit: 'mm/s', inputType: 'AUTO' },
          { code: 'las_e3', name: '频率', dataType: 'Int', required: true, unit: 'kHz', inputType: 'AUTO' },
          { code: 'las_e4', name: '填充密度', dataType: 'Int', required: true, unit: '%', inputType: 'MANUAL' },
          { code: 'las_e5', name: '当前序列号', dataType: 'String', required: true, inputType: 'AUTO' },
          { code: 'las_e6', name: '已打标数量', dataType: 'Int', required: true, unit: '件', inputType: 'AUTO' },
          { code: 'las_e7', name: '异常跳过数量', dataType: 'Int', required: true, stdValue: '0', unit: '件', inputType: 'MANUAL' },
        ],
      },
      {
        seq: 50, phaseCode: 'LAS-P05', phaseName: '过程巡检', phaseType: 'IPQC',
        required: false, eSign: true, dualReview: false,
        remark: '随机扫码验证',
        fields: [
          { code: 'las_p1', name: '巡检件扫码验证', dataType: 'Boolean', required: true, stdValue: 'TRUE', inputType: 'SCAN' },
          { code: 'las_p2', name: '巡检判定', dataType: 'Enum', required: true, inputType: 'SELECT' },
          { code: 'las_p3', name: '巡检员', dataType: 'Ref', required: true, inputType: 'ESIGN' },
        ],
      },
      {
        seq: 60, phaseCode: 'LAS-P06', phaseName: '完工清场', phaseType: 'CLEAN',
        required: true, eSign: true, dualReview: false,
        fields: [
          { code: 'las_c1', name: '设备清洁确认', dataType: 'Boolean', required: true, inputType: 'SELECT' },
          { code: 'las_c2', name: '清场人员', dataType: 'Ref', required: true, inputType: 'ESIGN' },
        ],
      },
      {
        seq: 70, phaseCode: 'LAS-P07', phaseName: '工序交接', phaseType: 'HAND',
        required: true, eSign: true, dualReview: false,
        remark: 'UDI数据上传确认',
        fields: [
          { code: 'las_h1', name: '打标总数量', dataType: 'Int', required: true, unit: '件', inputType: 'AUTO' },
          { code: 'las_h2', name: 'UDI数据上传确认', dataType: 'Boolean', required: true, stdValue: 'TRUE', inputType: 'SELECT' },
          { code: 'las_h3', name: '交出人', dataType: 'Ref', required: true, inputType: 'ESIGN' },
          { code: 'las_h4', name: '接收人', dataType: 'Ref', required: true, inputType: 'ESIGN' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // 5. OP-USC-001  超声波清洗
  // ─────────────────────────────────────────────────────────
  {
    id: 'op-005',
    opCode: 'OP-USC-001',
    opName: '超声波清洗',
    opShort: '清洗',
    category: 'PROD',
    workshop: '清洗车间',
    productLine: '根管锉A线',
    workCenter: 'WC-CLEAN-01',
    equipType: '超声波清洗机',
    stdTimeMin: 30,
    prepTimeMin: 20,
    hasFirstPiece: false,
    hasLastPiece: false,
    hasPatrol: true,
    patrolFreq: 0,
    hasCleanup: true,
    envReq: '洁净区，纯水供应，废液排放符合规定',
    isBottleneck: false,
    isReportPoint: true,
    isQcPoint: false,
    status: 'ACTIVE',
    version: 'V1.0',
    effectDate: '2026-01-15',
    createdBy: '工艺工程师',
    updatedAt: '2026-04-01',
    remark: '灭菌前必须完成清洗，清洗液浓度/温度/时间全程记录',
    phases: [
      {
        seq: 10, phaseCode: 'USC-P01', phaseName: '生产前准备', phaseType: 'PREP',
        required: true, eSign: true, dualReview: false,
        fields: [
          { code: 'usc_prep1', name: '清洗槽点检', dataType: 'Enum', required: true, stdValue: '正常', inputType: 'SELECT' },
          { code: 'usc_prep2', name: '清洗液配制确认', dataType: 'Boolean', required: true, inputType: 'SELECT' },
          { code: 'usc_prep3', name: '纯水电导率', dataType: 'Decimal', required: true, stdValue: '≤2', unit: 'μS/cm', inputType: 'MANUAL' },
        ],
      },
      {
        seq: 20, phaseCode: 'USC-P02', phaseName: '上料核对', phaseType: 'LOAD',
        required: true, eSign: false, dualReview: false,
        fields: [
          { code: 'usc_l1', name: '来料批号', dataType: 'String', required: true, inputType: 'SCAN' },
          { code: 'usc_l2', name: '来料数量', dataType: 'Int', required: true, unit: '件', inputType: 'MANUAL' },
        ],
      },
      {
        seq: 30, phaseCode: 'USC-P03', phaseName: '清洗执行', phaseType: 'EXEC',
        required: true, eSign: true, dualReview: false, linkedDoc: '清洗执行记录',
        fields: [
          { code: 'usc_e1', name: '清洗槽编号', dataType: 'Ref', required: true, inputType: 'SCAN' },
          { code: 'usc_e2', name: '清洗液类型', dataType: 'Enum', required: true, stdValue: '中性清洗剂/纯水', inputType: 'SELECT' },
          { code: 'usc_e3', name: '清洗液浓度', dataType: 'Decimal', required: true, stdValue: '2~5', unit: '%', inputType: 'MANUAL' },
          { code: 'usc_e4', name: '超声功率', dataType: 'Int', required: true, stdValue: '200~400', unit: 'W', inputType: 'AUTO' },
          { code: 'usc_e5', name: '超声频率', dataType: 'Int', required: true, stdValue: '40', unit: 'kHz', inputType: 'AUTO' },
          { code: 'usc_e6', name: '清洗温度', dataType: 'Decimal', required: true, stdValue: '40~60', unit: '℃', inputType: 'AUTO' },
          { code: 'usc_e7', name: '清洗时间', dataType: 'Int', required: true, stdValue: '10~20', unit: 'min', inputType: 'AUTO' },
          { code: 'usc_e8', name: '漂洗次数', dataType: 'Int', required: true, stdValue: '3', unit: '次', inputType: 'MANUAL' },
          { code: 'usc_e9', name: '干燥温度', dataType: 'Decimal', required: true, stdValue: '60~80', unit: '℃', inputType: 'AUTO' },
          { code: 'usc_e10', name: '干燥时间', dataType: 'Int', required: true, stdValue: '15~30', unit: 'min', inputType: 'AUTO' },
        ],
      },
      {
        seq: 40, phaseCode: 'USC-P04', phaseName: '清洗效果检验', phaseType: 'IPQC',
        required: true, eSign: true, dualReview: false, linkedDoc: '清洗效果检验单',
        fields: [
          { code: 'usc_i1', name: '目视清洁度', dataType: 'Enum', required: true, stdValue: '无可见污渍', instrument: '目视(放大镜)', inputType: 'SELECT' },
          { code: 'usc_i2', name: '微粒检测', dataType: 'Enum', required: false, stdValue: '符合等级', instrument: '微粒计数器(抽检)', inputType: 'SELECT' },
          { code: 'usc_i3', name: '干燥度', dataType: 'Enum', required: true, stdValue: '完全干燥', instrument: '目视', inputType: 'SELECT' },
          { code: 'usc_i4', name: 'pH残留检测', dataType: 'Decimal', required: false, stdValue: '6.0~8.0', instrument: 'pH试纸/仪', inputType: 'MANUAL' },
          { code: 'usc_i5', name: '清洗判定', dataType: 'Enum', required: true, inputType: 'SELECT' },
          { code: 'usc_i6', name: '检验员', dataType: 'Ref', required: true, inputType: 'ESIGN' },
        ],
      },
      {
        seq: 50, phaseCode: 'USC-P05', phaseName: '完工清场', phaseType: 'CLEAN',
        required: true, eSign: true, dualReview: false,
        fields: [
          { code: 'usc_c1', name: '清洗槽清洁确认', dataType: 'Boolean', required: true, inputType: 'SELECT' },
          { code: 'usc_c2', name: '废液处置确认', dataType: 'Boolean', required: true, inputType: 'SELECT' },
          { code: 'usc_c3', name: '清场人员', dataType: 'Ref', required: true, inputType: 'ESIGN' },
        ],
      },
      {
        seq: 60, phaseCode: 'USC-P06', phaseName: '工序交接', phaseType: 'HAND',
        required: true, eSign: true, dualReview: false,
        fields: [
          { code: 'usc_h1', name: '交接数量', dataType: 'Int', required: true, unit: '件', inputType: 'MANUAL' },
          { code: 'usc_h2', name: '交出人', dataType: 'Ref', required: true, inputType: 'ESIGN' },
          { code: 'usc_h3', name: '接收人', dataType: 'Ref', required: true, inputType: 'ESIGN' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // 6. OP-FINAL-001  成品检验 FQC
  // ─────────────────────────────────────────────────────────
  {
    id: 'op-006',
    opCode: 'OP-FINAL-001',
    opName: '成品检验(FQC)',
    opShort: 'FQC',
    category: 'INSP',
    workshop: '检验中心',
    productLine: '根管锉A线',
    workCenter: 'WC-QC-01',
    equipType: '投影仪/扭力测试仪',
    stdTimeMin: 15,
    prepTimeMin: 15,
    hasFirstPiece: true,
    hasLastPiece: false,
    hasPatrol: true,
    patrolFreq: 0,
    hasCleanup: true,
    envReq: '恒温恒湿，20±2℃，45~65%RH，振动<0.5μm',
    isBottleneck: true,
    isReportPoint: false,
    isQcPoint: true,
    status: 'ACTIVE',
    version: 'V1.0',
    effectDate: '2026-01-15',
    createdBy: 'QA工程师',
    updatedAt: '2026-04-01',
    remark: 'ISO 3630-1全尺寸+扭力+外观+判定，检验报告自动生成',
    phases: [
      {
        seq: 10, phaseCode: 'FIN-P01', phaseName: '检验前准备', phaseType: 'PREP',
        required: true, eSign: true, dualReview: false,
        fields: [
          { code: 'fin_prep1', name: '量具校准状态', dataType: 'Boolean', required: true, stdValue: 'TRUE', inputType: 'SELECT' },
          { code: 'fin_prep2', name: '检验标准版本确认', dataType: 'String', required: true, inputType: 'SELECT' },
          { code: 'fin_prep3', name: 'AQL抽样方案', dataType: 'String', required: true, inputType: 'SELECT' },
        ],
      },
      {
        seq: 20, phaseCode: 'FIN-P02', phaseName: '来料核对', phaseType: 'LOAD',
        required: true, eSign: false, dualReview: false,
        fields: [
          { code: 'fin_l1', name: '来料批号', dataType: 'String', required: true, inputType: 'SCAN' },
          { code: 'fin_l2', name: '来料数量', dataType: 'Int', required: true, unit: '件', inputType: 'MANUAL' },
          { code: 'fin_l3', name: '抽检数量', dataType: 'Int', required: true, unit: '件', inputType: 'AUTO', remark: 'AQL自动计算' },
        ],
      },
      {
        seq: 30, phaseCode: 'FIN-P03', phaseName: '全尺寸检验', phaseType: 'IPQC',
        required: true, eSign: true, dualReview: false, linkedDoc: '全尺寸检验报告',
        fields: [
          { code: 'fin_d1', name: '总长度L', dataType: 'Decimal', required: true, stdValue: '25±0.5', unit: 'mm', instrument: '卡尺', inputType: 'MANUAL' },
          { code: 'fin_d2', name: '工作长度', dataType: 'Decimal', required: true, stdValue: '16/20/26等', unit: 'mm', inputType: 'MANUAL' },
          { code: 'fin_d3', name: '尖端直径D0', dataType: 'Decimal', required: true, stdValue: '0.150±0.005', unit: 'mm', instrument: '投影仪', inputType: 'MANUAL' },
          { code: 'fin_d4', name: 'D3(尖端+3mm)', dataType: 'Decimal', required: true, stdValue: '按锥度计算', unit: 'mm', inputType: 'MANUAL' },
          { code: 'fin_d5', name: 'D6(尖端+6mm)', dataType: 'Decimal', required: true, stdValue: '按锥度计算', unit: 'mm', inputType: 'MANUAL' },
          { code: 'fin_d6', name: 'D16(尖端+16mm)', dataType: 'Decimal', required: true, stdValue: '按锥度计算', unit: 'mm', inputType: 'MANUAL' },
          { code: 'fin_d7', name: '锥度', dataType: 'Decimal', required: true, stdValue: '0.04', inputType: 'MANUAL' },
          { code: 'fin_d8', name: '螺纹螺距', dataType: 'Decimal', required: true, stdValue: '按设计', unit: 'mm', inputType: 'MANUAL' },
          { code: 'fin_d9', name: '圆度', dataType: 'Decimal', required: true, stdValue: '≤0.005', unit: 'mm', inputType: 'MANUAL' },
          { code: 'fin_d10', name: '表面粗糙度', dataType: 'Decimal', required: true, stdValue: '≤0.8', unit: 'μm', inputType: 'MANUAL' },
        ],
      },
      {
        seq: 40, phaseCode: 'FIN-P04', phaseName: '扭力/性能检验', phaseType: 'IPQC',
        required: true, eSign: true, dualReview: false, linkedDoc: '性能检验报告',
        fields: [
          { code: 'fin_t1', name: '扭转强度', dataType: 'Decimal', required: true, stdValue: '≥标准值', unit: 'N·cm', instrument: '扭力测试仪', inputType: 'MANUAL' },
          { code: 'fin_t2', name: '抗弯强度', dataType: 'Decimal', required: true, stdValue: '≥标准值', unit: 'N', inputType: 'MANUAL' },
          { code: 'fin_t3', name: '抗疲劳循环次数', dataType: 'Int', required: false, stdValue: '≥标准值', unit: '次', inputType: 'MANUAL' },
          { code: 'fin_t4', name: '尖端抗折角', dataType: 'Decimal', required: false, stdValue: '≤标准值', unit: '°', inputType: 'MANUAL' },
          { code: 'fin_t5', name: '器械分离扭力', dataType: 'Decimal', required: false, stdValue: '≥标准值', unit: 'N·cm', inputType: 'MANUAL' },
        ],
      },
      {
        seq: 50, phaseCode: 'FIN-P05', phaseName: '外观检验', phaseType: 'IPQC',
        required: true, eSign: true, dualReview: false,
        fields: [
          { code: 'fin_a1', name: 'UDI标签可读性', dataType: 'Boolean', required: true, stdValue: 'TRUE', inputType: 'SCAN' },
          { code: 'fin_a2', name: '外观缺陷', dataType: 'Enum', required: true, stdValue: '无', inputType: 'SELECT' },
          { code: 'fin_a3', name: '柄部颜色', dataType: 'Enum', required: true, inputType: 'SELECT' },
          { code: 'fin_a4', name: '包装完整性', dataType: 'Enum', required: true, stdValue: '合格', inputType: 'SELECT' },
        ],
      },
      {
        seq: 60, phaseCode: 'FIN-P06', phaseName: '检验判定', phaseType: 'EXEC',
        required: true, eSign: true, dualReview: true, linkedDoc: '成品检验报告',
        fields: [
          { code: 'fin_j1', name: '综合判定', dataType: 'Enum', required: true, stdValue: '合格/不合格', inputType: 'SELECT' },
          { code: 'fin_j2', name: '不合格品数量', dataType: 'Int', required: true, stdValue: '0', unit: '件', inputType: 'MANUAL' },
          { code: 'fin_j3', name: '不合格品处置', dataType: 'Enum', required: false, stdValue: '返工/报废/让步', inputType: 'SELECT' },
          { code: 'fin_j4', name: '返工工序', dataType: 'Ref', required: false, inputType: 'SELECT' },
          { code: 'fin_j5', name: '让步接收审批单', dataType: 'Ref', required: false, inputType: 'UPLOAD' },
          { code: 'fin_j6', name: '检验报告编号', dataType: 'String', required: true, inputType: 'AUTO' },
          { code: 'fin_j7', name: '检验员', dataType: 'Ref', required: true, inputType: 'ESIGN' },
          { code: 'fin_j8', name: '复核员', dataType: 'Ref', required: true, inputType: 'ESIGN', remark: '必须与检验员不同' },
        ],
      },
      {
        seq: 70, phaseCode: 'FIN-P07', phaseName: '记录归档', phaseType: 'CLEAN',
        required: true, eSign: true, dualReview: false,
        fields: [
          { code: 'fin_r1', name: '检验记录归档确认', dataType: 'Boolean', required: true, stdValue: 'TRUE', inputType: 'SELECT' },
          { code: 'fin_r2', name: '归档人员', dataType: 'Ref', required: true, inputType: 'ESIGN' },
        ],
      },
      {
        seq: 80, phaseCode: 'FIN-P08', phaseName: '工序交接', phaseType: 'HAND',
        required: true, eSign: true, dualReview: false,
        fields: [
          { code: 'fin_h1', name: '合格品数量', dataType: 'Int', required: true, unit: '件', inputType: 'MANUAL' },
          { code: 'fin_h2', name: '交出人', dataType: 'Ref', required: true, inputType: 'ESIGN' },
          { code: 'fin_h3', name: '接收人', dataType: 'Ref', required: true, inputType: 'ESIGN' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // 7. OP-STER-001  初包装+灭菌（EO灭菌）
  // ─────────────────────────────────────────────────────────
  {
    id: 'op-007',
    opCode: 'OP-STER-001',
    opName: '初包装+灭菌',
    opShort: '灭菌',
    category: 'PACK',
    workshop: '灭菌车间',
    productLine: '根管锉A线',
    workCenter: 'WC-STER-01',
    equipType: 'EO灭菌柜',
    stdTimeMin: 90,
    prepTimeMin: 30,
    hasFirstPiece: true,
    hasLastPiece: false,
    hasPatrol: true,
    patrolFreq: 0,
    hasCleanup: true,
    envReq: '洁净室C级，正压防护，EO废气处理达标',
    paramTemplate: 'TP-EO-STER-001',
    isBottleneck: true,
    isReportPoint: true,
    isQcPoint: true,
    status: 'ACTIVE',
    version: 'V1.0',
    effectDate: '2026-01-15',
    createdBy: '工艺工程师',
    updatedAt: '2026-04-01',
    remark: '灭菌批记录关键工序，生物指示剂+化学指示卡+参数曲线三重确认',
    phases: [
      {
        seq: 10, phaseCode: 'STE-P01', phaseName: '生产前准备', phaseType: 'PREP',
        required: true, eSign: true, dualReview: false,
        fields: [
          { code: 'ste_prep1', name: '灭菌柜点检', dataType: 'Enum', required: true, stdValue: '正常', inputType: 'SELECT' },
          { code: 'ste_prep2', name: '封口机校验', dataType: 'Boolean', required: true, inputType: 'SELECT' },
          { code: 'ste_prep3', name: '清洁区确认', dataType: 'Boolean', required: true, inputType: 'SELECT' },
        ],
      },
      {
        seq: 20, phaseCode: 'STE-P02', phaseName: '上料核对', phaseType: 'LOAD',
        required: true, eSign: true, dualReview: false,
        fields: [
          { code: 'ste_l1', name: '来料批号', dataType: 'String', required: true, inputType: 'SCAN' },
          { code: 'ste_l2', name: '来料数量', dataType: 'Int', required: true, unit: '件', inputType: 'MANUAL' },
          { code: 'ste_l3', name: '包材批号', dataType: 'String', required: true, inputType: 'SCAN' },
        ],
      },
      {
        seq: 30, phaseCode: 'STE-P03', phaseName: '初包装执行', phaseType: 'EXEC',
        required: true, eSign: true, dualReview: false, linkedDoc: '初包装记录',
        fields: [
          { code: 'ste_p1', name: '初包装材料', dataType: 'Enum', required: true, stdValue: 'Tyvek/吸塑盒/纸塑袋', inputType: 'SELECT' },
          { code: 'ste_p2', name: '包材批号', dataType: 'String', required: true, inputType: 'SCAN' },
          { code: 'ste_p3', name: '封口温度', dataType: 'Decimal', required: true, stdValue: '120~180', unit: '℃', inputType: 'AUTO' },
          { code: 'ste_p4', name: '封口压力', dataType: 'Decimal', required: true, stdValue: '0.2~0.5', unit: 'MPa', inputType: 'AUTO' },
          { code: 'ste_p5', name: '封口时间', dataType: 'Int', required: true, stdValue: '2~5', unit: 's', inputType: 'AUTO' },
          { code: 'ste_p6', name: '封口宽度', dataType: 'Decimal', required: true, stdValue: '≥6', unit: 'mm', inputType: 'MANUAL' },
          { code: 'ste_p7', name: '包装完整性抽检', dataType: 'Enum', required: true, stdValue: '合格', instrument: '气泡法/染料法', inputType: 'SELECT' },
          { code: 'ste_p8', name: '每包数量', dataType: 'Int', required: true, stdValue: '1~6', unit: '支', inputType: 'MANUAL' },
          { code: 'ste_p9', name: '包装人员', dataType: 'Ref', required: true, inputType: 'ESIGN' },
        ],
      },
      {
        seq: 40, phaseCode: 'STE-P04', phaseName: '灭菌装载', phaseType: 'LOAD',
        required: true, eSign: true, dualReview: false,
        fields: [
          { code: 'ste_s1', name: '灭菌柜编号', dataType: 'Ref', required: true, inputType: 'SCAN' },
          { code: 'ste_s2', name: '灭菌批号', dataType: 'String', required: true, inputType: 'AUTO' },
          { code: 'ste_s3', name: '装载数量', dataType: 'Int', required: true, unit: '件', inputType: 'MANUAL' },
          { code: 'ste_s4', name: '装载层数', dataType: 'Int', required: true, stdValue: '≤7', unit: '层', inputType: 'MANUAL' },
          { code: 'ste_s5', name: '温湿度探头数量', dataType: 'Int', required: true, stdValue: '≥3', unit: '个', inputType: 'MANUAL' },
          { code: 'ste_s6', name: '生物指示剂放置', dataType: 'Boolean', required: true, stdValue: 'TRUE', inputType: 'SELECT' },
        ],
      },
      {
        seq: 50, phaseCode: 'STE-P05', phaseName: '灭菌执行', phaseType: 'EXEC',
        required: true, eSign: true, dualReview: false, linkedDoc: '灭菌执行记录',
        fields: [
          { code: 'ste_e1', name: '设定灭菌温度', dataType: 'Decimal', required: true, stdValue: '50~60', unit: '℃', inputType: 'MANUAL' },
          { code: 'ste_e2', name: '设定相对湿度', dataType: 'Decimal', required: true, stdValue: '60~80', unit: '%', inputType: 'MANUAL' },
          { code: 'ste_e3', name: '设定EO浓度', dataType: 'Decimal', required: true, stdValue: '450~800', unit: 'mg/L', inputType: 'MANUAL' },
          { code: 'ste_e4', name: '设定灭菌时间', dataType: 'Int', required: true, stdValue: '3~8', unit: 'h', inputType: 'MANUAL' },
          { code: 'ste_e5', name: '设定解析时间', dataType: 'Int', required: true, stdValue: '≥168', unit: 'h', inputType: 'MANUAL' },
          { code: 'ste_e6', name: '实际温度曲线', dataType: 'JSON', required: true, inputType: 'AUTO' },
          { code: 'ste_e7', name: '实际压力曲线', dataType: 'JSON', required: true, inputType: 'AUTO' },
          { code: 'ste_e8', name: '实际EO浓度', dataType: 'Decimal', required: true, unit: 'mg/L', inputType: 'AUTO' },
        ],
      },
      {
        seq: 60, phaseCode: 'STE-P06', phaseName: '灭菌确认', phaseType: 'SPEC',
        required: true, eSign: true, dualReview: true, linkedDoc: '灭菌放行单',
        fields: [
          { code: 'ste_c1', name: '生物指示剂结果', dataType: 'Enum', required: true, stdValue: '阴性', inputType: 'MANUAL', remark: '培养后录入' },
          { code: 'ste_c2', name: '生物指示剂批号', dataType: 'String', required: true, inputType: 'SCAN' },
          { code: 'ste_c3', name: '化学指示卡结果', dataType: 'Enum', required: true, stdValue: '变色合格', inputType: 'SELECT' },
          { code: 'ste_c4', name: '灭菌参数曲线审核', dataType: 'Boolean', required: true, stdValue: 'TRUE', inputType: 'ESIGN' },
          { code: 'ste_c5', name: '灭菌记录审核人', dataType: 'Ref', required: true, inputType: 'ESIGN' },
          { code: 'ste_c6', name: '灭菌放行单号', dataType: 'String', required: true, inputType: 'AUTO' },
        ],
      },
      {
        seq: 70, phaseCode: 'STE-P07', phaseName: '灭菌后检验', phaseType: 'IPQC',
        required: true, eSign: true, dualReview: false,
        fields: [
          { code: 'ste_i1', name: '包装完整性', dataType: 'Enum', required: true, stdValue: '合格', inputType: 'SELECT' },
          { code: 'ste_i2', name: '外观检查', dataType: 'Enum', required: true, stdValue: '合格', inputType: 'SELECT' },
          { code: 'ste_i3', name: '化学指示卡颜色', dataType: 'Enum', required: true, stdValue: '变色正常', inputType: 'SELECT' },
          { code: 'ste_i4', name: '灭菌后判定', dataType: 'Enum', required: true, inputType: 'SELECT' },
        ],
      },
      {
        seq: 80, phaseCode: 'STE-P08', phaseName: '完工清场', phaseType: 'CLEAN',
        required: true, eSign: true, dualReview: false,
        fields: [
          { code: 'ste_cl1', name: '灭菌柜清洁确认', dataType: 'Boolean', required: true, inputType: 'SELECT' },
          { code: 'ste_cl2', name: '清场人员', dataType: 'Ref', required: true, inputType: 'ESIGN' },
        ],
      },
      {
        seq: 90, phaseCode: 'STE-P09', phaseName: '工序交接', phaseType: 'HAND',
        required: true, eSign: true, dualReview: false,
        fields: [
          { code: 'ste_h1', name: '交接数量', dataType: 'Int', required: true, unit: '件', inputType: 'MANUAL' },
          { code: 'ste_h2', name: '灭菌批号', dataType: 'String', required: true, inputType: 'AUTO' },
          { code: 'ste_h3', name: '交出人', dataType: 'Ref', required: true, inputType: 'ESIGN' },
          { code: 'ste_h4', name: '接收人', dataType: 'Ref', required: true, inputType: 'ESIGN' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // 8. OP-FPACK-001  终包装/装箱
  // ─────────────────────────────────────────────────────────
  {
    id: 'op-008',
    opCode: 'OP-FPACK-001',
    opName: '终包装/装箱',
    opShort: '装箱',
    category: 'PACK',
    workshop: '包装车间',
    productLine: '根管锉A线',
    workCenter: 'WC-PACK-01',
    equipType: '自动装箱机/条码打印机',
    stdTimeMin: 5,
    prepTimeMin: 15,
    hasFirstPiece: true,
    hasLastPiece: false,
    hasPatrol: true,
    patrolFreq: 0,
    hasCleanup: true,
    envReq: '干净整洁，防尘防潮，温度15~30℃',
    isBottleneck: false,
    isReportPoint: true,
    isQcPoint: false,
    status: 'ACTIVE',
    version: 'V1.0',
    effectDate: '2026-01-15',
    createdBy: '工艺工程师',
    updatedAt: '2026-04-01',
    remark: '外箱UDI打印+标签检验，失效日期=灭菌日期+3年，成品入库',
    phases: [
      {
        seq: 10, phaseCode: 'FPK-P01', phaseName: '生产前准备', phaseType: 'PREP',
        required: true, eSign: true, dualReview: false,
        fields: [
          { code: 'fpk_prep1', name: '包装设备点检', dataType: 'Enum', required: true, stdValue: '正常', inputType: 'SELECT' },
          { code: 'fpk_prep2', name: '打印机状态', dataType: 'Enum', required: true, stdValue: '正常', inputType: 'SELECT' },
          { code: 'fpk_prep3', name: '标签模板版本', dataType: 'String', required: true, inputType: 'SELECT' },
        ],
      },
      {
        seq: 20, phaseCode: 'FPK-P02', phaseName: '上料核对', phaseType: 'LOAD',
        required: true, eSign: false, dualReview: false,
        fields: [
          { code: 'fpk_l1', name: '来料批号', dataType: 'String', required: true, inputType: 'SCAN' },
          { code: 'fpk_l2', name: '灭菌批号', dataType: 'String', required: true, inputType: 'SCAN' },
          { code: 'fpk_l3', name: '来料数量', dataType: 'Int', required: true, unit: '件', inputType: 'MANUAL' },
        ],
      },
      {
        seq: 30, phaseCode: 'FPK-P03', phaseName: '中包装/装箱', phaseType: 'EXEC',
        required: true, eSign: true, dualReview: false, linkedDoc: '装箱记录',
        fields: [
          { code: 'fpk_b1', name: '每箱数量', dataType: 'Int', required: true, unit: '支', inputType: 'MANUAL' },
          { code: 'fpk_b2', name: '箱数', dataType: 'Int', required: true, unit: '箱', inputType: 'MANUAL' },
          { code: 'fpk_b3', name: '随箱说明书', dataType: 'Boolean', required: true, stdValue: 'TRUE', inputType: 'SELECT' },
          { code: 'fpk_b4', name: '硅胶防潮剂', dataType: 'Boolean', required: true, inputType: 'SELECT' },
        ],
      },
      {
        seq: 40, phaseCode: 'FPK-P04', phaseName: '外箱标签打印', phaseType: 'EXEC',
        required: true, eSign: true, dualReview: false, linkedDoc: '标签打印记录',
        fields: [
          { code: 'fpk_l1_', name: '外箱UDI内容', dataType: 'String', required: true, stdValue: 'GTIN+Batch+QTY', inputType: 'AUTO' },
          { code: 'fpk_l2_', name: '生产批号', dataType: 'String', required: true, inputType: 'AUTO' },
          { code: 'fpk_l3_', name: '灭菌批号', dataType: 'String', required: true, inputType: 'AUTO' },
          { code: 'fpk_l4', name: '生产日期', dataType: 'Date', required: true, inputType: 'AUTO' },
          { code: 'fpk_l5', name: '失效日期', dataType: 'Date', required: true, inputType: 'AUTO', remark: '灭菌有效期+3年' },
          { code: 'fpk_l6', name: '装箱数量', dataType: 'Int', required: true, unit: '支', inputType: 'AUTO' },
          { code: 'fpk_l7', name: '储存条件', dataType: 'String', required: true, stdValue: '常温干燥', inputType: 'AUTO' },
          { code: 'fpk_l8', name: '标签打印数量', dataType: 'Int', required: true, inputType: 'AUTO' },
          { code: 'fpk_l9', name: '标签粘贴位置确认', dataType: 'Boolean', required: true, stdValue: 'TRUE', inputType: 'SELECT' },
        ],
      },
      {
        seq: 50, phaseCode: 'FPK-P05', phaseName: '标签检验', phaseType: 'IPQC',
        required: true, eSign: true, dualReview: false,
        fields: [
          { code: 'fpk_i1', name: '标签UDI扫码验证', dataType: 'Boolean', required: true, stdValue: 'TRUE', inputType: 'SCAN' },
          { code: 'fpk_i2', name: '批号/日期正确性', dataType: 'Boolean', required: true, stdValue: 'TRUE', inputType: 'SELECT' },
          { code: 'fpk_i3', name: '标签完整性', dataType: 'Enum', required: true, stdValue: '合格', inputType: 'SELECT' },
          { code: 'fpk_i4', name: '检验员', dataType: 'Ref', required: true, inputType: 'ESIGN' },
        ],
      },
      {
        seq: 60, phaseCode: 'FPK-P06', phaseName: '封箱执行', phaseType: 'EXEC',
        required: true, eSign: false, dualReview: false,
        fields: [
          { code: 'fpk_s1', name: '封箱方式', dataType: 'Enum', required: true, inputType: 'SELECT' },
          { code: 'fpk_s2', name: '已封箱数', dataType: 'Int', required: true, unit: '箱', inputType: 'MANUAL' },
        ],
      },
      {
        seq: 70, phaseCode: 'FPK-P07', phaseName: '完工清场', phaseType: 'CLEAN',
        required: true, eSign: true, dualReview: false,
        fields: [
          { code: 'fpk_c1', name: '清场确认', dataType: 'Boolean', required: true, inputType: 'SELECT' },
          { code: 'fpk_c2', name: '清场人员', dataType: 'Ref', required: true, inputType: 'ESIGN' },
        ],
      },
      {
        seq: 80, phaseCode: 'FPK-P08', phaseName: '入库交接', phaseType: 'HAND',
        required: true, eSign: true, dualReview: false,
        fields: [
          { code: 'fpk_h1', name: '入库数量', dataType: 'Int', required: true, unit: '箱', inputType: 'MANUAL' },
          { code: 'fpk_h2', name: '入库单号', dataType: 'String', required: true, inputType: 'AUTO' },
          { code: 'fpk_h3', name: '交出人', dataType: 'Ref', required: true, inputType: 'ESIGN' },
          { code: 'fpk_h4', name: '仓库接收人', dataType: 'Ref', required: true, inputType: 'ESIGN' },
        ],
      },
    ],
  },
];

// ============================================================
// FG-RKQ-2504-26  机用根管锉 #26/04锥/25mm
// 工艺路径 RT-RKQ-STD-002 对应的 16 道工序主数据
// 来源：产品-机用根管锉.xlsx  全工序阶段定义
// ============================================================

// 公共阶段字段生成helper（减少重复）
const mkPrep = (prefix: string, extra: PhaseField[] = []): OperationPhase => ({
  seq: 10, phaseCode: `${prefix}-P01`, phaseName: '前清场', phaseType: 'PREP',
  required: true, eSign: true, dualReview: false, linkedDoc: '清场检查单',
  photoReq: 'OPTIONAL', scanReq: 'EQUIP', timeoutMin: 15,
  remark: '确认设备台面/内部无上批遗留产品；确认上一批工序转移单已转移；确认本批实物与工序转移单一致',
  fields: [
    { code: `${prefix}_pre1`, name: '清场完成确认', dataType: 'Boolean' as FieldDataType, required: true, stdValue: 'TRUE', inputType: 'SELECT' as FieldInputType },
    { code: `${prefix}_pre2`, name: '设备点检结果', dataType: 'Enum' as FieldDataType, required: true, stdValue: '正常', inputType: 'SELECT' as FieldInputType },
    { code: `${prefix}_pre3`, name: '量具校准状态', dataType: 'Boolean' as FieldDataType, required: true, stdValue: 'TRUE', inputType: 'SELECT' as FieldInputType },
    { code: `${prefix}_pre4`, name: '清场完成时间', dataType: 'DateTime' as FieldDataType, required: true, inputType: 'AUTO' as FieldInputType },
    ...extra,
  ],
});

const mkLoad = (prefix: string, materialName: string, extra: PhaseField[] = []): OperationPhase => ({
  seq: 20, phaseCode: `${prefix}-P02`, phaseName: '物料一致确认', phaseType: 'LOAD',
  required: true, eSign: false, dualReview: false, linkedDoc: '工序转移单',
  scanReq: 'MATERIAL',
  remark: `确认来料与工序转移单一致：${materialName}`,
  fields: [
    { code: `${prefix}_loa1`, name: `${materialName}批号`, dataType: 'String' as FieldDataType, required: true, inputType: 'SCAN' as FieldInputType, remark: '扫码或手工填写' },
    { code: `${prefix}_loa2`, name: '来料数量', dataType: 'Int' as FieldDataType, required: true, unit: '件', inputType: 'MANUAL' as FieldInputType },
    { code: `${prefix}_loa3`, name: '物料外观确认', dataType: 'Enum' as FieldDataType, required: true, stdValue: '合格', inputType: 'SELECT' as FieldInputType },
    { code: `${prefix}_loa4`, name: '确认人', dataType: 'Ref' as FieldDataType, required: true, inputType: 'ESIGN' as FieldInputType },
    ...extra,
  ],
});

const mkReport = (prefix: string): OperationPhase => ({
  seq: 80, phaseCode: `${prefix}-P08`, phaseName: '报工', phaseType: 'HAND',
  required: true, eSign: true, dualReview: false, linkedDoc: '工序报工单',
  remark: '报告：生产日期、工艺参数、生产人员、设备、数量',
  fields: [
    { code: `${prefix}_rpt1`, name: '生产日期', dataType: 'Date' as FieldDataType, required: true, inputType: 'AUTO' as FieldInputType },
    { code: `${prefix}_rpt2`, name: '完工数量', dataType: 'Int' as FieldDataType, required: true, unit: '件', inputType: 'MANUAL' as FieldInputType },
    { code: `${prefix}_rpt3`, name: '不良数量', dataType: 'Int' as FieldDataType, required: true, stdValue: '0', unit: '件', inputType: 'MANUAL' as FieldInputType },
    { code: `${prefix}_rpt4`, name: '设备编号', dataType: 'Ref' as FieldDataType, required: true, inputType: 'SCAN' as FieldInputType },
    { code: `${prefix}_rpt5`, name: '操作人员', dataType: 'Ref' as FieldDataType, required: true, inputType: 'ESIGN' as FieldInputType },
    { code: `${prefix}_rpt6`, name: '报工时间', dataType: 'DateTime' as FieldDataType, required: true, inputType: 'AUTO' as FieldInputType },
  ],
});

const mkCheckout = (prefix: string): OperationPhase => ({
  seq: 90, phaseCode: `${prefix}-P09`, phaseName: '出站', phaseType: 'HAND',
  required: true, eSign: true, dualReview: false, linkedDoc: '工序转移单',
  remark: '核对产品实物与工序转移单一致后，将产品转移到下道工序',
  fields: [
    { code: `${prefix}_out1`, name: '转出数量', dataType: 'Int' as FieldDataType, required: true, unit: '件', inputType: 'MANUAL' as FieldInputType },
    { code: `${prefix}_out2`, name: '工序转移单号', dataType: 'String' as FieldDataType, required: true, inputType: 'AUTO' as FieldInputType },
    { code: `${prefix}_out3`, name: '交出人', dataType: 'Ref' as FieldDataType, required: true, inputType: 'ESIGN' as FieldInputType },
    { code: `${prefix}_out4`, name: '出站时间', dataType: 'DateTime' as FieldDataType, required: true, inputType: 'AUTO' as FieldInputType },
  ],
});

const mkClean = (prefix: string): OperationPhase => ({
  seq: 70, phaseCode: `${prefix}-P07`, phaseName: '后清场', phaseType: 'CLEAN',
  required: true, eSign: false, dualReview: false,
  remark: '清理工作台和设备台面的本批次产品，确认无残留；不合格品、废料分类隔离标识',
  fields: [
    { code: `${prefix}_cln1`, name: '后清场完成确认', dataType: 'Boolean' as FieldDataType, required: true, stdValue: 'TRUE', inputType: 'SELECT' as FieldInputType },
    { code: `${prefix}_cln2`, name: '废料处理结果', dataType: 'Enum' as FieldDataType, required: true, stdValue: '已清理', inputType: 'SELECT' as FieldInputType },
    { code: `${prefix}_cln3`, name: '不合格品标识', dataType: 'Enum' as FieldDataType, required: true, stdValue: '已标识', inputType: 'SELECT' as FieldInputType },
    { code: `${prefix}_cln4`, name: '清场人员', dataType: 'Ref' as FieldDataType, required: true, inputType: 'ESIGN' as FieldInputType },
  ],
});

// ── op-011  机床成型（镍钛丝→粗坯）
export const OP_JC_001: Operation = {
  id: 'op-011', opCode: 'OP-JC-001', opName: '机床成型', opShort: '成型',
  category: 'PROD', workshop: '精密加工车间', productLine: '根管锉B线',
  workCenter: 'WC-GRIND-01', equipType: '数控五轴磨床',
  stdTimeMin: 5.0, prepTimeMin: 30,
  hasFirstPiece: true, hasLastPiece: true, hasPatrol: true, patrolFreq: 50, hasCleanup: true,
  envReq: '温度 20±2℃，相对湿度 45~65%，防振',
  isBottleneck: true, isReportPoint: true, isQcPoint: true,
  status: 'ACTIVE', version: 'V1.0', effectDate: '2026-04-01',
  createdBy: '工艺工程师', updatedAt: '2026-04-01',
  remark: '镍钛丝机床成型，瓶颈工序，尺寸精度关键控制点',
  // ── 阶段配置（按截图：5个阶段，24个字段）────────────────────────────
  // S1前清场(4字段) S2数据采集(6字段) S3后清场(4字段) S4报工(6字段) S5出站(4字段)
  phases: [
    // ── S1 前清场（生产准备 · 必做 · 签名 · PRE_CLEAN）────────────
    {
      seq: 10, phaseCode: 'JC-P01', phaseName: '前清场', phaseType: 'PREP',
      required: true, eSign: true, dualReview: false, linkedDoc: '清场检查单',
      photoReq: 'OPTIONAL', scanReq: 'EQUIP', timeoutMin: 15,
      remark: '环境复核：确认设备台面、内部无上批遗留产品；设备：确认设备急停/安全门完好有效；确认上一批工序转移单已转移；确认本批实物与工序转移单一致',
      fields: [
        { code: 'JC_pre1', name: '清场完成确认', dataType: 'Boolean' as FieldDataType, required: true, stdValue: 'TRUE', inputType: 'SELECT' as FieldInputType, remark: '确认设备台面及内部无上批遗留产品' },
        { code: 'JC_pre2', name: '设备点检结果', dataType: 'Enum' as FieldDataType, required: true, stdValue: '正常', inputType: 'SELECT' as FieldInputType, remark: '确认设备急停/安全门完好有效' },
        { code: 'JC_pre3', name: '量具校准状态', dataType: 'Boolean' as FieldDataType, required: true, stdValue: 'TRUE', inputType: 'SELECT' as FieldInputType },
        { code: 'JC_pre4', name: '清场完成时间', dataType: 'DateTime' as FieldDataType, required: true, inputType: 'AUTO' as FieldInputType },
      ],
    },
    // ── S2 数据采集（加工执行 · 必做 · DATA_COLLECT）────────────────
    {
      seq: 20, phaseCode: 'JC-P02', phaseName: '数据采集', phaseType: 'EXEC',
      required: true, eSign: false, dualReview: false, linkedDoc: '加工过程记录',
      remark: '生产员工自己抽检的数据，并能体现出使用的检测设备的编号和名称；记录加工参数：主轴转速、进给速度、磨削深度、冷却液浓度',
      fields: [
        { code: 'JC_dc1', name: '检测设备编号', dataType: 'Ref' as FieldDataType, required: true, inputType: 'SCAN' as FieldInputType, remark: '扫码录入检测设备编号' },
        { code: 'JC_dc2', name: '检测设备名称', dataType: 'String' as FieldDataType, required: true, inputType: 'AUTO' as FieldInputType, remark: '关联设备名称自动带出' },
        { code: 'JC_dc3', name: '主轴转速', dataType: 'Int' as FieldDataType, required: true, stdValue: '3500~4500', unit: 'rpm', inputType: 'MANUAL' as FieldInputType },
        { code: 'JC_dc4', name: '进给速度', dataType: 'Decimal' as FieldDataType, required: true, stdValue: '0.05~0.20', unit: 'mm/min', inputType: 'MANUAL' as FieldInputType },
        { code: 'JC_dc5', name: '抽检数量', dataType: 'Int' as FieldDataType, required: true, unit: '件', inputType: 'MANUAL' as FieldInputType },
        { code: 'JC_dc6', name: '抽检结果', dataType: 'Enum' as FieldDataType, required: true, stdValue: '合格', inputType: 'SELECT' as FieldInputType },
      ],
    },
    // ── S3 后清场（清场清扫 · 必做 · POST_CLEAN）────────────────────
    {
      seq: 30, phaseCode: 'JC-P03', phaseName: '后清场', phaseType: 'CLEAN',
      required: true, eSign: false, dualReview: false,
      remark: '物料与产品：清理本批次的产品，标识并按流程转移；不合格品、废料、尾料分类、标识清理出现场',
      fields: [
        { code: 'JC_cln1', name: '后清场完成确认', dataType: 'Boolean' as FieldDataType, required: true, stdValue: 'TRUE', inputType: 'SELECT' as FieldInputType },
        { code: 'JC_cln2', name: '废料/尾料处理', dataType: 'Enum' as FieldDataType, required: true, stdValue: '已分类清理', inputType: 'SELECT' as FieldInputType, remark: '废料、尾料分类标识清理出现场' },
        { code: 'JC_cln3', name: '不合格品标识', dataType: 'Enum' as FieldDataType, required: true, stdValue: '已标识隔离', inputType: 'SELECT' as FieldInputType },
        { code: 'JC_cln4', name: '清场人员', dataType: 'Ref' as FieldDataType, required: true, inputType: 'ESIGN' as FieldInputType },
      ],
    },
    // ── S4 报工（工序交接 · 必做 · 签名）────────────────────────────
    {
      seq: 40, phaseCode: 'JC-P04', phaseName: '报工', phaseType: 'HAND',
      required: true, eSign: true, dualReview: false, linkedDoc: '工序报工单',
      remark: '生产日期、工艺参数、生产人员、设备、数量',
      fields: [
        { code: 'JC_rpt1', name: '生产日期', dataType: 'Date' as FieldDataType, required: true, inputType: 'AUTO' as FieldInputType },
        { code: 'JC_rpt2', name: '工艺参数确认', dataType: 'Enum' as FieldDataType, required: true, stdValue: '符合', inputType: 'SELECT' as FieldInputType, remark: '主轴转速、进给速度等工艺参数符合要求' },
        { code: 'JC_rpt3', name: '完工数量', dataType: 'Int' as FieldDataType, required: true, unit: '件', inputType: 'MANUAL' as FieldInputType },
        { code: 'JC_rpt4', name: '不良数量', dataType: 'Int' as FieldDataType, required: true, stdValue: '0', unit: '件', inputType: 'MANUAL' as FieldInputType },
        { code: 'JC_rpt5', name: '设备编号', dataType: 'Ref' as FieldDataType, required: true, inputType: 'SCAN' as FieldInputType },
        { code: 'JC_rpt6', name: '操作人员', dataType: 'Ref' as FieldDataType, required: true, inputType: 'ESIGN' as FieldInputType },
      ],
    },
    // ── S5 出站（工序交接 · 必做 · 签名 · CHECK_OUT）────────────────
    {
      seq: 50, phaseCode: 'JC-P05', phaseName: '出站', phaseType: 'HAND',
      required: true, eSign: true, dualReview: false, linkedDoc: '工序转移单',
      remark: '核对产品实物与工序转移单一致后，将产品转移到下道工序（清洗一）',
      fields: [
        { code: 'JC_out1', name: '转出数量', dataType: 'Int' as FieldDataType, required: true, unit: '件', inputType: 'MANUAL' as FieldInputType },
        { code: 'JC_out2', name: '工序转移单号', dataType: 'String' as FieldDataType, required: true, inputType: 'AUTO' as FieldInputType },
        { code: 'JC_out3', name: '交出人', dataType: 'Ref' as FieldDataType, required: true, inputType: 'ESIGN' as FieldInputType },
        { code: 'JC_out4', name: '出站时间', dataType: 'DateTime' as FieldDataType, required: true, inputType: 'AUTO' as FieldInputType },
      ],
    },
  ],
};

// ── op-012  清洗一（超声波清洗）
export const OP_QX1_001: Operation = {
  id: 'op-012', opCode: 'OP-QX1-001', opName: '清洗一', opShort: '清洗一',
  category: 'PROD', workshop: '清洗车间', productLine: '根管锉B线',
  workCenter: 'WC-CLEAN-01', equipType: '超声波清洗机',
  stdTimeMin: 1.5, prepTimeMin: 15,
  hasFirstPiece: true, hasLastPiece: false, hasPatrol: false, hasCleanup: true,
  envReq: '万级洁净区',
  isBottleneck: false, isReportPoint: true, isQcPoint: false,
  status: 'ACTIVE', version: 'V1.0', effectDate: '2026-04-01',
  createdBy: '工艺工程师', updatedAt: '2026-04-01',
  remark: '机床成型后超声波清洗，去除切削液和金属碎屑',
  // ── 阶段配置（按截图：7个阶段，42个字段）────────────────────────────
  // S1前清场(5字段) S2物料一致确认(5字段) S3首件确认(9字段) S4数据采集(9字段)
  // S5后清场(4字段) S6报工(6字段) S7出站(4字段)
  phases: [
    // ── S1 前清场（生产准备 · 必做 · 签名 · PRE_CLEAN）────────────────
    {
      seq: 10, phaseCode: 'QX1-P01', phaseName: '前清场', phaseType: 'PREP',
      required: true, eSign: true, dualReview: false, linkedDoc: '清场检查单',
      photoReq: 'OPTIONAL', scanReq: 'EQUIP', timeoutMin: 15,
      remark: '确认设备台面、内部无上批遗留产品；确认上一批产品工序转移单已转移；确认本批产品实物与工序转移产品信息一致',
      fields: [
        { code: 'QX1_pre1', name: '清场完成确认', dataType: 'Boolean' as FieldDataType, required: true, stdValue: 'TRUE', inputType: 'SELECT' as FieldInputType, remark: '确认设备台面及内部无上批遗留产品' },
        { code: 'QX1_pre2', name: '设备点检结果', dataType: 'Enum' as FieldDataType, required: true, stdValue: '正常', inputType: 'SELECT' as FieldInputType, remark: '确认设备急停/安全门完好有效' },
        { code: 'QX1_pre3', name: '量具校准状态', dataType: 'Boolean' as FieldDataType, required: true, stdValue: 'TRUE', inputType: 'SELECT' as FieldInputType },
        { code: 'QX1_pre4', name: '清洗液有效期确认', dataType: 'Boolean' as FieldDataType, required: true, stdValue: 'TRUE', inputType: 'SELECT' as FieldInputType, remark: '确认清洗液在有效期内' },
        { code: 'QX1_pre5', name: '清场完成时间', dataType: 'DateTime' as FieldDataType, required: true, inputType: 'AUTO' as FieldInputType },
      ],
    },
    // ── S2 物料一致确认（上料核对 · 必做 · MAT_VERIFY）───────────────
    {
      seq: 20, phaseCode: 'QX1-P02', phaseName: '物料一致确认', phaseType: 'LOAD',
      required: true, eSign: false, dualReview: false, linkedDoc: '工序转移单',
      scanReq: 'MATERIAL',
      remark: '确认来料与工序转移单一致：上料核对镍钛丝半成品批号和数量',
      fields: [
        { code: 'QX1_loa1', name: '工序转移单号', dataType: 'String' as FieldDataType, required: true, inputType: 'SCAN' as FieldInputType, remark: '扫码录入工序转移单号' },
        { code: 'QX1_loa2', name: '来料批号', dataType: 'String' as FieldDataType, required: true, inputType: 'SCAN' as FieldInputType, remark: '扫码或手工填写镍钛丝批号' },
        { code: 'QX1_loa3', name: '来料数量', dataType: 'Int' as FieldDataType, required: true, unit: '件', inputType: 'MANUAL' as FieldInputType },
        { code: 'QX1_loa4', name: '物料外观确认', dataType: 'Enum' as FieldDataType, required: true, stdValue: '合格', inputType: 'SELECT' as FieldInputType, remark: '确认来料无明显损伤' },
        { code: 'QX1_loa5', name: '确认人', dataType: 'Ref' as FieldDataType, required: true, inputType: 'ESIGN' as FieldInputType },
      ],
    },
    // ── S3 首件确认（过程检验 · 必做 · 签名 · 双人 · FIRST_PIECE）────
    {
      seq: 30, phaseCode: 'QX1-P03', phaseName: '首件确认', phaseType: 'IPQC',
      required: true, eSign: true, dualReview: true, linkedDoc: '首件检验单',
      photoReq: 'OPTIONAL', timeoutMin: 20,
      remark: '清洗后首件外观检查：确认清洗效果，无切削液残留、无金属碎屑，外观完好',
      fields: [
        { code: 'QX1_fp1', name: '清洗效果确认', dataType: 'Enum' as FieldDataType, required: true, stdValue: '合格', inputType: 'SELECT' as FieldInputType, remark: '确认切削液和金属碎屑已完全去除' },
        { code: 'QX1_fp2', name: '外观检查', dataType: 'Enum' as FieldDataType, required: true, stdValue: '合格', inputType: 'SELECT' as FieldInputType, remark: '无损伤、无变形、无异物附着' },
        { code: 'QX1_fp3', name: '超声频率', dataType: 'Int' as FieldDataType, required: true, stdValue: '40', unit: 'kHz', inputType: 'MANUAL' as FieldInputType },
        { code: 'QX1_fp4', name: '清洗温度', dataType: 'Decimal' as FieldDataType, required: true, stdValue: '45~55', unit: '℃', inputType: 'AUTO' as FieldInputType },
        { code: 'QX1_fp5', name: '清洗时间', dataType: 'Int' as FieldDataType, required: true, stdValue: '10~15', unit: 'min', inputType: 'MANUAL' as FieldInputType },
        { code: 'QX1_fp6', name: '首件抽检数量', dataType: 'Int' as FieldDataType, required: true, unit: '件', inputType: 'MANUAL' as FieldInputType },
        { code: 'QX1_fp7', name: '首件判定', dataType: 'Enum' as FieldDataType, required: true, stdValue: '合格/不合格', inputType: 'SELECT' as FieldInputType },
        { code: 'QX1_fp8', name: '检验员', dataType: 'Ref' as FieldDataType, required: true, inputType: 'ESIGN' as FieldInputType },
        { code: 'QX1_fp9', name: '复核员', dataType: 'Ref' as FieldDataType, required: true, inputType: 'ESIGN' as FieldInputType },
      ],
    },
    // ── S4 数据采集（加工执行 · 必做 · DATA_COLLECT）─────────────────
    {
      seq: 40, phaseCode: 'QX1-P04', phaseName: '数据采集', phaseType: 'EXEC',
      required: true, eSign: false, dualReview: false, linkedDoc: '清洗过程记录',
      remark: '记录清洗过程参数：超声频率、清洗温度、清洗时间；记录完工/不良数量',
      fields: [
        { code: 'QX1_dc1', name: '设备编号', dataType: 'Ref' as FieldDataType, required: true, inputType: 'SCAN' as FieldInputType, remark: '扫码录入超声波清洗机编号' },
        { code: 'QX1_dc2', name: '设备名称', dataType: 'String' as FieldDataType, required: true, inputType: 'AUTO' as FieldInputType, remark: '关联设备名称自动带出' },
        { code: 'QX1_dc3', name: '超声频率', dataType: 'Int' as FieldDataType, required: true, stdValue: '40', unit: 'kHz', inputType: 'MANUAL' as FieldInputType },
        { code: 'QX1_dc4', name: '清洗温度', dataType: 'Decimal' as FieldDataType, required: true, stdValue: '45~55', unit: '℃', inputType: 'AUTO' as FieldInputType },
        { code: 'QX1_dc5', name: '清洗时间', dataType: 'Int' as FieldDataType, required: true, stdValue: '10~15', unit: 'min', inputType: 'MANUAL' as FieldInputType },
        { code: 'QX1_dc6', name: '清洗液有效期', dataType: 'Date' as FieldDataType, required: true, inputType: 'MANUAL' as FieldInputType },
        { code: 'QX1_dc7', name: '计划产量', dataType: 'Int' as FieldDataType, required: true, unit: '件', inputType: 'MANUAL' as FieldInputType },
        { code: 'QX1_dc8', name: '实际产量', dataType: 'Int' as FieldDataType, required: true, unit: '件', inputType: 'MANUAL' as FieldInputType },
        { code: 'QX1_dc9', name: '不良数量', dataType: 'Int' as FieldDataType, required: true, stdValue: '0', unit: '件', inputType: 'MANUAL' as FieldInputType },
      ],
    },
    // ── S5 后清场（清场清洁 · 必做 · POST_CLEAN）─────────────────────
    {
      seq: 50, phaseCode: 'QX1-P05', phaseName: '后清场', phaseType: 'CLEAN',
      required: true, eSign: false, dualReview: false,
      remark: '清理工作台和设备里面的本批次产品，确认无残留；核对产品实物与工序转移单产品信息一致后，将产品与工序转移单按流程转移到下道工序',
      fields: [
        { code: 'QX1_cln1', name: '后清场完成确认', dataType: 'Boolean' as FieldDataType, required: true, stdValue: 'TRUE', inputType: 'SELECT' as FieldInputType, remark: '确认设备内无本批次产品残留' },
        { code: 'QX1_cln2', name: '产品转移状态', dataType: 'Enum' as FieldDataType, required: true, stdValue: '已转移', inputType: 'SELECT' as FieldInputType, remark: '核对产品实物与工序转移单信息一致后转移' },
        { code: 'QX1_cln3', name: '不合格品标识', dataType: 'Enum' as FieldDataType, required: true, stdValue: '已标识隔离', inputType: 'SELECT' as FieldInputType },
        { code: 'QX1_cln4', name: '清场人员', dataType: 'Ref' as FieldDataType, required: true, inputType: 'ESIGN' as FieldInputType },
      ],
    },
    // ── S6 报工（工序交接 · 必做 · 签名 · CHECK_OUT）────────────────
    {
      seq: 60, phaseCode: 'QX1-P06', phaseName: '报工', phaseType: 'HAND',
      required: true, eSign: true, dualReview: false, linkedDoc: '工序报工单',
      remark: '生产日期、工艺参数、生产人员、设备、数量',
      fields: [
        { code: 'QX1_rpt1', name: '生产日期', dataType: 'Date' as FieldDataType, required: true, inputType: 'AUTO' as FieldInputType },
        { code: 'QX1_rpt2', name: '工艺参数确认', dataType: 'Enum' as FieldDataType, required: true, stdValue: '符合', inputType: 'SELECT' as FieldInputType, remark: '超声频率、清洗温度等工艺参数符合要求' },
        { code: 'QX1_rpt3', name: '完工数量', dataType: 'Int' as FieldDataType, required: true, unit: '件', inputType: 'MANUAL' as FieldInputType },
        { code: 'QX1_rpt4', name: '不良数量', dataType: 'Int' as FieldDataType, required: true, stdValue: '0', unit: '件', inputType: 'MANUAL' as FieldInputType },
        { code: 'QX1_rpt5', name: '设备编号', dataType: 'Ref' as FieldDataType, required: true, inputType: 'SCAN' as FieldInputType },
        { code: 'QX1_rpt6', name: '操作人员', dataType: 'Ref' as FieldDataType, required: true, inputType: 'ESIGN' as FieldInputType },
      ],
    },
    // ── S7 出站（工序交接 · 必做 · 签名 · CHECK_OUT）────────────────
    {
      seq: 70, phaseCode: 'QX1-P07', phaseName: '出站', phaseType: 'HAND',
      required: true, eSign: true, dualReview: false, linkedDoc: '工序转移单',
      remark: '核对产品实物与工序转移单一致后，将产品转移到下道工序',
      fields: [
        { code: 'QX1_out1', name: '转出数量', dataType: 'Int' as FieldDataType, required: true, unit: '件', inputType: 'MANUAL' as FieldInputType },
        { code: 'QX1_out2', name: '工序转移单号', dataType: 'String' as FieldDataType, required: true, inputType: 'AUTO' as FieldInputType },
        { code: 'QX1_out3', name: '交出人', dataType: 'Ref' as FieldDataType, required: true, inputType: 'ESIGN' as FieldInputType },
        { code: 'QX1_out4', name: '出站时间', dataType: 'DateTime' as FieldDataType, required: true, inputType: 'AUTO' as FieldInputType },
      ],
    },
  ],
};

// ── op-013  尾部修整
export const OP_WBX_001: Operation = {
  id: 'op-013', opCode: 'OP-WBX-001', opName: '尾部修整', opShort: '尾修',
  category: 'PROD', workshop: '精密加工车间', productLine: '根管锉B线',
  workCenter: 'WC-GRIND-01', equipType: '数控四轴磨床',
  stdTimeMin: 2.0, prepTimeMin: 20,
  hasFirstPiece: false, hasLastPiece: false, hasPatrol: false, hasCleanup: true,
  isBottleneck: false, isReportPoint: true, isQcPoint: false,
  status: 'ACTIVE', version: 'V1.0', effectDate: '2026-04-01',
  createdBy: '工艺工程师', updatedAt: '2026-04-01',
  remark: '修整工件尾部外径与长度至图纸要求',
  // ── 阶段配置（按Excel：5个阶段）────────────────────────────────
  // S1前清场 S2进站 S3后清场 S4报工 S5出站
  phases: [
    // ── S1 前清场（生产准备 · 必做 · 签名 · PRE_CLEAN）──────────────
    {
      seq: 10, phaseCode: 'WBX-P01', phaseName: '前清场', phaseType: 'PREP',
      required: true, eSign: true, dualReview: false, linkedDoc: '清场检查单',
      photoReq: 'OPTIONAL', scanReq: 'EQUIP', timeoutMin: 15,
      remark: '确认设备台面、内部无上批遗留产品；确认上一批产品工序转移单已转移；确认本批产品实物与工序转移产品信息一致',
      fields: [
        { code: 'WBX_pre1', name: '清场完成确认', dataType: 'Boolean' as FieldDataType, required: true, stdValue: 'TRUE', inputType: 'SELECT' as FieldInputType, remark: '确认设备台面及内部无上批遗留产品' },
        { code: 'WBX_pre2', name: '设备点检结果', dataType: 'Enum' as FieldDataType, required: true, stdValue: '正常', inputType: 'SELECT' as FieldInputType, remark: '确认设备急停/安全门完好有效' },
        { code: 'WBX_pre3', name: '量具校准状态', dataType: 'Boolean' as FieldDataType, required: true, stdValue: 'TRUE', inputType: 'SELECT' as FieldInputType },
        { code: 'WBX_pre4', name: '工序转移单核对', dataType: 'Boolean' as FieldDataType, required: true, stdValue: 'TRUE', inputType: 'SELECT' as FieldInputType, remark: '确认上一批工序转移单已转移，本批实物与转移单一致' },
        { code: 'WBX_pre5', name: '清场完成时间', dataType: 'DateTime' as FieldDataType, required: true, inputType: 'AUTO' as FieldInputType },
      ],
    },
    // ── S2 进站（工序交接 · 必做 · CHECK_IN）────────────────────────
    {
      seq: 20, phaseCode: 'WBX-P02', phaseName: '进站', phaseType: 'HAND',
      required: true, eSign: false, dualReview: false, linkedDoc: '工序转移单',
      remark: '确认进站信息：工单号、工序、操作人员、设备',
      fields: [
        { code: 'WBX_in1', name: '工单号', dataType: 'String' as FieldDataType, required: true, inputType: 'SCAN' as FieldInputType, remark: '扫码录入工单号' },
        { code: 'WBX_in2', name: '操作人员', dataType: 'Ref' as FieldDataType, required: true, inputType: 'ESIGN' as FieldInputType },
        { code: 'WBX_in3', name: '设备编号', dataType: 'Ref' as FieldDataType, required: true, inputType: 'SCAN' as FieldInputType },
        { code: 'WBX_in4', name: '进站时间', dataType: 'DateTime' as FieldDataType, required: true, inputType: 'AUTO' as FieldInputType },
      ],
    },
    // ── S3 后清场（清场清洁 · 必做 · POST_CLEAN）─────────────────────
    {
      seq: 30, phaseCode: 'WBX-P03', phaseName: '后清场', phaseType: 'CLEAN',
      required: true, eSign: false, dualReview: false,
      remark: '清理工作台和设备台面的本批次产品，确认无残留；核对产品实物与工序转移单产品信息一致后，将产品与工序转移单按流程转移到下道工序',
      fields: [
        { code: 'WBX_cln1', name: '后清场完成确认', dataType: 'Boolean' as FieldDataType, required: true, stdValue: 'TRUE', inputType: 'SELECT' as FieldInputType, remark: '确认工作台和设备台面无本批次产品残留' },
        { code: 'WBX_cln2', name: '产品转移状态', dataType: 'Enum' as FieldDataType, required: true, stdValue: '已转移', inputType: 'SELECT' as FieldInputType, remark: '核对产品实物与工序转移单信息一致后转移到下道工序' },
        { code: 'WBX_cln3', name: '不合格品标识', dataType: 'Enum' as FieldDataType, required: true, stdValue: '已标识隔离', inputType: 'SELECT' as FieldInputType },
        { code: 'WBX_cln4', name: '清场人员', dataType: 'Ref' as FieldDataType, required: true, inputType: 'ESIGN' as FieldInputType },
      ],
    },
    // ── S4 报工（工序交接 · 必做 · 签名 · REPORT）────────────────────
    {
      seq: 40, phaseCode: 'WBX-P04', phaseName: '报工', phaseType: 'HAND',
      required: true, eSign: true, dualReview: false, linkedDoc: '工序报工单',
      remark: '生产日期、工艺参数、生产人员、设备、数量',
      fields: [
        { code: 'WBX_rpt1', name: '生产日期', dataType: 'Date' as FieldDataType, required: true, inputType: 'AUTO' as FieldInputType },
        { code: 'WBX_rpt2', name: '工艺参数确认', dataType: 'Enum' as FieldDataType, required: true, stdValue: '符合', inputType: 'SELECT' as FieldInputType, remark: '磨削参数等工艺参数符合图纸要求' },
        { code: 'WBX_rpt3', name: '完工数量', dataType: 'Int' as FieldDataType, required: true, unit: '件', inputType: 'MANUAL' as FieldInputType },
        { code: 'WBX_rpt4', name: '不良数量', dataType: 'Int' as FieldDataType, required: true, stdValue: '0', unit: '件', inputType: 'MANUAL' as FieldInputType },
        { code: 'WBX_rpt5', name: '设备编号', dataType: 'Ref' as FieldDataType, required: true, inputType: 'SCAN' as FieldInputType },
        { code: 'WBX_rpt6', name: '操作人员', dataType: 'Ref' as FieldDataType, required: true, inputType: 'ESIGN' as FieldInputType },
      ],
    },
    // ── S5 出站（工序交接 · 必做 · 签名 · CHECK_OUT）────────────────
    {
      seq: 50, phaseCode: 'WBX-P05', phaseName: '出站', phaseType: 'HAND',
      required: true, eSign: true, dualReview: false, linkedDoc: '工序转移单',
      remark: '核对产品实物与工序转移单一致后，将产品转移到下道工序',
      fields: [
        { code: 'WBX_out1', name: '转出数量', dataType: 'Int' as FieldDataType, required: true, unit: '件', inputType: 'MANUAL' as FieldInputType },
        { code: 'WBX_out2', name: '工序转移单号', dataType: 'String' as FieldDataType, required: true, inputType: 'AUTO' as FieldInputType },
        { code: 'WBX_out3', name: '交出人', dataType: 'Ref' as FieldDataType, required: true, inputType: 'ESIGN' as FieldInputType },
        { code: 'WBX_out4', name: '出站时间', dataType: 'DateTime' as FieldDataType, required: true, inputType: 'AUTO' as FieldInputType },
      ],
    },
  ],
};

// ── op-014  尖部修整
export const OP_JPX_001: Operation = {
  id: 'op-014', opCode: 'OP-JPX-001', opName: '尖部修整', opShort: '尖修',
  category: 'PROD', workshop: '精密加工车间', productLine: '根管锉B线',
  workCenter: 'WC-GRIND-01', equipType: '数控五轴磨床',
  stdTimeMin: 3.0, prepTimeMin: 20,
  hasFirstPiece: false, hasLastPiece: false, hasPatrol: false, hasCleanup: true,
  isBottleneck: false, isReportPoint: true, isQcPoint: false,
  status: 'ACTIVE', version: 'V1.0', effectDate: '2026-04-01',
  createdBy: '工艺工程师', updatedAt: '2026-04-01',
  remark: '修整工件尖部至D0要求，控制安全导引角',
  // ── 阶段配置（按Excel：5个阶段）────────────────────────────────
  // S1前清场 S2进站 S3后清场 S4报工 S5出站
  phases: [
    // ── S1 前清场（生产准备 · 必做 · 签名 · PRE_CLEAN）──────────────
    {
      seq: 10, phaseCode: 'JPX-P01', phaseName: '前清场', phaseType: 'PREP',
      required: true, eSign: true, dualReview: false, linkedDoc: '清场检查单',
      photoReq: 'OPTIONAL', scanReq: 'EQUIP', timeoutMin: 15,
      remark: '确认设备和工作台面无上批遗留产品；确认上一批产品工序转移单已转移；确认本批产品实物与工序转移产品信息一致',
      fields: [
        { code: 'JPX_pre1', name: '清场完成确认', dataType: 'Boolean' as FieldDataType, required: true, stdValue: 'TRUE', inputType: 'SELECT' as FieldInputType, remark: '确认设备和工作台面无上批遗留产品' },
        { code: 'JPX_pre2', name: '设备点检结果', dataType: 'Enum' as FieldDataType, required: true, stdValue: '正常', inputType: 'SELECT' as FieldInputType, remark: '确认设备运行状态正常' },
        { code: 'JPX_pre3', name: '量具校准状态', dataType: 'Boolean' as FieldDataType, required: true, stdValue: 'TRUE', inputType: 'SELECT' as FieldInputType },
        { code: 'JPX_pre4', name: '工序转移单核对', dataType: 'Boolean' as FieldDataType, required: true, stdValue: 'TRUE', inputType: 'SELECT' as FieldInputType, remark: '确认上一批工序转移单已转移，本批实物与转移单一致' },
        { code: 'JPX_pre5', name: '清场完成时间', dataType: 'DateTime' as FieldDataType, required: true, inputType: 'AUTO' as FieldInputType },
      ],
    },
    // ── S2 进站（工序交接 · 必做 · CHECK_IN）────────────────────────
    {
      seq: 20, phaseCode: 'JPX-P02', phaseName: '进站', phaseType: 'HAND',
      required: true, eSign: false, dualReview: false, linkedDoc: '工序转移单',
      remark: '确认进站信息：工单号、工序、操作人员、设备',
      fields: [
        { code: 'JPX_in1', name: '工单号', dataType: 'String' as FieldDataType, required: true, inputType: 'SCAN' as FieldInputType, remark: '扫码录入工单号' },
        { code: 'JPX_in2', name: '操作人员', dataType: 'Ref' as FieldDataType, required: true, inputType: 'ESIGN' as FieldInputType },
        { code: 'JPX_in3', name: '设备编号', dataType: 'Ref' as FieldDataType, required: true, inputType: 'SCAN' as FieldInputType },
        { code: 'JPX_in4', name: '进站时间', dataType: 'DateTime' as FieldDataType, required: true, inputType: 'AUTO' as FieldInputType },
      ],
    },
    // ── S3 后清场（清场清洁 · 必做 · POST_CLEAN）─────────────────────
    {
      seq: 30, phaseCode: 'JPX-P03', phaseName: '后清场', phaseType: 'CLEAN',
      required: true, eSign: false, dualReview: false,
      remark: '清理工作台和设备台面的本批次产品，确认无残留；核对产品实物与工序转移单产品信息一致后，将产品与工序转移单按流程转移到下道工序',
      fields: [
        { code: 'JPX_cln1', name: '后清场完成确认', dataType: 'Boolean' as FieldDataType, required: true, stdValue: 'TRUE', inputType: 'SELECT' as FieldInputType, remark: '确认工作台和设备台面无本批次产品残留' },
        { code: 'JPX_cln2', name: '产品转移状态', dataType: 'Enum' as FieldDataType, required: true, stdValue: '已转移', inputType: 'SELECT' as FieldInputType, remark: '核对产品实物与工序转移单信息一致后转移到下道工序' },
        { code: 'JPX_cln3', name: '不合格品标识', dataType: 'Enum' as FieldDataType, required: true, stdValue: '已标识隔离', inputType: 'SELECT' as FieldInputType },
        { code: 'JPX_cln4', name: '清场人员', dataType: 'Ref' as FieldDataType, required: true, inputType: 'ESIGN' as FieldInputType },
      ],
    },
    // ── S4 报工（工序交接 · 必做 · 签名 · REPORT）────────────────────
    {
      seq: 40, phaseCode: 'JPX-P04', phaseName: '报工', phaseType: 'HAND',
      required: true, eSign: true, dualReview: false, linkedDoc: '工序报工单',
      remark: '生产日期、工艺参数、生产人员、设备、数量',
      fields: [
        { code: 'JPX_rpt1', name: '生产日期', dataType: 'Date' as FieldDataType, required: true, inputType: 'AUTO' as FieldInputType },
        { code: 'JPX_rpt2', name: '工艺参数确认', dataType: 'Enum' as FieldDataType, required: true, stdValue: '符合', inputType: 'SELECT' as FieldInputType, remark: '尖端修整工艺参数符合图纸要求' },
        { code: 'JPX_rpt3', name: '完工数量', dataType: 'Int' as FieldDataType, required: true, unit: '件', inputType: 'MANUAL' as FieldInputType },
        { code: 'JPX_rpt4', name: '不良数量', dataType: 'Int' as FieldDataType, required: true, stdValue: '0', unit: '件', inputType: 'MANUAL' as FieldInputType },
        { code: 'JPX_rpt5', name: '设备编号', dataType: 'Ref' as FieldDataType, required: true, inputType: 'SCAN' as FieldInputType },
        { code: 'JPX_rpt6', name: '操作人员', dataType: 'Ref' as FieldDataType, required: true, inputType: 'ESIGN' as FieldInputType },
      ],
    },
    // ── S5 出站（工序交接 · 必做 · 签名 · CHECK_OUT）────────────────
    {
      seq: 50, phaseCode: 'JPX-P05', phaseName: '出站', phaseType: 'HAND',
      required: true, eSign: true, dualReview: false, linkedDoc: '工序转移单',
      remark: '核对产品实物与工序转移单一致后，将产品转移到下道工序',
      fields: [
        { code: 'JPX_out1', name: '转出数量', dataType: 'Int' as FieldDataType, required: true, unit: '件', inputType: 'MANUAL' as FieldInputType },
        { code: 'JPX_out2', name: '工序转移单号', dataType: 'String' as FieldDataType, required: true, inputType: 'AUTO' as FieldInputType },
        { code: 'JPX_out3', name: '交出人', dataType: 'Ref' as FieldDataType, required: true, inputType: 'ESIGN' as FieldInputType },
        { code: 'JPX_out4', name: '出站时间', dataType: 'DateTime' as FieldDataType, required: true, inputType: 'AUTO' as FieldInputType },
      ],
    },
  ],
};

// ── op-015  研磨一
export const OP_YM1_001: Operation = {
  id: 'op-015', opCode: 'OP-YM1-001', opName: '研磨一', opShort: '研磨一',
  category: 'PROD', workshop: '精密加工车间', productLine: '根管锉B线',
  workCenter: 'WC-GRIND-01', equipType: '数控五轴磨床',
  stdTimeMin: 4.5, prepTimeMin: 30,
  hasFirstPiece: true, hasLastPiece: false, hasPatrol: false, hasCleanup: true,
  isBottleneck: false, isReportPoint: true, isQcPoint: true,
  status: 'ACTIVE', version: 'V1.0', effectDate: '2026-04-01',
  createdBy: '工艺工程师', updatedAt: '2026-04-01',
  remark: '切削槽研磨，形成螺旋刃；自检后由QC现场检验，形成独立检验记录，关联检测设备信息',
  // ── 阶段配置（按Excel：9个阶段）────────────────────────────────
  // S1前清场 S2进站 S3物料一致确认 S4首件确认 S5数据采集 S6自检 S7后清场 S8报工 S9出站
  phases: [
    // ── S1 前清场（生产准备 · 必做 · 签名 · PRE_CLEAN）──────────────
    {
      seq: 10, phaseCode: 'YM1-P01', phaseName: '前清场', phaseType: 'PREP',
      required: true, eSign: true, dualReview: false, linkedDoc: '清场检查单',
      photoReq: 'OPTIONAL', scanReq: 'EQUIP', timeoutMin: 15,
      remark: '确认设备台面、内部无上批遗留产品；确认上一批产品工序转移单已转移；确认本批产品实物与工序转移产品信息一致',
      fields: [
        { code: 'YM1_pre1', name: '清场完成确认', dataType: 'Boolean' as FieldDataType, required: true, stdValue: 'TRUE', inputType: 'SELECT' as FieldInputType, remark: '确认设备台面及内部无上批遗留产品' },
        { code: 'YM1_pre2', name: '设备点检结果', dataType: 'Enum' as FieldDataType, required: true, stdValue: '正常', inputType: 'SELECT' as FieldInputType, remark: '确认设备运行状态正常' },
        { code: 'YM1_pre3', name: '量具校准状态', dataType: 'Boolean' as FieldDataType, required: true, stdValue: 'TRUE', inputType: 'SELECT' as FieldInputType },
        { code: 'YM1_pre4', name: '工序转移单核对', dataType: 'Boolean' as FieldDataType, required: true, stdValue: 'TRUE', inputType: 'SELECT' as FieldInputType, remark: '确认上一批工序转移单已转移，本批实物与转移单一致' },
        { code: 'YM1_pre5', name: '清场完成时间', dataType: 'DateTime' as FieldDataType, required: true, inputType: 'AUTO' as FieldInputType },
      ],
    },
    // ── S2 进站（工序交接 · 必做 · CHECK_IN）────────────────────────
    {
      seq: 20, phaseCode: 'YM1-P02', phaseName: '进站', phaseType: 'HAND',
      required: true, eSign: false, dualReview: false, linkedDoc: '工序转移单',
      remark: '确认进站信息：工单号、工序、操作人员、设备',
      fields: [
        { code: 'YM1_in1', name: '工单号', dataType: 'String' as FieldDataType, required: true, inputType: 'SCAN' as FieldInputType, remark: '扫码录入工单号' },
        { code: 'YM1_in2', name: '操作人员', dataType: 'Ref' as FieldDataType, required: true, inputType: 'ESIGN' as FieldInputType },
        { code: 'YM1_in3', name: '设备编号', dataType: 'Ref' as FieldDataType, required: true, inputType: 'SCAN' as FieldInputType },
        { code: 'YM1_in4', name: '进站时间', dataType: 'DateTime' as FieldDataType, required: true, inputType: 'AUTO' as FieldInputType },
      ],
    },
    // ── S3 物料一致确认（上料核对 · 必做 · MAT_VERIFY）─────────────
    {
      seq: 30, phaseCode: 'YM1-P03', phaseName: '物料一致确认', phaseType: 'LOAD',
      required: true, eSign: false, dualReview: false, linkedDoc: '工序转移单',
      scanReq: 'MATERIAL',
      remark: '确认来料与工序转移单一致：核对半成品批号和数量',
      fields: [
        { code: 'YM1_loa1', name: '工序转移单号', dataType: 'String' as FieldDataType, required: true, inputType: 'SCAN' as FieldInputType, remark: '扫码录入工序转移单号' },
        { code: 'YM1_loa2', name: '来料批号', dataType: 'String' as FieldDataType, required: true, inputType: 'SCAN' as FieldInputType, remark: '扫码或手工填写半成品批号' },
        { code: 'YM1_loa3', name: '来料数量', dataType: 'Int' as FieldDataType, required: true, unit: '件', inputType: 'MANUAL' as FieldInputType },
        { code: 'YM1_loa4', name: '物料外观确认', dataType: 'Enum' as FieldDataType, required: true, stdValue: '合格', inputType: 'SELECT' as FieldInputType, remark: '确认来料无明显损伤' },
        { code: 'YM1_loa5', name: '确认人', dataType: 'Ref' as FieldDataType, required: true, inputType: 'ESIGN' as FieldInputType },
      ],
    },
    // ── S4 首件确认（过程检验 · 必做 · 签名 · FIRST_PIECE）──────────
    {
      seq: 40, phaseCode: 'YM1-P04', phaseName: '首件确认', phaseType: 'IPQC',
      required: true, eSign: true, dualReview: false, linkedDoc: '首件检验单',
      photoReq: 'OPTIONAL', timeoutMin: 20,
      remark: '研磨首件检验：确认切削槽形态、螺纹节距、刃深符合图纸要求',
      fields: [
        { code: 'YM1_fp1', name: '螺纹节距', dataType: 'Decimal' as FieldDataType, required: true, unit: 'mm', instrument: '投影仪', inputType: 'MANUAL' as FieldInputType },
        { code: 'YM1_fp2', name: '刃深（槽深）', dataType: 'Decimal' as FieldDataType, required: true, unit: 'mm', instrument: '投影仪', inputType: 'MANUAL' as FieldInputType },
        { code: 'YM1_fp3', name: '外观检查', dataType: 'Enum' as FieldDataType, required: true, stdValue: '合格', instrument: '目视/放大镜', inputType: 'SELECT' as FieldInputType, remark: '无毛刺、无崩刃' },
        { code: 'YM1_fp4', name: '首件判定', dataType: 'Enum' as FieldDataType, required: true, stdValue: '合格/不合格', inputType: 'SELECT' as FieldInputType },
        { code: 'YM1_fp5', name: '检验员', dataType: 'Ref' as FieldDataType, required: true, inputType: 'ESIGN' as FieldInputType },
      ],
    },
    // ── S5 数据采集（加工执行 · 必做 · DATA_COLLECT）─────────────────
    {
      seq: 50, phaseCode: 'YM1-P05', phaseName: '数据采集', phaseType: 'EXEC',
      required: true, eSign: false, dualReview: false, linkedDoc: '加工过程记录',
      remark: '记录研磨加工工艺参数：设备编号、砂轮规格、主轴转速、进给速度；采集完工/不良数量',
      fields: [
        { code: 'YM1_dc1', name: '设备编号', dataType: 'Ref' as FieldDataType, required: true, inputType: 'SCAN' as FieldInputType, remark: '扫码录入磨床编号' },
        { code: 'YM1_dc2', name: '设备名称', dataType: 'String' as FieldDataType, required: true, inputType: 'AUTO' as FieldInputType, remark: '关联设备名称自动带出' },
        { code: 'YM1_dc3', name: '砂轮规格', dataType: 'String' as FieldDataType, required: true, inputType: 'SELECT' as FieldInputType },
        { code: 'YM1_dc4', name: '主轴转速', dataType: 'Int' as FieldDataType, required: true, stdValue: '3200~4000', unit: 'rpm', inputType: 'MANUAL' as FieldInputType },
        { code: 'YM1_dc5', name: '进给速度', dataType: 'Decimal' as FieldDataType, required: true, stdValue: '0.08~0.15', unit: 'mm/min', inputType: 'MANUAL' as FieldInputType },
        { code: 'YM1_dc6', name: '计划产量', dataType: 'Int' as FieldDataType, required: true, unit: '件', inputType: 'MANUAL' as FieldInputType },
        { code: 'YM1_dc7', name: '实际产量', dataType: 'Int' as FieldDataType, required: true, unit: '件', inputType: 'MANUAL' as FieldInputType },
        { code: 'YM1_dc8', name: '不良数量', dataType: 'Int' as FieldDataType, required: true, stdValue: '0', unit: '件', inputType: 'MANUAL' as FieldInputType },
      ],
    },
    // ── S6 自检（现场QC检验 · 必做 · 签名 · SELF_CHECK）────────────
    // 备注：现场QC检验，先进行报工完工数量，QA检验完成同步合格数量
    // 单独形成《机床成型检验记录》《超声波清洗检验记录》，记录关联检测设备信息
    {
      seq: 60, phaseCode: 'YM1-P06', phaseName: '自检', phaseType: 'IPQC',
      required: true, eSign: true, dualReview: false,
      linkedDoc: '机床成型检验记录',
      remark: '检验项：尺寸、外观。现场QC检验：先进行报工完工数量，QA检验完成后同步合格数量。单独形成检验记录（《机床成型检验记录》《超声波清洗检验记录》），记录须关联检测设备信息',
      fields: [
        { code: 'YM1_sc1', name: '抽检数量', dataType: 'Int' as FieldDataType, required: true, unit: '件', inputType: 'MANUAL' as FieldInputType },
        { code: 'YM1_sc2', name: '螺纹节距', dataType: 'Decimal' as FieldDataType, required: true, unit: 'mm', instrument: '投影仪', inputType: 'MANUAL' as FieldInputType },
        { code: 'YM1_sc3', name: '刃深（槽深）', dataType: 'Decimal' as FieldDataType, required: true, unit: 'mm', instrument: '投影仪', inputType: 'MANUAL' as FieldInputType },
        { code: 'YM1_sc4', name: '外观检查（无毛刺/崩刃）', dataType: 'Enum' as FieldDataType, required: true, stdValue: '合格', instrument: '目视/放大镜', inputType: 'SELECT' as FieldInputType },
        { code: 'YM1_sc5', name: '检测设备编号', dataType: 'Ref' as FieldDataType, required: true, inputType: 'SCAN' as FieldInputType, remark: '关联检测设备信息，体现于检验记录中' },
        { code: 'YM1_sc6', name: '检测设备名称', dataType: 'String' as FieldDataType, required: true, inputType: 'AUTO' as FieldInputType, remark: '关联检测设备名称自动带出' },
        { code: 'YM1_sc7', name: '完工数量（报工）', dataType: 'Int' as FieldDataType, required: true, unit: '件', inputType: 'MANUAL' as FieldInputType, remark: 'QA检验前先填写完工数量' },
        { code: 'YM1_sc8', name: '合格数量（QA回写）', dataType: 'Int' as FieldDataType, required: true, unit: '件', inputType: 'MANUAL' as FieldInputType, remark: 'QA检验完成后同步填写合格数量' },
        { code: 'YM1_sc9', name: 'QC签名', dataType: 'Ref' as FieldDataType, required: true, inputType: 'ESIGN' as FieldInputType },
      ],
    },
    // ── S7 后清场（清场清洁 · 必做 · POST_CLEAN）─────────────────────
    {
      seq: 70, phaseCode: 'YM1-P07', phaseName: '后清场', phaseType: 'CLEAN',
      required: true, eSign: false, dualReview: false,
      remark: '清理工作台和设备台面的本批次产品，确认无残留；核对产品实物与工序转移单产品信息一致后，将产品与工序转移单按流程转移到下道工序',
      fields: [
        { code: 'YM1_cln1', name: '后清场完成确认', dataType: 'Boolean' as FieldDataType, required: true, stdValue: 'TRUE', inputType: 'SELECT' as FieldInputType, remark: '确认工作台和设备台面无本批次产品残留' },
        { code: 'YM1_cln2', name: '产品转移状态', dataType: 'Enum' as FieldDataType, required: true, stdValue: '已转移', inputType: 'SELECT' as FieldInputType, remark: '核对产品实物与工序转移单信息一致后转移到下道工序' },
        { code: 'YM1_cln3', name: '不合格品标识', dataType: 'Enum' as FieldDataType, required: true, stdValue: '已标识隔离', inputType: 'SELECT' as FieldInputType },
        { code: 'YM1_cln4', name: '清场人员', dataType: 'Ref' as FieldDataType, required: true, inputType: 'ESIGN' as FieldInputType },
      ],
    },
    // ── S8 报工（工序交接 · 必做 · 签名 · REPORT）────────────────────
    {
      seq: 80, phaseCode: 'YM1-P08', phaseName: '报工', phaseType: 'HAND',
      required: true, eSign: true, dualReview: false, linkedDoc: '工序报工单',
      remark: '生产日期、工艺参数、生产人员、设备、数量（合格数量待QA检验完成后回写）',
      fields: [
        { code: 'YM1_rpt1', name: '生产日期', dataType: 'Date' as FieldDataType, required: true, inputType: 'AUTO' as FieldInputType },
        { code: 'YM1_rpt2', name: '工艺参数确认', dataType: 'Enum' as FieldDataType, required: true, stdValue: '符合', inputType: 'SELECT' as FieldInputType, remark: '研磨工艺参数符合图纸要求' },
        { code: 'YM1_rpt3', name: '完工数量', dataType: 'Int' as FieldDataType, required: true, unit: '件', inputType: 'MANUAL' as FieldInputType },
        { code: 'YM1_rpt4', name: '不良数量', dataType: 'Int' as FieldDataType, required: true, stdValue: '0', unit: '件', inputType: 'MANUAL' as FieldInputType },
        { code: 'YM1_rpt5', name: '设备编号', dataType: 'Ref' as FieldDataType, required: true, inputType: 'SCAN' as FieldInputType },
        { code: 'YM1_rpt6', name: '操作人员', dataType: 'Ref' as FieldDataType, required: true, inputType: 'ESIGN' as FieldInputType },
      ],
    },
    // ── S9 出站（工序交接 · 必做 · 签名 · CHECK_OUT）────────────────
    {
      seq: 90, phaseCode: 'YM1-P09', phaseName: '出站', phaseType: 'HAND',
      required: true, eSign: true, dualReview: false, linkedDoc: '工序转移单',
      remark: '核对产品实物与工序转移单一致后，将产品转移到下道工序',
      fields: [
        { code: 'YM1_out1', name: '转出数量', dataType: 'Int' as FieldDataType, required: true, unit: '件', inputType: 'MANUAL' as FieldInputType },
        { code: 'YM1_out2', name: '工序转移单号', dataType: 'String' as FieldDataType, required: true, inputType: 'AUTO' as FieldInputType },
        { code: 'YM1_out3', name: '交出人', dataType: 'Ref' as FieldDataType, required: true, inputType: 'ESIGN' as FieldInputType },
        { code: 'YM1_out4', name: '出站时间', dataType: 'DateTime' as FieldDataType, required: true, inputType: 'AUTO' as FieldInputType },
      ],
    },
  ],
};

// ── op-016  热处理（研磨二合并工序）
export const OP_RCL_001: Operation = {
  id: 'op-016', opCode: 'OP-RCL-001', opName: '热处理', opShort: '热处理',
  category: 'SPEC', workshop: '热处理车间', productLine: '根管锉B线',
  workCenter: 'WC-HT-01', equipType: '镍钛丝热处理炉',
  stdTimeMin: 3.0, prepTimeMin: 20,
  hasFirstPiece: false, hasLastPiece: false, hasPatrol: false, hasCleanup: true,
  envReq: '特殊工序，操作人员需持证上岗',
  isBottleneck: true, isReportPoint: true, isQcPoint: true,
  status: 'ACTIVE', version: 'V1.0', effectDate: '2026-04-01',
  createdBy: '工艺工程师', updatedAt: '2026-04-01',
  remark: '镍钛合金热处理定型，后接研磨二（不在MES中体现研磨二独立工序）',
  phases: [
    mkPrep('RCL'),
    {
      seq: 40, phaseCode: 'RCL-P04', phaseName: '数据采集', phaseType: 'EXEC',
      required: true, eSign: true, dualReview: false, linkedDoc: '热处理炉批记录',
      remark: '记录炉批号、温度曲线、时间参数',
      fields: [
        { code: 'rcl_e1', name: '设备编号（炉号）', dataType: 'Ref' as FieldDataType, required: true, inputType: 'SCAN' as FieldInputType },
        { code: 'rcl_e2', name: '炉批号', dataType: 'String' as FieldDataType, required: true, inputType: 'AUTO' as FieldInputType },
        { code: 'rcl_e3', name: '加热温度（Af温度）', dataType: 'Decimal' as FieldDataType, required: true, stdValue: '480~520', unit: '℃', inputType: 'AUTO' as FieldInputType },
        { code: 'rcl_e4', name: '保温时间', dataType: 'Int' as FieldDataType, required: true, stdValue: '15~20', unit: 'min', inputType: 'AUTO' as FieldInputType },
        { code: 'rcl_e5', name: '冷却方式', dataType: 'Enum' as FieldDataType, required: true, stdValue: '水冷', inputType: 'SELECT' as FieldInputType },
        { code: 'rcl_e6', name: '本炉投入数量', dataType: 'Int' as FieldDataType, required: true, unit: '件', inputType: 'MANUAL' as FieldInputType },
        { code: 'rcl_e7', name: '出炉数量', dataType: 'Int' as FieldDataType, required: true, unit: '件', inputType: 'MANUAL' as FieldInputType },
        { code: 'rcl_e8', name: '操作员', dataType: 'Ref' as FieldDataType, required: true, inputType: 'ESIGN' as FieldInputType },
      ],
    },
    {
      seq: 50, phaseCode: 'RCL-P05', phaseName: '特殊工艺确认', phaseType: 'SPEC',
      required: true, eSign: true, dualReview: true, linkedDoc: '特殊工艺记录',
      remark: '热处理特殊工序合规性确认，符合ISO 13485要求',
      fields: [
        { code: 'rcl_s1', name: '温度曲线合规确认', dataType: 'Boolean' as FieldDataType, required: true, stdValue: 'TRUE', inputType: 'SELECT' as FieldInputType },
        { code: 'rcl_s2', name: '操作员资质证书', dataType: 'Ref' as FieldDataType, required: true, inputType: 'SCAN' as FieldInputType },
        { code: 'rcl_s3', name: '主管确认签字', dataType: 'Ref' as FieldDataType, required: true, inputType: 'ESIGN' as FieldInputType },
      ],
    },
    mkClean('RCL'),
    mkReport('RCL'),
    mkCheckout('RCL'),
  ],
};

// ── op-017  清洗（清洗二）
export const OP_QX2_001: Operation = {
  id: 'op-017', opCode: 'OP-QX2-001', opName: '清洗二', opShort: '清洗二',
  category: 'PROD', workshop: '清洗车间', productLine: '根管锉B线',
  workCenter: 'WC-CLEAN-01', equipType: '超声波清洗机',
  stdTimeMin: 1.5, prepTimeMin: 15,
  hasFirstPiece: false, hasLastPiece: false, hasPatrol: false, hasCleanup: true,
  envReq: '万级洁净区',
  isBottleneck: false, isReportPoint: true, isQcPoint: true,
  status: 'ACTIVE', version: 'V1.0', effectDate: '2026-04-01',
  createdBy: '工艺工程师', updatedAt: '2026-04-01',
  remark: '热处理后超声波清洗；QC形成检验记录，此记录不体现在批记录中',
  phases: [
    mkPrep('QX2'),
    {
      seq: 40, phaseCode: 'QX2-P04', phaseName: '数据采集', phaseType: 'EXEC',
      required: true, eSign: false, dualReview: false,
      fields: [
        { code: 'qx2_e1', name: '设备编号', dataType: 'Ref' as FieldDataType, required: true, inputType: 'SCAN' as FieldInputType },
        { code: 'qx2_e2', name: '清洗段数', dataType: 'Int' as FieldDataType, required: true, stdValue: '3', unit: '段', inputType: 'MANUAL' as FieldInputType },
        { code: 'qx2_e3', name: '清洗温度', dataType: 'Decimal' as FieldDataType, required: true, stdValue: '45~55', unit: '℃', inputType: 'AUTO' as FieldInputType },
        { code: 'qx2_e4', name: '完工数量', dataType: 'Int' as FieldDataType, required: true, unit: '件', inputType: 'MANUAL' as FieldInputType },
      ],
    },
    {
      seq: 50, phaseCode: 'QX2-P05', phaseName: '自检', phaseType: 'IPQC',
      required: true, eSign: true, dualReview: false, linkedDoc: '超声波清洗检验记录',
      remark: 'QC进行抽检，形成《超声波清洗检验记录》，关联检测设备；此记录不体现在批记录中',
      fields: [
        { code: 'qx2_p1', name: '抽检数量', dataType: 'Int' as FieldDataType, required: true, unit: '件', inputType: 'MANUAL' as FieldInputType },
        { code: 'qx2_p2', name: '洁净度检测结果', dataType: 'Enum' as FieldDataType, required: true, stdValue: '合格', instrument: '洁净度测试仪', inputType: 'SELECT' as FieldInputType },
        { code: 'qx2_p3', name: '外观检查', dataType: 'Enum' as FieldDataType, required: true, stdValue: '合格', instrument: '目视', inputType: 'SELECT' as FieldInputType },
        { code: 'qx2_p4', name: '检测设备编号', dataType: 'Ref' as FieldDataType, required: true, inputType: 'SCAN' as FieldInputType },
        { code: 'qx2_p5', name: 'QC签名', dataType: 'Ref' as FieldDataType, required: true, inputType: 'ESIGN' as FieldInputType },
      ],
    },
    mkClean('QX2'),
    mkReport('QX2'),
    mkCheckout('QX2'),
  ],
};

// ── op-018  刻线
export const OP_KX_001: Operation = {
  id: 'op-018', opCode: 'OP-KX-001', opName: '刻线', opShort: '刻线',
  category: 'PROD', workshop: '精密加工车间', productLine: '根管锉B线',
  workCenter: 'WC-GRIND-01', equipType: '数控四轴磨床',
  stdTimeMin: 2.0, prepTimeMin: 15,
  hasFirstPiece: true, hasLastPiece: false, hasPatrol: false, hasCleanup: true,
  isBottleneck: false, isReportPoint: true, isQcPoint: false,
  status: 'ACTIVE', version: 'V1.0', effectDate: '2026-04-01',
  createdBy: '工艺工程师', updatedAt: '2026-04-01',
  remark: '工作部深度刻线标识（16mm/19mm/21mm/25mm）',
  phases: [
    mkPrep('KX'),
    mkLoad('KX', '半成品（清洗二后）'),
    {
      seq: 30, phaseCode: 'KX-P03', phaseName: '首件确认', phaseType: 'IPQC',
      required: true, eSign: true, dualReview: false, linkedDoc: '首件检验单',
      remark: '检验刻线尺寸和数量',
      fields: [
        { code: 'kx_f1', name: '刻线位置（16mm）', dataType: 'Decimal' as FieldDataType, required: true, stdValue: '16.0±0.3', unit: 'mm', instrument: '游标卡尺', inputType: 'MANUAL' as FieldInputType },
        { code: 'kx_f2', name: '刻线位置（19mm）', dataType: 'Decimal' as FieldDataType, required: true, stdValue: '19.0±0.3', unit: 'mm', instrument: '游标卡尺', inputType: 'MANUAL' as FieldInputType },
        { code: 'kx_f3', name: '刻线位置（25mm）', dataType: 'Decimal' as FieldDataType, required: true, stdValue: '25.0±0.3', unit: 'mm', instrument: '游标卡尺', inputType: 'MANUAL' as FieldInputType },
        { code: 'kx_f4', name: '刻线数量', dataType: 'Int' as FieldDataType, required: true, stdValue: '3', unit: '条', instrument: '目视', inputType: 'MANUAL' as FieldInputType },
        { code: 'kx_f5', name: '刻线深度外观', dataType: 'Enum' as FieldDataType, required: true, stdValue: '清晰可见', instrument: '目视/放大镜', inputType: 'SELECT' as FieldInputType },
        { code: 'kx_f6', name: '首件判定', dataType: 'Enum' as FieldDataType, required: true, stdValue: '合格/不合格', inputType: 'SELECT' as FieldInputType },
        { code: 'kx_f7', name: '检验员', dataType: 'Ref' as FieldDataType, required: true, inputType: 'ESIGN' as FieldInputType },
      ],
    },
    {
      seq: 40, phaseCode: 'KX-P04', phaseName: '数据采集', phaseType: 'EXEC',
      required: true, eSign: false, dualReview: false,
      fields: [
        { code: 'kx_e1', name: '设备编号', dataType: 'Ref' as FieldDataType, required: true, inputType: 'SCAN' as FieldInputType },
        { code: 'kx_e2', name: '刻线工艺参数', dataType: 'String' as FieldDataType, required: true, inputType: 'SELECT' as FieldInputType },
        { code: 'kx_e3', name: '完工数量', dataType: 'Int' as FieldDataType, required: true, unit: '件', inputType: 'MANUAL' as FieldInputType },
        { code: 'kx_e4', name: '不良数量', dataType: 'Int' as FieldDataType, required: true, stdValue: '0', unit: '件', inputType: 'MANUAL' as FieldInputType },
      ],
    },
    mkClean('KX'),
    mkReport('KX'),
    mkCheckout('KX'),
  ],
};

// ── op-019  组装
export const OP_ZZ_001: Operation = {
  id: 'op-019', opCode: 'OP-ZZ-001', opName: '组装', opShort: '组装',
  category: 'PROD', workshop: '组装车间', productLine: '根管锉B线',
  workCenter: 'WC-ASM-01', equipType: '组装台',
  stdTimeMin: 1.0, prepTimeMin: 10,
  hasFirstPiece: true, hasLastPiece: false, hasPatrol: false, hasCleanup: true,
  isBottleneck: false, isReportPoint: true, isQcPoint: true,
  status: 'ACTIVE', version: 'V1.0', effectDate: '2026-04-01',
  createdBy: '工艺工程师', updatedAt: '2026-04-01',
  remark: '锉针与手柄组装，首件确认产品长度及手柄可靠性',
  phases: [
    mkPrep('ZZ'),
    {
      seq: 20, phaseCode: 'ZZ-P02', phaseName: '物料一致确认', phaseType: 'LOAD',
      required: true, eSign: false, dualReview: false, linkedDoc: '领料单',
      remark: '确认手柄物料批号与生产计划一致',
      fields: [
        { code: 'zz_loa1', name: '锉针半成品批号', dataType: 'String' as FieldDataType, required: true, inputType: 'SCAN' as FieldInputType },
        { code: 'zz_loa2', name: '手柄批号', dataType: 'String' as FieldDataType, required: true, inputType: 'SCAN' as FieldInputType },
        { code: 'zz_loa3', name: '手柄颜色（规格标识）', dataType: 'Enum' as FieldDataType, required: true, stdValue: '黄色（#26）', inputType: 'SELECT' as FieldInputType },
        { code: 'zz_loa4', name: '手柄数量', dataType: 'Int' as FieldDataType, required: true, unit: '只', inputType: 'MANUAL' as FieldInputType },
        { code: 'zz_loa5', name: '物料确认人', dataType: 'Ref' as FieldDataType, required: true, inputType: 'ESIGN' as FieldInputType },
      ],
    },
    {
      seq: 30, phaseCode: 'ZZ-P03', phaseName: '首件确认', phaseType: 'IPQC',
      required: true, eSign: true, dualReview: false, linkedDoc: '首件检验单',
      photoReq: 'OPTIONAL', timeoutMin: 15,
      remark: '检验产品总长及手柄连接强度（拉拔力测试）',
      fields: [
        { code: 'zz_f1', name: '产品总长', dataType: 'Decimal' as FieldDataType, required: true, stdValue: '25.0±0.5', unit: 'mm', instrument: '游标卡尺', inputType: 'MANUAL' as FieldInputType },
        { code: 'zz_f2', name: '手柄连接强度（拉拔力）', dataType: 'Decimal' as FieldDataType, required: true, stdValue: '≥5', unit: 'N', instrument: '拉力计', inputType: 'MANUAL' as FieldInputType },
        { code: 'zz_f3', name: '手柄颜色确认', dataType: 'Enum' as FieldDataType, required: true, stdValue: '合格', instrument: '目视', inputType: 'SELECT' as FieldInputType },
        { code: 'zz_f4', name: '组装外观', dataType: 'Enum' as FieldDataType, required: true, stdValue: '合格', instrument: '目视', inputType: 'SELECT' as FieldInputType },
        { code: 'zz_f5', name: '检测设备编号', dataType: 'Ref' as FieldDataType, required: true, inputType: 'SCAN' as FieldInputType },
        { code: 'zz_f6', name: '首件判定', dataType: 'Enum' as FieldDataType, required: true, stdValue: '合格/不合格', inputType: 'SELECT' as FieldInputType },
        { code: 'zz_f7', name: '检验员', dataType: 'Ref' as FieldDataType, required: true, inputType: 'ESIGN' as FieldInputType },
      ],
    },
    {
      seq: 40, phaseCode: 'ZZ-P04', phaseName: '数据采集', phaseType: 'EXEC',
      required: true, eSign: false, dualReview: false,
      fields: [
        { code: 'zz_e1', name: '完工数量', dataType: 'Int' as FieldDataType, required: true, unit: '件', inputType: 'MANUAL' as FieldInputType },
        { code: 'zz_e2', name: '不良数量', dataType: 'Int' as FieldDataType, required: true, stdValue: '0', unit: '件', inputType: 'MANUAL' as FieldInputType },
        { code: 'zz_e3', name: '消耗手柄数量', dataType: 'Int' as FieldDataType, required: true, unit: '只', inputType: 'MANUAL' as FieldInputType },
      ],
    },
    mkClean('ZZ'),
    mkReport('ZZ'),
    mkCheckout('ZZ'),
  ],
};

// ── op-020  环规适配
export const OP_HG_001: Operation = {
  id: 'op-020', opCode: 'OP-HG-001', opName: '环规适配', opShort: '环规',
  category: 'INSP', workshop: '检验室', productLine: '根管锉B线',
  workCenter: 'WC-RING-01', equipType: '环规检验台',
  stdTimeMin: 2.5, prepTimeMin: 10,
  hasFirstPiece: false, hasLastPiece: false, hasPatrol: false, hasCleanup: false,
  isBottleneck: false, isReportPoint: true, isQcPoint: true,
  status: 'ACTIVE', version: 'V1.0', effectDate: '2026-04-01',
  createdBy: '工艺工程师', updatedAt: '2026-04-01',
  remark: '使用标准环规检验工作部锥度精度，确保与ISO 3630-1吻合',
  phases: [
    mkPrep('HG'),
    {
      seq: 40, phaseCode: 'HG-P04', phaseName: '数据采集', phaseType: 'EXEC',
      required: true, eSign: true, dualReview: false, linkedDoc: '环规检验记录',
      remark: '使用标准环规逐件或抽样检验，记录通止规结果',
      fields: [
        { code: 'hg_e1', name: '检测设备编号（环规）', dataType: 'Ref' as FieldDataType, required: true, inputType: 'SCAN' as FieldInputType },
        { code: 'hg_e2', name: '环规校准有效期', dataType: 'Date' as FieldDataType, required: true, inputType: 'MANUAL' as FieldInputType },
        { code: 'hg_e3', name: '抽检数量', dataType: 'Int' as FieldDataType, required: true, unit: '件', inputType: 'MANUAL' as FieldInputType },
        { code: 'hg_e4', name: '通规结果', dataType: 'Enum' as FieldDataType, required: true, stdValue: '全通', inputType: 'SELECT' as FieldInputType },
        { code: 'hg_e5', name: '止规结果', dataType: 'Enum' as FieldDataType, required: true, stdValue: '全止', inputType: 'SELECT' as FieldInputType },
        { code: 'hg_e6', name: '工作部直径D1（mm）', dataType: 'Decimal' as FieldDataType, required: true, stdValue: '0.26±0.02', unit: 'mm', instrument: '环规', inputType: 'MANUAL' as FieldInputType },
        { code: 'hg_e7', name: '锥度适配结果', dataType: 'Enum' as FieldDataType, required: true, stdValue: '合格', inputType: 'SELECT' as FieldInputType },
        { code: 'hg_e8', name: '合格数量', dataType: 'Int' as FieldDataType, required: true, unit: '件', inputType: 'MANUAL' as FieldInputType },
        { code: 'hg_e9', name: '不合格数量', dataType: 'Int' as FieldDataType, required: true, stdValue: '0', unit: '件', inputType: 'MANUAL' as FieldInputType },
        { code: 'hg_e10', name: 'QC签名', dataType: 'Ref' as FieldDataType, required: true, inputType: 'ESIGN' as FieldInputType },
      ],
    },
    mkReport('HG'),
    mkCheckout('HG'),
  ],
};

// ── op-021  测量长度
export const OP_CL_001: Operation = {
  id: 'op-021', opCode: 'OP-CL-001', opName: '测量长度', opShort: '测长度',
  category: 'INSP', workshop: '检验室', productLine: '根管锉B线',
  workCenter: 'WC-QC-01', equipType: '投影仪（万能工具显微镜）',
  stdTimeMin: 1.5, prepTimeMin: 10,
  hasFirstPiece: false, hasLastPiece: false, hasPatrol: false, hasCleanup: false,
  isBottleneck: false, isReportPoint: true, isQcPoint: true,
  status: 'ACTIVE', version: 'V1.0', effectDate: '2026-04-01',
  createdBy: '工艺工程师', updatedAt: '2026-04-01',
  remark: '逐件或抽样测量产品总长与工作部长度，符合ISO 3630-1',
  phases: [
    mkPrep('CL'),
    {
      seq: 40, phaseCode: 'CL-P04', phaseName: '数据采集', phaseType: 'EXEC',
      required: true, eSign: true, dualReview: false, linkedDoc: '长度测量记录',
      fields: [
        { code: 'cl_e1', name: '检测设备编号', dataType: 'Ref' as FieldDataType, required: true, inputType: 'SCAN' as FieldInputType },
        { code: 'cl_e2', name: '抽检数量', dataType: 'Int' as FieldDataType, required: true, unit: '件', inputType: 'MANUAL' as FieldInputType },
        { code: 'cl_e3', name: '产品总长', dataType: 'Decimal' as FieldDataType, required: true, stdValue: '25.0±0.5', unit: 'mm', instrument: '投影仪', inputType: 'MANUAL' as FieldInputType },
        { code: 'cl_e4', name: '工作部长度', dataType: 'Decimal' as FieldDataType, required: true, stdValue: '16.0±0.5', unit: 'mm', instrument: '投影仪', inputType: 'MANUAL' as FieldInputType },
        { code: 'cl_e5', name: '测量结果', dataType: 'Enum' as FieldDataType, required: true, stdValue: '合格', inputType: 'SELECT' as FieldInputType },
        { code: 'cl_e6', name: '合格数量', dataType: 'Int' as FieldDataType, required: true, unit: '件', inputType: 'MANUAL' as FieldInputType },
        { code: 'cl_e7', name: '不合格数量', dataType: 'Int' as FieldDataType, required: true, stdValue: '0', unit: '件', inputType: 'MANUAL' as FieldInputType },
        { code: 'cl_e8', name: 'QC签名', dataType: 'Ref' as FieldDataType, required: true, inputType: 'ESIGN' as FieldInputType },
      ],
    },
    mkReport('CL'),
    mkCheckout('CL'),
  ],
};

// ── op-022  装限位块
export const OP_XWK_001: Operation = {
  id: 'op-022', opCode: 'OP-XWK-001', opName: '装限位块', opShort: '限位块',
  category: 'PROD', workshop: '组装车间', productLine: '根管锉B线',
  workCenter: 'WC-ASM-01', equipType: '组装台',
  stdTimeMin: 0.5, prepTimeMin: 10,
  hasFirstPiece: false, hasLastPiece: false, hasPatrol: false, hasCleanup: true,
  isBottleneck: false, isReportPoint: true, isQcPoint: false,
  status: 'ACTIVE', version: 'V1.0', effectDate: '2026-04-01',
  createdBy: '工艺工程师', updatedAt: '2026-04-01',
  remark: '安装橡胶限位块至规定位置，控制插入深度',
  phases: [
    mkPrep('XWK'),
    {
      seq: 20, phaseCode: 'XWK-P02', phaseName: '物料一致确认', phaseType: 'LOAD',
      required: true, eSign: false, dualReview: false, linkedDoc: '领料单',
      remark: '确认限位块批次号',
      fields: [
        { code: 'xwk_loa1', name: '限位块批次号', dataType: 'String' as FieldDataType, required: true, inputType: 'SCAN' as FieldInputType },
        { code: 'xwk_loa2', name: '限位块规格', dataType: 'Enum' as FieldDataType, required: true, stdValue: 'S码/M码/L码', inputType: 'SELECT' as FieldInputType },
        { code: 'xwk_loa3', name: '领用数量', dataType: 'Int' as FieldDataType, required: true, unit: '个', inputType: 'MANUAL' as FieldInputType },
      ],
    },
    {
      seq: 40, phaseCode: 'XWK-P04', phaseName: '数据采集', phaseType: 'EXEC',
      required: true, eSign: false, dualReview: false,
      fields: [
        { code: 'xwk_e1', name: '完工数量', dataType: 'Int' as FieldDataType, required: true, unit: '件', inputType: 'MANUAL' as FieldInputType },
        { code: 'xwk_e2', name: '不良数量', dataType: 'Int' as FieldDataType, required: true, stdValue: '0', unit: '件', inputType: 'MANUAL' as FieldInputType },
        { code: 'xwk_e3', name: '限位块安装外观', dataType: 'Enum' as FieldDataType, required: true, stdValue: '合格', instrument: '目视', inputType: 'SELECT' as FieldInputType },
      ],
    },
    mkClean('XWK'),
    mkReport('XWK'),
    mkCheckout('XWK'),
  ],
};

// ── op-023  检测合格（IPQC半成品检验）
export const OP_JCHe_001: Operation = {
  id: 'op-023', opCode: 'OP-JCHE-001', opName: '检测合格', opShort: '检测合格',
  category: 'INSP', workshop: '检验室', productLine: '根管锉B线',
  workCenter: 'WC-QC-01', equipType: '综合检验台',
  stdTimeMin: 3.0, prepTimeMin: 10,
  hasFirstPiece: false, hasLastPiece: false, hasPatrol: false, hasCleanup: false,
  isBottleneck: false, isReportPoint: true, isQcPoint: true,
  status: 'ACTIVE', version: 'V1.0', effectDate: '2026-04-01',
  createdBy: '工艺工程师', updatedAt: '2026-04-01',
  remark: '半成品综合检验（尺寸+外观）；AQL抽样方案；关联QC检验记录',
  phases: [
    mkPrep('JCHE'),
    {
      seq: 40, phaseCode: 'JCHE-P04', phaseName: '数据采集', phaseType: 'EXEC',
      required: true, eSign: true, dualReview: false, linkedDoc: '半成品检验记录',
      remark: '逐批检验：外观、尺寸、颜色标识',
      fields: [
        { code: 'jch_e1', name: '检测设备编号', dataType: 'Ref' as FieldDataType, required: true, inputType: 'SCAN' as FieldInputType },
        { code: 'jch_e2', name: '抽检数量（AQL）', dataType: 'Int' as FieldDataType, required: true, unit: '件', inputType: 'MANUAL' as FieldInputType },
        { code: 'jch_e3', name: '总长（mm）', dataType: 'Decimal' as FieldDataType, required: true, stdValue: '25.0±0.5', unit: 'mm', instrument: '游标卡尺', inputType: 'MANUAL' as FieldInputType },
        { code: 'jch_e4', name: '外观检查（无毛刺/崩刃/弯曲）', dataType: 'Enum' as FieldDataType, required: true, stdValue: '合格', instrument: '目视/放大镜', inputType: 'SELECT' as FieldInputType },
        { code: 'jch_e5', name: '颜色标识', dataType: 'Enum' as FieldDataType, required: true, stdValue: '黄色（#26）', instrument: '目视', inputType: 'SELECT' as FieldInputType },
        { code: 'jch_e6', name: '检验批次判定', dataType: 'Enum' as FieldDataType, required: true, stdValue: '合格/不合格', inputType: 'SELECT' as FieldInputType },
        { code: 'jch_e7', name: '合格数量', dataType: 'Int' as FieldDataType, required: true, unit: '件', inputType: 'MANUAL' as FieldInputType },
        { code: 'jch_e8', name: '不合格数量', dataType: 'Int' as FieldDataType, required: true, stdValue: '0', unit: '件', inputType: 'MANUAL' as FieldInputType },
        { code: 'jch_e9', name: 'QC签名', dataType: 'Ref' as FieldDataType, required: true, inputType: 'ESIGN' as FieldInputType },
      ],
    },
    mkReport('JCHE'),
    mkCheckout('JCHE'),
  ],
};

// ── op-024  半成品入库
export const OP_BCR_001: Operation = {
  id: 'op-024', opCode: 'OP-BCR-001', opName: '半成品入库', opShort: '半成品库',
  category: 'PROD', workshop: '仓储', productLine: '根管锉B线',
  workCenter: 'WC-STORE-01', equipType: '仓储货架',
  stdTimeMin: 0.5, prepTimeMin: 5,
  hasFirstPiece: false, hasLastPiece: false, hasPatrol: false, hasCleanup: false,
  isBottleneck: false, isReportPoint: true, isQcPoint: false,
  status: 'ACTIVE', version: 'V1.0', effectDate: '2026-04-01',
  createdBy: '工艺工程师', updatedAt: '2026-04-01',
  remark: '半成品入库前由QC进行最终全维度检验，形成《半成品检验记录》',
  phases: [
    {
      seq: 50, phaseCode: 'BCR-P05', phaseName: '自检（半成品综合检验）', phaseType: 'OQC',
      required: true, eSign: true, dualReview: true, linkedDoc: '半成品检验记录',
      photoReq: 'REQUIRED',
      remark: '现场QC逐批次检验：尺寸、颜色标识、外观、连接强度、抗扭强度、抗弯强度；形成《半成品检验记录》',
      fields: [
        { code: 'bcr_q1', name: '检测设备编号', dataType: 'Ref' as FieldDataType, required: true, inputType: 'SCAN' as FieldInputType },
        { code: 'bcr_q2', name: '抽检数量', dataType: 'Int' as FieldDataType, required: true, unit: '件', inputType: 'MANUAL' as FieldInputType },
        { code: 'bcr_q3', name: '总长（mm）', dataType: 'Decimal' as FieldDataType, required: true, stdValue: '25.0±0.5', unit: 'mm', instrument: '游标卡尺', inputType: 'MANUAL' as FieldInputType },
        { code: 'bcr_q4', name: '颜色标识符合', dataType: 'Boolean' as FieldDataType, required: true, stdValue: 'TRUE', instrument: '目视', inputType: 'SELECT' as FieldInputType },
        { code: 'bcr_q5', name: '外观检查', dataType: 'Enum' as FieldDataType, required: true, stdValue: '合格', instrument: '目视/放大镜', inputType: 'SELECT' as FieldInputType },
        { code: 'bcr_q6', name: '连接强度（拉拔力）', dataType: 'Decimal' as FieldDataType, required: true, stdValue: '≥5', unit: 'N', instrument: '拉力计', inputType: 'MANUAL' as FieldInputType },
        { code: 'bcr_q7', name: '抗扭强度', dataType: 'Decimal' as FieldDataType, required: true, stdValue: '按ISO 3630-1', unit: 'N·cm', instrument: '扭转试验机', inputType: 'MANUAL' as FieldInputType },
        { code: 'bcr_q8', name: '抗弯强度', dataType: 'Decimal' as FieldDataType, required: true, stdValue: '按ISO 3630-1', unit: 'N·cm', instrument: '弯曲疲劳试验机', inputType: 'MANUAL' as FieldInputType },
        { code: 'bcr_q9', name: '检验批次判定', dataType: 'Enum' as FieldDataType, required: true, stdValue: '合格/不合格', inputType: 'SELECT' as FieldInputType },
        { code: 'bcr_q10', name: 'QC签名', dataType: 'Ref' as FieldDataType, required: true, inputType: 'ESIGN' as FieldInputType },
        { code: 'bcr_q11', name: '质量主管复核', dataType: 'Ref' as FieldDataType, required: true, inputType: 'ESIGN' as FieldInputType },
      ],
    },
    mkReport('BCR'),
    {
      seq: 90, phaseCode: 'BCR-P09', phaseName: '出站入库', phaseType: 'HAND',
      required: true, eSign: true, dualReview: false, linkedDoc: '半成品入库单',
      fields: [
        { code: 'bcr_h1', name: '入库数量', dataType: 'Int' as FieldDataType, required: true, unit: '件', inputType: 'MANUAL' as FieldInputType },
        { code: 'bcr_h2', name: '入库货位', dataType: 'String' as FieldDataType, required: true, inputType: 'SCAN' as FieldInputType },
        { code: 'bcr_h3', name: '入库单号', dataType: 'String' as FieldDataType, required: true, inputType: 'AUTO' as FieldInputType },
        { code: 'bcr_h4', name: '入库时间', dataType: 'DateTime' as FieldDataType, required: true, inputType: 'AUTO' as FieldInputType },
        { code: 'bcr_h5', name: '交出人', dataType: 'Ref' as FieldDataType, required: true, inputType: 'ESIGN' as FieldInputType },
        { code: 'bcr_h6', name: '仓管员', dataType: 'Ref' as FieldDataType, required: true, inputType: 'ESIGN' as FieldInputType },
      ],
    },
  ],
};

// 将新工序追加到 mockOperations
mockOperations.push(
  OP_JC_001, OP_QX1_001, OP_WBX_001, OP_JPX_001, OP_YM1_001,
  OP_RCL_001, OP_QX2_001, OP_KX_001, OP_ZZ_001, OP_HG_001,
  OP_CL_001, OP_XWK_001, OP_JCHe_001, OP_BCR_001,
);

// 工艺路径中的工序序列（RT-RKQ-STD-002 机用根管锉#26/04锥/25mm）
export const ROUTING_SEQUENCE_002 = [
  { seq: 10,  opCode: 'OP-JC-001',   opName: '机床成型',   isBottleneck: true,  isReportPoint: true,  isQcPoint: true  },
  { seq: 20,  opCode: 'OP-QX1-001',  opName: '清洗一',     isBottleneck: false, isReportPoint: true,  isQcPoint: false },
  { seq: 30,  opCode: 'OP-WBX-001',  opName: '尾部修整',   isBottleneck: false, isReportPoint: true,  isQcPoint: true  },
  { seq: 40,  opCode: 'OP-JPX-001',  opName: '尖部修整',   isBottleneck: false, isReportPoint: true,  isQcPoint: false },
  { seq: 50,  opCode: 'OP-YM1-001',  opName: '研磨一',     isBottleneck: false, isReportPoint: true,  isQcPoint: true  },
  { seq: 60,  opCode: 'OP-RCL-001',  opName: '热处理',     isBottleneck: true,  isReportPoint: true,  isQcPoint: true  },
  { seq: 70,  opCode: 'OP-QX2-001',  opName: '清洗二',     isBottleneck: false, isReportPoint: true,  isQcPoint: true  },
  { seq: 80,  opCode: 'OP-KX-001',   opName: '刻线',       isBottleneck: false, isReportPoint: true,  isQcPoint: false },
  { seq: 90,  opCode: 'OP-ZZ-001',   opName: '组装',       isBottleneck: false, isReportPoint: true,  isQcPoint: true  },
  { seq: 100, opCode: 'OP-HG-001',   opName: '环规适配',   isBottleneck: false, isReportPoint: true,  isQcPoint: true  },
  { seq: 110, opCode: 'OP-CL-001',   opName: '测量长度',   isBottleneck: false, isReportPoint: true,  isQcPoint: true  },
  { seq: 120, opCode: 'OP-XWK-001',  opName: '装限位块',   isBottleneck: false, isReportPoint: true,  isQcPoint: false },
  { seq: 130, opCode: 'OP-JCHE-001', opName: '检测合格',   isBottleneck: true,  isReportPoint: false, isQcPoint: true  },
  { seq: 140, opCode: 'OP-BCR-001',  opName: '半成品入库', isBottleneck: false, isReportPoint: true,  isQcPoint: false },
];

// 工艺路径中的工序序列（RT-RCF-NITI-001）
export const ROUTING_SEQUENCE = [
  { seq: 10, opCode: 'OP-CUT-001',   opName: '数控磨削',    isBottleneck: true,  isReportPoint: true,  isQcPoint: true  },
  { seq: 20, opCode: 'OP-HT-001',    opName: '热处理定型',  isBottleneck: true,  isReportPoint: true,  isQcPoint: true  },
  { seq: 30, opCode: 'OP-COAT-001',  opName: '表面涂层',    isBottleneck: false, isReportPoint: true,  isQcPoint: true  },
  { seq: 40, opCode: 'OP-LASER-001', opName: '激光打标',    isBottleneck: false, isReportPoint: true,  isQcPoint: true  },
  { seq: 50, opCode: 'OP-USC-001',   opName: '超声波清洗',  isBottleneck: false, isReportPoint: true,  isQcPoint: false },
  { seq: 60, opCode: 'OP-FINAL-001', opName: '成品检验',    isBottleneck: true,  isReportPoint: false, isQcPoint: true  },
  { seq: 70, opCode: 'OP-STER-001',  opName: '初包装+灭菌', isBottleneck: true,  isReportPoint: true,  isQcPoint: true  },
  { seq: 80, opCode: 'OP-FPACK-001', opName: '终包装/装箱', isBottleneck: false, isReportPoint: true,  isQcPoint: false },
];

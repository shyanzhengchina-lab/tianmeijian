// ============================================================
// 工序主数据 & 工序阶段 数据层
// 天美健MES — 健康保健品工序主数据（固体/软胶囊/液体/外包车间）
// GMP合规设计，含完整阶段（phases）与采集字段定义
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
  instrument?: string;
  remark?: string;
}

export interface OperationPhase {
  seq: number;
  phaseCode: string;
  phaseName: string;
  phaseType: PhaseType;
  required: boolean;
  eSign: boolean;
  dualReview: boolean;
  linkedDoc?: string;
  remark?: string;
  fields: PhaseField[];
  photoReq?: 'NONE' | 'OPTIONAL' | 'REQUIRED';
  scanReq?: 'NONE' | 'EQUIP' | 'MATERIAL' | 'PERSON';
  timeoutMin?: number;
}

export interface Operation {
  id: string;
  opCode: string;
  opName: string;
  opShort: string;
  category: OpCategory;
  workshop: string;
  productLine: string;
  workCenter: string;
  equipType: string;
  stdTimeMin: number;
  prepTimeMin: number;
  hasFirstPiece: boolean;
  hasLastPiece: boolean;
  hasPatrol: boolean;
  patrolFreq?: number;
  hasCleanup: boolean;
  envReq?: string;
  paramTemplate?: string;
  isBottleneck: boolean;
  isReportPoint: boolean;
  isQcPoint: boolean;
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
// 天美健工序主数据 — 固体制剂车间（GD）
// ============================================================
export const mockOperations: Operation[] = [

  // ─────────────────────────────────────────────────────────
  // GD-01  称量配料（固体）
  // ─────────────────────────────────────────────────────────
  {
    id: 'op-gd-01',
    opCode: 'GD-01',
    opName: '称量配料',
    opShort: '称配',
    category: 'PROD',
    workshop: '固体车间',
    productLine: '固体制剂线',
    workCenter: 'GD-配料室',
    equipType: '精密电子天平',
    stdTimeMin: 180,
    prepTimeMin: 30,
    hasFirstPiece: false,
    hasLastPiece: false,
    hasPatrol: false,
    hasCleanup: true,
    envReq: '温度 18~26℃，相对湿度 ≤60%，D级洁净区',
    isBottleneck: false,
    isReportPoint: true,
    isQcPoint: true,
    status: 'ACTIVE',
    version: 'V2.0',
    effectDate: '2025-01-01',
    createdBy: '李工',
    updatedAt: '2025-06-01',
    remark: 'GMP关键工序：双人复核称量，物料平衡率96.0~102.0%',
    phases: [
      {
        seq: 10,
        phaseCode: 'GD-01-P01',
        phaseName: '生产前准备',
        phaseType: 'PREP',
        required: true,
        eSign: true,
        dualReview: false,
        linkedDoc: '批生产记录',
        remark: '确认设备清洁状态，检查清场合格证',
        fields: [
          { code: 'equip_clean', name: '设备清洁状态确认', dataType: 'Boolean', required: true, inputType: 'ESIGN' },
          { code: 'clean_cert', name: '清场合格证编号', dataType: 'String', required: true, inputType: 'SCAN' },
          { code: 'env_temp', name: '环境温度', dataType: 'Decimal', required: true, unit: '℃', stdValue: '18~26', inputType: 'MANUAL' },
          { code: 'env_rh', name: '相对湿度', dataType: 'Decimal', required: true, unit: '%', stdValue: '≤60', inputType: 'MANUAL' },
        ],
        photoReq: 'REQUIRED',
        scanReq: 'EQUIP',
      },
      {
        seq: 20,
        phaseCode: 'GD-01-P02',
        phaseName: '物料核对领取',
        phaseType: 'LOAD',
        required: true,
        eSign: true,
        dualReview: true,
        linkedDoc: '物料领用单',
        remark: '双人核对物料品名、批号、数量，核对COA合格',
        fields: [
          { code: 'material_scan', name: '物料条码扫描', dataType: 'String', required: true, inputType: 'SCAN' },
          { code: 'batch_no', name: '物料批号', dataType: 'String', required: true, inputType: 'SCAN' },
          { code: 'qty_plan', name: '计划领用量', dataType: 'Decimal', required: true, unit: 'kg', inputType: 'AUTO' },
          { code: 'qty_actual', name: '实际领用量', dataType: 'Decimal', required: true, unit: 'kg', inputType: 'MANUAL' },
          { code: 'coa_check', name: 'COA检验合格确认', dataType: 'Boolean', required: true, inputType: 'ESIGN' },
        ],
        scanReq: 'MATERIAL',
      },
      {
        seq: 30,
        phaseCode: 'GD-01-P03',
        phaseName: '称量操作',
        phaseType: 'EXEC',
        required: true,
        eSign: true,
        dualReview: true,
        linkedDoc: '称量记录',
        remark: '双人复核称量，每种原料逐一称量并记录',
        fields: [
          { code: 'balance_id', name: '天平编号', dataType: 'String', required: true, inputType: 'SCAN', instrument: '精密电子天平' },
          { code: 'tare_wt', name: '皮重', dataType: 'Decimal', required: true, unit: 'g', inputType: 'AUTO' },
          { code: 'net_wt', name: '净重（称量值）', dataType: 'Decimal', required: true, unit: 'kg', inputType: 'MANUAL', stdValue: '按处方量' },
          { code: 'deviation', name: '称量偏差', dataType: 'Decimal', required: true, unit: '%', stdValue: '≤0.5%', inputType: 'AUTO' },
          { code: 'reviewer', name: '复核人签名', dataType: 'String', required: true, inputType: 'ESIGN' },
        ],
        scanReq: 'EQUIP',
        timeoutMin: 240,
      },
      {
        seq: 40,
        phaseCode: 'GD-01-P04',
        phaseName: '物料平衡计算',
        phaseType: 'IPQC',
        required: true,
        eSign: true,
        dualReview: false,
        linkedDoc: '物料平衡记录',
        remark: '物料平衡率必须在96.0~102.0%之间，否则需调查',
        fields: [
          { code: 'balance_rate', name: '物料平衡率', dataType: 'Decimal', required: true, unit: '%', stdValue: '96.0~102.0', inputType: 'AUTO' },
          { code: 'balance_pass', name: '物料平衡通过', dataType: 'Boolean', required: true, inputType: 'AUTO' },
          { code: 'deviation_note', name: '偏差说明（如有）', dataType: 'String', required: false, inputType: 'MANUAL' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // GD-02  混合（固体）
  // ─────────────────────────────────────────────────────────
  {
    id: 'op-gd-02',
    opCode: 'GD-02',
    opName: '混合',
    opShort: '混合',
    category: 'PROD',
    workshop: '固体车间',
    productLine: '固体制剂线',
    workCenter: 'GD-混合间',
    equipType: '槽型混合机/三维混合机',
    stdTimeMin: 120,
    prepTimeMin: 20,
    hasFirstPiece: false,
    hasLastPiece: false,
    hasPatrol: true,
    patrolFreq: 1,
    hasCleanup: true,
    envReq: '温度 18~26℃，相对湿度 ≤60%，D级洁净区',
    isBottleneck: false,
    isReportPoint: true,
    isQcPoint: true,
    status: 'ACTIVE',
    version: 'V2.0',
    effectDate: '2025-01-01',
    createdBy: '李工',
    updatedAt: '2025-06-01',
    remark: '混合均匀度检测：RSD≤5%',
    phases: [
      {
        seq: 10, phaseCode: 'GD-02-P01', phaseName: '设备准备', phaseType: 'PREP',
        required: true, eSign: true, dualReview: false,
        fields: [
          { code: 'mixer_id', name: '混合机编号', dataType: 'String', required: true, inputType: 'SCAN' },
          { code: 'clean_check', name: '设备清洁确认', dataType: 'Boolean', required: true, inputType: 'ESIGN' },
          { code: 'capacity', name: '混合机容积', dataType: 'Decimal', required: false, unit: 'L', inputType: 'AUTO' },
        ],
        scanReq: 'EQUIP',
      },
      {
        seq: 20, phaseCode: 'GD-02-P02', phaseName: '加料混合', phaseType: 'EXEC',
        required: true, eSign: true, dualReview: false,
        remark: '按处方顺序依次加料',
        fields: [
          { code: 'mix_speed', name: '混合转速', dataType: 'Int', required: true, unit: 'rpm', stdValue: '15~20', inputType: 'MANUAL' },
          { code: 'mix_time', name: '混合时间', dataType: 'Int', required: true, unit: 'min', stdValue: '20~30', inputType: 'MANUAL' },
          { code: 'load_wt', name: '投料量', dataType: 'Decimal', required: true, unit: 'kg', inputType: 'MANUAL' },
          { code: 'fill_ratio', name: '充填比例', dataType: 'Decimal', required: true, unit: '%', stdValue: '60~80', inputType: 'AUTO' },
        ],
        timeoutMin: 60,
      },
      {
        seq: 30, phaseCode: 'GD-02-P03', phaseName: '均匀度抽检', phaseType: 'IPQC',
        required: true, eSign: false, dualReview: false, linkedDoc: '中间体检验单',
        remark: 'RSD≤5%为合格',
        fields: [
          { code: 'sample_cnt', name: '取样点数', dataType: 'Int', required: true, stdValue: '10', inputType: 'AUTO' },
          { code: 'rsd', name: '相对标准偏差RSD', dataType: 'Decimal', required: true, unit: '%', stdValue: '≤5.0', inputType: 'MANUAL', instrument: '含量测定仪' },
          { code: 'ipqc_pass', name: '均匀度合格', dataType: 'Boolean', required: true, inputType: 'AUTO' },
        ],
      },
      {
        seq: 40, phaseCode: 'GD-02-P04', phaseName: '清场清洁', phaseType: 'CLEAN',
        required: true, eSign: true, dualReview: false,
        fields: [
          { code: 'clean_method', name: '清洁方法', dataType: 'Enum', required: true, inputType: 'SELECT', stdValue: '湿法清洁' },
          { code: 'clean_photo', name: '清洁后照片', dataType: 'Image', required: true, inputType: 'UPLOAD' },
          { code: 'residue_check', name: '残留检查', dataType: 'Boolean', required: true, inputType: 'ESIGN' },
        ],
        photoReq: 'REQUIRED',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // GD-03  制粒（固体）
  // ─────────────────────────────────────────────────────────
  {
    id: 'op-gd-03',
    opCode: 'GD-03',
    opName: '制粒',
    opShort: '制粒',
    category: 'PROD',
    workshop: '固体车间',
    productLine: '固体制剂线',
    workCenter: 'GD-制粒间',
    equipType: '湿法制粒机/流化床',
    stdTimeMin: 180,
    prepTimeMin: 30,
    hasFirstPiece: false,
    hasLastPiece: false,
    hasPatrol: true,
    patrolFreq: 1,
    hasCleanup: true,
    envReq: 'D级洁净区，温度 18~26℃，湿度 ≤60%',
    isBottleneck: false,
    isReportPoint: true,
    isQcPoint: true,
    status: 'ACTIVE',
    version: 'V2.0',
    effectDate: '2025-01-01',
    createdBy: '李工',
    updatedAt: '2025-06-01',
    remark: '颗粒粒径D50: 200~400μm，水分≤3.0%',
    phases: [
      {
        seq: 10, phaseCode: 'GD-03-P01', phaseName: '制粒前准备', phaseType: 'PREP',
        required: true, eSign: true, dualReview: false,
        fields: [
          { code: 'granulator_id', name: '制粒机编号', dataType: 'String', required: true, inputType: 'SCAN' },
          { code: 'screen_mesh', name: '筛网规格', dataType: 'String', required: true, stdValue: '20目', inputType: 'SELECT' },
          { code: 'binder_prep', name: '粘合剂制备确认', dataType: 'Boolean', required: true, inputType: 'ESIGN' },
        ],
      },
      {
        seq: 20, phaseCode: 'GD-03-P02', phaseName: '制粒操作', phaseType: 'EXEC',
        required: true, eSign: true, dualReview: false,
        fields: [
          { code: 'spray_rate', name: '喷液速率', dataType: 'Decimal', required: true, unit: 'mL/min', stdValue: '5~15', inputType: 'MANUAL' },
          { code: 'blade_speed', name: '搅拌桨转速', dataType: 'Int', required: true, unit: 'rpm', stdValue: '200~400', inputType: 'MANUAL' },
          { code: 'chop_speed', name: '切割刀转速', dataType: 'Int', required: true, unit: 'rpm', stdValue: '1500~3000', inputType: 'MANUAL' },
          { code: 'granule_wt', name: '制粒后湿颗粒量', dataType: 'Decimal', required: true, unit: 'kg', inputType: 'MANUAL' },
        ],
        timeoutMin: 120,
      },
      {
        seq: 30, phaseCode: 'GD-03-P03', phaseName: '颗粒中检', phaseType: 'IPQC',
        required: true, eSign: false, dualReview: false, linkedDoc: '中间体检验单',
        fields: [
          { code: 'particle_size', name: '颗粒粒径D50', dataType: 'Decimal', required: true, unit: 'μm', stdValue: '200~400', inputType: 'MANUAL', instrument: '激光粒度仪' },
          { code: 'moisture', name: '颗粒水分', dataType: 'Decimal', required: true, unit: '%', stdValue: '≤3.0', inputType: 'MANUAL', instrument: '快速水分仪' },
          { code: 'bulk_density', name: '堆密度', dataType: 'Decimal', required: false, unit: 'g/mL', inputType: 'MANUAL' },
          { code: 'ipqc_pass', name: '中检合格', dataType: 'Boolean', required: true, inputType: 'AUTO' },
        ],
      },
      {
        seq: 40, phaseCode: 'GD-03-P04', phaseName: '清场清洁', phaseType: 'CLEAN',
        required: true, eSign: true, dualReview: false,
        fields: [
          { code: 'clean_photo', name: '清洁后照片', dataType: 'Image', required: true, inputType: 'UPLOAD' },
          { code: 'clean_record', name: '清洁记录编号', dataType: 'String', required: true, inputType: 'MANUAL' },
        ],
        photoReq: 'REQUIRED',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // GD-04  干燥（固体）
  // ─────────────────────────────────────────────────────────
  {
    id: 'op-gd-04',
    opCode: 'GD-04',
    opName: '干燥',
    opShort: '干燥',
    category: 'PROD',
    workshop: '固体车间',
    productLine: '固体制剂线',
    workCenter: 'GD-干燥间',
    equipType: '流化床干燥机/热风干燥箱',
    stdTimeMin: 240,
    prepTimeMin: 20,
    hasFirstPiece: false,
    hasLastPiece: false,
    hasPatrol: true,
    patrolFreq: 1,
    hasCleanup: true,
    envReq: 'D级洁净区',
    isBottleneck: false,
    isReportPoint: true,
    isQcPoint: true,
    status: 'ACTIVE',
    version: 'V2.0',
    effectDate: '2025-01-01',
    createdBy: '李工',
    updatedAt: '2025-06-01',
    remark: '干燥终点：水分≤3.0%（快速水分仪检测）',
    phases: [
      {
        seq: 10, phaseCode: 'GD-04-P01', phaseName: '干燥设备准备', phaseType: 'PREP',
        required: true, eSign: true, dualReview: false,
        fields: [
          { code: 'dryer_id', name: '干燥机编号', dataType: 'String', required: true, inputType: 'SCAN' },
          { code: 'inlet_filter', name: '进风过滤器状态', dataType: 'Boolean', required: true, inputType: 'ESIGN' },
          { code: 'set_temp', name: '设定进风温度', dataType: 'Decimal', required: true, unit: '℃', stdValue: '60~80', inputType: 'MANUAL' },
        ],
      },
      {
        seq: 20, phaseCode: 'GD-04-P02', phaseName: '干燥执行', phaseType: 'EXEC',
        required: true, eSign: false, dualReview: false,
        remark: '每30分钟记录一次温度，异常立即停机',
        fields: [
          { code: 'actual_temp', name: '实际进风温度', dataType: 'Decimal', required: true, unit: '℃', stdValue: '60~80', inputType: 'MANUAL' },
          { code: 'exhaust_temp', name: '排风温度', dataType: 'Decimal', required: true, unit: '℃', inputType: 'MANUAL' },
          { code: 'dry_time', name: '干燥时间', dataType: 'Int', required: true, unit: 'min', inputType: 'MANUAL' },
          { code: 'batch_wt_in', name: '投入湿颗粒量', dataType: 'Decimal', required: true, unit: 'kg', inputType: 'MANUAL' },
        ],
        timeoutMin: 300,
      },
      {
        seq: 30, phaseCode: 'GD-04-P03', phaseName: '水分检测', phaseType: 'IPQC',
        required: true, eSign: false, dualReview: false, linkedDoc: '中间体检验单',
        remark: '达到水分标准方可出料，否则继续干燥',
        fields: [
          { code: 'moisture_result', name: '颗粒水分（终点）', dataType: 'Decimal', required: true, unit: '%', stdValue: '≤3.0', inputType: 'MANUAL', instrument: '快速水分仪' },
          { code: 'moisture_pass', name: '水分合格', dataType: 'Boolean', required: true, inputType: 'AUTO' },
          { code: 'dry_wt', name: '干颗粒重量', dataType: 'Decimal', required: true, unit: 'kg', inputType: 'MANUAL' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // GD-05  压片（固体）
  // ─────────────────────────────────────────────────────────
  {
    id: 'op-gd-05',
    opCode: 'GD-05',
    opName: '压片',
    opShort: '压片',
    category: 'PROD',
    workshop: '固体车间',
    productLine: '固体制剂线',
    workCenter: 'GD-压片间',
    equipType: '旋转式压片机',
    stdTimeMin: 480,
    prepTimeMin: 60,
    hasFirstPiece: true,
    hasLastPiece: true,
    hasPatrol: true,
    patrolFreq: 1,
    hasCleanup: true,
    envReq: 'D级洁净区，温度 18~26℃，湿度 ≤45%（防止片剂吸湿）',
    isBottleneck: true,
    isReportPoint: true,
    isQcPoint: true,
    status: 'ACTIVE',
    version: 'V2.0',
    effectDate: '2025-01-01',
    createdBy: '李工',
    updatedAt: '2025-06-01',
    remark: '关键工序！片重差异±5%，硬度4~8kg，脆碎度≤1%，崩解时限≤30min',
    phases: [
      {
        seq: 10, phaseCode: 'GD-05-P01', phaseName: '压片机安装调试', phaseType: 'PREP',
        required: true, eSign: true, dualReview: false,
        fields: [
          { code: 'press_id', name: '压片机编号', dataType: 'String', required: true, inputType: 'SCAN' },
          { code: 'punch_check', name: '冲模检查（无损伤/无污染）', dataType: 'Boolean', required: true, inputType: 'ESIGN' },
          { code: 'punch_code', name: '冲模编号', dataType: 'String', required: true, inputType: 'SCAN' },
          { code: 'tablet_spec', name: '片剂规格确认', dataType: 'String', required: true, inputType: 'SELECT' },
        ],
      },
      {
        seq: 20, phaseCode: 'GD-05-P02', phaseName: '首片检验', phaseType: 'SPEC',
        required: true, eSign: true, dualReview: true,
        linkedDoc: '首片检验记录',
        remark: '首片必须通过才能正式投产，双人复核',
        fields: [
          { code: 'tablet_wt_1st', name: '首片片重', dataType: 'Decimal', required: true, unit: 'mg', stdValue: '按处方量±5%', inputType: 'MANUAL', instrument: '分析天平' },
          { code: 'hardness_1st', name: '首片硬度', dataType: 'Decimal', required: true, unit: 'kg', stdValue: '4~8', inputType: 'MANUAL', instrument: '硬度仪' },
          { code: 'appearance_1st', name: '外观检查', dataType: 'Enum', required: true, stdValue: '合格', inputType: 'SELECT' },
          { code: 'first_pass', name: '首片放行', dataType: 'Boolean', required: true, inputType: 'ESIGN' },
        ],
        photoReq: 'REQUIRED',
      },
      {
        seq: 30, phaseCode: 'GD-05-P03', phaseName: '连续压片生产', phaseType: 'EXEC',
        required: true, eSign: false, dualReview: false,
        remark: '每30分钟巡检一次片重，偏差超5%立即停机调整',
        fields: [
          { code: 'press_speed', name: '压片机转速', dataType: 'Int', required: true, unit: 'rpm', stdValue: '20~40', inputType: 'MANUAL' },
          { code: 'tablet_wt_avg', name: '平均片重', dataType: 'Decimal', required: true, unit: 'mg', stdValue: '按处方±5%', inputType: 'MANUAL' },
          { code: 'yield_tablet', name: '压片产量', dataType: 'Int', required: true, unit: '万片', inputType: 'MANUAL' },
          { code: 'defect_cnt', name: '废片数量', dataType: 'Int', required: true, unit: '片', inputType: 'MANUAL' },
        ],
        timeoutMin: 600,
      },
      {
        seq: 40, phaseCode: 'GD-05-P04', phaseName: '压片中间控制检验', phaseType: 'IPQC',
        required: true, eSign: false, dualReview: false, linkedDoc: '中间控制检验记录',
        remark: '每批次抽检，每2小时一次',
        fields: [
          { code: 'hardness', name: '硬度', dataType: 'Decimal', required: true, unit: 'kg', stdValue: '4~8', inputType: 'MANUAL', instrument: '硬度仪' },
          { code: 'friability', name: '脆碎度', dataType: 'Decimal', required: true, unit: '%', stdValue: '≤1.0', inputType: 'MANUAL', instrument: '脆碎度仪' },
          { code: 'disintegration', name: '崩解时限', dataType: 'Int', required: true, unit: 'min', stdValue: '≤30', inputType: 'MANUAL', instrument: '崩解仪' },
          { code: 'wt_variation', name: '片重差异', dataType: 'Decimal', required: true, unit: '%', stdValue: '±5%', inputType: 'AUTO' },
        ],
      },
      {
        seq: 50, phaseCode: 'GD-05-P05', phaseName: '清场清洁', phaseType: 'CLEAN',
        required: true, eSign: true, dualReview: false,
        fields: [
          { code: 'clean_photo', name: '清场照片', dataType: 'Image', required: true, inputType: 'UPLOAD' },
          { code: 'clean_cert_no', name: '清场合格证编号', dataType: 'String', required: true, inputType: 'MANUAL' },
        ],
        photoReq: 'REQUIRED',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // GD-06  铝塑包装（固体）
  // ─────────────────────────────────────────────────────────
  {
    id: 'op-gd-06',
    opCode: 'GD-06',
    opName: '铝塑包装',
    opShort: '铝塑',
    category: 'PACK',
    workshop: '固体车间',
    productLine: '固体制剂线',
    workCenter: 'GD-包装间',
    equipType: '铝塑泡罩包装机',
    stdTimeMin: 240,
    prepTimeMin: 30,
    hasFirstPiece: true,
    hasLastPiece: false,
    hasPatrol: true,
    patrolFreq: 1,
    hasCleanup: true,
    envReq: 'D级洁净区',
    isBottleneck: false,
    isReportPoint: true,
    isQcPoint: true,
    status: 'ACTIVE',
    version: 'V2.0',
    effectDate: '2025-01-01',
    createdBy: '王工',
    updatedAt: '2025-06-01',
    remark: '铝箔封合温度165~185℃，密封性检测，批号打印正确',
    phases: [
      {
        seq: 10, phaseCode: 'GD-06-P01', phaseName: '包装材料核查', phaseType: 'LOAD',
        required: true, eSign: true, dualReview: false, linkedDoc: '包材领用记录',
        fields: [
          { code: 'pvc_batch', name: 'PVC膜批号', dataType: 'String', required: true, inputType: 'SCAN' },
          { code: 'alu_batch', name: '铝箔批号', dataType: 'String', required: true, inputType: 'SCAN' },
          { code: 'lot_print_check', name: '批号打印核对', dataType: 'Boolean', required: true, inputType: 'ESIGN' },
          { code: 'exp_date_check', name: '有效期打印核对', dataType: 'Boolean', required: true, inputType: 'ESIGN' },
        ],
      },
      {
        seq: 20, phaseCode: 'GD-06-P02', phaseName: '铝塑封合', phaseType: 'EXEC',
        required: true, eSign: false, dualReview: false,
        fields: [
          { code: 'seal_temp', name: '封合温度', dataType: 'Decimal', required: true, unit: '℃', stdValue: '165~185', inputType: 'MANUAL' },
          { code: 'press_force', name: '封合压力', dataType: 'Decimal', required: true, unit: 'MPa', inputType: 'MANUAL' },
          { code: 'machine_speed', name: '机器速度', dataType: 'Int', required: true, unit: '板/min', inputType: 'MANUAL' },
          { code: 'tablet_count_check', name: '装片数量核对', dataType: 'Boolean', required: true, inputType: 'ESIGN' },
        ],
      },
      {
        seq: 30, phaseCode: 'GD-06-P03', phaseName: '密封性抽检', phaseType: 'IPQC',
        required: true, eSign: false, dualReview: false, linkedDoc: '包装中间控制记录',
        fields: [
          { code: 'seal_test', name: '密封性检测', dataType: 'Enum', required: true, stdValue: '合格', inputType: 'SELECT' },
          { code: 'appearance_check', name: '外观检查（无气泡/无破损）', dataType: 'Boolean', required: true, inputType: 'ESIGN' },
          { code: 'lot_readable', name: '批号清晰可读', dataType: 'Boolean', required: true, inputType: 'ESIGN' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // GD-07  外包装（固体）
  // ─────────────────────────────────────────────────────────
  {
    id: 'op-gd-07',
    opCode: 'GD-07',
    opName: '外包装',
    opShort: '外包',
    category: 'PACK',
    workshop: '外包车间',
    productLine: '通用外包线',
    workCenter: 'GD-外包间',
    equipType: '装盒机/贴标机',
    stdTimeMin: 180,
    prepTimeMin: 20,
    hasFirstPiece: true,
    hasLastPiece: false,
    hasPatrol: true,
    patrolFreq: 1,
    hasCleanup: false,
    isBottleneck: false,
    isReportPoint: true,
    isQcPoint: false,
    status: 'ACTIVE',
    version: 'V2.0',
    effectDate: '2025-01-01',
    createdBy: '王工',
    updatedAt: '2025-06-01',
    remark: '说明书/标签核对，整件重量复核',
    phases: [
      {
        seq: 10, phaseCode: 'GD-07-P01', phaseName: '说明书/标签核对', phaseType: 'LOAD',
        required: true, eSign: true, dualReview: true, linkedDoc: '标签领用记录',
        remark: '双人核对标签版本号与批号',
        fields: [
          { code: 'label_version', name: '标签版本号', dataType: 'String', required: true, inputType: 'SCAN' },
          { code: 'insert_check', name: '说明书核对', dataType: 'Boolean', required: true, inputType: 'ESIGN' },
          { code: 'box_lot_check', name: '纸盒批号核对', dataType: 'Boolean', required: true, inputType: 'ESIGN' },
        ],
      },
      {
        seq: 20, phaseCode: 'GD-07-P02', phaseName: '装盒贴标', phaseType: 'EXEC',
        required: true, eSign: false, dualReview: false,
        fields: [
          { code: 'box_speed', name: '装盒速度', dataType: 'Int', required: false, unit: '盒/min', inputType: 'MANUAL' },
          { code: 'boxes_count', name: '实装盒数', dataType: 'Int', required: true, unit: '盒', inputType: 'MANUAL' },
          { code: 'label_pass', name: '标签粘贴合格', dataType: 'Boolean', required: true, inputType: 'ESIGN' },
        ],
      },
      {
        seq: 30, phaseCode: 'GD-07-P03', phaseName: '装箱与成品统计', phaseType: 'HAND',
        required: true, eSign: true, dualReview: false, linkedDoc: '成品入库记录',
        fields: [
          { code: 'cases_count', name: '装箱件数', dataType: 'Int', required: true, unit: '件', inputType: 'MANUAL' },
          { code: 'case_wt', name: '整件重量复核', dataType: 'Decimal', required: true, unit: 'kg', inputType: 'MANUAL' },
          { code: 'yield_final', name: '成品收率', dataType: 'Decimal', required: true, unit: '%', stdValue: '≥96.0', inputType: 'AUTO' },
          { code: 'qc_release', name: '质量放行签字', dataType: 'String', required: true, inputType: 'ESIGN' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // RN-01  配液（软胶囊）
  // ─────────────────────────────────────────────────────────
  {
    id: 'op-rn-01',
    opCode: 'RN-01',
    opName: '配液',
    opShort: '配液',
    category: 'PROD',
    workshop: '软胶囊车间',
    productLine: '软胶囊制剂线',
    workCenter: 'RN-配液间',
    equipType: '不锈钢配液罐',
    stdTimeMin: 120,
    prepTimeMin: 30,
    hasFirstPiece: false,
    hasLastPiece: false,
    hasPatrol: false,
    hasCleanup: true,
    envReq: 'D级洁净区，温度 18~26℃',
    isBottleneck: false,
    isReportPoint: true,
    isQcPoint: true,
    status: 'ACTIVE',
    version: 'V1.5',
    effectDate: '2025-01-01',
    createdBy: '张工',
    updatedAt: '2025-06-01',
    remark: '内容物配制：称量→溶解/分散→均质，含量均匀度检测',
    phases: [
      {
        seq: 10, phaseCode: 'RN-01-P01', phaseName: '原辅料称量核对', phaseType: 'LOAD',
        required: true, eSign: true, dualReview: true, linkedDoc: '批配料记录',
        fields: [
          { code: 'oil_base', name: '基础油原料', dataType: 'String', required: true, inputType: 'SCAN' },
          { code: 'active_wt', name: '活性成分称量', dataType: 'Decimal', required: true, unit: 'g', stdValue: '按处方', inputType: 'MANUAL' },
          { code: 'antioxidant_wt', name: '抗氧化剂称量', dataType: 'Decimal', required: true, unit: 'g', inputType: 'MANUAL' },
          { code: 'dual_check', name: '双人复核确认', dataType: 'Boolean', required: true, inputType: 'ESIGN' },
        ],
      },
      {
        seq: 20, phaseCode: 'RN-01-P02', phaseName: '配液混合', phaseType: 'EXEC',
        required: true, eSign: false, dualReview: false,
        fields: [
          { code: 'mix_temp', name: '配液温度', dataType: 'Decimal', required: true, unit: '℃', stdValue: '40~60', inputType: 'MANUAL' },
          { code: 'stir_time', name: '搅拌时间', dataType: 'Int', required: true, unit: 'min', stdValue: '30~60', inputType: 'MANUAL' },
          { code: 'homogenizer_speed', name: '均质机转速', dataType: 'Int', required: false, unit: 'rpm', inputType: 'MANUAL' },
          { code: 'visual_check', name: '外观均一性目检', dataType: 'Enum', required: true, stdValue: '均匀无分层', inputType: 'SELECT' },
        ],
      },
      {
        seq: 30, phaseCode: 'RN-01-P03', phaseName: '含量均匀度检测', phaseType: 'IPQC',
        required: true, eSign: false, dualReview: false, linkedDoc: '中间体检验单',
        fields: [
          { code: 'assay_result', name: '含量测定结果', dataType: 'Decimal', required: true, unit: '%', stdValue: '95~105', inputType: 'MANUAL' },
          { code: 'uniformity_pass', name: '均匀度合格', dataType: 'Boolean', required: true, inputType: 'AUTO' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // RN-02  胶皮制备（软胶囊）
  // ─────────────────────────────────────────────────────────
  {
    id: 'op-rn-02',
    opCode: 'RN-02',
    opName: '胶皮制备',
    opShort: '制皮',
    category: 'PROD',
    workshop: '软胶囊车间',
    productLine: '软胶囊制剂线',
    workCenter: 'RN-熔胶间',
    equipType: '明胶熔胶锅',
    stdTimeMin: 240,
    prepTimeMin: 30,
    hasFirstPiece: false,
    hasLastPiece: false,
    hasPatrol: true,
    patrolFreq: 1,
    hasCleanup: true,
    envReq: 'D级洁净区，温度 60~80℃（明胶熔化）',
    isBottleneck: false,
    isReportPoint: true,
    isQcPoint: true,
    status: 'ACTIVE',
    version: 'V1.5',
    effectDate: '2025-01-01',
    createdBy: '张工',
    updatedAt: '2025-06-01',
    remark: '明胶胶皮：厚度0.6~0.8mm，胶液温度60℃，保温静置脱泡',
    phases: [
      {
        seq: 10, phaseCode: 'RN-02-P01', phaseName: '明胶溶解', phaseType: 'EXEC',
        required: true, eSign: false, dualReview: false,
        fields: [
          { code: 'gelatin_wt', name: '明胶用量', dataType: 'Decimal', required: true, unit: 'kg', inputType: 'MANUAL' },
          { code: 'water_wt', name: '纯化水用量', dataType: 'Decimal', required: true, unit: 'kg', inputType: 'MANUAL' },
          { code: 'plasticizer', name: '增塑剂用量（甘油）', dataType: 'Decimal', required: true, unit: 'kg', inputType: 'MANUAL' },
          { code: 'melt_temp', name: '熔化温度', dataType: 'Decimal', required: true, unit: '℃', stdValue: '60~70', inputType: 'MANUAL' },
          { code: 'degas_time', name: '脱气时间', dataType: 'Int', required: true, unit: 'min', stdValue: '≥30', inputType: 'MANUAL' },
        ],
        timeoutMin: 180,
      },
      {
        seq: 20, phaseCode: 'RN-02-P02', phaseName: '胶皮质量检测', phaseType: 'IPQC',
        required: true, eSign: false, dualReview: false, linkedDoc: '胶皮检验记录',
        fields: [
          { code: 'gel_thickness', name: '胶皮厚度', dataType: 'Decimal', required: true, unit: 'mm', stdValue: '0.6~0.8', inputType: 'MANUAL', instrument: '千分尺' },
          { code: 'gel_viscosity', name: '胶液粘度', dataType: 'Decimal', required: true, unit: 'mPa·s', inputType: 'MANUAL', instrument: '旋转粘度计' },
          { code: 'gel_clarity', name: '澄清度（无气泡）', dataType: 'Boolean', required: true, inputType: 'ESIGN' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // RN-03  压制成型（软胶囊）
  // ─────────────────────────────────────────────────────────
  {
    id: 'op-rn-03',
    opCode: 'RN-03',
    opName: '压制成型',
    opShort: '压囊',
    category: 'PROD',
    workshop: '软胶囊车间',
    productLine: '软胶囊制剂线',
    workCenter: 'RN-压丸间',
    equipType: '旋转压囊机',
    stdTimeMin: 360,
    prepTimeMin: 60,
    hasFirstPiece: true,
    hasLastPiece: false,
    hasPatrol: true,
    patrolFreq: 1,
    hasCleanup: true,
    envReq: 'D级洁净区，温度 18~24℃，湿度 30~50%',
    isBottleneck: true,
    isReportPoint: true,
    isQcPoint: true,
    status: 'ACTIVE',
    version: 'V1.5',
    effectDate: '2025-01-01',
    createdBy: '张工',
    updatedAt: '2025-06-01',
    remark: '关键工序！装量差异±10%，外观无变形无漏液',
    phases: [
      {
        seq: 10, phaseCode: 'RN-03-P01', phaseName: '压囊机安装调试', phaseType: 'PREP',
        required: true, eSign: true, dualReview: false,
        fields: [
          { code: 'mold_size', name: '模具规格', dataType: 'String', required: true, inputType: 'SELECT' },
          { code: 'mold_clean', name: '模具清洁确认', dataType: 'Boolean', required: true, inputType: 'ESIGN' },
          { code: 'gel_temp', name: '胶液温度', dataType: 'Decimal', required: true, unit: '℃', stdValue: '55~65', inputType: 'MANUAL' },
        ],
      },
      {
        seq: 20, phaseCode: 'RN-03-P02', phaseName: '首粒检验', phaseType: 'SPEC',
        required: true, eSign: true, dualReview: true, linkedDoc: '首粒检验记录',
        remark: '首粒必须通过！',
        fields: [
          { code: 'first_fill_wt', name: '首粒装量', dataType: 'Decimal', required: true, unit: 'mg', stdValue: '按处方±10%', inputType: 'MANUAL' },
          { code: 'first_shape', name: '外观形状', dataType: 'Enum', required: true, stdValue: '正常', inputType: 'SELECT' },
          { code: 'first_pass', name: '首粒放行', dataType: 'Boolean', required: true, inputType: 'ESIGN' },
        ],
        photoReq: 'REQUIRED',
      },
      {
        seq: 30, phaseCode: 'RN-03-P03', phaseName: '连续压制', phaseType: 'EXEC',
        required: true, eSign: false, dualReview: false,
        fields: [
          { code: 'capsule_speed', name: '压囊速度', dataType: 'Int', required: true, unit: '粒/min', inputType: 'MANUAL' },
          { code: 'fill_volume', name: '装量体积', dataType: 'Decimal', required: true, unit: 'mL', inputType: 'MANUAL' },
          { code: 'yield_capsule', name: '产出粒数', dataType: 'Int', required: true, unit: '万粒', inputType: 'MANUAL' },
        ],
        timeoutMin: 480,
      },
      {
        seq: 40, phaseCode: 'RN-03-P04', phaseName: '装量差异抽检', phaseType: 'IPQC',
        required: true, eSign: false, dualReview: false, linkedDoc: '中间控制检验记录',
        fields: [
          { code: 'fill_variation', name: '装量差异', dataType: 'Decimal', required: true, unit: '%', stdValue: '±10%', inputType: 'MANUAL' },
          { code: 'leakage_check', name: '漏液检查', dataType: 'Boolean', required: true, inputType: 'ESIGN' },
          { code: 'shape_check', name: '形状一致性', dataType: 'Boolean', required: true, inputType: 'ESIGN' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // RN-04  定型干燥（软胶囊）
  // ─────────────────────────────────────────────────────────
  {
    id: 'op-rn-04',
    opCode: 'RN-04',
    opName: '定型干燥',
    opShort: '定型',
    category: 'PROD',
    workshop: '软胶囊车间',
    productLine: '软胶囊制剂线',
    workCenter: 'RN-转笼间',
    equipType: '转笼干燥机',
    stdTimeMin: 480,
    prepTimeMin: 15,
    hasFirstPiece: false,
    hasLastPiece: false,
    hasPatrol: true,
    patrolFreq: 2,
    hasCleanup: false,
    envReq: '温度 18~24℃，湿度 25~45%',
    isBottleneck: false,
    isReportPoint: true,
    isQcPoint: true,
    status: 'ACTIVE',
    version: 'V1.5',
    effectDate: '2025-01-01',
    createdBy: '张工',
    updatedAt: '2025-06-01',
    remark: '干燥至水分≤12%，胶皮硬度正常，无粘连',
    phases: [
      {
        seq: 10, phaseCode: 'RN-04-P01', phaseName: '转笼干燥', phaseType: 'EXEC',
        required: true, eSign: false, dualReview: false,
        fields: [
          { code: 'drum_temp', name: '转笼温度', dataType: 'Decimal', required: true, unit: '℃', stdValue: '18~24', inputType: 'MANUAL' },
          { code: 'drum_humidity', name: '转笼湿度', dataType: 'Decimal', required: true, unit: '%', stdValue: '25~45', inputType: 'MANUAL' },
          { code: 'dry_duration', name: '干燥时长', dataType: 'Int', required: true, unit: 'h', stdValue: '6~8', inputType: 'MANUAL' },
        ],
        timeoutMin: 600,
      },
      {
        seq: 20, phaseCode: 'RN-04-P02', phaseName: '定型后质量检查', phaseType: 'IPQC',
        required: true, eSign: false, dualReview: false, linkedDoc: '中间体检验单',
        fields: [
          { code: 'shell_moisture', name: '胶皮水分', dataType: 'Decimal', required: true, unit: '%', stdValue: '≤12.0', inputType: 'MANUAL' },
          { code: 'stickiness', name: '粘连检查', dataType: 'Boolean', required: true, stdValue: '无粘连', inputType: 'ESIGN' },
          { code: 'shape_integrity', name: '外形完整性', dataType: 'Boolean', required: true, inputType: 'ESIGN' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // RN-05  软胶囊内检抛光（软胶囊）
  // ─────────────────────────────────────────────────────────
  {
    id: 'op-rn-05',
    opCode: 'RN-05',
    opName: '内检抛光',
    opShort: '抛光',
    category: 'INSP',
    workshop: '软胶囊车间',
    productLine: '软胶囊制剂线',
    workCenter: 'RN-抛光间',
    equipType: '抛光机',
    stdTimeMin: 120,
    prepTimeMin: 10,
    hasFirstPiece: false,
    hasLastPiece: false,
    hasPatrol: false,
    hasCleanup: false,
    isBottleneck: false,
    isReportPoint: true,
    isQcPoint: true,
    status: 'ACTIVE',
    version: 'V1.5',
    effectDate: '2025-01-01',
    createdBy: '张工',
    updatedAt: '2025-06-01',
    remark: '人工逐粒检查，剔除变形/漏液/污染品，合格品抛光',
    phases: [
      {
        seq: 10, phaseCode: 'RN-05-P01', phaseName: '灯检内检', phaseType: 'IPQC',
        required: true, eSign: false, dualReview: false, linkedDoc: '灯检记录',
        fields: [
          { code: 'inspect_qty', name: '检查总粒数', dataType: 'Int', required: true, unit: '粒', inputType: 'MANUAL' },
          { code: 'defect_qty', name: '不合格数', dataType: 'Int', required: true, unit: '粒', inputType: 'MANUAL' },
          { code: 'defect_rate', name: '不合格率', dataType: 'Decimal', required: true, unit: '%', stdValue: '≤0.5%', inputType: 'AUTO' },
          { code: 'inspector', name: '检验员', dataType: 'String', required: true, inputType: 'SCAN' },
        ],
      },
      {
        seq: 20, phaseCode: 'RN-05-P02', phaseName: '抛光入库', phaseType: 'HAND',
        required: true, eSign: true, dualReview: false, linkedDoc: '半成品入库单',
        fields: [
          { code: 'polish_yield', name: '抛光合格率', dataType: 'Decimal', required: true, unit: '%', stdValue: '≥99.5%', inputType: 'AUTO' },
          { code: 'semi_qty', name: '半成品数量', dataType: 'Int', required: true, unit: '万粒', inputType: 'MANUAL' },
          { code: 'storage_code', name: '暂存区编码', dataType: 'String', required: true, inputType: 'SCAN' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // YQ-01  配液灌装前准备（液体车间）
  // ─────────────────────────────────────────────────────────
  {
    id: 'op-yq-01',
    opCode: 'YQ-01',
    opName: '配液',
    opShort: '配液',
    category: 'PROD',
    workshop: '液体车间',
    productLine: '口服液制剂线',
    workCenter: 'YQ-配液间',
    equipType: '不锈钢配液罐（含搅拌）',
    stdTimeMin: 180,
    prepTimeMin: 30,
    hasFirstPiece: false,
    hasLastPiece: false,
    hasPatrol: false,
    hasCleanup: true,
    envReq: 'C级洁净区，温度 18~26℃',
    isBottleneck: false,
    isReportPoint: true,
    isQcPoint: true,
    status: 'ACTIVE',
    version: 'V1.8',
    effectDate: '2025-01-01',
    createdBy: '陈工',
    updatedAt: '2025-06-01',
    remark: '注射用水/纯化水，pH 4.0~7.0，含量按标准执行',
    phases: [
      {
        seq: 10, phaseCode: 'YQ-01-P01', phaseName: '容器器具准备', phaseType: 'PREP',
        required: true, eSign: true, dualReview: false,
        fields: [
          { code: 'tank_clean', name: '配液罐清洁状态', dataType: 'Boolean', required: true, inputType: 'ESIGN' },
          { code: 'water_type', name: '用水类型', dataType: 'Enum', required: true, stdValue: '纯化水', inputType: 'SELECT' },
          { code: 'water_toc', name: '用水TOC值', dataType: 'Decimal', required: true, unit: 'ppb', stdValue: '≤500', inputType: 'MANUAL' },
        ],
      },
      {
        seq: 20, phaseCode: 'YQ-01-P02', phaseName: '称量投料配制', phaseType: 'EXEC',
        required: true, eSign: true, dualReview: true,
        fields: [
          { code: 'active_wt', name: '主成分称量', dataType: 'Decimal', required: true, unit: 'kg', inputType: 'MANUAL' },
          { code: 'excipient_wt', name: '辅料称量', dataType: 'Decimal', required: true, unit: 'kg', inputType: 'MANUAL' },
          { code: 'stir_speed', name: '搅拌转速', dataType: 'Int', required: true, unit: 'rpm', stdValue: '50~100', inputType: 'MANUAL' },
          { code: 'temp', name: '配液温度', dataType: 'Decimal', required: true, unit: '℃', stdValue: '20~30', inputType: 'MANUAL' },
          { code: 'volume_check', name: '定容体积核对', dataType: 'Decimal', required: true, unit: 'L', inputType: 'MANUAL' },
        ],
      },
      {
        seq: 30, phaseCode: 'YQ-01-P03', phaseName: '中间体检验', phaseType: 'IPQC',
        required: true, eSign: false, dualReview: false, linkedDoc: '中间体检验申请单',
        fields: [
          { code: 'ph_value', name: 'pH值', dataType: 'Decimal', required: true, unit: '', stdValue: '4.0~7.0', inputType: 'MANUAL', instrument: 'pH计' },
          { code: 'assay', name: '主成分含量', dataType: 'Decimal', required: true, unit: '%', stdValue: '95~105', inputType: 'MANUAL' },
          { code: 'clarity', name: '澄清度', dataType: 'Enum', required: true, stdValue: '澄清', inputType: 'SELECT' },
          { code: 'ipqc_pass', name: '中检合格放行', dataType: 'Boolean', required: true, inputType: 'ESIGN' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // YQ-02  过滤（液体）
  // ─────────────────────────────────────────────────────────
  {
    id: 'op-yq-02',
    opCode: 'YQ-02',
    opName: '过滤',
    opShort: '过滤',
    category: 'PROD',
    workshop: '液体车间',
    productLine: '口服液制剂线',
    workCenter: 'YQ-过滤间',
    equipType: '微孔过滤器（0.45μm）',
    stdTimeMin: 60,
    prepTimeMin: 20,
    hasFirstPiece: false,
    hasLastPiece: false,
    hasPatrol: false,
    hasCleanup: true,
    envReq: 'C级洁净区',
    isBottleneck: false,
    isReportPoint: true,
    isQcPoint: true,
    status: 'ACTIVE',
    version: 'V1.8',
    effectDate: '2025-01-01',
    createdBy: '陈工',
    updatedAt: '2025-06-01',
    remark: '0.45μm微孔过滤，滤膜完整性测试（起泡点法）',
    phases: [
      {
        seq: 10, phaseCode: 'YQ-02-P01', phaseName: '滤膜完整性测试', phaseType: 'SPEC',
        required: true, eSign: true, dualReview: false, linkedDoc: '滤膜完整性测试记录',
        remark: 'GMP强制要求！过滤前后各测一次起泡点',
        fields: [
          { code: 'filter_membrane', name: '滤膜批号', dataType: 'String', required: true, inputType: 'SCAN' },
          { code: 'bubble_point_pre', name: '过滤前起泡点压力', dataType: 'Decimal', required: true, unit: 'bar', stdValue: '≥2.8', inputType: 'MANUAL' },
          { code: 'integrity_pre_pass', name: '过滤前完整性合格', dataType: 'Boolean', required: true, inputType: 'AUTO' },
        ],
      },
      {
        seq: 20, phaseCode: 'YQ-02-P02', phaseName: '过滤执行', phaseType: 'EXEC',
        required: true, eSign: false, dualReview: false,
        fields: [
          { code: 'filter_pressure', name: '过滤压力', dataType: 'Decimal', required: true, unit: 'bar', stdValue: '≤2.5', inputType: 'MANUAL' },
          { code: 'filter_vol', name: '过滤体积', dataType: 'Decimal', required: true, unit: 'L', inputType: 'MANUAL' },
          { code: 'filter_speed', name: '流速', dataType: 'Decimal', required: false, unit: 'L/h', inputType: 'MANUAL' },
        ],
      },
      {
        seq: 30, phaseCode: 'YQ-02-P03', phaseName: '过滤后完整性测试', phaseType: 'SPEC',
        required: true, eSign: true, dualReview: false,
        remark: '过滤后再测一次！不合格则该批需重新处理',
        fields: [
          { code: 'bubble_point_post', name: '过滤后起泡点压力', dataType: 'Decimal', required: true, unit: 'bar', stdValue: '≥2.8', inputType: 'MANUAL' },
          { code: 'integrity_post_pass', name: '过滤后完整性合格', dataType: 'Boolean', required: true, inputType: 'AUTO' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // YQ-03  灌装（液体）
  // ─────────────────────────────────────────────────────────
  {
    id: 'op-yq-03',
    opCode: 'YQ-03',
    opName: '灌装',
    opShort: '灌装',
    category: 'PROD',
    workshop: '液体车间',
    productLine: '口服液制剂线',
    workCenter: 'YQ-灌装间',
    equipType: '自动灌装机',
    stdTimeMin: 240,
    prepTimeMin: 45,
    hasFirstPiece: true,
    hasLastPiece: false,
    hasPatrol: true,
    patrolFreq: 1,
    hasCleanup: true,
    envReq: 'B级洁净区背景C级，无菌灌装',
    isBottleneck: false,
    isReportPoint: true,
    isQcPoint: true,
    status: 'ACTIVE',
    version: 'V1.8',
    effectDate: '2025-01-01',
    createdBy: '陈工',
    updatedAt: '2025-06-01',
    remark: '装量差异±5%，瓶盖密封性，需实时在线检测',
    phases: [
      {
        seq: 10, phaseCode: 'YQ-03-P01', phaseName: '灌装前容器检查', phaseType: 'LOAD',
        required: true, eSign: true, dualReview: false, linkedDoc: '包材检验合格报告',
        fields: [
          { code: 'bottle_batch', name: '瓶子批号', dataType: 'String', required: true, inputType: 'SCAN' },
          { code: 'bottle_clean', name: '瓶子清洁/灭菌确认', dataType: 'Boolean', required: true, inputType: 'ESIGN' },
          { code: 'cap_batch', name: '瓶盖批号', dataType: 'String', required: true, inputType: 'SCAN' },
        ],
      },
      {
        seq: 20, phaseCode: 'YQ-03-P02', phaseName: '首瓶检验', phaseType: 'SPEC',
        required: true, eSign: true, dualReview: true, linkedDoc: '首瓶检验记录',
        fields: [
          { code: 'first_fill_vol', name: '首瓶装量', dataType: 'Decimal', required: true, unit: 'mL', stdValue: '按规格±5%', inputType: 'MANUAL' },
          { code: 'first_seal', name: '首瓶密封性', dataType: 'Boolean', required: true, inputType: 'ESIGN' },
          { code: 'first_pass', name: '首瓶放行', dataType: 'Boolean', required: true, inputType: 'ESIGN' },
        ],
        photoReq: 'REQUIRED',
      },
      {
        seq: 30, phaseCode: 'YQ-03-P03', phaseName: '连续灌装', phaseType: 'EXEC',
        required: true, eSign: false, dualReview: false,
        fields: [
          { code: 'fill_speed', name: '灌装速度', dataType: 'Int', required: true, unit: '瓶/min', inputType: 'MANUAL' },
          { code: 'fill_vol', name: '装量', dataType: 'Decimal', required: true, unit: 'mL', stdValue: '按规格', inputType: 'MANUAL' },
          { code: 'bottles_filled', name: '灌装总瓶数', dataType: 'Int', required: true, unit: '瓶', inputType: 'MANUAL' },
        ],
        timeoutMin: 360,
      },
      {
        seq: 40, phaseCode: 'YQ-03-P04', phaseName: '灌装中间控制', phaseType: 'IPQC',
        required: true, eSign: false, dualReview: false, linkedDoc: '灌装在线监控记录',
        fields: [
          { code: 'fill_variation', name: '装量差异', dataType: 'Decimal', required: true, unit: '%', stdValue: '±5%', inputType: 'AUTO' },
          { code: 'seal_test', name: '密封性抽检', dataType: 'Enum', required: true, stdValue: '合格', inputType: 'SELECT' },
          { code: 'visible_particle', name: '可见异物抽检', dataType: 'Boolean', required: true, stdValue: '无', inputType: 'ESIGN' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // YQ-04  灭菌（液体）— GMP关键工序：F0≥8min
  // ─────────────────────────────────────────────────────────
  {
    id: 'op-yq-04',
    opCode: 'YQ-04',
    opName: '灭菌',
    opShort: '灭菌',
    category: 'SPEC',
    workshop: '液体车间',
    productLine: '口服液制剂线',
    workCenter: 'YQ-灭菌间',
    equipType: '旋转水浴灭菌柜',
    stdTimeMin: 120,
    prepTimeMin: 30,
    hasFirstPiece: false,
    hasLastPiece: false,
    hasPatrol: true,
    patrolFreq: 1,
    hasCleanup: false,
    envReq: '独立灭菌区',
    isBottleneck: true,
    isReportPoint: true,
    isQcPoint: true,
    status: 'ACTIVE',
    version: 'V1.8',
    effectDate: '2025-01-01',
    createdBy: '陈工',
    updatedAt: '2025-06-01',
    remark: '【GMP关键】F0值≥8min为强制标准！低于限值必须报废，不可妥协！121℃/15min',
    phases: [
      {
        seq: 10, phaseCode: 'YQ-04-P01', phaseName: '灭菌设备确认', phaseType: 'PREP',
        required: true, eSign: true, dualReview: false, linkedDoc: '灭菌设备使用记录',
        remark: '检查灭菌柜验证状态，温度探针标定',
        fields: [
          { code: 'autoclave_id', name: '灭菌柜编号', dataType: 'String', required: true, inputType: 'SCAN' },
          { code: 'valid_date', name: '验证有效期', dataType: 'Date', required: true, inputType: 'MANUAL' },
          { code: 'probe_calibration', name: '温度探针标定确认', dataType: 'Boolean', required: true, inputType: 'ESIGN' },
          { code: 'load_pattern', name: '装载方式确认', dataType: 'Boolean', required: true, inputType: 'ESIGN' },
        ],
      },
      {
        seq: 20, phaseCode: 'YQ-04-P02', phaseName: '灭菌过程监控', phaseType: 'EXEC',
        required: true, eSign: true, dualReview: false, linkedDoc: '灭菌批记录',
        remark: '自动记录温度/压力/时间曲线，不得中断',
        fields: [
          { code: 'steril_temp', name: '灭菌温度', dataType: 'Decimal', required: true, unit: '℃', stdValue: '121', inputType: 'AUTO' },
          { code: 'steril_time', name: '保温时间', dataType: 'Int', required: true, unit: 'min', stdValue: '15', inputType: 'AUTO' },
          { code: 'pressure_max', name: '最高压力', dataType: 'Decimal', required: true, unit: 'bar', inputType: 'AUTO' },
          { code: 'bi_result', name: '生物指示剂结果', dataType: 'Enum', required: false, stdValue: '阴性', inputType: 'SELECT' },
        ],
        timeoutMin: 180,
      },
      {
        seq: 30, phaseCode: 'YQ-04-P03', phaseName: 'F0值计算与确认', phaseType: 'SPEC',
        required: true, eSign: true, dualReview: true,
        linkedDoc: '灭菌F0值计算记录',
        remark: '⚠️ GMP强制要求：F0≥8min才可放行！低于8min必须整批报废，严禁放行！',
        fields: [
          { code: 'f0_value', name: 'F0值', dataType: 'Decimal', required: true, unit: 'min', stdValue: '≥8.0', inputType: 'AUTO', instrument: 'F0值计算系统' },
          { code: 'f0_pass', name: 'F0值合格（≥8min）', dataType: 'Boolean', required: true, inputType: 'AUTO' },
          { code: 'f0_reviewer', name: '双人复核签字', dataType: 'String', required: true, inputType: 'ESIGN' },
          { code: 'f0_action', name: '不合格处置（如有）', dataType: 'Enum', required: false, stdValue: '整批报废', inputType: 'SELECT' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // YQ-05  灯检（液体）
  // ─────────────────────────────────────────────────────────
  {
    id: 'op-yq-05',
    opCode: 'YQ-05',
    opName: '灯检',
    opShort: '灯检',
    category: 'INSP',
    workshop: '液体车间',
    productLine: '口服液制剂线',
    workCenter: 'YQ-灯检间',
    equipType: '灯检机/人工灯检台',
    stdTimeMin: 180,
    prepTimeMin: 10,
    hasFirstPiece: false,
    hasLastPiece: false,
    hasPatrol: false,
    hasCleanup: false,
    isBottleneck: false,
    isReportPoint: true,
    isQcPoint: true,
    status: 'ACTIVE',
    version: 'V1.8',
    effectDate: '2025-01-01',
    createdBy: '陈工',
    updatedAt: '2025-06-01',
    remark: '逐瓶检查可见异物、色泽、液位、密封性',
    phases: [
      {
        seq: 10, phaseCode: 'YQ-05-P01', phaseName: '灯检操作', phaseType: 'IPQC',
        required: true, eSign: false, dualReview: false, linkedDoc: '灯检记录',
        fields: [
          { code: 'total_bottles', name: '检查总瓶数', dataType: 'Int', required: true, unit: '瓶', inputType: 'MANUAL' },
          { code: 'reject_particle', name: '异物不合格', dataType: 'Int', required: true, unit: '瓶', inputType: 'MANUAL' },
          { code: 'reject_seal', name: '密封不合格', dataType: 'Int', required: true, unit: '瓶', inputType: 'MANUAL' },
          { code: 'reject_other', name: '其他不合格', dataType: 'Int', required: true, unit: '瓶', inputType: 'MANUAL' },
          { code: 'pass_rate', name: '灯检合格率', dataType: 'Decimal', required: true, unit: '%', stdValue: '≥99.0', inputType: 'AUTO' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // YQ-06  液体外包装
  // ─────────────────────────────────────────────────────────
  {
    id: 'op-yq-06',
    opCode: 'YQ-06',
    opName: '外包装',
    opShort: '外包',
    category: 'PACK',
    workshop: '外包车间',
    productLine: '口服液制剂线',
    workCenter: 'YQ-外包间',
    equipType: '自动装盒线',
    stdTimeMin: 120,
    prepTimeMin: 15,
    hasFirstPiece: true,
    hasLastPiece: false,
    hasPatrol: true,
    patrolFreq: 1,
    hasCleanup: false,
    isBottleneck: false,
    isReportPoint: true,
    isQcPoint: false,
    status: 'ACTIVE',
    version: 'V1.8',
    effectDate: '2025-01-01',
    createdBy: '王工',
    updatedAt: '2025-06-01',
    remark: '标签核对、说明书核对、装盒、装箱',
    phases: [
      {
        seq: 10, phaseCode: 'YQ-06-P01', phaseName: '包材/标签核对', phaseType: 'LOAD',
        required: true, eSign: true, dualReview: true, linkedDoc: '标签发放记录',
        fields: [
          { code: 'label_code', name: '标签版本核对', dataType: 'String', required: true, inputType: 'SCAN' },
          { code: 'lot_on_label', name: '标签批号核对', dataType: 'Boolean', required: true, inputType: 'ESIGN' },
          { code: 'exp_on_label', name: '标签有效期核对', dataType: 'Boolean', required: true, inputType: 'ESIGN' },
        ],
      },
      {
        seq: 20, phaseCode: 'YQ-06-P02', phaseName: '装盒装箱', phaseType: 'EXEC',
        required: true, eSign: true, dualReview: false, linkedDoc: '成品入库单',
        fields: [
          { code: 'boxes_packed', name: '装盒数量', dataType: 'Int', required: true, unit: '盒', inputType: 'MANUAL' },
          { code: 'cases_packed', name: '装箱件数', dataType: 'Int', required: true, unit: '件', inputType: 'MANUAL' },
          { code: 'yield_packing', name: '包装收率', dataType: 'Decimal', required: true, unit: '%', stdValue: '≥96.0', inputType: 'AUTO' },
          { code: 'qc_final_sign', name: '成品质量放行', dataType: 'String', required: true, inputType: 'ESIGN' },
        ],
      },
    ],
  },

];

// ============================================================
// 工序代码到ID的快速查找映射
// ============================================================
export const OPERATION_BY_CODE: Record<string, Operation> = Object.fromEntries(
  mockOperations.map(op => [op.opCode, op])
);

// 支持模糊匹配（如 GD-01 匹配到 '称量配料'）
export function findOperationByCode(code: string): Operation | undefined {
  if (!code) return undefined;
  // 精确匹配
  if (OPERATION_BY_CODE[code]) return OPERATION_BY_CODE[code];
  // 前缀匹配
  const upper = code.toUpperCase();
  return mockOperations.find(op =>
    op.opCode.toUpperCase() === upper ||
    op.opCode.toUpperCase().startsWith(upper) ||
    upper.startsWith(op.opCode.toUpperCase())
  );
}

// ============================================================
// 根据工序名称查找（fallback for API data）
// ============================================================
export function findOperationByName(name: string): Operation | undefined {
  if (!name) return undefined;
  return mockOperations.find(op =>
    op.opName === name || op.opShort === name || name.includes(op.opName) || op.opName.includes(name)
  );
}

// ============================================================
// 为工序步骤自动生成默认阶段（当找不到主数据时的fallback）
// ============================================================
export function generateDefaultPhases(stepName: string, isQcPoint: boolean, isKeyOp: boolean): OperationPhase[] {
  const phases: OperationPhase[] = [
    {
      seq: 10,
      phaseCode: 'AUTO-PREP',
      phaseName: '生产准备',
      phaseType: 'PREP',
      required: true,
      eSign: true,
      dualReview: false,
      fields: [
        { code: 'equip_ready', name: '设备就绪确认', dataType: 'Boolean', required: true, inputType: 'ESIGN' },
        { code: 'material_ready', name: '物料就绪确认', dataType: 'Boolean', required: true, inputType: 'ESIGN' },
        { code: 'clean_status', name: '清洁状态确认', dataType: 'Boolean', required: true, inputType: 'ESIGN' },
      ],
    },
    {
      seq: 20,
      phaseCode: 'AUTO-EXEC',
      phaseName: `${stepName}执行`,
      phaseType: 'EXEC',
      required: true,
      eSign: false,
      dualReview: isKeyOp,
      remark: isKeyOp ? '关键工序，需双人复核' : undefined,
      fields: [
        { code: 'start_time', name: '开始时间', dataType: 'DateTime', required: true, inputType: 'AUTO' },
        { code: 'operator', name: '操作人', dataType: 'String', required: true, inputType: 'SCAN' },
        { code: 'exec_note', name: '执行记录/备注', dataType: 'String', required: false, inputType: 'MANUAL' },
      ],
    },
  ];

  if (isQcPoint) {
    phases.push({
      seq: 30,
      phaseCode: 'AUTO-IPQC',
      phaseName: '过程质量检验',
      phaseType: 'IPQC',
      required: true,
      eSign: false,
      dualReview: false,
      linkedDoc: '中间控制检验记录',
      fields: [
        { code: 'qc_result', name: '检验结果', dataType: 'Enum', required: true, stdValue: '合格', inputType: 'SELECT' },
        { code: 'qc_remark', name: '检验备注', dataType: 'String', required: false, inputType: 'MANUAL' },
        { code: 'qc_pass', name: '质量合格放行', dataType: 'Boolean', required: true, inputType: 'ESIGN' },
      ],
    });
  }

  phases.push({
    seq: isQcPoint ? 40 : 30,
    phaseCode: 'AUTO-HAND',
    phaseName: '工序交接',
    phaseType: 'HAND',
    required: true,
    eSign: true,
    dualReview: false,
    fields: [
      { code: 'end_time', name: '完成时间', dataType: 'DateTime', required: true, inputType: 'AUTO' },
      { code: 'qty_output', name: '产出数量', dataType: 'Decimal', required: true, unit: 'kg/片/粒/瓶', inputType: 'MANUAL' },
      { code: 'handover_sign', name: '交接签字', dataType: 'String', required: true, inputType: 'ESIGN' },
    ],
  });

  return phases;
}

// ============================================================
// 旧数据兼容：路由序列（保留供其他页面引用）
// ============================================================
export const ROUTING_SEQUENCE = [
  { seq: 10,  opCode: 'GD-01', opName: '称量配料',   isBottleneck: false, isReportPoint: true,  isQcPoint: true  },
  { seq: 20,  opCode: 'GD-02', opName: '混合',        isBottleneck: false, isReportPoint: true,  isQcPoint: true  },
  { seq: 30,  opCode: 'GD-03', opName: '制粒',        isBottleneck: false, isReportPoint: true,  isQcPoint: true  },
  { seq: 40,  opCode: 'GD-04', opName: '干燥',        isBottleneck: false, isReportPoint: true,  isQcPoint: true  },
  { seq: 50,  opCode: 'GD-05', opName: '压片',        isBottleneck: true,  isReportPoint: true,  isQcPoint: true  },
  { seq: 60,  opCode: 'GD-06', opName: '铝塑包装',    isBottleneck: false, isReportPoint: true,  isQcPoint: true  },
  { seq: 70,  opCode: 'GD-07', opName: '外包装',      isBottleneck: false, isReportPoint: true,  isQcPoint: false },
  { seq: 80,  opCode: 'RN-01', opName: '配液',        isBottleneck: false, isReportPoint: true,  isQcPoint: true  },
  { seq: 90,  opCode: 'RN-02', opName: '胶皮制备',    isBottleneck: false, isReportPoint: true,  isQcPoint: true  },
  { seq: 100, opCode: 'RN-03', opName: '压制成型',    isBottleneck: true,  isReportPoint: true,  isQcPoint: true  },
  { seq: 110, opCode: 'RN-04', opName: '定型干燥',    isBottleneck: false, isReportPoint: true,  isQcPoint: true  },
  { seq: 120, opCode: 'RN-05', opName: '内检抛光',    isBottleneck: false, isReportPoint: true,  isQcPoint: true  },
  { seq: 130, opCode: 'YQ-01', opName: '配液',        isBottleneck: false, isReportPoint: true,  isQcPoint: true  },
  { seq: 140, opCode: 'YQ-02', opName: '过滤',        isBottleneck: false, isReportPoint: true,  isQcPoint: true  },
  { seq: 150, opCode: 'YQ-03', opName: '灌装',        isBottleneck: false, isReportPoint: true,  isQcPoint: true  },
  { seq: 160, opCode: 'YQ-04', opName: '灭菌',        isBottleneck: true,  isReportPoint: true,  isQcPoint: true  },
  { seq: 170, opCode: 'YQ-05', opName: '灯检',        isBottleneck: false, isReportPoint: true,  isQcPoint: true  },
  { seq: 180, opCode: 'YQ-06', opName: '外包装',      isBottleneck: false, isReportPoint: true,  isQcPoint: false },
];

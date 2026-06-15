/**
 * 天美健MES - PAD工序执行阶段定义
 * 覆盖3条工艺路径：
 *   TMJ-VITC-WG-V20  维生素C咀嚼片（湿法制粒）
 *   TMJ-VITC-DC-V10  维生素C咀嚼片（直接压片）
 *   TMJ-PROBIO-CAP-V15 益生菌胶囊（冷链）
 */

// ─────────────────────────────────────────────────────────
// 1. 基础类型定义
// ─────────────────────────────────────────────────────────

/** 字段输入类型 */
export type FieldType =
  | 'number'        // 数字录入
  | 'text'          // 文本录入
  | 'select'        // 下拉选择
  | 'scan'          // 扫码
  | 'signature'     // 电子签名
  | 'photo'         // 拍照上传
  | 'checkbox'      // 勾选确认
  | 'datetime'      // 日期时间
  | 'temperature'   // 温度专用（带单位°C）
  | 'table';        // 表格录入

/** 单个字段定义 */
export interface PhaseField {
  key: string;
  label: string;
  type: FieldType;
  required: boolean;
  unit?: string;
  min?: number;
  max?: number;
  stdValue?: string;         // 标准要求说明
  placeholder?: string;
  options?: string[];        // select 选项
  dualSign?: boolean;        // 是否需要双人签名
  tableColumns?: { key: string; label: string; type: FieldType }[];
}

/** 物料扫码项（物料一致确认阶段）*/
export interface BomMaterialItem {
  materialCode: string;
  materialName: string;
  spec: string;
  batchNo: string;
  supplier: string;
  expDate: string;
  planQty: number;
  unit: string;
  isColdChain?: boolean;
}

/** 单个阶段（Phase）定义 */
export interface PhaseDefinition {
  phaseKey: string;          // 唯一标识
  phaseName: string;         // 阶段名称
  phaseOrder: number;        // 顺序
  description: string;       // 操作说明（顶部蓝色提示文字）
  icon: string;              // emoji图标
  dualSign?: boolean;        // 是否整体需双人复核
  isColdChainCheck?: boolean;// 是否冷链温度检查阶段
  fields: PhaseField[];      // 录入字段列表
  bomMaterials?: BomMaterialItem[]; // 物料一致确认阶段的BOM物料
  sopSteps?: string[];       // SOP操作步骤列表（清场/进站等）
}

/** 工序阶段配置 */
export interface OpPhaseConfig {
  opNo: string;              // 工序编号
  opName: string;            // 工序名称
  routingCode: string;       // 所属工艺路径
  workcenterName: string;    // 车间/工作中心
  equipmentType: string;     // 设备类型
  phases: PhaseDefinition[]; // 有序阶段列表
}

// ─────────────────────────────────────────────────────────
// 2. 通用公共阶段（各工序复用）
// ─────────────────────────────────────────────────────────

/** 前清场 */
const PHASE_PRE_CLEAN = (prevProduct: string): PhaseDefinition => ({
  phaseKey: 'pre-clean',
  phaseName: '前清场',
  phaseOrder: 1,
  description: '进站前必须完成本区域清场，确认无上批遗留物料/文件/标签',
  icon: '🧹',
  fields: [],
  sopSteps: [
    `检查车间/设备表面无上批产品「${prevProduct}」残留`,
    '清洁地面、墙壁、设备表面（抹布+75%酒精）',
    '检查并清除上批批记录、标签、空容器',
    '检查设备清洁状态标识（清洁有效期内）',
    '确认温湿度符合本工序要求（温度18-26°C，湿度30-65%RH）',
    '拍照留存清场证据（至少1张）',
    'QA/操作员签字确认',
  ],
});

/** 进站确认 */
const PHASE_ENTRY: PhaseDefinition = {
  phaseKey: 'entry',
  phaseName: '进站',
  phaseOrder: 2,
  description: '扫描工单二维码进站，绑定操作员与设备，确认生产指令',
  icon: '🚪',
  fields: [
    {
      key: 'woScan',
      label: '工单二维码扫描',
      type: 'scan',
      required: true,
      stdValue: '扫描工单随附二维码条形码',
      placeholder: '请扫描工单二维码',
    },
    {
      key: 'equipScan',
      label: '设备编号扫码绑定',
      type: 'scan',
      required: true,
      placeholder: '扫描设备铭牌二维码',
    },
    {
      key: 'temperature',
      label: '环境温度',
      type: 'temperature',
      required: true,
      unit: '°C',
      min: 18,
      max: 26,
      stdValue: '18~26°C',
    },
    {
      key: 'humidity',
      label: '相对湿度',
      type: 'number',
      required: true,
      unit: '%RH',
      min: 30,
      max: 65,
      stdValue: '30~65%RH',
    },
    {
      key: 'operatorSign',
      label: '操作员电子签名',
      type: 'signature',
      required: true,
    },
  ],
};

/** 出站报工 */
const PHASE_REPORT: PhaseDefinition = {
  phaseKey: 'report',
  phaseName: '报工',
  phaseOrder: 98,
  description: '填写实际完成数量、合格/不合格数量，提交工序完工报告',
  icon: '📋',
  fields: [
    {
      key: 'actualQty',
      label: '实际完成数量',
      type: 'number',
      required: true,
      unit: 'kg/粒',
      placeholder: '输入实际产出量',
    },
    {
      key: 'qualifiedQty',
      label: '合格数量',
      type: 'number',
      required: true,
      unit: 'kg/粒',
    },
    {
      key: 'unqualifiedQty',
      label: '不合格数量',
      type: 'number',
      required: false,
      unit: 'kg/粒',
    },
    {
      key: 'yieldRate',
      label: '本工序收率',
      type: 'number',
      required: true,
      unit: '%',
      stdValue: '依工艺收率下限判定',
    },
    {
      key: 'remark',
      label: '异常备注',
      type: 'text',
      required: false,
      placeholder: '如有异常情况请填写，无则填"无"',
    },
    {
      key: 'operatorSign',
      label: '操作员签名',
      type: 'signature',
      required: true,
    },
  ],
};

/** 出站 */
const PHASE_EXIT: PhaseDefinition = {
  phaseKey: 'exit',
  phaseName: '出站',
  phaseOrder: 99,
  description: '工序完成，中间体贴签移交，工单出站',
  icon: '✅',
  fields: [
    {
      key: 'semiProductLabel',
      label: '中间体标签贴签确认',
      type: 'checkbox',
      required: true,
      stdValue: '物料名称/批号/数量/生产日期须填写完整',
    },
    {
      key: 'handoverScan',
      label: '移交接收人工牌扫码',
      type: 'scan',
      required: true,
      placeholder: '扫描接收人工牌',
    },
    {
      key: 'finalSign',
      label: '操作员最终签名',
      type: 'signature',
      required: true,
    },
  ],
};

// ─────────────────────────────────────────────────────────
// 3. 路径 TMJ-VITC-WG-V20：VitC湿法制粒
// ─────────────────────────────────────────────────────────

/**
 * OP-10 称量配料（湿法制粒路径）
 * 车间：南京固体制剂车间 / 设备：电子称量系统
 */
const OP10_WG: OpPhaseConfig = {
  opNo: 'OP-10',
  opName: '称量配料',
  routingCode: 'TMJ-VITC-WG-V20',
  workcenterName: '南京-固体制剂车间',
  equipmentType: '精密电子天平/称量系统',
  phases: [
    PHASE_PRE_CLEAN('上批产品'),
    PHASE_ENTRY,
    {
      phaseKey: 'material-verify',
      phaseName: '物料一致确认',
      phaseOrder: 3,
      description: '逐一扫描物料标签，核对名称、批号、数量与BOM一致；检查物料状态标签（"已放行"或"合格"）',
      icon: '📦',
      fields: [
        {
          key: 'materialScan',
          label: '物料扫码验证',
          type: 'scan',
          required: true,
          placeholder: '扫描物料标签条形码',
          stdValue: '逐一扫码，系统自动校验BOM一致性',
        },
        {
          key: 'operatorSign',
          label: '操作员电子签名',
          type: 'signature',
          required: true,
        },
      ],
      bomMaterials: [
        { materialCode: 'RM-VITC-001', materialName: '维生素C（抗坏血酸）', spec: '食品级USP', batchNo: 'VITC-20260510-A', supplier: '华北制药', expDate: '2027-05-10', planQty: 200, unit: 'kg' },
        { materialCode: 'RM-SORB-001', materialName: '山梨糖醇', spec: '食品级', batchNo: 'SORB-20260501-B', supplier: '华康股份', expDate: '2027-05-01', planQty: 80, unit: 'kg' },
        { materialCode: 'RM-PVPK30-001', materialName: 'PVP K30（黏合剂）', spec: '药用级', batchNo: 'PVP-20260415-C', supplier: 'BASF', expDate: '2027-04-15', planQty: 6, unit: 'kg' },
        { materialCode: 'RM-MGST-001', materialName: '硬脂酸镁（润滑剂）', spec: '药用级Ph.Eur', batchNo: 'MGST-20260420-A', supplier: '三力制药', expDate: '2027-04-20', planQty: 2, unit: 'kg' },
        { materialCode: 'RM-MNFLT-001', materialName: '甘露醇', spec: '食品级', batchNo: 'MNFLT-20260508-D', supplier: '华康股份', expDate: '2027-05-08', planQty: 30, unit: 'kg' },
        { materialCode: 'RM-FLAV-001', materialName: '橙味香精', spec: '食品添加剂级', batchNo: 'FLAV-20260501-A', supplier: '国际香料', expDate: '2027-05-01', planQty: 0.5, unit: 'kg' },
      ],
    },
    {
      phaseKey: 'weighing',
      phaseName: '称量执行',
      phaseOrder: 4,
      description: '按批次配料单逐一称量，每种物料称量后记录实称量，允许偏差±0.1%',
      icon: '⚖️',
      fields: [
        {
          key: 'scaleScan',
          label: '电子天平扫码绑定',
          type: 'scan',
          required: true,
          placeholder: '扫描天平铭牌二维码',
          stdValue: '核查天平校准有效期',
        },
        {
          key: 'vitcActual',
          label: 'VC实称量',
          type: 'number',
          required: true,
          unit: 'kg',
          stdValue: '200.000 ± 0.200 kg',
          placeholder: '输入实际称量值',
        },
        {
          key: 'sorbActual',
          label: '山梨糖醇实称量',
          type: 'number',
          required: true,
          unit: 'kg',
          stdValue: '80.000 ± 0.080 kg',
          placeholder: '输入实际称量值',
        },
        {
          key: 'pvpActual',
          label: 'PVP K30实称量',
          type: 'number',
          required: true,
          unit: 'kg',
          stdValue: '6.000 ± 0.006 kg',
          placeholder: '输入实际称量值',
        },
        {
          key: 'mgstActual',
          label: '硬脂酸镁实称量',
          type: 'number',
          required: true,
          unit: 'kg',
          stdValue: '2.000 ± 0.002 kg',
          placeholder: '输入实际称量值',
        },
        {
          key: 'mnfltActual',
          label: '甘露醇实称量',
          type: 'number',
          required: true,
          unit: 'kg',
          stdValue: '30.000 ± 0.030 kg',
          placeholder: '输入实际称量值',
        },
        {
          key: 'flavActual',
          label: '橙味香精实称量',
          type: 'number',
          required: true,
          unit: 'kg',
          stdValue: '0.500 ± 0.001 kg',
          placeholder: '输入实际称量值',
        },
        {
          key: 'deviationCheck',
          label: '偏差校验（系统自动计算）',
          type: 'checkbox',
          required: true,
          stdValue: '所有物料偏差≤±0.1%方可继续',
        },
        {
          key: 'operatorSign',
          label: '操作员签名',
          type: 'signature',
          required: true,
        },
        {
          key: 'reviewerSign',
          label: '复核员签名',
          type: 'signature',
          required: true,
          dualSign: true,
        },
      ],
    },
    PHASE_REPORT,
    PHASE_EXIT,
  ],
};

/**
 * OP-20 湿法制粒
 */
const OP20_WG: OpPhaseConfig = {
  opNo: 'OP-20',
  opName: '制粒（湿法）',
  routingCode: 'TMJ-VITC-WG-V20',
  workcenterName: '南京-固体制剂车间',
  equipmentType: '高速湿法制粒机（HLSG系列）',
  phases: [
    PHASE_PRE_CLEAN('上批产品'),
    PHASE_ENTRY,
    {
      phaseKey: 'material-verify',
      phaseName: '物料一致确认',
      phaseOrder: 3,
      description: '核查来自称量工序的中间体，确认品名/批号/数量与工单一致',
      icon: '📦',
      fields: [
        { key: 'materialScan', label: '中间体袋标签扫码', type: 'scan', required: true, placeholder: '扫描中间体袋标签二维码' },
        { key: 'operatorSign', label: '操作员签名', type: 'signature', required: true },
      ],
      bomMaterials: [
        { materialCode: 'WIP-WEIGHING-001', materialName: '称量配料中间体', spec: '维生素C配方混合粉', batchNo: 'TMJ-VITC-20260605-002', supplier: '内部转序', expDate: '2026-06-07', planQty: 318.5, unit: 'kg' },
        { materialCode: 'RM-PVPETHANOL-001', materialName: 'PVP K30乙醇液（黏合液）', spec: '8% w/v, 95%乙醇', batchNo: 'PVPE-20260605-A', supplier: '内部配制', expDate: '2026-06-06', planQty: 50, unit: 'L' },
      ],
    },
    {
      phaseKey: 'granulation-param',
      phaseName: '制粒参数设定',
      phaseOrder: 4,
      description: '设定制粒机参数：搅拌转速/切割转速/加液速度，开机制粒',
      icon: '⚙️',
      fields: [
        {
          key: 'equipScan',
          label: '制粒机扫码绑定',
          type: 'scan',
          required: true,
          placeholder: '扫描设备铭牌二维码',
        },
        {
          key: 'stirSpeed',
          label: '搅拌桨转速',
          type: 'number',
          required: true,
          unit: 'rpm',
          min: 150,
          max: 300,
          stdValue: '200±20 rpm',
          placeholder: '输入设定转速',
        },
        {
          key: 'cutSpeed',
          label: '切割刀转速',
          type: 'number',
          required: true,
          unit: 'rpm',
          min: 800,
          max: 1500,
          stdValue: '1000±50 rpm',
          placeholder: '输入切割刀转速',
        },
        {
          key: 'addLiquidRate',
          label: '黏合液加液速率',
          type: 'number',
          required: true,
          unit: 'mL/min',
          min: 100,
          max: 300,
          stdValue: '200±20 mL/min',
          placeholder: '输入加液速率',
        },
        {
          key: 'mixTime',
          label: '干混时间',
          type: 'number',
          required: true,
          unit: 'min',
          min: 3,
          max: 8,
          stdValue: '5±1 min',
        },
        {
          key: 'wetGranTime',
          label: '湿法制粒时间',
          type: 'number',
          required: true,
          unit: 'min',
          min: 5,
          max: 15,
          stdValue: '8±2 min',
        },
      ],
    },
    {
      phaseKey: 'endpoint-check',
      phaseName: '制粒终点判断',
      phaseOrder: 5,
      description: '制粒终点判断：手捏成团、轻压能散，颗粒均匀，无大块结团',
      icon: '🔍',
      dualSign: true,
      fields: [
        {
          key: 'handTest',
          label: '手捏成团测试',
          type: 'select',
          required: true,
          options: ['合格（成团轻压能散）', '颗粒太干（需补液）', '颗粒太湿（延长制粒）'],
          stdValue: '手捏成团、轻压能散',
        },
        {
          key: 'appearanceCheck',
          label: '颗粒外观检查',
          type: 'select',
          required: true,
          options: ['合格（均匀，无大结块）', '不合格（有大结块）', '不合格（色泽不均）'],
        },
        {
          key: 'endpointPhoto',
          label: '终点颗粒照片',
          type: 'photo',
          required: true,
          stdValue: '至少拍摄1张颗粒状态照片',
        },
        {
          key: 'operatorSign',
          label: '操作员签名',
          type: 'signature',
          required: true,
        },
        {
          key: 'qaSupervisorSign',
          label: 'QA监督员签名',
          type: 'signature',
          required: true,
          dualSign: true,
        },
      ],
    },
    PHASE_REPORT,
    PHASE_EXIT,
  ],
};

/**
 * OP-25 流化床干燥
 */
const OP25_WG: OpPhaseConfig = {
  opNo: 'OP-25',
  opName: '流化床干燥',
  routingCode: 'TMJ-VITC-WG-V20',
  workcenterName: '南京-固体制剂车间',
  equipmentType: '流化床干燥机（FBD）',
  phases: [
    PHASE_PRE_CLEAN('上批颗粒'),
    PHASE_ENTRY,
    {
      phaseKey: 'material-verify',
      phaseName: '物料一致确认',
      phaseOrder: 3,
      description: '核查来自制粒工序的湿颗粒，确认品名/批号/数量与工单一致',
      icon: '📦',
      fields: [
        { key: 'materialScan', label: '湿颗粒料桶标签扫码', type: 'scan', required: true, placeholder: '扫描料桶标签二维码' },
        { key: 'operatorSign', label: '操作员签名', type: 'signature', required: true },
      ],
      bomMaterials: [
        { materialCode: 'WIP-GRAN-001', materialName: '湿法制粒颗粒（湿态）', spec: 'VitC咀嚼片湿颗粒', batchNo: 'TMJ-VITC-20260605-002', supplier: '内部转序', expDate: '2026-06-05', planQty: 320, unit: 'kg' },
      ],
    },
    {
      phaseKey: 'drying-param',
      phaseName: '干燥参数设定与执行',
      phaseOrder: 4,
      description: '设定流化床进风温度、产品温度上限，开始干燥，每30分钟记录一次参数',
      icon: '🌡️',
      fields: [
        {
          key: 'inletTemp',
          label: '进风温度设定',
          type: 'temperature',
          required: true,
          unit: '°C',
          min: 55,
          max: 65,
          stdValue: '60±5°C',
        },
        {
          key: 'productTempMax',
          label: '产品温度上限',
          type: 'temperature',
          required: true,
          unit: '°C',
          min: 40,
          max: 50,
          stdValue: '≤45°C（保护VC活性）',
        },
        {
          key: 'dryingTime',
          label: '干燥总时间',
          type: 'number',
          required: true,
          unit: 'min',
          min: 60,
          max: 120,
          stdValue: '视含水量终点，通常90±30 min',
        },
        {
          key: 'paramRecord',
          label: '参数过程记录（每30min）',
          type: 'table',
          required: true,
          tableColumns: [
            { key: 'timePoint', label: '记录时间', type: 'datetime' },
            { key: 'inletTempActual', label: '进风温度(°C)', type: 'number' },
            { key: 'productTempActual', label: '产品温度(°C)', type: 'number' },
            { key: 'outletTempActual', label: '出口温度(°C)', type: 'number' },
            { key: 'airflowActual', label: '风量(m³/h)', type: 'number' },
          ],
        },
      ],
    },
    {
      phaseKey: 'moisture-check',
      phaseName: '干燥终点水分检测',
      phaseOrder: 5,
      description: '取样检测颗粒水分含量，判定是否达到干燥终点（水分≤2.0%）',
      icon: '💧',
      dualSign: true,
      fields: [
        {
          key: 'moistureValue',
          label: '颗粒水分含量（LOD）',
          type: 'number',
          required: true,
          unit: '%',
          max: 2.0,
          stdValue: '≤2.0%（干燥失重法）',
          placeholder: '输入水分仪测定值',
        },
        {
          key: 'moistureInstrumentScan',
          label: '水分仪扫码绑定',
          type: 'scan',
          required: true,
          placeholder: '扫描水分仪铭牌二维码',
        },
        {
          key: 'endpointJudge',
          label: '终点判定结论',
          type: 'select',
          required: true,
          options: ['合格（水分≤2.0%，转下工序）', '不合格（继续干燥）', '不合格（需重工评估）'],
        },
        {
          key: 'endpointPhoto',
          label: '干颗粒照片',
          type: 'photo',
          required: true,
          stdValue: '至少1张',
        },
        {
          key: 'operatorSign',
          label: '操作员签名',
          type: 'signature',
          required: true,
        },
        {
          key: 'qaSign',
          label: 'QA签名确认',
          type: 'signature',
          required: true,
          dualSign: true,
        },
      ],
    },
    PHASE_REPORT,
    PHASE_EXIT,
  ],
};

/**
 * OP-35 总混
 */
const OP35_WG: OpPhaseConfig = {
  opNo: 'OP-35',
  opName: '总混',
  routingCode: 'TMJ-VITC-WG-V20',
  workcenterName: '南京-固体制剂车间',
  equipmentType: '三维运动混合机',
  phases: [
    PHASE_PRE_CLEAN('上批颗粒'),
    PHASE_ENTRY,
    {
      phaseKey: 'material-verify',
      phaseName: '物料一致确认',
      phaseOrder: 3,
      description: '核查干颗粒、外加辅料（硬脂酸镁）与工单一致',
      icon: '📦',
      fields: [
        { key: 'materialScan', label: '干颗粒/辅料标签扫码', type: 'scan', required: true, placeholder: '扫描物料标签' },
        { key: 'operatorSign', label: '操作员签名', type: 'signature', required: true },
      ],
      bomMaterials: [
        { materialCode: 'WIP-DRY-GRAN-001', materialName: '干颗粒（VitC）', spec: '水分≤2.0%', batchNo: 'TMJ-VITC-20260605-002', supplier: '内部转序', expDate: '2026-06-10', planQty: 310, unit: 'kg' },
        { materialCode: 'RM-MGST-001', materialName: '硬脂酸镁（外加）', spec: '药用级', batchNo: 'MGST-20260420-A', supplier: '三力制药', expDate: '2027-04-20', planQty: 1.5, unit: 'kg' },
      ],
    },
    {
      phaseKey: 'blending',
      phaseName: '总混参数执行',
      phaseOrder: 4,
      description: '设定混合机转速和时间，确保辅料均匀分布',
      icon: '🔄',
      fields: [
        {
          key: 'mixerSpeed',
          label: '混合机转速',
          type: 'number',
          required: true,
          unit: 'rpm',
          min: 8,
          max: 15,
          stdValue: '10±2 rpm',
        },
        {
          key: 'mixTime',
          label: '混合时间',
          type: 'number',
          required: true,
          unit: 'min',
          min: 10,
          max: 20,
          stdValue: '15±3 min',
        },
        {
          key: 'loadFactor',
          label: '装载系数',
          type: 'number',
          required: true,
          unit: '%',
          min: 40,
          max: 75,
          stdValue: '40~75%（超出范围须偏差处理）',
        },
      ],
    },
    {
      phaseKey: 'uniformity-check',
      phaseName: '均匀性取样',
      phaseOrder: 5,
      description: '混合结束后取上、中、下3点样品送QC检测含量均匀度',
      icon: '🔬',
      fields: [
        {
          key: 'samplingTop',
          label: '上层取样量',
          type: 'number',
          required: true,
          unit: 'g',
          stdValue: '取样约50g',
        },
        {
          key: 'samplingMid',
          label: '中层取样量',
          type: 'number',
          required: true,
          unit: 'g',
          stdValue: '取样约50g',
        },
        {
          key: 'samplingBot',
          label: '下层取样量',
          type: 'number',
          required: true,
          unit: 'g',
          stdValue: '取样约50g',
        },
        {
          key: 'samplingSign',
          label: '取样操作员签名',
          type: 'signature',
          required: true,
        },
        {
          key: 'qcSubmitRecord',
          label: 'QC送检记录号',
          type: 'text',
          required: true,
          placeholder: '输入QC送检单编号',
        },
      ],
    },
    PHASE_REPORT,
    PHASE_EXIT,
  ],
};

/**
 * OP-40 压片
 */
const OP40_WG: OpPhaseConfig = {
  opNo: 'OP-40',
  opName: '压片',
  routingCode: 'TMJ-VITC-WG-V20',
  workcenterName: '南京-固体制剂车间',
  equipmentType: '旋转式压片机',
  phases: [
    PHASE_PRE_CLEAN('上批产品'),
    PHASE_ENTRY,
    {
      phaseKey: 'material-verify',
      phaseName: '物料一致确认',
      phaseOrder: 3,
      description: '核查总混颗粒，确认品名/批号/数量与压片工单一致',
      icon: '📦',
      fields: [
        { key: 'materialScan', label: '总混颗粒料桶标签扫码', type: 'scan', required: true, placeholder: '扫描料桶标签' },
        { key: 'operatorSign', label: '操作员签名', type: 'signature', required: true },
      ],
      bomMaterials: [
        { materialCode: 'WIP-BLEND-001', materialName: '总混颗粒（VitC）', spec: '含量均匀度合格', batchNo: 'TMJ-VITC-20260605-002', supplier: '内部转序', expDate: '2026-06-12', planQty: 311.5, unit: 'kg' },
      ],
    },
    {
      phaseKey: 'first-piece',
      phaseName: '首件检验',
      phaseOrder: 4,
      description: '开机后前15min抽取10片进行首件检验：片重、硬度、厚度、脆碎度、崩解时限',
      icon: '🏅',
      dualSign: true,
      fields: [
        {
          key: 'instrumentScan',
          label: '检验量具/仪器扫码绑定',
          type: 'scan',
          required: true,
          placeholder: '扫描天平/硬度计等仪器铭牌',
          stdValue: '天平+硬度仪+卡尺+脆碎度仪+崩解仪',
        },
        {
          key: 'tabletWeight',
          label: '片重（10片平均值）',
          type: 'number',
          required: true,
          unit: 'mg',
          min: 980,
          max: 1020,
          stdValue: '1000±20 mg（与理论片重对比，偏差≤±2%）',
          placeholder: '输入平均片重（mg）',
        },
        {
          key: 'tabletHardness',
          label: '片剂硬度',
          type: 'number',
          required: true,
          unit: 'N',
          min: 50,
          max: 150,
          stdValue: '80~120 N',
          placeholder: '输入硬度值（N）',
        },
        {
          key: 'tabletThickness',
          label: '片剂厚度',
          type: 'number',
          required: true,
          unit: 'mm',
          min: 4.8,
          max: 5.2,
          stdValue: '5.0±0.2 mm',
          placeholder: '输入厚度（mm）',
        },
        {
          key: 'friability',
          label: '脆碎度',
          type: 'number',
          required: true,
          unit: '%',
          max: 0.8,
          stdValue: '≤0.8%',
          placeholder: '输入脆碎度（%）',
        },
        {
          key: 'disintegration',
          label: '崩解时限',
          type: 'number',
          required: true,
          unit: 'min',
          max: 30,
          stdValue: '≤30 min（口嚼片）',
          placeholder: '输入崩解时限（min）',
        },
        {
          key: 'appearance',
          label: '外观检查',
          type: 'select',
          required: true,
          options: ['合格（无粘冲/花斑/裂片）', '不合格-粘冲', '不合格-裂片', '不合格-花斑'],
          stdValue: '无粘冲、无花斑、无裂片',
        },
        {
          key: 'firstPiecePhoto',
          label: '首件照片',
          type: 'photo',
          required: true,
          stdValue: '至少1张，清晰可见片面',
        },
        {
          key: 'firstPieceJudge',
          label: '首件判定结论',
          type: 'select',
          required: true,
          options: ['合格（允许批量生产）', '不合格（需调机后重验）'],
        },
        {
          key: 'inspectorSign',
          label: '检验员工牌扫码',
          type: 'scan',
          required: true,
          placeholder: '扫描检验员工牌',
        },
        {
          key: 'reviewerSign',
          label: '复核员工牌扫码',
          type: 'scan',
          required: true,
          dualSign: true,
          placeholder: '扫描复核员工牌（双人复核）',
        },
      ],
    },
    {
      phaseKey: 'tablet-process',
      phaseName: '压片过程控制',
      phaseOrder: 5,
      description: '批量压片过程中，每30分钟抽检片重/硬度，记录设备运行参数',
      icon: '📊',
      fields: [
        {
          key: 'pressMachineSpeed',
          label: '压片机转速',
          type: 'number',
          required: true,
          unit: 'rpm',
          min: 20,
          max: 50,
          stdValue: '30~40 rpm（依实际调整）',
        },
        {
          key: 'mainPressure',
          label: '主压力',
          type: 'number',
          required: true,
          unit: 'kN',
          min: 5,
          max: 20,
          stdValue: '依片重/硬度调整，通常10~15 kN',
        },
        {
          key: 'processRecord',
          label: '过程检验记录（每30min）',
          type: 'table',
          required: true,
          tableColumns: [
            { key: 'timePoint', label: '检验时间', type: 'datetime' },
            { key: 'weightCheck', label: '片重(mg)', type: 'number' },
            { key: 'hardnessCheck', label: '硬度(N)', type: 'number' },
            { key: 'completedQty', label: '累计完成量(万片)', type: 'number' },
            { key: 'anomaly', label: '异常描述', type: 'text' },
          ],
        },
      ],
    },
    PHASE_REPORT,
    PHASE_EXIT,
  ],
};

/**
 * OP-45 素片中检（QC）
 */
const OP45_WG: OpPhaseConfig = {
  opNo: 'OP-45',
  opName: '素片中检（QC）',
  routingCode: 'TMJ-VITC-WG-V20',
  workcenterName: '南京-QC检验室',
  equipmentType: 'QC检验设备（全套）',
  phases: [
    PHASE_ENTRY,
    {
      phaseKey: 'sample-receipt',
      phaseName: '样品接收与登记',
      phaseOrder: 3,
      description: '接收压片工序送检的素片样品，登记样品信息，核对送检单与批记录',
      icon: '📥',
      fields: [
        { key: 'sampleBarcode', label: '样品条形码扫描', type: 'scan', required: true, placeholder: '扫描样品袋条形码' },
        { key: 'sampleQty', label: '送检数量', type: 'number', required: true, unit: '片', placeholder: '核对送检片数' },
        { key: 'receiveSign', label: '接收人签名', type: 'signature', required: true },
      ],
    },
    {
      phaseKey: 'qc-inspection',
      phaseName: '半成品检验',
      phaseOrder: 4,
      description: '按《半成品检验规程》逐项检验：外观/片重差异/硬度/崩解时限，填写检验记录',
      icon: '🔬',
      dualSign: true,
      fields: [
        {
          key: 'inspectEquipScan',
          label: '检验设备扫码绑定（必须）',
          type: 'scan',
          required: true,
          placeholder: '扫描检验设备铭牌',
          stdValue: '检验设备信息将关联到本检验记录，请务必扫码绑定',
        },
        {
          key: 'appearance',
          label: '外观检查',
          type: 'select',
          required: true,
          options: ['合格（形状规整，色泽均匀，无缺角/粘冲/裂片）', '不合格-有缺角', '不合格-有粘冲痕', '不合格-色泽不均'],
          stdValue: '依《产品技术要求》：形状规整，色泽均匀，无缺角/粘冲/裂片',
        },
        {
          key: 'weightVariation',
          label: '片重差异（取20片）',
          type: 'number',
          required: true,
          unit: '%',
          max: 5.0,
          stdValue: '片重差异限度±5.0%（中国药典法）',
          placeholder: '输入最大偏差%',
        },
        {
          key: 'hardnessAvg',
          label: '硬度平均值（取6片）',
          type: 'number',
          required: true,
          unit: 'N',
          min: 50,
          max: 150,
          stdValue: '80~120 N',
        },
        {
          key: 'disintegrationTime',
          label: '崩解时限（6片）',
          type: 'number',
          required: true,
          unit: 'min',
          max: 30,
          stdValue: '≤30 min（口嚼片/溶出性）',
        },
        {
          key: 'vitcContent',
          label: 'VC含量测定（HPLC）',
          type: 'number',
          required: true,
          unit: '%（标示量）',
          min: 93,
          max: 107,
          stdValue: '93.0%~107.0%（标示量500mg/片）',
          placeholder: '输入HPLC测定结果',
        },
        {
          key: 'qcConclusion',
          label: '检验结论',
          type: 'select',
          required: true,
          options: ['本批次产品符合产品技术要求（合格）', '本批次不合格，不予放行'],
        },
        {
          key: 'inspectorSign',
          label: '检验员签名',
          type: 'signature',
          required: true,
        },
        {
          key: 'reviewerSign',
          label: '审核员签名',
          type: 'signature',
          required: true,
          dualSign: true,
        },
      ],
    },
    {
      phaseKey: 'release-decision',
      phaseName: '中间体放行判定',
      phaseOrder: 5,
      description: '基于检验结果做出中间体放行或暂停判定，记录放行批号',
      icon: '✅',
      fields: [
        {
          key: 'releaseDecision',
          label: '中间体放行决定',
          type: 'select',
          required: true,
          options: ['放行（转内包装工序）', '暂停（等待QA复核）', '拒绝（开偏差单）'],
        },
        {
          key: 'qaSign',
          label: 'QA放行签名',
          type: 'signature',
          required: true,
        },
      ],
    },
    PHASE_REPORT,
    PHASE_EXIT,
  ],
};

/**
 * OP-60 内包装（铝塑）
 */
const OP60_WG: OpPhaseConfig = {
  opNo: 'OP-60',
  opName: '内包装（铝塑）',
  routingCode: 'TMJ-VITC-WG-V20',
  workcenterName: '南京-包装车间',
  equipmentType: '铝塑泡罩包装机',
  phases: [
    PHASE_PRE_CLEAN('上批产品'),
    PHASE_ENTRY,
    {
      phaseKey: 'material-verify',
      phaseName: '物料一致确认',
      phaseOrder: 3,
      description: '核查素片及铝箔/PVC膜包材，确认批号、数量与工单一致；检查包材有效期',
      icon: '📦',
      fields: [
        { key: 'materialScan', label: '包材/素片标签扫码', type: 'scan', required: true, placeholder: '逐一扫描包材标签' },
        { key: 'aluminumFoilBatch', label: '铝箔膜批号确认', type: 'text', required: true, stdValue: '核对铝箔批号与工单一致', placeholder: '输入或扫描铝箔批号' },
        { key: 'pvcFilmBatch', label: 'PVC硬片批号确认', type: 'text', required: true, placeholder: '输入或扫描PVC硬片批号' },
        { key: 'operatorSign', label: '操作员签名', type: 'signature', required: true },
      ],
      bomMaterials: [
        { materialCode: 'WIP-TABLET-001', materialName: '素片（VitC咀嚼片）', spec: '已通过QC中检放行', batchNo: 'TMJ-VITC-20260605-002', supplier: '内部转序', expDate: '2026-06-15', planQty: 600000, unit: '片' },
        { materialCode: 'PM-ALFOIL-001', materialName: '复合铝箔膜', spec: 'OPA/AL/PVC 250/25/60μm', batchNo: 'ALF-20260520-A', supplier: '上海铝业', expDate: '2027-05-20', planQty: 12, unit: '卷' },
        { materialCode: 'PM-PVC-001', materialName: 'PVC硬片', spec: '0.25mm食品级透明', batchNo: 'PVC-20260518-B', supplier: '广州包材', expDate: '2027-05-18', planQty: 8, unit: '卷' },
      ],
    },
    {
      phaseKey: 'blister-first-piece',
      phaseName: '铝塑首件检验',
      phaseOrder: 4,
      description: '开机后首批泡罩首件检验：封合质量/泄漏/批号打码/计数准确性',
      icon: '🏅',
      dualSign: true,
      fields: [
        {
          key: 'sealTemp',
          label: '封合温度',
          type: 'temperature',
          required: true,
          unit: '°C',
          min: 160,
          max: 200,
          stdValue: '180±10°C（依铝箔材质调整）',
        },
        {
          key: 'sealPressure',
          label: '封合压力',
          type: 'number',
          required: true,
          unit: 'MPa',
          min: 0.3,
          max: 0.8,
          stdValue: '0.5±0.1 MPa',
        },
        {
          key: 'leakageTest',
          label: '泄漏检测（真空法）',
          type: 'select',
          required: true,
          options: ['合格（无泄漏，≥-80kPa真空维持30s）', '不合格（有泄漏，停机调整）'],
          stdValue: '≥-80kPa真空压力维持30秒无泄漏',
        },
        {
          key: 'batchPrintCheck',
          label: '批号/有效期打码核查',
          type: 'text',
          required: true,
          stdValue: '批号：TMJ-VITC-20260605-002，有效期：2027-06',
          placeholder: '输入实际打印批号',
        },
        {
          key: 'tabletCountPerBlister',
          label: '每板片数核查',
          type: 'number',
          required: true,
          unit: '片/板',
          stdValue: '10片/板（规格：10片×6板/大板）',
        },
        {
          key: 'firstPiecePhoto',
          label: '首件铝塑板照片',
          type: 'photo',
          required: true,
          stdValue: '至少1张，清晰展示批号打码',
        },
        {
          key: 'firstPieceJudge',
          label: '首件判定',
          type: 'select',
          required: true,
          options: ['合格（允许批量生产）', '不合格（调机重验）'],
        },
        {
          key: 'inspectorSign', label: '检验员工牌扫码', type: 'scan', required: true, placeholder: '扫描检验员工牌',
        },
        {
          key: 'reviewerSign', label: '复核员工牌扫码', type: 'scan', required: true, dualSign: true, placeholder: '扫描复核员工牌（双人复核）',
        },
      ],
    },
    PHASE_REPORT,
    PHASE_EXIT,
  ],
};

/**
 * OP-70 外包装装盒
 */
const OP70_WG: OpPhaseConfig = {
  opNo: 'OP-70',
  opName: '外包装装盒',
  routingCode: 'TMJ-VITC-WG-V20',
  workcenterName: '南京-包装车间',
  equipmentType: '装盒机/打码机',
  phases: [
    PHASE_PRE_CLEAN('上批产品'),
    PHASE_ENTRY,
    {
      phaseKey: 'material-verify',
      phaseName: '物料一致确认',
      phaseOrder: 3,
      description: '核查铝塑板（内包成品）、纸盒、说明书、装箱材料批号与工单一致',
      icon: '📦',
      fields: [
        { key: 'materialScan', label: '外包材标签扫码', type: 'scan', required: true, placeholder: '扫描纸盒/说明书标签' },
        { key: 'operatorSign', label: '操作员签名', type: 'signature', required: true },
      ],
      bomMaterials: [
        { materialCode: 'WIP-BLISTER-001', materialName: '铝塑泡罩板（内包成品）', spec: '10片×6板/大板', batchNo: 'TMJ-VITC-20260605-002', supplier: '内部转序', expDate: '2026-06-20', planQty: 10000, unit: '大板' },
        { materialCode: 'PM-BOX-001', materialName: '彩印纸盒', spec: '60片/盒规格，含防伪码', batchNo: 'BOX-20260520-C', supplier: '上海印刷', expDate: '2028-05-20', planQty: 10000, unit: '个' },
        { materialCode: 'PM-MANUAL-001', materialName: '产品说明书', spec: 'A4折叠版', batchNo: 'MAN-20260518-A', supplier: '上海印刷', expDate: '2028-05-18', planQty: 10000, unit: '张' },
      ],
    },
    {
      phaseKey: 'boxing-control',
      phaseName: '装盒过程控制',
      phaseOrder: 4,
      description: '装量核对、批号/有效期打码核查，装箱计数',
      icon: '📦',
      fields: [
        {
          key: 'batchCodePrint',
          label: '纸盒批号打码核查',
          type: 'text',
          required: true,
          stdValue: '批号：TMJ-VITC-20260605-002，有效期：2027/06',
          placeholder: '输入实际打码信息确认',
        },
        {
          key: 'blisterPerBox',
          label: '每盒铝塑板数量',
          type: 'number',
          required: true,
          unit: '板/盒',
          stdValue: '6板/盒（即60片/盒）',
        },
        {
          key: 'manualInserted',
          label: '说明书插入确认',
          type: 'checkbox',
          required: true,
          stdValue: '每盒需插入1张说明书',
        },
        {
          key: 'boxCountPerCarton',
          label: '每箱装盒数',
          type: 'number',
          required: true,
          unit: '盒/箱',
          stdValue: '依装箱指令，通常20盒/箱',
        },
        {
          key: 'operatorSign',
          label: '操作员签名',
          type: 'signature',
          required: true,
        },
      ],
    },
    PHASE_REPORT,
    PHASE_EXIT,
  ],
};

/**
 * OP-80 FQC成品检验
 */
const OP80_WG: OpPhaseConfig = {
  opNo: 'OP-80',
  opName: 'FQC成品检验',
  routingCode: 'TMJ-VITC-WG-V20',
  workcenterName: '南京-QC检验室',
  equipmentType: 'QC全套检验设备',
  phases: [
    PHASE_ENTRY,
    {
      phaseKey: 'fqc-sampling',
      phaseName: '成品抽样',
      phaseOrder: 3,
      description: '按GB/T 2828.1抽样方案从成品中抽取样品，填写抽样记录',
      icon: '📥',
      fields: [
        { key: 'sampleQty', label: '抽样数量', type: 'number', required: true, unit: '盒', stdValue: '按AQL 0.65，II级检查水平，依批量确定抽样数' },
        { key: 'sampleSign', label: '抽样人签名', type: 'signature', required: true },
      ],
    },
    {
      phaseKey: 'fqc-inspection',
      phaseName: '全项目检验',
      phaseOrder: 4,
      description: '按《成品检验规程》进行全项目检验，包括理化、微生物、包装检查',
      icon: '🔬',
      dualSign: true,
      fields: [
        {
          key: 'appearance', label: '外观检查', type: 'select', required: true,
          options: ['合格', '不合格'],
          stdValue: '色泽正常、无变色、无潮解，铝塑密封完好',
        },
        {
          key: 'vitcContentFQC', label: 'VC含量（HPLC）', type: 'number', required: true,
          unit: 'mg/片', min: 470, max: 530,
          stdValue: '500±5%（即470~530 mg/片）',
        },
        {
          key: 'waterActivityFQC', label: '水分活度 Aw', type: 'number', required: true,
          unit: '', max: 0.6,
          stdValue: '≤0.60',
        },
        {
          key: 'microbialCount', label: '菌落总数', type: 'number', required: true,
          unit: 'CFU/g', max: 1000,
          stdValue: '≤1000 CFU/g（保健食品标准）',
        },
        {
          key: 'moldYeastCount', label: '霉菌和酵母菌计数', type: 'number', required: true,
          unit: 'CFU/g', max: 100,
          stdValue: '≤100 CFU/g',
        },
        {
          key: 'weightPerTablet', label: '片重复核', type: 'number', required: true,
          unit: 'mg', min: 950, max: 1050,
          stdValue: '1000±50 mg',
        },
        {
          key: 'packagingCheck', label: '包装检查', type: 'select', required: true,
          options: ['合格（批号/有效期正确，密封完好，说明书齐全）', '不合格'],
        },
        {
          key: 'fqcConclusion', label: '成品检验结论', type: 'select', required: true,
          options: ['合格，建议质量放行', '不合格，拒绝放行，开偏差单'],
        },
        { key: 'inspectorSign', label: '检验员签名', type: 'signature', required: true },
        { key: 'reviewerSign', label: '审核员签名', type: 'signature', required: true, dualSign: true },
      ],
    },
    PHASE_REPORT,
    PHASE_EXIT,
  ],
};

/**
 * OP-90 质量放行
 */
const OP90_WG: OpPhaseConfig = {
  opNo: 'OP-90',
  opName: '质量放行',
  routingCode: 'TMJ-VITC-WG-V20',
  workcenterName: '南京-质量保证部（QA）',
  equipmentType: 'ERP/MES终端',
  phases: [
    PHASE_ENTRY,
    {
      phaseKey: 'qa-review',
      phaseName: 'QA批记录审核',
      phaseOrder: 3,
      description: 'QA审核完整批生产记录（BMR）、批检验记录（BPR）、偏差记录、OOS记录',
      icon: '📋',
      dualSign: true,
      fields: [
        {
          key: 'batchRecordComplete', label: '批生产记录完整性', type: 'select', required: true,
          options: ['完整（所有页面签字齐全，无缺页）', '不完整（需补充）'],
        },
        {
          key: 'deviationCheck', label: '偏差记录审核', type: 'select', required: true,
          options: ['无偏差', '有偏差但已关闭（附偏差单号）', '有偏差未关闭（暂停放行）'],
        },
        {
          key: 'deviationNo', label: '偏差单号（如有）', type: 'text', required: false, placeholder: '输入偏差单编号' },
        {
          key: 'fqcReportNo', label: 'FQC检验报告编号', type: 'text', required: true, placeholder: '输入成品检验报告编号' },
        {
          key: 'fqcResult', label: '检验报告结论', type: 'select', required: true,
          options: ['全项合格', '有不合格项（暂停放行）'],
        },
      ],
    },
    {
      phaseKey: 'release-sign',
      phaseName: '电子放行签字',
      phaseOrder: 4,
      description: 'QA授权人审核批记录后，进行电子放行签字，批准本批产品出厂',
      icon: '🔏',
      dualSign: true,
      fields: [
        {
          key: 'releaseDecision', label: '放行决定', type: 'select', required: true,
          options: ['批准放行（本批产品符合规定，允许出厂）', '暂停放行（等待偏差关闭）', '拒绝放行（销毁/重工）'],
        },
        {
          key: 'qaAuthorizedSign', label: 'QA授权人电子签名', type: 'signature', required: true },
        {
          key: 'qaDirectorSign', label: 'QA主管复核签名', type: 'signature', required: true, dualSign: true },
        {
          key: 'releaseDateTime', label: '放行时间', type: 'datetime', required: true },
      ],
    },
    PHASE_REPORT,
    PHASE_EXIT,
  ],
};

// ─────────────────────────────────────────────────────────
// 4. 路径 TMJ-VITC-DC-V10：VitC直接压片
// ─────────────────────────────────────────────────────────

/** OP-10 直压路径称量配料 */
const OP10_DC: OpPhaseConfig = {
  opNo: 'OP-10',
  opName: '称量配料',
  routingCode: 'TMJ-VITC-DC-V10',
  workcenterName: '南京-固体制剂车间',
  equipmentType: '精密电子天平/称量系统',
  phases: [
    PHASE_PRE_CLEAN('上批产品'),
    PHASE_ENTRY,
    {
      phaseKey: 'material-verify',
      phaseName: '物料一致确认',
      phaseOrder: 3,
      description: '逐一扫描物料标签，核对与BOM一致（直压工艺使用直压级辅料）',
      icon: '📦',
      fields: [
        { key: 'materialScan', label: '物料扫码验证', type: 'scan', required: true, placeholder: '扫描物料标签条形码' },
        { key: 'operatorSign', label: '操作员签名', type: 'signature', required: true },
      ],
      bomMaterials: [
        { materialCode: 'RM-VITC-DC-001', materialName: '维生素C（直压级）', spec: '直压级粉末，流动性好', batchNo: 'VITC-DC-20260512-A', supplier: '华北制药', expDate: '2027-05-12', planQty: 150, unit: 'kg' },
        { materialCode: 'RM-MDCC-001', materialName: '微晶纤维素MCC PH-102', spec: '直压级，Dp:150μm', batchNo: 'MCC-20260501-A', supplier: 'FMC', expDate: '2027-05-01', planQty: 60, unit: 'kg' },
        { materialCode: 'RM-SORB-DC-001', materialName: '山梨糖醇（直压级）', spec: 'PEARLITOL 200SD', batchNo: 'SORBD-20260505-B', supplier: 'Roquette', expDate: '2027-05-05', planQty: 30, unit: 'kg' },
        { materialCode: 'RM-MGST-001', materialName: '硬脂酸镁', spec: '药用级', batchNo: 'MGST-20260420-A', supplier: '三力制药', expDate: '2027-04-20', planQty: 1.5, unit: 'kg' },
        { materialCode: 'RM-FLAV-001', materialName: '橙味香精', spec: '食品添加剂级', batchNo: 'FLAV-20260501-A', supplier: '国际香料', expDate: '2027-05-01', planQty: 0.3, unit: 'kg' },
      ],
    },
    {
      phaseKey: 'weighing',
      phaseName: '称量执行',
      phaseOrder: 4,
      description: '按直压配料单逐一称量，偏差±0.1%',
      icon: '⚖️',
      fields: [
        { key: 'scaleScan', label: '电子天平扫码绑定', type: 'scan', required: true, placeholder: '扫描天平铭牌二维码' },
        { key: 'vitcDCActual', label: 'VC（直压级）实称量', type: 'number', required: true, unit: 'kg', stdValue: '150.000 ± 0.150 kg', placeholder: '输入实称量' },
        { key: 'mccActual', label: 'MCC PH-102实称量', type: 'number', required: true, unit: 'kg', stdValue: '60.000 ± 0.060 kg', placeholder: '输入实称量' },
        { key: 'sorbDCActual', label: '山梨糖醇（直压）实称量', type: 'number', required: true, unit: 'kg', stdValue: '30.000 ± 0.030 kg', placeholder: '输入实称量' },
        { key: 'mgstActual2', label: '硬脂酸镁实称量', type: 'number', required: true, unit: 'kg', stdValue: '1.500 ± 0.002 kg', placeholder: '输入实称量' },
        { key: 'deviationCheck', label: '偏差校验确认', type: 'checkbox', required: true, stdValue: '所有物料偏差≤±0.1%' },
        { key: 'operatorSign', label: '操作员签名', type: 'signature', required: true },
        { key: 'reviewerSign', label: '复核员签名', type: 'signature', required: true, dualSign: true },
      ],
    },
    PHASE_REPORT,
    PHASE_EXIT,
  ],
};

/** 直压路径：OP-30 总混（直接将称量物料混合） */
const OP30_DC: OpPhaseConfig = {
  opNo: 'OP-30',
  opName: '总混',
  routingCode: 'TMJ-VITC-DC-V10',
  workcenterName: '南京-固体制剂车间',
  equipmentType: '三维运动混合机',
  phases: [
    PHASE_PRE_CLEAN('上批物料'),
    PHASE_ENTRY,
    {
      phaseKey: 'material-verify',
      phaseName: '物料一致确认',
      phaseOrder: 3,
      description: '核查直压称量物料（所有辅料），确认批号与工单一致',
      icon: '📦',
      fields: [
        { key: 'materialScan', label: '各组分物料标签扫码', type: 'scan', required: true, placeholder: '逐一扫描' },
        { key: 'operatorSign', label: '操作员签名', type: 'signature', required: true },
      ],
      bomMaterials: [
        { materialCode: 'WIP-WEIGHING-DC-001', materialName: '直压称量物料（各组分）', spec: '混合前分批记录', batchNo: 'TMJ-VITC-DC-20260605-001', supplier: '内部转序', expDate: '2026-06-10', planQty: 241.8, unit: 'kg' },
      ],
    },
    {
      phaseKey: 'blending-dc',
      phaseName: '总混执行',
      phaseOrder: 4,
      description: '分步加料：先预混VC和MCC，再加山梨糖醇，最后加硬脂酸镁（短时混合）',
      icon: '🔄',
      fields: [
        { key: 'mixerSpeed', label: '混合机转速', type: 'number', required: true, unit: 'rpm', min: 8, max: 15, stdValue: '10±2 rpm' },
        { key: 'preMixTime', label: '预混时间（VC+MCC+山梨糖醇）', type: 'number', required: true, unit: 'min', min: 10, max: 20, stdValue: '15 min' },
        { key: 'finalMixTime', label: '加入硬脂酸镁后混合时间', type: 'number', required: true, unit: 'min', min: 3, max: 7, stdValue: '5 min（过混导致润滑剂失效）' },
        {
          key: 'uniformityRecord',
          label: '均匀度取样（3点）',
          type: 'table', required: true,
          tableColumns: [
            { key: 'position', label: '取样位置', type: 'text' },
            { key: 'sampleWeight', label: '取样量(g)', type: 'number' },
            { key: 'vcContent', label: 'VC含量(%)', type: 'number' },
          ],
        },
      ],
    },
    PHASE_REPORT,
    PHASE_EXIT,
  ],
};

/** 直压路径 OP-40 直接压片 */
const OP40_DC: OpPhaseConfig = {
  opNo: 'OP-40',
  opName: '直接压片',
  routingCode: 'TMJ-VITC-DC-V10',
  workcenterName: '南京-固体制剂车间',
  equipmentType: '旋转式压片机',
  phases: [
    PHASE_PRE_CLEAN('上批产品'),
    PHASE_ENTRY,
    {
      phaseKey: 'material-verify',
      phaseName: '物料一致确认',
      phaseOrder: 3,
      description: '核查直压总混颗粒，确认批号/数量与工单一致',
      icon: '📦',
      fields: [
        { key: 'materialScan', label: '直压混合粉标签扫码', type: 'scan', required: true, placeholder: '扫描料桶标签' },
        { key: 'operatorSign', label: '操作员签名', type: 'signature', required: true },
      ],
      bomMaterials: [
        { materialCode: 'WIP-BLEND-DC-001', materialName: '直压总混粉（VitC）', spec: '流动性良好，均匀', batchNo: 'TMJ-VITC-DC-20260605-001', supplier: '内部转序', expDate: '2026-06-12', planQty: 241.8, unit: 'kg' },
      ],
    },
    {
      phaseKey: 'first-piece-dc',
      phaseName: '首件检验',
      phaseOrder: 4,
      description: '开机后首件检验片重/硬度/厚度/外观，合格后批量生产',
      icon: '🏅',
      dualSign: true,
      fields: [
        { key: 'instrumentScan', label: '检验量具扫码绑定', type: 'scan', required: true, placeholder: '扫描仪器铭牌' },
        { key: 'tabletWeightDC', label: '片重（10片平均）', type: 'number', required: true, unit: 'mg', min: 490, max: 510, stdValue: '500±10 mg（直压，片重相对小）' },
        { key: 'tabletHardnessDC', label: '片剂硬度', type: 'number', required: true, unit: 'N', min: 50, max: 120, stdValue: '70~100 N（直压）' },
        { key: 'tabletThicknessDC', label: '片剂厚度', type: 'number', required: true, unit: 'mm', min: 4.5, max: 5.0, stdValue: '4.8±0.2 mm' },
        { key: 'appearanceDC', label: '外观检查', type: 'select', required: true, options: ['合格（无粘冲/花斑/裂片）', '不合格-粘冲', '不合格-裂片'] },
        { key: 'disintegrationDC', label: '崩解时限', type: 'number', required: true, unit: 'min', max: 30, stdValue: '≤30 min' },
        { key: 'firstPiecePhotoDC', label: '首件照片', type: 'photo', required: true },
        { key: 'firstPieceJudgeDC', label: '首件判定', type: 'select', required: true, options: ['合格（允许批量生产）', '不合格（调机重验）'] },
        { key: 'inspectorSignDC', label: '检验员工牌扫码', type: 'scan', required: true, placeholder: '扫描检验员工牌' },
        { key: 'reviewerSignDC', label: '复核员工牌扫码', type: 'scan', required: true, dualSign: true, placeholder: '扫描复核员工牌' },
      ],
    },
    PHASE_REPORT,
    PHASE_EXIT,
  ],
};

// ─────────────────────────────────────────────────────────
// 5. 路径 TMJ-PROBIO-CAP-V15：益生菌胶囊（冷链）
// ─────────────────────────────────────────────────────────

/**
 * OP-10 原料接收验收（冷链特殊管控）
 */
const OP10_CAP: OpPhaseConfig = {
  opNo: 'OP-10',
  opName: '原料接收验收',
  routingCode: 'TMJ-PROBIO-CAP-V15',
  workcenterName: '廊坊-益生菌冷链车间',
  equipmentType: '冷链储存设备/验收台',
  phases: [
    PHASE_ENTRY,
    {
      phaseKey: 'cold-chain-check',
      phaseName: '冷链运输温度核查',
      phaseOrder: 3,
      description: '核查原料（益生菌菌粉）运输全程冷链记录（≤-18°C冷冻运输），温度超标需立即报告QA',
      icon: '❄️',
      isColdChainCheck: true,
      fields: [
        {
          key: 'coldChainDocScan', label: '冷链运输记录单扫码', type: 'scan', required: true,
          placeholder: '扫描随货冷链记录单条形码',
          stdValue: '核查全程温度≤-18°C（益生菌原料冷冻运输要求）',
        },
        {
          key: 'maxTempDuringTransport', label: '运输途中最高温度', type: 'temperature', required: true,
          unit: '°C', max: -15,
          stdValue: '全程≤-18°C，最高≤-15°C（短暂偏差需QA评估）',
        },
        {
          key: 'coldChainResult', label: '冷链核查结论', type: 'select', required: true,
          options: ['合格（全程≤-18°C，接收）', '轻微偏差（-18~-15°C，QA评估后接收）', '严重偏差（>-15°C，拒收）'],
        },
        { key: 'qaSign', label: 'QA签名确认', type: 'signature', required: true },
      ],
    },
    {
      phaseKey: 'material-verify',
      phaseName: '原料一致性验证',
      phaseOrder: 4,
      description: '扫描原料标签，核对品名/批号/供应商/有效期，与到货清单及采购订单核对',
      icon: '📦',
      fields: [
        { key: 'materialScan', label: '原料标签扫码', type: 'scan', required: true, placeholder: '扫描原料桶标签二维码' },
        { key: 'receiveQty', label: '实际到货数量', type: 'number', required: true, unit: 'kg', placeholder: '核对实际到货量' },
        { key: 'operatorSign', label: '接收员签名', type: 'signature', required: true },
        { key: 'qaVerifySign', label: 'QA核查签名', type: 'signature', required: true, dualSign: true },
      ],
      bomMaterials: [
        { materialCode: 'RM-LACTO-001', materialName: '鼠李糖乳杆菌（LGG菌粉）', spec: '≥1×10¹¹ CFU/g，冻干粉', batchNo: 'LGG-20260501-A', supplier: 'Chr.Hansen', expDate: '2027-05-01', planQty: 5, unit: 'kg', isColdChain: true },
        { materialCode: 'RM-BIFIDO-001', materialName: '双歧杆菌（BB-12菌粉）', spec: '≥5×10¹⁰ CFU/g，冻干粉', batchNo: 'BB12-20260501-B', supplier: 'Chr.Hansen', expDate: '2027-05-01', planQty: 3, unit: 'kg', isColdChain: true },
        { materialCode: 'RM-FOS-001', materialName: '低聚果糖（FOS）', spec: '纯度≥95%，食品级', batchNo: 'FOS-20260510-A', supplier: '量子高科', expDate: '2027-05-10', planQty: 20, unit: 'kg' },
        { materialCode: 'RM-MALTO-001', materialName: '麦芽糊精', spec: 'DE 15~20，食品级', batchNo: 'MALT-20260508-C', supplier: '西王食品', expDate: '2027-05-08', planQty: 10, unit: 'kg' },
      ],
    },
    {
      phaseKey: 'storage-assign',
      phaseName: '冷链储存分配',
      phaseOrder: 5,
      description: '原料验收合格后分配冷链冰库库位，贴"待检"标签，记录存放温度',
      icon: '🏪',
      isColdChainCheck: true,
      fields: [
        {
          key: 'storageTempNow', label: '冰库当前温度', type: 'temperature', required: true,
          unit: '°C', max: -18,
          stdValue: '原料冷冻储存：≤-18°C',
        },
        { key: 'storageLocation', label: '库位编号', type: 'text', required: true, placeholder: '输入分配的库位号' },
        { key: 'storageSign', label: '入库操作员签名', type: 'signature', required: true },
      ],
    },
    PHASE_REPORT,
    PHASE_EXIT,
  ],
};

/**
 * OP-20 低温称量配料（冷链）
 */
const OP20_CAP: OpPhaseConfig = {
  opNo: 'OP-20',
  opName: '低温称量配料',
  routingCode: 'TMJ-PROBIO-CAP-V15',
  workcenterName: '廊坊-益生菌冷链车间（称量间）',
  equipmentType: '低温精密天平（冷链专用称量间≤8°C）',
  phases: [
    PHASE_PRE_CLEAN('上批菌粉'),
    PHASE_ENTRY,
    {
      phaseKey: 'cold-env-check',
      phaseName: '冷链环境确认',
      phaseOrder: 3,
      description: '确认称量间温度≤8°C（益生菌活性保护），记录操作前/操作中温度',
      icon: '❄️',
      isColdChainCheck: true,
      fields: [
        {
          key: 'weighRoomTemp', label: '称量间温度', type: 'temperature', required: true,
          unit: '°C', max: 8,
          stdValue: '称量间温度≤8°C（冷链保护益生菌活性）',
        },
        {
          key: 'weighRoomHumidity', label: '称量间相对湿度', type: 'number', required: true,
          unit: '%RH', max: 40,
          stdValue: '≤40%RH（防止菌粉吸潮）',
        },
        { key: 'coldEnvSign', label: '环境确认签名', type: 'signature', required: true },
      ],
    },
    {
      phaseKey: 'material-verify-cold',
      phaseName: '物料一致确认',
      phaseOrder: 4,
      description: '从冰库取出益生菌菌粉，扫码核对品名/批号/数量，确认物料已解冻至操作温度（≤8°C）',
      icon: '📦',
      fields: [
        { key: 'materialScan', label: '菌粉/辅料标签扫码', type: 'scan', required: true, placeholder: '逐一扫描物料标签' },
        { key: 'operatorSign', label: '操作员签名', type: 'signature', required: true },
      ],
      bomMaterials: [
        { materialCode: 'RM-LACTO-001', materialName: 'LGG乳杆菌菌粉', spec: '冻干粉', batchNo: 'LGG-20260501-A', supplier: 'Chr.Hansen', expDate: '2027-05-01', planQty: 5, unit: 'kg', isColdChain: true },
        { materialCode: 'RM-BIFIDO-001', materialName: 'BB-12双歧杆菌菌粉', spec: '冻干粉', batchNo: 'BB12-20260501-B', supplier: 'Chr.Hansen', expDate: '2027-05-01', planQty: 3, unit: 'kg', isColdChain: true },
        { materialCode: 'RM-FOS-001', materialName: '低聚果糖（FOS）', spec: '食品级', batchNo: 'FOS-20260510-A', supplier: '量子高科', expDate: '2027-05-10', planQty: 20, unit: 'kg' },
        { materialCode: 'RM-MALTO-001', materialName: '麦芽糊精', spec: '食品级', batchNo: 'MALT-20260508-C', supplier: '西王食品', expDate: '2027-05-08', planQty: 10, unit: 'kg' },
      ],
    },
    {
      phaseKey: 'cold-weighing',
      phaseName: '低温称量执行',
      phaseOrder: 5,
      description: '在≤8°C冷链称量间快速称量，减少菌粉在常温下的暴露时间',
      icon: '⚖️',
      fields: [
        { key: 'scaleScan', label: '低温天平扫码绑定', type: 'scan', required: true, placeholder: '扫描低温天平铭牌' },
        {
          key: 'lgActualQty', label: 'LGG乳杆菌实称量', type: 'number', required: true,
          unit: 'kg', stdValue: '5.000 ± 0.005 kg（偏差≤±0.1%）', placeholder: '输入实称量',
        },
        {
          key: 'bbActualQty', label: 'BB-12双歧杆菌实称量', type: 'number', required: true,
          unit: 'kg', stdValue: '3.000 ± 0.003 kg', placeholder: '输入实称量',
        },
        {
          key: 'fosActualQty', label: 'FOS低聚果糖实称量', type: 'number', required: true,
          unit: 'kg', stdValue: '20.000 ± 0.020 kg', placeholder: '输入实称量',
        },
        {
          key: 'maltoActualQty', label: '麦芽糊精实称量', type: 'number', required: true,
          unit: 'kg', stdValue: '10.000 ± 0.010 kg', placeholder: '输入实称量',
        },
        {
          key: 'exposeTimeRecord', label: '菌粉常温暴露时间', type: 'number', required: true,
          unit: 'min', max: 30,
          stdValue: '菌粉在>8°C环境暴露时间≤30min',
        },
        { key: 'deviationCheck', label: '偏差校验确认', type: 'checkbox', required: true, stdValue: '所有物料偏差≤±0.1%' },
        { key: 'operatorSign', label: '操作员签名', type: 'signature', required: true },
        { key: 'reviewerSign', label: '复核员签名（双人）', type: 'signature', required: true, dualSign: true },
      ],
    },
    PHASE_REPORT,
    PHASE_EXIT,
  ],
};

/**
 * OP-30 混合（冷链≤8°C）
 */
const OP30_CAP: OpPhaseConfig = {
  opNo: 'OP-30',
  opName: '混合（冷链≤8°C）',
  routingCode: 'TMJ-PROBIO-CAP-V15',
  workcenterName: '廊坊-益生菌冷链车间',
  equipmentType: '低温三维混合机（冷链专用）',
  phases: [
    PHASE_PRE_CLEAN('上批菌粉'),
    PHASE_ENTRY,
    {
      phaseKey: 'cold-env-mix',
      phaseName: '冷链混合间环境确认',
      phaseOrder: 3,
      description: '确认混合间温度≤8°C，湿度≤40%RH，方可进行混合操作',
      icon: '❄️',
      isColdChainCheck: true,
      fields: [
        { key: 'mixRoomTemp', label: '混合间温度', type: 'temperature', required: true, unit: '°C', max: 8, stdValue: '≤8°C' },
        { key: 'mixRoomHumidity', label: '混合间湿度', type: 'number', required: true, unit: '%RH', max: 40, stdValue: '≤40%RH' },
        { key: 'envConfirmSign', label: '环境确认签名', type: 'signature', required: true },
      ],
    },
    {
      phaseKey: 'material-verify',
      phaseName: '物料一致确认',
      phaseOrder: 4,
      description: '核查低温称量中间体，确认批号/数量与工单一致',
      icon: '📦',
      fields: [
        { key: 'materialScan', label: '称量中间体标签扫码', type: 'scan', required: true, placeholder: '扫描称量中间体标签' },
        { key: 'operatorSign', label: '操作员签名', type: 'signature', required: true },
      ],
      bomMaterials: [
        { materialCode: 'WIP-COLD-WEIGH-001', materialName: '益生菌低温称量中间体', spec: '菌粉+FOS+麦芽糊精', batchNo: 'TMJ-PROBIO-20260605-003', supplier: '内部转序', expDate: '2026-06-05', planQty: 38, unit: 'kg', isColdChain: true },
      ],
    },
    {
      phaseKey: 'cold-mixing',
      phaseName: '低温混合执行',
      phaseOrder: 5,
      description: '低温混合机运行，快速完成混合，减少暴露时间，混合后立即转充填工序',
      icon: '🔄',
      fields: [
        {
          key: 'mixerTemp', label: '混合机内腔温度（实时）', type: 'temperature', required: true,
          unit: '°C', max: 10,
          stdValue: '≤10°C（混合过程中不超过10°C）',
        },
        { key: 'mixSpeed', label: '混合转速', type: 'number', required: true, unit: 'rpm', min: 10, max: 20, stdValue: '15±3 rpm' },
        { key: 'mixTime', label: '混合时间', type: 'number', required: true, unit: 'min', min: 10, max: 20, stdValue: '15±3 min（不宜过长，防止温度升高）' },
        {
          key: 'totalExposeTime', label: '总操作暴露时间（称量+混合）', type: 'number', required: true,
          unit: 'min', max: 60,
          stdValue: '整个冷链操作总暴露时间≤60 min',
        },
        { key: 'operatorSign', label: '操作员签名', type: 'signature', required: true },
      ],
    },
    {
      phaseKey: 'uniformity-cold',
      phaseName: '混合均匀性确认',
      phaseOrder: 6,
      description: '取3点样品送QC检测益生菌活菌数，确认分布均匀',
      icon: '🔬',
      fields: [
        { key: 'samplingTop', label: '上层取样（3~5g）', type: 'number', required: true, unit: 'g', stdValue: '取样后立即冷藏保存' },
        { key: 'samplingMid', label: '中层取样（3~5g）', type: 'number', required: true, unit: 'g' },
        { key: 'samplingBot', label: '下层取样（3~5g）', type: 'number', required: true, unit: 'g' },
        { key: 'qcBatchNo', label: 'QC检验单号', type: 'text', required: true, placeholder: '输入QC送检单编号' },
        { key: 'samplingSign', label: '取样签名', type: 'signature', required: true },
      ],
    },
    PHASE_REPORT,
    PHASE_EXIT,
  ],
};

/**
 * OP-40 胶囊充填
 */
const OP40_CAP: OpPhaseConfig = {
  opNo: 'OP-40',
  opName: '胶囊充填',
  routingCode: 'TMJ-PROBIO-CAP-V15',
  workcenterName: '廊坊-益生菌冷链车间',
  equipmentType: '全自动胶囊充填机（冷链版）',
  phases: [
    PHASE_PRE_CLEAN('上批产品'),
    PHASE_ENTRY,
    {
      phaseKey: 'cold-check-filling',
      phaseName: '冷链环境确认',
      phaseOrder: 3,
      description: '确认充填间温度≤8°C，设备清洁，空心胶囊已在低温下预平衡',
      icon: '❄️',
      isColdChainCheck: true,
      fields: [
        { key: 'fillingRoomTemp', label: '充填间温度', type: 'temperature', required: true, unit: '°C', max: 8, stdValue: '≤8°C（充填间冷链控制）' },
        { key: 'capsuleEquilTemp', label: '空心胶囊预平衡温度', type: 'temperature', required: true, unit: '°C', max: 10, stdValue: '≤10°C（防止胶囊脆裂）' },
        { key: 'envSign', label: '环境确认签名', type: 'signature', required: true },
      ],
    },
    {
      phaseKey: 'material-verify',
      phaseName: '物料一致确认',
      phaseOrder: 4,
      description: '核查益生菌混合粉末和空心明胶胶囊，确认批号/规格/数量与工单一致',
      icon: '📦',
      fields: [
        { key: 'materialScan', label: '混合粉末/胶囊标签扫码', type: 'scan', required: true, placeholder: '扫描物料标签' },
        { key: 'operatorSign', label: '操作员签名', type: 'signature', required: true },
      ],
      bomMaterials: [
        { materialCode: 'WIP-PROBIO-MIX-001', materialName: '益生菌混合粉末', spec: '均匀，活菌数合格', batchNo: 'TMJ-PROBIO-20260605-003', supplier: '内部转序', expDate: '2026-06-05', planQty: 38, unit: 'kg', isColdChain: true },
        { materialCode: 'PM-CAPSULE-00-001', materialName: '明胶空心胶囊 00#', spec: '植物源明胶，淡黄色', batchNo: 'CAP-20260515-A', supplier: '苏州胶囊', expDate: '2027-05-15', planQty: 200000, unit: '粒' },
      ],
    },
    {
      phaseKey: 'filling-first-piece',
      phaseName: '首件充填检验',
      phaseOrder: 5,
      description: '开机前15min取10粒进行首件检验：装量差异、外观，合格后批量充填',
      icon: '🏅',
      dualSign: true,
      fields: [
        { key: 'fillEquipScan', label: '充填机扫码绑定', type: 'scan', required: true, placeholder: '扫描充填机铭牌' },
        {
          key: 'capsuleFillWeight', label: '胶囊装量（10粒平均）', type: 'number', required: true,
          unit: 'mg', min: 380, max: 420,
          stdValue: '400±5%（即380~420 mg/粒）',
        },
        {
          key: 'capsuleFillVariation', label: '装量差异（最大偏差）', type: 'number', required: true,
          unit: '%', max: 7.5,
          stdValue: '装量差异限度±7.5%（中国药典 胶囊剂）',
        },
        {
          key: 'capsuleAppearance', label: '胶囊外观检查', type: 'select', required: true,
          options: ['合格（密封完好，无破损，无漏粉）', '不合格-有破损', '不合格-有漏粉', '不合格-密封不良'],
          stdValue: '胶囊密封完好，无漏粉，外表面清洁',
        },
        { key: 'firstPiecePhotoCAP', label: '首件照片', type: 'photo', required: true, stdValue: '至少1张，清晰展示胶囊外观' },
        { key: 'firstPieceJudgeCAP', label: '首件判定', type: 'select', required: true, options: ['合格（允许批量充填）', '不合格（调机重验）'] },
        { key: 'inspectorScan', label: '检验员工牌扫码', type: 'scan', required: true, placeholder: '扫描检验员工牌' },
        { key: 'reviewerScan', label: '复核员工牌扫码（双人）', type: 'scan', required: true, dualSign: true, placeholder: '扫描复核员工牌' },
      ],
    },
    {
      phaseKey: 'filling-process',
      phaseName: '充填过程控制',
      phaseOrder: 6,
      description: '批量充填，每30min记录装量/冷链温度，监控实时活菌保护',
      icon: '📊',
      fields: [
        { key: 'machineSpeed', label: '充填机转速', type: 'number', required: true, unit: 'rpm', min: 20, max: 50, stdValue: '依产能，通常30 rpm' },
        {
          key: 'processRecord', label: '充填过程记录', type: 'table', required: true,
          tableColumns: [
            { key: 'timePoint', label: '记录时间', type: 'datetime' },
            { key: 'roomTemp', label: '车间温度(°C)', type: 'number' },
            { key: 'fillWeight', label: '装量(mg)', type: 'number' },
            { key: 'completedQty', label: '完成量(万粒)', type: 'number' },
            { key: 'anomaly', label: '异常', type: 'text' },
          ],
        },
      ],
    },
    PHASE_REPORT,
    PHASE_EXIT,
  ],
};

/**
 * OP-45 充填中检（QC）
 */
const OP45_CAP: OpPhaseConfig = {
  opNo: 'OP-45',
  opName: '充填中检（QC）',
  routingCode: 'TMJ-PROBIO-CAP-V15',
  workcenterName: '廊坊-冷链QC实验室',
  equipmentType: 'QC设备（含低温培养箱）',
  phases: [
    PHASE_ENTRY,
    {
      phaseKey: 'sample-receipt-cap',
      phaseName: '样品冷链接收',
      phaseOrder: 3,
      description: '接收充填工序送检胶囊样品（冷链保存），登记样品信息，确认样品温度≤8°C',
      icon: '📥',
      isColdChainCheck: true,
      fields: [
        { key: 'sampleScan', label: '样品袋条形码扫描', type: 'scan', required: true, placeholder: '扫描样品袋条形码' },
        { key: 'sampleTempOnReceipt', label: '样品接收时温度', type: 'temperature', required: true, unit: '°C', max: 8, stdValue: '≤8°C' },
        { key: 'receiveSign', label: '接收签名', type: 'signature', required: true },
      ],
    },
    {
      phaseKey: 'capsule-qc',
      phaseName: '胶囊中检项目',
      phaseOrder: 4,
      description: '按《胶囊充填中检规程》检验：外观/装量差异/活菌数抽样检测',
      icon: '🔬',
      dualSign: true,
      fields: [
        { key: 'inspectEquipScan', label: '检验设备扫码绑定', type: 'scan', required: true, placeholder: '扫描检验设备铭牌', stdValue: '必须扫码绑定检验设备' },
        {
          key: 'capsuleAppearanceQC', label: '外观检查（20粒）', type: 'select', required: true,
          options: ['合格（密封完好，外观均一，无漏粉破损）', '不合格'],
          stdValue: '20粒全检，无1粒破损或漏粉',
        },
        {
          key: 'fillWeightVariationQC', label: '装量差异（20粒）', type: 'number', required: true,
          unit: '%', max: 7.5,
          stdValue: '装量差异限度±7.5%（中国药典法）',
        },
        {
          key: 'probioticCount', label: '活菌数（抽样检测）', type: 'number', required: true,
          unit: 'CFU/粒', min: 1000000000,
          stdValue: '≥1×10⁹ CFU/粒（活菌保证量）',
          placeholder: '输入活菌数（CFU/粒）',
        },
        {
          key: 'disintegrationCAP', label: '崩解时限（胶囊）', type: 'number', required: true,
          unit: 'min', max: 30,
          stdValue: '≤30 min（明胶胶囊，37°C水中）',
        },
        {
          key: 'qcConclusionCAP', label: '检验结论', type: 'select', required: true,
          options: ['合格，建议转入包装工序', '不合格，暂停生产，开偏差单'],
        },
        { key: 'inspectorSignCAP', label: '检验员签名', type: 'signature', required: true },
        { key: 'reviewerSignCAP', label: '审核员签名（双人）', type: 'signature', required: true, dualSign: true },
      ],
    },
    PHASE_REPORT,
    PHASE_EXIT,
  ],
};

/**
 * OP-80 质量放行（益生菌路径）
 */
const OP80_CAP: OpPhaseConfig = {
  opNo: 'OP-80',
  opName: '质量放行',
  routingCode: 'TMJ-PROBIO-CAP-V15',
  workcenterName: '廊坊-质量保证部（QA）',
  equipmentType: 'ERP/MES终端',
  phases: [
    PHASE_ENTRY,
    {
      phaseKey: 'cold-chain-full-review',
      phaseName: '冷链全程温度审核',
      phaseOrder: 3,
      description: 'QA审核全批次冷链温度记录（原料验收→称量→混合→充填→包装→入库），确认无冷链断链',
      icon: '❄️',
      isColdChainCheck: true,
      fields: [
        {
          key: 'coldChainIntact', label: '冷链完整性审核', type: 'select', required: true,
          options: ['冷链完整（全程符合≤8°C要求）', '有温度偏差但QA已评估可放行', '冷链断链（拒绝放行）'],
        },
        { key: 'coldChainDeviation', label: '偏差描述（如有）', type: 'text', required: false, placeholder: '如有温度偏差，描述偏差情况及评估结论' },
      ],
    },
    {
      phaseKey: 'qa-review-cap',
      phaseName: 'QA批记录审核',
      phaseOrder: 4,
      description: '审核全套批记录（BMR/BPR）、冷链记录、活菌数检验报告',
      icon: '📋',
      fields: [
        { key: 'batchRecordCompleteCAP', label: '批生产记录完整性', type: 'select', required: true, options: ['完整', '不完整（需补充）'] },
        { key: 'probioticCountFQC', label: '成品活菌数检验结果', type: 'number', required: true, unit: 'CFU/粒', min: 1000000000, stdValue: '≥1×10⁹ CFU/粒', placeholder: '输入FQC活菌数' },
        { key: 'fqcReportNoCAP', label: 'FQC检验报告编号', type: 'text', required: true, placeholder: '输入成品检验报告编号' },
        { key: 'deviationCheckCAP', label: '偏差记录状态', type: 'select', required: true, options: ['无偏差', '有偏差已关闭', '有偏差未关闭（暂停）'] },
      ],
    },
    {
      phaseKey: 'release-sign-cap',
      phaseName: '电子放行签字',
      phaseOrder: 5,
      description: 'QA授权人审核后电子放行，允许转冷链入库',
      icon: '🔏',
      dualSign: true,
      fields: [
        { key: 'releaseDecisionCAP', label: '放行决定', type: 'select', required: true, options: ['批准放行（转冷链入库≤8°C）', '暂停放行', '拒绝放行'] },
        { key: 'qaAuthorizedSignCAP', label: 'QA授权人签名', type: 'signature', required: true },
        { key: 'qaDirectorSignCAP', label: 'QA主管签名', type: 'signature', required: true, dualSign: true },
      ],
    },
    PHASE_REPORT,
    PHASE_EXIT,
  ],
};

/**
 * OP-90 冷链入库（≤8°C）
 */
const OP90_CAP: OpPhaseConfig = {
  opNo: 'OP-90',
  opName: '冷链入库（≤8°C）',
  routingCode: 'TMJ-PROBIO-CAP-V15',
  workcenterName: '廊坊-益生菌成品冷库',
  equipmentType: '冷链成品库（2~8°C成品冷藏）',
  phases: [
    PHASE_ENTRY,
    {
      phaseKey: 'cold-warehouse-check',
      phaseName: '成品冷库温度确认',
      phaseOrder: 3,
      description: '入库前确认成品冷库温度符合2~8°C（成品益生菌冷藏储存要求）',
      icon: '❄️',
      isColdChainCheck: true,
      fields: [
        {
          key: 'warehouseTemp', label: '成品冷库温度', type: 'temperature', required: true,
          unit: '°C', min: 2, max: 8,
          stdValue: '2~8°C（成品益生菌冷藏）',
        },
        {
          key: 'warehouseHumidity', label: '冷库相对湿度', type: 'number', required: true,
          unit: '%RH', max: 60, stdValue: '≤60%RH',
        },
        { key: 'warehouseSign', label: '仓库管理员签名', type: 'signature', required: true },
      ],
    },
    {
      phaseKey: 'inbound-scan',
      phaseName: '成品入库扫码',
      phaseOrder: 4,
      description: '扫描成品箱二维码入库，确认批号/数量/库位，系统自动更新库存',
      icon: '📦',
      fields: [
        { key: 'productScan', label: '成品箱标签扫码', type: 'scan', required: true, placeholder: '逐箱扫描成品箱标签' },
        { key: 'storageLocation', label: '冷库库位分配', type: 'text', required: true, placeholder: '输入分配的冷库库位号' },
        { key: 'inboundQty', label: '入库数量', type: 'number', required: true, unit: '盒', placeholder: '输入实际入库盒数' },
        { key: 'inboundSign', label: '入库操作员签名', type: 'signature', required: true },
        { key: 'qaStorageSign', label: 'QA确认签名', type: 'signature', required: true, dualSign: true },
      ],
    },
    PHASE_REPORT,
    PHASE_EXIT,
  ],
};

// ─────────────────────────────────────────────────────────
// 6. 导出统一索引
// ─────────────────────────────────────────────────────────

/** 所有工序Phase配置索引 */
export const TMJ_OP_PHASE_MAP: Record<string, OpPhaseConfig> = {
  // TMJ-VITC-WG-V20 湿法制粒
  'TMJ-VITC-WG-V20:OP-10': OP10_WG,
  'TMJ-VITC-WG-V20:OP-20': OP20_WG,
  'TMJ-VITC-WG-V20:OP-25': OP25_WG,
  'TMJ-VITC-WG-V20:OP-35': OP35_WG,
  'TMJ-VITC-WG-V20:OP-40': OP40_WG,
  'TMJ-VITC-WG-V20:OP-45': OP45_WG,
  'TMJ-VITC-WG-V20:OP-60': OP60_WG,
  'TMJ-VITC-WG-V20:OP-70': OP70_WG,
  'TMJ-VITC-WG-V20:OP-80': OP80_WG,
  'TMJ-VITC-WG-V20:OP-90': OP90_WG,

  // TMJ-VITC-DC-V10 直接压片
  'TMJ-VITC-DC-V10:OP-10': OP10_DC,
  'TMJ-VITC-DC-V10:OP-30': OP30_DC,
  'TMJ-VITC-DC-V10:OP-40': OP40_DC,
  'TMJ-VITC-DC-V10:OP-45': OP45_WG,     // 共用湿法路径的QC工序配置
  'TMJ-VITC-DC-V10:OP-60': OP60_WG,     // 共用内包装工序配置
  'TMJ-VITC-DC-V10:OP-70': OP70_WG,     // 共用外包装工序配置
  'TMJ-VITC-DC-V10:OP-80': OP80_WG,     // 共用FQC配置
  'TMJ-VITC-DC-V10:OP-90': OP90_WG,     // 共用质量放行配置

  // TMJ-PROBIO-CAP-V15 益生菌冷链
  'TMJ-PROBIO-CAP-V15:OP-10': OP10_CAP,
  'TMJ-PROBIO-CAP-V15:OP-20': OP20_CAP,
  'TMJ-PROBIO-CAP-V15:OP-30': OP30_CAP,
  'TMJ-PROBIO-CAP-V15:OP-40': OP40_CAP,
  'TMJ-PROBIO-CAP-V15:OP-45': OP45_CAP,
  'TMJ-PROBIO-CAP-V15:OP-80': OP80_CAP,
  'TMJ-PROBIO-CAP-V15:OP-90': OP90_CAP,
};

/** 按工艺路径获取所有工序列表 */
export function getOpListByRouting(routingCode: string): OpPhaseConfig[] {
  return Object.entries(TMJ_OP_PHASE_MAP)
    .filter(([key]) => key.startsWith(routingCode + ':'))
    .map(([, config]) => config)
    .sort((a, b) => {
      const aNum = parseInt(a.opNo.replace('OP-', ''));
      const bNum = parseInt(b.opNo.replace('OP-', ''));
      return aNum - bNum;
    });
}

/** 按 routingCode + opNo 获取工序Phase配置 */
export function getOpPhaseConfig(routingCode: string, opNo: string): OpPhaseConfig | undefined {
  return TMJ_OP_PHASE_MAP[`${routingCode}:${opNo}`];
}

/** 工艺路径信息 */
export const TMJ_ROUTINGS = [
  { code: 'TMJ-VITC-WG-V20', name: 'VitC咀嚼片·湿法制粒', opCount: 10, factory: '南京工厂' },
  { code: 'TMJ-VITC-DC-V10', name: 'VitC咀嚼片·直接压片', opCount: 8, factory: '南京工厂' },
  { code: 'TMJ-PROBIO-CAP-V15', name: '益生菌胶囊·冷链', opCount: 10, factory: '廊坊工厂（冷链）' },
];

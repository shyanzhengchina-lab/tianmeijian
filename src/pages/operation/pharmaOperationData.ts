/**
 * pharmaOperationData.ts
 * 天美健保健品MES — 增强版工序主数据（含GMP合规字段）
 * ============================================================
 * 覆盖范围：
 *   NJ固体车间（GD）: GD-01～GD-07  片剂/咀嚼片
 *   NJ软胶囊车间（RN）: RN-01～RN-06 软胶囊
 *   LS固体车间（LS-GD）: LS-GD-01～LS-GD-04 粉剂/颗粒剂
 *   LS液体车间（LS-YQ）: LS-YQ-01～LS-YQ-06 口服液
 *   外包车间通用（WB）: WB-01～WB-05 赋码外包
 * ============================================================
 */

/** 工序适用工厂 */
export type FactoryScope = 'ALL' | 'NJ' | 'LS';

/** 工序所属车间（保健品） */
export type PharmaWorkshop =
  | 'NJ-固体车间'
  | 'NJ-软胶囊车间'
  | 'NJ-外包车间'
  | 'LS-固体车间'
  | 'LS-液体车间'
  | 'LS-外包车间'
  | '通用';

/** GMP洁净级别 */
export type CleanRoom = 'D级' | 'C级' | 'B级' | 'A级' | '一般区';

/** 电子签名级别 */
export type ESignLevel = 'NONE' | 'OPERATOR' | 'OPERATOR_CHECKER' | 'OPERATOR_CHECKER_QA';

/** 检验触发类型 */
export type InspTrigger =
  | 'NONE'           // 无检验
  | 'AUTO_COMPLETE'  // 完工自动触发
  | 'AUTO_START'     // 开工触发（原料入库检）
  | 'MANUAL'         // 手工触发
  | 'FIRST_PIECE'    // 首件触发
  | 'PATROL'         // 巡检触发
  | 'CRITICAL';      // 关键控制点触发（强制）

/** 清场类型 */
export type CleanupType =
  | 'NONE'
  | 'SELF'     // 操作工自清
  | 'QA_VERIFY'  // QA验证
  | 'FULL';    // 全清场（批次交接）

// ── 设备配置 ──────────────────────────────────────────────────────
export interface EquipConfig {
  equipCode: string;
  equipName: string;
  model: string;
  qty: number;
  isPrimary: boolean;   // 是否为核心设备
  protocol?: string;    // 通信协议：Modbus/OPC-UA/私有
  autoCollect: boolean; // 是否自动数采
  calibPeriodDays?: number; // 校验周期（天）
}

// ── 质量控制参数 ──────────────────────────────────────────────────
export interface QcParam {
  paramCode: string;
  paramName: string;
  unit: string;
  stdMin?: number;
  stdMax?: number;
  stdValue?: string;    // 文字描述标准
  criticalLimit?: string; // 关键限度（违反需停产）
  inspMethod: string;   // 检验方法
  inspFreq: string;     // 检验频次
  isCritical: boolean;  // 关键质量属性
  actionRequired?: string; // 超标处置措施
}

// ── GMP合规要求 ────────────────────────────────────────────────────
export interface GmpRequirement {
  gmpCode: string;
  requirement: string;
  regulation: string;   // 依据法规/标准
  isMandatory: boolean; // 强制要求
  verifyMethod: string; // 验证方式
  docRequired: string;  // 需记录文件
}

// ── 增强版工序接口 ────────────────────────────────────────────────
export interface PharmaOperation {
  // ── 基本信息 ──
  opCode: string;
  opName: string;
  opShort: string;
  category: 'PROD' | 'INSP' | 'PACK' | 'SPEC' | 'QC';
  factoryScope: FactoryScope;     // 适用工厂范围
  workshop: PharmaWorkshop;
  productLine: string;
  workCenter: string;
  dosageForms: string[];          // 适用剂型

  // ── 设备配置 ──
  equipments: EquipConfig[];

  // ── 标准工时 ──
  stdTimeMin: number;
  prepTimeMin: number;
  cleanTimeMin: number;           // 清场时间（min）
  batchSize?: string;             // 标准批量

  // ── 质量控制 ──
  qcParams: QcParam[];
  inspTrigger: InspTrigger;
  inspSchemeCode?: string;        // 关联检验方案编码
  yieldStd?: string;              // 收率标准

  // ── GMP要求 ──
  gmpRequirements: GmpRequirement[];
  cleanRoomLevel: CleanRoom;
  eSignLevel: ESignLevel;         // 电子签名级别
  dualPersonCheck: boolean;       // 复核人要求
  qaMonitorRequired: boolean;     // QA现场监控

  // ── 清场管理 ──
  cleanupType: CleanupType;
  cleanupValidHours: number;      // 清场合格证有效期（小时）
  isBottleneck: boolean;
  isCriticalControl: boolean;     // 关键控制点（CCP）

  // ── 状态 ──
  status: 'ACTIVE' | 'DRAFT' | 'DISABLED';
  version: string;
  updatedAt: string;
  remark?: string;
}

// ════════════════════════════════════════════════════════════════
// 南京固体车间 (NJ-GD) 工序数据 — 片剂/咀嚼片
// ════════════════════════════════════════════════════════════════
const NJ_GD_OPERATIONS: PharmaOperation[] = [
  {
    opCode: 'GD-01', opName: '称量配料', opShort: '称量',
    category: 'PROD', factoryScope: 'ALL', workshop: 'NJ-固体车间',
    productLine: '固体制剂线', workCenter: 'GD-配料室',
    dosageForms: ['片剂', '咀嚼片', '粉剂'],
    equipments: [
      { equipCode: 'WEI-001', equipName: '电子分析天平', model: 'ME204E', qty: 2, isPrimary: true, autoCollect: true, calibPeriodDays: 365 },
      { equipCode: 'WEI-002', equipName: '台秤', model: 'PL12001', qty: 2, isPrimary: false, autoCollect: false, calibPeriodDays: 180 },
      { equipCode: 'BAR-001', equipName: '条码扫描枪', model: 'Symbol DS3578', qty: 2, isPrimary: false, autoCollect: true, calibPeriodDays: 0 },
    ],
    stdTimeMin: 180, prepTimeMin: 30, cleanTimeMin: 45,
    batchSize: '100kg/批',
    qcParams: [
      { paramCode: 'QC-WT-001', paramName: '称量误差', unit: '%', stdMin: -0.3, stdMax: 0.3, criticalLimit: '±0.5%超标需重称并记录偏差', inspMethod: '电子天平称量', inspFreq: '每件必检', isCritical: true, actionRequired: '重称，填写偏差报告，QA审核' },
      { paramCode: 'QC-WT-002', paramName: '物料外观', unit: '-', stdValue: '与标准品一致，无异物、无结块', inspMethod: '目视检查', inspFreq: '每批每件', isCritical: false },
      { paramCode: 'QC-WT-003', paramName: '物料批号', unit: '-', stdValue: '与配料单一致', inspMethod: '扫码比对', inspFreq: '每件', isCritical: true, actionRequired: '不一致停工上报' },
    ],
    inspTrigger: 'AUTO_START',
    inspSchemeCode: 'QC-IPC-001',
    gmpRequirements: [
      { gmpCode: 'GMP-WT-01', requirement: '称量操作必须双人核对，操作人/复核人各自签名', regulation: '《药品GMP指南》原辅料称量章节', isMandatory: true, verifyMethod: '查电子签名记录', docRequired: '称量记录表' },
      { gmpCode: 'GMP-WT-02', requirement: '称量间相对湿度≤50%，温度18~26℃，洁净度D级', regulation: '固体口服制剂GMP要求', isMandatory: true, verifyMethod: '查环境监测记录', docRequired: '环境监测日志' },
      { gmpCode: 'GMP-WT-03', requirement: '每次称量完成后立即填写称量记录，不得事后追记', regulation: '数据完整性要求', isMandatory: true, verifyMethod: '查EBR时间戳', docRequired: 'EBR岗位记录' },
    ],
    cleanRoomLevel: 'D级', eSignLevel: 'OPERATOR_CHECKER', dualPersonCheck: true, qaMonitorRequired: false,
    cleanupType: 'QA_VERIFY', cleanupValidHours: 72,
    isBottleneck: false, isCriticalControl: false,
    status: 'ACTIVE', version: 'V1.0', updatedAt: '2026-01-10',
    remark: '按BOM四重核对（品名/规格/批号/数量）；物料近效期预警≤6个月需审批',
  },
  {
    opCode: 'GD-02', opName: '混合', opShort: '混合',
    category: 'PROD', factoryScope: 'ALL', workshop: 'NJ-固体车间',
    productLine: '固体制剂线', workCenter: 'GD-混合间',
    dosageForms: ['片剂', '咀嚼片'],
    equipments: [
      { equipCode: 'MIX-001', equipName: '三维混合机', model: 'SBH-200', qty: 1, isPrimary: true, protocol: 'Modbus RTU', autoCollect: true, calibPeriodDays: 365 },
      { equipCode: 'MIX-002', equipName: '混合均匀性取样器', model: '五点取样器', qty: 1, isPrimary: false, autoCollect: false, calibPeriodDays: 0 },
    ],
    stdTimeMin: 120, prepTimeMin: 20, cleanTimeMin: 60,
    batchSize: '100kg/批',
    qcParams: [
      { paramCode: 'QC-MIX-001', paramName: '混合时间', unit: 'min', stdMin: 20, stdMax: 30, inspMethod: '设备自动记录（Modbus）', inspFreq: '每批', isCritical: true },
      { paramCode: 'QC-MIX-002', paramName: '混合均匀性RSD', unit: '%', stdMax: 5.0, criticalLimit: '>5%需重混，>8%强制报废', inspMethod: '5点取样含量测定', inspFreq: '每批', isCritical: true, actionRequired: '>5%需重混并记录偏差' },
      { paramCode: 'QC-MIX-003', paramName: '混合转速', unit: 'rpm', stdMin: 10, stdMax: 20, inspMethod: 'Modbus自动采集', inspFreq: '实时', isCritical: false },
    ],
    inspTrigger: 'AUTO_COMPLETE',
    gmpRequirements: [
      { gmpCode: 'GMP-MIX-01', requirement: '混合前确认设备清洁状态，使用有效清场合格证', regulation: 'GMP防污染要求', isMandatory: true, verifyMethod: '扫描清场合格证二维码', docRequired: '清场合格证（72h有效）' },
      { gmpCode: 'GMP-MIX-02', requirement: '混合均匀性取5点位样品，RSD≤5%方可放行', regulation: '均一性质量控制要求', isMandatory: true, verifyMethod: '含量均匀度检测', docRequired: '混合均匀性检测报告' },
    ],
    cleanRoomLevel: 'D级', eSignLevel: 'OPERATOR_CHECKER', dualPersonCheck: false, qaMonitorRequired: false,
    cleanupType: 'FULL', cleanupValidHours: 72,
    isBottleneck: false, isCriticalControl: false,
    status: 'ACTIVE', version: 'V1.0', updatedAt: '2026-01-10',
    remark: '三维混合机SBH-200；混合时间20~30min；Modbus RTU实时采集转速/电流',
  },
  {
    opCode: 'GD-03', opName: '制粒', opShort: '制粒',
    category: 'PROD', factoryScope: 'NJ', workshop: 'NJ-固体车间',
    productLine: '固体制剂线', workCenter: 'GD-制粒间',
    dosageForms: ['片剂', '咀嚼片'],
    equipments: [
      { equipCode: 'GRA-001', equipName: '湿法制粒机', model: 'GHL-300', qty: 1, isPrimary: true, protocol: 'Modbus RTU', autoCollect: true, calibPeriodDays: 365 },
      { equipCode: 'SIV-001', equipName: '整粒机', model: 'ZL-200', qty: 1, isPrimary: false, autoCollect: false },
      { equipCode: 'LAB-001', equipName: '粒度分析仪', model: '激光粒度仪LS-230', qty: 1, isPrimary: false, autoCollect: false, calibPeriodDays: 365 },
    ],
    stdTimeMin: 180, prepTimeMin: 30, cleanTimeMin: 90,
    batchSize: '100kg/批',
    qcParams: [
      { paramCode: 'QC-GRA-001', paramName: '制粒终点电流', unit: 'A', stdValue: '设备自动识别终点（电流曲线拐点）', inspMethod: 'Modbus电流监控', inspFreq: '实时', isCritical: true, actionRequired: '未达终点不得停机' },
      { paramCode: 'QC-GRA-002', paramName: '湿颗粒粒度', unit: 'μm', stdMin: 250, stdMax: 850, inspMethod: '激光粒度仪检测', inspFreq: '每批', isCritical: true },
      { paramCode: 'QC-GRA-003', paramName: '加水量', unit: 'L', stdValue: '按处方工艺规程（约8~12L/100kg）', inspMethod: '流量计记录', inspFreq: '每批', isCritical: false },
    ],
    inspTrigger: 'AUTO_COMPLETE',
    yieldStd: '≥98%',
    gmpRequirements: [
      { gmpCode: 'GMP-GRA-01', requirement: '黏合剂(PVP-K30)配制浓度需经QA确认后方可使用', regulation: '处方工艺规程', isMandatory: true, verifyMethod: '折光率仪检测', docRequired: 'QA批准单' },
      { gmpCode: 'GMP-GRA-02', requirement: '湿颗粒收率≥98%，收率偏低需查明原因并记录偏差', regulation: 'GMP物料平衡要求', isMandatory: true, verifyMethod: '称量计算', docRequired: '物料平衡表' },
    ],
    cleanRoomLevel: 'D级', eSignLevel: 'OPERATOR_CHECKER_QA', dualPersonCheck: true, qaMonitorRequired: true,
    cleanupType: 'FULL', cleanupValidHours: 72,
    isBottleneck: false, isCriticalControl: false,
    status: 'ACTIVE', version: 'V1.0', updatedAt: '2026-01-10',
  },
  {
    opCode: 'GD-04', opName: '干燥', opShort: '干燥',
    category: 'PROD', factoryScope: 'ALL', workshop: 'NJ-固体车间',
    productLine: '固体制剂线', workCenter: 'GD-干燥间',
    dosageForms: ['片剂', '咀嚼片', '颗粒剂'],
    equipments: [
      { equipCode: 'DRY-001', equipName: '流化床干燥机', model: 'FG-120', qty: 1, isPrimary: true, protocol: 'OPC UA', autoCollect: true, calibPeriodDays: 365 },
    ],
    stdTimeMin: 240, prepTimeMin: 15, cleanTimeMin: 60,
    batchSize: '100kg/批',
    qcParams: [
      { paramCode: 'QC-DRY-001', paramName: '干燥失重(LOD)', unit: '%', stdMax: 3.0, criticalLimit: '>3.5%停工，压片前必须返干', inspMethod: '水分测定仪', inspFreq: '每批取样（时间点：60/120/180/240min）', isCritical: true, actionRequired: '>3%继续干燥；>3.5%偏差报告' },
      { paramCode: 'QC-DRY-002', paramName: '进风温度', unit: '℃', stdMin: 55, stdMax: 65, inspMethod: 'OPC UA温度传感器', inspFreq: '实时（每5min记录）', isCritical: true },
      { paramCode: 'QC-DRY-003', paramName: '出口排风温度', unit: '℃', stdMin: 40, stdMax: 50, inspMethod: 'OPC UA温度传感器', inspFreq: '实时', isCritical: false },
    ],
    inspTrigger: 'AUTO_COMPLETE',
    yieldStd: '≥98%',
    gmpRequirements: [
      { gmpCode: 'GMP-DRY-01', requirement: '干燥温度60±5℃，温度超上下限5℃需记录偏差并评估产品质量', regulation: '工艺验证报告', isMandatory: true, verifyMethod: 'OPC UA传感器+设备报警', docRequired: '温度监控记录' },
      { gmpCode: 'GMP-DRY-02', requirement: '干燥失重≤3.0%方可流转压片；OPC UA每5min自动记录温湿度', regulation: 'GMP环境控制要求', isMandatory: true, verifyMethod: '水分仪检测', docRequired: '干燥记录及LOD数据' },
    ],
    cleanRoomLevel: 'D级', eSignLevel: 'OPERATOR', dualPersonCheck: false, qaMonitorRequired: false,
    cleanupType: 'QA_VERIFY', cleanupValidHours: 72,
    isBottleneck: false, isCriticalControl: false,
    status: 'ACTIVE', version: 'V1.0', updatedAt: '2026-01-10',
  },
  {
    opCode: 'GD-05', opName: '压片', opShort: '压片',
    category: 'PROD', factoryScope: 'NJ', workshop: 'NJ-固体车间',
    productLine: '固体制剂线', workCenter: 'GD-压片间',
    dosageForms: ['片剂', '咀嚼片'],
    equipments: [
      { equipCode: 'TAB-001', equipName: '高速压片机', model: 'GZPS-83（83冲）', qty: 1, isPrimary: true, protocol: 'OPC UA', autoCollect: true, calibPeriodDays: 180 },
      { equipCode: 'HAR-001', equipName: '片剂硬度仪', model: 'VK200', qty: 1, isPrimary: false, autoCollect: true, calibPeriodDays: 365 },
      { equipCode: 'FRI-001', equipName: '脆碎度测定仪', model: 'PTF-E', qty: 1, isPrimary: false, autoCollect: false, calibPeriodDays: 365 },
      { equipCode: 'WEI-003', equipName: '片重自动检测仪', model: 'CWDT-100', qty: 1, isPrimary: false, autoCollect: true, calibPeriodDays: 180 },
    ],
    stdTimeMin: 480, prepTimeMin: 60, cleanTimeMin: 120,
    batchSize: '100kg/批',
    qcParams: [
      { paramCode: 'QC-TAB-001', paramName: '片重差异', unit: '%', stdMin: -7.5, stdMax: 7.5, criticalLimit: '超±7.5%需停机，超±10%强制报废', inspMethod: '自动片重仪（每片）', inspFreq: '每片100%在线检测', isCritical: true, actionRequired: '停机、调整冲模压力，记录偏差' },
      { paramCode: 'QC-TAB-002', paramName: '片剂硬度', unit: 'N', stdMin: 50, stdMax: 80, inspMethod: '硬度仪（VK200）', inspFreq: '首件/每30min各3片', isCritical: true, actionRequired: '<50N停机提高压力；>80N降低压力' },
      { paramCode: 'QC-TAB-003', paramName: '脆碎度', unit: '%', stdMax: 1.0, criticalLimit: '>1%不合格，须报废或返工', inspMethod: '脆碎度仪（PTF-E）', inspFreq: '每批首件+末件', isCritical: true },
      { paramCode: 'QC-TAB-004', paramName: '崩解时限', unit: 'min', stdMax: 15, inspMethod: '崩解仪', inspFreq: '每批（IPQC）', isCritical: true },
      { paramCode: 'QC-TAB-005', paramName: '压片速度', unit: '片/min', stdMin: 50000, stdMax: 83000, inspMethod: 'OPC UA自动采集', inspFreq: '实时', isCritical: false },
    ],
    inspTrigger: 'CRITICAL',
    inspSchemeCode: 'QC-TAB-IPQC',
    yieldStd: '≥98%',
    gmpRequirements: [
      { gmpCode: 'GMP-TAB-01', requirement: '首件检验合格（片重/硬度/脆碎度/外观）后方可批量生产', regulation: 'GMP首件确认要求', isMandatory: true, verifyMethod: 'QC检验报告', docRequired: '首件检验记录' },
      { gmpCode: 'GMP-TAB-02', requirement: '每30min巡检一次（片重3片+硬度3片），结果记录于EBR', regulation: 'GMP过程控制要求', isMandatory: true, verifyMethod: '查EBR时间戳', docRequired: 'IPQC巡检记录' },
      { gmpCode: 'GMP-TAB-03', requirement: 'OPC UA实时采集压力/转速/片重，数据不可篡改存档', regulation: '数据完整性（ALCOA+）', isMandatory: true, verifyMethod: 'OPC UA数据审计追踪', docRequired: '设备运行数据报表' },
      { gmpCode: 'GMP-TAB-04', requirement: '冲模每次使用前目视检查，磨损或崩缺冲头立即更换', regulation: '设备状态管理', isMandatory: true, verifyMethod: '目视+操作记录', docRequired: '冲模使用记录' },
    ],
    cleanRoomLevel: 'D级', eSignLevel: 'OPERATOR_CHECKER_QA', dualPersonCheck: true, qaMonitorRequired: true,
    cleanupType: 'FULL', cleanupValidHours: 72,
    isBottleneck: true, isCriticalControl: true,
    status: 'ACTIVE', version: 'V1.0', updatedAt: '2026-01-10',
    remark: '⚡瓶颈工序：高速压片机GZPS-83；OPC UA实时数采；片重差异±7.5%；在线100%检重',
  },
  {
    opCode: 'GD-06', opName: '铝塑包装', opShort: '铝塑',
    category: 'PACK', factoryScope: 'NJ', workshop: 'NJ-固体车间',
    productLine: '固体制剂线', workCenter: 'GD-包装间',
    dosageForms: ['片剂', '咀嚼片'],
    equipments: [
      { equipCode: 'BLS-001', equipName: '铝塑泡罩包装机', model: 'DPH-260', qty: 1, isPrimary: true, protocol: 'OPC UA', autoCollect: true, calibPeriodDays: 180 },
      { equipCode: 'LEK-001', equipName: '铝塑密封性检漏仪', model: 'LT-10', qty: 1, isPrimary: false, autoCollect: false, calibPeriodDays: 365 },
    ],
    stdTimeMin: 240, prepTimeMin: 30, cleanTimeMin: 60,
    batchSize: '100kg/批 → 约12000板',
    qcParams: [
      { paramCode: 'QC-BLS-001', paramName: '密封性', unit: '-', stdValue: '气泡封口100%合格，目视无气孔/漏封', criticalLimit: '密封不合格品逐板剔除', inspMethod: '目视+检漏仪', inspFreq: '每批首板+每30min各2板', isCritical: true },
      { paramCode: 'QC-BLS-002', paramName: '批号/效期打印', unit: '-', stdValue: '与配料单/批记录一致，清晰可读', inspMethod: '目视核对+扫码', inspFreq: '每批首件+末件', isCritical: true },
      { paramCode: 'QC-BLS-003', paramName: '装量', unit: '片/板', stdValue: '规格一致，无缺粒', inspMethod: '目视逐板检查', inspFreq: '首件+每30min', isCritical: true },
    ],
    inspTrigger: 'AUTO_COMPLETE',
    yieldStd: '≥98%',
    gmpRequirements: [
      { gmpCode: 'GMP-BLS-01', requirement: '批号打印核对：批号/生产日期/有效期，与EBR批记录一致', regulation: '药品标签管理要求', isMandatory: true, verifyMethod: '扫码比对+QA核查', docRequired: 'EBR批记录' },
      { gmpCode: 'GMP-BLS-02', requirement: '收率计算≥98%，偏低需填写偏差报告', regulation: 'GMP物料平衡', isMandatory: true, verifyMethod: '物料平衡计算', docRequired: '物料平衡表' },
    ],
    cleanRoomLevel: 'D级', eSignLevel: 'OPERATOR_CHECKER', dualPersonCheck: false, qaMonitorRequired: false,
    cleanupType: 'FULL', cleanupValidHours: 72,
    isBottleneck: false, isCriticalControl: false,
    status: 'ACTIVE', version: 'V1.0', updatedAt: '2026-01-10',
  },
  {
    opCode: 'GD-07', opName: '外包装', opShort: '外包',
    category: 'PACK', factoryScope: 'ALL', workshop: 'NJ-固体车间',
    productLine: '固体制剂线', workCenter: 'GD-外包间',
    dosageForms: ['片剂', '咀嚼片', '粉剂', '软胶囊'],
    equipments: [
      { equipCode: 'BOX-001', equipName: '自动装盒机', model: 'ZH-120', qty: 1, isPrimary: true, protocol: 'OPC UA', autoCollect: true },
      { equipCode: 'BOX-002', equipName: '热收缩包装机', model: 'BSS-450', qty: 1, isPrimary: false, autoCollect: false },
    ],
    stdTimeMin: 180, prepTimeMin: 20, cleanTimeMin: 30,
    batchSize: '100kg/批 → 约2000盒',
    qcParams: [
      { paramCode: 'QC-BOX-001', paramName: '装盒完整性', unit: '-', stdValue: '说明书+铝塑板数量正确，盒盖密封', inspMethod: '目视抽检', inspFreq: '每批首件+每小时5盒', isCritical: false },
      { paramCode: 'QC-BOX-002', paramName: '标签', unit: '-', stdValue: '外箱标签：品名/批号/有效期/数量正确', inspMethod: '目视核对', inspFreq: '每批首件', isCritical: true },
    ],
    inspTrigger: 'AUTO_COMPLETE',
    yieldStd: '96%~100%',
    gmpRequirements: [
      { gmpCode: 'GMP-BOX-01', requirement: '外包装材料（盒/箱/标签）使用前按BOM核对，剩余材料计数退库', regulation: 'GMP包材控制', isMandatory: true, verifyMethod: '物料平衡核对', docRequired: '外包装材料使用记录' },
    ],
    cleanRoomLevel: '一般区', eSignLevel: 'OPERATOR', dualPersonCheck: false, qaMonitorRequired: false,
    cleanupType: 'SELF', cleanupValidHours: 72,
    isBottleneck: false, isCriticalControl: false,
    status: 'ACTIVE', version: 'V1.0', updatedAt: '2026-01-10',
    remark: '外包装终结点，物料平衡率96.0~100.0%，EBR批记录在此工序归档',
  },
];

// ════════════════════════════════════════════════════════════════
// 南京软胶囊车间 (NJ-RN) 工序数据 — 软胶囊
// ════════════════════════════════════════════════════════════════
const NJ_RN_OPERATIONS: PharmaOperation[] = [
  {
    opCode: 'RN-01', opName: '化胶', opShort: '化胶',
    category: 'PROD', factoryScope: 'NJ', workshop: 'NJ-软胶囊车间',
    productLine: '软胶囊生产线', workCenter: 'RN-化胶间',
    dosageForms: ['软胶囊'],
    equipments: [
      { equipCode: 'GEL-001', equipName: '全自动化胶罐', model: 'ZHJG-1（500L）', qty: 2, isPrimary: true, protocol: 'Modbus RTU', autoCollect: true, calibPeriodDays: 365 },
      { equipCode: 'VIS-001', equipName: '旋转粘度仪', model: 'DV2T', qty: 1, isPrimary: false, autoCollect: false, calibPeriodDays: 365 },
    ],
    stdTimeMin: 240, prepTimeMin: 30, cleanTimeMin: 90,
    batchSize: '500L胶液/批',
    qcParams: [
      { paramCode: 'QC-GEL-001', paramName: '明胶粘度', unit: 'mPa·s', stdMin: 3000, stdMax: 5000, criticalLimit: '<2500或>6000需重新配胶', inspMethod: '旋转粘度仪DV2T', inspFreq: '每批化胶完成后', isCritical: true, actionRequired: '超标停用，重新配制' },
      { paramCode: 'QC-GEL-002', paramName: '化胶温度', unit: '℃', stdMin: 60, stdMax: 70, inspMethod: 'Modbus温度传感器', inspFreq: '实时（每10min）', isCritical: true },
      { paramCode: 'QC-GEL-003', paramName: '明胶:甘油:水比例', unit: '-', stdValue: '100:28~32:80~120（按品种处方）', inspMethod: '称量核算', inspFreq: '每批', isCritical: true },
    ],
    inspTrigger: 'AUTO_COMPLETE',
    gmpRequirements: [
      { gmpCode: 'GMP-GEL-01', requirement: '明胶原料使用前检验合格证，批号可追溯至供应商', regulation: 'GMP原辅料控制', isMandatory: true, verifyMethod: '扫码核查COA', docRequired: '原料使用记录+COA' },
      { gmpCode: 'GMP-GEL-02', requirement: '化胶温度60~70℃；Modbus RTU实时采集，每10min记录一次', regulation: '工艺验证报告（PQ）', isMandatory: true, verifyMethod: 'Modbus数据', docRequired: 'EBR化胶记录' },
    ],
    cleanRoomLevel: 'D级', eSignLevel: 'OPERATOR_CHECKER', dualPersonCheck: true, qaMonitorRequired: false,
    cleanupType: 'FULL', cleanupValidHours: 48,
    isBottleneck: false, isCriticalControl: false,
    status: 'ACTIVE', version: 'V1.0', updatedAt: '2026-01-10',
  },
  {
    opCode: 'RN-02', opName: '配料/内容物', opShort: '配料',
    category: 'PROD', factoryScope: 'NJ', workshop: 'NJ-软胶囊车间',
    productLine: '软胶囊生产线', workCenter: 'RN-配料间',
    dosageForms: ['软胶囊'],
    equipments: [
      { equipCode: 'PYG-001', equipName: '内容物配料罐', model: 'PYG-200（双层夹套）', qty: 2, isPrimary: true, protocol: 'Modbus RTU', autoCollect: true },
      { equipCode: 'WEI-004', equipName: '精密天平', model: 'ME204E', qty: 2, isPrimary: false, autoCollect: true, calibPeriodDays: 365 },
    ],
    stdTimeMin: 120, prepTimeMin: 20, cleanTimeMin: 60,
    batchSize: '200L/批',
    qcParams: [
      { paramCode: 'QC-CONT-001', paramName: '含量测定（初检）', unit: '%', stdMin: 95, stdMax: 105, inspMethod: '高效液相/紫外分光光度法', inspFreq: '每批', isCritical: true },
      { paramCode: 'QC-CONT-002', paramName: '混合均匀性', unit: 'RSD%', stdMax: 3.0, inspMethod: '3点取样含量测定', inspFreq: '每批', isCritical: true },
    ],
    inspTrigger: 'AUTO_COMPLETE',
    gmpRequirements: [
      { gmpCode: 'GMP-CONT-01', requirement: '鱼油类内容物充氮保护，防止过氧化；过氧化值测定合格方可投产', regulation: '鱼油类产品特殊控制要求', isMandatory: true, verifyMethod: '过氧化值检测报告', docRequired: '检验报告' },
    ],
    cleanRoomLevel: 'D级', eSignLevel: 'OPERATOR_CHECKER', dualPersonCheck: true, qaMonitorRequired: false,
    cleanupType: 'FULL', cleanupValidHours: 48,
    isBottleneck: false, isCriticalControl: false,
    status: 'ACTIVE', version: 'V1.0', updatedAt: '2026-01-10',
  },
  {
    opCode: 'RN-03', opName: '压丸', opShort: '压丸',
    category: 'PROD', factoryScope: 'NJ', workshop: 'NJ-软胶囊车间',
    productLine: '软胶囊生产线', workCenter: 'RN-压丸间',
    dosageForms: ['软胶囊'],
    equipments: [
      { equipCode: 'SGC-001', equipName: '软胶囊机', model: 'YWJ250-IIIA', qty: 2, isPrimary: true, protocol: '私有协议（RS-485）', autoCollect: true, calibPeriodDays: 180 },
      { equipCode: 'MIC-001', equipName: '胶皮厚度千分尺', model: '外径千分尺0-25mm', qty: 2, isPrimary: false, autoCollect: false, calibPeriodDays: 365 },
      { equipCode: 'WEI-005', equipName: '精密天平（装量差异）', model: 'PL1501', qty: 2, isPrimary: false, autoCollect: false, calibPeriodDays: 365 },
    ],
    stdTimeMin: 600, prepTimeMin: 60, cleanTimeMin: 120,
    batchSize: '25万粒/批（约100kg）',
    qcParams: [
      { paramCode: 'QC-SGC-001', paramName: '装量差异', unit: '%', stdMin: -10, stdMax: 10, criticalLimit: '超±10%停机调整', inspMethod: '天平称量（每30min各10粒）', inspFreq: '首件+每30min', isCritical: true, actionRequired: '超限停机调整丸模' },
      { paramCode: 'QC-SGC-002', paramName: '胶皮厚度', unit: 'mm', stdMin: 0.70, stdMax: 0.80, stdValue: '0.75±0.05mm（鱼油专用0.80±0.05mm）', inspMethod: '千分尺测量（每30min各10粒）', inspFreq: '每30min', isCritical: true },
      { paramCode: 'QC-SGC-003', paramName: '外观', unit: '-', stdValue: '圆整光滑，颜色均一，无气泡/皱折/变形', inspMethod: '目视检查', inspFreq: '连续目视', isCritical: false },
      { paramCode: 'QC-SGC-004', paramName: '压丸速度', unit: '粒/h', stdMin: 200000, stdMax: 250000, inspMethod: '设备显示屏+私有协议采集', inspFreq: '实时', isCritical: false },
    ],
    inspTrigger: 'CRITICAL',
    inspSchemeCode: 'QC-SGC-IPQC',
    yieldStd: '≥97%（含干燥前）',
    gmpRequirements: [
      { gmpCode: 'GMP-SGC-01', requirement: '开机前确认化胶/配料均已QA放行；首丸检验合格方可批量生产', regulation: 'GMP首件确认', isMandatory: true, verifyMethod: '查QA签字', docRequired: '首件检验记录' },
      { gmpCode: 'GMP-SGC-02', requirement: '压丸间温度18~25℃，相对湿度35~55%；环境监控实时记录', regulation: 'GMP环境控制（软胶囊特殊要求）', isMandatory: true, verifyMethod: '温湿度记录仪', docRequired: '温湿度日志' },
      { gmpCode: 'GMP-SGC-03', requirement: '每30min记录装量差异/胶皮厚度，数据异常立即停机调整', regulation: 'GMP过程控制', isMandatory: true, verifyMethod: '查EBR时间戳', docRequired: 'IPQC记录' },
    ],
    cleanRoomLevel: 'D级', eSignLevel: 'OPERATOR_CHECKER_QA', dualPersonCheck: true, qaMonitorRequired: true,
    cleanupType: 'FULL', cleanupValidHours: 48,
    isBottleneck: true, isCriticalControl: true,
    status: 'ACTIVE', version: 'V1.0', updatedAt: '2026-01-10',
    remark: '⚡瓶颈工序：YWJ250-IIIA压丸；私有协议RS-485数采；装量差异±10%',
  },
  {
    opCode: 'RN-04', opName: '干燥', opShort: '干燥',
    category: 'PROD', factoryScope: 'NJ', workshop: 'NJ-软胶囊车间',
    productLine: '软胶囊生产线', workCenter: 'RN-干燥间',
    dosageForms: ['软胶囊'],
    equipments: [
      { equipCode: 'ROT-001', equipName: '干燥转笼', model: 'ZG-10（10组）', qty: 5, isPrimary: true, protocol: 'Modbus RTU', autoCollect: true },
      { equipCode: 'MOI-001', equipName: '水分测定仪', model: 'MB35', qty: 2, isPrimary: false, autoCollect: false, calibPeriodDays: 365 },
    ],
    stdTimeMin: 2880, prepTimeMin: 0, cleanTimeMin: 60,  // 48h标准干燥
    batchSize: '25万粒/批',
    qcParams: [
      { paramCode: 'QC-DRY-SGC-001', paramName: '干燥时间', unit: 'h', stdMin: 24, stdMax: 72, inspMethod: 'Modbus计时', inspFreq: '连续记录', isCritical: true },
      { paramCode: 'QC-DRY-SGC-002', paramName: '干燥室温度', unit: '℃', stdMin: 18, stdMax: 25, criticalLimit: '>28℃需立即处置（防止胶皮融合）', inspMethod: 'Modbus温度传感器（每8h记录）', inspFreq: '每8h', isCritical: true, actionRequired: '超限停机降温，记录偏差' },
      { paramCode: 'QC-DRY-SGC-003', paramName: '水分', unit: '%', stdMax: 9.0, inspMethod: '水分仪（干燥终点检测）', inspFreq: '每批完成后', isCritical: true },
    ],
    inspTrigger: 'AUTO_COMPLETE',
    gmpRequirements: [
      { gmpCode: 'GMP-DRY-SGC-01', requirement: '干燥时间24~72h，每8h记录温湿度；水分≤9.0%方可流转', regulation: '软胶囊干燥工艺规程', isMandatory: true, verifyMethod: '水分仪+Modbus记录', docRequired: 'EBR干燥记录' },
    ],
    cleanRoomLevel: 'D级', eSignLevel: 'OPERATOR', dualPersonCheck: false, qaMonitorRequired: false,
    cleanupType: 'SELF', cleanupValidHours: 48,
    isBottleneck: false, isCriticalControl: false,
    status: 'ACTIVE', version: 'V1.0', updatedAt: '2026-01-10',
  },
  {
    opCode: 'RN-05', opName: '拣丸', opShort: '拣丸',
    category: 'INSP', factoryScope: 'NJ', workshop: 'NJ-软胶囊车间',
    productLine: '软胶囊生产线', workCenter: 'RN-拣丸间',
    dosageForms: ['软胶囊'],
    equipments: [
      { equipCode: 'LIT-001', equipName: '拣丸台（光照台）', model: '专用检验台10套', qty: 10, isPrimary: true, autoCollect: false },
    ],
    stdTimeMin: 120, prepTimeMin: 10, cleanTimeMin: 20,
    batchSize: '25万粒/批',
    qcParams: [
      { paramCode: 'QC-PICK-001', paramName: '外观', unit: '-', stdValue: '圆整光滑，颜色均一；无气泡/皱折/渗油/变色/异形', inspMethod: '目视逐粒检查（强光台）', inspFreq: '100%全检', isCritical: true },
      { paramCode: 'QC-PICK-002', paramName: '密封性', unit: '-', stdValue: '无渗漏/油渍', inspMethod: '目视检查', inspFreq: '100%', isCritical: true },
      { paramCode: 'QC-PICK-003', paramName: 'AQL抽样', unit: '-', stdValue: 'AQL=0.65（GB/T 2828.1）', inspMethod: '外观+装量差异抽检', inspFreq: '每批抽样', isCritical: false },
    ],
    inspTrigger: 'AUTO_START',
    inspSchemeCode: 'QC-SGC-OQC',
    yieldStd: '≥99%（良率）',
    gmpRequirements: [
      { gmpCode: 'GMP-PICK-01', requirement: '拣丸操作人员需经培训认证；不合格品单独存放并记录', regulation: 'GMP人员要求', isMandatory: true, verifyMethod: '培训记录', docRequired: '不合格品记录' },
    ],
    cleanRoomLevel: 'D级', eSignLevel: 'OPERATOR', dualPersonCheck: false, qaMonitorRequired: false,
    cleanupType: 'SELF', cleanupValidHours: 48,
    isBottleneck: false, isCriticalControl: false,
    status: 'ACTIVE', version: 'V1.0', updatedAt: '2026-01-10',
  },
  {
    opCode: 'RN-06', opName: '包装', opShort: '包装',
    category: 'PACK', factoryScope: 'NJ', workshop: 'NJ-软胶囊车间',
    productLine: '软胶囊生产线', workCenter: 'RN-包装间',
    dosageForms: ['软胶囊'],
    equipments: [
      { equipCode: 'CNT-001', equipName: '自动数粒装瓶机', model: 'CT-2000', qty: 2, isPrimary: true, autoCollect: true },
      { equipCode: 'SEL-001', equipName: '铝箔感应封口机', model: 'GL-800', qty: 2, isPrimary: false, autoCollect: false },
    ],
    stdTimeMin: 180, prepTimeMin: 20, cleanTimeMin: 30,
    batchSize: '25万粒 → 约4000瓶',
    qcParams: [
      { paramCode: 'QC-PKG-SGC-001', paramName: '装量（粒数）', unit: '粒/瓶', stdValue: '规格粒数（如60粒），允差0粒', inspMethod: '数粒仪+人工复核', inspFreq: '首件+每30min5瓶', isCritical: true },
      { paramCode: 'QC-PKG-SGC-002', paramName: '封口密封性', unit: '-', stdValue: '铝箔封口完整，无虚封', inspMethod: '目视+拉力检查', inspFreq: '首件+每小时3瓶', isCritical: true },
    ],
    inspTrigger: 'AUTO_COMPLETE',
    yieldStd: '96%~100%',
    gmpRequirements: [
      { gmpCode: 'GMP-PKG-SGC-01', requirement: '充氮产品（鱼油）封盖前充氮，顶空氧气浓度≤2%', regulation: '鱼油软胶囊特殊工艺要求', isMandatory: true, verifyMethod: '顶空气体分析仪', docRequired: '充氮记录' },
    ],
    cleanRoomLevel: 'D级', eSignLevel: 'OPERATOR_CHECKER', dualPersonCheck: false, qaMonitorRequired: false,
    cleanupType: 'FULL', cleanupValidHours: 48,
    isBottleneck: false, isCriticalControl: false,
    status: 'ACTIVE', version: 'V1.0', updatedAt: '2026-01-10',
  },
];

// ════════════════════════════════════════════════════════════════
// 溧水固体车间 (LS-GD) 工序数据 — 粉剂
// ════════════════════════════════════════════════════════════════
const LS_GD_OPERATIONS: PharmaOperation[] = [
  {
    opCode: 'LS-GD-01', opName: '称量配料', opShort: '称量',
    category: 'PROD', factoryScope: 'LS', workshop: 'LS-固体车间',
    productLine: '粉剂分装线', workCenter: 'LS-配料室',
    dosageForms: ['粉剂', '颗粒剂'],
    equipments: [
      { equipCode: 'LS-WEI-001', equipName: '防潮精密电子秤', model: 'JA2003', qty: 2, isPrimary: true, autoCollect: true, calibPeriodDays: 365 },
      { equipCode: 'LS-WEI-002', equipName: '工业台秤（防潮型）', model: 'TCS-100', qty: 1, isPrimary: false, autoCollect: false, calibPeriodDays: 180 },
    ],
    stdTimeMin: 120, prepTimeMin: 20, cleanTimeMin: 45,
    batchSize: '100kg/批',
    qcParams: [
      { paramCode: 'QC-LS-WT-001', paramName: '称量误差', unit: '%', stdMin: -0.3, stdMax: 0.3, inspMethod: '电子秤双人核对', inspFreq: '每件', isCritical: true },
      { paramCode: 'QC-LS-WT-002', paramName: '外观', unit: '-', stdValue: '粉末流散性良好，无结块，颜色均一', inspMethod: '目视检查', inspFreq: '每批每件', isCritical: false },
    ],
    inspTrigger: 'AUTO_START',
    gmpRequirements: [
      { gmpCode: 'GMP-LS-WT-01', requirement: '蛋白粉吸湿敏感：配料间相对湿度≤40%，温度18~24℃', regulation: '溧水工厂粉剂特殊环境控制', isMandatory: true, verifyMethod: '温湿度记录仪', docRequired: '环境监测记录' },
    ],
    cleanRoomLevel: 'D级', eSignLevel: 'OPERATOR_CHECKER', dualPersonCheck: true, qaMonitorRequired: false,
    cleanupType: 'QA_VERIFY', cleanupValidHours: 72,
    isBottleneck: false, isCriticalControl: false,
    status: 'ACTIVE', version: 'V1.0', updatedAt: '2026-01-10',
  },
  {
    opCode: 'LS-GD-02', opName: '混合', opShort: '混合',
    category: 'PROD', factoryScope: 'LS', workshop: 'LS-固体车间',
    productLine: '粉剂分装线', workCenter: 'LS-混合间',
    dosageForms: ['粉剂'],
    equipments: [
      { equipCode: 'LS-MIX-001', equipName: 'V型混合机', model: 'VH-100（100L）', qty: 1, isPrimary: true, protocol: 'Modbus RTU', autoCollect: true },
    ],
    stdTimeMin: 90, prepTimeMin: 15, cleanTimeMin: 60,
    batchSize: '100L/批',
    qcParams: [
      { paramCode: 'QC-LS-MIX-001', paramName: '混合均匀性RSD', unit: '%', stdMax: 5.0, inspMethod: '5点取样含量测定', inspFreq: '每批', isCritical: true },
      { paramCode: 'QC-LS-MIX-002', paramName: '混合时间', unit: 'min', stdMin: 15, stdMax: 25, inspMethod: 'Modbus计时', inspFreq: '每批', isCritical: false },
    ],
    inspTrigger: 'AUTO_COMPLETE',
    gmpRequirements: [
      { gmpCode: 'GMP-LS-MIX-01', requirement: 'V型混合机内壁光滑，清洁合格证有效期内使用', regulation: 'GMP设备清洁管理', isMandatory: true, verifyMethod: '清洁验证记录', docRequired: '清场合格证（72h有效）' },
    ],
    cleanRoomLevel: 'D级', eSignLevel: 'OPERATOR', dualPersonCheck: false, qaMonitorRequired: false,
    cleanupType: 'FULL', cleanupValidHours: 72,
    isBottleneck: false, isCriticalControl: false,
    status: 'ACTIVE', version: 'V1.0', updatedAt: '2026-01-10',
  },
  {
    opCode: 'LS-GD-03', opName: '分装', opShort: '分装',
    category: 'PACK', factoryScope: 'LS', workshop: 'LS-固体车间',
    productLine: '粉剂分装线', workCenter: 'LS-分装间',
    dosageForms: ['粉剂'],
    equipments: [
      { equipCode: 'LS-FIL-001', equipName: '自动粉剂分装机', model: 'FB-10（全自动）', qty: 2, isPrimary: true, protocol: 'OPC UA', autoCollect: true, calibPeriodDays: 365 },
      { equipCode: 'LS-SEL-001', equipName: '热封机', model: 'FS-200', qty: 2, isPrimary: false, autoCollect: false },
    ],
    stdTimeMin: 360, prepTimeMin: 30, cleanTimeMin: 60,
    batchSize: '100kg → 约10000袋',
    qcParams: [
      { paramCode: 'QC-LS-FIL-001', paramName: '装量差异', unit: '%', stdMin: -5, stdMax: 5, criticalLimit: '超±5%停机调整', inspMethod: '天平称量（每30min各5袋）', inspFreq: '首件+每30min', isCritical: true, actionRequired: '调整计量器，记录偏差' },
      { paramCode: 'QC-LS-FIL-002', paramName: '封口温度', unit: '℃', stdMin: 170, stdMax: 190, inspMethod: '温控仪+OPC UA', inspFreq: '实时', isCritical: true },
      { paramCode: 'QC-LS-FIL-003', paramName: '密封性', unit: '-', stdValue: '热封部位完整，无虚封/破损', inspMethod: '目视+气密性抽检', inspFreq: '首件+每小时10袋', isCritical: true },
    ],
    inspTrigger: 'CRITICAL',
    inspSchemeCode: 'QC-PWD-IPQC',
    yieldStd: '≥99%',
    gmpRequirements: [
      { gmpCode: 'GMP-LS-FIL-01', requirement: '⚡瓶颈工序：分装精度直接影响产品质量和物料平衡，首件检验后方可批量生产', regulation: 'GMP工序控制', isMandatory: true, verifyMethod: '首件检验记录', docRequired: 'EBR分装记录' },
    ],
    cleanRoomLevel: 'D级', eSignLevel: 'OPERATOR_CHECKER_QA', dualPersonCheck: true, qaMonitorRequired: true,
    cleanupType: 'FULL', cleanupValidHours: 72,
    isBottleneck: true, isCriticalControl: true,
    status: 'ACTIVE', version: 'V1.0', updatedAt: '2026-01-10',
    remark: '⚡瓶颈工序：FB-10自动分装；装量差异±5%；OPC UA实时采集',
  },
  {
    opCode: 'LS-GD-04', opName: '外包装', opShort: '外包',
    category: 'PACK', factoryScope: 'LS', workshop: 'LS-固体车间',
    productLine: '粉剂分装线', workCenter: 'LS-外包间',
    dosageForms: ['粉剂'],
    equipments: [
      { equipCode: 'LS-BOX-001', equipName: '装盒机', model: 'ZH-80', qty: 1, isPrimary: true, autoCollect: false },
    ],
    stdTimeMin: 120, prepTimeMin: 15, cleanTimeMin: 20,
    batchSize: '10000袋 → 约333盒',
    qcParams: [
      { paramCode: 'QC-LS-BOX-001', paramName: '装盒完整性', unit: '-', stdValue: '30袋/盒，说明书1张，盒型正确', inspMethod: '目视抽检', inspFreq: '每批首件+每小时', isCritical: false },
    ],
    inspTrigger: 'AUTO_COMPLETE',
    yieldStd: '96%~100%',
    gmpRequirements: [],
    cleanRoomLevel: '一般区', eSignLevel: 'OPERATOR', dualPersonCheck: false, qaMonitorRequired: false,
    cleanupType: 'SELF', cleanupValidHours: 72,
    isBottleneck: false, isCriticalControl: false,
    status: 'ACTIVE', version: 'V1.0', updatedAt: '2026-01-10',
  },
];

// ════════════════════════════════════════════════════════════════
// 溧水液体车间 (LS-YQ) 工序数据 — 口服液
// ════════════════════════════════════════════════════════════════
const LS_YQ_OPERATIONS: PharmaOperation[] = [
  {
    opCode: 'YQ-01', opName: '称量配料', opShort: '称量',
    category: 'PROD', factoryScope: 'LS', workshop: 'LS-液体车间',
    productLine: '口服液灌装线', workCenter: 'LS-YQ-配料室',
    dosageForms: ['口服液'],
    equipments: [
      { equipCode: 'YQ-WEI-001', equipName: '液体计量天平', model: 'PL12001', qty: 2, isPrimary: true, autoCollect: true, calibPeriodDays: 365 },
    ],
    stdTimeMin: 90, prepTimeMin: 20, cleanTimeMin: 30,
    batchSize: '500L/批',
    qcParams: [
      { paramCode: 'QC-YQ-WT-001', paramName: '称量误差', unit: '%', stdMin: -0.3, stdMax: 0.3, inspMethod: '天平双人核对', inspFreq: '每件', isCritical: true },
    ],
    inspTrigger: 'AUTO_START',
    gmpRequirements: [
      { gmpCode: 'GMP-YQ-WT-01', requirement: '液体原料近效期（6个月内）需QA批准；溶解度/pH初检合格', regulation: 'GMP原辅料控制', isMandatory: true, verifyMethod: '查检验报告', docRequired: 'COA+检验报告' },
    ],
    cleanRoomLevel: 'D级', eSignLevel: 'OPERATOR_CHECKER', dualPersonCheck: true, qaMonitorRequired: false,
    cleanupType: 'QA_VERIFY', cleanupValidHours: 48,
    isBottleneck: false, isCriticalControl: false,
    status: 'ACTIVE', version: 'V1.0', updatedAt: '2026-01-10',
  },
  {
    opCode: 'YQ-02', opName: '配制/混合', opShort: '配制',
    category: 'PROD', factoryScope: 'LS', workshop: 'LS-液体车间',
    productLine: '口服液灌装线', workCenter: 'LS-YQ-配制间',
    dosageForms: ['口服液'],
    equipments: [
      { equipCode: 'YQ-MIX-001', equipName: '配料罐（双层夹套）', model: 'HSPY-500（500L）', qty: 2, isPrimary: true, protocol: 'Modbus TCP', autoCollect: true, calibPeriodDays: 365 },
      { equipCode: 'YQ-PH-001', equipName: 'pH计（在线型）', model: 'S220-K', qty: 2, isPrimary: false, autoCollect: true, calibPeriodDays: 90 },
      { equipCode: 'YQ-DEN-001', equipName: '密度计（在线型）', model: 'DMA-35', qty: 1, isPrimary: false, autoCollect: true, calibPeriodDays: 180 },
    ],
    stdTimeMin: 180, prepTimeMin: 30, cleanTimeMin: 60,
    batchSize: '500L/批',
    qcParams: [
      { paramCode: 'QC-YQ-MIX-001', paramName: 'pH值', unit: '-', stdMin: 3.5, stdMax: 5.5, criticalLimit: '<3.0或>6.0强制重配', inspMethod: 'pH计在线测定（Modbus TCP）', inspFreq: '实时（每15min）', isCritical: true, actionRequired: '超限停产，重新调配' },
      { paramCode: 'QC-YQ-MIX-002', paramName: '相对密度', unit: 'g/cm³', stdMin: 1.02, stdMax: 1.08, inspMethod: '在线密度计DMA-35', inspFreq: '每批配制完成', isCritical: true },
      { paramCode: 'QC-YQ-MIX-003', paramName: '配制温度', unit: '℃', stdMin: 60, stdMax: 80, inspMethod: 'Modbus TCP温度传感器', inspFreq: '实时', isCritical: false },
    ],
    inspTrigger: 'AUTO_COMPLETE',
    gmpRequirements: [
      { gmpCode: 'GMP-YQ-MIX-01', requirement: 'pH和相对密度检验合格，由QC签字放行后方可灌装', regulation: 'GMP过程放行要求', isMandatory: true, verifyMethod: 'QC检验报告+EBR签名', docRequired: '半成品检验报告' },
    ],
    cleanRoomLevel: 'C级', eSignLevel: 'OPERATOR_CHECKER', dualPersonCheck: false, qaMonitorRequired: false,
    cleanupType: 'FULL', cleanupValidHours: 48,
    isBottleneck: false, isCriticalControl: false,
    status: 'ACTIVE', version: 'V1.0', updatedAt: '2026-01-10',
  },
  {
    opCode: 'YQ-03', opName: '灌装', opShort: '灌装',
    category: 'PROD', factoryScope: 'LS', workshop: 'LS-液体车间',
    productLine: '口服液灌装线', workCenter: 'LS-YQ-灌装间',
    dosageForms: ['口服液'],
    equipments: [
      { equipCode: 'YQ-FILL-001', equipName: '液体灌装线', model: 'XZKGS32（32头高速灌装）', qty: 1, isPrimary: true, protocol: 'OPC UA', autoCollect: true, calibPeriodDays: 180 },
      { equipCode: 'YQ-FILL-002', equipName: '在线检重仪', model: 'CW3000', qty: 1, isPrimary: false, autoCollect: true, calibPeriodDays: 90 },
    ],
    stdTimeMin: 360, prepTimeMin: 60, cleanTimeMin: 90,
    batchSize: '500L → 约50000支(10ml)',
    qcParams: [
      { paramCode: 'QC-YQ-FILL-001', paramName: '装量差异', unit: '%', stdMin: -5, stdMax: 5, criticalLimit: '超±5%立即停机', inspMethod: '在线检重仪（每支）', inspFreq: '100%在线检重', isCritical: true, actionRequired: '超限停机，不合格品锁定单独处理' },
      { paramCode: 'QC-YQ-FILL-002', paramName: '密封性', unit: '-', stdValue: '瓶盖扭矩2.5~3.5N·m，无渗漏', inspMethod: '扭矩仪抽检', inspFreq: '首件+每30min5瓶', isCritical: true },
      { paramCode: 'QC-YQ-FILL-003', paramName: '灌装速度', unit: '瓶/min', stdMin: 150, stdMax: 200, inspMethod: 'OPC UA自动采集', inspFreq: '实时', isCritical: false },
    ],
    inspTrigger: 'CRITICAL',
    inspSchemeCode: 'QC-LIQ-IPQC',
    yieldStd: '≥99%',
    gmpRequirements: [
      { gmpCode: 'GMP-YQ-FILL-01', requirement: '灌装间洁净度C级；开机前环境监测（浮游菌≤50CFU/m³）合格', regulation: 'GMP口服液生产洁净要求', isMandatory: true, verifyMethod: '浮游菌采样检测', docRequired: '环境监测报告' },
      { gmpCode: 'GMP-YQ-FILL-02', requirement: '⚡瓶颈工序：不合格品（装量超差）强制锁定，不得混入合格品', regulation: 'GMP不合格品控制', isMandatory: true, verifyMethod: 'EBR不合格品记录', docRequired: '不合格品处置记录' },
    ],
    cleanRoomLevel: 'C级', eSignLevel: 'OPERATOR_CHECKER_QA', dualPersonCheck: true, qaMonitorRequired: true,
    cleanupType: 'FULL', cleanupValidHours: 48,
    isBottleneck: true, isCriticalControl: true,
    status: 'ACTIVE', version: 'V1.0', updatedAt: '2026-01-10',
    remark: '⚡瓶颈工序：XZKGS32灌装线；OPC UA实时数采；装量差异±5%；200瓶/min',
  },
  {
    opCode: 'YQ-04', opName: '灭菌', opShort: '灭菌',
    category: 'SPEC', factoryScope: 'LS', workshop: 'LS-液体车间',
    productLine: '口服液灌装线', workCenter: 'LS-YQ-灭菌间',
    dosageForms: ['口服液'],
    equipments: [
      { equipCode: 'YQ-STR-001', equipName: '热压灭菌柜', model: 'SG-2.0（2000L）', qty: 2, isPrimary: true, protocol: 'Modbus TCP', autoCollect: true, calibPeriodDays: 180 },
      { equipCode: 'YQ-STR-002', equipName: 'F0值实时计算器', model: 'Eurotherm 2704（含F0算法）', qty: 2, isPrimary: false, autoCollect: true, calibPeriodDays: 365 },
    ],
    stdTimeMin: 240, prepTimeMin: 30, cleanTimeMin: 30,
    batchSize: '2000L/批（约200000支10ml）',
    qcParams: [
      {
        paramCode: 'QC-YQ-STR-001', paramName: 'F0值（灭菌效能）', unit: 'min',
        stdMin: 8, stdMax: 999,
        criticalLimit: '🔴 F0<8min：强制报废，不得返工，立即生成偏差单上报QA',
        inspMethod: 'Modbus TCP实时计算（Eurotherm F0算法）',
        inspFreq: '实时计算，每批记录F0曲线全程', isCritical: true,
        actionRequired: 'F0<8min：整批报废+偏差调查+CAPA；F0 8~10min：QA评估后决定',
      },
      { paramCode: 'QC-YQ-STR-002', paramName: '灭菌温度', unit: '℃', stdMin: 121, stdMax: 123, criticalLimit: '<118℃需立即评估', inspMethod: 'Modbus TCP温度传感器（多点）', inspFreq: '实时（每30s）', isCritical: true },
      { paramCode: 'QC-YQ-STR-003', paramName: '灭菌时间', unit: 'min', stdMin: 15, stdMax: 30, inspMethod: 'Modbus TCP计时', inspFreq: '每批', isCritical: true },
      { paramCode: 'QC-YQ-STR-004', paramName: '压力', unit: 'MPa', stdMin: 0.1, stdMax: 0.13, inspMethod: 'Modbus TCP压力传感器', inspFreq: '实时', isCritical: false },
    ],
    inspTrigger: 'CRITICAL',
    inspSchemeCode: 'QC-STR-F0',
    yieldStd: '100%（F0≥8min全部合格；低于报废）',
    gmpRequirements: [
      { gmpCode: 'GMP-YQ-STR-01', requirement: '🔴 关键控制点：F0值≥8min为灭菌效能强制标准，低于下限整批报废，不得返工', regulation: '中华人民共和国药典2020版（附录 灭菌法）', isMandatory: true, verifyMethod: 'Modbus TCP实时F0值+EBR自动记录', docRequired: 'F0值监控记录（含F0曲线图）' },
      { gmpCode: 'GMP-YQ-STR-02', requirement: '灭菌参数验证（热分布/热穿透）经QA批准，严格按验证结果执行', regulation: 'GMP验证管理规定', isMandatory: true, verifyMethod: '工艺验证报告', docRequired: '灭菌验证报告' },
      { gmpCode: 'GMP-YQ-STR-03', requirement: '灭菌前/后产品物理隔离，防止混淆；已灭菌产品贴绿色标签', regulation: 'GMP状态管理', isMandatory: true, verifyMethod: '现场检查+EBR记录', docRequired: '状态标签记录' },
    ],
    cleanRoomLevel: 'D级', eSignLevel: 'OPERATOR_CHECKER_QA', dualPersonCheck: true, qaMonitorRequired: true,
    cleanupType: 'FULL', cleanupValidHours: 48,
    isBottleneck: true, isCriticalControl: true,
    status: 'ACTIVE', version: 'V1.0', updatedAt: '2026-01-10',
    remark: '🔑 关键控制点(CCP)：F0值≥8min强制要求；低于下限整批报废；Modbus TCP实时监控',
  },
  {
    opCode: 'YQ-05', opName: '灯检', opShort: '灯检',
    category: 'INSP', factoryScope: 'LS', workshop: 'LS-液体车间',
    productLine: '口服液灌装线', workCenter: 'LS-YQ-灯检台',
    dosageForms: ['口服液'],
    equipments: [
      { equipCode: 'YQ-LIT-001', equipName: '灯检台（高亮背光）', model: 'JJY-2灯检台', qty: 6, isPrimary: true, autoCollect: false },
    ],
    stdTimeMin: 120, prepTimeMin: 10, cleanTimeMin: 15,
    batchSize: '50000支/批',
    qcParams: [
      { paramCode: 'QC-YQ-LIT-001', paramName: '可见异物', unit: '-', stdValue: '无白点/黑点/纤维/气泡等可见异物', inspMethod: '逐瓶灯检（白黑背景交替）', inspFreq: '100%全检', isCritical: true },
      { paramCode: 'QC-YQ-LIT-002', paramName: '外观（破瓶/变色/浑浊）', unit: '-', stdValue: '无破损、液体澄清、颜色均一', inspMethod: '目视检查', inspFreq: '100%', isCritical: true },
      { paramCode: 'QC-YQ-LIT-003', paramName: 'AQL终检抽样', unit: '-', stdValue: 'AQL=0.65（GB/T 2828.1）', inspMethod: '外观+装量抽检', inspFreq: '每批', isCritical: false },
    ],
    inspTrigger: 'AUTO_START',
    inspSchemeCode: 'QC-LIQ-LAMP',
    yieldStd: '≥99%',
    gmpRequirements: [
      { gmpCode: 'GMP-YQ-LIT-01', requirement: '灯检人员视力≥1.0（矫正），连续工作不超过1.5h需休息15min', regulation: 'GMP人员管理（灯检特殊要求）', isMandatory: true, verifyMethod: '视力检查记录', docRequired: '灯检人员资质档案' },
    ],
    cleanRoomLevel: 'D级', eSignLevel: 'OPERATOR', dualPersonCheck: false, qaMonitorRequired: false,
    cleanupType: 'SELF', cleanupValidHours: 48,
    isBottleneck: false, isCriticalControl: false,
    status: 'ACTIVE', version: 'V1.0', updatedAt: '2026-01-10',
  },
  {
    opCode: 'YQ-06', opName: '外包装', opShort: '外包',
    category: 'PACK', factoryScope: 'LS', workshop: 'LS-液体车间',
    productLine: '口服液灌装线', workCenter: 'LS-YQ-外包间',
    dosageForms: ['口服液'],
    equipments: [
      { equipCode: 'YQ-BOX-001', equipName: '贴标机', model: 'KLCP-160（圆瓶全周贴）', qty: 2, isPrimary: true, autoCollect: false },
      { equipCode: 'YQ-BOX-002', equipName: '喷码机', model: 'Markem-Imaje 9030', qty: 2, isPrimary: false, autoCollect: false },
    ],
    stdTimeMin: 120, prepTimeMin: 15, cleanTimeMin: 20,
    batchSize: '50000支 → 约1667盒',
    qcParams: [
      { paramCode: 'QC-YQ-BOX-001', paramName: '标签贴附', unit: '-', stdValue: '位置端正，无气泡/褶皱，批号/效期清晰', inspMethod: '目视抽检', inspFreq: '首件+每小时10瓶', isCritical: true },
    ],
    inspTrigger: 'AUTO_COMPLETE',
    yieldStd: '96%~100%',
    gmpRequirements: [],
    cleanRoomLevel: '一般区', eSignLevel: 'OPERATOR', dualPersonCheck: false, qaMonitorRequired: false,
    cleanupType: 'SELF', cleanupValidHours: 48,
    isBottleneck: false, isCriticalControl: false,
    status: 'ACTIVE', version: 'V1.0', updatedAt: '2026-01-10',
  },
];

// ════════════════════════════════════════════════════════════════
// 外包车间通用 (WB) 工序数据 — 赋码/外包
// ════════════════════════════════════════════════════════════════
const WB_OPERATIONS: PharmaOperation[] = [
  {
    opCode: 'WB-01', opName: '成品接收/核对', opShort: '接收',
    category: 'INSP', factoryScope: 'ALL', workshop: '通用',
    productLine: '外包赋码线', workCenter: 'WB-接收区',
    dosageForms: ['片剂', '软胶囊', '粉剂', '口服液'],
    equipments: [
      { equipCode: 'WB-BAR-001', equipName: '条码扫描枪', model: 'Zebra DS2208', qty: 4, isPrimary: true, autoCollect: true },
    ],
    stdTimeMin: 30, prepTimeMin: 10, cleanTimeMin: 10,
    qcParams: [
      { paramCode: 'QC-WB-01', paramName: '交接数量', unit: '-', stdValue: '与上工序移交单一致', inspMethod: '清点+扫码', inspFreq: '每批', isCritical: true },
    ],
    inspTrigger: 'AUTO_START',
    gmpRequirements: [],
    cleanRoomLevel: '一般区', eSignLevel: 'OPERATOR', dualPersonCheck: false, qaMonitorRequired: false,
    cleanupType: 'SELF', cleanupValidHours: 72,
    isBottleneck: false, isCriticalControl: false,
    status: 'ACTIVE', version: 'V1.0', updatedAt: '2026-01-10',
  },
  {
    opCode: 'WB-02', opName: '产品码赋码', opShort: '赋码',
    category: 'PACK', factoryScope: 'ALL', workshop: '通用',
    productLine: '外包赋码线', workCenter: 'WB-赋码区',
    dosageForms: ['片剂', '软胶囊', '粉剂', '口服液'],
    equipments: [
      { equipCode: 'WB-PRN-001', equipName: '高分辨喷码机', model: 'Markem-Imaje 9450（UV码）', qty: 2, isPrimary: true, protocol: 'OPC UA', autoCollect: true },
      { equipCode: 'WB-VER-001', equipName: '条码视觉检测仪', model: 'Cognex In-Sight 7000', qty: 2, isPrimary: false, autoCollect: true },
    ],
    stdTimeMin: 60, prepTimeMin: 20, cleanTimeMin: 15,
    batchSize: '按产品规格',
    qcParams: [
      { paramCode: 'QC-WB-02-001', paramName: '产品码打印质量', unit: '-', stdValue: 'GS1-128条码质量等级≥C级（ISO 15416）', inspMethod: '条码视觉检测仪100%检测', inspFreq: '每件', isCritical: true, actionRequired: '不合格品剔除，重新打印' },
      { paramCode: 'QC-WB-02-002', paramName: '码值正确性', unit: '-', stdValue: '产品码含：GTIN+批号+有效期+序列号，与ERP一致', inspMethod: '系统自动比对', inspFreq: '每件', isCritical: true },
    ],
    inspTrigger: 'CRITICAL',
    gmpRequirements: [
      { gmpCode: 'GMP-WB-02-01', requirement: 'GS1标准三级码（产品码→箱码→托盘码）关联，确保追溯链完整', regulation: '《药品追溯系统建设导则》', isMandatory: true, verifyMethod: '系统自动验证关联关系', docRequired: '赋码记录+追溯系统数据' },
    ],
    cleanRoomLevel: '一般区', eSignLevel: 'OPERATOR', dualPersonCheck: false, qaMonitorRequired: false,
    cleanupType: 'SELF', cleanupValidHours: 72,
    isBottleneck: false, isCriticalControl: false,
    status: 'ACTIVE', version: 'V1.0', updatedAt: '2026-01-10',
  },
  {
    opCode: 'WB-03', opName: '赋码关联', opShort: '关联',
    category: 'PACK', factoryScope: 'ALL', workshop: '通用',
    productLine: '外包赋码线', workCenter: 'WB-赋码区',
    dosageForms: ['片剂', '软胶囊', '粉剂', '口服液'],
    equipments: [
      { equipCode: 'WB-AGG-001', equipName: '聚合赋码工作站', model: 'Mettler Toledo Track-and-Trace', qty: 2, isPrimary: true, protocol: 'OPC UA', autoCollect: true },
      { equipCode: 'WB-AGG-002', equipName: '2D码扫描枪', model: 'Zebra DS8178', qty: 4, isPrimary: false, autoCollect: true },
    ],
    stdTimeMin: 60, prepTimeMin: 15, cleanTimeMin: 10,
    batchSize: '按产品规格',
    qcParams: [
      { paramCode: 'QC-WB-03-001', paramName: '三级码关联完整性', unit: '%', stdMin: 100, stdMax: 100, criticalLimit: '<100%不得放行出库', inspMethod: '系统自动验证', inspFreq: '每批100%', isCritical: true, actionRequired: '未关联品退回重新关联' },
    ],
    inspTrigger: 'CRITICAL',
    gmpRequirements: [
      { gmpCode: 'GMP-WB-03-01', requirement: '产品码→箱码→托盘码三级聚合关联，追溯链闭合，上报药品追溯系统', regulation: '国家药品监督管理局药品追溯系统', isMandatory: true, verifyMethod: 'OPC UA数据+追溯系统验证', docRequired: 'EBR赋码记录' },
    ],
    cleanRoomLevel: '一般区', eSignLevel: 'OPERATOR_CHECKER', dualPersonCheck: false, qaMonitorRequired: false,
    cleanupType: 'SELF', cleanupValidHours: 72,
    isBottleneck: false, isCriticalControl: false,
    status: 'ACTIVE', version: 'V1.0', updatedAt: '2026-01-10',
    remark: 'GS1-128三级码：产品码→箱码→托盘码关联；追溯链闭合；上报国家药品追溯系统',
  },
  {
    opCode: 'WB-04', opName: '入库/成品检验', opShort: '入库',
    category: 'QC', factoryScope: 'ALL', workshop: '通用',
    productLine: '外包赋码线', workCenter: 'WB-成检区',
    dosageForms: ['片剂', '软胶囊', '粉剂', '口服液'],
    equipments: [],
    stdTimeMin: 30, prepTimeMin: 5, cleanTimeMin: 5,
    qcParams: [
      { paramCode: 'QC-WB-04-001', paramName: '成品外观', unit: '-', stdValue: 'AQL=0.65抽样，外观/标签/批号合格', inspMethod: 'AQL抽样检验', inspFreq: '每批', isCritical: true },
      { paramCode: 'QC-WB-04-002', paramName: '物料平衡', unit: '%', stdMin: 96, stdMax: 102, criticalLimit: '<96%或>102%需偏差调查', inspMethod: '物料平衡计算', inspFreq: '每批', isCritical: true, actionRequired: '填写偏差报告，QA审核' },
    ],
    inspTrigger: 'AUTO_COMPLETE',
    inspSchemeCode: 'QC-FG-OQC',
    yieldStd: '96%~102%（物料平衡）',
    gmpRequirements: [
      { gmpCode: 'GMP-WB-04-01', requirement: '物料平衡率96.0%~102.0%，超出范围需偏差调查，QA批准方可放行', regulation: 'GMP物料平衡要求', isMandatory: true, verifyMethod: '物料平衡计算表', docRequired: 'EBR物料平衡表' },
    ],
    cleanRoomLevel: '一般区', eSignLevel: 'OPERATOR_CHECKER_QA', dualPersonCheck: false, qaMonitorRequired: true,
    cleanupType: 'SELF', cleanupValidHours: 72,
    isBottleneck: false, isCriticalControl: false,
    status: 'ACTIVE', version: 'V1.0', updatedAt: '2026-01-10',
    remark: '物料平衡率标准：96.0%~102.0%；超范围需QA偏差调查',
  },
];

// ════════════════════════════════════════════════════════════════
// 原料入库检验工序（通用）
// ════════════════════════════════════════════════════════════════
const INCOMING_INSP_OPERATIONS: PharmaOperation[] = [
  {
    opCode: 'QC-IQC-001', opName: '原料入库检验', opShort: '原料检',
    category: 'QC', factoryScope: 'ALL', workshop: '通用',
    productLine: '质量控制', workCenter: 'QC-检验室',
    dosageForms: ['片剂', '软胶囊', '粉剂', '口服液'],
    equipments: [
      { equipCode: 'QC-HPLC-001', equipName: '高效液相色谱仪', model: 'Agilent 1260', qty: 2, isPrimary: true, autoCollect: true, calibPeriodDays: 365 },
      { equipCode: 'QC-UV-001', equipName: '紫外分光光度计', model: 'UV-1800', qty: 2, isPrimary: false, autoCollect: false, calibPeriodDays: 365 },
      { equipCode: 'QC-IR-001', equipName: '红外光谱仪（鉴别）', model: 'NICOLET iS5', qty: 1, isPrimary: false, autoCollect: false, calibPeriodDays: 365 },
    ],
    stdTimeMin: 480, prepTimeMin: 60, cleanTimeMin: 30,
    qcParams: [
      { paramCode: 'QC-IQC-WT', paramName: '含量/效价', unit: '%', stdMin: 98, stdMax: 102, inspMethod: 'HPLC或紫外分光光度法', inspFreq: '每批', isCritical: true },
      { paramCode: 'QC-IQC-APP', paramName: '外观/性状', unit: '-', stdValue: '与质量标准一致', inspMethod: '感官/理化检验', inspFreq: '每批', isCritical: false },
      { paramCode: 'QC-IQC-ID', paramName: '鉴别', unit: '-', stdValue: 'IR/HPLC鉴别符合规定', inspMethod: '红外或HPLC对照品鉴别', inspFreq: '每批', isCritical: true },
      { paramCode: 'QC-IQC-MIC', paramName: '微生物限度', unit: 'CFU/g', stdMax: 1000, inspMethod: '微生物限度检查（直接接种法）', inspFreq: '每批', isCritical: true },
    ],
    inspTrigger: 'AUTO_START',
    inspSchemeCode: 'QC-IQC-STD',
    gmpRequirements: [
      { gmpCode: 'GMP-IQC-01', requirement: '原料未经QC检验放行，不得投入生产使用', regulation: 'GMP原辅料控制', isMandatory: true, verifyMethod: '查COA+检验报告', docRequired: '原料检验报告（含COA）' },
      { gmpCode: 'GMP-IQC-02', requirement: '取样按取样SOP执行，取样前贴"取样中"标签，取样后更换状态牌', regulation: 'GMP取样管理', isMandatory: true, verifyMethod: '现场检查+EBR记录', docRequired: '取样记录' },
    ],
    cleanRoomLevel: '一般区', eSignLevel: 'OPERATOR_CHECKER_QA', dualPersonCheck: false, qaMonitorRequired: true,
    cleanupType: 'SELF', cleanupValidHours: 72,
    isBottleneck: false, isCriticalControl: false,
    status: 'ACTIVE', version: 'V1.0', updatedAt: '2026-01-10',
  },
];

// ════════════════════════════════════════════════════════════════
// 合并导出所有工序
// ════════════════════════════════════════════════════════════════
export const ALL_PHARMA_OPERATIONS: PharmaOperation[] = [
  ...NJ_GD_OPERATIONS,
  ...NJ_RN_OPERATIONS,
  ...LS_GD_OPERATIONS,
  ...LS_YQ_OPERATIONS,
  ...WB_OPERATIONS,
  ...INCOMING_INSP_OPERATIONS,
];

// 按工序编码查找
export const findPharmaOp = (opCode: string): PharmaOperation | undefined =>
  ALL_PHARMA_OPERATIONS.find(op => op.opCode === opCode);

// 按车间过滤
export const filterByWorkshop = (workshop: string): PharmaOperation[] =>
  ALL_PHARMA_OPERATIONS.filter(op => op.workshop.includes(workshop));

// 按工厂过滤
export const filterByFactory = (factoryCode: string): PharmaOperation[] => {
  if (factoryCode === 'ALL') return ALL_PHARMA_OPERATIONS;
  return ALL_PHARMA_OPERATIONS.filter(op =>
    op.factoryScope === 'ALL' || op.factoryScope === factoryCode
  );
};

// 关键控制点列表
export const getCriticalControlOps = (): PharmaOperation[] =>
  ALL_PHARMA_OPERATIONS.filter(op => op.isCriticalControl);

// 按检验触发类型查找
export const getInspTriggerOps = (trigger: InspTrigger): PharmaOperation[] =>
  ALL_PHARMA_OPERATIONS.filter(op => op.inspTrigger === trigger);

// 电子签名级别标签
export const ESIGN_LEVEL_LABELS: Record<ESignLevel, { label: string; color: string }> = {
  NONE:                    { label: '无需签名',          color: '#999' },
  OPERATOR:                { label: '操作人签名',        color: '#1677FF' },
  OPERATOR_CHECKER:        { label: '操作+复核双签',    color: '#FA8C16' },
  OPERATOR_CHECKER_QA:     { label: '操作+复核+QA三签', color: '#E60012' },
};

// 清场类型标签
export const CLEANUP_TYPE_LABELS: Record<CleanupType, { label: string; color: string }> = {
  NONE:      { label: '无需清场',  color: '#999' },
  SELF:      { label: '自清场',    color: '#52C41A' },
  QA_VERIFY: { label: 'QA验证',   color: '#FA8C16' },
  FULL:      { label: '全清场',    color: '#E60012' },
};

// 洁净级别颜色
export const CLEAN_ROOM_COLORS: Record<CleanRoom, string> = {
  'A级': '#E60012',
  'B级': '#FA8C16',
  'C级': '#722ED1',
  'D级': '#1677FF',
  '一般区': '#52C41A',
};

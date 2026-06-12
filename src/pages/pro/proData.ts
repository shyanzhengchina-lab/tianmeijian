// ================================================================
// 工艺路径数据层 v3.0
// 串行/并行支持：
//   ProcessRouting.groups = RoutingGroup[]（组间串行）
//   RoutingGroup.steps    = RoutingOpStep[]（组内并行）
//   单工序组 = 普通串行步骤；多工序组 = 并行泳道
// ================================================================

import { Operation } from '../operation/operationData';

export type RoutingStatus = 'DRAFT' | 'PENDING' | 'ACTIVE' | 'DISABLED' | 'OBSOLETE';

// ── 路径中每一个工序步骤（引用工序主数据 + 局部覆盖） ─────────────
export interface RoutingOpStep {
  id: string;
  opId: string;
  opCode: string;
  opName: string;
  opShort: string;
  workCenter: string;
  stdTimeMin: number;
  isKeyOp: boolean;
  isQcPoint: boolean;
  isReportPoint: boolean;
  remark?: string;
  phaseCount: number;
}

// ── 执行组：组内并行，组间串行 ────────────────────────────────────
export interface RoutingGroup {
  id: string;
  seq: number;          // 组顺序：10, 20, 30…
  label?: string;       // 可选标签，如"同步处理"
  steps: RoutingOpStep[];
  // 并行时组的总工时 = max(steps[].stdTimeMin)
  // 串行时 = steps[0].stdTimeMin
}

// ── 工艺路径主体 ────────────────────────────────────────────────────
export interface ProcessRouting {
  id: string;
  routingCode: string;
  routingName: string;
  productCode: string;
  productName: string;
  productModel: string;
  version: string;
  isDefault: boolean;
  status: RoutingStatus;
  auditBy?: string;
  auditAt?: string;
  auditRemark?: string;
  disableReason?: string;
  workshop?: string;
  productLine?: string;
  applicableSpec?: string;
  remark?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  groups: RoutingGroup[];  // 替代原 steps[]
}

// ── 状态配置 ────────────────────────────────────────────────────────
export const ROUTING_STATUS_MAP: Record<RoutingStatus, { label: string; color: string; bg: string; border: string }> = {
  DRAFT:    { label: '草稿',   color: '#8C8C8C', bg: '#fafafa',  border: '#d9d9d9' },
  PENDING:  { label: '待审核', color: '#FA8C16', bg: '#fff7e6',  border: '#ffd591' },
  ACTIVE:   { label: '已生效', color: '#52C41A', bg: '#f6ffed',  border: '#b7eb8f' },
  DISABLED: { label: '已停用', color: '#FF4D4F', bg: '#fff2f0',  border: '#ffccc7' },
  OBSOLETE: { label: '已废止', color: '#BFBFBF', bg: '#f5f5f5',  border: '#e8e8e8' },
};

// ── 工具：计算路径总工时（串行组累加，并行组取 max）────────────────
export const calcTotalTime = (groups: RoutingGroup[]): number =>
  groups.reduce((sum, g) => {
    const groupTime = g.steps.length === 0 ? 0
      : g.steps.length === 1 ? g.steps[0].stdTimeMin
      : Math.max(...g.steps.map(s => s.stdTimeMin));
    return sum + groupTime;
  }, 0);

// ── 工具：统计所有步骤数 ────────────────────────────────────────────
export const countAllSteps = (groups: RoutingGroup[]): number =>
  groups.reduce((sum, g) => sum + g.steps.length, 0);

// ── 状态流转规则 ────────────────────────────────────────────────────
export const canAudit       = (s: RoutingStatus) => s === 'DRAFT' || s === 'PENDING';
export const canUnaudit     = (s: RoutingStatus) => s === 'PENDING';
export const canActivate    = (s: RoutingStatus) => s === 'PENDING';
export const canDisable     = (s: RoutingStatus) => s === 'ACTIVE';
export const canEnable      = (s: RoutingStatus) => s === 'DISABLED';
export const canObsolete    = (s: RoutingStatus) => s === 'ACTIVE' || s === 'DISABLED';
export const canEdit        = (s: RoutingStatus) => s === 'DRAFT' || s === 'DISABLED';
export const canDelete      = (s: RoutingStatus) => s === 'DRAFT';
export const canConfigSteps = (s: RoutingStatus) => s === 'DRAFT' || s === 'DISABLED';

// ── 扩展接口：天美健 GMP 工艺路线额外字段 ────────────────────────────
export interface ProcessRoutingExt extends ProcessRouting {
  factoryCode?: string;       // NJ | LS
  factoryName?: string;       // 南京工厂 | 溧水工厂
  workshopType?: string;      // 固体车间 | 软胶囊车间 | 液体车间 | 外包车间
  dosageForm?: string;        // 片剂 | 软胶囊 | 粉剂 | 口服液
  qcPointCount?: number;      // QC控制点数量
  yieldStd?: string;          // 收率标准范围
  balanceStd?: string;        // 物料平衡率标准
}

// ── Mock 数据辅助 ────────────────────────────────────────────────────
const step = (
  id: string, opId: string, opCode: string, opName: string, opShort: string,
  workCenter: string, stdTimeMin: number,
  isKeyOp: boolean, isQcPoint: boolean, isReportPoint: boolean,
  phaseCount: number, remark?: string
): RoutingOpStep => ({
  id, opId, opCode, opName, opShort, workCenter, stdTimeMin,
  isKeyOp, isQcPoint, isReportPoint, phaseCount, remark,
});

const serialGroup = (id: string, seq: number, s: RoutingOpStep): RoutingGroup => ({
  id, seq, steps: [s],
});

const parallelGroup = (id: string, seq: number, label: string, steps: RoutingOpStep[]): RoutingGroup => ({
  id, seq, label, steps,
});

// ── 天美健保健品工艺路径 Mock 数据（覆盖南京+溧水双工厂）────────────
// 工艺路线编码规则：[工厂]-[车间]-[剂型]-[流水号]
//   工厂: NJ=南京天美健  LS=溧水每日营养
//   车间: GD=固体  RN=软胶囊  YQ=液体  WB=外包
//   剂型: TAB=片剂  SGC=软胶囊  PWD=粉剂  LIQ=口服液
// 工序编码规则：[车间代码]-[2位流水号]  例：GD-01
export const mockRoutings: ProcessRouting[] = [

  // ── R001：机用根管锉标准路径 V2.1（已生效）

  // ══════════════════════════════════════════════════════════════════════
  // NJ-GD-TAB-001：南京工厂 固体车间 维C咀嚼片 工艺路线 V1.0【已生效】
  // 工序：称量配料→混合→制粒→干燥→压片(瓶颈)→[包衣(可选)]→铝塑包装→外包装→赋码关联
  // ══════════════════════════════════════════════════════════════════════
  {
    id: 'TMJ-R001',
    routingCode: 'NJ-GD-TAB-001',
    routingName: '南京固体车间-维C咀嚼片工艺路线',
    productCode: 'PROD-TAB-025',
    productName: '维C咀嚼片',
    productModel: '0.5g×60片/瓶',
    version: 'V1.0',
    isDefault: true,
    status: 'ACTIVE' as const,
    workshop: '南京工厂·固体车间',
    productLine: '片剂生产线',
    applicableSpec: '片剂 0.5g×60片 | 瓶装',
    remark: '维C咀嚼片标准工艺路线，遵循GMP合规要求，全流程电子批记录，物料平衡率96.0~102.0%',
    auditBy: '孔翠萍(QA)',
    auditAt: '2026-01-10',
    auditRemark: '工艺参数已按2026年版GMP规范核对，压片工序为瓶颈，硬度50~80N，脆碎度≤1%',
    createdBy: '王建国',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-10',
    groups: [
      serialGroup('TMJ-G0101', 10, step('TMJ-S0101','op-gd01','GD-01','称量配料','称量','GD-配料室',180,false,true,true,4,'按BOM四重核对；电子签名；误差±1%；EBR记录点')),
      serialGroup('TMJ-G0102', 20, step('TMJ-S0102','op-gd02','GD-02','混合','混合','GD-混合间',120,false,true,true,3,'三维混合机SBH-200；混合均匀性RSD≤5%；QC取样5点位')),
      serialGroup('TMJ-G0103', 30, step('TMJ-S0103','op-gd03','GD-03','制粒','制粒','GD-制粒间',180,false,true,true,4,'湿法制粒GHL-300；终点电流判断；粒度分布QC控制')),
      serialGroup('TMJ-G0104', 40, step('TMJ-S0104','op-gd04','GD-04','干燥','干燥','GD-干燥间',240,false,true,true,3,'流化床FG-120；干燥失重≤3.0%；温度控制60±5℃')),
      serialGroup('TMJ-G0105', 50, step('TMJ-S0105','op-gd05','GD-05','压片','压片','GD-压片间',480,true, true, true, 5,'⚡瓶颈工序：高速压片机GZPS-83；片重差异±7.5%；硬度50~80N；脆碎度≤1.0%；OPC UA实时采集')),
      serialGroup('TMJ-G0105B',55, step('TMJ-S0105B','op-gd05b','GD-05B','包衣(可选)','包衣','GD-包衣间',120,false,false,true,3,'可选工序：高效包衣机BG-150；包衣增重2~4%；外观检查')),
      serialGroup('TMJ-G0106', 60, step('TMJ-S0106','op-gd06','GD-06','铝塑包装','铝塑','GD-包装间',240,false,true, true, 4,'铝塑泡罩DPH-260；密封性100%检查；批号打印核对；收率≥98%')),
      serialGroup('TMJ-G0107', 70, step('TMJ-S0107','op-gd07','GD-07','外包装','外包','GD-外包间',180,false,false,true, 3,'自动装盒机ZH-120；装盒装箱；收率96.0~100.0%；EBR终结点')),
      serialGroup('TMJ-G0108', 80, step('TMJ-S0108','op-wb03','WB-03','赋码关联','赋码','WB-赋码区',60, false,false,true, 2,'GS1-128三级码：产品码→箱码→托盘码关联；追溯链闭合')),
    ],
  },

  // ══════════════════════════════════════════════════════════════════════
  // NJ-RN-SGC-001：南京工厂 软胶囊车间 钙维生素D软胶囊 工艺路线 V1.0【已生效】
  // 工序：化胶→配料/内容物→压丸(瓶颈)→干燥→拣丸→包装→赋码关联
  // ══════════════════════════════════════════════════════════════════════
  {
    id: 'TMJ-R002',
    routingCode: 'NJ-RN-SGC-001',
    routingName: '南京软胶囊车间-钙维D软胶囊工艺路线',
    productCode: 'PROD-CAP-026',
    productName: '钙维生素D软胶囊',
    productModel: '1.0g×60粒/瓶',
    version: 'V1.0',
    isDefault: true,
    status: 'ACTIVE' as const,
    workshop: '南京工厂·软胶囊车间',
    productLine: '软胶囊生产线',
    applicableSpec: '软胶囊 1.0g×60粒 | 瓶装',
    remark: '软胶囊标准工艺路线；化胶/压丸温度精控；干燥时长24~72h；物料平衡率96.0~102.0%',
    auditBy: '孔翠萍(QA)',
    auditAt: '2026-01-10',
    auditRemark: '化胶粘度、压丸装量差异、胶皮厚度为关键控制点，符合GMP要求',
    createdBy: '赵明辉',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-10',
    groups: [
      serialGroup('TMJ-G0201', 10, step('TMJ-S0201','op-rn01','RN-01','化胶','化胶','RN-化胶间',240,false,true, true, 4,'全自动胶罐ZHJG-1；明胶+甘油+纯化水配比；粘度3000~5000mPa·s；温度60~70℃；Modbus RTU采集')),
      serialGroup('TMJ-G0202', 20, step('TMJ-S0202','op-rn02','RN-02','配料/内容物','配料','RN-配料间',120,false,true, true, 3,'配料罐PYG-200；内容物按BOM四重核对；混合均匀性检查')),
      serialGroup('TMJ-G0203', 30, step('TMJ-S0203','op-rn03','RN-03','压丸','压丸','RN-压丸间',600,true, true, true, 6,'⚡瓶颈工序：软胶囊机YWJ250-IIIA；装量差异±10%；胶皮厚度0.75±0.05mm；私有协议采集；25万粒/h')),
      serialGroup('TMJ-G0204', 40, step('TMJ-S0204','op-rn04','RN-04','干燥','干燥','RN-干燥间',2880,false,true, true, 4,'干燥转笼ZG-10；时长24~72h；温度18~25℃；水分≤9.0%；每8h记录')),
      serialGroup('TMJ-G0205', 50, step('TMJ-S0205','op-rn05','RN-05','拣丸','拣丸','RN-拣丸间',120,false,true, true, 3,'拣丸台逐粒检查；外观圆整无气泡；密封性目视检查；AQL抽样')),
      serialGroup('TMJ-G0206', 60, step('TMJ-S0206','op-rn06','RN-06','包装','包装','RN-包装间',180,false,false,true, 3,'自动数粒装瓶；装盒装箱；物料平衡计算；收率96.0~100.0%')),
      serialGroup('TMJ-G0207', 70, step('TMJ-S0207','op-wb03','WB-03','赋码关联','赋码','WB-赋码区',60, false,false,true, 2,'GS1-128三级码关联；追溯链闭合')),
    ],
  },

  // ══════════════════════════════════════════════════════════════════════
  // NJ-RN-SGC-002：南京工厂 软胶囊车间 鱼油软胶囊 工艺路线 V1.0【已生效】
  // ══════════════════════════════════════════════════════════════════════
  {
    id: 'TMJ-R003',
    routingCode: 'NJ-RN-SGC-002',
    routingName: '南京软胶囊车间-鱼油软胶囊工艺路线',
    productCode: 'PROD-FIS-029',
    productName: '鱼油软胶囊',
    productModel: '1.0g×60粒/瓶',
    version: 'V1.0',
    isDefault: true,
    status: 'ACTIVE' as const,
    workshop: '南京工厂·软胶囊车间',
    productLine: '软胶囊生产线',
    applicableSpec: '软胶囊 1.0g×60粒 | 瓶装',
    remark: '鱼油软胶囊工艺路线；鱼油氧化敏感，全程氮气保护；EPA+DHA含量检测为关键控制点',
    auditBy: '孔翠萍(QA)',
    auditAt: '2026-01-15',
    auditRemark: '鱼油批次追溯至挪威EPAX，氧化值检测合格后方可投产',
    createdBy: '赵明辉',
    createdAt: '2026-01-05',
    updatedAt: '2026-01-15',
    groups: [
      serialGroup('TMJ-G0301', 10, step('TMJ-S0301','op-rn01','RN-01','化胶','化胶','RN-化胶间',240,false,true, true, 4,'明胶+甘油配方；粘度3000~5000mPa·s；温度60~70℃')),
      serialGroup('TMJ-G0302', 20, step('TMJ-S0302','op-rn02','RN-02','配料/内容物','配料','RN-配料间',120,false,true, true, 3,'鱼油内容物；充氮保护；EPA+DHA含量初检≥30%；过氧化值检测')),
      serialGroup('TMJ-G0303', 30, step('TMJ-S0303','op-rn03','RN-03','压丸','压丸','RN-压丸间',600,true, true, true, 6,'⚡瓶颈工序：YWJ250-IIIA；装量差异±10%；胶皮厚度0.80±0.05mm（鱼油专用厚胶皮）')),
      serialGroup('TMJ-G0304', 40, step('TMJ-S0304','op-rn04','RN-04','干燥','干燥','RN-干燥间',2880,false,true, true, 4,'时长48~72h；水分≤9.0%；低温干燥防止鱼油氧化')),
      serialGroup('TMJ-G0305', 50, step('TMJ-S0305','op-rn05','RN-05','拣丸','拣丸','RN-拣丸间',120,false,true, true, 3,'外观圆整；无异味；密封性抽检')),
      serialGroup('TMJ-G0306', 60, step('TMJ-S0306','op-rn06','RN-06','包装','包装','RN-包装间',180,false,false,true, 3,'装瓶装盒；充氮封盖延长保质期')),
      serialGroup('TMJ-G0307', 70, step('TMJ-S0307','op-wb03','WB-03','赋码关联','赋码','WB-赋码区',60, false,false,true, 2,'三级码关联；追溯至鱼油原料批次')),
    ],
  },

  // ══════════════════════════════════════════════════════════════════════
  // LS-GD-PWD-001：溧水工厂 固体车间 乳清蛋白粉 工艺路线 V1.0【已生效】
  // 工序：称量配料→混合→分装(瓶颈)→外包装→赋码关联
  // ══════════════════════════════════════════════════════════════════════
  {
    id: 'TMJ-R004',
    routingCode: 'LS-GD-PWD-001',
    routingName: '溧水固体车间-乳清蛋白粉工艺路线',
    productCode: 'PROD-PWD-027',
    productName: '乳清蛋白粉',
    productModel: '10g×30袋/盒',
    version: 'V1.0',
    isDefault: true,
    status: 'ACTIVE' as const,
    workshop: '溧水工厂·固体车间',
    productLine: '粉剂分装线',
    applicableSpec: '粉剂 10g×30袋 | 盒装',
    remark: '乳清蛋白粉分装工艺路线；分装装量差异±5%；封口密封性100%检查；物料平衡率96.0~102.0%',
    auditBy: '孔翠萍(QA)',
    auditAt: '2026-01-10',
    auditRemark: '溧水工厂粉剂分装线，混合均匀性和分装精度为关键控制点',
    createdBy: '刘志强',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-10',
    groups: [
      serialGroup('TMJ-G0401', 10, step('TMJ-S0401','op-ls-gd01','GD-01','称量配料','称量','LS-配料室',120,false,true, true, 3,'电子秤四重核对；蛋白粉吸湿敏感，防潮操作间')),
      serialGroup('TMJ-G0402', 20, step('TMJ-S0402','op-ls-gd02','GD-02','混合','混合','LS-混合间',90, false,true, true, 3,'V型混合机VH-100；5点位取样；混合均匀性RSD≤5%；100L/批')),
      serialGroup('TMJ-G0403', 30, step('TMJ-S0403','op-ls-gd03','GD-03','分装','分装','LS-分装间',360,true, true, true, 5,'⚡瓶颈工序：自动分装机FB-10；装量差异±5%；封口温度180±10℃；密封性抽检')),
      serialGroup('TMJ-G0404', 40, step('TMJ-S0404','op-ls-gd04','GD-04','外包装','外包','LS-外包间',120,false,false,true, 3,'装盒装箱；收率96.0~100.0%；EBR终结点')),
      serialGroup('TMJ-G0405', 50, step('TMJ-S0405','op-wb03','WB-03','赋码关联','赋码','WB-赋码区',60, false,false,true, 2,'三级码关联；溧水工厂RFID追溯')),
    ],
  },

  // ══════════════════════════════════════════════════════════════════════
  // LS-YQ-LIQ-001：溧水工厂 液体车间 葡萄糖酸锌口服液 工艺路线 V1.0【已生效】
  // 工序：称量配料→配制/混合→灌装(瓶颈)→灭菌(瓶颈/关键)→灯检→外包装→赋码关联
  // ══════════════════════════════════════════════════════════════════════
  {
    id: 'TMJ-R005',
    routingCode: 'LS-YQ-LIQ-001',
    routingName: '溧水液体车间-葡萄糖酸锌口服液工艺路线',
    productCode: 'PROD-LIQ-028',
    productName: '葡萄糖酸锌口服液',
    productModel: '10ml×30支/盒',
    version: 'V1.0',
    isDefault: true,
    status: 'ACTIVE' as const,
    workshop: '溧水工厂·液体车间',
    productLine: '口服液灌装线',
    applicableSpec: '口服液 10ml×30支 | 盒装',
    remark: '葡萄糖酸锌口服液工艺路线；灭菌F0值≥8min为强制控制点；F0值低于下限强制报废不得返工',
    auditBy: '孔翠萍(QA)',
    auditAt: '2026-01-10',
    auditRemark: '灭菌工序为关键控制点，Modbus TCP实时F0值监控，低于8min强制报废并生成偏差单',
    createdBy: '孙建国',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-10',
    groups: [
      serialGroup('TMJ-G0501', 10, step('TMJ-S0501','op-ls-yq01','YQ-01','称量配料','称量','LS-YQ-配料室',90, false,true, true, 3,'液体原料称量；近效期预警；葡萄糖酸锌溶解检查')),
      serialGroup('TMJ-G0502', 20, step('TMJ-S0502','op-ls-yq02','YQ-02','配制/混合','配制','LS-YQ-配制间',180,false,true, true, 4,'配料罐HSPY-500；pH 3.5~5.5；相对密度1.02~1.08；Modbus TCP实时监控；500L/批')),
      serialGroup('TMJ-G0503', 30, step('TMJ-S0503','op-ls-yq03','YQ-03','灌装','灌装','LS-YQ-灌装间',360,true, true, true, 5,'⚡瓶颈工序：液体灌装线XZKGS32；装量差异±5%；OPC UA实时采集；200瓶/min；不合格品强制锁定')),
      serialGroup('TMJ-G0504', 40, step('TMJ-S0504','op-ls-yq04','YQ-04','灭菌','灭菌','LS-YQ-灭菌间',240,true, true, true, 6,'🔑关键控制点：灭菌系统SG-2.0；F0值≥8min；121~123℃；Modbus TCP实时采集；F0<8min强制报废不得返工；2000L/批')),
      serialGroup('TMJ-G0505', 50, step('TMJ-S0505','op-ls-yq05','YQ-05','灯检','灯检','LS-YQ-灯检台',120,false,true, true, 3,'逐瓶灯检；无可见异物；破瓶/变色品剔除；AQL抽样抽检')),
      serialGroup('TMJ-G0506', 60, step('TMJ-S0506','op-ls-yq06','YQ-06','外包装','外包','LS-YQ-外包间',120,false,false,true, 3,'贴标喷码装箱；收率96.0~100.0%；EBR终结点')),
      serialGroup('TMJ-G0507', 70, step('TMJ-S0507','op-wb03','WB-03','赋码关联','赋码','WB-赋码区',60, false,false,true, 2,'三级码关联；F0值数据随批记录归档')),
    ],
  },

  // ══════════════════════════════════════════════════════════════════════
  // LS-YQ-LIQ-002：胶原蛋白口服液 工艺路线 V1.0【待审核】
  // ══════════════════════════════════════════════════════════════════════
  {
    id: 'TMJ-R006',
    routingCode: 'LS-YQ-LIQ-002',
    routingName: '溧水液体车间-胶原蛋白口服液工艺路线',
    productCode: 'PROD-COL-030',
    productName: '胶原蛋白口服液',
    productModel: '50ml×8瓶/盒',
    version: 'V1.0',
    isDefault: true,
    status: 'PENDING' as const,
    workshop: '溧水工厂·液体车间',
    productLine: '口服液灌装线',
    applicableSpec: '口服液 50ml×8瓶 | 盒装',
    remark: '胶原蛋白口服液工艺路线（待审核）；大规格灌装；胶原蛋白肽分子量检测为关键控制点',
    createdBy: '孙建国',
    createdAt: '2026-03-01',
    updatedAt: '2026-03-15',
    groups: [
      serialGroup('TMJ-G0601', 10, step('TMJ-S0601','op-ls-yq01','YQ-01','称量配料','称量','LS-YQ-配料室',120,false,true, true, 3,'胶原蛋白肽称量；分子量≤1000Da验证')),
      serialGroup('TMJ-G0602', 20, step('TMJ-S0602','op-ls-yq02','YQ-02','配制/混合','配制','LS-YQ-配制间',240,false,true, true, 4,'胶原肽溶解度检查；pH 3.5~5.0；稳定性观察30min')),
      serialGroup('TMJ-G0603', 30, step('TMJ-S0603','op-ls-yq03','YQ-03','灌装','灌装','LS-YQ-灌装间',480,true, true, true, 5,'⚡瓶颈工序：大规格50ml灌装；装量差异±3%；密封性检查')),
      serialGroup('TMJ-G0604', 40, step('TMJ-S0604','op-ls-yq04','YQ-04','灭菌','灭菌','LS-YQ-灭菌间',300,true, true, true, 6,'F0值≥8min；121℃灭菌；需验证大规格瓶F0传热效果')),
      serialGroup('TMJ-G0605', 50, step('TMJ-S0605','op-ls-yq05','YQ-05','灯检','灯检','LS-YQ-灯检台',180,false,true, true, 3,'逐瓶灯检；胶原液透明度检查')),
      serialGroup('TMJ-G0606', 60, step('TMJ-S0606','op-ls-yq06','YQ-06','外包装','外包','LS-YQ-外包间',180,false,false,true, 3,'礼盒包装；8瓶/盒；高端包材检查')),
      serialGroup('TMJ-G0607', 70, step('TMJ-S0607','op-wb03','WB-03','赋码关联','赋码','WB-赋码区',60, false,false,true, 2,'三级码关联')),
    ],
  },

  // ══════════════════════════════════════════════════════════════════════
  // NJ-GD-TAB-002：维C咀嚼片 旧版 V0.9【已停用】（保留用于历史对比）
  // ══════════════════════════════════════════════════════════════════════
  {
    id: 'TMJ-R007',
    routingCode: 'NJ-GD-TAB-001-V09',
    routingName: '南京固体车间-维C咀嚼片工艺路线(旧版)',
    productCode: 'PROD-TAB-025',
    productName: '维C咀嚼片',
    productModel: '0.5g×60片/瓶',
    version: 'V0.9',
    isDefault: false,
    status: 'DISABLED' as const,
    workshop: '南京工厂·固体车间',
    productLine: '片剂生产线',
    applicableSpec: '片剂 0.5g×60片 | 瓶装',
    remark: '旧版工艺路线，V1.0版本生效后停用；主要差异：旧版包含手工包衣，新版改用自动包衣机',
    disableReason: 'V1.0版本已生效，自动包衣机BG-150投产，本路径不再使用',
    auditBy: '孔翠萍(QA)',
    auditAt: '2025-12-01',
    createdBy: '王建国',
    createdAt: '2025-06-01',
    updatedAt: '2026-01-10',
    groups: [
      serialGroup('TMJ-G0701', 10, step('TMJ-S0701','op-gd01','GD-01','称量配料','称量','GD-配料室',180,false,true, true, 4)),
      serialGroup('TMJ-G0702', 20, step('TMJ-S0702','op-gd02','GD-02','混合','混合','GD-混合间',150,false,true, true, 3,'旧版混合时间偏长')),
      serialGroup('TMJ-G0703', 30, step('TMJ-S0703','op-gd03','GD-03','制粒','制粒','GD-制粒间',180,false,true, true, 4)),
      serialGroup('TMJ-G0704', 40, step('TMJ-S0704','op-gd04','GD-04','干燥','干燥','GD-干燥间',300,false,true, true, 3,'旧版干燥时间300min（新版优化至240min）')),
      serialGroup('TMJ-G0705', 50, step('TMJ-S0705','op-gd05','GD-05','压片','压片','GD-压片间',480,true, true, true, 5)),
      serialGroup('TMJ-G0706', 60, step('TMJ-S0706','op-gd06','GD-06','铝塑包装','铝塑','GD-包装间',240,false,true, true, 4)),
      serialGroup('TMJ-G0707', 70, step('TMJ-S0707','op-gd07','GD-07','外包装','外包','GD-外包间',180,false,false,true, 3)),
    ],
  },
];

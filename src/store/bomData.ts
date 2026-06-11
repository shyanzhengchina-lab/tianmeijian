// ================================================================
// BOM 数据模型 - 根管锉多规格物料清单
// 基于 PRD：悦尚根管锉生产执行系统（YS-MES Dental）V1.0
// ================================================================

export type BomStatus = 'draft' | 'audited' | 'approved' | 'disabled';
export type BomType   = '主BOM' | '替代BOM' | '销售BOM';

export interface BomChild {
  id: string;
  rowNo: number;           // 行号
  childCode: string;       // 子件编码
  childName: string;       // 子件名称
  spec: string;            // 规格型号
  freeDesc: string;        // 自由项说明
  type: string;            // 类型：主料/辅料/包材/模具
  qty: number;             // 主数量
  unit: string;            // 主单位
  childQty: number;        // 子件数量
  calcUnit: string;        // 计量单位
  scrapRate?: number;      // 损耗率%（废品率）
  lossRate?: number;       // 损耗率%（工艺损耗，倒扣公式用）
  issueType?: string;      // 领料方式：按工单/倒冲/现场领
  issueMethod?: 'PUSH' | 'BACKFLUSH' | 'ON_SITE';  // 领料方式枚举
  consumeOp?: string;      // 倒冲关联工序（如 OP-40）
  issueOperationSeq?: number; // 领料工序序号（倒扣触发工序）
  minIssueQty?: number;    // 最小发料量（最小包装单位）
  wipWarehouse?: string;   // 目标线边仓编码（如 WIP-涂层）
  baseBatchQty?: number;   // 基础批量（BOM计算基准）
  keyMaterial?: boolean;   // 是否关键物料
  substitute?: string;     // 替代料编码
}

export interface BomHeader {
  id: string;
  code: string;            // 母件编码（与物料档案联动）
  name: string;            // 物料名称
  spec?: string;           // 规格型号
  unit: string;            // 单位
  version: string;         // 版本号
  bomType: BomType;
  status: BomStatus;
  mainQty: number;         // 主批量
  mainUnit: string;        // 主单位
  batchQty: number;        // 批量
  calcUnit: string;        // 计量单位
  effectDate: string;      // 生效日期
  createdBy: string;
  createdAt: string;
  auditedBy?: string;
  auditedAt?: string;
  remark?: string;
  children: BomChild[];
}

// ================================================================
// Mock BOM 数据 - 根管锉各规格主BOM
// ================================================================
export const mockBomList: BomHeader[] = [

  // ── BOM-1：机用根管锉 #25/04锥/25mm ────────────────────────────
  {
    id: 'BOM001',
    code: 'FG-RKQ-2504-25',
    name: '机用根管锉',
    spec: '#25 / 04锥度 / 25mm',
    unit: '根',
    version: '2.1',
    bomType: '主BOM',
    status: 'approved',
    mainQty: 1,
    mainUnit: '根',
    batchQty: 5000,
    calcUnit: '根',
    effectDate: '2026-01-15',
    createdBy: '陈工长',
    createdAt: '2026-01-10 09:00:00',
    auditedBy: '质量总监',
    auditedAt: '2026-01-14 15:30:00',
    remark: 'V2.1版本：更新TiN涂层厚度至0.5μm，符合ISO 10993-18',
    children: [
      // 主料
      {
        id: 'BC001', rowNo: 10,
        childCode: 'RM-NTW-2504', childName: '镍钛丝材',
        spec: 'Φ0.32mm / ASTM F2063 / 盘装',
        freeDesc: '炉批号必须记录，IQC合格方可使用', type: '主料',
        qty: 1, unit: '根', childQty: 0.032, calcUnit: 'M',
        scrapRate: 3, issueType: '按工单', keyMaterial: true,
        consumeOp: 'OP-10',
      },
      {
        id: 'BC002', rowNo: 20,
        childCode: 'RM-SS-HANDLE', childName: '不锈钢柄部毛坯',
        spec: 'Φ11mm × 12mm / SUS304',
        freeDesc: '激光焊接前需清洁', type: '主料',
        qty: 1, unit: '根', childQty: 1, calcUnit: '个',
        scrapRate: 0.5, issueType: '按工单', keyMaterial: true,
        consumeOp: 'OP-10',
      },
      {
        id: 'BC003', rowNo: 30,
        childCode: 'RM-ABS-COLOR-Y', childName: 'ABS色母粒（黄）',
        spec: '医用级ABS / ISO 10993-5 / 黄色',
        freeDesc: '#25锥度标识色，每1000个柄用约0.2kg', type: '主料',
        qty: 1, unit: '根', childQty: 0.0002, calcUnit: 'KG',
        scrapRate: 2, issueType: '按工单',
        consumeOp: 'OP-50',
      },
      // 辅料
      {
        id: 'BC004', rowNo: 40,
        childCode: 'CH-ETCH-HF', childName: '化学蚀刻液',
        spec: 'HF 5%混合液 / 20L桶',
        freeDesc: '按炉次用量，每炉约0.5L', type: '辅料',
        qty: 1, unit: '根', childQty: 0.0005, calcUnit: 'L',
        issueType: '倒冲', consumeOp: 'OP-30',
      },
      {
        id: 'BC005', rowNo: 50,
        childCode: 'CH-NITRIDE', childName: '氮化钛涂层靶材',
        spec: 'TiN / 纯度99.9% / PVD用',
        freeDesc: '每炉约消耗2g，按炉次计', type: '辅料',
        qty: 1, unit: '根', childQty: 0.002, calcUnit: 'G',
        issueType: '倒冲', consumeOp: 'OP-40',
      },
      {
        id: 'BC006', rowNo: 60,
        childCode: 'AX-CLEAN-IPA', childName: '异丙醇（IPA）',
        spec: '电子级99.7%',
        freeDesc: '清洗工序用，每批约1L', type: '辅料',
        qty: 1, unit: '根', childQty: 0.001, calcUnit: 'L',
        issueType: '倒冲', consumeOp: 'OP-60',
      },
      {
        id: 'BC007', rowNo: 70,
        childCode: 'AX-CLEAN-ENZ', childName: '酶洗液',
        spec: '医用多酶 / 1:200稀释',
        freeDesc: '终清洗前超声酶洗，每批约0.1L', type: '辅料',
        qty: 1, unit: '根', childQty: 0.0001, calcUnit: 'L',
        issueType: '倒冲', consumeOp: 'OP-60',
      },
      {
        id: 'BC008', rowNo: 80,
        childCode: 'AX-LUBE-OIL', childName: '切削润滑液',
        spec: '水溶性 / 5%使用浓度',
        freeDesc: '磨锥/螺纹工序冷却用', type: '辅料',
        qty: 1, unit: '根', childQty: 0.0003, calcUnit: 'L',
        issueType: '倒冲', consumeOp: 'OP-20',
      },
      // 包装材料
      {
        id: 'BC009', rowNo: 90,
        childCode: 'PK-BLISTER-S', childName: '吸塑托盘（单支装）',
        spec: 'PET / 单根 / 113×22mm',
        freeDesc: '每根锉对应1个吸塑托', type: '包材',
        qty: 1, unit: '根', childQty: 1, calcUnit: '个',
        issueType: '按工单',
      },
      {
        id: 'BC010', rowNo: 100,
        childCode: 'PK-FOIL-SEAL', childName: '铝塑封口膜',
        spec: 'Al/PE复合膜 / 宽30mm',
        freeDesc: '热封长度约115mm，每卷500m约4300支', type: '包材',
        qty: 1, unit: '根', childQty: 0.000023, calcUnit: 'ROLL',
        issueType: '倒冲', consumeOp: 'OP-80',
      },
      {
        id: 'BC011', rowNo: 110,
        childCode: 'PK-LABEL-UDI', childName: 'UDI标签（单支）',
        spec: '50×20mm / GS1条码',
        freeDesc: '每支根管锉贴1张UDI标签', type: '包材',
        qty: 1, unit: '根', childQty: 1, calcUnit: '张',
        issueType: '倒冲', consumeOp: 'OP-80',
      },
      {
        id: 'BC012', rowNo: 120,
        childCode: 'PK-BOX-6PCS', childName: '彩盒（6支装）',
        spec: '白卡纸 / 110×60×18mm',
        freeDesc: '6支1盒，每根分摊1/6', type: '包材',
        qty: 1, unit: '根', childQty: 0.1667, calcUnit: '个',
        issueType: '按工单',
      },
      {
        id: 'BC013', rowNo: 130,
        childCode: 'PK-INSERT', childName: '说明书',
        spec: '双面彩印 / A4折叠',
        freeDesc: '每盒1份，每根分摊1/6', type: '包材',
        qty: 1, unit: '根', childQty: 0.1667, calcUnit: '张',
        issueType: '按工单',
      },
      {
        id: 'BC014', rowNo: 140,
        childCode: 'PK-SILICAGEL', childName: '干燥剂',
        spec: '硅胶 / 0.5g',
        freeDesc: '每盒1包，每根分摊1/6', type: '包材',
        qty: 1, unit: '根', childQty: 0.1667, calcUnit: '个',
        issueType: '按工单',
      },
    ],
  },

  // ── BOM-2：机用根管锉 #30/06锥/21mm ────────────────────────────
  {
    id: 'BOM002',
    code: 'FG-RKQ-3006-21',
    name: '机用根管锉',
    spec: '#30 / 06锥度 / 21mm',
    unit: '根',
    version: '2.0',
    bomType: '主BOM',
    status: 'approved',
    mainQty: 1,
    mainUnit: '根',
    batchQty: 5000,
    calcUnit: '根',
    effectDate: '2026-01-15',
    createdBy: '陈工长',
    createdAt: '2026-01-10 10:00:00',
    auditedBy: '质量总监',
    auditedAt: '2026-01-14 16:00:00',
    remark: '#30/06锥，绿色柄，丝材规格Φ0.38mm',
    children: [
      {
        id: 'BC101', rowNo: 10,
        childCode: 'RM-NTW-3006', childName: '镍钛丝材',
        spec: 'Φ0.38mm / ASTM F2063',
        freeDesc: '炉批号必须记录', type: '主料',
        qty: 1, unit: '根', childQty: 0.027, calcUnit: 'M',
        scrapRate: 3, issueType: '按工单', keyMaterial: true,
        consumeOp: 'OP-10',
      },
      {
        id: 'BC102', rowNo: 20,
        childCode: 'RM-SS-HANDLE', childName: '不锈钢柄部毛坯',
        spec: 'Φ11mm × 12mm / SUS304',
        freeDesc: '', type: '主料',
        qty: 1, unit: '根', childQty: 1, calcUnit: '个',
        scrapRate: 0.5, issueType: '按工单', keyMaterial: true,
        consumeOp: 'OP-10',
      },
      {
        id: 'BC103', rowNo: 30,
        childCode: 'RM-ABS-COLOR-G', childName: 'ABS色母粒（绿）',
        spec: '医用级ABS / ISO 10993-5 / 绿色',
        freeDesc: '#30锥度标识色', type: '主料',
        qty: 1, unit: '根', childQty: 0.0002, calcUnit: 'KG',
        scrapRate: 2, issueType: '按工单',
        consumeOp: 'OP-50',
      },
      {
        id: 'BC104', rowNo: 40,
        childCode: 'CH-ETCH-HF', childName: '化学蚀刻液',
        spec: 'HF 5%混合液', freeDesc: '按炉次', type: '辅料',
        qty: 1, unit: '根', childQty: 0.0005, calcUnit: 'L',
        issueType: '倒冲', consumeOp: 'OP-30',
      },
      {
        id: 'BC105', rowNo: 50,
        childCode: 'CH-NITRIDE', childName: '氮化钛涂层靶材',
        spec: 'TiN / 纯度99.9%', freeDesc: '按炉次2g', type: '辅料',
        qty: 1, unit: '根', childQty: 0.002, calcUnit: 'G',
        issueType: '倒冲', consumeOp: 'OP-40',
      },
      {
        id: 'BC106', rowNo: 60,
        childCode: 'AX-CLEAN-IPA', childName: '异丙醇（IPA）',
        spec: '电子级99.7%', freeDesc: '', type: '辅料',
        qty: 1, unit: '根', childQty: 0.001, calcUnit: 'L',
        issueType: '倒冲', consumeOp: 'OP-60',
      },
      {
        id: 'BC107', rowNo: 70,
        childCode: 'AX-CLEAN-ENZ', childName: '酶洗液',
        spec: '医用多酶', freeDesc: '', type: '辅料',
        qty: 1, unit: '根', childQty: 0.0001, calcUnit: 'L',
        issueType: '倒冲', consumeOp: 'OP-60',
      },
      {
        id: 'BC108', rowNo: 80,
        childCode: 'PK-BLISTER-S', childName: '吸塑托盘（单支装）',
        spec: 'PET / 单根', freeDesc: '', type: '包材',
        qty: 1, unit: '根', childQty: 1, calcUnit: '个',
        issueType: '按工单',
      },
      {
        id: 'BC109', rowNo: 90,
        childCode: 'PK-FOIL-SEAL', childName: '铝塑封口膜',
        spec: 'Al/PE复合膜', freeDesc: '', type: '包材',
        qty: 1, unit: '根', childQty: 0.000023, calcUnit: 'ROLL',
        issueType: '倒冲', consumeOp: 'OP-80',
      },
      {
        id: 'BC110', rowNo: 100,
        childCode: 'PK-LABEL-UDI', childName: 'UDI标签（单支）',
        spec: '50×20mm / GS1条码', freeDesc: '', type: '包材',
        qty: 1, unit: '根', childQty: 1, calcUnit: '张',
        issueType: '倒冲', consumeOp: 'OP-80',
      },
      {
        id: 'BC111', rowNo: 110,
        childCode: 'PK-BOX-6PCS', childName: '彩盒（6支装）',
        spec: '白卡纸', freeDesc: '', type: '包材',
        qty: 1, unit: '根', childQty: 0.1667, calcUnit: '个',
        issueType: '按工单',
      },
      {
        id: 'BC112', rowNo: 120,
        childCode: 'PK-INSERT', childName: '说明书',
        spec: '双面彩印', freeDesc: '', type: '包材',
        qty: 1, unit: '根', childQty: 0.1667, calcUnit: '张',
        issueType: '按工单',
      },
      {
        id: 'BC113', rowNo: 130,
        childCode: 'PK-SILICAGEL', childName: '干燥剂',
        spec: '硅胶 / 0.5g', freeDesc: '', type: '包材',
        qty: 1, unit: '根', childQty: 0.1667, calcUnit: '个',
        issueType: '按工单',
      },
    ],
  },

  // ── BOM-3：机用根管锉 #40/04锥/21mm ────────────────────────────
  {
    id: 'BOM003',
    code: 'FG-RKQ-4004-21',
    name: '机用根管锉',
    spec: '#40 / 04锥度 / 21mm',
    unit: '根',
    version: '1.5',
    bomType: '主BOM',
    status: 'audited',
    mainQty: 1,
    mainUnit: '根',
    batchQty: 3000,
    calcUnit: '根',
    effectDate: '2026-02-01',
    createdBy: '王工长',
    createdAt: '2026-01-20 09:00:00',
    auditedBy: '质量总监',
    auditedAt: '2026-01-28 14:00:00',
    remark: '#40/04锥，黑色柄，丝材规格Φ0.45mm',
    children: [
      {
        id: 'BC201', rowNo: 10,
        childCode: 'RM-NTW-4004', childName: '镍钛丝材',
        spec: 'Φ0.45mm / ASTM F2063',
        freeDesc: '炉批号必须记录', type: '主料',
        qty: 1, unit: '根', childQty: 0.027, calcUnit: 'M',
        scrapRate: 3.5, issueType: '按工单', keyMaterial: true,
        consumeOp: 'OP-10',
      },
      {
        id: 'BC202', rowNo: 20,
        childCode: 'RM-SS-HANDLE', childName: '不锈钢柄部毛坯',
        spec: 'Φ11mm × 12mm / SUS304',
        freeDesc: '', type: '主料',
        qty: 1, unit: '根', childQty: 1, calcUnit: '个',
        scrapRate: 0.5, issueType: '按工单', keyMaterial: true,
        consumeOp: 'OP-10',
      },
      {
        id: 'BC203', rowNo: 30,
        childCode: 'RM-ABS-COLOR-BK', childName: 'ABS色母粒（黑）',
        spec: '医用级ABS / ISO 10993-5 / 黑色',
        freeDesc: '#40锥度标识色', type: '主料',
        qty: 1, unit: '根', childQty: 0.0002, calcUnit: 'KG',
        scrapRate: 2, issueType: '按工单',
        consumeOp: 'OP-50',
      },
      {
        id: 'BC204', rowNo: 40,
        childCode: 'CH-ETCH-HF', childName: '化学蚀刻液',
        spec: 'HF 5%混合液', freeDesc: '按炉次', type: '辅料',
        qty: 1, unit: '根', childQty: 0.0006, calcUnit: 'L',
        issueType: '倒冲', consumeOp: 'OP-30',
      },
      {
        id: 'BC205', rowNo: 50,
        childCode: 'CH-NITRIDE', childName: '氮化钛涂层靶材',
        spec: 'TiN / 纯度99.9%', freeDesc: '按炉次', type: '辅料',
        qty: 1, unit: '根', childQty: 0.0025, calcUnit: 'G',
        issueType: '倒冲', consumeOp: 'OP-40',
      },
      {
        id: 'BC206', rowNo: 60,
        childCode: 'AX-CLEAN-IPA', childName: '异丙醇（IPA）',
        spec: '电子级99.7%', freeDesc: '', type: '辅料',
        qty: 1, unit: '根', childQty: 0.001, calcUnit: 'L',
        issueType: '倒冲', consumeOp: 'OP-60',
      },
      {
        id: 'BC207', rowNo: 70,
        childCode: 'PK-BLISTER-S', childName: '吸塑托盘（单支装）',
        spec: 'PET / 单根', freeDesc: '', type: '包材',
        qty: 1, unit: '根', childQty: 1, calcUnit: '个',
        issueType: '按工单',
      },
      {
        id: 'BC208', rowNo: 80,
        childCode: 'PK-LABEL-UDI', childName: 'UDI标签（单支）',
        spec: '50×20mm / GS1条码', freeDesc: '', type: '包材',
        qty: 1, unit: '根', childQty: 1, calcUnit: '张',
        issueType: '倒冲', consumeOp: 'OP-80',
      },
      {
        id: 'BC209', rowNo: 90,
        childCode: 'PK-BOX-6PCS', childName: '彩盒（6支装）',
        spec: '白卡纸', freeDesc: '', type: '包材',
        qty: 1, unit: '根', childQty: 0.1667, calcUnit: '个',
        issueType: '按工单',
      },
      {
        id: 'BC210', rowNo: 100,
        childCode: 'PK-INSERT', childName: '说明书',
        spec: '双面彩印', freeDesc: '', type: '包材',
        qty: 1, unit: '根', childQty: 0.1667, calcUnit: '张',
        issueType: '按工单',
      },
      {
        id: 'BC211', rowNo: 110,
        childCode: 'PK-SILICAGEL', childName: '干燥剂',
        spec: '硅胶 / 0.5g', freeDesc: '', type: '包材',
        qty: 1, unit: '根', childQty: 0.1667, calcUnit: '个',
        issueType: '按工单',
      },
    ],
  },

  // ── BOM-4：机用根管锉 #25/06锥/25mm ────────────────────────────
  {
    id: 'BOM004',
    code: 'FG-RKQ-2506-25',
    name: '机用根管锉',
    spec: '#25 / 06锥度 / 25mm',
    unit: '根',
    version: '1.0',
    bomType: '主BOM',
    status: 'draft',
    mainQty: 1,
    mainUnit: '根',
    batchQty: 3000,
    calcUnit: '根',
    effectDate: '2026-03-01',
    createdBy: '陈工长',
    createdAt: '2026-02-15 09:00:00',
    remark: '#25/06锥新规格，草稿中',
    children: [
      {
        id: 'BC301', rowNo: 10,
        childCode: 'RM-NTW-2506', childName: '镍钛丝材',
        spec: 'Φ0.35mm / ASTM F2063',
        freeDesc: '炉批号必须记录', type: '主料',
        qty: 1, unit: '根', childQty: 0.032, calcUnit: 'M',
        scrapRate: 3, issueType: '按工单', keyMaterial: true,
        consumeOp: 'OP-10',
      },
      {
        id: 'BC302', rowNo: 20,
        childCode: 'RM-SS-HANDLE', childName: '不锈钢柄部毛坯',
        spec: 'Φ11mm × 12mm / SUS304',
        freeDesc: '', type: '主料',
        qty: 1, unit: '根', childQty: 1, calcUnit: '个',
        scrapRate: 0.5, issueType: '按工单', keyMaterial: true,
        consumeOp: 'OP-10',
      },
      {
        id: 'BC303', rowNo: 30,
        childCode: 'RM-ABS-COLOR-Y', childName: 'ABS色母粒（黄）',
        spec: '医用级ABS / ISO 10993-5 / 黄色',
        freeDesc: '', type: '主料',
        qty: 1, unit: '根', childQty: 0.0002, calcUnit: 'KG',
        scrapRate: 2, issueType: '按工单',
        consumeOp: 'OP-50',
      },
      {
        id: 'BC304', rowNo: 40,
        childCode: 'PK-BLISTER-S', childName: '吸塑托盘（单支装）',
        spec: 'PET / 单根', freeDesc: '', type: '包材',
        qty: 1, unit: '根', childQty: 1, calcUnit: '个',
        issueType: '按工单',
      },
      {
        id: 'BC305', rowNo: 50,
        childCode: 'PK-LABEL-UDI', childName: 'UDI标签（单支）',
        spec: '50×20mm / GS1条码', freeDesc: '', type: '包材',
        qty: 1, unit: '根', childQty: 1, calcUnit: '张',
        issueType: '倒冲', consumeOp: 'OP-80',
      },
    ],
  },

  // ── BOM-5：6支装彩盒（销售包装BOM）──────────────────────────────
  {
    id: 'BOM005',
    code: 'PK-BOX-SET-2504',
    name: '根管锉6支装彩盒（成品）',
    spec: '#25/04锥/25mm × 6支',
    unit: '盒',
    version: '1.0',
    bomType: '销售BOM',
    status: 'approved',
    mainQty: 1,
    mainUnit: '盒',
    batchQty: 1000,
    calcUnit: '盒',
    effectDate: '2026-01-15',
    createdBy: '陈工长',
    createdAt: '2026-01-12 09:00:00',
    auditedBy: '质量总监',
    auditedAt: '2026-01-14 16:30:00',
    remark: '6支装零售彩盒销售BOM',
    children: [
      {
        id: 'BC401', rowNo: 10,
        childCode: 'FG-RKQ-2504-25', childName: '机用根管锉',
        spec: '#25 / 04锥度 / 25mm',
        freeDesc: '已完成UDI赋码', type: '主料',
        qty: 1, unit: '盒', childQty: 6, calcUnit: '根',
        issueType: '按工单', keyMaterial: true,
      },
      {
        id: 'BC402', rowNo: 20,
        childCode: 'PK-BOX-6PCS', childName: '彩盒（6支装）',
        spec: '白卡纸 / 110×60×18mm',
        freeDesc: '', type: '包材',
        qty: 1, unit: '盒', childQty: 1, calcUnit: '个',
        issueType: '按工单',
      },
      {
        id: 'BC403', rowNo: 30,
        childCode: 'PK-INSERT', childName: '说明书',
        spec: '双面彩印 / A4折叠',
        freeDesc: '', type: '包材',
        qty: 1, unit: '盒', childQty: 1, calcUnit: '张',
        issueType: '按工单',
      },
      {
        id: 'BC404', rowNo: 40,
        childCode: 'PK-SILICAGEL', childName: '干燥剂',
        spec: '硅胶 / 0.5g',
        freeDesc: '', type: '包材',
        qty: 1, unit: '盒', childQty: 1, calcUnit: '个',
        issueType: '按工单',
      },
    ],
  },
];

// ================================================================
// 状态配置
// ================================================================
export const statusMap: Record<BomStatus, { label: string; color: string; bg: string; border: string }> = {
  draft:    { label: '草稿',   color: '#8c8c8c', bg: '#f5f5f5',  border: '#d9d9d9' },
  audited:  { label: '已审核', color: '#389e0d', bg: '#f6ffed',  border: '#b7eb8f' },
  approved: { label: '已批准', color: '#1677FF', bg: '#e6f4ff',  border: '#91caff' },
  disabled: { label: '已禁用', color: '#cf1322', bg: '#fff1f0',  border: '#ffa39e' },
};

/** 将后端返回的大写状态（DRAFT/APPROVED/DISABLED）统一转为前端小写键 */
export const normalizeStatus = (s: any): BomStatus => {
  if (!s) return 'draft';
  const lower = String(s).toLowerCase();
  if (lower === 'approved') return 'approved';
  if (lower === 'audited' || lower === 'reviewed') return 'audited';
  if (lower === 'disabled' || lower === 'inactive') return 'disabled';
  return 'draft';
};

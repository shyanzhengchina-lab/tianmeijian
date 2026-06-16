// ================================================================
// BOM 数据模型 - 天美健保健品 物料清单（BOM）
// 产品：维生素C咀嚼片（500mg×60粒/盒）、复合益生菌胶囊（250mg×30粒/盒）
// 与 workOrderData.ts WO001-WO005、mockData.ts 物料编码完全对齐
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
  type: string;            // 类型：主料/辅料/包材
  qty: number;             // 主批量对应数量
  unit: string;            // 主单位
  childQty: number;        // 子件数量
  calcUnit: string;        // 计量单位
  scrapRate?: number;      // 损耗率%
  lossRate?: number;       // 工艺损耗率%
  issueType?: string;      // 领料方式：按工单/倒冲/现场领
  issueMethod?: 'PUSH' | 'BACKFLUSH' | 'ON_SITE';
  consumeOp?: string;      // 倒冲关联工序
  issueOperationSeq?: number;
  minIssueQty?: number;
  wipWarehouse?: string;
  baseBatchQty?: number;
  keyMaterial?: boolean;
  substitute?: string;
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
  mainUnit: string;
  batchQty: number;        // 批量
  calcUnit: string;
  effectDate: string;
  createdBy: string;
  createdAt: string;
  auditedBy?: string;
  auditedAt?: string;
  remark?: string;
  children: BomChild[];
}

// ================================================================
// Mock BOM 数据 - 天美健保健品 生产BOM
// ================================================================
export const mockBomList: BomHeader[] = [

  // ── BOM-1：维生素C咀嚼片 500mg×60粒/盒（主BOM，对应WO001/WO002）──
  {
    id: 'BOM-TMJ-VITC-500-60',
    code: 'FG-VitC-500-60',
    name: '天美健维生素C咀嚼片（小规格）',
    spec: '500mg/粒 × 60粒/盒',
    unit: '盒',
    version: '2.1',
    bomType: '主BOM',
    status: 'approved',
    mainQty: 1000,
    mainUnit: '盒',
    batchQty: 1000,
    calcUnit: '盒',
    effectDate: '2026-01-01',
    createdBy: '李研发',
    createdAt: '2026-01-05 09:00:00',
    auditedBy: '赵质检',
    auditedAt: '2026-01-08 15:30:00',
    remark: 'V2.1：更新维生素C含量标准至USP2023；批量1000盒/批',
    children: [
      // ── 主原料
      {
        id: 'BC-VITC-01', rowNo: 10,
        childCode: 'RM-VitC-001', childName: '维生素C（抗坏血酸）',
        spec: '药用级 USP 99.0%~100.5%',
        freeDesc: '每粒含量500mg，每盒60粒，批量1000盒', type: '主料',
        qty: 1000, unit: '盒', childQty: 31.5, calcUnit: 'kg',
        scrapRate: 5, issueType: '按工单', keyMaterial: true,
        consumeOp: 'OP-10',
      },
      {
        id: 'BC-VITC-02', rowNo: 20,
        childCode: 'RM-XYL-001', childName: '木糖醇',
        spec: '食品级 GB/T 23457 ≥99%',
        freeDesc: '甜味剂，每粒约0.5g用量', type: '主料',
        qty: 1000, unit: '盒', childQty: 18.9, calcUnit: 'kg',
        scrapRate: 2, issueType: '按工单', keyMaterial: true,
        consumeOp: 'OP-10',
      },
      {
        id: 'BC-VITC-03', rowNo: 30,
        childCode: 'RM-CIT-001', childName: '柠檬酸',
        spec: '食品级 GB/T 8269',
        freeDesc: '酸味调节剂', type: '主料',
        qty: 1000, unit: '盒', childQty: 3.15, calcUnit: 'kg',
        scrapRate: 2, issueType: '按工单',
        consumeOp: 'OP-10',
      },
      {
        id: 'BC-VITC-04', rowNo: 40,
        childCode: 'RM-MCC-001', childName: '微晶纤维素（MCC）',
        spec: 'PH-102',
        freeDesc: '填充剂/崩解剂', type: '辅料',
        qty: 1000, unit: '盒', childQty: 12.6, calcUnit: 'kg',
        scrapRate: 1, issueType: '按工单',
        consumeOp: 'OP-10',
      },
      {
        id: 'BC-VITC-05', rowNo: 50,
        childCode: 'RM-SiO2-001', childName: '二氧化硅（助流剂）',
        spec: '气相法 SiO₂≥99%',
        freeDesc: '改善粉体流动性，添加量0.5%', type: '辅料',
        qty: 1000, unit: '盒', childQty: 0.315, calcUnit: 'kg',
        scrapRate: 2, issueType: '倒冲',
        consumeOp: 'OP-20',
      },
      {
        id: 'BC-VITC-06', rowNo: 60,
        childCode: 'RM-MgSt-001', childName: '硬脂酸镁（润滑剂）',
        spec: '药用级 CP2020',
        freeDesc: '压片润滑剂，添加量0.5%', type: '辅料',
        qty: 1000, unit: '盒', childQty: 0.315, calcUnit: 'kg',
        scrapRate: 2, issueType: '倒冲',
        consumeOp: 'OP-30',
      },
      // ── 中间品（内部流转，不外购）
      {
        id: 'BC-VITC-07', rowNo: 70,
        childCode: 'WIP-GRAN-001', childName: 'VitC颗粒中间品',
        spec: '粒径20~60目 含VitC≥33%',
        freeDesc: '制粒工序产出，检验合格后转压片', type: '主料',
        qty: 1000, unit: '盒', childQty: 63.0, calcUnit: 'kg',
        scrapRate: 3, issueType: '按工单',
        consumeOp: 'OP-20',
      },
      // ── 内包材
      {
        id: 'BC-VITC-08', rowNo: 80,
        childCode: 'PKG-BOTTLE-001', childName: 'HDPE白色塑料瓶',
        spec: '500ml 广口 带干燥剂孔',
        freeDesc: '每盒1瓶，装60粒', type: '包材',
        qty: 1000, unit: '盒', childQty: 1000, calcUnit: '个',
        scrapRate: 0.3, issueType: '按工单',
        consumeOp: 'OP-60',
      },
      {
        id: 'BC-VITC-09', rowNo: 90,
        childCode: 'PKG-CAP-001', childName: '防儿童安全盖',
        spec: '53mm 白色 PP 防儿童开启',
        freeDesc: '配合HDPE瓶使用', type: '包材',
        qty: 1000, unit: '盒', childQty: 1000, calcUnit: '个',
        scrapRate: 0.3, issueType: '按工单',
        consumeOp: 'OP-60',
      },
      {
        id: 'BC-VITC-10', rowNo: 100,
        childCode: 'PKG-DRY-001', childName: '硅胶干燥剂',
        spec: '1g/袋 食品级',
        freeDesc: '每瓶放1袋，防潮', type: '包材',
        qty: 1000, unit: '盒', childQty: 1000, calcUnit: '袋',
        scrapRate: 0.5, issueType: '按工单',
        consumeOp: 'OP-60',
      },
      // ── 外包材
      {
        id: 'BC-VITC-11', rowNo: 110,
        childCode: 'PKG-LABEL-001', childName: '产品标签',
        spec: '100×80mm 铜版纸 四色印刷',
        freeDesc: '每瓶贴1张，含批号/生产日期可变数据', type: '包材',
        qty: 1000, unit: '盒', childQty: 1000, calcUnit: '张',
        scrapRate: 1, issueType: '倒冲',
        consumeOp: 'OP-70',
      },
      {
        id: 'BC-VITC-12', rowNo: 120,
        childCode: 'PKG-BOX-001', childName: '彩色纸盒',
        spec: '105×105×110mm E瓦楞纸板',
        freeDesc: '每瓶套1个彩盒', type: '包材',
        qty: 1000, unit: '盒', childQty: 1000, calcUnit: '个',
        scrapRate: 0.5, issueType: '按工单',
        consumeOp: 'OP-70',
      },
      {
        id: 'BC-VITC-13', rowNo: 130,
        childCode: 'PKG-CATON-001', childName: '外包装箱',
        spec: '600×400×400mm 五层双瓦楞纸箱 装12瓶',
        freeDesc: '12瓶/箱，83.3箱/批', type: '包材',
        qty: 1000, unit: '盒', childQty: 84, calcUnit: '个',
        scrapRate: 0.5, issueType: '按工单',
        consumeOp: 'OP-80',
      },
    ],
  },

  // ── BOM-2：维生素C咀嚼片 1000mg×120粒/瓶（大规格主BOM，对应WO003）──
  {
    id: 'BOM-TMJ-VITC-1000-120',
    code: 'FG-VitC-1000-120',
    name: '天美健维生素C咀嚼片',
    spec: '1000mg/粒 × 120粒/瓶',
    unit: '瓶',
    version: '2.0',
    bomType: '主BOM',
    status: 'approved',
    mainQty: 500,
    mainUnit: '瓶',
    batchQty: 500,
    calcUnit: '瓶',
    effectDate: '2026-02-01',
    createdBy: '李研发',
    createdAt: '2026-01-15 09:00:00',
    auditedBy: '赵质检',
    auditedAt: '2026-01-20 14:00:00',
    remark: '大规格版本，每粒1000mg，批量500瓶/批',
    children: [
      {
        id: 'BC-VITC-L-01', rowNo: 10,
        childCode: 'RM-VitC-001', childName: '维生素C（抗坏血酸）',
        spec: '药用级 USP 99.0%~100.5%',
        freeDesc: '每粒1000mg，每瓶120粒，批量500瓶', type: '主料',
        qty: 500, unit: '瓶', childQty: 63.0, calcUnit: 'kg',
        scrapRate: 5, issueType: '按工单', keyMaterial: true,
        consumeOp: 'OP-10',
      },
      {
        id: 'BC-VITC-L-02', rowNo: 20,
        childCode: 'RM-XYL-001', childName: '木糖醇',
        spec: '食品级 GB/T 23457 ≥99%',
        freeDesc: '甜味剂', type: '主料',
        qty: 500, unit: '瓶', childQty: 18.9, calcUnit: 'kg',
        scrapRate: 2, issueType: '按工单',
        consumeOp: 'OP-10',
      },
      {
        id: 'BC-VITC-L-03', rowNo: 30,
        childCode: 'RM-CIT-001', childName: '柠檬酸',
        spec: '食品级 GB/T 8269',
        freeDesc: '酸味调节剂', type: '主料',
        qty: 500, unit: '瓶', childQty: 6.3, calcUnit: 'kg',
        scrapRate: 2, issueType: '按工单',
        consumeOp: 'OP-10',
      },
      {
        id: 'BC-VITC-L-04', rowNo: 40,
        childCode: 'RM-MCC-001', childName: '微晶纤维素（MCC）',
        spec: 'PH-102',
        freeDesc: '填充剂', type: '辅料',
        qty: 500, unit: '瓶', childQty: 12.6, calcUnit: 'kg',
        scrapRate: 1, issueType: '按工单',
        consumeOp: 'OP-10',
      },
      {
        id: 'BC-VITC-L-05', rowNo: 50,
        childCode: 'RM-SiO2-001', childName: '二氧化硅（助流剂）',
        spec: '气相法 SiO₂≥99%',
        freeDesc: '助流剂', type: '辅料',
        qty: 500, unit: '瓶', childQty: 0.63, calcUnit: 'kg',
        scrapRate: 2, issueType: '倒冲',
        consumeOp: 'OP-20',
      },
      {
        id: 'BC-VITC-L-06', rowNo: 60,
        childCode: 'RM-MgSt-001', childName: '硬脂酸镁（润滑剂）',
        spec: '药用级 CP2020',
        freeDesc: '压片润滑剂', type: '辅料',
        qty: 500, unit: '瓶', childQty: 0.63, calcUnit: 'kg',
        scrapRate: 2, issueType: '倒冲',
        consumeOp: 'OP-30',
      },
      {
        id: 'BC-VITC-L-07', rowNo: 70,
        childCode: 'PKG-BOTTLE-001', childName: 'HDPE白色塑料瓶',
        spec: '500ml 广口 带干燥剂孔',
        freeDesc: '每瓶装120粒', type: '包材',
        qty: 500, unit: '瓶', childQty: 500, calcUnit: '个',
        scrapRate: 0.3, issueType: '按工单',
        consumeOp: 'OP-60',
      },
      {
        id: 'BC-VITC-L-08', rowNo: 80,
        childCode: 'PKG-CAP-001', childName: '防儿童安全盖',
        spec: '53mm 白色 PP',
        freeDesc: '配合HDPE瓶', type: '包材',
        qty: 500, unit: '瓶', childQty: 500, calcUnit: '个',
        scrapRate: 0.3, issueType: '按工单',
        consumeOp: 'OP-60',
      },
      {
        id: 'BC-VITC-L-09', rowNo: 90,
        childCode: 'PKG-DRY-001', childName: '硅胶干燥剂',
        spec: '1g/袋 食品级',
        freeDesc: '每瓶1袋', type: '包材',
        qty: 500, unit: '瓶', childQty: 500, calcUnit: '袋',
        scrapRate: 0.5, issueType: '按工单',
        consumeOp: 'OP-60',
      },
      {
        id: 'BC-VITC-L-10', rowNo: 100,
        childCode: 'PKG-LABEL-001', childName: '产品标签',
        spec: '100×80mm 铜版纸 四色印刷',
        freeDesc: '每瓶1张', type: '包材',
        qty: 500, unit: '瓶', childQty: 500, calcUnit: '张',
        scrapRate: 1, issueType: '倒冲',
        consumeOp: 'OP-70',
      },
      {
        id: 'BC-VITC-L-11', rowNo: 110,
        childCode: 'PKG-CATON-001', childName: '外包装箱',
        spec: '600×400×400mm 装12瓶',
        freeDesc: '12瓶/箱，42箱/批', type: '包材',
        qty: 500, unit: '瓶', childQty: 42, calcUnit: '个',
        scrapRate: 0.5, issueType: '按工单',
        consumeOp: 'OP-80',
      },
    ],
  },

  // ── BOM-3：复合益生菌胶囊 250mg×30粒/盒（主BOM，对应WO004）──
  {
    id: 'BOM-TMJ-PROBIO-30',
    code: 'FG-PROBIO-250-30',
    name: '天美健复合益生菌胶囊',
    spec: '250mg/粒（活菌数≥1×10⁹CFU/粒）× 30粒/盒',
    unit: '盒',
    version: '1.5',
    bomType: '主BOM',
    status: 'approved',
    mainQty: 300,
    mainUnit: '盒',
    batchQty: 300,
    calcUnit: '盒',
    effectDate: '2026-03-01',
    createdBy: '张研发',
    createdAt: '2026-02-10 09:00:00',
    auditedBy: '赵质检',
    auditedAt: '2026-02-15 14:30:00',
    remark: '冷链储存，活菌数≥1×10⁹CFU/粒，批量300盒/批',
    children: [
      {
        id: 'BC-PROBIO-01', rowNo: 10,
        childCode: 'RM-PROBIO-LB-001', childName: '乳酸杆菌菌粉（冻干）',
        spec: '≥2×10¹¹CFU/g 冻干粉',
        freeDesc: '复合菌株：嗜酸乳杆菌+干酪乳杆菌', type: '主料',
        qty: 300, unit: '盒', childQty: 0.045, calcUnit: 'kg',
        scrapRate: 8, issueType: '按工单', keyMaterial: true,
        consumeOp: 'OP-10',
      },
      {
        id: 'BC-PROBIO-02', rowNo: 20,
        childCode: 'RM-PROBIO-BB-001', childName: '双歧杆菌菌粉（冻干）',
        spec: '≥2×10¹¹CFU/g 冻干粉',
        freeDesc: '长双歧杆菌+短双歧杆菌', type: '主料',
        qty: 300, unit: '盒', childQty: 0.045, calcUnit: 'kg',
        scrapRate: 8, issueType: '按工单', keyMaterial: true,
        consumeOp: 'OP-10',
      },
      {
        id: 'BC-PROBIO-03', rowNo: 30,
        childCode: 'RM-INULIN-001', childName: '菊粉（益生元）',
        spec: '食品级 菊粉DP≥10',
        freeDesc: '益生元载体，每粒约100mg', type: '主料',
        qty: 300, unit: '盒', childQty: 0.99, calcUnit: 'kg',
        scrapRate: 2, issueType: '按工单',
        consumeOp: 'OP-10',
      },
      {
        id: 'BC-PROBIO-04', rowNo: 40,
        childCode: 'RM-MCC-001', childName: '微晶纤维素（MCC）',
        spec: 'PH-102',
        freeDesc: '填充剂', type: '辅料',
        qty: 300, unit: '盒', childQty: 0.63, calcUnit: 'kg',
        scrapRate: 1, issueType: '按工单',
        consumeOp: 'OP-10',
      },
      {
        id: 'BC-PROBIO-05', rowNo: 50,
        childCode: 'PKG-CAPSULE-00', childName: '植物胶囊壳（00#）',
        spec: 'HPMC 00# 透明 食品级',
        freeDesc: '每粒1个胶囊壳，批量300盒×30粒=9000粒', type: '包材',
        qty: 300, unit: '盒', childQty: 9090, calcUnit: '粒',
        scrapRate: 1, issueType: '按工单', keyMaterial: true,
        consumeOp: 'OP-40',
      },
      {
        id: 'BC-PROBIO-06', rowNo: 60,
        childCode: 'PKG-BOTTLE-PROBIO', childName: 'HDPE棕色避光瓶',
        spec: '250ml 窄口 避光',
        freeDesc: '益生菌专用避光瓶，每瓶装30粒', type: '包材',
        qty: 300, unit: '盒', childQty: 300, calcUnit: '个',
        scrapRate: 0.5, issueType: '按工单',
        consumeOp: 'OP-60',
      },
      {
        id: 'BC-PROBIO-07', rowNo: 70,
        childCode: 'PKG-DRY-001', childName: '硅胶干燥剂',
        spec: '1g/袋 食品级',
        freeDesc: '每瓶1袋，防潮', type: '包材',
        qty: 300, unit: '盒', childQty: 300, calcUnit: '袋',
        scrapRate: 0.5, issueType: '按工单',
        consumeOp: 'OP-60',
      },
      {
        id: 'BC-PROBIO-08', rowNo: 80,
        childCode: 'PKG-LABEL-PROBIO', childName: '益生菌产品标签',
        spec: '100×80mm 铜版纸 含冷链标识',
        freeDesc: '每瓶1张，标注活菌数和储存条件', type: '包材',
        qty: 300, unit: '盒', childQty: 300, calcUnit: '张',
        scrapRate: 1, issueType: '倒冲',
        consumeOp: 'OP-70',
      },
      {
        id: 'BC-PROBIO-09', rowNo: 90,
        childCode: 'PKG-BOX-PROBIO', childName: '益生菌产品彩盒',
        spec: '85×55×105mm 白卡纸 四色印刷',
        freeDesc: '每瓶套1个彩盒', type: '包材',
        qty: 300, unit: '盒', childQty: 300, calcUnit: '个',
        scrapRate: 0.5, issueType: '按工单',
        consumeOp: 'OP-70',
      },
      {
        id: 'BC-PROBIO-10', rowNo: 100,
        childCode: 'PKG-CATON-001', childName: '外包装箱',
        spec: '600×400×400mm 装24盒',
        freeDesc: '24盒/箱，13箱/批', type: '包材',
        qty: 300, unit: '盒', childQty: 13, calcUnit: '个',
        scrapRate: 0.5, issueType: '按工单',
        consumeOp: 'OP-80',
      },
    ],
  },

  // ── BOM-4：复合益生菌胶囊 250mg×60粒/盒（大规格主BOM，对应WO005）──
  {
    id: 'BOM-TMJ-PROBIO-60',
    code: 'FG-PROBIO-250-60',
    name: '天美健复合益生菌胶囊（大规格）',
    spec: '250mg/粒 × 60粒/盒',
    unit: '盒',
    version: '1.0',
    bomType: '主BOM',
    status: 'audited',
    mainQty: 600,
    mainUnit: '盒',
    batchQty: 600,
    calcUnit: '盒',
    effectDate: '2026-04-01',
    createdBy: '张研发',
    createdAt: '2026-03-15 10:00:00',
    auditedBy: '赵质检',
    auditedAt: '2026-03-20 16:00:00',
    remark: '大规格双月装，60粒/盒，批量600盒/批',
    children: [
      {
        id: 'BC-PROBIO-L-01', rowNo: 10,
        childCode: 'RM-PROBIO-LB-001', childName: '乳酸杆菌菌粉（冻干）',
        spec: '≥2×10¹¹CFU/g 冻干粉',
        freeDesc: '嗜酸乳杆菌+干酪乳杆菌', type: '主料',
        qty: 600, unit: '盒', childQty: 0.09, calcUnit: 'kg',
        scrapRate: 8, issueType: '按工单', keyMaterial: true,
        consumeOp: 'OP-10',
      },
      {
        id: 'BC-PROBIO-L-02', rowNo: 20,
        childCode: 'RM-PROBIO-BB-001', childName: '双歧杆菌菌粉（冻干）',
        spec: '≥2×10¹¹CFU/g 冻干粉',
        freeDesc: '长双歧杆菌+短双歧杆菌', type: '主料',
        qty: 600, unit: '盒', childQty: 0.09, calcUnit: 'kg',
        scrapRate: 8, issueType: '按工单', keyMaterial: true,
        consumeOp: 'OP-10',
      },
      {
        id: 'BC-PROBIO-L-03', rowNo: 30,
        childCode: 'RM-INULIN-001', childName: '菊粉（益生元）',
        spec: '食品级 菊粉DP≥10',
        freeDesc: '益生元载体', type: '主料',
        qty: 600, unit: '盒', childQty: 1.98, calcUnit: 'kg',
        scrapRate: 2, issueType: '按工单',
        consumeOp: 'OP-10',
      },
      {
        id: 'BC-PROBIO-L-04', rowNo: 40,
        childCode: 'RM-MCC-001', childName: '微晶纤维素（MCC）',
        spec: 'PH-102',
        freeDesc: '填充剂', type: '辅料',
        qty: 600, unit: '盒', childQty: 1.26, calcUnit: 'kg',
        scrapRate: 1, issueType: '按工单',
        consumeOp: 'OP-10',
      },
      {
        id: 'BC-PROBIO-L-05', rowNo: 50,
        childCode: 'PKG-CAPSULE-00', childName: '植物胶囊壳（00#）',
        spec: 'HPMC 00# 透明 食品级',
        freeDesc: '每粒1个，批量600盒×60粒=36000粒', type: '包材',
        qty: 600, unit: '盒', childQty: 36360, calcUnit: '粒',
        scrapRate: 1, issueType: '按工单', keyMaterial: true,
        consumeOp: 'OP-40',
      },
      {
        id: 'BC-PROBIO-L-06', rowNo: 60,
        childCode: 'PKG-BOTTLE-PROBIO', childName: 'HDPE棕色避光瓶',
        spec: '250ml 窄口 避光',
        freeDesc: '每瓶装60粒', type: '包材',
        qty: 600, unit: '盒', childQty: 600, calcUnit: '个',
        scrapRate: 0.5, issueType: '按工单',
        consumeOp: 'OP-60',
      },
      {
        id: 'BC-PROBIO-L-07', rowNo: 70,
        childCode: 'PKG-DRY-001', childName: '硅胶干燥剂',
        spec: '1g/袋 食品级',
        freeDesc: '每瓶1袋', type: '包材',
        qty: 600, unit: '盒', childQty: 600, calcUnit: '袋',
        scrapRate: 0.5, issueType: '按工单',
        consumeOp: 'OP-60',
      },
      {
        id: 'BC-PROBIO-L-08', rowNo: 80,
        childCode: 'PKG-LABEL-PROBIO', childName: '益生菌产品标签',
        spec: '100×80mm 含冷链标识',
        freeDesc: '每瓶1张', type: '包材',
        qty: 600, unit: '盒', childQty: 600, calcUnit: '张',
        scrapRate: 1, issueType: '倒冲',
        consumeOp: 'OP-70',
      },
      {
        id: 'BC-PROBIO-L-09', rowNo: 90,
        childCode: 'PKG-BOX-PROBIO', childName: '益生菌产品彩盒',
        spec: '100×65×115mm 白卡纸 四色印刷',
        freeDesc: '每瓶套1个大彩盒', type: '包材',
        qty: 600, unit: '盒', childQty: 600, calcUnit: '个',
        scrapRate: 0.5, issueType: '按工单',
        consumeOp: 'OP-70',
      },
      {
        id: 'BC-PROBIO-L-10', rowNo: 100,
        childCode: 'PKG-CATON-001', childName: '外包装箱',
        spec: '600×400×400mm 装12盒',
        freeDesc: '12盒/箱，50箱/批', type: '包材',
        qty: 600, unit: '盒', childQty: 50, calcUnit: '个',
        scrapRate: 0.5, issueType: '按工单',
        consumeOp: 'OP-80',
      },
    ],
  },

  // ── BOM-5：维生素C咀嚼片 + 益生菌胶囊 礼品套装（销售BOM）──
  {
    id: 'BOM-TMJ-GIFT-SET',
    code: 'FG-GIFT-VITC-PROBIO',
    name: '天美健健康礼品套装',
    spec: 'VitC咀嚼片500mg×60粒/盒 + 益生菌胶囊250mg×30粒/盒',
    unit: '套',
    version: '1.0',
    bomType: '销售BOM',
    status: 'approved',
    mainQty: 200,
    mainUnit: '套',
    batchQty: 200,
    calcUnit: '套',
    effectDate: '2026-05-01',
    createdBy: '王市场',
    createdAt: '2026-04-20 09:00:00',
    auditedBy: '赵质检',
    auditedAt: '2026-04-25 16:00:00',
    remark: '节日礼品套装，维生素C+益生菌组合，精美礼盒包装',
    children: [
      {
        id: 'BC-GIFT-01', rowNo: 10,
        childCode: 'FG-VitC-500-60', childName: '天美健维生素C咀嚼片（小规格）',
        spec: '500mg×60粒/盒',
        freeDesc: '套装组件1，已完成成品检验', type: '主料',
        qty: 200, unit: '套', childQty: 200, calcUnit: '盒',
        issueType: '按工单', keyMaterial: true,
      },
      {
        id: 'BC-GIFT-02', rowNo: 20,
        childCode: 'FG-PROBIO-250-30', childName: '天美健复合益生菌胶囊',
        spec: '250mg×30粒/盒',
        freeDesc: '套装组件2，已完成成品检验', type: '主料',
        qty: 200, unit: '套', childQty: 200, calcUnit: '盒',
        issueType: '按工单', keyMaterial: true,
      },
      {
        id: 'BC-GIFT-03', rowNo: 30,
        childCode: 'PKG-GIFTBOX-001', childName: '精美礼品盒',
        spec: '280×180×120mm 天地盖 磁吸口 烫金印刷',
        freeDesc: '每套1个礼品盒', type: '包材',
        qty: 200, unit: '套', childQty: 200, calcUnit: '个',
        scrapRate: 0.5, issueType: '按工单',
        consumeOp: 'OP-70',
      },
      {
        id: 'BC-GIFT-04', rowNo: 40,
        childCode: 'PKG-FOAM-INSERT', childName: 'EVA泡棉内托',
        spec: '275×175×40mm 定制形状',
        freeDesc: '固定两盒产品位置', type: '包材',
        qty: 200, unit: '套', childQty: 200, calcUnit: '个',
        scrapRate: 1, issueType: '按工单',
        consumeOp: 'OP-70',
      },
      {
        id: 'BC-GIFT-05', rowNo: 50,
        childCode: 'PKG-RIBBON-001', childName: '绸带（礼盒装饰）',
        spec: '宽20mm 红色/金色 0.5m/套',
        freeDesc: '礼盒外缠绕装饰', type: '包材',
        qty: 200, unit: '套', childQty: 200, calcUnit: '套',
        scrapRate: 2, issueType: '按工单',
        consumeOp: 'OP-70',
      },
      {
        id: 'BC-GIFT-06', rowNo: 60,
        childCode: 'PKG-CATON-001', childName: '外包装箱',
        spec: '600×400×400mm 装6套',
        freeDesc: '6套/箱，34箱/批', type: '包材',
        qty: 200, unit: '套', childQty: 34, calcUnit: '个',
        scrapRate: 0.5, issueType: '按工单',
        consumeOp: 'OP-80',
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

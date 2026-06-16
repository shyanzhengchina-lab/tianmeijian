import { Material, MaterialCategory, UnitGroup } from '../types';

// ================================================================
// 物料分类 - 天美健保健品 GMP 制造完整分类体系
// ================================================================
export const mockCategories: MaterialCategory[] = [
  {
    id: '1', name: '全部', code: 'ALL', children: [
      {
        id: '2', name: '01 原料', code: '01', parentId: '1', children: [
          { id: '21', name: '主原料',     code: '0101', parentId: '2' },
          { id: '22', name: '辅料',       code: '0102', parentId: '2' },
          { id: '23', name: '营养强化剂', code: '0103', parentId: '2' },
        ]
      },
      {
        id: '3', name: '02 中间品', code: '02', parentId: '1', children: [
          { id: '31', name: '颗粒中间品',   code: '0201', parentId: '3' },
          { id: '32', name: '压片中间品',   code: '0202', parentId: '3' },
          { id: '33', name: '包衣中间品',   code: '0203', parentId: '3' },
        ]
      },
      {
        id: '4', name: '03 成品', code: '03', parentId: '1', children: [
          { id: '41', name: '片剂成品',   code: '0301', parentId: '4' },
          { id: '42', name: '胶囊成品',   code: '0302', parentId: '4' },
          { id: '43', name: '软糖成品',   code: '0303', parentId: '4' },
        ]
      },
      {
        id: '5', name: '04 内包材', code: '04', parentId: '1', children: [
          { id: '51', name: 'HDPE瓶/瓶盖', code: '0401', parentId: '5' },
          { id: '52', name: '铝塑泡罩',    code: '0402', parentId: '5' },
          { id: '53', name: '干燥剂',      code: '0403', parentId: '5' },
        ]
      },
      {
        id: '6', name: '05 外包材', code: '05', parentId: '1', children: [
          { id: '61', name: '纸盒/说明书', code: '0501', parentId: '6' },
          { id: '62', name: '外箱',        code: '0502', parentId: '6' },
          { id: '63', name: '标签',        code: '0503', parentId: '6' },
        ]
      },
      {
        id: '7', name: '06 生产辅料', code: '06', parentId: '1', children: [
          { id: '71', name: '清洁消毒剂', code: '0601', parentId: '7' },
          { id: '72', name: '过滤材料',   code: '0602', parentId: '7' },
        ]
      },
    ]
  }
];

// ================================================================
// 物料档案 - 天美健维生素C咀嚼片全套物料主数据
// ================================================================
export const mockMaterials: Material[] = [
  // ── 主原料 ─────────────────────────────────────────────────────
  {
    id: 'M001', code: 'RM-VitC-001', name: '维生素C（抗坏血酸）',
    categoryId: '21', spec: '药用级 USP 99.0%~100.5%', unit: 'kg',
    type: '原材料', brand: 'DSM', supplier: '荷兰帝斯曼（中国）',
    minStock: 500, maxStock: 5000, price: 28.5, status: 'active',
    description: '符合USP/EP标准，用于维生素C咀嚼片主原料', createdAt: '2026-01-05'
  },
  {
    id: 'M002', code: 'RM-XYL-001', name: '木糖醇',
    categoryId: '21', spec: '食品级 GB/T 23457 ≥99%', unit: 'kg',
    type: '原材料', brand: '', supplier: '山东福田药业',
    minStock: 200, maxStock: 3000, price: 15.2, status: 'active',
    description: '甜味剂兼填充剂，赋予咀嚼片甜味', createdAt: '2026-01-05'
  },
  // ── 辅料 ────────────────────────────────────────────────────────
  {
    id: 'M003', code: 'RM-CIT-001', name: '柠檬酸',
    categoryId: '22', spec: '食品级 GB/T 8269', unit: 'kg',
    type: '原材料', brand: '', supplier: '安徽柠檬生化',
    minStock: 100, maxStock: 2000, price: 6.8, status: 'active',
    description: '酸味调节剂，改善口感', createdAt: '2026-01-06'
  },
  {
    id: 'M004', code: 'RM-SiO2-001', name: '二氧化硅（助流剂）',
    categoryId: '22', spec: '气相法 SiO₂≥99%', unit: 'kg',
    type: '原材料', brand: '科宁', supplier: '广州科宁',
    minStock: 50, maxStock: 500, price: 42.0, status: 'active',
    description: '压片助流剂，防止粉末粘冲', createdAt: '2026-01-06'
  },
  {
    id: 'M005', code: 'RM-MgSt-001', name: '硬脂酸镁（润滑剂）',
    categoryId: '22', spec: '药用级 CP2020', unit: 'kg',
    type: '原材料', brand: '', supplier: '山东信谊',
    minStock: 30, maxStock: 300, price: 18.5, status: 'active',
    description: '压片润滑剂，防止粘冲', createdAt: '2026-01-06'
  },
  {
    id: 'M006', code: 'RM-MCC-001', name: '微晶纤维素（MCC）',
    categoryId: '22', spec: 'PH-102', unit: 'kg',
    type: '原材料', brand: 'FMC', supplier: '美国FMC（中国代理）',
    minStock: 200, maxStock: 3000, price: 22.0, status: 'active',
    description: '填充剂兼粘合剂，改善可压性', createdAt: '2026-01-07'
  },
  // ── 营养强化剂 ───────────────────────────────────────────────────
  {
    id: 'M007', code: 'RM-VD3-001', name: '维生素D3',
    categoryId: '23', spec: '油剂 100万IU/g 药用级', unit: 'kg',
    type: '原材料', brand: 'DSM', supplier: '帝斯曼（中国）',
    minStock: 5, maxStock: 50, price: 680.0, status: 'active',
    description: '营养强化剂，协同VitC吸收', createdAt: '2026-01-08'
  },
  // ── 中间品 ───────────────────────────────────────────────────────
  {
    id: 'WIP001', code: 'WIP-GRAN-001', name: 'VitC颗粒中间品',
    categoryId: '31', spec: '粒径 20~60目 含VitC≥33%', unit: 'kg',
    type: '半成品', brand: '', supplier: '',
    minStock: 0, maxStock: 0, price: 0, status: 'active',
    description: '制粒工序产出，用于后续压片', createdAt: '2026-01-10'
  },
  {
    id: 'WIP002', code: 'WIP-TAB-001', name: 'VitC压片中间品',
    categoryId: '32', spec: '直径14mm 重量1.2g 硬度≥60N', unit: '万片',
    type: '半成品', brand: '', supplier: '',
    minStock: 0, maxStock: 0, price: 0, status: 'active',
    description: '压片工序产出，待内包装', createdAt: '2026-01-10'
  },
  // ── 成品 ─────────────────────────────────────────────────────────
  {
    id: 'FG001', code: 'FG-VITC-250MG-BTL', name: '维生素C咀嚼片（250mg瓶装）',
    categoryId: '41', spec: '250mg/粒 × 100粒/瓶', unit: '瓶',
    type: '成品', brand: '天美健', supplier: '',
    minStock: 1000, maxStock: 50000, price: 88.0, status: 'active',
    description: '天美健瓶装维生素C咀嚼片250mg×100粒，主力SKU', createdAt: '2026-01-15'
  },
  {
    id: 'FG002', code: 'FG-VITC-500MG-AP', name: '维生素C咀嚼片（500mg铝塑）',
    categoryId: '41', spec: '500mg/粒 × 60粒/盒', unit: '盒',
    type: '成品', brand: '天美健', supplier: '',
    minStock: 500, maxStock: 20000, price: 48.0, status: 'active',
    description: '天美健维生素C咀嚼片500mg铝塑装，60粒/盒', createdAt: '2026-01-15'
  },
  // ── 内包材 ───────────────────────────────────────────────────────
  {
    id: 'PKG001', code: 'PKG-BOTTLE-001', name: 'HDPE白色塑料瓶',
    categoryId: '51', spec: '500ml 广口 带干燥剂孔', unit: '个',
    type: '包装材料', brand: '', supplier: '广州中麦包装',
    minStock: 5000, maxStock: 100000, price: 1.8, status: 'active',
    description: '主包装瓶，GMP级HDPE材质', createdAt: '2026-01-10'
  },
  {
    id: 'PKG002', code: 'PKG-CAP-001', name: '防儿童安全盖',
    categoryId: '51', spec: '53mm 白色 PP 防儿童开启', unit: '个',
    type: '包装材料', brand: '', supplier: '广州中麦包装',
    minStock: 5000, maxStock: 100000, price: 0.45, status: 'active',
    description: '符合ISO 8317防儿童安全包装要求', createdAt: '2026-01-10'
  },
  {
    id: 'PKG003', code: 'PKG-DRY-001', name: '硅胶干燥剂',
    categoryId: '53', spec: '1g/袋 食品级', unit: '袋',
    type: '包装材料', brand: '', supplier: '东莞润信',
    minStock: 10000, maxStock: 200000, price: 0.12, status: 'active',
    description: '瓶内干燥防潮', createdAt: '2026-01-10'
  },
  // ── 外包材 ───────────────────────────────────────────────────────
  {
    id: 'PKG004', code: 'PKG-LABEL-001', name: '产品标签',
    categoryId: '63', spec: '100×80mm 铜版纸 四色印刷', unit: '张',
    type: '包装材料', brand: '', supplier: '深圳正方印刷厂',
    minStock: 10000, maxStock: 300000, price: 0.08, status: 'active',
    description: '含保健食品批号、条码、营养成分表', createdAt: '2026-01-10'
  },
  {
    id: 'PKG005', code: 'PKG-BOX-001', name: '彩色纸盒',
    categoryId: '61', spec: '105×105×110mm E瓦楞纸板', unit: '个',
    type: '包装材料', brand: '', supplier: '深圳正方印刷厂',
    minStock: 5000, maxStock: 100000, price: 0.95, status: 'active',
    description: '单品装纸盒，天蓝色设计', createdAt: '2026-01-10'
  },
  {
    id: 'PKG006', code: 'PKG-CATON-001', name: '外包装箱',
    categoryId: '62', spec: '600×400×400mm 五层双瓦楞纸箱 装12瓶', unit: '个',
    type: '包装材料', brand: '', supplier: '东莞兴宇包装',
    minStock: 500, maxStock: 20000, price: 4.5, status: 'active',
    description: '出库装箱，每箱12瓶', createdAt: '2026-01-10'
  },
];

// ================================================================
// 计量单位组 - 保健品制造通用单位
// ================================================================
export const mockUnitGroups: UnitGroup[] = [
  {
    id: 'g1', name: '个/套', code: 'PCS', precision: 0, mainUnit: '个',
    status: 'active', createdAt: '2026-01-01',
    units: [
      { id: 'u1',  groupId: 'g1', name: '个',   code: 'PC',  conversionRate: 1, isMain: true,  status: 'active' },
      { id: 'u1b', groupId: 'g1', name: '套',   code: 'SET', conversionRate: 1, isMain: false, status: 'active' },
    ]
  },
  {
    id: 'g2', name: '千克/克', code: 'KG', precision: 3, mainUnit: '千克',
    status: 'active', createdAt: '2026-01-01',
    units: [
      { id: 'u_kg', groupId: 'g2', name: '千克', code: 'KG', conversionRate: 1,     isMain: true,  status: 'active' },
      { id: 'u_g',  groupId: 'g2', name: '克',   code: 'G',  conversionRate: 0.001, isMain: false, status: 'active' },
    ]
  },
  {
    id: 'g3', name: '瓶/盒', code: 'BTL', precision: 0, mainUnit: '瓶',
    status: 'active', createdAt: '2026-01-01',
    units: [
      { id: 'u_btl', groupId: 'g3', name: '瓶', code: 'BTL', conversionRate: 1, isMain: true,  status: 'active' },
      { id: 'u_box', groupId: 'g3', name: '盒', code: 'BOX', conversionRate: 1, isMain: false, status: 'active' },
    ]
  },
  {
    id: 'g4', name: '万片/片', code: 'WTAB', precision: 2, mainUnit: '万片',
    status: 'active', createdAt: '2026-01-01',
    units: [
      { id: 'u_wtab', groupId: 'g4', name: '万片', code: 'WTAB', conversionRate: 1,      isMain: true,  status: 'active' },
      { id: 'u_tab',  groupId: 'g4', name: '片',   code: 'TAB',  conversionRate: 0.0001, isMain: false, status: 'active' },
    ]
  },
  {
    id: 'g5', name: '张/张', code: 'SHEET', precision: 0, mainUnit: '张',
    status: 'active', createdAt: '2026-01-01',
    units: [
      { id: 'u_sheet', groupId: 'g5', name: '张', code: 'SHEET', conversionRate: 1, isMain: true, status: 'active' },
    ]
  },
  {
    id: 'g6', name: '袋/袋', code: 'BAG', precision: 0, mainUnit: '袋',
    status: 'active', createdAt: '2026-01-01',
    units: [
      { id: 'u_bag', groupId: 'g6', name: '袋', code: 'BAG', conversionRate: 1, isMain: true, status: 'active' },
    ]
  },
  {
    id: 'g7', name: '升/毫升', code: 'L', precision: 3, mainUnit: '升',
    status: 'active', createdAt: '2026-01-01',
    units: [
      { id: 'u_l',  groupId: 'g7', name: '升',   code: 'L',  conversionRate: 1,     isMain: true,  status: 'active' },
      { id: 'u_ml', groupId: 'g7', name: '毫升', code: 'ML', conversionRate: 0.001, isMain: false, status: 'active' },
    ]
  },
];

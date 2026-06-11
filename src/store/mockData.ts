import { Material, MaterialCategory, UnitGroup } from '../types';

// ================================================================
// 物料分类 - 根管锉制造完整分类体系
// ================================================================
export const mockCategories: MaterialCategory[] = [
  {
    id: '1', name: '全部', code: 'ALL', children: [
      {
        id: '2', name: '01 原材料', code: '01', parentId: '1', children: [
          { id: '21', name: '镍钛丝材',     code: '0101', parentId: '2' },
          { id: '22', name: '不锈钢材料',   code: '0102', parentId: '2' },
          { id: '23', name: '高分子材料',   code: '0103', parentId: '2' },
          { id: '24', name: '辅助化学品',   code: '0104', parentId: '2' },
        ]
      },
      {
        id: '3', name: '02 半成品', code: '02', parentId: '1', children: [
          { id: '31', name: '机加工件',     code: '0201', parentId: '3' },
          { id: '32', name: '热处理件',     code: '0202', parentId: '3' },
          { id: '33', name: '涂层件',       code: '0203', parentId: '3' },
          { id: '34', name: '注塑件',       code: '0204', parentId: '3' },
        ]
      },
      {
        id: '4', name: '03 成品', code: '03', parentId: '1', children: [
          { id: '41', name: '机用根管锉',   code: '0301', parentId: '4' },
          { id: '42', name: '手用根管锉',   code: '0302', parentId: '4' },
          { id: '43', name: '热牙胶充填针', code: '0303', parentId: '4' },
        ]
      },
      {
        id: '5', name: '04 包装材料', code: '04', parentId: '1', children: [
          { id: '51', name: '内包装',       code: '0401', parentId: '5' },
          { id: '52', name: '外包装',       code: '0402', parentId: '5' },
          { id: '53', name: '标签标识',     code: '0403', parentId: '5' },
        ]
      },
      {
        id: '6', name: '05 辅料耗材', code: '05', parentId: '1', children: [
          { id: '61', name: '清洗耗材',     code: '0501', parentId: '6' },
          { id: '62', name: '检验耗材',     code: '0502', parentId: '6' },
          { id: '63', name: '润滑防锈',     code: '0503', parentId: '6' },
        ]
      },
      {
        id: '7', name: '06 模具工装', code: '06', parentId: '1', children: [
          { id: '71', name: '螺纹滚压模',   code: '0601', parentId: '7' },
          { id: '72', name: '注塑模具',     code: '0602', parentId: '7' },
          { id: '73', name: '夹具工装',     code: '0603', parentId: '7' },
        ]
      },
    ]
  }
];

// ================================================================
// 物料档案 - 根管锉完整物料主数据（基于PRD）
// ================================================================
export const mockMaterials: Material[] = [

  // ── 镍钛丝材（原材料）──────────────────────────────────────────
  {
    id: 'M001', code: 'RM-NTW-2504', name: '镍钛丝材',
    categoryId: '21', spec: 'Φ0.32mm / ASTM F2063 / 盘装',
    unit: 'M', unitId: 'u_m', type: '原材料',
    brand: 'FURUKAWA', supplier: '古河科技（中国）',
    minStock: 5000, maxStock: 50000, price: 8.50, status: 'active', auditStatus: 'audited',
    description: '符合ASTM F2063医疗级镍钛合金丝，用于#25/04锥根管锉', createdAt: '2026-01-05'
  },
  {
    id: 'M002', code: 'RM-NTW-3006', name: '镍钛丝材',
    categoryId: '21', spec: 'Φ0.38mm / ASTM F2063 / 盘装',
    unit: 'M', unitId: 'u_m', type: '原材料',
    brand: 'FURUKAWA', supplier: '古河科技（中国）',
    minStock: 3000, maxStock: 30000, price: 9.20, status: 'active', auditStatus: 'audited',
    description: '符合ASTM F2063医疗级镍钛合金丝，用于#30/06锥根管锉', createdAt: '2026-01-05'
  },
  {
    id: 'M003', code: 'RM-NTW-4004', name: '镍钛丝材',
    categoryId: '21', spec: 'Φ0.45mm / ASTM F2063 / 盘装',
    unit: 'M', unitId: 'u_m', type: '原材料',
    brand: 'FURUKAWA', supplier: '古河科技（中国）',
    minStock: 2000, maxStock: 20000, price: 10.80, status: 'active', auditStatus: 'audited',
    description: '符合ASTM F2063医疗级镍钛合金丝，用于#40/04锥根管锉', createdAt: '2026-01-05'
  },
  {
    id: 'M004', code: 'RM-NTW-2506', name: '镍钛丝材',
    categoryId: '21', spec: 'Φ0.35mm / ASTM F2063 / 盘装',
    unit: 'M', unitId: 'u_m', type: '原材料',
    brand: 'FURUKAWA', supplier: '古河科技（中国）',
    minStock: 3000, maxStock: 30000, price: 8.80, status: 'active', auditStatus: 'audited',
    description: '符合ASTM F2063医疗级镍钛合金丝，用于#25/06锥根管锉', createdAt: '2026-01-06'
  },

  // ── 不锈钢材料（柄部）──────────────────────────────────────────
  {
    id: 'M010', code: 'RM-SS-HANDLE', name: '不锈钢柄部毛坯',
    categoryId: '22', spec: 'Φ11mm × 12mm / SUS304 / 镍钛接口',
    unit: '个', unitId: 'u1', type: '原材料',
    brand: '', supplier: '迈迪康配件厂',
    minStock: 10000, maxStock: 100000, price: 0.35, status: 'active', auditStatus: 'audited',
    description: '不锈钢预成型柄部，用于与镍钛丝材激光焊接', createdAt: '2026-01-05'
  },

  // ── 高分子材料（注塑柄）──────────────────────────────────────────
  {
    id: 'M020', code: 'RM-ABS-COLOR-R', name: 'ABS色母粒（红）',
    categoryId: '23', spec: '医用级ABS / ISO 10993-5合规 / 红色',
    unit: 'KG', unitId: 'u_kg', type: '原材料',
    brand: 'BASF', supplier: '巴斯夫（中国）',
    minStock: 50, maxStock: 500, price: 65.00, status: 'active', auditStatus: 'audited',
    description: '用于#15/#20锥度标识色注塑柄，符合ISO 10993生物相容性', createdAt: '2026-01-08'
  },
  {
    id: 'M021', code: 'RM-ABS-COLOR-Y', name: 'ABS色母粒（黄）',
    categoryId: '23', spec: '医用级ABS / ISO 10993-5合规 / 黄色',
    unit: 'KG', unitId: 'u_kg', type: '原材料',
    brand: 'BASF', supplier: '巴斯夫（中国）',
    minStock: 50, maxStock: 500, price: 65.00, status: 'active', auditStatus: 'audited',
    description: '用于#25锥度标识色注塑柄，符合ISO 10993生物相容性', createdAt: '2026-01-08'
  },
  {
    id: 'M022', code: 'RM-ABS-COLOR-G', name: 'ABS色母粒（绿）',
    categoryId: '23', spec: '医用级ABS / ISO 10993-5合规 / 绿色',
    unit: 'KG', unitId: 'u_kg', type: '原材料',
    brand: 'BASF', supplier: '巴斯夫（中国）',
    minStock: 30, maxStock: 300, price: 65.00, status: 'active', auditStatus: 'audited',
    description: '用于#30锥度标识色注塑柄，符合ISO 10993生物相容性', createdAt: '2026-01-08'
  },
  {
    id: 'M023', code: 'RM-ABS-COLOR-BK', name: 'ABS色母粒（黑）',
    categoryId: '23', spec: '医用级ABS / ISO 10993-5合规 / 黑色',
    unit: 'KG', unitId: 'u_kg', type: '原材料',
    brand: 'BASF', supplier: '巴斯夫（中国）',
    minStock: 30, maxStock: 300, price: 65.00, status: 'active', auditStatus: 'audited',
    description: '用于#40锥度标识色注塑柄，符合ISO 10993生物相容性', createdAt: '2026-01-08'
  },

  // ── 辅助化学品──────────────────────────────────────────────────
  {
    id: 'M030', code: 'CH-ETCH-HF', name: '化学蚀刻液（氢氟酸混合液）',
    categoryId: '24', spec: '工业级 / HF 5% / 20L桶装',
    unit: 'L', unitId: 'u_l', type: '原材料',
    brand: '', supplier: '苏州化工原料公司',
    minStock: 100, maxStock: 1000, price: 28.00, status: 'active', auditStatus: 'audited',
    description: '用于镍钛丝材表面蚀刻处理，改善切削性能', createdAt: '2026-01-10'
  },
  {
    id: 'M031', code: 'CH-NITRIDE', name: '氮化钛涂层靶材',
    categoryId: '24', spec: 'TiN / 纯度99.9% / PVD用',
    unit: 'G', unitId: 'u_g', type: '原材料',
    brand: '', supplier: '上海纳米技术公司',
    minStock: 500, maxStock: 5000, price: 320.00, status: 'active', auditStatus: 'audited',
    description: '用于根管锉尖端PVD氮化钛涂层，提高耐磨性', createdAt: '2026-01-10'
  },

  // ── 半成品 ── 机加工件 ──────────────────────────────────────────
  {
    id: 'M101', code: 'SA-CUT-2504', name: '镍钛丝切断件',
    categoryId: '31', spec: 'Φ0.32mm × 32mm / #25/04锥',
    unit: '根', unitId: 'u_gen', type: '半成品',
    brand: '', supplier: '',
    minStock: 0, maxStock: 0, price: 0.35, status: 'active', auditStatus: 'audited',
    description: '切断后未加工的镍钛丝段，工序件', createdAt: '2026-01-12'
  },
  {
    id: 'M102', code: 'SA-GRIND-2504', name: '磨锥半成品',
    categoryId: '31', spec: '#25/04锥/25mm / 锥度已成型',
    unit: '根', unitId: 'u_gen', type: '半成品',
    brand: '', supplier: '',
    minStock: 0, maxStock: 0, price: 0.85, status: 'active', auditStatus: 'audited',
    description: '完成磨锥工序的半成品，待螺纹加工', createdAt: '2026-01-12'
  },
  {
    id: 'M103', code: 'SA-THREAD-2504', name: '螺纹成型半成品',
    categoryId: '31', spec: '#25/04锥/25mm / 螺纹已成型',
    unit: '根', unitId: 'u_gen', type: '半成品',
    brand: '', supplier: '',
    minStock: 0, maxStock: 0, price: 1.20, status: 'active', auditStatus: 'audited',
    description: '完成螺纹滚压的半成品，待热处理', createdAt: '2026-01-12'
  },

  // ── 半成品 ── 热处理件 ──────────────────────────────────────────
  {
    id: 'M111', code: 'SA-HEAT-2504', name: '热处理成品件',
    categoryId: '32', spec: '#25/04锥/25mm / 记忆合金激活',
    unit: '根', unitId: 'u_gen', type: '半成品',
    brand: '', supplier: '',
    minStock: 0, maxStock: 0, price: 2.50, status: 'active', auditStatus: 'audited',
    description: '完成热处理记忆合金相变激活，待涂层', createdAt: '2026-01-12'
  },

  // ── 半成品 ── 涂层件 ──────────────────────────────────────────
  {
    id: 'M121', code: 'SA-COAT-2504', name: 'TiN涂层件',
    categoryId: '33', spec: '#25/04锥/25mm / TiN镀层0.5μm',
    unit: '根', unitId: 'u_gen', type: '半成品',
    brand: '', supplier: '',
    minStock: 0, maxStock: 0, price: 3.80, status: 'active', auditStatus: 'audited',
    description: '完成PVD氮化钛涂层，待注塑柄组装', createdAt: '2026-01-12'
  },

  // ── 半成品 ── 注塑件 ──────────────────────────────────────────
  {
    id: 'M131', code: 'SA-MOLD-HANDLE-Y', name: '注塑柄（黄色）',
    categoryId: '34', spec: 'ABS / 黄色 / #25标识',
    unit: '个', unitId: 'u1', type: '半成品',
    brand: '', supplier: '',
    minStock: 5000, maxStock: 50000, price: 0.18, status: 'active', auditStatus: 'audited',
    description: '黄色ABS注塑柄，用于#25型号锥度色标', createdAt: '2026-01-12'
  },
  {
    id: 'M132', code: 'SA-MOLD-HANDLE-G', name: '注塑柄（绿色）',
    categoryId: '34', spec: 'ABS / 绿色 / #30标识',
    unit: '个', unitId: 'u1', type: '半成品',
    brand: '', supplier: '',
    minStock: 3000, maxStock: 30000, price: 0.18, status: 'active', auditStatus: 'audited',
    description: '绿色ABS注塑柄，用于#30型号锥度色标', createdAt: '2026-01-12'
  },
  {
    id: 'M133', code: 'SA-MOLD-HANDLE-BK', name: '注塑柄（黑色）',
    categoryId: '34', spec: 'ABS / 黑色 / #40标识',
    unit: '个', unitId: 'u1', type: '半成品',
    brand: '', supplier: '',
    minStock: 2000, maxStock: 20000, price: 0.18, status: 'active', auditStatus: 'audited',
    description: '黑色ABS注塑柄，用于#40型号锥度色标', createdAt: '2026-01-12'
  },

  // ── 成品 ── 机用根管锉 ──────────────────────────────────────────
  {
    id: 'M201', code: 'FG-RKQ-2504-25', name: '机用根管锉',
    categoryId: '41', spec: '#25 / 04锥度 / 25mm',
    unit: '根', unitId: 'u_gen', type: '成品',
    brand: '悦尚YS', supplier: '',
    minStock: 1000, maxStock: 50000, price: 18.50, status: 'active', auditStatus: 'audited',
    description: '机用镍钛根管锉，黄色柄，ISO 3630-1合规，UDI已注册', createdAt: '2026-01-15'
  },
  {
    id: 'M202', code: 'FG-RKQ-3006-21', name: '机用根管锉',
    categoryId: '41', spec: '#30 / 06锥度 / 21mm',
    unit: '根', unitId: 'u_gen', type: '成品',
    brand: '悦尚YS', supplier: '',
    minStock: 500, maxStock: 20000, price: 21.00, status: 'active', auditStatus: 'audited',
    description: '机用镍钛根管锉，绿色柄，ISO 3630-1合规，UDI已注册', createdAt: '2026-01-15'
  },
  {
    id: 'M203', code: 'FG-RKQ-4004-21', name: '机用根管锉',
    categoryId: '41', spec: '#40 / 04锥度 / 21mm',
    unit: '根', unitId: 'u_gen', type: '成品',
    brand: '悦尚YS', supplier: '',
    minStock: 300, maxStock: 10000, price: 24.50, status: 'active', auditStatus: 'audited',
    description: '机用镍钛根管锉，黑色柄，ISO 3630-1合规，UDI已注册', createdAt: '2026-01-15'
  },
  {
    id: 'M204', code: 'FG-RKQ-2506-25', name: '机用根管锉',
    categoryId: '41', spec: '#25 / 06锥度 / 25mm',
    unit: '根', unitId: 'u_gen', type: '成品',
    brand: '悦尚YS', supplier: '',
    minStock: 500, maxStock: 20000, price: 20.00, status: 'active', auditStatus: 'audited',
    description: '机用镍钛根管锉，黄色柄/06锥，ISO 3630-1合规', createdAt: '2026-01-15'
  },

  // ── 包装材料 ──────────────────────────────────────────────────
  {
    id: 'M301', code: 'PK-BLISTER-S', name: '吸塑托盘（单支装）',
    categoryId: '51', spec: 'PET / 单根 / 113×22mm',
    unit: '个', unitId: 'u1', type: '包装材料',
    brand: '', supplier: '苏州包材公司',
    minStock: 50000, maxStock: 500000, price: 0.05, status: 'active', auditStatus: 'audited',
    description: '单支根管锉吸塑内托，医用PET材质，符合ISO 11607', createdAt: '2026-01-08'
  },
  {
    id: 'M302', code: 'PK-FOIL-SEAL', name: '铝塑封口膜',
    categoryId: '51', spec: 'Al/PE 复合膜 / 宽30mm / 卷装500m',
    unit: 'ROLL', unitId: 'u_roll', type: '包装材料',
    brand: '', supplier: '苏州包材公司',
    minStock: 50, maxStock: 200, price: 380.00, status: 'active', auditStatus: 'audited',
    description: '吸塑包装热封膜，符合YY/T 0698医疗器械包装要求', createdAt: '2026-01-08'
  },
  {
    id: 'M303', code: 'PK-BOX-6PCS', name: '彩盒（6支装）',
    categoryId: '52', spec: '白卡纸 250g / 110×60×18mm / 彩印',
    unit: '个', unitId: 'u1', type: '包装材料',
    brand: '', supplier: '苏州印刷公司',
    minStock: 5000, maxStock: 50000, price: 0.45, status: 'active', auditStatus: 'audited',
    description: '6支装零售彩盒，含规格色标印刷及使用说明', createdAt: '2026-01-08'
  },
  {
    id: 'M304', code: 'PK-BOX-MASTER', name: '外箱（60盒/箱）',
    categoryId: '52', spec: '五层瓦楞 / B/E楞 / 340×200×150mm',
    unit: '个', unitId: 'u1', type: '包装材料',
    brand: '', supplier: '苏州包材公司',
    minStock: 500, maxStock: 5000, price: 3.50, status: 'active', auditStatus: 'audited',
    description: '成品外箱，每箱60小盒（360根），符合出口运输要求', createdAt: '2026-01-08'
  },
  {
    id: 'M305', code: 'PK-LABEL-UDI', name: 'UDI标签（单支）',
    categoryId: '53', spec: '铜版纸不干胶 / 50×20mm / 含GS1条码',
    unit: '张', unitId: 'u2', type: '包装材料',
    brand: '', supplier: '苏州标签公司',
    minStock: 100000, maxStock: 1000000, price: 0.02, status: 'active', auditStatus: 'audited',
    description: 'GS1 DI+PI UDI标签，含HIBC条码，符合MDR/FDA要求', createdAt: '2026-01-08'
  },
  {
    id: 'M306', code: 'PK-INSERT', name: '说明书',
    categoryId: '53', spec: '双面彩印 / 折叠 / A4展开',
    unit: '张', unitId: 'u2', type: '包装材料',
    brand: '', supplier: '苏州印刷公司',
    minStock: 10000, maxStock: 100000, price: 0.08, status: 'active', auditStatus: 'audited',
    description: '产品使用说明书，含中英文，符合CFDA/FDA注册要求', createdAt: '2026-01-08'
  },
  {
    id: 'M307', code: 'PK-SILICAGEL', name: '干燥剂',
    categoryId: '51', spec: '硅胶 / 0.5g / 独立包',
    unit: '个', unitId: 'u1', type: '包装材料',
    brand: '', supplier: '上海干燥剂公司',
    minStock: 20000, maxStock: 200000, price: 0.03, status: 'active', auditStatus: 'audited',
    description: '包装内干燥剂，防潮保护，符合医疗包装要求', createdAt: '2026-01-10'
  },

  // ── 辅料耗材 ──────────────────────────────────────────────────
  {
    id: 'M401', code: 'AX-CLEAN-IPA', name: '异丙醇（IPA）',
    categoryId: '61', spec: '电子级 99.7% / 20L桶',
    unit: 'L', unitId: 'u_l', type: '辅料',
    brand: '', supplier: '苏州化工原料公司',
    minStock: 200, maxStock: 1000, price: 22.00, status: 'active', auditStatus: 'audited',
    description: '超声清洗用溶剂，清除加工油脂残留', createdAt: '2026-01-10'
  },
  {
    id: 'M402', code: 'AX-CLEAN-EW', name: '纯化水',
    categoryId: '61', spec: '≥1MΩ·cm / 最终清洗用',
    unit: 'L', unitId: 'u_l', type: '辅料',
    brand: '', supplier: '自制（纯水机）',
    minStock: 500, maxStock: 5000, price: 0.80, status: 'active', auditStatus: 'audited',
    description: '最终清洗纯化水，电阻率≥1MΩ·cm', createdAt: '2026-01-10'
  },
  {
    id: 'M403', code: 'AX-CLEAN-ENZ', name: '酶洗液',
    categoryId: '61', spec: '医用多酶 / 1:200稀释 / 5L瓶',
    unit: 'L', unitId: 'u_l', type: '辅料',
    brand: 'Neodisher', supplier: '上海医用清洗公司',
    minStock: 50, maxStock: 200, price: 185.00, status: 'active', auditStatus: 'audited',
    description: '超声酶洗液，去除蛋白质残留，符合医疗器械清洁要求', createdAt: '2026-01-10'
  },
  {
    id: 'M404', code: 'AX-LUBE-OIL', name: '切削润滑液',
    categoryId: '63', spec: '水溶性 / 5% 使用浓度 / 20L桶',
    unit: 'L', unitId: 'u_l', type: '辅料',
    brand: '', supplier: '苏州切削液公司',
    minStock: 100, maxStock: 500, price: 45.00, status: 'active', auditStatus: 'audited',
    description: '镍钛丝磨削/切削冷却润滑液', createdAt: '2026-01-10'
  },
  {
    id: 'M405', code: 'AX-INSPECT-GAUGE', name: '锥度量规',
    categoryId: '62', spec: 'ISO 3630-1 / 04锥 / 精度±0.005mm',
    unit: '个', unitId: 'u1', type: '辅料',
    brand: '', supplier: '精密量具公司',
    minStock: 5, maxStock: 20, price: 850.00, status: 'active', auditStatus: 'audited',
    description: '根管锉锥度检测专用量规，ISO 3630-1标准', createdAt: '2026-01-10'
  },

  // ── 模具工装 ──────────────────────────────────────────────────
  {
    id: 'M501', code: 'MD-THREAD-2504', name: '螺纹滚压模（#25/04）',
    categoryId: '71', spec: '硬质合金 / 寿命5000次 / #25/04锥',
    unit: '套', unitId: 'u_set', type: '模具工装',
    brand: '', supplier: '精密模具公司',
    minStock: 2, maxStock: 10, price: 3500.00, status: 'active', auditStatus: 'audited',
    description: '镍钛丝螺纹滚压成型模，每套寿命5000支，需寿命跟踪', createdAt: '2026-01-08'
  },
  {
    id: 'M502', code: 'MD-THREAD-3006', name: '螺纹滚压模（#30/06）',
    categoryId: '71', spec: '硬质合金 / 寿命5000次 / #30/06锥',
    unit: '套', unitId: 'u_set', type: '模具工装',
    brand: '', supplier: '精密模具公司',
    minStock: 2, maxStock: 10, price: 3500.00, status: 'active', auditStatus: 'audited',
    description: '镍钛丝螺纹滚压成型模，每套寿命5000支', createdAt: '2026-01-08'
  },
  {
    id: 'M503', code: 'MD-INJ-HANDLE', name: '注塑柄模具',
    categoryId: '72', spec: '1模8腔 / 寿命50万次 / ABS专用',
    unit: '套', unitId: 'u_set', type: '模具工装',
    brand: '', supplier: '精密模具公司',
    minStock: 1, maxStock: 4, price: 45000.00, status: 'active', auditStatus: 'audited',
    description: '注塑柄1模8腔模具，寿命50万次', createdAt: '2026-01-08'
  },
];

// ================================================================
// 计量单位组
// ================================================================
export const mockUnitGroups: UnitGroup[] = [
  {
    id: 'g1', name: '个/套', code: 'PCS', precision: 0, mainUnit: '个',
    status: 'active', createdAt: '2026-01-01',
    units: [
      { id: 'u1',   groupId: 'g1', name: '个',   code: 'PC',  conversionRate: 1,   isMain: true,  status: 'active' },
      { id: 'u1b',  groupId: 'g1', name: '套',   code: 'SET', conversionRate: 1,   isMain: false, status: 'active' },
    ]
  },
  {
    id: 'g2', name: '张/张', code: 'SHEET', precision: 0, mainUnit: '张',
    status: 'active', createdAt: '2026-01-01',
    units: [
      { id: 'u2',   groupId: 'g2', name: '张',   code: 'SHEET', conversionRate: 1, isMain: true,  status: 'active' },
    ]
  },
  {
    id: 'g3', name: '根/根', code: 'GEN', precision: 0, mainUnit: '根',
    status: 'active', createdAt: '2026-01-01',
    units: [
      { id: 'u_gen', groupId: 'g3', name: '根',  code: 'GEN', conversionRate: 1,   isMain: true,  status: 'active' },
    ]
  },
  {
    id: 'g4', name: '米/毫米', code: 'M', precision: 3, mainUnit: '米',
    status: 'active', createdAt: '2026-01-01',
    units: [
      { id: 'u_m',  groupId: 'g4', name: '米',   code: 'M',   conversionRate: 1,      isMain: true,  status: 'active' },
      { id: 'u_mm', groupId: 'g4', name: '毫米', code: 'MM',  conversionRate: 0.001,  isMain: false, status: 'active' },
    ]
  },
  {
    id: 'g5', name: '千克/克', code: 'KG', precision: 3, mainUnit: '千克',
    status: 'active', createdAt: '2026-01-01',
    units: [
      { id: 'u_kg', groupId: 'g5', name: '千克', code: 'KG',  conversionRate: 1,      isMain: true,  status: 'active' },
      { id: 'u_g',  groupId: 'g5', name: '克',   code: 'G',   conversionRate: 0.001,  isMain: false, status: 'active' },
    ]
  },
  {
    id: 'g6', name: '升/毫升', code: 'L', precision: 3, mainUnit: '升',
    status: 'active', createdAt: '2026-01-01',
    units: [
      { id: 'u_l',  groupId: 'g6', name: '升',   code: 'L',   conversionRate: 1,      isMain: true,  status: 'active' },
      { id: 'u_ml', groupId: 'g6', name: '毫升', code: 'ML',  conversionRate: 0.001,  isMain: false, status: 'active' },
    ]
  },
  {
    id: 'g7', name: '卷/卷', code: 'ROLL', precision: 0, mainUnit: '卷',
    status: 'active', createdAt: '2026-01-01',
    units: [
      { id: 'u_roll', groupId: 'g7', name: '卷', code: 'ROLL', conversionRate: 1,    isMain: true,  status: 'active' },
    ]
  },
  {
    id: 'g8', name: '套/套', code: 'SET', precision: 0, mainUnit: '套',
    status: 'active', createdAt: '2026-01-01',
    units: [
      { id: 'u_set', groupId: 'g8', name: '套',  code: 'SET2', conversionRate: 1,    isMain: true,  status: 'active' },
    ]
  },
  {
    id: 'g9', name: '支/支', code: 'ZHI', precision: 0, mainUnit: '支',
    status: 'active', createdAt: '2026-01-01',
    units: [
      { id: 'u_zhi', groupId: 'g9', name: '支',  code: 'ZHI', conversionRate: 1,     isMain: true,  status: 'active' },
    ]
  },
];

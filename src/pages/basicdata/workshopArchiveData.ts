/**
 * 车间档案共享数据
 * 供 WorkshopArchivePage、WorkCenterPage、EmployeePage、TeamPage 等模块使用
 *
 * 关系结构：
 *   车间 (Workshop) 1 → N 工作中心 (WorkCenter)
 *   车间 (Workshop) 1 → N 员工 (Employee)
 *   工作中心 (WorkCenter) 1 → N 班组 (Team)
 *   班组 (Team) 1 → N 员工 (Employee)
 *
 * 关键约束（见文档）：
 *   - 员工必须归属某个车间（通过班组→工作中心→车间 或直接 workshopCode 字段）
 *   - 工作中心必须归属某个车间（workshopCode）
 *   - 班组通过 workCenter 字段关联到工作中心，进而间接关联车间
 */

export type WorkshopStatus = 'ACTIVE' | 'DISABLED' | 'CONSTRUCTION';

export type WorkshopType =
  | 'MACHINING'       // 加工车间
  | 'INSPECTION'      // 检验车间
  | 'CLEANING'        // 清洗车间
  | 'STERILIZATION'   // 灭菌车间
  | 'PACKAGING'       // 包装车间
  | 'WAREHOUSE'       // 仓储
  | 'ASSEMBLY'        // 组装车间
  | 'OTHER';          // 其他

export interface Workshop {
  id: string;
  workshopCode: string;       // 车间编码，全局唯一
  workshopName: string;       // 车间名称
  type: WorkshopType;
  manager: string;            // 车间主任
  managerPhone?: string;
  location: string;           // 位置/楼区
  area?: number;              // 面积（m²）
  headCount: number;          // 在编人员数
  workCenterCount: number;    // 含工作中心数
  cleanLevel?: string;        // 洁净度（医疗器械特有）
  status: WorkshopStatus;
  remark?: string;
  createdAt: string;
  updatedAt: string;
}

export const WORKSHOP_TYPE_MAP: Record<WorkshopType, { label: string; color: string }> = {
  MACHINING:     { label: '加工车间',   color: '#1677FF' },
  INSPECTION:    { label: '检验车间',   color: '#FA8C16' },
  CLEANING:      { label: '清洗车间',   color: '#13C2C2' },
  STERILIZATION: { label: '灭菌车间',   color: '#722ED1' },
  PACKAGING:     { label: '包装车间',   color: '#52C41A' },
  WAREHOUSE:     { label: '仓储',       color: '#8C8C8C' },
  ASSEMBLY:      { label: '组装车间',   color: '#EB2F96' },
  OTHER:         { label: '其他',       color: '#BFBFBF' },
};

export const WORKSHOP_STATUS_MAP: Record<WorkshopStatus, { label: string; color: string; badge: any }> = {
  ACTIVE:       { label: '正常运行', color: '#52C41A', badge: 'success' },
  DISABLED:     { label: '已停用',   color: '#8C8C8C', badge: 'default' },
  CONSTRUCTION: { label: '建设中',   color: '#FAAD14', badge: 'warning' },
};

const genId = () => `ws_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

// ── Mock 数据 —— 天美健大自然生物工程 · 南京+溧水双工厂 ─────────────
// 南京工厂（主厂）：固体制剂车间、QC检验室、内包装、仓储
// 溧水工厂（新厂）：益生菌洁净充填、外包装、仓储
export const WORKSHOP_LIST: Workshop[] = [
  // ═══════════════ 南京工厂 ═══════════════
  {
    id: 'ws-nj-001',
    workshopCode: 'WS-NJ-SOLID',
    workshopName: '固体制剂车间（南京）',
    type: 'MACHINING',
    manager: '张建国',
    managerPhone: '13811110001',
    location: '南京工厂 · A楼 2F-3F',
    area: 2400,
    headCount: 32,
    workCenterCount: 6,
    cleanLevel: 'D级（30万级）',
    status: 'ACTIVE',
    remark: '维生素C咀嚼片核心生产区：称量→制粒→干燥→总混→压片→包衣 全流程GMP洁净',
    createdAt: '2022-01-01',
    updatedAt: '2026-04-01',
  },
  {
    id: 'ws-nj-002',
    workshopCode: 'WS-NJ-QC',
    workshopName: 'QC检验室（南京）',
    type: 'INSPECTION',
    manager: '李慧敏',
    managerPhone: '13822220002',
    location: '南京工厂 · B楼 1F',
    area: 600,
    headCount: 8,
    workCenterCount: 3,
    cleanLevel: 'D级',
    status: 'ACTIVE',
    remark: 'IQC/IPQC/FQC全程检验，含理化室、微生物室、仪器室，符合GB16740',
    createdAt: '2022-01-01',
    updatedAt: '2026-03-15',
  },
  {
    id: 'ws-nj-003',
    workshopCode: 'WS-NJ-PACK',
    workshopName: '内包装车间（南京）',
    type: 'PACKAGING',
    manager: '王芳',
    managerPhone: '13833330003',
    location: '南京工厂 · C楼 1F',
    area: 800,
    headCount: 12,
    workCenterCount: 2,
    cleanLevel: 'D级',
    status: 'ACTIVE',
    remark: 'HDPE瓶装线：计数→瓶装→干燥剂放置→盖瓶→感应封口→贴标→装盒',
    createdAt: '2022-01-01',
    updatedAt: '2026-04-05',
  },
  {
    id: 'ws-nj-004',
    workshopCode: 'WS-NJ-OUTERPACK',
    workshopName: '外包装车间（南京）',
    type: 'PACKAGING',
    manager: '陈志远',
    managerPhone: '13844440004',
    location: '南京工厂 · C楼 2F',
    area: 400,
    headCount: 6,
    workCenterCount: 1,
    status: 'ACTIVE',
    remark: '纸箱装箱、称重、缠绕膜、码盘，产线自动化程度80%',
    createdAt: '2022-06-01',
    updatedAt: '2026-02-20',
  },
  {
    id: 'ws-nj-005',
    workshopCode: 'WS-NJ-WH',
    workshopName: '仓储区（南京）',
    type: 'WAREHOUSE',
    manager: '赵磊',
    managerPhone: '13855550005',
    location: '南京工厂 · D栋 1F',
    area: 3000,
    headCount: 8,
    workCenterCount: 4,
    status: 'ACTIVE',
    remark: '含原料仓（常温/阴凉/冷藏分区）、半成品暂存区、成品仓、不合格品隔离区',
    createdAt: '2022-01-01',
    updatedAt: '2026-04-10',
  },
  {
    id: 'ws-nj-006',
    workshopCode: 'WS-NJ-WEIGH',
    workshopName: '称量配料间（南京）',
    type: 'MACHINING',
    manager: '孙浩',
    managerPhone: '13866660006',
    location: '南京工厂 · A楼 2F',
    area: 200,
    headCount: 4,
    workCenterCount: 1,
    cleanLevel: 'D级',
    status: 'ACTIVE',
    remark: '独立洁净称量间，负压设计，称量防错系统PAD扫码核验',
    createdAt: '2022-03-01',
    updatedAt: '2026-01-15',
  },
  // ═══════════════ 溧水工厂 ═══════════════
  {
    id: 'ws-ls-001',
    workshopCode: 'WS-LS-PROBIO',
    workshopName: '益生菌充填车间（溧水）',
    type: 'MACHINING',
    manager: '刘磊',
    managerPhone: '13877770007',
    location: '溧水工厂 · 一号楼 洁净区',
    area: 1200,
    headCount: 14,
    workCenterCount: 3,
    cleanLevel: 'C级（万级）',
    status: 'ACTIVE',
    remark: '冻干菌粉D级充填→C级转移，全程温度≤8℃，冷链GMP合规',
    createdAt: '2024-06-01',
    updatedAt: '2026-04-01',
  },
  {
    id: 'ws-ls-002',
    workshopCode: 'WS-LS-QC',
    workshopName: 'QC检验室（溧水）',
    type: 'INSPECTION',
    manager: '许静',
    managerPhone: '13888880008',
    location: '溧水工厂 · 二号楼 1F',
    area: 350,
    headCount: 5,
    workCenterCount: 2,
    status: 'ACTIVE',
    remark: '益生菌活菌计数、水分、胶囊外观检验，配置厌氧培养箱',
    createdAt: '2024-06-01',
    updatedAt: '2026-03-10',
  },
  {
    id: 'ws-ls-003',
    workshopCode: 'WS-LS-PACK',
    workshopName: '包装车间（溧水）',
    type: 'PACKAGING',
    manager: '周涛',
    managerPhone: '13899990009',
    location: '溧水工厂 · 一号楼 1F',
    area: 600,
    headCount: 8,
    workCenterCount: 2,
    cleanLevel: 'D级',
    status: 'ACTIVE',
    remark: '铝塑泡罩/瓶装双线包装，冷链环境下操作',
    createdAt: '2024-06-01',
    updatedAt: '2026-02-28',
  },
  {
    id: 'ws-ls-004',
    workshopCode: 'WS-LS-WH',
    workshopName: '冷链仓储（溧水）',
    type: 'WAREHOUSE',
    manager: '吴建华',
    managerPhone: '13900000010',
    location: '溧水工厂 · 冷链仓 -15℃',
    area: 800,
    headCount: 4,
    workCenterCount: 2,
    status: 'ACTIVE',
    remark: '-18℃冷冻库（菌粉原料）+ 2~8℃冷藏库（成品），全程温度监控记录',
    createdAt: '2024-08-01',
    updatedAt: '2026-04-10',
  },
  {
    id: 'ws-ls-005',
    workshopCode: 'WS-LS-OUTERPACK',
    workshopName: '外包装车间（溧水）',
    type: 'PACKAGING',
    manager: '郑伟',
    managerPhone: '13911110011',
    location: '溧水工厂 · 二号楼 2F',
    area: 300,
    headCount: 5,
    workCenterCount: 1,
    status: 'ACTIVE',
    remark: '装盒装箱、码托，出货扫码',
    createdAt: '2024-06-01',
    updatedAt: '2026-01-20',
  },
];

/** 仅获取状态为正常的车间 */
export const ACTIVE_WORKSHOPS = WORKSHOP_LIST.filter(w => w.status === 'ACTIVE');

/** 根据编码查找车间名称 */
export function getWorkshopName(code: string): string {
  return WORKSHOP_LIST.find(w => w.workshopCode === code)?.workshopName ?? code;
}

/** 根据编码查找车间 */
export function getWorkshop(code: string): Workshop | undefined {
  return WORKSHOP_LIST.find(w => w.workshopCode === code);
}

// 工厂函数（用于新建时初始化）
export function createEmptyWorkshop(): Omit<Workshop, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    workshopCode: '',
    workshopName: '',
    type: 'MACHINING',
    manager: '',
    location: '',
    headCount: 0,
    workCenterCount: 0,
    status: 'ACTIVE',
  };
}

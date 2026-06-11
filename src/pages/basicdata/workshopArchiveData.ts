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

// ── Mock 数据 ─────────────────────────────────────────────────────────
export const WORKSHOP_LIST: Workshop[] = [
  {
    id: 'ws-001',
    workshopCode: 'WS-GRIND',
    workshopName: '精密加工车间',
    type: 'MACHINING',
    manager: '张工',
    managerPhone: '13811110001',
    location: 'A区 1F',
    area: 1200,
    headCount: 18,
    workCenterCount: 3,
    cleanLevel: '十万级',
    status: 'ACTIVE',
    remark: '根管锉主体磨削、螺纹滚压、刻线核心生产区',
    createdAt: '2021-01-01',
    updatedAt: '2026-04-01',
  },
  {
    id: 'ws-002',
    workshopCode: 'WS-HT',
    workshopName: '热处理车间',
    type: 'MACHINING',
    manager: '李工',
    managerPhone: '13822220002',
    location: 'B区 1F',
    area: 400,
    headCount: 4,
    workCenterCount: 1,
    status: 'ACTIVE',
    remark: '镍钛合金热处理定型，特殊工序，需防护',
    createdAt: '2021-01-01',
    updatedAt: '2026-02-10',
  },
  {
    id: 'ws-003',
    workshopCode: 'WS-COAT',
    workshopName: '涂层车间',
    type: 'MACHINING',
    manager: '王工',
    managerPhone: '13833330003',
    location: 'C区 2F',
    area: 300,
    headCount: 3,
    workCenterCount: 1,
    status: 'ACTIVE',
    remark: 'PVD镀膜，靶材更换中（预计4月下旬恢复）',
    createdAt: '2021-06-01',
    updatedAt: '2026-04-15',
  },
  {
    id: 'ws-004',
    workshopCode: 'WS-LASER',
    workshopName: '标识车间',
    type: 'MACHINING',
    manager: '陈工',
    managerPhone: '13844440004',
    location: 'D区 1F',
    area: 200,
    headCount: 3,
    workCenterCount: 1,
    status: 'ACTIVE',
    remark: 'UDI激光打标 + 序列号追溯，GS1-128格式',
    createdAt: '2022-01-01',
    updatedAt: '2026-03-01',
  },
  {
    id: 'ws-005',
    workshopCode: 'WS-CLEAN',
    workshopName: '清洗车间',
    type: 'CLEANING',
    manager: '赵工',
    managerPhone: '13855550005',
    location: 'E区 1F',
    area: 350,
    headCount: 3,
    workCenterCount: 1,
    cleanLevel: '万级',
    status: 'ACTIVE',
    remark: '超声波清洗 + 洁净度检测',
    createdAt: '2021-01-01',
    updatedAt: '2026-02-28',
  },
  {
    id: 'ws-006',
    workshopCode: 'WS-QC',
    workshopName: '检验室',
    type: 'INSPECTION',
    manager: '质检主任',
    managerPhone: '13866660006',
    location: 'F区 QC室',
    area: 500,
    headCount: 6,
    workCenterCount: 2,
    status: 'ACTIVE',
    remark: '全尺寸检验、扭转/抗弯测试，ISO 3630-1合规',
    createdAt: '2020-06-01',
    updatedAt: '2026-03-01',
  },
  {
    id: 'ws-007',
    workshopCode: 'WS-STER',
    workshopName: '灭菌间',
    type: 'STERILIZATION',
    manager: '灭菌主管',
    location: 'G区',
    area: 250,
    headCount: 4,
    workCenterCount: 1,
    status: 'DISABLED',
    remark: 'EO灭菌柜已停用待采购，外委灭菌中',
    createdAt: '2020-08-01',
    updatedAt: '2026-04-05',
  },
  {
    id: 'ws-008',
    workshopCode: 'WS-PACK',
    workshopName: '包装车间',
    type: 'PACKAGING',
    manager: '包装主管',
    managerPhone: '13888880008',
    location: 'H区 1F',
    area: 600,
    headCount: 6,
    workCenterCount: 1,
    status: 'ACTIVE',
    remark: '初包装热封 + 标签打印 + 装箱，UDI贴标',
    createdAt: '2021-01-01',
    updatedAt: '2026-02-20',
  },
  {
    id: 'ws-009',
    workshopCode: 'WS-ASM',
    workshopName: '组装车间',
    type: 'ASSEMBLY',
    manager: '组装主管',
    location: 'I区 2F',
    area: 400,
    headCount: 5,
    workCenterCount: 1,
    status: 'ACTIVE',
    remark: '柄部装配与整机组装',
    createdAt: '2022-06-01',
    updatedAt: '2026-01-15',
  },
  {
    id: 'ws-010',
    workshopCode: 'WS-STORE',
    workshopName: '仓储',
    type: 'WAREHOUSE',
    manager: '仓管主管',
    location: 'J区 1F',
    area: 800,
    headCount: 4,
    workCenterCount: 1,
    status: 'ACTIVE',
    remark: '原材料、半成品、成品仓储管理',
    createdAt: '2020-01-01',
    updatedAt: '2026-03-20',
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

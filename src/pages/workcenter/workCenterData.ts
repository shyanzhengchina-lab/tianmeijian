/**
 * 工作中心共享数据
 * 供 WorkCenterPage、TeamPage、OperationListPage 等模块共同使用
 */

export interface WorkCenterOption {
  code: string;
  name: string;
  workshop: string;
  status: 'ACTIVE' | 'DISABLED' | 'MAINTENANCE';
}

export const WORK_CENTER_LIST: WorkCenterOption[] = [
  // ── 南京工厂·固体制剂车间（D级洁净）────────────────────────────
  { code: 'WC-GRAN-01',   name: '制粒工作中心',       workshop: '固体制剂车间（D级）', status: 'ACTIVE' },
  { code: 'WC-FLUID-01',  name: '干燥工作中心',       workshop: '固体制剂车间（D级）', status: 'ACTIVE' },
  { code: 'WC-MIX-01',    name: '混合工作中心',       workshop: '固体制剂车间（D级）', status: 'ACTIVE' },
  { code: 'WC-PRESS-01',  name: '压片工作中心',       workshop: '固体制剂车间（D级）', status: 'ACTIVE' },
  { code: 'WC-COAT-01',   name: '包衣工作中心',       workshop: '固体制剂车间（D级）', status: 'ACTIVE' },
  { code: 'WC-INNERPACK-01', name: '内包装工作中心',  workshop: '固体制剂车间（D级）', status: 'ACTIVE' },
  { code: 'WC-COUNT-01',  name: '数片工作中心',       workshop: '固体制剂车间（D级）', status: 'ACTIVE' },
  { code: 'WC-CARTONER-01', name: '装盒工作中心',     workshop: '固体制剂车间（D级）', status: 'ACTIVE' },
  { code: 'WC-CODE-01',   name: '喷码赋码工作中心',   workshop: '固体制剂车间（D级）', status: 'ACTIVE' },
  // ── 溧水工厂·益生菌车间（C级洁净，冷链≤8℃）─────────────────────
  { code: 'WC-CAPS-01',   name: '胶囊充填工作中心',   workshop: '益生菌车间（C级，≤8℃）', status: 'ACTIVE' },
  { code: 'WC-COLDPACK-01', name: '冷链包装工作中心', workshop: '益生菌车间（C级，≤8℃）', status: 'ACTIVE' },
  { code: 'WC-COLDSTORE-01', name: '冷链仓储工作中心', workshop: '溧水冷链仓（≤8℃）', status: 'ACTIVE' },
  // ── QC实验室（双工厂共用）────────────────────────────────────────
  { code: 'WC-QC-CHEM-01', name: '理化检验工作中心',  workshop: 'QC实验室',     status: 'ACTIVE' },
  { code: 'WC-QC-MICRO-01', name: '微生物检验工作中心', workshop: 'QC实验室',   status: 'ACTIVE' },
  { code: 'WC-QC-COLD-01', name: '冷链检验工作中心',  workshop: 'QC实验室（低温区）', status: 'ACTIVE' },
];

/** 仅获取状态为正常的工作中心 */
export const ACTIVE_WORK_CENTERS = WORK_CENTER_LIST.filter(wc => wc.status === 'ACTIVE');

/** 根据编码查找工作中心名称 */
export function getWorkCenterName(code: string): string {
  return WORK_CENTER_LIST.find(wc => wc.code === code)?.name ?? code;
}

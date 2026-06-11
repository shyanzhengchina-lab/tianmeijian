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
  { code: 'WC-GRIND-01', name: '数控磨削工作中心',   workshop: '精密加工车间', status: 'ACTIVE' },
  { code: 'WC-HT-01',    name: '热处理工作中心',     workshop: '热处理车间',   status: 'ACTIVE' },
  { code: 'WC-COAT-01',  name: 'PVD涂层工作中心',    workshop: '涂层车间',     status: 'MAINTENANCE' },
  { code: 'WC-LASER-01', name: '激光打标工作中心',   workshop: '标识车间',     status: 'ACTIVE' },
  { code: 'WC-CLEAN-01', name: '超声清洗工作中心',   workshop: '清洗车间',     status: 'ACTIVE' },
  { code: 'WC-QC-01',    name: '成品检验工作中心',   workshop: '检验室',       status: 'ACTIVE' },
  { code: 'WC-STER-01',  name: 'EO灭菌工作中心',     workshop: '灭菌间',       status: 'DISABLED' },
  { code: 'WC-PACK-01',  name: '包装工作中心',       workshop: '包装车间',     status: 'ACTIVE' },
  { code: 'WC-ASM-01',   name: '组装工作中心',       workshop: '组装车间',     status: 'ACTIVE' },
  { code: 'WC-LINE-01',  name: '刻线工作中心',       workshop: '精密加工车间', status: 'ACTIVE' },
  { code: 'WC-RING-01',  name: '环规检验工作中心',   workshop: '质检车间',     status: 'ACTIVE' },
  { code: 'WC-STORE-01', name: '仓储工作中心',       workshop: '仓储',         status: 'ACTIVE' },
];

/** 仅获取状态为正常的工作中心 */
export const ACTIVE_WORK_CENTERS = WORK_CENTER_LIST.filter(wc => wc.status === 'ACTIVE');

/** 根据编码查找工作中心名称 */
export function getWorkCenterName(code: string): string {
  return WORK_CENTER_LIST.find(wc => wc.code === code)?.name ?? code;
}

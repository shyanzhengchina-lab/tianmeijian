/**
 * 员工档案模块类型定义
 * 保持与现有数据结构完全一致
 */
import type { PageQuery, PageResult } from '../../../shared/api/requestTypes';

// 员工角色
export type EmployeeRole = '班组长' | '操作工' | 'QC';

// 员工状态
export type EmployeeStatus = 'ACTIVE' | 'LEAVE' | 'RESIGNED';

// 员工接口
export interface Employee {
  id: string;
  name: string;
  code: string;              // 工号
  role: EmployeeRole;
  teamId?: string;          // 班组ID
  teamName?: string;        // 班组名称
  workshopCode?: string;    // 所属车间编码
  phone?: string;
  idCard?: string;
  entryDate?: string;
  skills?: string[];       // 技能/资质
  certifications?: string[]; // 上岗证书
  status: EmployeeStatus;
  remark?: string;
  createdAt: string;
  updatedAt: string;
}

// 员工查询参数
export interface EmployeeQuery extends PageQuery {
  name?: string;
  code?: string;
  role?: EmployeeRole;
  status?: EmployeeStatus;
  teamId?: string;
  workshopCode?: string;
}

// 创建员工DTO
export interface CreateEmployeeDTO {
  name: string;
  code: string;
  role: EmployeeRole;
  teamId?: string;
  workshopCode?: string;
  phone?: string;
  idCard?: string;
  entryDate?: string;
  skills?: string[];
  certifications?: string[];
  status?: EmployeeStatus;
  remark?: string;
}

// 更新员工DTO
export interface UpdateEmployeeDTO extends Partial<CreateEmployeeDTO> {
  id: string;
}

// 批量操作参数
export interface EmployeeBatchAction {
  ids: string[];
  action: 'activate' | 'leave' | 'resign' | 'delete';
  params?: Record<string, any>;
}

// 员工角色映射
export const EMPLOYEE_ROLE_MAP: Record<EmployeeRole, { label: string; color: string }> = {
  '班组长': { label: '班组长', color: '#d46b08' },
  '操作工': { label: '操作工', color: '#1677ff' },
  'QC': { label: 'QC', color: '#389e0d' },
};

// 员工状态映射
export const EMPLOYEE_STATUS_MAP: Record<EmployeeStatus, { label: string; color: string; badge: any }> = {
  ACTIVE: { label: '在岗', color: '#52c41a', badge: 'success' },
  LEAVE: { label: '请假', color: '#faad14', badge: 'warning' },
  RESIGNED: { label: '离职', color: '#f5222d', badge: 'error' },
};

// 技能选项
export const SKILL_OPTIONS = [
  '数控磨削',
  '螺纹滚压',
  '热处理',
  'PVD涂层',
  '化学蚀刻',
  'ABS注塑',
  '柄部组装',
  '超声清洗',
  'UDI赋码',
  'OQC检验',
  '吸塑包装',
  '成品入库',
  '设备维护',
  '质量抽检',
  '生产看板操作',
];

// 证书选项
export const CERT_OPTIONS = [
  '机加工上岗证',
  '热处理操作证',
  '危化品操作证',
  '质量检验员资质',
  'GMP洁净操作',
  '设备维修资质',
  'UDI操作授权',
];

// 默认员工数据
export const DEFAULT_EMPLOYEES: Employee[] = [
  {
    id: 'EMP-001',
    name: '张组长',
    code: 'E001',
    role: '班组长',
    teamId: 'team-001',
    teamName: '磨削班组',
    workshopCode: 'WS-001',
    phone: '13800138001',
    idCard: '310101199001011234',
    entryDate: '2020-03-15',
    skills: ['数控磨削', '设备维护'],
    certifications: ['机加工上岗证', 'GMP洁净操作'],
    status: 'ACTIVE',
    remark: '磨削班组核心成员，5年以上经验',
    createdAt: '2020-03-15 10:00:00',
    updatedAt: '2026-04-01 16:30:00',
  },
  {
    id: 'EMP-002',
    name: '李操作工',
    code: 'E002',
    role: '操作工',
    teamId: 'team-001',
    teamName: '磨削班组',
    workshopCode: 'WS-001',
    phone: '13800138002',
    idCard: '310101199502022345',
    entryDate: '2021-05-10',
    skills: ['数控磨削', '螺纹滚压'],
    certifications: ['机加工上岗证'],
    status: 'ACTIVE',
    remark: '熟练操作工，负责数控磨削工序',
    createdAt: '2021-05-10 10:00:00',
    updatedAt: '2026-04-01 16:30:00',
  },
  {
    id: 'EMP-003',
    name: '王质检',
    code: 'E003',
    role: 'QC',
    teamId: 'team-003',
    teamName: '质检班组',
    workshopCode: 'WS-003',
    phone: '13800138003',
    idCard: '310101199203033456',
    entryDate: '2019-08-20',
    skills: ['质量抽检', 'OQC检验', 'UDI操作授权'],
    certifications: ['质量检验员资质', 'UDI操作授权'],
    status: 'ACTIVE',
    remark: '质检员，负责成品检验和UDI赋码',
    createdAt: '2019-08-20 10:00:00',
    updatedAt: '2026-04-01 16:30:00',
  },
  {
    id: 'EMP-004',
    name: '刘装配',
    code: 'E004',
    role: '操作工',
    teamId: 'team-004',
    teamName: '装配班组',
    workshopCode: 'WS-004',
    phone: '13800138004',
    idCard: '310101199404044567',
    entryDate: '2022-01-10',
    skills: ['柄部组装', '吸塑包装', 'UDI赋码'],
    certifications: ['GMP洁净操作', 'UDI操作授权'],
    status: 'ACTIVE',
    remark: '装配工，负责最后一道装配工序',
    createdAt: '2022-01-10 10:00:00',
    updatedAt: '2026-04-01 16:30:00',
  },
  {
    id: 'EMP-005',
    name: '陈保养',
    code: 'E005',
    role: '操作工',
    teamId: 'team-002',
    teamName: '研磨班组',
    workshopCode: 'WS-001',
    phone: '13800138005',
    idCard: '310101199305055678',
    entryDate: '2023-06-01',
    skills: ['设备维护', '超声清洗'],
    certifications: ['设备维修资质', 'GMP洁净操作'],
    status: 'LEAVE',
    remark: '设备维护员，目前休年假',
    createdAt: '2023-06-01 10:00:00',
    updatedAt: '2026-04-01 16:30:00',
  },
];

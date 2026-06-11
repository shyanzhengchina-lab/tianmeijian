export interface Material {
  id: string;
  code: string;
  name: string;
  categoryId: string;
  spec: string;
  unit: string;
  unitId: string;
  type: string;
  brand: string;
  supplier: string;
  minStock: number;
  maxStock: number;
  price: number;
  status: 'active' | 'disabled';
  auditStatus: 'draft' | 'audited';   // 审核状态
  auditedBy?: string;                  // 审核人
  auditedAt?: string;                  // 审核时间
  description: string;
  createdAt: string;
  createdBy?: string;
}

export interface MaterialCategory {
  id: string;
  name: string;
  code: string;
  parentId?: string;
  children?: MaterialCategory[];
}

export interface UnitGroup {
  id: string;
  name: string;
  code: string;
  precision: number;
  mainUnit: string;
  status: 'active' | 'disabled';
  createdAt: string;
  units: Unit[];
}

export interface Unit {
  id: string;
  groupId: string;
  name: string;
  code: string;
  conversionRate: number;
  isMain: boolean;
  status: 'active' | 'disabled';
}

export interface User {
  id: string;
  name: string;
  employeeId: string;
  role: string;
  avatar?: string;
}

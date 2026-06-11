/**
 * RBAC 权限数据模型 — rbacData.ts
 * ================================================================
 * 基于文档《MES权限设计方案.docx》+《MES多工厂权限设计.docx》落地实现
 * 采用 RBAC + 数据范围隔离 + 多工厂组织架构 三层权限模型
 *
 * 层次结构：
 *   集团 → 工厂(Factory) → 车间(Workshop) → 产线(Line) → 班组(Team)
 *   员工(User) → 角色(Role) → 菜单权限(MenuPermission)
 *   每个菜单权限细分 8 种操作：查/增/改/删/审/启/停/印
 *
 * 数据范围（DataScope）：
 *   PERSONAL → 本人 | TEAM → 班组 | WORKSHOP → 车间
 *   FACTORY → 工厂 | ALL → 全集团
 * ================================================================
 */

// ── 操作权限原子定义 ─────────────────────────────────────────────
export interface OperationFlags {
  view:    boolean;  // 查看（默认有菜单权限就有查看权）
  create:  boolean;  // 新增
  update:  boolean;  // 修改
  delete:  boolean;  // 删除
  audit:   boolean;  // 审核
  enable:  boolean;  // 启用
  disable: boolean;  // 停用
  print:   boolean;  // 打印
}

export type DataScope = 'PERSONAL' | 'TEAM' | 'WORKSHOP' | 'FACTORY' | 'ALL';
export type OrgLevel  = 'GROUP' | 'FACTORY' | 'WORKSHOP' | 'LINE' | 'TEAM';

// ═══════════════════════════════════════════════════════════════════
// 多工厂组织结构（基于《MES多工厂权限设计.docx》）
// ═══════════════════════════════════════════════════════════════════

/** 工厂配置 */
export interface FactoryConfig {
  id:        string;   // 工厂ID
  code:      string;   // 工厂编码
  name:      string;   // 工厂名称（中文）
  nameEn?:   string;   // 工厂名称（英文）
  country:   string;   // 所在国家
  timezone:  string;   // 时区
  currency:  string;   // 货币
  language:  string;   // 主用语言
  status:    'ACTIVE' | 'DISABLED';
  sortOrder: number;
}

/** 组织节点（车间/产线/班组） */
export interface OrgNode {
  id:        string;
  code:      string;
  name:      string;
  parentId:  string | null;   // null = 根节点（工厂）
  factoryId: string;
  level:     OrgLevel;
  sortOrder: number;
  status:    'ACTIVE' | 'DISABLED';
}

/** 用户-工厂授权（一人可授权多工厂） */
export interface UserFactory {
  userId:    string;
  factoryIds: string[];   // 有权访问的工厂列表
  defaultFactoryId: string;  // 默认工厂
}

// ── 菜单权限条目 ─────────────────────────────────────────────────
export interface MenuPermission {
  menuKey: string;          // 对应 MainLayout 中的 key
  menuLabel: string;        // 菜单显示名称
  menuGroup: string;        // 所属模块
  ops: OperationFlags;
}

// ── 角色定义 ─────────────────────────────────────────────────────
export interface Role {
  id: string;
  code: string;
  name: string;
  description: string;
  dataScope: DataScope;
  color: string;           // 标签颜色
  permissions: MenuPermission[];
  isBuiltin: boolean;      // 内置角色（不可删除）
  status: 'ACTIVE' | 'DISABLED';
  factoryId?: string;      // 空=全集团通用角色，有值=仅本工厂
}

// ── 员工-角色映射 ─────────────────────────────────────────────────
export interface UserRole {
  userId: string;           // 对应 workOrderData.ts 中的 Operator.id
  userName: string;
  roleIds: string[];
  orgId?: string;           // 所属组织节点ID
  factoryId?: string;       // 主工厂ID（冗余，快速过滤）
  effectiveDate?: string;
  expiryDate?: string;      // 为空表示永久有效
}

// ── 登录用户上下文 ─────────────────────────────────────────────────
export interface UserContext {
  userId:    string;
  userName:  string;
  employeeId: string;
  currentFactoryId: string;
  availableFactoryIds: string[];
  roleIds:   string[];
  dataScope: DataScope;
}

// ═══════════════════════════════════════════════════════════════════
// 工厂数据（天美健大自然生物工程有限公司 — 南京+溧水两厂）
// ═══════════════════════════════════════════════════════════════════
export const FACTORIES: FactoryConfig[] = [
  {
    id: 'F001', code: 'NJ', name: '南京工厂', nameEn: 'Nanjing Factory',
    country: '中国', timezone: 'Asia/Shanghai', currency: 'CNY', language: 'zh-CN',
    status: 'ACTIVE', sortOrder: 1,
  },
  {
    id: 'F002', code: 'LS', name: '溧水工厂', nameEn: 'Lishui Factory',
    country: '中国', timezone: 'Asia/Shanghai', currency: 'CNY', language: 'zh-CN',
    status: 'ACTIVE', sortOrder: 2,
  },
];

// ── 组织节点数据 ─────────────────────────────────────────────────
export const ORG_NODES: OrgNode[] = [
  // ── 南京工厂 (F001) ───────────────────────────────────────────
  { id: 'W001', code: 'NJ-WS01', name: '提取车间',   parentId: null,   factoryId: 'F001', level: 'WORKSHOP', sortOrder: 1, status: 'ACTIVE' },
  { id: 'W002', code: 'NJ-WS02', name: '制剂车间',   parentId: null,   factoryId: 'F001', level: 'WORKSHOP', sortOrder: 2, status: 'ACTIVE' },
  { id: 'W003', code: 'NJ-WS03', name: '包装车间',   parentId: null,   factoryId: 'F001', level: 'WORKSHOP', sortOrder: 3, status: 'ACTIVE' },
  { id: 'L001', code: 'NJ-L01',  name: '提取产线A', parentId: 'W001', factoryId: 'F001', level: 'LINE',     sortOrder: 1, status: 'ACTIVE' },
  { id: 'L002', code: 'NJ-L02',  name: '提取产线B', parentId: 'W001', factoryId: 'F001', level: 'LINE',     sortOrder: 2, status: 'ACTIVE' },
  { id: 'L003', code: 'NJ-L03',  name: '制剂产线A', parentId: 'W002', factoryId: 'F001', level: 'LINE',     sortOrder: 1, status: 'ACTIVE' },
  { id: 'T001', code: 'NJ-T01',  name: '白班组',    parentId: 'L001', factoryId: 'F001', level: 'TEAM',     sortOrder: 1, status: 'ACTIVE' },
  { id: 'T002', code: 'NJ-T02',  name: '夜班组',    parentId: 'L001', factoryId: 'F001', level: 'TEAM',     sortOrder: 2, status: 'ACTIVE' },
  { id: 'T003', code: 'NJ-T03',  name: '制剂A班',   parentId: 'L003', factoryId: 'F001', level: 'TEAM',     sortOrder: 1, status: 'ACTIVE' },
  // ── 溧水工厂 (F002) ───────────────────────────────────────────
  { id: 'W011', code: 'LS-WS01', name: '发酵车间',   parentId: null,   factoryId: 'F002', level: 'WORKSHOP', sortOrder: 1, status: 'ACTIVE' },
  { id: 'W012', code: 'LS-WS02', name: '精制车间',   parentId: null,   factoryId: 'F002', level: 'WORKSHOP', sortOrder: 2, status: 'ACTIVE' },
  { id: 'L011', code: 'LS-L01',  name: '发酵产线1', parentId: 'W011', factoryId: 'F002', level: 'LINE',     sortOrder: 1, status: 'ACTIVE' },
  { id: 'T011', code: 'LS-T01',  name: '发酵白班',   parentId: 'L011', factoryId: 'F002', level: 'TEAM',     sortOrder: 1, status: 'ACTIVE' },
];

// ── 用户-工厂授权 ─────────────────────────────────────────────────
// admin -> 集团管理员，可访问所有工厂
// 其余员工默认南京工厂
export const DEFAULT_USER_FACTORIES: UserFactory[] = [
  { userId: 'admin',  factoryIds: ['F001','F002'], defaultFactoryId: 'F001' },
  { userId: 'OP006',  factoryIds: ['F001','F002'], defaultFactoryId: 'F001' },
  { userId: 'OP005',  factoryIds: ['F001'],        defaultFactoryId: 'F001' },
  { userId: 'OP001',  factoryIds: ['F001'],        defaultFactoryId: 'F001' },
  { userId: 'OP002',  factoryIds: ['F001'],        defaultFactoryId: 'F001' },
  { userId: 'OP003',  factoryIds: ['F001','F002'], defaultFactoryId: 'F001' },
  { userId: 'OP004',  factoryIds: ['F001'],        defaultFactoryId: 'F001' },
  { userId: 'OP007',  factoryIds: ['F002'],        defaultFactoryId: 'F002' },
  { userId: 'OP008',  factoryIds: ['F002'],        defaultFactoryId: 'F002' },
];

// ── 空权限（无任何操作） ─────────────────────────────────────────
const NONE: OperationFlags = {
  view: false, create: false, update: false, delete: false,
  audit: false, enable: false, disable: false, print: false,
};
// ── 仅查看 ───────────────────────────────────────────────────────
const VIEW_ONLY: OperationFlags = {
  view: true, create: false, update: false, delete: false,
  audit: false, enable: false, disable: false, print: false,
};
// ── 查看+打印 ────────────────────────────────────────────────────
const VIEW_PRINT: OperationFlags = {
  view: true, create: false, update: false, delete: false,
  audit: false, enable: false, disable: false, print: true,
};
// ── 增改审 ───────────────────────────────────────────────────────
const CUA: OperationFlags = {
  view: true, create: true, update: true, delete: false,
  audit: true, enable: false, disable: false, print: false,
};
// ── 增改审+打印 ──────────────────────────────────────────────────
const CUA_PRINT: OperationFlags = {
  view: true, create: true, update: true, delete: false,
  audit: true, enable: false, disable: false, print: true,
};
// ── 增改审启停 ───────────────────────────────────────────────────
const CUA_ED: OperationFlags = {
  view: true, create: true, update: true, delete: false,
  audit: true, enable: true, disable: true, print: false,
};
// ── 增改审启停打印 ───────────────────────────────────────────────
const CUA_ED_PRINT: OperationFlags = {
  view: true, create: true, update: true, delete: false,
  audit: true, enable: true, disable: true, print: true,
};
// ── 全部权限 ─────────────────────────────────────────────────────
const FULL: OperationFlags = {
  view: true, create: true, update: true, delete: true,
  audit: true, enable: true, disable: true, print: true,
};
// ── 查看+审核 ────────────────────────────────────────────────────
const VIEW_AUDIT: OperationFlags = {
  view: true, create: false, update: false, delete: false,
  audit: true, enable: false, disable: false, print: false,
};
// ── 仅新增（操作工报工） ─────────────────────────────────────────
const CREATE_ONLY: OperationFlags = {
  view: true, create: true, update: false, delete: false,
  audit: false, enable: false, disable: false, print: false,
};

// ── 菜单基准列表（对应实际系统菜单） ────────────────────────────
export const MENU_CATALOG: Array<{ key: string; label: string; group: string }> = [
  // 基础资料
  { key: 'product-series',    label: '产品系列',       group: '基础资料' },
  { key: 'material-category', label: '物料分类',       group: '基础资料' },
  { key: 'material',          label: '物料档案',       group: '基础资料' },
  { key: 'unit',              label: '计量单位',       group: '基础资料' },
  { key: 'bom',               label: '物料清单(BOM)',  group: '基础资料' },
  { key: 'workshop-archive',  label: '车间档案',       group: '基础资料' },
  { key: 'equipment',         label: '设备档案',       group: '基础资料' },
  { key: 'workcenter',        label: '工作中心',       group: '基础资料' },
  { key: 'operation',         label: '工序主数据',     group: '基础资料' },
  { key: 'pro',               label: '工艺路径',       group: '基础资料' },
  { key: 'team',              label: '班组档案',       group: '基础资料' },
  { key: 'employee',          label: '员工档案',       group: '基础资料' },
  { key: 'qc-item',           label: '质检项目',       group: '基础资料' },
  { key: 'qc-scheme',         label: '质检方案',       group: '基础资料' },
  // 生产管理
  { key: 'dashboard',         label: '生产看板',       group: '生产管理' },
  { key: 'production-order',  label: '生产订单',       group: '生产管理' },
  { key: 'work-order',        label: '生产工单',       group: '生产管理' },
  { key: 'task-order',        label: '生产任务单',     group: '生产管理' },
  // 车间执行
  { key: 'pad-execution',     label: 'PAD工序执行',    group: '车间执行' },
  { key: 'pad-taskpool',      label: 'PAD任务池',      group: '车间执行' },
  { key: 'floatticket',       label: '批生产浮票',     group: '车间执行' },
  { key: 'workshop',          label: '车间看板',       group: '车间执行' },
  // 质量管理
  { key: 'inspection',        label: '质检工作台',     group: '质量管理' },
  { key: 'mrb',               label: 'MRB评审',        group: '质量管理' },
  { key: 'release',           label: '质量放行',       group: '质量管理' },
  // 设备管理
  { key: 'equipment-mgmt',    label: '设备管理总览',   group: '设备管理' },
  { key: 'equip-conflict',    label: '设备冲突检测',   group: '设备管理' },
  // 电子批记录
  { key: 'ebr-list',          label: '批记录管理',     group: '电子批记录' },
  { key: 'equip-usage',       label: '设备使用批记录', group: '电子批记录' },
  { key: 'material-balance',  label: '物料平衡表',     group: '电子批记录' },
  // 系统管理
  { key: 'permission',        label: '权限管理',       group: '系统管理' },
];

// ── 辅助函数：构建权限条目 ───────────────────────────────────────
function perm(menuKey: string, ops: OperationFlags): MenuPermission {
  const meta = MENU_CATALOG.find(m => m.key === menuKey)!;
  return { menuKey, menuLabel: meta?.label ?? menuKey, menuGroup: meta?.group ?? '', ops };
}

// ═══════════════════════════════════════════════════════════════════
// 标准角色定义（10个，对应文档 §三）
// ═══════════════════════════════════════════════════════════════════
export const DEFAULT_ROLES: Role[] = [

  // ── 1. 系统管理员 ──────────────────────────────────────────────
  {
    id: 'ROLE_ADMIN',
    code: 'MES_ADMIN',
    name: '系统管理员',
    description: '系统配置、角色权限、用户管理、日志审计，拥有全部菜单最高权限',
    dataScope: 'ALL',
    color: '#f5222d',
    isBuiltin: true,
    status: 'ACTIVE',
    permissions: MENU_CATALOG.map(m => perm(m.key, FULL)),
  },

  // ── 2. 生产计划员 ─────────────────────────────────────────────
  {
    id: 'ROLE_PLAN',
    code: 'PLAN_MGR',
    name: '生产计划员',
    description: '工单下达、排程调整、生产订单全周期管理（增改审），工厂级数据范围',
    dataScope: 'FACTORY',
    color: '#1677ff',
    isBuiltin: true,
    status: 'ACTIVE',
    permissions: [
      perm('dashboard',        VIEW_PRINT),
      perm('production-order', CUA_PRINT),
      perm('work-order',       CUA_PRINT),
      perm('task-order',       CUA),
      perm('pad-execution',    VIEW_ONLY),
      perm('pad-taskpool',     VIEW_ONLY),
      perm('floatticket',      VIEW_PRINT),
      perm('workshop',         VIEW_ONLY),
      perm('inspection',       VIEW_ONLY),
      perm('mrb',              VIEW_ONLY),
      perm('release',          VIEW_ONLY),
      perm('equipment-mgmt',   VIEW_ONLY),
      perm('equip-conflict',   VIEW_ONLY),
      perm('ebr-list',         VIEW_ONLY),
      perm('equip-usage',      VIEW_ONLY),
      perm('material-balance', VIEW_PRINT),
      // 基础资料查看
      perm('product-series',   VIEW_ONLY),
      perm('material',         VIEW_ONLY),
      perm('bom',              VIEW_ONLY),
      perm('workshop-archive', VIEW_ONLY),
      perm('operation',        VIEW_ONLY),
      perm('pro',              VIEW_ONLY),
      perm('team',             VIEW_ONLY),
      perm('employee',         VIEW_ONLY),
    ],
  },

  // ── 3. 车间主任 ───────────────────────────────────────────────
  {
    id: 'ROLE_WORKSHOP_MGR',
    code: 'WORKSHOP_MGR',
    name: '车间主任',
    description: '车间级生产监控、异常审批、绩效查看，数据范围限本车间',
    dataScope: 'WORKSHOP',
    color: '#52c41a',
    isBuiltin: true,
    status: 'ACTIVE',
    permissions: [
      perm('dashboard',        VIEW_PRINT),
      perm('production-order', VIEW_ONLY),
      perm('work-order',       { ...VIEW_AUDIT, enable: true, disable: true, print: true }),
      perm('task-order',       { ...VIEW_AUDIT, print: true }),
      perm('pad-execution',    VIEW_AUDIT),
      perm('pad-taskpool',     VIEW_ONLY),
      perm('floatticket',      VIEW_PRINT),
      perm('workshop',         { ...VIEW_PRINT, enable: true }),
      perm('inspection',       VIEW_AUDIT),
      perm('mrb',              VIEW_AUDIT),
      perm('release',          VIEW_AUDIT),
      perm('equipment-mgmt',   VIEW_ONLY),
      perm('equip-conflict',   VIEW_ONLY),
      perm('ebr-list',         VIEW_PRINT),
      perm('equip-usage',      VIEW_PRINT),
      perm('material-balance', VIEW_PRINT),
      perm('team',             VIEW_ONLY),
      perm('employee',         VIEW_ONLY),
      perm('pro',              VIEW_ONLY),
    ],
  },

  // ── 4. 班组长 ─────────────────────────────────────────────────
  {
    id: 'ROLE_TEAM_LEAD',
    code: 'TEAM_LEAD',
    name: '班组长',
    description: '本班组任务分派、报工确认、交接班，数据范围限本班组',
    dataScope: 'TEAM',
    color: '#fa8c16',
    isBuiltin: true,
    status: 'ACTIVE',
    permissions: [
      perm('dashboard',        VIEW_ONLY),
      perm('work-order',       VIEW_ONLY),
      perm('task-order',       CUA_PRINT),
      perm('pad-execution',    CUA_PRINT),
      perm('pad-taskpool',     CUA),
      perm('floatticket',      CUA_PRINT),
      perm('workshop',         VIEW_ONLY),
      perm('inspection',       VIEW_ONLY),
      perm('equipment-mgmt',   { ...VIEW_ONLY, create: true }),  // 可报修
      perm('ebr-list',         VIEW_PRINT),
      perm('equip-usage',      VIEW_PRINT),
      perm('material-balance', VIEW_ONLY),
      perm('team',             VIEW_ONLY),
      perm('employee',         VIEW_ONLY),
    ],
  },

  // ── 5. 操作工 ─────────────────────────────────────────────────
  {
    id: 'ROLE_OPERATOR',
    code: 'OPERATOR',
    name: '操作工',
    description: '执行工序、扫码报工、质量自检，数据范围限本人',
    dataScope: 'PERSONAL',
    color: '#13c2c2',
    isBuiltin: true,
    status: 'ACTIVE',
    permissions: [
      perm('dashboard',        VIEW_ONLY),
      perm('work-order',       VIEW_ONLY),
      perm('pad-execution',    { ...CREATE_ONLY, print: true }),
      perm('pad-taskpool',     CUA),
      perm('floatticket',      VIEW_PRINT),
      perm('workshop',         VIEW_ONLY),
      perm('ebr-list',         VIEW_ONLY),
      perm('equip-usage',      CREATE_ONLY),
    ],
  },

  // ── 6. 质量检验员 ─────────────────────────────────────────────
  {
    id: 'ROLE_QC',
    code: 'QC_INSPECTOR',
    name: '质量检验员',
    description: '来料检、过程检、成品检、不合格品处理、MRB评审，数据范围本车间',
    dataScope: 'WORKSHOP',
    color: '#722ed1',
    isBuiltin: true,
    status: 'ACTIVE',
    permissions: [
      perm('dashboard',        VIEW_ONLY),
      perm('work-order',       VIEW_ONLY),
      perm('inspection',       CUA_PRINT),
      perm('mrb',              CUA_PRINT),
      perm('release',          CUA_PRINT),
      perm('floatticket',      VIEW_PRINT),
      perm('ebr-list',         CUA_PRINT),
      perm('material-balance', VIEW_PRINT),
      perm('qc-item',          VIEW_ONLY),
      perm('qc-scheme',        VIEW_ONLY),
    ],
  },

  // ── 7. 质检主管（MRB审批权） ─────────────────────────────────
  {
    id: 'ROLE_QC_MGR',
    code: 'QC_MGR',
    name: '质检主管',
    description: '质检员全部权限 + MRB审批 + 质量放行 + 质检方案配置',
    dataScope: 'FACTORY',
    color: '#531dab',
    isBuiltin: false,
    status: 'ACTIVE',
    permissions: [
      perm('dashboard',        VIEW_PRINT),
      perm('work-order',       VIEW_ONLY),
      perm('inspection',       FULL),
      perm('mrb',              FULL),
      perm('release',          FULL),
      perm('floatticket',      VIEW_PRINT),
      perm('ebr-list',         CUA_PRINT),
      perm('material-balance', VIEW_PRINT),
      perm('qc-item',          CUA_ED),
      perm('qc-scheme',        CUA_ED),
    ],
  },

  // ── 8. 设备管理员 ─────────────────────────────────────────────
  {
    id: 'ROLE_EQ_MGR',
    code: 'EQ_MANAGER',
    name: '设备管理员',
    description: '设备台账、点检、保养、维修派工、备件管理，数据范围本工厂',
    dataScope: 'FACTORY',
    color: '#d4380d',
    isBuiltin: true,
    status: 'ACTIVE',
    permissions: [
      perm('dashboard',        VIEW_ONLY),
      perm('equipment',        CUA_ED_PRINT),
      perm('equipment-mgmt',   FULL),
      perm('equip-conflict',   VIEW_ONLY),
      perm('equip-usage',      CUA_PRINT),
      perm('ebr-list',         VIEW_ONLY),
    ],
  },

  // ── 9. 追溯专员 ───────────────────────────────────────────────
  {
    id: 'ROLE_TRACE',
    code: 'TRACE_CLERK',
    name: '追溯专员',
    description: '批次追溯查询、EBR全量查看、物料平衡分析，数据范围全工厂',
    dataScope: 'FACTORY',
    color: '#0958d9',
    isBuiltin: false,
    status: 'ACTIVE',
    permissions: [
      perm('dashboard',        VIEW_ONLY),
      perm('production-order', VIEW_PRINT),
      perm('work-order',       VIEW_PRINT),
      perm('floatticket',      VIEW_PRINT),
      perm('ebr-list',         VIEW_PRINT),
      perm('equip-usage',      VIEW_PRINT),
      perm('material-balance', VIEW_PRINT),
    ],
  },

  // ── 10. 报表查看员 ────────────────────────────────────────────
  {
    id: 'ROLE_REPORT',
    code: 'REPORT_VIEWER',
    name: '报表查看员',
    description: '仅查看看板、报表和大屏，无任何新增/修改/审核操作权限',
    dataScope: 'FACTORY',
    color: '#8c8c8c',
    isBuiltin: true,
    status: 'ACTIVE',
    permissions: [
      perm('dashboard',        VIEW_PRINT),
      perm('production-order', VIEW_PRINT),
      perm('work-order',       VIEW_PRINT),
      perm('task-order',       VIEW_ONLY),
      perm('workshop',         VIEW_ONLY),
      perm('inspection',       VIEW_PRINT),
      perm('mrb',              VIEW_ONLY),
      perm('ebr-list',         VIEW_PRINT),
      perm('material-balance', VIEW_PRINT),
    ],
  },
];

// ═══════════════════════════════════════════════════════════════════
// 员工-角色默认分配（对应 workOrderData.ts 中的 OPERATORS）
// ═══════════════════════════════════════════════════════════════════
export const DEFAULT_USER_ROLES: UserRole[] = [
  // 系统管理员
  { userId: 'OP006', userName: '周八',   roleIds: ['ROLE_ADMIN', 'ROLE_PLAN'] },
  // 生产计划员
  { userId: 'OP005', userName: '孙七',   roleIds: ['ROLE_PLAN'] },
  // 车间主任
  { userId: 'OP001', userName: '张三',   roleIds: ['ROLE_WORKSHOP_MGR', 'ROLE_TEAM_LEAD'] },
  // 班组长
  { userId: 'OP002', userName: '李四',   roleIds: ['ROLE_TEAM_LEAD'] },
  { userId: 'OP003', userName: '王五',   roleIds: ['ROLE_TEAM_LEAD'] },
  { userId: 'OP004', userName: '赵六',   roleIds: ['ROLE_TEAM_LEAD'] },
  // 操作工
  { userId: 'OP007', userName: '陈小明', roleIds: ['ROLE_OPERATOR'] },
  { userId: 'OP008', userName: '刘大强', roleIds: ['ROLE_OPERATOR'] },
  { userId: 'OP009', userName: '林小红', roleIds: ['ROLE_OPERATOR'] },
  { userId: 'OP010', userName: '黄建国', roleIds: ['ROLE_OPERATOR'] },
  { userId: 'OP011', userName: '何文华', roleIds: ['ROLE_OPERATOR'] },
  { userId: 'OP012', userName: '杨帆',   roleIds: ['ROLE_OPERATOR'] },
  // 质检员
  { userId: 'OP013', userName: '吴晓燕', roleIds: ['ROLE_QC'] },
  { userId: 'OP014', userName: '郑国强', roleIds: ['ROLE_QC_MGR'] },
  // 设备管理员
  { userId: 'OP015', userName: '冯建军', roleIds: ['ROLE_EQ_MGR'] },
  { userId: 'OP016', userName: '蒋晓峰', roleIds: ['ROLE_EQ_MGR'] },
  // 追溯专员
  { userId: 'OP017', userName: '沈美玲', roleIds: ['ROLE_TRACE'] },
  // 报表查看员
  { userId: 'OP018', userName: '韩志远', roleIds: ['ROLE_REPORT', 'ROLE_QC'] },
];

// ── localStorage 存储键 ─────────────────────────────────────────
export const RBAC_STORE_KEY    = 'bip_rbac_roles';
export const UROL_STORE_KEY    = 'bip_rbac_user_roles';
export const UF_STORE_KEY      = 'bip_rbac_user_factories';  // 用户-工厂映射
export const ORG_STORE_KEY     = 'bip_rbac_org_nodes_v2';    // 组织节点（v2：济宁工厂）
export const CUR_FACTORY_KEY   = 'bip_cur_factory';          // 当前选中工厂

// ── 读取/保存角色列表 ────────────────────────────────────────────
export function loadRoles(): Role[] {
  try {
    const s = localStorage.getItem(RBAC_STORE_KEY);
    if (s) return JSON.parse(s) as Role[];
  } catch { /* ignore */ }
  // 首次初始化
  localStorage.setItem(RBAC_STORE_KEY, JSON.stringify(DEFAULT_ROLES));
  return DEFAULT_ROLES;
}
export function saveRoles(roles: Role[]): void {
  localStorage.setItem(RBAC_STORE_KEY, JSON.stringify(roles));
}

// ── 读取/保存员工-角色映射 ──────────────────────────────────────
export function loadUserRoles(): UserRole[] {
  try {
    const s = localStorage.getItem(UROL_STORE_KEY);
    if (s) return JSON.parse(s) as UserRole[];
  } catch { /* ignore */ }
  localStorage.setItem(UROL_STORE_KEY, JSON.stringify(DEFAULT_USER_ROLES));
  return DEFAULT_USER_ROLES;
}
export function saveUserRoles(data: UserRole[]): void {
  localStorage.setItem(UROL_STORE_KEY, JSON.stringify(data));
}

// ── 获取某员工合并后的所有权限（并集计算） ──────────────────────
export function getUserEffectivePermissions(userId: string, roles: Role[], userRoles: UserRole[]): Map<string, OperationFlags> {
  const ur = userRoles.find(u => u.userId === userId);
  if (!ur) return new Map();

  const result = new Map<string, OperationFlags>();
  ur.roleIds.forEach(roleId => {
    const role = roles.find(r => r.id === roleId);
    if (!role || role.status === 'DISABLED') return;
    role.permissions.forEach(p => {
      const existing = result.get(p.menuKey);
      if (!existing) {
        result.set(p.menuKey, { ...p.ops });
      } else {
        // 并集：任一角色有，则合并后也有
        result.set(p.menuKey, {
          view:    existing.view    || p.ops.view,
          create:  existing.create  || p.ops.create,
          update:  existing.update  || p.ops.update,
          delete:  existing.delete  || p.ops.delete,
          audit:   existing.audit   || p.ops.audit,
          enable:  existing.enable  || p.ops.enable,
          disable: existing.disable || p.ops.disable,
          print:   existing.print   || p.ops.print,
        });
      }
    });
  });
  return result;
}

// ── 获取某员工最大数据范围 ──────────────────────────────────────
const SCOPE_LEVEL: Record<DataScope, number> = {
  PERSONAL: 1, TEAM: 2, WORKSHOP: 3, FACTORY: 4, ALL: 5,
};
export function getUserMaxDataScope(userId: string, roles: Role[], userRoles: UserRole[]): DataScope {
  const ur = userRoles.find(u => u.userId === userId);
  if (!ur) return 'PERSONAL';
  let max: DataScope = 'PERSONAL';
  ur.roleIds.forEach(roleId => {
    const role = roles.find(r => r.id === roleId);
    if (role && SCOPE_LEVEL[role.dataScope] > SCOPE_LEVEL[max]) {
      max = role.dataScope;
    }
  });
  return max;
}

// ── 数据范围标签 ────────────────────────────────────────────────
export const DATA_SCOPE_LABEL: Record<DataScope, string> = {
  PERSONAL: '本人',
  TEAM:     '本班组',
  WORKSHOP: '本车间',
  FACTORY:  '本工厂',
  ALL:      '全集团',
};

export const DATA_SCOPE_COLOR: Record<DataScope, string> = {
  PERSONAL: '#8c8c8c',
  TEAM:     '#13c2c2',
  WORKSHOP: '#52c41a',
  FACTORY:  '#1677ff',
  ALL:      '#f5222d',
};

// ═══════════════════════════════════════════════════════════════════
// 多工厂工具函数
// ═══════════════════════════════════════════════════════════════════

/** 读取用户-工厂映射 */
export function loadUserFactories(): UserFactory[] {
  try {
    const s = localStorage.getItem(UF_STORE_KEY);
    if (s) return JSON.parse(s) as UserFactory[];
  } catch { /* ignore */ }
  localStorage.setItem(UF_STORE_KEY, JSON.stringify(DEFAULT_USER_FACTORIES));
  return DEFAULT_USER_FACTORIES;
}
export function saveUserFactories(data: UserFactory[]): void {
  localStorage.setItem(UF_STORE_KEY, JSON.stringify(data));
}

/** 读取组织节点 */
export function loadOrgNodes(): OrgNode[] {
  try {
    const s = localStorage.getItem(ORG_STORE_KEY);
    if (s) return JSON.parse(s) as OrgNode[];
  } catch { /* ignore */ }
  localStorage.setItem(ORG_STORE_KEY, JSON.stringify(ORG_NODES));
  return ORG_NODES;
}
export function saveOrgNodes(data: OrgNode[]): void {
  localStorage.setItem(ORG_STORE_KEY, JSON.stringify(data));
}

/** 获取当前工厂ID（含默认值） */
export function getCurrentFactoryId(): string {
  return localStorage.getItem(CUR_FACTORY_KEY) ?? 'F001';
}
export function setCurrentFactoryId(factoryId: string): void {
  localStorage.setItem(CUR_FACTORY_KEY, factoryId);
}

/** 根据用户ID获取可用工厂列表 */
export function getUserAvailableFactories(userId: string): FactoryConfig[] {
  const ufList = loadUserFactories();
  const uf = ufList.find(u => u.userId === userId || u.userId === 'admin');
  // admin/OP006 可见全部
  if (!uf) return FACTORIES.filter(f => f.id === 'F001');
  return FACTORIES.filter(f => uf.factoryIds.includes(f.id));
}

/** 根据用户ID获取默认工厂ID */
export function getUserDefaultFactoryId(userId: string): string {
  const ufList = loadUserFactories();
  const uf = ufList.find(u => u.userId === userId);
  return uf?.defaultFactoryId ?? 'F001';
}

/** 获取指定工厂的组织节点树（按层级） */
export function getFactoryOrgTree(factoryId: string, nodes: OrgNode[] = ORG_NODES): OrgNode[] {
  return nodes.filter(n => n.factoryId === factoryId);
}

/** 获取工厂配置 */
export function getFactoryById(factoryId: string): FactoryConfig | undefined {
  return FACTORIES.find(f => f.id === factoryId);
}

// 组织层级中文名
export const ORG_LEVEL_LABEL: Record<OrgLevel, string> = {
  GROUP:    '集团',
  FACTORY:  '工厂',
  WORKSHOP: '车间',
  LINE:     '产线',
  TEAM:     '班组',
};

export const ORG_LEVEL_COLOR: Record<OrgLevel, string> = {
  GROUP:    '#f5222d',
  FACTORY:  '#fa8c16',
  WORKSHOP: '#1677ff',
  LINE:     '#52c41a',
  TEAM:     '#13c2c2',
};

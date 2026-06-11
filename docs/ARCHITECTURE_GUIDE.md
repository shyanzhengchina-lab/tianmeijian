# React MES 架构使用指南

## 目录

1. [架构概述](#架构概述)
2. [目录结构](#目录结构)
3. [状态管理](#状态管理)
4. [通用组件](#通用组件)
5. [开发指南](#开发指南)
6. [迁移指南](#迁移指南)
7. [最佳实践](#最佳实践)

---

## 架构概述

### 核心设计理念

React MES 前端采用了现代化的模块化架构设计，遵循以下核心原则：

1. **模块化**: 按业务领域划分模块，每个模块独立开发和部署
2. **组件化**: 高度复用的通用组件库，减少代码重复
3. **类型安全**: 100% TypeScript 类型覆盖，编译时错误检查
4. **状态管理**: 统一的 Zustand 状态管理模式
5. **可维护性**: 清晰的代码结构和职责划分

### 技术栈

```
- React 18.x           // UI框架
- TypeScript 5.x        // 类型系统
- Ant Design 5.x       // UI组件库
- Zustand 4.x          // 状态管理
- Axios                 // HTTP客户端
- Vite                 // 构建工具
```

### 架构分层

```
┌─────────────────────────────────────────────────────────────┐
│                    UI Layer (Components)               │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │ Business │  │ Shared  │  │ Basic   │        │
│  │ Modules │  │ Components│  │ Modules │        │
│  └─────────┘  └─────────┘  └─────────┘        │
├─────────────────────────────────────────────────────┤
│              State Layer (Zustand Stores)           │
│  ┌─────────┐  ┌─────────┐                      │
│  │ Global  │  │ Module  │                      │
│  │ Stores  │  │ Stores  │                      │
│  └─────────┘  └─────────┘                      │
├─────────────────────────────────────────────────────┤
│                API Layer (Services)                │
│  ┌─────────┐  ┌─────────┐                      │
│  │ Client  │  │ Module  │                      │
│  │ Services│  │ APIs   │                      │
│  └─────────┘  └─────────┘                      │
└─────────────────────────────────────────────────────┘
```

---

## 目录结构

### 项目结构

```
/src
├── modules/                    # 业务模块目录
│   ├── basic-data/            # 基础资料模块
│   │   ├── material/         # 物料档案
│   │   ├── unit/            # 计量单位
│   │   ├── bom/             # 物料清单
│   │   ├── operation/       # 工序主数据
│   │   ├── equipment/       # 设备档案
│   │   ├── workcenter/      # 工作中心
│   │   ├── team/           # 班组档案
│   │   ├── employee/        # 员工档案
│   │   ├── qc-item/        # 质检项目
│   │   ├── qc-scheme/      # 质检方案
│   │   └── workshop/       # 车间档案
│   ├── production/         # 生产管理模块
│   │   ├── production-order/
│   │   ├── work-order/
│   │   └── task-order/
│   ├── execution/          # 车间执行模块
│   │   ├── workshop/
│   │   ├── pad/
│   │   ├── issuance/
│   │   └── ebr/
│   ├── quality/           # 质量管理模块
│   │   ├── inspection/
│   │   ├── mrb/
│   │   └── release/
│   ├── routing/           # 工艺路径模块
│   │   ├── product-series/
│   │   ├── routing-master/
│   │   └── routing-detail/
│   └── system/            # 系统管理模块
│       ├── permission/
│       └── organization/
├── shared/                # 共享资源目录
│   ├── components/        # 通用组件
│   ├── hooks/           # 共享hooks
│   ├── stores/          # 全局状态管理
│   ├── api/             # API基础设施
│   ├── utils/           # 工具函数
│   └── types/           # 共享类型定义
├── routing/             # 路由配置
└── App.tsx             # 根组件
```

### 模块内部结构

每个业务模块都遵循统一的结构：

```
modules/[module-name]/
├── components/          # 组件文件
│   ├── [Module]List.tsx       # 列表组件
│   ├── [Module]Form.tsx       # 表单组件
│   ├── [Module]Detail.tsx    # 详情组件
│   └── index.ts              # 组件导出
├── store/              # Zustand store
│   └── [module]Store.ts       # 状态管理
├── types/              # 类型定义
│   └── index.ts              # 类型导出
└── index.ts            # 模块导出
```

---

## 状态管理

### Zustand Store 架构

项目使用 Zustand 进行状态管理，分为全局 Store 和模块 Store 两种类型。

#### 全局 Store

全局 Store 用于管理跨模块的状态，包括：

```typescript
// shared/stores/rbacStore.ts
interface RbacState {
  roles: Role[];
  userRoles: UserRole[];
  permissions: Map<string, OperationFlags>;
  // Actions
  loadRoles: () => Promise<void>;
  checkPermission: (menuKey: string, operation: string) => boolean;
}

// shared/stores/authStore.ts
interface AuthState {
  user: User | null;
  token: string | null;
  // Actions
  login: (credentials: LoginDTO) => Promise<void>;
  logout: () => void;
}

// shared/stores/navigationStore.ts
interface NavigationState {
  currentPage: string;
  navigationParams: Record<string, any>;
  // Actions
  navigateTo: (page: string, params?: object) => void;
}

// shared/stores/factoryStore.ts
interface FactoryState {
  currentFactoryId: string;
  factories: FactoryConfig[];
  // Actions
  switchFactory: (factoryId: string) => void;
}
```

#### 模块 Store

每个业务模块都有独立的 Store：

```typescript
// modules/basic-data/material/store/materialStore.ts
interface MaterialState {
  materials: Material[];
  total: number;
  loading: boolean;
  error: string | null;
  query: MaterialQuery;
  selectedIds: string[];
  
  // CRUD Actions
  loadMaterials: () => Promise<void>;
  createMaterial: (data: CreateMaterialDTO) => Promise<void>;
  updateMaterial: (data: UpdateMaterialDTO) => Promise<void>;
  deleteMaterials: (ids: string[]) => Promise<void>;
}
```

### Store 创建模式

使用标准的 Store 创建模式：

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useMaterialStore = create<MaterialState>()(
  persist(
    (set, get) => ({
      // 初始状态
      materials: [],
      loading: false,
      error: null,
      
      // Actions
      loadMaterials: async () => {
        set({ loading: true });
        try {
          const response = await materialApi.getMaterials(get().query);
          set({ 
            materials: response.data,
            loading: false 
          });
        } catch (error) {
          set({ 
            loading: false,
            error: error.message 
          });
        }
      },
    }),
    {
      name: 'material-store',
      partialize: (state) => ({
        materials: state.materials,
        query: state.query,
      }),
    }
  )
);
```

---

## 通用组件

### DataTable 组件

通用数据表格组件，支持分页、选择、排序等功能。

```typescript
import { DataTable } from '@/shared/components/DataTable';

interface User {
  id: string;
  name: string;
  email: string;
}

const columns = [
  {
    title: '姓名',
    dataIndex: 'name',
    key: 'name',
    width: 150,
    align: 'center' as const,
  },
  {
    title: '邮箱',
    dataIndex: 'email',
    key: 'email',
    width: 200,
    align: 'center' as const,
  },
];

const UserList: React.FC = () => {
  const { users, loading, query, setQuery, setSelectedIds } = useUserStore();
  
  return (
    <DataTable
      data={users}
      loading={loading}
      rowKey="id"
      columns={columns}
      pagination={{
        current: query.current,
        pageSize: query.pageSize,
        total: query.total,
        onChange: (page, pageSize) => setQuery({ current: page, pageSize }),
      }}
      rowSelection={{
        selectedRowKeys: selectedIds,
        onChange: setSelectedIds,
      }}
    />
  );
};
```

### FormModal 组件

通用表单弹窗组件，用于新增和编辑操作。

```typescript
import { FormModal } from '@/shared/components/FormModal';

const formFields = [
  {
    name: 'name',
    label: '姓名',
    type: 'input',
    rules: [{ required: true, message: '请输入姓名' }],
  },
  {
    name: 'email',
    label: '邮箱',
    type: 'input',
    rules: [
      { required: true, message: '请输入邮箱' },
      { type: 'email', message: '邮箱格式不正确' },
    ],
  },
];

const UserForm: React.FC = () => {
  const [form] = Form.useForm();
  
  const handleSubmit = async (values: UserDTO) => {
    await createUser(values);
  };
  
  return (
    <FormModal
      visible={showModal}
      title="新增用户"
      mode="create"
      fields={formFields}
      onSubmit={handleSubmit}
      onCancel={() => setShowModal(false)}
    />
  );
};
```

### StatusBadge 组件

状态标签组件，统一显示不同状态的样式。

```typescript
import { StatusBadge } from '@/shared/components/StatusBadge';

const STATUS_MAP = {
  ACTIVE: { label: '启用', color: '#52c41a', bg: '#f6ffed' },
  INACTIVE: { label: '停用', color: '#bfbfbf', bg: '#f5f5f5' },
};

const UserList: React.FC = () => {
  return (
    <StatusBadge
      status={user.status}
      statusMap={STATUS_MAP}
    />
  );
};
```

---

## 开发指南

### 创建新模块

按照以下步骤创建新模块：

#### 1. 创建目录结构

```bash
mkdir -p src/modules/[module-name]/{components,store,types}
```

#### 2. 定义类型

```typescript
// modules/[module-name]/types/index.ts
export interface Entity {
  id: string;
  name: string;
  status: EntityStatus;
}

export interface CreateEntityDTO {
  name: string;
  // 其他字段
}

export type EntityStatus = 'ACTIVE' | 'INACTIVE' | 'DRAFT';
```

#### 3. 创建 Store

```typescript
// modules/[module-name]/store/[module]Store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface EntityState {
  entities: Entity[];
  loading: boolean;
  error: string | null;
  query: EntityQuery;
  
  loadEntities: () => Promise<void>;
  createEntity: (data: CreateEntityDTO) => Promise<void>;
  updateEntity: (data: UpdateEntityDTO) => Promise<void>;
  deleteEntities: (ids: string[]) => Promise<void>;
}

export const useEntityStore = create<EntityState>()(
  persist(
    (set, get) => ({
      entities: [],
      loading: false,
      error: null,
      query: { current: 1, pageSize: 15 },
      
      loadEntities: async () => {
        // 实现
      },
      
      createEntity: async (data) => {
        // 实现
      },
      
      updateEntity: async (data) => {
        // 实现
      },
      
      deleteEntities: async (ids) => {
        // 实现
      },
    }),
    {
      name: 'entity-store',
      partialize: (state) => ({
        entities: state.entities,
        query: state.query,
      }),
    }
  )
);
```

#### 4. 创建组件

```typescript
// modules/[module-name]/components/[Module]List.tsx
import React, { useEffect } from 'react';
import { DataTable } from '@/shared/components/DataTable';
import { useEntityStore } from '../store/[module]Store';

export const EntityList: React.FC = () => {
  const { entities, loading, query, loadEntities, setQuery, setSelectedIds } = useEntityStore();
  
  useEffect(() => {
    loadEntities();
  }, [query]);
  
  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      align: 'center' as const,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      align: 'center' as const,
      render: (status: string) => (
        <StatusBadge status={status} statusMap={ENTITY_STATUS_MAP} />
      ),
    },
  ];
  
  return (
    <DataTable
      data={entities}
      loading={loading}
      rowKey="id"
      columns={columns}
      pagination={{
        current: query.current,
        pageSize: query.pageSize,
        onChange: (page, pageSize) => setQuery({ current: page, pageSize }),
      }}
      rowSelection={{
        selectedRowKeys: selectedIds,
        onChange: setSelectedIds,
      }}
    />
  );
};
```

### API 调用规范

```typescript
// modules/[module-name]/api/[module]Api.ts
import { ApiClient } from '@/shared/api/apiClient';

class [Module]ApiService {
  private apiClient: ApiClient;
  
  constructor() {
    this.apiClient = new ApiClient();
  }
  
  async getEntities(query: EntityQuery): Promise<PageResult<Entity>> {
    return await this.apiClient.get('/api/entities', { params: query });
  }
  
  async getEntityById(id: string): Promise<Entity> {
    return await this.apiClient.get(`/api/entities/${id}`);
  }
  
  async createEntity(data: CreateEntityDTO): Promise<Entity> {
    return await this.apiClient.post('/api/entities', data);
  }
  
  async updateEntity(data: UpdateEntityDTO): Promise<Entity> {
    return await this.apiClient.put(`/api/entities/${data.id}`, data);
  }
  
  async deleteEntities(ids: string[]): Promise<void> {
    return await this.apiClient.delete('/api/entities', { data: { ids } });
  }
}

export const [module]Api = new [Module]ApiService();
```

---

## 迁移指南

### 从旧架构迁移到新架构

#### 1. 识别需要迁移的文件

查找使用以下模式的文件：
- 大型页面组件（> 1000 行）
- 包含内联样式的文件
- 直接操作 localStorage 的文件
- 缺少类型定义的文件

#### 2. 创建新模块结构

```bash
# 示例：迁移 WorkOrderListPage
mkdir -p src/modules/work-order/{components,store,types}
```

#### 3. 提取类型定义

```typescript
// 从原组件中提取接口
interface WorkOrder {
  id: string;
  orderNo: string;
  status: string;
  // ... 其他字段
}

// 迁移到 types/index.ts
```

#### 4. 创建 Zustand Store

```typescript
// 将 useState 和 localStorage 逻辑迁移到 Zustand Store
// 原代码：
const [orders, setOrders] = useState<WorkOrder[]>([]);
const [loading, setLoading] = useState(false);

// 新代码：
interface WorkOrderState {
  orders: WorkOrder[];
  loading: boolean;
  loadOrders: () => Promise<void>;
}
```

#### 5. 重构组件

```typescript
// 使用通用组件替换重复代码
// 原代码：
<Table 
  dataSource={orders}
  columns={columns}
  pagination={{ current, pageSize, total }}
/>

// 新代码：
<DataTable
  data={orders}
  columns={columns}
  pagination={{ current, pageSize, total }}
/>
```

#### 6. 更新路由和导入

```typescript
// 更新路由配置
import { WorkOrderList } from '@/modules/work-order/components/WorkOrderList';

const routes = [
  {
    path: '/work-order',
    component: WorkOrderList,
  },
];
```

### 迁移检查清单

- [ ] 创建新模块目录结构
- [ ] 提取并迁移类型定义
- [ ] 创建 Zustand Store
- [ ] 重构组件使用通用组件
- [ ] 移除内联样式
- [ ] 添加 TypeScript 类型注解
- [ ] 迁移 localStorage 到 Zustand persist
- [ ] 更新 API 调用
- [ ] 更新路由配置
- [ ] 测试迁移后的功能
- [ ] 删除旧代码

---

## 最佳实践

### 1. 组件设计原则

- **单一职责**: 每个组件只负责一个功能
- **Props 接口**: 清晰定义组件输入输出
- **可复用**: 组件应该可以在多个地方使用
- **性能优化**: 使用 React.memo、useMemo、useCallback

### 2. 状态管理原则

- **最小化状态**: 只存储必要的状态
- **分离关注点**: 相关状态放在同一个 Store
- **避免冗余**: 不要在多处存储相同数据
- **持久化策略**: 只持久化必要的状态

### 3. 类型安全原则

- **避免 any**: 尽量使用具体类型
- **接口定义**: 为所有数据结构定义接口
- **类型推导**: 让 TypeScript 推导类型
- **类型工具**: 使用 Pick、Omit、Partial 等类型工具

### 4. 代码组织原则

- **模块化**: 按业务领域组织代码
- **分层清晰**: 组件、状态、API 分层
- **命名规范**: 统一的文件和变量命名
- **注释规范**: 清晰的中文注释和文档

### 5. 性能优化原则

- **代码分割**: 使用动态 import 按需加载
- **懒加载**: 组件和页面的懒加载
- **缓存策略**: 合理使用缓存
- **批量操作**: 减少网络请求

---

## 常见问题

### Q: 如何处理权限检查？

A: 使用 `usePermission` hook 和权限 Store：

```typescript
const { checkPermission } = usePermissionStore();
const hasPermission = checkPermission('material', 'create');
```

### Q: 如何处理表单验证？

A: 使用 Ant Design Form 的验证规则：

```typescript
const [form] = Form.useForm();

const rules = {
  name: [
    { required: true, message: '请输入姓名' },
    { min: 2, message: '姓名至少2个字符' },
  ],
};
```

### Q: 如何处理异步状态？

A: 在 Store 中统一管理异步状态：

```typescript
loadData: async () => {
  set({ loading: true, error: null });
  try {
    const data = await api.getData();
    set({ data, loading: false });
  } catch (error) {
    set({ loading: false, error: error.message });
  }
}
```

### Q: 如何处理国际化？

A: 创建 i18n 配置和使用 i18n 库：

```typescript
import { useTranslation } from 'react-i18next';

const { t } = useTranslation();

<span>{t('material.name')}</span>
```

---

## 调试和测试

### 开发工具

- **React DevTools**: 组件树和状态检查
- **Zustand DevTools**: 状态管理调试
- **Chrome DevTools**: 网络请求和性能分析

### 测试建议

- **单元测试**: 使用 Jest + React Testing Library
- **集成测试**: 使用 Cypress 或 Playwright
- **E2E 测试**: 关键业务流程的端到端测试

---

## 总结

本指南提供了 React MES 前端架构的完整使用说明，包括架构设计、开发规范、迁移路径和最佳实践。遵循本指南可以确保代码质量和开发效率。

如需更多帮助，请参考具体的模块文档或联系技术支持团队。

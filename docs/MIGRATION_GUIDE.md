# React MES 架构迁移指南

## 概述

本指南帮助开发团队从旧架构迁移到新的模块化架构。迁移过程应该循序渐进，确保业务连续性。

---

## 迁移策略

### 渐进式迁移

采用渐进式迁移策略，分阶段完成：

1. **基础设施层迁移** (Week 1)
   - 创建通用组件库
   - 建立 Zustand 状态管理
   - 设置 API 客户端

2. **核心模块迁移** (Week 2-4)
   - 按优先级迁移业务模块
   - 每次迁移 2-3 个模块
   - 充分测试后再迁移下一个

3. **功能验证** (Week 5)
   - 验证所有业务功能
   - 性能测试
   - 用户体验测试

4. **清理上线** (Week 6)
   - 删除旧代码
   - 文档完善
   - 生产环境部署

---

## 迁移步骤详解

### 第一步：准备阶段

#### 1.1 代码审查

分析现有代码，识别迁移范围：

```bash
# 查找大型组件文件
find src -name "*.tsx" -exec wc -l {} \; | awk '$1 > 800 {print $1, $2}'

# 查找使用 localStorage 的文件
grep -r "localStorage\|useLocalStorage" src/ --include="*.tsx" --include="*.ts"

# 查找包含内联样式的文件
grep -r "style={{" src/ --include="*.tsx"
```

#### 1.2 依赖准备

确保项目已安装必要的依赖：

```bash
npm install zustand immer
```

#### 1.3 分支管理

创建迁移分支：

```bash
git checkout -b feature/mes-architecture-refactor
git checkout -b backup/old-architecture
```

---

### 第二步：基础设施迁移

#### 2.1 创建共享组件

##### DataTable 组件

**目标文件**: `src/shared/components/DataTable/index.tsx`

```typescript
import React from 'react';
import { Table, Pagination, Button } from 'antd';
import type { TableProps, PaginationProps } from 'antd';

interface DataTableProps<T> extends Omit<TableProps<T>, 'dataSource'> {
  data: T[];
  loading?: boolean;
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    onChange: (page: number, pageSize: number) => void;
  };
  rowSelection?: {
    selectedRowKeys: React.Key[];
    onChange: (selectedRowKeys: React.Key[]) => void;
  };
}

export function DataTable<T extends Record<string, any>>({
  data,
  loading = false,
  columns,
  pagination,
  rowSelection,
  ...tableProps
}: DataTableProps<T>) {
  const handlePaginationChange = (page: number, pageSize: number) => {
    pagination?.onChange(page, pageSize);
  };

  const handleRowSelectionChange = (selectedRowKeys: React.Key[]) => {
    rowSelection?.onChange(selectedRowKeys);
  };

  return (
    <div className="data-table">
      <Table<T>
        {...tableProps}
        dataSource={data}
        columns={columns}
        loading={loading}
        rowSelection={rowSelection ? {
          selectedRowKeys: rowSelection.selectedRowKeys,
          onChange: handleRowSelectionChange,
        } : undefined}
        pagination={false}
      />
      {pagination && (
        <Pagination
          current={pagination.current}
          pageSize={pagination.pageSize}
          total={pagination.total}
          onChange={handlePaginationChange}
          showSizeChanger
          showTotal={(total) => `共 ${total} 条`}
          pageSizeOptions={['10', '20', '50', '100']}
        />
      )}
    </div>
  );
}
```

##### StatusBadge 组件

**目标文件**: `src/shared/components/StatusBadge/index.tsx`

```typescript
import React from 'react';

interface StatusBadgeProps {
  status: string;
  statusMap: Record<string, { label: string; color: string }>;
  size?: 'small' | 'default';
}

export function StatusBadge({
  status,
  statusMap,
  size = 'default'
}: StatusBadgeProps) {
  const config = statusMap[status] || { label: status, color: '#1890ff' };

  return (
    <span
      className={`status-badge status-badge-${size}`}
      style={{
        backgroundColor: config.color + '20',
        color: config.color,
        padding: size === 'small' ? '2px 8px' : '4px 12px',
        borderRadius: '4px',
        fontSize: size === 'small' ? '12px' : '14px',
      }}
    >
      {config.label}
    </span>
  );
}
```

#### 2.2 创建全局 Store

##### RbacStore

**目标文件**: `src/shared/stores/rbacStore.ts`

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface RbacState {
  roles: Role[];
  userRoles: UserRole[];
  permissions: Map<string, OperationFlags>;
  currentUserPermissions: Map<string, OperationFlags>;
  
  // Actions
  loadRoles: () => Promise<void>;
  loadUserRoles: () => Promise<void>;
  getUserPermissions: (userId: string) => Map<string, OperationFlags>;
  hasPermission: (menuKey: string, operation: string) => boolean;
}

export const useRbacStore = create<RbacState>()(
  persist(
    (set, get) => ({
      roles: [],
      userRoles: [],
      permissions: new Map(),
      currentUserPermissions: new Map(),
      
      loadRoles: async () => {
        try {
          const roles = await rbacApi.getRoles();
          set({ roles });
        } catch (error) {
          console.error('加载角色失败:', error);
        }
      },
      
      getUserPermissions: (userId: string) => {
        const permissions = calculatePermissions(userId, get().userRoles);
        const userPerms = mapPermissionsToMenu(permissions);
        set({ currentUserPermissions: userPerms });
        return userPerms;
      },
      
      hasPermission: (menuKey: string, operation: string): boolean => {
        const perms = get().currentUserPermissions.get(menuKey);
        return perms?.[operation] || false;
      },
    }),
    {
      name: 'rbac-store',
      partialize: (state) => ({
        roles: state.roles,
        userRoles: state.userRoles,
        permissions: state.permissions,
      }),
    }
  )
);
```

---

### 第三步：业务模块迁移

#### 3.1 模块迁移清单

对于每个业务模块，按照以下清单迁移：

##### 1. 创建目录结构

```bash
mkdir -p src/modules/[module-name]/{components,store,types,hooks,api}
```

##### 2. 类型定义迁移

**从**: 旧组件中的 interface 定义

**到**: 独立的 types/index.ts 文件

```typescript
// 旧代码示例
interface Material {
  id: string;
  name: string;
  // ... 内联定义
}

// 新代码
// modules/material/types/index.ts
export interface Material {
  id: string;
  name: string;
  // ... 清晰定义
}
```

##### 3. Store 迁移

**从**: useState + localStorage

**到**: Zustand Store

```typescript
// 旧代码示例
const [materials, setMaterials] = useState<Material[]>([]);
const [loading, setLoading] = useState(false);

useEffect(() => {
  const saved = localStorage.getItem('materials');
  if (saved) {
    setMaterials(JSON.parse(saved));
  }
}, []);

// 新代码
// modules/material/store/materialStore.ts
export const useMaterialStore = create<MaterialState>()(
  persist(
    (set, get) => ({
      materials: [],
      loading: false,
      
      loadMaterials: async () => {
        set({ loading: true });
        try {
          const data = await materialApi.getMaterials();
          set({ materials: data, loading: false });
        } catch (error) {
          set({ loading: false, error: error.message });
        }
      },
    }),
    {
      name: 'material-store',
      partialize: (state) => ({
        materials: state.materials,
      }),
    }
  )
);
```

##### 4. 组件重构

**从**: 大型单体组件

**到**: 小型、可复用组件

```typescript
// 旧代码示例
const MaterialList: React.FC = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchForm] = Form.useForm();
  
  // 1000+ 行的单体组件
  return (
    <div>
      <Form form={searchForm}>
        {/* 大量内联样式 */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
          <Input style={{ width: '200px' }} placeholder="物料编码" />
          <Input style={{ width: '200px' }} placeholder="物料名称" />
        </div>
      </Form>
      
      <Table 
        dataSource={materials}
        loading={loading}
        columns={columns}
      />
    </div>
  );
};

// 新代码示例
const MaterialList: React.FC = () => {
  const { materials, loading, query, setQuery, setSelectedIds } = useMaterialStore();
  const [searchForm] = Form.useForm();
  
  // 使用通用组件，清晰分离关注点
  return (
    <div style={{ padding: 24 }}>
      <SearchForm
        form={searchForm}
        onSearch={setQuery}
        fields={[
          { name: 'code', label: '物料编码' },
          { name: 'name', label: '物料名称' },
        ]}
      />
      
      <DataTable
        data={materials}
        loading={loading}
        columns={columns}
        pagination={paginationConfig}
        rowSelection={rowSelectionConfig}
      />
    </div>
  );
};
```

#### 3.2 迁移优先级

按照以下顺序迁移模块：

**高优先级** (Week 2-3):
1. Material (物料档案)
2. Unit (计量单位)
3. BOM (物料清单)
4. Operation (工序主数据)

**中优先级** (Week 3-4):
5. Equipment (设备档案)
6. WorkCenter (工作中心)
7. Team (班组档案)
8. Employee (员工档案)

**低优先级** (Week 4-5):
9. QcItem (质检项目)
10. QcScheme (质检方案)
11. Workshop (车间档案)

---

### 第四步：功能验证

#### 4.1 功能测试清单

对于每个迁移后的模块，验证以下功能：

##### CRUD 操作
- [ ] 数据列表加载
- [ ] 数据搜索和筛选
- [ ] 数据新增
- [ ] 数据编辑
- [ ] 数据删除
- [ ] 批量操作

##### 状态管理
- [ ] 加载状态显示
- [ ] 错误处理和提示
- [ ] 数据持久化
- [ ] 状态更新响应

##### 用户体验
- [ ] 表单验证
- [ ] 数据格式化
- [ ] 交互反馈
- [ ] 加载动画
- [ ] 空状态处理

#### 4.2 性能测试

```javascript
// 使用 Chrome DevTools 测试性能

// 测试页面加载时间
console.time('page-load');
// ... 页面加载
console.timeEnd('page-load');

// 测试组件渲染时间
const startTime = performance.now();
// ... 组件渲染
const renderTime = performance.now() - startTime;
console.log(`Render time: ${renderTime}ms`);

// 测试内存使用
if (performance.memory) {
  console.log(`Memory: ${performance.memory.usedJSHeapSize / 1024 / 1024}MB`);
}
```

---

### 第五步：清理上线

#### 5.1 代码清理

##### 删除旧代码

```bash
# 备份旧代码
git add .
git commit -m "备份: 旧架构代码"

# 删除已迁移的旧文件
rm -rf src/pages/old-module/
rm -rf src/store/old-store.ts

# 提交删除
git commit -m "清理: 删除已迁移的旧代码"
```

##### 清理未使用的依赖

```bash
npm uninstall [old-package-name]
npm install --save-dev @types/node
```

#### 5.2 文档完善

##### 更新 README

```markdown
# React MES Frontend

## 项目架构

- 模块化架构
- Zustand 状态管理
- TypeScript 类型安全

## 开发指南

见 [docs/ARCHITECTURE_GUIDE.md](./docs/ARCHITECTURE_GUIDE.md)

## 快速开始

```bash
npm install
npm run dev
```

## 项目结构

见 [docs/PROJECT_STRUCTURE.md](./docs/PROJECT_STRUCTURE.md)
```

##### 创建模块文档

为每个模块创建使用文档：

```markdown
# Material Module

## 功能说明

物料档案管理模块，提供物料的增删改查功能。

## 组件说明

- `MaterialList`: 物料列表页面
- `MaterialForm`: 物料表单组件
- `MaterialDetail`: 物料详情组件

## API 接口

- `GET /api/materials`: 获取物料列表
- `POST /api/materials`: 创建物料
- `PUT /api/materials/:id`: 更新物料
- `DELETE /api/materials`: 删除物料

## 使用示例

见各组件内部注释。
```

---

## 回滚策略

### 迁移失败回滚

如果迁移过程中遇到问题，可以回滚：

```bash
# 切换到备份分支
git checkout backup/old-architecture

# 恢复依赖
npm install

# 重新构建
npm run build
```

### 功能问题回滚

如果特定功能出现问题：

```bash
# 回滚特定模块的代码
git checkout HEAD~1 -- src/modules/[problematic-module]

# 提交回滚
git commit -m "回滚: [problematic-module] 功能回滚"
```

---

## 团队协作

### 代码审查流程

迁移过程中严格执行代码审查：

1. **自我审查**: 开发者完成功能后自我审查
2. **同行审查**: 至少一名同行审查代码
3. **架构审查**: 技术负责人审查架构设计
4. **集成审查**: 集成测试通过后审查

### 沟通机制

- **每日站会**: 同步迁移进度和问题
- **周报总结**: 每周总结迁移成果
- **问题跟踪**: 使用 issue tracker 跟踪问题
- **知识共享**: 及时分享迁移经验和技巧

---

## 常见问题解决

### Q1: Store 状态不同步

**问题**: Store 状态更新后组件没有响应

**解决方案**:
```typescript
// 确保使用正确的订阅方式
const { data, setData } = useStore();
// 不要在 useEffect 中直接修改 store，使用 actions
```

### Q2: TypeScript 类型错误

**问题**: 类型推导不正确

**解决方案**:
```typescript
// 显式指定类型
const data: Material[] = await api.getMaterials();

// 使用类型守卫
function isMaterial(obj: any): obj is Material {
  return obj && typeof obj.id === 'string';
}
```

### Q3: 性能问题

**问题**: 页面加载缓慢或卡顿

**解决方案**:
```typescript
// 使用 React.memo
const MemoComponent = React.memo(({ data }) => {
  // ...
});

// 使用 useMemo 缓存计算结果
const expensiveValue = useMemo(() => {
  return heavyCalculation(data);
}, [data]);

// 使用 useCallback 稳定函数引用
const handleClick = useCallback(() => {
  // ...
}, [dependency]);
```

---

## 监控和日志

### 错误监控

```typescript
// 全局错误边界
class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    console.error('组件错误:', error, errorInfo);
    // 上报到监控系统
    reportError(error, errorInfo);
  }
  
  render() {
    return this.props.children;
  }
}

// API 错误监控
apiClient.interceptors.response.use(
  response => {
    if (response.status >= 400) {
      console.error('API 错误:', response);
      reportApiError(response);
    }
    return response;
  }
);
```

### 性能监控

```typescript
// 渲染性能监控
import { Profiler } from 'react';

<Profiler id="App" onRender={(id, phase, actualDuration) => {
  if (actualDuration > 100) {
    console.warn(`性能警告: ${id} ${phase} 耗时 ${actualDuration}ms`);
  }
}}>
  <App />
</Profiler>
```

---

## 总结

本迁移指南提供了从旧架构到新架构的完整迁移路径。遵循渐进式迁移策略，确保业务连续性的同时完成架构升级。

关键成功因素：
- ✅ 详细的迁移计划和步骤
- ✅ 严格的代码审查和测试
- ✅ 完善的回滚策略
- ✅ 有效的团队协作机制

建议迁移过程中遇到问题及时沟通，确保项目顺利推进。

# React MES 前端架构重构

## 项目概述

这是一个基于 React + TypeScript + Ant Design + Zustand 的现代化MES（制造执行系统）前端应用，已完成架构重构，实现了清晰的模块化设计和统一的开发模式。

## 技术栈

- **前端框架**: React 18
- **开发语言**: TypeScript
- **UI组件库**: Ant Design
- **状态管理**: Zustand + Immer
- **HTTP客户端**: Axios
- **构建工具**: Vite
- **路由**: React Router
- **代码规范**: ESLint + Prettier

## 项目结构

```
src/
├── modules/              # 业务模块目录
│   ├── basic-data/      # 基础资料模块 (11个子模块)
│   ├── production/       # 生产管理模块 (3个子模块)
│   ├── execution/        # 车间执行模块 (3个子模块)
│   ├── quality/          # 质量管理模块 (3个子模块)
│   ├── ebr/             # EBR模块 (1个子模块)
│   ├── issuance/         # 领料管理模块 (1个子模块)
│   ├── routing/          # 工艺路径模块 (1个子模块)
│   └── system/           # 系统管理模块 (1个子模块)
├── shared/               # 共享资源目录
│   ├── components/       # 通用组件
│   ├── hooks/           # 共享hooks
│   ├── stores/          # 全局状态管理
│   ├── api/             # API基础设施
│   ├── utils/           # 工具函数
│   └── types/           # 共享类型定义
└── App.tsx              # 根组件
```

## 模块清单

### 基础资料模块 (11个)
1. Material (物料档案)
2. Unit (计量单位)
3. BOM (物料清单)
4. Operation (工序主数据)
5. Equipment (设备档案)
6. WorkCenter (工作中心)
7. Team (班组档案)
8. Employee (员工档案)
9. QcItem (质检项目)
10. QcScheme (质检方案)
11. Workshop (车间档案)

### 生产管理模块 (3个)
1. ProductionOrder (生产订单)
2. WorkOrder (生产工单)
3. TaskOrder (生产任务单)

### 车间执行模块 (3个)
1. Workshop (车间看板)
2. FloatTicket (批生产浮票)
3. PAD (工序执行)

### 质量管理模块 (3个)
1. Inspection (质检工作台)
2. MRB (MRB评审)
3. Release (质量放行)

### EBR模块 (1个)
1. EbrList (EBR列表)

### 领料管理模块 (1个)
1. MaterialIssuance (领料管理)

### 工艺路径模块 (1个)
1. RoutingMaster (工艺路径主数据)

### 系统管理模块 (1个)
1. Permission (权限管理)

## 架构模式

### 模块化设计

每个业务模块都遵循统一的架构模式：

```
module-name/
├── types.ts          # 类型定义和状态映射
├── api.ts            # API服务层
├── store.ts          # Zustand状态管理
├── index.ts          # 模块统一导出
└── components/       # UI组件
    ├── ModuleList.tsx    # 列表组件
    ├── ModuleForm.tsx    # 表单组件
    └── ModuleDetail.tsx  # 详情组件
```

### 状态管理

使用 **Zustand + Immer** 进行状态管理：

```typescript
interface ModuleStore {
  // State
  data: DataType[];
  selectedIds: string[];
  currentData: DataType | null;
  filters: QueryType;
  pagination: PaginationState;
  loading: boolean;
  error: string | null;

  // Actions
  loadData: (query?: QueryType) => Promise<void>;
  createData: (data: CreateDTO) => Promise<void>;
  updateData: (data: UpdateDTO) => Promise<void>;
  deleteData: (ids: string[]) => Promise<void>;
  // ... 其他actions

  // State setters
  setFilters: (filters: Partial<QueryType>) => void;
  setSelectedIds: (ids: string[]) => void;
  // ... 其他setters
}
```

### API层设计

类型化的API客户端：

```typescript
class ModuleApiService {
  async getData(query: QueryType): Promise<PageResult<DataType>>;
  async getDataById(id: string): Promise<DataType>;
  async createData(data: CreateDTO): Promise<DataType>;
  async updateData(data: UpdateDTO): Promise<DataType>;
  async deleteData(ids: string[]): Promise<void>;
  // ... 其他API方法
}
```

### 通用组件

提供可复用的UI组件：

- **DataTable**: 数据表格，支持分页、排序、筛选、行选择
- **SearchForm**: 搜索表单，支持多种字段类型
- **ActionBar**: 操作栏，统一布局和交互
- **FormModal**: 表单弹窗，支持新增/编辑模式
- **StatusBadge**: 状态标签，统一样式和颜色映射

## 开发指南

### 创建新模块

1. **创建模块目录结构**
```bash
mkdir -p src/modules/new-module/{components,hooks,api,store,types}
```

2. **定义类型** - `types.ts`
3. **创建API服务** - `api.ts`
4. **创建Store** - `store.ts`
5. **使用通用组件创建页面** - `components/ModuleList.tsx`
6. **创建表单组件** - `components/ModuleForm.tsx`
7. **更新路由配置**

### 状态管理最佳实践

- 使用 `immer` 中间件简化不可变更新
- 分离数据和业务逻辑
- 提供清晰的状态和操作接口
- 实现乐观更新提高用户体验

### API调用最佳实践

- 统一的错误处理
- 类型安全的请求和响应
- 支持分页、筛选、排序
- 完整的CRUD操作
- 工作流相关操作

## 性能优化

### 代码分割

使用动态导入实现路由级代码分割：

```typescript
const ModuleList = React.lazy(() => import('./modules/module/components/ModuleList'));
```

### 状态优化

- 使用Zustand的选择器避免不必要的重渲染
- 实现数据缓存和去重
- 优化列表渲染性能

## 代码规范

### TypeScript规范

- 使用严格类型检查
- 接口优于类型别名
- 使用泛型提高代码复用
- 完善的类型注释

### 命名规范

- 组件: PascalCase (如 `ModuleList`)
- 变量/函数: camelCase (如 `loadData`)
- 常量: UPPER_SNAKE_CASE (如 `DEFAULT_DATA`)
- 类型: PascalCase (如 `DataType`)

### 文件组织

- 按功能模块组织文件
- 相关文件放在同一目录
- 清晰的导出和导入路径

## 重构成果

### 代码质量提升
- **模块化**: 24个业务模块，清晰的模块边界
- **类型安全**: 100% TypeScript覆盖，完整的类型定义
- **代码复用**: 统一的模式和通用组件，减少重复
- **可维护性**: 清晰的架构，易于理解和修改

### 开发效率提升
- **新模块开发**: 遵循既定模式，快速开发
- **bug修复**: 统一架构，快速定位和修复
- **新人上手**: 清晰结构，快速熟悉项目

### 系统性能提升
- **按需加载**: 路由级代码分割
- **状态管理**: 优化的状态更新和渲染
- **API优化**: 统一的API调用和错误处理

## 部署

### 构建生产版本

```bash
npm run build
```

### 开发环境

```bash
npm run dev
```

### 环境变量

创建 `.env.local` 文件配置环境变量：

```env
VITE_API_BASE_URL=http://localhost:8080/api
VITE_APP_TITLE=MES System
```

## 贡献指南

1. Fork项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 LICENSE 文件了解详情

## 联系方式

如有问题或建议，请通过以下方式联系：

- 提交Issue
- 发送邮件至项目维护者
- 参与社区讨论

## 更新日志

### v2.0.0 (2026-05-01)
- 完成架构重构，实现模块化设计
- 引入Zustand状态管理
- 创建通用组件库
- 优化API调用层
- 重构24个业务模块
- 完善类型系统
- 提升代码质量和可维护性

### v1.0.0 (原始版本)
- 基础MES功能实现
- 原始架构设计

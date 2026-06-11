# React MES 新架构使用指南

## 概述

本文档提供了 React MES 前端新架构的详细使用指南，帮助开发者快速理解和使用新的模块化设计。

## 架构特性

### 1. 模块化设计

每个业务模块都是独立的，包含：
- **types.ts** - 类型定义
- **api.ts** - API 服务
- **store.ts** - 状态管理 (Zustand + Immer)
- **components/** - 组件目录
  - **List.tsx** - 列表组件
  - **Form.tsx** - 表单组件
  - **Detail.tsx** - 详情组件
  - **index.ts** - 组件导出
- **index.ts** - 模块统一导出

### 2. 统一组件模式

所有模块组件遵循统一的结构和命名规范：

```typescript
// List 组件结构
interface [ModuleName]ListProps {
  // Props 定义
}

const [ModuleName]List: React.FC<[ModuleName]ListProps> = () => {
  // Store 实例
  const {
    // State
    data,
    loading,
    filters,
    selectedIds,
    pagination,
    
    // Actions
    loadData,
    setFilters,
    setSelectedIds,
    setPagination,
    resetFilters,
    create,
    update,
    delete,
    // Workflow actions
    submit,
    approve,
    reject,
    // Batch actions
    batchApprove,
    batchReject,
    // Export
    exportData,
    // UI actions
    showDetail,
    showCreateForm,
    showEditForm,
  } = use[ModuleName]Store();

  // 组件实现
  return (
    // 组件 JSX
  );
};
```

### 3. 状态管理 (Zustand + Immer)

每个模块都有独立的 Zustand store：

```typescript
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface [ModuleName]State {
  // State
  data: DataType[];
  loading: boolean;
  error: string | null;
  filters: FilterType;
  selectedIds: string[];
  pagination: PaginationState;
  
  // Actions
  loadData: (query?: QueryType) => Promise<void>;
  createData: (data: CreateDTO) => Promise<void>;
  updateData: (data: UpdateDTO) => Promise<void>;
  deleteData: (ids: string[]) => Promise<void>;
  // ... 其他 actions
}

export const use[ModuleName]Store = create<[ModuleName]State>()(
  immer((set, get) => ({
    // Initial state
    // Actions implementations
  }))
);
```

### 4. 类型安全

完整的 TypeScript 类型定义：

```typescript
// 基础类型
export type [ModuleName]Status = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

// 主数据接口
export interface [ModuleName] {
  id: string;
  code: string;
  name: string;
  status: [ModuleName]Status;
  // ... 其他字段
}

// DTO 接口
export interface Create[ModuleName]DTO {
  code: string;
  name: string;
  // ... 其他字段
}

export interface Update[ModuleName]DTO extends Partial<Create[ModuleName]DTO> {
  id: string;
}

// 查询接口
export interface [ModuleName]Query extends PageQuery {
  code?: string;
  name?: string;
  status?: [ModuleName]Status;
  // ... 其他筛选条件
}

// 状态映射
export const [MODULE]_STATUS_MAP: Record<[ModuleName]Status, {
  label: string;
  color: string;
  badgeType: 'default' | 'processing' | 'error' | 'success' | 'warning';
}> = {
  ACTIVE: { label: '启用', color: '#52c41a', badgeType: 'success' },
  INACTIVE: { label: '停用', color: '#d9d9d9', badgeType: 'default' },
  ARCHIVED: { label: '归档', color: '#999', badgeType: 'default' },
};
```

## 模块列表

### 已完成模块 (26个)

#### 基础资料模块 (11个)
1. **Material** - 物料档案
2. **Unit** - 计量单位
3. **BOM** - 物料清单
4. **Equipment** - 设备档案
5. **WorkCenter** - 工作中心
6. **Operation** - 工序主数据
7. **Team** - 班组档案
8. **Employee** - 员工档案
9. **QcItem** - 质检项目
10. **QcScheme** - 质检方案
11. **Workshop** - 车间档案

#### 生产管理模块 (3个)
12. **ProductionOrder** - 生产订单
13. **WorkOrder** - 生产工单
14. **TaskOrder** - 生产任务单

#### 车间执行模块 (4个)
15. **Workshop** - 车间看板 (实时监控)
16. **FloatTicket** - 批生产浮票
17. **PAD** - 工序执行
18. **Inspection** - 质检工作台

#### 质量管理模块 (3个)
19. **Inspection** - 质检工作台
20. **MRB** - MRB 不合格品评审
21. **Release** - 质量放行

#### EBR 模块 (1个)
22. **EBR** - 电子批记录

#### 领料管理模块 (3个)
23. **MaterialIssuance** - 领料单管理
24. **PADIssuance** - 工位领料
25. **BackflushMonitor** - 倒冲监控

#### 工艺路径模块 (3个)
26. **ProductSeries** - 产品系列
27. **RoutingMaster** - 工艺路径主数据
28. **RoutingDetail** - 工艺明细

#### 系统管理模块 (2个)
29. **Permission** - 权限管理
30. **Organization** - 组织机构管理

## 使用示例

### 1. 使用模块组件

```typescript
import { PadIssuanceList } from '../modules/issuance/pad-issuance';

function MyPage() {
  return <PadIssuanceList />;
}
```

### 2. 使用模块 Store

```typescript
import { usePadIssuanceStore } from '../modules/issuance/pad-issuance';

function MyPage() {
  const {
    padIssuances,
    loading,
    filters,
    createPadIssuance,
    loadPadIssuances,
  } = usePadIssuanceStore();

  const handleCreate = async (data) => {
    await createPadIssuance(data);
    // 数据会自动更新
  };

  return (
    <div>
      <button onClick={() => loadPadIssuances()}>刷新</button>
      {/* ... */}
    </div>
  );
}
```

### 3. 创建自定义页面

```typescript
import { PadIssuanceList, usePadIssuanceStore } from '../modules/issuance/pad-issuance';

function CustomPage() {
  const {
    padIssuances,
    createPadIssuance,
    showDetail,
    showCreateForm,
  } = usePadIssuanceStore();

  return (
    <div>
      <h1>工位领料管理</h1>
      
      {/* 自定义操作按钮 */}
      <button onClick={showCreateForm}>新建</button>
      
      {/* 使用标准列表组件 */}
      <PadIssuanceList />
      
      {/* 自定义表格 */}
      <table>
        {padIssuances.map(item => (
          <tr key={item.id}>
            <td>{item.issuanceNo}</td>
            <td>
              <button onClick={() => showDetail(item)}>查看详情</button>
            </td>
          </tr>
        ))}
      </table>
    </div>
  );
}
```

## 开发指南

### 创建新模块步骤

1. **创建模块目录**
```bash
mkdir -p src/modules/[module-name]/{components,hooks,api,store,types}
```

2. **创建类型定义** (`types.ts`)
   - 定义主要数据接口
   - 定义 DTO 接口 (Create, Update)
   - 定义查询接口
   - 定义状态映射常量

3. **创建 API 服务** (`api.ts`)
   - 实现所有 API 调用方法
   - 使用类型化的请求和响应

4. **创建 Store** (`store.ts`)
   - 定义 State 接口
   - 使用 Zustand + Immer 创建 store
   - 实现所有 actions

5. **创建组件**
   - **List.tsx** - 列表组件，包含表格、筛选、批量操作
   - **Form.tsx** - 表单组件，支持新增和编辑
   - **Detail.tsx** - 详情组件，展示完整信息

6. **创建组件导出** (`components/index.ts`)
   - 统一导出所有组件

7. **创建模块导出** (`index.ts`)
   - 导出 types, api, store, components

## 最佳实践

### 1. 命名规范

- **模块名**: 使用 PascalCase，如 `PadIssuance`
- **文件名**: 使用 PascalCase.tsx，如 `PadIssuanceList.tsx`
- **组件名**: 使用 PascalCase，如 `PadIssuanceList`
- **Store Hook**: 使用 `use[ModuleName]Store`，如 `usePadIssuanceStore`
- **API 实例**: 使用 `[moduleName]Api`，如 `padIssuanceApi`

### 2. 代码组织

```typescript
// 导入顺序
// 1. React 相关
import React from 'react';
import { useEffect, useState } from 'react';

// 2. 第三方库
import { Table, Button, Space } from 'antd';
import { PlusOutlined, EditOutlined } from '@ant-design/icons';

// 3. 类型导入
import type { ColumnsType } from 'antd/es/table';
import type { DataType } from './types';

// 4. 本地导入
import { useModuleStore } from './store';
import { STATUS_MAP } from './types';
```

### 3. 错误处理

```typescript
const handleAction = async () => {
  try {
    await someAction();
    message.success('操作成功');
  } catch (error) {
    message.error('操作失败');
    // 可选：记录错误
    console.error('操作失败:', error);
  }
};
```

### 4. 性能优化

- 使用 `useMemo` 缓存计算结果
- 使用 `useCallback` 避免重复创建函数
- 合理使用分页，避免一次性加载大量数据
- 使用虚拟滚动处理大数据集

## 迁移指南

### 从旧架构迁移到新架构

1. **识别旧代码**
   - 找到需要迁移的页面组件
   - 分析其功能和依赖

2. **创建新模块**
   - 按照新架构创建对应模块
   - 复用业务逻辑和 UI 设计

3. **更新路由配置**
   - 将路由指向新的模块组件
   - 测试所有功能是否正常

4. **清理旧代码**
   - 删除或注释旧的页面组件
   - 更新导入引用

## 故障排除

### 常见问题

**Q: 组件显示空白？**
A: 检查是否正确导入组件和 store，确保数据已加载。

**Q: 状态更新不生效？**
A: 确保使用 Immer 的 `draft` 参数，不要直接修改 state。

**Q: 类型错误？**
A: 检查类型定义是否完整，确保所有接口都正确导出。

**Q: API 调用失败？**
A: 检查 API 路径和参数，确保后端服务正常运行。

## 技术支持

如需技术支持或有问题反馈，请联系：
- 技术负责人：[技术负责人联系方式]
- 项目文档：[项目文档链接]
- 问题跟踪：[问题跟踪系统链接]

## 版本历史

- v2.0 (2026-05-01) - 新架构基础版本
- v2.1 (2026-05-01) - 新增 5 个模块组件
- v2.2 (2026-05-01) - 完善模块导出和集成

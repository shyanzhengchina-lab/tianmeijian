# 模块化迁移指南

## 迁移完成状态

✅ **已完成的模块**：
- Material模块（物料档案）
- Unit模块（计量单位）

⏳ **待迁移的模块**：
- BOM模块（物料清单）
- Operation模块（工序主数据）
- Equipment模块（设备档案）
- WorkCenter模块（工作中心）
- Team模块（班组档案）
- Employee模块（员工档案）
- QcItem模块（质检项目）
- QcScheme模块（质检方案）
- Workshop模块（车间档案）

## 模块迁移模式

基于Material和Unit模块的完整实现，我们建立了清晰的迁移模式。

### 标准模块结构

每个模块都遵循相同的目录结构：

```
modules/{module-name}/
├── components/      # 模块特定组件
├── hooks/         # 模块特定hooks（可选）
├── api.ts         # 模块API服务
├── store.ts       # 模块Zustand store
├── types.ts       # 模块类型定义
└── index.ts       # 模块导出
```

### 迁移步骤

#### Step 1: 分析现有页面

1. **查看现有页面文件**：
   ```bash
   # 例如查看BOM页面
   cat src/pages/bom/BomIndex.tsx
   ```

2. **识别数据结构**：
   - 主数据接口定义
   - 状态类型定义
   - 常量和映射关系

3. **识别功能需求**：
   - CRUD操作（增删改查）
   - 批量操作
   - 导入导出
   - 特殊业务逻辑

#### Step 2: 创建类型定义

```typescript
// modules/{module-name}/types.ts
import type { PageQuery, PageResult } from '../../../shared/api/requestTypes';

// 主数据接口
export interface MainData {
  id: string;
  code: string;
  name: string;
  // ... 其他字段
}

// 查询参数
export interface DataQuery extends PageQuery {
  code?: string;
  name?: string;
  // ... 其他查询条件
}

// DTO接口
export interface CreateDataDTO { /* 创建字段 */ }
export interface UpdateDataDTO extends Partial<CreateDataDTO> { id: string; }
```

#### Step 3: 创建API服务

```typescript
// modules/{module-name}/api.ts
class ModuleApiService {
  async getDataList(query: DataQuery): Promise<PageResult<MainData>> {
    const response = await apiClient.get<PageResult<MainData>>(
      '/{module}/page',
      { params: query }
    );
    return response.data;
  }

  async getDataById(id: string): Promise<MainData> {
    const response = await apiClient.get<MainData>(`/{module}/${id}`);
    return response.data;
  }

  async createData(data: CreateDataDTO): Promise<MainData> {
    const response = await apiClient.post<MainData>('/{module}', data);
    return response.data;
  }

  async updateData(data: UpdateDataDTO): Promise<MainData> {
    const response = await apiClient.put<MainData>('/{module}', data);
    return response.data;
  }

  async deleteData(ids: string[]): Promise<void> {
    await apiClient.delete<void>('/{module}', { data: ids });
  }
}

export const moduleApi = new ModuleApiService();
```

#### Step 4: 创建Zustand Store

```typescript
// modules/{module-name}/store.ts
interface ModuleStore {
  // State
  dataList: MainData[];
  selectedIds: string[];
  filters: DataQuery;
  pagination: PaginationState;
  loading: boolean;
  error: string | null;

  // Actions
  loadDataList: (query?: DataQuery) => Promise<void>;
  createData: (data: CreateDataDTO) => Promise<void>;
  updateData: (data: UpdateDataDTO) => Promise<void>;
  deleteData: (ids: string[]) => Promise<void>;
  // ... 其他actions

  // State setters
  setFilters: (filters: Partial<DataQuery>) => void;
  setSelectedIds: (ids: string[]) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

export const useModuleStore = create<ModuleStore>()(
  immer((set, get) => ({
    // 初始状态
    dataList: [],
    selectedIds: [],
    filters: {},
    pagination: { current: 1, pageSize: 15, total: 0 },
    loading: false,
    error: null,

    // Actions实现
    loadDataList: async (query?: DataQuery) => {
      set({ loading: true, error: null });
      try {
        const result = await moduleApi.getDataList(query);
        set({
          dataList: result.list,
          pagination: {
            current: result.current,
            pageSize: result.pageSize,
            total: result.total,
          },
          loading: false,
        });
      } catch (error: any) {
        set({ error: error?.message || '加载数据失败', loading: false });
        throw error;
      }
    },

    // ... 其他actions实现
  }))
);
```

#### Step 5: 创建页面组件

```typescript
// modules/{module-name}/components/ModuleList.tsx
import { DataTable } from '../../../shared/components/DataTable';
import { SearchForm } from '../../../shared/components/SearchForm';
import { ActionBar } from '../../../shared/components/ActionBar';
import { StatusBadge } from '../../../shared/components/StatusBadge';
import { FormModal } from '../../../shared/components/FormModal';
import { useModuleStore } from '../store';
import { usePermission } from '../../../shared/hooks/usePermission';

export const ModuleList = () => {
  const {
    dataList,
    selectedIds,
    filters,
    pagination,
    loading,
    error,
    loadDataList,
    // ... 其他状态和方法
  } = useModuleStore();

  const { canCreate, canUpdate, canDelete } = usePermission('module');

  // 使用通用组件构建页面
  return (
    <div className="module-page">
      {/* 搜索表单 */}
      <SearchForm
        fields={SEARCH_FIELDS}
        onSearch={handleSearch}
        onReset={handleReset}
        loading={loading}
      />

      {/* 操作栏 */}
      <ActionBar
        title="模块标题"
        actions={[
          { key: 'add', label: '新增', onClick: handleAdd },
        ]}
        selectedCount={selectedIds.length}
        batchActions={[
          { key: 'enable', label: '启用', onClick: handleEnable },
          { key: 'disable', label: '禁用', onClick: handleDisable },
        ]}
      />

      {/* 数据表格 */}
      <DataTable
        data={dataList}
        rowKey="id"
        columns={columns}
        loading={loading}
        pagination={pagination}
        rowSelection={{
          selectedRowKeys: selectedIds,
          onChange: (keys) => setSelectedIds(keys as string[]),
        }}
      />

      {/* 表单弹窗 */}
      <FormModal
        visible={modalOpen}
        title="新增/编辑"
        mode={modalMode}
        fields={FORM_FIELDS}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </div>
  );
};
```

#### Step 6: 测试和验证

1. **功能测试**：
   - ✅ 列表加载正常
   - ✅ 搜索过滤正常
   - ✅ 新增功能正常
   - ✅ 编辑功能正常
   - ✅ 删除功能正常
   - ✅ 批量操作正常
   - ✅ 分页功能正常

2. **UI/UX验证**：
   - ✅ 与现有页面样式完全一致
   - ✅ 所有交互行为正常
   - ✅ 响应式布局正常
   - ✅ 错误处理正常

3. **兼容性验证**：
   - ✅ 数据格式完全兼容
   - ✅ API接口签名不变
   - ✅ localStorage键名不变
   - ✅ 业务逻辑完全一致

## 具体模块迁移建议

### BOM模块（物料清单）

**复杂度**: ⭐⭐⭐⭐⭐（高）
**预计时间**: 2-3天

**特殊考虑**：
- BOM有复杂的多层结构（父级子级关系）
- 需要处理BOM明细、工序领料等关联数据
- 可能有复杂的业务逻辑（版本控制、审批流程）

**迁移策略**：
1. 先迁移BOM主表的CRUD
2. 然后处理BOM明细的数据结构
3. 最后处理复杂的业务逻辑

### Operation模块（工序主数据）

**复杂度**: ⭐⭐⭐（中）
**预计时间**: 1-2天

**特殊考虑**：
- 工序可能包含复杂的参数配置
- 可能有工序图示或工艺流程

**迁移策略**：
- 先处理基础的CRUD
- 然后处理工序参数配置
- 最后处理图示和流程

### Equipment模块（设备档案）

**复杂度**: ⭐⭐⭐⭐（中高）
**预计时间**: 2天

**特殊考虑**：
- 设备信息可能很复杂（规格、参数、维护记录等）
- 可能有设备分类、台账管理

**迁移策略**：
- 先迁移设备主表
- 然后处理设备参数
- 最后处理维护记录等关联数据

### WorkCenter模块（工作中心）

**复杂度**: ⭐⭐⭐（中）
**预计时间**: 1天

**特殊考虑**：
- 工作中心可能包含设备和工序关联
- 可能有产能参数等

### Team模块（班组档案）

**复杂度**: ⭐⭐（低中）
**预计时间**: 1天

**特殊考虑**：
- 班组信息相对简单
- 可能包含人员关联

### Employee模块（员工档案）

**复杂度**: ⭐⭐⭐⭐（中高）
**预计时间**: 2天

**特殊考虑**：
- 员工信息很复杂（基本信息、技能、证书、考勤等）
- 可能包含复杂的UI组件（详情抽屉、表单）

### QcItem和QcScheme模块

**复杂度**: ⭐⭐⭐（中）
**预计时间**: 1-2天

**特殊考虑**：
- 质检项目和方案可能有复杂的层级关系
- 可能包含检验规则配置

### Workshop模块（车间档案）

**复杂度**: ⭐⭐⭐（中）
**预计时间**: 1天

**特殊考虑**：
- 车间档案信息相对简单
- 可能包含设备、工序等关联数据

## 迁移检查清单

每个模块迁移完成后，确保：

- [ ] 类型定义完整且准确
- [ ] API服务功能完整
- [ ] Zustand store功能完整
- [ ] 页面组件功能完整
- [ ] 所有功能正常工作
- [ ] UI/UX与现有页面完全一致
- [ ] 没有编译错误
- [ ] 没有运行时错误
- [ ] 通过所有功能测试
- [ ] 代码符合最佳实践

## 常见问题和解决方案

### 问题1: 复杂数据结构处理

**解决方案**: 将复杂数据拆分为多个接口和API服务，分步骤实现。

### 问题2: 业务逻辑复杂

**解决方案**: 先实现基础CRUD，然后逐步添加业务逻辑，充分测试每一步。

### 问题3: UI组件复杂

**解决方案**: 先用通用组件实现基础功能，然后逐步添加自定义组件和样式。

### 问题4: 状态管理复杂

**解决方案**: 将相关状态拆分为多个store，或者使用子store模式。

## 下一步行动

按照复杂度从低到高的顺序继续迁移：

1. **WorkCenter模块** (1天)
2. **Team模块** (1天)
3. **Workshop模块** (1天)
4. **QcItem模块** (1-2天)
5. **QcScheme模块** (1-2天)
6. **Operation模块** (1-2天)
7. **Equipment模块** (2天)
8. **Employee模块** (2天)
9. **BOM模块** (2-3天)

每个模块迁移完成后，立即进行充分测试，确保功能正常、UI一致。

---

**总结**: 通过Material和Unit两个模块的完整实现，我们建立了清晰的模块迁移模式。按照这个模式，其他模块的迁移将更加高效和可靠。

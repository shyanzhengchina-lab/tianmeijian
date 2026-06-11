# useBatchOperations Hook 使用指南

## 概述

`useBatchOperations` 是一个通用的批量操作Hook，旨在消除重复的批量操作代码。它提供了统一的接口来处理确认对话框、加载状态、错误处理和成功提示等功能。

## 特性

- ✅ **类型安全**: 完整的TypeScript支持，泛型类型推断
- ✅ **确认对话框**: 内置的确认对话框支持
- ✅ **加载状态**: 自动管理各操作的加载状态
- ✅ **错误处理**: 统一的错误处理和用户提示
- ✅ **消息模板**: 支持变量替换的消息模板
- ✅ **灵活配置**: 高度可配置的选项
- ✅ **自定义操作**: 支持自定义批量操作
- ✅ **国际化**: 内置国际化支持
- ✅ **回调函数**: 成功/失败回调支持

## 安装和设置

Hook已经创建在项目核心位置，无需额外安装：

```typescript
// 核心Hook
import { useBatchOperations } from '@/shared/hooks/useBatchOperations';

// 类型定义
import type {
  UseBatchOperationsParams,
  BatchOperationsReturn,
  BatchOperationConfig,
} from '@/shared/hooks/useBatchOperations.types';
```

## 基础用法

### 1. 直接使用核心Hook

```typescript
import { useBatchOperations } from '@/shared/hooks/useBatchOperations';
import { useMaterialStore } from '@/modules/basic-data/material/store/materialStore';

function MaterialList() {
  const store = useMaterialStore();

  const batchOps = useBatchOperations({
    items: store.materials,
    selectedIds: store.selectedIds,
    onSelectionChange: store.setSelectedIds,
    operations: {
      delete: store.batchDeleteMaterials,
      enable: store.batchEnableMaterials,
      disable: store.batchDisableMaterials,
    },
    confirmations: {
      delete: '您确定要删除选中的 {count} 个物料吗？此操作不可恢复！',
      enable: '您确定要启用选中的 {count} 个物料吗？',
      disable: '您确定要禁用选中的 {count} 个物料吗？禁用后这些物料将无法使用。',
    },
  });

  return (
    <div>
      <ActionBar
        batchActions={[
          {
            key: 'enable',
            label: '批量启用',
            onClick: batchOps.handleBatchEnable,
            disabled: !batchOps.canExecuteOperations,
          },
          {
            key: 'disable',
            label: '批量禁用',
            onClick: batchOps.handleBatchDisable,
            disabled: !batchOps.canExecuteOperations,
          },
          {
            key: 'delete',
            label: '批量删除',
            onClick: batchOps.handleBatchDelete,
            danger: true,
            disabled: !batchOps.canExecuteOperations,
          },
        ]}
      />

      <DataTable
        data={store.materials}
        rowKey="id"
        columns={columns}
        rowSelection={batchOps.rowSelection}
      />
    </div>
  );
}
```

### 2. 使用模块专用Hook

每个模块都有预配置的便捷Hook：

```typescript
import { useMaterialBatchOperations } from '@/modules/basic-data/material/hooks/useMaterialBatchOperations';

function MaterialList() {
  const batchOps = useMaterialBatchOperations();

  return (
    <div>
      <ActionBar
        selectedCount={batchOps.selectedCount}
        batchActions={[
          {
            key: 'enable',
            label: '批量启用',
            onClick: batchOps.handleBatchEnable,
            disabled: !batchOps.canExecuteOperations,
            loading: batchOps.loading.enable,
          },
          {
            key: 'disable',
            label: '批量禁用',
            onClick: batchOps.handleBatchDisable,
            disabled: !batchOps.canExecuteOperations,
            loading: batchOps.loading.disable,
          },
          {
            key: 'delete',
            label: '批量删除',
            onClick: batchOps.handleBatchDelete,
            danger: true,
            disabled: !batchOps.canExecuteOperations,
            loading: batchOps.loading.delete,
          },
        ]}
      />

      <DataTable
        data={batchOps.items}
        rowKey="id"
        columns={columns}
        rowSelection={batchOps.rowSelection}
      />
    </div>
  );
}
```

## API参考

### UseBatchOperationsParams

Hook的输入参数接口。

```typescript
interface UseBatchOperationsParams<T extends { id: string }> {
  /** 数据列表 */
  items: T[];
  /** 选中的ID列表 */
  selectedIds: string[];
  /** 选择变化回调 */
  onSelectionChange: (ids: string[]) => void;
  /** 批量操作配置 */
  operations: {
    /** 批量删除 */
    delete: (ids: string[]) => Promise<void>;
    /** 批量启用（可选） */
    enable?: (ids: string[]) => Promise<void>;
    /** 批量禁用（可选） */
    disable?: (ids: string[]) => Promise<void>;
    /** 批量激活（可选） */
    activate?: (ids: string[]) => Promise<void>;
    /** 批量停用（可选） */
    deactivate?: (ids: string[]) => Promise<void>;
    /** 自定义操作 */
    custom?: { [key: string]: (ids: string[]) => Promise<void> };
  };
  /** 确认消息配置 */
  confirmations?: {
    delete?: string;
    enable?: string;
    disable?: string;
    activate?: string;
    deactivate?: string;
    [key: string]: string | undefined;
  };
  /** 操作成功回调 */
  onSuccess?: (message: string) => void;
  /** 操作失败回调 */
  onError?: (error: Error) => void;
  /** 是否在操作成功后清除选择（默认true） */
  clearSelectionOnSuccess?: boolean;
  /** 是否显示确认对话框（默认true） */
  showConfirmDialog?: boolean;
  /** 模态框配置 */
  modalConfig?: Partial<ModalProps>;
  /** 国际化消息映射 */
  i18n?: {
    defaultConfirmation: string;
    defaultSuccessMessage: string;
    defaultErrorMessage: string;
  };
}
```

### BatchOperationsReturn

Hook的返回值接口。

```typescript
interface BatchOperationsReturn {
  /** 行选择处理函数 */
  handleRowSelection: (selectedRowKeys: React.Key[]) => void;
  /** 行选择配置对象 */
  rowSelection: {
    selectedRowKeys: string[];
    onChange: (selectedRowKeys: React.Key[]) => void;
  };
  /** 批量删除处理函数 */
  handleBatchDelete: () => Promise<void>;
  /** 批量启用处理函数 */
  handleBatchEnable?: () => Promise<void>;
  /** 批量禁用处理函数 */
  handleBatchDisable?: () => Promise<void>;
  /** 批量激活处理函数 */
  handleBatchActivate?: () => Promise<void>;
  /** 批量停用处理函数 */
  handleBatchDeactivate?: () => Promise<void>;
  /** 自定义操作列表 */
  customOperations: Array<{
    key: string;
    handler: () => Promise<void>;
  }>;
  /** 操作状态对象 */
  loading: {
    delete: boolean;
    enable?: boolean;
    disable?: boolean;
    activate?: boolean;
    deactivate?: boolean;
    [key: string]: boolean | undefined;
  };
  /** 选中项数量 */
  selectedCount: number;
  /** 是否可以执行批量操作 */
  canExecuteOperations: boolean;
  /** 重置选中项 */
  clearSelection: () => void;
  /** 执行自定义操作 */
  executeCustomOperation: (operationKey: string, operation: (ids: string[]) => Promise<void>, confirmation?: string) => Promise<void>;
}
```

## 高级用法

### 1. 自定义操作

```typescript
const batchOps = useBatchOperations({
  items: store.items,
  selectedIds: store.selectedIds,
  onSelectionChange: store.setSelectedIds,
  operations: {
    delete: store.deleteItems,
    custom: {
      archive: (ids) => store.archiveItems(ids),
      export: (ids) => store.exportItems(ids),
      assignToUser: (ids) => store.assignItemsToUser(ids, userId),
    },
  },
  confirmations: {
    archive: '您确定要归档选中的 {count} 个项目吗？',
    export: '导出 {count} 个项目？',
    assignToUser: '分配 {count} 个项目给用户？',
  },
});

// 使用自定义操作
return (
  <div>
    <ActionBar
      batchActions={[
        ...batchOps.customOperations.map(op => ({
          key: op.key,
          label: getOperationLabel(op.key),
          onClick: op.handler,
          disabled: !batchOps.canExecuteOperations,
        })),
      ]}
    />
  </div>
);
```

### 2. 错误处理

```typescript
const batchOps = useBatchOperations({
  items: store.items,
  selectedIds: store.selectedIds,
  onSelectionChange: store.setSelectedIds,
  operations: {
    delete: store.deleteItems,
  },
  onError: (error) => {
    console.error('批量操作失败:', error);
    // 可以在这里添加额外的错误处理逻辑
    // 比如错误日志记录、错误上报等
  },
});
```

### 3. 成功回调

```typescript
const batchOps = useBatchOperations({
  items: store.items,
  selectedIds: store.selectedIds,
  onSelectionChange: store.setSelectedIds,
  operations: {
    delete: store.deleteItems,
  },
  onSuccess: (message) => {
    console.log('操作成功:', message);
    // 可以在这里添加额外的成功处理逻辑
    // 比如数据刷新、统计更新等
    store.loadStatistics();
  },
});
```

### 4. 禁用确认对话框

```typescript
const batchOps = useBatchOperations({
  items: store.items,
  selectedIds: store.selectedIds,
  onSelectionChange: store.setSelectedIds,
  operations: {
    delete: store.deleteItems,
  },
  showConfirmDialog: false, // 禁用确认对话框
});
```

### 5. 自定义模态框配置

```typescript
const batchOps = useBatchOperations({
  items: store.items,
  selectedIds: store.selectedIds,
  onSelectionChange: store.setSelectedIds,
  operations: {
    delete: store.deleteItems,
  },
  modalConfig: {
    width: 600,
    centered: false,
    maskClosable: true,
    okText: '确认删除',
    cancelText: '再想想',
  },
});
```

### 6. 国际化

```typescript
const batchOps = useBatchOperations({
  items: store.items,
  selectedIds: store.selectedIds,
  onSelectionChange: store.setSelectedIds,
  operations: {
    delete: store.deleteItems,
  },
  i18n: {
    defaultConfirmation: 'Are you sure you want to {count} items?',
    defaultSuccessMessage: 'Successfully processed {count} items',
    defaultErrorMessage: 'Batch operation failed',
  },
  confirmations: {
    delete: 'Delete {count} items? This cannot be undone!',
  },
});
```

### 7. 不清除选择

```typescript
const batchOps = useBatchOperations({
  items: store.items,
  selectedIds: store.selectedIds,
  onSelectionChange: store.setSelectedIds,
  operations: {
    delete: store.deleteItems,
  },
  clearSelectionOnSuccess: false, // 操作成功后不清除选择
});
```

## 消息模板

Hook支持使用变量替换的消息模板。支持的变量：

- `{count}` - 选中项目的数量
- `{operation}` - 操作类型
- `{error}` - 错误消息

```typescript
confirmations: {
  delete: '您确定要删除选中的 {count} 个物料吗？此操作不可恢复！',
  enable: '准备启用 {count} 个物料',
  disable: '禁用后这 {count} 个物料将无法使用。',
  custom: '执行 {operation} 操作，共 {count} 个项目',
}
```

## 模块专用Hook列表

每个基础数据模块都有预配置的便捷Hook：

1. **物料模块**
   ```typescript
   import { useMaterialBatchOperations } from '@/modules/basic-data/material/hooks/useMaterialBatchOperations';
   ```

2. **计量单位模块**
   ```typescript
   import { useUnitBatchOperations } from '@/modules/basic-data/unit/hooks/useUnitBatchOperations';
   ```

3. **员工模块**
   ```typescript
   import { useEmployeeBatchOperations } from '@/modules/basic-data/employee/hooks/useEmployeeBatchOperations';
   ```

4. **工作中心模块**
   ```typescript
   import { useWorkCenterBatchOperations } from '@/modules/basic-data/workcenter/hooks/useWorkCenterBatchOperations';
   ```

5. **车间模块**
   ```typescript
   import { useWorkshopBatchOperations } from '@/modules/basic-data/workshop/hooks/useWorkshopBatchOperations';
   ```

6. **设备模块**
   ```typescript
   import { useEquipmentBatchOperations } from '@/modules/basic-data/equipment/hooks/useEquipmentBatchOperations';
   ```

7. **班组模块**
   ```typescript
   import { useTeamBatchOperations } from '@/modules/basic-data/team/hooks/useTeamBatchOperations';
   ```

8. **工序模块**
   ```typescript
   import { useOperationBatchOperations } from '@/modules/basic-data/operation/hooks/useOperationBatchOperations';
   ```

9. **BOM模块**
   ```typescript
   import { useBomBatchOperations } from '@/modules/basic-data/bom/hooks/useBomBatchOperations';
   ```

10. **质检方案模块**
    ```typescript
    import { useQcSchemeBatchOperations } from '@/modules/basic-data/qc-scheme/hooks/useQcSchemeBatchOperations';
    ```

11. **质检项目模块**
    ```typescript
    import { useQcItemBatchOperations } from '@/modules/basic-data/qc-item/hooks/useQcItemBatchOperations';
    ```

## 迁移指南

### 迁移前（原有代码）

```typescript
const handleBatchDelete = useCallback(async () => {
  if (selectedIds.length === 0) {
    message.warning('请先选择要删除的物料');
    return;
  }

  Modal.confirm({
    title: '确认批量删除',
    content: `您确定要删除选中的 ${selectedIds.length} 个物料吗？此操作不可恢复！`,
    okText: '确定删除',
    okType: 'danger',
    cancelText: '取消',
    centered: true,
    onOk: async () => {
      try {
        await batchDeleteMaterials(selectedIds);
        message.success(`成功删除 ${selectedIds.length} 个物料`);
        setSelectedIds([]);
      } catch (error) {
        message.error('批量删除失败');
      }
    },
  });
}, [selectedIds, batchDeleteMaterials, setSelectedIds]);

const handleBatchEnable = useCallback(async () => {
  if (selectedIds.length === 0) {
    message.warning('请先选择要启用的物料');
    return;
  }

  Modal.confirm({
    title: '确认批量启用',
    content: `您确定要启用选中的 ${selectedIds.length} 个物料吗？`,
    okText: '确定启用',
    cancelText: '取消',
    centered: true,
    onOk: async () => {
      try {
        await batchEnableMaterials(selectedIds);
        message.success(`成功启用 ${selectedIds.length} 个物料`);
        setSelectedIds([]);
      } catch (error) {
        message.error('批量启用失败');
      }
    },
  });
}, [selectedIds, batchEnableMaterials, setSelectedIds]);

const handleBatchDisable = useCallback(async () => {
  if (selectedIds.length === 0) {
    message.warning('请先选择要禁用的物料');
    return;
  }

  Modal.confirm({
    title: '确认批量禁用',
    content: `您确定要禁用选中的 ${selectedIds.length} 个物料吗？禁用后这些物料将无法使用。`,
    okText: '确定禁用',
    okType: 'danger',
    cancelText: '取消',
    centered: true,
    onOk: async () => {
      try {
        await batchDisableMaterials(selectedIds);
        message.success(`成功禁用 ${selectedIds.length} 个物料`);
        setSelectedIds([]);
      } catch (error) {
        message.error('批量禁用失败');
      }
    },
  });
}, [selectedIds, batchDisableMaterials, setSelectedIds]);
```

### 迁移后（使用Hook）

```typescript
const batchOps = useMaterialBatchOperations();
```

**代码减少**: ~130行 → 1行（减少99%）

## 最佳实践

### 1. 使用模块专用Hook

对于标准的基础数据模块，优先使用模块专用的Hook：

```typescript
// 推荐
const batchOps = useMaterialBatchOperations();

// 不推荐（除非需要特殊配置）
const batchOps = useBatchOperations({
  // ... 20+ 行配置
});
```

### 2. 提供清晰的确认消息

```typescript
confirmations: {
  delete: '删除操作不可恢复，确定要删除选中的 {count} 个项目吗？',
  enable: '启用后这些项目将变为可用状态，确定继续？',
  disable: '禁用后这些项目将无法使用，确定继续？',
}
```

### 3. 合理使用loading状态

```typescript
<ActionBar
  batchActions={[
    {
      key: 'delete',
      label: '批量删除',
      onClick: batchOps.handleBatchDelete,
      disabled: !batchOps.canExecuteOperations,
      loading: batchOps.loading.delete,
    },
  ]}
/>
```

### 4. 处理操作成功后的逻辑

```typescript
const batchOps = useBatchOperations({
  items: store.items,
  selectedIds: store.selectedIds,
  onSelectionChange: store.setSelectedIds,
  operations: {
    delete: store.deleteItems,
  },
  onSuccess: () => {
    // 刷新统计数据
    store.loadStatistics();
    // 重新加载数据
    store.loadItems();
  },
});
```

### 5. 错误处理和日志记录

```typescript
const batchOps = useBatchOperations({
  items: store.items,
  selectedIds: store.selectedIds,
  onSelectionChange: store.setSelectedIds,
  operations: {
    delete: store.deleteItems,
  },
  onError: (error) => {
    // 记录错误到日志系统
    logError('batch_operation_failed', error);
    // 上报错误到监控系统
    reportError(error);
  },
});
```

## 测试

Hook包含完整的单元测试，覆盖以下场景：

- ✅ 基础功能测试
- ✅ 批量删除操作
- ✅ 批量启用/禁用操作
- ✅ 自定义操作
- ✅ 加载状态管理
- ✅ 选择状态管理
- ✅ 错误处理
- ✅ 确认对话框
- ✅ 消息格式化
- ✅ 回调函数
- ✅ 边界情况

运行测试：

```bash
# 运行所有测试
npm test

# 运行特定测试文件
npm test useBatchOperations.test.ts

# 运行测试并生成覆盖率报告
npm test -- --coverage
```

## 故障排除

### 问题1: 操作没有执行

**可能原因**:
- 没有选中任何项目
- 操作函数未正确定义

**解决方案**:
```typescript
// 检查是否有选中项
if (!batchOps.canExecuteOperations) {
  message.warning('请先选择要操作的项目');
  return;
}

// 检查操作函数是否存在
if (!batchOps.handleBatchEnable) {
  console.error('Enable operation not available');
}
```

### 问题2: 加载状态不正确

**可能原因**:
- 操作函数返回的不是Promise
- 操作函数没有正确处理错误

**解决方案**:
```typescript
// 确保操作函数返回Promise
operations: {
  delete: async (ids) => {
    await api.deleteItems(ids);
  },
}

// 正确处理错误
operations: {
  delete: async (ids) => {
    try {
      await api.deleteItems(ids);
    } catch (error) {
      throw new Error('Delete failed'); // 重新抛出错误
    }
  },
}
```

### 问题3: 确认对话框不显示

**可能原因**:
- `showConfirmDialog` 设置为 `false`

**解决方案**:
```typescript
const batchOps = useBatchOperations({
  items: store.items,
  selectedIds: store.selectedIds,
  onSelectionChange: store.setSelectedIds,
  operations: {
    delete: store.deleteItems,
  },
  showConfirmDialog: true, // 确保设置为true
});
```

## 性能优化

### 1. 使用useCallback避免重复创建

```typescript
const batchOps = useBatchOperations({
  items: store.materials,
  selectedIds: store.selectedIds,
  onSelectionChange: store.setSelectedIds,
  operations: {
    delete: store.batchDeleteMaterials,
  },
  // operations对象是稳定的，不会导致Hook重新创建
});
```

### 2. 避免在渲染中创建新对象

```typescript
// 错误：每次渲染都创建新对象
<ActionBar
  batchActions={[
    { key: 'delete', label: '删除', onClick: batchOps.handleBatchDelete },
  ]}
/>

// 正确：使用useMemo
const batchActions = useMemo(() => [
  { key: 'delete', label: '删除', onClick: batchOps.handleBatchDelete },
], [batchOps.handleBatchDelete]);

<ActionBar batchActions={batchActions} />
```

## 总结

`useBatchOperations` Hook 提供了一个强大、灵活且类型安全的解决方案，用于处理批量操作。通过消除重复代码和提供统一的接口，它显著提高了代码质量和开发效率。

**主要优势**:
- 代码减少: ~99%（从~130行到1行）
- 一致性: 所有模块使用相同的模式
- 可维护性: 集中管理批量操作逻辑
- 可测试性: 完整的单元测试覆盖
- 类型安全: 完整的TypeScript支持
- 灵活性: 高度可配置的选项

**适用场景**:
- ✅ 需要批量操作的表格/列表页面
- ✅ 需要确认对话框的操作
- ✅ 需要加载状态管理的操作
- ✅ 需要统一错误处理的操作
- ✅ 需要自定义操作的场景

通过使用这个Hook，开发者可以专注于业务逻辑，而不是重复的基础设施代码。
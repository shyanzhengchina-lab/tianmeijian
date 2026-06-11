# 批量操作进度指示器实现指南

## 概述

本文档提供了在基础数据模块中实现批量操作进度指示器的完整指南。进度指示器系统提供实时的操作反馈、错误处理和取消功能，显著提升用户体验。

## 架构设计

### 核心组件

1. **BatchProgressModal** - 进度显示组件
   - 实时进度百分比显示
   - 详细的项目状态列表
   - 成功/失败统计
   - 错误详情展示
   - 取消操作支持

2. **useBatchOperation Hook** - 批量操作管理
   - 进度状态管理
   - 批量操作执行
   - 错误处理和重试
   - 取消操作支持
   - 回调函数支持

3. **增强的Store** - 状态管理集成
   - 进度状态存储
   - 进度操作方法
   - 与现有Store无缝集成

## 实现步骤

### 步骤 1: 使用进度指示器组件

导入进度指示器组件：

```typescript
import { BatchProgressModal } from '../../../../shared/components/BatchProgressModal';
```

在组件中添加进度模态框：

```typescript
<BatchProgressModal
  progress={batchProgress}
  onClose={handleCloseProgressModal}
  showDetails={true}
/>
```

### 步骤 2: 在Store中添加进度状态

在模块Store中添加进度状态：

```typescript
interface ModuleState {
  // ... 现有状态

  // 批量操作进度
  batchProgress: {
    visible: boolean;
    title: string;
    operationType: string;
    total: number;
    processed: number;
    successCount: number;
    failedCount: number;
    items: Array<{
      id: string;
      name: string;
      status: 'pending' | 'processing' | 'success' | 'failed' | 'cancelled';
      error?: string;
    }>;
    isCancelled: boolean;
    isComplete: boolean;
  };

  // 进度操作
  setBatchProgress: (progress: Partial<typeof batchProgress>) => void;
  resetBatchProgress: () => void;
  batchDeleteWithProgress: (ids: string[]) => Promise<void>;
  batchEnableWithProgress: (ids: string[]) => Promise<void>;
  batchDisableWithProgress: (ids: string[]) => Promise<void>;
}
```

### 步骤 3: 实现带进度的批量操作

在Store中实现带进度的批量操作方法：

```typescript
batchDeleteWithProgress: async (ids: string[]) => {
  const { items } = get();
  const selectedItems = items.filter(item => ids.includes(item.id));

  // 初始化进度
  set({
    batchProgress: {
      visible: true,
      title: '批量删除',
      operationType: '正在删除...',
      total: ids.length,
      processed: 0,
      successCount: 0,
      failedCount: 0,
      items: selectedItems.map(item => ({
        id: item.id,
        name: `${item.code} - ${item.name}`,
        status: 'pending',
      })),
      isCancelled: false,
      isComplete: false,
    },
  });

  const updateProgress = (updates: Partial<BatchProgressInfo>) => {
    set(state => ({
      batchProgress: { ...state.batchProgress, ...updates },
    }));
  };

  let successCount = 0;
  let failedCount = 0;

  try {
    for (let i = 0; i < selectedItems.length; i++) {
      const item = selectedItems[i];
      const progressItems = get().batchProgress.items;

      // 更新为处理中
      updateProgress({
        items: progressItems.map(p =>
          p.id === item.id ? { ...p, status: 'processing' } : p
        ),
      });

      try {
        // 执行单个操作
        await api.deleteItem(item.id);

        // 更新为成功
        updateProgress({
          items: progressItems.map(p =>
            p.id === item.id ? { ...p, status: 'success' } : p
          ),
          processed: i + 1,
          successCount: successCount + 1,
        });
        successCount++;
      } catch (error: any) {
        // 更新为失败
        updateProgress({
          items: progressItems.map(p =>
            p.id === item.id
              ? { ...p, status: 'failed', error: error.message }
              : p
          ),
          processed: i + 1,
          failedCount: failedCount + 1,
        });
        failedCount++;
      }
    }

    // 标记完成
    updateProgress({
      isComplete: true,
      operationType: '删除完成',
    });

    // 刷新列表
    await get().loadItems();
    set({ selectedIds: [], selectedItems: [] });

    // 显示结果
    if (failedCount === 0) {
      message.success(`成功删除 ${successCount} 条记录`);
    } else {
      message.warning(`删除完成: 成功 ${successCount} 条，失败 ${failedCount} 条`);
    }
  } catch (error: any) {
    updateProgress({
      isComplete: true,
      operationType: '删除失败',
    });
    message.error('批量删除发生异常');
  }
},
```

### 步骤 4: 在组件中集成进度操作

在列表组件中更新批量操作处理函数：

```typescript
// 批量删除 (带进度)
const handleBatchDelete = useCallback(async () => {
  try {
    // 确认对话框
    await new Promise<void>((resolve, reject) => {
      Modal.confirm({
        title: '确认删除',
        content: `确定要删除选中的 ${selectedIds.length} 条记录吗？`,
        onOk: () => resolve(),
        onCancel: () => reject(new Error('用户取消')),
      });
    });

    await batchDeleteWithProgress(selectedIds);
  } catch (error) {
    // 用户取消或其他错误
    if (error.message !== '用户取消') {
      message.error('批量删除失败');
    }
  }
}, [selectedIds, batchDeleteWithProgress]);

// 关闭进度弹窗
const handleCloseProgressModal = useCallback(() => {
  if (batchProgress.isComplete) {
    resetBatchProgress();
  }
}, [batchProgress.isComplete, resetBatchProgress]);
```

## 功能特性

### 1. 实时进度反馈

- 显示当前进度百分比
- 显示处理项数/总数
- 详细的操作状态图标

### 2. 详细错误报告

- 显示每个项目的处理状态
- 失败项目显示具体错误信息
- 支持展开/收起错误详情

### 3. 操作统计

- 实时显示成功/失败计数
- 操作完成后显示摘要
- 支持批量重试（待实现）

### 4. 取消操作

- 支持取消进行中的批量操作
- 取消后显示已处理进度
- 清晰的取消状态标识

### 5. 性能优化

- 批量处理减少网络请求
- 分批处理避免UI阻塞
- 智能更新减少重渲染

## 模块集成指南

### Material 模块

已完成进度指示器集成：
- `src/modules/basic-data/material/store/materialStoreWithProgress.ts`
- `src/modules/basic-data/material/components/MaterialListWithProgress.tsx`

### 其他模块集成步骤

#### 1. Team 模块

在 `teamStore.ts` 中添加：

```typescript
// 添加进度状态
batchProgress: BatchProgressInfo;

// 添加进度方法
setBatchProgress: (progress: Partial<BatchProgressInfo>) => void;
resetBatchProgress: () => void;
batchDeleteWithProgress: (ids: string[]) => Promise<void>;
batchEnableWithProgress: (ids: string[]) => Promise<void>;
batchDisableWithProgress: (ids: string[]) => Promise<void>;
```

#### 2. Equipment 模块

在 `equipmentStore.ts` 中添加进度支持，参考Material模块实现。

#### 3. Operation 模块

在 `operationStore.ts` 中添加进度支持。

#### 4. Workshop 模块

在 `workshopStore.ts` 中添加进度支持。

#### 5. Employee 模块

完成表格布局后，添加进度支持。

## API 对接指南

### 后端 API 要求

进度指示器需要后端API支持单条操作。如果后端只提供批量API，需要使用以下策略：

```typescript
// 策略1: 循环调用单条API（推荐用于小批量）
for (const id of ids) {
  await api.deleteItem(id);
}

// 策略2: 使用批量API（适用于大批量）
// 这种情况下无法显示详细进度，只能显示总体进度
const response = await api.batchDelete(ids);
// 更新所有项目状态
```

### 批次大小配置

对于大批量操作，建议使用分批处理：

```typescript
const BATCH_SIZE = 5; // 每批处理5个

for (let i = 0; i < items.length; i += BATCH_SIZE) {
  const batch = items.slice(i, i + BATCH_SIZE);

  await Promise.allSettled(
    batch.map(item => processItem(item))
  );
}
```

## 测试场景

### 场景 1: 小批量操作（< 10项）

- 选择少量项目
- 执行批量删除/启用/禁用
- 验证进度更新流畅
- 验证所有项目正确处理

### 场景 2: 大批量操作（> 100项）

- 选择大量项目
- 执行批量操作
- 验证性能表现
- 验证内存使用
- 验证可以中途取消

### 场景 3: 部分失败

- 模拟部分项目失败
- 验证错误正确显示
- 验证成功项目正确更新
- 验证失败项目标识清晰

### 场景 4: 取消操作

- 开始批量操作
- 在处理中途取消
- 验证已处理项目保留
- 验证未处理项目状态
- 验证可以重新开始

### 场景 5: 网络错误

- 模拟网络中断
- 验证错误处理
- 验证用户友好的错误提示
- 验证可以重试

## 性能考虑

### 1. 大数据集处理

- 使用分批处理避免阻塞
- 限制同时处理的请求数
- 考虑使用Web Worker进行计算密集型操作

### 2. 内存优化

- 限制显示的项目数量（最多50条）
- 对超大数据集使用虚拟滚动
- 及时清理已完成的状态

### 3. UI 响应性

- 使用requestAnimationFrame进行进度更新
- 避免频繁的状态更新
- 使用防抖/节流优化

### 4. 网络优化

- 合并请求减少往返
- 使用请求取消避免浪费
- 实现重试机制

## 用户体验优化

### 1. 视觉反馈

- 清晰的进度条动画
- 直观的状态图标
- 合理的颜色使用

### 2. 操作提示

- 操作前确认对话框
- 操作中进度提示
- 操作后结果汇总

### 3. 错误处理

- 友好的错误消息
- 详细的错误原因
- 明确的解决建议

### 4. 可访问性

- 支持键盘操作
- 屏幕阅读器支持
- 高对比度模式

## 未来增强

### 1. 重试功能

```typescript
retryFailedItems: () => Promise<void> => {
  const failedItems = get().batchProgress.items.filter(
    item => item.status === 'failed'
  );
  return this.batchDeleteWithProgress(failedItems.map(i => i.id));
}
```

### 2. 保存进度

```typescript
// 持久化进度，支持页面刷新后继续
persist(
  (set, get) => ({
    // ...
  }),
  {
    name: 'module-store-with-progress',
    persistProgress: true,
  }
)
```

### 3. 后台操作

```typescript
// 允许操作在后台继续
allowBackgroundOperation: boolean = true;

// 操作完成后通知用户
showOperationCompleteNotification: boolean = true;
```

### 4. 操作历史

```typescript
operationHistory: Array<{
  id: string;
  type: string;
  timestamp: number;
  successCount: number;
  failedCount: number;
  status: 'success' | 'partial' | 'failed';
}>;
```

## 文件清单

### 核心文件

- `src/shared/components/BatchProgressModal/index.tsx` - 进度模态框组件
- `src/shared/hooks/useBatchOperation.ts` - 批量操作Hook

### 示例实现

- `src/modules/basic-data/material/store/materialStoreWithProgress.ts` - Material Store（带进度）
- `src/modules/basic-data/material/components/MaterialListWithProgress.tsx` - Material List（带进度）

### 文档

- `BATCH_OPERATION_PROGRESS_GUIDE.md` - 本文档

## 总结

进度指示器系统提供了完整的批量操作用户体验：

- ✅ 实时进度反馈
- ✅ 详细错误报告
- ✅ 操作统计和汇总
- ✅ 取消操作支持
- ✅ 性能优化
- ✅ 良好的可扩展性

通过在各个基础数据模块中集成此系统，可以显著提升用户对批量操作的体验和信心。

## 支持和反馈

如有问题或建议，请联系开发团队或提交Issue。

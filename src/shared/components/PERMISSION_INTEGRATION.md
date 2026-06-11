# 权限系统集成指南

## 概述

本文档说明如何在组件中使用 `usePermission` hook 进行权限控制，确保用户只能执行其有权限的操作。

## usePermission Hook

`usePermission` hook 基于 `rbacStore` 提供了完整的权限检查功能。

### 基本用法

```typescript
import { usePermission } from '@/shared/hooks/usePermission';

function MyComponent() {
  const {
    canView,      // 查看权限
    canCreate,   // 创建权限
    canUpdate,   // 更新权限
    canDelete,   // 删除权限
    canAudit,    // 审核权限
    canEnable,    // 启用权限
    canDisable,   // 禁用权限
    canPrint,     // 打印权限
    dataScope,    // 数据范围
    maxDataScope, // 最大数据范围
  } = usePermission();

  return (
    <div>
      {/* 根据权限控制操作 */}
      {canView && <Button>查看</Button>}
      {canCreate && <Button>新建</Button>}
      {canUpdate && <Button>编辑</Button>}
      {canDelete && <Button>删除</Button>}
    </div>
  );
}
```

### 高级用法：自定义权限检查

```typescript
const { hasPermission } = usePermission();

// 自定义权限检查
const canCustomOperation = hasPermission('material', 'customOperation');

// 组合权限检查
const canAnyOperation = canCreate || canUpdate || canDelete;
```

## 在共享组件中集成权限

### 1. ActionBar 组件

```typescript
import { usePermission } from '@/shared/hooks/usePermission';
import { ActionBar, ActionItem } from '@/shared/components/ActionBar';

function MaterialList() {
  const { canCreate, canDelete } = usePermission('material');

  const actionBarActions: ActionItem[] = [
    {
      key: 'create',
      label: '新建物料',
      icon: <PlusOutlined />,
      onClick: handleCreate,
      disabled: !canCreate, // 根据权限禁用
      requirePermission: 'material.create', // 显示所需权限
    },
    {
      key: 'delete',
      label: '删除',
      icon: <DeleteOutlined />,
      onClick: handleDelete,
      disabled: !canDelete,
      danger: true,
      requirePermission: 'material.delete',
    },
  ];

  return <ActionBar title="物料管理" actions={actionBarActions} />;
}
```

### 2. DataTable 组件集成

```typescript
import { DataTable } from '@/shared/components/DataTable';

function MaterialList() {
  const { canView } = usePermission('material');

  // 权限不足时显示提示
  if (!canView) {
    return <div>您没有查看物料的权限</div>;
  }

  return <DataTable data={materials} />;
}
```

### 3. 批量操作权限控制

```typescript
function MaterialList() {
  const { canDelete } = usePermission('material');

  const handleBatchDelete = () => {
    if (!canDelete) {
      message.warning('您没有删除物料的权限');
      return;
    }
    // 执行删除操作
    batchDelete(selectedIds);
  };

  return <Button onClick={handleBatchDelete}>批量删除</Button>;
}
```

### 4. 表单操作权限控制

```typescript
function MaterialForm({ mode, onSubmit }) {
  const { canCreate, canUpdate } = usePermission('material');

  const handleSubmit = (values) => {
    if (mode === 'create' && !canCreate) {
      message.warning('您没有创建物料的权限');
      return;
    }
    if (mode === 'update' && !canUpdate) {
      message.warning('您没有编辑物料的权限');
      return;
    }
    onSubmit(values);
  };

  return <Form onSubmit={handleSubmit} />;
}
```

### 5. 详情页面权限控制

```typescript
function MaterialDetail({ materialId }) {
  const { canView, canEdit, canDelete } = usePermission('material');

  if (!canView) {
    return <div>您没有查看物料详情的权限</div>;
  }

  return (
    <div>
      <Button onClick={() => setShowEdit(true)} disabled={!canEdit}>编辑</Button>
      <Button onClick={() => setShowDelete(true)} disabled={!canDelete} danger>删除</Button>
    </div>
  );
}
```

## 权限字段映射

### 标准权限字段

每个模块的标准权限字段通常包括：

| 字段 | 说明 | 示例 |
|------|------|--------|
| view | 查看权限 | `material.view` |
| create | 创建权限 | `material.create` |
| update | 编辑权限 | `material.update` |
| delete | 删除权限 | `material.delete` |
| audit | 审核权限 | `material.audit` |
| enable | 启用权限 | `material.enable` |
| disable | 禁用权限 | `material.disable` |
| print | 打印权限 | `material.print` |
| export | 导出权限 | `material.export` |
| import | 导入权限 | `material.import` |

### 扩展权限字段

某些模块可能有特殊的权限需求：

```typescript
// 物料模块
const { canSetBaseUnit, canAdjustPrice } = usePermission('material');

// BOM模块
const { canSetDefaultBom, canCalculateCost } = usePermission('bom');

// 生产模块
const { canReleaseWorkOrder, canSuspendWorkOrder } = usePermission('workorder');
```

## 数据范围控制

### dataScope 用法

```typescript
function MaterialList() {
  const { dataScope } = usePermission('material');

  const filteredMaterials = materials.filter(material => {
    switch (dataScope) {
      case 'ALL':
        return true; // 查看全部数据
      case 'ORGANIZATION':
        return material.orgId === currentOrgId; // 仅当前组织
      case 'DEPARTMENT':
        return material.deptId === currentDeptId; // 仅当前部门
      case 'PERSONAL':
        return material.creatorId === currentUserId; // 仅个人数据
      case 'TEAM':
        return material.teamId === currentTeamId; // 仅当前团队
      default:
        return true;
    }
  });

  return <DataTable data={filteredMaterials} />;
}
```

### maxDataScope 用法

```typescript
function MaterialList() {
  const { maxDataScope } = usePermission('material');

  const handleCreate = () => {
    if (materials.length >= maxDataScope) {
      message.warning(`您最多只能创建 ${maxDataScope} 条物料`);
      return;
    }
    // 继续创建
    createMaterial(data);
  };

  return <Button onClick={handleCreate}>新建</Button>;
}
```

## 最佳实践

### 1. 权限检查 + UI反馈

```typescript
// ✅ 好的做法：权限不足时禁用按钮 + 显示提示
<Button
  icon={<PlusOutlined />}
  onClick={handleCreate}
  disabled={!canCreate}
  title={!canCreate ? '您没有创建权限' : undefined}
>
  新建
</Button>

// ❌ 不好的做法：完全不显示按钮
{canCreate && <Button>新建</Button>}
```

### 2. 权限检查 + 操作拦截

```typescript
const handleClick = () => {
  if (!canDelete) {
    message.warning('您没有执行此操作的权限');
    return false; // 拦截操作
  }
  // 执行操作
  deleteMaterial(id);
  return true; // 允许操作
};

<Button onClick={handleClick}>删除</Button>
```

### 3. 权限检查 + 数据过滤

```typescript
// 在数据层面进行权限过滤
const userAccessibleMaterials = useMemo(() => {
  return materials.filter(material => {
    // 数据范围过滤
    if (dataScope !== 'ALL' && material.creatorId !== currentUserId) {
      return false;
    }
    // 其他业务规则过滤
    return true;
  });
}, [materials, dataScope, currentUserId]);
```

### 4. 权限检查 + 页面访问控制

```typescript
function MaterialPage() {
  const { canView } = usePermission('material');

  // 页面级权限控制
  useEffect(() => {
    if (!canView) {
      message.error('您没有访问此页面的权限');
      // 可以重定向到其他页面
      navigate('/dashboard');
    }
  }, [canView]);

  if (!canView) {
    return null; // 或者返回权限不足组件
  }

  return <MaterialList />;
}
```

## 权限提示和消息

### 权限不足提示

```typescript
// 在操作按钮上显示提示
<Tooltip title={!canDelete ? '您没有删除权限' : undefined}>
  <Button
    icon={<DeleteOutlined />}
    onClick={handleDelete}
    disabled={!canDelete}
  >
    删除
  </Button>
</Tooltip>

// 或者使用 Alert 组件
{!canCreate && (
  <Alert
    message="您没有创建权限，如需此权限请联系管理员"
    type="warning"
    closable
  />
)}
```

### 权限变更监听

```typescript
function MaterialPage() {
  const { dataScope } = usePermission();

  useEffect(() => {
    // 监听权限变化，重新加载数据
    // dataScope 变化可能意味着权限范围变化
  }, [dataScope]);

  return <MaterialList />;
}
```

## 路由级权限控制

### 使用路由守卫

```typescript
// routes.ts
const ProtectedRoute = ({ component: Component, requiredPermission }) => {
  const { canView } = usePermission(requiredPermission);

  if (!canView) {
    return <Navigate to="/no-permission" replace />;
  }

  return <Component />;
};

// 使用
<Route path="/material" element={
  <ProtectedRoute component={MaterialList} requiredPermission="material.view" />
} />
```

## 常见使用场景

### 场景1：基础 CRUD 权限控制

```typescript
function MaterialList() {
  const { canView, canCreate, canUpdate, canDelete } = usePermission('material');

  const tableColumns = [
    // 基础列...
    {
      title: '操作',
      render: (_, record) => (
        <Space>
          {canUpdate && <Button onClick={() => handleEdit(record)}>编辑</Button>}
          {canDelete && <Button onClick={() => handleDelete(record)}>删除</Button>}
        </Space>
      ),
    },
  ];

  const actionBarActions = [
    { key: 'create', label: '新建', onClick: handleCreate, disabled: !canCreate },
  ];

  return (
    <>
      {!canView && <Alert message="无查看权限" type="warning" />}
      <ActionBar actions={actionBarActions} />
      <DataTable columns={tableColumns} />
    </>
  );
}
```

### 场景2：批量操作权限控制

```typescript
function MaterialList() {
  const { canDelete } = usePermission('material');

  const batchActions = [
    {
      key: 'batch-delete',
      label: '批量删除',
      onClick: handleBatchDelete,
      disabled: selectedIds.length === 0 || !canDelete,
    },
  ];

  return <ActionBar batchActions={batchActions} />;
}
```

### 场景3：特殊功能权限控制

```typescript
function MaterialList() {
  const { canSetBaseUnit } = usePermission('material');

  const extraActions = [
    {
      key: 'set-base-unit',
      label: '设置基础单位',
      onClick: handleSetBaseUnit,
      disabled: !canSetBaseUnit,
    },
  ];

  return <ActionBar actions={actionBarActions} extra={<Space>{extraActions}</Space>} />;
}
```

## 测试权限功能

### 单元测试建议

```typescript
describe('Permission Integration', () => {
  it('should disable create button without permission', () => {
    const { canCreate } = renderHook(() => ({ canCreate: false }));
    const { getByText } = render(<ComponentWithPermissions />);

    expect(getByText('新建')).toBeDisabled();
  });

  it('should show permission warning message', () => {
    const { canDelete } = renderHook(() => ({ canDelete: false }));
    const { getByText } = render(<ComponentWithPermissions />);

    fireEvent.click(getByText('删除'));
    expect(getByText('您没有删除权限')).toBeInTheDocument();
  });
});
```

## 总结

通过使用 `usePermission` hook，可以实现：

1. ✅ **细粒度权限控制** - 精确到每个操作
2. ✅ **一致的权限检查** - 统一的权限检查接口
3. ✅ **友好的用户反馈** - 权限不足时提供明确提示
4. ✅ **数据范围隔离** - 基于用户权限范围过滤数据
5. ✅ **可维护的权限逻辑** - 集中管理权限规则

在所有组件中集成权限控制，确保系统安全性和用户体验的一致性。
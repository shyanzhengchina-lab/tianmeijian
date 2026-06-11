# 用户认证系统 - 快速开始指南

## 概述

本指南帮助您快速在项目中使用新的用户认证和权限系统。

## 快速开始

### 1. 基础使用

#### 获取当前用户信息

```typescript
import { useCurrentUser } from '@/shared/hooks/useCurrentUser';

function MyComponent() {
  const {
    userId,
    username,
    realName,
    email,
    factoryIds,
    hasPermission,
    addCreatorInfo,
  } = useCurrentUser();

  return (
    <div>
      <p>用户ID: {userId}</p>
      <p>用户名: {username}</p>
      <p>真实姓名: {realName}</p>
    </div>
  );
}
```

#### 创建数据时添加用户信息

```typescript
function MyComponent() {
  const { addCreatorInfo } = useCurrentUser();

  const handleCreate = async (values: any) => {
    // 自动添加创建人信息
    const dataWithUserInfo = addCreatorInfo(values);
    // 结果: { ...values, createUserId: 'xxx', createBy: '张三' }

    await api.create(dataWithUserInfo);
  };

  return <button onClick={handleCreate}>创建</button>;
}
```

### 2. 权限验证

#### 简单权限检查

```typescript
import { hasPermission } from '@/shared/utils/auth';

function MyComponent() {
  if (hasPermission('basicdata:material:create')) {
    return <button>创建物料</button>;
  }
  return <span>您没有创建权限</span>;
}
```

#### 权限守卫

```typescript
import { requirePermission } from '@/shared/utils/auth';

function createMaterial() {
  requirePermission('basicdata:material:create', '没有创建权限');
  // 如果没有权限，会抛出错误
  // 继续执行...
}
```

#### 多权限检查

```typescript
import { hasPermissions, hasAnyPermission } from '@/shared/utils/auth';

// 需要所有权限
if (hasPermissions(['basicdata:material:view', 'basicdata:material:create'])) {
  // 有所有权限
}

// 需要任意一个权限
if (hasAnyPermission(['basicdata:material:create', 'basicdata:material:update'])) {
  // 有至少一个权限
}
```

### 3. 角色检查

```typescript
import { hasRole, isAdmin, isSuperAdmin } from '@/shared/utils/auth';

function MyComponent() {
  // 检查特定角色
  if (hasRole('ROLE_ADMIN')) {
    return <AdminPanel />;
  }

  // 检查是否为管理员
  if (isAdmin()) {
    return <AdminMenu />;
  }

  // 检查是否为超级管理员
  if (isSuperAdmin()) {
    return <SuperAdminPanel />;
  }

  return <UserPanel />;
}
```

### 4. 工厂权限

```typescript
import { getCurrentUserFactoryIds, canAccessFactory } from '@/shared/utils/auth';

function MyComponent() {
  const userFactoryIds = getCurrentUserFactoryIds();

  return (
    <div>
      <p>可访问的工厂: {userFactoryIds.join(', ')}</p>
      <button
        disabled={!canAccessFactory('F001')}
        onClick={() => navigateToFactory('F001')}
      >
        访问南京工厂
      </button>
    </div>
  );
}
```

### 5. 在组件中使用高阶组件

```typescript
import { withPermissionCheck, withAuthCheck, withRoleCheck } from '@/shared/utils/auth';

// 权限检查
const CreateButton = withPermissionCheck(
  'basicdata:material:create',
  ({ onClick }) => <button onClick={onClick}>创建</button>
);

// 角色检查
const AdminPanel = withRoleCheck(
  'ROLE_ADMIN',
  () => <div>管理员面板</div>
);

// 认证检查
const UserDashboard = withAuthCheck(() => <div>用户仪表板</div>);

// 使用
function App() {
  return (
    <div>
      <CreateButton onClick={handleCreate} />
      <AdminPanel />
      <UserDashboard />
    </div>
  );
}
```

### 6. 使用登录/登出功能

```typescript
import { useAuthStore } from '@/shared/stores/authStore';

function LoginPage() {
  const { login, logout, loading, error } = useAuthStore();

  const handleLogin = async (values: any) => {
    try {
      await login({
        username: values.username,
        password: values.password,
      });
      // 登录成功，会自动跳转
    } catch (error) {
      console.error('登录失败:', error);
    }
  };

  const handleLogout = async () => {
    await logout();
    // 会自动跳转到登录页
  };

  return (
    <div>
      <button onClick={handleLogout} loading={loading}>
        登出
      </button>
      {error && <div className="error">{error}</div>}
    </div>
  );
}
```

## 实际应用示例

### 示例1：带权限检查的物料列表

```typescript
import { useCurrentUser } from '@/shared/hooks/useCurrentUser';
import { Button } from 'antd';

function MaterialList() {
  const { hasPermission, addCreatorInfo } = useCurrentUser();

  const handleCreate = async (values: any) => {
    const dataWithUserInfo = addCreatorInfo(values);
    await createMaterial(dataWithUserInfo);
  };

  return (
    <div>
      {/* 根据权限显示按钮 */}
      {hasPermission('basicdata:material:create') && (
        <Button type="primary" onClick={() => setShowModal(true)}>
          创建物料
        </Button>
      )}

      {hasPermission('basicdata:material:export') && (
        <Button onClick={handleExport}>导出</Button>
      )}

      <MaterialForm onSubmit={handleCreate} />
    </div>
  );
}
```

### 示例2：工厂选择器

```typescript
import { getCurrentUserFactoryIds, canAccessFactory } from '@/shared/utils/auth';

function FactorySelector({ factories, onSelect }) {
  const userFactoryIds = getCurrentUserFactoryIds();

  const availableFactories = factories.filter(factory =>
    canAccessFactory(factory.id)
  );

  return (
    <Select onChange={onSelect} placeholder="选择工厂">
      {availableFactories.map(factory => (
        <Select.Option key={factory.id} value={factory.id}>
          {factory.name}
        </Select.Option>
      ))}
    </Select>
  );
}
```

### 示例3：操作日志记录

```typescript
import { getOperatorInfo } from '@/shared/utils/auth';

function logOperation(action: string, details: any) {
  const operator = getOperatorInfo();

  const logEntry = {
    action,
    operatorId: operator.id,
    operatorName: operator.realName,
    operatorUsername: operator.username,
    timestamp: new Date().toISOString(),
    details,
  };

  // 保存到日志
  saveOperationLog(logEntry);
}
```

### 示例4：数据表单自动填充

```typescript
import { useCurrentUser } from '@/shared/hooks/useCurrentUser';

function MaterialForm() {
  const { addCreatorInfo, addUpdaterInfo } = useCurrentUser();
  const [form] = Form.useForm();

  const handleCreate = async () => {
    const values = await form.validateFields();
    const dataWithCreator = addCreatorInfo(values);
    await createMaterial(dataWithCreator);
  };

  const handleUpdate = async () => {
    const values = await form.validateFields();
    const dataWithUpdater = addUpdaterInfo(values);
    await updateMaterial(dataWithUpdater);
  };

  return (
    <Form form={form}>
      <Form.Item name="code" label="物料编码">
        <Input />
      </Form.Item>
      <Button onClick={handleCreate}>创建</Button>
      <Button onClick={handleUpdate}>更新</Button>
    </Form>
  );
}
```

## 迁移指南

### 从硬编码迁移到新系统

#### 之前（硬编码）：
```typescript
async function createMaterial(values: any) {
  const data = {
    ...values,
    createdBy: 'admin', // 硬编码
    createUserId: '1', // 硬编码
  };
  await api.create(data);
}
```

#### 之后（使用新系统）：
```typescript
import { useCurrentUser } from '@/shared/hooks/useCurrentUser';

function MyComponent() {
  const { addCreatorInfo } = useCurrentUser();

  async function createMaterial(values: any) {
    const data = addCreatorInfo(values); // 自动添加
    await api.create(data);
  }

  return <button onClick={createMaterial}>创建</button>;
}
```

## 常见使用场景

### 场景1：根据权限显示/隐藏菜单

```typescript
import { hasPermission } from '@/shared/utils/auth';

const menuItems = [
  {
    key: 'materials',
    label: '物料管理',
    path: '/basic-data/material',
    permission: 'basicdata:material:view',
  },
  {
    key: 'users',
    label: '用户管理',
    path: '/system/users',
    permission: 'system:user:view',
  },
];

const filteredMenuItems = menuItems.filter(item =>
  !item.permission || hasPermission(item.permission)
);
```

### 场景2：表格操作按钮权限控制

```typescript
import { hasPermissions } from '@/shared/utils/auth';

const getActions = (record: any) => {
  const actions = [];

  if (hasPermission('basicdata:material:view')) {
    actions.push({
      key: 'view',
      label: '查看',
      onClick: () => handleView(record),
    });
  }

  if (hasPermission('basicdata:material:update')) {
    actions.push({
      key: 'edit',
      label: '编辑',
      onClick: () => handleEdit(record),
    });
  }

  if (hasPermission('basicdata:material:delete')) {
    actions.push({
      key: 'delete',
      label: '删除',
      onClick: () => handleDelete(record),
      danger: true,
    });
  }

  return actions;
};
```

### 场景3：工厂数据过滤

```typescript
import { getCurrentUserFactoryIds } from '@/shared/utils/auth';

function loadData() {
  const userFactoryIds = getCurrentUserFactoryIds();

  const data = await api.fetchData({
    factoryIds: userFactoryIds, // 只加载用户有权访问的工厂数据
  });

  return data;
}
```

## 故障排查

### 问题1：权限检查不生效

**原因**：可能用户未登录或权限未正确加载

**解决方案**：
```typescript
import { useCurrentUser } from '@/shared/hooks/useCurrentUser';

function MyComponent() {
  const { isAuthenticated, permissions, hasPermission } = useCurrentUser();

  if (!isAuthenticated) {
    return <div>请先登录</div>;
  }

  console.log('用户权限:', permissions);

  return <div>{/* 正常渲染 */}</div>;
}
```

### 问题2：用户信息为空

**原因**：Token过期或未正确加载

**解决方案**：
```typescript
import { useAuthStore } from '@/shared/stores/authStore';

useEffect(() => {
  const refreshUserInfo = async () => {
    try {
      await refreshUserInfo();
    } catch (error) {
      console.error('刷新用户信息失败:', error);
      // Token可能过期，需要重新登录
    }
  };

  refreshUserInfo();
}, []);
```

### 问题3：工厂权限不正确

**原因**：用户工厂权限未正确配置

**解决方案**：
```typescript
import { getCurrentUserFactoryIds } from '@/shared/utils/auth';

function checkFactoryAccess() {
  const factoryIds = getCurrentUserFactoryIds();
  console.log('用户可访问的工厂:', factoryIds);

  if (factoryIds.length === 0) {
    console.warn('用户没有工厂权限');
  }
}
```

## 最佳实践

1. **始终使用addCreatorInfo和addUpdaterInfo**
   - 确保所有创建和更新操作都记录操作人信息

2. **在关键操作前检查权限**
   - 使用requirePermission确保权限不足时抛出错误

3. **组件级别权限控制**
   - 使用高阶组件控制整个组件的显示/隐藏

4. **合理使用缓存**
   - 用户权限已缓存，避免频繁重复请求

5. **错误处理**
   - 妥善处理权限不足的情况，提供友好的用户提示

## 获取帮助

如有问题，请参考：
- 完整实施文档：`USER_AUTHENTICATION_IMPLEMENTATION.md`
- API文档：`src/shared/api/authApi.ts`
- 工具函数：`src/shared/utils/auth.ts`
- 认证Store：`src/shared/stores/authStore.ts`

---

**版本**: 1.0
**最后更新**: 2026-05-03

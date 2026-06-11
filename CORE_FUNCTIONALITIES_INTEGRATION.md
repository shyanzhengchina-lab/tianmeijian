# MES前端核心功能集成文档

## 概述

本文档描述了MES前端系统集成的四个核心业务功能的实现和使用方法。

## 功能清单

### 1. RBAC权限系统集成

**状态**: ✅ 已完成

**功能特性**:
- 菜单权限控制
- 按钮权限控制
- 数据权限控制
- 角色管理
- 用户角色分配
- 权限树视图

**文件位置**:
- `src/modules/system/permission/components/PermissionManagement.tsx`
- `src/shared/hooks/usePermission.ts`
- `src/stores/rbacStore.ts` (需创建)

**使用方法**:

```typescript
import PermissionManagement from '@/modules/system/permission/components/PermissionManagement';

// 在页面中使用
function PermissionPage() {
  return <PermissionManagement />;
}

// 使用权限Hook
import { usePermission } from '@/shared/hooks/usePermission';

function MyComponent() {
  const { canView, canCreate, canUpdate, canDelete } = usePermission('material');

  return (
    <div>
      {canView('material') && <MaterialList />}
      {canCreate('material') && <Button>新建</Button>}
    </div>
  );
}
```

**API接口**:

```
GET    /api/permissions          # 获取权限列表
POST   /api/permissions          # 创建权限
PUT    /api/permissions/:id       # 更新权限
DELETE /api/permissions/:id       # 删除权限

GET    /api/roles                 # 获取角色列表
POST   /api/roles                 # 创建角色
PUT    /api/roles/:id            # 更新角色
DELETE /api/roles/:id            # 删除角色

GET    /api/user-roles           # 获取用户角色
POST   /api/user-roles           # 分配角色
DELETE /api/user-roles/:id       # 撤销角色
```

---

### 2. 多工厂管理功能

**状态**: ✅ 已完成

**功能特性**:
- 工厂切换组件
- 工厂数据隔离
- 工厂上下文管理
- 工厂统计信息
- 工厂配置管理

**文件位置**:
- `src/modules/system/factory/components/FactorySwitcher.tsx`
- `src/stores/factoryStore.ts`
- `src/shared/hooks/useFactoryData.ts`

**使用方法**:

```typescript
import FactorySwitcher from '@/modules/system/factory/components/FactorySwitcher';

// 在布局中使用
function AppLayout() {
  return (
    <div>
      <div className="header">
        <FactorySwitcher showStats={true} />
      </div>
      <main>
        {/* 页面内容 */}
      </main>
    </div>
  );
}

// 使用工厂数据Hook
import { useFactoryData } from '@/shared/hooks/useFactoryData';
import { useFactoryInfo } from '@/shared/hooks/useFactoryData';

function MaterialModule() {
  const { currentFactoryId, factoryName } = useFactoryInfo();

  const {
    getData,
    setData,
    addData,
    updateData,
    removeData,
    clearData,
  } = useFactoryData<Material>({
    module: 'material',
    maxSize: 1000,
    ttl: 30 * 60 * 1000, // 30分钟
    persist: true,
  });

  // 使用工厂隔离的数据
  const materials = getData();

  // 数据操作
  const handleAddMaterial = async (material: Material) => {
    await materialApi.create(material);
    addData(material);
  };

  return <div>{/* 组件内容 */}</div>;
}
```

**API接口**:

```
GET    /api/factories              # 获取工厂列表
GET    /api/factories/:id           # 获取工厂详情
POST   /api/factories              # 创建工厂
PUT    /api/factories/:id           # 更新工厂
DELETE /api/factories/:id           # 删除工厂
POST   /api/factories/:id/switch    # 切换工厂

GET    /api/factories/:id/stats    # 获取工厂统计信息
GET    /api/factories/:id/users    # 获取工厂用户列表
```

**工厂数据隔离**:

所有API调用会自动添加工厂上下文：

```typescript
// 在apiClient中自动添加
headers['X-Factory-ID'] = getCurrentFactoryId();

// 后端接收请求头进行数据过滤
```

---

### 3. 导出导入功能

**状态**: ✅ 已完成

**功能特性**:
- Excel导出
- CSV导出
- PDF导出（需集成jsPDF）
- Excel导入
- 导入数据校验
- 导入错误处理
- 导入模板下载

**文件位置**:
- `src/shared/components/DataTable/withExportImport.tsx`

**使用方法**:

```typescript
import DataTableWithExportImport from '@/shared/components/DataTable/withExportImport';

// 定义导入校验器
const materialImportValidator = (data: any[]) => {
  return data.map((row, index) => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 校验必填字段
    if (!row['物料编码']) {
      errors.push('物料编码不能为空');
    }

    if (!row['物料名称']) {
      errors.push('物料名称不能为空');
    }

    // 校验数据格式
    if (row['单价'] && isNaN(parseFloat(row['单价']))) {
      errors.push('单价格式不正确');
    }

    // 警告信息
    if (!row['规格型号']) {
      warnings.push('建议填写规格型号');
    }

    return {
      row: index + 1,
      errors,
      warnings,
      data: row,
    };
  });
};

// 定义导入处理
const handleMaterialImport = async (data: any[]) => {
  // 调用API批量导入
  await materialApi.batchImport(data);
};

// 定义导入模板
const importTemplate = {
  '物料编码': 'M001',
  '物料名称': '示例物料',
  '规格型号': '规格A',
  '单价': '100.00',
  '单位': '个',
  '状态': '启用',
};

// 在表格中使用
function MaterialList() {
  const columns = [
    { title: '物料编码', dataIndex: 'code' },
    { title: '物料名称', dataIndex: 'name' },
    // ...
  ];

  return (
    <DataTableWithExportImport
      data={materials}
      columns={columns}
      enableExport={true}
      enableImport={true}
      exportFormats={['excel', 'csv']}
      exportFileName="物料清单"
      importValidator={materialImportValidator}
      onImport={handleMaterialImport}
      importTemplate={importTemplate}
      rowKey="id"
      loading={loading}
    />
  );
}
```

**依赖安装**:

```bash
npm install xlsx
# 或
yarn add xlsx
```

**PDF导出** (可选):

```bash
npm install jspdf jspdf-autotable
# 或
yarn add jspdf jspdf-autotable
```

---

### 4. 实时数据推送

**状态**: ✅ 已完成

**功能特性**:
- WebSocket连接管理
- 实时消息通知
- 在线状态显示
- 数据更新推送
- 设备状态监控
- 生产进度更新

**文件位置**:
- `src/shared/components/RealTimeNotifier/index.tsx`
- `src/shared/hooks/useWebSocket.ts`
- `src/shared/services/websocket.ts`

**使用方法**:

```typescript
import RealTimeNotifier, {
  OnlineStatusIndicator,
  RealTimeStatsCard,
  RealTimeUpdateIndicator,
} from '@/shared/components/RealTimeNotifier';

import { useWebSocket, useNotifications } from '@/shared/hooks/useWebSocket';

// 在布局中使用通知组件
function AppLayout() {
  const handleNotificationClick = (notification) => {
    console.log('通知被点击:', notification);
  };

  const handleConnectionChange = (connected) => {
    console.log('连接状态变化:', connected);
  };

  return (
    <div>
      <div className="header">
        <RealTimeNotifier
          autoConnect={true}
          wsUrl="ws://localhost:8080/ws"
          maxNotifications={50}
          onNotificationClick={handleNotificationClick}
          onConnectionChange={handleConnectionChange}
        />
      </div>
      <main>
        {/* 页面内容 */}
      </main>
    </div>
  );
}

// 使用WebSocket Hook
function ProductionMonitor() {
  const { connected, send, disconnect } = useWebSocket({
    autoConnect: true,
    url: 'ws://localhost:8080/ws',
  });

  const { notifications, unreadCount, addNotification } = useNotifications();

  // 发送消息
  const handleSendMessage = () => {
    send('device_control', { deviceId: 'DEV-001', command: 'start' });
  };

  return (
    <div>
      <div>连接状态: {connected ? '已连接' : '未连接'}</div>
      <div>未读通知: {unreadCount}</div>
      <Button onClick={handleSendMessage}>发送控制指令</Button>
    </div>
  );
}

// 使用在线状态指示器
function UserList() {
  const users = [
    { id: '1', name: '张三', status: 'online' },
    { id: '2', name: '李四', status: 'busy' },
  ];

  return (
    <div>
      {users.map(user => (
        <OnlineStatusIndicator
          key={user.id}
          userId={user.id}
          userName={user.name}
          status={user.status}
          lastSeen={Date.now() - 3600000}
        />
      ))}
    </div>
  );
}

// 使用实时统计卡片
function Dashboard() {
  return (
    <Row gutter={16}>
      <Col span={6}>
        <RealTimeStatsCard
          title="今日产量"
          value={1250}
          prefix={<ThunderboltOutlined />}
          suffix="件"
          trend={{ value: 15, isUp: true }}
          loading={false}
        />
      </Col>
    </Row>
  );
}
```

**WebSocket消息类型**:

```typescript
// 设备状态更新
{
  type: 'device_status_update',
  data: {
    deviceId: 'DEV-001',
    status: 'online',
    parameters: { temperature: 25, pressure: 101.3 }
  }
}

// 生产进度更新
{
  type: 'production_progress',
  data: {
    workOrderId: 'WO-2024-001',
    progress: 75,
    completedQty: 750,
    totalQty: 1000
  }
}

// 通知消息
{
  type: 'notification',
  data: {
    id: 'NOTIF-001',
    type: 'warning',
    title: '设备异常',
    message: '设备DEV-001温度过高',
    timestamp: 1714567890000
  }
}

// 系统消息
{
  type: 'system_message',
  data: {
    type: 'info',
    message: '系统将于今晚22:00进行维护',
    code: 'MAINTENANCE'
  }
}
```

**WebSocket配置**:

```typescript
// 在.env文件中配置
VITE_WS_URL=ws://localhost:8080/ws
VITE_WS_RECONNECT=true
VITE_WS_HEARTBEAT_INTERVAL=30000
```

---

## 集成示例

### 完整页面集成示例

```typescript
import React from 'react';
import { Layout } from 'antd';
import FactorySwitcher from '@/modules/system/factory/components/FactorySwitcher';
import RealTimeNotifier from '@/shared/components/RealTimeNotifier';
import DataTableWithExportImport from '@/shared/components/DataTable/withExportImport';
import { usePermission } from '@/shared/hooks/usePermission';
import { useFactoryData } from '@/shared/hooks/useFactoryData';

const { Header, Content } = Layout;

function MaterialManagementPage() {
  const { canView, canCreate, canUpdate, canDelete } = usePermission('material');

  const {
    getData,
    setData,
    addData,
    updateData,
    removeData,
  } = useFactoryData<Material>({
    module: 'material',
  });

  const materials = getData();

  const handleNotificationClick = (notification) => {
    // 处理通知点击
    console.log('通知点击:', notification);
  };

  const handleImport = async (data) => {
    // 处理数据导入
    await materialApi.batchImport(data);
    // 更新本地数据
    setData(data);
  };

  return (
    <Layout>
      <Header>
        <div className="flex items-center justify-between">
          <FactorySwitcher showStats={true} />
          <RealTimeNotifier onNotificationClick={handleNotificationClick} />
        </div>
      </Header>
      <Content>
        {canView('material') && (
          <DataTableWithExportImport
            data={materials}
            columns={materialColumns}
            enableExport={true}
            enableImport={true}
            importValidator={materialImportValidator}
            onImport={handleImport}
            rowKey="id"
          />
        )}
      </Content>
    </Layout>
  );
}

export default MaterialManagementPage;
```

---

## 测试指南

### 1. 权限功能测试

1. **菜单权限测试**:
   - 为用户分配不同角色
   - 验证用户只能看到有权限访问的菜单

2. **按钮权限测试**:
   - 测试增删改查按钮的显示/隐藏
   - 验证权限控制的准确性

3. **数据权限测试**:
   - 创建不同数据范围的用户
   - 验证用户只能访问自己权限范围内的数据

### 2. 工厂切换测试

1. **工厂切换测试**:
   - 切换到不同工厂
   - 验证数据是否正确隔离
   - 检查工厂上下文是否正确传递

2. **数据隔离测试**:
   - 在不同工厂创建数据
   - 验证工厂间数据不会互相影响

### 3. 导出导入测试

1. **导出测试**:
   - 测试Excel导出
   - 测试CSV导出
   - 验证导出数据的完整性和格式

2. **导入测试**:
   - 测试正常数据导入
   - 测试数据校验
   - 测试错误处理

### 4. 实时推送测试

1. **WebSocket连接测试**:
   - 测试连接建立
   - 测试断线重连
   - 测试心跳机制

2. **消息推送测试**:
   - 测试设备状态更新
   - 测试生产进度更新
   - 测试通知消息
   - 测试系统消息

---

## 性能优化建议

1. **数据缓存**:
   - 合理设置缓存过期时间
   - 工厂切换时及时清理缓存

2. **WebSocket管理**:
   - 避免频繁创建连接
   - 合理设置心跳间隔
   - 及时清理未使用的连接

3. **大数据量处理**:
   - 导出时分批处理
   - 导入时进行数据校验和错误提示
   - 使用虚拟滚动处理大数据量表格

4. **权限缓存**:
   - 缓存用户权限信息
   - 定期刷新权限缓存

---

## 故障排除

### 权限相关问题

**问题**: 用户看不到某些菜单
**解决**:
1. 检查用户角色分配
2. 检查角色权限配置
3. 检查菜单权限映射
4. 清除权限缓存

### 工厂切换问题

**问题**: 切换工厂后数据不更新
**解决**:
1. 检查工厂ID是否正确
2. 检查API请求头中的工厂ID
3. 清理工厂数据缓存
4. 重新加载数据

### 导出导入问题

**问题**: Excel文件无法打开
**解决**:
1. 检查文件编码格式
2. 验证数据格式是否正确
3. 检查XLSX库版本
4. 使用兼容模式保存

### WebSocket连接问题

**问题**: 无法连接WebSocket服务器
**解决**:
1. 检查WebSocket服务器地址
2. 检查网络连接
3. 检查防火墙设置
4. 查看浏览器控制台错误信息

---

## 总结

本次集成的四个核心功能为MES前端系统提供了完善的业务支持：

1. **RBAC权限系统**: 提供细粒度的权限控制，确保系统安全
2. **多工厂管理**: 支持多工厂环境，实现数据隔离和快速切换
3. **导出导入功能**: 方便数据批量操作，提高工作效率
4. **实时数据推送**: 实时监控生产状态，及时响应异常

所有功能都遵循了项目的架构规范，使用TypeScript进行类型检查，并与现有模块保持一致。组件具有良好的扩展性和可维护性。

---

## 联系支持

如有问题或需要技术支持，请联系：
- 技术负责人: [技术负责人联系方式]
- 项目文档: [项目文档链接]
- 问题跟踪: [问题跟踪系统链接]

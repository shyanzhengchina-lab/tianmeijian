# API接口对接计划

## 概述

当前项目所有23个模块已完成开发，但API调用层仍使用TODO和模拟数据。本计划指导将所有TODO API调用替换为真实的后端对接。

## 当前状态

- **TODO API调用总数**: 约170个需要实现
- **包含主要TODO的模块数**: 10个以上
- **模拟数据使用**: 所有Store目前使用setTimeout模拟API调用
- **错误处理**: 完善的错误捕获和用户提示

---

## 优先级分级

### 高优先级 (P0) - 核心业务流程

这些模块直接影响生产执行，需要优先对接：

1. **车间执行模块** (3个)
   - PAD模块 - 工序执行
   - 领料管理模块 - 物料发放流程
   - EBR模块 - 电子批记录

2. **生产管理模块** (3个)
   - 生产订单模块 - 订单管理
   - 生产工单模块 - 工单管理
   - 生产任务单模块 - 任务执行

### 中优先级 (P1) - 基础数据

这些模块是其他模块的基础：

1. **基础数据模块** (5个)
   - Material - 物料档案
   - Unit - 计量单位
   - BOM - 物料清单
   - Operation - 工序主数据
   - Equipment - 设备档案

### 中优先级 (P2) - 辅助模块

1. **质量管理模块** (2个)
   - Inspection - 质检工作台
   - MRB - MRB评审

### 低优先级 (P3) - 系统管理

1. **系统管理模块** (2个)
   - Permission - 权限管理
   - Organization - 组织架构

---

## API对接策略

### 1. 创建API服务层

为每个模块创建独立的API服务类：

```typescript
// modules/[module]/api/[module]Api.ts
import { ApiClient } from '@/shared/api/apiClient';

export class [Module]ApiService {
  private apiClient: ApiClient;
  
  constructor() {
    this.apiClient = new ApiClient();
  }
  
  // CRUD操作
  async getEntities(query: Query): Promise<PageResult<Entity>> {
    return await this.apiClient.get('/api/[entities]', { params: query });
  }
  
  async getEntityById(id: string): Promise<Entity> {
    return await this.apiClient.get(`/api/[entities]/${id}`);
  }
  
  async createEntity(data: CreateDTO): Promise<Entity> {
    return await this.apiClient.post('/api/[entities]', data);
  }
  
  async updateEntity(data: UpdateDTO): Promise<Entity> {
    return await this.apiClient.put(`/api/[entities]/${data.id}`, data);
  }
  
  async deleteEntities(ids: string[]): Promise<void> {
    return await this.apiClient.delete('/api/[entities]', { data: { ids } });
  }
}

export const [module]Api = new [Module]ApiService();
```

### 2. 替换Store中的TODO调用

将Store中的TODO注释替换为真实API调用：

**原代码：**
```typescript
// TODO: 调用API加载领料单数据
// const response = await issuanceApi.getIssuances(query);
setTimeout(() => {
  set({ issuances: [], total: 0, loading: false });
}, 500);
```

**新代码：**
```typescript
const response = await issuanceApi.getIssuances(query);

if (response.code === 200) {
  set({
    issuances: response.data.list,
    total: response.data.total,
    loading: false,
  });
} else {
  set({
    loading: false,
    error: response.message || '加载失败',
  });
}
```

### 3. 统一错误处理

创建全局错误处理机制：

```typescript
// shared/utils/errorHandler.ts
export class ApiErrorHandler {
  static handle(error: any): string {
    if (error.response) {
      const { status, data } = error.response;
      switch (status) {
        case 400:
          return '请求参数错误';
        case 401:
          return '未授权，请登录后重试';
        case 403:
          return '权限不足，请联系管理员';
        case 404:
          return '请求的资源不存在';
        case 500:
          return '服务器错误，请稍后重试';
        default:
          return data?.message || '未知错误';
      }
    }
    return error.message || '网络错误';
  }
  
  static show(error: any): void {
    const message = this.handle(error);
    if (message.includes('未授权')) {
      // 跳转到登录页
      window.location.href = '/login';
    }
    notification.error({
      message: message,
      duration: 3,
    });
  }
}
```

---

## 实施步骤

### 阶段1：API基础设施 (Day 1-2)

1. **完善ApiClient** 
   - ✅ 已有基础实现
   - 添加请求/响应拦截器
   - 添加全局错误处理
   - 添加请求重试机制
   - 添加loading状态管理

2. **创建API服务基类**
```typescript
// shared/api/BaseApiService.ts
export abstract class BaseApiService {
  protected apiClient: ApiClient;
  
  constructor() {
    this.apiClient = new ApiClient();
  }
  
  protected async handleRequest<T>(
    request: () => Promise<ApiResponse<T>>,
    errorMessage: string
  ): Promise<T> {
    try {
      const response = await request();
      if (response.code === 200) {
        return response.data;
      } else {
        throw new Error(response.message || errorMessage);
      }
    } catch (error) {
      ApiErrorHandler.show(error);
      throw error;
    }
  }
}
```

### 阶段2：核心模块API对接 (Day 3-7)

#### P0优先级模块

**PAD模块API对接** (1天)
```typescript
// src/modules/execution/pad/api/padApi.ts
export class PadApiService extends BaseApiService {
  
  async getTasks(query: TaskQuery): Promise<PageResult<Task>> {
    return this.handleRequest(
      () => this.apiClient.get('/api/pad/tasks', { params: query }),
      '加载任务列表失败'
    );
  }
  
  async startTask(data: TaskOperationDTO): Promise<void> {
    return this.handleRequest(
      () => this.apiClient.post('/api/pad/tasks/start', data),
      '开始任务失败'
    );
  }
  
  async completeTask(data: TaskOperationDTO): Promise<void> {
    return this.handleRequest(
      () => this.apiClient.post('/api/pad/tasks/complete', data),
      '完成任务失败'
    );
  }
  
  // ... 其他操作
}

// 更新padStore.ts
export const padApi = new PadApiService();
```

**领料管理模块API对接** (1天)
```typescript
// src/modules/execution/issuance/api/issuanceApi.ts
export class IssuanceApiService extends BaseApiService {
  
  async getIssuances(query: IssuanceQuery): Promise<PageResult<MaterialIssuance>> {
    return this.handleRequest(
      () => this.apiClient.get('/api/issuance', { params: query }),
      '加载领料单列表失败'
    );
  }
  
  async approveIssuance(data: IssuanceOperationDTO): Promise<void> {
    return this.handleRequest(
      () => this.apiClient.post('/api/issuance/approve', data),
      '审批领料单失败'
    );
  }
  
  async issueMaterial(data: IssuanceOperationDTO): Promise<void> {
    return this.handleRequest(
      () => this.apiClient.post('/api/issuance/issue', data),
      '领料操作失败'
    );
  }
  
  // ... 其他操作
}
```

**EBR模块API对接** (1天)
```typescript
// src/modules/execution/ebr/api/ebrApi.ts
export class EBRApiService extends BaseApiService {
  
  async getEBRRecords(query: EBRQuery): Promise<PageResult<EBRRecord>> {
    return this.handleRequest(
      () => this.apiClient.get('/api/ebr', { params: query }),
      '加载批记录列表失败'
    );
  }
  
  async startEBR(id: string): Promise<void> {
    return this.handleRequest(
      () => this.apiClient.post(`/api/ebr/${id}/start`, {}),
      '开始批记录失败'
    );
  }
  
  async completeEBR(id: string): Promise<void> {
    return this.handleRequest(
      () => this.apiClient.post(`/api/ebr/${id}/complete`, {}),
      '完成批记录失败'
    );
  }
  
  // ... 其他操作
}
```

#### P1优先级模块

**生产订单模块API对接** (1天)
```typescript
// src/modules/production/production-order/api/productionOrderApi.ts
export class ProductionOrderApiService extends BaseApiService {
  
  async getOrders(query: OrderQuery): Promise<PageResult<ProductionOrder>> {
    return this.handleRequest(
      () => this.apiClient.get('/api/production-orders', { params: query }),
      '加载生产订单列表失败'
    );
  }
  
  async createOrder(data: CreateOrderDTO): Promise<ProductionOrder> {
    return this.handleRequest(
      () => this.apiClient.post('/api/production-orders', data),
      '创建生产订单失败'
    );
  }
  
  // ... 其他操作
}
```

**生产工单模块API对接** (1天)
```typescript
// src/modules/production/work-order/api/workOrderApi.ts
export class WorkOrderApiService extends BaseApiService {
  
  async getWorkOrders(query: WorkOrderQuery): Promise<PageResult<WorkOrder>> {
    return this.handleRequest(
      () => this.apiClient.get('/api/work-orders', { params: query }),
      '加载生产工单列表失败'
    );
  }
  
  async releaseWorkOrder(id: string): Promise<void> {
    return this.handleRequest(
      () => this.apiClient.post(`/api/work-orders/${id}/release`, {}),
      '下达工单失败'
    );
  }
  
  // ... 其他操作
}
```

**物料模块API对接** (1天)
```typescript
// src/modules/basic-data/material/api/materialApi.ts
export class MaterialApiService extends BaseApiService {
  
  async getMaterials(query: MaterialQuery): Promise<PageResult<Material>> {
    return this.handleRequest(
      () => this.apiClient.get('/api/materials', { params: query }),
      '加载物料列表失败'
    );
  }
  
  async createMaterial(data: CreateMaterialDTO): Promise<Material> {
    return this.handleRequest(
      () => this.apiClient.post('/api/materials', data),
      '创建物料失败'
    );
  }
  
  // ... 其他操作
}
```

**设备模块API对接** (1天)
```typescript
// src/modules/basic-data/equipment/api/equipmentApi.ts
export class EquipmentApiService extends BaseApiService {
  
  async getEquipments(query: EquipmentQuery): Promise<PageResult<Equipment>> {
    return this.handleRequest(
      () => this.apiClient.get('/api/equipments', { params: query }),
      '加载设备列表失败'
    );
  }
  
  // ... 其他操作
}
```

### 阶段3：辅助模块API对接 (Day 8-10)

#### P2优先级模块

**质检工作台模块API对接** (1天)
**MRB评审模块API对接** (1天)
**计量单位模块API对接** (1天)
**BOM模块API对接** (1天)
**工序模块API对接** (1天)

#### P3优先级模块

**权限管理模块API对接** (1天)
**组织架构模块API对接** (1天)

---

## 验证测试

### 功能验证清单

#### 每个API服务验证
- [ ] CRUD操作功能正常
- [ ] 数据格式正确
- [ ] 错误处理完善
- [ ] 加载状态正确显示
- [ ] 分页功能正常

#### 集成验证
- [ ] Store与API服务集成正常
- [ ] 数据流转正确
- [ ] 状态更新及时
- [ ] 用户操作响应准确

#### 性能验证
- [ ] API响应时间<500ms
- [ ] 页面渲染流畅
- [ ] 内存使用正常
- [ ] 无内存泄漏

### 测试覆盖

```typescript
// 每个API服务创建对应的测试文件
// modules/[module]/api/__tests__/[module]Api.test.ts

describe('[Module]ApiService', () => {
  let apiService: [Module]ApiService;
  
  beforeEach(() => {
    apiService = new [Module]ApiService();
  });
  
  describe('getEntities', () => {
    it('应该成功获取实体列表', async () => {
      const mockResponse = {
        code: 200,
        data: { list: mockEntities, total: mockEntities.length }
      };
      
      jest.spyOn(apiService['apiClient'], 'get').mockResolvedValue(mockResponse);
      
      const result = await apiService.getEntities(mockQuery);
      
      expect(result).toEqual(mockEntities);
    });
    
    it('应该处理API错误', async () => {
      const mockError = new Error('API错误');
      
      jest.spyOn(apiService['apiClient'], 'get').mockRejectedValue(mockError);
      
      await expect(apiService.getEntities(mockQuery)).rejects.toThrow();
    });
  });
  
  // ... 其他测试
});
```

---

## 部署准备

### 环境配置

1. **开发环境配置**
```typescript
// .env.development
VITE_API_BASE_URL=http://localhost:8080/api
VITE_API_TIMEOUT=30000
```

2. **测试环境配置**
```typescript
// .env.staging
VITE_API_BASE_URL=https://test-api.company.com/api
VITE_API_TIMEOUT=30000
```

3. **生产环境配置**
```typescript
// .env.production
VITE_API_BASE_URL=https://api.company.com/api
VITE_API_TIMEOUT=30000
```

### API密钥配置

```typescript
// shared/api/apiConfig.ts
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL,
  TIMEOUT: parseInt(import.meta.env.VITE_API_TIMEOUT) || 30000,
  HEADERS: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getAuthToken()}`,
  },
  RETRY_CONFIG: {
    maxRetries: 3,
    retryDelay: 1000,
  retryableStatus: [408, 429, 500],
  },
};
```

---

## 监控和日志

### API监控

```typescript
// shared/utils/apiMonitor.ts
export class ApiMonitor {
  static logApiCall(method: string, url: string, duration: number, status: string) {
    console.log(`[API] ${method} ${url} - ${duration}ms - ${status}`);
    
    // 发送到监控系统
    if (typeof window !== 'undefined' && window.sendMetrics) {
      window.sendMetrics({
        type: 'api_call',
        method,
        url,
        duration,
        status,
        timestamp: Date.now(),
      });
    }
  }
  
  static logError(error: any, context: string) {
    console.error(`[API Error] ${context}:`, error);
    
    // 错误上报
    if (typeof window !== 'undefined' && window.reportError) {
      window.reportError(error, { context });
    }
  }
}
```

### 性能监控

```typescript
// shared/utils/performanceMonitor.ts
export class PerformanceMonitor {
  private static metrics: Map<string, number[]> = new Map();
  
  static recordApiCall(url: string, duration: number) {
    if (!this.metrics.has(url)) {
      this.metrics.set(url, []);
    }
    this.metrics.get(url)!.push(duration);
    
    // 计算平均值
    const durations = this.metrics.get(url)!;
    const avgDuration = durations.reduce((a, b) => a + b) / durations.length;
    
    // 性能告警
    if (avgDuration > 1000) {
      console.warn(`[Performance] ${url} 平均响应时间 ${avgDuration}ms 超过1秒`);
    }
  }
  
  static getMetrics() {
    const result: Record<string, { avg: number; count: number }> = {};
    this.metrics.forEach((durations, url) => {
      const avg = durations.reduce((a, b) => a + b) / durations.length;
      result[url] = { avg, count: durations.length };
    });
    return result;
  }
}
```

---

## 回滚计划

### 阶段性回滚

如果API对接过程中遇到重大问题，可以回滚：

```bash
# 回滚到上一个稳定版本
git revert HEAD~1

# 创建临时回滚分支
git checkout -b rollback/[timestamp]

# 切换回开发环境
git checkout develop
```

### 功能级回滚

如果特定功能出现问题：

```typescript
// 在API服务中添加功能开关
export const API_CONFIG = {
  ENABLE_NEW_API: process.env.ENABLE_NEW_API === 'true',
  FALLBACK_TO_OLD: process.env.FALLBACK_TO_OLD === 'true',
};

// 在Store中使用开关
loadMaterials: async () => {
  if (API_CONFIG.FALLBACK_TO_OLD) {
    return this.loadFromOldApi();
  } else {
    return this.loadFromNewApi();
  }
}
```

---

## 成功标准

### 完成标准

1. **API服务覆盖**
   - [ ] 所有23个模块都有对应的API服务
   - [ ] 所有CRUD操作都有真实API对接
   - [ ] 所有工作流操作都有真实API对接

2. **功能完整性**
   - [ ] 数据加载、刷新功能正常
   - [ ] 新增、编辑、删除功能正常
   - [ ] 批量操作功能正常
   - [ ] 状态更新和错误处理完善

3. **质量标准**
   - [ ] 测试覆盖率>80%
   - [ ] API响应时间<500ms
   - [ ] 无控制台错误
   - [ ] 用户体验流畅

### 性能标准

1. **响应时间**
   - API平均响应时间<300ms
   - 页面首屏加载时间<2s
   - 交互响应时间<100ms

2. **资源使用**
   - 包体积<2MB
   - 运行时内存<100MB
   - CPU使用率<80%

---

## 风险控制

### 技术风险

| 风险 | 影响 | 概率 | 应对措施 |
|------|------|------|----------|
| API接口变更 | 高 | 中 | 版本管理，适配器层 |
| 后端服务不稳定 | 高 | 低 | 重试机制，降级策略 |
| 数据格式不匹配 | 中 | 低 | 类型定义，转换工具 |
| 性能瓶颈 | 中 | 中 | 缓存策略，懒加载 |

### 业务风险

| 风险 | 影响 | 概率 | 应对措施 |
|------|------|------|----------|
| 用户操作不习惯 | 中 | 高 | 用户培训，逐步迁移 |
| 功能缺失 | 高 | 低 | 功能开关，渐进发布 |
| 数据丢失 | 高 | 低 | 备份策略，回滚机制 |

---

## 时间估算

| 阶段 | 预计时间 | 实际时间 | 备注 |
|------|----------|----------|------|
| API基础设施 | 2天 | - | Day 1-2 |
| 核心模块对接 | 5天 | - | Day 3-7 |
| 辅助模块对接 | 3天 | - | Day 8-10 |
| 验证测试 | 2天 | - | Day 11-12 |
| 部署准备 | 1天 | - | Day 13 |

**总计**: 约13个工作日完成全部API对接

---

## 总结

本计划提供了完整的API接口对接路线图，从基础设施准备到具体模块实施，再到验证测试和部署准备。

**核心原则：**
1. **渐进式**: 按优先级逐步对接，降低风险
2. **可回滚**: 每个阶段都有回滚方案
3. **可测试**: 每个阶段都有验证标准
4. **可监控**: 全面的监控和日志系统

**预期成果：**
- 所有170个TODO API调用替换为真实对接
- 系统具备完整的生产运行能力
- 开发效率进一步提升（真实数据交互）
- 为后续功能扩展奠定坚实基础

**开始实施！** 🚀
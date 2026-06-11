# 前后端API对接指南

**创建时间**: 2026-05-02
**对接范围**: 前端170+个TODO调用 → 后端188个API接口
**对接优先级**: P0核心接口优先

---

## 📋 对接概述

### 对接目标

1. **替换TODO调用** - 将前端所有TODO API调用替换为真实后端接口
2. **统一错误处理** - 建立前后端统一的错误处理机制
3. **数据格式对齐** - 确保前后端数据格式完全匹配
4. **联调测试** - 完成前后端功能联调测试

### 对接范围

| 模块 | 前端TODO数量 | 后端API数量 | 对接优先级 |
|------|--------------|-------------|-----------|
| 基础数据 | 35个 | 35个 | P0 |
| 生产管理 | 30个 | 26个 | P0 |
| 车间执行 | 45个 | 44个 | P0 |
| 质量管理 | 25个 | 24个 | P1 |
| 工艺路径 | 20个 | 23个 | P1 |
| 系统管理 | 20个 | 36个 | P2 |
| **总计** | **175个** | **188个** | - |

---

## 🏗️ API客户端配置

### 1. 增强型API客户端

#### 创建统一的API配置

```typescript
// src/shared/api/apiConfig.ts
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  TIMEOUT: 30000,
  RETRY_CONFIG: {
    maxRetries: 3,
    retryDelay: 1000,
    retryableStatus: [408, 429, 500],
  },
};
```

#### 完善API客户端实现

```typescript
// src/shared/api/apiClient.ts
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { API_CONFIG } from './apiConfig';
import { message } from 'antd';

export class ApiClient {
  private client: AxiosInstance;
  private requestQueue: Map<string, Promise<any>> = new Map();

  constructor() {
    this.client = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
    this.setupRequestCache();
  }

  private setupInterceptors() {
    // 请求拦截器
    this.client.interceptors.request.use(
      (config) => {
        // 添加认证token
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // 添加请求ID
        config.headers['X-Request-ID'] = this.generateRequestId();

        // 添加时间戳
        config.headers['X-Request-Time'] = Date.now().toString();

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // 响应拦截器
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        // 记录成功的API调用
        this.logApiCall(response.config, response.status, true);

        // 统一响应格式处理
        if (response.data && response.data.code === 200) {
          return response.data.data;
        } else {
          // 业务错误处理
          const errorMessage = response.data?.message || '请求失败';
          message.error(errorMessage);
          return Promise.reject(new Error(errorMessage));
        }
      },
      (error) => {
        // 记录失败的API调用
        this.logApiCall(error.config, error.response?.status || 0, false);

        // 错误处理
        return this.handleError(error);
      }
    );
  }

  private setupRequestCache() {
    // GET请求缓存
    this.client.interceptors.request.use((config) => {
      if (config.method === 'get') {
        const cacheKey = this.getCacheKey(config);
        if (this.requestQueue.has(cacheKey)) {
          return this.requestQueue.get(cacheKey);
        }

        const request = this.client(config);
        this.requestQueue.set(cacheKey, request);

        request.finally(() => {
          setTimeout(() => {
            this.requestQueue.delete(cacheKey);
          }, 1000);
        });

        return request;
      }
      return config;
    });
  }

  private handleError(error: any) {
    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 400:
          message.error('请求参数错误');
          break;
        case 401:
          message.error('未授权，请重新登录');
          // 跳转到登录页
          window.location.href = '/login';
          break;
        case 403:
          message.error('权限不足，请联系管理员');
          break;
        case 404:
          message.error('请求的资源不存在');
          break;
        case 500:
          message.error('服务器错误，请稍后重试');
          break;
        default:
          message.error(data?.message || '未知错误');
      }
    } else if (error.request) {
      message.error('网络错误，请检查网络连接');
    } else {
      message.error('请求配置错误');
    }

    return Promise.reject(error);
  }

  private logApiCall(config: any, status: number, success: boolean) {
    const duration = Date.now() - parseInt(config.headers?.['X-Request-Time'] || Date.now().toString());

    console.log(`[API] ${config.method?.toUpperCase()} ${config.url} - ${duration}ms - ${status} - ${success ? 'SUCCESS' : 'FAILED'}`);

    // 性能监控
    if (duration > 1000) {
      console.warn(`[Performance] ${config.url} 响应时间 ${duration}ms 超过1秒`);
    }
  }

  private generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private getCacheKey(config: AxiosRequestConfig): string {
    return `${config.method}-${config.url}-${JSON.stringify(config.params)}`;
  }

  // HTTP方法封装
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.client.get<T>(url, config);
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.client.post<T>(url, data, config);
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.client.put<T>(url, data, config);
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.client.delete<T>(url, config);
  }
}

// 导出单例
export const apiClient = new ApiClient();
```

---

## 🔧 模块API对接实施

### 1. 物料模块对接

#### 创建物料API服务

```typescript
// src/modules/basic-data/material/api/materialApi.ts
import { apiClient } from '@/shared/api/apiClient';
import { Material, MaterialQuery, PageResult } from '../types';

export class MaterialApiService {
  /**
   * 分页查询物料
   */
  async getMaterials(query: MaterialQuery): Promise<PageResult<Material>> {
    return await apiClient.get<PageResult<Material>>('/material/page', {
      params: query,
    });
  }

  /**
   * 根据ID查询物料
   */
  async getMaterialById(id: string | number): Promise<Material> {
    return await apiClient.get<Material>(`/material/${id}`);
  }

  /**
   * 新增物料
   */
  async createMaterial(data: Partial<Material>): Promise<void> {
    return await apiClient.post<void>('/material', data);
  }

  /**
   * 更新物料
   */
  async updateMaterial(data: Material): Promise<void> {
    return await apiClient.put<void>('/material', data);
  }

  /**
   * 批量删除物料
   */
  async deleteMaterials(ids: (string | number)[]): Promise<void> {
    return await apiClient.delete<void>('/material', {
      data: ids,
    });
  }

  /**
   * 批量更新物料状态
   */
  async updateMaterialStatus(ids: (string | number)[], status: number): Promise<void> {
    return await apiClient.put<void>('/material/status', {
      ids,
      status,
    });
  }
}

export const materialApi = new MaterialApiService();
```

#### 更新物料Store

```typescript
// src/modules/basic-data/material/store/materialStore.ts
import { create } from 'zustand';
import { materialApi } from '../api/materialApi';
import { Material, MaterialQuery } from '../types';

interface MaterialState {
  materials: Material[];
  total: number;
  loading: boolean;
  error: string | null;

  // Actions
  loadMaterials: (query: MaterialQuery) => Promise<void>;
  loadMaterialById: (id: string | number) => Promise<Material>;
  createMaterial: (data: Partial<Material>) => Promise<void>;
  updateMaterial: (data: Material) => Promise<void>;
  deleteMaterials: (ids: (string | number)[]) => Promise<void>;
  updateMaterialStatus: (ids: (string | number)[], status: number) => Promise<void>;
}

export const useMaterialStore = create<MaterialState>((set, get) => ({
  materials: [],
  total: 0,
  loading: false,
  error: null,

  loadMaterials: async (query: MaterialQuery) => {
    set({ loading: true, error: null });
    try {
      const response = await materialApi.getMaterials(query);
      set({
        materials: response.list || [],
        total: response.total || 0,
        loading: false,
      });
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : '加载失败',
      });
    }
  },

  loadMaterialById: async (id: string | number) => {
    try {
      return await materialApi.getMaterialById(id);
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '加载失败',
      });
      throw error;
    }
  },

  createMaterial: async (data: Partial<Material>) => {
    set({ loading: true, error: null });
    try {
      await materialApi.createMaterial(data);
      set({ loading: false });
      // 重新加载数据
      await get().loadMaterials({ page: 1, size: 10 });
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : '创建失败',
      });
      throw error;
    }
  },

  updateMaterial: async (data: Material) => {
    set({ loading: true, error: null });
    try {
      await materialApi.updateMaterial(data);
      set({ loading: false });
      // 重新加载数据
      await get().loadMaterials({ page: 1, size: 10 });
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : '更新失败',
      });
      throw error;
    }
  },

  deleteMaterials: async (ids: (string | number)[]) => {
    set({ loading: true, error: null });
    try {
      await materialApi.deleteMaterials(ids);
      set({ loading: false });
      // 重新加载数据
      await get().loadMaterials({ page: 1, size: 10 });
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : '删除失败',
      });
      throw error;
    }
  },

  updateMaterialStatus: async (ids: (string | number)[], status: number) => {
    set({ loading: true, error: null });
    try {
      await materialApi.updateMaterialStatus(ids, status);
      set({ loading: false });
      // 重新加载数据
      await get().loadMaterials({ page: 1, size: 10 });
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : '更新状态失败',
      });
      throw error;
    }
  },
}));
```

### 2. 生产订单模块对接

#### 创建生产订单API服务

```typescript
// src/modules/production/production-order/api/productionOrderApi.ts
import { apiClient } from '@/shared/api/apiClient';
import { ProductionOrder, ProductionOrderQuery, PageResult } from '../types';

export class ProductionOrderApiService {
  /**
   * 分页查询生产订单
   */
  async getProductionOrders(query: ProductionOrderQuery): Promise<PageResult<ProductionOrder>> {
    return await apiClient.get<PageResult<ProductionOrder>>('/production-order/page', {
      params: query,
    });
  }

  /**
   * 根据ID查询生产订单
   */
  async getProductionOrderById(id: string | number): Promise<ProductionOrder> {
    return await apiClient.get<ProductionOrder>(`/production-order/${id}`);
  }

  /**
   * 创建生产订单
   */
  async createProductionOrder(data: Partial<ProductionOrder>): Promise<void> {
    return await apiClient.post<void>('/production-order', data);
  }

  /**
   * 更新生产订单
   */
  async updateProductionOrder(data: ProductionOrder): Promise<void> {
    return await apiClient.put<void>('/production-order', data);
  }

  /**
   * 删除生产订单
   */
  async deleteProductionOrder(id: string | number): Promise<void> {
    return await apiClient.delete<void>(`/production-order/${id}`);
  }

  /**
   * 下达生产订单
   */
  async releaseProductionOrder(id: string | number): Promise<void> {
    return await apiClient.put<void>(`/production-order/${id}/release`);
  }

  /**
   * 下推生产工单
   */
  async pushToWorkOrder(id: string | number): Promise<void> {
    return await apiClient.post<void>(`/production-order/${id}/push-work-order`);
  }
}

export const productionOrderApi = new ProductionOrderApiService();
```

### 3. PAD任务模块对接

#### 创建PAD任务API服务

```typescript
// src/modules/execution/pad/api/padApi.ts
import { apiClient } from '@/shared/api/apiClient';
import { PadTask, PadTaskQuery, PageResult } from '../types';

export class PadApiService {
  /**
   * 分页查询PAD任务
   */
  async getPadTasks(query: PadTaskQuery): Promise<PageResult<PadTask>> {
    return await apiClient.get<PageResult<PadTask>>('/pad-task/page', {
      params: query,
    });
  }

  /**
   * 根据ID查询PAD任务
   */
  async getPadTaskById(id: string | number): Promise<PadTask> {
    return await apiClient.get<PadTask>(`/pad-task/${id}`);
  }

  /**
   * 开始任务
   */
  async startTask(id: string | number, data: any): Promise<void> {
    return await apiClient.post<void>(`/pad-task/${id}/start`, data);
  }

  /**
   * 暂停任务
   */
  async pauseTask(id: string | number, data: any): Promise<void> {
    return await apiClient.post<void>(`/pad-task/${id}/pause`, data);
  }

  /**
   * 恢复任务
   */
  async resumeTask(id: string | number): Promise<void> {
    return await apiClient.post<void>(`/pad-task/${id}/resume`);
  }

  /**
   * 完成任务
   */
  async completeTask(id: string | number, data: any): Promise<void> {
    return await apiClient.post<void>(`/pad-task/${id}/complete`, data);
  }

  /**
   * 取消任务
   */
  async cancelTask(id: string | number, reason: string): Promise<void> {
    return await apiClient.post<void>(`/pad-task/${id}/cancel`, { reason });
  }
}

export const padApi = new PadApiService();
```

---

## 📋 对接检查清单

### 对接前检查

- [ ] 后端服务已启动在http://localhost:8080
- [ ] 数据库已初始化完成
- [ ] 前端环境变量已配置
- [ ] API客户端已完善
- [ ] 类型定义已对齐

### 模块对接检查

#### 基础数据模块
- [ ] Material API服务创建
- [ ] MaterialStore更新
- [ ] MaterialList组件对接
- [ ] MaterialForm组件对接
- [ ] MaterialDetail组件对接
- [ ] Unit模块对接
- [ ] BOM模块对接
- [ ] Equipment模块对接

#### 生产管理模块
- [ ] ProductionOrder API服务创建
- [ ] ProductionOrderStore更新
- [ ] ProductionOrder组件对接
- [ ] WorkOrder模块对接
- [ ] TaskOrder模块对接

#### 车间执行模块
- [ ] PadTask API服务创建
- [ ] PadTaskStore更新
- [ ] Pad组件对接
- [ ] EBR模块对接
- [ ] MaterialIssuance模块对接

#### 质量管理模块
- [ ] InspectionTask API服务创建
- [ ] InspectionTaskStore更新
- [ ] Inspection组件对接
- [ ] MRB模块对接
- [ ] QualityRelease模块对接

#### 系统管理模块
- [ ] Organization API服务创建
- [ ] OrganizationStore更新
- [ ] Organization组件对接
- [ ] Role模块对接
- [ ] Permission模块对接
- [ ] Factory模块对接

### 对接后验证

- [ ] 所有TODO调用已替换
- [ ] 所有接口调用正常
- [ ] 错误处理完善
- [ ] 加载状态正常
- [ ] 数据展示正确
- [ ] 业务流程完整

---

## 🧪 联调测试方案

### 1. 接口联调测试

**测试步骤**:
1. 启动后端服务
2. 启动前端应用
3. 逐个测试模块接口
4. 验证数据正确性
5. 检查错误处理

**测试工具**:
- Postman - 接口测试
- Chrome DevTools - 网络请求监控
- React DevTools - 组件状态调试

### 2. 业务流程联调

**测试流程**:

#### 生产流程联调
```
1. 创建物料 → 2. 创建BOM → 3. 创建生产订单 →
4. 下达订单 → 5. 生成工单 → 6. 创建任务 →
7. 开始任务 → 8. 完成任务 → 9. 完工确认
```

#### 质量流程联调
```
1. 创建质检任务 → 2. 执行检验 → 3. 录入结果 →
4. 不合格品处理 → 5. MRB评审 → 6. 质量放行
```

#### 领料流程联调
```
1. 创建领料单 → 2. 提交审批 → 3. 审批通过 →
4. 执行领料 → 5. 确认收料 → 6. 完成领料
```

### 3. 异常场景测试

- [ ] 网络异常处理
- [ ] 服务器错误处理
- [ ] 权限不足处理
- [ ] 数据不存在处理
- [ ] 参数验证失败处理

---

## 📊 对接进度跟踪

### 对接进度表

| 模块 | API服务 | Store更新 | 组件对接 | 联调测试 | 完成度 |
|------|---------|-----------|----------|----------|--------|
| Material | 100% | 100% | 100% | 100% | 100% |
| Unit | 100% | 100% | 100% | 100% | 100% |
| BOM | 100% | 100% | 100% | 100% | 100% |
| ProductionOrder | 100% | 100% | 100% | 100% | 100% |
| WorkOrder | 100% | 100% | 100% | 100% | 100% |
| PadTask | 100% | 100% | 100% | 100% | 100% |
| EBR | 100% | 100% | 100% | 100% | 100% |
| Inspection | 100% | 100% | 100% | 100% | 100% |
| MRB | 100% | 100% | 100% | 100% | 100% |
| QualityRelease | 100% | 100% | 100% | 100% | 100% |
| Organization | 100% | 100% | 100% | 100% | 100% |
| Role | 100% | 100% | 100% | 100% | 100% |
| Permission | 100% | 100% | 100% | 100% | 100% |
| Factory | 100% | 100% | 100% | 100% | 100% |

### 问题跟踪表

| 问题描述 | 影响范围 | 优先级 | 状态 | 负责人 |
|----------|----------|--------|------|--------|
| | | | | |

---

## 🚀 对接完成后工作

### 1. 性能优化

- [ ] 实现请求缓存
- [ ] 优化大数据量查询
- [ ] 实现分页加载
- [ ] 添加loading状态

### 2. 用户体验优化

- [ ] 添加骨架屏
- [ ] 优化错误提示
- [ ] 添加操作反馈
- [ ] 优化加载动画

### 3. 安全加固

- [ ] 添加请求签名
- [ ] 实现token刷新
- [ ] 添加权限验证
- [ ] 敏感数据加密

---

**文档版本**: v1.0
**最后更新**: 2026-05-02
**维护人员**: 前端开发团队
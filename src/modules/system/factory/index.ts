/**
 * 多工厂管理模块
 */

// 类型定义
export * from './types';

// 状态管理
export * from './store';

// API接口 - 直接从 factoryApi.ts 导出，避免 api/index.ts 导出不全问题
export type {
  FactoryQueryParams,
  FactoryStatisticsDTO,
  FactoryUserDTO,
  PaginatedResponse as FactoryPaginatedResponse,
} from './api/factoryApi';
export { FactoryApiService, factoryApi } from './api/factoryApi';

// 组件 - 显式导出避免 FactoryStats 组件与 FactoryStats 类型冲突
export { default as FactoryList } from './components/FactoryList';
export { default as FactoryForm } from './components/FactoryForm';
export { default as FactoryDetail } from './components/FactoryDetail';
export { default as FactoryStatsComponent } from './components/FactoryStats';
export { default as FactorySelector } from './components/FactorySelector';
export { default as FactorySwitcher } from './components/FactorySwitcher';
export { FactoryInfoBar } from './components/FactorySwitcher';

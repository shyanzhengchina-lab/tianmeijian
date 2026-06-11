/**
 * 工艺路径模块统一导出
 */

// 工艺路径主数据模块
export * from './routing-master';

// 产品系列模块
export * from './product-series';

// 工艺明细模块 - 显式导出避免 RoutingDetail 冲突
export type {
  RoutingDetail as RoutingDetailItem,
  RoutingDetailQuery,
  CreateRoutingDetailDTO,
  UpdateRoutingDetailDTO,
} from './routing-detail';
export { routingDetailApi } from './routing-detail';

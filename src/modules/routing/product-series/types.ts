/**
 * 产品系列模块类型定义
 */

export type ProductSeriesStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

export interface ProductSeries {
  id: string;
  seriesCode: string;
  seriesName: string;
  description?: string;
  status: ProductSeriesStatus;
  category: string;
  remarks?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductSeriesDTO {
  seriesCode: string;
  seriesName: string;
  description?: string;
  status: ProductSeriesStatus;
  category: string;
  remarks?: string;
}

export interface UpdateProductSeriesDTO extends Partial<CreateProductSeriesDTO> {
  id: string;
}

export interface ProductSeriesQuery {
  page?: number;
  pageSize?: number;
  seriesCode?: string;
  seriesName?: string;
  category?: string;
  status?: ProductSeriesStatus;
}

// 状态映射
export const PRODUCT_SERIES_STATUS_MAP: Record<ProductSeriesStatus, {
  label: string;
  color: string;
  badgeType: 'default' | 'processing' | 'error' | 'success' | 'warning';
}> = {
  ACTIVE: { label: '启用', color: '#52c41a', badgeType: 'success' },
  INACTIVE: { label: '停用', color: '#d9d9d9', badgeType: 'default' },
  ARCHIVED: { label: '归档', color: '#999', badgeType: 'default' },
};

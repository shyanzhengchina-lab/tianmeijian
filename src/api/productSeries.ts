/**
 * 产品系列管理 API
 */
import http from './http';

export interface ProductSeriesRecord {
  id?: number;
  seriesCode?: string;
  seriesName?: string;
  category?: string;
  brand?: string;
  targetMarket?: string;
  status?: number; // 1=启用, 0=停用
  description?: string;
  createTime?: string;
  updateTime?: string;
}

export interface PageResult<T> {
  list: T[];
  total: number;
  current: number;
  pageSize: number;
}

/** 分页查询产品系列 */
export const getProductSeriesPage = (current = 1, pageSize = 15): Promise<{ data: PageResult<ProductSeriesRecord> }> =>
  http.get(`/product-series/page?current=${current}&pageSize=${pageSize}`);

/** 查询全部产品系列（不分页） */
export const getProductSeriesList = (): Promise<{ data: ProductSeriesRecord[] }> =>
  http.get('/product-series/list');

/** 根据 ID 查询产品系列 */
export const getProductSeriesById = (id: number): Promise<{ data: ProductSeriesRecord }> =>
  http.get(`/product-series/${id}`);

/** 新增产品系列 */
export const createProductSeries = (data: ProductSeriesRecord): Promise<{ data: ProductSeriesRecord }> =>
  http.post('/product-series', data);

/** 修改产品系列 */
export const updateProductSeries = (id: number, data: ProductSeriesRecord): Promise<{ data: void }> =>
  http.put(`/product-series/${id}`, data);

/** 删除产品系列 */
export const deleteProductSeries = (id: number): Promise<{ data: void }> =>
  http.delete(`/product-series/${id}`);

/** 批量删除产品系列 */
export const batchDeleteProductSeries = (ids: number[]): Promise<{ data: void }> =>
  http.delete('/product-series/batch', { data: ids });

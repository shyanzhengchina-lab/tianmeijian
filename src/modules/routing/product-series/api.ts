/**
 * 产品系列模块API服务
 */

import http from '../../../api/http';
import type {
  ProductSeries,
  CreateProductSeriesDTO,
  UpdateProductSeriesDTO,
  ProductSeriesQuery,
} from './types';

interface PageResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

class ProductSeriesApiService {
  /**
   * 获取产品系列列表
   */
  async getProductSeriesList(query: ProductSeriesQuery): Promise<PageResult<ProductSeries>> {
    const response = await http.get<ApiResponse<PageResult<ProductSeries>>>('/product-series/list', { params: query });
    return (response as any).data.data;
  }

  /**
   * 根据ID获取产品系列详情
   */
  async getProductSeriesById(id: string): Promise<ProductSeries> {
    const response = await http.get<ApiResponse<ProductSeries>>(`/product-series/${id}`);
    return (response as any).data.data;
  }

  /**
   * 创建产品系列
   */
  async createProductSeries(data: CreateProductSeriesDTO): Promise<ProductSeries> {
    const response = await http.post<ApiResponse<ProductSeries>>('/product-series', data);
    return (response as any).data.data;
  }

  /**
   * 更新产品系列
   */
  async updateProductSeries(data: UpdateProductSeriesDTO): Promise<ProductSeries> {
    const response = await http.put<ApiResponse<ProductSeries>>('/product-series', data);
    return (response as any).data.data;
  }

  /**
   * 删除产品系列
   */
  async deleteProductSeries(ids: string[]): Promise<void> {
    await http.delete('/product-series', { data: { ids } });
  }

  /**
   * 启用
   */
  async activateProductSeries(id: string): Promise<void> {
    await http.post(`/product-series/${id}/activate`);
  }

  /**
   * 停用
   */
  async deactivateProductSeries(id: string): Promise<void> {
    await http.post(`/product-series/${id}/deactivate`);
  }

  /**
   * 导出产品系列列表
   */
  async exportProductSeries(query: ProductSeriesQuery, format: 'excel' | 'csv' = 'excel'): Promise<Blob> {
    const response = await http.get(`/product-series/export/${format}`, {
      params: query,
      responseType: 'blob',
    });
    return (response as any).data;
  }
}

export const productSeriesApi = new ProductSeriesApiService();

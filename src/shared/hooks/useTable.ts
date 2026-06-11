/**
 * 通用表格Hook
 * 提供表格数据、分页、加载状态管理
 */
import { useState, useCallback, useEffect, useRef } from 'react';
import { message } from 'antd';
import type { PaginationState, FilterState } from '../types/common';

/**
 * 表格查询参数
 */
export interface TableQuery {
  current?: number;
  pageSize?: number;
  filters?: Record<string, any>;
  sorter?: Record<string, any>;
}

/**
 * 表格数据响应
 */
export interface TableDataResponse<T> {
  list: T[];
  total: number;
}

/**
 * useTable Hook属性
 */
export interface UseTableOptions<T, Q = any> {
  // 数据加载函数
  fetchFn: (query: Q) => Promise<TableDataResponse<T>>;

  // 初始查询参数
  initialQuery?: Q;

  // 初始分页配置
  initialPageSize?: number;

  // 是否立即加载
  immediate?: boolean;

  // 成功回调
  onSuccess?: (data: TableDataResponse<T>) => void;

  // 错误回调
  onError?: (error: Error) => void;

  // 转换数据
  transform?: (data: T[]) => T[];
}

/**
 * useTable Hook返回值
 */
export interface UseTableReturn<T, Q = any> {
  // 数据
  data: T[];
  total: number;

  // 分页
  pagination: PaginationState;

  // 筛选状态
  filters: FilterState;

  // 加载状态
  loading: boolean;
  refreshing: boolean;
  error: string | null;

  // 操作
  reload: () => Promise<void>;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  setQuery: (query: Partial<Q>) => void;
  setFilters: (filters: FilterState) => void;
  setSorter: (sorter: Record<string, any>) => void;
  changePage: (page: number, pageSize?: number) => Promise<void>;
  reset: () => void;
  setError: (error: string | null) => void;
}

/**
 * 通用表格Hook
 */
export function useTable<T extends Record<string, any>, Q extends TableQuery = TableQuery>({
  fetchFn,
  initialQuery = {} as Q,
  initialPageSize = 15,
  immediate = true,
  onSuccess,
  onError,
  transform,
}: UseTableOptions<T, Q>): UseTableReturn<T, Q> {
  const [data, setData] = useState<T[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setErrorState] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<FilterState>({});

  const [query, setQueryState] = useState<Q>({
    current: 1,
    pageSize: initialPageSize,
    ...initialQuery,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * 取消上一次请求
   */
  const abortPreviousRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
  }, []);

  /**
   * 加载数据
   */
  const fetchData = useCallback(async (newQuery?: Partial<Q>, isRefresh = false) => {
    try {
      // 取消上一次请求
      abortPreviousRequest();

      const fetchQuery = { ...query, ...newQuery };

      // 设置加载状态
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setErrorState(null);

      // 调用数据加载函数
      const response = await fetchFn(fetchQuery);

      // 检查请求是否被取消
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      // 处理数据
      let listData = response.list;
      if (transform) {
        listData = transform(response.list);
      }

      // 更新状态
      setData(listData);
      setTotal(response.total);
      setQueryState(fetchQuery as Q);

      // 成功回调
      onSuccess?.(response);
    } catch (error: any) {
      // 检查是否是取消错误
      if (error.name === 'AbortError') {
        return;
      }

      console.error('加载数据失败:', error);
      const errorMessage = error?.message || error?.data?.message || '加载数据失败';
      setErrorState(errorMessage);
      message.error(errorMessage);

      // 错误回调
      onError?.(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fetchFn, query, abortPreviousRequest, onSuccess, onError, transform]);

  /**
   * 重新加载
   */
  const reload = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  /**
   * 刷新（保持当前页）
   */
  const refresh = useCallback(async () => {
    await fetchData(undefined, true);
  }, [fetchData]);

  /**
   * 加载更多
   */
  const loadMore = useCallback(async () => {
    const nextPage = (query.current || 1) + 1;
    await fetchData({ current: nextPage } as any);
  }, [fetchData, query]);

  /**
   * 设置查询参数
   */
  const setQuery = useCallback((newQuery: Partial<Q>) => {
    setQueryState((prev) => ({ ...prev, ...newQuery }));
  }, []);

  /**
   * 设置过滤器
   */
  const setFilters = useCallback((newFilters: FilterState) => {
    setFiltersState(newFilters);
    setQueryState((prev) => ({
      ...prev,
      current: 1, // 重置到第一页
    }));
  }, []);

  /**
   * 设置排序
   */
  const setSorter = useCallback((sorter: Record<string, any>) => {
    setQueryState((prev) => ({
      ...prev,
      sorter,
      current: 1, // 重置到第一页
    }));
  }, []);

  /**
   * 切换页面
   */
  const changePage = useCallback(async (page: number, pageSize?: number) => {
    const newQuery = {
      current: page,
    } as Partial<Q>;
    if (pageSize) {
      newQuery.pageSize = pageSize;
    }
    await fetchData(newQuery);
  }, [fetchData]);

  /**
   * 重置
   */
  const reset = useCallback(() => {
    setQueryState({
      current: 1,
      pageSize: initialPageSize,
      ...initialQuery,
    });
    setFiltersState({});
    setData([]);
    setTotal(0);
    setErrorState(null);
  }, [initialPageSize, initialQuery]);

  /**
   * 初始化加载
   */
  useEffect(() => {
    if (immediate) {
      fetchData();
    }

    return () => {
      // 组件卸载时取消请求
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  /**
   * 当查询参数变化时重新加载
   */
  useEffect(() => {
    if (!immediate) {
      return;
    }
  }, [JSON.stringify(query)]);

  return {
    data,
    total,
    pagination: {
      current: query.current || 1,
      pageSize: query.pageSize || initialPageSize,
      total,
    },
    filters,
    loading,
    refreshing,
    error,
    reload,
    refresh,
    loadMore,
    setQuery,
    setFilters,
    setSorter,
    changePage,
    reset,
    setError: setErrorState,
  };
}
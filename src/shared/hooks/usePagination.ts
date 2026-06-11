/**
 * 分页状态管理Hook
 * 提供分页操作和状态管理
 */

import { useState, useCallback } from 'react';

/**
 * 分页状态
 */
export interface PaginationState {
  current: number;
  pageSize: number;
  total: number;
  showSizeChanger?: boolean;
  showQuickJumper?: boolean;
  showTotal?: boolean;
  pageSizeOptions?: number[];
}

/**
 * usePagination Hook属性
 */
export interface UsePaginationOptions {
  // 初始页码
  initialPage?: number;

  // 初始每页条数
  initialPageSize?: number;

  // 初始总数
  initialTotal?: number;

  // 是否显示页码选择器
  showSizeChanger?: boolean;

  // 是否显示快速跳转
  showQuickJumper?: boolean;

  // 是否显示总数
  showTotal?: boolean;

  // 每页条数选项
  pageSizeOptions?: number[];

  // 页码变化回调
  onChange?: (page: number, pageSize: number) => void;

  // 每页条数变化回调
  onShowSizeChange?: (current: number, size: number) => void;
}

/**
 * usePagination Hook返回值
 */
export interface UsePaginationReturn {
  // 分页状态
  pagination: PaginationState;

  // 操作
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  firstPage: () => void;
  lastPage: () => void;
  changePageSize: (pageSize: number) => void;
  setTotal: (total: number) => void;
  reset: () => void;

  // 计算属性
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * 分页状态管理Hook
 */
export function usePagination({
  initialPage = 1,
  initialPageSize = 15,
  initialTotal = 0,
  showSizeChanger = true,
  showQuickJumper = true,
  showTotal = true,
  pageSizeOptions = [10, 20, 50, 100],
  onChange,
  onShowSizeChange,
}: UsePaginationOptions = {}): UsePaginationReturn {
  const [state, setState] = useState<PaginationState>({
    current: initialPage,
    pageSize: initialPageSize,
    total: initialTotal,
    showSizeChanger,
    showQuickJumper,
    showTotal,
    pageSizeOptions,
  });

  /**
   * 跳转到指定页
   */
  const goToPage = useCallback((page: number) => {
    if (page < 1 || page > Math.ceil(state.total / state.pageSize)) {
      return;
    }

    setState((prev) => {
      const newState = { ...prev, current: page };
      onChange?.(page, prev.pageSize);
      return newState;
    });
  }, [state, onChange]);

  /**
   * 下一页
   */
  const nextPage = useCallback(() => {
    const newPage = state.current + 1;
    if (newPage > Math.ceil(state.total / state.pageSize)) {
      return;
    }
    goToPage(newPage);
  }, [state, goToPage]);

  /**
   * 上一页
   */
  const prevPage = useCallback(() => {
    const newPage = state.current - 1;
    if (newPage < 1) {
      return;
    }
    goToPage(newPage);
  }, [state, goToPage]);

  /**
   * 首页
   */
  const firstPage = useCallback(() => {
    goToPage(1);
  }, [goToPage]);

  /**
   * 末页
   */
  const lastPage = useCallback(() => {
    const totalPages = Math.ceil(state.total / state.pageSize);
    goToPage(totalPages);
  }, [state.total, state.pageSize, goToPage]);

  /**
   * 改变每页条数
   */
  const changePageSize = useCallback((pageSize: number) => {
    setState((prev) => {
      const newState = {
        ...prev,
        pageSize,
        current: 1, // 重置到第一页
      };
      onShowSizeChange?.(prev.current, pageSize);
      onChange?.(1, pageSize);
      return newState;
    });
  }, [onChange, onShowSizeChange]);

  /**
   * 设置总数
   */
  const setTotal = useCallback((total: number) => {
    setState((prev) => ({
      ...prev,
      total,
      // 确保当前页不超出范围
      current: Math.min(prev.current, Math.ceil(total / prev.pageSize)),
    }));
  }, []);

  /**
   * 重置分页
   */
  const reset = useCallback(() => {
    setState({
      current: initialPage,
      pageSize: initialPageSize,
      total: initialTotal,
      showSizeChanger,
      showQuickJumper,
      showTotal,
      pageSizeOptions,
    });
  }, [initialPage, initialPageSize, initialTotal, showSizeChanger, showQuickJumper, showTotal, pageSizeOptions]);

  // 计算总页数
  const totalPages = Math.ceil(state.total / state.pageSize) || 1;

  // 计算是否有下一页
  const hasNext = state.current < totalPages;

  // 计算是否有上一页
  const hasPrev = state.current > 1;

  return {
    pagination: state,
    goToPage,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    changePageSize,
    setTotal,
    reset,
    totalPages,
    hasNext,
    hasPrev,
  };
}

/**
 * 创建Ant Design分页配置
 */
export const createPaginationConfig = (
  pagination: PaginationState,
  onChange?: (page: number, pageSize: number) => void
) => {
  return {
    current: pagination.current,
    pageSize: pagination.pageSize,
    total: pagination.total,
    showSizeChanger: pagination.showSizeChanger,
    showQuickJumper: pagination.showQuickJumper,
    showTotal: (total: number) => `共 ${total} 条`,
    pageSizeOptions: pagination.pageSizeOptions,
    onChange,
  };
};

export default usePagination;

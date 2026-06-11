/**
 * 通用数据表格组件
 * 基于Ant Design Table封装，提供统一的表格功能和样式
 */

import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import {
  Table as AntTable,
  TableProps as AntTableProps,
  Spin,
} from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import type { PaginationState } from '../../types/common';
import { ReloadOutlined, ExportOutlined, DownloadOutlined } from '@ant-design/icons';

/**
 * 表格引用接口
 */
export interface DataTableRef {
  reload: () => void;
  getSelectedRows: () => any[];
  clearSelection: () => void;
  scrollToTop: () => void;
}

/**
 * 表格操作按钮配置
 */
export interface TableAction {
  key: string;
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
  loading?: boolean;
}

/**
 * 表格属性
 */
export interface DataTableProps<T> extends Omit<AntTableProps<T>, 'pagination' | 'rowSelection' | 'columns' | 'title' | 'footer'> {
  // 数据
  data?: T[];
  rowKey: string | ((record: T) => string);
  columns: ColumnsType<T>;

  // 分页
  pagination?: TablePaginationConfig | false;
  paginationState?: PaginationState;
  onPaginationChange?: (page: number, pageSize: number) => void;

  // 行选择
  rowSelection?: {
    selectedRowKeys?: React.Key[];
    onChange?: (selectedRowKeys: React.Key[], selectedRows: T[]) => void;
    type?: 'checkbox' | 'radio';
    getCheckboxProps?: (record: T) => any;
    columnWidth?: number | string;
    fixed?: boolean;
  };

  // 表格操作
  actions?: TableAction[];
  showRefresh?: boolean;
  showExport?: boolean;
  onRefresh?: () => void;
  onExport?: () => void;

  // 加载状态
  loading?: boolean;
  loadingText?: string;

  // 其他
  size?: 'small' | 'middle' | 'large';
  bordered?: boolean;
  scroll?: { x?: number | string; y?: number | string };
  showHeader?: boolean;
  showFooter?: boolean;
  title?: React.ReactNode;
  footer?: React.ReactNode;

  // 样式
  className?: string;
  style?: React.CSSProperties;
  rowClassName?: (record: T, index: number) => string;

  // 引用
  forwardRef?: React.Ref<DataTableRef>;
}

/**
 * 通用数据表格组件
 */
const DataTable = forwardRef<DataTableRef, DataTableProps<any>>((props, ref) => {
  const {
    data: dataProp,
    rowKey,
    columns,
    pagination,
    paginationState,
    onPaginationChange,
    rowSelection,
    actions,
    showRefresh = true,
    showExport = true,
    onRefresh,
    onExport,
    loading = false,
    loadingText = '加载中...',
    size = 'middle',
    bordered = true,
    scroll,
    showHeader = true,
    title,
    footer,
    className,
    style,
    rowClassName,
    forwardRef,
    ...restProps
  } = props;

  const tableRef = useRef<any>(null);

  /**
   * 暴露给父组件的方法
   */
  useImperativeHandle(ref, () => ({
    reload: () => {
      onRefresh && onRefresh();
    },
    getSelectedRows: () => {
      return tableRef.current?.getSelectedRows() || [];
    },
    clearSelection: () => {
      tableRef.current?.clearSelection();
    },
    scrollToTop: () => {
      tableRef.current?.scrollTo({ index: 0, align: 'top' });
    },
  }));

  /**
   * 处理表格变化
   */
  const handleTableChange = (
    newPagination: TablePaginationConfig,
    filters: any,
    sorter: any,
    extra: any
  ) => {
    if (restProps.onChange) {
      restProps.onChange(newPagination, filters, sorter, extra);
    }
  };

  /**
   * 处理分页变化
   */
  const handlePaginationChange = (page: number, pageSize: number) => {
    if (onPaginationChange) {
      onPaginationChange(page, pageSize);
    }
  };

  /**
   * 处理行选择变化
   */
  const handleRowSelectionChange = (
    selectedRowKeys: React.Key[],
    selectedRows: any[]
  ) => {
    rowSelection?.onChange?.(selectedRowKeys, selectedRows);
  };

  /**
   * 渲染表格标题
   */
  const renderTitle = () => {
    if (title) {
      return title;
    }

    if (actions && actions.length > 0) {
      return (
        <div className="data-table-actions">
          {actions.map((action) => (
            <button
              key={action.key}
              className={`data-table-action ${action.danger ? 'danger' : ''} ${action.loading ? 'loading' : ''}`}
              onClick={action.onClick}
              disabled={action.disabled || action.loading}
            >
              {action.loading && <Spin size="small" />}
              {!action.loading && action.icon}
              {action.label}
            </button>
          ))}
        </div>
      );
    }

    return null;
  };

  /**
   * 渲染表格底部
   */
  const renderFooter = () => {
    if (footer) {
      return footer;
    }

    if (showRefresh || showExport) {
      return (
        <div className="data-table-footer">
          {showRefresh && onRefresh && (
            <button
              className="data-table-footer-btn"
              onClick={onRefresh}
              disabled={loading}
            >
              <ReloadOutlined spin={loading} />
              刷新
            </button>
          )}
          {showExport && onExport && (
            <button
              className="data-table-footer-btn"
              onClick={onExport}
              disabled={loading}
            >
              <ExportOutlined />
              导出
            </button>
          )}
        </div>
      );
    }

    return null;
  };

  /**
   * 处理分页配置
   */
  const getPaginationConfig = (): TablePaginationConfig | false => {
    if (pagination === false) {
      return false;
    }

    return {
      current: paginationState?.current || 1,
      pageSize: paginationState?.pageSize || 15,
      total: paginationState?.total || (dataProp?.length ?? 0),
      showSizeChanger: true,
      showQuickJumper: true,
      showTotal: (total: number) => `共 ${total} 条`,
      pageSizeOptions: ['15', '30', '50', '100'],
      onChange: handlePaginationChange,
      ...pagination,
    };
  };

  return (
    <div
      className={`data-table data-table-${size} ${bordered ? 'bordered' : ''} ${className || ''}`}
      style={style}
    >
      <AntTable
        ref={tableRef}
        columns={columns as ColumnsType<any>}
        dataSource={dataProp}
        rowKey={rowKey}
        rowSelection={
          rowSelection
            ? {
                selectedRowKeys: rowSelection.selectedRowKeys,
                onChange: handleRowSelectionChange,
                type: rowSelection.type || 'checkbox',
                getCheckboxProps: rowSelection.getCheckboxProps,
                columnWidth: rowSelection.columnWidth,
                fixed: rowSelection.fixed,
              }
            : undefined
        }
        pagination={getPaginationConfig()}
        onChange={handleTableChange}
        loading={loading}
        size={size}
        bordered={bordered}
        scroll={scroll}
        showHeader={showHeader}
        title={renderTitle}
        footer={renderFooter}
        rowClassName={rowClassName}
        {...restProps}
      />
      {loading && (
        <div className="data-table-loading-overlay">
          <Spin size="large" tip={loadingText} />
        </div>
      )}
    </div>
  );
});

DataTable.displayName = 'DataTable';

// 具名导出和默认导出
export { DataTable };
export default DataTable;
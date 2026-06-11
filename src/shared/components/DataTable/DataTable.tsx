/**
 * 数据表格通用组件
 * 封装Ant Design Table，提供统一的数据表格功能
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Table, Card, Button, Space, Tooltip } from 'antd';
import type { TableProps, ColumnType, TablePaginationConfig } from 'antd/es/table';
import { ReloadOutlined, DownloadOutlined, ColumnHeightOutlined, FilterOutlined } from '@ant-design/icons';

/**
 * DataTable组件Props
 */
export interface DataTableProps<T> extends Omit<TableProps<T>, 'dataSource'> {
  data: T[];
  loading?: boolean;
  rowKey: keyof T;
  columns: ColumnType<T>[];
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    onChange: (page: number, pageSize: number) => void;
    pageSizeOptions?: number[];
    showSizeChanger?: boolean;
    showQuickJumper?: boolean;
  } | false;
  rowSelection?: {
    selectedRowKeys?: React.Key[];
    onChange?: (selectedRowKeys: React.Key[], selectedRows: T[]) => void;
    type?: 'checkbox' | 'radio';
  };
  onRowClick?: (record: T) => void;
  size?: 'small' | 'middle' | 'large';
  scroll?: { x?: number | string; y?: number | string };
  showActions?: boolean;
  onRefresh?: () => void;
  onExport?: () => void;
  onToggleColumns?: () => void;
  cardProps?: React.ComponentProps<typeof Card>;
  extra?: React.ReactNode;
  sticky?: boolean;
}

/**
 * DataTable组件
 */
function DataTable<T extends Record<string, any>>({
  data,
  loading = false,
  rowKey,
  columns,
  pagination = false,
  rowSelection,
  onRowClick,
  size = 'middle',
  scroll,
  showActions = true,
  onRefresh,
  onExport,
  onToggleColumns,
  cardProps,
  extra,
  sticky = true,
}: DataTableProps<T>) {
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>(
    rowSelection?.selectedRowKeys || []
  );
  const [selectedRows, setSelectedRows] = useState<T[]>(
    rowSelection?.selectedRowKeys ? data.filter(item =>
      (rowSelection?.selectedRowKeys || []).includes(item[rowKey as string])
    ) : []
  );

  // 处理行选择变化
  const handleRowSelectionChange = useCallback((
    selectedRowKeys: React.Key[],
    selectedRows: T[]
  ) => {
    setSelectedRowKeys(selectedRowKeys);
    setSelectedRows(selectedRows);
    rowSelection?.onChange?.(selectedRowKeys, selectedRows);
  }, [rowSelection]);

  // 监听外部selectedRowKeys变化
  useEffect(() => {
    if (rowSelection?.selectedRowKeys !== undefined) {
      setSelectedRowKeys(rowSelection.selectedRowKeys);
      const rows = data.filter(item =>
        (rowSelection.selectedRowKeys || []).includes(item[rowKey as string])
      );
      setSelectedRows(rows);
    }
  }, [rowSelection?.selectedRowKeys, data, rowKey]);

  // 处理行点击
  const handleRowClick = useCallback((record: T) => {
    onRowClick?.(record);
  }, [onRowClick]);

  // 处理分页变化
  const handlePaginationChange = useCallback((page: number, pageSize: number) => {
    if (pagination && (pagination as any) !== false) {
      pagination.onChange(page, pageSize);
    }
  }, [pagination]);

  // 渲染表格操作
  const renderTableActions = () => {
    if (!showActions) return null;

    return (
      <Space>
        {onRefresh && (
          <Tooltip title="刷新">
            <Button
              type="text"
              icon={<ReloadOutlined />}
              onClick={onRefresh}
              loading={loading}
            />
          </Tooltip>
        )}
        {onExport && (
          <Tooltip title="导出">
            <Button
              type="text"
              icon={<DownloadOutlined />}
              onClick={onExport}
              disabled={data.length === 0}
            />
          </Tooltip>
        )}
        {onToggleColumns && (
          <Tooltip title="列设置">
            <Button
              type="text"
              icon={<ColumnHeightOutlined />}
              onClick={onToggleColumns}
            />
          </Tooltip>
        )}
      </Space>
    );
  };

  // 表格配置
  const tableProps: TableProps<T> = {
    columns,
    dataSource: data,
    loading,
    rowKey,
    size,
    scroll: scroll ? { ...scroll, x: 'max-content' } : undefined,
    onRow: (record) => ({
      onClick: () => handleRowClick(record),
    }),
    ...(rowSelection && {
      rowSelection: {
        type: rowSelection.type || 'checkbox',
        selectedRowKeys,
        onChange: handleRowSelectionChange,
      },
    }),
    ...((pagination && (pagination as any) !== false) && {
      pagination: {
        current: pagination.current,
        pageSize: pagination.pageSize,
        total: pagination.total,
        pageSizeOptions: pagination.pageSizeOptions || [10, 20, 50, 100],
        showSizeChanger: pagination.showSizeChanger ?? true,
        showQuickJumper: pagination.showQuickJumper ?? true,
        showTotal: (total) => `共 ${total} 条`,
        onChange: handlePaginationChange,
      },
    }),
  };

  // 如果使用sticky，则启用sticky配置
  if (sticky) {
    (tableProps as any).sticky = {
      offsetHeader: 0,
    };
  }

  return (
    <Card
      {...cardProps}
      bordered={false}
      bodyStyle={{ padding: 0 }}
    >
      <Table<T> {...tableProps} />
      {extra && (
        <div style={{ marginTop: 16 }}>
          {extra}
        </div>
      )}
    </Card>
  );
}

export default DataTable;

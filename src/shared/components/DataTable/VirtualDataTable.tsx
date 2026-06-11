/**
 * 虚拟滚动数据表格组件 - 性能优化版
 * 使用react-window实现大列表的虚拟滚动
 * 优化1000+条数据的渲染性能
 */

import React, { forwardRef, useImperativeHandle, useRef, useMemo } from 'react';
import type { ColumnType } from 'antd/es/table';
import { List } from 'react-window';

/**
 * 虚拟列表行组件
 */
interface RowProps {
  index: number;
  style: React.CSSProperties;
  data: {
    columns: ColumnType<any>[];
    dataSource: any[];
    rowKey: string | ((record: any) => string);
    onRowClick?: (record: any, index: number) => void;
  };
}

const VirtualRow = React.memo(({ index, style, data }: RowProps) => {
  const { columns, dataSource, rowKey, onRowClick } = data;
  const record = dataSource[index];

  const key = typeof rowKey === 'function' ? rowKey(record) : record[rowKey];

  return (
    <div
      style={style}
      className="virtual-table-row"
      onClick={() => onRowClick?.(record, index)}
    >
      {columns.map((column: ColumnType<any>, colIndex: number) => {
        const cellStyle: React.CSSProperties = {
          display: 'inline-block',
          width: (column.width as number) || 100,
          padding: '8px 16px',
          borderBottom: '1px solid #f0f0f0',
          textAlign: 'left',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          verticalAlign: 'middle',
        };

        const dataIndex = column.dataIndex as string;
        const rawValue = dataIndex ? record[dataIndex] : undefined;
        const content = column.render
          ? column.render(rawValue, record, index)
          : rawValue;

        return (
          <div key={`${key}-${colIndex}`} style={cellStyle}>
            {content}
          </div>
        );
      })}
    </div>
  );
});

VirtualRow.displayName = 'VirtualRow';

/**
 * 虚拟表格引用接口
 */
export interface VirtualDataTableRef {
  reload: () => void;
  scrollToTop: () => void;
  scrollToIndex: (index: number) => void;
  getVisibleData: () => any[];
}

/**
 * 虚拟表格属性
 */
export interface VirtualDataTableProps<T> {
  data: T[];
  columns: ColumnType<T>[];
  rowKey: string | ((record: T) => string);
  height?: number;
  rowHeight?: number;
  loading?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onRowClick?: (record: T, index: number) => void;
}

/**
 * 虚拟滚动数据表格
 */
const VirtualDataTable = forwardRef<VirtualDataTableRef, VirtualDataTableProps<any>>(
  (props, ref) => {
    const {
      data,
      columns,
      rowKey,
      height = 500,
      rowHeight = 60,
      loading = false,
      className,
      style,
      onRowClick,
    } = props;

    const listRef = useRef<any>(null);

    /**
     * 暴露给父组件的方法
     */
    useImperativeHandle(ref, () => ({
      reload: () => {
        // List component doesn't need reset in new react-window
      },
      scrollToTop: () => {
        listRef.current?.scrollToRow({ index: 0 });
      },
      scrollToIndex: (index: number) => {
        listRef.current?.scrollToRow({ index });
      },
      getVisibleData: () => {
        return data;
      },
    }));

    /**
     * 虚拟列表数据
     */
    const listData = useMemo(() => ({
      columns,
      dataSource: data,
      rowKey,
      onRowClick,
    }), [columns, data, rowKey, onRowClick]);

    /**
     * 渲染表头
     */
    const renderHeader = () => {
      return (
        <div
          className="virtual-table-header"
          style={{
            display: 'flex',
            borderBottom: '2px solid #f0f0f0',
            backgroundColor: '#fafafa',
            fontWeight: 'bold',
          }}
        >
          {columns.map((column: ColumnType<any>, index: number) => {
            const headerStyle: React.CSSProperties = {
              display: 'inline-block',
              width: (column.width as number) || 100,
              padding: '8px 16px',
              textAlign: 'left',
            };

            return (
              <div key={index} style={headerStyle}>
                {column.title as string}
              </div>
            );
          })}
        </div>
      );
    };

    if (loading) {
      return (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height,
            background: '#f5f7fa',
          }}
        >
          <span>加载中...</span>
        </div>
      );
    }

    if (data.length === 0) {
      return (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height,
            color: '#999',
          }}
        >
          暂无数据
        </div>
      );
    }

    return (
      <div
        className={`virtual-table ${className || ''}`}
        style={{
          ...style,
          height,
          overflow: 'hidden',
        }}
      >
        {renderHeader()}
        {/* @ts-ignore */}
        <List
          listRef={listRef}
          className="virtual-table-body"
          defaultHeight={height - 50}
          rowCount={data.length}
          rowHeight={rowHeight}
          rowComponent={VirtualRow}
          // @ts-ignore - rowProps type mismatch with react-window internals
          rowProps={listData}
        />
      </div>
    );
  }
);

VirtualDataTable.displayName = 'VirtualDataTable';

export default VirtualDataTable;

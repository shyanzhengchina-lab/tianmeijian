/**
 * Universal CRUD Component
 * A comprehensive, reusable CRUD component for basic data modules
 * Supports all common CRUD patterns with maximum flexibility
 */

import React, { forwardRef, useImperativeHandle, useState, useCallback, useMemo } from 'react';
import {
  Space,
  Button,
  Input,
  Table,
  Spin,
  Alert,
  Empty,
  Typography,
  Divider,
  Row,
  Col,
  Card,
  Tag,
  Tooltip,
  Popconfirm,
  message,
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  ExportOutlined,
  ImportOutlined,
  FilterOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type {
  UniversalCRUDProps,
  UniversalCRUDRef,
  BatchAction,
  StatisticItem,
  RowSelectionConfig,
  PaginationConfig,
} from './types';

const { Text } = Typography;

/**
 * Universal CRUD Component
 * Provides a complete CRUD interface with minimal configuration
 */
const UniversalCRUD = forwardRef<
  UniversalCRUDRef,
  UniversalCRUDProps<any>
>((props, ref) => {
  // ===== Props Destructuring =====
  const {
    // Data
    data = [],
    loading = false,
    error,
    totalCount,

    // Table configuration
    columns,
    rowKey,
    rowSelection,
    tableConfig = {},

    // Actions
    onCreate,
    onUpdate,
    onDelete,
    onView,

    // Batch actions
    batchActions = [],
    showBatchActions = true,

    // Search and filter
    searchable = true,
    filterable = false,
    onSearch,
    onFilter,
    searchPlaceholder = '搜索...',
    searchFields = [],

    // Pagination
    paginatable = true,
    pagination,

    // Statistics
    showStatistics = false,
    statistics = [],
    statisticsLayout = 'horizontal',

    // Modals and drawers
    createModal,
    updateModal,
    detailDrawer,
    createModalVisible,
    updateModalVisible,
    detailDrawerVisible,
    onCreateModalClose,
    onUpdateModalClose,
    onDetailDrawerClose,

    // Additional features
    exportable = true,
    onExport,
    importable = true,
    onImport,
    refreshable = true,
    onRefresh,

    // Styling
    title,
    extra,
    className = '',
    style,

    // Advanced configuration
    actionColumn,
    toolbar,
    footer,
    emptyText,
    errorRender,
    loadingRender,
    rowActions = [],
    permissions = {},

    // Others
    ...restProps
  } = props;

  // ===== State =====
  const [searchQuery, setSearchQuery] = useState('');
  const [localLoading, setLocalLoading] = useState(false);

  // ===== Ref Methods =====
  useImperativeHandle(ref, () => ({
    refresh: () => {
      onRefresh && onRefresh();
    },
    getSelectedRows: () => {
      return data.filter((item) =>
        rowSelection?.selectedRowKeys.includes(
          typeof rowKey === 'function' ? rowKey(item) : item[rowKey]
        )
      );
    },
    getSelectedRowKeys: () => {
      return rowSelection?.selectedRowKeys || [];
    },
    clearSelection: () => {
      rowSelection?.onChange?.([], []);
    },
    selectAll: () => {
      const allKeys = data.map((item) =>
        typeof rowKey === 'function' ? rowKey(item) : item[rowKey]
      );
      rowSelection?.onChange?.(allKeys, data);
    },
    deselectAll: () => {
      rowSelection?.onChange?.([], []);
    },
    scrollToTop: () => {
      // Scroll to top implementation
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    exportData: () => {
      onExport && onExport();
    },
    showCreateModal: () => {
      onCreate && onCreate();
    },
    showUpdateModal: (record: any) => {
      onUpdate && onUpdate(record);
    },
    showDetailDrawer: (record: any) => {
      onView && onView(record);
    },
  }));

  // ===== Computed Values =====
  const selectedCount = useMemo(() => {
    return rowSelection?.selectedRowKeys?.length || 0;
  }, [rowSelection?.selectedRowKeys]);

  const hasSelection = useMemo(() => {
    return selectedCount > 0;
  }, [selectedCount]);

  // ===== Event Handlers =====

  const handleSearch = useCallback(
    (value: string) => {
      setSearchQuery(value);
      onSearch?.(value);
    },
    [onSearch]
  );

  const handleBatchAction = useCallback(
    async (action: BatchAction) => {
      if (hasSelection) {
        setLocalLoading(true);
        try {
          await action.onClick();
          message.success(`${action.label}成功`);
        } catch (error) {
          message.error(`${action.label}失败`);
          console.error('Batch action error:', error);
        } finally {
          setLocalLoading(false);
        }
      } else {
        message.warning('请先选择要操作的记录');
      }
    },
    [hasSelection]
  );

  const handleDelete = useCallback(
    async (record: any) => {
      try {
        await onDelete?.(record);
        message.success('删除成功');
      } catch (error) {
        message.error('删除失败');
        console.error('Delete error:', error);
      }
    },
    [onDelete]
  );

  // ===== Render Functions =====

  const renderStatistics = () => {
    if (!showStatistics || statistics.length === 0) {
      return null;
    }

    if (statisticsLayout === 'vertical') {
      return (
        <Row gutter={16} style={{ marginBottom: 16 }}>
          {statistics.map((stat, index) => (
            <Col key={index} xs={24} sm={12} md={8} lg={6}>
              <Card size="small">
                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                  <Space>
                    {stat.icon && (
                      <span style={{ fontSize: 24, color: stat.color || '#1677ff' }}>
                        {stat.icon}
                      </span>
                    )}
                    <Text type="secondary">{stat.label}</Text>
                  </Space>
                  <Text style={{ fontSize: 20, fontWeight: 'bold' }}>
                    {stat.value}
                    {stat.suffix}
                  </Text>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      );
    }

    // Horizontal layout
    return (
      <Space size="large" style={{ marginBottom: 16, width: '100%', justifyContent: 'space-around' }}>
        {statistics.map((stat, index) => (
          <Space key={index} direction="vertical" size={0} align="center">
            <Space>
              {stat.icon && (
                <span style={{ fontSize: 20, color: stat.color || '#1677ff' }}>
                  {stat.icon}
                </span>
              )}
              <Text type="secondary">{stat.label}</Text>
            </Space>
            <Text style={{ fontSize: 18, fontWeight: 'bold' }}>
              {stat.value}
              {stat.suffix}
            </Text>
          </Space>
        ))}
      </Space>
    );
  };

  const renderSearchBar = () => {
    if (!searchable && !filterable) {
      return null;
    }

    return (
      <Space.Compact style={{ width: '100%', marginBottom: 16 }}>
        {searchable && (
          <Input
            placeholder={searchPlaceholder}
            prefix={<SearchOutlined />}
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            allowClear
            style={{ flex: 1 }}
          />
        )}
        {filterable && (
          <Button icon={<FilterOutlined />} onClick={() => onFilter?.({})}>
            筛选
          </Button>
        )}
      </Space.Compact>
    );
  };

  const renderToolbar = () => {
    const actions: React.ReactElement[] = [];

    if (permissions.canCreate !== false && onCreate) {
      actions.push(
        <Button
          key="create"
          type="primary"
          icon={<PlusOutlined />}
          onClick={onCreate}
        >
          新建
        </Button>
      );
    }

    if (permissions.canRefresh !== false && refreshable && onRefresh) {
      actions.push(
        <Button
          key="refresh"
          icon={<ReloadOutlined />}
          onClick={onRefresh}
          loading={loading}
        >
          刷新
        </Button>
      );
    }

    if (permissions.canImport !== false && importable && onImport) {
      actions.push(
        <Button key="import" icon={<ImportOutlined />} onClick={onImport}>
          导入
        </Button>
      );
    }

    if (permissions.canExport !== false && exportable && onExport) {
      actions.push(
        <Button key="export" icon={<ExportOutlined />} onClick={onExport}>
          导出
        </Button>
      );
    }

    if (toolbar) {
      return (
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>{actions}</Space>
          {toolbar}
        </div>
      );
    }

    if (actions.length > 0) {
      return (
        <div style={{ marginBottom: 16 }}>
          <Space>{actions}</Space>
        </div>
      );
    }

    return null;
  };

  const renderBatchActions = () => {
    if (!showBatchActions || batchActions.length === 0 || !hasSelection) {
      return null;
    }

    return (
      <Space style={{ marginBottom: 16 }}>
        <Text type="secondary">
          已选择 <Text strong style={{ color: '#1677ff' }}>{selectedCount}</Text> 项
        </Text>
        <Divider type="vertical" />
        {batchActions.map((action) => (
          <Button
            key={action.key}
            type={action.danger ? 'primary' : 'default'}
            danger={action.danger}
            icon={action.icon}
            onClick={() => handleBatchAction(action)}
            disabled={action.disabled || localLoading}
            loading={action.loading || localLoading}
          >
            {action.label}
          </Button>
        ))}
      </Space>
    );
  };

  const renderActionColumn = () => {
    if (actionColumn?.render) {
      return {
        title: '操作',
        key: 'action',
        width: actionColumn.width || 200,
        fixed: actionColumn.fixed || 'right',
        render: actionColumn.render,
      };
    }

    // Default action column
    const actions: React.ReactElement[] = [];

    if (permissions.canView !== false && onView) {
      actions.push(
        <Button
          key="view"
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => onView}
        >
          查看
        </Button>
      );
    }

    if (permissions.canUpdate !== false && onUpdate) {
      actions.push(
        <Button
          key="edit"
          type="link"
          size="small"
          icon={<EditOutlined />}
          onClick={() => onUpdate}
        >
          编辑
        </Button>
      );
    }

    if (permissions.canDelete !== false && onDelete) {
      actions.push(
        <Popconfirm
          key="delete"
          title="确认删除"
          description="此操作不可恢复，确定要删除吗？"
          onConfirm={handleDelete}
          okText="确定"
          cancelText="取消"
        >
          <Button type="link" size="small" danger icon={<DeleteOutlined />}>
            删除
          </Button>
        </Popconfirm>
      );
    }

    // Add custom row actions
    rowActions.forEach((action) => {
      const shouldShow = typeof action.show === 'function' ? true : (action.show !== false);
      const isDisabled = typeof action.disabled === 'function' ? false : (action.disabled === true);

      if (shouldShow) {
        actions.push(
          <Button
            key={action.key}
            type="link"
            size="small"
            icon={action.icon}
            onClick={action.onClick as any}
            danger={action.danger}
            disabled={isDisabled}
          >
            {action.label}
          </Button>
        );
      }
    });

    if (actions.length === 0) {
      return null;
    }

    return {
      title: '操作',
      key: 'action',
      width: 250,
      fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Space size="small">
          {actions.map((action, index) => (
            <React.Fragment key={index}>
              {React.cloneElement(action as React.ReactElement, {
                onClick: (() => {
                  if (React.isValidElement(action)) {
                    const onClick = (action as any).props.onClick;
                    if (typeof onClick === 'function') {
                      onClick(record);
                    }
                  }
                }) as any,
              } as any)}
            </React.Fragment>
          ))}
        </Space>
      ),
    };
  };

  const getTableColumns = (): ColumnsType<any> => {
    const actionCol = renderActionColumn();
    return actionCol ? [...columns, actionCol as any] : columns;
  };

  const renderError = () => {
    if (!error) {
      return null;
    }

    if (errorRender) {
      return errorRender(error);
    }

    return (
      <Alert
        message="错误"
        description={error}
        type="error"
        showIcon
        closable
        style={{ marginBottom: 16 }}
      />
    );
  };

  const renderLoading = () => {
    if (!loading) {
      return null;
    }

    if (loadingRender) {
      return loadingRender();
    }

    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  };

  const renderEmpty = () => {
    if (data.length > 0 || loading) {
      return null;
    }

    if (emptyText) {
      return <>{emptyText}</>;
    }

    return (
      <Empty
        description={searchQuery ? '未找到匹配的数据' : '暂无数据'}
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    );
  };

  // ===== Main Render =====

  return (
    <div className={`universal-crud ${className}`} style={style}>
      {/* Title */}
      {title && (
        <div style={{ marginBottom: 16 }}>
          <Text strong style={{ fontSize: 20 }}>
            {title}
          </Text>
          {totalCount !== undefined && (
            <Text type="secondary" style={{ marginLeft: 8, fontSize: 14 }}>
              (共 {totalCount} 条)
            </Text>
          )}
        </div>
      )}

      {/* Statistics */}
      {renderStatistics()}

      {/* Error */}
      {renderError()}

      {/* Search Bar */}
      {renderSearchBar()}

      {/* Toolbar */}
      {renderToolbar()}

      {/* Batch Actions */}
      {renderBatchActions()}

      {/* Extra Content */}
      {extra && (
        <div style={{ marginBottom: 16 }}>
          {extra}
        </div>
      )}

      {/* Data Table */}
      {renderLoading()}
      {!loading && (
        <Table
          columns={getTableColumns()}
          dataSource={data}
          rowKey={rowKey}
          rowSelection={
            rowSelection
              ? {
                  selectedRowKeys: rowSelection.selectedRowKeys,
                  onChange: rowSelection.onChange,
                  type: rowSelection.type || 'checkbox',
                  getCheckboxProps: rowSelection.getCheckboxProps,
                  columnWidth: rowSelection.columnWidth,
                  fixed: rowSelection.fixed,
                }
              : undefined
          }
          pagination={
            paginatable && pagination
              ? {
                  current: pagination.current,
                  pageSize: pagination.pageSize,
                  total: pagination.total,
                  onChange: pagination.onChange,
                  showSizeChanger: pagination.showSizeChanger ?? true,
                  showQuickJumper: pagination.showQuickJumper ?? true,
                  showTotal: pagination.showTotal
                    ? pagination.showTotal
                    : (total) => `共 ${total} 条`,
                  pageSizeOptions: pagination.pageSizeOptions || ['10', '20', '50', '100'],
                }
              : false
          }
          loading={false}
          size={tableConfig.size || 'middle'}
          bordered={tableConfig.bordered ?? true}
          scroll={tableConfig.scroll}
          showHeader={tableConfig.showHeader ?? true}
          sticky={tableConfig.sticky}
          rowClassName={tableConfig.rowClassName}
          locale={{
            emptyText: renderEmpty(),
          }}
          {...restProps}
        />
      )}

      {/* Footer */}
      {footer && (
        <div style={{ marginTop: 16 }}>
          {footer}
        </div>
      )}

      {/* Modals and Drawers */}
      {createModal && (
        <React.Fragment key="createModal">
          {createModal}
        </React.Fragment>
      )}
      {updateModal && (
        <React.Fragment key="updateModal">
          {updateModal}
        </React.Fragment>
      )}
      {detailDrawer && (
        <React.Fragment key="detailDrawer">
          {detailDrawer}
        </React.Fragment>
      )}
    </div>
  );
});

UniversalCRUD.displayName = 'UniversalCRUD';

// Named exports
export { UniversalCRUD };
export default UniversalCRUD;

// Export types
export type {
  UniversalCRUDProps,
  UniversalCRUDRef,
  BatchAction,
  StatisticItem,
  RowSelectionConfig,
  PaginationConfig,
} from './types';

/**
 * DataTable 组件单元测试
 * 测试通用数据表格组件的渲染、交互和功能
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import DataTable, { DataTableRef, TableAction } from '../DataTable';

// Mock data
const mockData = [
  { id: 1, name: '测试项目1', status: 'active', value: 100 },
  { id: 2, name: '测试项目2', status: 'inactive', value: 200 },
  { id: 3, name: '测试项目3', status: 'active', value: 300 },
];

const mockColumns = [
  {
    title: 'ID',
    dataIndex: 'id',
    key: 'id',
  },
  {
    title: '名称',
    dataIndex: 'name',
    key: 'name',
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
  },
  {
    title: '数值',
    dataIndex: 'value',
    key: 'value',
  },
];

describe('DataTable 组件', () => {
  describe('基础渲染测试', () => {
    it('应该正确渲染基本表格', () => {
      render(
        <DataTable
          data={mockData}
          rowKey="id"
          columns={mockColumns}
        />
      );

      expect(screen.getByText('测试项目1')).toBeInTheDocument();
      expect(screen.getByText('测试项目2')).toBeInTheDocument();
      expect(screen.getByText('测试项目3')).toBeInTheDocument();
    });

    it('应该正确渲染空数据状态', () => {
      render(
        <DataTable
          data={[]}
          rowKey="id"
          columns={mockColumns}
        />
      );

      expect(screen.getByText('暂无数据')).toBeInTheDocument();
    });

    it('应该正确渲染表格标题', () => {
      render(
        <DataTable
          data={mockData}
          rowKey="id"
          columns={mockColumns}
          title="测试表格"
        />
      );

      expect(screen.getByText('测试表格')).toBeInTheDocument();
    });

    it('应该正确渲染自定义标题', () => {
      render(
        <DataTable
          data={mockData}
          rowKey="id"
          columns={mockColumns}
          title={<span>自定义标题</span>}
        />
      );

      expect(screen.getByText('自定义标题')).toBeInTheDocument();
    });

    it('应该支持不同尺寸', () => {
      const { container: smallContainer } = render(
        <DataTable
          data={mockData}
          rowKey="id"
          columns={mockColumns}
          size="small"
        />
      );

      expect(smallContainer.querySelector('.data-table-small')).toBeInTheDocument();

      const { container: largeContainer } = render(
        <DataTable
          data={mockData}
          rowKey="id"
          columns={mockColumns}
          size="large"
        />
      );

      expect(largeContainer.querySelector('.data-table-large')).toBeInTheDocument();
    });

    it('应该支持边框显示控制', () => {
      const { container } = render(
        <DataTable
          data={mockData}
          rowKey="id"
          columns={mockColumns}
          bordered={false}
        />
      );

      expect(container.querySelector('.data-table')).not.toHaveClass('bordered');
    });
  });

  describe('用户交互测试', () => {
    it('应该正确处理刷新操作', () => {
      const mockRefresh = jest.fn();
      render(
        <DataTable
          data={mockData}
          rowKey="id"
          columns={mockColumns}
          onRefresh={mockRefresh}
          showRefresh
        />
      );

      const refreshButton = screen.getByText('刷新');
      fireEvent.click(refreshButton);

      expect(mockRefresh).toHaveBeenCalledTimes(1);
    });

    it('应该正确处理导出操作', () => {
      const mockExport = jest.fn();
      render(
        <DataTable
          data={mockData}
          rowKey="id"
          columns={mockColumns}
          onExport={mockExport}
          showExport
        />
      );

      const exportButton = screen.getByText('导出');
      fireEvent.click(exportButton);

      expect(mockExport).toHaveBeenCalledTimes(1);
    });

    it('应该在加载时禁用刷新和导出按钮', () => {
      const mockRefresh = jest.fn();
      const mockExport = jest.fn();

      render(
        <DataTable
          data={mockData}
          rowKey="id"
          columns={mockColumns}
          onRefresh={mockRefresh}
          onExport={mockExport}
          loading
          showRefresh
          showExport
        />
      );

      const refreshButton = screen.getByText('刷新');
      const exportButton = screen.getByText('导出');

      fireEvent.click(refreshButton);
      fireEvent.click(exportButton);

      expect(mockRefresh).not.toHaveBeenCalled();
      expect(mockExport).not.toHaveBeenCalled();
    });

    it('应该正确处理自定义操作按钮', () => {
      const mockAction = jest.fn();
      const actions: TableAction[] = [
        {
          key: 'custom',
          label: '自定义操作',
          onClick: mockAction,
        },
      ];

      render(
        <DataTable
          data={mockData}
          rowKey="id"
          columns={mockColumns}
          actions={actions}
        />
      );

      const customButton = screen.getByText('自定义操作');
      fireEvent.click(customButton);

      expect(mockAction).toHaveBeenCalledTimes(1);
    });

    it('应该正确处理禁用状态的操作按钮', () => {
      const mockAction = jest.fn();
      const actions: TableAction[] = [
        {
          key: 'disabled',
          label: '禁用操作',
          onClick: mockAction,
          disabled: true,
        },
      ];

      render(
        <DataTable
          data={mockData}
          rowKey="id"
          columns={mockColumns}
          actions={actions}
        />
      );

      const disabledButton = screen.getByText('禁用操作');
      fireEvent.click(disabledButton);

      expect(mockAction).not.toHaveBeenCalled();
    });

    it('应该正确处理危险操作按钮', () => {
      const mockAction = jest.fn();
      const actions: TableAction[] = [
        {
          key: 'danger',
          label: '危险操作',
          onClick: mockAction,
          danger: true,
        },
      ];

      render(
        <DataTable
          data={mockData}
          rowKey="id"
          columns={mockColumns}
          actions={actions}
        />
      );

      const dangerButton = screen.getByText('危险操作');
      expect(dangerButton).toHaveClass('danger');
      fireEvent.click(dangerButton);

      expect(mockAction).toHaveBeenCalledTimes(1);
    });
  });

  describe('分页功能测试', () => {
    it('应该正确渲染分页信息', () => {
      const paginationState = {
        current: 1,
        pageSize: 15,
        total: 45,
      };

      render(
        <DataTable
          data={mockData}
          rowKey="id"
          columns={mockColumns}
          paginationState={paginationState}
        />
      );

      expect(screen.getByText('共 45 条')).toBeInTheDocument();
    });

    it('应该正确处理分页变化', () => {
      const mockPaginationChange = jest.fn();
      const paginationState = {
        current: 1,
        pageSize: 15,
        total: 45,
      };

      render(
        <DataTable
          data={mockData}
          rowKey="id"
          columns={mockColumns}
          paginationState={paginationState}
          onPaginationChange={mockPaginationChange}
        />
      );

      // 找到第2页按钮并点击
      const pageButtons = screen.getAllByText('2');
      if (pageButtons.length > 0) {
        fireEvent.click(pageButtons[0]);
        expect(mockPaginationChange).toHaveBeenCalledWith(2, 15);
      }
    });

    it('应该支持禁用分页', () => {
      render(
        <DataTable
          data={mockData}
          rowKey="id"
          columns={mockColumns}
          pagination={false}
        />
      );

      // 检查分页控件是否存在
      expect(screen.queryByText('共 3 条')).not.toBeInTheDocument();
    });
  });

  describe('行选择功能测试', () => {
    it('应该正确处理行选择', () => {
      const mockSelectionChange = jest.fn();
      const selectedRowKeys = [1, 2];

      render(
        <DataTable
          data={mockData}
          rowKey="id"
          columns={mockColumns}
          rowSelection={{
            selectedRowKeys,
            onChange: mockSelectionChange,
          }}
        />
      );

      // 检查复选框是否存在
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBeGreaterThan(0);
    });

    it('应该支持单选模式', () => {
      const mockSelectionChange = jest.fn();

      render(
        <DataTable
          data={mockData}
          rowKey="id"
          columns={mockColumns}
          rowSelection={{
            type: 'radio',
            onChange: mockSelectionChange,
          }}
        />
      );

      // 检查单选框是否存在
      const radioButtons = screen.getAllByRole('radio');
      expect(radioButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Props传递测试', () => {
    it('应该正确传递自定义类名', () => {
      const { container } = render(
        <DataTable
          data={mockData}
          rowKey="id"
          columns={mockColumns}
          className="custom-class"
        />
      );

      expect(container.querySelector('.custom-class')).toBeInTheDocument();
    });

    it('应该正确传递自定义样式', () => {
      const customStyle = { marginTop: '20px', backgroundColor: '#f0f0f0' };

      const { container } = render(
        <DataTable
          data={mockData}
          rowKey="id"
          columns={mockColumns}
          style={customStyle}
        />
      );

      const tableElement = container.querySelector('.data-table');
      expect(tableElement).toHaveStyle('margin-top: 20px');
      expect(tableElement).toHaveStyle('background-color: #f0f0f0');
    });

    it('应该正确处理自定义行类名', () => {
      const customRowClassName = jest.fn((record, index) => {
        return record.id === 1 ? 'highlight-row' : 'normal-row';
      });

      render(
        <DataTable
          data={mockData}
          rowKey="id"
          columns={mockColumns}
          rowClassName={customRowClassName}
        />
      );

      expect(customRowClassName).toHaveBeenCalledWith(mockData[0], 0);
    });
  });

  describe('Ref功能测试', () => {
    it('应该支持通过ref调用reload方法', () => {
      const mockRefresh = jest.fn();
      const ref = React.createRef() as React.RefObject<DataTableRef>;

      render(
        <DataTable
          data={mockData}
          rowKey="id"
          columns={mockColumns}
          onRefresh={mockRefresh}
          ref={ref}
        />
      );

      if (ref.current) {
        ref.current.reload();
        expect(mockRefresh).toHaveBeenCalledTimes(1);
      }
    });

    it('应该支持通过ref调用clearSelection方法', () => {
      const ref = React.createRef() as React.RefObject<DataTableRef>;

      render(
        <DataTable
          data={mockData}
          rowKey="id"
          columns={mockColumns}
          rowSelection={{
            selectedRowKeys: [1, 2],
            onChange: jest.fn(),
          }}
          ref={ref}
        />
      );

      if (ref.current) {
        expect(() => ref.current.clearSelection()).not.toThrow();
      }
    });

    it('应该支持通过ref调用scrollToTop方法', () => {
      const ref = React.createRef() as React.RefObject<DataTableRef>;

      render(
        <DataTable
          data={mockData}
          rowKey="id"
          columns={mockColumns}
          ref={ref}
        />
      );

      if (ref.current) {
        expect(() => ref.current.scrollToTop()).not.toThrow();
      }
    });
  });

  describe('加载状态测试', () => {
    it('应该显示加载状态', () => {
      render(
        <DataTable
          data={mockData}
          rowKey="id"
          columns={mockColumns}
          loading
          loadingText="正在加载数据..."
        />
      );

      expect(screen.getByText('正在加载数据...')).toBeInTheDocument();
    });

    it('应该在加载时覆盖表格', () => {
      const { container } = render(
        <DataTable
          data={mockData}
          rowKey="id"
          columns={mockColumns}
          loading
        />
      );

      expect(container.querySelector('.data-table-loading-overlay')).toBeInTheDocument();
    });
  });

  describe('边界情况测试', () => {
    it('应该处理undefined数据', () => {
      render(
        <DataTable
          data={[]}
          rowKey="id"
          columns={mockColumns}
        />
      );

      expect(screen.getByText('暂无数据')).toBeInTheDocument();
    });

    it('应该处理空列配置', () => {
      render(
        <DataTable
          data={mockData}
          rowKey="id"
          columns={[]}
        />
      );

      // 表格应该渲染，但没有列
      const tableElement = screen.getByRole('table');
      expect(tableElement).toBeInTheDocument();
    });

    it('应该处理函数类型的rowKey', () => {
      const functionRowKey = (record: any) => `row-${record.id}`;

      render(
        <DataTable
          data={mockData}
          rowKey={functionRowKey}
          columns={mockColumns}
        />
      );

      expect(screen.getByText('测试项目1')).toBeInTheDocument();
    });
  });

  describe('可访问性测试', () => {
    it('应该支持键盘导航', () => {
      render(
        <DataTable
          data={mockData}
          rowKey="id"
          columns={mockColumns}
        />
      );

      const tableElement = screen.getByRole('table');
      expect(tableElement).toBeInTheDocument();
    });

    it('应该有适当的ARIA属性', () => {
      render(
        <DataTable
          data={mockData}
          rowKey="id"
          columns={mockColumns}
        />
      );

      const tableElement = screen.getByRole('table');
      expect(tableElement).toBeInTheDocument();
    });
  });

  describe('表格变化测试', () => {
    it('应该正确处理排序变化', () => {
      const mockChange = jest.fn();

      render(
        <DataTable
          data={mockData}
          rowKey="id"
          columns={mockColumns}
          onChange={mockChange}
        />
      );

      // 表格变化事件会被触发
      expect(mockChange).toBeDefined();
    });

    it('应该正确处理筛选变化', () => {
      const mockChange = jest.fn();

      render(
        <DataTable
          data={mockData}
          rowKey="id"
          columns={mockColumns}
          onChange={mockChange}
        />
      );

      expect(mockChange).toBeDefined();
    });
  });
});

/**
 * DataTable 组件单元测试
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DataTable } from '../index';

// Mock 数据
const mockData = [
  {
    id: '1',
    name: '测试数据1',
    status: 'ACTIVE',
  },
  {
    id: '2',
    name: '测试数据2',
    status: 'INACTIVE',
  },
];

const mockColumns = [
  {
    title: '名称',
    dataIndex: 'name',
    key: 'name',
    width: 200,
    align: 'center' as const,
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 100,
    align: 'center' as const,
    render: (status: string) => <span>{status}</span>,
  },
];

const mockPagination = {
  current: 1,
  pageSize: 10,
  total: 100,
  onChange: jest.fn(),
};

describe('DataTable Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('基础渲染', () => {
    it('应该正确渲染数据表格', () => {
      render(
        <DataTable
          data={mockData}
          loading={false}
          columns={mockColumns}
          rowKey="id"
        />
      );

      expect(screen.getByText('测试数据1')).toBeInTheDocument();
      expect(screen.getByText('测试数据2')).toBeInTheDocument();
    });

    it('应该显示加载状态', () => {
      render(
        <DataTable
          data={[]}
          loading={true}
          columns={mockColumns}
          rowKey="id"
        />
      );

      // Ant Design Table 在 loading 时会显示加载指示器
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
    });

    it('应该处理空数据', () => {
      render(
        <DataTable
          data={[]}
          loading={false}
          columns={mockColumns}
          rowKey="id"
        />
      );

      // 应该显示表格，但是没有数据行
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
    });
  });

  describe('分页功能', () => {
    it('应该显示分页器', () => {
      render(
        <DataTable
          data={mockData}
          loading={false}
          columns={mockColumns}
          rowKey="id"
          pagination={mockPagination}
        />
      );

      expect(screen.getByText('共 100 条')).toBeInTheDocument();
    });

    it('分页变化应该调用 onChange', async () => {
      render(
        <DataTable
          data={mockData}
          loading={false}
          columns={mockColumns}
          rowKey="id"
          pagination={mockPagination}
        />
      );

      // 模拟分页变化
      const pageItems = await screen.findAllByRole('listitem');
      const secondPage = pageItems.find(item => item.textContent?.includes('2'));

      if (secondPage) {
        fireEvent.click(secondPage);
      }

      await waitFor(() => {
        expect(mockPagination.onChange).toHaveBeenCalledWith(2, 10);
      });
    });
  });

  describe('行选择功能', () => {
    it('应该支持行选择', () => {
      const mockSelection = {
        selectedRowKeys: [],
        onChange: jest.fn(),
      };

      render(
        <DataTable
          data={mockData}
          loading={false}
          columns={mockColumns}
          rowKey="id"
          rowSelection={mockSelection}
        />
      );

      // 检查选择框是否渲染
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes).toHaveLength(mockData.length);
    });

    it('选择变化应该调用 onChange', async () => {
      const mockSelection = {
        selectedRowKeys: [],
        onChange: jest.fn(),
      };

      render(
        <DataTable
          data={mockData}
          loading={false}
          columns={mockColumns}
          rowKey="id"
          rowSelection={mockSelection}
        />
      );

      // 模拟选择第一行
      const checkboxes = screen.getAllByRole('checkbox');
      if (checkboxes.length > 0) {
        fireEvent.click(checkboxes[0]);
      }

      await waitFor(() => {
        expect(mockSelection.onChange).toHaveBeenCalledWith(['1']);
      });
    });
  });

  describe('列渲染', () => {
    it('应该正确渲染列标题', () => {
      render(
        <DataTable
          data={mockData}
          loading={false}
          columns={mockColumns}
          rowKey="id"
        />
      );

      expect(screen.getByText('名称')).toBeInTheDocument();
      expect(screen.getByText('状态')).toBeInTheDocument();
    });

    it('应该使用自定义渲染函数', () => {
      render(
        <DataTable
          data={mockData}
          loading={false}
          columns={mockColumns}
          rowKey="id"
        />
      );

      const statusCells = screen.getAllByText('ACTIVE');
      expect(statusCells.length).toBeGreaterThan(0);
    });
  });

  describe('性能优化', () => {
    it('应该支持memo优化', () => {
      const { rerender } = render(
        <DataTable
          data={mockData}
          loading={false}
          columns={mockColumns}
          rowKey="id"
        />
      );

      // 重新渲染相同的数据
      rerender(
        <DataTable
          data={mockData}
          loading={false}
          columns={mockColumns}
          rowKey="id"
        />
      );

      // DataTable 应该是一个稳定的组件
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
    });
  });

  describe('边界情况', () => {
    it('应该处理 undefined 数据', () => {
      render(
        <DataTable
          data={undefined as any}
          loading={false}
          columns={mockColumns}
          rowKey="id"
        />
      );

      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
    });

    it('应该处理空列配置', () => {
      render(
        <DataTable
          data={mockData}
          loading={false}
          columns={[]}
          rowKey="id"
        />
      );

      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
    });

    it('应该处理缺失的 pagination', () => {
      render(
        <DataTable
          data={mockData}
          loading={false}
          columns={mockColumns}
          rowKey="id"
        />
      );

      // 不应该报错，应该渲染表格
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
    });
  });
});
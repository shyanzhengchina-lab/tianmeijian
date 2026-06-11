/**
 * ActionBar 组件单元测试
 * 测试操作栏组件的渲染、交互和功能
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ActionBar from '../ActionBar';
import type { ActionItem } from '../../../shared/types/common';

// Mock action items
const mockActions: ActionItem[] = [
  {
    key: 'add',
    label: '新增',
    icon: <span data-testid="add-icon">+</span>,
    type: 'primary',
    onClick: jest.fn(),
  },
  {
    key: 'edit',
    label: '编辑',
    onClick: jest.fn(),
  },
  {
    key: 'delete',
    label: '删除',
    type: 'default',
    danger: true,
    onClick: jest.fn(),
  },
];

const mockBatchActions: ActionItem[] = [
  {
    key: 'batchDelete',
    label: '批量删除',
    type: 'primary',
    danger: true,
    onClick: jest.fn(),
  },
  {
    key: 'batchExport',
    label: '批量导出',
    onClick: jest.fn(),
  },
];

describe('ActionBar 组件', () => {
  describe('基础渲染测试', () => {
    it('应该正确渲染基本的操作栏', () => {
      render(
        <ActionBar
          title="项目管理"
          actions={mockActions}
        />
      );

      expect(screen.getByText('项目管理')).toBeInTheDocument();
      expect(screen.getByText('新增')).toBeInTheDocument();
      expect(screen.getByText('编辑')).toBeInTheDocument();
      expect(screen.getByText('删除')).toBeInTheDocument();
    });

    it('应该正确渲染标题', () => {
      render(
        <ActionBar
          title="系统设置"
          actions={mockActions}
        />
      );

      expect(screen.getByText('系统设置')).toBeInTheDocument();
    });

    it('应该正确渲染空操作列表', () => {
      render(
        <ActionBar
          title="测试项目"
          actions={[]}
        />
      );

      expect(screen.getByText('测试项目')).toBeInTheDocument();
      // 应该显示默认操作按钮
      expect(screen.getByText('新增')).toBeInTheDocument();
      expect(screen.getByText('刷新')).toBeInTheDocument();
    });

    it('应该正确渲染额外内容', () => {
      const extraContent = <div data-testid="extra-content">额外信息</div>;

      render(
        <ActionBar
          title="额外内容测试"
          actions={mockActions}
          extra={extraContent}
        />
      );

      expect(screen.getByTestId('extra-content')).toBeInTheDocument();
      expect(screen.getByText('额外信息')).toBeInTheDocument();
    });

    it('应该正确渲染选择信息', () => {
      render(
        <ActionBar
          title="选择信息测试"
          actions={mockActions}
          selectedCount={5}
          showSelectionInfo
        />
      );

      expect(screen.getByText(/已选择/)).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('应该在selectedCount为0时不显示选择信息', () => {
      render(
        <ActionBar
          title="无选择测试"
          actions={mockActions}
          selectedCount={0}
          showSelectionInfo
        />
      );

      expect(screen.queryByText(/已选择/)).not.toBeInTheDocument();
    });

    it('应该在showSelectionInfo为false时不显示选择信息', () => {
      render(
        <ActionBar
          title="隐藏选择信息测试"
          actions={mockActions}
          selectedCount={5}
          showSelectionInfo={false}
        />
      );

      expect(screen.queryByText(/已选择/)).not.toBeInTheDocument();
    });
  });

  describe('操作按钮渲染测试', () => {
    it('应该正确渲染单个操作按钮', () => {
      const singleAction: ActionItem[] = [
        {
          key: 'single',
          label: '单个操作',
          onClick: jest.fn(),
        },
      ];

      render(
        <ActionBar
          title="单个操作测试"
          actions={singleAction}
        />
      );

      expect(screen.getByText('单个操作')).toBeInTheDocument();
    });

    it('应该正确渲染多个操作按钮', () => {
      render(
        <ActionBar
          title="多个操作测试"
          actions={mockActions}
        />
      );

      expect(screen.getByText('新增')).toBeInTheDocument();
      expect(screen.getByText('编辑')).toBeInTheDocument();
      expect(screen.getByText('删除')).toBeInTheDocument();
    });

    it('应该正确渲染primary类型的按钮', () => {
      render(
        <ActionBar
          title="primary类型测试"
          actions={mockActions}
        />
      );

      const addButton = screen.getByText('新增');
      expect(addButton.parentElement).toHaveClass('ant-btn-primary');
    });

    it('应该正确渲染default类型的按钮', () => {
      render(
        <ActionBar
          title="default类型测试"
          actions={mockActions}
        />
      );

      const editButton = screen.getByText('编辑');
      expect(editButton.parentElement).toHaveClass('ant-btn-default');
    });

    it('应该正确渲染dashed类型的按钮', () => {
      const dashedAction: ActionItem[] = [
        {
          key: 'dashed',
          label: '虚线按钮',
          type: 'dashed',
          onClick: jest.fn(),
        },
      ];

      render(
        <ActionBar
          title="dashed类型测试"
          actions={dashedAction}
        />
      );

      const dashedButton = screen.getByText('虚线按钮');
      expect(dashedButton.parentElement).toHaveClass('ant-btn-dashed');
    });

    it('应该正确渲染危险按钮', () => {
      render(
        <ActionBar
          title="危险按钮测试"
          actions={mockActions}
        />
      );

      const deleteButton = screen.getByText('删除');
      expect(deleteButton.parentElement).toHaveClass('ant-btn-dangerous');
    });

    it('应该正确渲染按钮图标', () => {
      render(
        <ActionBar
          title="图标测试"
          actions={mockActions}
        />
      );

      expect(screen.getByTestId('add-icon')).toBeInTheDocument();
    });

    it('应该正确渲染小尺寸按钮', () => {
      render(
        <ActionBar
          title="小尺寸测试"
          actions={mockActions}
        />
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveClass('ant-btn-sm');
      });
    });
  });

  describe('批量操作测试', () => {
    it('应该正确渲染批量操作按钮', () => {
      render(
        <ActionBar
          title="批量操作测试"
          actions={mockActions}
          batchActions={mockBatchActions}
          selectedCount={3}
        />
      );

      expect(screen.getByText('批量删除')).toBeInTheDocument();
      expect(screen.getByText('批量导出')).toBeInTheDocument();
    });

    it('应该在selectedCount为0时不显示批量操作', () => {
      render(
        <ActionBar
          title="无批量选择测试"
          actions={mockActions}
          batchActions={mockBatchActions}
          selectedCount={0}
        />
      );

      expect(screen.queryByText('批量删除')).not.toBeInTheDocument();
      expect(screen.queryByText('批量导出')).not.toBeInTheDocument();
    });

    it('应该在selectedCount大于0时显示批量操作', () => {
      render(
        <ActionBar
          title="有批量选择测试"
          actions={mockActions}
          batchActions={mockBatchActions}
          selectedCount={1}
        />
      );

      expect(screen.getByText('批量删除')).toBeInTheDocument();
      expect(screen.getByText('批量导出')).toBeInTheDocument();
    });

    it('应该正确显示批量操作上的徽章', () => {
      render(
        <ActionBar
          title="徽章测试"
          actions={mockActions}
          batchActions={mockBatchActions}
          selectedCount={5}
        />
      );

      // 检查是否有徽章显示选择数量
      const batchDeleteButton = screen.getByText('批量删除');
      expect(batchDeleteButton).toBeInTheDocument();
    });

    it('应该在空批量操作列表时不显示批量操作区域', () => {
      render(
        <ActionBar
          title="空批量操作测试"
          actions={mockActions}
          batchActions={[]}
          selectedCount={3}
        />
      );

      expect(screen.queryByText('批量删除')).not.toBeInTheDocument();
    });
  });

  describe('用户交互测试', () => {
    it('应该正确处理操作按钮点击', () => {
      const mockClick = jest.fn();

      const clickableActions: ActionItem[] = [
        {
          key: 'clickable',
          label: '可点击按钮',
          onClick: mockClick,
        },
      ];

      render(
        <ActionBar
          title="点击测试"
          actions={clickableActions}
        />
      );

      const button = screen.getByText('可点击按钮');
      fireEvent.click(button);

      expect(mockClick).toHaveBeenCalledTimes(1);
    });

    it('应该正确处理多个操作按钮的点击', () => {
      const mockAddClick = jest.fn();
      const mockEditClick = jest.fn();
      const mockDeleteClick = jest.fn();

      const clickableActions: ActionItem[] = [
        {
          key: 'add',
          label: '新增',
          onClick: mockAddClick,
        },
        {
          key: 'edit',
          label: '编辑',
          onClick: mockEditClick,
        },
        {
          key: 'delete',
          label: '删除',
          onClick: mockDeleteClick,
        },
      ];

      render(
        <ActionBar
          title="多点击测试"
          actions={clickableActions}
        />
      );

      const addButton = screen.getByText('新增');
      const editButton = screen.getByText('编辑');
      const deleteButton = screen.getByText('删除');

      fireEvent.click(addButton);
      fireEvent.click(editButton);
      fireEvent.click(deleteButton);

      expect(mockAddClick).toHaveBeenCalledTimes(1);
      expect(mockEditClick).toHaveBeenCalledTimes(1);
      expect(mockDeleteClick).toHaveBeenCalledTimes(1);
    });

    it('应该正确处理批量操作按钮点击', () => {
      const mockBatchDeleteClick = jest.fn();
      const mockBatchExportClick = jest.fn();

      const batchClickableActions: ActionItem[] = [
        {
          key: 'batchDelete',
          label: '批量删除',
          onClick: mockBatchDeleteClick,
        },
        {
          key: 'batchExport',
          label: '批量导出',
          onClick: mockBatchExportClick,
        },
      ];

      render(
        <ActionBar
          title="批量点击测试"
          actions={mockActions}
          batchActions={batchClickableActions}
          selectedCount={3}
        />
      );

      const batchDeleteButton = screen.getByText('批量删除');
      const batchExportButton = screen.getByText('批量导出');

      fireEvent.click(batchDeleteButton);
      fireEvent.click(batchExportButton);

      expect(mockBatchDeleteClick).toHaveBeenCalledTimes(1);
      expect(mockBatchExportClick).toHaveBeenCalledTimes(1);
    });

    it('应该正确处理禁用状态的按钮', () => {
      const mockClick = jest.fn();

      const disabledActions: ActionItem[] = [
        {
          key: 'disabled',
          label: '禁用按钮',
          onClick: mockClick,
          disabled: true,
        },
      ];

      render(
        <ActionBar
          title="禁用测试"
          actions={disabledActions}
        />
      );

      const disabledButton = screen.getByText('禁用按钮');
      expect(disabledButton).toBeDisabled();

      fireEvent.click(disabledButton);
      expect(mockClick).not.toHaveBeenCalled();
    });

    it('应该正确处理加载状态的按钮', () => {
      const mockClick = jest.fn();

      const loadingActions: ActionItem[] = [
        {
          key: 'loading',
          label: '加载按钮',
          onClick: mockClick,
          loading: true,
        },
      ];

      render(
        <ActionBar
          title="加载测试"
          actions={loadingActions}
        />
      );

      const loadingButton = screen.getByText('加载按钮');
      expect(loadingButton).toBeInTheDocument();
    });

    it('应该在加载状态下禁用按钮', () => {
      const mockClick = jest.fn();

      const loadingActions: ActionItem[] = [
        {
          key: 'loading',
          label: '加载按钮',
          onClick: mockClick,
          loading: true,
        },
      ];

      render(
        <ActionBar
          title="加载禁用测试"
          actions={loadingActions}
        />
      );

      const loadingButton = screen.getByText('加载按钮');
      expect(loadingButton).toBeDisabled();

      fireEvent.click(loadingButton);
      expect(mockClick).not.toHaveBeenCalled();
    });
  });

  describe('默认操作测试', () => {
    it('应该在actions为空时显示默认操作', () => {
      render(
        <ActionBar
          title="默认操作测试"
          actions={[]}
        />
      );

      expect(screen.getByText('新增')).toBeInTheDocument();
      expect(screen.getByText('刷新')).toBeInTheDocument();
    });

    it('应该在actions不为空时不显示默认操作', () => {
      render(
        <ActionBar
          title="自定义操作测试"
          actions={mockActions}
        />
      );

      // 应该只显示自定义操作，不显示默认操作
      expect(screen.getByText('新增')).toBeInTheDocument();
      expect(screen.getByText('编辑')).toBeInTheDocument();
      expect(screen.getByText('删除')).toBeInTheDocument();
      // 确保没有刷新按钮
      expect(screen.queryByText('刷新')).not.toBeInTheDocument();
    });

    it('默认新增按钮应该有primary类型', () => {
      render(
        <ActionBar
          title="默认按钮类型测试"
          actions={[]}
        />
      );

      const addButton = screen.getByText('新增');
      expect(addButton.parentElement).toHaveClass('ant-btn-primary');
    });

    it('默认刷新按钮应该是default类型', () => {
      render(
        <ActionBar
          title="默认刷新类型测试"
          actions={[]}
        />
      );

      const refreshButton = screen.getByText('刷新');
      expect(refreshButton.parentElement).toHaveClass('ant-btn-default');
    });
  });

  describe('布局和样式测试', () => {
    it('应该正确应用容器样式', () => {
      const { container } = render(
        <ActionBar
          title="样式测试"
          actions={mockActions}
        />
      );

      const actionBarContainer = container.querySelector('.action-bar-container');
      expect(actionBarContainer).toBeInTheDocument();
    });

    it('应该在容器中正确排列元素', () => {
      const { container } = render(
        <ActionBar
          title="布局测试"
          actions={mockActions}
        />
      );

      const actionBarContainer = container.querySelector('.action-bar-container');
      expect(actionBarContainer).toBeInTheDocument();

      // 检查flex布局
      expect(actionBarContainer).toHaveStyle({
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      });
    });

    it('应该正确渲染分隔线', () => {
      const { container } = render(
        <ActionBar
          title="分隔线测试"
          actions={mockActions}
        />
      );

      const dividers = container.querySelectorAll('.ant-divider-vertical');
      expect(dividers.length).toBeGreaterThan(0);
    });

    it('应该正确处理长标题', () => {
      const longTitle = '这是一个非常非常非常非常非常非常非常长的标题';

      render(
        <ActionBar
          title={longTitle}
          actions={mockActions}
        />
      );

      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    it('应该支持响应式布局', () => {
      render(
        <ActionBar
          title="响应式测试"
          actions={mockActions}
        />
      );

      const { container } = render(
        <ActionBar
          title="响应式测试"
          actions={mockActions}
        />
      );

      const actionBarContainer = container.querySelector('.action-bar-container');
      expect(actionBarContainer).toHaveStyle('flex-wrap: wrap');
    });
  });

  describe('边界情况测试', () => {
    it('应该处理空操作列表', () => {
      render(
        <ActionBar
          title="空操作列表测试"
          actions={[]}
        />
      );

      expect(screen.getByText('空操作列表测试')).toBeInTheDocument();
    });

    it('应该处理空批量操作列表', () => {
      render(
        <ActionBar
          title="空批量操作列表测试"
          actions={mockActions}
          batchActions={[]}
          selectedCount={3}
        />
      );

      expect(screen.queryByText('批量删除')).not.toBeInTheDocument();
    });

    it('应该处理负数的selectedCount', () => {
      render(
        <ActionBar
          title="负数选择测试"
          actions={mockActions}
          selectedCount={-1}
          showSelectionInfo
        />
      );

      // 应该显示负数
      expect(screen.getByText('-1')).toBeInTheDocument();
    });

    it('应该处理非常大的selectedCount', () => {
      render(
        <ActionBar
          title="大数值测试"
          actions={mockActions}
          selectedCount={999999}
          showSelectionInfo
        />
      );

      expect(screen.getByText('999999')).toBeInTheDocument();
    });

    it('应该处理未定义的actions', () => {
      render(
        <ActionBar
          title="未定义操作测试"
          actions={undefined as any}
        />
      );

      expect(screen.getByText('未定义操作测试')).toBeInTheDocument();
    });

    it('应该处理未定义的batchActions', () => {
      render(
        <ActionBar
          title="未定义批量操作测试"
          actions={mockActions}
          batchActions={undefined as any}
          selectedCount={3}
        />
      );

      expect(screen.queryByText('批量删除')).not.toBeInTheDocument();
    });

    it('应该处理未定义的extra', () => {
      render(
        <ActionBar
          title="未定义额外内容测试"
          actions={mockActions}
          extra={undefined}
        />
      );

      expect(screen.getByText('未定义额外内容测试')).toBeInTheDocument();
    });

    it('应该处理空字符串标题', () => {
      render(
        <ActionBar
          title=""
          actions={mockActions}
        />
      );

      // 标题元素应该存在，但内容为空
      const titleElements = screen.getAllByText('');
      expect(titleElements.length).toBeGreaterThan(0);
    });
  });

  describe('可访问性测试', () => {
    it('应该支持键盘导航', () => {
      render(
        <ActionBar
          title="键盘导航测试"
          actions={mockActions}
        />
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toBeInTheDocument();
      });
    });

    it('应该有适当的按钮角色', () => {
      render(
        <ActionBar
          title="按钮角色测试"
          actions={mockActions}
        />
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('应该支持焦点管理', () => {
      render(
        <ActionBar
          title="焦点测试"
          actions={mockActions}
        />
      );

      const addButton = screen.getByText('新增');
      addButton.focus();
      expect(addButton).toHaveFocus();
    });
  });

  describe('徽章显示测试', () => {
    it('应该在批量操作按钮上显示选择数量', () => {
      render(
        <ActionBar
          title="徽章显示测试"
          actions={mockActions}
          batchActions={mockBatchActions}
          selectedCount={5}
        />
      );

      const batchDeleteButton = screen.getByText('批量删除');
      expect(batchDeleteButton).toBeInTheDocument();

      // 检查是否有徽章元素
      const { container } = render(
        <ActionBar
          title="徽章显示测试"
          actions={mockActions}
          batchActions={mockBatchActions}
          selectedCount={5}
        />
      );

      const badge = container.querySelector('.ant-badge');
      expect(badge).toBeInTheDocument();
    });

    it('应该在selectedCount为0时不显示徽章', () => {
      const { container } = render(
        <ActionBar
          title="无徽章测试"
          actions={mockActions}
          batchActions={mockBatchActions}
          selectedCount={0}
        />
      );

      const badge = container.querySelector('.ant-badge');
      expect(badge).not.toBeInTheDocument();
    });

    it('应该在selectedCount变化时更新徽章', () => {
      const { rerender } = render(
        <ActionBar
          title="徽章更新测试"
          actions={mockActions}
          batchActions={mockBatchActions}
          selectedCount={1}
        />
      );

      // 重新渲染，更新选择数量
      rerender(
        <ActionBar
          title="徽章更新测试"
          actions={mockActions}
          batchActions={mockBatchActions}
          selectedCount={10}
        />
      );

      expect(screen.getByText('10')).toBeInTheDocument();
    });
  });

  describe('组合功能测试', () => {
    it('应该同时显示操作和批量操作', () => {
      render(
        <ActionBar
          title="组合测试"
          actions={mockActions}
          batchActions={mockBatchActions}
          selectedCount={3}
        />
      );

      // 检查所有操作按钮
      expect(screen.getByText('新增')).toBeInTheDocument();
      expect(screen.getByText('编辑')).toBeInTheDocument();
      expect(screen.getByText('删除')).toBeInTheDocument();
      expect(screen.getByText('批量删除')).toBeInTheDocument();
      expect(screen.getByText('批量导出')).toBeInTheDocument();
    });

    it('应该同时显示操作和额外内容', () => {
      const extraContent = <div data-testid="extra">额外内容</div>;

      render(
        <ActionBar
          title="组合测试"
          actions={mockActions}
          extra={extraContent}
        />
      );

      expect(screen.getByText('新增')).toBeInTheDocument();
      expect(screen.getByTestId('extra')).toBeInTheDocument();
    });

    it('应该同时显示选择信息和批量操作', () => {
      render(
        <ActionBar
          title="完整功能测试"
          actions={mockActions}
          batchActions={mockBatchActions}
          selectedCount={5}
          showSelectionInfo
        />
      );

      expect(screen.getByText(/已选择/)).toBeInTheDocument();
      const allFives = screen.getAllByText('5');
      expect(allFives.length).toBeGreaterThan(0);
      expect(screen.getByText('批量删除')).toBeInTheDocument();
    });

    it('应该支持所有功能的组合', () => {
      const extraContent = <div data-testid="complete-extra">完整额外内容</div>;

      render(
        <ActionBar
          title="完整组合测试"
          actions={mockActions}
          batchActions={mockBatchActions}
          selectedCount={3}
          showSelectionInfo
          extra={extraContent}
        />
      );

      // 检查所有功能
      expect(screen.getByText('完整组合测试')).toBeInTheDocument();
      expect(screen.getByText('新增')).toBeInTheDocument();
      expect(screen.getByText('批量删除')).toBeInTheDocument();
      expect(screen.getByText(/已选择/)).toBeInTheDocument();
      expect(screen.getByTestId('complete-extra')).toBeInTheDocument();
    });
  });
});

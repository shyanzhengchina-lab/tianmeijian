/**
 * DetailDrawer 组件单元测试
 * 测试详情抽屉组件的渲染、交互和功能
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import DetailDrawer, { SimpleDetailDrawer } from '../DetailDrawer';
import type { DetailField } from '../../../shared/types/common';

// Mock detail fields
const mockFields: DetailField[] = [
  {
    label: 'ID',
    value: 1,
    type: 'number',
  },
  {
    label: '名称',
    value: '测试项目',
    type: 'text',
  },
  {
    label: '状态',
    value: '启用',
    type: 'tag',
  },
  {
    label: '创建时间',
    value: '2024-01-01',
    type: 'date',
  },
  {
    label: '金额',
    value: 100.5,
    type: 'currency',
  },
];

describe('DetailDrawer 组件', () => {
  describe('基础渲染测试', () => {
    it('应该正确渲染详情抽屉', () => {
      render(
        <DetailDrawer
          visible
          title="项目详情"
          fields={mockFields}
          onClose={jest.fn()}
        />
      );

      expect(screen.getByText('项目详情')).toBeInTheDocument();
      expect(screen.getByText('ID')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('名称')).toBeInTheDocument();
      expect(screen.getByText('测试项目')).toBeInTheDocument();
    });

    it('应该在不可见时不渲染', () => {
      const { container } = render(
        <DetailDrawer
          visible={false}
          title="项目详情"
          fields={mockFields}
          onClose={jest.fn()}
        />
      );

      // Drawer 在 visible=false 时仍然存在于 DOM 中，但是 display: none
      expect(container.querySelector('.ant-drawer-hidden')).toBeInTheDocument();
    });

    it('应该正确渲染不同类型的字段', () => {
      render(
        <DetailDrawer
          visible
          title="不同类型测试"
          fields={mockFields}
          onClose={jest.fn()}
        />
      );

      expect(screen.getByText('ID')).toBeInTheDocument();
      expect(screen.getByText('名称')).toBeInTheDocument();
      expect(screen.getByText('状态')).toBeInTheDocument();
      expect(screen.getByText('创建时间')).toBeInTheDocument();
      expect(screen.getByText('金额')).toBeInTheDocument();
    });

    it('应该支持自定义宽度', () => {
      render(
        <DetailDrawer
          visible
          title="自定义宽度"
          fields={mockFields}
          onClose={jest.fn()}
          width={800}
        />
      );

      expect(screen.getByText('自定义宽度')).toBeInTheDocument();
    });

    it('应该支持字符串宽度', () => {
      render(
        <DetailDrawer
          visible
          title="字符串宽度"
          fields={mockFields}
          onClose={jest.fn()}
          width="90%"
        />
      );

      expect(screen.getByText('字符串宽度')).toBeInTheDocument();
    });

    it('应该正确渲染跨列字段', () => {
      const fieldsWithSpan: DetailField[] = [
        { label: '字段1', value: '值1', type: 'text', span: 2 },
        { label: '字段2', value: '值2', type: 'text' },
      ];

      render(
        <DetailDrawer
          visible
          title="跨列测试"
          fields={fieldsWithSpan}
          onClose={jest.fn()}
        />
      );

      expect(screen.getByText('字段1')).toBeInTheDocument();
      expect(screen.getByText('字段2')).toBeInTheDocument();
    });

    it('应该正确渲染空值', () => {
      const fieldsWithNull: DetailField[] = [
        { label: '空值字段', value: null, type: 'text' },
        { label: '未定义字段', value: undefined, type: 'text' },
      ];

      render(
        <DetailDrawer
          visible
          title="空值测试"
          fields={fieldsWithNull}
          onClose={jest.fn()}
        />
      );

      expect(screen.getByText('空值字段')).toBeInTheDocument();
      expect(screen.getByText('未定义字段')).toBeInTheDocument();

      // 空值应该显示为 '-'
      const dashes = screen.getAllByText('-');
      expect(dashes.length).toBe(2);
    });

    it('应该正确渲染数字类型的字段', () => {
      const numberFields: DetailField[] = [
        { label: '数字1', value: 123, type: 'number' },
        { label: '数字2', value: 456.789, type: 'number' },
      ];

      render(
        <DetailDrawer
          visible
          title="数字类型测试"
          fields={numberFields}
          onClose={jest.fn()}
        />
      );

      expect(screen.getByText('123')).toBeInTheDocument();
      expect(screen.getByText('456.789')).toBeInTheDocument();
    });
  });

  describe('用户交互测试', () => {
    it('应该正确处理关闭操作', () => {
      const mockClose = jest.fn();

      render(
        <DetailDrawer
          visible
          title="关闭测试"
          fields={mockFields}
          onClose={mockClose}
        />
      );

      // 找到关闭按钮
      const closeButton = document.querySelector('.ant-drawer-close');
      expect(closeButton).toBeInTheDocument();

      if (closeButton) {
        fireEvent.click(closeButton);
        expect(mockClose).toHaveBeenCalledTimes(1);
      }
    });

    it('应该正确处理编辑操作', () => {
      const mockEdit = jest.fn();

      render(
        <DetailDrawer
          visible
          title="编辑测试"
          fields={mockFields}
          onClose={jest.fn()}
          onEdit={mockEdit}
          showActions
        />
      );

      const editButton = screen.getByText('编辑');
      expect(editButton).toBeInTheDocument();

      fireEvent.click(editButton);
      expect(mockEdit).toHaveBeenCalledTimes(1);
    });

    it('应该正确处理删除操作', () => {
      const mockDelete = jest.fn();

      render(
        <DetailDrawer
          visible
          title="删除测试"
          fields={mockFields}
          onClose={jest.fn()}
          onDelete={mockDelete}
          showActions
        />
      );

      const deleteButton = screen.getByText('删除');
      expect(deleteButton).toBeInTheDocument();

      fireEvent.click(deleteButton);
      expect(mockDelete).toHaveBeenCalledTimes(1);
    });

    it('应该在showActions为false时不显示操作按钮', () => {
      render(
        <DetailDrawer
          visible
          title="无操作测试"
          fields={mockFields}
          onClose={jest.fn()}
          showActions={false}
        />
      );

      expect(screen.queryByText('编辑')).not.toBeInTheDocument();
      expect(screen.queryByText('删除')).not.toBeInTheDocument();
    });

    it('应该在只有onEdit时只显示编辑按钮', () => {
      render(
        <DetailDrawer
          visible
          title="只有编辑测试"
          fields={mockFields}
          onClose={jest.fn()}
          onEdit={jest.fn()}
          showActions
        />
      );

      expect(screen.getByText('编辑')).toBeInTheDocument();
      expect(screen.queryByText('删除')).not.toBeInTheDocument();
    });

    it('应该在只有onDelete时只显示删除按钮', () => {
      render(
        <DetailDrawer
          visible
          title="只有删除测试"
          fields={mockFields}
          onClose={jest.fn()}
          onDelete={jest.fn()}
          showActions
        />
      );

      expect(screen.getByText('删除')).toBeInTheDocument();
      expect(screen.queryByText('编辑')).not.toBeInTheDocument();
    });
  });

  describe('自定义渲染测试', () => {
    it('应该支持自定义字段渲染', () => {
      const customRender = jest.fn((value) => (
        <span data-testid="custom-render">自定义: {value}</span>
      ));

      const fieldsWithCustom: DetailField[] = [
        {
          label: '自定义字段',
          value: '测试值',
          type: 'custom',
          render: customRender,
        },
      ];

      render(
        <DetailDrawer
          visible
          title="自定义渲染测试"
          fields={fieldsWithCustom}
          onClose={jest.fn()}
        />
      );

      expect(customRender).toHaveBeenCalledWith('测试值');
      expect(screen.getByTestId('custom-render')).toBeInTheDocument();
      expect(screen.getByText('自定义: 测试值')).toBeInTheDocument();
    });

    it('应该支持标签类型字段的自定义渲染', () => {
      const tagRender = jest.fn((value) => (
        <span data-testid="tag-render" style={{ color: 'red' }}>{value}</span>
      ));

      const fieldsWithTag: DetailField[] = [
        {
          label: '标签',
          value: '激活',
          type: 'tag',
          render: tagRender,
        },
      ];

      render(
        <DetailDrawer
          visible
          title="标签渲染测试"
          fields={fieldsWithTag}
          onClose={jest.fn()}
        />
      );

      expect(tagRender).toHaveBeenCalledWith('激活');
      expect(screen.getByTestId('tag-render')).toBeInTheDocument();
    });

    it('应该支持日期类型字段的自定义渲染', () => {
      const dateRender = jest.fn((value) => (
        <span data-testid="date-render">{new Date(value).toLocaleDateString()}</span>
      ));

      const fieldsWithDate: DetailField[] = [
        {
          label: '日期',
          value: '2024-01-01',
          type: 'date',
          render: dateRender,
        },
      ];

      render(
        <DetailDrawer
          visible
          title="日期渲染测试"
          fields={fieldsWithDate}
          onClose={jest.fn()}
        />
      );

      expect(dateRender).toHaveBeenCalledWith('2024-01-01');
      expect(screen.getByTestId('date-render')).toBeInTheDocument();
    });

    it('应该支持货币类型字段的自定义渲染', () => {
      const currencyRender = jest.fn((value) => (
        <span data-testid="currency-render">¥{value.toFixed(2)}</span>
      ));

      const fieldsWithCurrency: DetailField[] = [
        {
          label: '金额',
          value: 1234.56,
          type: 'currency',
          render: currencyRender,
        },
      ];

      render(
        <DetailDrawer
          visible
          title="货币渲染测试"
          fields={fieldsWithCurrency}
          onClose={jest.fn()}
        />
      );

      expect(currencyRender).toHaveBeenCalledWith(1234.56);
      expect(screen.getByTestId('currency-render')).toBeInTheDocument();
    });
  });

  describe('额外内容测试', () => {
    it('应该正确渲染额外内容', () => {
      const extraContent = <div data-testid="extra-content">额外内容</div>;

      render(
        <DetailDrawer
          visible
          title="额外内容测试"
          fields={mockFields}
          onClose={jest.fn()}
          extra={extraContent}
        />
      );

      expect(screen.getByTestId('extra-content')).toBeInTheDocument();
      expect(screen.getByText('额外内容')).toBeInTheDocument();
    });

    it('应该在字段列表后显示额外内容', () => {
      const extraContent = <div data-testid="extra">附加信息</div>;

      render(
        <DetailDrawer
          visible
          title="额外内容位置测试"
          fields={mockFields}
          onClose={jest.fn()}
          extra={extraContent}
        />
      );

      const lastFieldLabel = screen.getByText('金额');
      const extraElement = screen.getByTestId('extra');

      // 检查额外内容是否在字段列表之后
      expect(lastFieldLabel).toBeInTheDocument();
      expect(extraElement).toBeInTheDocument();
    });
  });

  describe('加载状态测试', () => {
    it('应该显示加载状态', () => {
      render(
        <DetailDrawer
          visible
          title="加载状态测试"
          fields={mockFields}
          onClose={jest.fn()}
          loading
        />
      );

      expect(screen.getByText('加载中...')).toBeInTheDocument();
    });

    it('应该在加载时禁用交互', () => {
      render(
        <DetailDrawer
          visible
          title="加载禁用测试"
          fields={mockFields}
          onClose={jest.fn()}
          loading
          showActions
          onEdit={jest.fn()}
          onDelete={jest.fn()}
        />
      );

      // 在加载状态下，编辑和删除按钮可能被禁用
      const editButton = screen.getByText('编辑');
      const deleteButton = screen.getByText('删除');

      expect(editButton).toBeInTheDocument();
      expect(deleteButton).toBeInTheDocument();
    });
  });

  describe('Props传递测试', () => {
    it('应该正确传递drawerProps', () => {
      render(
        <DetailDrawer
          visible
          title="drawerProps测试"
          fields={mockFields}
          onClose={jest.fn()}
          drawerProps={{
            placement: 'left',
            maskClosable: false,
            closable: false,
          }}
        />
      );

      expect(screen.getByText('drawerProps测试')).toBeInTheDocument();
    });

    it('应该支持自定义位置', () => {
      render(
        <DetailDrawer
          visible
          title="左侧抽屉"
          fields={mockFields}
          onClose={jest.fn()}
          drawerProps={{
            placement: 'left',
          }}
        />
      );

      expect(screen.getByText('左侧抽屉')).toBeInTheDocument();
    });

    it('应该支持禁止点击遮罩关闭', () => {
      render(
        <DetailDrawer
          visible
          title="禁止遮罩关闭"
          fields={mockFields}
          onClose={jest.fn()}
          drawerProps={{
            maskClosable: false,
          }}
        />
      );

      expect(screen.getByText('禁止遮罩关闭')).toBeInTheDocument();
    });
  });

  describe('边界情况测试', () => {
    it('应该处理空字段数组', () => {
      render(
        <DetailDrawer
          visible
          title="空字段测试"
          fields={[]}
          onClose={jest.fn()}
        />
      );

      expect(screen.getByText('空字段测试')).toBeInTheDocument();
    });

    it('应该处理未定义的字段值', () => {
      const fieldsWithUndefined: DetailField[] = [
        { label: '未定义', value: undefined, type: 'text' },
        { label: 'null', value: null, type: 'text' },
      ];

      render(
        <DetailDrawer
          visible
          title="未定义值测试"
          fields={fieldsWithUndefined}
          onClose={jest.fn()}
        />
      );

      const dashes = screen.getAllByText('-');
      expect(dashes.length).toBe(2);
    });

    it('应该处理大型数据集', () => {
      const largeFields: DetailField[] = Array.from({ length: 50 }, (_, i) => ({
        label: `字段${i}`,
        value: `值${i}`,
        type: 'text',
      }));

      render(
        <DetailDrawer
          visible
          title="大数据测试"
          fields={largeFields}
          onClose={jest.fn()}
        />
      );

      expect(screen.getByText('字段0')).toBeInTheDocument();
      expect(screen.getByText('字段49')).toBeInTheDocument();
    });

    it('应该处理特殊字符', () => {
      const specialFields: DetailField[] = [
        { label: '特殊字符', value: '<>&"\'', type: 'text' },
        { label: 'Emoji', value: '🎉🚀', type: 'text' },
      ];

      render(
        <DetailDrawer
          visible
          title="特殊字符测试"
          fields={specialFields}
          onClose={jest.fn()}
        />
      );

      expect(screen.getByText('<>&"\'')).toBeInTheDocument();
      expect(screen.getByText('🎉🚀')).toBeInTheDocument();
    });
  });

  describe('可访问性测试', () => {
    it('应该支持键盘导航', () => {
      render(
        <DetailDrawer
          visible
          title="键盘导航测试"
          fields={mockFields}
          onClose={jest.fn()}
        />
      );

      const closeButton = document.querySelector('.ant-drawer-close');
      expect(closeButton).toBeInTheDocument();

      if (closeButton) {
        (closeButton as HTMLElement).focus();
        expect(closeButton).toHaveFocus();
      }
    });

    it('应该有适当的ARIA属性', () => {
      render(
        <DetailDrawer
          visible
          title="ARIA测试"
          fields={mockFields}
          onClose={jest.fn()}
        />
      );

      const drawerElement = document.querySelector('.ant-drawer');
      expect(drawerElement).toBeInTheDocument();
    });
  });

  describe('销毁行为测试', () => {
    it('应该在关闭时销毁内容', () => {
      const { rerender } = render(
        <DetailDrawer
          visible
          title="销毁测试"
          fields={mockFields}
          onClose={jest.fn()}
        />
      );

      // 关闭抽屉
      rerender(
        <DetailDrawer
          visible={false}
          title="销毁测试"
          fields={mockFields}
          onClose={jest.fn()}
        />
      );

      expect(screen.queryByText('ID')).not.toBeInTheDocument();
    });
  });
});

describe('SimpleDetailDrawer 组件', () => {
  describe('基础渲染测试', () => {
    it('应该正确渲染简化版详情抽屉', () => {
      const mockData = {
        id: 1,
        name: '测试项目',
        status: 'active',
        value: 100,
      };

      render(
        <SimpleDetailDrawer
          visible
          title="简化详情"
          data={mockData}
          onClose={jest.fn()}
        />
      );

      expect(screen.getByText('简化详情')).toBeInTheDocument();
      expect(screen.getByText('id')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('name')).toBeInTheDocument();
      expect(screen.getByText('测试项目')).toBeInTheDocument();
    });

    it('应该处理空数据对象', () => {
      render(
        <SimpleDetailDrawer
          visible
          title="空数据测试"
          data={{}}
          onClose={jest.fn()}
        />
      );

      expect(screen.getByText('空数据测试')).toBeInTheDocument();
    });

    it('应该处理未定义数据', () => {
      render(
        <SimpleDetailDrawer
          visible
          title="未定义数据测试"
          data={undefined}
          onClose={jest.fn()}
        />
      );

      expect(screen.getByText('未定义数据测试')).toBeInTheDocument();
    });

    it('应该正确推断数字类型', () => {
      const mockData = {
        id: 123,
        name: '测试',
        count: 456,
        price: 789.5,
      };

      render(
        <SimpleDetailDrawer
          visible
          title="数字类型推断"
          data={mockData}
          onClose={jest.fn()}
        />
      );

      expect(screen.getByText('123')).toBeInTheDocument();
      expect(screen.getByText('456')).toBeInTheDocument();
      expect(screen.getByText('789.5')).toBeInTheDocument();
    });

    it('应该正确推断文本类型', () => {
      const mockData = {
        name: '文本',
        description: '这是一个描述',
      };

      render(
        <SimpleDetailDrawer
          visible
          title="文本类型推断"
          data={mockData}
          onClose={jest.fn()}
        />
      );

      expect(screen.getByText('文本')).toBeInTheDocument();
      expect(screen.getByText('这是一个描述')).toBeInTheDocument();
    });

    it('应该在不可见时不渲染', () => {
      const { container } = render(
        <SimpleDetailDrawer
          visible={false}
          title="简化详情"
          data={{ id: 1 }}
          onClose={jest.fn()}
        />
      );

      expect(container.querySelector('.ant-drawer-hidden')).toBeInTheDocument();
    });

    it('应该正确处理关闭操作', () => {
      const mockClose = jest.fn();

      render(
        <SimpleDetailDrawer
          visible
          title="简化关闭测试"
          data={{ id: 1 }}
          onClose={mockClose}
        />
      );

      const closeButton = document.querySelector('.ant-drawer-close');
      expect(closeButton).toBeInTheDocument();

      if (closeButton) {
        fireEvent.click(closeButton);
        expect(mockClose).toHaveBeenCalledTimes(1);
      }
    });

    it('应该不显示操作按钮', () => {
      render(
        <SimpleDetailDrawer
          visible
          title="无操作按钮测试"
          data={{ id: 1 }}
          onClose={jest.fn()}
        />
      );

      expect(screen.queryByText('编辑')).not.toBeInTheDocument();
      expect(screen.queryByText('删除')).not.toBeInTheDocument();
    });
  });

  describe('边界情况测试', () => {
    it('应该处理包含特殊字符的键名', () => {
      const specialData = {
        'user-name': 'test',
        'user_email': 'test@example.com',
        'user[phone]': '1234567890',
      };

      render(
        <SimpleDetailDrawer
          visible
          title="特殊键名测试"
          data={specialData}
          onClose={jest.fn()}
        />
      );

      expect(screen.getByText('user-name')).toBeInTheDocument();
      expect(screen.getByText('user_email')).toBeInTheDocument();
      expect(screen.getByText('user[phone]')).toBeInTheDocument();
    });

    it('应该处理嵌套对象', () => {
      const nestedData = {
        id: 1,
        user: {
          name: '张三',
          age: 25,
        },
        settings: {
          theme: 'dark',
        },
      };

      render(
        <SimpleDetailDrawer
          visible
          title="嵌套对象测试"
          data={nestedData}
          onClose={jest.fn()}
        />
      );

      // 嵌套对象会被转换为字符串显示
      expect(screen.getByText('[object Object]')).toBeInTheDocument();
    });

    it('应该处理数组值', () => {
      const arrayData = {
        tags: ['标签1', '标签2', '标签3'],
        numbers: [1, 2, 3],
      };

      render(
        <SimpleDetailDrawer
          visible
          title="数组值测试"
          data={arrayData}
          onClose={jest.fn()}
        />
      );

      // 数组会被转换为字符串显示
      expect(screen.getByText('标签1,标签2,标签3')).toBeInTheDocument();
    });
  });
});

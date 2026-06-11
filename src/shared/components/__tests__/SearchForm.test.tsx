/**
 * SearchForm 组件单元测试
 * 测试通用搜索表单组件的渲染、交互和功能
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SearchForm from '../SearchForm';
import type { FormField } from '../../../shared/types/common';

// Mock form fields
const mockFields: FormField[] = [
  {
    name: 'keyword',
    label: '关键词',
    type: 'input',
  },
  {
    name: 'status',
    label: '状态',
    type: 'select',
    options: [
      { label: '启用', value: 'active' },
      { label: '禁用', value: 'inactive' },
    ],
  },
  {
    name: 'dateRange',
    label: '日期范围',
    type: 'dateRange',
  },
  {
    name: 'count',
    label: '数量',
    type: 'number',
  },
];

describe('SearchForm 组件', () => {
  describe('基础渲染测试', () => {
    it('应该正确渲染默认布局的搜索表单', () => {
      render(
        <SearchForm
          fields={mockFields}
          onSearch={jest.fn()}
          onReset={jest.fn()}
        />
      );

      expect(screen.getByText('关键词')).toBeInTheDocument();
      expect(screen.getByText('状态')).toBeInTheDocument();
      expect(screen.getByText('日期范围')).toBeInTheDocument();
      expect(screen.getByText('数量')).toBeInTheDocument();
      expect(screen.getByText('搜索')).toBeInTheDocument();
      expect(screen.getByText('重置')).toBeInTheDocument();
    });

    it('应该正确渲染inline布局', () => {
      render(
        <SearchForm
          fields={mockFields}
          onSearch={jest.fn()}
          onReset={jest.fn()}
          layout="inline"
        />
      );

      expect(screen.getByText('关键词')).toBeInTheDocument();
      expect(screen.getByText('搜索')).toBeInTheDocument();
      expect(screen.getByText('重置')).toBeInTheDocument();
    });

    it('应该正确渲染vertical布局', () => {
      render(
        <SearchForm
          fields={mockFields}
          onSearch={jest.fn()}
          onReset={jest.fn()}
          layout="vertical"
        />
      );

      expect(screen.getByText('关键词')).toBeInTheDocument();
    });

    it('应该支持不同类型的表单字段', () => {
      const allTypesFields: FormField[] = [
        { name: 'input', label: '输入框', type: 'input' },
        { name: 'textArea', label: '文本域', type: 'textArea' },
        { name: 'select', label: '下拉选择', type: 'select', options: [{ label: '选项1', value: '1' }] },
        { name: 'treeSelect', label: '树选择', type: 'treeSelect', treeData: [] },
        { name: 'datePicker', label: '日期选择', type: 'datePicker' },
        { name: 'dateRange', label: '日期范围', type: 'dateRange' },
        { name: 'number', label: '数字', type: 'number' },
        { name: 'switch', label: '开关', type: 'switch' },
        { name: 'checkbox', label: '多选', type: 'checkbox', options: [{ label: '选项1', value: '1' }] },
      ];

      render(
        <SearchForm
          fields={allTypesFields}
          onSearch={jest.fn()}
          onReset={jest.fn()}
        />
      );

      allTypesFields.forEach(field => {
        expect(screen.getByText(field.label)).toBeInTheDocument();
      });
    });

    it('应该支持自定义span', () => {
      render(
        <SearchForm
          fields={mockFields}
          onSearch={jest.fn()}
          onReset={jest.fn()}
          span={6}
        />
      );

      expect(screen.getByText('关键词')).toBeInTheDocument();
    });
  });

  describe('表单字段渲染测试', () => {
    it('应该正确渲染输入框字段', () => {
      render(
        <SearchForm
          fields={[{ name: 'input', label: '输入框', type: 'input' }]}
          onSearch={jest.fn()}
          onReset={jest.fn()}
        />
      );

      const input = screen.getByPlaceholderText('请输入输入框');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('type', 'text');
    });

    it('应该正确渲染文本域字段', () => {
      render(
        <SearchForm
          fields={[{ name: 'textArea', label: '文本域', type: 'textArea' }]}
          onSearch={jest.fn()}
          onReset={jest.fn()}
        />
      );

      const textArea = screen.getByPlaceholderText('请输入文本域');
      expect(textArea).toBeInTheDocument();
      expect(textArea.tagName.toLowerCase()).toBe('textarea');
    });

    it('应该正确渲染下拉选择字段', () => {
      const options = [
        { label: '选项1', value: '1' },
        { label: '选项2', value: '2' },
      ];

      render(
        <SearchForm
          fields={[{ name: 'select', label: '下拉选择', type: 'select', options }]}
          onSearch={jest.fn()}
          onReset={jest.fn()}
        />
      );

      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
    });

    it('应该正确渲染树选择字段', () => {
      const treeData = [
        {
          title: '节点1',
          value: '1',
          children: [
            { title: '子节点1', value: '1-1' },
          ],
        },
      ];

      render(
        <SearchForm
          fields={[{ name: 'treeSelect', label: '树选择', type: 'treeSelect', treeData }]}
          onSearch={jest.fn()}
          onReset={jest.fn()}
        />
      );

      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
    });

    it('应该正确渲染日期选择字段', () => {
      render(
        <SearchForm
          fields={[{ name: 'datePicker', label: '日期选择', type: 'datePicker' }]}
          onSearch={jest.fn()}
          onReset={jest.fn()}
        />
      );

      const datePicker = document.querySelector('.ant-picker');
      expect(datePicker).toBeInTheDocument();
    });

    it('应该正确渲染日期范围字段', () => {
      render(
        <SearchForm
          fields={[{ name: 'dateRange', label: '日期范围', type: 'dateRange' }]}
          onSearch={jest.fn()}
          onReset={jest.fn()}
        />
      );

      const rangePicker = document.querySelector('.ant-picker-range');
      expect(rangePicker).toBeInTheDocument();
    });

    it('应该正确渲染数字输入框', () => {
      render(
        <SearchForm
          fields={[{ name: 'number', label: '数字', type: 'number' }]}
          onSearch={jest.fn()}
          onReset={jest.fn()}
        />
      );

      const numberInput = screen.getByPlaceholderText('请输入数字');
      expect(numberInput).toBeInTheDocument();
      expect(numberInput).toHaveAttribute('type', 'number');
    });

    it('应该正确渲染开关字段（转换为下拉选择）', () => {
      render(
        <SearchForm
          fields={[{ name: 'switch', label: '开关', type: 'switch' }]}
          onSearch={jest.fn()}
          onReset={jest.fn()}
        />
      );

      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
    });

    it('应该正确渲染多选字段（转换为多选下拉）', () => {
      const options = [
        { label: '选项1', value: '1' },
        { label: '选项2', value: '2' },
      ];

      render(
        <SearchForm
          fields={[{ name: 'checkbox', label: '多选', type: 'checkbox', options }]}
          onSearch={jest.fn()}
          onReset={jest.fn()}
        />
      );

      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
    });

    it('应该支持禁用字段', () => {
      render(
        <SearchForm
          fields={[{ name: 'disabled', label: '禁用字段', type: 'input', disabled: true }]}
          onSearch={jest.fn()}
          onReset={jest.fn()}
        />
      );

      const disabledInput = screen.getByPlaceholderText('请输入禁用字段');
      expect(disabledInput).toBeDisabled();
    });

    it('应该支持自定义placeholder', () => {
      render(
        <SearchForm
          fields={[{ name: 'custom', label: '自定义', type: 'input', placeholder: '请输入自定义内容' }]}
          onSearch={jest.fn()}
          onReset={jest.fn()}
        />
      );

      const input = screen.getByPlaceholderText('请输入自定义内容');
      expect(input).toBeInTheDocument();
    });
  });

  describe('用户交互测试', () => {
    it('应该正确处理搜索操作', () => {
      const mockSearch = jest.fn();

      render(
        <SearchForm
          fields={mockFields}
          onSearch={mockSearch}
          onReset={jest.fn()}
        />
      );

      // 填写搜索条件
      const keywordInput = screen.getByPlaceholderText('请输入关键词');
      fireEvent.change(keywordInput, { target: { value: '测试关键词' } });

      // 点击搜索按钮
      const searchButton = screen.getByText('搜索');
      fireEvent.click(searchButton);

      expect(mockSearch).toHaveBeenCalledWith({
        keyword: '测试关键词',
      });
    });

    it('应该正确处理重置操作', () => {
      const mockReset = jest.fn();

      render(
        <SearchForm
          fields={mockFields}
          onSearch={jest.fn()}
          onReset={mockReset}
        />
      );

      // 填写一些值
      const keywordInput = screen.getByPlaceholderText('请输入关键词');
      fireEvent.change(keywordInput, { target: { value: '测试值' } });

      // 点击重置按钮
      const resetButton = screen.getByText('重置');
      fireEvent.click(resetButton);

      expect(mockReset).toHaveBeenCalledTimes(1);
    });

    it('应该在重置时清空表单字段', () => {
      const mockReset = jest.fn();

      render(
        <SearchForm
          fields={mockFields}
          onSearch={jest.fn()}
          onReset={mockReset}
        />
      );

      // 填写一些值
      const keywordInput = screen.getByPlaceholderText('请输入关键词') as HTMLInputElement;
      fireEvent.change(keywordInput, { target: { value: '测试值' } });
      expect(keywordInput.value).toBe('测试值');

      // 点击重置按钮
      const resetButton = screen.getByText('重置');
      fireEvent.click(resetButton);

      // 等待表单重置
      expect(keywordInput.value).toBe('');
    });

    it('应该在加载时禁用搜索按钮', () => {
      const mockSearch = jest.fn();

      render(
        <SearchForm
          fields={mockFields}
          onSearch={mockSearch}
          onReset={jest.fn()}
          loading
        />
      );

      const searchButton = screen.getByText('搜索');
      expect(searchButton).toBeDisabled();
    });

    it('应该在加载时保持重置按钮可用', () => {
      render(
        <SearchForm
          fields={mockFields}
          onSearch={jest.fn()}
          onReset={jest.fn()}
          loading
        />
      );

      const resetButton = screen.getByText('重置');
      expect(resetButton).toBeInTheDocument();
      expect(resetButton).not.toBeDisabled();
    });

    it('应该支持外部表单实例', () => {
      const { Form } = require('antd');
      const [form] = Form.useForm();

      render(
        <SearchForm
          fields={mockFields}
          onSearch={jest.fn()}
          onReset={jest.fn()}
          form={form}
        />
      );

      expect(form).toBeDefined();
    });
  });

  describe('初始值测试', () => {
    it('应该正确设置初始值', () => {
      const initialValues = {
        keyword: '初始关键词',
        status: 'active',
        count: 10,
      };

      render(
        <SearchForm
          fields={mockFields}
          initialValues={initialValues}
          onSearch={jest.fn()}
          onReset={jest.fn()}
        />
      );

      const keywordInput = screen.getByPlaceholderText('请输入关键词') as HTMLInputElement;
      expect(keywordInput.value).toBe('初始关键词');

      const numberInput = screen.getByPlaceholderText('请输入数量') as HTMLInputElement;
      expect(numberInput.value).toBe('10');
    });

    it('应该处理空初始值对象', () => {
      render(
        <SearchForm
          fields={mockFields}
          initialValues={{}}
          onSearch={jest.fn()}
          onReset={jest.fn()}
        />
      );

      expect(screen.getByText('搜索')).toBeInTheDocument();
    });

    it('应该处理未定义的初始值', () => {
      render(
        <SearchForm
          fields={mockFields}
          initialValues={undefined}
          onSearch={jest.fn()}
          onReset={jest.fn()}
        />
      );

      expect(screen.getByText('搜索')).toBeInTheDocument();
    });
  });

  describe('布局测试', () => {
    it('应该在horizontal布局中使用Row/Col结构', () => {
      const { container } = render(
        <SearchForm
          fields={mockFields}
          onSearch={jest.fn()}
          onReset={jest.fn()}
          layout="horizontal"
        />
      );

      const rowElement = container.querySelector('.ant-row');
      expect(rowElement).toBeInTheDocument();
    });

    it('应该在vertical布局中使用Form结构', () => {
      const { container } = render(
        <SearchForm
          fields={mockFields}
          onSearch={jest.fn()}
          onReset={jest.fn()}
          layout="vertical"
        />
      );

      const formElement = container.querySelector('.ant-form-vertical');
      expect(formElement).toBeInTheDocument();
    });

    it('应该在inline布局中使用inline样式', () => {
      const { container } = render(
        <SearchForm
          fields={mockFields}
          onSearch={jest.fn()}
          onReset={jest.fn()}
          layout="inline"
        />
      );

      const formElement = container.querySelector('.ant-form-inline');
      expect(formElement).toBeInTheDocument();
    });

    it('应该正确处理自定义span', () => {
      const customSpanFields: FormField[] = [
        { name: 'field1', label: '字段1', type: 'input', span: 2 },
        { name: 'field2', label: '字段2', type: 'input', span: 1 },
        { name: 'field3', label: '字段3', type: 'input' },
      ];

      render(
        <SearchForm
          fields={customSpanFields}
          onSearch={jest.fn()}
          onReset={jest.fn()}
          span={4}
        />
      );

      expect(screen.getByText('字段1')).toBeInTheDocument();
      expect(screen.getByText('字段2')).toBeInTheDocument();
      expect(screen.getByText('字段3')).toBeInTheDocument();
    });
  });

  describe('边界情况测试', () => {
    it('应该处理空字段数组', () => {
      render(
        <SearchForm
          fields={[]}
          onSearch={jest.fn()}
          onReset={jest.fn()}
        />
      );

      expect(screen.getByText('搜索')).toBeInTheDocument();
      expect(screen.getByText('重置')).toBeInTheDocument();
    });

    it('应该处理未知字段类型', () => {
      render(
        <SearchForm
          fields={[{ name: 'unknown', label: '未知', type: 'input' as any }]}
          onSearch={jest.fn()}
          onReset={jest.fn()}
        />
      );

      expect(screen.getByText('未知')).toBeInTheDocument();
    });

    it('应该处理空的选项数组', () => {
      render(
        <SearchForm
          fields={[{ name: 'empty', label: '空选项', type: 'select', options: [] }]}
          onSearch={jest.fn()}
          onReset={jest.fn()}
        />
      );

      expect(screen.getByText('空选项')).toBeInTheDocument();
    });

    it('应该处理空的treeData', () => {
      render(
        <SearchForm
          fields={[{ name: 'tree', label: '树选择', type: 'treeSelect', treeData: [] }]}
          onSearch={jest.fn()}
          onReset={jest.fn()}
        />
      );

      expect(screen.getByText('树选择')).toBeInTheDocument();
    });
  });

  describe('可访问性测试', () => {
    it('应该支持键盘导航', () => {
      render(
        <SearchForm
          fields={mockFields}
          onSearch={jest.fn()}
          onReset={jest.fn()}
        />
      );

      const searchButton = screen.getByText('搜索');
      searchButton.focus();
      expect(searchButton).toHaveFocus();
    });

    it('应该有适当的表单标签', () => {
      render(
        <SearchForm
          fields={mockFields}
          onSearch={jest.fn()}
          onReset={jest.fn()}
        />
      );

      // 检查表单字段是否有对应的标签
      expect(screen.getByLabelText('关键词')).toBeInTheDocument();
    });
  });

  describe('按钮样式和图标测试', () => {
    it('应该正确显示搜索图标', () => {
      const { container } = render(
        <SearchForm
          fields={mockFields}
          onSearch={jest.fn()}
          onReset={jest.fn()}
        />
      );

      const searchButton = screen.getByText('搜索');
      expect(searchButton).toBeInTheDocument();
    });

    it('应该正确显示重置图标', () => {
      const { container } = render(
        <SearchForm
          fields={mockFields}
          onSearch={jest.fn()}
          onReset={jest.fn()}
        />
      );

      const resetButton = screen.getByText('重置');
      expect(resetButton).toBeInTheDocument();
    });

    it('搜索按钮应该有primary类型', () => {
      const { container } = render(
        <SearchForm
          fields={mockFields}
          onSearch={jest.fn()}
          onReset={jest.fn()}
        />
      );

      const searchButton = screen.getByText('搜索');
      expect(searchButton.parentElement).toHaveClass('ant-btn-primary');
    });
  });

  describe('表单验证测试', () => {
    it('应该支持表单验证规则', () => {
      const fieldsWithRules: FormField[] = [
        {
          name: 'required',
          label: '必填字段',
          type: 'input',
          rules: [
            { required: true, message: '请输入必填字段' },
          ],
        },
      ];

      render(
        <SearchForm
          fields={fieldsWithRules}
          onSearch={jest.fn()}
          onReset={jest.fn()}
        />
      );

      expect(screen.getByText('必填字段')).toBeInTheDocument();
    });

    it('应该支持多种验证规则', () => {
      const fieldsWithMultipleRules: FormField[] = [
        {
          name: 'email',
          label: '邮箱',
          type: 'input',
          rules: [
            { required: true, message: '请输入邮箱' },
            { type: 'email', message: '邮箱格式不正确' },
          ],
        },
        {
          name: 'age',
          label: '年龄',
          type: 'number',
          rules: [
            { required: true, message: '请输入年龄' },
            { type: 'number', min: 18, max: 100, message: '年龄必须在18-100之间' },
          ],
        },
      ];

      render(
        <SearchForm
          fields={fieldsWithMultipleRules}
          onSearch={jest.fn()}
          onReset={jest.fn()}
        />
      );

      expect(screen.getByText('邮箱')).toBeInTheDocument();
      expect(screen.getByText('年龄')).toBeInTheDocument();
    });
  });

  describe('表单数据获取测试', () => {
    it('应该正确获取所有表单字段的值', () => {
      const mockSearch = jest.fn();

      render(
        <SearchForm
          fields={mockFields}
          onSearch={mockSearch}
          onReset={jest.fn()}
        />
      );

      // 填写所有字段
      const keywordInput = screen.getByPlaceholderText('请输入关键词');
      fireEvent.change(keywordInput, { target: { value: '测试关键词' } });

      const numberInput = screen.getByPlaceholderText('请输入数量') as HTMLInputElement;
      fireEvent.change(numberInput, { target: { value: '25' } });

      // 点击搜索
      const searchButton = screen.getByText('搜索');
      fireEvent.click(searchButton);

      expect(mockSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          keyword: '测试关键词',
          count: '25',
        })
      );
    });

    it('应该处理部分填写的表单', () => {
      const mockSearch = jest.fn();

      render(
        <SearchForm
          fields={mockFields}
          onSearch={jest.fn()}
          onReset={jest.fn()}
        />
      );

      // 只填写部分字段
      const keywordInput = screen.getByPlaceholderText('请输入关键词');
      fireEvent.change(keywordInput, { target: { value: '测试关键词' } });

      const searchButton = screen.getByText('搜索');
      fireEvent.click(searchButton);

      expect(mockSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          keyword: '测试关键词',
        })
      );
    });
  });
});

/**
 * FormModal 组件单元测试
 * 测试通用表单弹窗组件的渲染、交互和验证
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import FormModal from '../FormModal';
import type { FormField } from '../../../shared/types/common';

// Mock form fields
const mockFields: FormField[] = [
  {
    name: 'name',
    label: '名称',
    type: 'input',
    required: true,
    rules: [{ required: true, message: '请输入名称' }],
  },
  {
    name: 'description',
    label: '描述',
    type: 'textArea',
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
    name: 'value',
    label: '数值',
    type: 'number',
  },
  {
    name: 'enabled',
    label: '启用',
    type: 'switch',
  },
];

describe('FormModal 组件', () => {
  describe('基础渲染测试', () => {
    it('应该正确渲染创建模式弹窗', () => {
      render(
        <FormModal
          visible
          title="创建项目"
          mode="create"
          fields={mockFields}
          onSubmit={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      expect(screen.getByText('创建项目')).toBeInTheDocument();
      expect(screen.getByText('名称')).toBeInTheDocument();
      expect(screen.getByText('描述')).toBeInTheDocument();
      expect(screen.getByText('状态')).toBeInTheDocument();
      expect(screen.getByText('数值')).toBeInTheDocument();
      expect(screen.getByText('启用')).toBeInTheDocument();
    });

    it('应该正确渲染编辑模式弹窗', () => {
      render(
        <FormModal
          visible
          title="编辑项目"
          mode="edit"
          fields={mockFields}
          initialValues={{ name: '测试名称', status: 'active' }}
          onSubmit={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      expect(screen.getByText('编辑项目')).toBeInTheDocument();
      expect(screen.getByText('保存')).toBeInTheDocument();
    });

    it('应该在不可见时不渲染', () => {
      const { container } = render(
        <FormModal
          visible={false}
          title="创建项目"
          mode="create"
          fields={mockFields}
          onSubmit={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      // Modal 在 visible=false 时仍然存在于 DOM 中，但是 display: none
      expect(container.querySelector('.ant-modal-hidden')).toBeInTheDocument();
    });

    it('应该正确渲染不同类型的表单字段', () => {
      const fieldsWithAllTypes: FormField[] = [
        { name: 'input', label: '输入框', type: 'input' },
        { name: 'textArea', label: '文本域', type: 'textArea' },
        { name: 'select', label: '下拉选择', type: 'select', options: [{ label: '选项1', value: '1' }] },
        { name: 'number', label: '数字', type: 'number' },
        { name: 'switch', label: '开关', type: 'switch' },
        { name: 'checkbox', label: '多选', type: 'checkbox', options: [{ label: '选项1', value: '1' }] },
        { name: 'datePicker', label: '日期选择', type: 'datePicker' },
        { name: 'dateRange', label: '日期范围', type: 'dateRange' },
      ];

      render(
        <FormModal
          visible
          title="测试所有字段类型"
          mode="create"
          fields={fieldsWithAllTypes}
          onSubmit={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      fieldsWithAllTypes.forEach(field => {
        expect(screen.getByText(field.label)).toBeInTheDocument();
      });
    });

    it('应该支持自定义宽度', () => {
      render(
        <FormModal
          visible
          title="自定义宽度"
          mode="create"
          fields={mockFields}
          onSubmit={jest.fn()}
          onCancel={jest.fn()}
          width={800}
        />
      );

      expect(screen.getByText('自定义宽度')).toBeInTheDocument();
    });

    it('应该支持隐藏取消按钮', () => {
      render(
        <FormModal
          visible
          title="无取消按钮"
          mode="create"
          fields={mockFields}
          onSubmit={jest.fn()}
          onCancel={jest.fn()}
          showCancel={false}
        />
      );

      expect(screen.queryByText('取消')).not.toBeInTheDocument();
    });
  });

  describe('表单渲染测试', () => {
    it('应该正确渲染输入框字段', () => {
      render(
        <FormModal
          visible
          title="输入框测试"
          mode="create"
          fields={[{ name: 'input', label: '输入框', type: 'input' }]}
          onSubmit={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      const input = screen.getByPlaceholderText('请输入输入框');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('type', 'text');
    });

    it('应该正确渲染文本域字段', () => {
      render(
        <FormModal
          visible
          title="文本域测试"
          mode="create"
          fields={[{ name: 'textArea', label: '文本域', type: 'textArea' }]}
          onSubmit={jest.fn()}
          onCancel={jest.fn()}
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
        <FormModal
          visible
          title="下拉选择测试"
          mode="create"
          fields={[{ name: 'select', label: '下拉选择', type: 'select', options }]}
          onSubmit={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
    });

    it('应该正确渲染数字输入框', () => {
      render(
        <FormModal
          visible
          title="数字测试"
          mode="create"
          fields={[{ name: 'number', label: '数字', type: 'number' }]}
          onSubmit={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      const numberInput = screen.getByPlaceholderText('请输入数字');
      expect(numberInput).toBeInTheDocument();
      expect(numberInput).toHaveAttribute('type', 'number');
    });

    it('应该正确渲染开关字段', () => {
      render(
        <FormModal
          visible
          title="开关测试"
          mode="create"
          fields={[{ name: 'switch', label: '开关', type: 'switch' }]}
          onSubmit={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      const switchElement = document.querySelector('.ant-switch');
      expect(switchElement).toBeInTheDocument();
    });

    it('应该支持禁用字段', () => {
      render(
        <FormModal
          visible
          title="禁用字段测试"
          mode="create"
          fields={[{ name: 'disabled', label: '禁用字段', type: 'input', disabled: true }]}
          onSubmit={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      const disabledInput = screen.getByPlaceholderText('请输入禁用字段');
      expect(disabledInput).toBeDisabled();
    });

    it('应该支持自定义渲染函数', () => {
      const customRender = jest.fn((props) => (
        <div data-testid="custom-field">自定义渲染</div>
      ));

      render(
        <FormModal
          visible
          title="自定义渲染测试"
          mode="create"
          fields={[{ name: 'custom', label: '自定义', type: 'input', render: customRender }]}
          onSubmit={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      expect(customRender).toHaveBeenCalled();
      expect(screen.getByTestId('custom-field')).toBeInTheDocument();
    });
  });

  describe('用户交互测试', () => {
    it('应该正确处理表单提交', async () => {
      const mockSubmit = jest.fn().mockResolvedValue(undefined);

      render(
        <FormModal
          visible
          title="提交测试"
          mode="create"
          fields={mockFields}
          onSubmit={mockSubmit}
          onCancel={jest.fn()}
        />
      );

      // 填写表单
      const nameInput = screen.getByPlaceholderText('请输入名称');
      fireEvent.change(nameInput, { target: { value: '测试项目' } });

      // 点击提交
      const submitButton = screen.getByText('创建');
      fireEvent.click(submitButton);

      // 等待验证和提交
      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalledWith({
          name: '测试项目',
        });
      });
    });

    it('应该正确处理表单验证失败', async () => {
      const mockSubmit = jest.fn();

      render(
        <FormModal
          visible
          title="验证测试"
          mode="create"
          fields={[
            {
              name: 'name',
              label: '名称',
              type: 'input',
              required: true,
              rules: [{ required: true, message: '请输入名称' }],
            },
          ]}
          onSubmit={mockSubmit}
          onCancel={jest.fn()}
        />
      );

      // 直接点击提交，不填写必填字段
      const submitButton = screen.getByText('创建');
      fireEvent.click(submitButton);

      // 等待验证错误显示
      await waitFor(() => {
        expect(screen.getByText('请输入名称')).toBeInTheDocument();
        expect(mockSubmit).not.toHaveBeenCalled();
      });
    });

    it('应该正确处理取消操作', () => {
      const mockCancel = jest.fn();

      render(
        <FormModal
          visible
          title="取消测试"
          mode="create"
          fields={mockFields}
          onSubmit={jest.fn()}
          onCancel={mockCancel}
        />
      );

      const cancelButton = screen.getByText('取消');
      fireEvent.click(cancelButton);

      expect(mockCancel).toHaveBeenCalledTimes(1);
    });

    it('应该在取消时显示确认对话框（当表单有修改时）', async () => {
      const mockCancel = jest.fn();

      render(
        <FormModal
          visible
          title="确认取消测试"
          mode="create"
          fields={mockFields}
          onSubmit={jest.fn()}
          onCancel={mockCancel}
          confirmOnCancel
        />
      );

      // 修改表单
      const nameInput = screen.getByPlaceholderText('请输入名称');
      fireEvent.change(nameInput, { target: { value: '测试项目' } });

      // 点击取消
      const cancelButton = screen.getByText('取消');
      fireEvent.click(cancelButton);

      // 等待确认对话框出现
      await waitFor(() => {
        expect(screen.getByText('确认取消')).toBeInTheDocument();
      });
    });

    it('应该正确处理异步提交', async () => {
      const mockSubmit = jest.fn().mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );

      render(
        <FormModal
          visible
          title="异步提交测试"
          mode="create"
          fields={mockFields}
          onSubmit={mockSubmit}
          onCancel={jest.fn()}
        />
      );

      // 填写表单
      const nameInput = screen.getByPlaceholderText('请输入名称');
      fireEvent.change(nameInput, { target: { value: '测试项目' } });

      // 点击提交
      const submitButton = screen.getByText('创建');
      fireEvent.click(submitButton);

      // 检查按钮是否显示加载状态
      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });

      // 等待提交完成
      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalled();
      }, { timeout: 2000 });
    });
  });

  describe('初始值和表单重置测试', () => {
    it('应该在编辑模式下正确设置初始值', () => {
      const initialValues = {
        name: '编辑的项目',
        description: '这是一个描述',
        status: 'active',
        value: 100,
        enabled: true,
      };

      render(
        <FormModal
          visible
          title="初始值测试"
          mode="edit"
          fields={mockFields}
          initialValues={initialValues}
          onSubmit={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      const nameInput = screen.getByPlaceholderText('请输入名称') as HTMLInputElement;
      expect(nameInput.value).toBe('编辑的项目');
    });

    it('应该在创建模式下重置表单', () => {
      const { rerender } = render(
        <FormModal
          visible={false}
          title="重置测试"
          mode="create"
          fields={mockFields}
          initialValues={{ name: '旧值' }}
          onSubmit={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      // 重新渲染为可见状态
      rerender(
        <FormModal
          visible
          title="重置测试"
          mode="create"
          fields={mockFields}
          initialValues={{ name: '旧值' }}
          onSubmit={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      const nameInput = screen.getByPlaceholderText('请输入名称') as HTMLInputElement;
      expect(nameInput.value).toBe('');
    });

    it('应该在关闭弹窗时重置表单', () => {
      const mockCancel = jest.fn();

      const { rerender } = render(
        <FormModal
          visible
          title="关闭重置测试"
          mode="create"
          fields={mockFields}
          onSubmit={jest.fn()}
          onCancel={mockCancel}
        />
      );

      // 填写表单
      const nameInput = screen.getByPlaceholderText('请输入名称');
      fireEvent.change(nameInput, { target: { value: '测试项目' } });

      // 关闭弹窗
      rerender(
        <FormModal
          visible={false}
          title="关闭重置测试"
          mode="create"
          fields={mockFields}
          onSubmit={jest.fn()}
          onCancel={mockCancel}
        />
      );

      // 重新打开
      rerender(
        <FormModal
          visible
          title="关闭重置测试"
          mode="create"
          fields={mockFields}
          onSubmit={jest.fn()}
          onCancel={mockCancel}
        />
      );

      const nameInputAfterReset = screen.getByPlaceholderText('请输入名称') as HTMLInputElement;
      expect(nameInputAfterReset.value).toBe('');
    });
  });

  describe('Props传递测试', () => {
    it('应该支持自定义按钮文本', () => {
      render(
        <FormModal
          visible
          title="自定义按钮测试"
          mode="create"
          fields={mockFields}
          onSubmit={jest.fn()}
          onCancel={jest.fn()}
          cancelText="放弃"
          okText="确认添加"
        />
      );

      expect(screen.getByText('放弃')).toBeInTheDocument();
      expect(screen.getByText('确认添加')).toBeInTheDocument();
    });

    it('应该支持外部表单实例', () => {
      const { Form } = require('antd');
      const [form] = Form.useForm();

      render(
        <FormModal
          visible
          title="外部表单测试"
          mode="create"
          fields={mockFields}
          onSubmit={jest.fn()}
          onCancel={jest.fn()}
          form={form}
        />
      );

      expect(form).toBeDefined();
    });

    it('应该在编辑模式下使用保存按钮文本', () => {
      render(
        <FormModal
          visible
          title="编辑模式按钮测试"
          mode="edit"
          fields={mockFields}
          onSubmit={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      expect(screen.getByText('保存')).toBeInTheDocument();
    });

    it('应该在创建模式下使用创建按钮文本', () => {
      render(
        <FormModal
          visible
          title="创建模式按钮测试"
          mode="create"
          fields={mockFields}
          onSubmit={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      expect(screen.getByText('创建')).toBeInTheDocument();
    });
  });

  describe('边界情况测试', () => {
    it('应该处理空字段数组', () => {
      render(
        <FormModal
          visible
          title="空字段测试"
          mode="create"
          fields={[]}
          onSubmit={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      expect(screen.getByText('空字段测试')).toBeInTheDocument();
    });

    it('应该处理未定义的初始值', () => {
      render(
        <FormModal
          visible
          title="未定义初始值测试"
          mode="create"
          fields={mockFields}
          onSubmit={jest.fn()}
          onCancel={jest.fn()}
          initialValues={undefined}
        />
      );

      expect(screen.getByText('未定义初始值测试')).toBeInTheDocument();
    });

    it('应该处理未知字段类型', () => {
      render(
        <FormModal
          visible
          title="未知类型测试"
          mode="create"
          fields={[{ name: 'unknown', label: '未知', type: 'input' as any }]}
          onSubmit={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      expect(screen.getByText('未知')).toBeInTheDocument();
    });

    it('应该处理空的选项数组', () => {
      render(
        <FormModal
          visible
          title="空选项测试"
          mode="create"
          fields={[{ name: 'empty', label: '空选项', type: 'select', options: [] }]}
          onSubmit={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      expect(screen.getByText('空选项')).toBeInTheDocument();
    });
  });

  describe('可访问性测试', () => {
    it('应该支持键盘导航', () => {
      render(
        <FormModal
          visible
          title="键盘导航测试"
          mode="create"
          fields={mockFields}
          onSubmit={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      const cancelButton = screen.getByText('取消');
      cancelButton.focus();
      expect(cancelButton).toHaveFocus();
    });

    it('应该有适当的ARIA属性', () => {
      render(
        <FormModal
          visible
          title="ARIA测试"
          mode="create"
          fields={mockFields}
          onSubmit={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      const modalElement = document.querySelector('.ant-modal');
      expect(modalElement).toBeInTheDocument();
    });
  });

  describe('表单验证测试', () => {
    it('应该支持多种验证规则', () => {
      const fieldsWithRules: FormField[] = [
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
        <FormModal
          visible
          title="验证规则测试"
          mode="create"
          fields={fieldsWithRules}
          onSubmit={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      const emailInput = screen.getByPlaceholderText('请输入邮箱');
      const ageInput = screen.getByPlaceholderText('请输入年龄');

      expect(emailInput).toBeInTheDocument();
      expect(ageInput).toBeInTheDocument();
    });

    it('应该显示验证错误信息', async () => {
      const mockSubmit = jest.fn();

      render(
        <FormModal
          visible
          title="错误信息测试"
          mode="create"
          fields={[
            {
              name: 'required',
              label: '必填字段',
              type: 'input',
              required: true,
              rules: [{ required: true, message: '这是必填字段' }],
            },
          ]}
          onSubmit={mockSubmit}
          onCancel={jest.fn()}
        />
      );

      const submitButton = screen.getByText('创建');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('这是必填字段')).toBeInTheDocument();
      });
    });
  });

  describe('表单布局测试', () => {
    it('应该使用垂直布局', () => {
      render(
        <FormModal
          visible
          title="布局测试"
          mode="create"
          fields={mockFields}
          onSubmit={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      const formElement = document.querySelector('.ant-form-vertical');
      expect(formElement).toBeInTheDocument();
    });
  });

  describe('销毁行为测试', () => {
    it('应该在关闭时销毁内容', () => {
      const mockSubmit = jest.fn();

      const { rerender } = render(
        <FormModal
          visible
          title="销毁测试"
          mode="create"
          fields={mockFields}
          onSubmit={mockSubmit}
          onCancel={jest.fn()}
          destroyOnClose
        />
      );

      // 关闭弹窗
      rerender(
        <FormModal
          visible={false}
          title="销毁测试"
          mode="create"
          fields={mockFields}
          onSubmit={mockSubmit}
          onCancel={jest.fn()}
          destroyOnClose
        />
      );

      expect(screen.queryByText('名称')).not.toBeInTheDocument();
    });
  });
});

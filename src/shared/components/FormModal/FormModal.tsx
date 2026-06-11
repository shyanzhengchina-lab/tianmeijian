/**
 * 表单弹窗通用组件
 * 封装Ant Design Modal + Form，提供统一的表单弹窗功能
 */

import React, { useEffect, useCallback } from 'react';
import { Modal, Form, Button, Space, Input, Select, DatePicker } from 'antd';
import type { FormInstance, FormProps } from 'antd/es/form';

/**
 * 表单字段类型
 */
export interface FormField {
  name: string;
  label: string;
  type: 'input' | 'select' | 'textarea' | 'number' | 'datePicker' | 'dateRange';
  placeholder?: string;
  options?: Array<{ label: string; value: any }>;
  required?: boolean;
  disabled?: boolean;
  rules?: any[];
  span?: number;
  width?: number | string;
  mode?: 'multiple' | 'tags';
}

/**
 * FormModal组件Props
 */
export interface FormModalProps<T> {
  visible: boolean;
  title: string;
  mode: 'create' | 'edit';
  initialValues?: Partial<T>;
  fields: FormField[];
  onSubmit: (values: T) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  width?: number | string;
  formProps?: FormProps;
  submitText?: string;
  cancelText?: string;
}

/**
 * FormModal组件
 */
function FormModal<T extends Record<string, any>>({
  visible,
  title,
  mode = 'create',
  initialValues = {},
  fields,
  onSubmit,
  onCancel,
  loading = false,
  width = 600,
  formProps,
  submitText = mode === 'create' ? '创建' : '保存',
  cancelText = '取消',
}: FormModalProps<T>) {
  const [form] = Form.useForm<T>();

  // 监听visible变化，重置表单
  useEffect(() => {
    if (visible) {
      form.resetFields();
      if (mode === 'edit' && initialValues) {
        form.setFieldsValue(initialValues as any);
      }
    }
  }, [visible, mode, initialValues, form]);

  // 渲染表单字段
  const renderField = useCallback((field: FormField) => {
    // 自动把 required:true 转换为 rules（若没有显式指定 rules）
    const autoRules = field.rules
      ? field.rules
      : field.required
        ? [{ required: true, message: `请${field.type === 'select' ? '选择' : '输入'}${field.label}` }]
        : undefined;

    const fieldProps: any = {
      label: field.label,
      name: field.name,
      rules: autoRules,
      disabled: field.disabled,
    };

    switch (field.type) {
      case 'input':
        return (
          <Form.Item {...fieldProps}>
            <Input placeholder={field.placeholder} allowClear />
          </Form.Item>
        );

      case 'number':
        return (
          <Form.Item {...fieldProps}>
            <Input type="number" placeholder={field.placeholder} allowClear />
          </Form.Item>
        );

      case 'textarea':
        return (
          <Form.Item {...fieldProps}>
            <Input.TextArea
              placeholder={field.placeholder}
              rows={4}
              allowClear
            />
          </Form.Item>
        );

      case 'select':
        return (
          <Form.Item {...fieldProps}>
            <Select
              placeholder={field.placeholder || `请选择${field.label}`}
              allowClear
              showSearch
              filterOption={(input, option) =>
                String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={field.options}
              mode={field.mode}
            />
          </Form.Item>
        );

      case 'datePicker':
        return (
          <Form.Item {...fieldProps}>
            <DatePicker
              placeholder={field.placeholder}
              allowClear
              style={{ width: '100%' }}
            />
          </Form.Item>
        );

      case 'dateRange':
        return (
          <Form.Item {...fieldProps}>
            <DatePicker.RangePicker
              placeholder={['开始日期', '结束日期']}
              allowClear
              style={{ width: '100%' }}
            />
          </Form.Item>
        );

      default:
        return (
          <Form.Item {...fieldProps}>
            <Input placeholder={field.placeholder} allowClear />
          </Form.Item>
        );
    }
  }, []);

  // 处理提交
  const handleOk = useCallback(async () => {
    try {
      const values = await form.validateFields();
      await onSubmit(values);
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  }, [form, onSubmit]);

  // 处理取消
  const handleCancel = useCallback(() => {
    form.resetFields();
    onCancel();
  }, [form, onCancel]);

  // 渲染表单字段
  const renderFields = () => {
    return fields.map(field => (
      <Form.Item key={field.name} style={{ marginBottom: 16 }}>
        {renderField(field)}
      </Form.Item>
    ));
  };

  // 渲染底部操作按钮
  const renderFooter = () => {
    return (
      <Space>
        <Button onClick={handleCancel}>
          {cancelText}
        </Button>
        <Button type="primary" onClick={handleOk} loading={loading}>
          {submitText}
        </Button>
      </Space>
    );
  };

  return (
    <Modal
      title={title}
      open={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      footer={renderFooter()}
      width={width}
      confirmLoading={loading}
      destroyOnClose
    >
      <Form form={form} layout="vertical" {...formProps}>
        {renderFields()}
      </Form>
    </Modal>
  );
}

export default FormModal;

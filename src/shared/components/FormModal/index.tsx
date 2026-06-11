/**
 * 通用表单弹窗组件
 * 封装Modal和Form，支持新增/编辑模式
 * 保持与现有弹窗完全一致的样式
 * 确保UI/UX零变化
 */
import React, { useEffect } from 'react';
import { Modal, Form, Button, Switch, Checkbox, Input, Select, DatePicker } from 'antd';
import type { FormInstance } from 'antd/es/form';
import type { FormField } from '../../types/common';
export type { FormField };

const { confirm } = Modal;

export interface FormModalProps<T = any> {
  visible: boolean;
  title: string;
  mode?: 'create' | 'edit';
  fields?: FormField[];
  initialValues?: Partial<T>;
  onSubmit: (values: T) => Promise<void> | void;
  onCancel: () => void;
  loading?: boolean;
  width?: number;
  form?: FormInstance;
  showCancel?: boolean;
  cancelText?: string;
  okText?: string;
  confirmOnCancel?: boolean;
  formComponent?: React.ComponentType<any>;
  [key: string]: any; // allow extra props
}

/**
 * FormModal组件
 * 封装Modal和Form，支持表单验证和异步提交
 * 完全兼容现有弹窗的样式和交互
 */
export const FormModal = <T extends Record<string, any>>({
  visible,
  title,
  mode = 'create',
  fields = [],
  initialValues = {},
  onSubmit,
  onCancel,
  loading = false,
  width = 600,
  form,
  showCancel = true,
  cancelText = '取消',
  okText = mode === 'create' ? '创建' : '保存',
  confirmOnCancel = false,
}: FormModalProps<T>) => {
  const [formInstance] = Form.useForm();
  const currentForm = form || formInstance;

  /**
   * 当弹窗打开时，重置表单或设置初始值
   */
  useEffect(() => {
    if (visible) {
      if (mode === 'edit' && Object.keys(initialValues).length > 0) {
        currentForm.setFieldsValue(initialValues);
      } else {
        currentForm.resetFields();
      }
    }
  }, [visible, mode, initialValues, currentForm]);

  /**
   * 处理取消
   */
  const handleCancel = () => {
    if (confirmOnCancel && currentForm.isFieldsTouched()) {
      confirm({
        title: '确认取消',
        content: '表单数据尚未保存，确定要取消吗？',
        okText: '确定',
        cancelText: '继续编辑',
        onOk: () => {
          currentForm.resetFields();
          onCancel();
        },
      });
    } else {
      currentForm.resetFields();
      onCancel();
    }
  };

  /**
   * 处理提交
   */
  const handleOk = async () => {
    try {
      const values = await currentForm.validateFields();

      if (onSubmit) {
        await onSubmit(values as T);
      }
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  /**
   * 根据字段类型渲染表单项
   */
  const renderField = (field: FormField) => {
    const { name, label, type, placeholder, options, treeData, disabled, rules, render } = field;

    // 如果有自定义渲染函数
    if (render) {
      return render({ ...field, form: currentForm });
    }

    // 自动把 required:true 转换为 rules（若没有显式指定 rules）
    const effectiveRules = rules
      ? rules
      : field.required
        ? [{ required: true, message: `请${type === 'select' || type === 'treeSelect' ? '选择' : '输入'}${label}` }]
        : undefined;

    // 根据类型渲染不同的输入控件
    let inputElement: React.ReactNode;

    switch (type) {
      case 'input':
        inputElement = (
          <Form.Item
            key={name}
            name={name}
            label={label}
            rules={effectiveRules}
          >
            <Input placeholder={placeholder || `请输入${label}`} disabled={disabled} allowClear />
          </Form.Item>
        );
        break;

      case 'textArea':
        inputElement = (
          <Form.Item
            key={name}
            name={name}
            label={label}
            rules={effectiveRules}
          >
            <Input.TextArea
              placeholder={placeholder || `请输入${label}`}
              disabled={disabled}
              allowClear
              autoSize={{ minRows: 3, maxRows: 6 }}
            />
          </Form.Item>
        );
        break;

      case 'select':
        inputElement = (
          <Form.Item
            key={name}
            name={name}
            label={label}
            rules={effectiveRules}
          >
            <Select
              placeholder={placeholder || `请选择${label}`}
              disabled={disabled}
              allowClear
              showSearch
              filterOption={(input, option) =>
                String(option?.label ?? (option as any)?.children ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={options}
              mode={field.mode}
            />
          </Form.Item>
        );
        break;

      case 'treeSelect':
        inputElement = (
          <Form.Item
            key={name}
            name={name}
            label={label}
            rules={effectiveRules}
          >
            <Select
              placeholder={placeholder || `请选择${label}`}
              disabled={disabled}
              allowClear
              showSearch
              filterOption={(input, option) =>
                String(option?.label ?? (option as any)?.children ?? '').toLowerCase().includes(input.toLowerCase())
              }
            >
              {treeData?.map((item: any) => (
                <Select.Option key={item.value} value={item.value}>{item.label}</Select.Option>
              ))}
            </Select>
          </Form.Item>
        );
        break;

      case 'datePicker':
        inputElement = (
          <Form.Item
            key={name}
            name={name}
            label={label}
            rules={effectiveRules}
          >
            <DatePicker
              placeholder={placeholder || `请选择${label}`}
              disabled={disabled}
              style={{ width: '100%' }}
              format="YYYY-MM-DD"
            />
          </Form.Item>
        );
        break;

      case 'dateRange':
        inputElement = (
          <Form.Item
            key={name}
            name={name}
            label={label}
            rules={effectiveRules}
          >
            <DatePicker.RangePicker
              placeholder={[`开始${label}`, `结束${label}`]}
              disabled={disabled}
              style={{ width: '100%' }}
              format="YYYY-MM-DD"
            />
          </Form.Item>
        );
        break;

      case 'number':
        inputElement = (
          <Form.Item
            key={name}
            name={name}
            label={label}
            rules={effectiveRules}
          >
            <Input
              type="number"
              placeholder={placeholder || `请输入${label}`}
              disabled={disabled}
            />
          </Form.Item>
        );
        break;

      case 'switch':
        inputElement = (
          <Form.Item
            key={name}
            name={name}
            label={label}
            valuePropName="checked"
          >
            <Switch disabled={disabled} />
          </Form.Item>
        );
        break;

      case 'checkbox':
        inputElement = (
          <Form.Item
            key={name}
            name={name}
            label={label}
          >
            <Checkbox.Group
              disabled={disabled}
              options={options}
            />
          </Form.Item>
        );
        break;

      default:
        inputElement = (
          <Form.Item
            key={name}
            name={name}
            label={label}
            rules={effectiveRules}
          >
            <Input placeholder={placeholder || `请输入${label}`} disabled={disabled} allowClear />
          </Form.Item>
        );
    }

    return inputElement;
  };

  return (
    <Modal
      title={title}
      open={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={loading}
      width={width}
      centered
      destroyOnClose
      maskClosable={!confirmOnCancel}
      okText={okText}
      cancelText={showCancel ? cancelText : null}
      styles={{
        body: { padding: '24px' }
      }}
    >
      <Form
        form={currentForm}
        layout="vertical"
        autoComplete="off"
      >
        {fields.map(field => renderField(field))}
      </Form>
    </Modal>
  );
};

export default FormModal;
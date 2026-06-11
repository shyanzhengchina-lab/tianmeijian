/**
 * 搜索表单通用组件
 * 封装Ant Design Form，提供统一的搜索表单功能
 */

import React, { useCallback } from 'react';
import { Form, Input, Select, DatePicker, Button, Space, Card } from 'antd';
import { SearchOutlined, RedoOutlined } from '@ant-design/icons';
import type { FormInstance, FormProps } from 'antd/es/form';
import type { Dayjs } from 'dayjs';

/**
 * 表单字段类型
 */
export interface FormField {
  name: string;
  label: string;
  type: 'input' | 'select' | 'datePicker' | 'dateRange' | 'number';
  placeholder?: string;
  options?: Array<{ label: string; value: any }>;
  required?: boolean;
  disabled?: boolean;
  rules?: any[];
  span?: number;
  width?: number | string;
}

/**
 * SearchForm组件Props
 */
export interface SearchFormProps<T> {
  fields: FormField[];
  initialValues?: Partial<T>;
  onSearch: (values: T) => void;
  onReset?: () => void;
  loading?: boolean;
  layout?: 'horizontal' | 'inline' | 'vertical';
  cardProps?: React.ComponentProps<typeof Card>;
  formProps?: FormProps;
}

/**
 * SearchForm组件
 */
function SearchForm<T extends Record<string, any>>({
  fields,
  initialValues = {},
  onSearch,
  onReset,
  loading = false,
  layout = 'inline',
  cardProps,
  formProps,
}: SearchFormProps<T>) {
  const [form] = Form.useForm<T>();
  // 设置初始值
  React.useEffect(() => {
    if (initialValues) form.setFieldsValue(initialValues as any);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 处理搜索
  const handleSearch = useCallback(() => {
    const values = form.getFieldsValue();
    onSearch(values);
  }, [form, onSearch]);

  // 处理重置
  const handleReset = useCallback(() => {
    form.resetFields();
    onReset?.();
  }, [form, onReset]);

  // 渲染表单字段
  const renderField = useCallback((field: FormField) => {
    const fieldProps: any = {
      label: field.label,
      name: field.name,
      rules: field.rules,
      disabled: field.disabled,
    };

    switch (field.type) {
      case 'input':
        return (
          <Input
            placeholder={field.placeholder}
            allowClear
            style={{ width: field.width || '200px' }}
          />
        );

      case 'number':
        return (
          <Input
            type="number"
            placeholder={field.placeholder}
            allowClear
            style={{ width: field.width || '150px' }}
          />
        );

      case 'select':
        return (
          <Select
            placeholder={field.placeholder}
            allowClear
            options={field.options}
            style={{ width: field.width || '200px' }}
          />
        );

      case 'datePicker':
        return (
          <DatePicker
            placeholder={field.placeholder}
            allowClear
            style={{ width: field.width || '200px' }}
          />
        );

      case 'dateRange':
        return (
          <DatePicker.RangePicker
            placeholder={['开始日期', '结束日期']}
            allowClear
            style={{ width: field.width || '350px' }}
          />
        );

      default:
        return (
          <Input
            placeholder={field.placeholder}
            allowClear
            style={{ width: field.width || '200px' }}
          />
        );
    }
  }, []);

  // 表格布局
  const formItemLayout = {
    labelCol: layout === 'vertical' ? { span: 24 } : { span: 6 },
    wrapperCol: layout === 'vertical' ? { span: 24 } : { span: 18 },
  };

  // 渲染表单字段
  const renderFields = () => {
    return fields.map(field => {
      const fieldProps: any = {
        label: field.label,
        name: field.name,
        rules: field.rules,
        disabled: field.disabled,
      };
      return (
        <Form.Item key={field.name} {...formItemLayout} {...fieldProps}>
          {renderField(field)}
        </Form.Item>
      );
    });
  };

  // 渲染操作按钮
  const renderActions = () => {
    return (
      <Form.Item>
        <Space>
          <Button
            type="primary"
            icon={<SearchOutlined />}
            onClick={handleSearch}
            loading={loading}
          >
            搜索
          </Button>
          <Button
            icon={<RedoOutlined />}
            onClick={handleReset}
          >
            重置
          </Button>
        </Space>
      </Form.Item>
    );
  };

  return (
    <Card
      {...cardProps}
      bordered={false}
      size="small"
      bodyStyle={{ paddingBottom: 0 }}
    >
      <Form
        form={form}
        layout={layout}
        {...formProps}
      >
        {renderFields()}
        {renderActions()}
      </Form>
    </Card>
  );
}

export default SearchForm;

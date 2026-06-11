/**
 * 通用搜索表单组件
 * 支持多种表单字段类型，保持与现有表单完全一致的样式
 * 确保UI/UX零变化
 */
import React from 'react';
import { Form, Input, Select, DatePicker, Button, Space, Row, Col } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import type { FormInstance } from 'antd/es/form';
import type { FormField } from '../../types/common';
export type { FormField };

const { RangePicker } = DatePicker;
const { Option } = Select;

export interface SearchFormProps<T = any> {
  fields: FormField[];
  initialValues?: Partial<T>;
  onSearch: (values: T) => void;
  onReset?: () => void;
  loading?: boolean;
  layout?: 'horizontal' | 'inline' | 'vertical';
  form?: FormInstance;
  span?: number; // 默认每行显示的字段数
}

/**
 * SearchForm组件
 * 动态生成表单字段，支持搜索和重置功能
 * 保持与现有表单完全一致的样式
 */
export const SearchForm = <T extends Record<string, any>>({
  fields,
  initialValues = {},
  onSearch,
  onReset,
  loading = false,
  layout = 'horizontal',
  form,
  span = 4,
}: SearchFormProps<T>) => {
  const [formInstance] = Form.useForm();
  // 设置初始值
  React.useEffect(() => {
    if (initialValues) formInstance.setFieldsValue(initialValues);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const currentForm = form || formInstance;

  /**
   * 根据字段类型渲染表单项
   */
  const renderField = (field: FormField) => {
    const { name, label, type, placeholder, options, treeData, disabled, rules } = field;

    // 根据类型渲染不同的输入控件
    let inputElement: React.ReactNode;

    switch (type) {
      case 'input':
        inputElement = (
          <Input
            placeholder={placeholder || `请输入${label}`}
            disabled={disabled}
            allowClear
          />
        );
        break;

      case 'textArea':
        inputElement = (
          <Input.TextArea
            placeholder={placeholder || `请输入${label}`}
            disabled={disabled}
            allowClear
            autoSize={{ minRows: 1, maxRows: 3 }}
          />
        );
        break;

      case 'select':
        inputElement = (
          <Select
            placeholder={placeholder || `请选择${label}`}
            disabled={disabled}
            allowClear
          >
            {options?.map((opt, index) => (
              <Option key={`${name}-${index}`} value={opt.value}>
                {opt.label}
              </Option>
            ))}
          </Select>
        );
        break;

      case 'treeSelect':
        inputElement = (
          <Select
            placeholder={placeholder || `请选择${label}`}
            disabled={disabled}
            allowClear
            showSearch
          >
            {treeData?.map((item: any) => (
              <Option key={item.value} value={item.value}>{item.label}</Option>
            ))}
          </Select>
        );
        break;

      case 'datePicker':
        inputElement = (
          <DatePicker
            placeholder={placeholder || `请选择${label}`}
            disabled={disabled}
            style={{ width: '100%' }}
            format="YYYY-MM-DD"
          />
        );
        break;

      case 'dateRange':
        inputElement = (
          <RangePicker
            placeholder={[`开始${label}`, `结束${label}`]}
            disabled={disabled}
            style={{ width: '100%' }}
            format="YYYY-MM-DD"
          />
        );
        break;

      case 'number':
        inputElement = (
          <Input
            type="number"
            placeholder={placeholder || `请输入${label}`}
            disabled={disabled}
          />
        );
        break;

      case 'switch':
        inputElement = (
          <Select
            placeholder={placeholder || `请选择${label}`}
            disabled={disabled}
          >
            <Option value="true">是</Option>
            <Option value="false">否</Option>
          </Select>
        );
        break;

      case 'checkbox':
        inputElement = (
          <Select
            mode="multiple"
            placeholder={placeholder || `请选择${label}`}
            disabled={disabled}
            allowClear
          >
            {options?.map((opt, index) => (
              <Option key={`${name}-${index}`} value={opt.value}>
                {opt.label}
              </Option>
            ))}
          </Select>
        );
        break;

      default:
        inputElement = (
          <Input
            placeholder={placeholder || `请输入${label}`}
            disabled={disabled}
            allowClear
          />
        );
    }

    return (
      <Form.Item
        key={name}
        name={name}
        label={label}
        rules={rules}
      >
        {inputElement}
      </Form.Item>
    );
  };

  /**
   * 处理搜索
   */
  const handleSearch = () => {
    const values = currentForm.getFieldsValue() as T;
    onSearch(values);
  };

  /**
   * 处理重置
   */
  const handleReset = () => {
    currentForm.resetFields();
    if (onReset) onReset();
  };

  /**
   * 根据布局返回不同的渲染方式
   */
  const renderForm = () => {
    if (layout === 'inline') {
      return (
        <Form
          form={currentForm}
          layout="inline"
          style={{ width: '100%' }}
        >
          {fields.map(field => (
            <Form.Item
              key={field.name}
              name={field.name}
              style={{ marginRight: 16 }}
            >
              {renderField(field)}
            </Form.Item>
          ))}
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
                icon={<ReloadOutlined />}
                onClick={handleReset}
              >
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>
      );
    }

    // horizontal 或 vertical 布局
    return (
      <Form
        form={currentForm}
        layout={layout}
        style={{ width: '100%' }}
      >
        <Row gutter={16}>
          {fields.map(field => (
            <Col key={field.name} span={24 / (field.span || span)}>
              {renderField(field)}
            </Col>
          ))}
          <Col span={24}>
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
                  icon={<ReloadOutlined />}
                  onClick={handleReset}
                >
                  重置
                </Button>
              </Space>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    );
  };

  return <div className="search-form-container">{renderForm()}</div>;
};

export default SearchForm;
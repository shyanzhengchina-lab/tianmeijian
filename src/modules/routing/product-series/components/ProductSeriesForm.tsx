/**
 * 产品系列表单组件
 */

import React, { useEffect } from 'react';
import { Form, Input, Select, Row, Col, Card, message } from 'antd';
import { PRODUCT_SERIES_STATUS_MAP } from '../types';
import type { ProductSeries, CreateProductSeriesDTO } from '../types';
import { FileTextOutlined, ApartmentOutlined } from '@ant-design/icons';

const { Option } = Select;
const { TextArea } = Input;

interface ProductSeriesFormProps {
  mode?: 'create' | 'edit';
  initialValues?: ProductSeries;
  onFinish: (values: any) => void;
  onCancel: () => void;
}

const ProductSeriesForm: React.FC<ProductSeriesFormProps> = ({
  mode = 'create',
  initialValues,
  onFinish,
  onCancel,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (initialValues) {
      const formValues = {
        ...initialValues,
      };
      form.setFieldsValue(formValues);
    } else {
      form.resetFields();
    }
  }, [initialValues]);

  const handleSubmit = async (values: any) => {
    try {
      const formData: CreateProductSeriesDTO = {
        seriesCode: values.seriesCode,
        seriesName: values.seriesName,
        description: values.description,
        status: values.status || 'ACTIVE',
        category: values.category,
        remarks: values.remarks,
      };

      await onFinish(formData);
    } catch (error) {
      message.error(mode === 'create' ? '创建失败' : '更新失败');
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      autoComplete="off"
    >
      {/* 基本信息 */}
      <Card
        title="基本信息"
        style={{ marginBottom: '16px' }}
        extra={<FileTextOutlined style={{ color: '#1677ff' }} />}
      >
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="系列编码"
              name="seriesCode"
              rules={[
                { required: true, message: '请输入系列编码' },
                { pattern: /^[A-Z0-9]{2,20}$/, message: '系列编码格式不正确' }
              ]}
            >
              <Input placeholder="请输入系列编码，如PS001" prefix={<FileTextOutlined />} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="系列名称"
              name="seriesName"
              rules={[{ required: true, message: '请输入系列名称' }]}
            >
              <Input placeholder="请输入系列名称" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="类别"
              name="category"
              rules={[{ required: true, message: '请输入类别' }]}
            >
              <Input placeholder="请输入类别" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              label="系列描述"
              name="description"
            >
              <TextArea
                rows={3}
                placeholder="请输入系列描述"
                maxLength={500}
                showCount
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="状态"
              name="status"
              initialValue="ACTIVE"
              rules={[{ required: true, message: '请选择状态' }]}
            >
              <Select>
                {Object.entries(PRODUCT_SERIES_STATUS_MAP).map(([key, value]) => (
                  <Option key={key} value={key}>
                    <span style={{
                      display: 'inline-block',
                      width: '12px',
                      height: '12px',
                      borderRadius: '2px',
                      background: value.color,
                      marginRight: '8px'
                    }}></span>
                    <span>{value.label}</span>
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>
      </Card>

      {/* 备注信息 */}
      <Card
        title="备注信息"
        style={{ marginBottom: '16px' }}
        extra={<ApartmentOutlined style={{ color: '#1677ff' }} />}
      >
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              label="备注"
              name="remarks"
            >
              <TextArea
                rows={3}
                placeholder="请输入备注信息"
                maxLength={500}
                showCount
              />
            </Form.Item>
          </Col>
        </Row>
      </Card>
    </Form>
  );
};

export default ProductSeriesForm;

/**
 * 生产订单表单组件
 * 支持生产订单基本信息、产品配置、多规格明细、订单配置
 */

import React, { useEffect } from 'react';
import { Form, Input, Select, InputNumber, DatePicker, Row, Col, Card, Button, Space, message, Table } from 'antd';
import { useProductionOrderStore } from '../store';
import { PO_STATUS_MAP, PO_PRIORITY_MAP } from '../types';
import type { ProductionOrder, CreateProductionOrderDTO, POLineItem } from '../types';
import { ShoppingOutlined, ApartmentOutlined, CalendarOutlined, FileTextOutlined, ClockCircleOutlined, SettingOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

interface ProductionOrderFormProps {
  mode?: 'create' | 'edit';
  initialValues?: ProductionOrder;
  onFinish: (values: any) => void;
  onCancel: () => void;
}

const ProductionOrderForm: React.FC<ProductionOrderFormProps> = ({
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
        deliveryDate: initialValues.deliveryDate ? dayjs(initialValues.deliveryDate) : undefined,
        lineItems: initialValues.lineItems || [],
      };
      form.setFieldsValue(formValues);
    } else {
      form.resetFields();
      // 设置默认值
      form.setFieldsValue({
        status: 'OPEN',
        priority: 'NORMAL',
        lineItems: [],
      });
    }
  }, [initialValues]);

  const handleSubmit = async (values: any) => {
    try {
      const formData = {
        orderNo: values.orderNo,
        soNo: values.soNo,
        productCode: values.productCode,
        productName: values.productName,
        productSpec: values.productSpec,
        bomVersion: values.bomVersion,
        routingCode: values.routingCode,
        totalQty: values.totalQty,
        priority: values.priority,
        deliveryDate: values.deliveryDate ? values.deliveryDate.format('YYYY-MM-DD') : undefined,
        lineItems: values.lineItems || [],
        remark: values.remark,
      };

      await onFinish(formData);
    } catch (error) {
      message.error(mode === 'create' ? '创建失败' : '更新失败');
    }
  };

  // 单规格明细表格列
  const lineItemColumns = [
    {
      title: '行号',
      dataIndex: 'lineNo',
      width: 80,
      align: 'center' as const,
    },
    {
      title: '产品规格',
      dataIndex: 'productSpec',
      width: 150,
    },
    {
      title: '计划数量',
      dataIndex: 'planQty',
      width: 120,
      align: 'center' as const,
    },
    {
      title: '实际数量',
      dataIndex: 'actualQty',
      width: 120,
      align: 'center' as const,
    },
    {
      title: '备注',
      dataIndex: 'remark',
      width: 200,
    },
  ];

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      autoComplete="off"
    >
      {/* 订单基本信息 */}
      <Card
        title="订单基本信息"
        style={{ marginBottom: '16px' }}
        extra={<ShoppingOutlined style={{ color: '#1677ff' }} />}
      >
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="订单编号"
              name="orderNo"
              rules={[
                { required: true, message: '请输入订单编号' },
                { pattern: /^MO-\d{4,}$/, message: '订单编号格式不正确，如MO-20260425001' }
              ]}
            >
              <Input placeholder="请输入订单编号" prefix={<ShoppingOutlined />} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="销售订单"
              name="soNo"
            >
              <Input placeholder="请输入销售订单" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="订单状态"
              name="status"
              rules={[{ required: true, message: '请选择订单状态' }]}
            >
              <Select placeholder="请选择订单状态">
                {Object.entries(PO_STATUS_MAP).map(([key, value]) => (
                  <Option key={key} value={key}>
                    <Space>
                      <span style={{
                        display: 'inline-block',
                        width: '12px',
                        height: '12px',
                        borderRadius: '2px',
                        background: value.color,
                        marginRight: '8px'
                      }}></span>
                      <span>{value.label}</span>
                    </Space>
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="优先级"
              name="priority"
              rules={[{ required: true, message: '请选择优先级' }]}
            >
              <Select placeholder="请选择优先级">
                {Object.entries(PO_PRIORITY_MAP).map(([key, value]) => (
                  <Option key={key} value={key}>
                    <span style={{ color: value.color }}>{value.label}</span>
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="交货日期"
              name="deliveryDate"
              rules={[{ required: true, message: '请选择交货日期' }]}
            >
              <DatePicker
                style={{ width: '100%' }}
                placeholder="请选择交货日期"
                format="YYYY-MM-DD"
                disabledDate={(current) => {
                  return current && current < dayjs().endOf('day');
                }}
              />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      {/* 产品配置 */}
      <Card
        title="产品配置"
        style={{ marginBottom: '16px' }}
        extra={<ApartmentOutlined style={{ color: '#1677ff' }} />}
      >
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item
              label="产品编码"
              name="productCode"
              rules={[{ required: true, message: '请输入产品编码' }]}
            >
              <Input placeholder="请输入产品编码" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label="产品名称"
              name="productName"
              rules={[{ required: true, message: '请输入产品名称' }]}
            >
              <Input placeholder="请输入产品名称" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="产品规格"
              name="productSpec"
              rules={[{ required: true, message: '请输入产品规格' }]}
            >
              <Input placeholder="请输入产品规格，如#25/04锥/25mm" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="BOM版本"
              name="bomVersion"
              rules={[{ required: true, message: '请输入BOM版本' }]}
            >
              <Input placeholder="请输入BOM版本，如V2.1" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="工艺路径"
              name="routingCode"
              rules={[{ required: true, message: '请输入工艺路径' }]}
            >
              <Input placeholder="请输入工艺路径编码" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="订单总量"
              name="totalQty"
              rules={[{ required: true, message: '请输入订单总量' }]}
            >
              <InputNumber
                placeholder="请输入订单总量"
                style={{ width: '100%' }}
                min={1}
                addonAfter="件"
              />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      {/* 订单配置 */}
      <Card
        title="订单配置"
        style={{ marginBottom: '16px' }}
        extra={<SettingOutlined style={{ color: '#1677ff' }} />}
      >
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              label="备注"
              name="remark"
              tooltip="可填写订单说明、特殊要求等"
            >
              <TextArea
                rows={3}
                placeholder="请输入备注信息，如订单说明、特殊要求等"
                maxLength={500}
                showCount
              />
            </Form.Item>
          </Col>
        </Row>

        <div style={{
          padding: '16px',
          background: '#f5f5f5',
          borderRadius: '4px',
          marginTop: '16px'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>配置说明</div>
          <div style={{ fontSize: '14px', color: '#666' }}>
            <div>• 订单状态决定订单的审批和执行流程</div>
            <div>• 优先级影响订单的生产排期</div>
            <div>• 工艺路径确定产品的生产流程</div>
            <div>• 单规格明细用于多物料产品的生产管理</div>
          </div>
        </div>
      </Card>

      {/* 系统信息（编辑模式显示） */}
      {mode === 'edit' && initialValues && (
        <Card
          title="系统信息"
          extra={<ClockCircleOutlined style={{ color: '#1677ff' }} />}
        >
          <Row gutter={16}>
            <Col span={12}>
              <div><strong>创建时间：</strong>{initialValues.createdAt}</div>
            </Col>
            <Col span={12}>
              <div><strong>更新时间：</strong>{initialValues.updatedAt}</div>
            </Col>
          </Row>
        </Card>
      )}
    </Form>
  );
};

export default ProductionOrderForm;

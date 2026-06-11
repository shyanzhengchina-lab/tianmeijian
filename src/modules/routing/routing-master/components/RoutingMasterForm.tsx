/**
 * 工艺路径主数据表单组件
 * 支持工艺路径基本信息、产品配置、工序明细配置
 */

import React, { useEffect } from 'react';
import { Form, Input, Select, DatePicker, InputNumber, Row, Col, Card, message, Table, Button, Space } from 'antd';
import { useRoutingMasterStore } from '../store';
import { ROUTING_STATUS_MAP } from '../types';
import type { RoutingMaster, CreateRoutingMasterDTO, RoutingDetail } from '../types';
import { ApartmentOutlined, ShoppingOutlined, CalendarOutlined, SettingOutlined, PlusOutlined, DeleteOutlined, CheckCircleOutlined, StopOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

interface RoutingMasterFormProps {
  mode?: 'create' | 'edit';
  initialValues?: RoutingMaster;
  onFinish: (values: any) => void;
  onCancel: () => void;
}

const RoutingMasterForm: React.FC<RoutingMasterFormProps> = ({
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
        effectiveDate: initialValues.effectiveDate ? dayjs(initialValues.effectiveDate) : undefined,
        expiryDate: initialValues.expiryDate ? dayjs(initialValues.expiryDate) : undefined,
        details: initialValues.details || [],
      };
      form.setFieldsValue(formValues);
    } else {
      form.resetFields();
      form.setFieldsValue({
        status: 'DRAFT',
        details: [],
      });
    }
  }, [initialValues]);

  const handleSubmit = async (values: any) => {
    try {
      const formData: CreateRoutingMasterDTO = {
        routingCode: values.routingCode,
        routingName: values.routingName,
        productSeries: values.productSeries,
        productCode: values.productCode,
        productName: values.productName,
        productSpec: values.productSpec,
        bomVersion: values.bomVersion,
        routingVersion: values.routingVersion,
        routingType: values.routingType,
        effectiveDate: values.effectiveDate ? values.effectiveDate.format('YYYY-MM-DD') : undefined,
        expiryDate: values.expiryDate ? values.expiryDate.format('YYYY-MM-DD') : undefined,
        details: values.details || [],
        description: values.description,
        remark: values.remark,
      };

      await onFinish(formData);
    } catch (error) {
      message.error(mode === 'create' ? '创建失败' : '更新失败');
    }
  };

  // 工序明细表格列
  const detailColumns = [
    {
      title: '工序号',
      dataIndex: 'stepNo',
      width: 80,
      align: 'center' as const,
    },
    {
      title: '工序编码',
      dataIndex: 'stepCode',
      width: 120,
    },
    {
      title: '工序名称',
      dataIndex: 'stepName',
      width: 150,
    },
    {
      title: '计划工时(分)',
      dataIndex: 'planTime',
      width: 120,
      align: 'center' as const,
    },
    {
      title: '准备工时(分)',
      dataIndex: 'setupTime',
      width: 120,
      align: 'center' as const,
    },
    {
      title: '人工成本',
      dataIndex: 'laborCost',
      width: 100,
      align: 'center' as const,
    },
    {
      title: '机器成本',
      dataIndex: 'machineCost',
      width: 100,
      align: 'center' as const,
    },
    {
      title: '总成本',
      dataIndex: 'totalCost',
      width: 100,
      align: 'center' as const,
    },
    {
      title: '需要质检',
      dataIndex: 'qcRequired',
      width: 100,
      align: 'center' as const,
      render: (qcRequired: boolean) => qcRequired ? '是' : '否',
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      align: 'center' as const,
      render: (_: any, record: RoutingDetail, index: number) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<DeleteOutlined />}
            danger
            onClick={() => {
              const currentDetails = form.getFieldValue('details');
              const newDetails = [...currentDetails];
              newDetails.splice(index, 1);
              form.setFieldsValue({ details: newDetails });
            }}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      autoComplete="off"
    >
      {/* 基本信息 */}
      <Card
        title="工艺路径基本信息"
        style={{ marginBottom: '16px' }}
        extra={<ApartmentOutlined style={{ color: '#1677ff' }} />}
      >
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="工艺路径编码"
              name="routingCode"
              rules={[
                { required: true, message: '请输入工艺路径编码' },
                { pattern: /^[A-Z]{2}-[A-Z0-9]+$/, message: '编码格式不正确' }
              ]}
            >
              <Input placeholder="请输入工艺路径编码，如YS-RKQ-STD-V21" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="工艺路径名称"
              name="routingName"
              rules={[{ required: true, message: '请输入工艺路径名称' }]}
            >
              <Input placeholder="请输入工艺路径名称" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="工艺类型"
              name="routingType"
              rules={[{ required: true, message: '请输入工艺类型' }]}
            >
              <Input placeholder="请输入工艺类型，如STANDARD" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="状态"
              name="status"
              rules={[{ required: true, message: '请选择状态' }]}
            >
              <Select placeholder="请选择状态">
                {Object.entries(ROUTING_STATUS_MAP).map(([key, value]) => (
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
          <Col span={8}>
            <Form.Item
              label="生效日期"
              name="effectiveDate"
              rules={[{ required: true, message: '请选择生效日期' }]}
            >
              <DatePicker
                style={{ width: '100%' }}
                placeholder="请选择生效日期"
                format="YYYY-MM-DD"
                disabledDate={(current) => {
                  return current && current < dayjs().endOf('day');
                }}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="失效日期"
              name="expiryDate"
            >
              <DatePicker
                style={{ width: '100%' }}
                placeholder="请选择失效日期（可选）"
                format="YYYY-MM-DD"
                disabledDate={(current) => {
                  const effectiveDate = form.getFieldValue('effectiveDate');
                  return effectiveDate && current && current <= effectiveDate.endOf('day');
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
        extra={<ShoppingOutlined style={{ color: '#1677ff' }} />}
      >
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item
              label="产品系列"
              name="productSeries"
              rules={[{ required: true, message: '请输入产品系列' }]}
            >
              <Input placeholder="请输入产品系列" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label="产品编码"
              name="productCode"
              rules={[{ required: true, message: '请输入产品编码' }]}
            >
              <Input placeholder="请输入产品编码" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="产品名称"
              name="productName"
              rules={[{ required: true, message: '请输入产品名称' }]}
            >
              <Input placeholder="请输入产品名称" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="产品规格"
              name="productSpec"
              rules={[{ required: true, message: '请输入产品规格' }]}
            >
              <Input placeholder="请输入产品规格，如#25/04锥/25mm" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="BOM版本"
              name="bomVersion"
              rules={[{ required: true, message: '请输入BOM版本' }]}
            >
              <Input placeholder="请输入BOM版本，如V2.1" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="工艺版本"
              name="routingVersion"
              rules={[{ required: true, message: '请输入工艺版本' }]}
            >
              <Input placeholder="请输入工艺版本，如V2.1" />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      {/* 工序明细 */}
      <Card
        title="工序明细"
        style={{ marginBottom: '16px' }}
        extra={<SettingOutlined style={{ color: '#1677ff' }} />}
      >
        <div style={{ marginBottom: '12px' }}>
          <Form.Item label="">
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              onClick={() => {
                const currentDetails = form.getFieldValue('details') || [];
                const newDetail = {
                  stepNo: currentDetails.length * 10 + 10,
                  stepCode: '',
                  stepName: '',
                  operationId: '',
                  operationName: '',
                  planTime: 0,
                  setupTime: 0,
                  laborCost: 0,
                  machineCost: 0,
                  totalCost: 0,
                  qcRequired: false,
                };
                form.setFieldsValue({ details: [...currentDetails, newDetail] });
              }}
            >
              添加工序
            </Button>
          </Form.Item>
        </div>

        <Table
          size="small"
          dataSource={form.getFieldValue('details') || []}
          columns={detailColumns}
          rowKey="stepNo"
          pagination={false}
          bordered
        />
      </Card>

      {/* 备注 */}
      <Card
        title="备注信息"
        style={{ marginBottom: '16px' }}
        extra={<CalendarOutlined style={{ color: '#1677ff' }} />}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="描述"
              name="description"
            >
              <TextArea
                rows={3}
                placeholder="请输入工艺路径描述"
                maxLength={500}
                showCount
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="备注"
              name="remark"
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

      {/* 系统信息（编辑模式显示） */}
      {mode === 'edit' && initialValues && (
        <Card
          title="系统信息"
          extra={<CalendarOutlined style={{ color: '#1677ff' }} />}
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

export default RoutingMasterForm;

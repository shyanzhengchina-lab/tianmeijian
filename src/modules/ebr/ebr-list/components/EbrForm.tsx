/**
 * EBR表单组件
 * 支持EBR创建和编辑
 */

import React, { useEffect } from 'react';
import { Form, Input, Select, DatePicker, InputNumber, Row, Col, Card, Space, message } from 'antd';
import { EBR_STATUS_MAP, EBR_TYPE_MAP } from '../types';
import type { Ebr, CreateEbrDTO } from '../types';
import { FileTextOutlined, ApartmentOutlined, ShoppingOutlined, CalendarOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

interface EbrFormProps {
  mode?: 'create' | 'edit';
  initialValues?: Ebr;
  onFinish: (values: any) => void;
  onCancel: () => void;
}

const EbrForm: React.FC<EbrFormProps> = ({
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
        planStartDate: initialValues.planStartDate ? dayjs(initialValues.planStartDate) : undefined,
        planEndDate: initialValues.planEndDate ? dayjs(initialValues.planEndDate) : undefined,
      };
      form.setFieldsValue(formValues);
    } else {
      form.resetFields();
      form.setFieldsValue({
        ebrType: 'PRODUCTION',
        status: 'CREATED',
      });
    }
  }, [initialValues]);

  const handleSubmit = async (values: any) => {
    try {
      const formData: CreateEbrDTO = {
        ebrNo: values.ebrNo,
        batchNo: values.batchNo,
        productCode: values.productCode,
        productName: values.productName,
        productSpec: values.productSpec,
        ebrType: values.ebrType,
        planQty: values.planQty,
        planStartDate: values.planStartDate ? values.planStartDate.format('YYYY-MM-DD') : undefined,
        planEndDate: values.planEndDate ? values.planEndDate.format('YYYY-MM-DD') : undefined,
        remark: values.remark,
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
        title="EBR基本信息"
        style={{ marginBottom: '16px' }}
        extra={<FileTextOutlined style={{ color: '#1677ff' }} />}
      >
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="EBR编号"
              name="ebrNo"
              rules={[
                { required: true, message: '请输入EBR编号' },
                { pattern: /^EBR-\d{4,}$/, message: 'EBR编号格式不正确' }
              ]}
            >
              <Input placeholder="请输入EBR编号，如EBR-20260425001" prefix={<FileTextOutlined />} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="批号"
              name="batchNo"
              rules={[
                { required: true, message: '请输入批号' },
                { pattern: /^\d{10,}$/, message: '批号格式不正确' }
              ]}
            >
              <Input placeholder="请输入批号，如20260425001" prefix={<ShoppingOutlined />} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="EBR类型"
              name="ebrType"
              rules={[{ required: true, message: '请选择EBR类型' }]}
            >
              <Select placeholder="请选择EBR类型">
                {Object.entries(EBR_TYPE_MAP).map(([key, value]) => (
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

        {mode === 'edit' && initialValues && (
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="状态"
                name="status"
              >
                <Select disabled>
                  {Object.entries(EBR_STATUS_MAP).map(([key, value]) => (
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
        )}
      </Card>

      {/* 产品信息 */}
      <Card
        title="产品信息"
        style={{ marginBottom: '16px' }}
        extra={<ApartmentOutlined style={{ color: '#1677ff' }} />}
      >
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="产品编码"
              name="productCode"
              rules={[{ required: true, message: '请输入产品编码' }]}
            >
              <Input placeholder="请输入产品编码" />
            </Form.Item>
          </Col>
          <Col span={8}>
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
          <Col span={12}>
            <Form.Item
              label="产品规格"
              name="productSpec"
              rules={[{ required: true, message: '请输入产品规格' }]}
            >
              <Input placeholder="请输入产品规格，如#25/04锥/25mm" />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      {/* 计划信息 */}
      <Card
        title="计划信息"
        style={{ marginBottom: '16px' }}
        extra={<CalendarOutlined style={{ color: '#1677ff' }} />}
      >
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="计划数量"
              name="planQty"
              rules={[
                { required: true, message: '请输入计划数量' },
                { type: 'number', min: 1, message: '计划数量必须大于0' }
              ]}
            >
              <InputNumber
                placeholder="请输入计划数量"
                style={{ width: '100%' }}
                min={1}
                addonAfter="件"
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="计划开始日期"
              name="planStartDate"
              rules={[{ required: true, message: '请选择计划开始日期' }]}
            >
              <DatePicker
                style={{ width: '100%' }}
                placeholder="请选择计划开始日期"
                format="YYYY-MM-DD"
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="计划结束日期"
              name="planEndDate"
              rules={[{ required: true, message: '请选择计划结束日期' }]}
            >
              <DatePicker
                style={{ width: '100%' }}
                placeholder="请选择计划结束日期"
                format="YYYY-MM-DD"
              />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      {/* 实际信息（编辑模式显示） */}
      {mode === 'edit' && initialValues && (
        <Card
          title="实际信息"
          style={{ marginBottom: '16px' }}
          extra={<ShoppingOutlined style={{ color: '#1677ff' }} />}
        >
          <Row gutter={16}>
            <Col span={6}>
              <div><strong>实际数量：</strong>{initialValues.actualQty || '-'}</div>
            </Col>
            <Col span={6}>
              <div><strong>合格数量：</strong>{initialValues.qualifiedQty || '-'}</div>
            </Col>
            <Col span={6}>
              <div><strong>实际开始日期：</strong>{initialValues.actualStartDate || '未开始'}</div>
            </Col>
            <Col span={6}>
              <div><strong>实际结束日期：</strong>{initialValues.actualEndDate || '未结束'}</div>
            </Col>
          </Row>

          {initialValues.approvedBy && (
            <Row gutter={16} style={{ marginTop: '12px' }}>
              <Col span={12}>
                <div><strong>审批人：</strong>{initialValues.approvedBy}</div>
              </Col>
              <Col span={12}>
                <div><strong>审批时间：</strong>{initialValues.approvalTime}</div>
              </Col>
            </Row>
          )}
        </Card>
      )}

      {/* 备注 */}
      <Card
        title="备注信息"
        style={{ marginBottom: '16px' }}
        extra={<CalendarOutlined style={{ color: '#1677ff' }} />}
      >
        <Row gutter={16}>
          <Col span={24}>
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

export default EbrForm;

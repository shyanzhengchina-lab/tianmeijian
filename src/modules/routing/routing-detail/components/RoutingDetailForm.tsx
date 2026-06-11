/**
 * 工艺明细表单组件
 */

import React, { useEffect } from 'react';
import { Form, Input, Select, Row, Col, Card, message, InputNumber } from 'antd';
import { ROUTING_DETAIL_STATUS_MAP } from '../types';
import type { RoutingDetail, CreateRoutingDetailDTO } from '../types';
import { FileTextOutlined, ApartmentOutlined, ClockCircleOutlined } from '@ant-design/icons';

const { Option } = Select;
const { TextArea } = Input;

interface RoutingDetailFormProps {
  mode?: 'create' | 'edit';
  initialValues?: RoutingDetail;
  onFinish: (values: any) => void;
  onCancel: () => void;
}

const RoutingDetailForm: React.FC<RoutingDetailFormProps> = ({
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
      const formData: CreateRoutingDetailDTO = {
        routingId: values.routingId,
        routingNo: values.routingNo,
        operationCode: values.operationCode,
        operationName: values.operationName,
        operationDesc: values.operationDesc,
        sequence: values.sequence,
        workCenter: values.workCenter,
        equipment: values.equipment,
        standardTime: values.standardTime || 0,
        setupTime: values.setupTime || 0,
        laborTime: values.laborTime || 0,
        machineTime: values.machineTime || 0,
        status: values.status || 'ACTIVE',
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
          <Col span={6}>
            <Form.Item
              label="工艺路线ID"
              name="routingId"
              rules={[{ required: true, message: '请输入工艺路线ID' }]}
            >
              <Input placeholder="请输入工艺路线ID" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label="工艺路线号"
              name="routingNo"
              rules={[{ required: true, message: '请输入工艺路线号' }]}
            >
              <Input placeholder="请输入工艺路线号" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label="序号"
              name="sequence"
              rules={[
                { required: true, message: '请输入序号' },
                { type: 'number', min: 1, message: '序号必须大于0' }
              ]}
            >
              <InputNumber
                placeholder="请输入序号"
                style={{ width: '100%' }}
                min={1}
                precision={0}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={6}>
            <Form.Item
              label="工序编码"
              name="operationCode"
              rules={[{ required: true, message: '请输入工序编码' }]}
            >
              <Input placeholder="请输入工序编码" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label="工序名称"
              name="operationName"
              rules={[{ required: true, message: '请输入工序名称' }]}
            >
              <Input placeholder="请输入工序名称" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="工序描述"
              name="operationDesc"
            >
              <TextArea
                rows={2}
                placeholder="请输入工序描述"
                maxLength={500}
                showCount
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={6}>
            <Form.Item
              label="工作中心"
              name="workCenter"
              rules={[{ required: true, message: '请输入工作中心' }]}
            >
              <Input placeholder="请输入工作中心" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label="设备"
              name="equipment"
            >
              <Input placeholder="请输入设备" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label="状态"
              name="status"
              initialValue="ACTIVE"
              rules={[{ required: true, message: '请选择状态' }]}
            >
              <Select>
                {Object.entries(ROUTING_DETAIL_STATUS_MAP).map(([key, value]) => (
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

      {/* 时间信息 */}
      <Card
        title="时间信息"
        style={{ marginBottom: '16px' }}
        extra={<ClockCircleOutlined style={{ color: '#1677ff' }} />}
      >
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item
              label="标准时间(分钟)"
              name="standardTime"
              initialValue={0}
              rules={[{ required: true, message: '请输入标准时间' }]}
            >
              <InputNumber
                placeholder="请输入标准时间"
                style={{ width: '100%' }}
                min={0}
                precision={2}
                step={0.1}
              />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label="准备时间(分钟)"
              name="setupTime"
              initialValue={0}
            >
              <InputNumber
                placeholder="请输入准备时间"
                style={{ width: '100%' }}
                min={0}
                precision={2}
                step={0.1}
              />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label="人工时间(分钟)"
              name="laborTime"
              initialValue={0}
            >
              <InputNumber
                placeholder="请输入人工时间"
                style={{ width: '100%' }}
                min={0}
                precision={2}
                step={0.1}
              />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label="机器时间(分钟)"
              name="machineTime"
              initialValue={0}
            >
              <InputNumber
                placeholder="请输入机器时间"
                style={{ width: '100%' }}
                min={0}
                precision={2}
                step={0.1}
              />
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

export default RoutingDetailForm;

/**
 * 车间看板表单组件
 * 支持车间看板的创建和编辑
 */

import React, { useEffect } from 'react';
import { Form, Input, Select, Row, Col, Card, InputNumber, message } from 'antd';
import { WORKSHOP_STATUS_MAP } from '../types';
import type { WorkshopDashboard } from '../types';
import { FileTextOutlined, ApartmentOutlined, CheckCircleOutlined } from '@ant-design/icons';

const { Option } = Select;
const { TextArea } = Input;

interface WorkshopFormProps {
  mode?: 'create' | 'edit';
  initialValues?: WorkshopDashboard;
  onFinish: (values: any) => void;
  onCancel: () => void;
}

const WorkshopForm: React.FC<WorkshopFormProps> = ({
  mode = 'create',
  initialValues,
  onFinish,
  onCancel,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue(initialValues);
    } else {
      form.resetFields();
    }
  }, [initialValues]);

  const handleSubmit = async (values: any) => {
    try {
      await onFinish(values);
      message.success(mode === 'create' ? '创建成功' : '更新成功');
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
              label="工作中心ID"
              name="workcenterId"
              rules={[{ required: true, message: '请输入工作中心ID' }]}
            >
              <Input placeholder="请输入工作中心ID" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="工作中心名称"
              name="workcenterName"
              rules={[{ required: true, message: '请输入工作中心名称' }]}
            >
              <Input placeholder="请输入工作中心名称" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="车间ID"
              name="workshopId"
              rules={[{ required: true, message: '请输入车间ID' }]}
            >
              <Input placeholder="请输入车间ID" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="车间名称"
              name="workshopName"
              rules={[{ required: true, message: '请输入车间名称' }]}
            >
              <Input placeholder="请输入车间名称" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="状态"
              name="status"
              initialValue="ACTIVE"
              rules={[{ required: true, message: '请选择状态' }]}
            >
              <Select>
                {Object.entries(WORKSHOP_STATUS_MAP).map(([key, value]) => (
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

      {/* 容量配置 */}
      <Card
        title="容量配置"
        style={{ marginBottom: '16px' }}
        extra={<ApartmentOutlined style={{ color: '#1677ff' }} />}
      >
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item
              label="总工位数"
              name="totalOperators"
              rules={[{ required: true, message: '请输入总工位数' }]}
            >
              <InputNumber
                placeholder="请输入总工位数"
                style={{ width: '100%' }}
                min={0}
                precision={0}
              />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label="总设备数"
              name="totalEquipment"
              rules={[{ required: true, message: '请输入总设备数' }]}
            >
              <InputNumber
                placeholder="请输入总设备数"
                style={{ width: '100%' }}
                min={0}
                precision={0}
              />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label="日计划产能"
              name="dailyPlanQty"
              rules={[{ required: true, message: '请输入日计划产能' }]}
            >
              <InputNumber
                placeholder="请输入日计划产能"
                style={{ width: '100%' }}
                min={0}
                precision={0}
              />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label="目标合格率(%)"
              name="targetQualifiedRate"
              rules={[{ required: true, message: '请输入目标合格率' }]}
            >
              <InputNumber
                placeholder="请输入目标合格率"
                style={{ width: '100%' }}
                min={0}
                max={100}
                precision={1}
              />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      {/* 系统信息 */}
      {mode === 'edit' && initialValues && (
        <Card
          title="系统信息"
          style={{ marginBottom: '16px' }}
          extra={<CheckCircleOutlined style={{ color: '#1677ff' }} />}
        >
          <Row gutter={16}>
            <Col span={8}>
              <div><strong>看板ID：</strong>{initialValues.id}</div>
            </Col>
            <Col span={8}>
              <div><strong>创建时间：</strong>{initialValues.updateTime}</div>
            </Col>
          </Row>
        </Card>
      )}
    </Form>
  );
};

export default WorkshopForm;

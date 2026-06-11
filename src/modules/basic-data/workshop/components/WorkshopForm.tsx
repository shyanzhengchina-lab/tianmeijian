/**
 * 车间档案表单组件
 * 支持车间基本信息、管理配置、状态管理
 */

import React, { useEffect } from 'react';
import { Form, Input, Select, InputNumber, Row, Col, Card, Switch, message, Space, Tag } from 'antd';
import { useWorkshopStore } from '../store';
import { WORKSHOP_STATUS_MAP, WORKSHOP_TYPE_MAP } from '../types';
import type { Workshop, CreateWorkshopDTO } from '../types';
import { ApartmentOutlined, PhoneOutlined, EnvironmentOutlined, TeamOutlined, SafetyCertificateOutlined, ClockCircleOutlined } from '@ant-design/icons';

const { Option } = Select;
const { TextArea } = Input;

interface WorkshopFormProps {
  mode?: 'create' | 'edit';
  initialValues?: Workshop;
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
      // 设置默认值
      form.setFieldsValue({
        status: 'ACTIVE',
        cleanLevel: '10000级',
      });
    }
  }, [initialValues]);

  const handleSubmit = async (values: any) => {
    try {
      const formData = {
        workShopCode: values.workShopCode,
        workShopName: values.workShopName,
        type: values.type,
        manager: values.manager,
        managerPhone: values.managerPhone,
        location: values.location,
        area: values.area,
        headCount: values.headCount,
        status: values.status,
        cleanLevel: values.cleanLevel,
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
        title="车间基本信息"
        style={{ marginBottom: '16px' }}
        extra={<ApartmentOutlined style={{ color: '#1677ff' }} />}
      >
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="车间编码"
              name="workShopCode"
              rules={[
                { required: true, message: '请输入车间编码' },
                { pattern: /^WS-[A-Z]{3,}$/, message: '编码格式不正确，如WS-GRIND' }
              ]}
            >
              <Input placeholder="请输入车间编码，如WS-GRIND" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="车间名称"
              name="workShopName"
              rules={[{ required: true, message: '请输入车间名称' }]}
            >
              <Input placeholder="请输入车间名称，如精密加工车间" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="车间类型"
              name="type"
              rules={[{ required: true, message: '请选择车间类型' }]}
            >
              <Select placeholder="请选择车间类型">
                {Object.entries(WORKSHOP_TYPE_MAP).map(([key, value]) => (
                  <Option key={key} value={key}>
                    {value.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="车间主任"
              name="manager"
              rules={[{ required: true, message: '请输入车间主任' }]}
            >
              <Input placeholder="请输入车间主任" prefix={<TeamOutlined />} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="联系电话"
              name="managerPhone"
              rules={[
                { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确' }
              ]}
            >
              <Input placeholder="请输入联系电话" prefix={<PhoneOutlined />} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="状态"
              name="status"
              rules={[{ required: true, message: '请选择状态' }]}
            >
              <Select placeholder="请选择状态">
                {Object.entries(WORKSHOP_STATUS_MAP).map(([key, value]) => (
                  <Option key={key} value={key}>
                    <Space>
                      <Tag color={value.color}>{value.label}</Tag>
                    </Space>
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="车间位置"
              name="location"
              tooltip="填写车间具体位置，便于管理"
            >
              <Input placeholder="请输入车间位置，如A区一楼" prefix={<EnvironmentOutlined />} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="洁净等级"
              name="cleanLevel"
              tooltip="车间的洁净等级，如100级、10000级"
            >
              <Input placeholder="请输入洁净等级，如10000级" prefix={<SafetyCertificateOutlined />} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="车间面积"
              name="area"
              tooltip="车间面积（平方米）"
            >
              <InputNumber
                placeholder="请输入车间面积"
                style={{ width: '100%' }}
                min={0}
                addonAfter="㎡"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="车间人数"
              name="headCount"
              tooltip="车间预计人数"
            >
              <InputNumber
                placeholder="请输入车间人数"
                style={{ width: '100%' }}
                min={0}
                addonAfter="人"
              />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      {/* 车间配置 */}
      <Card
        title="车间配置"
        style={{ marginBottom: '16px' }}
        extra={<ClockCircleOutlined style={{ color: '#1677ff' }} />}
      >
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              label="备注"
              name="remark"
              tooltip="可填写车间主要设备、主要工序、工作特点等"
            >
              <TextArea
                rows={4}
                placeholder="请输入备注信息，如车间主要设备、主要工序、工作特点等"
                maxLength={500}
                showCount
              />
            </Form.Item>
          </Col>
        </Row>

        <div style={{
          padding: '16px',
          background: '#e6f7ff',
          borderRadius: '4px',
          marginBottom: '16px'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>配置说明</div>
          <div style={{ fontSize: '14px', color: '#666' }}>
            <div>• 车间类型决定车间的主要工艺和工序特点</div>
            <div>• 洁净等级用于区分不同洁净要求的车间</div>
            <div>• 车间主任和质量总监联系方式需准确填写</div>
            <div>• 状态为正常时车间可正常生产使用</div>
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

export default WorkshopForm;

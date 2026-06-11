/**
 * 计量单位表单组件
 * 支持计量单位基本信息、换算方法、精度配置
 */

import React, { useEffect } from 'react';
import { Form, Input, Select, InputNumber, Row, Col, Card, Switch, Space, message } from 'antd';
import { useUnitStore } from '../store';
import { UNIT_STATUS_MAP, UNIT_METHOD_MAP, DEFAULT_UNIT_GROUPS } from '../types';
import type { UnitItem, CreateUnitDTO } from '../types';
import { ApartmentOutlined, CalculatorOutlined, ClockCircleOutlined } from '@ant-design/icons';

const { Option } = Select;
const { TextArea } = Input;

interface UnitFormProps {
  mode?: 'create' | 'edit';
  initialValues?: UnitItem;
  onFinish: (values: any) => void;
  onCancel: () => void;
}

const UnitForm: React.FC<UnitFormProps> = ({
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
        method: '四舍五入',
        precision: 2,
        isBase: false,
        status: 'active',
      });
    }
  }, [initialValues]);

  const handleSubmit = async (values: any) => {
    try {
      const formData: CreateUnitDTO = {
        code: values.code,
        name: values.name,
        enName: values.enName,
        groupId: values.groupId,
        method: values.method,
        precision: values.precision,
        isBase: values.isBase,
        status: values.status,
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
        title="计量单位基本信息"
        style={{ marginBottom: '16px' }}
        extra={<ApartmentOutlined style={{ color: '#1677ff' }} />}
      >
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="单位编码"
              name="code"
              rules={[
                { required: true, message: '请输入单位编码' },
                { pattern: /^[a-zA-Z0-9]+$/, message: '编码格式不正确' }
              ]}
            >
              <Input placeholder="请输入单位编码，如fy01、KWh" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="单位名称"
              name="name"
              rules={[{ required: true, message: '请输入单位名称' }]}
            >
              <Input placeholder="请输入单位名称，如斤、立方米" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="英文名称"
              name="enName"
            >
              <Input placeholder="请输入英文名称，如Cubic Meters" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="单位分组"
              name="groupId"
              rules={[{ required: true, message: '请选择单位分组' }]}
            >
              <Select placeholder="请选择单位分组">
                {DEFAULT_UNIT_GROUPS[0].children?.map(group => (
                  <Option key={group.id} value={group.id}>
                    {group.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="换算方法"
              name="method"
              rules={[{ required: true, message: '请选择换算方法' }]}
            >
              <Select placeholder="请选择换算方法">
                {Object.entries(UNIT_METHOD_MAP).map(([key, value]) => (
                  <Option key={key} value={key}>
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{value.label}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>{value.description}</div>
                    </div>
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="状态"
              name="status"
              rules={[{ required: true, message: '请选择状态' }]}
            >
              <Select placeholder="请选择状态">
                {Object.entries(UNIT_STATUS_MAP).map(([key, value]) => (
                  <Option key={key} value={key}>
                    <Space>
                      <span style={{
                        display: 'inline-block',
                        width: '12px',
                        height: '12px',
                        borderRadius: '2px',
                        background: value.bg,
                        border: `1px solid ${value.border}`,
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
              label="精度小数位数"
              name="precision"
              rules={[
                { required: true, message: '请输入精度小数位数' },
                { type: 'number', min: 0, max: 6, message: '精度小数位数为0-6' }
              ]}
            >
              <InputNumber
                placeholder="请输入精度小数位数"
                style={{ width: '100%' }}
                min={0}
                max={6}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="是否基础单位"
              name="isBase"
              tooltip="基础单位用于换算和统计计算"
            >
              <Switch checkedChildren="是" unCheckedChildren="否" />
            </Form.Item>
          </Col>
        </Row>

        <div style={{
          padding: '16px',
          background: '#f5f5f5',
          borderRadius: '4px',
          marginBottom: '16px'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>单位说明</div>
          <div style={{ fontSize: '14px', color: '#666' }}>
            <div>• 单位编码用于系统识别和关联</div>
            <div>• 单位分组便于管理和查询（如长度、重量、时间等）</div>
            <div>• 换算方法决定单位的计算规则（四舍五入、入位、去位）</div>
            <div>• 精度小数位数决定计算结果的精确度</div>
            <div>• 基础单位用于单位换算和统计计算</div>
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
              <div><strong>创建时间：</strong> {initialValues.createdAt || '未知'}</div>
            </Col>
            <Col span={12}>
              <div><strong>更新时间：</strong> {initialValues.updatedAt || '未知'}</div>
            </Col>
          </Row>
        </Card>
      )}
    </Form>
  );
};

export default UnitForm;

/**
 * 工作中心表单组件
 * 支持工作中心基本信息和产能配置的编辑
 */

import React, { useEffect } from 'react';
import { Form, Input, Select, InputNumber, Row, Col, message } from 'antd';
import { useWorkCenterStore } from '../store';
import { CATEGORY_MAP, STATUS_MAP } from '../types';
import type { WorkCenter, CreateWorkCenterDTO } from '../types';

const { Option } = Select;
const { TextArea } = Input;

interface WorkCenterFormProps {
  mode?: 'create' | 'edit';
  initialValues?: WorkCenter;
  onFinish: (values: any) => void;
  onCancel: () => void;
}

const WorkCenterForm: React.FC<WorkCenterFormProps> = ({
  mode = 'create',
  initialValues,
  onFinish,
  onCancel,
}) => {
  const [form] = Form.useForm();
  const { workshops } = useWorkCenterStore();

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue(initialValues);
    } else {
      form.resetFields();
      // 设置默认值
      form.setFieldsValue({
        category: 'MACHINING',
        headCount: 1,
        shiftCount: 1,
        shiftHours: 8,
        equipCount: 1,
        status: 'ACTIVE',
        capacityUnit: '件/班',
      });
    }
  }, [initialValues]);

  const handleSubmit = async (values: any) => {
    try {
      const formData: CreateWorkCenterDTO = {
        wcCode: values.wcCode,
        wcName: values.wcName,
        category: values.category,
        workshop: values.workshop,
        leader: values.leader,
        headCount: values.headCount,
        shiftCount: values.shiftCount,
        shiftHours: values.shiftHours,
        capacity: values.capacity,
        capacityUnit: values.capacityUnit,
        equipCount: values.equipCount,
        location: values.location,
        costCenter: values.costCenter,
        status: values.status,
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
      <div style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #f0f0f0' }}>
        <h3>基本信息</h3>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="工作中心编码"
              name="wcCode"
              rules={[{ required: true, message: '请输入工作中心编码' }]}
            >
              <Input placeholder="请输入工作中心编码" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="工作中心名称"
              name="wcName"
              rules={[{ required: true, message: '请输入工作中心名称' }]}
            >
              <Input placeholder="请输入工作中心名称" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="工作中心分类"
              name="category"
              rules={[{ required: true, message: '请选择工作中心分类' }]}
            >
              <Select placeholder="请选择工作中心分类">
                {Object.entries(CATEGORY_MAP).map(([key, value]) => (
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
              label="所属车间"
              name="workshop"
              rules={[{ required: true, message: '请输入所属车间' }]}
            >
              <Select placeholder="请选择所属车间">
                {workshops.map(ws => (
                  <Option key={ws.id} value={ws.name}>
                    {ws.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="负责人"
              name="leader"
              rules={[{ required: true, message: '请输入负责人' }]}
            >
              <Input placeholder="请输入负责人" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="位置"
              name="location"
              rules={[{ required: true, message: '请输入位置' }]}
            >
              <Input placeholder="请输入位置" />
            </Form.Item>
          </Col>
        </Row>
      </div>

      {/* 人员班次配置 */}
      <div style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #f0f0f0' }}>
        <h3>人员班次配置</h3>
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item
              label="班组数"
              name="headCount"
              rules={[{ required: true, message: '请输入班组数' }]}
            >
              <InputNumber min={1} placeholder="请输入班组数" style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label="班次数"
              name="shiftCount"
              rules={[{ required: true, message: '请输入班次数' }]}
            >
              <InputNumber min={1} placeholder="请输入班次数" style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label="班时数"
              name="shiftHours"
              rules={[{ required: true, message: '请输入班时数' }]}
            >
              <InputNumber min={1} placeholder="请输入班时数" style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label="状态"
              name="status"
              rules={[{ required: true, message: '请选择状态' }]}
            >
              <Select placeholder="请选择状态">
                {Object.entries(STATUS_MAP).map(([key, value]) => (
                  <Option key={key} value={key}>
                    {value.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>
      </div>

      {/* 产能设备配置 */}
      <div style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #f0f0f0' }}>
        <h3>产能设备配置</h3>
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item
              label="产能"
              name="capacity"
              rules={[{ required: true, message: '请输入产能' }]}
            >
              <InputNumber min={1} placeholder="请输入产能" style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label="产能单位"
              name="capacityUnit"
              rules={[{ required: true, message: '请输入产能单位' }]}
            >
              <Input placeholder="请输入产能单位，如：件/班" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label="设备数量"
              name="equipCount"
              rules={[{ required: true, message: '请输入设备数量' }]}
            >
              <InputNumber min={1} placeholder="请输入设备数量" style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label="成本中心"
              name="costCenter"
              rules={[{ required: true, message: '请输入成本中心' }]}
            >
              <Input placeholder="请输入成本中心" />
            </Form.Item>
          </Col>
        </Row>
      </div>

      {/* 备注 */}
      <div>
        <h3>备注信息</h3>
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
      </div>
    </Form>
  );
};

export default WorkCenterForm;
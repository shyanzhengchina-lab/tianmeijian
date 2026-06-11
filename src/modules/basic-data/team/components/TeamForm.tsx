/**
 * 班组档案表单组件
 * 支持班组基本信息和人员配置的编辑
 */

import React, { useEffect } from 'react';
import { Form, Input, Select, InputNumber, Row, Col, Switch, message } from 'antd';
import { useTeamStore } from '../store';
import { TEAM_STATUS_MAP } from '../types';
import type { Team, CreateTeamDTO } from '../types';

const { Option } = Select;
const { TextArea } = Input;

interface TeamFormProps {
  mode?: 'create' | 'edit';
  initialValues?: Team;
  onFinish: (values: any) => void;
  onCancel: () => void;
}

const TeamForm: React.FC<TeamFormProps> = ({
  mode = 'create',
  initialValues,
  onFinish,
  onCancel,
}) => {
  const [form] = Form.useForm();
  const { workshops, workCenters, shifts, factories } = useTeamStore();

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue(initialValues);
    } else {
      form.resetFields();
      // 设置默认值
      form.setFieldsValue({
        status: 'ACTIVE',
        headCount: 8,
      });
    }
  }, [initialValues]);

  const handleSubmit = async (values: any) => {
    try {
      const formData: CreateTeamDTO = {
        name: values.name,
        workCenter: values.workCenter,
        workshop: values.workshop,
        factoryId: values.factoryId,
        shiftId: values.shiftId,
        leader: values.leader,
        headCount: values.headCount,
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
        <h3>班组基本信息</h3>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="班组名称"
              name="name"
              rules={[{ required: true, message: '请输入班组名称' }]}
            >
              <Input placeholder="请输入班组名称" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="工作中心"
              name="workCenter"
              rules={[{ required: true, message: '请选择工作中心' }]}
            >
              <Select placeholder="请选择工作中心">
                {workCenters.map(wc => (
                  <Option key={wc.id} value={wc.name}>
                    {wc.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="所属车间"
              name="workshop"
              rules={[{ required: true, message: '请选择所属车间' }]}
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
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="工厂ID"
              name="factoryId"
              rules={[{ required: true, message: '请输入工厂ID' }]}
            >
              <Input placeholder="请输入工厂ID" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="班次"
              name="shiftId"
            >
              <Select placeholder="请选择班次（可选）">
                {shifts.map(shift => (
                  <Option key={shift.id} value={shift.id}>
                    {shift.name} ({shift.code})
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="班组长"
              name="leader"
              rules={[{ required: true, message: '请输入班组长' }]}
            >
              <Input placeholder="请输入班组长" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="班组人数"
              name="headCount"
              rules={[{ required: true, message: '请输入班组人数' }]}
            >
              <InputNumber min={1} placeholder="请输入班组人数" style={{ width: '100%' }} addonAfter="人" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="状态"
              name="status"
              rules={[{ required: true, message: '请选择状态' }]}
            >
              <Select placeholder="请选择状态">
                {Object.entries(TEAM_STATUS_MAP).map(([key, value]) => (
                  <Option key={key} value={key}>
                    {value.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>
      </div>

      {/* 班组配置 */}
      <div>
        <h3>班组配置</h3>
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              label="备注"
              name="remark"
            >
              <TextArea
                rows={3}
                placeholder="请输入备注信息，如班组技能要求、工作特点等"
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

export default TeamForm;
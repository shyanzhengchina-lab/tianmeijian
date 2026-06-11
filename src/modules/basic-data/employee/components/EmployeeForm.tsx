/**
 * 员工档案表单组件
 * 支持员工基本信息、技能和证书的编辑
 */

import React, { useEffect } from 'react';
import { Form, Input, Select, DatePicker, InputNumber, Row, Col, Card, Divider, Tag, Space, message, Descriptions } from 'antd';
import { useEmployeeStore } from '../store';
import { useTeamStore } from '../../team/store';
import { useWorkshopStore } from '../../workshop/store';
import { EMPLOYEE_STATUS_MAP, EMPLOYEE_ROLE_MAP, SKILL_OPTIONS, CERT_OPTIONS } from '../types';
import type { Employee, CreateEmployeeDTO } from '../types';
import { UserOutlined, PhoneOutlined, IdcardOutlined, TeamOutlined, SafetyCertificateOutlined, ApartmentOutlined, ClockCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

interface EmployeeFormProps {
  mode?: 'create' | 'edit';
  initialValues?: Employee;
  onFinish: (values: any) => void;
  onCancel: () => void;
}

const EmployeeForm: React.FC<EmployeeFormProps> = ({
  mode = 'create',
  initialValues,
  onFinish,
  onCancel,
}) => {
  const [form] = Form.useForm();
  const employeeStore = useEmployeeStore();
  const teamStore = useTeamStore();
  const workshopStore = useWorkshopStore();

  const teams = teamStore.teams || [];
  const workshops = workshopStore.workshops || [];

  useEffect(() => {
    if (initialValues) {
      const formValues = {
        ...initialValues,
        entryDate: initialValues.entryDate ? dayjs(initialValues.entryDate) : undefined,
        skills: initialValues.skills || [],
        certifications: initialValues.certifications || [],
      };
      form.setFieldsValue(formValues);
    } else {
      form.resetFields();
      // 设置默认值
      form.setFieldsValue({
        status: 'ACTIVE',
        role: '操作工',
        skills: [],
        certifications: [],
      });
    }
  }, [initialValues]);

  const handleSubmit = async (values: any) => {
    try {
      const formData: CreateEmployeeDTO = {
        name: values.name,
        code: values.code,
        role: values.role,
        teamId: values.teamId,
        workshopCode: values.workshopCode,
        phone: values.phone,
        idCard: values.idCard,
        entryDate: values.entryDate ? values.entryDate.format('YYYY-MM-DD') : undefined,
        skills: values.skills || [],
        certifications: values.certifications || [],
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
      <Card
        title="员工基本信息"
        style={{ marginBottom: '16px' }}
        extra={<UserOutlined style={{ color: '#1677ff' }} />}
      >
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="姓名"
              name="name"
              rules={[{ required: true, message: '请输入员工姓名' }]}
            >
              <Input placeholder="请输入员工姓名" prefix={<UserOutlined />} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="工号"
              name="code"
              rules={[
                { required: true, message: '请输入工号' },
                { pattern: /^[Ee]\d{3,}$/, message: '工号格式不正确，如E001' }
              ]}
            >
              <Input placeholder="请输入工号，如E001" prefix={<UserOutlined />} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="角色"
              name="role"
              rules={[{ required: true, message: '请选择角色' }]}
            >
              <Select placeholder="请选择角色">
                {Object.entries(EMPLOYEE_ROLE_MAP).map(([key, value]) => (
                  <Option key={key} value={key}>
                    <Tag color={value.color}>{value.label}</Tag>
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="所属班组"
              name="teamId"
              rules={[{ required: true, message: '请选择班组' }]}
            >
              <Select placeholder="请选择班组">
                {teams.map(team => (
                  <Option key={team.id} value={team.id}>
                    {team.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="所属车间"
              name="workshopCode"
              rules={[{ required: true, message: '请选择车间' }]}
            >
              <Select placeholder="请选择车间">
                {workshops.map(ws => (
                  <Option key={ws.workShopCode} value={ws.workShopCode}>
                    {ws.workShopName}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="联系电话"
              name="phone"
              rules={[
                { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确' }
              ]}
            >
              <Input placeholder="请输入联系电话" prefix={<PhoneOutlined />} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="身份证号"
              name="idCard"
              rules={[
                { pattern: /^\d{17}[\dXx]$/, message: '身份证号格式不正确' }
              ]}
            >
              <Input placeholder="请输入身份证号" prefix={<IdcardOutlined />} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="入职日期"
              name="entryDate"
            >
              <DatePicker
                style={{ width: '100%' }}
                placeholder="请选择入职日期"
                format="YYYY-MM-DD"
                disabledDate={(current) => current && current > dayjs().endOf('day')}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="员工状态"
              name="status"
              rules={[{ required: true, message: '请选择状态' }]}
            >
              <Select placeholder="请选择状态">
                {Object.entries(EMPLOYEE_STATUS_MAP).map(([key, value]) => (
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
      </Card>

      {/* 技能和证书 */}
      <Card
        title="技能和证书"
        style={{ marginBottom: '16px' }}
        extra={<SafetyCertificateOutlined style={{ color: '#1677ff' }} />}
      >
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              label="技能/资质"
              name="skills"
              tooltip="多选技能，用于员工能力匹配和排班"
            >
              <Select
                mode="multiple"
                placeholder="请选择技能/资质"
                maxTagCount="responsive"
              >
                {SKILL_OPTIONS.map(skill => (
                  <Option key={skill} value={skill}>
                    {skill}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              label="上岗证书"
              name="certifications"
              tooltip="多选证书，用于岗位资质管理"
            >
              <Select
                mode="multiple"
                placeholder="请选择上岗证书"
                maxTagCount="responsive"
              >
                {CERT_OPTIONS.map(cert => (
                  <Option key={cert} value={cert}>
                    {cert}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Divider>证书说明</Divider>
        <div style={{ background: '#f5f5f5', padding: '12px', borderRadius: '4px' }}>
          <Space wrap>
            {CERT_OPTIONS.map(cert => (
              <Tag key={cert} color="blue" style={{ fontSize: '12px' }}>
                {cert}
              </Tag>
            ))}
          </Space>
        </div>
      </Card>

      {/* 备注信息 */}
      <Card
        title="备注信息"
        style={{ marginBottom: '16px' }}
        extra={<ApartmentOutlined style={{ color: '#1677ff' }} />}
      >
        <Form.Item
          label="备注"
          name="remark"
          tooltip="可填写员工特长、工作经历、健康状况等信息"
        >
          <TextArea
            rows={4}
            placeholder="请输入备注信息，如员工特长、工作经历、健康状况等"
            maxLength={500}
            showCount
          />
        </Form.Item>
      </Card>

      {/* 系统信息（编辑模式显示） */}
      {mode === 'edit' && initialValues && (
        <Card
          title="系统信息"
          extra={<ClockCircleOutlined style={{ color: '#1677ff' }} />}
        >
          <Descriptions column={2} size="small">
            <Descriptions.Item label="创建时间">
              {initialValues.createdAt}
            </Descriptions.Item>
            <Descriptions.Item label="更新时间">
              {initialValues.updatedAt}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      )}
    </Form>
  );
};

export default EmployeeForm;

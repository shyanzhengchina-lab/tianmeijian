/**
 * 生产任务单表单组件
 * 支持生产任务单创建和编辑
 */

import React, { useEffect } from 'react';
import { Form, Input, Select, DatePicker, InputNumber, Row, Col, Card, message, Space } from 'antd';
import { TO_STATUS_MAP, TO_PRIORITY_MAP } from '../types';
import type { TaskOrder, CreateTaskOrderDTO } from '../types';
import { FileTextOutlined, ApartmentOutlined, CalendarOutlined, TeamOutlined, ToolOutlined, UserOutlined, ShoppingOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

interface TaskOrderFormProps {
  mode?: 'create' | 'edit';
  initialValues?: TaskOrder;
  onFinish: (values: any) => void;
  onCancel: () => void;
}

const TaskOrderForm: React.FC<TaskOrderFormProps> = ({
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
        planStartTime: initialValues.planStartTime ? dayjs(initialValues.planStartTime) : undefined,
        planEndTime: initialValues.planEndTime ? dayjs(initialValues.planEndTime) : undefined,
      };
      form.setFieldsValue(formValues);
    } else {
      form.resetFields();
      form.setFieldsValue({
        status: 'PENDING',
        priority: 'NORMAL',
      });
    }
  }, [initialValues]);

  const handleSubmit = async (values: any) => {
    try {
      const formData: CreateTaskOrderDTO = {
        taskNo: values.taskNo,
        woId: values.woId,
        woNo: values.woNo,
        poId: values.poId,
        poNo: values.poNo,
        productCode: values.productCode,
        productName: values.productName,
        productSpec: values.productSpec,
        taskName: values.taskName,
        taskType: values.taskType,
        planQty: values.planQty,
        planStartTime: values.planStartTime ? values.planStartTime.format('YYYY-MM-DD HH:mm:ss') : undefined,
        planEndTime: values.planEndTime ? values.planEndTime.format('YYYY-MM-DD HH:mm:ss') : undefined,
        stepCode: values.stepCode,
        stepName: values.stepName,
        workcenterId: values.workcenterId,
        teamId: values.teamId,
        equipmentId: values.equipmentId,
        operatorId: values.operatorId,
        priority: values.priority,
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
        title="基本信息"
        style={{ marginBottom: '16px' }}
        extra={<FileTextOutlined style={{ color: '#1677ff' }} />}
      >
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item
              label="任务单号"
              name="taskNo"
              rules={[
                { required: true, message: '请输入任务单号' },
                { pattern: /^TO-\d{4,}$/, message: '任务单号格式不正确' }
              ]}
            >
              <Input placeholder="请输入任务单号，如TO-20260425001" prefix={<FileTextOutlined />} />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label="工单号"
              name="woNo"
            >
              <Input placeholder="请输入工单号" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label="生产订单"
              name="poNo"
            >
              <Input placeholder="请输入生产订单" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label="优先级"
              name="priority"
              rules={[{ required: true, message: '请选择优先级' }]}
            >
              <Select placeholder="请选择优先级">
                {Object.entries(TO_PRIORITY_MAP).map(([key, value]) => (
                  <Option key={key} value={key}>
                    <Space style={{ display: 'flex', alignItems: 'center' }}>
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
                  {Object.entries(TO_STATUS_MAP).map(([key, value]) => (
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

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="任务名称"
              name="taskName"
              rules={[{ required: true, message: '请输入任务名称' }]}
            >
              <Input placeholder="请输入任务名称，如机用根管锉车削加工" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="任务类型"
              name="taskType"
              rules={[{ required: true, message: '请输入任务类型' }]}
            >
              <Input placeholder="请输入任务类型，如MACHINING" />
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
          <Col span={6}>
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
          <Col span={9}>
            <Form.Item
              label="计划开始时间"
              name="planStartTime"
              rules={[{ required: true, message: '请选择计划开始时间' }]}
            >
              <DatePicker
                style={{ width: '100%' }}
                placeholder="请选择计划开始时间"
                format="YYYY-MM-DD HH:mm:ss"
                showTime
              />
            </Form.Item>
          </Col>
          <Col span={9}>
            <Form.Item
              label="计划结束时间"
              name="planEndTime"
              rules={[{ required: true, message: '请选择计划结束时间' }]}
            >
              <DatePicker
                style={{ width: '100%' }}
                placeholder="请选择计划结束时间"
                format="YYYY-MM-DD HH:mm:ss"
                showTime
              />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      {/* 工序信息 */}
      <Card
        title="工序信息"
        style={{ marginBottom: '16px' }}
        extra={<ToolOutlined style={{ color: '#1677ff' }} />}
      >
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item
              label="工序编码"
              name="stepCode"
              rules={[{ required: true, message: '请输入工序编码' }]}
            >
              <Input placeholder="请输入工序编码，如OP0020" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label="工序名称"
              name="stepName"
              rules={[{ required: true, message: '请输入工序名称' }]}
            >
              <Input placeholder="请输入工序名称，如车削" />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      {/* 分配信息 */}
      <Card
        title="分配信息"
        style={{ marginBottom: '16px' }}
        extra={<TeamOutlined style={{ color: '#1677ff' }} />}
      >
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item
              label="工作中心"
              name="workcenterId"
            >
              <Input placeholder="请输入工作中心" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label="班组"
              name="teamId"
            >
              <Input placeholder="请输入班组" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label="设备"
              name="equipmentId"
            >
              <Input placeholder="请输入设备" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label="操作员"
              name="operatorId"
            >
              <Input placeholder="请输入操作员" />
            </Form.Item>
          </Col>
        </Row>
      </Card>

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

      {/* 实际信息（编辑模式显示） */}
      {mode === 'edit' && initialValues && (
        <Card
          title="实际信息"
          extra={<ShoppingOutlined style={{ color: '#1677ff' }} />}
        >
          <Row gutter={16}>
            <Col span={6}>
              <div><strong>实际数量：</strong>{initialValues.actualQty}</div>
            </Col>
            <Col span={6}>
              <div><strong>合格数量：</strong>{initialValues.qualifiedQty}</div>
            </Col>
            <Col span={6}>
              <div><strong>不合格数量：</strong>{initialValues.unqualifiedQty}</div>
            </Col>
            <Col span={6}>
              <div><strong>报废数量：</strong>{initialValues.scrapQty}</div>
            </Col>
          </Row>
          <Row gutter={16} style={{ marginTop: '12px' }}>
            <Col span={12}>
              <div><strong>实际开始时间：</strong>{initialValues.actualStartTime || '未开始'}</div>
            </Col>
            <Col span={12}>
              <div><strong>实际结束时间：</strong>{initialValues.actualEndTime || '未结束'}</div>
            </Col>
          </Row>
        </Card>
      )}
    </Form>
  );
};

export default TaskOrderForm;

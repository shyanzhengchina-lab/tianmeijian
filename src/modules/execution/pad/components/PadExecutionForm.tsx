/**
 * 工序执行任务表单组件
 * 支持执行任务创建和编辑
 */

import React, { useEffect } from 'react';
import { Form, Input, Select, InputNumber, DatePicker, Row, Col, Card, message } from 'antd';
import { EXECUTION_STATUS_MAP, EXECUTION_MODE_MAP } from '../types';
import type { PadExecutionTask, CreatePadExecutionTaskDTO } from '../types';
import { FileTextOutlined, ApartmentOutlined, CalendarOutlined, TeamOutlined, ToolOutlined, UserOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

interface PadExecutionFormProps {
  mode?: 'create' | 'edit';
  initialValues?: PadExecutionTask;
  onFinish: (values: any) => void;
  onCancel: () => void;
}

const PadExecutionForm: React.FC<PadExecutionFormProps> = ({
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
        executionMode: 'MANUAL',
      });
    }
  }, [initialValues]);

  const handleSubmit = async (values: any) => {
    try {
      const formData: CreatePadExecutionTaskDTO = {
        taskId: values.taskId,
        taskNo: values.taskNo,
        workOrderId: values.workOrderId,
        workOrderNo: values.workOrderNo,
        productCode: values.productCode,
        productName: values.productName,
        productSpec: values.productSpec,
        stepCode: values.stepCode,
        stepName: values.stepName,
        planQty: values.planQty,
        planStartTime: values.planStartTime ? values.planStartTime.format('YYYY-MM-DD HH:mm:ss') : undefined,
        planEndTime: values.planEndTime ? values.planEndTime.format('YYYY-MM-DD HH:mm:ss') : undefined,
        operatorId: values.operatorId,
        operatorName: values.operatorName,
        equipmentId: values.equipmentId,
        equipmentName: values.equipmentName,
        workcenterId: values.workcenterId,
        workcenterName: values.workcenterName,
        executionMode: values.executionMode,
        temperature: values.temperature,
        humidity: values.humidity,
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
              label="任务编号"
              name="taskNo"
              rules={[{ required: true, message: '请输入任务编号' }]}
            >
              <Input placeholder="请输入任务编号" prefix={<FileTextOutlined />} />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label="工单号"
              name="workOrderNo"
              rules={[{ required: true, message: '请输入工单号' }]}
            >
              <Input placeholder="请输入工单号" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label="任务ID"
              name="taskId"
              rules={[{ required: true, message: '请输入任务ID' }]}
            >
              <Input placeholder="请输入任务ID" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label="工单ID"
              name="workOrderId"
              rules={[{ required: true, message: '请输入工单ID' }]}
            >
              <Input placeholder="请输入工单ID" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="执行模式"
              name="executionMode"
              rules={[{ required: true, message: '请选择执行模式' }]}
            >
              <Select placeholder="请选择执行模式">
                {Object.entries(EXECUTION_MODE_MAP).map(([key, value]) => (
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
          <Col span={8}>
            {mode === 'edit' && initialValues && (
              <Form.Item
                label="状态"
                name="status"
              >
                <Select disabled>
                  {Object.entries(EXECUTION_STATUS_MAP).map(([key, value]) => (
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
            )}
          </Col>
        </Row>
      </Card>

      {/* 产品和工序信息 */}
      <Card
        title="产品与工序信息"
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
              <Input placeholder="请输入产品规格" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={6}>
            <Form.Item
              label="工序编码"
              name="stepCode"
              rules={[{ required: true, message: '请输入工序编码' }]}
            >
              <Input placeholder="请输入工序编码" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label="工序名称"
              name="stepName"
              rules={[{ required: true, message: '请输入工序名称' }]}
            >
              <Input placeholder="请输入工序名称" />
            </Form.Item>
          </Col>
        </Row>

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
        </Row>
      </Card>

      {/* 时间信息 */}
      <Card
        title="时间信息"
        style={{ marginBottom: '16px' }}
        extra={<CalendarOutlined style={{ color: '#1677ff' }} />}
      >
        <Row gutter={16}>
          <Col span={12}>
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
          <Col span={12}>
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

      {/* 分配信息 */}
      <Card
        title="分配信息"
        style={{ marginBottom: '16px' }}
        extra={<TeamOutlined style={{ color: '#1677ff' }} />}
      >
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item
              label="工作中心ID"
              name="workcenterId"
            >
              <Input placeholder="请输入工作中心ID" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label="工作中心名称"
              name="workcenterName"
            >
              <Input placeholder="请输入工作中心名称" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label="设备ID"
              name="equipmentId"
            >
              <Input placeholder="请输入设备ID" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label="设备名称"
              name="equipmentName"
            >
              <Input placeholder="请输入设备名称" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={6}>
            <Form.Item
              label="操作员ID"
              name="operatorId"
            >
              <Input placeholder="请输入操作员ID" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label="操作员姓名"
              name="operatorName"
            >
              <Input placeholder="请输入操作员姓名" />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      {/* 工艺参数 */}
      <Card
        title="工艺参数"
        style={{ marginBottom: '16px' }}
        extra={<ToolOutlined style={{ color: '#1677ff' }} />}
      >
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item
              label="温度"
              name="temperature"
            >
              <InputNumber
                placeholder="请输入温度"
                style={{ width: '100%' }}
                addonAfter="℃"
              />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label="湿度"
              name="humidity"
            >
              <InputNumber
                placeholder="请输入湿度"
                style={{ width: '100%' }}
                addonAfter="%"
              />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      {/* 备注 */}
      <Card
        title="备注信息"
        style={{ marginBottom: '16px' }}
        extra={<UserOutlined style={{ color: '#1677ff' }} />}
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
          extra={<FileTextOutlined style={{ color: '#1677ff' }} />}
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
            <Col span={8}>
              <div><strong>进度：</strong>{initialValues.progress}%</div>
            </Col>
            <Col span={8}>
              <div><strong>实际开始时间：</strong>{initialValues.actualStartTime || '未开始'}</div>
            </Col>
            <Col span={8}>
              <div><strong>实际结束时间：</strong>{initialValues.actualEndTime || '未结束'}</div>
            </Col>
          </Row>
          <Row gutter={16} style={{ marginTop: '12px' }}>
            <Col span={8}>
              <div><strong>预计结束时间：</strong>{initialValues.estimatedEndTime || '-'}</div>
            </Col>
            <Col span={8}>
              <div><strong>温度：</strong>{initialValues.temperature !== undefined ? initialValues.temperature + '℃' : '-'}</div>
            </Col>
            <Col span={8}>
              <div><strong>湿度：</strong>{initialValues.humidity !== undefined ? initialValues.humidity + '%' : '-'}</div>
            </Col>
          </Row>
        </Card>
      )}
    </Form>
  );
};

export default PadExecutionForm;

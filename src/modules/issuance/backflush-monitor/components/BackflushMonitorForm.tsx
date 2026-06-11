/**
 * 倒冲监控表单组件
 */

import React, { useEffect } from 'react';
import { Form, Input, Select, Row, Col, Card, message, InputNumber } from 'antd';
import { BACKFLUSH_STATUS_MAP } from '../types';
import type { BackflushMonitor, CreateBackflushMonitorDTO } from '../types';
import { FileTextOutlined, ApartmentOutlined, CalendarOutlined, CheckCircleOutlined } from '@ant-design/icons';

const { Option } = Select;
const { TextArea } = Input;

interface BackflushMonitorFormProps {
  mode?: 'create' | 'edit';
  initialValues?: BackflushMonitor;
  onFinish: (values: any) => void;
  onCancel: () => void;
}

const BackflushMonitorForm: React.FC<BackflushMonitorFormProps> = ({
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
      const formData: CreateBackflushMonitorDTO = {
        monitorNo: values.monitorNo,
        workOrderId: values.workOrderId,
        workOrderNo: values.workOrderNo,
        taskOrderId: values.taskOrderId,
        taskOrderNo: values.taskOrderNo,
        operationCode: values.operationCode,
        operationName: values.operationName,
        productId: values.productId,
        productCode: values.productCode,
        productName: values.productName,
        productSpec: values.productSpec,
        completedQty: values.completedQty,
        items: values.items || [],
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
              label="监控单号"
              name="monitorNo"
              rules={[
                { required: true, message: '请输入监控单号' },
                { pattern: /^BM-\d{4,}$/, message: '监控单号格式不正确' }
              ]}
            >
              <Input placeholder="请输入监控单号，如BM-20260425001" prefix={<FileTextOutlined />} />
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
              label="任务单号"
              name="taskOrderNo"
              rules={[{ required: true, message: '请输入任务单号' }]}
            >
              <Input placeholder="请输入任务单号" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={6}>
            <Form.Item
              label="工单ID"
              name="workOrderId"
              rules={[{ required: true, message: '请输入工单ID' }]}
            >
              <Input placeholder="请输入工单ID" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label="任务单ID"
              name="taskOrderId"
              rules={[{ required: true, message: '请输入任务单ID' }]}
            >
              <Input placeholder="请输入任务单ID" />
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
          <Col span={6}>
            <Form.Item
              label="产品ID"
              name="productId"
              rules={[{ required: true, message: '请输入产品ID' }]}
            >
              <Input placeholder="请输入产品ID" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label="产品规格"
              name="productSpec"
            >
              <Input placeholder="请输入产品规格" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={6}>
            <Form.Item
              label="完成数量"
              name="completedQty"
              rules={[
                { required: true, message: '请输入完成数量' },
                { type: 'number', min: 0, message: '数量不能为负数' }
              ]}
            >
              <InputNumber
                placeholder="请输入完成数量"
                style={{ width: '100%' }}
                min={0}
                precision={2}
              />
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
                  {Object.entries(BACKFLUSH_STATUS_MAP).map(([key, value]) => (
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
        )}
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

      {/* 执行信息（编辑模式显示） */}
      {mode === 'edit' && initialValues && (
        <>
          <Card
            title="执行信息"
            style={{ marginBottom: '16px' }}
            extra={<CheckCircleOutlined style={{ color: '#1677ff' }} />}
          >
            <Row gutter={16}>
              <Col span={8}>
                <div><strong>开始时间：</strong>{initialValues.startTime || '-'}</div>
              </Col>
              <Col span={8}>
                <div><strong>结束时间：</strong>{initialValues.endTime || '-'}</div>
              </Col>
            </Row>
            <Row gutter={16} style={{ marginTop: '12px' }}>
              <Col span={8}>
                <div><strong>倒冲时间：</strong>{initialValues.backflushTime || '-'}</div>
              </Col>
            </Row>
            <Row gutter={16} style={{ marginTop: '12px' }}>
              <Col span={24}>
                <div><strong>错误原因：</strong>{initialValues.errorReason || '-'}</div>
              </Col>
            </Row>
          </Card>
        </>
      )}
    </Form>
  );
};

export default BackflushMonitorForm;

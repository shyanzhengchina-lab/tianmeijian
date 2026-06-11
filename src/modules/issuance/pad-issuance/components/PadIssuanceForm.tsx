/**
 * 工位领料表单组件
 */

import React, { useEffect } from 'react';
import { Form, Input, Select, DatePicker, Row, Col, Card, message } from 'antd';
import { PAD_ISSUANCE_STATUS_MAP } from '../types';
import type { PadIssuance, CreatePadIssuanceDTO } from '../types';
import { FileTextOutlined, ApartmentOutlined, CalendarOutlined, UserOutlined, CheckCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

interface PadIssuanceFormProps {
  mode?: 'create' | 'edit';
  initialValues?: PadIssuance;
  onFinish: (values: any) => void;
  onCancel: () => void;
}

const PadIssuanceForm: React.FC<PadIssuanceFormProps> = ({
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
        requestDate: initialValues.requestDate ? dayjs(initialValues.requestDate) : undefined,
        requiredDate: initialValues.requiredDate ? dayjs(initialValues.requiredDate) : undefined,
      };
      form.setFieldsValue(formValues);
    } else {
      form.resetFields();
      form.setFieldsValue({
        status: 'DRAFT',
      });
    }
  }, [initialValues]);

  const handleSubmit = async (values: any) => {
    try {
      const formData: CreatePadIssuanceDTO = {
        issuanceNo: values.issuanceNo,
        taskId: values.taskId,
        taskNo: values.taskNo,
        workOrderNo: values.workOrderNo,
        operationCode: values.operationCode,
        operationName: values.operationName,
        workstation: values.workstation,
        worker: values.worker,
        requestDate: values.requestDate ? values.requestDate.format('YYYY-MM-DD') : undefined,
        requiredDate: values.requiredDate ? values.requiredDate.format('YYYY-MM-DD') : undefined,
        requestBy: values.requestBy,
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
              label="领料单号"
              name="issuanceNo"
              rules={[
                { required: true, message: '请输入领料单号' },
                { pattern: /^PI-\d{4,}$/, message: '领料单号格式不正确' }
              ]}
            >
              <Input placeholder="请输入领料单号，如PI-20260425001" prefix={<FileTextOutlined />} />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label="任务单号"
              name="taskNo"
              rules={[{ required: true, message: '请输入任务单号' }]}
            >
              <Input placeholder="请输入任务单号" />
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
        </Row>

        <Row gutter={16}>
          <Col span={6}>
            <Form.Item
              label="任务ID"
              name="taskId"
              rules={[{ required: true, message: '请输入任务ID' }]}
            >
              <Input placeholder="请输入任务ID" />
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
              label="工位"
              name="workstation"
              rules={[{ required: true, message: '请输入工位' }]}
            >
              <Input placeholder="请输入工位" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label="操作人"
              name="worker"
              rules={[{ required: true, message: '请输入操作人' }]}
            >
              <Input placeholder="请输入操作人" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="申请日期"
              name="requestDate"
              rules={[{ required: true, message: '请选择申请日期' }]}
            >
              <DatePicker
                style={{ width: '100%' }}
                placeholder="请选择申请日期"
                format="YYYY-MM-DD"
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="要求日期"
              name="requiredDate"
              rules={[{ required: true, message: '请选择要求日期' }]}
            >
              <DatePicker
                style={{ width: '100%' }}
                placeholder="请选择要求日期"
                format="YYYY-MM-DD"
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
                  {Object.entries(PAD_ISSUANCE_STATUS_MAP).map(([key, value]) => (
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

      {/* 申请人信息 */}
      <Card
        title="申请人信息"
        style={{ marginBottom: '16px' }}
        extra={<UserOutlined style={{ color: '#1677ff' }} />}
      >
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="申请人"
              name="requestBy"
              rules={[{ required: true, message: '请输入申请人' }]}
            >
              <Input placeholder="请输入申请人" />
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

      {/* 审批信息（编辑模式显示） */}
      {mode === 'edit' && initialValues && (
        <>
          <Card
            title="审批信息"
            style={{ marginBottom: '16px' }}
            extra={<CheckCircleOutlined style={{ color: '#1677ff' }} />}
          >
            <Row gutter={16}>
              <Col span={8}>
                <div><strong>批准人：</strong>{initialValues.approvedBy || '-'}</div>
              </Col>
              <Col span={8}>
                <div><strong>发料人：</strong>{initialValues.issuedBy || '-'}</div>
              </Col>
            </Row>
            <Row gutter={16} style={{ marginTop: '12px' }}>
              <Col span={8}>
                <div><strong>提交时间：</strong>{initialValues.submitTime || '-'}</div>
              </Col>
              <Col span={8}>
                <div><strong>批准时间：</strong>{initialValues.approveTime || '-'}</div>
              </Col>
            </Row>
            <Row gutter={16} style={{ marginTop: '12px' }}>
              <Col span={8}>
                <div><strong>发料时间：</strong>{initialValues.issueTime || '-'}</div>
              </Col>
              <Col span={8}>
                <div><strong>完成时间：</strong>{initialValues.completeTime || '-'}</div>
              </Col>
            </Row>
          </Card>
        </>
      )}
    </Form>
  );
};

export default PadIssuanceForm;

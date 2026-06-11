/**
 * 物料领用表单组件
 * 支持物料领用单创建和编辑
 */

import React, { useEffect } from 'react';
import { Form, Input, Select, DatePicker, Row, Col, Card, message } from 'antd';
import { ISSUANCE_STATUS_MAP } from '../types';
import type { MaterialIssuance, CreateIssuanceDTO } from '../types';
import { FileTextOutlined, ApartmentOutlined, CalendarOutlined, UserOutlined, CheckCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

interface MaterialIssuanceFormProps {
  mode?: 'create' | 'edit';
  initialValues?: MaterialIssuance;
  onFinish: (values: any) => void;
  onCancel: () => void;
}

const MaterialIssuanceForm: React.FC<MaterialIssuanceFormProps> = ({
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
      const formData: CreateIssuanceDTO = {
        issuanceNo: values.issuanceNo,
        workOrderId: values.workOrderId,
        workOrderNo: values.workOrderNo,
        productionOrderId: values.productionOrderId,
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
                { pattern: /^MI-\d{4,}$/, message: '领料单号格式不正确' }
              ]}
            >
              <Input placeholder="请输入领料单号，如MI-20260425001" prefix={<FileTextOutlined />} />
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
              label="生产订单ID"
              name="productionOrderId"
              rules={[{ required: true, message: '请输入生产订单ID' }]}
            >
              <Input placeholder="请输入生产订单ID" />
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
                  {Object.entries(ISSUANCE_STATUS_MAP).map(([key, value]) => (
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
                <div><strong>完成时间：</strong>{initialValues.completeTime || '-'}</div>
              </Col>
            </Row>
          </Card>
        </>
      )}
    </Form>
  );
};

export default MaterialIssuanceForm;

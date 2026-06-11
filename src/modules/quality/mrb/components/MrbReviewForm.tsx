/**
 * MRB评审单表单组件
 * 支持MRB评审单创建和编辑
 */

import React, { useEffect } from 'react';
import { Form, Input, Select, InputNumber, Row, Col, Card, message } from 'antd';
import { MRB_STATUS_MAP } from '../types';
import type { MrbReview, CreateMrbReviewDTO } from '../types';
import { FileTextOutlined, ApartmentOutlined, WarningOutlined, CalendarOutlined, UserOutlined } from '@ant-design/icons';

const { Option } = Select;
const { TextArea } = Input;

interface MrbReviewFormProps {
  mode?: 'create' | 'edit';
  initialValues?: MrbReview;
  onFinish: (values: any) => void;
  onCancel: () => void;
}

const MrbReviewForm: React.FC<MrbReviewFormProps> = ({
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
      form.setFieldsValue({
        status: 'PENDING',
        defectLevel: 'MAJOR',
      });
    }
  }, [initialValues]);

  const handleSubmit = async (values: any) => {
    try {
      const formData: CreateMrbReviewDTO = {
        mrbNo: values.mrbNo,
        inspectionId: values.inspectionId,
        inspectionNo: values.inspectionNo,
        ticketId: values.ticketId,
        productCode: values.productCode,
        productName: values.productName,
        productSpec: values.productSpec,
        batchNo: values.batchNo,
        qty: values.qty,
        defectDescription: values.defectDescription,
        defectLevel: values.defectLevel,
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
              label="MRB编号"
              name="mrbNo"
              rules={[
                { required: true, message: '请输入MRB编号' },
                { pattern: /^MRB-\d{4,}$/, message: 'MRB编号格式不正确' }
              ]}
            >
              <Input placeholder="请输入MRB编号，如MRB-20260425001" prefix={<FileTextOutlined />} />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label="质检单号"
              name="inspectionNo"
            >
              <Input placeholder="请输入质检单号" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label="浮票ID"
              name="ticketId"
            >
              <Input placeholder="请输入浮票ID" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label="质检单ID"
              name="inspectionId"
            >
              <Input placeholder="请输入质检单ID" />
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
                  {Object.entries(MRB_STATUS_MAP).map(([key, value]) => (
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
          <Col span={8}>
            <Form.Item
              label="批号"
              name="batchNo"
              rules={[
                { required: true, message: '请输入批号' },
                { pattern: /^\d{10,}$/, message: '批号格式不正确' }
              ]}
            >
              <Input placeholder="请输入批号，如20260425001" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="数量"
              name="qty"
              rules={[
                { required: true, message: '请输入数量' },
                { type: 'number', min: 1, message: '数量必须大于0' }
              ]}
            >
              <InputNumber
                placeholder="请输入数量"
                style={{ width: '100%' }}
                min={1}
                addonAfter="件"
              />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      {/* 不良信息 */}
      <Card
        title="不良信息"
        style={{ marginBottom: '16px' }}
        extra={<WarningOutlined style={{ color: '#1677ff' }} />}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="不良等级"
              name="defectLevel"
              rules={[{ required: true, message: '请选择不良等级' }]}
            >
              <Select placeholder="请选择不良等级">
                <Option value="MINOR">轻微</Option>
                <Option value="MAJOR">主要</Option>
                <Option value="CRITICAL">严重</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              label="不良描述"
              name="defectDescription"
              rules={[{ required: true, message: '请输入不良描述' }]}
            >
              <TextArea
                rows={4}
                placeholder="请详细描述不良问题"
                maxLength={1000}
                showCount
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
          title="评审信息"
          extra={<CalendarOutlined style={{ color: '#1677ff' }} />}
        >
          <Row gutter={16}>
            <Col span={6}>
              <div><strong>评审人：</strong>{initialValues.reviewer || '-'}</div>
            </Col>
            <Col span={6}>
              <div><strong>批准人：</strong>{initialValues.approver || '-'}</div>
            </Col>
          </Row>
          <Row gutter={16} style={{ marginTop: '12px' }}>
            <Col span={8}>
              <div><strong>评审时间：</strong>{initialValues.reviewTime || '-'}</div>
            </Col>
            <Col span={8}>
              <div><strong>完成时间：</strong>{initialValues.completeTime || '-'}</div>
            </Col>
          </Row>
          {initialValues.dispositionResult && (
            <Row gutter={16} style={{ marginTop: '12px' }}>
              <Col span={12}>
                <div><strong>处理结果：</strong>{initialValues.dispositionResult}</div>
              </Col>
            </Row>
          )}
          {initialValues.dispositionRemark && (
            <Row gutter={16} style={{ marginTop: '12px' }}>
              <Col span={24}>
                <div><strong>处理意见：</strong>{initialValues.dispositionRemark}</div>
              </Col>
            </Row>
          )}
        </Card>
      )}
    </Form>
  );
};

export default MrbReviewForm;

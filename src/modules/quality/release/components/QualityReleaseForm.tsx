/**
 * 质量放行单表单组件
 * 支持放行单创建和编辑
 */

import React, { useEffect } from 'react';
import { Form, Input, Select, InputNumber, Row, Col, Card, message } from 'antd';
import { RELEASE_STATUS_MAP, RELEASE_TYPE_MAP } from '../types';
import type { QualityRelease, CreateQualityReleaseDTO } from '../types';
import { FileTextOutlined, ApartmentOutlined, SafetyOutlined, UserOutlined } from '@ant-design/icons';

const { Option } = Select;
const { TextArea } = Input;

interface QualityReleaseFormProps {
  mode?: 'create' | 'edit';
  initialValues?: QualityRelease;
  onFinish: (values: any) => void;
  onCancel: () => void;
}

const QualityReleaseForm: React.FC<QualityReleaseFormProps> = ({
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
        releaseType: 'BATCH',
      });
    }
  }, [initialValues]);

  const handleSubmit = async (values: any) => {
    try {
      const formData: CreateQualityReleaseDTO = {
        releaseNo: values.releaseNo,
        inspectionId: values.inspectionId,
        inspectionNo: values.inspectionNo,
        ticketId: values.ticketId,
        productCode: values.productCode,
        productName: values.productName,
        productSpec: values.productSpec,
        batchNo: values.batchNo,
        lotNo: values.lotNo,
        qty: values.qty,
        releaseType: values.releaseType,
        requester: values.requester,
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
              label="放行单号"
              name="releaseNo"
              rules={[
                { required: true, message: '请输入放行单号' },
                { pattern: /^QR-\d{4,}$/, message: '放行单号格式不正确' }
              ]}
            >
              <Input placeholder="请输入放行单号，如QR-20260425001" prefix={<FileTextOutlined />} />
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

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="放行类型"
              name="releaseType"
              rules={[{ required: true, message: '请选择放行类型' }]}
            >
              <Select placeholder="请选择放行类型">
                {Object.entries(RELEASE_TYPE_MAP).map(([key, value]) => (
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
                  {Object.entries(RELEASE_STATUS_MAP).map(([key, value]) => (
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
          <Col span={6}>
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
          <Col span={6}>
            <Form.Item
              label="子批号"
              name="lotNo"
              rules={[{ required: true, message: '请输入子批号' }]}
            >
              <Input placeholder="请输入子批号，如001" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
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

      {/* 审批信息 */}
      <Card
        title="审批信息"
        style={{ marginBottom: '16px' }}
        extra={<SafetyOutlined style={{ color: '#1677ff' }} />}
      >
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="申请人"
              name="requester"
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
          title="审批信息"
          extra={<SafetyOutlined style={{ color: '#1677ff' }} />}
        >
          <Row gutter={16}>
            <Col span={8}>
              <div><strong>批准人：</strong>{initialValues.approver || '-'}</div>
            </Col>
            <Col span={8}>
              <div><strong>批准时间：</strong>{initialValues.approvalTime || '-'}</div>
            </Col>
          </Row>
          {initialValues.rejectReason && (
            <Row gutter={16} style={{ marginTop: '12px' }}>
              <Col span={24}>
                <div><strong>拒绝原因：</strong>{initialValues.rejectReason}</div>
              </Col>
            </Row>
          )}
          <Row gutter={16} style={{ marginTop: '12px' }}>
            <Col span={8}>
              <div><strong>完成时间：</strong>{initialValues.completeTime || '-'}</div>
            </Col>
          </Row>
        </Card>
      )}
    </Form>
  );
};

export default QualityReleaseForm;

/**
 * 质检单表单组件
 * 支持质检单创建和编辑
 */

import React, { useEffect } from 'react';
import { Form, Input, Select, InputNumber, Row, Col, Card, message } from 'antd';
import { INSPECTION_STATUS_MAP, INSPECTION_TYPE_MAP } from '../types';
import type { Inspection, CreateInspectionDTO } from '../types';
import { FileTextOutlined, ApartmentOutlined, ShoppingOutlined, SafetyOutlined, UserOutlined } from '@ant-design/icons';

const { Option } = Select;
const { TextArea } = Input;

interface InspectionFormProps {
  mode?: 'create' | 'edit';
  initialValues?: Inspection;
  onFinish: (values: any) => void;
  onCancel: () => void;
}

const InspectionForm: React.FC<InspectionFormProps> = ({
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
        inspectionType: 'PROCESS',
      });
    }
  }, [initialValues]);

  const handleSubmit = async (values: any) => {
    try {
      const formData: CreateInspectionDTO = {
        inspectionNo: values.inspectionNo,
        ticketId: values.ticketId,
        ticketNo: values.ticketNo,
        workOrderId: values.workOrderId,
        workOrderNo: values.workOrderNo,
        productCode: values.productCode,
        productName: values.productName,
        productSpec: values.productSpec,
        batchNo: values.batchNo,
        lotNo: values.lotNo,
        inspectionType: values.inspectionType,
        qcSchemeId: values.qcSchemeId,
        qcSchemeName: values.qcSchemeName,
        sampleQty: values.sampleQty,
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
          <Col span={8}>
            <Form.Item
              label="质检单号"
              name="inspectionNo"
              rules={[
                { required: true, message: '请输入质检单号' },
                { pattern: /^INS-\d{4,}$/, message: '质检单号格式不正确' }
              ]}
            >
              <Input placeholder="请输入质检单号，如INS-20260425001" prefix={<FileTextOutlined />} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="浮票号"
              name="ticketNo"
            >
              <Input placeholder="请输入浮票号" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="工单号"
              name="workOrderNo"
            >
              <Input placeholder="请输入工单号" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="浮票ID"
              name="ticketId"
            >
              <Input placeholder="请输入浮票ID" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="工单ID"
              name="workOrderId"
            >
              <Input placeholder="请输入工单ID" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="质检类型"
              name="inspectionType"
              rules={[{ required: true, message: '请选择质检类型' }]}
            >
              <Select placeholder="请选择质检类型">
                {Object.entries(INSPECTION_TYPE_MAP).map(([key, value]) => (
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

        {mode === 'edit' && initialValues && (
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="状态"
                name="status"
              >
                <Select disabled>
                  {Object.entries(INSPECTION_STATUS_MAP).map(([key, value]) => (
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
      </Card>

      {/* 质检配置 */}
      <Card
        title="质检配置"
        style={{ marginBottom: '16px' }}
        extra={<SafetyOutlined style={{ color: '#1677ff' }} />}
      >
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="质检方案ID"
              name="qcSchemeId"
              rules={[{ required: true, message: '请输入质检方案ID' }]}
            >
              <Input placeholder="请输入质检方案ID" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="质检方案名称"
              name="qcSchemeName"
              rules={[{ required: true, message: '请输入质检方案名称' }]}
            >
              <Input placeholder="请输入质检方案名称" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="抽样数量"
              name="sampleQty"
              rules={[
                { required: true, message: '请输入抽样数量' },
                { type: 'number', min: 1, message: '抽样数量必须大于0' }
              ]}
            >
              <InputNumber
                placeholder="请输入抽样数量"
                style={{ width: '100%' }}
                min={1}
                addonAfter="件"
              />
            </Form.Item>
          </Col>
        </Row>

        {mode === 'edit' && initialValues && (
          <Row gutter={16}>
            <Col span={8}>
              <div><strong>检验员：</strong>{initialValues.inspector || '-'}</div>
            </Col>
            <Col span={8}>
              <div><strong>检验时间：</strong>{initialValues.inspectionTime || '-'}</div>
            </Col>
          </Row>
        )}
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
          extra={<ShoppingOutlined style={{ color: '#1677ff' }} />}
        >
          <Row gutter={16}>
            <Col span={6}>
              <div><strong>合格数量：</strong>{initialValues.qualifiedQty}</div>
            </Col>
            <Col span={6}>
              <div><strong>不合格数量：</strong>{initialValues.unqualifiedQty}</div>
            </Col>
            <Col span={6}>
              <div><strong>有条件数量：</strong>{initialValues.conditionalQty}</div>
            </Col>
            <Col span={6}>
              <div><strong>判定结果：</strong></div>
            </Col>
          </Row>
          {initialValues.result && (
            <Row gutter={16} style={{ marginTop: '12px' }}>
              <Col span={24}>
                <div style={{
                  color: INSPECTION_STATUS_MAP[initialValues.result]?.color,
                  fontWeight: 'bold',
                  fontSize: '14px'
                }}>
                  {INSPECTION_STATUS_MAP[initialValues.result]?.label}
                </div>
              </Col>
            </Row>
          )}
          {initialValues.resultDetails && (
            <Row gutter={16} style={{ marginTop: '12px' }}>
              <Col span={24}>
                <div><strong>结果详情：</strong>{initialValues.resultDetails}</div>
              </Col>
            </Row>
          )}
        </Card>
      )}
    </Form>
  );
};

export default InspectionForm;

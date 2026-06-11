/**
 * 批生产浮票表单组件
 * 支持浮票创建和编辑
 */

import React, { useEffect } from 'react';
import { Form, Input, Select, InputNumber, Row, Col, Card, message, Transfer, Tag } from 'antd';
import { FLOAT_TICKET_STATUS_MAP, FLOAT_TICKET_TYPE_MAP } from '../types';
import type { FloatTicket, CreateFloatTicketDTO } from '../types';
import { FileTextOutlined, ApartmentOutlined, ShoppingOutlined, CalendarOutlined, SafetyOutlined, ToolOutlined } from '@ant-design/icons';

const { Option } = Select;
const { TextArea } = Input;

interface FloatTicketFormProps {
  mode?: 'create' | 'edit';
  initialValues?: FloatTicket;
  onFinish: (values: any) => void;
  onCancel: () => void;
}

const FloatTicketForm: React.FC<FloatTicketFormProps> = ({
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
        ticketType: 'PRODUCTION',
        status: 'CREATED',
        processPath: [],
      });
    }
  }, [initialValues]);

  const handleSubmit = async (values: any) => {
    try {
      const formData: CreateFloatTicketDTO = {
        ticketNo: values.ticketNo,
        workOrderId: values.workOrderId,
        workOrderNo: values.workOrderNo,
        productionOrderId: values.productionOrderId,
        productionOrderNo: values.productionOrderNo,
        productCode: values.productCode,
        productName: values.productName,
        productSpec: values.productSpec,
        batchNo: values.batchNo,
        lotNo: values.lotNo,
        planQty: values.planQty,
        ticketType: values.ticketType,
        priority: values.priority,
        processPath: values.processPath || [],
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
              label="浮票号"
              name="ticketNo"
              rules={[
                { required: true, message: '请输入浮票号' },
                { pattern: /^FT-\d{4,}$/, message: '浮票号格式不正确' }
              ]}
            >
              <Input placeholder="请输入浮票号，如FT-20260425001" prefix={<FileTextOutlined />} />
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
              label="生产订单"
              name="productionOrderNo"
              rules={[{ required: true, message: '请输入生产订单' }]}
            >
              <Input placeholder="请输入生产订单" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label="浮票类型"
              name="ticketType"
              rules={[{ required: true, message: '请选择浮票类型' }]}
            >
              <Select placeholder="请选择浮票类型">
                {Object.entries(FLOAT_TICKET_TYPE_MAP).map(([key, value]) => (
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
                  {Object.entries(FLOAT_TICKET_STATUS_MAP).map(([key, value]) => (
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
              <Form.Item
                label="优先级"
                name="priority"
              >
                <Select disabled>
                  <Option value="LOW">低</Option>
                  <Option value="NORMAL">中</Option>
                  <Option value="HIGH">高</Option>
                  <Option value="URGENT">紧急</Option>
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

      {/* 数量和工序信息 */}
      <Card
        title="数量和工序信息"
        style={{ marginBottom: '16px' }}
        extra={<ShoppingOutlined style={{ color: '#1677ff' }} />}
      >
        <Row gutter={16}>
          <Col span={8}>
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
          <Col span={8}>
            <Form.Item
              label="工单ID"
              name="workOrderId"
              rules={[{ required: true, message: '请输入工单ID' }]}
            >
              <Input placeholder="请输入工单ID" />
            </Form.Item>
          </Col>
          <Col span={8}>
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
          <Col span={24}>
            <Form.Item
              label="工序路径"
              name="processPath"
              rules={[{ required: true, message: '请选择工序路径' }]}
            >
              <Select
                mode="multiple"
                placeholder="请选择工序路径"
                style={{ width: '100%' }}
              >
                <Option value="OP0010">OP0010 - 下料</Option>
                <Option value="OP0020">OP0020 - 车削</Option>
                <Option value="OP0030">OP0030 - 热处理</Option>
                <Option value="OP0040">OP0040 - 表面处理</Option>
                <Option value="OP0050">OP0050 - 检验</Option>
                <Option value="OP0060">OP0060 - 包装</Option>
              </Select>
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
        <>
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
              <Col span={6}>
                <div><strong>发布时间：</strong>{initialValues.releaseTime || '未发布'}</div>
              </Col>
              <Col span={6}>
                <div><strong>开始时间：</strong>{initialValues.startTime || '未开始'}</div>
              </Col>
              <Col span={6}>
                <div><strong>结束时间：</strong>{initialValues.endTime || '未结束'}</div>
              </Col>
              <Col span={6}>
                <div><strong>当前工作中心：</strong>{initialValues.currentWorkcenter || '-'}</div>
              </Col>
            </Row>
          </Card>

          <Card
            title="流转信息"
            extra={<ToolOutlined style={{ color: '#1677ff' }} />}
            style={{ marginTop: '16px' }}
          >
            <Row gutter={16}>
              <Col span={12}>
                <div style={{ marginBottom: '8px' }}><strong>当前操作员：</strong>{initialValues.currentOperator || '-'}</div>
              </Col>
              <Col span={12}>
                <div style={{ marginBottom: '8px' }}><strong>已完成工序：</strong></div>
                <div>
                  {initialValues.completedSteps?.length ? (
                    initialValues.completedSteps.map((step, index) => (
                      <Tag key={index} color="green">{step}</Tag>
                    ))
                  ) : (
                    <span style={{ color: '#999' }}>无</span>
                  )}
                </div>
              </Col>
            </Row>
          </Card>

          {initialValues.qcResult && (
            <Card
              title="质检信息"
              extra={<SafetyOutlined style={{ color: '#1677ff' }} />}
              style={{ marginTop: '16px' }}
            >
              <Row gutter={16}>
                <Col span={8}>
                  <div><strong>质检结果：</strong>{initialValues.qcResult}</div>
                </Col>
                <Col span={8}>
                  <div><strong>检验员：</strong>{initialValues.inspector || '-'}</div>
                </Col>
                <Col span={8}>
                  <div><strong>检验时间：</strong>{initialValues.inspectionTime || '-'}</div>
                </Col>
              </Row>
              {initialValues.qcResultDetails && (
                <Row gutter={16} style={{ marginTop: '12px' }}>
                  <Col span={24}>
                    <div><strong>质检详情：</strong>{initialValues.qcResultDetails}</div>
                  </Col>
                </Row>
              )}
            </Card>
          )}
        </>
      )}
    </Form>
  );
};

export default FloatTicketForm;

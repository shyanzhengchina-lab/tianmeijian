/**
 * 生产工单表单组件
 * 支持生产工单基本信息、产品配置、工序明细配置
 */

import React, { useEffect } from 'react';
import { Form, Input, Select, DatePicker, InputNumber, Row, Col, Card, Button, Space, message, Table } from 'antd';
import { useWorkOrderStore } from '../store';
import { WO_STATUS_MAP, WO_TYPE_MAP } from '../types';
import type { WorkOrder, CreateWorkOrderDTO, WOStep } from '../types';
import { ShoppingOutlined, ApartmentOutlined, CalendarOutlined, FileTextOutlined, SettingOutlined, PlusOutlined, DeleteOutlined, ToolOutlined, CheckCircleOutlined, StopOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

interface WorkOrderFormProps {
  mode?: 'create' | 'edit';
  initialValues?: WorkOrder;
  onFinish: (values: any) => void;
  onCancel: () => void;
}

const WorkOrderForm: React.FC<WorkOrderFormProps> = ({
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
        planStartDate: initialValues.planStartDate ? dayjs(initialValues.planStartDate) : undefined,
        planEndDate: initialValues.planEndDate ? dayjs(initialValues.planEndDate) : undefined,
        steps: initialValues.steps || [],
      };
      form.setFieldsValue(formValues);
    } else {
      form.resetFields();
      form.setFieldsValue({
        woType: 'PRODUCTION',
        status: 'DRAFT',
        steps: [],
      });
    }
  }, [initialValues]);

  const handleSubmit = async (values: any) => {
    try {
      const formData: CreateWorkOrderDTO = {
        woNo: values.woNo,
        poId: values.poId,
        poNo: values.poNo,
        soNo: values.soNo,
        productCode: values.productCode,
        productName: values.productName,
        productSpec: values.productSpec,
        bomVersion: values.bomVersion,
        woType: values.woType,
        planQty: values.planQty,
        planStartDate: values.planStartDate ? values.planStartDate.format('YYYY-MM-DD') : undefined,
        planEndDate: values.planEndDate ? values.planEndDate.format('YYYY-MM-DD') : undefined,
        routingCode: values.routingCode,
        workcenterId: values.workcenterId,
        teamId: values.teamId,
        steps: values.steps || [],
        remark: values.remark,
      };

      await onFinish(formData);
    } catch (error) {
      message.error(mode === 'create' ? '创建失败' : '更新失败');
    }
  };

  // 工序明细表格列
  const stepColumns = [
    {
      title: '工序号',
      dataIndex: 'stepNo',
      width: 80,
      align: 'center' as const,
    },
    {
      title: '工序编码',
      dataIndex: 'stepCode',
      width: 120,
    },
    {
      title: '工序名称',
      dataIndex: 'stepName',
      width: 150,
    },
    {
      title: '计划数量',
      dataIndex: 'planQty',
      width: 100,
      align: 'center' as const,
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      align: 'center' as const,
      render: (_: any, record: WOStep, index: number) => (
        <Button
          type="link"
          size="small"
          danger
          icon={<DeleteOutlined />}
          onClick={() => {
            const currentSteps = form.getFieldValue('steps');
            const newSteps = [...currentSteps];
            newSteps.splice(index, 1);
            form.setFieldsValue({ steps: newSteps });
          }}
        >
          删除
        </Button>
      ),
    },
  ];

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      autoComplete="off"
    >
      {/* 基本信息 */}
      <Card
        title="生产工单基本信息"
        style={{ marginBottom: '16px' }}
        extra={<ShoppingOutlined style={{ color: '#1677ff' }} />}
      >
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="工单号"
              name="woNo"
              rules={[
                { required: true, message: '请输入工单号' },
                { pattern: /^WO-\d{4,}$/, message: '工单号格式不正确' }
              ]}
            >
              <Input placeholder="请输入工单号，如WO-20260425001" prefix={<ShoppingOutlined />} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="生产订单"
              name="poId"
            >
              <Input placeholder="请输入生产订单" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="销售订单"
              name="soNo"
            >
              <Input placeholder="请输入销售订单" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="销售订单"
              name="poNo"
            >
              <Input placeholder="请输入销售订单" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="工单类型"
              name="woType"
              rules={[{ required: true, message: '请选择工单类型' }]}
            >
              <Select placeholder="请选择工单类型">
                {Object.entries(WO_TYPE_MAP).map(([key, value]) => (
                  <Option key={key} value={key}>
                    {value.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="状态"
              name="status"
              rules={[{ required: true, message: '请选择状态' }]}
            >
              <Select placeholder="请选择状态">
                {Object.entries(WO_STATUS_MAP).map(([key, value]) => (
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

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="计划数量"
              name="planQty"
              rules={[{ required: true, message: '请输入计划数量' }]}
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
              label="计划开始日期"
              name="planStartDate"
              rules={[{ required: true, message: '请选择计划开始日期' }]}
            >
              <DatePicker
                style={{ width: '100%' }}
                placeholder="请选择计划开始日期"
                format="YYYY-MM-DD"
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="计划结束日期"
              name="planEndDate"
              rules={[{ required: true, message: '请选择计划结束日期' }]}
            >
              <DatePicker
                style={{ width: '100%' }}
                placeholder="请选择计划结束日期"
                format="YYYY-MM-DD"
              />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      {/* 产品配置 */}
      <Card
        title="产品配置"
        style={{ marginBottom: '16px' }}
        extra={<ApartmentOutlined style={{ color: '#1677ff' }} />}
      >
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="产品编码"
              name="productCode"
              rules={[{ required: true, message: '请输入产品编码' }]}
            >
              <Input placeholder="请输入产品编码" />
            </Form.Item>
          </Col>
          <Col span={8}>
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
              label="BOM版本"
              name="bomVersion"
              rules={[{ required: true, message: '请输入BOM版本' }]}
            >
              <Input placeholder="请输入BOM版本，如V2.1" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="工艺路径"
              name="routingCode"
              rules={[{ required: true, message: '请输入工艺路径' }]}
            >
              <Input placeholder="请输入工艺路径" />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      {/* 执行配置 */}
      <Card
        title="执行配置"
        style={{ marginBottom: '16px' }}
        extra={<SettingOutlined style={{ color: '#1677ff' }} />}
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
              label="操作员"
              name="operator"
            >
              <Input placeholder="请输入操作员" />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      {/* 工序明细 */}
      <Card
        title="工序明细"
        style={{ marginBottom: '16px' }}
        extra={<FileTextOutlined style={{ color: '#1677ff' }} />}
      >
        <div style={{ marginBottom: '12px' }}>
          <Form.Item label="">
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              onClick={() => {
                const currentSteps = form.getFieldValue('steps') || [];
                const newStep = {
                  stepNo: currentSteps.length * 10 + 10,
                  stepCode: '',
                  stepName: '',
                  operationId: '',
                  planQty: 100,
                };
                form.setFieldsValue({ steps: [...currentSteps, newStep] });
              }}
            >
              添加工序
            </Button>
          </Form.Item>
        </div>

        <Table
          size="small"
          dataSource={form.getFieldValue('steps') || []}
          columns={stepColumns}
          rowKey="stepNo"
          pagination={false}
          bordered
        />
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

      {/* 系统信息（编辑模式显示） */}
      {mode === 'edit' && initialValues && (
        <Card
          title="系统信息"
          extra={<CalendarOutlined style={{ color: '#1677ff' }} />}
        >
          <Row gutter={16}>
            <Col span={12}>
              <div><strong>创建时间：</strong>{initialValues.createdAt}</div>
            </Col>
            <Col span={12}>
              <div><strong>更新时间：</strong>{initialValues.updatedAt}</div>
            </Col>
          </Row>
        </Card>
      )}
    </Form>
  );
};

export default WorkOrderForm;

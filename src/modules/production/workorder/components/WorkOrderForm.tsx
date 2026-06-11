/**
 * 生产工单表单组件
 */

import React, { useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  message,
  Row,
  Col,
} from 'antd';
import { useWorkOrderStore } from '../store/workOrderStore';
import type {
  CreateWorkOrderDTO,
  WorkOrderStatus,
  WorkOrderPriority,
  WorkOrderType,
} from '../types';
import type { WorkOrder } from '../types';

const { Option } = Select;
const { TextArea } = Input;

interface WorkOrderFormProps {
  visible: boolean;
  onClose: () => void;
  record?: WorkOrder | null;
  mode: 'create' | 'edit';
}

/**
 * 生产工单表单组件
 */
export const WorkOrderForm: React.FC<WorkOrderFormProps> = ({
  visible,
  onClose,
  record,
  mode,
}) => {
  const [form] = Form.useForm();
  const { createWorkOrder, updateWorkOrder, loading } = useWorkOrderStore();

  useEffect(() => {
    if (visible && record && mode === 'edit') {
      form.setFieldsValue({
        ...record,
        planStartTime: record.planStartTime ? (require('dayjs') as any)(record.planStartTime) : null,
        planEndTime: record.planEndTime ? (require('dayjs') as any)(record.planEndTime) : null,
      });
    } else if (visible && mode === 'create') {
      form.resetFields();
    }
  }, [visible, record, mode, form]);

  /**
   * 提交表单
   */
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      const formData = {
        productName: values.productName,
        productCode: values.productCode,
        productSpec: values.productSpec,
        quantity: values.quantity,
        unit: values.unit,
        planStartTime: values.planStartTime?.format('YYYY-MM-DD HH:mm:ss') || '',
        planEndTime: values.planEndTime?.format('YYYY-MM-DD HH:mm:ss') || '',
        workCenter: values.workCenter,
        operatorId: values.operatorId,
        teamId: values.teamId,
        bomId: values.bomId,
        bomVersion: values.bomVersion,
        priority: values.priority,
        type: values.type,
        remark: values.remark,
      };

      if (mode === 'create') {
        await createWorkOrder(formData);
      } else if (mode === 'edit' && record) {
        await updateWorkOrder({
          id: record.id,
          ...formData,
        });
      }

      form.resetFields();
      onClose();
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  return (
    <Modal
      title={mode === 'create' ? '新增生产工单' : '编辑生产工单'}
      open={visible}
      onOk={handleSubmit}
      onCancel={onClose}
      width={800}
      confirmLoading={loading}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          priority: 'NORMAL',
          type: 'STANDARD',
          status: 'DRAFT',
          unit: 'PCS',
        }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="productCode"
              label="产品编码"
              rules={[{ required: true, message: '请输入产品编码' }]}
            >
              <Input placeholder="请输入产品编码" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="productName"
              label="产品名称"
              rules={[{ required: true, message: '请输入产品名称' }]}
            >
              <Input placeholder="请输入产品名称" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="productSpec"
              label="产品规格"
            >
              <Input placeholder="请输入产品规格" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              name="quantity"
              label="数量"
              rules={[{ required: true, message: '请输入数量' }]}
            >
              <InputNumber min={1} precision={0} placeholder="数量" style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              name="unit"
              label="单位"
            >
              <Select placeholder="单位">
                <Option value="PCS">PCS</Option>
                <Option value="KG">KG</Option>
                <Option value="M">M</Option>
                <Option value="L">L</Option>
                <Option value="SET">SET</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="planStartTime"
              label="计划开始时间"
              rules={[{ required: true, message: '请选择计划开始时间' }]}
            >
              <DatePicker
                showTime
                format="YYYY-MM-DD HH:mm:ss"
                placeholder="请选择计划开始时间"
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="planEndTime"
              label="计划结束时间"
              rules={[{ required: true, message: '请选择计划结束时间' }]}
            >
              <DatePicker
                showTime
                format="YYYY-MM-DD HH:mm:ss"
                placeholder="请选择计划结束时间"
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="workCenter"
              label="工作中心"
              rules={[{ required: true, message: '请输入工作中心' }]}
            >
              <Select placeholder="请选择工作中心">
                <Option value="WC001">装配中心</Option>
                <Option value="WC002">加工中心</Option>
                <Option value="WC003">包装中心</Option>
                <Option value="WC004">质检中心</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="operatorId"
              label="操作员ID"
              rules={[{ required: true, message: '请输入操作员ID' }]}
            >
              <Input placeholder="请输入操作员ID" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="teamId"
              label="班组ID"
              rules={[{ required: true, message: '请输入班组ID' }]}
            >
              <Input placeholder="请输入班组ID" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="bomId"
              label="BOM ID"
              rules={[{ required: true, message: '请输入BOM ID' }]}
            >
              <Input placeholder="请输入BOM ID" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="bomVersion"
              label="BOM版本"
              rules={[{ required: true, message: '请输入BOM版本' }]}
            >
              <Input placeholder="请输入BOM版本" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="priority"
              label="优先级"
              rules={[{ required: true, message: '请选择优先级' }]}
            >
              <Select placeholder="请选择优先级">
                <Option value="URGENT">紧急</Option>
                <Option value="HIGH">高</Option>
                <Option value="NORMAL">普通</Option>
                <Option value="LOW">低</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="type"
              label="工单类型"
              rules={[{ required: true, message: '请选择工单类型' }]}
            >
              <Select placeholder="请选择工单类型">
                <Option value="STANDARD">标准工单</Option>
                <Option value="RUSH">抢工单</Option>
                <Option value="EXCEPTION">异常工单</Option>
                <Option value="MAINTENANCE">维护工单</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="remark" label="备注">
          <TextArea rows={3} placeholder="请输入备注" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default WorkOrderForm;

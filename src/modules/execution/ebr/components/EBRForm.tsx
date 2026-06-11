/**
 * 电子批记录表单组件
 */

import React, { useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  message,
  Row,
  Col,
} from 'antd';
import { useEBRStore } from '../store/ebrStore';
import type { CreateEBRDTO } from '../types';
import type { EBRRecord } from '../types';

const { Option } = Select;
const { TextArea } = Input;

interface EBRFormProps {
  visible: boolean;
  onClose: () => void;
  record?: EBRRecord | null;
  mode: 'create' | 'edit';
}

/**
 * 电子批记录表单组件
 */
export const EBRForm: React.FC<EBRFormProps> = ({
  visible,
  onClose,
  record,
  mode,
}) => {
  const [form] = Form.useForm();
  const { createEBRRecord, updateEBRRecord, loading } = useEBRStore();

  useEffect(() => {
    if (visible && record && mode === 'edit') {
      form.setFieldsValue({
        ...record,
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

      const formData: CreateEBRDTO = {
        workOrderId: values.workOrderId,
        recipeId: values.recipeId,
        operatorId: values.operatorId,
        supervisorId: values.supervisorId,
        remark: values.remark,
      };

      if (mode === 'create') {
        await createEBRRecord(formData);
      } else if (mode === 'edit' && record) {
        await updateEBRRecord({
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
      title={mode === 'create' ? '新增电子批记录' : '编辑电子批记录'}
      open={visible}
      onOk={handleSubmit}
      onCancel={onClose}
      width={600}
      confirmLoading={loading}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="workOrderId"
              label="工单ID"
              rules={[{ required: true, message: '请输入工单ID' }]}
            >
              <Input placeholder="请输入工单ID" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="recipeId"
              label="配方ID"
              rules={[{ required: true, message: '请输入配方ID' }]}
            >
              <Input placeholder="请输入配方ID" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="operatorId"
              label="操作员ID"
              rules={[{ required: true, message: '请输入操作员ID' }]}
            >
              <Input placeholder="请输入操作员ID" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="supervisorId"
              label="主管ID"
              rules={[{ required: true, message: '请输入主管ID' }]}
            >
              <Input placeholder="请输入主管ID" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="remark" label="备注">
          <TextArea rows={4} placeholder="请输入备注" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default EBRForm;

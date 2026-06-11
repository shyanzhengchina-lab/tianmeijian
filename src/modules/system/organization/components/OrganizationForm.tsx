/**
 * 组织架构表单组件
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
import { useOrganizationStore } from '../store/organizationStore';
import type {
  CreateOrgNodeDTO,
  OrgNodeType,
  OrgNodeStatus,
} from '../types';
import type { OrgNode } from '../types';

const { Option } = Select;
const { TextArea } = Input;

interface OrganizationFormProps {
  visible: boolean;
  onClose: () => void;
  record?: OrgNode | null;
  mode: 'create' | 'edit';
}

/**
 * 组织架构表单组件
 */
export const OrganizationForm: React.FC<OrganizationFormProps> = ({
  visible,
  onClose,
  record,
  mode,
}) => {
  const [form] = Form.useForm();
  const { createOrgNode, updateOrgNode, loading } = useOrganizationStore();

  useEffect(() => {
    if (visible && record && mode === 'edit') {
      form.setFieldsValue({
        ...record,
        factoryId: record.factoryId,
        workshopId: record.workshopId,
        workCenterId: record.workCenterId,
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

      const formData: CreateOrgNodeDTO = {
        nodeCode: values.nodeCode,
        nodeName: values.nodeName,
        nodeType: values.nodeType,
        parentId: values.parentId,
        factoryId: values.factoryId,
        workshopId: values.workshopId,
        workCenterId: values.workCenterId,
        leaderId: values.leaderId,
        deputyLeaderId: values.deputyLeaderId,
        phone: values.phone,
        email: values.email,
        address: values.address,
        description: values.description,
        remark: values.remark,
        sort: values.sort,
      };

      if (mode === 'create') {
        await createOrgNode(formData);
      } else if (mode === 'edit' && record) {
        await updateOrgNode({
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
      title={mode === 'create' ? '新增组织节点' : '编辑组织节点'}
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
          nodeType: 'DEPARTMENT',
          status: 'ACTIVE',
          sort: 0,
        }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="nodeCode"
              label="节点编码"
              rules={[{ required: true, message: '请输入节点编码' }]}
            >
              <Input placeholder="请输入节点编码" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="nodeName"
              label="节点名称"
              rules={[{ required: true, message: '请输入节点名称' }]}
            >
              <Input placeholder="请输入节点名称" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="nodeType"
              label="节点类型"
              rules={[{ required: true, message: '请选择节点类型' }]}
            >
              <Select placeholder="请选择节点类型">
                <Option value="COMPANY">公司</Option>
                <Option value="DEPARTMENT">部门</Option>
                <Option value="TEAM">班组</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="parentId"
              label="父节点"
            >
              <Select placeholder="请选择父节点" allowClear>
                <Option value="ROOT">根节点</Option>
                {/* TODO: 动态加载父节点 */}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="factoryId"
              label="工厂"
              rules={[{ required: true, message: '请选择工厂' }]}
            >
              <Select placeholder="请选择工厂">
                <Option value="F001">上海工厂</Option>
                <Option value="F002">苏州工厂</Option>
                <Option value="F003">宁波工厂</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="workshopId"
              label="车间"
            >
              <Select placeholder="请选择车间" allowClear>
                <Option value="WS001">装配车间</Option>
                <Option value="WS002">加工车间</Option>
                <Option value="WS003">包装车间</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="workCenterId"
              label="工作中心"
            >
              <Select placeholder="请选择工作中心" allowClear>
                <Option value="WC001">装配中心</Option>
                <Option value="WC002">加工中心</Option>
                <Option value="WC003">包装中心</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="leaderId"
              label="负责人ID"
            >
              <Input placeholder="请输入负责人ID" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="deputyLeaderId"
              label="副负责人ID"
            >
              <Input placeholder="请输入副负责人ID" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="phone"
              label="联系电话"
            >
              <Input placeholder="请输入联系电话" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="email"
              label="联系邮箱"
            >
              <Input placeholder="请输入联系邮箱" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="address"
          label="地址"
        >
          <Input placeholder="请输入地址" />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="sort"
              label="排序"
            >
              <InputNumber min={0} placeholder="排序" style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="status"
              label="状态"
            >
              <Select placeholder="请选择状态">
                <Option value="ACTIVE">生效</Option>
                <Option value="INACTIVE">停用</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="description" label="描述">
          <TextArea rows={2} placeholder="请输入描述" />
        </Form.Item>

        <Form.Item name="remark" label="备注">
          <TextArea rows={2} placeholder="请输入备注" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default OrganizationForm;

/**
 * 领料单表单组件
 */

import React, { useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Button,
  Table,
  Space,
  message,
  Row,
  Col,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  MinusCircleOutlined,
} from '@ant-design/icons';
import { useIssuanceStore } from '../store/issuanceStore';
import type {
  CreateIssuanceDTO,
  IssuanceType,
  IssuanceMethod,
} from '../types';
import { ISSUANCE_TYPE_MAP, ISSUANCE_METHOD_MAP } from '../types';
import type { MaterialIssuance } from '../types';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

interface IssuanceFormProps {
  visible: boolean;
  onClose: () => void;
  record?: MaterialIssuance | null;
  mode: 'create' | 'edit';
}

/**
 * 领料单表单组件
 */
export const IssuanceForm: React.FC<IssuanceFormProps> = ({
  visible,
  onClose,
  record,
  mode,
}) => {
  const [form] = Form.useForm();
  const { createIssuance, updateIssuance, loading } = useIssuanceStore();

  useEffect(() => {
    if (visible && record && mode === 'edit') {
      form.setFieldsValue({
        ...record,
        planReturnTime: record.planReturnTime ? dayjs(record.planReturnTime) : null,
        issuanceItems: record.issuanceItems,
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

      const formData: CreateIssuanceDTO = {
        workOrderId: values.workOrderId,
        taskId: values.taskId,
        operationId: values.operationId,
        issuanceType: values.issuanceType,
        method: values.method,
        planReturnTime: values.planReturnTime?.format('YYYY-MM-DD HH:mm:ss') || '',
        requesterId: values.requesterId,
        operatorId: values.operatorId,
        receiverId: values.receiverId,
        issuanceItems: values.issuanceItems?.map((item: any) => ({
          materialId: item.materialId,
          batchNo: item.batchNo,
          requestedQty: item.requestedQty,
          warehouseId: item.warehouseId,
          locationId: item.locationId,
        })) || [],
        remark: values.remark,
      };

      if (mode === 'create') {
        await createIssuance(formData);
      } else if (mode === 'edit' && record) {
        await updateIssuance({
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

  /**
   * 领料明细表格列定义
   */
  const itemColumns = [
    {
      title: '物料编码',
      dataIndex: 'materialCode',
      width: 150,
      render: (_: any, record: any, index: number) => (
        <Form.Item
          name={['issuanceItems', index, 'materialCode']}
          style={{ margin: 0 }}
          rules={[{ required: true, message: '请输入物料编码' }]}
        >
          <Input placeholder="物料编码" />
        </Form.Item>
      ),
    },
    {
      title: '物料名称',
      dataIndex: 'materialName',
      width: 150,
      render: (_: any, record: any, index: number) => (
        <Form.Item
          name={['issuanceItems', index, 'materialName']}
          style={{ margin: 0 }}
          rules={[{ required: true, message: '请输入物料名称' }]}
        >
          <Input placeholder="物料名称" />
        </Form.Item>
      ),
    },
    {
      title: '批号',
      dataIndex: 'batchNo',
      width: 120,
      render: (_: any, record: any, index: number) => (
        <Form.Item
          name={['issuanceItems', index, 'batchNo']}
          style={{ margin: 0 }}
          rules={[{ required: true, message: '请输入批号' }]}
        >
          <Input placeholder="批号" />
        </Form.Item>
      ),
    },
    {
      title: '申请数量',
      dataIndex: 'requestedQty',
      width: 120,
      render: (_: any, record: any, index: number) => (
        <Form.Item
          name={['issuanceItems', index, 'requestedQty']}
          style={{ margin: 0 }}
          rules={[{ required: true, message: '请输入申请数量' }]}
        >
          <InputNumber min={0} precision={2} placeholder="数量" style={{ width: '100%' }} />
        </Form.Item>
      ),
    },
    {
      title: '单位',
      dataIndex: 'unit',
      width: 80,
      render: (_: any, record: any, index: number) => (
        <Form.Item
          name={['issuanceItems', index, 'unit']}
          style={{ margin: 0 }}
        >
          <Input placeholder="单位" disabled />
        </Form.Item>
      ),
    },
    {
      title: '仓库',
      dataIndex: 'warehouseName',
      width: 150,
      render: (_: any, record: any, index: number) => (
        <Form.Item
          name={['issuanceItems', index, 'warehouseName']}
          style={{ margin: 0 }}
          rules={[{ required: true, message: '请选择仓库' }]}
        >
          <Select placeholder="选择仓库">
            <Option value="WH001">主仓库</Option>
            <Option value="WH002">原料仓</Option>
            <Option value="WH003">成品仓</Option>
          </Select>
        </Form.Item>
      ),
    },
    {
      title: '库位',
      dataIndex: 'locationCode',
      width: 120,
      render: (_: any, record: any, index: number) => (
        <Form.Item
          name={['issuanceItems', index, 'locationCode']}
          style={{ margin: 0 }}
        >
          <Input placeholder="库位编码" />
        </Form.Item>
      ),
    },
    {
      title: '操作',
      width: 80,
      fixed: 'right' as const,
      render: (_: any, record: any, index: number) => (
        <Button
          type="link"
          danger
          icon={<DeleteOutlined />}
          onClick={() => {
            const items = form.getFieldValue('issuanceItems') || [];
            items.splice(index, 1);
            form.setFieldValue('issuanceItems', items);
          }}
        />
      ),
    },
  ];

  return (
    <Modal
      title={mode === 'create' ? '新增领料单' : '编辑领料单'}
      open={visible}
      onOk={handleSubmit}
      onCancel={onClose}
      width={1200}
      confirmLoading={loading}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          issuanceType: 'NORMAL',
          method: 'PER_BATCH',
          issuanceItems: [],
        }}
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
              name="taskId"
              label="任务ID"
              rules={[{ required: true, message: '请输入任务ID' }]}
            >
              <Input placeholder="请输入任务ID" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="operationId"
              label="工序ID"
              rules={[{ required: true, message: '请输入工序ID' }]}
            >
              <Input placeholder="请输入工序ID" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="issuanceType"
              label="领料类型"
              rules={[{ required: true, message: '请选择领料类型' }]}
            >
              <Select placeholder="请选择领料类型">
                {Object.entries(ISSUANCE_TYPE_MAP).map(([key, value]) => (
                  <Option key={key} value={key}>
                    {value.icon} {value.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="method"
              label="领料方式"
              rules={[{ required: true, message: '请选择领料方式' }]}
            >
              <Select placeholder="请选择领料方式">
                {Object.entries(ISSUANCE_METHOD_MAP).map(([key, value]) => (
                  <Option key={key} value={key}>
                    {value.icon} {value.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="planReturnTime"
              label="计划退料时间"
              rules={[{ required: true, message: '请选择计划退料时间' }]}
            >
              <DatePicker
                showTime
                format="YYYY-MM-DD HH:mm:ss"
                placeholder="请选择计划退料时间"
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="requesterId"
              label="申请人ID"
              rules={[{ required: true, message: '请输入申请人ID' }]}
            >
              <Input placeholder="请输入申请人ID" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="operatorId"
              label="领料人ID"
              rules={[{ required: true, message: '请输入领料人ID' }]}
            >
              <Input placeholder="请输入领料人ID" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="receiverId"
              label="收料人ID"
              rules={[{ required: true, message: '请输入收料人ID' }]}
            >
              <Input placeholder="请输入收料人ID" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="领料明细">
          <Form.List name="issuanceItems">
            {(fields, { add, remove }) => (
              <>
                <Button
                  type="dashed"
                  onClick={() => add()}
                  block
                  icon={<PlusOutlined />}
                  style={{ marginBottom: 16 }}
                >
                  添加领料明细
                </Button>
                <Table
                  columns={itemColumns}
                  dataSource={fields}
                  rowKey={(record) => record.key}
                  pagination={false}
                  size="small"
                />
              </>
            )}
          </Form.List>
        </Form.Item>

        <Form.Item name="remark" label="备注">
          <TextArea rows={3} placeholder="请输入备注" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default IssuanceForm;

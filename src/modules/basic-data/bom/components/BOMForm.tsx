/**
 * 物料清单(BOM)表单组件
 * 支持BOM头和子件的编辑
 */

import React, { useEffect, useState } from 'react';
import { Form, Input, Select, InputNumber, DatePicker, Button, Table, Space, message, Popconfirm, Row, Col } from 'antd';
import { PlusOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { useBomStore } from '../store/bomStore';
import { BOM_TYPE_MAP, CHILD_TYPE_MAP, ISSUE_METHOD_MAP } from '../types';
import type { BomChild, CreateBomDTO, BomHeader } from '../types';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

interface BOMFormProps {
  mode?: 'create' | 'edit';
  initialValues?: BomHeader;
  onFinish: (values: any) => void;
  onCancel: () => void;
}

const BOMForm: React.FC<BOMFormProps> = ({
  mode = 'create',
  initialValues,
  onFinish,
  onCancel,
}) => {
  const [form] = Form.useForm();
  const [children, setChildren] = useState<Omit<BomChild, 'id'>[]>([]);
  const [editingChild, setEditingChild] = useState<Omit<BomChild, 'id'> | null>(null);
  const [childForm] = Form.useForm();

  // const { materials } = useBomStore();

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue(initialValues);
      if (initialValues.children && initialValues.children.length > 0) {
        setChildren(initialValues.children);
      }
    } else {
      form.resetFields();
      // 设置默认值
      form.setFieldsValue({
        bomType: '主BOM',
        mainQty: 1,
        status: 'draft',
        effectDate: dayjs().format('YYYY-MM-DD'),
      });
    }
  }, [initialValues]);

  // 子件列表列定义
  const childColumns = [
    {
      title: '行号',
      dataIndex: 'rowNo',
      key: 'rowNo',
      width: 60,
      align: 'center' as const,
    },
    {
      title: '子件编码',
      dataIndex: 'childCode',
      key: 'childCode',
      width: 120,
    },
    {
      title: '子件名称',
      dataIndex: 'childName',
      key: 'childName',
      width: 150,
    },
    {
      title: '规格型号',
      dataIndex: 'spec',
      key: 'spec',
      width: 150,
      ellipsis: true,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 80,
      render: (type: string) => {
        const typeConfig = CHILD_TYPE_MAP[type as keyof typeof CHILD_TYPE_MAP];
        return <span style={{ color: typeConfig?.color }}>{typeConfig?.label || type}</span>;
      },
    },
    {
      title: '子件数量',
      dataIndex: 'childQty',
      key: 'childQty',
      width: 100,
      align: 'right' as const,
      render: (qty: number, record: any) => `${qty} ${record.calcUnit}`,
    },
    {
      title: '损耗率',
      dataIndex: 'scrapRate',
      key: 'scrapRate',
      width: 80,
      align: 'right' as const,
      render: (rate: number) => rate ? `${rate}%` : '-',
    },
    {
      title: '领料方式',
      dataIndex: 'issueMethod',
      key: 'issueMethod',
      width: 100,
      render: (method: string) => {
        if (!method) return '-';
        const methodInfo = ISSUE_METHOD_MAP[method as keyof typeof ISSUE_METHOD_MAP];
        return <span style={{ color: methodInfo?.color }}>{methodInfo?.label}</span>;
      },
    },
    {
      title: '关键物料',
      dataIndex: 'keyMaterial',
      key: 'keyMaterial',
      width: 80,
      align: 'center' as const,
      render: (isKey: boolean) => isKey ? '是' : '否',
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: unknown, record: any, index: number) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            onClick={() => handleEditChild(index)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除"
            description="确定要删除该子件吗？"
            onConfirm={() => handleDeleteChild(index)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="link"
              size="small"
              danger
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 事件处理函数
  const handleAddChild = () => {
    childForm.resetFields();
    setEditingChild({
      rowNo: children.length + 1,
      childCode: '',
      childName: '',
      spec: '',
      freeDesc: '',
      type: '主料',
      qty: 1,
      unit: '',
      childQty: 0,
      calcUnit: '',
      scrapRate: 0,
      lossRate: 0,
      issueMethod: 'PUSH',
      keyMaterial: false,
    });
  };

  const handleEditChild = (index: number) => {
    setEditingChild({ ...children[index] });
    childForm.setFieldsValue(children[index]);
  };

  const handleDeleteChild = (index: number) => {
    const newChildren = [...children];
    newChildren.splice(index, 1);
    // 重新编号
    newChildren.forEach((child, idx) => {
      child.rowNo = (idx + 1) * 10;
    });
    setChildren(newChildren);
  };

  const handleSaveChild = () => {
    try {
      const values = childForm.getFieldsValue();

      if (!values.childCode || !values.childName) {
        message.error('请填写子件编码和名称');
        return;
      }

      const childData: Omit<BomChild, 'id'> = {
        rowNo: values.rowNo,
        childCode: values.childCode,
        childName: values.childName,
        spec: values.spec || '',
        freeDesc: values.freeDesc || '',
        type: values.type || '主料',
        qty: values.qty || 1,
        unit: values.unit || '',
        childQty: values.childQty || 0,
        calcUnit: values.calcUnit || '',
        scrapRate: values.scrapRate || 0,
        lossRate: values.lossRate || 0,
        issueMethod: values.issueMethod || 'PUSH',
        issueType: values.issueType,
        consumeOp: values.consumeOp,
        issueOperationSeq: values.issueOperationSeq,
        minIssueQty: values.minIssueQty,
        wipWarehouse: values.wipWarehouse,
        baseBatchQty: values.baseBatchQty,
        keyMaterial: values.keyMaterial || false,
        substitute: values.substitute,
      };

      if (editingChild && editingChild.childCode) {
        // 编辑现有子件
        const index = children.findIndex(c => c.rowNo === editingChild.rowNo);
        if (index !== -1) {
          const newChildren = [...children];
          newChildren[index] = childData;
          setChildren(newChildren);
        }
      } else {
        // 添加新子件
        setChildren([...children, childData]);
      }

      setEditingChild(null);
      childForm.resetFields();
      message.success('子件保存成功');
    } catch (error) {
      message.error('子件保存失败');
    }
  };

  const handleCancelEditChild = () => {
    setEditingChild(null);
    childForm.resetFields();
  };

  const handleSubmit = async (values: any) => {
    try {
      const formData: CreateBomDTO = {
        code: values.code,
        name: values.name,
        spec: values.spec,
        unit: values.unit,
        version: values.version,
        bomType: values.bomType,
        mainQty: values.mainQty,
        mainUnit: values.mainUnit,
        batchQty: values.batchQty,
        calcUnit: values.calcUnit,
        effectDate: values.effectDate,
        remark: values.remark,
        children: children,
      };

      await onFinish(formData);
    } catch (error) {
      message.error(mode === 'create' ? '创建失败' : '更新失败');
    }
  };

  return (
    <div>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        autoComplete="off"
      >
        {/* BOM头信息 */}
        <div style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #f0f0f0' }}>
          <h3>BOM基本信息</h3>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="母件编码"
                name="code"
                rules={[{ required: true, message: '请输入母件编码' }]}
              >
                <Input placeholder="请输入母件编码" addonAfter={<SearchOutlined />} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="物料名称"
                name="name"
                rules={[{ required: true, message: '请输入物料名称' }]}
              >
                <Input placeholder="请输入物料名称" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="规格型号"
                name="spec"
              >
                <Input placeholder="请输入规格型号" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={6}>
              <Form.Item
                label="单位"
                name="unit"
                rules={[{ required: true, message: '请输入单位' }]}
              >
                <Input placeholder="请输入单位" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label="版本号"
                name="version"
                rules={[{ required: true, message: '请输入版本号' }]}
              >
                <Input placeholder="请输入版本号，如：1.0" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label="BOM类型"
                name="bomType"
                rules={[{ required: true, message: '请选择BOM类型' }]}
              >
                <Select placeholder="请选择BOM类型">
                  {Object.entries(BOM_TYPE_MAP).map(([key, value]) => (
                    <Option key={key} value={key}>
                      {value.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label="生效日期"
                name="effectDate"
                rules={[{ required: true, message: '请选择生效日期' }]}
              >
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={6}>
              <Form.Item
                label="主批量"
                name="mainQty"
                rules={[{ required: true, message: '请输入主批量' }]}
              >
                <InputNumber min={1} placeholder="请输入主批量" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label="主单位"
                name="mainUnit"
                rules={[{ required: true, message: '请输入主单位' }]}
              >
                <Input placeholder="请输入主单位" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label="批量"
                name="batchQty"
                rules={[{ required: true, message: '请输入批量' }]}
              >
                <InputNumber min={1} placeholder="请输入批量" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label="计量单位"
                name="calcUnit"
                rules={[{ required: true, message: '请输入计量单位' }]}
              >
                <Input placeholder="请输入计量单位" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                label="备注"
                name="remark"
              >
                <TextArea
                  rows={2}
                  placeholder="请输入备注信息"
                  maxLength={500}
                  showCount
                />
              </Form.Item>
            </Col>
          </Row>
        </div>

        {/* BOM子件信息 */}
        <div>
          <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>BOM明细</h3>
            <Button
              type="primary"
              size="small"
              icon={<PlusOutlined />}
              onClick={handleAddChild}
            >
              添加子件
            </Button>
          </div>

          {/* 子件编辑表单 */}
          {editingChild && (
            <div style={{
              marginBottom: '16px',
              padding: '16px',
              background: '#f5f5f5',
              borderRadius: '4px',
              border: '1px solid #d9d9d9'
            }}>
              <h4 style={{ marginBottom: '12px' }}>子件编辑</h4>
              <Form form={childForm} layout="inline">
                <Form.Item name="rowNo" label="行号" initialValue={editingChild.rowNo}>
                  <InputNumber style={{ width: '80px' }} disabled />
                </Form.Item>
                <Form.Item name="childCode" label="子件编码" rules={[{ required: true }]}>
                  <Input style={{ width: '150px' }} placeholder="子件编码" />
                </Form.Item>
                <Form.Item name="childName" label="子件名称" rules={[{ required: true }]}>
                  <Input style={{ width: '150px' }} placeholder="子件名称" />
                </Form.Item>
                <Form.Item name="spec" label="规格型号">
                  <Input style={{ width: '120px' }} placeholder="规格型号" />
                </Form.Item>
                <Form.Item name="type" label="类型" rules={[{ required: true }]}>
                  <Select style={{ width: '100px' }} placeholder="类型">
                    {Object.entries(CHILD_TYPE_MAP).map(([key, value]) => (
                      <Option key={key} value={key}>
                        {value.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item name="childQty" label="子件数量" rules={[{ required: true }]}>
                  <InputNumber style={{ width: '100px' }} placeholder="数量" />
                </Form.Item>
                <Form.Item name="calcUnit" label="计量单位" rules={[{ required: true }]}>
                  <Input style={{ width: '80px' }} placeholder="单位" />
                </Form.Item>
                <Form.Item name="scrapRate" label="损耗率">
                  <InputNumber style={{ width: '80px' }} placeholder="%" />
                </Form.Item>
                <Form.Item name="issueMethod" label="领料方式">
                  <Select style={{ width: '100px' }} placeholder="领料方式">
                    {Object.entries(ISSUE_METHOD_MAP).map(([key, value]) => (
                      <Option key={key} value={key}>
                        {value.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item name="keyMaterial" label="关键物料" valuePropName="checked">
                  <input type="checkbox" />
                </Form.Item>
              </Form>
              <div style={{ marginTop: '12px' }}>
                <Space>
                  <Button type="primary" size="small" onClick={handleSaveChild}>
                    保存
                  </Button>
                  <Button size="small" onClick={handleCancelEditChild}>
                    取消
                  </Button>
                </Space>
              </div>
            </div>
          )}

          {/* 子件列表 */}
          <Table
            dataSource={children}
            columns={childColumns}
            rowKey="rowNo"
            pagination={false}
            size="small"
            bordered
          />
        </div>
      </Form>
    </div>
  );
};

export default BOMForm;
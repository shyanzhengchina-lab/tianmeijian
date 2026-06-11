/**
 * 物料表单组件
 * 使用新架构的表单组件示例
 */

import React, { useEffect, useState } from 'react';
import { Form, Input, Select, InputNumber, Switch, Row, Col, message } from 'antd';
import { useMaterialStore } from '../store';
import { materialStatusMap, materialTypeMap, inventoryTypeMap } from '../types';

const { Option } = Select;
const { TextArea } = Input;

interface MaterialFormProps {
  mode?: 'create' | 'edit';
  initialValues?: any;
  onFinish: (values: any) => void;
  onCancel: () => void;
}

const MaterialForm: React.FC<MaterialFormProps> = ({
  mode = 'create',
  initialValues,
  onFinish,
  onCancel,
}) => {
  const [form] = Form.useForm();
  const { categories, units, loadCategories, loadUnits, createMaterial, updateMaterial, loading } = useMaterialStore();

  useEffect(() => {
    loadCategories();
    loadUnits();

    if (initialValues) {
      form.setFieldsValue(initialValues);
    } else {
      form.resetFields();
      // 设置默认值
      form.setFieldsValue({
        status: 'ENABLED',
        type: 'RAW_MATERIAL',
        inventoryType: 'STOCKED',
      });
    }
  }, [initialValues]);

  const handleSubmit = async (values: any) => {
    try {
      const formData = {
        ...values,
        safetyStock: values.safetyStock || 0,
        reorderPoint: values.reorderPoint || 0,
        leadTime: values.leadTime || 0,
      };

      if (mode === 'create') {
        await createMaterial(formData);
        message.success('创建成功');
      } else {
        await updateMaterial({ id: initialValues.id, ...formData });
        message.success('更新成功');
      }

      onFinish(formData);
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
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            label="物料编码"
            name="code"
            rules={[{ required: true, message: '请输入物料编码' }]}
          >
            <Input placeholder="请输入物料编码" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label="物料名称"
            name="name"
            rules={[{ required: true, message: '请输入物料名称' }]}
          >
            <Input placeholder="请输入物料名称" />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            label="物料分类"
            name="categoryId"
            rules={[{ required: true, message: '请选择物料分类' }]}
          >
            <Select placeholder="请选择物料分类">
              {categories.map(cat => (
                <Option key={cat.id} value={cat.id}>
                  {cat.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label="规格型号"
            name="specification"
          >
            <Input placeholder="请输入规格型号" />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            label="物料类型"
            name="type"
            rules={[{ required: true, message: '请选择物料类型' }]}
          >
            <Select placeholder="请选择物料类型">
              {Object.entries(materialTypeMap).map(([key, value]) => (
                <Option key={key} value={key}>
                  {(value as any)?.label || String(value)}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label="库存类型"
            name="inventoryType"
            rules={[{ required: true, message: '请选择库存类型' }]}
          >
            <Select placeholder="请选择库存类型">
              {Object.entries(inventoryTypeMap).map(([key, value]) => (
                <Option key={key} value={key}>
                  {(value as any)?.label || String(value)}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            label="计量单位"
            name="unitId"
            rules={[{ required: true, message: '请选择计量单位' }]}
          >
            <Select placeholder="请选择计量单位">
              {units.map(unit => (
                <Option key={unit.id} value={unit.id}>
                  {unit.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label="条形码"
            name="barcode"
          >
            <Input placeholder="请输入条形码" />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={8}>
          <Form.Item
            label="安全库存"
            name="safetyStock"
          >
            <InputNumber
              min={0}
              placeholder="请输入安全库存"
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            label="再订货点"
            name="reorderPoint"
          >
            <InputNumber
              min={0}
              placeholder="请输入再订货点"
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            label="前置时间"
            name="leadTime"
          >
            <InputNumber
              min={0}
              placeholder="请输入前置时间（天）"
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            label="最小包装量"
            name="minPackageQty"
          >
            <InputNumber
              min={0}
              placeholder="请输入最小包装量"
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label="标准包装量"
            name="standardPackageQty"
          >
            <InputNumber
              min={0}
              placeholder="请输入标准包装量"
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            label="标准成本"
            name="standardCost"
          >
            <InputNumber
              min={0}
              precision={2}
              placeholder="请输入标准成本"
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label="状态"
            name="status"
            valuePropName="checked"
            getValueProps={(checked) => ({
              checked: checked === 'ENABLED',
            })}
            normalize={(value) => value ? 'ENABLED' : 'DISABLED'}
          >
            <Switch
              checkedChildren="启用"
              unCheckedChildren="禁用"
            />
          </Form.Item>
        </Col>
      </Row>

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

      <Form.Item
        label="技术规格"
        name="specifications"
      >
        <TextArea
          rows={3}
          placeholder="请输入技术规格详情"
          maxLength={1000}
          showCount
        />
      </Form.Item>
    </Form>
  );
};

export default MaterialForm;
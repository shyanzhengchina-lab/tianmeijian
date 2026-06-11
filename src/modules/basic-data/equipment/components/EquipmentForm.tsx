/**
 * 设备档案表单组件
 * 支持设备基本信息和配置参数的编辑
 */

import React, { useEffect } from 'react';
import { Form, Input, Select, InputNumber, DatePicker, Switch, Row, Col, message } from 'antd';
import { useEquipmentStore } from '../store';
import { EQUIP_CATEGORY_MAP } from '../types';
import type { EquipRecord } from '../types';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

interface EquipmentFormProps {
  mode?: 'create' | 'edit';
  initialValues?: EquipRecord;
  onFinish: (values: any) => void;
  onCancel: () => void;
}

const EquipmentForm: React.FC<EquipmentFormProps> = ({
  mode = 'create',
  initialValues,
  onFinish,
  onCancel,
}) => {
  const [form] = Form.useForm();
  const { workshops, workCenters } = useEquipmentStore();

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue(initialValues);
    } else {
      form.resetFields();
      // 设置默认值
      form.setFieldsValue({
        status: 'ACTIVE',
        isSpecialProcess: false,
        isValidationRequired: false,
        oeeTarget: 85,
      });
    }
  }, [initialValues]);

  const handleSubmit = async (values: any) => {
    try {
      const formData = {
        ...values,
        purchaseDate: values.purchaseDate ? dayjs(values.purchaseDate).format('YYYY-MM-DD') : undefined,
        installDate: values.installDate ? dayjs(values.installDate).format('YYYY-MM-DD') : undefined,
        warrantyDate: values.warrantyDate ? dayjs(values.warrantyDate).format('YYYY-MM-DD') : undefined,
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
      <div style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #f0f0f0' }}>
        <h3>基本信息</h3>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="设备编码"
              name="equipCode"
              rules={[{ required: true, message: '请输入设备编码' }]}
            >
              <Input placeholder="请输入设备编码" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="设备名称"
              name="equipName"
              rules={[{ required: true, message: '请输入设备名称' }]}
            >
              <Input placeholder="请输入设备名称" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="设备类别"
              name="category"
              rules={[{ required: true, message: '请选择设备类别' }]}
            >
              <Select placeholder="请选择设备类别">
                {Object.entries(EQUIP_CATEGORY_MAP).map(([key, value]) => (
                  <Option key={key} value={key}>
                    {value.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="型号规格"
              name="model"
              rules={[{ required: true, message: '请输入型号规格' }]}
            >
              <Input placeholder="请输入型号规格" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="品牌/厂商"
              name="brand"
              rules={[{ required: true, message: '请输入品牌/厂商' }]}
            >
              <Input placeholder="请输入品牌/厂商" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="出厂序列号"
              name="serialNo"
            >
              <Input placeholder="请输入出厂序列号" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="所属车间"
              name="workshop"
              rules={[{ required: true, message: '请选择所属车间' }]}
            >
              <Select placeholder="请选择所属车间">
                {workshops.map(ws => (
                  <Option key={ws.id} value={ws.name}>
                    {ws.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="工作中心"
              name="workCenter"
              rules={[{ required: true, message: '请选择工作中心' }]}
            >
              <Select placeholder="请选择工作中心">
                {workCenters.map(wc => (
                  <Option key={wc.id} value={wc.name}>
                    {wc.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="安装位置"
              name="location"
              rules={[{ required: true, message: '请输入安装位置' }]}
            >
              <Input placeholder="请输入安装位置" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="购入日期"
              name="purchaseDate"
              rules={[{ required: true, message: '请选择购入日期' }]}
            >
              <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="安装验收日期"
              name="installDate"
            >
              <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="保质期至"
              name="warrantyDate"
              rules={[{ required: true, message: '请选择保质期至' }]}
            >
              <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="资产编号"
              name="assetNo"
            >
              <Input placeholder="请输入资产编号" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="状态"
              name="status"
              initialValue="ACTIVE"
            >
              <Select placeholder="请选择状态">
                <Option value="ACTIVE">运行中</Option>
                <Option value="IDLE">空闲</Option>
                <Option value="MAINTENANCE">保养中</Option>
                <Option value="FAULT">故障</Option>
                <Option value="DISABLED">停用</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="OEE目标(%)"
              name="oeeTarget"
            >
              <InputNumber min={0} max={100} placeholder="请输入OEE目标" style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>
      </div>

      {/* 配置参数 */}
      <div style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #f0f0f0' }}>
        <h3>配置参数</h3>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="特殊工序设备"
              name="isSpecialProcess"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="需要验证"
              name="isValidationRequired"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="精度/关键参数"
              name="precision"
            >
              <Input placeholder="请输入精度/关键参数" />
            </Form.Item>
          </Col>
        </Row>
      </div>

      {/* 保养校准 */}
      <div style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #f0f0f0' }}>
        <h3>保养校准</h3>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="上次保养日期"
              name="lastMaintDate"
            >
              <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="下次保养日期"
              name="nextMaintDate"
            >
              <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="保养周期(天)"
              name="maintCycle"
            >
              <InputNumber min={1} placeholder="请输入保养周期" style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="上次校准日期"
              name="lastCalibDate"
            >
              <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="下次校准日期"
              name="nextCalibDate"
            >
              <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="校准周期(天)"
              name="calibCycle"
            >
              <InputNumber min={1} placeholder="请输入校准周期" style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>
      </div>

      {/* 备注 */}
      <div>
        <h3>备注信息</h3>
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
      </div>
    </Form>
  );
};

export default EquipmentForm;
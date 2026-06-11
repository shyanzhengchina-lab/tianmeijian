/**
 * 工厂表单组件
 */

import React, { useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Button,
  Space,
  Row,
  Col,
} from 'antd';
import type { FactoryConfig, CreateFactoryDTO, UpdateFactoryDTO } from '../types';
import { TIMEZONE_MAP, CURRENCY_MAP, LANGUAGE_MAP } from '../types';
import { useFactoryStore } from '../store';

const { TextArea } = Input;
const { Option } = Select;

interface FactoryFormProps {
  factory?: FactoryConfig | null; // 编辑时传入，新增时为null
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

const FactoryForm: React.FC<FactoryFormProps> = ({
  factory,
  visible,
  onCancel,
  onSuccess,
}) => {
  const [form] = Form.useForm();

  const isEdit = !!factory;

  useEffect(() => {
    if (visible) {
      if (isEdit && factory) {
        // 编辑模式：填充表单
        form.setFieldsValue(factory);
      } else {
        // 新增模式：重置表单
        form.resetFields();
        // 设置默认值
        form.setFieldsValue({
          status: 'ACTIVE',
          timezone: 'Asia/Shanghai',
          currency: 'CNY',
          language: 'zh-CN',
          sortOrder: 1,
        });
      }
    }
  }, [visible, isEdit, factory, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      const data = isEdit
        ? { ...values, id: factory!.id } as UpdateFactoryDTO
        : values as CreateFactoryDTO;

      // 调用API
      // if (isEdit) {
      //   await factoryApi.updateFactory(data);
      // } else {
      //   await factoryApi.createFactory(data);
      // }

      // 本地保存（开发阶段）
      const { factories } = useFactoryStore.getState();
      if (isEdit) {
        const updatedFactories = factories.map(f =>
          f.id === factory!.id ? { ...factory!, ...values } : f
        );
        useFactoryStore.getState().setFactories(updatedFactories);
      } else {
        const newFactory: FactoryConfig = {
          id: `F${String(factories.length + 1).padStart(3, '0')}`,
          ...values,
          createTime: new Date().toISOString(),
          updateTime: new Date().toISOString(),
          creatorId: 'current-user',
          creatorName: '当前用户',
        };
        useFactoryStore.getState().setFactories([...factories, newFactory]);
      }

      onSuccess();
      Modal.success({
        title: '成功',
        content: isEdit ? '工厂更新成功' : '工厂创建成功',
      });
    } catch (error) {
      console.error('保存工厂失败:', error);
    }
  };

  return (
    <Modal
      title={isEdit ? '编辑工厂' : '新增工厂'}
      open={visible}
      onCancel={onCancel}
      width={800}
      footer={
        <Space>
          <Button onClick={onCancel}>取消</Button>
          <Button type="primary" onClick={handleSubmit}>
            确定
          </Button>
        </Space>
      }
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          status: 'ACTIVE',
          timezone: 'Asia/Shanghai',
          currency: 'CNY',
          language: 'zh-CN',
          sortOrder: 1,
        }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="code"
              label="工厂编码"
              rules={[
                { required: true, message: '请输入工厂编码' },
                { pattern: /^[A-Z0-9]{2,10}$/, message: '工厂编码为2-10位大写字母或数字' },
              ]}
            >
              <Input placeholder="请输入工厂编码，如：JN" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="name"
              label="工厂名称"
              rules={[{ required: true, message: '请输入工厂名称' }]}
            >
              <Input placeholder="请输入工厂名称，如：济宁工厂" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="nameEn"
              label="英文名称"
            >
              <Input placeholder="请输入英文名称，如：Jining Factory" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="country"
              label="所在国家"
              rules={[{ required: true, message: '请选择所在国家' }]}
            >
              <Select placeholder="请选择所在国家">
                <Option value="中国">中国</Option>
                <Option value="印度尼西亚">印度尼西亚</Option>
                <Option value="日本">日本</Option>
                <Option value="美国">美国</Option>
                <Option value="英国">英国</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="province"
              label="省份/州"
            >
              <Input placeholder="请输入省份/州" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="city"
              label="城市"
            >
              <Input placeholder="请输入城市" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="address"
              label="详细地址"
            >
              <Input placeholder="请输入详细地址" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="timezone"
              label="时区"
              rules={[{ required: true, message: '请选择时区' }]}
            >
              <Select placeholder="请选择时区">
                {Object.entries(TIMEZONE_MAP).map(([key, value]) => (
                  <Option key={key} value={key}>
                    {value}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="currency"
              label="货币"
              rules={[{ required: true, message: '请选择货币' }]}
            >
              <Select placeholder="请选择货币">
                {Object.entries(CURRENCY_MAP).map(([key, value]) => (
                  <Option key={key} value={key}>
                    {value.label} ({value.symbol})
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="language"
              label="主用语言"
              rules={[{ required: true, message: '请选择主用语言' }]}
            >
              <Select placeholder="请选择主用语言">
                {Object.entries(LANGUAGE_MAP).map(([key, value]) => (
                  <Option key={key} value={key}>
                    {value}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="contactPerson"
              label="联系人"
            >
              <Input placeholder="请输入联系人" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="contactPhone"
              label="联系电话"
              rules={[
                { pattern: /^[\d\+\-\s()]+$/, message: '请输入有效的联系电话' },
              ]}
            >
              <Input placeholder="请输入联系电话" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="contactEmail"
              label="联系邮箱"
              rules={[
                { type: 'email', message: '请输入有效的邮箱地址' },
              ]}
            >
              <Input placeholder="请输入联系邮箱" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="sortOrder"
              label="排序"
              rules={[{ required: true, message: '请输入排序' }]}
            >
              <InputNumber
                placeholder="请输入排序"
                style={{ width: '100%' }}
                min={1}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="description"
          label="描述"
        >
          <TextArea
            rows={3}
            placeholder="请输入工厂描述"
            maxLength={500}
            showCount
          />
        </Form.Item>

        <Form.Item
          name="remark"
          label="备注"
        >
          <TextArea
            rows={2}
            placeholder="请输入备注信息"
            maxLength={200}
            showCount
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default FactoryForm;
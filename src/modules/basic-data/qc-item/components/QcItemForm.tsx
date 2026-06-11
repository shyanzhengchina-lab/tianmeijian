/**
 * 质检项目表单组件
 * 支持质检项目基本信息、标准值配置、适用范围等编辑
 */

import React, { useEffect } from 'react';
import { Form, Input, Select, InputNumber, Row, Col, Card, Divider, Switch, Checkbox, Space, message, Tag} from 'antd';
import { useQcItemStore } from '../store';
import { QC_ITEM_STATUS_MAP, QC_ITEM_CATEGORY_MAP, QC_STANDARD_TYPE_MAP, QC_APPLY_TYPE_MAP, INSTRUMENT_OPTIONS, QcStandardType} from '../types';
import type { QcItem, CreateQcItemDTO } from '../types';
import { ExperimentOutlined, SafetyCertificateOutlined, ApartmentOutlined, ClockCircleOutlined } from '@ant-design/icons';

const { Option } = Select;
const { TextArea } = Input;

interface QcItemFormProps {
  mode?: 'create' | 'edit';
  initialValues?: QcItem;
  onFinish: (values: any) => void;
  onCancel: () => void;
}

const QcItemForm: React.FC<QcItemFormProps> = ({
  mode = 'create',
  initialValues,
  onFinish,
  onCancel,
}) => {
  const [form] = Form.useForm();
  const [standardType, setStandardType] = React.useState<QcStandardType>('NUMERIC');

  useEffect(() => {
    if (initialValues) {
      setStandardType(initialValues.standardType);
      const formValues = {
        ...initialValues,
        applyTypes: initialValues.applyTypes || [],
        enumOptions: initialValues.enumOptions || [],
      };
      form.setFieldsValue(formValues);
    } else {
      form.resetFields();
      // 设置默认值
      form.setFieldsValue({
        standardType: 'NUMERIC',
        isCritical: false,
        isRequired: true,
        status: 'ACTIVE',
        version: 'V1.0',
        applyTypes: ['IPQC_SELF', 'IPQC_PATROL'],
      });
      setStandardType('NUMERIC');
    }
  }, [initialValues]);

  const handleStandardTypeChange = (value: QcStandardType) => {
    setStandardType(value);
    // 清空不相关字段
    form.setFieldsValue({
      minValue: undefined,
      maxValue: undefined,
      enumOptions: [],
    });
  };

  const handleSubmit = async (values: any) => {
    try {
      const formData: CreateQcItemDTO = {
        itemCode: values.itemCode,
        itemName: values.itemName,
        category: values.category,
        standardType: values.standardType,
        standardValue: values.standardValue,
        minValue: values.minValue,
        maxValue: values.maxValue,
        unit: values.unit,
        enumOptions: values.enumOptions,
        instrumentType: values.instrumentType,
        isCritical: values.isCritical,
        isRequired: values.isRequired,
        applyTypes: values.applyTypes || [],
        refStandard: values.refStandard,
        status: values.status,
        version: values.version,
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
        title="质检项目基本信息"
        style={{ marginBottom: '16px' }}
        extra={<ExperimentOutlined style={{ color: '#1677ff' }} />}
      >
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="项目编码"
              name="itemCode"
              rules={[
                { required: true, message: '请输入项目编码' },
                { pattern: /^QCI-[A-Z]{2}-\d{3,}$/, message: '编码格式不正确，如QCI-SZ-001' }
              ]}
            >
              <Input placeholder="请输入项目编码，如QCI-SZ-001" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="项目名称"
              name="itemName"
              rules={[{ required: true, message: '请输入项目名称' }]}
            >
              <Input placeholder="请输入项目名称，如外径D1" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="检验大类"
              name="category"
              rules={[{ required: true, message: '请选择检验大类' }]}
            >
              <Select placeholder="请选择检验大类">
                {Object.entries(QC_ITEM_CATEGORY_MAP).map(([key, value]) => (
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
              label="标准值类型"
              name="standardType"
              rules={[{ required: true, message: '请选择标准值类型' }]}
            >
              <Select
                placeholder="请选择标准值类型"
                onChange={handleStandardTypeChange}
              >
                {Object.entries(QC_STANDARD_TYPE_MAP).map(([key, value]) => (
                  <Option key={key} value={key}>
                    {value.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="量具类型"
              name="instrumentType"
              tooltip="填写量具类型，用于指导检验人员"
            >
              <Select placeholder="请选择量具类型" allowClear>
                {INSTRUMENT_OPTIONS.map(inst => (
                  <Option key={inst} value={inst}>
                    {inst}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="版本"
              name="version"
              rules={[{ required: true, message: '请输入版本号' }]}
            >
              <Input placeholder="请输入版本号，如V1.0" />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      {/* 标准值配置 */}
      <Card
        title="标准值配置"
        style={{ marginBottom: '16px' }}
        extra={<SafetyCertificateOutlined style={{ color: '#1677ff' }} />}
      >
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              label="标准值描述"
              name="standardValue"
              tooltip="描述标准值，如0.250±0.005、≤0.8、合格等"
            >
              <Input placeholder="请输入标准值描述" />
            </Form.Item>
          </Col>
        </Row>

        {/* 数值型标准值 */}
        {standardType === 'NUMERIC' && (
          <>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  label="下限值"
                  name="minValue"
                  tooltip="数值型最小值"
                >
                  <InputNumber placeholder="下限值" style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label="上限值"
                  name="maxValue"
                  tooltip="数值型最大值"
                >
                  <InputNumber placeholder="上限值" style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label="单位"
                  name="unit"
                  tooltip="数值型单位"
                >
                  <Input placeholder="单位，如mm、℃" />
                </Form.Item>
              </Col>
            </Row>
          </>
        )}

        {/* 枚举型标准值 */}
        {standardType === 'ENUM' && (
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                label="合格选项"
                name="enumOptions"
                tooltip="枚举型合格选项，每行一个"
              >
                <Select
                  mode="tags"
                  placeholder="请输入合格选项，每行一个"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>
        )}

        {/* 布尔型标准值 */}
        {standardType === 'BOOLEAN' && (
          <div style={{ padding: '16px', background: '#e6f7ff', borderRadius: '4px' }}>
            <Space>
              <SafetyCertificateOutlined style={{ color: '#1677ff' }} />
              <span>布尔型标准值：检验结果为是/否、通过/不通过</span>
            </Space>
          </div>
        )}

        {/* 文本型标准值 */}
        {standardType === 'TEXT' && (
          <div style={{ padding: '16px', background: '#fff7e6', borderRadius: '4px' }}>
            <Space>
              <ExperimentOutlined style={{ color: '#faad14' }} />
              <span>文本型标准值：检验结果由检验人员人工判断</span>
            </Space>
          </div>
        )}
      </Card>

      {/* 关键属性 */}
      <Card
        title="关键属性"
        style={{ marginBottom: '16px' }}
        extra={<ExperimentOutlined style={{ color: '#1677ff' }} />}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="关键项（Critical）"
              name="isCritical"
              valuePropName="checked"
              tooltip="关键项不合格会直接导致产品不合格"
            >
              <Switch />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="必检项"
              name="isRequired"
              valuePropName="checked"
              tooltip="每次检验必须检查的项目"
            >
              <Switch defaultChecked />
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation={"left" as any}>适用检验类型</Divider>
        <Form.Item
          name="applyTypes"
          tooltip="选择该质检项目适用的检验类型"
        >
          <Checkbox.Group style={{ width: '100%' }}>
            <Row gutter={[8, 8]}>
              {Object.entries(QC_APPLY_TYPE_MAP).map(([key, value]) => (
                <Col key={key} span={8}>
                  <Checkbox value={key}>
                    <Tag color={value.color}>{value.label}</Tag>
                  </Checkbox>
                </Col>
              ))}
            </Row>
          </Checkbox.Group>
        </Form.Item>
      </Card>

      {/* 引用标准和状态 */}
      <Card
        title="引用标准和状态"
        style={{ marginBottom: '16px' }}
        extra={<ApartmentOutlined style={{ color: '#1677ff' }} />}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="引用标准/规范"
              name="refStandard"
              tooltip="填写引用的标准编号，如YY 0462-2023"
            >
              <Input placeholder="请输入引用标准" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="状态"
              name="status"
              rules={[{ required: true, message: '请选择状态' }]}
            >
              <Select placeholder="请选择状态">
                {Object.entries(QC_ITEM_STATUS_MAP).map(([key, value]) => (
                  <Option key={key} value={key}>
                    <Space>
                      <Tag color={value.color}>{value.label}</Tag>
                    </Space>
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>
      </Card>

      {/* 备注信息 */}
      <Card
        title="备注信息"
        style={{ marginBottom: '16px' }}
        extra={<ClockCircleOutlined style={{ color: '#1677ff' }} />}
      >
        <Form.Item
          label="备注"
          name="remark"
          tooltip="可填写项目说明、检验要点等信息"
        >
          <TextArea
            rows={4}
            placeholder="请输入备注信息，如项目说明、检验要点等"
            maxLength={500}
            showCount
          />
        </Form.Item>
      </Card>

      {/* 系统信息（编辑模式显示） */}
      {mode === 'edit' && initialValues && (
        <Card
          title="系统信息"
          extra={<ClockCircleOutlined style={{ color: '#1677ff' }} />}
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

export default QcItemForm;

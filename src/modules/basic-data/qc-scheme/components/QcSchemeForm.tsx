/**
 * 质检方案表单组件
 * 支持质检方案基本信息、适用对象、抽样规则、检验项配置
 */

import React, { useEffect, useState } from 'react';
import { Form, Input, Select, InputNumber, DatePicker, Row, Col, Card, Divider, Button, message, Space, Modal, Table, Tag } from 'antd';
import { useQcSchemeStore } from '../store';
import { QC_SCHEME_STATUS_MAP, QC_SCHEME_TYPE_MAP, QC_SAMPLING_TYPE_MAP, QcSchemeType, QcSamplingType} from '../types';
import type { QcScheme, CreateQcSchemeDTO, QcSchemeItem } from '../types';
import { ExperimentOutlined, SafetyCertificateOutlined, ApartmentOutlined, PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

interface QcSchemeFormProps {
  mode?: 'create' | 'edit';
  initialValues?: QcScheme;
  onFinish: (values: any) => void;
  onCancel: () => void;
}

const QcSchemeForm: React.FC<QcSchemeFormProps> = ({
  mode = 'create',
  initialValues,
  onFinish,
  onCancel,
}) => {
  const [form] = Form.useForm();
  const [schemeType, setSchemeType] = useState<QcSchemeType>('IPQC_FIRST');
  const [samplingType, setSamplingType] = useState<QcSamplingType>('FULL');
  const [itemsModalOpen, setItemsModalOpen] = useState(false);
  const [currentItems, setCurrentItems] = useState<QcSchemeItem[]>([]);
  const [editingItem, setEditingItem] = useState<QcSchemeItem | null>(null);

  useEffect(() => {
    if (initialValues) {
      setSchemeType(initialValues.schemeType);
      setSamplingType(initialValues.samplingType);
      const formValues = {
        ...initialValues,
        effectiveDate: initialValues.effectiveDate ? dayjs(initialValues.effectiveDate) : undefined,
        expiryDate: initialValues.expiryDate ? dayjs(initialValues.expiryDate) : undefined,
        items: initialValues.items || [],
      };
      form.setFieldsValue(formValues);
      setCurrentItems(initialValues.items || []);
    } else {
      form.resetFields();
      // 设置默认值
      form.setFieldsValue({
        samplingType: 'FULL',
        status: 'DRAFT',
        version: 'V1.0',
        effectiveDate: dayjs(),
      });
      setSamplingType('FULL');
      setCurrentItems([]);
    }
  }, [initialValues]);

  const handleSchemeTypeChange = (value: QcSchemeType) => {
    setSchemeType(value);
    // 根据方案类型显示不同的适用对象字段
  };

  const handleSamplingTypeChange = (value: QcSamplingType) => {
    setSamplingType(value);
    // 清空不相关字段
    form.setFieldsValue({
      aqlLevel: undefined,
      sampleSize: undefined,
      samplePercent: undefined,
    });
  };

  const handleSubmit = async (values: any) => {
    try {
      const formData: CreateQcSchemeDTO = {
        schemeCode: values.schemeCode,
        schemeName: values.schemeName,
        schemeType: values.schemeType,
        productModel: values.productModel,
        materialCode: values.materialCode,
        operationCode: values.operationCode,
        operationSeq: values.operationSeq,
        samplingType: values.samplingType,
        aqlLevel: values.aqlLevel,
        sampleSize: values.sampleSize,
        samplePercent: values.samplePercent,
        items: currentItems,
        status: values.status,
        version: values.version,
        effectiveDate: values.effectiveDate ? values.effectiveDate.format('YYYY-MM-DD') : undefined,
        expiryDate: values.expiryDate ? values.expiryDate.format('YYYY-MM-DD') : undefined,
        remark: values.remark,
      };

      await onFinish(formData);
    } catch (error) {
      message.error(mode === 'create' ? '创建失败' : '更新失败');
    }
  };

  // 检验项管理
  const handleAddItem = () => {
    setEditingItem(null);
    setItemsModalOpen(true);
  };

  const handleEditItem = (item: QcSchemeItem) => {
    setEditingItem(item);
    setItemsModalOpen(true);
  };

  const handleDeleteItem = (seqNo: number) => {
    setCurrentItems(currentItems.filter(item => item.seqNo !== seqNo));
  };

  const handleSaveItem = (item: QcSchemeItem) => {
    if (editingItem) {
      // 编辑模式
      setCurrentItems(currentItems.map(i => i.seqNo === editingItem.seqNo ? item : i));
    } else {
      // 新增模式
      const newItem = {
        ...item,
        seqNo: currentItems.length > 0 ? Math.max(...currentItems.map(i => i.seqNo)) + 10 : 10,
      };
      setCurrentItems([...currentItems, newItem]);
    }
    setItemsModalOpen(false);
    setEditingItem(null);
  };

  // 检验项表格列
  const itemColumns = [
    {
      title: '序号',
      dataIndex: 'seqNo',
      width: 80,
      align: 'center' as const,
    },
    {
      title: '项目编码',
      dataIndex: 'itemCode',
      width: 150,
    },
    {
      title: '项目名称',
      dataIndex: 'itemName',
      width: 180,
    },
    {
      title: '标准值',
      dataIndex: 'standardValue',
      width: 150,
    },
    {
      title: '单位',
      dataIndex: 'unit',
      width: 80,
    },
    {
      title: '关键项',
      dataIndex: 'isCritical',
      width: 80,
      align: 'center' as const,
      render: (isCritical: boolean) => isCritical ? '是' : '否',
    },
    {
      title: '必检项',
      dataIndex: 'isRequired',
      width: 80,
      align: 'center' as const,
      render: (isRequired: boolean) => isRequired ? '是' : '否',
    },
    {
      title: '启用',
      dataIndex: 'enabled',
      width: 80,
      align: 'center' as const,
      render: (enabled: boolean) => enabled ? '是' : '否',
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      align: 'center' as const,
      render: (_: any, record: QcSchemeItem) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditItem(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteItem(record.seqNo)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        autoComplete="off"
      >
        {/* 基本信息 */}
        <Card
          title="质检方案基本信息"
          style={{ marginBottom: '16px' }}
          extra={<ExperimentOutlined style={{ color: '#1677ff' }} />}
        >
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="方案编码"
                name="schemeCode"
                rules={[
                  { required: true, message: '请输入方案编码' },
                  { pattern: /^SCH-[A-Z]{2,}-\d{3,}$/, message: '编码格式不正确，如SCH-IPQC-001' }
                ]}
              >
                <Input placeholder="请输入方案编码，如SCH-IPQC-001" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="方案名称"
                name="schemeName"
                rules={[{ required: true, message: '请输入方案名称' }]}
              >
                <Input placeholder="请输入方案名称" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="检验类型"
                name="schemeType"
                rules={[{ required: true, message: '请选择检验类型' }]}
              >
                <Select
                  placeholder="请选择检验类型"
                  onChange={handleSchemeTypeChange}
                >
                  {Object.entries(QC_SCHEME_TYPE_MAP).map(([key, value]) => (
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
                label="版本"
                name="version"
                rules={[{ required: true, message: '请输入版本号' }]}
              >
                <Input placeholder="请输入版本号，如V1.0" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="状态"
                name="status"
                rules={[{ required: true, message: '请选择状态' }]}
              >
                <Select placeholder="请选择状态">
                  {Object.entries(QC_SCHEME_STATUS_MAP).map(([key, value]) => (
                    <Option key={key} value={key}>
                      <Space>
                        <Tag color={value.color}>{value.label}</Tag>
                      </Space>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="生效日期"
                name="effectiveDate"
                rules={[{ required: true, message: '请选择生效日期' }]}
              >
                <DatePicker
                  style={{ width: '100%' }}
                  placeholder="请选择生效日期"
                  format="YYYY-MM-DD"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="失效日期"
                name="expiryDate"
              >
                <DatePicker
                  style={{ width: '100%' }}
                  placeholder="请选择失效日期（可选）"
                  format="YYYY-MM-DD"
                  disabledDate={(current) => {
                    const effectiveDate = form.getFieldValue('effectiveDate');
                    return effectiveDate && current && current < effectiveDate.endOf('day');
                  }}
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* 适用对象 */}
        <Card
          title="适用对象"
          style={{ marginBottom: '16px' }}
          extra={<ApartmentOutlined style={{ color: '#1677ff' }} />}
        >
          <Row gutter={16}>
            {/* 产品型号 - FQC/OQC */}
            {(schemeType === 'FQC' || schemeType === 'OQC') && (
              <Col span={12}>
                <Form.Item
                  label="适用产品型号"
                  name="productModel"
                  tooltip="适用于该产品型号的检验"
                >
                  <Input placeholder="请输入产品型号" />
                </Form.Item>
              </Col>
            )}

            {/* 物料编码 - IQC */}
            {schemeType === 'IQC' && (
              <Col span={12}>
                <Form.Item
                  label="适用物料编码"
                  name="materialCode"
                  tooltip="适用于该物料的来料检验"
                >
                  <Input placeholder="请输入物料编码" />
                </Form.Item>
              </Col>
            )}

            {/* 工序编码 - IPQC */}
            {(schemeType.includes('IPQC') || schemeType === 'STERILE') && (
              <>
                <Col span={12}>
                  <Form.Item
                    label="适用工序编码"
                    name="operationCode"
                    tooltip="适用于该工序的检验"
                  >
                    <Input placeholder="请输入工序编码" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="工序序号"
                    name="operationSeq"
                    tooltip="工序在工艺路径中的序号"
                  >
                    <InputNumber
                      placeholder="请输入工序序号"
                      style={{ width: '100%' }}
                      min={0}
                    />
                  </Form.Item>
                </Col>
              </>
            )}
          </Row>

          <div style={{ padding: '12px', background: '#f5f5f5', borderRadius: '4px' }}>
            <Space>
              <SafetyCertificateOutlined style={{ color: '#1677ff' }} />
              <span>
                {schemeType === 'IQC' && '适用于物料的来料检验'}
                {(schemeType.includes('IPQC') || schemeType === 'STERILE') && '适用于生产过程的检验'}
                {(schemeType === 'FQC' || schemeType === 'OQC') && '适用于成品检验'}
              </span>
            </Space>
          </div>
        </Card>

        {/* 抽样规则 */}
        <Card
          title="抽样规则"
          style={{ marginBottom: '16px' }}
          extra={<SafetyCertificateOutlined style={{ color: '#1677ff' }} />}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="抽样规则类型"
                name="samplingType"
                rules={[{ required: true, message: '请选择抽样规则' }]}
              >
                <Select
                  placeholder="请选择抽样规则"
                  onChange={handleSamplingTypeChange}
                >
                  {Object.entries(QC_SAMPLING_TYPE_MAP).map(([key, value]) => (
                    <Option key={key} value={key}>
                      {value.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          {/* 全检 */}
          {samplingType === 'FULL' && (
            <div style={{ padding: '16px', background: '#e6f7ff', borderRadius: '4px' }}>
              <Space>
                <SafetyCertificateOutlined style={{ color: '#1677ff' }} />
                <span>全检：每件产品都进行检验</span>
              </Space>
            </div>
          )}

          {/* AQL抽样 */}
          {samplingType === 'AQL' && (
            <>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="AQL水平"
                    name="aqlLevel"
                    rules={[{ required: true, message: '请输入AQL水平' }]}
                  >
                    <Input placeholder="请输入AQL水平，如1.0、0.65" />
                  </Form.Item>
                </Col>
              </Row>
              <div style={{ padding: '12px', background: '#f6ffed', borderRadius: '4px' }}>
                <Space>
                  <SafetyCertificateOutlined style={{ color: '#52c41a' }} />
                  <span>AQL抽样：按照AQL标准进行抽样检验</span>
                </Space>
              </div>
            </>
          )}

          {/* 固定数量 */}
          {samplingType === 'FIXED' && (
            <>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="固定样本量"
                    name="sampleSize"
                    rules={[{ required: true, message: '请输入样本量' }]}
                  >
                    <InputNumber
                      placeholder="请输入样本量"
                      style={{ width: '100%' }}
                      min={1}
                    />
                  </Form.Item>
                </Col>
              </Row>
              <div style={{ padding: '12px', background: '#fff7e6', borderRadius: '4px' }}>
                <Space>
                  <SafetyCertificateOutlined style={{ color: '#faad14' }} />
                  <span>固定数量：每次检验固定数量的样本</span>
                </Space>
              </div>
            </>
          )}

          {/* 百分比 */}
          {samplingType === 'PERCENT' && (
            <>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="抽样百分比"
                    name="samplePercent"
                    rules={[
                      { required: true, message: '请输入抽样百分比' },
                      { type: 'number', min: 1, max: 100, message: '百分比为1-100' }
                    ]}
                  >
                    <InputNumber
                      placeholder="请输入抽样百分比"
                      style={{ width: '100%' }}
                      min={1}
                      max={100}
                      addonAfter="%"
                    />
                  </Form.Item>
                </Col>
              </Row>
              <div style={{ padding: '12px', background: '#fff1f0', borderRadius: '4px' }}>
                <Space>
                  <SafetyCertificateOutlined style={{ color: '#f5222d' }} />
                  <span>百分比：按照百分比进行抽样检验</span>
                </Space>
              </div>
            </>
          )}
        </Card>

        {/* 检验项配置 */}
        <Card
          title="检验项配置"
          style={{ marginBottom: '16px' }}
          extra={
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddItem}
            >
              添加检验项
            </Button>
          }
        >
          {currentItems.length > 0 ? (
            <Table
              size="small"
              dataSource={currentItems}
              columns={itemColumns}
              rowKey="seqNo"
              pagination={false}
              bordered
            />
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: '#8c8c8c' }}>
              <SafetyCertificateOutlined style={{ fontSize: 48, marginBottom: '16px' }} />
              <div>暂无检验项</div>
              <div style={{ fontSize: '12px', marginTop: '8px' }}>
                点击上方按钮添加检验项
              </div>
            </div>
          )}
        </Card>

        {/* 备注信息 */}
        <Card
          title="备注信息"
          style={{ marginBottom: '16px' }}
          extra={<ApartmentOutlined style={{ color: '#1677ff' }} />}
        >
          <Form.Item
            label="备注"
            name="remark"
            tooltip="可填写方案说明、适用条件等"
          >
            <TextArea
              rows={3}
              placeholder="请输入备注信息，如方案说明、适用条件等"
              maxLength={500}
              showCount
            />
          </Form.Item>
        </Card>

        {/* 系统信息（编辑模式显示） */}
        {mode === 'edit' && initialValues && (
          <Card
            title="系统信息"
            extra={<ApartmentOutlined style={{ color: '#1677ff' }} />}
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

      {/* 检验项编辑弹窗 */}
      <Modal
        title={editingItem ? '编辑检验项' : '添加检验项'}
        open={itemsModalOpen}
        onCancel={() => {
          setItemsModalOpen(false);
          setEditingItem(null);
        }}
        footer={null}
        width={800}
      >
        <SchemeItemForm
          initialValues={editingItem ?? undefined}
          onSave={handleSaveItem}
          onCancel={() => {
            setItemsModalOpen(false);
            setEditingItem(null);
          }}
        />
      </Modal>
    </>
  );
};

// 检验项子表单组件
interface SchemeItemFormProps {
  initialValues?: QcSchemeItem;
  onSave: (item: QcSchemeItem) => void;
  onCancel: () => void;
}

const SchemeItemForm: React.FC<SchemeItemFormProps> = ({
  initialValues,
  onSave,
  onCancel,
}) => {
  const [itemForm] = Form.useForm();

  useEffect(() => {
    if (initialValues) {
      itemForm.setFieldsValue(initialValues);
    } else {
      itemForm.resetFields();
      itemForm.setFieldsValue({
        isCritical: false,
        isRequired: true,
        enabled: true,
      });
    }
  }, [initialValues]);

  return (
    <Form
      form={itemForm}
      layout="vertical"
      onFinish={(values) => onSave(values)}
    >
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            label="项目编码"
            name="itemCode"
            rules={[{ required: true, message: '请输入项目编码' }]}
          >
            <Input placeholder="请输入项目编码，如QCI-SZ-001" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label="项目名称"
            name="itemName"
            rules={[{ required: true, message: '请输入项目名称' }]}
          >
            <Input placeholder="请输入项目名称，如外径D1" />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            label="标准值描述"
            name="standardValue"
          >
            <Input placeholder="请输入标准值描述" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label="单位"
            name="unit"
          >
            <Input placeholder="请输入单位，如mm、℃" />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={8}>
          <Form.Item label="关键项" name="isCritical" valuePropName="checked">
            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
              关键项不合格会直接导致产品不合格
            </div>
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item label="必检项" name="isRequired" valuePropName="checked">
            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
              每次检验必须检查的项目
            </div>
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item label="启用" name="enabled" valuePropName="checked">
            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
              是否在当前方案中启用
            </div>
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
              placeholder="请输入检验项备注"
              maxLength={200}
              showCount
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12} style={{ textAlign: 'right' }}>
          <Button onClick={onCancel}>
            取消
          </Button>
        </Col>
        <Col span={12} style={{ textAlign: 'left' }}>
          <Button type="primary" htmlType="submit">
            保存
          </Button>
        </Col>
      </Row>
    </Form>
  );
};

export default QcSchemeForm;

/**
 * 工序主数据表单组件
 * 支持工序基本信息和阶段配置的编辑
 */

import React, { useEffect, useState } from 'react';
import { Form, Input, Select, InputNumber, Row, Col, Switch, message, Card, Table, Space, Button, Modal } from 'antd';
import { useOperationStore } from '../store';
import { OP_CATEGORY_MAP, OP_STATUS_MAP, PHASE_TYPE_MAP, FIELD_DATA_TYPE_MAP, FIELD_INPUT_TYPE_MAP } from '../types';
import type { Operation, OperationPhase, PhaseField } from '../types';
import { PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';

const { Option } = Select;
const { TextArea } = Input;

interface OperationFormProps {
  mode?: 'create' | 'edit';
  initialValues?: Operation;
  onFinish: (values: any) => void;
  onCancel: () => void;
}

const OperationForm: React.FC<OperationFormProps> = ({
  mode = 'create',
  initialValues,
  onFinish,
  onCancel,
}) => {
  const [form] = Form.useForm();
  const [phases, setPhases] = useState<OperationPhase[]>([]);
  const [phaseModalVisible, setPhaseModalVisible] = useState(false);
  const [editingPhase, setEditingPhase] = useState<OperationPhase | null>(null);
  const [phaseForm] = Form.useForm();

  const { workshops, workCenters } = useOperationStore();

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue(initialValues);
      if (initialValues.phases && initialValues.phases.length > 0) {
        setPhases(initialValues.phases);
      }
    } else {
      form.resetFields();
      // 设置默认值
      form.setFieldsValue({
        category: 'PROD',
        stdTimeMin: 10,
        prepTimeMin: 5,
        hasFirstPiece: true,
        hasLastPiece: false,
        hasPatrol: false,
        hasCleanup: false,
        isBottleneck: false,
        isReportPoint: false,
        isQcPoint: false,
        status: 'DRAFT',
      });
    }
  }, [initialValues]);

  // 阶段表格列定义
  const phaseColumns = [
    {
      title: '序号',
      dataIndex: 'seq',
      key: 'seq',
      width: 60,
      align: 'center' as const,
    },
    {
      title: '阶段代码',
      dataIndex: 'phaseCode',
      key: 'phaseCode',
      width: 120,
    },
    {
      title: '阶段名称',
      dataIndex: 'phaseName',
      key: 'phaseName',
      width: 150,
    },
    {
      title: '阶段类型',
      dataIndex: 'phaseType',
      key: 'phaseType',
      width: 100,
      render: (type: string) => {
        const typeConfig = PHASE_TYPE_MAP[type as keyof typeof PHASE_TYPE_MAP];
        return typeConfig ? <span style={{ color: typeConfig.color }}>{typeConfig.label}</span> : type;
      },
    },
    {
      title: '字段数',
      dataIndex: 'fields',
      key: 'fields',
      width: 80,
      align: 'center' as const,
      render: (fields: PhaseField[]) => fields.length,
    },
    {
      title: '必须',
      dataIndex: 'required',
      key: 'required',
      width: 60,
      align: 'center' as const,
      render: (required: boolean) => required ? '是' : '否',
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: unknown, record: OperationPhase, index: number) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditPhase(index)}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeletePhase(index)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  const handleSubmit = async (values: any) => {
    try {
      const formData = {
        ...values,
        phases: phases,
      };

      await onFinish(formData);
    } catch (error) {
      message.error(mode === 'create' ? '创建失败' : '更新失败');
    }
  };

  // 阶段编辑相关
  const handleAddPhase = () => {
    const newPhase: OperationPhase = {
      seq: phases.length + 1,
      phaseCode: `PHASE-${phases.length + 1}`,
      phaseName: `阶段 ${phases.length + 1}`,
      phaseType: 'EXEC',
      required: true,
      eSign: false,
      dualReview: false,
      fields: [],
      photoReq: 'OPTIONAL',
      scanReq: 'NONE',
    };
    setEditingPhase(newPhase);
    setPhaseModalVisible(true);
  };

  const handleEditPhase = (index: number) => {
    setEditingPhase({ ...phases[index] });
    setPhaseModalVisible(true);
  };

  const handleDeletePhase = (index: number) => {
    const newPhases = [...phases];
    newPhases.splice(index, 1);
    // 重新编号
    newPhases.forEach((phase, idx) => {
      phase.seq = (idx + 1) * 10;
    });
    setPhases(newPhases);
    message.success('阶段删除成功');
  };

  const handleSavePhase = () => {
    try {
      const phaseValues = phaseForm.getFieldsValue();

      if (!phaseValues.phaseCode || !phaseValues.phaseName) {
        message.error('请填写阶段代码和名称');
        return;
      }

      const phaseData: OperationPhase = {
        seq: phaseValues.seq,
        phaseCode: phaseValues.phaseCode,
        phaseName: phaseValues.phaseName,
        phaseType: phaseValues.phaseType || 'EXEC',
        required: phaseValues.required || false,
        eSign: phaseValues.eSign || false,
        dualReview: phaseValues.dualReview || false,
        fields: phaseValues.fields || [],
        photoReq: phaseValues.photoReq || 'NONE',
        scanReq: phaseValues.scanReq || 'NONE',
        timeoutMin: phaseValues.timeoutMin,
        remark: phaseValues.remark,
      };

      if (editingPhase && editingPhase.phaseCode) {
        // 编辑现有阶段
        const index = phases.findIndex(p => p.seq === editingPhase.seq);
        if (index !== -1) {
          const newPhases = [...phases];
          newPhases[index] = phaseData;
          setPhases(newPhases);
        }
      } else {
        // 添加新阶段
        setPhases([...phases, phaseData]);
      }

      setPhaseModalVisible(false);
      setEditingPhase(null);
      phaseForm.resetFields();
      message.success('阶段保存成功');
    } catch (error) {
      message.error('阶段保存失败');
    }
  };

  const handleCancelEditPhase = () => {
    setPhaseModalVisible(false);
    setEditingPhase(null);
    phaseForm.resetFields();
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
        <h3>工序基本信息</h3>
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item
              label="工序编码"
              name="opCode"
              rules={[{ required: true, message: '请输入工序编码' }]}
            >
              <Input placeholder="请输入工序编码" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label="工序名称"
              name="opName"
              rules={[{ required: true, message: '请输入工序名称' }]}
            >
              <Input placeholder="请输入工序名称" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label="简称"
              name="opShort"
              rules={[{ required: true, message: '请输入工序简称' }]}
            >
              <Input placeholder="请输入工序简称（用于PAD显示）" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              label="工序类别"
              name="category"
              rules={[{ required: true, message: '请选择工序类别' }]}
            >
              <Select placeholder="请选择工序类别">
                {Object.entries(OP_CATEGORY_MAP).map(([key, value]) => (
                  <Option key={key} value={key}>
                    {value.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={6}>
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
          <Col span={6}>
            <Form.Item
              label="生产线"
              name="productLine"
              rules={[{ required: true, message: '请输入生产线' }]}
            >
              <Input placeholder="请输入生产线" />
            </Form.Item>
          </Col>
          <Col span={6}>
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
          <Col span={6}>
            <Form.Item
              label="设备类型"
              name="equipType"
              rules={[{ required: true, message: '请输入设备类型' }]}
            >
              <Input placeholder="请输入设备类型" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={4}>
            <Form.Item
              label="标准工时"
              name="stdTimeMin"
              rules={[{ required: true, message: '请输入标准工时' }]}
            >
              <InputNumber min={1} placeholder="分钟/件" style={{ width: '100%' }} addonAfter="分/件" />
            </Form.Item>
          </Col>
          <Col span={4}>
            <Form.Item
              label="准备工时"
              name="prepTimeMin"
              rules={[{ required: true, message: '请输入准备工时' }]}
            >
              <InputNumber min={0} placeholder="分钟/批" style={{ width: '100%' }} addonAfter="分/批" />
            </Form.Item>
          </Col>
          <Col span={4}>
            <Form.Item
              label="版本号"
              name="version"
              rules={[{ required: true, message: '请输入版本号' }]}
            >
              <Input placeholder="请输入版本号，如：V1.0" />
            </Form.Item>
          </Col>
          <Col span={4}>
            <Form.Item
              label="生效日期"
              name="effectDate"
              rules={[{ required: true, message: '请选择生效日期' }]}
            >
              <Input type="date" style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={3}>
            <Form.Item
              label="首件检验"
              name="hasFirstPiece"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Col>
          <Col span={3}>
            <Form.Item
              label="末件检验"
              name="hasLastPiece"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Col>
          <Col span={3}>
            <Form.Item
              label="巡检"
              name="hasPatrol"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Col>
          <Col span={3}>
            <Form.Item
              label="清场"
              name="hasCleanup"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Col>
          <Col span={3}>
            <Form.Item
              label="巡检频次"
              name="patrolFreq"
            >
              <InputNumber min={1} placeholder="每N件" style={{ width: '100%' }} addonAfter="件" />
            </Form.Item>
          </Col>
          <Col span={3}>
            <Form.Item
              label="瓶颈工序"
              name="isBottleneck"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Col>
          <Col span={3}>
            <Form.Item
              label="报告点"
              name="isReportPoint"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Col>
          <Col span={3}>
            <Form.Item
              label="检验点"
              name="isQcPoint"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Col>
        </Row>
      </div>

      {/* 工艺要求 */}
      <div style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #f0f0f0' }}>
        <h3>工艺要求</h3>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="环境要求"
              name="envReq"
            >
              <TextArea
                rows={2}
                placeholder="请输入环境要求，如温度、湿度、防尘要求等"
                maxLength={200}
                showCount
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="参数模板"
              name="paramTemplate"
            >
              <Input placeholder="请输入参数模板代码" />
            </Form.Item>
          </Col>
        </Row>
      </div>

      {/* 工序阶段配置 */}
      <div>
        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>工序阶段配置</h3>
          <Button
            type="primary"
            size="small"
            icon={<PlusOutlined />}
            onClick={handleAddPhase}
          >
            添加阶段
          </Button>
        </div>

        <Card size="small">
          <Table
            dataSource={phases}
            columns={phaseColumns}
            rowKey="seq"
            pagination={false}
            size="small"
            bordered
            scroll={{ x: 600 }}
          />
        </Card>
      </div>

      {/* 备注 */}
      <div style={{ marginTop: '24px' }}>
        <h3>备注信息</h3>
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

      {/* 阶段编辑弹窗 */}
      <Modal
        title={editingPhase && editingPhase.phaseCode ? '编辑阶段' : '添加阶段'}
        open={phaseModalVisible}
        onCancel={handleCancelEditPhase}
        onOk={handleSavePhase}
        width={800}
      >
        <Form form={phaseForm} layout="vertical">
          <Form.Item name="seq" label="序号" initialValue={phases.length + 1} hidden>
            <InputNumber />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="phaseCode"
                label="阶段代码"
                rules={[{ required: true }]}
              >
                <Input placeholder="请输入阶段代码" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="phaseName"
                label="阶段名称"
                rules={[{ required: true }]}
              >
                <Input placeholder="请输入阶段名称" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="phaseType"
                label="阶段类型"
                rules={[{ required: true }]}
              >
                <Select placeholder="请选择阶段类型">
                  {Object.entries(PHASE_TYPE_MAP).map(([key, value]) => (
                    <Option key={key} value={key}>
                      {value.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="timeoutMin"
                label="超时时间(分钟)"
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="required" label="必须阶段" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="eSign" label="电子签名" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="dualReview" label="双人复核" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="remark" label="阶段备注">
                <Input placeholder="阶段备注" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </Form>
  );
};

export default OperationForm;
/**
 * UDI 设置页面
 * ================================================================
 * 功能1：PI规则配置（全局）
 *   - 包含项目：批号 / 生产日期 / 有效期 / 数量
 *   - 有效期月数
 *   - 输出格式（GS1二维码 / DM矩阵）
 *
 * 功能2：物料 DI 配置
 *   - 为每个成品物料配置 GTIN（14位）+ DI编码 + 签发机构
 *   - 关联注册证号
 * ================================================================
 */
import React, { useState, useEffect } from 'react';
import {
  Card, Form, Switch, InputNumber, Select, Button, Table, Modal,
  Input, message, Tabs, Tag, Tooltip, Space, Alert, Divider, Typography,
} from 'antd';
import {
  SaveOutlined, PlusOutlined, EditOutlined, DeleteOutlined,
  QrcodeOutlined, InfoCircleOutlined, ReloadOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import {
  loadPiRule, savePiRule,
  loadDiMap, saveDiMap, DEFAULT_PI_RULE,
  buildUdiString, toGs1Date,
} from './udiUtils';
import type { UdiPiRule, MaterialDiRecord } from '../../api/udi';
import {
  getUdiPiRule, saveUdiPiRule as saveUdiPiRuleApi,
  getMaterialDiList, createMaterialDi, updateMaterialDi, deleteMaterialDi,
} from '../../api/udi';
import { getMaterialList } from '../../api/materials';

const { Text, Title } = Typography;

const ISSUERS = ['GS1', 'HIBC', 'ICCBBA', '国家药监局'];

// ── PI规则面板 ────────────────────────────────────────────────────
const PiRulePanel: React.FC = () => {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [previewUdi, setPreviewUdi] = useState('');

  useEffect(() => {
    // 先从 API 加载，失败则从 localStorage
    getUdiPiRule().then((resp: any) => {
      const rule: UdiPiRule = resp?.data ?? loadPiRule();
      form.setFieldsValue(rule);
      updatePreview(rule);
    }).catch(() => {
      const rule = loadPiRule();
      form.setFieldsValue(rule);
      updatePreview(rule);
    });
  }, [form]);

  const updatePreview = (rule: UdiPiRule) => {
    const today = new Date();
    const exp = new Date(today);
    exp.setMonth(exp.getMonth() + (rule.expiryMonths ?? 24));
    const parts: string[] = ['(01)06901234567890'];
    if (rule.includeBatchNo)        parts.push('(10)YS-RKQ-20260601-001');
    if (rule.includeProductionDate) parts.push(`(11)${toGs1Date(today)}`);
    if (rule.includeExpiryDate)     parts.push(`(17)${toGs1Date(exp)}`);
    if (rule.includeQty)            parts.push('(30)5000');
    setPreviewUdi(parts.join(''));
  };

  const handleSave = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      await saveUdiPiRuleApi(values as UdiPiRule);
    } catch { /* fallback */ }
    savePiRule(values as UdiPiRule);
    updatePreview(values as UdiPiRule);
    message.success('PI规则已保存');
    setSaving(false);
  };

  return (
    <Card
      title={<span><QrcodeOutlined style={{ marginRight: 8, color: '#1677ff' }} />PI（生产标识）规则配置</span>}
      extra={<Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSave}>保存规则</Button>}
      style={{ marginBottom: 16 }}
    >
      <Alert
        type="info" showIcon
        message="PI规则说明"
        description="PI（生产标识）是 UDI 的动态部分，包含批号、生产日期、有效期、数量等。根据 GB/T 42062-2022 标准，医疗器械 UDI 中 PI 为必须项。"
        style={{ marginBottom: 20 }}
      />
      <Form form={form} layout="vertical" initialValues={DEFAULT_PI_RULE}
        onValuesChange={(_, all) => updatePreview(all as UdiPiRule)}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 32px' }}>
          <div>
            <Title level={5} style={{ color: '#1677ff', marginBottom: 16 }}>PI 包含字段</Title>
            <Form.Item name="includeBatchNo" label="批号 (AI 10)" valuePropName="checked">
              <Switch checkedChildren="包含" unCheckedChildren="不含" />
            </Form.Item>
            <Form.Item name="includeProductionDate" label="生产日期 (AI 11)" valuePropName="checked">
              <Switch checkedChildren="包含" unCheckedChildren="不含" />
            </Form.Item>
            <Form.Item name="includeExpiryDate" label="有效期 (AI 17)" valuePropName="checked">
              <Switch checkedChildren="包含" unCheckedChildren="不含" />
            </Form.Item>
            <Form.Item name="includeQty" label="数量 (AI 30)" valuePropName="checked">
              <Switch checkedChildren="包含" unCheckedChildren="不含" />
            </Form.Item>
          </div>
          <div>
            <Title level={5} style={{ color: '#1677ff', marginBottom: 16 }}>有效期 & 格式</Title>
            <Form.Item name="expiryMonths" label="有效期（月数）" rules={[{ required: true }]}>
              <InputNumber min={1} max={120} style={{ width: '100%' }} addonAfter="个月" />
            </Form.Item>
            <Form.Item name="serialLevel" label="序列化级别">
              <Select>
                <Select.Option value="batch">批次级（每批一个UDI）</Select.Option>
                <Select.Option value="unit">单件级（每件一个UDI）</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item name="qrFormat" label="输出格式">
              <Select>
                <Select.Option value="GS1">GS1 二维码（DataMatrix/QR）</Select.Option>
                <Select.Option value="DM">DM 矩阵码</Select.Option>
              </Select>
            </Form.Item>
          </div>
        </div>

        <Divider />
        <div style={{ background: '#f0f7ff', border: '1px solid #bae0ff', borderRadius: 8, padding: '14px 18px' }}>
          <div style={{ fontSize: 12, color: '#667085', marginBottom: 6 }}>
            <InfoCircleOutlined style={{ marginRight: 6 }} />预览 UDI 字符串（示例物料 GTIN）
          </div>
          <Text code copyable style={{ fontSize: 13, wordBreak: 'break-all' }}>
            {previewUdi || '请配置规则后预览'}
          </Text>
        </div>
      </Form>
    </Card>
  );
};

// ── DI配置面板（物料 GTIN 管理） ──────────────────────────────────
const DiConfigPanel: React.FC = () => {
  const [list, setList]         = useState<MaterialDiRecord[]>([]);
  const [loading, setLoading]   = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editRec, setEditRec]   = useState<MaterialDiRecord | null>(null);
  const [form] = Form.useForm();
  const [matOptions, setMatOptions] = useState<{ value: number; label: string; code: string }[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const [diResp, matResp] = await Promise.allSettled([
        getMaterialDiList(),
        getMaterialList({ status: 1 }),
      ]);
      // DI list
      const diData: MaterialDiRecord[] = (diResp.status === 'fulfilled' ? diResp.value?.data : null) ?? [];
      if (diData.length > 0) {
        setList(diData);
      } else {
        // fallback: localStorage
        const map = loadDiMap();
        setList(Object.values(map));
      }
      // material options
      const mats: any[] = (matResp.status === 'fulfilled' ? matResp.value?.data : null) ?? [];
      setMatOptions(mats.map(m => ({ value: m.id, label: `${m.code} ${m.name}`, code: m.code })));
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditRec(null); form.resetFields(); setModalOpen(true); };
  const openEdit = (r: MaterialDiRecord) => {
    setEditRec(r);
    form.setFieldsValue(r);
    setModalOpen(true);
  };

  const handleSave = async () => {
    const vals = await form.validateFields() as MaterialDiRecord;
    const matOpt = matOptions.find(m => m.value === vals.materialId);
    const record: MaterialDiRecord = {
      ...vals,
      materialCode: matOpt?.code ?? vals.materialCode,
      materialName: matOpt?.label.replace(matOpt.code + ' ', '') ?? vals.materialName,
    };
    try {
      if (editRec?.id) {
        await updateMaterialDi(editRec.id, record);
      } else {
        await createMaterialDi(record);
      }
    } catch { /* API not ready: persist to localStorage */ }
    // Update localStorage map
    const map = loadDiMap();
    map[record.materialId] = { ...record, id: editRec?.id ?? Date.now() };
    saveDiMap(map);
    message.success(editRec ? 'DI配置已更新' : 'DI配置已新增');
    setModalOpen(false);
    load();
  };

  const handleDelete = async (r: MaterialDiRecord) => {
    try { if (r.id) await deleteMaterialDi(r.id); } catch { /* ignore */ }
    const map = loadDiMap();
    delete map[r.materialId];
    saveDiMap(map);
    setList(prev => prev.filter(x => x.materialId !== r.materialId));
    message.success('已删除');
  };

  const columns: ColumnsType<MaterialDiRecord> = [
    { title: '物料编码', dataIndex: 'materialCode', width: 120 },
    { title: '物料名称', dataIndex: 'materialName', width: 160 },
    {
      title: 'GTIN (14位)',
      dataIndex: 'gtin',
      width: 160,
      render: v => <Text code style={{ fontSize: 12 }}>{v}</Text>,
    },
    {
      title: 'DI 编码',
      dataIndex: 'diCode',
      width: 160,
      render: v => <Text code style={{ fontSize: 12 }}>{v}</Text>,
    },
    {
      title: '签发机构',
      dataIndex: 'issuer',
      width: 90,
      render: v => <Tag color="blue">{v}</Tag>,
    },
    { title: '注册证号', dataIndex: 'registrationNo', width: 160 },
    {
      title: '操作',
      width: 120,
      render: (_, r) => (
        <Space>
          <Button size="small" type="link" icon={<EditOutlined />} onClick={() => openEdit(r)}>编辑</Button>
          <Button size="small" type="link" danger icon={<DeleteOutlined />} onClick={() => handleDelete(r)}>删除</Button>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title={<span><QrcodeOutlined style={{ marginRight: 8, color: '#52c41a' }} />物料 DI（设备标识）配置</span>}
      extra={
        <Space>
          <Button icon={<ReloadOutlined />} onClick={load}>刷新</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>新增 DI 配置</Button>
        </Space>
      }
    >
      <Alert
        type="info" showIcon
        message="DI配置说明"
        description="DI（器械标识）是 UDI 的静态部分，唯一标识具体型号的医疗器械。GTIN 为 GS1 签发的全球贸易项目代码（14位），是 GS1 UDI 的核心。"
        style={{ marginBottom: 16 }}
      />
      <Table
        dataSource={list}
        columns={columns}
        rowKey={r => String(r.materialId)}
        loading={loading}
        size="small"
        pagination={{ pageSize: 10, showTotal: t => `共 ${t} 条` }}
        scroll={{ x: 900 }}
      />

      <Modal
        open={modalOpen}
        title={editRec ? '编辑 DI 配置' : '新增 DI 配置'}
        onCancel={() => setModalOpen(false)}
        onOk={handleSave}
        okText="保存"
        cancelText="取消"
        width={560}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 8 }}>
          <Form.Item name="materialId" label="关联物料" rules={[{ required: true, message: '请选择物料' }]}>
            <Select
              showSearch
              placeholder="搜索物料编码或名称"
              optionFilterProp="label"
              options={matOptions.map(m => ({ value: m.value, label: m.label }))}
            />
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Form.Item
              name="gtin"
              label={<span>GTIN（14位）<Tooltip title="GS1签发的全球贸易项目代码，14位数字"><InfoCircleOutlined style={{ marginLeft: 4, color: '#1677ff' }} /></Tooltip></span>}
              rules={[{ required: true, message: '请输入GTIN' }, { pattern: /^\d{14}$/, message: '必须为14位数字' }]}
            >
              <Input placeholder="如 06901234567890" maxLength={14} />
            </Form.Item>
            <Form.Item
              name="diCode"
              label="DI 编码"
              rules={[{ required: true, message: '请输入DI编码' }]}
            >
              <Input placeholder="通常与GTIN相同" />
            </Form.Item>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Form.Item name="issuer" label="签发机构" rules={[{ required: true }]}>
              <Select options={ISSUERS.map(i => ({ value: i, label: i }))} />
            </Form.Item>
            <Form.Item name="registrationNo" label="注册证号">
              <Input placeholder="如 国械注准20XXXXXXX" />
            </Form.Item>
          </div>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

// ── 主页面 ────────────────────────────────────────────────────────
const UdiSettingsPage: React.FC = () => (
  <div style={{ padding: '16px 20px', background: '#f5f7fa', minHeight: '100%' }}>
    <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
      <QrcodeOutlined style={{ fontSize: 22, color: '#1677ff' }} />
      <span style={{ fontSize: 18, fontWeight: 700, color: '#1d2939' }}>UDI 基础设置</span>
      <Tag color="blue">GB/T 42062-2022</Tag>
    </div>
    <Tabs
      defaultActiveKey="pi"
      items={[
        { key: 'pi', label: '📋 PI规则配置', children: <PiRulePanel /> },
        { key: 'di', label: '🏷️ 物料DI配置', children: <DiConfigPanel /> },
      ]}
    />
  </div>
);

export default UdiSettingsPage;

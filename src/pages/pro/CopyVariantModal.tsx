import React, { useState } from 'react';
import {
  Modal, Form, Input, Select, Switch, Descriptions, Tag, Alert, Radio, Space,
} from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { RoutingMaster, VariantType, BindMode, RM_STATUS_MAP } from './seriesData';

interface Props {
  open: boolean;
  routing: RoutingMaster | null;
  onCancel: () => void;
  onConfirm: (values: {
    newRoutingCode: string;
    version: string;
    routingName: string;
    variantType: VariantType;
    bindMode: BindMode;
    bindMaterialCodes: string[];
    specRangeExpr: string;
    inheritSync: boolean;
    variantReason: string;
  }) => void;
}

const VARIANT_TYPE_OPTIONS: { value: VariantType; label: string; desc: string }[] = [
  { value: 'SPEC',     label: '规格变体',  desc: '特定规格跳工序或改参数' },
  { value: 'CUSTOMER', label: '客户定制',  desc: '特定客户要求，额外工序或检验' },
  { value: 'EQUIP',    label: '设备适配',  desc: '特定设备产线，工序参数不同' },
  { value: 'OTHER',    label: '其他',      desc: '其他变体场景' },
];

const CopyVariantModal: React.FC<Props> = ({ open, routing, onCancel, onConfirm }) => {
  const [form] = Form.useForm();
  const [bindMode, setBindMode] = useState<BindMode>('MATERIAL');
  const [materialInput, setMaterialInput] = useState('');
  const [materialList, setMaterialList] = useState<string[]>([]);

  React.useEffect(() => {
    if (open && routing) {
      const suffix = '-C01';
      form.setFieldsValue({
        newRoutingCode: routing.routingCode + suffix,
        version: routing.version,
        routingName: routing.routingName + '-变体版',
        variantType: 'SPEC',
        inheritSync: false,
        specRangeExpr: routing.specRangeExpr || '',
      });
      setBindMode('MATERIAL');
      setMaterialList([]);
      setMaterialInput('');
    }
  }, [open, routing, form]);

  const addMaterial = () => {
    const code = materialInput.trim();
    if (!code) return;
    if (materialList.includes(code)) return;
    setMaterialList(prev => [...prev, code]);
    setMaterialInput('');
  };

  const removeMaterial = (code: string) => {
    setMaterialList(prev => prev.filter(c => c !== code));
  };

  const handleOk = () => {
    form.validateFields().then(values => {
      if (bindMode === 'MATERIAL' && materialList.length === 0) {
        form.setFields([{ name: '__material', errors: ['请至少添加一个物料编码'] }]);
        return;
      }
      onConfirm({
        newRoutingCode: values.newRoutingCode,
        version: values.version,
        routingName: values.routingName,
        variantType: values.variantType,
        bindMode,
        bindMaterialCodes: bindMode === 'MATERIAL' ? materialList : [],
        specRangeExpr: bindMode === 'RANGE' ? (values.specRangeExpr || '') : (routing?.specRangeExpr || ''),
        inheritSync: values.inheritSync,
        variantReason: values.variantReason || '',
      });
      form.resetFields();
    }).catch((err: any) => { if (err?.errorFields) return; });
  };

  if (!routing) return null;
  const st = RM_STATUS_MAP[routing.status];

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 3, height: 16, background: '#FA8C16', borderRadius: 2, display: 'inline-block' }} />
          复制新建工艺路径（变体）
        </div>
      }
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      okText="保存草稿"
      cancelText="取消"
      okButtonProps={{ style: { background: '#C8000A', borderColor: '#C8000A' } }}
      width={600}
      maskClosable={false}
    >
      {/* 源路径信息 */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: '#888', fontWeight: 500, marginBottom: 8, paddingBottom: 6, borderBottom: '1px solid #f0f0f0' }}>
          源路径信息
        </div>
        <Descriptions size="small" column={2}>
          <Descriptions.Item label="源编码">
            <span style={{ fontFamily: 'monospace', color: '#C8000A', fontWeight: 600 }}>{routing.routingCode}</span>
          </Descriptions.Item>
          <Descriptions.Item label="源版本">
            <strong>{routing.version}</strong>
            <Tag color={routing.status === 'ENABLED' ? 'green' : 'orange'} style={{ marginLeft: 6, fontSize: 10 }}>
              {st.label}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="源名称" span={2}>{routing.routingName}</Descriptions.Item>
          <Descriptions.Item label="源系列">
            <span style={{ fontFamily: 'monospace', color: '#722ED1' }}>{routing.seriesCode}</span>
          </Descriptions.Item>
          <Descriptions.Item label="工序数量">{routing.opCount} 道</Descriptions.Item>
        </Descriptions>
      </div>

      {/* 变体配置 */}
      <div style={{ fontSize: 12, color: '#888', fontWeight: 500, marginBottom: 12, paddingBottom: 6, borderBottom: '1px solid #f0f0f0' }}>
        变体配置
      </div>

      <Form form={form} layout="vertical" size="small">
        <Form.Item
          name="newRoutingCode"
          label="新工艺路径编码"
          rules={[
            { required: true, message: '请输入编码' },
            { pattern: /^[A-Z0-9\-]{4,50}$/, message: '仅大写字母、数字和连字符，4-50个字符' },
          ]}
        >
          <Input placeholder="如 RT-RKQ-STD-001-C01" />
        </Form.Item>

        <Form.Item name="version" label="版本号" rules={[{ required: true, message: '请输入版本号' }]}>
          <Input placeholder="V1.0" style={{ width: 140 }} />
        </Form.Item>

        <Form.Item name="routingName" label="工艺路径名称" rules={[{ required: true, message: '请输入路径名称' }]}>
          <Input placeholder="如 机用根管锉标准工艺路径-免涂层版" />
        </Form.Item>

        <Form.Item name="variantType" label="变体类型" rules={[{ required: true }]}>
          <Select
            options={VARIANT_TYPE_OPTIONS.map(o => ({
              value: o.value,
              label: (
                <span>
                  <strong>{o.label}</strong>
                  <span style={{ color: '#aaa', marginLeft: 6, fontSize: 11 }}>{o.desc}</span>
                </span>
              ),
            }))}
          />
        </Form.Item>

        {/* 绑定方式 */}
        <Form.Item label="绑定方式" required>
          <Radio.Group value={bindMode} onChange={e => setBindMode(e.target.value)}>
            <Space direction="vertical">
              <Radio value="MATERIAL">强绑定具体物料编码</Radio>
              <Radio value="RANGE">绑定规格规则表达式</Radio>
            </Space>
          </Radio.Group>
        </Form.Item>

        {bindMode === 'MATERIAL' && (
          <Form.Item label="强绑定物料编码" name="__material">
            <div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                <Input
                  size="small"
                  style={{ width: 240 }}
                  placeholder="输入物料编码，如 FG-RKQ-2506-25"
                  value={materialInput}
                  onChange={e => setMaterialInput(e.target.value)}
                  onPressEnter={addMaterial}
                />
                <div
                  onClick={addMaterial}
                  style={{
                    width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: '#1677FF', color: '#fff', borderRadius: 4, cursor: 'pointer', flexShrink: 0,
                  }}
                >
                  <PlusOutlined style={{ fontSize: 12 }} />
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, minHeight: 32 }}>
                {materialList.length === 0 && (
                  <span style={{ color: '#ccc', fontSize: 12, lineHeight: '24px' }}>请添加至少一个物料编码</span>
                )}
                {materialList.map(code => (
                  <Tag
                    key={code}
                    closable
                    onClose={() => removeMaterial(code)}
                    style={{ fontSize: 12 }}
                    color="blue"
                  >
                    {code}
                  </Tag>
                ))}
              </div>
            </div>
          </Form.Item>
        )}

        {bindMode === 'RANGE' && (
          <Form.Item
            name="specRangeExpr"
            label="适用规格范围"
            rules={[{ required: true, message: '请输入规格范围表达式' }]}
            extra={
              <span style={{ fontSize: 11, color: '#1677FF' }}>
                示例：diameter:*;taper:02锥;length:* &nbsp;|&nbsp; 多维度用英文分号分隔，区间用~，枚举用|，通配用*
              </span>
            }
          >
            <Input placeholder="diameter:#15~#40;taper:04锥~06锥;length:*" />
          </Form.Item>
        )}

        <Form.Item label="关联产品系列">
          <span style={{ fontFamily: 'monospace', color: '#722ED1', fontWeight: 600 }}>
            {routing.seriesCode}
          </span>
          <span style={{ color: '#aaa', fontSize: 11, marginLeft: 6 }}>（只读，自动继承）</span>
        </Form.Item>

        <Form.Item name="variantReason" label="变体原因">
          <Input.TextArea rows={2} placeholder="说明创建本变体的原因、应用场景..." />
        </Form.Item>

        <Form.Item name="inheritSync" label="继承同步" valuePropName="checked">
          <Switch size="small" />
        </Form.Item>
        <div style={{ fontSize: 11, color: '#aaa', marginTop: -12, marginBottom: 12 }}>
          开启后，标准源路径升版时自动提示变体同步更新
        </div>

        <Alert
          type="info"
          showIcon
          message="复制新建将深拷贝源路径的全部工序结构，新版本状态为草稿，可自由增删改工序。"
          style={{ fontSize: 12 }}
        />
      </Form>
    </Modal>
  );
};

export default CopyVariantModal;

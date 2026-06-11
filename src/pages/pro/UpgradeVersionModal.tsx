import React from 'react';
import {
  Modal, Form, Input, Select, DatePicker, Alert, Descriptions, Tag, Space,
} from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { RoutingMaster, RM_STATUS_MAP, UpgradeReason } from './seriesData';
import dayjs from 'dayjs';

interface Props {
  open: boolean;
  routing: RoutingMaster | null;
  onCancel: () => void;
  onConfirm: (values: {
    newVersion: string;
    upgradeReason: UpgradeReason;
    impactAssessment?: string;
    effectiveDate: string;
    upgradeEcnNo?: string;
  }) => void;
}

const UPGRADE_REASONS: UpgradeReason[] = ['工艺优化', '客户定制', '法规变更', '设备换代', '其他'];

/** 末位版本号 +0.1，如 V2.1 → V2.2；V1.9 → V1.10 */
function bumpVersion(v: string): string {
  const m = v.match(/^V(\d+)\.(\d+)(.*)$/);
  if (!m) return v + '.1';
  return `V${m[1]}.${parseInt(m[2], 10) + 1}${m[3]}`;
}

const UpgradeVersionModal: React.FC<Props> = ({ open, routing, onCancel, onConfirm }) => {
  const [form] = Form.useForm();

  React.useEffect(() => {
    if (open && routing) {
      form.setFieldsValue({
        newVersion: bumpVersion(routing.version),
        effectiveDate: dayjs(),
      });
    }
  }, [open, routing, form]);

  const handleOk = () => {
    form.validateFields().then(values => {
      onConfirm({
        newVersion: values.newVersion,
        upgradeReason: values.upgradeReason,
        impactAssessment: values.impactAssessment,
        effectiveDate: (values.effectiveDate as dayjs.Dayjs).format('YYYY-MM-DD'),
        upgradeEcnNo: values.upgradeEcnNo,
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
          <span style={{ width: 3, height: 16, background: '#C8000A', borderRadius: 2, display: 'inline-block' }} />
          工艺路径升版
        </div>
      }
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      okText="确认升版"
      cancelText="取消"
      okButtonProps={{ style: { background: '#C8000A', borderColor: '#C8000A' } }}
      width={560}
      maskClosable={false}
    >
      {/* 源路径信息 */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: '#888', fontWeight: 500, marginBottom: 8, paddingBottom: 6, borderBottom: '1px solid #f0f0f0' }}>
          源路径信息
        </div>
        <Descriptions size="small" column={2} style={{ fontSize: 12 }}>
          <Descriptions.Item label="工艺路径编码">
            <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#1677FF' }}>
              {routing.routingCode}
            </span>
          </Descriptions.Item>
          <Descriptions.Item label="当前版本">
            <span style={{ fontWeight: 700, color: '#333' }}>{routing.version}</span>
          </Descriptions.Item>
          <Descriptions.Item label="工艺路径名称" span={2}>
            {routing.routingName}
          </Descriptions.Item>
          <Descriptions.Item label="当前状态">
            <Tag color={routing.status === 'ENABLED' ? 'green' : 'orange'} style={{ fontSize: 11 }}>
              {st.label}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="关联系列">
            <span style={{ fontFamily: 'monospace', color: '#722ED1' }}>{routing.seriesCode}</span>
          </Descriptions.Item>
        </Descriptions>
      </div>

      {/* 升版配置 */}
      <div style={{ fontSize: 12, color: '#888', fontWeight: 500, marginBottom: 12, paddingBottom: 6, borderBottom: '1px solid #f0f0f0' }}>
        升版配置
      </div>

      <Form form={form} layout="vertical" size="small">
        <Form.Item
          name="newVersion"
          label="新版本号"
          rules={[
            { required: true, message: '请输入新版本号' },
            { pattern: /^V\d+\.\d+/, message: '格式如 V1.1、V2.0' },
          ]}
        >
          <Input placeholder="如 V2.2" style={{ width: 160 }} />
        </Form.Item>

        <Form.Item
          name="upgradeReason"
          label="升版原因"
          rules={[{ required: true, message: '请选择升版原因' }]}
        >
          <Select
            placeholder="请选择"
            style={{ width: 220 }}
            options={UPGRADE_REASONS.map(r => ({ value: r, label: r }))}
          />
        </Form.Item>

        <Form.Item name="impactAssessment" label="影响评估">
          <Input.TextArea rows={3} placeholder="描述本次升版对生产、质量、物料等方面的影响..." />
        </Form.Item>

        <Form.Item
          name="effectiveDate"
          label="生效日期"
          rules={[{ required: true, message: '请选择生效日期' }]}
        >
          <DatePicker style={{ width: 180 }} format="YYYY-MM-DD" />
        </Form.Item>

        <Form.Item name="upgradeEcnNo" label="关联变更单（ECN）">
          <Input placeholder="如 ECN-2026-088（非必填）" style={{ width: 220 }} />
        </Form.Item>
      </Form>

      <Space direction="vertical" size={4} style={{ width: '100%', marginTop: 8 }}>
        <Alert
          type="warning"
          showIcon
          icon={<ExclamationCircleOutlined />}
          message="升版将复制当前路径并生成新版本（草稿状态），原版本将在新版本生效后自动失效。"
          style={{ fontSize: 12 }}
        />
        <Alert
          type="info"
          showIcon
          icon={<ExclamationCircleOutlined />}
          message="已下达未开工单仍锁定原版本，新工单自动引用新版本。"
          style={{ fontSize: 12 }}
        />
      </Space>
    </Modal>
  );
};

export default UpgradeVersionModal;

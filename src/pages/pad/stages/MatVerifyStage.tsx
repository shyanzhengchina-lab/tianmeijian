import React, { useState } from 'react';
import { Button, Card, Space, Typography, Tag, Alert, Row, Col, Input, message, Table } from 'antd';
import { ScanOutlined, CheckCircleOutlined, EditOutlined, BarcodeOutlined } from '@ant-design/icons';
import type { StageExecution } from '../padExecutionData';

const { Text } = Typography;

interface MatVerifyStageProps {
  opCode?: string;
  content?: string;
  execution: StageExecution;
  onComplete: (data: Record<string, unknown>) => void;
  onESign: (cb: () => void) => void;
}

interface MatRecord {
  code: string;
  name: string;
  lot: string;
  supplier: string;
  validDate: string;
  bomMatch: boolean;
}

const MOCK_MATERIALS: Record<string, MatRecord> = {
  'NT-20260420-A': { code: 'NT-20260420-A', name: '镍钛丝 Φ0.3mm', lot: 'NT-20260420-A', supplier: 'XXX金属', validDate: '2026-12-31', bomMatch: true },
  'HD-20260425-B': { code: 'HD-20260425-B', name: '成品手柄 ABS', lot: 'HD-20260425-B', supplier: 'YYY塑胶', validDate: '2027-06-30', bomMatch: true },
  'LT-20260425-C': { code: 'LT-20260425-C', name: '限位块', lot: 'LT-20260425-C', supplier: 'ZZZ五金', validDate: '2027-12-31', bomMatch: true },
  'PK-20260426-A': { code: 'PK-20260426-A', name: '手柄（打码用）', lot: 'PK-20260426-A', supplier: 'YYY塑胶', validDate: '2027-06-30', bomMatch: true },
  'PK-20260426-B': { code: 'PK-20260426-B', name: '包装材料', lot: 'PK-20260426-B', supplier: 'AAA包装', validDate: '2028-12-31', bomMatch: true },
};

// 按工序预配置需要扫描的物料（快速扫码按钮）
const MAT_BY_OP: Record<string, Array<{ code: string; hint: string }>> = {
  'OP-10-GRIND': [
    { code: 'NT-20260420-A', hint: '模拟扫码：镍钛丝' },
  ],
  'OP-100-ASM': [
    { code: 'HD-20260425-B', hint: '模拟扫码：手柄' },
  ],
  'OP-130-LIMIT': [
    { code: 'LT-20260425-C', hint: '模拟扫码：限位块' },
  ],
  'OP-160-HANDLE': [
    { code: 'PK-20260426-A', hint: '模拟扫码：手柄' },
    { code: 'PK-20260426-B', hint: '模拟扫码：包装材料' },
  ],
};

const MatVerifyStage: React.FC<MatVerifyStageProps> = ({ opCode = '', content, execution, onComplete, onESign }) => {
  const matHints = MAT_BY_OP[opCode] || [];
  const [inputCode, setInputCode] = useState('');
  const [scannedMats, setScannedMats] = useState<MatRecord[]>([]);
  const [signed, setSigned] = useState(false);
  const isCompleted = execution.status === 'completed';

  const canSubmit = scannedMats.length > 0 && scannedMats.every(m => m.bomMatch) && signed;

  const handleScan = () => {
    const code = inputCode.trim() || 'NT-20260420-A';
    const mat = MOCK_MATERIALS[code];
    if (!mat) { message.error('未找到该物料，请检查条码'); return; }
    if (scannedMats.find(m => m.code === code)) { message.warning('该物料已扫描'); return; }
    setScannedMats(prev => [...prev, mat]);
    setInputCode('');
    message.success(`物料 ${mat.name} 扫描成功`);
  };

  const handleSign = () => { onESign(() => { setSigned(true); message.success('电子签名完成'); }); };

  const handleSubmit = () => {
    if (!canSubmit) return;
    onComplete({ mat_records: scannedMats, mat_bom_check: true, mat_operator: '张三(1001)' });
  };

  if (isCompleted) {
    return (
      <Card style={{ background: '#f6ffed', border: '1px solid #b7eb8f' }}>
        <Space><CheckCircleOutlined style={{ color: '#52c41a', fontSize: 20 }} />
          <Text strong style={{ color: '#52c41a' }}>物料一致确认已完成</Text>
        </Space>
      </Card>
    );
  }

  const columns = [
    { title: '物料名称', dataIndex: 'name', key: 'name' },
    { title: '批号', dataIndex: 'lot', key: 'lot', render: (v: string) => <Text code>{v}</Text> },
    { title: '供应商', dataIndex: 'supplier', key: 'supplier' },
    { title: '有效期', dataIndex: 'validDate', key: 'validDate' },
    { title: 'BOM校验', dataIndex: 'bomMatch', key: 'bomMatch', render: (v: boolean) => v ? <Tag color="success">✓ 通过</Tag> : <Tag color="error">✗ 不匹配</Tag> },
  ];

  return (
    <div>
      <Card title={<Space><BarcodeOutlined style={{ color: '#1890ff' }} /><span>物料一致确认</span>
        {content && <Tag color="blue" style={{ fontWeight: 'normal', fontSize: 12 }}>{content}</Tag>}
      </Space>} style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }} size={16}>
          <Alert message={`本工序需核对物料：${content || '请扫描物料条码'}`} type="info" showIcon />

          <Card size="small" style={{ background: '#f0f5ff' }}>
            <Space size={12} wrap>
              <Input size="large" style={{ width: 280, fontSize: 15, fontFamily: 'monospace' }}
                placeholder="扫描物料条码" value={inputCode}
                onChange={e => setInputCode(e.target.value)}
                onPressEnter={handleScan}
                prefix={<ScanOutlined />}
              />
              <Button icon={<ScanOutlined />} type="primary" size="large" style={{ height: 46, fontSize: 16 }} onClick={handleScan}>
                扫码
              </Button>
              {/* 按工序显示对应的快速模拟扫码按钮 */}
              {matHints.map(m => (
                <Button key={m.code} size="large" style={{ height: 46 }}
                  onClick={() => { setInputCode(m.code); setTimeout(handleScan, 100); }}>
                  {m.hint}
                </Button>
              ))}
              {matHints.length === 0 && (
                <Button size="large" style={{ height: 46 }} onClick={() => { setInputCode('NT-20260420-A'); setTimeout(handleScan, 100); }}>
                  模拟扫描镍钛丝
                </Button>
              )}
            </Space>
          </Card>

          {scannedMats.length > 0 && (
            <Table dataSource={scannedMats} columns={columns} rowKey="code" pagination={false} size="middle"
              rowClassName={r => r.bomMatch ? '' : 'table-row-error'}
            />
          )}

          {scannedMats.some(m => !m.bomMatch) && (
            <Alert message="存在不匹配物料，请联系质检人员处理！" type="error" showIcon />
          )}

          {scannedMats.length > 0 && scannedMats.every(m => m.bomMatch) && (
            <Row justify="end">
              <Col>
                <Space>
                  <Text strong style={{ fontSize: 15 }}>操作员签名：</Text>
                  {signed ? (
                    <Tag color="success" style={{ fontSize: 14 }}>✓ 张三 已签名</Tag>
                  ) : (
                    <Button icon={<EditOutlined />} size="large"
                      style={{ height: 40, fontSize: 15, background: '#722ed1', color: '#fff', border: 'none' }}
                      onClick={handleSign}>电子签名</Button>
                  )}
                </Space>
              </Col>
            </Row>
          )}
        </Space>
      </Card>

      <div style={{ textAlign: 'right' }}>
        <Button type="primary" size="large" disabled={!canSubmit} onClick={handleSubmit}
          style={{ height: 52, fontSize: 17, paddingInline: 36 }}>
          ✅ 确认物料
        </Button>
      </div>
    </div>
  );
};

export default MatVerifyStage;

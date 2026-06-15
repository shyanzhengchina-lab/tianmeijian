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
  // ── 维生素C咀嚼片（湿法制粒 / 直压）原料 ──────────────────────────
  'VC-RAW-2026-01': { code: 'VC-RAW-2026-01', name: '维生素C（L-抗坏血酸）', lot: 'VC-RAW-2026-01', supplier: '华北制药集团', validDate: '2027-06-30', bomMatch: true },
  'MANNITOL-2026-02': { code: 'MANNITOL-2026-02', name: '甘露醇（咀嚼基质）', lot: 'MANNITOL-2026-02', supplier: '山东菱花糖醇', validDate: '2027-12-31', bomMatch: true },
  'STARCH-2026-03': { code: 'STARCH-2026-03', name: '淀粉（粘合剂）', lot: 'STARCH-2026-03', supplier: '成都天悦淀粉', validDate: '2027-09-30', bomMatch: true },
  'MGSTN-2026-04': { code: 'MGSTN-2026-04', name: '硬脂酸镁（润滑剂）', lot: 'MGSTN-2026-04', supplier: '上海联丰精细化工', validDate: '2028-06-30', bomMatch: true },
  'ORANGE-FLV-2026-05': { code: 'ORANGE-FLV-2026-05', name: '橙味香精（矫味剂）', lot: 'ORANGE-FLV-2026-05', supplier: '国际香料公司', validDate: '2027-03-31', bomMatch: true },
  'OPADRY-2026-06': { code: 'OPADRY-2026-06', name: 'OPADRY薄膜包衣预混料', lot: 'OPADRY-2026-06', supplier: 'Colorcon亚太', validDate: '2027-06-30', bomMatch: true },
  'PET-BTL-2026-07': { code: 'PET-BTL-2026-07', name: 'PET瓶 60片装', lot: 'PET-BTL-2026-07', supplier: '广东星星包装', validDate: '2028-12-31', bomMatch: true },
  'INNER-PKG-2026-08': { code: 'INNER-PKG-2026-08', name: '铝箔盖（内包材）', lot: 'INNER-PKG-2026-08', supplier: '上海紫江包装', validDate: '2028-12-31', bomMatch: true },
  'OUTER-BOX-2026-09': { code: 'OUTER-BOX-2026-09', name: '彩盒（外包材）', lot: 'OUTER-BOX-2026-09', supplier: '深圳裕同包装', validDate: '2028-12-31', bomMatch: true },
  // ── 益生菌胶囊（冷链）原料 ────────────────────────────────────────
  'PROBIO-MIX-2026-10': { code: 'PROBIO-MIX-2026-10', name: '益生菌复合菌粉（≥100亿CFU/g）', lot: 'PROBIO-MIX-2026-10', supplier: 'Chr.Hansen（科汉森）', validDate: '2026-12-31', bomMatch: true },
  'FOS-2026-11': { code: 'FOS-2026-11', name: '低聚果糖（益生元载体）', lot: 'FOS-2026-11', supplier: '保龄宝生物', validDate: '2027-06-30', bomMatch: true },
  'HPMC-CAP-2026-12': { code: 'HPMC-CAP-2026-12', name: 'HPMC空心胶囊（0#）', lot: 'HPMC-CAP-2026-12', supplier: '安徽沪正胶囊', validDate: '2028-06-30', bomMatch: true },
  'COLD-PKG-2026-13': { code: 'COLD-PKG-2026-13', name: '铝塑泡罩包材（冷链级）', lot: 'COLD-PKG-2026-13', supplier: '南京亿丰包装', validDate: '2028-12-31', bomMatch: true },
};

// 按工序预配置需要扫描的物料（快速扫码按钮）
const MAT_BY_OP: Record<string, Array<{ code: string; hint: string }>> = {
  // 称量配料：所有主辅料
  'OP-GMP-WEIGH': [
    { code: 'VC-RAW-2026-01',   hint: '扫码：维生素C原料' },
    { code: 'MANNITOL-2026-02', hint: '扫码：甘露醇' },
    { code: 'STARCH-2026-03',   hint: '扫码：淀粉' },
    { code: 'MGSTN-2026-04',    hint: '扫码：硬脂酸镁' },
  ],
  // 包衣：包衣料 + 片芯
  'OP-GMP-COATING': [
    { code: 'OPADRY-2026-06',   hint: '扫码：OPADRY包衣料' },
    { code: 'VC-RAW-2026-01',   hint: '扫码：片芯批号确认' },
  ],
  // 内包装：瓶 + 铝箔盖
  'OP-GMP-INNERPACK': [
    { code: 'PET-BTL-2026-07',  hint: '扫码：PET瓶' },
    { code: 'INNER-PKG-2026-08', hint: '扫码：铝箔盖' },
  ],
  // 外包装：彩盒 + 说明书
  'OP-GMP-OUTERPACK': [
    { code: 'OUTER-BOX-2026-09', hint: '扫码：彩盒' },
  ],
  // 益生菌称量配料
  'OP-PROBIO-WEIGH': [
    { code: 'PROBIO-MIX-2026-10', hint: '扫码：益生菌菌粉（❄️冷链）' },
    { code: 'FOS-2026-11',        hint: '扫码：低聚果糖' },
  ],
  // 益生菌胶囊充填：空心胶囊
  'OP-PROBIO-FILL': [
    { code: 'HPMC-CAP-2026-12', hint: '扫码：HPMC空心胶囊' },
    { code: 'PROBIO-MIX-2026-10', hint: '扫码：益生菌颗粒物料' },
  ],
  // 益生菌铝塑包装
  'OP-PROBIO-PACK': [
    { code: 'COLD-PKG-2026-13', hint: '扫码：铝塑泡罩包材' },
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
    const code = inputCode.trim() || 'VC-RAW-2026-01';
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
                <Button size="large" style={{ height: 46 }} onClick={() => { setInputCode('VC-RAW-2026-01'); setTimeout(handleScan, 100); }}>
                  模拟扫描：维生素C原料
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

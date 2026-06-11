import React, { useState } from 'react';
import { Button, Card, Select, Space, Typography, Tag, Alert, Divider, Row, Col, Input, message } from 'antd';
import { ScanOutlined, CheckCircleOutlined, EditOutlined, InfoCircleOutlined } from '@ant-design/icons';
import type { StageExecution, WorkOrder } from '../padExecutionData';
import PadCamera, { CapturedPhoto } from '../components/PadCamera';

const { Text } = Typography;
const { Option } = Select;

interface CheckInStageProps {
  workOrder: WorkOrder;
  prevOpName?: string;
  execution: StageExecution;
  onComplete: (data: Record<string, unknown>) => void;
  onESign: (cb: () => void) => void;
}

const CheckInStage: React.FC<CheckInStageProps> = ({ workOrder, prevOpName, execution, onComplete, onESign }) => {
  const [floatBarcode, setFloatBarcode] = useState('');
  const [scanned, setScanned] = useState(false);
  const [qtyCheck, setQtyCheck] = useState<'' | 'consistent' | 'inconsistent'>('');
  const [photos, setPhotos] = useState<CapturedPhoto[]>([]);
  const [signed, setSigned] = useState(false);
  const isCompleted = execution.status === 'completed';

  const photoOk = photos.length >= 1;
  const canSubmit = scanned && qtyCheck === 'consistent' && photoOk && signed;

  const handleScan = () => {
    // Simulate barcode scan
    setFloatBarcode(workOrder.floatBarcode);
    setScanned(true);
    message.success(`浮漂条码识别成功：${workOrder.floatBarcode}`);
  };

  const handleSign = () => {
    onESign(() => { setSigned(true); message.success('电子签名完成'); });
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    onComplete({
      in_float: floatBarcode,
      in_wo: workOrder.woNo,
      in_batch: workOrder.batchNo,
      in_prev_op: prevOpName,
      in_qty_check: qtyCheck,
      in_photo: photos.length,
      in_photos: photos.map(p => p.timestamp),
      in_time: new Date().toLocaleString('zh-CN'),
      in_operator: '张三(1001)',
    });
  };

  if (isCompleted) {
    return (
      <Card style={{ background: '#f6ffed', border: '1px solid #b7eb8f' }}>
        <Space><CheckCircleOutlined style={{ color: '#52c41a', fontSize: 20 }} />
          <Text strong style={{ color: '#52c41a' }}>进站已完成</Text>
          <Text type="secondary">进站时间：{execution.endTime}</Text>
        </Space>
      </Card>
    );
  }

  return (
    <div>
      <Card
        title={<Space><ScanOutlined style={{ color: '#1890ff' }} /><span>进站确认</span></Space>}
        style={{ marginBottom: 16 }}
      >
        <Space direction="vertical" style={{ width: '100%' }} size={16}>
          {/* 浮漂扫码 */}
          <Card size="small" style={{ background: '#f0f5ff' }}>
            <Text strong style={{ fontSize: 15 }}>请扫描生产浮漂条码激活本工序：</Text>
            <div style={{ marginTop: 12 }}>
              <Space size={12}>
                <Input
                  size="large"
                  style={{ width: 280, fontSize: 15, fontFamily: 'monospace' }}
                  placeholder="扫描或手动输入浮漂条码"
                  value={floatBarcode}
                  onChange={e => setFloatBarcode(e.target.value)}
                  prefix={<Text type="secondary" style={{ fontSize: 20 }}>▉▉</Text>}
                />
                <Button
                  icon={<ScanOutlined />}
                  type="primary"
                  size="large"
                  style={{ height: 46, fontSize: 16 }}
                  onClick={handleScan}
                >
                  扫码
                </Button>
              </Space>
            </div>
          </Card>

          {/* 浮漂信息展示 */}
          {scanned && (
            <Card size="small" style={{ background: '#f6ffed', border: '1px solid #b7eb8f' }}>
              <Space direction="vertical" style={{ width: '100%' }} size={8}>
                <Text strong style={{ color: '#52c41a' }}>✓ 浮漂验证通过</Text>
                <Row gutter={24}>
                  <Col span={8}><Text type="secondary">工单号：</Text><Text strong>{workOrder.woNo}</Text></Col>
                  <Col span={8}><Text type="secondary">产品：</Text><Text strong>{workOrder.productSpec}</Text></Col>
                  <Col span={8}><Text type="secondary">批次：</Text><Text strong>{workOrder.batchNo}</Text></Col>
                </Row>
                {prevOpName && (
                  <Row>
                    <Col span={12}><Text type="secondary">上工序：</Text><Text strong>{prevOpName}</Text>
                      <Tag color="success" style={{ marginLeft: 8 }}>已出站 ✓</Tag>
                    </Col>
                  </Row>
                )}
                <Row>
                  <Col span={12}><Text type="secondary">本站计划数量：</Text><Text strong style={{ fontSize: 16 }}>{workOrder.planQty} 支</Text></Col>
                </Row>
              </Space>
            </Card>
          )}

          {scanned && (
            <>
              <Divider />

              {/* 实物核对 */}
              <Row gutter={24} align="top">
                <Col span={12}>
                  <Space direction="vertical" size={8} style={{ width: '100%' }}>
                    <Text strong style={{ fontSize: 15 }}>实物核对：</Text>
                    <Select
                      size="large"
                      style={{ width: 200 }}
                      placeholder="选择核对结果"
                      value={qtyCheck || undefined}
                      onChange={v => setQtyCheck(v as 'consistent' | 'inconsistent')}
                    >
                      <Option value="consistent"><Text style={{ color: '#52c41a' }}>✓ 一致</Text></Option>
                      <Option value="inconsistent"><Text style={{ color: '#ff4d4f' }}>✗ 不一致</Text></Option>
                    </Select>
                    {qtyCheck === 'inconsistent' && (
                      <Alert message="实物数量与计划不一致，请联系班长处理后再进站！" type="error" showIcon />
                    )}
                  </Space>
                </Col>

                {/* 现场拍照（摄像头） */}
                <Col span={12}>
                  <Space direction="vertical" size={8} style={{ width: '100%' }}>
                    <Text strong style={{ fontSize: 15 }}>现场拍照（至少1张）：</Text>
                    <PadCamera
                      photos={photos}
                      onChange={setPhotos}
                      minCount={1}
                      maxCount={4}
                      label="拍摄进站现场"
                    />
                    {!photoOk && (
                      <Alert
                        message="请至少拍摄1张进站现场照片，用于追溯记录"
                        type="warning"
                        showIcon
                        style={{ fontSize: 12 }}
                      />
                    )}
                  </Space>
                </Col>
              </Row>

              <Divider style={{ margin: '8px 0' }} />

              {/* 操作员签名 */}
              <Row justify="end" align="middle">
                <Col>
                  <Space>
                    <Text strong style={{ fontSize: 15 }}>操作员签名：</Text>
                    {signed ? (
                      <Tag color="success" style={{ fontSize: 14, padding: '4px 12px' }}>✓ 张三 已签名</Tag>
                    ) : (
                      <Button
                        icon={<EditOutlined />}
                        size="large"
                        style={{ height: 44, fontSize: 15, background: '#722ed1', color: '#fff', border: 'none' }}
                        onClick={handleSign}
                        disabled={!photoOk || qtyCheck !== 'consistent'}
                      >
                        电子签名
                      </Button>
                    )}
                  </Space>
                </Col>
              </Row>
            </>
          )}

          {!scanned && (
            <Alert
              icon={<InfoCircleOutlined />}
              message="进站必须扫描浮漂条码，系统将校验上工序已出站后方可激活本工序"
              type="info"
              showIcon
            />
          )}
        </Space>
      </Card>

      <div style={{ textAlign: 'right' }}>
        <Button type="primary" size="large" disabled={!canSubmit} onClick={handleSubmit}
          style={{ height: 52, fontSize: 17, paddingInline: 36 }}>
          ✅ 确认进站
        </Button>
      </div>
    </div>
  );
};

export default CheckInStage;

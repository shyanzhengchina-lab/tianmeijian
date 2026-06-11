import React, { useState } from 'react';
import { Button, Card, Space, Typography, Tag, Alert, Row, Col, Input, message, Divider } from 'antd';
import {
  CheckCircleOutlined, EditOutlined, ScanOutlined, PrinterOutlined,
  CloseCircleOutlined, ExclamationCircleOutlined
} from '@ant-design/icons';
import type { StageExecution, WorkOrder } from '../padExecutionData';
import { printFloatUpdate } from '../utils/printUtils';

const { Text } = Typography;

interface StageCompletionChecks {
  allStagesDone: boolean;
  reportSubmitted: boolean;
  postCleanDone: boolean;
  noAbnormal: boolean;
}

interface CheckOutStageProps {
  workOrder: WorkOrder;
  nextOpName?: string;
  opName?: string;
  opCode?: string;
  reportData?: Record<string, unknown>;
  stageCompletionChecks: StageCompletionChecks;
  execution: StageExecution;
  onComplete: (data: Record<string, unknown>) => void;
  onESign: (cb: () => void) => void;
}

const CheckOutStage: React.FC<CheckOutStageProps> = ({
  workOrder, nextOpName, opName, opCode, reportData, stageCompletionChecks,
  execution, onComplete, onESign
}) => {
  const [floatBarcode, setFloatBarcode] = useState('');
  const [scanned, setScanned] = useState(false);
  const [receiverScanned, setReceiverScanned] = useState(false);
  const [receiver, setReceiver] = useState('');
  const [signed, setSigned] = useState(false);
  const isCompleted = execution.status === 'completed';

  const checks = stageCompletionChecks;
  const outQty = (reportData?.rpt_finish as number) ?? workOrder.planQty;
  const allChecksPassed = checks.allStagesDone && checks.reportSubmitted && checks.postCleanDone && checks.noAbnormal;

  const canSubmit = scanned && allChecksPassed && signed;

  const handleScan = () => {
    const code = floatBarcode.trim() || workOrder.floatBarcode;
    if (code !== workOrder.floatBarcode) {
      message.error('浮漂条码不匹配，请扫描正确的浮漂！');
      return;
    }
    setFloatBarcode(workOrder.floatBarcode);
    setScanned(true);
    message.success(`✓ 浮漂 ${workOrder.floatBarcode} 验证通过，出站校验开始…`);
  };

  const handleReceiverScan = () => {
    setReceiver('李四(1002)');
    setReceiverScanned(true);
    message.success('接收人工牌扫码成功：李四(1002)');
  };

  const handleSign = () => {
    if (!allChecksPassed) {
      message.warning('请先确保所有必做阶段已完成');
      return;
    }
    onESign(() => {
      setSigned(true);
      message.success('电子签名完成，确认出站');
    });
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    onComplete({
      out_float: floatBarcode,
      out_check: checks.allStagesDone,
      out_report: checks.reportSubmitted,
      out_clean: checks.postCleanDone,
      out_abnormal: checks.noAbnormal,
      out_qty: outQty,
      out_next_op: nextOpName,
      out_receiver: receiver,
      out_esig: '张三(1001)',
      out_time: new Date().toLocaleString('zh-CN'),
    });
  };

  if (isCompleted) {
    return (
      <Card style={{ background: '#f6ffed', border: '2px solid #52c41a', borderRadius: 12 }}>
        <Space direction="vertical" style={{ width: '100%' }} size={8}>
          <Space>
            <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 22 }} />
            <Text strong style={{ color: '#52c41a', fontSize: 15 }}>出站已完成 ✓ 电子浮漂已更新（变绿）</Text>
          </Space>
          <Row gutter={24}>
            <Col><Text type="secondary" style={{ fontSize: 12 }}>出站数量：</Text><Text strong style={{ color: '#1890ff' }}>{outQty} 件</Text></Col>
            <Col><Text type="secondary" style={{ fontSize: 12 }}>出站时间：</Text><Text style={{ fontSize: 12 }}>{execution.endTime}</Text></Col>
            {nextOpName && <Col><Text type="secondary" style={{ fontSize: 12 }}>下工序：</Text><Tag color="blue">{nextOpName}</Tag></Col>}
          </Row>
        </Space>
      </Card>
    );
  }

  const checkItems = [
    { label: '本工序所有必做阶段已完成', done: checks.allStagesDone, failMsg: '存在未完成的必做阶段' },
    { label: '报工数量已提交', done: checks.reportSubmitted, failMsg: '请先完成报工阶段' },
    { label: '后清场已完成', done: checks.postCleanDone, failMsg: '请先完成后清场阶段' },
    { label: '无异常挂起状态', done: checks.noAbnormal, failMsg: '当前工序处于异常挂起状态' },
  ];

  return (
    <div>
      <Card
        title={<Space><ScanOutlined style={{ color: '#52c41a' }} /><span>出站</span></Space>}
        style={{ marginBottom: 14, borderRadius: 10 }}
      >
        <Space direction="vertical" style={{ width: '100%' }} size={14}>
          {/* 浮漂扫码 */}
          <Card size="small" style={{ background: '#f0f5ff', borderRadius: 8 }}>
            <Text strong style={{ fontSize: 14 }}>📋 请扫描生产浮漂条码确认出站：</Text>
            <div style={{ marginTop: 10 }}>
              <Space size={10}>
                <Input
                  size="large"
                  style={{ width: 300, fontSize: 14, fontFamily: 'monospace' }}
                  placeholder="扫描浮漂条码"
                  value={floatBarcode}
                  onChange={e => setFloatBarcode(e.target.value)}
                  onPressEnter={handleScan}
                  prefix={<Text type="secondary" style={{ fontSize: 18 }}>▉▉</Text>}
                  addonAfter={
                    <Button type="link" icon={<ScanOutlined />} onClick={handleScan} style={{ padding: '0 4px' }}>
                      扫码
                    </Button>
                  }
                />
              </Space>
            </div>
            {scanned && (
              <Tag color="success" style={{ marginTop: 8, fontSize: 12, padding: '3px 10px' }}>
                ✓ 浮漂 {workOrder.floatBarcode} 验证通过
              </Tag>
            )}
            {!scanned && (
              <div style={{ marginTop: 8 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  本工单浮漂：{workOrder.floatBarcode}（演示：点击扫码按钮自动填入）
                </Text>
              </div>
            )}
          </Card>

          {/* 出站校验清单 */}
          <Card size="small" title={<Text strong style={{ fontSize: 13 }}>出站校验清单</Text>} style={{ borderRadius: 8 }}>
            <Space direction="vertical" style={{ width: '100%' }} size={10}>
              {checkItems.map(({ label, done, failMsg }) => (
                <Row key={label} align="middle" gutter={10}>
                  <Col style={{ width: 28 }}>
                    {done
                      ? <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 18 }} />
                      : <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: 18 }} />
                    }
                  </Col>
                  <Col flex="1">
                    <Text style={{ fontSize: 13, color: done ? '#262626' : '#ff4d4f' }}>{label}</Text>
                  </Col>
                  <Col>
                    {done
                      ? <Tag color="success" style={{ fontSize: 11 }}>✓ 通过</Tag>
                      : <Tag color="error" style={{ fontSize: 11 }}>✗ {failMsg}</Tag>
                    }
                  </Col>
                </Row>
              ))}
            </Space>
          </Card>

          {/* 出站信息 */}
          {scanned && (
            <Card size="small" title={<Text strong style={{ fontSize: 13 }}>出站信息</Text>} style={{ background: '#f6ffed', borderRadius: 8 }}>
              <Row gutter={[24, 12]}>
                <Col span={8}>
                  <Space direction="vertical" size={2}>
                    <Text type="secondary" style={{ fontSize: 12 }}>出站数量</Text>
                    <Text style={{ fontSize: 20, fontWeight: 700, color: '#1890ff' }}>{outQty} 件</Text>
                  </Space>
                </Col>
                <Col span={8}>
                  <Space direction="vertical" size={2}>
                    <Text type="secondary" style={{ fontSize: 12 }}>下工序</Text>
                    {nextOpName
                      ? <Tag color="blue" style={{ fontSize: 13 }}>{nextOpName}</Tag>
                      : <Tag color="green" style={{ fontSize: 13 }}>全部工序完工</Tag>
                    }
                  </Space>
                </Col>
                <Col span={8}>
                  <Space direction="vertical" size={2}>
                    <Text type="secondary" style={{ fontSize: 12 }}>出站时间</Text>
                    <Text style={{ fontSize: 12 }}>{new Date().toLocaleString('zh-CN')}</Text>
                  </Space>
                </Col>
                {/* 接收人扫码 */}
                {nextOpName && (
                  <Col span={24}>
                    <Space>
                      <Text style={{ fontSize: 13 }}>接收人工牌：</Text>
                      {receiverScanned
                        ? <Tag color="success" style={{ fontSize: 13 }}>✓ {receiver}</Tag>
                        : (
                          <>
                            <Input
                              size="middle"
                              style={{ width: 180, fontFamily: 'monospace' }}
                              placeholder="扫描接收人工牌（可选）"
                              value={receiver}
                              onChange={e => setReceiver(e.target.value)}
                            />
                            <Button icon={<ScanOutlined />} onClick={handleReceiverScan}>
                              扫码
                            </Button>
                          </>
                        )
                      }
                    </Space>
                  </Col>
                )}
              </Row>
            </Card>
          )}

          {/* 不通过提示 */}
          {!allChecksPassed && (
            <Alert
              icon={<ExclamationCircleOutlined />}
              message="出站校验未通过，请先完成所有必做阶段后再出站！"
              type="error" showIcon
            />
          )}

          <Divider style={{ margin: '8px 0' }} />

          {/* 打印 + 签名 */}
          <Row justify="space-between" align="middle">
            <Col>
              <Button
                icon={<PrinterOutlined />}
                size="large"
                onClick={() => {
                  printFloatUpdate({
                    workOrder: {
                      productName: workOrder.productName,
                      productSpec: workOrder.productSpec,
                      batchNo: workOrder.batchNo,
                      woNo: workOrder.woNo,
                      planQty: workOrder.planQty,
                    },
                    opName: opName ?? '',
                    opCode: opCode ?? '',
                    outQty,
                    nextOpName,
                    outTime: new Date().toLocaleString('zh-CN'),
                    operator: '张三(1001)',
                    floatBarcode: workOrder.floatBarcode,
                    receiver: receiverScanned ? receiver : undefined,
                  });
                }}
                style={{ height: 46 }}
              >
                打印浮漂更新页（可选）
              </Button>
            </Col>
            <Col>
              <Space>
                <Text strong style={{ fontSize: 14 }}>操作员电子签名：</Text>
                {signed ? (
                  <Tag color="success" style={{ fontSize: 13, padding: '4px 12px' }}>✓ 张三 已签名</Tag>
                ) : (
                  <Button
                    icon={<EditOutlined />}
                    size="large"
                    style={{ height: 44, fontSize: 14, background: '#722ed1', color: '#fff', border: 'none' }}
                    onClick={handleSign}
                    disabled={!allChecksPassed}
                  >
                    电子签名
                  </Button>
                )}
              </Space>
            </Col>
          </Row>
        </Space>
      </Card>

      <div style={{ textAlign: 'right' }}>
        <Button
          type="primary"
          size="large"
          disabled={!canSubmit}
          onClick={handleSubmit}
          style={{
            height: 54, fontSize: 16, paddingInline: 40, fontWeight: 700,
            background: canSubmit ? '#52c41a' : undefined,
            borderColor: canSubmit ? '#52c41a' : undefined,
          }}
        >
          ✅ 确认出站 — 流转至下工序
        </Button>
      </div>
    </div>
  );
};

export default CheckOutStage;

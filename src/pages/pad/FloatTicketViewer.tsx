import React, { useState, useRef } from 'react';
import {
  Card, Tag, Typography, Row, Col, Divider, Space, Badge,
  Button, Tooltip, Modal, message
} from 'antd';
import {
  PrinterOutlined, BarcodeOutlined, ZoomInOutlined,
  CheckCircleOutlined, ClockCircleOutlined, ExclamationCircleOutlined
} from '@ant-design/icons';
import type { WorkOrder, FloatCell } from './padExecutionData';

const { Text, Title } = Typography;

interface FloatTicketViewerProps {
  workOrder: WorkOrder;
  cells: FloatCell[];
  currentOpCode?: string;   // 当前正在执行的工序（高亮）
}

const STATUS_CONFIG = {
  not_started: { color: '#fff',    border: '#d9d9d9', text: '未开始', textColor: '#8c8c8c', bg: '#fafafa' },
  in_progress: { color: '#fffbe6', border: '#faad14', text: '进行中', textColor: '#d48806', bg: '#fffbe6' },
  completed:   { color: '#f6ffed', border: '#52c41a', text: '已完成', textColor: '#389e0d', bg: '#f6ffed' },
  abnormal:    { color: '#fff2f0', border: '#ff4d4f', text: '异常',   textColor: '#cf1322', bg: '#fff2f0' },
};

/** 模拟条码图（CSS 渲染，无需外部库） */
const FakeBarcode: React.FC<{ value: string }> = ({ value }) => {
  // 生成伪条码条纹宽度序列
  const bars = value.split('').map((c, i) => ({ width: (c.charCodeAt(0) % 3) + 1, gap: i % 4 === 0 ? 2 : 1 }));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', height: 36, gap: 0 }}>
        {bars.map((b, i) => (
          <React.Fragment key={i}>
            <div style={{ width: b.width, height: 32, background: '#222', borderRadius: 1 }} />
            <div style={{ width: b.gap, height: 32, background: 'transparent' }} />
          </React.Fragment>
        ))}
      </div>
      <Text style={{ fontSize: 10, fontFamily: 'monospace', letterSpacing: 1, color: '#555' }}>{value}</Text>
    </div>
  );
};

const FloatTicketViewer: React.FC<FloatTicketViewerProps> = ({ workOrder, cells, currentOpCode }) => {
  const [printPreviewOpen, setPrintPreviewOpen] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const visibleCells = cells.filter(c => !c.hidden);
  const completedCount = visibleCells.filter(c => c.status === 'completed').length;
  const inProgressCount = visibleCells.filter(c => c.status === 'in_progress').length;
  const progressPct = visibleCells.length > 0
    ? Math.round((completedCount / visibleCells.length) * 100) : 0;

  const handlePrint = () => {
    if (!printRef.current) return;
    const w = window.open('', '_blank', 'width=800,height=900');
    if (!w) { message.warning('请允许弹窗以进行打印'); return; }
    w.document.write(`
      <html><head>
        <title>生产浮漂 — ${workOrder.woNo}</title>
        <style>
          body { font-family: Arial, sans-serif; font-size: 12px; padding: 20px; }
          h2 { text-align:center; margin-bottom:4px; }
          .sub { text-align:center; color:#555; margin-bottom:16px; }
          table { width:100%; border-collapse:collapse; margin-top:12px; }
          th, td { border:1px solid #ccc; padding:6px 8px; text-align:center; font-size:11px; }
          th { background:#f0f0f0; }
          .done { background:#f6ffed; color:#389e0d; font-weight:bold; }
          .prog { background:#fffbe6; color:#d48806; }
          .abnormal { background:#fff2f0; color:#cf1322; }
          .progress-bar { height:10px; background:#e8e8e8; border-radius:5px; margin:12px 0; }
          .progress-fill { height:10px; background:#52c41a; border-radius:5px; }
          .meta { display:flex; gap:24px; flex-wrap:wrap; margin-bottom:12px; }
          .meta-item { font-size:12px; }
          .meta-item span { font-weight:bold; }
        </style>
      </head><body>
        <h2>📋 悦尚医疗器械 MES — 生产工序转移单</h2>
        <div class="sub">ISO 13485 · GMP · ALCOA+ · UDI (GS1)</div>
        <div class="meta">
          <div class="meta-item">工单号：<span>${workOrder.woNo}</span></div>
          <div class="meta-item">产品：<span>${workOrder.productSpec}</span></div>
          <div class="meta-item">批次：<span>${workOrder.batchNo}</span></div>
          <div class="meta-item">计划数量：<span>${workOrder.planQty} ${workOrder.unit || '粒'}</span></div>
          <div class="meta-item">浮漂条码：<span>${workOrder.floatBarcode}</span></div>
          <div class="meta-item">客户：<span>${workOrder.customer || '—'}</span></div>
          <div class="meta-item">优先级：<span>${workOrder.priority}级</span></div>
          <div class="meta-item">打印时间：<span>${new Date().toLocaleString('zh-CN')}</span></div>
        </div>
        <div class="progress-bar"><div class="progress-fill" style="width:${progressPct}%"></div></div>
        <div style="font-size:11px;color:#555;margin-bottom:10px">
          生产进度：${completedCount} / ${visibleCells.length} 道工序完成（${progressPct}%）
        </div>
        <table>
          <thead><tr>
            <th>序号</th><th>工序名称</th><th>状态</th><th>进站时间</th><th>出站时间</th>
          </tr></thead>
          <tbody>
            ${visibleCells.map(c => `
              <tr class="${c.status === 'completed' ? 'done' : c.status === 'in_progress' ? 'prog' : c.status === 'abnormal' ? 'abnormal' : ''}">
                <td>${c.seq}</td>
                <td>${c.name}</td>
                <td>${STATUS_CONFIG[c.status].text}</td>
                <td>${c.inTime || '—'}</td>
                <td>${c.outTime || '—'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div style="margin-top:24px;border-top:1px solid #ccc;padding-top:12px;display:flex;gap:40px;">
          <div>操作员签名：___________</div>
          <div>班长确认：___________</div>
          <div>QA签字：___________</div>
        </div>
      </body></html>
    `);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); w.close(); }, 400);
  };

  const cellContent = (
    <div ref={printRef}>
      {/* ===== 头部信息卡 ===== */}
      <Card
        style={{
          marginBottom: 16,
          background: 'linear-gradient(135deg, #1a237e 0%, #283593 100%)',
          border: 'none',
        }}
        bodyStyle={{ padding: '16px 20px' }}
      >
        <Row justify="space-between" align="top">
          <Col flex="1">
            <Title level={5} style={{ color: '#fff', margin: 0, marginBottom: 8 }}>
              📋 医疗器械生产执行单（工序转移单）
            </Title>
            <Row gutter={16}>
              <Col span={12}>
                <Space direction="vertical" size={4}>
                  <Text style={{ color: '#c5cae9' }}>工单号：
                    <Text style={{ color: '#fff', fontWeight: 600 }}>{workOrder.woNo}</Text>
                  </Text>
                  <Text style={{ color: '#c5cae9' }}>产品型号：
                    <Text style={{ color: '#fff', fontWeight: 600 }}>{workOrder.productSpec}</Text>
                  </Text>
                  <Text style={{ color: '#c5cae9' }}>批次：
                    <Text style={{ color: '#fff', fontWeight: 600 }}>{workOrder.batchNo}</Text>
                  </Text>
                </Space>
              </Col>
              <Col span={12}>
                <Space direction="vertical" size={4}>
                  <Text style={{ color: '#c5cae9' }}>计划数量：
                    <Text style={{ color: '#fff', fontWeight: 600 }}>{workOrder.planQty} {workOrder.unit || '粒'}</Text>
                  </Text>
                  <Text style={{ color: '#c5cae9' }}>客户：
                    <Text style={{ color: '#fff', fontWeight: 600 }}>{workOrder.customer || '—'}</Text>
                  </Text>
                  <Text style={{ color: '#c5cae9' }}>优先级：
                    <Tag
                      color={workOrder.priority === 'A' ? 'red' : workOrder.priority === 'B' ? 'orange' : 'default'}
                      style={{ marginLeft: 4 }}
                    >
                      {workOrder.priority}级
                    </Tag>
                  </Text>
                </Space>
              </Col>
            </Row>
          </Col>
          {/* 操作按钮 */}
          <Col>
            <Space direction="vertical" size={8}>
              <Tooltip title="打印浮漂转移单">
                <Button
                  icon={<PrinterOutlined />}
                  onClick={handlePrint}
                  style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.4)' }}
                  size="small"
                >
                  打印
                </Button>
              </Tooltip>
              <Tooltip title="查看条码大图">
                <Button
                  icon={<BarcodeOutlined />}
                  onClick={() => setPrintPreviewOpen(true)}
                  style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.4)' }}
                  size="small"
                >
                  条码
                </Button>
              </Tooltip>
            </Space>
          </Col>
        </Row>

        <Divider style={{ borderColor: 'rgba(255,255,255,0.2)', margin: '12px 0' }} />

        {/* 浮漂条码行 */}
        <Row align="middle" gutter={16}>
          <Col span={14}>
            <Text style={{ color: '#c5cae9' }}>浮漂条码：</Text>
            <Text style={{
              color: '#fff', fontFamily: 'monospace',
              fontSize: 14, fontWeight: 700, letterSpacing: 2,
            }}>
              {workOrder.floatBarcode}
            </Text>
          </Col>
          <Col span={10}>
            <Space size={8} wrap>
              <Badge count={completedCount} style={{ backgroundColor: '#52c41a' }}>
                <Tag color="success" style={{ fontSize: 12 }}>已完成</Tag>
              </Badge>
              {inProgressCount > 0 && (
                <Tag color="warning" style={{ fontSize: 12 }}>进行中 {inProgressCount}</Tag>
              )}
              <Tag color="default" style={{ fontSize: 12 }}>共 {visibleCells.length} 道</Tag>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* ===== 物料追溯 ===== */}
      <Card
        size="small"
        style={{ marginBottom: 16, background: '#f9f9f9' }}
        bodyStyle={{ padding: '10px 16px' }}
      >
        <Text strong style={{ fontSize: 12, color: '#595959' }}>物料追溯：</Text>
        <Row gutter={24} style={{ marginTop: 4 }}>
          <Col>
            <Text style={{ fontSize: 12 }} type="secondary">原料批号：</Text>
            <Text style={{ fontSize: 12, fontFamily: 'monospace' }}>{workOrder.materialLotNo}</Text>
          </Col>
          {workOrder.handleLotNo && (
            <Col>
              <Text style={{ fontSize: 12 }} type="secondary">辅料批号：</Text>
              <Text style={{ fontSize: 12, fontFamily: 'monospace' }}>{workOrder.handleLotNo}</Text>
              <Text style={{ fontSize: 11, color: '#faad14' }}> (配料补录)</Text>
            </Col>
          )}
          {workOrder.limitLotNo && (
            <Col>
              <Text style={{ fontSize: 12 }} type="secondary">包材批号：</Text>
              <Text style={{ fontSize: 12, fontFamily: 'monospace' }}>{workOrder.limitLotNo}</Text>
              <Text style={{ fontSize: 11, color: '#faad14' }}> (包装补录)</Text>
            </Col>
          )}
        </Row>
      </Card>

      {/* ===== 工序流转格子 ===== */}
      <div>
        <Row justify="space-between" align="middle" style={{ marginBottom: 8 }}>
          <Text strong style={{ fontSize: 13, color: '#595959' }}>
            工序流转状态（{completedCount}/{visibleCells.length} 完成）
          </Text>
          <Space size={12}>
            <Space size={4}>
              <div style={{ width: 10, height: 10, background: '#52c41a', borderRadius: 2 }} />
              <Text style={{ fontSize: 11 }} type="secondary">已完成</Text>
            </Space>
            <Space size={4}>
              <div style={{ width: 10, height: 10, background: '#faad14', borderRadius: 2 }} />
              <Text style={{ fontSize: 11 }} type="secondary">进行中</Text>
            </Space>
            <Space size={4}>
              <div style={{ width: 10, height: 10, background: '#d9d9d9', borderRadius: 2 }} />
              <Text style={{ fontSize: 11 }} type="secondary">未开始</Text>
            </Space>
          </Space>
        </Row>

        <Row gutter={[8, 8]}>
          {visibleCells.map((cell) => {
            const cfg = STATUS_CONFIG[cell.status];
            const isCurrent = cell.opCode === currentOpCode;
            return (
              <Col key={cell.opCode} xs={12} sm={8} md={6}>
                <div
                  style={{
                    border: isCurrent
                      ? '2px solid #1890ff'
                      : `2px solid ${cfg.border}`,
                    borderRadius: 8,
                    padding: '10px 12px',
                    background: isCurrent ? '#e6f7ff' : cfg.bg,
                    minHeight: 92,
                    position: 'relative',
                    transition: 'all 0.2s',
                    boxShadow: isCurrent ? '0 0 8px rgba(24,144,255,0.35)' : undefined,
                  }}
                >
                  {/* 序号角标 */}
                  <div style={{ position: 'absolute', top: 5, right: 8 }}>
                    <Text style={{ fontSize: 10, color: '#8c8c8c' }}>{cell.seq}</Text>
                  </div>

                  {/* 当前工序标识 */}
                  {isCurrent && (
                    <div style={{ position: 'absolute', top: 5, left: 8 }}>
                      <Tag color="blue" style={{ fontSize: 9, padding: '0 3px', lineHeight: '16px' }}>当前</Tag>
                    </div>
                  )}

                  {/* 状态图标 */}
                  <div style={{ marginBottom: 4, marginTop: isCurrent ? 16 : 0 }}>
                    {cell.status === 'completed' &&
                      <CheckCircleOutlined style={{ fontSize: 16, color: '#52c41a' }} />}
                    {cell.status === 'in_progress' &&
                      <ClockCircleOutlined style={{ fontSize: 16, color: '#faad14' }} />}
                    {cell.status === 'not_started' &&
                      <span style={{ fontSize: 16, color: '#d9d9d9' }}>○</span>}
                    {cell.status === 'abnormal' &&
                      <ExclamationCircleOutlined style={{ fontSize: 16, color: '#ff4d4f' }} />}
                  </div>

                  {/* 工序名称 */}
                  <Text strong style={{
                    fontSize: 13, display: 'block',
                    color: isCurrent ? '#1890ff' : cfg.textColor,
                    lineHeight: '18px',
                  }}>
                    {cell.name}
                  </Text>

                  {/* 时间 */}
                  <div style={{ marginTop: 4 }}>
                    {cell.inTime && (
                      <Text style={{ fontSize: 10, color: '#8c8c8c', display: 'block' }}>
                        进：{cell.inTime}
                      </Text>
                    )}
                    {cell.outTime && (
                      <Text style={{ fontSize: 10, color: '#52c41a', display: 'block' }}>
                        出：{cell.outTime}
                      </Text>
                    )}
                  </div>

                  {/* 状态 Tag */}
                  <Tag
                    color={
                      cell.status === 'completed' ? 'success'
                        : cell.status === 'in_progress' ? 'warning'
                        : cell.status === 'abnormal' ? 'error'
                        : 'default'
                    }
                    style={{ fontSize: 10, marginTop: 4, padding: '0 4px' }}
                  >
                    {cfg.text}
                  </Tag>
                </div>
              </Col>
            );
          })}
        </Row>
      </div>

      {/* ===== 进度条 ===== */}
      <div style={{ marginTop: 16, padding: '10px 14px', background: '#f5f5f5', borderRadius: 8 }}>
        <Row align="middle" gutter={12}>
          <Col flex="1">
            <div style={{ height: 10, background: '#e8e8e8', borderRadius: 5, overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${progressPct}%`,
                  background: progressPct === 100
                    ? 'linear-gradient(90deg, #52c41a, #73d13d)'
                    : 'linear-gradient(90deg, #1890ff, #40a9ff)',
                  borderRadius: 5,
                  transition: 'width 0.5s ease',
                }}
              />
            </div>
          </Col>
          <Col>
            <Text strong style={{ fontSize: 13, color: progressPct === 100 ? '#52c41a' : '#1890ff' }}>
              {progressPct}%
            </Text>
          </Col>
        </Row>
        <Text style={{ fontSize: 11, color: '#8c8c8c', marginTop: 4, display: 'block' }}>
          生产进度：{completedCount}/{visibleCells.length} 道工序完成
          {progressPct === 100 && (
            <Tag color="success" style={{ marginLeft: 8, fontSize: 11 }}>✓ 全部完工</Tag>
          )}
        </Text>
      </div>
    </div>
  );

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', fontSize: 13 }}>
      {cellContent}

      {/* ===== 条码大图 Modal ===== */}
      <Modal
        title={
          <Space>
            <BarcodeOutlined style={{ color: '#1890ff' }} />
            <span>浮漂条码</span>
            <ZoomInOutlined />
          </Space>
        }
        open={printPreviewOpen}
        onCancel={() => setPrintPreviewOpen(false)}
        footer={[
          <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={handlePrint}>
            打印转移单
          </Button>,
          <Button key="close" onClick={() => setPrintPreviewOpen(false)}>关闭</Button>,
        ]}
        centered
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 20 }}>
            工单：{workOrder.woNo} · 批次：{workOrder.batchNo}
          </Text>
          <div style={{
            display: 'inline-block',
            padding: '16px 24px',
            border: '2px solid #d9d9d9',
            borderRadius: 8,
            background: '#fff',
          }}>
            <FakeBarcode value={workOrder.floatBarcode} />
          </div>
          <div style={{ marginTop: 16 }}>
            <Tag color="blue" style={{ fontSize: 12 }}>GS1 UDI 浮漂码</Tag>
            <Tag color="green" style={{ fontSize: 12 }}>ISO 13485</Tag>
          </div>
          <Divider style={{ margin: '16px 0 12px' }} />
          <Row gutter={[0, 6]} style={{ textAlign: 'left', maxWidth: 360, margin: '0 auto' }}>
            <Col span={10}><Text type="secondary" style={{ fontSize: 12 }}>产品型号：</Text></Col>
            <Col span={14}><Text strong style={{ fontSize: 12 }}>{workOrder.productSpec}</Text></Col>
            <Col span={10}><Text type="secondary" style={{ fontSize: 12 }}>计划数量：</Text></Col>
            <Col span={14}><Text strong style={{ fontSize: 12 }}>{workOrder.planQty} {workOrder.unit || '粒'}</Text></Col>
            <Col span={10}><Text type="secondary" style={{ fontSize: 12 }}>原料批号：</Text></Col>
            <Col span={14}><Text strong style={{ fontSize: 12, fontFamily: 'monospace' }}>{workOrder.materialLotNo}</Text></Col>
            <Col span={10}><Text type="secondary" style={{ fontSize: 12 }}>打印时间：</Text></Col>
            <Col span={14}><Text style={{ fontSize: 12 }}>{new Date().toLocaleString('zh-CN')}</Text></Col>
          </Row>
        </div>
      </Modal>
    </div>
  );
};

export default FloatTicketViewer;

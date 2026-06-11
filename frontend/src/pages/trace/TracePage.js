import React, { useState } from 'react';
import {
  Card, Form, Input, Button, Tabs, Tree, Descriptions, Tag,
  Table, Empty, Spin, message, Space, Typography, Divider, Row, Col, Timeline
} from 'antd';
import {
  SearchOutlined, ApartmentOutlined, BarChartOutlined,
  ArrowRightOutlined, ArrowLeftOutlined, BarcodeOutlined
} from '@ant-design/icons';
import { traceApi } from '../../api';
import dayjs from 'dayjs';

const { TabPane } = Tabs;
const { Text, Title } = Typography;

// Convert flat trace data into tree structure
const buildTree = (nodes, parentKey = null) => {
  return (nodes || [])
    .filter(n => n.parent_lot_no === parentKey || (!n.parent_lot_no && parentKey === null))
    .map(n => ({
      key: n.lot_no,
      title: (
        <Space>
          <Text code>{n.lot_no}</Text>
          <Text type="secondary">{n.material_name}</Text>
          <Tag color="blue">{n.qty} {n.unit_name}</Tag>
          {n.relation_type && <Tag color="purple">{n.relation_type}</Tag>}
        </Space>
      ),
      children: buildTree(nodes, n.lot_no),
    }));
};

const TracePage = () => {
  const [forwardForm] = Form.useForm();
  const [backwardForm] = Form.useForm();
  const [barcodeForm] = Form.useForm();

  const [forwardResult, setForwardResult] = useState(null);
  const [backwardResult, setBackwardResult] = useState(null);
  const [barcodeResult, setBarcodeResult] = useState(null);
  const [loading, setLoading] = useState({ forward: false, backward: false, barcode: false });

  const handleForwardTrace = async (values) => {
    setLoading(l => ({ ...l, forward: true }));
    setForwardResult(null);
    try {
      const res = await traceApi.forwardTrace(values.lot_no);
      if (res.data.code === 0) {
        setForwardResult(res.data.data);
      } else {
        message.warning(res.data.msg || '未找到正向追溯数据');
      }
    } catch { message.error('追溯查询失败'); }
    finally { setLoading(l => ({ ...l, forward: false })); }
  };

  const handleBackwardTrace = async (values) => {
    setLoading(l => ({ ...l, backward: true }));
    setBackwardResult(null);
    try {
      const res = await traceApi.backwardTrace(values.lot_no);
      if (res.data.code === 0) {
        setBackwardResult(res.data.data);
      } else {
        message.warning(res.data.msg || '未找到反向追溯数据');
      }
    } catch { message.error('追溯查询失败'); }
    finally { setLoading(l => ({ ...l, backward: false })); }
  };

  const handleBarcodeQuery = async (values) => {
    setLoading(l => ({ ...l, barcode: true }));
    setBarcodeResult(null);
    try {
      const res = await traceApi.queryBarcode(values.barcode);
      if (res.data.code === 0) {
        setBarcodeResult(res.data.data);
      } else {
        message.warning(res.data.msg || '未找到条码信息');
      }
    } catch { message.error('条码查询失败'); }
    finally { setLoading(l => ({ ...l, barcode: false })); }
  };

  // Timeline view of events
  const renderTimeline = (events) => {
    if (!events || events.length === 0) return <Empty description="暂无事件记录" />;
    return (
      <Timeline mode="left">
        {events.map((ev, idx) => (
          <Timeline.Item
            key={idx}
            label={ev.event_time ? dayjs(ev.event_time).format('MM-DD HH:mm') : ''}
            color={ev.event_type === 'input' ? 'green' : ev.event_type === 'output' ? 'blue' :
                   ev.event_type === 'qc' ? 'orange' : 'gray'}
          >
            <Space direction="vertical" size={0}>
              <Text strong>{ev.event_desc}</Text>
              {ev.operator && <Text type="secondary">操作员: {ev.operator}</Text>}
              {ev.workshop_name && <Text type="secondary">车间: {ev.workshop_name}</Text>}
              {ev.batch_no && <Text type="secondary">批号: {ev.batch_no}</Text>}
            </Space>
          </Timeline.Item>
        ))}
      </Timeline>
    );
  };

  const renderTraceResult = (result, direction) => {
    if (!result) return null;
    const { root_lot, relations, events } = result;
    const isForward = direction === 'forward';

    return (
      <div>
        {root_lot && (
          <Descriptions bordered size="small" column={3} style={{ marginBottom: 16 }}>
            <Descriptions.Item label="批次号">
              <Text code>{root_lot.lot_no}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="物料名称">{root_lot.material_name}</Descriptions.Item>
            <Descriptions.Item label="数量">{root_lot.qty} {root_lot.unit_name}</Descriptions.Item>
            <Descriptions.Item label="仓库">{root_lot.warehouse_name || '-'}</Descriptions.Item>
            <Descriptions.Item label="入库日期">
              {root_lot.receive_date ? dayjs(root_lot.receive_date).format('YYYY-MM-DD') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="供应商">{root_lot.supplier_name || '-'}</Descriptions.Item>
          </Descriptions>
        )}

        <Row gutter={16}>
          <Col span={12}>
            <Card size="small" title={
              <Space>
                {isForward ? <ArrowRightOutlined style={{ color: '#1677ff' }} /> : <ArrowLeftOutlined style={{ color: '#fa8c16' }} />}
                {isForward ? '正向追溯树（物料流向）' : '反向追溯树（物料来源）'}
              </Space>
            }>
              {relations && relations.length > 0 ? (
                <Tree
                  treeData={buildTree(relations)}
                  defaultExpandAll
                  showLine
                />
              ) : (
                <Empty description="无追溯关联" />
              )}
            </Card>
          </Col>
          <Col span={12}>
            <Card size="small" title="生产事件时间线">
              {renderTimeline(events)}
            </Card>
          </Col>
        </Row>

        {relations && relations.length > 0 && (
          <>
            <Divider>关联批次明细</Divider>
            <Table
              size="small"
              dataSource={relations}
              rowKey="lot_no"
              pagination={false}
              columns={[
                { title: '批次号', dataIndex: 'lot_no', render: v => <Text code>{v}</Text> },
                { title: '物料名称', dataIndex: 'material_name' },
                { title: '数量', dataIndex: 'qty', render: (v, r) => `${v} ${r.unit_name || ''}` },
                { title: '关联类型', dataIndex: 'relation_type',
                  render: v => <Tag color={v === 'input' ? 'green' : 'blue'}>{v === 'input' ? '投料' : '产出'}</Tag> },
                { title: '父级批次', dataIndex: 'parent_lot_no', render: v => v ? <Text code>{v}</Text> : '-' },
                { title: '工单号', dataIndex: 'work_order_no' },
              ]}
            />
          </>
        )}
      </div>
    );
  };

  return (
    <div>
      <Tabs defaultActiveKey="forward" type="card">
        {/* Forward Trace */}
        <TabPane
          tab={<Space><ArrowRightOutlined />正向追溯（原料→成品）</Space>}
          key="forward"
        >
          <Card style={{ marginBottom: 16 }}>
            <Form layout="inline" form={forwardForm} onFinish={handleForwardTrace}>
              <Form.Item name="lot_no" label="原料批次号" rules={[{ required: true, message: '请输入批次号' }]}
                style={{ minWidth: 300 }}>
                <Input placeholder="输入原料批次号查询其流向" allowClear
                  prefix={<ApartmentOutlined />} />
              </Form.Item>
              <Form.Item>
                <Button type="primary" icon={<SearchOutlined />} htmlType="submit"
                  loading={loading.forward}>
                  正向追溯
                </Button>
              </Form.Item>
            </Form>
            <div style={{ marginTop: 8, color: '#888', fontSize: 12 }}>
              💡 正向追溯：从原料出发，查询该批次原料被用于生产哪些产品/半成品
            </div>
          </Card>

          <Spin spinning={loading.forward}>
            {forwardResult ? (
              renderTraceResult(forwardResult, 'forward')
            ) : (
              <Card>
                <Empty description="请输入批次号进行正向追溯查询" />
              </Card>
            )}
          </Spin>
        </TabPane>

        {/* Backward Trace */}
        <TabPane
          tab={<Space><ArrowLeftOutlined />反向追溯（成品→原料）</Space>}
          key="backward"
        >
          <Card style={{ marginBottom: 16 }}>
            <Form layout="inline" form={backwardForm} onFinish={handleBackwardTrace}>
              <Form.Item name="lot_no" label="成品批次号" rules={[{ required: true, message: '请输入批次号' }]}
                style={{ minWidth: 300 }}>
                <Input placeholder="输入成品批次号查询其原料来源" allowClear
                  prefix={<ApartmentOutlined />} />
              </Form.Item>
              <Form.Item>
                <Button type="primary" icon={<SearchOutlined />} htmlType="submit"
                  loading={loading.backward} style={{ background: '#fa8c16', borderColor: '#fa8c16' }}>
                  反向追溯
                </Button>
              </Form.Item>
            </Form>
            <div style={{ marginTop: 8, color: '#888', fontSize: 12 }}>
              💡 反向追溯：从成品出发，查询该批次产品所使用的所有原料批次
            </div>
          </Card>

          <Spin spinning={loading.backward}>
            {backwardResult ? (
              renderTraceResult(backwardResult, 'backward')
            ) : (
              <Card>
                <Empty description="请输入批次号进行反向追溯查询" />
              </Card>
            )}
          </Spin>
        </TabPane>

        {/* Barcode Query */}
        <TabPane
          tab={<Space><BarcodeOutlined />条码查询</Space>}
          key="barcode"
        >
          <Card style={{ marginBottom: 16 }}>
            <Form layout="inline" form={barcodeForm} onFinish={handleBarcodeQuery}>
              <Form.Item name="barcode" label="条码/二维码" rules={[{ required: true, message: '请输入条码' }]}
                style={{ minWidth: 300 }}>
                <Input placeholder="扫描或输入条码" allowClear prefix={<BarcodeOutlined />} />
              </Form.Item>
              <Form.Item>
                <Button type="primary" icon={<SearchOutlined />} htmlType="submit"
                  loading={loading.barcode}>
                  查询
                </Button>
              </Form.Item>
            </Form>
            <div style={{ marginTop: 8, color: '#888', fontSize: 12 }}>
              💡 条码查询：通过扫描或输入产品/物料条码查询其完整信息
            </div>
          </Card>

          <Spin spinning={loading.barcode}>
            {barcodeResult ? (
              <Card>
                <Descriptions bordered size="small" column={2} title="条码信息">
                  <Descriptions.Item label="条码">{barcodeResult.barcode}</Descriptions.Item>
                  <Descriptions.Item label="批次号">
                    <Text code>{barcodeResult.lot_no}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="物料编码">{barcodeResult.material_code}</Descriptions.Item>
                  <Descriptions.Item label="物料名称">{barcodeResult.material_name}</Descriptions.Item>
                  <Descriptions.Item label="数量">{barcodeResult.qty} {barcodeResult.unit_name}</Descriptions.Item>
                  <Descriptions.Item label="生产日期">
                    {barcodeResult.produce_date ? dayjs(barcodeResult.produce_date).format('YYYY-MM-DD') : '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="有效期">
                    {barcodeResult.expire_date ? dayjs(barcodeResult.expire_date).format('YYYY-MM-DD') : '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="工单号">{barcodeResult.work_order_no || '-'}</Descriptions.Item>
                  {barcodeResult.remarks && (
                    <Descriptions.Item label="备注" span={2}>{barcodeResult.remarks}</Descriptions.Item>
                  )}
                </Descriptions>
              </Card>
            ) : (
              <Card>
                <Empty description="请输入条码进行查询" />
              </Card>
            )}
          </Spin>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default TracePage;

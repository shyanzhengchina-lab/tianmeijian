/**
 * 生产订单列表组件
 * 基于现有页面重构，保持相同功能
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  Table,
  Card,
  Form,
  Button,
  Space,
  Modal,
  Input,
  Select,
  DatePicker,
  message,
  Upload,
  Popconfirm,
  Tooltip,
  Divider,
  Tag,
  Statistic,
  Row,
  Col,
  Drawer,
  Descriptions,
  Tabs,
  Collapse
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  DeleteOutlined,
  EditOutlined,
  FileTextOutlined,
  ExportOutlined,
  ImportOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  EyeOutlined,
  DownloadOutlined,
  PlayCircleOutlined,
  StopOutlined,
  RocketOutlined,
  CopyOutlined,
  ArrowDownOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useProductionOrderStore } from '../store';
import { PO_STATUS_MAP, PO_PRIORITY_MAP, type ProductionOrder, type POLineItem } from '../types';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { TextArea } = Input;

/**
 * 搜索表单组件
 */
const SearchForm: React.FC = () => {
  const [form] = Form.useForm();
  const { filters, setFilters, loadProductionOrders } = useProductionOrderStore();

  const handleSearch = () => {
    const values = form.getFieldsValue();
    const finalFilters = {
      ...values,
      deliveryDateStart: values.deliveryDateRange?.[0]?.format('YYYY-MM-DD'),
      deliveryDateEnd: values.deliveryDateRange?.[1]?.format('YYYY-MM-DD'),
    };
    delete finalFilters.deliveryDateRange;
    setFilters(finalFilters);
    loadProductionOrders();
  };

  const handleReset = () => {
    form.resetFields();
    setFilters({});
    loadProductionOrders();
  };

  return (
    <Card size="small" style={{ marginBottom: 16 }}>
      <Form form={form} layout="inline">
        <Form.Item name="orderNo" label="订单编号">
          <Input placeholder="请输入订单编号" style={{ width: 200 }} allowClear />
        </Form.Item>
        <Form.Item name="productCode" label="产品编码">
          <Input placeholder="请输入产品编码" style={{ width: 180 }} allowClear />
        </Form.Item>
        <Form.Item name="productName" label="产品名称">
          <Input placeholder="请输入产品名称" style={{ width: 180 }} allowClear />
        </Form.Item>
        <Form.Item name="status" label="状态">
          <Select placeholder="请选择状态" style={{ width: 120 }} allowClear>
            {Object.entries(PO_STATUS_MAP).map(([key, value]) => (
              <Option key={key} value={key}>{value.label}</Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item name="priority" label="优先级">
          <Select placeholder="请选择优先级" style={{ width: 120 }} allowClear>
            {Object.entries(PO_PRIORITY_MAP).map(([key, value]) => (
              <Option key={key} value={key}>{value.label}</Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item name="soNo" label="销售订单">
          <Input placeholder="请输入销售订单号" style={{ width: 180 }} allowClear />
        </Form.Item>
        <Form.Item name="deliveryDateRange" label="交货日期">
          <RangePicker style={{ width: 240 }} />
        </Form.Item>
        <Form.Item name="isAudited" label="审核状态">
          <Select placeholder="请选择审核状态" style={{ width: 120 }} allowClear>
            <Option value={true}>已审核</Option>
            <Option value={false}>未审核</Option>
          </Select>
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
              查询
            </Button>
            <Button icon={<ReloadOutlined />} onClick={handleReset}>
              重置
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};

/**
 * 生产订单表单弹窗组件
 */
const ProductionOrderForm: React.FC<{
  visible: boolean;
  mode: 'create' | 'edit';
  initialValues?: ProductionOrder;
  onSubmit: (values: any) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}> = ({ visible, mode, initialValues, onSubmit, onCancel, loading }) => {
  const [form] = Form.useForm();
  const [lineItems, setLineItems] = useState<POLineItem[]>([]);
  const [isMultiSpec, setIsMultiSpec] = useState(false);

  useEffect(() => {
    if (visible) {
      if (mode === 'edit' && initialValues) {
        form.setFieldsValue({
          orderNo: initialValues.orderNo,
          productCode: initialValues.productCode,
          productName: initialValues.productName,
          productSpec: initialValues.productSpec,
          bomVersion: initialValues.bomVersion,
          routingCode: initialValues.routingCode,
          totalQty: initialValues.totalQty,
          priority: initialValues.priority,
          deliveryDate: dayjs(initialValues.deliveryDate),
          remark: initialValues.remark,
        });
        if (initialValues.lineItems && initialValues.lineItems.length > 0) {
          setIsMultiSpec(true);
          setLineItems(initialValues.lineItems);
        }
      } else {
        form.resetFields();
        setLineItems([]);
        setIsMultiSpec(false);
      }
    }
  }, [visible, mode, initialValues, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const finalValues = {
        ...values,
        deliveryDate: values.deliveryDate.format('YYYY-MM-DD'),
        lineItems: isMultiSpec ? lineItems : undefined,
      };
      await onSubmit(finalValues);
      form.resetFields();
      setLineItems([]);
      setIsMultiSpec(false);
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  const addLineItem = () => {
    setLineItems([...lineItems, {
      id: Date.now().toString(),
      lineNo: lineItems.length + 1,
      productCode: '',
      productSpec: '',
      planQty: 0,
      remark: '',
    }]);
  };

  const updateLineItem = (index: number, field: keyof POLineItem, value: any) => {
    const newItems = [...lineItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setLineItems(newItems);
  };

  const removeLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  return (
    <Modal
      title={mode === 'create' ? '新建生产订单' : '编辑生产订单'}
      open={visible}
      onOk={handleSubmit}
      onCancel={onCancel}
      confirmLoading={loading}
      width={800}
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="orderNo"
              label="订单编号"
              rules={[{ required: true, message: '请输入订单编号' }]}
            >
              <Input placeholder="请输入订单编号" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="priority"
              label="优先级"
              initialValue="NORMAL"
            >
              <Select>
                {Object.entries(PO_PRIORITY_MAP).map(([key, value]) => (
                  <Option key={key} value={key}>{value.label}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="productCode"
              label="产品编码"
              rules={[{ required: true, message: '请输入产品编码' }]}
            >
              <Input placeholder="请输入产品编码" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="productName"
              label="产品名称"
              rules={[{ required: true, message: '请输入产品名称' }]}
            >
              <Input placeholder="请输入产品名称" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="productSpec"
              label="产品规格"
              rules={[{ required: true, message: '请输入产品规格' }]}
            >
              <Input placeholder="请输入产品规格" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="bomVersion"
              label="BOM版本"
              rules={[{ required: true, message: '请输入BOM版本' }]}
            >
              <Input placeholder="请输入BOM版本" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="routingCode"
              label="工艺路径"
              rules={[{ required: true, message: '请输入工艺路径' }]}
            >
              <Input placeholder="请输入工艺路径" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="totalQty"
              label="订单总量"
              rules={[{ required: true, message: '请输入订单总量' }]}
            >
              <Input type="number" placeholder="请输入订单总量" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="deliveryDate"
              label="交货日期"
              rules={[{ required: true, message: '请选择交货日期' }]}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="多规格订单">
          <Button
            type="dashed"
            onClick={() => setIsMultiSpec(!isMultiSpec)}
            style={{ width: '100%' }}
          >
            {isMultiSpec ? '关闭多规格' : '开启多规格'}
          </Button>
        </Form.Item>

        {isMultiSpec && (
          <Form.Item label="规格明细">
            <div style={{ marginBottom: 16 }}>
              <Button type="dashed" onClick={addLineItem} icon={<PlusOutlined />}>
                添加规格明细
              </Button>
            </div>
            <Table
              size="small"
              pagination={false}
              dataSource={lineItems}
              rowKey="id"
              columns={[
                {
                  title: '行号',
                  dataIndex: 'lineNo',
                  width: 80,
                },
                {
                  title: '产品编码',
                  width: 150,
                  render: (_, record, index) => (
                    <Input
                      value={record.productCode}
                      onChange={(e) => updateLineItem(index, 'productCode', e.target.value)}
                    />
                  ),
                },
                {
                  title: '产品规格',
                  width: 150,
                  render: (_, record, index) => (
                    <Input
                      value={record.productSpec}
                      onChange={(e) => updateLineItem(index, 'productSpec', e.target.value)}
                    />
                  ),
                },
                {
                  title: '计划数量',
                  width: 120,
                  render: (_, record, index) => (
                    <Input
                      type="number"
                      value={record.planQty}
                      onChange={(e) => updateLineItem(index, 'planQty', Number(e.target.value))}
                    />
                  ),
                },
                {
                  title: '操作',
                  width: 80,
                  render: (_, record, index) => (
                    <Button
                      type="text"
                      danger
                      size="small"
                      onClick={() => removeLineItem(index)}
                    >
                      删除
                    </Button>
                  ),
                },
              ]}
            />
          </Form.Item>
        )}

        <Form.Item
          name="remark"
          label="备注"
        >
          <TextArea rows={4} placeholder="请输入备注" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

/**
 * 生产订单详情抽屉组件
 */
const ProductionOrderDetailDrawer: React.FC<{
  visible: boolean;
  productionOrder: ProductionOrder | null;
  onClose: () => void;
}> = ({ visible, productionOrder, onClose }) => {
  if (!productionOrder) return null;

  return (
    <Drawer
      title={`生产订单详情 - ${productionOrder.orderNo}`}
      open={visible}
      onClose={onClose}
      width={800}
    >
      <Descriptions column={2} bordered>
        <Descriptions.Item label="订单编号" span={2}>
          {productionOrder.orderNo}
        </Descriptions.Item>
        <Descriptions.Item label="销售订单">
          {productionOrder.soNo || '-'}
        </Descriptions.Item>
        <Descriptions.Item label="优先级">
          <Tag color={PO_PRIORITY_MAP[productionOrder.priority]?.color ?? 'default'}>
            {PO_PRIORITY_MAP[productionOrder.priority]?.label ?? String(productionOrder.priority ?? '-')}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="产品编码">
          {productionOrder.productCode}
        </Descriptions.Item>
        <Descriptions.Item label="产品名称">
          {productionOrder.productName}
        </Descriptions.Item>
        <Descriptions.Item label="产品规格">
          {productionOrder.productSpec}
        </Descriptions.Item>
        <Descriptions.Item label="BOM版本">
          {productionOrder.bomVersion}
        </Descriptions.Item>
        <Descriptions.Item label="工艺路径">
          {productionOrder.routingCode}
        </Descriptions.Item>
        <Descriptions.Item label="订单总量">
          {productionOrder.totalQty.toLocaleString()}
        </Descriptions.Item>
        <Descriptions.Item label="完成数量">
          {productionOrder.completedQty.toLocaleString()}
        </Descriptions.Item>
        <Descriptions.Item label="报废数量">
          {productionOrder.scrapQty.toLocaleString()}
        </Descriptions.Item>
        <Descriptions.Item label="状态">
          <Tag color={(PO_STATUS_MAP[productionOrder.status]?.badge ?? 'default') as any}>
            {PO_STATUS_MAP[productionOrder.status]?.label ?? String(productionOrder.status ?? '-')}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="交货日期">
          {dayjs(productionOrder.deliveryDate).format('YYYY-MM-DD')}
        </Descriptions.Item>
        <Descriptions.Item label="发布日期">
          {productionOrder.releaseDate
            ? dayjs(productionOrder.releaseDate).format('YYYY-MM-DD HH:mm:ss')
            : '-'}
        </Descriptions.Item>
        <Descriptions.Item label="审核状态">
          {productionOrder.isAudited ? (
            <Tag color="success">已审核</Tag>
          ) : (
            <Tag color="default">未审核</Tag>
          )}
        </Descriptions.Item>
        <Descriptions.Item label="审核人">
          {productionOrder.auditedBy || '-'}
        </Descriptions.Item>
        <Descriptions.Item label="审核时间">
          {productionOrder.auditedAt
            ? dayjs(productionOrder.auditedAt).format('YYYY-MM-DD HH:mm:ss')
            : '-'}
        </Descriptions.Item>
        <Descriptions.Item label="创建人">
          {productionOrder.createdBy}
        </Descriptions.Item>
        <Descriptions.Item label="创建时间">
          {dayjs(productionOrder.createdAt).format('YYYY-MM-DD HH:mm:ss')}
        </Descriptions.Item>
        <Descriptions.Item label="更新时间">
          {dayjs(productionOrder.updatedAt).format('YYYY-MM-DD HH:mm:ss')}
        </Descriptions.Item>
        <Descriptions.Item label="备注" span={2}>
          {productionOrder.remark || '-'}
        </Descriptions.Item>
      </Descriptions>

      {productionOrder.lineItems && productionOrder.lineItems.length > 0 && (
        <>
          <Divider orientation={"left" as any}>规格明细</Divider>
          <Table
          size="small"
          pagination={false}
          dataSource={productionOrder.lineItems}
          rowKey="id"
          columns={[
            {
              title: '行号',
              dataIndex: 'lineNo',
              width: 80,
            },
            {
              title: '产品编码',
              dataIndex: 'productCode',
            },
            {
              title: '产品规格',
              dataIndex: 'productSpec',
            },
            {
              title: '计划数量',
              dataIndex: 'planQty',
              render: (value: number) => value.toLocaleString(),
            },
            {
              title: '实际数量',
              dataIndex: 'actualQty',
              render: (value?: number) => value ? value.toLocaleString() : '-',
            },
            {
              title: '备注',
              dataIndex: 'remark',
              render: (value?: string) => value || '-',
            },
          ]}
        />
        </>
      )}

      {productionOrder.relatedWOs && productionOrder.relatedWOs.length > 0 && (
        <>
          <Divider orientation={"left" as any}>关联工单</Divider>
          <Table
          size="small"
          pagination={false}
          dataSource={productionOrder.relatedWOs}
          rowKey="id"
          columns={[
            {
              title: '工单号',
              dataIndex: 'woNo',
            },
            {
              title: '状态',
              dataIndex: 'status',
              render: (status: string) => (
                <Tag>{status}</Tag>
              ),
            },
            {
              title: '计划数量',
              dataIndex: 'planQty',
              render: (value: number) => value.toLocaleString(),
            },
            {
              title: '实际数量',
              dataIndex: 'actualQty',
              render: (value?: number) => value ? value.toLocaleString() : '-',
            },
          ]}
        />
        </>
      )}
    </Drawer>
  );
};

/**
 * 生产订单列表主组件
 */
const ProductionOrderList: React.FC = () => {
  const {
    productionOrders,
    selectedIds,
    pagination,
    loading,
    statistics,
    loadProductionOrders,
    loadStatistics,
    createProductionOrder,
    updateProductionOrder,
    deleteProductionOrders,
    releaseProductionOrder,
    auditProductionOrder,
    unAuditProductionOrder,
    closeProductionOrder,
    reopenProductionOrder,
    pushWorkOrder,
    pushWorkOrders,
    importProductionOrders,
    exportProductionOrders,
    setSelectedIds,
    setPagination,
    setLoading,
  } = useProductionOrderStore();

  const [formModalVisible, setFormModalVisible] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [currentProductionOrder, setCurrentProductionOrder] = useState<ProductionOrder | null>(null);
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const uploadRef = useRef<any>(null);

  // 初始化加载
  useEffect(() => {
    loadProductionOrders();
    loadStatistics();
  }, [loadProductionOrders, loadStatistics]);

  // 表格列定义
  const columns = [
    {
      title: '订单编号',
      dataIndex: 'orderNo',
      width: 150,
      fixed: 'left' as const,
      render: (text: string) => <a onClick={() => handleView(text)}>{text}</a>,
    },
    {
      title: '销售订单',
      dataIndex: 'soNo',
      width: 120,
      render: (text?: string) => text || '-',
    },
    {
      title: '产品编码',
      dataIndex: 'productCode',
      width: 150,
    },
    {
      title: '产品名称',
      dataIndex: 'productName',
      width: 150,
    },
    {
      title: '产品规格',
      dataIndex: 'productSpec',
      width: 150,
    },
    {
      title: '工艺路径',
      dataIndex: 'routingCode',
      width: 150,
    },
    {
      title: '订单总量',
      dataIndex: 'totalQty',
      width: 100,
      render: (value: number) => value.toLocaleString(),
    },
    {
      title: '完成数量',
      dataIndex: 'completedQty',
      width: 100,
      render: (value: number) => value.toLocaleString(),
    },
    {
      title: '报废数量',
      dataIndex: 'scrapQty',
      width: 100,
      render: (value: number) => value.toLocaleString(),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={(PO_STATUS_MAP as any)[status].badge}>{(PO_STATUS_MAP as any)[status].label}</Tag>
      ),
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      width: 80,
      render: (priority: string) => (
        <Tag color={(PO_PRIORITY_MAP as any)[priority].color}>{(PO_PRIORITY_MAP as any)[priority].label}</Tag>
      ),
    },
    {
      title: '交货日期',
      dataIndex: 'deliveryDate',
      width: 120,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '审核状态',
      dataIndex: 'isAudited',
      width: 100,
      render: (isAudited: boolean) => (
        isAudited ? (
          <Tag color="success" icon={<CheckCircleOutlined />}>已审核</Tag>
        ) : (
          <Tag color="default" icon={<CloseCircleOutlined />}>未审核</Tag>
        )
      ),
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right' as const,
      width: 280,
      render: (_: any, record: ProductionOrder) => (
        <Space size="small">
          <Tooltip title="查看">
            <Button
              type="text"
              icon={<EyeOutlined />}
              size="small"
              onClick={() => handleView(record.orderNo)}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button
              type="text"
              icon={<EditOutlined />}
              size="small"
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          {record.status === 'OPEN' && (
            <Tooltip title="发布">
              <Button
                type="text"
                icon={<RocketOutlined />}
                size="small"
                onClick={() => handleRelease(record.id)}
              />
            </Tooltip>
          )}
          {!record.isAudited && (
            <Tooltip title="审核">
              <Button
                type="text"
                icon={<CheckCircleOutlined />}
                size="small"
                onClick={() => handleAudit(record.id)}
              />
            </Tooltip>
          )}
          {record.isAudited && (
            <Tooltip title="反审核">
              <Button
                type="text"
                icon={<SyncOutlined />}
                size="small"
                onClick={() => handleUnAudit(record.id)}
              />
            </Tooltip>
          )}
          {['RELEASED', 'IN_PROGRESS', 'COMPLETED'].includes(record.status) && (
            <Tooltip title="关闭">
              <Button
                type="text"
                icon={<StopOutlined />}
                size="small"
                onClick={() => handleClose(record.id)}
              />
            </Tooltip>
          )}
          {record.status === 'CLOSED' && (
            <Tooltip title="重启">
              <Button
                type="text"
                icon={<PlayCircleOutlined />}
                size="small"
                onClick={() => handleReopen(record.id)}
              />
            </Tooltip>
          )}
          <Tooltip title="下推工单">
            <Button
              type="text"
              icon={<ArrowDownOutlined />}
              size="small"
              onClick={() => handlePushWorkOrder(record.id)}
            />
          </Tooltip>
          <Popconfirm
            title="确定删除该生产订单吗?"
            onConfirm={() => handleDelete([record.id])}
            okText="确定"
            cancelText="取消"
          >
            <Tooltip title="删除">
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                size="small"
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 操作处理函数
  const handleCreate = () => {
    setFormMode('create');
    setCurrentProductionOrder(null);
    setFormModalVisible(true);
  };

  const handleEdit = (record: ProductionOrder) => {
    setFormMode('edit');
    setCurrentProductionOrder(record);
    setFormModalVisible(true);
  };

  const handleView = async (orderNo: string) => {
    try {
      const productionOrder = productionOrders.find(po => po.orderNo === orderNo);
      if (productionOrder) {
        setCurrentProductionOrder(productionOrder);
        setDetailDrawerVisible(true);
      }
    } catch (error) {
      message.error('加载订单详情失败');
    }
  };

  const handleRelease = async (id: string) => {
    try {
      await releaseProductionOrder(id);
      message.success('发布成功');
    } catch (error) {
      message.error('发布失败');
    }
  };

  const handleAudit = async (id: string) => {
    try {
      await auditProductionOrder(id, '当前用户');
      message.success('审核成功');
    } catch (error) {
      message.error('审核失败');
    }
  };

  const handleUnAudit = async (id: string) => {
    try {
      await unAuditProductionOrder(id);
      message.success('反审核成功');
    } catch (error) {
      message.error('反审核失败');
    }
  };

  const handleClose = async (id: string) => {
    try {
      await closeProductionOrder(id);
      message.success('关闭成功');
    } catch (error) {
      message.error('关闭失败');
    }
  };

  const handleReopen = async (id: string) => {
    try {
      await reopenProductionOrder(id);
      message.success('重启成功');
    } catch (error) {
      message.error('重启失败');
    }
  };

  const handlePushWorkOrder = async (id: string) => {
    try {
      await pushWorkOrder(id);
      message.success('下推工单成功');
    } catch (error) {
      message.error('下推工单失败');
    }
  };

  const handleDelete = async (ids: string[]) => {
    try {
      await deleteProductionOrders(ids);
      message.success('删除成功');
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleBatchDelete = () => {
    if (selectedIds.length === 0) {
      message.warning('请选择要删除的生产订单');
      return;
    }
    handleDelete(selectedIds);
  };

  const handleBatchRelease = async () => {
    if (selectedIds.length === 0) {
      message.warning('请选择要发布的生产订单');
      return;
    }
    try {
      message.loading('批量发布中...');
      await Promise.all(selectedIds.map(id => releaseProductionOrder(id)));
      message.success('批量发布成功');
      setSelectedIds([]);
    } catch (error) {
      message.error('批量发布失败');
    }
  };

  const handleBatchPushWorkOrder = async () => {
    if (selectedIds.length === 0) {
      message.warning('请选择要下推工单的生产订单');
      return;
    }
    try {
      message.loading('批量下推工单中...');
      await pushWorkOrders(selectedIds);
      message.success('批量下推工单成功');
      setSelectedIds([]);
    } catch (error) {
      message.error('批量下推工单失败');
    }
  };

  const handleFormSubmit = async (values: any) => {
    try {
      if (formMode === 'create') {
        await createProductionOrder(values);
        message.success('创建成功');
      } else {
        await updateProductionOrder({ id: currentProductionOrder!.id, ...values });
        message.success('更新成功');
      }
      setFormModalVisible(false);
    } catch (error) {
      message.error(formMode === 'create' ? '创建失败' : '更新失败');
    }
  };

  const handleImport = async (file: File) => {
    try {
      message.loading('导入中...');
      const result = await importProductionOrders(file);
      message.success(`导入成功：成功 ${result.success} 条，失败 ${result.failed} 条`);
    } catch (error) {
      message.error('导入失败');
    }
    return false;
  };

  const handleExport = async () => {
    try {
      message.loading('导出中...');
      const blob = await exportProductionOrders(useProductionOrderStore.getState().filters);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `生产订单_${dayjs().format('YYYYMMDDHHmmss')}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      message.success('导出成功');
    } catch (error) {
      message.error('导出失败');
    }
  };

  const handleTableChange = (page: number, pageSize: number) => {
    setPagination({ current: page, pageSize });
    loadProductionOrders({ current: page, pageSize });
  };

  const rowSelection = {
    selectedRowKeys: selectedIds,
    onChange: (selectedRowKeys: React.Key[]) => {
      setSelectedIds(selectedRowKeys as string[]);
    },
  };

  return (
    <div style={{ padding: 16 }}>
      {/* 统计卡片 */}
      {statistics && (
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={4}>
            <Card>
              <Statistic
                title="总订单数"
                value={statistics.totalCount}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card>
              <Statistic
                title="未发布"
                value={statistics.openCount}
                valueStyle={{ color: '#cf1322' }}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card>
              <Statistic
                title="生产中"
                value={statistics.inProgressCount}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card>
              <Statistic
                title="已完成"
                value={statistics.completedCount}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card>
              <Statistic
                title="已关闭"
                value={statistics.closedCount}
                valueStyle={{ color: '#8c8c8c' }}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card>
              <Statistic
                title="高优先级"
                value={statistics.priorityStats.HIGH || 0}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* 搜索表单 */}
      <SearchForm />

      {/* 操作栏 */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
          >
            新建
          </Button>
          <Button
            icon={<DeleteOutlined />}
            onClick={handleBatchDelete}
            disabled={selectedIds.length === 0}
          >
            批量删除
          </Button>
          <Button
            icon={<RocketOutlined />}
            onClick={handleBatchRelease}
            disabled={selectedIds.length === 0}
          >
            批量发布
          </Button>
          <Button
            icon={<ArrowDownOutlined />}
            onClick={handleBatchPushWorkOrder}
            disabled={selectedIds.length === 0}
          >
            批量下推工单
          </Button>
          <Upload
            ref={uploadRef}
            showUploadList={false}
            beforeUpload={handleImport}
          >
            <Button icon={<ImportOutlined />}>
              导入
            </Button>
          </Upload>
          <Button
            icon={<ExportOutlined />}
            onClick={handleExport}
          >
            导出
          </Button>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => loadProductionOrders()}
          >
            刷新
          </Button>
        </Space>
        <span style={{ marginLeft: 16 }}>
          已选择 {selectedIds.length} 项
        </span>
      </Card>

      {/* 数据表格 */}
      <Card>
        <Table
          columns={columns}
          dataSource={productionOrders}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: handleTableChange,
            onShowSizeChange: handleTableChange,
          }}
          rowSelection={rowSelection}
          scroll={{ x: 2000 }}
          size="middle"
        />
      </Card>

      {/* 表单弹窗 */}
      <ProductionOrderForm
        visible={formModalVisible}
        mode={formMode}
        initialValues={currentProductionOrder ?? undefined}
        onSubmit={handleFormSubmit}
        onCancel={() => setFormModalVisible(false)}
        loading={loading}
      />

      {/* 详情抽屉 */}
      <ProductionOrderDetailDrawer
        visible={detailDrawerVisible}
        productionOrder={currentProductionOrder}
        onClose={() => setDetailDrawerVisible(false)}
      />
    </div>
  );
};

export default ProductionOrderList;

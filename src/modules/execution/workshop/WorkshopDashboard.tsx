import React, { useEffect, useCallback, useMemo, useState } from 'react';
import { Card, Row, Col, Statistic, Progress, Tag, Badge, Space, Button, Tooltip, Modal, Descriptions, message} from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  StopOutlined,
  PlayCircleOutlined,
  ExclamationCircleOutlined,
  SyncOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { DataTable as DataTableBase } from '../../../shared/components/DataTable';
import { SimpleStatusBadge } from '../../../shared/components/StatusBadge';
import { useWebSocket, useDeviceStatus, useProductionProgress } from '../../../shared/hooks/useWebSocket';
import { getCurrentFactoryId } from '@/stores/factoryStore';
/**
 * 车间看板组件
 * 实时显示工单执行情况、设备状态、生产进度等
 */


// 导入共享组件
const DataTable = DataTableBase as any;

// 导入hooks

/**
 * 看板数据接口
 */
export interface WorkshopDashboardData {
  // 工单执行统计
  executingOrders: number;
  waitingOrders: number;
  completedOrders: number;
  delayedOrders: number;
  todayCompleted: number;
  todayDelayed: number;

  // 设备运行状态
  totalDevices: number;
  onlineDevices: number;
  offlineDevices: number;
  warningDevices: number;
  errorDevices: number;
  overallOee: number; // 设备综合效率
}

/**
 * 工单执行卡片数据
 */
export interface WorkOrderExecutionCard {
  id: string;
  woNo: string;
  productName: string;
  status: string;
  progress: number;
  operator: string;
  workstation: string;
  planStartTime: string;
  actualStartTime: string | null;
  planEndTime: string;
  actualEndTime: string | null;
  priority: string;
}

/**
 * 设备状态卡片数据
 */
export interface DeviceStatusCard {
  deviceId: string;
  deviceName: string;
  deviceType: string;
  status: 'online' | 'offline' | 'warning' | 'error';
  temperature?: number;
  speed?: number;
  pressure?: number;
  statusText: string;
  lastUpdate: string;
}

/**
 * 生产进度跟踪数据
 */
export interface ProductionProgressCard {
  workOrderId: string;
  workOrderNo: string;
  productName: string;
  planQty: number;
  completedQty: number;
  progress: number;
  eta: string;
  operator: string;
  workstation: string;
  planStartTime?: string;
  actualStartTime?: string | null;
  planEndTime?: string;
  actualEndTime?: string | null;
  priority?: string;
}

/**
 * WorkshopDashboard组件
 */
function WorkshopDashboard() {
  const { connected } = useWebSocket({
    autoConnect: true,
    url: 'ws://localhost:8080/workshop',
  });

  const { deviceStatus, updateDeviceStatus } = useDeviceStatus();
  const { progress, updateProgress } = useProductionProgress();

  // State
  const [dashboardData, setDashboardData] = useState<WorkshopDashboardData>({
    executingOrders: 0,
    waitingOrders: 0,
    completedOrders: 0,
    delayedOrders: 0,
    todayCompleted: 0,
    todayDelayed: 0,
    totalDevices: 0,
    onlineDevices: 0,
    offlineDevices: 0,
    warningDevices: 0,
    errorDevices: 0,
    overallOee: 0,
  });

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'execution' | 'devices' | 'progress'>('overview');
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrderExecutionCard | null>(null);
  const [showDeviceDetail, setShowDeviceDetail] = useState(false);

  // 模拟加载数据
  useEffect(() => {
    loadDashboardData();
  }, []);

  // 订阅WebSocket消息
  useEffect(() => {
    if (!connected) return;

    // 模拟接收实时数据更新
    const mockUpdateDashboard = () => {
      setDashboardData(prev => ({
        ...prev,
        executingOrders: prev.executingOrders + 1,
        overallOee: 85.5 + Math.random() * 5,
      }));
    };

    const timer = setInterval(mockUpdateDashboard, 5000); // 每5秒更新一次

    return () => {
      clearInterval(timer);
      console.log('WebSocket定时器已清理');
    };
  }, [connected]);

  // 加载看板数据
  const loadDashboardData = useCallback(async () => {
    try {
      // TODO: 调用API加载真实数据
      // const response = await workshopApi.getDashboardData();

      // 模拟数据加载
      setTimeout(() => {
        const mockData: WorkshopDashboardData = {
          executingOrders: 12,
          waitingOrders: 3,
          completedOrders: 45,
          delayedOrders: 2,
          todayCompleted: 8,
          todayDelayed: 1,
          totalDevices: 28,
          onlineDevices: 25,
          offlineDevices: 2,
          warningDevices: 1,
          errorDevices: 0,
          overallOee: 87.5,
        };

        setDashboardData(mockData);
      }, 1000);
    } catch (error: any) {
      console.error('加载看板数据失败:', error);
    }
  }, []);

  // 刷新数据
  const handleRefresh = useCallback(() => {
    loadDashboardData();
    message.success('数据刷新成功');
  }, [loadDashboardData]);

  // 查看工单详情
  const handleViewWorkOrder = useCallback((workOrder: WorkOrderExecutionCard) => {
    setSelectedWorkOrder(workOrder);
  }, []);

  // 关闭工单详情
  const handleCloseWorkOrder = useCallback(() => {
    setSelectedWorkOrder(null);
  }, []);

  // 查看设备详情
  const handleViewDevice = useCallback((device: DeviceStatusCard) => {
    // 可以打开设备详情抽屉
    console.log('查看设备详情:', device);
  }, []);

  // 工单执行卡片数据
  const executingWorkOrders = useMemo(() => [
    {
      id: 'wo-001',
      woNo: 'WO202505001',
      productName: '阿莫西林胶囊',
      status: 'IN_PROGRESS',
      progress: 45,
      operator: '张三',
      workstation: 'WS001',
      planStartTime: '2026-05-02 08:00',
      actualStartTime: '2026-05-02 08:15',
      planEndTime: '2026-05-02 12:00',
      priority: 'HIGH',
    },
    {
      id: 'wo-002',
      woNo: 'WO202505002',
      productName: '对乙酰氨基酚片',
      status: 'IN_PROGRESS',
      progress: 78,
      operator: '李四',
      workstation: 'WS002',
      planStartTime: '2026-05-02 09:00',
      actualStartTime: '2026-05-02 09:30',
      planEndTime: '2026-05-02 14:00',
      priority: 'NORMAL',
    },
    {
      id: 'wo-003',
      woNo: 'WO202505003',
      productName: '布洛芬分散片',
      status: 'IN_PROGRESS',
      progress: 23,
      operator: '王五',
      workstation: 'WS003',
      planStartTime: '2026-05-02 10:00',
      actualStartTime: '2026-05-02 10:45',
      planEndTime: '2026-05-02 18:00',
      priority: 'HIGH',
    },
  ], []);

  // 设备状态卡片数据
  const deviceStatusCards = useMemo((): DeviceStatusCard[] => [
    {
      deviceId: 'dev-001',
      deviceName: '压片机-1',
      deviceType: '压片设备',
      status: 'online',
      temperature: 45,
      speed: 120,
      statusText: '运行正常',
      lastUpdate: '2026-05-02 14:32',
    },
    {
      deviceId: 'dev-002',
      deviceName: '压片机-2',
      deviceType: '压片设备',
      status: 'online',
      temperature: 48,
      speed: 125,
      statusText: '运行正常',
      lastUpdate: '2026-05-02 14:31',
    },
    {
      deviceId: 'dev-003',
      deviceName: '包装机-1',
      deviceType: '包装设备',
      status: 'warning',
      temperature: 52,
      speed: 0,
      statusText: '温度偏高',
      lastUpdate: '2026-05-02 13:45',
    },
    {
      deviceId: 'dev-004',
      deviceName: '混合机-1',
      deviceType: '混合设备',
      status: 'offline',
      temperature: 25,
      speed: 0,
      statusText: '设备离线',
      lastUpdate: '2026-05-02 10:20',
    },
    {
      deviceId: 'dev-005',
      deviceName: '涂布机-1',
      deviceType: '涂布设备',
      status: 'error',
      temperature: 60,
      speed: 0,
      statusText: '设备故障',
      lastUpdate: '2026-05-02 08:15',
    },
    {
      deviceId: 'dev-006',
      deviceName: '干燥机-1',
      deviceType: '干燥设备',
      status: 'online',
      temperature: 65,
      speed: 95,
      statusText: '运行正常',
      lastUpdate: '2026-05-02 14:28',
    },
    {
      deviceId: 'dev-007',
      deviceName: '干燥机-2',
      deviceType: '干燥设备',
      status: 'online',
      temperature: 66,
      speed: 98,
      statusText: '运行正常',
      lastUpdate: '2026-05-02 14:33',
    },
  ], []);

  // 生产进度卡片数据
  const productionProgressCards = useMemo((): ProductionProgressCard[] => [
    {
      workOrderId: 'wo-001',
      workOrderNo: 'WO202505001',
      productName: '阿莫西林胶囊',
      planQty: 10000,
      completedQty: 4500,
      progress: 45,
      eta: '2026-05-02 11:30',
      operator: '张三',
      workstation: 'WS001',
    },
    {
      workOrderId: 'wo-002',
      workOrderNo: 'WO202505002',
      productName: '对乙酰氨基酚片',
      planQty: 8000,
      completedQty: 6240,
      progress: 78,
      eta: '2026-05-02 11:15',
      operator: '李四',
      workstation: 'WS002',
    },
    {
      workOrderId: 'wo-003',
      workOrderNo: 'WO202505003',
      productName: '布洛芬分散片',
      planQty: 12000,
      completedQty: 2760,
      progress: 23,
      eta: '2026-05-02 17:45',
      operator: '王五',
      workstation: 'WS003',
    },
  ], []);

  return (
    <div style={{ padding: '24px', background: '#f0f2f5' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 顶部标题栏 */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}>
          <h1 style={{ fontSize: 24, fontWeight: 600, margin: 0 }}>
            车间看板
          </h1>
          <Space>
            <Badge dot={!connected} count={connected ? 0 : 1} status={connected ? 'success' : 'error'}>
              <Tooltip title={connected ? 'WebSocket已连接' : 'WebSocket未连接'}>
                <SyncOutlined spin={!connected} style={{ fontSize: 20 }} />
              </Tooltip>
            </Badge>
            <Button
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
            >
              刷新
            </Button>
          </Space>
        </div>

        {/* 总览卡片 */}
        <Row gutter={16}>
          <Col span={6}>
            <Card title="执行中工单" extra={<SyncOutlined spin={loading} />}>
              <Statistic
                title="数量"
                value={dashboardData.executingOrders}
                suffix="单"
                valueStyle={{ color: '#1890ff', fontSize: 32, fontWeight: 600 }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card title="等待中工单">
              <Statistic
                title="数量"
                value={dashboardData.waitingOrders}
                suffix="单"
                valueStyle={{ color: '#faad14', fontSize: 32 }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card title="已完成工单">
              <Statistic
                title="数量"
                value={dashboardData.completedOrders}
                suffix="单"
                valueStyle={{ color: '#52c41a', fontSize: 32, fontWeight: 600 }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card title="延误工单">
              <Statistic
                title="数量"
                value={dashboardData.delayedOrders}
                suffix="单"
                valueStyle={{ color: '#ff4d4f', fontSize: 32, fontWeight: 600 }}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Card title="今日完成" extra={<Badge count={dashboardData.todayCompleted} />}>
              <Statistic
                title="工单数"
                value={dashboardData.todayCompleted}
                suffix="单"
                valueStyle={{ color: '#52c41a', fontSize: 28 }}
              />
            </Card>
          </Col>
          <Col span={12}>
            <Card title="今日延误" extra={<Badge count={dashboardData.todayDelayed} showZero color="#52c41a" />}>
              <Statistic
                title="工单数"
                value={dashboardData.todayDelayed}
                suffix="单"
                valueStyle={{ color: '#ff4d4f', fontSize: 28 }}
              />
            </Card>
          </Col>
        </Row>

        {/* Tab切换 */}
        <Row gutter={16}>
          <Col span={24}>
            <Card bordered={false} bodyStyle={{ padding: 0 }}>
              <Space size="large" style={{ width: '100%', justifyContent: 'center' }}>
                <Button
                  type={activeTab === 'overview' ? 'primary' : 'default'}
                  size="large"
                  onClick={() => setActiveTab('overview')}
                >
                  总览
                </Button>
                <Button
                  type={activeTab === 'execution' ? 'primary' : 'default'}
                  size="large"
                  onClick={() => setActiveTab('execution')}
                >
                  工单执行
                </Button>
                <Button
                  type={activeTab === 'devices' ? 'primary' : 'default'}
                  size="large"
                  onClick={() => setActiveTab('devices')}
                >
                  设备状态
                </Button>
                <Button
                  type={activeTab === 'progress' ? 'primary' : 'default'}
                  size="large"
                  onClick={() => setActiveTab('progress')}
                >
                  生产进度
                </Button>
              </Space>
            </Card>
          </Col>
        </Row>

        {/* Tab内容 */}
        {activeTab === 'overview' && (
          <Card title="生产效率" style={{ marginTop: 16 }}>
            <Row gutter={16}>
              <Col span={12}>
                <Card title="设备综合效率(OEE)" extra={<Tag color="green">优秀</Tag>}>
                  <Statistic
                    title="当前OEE"
                    value={dashboardData.overallOee}
                    suffix="%"
                    precision={1}
                    valueStyle={{ color: '#52c41a', fontSize: 36 }}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card title="设备运行状态">
                  <Space direction="vertical" size="middle">
                    <div>
                      <span>在线设备：</span>
                      <span style={{ fontSize: 20, fontWeight: 600, marginLeft: 12, color: '#52c41a' }}>
                        {dashboardData.onlineDevices}
                      </span>
                      <span style={{ fontSize: 14, color: '#8c8c8c', marginLeft: 4 }}>
                        / {dashboardData.totalDevices}
                      </span>
                    </div>
                    <div>
                      <span>离线设备：</span>
                      <span style={{ fontSize: 20, fontWeight: 600, marginLeft: 12, color: '#8c8c8c' }}>
                        {dashboardData.offlineDevices}
                      </span>
                    </div>
                    <div>
                      <span>告警设备：</span>
                      <span style={{ fontSize: 20, fontWeight: 600, marginLeft: 12, color: '#faad14' }}>
                        {dashboardData.warningDevices}
                      </span>
                    </div>
                    <div>
                      <span>故障设备：</span>
                      <span style={{ fontSize: 20, fontWeight: 600, marginLeft: 12, color: '#ff4d4f' }}>
                        {dashboardData.errorDevices}
                      </span>
                    </div>
                  </Space>
                </Card>
              </Col>
            </Row>
          </Card>
        )}

        {activeTab === 'execution' && (
          <Card title="工单执行监控" style={{ marginTop: 16 }}>
            <DataTable
              data={executingWorkOrders}
              rowKey="id"
              columns={[
                {
                  key: 'woNo',
                  title: '工单编号',
                  width: 120,
                  align: 'center',
                  fixed: 'left',
                },
                {
                  key: 'productName',
                  title: '产品名称',
                  width: 180,
                  align: 'center',
                },
                {
                  key: 'operator',
                  title: '操作员',
                  width: 100,
                  align: 'center',
                },
                {
                  key: 'workstation',
                  title: '工位',
                  width: 120,
                  align: 'center',
                },
                {
                  key: 'priority',
                  title: '优先级',
                  width: 80,
                  align: 'center',
                  render: (priority: string) => (
                    <Tag color={priority === 'HIGH' ? 'red' : priority === 'NORMAL' ? 'blue' : 'default'}>
                      {priority === 'HIGH' ? '高' : priority === 'NORMAL' ? '普通' : '低'}
                    </Tag>
                  ),
                },
                {
                  key: 'progress',
                  title: '进度',
                  width: 180,
                  align: 'center',
                  render: (progress: number, record: WorkOrderExecutionCard) => (
                    <Progress
                      percent={progress}
                      status={record.status === 'COMPLETED' ? 'success' : 'active'}
                      strokeColor={{
                        '0%': '#52c41a',
                        '100%': '#52c41a',
                      }}
                      format={percent => `${(percent ?? 0).toFixed(1)}%`}
                    />
                  ),
                },
                {
                  key: 'action',
                  title: '操作',
                  width: 120,
                  align: 'center',
                  render: (_: any, record: WorkOrderExecutionCard) => (
                    <Space>
                      <Button
                        type="link"
                        size="small"
                        icon={<CheckCircleOutlined />}
                        onClick={() => handleViewWorkOrder(record)}
                      >
                        详情
                      </Button>
                    </Space>
                  ),
                },
              ]}
              pagination={{
                current: 1,
                pageSize: 10,
                total: executingWorkOrders.length,
                showSizeChanger: true,
                pageSizeOptions: [10, 20, 50, 100],
              }}
              showActions={true}
              onRefresh={handleRefresh}
              onRowClick={(record: WorkOrderExecutionCard) => handleViewWorkOrder(record)}
              sticky={true}
              scroll={{ x: 1500, y: 400 }}
            />
          </Card>
        )}

        {activeTab === 'devices' && (
          <Card title="设备状态监控" style={{ marginTop: 16 }}>
            <Row gutter={16}>
              {deviceStatusCards.map(device => (
                <Col key={device.deviceId} span={6}>
                  <Card
                    size="small"
                    title={device.deviceName}
                    extra={
                      <Tooltip title="查看详情">
                        <Button
                          type="link"
                          size="small"
                          icon={<CheckCircleOutlined />}
                          onClick={() => handleViewDevice(device)}
                        >
                          详情
                        </Button>
                      </Tooltip>
                    }
                    hoverable
                    onClick={() => handleViewDevice(device)}
                  >
                    <div style={{ textAlign: 'center', marginBottom: 12 }}>
                      <div style={{
                        fontSize: 48,
                        marginBottom: 16,
                        color: device.status === 'online' ? '#52c41a' :
                               device.status === 'warning' ? '#faad14' :
                               device.status === 'error' ? '#ff4d4f' : '#8c8c8c',
                      }}>
                        {device.status === 'online' && <CheckCircleOutlined />}
                        {device.status === 'warning' && <ExclamationCircleOutlined />}
                        {device.status === 'error' && <StopOutlined />}
                        {device.status === 'offline' && <ClockCircleOutlined />}
                      </div>
                      <div style={{ fontWeight: 600, marginBottom: 8 }}>
                        {device.statusText}
                      </div>
                      {device.deviceType === '压片设备' && (
                        <>
                          <div>
                            <span>温度：</span>
                            <span style={{ fontSize: 18, marginLeft: 8, fontWeight: 600 }}>
                              {device.temperature}°C
                            </span>
                          </div>
                          <div>
                            <span>速度：</span>
                            <span style={{ fontSize: 18, marginLeft: 8, fontWeight: 600 }}>
                              {device.speed} RPM
                            </span>
                          </div>
                        </>
                      )}
                      {device.deviceType === '包装设备' && (
                        <div>
                          <span>运行状态：</span>
                          <span style={{ fontSize: 18, marginLeft: 8, fontWeight: 600 }}>
                            {device.statusText}
                          </span>
                        </div>
                      )}
                    </div>
                    <div style={{
                      marginTop: 12,
                      fontSize: 12,
                      color: '#8c8c8c',
                    }}>
                      最后更新：{dayjs(device.lastUpdate).format('YYYY-MM-DD HH:mm:ss')}
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        )}

        {activeTab === 'progress' && (
          <Card title="生产进度跟踪" style={{ marginTop: 16 }}>
            <Row gutter={16}>
              {productionProgressCards.map(progressCard => (
                <Col key={progressCard.workOrderId} span={8}>
                  <Card
                    size="small"
                    title={progressCard.productName}
                    extra={
                      <Tooltip title="查看详情">
                        <Button
                          type="link"
                          size="small"
                          onClick={() => handleViewWorkOrder({
                            id: progressCard.workOrderId,
                            woNo: progressCard.workOrderNo,
                            productName: progressCard.productName,
                            status: 'IN_PROGRESS',
                            progress: progressCard.progress,
                            operator: progressCard.operator ?? '',
                            workstation: progressCard.workstation ?? '',
                            planStartTime: progressCard.planStartTime ?? '',
                            actualStartTime: progressCard.actualStartTime ?? '',
                            planEndTime: progressCard.planEndTime ?? '',
                            actualEndTime: progressCard.actualEndTime ?? '',
                            priority: 'HIGH',
                          })}
                        >
                          详情
                        </Button>
                      </Tooltip>
                    }
                  >
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ marginBottom: 8 }}>
                        <span>计划数量：</span>
                        <span style={{ fontSize: 20, fontWeight: 600, marginLeft: 8 }}>
                          {progressCard.planQty}
                        </span>
                      </div>
                      <div style={{ marginBottom: 8 }}>
                        <span>完成数量：</span>
                        <span style={{ fontSize: 20, fontWeight: 600, marginLeft: 8 }}>
                          {progressCard.completedQty}
                        </span>
                      </div>
                      <div style={{ marginBottom: 8 }}>
                        <span>预计完成：</span>
                        <span style={{ fontSize: 16, marginLeft: 8, color: '#1890ff' }}>
                          {dayjs(progressCard.eta).format('YYYY-MM-DD HH:mm')}
                        </span>
                      </div>
                    </div>
                    <Progress
                      percent={progressCard.progress}
                      status={progressCard.progress === 100 ? 'success' : 'active'}
                      strokeColor={{
                        '0%': '#52c41a',
                        '100%': '#52c41a',
                      }}
                      format={percent => `${(percent ?? 0).toFixed(1)}%`}
                    />
                    <div style={{
                      marginTop: 12,
                      fontSize: 12,
                      color: '#8c8c8c',
                    }}>
                      操作员：{progressCard.operator} | 工位：{progressCard.workstation}
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        )}

        {/* 工单详情弹窗 */}
        {selectedWorkOrder && (
          <Modal
            title="工单执行详情"
            open={true}
            onCancel={handleCloseWorkOrder}
            width={800}
            footer={null}
          >
            <Descriptions bordered column={2} size="middle">
              <Descriptions.Item label="工单编号" span={1}>
                {selectedWorkOrder.woNo}
              </Descriptions.Item>
              <Descriptions.Item label="产品名称" span={1}>
                {selectedWorkOrder.productName}
              </Descriptions.Item>
              <Descriptions.Item label="优先级" span={1}>
                <Tag color={selectedWorkOrder.priority === 'HIGH' ? 'red' : 'blue'}>
                  {selectedWorkOrder.priority === 'HIGH' ? '高' : '普通'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="状态" span={1}>
                <SimpleStatusBadge status={selectedWorkOrder.status} />
              </Descriptions.Item>
              <Descriptions.Item label="进度" span={1}>
                <Progress percent={selectedWorkOrder.progress} />
              </Descriptions.Item>
              <Descriptions.Item label="操作员" span={1}>
                {selectedWorkOrder.operator}
              </Descriptions.Item>
              <Descriptions.Item label="工位" span={1}>
                {selectedWorkOrder.workstation}
              </Descriptions.Item>
              <Descriptions.Item label="计划开始时间" span={1}>
                {dayjs(selectedWorkOrder.planStartTime).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
              <Descriptions.Item label="实际开始时间" span={1}>
                {selectedWorkOrder.actualStartTime
                  ? dayjs(selectedWorkOrder.actualStartTime).format('YYYY-MM-DD HH:mm:ss')
                  : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="计划结束时间" span={1}>
                {dayjs(selectedWorkOrder.planEndTime).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
              <Descriptions.Item label="实际结束时间" span={1}>
                {selectedWorkOrder.actualEndTime
                  ? dayjs(selectedWorkOrder.actualEndTime).format('YYYY-MM-DD HH:mm:ss')
                  : '-'}
              </Descriptions.Item>
            </Descriptions>
          </Modal>
        )}
      </Space>
    </div>
  );
}

export default WorkshopDashboard;
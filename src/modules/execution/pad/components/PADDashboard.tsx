/**
 * PAD (Process Area Display) 执行界面主组件
 * 工作站操作员的主要工作界面
 */

import React, { useEffect, useState } from 'react';
import {
  Card,
  Layout,
  Menu,
  Button,
  Space,
  Table,
  Tag,
  Form,
  Input,
  Modal,
  Progress,
  Badge,
  Statistic,
  Row,
  Col,
  Alert,
  Timeline,
  Steps,
  Select,
  message,
  Drawer,
  Tabs,
  Tooltip,
  Avatar,
  Divider,
  Descriptions,
  Empty,
} from 'antd';
import {
  UserOutlined,
  LogoutOutlined,
  DashboardOutlined,
  FileTextOutlined,
  SettingOutlined,
  DesktopOutlined,
  CheckSquareOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  StopOutlined,
  ReloadOutlined,
  BellOutlined,
  CheckOutlined,
  CloseOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  ExclamationCircleOutlined,
  ThunderboltOutlined,
  ClockCircleOutlined,
  TeamOutlined, LineChartOutlined, BookOutlined} from '@ant-design/icons';
import { usePADStore } from '../store/padStore';
import type {
  WorkstationStatus,
  TaskStatus,
  EquipmentStatus,
  TaskInfo,
  EquipmentInfo,
  OperationRecord,
} from '../types';
import {
  PAD_WORKSTATION_STATUS_MAP,
  PAD_TASK_STATUS_MAP,
  PAD_EQUIPMENT_STATUS_MAP,
} from '../types';
import { DataTable } from '../../../../shared/components/DataTable';

const { Option } = Select;
const { TextArea } = Input;
const { Sider, Content } = Layout;

/**
 * PAD执行界面主组件
 */
export const PADDashboard: React.FC = () => {
  const {
    currentWorkstation,
    workstationStatus,
    loading,
    error,
    operatorId,
    operatorName,
    operatorStatus,
    shiftName,
    currentTask,
    taskQueue,
    equipment,
    operationRecords,
    unReadNotifications,
    activeTab,
    showTaskDetail,
    showEquipmentControl,
    showQualityCheck,

    // Actions
    login,
    logout,
    loadWorkstationData,
    loadTasks,
    loadEquipment,
    selectTask,
    startTask,
    pauseTask,
    resumeTask,
    completeTask,
    abortTask,
    startEquipment,
    stopEquipment,
    pauseEquipment,
    resetEquipment,
    setActiveTab,
    setShowTaskDetail,
    setShowEquipmentControl,
    setShowQualityCheck,
    refreshData,
    markNotificationsRead,
  } = usePADStore();

  const [loginForm] = Form.useForm();
  const [taskExecutionForm] = Form.useForm();
  const [equipmentControlForm] = Form.useForm();

  // 登录状态
  const [showLoginModal, setShowLoginModal] = useState(true);

  // 初始化
  useEffect(() => {
    if (operatorStatus === 'LOGGED_IN') {
      setShowLoginModal(false);
      loadWorkstationData();
    }
  }, [operatorStatus]);

  // 处理登录
  const handleLogin = async (values: any) => {
    await login(values.operatorId, values.password);
    if (!error) {
      setShowLoginModal(false);
      loadWorkstationData();
    }
  };

  // 处理退出
  const handleLogout = async () => {
    await logout();
    setShowLoginModal(true);
  };

  // 处理任务选择
  const handleSelectTask = async (taskId: string) => {
    await selectTask(taskId);
  };

  // 开始任务
  const handleStartTask = async () => {
    if (!currentTask) return;

    try {
      const values = await taskExecutionForm.validateFields();
      await startTask({
        taskId: currentTask.id,
        workstationId: currentWorkstation!.id,
        operatorId: operatorId!,
        executionType: 'START',
        qty: values.qty || currentTask.planQty,
        qualifiedQty: 0,
        unqualifiedQty: 0,
        remark: values.remark,
      });
    } catch (error) {
      console.error('开始任务失败:', error);
    }
  };

  // 暂停任务
  const handlePauseTask = async () => {
    if (!currentTask) return;
    await pauseTask({
      taskId: currentTask.id,
      workstationId: currentWorkstation!.id,
      operatorId: operatorId!,
      executionType: 'PAUSE',
      qty: currentTask.completedQty,
      qualifiedQty: currentTask.qualifiedQty,
      unqualifiedQty: currentTask.unqualifiedQty,
    });
  };

  // 恢复任务
  const handleResumeTask = async () => {
    if (!currentTask) return;
    await resumeTask({
      taskId: currentTask.id,
      workstationId: currentWorkstation!.id,
      operatorId: operatorId!,
      executionType: 'RESUME',
      qty: 0,
      qualifiedQty: 0,
      unqualifiedQty: 0,
    });
  };

  // 完成任务
  const handleCompleteTask = async () => {
    if (!currentTask) return;

    try {
      const values = await taskExecutionForm.validateFields();
      await completeTask({
        taskId: currentTask.id,
        workstationId: currentWorkstation!.id,
        operatorId: operatorId!,
        executionType: 'COMPLETE',
        qty: values.qty || currentTask.remainingQty,
        qualifiedQty: values.qualifiedQty || values.qty || currentTask.remainingQty,
        unqualifiedQty: values.unqualifiedQty || 0,
        remark: values.remark,
      });
    } catch (error) {
      console.error('完成任务失败:', error);
    }
  };

  // 中止任务
  const handleAbortTask = async () => {
    if (!currentTask) return;
    await abortTask({
      taskId: currentTask.id,
      workstationId: currentWorkstation!.id,
      operatorId: operatorId!,
      executionType: 'ABORT',
      qty: 0,
      qualifiedQty: 0,
      unqualifiedQty: 0,
    });
  };

  // 启动设备
  const handleStartEquipment = async (equipmentInfo: EquipmentInfo) => {
    await startEquipment({
      equipmentId: equipmentInfo.id,
      workstationId: currentWorkstation!.id,
      operatorId: operatorId!,
      controlType: 'START',
    });
  };

  // 停止设备
  const handleStopEquipment = async (equipmentInfo: EquipmentInfo) => {
    await stopEquipment({
      equipmentId: equipmentInfo.id,
      workstationId: currentWorkstation!.id,
      operatorId: operatorId!,
      controlType: 'STOP',
    });
  };

  // 刷新数据
  const handleRefresh = () => {
    refreshData();
  };

  // 标记通知已读
  const handleMarkRead = () => {
    markNotificationsRead();
  };

  // 菜单配置
  const menuItems = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: '工作台',
    },
    {
      key: 'tasks',
      icon: <FileTextOutlined />,
      label: '任务管理',
    },
    {
      key: 'equipment',
      icon: <DesktopOutlined />,
      label: '设备控制',
    },
    {
      key: 'quality',
      icon: <CheckSquareOutlined />,
      label: '质量检查',
    },
    {
      key: 'records',
      icon: <InfoCircleOutlined />,
      label: '操作记录',
    },
  ];

  // 获取状态配置
  const getStatusConfig = (status: WorkstationStatus | TaskStatus | EquipmentStatus) => {
    if (status in PAD_WORKSTATION_STATUS_MAP) {
      return PAD_WORKSTATION_STATUS_MAP[status as WorkstationStatus];
    } else if (status in PAD_TASK_STATUS_MAP) {
      return PAD_TASK_STATUS_MAP[status as TaskStatus];
    } else if (status in PAD_EQUIPMENT_STATUS_MAP) {
      return PAD_EQUIPMENT_STATUS_MAP[status as EquipmentStatus];
    }
    return { label: '未知', color: '#bfbfbf', bg: '#f5f5f5', icon: '❓' };
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* 登录弹窗 */}
      <Modal
        title="PAD登录"
        open={showLoginModal}
        footer={null}
        closable={false}
        width={400}
      >
        <Form
          form={loginForm}
          layout="vertical"
          onFinish={handleLogin}
        >
          <Form.Item
            name="operatorId"
            label="操作员工号"
            rules={[{ required: true, message: '请输入操作员工号' }]}
          >
            <Input
              placeholder="请输入操作员工号"
              prefix={<UserOutlined />}
              size="large"
            />
          </Form.Item>
          <Form.Item
            name="password"
            label="密码"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              placeholder="请输入密码"
              size="large"
            />
          </Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            block
            size="large"
            loading={loading}
          >
            登录
          </Button>
        </Form>
      </Modal>

      {/* 侧边栏 */}
      <Sider width={200} theme="light" style={{ overflow: 'auto' }}>
        <div style={{ padding: '16px', textAlign: 'center' }}>
          <Avatar size={64} icon={<UserOutlined />} style={{ marginBottom: 8 }} />
          <div style={{ fontWeight: 'bold', fontSize: 16 }}>{operatorName || '未登录'}</div>
          <div style={{ color: '#666', fontSize: 12 }}>
            班次：{shiftName || '-'}
          </div>
        </div>
        <Divider />
        <Menu
          mode="inline"
          selectedKeys={[activeTab]}
          items={menuItems}
          onClick={({ key }) => setActiveTab(key as any)}
        />
        <div style={{ position: 'absolute', bottom: 0, width: '100%', padding: '16px' }}>
          <Button
            icon={<LogoutOutlined />}
            onClick={handleLogout}
            block
            danger
          >
            退出
          </Button>
        </div>
      </Sider>

      {/* 主内容区 */}
      <Layout>
        {/* 顶部栏 */}
        <div style={{
          background: '#fff',
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #f0f0f0',
        }}>
          <Space size="large">
            <div>
              <span style={{ fontWeight: 'bold', fontSize: 18 }}>
                {currentWorkstation?.workstationName || 'PAD工作台'}
              </span>
              <Tag
                color={getStatusConfig(workstationStatus).color}
                style={{ marginLeft: 16 }}
              >
                {getStatusConfig(workstationStatus).icon} {getStatusConfig(workstationStatus).label}
              </Tag>
            </div>
            {currentTask && (
              <Alert
                message={`当前任务：${currentTask.taskNo} - ${currentTask.productName}`}
                type="info"
                showIcon
              />
            )}
          </Space>
          <Space>
            <Badge count={unReadNotifications} size="small">
              <Button
                type="text"
                icon={<BellOutlined />}
                onClick={handleMarkRead}
              >
                通知
              </Button>
            </Badge>
            <Button
              type="text"
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
              loading={loading}
            >
              刷新
            </Button>
          </Space>
        </div>

        {/* 内容区 */}
        <Content style={{ padding: '24px', overflow: 'auto' }}>
          {activeTab === 'dashboard' && (
            <div>
              {/* 统计卡片 */}
              <Row gutter={16} style={{ marginBottom: 24 }}>
                <Col span={6}>
                  <Card>
                    <Statistic
                      title="待处理任务"
                      value={taskQueue.filter(t => t.status === 'PENDING').length}
                      prefix={<ClockCircleOutlined />}
                      valueStyle={{ color: '#faad14' }}
                    />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card>
                    <Statistic
                      title="执行中任务"
                      value={taskQueue.filter(t => t.status === 'IN_PROGRESS').length}
                      prefix={<PlayCircleOutlined />}
                      valueStyle={{ color: '#1890ff' }}
                    />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card>
                    <Statistic
                      title="运行中设备"
                      value={equipment.filter(e => e.status === 'RUNNING').length}
                      prefix={<ThunderboltOutlined />}
                      valueStyle={{ color: '#52c41a' }}
                    />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card>
                    <Statistic
                      title="异常设备"
                      value={equipment.filter(e => e.status === 'ERROR').length}
                      prefix={<WarningOutlined />}
                      valueStyle={{ color: '#ff4d4f' }}
                    />
                  </Card>
                </Col>
              </Row>

              {/* 当前任务卡片 */}
              {currentTask && (
                <Card
                  title="当前任务"
                  extra={
                    <Space>
                      <Progress
                        percent={currentTask.progress}
                        size="small"
                        style={{ width: 200 }}
                      />
                    </Space>
                  }
                  style={{ marginBottom: 24 }}
                >
                  <Descriptions column={2}>
                    <Descriptions.Item label="任务编号">{currentTask.taskNo}</Descriptions.Item>
                    <Descriptions.Item label="产品编码">{currentTask.productCode}</Descriptions.Item>
                    <Descriptions.Item label="产品名称">{currentTask.productName}</Descriptions.Item>
                    <Descriptions.Item label="批号">{currentTask.batchNo}</Descriptions.Item>
                    <Descriptions.Item label="计划数量">{currentTask.planQty}</Descriptions.Item>
                    <Descriptions.Item label="完成数量">{currentTask.completedQty}</Descriptions.Item>
                    <Descriptions.Item label="合格数量">{currentTask.qualifiedQty}</Descriptions.Item>
                    <Descriptions.Item label="不合格数量">{currentTask.unqualifiedQty}</Descriptions.Item>
                  </Descriptions>

                  <Divider />

                  <Form form={taskExecutionForm} layout="inline">
                    <Space>
                      {currentTask.status === 'PENDING' && (
                        <Button
                          type="primary"
                          icon={<PlayCircleOutlined />}
                          onClick={handleStartTask}
                          loading={loading}
                        >
                          开始
                        </Button>
                      )}
                      {currentTask.status === 'IN_PROGRESS' && (
                        <>
                          <Button
                            icon={<PauseCircleOutlined />}
                            onClick={handlePauseTask}
                            loading={loading}
                          >
                            暂停
                          </Button>
                          <Button
                            type="primary"
                            icon={<CheckOutlined />}
                            onClick={handleCompleteTask}
                            loading={loading}
                          >
                            完成
                          </Button>
                        </>
                      )}
                      {currentTask.status === 'PAUSED' && (
                        <Button
                          type="primary"
                          icon={<PlayCircleOutlined />}
                          onClick={handleResumeTask}
                          loading={loading}
                        >
                          恢复
                        </Button>
                      )}
                      <Button
                        danger
                        icon={<StopOutlined />}
                        onClick={handleAbortTask}
                        loading={loading}
                      >
                        中止
                      </Button>
                    </Space>
                  </Form>
                </Card>
              )}

              {/* 设备状态卡片 */}
              <Card title="设备状态" style={{ marginBottom: 24 }}>
                <Row gutter={16}>
                  {equipment.map(eq => (
                    <Col span={8} key={eq.id} style={{ marginBottom: 16 }}>
                      <Card
                        size="small"
                        hoverable
                        style={{
                          borderColor: getStatusConfig(eq.status).color,
                          borderWidth: 2,
                        }}
                      >
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 8 }}>
                            {eq.equipmentName}
                          </div>
                          <Tag color={getStatusConfig(eq.status).color}>
                            {getStatusConfig(eq.status).icon} {getStatusConfig(eq.status).label}
                          </Tag>
                          <div style={{ marginTop: 8 }}>
                            {eq.status === 'RUNNING' ? (
                              <Button
                                type="primary"
                                size="small"
                                icon={<StopOutlined />}
                                onClick={() => handleStopEquipment(eq)}
                                loading={loading}
                              >
                                停止
                              </Button>
                            ) : (
                              <Button
                                type="primary"
                                size="small"
                                icon={<PlayCircleOutlined />}
                                onClick={() => handleStartEquipment(eq)}
                                loading={loading}
                              >
                                启动
                              </Button>
                            )}
                          </div>
                        </div>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </Card>
            </div>
          )}

          {activeTab === 'tasks' && (
            <Card title="任务列表">
              <DataTable
                dataSource={taskQueue}
                loading={loading}
                rowKey="id"
                columns={[
                  {
                    title: '任务编号',
                    dataIndex: 'taskNo',
                    width: 120,
                  },
                  {
                    title: '产品编码',
                    dataIndex: 'productCode',
                    width: 120,
                  },
                  {
                    title: '产品名称',
                    dataIndex: 'productName',
                    width: 150,
                  },
                  {
                    title: '批号',
                    dataIndex: 'batchNo',
                    width: 120,
                  },
                  {
                    title: '计划数量',
                    dataIndex: 'planQty',
                    width: 100,
                    align: 'center',
                  },
                  {
                    title: '完成数量',
                    dataIndex: 'completedQty',
                    width: 100,
                    align: 'center',
                  },
                  {
                    title: '进度',
                    dataIndex: 'progress',
                    width: 150,
                    render: (progress: number) => (
                      <Progress percent={progress} size="small" />
                    ),
                  },
                  {
                    title: '状态',
                    dataIndex: 'status',
                    width: 100,
                    render: (status: TaskStatus) => {
                      const config = getStatusConfig(status);
                      return (
                        <Tag color={config.color}>
                          {config.icon} {config.label}
                        </Tag>
                      );
                    },
                  },
                  {
                    title: '操作',
                    key: 'action',
                    width: 150,
                    render: (_: any, record: TaskInfo) => (
                      <Button
                        type="primary"
                        size="small"
                        onClick={() => handleSelectTask(record.id)}
                        disabled={record.status !== 'PENDING'}
                        loading={loading}
                      >
                        选择
                      </Button>
                    ),
                  },
                ]}
                pagination={false}
              />
            </Card>
          )}

          {activeTab === 'equipment' && (
            <Card title="设备控制">
              <Row gutter={16}>
                {equipment.map(eq => (
                  <Col span={12} key={eq.id} style={{ marginBottom: 24 }}>
                    <Card
                      title={eq.equipmentName}
                      extra={
                        <Tag color={getStatusConfig(eq.status).color}>
                          {getStatusConfig(eq.status).icon} {getStatusConfig(eq.status).label}
                        </Tag>
                      }
                    >
                      <Descriptions column={1} size="small">
                        <Descriptions.Item label="设备编号">{eq.equipmentNo}</Descriptions.Item>
                        <Descriptions.Item label="设备类型">{eq.equipmentType}</Descriptions.Item>
                        <Descriptions.Item label="序列号">{eq.serialNo}</Descriptions.Item>
                        <Descriptions.Item label="制造商">{eq.manufacturer}</Descriptions.Item>
                        <Descriptions.Item label="型号">{eq.model}</Descriptions.Item>
                      </Descriptions>

                      <Divider orientation={"left" as any}>运行参数</Divider>
                      <div>
                        {eq.operatingParams && eq.operatingParams.map((param, index) => (
                          <div key={index} style={{ marginBottom: 8 }}>
                            <Space>
                              <span style={{ width: 120 }}>{param.paramName}:</span>
                              <Tag color={param.status === 'NORMAL' ? 'green' : param.status === 'WARNING' ? 'orange' : 'red'}>
                                {param.paramValue} {param.unit}
                              </Tag>
                            </Space>
                          </div>
                        ))}
                      </div>

                      <Divider />
                      <Space>
                        {eq.status === 'RUNNING' ? (
                          <Button
                            danger
                            icon={<StopOutlined />}
                            onClick={() => handleStopEquipment(eq)}
                            loading={loading}
                          >
                            停止
                          </Button>
                        ) : (
                          <Button
                            type="primary"
                            icon={<PlayCircleOutlined />}
                            onClick={() => handleStartEquipment(eq)}
                            loading={loading}
                          >
                            启动
                          </Button>
                        )}
                      </Space>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Card>
          )}

          {activeTab === 'quality' && (
            <Card title="质量检查">
              {currentTask ? (
                <div>
                  {currentTask.qualityChecks && currentTask.qualityChecks.length > 0 ? (
                    <Timeline>
                      {currentTask.qualityChecks.map((check, index) => (
                        <Timeline.Item
                          key={index}
                          color={check.status === 'PASSED' ? 'green' : check.status === 'FAILED' ? 'red' : 'gray'}
                        >
                          <Card size="small" style={{ marginBottom: 8 }}>
                            <Descriptions column={2}>
                              <Descriptions.Item label="检查点名称" span={2}>
                                {check.checkName}
                              </Descriptions.Item>
                              <Descriptions.Item label="检查类型">
                                {check.checkType}
                              </Descriptions.Item>
                              <Descriptions.Item label="检验方法">
                                {check.checkMethod}
                              </Descriptions.Item>
                              <Descriptions.Item label="接收标准">
                                {check.acceptanceCriteria}
                              </Descriptions.Item>
                              <Descriptions.Item label="状态" span={2}>
                                <Tag color={check.status === 'PASSED' ? 'green' : check.status === 'FAILED' ? 'red' : 'default'}>
                                  {check.status}
                                </Tag>
                              </Descriptions.Item>
                              <Descriptions.Item label="检验结果" span={2}>
                                {check.result || '-'}
                              </Descriptions.Item>
                              <Descriptions.Item label="检验员" span={2}>
                                {check.inspectorName || '-'}
                              </Descriptions.Item>
                              <Descriptions.Item label="检验时间" span={2}>
                                {check.checkTime || '-'}
                              </Descriptions.Item>
                              <Descriptions.Item label="备注" span={2}>
                                {check.remark || '-'}
                              </Descriptions.Item>
                            </Descriptions>
                          </Card>
                        </Timeline.Item>
                      ))}
                    </Timeline>
                  ) : (
                    <Empty description="暂无质量检查点" />
                  )}
                </div>
              ) : (
                <Empty description="请先选择任务" />
              )}
            </Card>
          )}

          {activeTab === 'records' && (
            <Card title="操作记录">
              <DataTable
                dataSource={operationRecords}
                loading={loading}
                rowKey="id"
                columns={[
                  {
                    title: '记录编号',
                    dataIndex: 'recordNo',
                    width: 120,
                  },
                  {
                    title: '操作类型',
                    dataIndex: 'operationType',
                    width: 150,
                  },
                  {
                    title: '操作描述',
                    dataIndex: 'operationDesc',
                    width: 200,
                  },
                  {
                    title: '操作员',
                    dataIndex: 'operatorName',
                    width: 100,
                  },
                  {
                    title: '操作时间',
                    dataIndex: 'operationTime',
                    width: 160,
                  },
                ]}
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                }}
              />
            </Card>
          )}
        </Content>
      </Layout>
    </Layout>
  );
};

export default PADDashboard;
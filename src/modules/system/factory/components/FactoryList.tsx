/**
 * 工厂管理列表组件
 */

import React, { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  message,
  Modal,
  Tooltip,
  Card,
  Row,
  Col,
  Statistic,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  StopOutlined,
  PlayCircleOutlined,
  SwapOutlined,
  BankOutlined,
  TeamOutlined,
  AppstoreOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type {
  FactoryConfig,
  FactoryQuery,
  Timezone,
  Currency,
  Language,
  FactoryStatus,
} from '../types';
import { useFactoryStore } from '../store';
import FactoryForm from './FactoryForm';
import FactoryStats from './FactoryStats';
import { FACTORY_STATUS_MAP, TIMEZONE_MAP, CURRENCY_MAP, LANGUAGE_MAP, FACTORY_COLUMNS } from '../types';

const FactoryList: React.FC = () => {
  const {
    factories,
    currentFactoryId,
    loading,
    loadFactories,
    switchFactory,
    getAvailableFactories,
    loadFactoryStats,
  } = useFactoryStore();

  const [searchParams, setSearchParams] = useState<FactoryQuery>({});
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [statsModalVisible, setStatsModalVisible] = useState(false);
  const [editingFactory, setEditingFactory] = useState<FactoryConfig | null>(null);

  // 初始化加载工厂列表
  useEffect(() => {
    loadFactories();
  }, []);

  // 获取用户可访问的工厂列表
  const availableFactories = getAvailableFactories('current-user');

  const handleSearch = (params: FactoryQuery) => {
    setSearchParams(params);
  };

  const handleAdd = () => {
    setEditingFactory(null);
    setModalVisible(true);
  };

  const handleEdit = (factory: FactoryConfig) => {
    setEditingFactory(factory);
    setModalVisible(true);
  };

  const handleDelete = (ids: string[]) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除选中的 ${ids.length} 个工厂吗？删除后将无法恢复。`,
      onOk: async () => {
        try {
          // 调用删除API
          // await factoryApi.deleteFactory(ids);

          // 本地删除（开发阶段）
          const updatedFactories = factories.filter(f => !ids.includes(f.id));
          useFactoryStore.getState().setFactories(updatedFactories);

          message.success('删除成功');
          setSelectedRowKeys([]);
        } catch (error) {
          message.error('删除失败');
        }
      },
    });
  };

  const handleUpdateStatus = async (ids: string[], status: 'ACTIVE' | 'INACTIVE') => {
    try {
      // 调用更新状态API
      // await factoryApi.updateFactoryStatus(ids, status);

      // 本地更新（开发阶段）
      const updatedFactories = factories.map(f =>
        ids.includes(f.id) ? { ...f, status } : f
      );
      useFactoryStore.getState().setFactories(updatedFactories);

      message.success(status === 'ACTIVE' ? '启用成功' : '停用成功');
      setSelectedRowKeys([]);
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleSwitch = async (factoryId: string) => {
    if (factoryId === currentFactoryId) {
      message.info('当前已是该工厂');
      return;
    }

    Modal.confirm({
      title: '确认切换工厂',
      content: '切换工厂将刷新页面数据，确定要继续吗？',
      onOk: async () => {
        try {
          await switchFactory(factoryId);
          message.success('工厂切换成功');

          // 刷新页面以重新加载数据
          setTimeout(() => {
            window.location.reload();
          }, 500);
        } catch (error) {
          message.error('工厂切换失败');
        }
      },
    });
  };

  const handleViewStats = async (factoryId: string) => {
    setStatsModalVisible(true);
    await loadFactoryStats(factoryId);
  };

  const columns: ColumnsType<FactoryConfig> = [
    {
      title: '工厂编码',
      dataIndex: 'code',
      key: 'code',
      width: 120,
      fixed: 'left',
      render: (code: string) => <Tag color="blue">{code}</Tag>,
    },
    {
      title: '工厂名称',
      dataIndex: 'name',
      key: 'name',
      width: 180,
      render: (name: string, record: FactoryConfig) => (
        <div>
          <div>{name}</div>
          {record.nameEn && (
            <div style={{ fontSize: 12, color: '#999' }}>{record.nameEn}</div>
          )}
        </div>
      ),
    },
    {
      title: '国家',
      dataIndex: 'country',
      key: 'country',
      width: 100,
      align: 'center',
    },
    {
      title: '时区',
      dataIndex: 'timezone',
      key: 'timezone',
      width: 180,
      align: 'center',
      render: (timezone: Timezone) => TIMEZONE_MAP[timezone] ?? timezone ?? '-',
    },
    {
      title: '货币',
      dataIndex: 'currency',
      key: 'currency',
      width: 80,
      align: 'center',
      render: (currency: Currency) => CURRENCY_MAP[currency]?.symbol ?? String(currency ?? '-'),
    },
    {
      title: '语言',
      dataIndex: 'language',
      key: 'language',
      width: 100,
      align: 'center',
      render: (language: Language) => LANGUAGE_MAP[language] ?? language ?? '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      align: 'center',
      render: (status: FactoryStatus) => {
        const statusInfo = FACTORY_STATUS_MAP[status] ?? { bg: 'default', color: '#aaa', border: '#d9d9d9', label: String(status ?? '-') };
        return <Tag color={statusInfo.bg} style={{ color: statusInfo.color, border: `1px solid ${statusInfo.border}` }}>{statusInfo.label}</Tag>;
      },
    },
    {
      title: '排序',
      dataIndex: 'sortOrder',
      key: 'sortOrder',
      width: 80,
      align: 'center',
    },
    {
      title: '联系人',
      dataIndex: 'contactPerson',
      key: 'contactPerson',
      width: 120,
      align: 'center',
      render: (contactPerson: string) => contactPerson || '-',
    },
    {
      title: '联系电话',
      dataIndex: 'contactPhone',
      key: 'contactPhone',
      width: 150,
      align: 'center',
      render: (contactPhone: string) => contactPhone || '-',
    },
    {
      title: '创建人',
      dataIndex: 'creatorName',
      key: 'creatorName',
      width: 120,
      align: 'center',
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 160,
      align: 'center',
      render: (createTime: string) =>
        new Date(createTime).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      width: 280,
      fixed: 'right',
      align: 'center',
      render: (_: any, record: FactoryConfig) => (
        <Space size="small">
          {record.status === 'ACTIVE' && record.id !== currentFactoryId && (
            <Tooltip title="切换到该工厂">
              <Button
                type="text"
                icon={<SwapOutlined />}
                size="small"
                onClick={() => handleSwitch(record.id)}
              >
                切换
              </Button>
            </Tooltip>
          )}
          <Button
            type="text"
            icon={<AppstoreOutlined />}
            size="small"
            onClick={() => handleViewStats(record.id)}
          >
            统计
          </Button>
          <Button
            type="text"
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          {record.status === 'ACTIVE' ? (
            <Button
              type="text"
              icon={<StopOutlined />}
              size="small"
              onClick={() => handleUpdateStatus([record.id], 'INACTIVE')}
            >
              停用
            </Button>
          ) : (
            <Button
              type="text"
              icon={<PlayCircleOutlined />}
              size="small"
              onClick={() => handleUpdateStatus([record.id], 'ACTIVE')}
            >
              启用
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys: React.Key[]) => {
      setSelectedRowKeys(newSelectedRowKeys);
    },
  };

  return (
    <div style={{ padding: '16px' }}>
      {/* 工厂统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总工厂数"
              value={factories.length}
              prefix={<BankOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="可用工厂"
              value={availableFactories.length}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已启用"
              value={factories.filter(f => f.status === 'ACTIVE').length}
              prefix={<PlayCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已停用"
              value={factories.filter(f => f.status === 'INACTIVE').length}
              prefix={<StopOutlined />}
              valueStyle={{ color: '#bfbfbf' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 操作按钮 */}
      <div style={{ marginBottom: 16 }}>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增工厂
          </Button>
          {selectedRowKeys.length > 0 && (
            <>
              <Button
                icon={<PlayCircleOutlined />}
                onClick={() => handleUpdateStatus(selectedRowKeys as string[], 'ACTIVE')}
              >
                批量启用
              </Button>
              <Button
                icon={<StopOutlined />}
                onClick={() => handleUpdateStatus(selectedRowKeys as string[], 'INACTIVE')}
              >
                批量停用
              </Button>
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDelete(selectedRowKeys as string[])}
              >
                批量删除
              </Button>
            </>
          )}
        </Space>
      </div>

      {/* 工厂列表 */}
      <Table
        columns={columns}
        dataSource={factories}
        rowKey="id"
        loading={loading}
        rowSelection={rowSelection}
        scroll={{ x: 2000 }}
        pagination={{
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条`,
        }}
      />

      {/* 工厂表单弹窗 */}
      {modalVisible && (
        <FactoryForm
          factory={editingFactory}
          visible={modalVisible}
          onCancel={() => setModalVisible(false)}
          onSuccess={() => {
            setModalVisible(false);
            loadFactories();
          }}
        />
      )}

      {/* 工厂统计弹窗 */}
      {statsModalVisible && (
        <FactoryStats
          visible={statsModalVisible}
          onCancel={() => setStatsModalVisible(false)}
        />
      )}
    </div>
  );
};

export default FactoryList;
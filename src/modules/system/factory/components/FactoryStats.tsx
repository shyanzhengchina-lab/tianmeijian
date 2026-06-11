/**
 * 工厂统计信息组件
 */

import React from 'react';
import { Modal, Row, Col, Card, Statistic, Tag, Typography } from 'antd';
import {
  BankOutlined,
  AppstoreOutlined,
  TeamOutlined,
  UserOutlined,
  ExperimentOutlined,
  FileTextOutlined,
  OrderedListOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useFactoryStore } from '../store';

const { Title, Text } = Typography;

interface FactoryStatsProps {
  visible: boolean;
  onCancel: () => void;
}

const FactoryStats: React.FC<FactoryStatsProps> = ({ visible, onCancel }) => {
  const { factoryStats, currentFactory } = useFactoryStore();

  const getStatColor = (index: number) => {
    const colors = [
      '#1890ff', '#52c41a', '#faad14', '#f5222d',
      '#722ed1', '#eb2f96', '#13c2c2', '#fa8c16',
    ];
    return colors[index % colors.length];
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <BankOutlined style={{ color: '#1890ff' }} />
          <span>{currentFactory?.name || '工厂统计信息'}</span>
          {currentFactory?.status === 'ACTIVE' && (
            <Tag color="success">运营中</Tag>
          )}
        </div>
      }
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={900}
    >
      {factoryStats && (
        <div>
          {/* 基本信息 */}
          <Card
            title="基本信息"
            style={{ marginBottom: 16 }}
            bordered={false}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Text strong>所在国家：</Text>
                <Text style={{ marginLeft: 8 }}>{currentFactory?.country}</Text>
              </Col>
              <Col span={12}>
                <Text strong>时区：</Text>
                <Text style={{ marginLeft: 8 }}>{currentFactory?.timezone}</Text>
              </Col>
              <Col span={12}>
                <Text strong>货币：</Text>
                <Text style={{ marginLeft: 8 }}>{currentFactory?.currency}</Text>
              </Col>
              <Col span={12}>
                <Text strong>语言：</Text>
                <Text style={{ marginLeft: 8 }}>{currentFactory?.language}</Text>
              </Col>
              {currentFactory?.contactPerson && (
                <Col span={12}>
                  <Text strong>联系人：</Text>
                  <Text style={{ marginLeft: 8 }}>{currentFactory.contactPerson}</Text>
                </Col>
              )}
              {currentFactory?.contactPhone && (
                <Col span={12}>
                  <Text strong>联系电话：</Text>
                  <Text style={{ marginLeft: 8 }}>{currentFactory.contactPhone}</Text>
                </Col>
              )}
            </Row>
          </Card>

          {/* 组织架构统计 */}
          <Card
            title="组织架构统计"
            style={{ marginBottom: 16 }}
            bordered={false}
          >
            <Row gutter={16}>
              <Col span={6}>
                <Statistic
                  title="车间数量"
                  value={factoryStats.workshopCount}
                  prefix={<AppstoreOutlined />}
                  valueStyle={{ color: getStatColor(0) }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="工作中心数量"
                  value={factoryStats.workCenterCount}
                  prefix={<ExperimentOutlined />}
                  valueStyle={{ color: getStatColor(1) }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="班组数量"
                  value={factoryStats.teamCount}
                  prefix={<TeamOutlined />}
                  valueStyle={{ color: getStatColor(2) }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="员工数量"
                  value={factoryStats.employeeCount}
                  prefix={<UserOutlined />}
                  valueStyle={{ color: getStatColor(3) }}
                />
              </Col>
            </Row>
          </Card>

          {/* 生产统计 */}
          <Card
            title="生产统计"
            style={{ marginBottom: 16 }}
            bordered={false}
          >
            <Row gutter={16}>
              <Col span={8}>
                <Statistic
                  title="设备数量"
                  value={factoryStats.equipmentCount}
                  prefix={<ExperimentOutlined />}
                  valueStyle={{ color: getStatColor(4) }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="生产订单数"
                  value={factoryStats.productionOrderCount}
                  prefix={<FileTextOutlined />}
                  valueStyle={{ color: getStatColor(5) }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="生产工单数"
                  value={factoryStats.workOrderCount}
                  prefix={<OrderedListOutlined />}
                  valueStyle={{ color: getStatColor(6) }}
                />
              </Col>
            </Row>
            <Row gutter={16} style={{ marginTop: 16 }}>
              <Col span={24}>
                <Statistic
                  title="今日产量"
                  value={factoryStats.todayProduction}
                  prefix={<CheckCircleOutlined />}
                  suffix="件"
                  valueStyle={{ color: '#52c41a', fontSize: 24 }}
                />
              </Col>
            </Row>
          </Card>

          {/* 联系信息 */}
          {(currentFactory?.contactEmail || currentFactory?.description) && (
            <Card
              title="联系信息"
              bordered={false}
            >
              <Row gutter={16}>
                {currentFactory?.contactEmail && (
                  <Col span={12}>
                    <Text strong>联系邮箱：</Text>
                    <Text style={{ marginLeft: 8 }}>{currentFactory.contactEmail}</Text>
                  </Col>
                )}
                {currentFactory?.address && (
                  <Col span={12}>
                    <Text strong>详细地址：</Text>
                    <Text style={{ marginLeft: 8 }}>{currentFactory.address}</Text>
                  </Col>
                )}
              </Row>
              {currentFactory?.description && (
                <div style={{ marginTop: 16 }}>
                  <Text strong>描述：</Text>
                  <Text style={{ marginLeft: 8 }}>{currentFactory.description}</Text>
                </div>
              )}
            </Card>
          )}
        </div>
      )}
    </Modal>
  );
};

export default FactoryStats;
/**
 * 组织架构详情组件
 */

import React from 'react';
import {
  Drawer,
  Descriptions,
  Tag,
  Space,
  Button,
  Card,
  Statistic,
  Row,
  Col,
  message,
  Tree,
  Modal,
} from 'antd';
import {
  ApartmentOutlined,
  PhoneOutlined,
  MailOutlined,
  EnvironmentOutlined,
  UserOutlined,
  TeamOutlined,
  HomeOutlined,
  EditOutlined,
  StopOutlined,
  PlayCircleOutlined,
  SettingOutlined,
  InfoCircleOutlined,
  FileTextOutlined,
  BuildOutlined,
} from '@ant-design/icons';
import { useOrganizationStore } from '../store/organizationStore';
import type { OrgNode } from '../types';
import { ORG_NODE_STATUS_MAP, ORG_NODE_TYPE_MAP } from '../types';
import { StatusBadge } from '../../../../shared/components/StatusBadge';

interface OrganizationDetailProps {
  visible: boolean;
  onClose: () => void;
  record: OrgNode | null;
}

/**
 * 组织架构详情组件
 */
export const OrganizationDetail: React.FC<OrganizationDetailProps> = ({
  visible,
  onClose,
  record,
}) => {
  const { updateOrgNodeStatus, loading } = useOrganizationStore();

  if (!record) return null;

  /**
   * 更新组织节点状态
   */
  const handleUpdateStatus = async (status: 'ACTIVE' | 'INACTIVE') => {
    Modal.confirm({
      title: '确认状态变更',
      content: `确定要将组织节点状态更改为 ${status === 'ACTIVE' ? '生效' : '停用'} 吗？`,
      onOk: async () => {
        await updateOrgNodeStatus(record.id, status);
      },
    });
  };

  /**
   * 获取节点类型图标
   */
  const getNodeTypeIcon = (nodeType: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      'COMPANY': <HomeOutlined />,
      'DEPARTMENT': <ApartmentOutlined />,
      'TEAM': <TeamOutlined />,
    };
    return iconMap[nodeType] || <ApartmentOutlined />;
  };

  return (
    <Drawer
      title="组织节点详情"
      width={800}
      open={visible}
      onClose={onClose}
      destroyOnClose
      footer={
        <Space style={{ textAlign: 'right', width: '100%' }}>
          {record.status === 'ACTIVE' && (
            <Button icon={<StopOutlined />} danger onClick={() => handleUpdateStatus('INACTIVE')}>
              停用
            </Button>
          )}
          {record.status === 'INACTIVE' && (
            <Button icon={<PlayCircleOutlined />} type="primary" onClick={() => handleUpdateStatus('ACTIVE')}>
              启用
            </Button>
          )}
          <Button icon={<EditOutlined />} onClick={() => message.info('编辑功能开发中')}>
            编辑
          </Button>
          <Button onClick={onClose}>关闭</Button>
        </Space>
      }
    >
      {/* 统计卡片 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={8}>
            <Statistic
              title="员工数量"
              value={record.employeeCount}
              prefix={<UserOutlined />}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="班组数量"
              value={record.teamCount}
              prefix={<TeamOutlined />}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="部门数量"
              value={record.departmentCount}
              prefix={<ApartmentOutlined />}
            />
          </Col>
        </Row>
      </Card>

      {/* 基本信息 */}
      <Card
        title={
          <Space>
            <InfoCircleOutlined />
            基本信息
          </Space>
        }
        style={{ marginBottom: 16 }}
      >
        <Descriptions column={2} bordered>
          <Descriptions.Item label="节点编码">{record.nodeCode}</Descriptions.Item>
          <Descriptions.Item label="节点名称">{record.nodeName}</Descriptions.Item>
          <Descriptions.Item label="节点类型">
            <Tag icon={getNodeTypeIcon(record.nodeType)} color={ORG_NODE_TYPE_MAP[record.nodeType]?.color ?? 'default'}>
              {ORG_NODE_TYPE_MAP[record.nodeType]?.label ?? String(record.nodeType ?? '-')}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="状态">
            <StatusBadge status={record.status} statusMap={ORG_NODE_STATUS_MAP} />
          </Descriptions.Item>
          <Descriptions.Item label="层级">{record.level}</Descriptions.Item>
          <Descriptions.Item label="排序">{record.sort}</Descriptions.Item>
          <Descriptions.Item label="父节点">{record.parentName || '-'}</Descriptions.Item>
          <Descriptions.Item label="路径">{record.path}</Descriptions.Item>
        </Descriptions>
      </Card>

      {/* 责任人信息 */}
      <Card
        title={
          <Space>
            <UserOutlined />
            责任人信息
          </Space>
        }
        style={{ marginBottom: 16 }}
      >
        <Descriptions column={2} bordered>
          <Descriptions.Item label="负责人">{record.leaderName || '-'}</Descriptions.Item>
          <Descriptions.Item label="副负责人">{record.deputyLeaderName || '-'}</Descriptions.Item>
        </Descriptions>
      </Card>

      {/* 位置信息 */}
      <Card
        title={
          <Space>
            <EnvironmentOutlined />
            位置信息
          </Space>
        }
        style={{ marginBottom: 16 }}
      >
        <Descriptions column={2} bordered>
          <Descriptions.Item label="工厂">{record.factoryName}</Descriptions.Item>
          <Descriptions.Item label="车间">{record.workshopName || '-'}</Descriptions.Item>
          <Descriptions.Item label="工作中心">{record.workCenterName || '-'}</Descriptions.Item>
          <Descriptions.Item label="地址">
            {record.address ? (
              <>
                <EnvironmentOutlined /> {record.address}
              </>
            ) : (
              '-'
            )}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* 联系信息 */}
      <Card
        title={
          <Space>
            <PhoneOutlined />
            联系信息
          </Space>
        }
        style={{ marginBottom: 16 }}
      >
        <Descriptions column={1} bordered>
          <Descriptions.Item label="联系电话">
            {record.phone ? (
              <>
                <PhoneOutlined /> {record.phone}
              </>
            ) : (
              '-'
            )}
          </Descriptions.Item>
          <Descriptions.Item label="联系邮箱">
            {record.email ? (
              <>
                <MailOutlined /> {record.email}
              </>
            ) : (
              '-'
            )}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* 描述信息 */}
      <Card
        title={
          <Space>
            <FileTextOutlined />
            描述信息
          </Space>
        }
        style={{ marginBottom: 16 }}
      >
        <Descriptions column={1} bordered>
          <Descriptions.Item label="描述">{record.description || '-'}</Descriptions.Item>
          <Descriptions.Item label="备注">{record.remark || '-'}</Descriptions.Item>
        </Descriptions>
      </Card>

      {/* 系统信息 */}
      <Card
        title={
          <Space>
            <SettingOutlined />
            系统信息
          </Space>
        }
      >
        <Descriptions column={2} bordered>
          <Descriptions.Item label="创建人">{record.creatorName}</Descriptions.Item>
          <Descriptions.Item label="创建时间">{record.createTime}</Descriptions.Item>
          <Descriptions.Item label="更新人">{record.updaterName || '-'}</Descriptions.Item>
          <Descriptions.Item label="更新时间">{record.updateTime}</Descriptions.Item>
        </Descriptions>
      </Card>
    </Drawer>
  );
};

export default OrganizationDetail;

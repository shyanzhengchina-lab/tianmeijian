/**
 * 工厂详情组件
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
  Divider,
  Modal,
} from 'antd';
import {
  EnvironmentOutlined,
  PhoneOutlined,
  MailOutlined,
  GlobalOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  TranslationOutlined,
  UserOutlined,
  EditOutlined,
  StopOutlined,
  PlayCircleOutlined,
  SettingOutlined,
  InfoCircleOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { useFactoryStore } from '../store/factoryStore';
import type { FactoryConfig } from '../types';
import { FACTORY_STATUS_MAP } from '../types';
import { StatusBadge } from '../../../../shared/components/StatusBadge';

interface FactoryDetailProps {
  visible: boolean;
  onClose: () => void;
  record: FactoryConfig | null;
}

/**
 * 工厂详情组件
 */
export const FactoryDetail: React.FC<FactoryDetailProps> = ({
  visible,
  onClose,
  record,
}) => {
  const { updateFactoryStatus, loading } = useFactoryStore();

  if (!record) return null;

  /**
   * 更新工厂状态
   */
  const handleUpdateStatus = async (status: 'ACTIVE' | 'INACTIVE') => {
    Modal.confirm({
      title: '确认状态变更',
      content: `确定要将工厂状态更改为 ${status === 'ACTIVE' ? '生效' : '停用'} 吗？`,
      onOk: async () => {
        await updateFactoryStatus(record.id, status);
      },
    });
  };

  /**
   * 获取时区显示名称
   */
  const getTimezoneLabel = (timezone: string) => {
    const timezoneMap: Record<string, string> = {
      'Asia/Shanghai': '中国标准时间 (UTC+8)',
      'Asia/Jakarta': '印尼西部时间 (UTC+7)',
      'Asia/Tokyo': '日本标准时间 (UTC+9)',
      'America/New_York': '美国东部时间 (UTC-5)',
      'Europe/London': '格林威治标准时间 (UTC+0)',
    };
    return timezoneMap[timezone] || timezone;
  };

  /**
   * 获取货币显示名称
   */
  const getCurrencyLabel = (currency: string) => {
    const currencyMap: Record<string, string> = {
      'CNY': '人民币 (¥)',
      'IDR': '印尼盾 (Rp)',
      'USD': '美元 ($)',
      'EUR': '欧元 (€)',
      'JPY': '日元 (¥)',
    };
    return currencyMap[currency] || currency;
  };

  /**
   * 获取语言显示名称
   */
  const getLanguageLabel = (language: string) => {
    const languageMap: Record<string, string> = {
      'zh-CN': '简体中文',
      'zh-TW': '繁体中文',
      'en-US': '美式英语',
      'id-ID': '印尼语',
      'ja-JP': '日语',
    };
    return languageMap[language] || language;
  };

  return (
    <Drawer
      title="工厂详情"
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
      {/* 状态卡片 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={12}>
            <Statistic
              title="工厂状态"
              value={record.status === 'ACTIVE' ? '生效' : '停用'}
              valueStyle={{ color: record.status === 'ACTIVE' ? '#3f8600' : '#cf1322' }}
              prefix={record.status === 'ACTIVE' ? <PlayCircleOutlined /> : <StopOutlined />}
            />
          </Col>
          <Col span={12}>
            <Statistic
              title="排序"
              value={record.sortOrder}
              prefix={<SettingOutlined />}
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
          <Descriptions.Item label="工厂编码">{record.code}</Descriptions.Item>
          <Descriptions.Item label="状态">
            <StatusBadge status={record.status} statusMap={FACTORY_STATUS_MAP} />
          </Descriptions.Item>
          <Descriptions.Item label="工厂名称（中文）">{record.name}</Descriptions.Item>
          <Descriptions.Item label="工厂名称（英文）">{record.nameEn || '-'}</Descriptions.Item>
          <Descriptions.Item label="所在国家">
            <GlobalOutlined /> {record.country}
          </Descriptions.Item>
          <Descriptions.Item label="省份/州">{record.province || '-'}</Descriptions.Item>
          <Descriptions.Item label="城市">{record.city || '-'}</Descriptions.Item>
          <Descriptions.Item label="详细地址" span={2}>
            <EnvironmentOutlined /> {record.address || '-'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* 配置信息 */}
      <Card
        title={
          <Space>
            <SettingOutlined />
            配置信息
          </Space>
        }
        style={{ marginBottom: 16 }}
      >
        <Descriptions column={1} bordered>
          <Descriptions.Item label="时区">
            <ClockCircleOutlined /> {getTimezoneLabel(record.timezone)}
          </Descriptions.Item>
          <Descriptions.Item label="货币">
            <DollarOutlined /> {getCurrencyLabel(record.currency)}
          </Descriptions.Item>
          <Descriptions.Item label="主用语言">
            <TranslationOutlined /> {getLanguageLabel(record.language)}
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
          <Descriptions.Item label="联系人">
            <UserOutlined /> {record.contactPerson || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="联系电话">
            <PhoneOutlined /> {record.contactPhone || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="联系邮箱">
            <MailOutlined /> {record.contactEmail || '-'}
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

export default FactoryDetail;

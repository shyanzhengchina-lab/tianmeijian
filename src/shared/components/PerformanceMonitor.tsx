/**
 * 性能监控组件
 * 实时显示应用性能指标
 */

import React, { useEffect, useState } from 'react';
import { Card, Statistic, Row, Col, Progress, Button, Table, Tag } from 'antd';
import {
  ThunderboltOutlined,
  ClockCircleOutlined,
  DatabaseOutlined,
  ClearOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import { performanceMonitor, requestCache } from '../utils/performanceUtils';
import { apiClient } from '../api/apiClient';
import type { ColumnsType } from 'antd/es/table';

/**
 * 性能指标接口
 */
interface PerformanceMetric {
  name: string;
  count: number;
  average: number;
  min: number;
  max: number;
}

/**
 * 性能监控组件
 */
const PerformanceMonitorComponent: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [cacheStats, setCacheStats] = useState({ size: 0, pending: 0, keys: [] as string[] });
  const [apiStats, setApiStats] = useState<any>({});
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!isVisible) return;

    // 定期更新性能数据
    const timer = setInterval(() => {
      updateMetrics();
    }, 1000);

    return () => clearInterval(timer);
  }, [isVisible]);

  const updateMetrics = () => {
    setMetrics(performanceMonitor.getStats() as PerformanceMetric[]);
    setCacheStats(requestCache.getStats());
    setApiStats(apiClient.getPerformanceStats());
  };

  const handleClearMetrics = () => {
    performanceMonitor.clear();
    requestCache.clear();
    updateMetrics();
  };

  const handleExportMetrics = () => {
    const data = {
      metrics: performanceMonitor.getStats(),
      cache: requestCache.getStats(),
      api: apiClient.getPerformanceStats(),
      timestamp: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-metrics-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const columns: ColumnsType<PerformanceMetric> = [
    {
      title: '指标名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: '调用次数',
      dataIndex: 'count',
      key: 'count',
      sorter: (a, b) => a.count - b.count,
    },
    {
      title: '平均耗时',
      dataIndex: 'average',
      key: 'average',
      render: (value: number) => `${value.toFixed(2)}ms`,
      sorter: (a, b) => a.average - b.average,
    },
    {
      title: '最小耗时',
      dataIndex: 'min',
      key: 'min',
      render: (value: number) => `${value.toFixed(2)}ms`,
    },
    {
      title: '最大耗时',
      dataIndex: 'max',
      key: 'max',
      render: (value: number) => `${value.toFixed(2)}ms`,
    },
  ];

  if (!isVisible) {
    return (
      <div
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 9999,
        }}
      >
        <Button
          type="primary"
          icon={<ThunderboltOutlined />}
          onClick={() => setIsVisible(true)}
          size="large"
          style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)' }}
        >
          性能监控
        </Button>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: '800px',
        maxHeight: '80vh',
        overflowY: 'auto',
        zIndex: 9999,
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
        borderRadius: '8px',
        backgroundColor: '#fff',
      }}
    >
      <Card
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>
              <ThunderboltOutlined /> 性能监控
            </span>
            <Button
              type="text"
              size="small"
              onClick={() => setIsVisible(false)}
            >
              ×
            </Button>
          </div>
        }
        extra={
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button
              icon={<ClearOutlined />}
              size="small"
              onClick={handleClearMetrics}
            >
              清除
            </Button>
            <Button
              icon={<DownloadOutlined />}
              size="small"
              onClick={handleExportMetrics}
            >
              导出
            </Button>
          </div>
        }
      >
        {/* 总体统计 */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={8}>
            <Statistic
              title="API调用次数"
              value={apiStats.totalCalls || 0}
              prefix={<DatabaseOutlined />}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="平均响应时间"
              value={apiStats.avgResponseTime?.toFixed(2) || 0}
              suffix="ms"
              prefix={<ClockCircleOutlined />}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="缓存命中率"
              value={apiStats.cacheHitRate?.toFixed(2) || 0}
              suffix="%"
              prefix={<ThunderboltOutlined />}
            />
          </Col>
        </Row>

        {/* 缓存统计 */}
        <Card title="缓存统计" size="small" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={8}>
              <Statistic title="缓存条目" value={cacheStats.size} />
            </Col>
            <Col span={8}>
              <Statistic title="待处理请求" value={cacheStats.pending} />
            </Col>
            <Col span={8}>
              <Progress
                type="circle"
                percent={cacheStats.size > 0 ? 75 : 0}
                width={80}
                format={() => '状态'}
              />
            </Col>
          </Row>
        </Card>

        {/* 性能指标表格 */}
        <Card title="性能指标" size="small">
          <Table
            columns={columns}
            dataSource={metrics}
            rowKey="name"
            size="small"
            pagination={false}
            scroll={{ y: 200 }}
          />
        </Card>
      </Card>
    </div>
  );
};

export default PerformanceMonitorComponent;

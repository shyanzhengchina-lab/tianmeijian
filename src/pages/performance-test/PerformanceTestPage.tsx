/**
 * 性能测试页面
 * 用于验证性能优化效果
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Row,
  Col,
  Statistic,
  Progress,
  Table,
  Tag,
  Space,
  message,
  Typography,
  Divider,
} from 'antd';
import {
  ThunderboltOutlined,
  ClockCircleOutlined,
  DatabaseOutlined,
  ReloadOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import PerformanceBenchmark, {
  BenchmarkResult,
  benchmarkSuites,
} from '../../shared/utils/performanceBenchmark';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;

/**
 * 性能测试页面组件
 */
const PerformanceTestPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<BenchmarkResult[]>([]);
  const [currentTest, setCurrentTest] = useState<string>('');
  const [summary, setSummary] = useState<any>(null);

  /**
   * 生成测试数据
   */
  const generateTestData = (size: number) => {
    return Array.from({ length: size }, (_, i) => ({
      id: `ID-${i.toString().padStart(6, '0')}`,
      name: `物料名称 ${i + 1}`,
      code: `MAT-${i.toString().padStart(6, '0')}`,
      category: ['原材料', '半成品', '成品', '辅料'][Math.floor(Math.random() * 4)],
      unit: ['kg', 'g', '件', '个', '套'][Math.floor(Math.random() * 5)],
      price: Math.floor(Math.random() * 10000) / 100,
      quantity: Math.floor(Math.random() * 10000),
      status: ['启用', '禁用', '草稿'][Math.floor(Math.random() * 3)],
      createTime: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      updateTime: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    }));
  };

  /**
   * 运行完整性能测试
   */
  const runFullTest = async () => {
    setLoading(true);
    setCurrentTest('正在运行完整性能测试...');
    const benchmark = new PerformanceBenchmark();

    try {
      const results: BenchmarkResult[] = [];

      // 测试1: 数据生成性能
      for (const size of [100, 500, 1000, 5000]) {
        const result = await benchmark.measure(
          `数据生成 (${size}条)`,
          () => generateTestData(size),
          1
        );
        results.push(result);
      }

      // 测试2: 数据排序性能
      for (const size of [100, 500, 1000, 5000]) {
        const data = generateTestData(size);
        const result = await benchmark.measure(
          `数据排序 (${size}条)`,
          () => [...data].sort((a, b) => a.price - b.price),
          1
        );
        results.push(result);
      }

      // 测试3: 数据过滤性能
      for (const size of [100, 500, 1000, 5000]) {
        const data = generateTestData(size);
        const result = await benchmark.measure(
          `数据过滤 (${size}条)`,
          () => data.filter(item => item.price > 500),
          1
        );
        results.push(result);
      }

      // 测试4: 数据搜索性能
      for (const size of [100, 500, 1000, 5000]) {
        const data = generateTestData(size);
        const result = await benchmark.measure(
          `数据搜索 (${size}条)`,
          () => data.filter(item => item.name.includes('物料')),
          1
        );
        results.push(result);
      }

      // 测试5: 内存使用
      const memoryResult = await benchmark.testMemory(
        '内存使用 (1000条数据)',
        () => generateTestData(1000)
      );
      console.log('Memory usage:', memoryResult);

      setTestResults(results);

      // 生成总结
      const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
      const averageDuration = totalDuration / results.length;
      setSummary({
        totalTests: results.length,
        totalDuration,
        averageDuration,
        fastest: results.sort((a, b) => a.duration - b.duration)[0],
        slowest: results.sort((a, b) => b.duration - a.duration)[0],
      });

      message.success('性能测试完成！');
    } catch (error) {
      console.error('性能测试失败:', error);
      message.error('性能测试失败，请查看控制台');
    } finally {
      setLoading(false);
      setCurrentTest('');
    }
  };

  /**
   * 导出测试结果
   */
  const exportResults = () => {
    const data = {
      testResults,
      summary,
      timestamp: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-test-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    message.success('测试结果已导出');
  };

  /**
   * 测试结果表格列
   */
  const columns: ColumnsType<BenchmarkResult> = [
    {
      title: '测试名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: '操作次数',
      dataIndex: 'operations',
      key: 'operations',
    },
    {
      title: '耗时',
      dataIndex: 'duration',
      key: 'duration',
      render: (value: number) => `${value.toFixed(2)}ms`,
      sorter: (a, b) => a.duration - b.duration,
    },
    {
      title: '吞吐量',
      dataIndex: 'opsPerSecond',
      key: 'opsPerSecond',
      render: (value: number) => `${value.toFixed(2)} ops/s`,
      sorter: (a, b) => a.opsPerSecond - b.opsPerSecond,
    },
    {
      title: '内存使用',
      dataIndex: 'memory',
      key: 'memory',
      render: (value?: number) => (value ? `${(value / 1024 / 1024).toFixed(2)}MB` : 'N/A'),
    },
  ];

  return (
    <div style={{ padding: '24px', minHeight: '100vh', background: '#f5f7fa' }}>
      <Card>
        <Title level={2}>
          <ThunderboltOutlined /> 性能测试中心
        </Title>
        <Text type="secondary">
          用于验证性能优化效果，支持大数据量场景测试
        </Text>

        <Divider />

        {/* 控制面板 */}
        <Card title="测试控制" style={{ marginBottom: 24 }}>
          <Space size="large">
            <Button
              type="primary"
              icon={<ThunderboltOutlined />}
              onClick={runFullTest}
              loading={loading}
              size="large"
            >
              运行完整测试
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                setTestResults([]);
                setSummary(null);
                message.info('已清除测试结果');
              }}
              disabled={loading}
            >
              清除结果
            </Button>
            <Button
              icon={<DownloadOutlined />}
              onClick={exportResults}
              disabled={testResults.length === 0}
            >
              导出结果
            </Button>
          </Space>

          {loading && (
            <div style={{ marginTop: 16 }}>
              <Text type="secondary">{currentTest}</Text>
              <Progress percent={66} status="active" />
            </div>
          )}
        </Card>

        {/* 测试总结 */}
        {summary && (
          <Card title="测试总结" style={{ marginBottom: 24 }}>
            <Row gutter={16}>
              <Col span={6}>
                <Statistic
                  title="测试用例数"
                  value={summary.totalTests}
                  prefix={<DatabaseOutlined />}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="总耗时"
                  value={summary.totalDuration.toFixed(2)}
                  suffix="ms"
                  prefix={<ClockCircleOutlined />}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="平均耗时"
                  value={summary.averageDuration.toFixed(2)}
                  suffix="ms"
                  prefix={<ClockCircleOutlined />}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="最快测试"
                  value={summary.fastest.name}
                  valueStyle={{ fontSize: 14 }}
                />
              </Col>
            </Row>
          </Card>
        )}

        {/* 测试结果 */}
        {testResults.length > 0 && (
          <Card title="详细结果">
            <Table
              columns={columns}
              dataSource={testResults}
              rowKey="name"
              size="small"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `共 ${total} 条测试结果`,
              }}
            />
          </Card>
        )}

        {/* 性能指标说明 */}
        <Card title="性能指标说明" style={{ marginTop: 24 }}>
          <Space direction="vertical" size="small">
            <Text>• <Text strong>耗时:</Text> 执行测试用例所需的时间（毫秒）</Text>
            <Text>• <Text strong>吞吐量:</Text> 每秒可以执行的操作次数（ops/s）</Text>
            <Text>• <Text strong>内存使用:</Text> 测试过程中分配的额外内存（MB）</Text>
            <Divider style={{ margin: '8px 0' }} />
            <Text type="secondary">
              性能目标：
            </Text>
            <Text>• 数据生成 (1000条): <Text type="success">&lt; 100ms</Text></Text>
            <Text>• 数据排序 (1000条): <Text type="success">&lt; 50ms</Text></Text>
            <Text>• 数据过滤 (1000条): <Text type="success">&lt; 30ms</Text></Text>
            <Text>• 数据搜索 (1000条): <Text type="success">&lt; 50ms</Text></Text>
            <Text>• 首屏加载时间: <Text type="success">&lt; 2000ms</Text></Text>
            <Text>• 页面切换时间: <Text type="success">&lt; 500ms</Text></Text>
          </Space>
        </Card>
      </Card>
    </div>
  );
};

export default PerformanceTestPage;

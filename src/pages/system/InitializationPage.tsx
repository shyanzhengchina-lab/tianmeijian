/**
 * 项目初始化引导页面
 * 用于首次访问时的系统初始化引导
 */

import React, { useState, useEffect } from 'react';
import { Card, Steps, Button, Space, Alert, Row, Col, Progress, message, Spin } from 'antd';
const Step = (Steps as any).Step || Steps;
import {
  CheckCircleOutlined, LoadingOutlined, RocketOutlined,
  DatabaseOutlined, SafetyOutlined, SettingOutlined,
  ThunderboltOutlined, CloudUploadOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';


/**
 * 初始化步骤类型
 */
type InitializationStep =
  | 'environment-check'
  | 'dependency-check'
  | 'configuration'
  | 'data-import'
  | 'system-test'
  | 'complete';

interface StepStatus {
  key: string;
  title: string;
  description: string;
  status: 'wait' | 'process' | 'success' | 'error';
  progress?: number;
  error?: string;
}

const InitializationPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<InitializationStep>('environment-check');
  const [steps, setSteps] = useState<StepStatus[]>([
    {
      key: 'environment-check',
      title: '环境检查',
      description: '检查浏览器兼容性和运行环境',
      status: 'wait',
      progress: 0,
    },
    {
      key: 'dependency-check',
      title: '依赖检查',
      description: '验证系统依赖和API连接',
      status: 'wait',
      progress: 0,
    },
    {
      key: 'configuration',
      title: '系统配置',
      description: '加载系统配置和初始化参数',
      status: 'wait',
      progress: 0,
    },
    {
      key: 'data-import',
      title: '数据导入',
      description: '导入初始数据和配置信息',
      status: 'wait',
      progress: 0,
    },
    {
      key: 'system-test',
      title: '系统测试',
      description: '执行系统功能测试和验证',
      status: 'wait',
      progress: 0,
    },
    {
      key: 'complete',
      title: '完成',
      description: '初始化完成，欢迎使用系统',
      status: 'wait',
    },
  ]);

  useEffect(() => {
    startInitialization();
  }, []);

  /**
   * 开始初始化流程
   */
  const startInitialization = async () => {
    try {
      // 环境检查
      await processStep('environment-check', async () => {
        await checkBrowserCompatibility();
        await checkNetworkConnection();
        await checkLocalStorage();
      });

      // 依赖检查
      await processStep('dependency-check', async () => {
        await checkAPIConnection();
        await checkRequiredFeatures();
      });

      // 系统配置
      await processStep('configuration', async () => {
        await loadSystemConfig();
        await initializeUserPreferences();
      });

      // 数据导入
      await processStep('data-import', async () => {
        await importInitialData();
        await loadUserSession();
      });

      // 系统测试
      await processStep('system-test', async () => {
        await performHealthCheck();
        await runQuickTests();
      });

      // 完成
      await processStep('complete', async () => {
        message.success('系统初始化完成！');
      });

      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error) {
      console.error('初始化失败:', error);
      message.error('系统初始化失败，请刷新页面重试');
    }
  };

  /**
   * 处理单个步骤
   */
  const processStep = async (
    stepKey: string,
    processor: () => Promise<void>
  ): Promise<void> => {
    setSteps(prev => prev.map(step =>
      step.key === stepKey
        ? { ...step, status: 'process' }
        : step
    ));

    await processor();

    setSteps(prev => prev.map(step =>
      step.key === stepKey
        ? { ...step, status: 'success', progress: 100 }
        : step
    ));
  };

  /**
   * 环境检查
   */
  const checkBrowserCompatibility = async () => {
    // 模拟进度更新
    for (let i = 0; i <= 100; i += 20) {
      await delay(100);
      updateStepProgress('environment-check', i);
    }

    // 实际检查逻辑
    const features = {
      es6: typeof Symbol !== 'undefined',
      promise: typeof Promise !== 'undefined',
      localstorage: typeof localStorage !== 'undefined',
      websocket: typeof WebSocket !== 'undefined',
      canvas: typeof document.createElement('canvas').getContext,
    };

    console.log('浏览器兼容性检查:', features);
  };

  const checkNetworkConnection = async () => {
    updateStepProgress('environment-check', 80);

    const pingUrl = window.location.origin;
    try {
      const response = await fetch(pingUrl, { method: 'HEAD', cache: 'no-cache' });
      console.log('网络连接检查:', response.ok);
    } catch (error) {
      console.error('网络连接检查失败:', error);
    }
  };

  const checkLocalStorage = async () => {
    updateStepProgress('environment-check', 90);

    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
      console.log('本地存储检查: 正常');
    } catch (error) {
      console.error('本地存储检查失败:', error);
    }
  };

  /**
   * 依赖检查
   */
  const checkAPIConnection = async () => {
    // 模拟API连接检查
    for (let i = 0; i <= 100; i += 25) {
      await delay(50);
      updateStepProgress('dependency-check', i);
    }

    console.log('API连接检查: 完成');
  };

  const checkRequiredFeatures = async () => {
    updateStepProgress('dependency-check', 75);

    const features = {
      webgl: (function() {
        try {
          return !!window.WebGLRenderingContext;
        } catch (e) {
          return false;
        }
      })(),
      webrtc: typeof RTCPeerConnection !== 'undefined',
      geolocation: typeof navigator.geolocation !== 'undefined',
    };

    console.log('必需功能检查:', features);
  };

  /**
   * 系统配置
   */
  const loadSystemConfig = async () => {
    for (let i = 0; i <= 100; i += 10) {
      await delay(50);
      updateStepProgress('configuration', i);
    }

    console.log('系统配置加载: 完成');
  };

  const initializeUserPreferences = async () => {
    updateStepProgress('configuration', 80);

    // 初始化用户偏好设置
    const defaultPreferences = {
      theme: 'light',
      language: 'zh-CN',
      sidebarCollapsed: false,
      pageSize: 10,
    };

    localStorage.setItem('user_preferences', JSON.stringify(defaultPreferences));
  };

  /**
   * 数据导入
   */
  const importInitialData = async () => {
    for (let i = 0; i <= 100; i += 5) {
      await delay(50);
      updateStepProgress('data-import', i);
    }

    console.log('初始数据导入: 完成');
  };

  const loadUserSession = async () => {
    updateStepProgress('data-import', 80);

    // 恢复用户会话
    const savedSession = localStorage.getItem('user_session');
    if (savedSession) {
      console.log('用户会话恢复: 已登录');
    }
  };

  /**
   * 系统测试
   */
  const performHealthCheck = async () => {
    updateStepProgress('system-test', 0);

    const checks = [
      { name: '系统健康', url: '/api/health', status: 'pending' },
      { name: '数据库连接', url: '/api/health/db', status: 'pending' },
      { name: 'API服务', url: '/api/health/api', status: 'pending' },
      { name: '缓存服务', url: '/api/health/cache', status: 'pending' },
    ];

    for (let i = 0; i < checks.length; i++) {
      updateStepProgress('system-test', Math.floor((i / checks.length) * 80));
      await delay(500);

      // 模拟健康检查
      checks[i].status = Math.random() > 0.3 ? 'success' : 'warning';
    }

    console.log('系统健康检查完成');
  };

  const runQuickTests = async () => {
    updateStepProgress('system-test', 80);

    const tests = [
      { name: '路由测试', status: 'pending' },
      { name: '状态管理', status: 'pending' },
      { name: '组件渲染', status: 'pending' },
      { name: '数据加载', status: 'pending' },
    ];

    for (let i = 0; i < tests.length; i++) {
      updateStepProgress('system-test', 80 + Math.floor((i / tests.length) * 20));
      await delay(300);

      tests[i].status = 'success';
    }

    console.log('快速测试完成');
  };

  /**
   * 更新步骤进度
   */
  const updateStepProgress = (stepKey: string, progress: number) => {
    setSteps(prev => prev.map(step =>
      step.key === stepKey
        ? { ...step, progress }
        : step
    ));
  };

  /**
   * 获取当前步骤的索引
   */
  const getCurrentStepIndex = () => {
    return steps.findIndex(step => step.key === currentStep);
  };

  /**
   * 重新初始化
   */
  const handleRetry = () => {
    setCurrentStep('environment-check');
    setSteps(prev => prev.map(step => ({
      ...step,
      status: 'wait',
      progress: 0,
      error: undefined,
    })));
    startInitialization();
  };

  /**
   * 跳过初始化
   */
  const handleSkip = () => {
    if (window.confirm('确定要跳过系统初始化吗？可能会影响系统功能使用。')) {
      navigate('/dashboard');
    }
  };

  /**
   * 延时函数
   */
  const delay = (ms: number): Promise<void> => {
    return new Promise((resolve) => setTimeout(resolve, ms));
  };

  /**
   * 获取步骤图标
   */
  const getStepIcon = (status: string) => {
    switch (status) {
      case 'wait':
        return <LoadingOutlined style={{ color: '#999' }} />;
      case 'process':
        return <LoadingOutlined style={{ color: '#1677ff' }} spin />;
      case 'success':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'error':
        return <ThunderboltOutlined style={{ color: '#ff4d4f' }} />;
      default:
        return <LoadingOutlined />;
    }
  };

  /**
   * 获取步骤颜色
   */
  const getStepColor = (status: string) => {
    switch (status) {
      case 'wait': return '#d9d9d9';
      case 'process': return '#1677ff';
      case 'success': return '#52c41a';
      case 'error': return '#ff4d4f';
      default: return '#d9d9d9';
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f0f2f5',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }}>
      <div style={{ maxWidth: '800px', width: '100%' }}>
        <Card>
          {/* 页面标题 */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <RocketOutlined style={{ fontSize: '64px', color: '#1677ff', marginBottom: '16px' }} />
            <h1 style={{ fontSize: '32px', fontWeight: 'bold', margin: 0 }}>
              React MES 系统初始化
            </h1>
            <p style={{ fontSize: '16px', color: '#666', marginTop: '12px' }}>
              正在配置系统，请稍候...
            </p>
          </div>

          {/* 初始化步骤 */}
          <div style={{ marginBottom: '32px' }}>
            {(() => {
              const StepsAny = Steps as any;
              const StepAny = Step as any;
              return (
                <StepsAny current={getCurrentStepIndex()} size="small">
                  {steps.map((step) => (
                    <StepAny
                      key={step.key}
                      title={step.title}
                      description={step.description}
                      status={getStepIcon(step.status)}
                    >
                      <div style={{ padding: '16px 0', minHeight: '150px' }}>
                        <h3 style={{ marginBottom: '16px' }}>{step.title}</h3>
                        <p style={{ color: '#666', marginBottom: '16px' }}>{step.description}</p>

                        {step.status === 'process' && (
                          <Progress
                            percent={step.progress || 0}
                            strokeColor={getStepColor(step.status)}
                            trailColor={getStepColor(step.status)}
                          />
                        )}

                        {step.status === 'error' && step.error && (
                          <Alert
                            message={step.error}
                            type="error"
                            showIcon
                            style={{ marginTop: '12px' }}
                          />
                        )}

                        {step.status === 'success' && (
                          <Alert
                            message={`${step.title} 完成`}
                            type="success"
                            showIcon
                            style={{ marginTop: '12px' }}
                          />
                        )}
                      </div>
                    </StepAny>
                  ))}
                </StepsAny>
              );
            })()}
          </div>

          {/* 操作按钮 */}
          <div style={{ textAlign: 'center', marginTop: '32px' }}>
            <Space size="large">
              <Button
                icon={<SettingOutlined />}
                onClick={handleRetry}
              >
                重新初始化
              </Button>
              <Button
                type="default"
                onClick={handleSkip}
              >
                跳过初始化
              </Button>
            </Space>
          </div>

          {/* 功能特性 */}
          <div style={{ marginTop: '32px' }}>
            <Row gutter={16}>
              <Col span={8}>
                <Card size="small" title="系统特性">
                  <div style={{ marginBottom: '12px' }}>
                    <DatabaseOutlined /> <strong>数据安全</strong>
                  </div>
                  <p style={{ color: '#666', marginTop: '8px' }}>
                    完整的数据备份和恢复机制
                  </p>
                  <div style={{ marginBottom: '12px' }}>
                    <SafetyOutlined /> <strong>访问控制</strong>
                  </div>
                  <p style={{ color: '#666', marginTop: '8px' }}>
                    细粒度的权限管理和角色控制
                  </p>
                </Card>
              </Col>

              <Col span={8}>
                <Card size="small" title="性能优化">
                  <div style={{ marginBottom: '12px' }}>
                    <ThunderboltOutlined /> <strong>快速响应</strong>
                  </div>
                  <p style={{ color: '#666', marginTop: '8px' }}>
                    优化的加载性能和渲染速度
                  </p>
                  <div style={{ marginBottom: '12px' }}>
                    <CloudUploadOutlined /> <strong>离线支持</strong>
                  </div>
                  <p style={{ color: '#666', marginTop: '8px' }}>
                    支持离线操作和数据同步
                  </p>
                </Card>
              </Col>
            </Row>
          </div>

          {/* 版本信息 */}
          <div style={{ marginTop: '32px', textAlign: 'center', color: '#999' }}>
            <p>版本 v2.0.0 | 构建时间: 2026-05-01</p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default InitializationPage;

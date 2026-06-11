/**
 * 新版登录页面 - 使用新的认证系统
 * 集成真实的用户认证API
 */

import React, { useState, useEffect } from 'react';
import { Form, Input, Button, message, Checkbox, Tabs, Tag, Divider } from 'antd';
import {
  UserOutlined,
  LockOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
  WifiOutlined,
  SafetyOutlined,
  CheckCircleFilled,
  QuestionCircleOutlined,
  DesktopOutlined,
  WarningOutlined,
  BankOutlined,
  GlobalOutlined,
  SwapOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../shared/stores/authStore';
import { authApi } from '../../shared/api/authApi';
import type { LoginRequest } from '../../shared/api/authApi';
import './LoginPage.css';

interface LoginPageProps {
  // 可以扩展其他属性
}

const FACTORIES = [
  { id: 'F001', name: '南京工厂', nameEn: 'Nanjing Factory', country: '中国', status: 'ACTIVE', timezone: 'GMT+8', currency: 'CNY', language: 'zh-CN' },
  { id: 'F002', name: '上海工厂', nameEn: 'Shanghai Factory', country: '中国', status: 'ACTIVE', timezone: 'GMT+8', currency: 'CNY', language: 'zh-CN' },
  { id: 'F003', name: '苏州工厂', nameEn: 'Suzhou Factory', country: '中国', status: 'ACTIVE', timezone: 'GMT+8', currency: 'CNY', language: 'zh-CN' },
];

const DEMO_USERS = [
  { id: 'admin', label: '系统管理员', role: '全集团 · 所有工厂', badge: '#f5222d', password: '123456' },
  { id: 'E001',  label: '李四',      role: '班组长 · 南京工厂', badge: '#1677ff', password: '123456' },
  { id: 'E040',  label: '沈美玲',   role: '追溯专员 · 多工厂', badge: '#13c2c2', password: '123456' },
  { id: 'E010',  label: '吴晓燕',   role: '质检员 · 南京工厂', badge: '#722ed1', password: '123456' },
  { id: 'E020',  label: '郑国强',   role: '质检主管',           badge: '#531dab', password: '123456' },
  { id: 'E030',  label: '冯建军',   role: '设备管理员',         badge: '#d4380d', password: '123456' },
];

/**
 * 新版登录页面组件
 */
const LoginPage: React.FC<LoginPageProps> = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, user: currentUser } = useAuthStore();

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('password');
  const [remember, setRemember] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [form] = Form.useForm();

  // 工厂选择步骤
  const [step, setStep] = useState<'login' | 'factory'>('login');
  const [availableFactories, setAvailableFactories] = useState<typeof FACTORIES>([]);
  const [selectedFactoryId, setSelectedFactoryId] = useState<string>('F001');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 如果用户已登录，重定向到之前访问的页面或首页
  useEffect(() => {
    if (currentUser) {
      const from = (location.state as any)?.from || '/';
      navigate(from, { replace: true });
    }
  }, [currentUser, navigate, location]);

  const formatTime = (d: Date) =>
    `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;

  // Step 1: 工号/密码验证
  const handleLogin = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      const loginRequest: LoginRequest = {
        username: values.username,  // 表单字段名 username，对应 LoginRequest.username
        password: values.password,
      };

      // 调用登录API
      await login(loginRequest);

      const user = useAuthStore.getState().user;

      if (user) {
        // 获取用户的工厂权限
        // 注意：后端当前版本暂未在 LoginResponse 中返回 factoryIds，
        // 此时回退到默认工厂 F001，待后端扩展后会自动生效。
        const factoryIds: string[] = user.factoryIds ?? [];
        const factories = factoryIds.length > 0
          ? FACTORIES.filter(f => factoryIds.includes(f.id))
          : FACTORIES; // 无工厂限制时开放全部工厂

        if (factories.length === 1) {
          // 只有一个工厂：直接进入
          const factory = factories[0];
          localStorage.setItem('currentFactoryId', factory.id);
          localStorage.setItem('currentFactoryName', factory.name);

          const from = (location.state as any)?.from || '/dashboard';
          navigate(from, { replace: true });
          message.success(`欢迎回来，${user.realName}！当前工厂：${factory.name}`);
        } else if (factories.length > 1) {
          // 多工厂：显示工厂选择步骤
          const defaultId = user.defaultFactoryId || factories[0].id;
          setAvailableFactories(factories);
          setSelectedFactoryId(defaultId);
          setStep('factory');
        } else {
          // 兜底：使用系统默认工厂直接进入
          const defaultFactory = FACTORIES[0];
          localStorage.setItem('currentFactoryId', defaultFactory.id);
          localStorage.setItem('currentFactoryName', defaultFactory.name);
          const from = (location.state as any)?.from || '/dashboard';
          navigate(from, { replace: true });
          message.success(`欢迎回来，${user.realName}！`);
        }
      }
    } catch (error: any) {
      console.error('登录失败:', error);
      const errorMessage = error?.response?.data?.message || error?.message || '登录失败，请检查用户名和密码';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: 确认工厂选择
  const handleFactoryConfirm = () => {
    const factory = FACTORIES.find(f => f.id === selectedFactoryId);
    if (!factory) return;

    localStorage.setItem('currentFactoryId', factory.id);
    localStorage.setItem('currentFactoryName', factory.name);

    const from = (location.state as any)?.from || '/dashboard';
    navigate(from, { replace: true });

    const user = useAuthStore.getState().user;
    message.success(`欢迎回来，${user?.realName}！已进入 ${factory.name}`);
  };

  const handleQuickLogin = (demoUser: typeof DEMO_USERS[0]) => {
    form.setFieldsValue({ username: demoUser.id, password: demoUser.password });
    handleLogin({ username: demoUser.id, password: demoUser.password }); // username -> employeeId in handler
  };

  const tabItems = [
    {
      key: 'password',
      label: (<span className="tab-label"><LockOutlined />密码登录</span>),
    },
    {
      key: 'nfc',
      label: (<span className="tab-label"><WifiOutlined />NFC登录</span>),
    },
    {
      key: 'bio',
      label: (<span className="tab-label"><SafetyOutlined />生物识别</span>),
    },
  ];

  // 工厂选择卡片
  if (step === 'factory') {
    const user = useAuthStore.getState().user;
    return (
      <div className="login-bg">
        <div className="login-main-card" style={{ maxWidth: 520 }}>
          <div className="login-card-header">
            <div className="login-card-title">YonBIP/SY 医疗器械 · 选择工厂</div>
            <div className="login-card-subtitle">
              欢迎，{user?.realName}｜您有 {availableFactories.length} 个工厂权限
            </div>
          </div>
          <div style={{ padding: '28px 32px 32px' }}>
            <div style={{ marginBottom: 20, color: '#666', fontSize: 13 }}>
              <GlobalOutlined style={{ marginRight: 6 }} />
              请选择本次登录要进入的工厂：
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
              {availableFactories.map(f => {
                const selected = f.id === selectedFactoryId;
                return (
                  <div
                    key={f.id}
                    onClick={() => setSelectedFactoryId(f.id)}
                    style={{
                      border: `2px solid ${selected ? '#1677ff' : '#e8e8e8'}`,
                      borderRadius: 10,
                      padding: '14px 18px',
                      cursor: 'pointer',
                      background: selected ? '#e6f4ff' : '#fafafa',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      transition: 'all 0.2s',
                    }}
                  >
                    <BankOutlined style={{ fontSize: 24, color: selected ? '#1677ff' : '#999' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 15, color: selected ? '#1677ff' : '#333' }}>
                        {f.name}
                        {f.nameEn && <span style={{ fontSize: 12, color: '#888', marginLeft: 8 }}>{f.nameEn}</span>}
                      </div>
                      <div style={{ marginTop: 4, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <Tag style={{ fontSize: 11 }}>{f.country}</Tag>
                        <Tag color="blue" style={{ fontSize: 11 }}>{f.timezone}</Tag>
                        <Tag color="green" style={{ fontSize: 11 }}>{f.currency}</Tag>
                        <Tag color="purple" style={{ fontSize: 11 }}>{f.language}</Tag>
                      </div>
                    </div>
                    {selected && (
                      <CheckCircleFilled style={{ color: '#1677ff', fontSize: 20 }} />
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <Button
                block
                onClick={() => { setStep('login'); }}
                icon={<SwapOutlined />}
              >
                重新登录
              </Button>
              <Button
                type="primary"
                block
                size="large"
                onClick={handleFactoryConfirm}
                icon={<BankOutlined />}
              >
                进入{FACTORIES.find(f => f.id === selectedFactoryId)?.name ?? '工厂'}
              </Button>
            </div>
          </div>
        </div>

        <div className="login-footer-bar">
          <span>版本：v2.3.0（新认证系统）</span>
          <span className="footer-sep">|</span>
          <span>最后更新：{formatTime(currentTime)}</span>
        </div>
      </div>
    );
  }

  // 正常登录表单
  return (
    <div className="login-bg">
      {/* 主卡片 */}
      <div className="login-main-card">
        {/* 红色标题栏 */}
        <div className="login-card-header">
          <div className="login-card-title">YonBIP/SY 医疗器械 · 生产执行系统</div>
          <div className="login-card-subtitle">医疗器械GMP合规生产管理系统 · 新认证版</div>
        </div>

        {/* 双栏内容区 */}
        <div className="login-card-body">
          {/* 左侧：登录表单 */}
          <div className="login-form-col">
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              items={tabItems}
              className="login-tabs"
            />

            {activeTab === 'password' && (
              <Form
                form={form}
                name="login"
                onFinish={handleLogin}
                autoComplete="off"
                initialValues={{ username: 'admin', password: '123456' }}
              >
                <div className="form-field-label">用户名</div>
                <Form.Item
                  name="username"
                  rules={[{ required: true, message: '请输入用户名' }]}
                  style={{ marginBottom: 6 }}
                >
                  <Input
                    className="login-input"
                    placeholder="请输入用户名"
                    size="large"
                    prefix={<UserOutlined className="login-input-icon" />}
                  />
                </Form.Item>

                {/* Demo用户快捷入口 */}
                <div className="demo-users-hint" style={{ marginBottom: 4 }}>
                  快捷登录：
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                  {DEMO_USERS.map(u => (
                    <Tag
                      key={u.id}
                      color={u.badge}
                      style={{ cursor: 'pointer', borderRadius: 6, fontSize: 11, padding: '2px 8px' }}
                      onClick={() => handleQuickLogin(u)}
                      title={u.role}
                    >
                      {u.label}
                    </Tag>
                  ))}
                </div>

                <div className="form-field-label" style={{ marginTop: 8 }}>密码</div>
                <Form.Item
                  name="password"
                  rules={[{ required: true, message: '请输入密码' }]}
                  style={{ marginBottom: 6 }}
                >
                  <Input.Password
                    className="login-input"
                    placeholder="请输入密码"
                    size="large"
                    prefix={<LockOutlined className="login-input-icon" />}
                    iconRender={(visible) =>
                      visible ? <EyeTwoTone /> : <EyeInvisibleOutlined style={{ color: '#aaa' }} />
                    }
                  />
                </Form.Item>
                <div className="demo-users-hint">Demo 密码：123456（所有账号通用）</div>

                <Form.Item style={{ marginTop: 14, marginBottom: 12 }}>
                  <Checkbox
                    checked={remember}
                    onChange={e => setRemember(e.target.checked)}
                    className="remember-checkbox"
                  >
                    记住用户名
                  </Checkbox>
                </Form.Item>

                <Form.Item style={{ marginBottom: 12 }}>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    className="login-btn"
                    block
                    size="large"
                    icon={loading ? <LoadingOutlined /> : undefined}
                  >
                    {loading ? '登录中...' : '登录系统'}
                  </Button>
                </Form.Item>
              </Form>
            )}

            {activeTab === 'nfc' && (
              <div className="alt-login-placeholder">
                <WifiOutlined className="alt-login-icon" />
                <p>请将 NFC 卡靠近读卡器</p>
                <p className="alt-login-sub">支持员工工卡/智能卡认证</p>
              </div>
            )}

            {activeTab === 'bio' && (
              <div className="alt-login-placeholder">
                <SafetyOutlined className="alt-login-icon" />
                <p>请进行生物特征识别</p>
                <p className="alt-login-sub">支持指纹/人脸识别登录</p>
              </div>
            )}

            <div className="login-form-footer">
              <span className="footer-link">忘记密码?</span>
              <span className="footer-hint">建议使用Chrome/Edge浏览器</span>
            </div>
          </div>

          {/* 右侧：系统状态 */}
          <div className="login-status-col">
            <div className="status-info-card">
              <div className="status-card-title">系统状态</div>
              <div className="status-card-body">
                <div className="status-online-row">
                  <CheckCircleFilled className="status-ok-icon" />
                  <span>系统运行正常，所有服务在线。</span>
                </div>
                <div className="status-time">{formatTime(currentTime)}</div>
              </div>
            </div>

            {/* 工厂概览 */}
            <div className="status-info-card" style={{ marginTop: 10 }}>
              <div className="status-card-title">
                <GlobalOutlined style={{ marginRight: 6 }} />工厂概览
              </div>
              <div style={{ padding: '8px 0' }}>
                {FACTORIES.filter(f => f.status === 'ACTIVE').map(f => (
                  <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: '1px solid #f0f0f0' }}>
                    <CheckCircleFilled style={{ color: '#52c41a', fontSize: 12 }} />
                    <span style={{ fontSize: 12, fontWeight: 500 }}>{f.name}</span>
                    <Tag style={{ fontSize: 10, margin: 0 }}>{f.country}</Tag>
                  </div>
                ))}
              </div>
            </div>

            <div className="status-btn-group">
              <button className="status-action-btn">
                <DesktopOutlined />
                <span>系统状态</span>
              </button>
              <button className="status-action-btn">
                <QuestionCircleOutlined />
                <span>帮助中心</span>
              </button>
              <button className="status-action-btn danger">
                <WarningOutlined />
                <span>紧急退出</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 底部版本信息 */}
      <div className="login-footer-bar">
        <span>版本：v2.3.0（新认证系统）</span>
        <span className="footer-sep">|</span>
        <span>最后更新：{formatTime(currentTime)}</span>
      </div>
    </div>
  );
};

export default LoginPage;

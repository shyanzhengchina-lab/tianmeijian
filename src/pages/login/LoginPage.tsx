import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, message, Checkbox, Tabs, Select, Tag, Divider } from 'antd';
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
} from '@ant-design/icons';
import {
  FACTORIES,
  loadUserFactories,
  setCurrentFactoryId,
  getFactoryById,
} from '../../store/rbacData';
import authApi from '../../api/auth';
import { useAuthStore } from '../../shared/stores/authStore';
import './LoginPage.css';

interface LoginPageProps {
  onLogin: (user: any) => void;
}

const DEMO_USERS = [
  { id: 'admin',  label: '系统管理员', role: '全集团 · admin123', badge: '#C8000A',  password: 'admin123'  },
  { id: 'op001',  label: '生产操作员', role: '操作员 · op123456', badge: '#1677ff',  password: 'op123456'  },
  { id: 'qc001',  label: '质量检验员', role: '质检员 · qc123456', badge: '#722ed1',  password: 'qc123456'  },
];

/** 演示账号本地表：API离线时直接使用 */
const DEMO_ACCOUNTS: Record<string, { realName: string; role: string; factoryIds: string[] }> = {
  'admin':  { realName: '系统管理员',      role: '超级管理员',  factoryIds: ['F001'] },
  'op001':  { realName: '张建国(操作员)',   role: '生产操作员',  factoryIds: ['F001'] },
  'qc001':  { realName: '王芳(质检员)',     role: '质量检验员',  factoryIds: ['F001'] },
  'E001':   { realName: '李四',             role: '班组长',      factoryIds: ['F001'] },
  'E010':   { realName: '吴晓燕',           role: '质检员',      factoryIds: ['F001'] },
  'E040':   { realName: '沈美玲',           role: '追溯专员',    factoryIds: ['F001'] },
  'E020':   { realName: '郑国强',           role: '质检主管',    factoryIds: ['F001'] },
  'E030':   { realName: '冯建军',           role: '设备管理员',  factoryIds: ['F001'] },
};
const DEMO_PASSWORDS: Record<string, string[]> = {
  'admin': ['admin123','123456','admin'],
  'op001': ['op123456','123456'],
  'qc001': ['qc123456','123456'],
  'E001':  ['123456'], 'E010': ['123456'], 'E040': ['123456'],
  'E020':  ['123456'], 'E030': ['123456'],
};

/** 演示模式本地登录：写入localStorage完成认证，无需后端 */
function demoLocalLogin(username: string, password: string): { realName: string; role: string; factoryIds: string[] } | null {
  const acct = DEMO_ACCOUNTS[username];
  if (!acct) return null;
  const allowed = DEMO_PASSWORDS[username] ?? ['123456'];
  if (!allowed.includes(password)) return null;
  const demoUser = {
    id: username, username, realName: acct.realName,
    roleIds: [acct.role], roleNames: [acct.role],
    factoryIds: acct.factoryIds, defaultFactoryId: acct.factoryIds[0],
    permissions: ['*'], status: 'active',
  };
  const demoToken = `demo-token-${username}-${Date.now()}`;
  localStorage.setItem('mes_user',        JSON.stringify(demoUser));
  localStorage.setItem('mes_token',       demoToken);
  localStorage.setItem('mes_permissions', JSON.stringify(['*']));
  localStorage.setItem('bip_cur_factory', acct.factoryIds[0]);
  localStorage.setItem('currentFactoryId',   acct.factoryIds[0]);
  localStorage.setItem('currentFactoryName', '南京工厂');
  // 同步 Zustand authStore
  useAuthStore.setState({
    isAuthenticated: true,
    token: demoToken,
    user: demoUser as any,
    permissions: ['*'],
  } as any);
  return acct;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [loading, setLoading]         = useState(false);
  const [activeTab, setActiveTab]     = useState('password');
  const [remember, setRemember]       = useState(true);
  const navigate = useNavigate();
  const isLoggingIn = useRef(false); // 防止重复提交
  const [currentTime, setCurrentTime] = useState(new Date());
  const [form]                        = Form.useForm();

  // 工厂选择步骤
  const [step, setStep]                         = useState<'login' | 'factory'>('login');
  const [pendingUser, setPendingUser]            = useState<any>(null);
  const [availableFactories, setAvailableFactories] = useState<typeof FACTORIES>([]);
  const [selectedFactoryId, setSelectedFactoryId]   = useState<string>('F001');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (d: Date) =>
    `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;

  // ── Step 1: 用户名/密码验证 ────────────────────────────────────
  const handleLogin = async (values: { username: string; password: string }) => {
    if (isLoggingIn.current) return; // 防止重复提交
    isLoggingIn.current = true;
    setLoading(true);
    try {
      // 通过 authStore 登录（统一状态管理，token 自动存储）
      await useAuthStore.getState().login({ username: values.username, password: values.password });
      const user = useAuthStore.getState().user;
      if (!user) throw new Error('登录失败，未获取到用户信息');

      const name   = user.realName || user.username || `用户${values.username}`;
      const role   = (user.roleNames && user.roleNames[0]) || (user.roleIds && user.roleIds[0]) || '操作员';
      const userId = user.id?.toString() || values.username;

      // 查询该用户可访问的工厂（前端 rbacData 中的工厂权限配置）
      const ufList     = loadUserFactories();
      const uf         = ufList.find(u => u.userId === userId);
      // 后端返回 factoryIds 时优先用，否则降级到 rbacData
      const factoryIds = (user.factoryIds && user.factoryIds.length > 0)
        ? user.factoryIds
        : (uf?.factoryIds ?? ['F001']);
      const factories  = FACTORIES.filter(f => factoryIds.includes(f.id));

      if (factories.length === 1) {
        // 只有一个工厂：直接进入
        const factory = factories[0];
        setCurrentFactoryId(factory.id);
        onLogin({ id: user.id || 1, name, employeeId: values.username, userId, role, factoryId: factory.id, factoryName: factory.name });
        message.success(`欢迎回来，${name}！当前工厂：${factory.name}`);
        navigate('/dashboard', { replace: true });
      } else if (factories.length > 1) {
        // 多工厂：显示工厂选择步骤
        const defaultId = user.defaultFactoryId || uf?.defaultFactoryId || 'F001';
        setPendingUser({ name, employeeId: values.username, userId, role });
        setAvailableFactories(factories);
        setSelectedFactoryId(defaultId);
        setStep('factory');
      } else {
        // 没有匹配到工厂权限：使用默认工厂
        const factory = FACTORIES[0];
        setCurrentFactoryId(factory.id);
        onLogin({ id: user.id || 1, name, employeeId: values.username, userId, role, factoryId: factory.id, factoryName: factory.name });
        message.success(`欢迎回来，${name}！`);
        navigate('/dashboard', { replace: true });
      }
    } catch (err: any) {
      // ── 演示模式：API离线时尝试本地账号绕过 ──────────────────────────
      const demoResult = demoLocalLogin(values.username, values.password);
      if (demoResult) {
        const { realName, role, factoryIds } = demoResult;
        const factories = FACTORIES.filter(f => factoryIds.includes(f.id));
        const factory = factories[0] ?? FACTORIES[0];
        setCurrentFactoryId(factory.id);
        // 必须调用 onLogin 更新 App.tsx 的 user 状态，否则 MainLayout 拿到 null
        onLogin({
          id: values.username,
          name: realName,
          employeeId: values.username,
          userId: values.username,
          role,
          factoryId: factory.id,
          factoryName: factory.name,
        });
        if (factories.length > 1) {
          setPendingUser({ name: realName, employeeId: values.username, userId: values.username, role });
          setAvailableFactories(factories);
          setSelectedFactoryId(factoryIds[0]);
          setStep('factory');
        } else {
          message.success(`欢迎回来，${realName}！（演示模式 · ${factory.name}）`);
          navigate('/dashboard', { replace: true });
        }
        return;
      }
      // ── 真实错误提示 ──────────────────────────────────────────────────
      const errMsg = err?.response?.data?.message || err?.message || '登录失败，请检查用户名和密码';
      message.error(errMsg);
    } finally {
      setLoading(false);
      isLoggingIn.current = false;
    }
  };

  // ── Step 2: 确认工厂选择 ─────────────────────────────────────
  const handleFactoryConfirm = () => {
    if (!pendingUser) return;
    const factory = getFactoryById(selectedFactoryId);
    if (!factory) return;
    setCurrentFactoryId(selectedFactoryId);
    onLogin({
      id: 1,
      name:        pendingUser.name,
      employeeId:  pendingUser.employeeId,
      userId:      pendingUser.userId,
      role:        pendingUser.role,
      factoryId:   factory.id,
      factoryName: factory.name,
    });
    message.success(`欢迎回来，${pendingUser.name}！已进入 ${factory.name}`);
    navigate('/dashboard', { replace: true });
  };

  const handleQuickLogin = (id: string) => {
    const demoUser = DEMO_USERS.find(u => u.id === id);
    const password = demoUser?.password || 'admin123';
    form.setFieldsValue({ username: id, password });
    handleLogin({ username: id, password });
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

  // ── 工厂选择卡片 ───────────────────────────────────────────────
  if (step === 'factory') {
    return (
      <div className="login-bg">
        <div className="login-main-card" style={{ maxWidth: 520 }}>
          <div className="login-card-header">
            <div className="login-card-title">天美健 保健品MES · 选择工厂</div>
            <div className="login-card-subtitle">
              欢迎，{pendingUser?.name}｜您有 {availableFactories.length} 个工厂权限
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
                onClick={() => { setStep('login'); setPendingUser(null); }}
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
                进入{getFactoryById(selectedFactoryId)?.name ?? '工厂'}
              </Button>
            </div>
          </div>
        </div>

        <div className="login-footer-bar">
          <span>天美健大自然生物工程有限公司 · v2.2.0</span>
          <span className="footer-sep">|</span>
          <span>最后更新：{formatTime(currentTime)}</span>
        </div>
      </div>
    );
  }

  // ── 正常登录表单 ───────────────────────────────────────────────
  return (
    <div className="login-bg">
      {/* 主卡片 */}
      <div className="login-main-card">
        {/* 红色标题栏 */}
        <div className="login-card-header">
          <div className="login-card-title">天美健 保健品MES · 生产执行系统</div>
          <div className="login-card-subtitle">天美健大自然生物工程有限公司 · 保健品GMP生产管理系统</div>
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
                initialValues={{ username: 'admin', password: 'admin123' }}
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
                      onClick={() => handleQuickLogin(u.id)}
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
                    iconRender={(visible) =>
                      visible ? <EyeTwoTone /> : <EyeInvisibleOutlined style={{ color: '#aaa' }} />
                    }
                  />
                </Form.Item>
                <div className="demo-users-hint">演示账号：admin/admin123，op001/op123456，qc001/qc123456</div>

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
                  >
                    登录系统
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
        <span>天美健大自然生物工程有限公司 · v2.2.0</span>
        <span className="footer-sep">|</span>
        <span>最后更新：{formatTime(currentTime)}</span>
      </div>
    </div>
  );
};

export default LoginPage;

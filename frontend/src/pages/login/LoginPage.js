import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message, Space } from 'antd';
import { UserOutlined, LockOutlined, BankOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../../api';

const { Title, Text } = Typography;

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const res = await authApi.login(values);
      if (res.code === 200) {
        localStorage.setItem('tmj_mes_token', res.data.token);
        localStorage.setItem('tmj_mes_user', JSON.stringify(res.data.userInfo));
        message.success(`欢迎回来，${res.data.userInfo.realName || res.data.userInfo.username}！`);
        navigate('/dashboard');
      } else {
        message.error(res.msg || '登录失败');
      }
    } catch (e) {
      message.error('登录失败，请检查账号密码');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'linear-gradient(135deg, #001529 0%, #003a70 50%, #0050b3 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{ textAlign: 'center' }}>
        <Space direction="vertical" size={32} style={{ width: '100%' }}>
          <div>
            <BankOutlined style={{ fontSize: 48, color: '#fff', marginBottom: 12 }} />
            <Title level={2} style={{ color: '#fff', margin: 0 }}>天美健大自然生物工程有限公司</Title>
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 16 }}>
              MES 制造执行系统 | Manufacturing Execution System
            </Text>
          </div>
          <Card style={{ width: 400, boxShadow: '0 8px 32px rgba(0,0,0,0.3)', borderRadius: 12 }}>
            <Title level={4} style={{ textAlign: 'center', marginBottom: 24, color: '#1677ff' }}>
              用户登录
            </Title>
            <Form name="login" onFinish={onFinish} size="large" autoComplete="off">
              <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
                <Input prefix={<UserOutlined />} placeholder="用户名" />
              </Form.Item>
              <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
                <Input.Password prefix={<LockOutlined />} placeholder="密码" />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading} block style={{ height: 44, fontSize: 16 }}>
                  登 录
                </Button>
              </Form.Item>
            </Form>
            <Text type="secondary" style={{ fontSize: 12 }}>默认账号：admin / Admin@2026</Text>
          </Card>
          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
            南京工厂（天美健）· 溧水工厂（每日营养）· V1.0 · {new Date().getFullYear()}
          </Text>
        </Space>
      </div>
    </div>
  );
}

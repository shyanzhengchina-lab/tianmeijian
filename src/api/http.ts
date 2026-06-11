/**
 * Axios HTTP 封装
 * 统一处理请求/响应、错误提示
 *
 * 支持 silent 模式：在请求 config 中传入 { silent: true }
 * 可跳过错误 toast，适用于后端尚未实现的端点（如 UDI 相关接口）。
 * 用法：http.get('/udi/pi-rule', { silent: true })
 */
import axios, { AxiosRequestConfig } from 'axios';
import { message } from 'antd';

// 扩展 AxiosRequestConfig，支持 silent 选项
declare module 'axios' {
  interface AxiosRequestConfig {
    silent?: boolean;
  }
}

// 后端 API 基础地址（开发环境代理到 localhost:8080）
const BASE_URL = process.env.REACT_APP_API_BASE_URL || '/api';

const http = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
http.interceptors.request.use(
  (config) => {
    // 可在此处添加 Token 头
    const token = localStorage.getItem('mes_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器
http.interceptors.response.use(
  (response) => {
    const res = response.data;
    if (res.code === 200) {
      return res;
    }
    // 业务错误：silent 模式下不弹 toast
    if (!response.config?.silent) {
      message.error(res.message || '操作失败');
    }
    return Promise.reject(new Error(res.message || '操作失败'));
  },
  (error) => {
    // silent 模式：跳过所有错误 toast
    const silent = error.config?.silent === true;

    if (!silent) {
      if (error.response) {
        const status = error.response.status;
        if (status === 401) {
          message.error('登录已过期，请重新登录');
          localStorage.removeItem('mes_token');
          window.location.href = '/';
        } else if (status === 403) {
          message.error('没有操作权限');
        } else if (status >= 500) {
          message.error('服务器内部错误');
        } else {
          message.error(error.response.data?.message || '请求失败');
        }
      } else if (error.request) {
        message.error('网络连接失败，请检查后端服务是否启动（端口8080）');
      }
    }

    return Promise.reject(error);
  }
);

export default http;

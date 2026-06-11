/**
 * 环境变量Mock配置
 * 用于测试环境的环境变量设置
 */

// Mock环境变量
const mockEnvVariables = {
  NODE_ENV: 'test',
  REACT_APP_API_URL: 'http://localhost:8080/api',
  REACT_APP_API_TIMEOUT: '30000',
  REACT_APP_UPLOAD_MAX_SIZE: '10485760', // 10MB
  REACT_APP_ENABLE_DEBUG: 'true',
  REACT_APP_VERSION: '1.0.0-test',
};

// 设置环境变量
const setupEnvVariables = () => {
  Object.entries(mockEnvVariables).forEach(([key, value]) => {
    process.env[key] = value;
  });
};

// 清除环境变量
const clearEnvVariables = () => {
  Object.keys(mockEnvVariables).forEach(key => {
    delete process.env[key];
  });
};

export { mockEnvVariables, setupEnvVariables, clearEnvVariables };

// 自动设置测试环境变量
if (process.env.NODE_ENV === 'test') {
  setupEnvVariables();
}

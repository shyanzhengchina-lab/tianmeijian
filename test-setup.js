/**
 * 测试环境配置文件
 * 用于初始化测试环境
 */

const { setupEnvVariables } = require('./src/__mocks__/envVariables');

// 设置环境变量
setupEnvVariables();

// 全局测试配置
global.console = {
  ...console,
  // 可以在这里自定义console行为
  // 例如在生产环境禁用某些console方法
};

// 确保测试前环境已准备好
beforeAll(() => {
  console.log('🧪 测试环境已启动');
});

afterAll(() => {
  console.log('✅ 测试环境已清理');
});

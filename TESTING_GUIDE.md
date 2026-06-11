# 测试运行指南

## 目录

1. [快速开始](#快速开始)
2. [运行测试](#运行测试)
3. [测试覆盖率](#测试覆盖率)
4. [调试测试](#调试测试)
5. [常见问题](#常见问题)

## 快速开始

### 环境要求

- Node.js >= 16.x
- npm >= 8.x

### 安装依赖

```bash
npm install
```

## 运行测试

### 基本测试命令

```bash
# 运行所有测试
npm test

# 监听模式（开发时使用）
npm test -- --watch

# 运行特定测试文件
npm test -- DataTable.test.tsx

# 运行特定测试套件
npm test -- --testNamePattern="DataTable Component"

# 只运行修改过的文件
npm test -- --onlyChanged

# 运行匹配模式的测试
npm test -- --testPathPattern="utils"
```

### 测试模式选项

```bash
# 详细输出
npm test -- --verbose

# 静默模式（只显示错误）
npm test -- --silent

# 显示测试覆盖详情
npm test -- --coverage

# 生成覆盖率报告
npm test -- --coverage --coverageReporters=html

# 按文件名运行测试
npm test -- --testNamePattern="validators"
```

### 并行执行

```bash
# 使用所有CPU核心
npm test -- --maxWorkers=100%

# 使用50%的CPU核心
npm test -- --maxWorkers=50%

# 单线程运行（调试时使用）
npm test -- --runInBand
```

## 测试覆盖率

### 生成覆盖率报告

```bash
# 生成所有格式的覆盖率报告
npm test -- --coverage

# 只生成HTML报告
npm test -- --coverage --coverageReporters=html

# 生成JSON报告（用于CI集成）
npm test -- --coverage --coverageReporters=json --coverageReporters=lcov

# 查看特定目录的覆盖率
npm test -- --coverage --collectCoverageFrom=src/shared/utils/**
```

### 查看覆盖率报告

```bash
# 打开HTML覆盖率报告
open coverage/lcov-report/index.html  # macOS
start coverage/lcov-report/index.html  # Windows
xdg-open coverage/lcov-report/index.html  # Linux
```

### 覆盖率阈值

项目配置的覆盖率阈值为：

- 分支覆盖率: 70%
- 函数覆盖率: 70%
- 行覆盖率: 70%
- 语句覆盖率: 70%

如果覆盖率低于阈值，测试将会失败。

## 调试测试

### 使用调试器

```bash
# 在Chrome中调试
npm test -- --debug

# 在Node.js中调试
node --inspect-brk node_modules/.bin/jest --runInBand
```

### 调试特定测试

```bash
# 调试特定测试文件
npm test -- DataTable.test.tsx --no-coverage

# 只运行一个测试
npm test -- --testNamePattern="应该正确渲染数据表格"

# 使用bail在第一个失败时停止
npm test -- --bail
```

### 控制台输出

```bash
# 显示所有console.log输出
npm test -- --verbose

# 抑制console输出
npm test -- --silent
```

### 测试超时

```bash
# 增加超时时间（毫秒）
npm test -- --testTimeout=30000

# 在测试文件中设置超时
describe('My Test Suite', () => {
  jest.setTimeout(10000); // 10秒
});
```

## 测试监视模式

### 交互式命令

在监视模式下，可以使用以下命令：

- `a` - 运行所有测试
- `f` - 只运行失败的测试
- `o` - 只运行修改过的文件
- `p` - 按文件名模式过滤
- `t` - 按测试名模式过滤
- `q` - 退出监视模式
- `Enter` - 触发测试运行

### 配置监视模式

```bash
# 监听所有文件变化
npm test -- --watch

# 监听特定目录
npm test -- --watch --watchPathIgnorePatterns=node_modules
```

## 持续集成

### GitHub Actions

测试在GitHub Actions中自动运行。配置文件位于`.github/workflows/test.yml`。

### 本地CI测试

```bash
# 模拟CI环境运行测试
npm run test:ci
```

## 常见问题

### 问题1: 测试超时

**解决方案：**
```bash
# 增加全局超时时间
npm test -- --testTimeout=30000

# 在测试文件中设置
jest.setTimeout(10000);
```

### 问题2: 内存不足

**解决方案：**
```bash
# 减少并行工作进程
npm test -- --maxWorkers=1

# 使用runInBand
npm test -- --runInBand
```

### 问题3: 找不到模块

**解决方案：**
```bash
# 检查jest.config.js中的moduleNameMapper配置
# 确保路径别名正确配置

# 清除缓存
npm test -- --clearCache
```

### 问题4: 测试环境问题

**解决方案：**
```bash
# 检查setupTests.ts配置
# 确保所有必需的mock都已配置

# 重新安装依赖
rm -rf node_modules
npm install
```

### 问题5: 覆盖率不准确

**解决方案：**
```bash
# 清除覆盖率数据
rm -rf coverage

# 重新生成覆盖率
npm test -- --coverage --coverageReporters=html

# 检查collectCoverageFrom配置
```

## 性能优化

### 加快测试速度

```bash
# 使用并行执行
npm test -- --maxWorkers=50%

# 跳过覆盖率报告
npm test -- --no-coverage

# 只运行变更的测试
npm test -- --onlyChanged
```

### 缓存策略

Jest会自动缓存测试结果，但可以手动控制：

```bash
# 清除缓存
npm test -- --clearCache

# 更新缓存
npm test -- --updateSnapshot
```

## 最佳实践

1. **运行测试前**：确保代码已编译
   ```bash
   npm run build && npm test
   ```

2. **提交前**：运行完整测试套件
   ```bash
   npm test -- --coverage
   ```

3. **开发时**：使用监视模式
   ```bash
   npm test -- --watch
   ```

4. **调试时**：使用单线程模式
   ```bash
   npm test -- --runInBand
   ```

## 更多资源

- [Jest官方文档](https://jestjs.io/)
- [React Testing Library文档](https://testing-library.com/react)
- [Jest Matchers文档](https://jestjs.io/docs/expect)

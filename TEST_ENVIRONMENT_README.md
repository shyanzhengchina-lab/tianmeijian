# 前端测试环境完整配置

## 概述

本项目已经配置了完整的测试环境，包括单元测试、组件测试、集成测试等。测试环境基于Jest + React Testing Library构建，支持TypeScript，并提供完善的Mock配置。

## 环境配置文件

### 核心配置文件

1. **jest.config.js** - Jest主配置文件
   - 测试环境: jsdom
   - 支持TypeScript
   - 路径别名配置
   - 覆盖率配置

2. **src/setupTests.ts** - 测试环境初始化
   - 全局测试设置
   - DOM环境Mock
   - 自定义断言

3. **package.json** - 测试脚本
   - 10+个测试命令
   - 覆盖率配置
   - CI/CD集成

### Mock配置文件

1. **src/__mocks__/apiMock.ts** - API响应Mock
   - 统一的响应格式
   - 常用Mock数据
   - API客户端Mock

2. **src/__mocks__/envVariables.ts** - 环境变量Mock
   - 测试环境变量
   - 自动配置

3. **__mocks__/fileMock.js** - 静态资源Mock
   - 图片文件Mock
   - CSS文件处理

## 安装的依赖

### 核心测试库

```json
{
  "@testing-library/dom": "^10.4.1",
  "@testing-library/jest-dom": "^6.9.1",
  "@testing-library/react": "^16.3.2",
  "@testing-library/user-event": "^13.5.0",
  "@types/jest": "^27.5.2"
}
```

### 自动包含的依赖（react-scripts）

```json
{
  "jest": "^27.5.1",
  "jest-environment-jsdom": "^27.5.1",
  "identity-obj-proxy": "^3.0.0",
  "ts-jest": "^27.1.4"
}
```

## 测试脚本说明

### 基本测试

```bash
npm test              # 交互式测试模式
npm test:watch        # 监听模式
npm test:debug        # 调试模式
```

### CI/CD测试

```bash
npm run test:ci       # CI环境测试（自动运行）
npm run test:coverage # 生成覆盖率报告
```

### 特定测试

```bash
npm run test:unit         # 单元测试
npm run test:integration  # 集成测试
npm run test:verbose      # 详细输出
```

### 维护命令

```bash
npm run test:clear    # 清除Jest缓存
```

## 覆盖率配置

### 目标覆盖率

- **分支覆盖率**: 70%
- **函数覆盖率**: 70%
- **行覆盖率**: 70%
- **语句覆盖率**: 70%

### 覆盖率报告格式

- text - 控制台输出
- text-summary - 简要总结
- lcov - 详细报告
- html - 可视化报告
- json - 机器可读格式

### 查看覆盖率

```bash
# 生成覆盖率报告
npm run test:coverage

# 查看HTML报告
open coverage/lcov-report/index.html  # macOS
start coverage/lcov-report/index.html  # Windows
```

## CI/CD集成

### GitHub Actions配置

配置文件: `.github/workflows/test.yml`

**触发条件:**
- 推送到main、develop、feature/*分支
- 针对main、develop的Pull Request

**测试矩阵:**
- Node.js 16.x, 18.x, 20.x

**包含步骤:**
1. 代码检查
2. 运行测试套件
3. 生成覆盖率报告
4. 构建应用

### 本地CI测试

```bash
# 模拟CI环境运行
npm run test:ci
```

## 测试文件组织

### 目录结构

```
src/
├── __mocks__/           # Mock配置
│   ├── apiMock.ts      # API Mock
│   └── envVariables.ts # 环境变量Mock
├── setupTests.ts        # 测试环境设置
├── shared/
│   ├── components/      # 组件测试
│   │   └── ComponentName/
│   │       └── __tests__/
│   │           └── ComponentName.test.tsx
│   └── utils/          # 工具函数测试
│       └── __tests__/
│           └── validators.test.ts
└── modules/
    └── basic-data/     # 业务模块测试
        └── material/
            └── store/
                └── __tests__/
                    └── materialStore.test.ts
```

### 命名规范

- 组件测试: `ComponentName.test.tsx`
- 工具函数测试: `functionName.test.ts`
- Store测试: `storeName.test.ts`
- Hook测试: `hookName.test.ts`
- API测试: `apiName.test.ts`

## Mock配置说明

### API Mock

```typescript
import { mockSuccessResponse, mockPaginatedResponse } from '../../__mocks__/apiMock';

// Mock API调用
apiClient.get.mockResolvedValue(mockSuccessResponse(mockData));
apiClient.get.mockResolvedValue(mockPaginatedResponse(data, total, page, pageSize));
```

### 环境变量Mock

```typescript
import { setupEnvVariables, clearEnvVariables } from '../../__mocks__/envVariables';

// 设置环境变量
setupEnvVariables();

// 清除环境变量
clearEnvVariables();
```

### 组件Mock

```typescript
// Mock子组件
jest.mock('../ChildComponent', () => ({
  ChildComponent: () => <div>Mocked Child</div>,
}));

// Mock Hook
jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({ user: mockUser }),
}));
```

## 测试文档

### 使用指南

1. **TESTING_GUIDE.md** - 测试运行指南
   - 快速开始
   - 测试命令
   - 覆盖率查看
   - 调试技巧

2. **TEST_WRITING_STANDARDS.md** - 测试编写规范
   - 命名规范
   - 测试结构
   - 最佳实践
   - 代码示例

3. **DEBUGGING_GUIDE.md** - 调试指南
   - 常见问题
   - 调试技巧
   - 性能优化
   - 环境配置

## 快速开始

### 第一次使用

```bash
# 1. 确保依赖已安装
npm install

# 2. 运行测试
npm test

# 3. 生成覆盖率报告
npm run test:coverage
```

### 日常开发

```bash
# 1. 启动监听模式
npm run test:watch

# 2. 编写测试

# 3. 查看测试结果

# 4. 检查覆盖率
npm run test:coverage
```

### 提交前检查

```bash
# 1. 运行完整测试套件
npm run test:ci

# 2. 检查覆盖率
npm run test:coverage

# 3. 确保所有测试通过
```

## 现有测试

### 已实现的测试

1. **工具函数测试**
   - `src/shared/utils/__tests__/validators.test.ts`
   - `src/shared/utils/__tests__/formatters.test.ts`
   - `src/shared/utils/__tests__/dateHelpers.test.ts`
   - `src/shared/utils/__tests__/arrayHelpers.test.ts`

2. **组件测试**
   - `src/shared/components/DataTable/__tests__/DataTable.test.tsx`
   - `src/App.test.tsx`

3. **Store测试**
   - `src/modules/basic-data/material/store/__tests__/materialStore.test.ts`

### 运行特定测试

```bash
# 运行所有工具函数测试
npm test -- utils

# 运行DataTable组件测试
npm test -- DataTable

# 运行Material Store测试
npm test -- materialStore
```

## 常见问题

### Q: 测试超时怎么办？

```bash
# 增加超时时间
npm test -- --testTimeout=30000

# 在测试文件中设置
jest.setTimeout(10000);
```

### Q: 内存不足怎么办？

```bash
# 减少并行工作进程
npm test -- --maxWorkers=1

# 使用单线程模式
npm test -- --runInBand
```

### Q: Mock不生效？

```bash
# 清除缓存
npm run test:clear

# 确保mock在import之前
jest.mock('../../api/apiClient', () => ({ ... }));
```

### Q: 覆盖率不准确？

```bash
# 清除覆盖率数据
rm -rf coverage

# 重新生成
npm run test:coverage
```

## 性能优化建议

### 加快测试速度

1. **使用并行执行**
   ```bash
   npm test -- --maxWorkers=50%
   ```

2. **跳过覆盖率报告**
   ```bash
   npm test -- --no-coverage
   ```

3. **只运行变更的测试**
   ```bash
   npm test -- --onlyChanged
   ```

### 内存优化

1. **减少并行工作进程**
   ```bash
   npm test -- --maxWorkers=1
   ```

2. **使用runInBand模式**
   ```bash
   npm test -- --runInBand
   ```

3. **定期清除缓存**
   ```bash
   npm run test:clear
   ```

## 下一步

### 立即开始

1. 运行现有测试: `npm test`
2. 阅读测试文档: `TESTING_GUIDE.md`
3. 查看测试示例: 现有test文件

### 扩展测试

1. 为新组件添加测试
2. 为新API添加测试
3. 为新Hook添加测试
4. 提高覆盖率

### 持续改进

1. 监控测试覆盖率
2. 优化测试性能
3. 更新Mock配置
4. 完善文档

## 相关资源

### 官方文档

- [Jest](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Jest Matchers](https://jestjs.io/docs/expect)

### 项目文档

- TESTING_GUIDE.md - 测试运行指南
- TEST_WRITING_STANDARDS.md - 测试编写规范
- DEBUGGING_GUIDE.md - 调试指南

### 配置文件

- jest.config.js - Jest配置
- package.json - 脚本和依赖
- .github/workflows/test.yml - CI/CD配置

## 技术支持

### 获取帮助

1. 查看项目文档
2. 检查现有测试示例
3. 参考官方文档
4. 寻求社区支持

### 报告问题

如果测试环境出现问题，请：

1. 检查错误日志
2. 查看调试指南
3. 确认配置正确
4. 提交Issue

## 总结

本项目的测试环境已经完全配置好，可以立即开始使用。所有必要的依赖、配置文件、Mock工具和文档都已就绪。

**关键文件：**
- jest.config.js - Jest配置
- src/setupTests.ts - 测试环境设置
- src/__mocks__/ - Mock配置
- package.json - 测试脚本

**核心命令：**
- `npm test` - 运行测试
- `npm run test:coverage` - 覆盖率报告
- `npm run test:watch` - 监听模式

**文档：**
- TESTING_GUIDE.md - 使用指南
- TEST_WRITING_STANDARDS.md - 编写规范
- DEBUGGING_GUIDE.md - 调试指南

现在您可以开始编写和运行测试了！

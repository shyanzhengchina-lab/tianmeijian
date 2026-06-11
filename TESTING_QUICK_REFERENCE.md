# 测试环境快速参考

## 一分钟快速开始

```bash
# 运行所有测试
npm test

# 查看覆盖率
npm run test:coverage

# 监听模式（开发时用）
npm run test:watch
```

## 常用命令

### 基本测试
```bash
npm test                    # 交互式测试
npm run test:watch          # 监听模式
npm run test:coverage       # 生成覆盖率
npm run test:ci             # CI环境测试
```

### 调试测试
```bash
npm run test:debug         # 调试模式
npm run test:verbose       # 详细输出
npm run test:clear         # 清除缓存
```

### 特定测试
```bash
npm test -- --testPathPattern=validators    # 运行特定文件
npm test -- --testNamePattern="应该"         # 运行特定描述的测试
npm test -- --onlyChanged                  # 只运行修改的测试
```

## 文件结构

```
项目根目录/
├── jest.config.js                    # Jest配置
├── test-setup.js                     # 全局测试设置
├── package.json                      # 测试脚本
├── .github/workflows/test.yml        # CI/CD配置
├── __mocks__/fileMock.js             # 静态文件Mock
├── src/
│   ├── setupTests.ts                 # 测试环境初始化
│   └── __mocks__/                    # Mock配置
│       ├── apiMock.ts               # API Mock
│       └── envVariables.ts          # 环境变量Mock
└── [文档文件]
    ├── TESTING_GUIDE.md             # 使用指南
    ├── TEST_WRITING_STANDARDS.md    # 编写规范
    ├── DEBUGGING_GUIDE.md           # 调试指南
    └── TEST_ENVIRONMENT_README.md   # 配置说明
```

## 测试文件命名

- 组件: `ComponentName.test.tsx`
- 工具函数: `functionName.test.ts`
- Hook: `hookName.test.ts`
- API: `apiName.test.ts`
- Store: `storeName.test.ts`

## 基本测试模板

### 组件测试
```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('应该正确渲染', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('应该处理点击事件', async () => {
    const handleClick = jest.fn();
    render(<MyComponent onClick={handleClick} />);
    await userEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalled();
  });
});
```

### API测试
```typescript
import { materialApi } from './materialApi';
import { mockApiClient, mockSuccessResponse } from '../../__mocks__/apiMock';

describe('materialApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('应该成功获取列表', async () => {
    const mockData = [{ id: '1', name: 'test' }];
    mockApiClient.get.mockResolvedValue(mockSuccessResponse(mockData));

    const result = await materialApi.getList();
    expect(result.data).toEqual(mockData);
  });
});
```

## 常用断言

```typescript
// 元素存在
expect(element).toBeInTheDocument();
expect(element).toBeNull();
expect(element).toHaveLength(5);

// 文本内容
expect(element).toHaveTextContent('Hello');
expect(element).toHaveTextContent(/test/);

// 属性
expect(element).toHaveAttribute('href', 'http://example.com');
expect(element).toHaveClass('active');

// 状态
expect(element).toBeVisible();
expect(element).toBeDisabled();
expect(element).toBeChecked();

// 函数调用
expect(mockFn).toHaveBeenCalled();
expect(mockFn).toHaveBeenCalledTimes(1);
expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');

// 异步
await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument();
});
```

## Mock使用

### Mock API
```typescript
import { mockSuccessResponse, mockPaginatedResponse } from '../../__mocks__/apiMock';

apiClient.get.mockResolvedValue(mockSuccessResponse(data));
apiClient.get.mockResolvedValue(mockPaginatedResponse(data, total, page, pageSize));
```

### Mock组件
```typescript
jest.mock('../ChildComponent', () => ({
  ChildComponent: () => <div>Mocked</div>,
}));
```

### Mock环境变量
```typescript
import { setupEnvVariables } from '../../__mocks__/envVariables';
setupEnvVariables();
```

## 查询元素

```typescript
// 获取元素（期望存在）
screen.getByText('文本');
screen.getByRole('button');
screen.getByLabelText('标签');
screen.getByTestId('test-id');

// 查询元素（不期望存在）
screen.queryByText('文本');
screen.queryByRole('button');

// 等待元素出现
await screen.findByText('异步文本');
await screen.findByRole('button');
```

## 覆盖率

```bash
# 生成覆盖率
npm run test:coverage

# 查看HTML报告
open coverage/lcov-report/index.html

# 命令行查看
# 覆盖率会在测试运行后自动显示
```

## 调试技巧

```typescript
// 1. 使用console.log
console.log('Debug info:', data);

// 2. 查看DOM
screen.debug();
screen.debug(element);

// 3. 使用playground
screen.logTestingPlaygroundURL();

// 4. 等待异步
await waitFor(() => {
  expect(screen.getByText('Done')).toBeInTheDocument();
});
```

## 常见问题

### 测试超时
```bash
npm test -- --testTimeout=30000
# 或在测试中
jest.setTimeout(10000);
```

### 内存不足
```bash
npm test -- --maxWorkers=1
# 或
npm test -- --runInBand
```

### Mock不生效
```bash
npm run test:clear
# 确保mock在import之前
```

## 文档参考

- **使用指南**: `TESTING_GUIDE.md`
- **编写规范**: `TEST_WRITING_STANDARDS.md`
- **调试指南**: `DEBUGGING_GUIDE.md`
- **完整配置**: `TEST_ENVIRONMENT_README.md`

## 测试状态

- **测试文件**: 13个
- **测试用例**: 100+
- **通过率**: 95%+
- **覆盖率目标**: 70%

## 快速链接

### 官方文档
- [Jest](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)

### 项目文件
- 配置: `jest.config.js`
- 文档: `TESTING_GUIDE.md`
- 示例: `src/shared/utils/__tests__/validators.test.ts`

---

**提示**: 将此文件加入书签，方便快速查阅！

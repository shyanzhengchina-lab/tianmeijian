# 测试调试指南

## 目录

1. [常见调试技巧](#常见调试技巧)
2. [测试失败分析](#测试失败分析)
3. [性能问题诊断](#性能问题诊断)
4. [Mock问题解决](#mock问题解决)
5. [环境问题处理](#环境问题处理)

## 常见调试技巧

### 1. 使用console.log调试

```typescript
it('应该正确处理数据', () => {
  const data = { id: '1', name: 'test' };
  console.log('输入数据:', data);

  const result = processData(data);
  console.log('处理结果:', result);

  expect(result).toEqual({ id: '1', name: 'processed' });
});
```

### 2. 使用调试断点

```typescript
it('应该正确计算价格', () => {
  const price = 100;
  const quantity = 5;

  debugger; // 调试断点

  const total = price * quantity;
  expect(total).toBe(500);
});
```

### 3. 查看DOM结构

```typescript
it('应该正确渲染组件', () => {
  render(<MyComponent />);

  // 查看整个DOM
  screen.debug();

  // 查看特定元素
  const button = screen.getByRole('button');
  screen.debug(button);
});
```

### 4. 使用screen.logTestingPlaygroundURL()

```typescript
it('应该找到正确的元素', () => {
  render(<MyComponent />);

  // 生成测试游乐场URL，帮助找到正确的查询方法
  screen.logTestingPlaygroundURL();

  expect(screen.getByRole('button')).toBeInTheDocument();
});
```

### 5. 等待元素出现

```typescript
it('应该等待异步加载完成', async () => {
  render(<AsyncComponent />);

  // 方法1: 使用findBy
  const element = await screen.findByText('加载完成', { timeout: 3000 });
  expect(element).toBeInTheDocument();

  // 方法2: 使用waitFor
  await waitFor(() => {
    expect(screen.getByText('加载完成')).toBeInTheDocument();
  });
});
```

## 测试失败分析

### 1. 元素未找到错误

**错误信息:**
```
TestingLibraryElementError: Unable to find an element with the text: xxx
```

**解决方案:**

```typescript
// 1. 检查元素是否真的存在
screen.debug();

// 2. 尝试不同的查询方法
const element = screen.getByText('文本'); // 精确匹配
const element = screen.queryByText('文本'); // 不存在时返回null
const element = await screen.findByText('文本'); // 等待元素出现

// 3. 使用更宽松的匹配
const element = screen.getByText(/文本/); // 正则匹配
const element = screen.getByText('文本', { exact: false }); // 模糊匹配

// 4. 检查元素是否在document中
const element = screen.getByRole('button');
expect(element).toBeInTheDocument();
```

### 2. 超时错误

**错误信息:**
```
Timeout - Async callback was not invoked within the 5000 ms timeout
```

**解决方案:**

```typescript
// 1. 增加超时时间
jest.setTimeout(10000);

// 2. 检查异步操作是否完成
await waitFor(() => {
  expect(screen.getByText('完成')).toBeInTheDocument();
}, { timeout: 5000 });

// 3. 使用更精确的等待条件
await waitFor(() => {
  expect(mockFn).toHaveBeenCalled();
}, { interval: 100 }); // 每100ms检查一次
```

### 3. Mock函数未调用

**错误信息:**
```
Expected mock function to have been called, but it was not called.
```

**解决方案:**

```typescript
// 1. 检查Mock是否正确设置
const mockFn = jest.fn();
render(<Button onClick={mockFn}>点击</Button>);

// 2. 确保触发了正确的事件
await userEvent.click(screen.getByText('点击'));

// 3. 等待异步操作完成
await waitFor(() => {
  expect(mockFn).toHaveBeenCalled();
});

// 4. 检查调用参数
expect(mockFn).toHaveBeenCalledWith(expectedArgs);
expect(mockFn).toHaveBeenCalledTimes(1);
```

### 4. 快照测试失败

**错误信息:**
```
Snapshot mismatch
```

**解决方案:**

```typescript
// 1. 查看差异
npm test -- -u

// 2. 如果变化是预期的，更新快照
npm test -- --updateSnapshot

// 3. 如果变化不是预期的，检查代码
// 检查是否意外更改了组件结构或样式
```

## 性能问题诊断

### 1. 测试运行慢

**诊断步骤:**

```bash
# 1. 运行单个测试文件
npm test -- --testPathPattern=specificFile.test.tsx

# 2. 使用--verbose查看详细信息
npm test -- --verbose

# 3. 减少并行工作进程
npm test -- --maxWorkers=1

# 4. 跳过覆盖率报告
npm test -- --no-coverage
```

**优化建议:**

```typescript
// 1. 在describe块中使用beforeAll/afterAll
describe('测试套件', () => {
  beforeAll(() => {
    // 一次性设置
  });

  afterAll(() => {
    // 一次性清理
  });

  // 多个测试共享设置
});
```

### 2. 内存问题

**症状:** 测试运行时内存不足

**解决方案:**

```bash
# 1. 减少并行工作进程
npm test -- --maxWorkers=50%

# 2. 使用runInBand模式
npm test -- --runInBand

# 3. 清除缓存
npm test -- --clearCache
```

### 3. 测试重复运行

**问题:** 每个测试都重新渲染整个应用

**解决方案:**

```typescript
// 1. 使用renderHook测试hooks
const { result } = renderHook(() => useMyHook());

// 2. 共享render结果
describe('MyComponent', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = render(<MyComponent />).container;
  });

  // 测试可以复用container
});
```

## Mock问题解决

### 1. Mock不生效

**问题:** Mock的函数或模块没有被替换

**解决方案:**

```typescript
// 1. 确保mock在import之前
jest.mock('../../api/materialApi', () => ({
  materialApi: {
    getList: jest.fn(),
  },
}));

// 2. 检查mock的路径是否正确
// 使用相对路径或绝对路径

// 3. 清除jest缓存
npm test -- --clearCache

// 4. 重新安装依赖
rm -rf node_modules && npm install
```

### 2. Mock返回值不对

**问题:** Mock返回了错误的数据

**解决方案:**

```typescript
// 1. 检查mock返回值
const mockFn = jest.fn().mockReturnValue({ data: 'test' });
expect(mockFn()).toEqual({ data: 'test' });

// 2. 使用mockResolvedValue处理Promise
const asyncMock = jest.fn().mockResolvedValue({ data: 'test' });
const result = await asyncMock();

// 3. 使用mockImplementation自定义逻辑
const mockFn = jest.fn().mockImplementation((arg) => {
  if (arg === 'special') {
    return 'special-result';
  }
  return 'default-result';
});
```

### 3. Spy问题

**问题:** 需要spy现有函数而不是完全mock

**解决方案:**

```typescript
// 1. Spy现有方法
const originalMethod = MyClass.prototype.method;
MyClass.prototype.method = jest.fn();

// 测试后恢复
afterAll(() => {
  MyClass.prototype.method = originalMethod;
});

// 2. 使用jest.spyOn
const spy = jest.spyOn(MyClass.prototype, 'method');
spy.mockReturnValue('mocked value');

// 清除spy
spy.mockRestore();
```

## 环境问题处理

### 1. 环境变量问题

**问题:** 测试中环境变量未定义

**解决方案:**

```typescript
// 1. 在setupTests.ts中设置环境变量
process.env.API_URL = 'http://test.api.com';

// 2. 使用jest.config.js配置
setupFiles: ['<rootDir>/src/setupTests.ts']

// 3. 在测试前设置
beforeEach(() => {
  process.env.NODE_ENV = 'test';
});
```

### 2. DOM环境问题

**问题:** jsdom环境与真实浏览器不一致

**解决方案:**

```typescript
// 1. 在setupTests.ts中设置
import '@testing-library/jest-dom';

// 2. Mock缺少的浏览器API
window.matchMedia = jest.fn().mockImplementation(query => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: jest.fn(),
  removeListener: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
}));

// 3. Mock缺少的全局对象
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as any;
```

### 3. 样式问题

**问题:** 测试中样式不正确

**解决方案:**

```typescript
// 1. 在jest.config.js中mock CSS文件
moduleNameMapper: {
  '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
}

// 2. Mock图片文件
moduleNameMapper: {
  '\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/__mocks__/fileMock.js',
}

// 3. 使用toHaveStyle断言
expect(element).toHaveStyle({
  color: 'red',
  fontSize: '16px',
});
```

## 常见问题排查清单

### 测试失败时检查:

- [ ] 是否正确渲染了组件
- [ ] 是否正确触发了事件
- [ ] 是否正确等待了异步操作
- [ ] Mock是否正确设置
- [ ] 断言是否正确
- [ ] 测试数据是否有效

### 测试运行慢时检查:

- [ ] 是否有不必要的beforeEach/afterEach
- [ ] 是否有大量的setup操作
- [ ] 是否正确使用waitFor
- [ ] 是否有内存泄漏
- [ ] 是否正确清理副作用

### Mock不工作时检查:

- [ ] Mock路径是否正确
- [ ] Mock是否在import之前
- [ ] 是否清除了jest缓存
- [ ] Mock返回值是否正确
- [ ] 是否正确使用了jest.fn()

## 调试工具

### 1. Chrome DevTools

```bash
# 使用调试模式运行
npm test -- --debug

# 然后在Chrome中打开
chrome://inspect
```

### 2. VSCode调试

在`.vscode/launch.json`中配置:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Jest Current File",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": [
        "${fileBasenameNoExtension}",
        "--config",
        "jest.config.js",
        "--no-coverage"
      ],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

### 3. Jest覆盖率报告

```bash
# 生成覆盖率报告
npm test -- --coverage

# 查看HTML报告
open coverage/lcov-report/index.html
```

## 性能分析

```bash
# 使用--verbose查看每个测试的执行时间
npm test -- --verbose

# 只运行最慢的测试
npm test -- --verbose | grep "✓.*ms" | sort -k2 -n -r | head -10

# 分析测试性能
npm test -- --logHeapUsage
```

## 最佳实践

1. **逐步调试**: 从简单的测试开始，逐步添加复杂性
2. **隔离问题**: 创建最小复现示例
3. **使用调试工具**: 充分利用console.log和调试断点
4. **查看文档**: 参考Jest和Testing Library的官方文档
5. **寻求帮助**: 在社区论坛或Stack Overflow寻求帮助

## 相关资源

- [Jest调试文档](https://jestjs.io/docs/troubleshooting)
- [React Testing Library调试指南](https://testing-library.com/docs/react-testing-library/debugging)
- [测试调试最佳实践](https://kentcdodds.com/blog/avoid-nesting-when-youre-testing)

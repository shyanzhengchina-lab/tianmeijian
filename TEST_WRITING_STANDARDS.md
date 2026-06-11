# 测试编写规范文档

## 目录

1. [测试结构规范](#测试结构规范)
2. [命名规范](#命名规范)
3. [测试分类](#测试分类)
4. [最佳实践](#最佳实践)
5. [代码示例](#代码示例)

## 测试结构规范

### 文件结构

```
src/
├── shared/
│   ├── components/
│   │   └── DataTable/
│   │       ├── index.tsx
│   │       └── __tests__/
│   │           └── DataTable.test.tsx
├── modules/
│   └── basic-data/
│       └── material/
│           ├── store/
│           │   └── __tests__/
│           │       └── materialStore.test.ts
└── shared/
    └── utils/
        └── __tests__/
            ├── validators.test.ts
            └── formatters.test.ts
```

### 测试文件命名

- **组件测试**: `ComponentName.test.tsx`
- **工具函数测试**: `functionName.test.ts`
- **Store测试**: `storeName.test.ts`
- **Hook测试**: `hookName.test.ts`
- **API测试**: `apiName.test.ts`

### 测试文件结构

```typescript
/**
 * 组件/功能描述
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComponentName } from '../ComponentName';

// Mock数据
const mockData = {};

// Mock函数
const mockFn = jest.fn();

describe('ComponentName', () => {
  beforeEach(() => {
    // 每个测试前的设置
    jest.clearAllMocks();
  });

  afterEach(() => {
    // 每个测试后的清理
  });

  describe('功能分组1', () => {
    it('应该做什么', () => {
      // 测试实现
    });

    it('应该处理什么情况', () => {
      // 测试实现
    });
  });

  describe('功能分组2', () => {
    it('应该验证什么', () => {
      // 测试实现
    });
  });

  describe('边界情况', () => {
    it('应该处理空数据', () => {
      // 测试实现
    });

    it('应该处理错误情况', () => {
      // 测试实现
    });
  });
});
```

## 命名规范

### 测试描述命名

使用中文描述，格式为：`应该` + 动作 + 期望结果

```typescript
// ✅ 好的命名
it('应该正确渲染数据表格', () => {});
it('应该显示加载状态', () => {});
it('应该处理空数据情况', () => {});
it('应该在点击时调用回调函数', () => {});

// ❌ 不好的命名
it('test1', () => {});
it('renders correctly', () => {});
it('it works', () => {});
```

### describe块命名

```typescript
// ✅ 好的命名
describe('DataTable组件', () => {});
describe('基础渲染功能', () => {});
describe('用户交互功能', () => {});

// ❌ 不好的命名
describe('test', () => {});
describe('Component', () => {});
```

### 变量命名

```typescript
// ✅ 好的命名
const mockData = {};
const mockUser = {};
const mockApiResponse = {};
const mockCallback = jest.fn();
const mockComponentProps = {};

// ❌ 不好的命名
const data = {};
const x = {};
const fn = jest.fn();
```

## 测试分类

### 1. 单元测试

测试单个函数、类或组件的功能。

```typescript
describe('validators', () => {
  describe('isValidEmail', () => {
    it('应该验证有效的邮箱地址', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
    });

    it('应该拒绝无效的邮箱地址', () => {
      expect(isValidEmail('invalid')).toBe(false);
    });
  });
});
```

### 2. 组件测试

测试React组件的渲染、交互和状态。

```typescript
describe('DataTable组件', () => {
  describe('基础渲染', () => {
    it('应该正确渲染数据表格', () => {
      render(<DataTable data={mockData} />);
      expect(screen.getByText('数据标题')).toBeInTheDocument();
    });
  });

  describe('用户交互', () => {
    it('应该在点击时调用回调', async () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>点击</Button>);
      await userEvent.click(screen.getByText('点击'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });
});
```

### 3. 集成测试

测试多个组件或模块之间的交互。

```typescript
describe('用户登录流程', () => {
  it('应该完成完整的登录流程', async () => {
    render(<LoginForm />);
    await userEvent.type(screen.getByLabelText('用户名'), 'testuser');
    await userEvent.type(screen.getByLabelText('密码'), 'password');
    await userEvent.click(screen.getByText('登录'));
    await waitFor(() => {
      expect(screen.getByText('登录成功')).toBeInTheDocument();
    });
  });
});
```

### 4. API测试

测试API调用的正确性。

```typescript
describe('materialApi', () => {
  it('应该成功获取物料列表', async () => {
    const mockResponse = mockSuccessResponse([mockMaterial]);
    apiClient.get.mockResolvedValue(mockResponse);

    const result = await materialApi.getList();

    expect(apiClient.get).toHaveBeenCalledWith('/materials');
    expect(result).toEqual(mockResponse);
  });
});
```

## 最佳实践

### 1. AAA模式（Arrange-Act-Assert）

```typescript
it('应该计算正确的总价', () => {
  // Arrange - 准备测试数据
  const price = 100;
  const quantity = 5;
  const expectedResult = 500;

  // Act - 执行被测试的功能
  const result = calculateTotal(price, quantity);

  // Assert - 验证结果
  expect(result).toBe(expectedResult);
});
```

### 2. 使用有意义的断言

```typescript
// ✅ 好的断言
expect(screen.getByText('提交')).toBeInTheDocument();
expect(screen.getByRole('button')).toBeDisabled();
expect(apiClient.get).toHaveBeenCalledWith('/materials');
expect(result).toEqual({ id: '1', name: 'test' });

// ❌ 不好的断言
expect(component).toBeTruthy();
expect(result).toBeDefined();
```

### 3. 等待异步操作

```typescript
// ✅ 好的做法
await waitFor(() => {
  expect(screen.getByText('加载完成')).toBeInTheDocument();
});

// ❌ 不好的做法
expect(screen.getByText('加载完成')).toBeInTheDocument();
```

### 4. 正确使用查询方法

```typescript
// 获取元素（期望元素存在）
screen.getByText('文本');
screen.getByRole('button');
screen.getByLabelText('标签');

// 查询元素（不期望元素存在）
screen.queryByText('不存在的文本');
screen.queryByRole('button');

// 等待元素出现
await screen.findByText('异步加载的文本');
await screen.findByRole('button');
```

### 5. Mock外部依赖

```typescript
// Mock API调用
jest.mock('../../api/materialApi', () => ({
  materialApi: {
    getList: jest.fn(),
    create: jest.fn(),
  },
}));

// Mock组件
jest.mock('../ChildComponent', () => ({
  ChildComponent: () => <div>Mocked</div>,
}));

// Mock hooks
jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({ user: mockUser }),
}));
```

### 6. 测试边界情况

```typescript
describe('边界情况测试', () => {
  it('应该处理空数据', () => {
    render(<DataTable data={[]} />);
    expect(screen.getByText('暂无数据')).toBeInTheDocument();
  });

  it('应该处理null值', () => {
    render(<DataTable data={null as any} />);
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('应该处理未定义的props', () => {
    render(<DataTable />);
    expect(screen.getByRole('table')).toBeInTheDocument();
  });
});
```

### 7. 测试错误处理

```typescript
describe('错误处理', () => {
  it('应该显示错误信息', async () => {
    apiClient.get.mockRejectedValue(new Error('网络错误'));
    render(<DataList />);

    await waitFor(() => {
      expect(screen.getByText('网络错误')).toBeInTheDocument();
    });
  });

  it('应该处理API错误响应', async () => {
    const mockErrorResponse = {
      code: 'ERROR',
      message: '操作失败',
      data: null,
    };
    apiClient.get.mockResolvedValue(mockErrorResponse);
    render(<DataList />);

    await waitFor(() => {
      expect(screen.getByText('操作失败')).toBeInTheDocument();
    });
  });
});
```

## 代码示例

### 组件测试模板

```typescript
/**
 * ComponentName 组件单元测试
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComponentName } from '../ComponentName';

// Mock数据
const mockData = [
  {
    id: '1',
    name: '测试数据1',
    status: 'ACTIVE',
  },
];

const mockProps = {
  data: mockData,
  loading: false,
  onEdit: jest.fn(),
  onDelete: jest.fn(),
};

describe('ComponentName', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('基础渲染', () => {
    it('应该正确渲染组件', () => {
      render(<ComponentName {...mockProps} />);
      expect(screen.getByText('测试数据1')).toBeInTheDocument();
    });

    it('应该显示加载状态', () => {
      render(<ComponentName {...mockProps} loading={true} />);
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  describe('用户交互', () => {
    it('应该在点击编辑按钮时调用onEdit', async () => {
      render(<ComponentName {...mockProps} />);
      const editButton = screen.getByText('编辑');
      await userEvent.click(editButton);
      expect(mockProps.onEdit).toHaveBeenCalledWith('1');
    });

    it('应该在点击删除按钮时调用onDelete', async () => {
      render(<ComponentName {...mockProps} />);
      const deleteButton = screen.getByText('删除');
      await userEvent.click(deleteButton);
      await waitFor(() => {
        expect(mockProps.onDelete).toHaveBeenCalledWith('1');
      });
    });
  });

  describe('边界情况', () => {
    it('应该处理空数据', () => {
      render(<ComponentName {...mockProps} data={[]} />);
      expect(screen.getByText('暂无数据')).toBeInTheDocument();
    });

    it('应该处理undefined数据', () => {
      render(<ComponentName {...mockProps} data={undefined as any} />);
      expect(screen.getByRole('list')).toBeInTheDocument();
    });
  });
});
```

### Hook测试模板

```typescript
/**
 * hookName Hook 单元测试
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useHookName } from '../hookName';

describe('useHookName', () => {
  it('应该返回初始状态', () => {
    const { result } = renderHook(() => useHookName());
    expect(result.current.state).toEqual(initialState);
  });

  it('应该在调用action时更新状态', async () => {
    const { result } = renderHook(() => useHookName());

    act(() => {
      result.current.action();
    });

    await waitFor(() => {
      expect(result.current.state).toEqual(updatedState);
    });
  });

  it('应该处理错误情况', async () => {
    const { result } = renderHook(() => useHookName());

    await act(async () => {
      try {
        await result.current.asyncAction();
      } catch (error) {
        expect(error.message).toBe('预期错误');
      }
    });
  });
});
```

### API测试模板

```typescript
/**
 * apiName API 单元测试
 */

import { apiName } from '../apiName';
import { mockApiClient, mockSuccessResponse } from '../../__mocks__/apiMock';

jest.mock('../../api/apiClient', () => ({
  apiClient: mockApiClient,
}));

describe('apiName', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getList', () => {
    it('应该成功获取列表', async () => {
      const mockData = [{ id: '1', name: 'test' }];
      const mockResponse = mockSuccessResponse(mockData);
      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await apiName.getList();

      expect(mockApiClient.get).toHaveBeenCalledWith('/endpoint');
      expect(result).toEqual(mockResponse);
    });

    it('应该处理错误响应', async () => {
      mockApiClient.get.mockRejectedValue(new Error('网络错误'));

      await expect(apiName.getList()).rejects.toThrow('网络错误');
    });
  });

  describe('create', () => {
    it('应该成功创建资源', async () => {
      const mockData = { name: 'test' };
      const mockResponse = mockSuccessResponse({ id: '1', ...mockData });
      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await apiName.create(mockData);

      expect(mockApiClient.post).toHaveBeenCalledWith('/endpoint', mockData);
      expect(result).toEqual(mockResponse);
    });
  });
});
```

## 测试覆盖率要求

- **单元测试覆盖率**: >= 70%
- **关键业务逻辑**: >= 90%
- **核心组件**: >= 80%
- **工具函数**: >= 95%

## 测试审查检查清单

在提交代码前，确保：

- [ ] 所有测试通过
- [ ] 测试覆盖率满足要求
- [ ] 测试名称描述清晰
- [ ] 测试覆盖正常流程和边界情况
- [ ] 测试覆盖错误处理
- [ ] Mock正确设置和清理
- [ ] 没有不必要的等待和sleep
- [ ] 测试独立运行不依赖其他测试

## 参考资源

- [Jest最佳实践](https://jestjs.io/docs/tutorial-react)
- [React Testing Library最佳实践](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [测试金字塔](https://martinfowler.com/articles/practical-test-pyramid.html)

/**
 * API Mock Utilities
 * 统一的API响应mock配置
 */

export const mockSuccessResponse = <T>(data: T) => ({
  code: 'SUCCESS',
  message: '操作成功',
  data,
  timestamp: Date.now(),
});

export const mockErrorResponse = (message: string, code: string = 'ERROR') => ({
  code,
  message,
  data: null,
  timestamp: Date.now(),
});

export const mockPaginatedResponse = <T>(
  data: T[],
  total: number,
  page: number = 1,
  pageSize: number = 10
) => ({
  code: 'SUCCESS',
  message: '操作成功',
  data: {
    list: data,
    pagination: {
      current: page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  },
  timestamp: Date.now(),
});

// Common mock data
export const mockUser = {
  id: '1',
  username: 'testuser',
  name: '测试用户',
  email: 'test@example.com',
  phone: '13800138000',
  status: 'ACTIVE',
  roles: ['USER'],
  factoryId: '1',
  factoryName: '测试工厂',
  createdAt: '2023-01-01T00:00:00Z',
};

export const mockFactory = {
  id: '1',
  code: 'FACTORY001',
  name: '测试工厂',
  status: 'ACTIVE',
  address: '测试地址',
  createdAt: '2023-01-01T00:00:00Z',
};

export const mockWorkshop = {
  id: '1',
  code: 'WORKSHOP001',
  name: '测试车间',
  factoryId: '1',
  factoryName: '测试工厂',
  status: 'ACTIVE',
  createdAt: '2023-01-01T00:00:00Z',
};

export const mockWorkCenter = {
  id: '1',
  code: 'WC001',
  name: '测试工作中心',
  workshopId: '1',
  workshopName: '测试车间',
  status: 'ACTIVE',
  capacity: 100,
  createdAt: '2023-01-01T00:00:00Z',
};

export const mockMaterial = {
  id: '1',
  code: 'MAT001',
  name: '测试物料',
  type: 'RAW_MATERIAL',
  unit: 'KG',
  status: 'ACTIVE',
  createdAt: '2023-01-01T00:00:00Z',
};

// Mock API client
export const mockApiClient = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
};

export const setupMockApiClient = () => {
  mockApiClient.get.mockResolvedValue(mockSuccessResponse({}));
  mockApiClient.post.mockResolvedValue(mockSuccessResponse({}));
  mockApiClient.put.mockResolvedValue(mockSuccessResponse({}));
  mockApiClient.delete.mockResolvedValue(mockSuccessResponse({}));
  return mockApiClient;
};

export const clearMockApiClient = () => {
  mockApiClient.get.mockReset();
  mockApiClient.post.mockReset();
  mockApiClient.put.mockReset();
  mockApiClient.delete.mockReset();
};

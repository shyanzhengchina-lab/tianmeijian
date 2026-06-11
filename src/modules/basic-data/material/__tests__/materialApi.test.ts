/**
 * Material API 单元测试
 * 测试物料档案API服务的所有功能
 */

import { materialApi } from '../api/materialApi';
import { apiClient } from '../../../../shared/api';

// Mock the apiClient
jest.mock('../../../../shared/api', () => ({
  apiClient: {
    getPage: jest.fn(),
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    export: jest.fn(),
  },
}));

// Import the mocked apiClient
const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('Material API Service', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Cleanup after each test if needed
  });

  describe('HTTP Request Tests', () => {
    describe('GET Requests', () => {
      it('should get materials with pagination', async () => {
        const mockQuery = {
          current: 1,
          pageSize: 10,
          code: 'MAT001',
        };
        const mockResponse = {
          code: 200,
          message: 'success',
          data: {
            list: [
              {
                id: '1',
                code: 'MAT001',
                name: 'Material 1',
                status: 'active',
              },
            ],
            total: 1,
            current: 1,
            pageSize: 10,
          },
        };

        mockedApiClient.getPage.mockResolvedValue(mockResponse);

        const result = await materialApi.getMaterials(mockQuery);

        expect(mockedApiClient.getPage).toHaveBeenCalledWith('/material/list', mockQuery);
        expect(result).toEqual(mockResponse);
      });

      it('should get all materials without pagination', async () => {
        const mockResponse = {
          code: 200,
          message: 'success',
          data: [
            { id: '1', code: 'MAT001', name: 'Material 1', status: 'active' },
            { id: '2', code: 'MAT002', name: 'Material 2', status: 'active' },
          ],
        };

        mockedApiClient.get.mockResolvedValue(mockResponse);

        const result = await materialApi.getAllMaterials();

        expect(mockedApiClient.get).toHaveBeenCalledWith('/material/all');
        expect(result).toEqual(mockResponse);
      });

      it('should get material by id', async () => {
        const materialId = '123';
        const mockResponse = {
          code: 200,
          message: 'success',
          data: {
            id: materialId,
            code: 'MAT001',
            name: 'Material 1',
            status: 'active',
          },
        };

        mockedApiClient.get.mockResolvedValue(mockResponse);

        const result = await materialApi.getMaterialById(materialId);

        expect(mockedApiClient.get).toHaveBeenCalledWith(`/material/${materialId}`);
        expect(result).toEqual(mockResponse);
      });

      it('should get material by code', async () => {
        const materialCode = 'MAT001';
        const mockResponse = {
          code: 200,
          message: 'success',
          data: {
            id: '123',
            code: materialCode,
            name: 'Material 1',
            status: 'active',
          },
        };

        mockedApiClient.get.mockResolvedValue(mockResponse);

        const result = await materialApi.getMaterialByCode(materialCode);

        expect(mockedApiClient.get).toHaveBeenCalledWith(`/material/code/${materialCode}`);
        expect(result).toEqual(mockResponse);
      });

      it('should search materials by keyword', async () => {
        const keyword = 'test';
        const mockResponse = {
          code: 200,
          message: 'success',
          data: [
            { id: '1', code: 'TEST001', name: 'Test Material', status: 'active' },
          ],
        };

        mockedApiClient.get.mockResolvedValue(mockResponse);

        const result = await materialApi.searchMaterials(keyword);

        expect(mockedApiClient.get).toHaveBeenCalledWith('/material/search', { keyword });
        expect(result).toEqual(mockResponse);
      });

      it('should get category tree', async () => {
        const mockResponse = {
          code: 200,
          message: 'success',
          data: [
            {
              id: '1',
              code: 'CAT001',
              name: 'Category 1',
              status: 'active',
              children: [],
            },
          ],
        };

        mockedApiClient.get.mockResolvedValue(mockResponse);

        const result = await materialApi.getCategoryTree();

        expect(mockedApiClient.get).toHaveBeenCalledWith('/material/category-tree');
        expect(result).toEqual(mockResponse);
      });

      it('should get categories', async () => {
        const mockResponse = {
          code: 200,
          message: 'success',
          data: [
            { id: '1', code: 'CAT001', name: 'Category 1', status: 'active' },
          ],
        };

        mockedApiClient.get.mockResolvedValue(mockResponse);

        const result = await materialApi.getCategories();

        expect(mockedApiClient.get).toHaveBeenCalledWith('/material/categories');
        expect(result).toEqual(mockResponse);
      });

      it('should get statistics', async () => {
        const mockResponse = {
          code: 200,
          message: 'success',
          data: {
            totalCount: 100,
            activeCount: 80,
            inactiveCount: 20,
            categoryCount: 10,
          },
        };

        mockedApiClient.get.mockResolvedValue(mockResponse);

        const result = await materialApi.getStatistics();

        expect(mockedApiClient.get).toHaveBeenCalledWith('/material/statistics');
        expect(result).toEqual(mockResponse);
      });

      it('should check code uniqueness', async () => {
        const code = 'MAT001';
        const mockResponse = {
          code: 200,
          message: 'success',
          data: { unique: true },
        };

        mockedApiClient.get.mockResolvedValue(mockResponse);

        const result = await materialApi.checkCodeUnique(code);

        expect(mockedApiClient.get).toHaveBeenCalledWith('/material/check-code', {
          code,
          excludeId: undefined,
        });
        expect(result).toEqual(mockResponse);
      });
    });

    describe('POST Requests', () => {
      it('should create a material', async () => {
        const createData = {
          code: 'MAT001',
          name: 'Material 1',
          categoryId: 'cat1',
          unitId: 'unit1',
          status: 'active',
        };
        const mockResponse = {
          code: 200,
          message: 'success',
          data: {
            id: '123',
            ...createData,
          },
        };

        mockedApiClient.post.mockResolvedValue(mockResponse);

        const result = await materialApi.createMaterial(createData);

        expect(mockedApiClient.post).toHaveBeenCalledWith('/material/create', createData, {
          showSuccess: true,
          successText: '创建成功',
        });
        expect(result).toEqual(mockResponse);
      });

      it('should create a material category', async () => {
        const categoryData = {
          code: 'CAT001',
          name: 'Category 1',
          status: 'active',
        };
        const mockResponse = {
          code: 200,
          message: 'success',
          data: {
            id: '123',
            ...categoryData,
          },
        };

        mockedApiClient.post.mockResolvedValue(mockResponse);

        const result = await materialApi.createCategory(categoryData as any);

        expect(mockedApiClient.post).toHaveBeenCalledWith('/material/category/create', categoryData, {
          showSuccess: true,
          successText: '创建成功',
        });
        expect(result).toEqual(mockResponse);
      });

      it('should batch delete materials', async () => {
        const ids = ['1', '2', '3'];
        const mockResponse = {
          code: 200,
          message: 'success',
          data: {
            success: 3,
            failed: 0,
          },
        };

        mockedApiClient.post.mockResolvedValue(mockResponse);

        const result = await materialApi.deleteMaterials(ids);

        expect(mockedApiClient.post).toHaveBeenCalledWith('/material/batch-delete', { ids }, {
          showSuccess: true,
          successText: `成功删除${ids.length}条记录`,
        });
        expect(result).toEqual(mockResponse);
      });

      it('should import materials', async () => {
        const file = new File([''], 'materials.xlsx');
        const mockResponse = {
          code: 200,
          message: 'success',
          data: {
            success: 10,
            failed: 0,
          },
        };

        mockedApiClient.post.mockResolvedValue(mockResponse);

        const result = await materialApi.importMaterials(file);

        expect(mockedApiClient.post).toHaveBeenCalledWith(
          '/material/import',
          expect.any(FormData),
          {
            showSuccess: true,
            successText: '导入成功',
          }
        );
        expect(result).toEqual(mockResponse);
      });
    });

    describe('PUT Requests', () => {
      it('should update a material', async () => {
        const updateData = {
          id: '123',
          code: 'MAT001',
          name: 'Updated Material',
          status: 'active',
        };
        const mockResponse = {
          code: 200,
          message: 'success',
          data: updateData,
        };

        mockedApiClient.put.mockResolvedValue(mockResponse);

        const result = await materialApi.updateMaterial(updateData);

        expect(mockedApiClient.put).toHaveBeenCalledWith('/material/update', updateData, {
          showSuccess: true,
          successText: '更新成功',
        });
        expect(result).toEqual(mockResponse);
      });

      it('should update a material category', async () => {
        const categoryData = {
          id: '123',
          code: 'CAT001',
          name: 'Updated Category',
          status: 'active',
        };
        const mockResponse = {
          code: 200,
          message: 'success',
          data: categoryData,
        };

        mockedApiClient.put.mockResolvedValue(mockResponse);

        const result = await materialApi.updateCategory(categoryData as any);

        expect(mockedApiClient.put).toHaveBeenCalledWith('/material/category/update', categoryData, {
          showSuccess: true,
          successText: '更新成功',
        });
        expect(result).toEqual(mockResponse);
      });

      it('should update material status', async () => {
        const statusAction = {
          ids: ['1', '2', '3'],
          status: 'inactive' as const,
        };
        const mockResponse = {
          code: 200,
          message: 'success',
          data: {
            success: 3,
            failed: 0,
          },
        };

        mockedApiClient.put.mockResolvedValue(mockResponse);

        const result = await materialApi.updateStatus(statusAction);

        expect(mockedApiClient.put).toHaveBeenCalledWith('/material/status', statusAction);
        expect(result).toEqual(mockResponse);
      });

      it('should batch enable materials', async () => {
        const ids = ['1', '2', '3'];
        const mockResponse = {
          code: 200,
          message: 'success',
          data: {
            success: 3,
            failed: 0,
          },
        };

        mockedApiClient.put.mockResolvedValue(mockResponse);

        const result = await materialApi.batchEnable(ids);

        expect(mockedApiClient.put).toHaveBeenCalledWith('/material/status', {
          ids,
          status: 'active',
        });
        expect(result).toEqual(mockResponse);
      });

      it('should batch disable materials', async () => {
        const ids = ['1', '2', '3'];
        const mockResponse = {
          code: 200,
          message: 'success',
          data: {
            success: 3,
            failed: 0,
          },
        };

        mockedApiClient.put.mockResolvedValue(mockResponse);

        const result = await materialApi.batchDisable(ids);

        expect(mockedApiClient.put).toHaveBeenCalledWith('/material/status', {
          ids,
          status: 'inactive',
        });
        expect(result).toEqual(mockResponse);
      });
    });

    describe('DELETE Requests', () => {
      it('should delete a material', async () => {
        const materialId = '123';
        const mockResponse = {
          code: 200,
          message: 'success',
          data: null,
        };

        mockedApiClient.delete.mockResolvedValue(mockResponse);

        const result = await materialApi.deleteMaterial(materialId);

        expect(mockedApiClient.delete).toHaveBeenCalledWith(`/material/${materialId}`, undefined, {
          showSuccess: true,
          successText: '删除成功',
        });
        expect(result).toEqual(mockResponse);
      });

      it('should delete a material category', async () => {
        const categoryId = '123';
        const mockResponse = {
          code: 200,
          message: 'success',
          data: null,
        };

        mockedApiClient.delete.mockResolvedValue(mockResponse);

        const result = await materialApi.deleteCategory(categoryId);

        expect(mockedApiClient.delete).toHaveBeenCalledWith(`/material/category/${categoryId}`, undefined, {
          showSuccess: true,
          successText: '删除成功',
        });
        expect(result).toEqual(mockResponse);
      });
    });

    describe('Export Requests', () => {
      it('should export materials', async () => {
        const query = { current: 1, pageSize: 10 };
        const fileName = 'materials';

        mockedApiClient.export.mockResolvedValue(undefined);

        await materialApi.exportMaterials(query, fileName);

        expect(mockedApiClient.export).toHaveBeenCalledWith('/material/export', {
          params: query,
          fileName,
          type: 'excel',
        });
      });
    });
  });

  describe('Parameter Validation Tests', () => {
    it('should handle missing required parameters', async () => {
      const mockResponse = {
        code: 400,
        message: 'Validation failed',
        data: null,
      };

      mockedApiClient.get.mockRejectedValue(new Error('Validation failed'));

      await expect(materialApi.getMaterialById('')).rejects.toThrow();
    });

    it('should handle invalid ID format', async () => {
      const mockResponse = {
        code: 400,
        message: 'Invalid ID format',
        data: null,
      };

      mockedApiClient.get.mockRejectedValue(new Error('Invalid ID format'));

      await expect(materialApi.getMaterialById('invalid-id')).rejects.toThrow();
    });

    it('should handle invalid query parameters', async () => {
      const invalidQuery = {
        current: -1,
        pageSize: 0,
      };
      const mockResponse = {
        code: 400,
        message: 'Invalid query parameters',
        data: null,
      };

      mockedApiClient.getPage.mockRejectedValue(new Error('Invalid query parameters'));

      await expect(materialApi.getMaterials(invalidQuery as any)).rejects.toThrow();
    });
  });

  describe('Response Handling Tests', () => {
    it('should handle successful response (200)', async () => {
      const mockResponse = {
        code: 200,
        message: 'success',
        data: {
          id: '1',
          code: 'MAT001',
          name: 'Material 1',
          status: 'active',
        },
      };

      mockedApiClient.get.mockResolvedValue(mockResponse);

      const result = await materialApi.getMaterialById('1');

      expect(result.code).toBe(200);
      expect(result.data).toBeDefined();
    });

    it('should handle error response (400)', async () => {
      const mockError = {
        response: {
          status: 400,
          data: {
            code: 400,
            message: 'Bad Request',
            data: null,
          },
        },
      };

      mockedApiClient.get.mockRejectedValue(mockError);

      await expect(materialApi.getMaterialById('1')).rejects.toThrow();
    });

    it('should handle not found response (404)', async () => {
      const mockError = {
        response: {
          status: 404,
          data: {
            code: 404,
            message: 'Not Found',
            data: null,
          },
        },
      };

      mockedApiClient.get.mockRejectedValue(mockError);

      await expect(materialApi.getMaterialById('nonexistent')).rejects.toThrow();
    });

    it('should handle server error response (500)', async () => {
      const mockError = {
        response: {
          status: 500,
          data: {
            code: 500,
            message: 'Internal Server Error',
            data: null,
          },
        },
      };

      mockedApiClient.get.mockRejectedValue(mockError);

      await expect(materialApi.getMaterialById('1')).rejects.toThrow();
    });

    it('should handle network error', async () => {
      const mockError = new Error('Network Error');
      mockedApiClient.get.mockRejectedValue(mockError);

      await expect(materialApi.getMaterialById('1')).rejects.toThrow();
    });
  });

  describe('Boundary Condition Tests', () => {
    it('should handle empty result set', async () => {
      const mockResponse = {
        code: 200,
        message: 'success',
        data: {
          list: [],
          total: 0,
          current: 1,
          pageSize: 10,
        },
      };

      mockedApiClient.getPage.mockResolvedValue(mockResponse);

      const result = await materialApi.getMaterials({ current: 1, pageSize: 10 });

      expect(result.data.list).toHaveLength(0);
      expect(result.data.total).toBe(0);
    });

    it('should handle single result', async () => {
      const mockResponse = {
        code: 200,
        message: 'success',
        data: {
          list: [
            {
              id: '1',
              code: 'MAT001',
              name: 'Material 1',
              status: 'active',
            },
          ],
          total: 1,
          current: 1,
          pageSize: 10,
        },
      };

      mockedApiClient.getPage.mockResolvedValue(mockResponse);

      const result = await materialApi.getMaterials({ current: 1, pageSize: 10 });

      expect(result.data.list).toHaveLength(1);
      expect(result.data.total).toBe(1);
    });

    it('should handle large result set', async () => {
      const largeList = Array.from({ length: 1000 }, (_, i) => ({
        id: String(i + 1),
        code: `MAT${String(i + 1).padStart(3, '0')}`,
        name: `Material ${i + 1}`,
        status: 'active',
      }));

      const mockResponse = {
        code: 200,
        message: 'success',
        data: {
          list: largeList,
          total: 1000,
          current: 1,
          pageSize: 1000,
        },
      };

      mockedApiClient.getPage.mockResolvedValue(mockResponse);

      const result = await materialApi.getMaterials({ current: 1, pageSize: 1000 });

      expect(result.data.list).toHaveLength(1000);
      expect(result.data.total).toBe(1000);
    });

    it('should handle pagination edge cases', async () => {
      const mockResponse = {
        code: 200,
        message: 'success',
        data: {
          list: [],
          total: 0,
          current: 99999,
          pageSize: 10,
        },
      };

      mockedApiClient.getPage.mockResolvedValue(mockResponse);

      const result = await materialApi.getMaterials({ current: 99999, pageSize: 10 });

      expect(result.data.current).toBe(99999);
    });
  });

  describe('Integration Tests', () => {
    it('should verify API endpoint connectivity', async () => {
      const mockResponse = {
        code: 200,
        message: 'success',
        data: {
          id: '1',
          code: 'MAT001',
          name: 'Material 1',
          status: 'active',
        },
      };

      mockedApiClient.get.mockResolvedValue(mockResponse);

      const result = await materialApi.getMaterialById('1');

      expect(mockedApiClient.get).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.code).toBe(200);
    });

    it('should handle authentication token', async () => {
      const mockResponse = {
        code: 200,
        message: 'success',
        data: {
          id: '1',
          code: 'MAT001',
          name: 'Material 1',
          status: 'active',
        },
      };

      mockedApiClient.get.mockResolvedValue(mockResponse);

      await materialApi.getMaterialById('1');

      // Verify the API was called (token handling is in the interceptor)
      expect(mockedApiClient.get).toHaveBeenCalled();
    });

    it('should handle complex query with multiple filters', async () => {
      const complexQuery = {
        current: 1,
        pageSize: 10,
        code: 'MAT',
        name: 'test',
        categoryId: 'cat1',
        status: 'active',
        brand: 'brand1',
        model: 'model1',
      };

      const mockResponse = {
        code: 200,
        message: 'success',
        data: {
          list: [],
          total: 0,
          current: 1,
          pageSize: 10,
        },
      };

      mockedApiClient.getPage.mockResolvedValue(mockResponse);

      const result = await materialApi.getMaterials(complexQuery);

      expect(mockedApiClient.getPage).toHaveBeenCalledWith('/material/list', complexQuery);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Data Consistency Tests', () => {
    it('should maintain data integrity during create', async () => {
      const createData = {
        code: 'MAT001',
        name: 'Material 1',
        categoryId: 'cat1',
        unitId: 'unit1',
        status: 'active',
      };

      const mockResponse = {
        code: 200,
        message: 'success',
        data: {
          id: '123',
          ...createData,
        },
      };

      mockedApiClient.post.mockResolvedValue(mockResponse);

      const result = await materialApi.createMaterial(createData);

      expect(result.data.code).toBe(createData.code);
      expect(result.data.name).toBe(createData.name);
    });

    it('should maintain data integrity during update', async () => {
      const updateData = {
        id: '123',
        code: 'MAT001',
        name: 'Updated Material',
        status: 'active',
      };

      const mockResponse = {
        code: 200,
        message: 'success',
        data: updateData,
      };

      mockedApiClient.put.mockResolvedValue(mockResponse);

      const result = await materialApi.updateMaterial(updateData);

      expect(result.data.id).toBe(updateData.id);
      expect(result.data.name).toBe(updateData.name);
    });

    it('should validate code uniqueness before create', async () => {
      const code = 'MAT001';

      const mockCheckResponse = {
        code: 200,
        message: 'success',
        data: { unique: true },
      };

      mockedApiClient.get.mockResolvedValue(mockCheckResponse);

      const checkResult = await materialApi.checkCodeUnique(code);

      expect(checkResult.data.unique).toBe(true);
    });

    it('should validate code uniqueness with exclude ID', async () => {
      const code = 'MAT001';
      const excludeId = '123';

      const mockResponse = {
        code: 200,
        message: 'success',
        data: { unique: true },
      };

      mockedApiClient.get.mockResolvedValue(mockResponse);

      const result = await materialApi.checkCodeUnique(code, excludeId);

      expect(mockedApiClient.get).toHaveBeenCalledWith('/material/check-code', {
        code,
        excludeId,
      });
    });
  });

  describe('Error Recovery Tests', () => {
    it('should handle retry logic for failed requests', async () => {
      const mockError = new Error('Network Error');
      const mockResponse = {
        code: 200,
        message: 'success',
        data: {
          id: '1',
          code: 'MAT001',
          name: 'Material 1',
          status: 'active',
        },
      };

      mockedApiClient.get.mockRejectedValueOnce(mockError).mockResolvedValue(mockResponse);

      const result = await materialApi.getMaterialById('1');

      expect(result).toEqual(mockResponse);
    });

    it('should handle timeout errors', async () => {
      const mockError = new Error('Request timeout');
      mockedApiClient.get.mockRejectedValue(mockError);

      await expect(materialApi.getMaterialById('1')).rejects.toThrow();
    });
  });
});

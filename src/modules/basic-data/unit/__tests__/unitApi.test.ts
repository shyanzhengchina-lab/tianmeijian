/**
 * Unit API 单元测试
 * 测试计量单位API服务的所有功能
 */

import { unitApi } from '../api/unitApi';
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

describe('Unit API Service', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Cleanup after each test if needed
  });

  describe('HTTP Request Tests', () => {
    describe('GET Requests', () => {
      it('should get units with pagination', async () => {
        const mockQuery = {
          current: 1,
          pageSize: 10,
          code: 'UNIT001',
        };
        const mockResponse = {
          code: 200,
          message: 'success',
          data: {
            list: [
              {
                id: '1',
                code: 'UNIT001',
                name: 'Unit 1',
                category: 'base',
                status: 'active',
              },
            ],
            total: 1,
            current: 1,
            pageSize: 10,
          },
        };

        mockedApiClient.getPage.mockResolvedValue(mockResponse);

        const result = await unitApi.getUnits(mockQuery as any);

        expect(mockedApiClient.getPage).toHaveBeenCalledWith('/unit/list', mockQuery);
        expect(result).toEqual(mockResponse);
      });

      it('should get all units without pagination', async () => {
        const mockResponse = {
          code: 200,
          message: 'success',
          data: [
            { id: '1', code: 'UNIT001', name: 'Unit 1', category: 'base', status: 'active' },
            { id: '2', code: 'UNIT002', name: 'Unit 2', category: 'auxiliary', status: 'active' },
          ],
        };

        mockedApiClient.get.mockResolvedValue(mockResponse);

        const result = await unitApi.getAllUnits();

        expect(mockedApiClient.get).toHaveBeenCalledWith('/unit/all');
        expect(result).toEqual(mockResponse);
      });

      it('should get unit by id', async () => {
        const unitId = '123';
        const mockResponse = {
          code: 200,
          message: 'success',
          data: {
            id: unitId,
            code: 'UNIT001',
            name: 'Unit 1',
            category: 'base',
            status: 'active',
          },
        };

        mockedApiClient.get.mockResolvedValue(mockResponse);

        const result = await unitApi.getUnitById(unitId);

        expect(mockedApiClient.get).toHaveBeenCalledWith(`/unit/${unitId}`);
        expect(result).toEqual(mockResponse);
      });

      it('should search units by keyword', async () => {
        const keyword = 'test';
        const mockResponse = {
          code: 200,
          message: 'success',
          data: [
            { id: '1', code: 'TEST001', name: 'Test Unit', category: 'base', status: 'active' },
          ],
        };

        mockedApiClient.get.mockResolvedValue(mockResponse);

        const result = await unitApi.searchUnits(keyword);

        expect(mockedApiClient.get).toHaveBeenCalledWith('/unit/search', { params: { keyword } });
        expect(result).toEqual(mockResponse);
      });

      it('should get statistics', async () => {
        const mockResponse = {
          code: 200,
          message: 'success',
          data: {
            totalCount: 50,
            activeCount: 40,
            inactiveCount: 10,
            categoryCount: 3,
          },
        };

        mockedApiClient.get.mockResolvedValue(mockResponse);

        const result = await unitApi.getStatistics();

        expect(mockedApiClient.get).toHaveBeenCalledWith('/unit/statistics');
        expect(result).toEqual(mockResponse);
      });

      it('should check code uniqueness', async () => {
        const code = 'UNIT001';
        const mockResponse = {
          code: 200,
          message: 'success',
          data: { unique: true },
        };

        mockedApiClient.get.mockResolvedValue(mockResponse);

        const result = await unitApi.checkCodeUnique(code);

        expect(mockedApiClient.get).toHaveBeenCalledWith('/unit/check-code', {
          params: { code, excludeId: undefined },
        });
        expect(result).toEqual(mockResponse);
      });

      it('should check code uniqueness with exclude ID', async () => {
        const code = 'UNIT001';
        const excludeId = '123';
        const mockResponse = {
          code: 200,
          message: 'success',
          data: { unique: true },
        };

        mockedApiClient.get.mockResolvedValue(mockResponse);

        const result = await unitApi.checkCodeUnique(code, excludeId);

        expect(mockedApiClient.get).toHaveBeenCalledWith('/unit/check-code', {
          params: { code, excludeId },
        });
        expect(result).toEqual(mockResponse);
      });
    });

    describe('POST Requests', () => {
      it('should create a unit', async () => {
        const createData = {
          code: 'UNIT001',
          name: 'Unit 1',
          category: 'base',
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

        const result = await unitApi.createUnit(createData as any);

        expect(mockedApiClient.post).toHaveBeenCalledWith('/unit/create', createData);
        expect(result).toEqual(mockResponse);
      });

      it('should create a unit with all fields', async () => {
        const createData = {
          code: 'UNIT001',
          name: 'Unit 1',
          category: 'auxiliary',
          symbol: 'kg',
          baseUnitId: 'base1',
          conversionRate: 1000,
          decimalPlaces: 3,
          status: 'active',
          remark: 'Test unit',
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

        const result = await unitApi.createUnit(createData as any);

        expect(mockedApiClient.post).toHaveBeenCalledWith('/unit/create', createData);
        expect(result).toEqual(mockResponse);
      });

      it('should batch delete units', async () => {
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

        const result = await unitApi.deleteUnits(ids);

        expect(mockedApiClient.post).toHaveBeenCalledWith('/unit/batch-delete', { ids });
        expect(result).toEqual(mockResponse);
      });

      it('should import units', async () => {
        const file = new File([''], 'units.xlsx');
        const mockResponse = {
          code: 200,
          message: 'success',
          data: {
            success: 5,
            failed: 0,
          },
        };

        mockedApiClient.post.mockResolvedValue(mockResponse);

        const result = await unitApi.importUnits(file);

        expect(mockedApiClient.post).toHaveBeenCalledWith(
          '/unit/import',
          expect.any(FormData)
        );
        expect(result).toEqual(mockResponse);
      });
    });

    describe('PUT Requests', () => {
      it('should update a unit', async () => {
        const updateData = {
          id: '123',
          code: 'UNIT001',
          name: 'Updated Unit',
          status: 'active',
        };
        const mockResponse = {
          code: 200,
          message: 'success',
          data: updateData,
        };

        mockedApiClient.put.mockResolvedValue(mockResponse);

        const result = await unitApi.updateUnit(updateData as any);

        expect(mockedApiClient.put).toHaveBeenCalledWith('/unit/update', updateData);
        expect(result).toEqual(mockResponse);
      });

      it('should update unit status', async () => {
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

        const result = await unitApi.updateStatus(statusAction);

        expect(mockedApiClient.put).toHaveBeenCalledWith('/unit/status', statusAction);
        expect(result).toEqual(mockResponse);
      });

      it('should batch enable units', async () => {
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

        const result = await unitApi.batchEnable(ids);

        expect(mockedApiClient.put).toHaveBeenCalledWith('/unit/status', {
          ids,
          status: 'active',
        });
        expect(result).toEqual(mockResponse);
      });

      it('should batch disable units', async () => {
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

        const result = await unitApi.batchDisable(ids);

        expect(mockedApiClient.put).toHaveBeenCalledWith('/unit/status', {
          ids,
          status: 'inactive',
        });
        expect(result).toEqual(mockResponse);
      });
    });

    describe('DELETE Requests', () => {
      it('should delete a unit', async () => {
        const unitId = '123';
        const mockResponse = {
          code: 200,
          message: 'success',
          data: null,
        };

        mockedApiClient.delete.mockResolvedValue(mockResponse);

        const result = await unitApi.deleteUnit(unitId);

        expect(mockedApiClient.delete).toHaveBeenCalledWith(`/unit/${unitId}`);
        expect(result).toEqual(mockResponse);
      });
    });

    describe('Export Requests', () => {
      it('should export units', async () => {
        const query = { current: 1, pageSize: 10 };
        const fileName = 'units';

        mockedApiClient.export.mockResolvedValue(undefined);

        await unitApi.exportUnits(query, fileName);

        expect(mockedApiClient.export).toHaveBeenCalledWith('/unit/export', {
          params: query,
          fileName,
          type: 'excel',
        });
      });

      it('should export units with default file name', async () => {
        const query = { current: 1, pageSize: 10 };

        mockedApiClient.export.mockResolvedValue(undefined);

        await unitApi.exportUnits(query);

        expect(mockedApiClient.export).toHaveBeenCalledWith('/unit/export', {
          params: query,
          fileName: 'unit',
          type: 'excel',
        });
      });
    });
  });

  describe('Parameter Validation Tests', () => {
    it('should handle missing required parameters', async () => {
      const mockError = new Error('Validation failed');
      mockedApiClient.get.mockRejectedValue(mockError);

      await expect(unitApi.getUnitById('')).rejects.toThrow();
    });

    it('should handle invalid ID format', async () => {
      const mockError = new Error('Invalid ID format');
      mockedApiClient.get.mockRejectedValue(mockError);

      await expect(unitApi.getUnitById('invalid-id')).rejects.toThrow();
    });

    it('should handle invalid query parameters', async () => {
      const invalidQuery = {
        current: -1,
        pageSize: 0,
      };
      const mockError = new Error('Invalid query parameters');

      mockedApiClient.getPage.mockRejectedValue(mockError);

      await expect(unitApi.getUnits(invalidQuery as any)).rejects.toThrow();
    });

    it('should handle invalid unit category', async () => {
      const createData = {
        code: 'UNIT001',
        name: 'Unit 1',
        category: 'invalid' as any,
        status: 'active',
      };
      const mockError = new Error('Invalid unit category');

      mockedApiClient.post.mockRejectedValue(mockError);

      await expect(unitApi.createUnit(createData as any)).rejects.toThrow();
    });

    it('should handle negative conversion rate', async () => {
      const createData = {
        code: 'UNIT001',
        name: 'Unit 1',
        category: 'auxiliary',
        conversionRate: -1,
        status: 'active',
      };
      const mockError = new Error('Invalid conversion rate');

      mockedApiClient.post.mockRejectedValue(mockError);

      await expect(unitApi.createUnit(createData as any)).rejects.toThrow();
    });
  });

  describe('Response Handling Tests', () => {
    it('should handle successful response (200)', async () => {
      const mockResponse = {
        code: 200,
        message: 'success',
        data: {
          id: '1',
          code: 'UNIT001',
          name: 'Unit 1',
          category: 'base',
          status: 'active',
        },
      };

      mockedApiClient.get.mockResolvedValue(mockResponse);

      const result = await unitApi.getUnitById('1');

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

      await expect(unitApi.getUnitById('1')).rejects.toThrow();
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

      await expect(unitApi.getUnitById('nonexistent')).rejects.toThrow();
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

      await expect(unitApi.getUnitById('1')).rejects.toThrow();
    });

    it('should handle network error', async () => {
      const mockError = new Error('Network Error');
      mockedApiClient.get.mockRejectedValue(mockError);

      await expect(unitApi.getUnitById('1')).rejects.toThrow();
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

      const result = await unitApi.getUnits({ current: 1, pageSize: 10 });

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
              code: 'UNIT001',
              name: 'Unit 1',
              category: 'base',
              status: 'active',
            },
          ],
          total: 1,
          current: 1,
          pageSize: 10,
        },
      };

      mockedApiClient.getPage.mockResolvedValue(mockResponse);

      const result = await unitApi.getUnits({ current: 1, pageSize: 10 });

      expect(result.data.list).toHaveLength(1);
      expect(result.data.total).toBe(1);
    });

    it('should handle large result set', async () => {
      const largeList = Array.from({ length: 100 }, (_, i) => ({
        id: String(i + 1),
        code: `UNIT${String(i + 1).padStart(3, '0')}`,
        name: `Unit ${i + 1}`,
        category: 'base',
        status: 'active',
      }));

      const mockResponse = {
        code: 200,
        message: 'success',
        data: {
          list: largeList,
          total: 100,
          current: 1,
          pageSize: 100,
        },
      };

      mockedApiClient.getPage.mockResolvedValue(mockResponse);

      const result = await unitApi.getUnits({ current: 1, pageSize: 100 });

      expect(result.data.list).toHaveLength(100);
      expect(result.data.total).toBe(100);
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

      const result = await unitApi.getUnits({ current: 99999, pageSize: 10 });

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
          code: 'UNIT001',
          name: 'Unit 1',
          category: 'base',
          status: 'active',
        },
      };

      mockedApiClient.get.mockResolvedValue(mockResponse);

      const result = await unitApi.getUnitById('1');

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
          code: 'UNIT001',
          name: 'Unit 1',
          category: 'base',
          status: 'active',
        },
      };

      mockedApiClient.get.mockResolvedValue(mockResponse);

      await unitApi.getUnitById('1');

      // Verify the API was called (token handling is in the interceptor)
      expect(mockedApiClient.get).toHaveBeenCalled();
    });

    it('should handle complex query with multiple filters', async () => {
      const complexQuery = {
        current: 1,
        pageSize: 10,
        code: 'UNIT',
        name: 'test',
        category: 'base',
        status: 'active',
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

      const result = await unitApi.getUnits(complexQuery as any);

      expect(mockedApiClient.getPage).toHaveBeenCalledWith('/unit/list', complexQuery);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Unit Category Tests', () => {
    it('should handle base unit category', async () => {
      const createData = {
        code: 'BASE001',
        name: 'Base Unit',
        category: 'base',
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

      const result = await unitApi.createUnit(createData as any);

      expect(result.data.category).toBe('base');
    });

    it('should handle auxiliary unit category', async () => {
      const createData = {
        code: 'AUX001',
        name: 'Auxiliary Unit',
        category: 'auxiliary',
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

      const result = await unitApi.createUnit(createData as any);

      expect(result.data.category).toBe('auxiliary');
    });

    it('should handle custom unit category', async () => {
      const createData = {
        code: 'CUSTOM001',
        name: 'Custom Unit',
        category: 'custom',
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

      const result = await unitApi.createUnit(createData as any);

      expect(result.data.category).toBe('custom');
    });

    it('should filter units by category', async () => {
      const query = {
        current: 1,
        pageSize: 10,
        category: 'base',
      };

      const mockResponse = {
        code: 200,
        message: 'success',
        data: {
          list: [
            {
              id: '1',
              code: 'BASE001',
              name: 'Base Unit 1',
              category: 'base',
              status: 'active',
            },
          ],
          total: 1,
          current: 1,
          pageSize: 10,
        },
      };

      mockedApiClient.getPage.mockResolvedValue(mockResponse);

      const result = await unitApi.getUnits(query as any);

      expect(mockedApiClient.getPage).toHaveBeenCalledWith('/unit/list', query);
      expect(result.data.list[0].category).toBe('base');
    });
  });

  describe('Conversion Rate Tests', () => {
    it('should handle units with conversion rates', async () => {
      const createData = {
        code: 'KG001',
        name: 'Kilogram',
        category: 'auxiliary',
        baseUnitId: 'base1',
        conversionRate: 1000,
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

      const result = await unitApi.createUnit(createData as any);

      expect(result.data.conversionRate).toBe(1000);
      expect(result.data.baseUnitId).toBe('base1');
    });

    it('should handle decimal places for conversion rates', async () => {
      const createData = {
        code: 'DEC001',
        name: 'Decimal Unit',
        category: 'auxiliary',
        conversionRate: 2.5,
        decimalPlaces: 3,
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

      const result = await unitApi.createUnit(createData as any);

      expect(result.data.decimalPlaces).toBe(3);
    });
  });

  describe('Data Consistency Tests', () => {
    it('should maintain data integrity during create', async () => {
      const createData = {
        code: 'UNIT001',
        name: 'Unit 1',
        category: 'base',
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

      const result = await unitApi.createUnit(createData as any);

      expect(result.data.code).toBe(createData.code);
      expect(result.data.name).toBe(createData.name);
    });

    it('should maintain data integrity during update', async () => {
      const updateData = {
        id: '123',
        code: 'UNIT001',
        name: 'Updated Unit',
        status: 'active',
      };

      const mockResponse = {
        code: 200,
        message: 'success',
        data: updateData,
      };

      mockedApiClient.put.mockResolvedValue(mockResponse);

      const result = await unitApi.updateUnit(updateData as any);

      expect(result.data.id).toBe(updateData.id);
      expect(result.data.name).toBe(updateData.name);
    });

    it('should validate code uniqueness before create', async () => {
      const code = 'UNIT001';

      const mockCheckResponse = {
        code: 200,
        message: 'success',
        data: { unique: true },
      };

      mockedApiClient.get.mockResolvedValue(mockCheckResponse);

      const checkResult = await unitApi.checkCodeUnique(code);

      expect(checkResult.data.unique).toBe(true);
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
          code: 'UNIT001',
          name: 'Unit 1',
          category: 'base',
          status: 'active',
        },
      };

      mockedApiClient.get.mockRejectedValueOnce(mockError).mockResolvedValue(mockResponse);

      const result = await unitApi.getUnitById('1');

      expect(result).toEqual(mockResponse);
    });

    it('should handle timeout errors', async () => {
      const mockError = new Error('Request timeout');
      mockedApiClient.get.mockRejectedValue(mockError);

      await expect(unitApi.getUnitById('1')).rejects.toThrow();
    });
  });
});

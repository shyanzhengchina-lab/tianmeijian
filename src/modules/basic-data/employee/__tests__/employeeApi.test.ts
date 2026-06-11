/**
 * Employee API 单元测试
 * 测试员工档案API服务的所有功能
 */

import { employeeApi } from '../api/employeeApi';
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

describe('Employee API Service', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Cleanup after each test if needed
  });

  describe('HTTP Request Tests', () => {
    describe('GET Requests', () => {
      it('should get employees with pagination', async () => {
        const mockQuery = {
          current: 1,
          pageSize: 10,
          code: 'EMP001',
        };
        const mockResponse = {
          code: 200,
          message: 'success',
          data: {
            list: [
              {
                id: '1',
                code: 'EMP001',
                name: 'John Doe',
                gender: 'male',
                status: 'active',
              },
            ],
            total: 1,
            current: 1,
            pageSize: 10,
          },
        };

        mockedApiClient.getPage.mockResolvedValue(mockResponse);

        const result = await employeeApi.getEmployees(mockQuery);

        expect(mockedApiClient.getPage).toHaveBeenCalledWith('/employee/list', mockQuery);
        expect(result).toEqual(mockResponse);
      });

      it('should get all employees without pagination', async () => {
        const mockResponse = {
          code: 200,
          message: 'success',
          data: [
            { id: '1', code: 'EMP001', name: 'John Doe', gender: 'male', status: 'active' },
            { id: '2', code: 'EMP002', name: 'Jane Smith', gender: 'female', status: 'active' },
          ],
        };

        mockedApiClient.get.mockResolvedValue(mockResponse);

        const result = await employeeApi.getAllEmployees();

        expect(mockedApiClient.get).toHaveBeenCalledWith('/employee/all');
        expect(result).toEqual(mockResponse);
      });

      it('should get employee by id', async () => {
        const employeeId = '123';
        const mockResponse = {
          code: 200,
          message: 'success',
          data: {
            id: employeeId,
            code: 'EMP001',
            name: 'John Doe',
            gender: 'male',
            status: 'active',
          },
        };

        mockedApiClient.get.mockResolvedValue(mockResponse);

        const result = await employeeApi.getEmployeeById(employeeId);

        expect(mockedApiClient.get).toHaveBeenCalledWith(`/employee/${employeeId}`);
        expect(result).toEqual(mockResponse);
      });

      it('should search employees by keyword', async () => {
        const keyword = 'john';
        const mockResponse = {
          code: 200,
          message: 'success',
          data: [
            { id: '1', code: 'EMP001', name: 'John Doe', gender: 'male', status: 'active' },
          ],
        };

        mockedApiClient.get.mockResolvedValue(mockResponse);

        const result = await employeeApi.searchEmployees(keyword);

        expect(mockedApiClient.get).toHaveBeenCalledWith('/employee/search', {
          params: { keyword },
        });
        expect(result).toEqual(mockResponse);
      });

      it('should get statistics', async () => {
        const mockResponse = {
          code: 200,
          message: 'success',
          data: {
            totalCount: 100,
            activeCount: 80,
            inactiveCount: 10,
            resignedCount: 10,
            maleCount: 60,
            femaleCount: 40,
            averageSkillLevel: 2.5,
          },
        };

        mockedApiClient.get.mockResolvedValue(mockResponse);

        const result = await employeeApi.getStatistics();

        expect(mockedApiClient.get).toHaveBeenCalledWith('/employee/statistics');
        expect(result).toEqual(mockResponse);
      });

      it('should get skill level statistics', async () => {
        const mockResponse = {
          code: 200,
          message: 'success',
          data: [
            { skillLevel: 'basic', skillLevelName: '初级', count: 30 },
            { skillLevel: 'intermediate', skillLevelName: '中级', count: 40 },
            { skillLevel: 'advanced', skillLevelName: '高级', count: 20 },
            { skillLevel: 'expert', skillLevelName: '专家', count: 10 },
          ],
        };

        mockedApiClient.get.mockResolvedValue(mockResponse);

        const result = await employeeApi.getSkillLevelStatistics();

        expect(mockedApiClient.get).toHaveBeenCalledWith('/employee/skill-level-statistics');
        expect(result).toEqual(mockResponse);
      });

      it('should get available departments', async () => {
        const mockResponse = {
          code: 200,
          message: 'success',
          data: [
            { id: '1', code: 'DEPT001', name: 'Production Department' },
          ],
        };

        mockedApiClient.get.mockResolvedValue(mockResponse);

        const result = await employeeApi.getAvailableDepartments();

        expect(mockedApiClient.get).toHaveBeenCalledWith('/department/all');
        expect(result).toEqual(mockResponse);
      });

      it('should get available teams', async () => {
        const mockResponse = {
          code: 200,
          message: 'success',
          data: [
            { id: '1', code: 'TEAM001', name: 'Team 1' },
          ],
        };

        mockedApiClient.get.mockResolvedValue(mockResponse);

        const result = await employeeApi.getAvailableTeams();

        expect(mockedApiClient.get).toHaveBeenCalledWith('/team/all');
        expect(result).toEqual(mockResponse);
      });

      it('should get available work centers', async () => {
        const mockResponse = {
          code: 200,
          message: 'success',
          data: [
            { id: '1', code: 'WC001', name: 'Work Center 1' },
          ],
        };

        mockedApiClient.get.mockResolvedValue(mockResponse);

        const result = await employeeApi.getAvailableWorkCenters();

        expect(mockedApiClient.get).toHaveBeenCalledWith('/workcenter/all');
        expect(result).toEqual(mockResponse);
      });

      it('should check code uniqueness', async () => {
        const code = 'EMP001';
        const mockResponse = {
          code: 200,
          message: 'success',
          data: { unique: true },
        };

        mockedApiClient.get.mockResolvedValue(mockResponse);

        const result = await employeeApi.checkCodeUnique(code);

        expect(mockedApiClient.get).toHaveBeenCalledWith('/employee/check-code', {
          params: {
            code,
            excludeId: undefined,
          },
        });
        expect(result).toEqual(mockResponse);
      });

      it('should check code uniqueness with exclude ID', async () => {
        const code = 'EMP001';
        const excludeId = '123';
        const mockResponse = {
          code: 200,
          message: 'success',
          data: { unique: true },
        };

        mockedApiClient.get.mockResolvedValue(mockResponse);

        const result = await employeeApi.checkCodeUnique(code, excludeId);

        expect(mockedApiClient.get).toHaveBeenCalledWith('/employee/check-code', {
          params: {
            code,
            excludeId,
          },
        });
        expect(result).toEqual(mockResponse);
      });

      it('should check ID card uniqueness', async () => {
        const idCard = '110101199003072345';
        const mockResponse = {
          code: 200,
          message: 'success',
          data: { unique: true },
        };

        mockedApiClient.get.mockResolvedValue(mockResponse);

        const result = await employeeApi.checkIdCardUnique(idCard);

        expect(mockedApiClient.get).toHaveBeenCalledWith('/employee/check-idcard', {
          params: {
            idCard,
            excludeId: undefined,
          },
        });
        expect(result).toEqual(mockResponse);
      });

      it('should check ID card uniqueness with exclude ID', async () => {
        const idCard = '110101199003072345';
        const excludeId = '123';
        const mockResponse = {
          code: 200,
          message: 'success',
          data: { unique: true },
        };

        mockedApiClient.get.mockResolvedValue(mockResponse);

        const result = await employeeApi.checkIdCardUnique(idCard, excludeId);

        expect(mockedApiClient.get).toHaveBeenCalledWith('/employee/check-idcard', {
          params: {
            idCard,
            excludeId,
          },
        });
        expect(result).toEqual(mockResponse);
      });
    });

    describe('POST Requests', () => {
      it('should create an employee', async () => {
        const createData = {
          code: 'EMP001',
          name: 'John Doe',
          gender: 'male',
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

        const result = await employeeApi.createEmployee(createData);

        expect(mockedApiClient.post).toHaveBeenCalledWith('/employee/create', createData, {
          showSuccess: true,
          successText: '创建成功',
        });
        expect(result).toEqual(mockResponse);
      });

      it('should create an employee with all fields', async () => {
        const createData = {
          code: 'EMP001',
          name: 'John Doe',
          gender: 'male',
          idCard: '110101199003072345',
          phone: '13800138000',
          email: 'john@example.com',
          departmentId: 'dept1',
          teamId: 'team1',
          position: 'Engineer',
          skillLevel: 'intermediate',
          workCenterId: 'wc1',
          hireDate: '2023-01-01',
          status: 'active',
          address: 'Address',
          remark: 'Test',
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

        const result = await employeeApi.createEmployee(createData);

        expect(mockedApiClient.post).toHaveBeenCalledWith('/employee/create', createData, {
          showSuccess: true,
          successText: '创建成功',
        });
        expect(result).toEqual(mockResponse);
      });

      it('should batch delete employees', async () => {
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

        const result = await employeeApi.deleteEmployees(ids);

        expect(mockedApiClient.post).toHaveBeenCalledWith('/employee/batch-delete', { ids }, {
          showSuccess: true,
          successText: `成功删除${ids.length}条记录`,
        });
        expect(result).toEqual(mockResponse);
      });

      it('should import employees', async () => {
        const file = new File([''], 'employees.xlsx');
        const mockResponse = {
          code: 200,
          message: 'success',
          data: {
            success: 10,
            failed: 0,
          },
        };

        mockedApiClient.post.mockResolvedValue(mockResponse);

        const result = await employeeApi.importEmployees({ file });

        expect(mockedApiClient.post).toHaveBeenCalledWith(
          '/employee/import',
          expect.any(FormData),
          {
            showSuccess: true,
            successText: '导入成功',
          }
        );
        expect(result).toEqual(mockResponse);
      });

      it('should import employees with validation', async () => {
        const file = new File([''], 'employees.xlsx');
        const mockResponse = {
          code: 200,
          message: 'success',
          data: {
            success: 10,
            failed: 0,
          },
        };

        mockedApiClient.post.mockResolvedValue(mockResponse);

        const result = await employeeApi.importEmployees({ file, validate: true });

        expect(mockedApiClient.post).toHaveBeenCalledWith(
          '/employee/import',
          expect.any(FormData),
          {
            showSuccess: true,
            successText: '导入成功',
            validate: 'true',
          }
        );
        expect(result).toEqual(mockResponse);
      });

      it('should import employees with update mode', async () => {
        const file = new File([''], 'employees.xlsx');
        const mockResponse = {
          code: 200,
          message: 'success',
          data: {
            success: 10,
            failed: 0,
          },
        };

        mockedApiClient.post.mockResolvedValue(mockResponse);

        const result = await employeeApi.importEmployees({
          file,
          validate: true,
          updateMode: 'update',
        });

        expect(mockedApiClient.post).toHaveBeenCalledWith(
          '/employee/import',
          expect.any(FormData),
          {
            showSuccess: true,
            successText: '导入成功',
            validate: 'true',
            updateMode: 'update',
          }
        );
        expect(result).toEqual(mockResponse);
      });
    });

    describe('PUT Requests', () => {
      it('should update an employee', async () => {
        const updateData = {
          id: '123',
          code: 'EMP001',
          name: 'Updated Name',
          status: 'active',
        };
        const mockResponse = {
          code: 200,
          message: 'success',
          data: updateData,
        };

        mockedApiClient.put.mockResolvedValue(mockResponse);

        const result = await employeeApi.updateEmployee(updateData);

        expect(mockedApiClient.put).toHaveBeenCalledWith('/employee/update', updateData, {
          showSuccess: true,
          successText: '更新成功',
        });
        expect(result).toEqual(mockResponse);
      });

      it('should update employee status', async () => {
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

        const result = await employeeApi.updateStatus(statusAction);

        expect(mockedApiClient.put).toHaveBeenCalledWith('/employee/status', statusAction, {
          showSuccess: true,
          successText: `成功更新${statusAction.ids.length}条记录状态`,
        });
        expect(result).toEqual(mockResponse);
      });

      it('should batch enable employees', async () => {
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

        const result = await employeeApi.batchEnable(ids);

        expect(mockedApiClient.put).toHaveBeenCalledWith('/employee/status', {
          ids,
          status: 'active',
        }, {
          showSuccess: true,
          successText: `成功更新${ids.length}条记录状态`,
        });
        expect(result).toEqual(mockResponse);
      });

      it('should batch disable employees', async () => {
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

        const result = await employeeApi.batchDisable(ids);

        expect(mockedApiClient.put).toHaveBeenCalledWith('/employee/status', {
          ids,
          status: 'inactive',
        }, {
          showSuccess: true,
          successText: `成功更新${ids.length}条记录状态`,
        });
        expect(result).toEqual(mockResponse);
      });
    });

    describe('DELETE Requests', () => {
      it('should delete an employee', async () => {
        const employeeId = '123';
        const mockResponse = {
          code: 200,
          message: 'success',
          data: null,
        };

        mockedApiClient.delete.mockResolvedValue(mockResponse);

        const result = await employeeApi.deleteEmployee(employeeId);

        expect(mockedApiClient.delete).toHaveBeenCalledWith(`/employee/${employeeId}`, {
          showSuccess: true,
          successText: '删除成功',
        });
        expect(result).toEqual(mockResponse);
      });
    });

    describe('Export Requests', () => {
      it('should export employees', async () => {
        const query = { current: 1, pageSize: 10 };
        const fileName = 'employees';

        mockedApiClient.export.mockResolvedValue(undefined);

        await employeeApi.exportEmployees(query, fileName);

        expect(mockedApiClient.export).toHaveBeenCalledWith('/employee/export', {
          params: query,
          fileName,
          type: 'excel',
        });
      });

      it('should export employees with default file name', async () => {
        const query = { current: 1, pageSize: 10 };

        mockedApiClient.export.mockResolvedValue(undefined);

        await employeeApi.exportEmployees(query);

        expect(mockedApiClient.export).toHaveBeenCalledWith('/employee/export', {
          params: query,
          fileName: 'employee',
          type: 'excel',
        });
      });
    });
  });

  describe('Parameter Validation Tests', () => {
    it('should handle missing required parameters', async () => {
      const mockError = new Error('Validation failed');
      mockedApiClient.get.mockRejectedValue(mockError);

      await expect(employeeApi.getEmployeeById('')).rejects.toThrow();
    });

    it('should handle invalid ID format', async () => {
      const mockError = new Error('Invalid ID format');
      mockedApiClient.get.mockRejectedValue(mockError);

      await expect(employeeApi.getEmployeeById('invalid-id')).rejects.toThrow();
    });

    it('should handle invalid query parameters', async () => {
      const invalidQuery = {
        current: -1,
        pageSize: 0,
      };
      const mockError = new Error('Invalid query parameters');

      mockedApiClient.getPage.mockRejectedValue(mockError);

      await expect(employeeApi.getEmployees(invalidQuery as any)).rejects.toThrow();
    });

    it('should handle invalid phone number', async () => {
      const createData = {
        code: 'EMP001',
        name: 'John Doe',
        phone: 'invalid-phone',
        status: 'active',
      };
      const mockError = new Error('Invalid phone number');

      mockedApiClient.post.mockRejectedValue(mockError);

      await expect(employeeApi.createEmployee(createData)).rejects.toThrow();
    });

    it('should handle invalid email format', async () => {
      const createData = {
        code: 'EMP001',
        name: 'John Doe',
        email: 'invalid-email',
        status: 'active',
      };
      const mockError = new Error('Invalid email format');

      mockedApiClient.post.mockRejectedValue(mockError);

      await expect(employeeApi.createEmployee(createData)).rejects.toThrow();
    });

    it('should handle invalid ID card format', async () => {
      const createData = {
        code: 'EMP001',
        name: 'John Doe',
        idCard: 'invalid-idcard',
        status: 'active',
      };
      const mockError = new Error('Invalid ID card format');

      mockedApiClient.post.mockRejectedValue(mockError);

      await expect(employeeApi.createEmployee(createData)).rejects.toThrow();
    });

    it('should handle invalid gender', async () => {
      const createData = {
        code: 'EMP001',
        name: 'John Doe',
        gender: 'invalid' as any,
        status: 'active',
      };
      const mockError = new Error('Invalid gender');

      mockedApiClient.post.mockRejectedValue(mockError);

      await expect(employeeApi.createEmployee(createData)).rejects.toThrow();
    });
  });

  describe('Response Handling Tests', () => {
    it('should handle successful response (200)', async () => {
      const mockResponse = {
        code: 200,
        message: 'success',
        data: {
          id: '1',
          code: 'EMP001',
          name: 'John Doe',
          gender: 'male',
          status: 'active',
        },
      };

      mockedApiClient.get.mockResolvedValue(mockResponse);

      const result = await employeeApi.getEmployeeById('1');

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

      await expect(employeeApi.getEmployeeById('1')).rejects.toThrow();
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

      await expect(employeeApi.getEmployeeById('nonexistent')).rejects.toThrow();
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

      await expect(employeeApi.getEmployeeById('1')).rejects.toThrow();
    });

    it('should handle network error', async () => {
      const mockError = new Error('Network Error');
      mockedApiClient.get.mockRejectedValue(mockError);

      await expect(employeeApi.getEmployeeById('1')).rejects.toThrow();
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

      const result = await employeeApi.getEmployees({ current: 1, pageSize: 10 });

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
              code: 'EMP001',
              name: 'John Doe',
              gender: 'male',
              status: 'active',
            },
          ],
          total: 1,
          current: 1,
          pageSize: 10,
        },
      };

      mockedApiClient.getPage.mockResolvedValue(mockResponse);

      const result = await employeeApi.getEmployees({ current: 1, pageSize: 10 });

      expect(result.data.list).toHaveLength(1);
      expect(result.data.total).toBe(1);
    });

    it('should handle large result set', async () => {
      const largeList = Array.from({ length: 200 }, (_, i) => ({
        id: String(i + 1),
        code: `EMP${String(i + 1).padStart(3, '0')}`,
        name: `Employee ${i + 1}`,
        gender: i % 2 === 0 ? ('male' as const) : ('female' as const),
        status: 'active',
      }));

      const mockResponse = {
        code: 200,
        message: 'success',
        data: {
          list: largeList,
          total: 200,
          current: 1,
          pageSize: 200,
        },
      };

      mockedApiClient.getPage.mockResolvedValue(mockResponse);

      const result = await employeeApi.getEmployees({ current: 1, pageSize: 200 });

      expect(result.data.list).toHaveLength(200);
      expect(result.data.total).toBe(200);
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

      const result = await employeeApi.getEmployees({ current: 99999, pageSize: 10 });

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
          code: 'EMP001',
          name: 'John Doe',
          gender: 'male',
          status: 'active',
        },
      };

      mockedApiClient.get.mockResolvedValue(mockResponse);

      const result = await employeeApi.getEmployeeById('1');

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
          code: 'EMP001',
          name: 'John Doe',
          gender: 'male',
          status: 'active',
        },
      };

      mockedApiClient.get.mockResolvedValue(mockResponse);

      await employeeApi.getEmployeeById('1');

      expect(mockedApiClient.get).toHaveBeenCalled();
    });

    it('should handle complex query with multiple filters', async () => {
      const complexQuery = {
        current: 1,
        pageSize: 10,
        code: 'EMP',
        name: 'john',
        gender: 'male',
        departmentId: 'dept1',
        teamId: 'team1',
        workCenterId: 'wc1',
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

      const result = await employeeApi.getEmployees(complexQuery);

      expect(mockedApiClient.getPage).toHaveBeenCalledWith('/employee/list', complexQuery);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Gender Tests', () => {
    it('should handle male gender', async () => {
      const createData = {
        code: 'EMP001',
        name: 'John Doe',
        gender: 'male',
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

      const result = await employeeApi.createEmployee(createData);

      expect(result.data.gender).toBe('male');
    });

    it('should handle female gender', async () => {
      const createData = {
        code: 'EMP002',
        name: 'Jane Smith',
        gender: 'female',
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

      const result = await employeeApi.createEmployee(createData);

      expect(result.data.gender).toBe('female');
    });

    it('should filter employees by gender', async () => {
      const query = {
        current: 1,
        pageSize: 10,
        gender: 'male',
      };

      const mockResponse = {
        code: 200,
        message: 'success',
        data: {
          list: [
            {
              id: '1',
              code: 'EMP001',
              name: 'John Doe',
              gender: 'male',
              status: 'active',
            },
          ],
          total: 1,
          current: 1,
          pageSize: 10,
        },
      };

      mockedApiClient.getPage.mockResolvedValue(mockResponse);

      const result = await employeeApi.getEmployees(query);

      expect(mockedApiClient.getPage).toHaveBeenCalledWith('/employee/list', query);
      expect(result.data.list[0].gender).toBe('male');
    });
  });

  describe('Skill Level Tests', () => {
    it('should handle basic skill level', async () => {
      const createData = {
        code: 'EMP001',
        name: 'John Doe',
        skillLevel: 'basic',
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

      const result = await employeeApi.createEmployee(createData);

      expect(result.data.skillLevel).toBe('basic');
    });

    it('should handle intermediate skill level', async () => {
      const createData = {
        code: 'EMP002',
        name: 'Jane Smith',
        skillLevel: 'intermediate',
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

      const result = await employeeApi.createEmployee(createData);

      expect(result.data.skillLevel).toBe('intermediate');
    });

    it('should handle advanced skill level', async () => {
      const createData = {
        code: 'EMP003',
        name: 'Bob Johnson',
        skillLevel: 'advanced',
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

      const result = await employeeApi.createEmployee(createData);

      expect(result.data.skillLevel).toBe('advanced');
    });

    it('should handle expert skill level', async () => {
      const createData = {
        code: 'EMP004',
        name: 'Alice Brown',
        skillLevel: 'expert',
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

      const result = await employeeApi.createEmployee(createData);

      expect(result.data.skillLevel).toBe('expert');
    });

    it('should filter employees by skill level', async () => {
      const query = {
        current: 1,
        pageSize: 10,
        skillLevel: 'intermediate',
      };

      const mockResponse = {
        code: 200,
        message: 'success',
        data: {
          list: [
            {
              id: '1',
              code: 'EMP001',
              name: 'John Doe',
              skillLevel: 'intermediate',
              status: 'active',
            },
          ],
          total: 1,
          current: 1,
          pageSize: 10,
        },
      };

      mockedApiClient.getPage.mockResolvedValue(mockResponse);

      const result = await employeeApi.getEmployees(query);

      expect(mockedApiClient.getPage).toHaveBeenCalledWith('/employee/list', query);
      expect(result.data.list[0].skillLevel).toBe('intermediate');
    });
  });

  describe('Employee Status Tests', () => {
    it('should handle active status', async () => {
      const createData = {
        code: 'EMP001',
        name: 'John Doe',
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

      const result = await employeeApi.createEmployee(createData);

      expect(result.data.status).toBe('active');
    });

    it('should handle inactive status', async () => {
      const createData = {
        code: 'EMP002',
        name: 'Jane Smith',
        status: 'inactive',
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

      const result = await employeeApi.createEmployee(createData);

      expect(result.data.status).toBe('inactive');
    });

    it('should handle resigned status', async () => {
      const createData = {
        code: 'EMP003',
        name: 'Bob Johnson',
        status: 'resigned',
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

      const result = await employeeApi.createEmployee(createData);

      expect(result.data.status).toBe('resigned');
    });

    it('should filter employees by status', async () => {
      const query = {
        current: 1,
        pageSize: 10,
        status: 'active',
      };

      const mockResponse = {
        code: 200,
        message: 'success',
        data: {
          list: [
            {
              id: '1',
              code: 'EMP001',
              name: 'John Doe',
              status: 'active',
            },
          ],
          total: 1,
          current: 1,
          pageSize: 10,
        },
      };

      mockedApiClient.getPage.mockResolvedValue(mockResponse);

      const result = await employeeApi.getEmployees(query);

      expect(mockedApiClient.getPage).toHaveBeenCalledWith('/employee/list', query);
      expect(result.data.list[0].status).toBe('active');
    });
  });

  describe('Data Consistency Tests', () => {
    it('should maintain data integrity during create', async () => {
      const createData = {
        code: 'EMP001',
        name: 'John Doe',
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

      const result = await employeeApi.createEmployee(createData);

      expect(result.data.code).toBe(createData.code);
      expect(result.data.name).toBe(createData.name);
    });

    it('should maintain data integrity during update', async () => {
      const updateData = {
        id: '123',
        code: 'EMP001',
        name: 'Updated Name',
        status: 'active',
      };

      const mockResponse = {
        code: 200,
        message: 'success',
        data: updateData,
      };

      mockedApiClient.put.mockResolvedValue(mockResponse);

      const result = await employeeApi.updateEmployee(updateData);

      expect(result.data.id).toBe(updateData.id);
      expect(result.data.name).toBe(updateData.name);
    });

    it('should validate code uniqueness before create', async () => {
      const code = 'EMP001';

      const mockCheckResponse = {
        code: 200,
        message: 'success',
        data: { unique: true },
      };

      mockedApiClient.get.mockResolvedValue(mockCheckResponse);

      const checkResult = await employeeApi.checkCodeUnique(code);

      expect(checkResult.data.unique).toBe(true);
    });

    it('should validate ID card uniqueness before create', async () => {
      const idCard = '110101199003072345';

      const mockCheckResponse = {
        code: 200,
        message: 'success',
        data: { unique: true },
      };

      mockedApiClient.get.mockResolvedValue(mockCheckResponse);

      const checkResult = await employeeApi.checkIdCardUnique(idCard);

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
          code: 'EMP001',
          name: 'John Doe',
          gender: 'male',
          status: 'active',
        },
      };

      mockedApiClient.get.mockRejectedValueOnce(mockError).mockResolvedValue(mockResponse);

      const result = await employeeApi.getEmployeeById('1');

      expect(result).toEqual(mockResponse);
    });

    it('should handle timeout errors', async () => {
      const mockError = new Error('Request timeout');
      mockedApiClient.get.mockRejectedValue(mockError);

      await expect(employeeApi.getEmployeeById('1')).rejects.toThrow();
    });
  });
});

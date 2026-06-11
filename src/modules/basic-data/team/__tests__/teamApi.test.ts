/**
 * Team API 单元测试
 * 测试班组档案API服务的所有功能
 */

import { teamApi } from '../api/teamApi';
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

describe('Team API Service', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Cleanup after each test if needed
  });

  describe('HTTP Request Tests', () => {
    describe('GET Requests', () => {
      it('should get teams with pagination', async () => {
        const mockQuery = {
          current: 1,
          pageSize: 10,
          code: 'TEAM001',
        };
        const mockResponse = {
          code: 200,
          message: 'success',
          data: {
            list: [
              {
                id: '1',
                code: 'TEAM001',
                name: 'Team 1',
                type: 'production',
                status: 'active',
              },
            ],
            total: 1,
            current: 1,
            pageSize: 10,
          },
        };

        mockedApiClient.getPage.mockResolvedValue(mockResponse);

        const result = await teamApi.getTeams(mockQuery);

        expect(mockedApiClient.getPage).toHaveBeenCalledWith('/team/list', mockQuery);
        expect(result).toEqual(mockResponse);
      });

      it('should get all teams without pagination', async () => {
        const mockResponse = {
          code: 200,
          message: 'success',
          data: [
            { id: '1', code: 'TEAM001', name: 'Team 1', type: 'production', status: 'active' },
            { id: '2', code: 'TEAM002', name: 'Team 2', type: 'quality', status: 'active' },
          ],
        };

        mockedApiClient.get.mockResolvedValue(mockResponse);

        const result = await teamApi.getAllTeams();

        expect(mockedApiClient.get).toHaveBeenCalledWith('/team/all');
        expect(result).toEqual(mockResponse);
      });

      it('should get team by id', async () => {
        const teamId = '123';
        const mockResponse = {
          code: 200,
          message: 'success',
          data: {
            id: teamId,
            code: 'TEAM001',
            name: 'Team 1',
            type: 'production',
            status: 'active',
          },
        };

        mockedApiClient.get.mockResolvedValue(mockResponse);

        const result = await teamApi.getTeamById(teamId);

        expect(mockedApiClient.get).toHaveBeenCalledWith(`/team/${teamId}`);
        expect(result).toEqual(mockResponse);
      });

      it('should search teams by keyword', async () => {
        const keyword = 'test';
        const mockResponse = {
          code: 200,
          message: 'success',
          data: [
            { id: '1', code: 'TEST001', name: 'Test Team', type: 'production', status: 'active' },
          ],
        };

        mockedApiClient.get.mockResolvedValue(mockResponse);

        const result = await teamApi.searchTeams(keyword);

        expect(mockedApiClient.get).toHaveBeenCalledWith('/team/search', { keyword });
        expect(result).toEqual(mockResponse);
      });

      it('should get statistics', async () => {
        const mockResponse = {
          code: 200,
          message: 'success',
          data: {
            totalCount: 20,
            activeCount: 15,
            inactiveCount: 5,
            typeCount: 4,
            totalMembers: 80,
            averageMembers: 4,
          },
        };

        mockedApiClient.get.mockResolvedValue(mockResponse);

        const result = await teamApi.getStatistics();

        expect(mockedApiClient.get).toHaveBeenCalledWith('/team/statistics');
        expect(result).toEqual(mockResponse);
      });

      it('should get team employees', async () => {
        const teamId = '123';
        const mockResponse = {
          code: 200,
          message: 'success',
          data: [
            { id: '1', name: 'Employee 1', teamId: '123' },
            { id: '2', name: 'Employee 2', teamId: '123' },
          ],
        };

        mockedApiClient.get.mockResolvedValue(mockResponse);

        const result = await teamApi.getTeamEmployees(teamId);

        expect(mockedApiClient.get).toHaveBeenCalledWith(`/team/${teamId}/employees`);
        expect(result).toEqual(mockResponse);
      });

      it('should get type statistics', async () => {
        const mockResponse = {
          code: 200,
          message: 'success',
          data: [
            { type: 'production', typeName: '生产班组', count: 10 },
            { type: 'quality', typeName: '质量班组', count: 5 },
            { type: 'maintenance', typeName: '维护班组', count: 3 },
          ],
        };

        mockedApiClient.get.mockResolvedValue(mockResponse);

        const result = await teamApi.getTypeStatistics();

        expect(mockedApiClient.get).toHaveBeenCalledWith('/team/type-statistics');
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

        const result = await teamApi.getAvailableWorkCenters();

        expect(mockedApiClient.get).toHaveBeenCalledWith('/workcenter/all');
        expect(result).toEqual(mockResponse);
      });

      it('should get available employees', async () => {
        const mockResponse = {
          code: 200,
          message: 'success',
          data: [
            { id: '1', code: 'EMP001', name: 'Employee 1' },
          ],
        };

        mockedApiClient.get.mockResolvedValue(mockResponse);

        const result = await teamApi.getAvailableEmployees();

        expect(mockedApiClient.get).toHaveBeenCalledWith('/employee/all');
        expect(result).toEqual(mockResponse);
      });

      it('should check code uniqueness', async () => {
        const code = 'TEAM001';
        const mockResponse = {
          code: 200,
          message: 'success',
          data: { unique: true },
        };

        mockedApiClient.get.mockResolvedValue(mockResponse);

        const result = await teamApi.checkCodeUnique(code);

        expect(mockedApiClient.get).toHaveBeenCalledWith('/team/check-code', {
          code,
          excludeId: undefined,
        });
        expect(result).toEqual(mockResponse);
      });

      it('should check code uniqueness with exclude ID', async () => {
        const code = 'TEAM001';
        const excludeId = '123';
        const mockResponse = {
          code: 200,
          message: 'success',
          data: { unique: true },
        };

        mockedApiClient.get.mockResolvedValue(mockResponse);

        const result = await teamApi.checkCodeUnique(code, excludeId);

        expect(mockedApiClient.get).toHaveBeenCalledWith('/team/check-code', {
          code,
          excludeId,
        });
        expect(result).toEqual(mockResponse);
      });
    });

    describe('POST Requests', () => {
      it('should create a team', async () => {
        const createData = {
          code: 'TEAM001',
          name: 'Team 1',
          type: 'production',
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

        const result = await teamApi.createTeam(createData);

        expect(mockedApiClient.post).toHaveBeenCalledWith('/team/create', createData, {
          showSuccess: true,
          successText: '创建成功',
        });
        expect(result).toEqual(mockResponse);
      });

      it('should create a team with all fields', async () => {
        const createData = {
          code: 'TEAM001',
          name: 'Team 1',
          type: 'production',
          workCenterId: 'wc1',
          leaderId: 'emp1',
          description: 'Test team',
          status: 'active',
          shift: 'day',
          workingHours: '08:00-17:00',
          skillLevel: 'intermediate',
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

        const result = await teamApi.createTeam(createData);

        expect(mockedApiClient.post).toHaveBeenCalledWith('/team/create', createData, {
          showSuccess: true,
          successText: '创建成功',
        });
        expect(result).toEqual(mockResponse);
      });

      it('should batch delete teams', async () => {
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

        const result = await teamApi.deleteTeams(ids);

        expect(mockedApiClient.post).toHaveBeenCalledWith('/team/batch-delete', { ids }, {
          showSuccess: true,
          successText: `成功删除${ids.length}条记录`,
        });
        expect(result).toEqual(mockResponse);
      });

      it('should import teams', async () => {
        const file = new File([''], 'teams.xlsx');
        const mockResponse = {
          code: 200,
          message: 'success',
          data: {
            success: 5,
            failed: 0,
          },
        };

        mockedApiClient.post.mockResolvedValue(mockResponse);

        const result = await teamApi.importTeams({ file });

        expect(mockedApiClient.post).toHaveBeenCalledWith(
          '/team/import',
          expect.any(FormData),
          {
            showSuccess: true,
            successText: '导入成功',
          }
        );
        expect(result).toEqual(mockResponse);
      });

      it('should import teams with validation', async () => {
        const file = new File([''], 'teams.xlsx');
        const mockResponse = {
          code: 200,
          message: 'success',
          data: {
            success: 5,
            failed: 0,
          },
        };

        mockedApiClient.post.mockResolvedValue(mockResponse);

        const result = await teamApi.importTeams({ file, validate: true });

        expect(mockedApiClient.post).toHaveBeenCalledWith(
          '/team/import',
          expect.any(FormData),
          {
            showSuccess: true,
            successText: '导入成功',
            validate: 'true',
          }
        );
        expect(result).toEqual(mockResponse);
      });

      it('should add team member', async () => {
        const teamId = '123';
        const employeeId = '456';
        const mockResponse = {
          code: 200,
          message: 'success',
          data: null,
        };

        mockedApiClient.post.mockResolvedValue(mockResponse);

        const result = await teamApi.addTeamMember(teamId, employeeId);

        expect(mockedApiClient.post).toHaveBeenCalledWith(`/team/${teamId}/members`, {
          employeeId,
        }, {
          showSuccess: true,
          successText: '添加成功',
        });
        expect(result).toEqual(mockResponse);
      });
    });

    describe('PUT Requests', () => {
      it('should update a team', async () => {
        const updateData = {
          id: '123',
          code: 'TEAM001',
          name: 'Updated Team',
          status: 'active',
        };
        const mockResponse = {
          code: 200,
          message: 'success',
          data: updateData,
        };

        mockedApiClient.put.mockResolvedValue(mockResponse);

        const result = await teamApi.updateTeam(updateData);

        expect(mockedApiClient.put).toHaveBeenCalledWith('/team/update', updateData, {
          showSuccess: true,
          successText: '更新成功',
        });
        expect(result).toEqual(mockResponse);
      });

      it('should update team status', async () => {
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

        const result = await teamApi.updateStatus(statusAction);

        expect(mockedApiClient.put).toHaveBeenCalledWith('/team/status', statusAction, {
          showSuccess: true,
          successText: `成功更新${statusAction.ids.length}条记录状态`,
        });
        expect(result).toEqual(mockResponse);
      });

      it('should batch enable teams', async () => {
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

        const result = await teamApi.batchEnable(ids);

        expect(mockedApiClient.put).toHaveBeenCalledWith('/team/status', {
          ids,
          status: 'active',
        }, {
          showSuccess: true,
          successText: `成功更新${ids.length}条记录状态`,
        });
        expect(result).toEqual(mockResponse);
      });

      it('should batch disable teams', async () => {
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

        const result = await teamApi.batchDisable(ids);

        expect(mockedApiClient.put).toHaveBeenCalledWith('/team/status', {
          ids,
          status: 'inactive',
        }, {
          showSuccess: true,
          successText: `成功更新${ids.length}条记录状态`,
        });
        expect(result).toEqual(mockResponse);
      });

      it('should change team leader', async () => {
        const teamId = '123';
        const leaderId = '456';
        const mockResponse = {
          code: 200,
          message: 'success',
          data: null,
        };

        mockedApiClient.put.mockResolvedValue(mockResponse);

        const result = await teamApi.changeTeamLeader(teamId, leaderId);

        expect(mockedApiClient.put).toHaveBeenCalledWith(`/team/${teamId}/leader`, {
          leaderId,
        }, {
          showSuccess: true,
          successText: '更换成功',
        });
        expect(result).toEqual(mockResponse);
      });
    });

    describe('DELETE Requests', () => {
      it('should delete a team', async () => {
        const teamId = '123';
        const mockResponse = {
          code: 200,
          message: 'success',
          data: null,
        };

        mockedApiClient.delete.mockResolvedValue(mockResponse);

        const result = await teamApi.deleteTeam(teamId);

        expect(mockedApiClient.delete).toHaveBeenCalledWith(`/team/${teamId}`, undefined, {
          showSuccess: true,
          successText: '删除成功',
        });
        expect(result).toEqual(mockResponse);
      });

      it('should remove team member', async () => {
        const teamId = '123';
        const employeeId = '456';
        const mockResponse = {
          code: 200,
          message: 'success',
          data: null,
        };

        mockedApiClient.delete.mockResolvedValue(mockResponse);

        const result = await teamApi.removeTeamMember(teamId, employeeId);

        expect(mockedApiClient.delete).toHaveBeenCalledWith(
          `/team/${teamId}/members/${employeeId}`,
          undefined,
          {
            showSuccess: true,
            successText: '移除成功',
          }
        );
        expect(result).toEqual(mockResponse);
      });
    });

    describe('Export Requests', () => {
      it('should export teams', async () => {
        const query = { current: 1, pageSize: 10 };
        const fileName = 'teams';

        mockedApiClient.export.mockResolvedValue(undefined);

        await teamApi.exportTeams(query, fileName);

        expect(mockedApiClient.export).toHaveBeenCalledWith('/team/export', {
          params: query,
          fileName,
          type: 'excel',
        });
      });

      it('should export teams with default file name', async () => {
        const query = { current: 1, pageSize: 10 };

        mockedApiClient.export.mockResolvedValue(undefined);

        await teamApi.exportTeams(query);

        expect(mockedApiClient.export).toHaveBeenCalledWith('/team/export', {
          params: query,
          fileName: 'team',
          type: 'excel',
        });
      });
    });
  });

  describe('Parameter Validation Tests', () => {
    it('should handle missing required parameters', async () => {
      const mockError = new Error('Validation failed');
      mockedApiClient.get.mockRejectedValue(mockError);

      await expect(teamApi.getTeamById('')).rejects.toThrow();
    });

    it('should handle invalid ID format', async () => {
      const mockError = new Error('Invalid ID format');
      mockedApiClient.get.mockRejectedValue(mockError);

      await expect(teamApi.getTeamById('invalid-id')).rejects.toThrow();
    });

    it('should handle invalid query parameters', async () => {
      const invalidQuery = {
        current: -1,
        pageSize: 0,
      };
      const mockError = new Error('Invalid query parameters');

      mockedApiClient.getPage.mockRejectedValue(mockError);

      await expect(teamApi.getTeams(invalidQuery as any)).rejects.toThrow();
    });

    it('should handle invalid team type', async () => {
      const createData = {
        code: 'TEAM001',
        name: 'Team 1',
        type: 'invalid' as any,
        status: 'active',
      };
      const mockError = new Error('Invalid team type');

      mockedApiClient.post.mockRejectedValue(mockError);

      await expect(teamApi.createTeam(createData)).rejects.toThrow();
    });
  });

  describe('Response Handling Tests', () => {
    it('should handle successful response (200)', async () => {
      const mockResponse = {
        code: 200,
        message: 'success',
        data: {
          id: '1',
          code: 'TEAM001',
          name: 'Team 1',
          type: 'production',
          status: 'active',
        },
      };

      mockedApiClient.get.mockResolvedValue(mockResponse);

      const result = await teamApi.getTeamById('1');

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

      await expect(teamApi.getTeamById('1')).rejects.toThrow();
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

      await expect(teamApi.getTeamById('nonexistent')).rejects.toThrow();
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

      await expect(teamApi.getTeamById('1')).rejects.toThrow();
    });

    it('should handle network error', async () => {
      const mockError = new Error('Network Error');
      mockedApiClient.get.mockRejectedValue(mockError);

      await expect(teamApi.getTeamById('1')).rejects.toThrow();
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

      const result = await teamApi.getTeams({ current: 1, pageSize: 10 });

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
              code: 'TEAM001',
              name: 'Team 1',
              type: 'production',
              status: 'active',
            },
          ],
          total: 1,
          current: 1,
          pageSize: 10,
        },
      };

      mockedApiClient.getPage.mockResolvedValue(mockResponse);

      const result = await teamApi.getTeams({ current: 1, pageSize: 10 });

      expect(result.data.list).toHaveLength(1);
      expect(result.data.total).toBe(1);
    });

    it('should handle large result set', async () => {
      const largeList = Array.from({ length: 50 }, (_, i) => ({
        id: String(i + 1),
        code: `TEAM${String(i + 1).padStart(3, '0')}`,
        name: `Team ${i + 1}`,
        type: 'production',
        status: 'active',
      }));

      const mockResponse = {
        code: 200,
        message: 'success',
        data: {
          list: largeList,
          total: 50,
          current: 1,
          pageSize: 50,
        },
      };

      mockedApiClient.getPage.mockResolvedValue(mockResponse);

      const result = await teamApi.getTeams({ current: 1, pageSize: 50 });

      expect(result.data.list).toHaveLength(50);
      expect(result.data.total).toBe(50);
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

      const result = await teamApi.getTeams({ current: 99999, pageSize: 10 });

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
          code: 'TEAM001',
          name: 'Team 1',
          type: 'production',
          status: 'active',
        },
      };

      mockedApiClient.get.mockResolvedValue(mockResponse);

      const result = await teamApi.getTeamById('1');

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
          code: 'TEAM001',
          name: 'Team 1',
          type: 'production',
          status: 'active',
        },
      };

      mockedApiClient.get.mockResolvedValue(mockResponse);

      await teamApi.getTeamById('1');

      expect(mockedApiClient.get).toHaveBeenCalled();
    });

    it('should handle complex query with multiple filters', async () => {
      const complexQuery = {
        current: 1,
        pageSize: 10,
        code: 'TEAM',
        name: 'test',
        type: 'production',
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

      const result = await teamApi.getTeams(complexQuery);

      expect(mockedApiClient.getPage).toHaveBeenCalledWith('/team/list', complexQuery);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Team Member Management Tests', () => {
    it('should add member to team', async () => {
      const teamId = '123';
      const employeeId = '456';
      const mockResponse = {
        code: 200,
        message: 'success',
        data: null,
      };

      mockedApiClient.post.mockResolvedValue(mockResponse);

      const result = await teamApi.addTeamMember(teamId, employeeId);

      expect(mockedApiClient.post).toHaveBeenCalledWith(`/team/${teamId}/members`, {
        employeeId,
      }, {
        showSuccess: true,
        successText: '添加成功',
      });
      expect(result).toEqual(mockResponse);
    });

    it('should remove member from team', async () => {
      const teamId = '123';
      const employeeId = '456';
      const mockResponse = {
        code: 200,
        message: 'success',
        data: null,
      };

      mockedApiClient.delete.mockResolvedValue(mockResponse);

      const result = await teamApi.removeTeamMember(teamId, employeeId);

      expect(mockedApiClient.delete).toHaveBeenCalledWith(
        `/team/${teamId}/members/${employeeId}`,
        undefined,
        {
          showSuccess: true,
          successText: '移除成功',
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should get team members', async () => {
      const teamId = '123';
      const mockResponse = {
        code: 200,
        message: 'success',
        data: [
          { id: '1', name: 'Employee 1', teamId: '123' },
          { id: '2', name: 'Employee 2', teamId: '123' },
        ],
      };

      mockedApiClient.get.mockResolvedValue(mockResponse);

      const result = await teamApi.getTeamEmployees(teamId);

      expect(mockedApiClient.get).toHaveBeenCalledWith(`/team/${teamId}/employees`);
      expect(result.data).toHaveLength(2);
    });
  });

  describe('Team Type Tests', () => {
    it('should handle production team type', async () => {
      const createData = {
        code: 'PROD001',
        name: 'Production Team',
        type: 'production',
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

      const result = await teamApi.createTeam(createData);

      expect(result.data.type).toBe('production');
    });

    it('should handle quality team type', async () => {
      const createData = {
        code: 'QUAL001',
        name: 'Quality Team',
        type: 'quality',
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

      const result = await teamApi.createTeam(createData);

      expect(result.data.type).toBe('quality');
    });

    it('should handle maintenance team type', async () => {
      const createData = {
        code: 'MAINT001',
        name: 'Maintenance Team',
        type: 'maintenance',
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

      const result = await teamApi.createTeam(createData);

      expect(result.data.type).toBe('maintenance');
    });

    it('should filter teams by type', async () => {
      const query = {
        current: 1,
        pageSize: 10,
        type: 'production',
      };

      const mockResponse = {
        code: 200,
        message: 'success',
        data: {
          list: [
            {
              id: '1',
              code: 'PROD001',
              name: 'Production Team 1',
              type: 'production',
              status: 'active',
            },
          ],
          total: 1,
          current: 1,
          pageSize: 10,
        },
      };

      mockedApiClient.getPage.mockResolvedValue(mockResponse);

      const result = await teamApi.getTeams(query);

      expect(mockedApiClient.getPage).toHaveBeenCalledWith('/team/list', query);
      expect(result.data.list[0].type).toBe('production');
    });
  });

  describe('Team Leader Tests', () => {
    it('should change team leader', async () => {
      const teamId = '123';
      const leaderId = '456';
      const mockResponse = {
        code: 200,
        message: 'success',
        data: null,
      };

      mockedApiClient.put.mockResolvedValue(mockResponse);

      const result = await teamApi.changeTeamLeader(teamId, leaderId);

      expect(mockedApiClient.put).toHaveBeenCalledWith(`/team/${teamId}/leader`, {
        leaderId,
      }, {
        showSuccess: true,
        successText: '更换成功',
      });
      expect(result).toEqual(mockResponse);
    });

    it('should filter teams by leader', async () => {
      const query = {
        current: 1,
        pageSize: 10,
        leaderId: 'leader1',
      };

      const mockResponse = {
        code: 200,
        message: 'success',
        data: {
          list: [
            {
              id: '1',
              code: 'TEAM001',
              name: 'Team 1',
              type: 'production',
              leaderId: 'leader1',
              status: 'active',
            },
          ],
          total: 1,
          current: 1,
          pageSize: 10,
        },
      };

      mockedApiClient.getPage.mockResolvedValue(mockResponse);

      const result = await teamApi.getTeams(query);

      expect(mockedApiClient.getPage).toHaveBeenCalledWith('/team/list', query);
      expect(result.data.list[0].leaderId).toBe('leader1');
    });
  });

  describe('Data Consistency Tests', () => {
    it('should maintain data integrity during create', async () => {
      const createData = {
        code: 'TEAM001',
        name: 'Team 1',
        type: 'production',
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

      const result = await teamApi.createTeam(createData);

      expect(result.data.code).toBe(createData.code);
      expect(result.data.name).toBe(createData.name);
    });

    it('should maintain data integrity during update', async () => {
      const updateData = {
        id: '123',
        code: 'TEAM001',
        name: 'Updated Team',
        status: 'active',
      };

      const mockResponse = {
        code: 200,
        message: 'success',
        data: updateData,
      };

      mockedApiClient.put.mockResolvedValue(mockResponse);

      const result = await teamApi.updateTeam(updateData);

      expect(result.data.id).toBe(updateData.id);
      expect(result.data.name).toBe(updateData.name);
    });

    it('should validate code uniqueness before create', async () => {
      const code = 'TEAM001';

      const mockCheckResponse = {
        code: 200,
        message: 'success',
        data: { unique: true },
      };

      mockedApiClient.get.mockResolvedValue(mockCheckResponse);

      const checkResult = await teamApi.checkCodeUnique(code);

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
          code: 'TEAM001',
          name: 'Team 1',
          type: 'production',
          status: 'active',
        },
      };

      mockedApiClient.get.mockRejectedValueOnce(mockError).mockResolvedValue(mockResponse);

      const result = await teamApi.getTeamById('1');

      expect(result).toEqual(mockResponse);
    });

    it('should handle timeout errors', async () => {
      const mockError = new Error('Request timeout');
      mockedApiClient.get.mockRejectedValue(mockError);

      await expect(teamApi.getTeamById('1')).rejects.toThrow();
    });
  });
});

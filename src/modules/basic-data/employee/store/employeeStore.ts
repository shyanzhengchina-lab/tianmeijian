/**
 * 员工模块状态管理Store
 * 使用Zustand进行模块级状态管理
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Employee, EmployeeQuery, EmployeeStatusAction } from '../api/employeeApi';
import type { EmployeeStatistics } from '../types/index';
import { employeeApi } from '../api/employeeApi';

/**
 * 员工Store状态接口
 */
export interface EmployeeState {
  // 数据状态
  employees: Employee[];
  total: number;
  loading: boolean;
  error: string | null;

  // 查询状态
  query: EmployeeQuery;
  filters: Record<string, any>;

  // 选择状态
  selectedIds: string[];
  selectedEmployees: Employee[];

  // 详情状态
  currentEmployee: Employee | null;

  // 统计数据
  statistics: EmployeeStatistics | null;

  // 技能等级统计
  skillLevelStatistics: Array<{
    skillLevel: string;
    skillLevelName: string;
    count: number;
  }>;

  // UI状态
  showCreateModal: boolean;
  showEditModal: boolean;
  showDetailDrawer: boolean;

  // Actions
  setEmployees: (employees: Employee[], total: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setQuery: (query: Partial<EmployeeQuery>) => void;
  setFilters: (filters: Record<string, any>) => void;
  setSelectedIds: (ids: string[]) => void;
  clearSelection: () => void;
  loadEmployees: () => Promise<void>;
  refreshEmployees: () => Promise<void>;
  createEmployee: (data: any) => Promise<void>;
  updateEmployee: (data: any) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
  batchDeleteEmployees: (ids: string[]) => Promise<void>;
  batchEnableEmployees: (ids: string[]) => Promise<void>;
  batchDisableEmployees: (ids: string[]) => Promise<void>;
  updateEmployeeStatus: (action: EmployeeStatusAction) => Promise<void>;
  loadEmployeeById: (id: string) => Promise<Employee | null>;
  checkCodeUnique: (code: string, excludeId?: string) => Promise<boolean>;
  checkIdCardUnique: (idCard: string, excludeId?: string) => Promise<boolean>;
  getAvailableDepartments: () => Promise<any[]>;
  getAvailableTeams: () => Promise<any[]>;
  getAvailableWorkCenters: () => Promise<any[]>;
  importEmployees: (file: File, validate?: boolean, updateMode?: 'create' | 'update' | 'skip') => Promise<void>;
  exportEmployees: (query?: EmployeeQuery, fileName?: string) => Promise<void>;
  loadSkillLevelStatistics: () => Promise<void>;
  searchEmployees: (keyword: string) => Promise<Employee[]>;
  reset: () => void;
}

/**
 * 员工Store
 */
export const useEmployeeStore = create<EmployeeState>()(
  persist(
    (set, get) => ({
      // 初始状态
      employees: [],
      total: 0,
      loading: false,
      error: null,
      query: {
        current: 1,
        pageSize: 15,
      },
      filters: {},
      selectedIds: [],
      selectedEmployees: [],
      currentEmployee: null,
      statistics: null,
      skillLevelStatistics: [],
      showCreateModal: false,
      showEditModal: false,
      showDetailDrawer: false,

      /**
       * 设置员工列表数据
       */
      setEmployees: (employees: Employee[], total: number) => {
        set({ employees, total, error: null });
      },

      /**
       * 设置加载状态
       */
      setLoading: (loading: boolean) => {
        set({ loading });
      },

      /**
       * 设置错误状态
       */
      setError: (error: string | null) => {
        set({ error });
      },

      /**
       * 设置查询参数
       */
      setQuery: (query: Partial<EmployeeQuery>) => {
        set((state) => ({
          query: { ...state.query, ...query, current: 1 }, // 重置到第一页
        }));
      },

      /**
       * 设置筛选条件
       */
      setFilters: (filters: Record<string, any>) => {
        set({ filters });
      },

      /**
       * 设置选中ID列表
       */
      setSelectedIds: (ids: string[]) => {
        const { employees } = get();
        const selectedEmployees = employees.filter(e => ids.includes(e.id));
        set({ selectedIds: ids, selectedEmployees });
      },

      /**
       * 清除选择
       */
      clearSelection: () => {
        set({ selectedIds: [], selectedEmployees: [] });
      },

      /**
       * 加载员工列表
       */
      loadEmployees: async () => {
        const { query } = get();
        set({ loading: true, error: null });

        try {
          const response = await employeeApi.getEmployees(query);

          if (response.code === 200) {
            set({
              employees: response.data.list,
              total: response.data.total,
              loading: false,
            });
          } else {
            set({
              loading: false,
              error: response.message || '加载失败',
            });
          }
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '加载失败',
          });
        }
      },

      /**
       * 刷新员工列表
       */
      refreshEmployees: async () => {
        const { query } = get();
        set({ loading: true, error: null });

        try {
          const response = await employeeApi.getEmployees(query);

          if (response.code === 200) {
            set({
              employees: response.data.list,
              total: response.data.total,
              loading: false,
            });
          }
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '刷新失败',
          });
        }
      },

      /**
       * 创建员工
       */
      createEmployee: async (data: any) => {
        set({ loading: true, error: null });

        try {
          const response = await employeeApi.createEmployee(data);

          if (response.code === 200) {
            // 刷新列表
            await get().loadEmployees();
            set({ showCreateModal: false });
          } else {
            set({
              loading: false,
              error: response.message || '创建失败',
            });
          }
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '创建失败',
          });
        }
      },

      /**
       * 更新员工
       */
      updateEmployee: async (data: any) => {
        set({ loading: true, error: null });

        try {
          const response = await employeeApi.updateEmployee(data);

          if (response.code === 200) {
            // 刷新列表
            await get().loadEmployees();
            set({ showEditModal: false, currentEmployee: null });
          } else {
            set({
              loading: false,
              error: response.message || '更新失败',
            });
          }
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '更新失败',
          });
        }
      },

      /**
       * 删除员工
       */
      deleteEmployee: async (id: string) => {
        set({ loading: true, error: null });

        try {
          const response = await employeeApi.deleteEmployee(id);

          if (response.code === 200) {
            // 刷新列表
            await get().loadEmployees();
          } else {
            set({
              loading: false,
              error: response.message || '删除失败',
            });
          }
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '删除失败',
          });
        }
      },

      /**
       * 批量删除员工
       */
      batchDeleteEmployees: async (ids: string[]) => {
        set({ loading: true, error: null });

        try {
          const response = await employeeApi.deleteEmployees(ids);

          if (response.code === 200) {
            // 刷新列表
            await get().loadEmployees();
            // 清除选择
            set({ selectedIds: [], selectedEmployees: [] });
          } else {
            set({
              loading: false,
              error: response.message || '批量删除失败',
            });
          }
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '批量删除失败',
          });
        }
      },

      /**
       * 批量启用员工
       */
      batchEnableEmployees: async (ids: string[]) => {
        set({ loading: true, error: null });

        try {
          const response = await employeeApi.batchEnable(ids);

          if (response.code === 200) {
            // 刷新列表
            await get().loadEmployees();
          } else {
            set({
              loading: false,
              error: response.message || '批量启用失败',
            });
          }
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '批量启用失败',
          });
        }
      },

      /**
       * 批量禁用员工
       */
      batchDisableEmployees: async (ids: string[]) => {
        set({ loading: true, error: null });

        try {
          const response = await employeeApi.batchDisable(ids);

          if (response.code === 200) {
            // 刷新列表
            await get().loadEmployees();
          } else {
            set({
              loading: false,
              error: response.message || '批量禁用失败',
            });
          }
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '批量禁用失败',
          });
        }
      },

      /**
       * 更新员工状态
       */
      updateEmployeeStatus: async (action: EmployeeStatusAction) => {
        set({ loading: true, error: null });

        try {
          const response = await employeeApi.updateStatus(action);

          if (response.code === 200) {
            // 刷新列表
            await get().loadEmployees();
          } else {
            set({
              loading: false,
              error: response.message || '状态更新失败',
            });
          }
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '状态更新失败',
          });
        }
      },

      /**
       * 根据ID加载员工
       */
      loadEmployeeById: async (id: string): Promise<Employee | null> => {
        set({ loading: true, error: null });

        try {
          const response = await employeeApi.getEmployeeById(id);

          if (response.code === 200) {
            set({
              currentEmployee: response.data,
              loading: false,
            });
            return response.data;
          } else {
            set({
              loading: false,
              error: response.message || '加载失败',
            });
            return null;
          }
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '加载失败',
          });
          return null;
        }
      },

      /**
       * 检查员工编码唯一性
       */
      checkCodeUnique: async (code: string, excludeId?: string): Promise<boolean> => {
        try {
          const response = await employeeApi.checkCodeUnique(code, excludeId);
          return response.code === 200 && response.data.unique;
        } catch (error: any) {
          console.error('检查编码唯一性失败:', error);
          return false;
        }
      },

      /**
       * 检查身份证唯一性
       */
      checkIdCardUnique: async (idCard: string, excludeId?: string): Promise<boolean> => {
        try {
          const response = await employeeApi.checkIdCardUnique(idCard, excludeId);
          return response.code === 200 && response.data.unique;
        } catch (error: any) {
          console.error('检查身份证唯一性失败:', error);
          return false;
        }
      },

      /**
       * 获取可用部门列表
       */
      getAvailableDepartments: async (): Promise<any[]> => {
        try {
          const response = await employeeApi.getAvailableDepartments();
          return response.code === 200 ? response.data : [];
        } catch (error: any) {
          console.error('获取可用部门失败:', error);
          return [];
        }
      },

      /**
       * 获取可用班组列表
       */
      getAvailableTeams: async (): Promise<any[]> => {
        try {
          const response = await employeeApi.getAvailableTeams();
          return response.code === 200 ? response.data : [];
        } catch (error: any) {
          console.error('获取可用班组失败:', error);
          return [];
        }
      },

      /**
       * 获取可用工作中心列表
       */
      getAvailableWorkCenters: async (): Promise<any[]> => {
        try {
          const response = await employeeApi.getAvailableWorkCenters();
          return response.code === 200 ? response.data : [];
        } catch (error: any) {
          console.error('获取可用工作中心失败:', error);
          return [];
        }
      },

      /**
       * 显示创建弹窗
       */
      setShowCreateModal: (show: boolean) => {
        set({ showCreateModal: show, currentEmployee: null });
      },

      /**
       * 显示编辑弹窗
       */
      setShowEditModal: (show: boolean) => {
        set({ showEditModal: show });
      },

      /**
       * 显示详情抽屉
       */
      setShowDetailDrawer: (show: boolean) => {
        set({ showDetailDrawer: show });
      },

      /**
       * 设置当前员工
       */
      setCurrentEmployee: (employee: Employee | null) => {
        set({ currentEmployee: employee });
      },

      /**
       * 加载统计数据
       */
      loadStatistics: async () => {
        try {
          const response = await employeeApi.getStatistics();

          if (response.code === 200) {
            set({ statistics: response.data });
          }
        } catch (error: any) {
          console.error('加载统计失败:', error);
        }
      },

      /**
       * 导入员工
       */
      importEmployees: async (
        file: File,
        validate?: boolean,
        updateMode?: 'create' | 'update' | 'skip'
      ) => {
        set({ loading: true, error: null });

        try {
          const response = await employeeApi.importEmployees({
            file,
            validate,
            updateMode,
          });

          if (response.code === 200) {
            // 刷新列表
            await get().loadEmployees();
          } else {
            set({
              loading: false,
              error: response.message || '导入失败',
            });
          }
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '导入失败',
          });
        }
      },

      /**
       * 导出员工
       */
      exportEmployees: async (query?: EmployeeQuery, fileName?: string) => {
        const { query: currentQuery } = get();
        set({ loading: true });

        try {
          await employeeApi.exportEmployees(query || currentQuery, fileName);
          set({ loading: false });
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '导出失败',
          });
        }
      },

      /**
       * 加载技能等级统计
       */
      loadSkillLevelStatistics: async () => {
        try {
          const response = await employeeApi.getSkillLevelStatistics();

          if (response.code === 200) {
            set({ skillLevelStatistics: response.data });
          }
        } catch (error: any) {
          console.error('加载技能等级统计失败:', error);
        }
      },

      /**
       * 搜索员工
       */
      searchEmployees: async (keyword: string): Promise<Employee[]> => {
        try {
          const response = await employeeApi.searchEmployees(keyword);
          return response.code === 200 ? response.data : [];
        } catch (error: any) {
          console.error('搜索员工失败:', error);
          return [];
        }
      },

      /**
       * 重置状态
       */
      reset: () => {
        set({
          employees: [],
          total: 0,
          loading: false,
          error: null,
          query: {
            current: 1,
            pageSize: 15,
          },
          filters: {},
          selectedIds: [],
          selectedEmployees: [],
          currentEmployee: null,
          statistics: null,
          skillLevelStatistics: [],
          showCreateModal: false,
          showEditModal: false,
          showDetailDrawer: false,
        });
      },
    }),
    {
      name: 'employee-store',
      // 可选：配置存储选项
      // getStorage: () => localStorage,
      // setStorage: () => localStorage,
      // 持久化选定的字段
      partialize: (state) => ({
        query: state.query,
        filters: state.filters,
      }),
    }
  )
);

export default useEmployeeStore;

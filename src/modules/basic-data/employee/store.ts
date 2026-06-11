/**
 * 员工档案模块Zustand Store
 * 管理员工的本地状态和API调用
 * 保持与现有数据结构完全一致
 */
import { create } from 'zustand';
import { employeeApi } from './api';
import { DEFAULT_EMPLOYEES } from './types';
import type {
  Employee,
  EmployeeQuery,
  CreateEmployeeDTO,
  UpdateEmployeeDTO,
  EmployeeBatchAction,
} from './types';
import type { PaginationState } from '../../../shared/types/common';

interface EmployeeStore {
  // State
  employees: Employee[];
  selectedIds: string[];
  currentEmployee: Employee | null;
  filters: EmployeeQuery;
  pagination: PaginationState;
  loading: boolean;
  error: string | null;
  statistics: {
    totalCount: number;
    activeCount: number;
    leaveCount: number;
    resignedCount: number;
    roleStats: Record<string, number>;
    teamStats: Record<string, number>;
  } | null;

  // Actions
  loadEmployees: (query?: EmployeeQuery) => Promise<void>;
  loadAllEmployees: () => Promise<void>;
  loadStatistics: () => Promise<void>;
  createEmployee: (data: CreateEmployeeDTO) => Promise<void>;
  updateEmployee: (data: UpdateEmployeeDTO) => Promise<void>;
  deleteEmployees: (ids: string[]) => Promise<void>;
  batchEmployees: (action: EmployeeBatchAction) => Promise<void>;
  leaveEmployee: (id: string, leaveDate: string) => Promise<void>;
  resignEmployee: (id: string, resignDate: string) => Promise<void>;
  activateEmployee: (id: string) => Promise<void>;
  updateStatus: (ids: string[], status: 'ACTIVE' | 'LEAVE' | 'RESIGNED') => Promise<void>;
  updateSkills: (id: string, skills: string[]) => Promise<void>;
  updateCertifications: (id: string, certifications: string[]) => Promise<void>;

  // State setters
  setFilters: (filters: Partial<EmployeeQuery>) => void;
  setSelectedIds: (ids: string[]) => void;
  setCurrentEmployee: (employee: Employee | null) => void;
  setPagination: (pagination: Partial<PaginationState>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

// 创建Zustand Store
export const useEmployeeStore = create<EmployeeStore>()(
  (set, get) => ({
    // 初始状态
    employees: DEFAULT_EMPLOYEES,
    selectedIds: [],
    currentEmployee: null,
    filters: {},
    pagination: {
      current: 1,
      pageSize: 15,
      total: DEFAULT_EMPLOYEES.length,
    },
    loading: false,
    error: null,
    statistics: null,

    // Actions
    loadEmployees: async (query?: EmployeeQuery) => {
      set({ loading: true, error: null });

      try {
        const { filters: currentFilters, pagination: currentPagination } = get();
        const finalQuery: EmployeeQuery = {
          ...currentFilters,
          ...query,
          current: query?.current || currentPagination.current,
          pageSize: query?.pageSize || currentPagination.pageSize,
        };

        const result = await employeeApi.getEmployees(finalQuery);

        set({
          employees: result.list,
          pagination: {
            current: result.current ?? 1,
            pageSize: result.pageSize ?? 20,
            total: result.total ?? 0,
          },
          loading: false,
        });
      } catch (error: any) {
        set({
          error: error?.message || '加载员工列表失败',
          loading: false,
        });
        throw error;
      }
    },

    loadAllEmployees: async () => {
      try {
        const employees = await employeeApi.getAllEmployees();
        set({ employees });
      } catch (error: any) {
        console.error('加载所有员工失败:', error);
        set({ error: error?.message || '加载员工列表失败' });
      }
    },

    loadStatistics: async () => {
      try {
        const statistics = await employeeApi.getStatistics();
        set({ statistics });
      } catch (error: any) {
        console.error('加载员工统计失败:', error);
      }
    },

    createEmployee: async (data: CreateEmployeeDTO) => {
      set({ loading: true, error: null });

      try {
        const newEmployee = await employeeApi.createEmployee(data);

        set(state => ({
          employees: [newEmployee, ...state.employees],
          pagination: {
            ...state.pagination,
            total: state.pagination.total + 1,
          },
          loading: false,
        }));

        // 更新统计
        await get().loadStatistics();
      } catch (error: any) {
        set({
          error: error?.message || '创建员工失败',
          loading: false,
        });
        throw error;
      }
    },

    updateEmployee: async (data: UpdateEmployeeDTO) => {
      set({ loading: true, error: null });

      try {
        const updatedEmployee = await employeeApi.updateEmployee(data);

        set(state => ({
          employees: state.employees.map(emp =>
            emp.id === data.id ? updatedEmployee : emp
          ),
          loading: false,
        }));
      } catch (error: any) {
        set({
          error: error?.message || '更新员工失败',
          loading: false,
        });
        throw error;
      }
    },

    deleteEmployees: async (ids: string[]) => {
      set({ loading: true, error: null });

      try {
        await employeeApi.deleteEmployees(ids);

        set(state => ({
          employees: state.employees.filter(emp => !ids.includes(emp.id)),
          pagination: {
            ...state.pagination,
            total: state.pagination.total - ids.length,
          },
          selectedIds: [],
          loading: false,
        }));

        // 更新统计
        await get().loadStatistics();
      } catch (error: any) {
        set({
          error: error?.message || '删除员工失败',
          loading: false,
        });
        throw error;
      }
    },

    batchEmployees: async (action: EmployeeBatchAction) => {
      set({ loading: true, error: null });

      try {
        await employeeApi.batchEmployees(action);

        // 重新加载列表
        await get().loadEmployees();
        // 重新加载统计
        await get().loadStatistics();
      } catch (error: any) {
        set({
          error: error?.message || '批量操作失败',
          loading: false,
        });
        throw error;
      }
    },

    leaveEmployee: async (id: string, leaveDate: string) => {
      set({ loading: true, error: null });

      try {
        await employeeApi.leaveEmployee(id, leaveDate);

        set(state => ({
          employees: state.employees.map(emp =>
            emp.id === id ? { ...emp, status: 'LEAVE' } : emp
          ),
          loading: false,
        }));

        // 更新统计
        await get().loadStatistics();
      } catch (error: any) {
        set({
          error: error?.message || '设置请假失败',
          loading: false,
        });
        throw error;
      }
    },

    resignEmployee: async (id: string, resignDate: string) => {
      set({ loading: true, error: null });

      try {
        await employeeApi.resignEmployee(id, resignDate);

        set(state => ({
          employees: state.employees.map(emp =>
            emp.id === id ? { ...emp, status: 'RESIGNED' } : emp
          ),
          loading: false,
        }));

        // 更新统计
        await get().loadStatistics();
      } catch (error: any) {
        set({
          error: error?.message || '设置离职失败',
          loading: false,
        });
        throw error;
      }
    },

    activateEmployee: async (id: string) => {
      set({ loading: true, error: null });

      try {
        await employeeApi.activateEmployee(id);

        set(state => ({
          employees: state.employees.map(emp =>
            emp.id === id ? { ...emp, status: 'ACTIVE' } : emp
          ),
          loading: false,
        }));

        // 更新统计
        await get().loadStatistics();
      } catch (error: any) {
        set({
          error: error?.message || '恢复员工失败',
          loading: false,
        });
        throw error;
      }
    },

    updateStatus: async (ids: string[], status: 'ACTIVE' | 'LEAVE' | 'RESIGNED') => {
      set({ loading: true, error: null });

      try {
        await employeeApi.updateStatus(ids, status);

        set(state => ({
          employees: state.employees.map(emp =>
            ids.includes(emp.id) ? { ...emp, status } : emp
          ),
          loading: false,
        }));

        // 更新统计
        await get().loadStatistics();
      } catch (error: any) {
        set({
          error: error?.message || '更新状态失败',
          loading: false,
        });
        throw error;
      }
    },

    updateSkills: async (id: string, skills: string[]) => {
      set({ loading: true, error: null });

      try {
        await employeeApi.updateSkills(id, skills);

        set(state => ({
          employees: state.employees.map(emp =>
            emp.id === id ? { ...emp, skills } : emp
          ),
          loading: false,
        }));
      } catch (error: any) {
        set({
          error: error?.message || '更新技能失败',
          loading: false,
        });
        throw error;
      }
    },

    updateCertifications: async (id: string, certifications: string[]) => {
      set({ loading: true, error: null });

      try {
        await employeeApi.updateCertifications(id, certifications);

        set(state => ({
          employees: state.employees.map(emp =>
            emp.id === id ? { ...emp, certifications } : emp
          ),
          loading: false,
        }));
      } catch (error: any) {
        set({
          error: error?.message || '更新证书失败',
          loading: false,
        });
        throw error;
      }
    },

    // State setters
    setFilters: (filters: Partial<EmployeeQuery>) => {
      set(state => ({
        filters: { ...state.filters, ...filters },
        pagination: { ...state.pagination, current: 1 },
      }));
    },

    setSelectedIds: (ids: string[]) => {
      set({ selectedIds: ids });
    },

    setCurrentEmployee: (employee: Employee | null) => {
      set({ currentEmployee: employee });
    },

    setPagination: (pagination: Partial<PaginationState>) => {
      set(state => ({
        pagination: { ...state.pagination, ...pagination },
      }));
    },

    setLoading: (loading: boolean) => {
      set({ loading });
    },

    setError: (error: string | null) => {
      set({ error });
    },

    reset: () => {
      set({
        employees: DEFAULT_EMPLOYEES,
        selectedIds: [],
        currentEmployee: null,
        filters: {},
        pagination: {
          current: 1,
          pageSize: 15,
          total: DEFAULT_EMPLOYEES.length,
        },
        loading: false,
        error: null,
        statistics: null,
      });
    },
  })
);

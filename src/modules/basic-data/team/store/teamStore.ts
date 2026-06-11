/**
 * 班组模块状态管理Store
 * 使用Zustand进行模块级状态管理
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Team, TeamQuery, TeamStatistics, TeamStatusAction } from '../types';
import { teamApi } from '../api/teamApi';

/**
 * 班组Store状态接口
 */
export interface TeamState {
  // 数据状态
  teams: Team[];
  total: number;
  loading: boolean;
  error: string | null;

  // 查询状态
  query: TeamQuery;
  filters: Record<string, any>;

  // 选择状态
  selectedIds: string[];
  selectedTeams: Team[];

  // 详情状态
  currentTeam: Team | null;

  // 关联数据
  teamEmployees: any[];
  showMemberDrawer: boolean;

  // 统计数据
  statistics: TeamStatistics | null;

  // 类型统计
  typeStatistics: Array<{
    type: string;
    typeName: string;
    count: number;
  }>;

  // 关联数据
  workshops: Array<{ id: string; name: string; code: string }>;
  workCenters: Array<{ id: string; name: string; code: string }>;
  shifts: any[];
  factories: any[];

  // UI状态
  showCreateModal: boolean;
  showEditModal: boolean;
  showDetailDrawer: boolean;
  showLeaderModal: boolean;

  // Actions
  loadWorkshops: () => Promise<void>;
  loadWorkCenters: () => Promise<void>;
  loadShifts: () => Promise<void>;
  loadFactories: () => Promise<void>;
  setTeams: (teams: Team[], total: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setQuery: (query: Partial<TeamQuery>) => void;
  setFilters: (filters: Record<string, any>) => void;
  setSelectedIds: (ids: string[]) => void;
  clearSelection: () => void;
  loadTeams: () => Promise<void>;
  refreshTeams: () => Promise<void>;
  createTeam: (data: any) => Promise<void>;
  updateTeam: (data: any) => Promise<void>;
  deleteTeam: (id: string) => Promise<void>;
  batchDeleteTeams: (ids: string[]) => Promise<void>;
  batchEnableTeams: (ids: string[]) => Promise<void>;
  batchDisableTeams: (ids: string[]) => Promise<void>;
  updateTeamStatus: (action: TeamStatusAction) => Promise<void>;
  loadTeamById: (id: string) => Promise<Team | null>;
  checkCodeUnique: (code: string, excludeId?: string) => Promise<boolean>;
  getAvailableWorkCenters: () => Promise<any[]>;
  getAvailableEmployees: () => Promise<any[]>;
  setShowCreateModal: (show: boolean) => void;
  setShowEditModal: (show: boolean) => void;
  setShowDetailDrawer: (show: boolean) => void;
  setShowLeaderModal: (show: boolean) => void;
  setCurrentTeam: (team: Team | null) => void;
  loadStatistics: () => Promise<void>;
  importTeams: (file: File, validate?: boolean, updateMode?: 'create' | 'update' | 'skip') => Promise<void>;
  exportTeams: (query?: TeamQuery, fileName?: string) => Promise<void>;
  loadTeamEmployees: (teamId: string) => Promise<void>;
  addTeamMember: (teamId: string, employeeId: string) => Promise<void>;
  removeTeamMember: (teamId: string, employeeId: string) => Promise<void>;
  changeTeamLeader: (teamId: string, leaderId: string) => Promise<void>;
  loadTypeStatistics: () => Promise<void>;
  setShowMemberDrawer: (show: boolean) => void;
  searchTeams: (keyword: string) => Promise<Team[]>;
  reset: () => void;

  // 兼容别名
  pagination: { current: number; pageSize: number; total: number };
  deleteTeams: (ids: string[]) => Promise<void>;
  updateStatus: (ids: string[], status: string) => Promise<void>;
}

/**
 * 班组Store
 */
export const useTeamStore = create<TeamState>()(
  persist(
    (set, get) => ({
      // 初始状态
      teams: [],
      total: 0,
      loading: false,
      error: null,
      query: {
        current: 1,
        pageSize: 15,
      },
      filters: {},
      selectedIds: [],
      selectedTeams: [],
      currentTeam: null,
      teamEmployees: [],
      showMemberDrawer: false,
      statistics: null,
      typeStatistics: [],
      workshops: [],
      workCenters: [],
      shifts: [],
      factories: [],
      showCreateModal: false,
      showEditModal: false,
      showDetailDrawer: false,
      showLeaderModal: false,

      /**
       * 设置班组列表数据
       */
      setTeams: (teams: Team[], total: number) => {
        set({ teams, total, error: null });
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
      setQuery: (query: Partial<TeamQuery>) => {
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
        const { teams } = get();
        const selectedTeams = teams.filter(t => ids.includes(t.id));
        set({ selectedIds: ids, selectedTeams });
      },

      /**
       * 清除选择
       */
      clearSelection: () => {
        set({ selectedIds: [], selectedTeams: [] });
      },

      /**
       * 加载班组列表
       */
      loadTeams: async () => {
        const { query } = get();
        set({ loading: true, error: null });

        try {
          const response = await teamApi.getTeams(query);

          if (response.code === 200) {
            set({
              teams: response.data.list as any,
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
       * 刷新班组列表
       */
      refreshTeams: async () => {
        const { query } = get();
        set({ loading: true, error: null });

        try {
          const response = await teamApi.getTeams(query);

          if (response.code === 200) {
            set({
              teams: response.data.list as any,
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
       * 创建班组
       */
      createTeam: async (data: any) => {
        set({ loading: true, error: null });

        try {
          const response = await teamApi.createTeam(data);

          if (response.code === 200) {
            // 刷新列表
            await get().loadTeams();
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
       * 更新班组
       */
      updateTeam: async (data: any) => {
        set({ loading: true, error: null });

        try {
          const response = await teamApi.updateTeam(data);

          if (response.code === 200) {
            // 刷新列表
            await get().loadTeams();
            set({ showEditModal: false, currentTeam: null });
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
       * 删除班组
       */
      deleteTeam: async (id: string) => {
        set({ loading: true, error: null });

        try {
          const response = await teamApi.deleteTeam(id);

          if (response.code === 200) {
            // 刷新列表
            await get().loadTeams();
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
       * 批量删除班组
       */
      batchDeleteTeams: async (ids: string[]) => {
        set({ loading: true, error: null });

        try {
          const response = await teamApi.deleteTeams(ids);

          if (response.code === 200) {
            // 刷新列表
            await get().loadTeams();
            // 清除选择
            set({ selectedIds: [], selectedTeams: [] });
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
       * 批量启用班组
       */
      batchEnableTeams: async (ids: string[]) => {
        set({ loading: true, error: null });

        try {
          const response = await teamApi.batchEnable(ids);

          if (response.code === 200) {
            // 刷新列表
            await get().loadTeams();
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
       * 批量禁用班组
       */
      batchDisableTeams: async (ids: string[]) => {
        set({ loading: true, error: null });

        try {
          const response = await teamApi.batchDisable(ids);

          if (response.code === 200) {
            // 刷新列表
            await get().loadTeams();
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
       * 更新班组状态
       */
      updateTeamStatus: async (action: TeamStatusAction) => {
        set({ loading: true, error: null });

        try {
          const response = await teamApi.updateStatus(action);

          if (response.code === 200) {
            // 刷新列表
            await get().loadTeams();
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
       * 根据ID加载班组
       */
      loadTeamById: async (id: string): Promise<Team | null> => {
        set({ loading: true, error: null });

        try {
          const response = await teamApi.getTeamById(id);

          if (response.code === 200) {
            set({
              currentTeam: response.data as any,
              loading: false,
            });
            return response.data as any;
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
       * 检查班组编码唯一性
       */
      checkCodeUnique: async (code: string, excludeId?: string): Promise<boolean> => {
        try {
          const response = await teamApi.checkCodeUnique(code, excludeId);
          return response.code === 200 && response.data.unique;
        } catch (error: any) {
          console.error('检查编码唯一性失败:', error);
          return false;
        }
      },

      /**
       * 获取可用工作中心列表
       */
      getAvailableWorkCenters: async (): Promise<any[]> => {
        try {
          const response = await teamApi.getAvailableWorkCenters();
          return response.code === 200 ? response.data as any : [];
        } catch (error: any) {
          console.error('获取可用工作中心失败:', error);
          return [];
        }
      },

      /**
       * 获取可用员工列表
       */
      getAvailableEmployees: async (): Promise<any[]> => {
        try {
          const response = await teamApi.getAvailableEmployees();
          return response.code === 200 ? response.data as any : [];
        } catch (error: any) {
          console.error('获取可用员工失败:', error);
          return [];
        }
      },

      /**
       * 显示创建弹窗
       */
      setShowCreateModal: (show: boolean) => {
        set({ showCreateModal: show, currentTeam: null });
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
       * 显示更换负责人弹窗
       */
      setShowLeaderModal: (show: boolean) => {
        set({ showLeaderModal: show });
      },

      /**
       * 设置当前班组
       */
      setCurrentTeam: (team: Team | null) => {
        set({ currentTeam: team });
      },

      /**
       * 加载统计数据
       */
      loadStatistics: async () => {
        try {
          const response = await teamApi.getStatistics();

          if (response.code === 200) {
            set({ statistics: response.data });
          }
        } catch (error: any) {
          console.error('加载统计失败:', error);
        }
      },

      /**
       * 导入班组
       */
      importTeams: async (
        file: File,
        validate?: boolean,
        updateMode?: 'create' | 'update' | 'skip'
      ) => {
        set({ loading: true, error: null });

        try {
          const response = await teamApi.importTeams({
            file,
            validate,
            updateMode,
          });

          if (response.code === 200) {
            // 刷新列表
            await get().loadTeams();
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
       * 导出班组
       */
      exportTeams: async (query?: TeamQuery, fileName?: string) => {
        const { query: currentQuery } = get();
        set({ loading: true });

        try {
          await teamApi.exportTeams(query || currentQuery, fileName);
          set({ loading: false });
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '导出失败',
          });
        }
      },

      /**
       * 加载班组员工
       */
      loadTeamEmployees: async (teamId: string) => {
        set({ loading: true, error: null });

        try {
          const response = await teamApi.getTeamEmployees(teamId);

          if (response.code === 200) {
            set({
              teamEmployees: response.data,
              loading: false,
            });
          } else {
            set({
              loading: false,
              error: response.message || '加载员工列表失败',
            });
          }
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '加载员工列表失败',
          });
        }
      },

      /**
       * 添加班组成员
       */
      addTeamMember: async (teamId: string, employeeId: string) => {
        set({ loading: true, error: null });

        try {
          const response = await teamApi.addTeamMember(teamId, employeeId);

          if (response.code === 200) {
            // 刷新员工列表
            await get().loadTeamEmployees(teamId);
          } else {
            set({
              loading: false,
              error: response.message || '添加成员失败',
            });
          }
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '添加成员失败',
          });
        }
      },

      /**
       * 移除班组成员
       */
      removeTeamMember: async (teamId: string, employeeId: string) => {
        set({ loading: true, error: null });

        try {
          const response = await teamApi.removeTeamMember(teamId, employeeId);

          if (response.code === 200) {
            // 刷新员工列表
            await get().loadTeamEmployees(teamId);
          } else {
            set({
              loading: false,
              error: response.message || '移除成员失败',
            });
          }
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '移除成员失败',
          });
        }
      },

      /**
       * 更换班组负责人
       */
      changeTeamLeader: async (teamId: string, leaderId: string) => {
        set({ loading: true, error: null });

        try {
          const response = await teamApi.changeTeamLeader(teamId, leaderId);

          if (response.code === 200) {
            // 刷新列表
            await get().loadTeams();
            set({ showLeaderModal: false });
          } else {
            set({
              loading: false,
              error: response.message || '更换负责人失败',
            });
          }
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '更换负责人失败',
          });
        }
      },

      /**
       * 加载类型统计
       */
      loadTypeStatistics: async () => {
        try {
          const response = await teamApi.getTypeStatistics();

          if (response.code === 200) {
            set({ typeStatistics: response.data });
          }
        } catch (error: any) {
          console.error('加载类型统计失败:', error);
        }
      },

      /**
       * 显示成员抽屉
       */
      setShowMemberDrawer: (show: boolean) => {
        set({ showMemberDrawer: show });
      },

      /**
       * 搜索班组
       */
      searchTeams: async (keyword: string): Promise<Team[]> => {
        try {
          const response = await teamApi.searchTeams(keyword);
          return response.code === 200 ? response.data as any : [];
        } catch (error: any) {
          console.error('搜索班组失败:', error);
          return [];
        }
      },

      /**
       * 重置状态
       */
      loadWorkshops: async () => {
      set({ workshops: [] });
    },
    loadWorkCenters: async () => {
      set({ workCenters: [] });
    },
    loadShifts: async () => {
      set({ shifts: [] });
    },
    loadFactories: async () => {
      set({ factories: [] });
    },
    reset: () => {
        set({
          teams: [],
          total: 0,
          loading: false,
          error: null,
          query: {
            current: 1,
            pageSize: 15,
          },
          filters: {},
          selectedIds: [],
          selectedTeams: [],
          currentTeam: null,
          teamEmployees: [],
          showMemberDrawer: false,
          statistics: null,
          typeStatistics: [],
          showCreateModal: false,
          showEditModal: false,
          showDetailDrawer: false,
          showLeaderModal: false,
        });
      },

    // 兼容别名
    get pagination() {
      const s = get();
      return { current: (s.query as any).current || 1, pageSize: (s.query as any).pageSize || 15, total: s.total };
    },
    deleteTeams: async (ids: string[]) => { await get().batchDeleteTeams(ids); },
    updateStatus: async (ids: string[], status: string) => { await get().updateTeamStatus({ action: status, ids } as any); },
    }),
    {
      name: 'team-store',
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

export default useTeamStore;

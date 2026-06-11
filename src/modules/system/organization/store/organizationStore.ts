/**
 * 组织架构模块状态管理Store
 * 使用Zustand进行模块级状态管理
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { message } from 'antd';
import type {
  OrgNode,
  OrgNodeQuery,
  CreateOrgNodeDTO,
  UpdateOrgNodeDTO,
  MoveOrgNodeDTO,
} from '../types';
import type { PageQuery } from '../../../../shared/api/requestTypes';
import { organizationApi } from '../api';

/**
 * Organization Store状态接口
 */
export interface OrganizationState {
  // 组织节点列表状态
  orgNodes: OrgNode[];
  total: number;
  loading: boolean;
  error: string | null;

  // 查询状态
  query: OrgNodeQuery;
  filters: Record<string, any>;

  // 选择状态
  selectedIds: string[];
  selectedNodes: OrgNode[];

  // 详情状态
  currentNode: OrgNode | null;
  showDetailDrawer: boolean;

  // 树形状态
  treeData: OrgNode[];
  expandedKeys: React.Key[];
  selectedKeys: React.Key[];

  // 操作状态
  operationLoading: boolean;

  // UI状态
  showCreateModal: boolean;
  showEditModal: boolean;
  showMoveModal: boolean;

  // Actions
  setOrgNodes: (nodes: OrgNode[], total: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setQuery: (query: Partial<OrgNodeQuery>) => void;
  setFilters: (filters: Record<string, any>) => void;
  setSelectedIds: (ids: string[]) => void;
  clearSelection: () => void;
  setCurrentNode: (node: OrgNode | null) => void;
  setShowDetailDrawer: (show: boolean) => void;
  setTreeData: (treeData: OrgNode[]) => void;
  setExpandedKeys: (keys: React.Key[]) => void;
  setSelectedKeys: (keys: React.Key[]) => void;

  // 组织架构操作
  loadOrgNodes: () => Promise<void>;
  refreshOrgNodes: () => Promise<void>;
  createOrgNode: (data: CreateOrgNodeDTO) => Promise<void>;
  updateOrgNode: (data: UpdateOrgNodeDTO) => Promise<void>;
  deleteOrgNodes: (ids: string[]) => Promise<void>;
  updateStatus: (ids: string[], status: 'ACTIVE' | 'INACTIVE') => Promise<void>;

  // 树形操作
  loadTree: () => Promise<void>;
  moveNode: (data: MoveOrgNodeDTO) => Promise<void>;

  // UI操作
  setShowCreateModal: (show: boolean) => void;
  setShowEditModal: (show: boolean) => void;
  setShowMoveModal: (show: boolean) => void;

  reset: () => void;

  // 兼容别名
  updateOrgNodeStatus: (id: string, status: string) => Promise<void>;
}

/**
 * Organization Store
 */
export const useOrganizationStore = create<OrganizationState>()(
  persist(
    (set, get) => ({
      // 初始状态
      orgNodes: [],
      total: 0,
      loading: false,
      error: null,

      query: {
        current: 1,
        pageSize: 15,
      },
      filters: {},
      selectedIds: [],
      selectedNodes: [],
      currentNode: null,
      showDetailDrawer: false,
      treeData: [],
      expandedKeys: [],
      selectedKeys: [],
      operationLoading: false,
      showCreateModal: false,
      showEditModal: false,
      showMoveModal: false,

      /**
       * 设置组织节点列表数据
       */
      setOrgNodes: (nodeList: OrgNode[], total: number) => {
        set({ orgNodes: nodeList, total, error: null });
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
      setQuery: (query: Partial<OrgNodeQuery>) => {
        set((state) => ({
          query: { ...state.query, ...query, current: 1 },
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
        const { orgNodes } = get();
        const selectedNodes = orgNodes.filter(n => ids.includes(n.id));
        set({ selectedIds: ids, selectedNodes });
      },

      /**
       * 清除选择
       */
      clearSelection: () => {
        set({
          selectedIds: [],
          selectedNodes: [],
        });
      },

      /**
       * 设置当前组织节点
       */
      setCurrentNode: (node: OrgNode | null) => {
        set({ currentNode: node });
      },

      /**
       * 显示详情抽屉
       */
      setShowDetailDrawer: (show: boolean) => {
        set({ showDetailDrawer: show });
      },

      /**
       * 设置树形数据
       */
      setTreeData: (treeData: OrgNode[]) => {
        set({ treeData });
      },

      /**
       * 设置展开的节点
       */
      setExpandedKeys: (keys: React.Key[]) => {
        set({ expandedKeys: keys });
      },

      /**
       * 设置选中的节点
       */
      setSelectedKeys: (keys: React.Key[]) => {
        set({ selectedKeys: keys });
      },

      /**
       * 加载组织节点列表
       */
      loadOrgNodes: async () => {
        const { query } = get();
        set({ loading: true, error: null });

        try {
          const response = await organizationApi.getOrgNodes(query);

          if ((response as any).code === 200) {
            set({
              orgNodes: response.list,
              total: response.total,
              loading: false,
            });
          } else {
            set({
              loading: false,
              error: (response as any).message || '加载失败',
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
       * 刷新组织节点列表
       */
      refreshOrgNodes: async () => {
        const { query } = get();
        set({ loading: true, error: null });

        try {
          const response = await organizationApi.getOrgNodes(query);

          if ((response as any).code === 200) {
            set({
              orgNodes: response.list,
              total: response.total,
              loading: false,
            });
          } else {
            set({
              loading: false,
              error: (response as any).message || '刷新失败',
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
       * 创建组织节点
       */
      createOrgNode: async (data: CreateOrgNodeDTO) => {
        set({ loading: true, error: null });

        try {
          const response = await organizationApi.createOrgNode(data);

          if ((response as any).code === 200) {
            await get().loadOrgNodes();
            await get().loadTree();
            set({ showCreateModal: false });
            message.success('组织节点创建成功！');
          } else {
            set({
              loading: false,
              error: (response as any).message || '创建失败',
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
       * 更新组织节点
       */
      updateOrgNode: async (data: UpdateOrgNodeDTO) => {
        set({ loading: true, error: null });

        try {
          const response = await organizationApi.updateOrgNode(data);

          if ((response as any).code === 200) {
            await get().loadOrgNodes();
            await get().loadTree();
            set({ showEditModal: false });
            message.success('组织节点更新成功！');
          } else {
            set({
              loading: false,
              error: (response as any).message || '更新失败',
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
       * 删除组织节点
       */
      deleteOrgNodes: async (ids: string[]) => {
        set({ loading: true, error: null });

        try {
          const response = await organizationApi.deleteOrgNodes(ids);

          if ((response as any).code === 200) {
            await get().loadOrgNodes();
            await get().loadTree();
            get().clearSelection();
            message.success(`成功删除 ${ids.length} 个组织节点`);
          } else {
            set({
              loading: false,
              error: (response as any).message || '删除失败',
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
       * 更新组织节点状态
       */
      updateStatus: async (ids: string[], status: 'ACTIVE' | 'INACTIVE') => {
        set({ loading: true, error: null });

        try {
          const response = await organizationApi.updateOrgNodeStatus(ids, status);

          if ((response as any).code === 200) {
            await get().loadOrgNodes();
            await get().loadTree();
            message.success(`成功${status === 'ACTIVE' ? '生效' : '停用'} ${ids.length} 个组织节点`);
          } else {
            set({
              loading: false,
              error: (response as any).message || '状态更新失败',
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
       * 加载树形数据
       */
      loadTree: async () => {
        set({ loading: true, error: null });

        try {
          const response = await organizationApi.getOrgTree();

          if ((response as any).code === 200) {
            set({
              treeData: (response as any).data,
              loading: false,
            });
          } else {
            set({
              loading: false,
              error: (response as any).message || '加载失败',
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
       * 移动组织节点
       */
      moveNode: async (data: MoveOrgNodeDTO) => {
        set({ operationLoading: true, error: null });

        try {
          const response = await organizationApi.moveOrgNode(data);

          if ((response as any).code === 200) {
            await get().loadOrgNodes();
            await get().loadTree();
            set({ showMoveModal: false });
            message.success('组织节点移动成功！');
          } else {
            set({
              operationLoading: false,
              error: (response as any).message || '移动失败',
            });
          }
        } catch (error: any) {
          set({
            operationLoading: false,
            error: error.message || '移动失败',
          });
        }
      },

      /**
       * 显示创建弹窗
       */
      setShowCreateModal: (show: boolean) => {
        set({ showCreateModal: show, currentNode: null });
      },

      /**
       * 显示编辑弹窗
       */
      setShowEditModal: (show: boolean) => {
        set({ showEditModal: show });
      },

      /**
       * 显示移动弹窗
       */
      setShowMoveModal: (show: boolean) => {
        set({ showMoveModal: show });
      },

      /**
       * 重置状态
       */
      reset: () => {
        set({
          orgNodes: [],
          total: 0,
          loading: false,
          error: null,
          query: {
            current: 1,
            pageSize: 15,
          },
          filters: {},
          selectedIds: [],
          selectedNodes: [],
          currentNode: null,
          showDetailDrawer: false,
          treeData: [],
          expandedKeys: [],
          selectedKeys: [],
          operationLoading: false,
          showCreateModal: false,
          showEditModal: false,
          showMoveModal: false,
        });
      },

      // 兼容别名
      updateOrgNodeStatus: async (id: string, status: string) => {
        await (organizationApi as any).updateOrgNodeStatus([id], status);
      },
    }),
    {
      name: 'organization-store',
      // 只持久化核心状态
      partialize: (state) => ({
        orgNodes: state.orgNodes,
        query: state.query,
        filters: state.filters,
        expandedKeys: state.expandedKeys,
      }),
    }
  )
);

export default useOrganizationStore;
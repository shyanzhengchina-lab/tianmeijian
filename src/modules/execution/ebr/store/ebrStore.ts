/**
 * 电子批记录模块状态管理Store
 * 使用Zustand进行模块级状态管理
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { message } from 'antd';
import { ebrApi } from '../api/ebrApi';
import type {
  EBRRecord,
  EBRStep,
  EquipmentUsage,
  MaterialBalance,
  EBRQuery,
  CreateEBRDTO,
  UpdateEBRDTO,
  StepOperationDTO,
  DataRecordDTO,
  EquipmentUsageDTO,
} from '../types';
import type { PageQuery } from '../../../../shared/api/requestTypes';

/**
 * EBR Store状态接口
 */
export interface EBRState {
  // 批记录列表状态
  ebrRecords: EBRRecord[];
  total: number;
  loading: boolean;
  error: string | null;

  // 查询状态
  query: EBRQuery;
  filters: Record<string, any>;

  // 选择状态
  selectedIds: string[];
  selectedRecords: EBRRecord[];

  // 详情状态
  currentRecord: EBRRecord | null;
  currentSteps: EBRStep[];
  showDetailDrawer: boolean;

  // 步骤状态
  currentStep: EBRStep | null;
  showStepModal: boolean;

  // 设备使用状态
  equipmentUsageList: EquipmentUsage[];
  showEquipmentDrawer: boolean;

  // 物料平衡状态
  materialBalanceList: MaterialBalance[];
  showBalanceDrawer: boolean;

  // 操作状态
  operationLoading: boolean;
  stepOperationLoading: boolean;

  // UI状态
  activeTab: 'list' | 'steps' | 'equipment' | 'balance';
  showCreateModal: boolean;
  showEditModal: boolean;

  // Actions
  setEBRRecords: (records: EBRRecord[], total: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setQuery: (query: Partial<EBRQuery>) => void;
  setFilters: (filters: Record<string, any>) => void;
  setSelectedIds: (ids: string[]) => void;
  clearSelection: () => void;
  setCurrentRecord: (record: EBRRecord | null) => void;
  setCurrentSteps: (steps: EBRStep[]) => void;
  setShowDetailDrawer: (show: boolean) => void;
  setCurrentStep: (step: EBRStep | null) => void;
  setShowStepModal: (show: boolean) => void;
  setEquipmentUsageList: (list: EquipmentUsage[]) => void;
  setShowEquipmentDrawer: (show: boolean) => void;
  setMaterialBalanceList: (list: MaterialBalance[]) => void;
  setShowBalanceDrawer: (show: boolean) => void;

  // 批记录操作
  loadEBRRecords: () => Promise<void>;
  refreshEBRRecords: () => Promise<void>;
  createEBRRecord: (data: CreateEBRDTO) => Promise<void>;
  updateEBRRecord: (data: UpdateEBRDTO) => Promise<void>;
  deleteEBRRecords: (ids: string[]) => Promise<void>;
  startEBR: (id: string) => Promise<void>;
  pauseEBR: (id: string) => Promise<void>;
  resumeEBR: (id: string) => Promise<void>;
  completeEBR: (id: string) => Promise<void>;
  cancelEBR: (id: string) => Promise<void>;

  // 步骤操作
  loadSteps: (ebrId: string) => Promise<void>;
  startStep: (data: StepOperationDTO) => Promise<void>;
  completeStep: (data: StepOperationDTO) => Promise<void>;
  pauseStep: (data: StepOperationDTO) => Promise<void>;
  skipStep: (data: StepOperationDTO) => Promise<void>;
  approveStep: (data: StepOperationDTO) => Promise<void>;
  recordData: (recordId: string, data: DataRecordDTO) => Promise<void>;

  // 设备使用操作
  loadEquipmentUsage: (ebrId: string) => Promise<void>;
  addEquipmentUsage: (ebrId: string, data: EquipmentUsageDTO) => Promise<void>;
  endEquipmentUsage: (usageId: string) => Promise<void>;

  // 物料平衡操作
  loadMaterialBalance: (ebrId: string) => Promise<void>;
  recalculateBalance: (ebrId: string) => Promise<void>;
  adjustVariance: (balanceId: string, reason: string) => Promise<void>;

  // UI操作
  setActiveTab: (tab: 'list' | 'steps' | 'equipment' | 'balance') => void;
  setShowCreateModal: (show: boolean) => void;
  setShowEditModal: (show: boolean) => void;

  reset: () => void;
}

/**
 * EBR Store
 */
export const useEBRStore = create<EBRState>()(
  persist(
    (set, get) => ({
      // 初始状态
      ebrRecords: [],
      total: 0,
      loading: false,
      error: null,

      query: {
        current: 1,
        pageSize: 15,
      },
      filters: {},
      selectedIds: [],
      selectedRecords: [],
      currentRecord: null,
      currentSteps: [],
      showDetailDrawer: false,
      currentStep: null,
      showStepModal: false,
      equipmentUsageList: [],
      showEquipmentDrawer: false,
      materialBalanceList: [],
      showBalanceDrawer: false,
      operationLoading: false,
      stepOperationLoading: false,
      activeTab: 'list',
      showCreateModal: false,
      showEditModal: false,

      /**
       * 设置批记录列表数据
       */
      setEBRRecords: (records: EBRRecord[], total: number) => {
        set({ ebrRecords: records, total, error: null });
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
      setQuery: (query: Partial<EBRQuery>) => {
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
        const { ebrRecords } = get();
        const selectedRecords = ebrRecords.filter(r => ids.includes(r.id));
        set({ selectedIds: ids, selectedRecords });
      },

      /**
       * 清除选择
       */
      clearSelection: () => {
        set({
          selectedIds: [],
          selectedRecords: [],
        });
      },

      /**
       * 设置当前批记录
       */
      setCurrentRecord: (record: EBRRecord | null) => {
        set({ currentRecord: record });
      },

      /**
       * 设置当前步骤列表
       */
      setCurrentSteps: (steps: EBRStep[]) => {
        set({ currentSteps: steps });
      },

      /**
       * 显示详情抽屉
       */
      setShowDetailDrawer: (show: boolean) => {
        set({ showDetailDrawer: show });
      },

      /**
       * 设置当前步骤
       */
      setCurrentStep: (step: EBRStep | null) => {
        set({ currentStep: step });
      },

      /**
       * 显示步骤操作弹窗
       */
      setShowStepModal: (show: boolean) => {
        set({ showStepModal: show });
      },

      /**
       * 设置设备使用列表
       */
      setEquipmentUsageList: (list: EquipmentUsage[]) => {
        set({ equipmentUsageList: list });
      },

      /**
       * 显示设备使用抽屉
       */
      setShowEquipmentDrawer: (show: boolean) => {
        set({ showEquipmentDrawer: show });
      },

      /**
       * 设置物料平衡列表
       */
      setMaterialBalanceList: (list: MaterialBalance[]) => {
        set({ materialBalanceList: list });
      },

      /**
       * 显示物料平衡抽屉
       */
      setShowBalanceDrawer: (show: boolean) => {
        set({ showBalanceDrawer: show });
      },

      /**
       * 加载批记录列表
       */
      loadEBRRecords: async () => {
        const { query } = get();
        set({ loading: true, error: null });

        try {
          const response = await ebrApi.getEBRRecords(query);

          if ((response as any).code === 200) {
            set({
              ebrRecords: (response as any).data?.list,
              total: (response as any).data?.total,
              loading: false,
            });
          } else {
            set({
              loading: false,
              error: (response as any).message || '加载失败',
            });
            message.error((response as any).message || '加载失败');
          }
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '加载失败',
          });
          message.error(error.message || '加载失败');
        }
      },

      /**
       * 刷新批记录列表
       */
      refreshEBRRecords: async () => {
        const { query } = get();
        set({ loading: true, error: null });

        try {
          const response = await ebrApi.getEBRRecords(query);

          if ((response as any).code === 200) {
            set({
              ebrRecords: (response as any).data?.list,
              total: (response as any).data?.total,
              loading: false,
            });
          } else {
            set({
              loading: false,
              error: (response as any).message || '刷新失败',
            });
            message.error((response as any).message || '刷新失败');
          }
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '刷新失败',
          });
          message.error(error.message || '刷新失败');
        }
      },

      /**
       * 创建批记录
       */
      createEBRRecord: async (data: CreateEBRDTO) => {
        set({ loading: true, error: null });

        try {
          const response = await ebrApi.createEBR(data);

          if ((response as any).code === 200) {
            await get().loadEBRRecords();
            set({ showCreateModal: false });
            message.success('批记录创建成功！');
            set({ loading: false });
          } else {
            set({
              loading: false,
              error: (response as any).message || '创建失败',
            });
            message.error((response as any).message || '创建失败');
          }
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '创建失败',
          });
          message.error(error.message || '创建失败');
        }
      },

      /**
       * 更新批记录
       */
      updateEBRRecord: async (data: UpdateEBRDTO) => {
        set({ loading: true, error: null });

        try {
          const response = await ebrApi.updateEBRRecord((data as any).id, data);

          if ((response as any).code === 200) {
            await get().loadEBRRecords();
            set({ showEditModal: false });
            message.success('批记录更新成功！');
            set({ loading: false });
          } else {
            set({
              loading: false,
              error: (response as any).message || '更新失败',
            });
            message.error((response as any).message || '更新失败');
          }
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '更新失败',
          });
          message.error(error.message || '更新失败');
        }
      },

      /**
       * 删除批记录
       */
      deleteEBRRecords: async (ids: string[]) => {
        set({ loading: true, error: null });

        try {
          const response = await ebrApi.deleteEBRs(ids);

          if ((response as any).code === 200) {
            await get().loadEBRRecords();
            get().clearSelection();
            message.success(`成功删除 ${ids.length} 个批记录`);
            set({ loading: false });
          } else {
            set({
              loading: false,
              error: (response as any).message || '删除失败',
            });
            message.error((response as any).message || '删除失败');
          }
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '删除失败',
          });
          message.error(error.message || '删除失败');
        }
      },

      /**
       * 开始批记录
       */
      startEBR: async (id: string) => {
        set({ operationLoading: true, error: null });

        try {
          const response = await ebrApi.startEBR(id, 'current-user'); // TODO: 从当前用户信息获取

          if ((response as any).code === 200) {
            await get().loadEBRRecords();
            message.success('批记录已开始执行！');
            set({ operationLoading: false });
          } else {
            set({
              operationLoading: false,
              error: (response as any).message || '启动失败',
            });
            message.error((response as any).message || '启动失败');
          }
        } catch (error: any) {
          set({
            operationLoading: false,
            error: error.message || '启动失败',
          });
          message.error(error.message || '启动失败');
        }
      },

      /**
       * 暂停批记录
       */
      pauseEBR: async (id: string) => {
        set({ operationLoading: true, error: null });

        try {
          const response = await ebrApi.pauseEBR(id, 'current-user');

          if ((response as any).code === 200) {
            await get().loadEBRRecords();
            message.success('批记录已暂停！');
            set({ operationLoading: false });
          } else {
            set({
              operationLoading: false,
              error: (response as any).message || '暂停失败',
            });
            message.error((response as any).message || '暂停失败');
          }
        } catch (error: any) {
          set({
            operationLoading: false,
            error: error.message || '暂停失败',
          });
          message.error(error.message || '暂停失败');
        }
      },

      /**
       * 恢复批记录
       */
      resumeEBR: async (id: string) => {
        set({ operationLoading: true, error: null });

        try {
          const response = await ebrApi.resumeEBR(id, 'current-user');

          if ((response as any).code === 200) {
            await get().loadEBRRecords();
            message.success('批记录已恢复执行！');
            set({ operationLoading: false });
          } else {
            set({
              operationLoading: false,
              error: (response as any).message || '恢复失败',
            });
            message.error((response as any).message || '恢复失败');
          }
        } catch (error: any) {
          set({
            operationLoading: false,
            error: error.message || '恢复失败',
          });
          message.error(error.message || '恢复失败');
        }
      },

      /**
       * 完成批记录
       */
      completeEBR: async (id: string) => {
        set({ operationLoading: true, error: null });

        try {
          const response = await ebrApi.completeEBR(id, 'current-user');

          if ((response as any).code === 200) {
            await get().loadEBRRecords();
            message.success('批记录已完成！');
            set({ operationLoading: false });
          } else {
            set({
              operationLoading: false,
              error: (response as any).message || '完成失败',
            });
            message.error((response as any).message || '完成失败');
          }
        } catch (error: any) {
          set({
            operationLoading: false,
            error: error.message || '完成失败',
          });
          message.error(error.message || '完成失败');
        }
      },

      /**
       * 取消批记录
       */
      cancelEBR: async (id: string) => {
        set({ operationLoading: true, error: null });

        try {
          const response = await ebrApi.cancelEBR(id, 'current-user');

          if ((response as any).code === 200) {
            await get().loadEBRRecords();
            message.success('批记录已取消！');
            set({ operationLoading: false });
          } else {
            set({
              operationLoading: false,
              error: (response as any).message || '取消失败',
            });
            message.error((response as any).message || '取消失败');
          }
        } catch (error: any) {
          set({
            operationLoading: false,
            error: error.message || '取消失败',
          });
          message.error(error.message || '取消失败');
        }
      },

      /**
       * 加载步骤列表
       */
      loadSteps: async (ebrId: string) => {
        set({ loading: true, error: null });

        try {
          const response = await ebrApi.getSteps(ebrId);

          if ((response as any).code === 200) {
            set({
              currentSteps: response.data,
              loading: false,
            });
          } else {
            set({
              loading: false,
              error: (response as any).message || '加载失败',
            });
            message.error((response as any).message || '加载失败');
          }
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '加载失败',
          });
          message.error(error.message || '加载失败');
        }
      },

      /**
       * 开始步骤
       */
      startStep: async (data: StepOperationDTO) => {
        set({ stepOperationLoading: true, error: null });

        try {
          const response = await ebrApi.startStep({
            ebrId: data.ebrId,
            stepId: data.stepId,
            operatorId: data.operatorId || 'current-user',
            operatorName: data.operatorName || '当前用户',
            operationType: 'START',
            operationTime: new Date().toISOString(),
            remark: data.remark,
          });

          if ((response as any).code === 200) {
            await get().loadSteps(data.ebrId);
            message.success('步骤已开始执行！');
            set({ stepOperationLoading: false });
          } else {
            set({
              stepOperationLoading: false,
              error: (response as any).message || '启动失败',
            });
            message.error((response as any).message || '启动失败');
          }
        } catch (error: any) {
          set({
            stepOperationLoading: false,
            error: error.message || '启动失败',
          });
          message.error(error.message || '启动失败');
        }
      },

      /**
       * 完成步骤
       */
      completeStep: async (data: StepOperationDTO) => {
        set({ stepOperationLoading: true, error: null });

        try {
          const response = await ebrApi.completeStep({
            ebrId: data.ebrId,
            stepId: data.stepId,
            operatorId: data.operatorId || 'current-user',
            operatorName: data.operatorName || '当前用户',
            operationType: 'COMPLETE',
            operationTime: new Date().toISOString(),
            remark: data.remark,
          });

          if ((response as any).code === 200) {
            await get().loadSteps(data.ebrId);
            message.success('步骤已完成！');
            set({ stepOperationLoading: false });
          } else {
            set({
              stepOperationLoading: false,
              error: (response as any).message || '完成失败',
            });
            message.error((response as any).message || '完成失败');
          }
        } catch (error: any) {
          set({
            stepOperationLoading: false,
            error: error.message || '完成失败',
          });
          message.error(error.message || '完成失败');
        }
      },

      /**
       * 暂停步骤
       */
      pauseStep: async (data: StepOperationDTO) => {
        set({ stepOperationLoading: true, error: null });

        try {
          const response = await ebrApi.pauseStep({
            ebrId: data.ebrId,
            stepId: data.stepId,
            operatorId: data.operatorId || 'current-user',
            operatorName: data.operatorName || '当前用户',
            operationType: 'PAUSE',
            operationTime: new Date().toISOString(),
            remark: data.remark,
          });

          if ((response as any).code === 200) {
            await get().loadSteps(data.ebrId);
            message.success('步骤已暂停！');
            set({ stepOperationLoading: false });
          } else {
            set({
              stepOperationLoading: false,
              error: (response as any).message || '暂停失败',
            });
            message.error((response as any).message || '暂停失败');
          }
        } catch (error: any) {
          set({
            stepOperationLoading: false,
            error: error.message || '暂停失败',
          });
          message.error(error.message || '暂停失败');
        }
      },

      /**
       * 跳过步骤
       */
      skipStep: async (data: StepOperationDTO) => {
        set({ stepOperationLoading: true, error: null });

        try {
          const response = await ebrApi.skipStep({
            ebrId: data.ebrId,
            stepId: data.stepId,
            operatorId: data.operatorId || 'current-user',
            operatorName: data.operatorName || '当前用户',
            operationType: 'SKIP',
            operationTime: new Date().toISOString(),
            remark: data.remark,
          });

          if ((response as any).code === 200) {
            await get().loadSteps(data.ebrId);
            message.success('步骤已跳过！');
            set({ stepOperationLoading: false });
          } else {
            set({
              stepOperationLoading: false,
              error: (response as any).message || '跳过失败',
            });
            message.error((response as any).message || '跳过失败');
          }
        } catch (error: any) {
          set({
            stepOperationLoading: false,
            error: error.message || '跳过失败',
          });
          message.error(error.message || '跳过失败');
        }
      },

      /**
       * 审批步骤
       */
      approveStep: async (data: StepOperationDTO) => {
        set({ stepOperationLoading: true, error: null });

        try {
          const response = await ebrApi.approveStep({
            ebrId: data.ebrId,
            stepId: data.stepId,
            operatorId: data.operatorId || 'current-user',
            operatorName: data.operatorName || '当前用户',
            operationType: 'APPROVE',
            operationTime: new Date().toISOString(),
            remark: data.remark,
          });

          if ((response as any).code === 200) {
            await get().loadSteps(data.ebrId);
            message.success('步骤已审批通过！');
            set({ stepOperationLoading: false });
          } else {
            set({
              stepOperationLoading: false,
              error: (response as any).message || '审批失败',
            });
            message.error((response as any).message || '审批失败');
          }
        } catch (error: any) {
          set({
            stepOperationLoading: false,
            error: error.message || '审批失败',
          });
          message.error(error.message || '审批失败');
        }
      },

      /**
       * 记录数据
       */
      recordData: async (recordId: string, data: DataRecordDTO) => {
        set({ stepOperationLoading: true, error: null });

        try {
          const response = await ebrApi.recordData(recordId, data as any);

          if ((response as any).code === 200) {
            message.success('数据记录成功！');
            set({ stepOperationLoading: false });
          } else {
            set({
              stepOperationLoading: false,
              error: (response as any).message || '记录失败',
            });
            message.error((response as any).message || '记录失败');
          }
        } catch (error: any) {
          set({
            stepOperationLoading: false,
            error: error.message || '记录失败',
          });
          message.error(error.message || '记录失败');
        }
      },

      /**
       * 加载设备使用记录
       */
      loadEquipmentUsage: async (ebrId: string) => {
        set({ loading: true, error: null });

        try {
          const response = await ebrApi.getEquipmentUsage(ebrId);

          if ((response as any).code === 200) {
            set({
              equipmentUsageList: response.data,
              loading: false,
            });
          } else {
            set({
              loading: false,
              error: (response as any).message || '加载失败',
            });
            message.error((response as any).message || '加载失败');
          }
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '加载失败',
          });
          message.error(error.message || '加载失败');
        }
      },

      /**
       * 添加设备使用记录
       */
      addEquipmentUsage: async (ebrId: string, data: EquipmentUsageDTO) => {
        set({ operationLoading: true, error: null });

        try {
          const response = await ebrApi.addEquipmentUsage(ebrId, data as any);

          if ((response as any).code === 200) {
            await get().loadEquipmentUsage(ebrId);
            message.success('设备使用记录已添加！');
            set({ operationLoading: false });
          } else {
            set({
              operationLoading: false,
              error: (response as any).message || '添加失败',
            });
            message.error((response as any).message || '添加失败');
          }
        } catch (error: any) {
          set({
            operationLoading: false,
            error: error.message || '添加失败',
          });
          message.error(error.message || '添加失败');
        }
      },

      /**
       * 结束设备使用
       */
      endEquipmentUsage: async (usageId: string) => {
        set({ operationLoading: true, error: null });

        try {
          const response = await ebrApi.endEquipmentUsage(usageId);

          if ((response as any).code === 200) {
            // 需要从当前设备使用记录中找到对应的ebrId来刷新列表
            const { equipmentUsageList } = get();
            const currentRecord = equipmentUsageList.find(u => u.id === usageId);
            if (currentRecord && currentRecord.ebrId) {
              await get().loadEquipmentUsage(currentRecord.ebrId);
            }
            message.success('设备使用已结束！');
            set({ operationLoading: false });
          } else {
            set({
              operationLoading: false,
              error: (response as any).message || '结束失败',
            });
            message.error((response as any).message || '结束失败');
          }
        } catch (error: any) {
          set({
            operationLoading: false,
            error: error.message || '结束失败',
          });
          message.error(error.message || '结束失败');
        }
      },

      /**
       * 加载物料平衡记录
       */
      loadMaterialBalance: async (ebrId: string) => {
        set({ loading: true, error: null });

        try {
          const response = await ebrApi.getMaterialBalance(ebrId);

          if ((response as any).code === 200) {
            set({
              materialBalanceList: response.data,
              loading: false,
            });
          } else {
            set({
              loading: false,
              error: (response as any).message || '加载失败',
            });
            message.error((response as any).message || '加载失败');
          }
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '加载失败',
          });
          message.error(error.message || '加载失败');
        }
      },

      /**
       * 重新计算平衡
       */
      recalculateBalance: async (ebrId: string) => {
        set({ operationLoading: true, error: null });

        try {
          const response = await ebrApi.recalculateBalance(ebrId);

          if ((response as any).code === 200) {
            await get().loadMaterialBalance(ebrId);
            message.success('物料平衡已重新计算！');
            set({ operationLoading: false });
          } else {
            set({
              operationLoading: false,
              error: (response as any).message || '计算失败',
            });
            message.error((response as any).message || '计算失败');
          }
        } catch (error: any) {
          set({
            operationLoading: false,
            error: error.message || '计算失败',
          });
          message.error(error.message || '计算失败');
        }
      },

      /**
       * 调整差异
       */
      adjustVariance: async (balanceId: string, reason: string) => {
        set({ operationLoading: true, error: null });

        try {
          const response = await ebrApi.adjustVariance(balanceId, reason);

          if ((response as any).code === 200) {
            // 需要从当前物料平衡记录中找到对应的ebrId来刷新列表
            const { materialBalanceList } = get();
            const currentRecord = materialBalanceList.find(b => b.id === balanceId);
            if (currentRecord && currentRecord.ebrId) {
              await get().loadMaterialBalance(currentRecord.ebrId);
            }
            message.success('差异调整成功！');
            set({ operationLoading: false });
          } else {
            set({
              operationLoading: false,
              error: (response as any).message || '调整失败',
            });
            message.error((response as any).message || '调整失败');
          }
        } catch (error: any) {
          set({
            operationLoading: false,
            error: error.message || '调整失败',
          });
          message.error(error.message || '调整失败');
        }
      },

      /**
       * 设置活动标签页
       */
      setActiveTab: (tab: 'list' | 'steps' | 'equipment' | 'balance') => {
        set({ activeTab: tab });
      },

      /**
       * 显示创建弹窗
       */
      setShowCreateModal: (show: boolean) => {
        set({ showCreateModal: show, currentRecord: null });
      },

      /**
       * 显示编辑弹窗
       */
      setShowEditModal: (show: boolean) => {
        set({ showEditModal: show });
      },

      /**
       * 重置状态
       */
      reset: () => {
        set({
          ebrRecords: [],
          total: 0,
          loading: false,
          error: null,
          query: {
            current: 1,
            pageSize: 15,
          },
          filters: {},
          selectedIds: [],
          selectedRecords: [],
          currentRecord: null,
          currentSteps: [],
          showDetailDrawer: false,
          currentStep: null,
          showStepModal: false,
          equipmentUsageList: [],
          showEquipmentDrawer: false,
          materialBalanceList: [],
          showBalanceDrawer: false,
          operationLoading: false,
          stepOperationLoading: false,
          activeTab: 'list',
          showCreateModal: false,
          showEditModal: false,
        });
      },
    }),
    {
      name: 'ebr-store',
      // 只持久化核心状态
      partialize: (state) => ({
        ebrRecords: state.ebrRecords,
        query: state.query,
        filters: state.filters,
        activeTab: state.activeTab,
      }),
    }
  )
);

export default useEBRStore;
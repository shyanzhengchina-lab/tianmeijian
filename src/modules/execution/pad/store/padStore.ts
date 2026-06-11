/**
 * PAD (Process Area Display) 执行界面模块状态管理Store
 * 使用Zustand进行模块级状态管理
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { message } from 'antd';
import { padApi } from '../api/padApi';
import type {
  PADWorkstation,
  TaskInfo,
  EquipmentInfo,
  OperationRecord,
  PADOperationDTO,
  TaskExecutionDTO,
  EquipmentControlDTO,
  QualityCheckDTO,
  ParameterSettingDTO,
} from '../types';

/**
 * PAD Store状态接口
 */
export interface PADState {
  // 工作站状态
  currentWorkstation: PADWorkstation | null;
  workstationStatus: 'IDLE' | 'BUSY' | 'MAINTENANCE' | 'ERROR';
  loading: boolean;
  error: string | null;

  // 操作员状态
  operatorId: string | null;
  operatorName: string | null;
  operatorStatus: 'LOGGED_OUT' | 'LOGGED_IN';
  shiftId: string | null;
  shiftName: string | null;

  // 任务状态
  currentTask: TaskInfo | null;
  taskQueue: TaskInfo[];
  selectedTaskId: string | null;

  // 设备状态
  equipment: EquipmentInfo[];
  selectedEquipmentId: string | null;

  // 操作记录
  operationRecords: OperationRecord[];
  unReadNotifications: number;

  // UI状态
  activeTab: 'dashboard' | 'tasks' | 'equipment' | 'quality' | 'records';
  showTaskDetail: boolean;
  showEquipmentControl: boolean;
  showQualityCheck: boolean;
  showParameterSettings: boolean;

  // Actions
  setCurrentWorkstation: (workstation: PADWorkstation | null) => void;
  setWorkstationStatus: (status: 'IDLE' | 'BUSY' | 'MAINTENANCE' | 'ERROR') => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // 操作员操作
  login: (operatorId: string, password: string) => Promise<void>;
  logout: () => Promise<void>;

  // 任务操作
  loadWorkstationData: () => Promise<void>;
  loadTasks: () => Promise<void>;
  selectTask: (taskId: string) => Promise<void>;
  startTask: (data: TaskExecutionDTO) => Promise<void>;
  pauseTask: (data: TaskExecutionDTO) => Promise<void>;
  resumeTask: (data: TaskExecutionDTO) => Promise<void>;
  completeTask: (data: TaskExecutionDTO) => Promise<void>;
  abortTask: (data: TaskExecutionDTO) => Promise<void>;

  // 设备操作
  loadEquipment: () => Promise<void>;
  selectEquipment: (equipmentId: string) => void;
  startEquipment: (data: EquipmentControlDTO) => Promise<void>;
  stopEquipment: (data: EquipmentControlDTO) => Promise<void>;
  pauseEquipment: (data: EquipmentControlDTO) => Promise<void>;
  resetEquipment: (data: EquipmentControlDTO) => Promise<void>;
  setEquipmentParams: (data: ParameterSettingDTO) => Promise<void>;

  // 质量操作
  loadQualityChecks: () => Promise<void>;
  performQualityCheck: (data: QualityCheckDTO) => Promise<void>;
  uploadQualityData: (data: any) => Promise<void>;

  // 记录操作
  loadOperationRecords: () => Promise<void>;
  recordOperation: (data: PADOperationDTO) => Promise<void>;

  // UI操作
  setActiveTab: (tab: 'dashboard' | 'tasks' | 'equipment' | 'quality' | 'records') => void;
  setShowTaskDetail: (show: boolean) => void;
  setShowEquipmentControl: (show: boolean) => void;
  setShowQualityCheck: (show: boolean) => void;
  setShowParameterSettings: (show: boolean) => void;

  // 刷新操作
  refreshData: () => Promise<void>;
  markNotificationsRead: () => void;

  reset: () => void;
}

/**
 * PAD Store
 */
export const usePADStore = create<PADState>()(
  persist(
    (set, get) => ({
      // 初始状态
      currentWorkstation: null,
      workstationStatus: 'IDLE',
      loading: false,
      error: null,

      operatorId: null,
      operatorName: null,
      operatorStatus: 'LOGGED_OUT',
      shiftId: null,
      shiftName: null,

      currentTask: null,
      taskQueue: [],
      selectedTaskId: null,

      equipment: [],
      selectedEquipmentId: null,

      operationRecords: [],
      unReadNotifications: 0,

      activeTab: 'dashboard',
      showTaskDetail: false,
      showEquipmentControl: false,
      showQualityCheck: false,
      showParameterSettings: false,

      /**
       * 设置当前工作站
       */
      setCurrentWorkstation: (workstation: PADWorkstation | null) => {
        set({ currentWorkstation: workstation });
      },

      /**
       * 设置工作站状态
       */
      setWorkstationStatus: (status: 'IDLE' | 'BUSY' | 'MAINTENANCE' | 'ERROR') => {
        set({ workstationStatus: status });
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
       * 操作员登录
       */
      login: async (operatorId: string, password: string) => {
        set({ loading: true, error: null });

        try {
          // TODO: 调用API登录
          // const response = await padApi.login(operatorId, password);

          // if (response.code === 200) {
          //   const { operatorInfo, shiftInfo } = response.data;
          //   set({
          //     operatorId: operatorInfo.id,
          //     operatorName: operatorInfo.name,
          //     operatorStatus: 'LOGGED_IN',
          //     shiftId: shiftInfo.id,
          //     shiftName: shiftInfo.name,
          //     loading: false,
          //   });
          //   message.success(`欢迎，${operatorInfo.name}！`);
          // } else {
          //   set({
          //     loading: false,
          //     error: response.message || '登录失败',
          //   });
          // }

          // 模拟登录过程
          setTimeout(() => {
            set({
              operatorId: operatorId,
              operatorName: '操作员',
              operatorStatus: 'LOGGED_IN',
              shiftId: 'shift-001',
              shiftName: '白班',
              loading: false,
            });
            message.success('登录成功！');
          }, 1000);
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '登录失败',
          });
        }
      },

      /**
       * 操作员退出
       */
      logout: async () => {
        set({ loading: true });

        try {
          // TODO: 调用API退出
          // const response = await padApi.logout();

          // if (response.code === 200) {
          //   set({
          //     operatorId: null,
          //     operatorName: null,
          //     operatorStatus: 'LOGGED_OUT',
          //     shiftId: null,
          //     shiftName: null,
          //     currentTask: null,
          //     loading: false,
          //   });
          //   message.success('退出成功！');
          // }

          // 模拟退出过程
          setTimeout(() => {
            set({
              operatorId: null,
              operatorName: null,
              operatorStatus: 'LOGGED_OUT',
              shiftId: null,
              shiftName: null,
              currentTask: null,
              loading: false,
            });
            message.success('退出成功！');
          }, 500);
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '退出失败',
          });
        }
      },

      /**
       * 加载工作站数据
       */
      loadWorkstationData: async () => {
        set({ loading: true, error: null });

        try {
          // TODO: 调用API加载工作站数据
          // const response = await padApi.getWorkstationData();

          // if (response.code === 200) {
          //   set({
          //     currentWorkstation: response.data.workstation,
          //     taskQueue: response.data.tasks,
          //     equipment: response.data.equipment,
          //     statistics: response.data.statistics,
          //     notifications: response.data.notifications,
          //     loading: false,
          //   });
          // }

          // 模拟加载过程
          setTimeout(() => {
            set({
              loading: false,
            });
          }, 500);
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '加载失败',
          });
        }
      },

      /**
       * 加载任务列表
       */
      loadTasks: async () => {
        set({ loading: true, error: null });

        try {
          // TODO: 调用API加载任务列表
          // const response = await padApi.getTasks();

          // if (response.code === 200) {
          //   set({
          //     taskQueue: response.data,
          //     loading: false,
          //   });
          // }

          // 模拟加载过程
          setTimeout(() => {
            set({
              taskQueue: [],
              loading: false,
            });
          }, 500);
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '加载失败',
          });
        }
      },

      /**
       * 选择任务
       */
      selectTask: async (taskId: string) => {
        set({ loading: true, selectedTaskId: taskId });

        try {
          // TODO: 调用API选择任务
          // const response = await padApi.selectTask(taskId);

          // if (response.code === 200) {
          //   set({
          //     currentTask: response.data,
          //     workstationStatus: 'BUSY',
          //     loading: false,
          //   });
          //   message.success('任务已选择！');
          // }

          // 模拟选择过程
          setTimeout(() => {
            set({
              currentTask: {
                id: taskId,
                taskNo: 'TASK-001',
                status: 'PENDING',
                progress: 0,
              } as TaskInfo,
              workstationStatus: 'BUSY',
              loading: false,
            });
            message.success('任务已选择！');
          }, 500);
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '选择任务失败',
          });
        }
      },

      /**
       * 开始任务
       */
      startTask: async (data: TaskExecutionDTO) => {
        set({ loading: true, error: null });

        try {
          const response = await padApi.startTask(data.taskId, data.operatorId);

          if (response.code === 200) {
            await get().loadTasks();
            if (get().currentTask) {
              set({
                currentTask: { ...get().currentTask!, status: 'IN_PROGRESS' },
                loading: false,
              });
            }
            message.success('任务已开始！');
          } else {
            set({
              loading: false,
              error: response.message || '开始任务失败',
            });
            message.error(response.message || '开始任务失败');
          }
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '开始任务失败',
          });
          message.error(error.message || '开始任务失败');
        }
      },

      /**
       * 暂停任务
       */
      pauseTask: async (data: TaskExecutionDTO) => {
        set({ loading: true, error: null });

        try {
          // TODO: 调用API暂停任务
          // const response = await padApi.pauseTask(data);

          // if (response.code === 200) {
          //   await get().loadTasks();
          //   message.success('任务已暂停！');
          // }

          // 模拟暂停任务过程
          setTimeout(() => {
            if (get().currentTask) {
              set({
                currentTask: { ...get().currentTask!, status: 'PAUSED' },
                loading: false,
              });
            }
            message.success('任务已暂停！');
          }, 500);
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '暂停任务失败',
          });
        }
      },

      /**
       * 恢复任务
       */
      resumeTask: async (data: TaskExecutionDTO) => {
        set({ loading: true, error: null });

        try {
          // TODO: 调用API恢复任务
          // const response = await padApi.resumeTask(data);

          // if (response.code === 200) {
          //   await get().loadTasks();
          //   message.success('任务已恢复！');
          // }

          // 模拟恢复任务过程
          setTimeout(() => {
            if (get().currentTask) {
              set({
                currentTask: { ...get().currentTask!, status: 'IN_PROGRESS' },
                loading: false,
              });
            }
            message.success('任务已恢复！');
          }, 500);
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '恢复任务失败',
          });
        }
      },

      /**
       * 完成任务
       */
      completeTask: async (data: TaskExecutionDTO) => {
        set({ loading: true, error: null });

        try {
          const response = await padApi.completeTask(
            data.taskId,
            data.operatorId,
            data.completedQty || 0
          );

          if (response.code === 200) {
            await get().loadTasks();
            set({
              currentTask: null,
              workstationStatus: 'IDLE',
              loading: false,
            });
            message.success('任务已完成！');
          } else {
            set({
              loading: false,
              error: response.message || '完成任务失败',
            });
            message.error(response.message || '完成任务失败');
          }
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '完成任务失败',
          });
          message.error(error.message || '完成任务失败');
        }
      },

      /**
       * 中止任务
       */
      abortTask: async (data: TaskExecutionDTO) => {
        set({ loading: true, error: null });

        try {
          // TODO: 调用API中止任务
          // const response = await padApi.abortTask(data);

          // if (response.code === 200) {
          //   await get().loadTasks();
          //   set({ currentTask: null });
          //   message.success('任务已中止！');
          // }

          // 模拟中止任务过程
          setTimeout(() => {
            set({
              currentTask: null,
              workstationStatus: 'IDLE',
              loading: false,
            });
            message.success('任务已中止！');
          }, 500);
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '中止任务失败',
          });
        }
      },

      /**
       * 加载设备列表
       */
      loadEquipment: async () => {
        set({ loading: true, error: null });

        try {
          // TODO: 调用API加载设备列表
          // const response = await padApi.getEquipment();

          // if (response.code === 200) {
          //   set({
          //     equipment: response.data,
          //     loading: false,
          //   });
          // }

          // 模拟加载过程
          setTimeout(() => {
            set({
              equipment: [],
              loading: false,
            });
          }, 500);
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '加载失败',
          });
        }
      },

      /**
       * 选择设备
       */
      selectEquipment: (equipmentId: string) => {
        set({ selectedEquipmentId: equipmentId });
      },

      /**
       * 启动设备
       */
      startEquipment: async (data: EquipmentControlDTO) => {
        set({ loading: true, error: null });

        try {
          // TODO: 调用API启动设备
          // const response = await padApi.startEquipment(data);

          // if (response.code === 200) {
          //   await get().loadEquipment();
          //   message.success('设备已启动！');
          // }

          // 模拟启动设备过程
          setTimeout(() => {
            message.success('设备已启动！');
            set({ loading: false });
          }, 500);
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '启动设备失败',
          });
        }
      },

      /**
       * 停止设备
       */
      stopEquipment: async (data: EquipmentControlDTO) => {
        set({ loading: true, error: null });

        try {
          // TODO: 调用API停止设备
          // const response = await padApi.stopEquipment(data);

          // if (response.code === 200) {
          //   await get().loadEquipment();
          //   message.success('设备已停止！');
          // }

          // 模拟停止设备过程
          setTimeout(() => {
            message.success('设备已停止！');
            set({ loading: false });
          }, 500);
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '停止设备失败',
          });
        }
      },

      /**
       * 暂停设备
       */
      pauseEquipment: async (data: EquipmentControlDTO) => {
        set({ loading: true, error: null });

        try {
          // TODO: 调用API暂停设备
          // const response = await padApi.pauseEquipment(data);

          // if (response.code === 200) {
          //   await get().loadEquipment();
          //   message.success('设备已暂停！');
          // }

          // 模拟暂停设备过程
          setTimeout(() => {
            message.success('设备已暂停！');
            set({ loading: false });
          }, 500);
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '暂停设备失败',
          });
        }
      },

      /**
       * 复位设备
       */
      resetEquipment: async (data: EquipmentControlDTO) => {
        set({ loading: true, error: null });

        try {
          // TODO: 调用API复位设备
          // const response = await padApi.resetEquipment(data);

          // if (response.code === 200) {
          //   await get().loadEquipment();
          //   message.success('设备已复位！');
          // }

          // 模拟复位设备过程
          setTimeout(() => {
            message.success('设备已复位！');
            set({ loading: false });
          }, 500);
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '复位设备失败',
          });
        }
      },

      /**
       * 设置设备参数
       */
      setEquipmentParams: async (data: ParameterSettingDTO) => {
        set({ loading: true, error: null });

        try {
          // TODO: 调用API设置参数
          // const response = await padApi.setEquipmentParams(data);

          // if (response.code === 200) {
          //   await get().loadEquipment();
          //   message.success('参数设置成功！');
          // }

          // 模拟设置过程
          setTimeout(() => {
            message.success('参数设置成功！');
            set({ loading: false, showParameterSettings: false });
          }, 500);
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '参数设置失败',
          });
        }
      },

      /**
       * 加载质量检查点
       */
      loadQualityChecks: async () => {
        set({ loading: true, error: null });

        try {
          // TODO: 调用API加载质量检查点
          // const response = await padApi.getQualityChecks();

          // if (response.code === 200) {
          //   if (get().currentTask) {
          //     set({
          //       currentTask: { ...get().currentTask!, qualityChecks: response.data },
          //       loading: false,
          //     });
          //   }
          // }

          // 模拟加载过程
          setTimeout(() => {
            set({ loading: false });
          }, 500);
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '加载失败',
          });
        }
      },

      /**
       * 执行质量检查
       */
      performQualityCheck: async (data: QualityCheckDTO) => {
        set({ loading: true, error: null });

        try {
          // TODO: 调用API执行质量检查
          // const response = await padApi.performQualityCheck(data);

          // if (response.code === 200) {
          //   await get().loadQualityChecks();
          //   message.success('质量检查已完成！');
          // }

          // 模拟检查过程
          setTimeout(() => {
            message.success('质量检查已完成！');
            set({ loading: false, showQualityCheck: false });
          }, 500);
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '质量检查失败',
          });
        }
      },

      /**
       * 上传质量数据
       */
      uploadQualityData: async (data: any) => {
        set({ loading: true, error: null });

        try {
          // TODO: 调用API上传质量数据
          // const response = await padApi.uploadQualityData(data);

          // if (response.code === 200) {
          //   await get().loadQualityChecks();
          //   message.success('质量数据已上传！');
          // }

          // 模拟上传过程
          setTimeout(() => {
            message.success('质量数据已上传！');
            set({ loading: false });
          }, 1000);
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '上传失败',
          });
        }
      },

      /**
       * 加载操作记录
       */
      loadOperationRecords: async () => {
        set({ loading: true, error: null });

        try {
          // TODO: 调用API加载操作记录
          // const response = await padApi.getOperationRecords();

          // if (response.code === 200) {
          //   set({
          //     operationRecords: response.data,
          //     loading: false,
          //   });
          // }

          // 模拟加载过程
          setTimeout(() => {
            set({
              operationRecords: [],
              loading: false,
            });
          }, 500);
        } catch (error: any) {
          set({
            loading: false,
            error: error.message || '加载失败',
          });
        }
      },

      /**
       * 记录操作
       */
      recordOperation: async (data: PADOperationDTO) => {
        set({ loading: true });

        try {
          // TODO: 调用API记录操作
          // await padApi.recordOperation(data);

          set({ loading: false });
        } catch (error: any) {
          console.error('记录操作失败:', error);
          set({ loading: false });
        }
      },

      /**
       * 刷新数据
       */
      refreshData: async () => {
        await get().loadWorkstationData();
        await get().loadTasks();
        await get().loadEquipment();
        await get().loadOperationRecords();
      },

      /**
       * 标记通知已读
       */
      markNotificationsRead: () => {
        set({ unReadNotifications: 0 });
      },

      /**
       * 设置活动标签页
       */
      setActiveTab: (tab: 'dashboard' | 'tasks' | 'equipment' | 'quality' | 'records') => {
        set({ activeTab: tab });
      },

      /**
       * 显示任务详情
       */
      setShowTaskDetail: (show: boolean) => {
        set({ showTaskDetail: show });
      },

      /**
       * 显示设备控制
       */
      setShowEquipmentControl: (show: boolean) => {
        set({ showEquipmentControl: show });
      },

      /**
       * 显示质量检查
       */
      setShowQualityCheck: (show: boolean) => {
        set({ showQualityCheck: show });
      },

      /**
       * 显示参数设置
       */
      setShowParameterSettings: (show: boolean) => {
        set({ showParameterSettings: show });
      },

      /**
       * 重置状态
       */
      reset: () => {
        set({
          currentWorkstation: null,
          workstationStatus: 'IDLE',
          loading: false,
          error: null,
          operatorId: null,
          operatorName: null,
          operatorStatus: 'LOGGED_OUT',
          shiftId: null,
          shiftName: null,
          currentTask: null,
          taskQueue: [],
          selectedTaskId: null,
          equipment: [],
          selectedEquipmentId: null,
          operationRecords: [],
          unReadNotifications: 0,
          activeTab: 'dashboard',
          showTaskDetail: false,
          showEquipmentControl: false,
          showQualityCheck: false,
          showParameterSettings: false,
        });
      },
    }),
    {
      name: 'pad-store',
      // 只持久化部分状态
      partialize: (state) => ({
        operatorId: state.operatorId,
        operatorName: state.operatorName,
        operatorStatus: state.operatorStatus,
        shiftId: state.shiftId,
        shiftName: state.shiftName,
      }),
    }
  )
);

export default usePADStore;
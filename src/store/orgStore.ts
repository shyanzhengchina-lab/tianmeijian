/**
 * orgStore.ts — 多组织上下文 Store (Zustand)
 * ================================================================
 * 支持南京工厂(NJ) / 溧水工厂(LS) 双工厂切换
 * 基础数据（物料、工序、工艺路线）在集团层面共享，
 * 也可以按工厂/车间分配/过滤。
 * ================================================================
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ── 工厂定义 ──────────────────────────────────────────────────────
export interface FactoryDef {
  code: string;
  name: string;
  shortName: string;
  color: string;
  bgColor: string;
  city: string;
  address: string;
  contact: string;
  workshops: WorkshopDef[];
}

export interface WorkshopDef {
  code: string;        // GD / RN / YQ / WB
  name: string;
  icon: string;
  color: string;
  dosageForms: string[];
}

export const FACTORY_LIST: FactoryDef[] = [
  {
    code: 'ALL',
    name: '集团总部',
    shortName: '集团',
    color: '#1677FF',
    bgColor: '#E6F4FF',
    city: '',
    address: '',
    contact: '',
    workshops: [],
  },
  {
    code: 'NJ',
    name: '天美健大自然生物工程（南京）有限公司',
    shortName: '南京工厂',
    color: '#C8000A',
    bgColor: '#FFF1F0',
    city: '南京',
    address: '南京市江宁经济技术开发区',
    contact: '王建国 | 025-8888-0001',
    workshops: [
      { code: 'NJ-GD', name: '固体车间',   icon: '💊', color: '#1677FF', dosageForms: ['片剂', '咀嚼片'] },
      { code: 'NJ-RN', name: '软胶囊车间', icon: '🔵', color: '#722ED1', dosageForms: ['软胶囊'] },
      { code: 'NJ-WB', name: '外包车间',   icon: '📦', color: '#FA8C16', dosageForms: ['赋码包装'] },
    ],
  },
  {
    code: 'LS',
    name: '每日营养（溧水）健康科技有限公司',
    shortName: '溧水工厂',
    color: '#7B3FA0',
    bgColor: '#F9F0FF',
    city: '溧水',
    address: '南京市溧水区开发区',
    contact: '刘志强 | 025-5566-0001',
    workshops: [
      { code: 'LS-GD', name: '固体车间(粉剂)', icon: '🌾', color: '#13C2C2', dosageForms: ['粉剂', '颗粒剂'] },
      { code: 'LS-YQ', name: '液体车间',       icon: '🧪', color: '#52C41A', dosageForms: ['口服液'] },
      { code: 'LS-WB', name: '外包车间',       icon: '📦', color: '#FA8C16', dosageForms: ['赋码包装'] },
    ],
  },
];

// ── 数据共享级别 ──────────────────────────────────────────────────
export type DataShareLevel = 'GROUP' | 'FACTORY' | 'WORKSHOP';

export interface DataShareConfig {
  /** 基础物料档案：集团共享 */
  material: 'GROUP';
  /** 工序主数据：集团共享，可按工厂分配 */
  operation: 'GROUP';
  /** 工艺路线：工厂级别，不跨厂共享 */
  processRouting: 'FACTORY';
  /** 员工档案：工厂级别 */
  employee: 'FACTORY';
  /** 设备档案：车间级别 */
  equipment: 'WORKSHOP';
  /** 生产工单：车间级别 */
  workOrder: 'WORKSHOP';
}

// ── Store 接口 ────────────────────────────────────────────────────
interface OrgState {
  currentFactory: string;      // 'ALL' | 'NJ' | 'LS'
  currentWorkshop: string;     // '' | 'NJ-GD' | 'NJ-RN' | 'LS-GD' | 'LS-YQ' | ...

  setFactory: (code: string) => void;
  setWorkshop: (code: string) => void;

  getFactoryDef: () => FactoryDef | undefined;
  getWorkshopDef: () => WorkshopDef | undefined;

  /** 根据当前工厂过滤工序/工艺路线 */
  filterByFactory: <T extends { factoryCode?: string }>(items: T[]) => T[];
}

export const useOrgStore = create<OrgState>()(
  persist(
    (set, get) => ({
      currentFactory:  'ALL',
      currentWorkshop: '',

      setFactory: (code) => set({ currentFactory: code, currentWorkshop: '' }),
      setWorkshop: (code) => set({ currentWorkshop: code }),

      getFactoryDef: () =>
        FACTORY_LIST.find(f => f.code === get().currentFactory),

      getWorkshopDef: () => {
        const ws = get().currentWorkshop;
        for (const f of FACTORY_LIST) {
          const found = f.workshops.find(w => w.code === ws);
          if (found) return found;
        }
        return undefined;
      },

      filterByFactory: (items) => {
        const fc = get().currentFactory;
        if (fc === 'ALL') return items;
        return items.filter(i => !i.factoryCode || i.factoryCode === fc);
      },
    }),
    { name: 'tmj-org-context' }
  )
);

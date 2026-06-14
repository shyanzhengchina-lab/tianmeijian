import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { getProcessRoutingList } from '../../api/processRoutings';
import {
  Table, Button, Input, Select, Space, Tag, Popconfirm, message,
  Row, Col, Modal, Form, Tooltip, Badge, Alert, Switch, Descriptions, Divider, Drawer, Dropdown,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { MenuProps } from 'antd';
import {
  PlusOutlined, DeleteOutlined, StopOutlined, CheckCircleOutlined,
  SearchOutlined, ReloadOutlined, EditOutlined, CopyOutlined,
  ExclamationCircleOutlined, EyeOutlined, HistoryOutlined,
  RiseOutlined, BranchesOutlined, SyncOutlined,
  PlayCircleOutlined, InboxOutlined, AppstoreOutlined, LinkOutlined,
  CheckOutlined, AuditOutlined, RollbackOutlined, PoweroffOutlined, WarningOutlined,
  MoreOutlined,
} from '@ant-design/icons';
import {
  RoutingMaster, RMStatus, RM_STATUS_MAP, VARIANT_TYPE_MAP,
  mockRoutingMasters,
  rmCanEdit, rmCanAudit, rmCanUnaudit, rmCanEnable, rmCanDisable,
  rmCanReEnable, rmCanUpgrade, rmCanArchive, rmCanDelete, rmCanCopy,
} from './seriesData';
import { useSeriesContext } from './SeriesContext';
import UpgradeVersionModal from './UpgradeVersionModal';
import VersionHistoryModal from './VersionHistoryModal';
import CopyVariantModal from './CopyVariantModal';
import SyncDiffModal from './SyncDiffModal';
import './ProPage.css';

interface Props {
  onViewDetail?: (rm: RoutingMaster) => void;
  onNavigateToSeries?: () => void;   // 跳转到「产品系列档案」页面
  initialHighlightCode?: string;     // 从工单跳转时预充搜索并高亮指定路径编码
}

// ── 数据版本号：每次 mockRoutingMasters 有重大更新时递增，触发强制刷新 ──
const ROUTINGS_DATA_VERSION = 'v20260614-2';

const RoutingMasterListPage: React.FC<Props> = ({ onViewDetail, onNavigateToSeries, initialHighlightCode }) => {
  // bip_routings 默认使用 mockRoutingMasters，包含 GMP-PACKAGE-V1 等完整工序数据
  const [rawRoutings, setRoutings] = useLocalStorage<RoutingMaster[]>('bip_routings', mockRoutingMasters);

  // ── 版本化强制刷新：检测到版本变化时用 mockRoutingMasters 重置缓存 ──
  useEffect(() => {
    const storedVer = localStorage.getItem('bip_routings_data_ver');
    if (storedVer !== ROUTINGS_DATA_VERSION) {
      // 版本不匹配：强制重置为最新 mock 数据（保留用户在 mock 之外手动新增的条目）
      const userAdded = rawRoutings.filter(
        r => !mockRoutingMasters.some(m => m.routingCode === r.routingCode && m.version === r.version)
      );
      setRoutings([...mockRoutingMasters, ...userAdded]);
      localStorage.setItem('bip_routings_data_ver', ROUTINGS_DATA_VERSION);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 运行时补全：修复缓存中 groups 为空的条目（兜底）
  const routings = rawRoutings.map(r => {
    if (!r.groups || r.groups.length === 0) {
      const fallback = mockRoutingMasters.find(m => m.routingCode === r.routingCode && m.version === r.version);
      if (fallback && fallback.groups && fallback.groups.length > 0) {
        return { ...r, groups: fallback.groups, opCount: fallback.opCount, totalTimeMin: fallback.totalTimeMin };
      }
    }
    return r;
  });

  // ── 从后端加载工艺路径列表，与本地数据去重合并 ────────────────────
  const loadFromApi = useCallback(async () => {
    try {
      const resp = await getProcessRoutingList() as any;
      const apiList: any[] = resp?.data ?? [];
      if (apiList.length > 0) {
        const newItems = apiList.map(item => ({
          routingCode: item.routeCode ?? item.code ?? item.routingCode ?? item.id?.toString() ?? '',
          routingName: item.routeName ?? item.name ?? item.routingName ?? '',
          seriesCode: item.productCode ?? '',
          status: (item.status === 'ACTIVE' || item.status === 'ENABLED' ? 'ENABLED'
                 : item.status === 'DISABLED' || item.status === 'INACTIVE' ? 'DISABLED'
                 : 'DRAFT') as RMStatus,
          variantType: 'STANDARD' as any,
          currentVersion: item.version ?? '1.0',
          remark: item.description ?? '',
          steps: [],
          createdAt: item.createTime ?? '',
          updatedAt: item.updateTime ?? '',
        } as unknown as RoutingMaster));
        setRoutings(newItems);  // API-first REPLACE
      }
    } catch { /* 后端不可用时降级到 localStorage */ }
  }, []);
  useEffect(() => { loadFromApi(); }, [loadFromApi]);

  // ── 从共享 Context 读取产品系列 ──────────────────────────────────
  const { seriesList } = useSeriesContext();
  const [searchCode, setSearchCode] = useState(initialHighlightCode || '');
  const [searchName, setSearchName] = useState('');

  // 如果有初始高亮编码，自动打开该路径的详情抽屉
  React.useEffect(() => {
    if (!initialHighlightCode) return;
    const stored = localStorage.getItem('bip_routings');
    const all: RoutingMaster[] = stored ? JSON.parse(stored) : mockRoutingMasters;
    const target = all.find(r => r.routingCode === initialHighlightCode);
    if (target) {
      setTimeout(() => {
        if (onViewDetail) {
          onViewDetail(target);
        } else {
          setViewTarget(target);
          setViewDrawerOpen(true);
        }
      }, 100);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialHighlightCode]);
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [filterSeries, setFilterSeries] = useState<string | undefined>();
  const [filterVariant, setFilterVariant] = useState<string | undefined>();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  // ── 新建/编辑 ──
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RoutingMaster | null>(null);
  const [form] = Form.useForm();

  // ── 停用弹窗 ──
  const [disableModalOpen, setDisableModalOpen] = useState(false);
  const [disableTarget, setDisableTarget] = useState<RoutingMaster | null>(null);
  const [disableForm] = Form.useForm();

  // ── 升版弹窗 ──
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgradeTarget, setUpgradeTarget] = useState<RoutingMaster | null>(null);

  // ── 历史版本弹窗 ──
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyTarget, setHistoryTarget] = useState<RoutingMaster | null>(null);

  // ── 复制变体弹窗 ──
  const [copyOpen, setCopyOpen] = useState(false);
  const [copyTarget, setCopyTarget] = useState<RoutingMaster | null>(null);

  // ── 同步差异对比弹窗 ──
  const [syncOpen, setSyncOpen]     = useState(false);
  const [syncTarget, setSyncTarget] = useState<RoutingMaster | null>(null);

  // ── 查看详情抽屉（onViewDetail 不存在时降级到内部 Drawer）──
  const [viewDrawerOpen, setViewDrawerOpen] = useState(false);
  const [viewTarget, setViewTarget]         = useState<RoutingMaster | null>(null);
  const handleView = (r: RoutingMaster) => {
    if (onViewDetail) {
      onViewDetail(r);
    } else {
      setViewTarget(r);
      setViewDrawerOpen(true);
    }
  };

  // ── 过滤 ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => routings.filter(r => {
    const codeOk    = !searchCode    || r.routingCode.toLowerCase().includes(searchCode.toLowerCase());
    const nameOk    = !searchName    || r.routingName.includes(searchName);
    const statOk    = !filterStatus  || r.status === filterStatus;
    const seriesOk  = !filterSeries  || r.seriesCode === filterSeries;
    const variantOk = !filterVariant || r.variantType === filterVariant;
    return codeOk && nameOk && statOk && seriesOk && variantOk;
  }), [routings, searchCode, searchName, filterStatus, filterSeries, filterVariant]);

  // ── 统计 ──────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total:    routings.length,
    draft:    routings.filter(r => r.status === 'DRAFT').length,
    audited:  routings.filter(r => r.status === 'AUDITED').length,
    enabled:  routings.filter(r => r.status === 'ENABLED').length,
    disabled: routings.filter(r => r.status === 'DISABLED').length,
    needSync: routings.filter(r => r.sourceNeedsSync).length,
  }), [routings]);

  // ── 弹窗中当前选中的系列（用于展示系列卡片）────────────────────────
  const [selectedSeriesCode, setSelectedSeriesCode] = useState<string | undefined>();
  const selectedSeriesInfo = useMemo(
    () => seriesList.find(s => s.seriesCode === selectedSeriesCode),
    [seriesList, selectedSeriesCode]
  );

  // ── 产品族颜色映射 ────────────────────────────────────────────────
  const FAMILY_COLORS = ['blue', 'purple', 'cyan', 'geekblue', 'magenta', 'volcano', 'gold', 'lime'];
  const allFamilies = useMemo(() => Array.from(new Set(seriesList.map(s => s.productFamily))), [seriesList]);
  const getFamilyColor = (name: string) => {
    const idx = allFamilies.indexOf(name);
    return FAMILY_COLORS[idx % FAMILY_COLORS.length] || 'default';
  };

  // ── 获取系列下拉选项（来自共享 Context，实时反映 ProductSeriesPage 的新增）──
  // 按产品族分组
  const seriesOptionsByFamily = useMemo(() => {
    const active = seriesList.filter(s => s.status === 'active');
    const groups: Record<string, typeof active> = {};
    active.forEach(s => {
      if (!groups[s.productFamily]) groups[s.productFamily] = [];
      groups[s.productFamily].push(s);
    });
    return groups;
  }, [seriesList]);

  // 扁平化选项（带 groupLabel 用于 Select optionRender）
  const seriesOptions = useMemo(() => {
    const opts: { value: string; label: string; seriesName: string; productFamily: string; defaultRoutingCode?: string }[] = [];
    Object.entries(seriesOptionsByFamily).forEach(([, items]) => {
      items.forEach(s => {
        opts.push({
          value: s.seriesCode,
          label: s.seriesCode,          // 用于 showSearch 过滤
          seriesName: s.seriesName,
          productFamily: s.productFamily,
          defaultRoutingCode: s.defaultRoutingCode,
        });
      });
    });
    return opts;
  }, [seriesOptionsByFamily]);

  // ── 新建 ──────────────────────────────────────────────────────────
  const handleAdd = () => {
    setEditingItem(null);
    setSelectedSeriesCode(undefined);
    form.resetFields();
    form.setFieldsValue({ version: 'V1.0', status: 'DRAFT', isDefault: false, variantType: 'STANDARD', bindMode: 'RANGE' });
    setModalOpen(true);
  };

  // ── 编辑 ──────────────────────────────────────────────────────────
  const handleEdit = (r: RoutingMaster) => {
    if (!rmCanEdit(r.status)) { message.warning('仅草稿状态可编辑'); return; }
    setEditingItem(r);
    setSelectedSeriesCode(r.seriesCode);
    form.setFieldsValue({ ...r });
    setModalOpen(true);
  };

  // ── 保存 ──────────────────────────────────────────────────────────
  const handleSave = () => {
    form.validateFields().then(values => {
      const now = new Date().toISOString().slice(0, 10);
      const series = seriesList.find(s => s.seriesCode === values.seriesCode);
      if (editingItem) {
        setRoutings(prev => prev.map(r =>
          r.id === editingItem.id ? { ...r, ...values, seriesName: series?.seriesName || '', updatedAt: now } : r
        ));
        message.success('修改成功');
      } else {
        const newItem: RoutingMaster = {
          ...values,
          id: `RM${Date.now()}`,
          seriesName: series?.seriesName || '',
          status: 'DRAFT',
          variantType: values.variantType || 'STANDARD',
          bindMode: values.bindMode || 'RANGE',
          opCount: 0,
          parallelGroupCount: 0,
          totalTimeMin: 0,
          history: [
            {
              id: `H${Date.now()}`,
              operationType: 'CREATE' as const,
              toVersion: values.version,
              operator: 'admin',
              operationTime: `${now} 00:00:00`,
              remark: '新建工艺路径档案',
            },
          ],
          createdBy: 'admin',
          createdAt: now,
          updatedAt: now,
        };
        setRoutings(prev => [newItem, ...prev]);
        message.success('新建成功，状态为草稿，请配置工序后提交生效');
      }
      setModalOpen(false);
    }).catch((err: any) => { if (err?.errorFields) return; });
  };

  // ── 删除 ──────────────────────────────────────────────────────────
  const handleDelete = (ids: React.Key[]) => {
    const notDraft = routings.filter(r => ids.includes(r.id) && !rmCanDelete(r.status));
    if (notDraft.length > 0) {
      message.error(`${notDraft.map(r => r.routingCode).join(', ')} 不是草稿状态，不可删除`);
      return;
    }
    setRoutings(prev => prev.filter(r => !ids.includes(r.id)));
    setSelectedRowKeys([]);
    message.success(`已删除 ${ids.length} 条工艺路径`);
  };

  // ── 审核（草稿 → 已审核）────────────────────────────────────────
  const handleAudit = (r: RoutingMaster) => {
    const now = new Date().toISOString().slice(0, 10);
    setRoutings(prev => prev.map(x =>
      x.id === r.id
        ? {
            ...x,
            // 审核即生效：直接跳过 AUDITED 状态，设置为 ENABLED
            status: 'ENABLED' as RMStatus,
            auditBy: 'admin', auditAt: now,
            auditRemark: '审核通过，自动生效',
            effectiveDate: now,
            updatedAt: now,
            history: [
              ...x.history,
              {
                id: `H${Date.now()}`, operationType: 'AUDIT' as const, toVersion: x.version,
                operator: 'admin', operationTime: `${now} 00:00:00`,
                remark: '审核通过',
              },
              {
                id: `H${Date.now() + 1}`, operationType: 'ENABLE' as const, toVersion: x.version,
                operator: 'admin', operationTime: `${now} 00:00:01`,
                remark: '审核即生效，自动启用',
              },
            ],
          }
        : x
    ));
    message.success('审核通过！工艺路径已自动生效【已启用】，可直接用于生产执行');
  };

  // ── 反审核（已审核 → 草稿）──────────────────────────────────────
  const handleUnaudit = (r: RoutingMaster) => {
    const now = new Date().toISOString().slice(0, 10);
    setRoutings(prev => prev.map(x =>
      x.id === r.id
        ? {
            ...x,
            status: 'DRAFT' as RMStatus,
            // 清除审核信息
            auditBy: undefined, auditAt: undefined, auditRemark: undefined,
            // 清除启用信息
            effectiveDate: undefined,
            // 如果是从停用状态反审核，还需清除停用字段
            disableMode: undefined, disableReason: undefined, expireDate: undefined,
            updatedAt: now,
            history: [...x.history, {
              id: `H${Date.now()}`, operationType: 'UNAUDIT' as const, toVersion: x.version,
              operator: 'admin', operationTime: `${now} 00:00:00`,
              remark: x.status === 'DISABLED'
                ? '停用状态反审核，直接退回草稿重新编辑'
                : '反审核，退回草稿',
            }],
          }
        : x
    ));
    const fromDisabled = r.status === 'DISABLED';
    message.success(
      fromDisabled
        ? '反审核成功！工艺路径已从【已停用】直接退回【草稿】，可重新编辑'
        : '反审核成功，工艺路径退回【草稿】状态，可重新编辑'
    );
  };

  // ── 启用（已审核 → 已启用）──────────────────────────────────────
  const handleEnable = (r: RoutingMaster) => {
    const now = new Date().toISOString().slice(0, 10);
    setRoutings(prev => prev.map(x =>
      x.id === r.id
        ? {
            ...x, status: 'ENABLED' as RMStatus, effectiveDate: now, updatedAt: now,
            history: [...x.history, {
              id: `H${Date.now()}`, operationType: 'ENABLE' as const, toVersion: x.version,
              operator: 'admin', operationTime: `${now} 00:00:00`,
              remark: '启用，工艺路径正式生效',
            }],
          }
        : x
    ));
    message.success('工艺路径已启用，可用于生产执行');
  };

  // ── 停用弹窗（已启用 → 已停用）────────────────────────────────
  const openDisableModal = (r: RoutingMaster) => {
    setDisableTarget(r);
    disableForm.resetFields();
    disableForm.setFieldsValue({ disableMode: 'NORMAL' });
    setDisableModalOpen(true);
  };

  const handleDisable = () => {
    disableForm.validateFields().then(values => {
      const now = new Date().toISOString().slice(0, 10);
      setRoutings(prev => prev.map(r =>
        r.id === disableTarget!.id
          ? {
              ...r, status: 'DISABLED' as RMStatus, isDefault: false,
              disableReason: values.reason, disableMode: values.disableMode,
              expireDate: now, updatedAt: now,
              history: [...r.history, {
                id: `H${Date.now()}`, operationType: 'DISABLE' as const, toVersion: r.version,
                operator: 'admin', operationTime: `${now} 00:00:00`,
                remark: values.reason,
              }],
            }
          : r
      ));
      setDisableModalOpen(false);
      message.success('已停用，工艺路径不可用于新生产');
    }).catch((err: any) => { if (err?.errorFields) return; });
  };

  // ── 重新启用（已停用 → 已启用）────────────────────────────────
  const handleReEnable = (r: RoutingMaster) => {
    const now = new Date().toISOString().slice(0, 10);
    setRoutings(prev => prev.map(x =>
      x.id === r.id
        ? {
            ...x, status: 'ENABLED' as RMStatus,
            disableReason: undefined, disableMode: undefined, expireDate: undefined,
            updatedAt: now,
            history: [...x.history, {
              id: `H${Date.now()}`, operationType: 'ENABLE' as const, toVersion: x.version,
              operator: 'admin', operationTime: `${now} 00:00:00`,
              remark: '重新启用',
            }],
          }
        : x
    ));
    message.success('已重新启用，工艺路径恢复可用');
  };

  // ── 归档（已停用 → 已归档）──────────────────────────────────────
  const handleArchive = (r: RoutingMaster) => {
    const now = new Date().toISOString().slice(0, 10);
    setRoutings(prev => prev.map(x =>
      x.id === r.id
        ? {
            ...x, status: 'ARCHIVED' as RMStatus, updatedAt: now,
            history: [...x.history, {
              id: `H${Date.now()}`, operationType: 'ARCHIVE' as const, toVersion: x.version,
              operator: 'admin', operationTime: `${now} 00:00:00`,
            }],
          }
        : x
    ));
    message.success('已归档，仅供追溯查阅');
  };

  // (旧 handleActivate/handleSetDefault 已移除，由 handleAudit/handleEnable 替代)

  // ── 升版 ─────────────────────────────────────────────────────────
  const openUpgrade = (r: RoutingMaster) => {
    setUpgradeTarget(r);
    setUpgradeOpen(true);
  };

  const handleUpgradeConfirm = (values: {
    newVersion: string; upgradeReason: string;
    impactAssessment?: string; effectiveDate: string; upgradeEcnNo?: string;
  }) => {
    if (!upgradeTarget) return;
    const now = new Date().toISOString().slice(0, 10);
    const newItem: RoutingMaster = {
      ...upgradeTarget,
      id: `RM${Date.now()}`,
      version: values.newVersion,
      status: 'DRAFT',
      isDefault: false,
      effectiveDate: values.effectiveDate,
      upgradeReason: values.upgradeReason,
      upgradeEcnNo: values.upgradeEcnNo,
      disableReason: undefined,
      expireDate: undefined,
      auditBy: undefined,
      auditAt: undefined,
      auditRemark: undefined,
      createdAt: now,
      updatedAt: now,
      history: [
        {
          id: `H${Date.now()}`,
          operationType: 'UPGRADE' as const,
          fromVersion: upgradeTarget.version,
          toVersion: values.newVersion,
          operator: 'admin',
          operationTime: `${now} 00:00:00`,
          upgradeReason: values.upgradeReason,
          upgradeEcnNo: values.upgradeEcnNo,
          effectiveDate: values.effectiveDate,
          remark: values.impactAssessment,
        },
      ],
    };
    setRoutings(prev => [newItem, ...prev]);
    setUpgradeOpen(false);
    message.success(`已创建新版本 ${values.newVersion}（草稿），请配置后生效`);
  };

  // ── 复制变体 ─────────────────────────────────────────────────────
  const openCopy = (r: RoutingMaster) => {
    setCopyTarget(r);
    setCopyOpen(true);
  };

  const handleCopyConfirm = (values: {
    newRoutingCode: string; version: string; routingName: string;
    variantType: any; bindMode: any; bindMaterialCodes: string[];
    specRangeExpr: string; inheritSync: boolean; variantReason: string;
  }) => {
    if (!copyTarget) return;
    const now = new Date().toISOString().slice(0, 10);
    const newItem: RoutingMaster = {
      ...copyTarget,
      id: `RM${Date.now()}`,
      routingCode: values.newRoutingCode,
      version: values.version,
      routingName: values.routingName,
      variantType: values.variantType,
      bindMode: values.bindMode,
      bindMaterialCodes: values.bindMaterialCodes,
      specRangeExpr: values.specRangeExpr,
      inheritSync: values.inheritSync,
      sourceRoutingId: copyTarget.id,
      sourceRoutingCode: copyTarget.routingCode,
      sourceNeedsSync: false,
      status: 'DRAFT',
      isDefault: false,
      auditBy: undefined,
      auditAt: undefined,
      auditRemark: undefined,
      disableReason: undefined,
      expireDate: undefined,
      effectiveDate: undefined,
      createdBy: 'admin',
      createdAt: now,
      updatedAt: now,
      history: [
        {
          id: `H${Date.now()}`,
          operationType: 'COPY' as const,
          fromVersion: `${copyTarget.version}(${copyTarget.routingCode})`,
          toVersion: values.version,
          operator: 'admin',
          operationTime: `${now} 00:00:00`,
          remark: values.variantReason || '复制新建变体路径',
        },
      ],
    };
    setRoutings(prev => [newItem, ...prev]);
    setCopyOpen(false);
    message.success('变体路径创建成功（草稿），请进入详情配置工序差异');
  };

  // ── 打开同步差异对比弹窗 ────────────────────────────────────────
  const openSync = (r: RoutingMaster) => { setSyncTarget(r); setSyncOpen(true); };

  // ── 执行同步（从 SyncDiffModal 回调）────────────────────────────
  const handleSyncConfirm = (
    _selectedKeys: string[],
    updatedGroups: import('./seriesData').RMGroup[],
  ) => {
    if (!syncTarget) return;
    const now = new Date().toISOString().slice(0, 10);
    setRoutings(prev => prev.map(x =>
      x.id !== syncTarget.id ? x : {
        ...x,
        groups: updatedGroups,
        opCount: updatedGroups.reduce((s, g) => s + g.steps.length, 0),
        parallelGroupCount: updatedGroups.filter(g => g.steps.length > 1).length,
        totalTimeMin: parseFloat(
          updatedGroups.reduce((s, g) => {
            const t = g.steps.length === 0 ? 0
              : g.steps.length === 1 ? g.steps[0].stdTimeMin
              : Math.max(...g.steps.map(st => st.stdTimeMin));
            return s + t;
          }, 0).toFixed(1)
        ),
        sourceNeedsSync: false,
        updatedAt: now,
      }
    ));
    setSyncOpen(false);
    setSyncTarget(null);
  };

  const hasSelected = selectedRowKeys.length > 0;

  // ── 渲染状态 Tag ──────────────────────────────────────────────────
  const renderStatus = (v: RMStatus) => {
    const s = RM_STATUS_MAP[v];
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 500,
        color: s.color, background: s.bg, border: `1px solid ${s.border}`,
      }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.color, display: 'inline-block' }} />
        {s.label}
      </span>
    );
  };

  // ── 渲染绑定方式 ──────────────────────────────────────────────────
  const renderBindMode = (r: RoutingMaster) => {
    if (r.variantType === 'STANDARD') {
      return (
        <div>
          <Tag color="default" style={{ fontSize: 11 }}>规格范围匹配</Tag>
          {r.specRangeExpr && (
            <Tooltip title={r.specRangeExpr}>
              <div style={{ fontSize: 10, color: '#aaa', marginTop: 2, maxWidth: 150,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {r.specRangeExpr}
              </div>
            </Tooltip>
          )}
        </div>
      );
    }
    if (r.bindMode === 'MATERIAL') {
      const codes = r.bindMaterialCodes || [];
      return (
        <div>
          <Tag color="purple" style={{ fontSize: 11 }}>强绑定物料</Tag>
          {codes.length > 0 && (
            <Tooltip title={codes.join(', ')}>
              <div style={{ fontSize: 10, color: '#722ED1', marginTop: 2 }}>
                {codes[0]}{codes.length > 1 ? ` 等${codes.length}个` : ''}
              </div>
            </Tooltip>
          )}
        </div>
      );
    }
    return (
      <div>
        <Tag color="cyan" style={{ fontSize: 11 }}>规则表达式</Tag>
        {r.specRangeExpr && (
          <Tooltip title={r.specRangeExpr}>
            <div style={{ fontSize: 10, color: '#13C2C2', marginTop: 2 }}>{r.specRangeExpr.slice(0, 20)}…</div>
          </Tooltip>
        )}
      </div>
    );
  };

  // ── 表格列 ────────────────────────────────────────────────────────
  const columns: ColumnsType<RoutingMaster> = [
    {
      title: '序号', width: 48, align: 'center' as const,
      render: (_: any, __: any, i: number) =>
        <span style={{ color: '#bbb', fontSize: 12 }}>{i + 1}</span>,
    },
    {
      title: '工艺路径编码 / 版本', width: 220,
      render: (_: any, r: RoutingMaster) => {
        const vt = VARIANT_TYPE_MAP[r.variantType];
        return (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
              <span
                className="code-link"
                style={{ fontFamily: 'monospace', fontSize: 12 }}
                onClick={() => handleView(r)}
              >
                <BranchesOutlined style={{ marginRight: 3, fontSize: 11 }} />
                {r.routingCode}
              </span>
              {r.variantType !== 'STANDARD' && (
                <Tag
                  color={vt.color === '#1677FF' ? 'blue' : 'purple'}
                  style={{ fontSize: 10, padding: '0 4px' }}
                >
                  {vt.label}
                </Tag>
              )}
              {r.sourceNeedsSync && (
                <Tooltip title={`源路径已升版，请检查变体差异是否需要同步`}>
                  <WarningOutlined style={{ color: '#FF4D4F', fontSize: 12 }} />
                </Tooltip>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
              <span style={{ fontWeight: 700, color: '#1677FF', fontSize: 13 }}>{r.version}</span>
              {r.isDefault && <Tag color="blue" style={{ fontSize: 10, padding: '0 3px' }}>默认</Tag>}
              {r.sourceRoutingCode && (
                <Tooltip title={`源路径：${r.sourceRoutingCode}`}>
                  <span style={{ fontSize: 10, color: '#aaa' }}>
                    ↩ {r.sourceRoutingCode.slice(0, 18)}
                  </span>
                </Tooltip>
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: '工艺路径名称', dataIndex: 'routingName', width: 200,
      render: (v: string, r: RoutingMaster) => (
        <div>
          <div style={{ fontWeight: 500, fontSize: 13, color: '#1a1a2e' }}>{v}</div>
          <div style={{ fontSize: 11, color: '#aaa', marginTop: 1 }}>
            {r.seriesCode} · {r.workshop || '—'}
          </div>
        </div>
      ),
    },
    {
      title: '关联系列', dataIndex: 'seriesCode', width: 130,
      render: (v: string, r: RoutingMaster) => (
        <div>
          <span style={{ fontFamily: 'monospace', color: '#722ED1', fontWeight: 600 }}>{v}</span>
          <div style={{ fontSize: 11, color: '#aaa', marginTop: 1 }}>{r.seriesName}</div>
        </div>
      ),
    },
    {
      title: '绑定方式', width: 160,
      render: (_: any, r: RoutingMaster) => renderBindMode(r),
    },
    {
      title: '状态', dataIndex: 'status', width: 88, align: 'center' as const,
      render: (v: RMStatus) => renderStatus(v),
    },
    {
      title: '工序 / 工时', width: 90, align: 'center' as const,
      render: (_: any, r: RoutingMaster) => (
        <div style={{ textAlign: 'center' }}>
          <span style={{ color: r.opCount > 0 ? '#1677FF' : '#ccc', fontWeight: 700, fontSize: 14 }}>
            {r.opCount}
          </span>
          {r.parallelGroupCount > 0 && (
            <div style={{ fontSize: 10, color: '#722ED1' }}>{r.parallelGroupCount}组并行</div>
          )}
          <div style={{ fontSize: 11, color: '#888' }}>{r.totalTimeMin}分</div>
        </div>
      ),
    },
    {
      title: '生效日期', width: 100,
      render: (_: any, r: RoutingMaster) => (
        <div style={{ fontSize: 12 }}>
          {r.effectiveDate
            ? <span style={{ color: '#52C41A' }}>{r.effectiveDate}</span>
            : <span style={{ color: '#ccc' }}>—</span>
          }
          {r.expireDate && (
            <div style={{ color: '#FF4D4F', fontSize: 11 }}>失效：{r.expireDate}</div>
          )}
        </div>
      ),
    },
    {
      title: '操作', width: 300, fixed: 'right' as const,
      render: (_: any, r: RoutingMaster) => {
        const st = r.status;

        // ── 下拉更多菜单（历史版本、归档、删除等次要操作）──────────────────────────────
        const moreItems: MenuProps['items'] = [
          {
            key: 'history',
            label: '历史版本',
            icon: <HistoryOutlined />,
            onClick: () => { setHistoryTarget(r); setHistoryOpen(true); },
          },
          rmCanArchive(st) ? { type: 'divider' as const } : null,
          rmCanArchive(st) ? {
            key: 'archive',
            label: '归档',
            icon: <InboxOutlined style={{ color: '#BFBFBF' }} />,
            onClick: () => {
              Modal.confirm({
                title: '确认归档此工艺路径？',
                content: '归档后仅供追溯，不可恢复使用',
                okText: '确认归档', cancelText: '取消',
                onOk: () => handleArchive(r),
              });
            },
          } : null,
          rmCanDelete(st) ? { type: 'divider' as const } : null,
          rmCanDelete(st) ? {
            key: 'delete',
            label: '删除草稿',
            icon: <DeleteOutlined />,
            danger: true,
            onClick: () => {
              Modal.confirm({
                title: '确认删除此草稿工艺路径？',
                content: '删除后不可恢复',
                okText: '确认删除', cancelText: '取消',
                okButtonProps: { danger: true },
                onOk: () => handleDelete([r.id]),
              });
            },
          } : null,
        ].filter(Boolean) as MenuProps['items'];

        return (
          <Space size={0} wrap style={{ gap: '2px 0' }}>
            {/* 查看详情 */}
            <Button type="link" size="small" icon={<EyeOutlined />}
              style={{ padding: '0 4px', fontSize: 12 }}
              onClick={() => handleView(r)}>
              查看
            </Button>

            {/* 草稿：编辑 */}
            {rmCanEdit(st) && (
              <Button type="link" size="small" icon={<EditOutlined />}
                style={{ padding: '0 4px', fontSize: 12 }}
                onClick={() => handleEdit(r)}>
                编辑
              </Button>
            )}

            {/* 复制变体 */}
            {rmCanCopy(st) && (
              <Button type="link" size="small" icon={<CopyOutlined />}
                style={{ padding: '0 4px', fontSize: 12 }}
                onClick={() => openCopy(r)}>
                复制
              </Button>
            )}

            <span style={{ color: '#f0f0f0', margin: '0 2px' }}>|</span>

            {/* 草稿 → 审核（即生效） */}
            {rmCanAudit(st) && (
              <Popconfirm
                title="确认审核并生效？"
                description="审核通过后路径立即生效【已启用】，可直接用于生产执行"
                icon={<AuditOutlined style={{ color: '#FA8C16' }} />}
                okText="确认审核" cancelText="取消"
                onConfirm={() => handleAudit(r)}>
                <Tooltip title="审核通过即生效">
                  <Button type="link" size="small" icon={<AuditOutlined />}
                    style={{ padding: '0 4px', fontSize: 12, color: '#FA8C16' }}>
                    审核
                  </Button>
                </Tooltip>
              </Popconfirm>
            )}

            {/* 已审核/已停用 → 反审核（退回草稿） */}
            {rmCanUnaudit(st) && (
              <Popconfirm
                title={st === 'DISABLED' ? '确认反审核？（停用→草稿）' : '确认反审核？（已审核→草稿）'}
                description="路径将退回【草稿】状态，可重新编辑后再次审核"
                icon={<RollbackOutlined style={{ color: '#FF7A45' }} />}
                okText="确认反审核" cancelText="取消"
                onConfirm={() => handleUnaudit(r)}>
                <Button type="link" size="small" icon={<RollbackOutlined />}
                  style={{
                    padding: '0 4px', fontSize: 12,
                    color: st === 'DISABLED' ? '#FF7A45' : '#8C8C8C',
                  }}>
                  反审核
                </Button>
              </Popconfirm>
            )}

            {/* 已审核 → 启用 */}
            {rmCanEnable(st) && (
              <Popconfirm
                title="确认启用此工艺路径？"
                description="启用后路径正式投入使用，可在PAD生产执行中选择"
                icon={<CheckCircleOutlined style={{ color: '#52C41A' }} />}
                okText="确认启用" cancelText="取消"
                onConfirm={() => handleEnable(r)}>
                <Button type="link" size="small" icon={<CheckCircleOutlined />}
                  style={{ padding: '0 4px', fontSize: 12, color: '#52C41A' }}>
                  启用
                </Button>
              </Popconfirm>
            )}

            {/* 已启用 → 停用 */}
            {rmCanDisable(st) && (
              <Tooltip title="停用此工艺路径">
                <Button type="link" size="small" icon={<StopOutlined />} danger
                  style={{ padding: '0 4px', fontSize: 12 }}
                  onClick={() => openDisableModal(r)}>
                  停用
                </Button>
              </Tooltip>
            )}

            {/* 已停用 → 重新启用 */}
            {rmCanReEnable(st) && (
              <Popconfirm
                title="确认重新启用此工艺路径？"
                icon={<PoweroffOutlined style={{ color: '#52C41A' }} />}
                okText="确认" cancelText="取消"
                onConfirm={() => handleReEnable(r)}>
                <Button type="link" size="small" icon={<PoweroffOutlined />}
                  style={{ padding: '0 4px', fontSize: 12, color: '#52C41A' }}>
                  重启
                </Button>
              </Popconfirm>
            )}

            {/* 升版（已启用/已审核） */}
            {rmCanUpgrade(st) && (
              <Button type="link" size="small" icon={<RiseOutlined />}
                style={{ padding: '0 4px', fontSize: 12, color: '#722ED1' }}
                onClick={() => openUpgrade(r)}>
                升版
              </Button>
            )}

            {/* 待同步：同步更新 */}
            {r.sourceNeedsSync && (
              <Button type="link" size="small" icon={<SyncOutlined />}
                style={{ padding: '0 4px', fontSize: 12, color: '#FF4D4F' }}
                onClick={() => openSync(r)}>
                同步
              </Button>
            )}

            {/* 更多操作下拉（历史版本、归档、删除） */}
            <Dropdown menu={{ items: moreItems }} trigger={['click']} placement="bottomRight">
              <Tooltip title="更多操作">
                <Button type="link" size="small" icon={<MoreOutlined />}
                  style={{ padding: '0 4px', fontSize: 12, color: '#8C8C8C' }} />
              </Tooltip>
            </Dropdown>
          </Space>
        );
      },
    },
  ];

  return (
    <div className="pro-page">

      {/* ── 统计卡片 ── */}
      <div className="pro-stats-bar">
        <div
          className={`pro-stat-item pro-stat-clickable${!filterStatus ? ' pro-stat-active pro-stat-active--all' : ''}`}
          onClick={() => setFilterStatus(undefined)}
        >
          <span className="stat-num" style={{ color: '#1677FF' }}>{stats.total}</span>
          <span className="stat-label">全部</span>
        </div>
        <div className="pro-stat-divider" />
        <div
          className={`pro-stat-item pro-stat-clickable${filterStatus === 'DRAFT' ? ' pro-stat-active pro-stat-active--draft' : ''}`}
          onClick={() => setFilterStatus(prev => prev === 'DRAFT' ? undefined : 'DRAFT')}
        >
          <span className="stat-num" style={{ color: '#8C8C8C' }}>{stats.draft}</span>
          <span className="stat-label">草稿</span>
        </div>
        <div className="pro-stat-divider" />
        <div
          className={`pro-stat-item pro-stat-clickable${filterStatus === 'AUDITED' ? ' pro-stat-active' : ''}`}
          onClick={() => setFilterStatus(prev => prev === 'AUDITED' ? undefined : 'AUDITED')}
        >
          <span className="stat-num" style={{ color: '#FA8C16' }}>{stats.audited}</span>
          <span className="stat-label">已审核</span>
          {stats.audited === 0 && <span style={{ fontSize: 10, color: '#52C41A' }}>⚡自动生效</span>}
        </div>
        <div className="pro-stat-divider" />
        <div
          className={`pro-stat-item pro-stat-clickable${filterStatus === 'ENABLED' ? ' pro-stat-active pro-stat-active--active' : ''}`}
          onClick={() => setFilterStatus(prev => prev === 'ENABLED' ? undefined : 'ENABLED')}
        >
          <span className="stat-num" style={{ color: '#52C41A' }}>{stats.enabled}</span>
          <span className="stat-label">已启用</span>
        </div>
        <div className="pro-stat-divider" />
        <div
          className={`pro-stat-item pro-stat-clickable${filterStatus === 'DISABLED' ? ' pro-stat-active pro-stat-active--disabled' : ''}`}
          onClick={() => setFilterStatus(prev => prev === 'DISABLED' ? undefined : 'DISABLED')}
        >
          <span className="stat-num" style={{ color: '#FF4D4F' }}>{stats.disabled}</span>
          <span className="stat-label">已停用</span>
        </div>
        {stats.needSync > 0 && (
          <>
            <div className="pro-stat-divider" />
            <div className="pro-stat-item" style={{ cursor: 'default' }}>
              <span className="stat-num" style={{ color: '#FF4D4F' }}>{stats.needSync}</span>
              <span className="stat-label" style={{ color: '#FF4D4F' }}>待同步</span>
            </div>
          </>
        )}
        <div style={{ flex: 1 }} />
        <div className="pro-stat-flow">
          <span className="flow-step draft">草稿</span>
          <span className="flow-arrow">→</span>
          <span className="flow-step" style={{ background: '#fff7e6', color: '#FA8C16', borderColor: '#ffd591', position: 'relative' }}>
            审核即生效
            <span style={{ position: 'absolute', top: -8, right: -4, fontSize: 10, color: '#52C41A', fontWeight: 600 }}>⚡</span>
          </span>
          <span className="flow-arrow">→</span>
          <span className="flow-step active">启用</span>
          <span className="flow-arrow" style={{ color: '#FF4D4F' }}>⇄</span>
          <span className="flow-step disabled">停用</span>
          <span style={{ fontSize: 10, color: '#8C8C8C', alignSelf: 'center', margin: '0 2px' }}>↙反审核</span>
          <span className="flow-arrow">→</span>
          <span className="flow-step" style={{ background: '#f5f5f5', color: '#BFBFBF', borderColor: '#e8e8e8' }}>归档</span>
        </div>
      </div>

      {/* 待同步提示 */}
      {stats.needSync > 0 && (
        <div style={{ padding: '0 16px 8px' }}>
          <Alert
            type="warning"
            showIcon
            message={`有 ${stats.needSync} 条变体路径的源路径已升版，请检查是否需要同步更新。`}
            style={{ fontSize: 12 }}
          />
        </div>
      )}

      {/* Excel导入工艺路径提示 */}
      {routings.some(r => r.routingCode === 'RT-RKQ-FG-001') && (
        <div style={{ padding: '0 16px 8px' }}>
          <Alert
            type="success"
            showIcon
            icon={<AppstoreOutlined />}
            message={
              <span>
                <strong>RT-RKQ-FG-001</strong>（机用根管锉全工序工艺路径）已从《产品-机用根管锉.xlsx》导入——
                16道工序 × 9个PAD执行阶段，含2个并行组（热处理&amp;清洗二 / 手柄打码&amp;上色），总工时37.5分钟。
                <Button
                  type="link" size="small" icon={<LinkOutlined />}
                  style={{ padding: '0 4px', fontSize: 12 }}
                  onClick={() => {
                    const rm = routings.find(r => r.routingCode === 'RT-RKQ-FG-001');
                    if (rm) handleView(rm);
                  }}
                >
                  点击查看详情
                </Button>
              </span>
            }
            style={{ fontSize: 12 }}
          />
        </div>
      )}

      {/* ── 搜索栏 ── */}
      <div className="pro-search-bar">
        <Row gutter={8} align="middle" style={{ width: '100%' }}>
          <Col>
            <span className="search-label">编码</span>
            <Input size="small" style={{ width: 160 }} placeholder="工艺路径编码"
              value={searchCode} onChange={e => setSearchCode(e.target.value)} allowClear />
          </Col>
          <Col>
            <span className="search-label">名称</span>
            <Input size="small" style={{ width: 140 }} placeholder="路径名称"
              value={searchName} onChange={e => setSearchName(e.target.value)} allowClear />
          </Col>
          <Col>
            <span className="search-label">产品系列</span>
            <Select size="small" style={{ width: 140 }} placeholder="全部" allowClear
              value={filterSeries} onChange={setFilterSeries}
              options={seriesOptions} />
          </Col>
          <Col>
            <span className="search-label">状态</span>
            <Select size="small" style={{ width: 90 }} placeholder="全部" allowClear
              value={filterStatus} onChange={setFilterStatus}
              options={Object.entries(RM_STATUS_MAP).map(([k, v]) => ({ value: k, label: v.label }))} />
          </Col>
          <Col>
            <span className="search-label">类型</span>
            <Select size="small" style={{ width: 100 }} placeholder="全部" allowClear
              value={filterVariant} onChange={setFilterVariant}
              options={Object.entries(VARIANT_TYPE_MAP).map(([k, v]) => ({ value: k, label: v.label }))} />
          </Col>
          <Col>
            <Button type="primary" size="small" icon={<SearchOutlined />}
              style={{ background: '#C8000A', borderColor: '#C8000A' }}>查询</Button>
          </Col>
          <Col>
            <Button size="small" icon={<ReloadOutlined />}
              onClick={() => {
                setSearchCode(''); setSearchName('');
                setFilterStatus(undefined); setFilterSeries(undefined); setFilterVariant(undefined);
              }}>重置</Button>
          </Col>
        </Row>
      </div>

      {/* ── 工具栏 ── */}
      <div className="pro-toolbar">
        <div className="toolbar-btns">
          <Button type="primary" icon={<PlusOutlined />}
            className="btn-primary-red" onClick={handleAdd}>
            新建工艺路径
          </Button>
          <Popconfirm
            title={`确认删除选中的 ${selectedRowKeys.length} 条工艺路径？（仅草稿可删除）`}
            onConfirm={() => handleDelete(selectedRowKeys)}
            disabled={!hasSelected} okText="确认" cancelText="取消">
            <Button icon={<DeleteOutlined />} size="small" danger disabled={!hasSelected}>
              批量删除
            </Button>
          </Popconfirm>
        </div>
        <div style={{ fontSize: 12, color: '#888' }}>
          共 <strong style={{ color: '#333' }}>{filtered.length}</strong> 条
          {hasSelected && <span style={{ marginLeft: 8, color: '#1677FF' }}>已选 {selectedRowKeys.length} 条</span>}
        </div>
      </div>

      {/* ── 表格 ── */}
      <div className="pro-table-wrap">
        <Table
          rowKey="id"
          dataSource={filtered}
          columns={columns}
          className="pro-table"
          rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
          pagination={{ pageSize: 20, showTotal: t => `共${t}条`, showSizeChanger: true, size: 'small' }}
          scroll={{ x: 1400 }}
          size="small"
          rowClassName={(r: RoutingMaster) =>
            r.status === 'DRAFT'    ? 'row-draft' :
            r.status === 'AUDITED'  ? 'row-audited' :
            r.status === 'DISABLED' ? 'row-disabled' :
            r.status === 'ARCHIVED' ? 'row-obsolete' : ''
          }
          onRow={(r: RoutingMaster) => ({
            onDoubleClick: () => handleView(r),
            style: { cursor: 'pointer' },
          })}
        />
      </div>

      {/* ══ 新建/编辑弹窗 ══ */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 3, height: 16, background: '#C8000A', borderRadius: 2, display: 'inline-block' }} />
            {editingItem ? '编辑工艺路径' : '新建工艺路径'}
          </div>
        }
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSave}
        okText={editingItem ? '保存修改' : '保存草稿'}
        cancelText="取消"
        okButtonProps={{ style: { background: '#C8000A', borderColor: '#C8000A' } }}
        width={600}
        maskClosable={false}
      >
        <Form form={form} layout="vertical" size="small">
          <Row gutter={12}>
            <Col span={16}>
              <Form.Item name="routingCode" label="工艺路径编码"
                rules={[
                  { required: true, message: '请输入编码' },
                  { min: 2, message: '至少 2 个字符' },
                  { max: 50, message: '最多 50 个字符' },
                ]}>
                <Input placeholder="RT-RKQ-STD-001" disabled={!!editingItem} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="version" label="版本号"
                rules={[{ required: true }, { pattern: /^V\d+\.\d+/, message: '格式如 V1.0' }]}>
                <Input placeholder="V1.0" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="routingName" label="工艺路径名称"
            rules={[{ required: true, message: '请输入名称' }, { max: 100 }]}>
            <Input placeholder="如 机用根管锉标准工艺路径" />
          </Form.Item>

          <Row gutter={12}>
            <Col span={24}>
              <Form.Item
                name="seriesCode"
                label={
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    关联产品系列
                    {onNavigateToSeries && (
                      <a
                        style={{ fontSize: 11, color: '#1677FF', fontWeight: 400, cursor: 'pointer' }}
                        onClick={() => { setModalOpen(false); setTimeout(onNavigateToSeries, 100); }}
                      >
                        <LinkOutlined style={{ marginRight: 2 }} />前往产品系列档案
                      </a>
                    )}
                  </span>
                }
                rules={[{ required: true, message: '请选择产品系列' }]}
              >
                <Select
                  placeholder="请选择（可搜索编码或名称）"
                  showSearch
                  filterOption={(input, opt: any) =>
                    (opt?.label || '').toLowerCase().includes(input.toLowerCase()) ||
                    (opt?.seriesName || '').includes(input)
                  }
                  value={selectedSeriesCode}
                  onChange={v => setSelectedSeriesCode(v)}
                  optionRender={(opt: any) => (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '2px 0' }}>
                      <Tag color={getFamilyColor(opt.data.productFamily)}
                        style={{ fontSize: 10, padding: '0 5px', margin: 0, flexShrink: 0 }}>
                        {opt.data.productFamily}
                      </Tag>
                      <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#1a1a2e', fontSize: 12 }}>
                        {opt.data.value}
                      </span>
                      <span style={{ color: '#888', fontSize: 12 }}>{opt.data.seriesName}</span>
                    </div>
                  )}
                  options={seriesOptions}
                  dropdownRender={menu => (
                    <>
                      {menu}
                      {onNavigateToSeries && (
                        <>
                          <Divider style={{ margin: '4px 0' }} />
                          <div
                            style={{
                              padding: '6px 12px', cursor: 'pointer', color: '#1677FF', fontSize: 12,
                              display: 'flex', alignItems: 'center', gap: 6,
                            }}
                            onMouseDown={e => e.preventDefault()}
                            onClick={() => { setModalOpen(false); setTimeout(onNavigateToSeries, 100); }}
                          >
                            <AppstoreOutlined />
                            前往「产品系列档案」新建或管理系列
                          </div>
                        </>
                      )}
                    </>
                  )}
                  notFoundContent={
                    <div style={{ textAlign: 'center', padding: '12px 0' }}>
                      <div style={{ color: '#aaa', fontSize: 12 }}>暂无启用状态的产品系列</div>
                      {onNavigateToSeries && (
                        <a style={{ fontSize: 12 }}
                          onClick={() => { setModalOpen(false); setTimeout(onNavigateToSeries, 100); }}>
                          前往产品系列档案新建
                        </a>
                      )}
                    </div>
                  }
                />
              </Form.Item>

              {/* 选中系列后显示详情卡片 */}
              {selectedSeriesInfo && (
                <div style={{
                  background: '#f8f9ff', border: '1px solid #d0e4ff', borderRadius: 6,
                  padding: '8px 12px', marginTop: -8, marginBottom: 12,
                  display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
                }}>
                  <Tag color={getFamilyColor(selectedSeriesInfo.productFamily)} style={{ margin: 0 }}>
                    {selectedSeriesInfo.productFamily}
                  </Tag>
                  <span style={{ fontWeight: 600, color: '#1a1a2e', fontSize: 13 }}>
                    {selectedSeriesInfo.seriesName}
                  </span>
                  {selectedSeriesInfo.defaultRoutingCode ? (
                    <span style={{ fontSize: 11, color: '#722ED1' }}>
                      默认路径：{selectedSeriesInfo.defaultRoutingCode}
                    </span>
                  ) : (
                    <span style={{ fontSize: 11, color: '#faad14' }}>暂无默认工艺路径</span>
                  )}
                  <Tag color="success" style={{ margin: 0, fontSize: 11 }}>
                    <CheckOutlined /> 启用中
                  </Tag>
                </div>
              )}
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="isDefault" label="是否默认版本" valuePropName="checked">
                <Switch checkedChildren="是" unCheckedChildren="否" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="workshop" label="适用车间">
                <Input placeholder="精密加工车间" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="productLine" label="适用产品线">
                <Input placeholder="根管锉A线" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="specRangeExpr" label="适用规格范围"
            extra={
              <span style={{ fontSize: 11, color: '#1677FF' }}>
                示例：diameter:#15~#40;taper:04锥~06锥;length:* （多维度用分号分隔）
              </span>
            }>
            <Input placeholder="diameter:#15~#40;taper:04锥~06锥;length:*" />
          </Form.Item>

          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} placeholder="工艺路径说明、适用条件等..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* ══ 停用弹窗 ══ */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <StopOutlined style={{ color: '#FF4D4F' }} />
            确认停用工艺路径
          </div>
        }
        open={disableModalOpen}
        onCancel={() => setDisableModalOpen(false)}
        onOk={handleDisable}
        okText="确认停用"
        cancelText="取消"
        okButtonProps={{ danger: true }}
        width={500}
      >
        {disableTarget && (
          <>
            <Descriptions size="small" column={1} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="工艺路径">
                <span style={{ fontFamily: 'monospace' }}>
                  {disableTarget.routingCode} {disableTarget.version}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="当前状态">
                {renderStatus(disableTarget.status)}
              </Descriptions.Item>
              <Descriptions.Item label="执行中工单">
                <span style={{ color: '#FA8C16' }}>（模拟）3 张</span>
              </Descriptions.Item>
            </Descriptions>

            <Form form={disableForm} layout="vertical" size="small">
              <Form.Item name="disableMode" label="停用方式"
                rules={[{ required: true }]}>
                <Select
                  options={[
                    {
                      value: 'NORMAL',
                      label: (
                        <div>
                          <strong>普通停用</strong>
                          <div style={{ fontSize: 11, color: '#888' }}>仅对新工单生效，执行中工单仍锁定旧版本</div>
                        </div>
                      ),
                    },
                    {
                      value: 'FORCE',
                      label: (
                        <div>
                          <strong>强制停用并迁移</strong>
                          <div style={{ fontSize: 11, color: '#FF4D4F' }}>执行中工单工艺路径迁移至新默认版本</div>
                        </div>
                      ),
                    },
                  ]}
                />
              </Form.Item>
              <Form.Item name="reason" label="停用原因"
                rules={[{ required: true, message: '请输入停用原因' }]}>
                <Input.TextArea rows={2} placeholder="请填写停用原因..." />
              </Form.Item>
            </Form>

            {disableTarget.isDefault && (
              <Alert
                type="warning"
                showIcon
                message="该版本是系列唯一默认版本，停用后系列默认版本置空，请重新指定默认版本！"
                style={{ fontSize: 12, marginTop: 8 }}
              />
            )}
          </>
        )}
      </Modal>

      {/* ══ 升版弹窗 ══ */}
      <UpgradeVersionModal
        open={upgradeOpen}
        routing={upgradeTarget}
        onCancel={() => setUpgradeOpen(false)}
        onConfirm={handleUpgradeConfirm}
      />

      {/* ══ 历史版本弹窗 ══ */}
      <VersionHistoryModal
        open={historyOpen}
        routing={historyTarget}
        onCancel={() => setHistoryOpen(false)}
      />

      {/* ══ 复制变体弹窗 ══ */}
      <CopyVariantModal
        open={copyOpen}
        routing={copyTarget}
        onCancel={() => setCopyOpen(false)}
        onConfirm={handleCopyConfirm}
      />

      {/* ══ 查看详情抽屉 ══ */}
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <EyeOutlined style={{ color: '#1677FF' }} />
            <span>工艺路径详情</span>
            {viewTarget && renderStatus(viewTarget.status)}
          </div>
        }
        open={viewDrawerOpen}
        onClose={() => setViewDrawerOpen(false)}
        width={560}
        extra={
          viewTarget && rmCanEdit(viewTarget.status) ? (
            <Button
              type="primary"
              size="small"
              icon={<EditOutlined />}
              style={{ background: '#C8000A', borderColor: '#C8000A' }}
              onClick={() => { setViewDrawerOpen(false); handleEdit(viewTarget); }}
            >
              编辑
            </Button>
          ) : null
        }
      >
        {viewTarget && (() => {
          const vt = VARIANT_TYPE_MAP[viewTarget.variantType];
          const seriesInfo = seriesList.find(s => s.seriesCode === viewTarget.seriesCode);
          return (
            <div style={{ fontSize: 13 }}>
              {/* 基本信息 */}
              <div style={{
                background: '#f8f9ff', border: '1px solid #e8edf8',
                borderRadius: 8, padding: '14px 16px', marginBottom: 16,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                  <span style={{
                    fontFamily: 'monospace', fontSize: 15, fontWeight: 700, color: '#1a1a2e',
                  }}>
                    <BranchesOutlined style={{ marginRight: 4, color: '#722ED1' }} />
                    {viewTarget.routingCode}
                  </span>
                  <Tag color="blue" style={{ fontWeight: 700 }}>{viewTarget.version}</Tag>
                  {viewTarget.isDefault && <Tag color="blue">默认版本</Tag>}
                  {viewTarget.variantType !== 'STANDARD' && (
                    <Tag color={vt.color === '#1677FF' ? 'blue' : 'purple'}>{vt.label}</Tag>
                  )}
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#333', marginBottom: 6 }}>
                  {viewTarget.routingName}
                </div>
                {viewTarget.remark && (
                  <div style={{ fontSize: 12, color: '#888' }}>{viewTarget.remark}</div>
                )}
              </div>

              {/* 关联产品系列 */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 600, color: '#555', fontSize: 12, marginBottom: 6,
                  borderLeft: '3px solid #722ED1', paddingLeft: 8 }}>
                  关联产品系列
                </div>
                <div style={{
                  background: '#fdf6ff', border: '1px solid #e9d6ff',
                  borderRadius: 6, padding: '10px 14px',
                  display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
                }}>
                  {seriesInfo ? (
                    <>
                      <Tag color={getFamilyColor(seriesInfo.productFamily)} style={{ margin: 0 }}>
                        {seriesInfo.productFamily}
                      </Tag>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#722ED1' }}>
                        {viewTarget.seriesCode}
                      </span>
                      <span style={{ color: '#333', fontWeight: 500 }}>{viewTarget.seriesName}</span>
                      {seriesInfo.defaultRoutingCode && (
                        <span style={{ fontSize: 11, color: '#888' }}>
                          系列默认路径：{seriesInfo.defaultRoutingCode}
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#722ED1' }}>
                        {viewTarget.seriesCode}
                      </span>
                      <span style={{ color: '#333' }}>{viewTarget.seriesName}</span>
                    </>
                  )}
                </div>
              </div>

              {/* 基础配置 */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 600, color: '#555', fontSize: 12, marginBottom: 6,
                  borderLeft: '3px solid #1677FF', paddingLeft: 8 }}>
                  基础配置
                </div>
                <Descriptions size="small" column={2} bordered>
                  <Descriptions.Item label="适用车间">
                    {viewTarget.workshop || <span style={{ color: '#ccc' }}>—</span>}
                  </Descriptions.Item>
                  <Descriptions.Item label="适用产品线">
                    {viewTarget.productLine || <span style={{ color: '#ccc' }}>—</span>}
                  </Descriptions.Item>
                  <Descriptions.Item label="工序数量">
                    <span style={{ fontWeight: 700, color: '#1677FF' }}>{viewTarget.opCount}</span>
                    {viewTarget.parallelGroupCount > 0 && (
                      <span style={{ color: '#722ED1', marginLeft: 6 }}>
                        含 {viewTarget.parallelGroupCount} 组并行
                      </span>
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="总工时">
                    <span style={{ fontWeight: 700 }}>{viewTarget.totalTimeMin}</span>
                    <span style={{ color: '#888', marginLeft: 2 }}>分钟</span>
                  </Descriptions.Item>
                  <Descriptions.Item label="生效日期" span={2}>
                    {viewTarget.effectiveDate
                      ? <span style={{ color: '#52C41A' }}>{viewTarget.effectiveDate}</span>
                      : <span style={{ color: '#ccc' }}>—</span>}
                    {viewTarget.expireDate && (
                      <span style={{ color: '#FF4D4F', marginLeft: 12 }}>
                        失效：{viewTarget.expireDate}
                      </span>
                    )}
                  </Descriptions.Item>
                  {viewTarget.specRangeExpr && (
                    <Descriptions.Item label="适用规格范围" span={2}>
                      <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#555' }}>
                        {viewTarget.specRangeExpr}
                      </span>
                    </Descriptions.Item>
                  )}
                </Descriptions>
              </div>

              {/* 绑定方式（变体） */}
              {viewTarget.variantType !== 'STANDARD' && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontWeight: 600, color: '#555', fontSize: 12, marginBottom: 6,
                    borderLeft: '3px solid #FA8C16', paddingLeft: 8 }}>
                    变体绑定信息
                  </div>
                  <Descriptions size="small" column={1} bordered>
                    <Descriptions.Item label="变体类型">
                      <Tag color="purple">{vt.label}</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="绑定方式">
                      {viewTarget.bindMode === 'MATERIAL' ? '强绑定物料' : '规格范围匹配'}
                    </Descriptions.Item>
                    {viewTarget.bindMaterialCodes && viewTarget.bindMaterialCodes.length > 0 && (
                      <Descriptions.Item label="绑定物料编码">
                        {viewTarget.bindMaterialCodes.map(c => (
                          <Tag key={c} style={{ fontFamily: 'monospace', marginBottom: 2 }}>{c}</Tag>
                        ))}
                      </Descriptions.Item>
                    )}
                    {viewTarget.sourceRoutingCode && (
                      <Descriptions.Item label="源路径">
                        <span style={{ fontFamily: 'monospace', color: '#722ED1' }}>
                          {viewTarget.sourceRoutingCode}
                        </span>
                        {viewTarget.inheritSync && (
                          <Tag color="cyan" style={{ marginLeft: 6, fontSize: 10 }}>同步继承</Tag>
                        )}
                        {viewTarget.sourceNeedsSync && (
                          <Tag color="red" style={{ marginLeft: 6, fontSize: 10 }}>待同步</Tag>
                        )}
                      </Descriptions.Item>
                    )}
                  </Descriptions>
                </div>
              )}

              {/* 停用/升版信息 */}
              {(viewTarget.disableReason || viewTarget.upgradeReason) && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontWeight: 600, color: '#555', fontSize: 12, marginBottom: 6,
                    borderLeft: '3px solid #FF4D4F', paddingLeft: 8 }}>
                    变更信息
                  </div>
                  <Descriptions size="small" column={1} bordered>
                    {viewTarget.upgradeReason && (
                      <Descriptions.Item label="升版原因">{viewTarget.upgradeReason}</Descriptions.Item>
                    )}
                    {viewTarget.upgradeEcnNo && (
                      <Descriptions.Item label="ECN编号">
                        <span style={{ fontFamily: 'monospace' }}>{viewTarget.upgradeEcnNo}</span>
                      </Descriptions.Item>
                    )}
                    {viewTarget.disableReason && (
                      <Descriptions.Item label="停用原因">
                        <span style={{ color: '#FF4D4F' }}>{viewTarget.disableReason}</span>
                      </Descriptions.Item>
                    )}
                  </Descriptions>
                </div>
              )}

              {/* 记录信息 */}
              <div style={{ marginBottom: 4 }}>
                <div style={{ fontWeight: 600, color: '#555', fontSize: 12, marginBottom: 6,
                  borderLeft: '3px solid #d9d9d9', paddingLeft: 8 }}>
                  记录信息
                </div>
                <Descriptions size="small" column={2} bordered>
                  <Descriptions.Item label="创建人">{viewTarget.createdBy}</Descriptions.Item>
                  <Descriptions.Item label="创建日期">{viewTarget.createdAt}</Descriptions.Item>
                  <Descriptions.Item label="最后更新" span={2}>{viewTarget.updatedAt}</Descriptions.Item>
                </Descriptions>
              </div>

              {/* 操作快捷区 */}
              <Divider style={{ margin: '16px 0 12px' }} />
              <Space wrap>
                {rmCanEdit(viewTarget.status) && (
                  <Button size="small" icon={<EditOutlined />}
                    onClick={() => { setViewDrawerOpen(false); handleEdit(viewTarget); }}>
                    编辑
                  </Button>
                )}
                {rmCanAudit(viewTarget.status) && (
                  <Button size="small" icon={<AuditOutlined />}
                    style={{ color: '#FA8C16', borderColor: '#FA8C16' }}
                    onClick={() => { handleAudit(viewTarget); setViewDrawerOpen(false); }}>
                    审核
                  </Button>
                )}
                {rmCanUpgrade(viewTarget.status) && (
                  <Button size="small" icon={<RiseOutlined />}
                    style={{ color: '#722ED1', borderColor: '#722ED1' }}
                    onClick={() => { setViewDrawerOpen(false); openUpgrade(viewTarget); }}>
                    升版
                  </Button>
                )}
                <Button size="small" icon={<HistoryOutlined />}
                  onClick={() => { setHistoryTarget(viewTarget); setHistoryOpen(true); }}>
                  历史版本
                </Button>
                <Button size="small" icon={<CopyOutlined />}
                  onClick={() => { setViewDrawerOpen(false); openCopy(viewTarget); }}>
                  复制变体
                </Button>
              </Space>
            </div>
          );
        })()}
      </Drawer>

      {/* ══ 同步差异对比弹窗 ══ */}
      {syncOpen && syncTarget && (() => {
        const sourceRM = routings.find(r => r.id === syncTarget.sourceRoutingId);
        if (!sourceRM) return (
          <Modal open title="同步更新" onCancel={() => setSyncOpen(false)}
            onOk={() => {
              setRoutings(prev => prev.map(x =>
                x.id === syncTarget.id
                  ? { ...x, sourceNeedsSync: false, updatedAt: new Date().toISOString().slice(0, 10) }
                  : x
              ));
              setSyncOpen(false);
              message.warning('未找到源路径数据，已直接清除待同步标记');
            }}
          >
            <Alert type="warning" message={`未找到源路径 ${syncTarget.sourceRoutingCode}，无法进行差异对比，可手动清除待同步标记。`} />
          </Modal>
        );
        return (
          <SyncDiffModal
            open={syncOpen}
            variant={syncTarget}
            source={sourceRM}
            onCancel={() => { setSyncOpen(false); setSyncTarget(null); }}
            onConfirm={handleSyncConfirm}
          />
        );
      })()}
    </div>
  );
};

export default RoutingMasterListPage;

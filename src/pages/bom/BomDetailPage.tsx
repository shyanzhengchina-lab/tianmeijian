import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Form, Input, Select, InputNumber, Button, Table, Space,
  Popconfirm, message, Row, Col, Tabs, Divider, Modal, Tooltip, AutoComplete, DatePicker, Tag, Spin,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  ArrowLeftOutlined, PlusOutlined, DeleteOutlined, CopyOutlined,
  AuditOutlined, CheckCircleOutlined, ExclamationCircleOutlined,
  SaveOutlined, EditOutlined, CloseOutlined, RollbackOutlined,
  StopOutlined, SearchOutlined, PrinterOutlined, ExportOutlined,
  HistoryOutlined, ReloadOutlined, ApartmentOutlined, MinusSquareOutlined, PlusSquareOutlined,
  FileTextOutlined, FolderOpenOutlined, FolderOutlined,
} from '@ant-design/icons';
import { BomHeader, BomChild, statusMap, BomStatus, normalizeStatus } from '../../store/bomData';
import { mockMaterials } from '../../store/mockData';
import { getBomList, getBomDetails, createBom, updateBom, createBomDetail, deleteBomDetail } from '../../api/boms';
import { getMaterialList } from '../../api/materials';
import type { MaterialRecord } from '../../api/materials';
import './BomPage.css';
import dayjs from 'dayjs';

/* ══════════════════════════════════════════════════════════════════
   BOM 多级展开 — 树节点类型
══════════════════════════════════════════════════════════════════ */
interface BomTreeNode {
  key:        string;
  level:      number;
  code:       string;
  name:       string;
  spec:       string;
  qty:        number;
  unit:       string;
  type:       string;
  status:     string;
  bomId?:     number;   // 对应子件自身的 BOM id（若它也是半成品/成品）
  isLeaf:     boolean;
  children:   BomTreeNode[];
  _loading?:  boolean;
}

interface BomDetailPageProps {
  bom: BomHeader | null;
  mode: 'view' | 'edit' | 'new';
  onBack: () => void;
  onSave: (bom: BomHeader) => void;
  onDelete?: (id: string) => void;
}

const emptyBom: BomHeader = {
  id: '', code: '', name: '', spec: '', unit: '个',
  version: '1.00', bomType: '主BOM', status: 'draft',
  mainQty: 1, mainUnit: '个', batchQty: 1, calcUnit: '个',
  effectDate: '', createdBy: '', createdAt: '',
  children: [],
};

let childIdSeq = 200;



const UNIT_OPTIONS = [
  { value: '个', label: '个' }, { value: '根', label: '根' },
  { value: '套', label: '套' }, { value: 'PCS', label: 'PCS' },
  { value: '支', label: '支' }, { value: '张', label: '张' },
  { value: '毫升', label: '毫升' }, { value: 'kg', label: 'kg' },
  { value: '米', label: '米' }, { value: '盒', label: '盒' },
];

/* ════════════════════════════════════════════════════════════════════
   BomTreeTable — BOM多级展开树形表格（自定义 indent 实现，支持折叠）
════════════════════════════════════════════════════════════════════ */
const LEVEL_COLORS = ['#1677FF', '#52C41A', '#FA8C16', '#722ED1', '#EB2F96', '#13C2C2', '#F5222D', '#FAAD14'];

interface BomTreeTableProps {
  nodes:            BomTreeNode[];
  rootCode:         string;
  rootName:         string;
  expandedKeys:     string[];
  onExpandedChange: (keys: string[]) => void;
}

const BomTreeTable: React.FC<BomTreeTableProps> = ({
  nodes, rootCode, rootName, expandedKeys, onExpandedChange,
}) => {
  /* 将树结构展平为行（仅展开节点的子节点显示） */
  const flattenNodes = (
    nodes: BomTreeNode[],
    expanded: Set<string>,
    result: (BomTreeNode & { _parentKeys: string[] })[] = [],
    parentKeys: string[] = [],
  ): (BomTreeNode & { _parentKeys: string[] })[] => {
    for (const node of nodes) {
      result.push({ ...node, _parentKeys: parentKeys });
      if (!node.isLeaf && expanded.has(node.key) && node.children.length > 0) {
        flattenNodes(node.children, expanded, result, [...parentKeys, node.key]);
      }
    }
    return result;
  };

  const expandedSet  = new Set(expandedKeys);
  const flatRows     = flattenNodes(nodes, expandedSet);

  const toggleNode = (key: string) => {
    if (expandedSet.has(key)) {
      onExpandedChange(expandedKeys.filter(k => k !== key));
    } else {
      onExpandedChange([...expandedKeys, key]);
    }
  };

  const statusBadge = (status: string) => {
    const ns = status ? normalizeStatus(status) : null;
    if (!ns) return null;
    const s = statusMap[ns];
    return (
      <span style={{
        fontSize: 10, fontWeight: 600, padding: '1px 5px',
        borderRadius: 2, border: `1px solid ${s.border}`,
        background: s.bg, color: s.color, whiteSpace: 'nowrap',
      }}>{s.label}</span>
    );
  };

  return (
    <div className="bom-tree-table">
      {/* 表头 */}
      <div className="bom-tree-thead">
        <div className="bom-tree-th" style={{ flex: '0 0 40px',  textAlign: 'center' }}>层级</div>
        <div className="bom-tree-th" style={{ flex: '0 0 32px',  textAlign: 'center' }}>#</div>
        <div className="bom-tree-th" style={{ flex: '1 1 200px' }}>物料编码 / 名称</div>
        <div className="bom-tree-th" style={{ flex: '0 0 110px' }}>规格型号</div>
        <div className="bom-tree-th" style={{ flex: '0 0 72px',  textAlign: 'right'  }}>数量</div>
        <div className="bom-tree-th" style={{ flex: '0 0 58px'  }}>单位</div>
        <div className="bom-tree-th" style={{ flex: '0 0 80px',  textAlign: 'center' }}>BOM状态</div>
        <div className="bom-tree-th" style={{ flex: '0 0 70px',  textAlign: 'center' }}>展开</div>
      </div>

      {/* 母件根节点（只展示头，不可折叠） */}
      <div className="bom-tree-row bom-tree-root">
        <div className="bom-tree-td" style={{ flex: '0 0 40px', textAlign: 'center' }}>
          <span className="bom-tree-level-badge" style={{ background: '#1677FF', color: '#fff' }}>L0</span>
        </div>
        <div className="bom-tree-td" style={{ flex: '0 0 32px', textAlign: 'center', color: '#909399', fontSize: 11 }}>—</div>
        <div className="bom-tree-td" style={{ flex: '1 1 200px' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#1677FF', fontFamily: 'monospace' }}>
            {rootCode}
          </span>
          <span style={{ fontSize: 12, color: '#303133', marginLeft: 8 }}>{rootName}</span>
          <Tag color="blue" style={{ marginLeft: 6, fontSize: 10 }}>母件</Tag>
        </div>
        <div className="bom-tree-td" style={{ flex: '0 0 110px', color: '#909399' }}>—</div>
        <div className="bom-tree-td" style={{ flex: '0 0 72px', textAlign: 'right', fontWeight: 700 }}>1.00</div>
        <div className="bom-tree-td" style={{ flex: '0 0 58px' }}>—</div>
        <div className="bom-tree-td" style={{ flex: '0 0 80px', textAlign: 'center' }}>—</div>
        <div className="bom-tree-td" style={{ flex: '0 0 70px', textAlign: 'center', color: '#909399', fontSize: 11 }}>
          {nodes.length} 子件
        </div>
      </div>

      {/* 展平后的子节点行 */}
      {flatRows.map((row, rowIdx) => {
        const indent   = (row.level - 1) * 20 + 8;
        const hasChild = !row.isLeaf && row.children.length > 0;
        const isOpen   = expandedSet.has(row.key);
        const lvColor  = LEVEL_COLORS[(row.level - 1) % LEVEL_COLORS.length];

        return (
          <div
            key={row.key}
            className={`bom-tree-row ${rowIdx % 2 === 0 ? 'bom-tree-row-even' : 'bom-tree-row-odd'}`}
          >
            {/* 层级徽章 */}
            <div className="bom-tree-td" style={{ flex: '0 0 40px', textAlign: 'center' }}>
              <span className="bom-tree-level-badge" style={{ background: lvColor, color: '#fff' }}>
                L{row.level}
              </span>
            </div>

            {/* 序号 */}
            <div className="bom-tree-td" style={{ flex: '0 0 32px', textAlign: 'center', color: '#909399', fontSize: 11 }}>
              {rowIdx + 1}
            </div>

            {/* 编码 + 名称 */}
            <div className="bom-tree-td" style={{ flex: '1 1 200px', paddingLeft: indent }}>
              {/* 连接线 */}
              <span style={{ color: '#d9d9d9', marginRight: 4, fontFamily: 'monospace', fontSize: 12 }}>
                {row.level > 1 ? '└─' : '├─'}
              </span>
              {/* 图标 */}
              {hasChild
                ? (isOpen
                    ? <FolderOpenOutlined style={{ color: lvColor, marginRight: 4, fontSize: 13 }} />
                    : <FolderOutlined    style={{ color: lvColor, marginRight: 4, fontSize: 13 }} />)
                : <FileTextOutlined style={{ color: '#bfbfbf', marginRight: 4, fontSize: 13 }} />
              }
              <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 600, color: lvColor }}>
                {row.code}
              </span>
              <span style={{ fontSize: 12, color: '#303133', marginLeft: 6 }}>{row.name}</span>
              {row.spec && (
                <span style={{ fontSize: 11, color: '#909399', marginLeft: 4 }}>({row.spec})</span>
              )}
            </div>

            {/* 规格 */}
            <div className="bom-tree-td" style={{ flex: '0 0 110px', fontSize: 12, color: '#606266' }}>
              {row.spec || '—'}
            </div>

            {/* 数量 */}
            <div className="bom-tree-td" style={{ flex: '0 0 72px', textAlign: 'right', fontSize: 12, fontVariantNumeric: 'tabular-nums', fontWeight: 600, color: '#303133' }}>
              {Number(row.qty).toFixed(2)}
            </div>

            {/* 单位 */}
            <div className="bom-tree-td" style={{ flex: '0 0 58px', fontSize: 12, color: '#606266' }}>
              {row.unit}
            </div>

            {/* BOM状态 */}
            <div className="bom-tree-td" style={{ flex: '0 0 80px', textAlign: 'center' }}>
              {row.status ? statusBadge(row.status) : <span style={{ color: '#bfbfbf', fontSize: 11 }}>—</span>}
            </div>

            {/* 展开/折叠 */}
            <div className="bom-tree-td" style={{ flex: '0 0 70px', textAlign: 'center' }}>
              {hasChild ? (
                <Button
                  type="link"
                  size="small"
                  icon={isOpen ? <MinusSquareOutlined /> : <PlusSquareOutlined />}
                  style={{ padding: '0 4px', fontSize: 13, color: isOpen ? '#FAAD14' : '#1677FF' }}
                  onClick={() => toggleNode(row.key)}
                >
                  {isOpen ? '折叠' : `展开(${row.children.length})`}
                </Button>
              ) : (
                <span style={{ color: '#bfbfbf', fontSize: 11 }}>叶节点</span>
              )}
            </div>
          </div>
        );
      })}

      {flatRows.length === 0 && (
        <div style={{ padding: '20px 0', textAlign: 'center', color: '#909399', fontSize: 13 }}>
          所有子件已折叠，点击「全部展开」查看完整结构
        </div>
      )}

      {/* 汇总行 */}
      <div className="bom-tree-summary">
        <span>共 <b>{countAllNodes(nodes)}</b> 个子件节点</span>
        <span style={{ marginLeft: 16 }}>最大层级：<b>{getMaxLevel(nodes)}</b> 级</span>
      </div>
    </div>
  );
};

/* 递归统计节点总数 */
function countAllNodes(nodes: BomTreeNode[]): number {
  return nodes.reduce((sum, n) => sum + 1 + countAllNodes(n.children), 0);
}
/* 递归获取最大层级 */
function getMaxLevel(nodes: BomTreeNode[]): number {
  if (nodes.length === 0) return 0;
  return Math.max(...nodes.map(n => Math.max(n.level, getMaxLevel(n.children))));
}

const BomDetailPage: React.FC<BomDetailPageProps> = ({ bom, mode, onBack, onSave, onDelete }) => {
  const [editMode, setEditMode] = useState<'view' | 'edit' | 'new'>(mode);
  const [headerForm] = Form.useForm();
  const [data, setData] = useState<BomHeader>(bom || emptyBom);
  const [children, setChildren] = useState<BomChild[]>(bom?.children || []);
  const isSavingRef = React.useRef(false);           // 防重复提交（useRef 同步锁，比 useState 更可靠）
  const [isSaving, setIsSaving] = useState(false);   // 仅用于 loading 按钮 UI
  const [apiMaterials, setApiMaterials] = useState<MaterialRecord[]>([]);

  // ── 从后端加载物料档案（用于母件/子件选项）────────────────────────
  const loadMaterialsFromApi = useCallback(async () => {
    try {
      const resp = await getMaterialList() as any;
      const list: MaterialRecord[] = resp?.data ?? [];
      if (list.length > 0) setApiMaterials(list);
    } catch { /* fall back to mockMaterials */ }
  }, []);

  useEffect(() => { loadMaterialsFromApi(); }, [loadMaterialsFromApi]);

  // Merge API materials with mock (API-first replace when available)
  const effectiveMaterials = useMemo(() => {
    if (apiMaterials.length === 0) return mockMaterials;
    return apiMaterials.map(m => ({
      id: String(m.id ?? ''),
      code: m.code ?? '',
      name: m.name ?? '',
      spec: m.spec ?? '',
      unit: m.unitName ?? '个',
      unitId: '',
      type: m.type ?? '原材料',
    }));
  }, [apiMaterials]);

  // ── 从后端加载 BOM 明细子件 ─────────────────────────────────────
  const loadDetailsFromApi = useCallback(async (bomId?: string | number) => {
    if (!bomId) return;
    // Strip 'api-' prefix if present (BomIndex stores IDs as 'api-{n}')
    const rawId = typeof bomId === 'string' ? bomId.replace('api-', '') : String(bomId);
    const numId = parseInt(rawId, 10);
    if (isNaN(numId) || numId <= 0) return;
    try {
      const resp = await getBomDetails(numId) as any;
      const apiList: any[] = resp?.data ?? [];
      const newItems: BomChild[] = apiList.map((item, idx) => ({
          id:         String(item.id ?? `api-${idx}`),
          rowNo:      item.lineNo ?? (idx + 1) * 10,
          childCode:  item.materialCode ?? '',
          childName:  item.materialName ?? '',
          spec:       item.spec ?? '',
          freeDesc:   '',
          qty:        item.quantity ?? 1,
          unit:       item.unitName ?? '个',
          childQty:   item.quantity ?? 1,
          calcUnit:   item.unitName ?? '个',
          type:       '标准',
          remark:     item.remark ?? '',
        } as BomChild));
      setChildren(newItems);  // API-first REPLACE（含空数组，清除脏数据）
      lastLoadedBomId.current = rawId;
    } catch { /* 后端不可用时使用已有 mock 子件 */ }
  }, []);

  // 用 ref 记录上次加载的 bom id，避免重复拉取
  const lastLoadedBomId = React.useRef<string | undefined>(undefined);

  useEffect(() => {
    // Strip 'api-' prefix before passing to loadDetailsFromApi
    const resolvedId = bom?.id ? bom.id.replace('api-', '') : undefined;
    // 只有 bom id 真正变化时才重新拉取（防止 onSave 触发的 bom prop 更新反复覆盖 children）
    if (resolvedId && resolvedId !== lastLoadedBomId.current) {
      lastLoadedBomId.current = resolvedId;
      loadDetailsFromApi(resolvedId);
    }
  }, [bom?.id, loadDetailsFromApi]);
  const [selectedChildKeys, setSelectedChildKeys] = useState<React.Key[]>([]);
  const [childModalOpen, setChildModalOpen] = useState(false);
  const [editingChild, setEditingChild] = useState<BomChild | null>(null);
  const [childForm] = Form.useForm();
  const [activeChildTab, setActiveChildTab] = useState('materials');

  // ── BOM 多级展开 state ────────────────────────────────────────
  const [bomTreeData,     setBomTreeData]     = useState<BomTreeNode[]>([]);
  const [bomTreeLoading,  setBomTreeLoading]  = useState(false);
  const [bomTreeExpanded, setBomTreeExpanded] = useState<string[]>([]);
  const bomTreeBuiltRef  = useRef<string | undefined>(undefined); // 防重复构建
  const [parentCodeSearch, setParentCodeSearch] = useState('');

  useEffect(() => {
    const src = bom || emptyBom;
    setData(src);
    // 只在首次打开或切换到新 BOM 时重置 children（不要覆盖已编辑的 children state）
    // loadDetailsFromApi 会负责从 API 拉取真实子件并替换
    if (!bom?.id || bom.id !== lastLoadedBomId.current) {
      setChildren(src.children || []);
    }
    setEditMode(mode);
    headerForm.setFieldsValue({
      ...src,
      effectDate: src.effectDate ? dayjs(src.effectDate) : null,
    });
    setParentCodeSearch(src.code || '');
  }, [bom, mode, headerForm]);

  const isEditable = editMode === 'edit' || editMode === 'new';

  /* ── 动态物料选项（来自 API 或 mock 降级）── */
  const parentMaterialOptions = useMemo(() => effectiveMaterials
    .filter(m => m.type === '半成品' || m.type === '成品')
    .map(m => ({ value: m.code, label: `${m.code}  ${m.name}  ${m.spec || ''}`, material: m })),
  [effectiveMaterials]);

  const materialOptions = useMemo(() => effectiveMaterials.map(m => ({
    value: m.code, label: `${m.code}  ${m.name}  ${m.spec || ''}`, material: m,
  })), [effectiveMaterials]);

  /* ── 母件物料选项过滤（仅半成品/成品）── */
  const filteredParentOptions = parentCodeSearch
    ? parentMaterialOptions.filter(o =>
        o.value.toLowerCase().includes(parentCodeSearch.toLowerCase()) ||
        o.material.name.includes(parentCodeSearch) ||
        (o.material.spec || '').includes(parentCodeSearch)
      ).slice(0, 30)
    : parentMaterialOptions.slice(0, 30);

  /* ── 选中母件时回填 ── */
  const handleSelectParent = (val: string) => {
    const mat = parentMaterialOptions.find(o => o.value === val)?.material;
    if (mat) {
      setParentCodeSearch(mat.code);
      headerForm.setFieldsValue({
        code: mat.code, name: mat.name,
        spec: mat.spec || '',
        unit: mat.unit || '个',
        mainUnit: mat.unit || '个',
        calcUnit: mat.unit || '个',
      });
    }
  };

  /* ── 母件编码手动输入时同步 Form code 字段 ── */
  const handleParentCodeChange = (val: string) => {
    setParentCodeSearch(val);
    headerForm.setFieldValue('code', val);
  };

  /* ── 母件下拉选项
   *  AutoComplete 选中后输入框显示的是 label（若为字符串）或 value（若 label 是 ReactNode）
   *  为保证输入框只回显编码，将 label 设为编码字符串，下拉渲染通过 options[].label JSX 实现。
   *  注：Ant Design AutoComplete 实际上：选中时把 option.value 填入输入框（受控 value/onChange），
   *      label 只影响下拉列表里的文本展示，不影响输入框。因此用纯字符串 label 即可。
   * ── */
  const parentAutoOptions = filteredParentOptions.map(o => ({
    value: o.value,           // 选中后 onChange(val) 拿到这个值，也是填回输入框的值
    label: `[${o.material.type}] ${o.value}  ${o.material.name}${o.material.spec ? '  ' + o.material.spec : ''}`,
    material: o.material,
  }));

  /* ── 保存（API-first） ── */
  const handleSaveAll = () => {
    if (isSavingRef.current) return;  // 同步锁，防止并发点击绕过 useState 异步更新
    isSavingRef.current = true;
    headerForm.validateFields().then(async values => {
      const effectDate = values.effectDate ? values.effectDate.format('YYYY-MM-DD') : '';
      setIsSaving(true);
      try {
        // ── 1. 保存 BOM 表头 ──────────────────────────────────────
        // 查找母件物料 ID（backend material_id NOT NULL）
        const parentMat = effectiveMaterials.find(m => m.code === values.code);
        const materialId = parentMat?.id ? Number(parentMat.id) : undefined;

        const bomPayload: any = {
          code:         values.code,
          version:      values.version ?? '1.00',
          bomType:      values.bomType ?? '主BOM',
          status:       'DRAFT',
          materialCode: values.code,
          materialName: values.name,
          quantity:     values.mainQty ?? 1,
          unitName:     values.unit ?? '个',
          effectiveDate: effectDate,
          remark:       values.remark ?? '',
        };
        // 只有找到物料 ID 时才带入（新建必需，更新可省略）
        if (materialId) bomPayload.materialId = materialId;

        let savedId: number | undefined;
        // 从 ID 判断是否已持久化（'api-N' 或纯数字字符串均视为已有记录）
        const rawId = (data.id ?? '').replace('api-', '').trim();
        const numId = parseInt(rawId, 10);
        if (!isNaN(numId) && numId > 0) {
          // 编辑已有 BOM → PUT
          await updateBom(numId, bomPayload);
          savedId = numId;
        } else {
          // 新建 BOM → POST
          const resp = await createBom(bomPayload) as any;
          savedId = resp?.data?.id;
          // 立刻把 data.id 更新为持久化 ID，防止二次提交时再次走 POST
          if (savedId) setData(prev => ({ ...prev, id: `api-${savedId}` }));
        }

        // ── 2. 保存 BOM 子件（从后端获取当前真实 ID 全删，再写入）──
        if (savedId) {
          // 先从后端获取最新的子件列表（得到真实 DB id），避免用前端缓存的旧 id
          const currentResp = await getBomDetails(savedId) as any;
          const currentDetails: any[] = currentResp?.data ?? [];
          // 删除后端现存的所有子件
          if (currentDetails.length > 0) {
            await Promise.allSettled(
              currentDetails.map(d => deleteBomDetail(d.id))
            );
          }

          // 写入当前 children state（用户编辑后的最终状态）
          const createResults = await Promise.allSettled(children.map((c, idx) =>
            createBomDetail({
              bomId:        savedId,
              lineNo:       c.rowNo ?? (idx + 1) * 10,
              materialCode: c.childCode,
              materialName: c.childName,
              spec:         c.spec ?? '',
              quantity:     c.qty ?? 1,
              unitName:     c.unit ?? '个',
              remark:       '',
            })
          ));

          // 用后端返回的真实 ID 更新 children state，避免下次保存用旧 id
          const newChildren: BomChild[] = children.map((c, idx) => {
            const res = createResults[idx];
            const newId = res.status === 'fulfilled'
              ? String((res.value as any)?.data?.id ?? c.id)
              : c.id;
            return { ...c, id: newId };
          });
          setChildren(newChildren);
          lastLoadedBomId.current = String(savedId); // 标记已同步，防止 useEffect 再次覆盖
        }

        // ── 3. 更新本地状态 ────────────────────────────────────────
        const saved: BomHeader = {
          ...data,
          ...values,
          effectDate,
          id: savedId ? `api-${savedId}` : (data.id || Date.now().toString()),
          children,
          createdAt: data.createdAt || new Date().toLocaleString('zh-CN'),
          createdBy: data.createdBy || '当前用户',
        };
        onSave(saved);
        message.success(editMode === 'new' ? '新增BOM成功' : '保存成功');
        setEditMode('view');
        setData(saved);
      } catch (err: any) {
        console.error('BOM save error:', err);
        // 针对重复编码+版本的友好提示（UK约束冲突）
        const errMsg: string = String(err?.response?.data?.message ?? err?.message ?? '');
        if (errMsg.includes('Duplicate entry') || errMsg.includes('uk_code_version')) {
          message.error(`编码 ${values.code} + 版本 ${values.version ?? '1.00'} 的BOM已存在，请修改版本号后重试`);
        }
        // 其余错误由 http interceptor 统一弹出
      } finally {
        isSavingRef.current = false;  // 解同步锁
        setIsSaving(false);           // 解 UI loading
      }
    }).catch((err: any) => { isSavingRef.current = false; setIsSaving(false); if (err?.errorFields) return; });
  };

  /* ── 状态操作 ── */
  const changeStatus = (status: BomStatus, tips: string) => {
    const updated: BomHeader = {
      ...data, status,
      auditedBy: (status === 'audited' || status === 'approved')
        ? '当前用户' : (data.auditedBy || ''),
      auditedAt: (status === 'audited' || status === 'approved')
        ? new Date().toLocaleString('zh-CN') : (data.auditedAt || ''),
    };
    setData(updated);
    onSave(updated);
    message.success(tips);
  };

  /* ── 子件 CRUD ── */
  const openAddChild = () => {
    setEditingChild(null);
    childForm.resetFields();
    childForm.setFieldsValue({
      type: '标准', qty: 1, unit: '个', childQty: 1, calcUnit: '个',
      rowNo: (children.length + 1) * 10,
    });
    setChildModalOpen(true);
  };

  const openEditChild = (c: BomChild) => {
    setEditingChild(c);
    childForm.setFieldsValue(c);
    setChildModalOpen(true);
  };

  const handleSaveChild = () => {
    childForm.validateFields().then(values => {
      if (editingChild) {
        setChildren(prev => prev.map(c => c.id === editingChild.id ? { ...c, ...values } : c));
        message.success('修改成功');
      } else {
        const newChild: BomChild = { ...values, id: `c${++childIdSeq}`, freeDesc: '' };
        setChildren(prev => [...prev, newChild]);
        message.success('新增成功');
      }
      setChildModalOpen(false);
    }).catch((err: any) => { if (err?.errorFields) return; });
  };

  const handleDeleteChild = (ids: React.Key[]) => {
    setChildren(prev => prev.filter(c => !ids.includes(c.id)));
    setSelectedChildKeys([]);
    message.success('删除成功');
  };

  const handleCopyChild = () => {
    const toCopy = children.filter(c => selectedChildKeys.includes(c.id));
    const copies = toCopy.map(c => ({ ...c, id: `c${++childIdSeq}`, rowNo: c.rowNo + 100 }));
    setChildren(prev => [...prev, ...copies]);
    message.success(`已复制 ${copies.length} 行`);
    setSelectedChildKeys([]);
  };

  // ── BOM 多级展开：递归构建树（最多 8 层，防循环）─────────────
  const buildBomTree = useCallback(async (
    code: string,
    bomId: number,
    level: number,
    qty: number,
    unit: string,
    visited: Set<string>,
    keyPrefix: string,
  ): Promise<BomTreeNode[]> => {
    if (level > 8) return [];                 // 最多 8 层
    if (visited.has(code)) return [];         // 防循环引用
    visited.add(code);

    try {
      const resp = await getBomDetails(bomId) as any;
      const details: any[] = resp?.data ?? [];
      if (details.length === 0) return [];

      // 并行判断每个子件是否有自己的 BOM（即是否可继续展开）
      const bomListResp = await getBomList() as any;
      const allBoms: any[] = bomListResp?.data ?? [];

      const nodes: BomTreeNode[] = await Promise.all(
        details.map(async (d: any, idx: number) => {
          const childCode  = d.materialCode ?? '';
          const childBom   = allBoms.find((b: any) => b.code === childCode);
          const childBomId = childBom ? Number(childBom.id) : undefined;
          const nodeKey    = `${keyPrefix}-${idx}`;

          let subChildren: BomTreeNode[] = [];
          if (childBomId && !visited.has(childCode)) {
            subChildren = await buildBomTree(
              childCode, childBomId,
              level + 1,
              Number(d.quantity ?? 1),
              d.unitName ?? '个',
              new Set(visited),
              nodeKey,
            );
          }

          return {
            key:      nodeKey,
            level,
            code:     childCode,
            name:     d.materialName ?? '',
            spec:     d.spec ?? '',
            qty:      Number(d.quantity ?? 1),
            unit:     d.unitName ?? '个',
            type:     '标准',
            status:   childBom ? normalizeStatus(childBom.status) : '',
            bomId:    childBomId,
            isLeaf:   subChildren.length === 0,
            children: subChildren,
          } as BomTreeNode;
        })
      );
      return nodes;
    } catch {
      return [];
    }
  }, []);

  const loadBomTree = useCallback(async () => {
    if (!data.id) return;
    const rawId = data.id.replace('api-', '');
    const numId = parseInt(rawId, 10);
    if (isNaN(numId) || numId <= 0) return;
    // 防止切换 tab 时重复加载同一 BOM
    if (bomTreeBuiltRef.current === rawId && bomTreeData.length > 0) return;

    setBomTreeLoading(true);
    try {
      const nodes = await buildBomTree(
        data.code, numId, 1, 1, data.unit, new Set<string>(), 'root'
      );
      setBomTreeData(nodes);
      bomTreeBuiltRef.current = rawId;
      // 默认展开第 1、2 层
      const firstLevelKeys = nodes.map(n => n.key);
      const secondLevelKeys = nodes.flatMap(n => n.children.map(c => c.key));
      setBomTreeExpanded([...firstLevelKeys, ...secondLevelKeys]);
    } finally {
      setBomTreeLoading(false);
    }
  }, [data.id, data.code, data.unit, buildBomTree, bomTreeData.length]);

  /* ── 子件联动 ── */
  const handleSelectChild = (val: string) => {
    const mat = materialOptions.find(o => o.value === val)?.material;
    if (mat) {
      childForm.setFieldsValue({
        childCode: mat.code, childName: mat.name,
        spec: mat.spec || '',
        unit: mat.unit || '个',
        calcUnit: mat.unit || '个',
      });
    }
  };

  /* ── 子件列 ── */
  const childColumns: ColumnsType<BomChild> = [
    {
      title: '序号', width: 48, align: 'center',
      render: (_: any, __: any, i: number) => (
        <span style={{ color: '#909399', fontSize: 11 }}>{i + 1}</span>
      ),
    },
    {
      title: '行号', dataIndex: 'rowNo', width: 60, align: 'center',
      render: (v: number) => <span style={{ fontSize: 12 }}>{v}</span>,
    },
    {
      title: '子件编码', dataIndex: 'childCode', width: 140,
      render: (v: string) => <span className="link-cell">{v}</span>,
    },
    {
      title: '子件名称', dataIndex: 'childName', width: 190, ellipsis: true,
      render: (v: string) => <span style={{ fontSize: 12, color: '#1677FF' }}>{v}</span>,
    },
    {
      title: '规格型号', dataIndex: 'spec', width: 110, ellipsis: true,
      render: (v: string) => <span style={{ fontSize: 12, color: '#606266' }}>{v || '—'}</span>,
    },
    {
      title: '类型', dataIndex: 'type', width: 68,
      render: (v: string) => <span style={{ fontSize: 12 }}>{v}</span>,
    },
    {
      title: '主数量', dataIndex: 'qty', width: 88, align: 'right',
      render: (v: number) => (
        <span style={{ fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>
          {Number(v).toFixed(2)}
        </span>
      ),
    },
    {
      title: '主单位', dataIndex: 'unit', width: 68,
      render: (v: string) => <span style={{ fontSize: 12 }}>{v}</span>,
    },
    {
      title: '子件数量', dataIndex: 'childQty', width: 88, align: 'right',
      render: (v: number) => (
        <span style={{ fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>
          {Number(v).toFixed(2)}
        </span>
      ),
    },
    {
      title: '计算单位', dataIndex: 'calcUnit', width: 78,
      render: (v: string) => <span style={{ fontSize: 12 }}>{v}</span>,
    },
    {
      title: '损耗率%', dataIndex: 'lossRate', width: 78, align: 'right' as const,
      render: (v: number) => v != null ? <span style={{ fontSize: 12, color: v > 5 ? '#f5222d' : '#52c41a' }}>{v}%</span> : <span style={{ color: '#ccc' }}>—</span>,
    },
    {
      title: '领料方式', dataIndex: 'issueMethod', width: 90,
      render: (v: string) => {
        const map: Record<string, { label: string; color: string }> = {
          PUSH: { label: '主动领料', color: 'blue' },
          BACKFLUSH: { label: '倒扣', color: 'purple' },
          ON_SITE: { label: '现场领', color: 'cyan' },
        };
        const m = map[v];
        return m ? <Tag color={m.color} style={{ fontSize: 11 }}>{m.label}</Tag> : <span style={{ color: '#ccc' }}>—</span>;
      },
    },
    {
      title: '倒扣工序', dataIndex: 'consumeOp', width: 100,
      render: (v: string) => v ? <Tag style={{ fontSize: 11 }}>{v}</Tag> : <span style={{ color: '#ccc' }}>—</span>,
    },
    {
      title: '线边仓', dataIndex: 'wipWarehouse', width: 110, ellipsis: true,
      render: (v: string) => v ? <span style={{ fontSize: 12 }}>{v}</span> : <span style={{ color: '#ccc' }}>—</span>,
    },
    {
      title: '关键料', dataIndex: 'keyMaterial', width: 70, align: 'center' as const,
      render: (v: boolean) => v ? <Tag color="red" style={{ fontSize: 10 }}>关键</Tag> : null,
    },
    ...(isEditable ? [{
      title: '操作', width: 110, fixed: 'right' as const,
      render: (_: any, record: BomChild) => (
        <Space size={0} split={<span style={{ color: '#e4e7ed', margin: '0 1px' }}>|</span>}>
          <Button type="link" size="small"
            style={{ padding: '0 4px', fontSize: 12, color: '#606266' }}
            icon={<EditOutlined />}
            onClick={() => openEditChild(record)}>编辑</Button>
          <Popconfirm
            title="确认删除此子件行？"
            onConfirm={() => handleDeleteChild([record.id])}
            okText="确认" cancelText="取消"
            okButtonProps={{ danger: true }}
            icon={<ExclamationCircleOutlined style={{ color: '#E60012' }} />}>
            <Button type="link" danger size="small"
              style={{ padding: '0 4px', fontSize: 12 }}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    }] : []),
  ];

  const st = statusMap[data.status] || statusMap.draft;

  /* ── 顶部工具栏按钮组（查看模式）── */
  const ViewModeButtons = () => (
    <>
      {/* 修改 */}
      <Button size="small" className="btn-primary-red" icon={<EditOutlined />}
        onClick={() => setEditMode('edit')}
        disabled={data.status === 'disabled'}>修改</Button>

      {/* 删除 */}
      <Popconfirm
        title="确认删除此BOM？" description="删除后数据不可恢复"
        onConfirm={() => { onDelete?.(data.id); onBack(); message.success('已删除'); }}
        okText="确认删除" cancelText="取消" okButtonProps={{ danger: true }}>
        <Button size="small" danger className="toolbar-btn" icon={<DeleteOutlined />}>删除</Button>
      </Popconfirm>

      <Divider type="vertical" style={{ height: 20, margin: '0 3px', borderColor: '#e4e7ed' }} />

      {/* 审核 */}
      <Tooltip title={data.status !== 'draft' ? '只有草稿状态可审核' : ''}>
        <Button size="small" className="toolbar-btn" icon={<AuditOutlined />}
          disabled={data.status !== 'draft'}
          onClick={() => changeStatus('audited', '审核成功')}>审核</Button>
      </Tooltip>

      {/* 反审核 */}
      <Tooltip title={data.status !== 'audited' && data.status !== 'approved' ? '只有已审核/已批准可反审核' : ''}>
        <Button size="small" className="toolbar-btn" icon={<RollbackOutlined />}
          disabled={data.status !== 'audited' && data.status !== 'approved'}
          onClick={() => changeStatus('draft', '已反审核，退回草稿')}>反审核</Button>
      </Tooltip>

      {/* 批准 */}
      <Tooltip title={data.status !== 'audited' ? '只有已审核状态可批准' : ''}>
        <Button size="small" className="toolbar-btn" icon={<CheckCircleOutlined />}
          disabled={data.status !== 'audited'}
          onClick={() => changeStatus('approved', '已批准')}>批准</Button>
      </Tooltip>

      <Divider type="vertical" style={{ height: 20, margin: '0 3px', borderColor: '#e4e7ed' }} />

      {/* 禁用 */}
      <Tooltip title={data.status === 'disabled' ? '已是禁用状态' : ''}>
        <Button size="small" className="toolbar-btn" icon={<StopOutlined />}
          disabled={data.status === 'disabled'}
          onClick={() => changeStatus('disabled', '已禁用')}>禁用</Button>
      </Tooltip>

      {/* 启用 */}
      <Tooltip title={data.status !== 'disabled' ? '只有禁用状态可启用' : ''}>
        <Button size="small" className="toolbar-btn" icon={<CheckCircleOutlined />}
          disabled={data.status !== 'disabled'}
          style={data.status === 'disabled' ? { color: '#67c23a', borderColor: '#67c23a' } : {}}
          onClick={() => changeStatus('draft', '已启用，退回草稿状态')}>启用</Button>
      </Tooltip>

      <Divider type="vertical" style={{ height: 20, margin: '0 3px', borderColor: '#e4e7ed' }} />

      <Button size="small" className="toolbar-btn" icon={<CopyOutlined />}>复制</Button>
      <Button size="small" className="toolbar-btn" icon={<PrinterOutlined />}>打印</Button>
      <Button size="small" className="toolbar-btn" icon={<ExportOutlined />}>导出</Button>
      <Button size="small" className="toolbar-btn" icon={<HistoryOutlined />}>变更历史</Button>
    </>
  );

  return (
    <div className="bom-detail-page">

      {/* ══ 顶部操作栏 ══ */}
      <div className="detail-topbar">
        <div className="detail-topbar-left">
          <Button type="text" className="detail-back-btn"
            icon={<ArrowLeftOutlined />}
            onClick={onBack}>返回列表</Button>

          <span className="detail-doc-code">
            {data.code ? `BOM — ${data.code}` : '新建物料清单'}
          </span>

          {data.id && (
            <span
              className="detail-status-tag"
              style={{ background: st.bg, color: st.color, borderColor: st.border }}
            >
              {st.label}
            </span>
          )}
        </div>

        <div className="detail-topbar-btns">
          {editMode === 'view' && <ViewModeButtons />}

          {isEditable && (
            <>
              <Button size="small" className="btn-primary-red"
                icon={<SaveOutlined />}
                loading={isSaving}
                disabled={isSaving}
                onClick={handleSaveAll}>保存</Button>
              <Button size="small" className="toolbar-btn"
                icon={<CloseOutlined />}
                onClick={() => { if (editMode === 'new') onBack(); else setEditMode('view'); }}>
                {editMode === 'new' ? '取消' : '放弃修改'}
              </Button>
            </>
          )}

          {/* 右侧辅助按钮 */}
          <Divider type="vertical" style={{ height: 20, margin: '0 3px', borderColor: '#e4e7ed' }} />
          <Tooltip title="刷新">
            <Button type="text" size="small" icon={<ReloadOutlined />}
              style={{ color: '#909399', padding: '0 6px' }} />
          </Tooltip>
        </div>
      </div>

      {/* ══ 单据页签 ══ */}
      <div className="detail-header-tabs">
        <Tabs
          size="small"
          defaultActiveKey="basic"
          items={[
            { key: 'basic', label: '配方信息' },
          ]}
          tabBarStyle={{ margin: 0 }}
        />
      </div>

      {/* ══ 主产品基本信息 ══ */}
      <div className="detail-header-form">
        <div className="form-section-title">
          <div className="form-section-bar" />
          主产品基本信息
        </div>

        <div className="detail-form-body">
          <Form
            form={headerForm}
            layout="vertical"
            size="small"
            disabled={!isEditable}
          >
            <Row gutter={[20, 4]}>

              {/* 母件编码 */}
              <Col xs={24} sm={12} md={8} lg={6}>
                <Form.Item
                  label={
                    <span>
                      母件编码
                      <span style={{ fontSize: 11, color: '#909399', marginLeft: 6 }}>
                        （仅限半成品/成品）
                      </span>
                    </span>
                  }
                  name="code"
                  rules={[{ required: true, message: '请输入或选择母件编码' }]}
                  style={{ marginBottom: 12 }}>
                  <AutoComplete
                    size="small"
                    style={{ width: '100%' }}
                    onChange={handleParentCodeChange}
                    onSelect={handleSelectParent}
                    placeholder="输入编码/名称搜索（半成品/成品）..."
                    filterOption={false}
                    options={parentAutoOptions.map(o => ({
                      value: o.value,
                      label: o.label,
                    }))}
                  />
                </Form.Item>
              </Col>

              {/* 物料名称 */}
              <Col xs={24} sm={12} md={8} lg={6}>
                <Form.Item label="物料名称" name="name"
                  rules={[{ required: true, message: '请输入物料名称' }]}
                  style={{ marginBottom: 12 }}>
                  <Input size="small" placeholder="物料名称（可从母件编码自动回填）" />
                </Form.Item>
              </Col>

              {/* 规格型号 */}
              <Col xs={24} sm={12} md={6} lg={5}>
                <Form.Item label="规格型号" name="spec" style={{ marginBottom: 12 }}>
                  <Input size="small" placeholder="规格型号" />
                </Form.Item>
              </Col>

              {/* 单位 */}
              <Col xs={12} sm={6} md={4} lg={3}>
                <Form.Item label="单位" name="unit" style={{ marginBottom: 12 }}>
                  <Select size="small" options={UNIT_OPTIONS} />
                </Form.Item>
              </Col>

              {/* BOM类型 */}
              <Col xs={12} sm={6} md={4} lg={4}>
                <Form.Item label="BOM类型" name="bomType" style={{ marginBottom: 12 }}>
                  <Select size="small" options={[
                    { value: '主BOM', label: '主BOM' },
                    { value: '替代BOM', label: '替代BOM' },
                    { value: '销售BOM', label: '销售BOM' },
                  ]} />
                </Form.Item>
              </Col>

              {/* 版本号 */}
              <Col xs={12} sm={6} md={4} lg={4}>
                <Form.Item label="版本号" name="version" style={{ marginBottom: 12 }}>
                  <Input size="small" placeholder="如：1.00" />
                </Form.Item>
              </Col>

              {/* 主批量 */}
              <Col xs={12} sm={6} md={4} lg={4}>
                <Form.Item label="主批量" name="mainQty" style={{ marginBottom: 12 }}>
                  <InputNumber size="small" style={{ width: '100%' }} min={0} precision={2} />
                </Form.Item>
              </Col>

              {/* 主单位 */}
              <Col xs={12} sm={6} md={4} lg={3}>
                <Form.Item label="主单位" name="mainUnit" style={{ marginBottom: 12 }}>
                  <Select size="small" options={UNIT_OPTIONS} />
                </Form.Item>
              </Col>

              {/* 批量 */}
              <Col xs={12} sm={6} md={4} lg={4}>
                <Form.Item label="基础批量" name="batchQty" style={{ marginBottom: 12 }}>
                  <InputNumber size="small" style={{ width: '100%' }} min={0} precision={2} />
                </Form.Item>
              </Col>

              {/* 计量单位 */}
              <Col xs={12} sm={6} md={4} lg={3}>
                <Form.Item label="计量单位" name="calcUnit" style={{ marginBottom: 12 }}>
                  <Select size="small" options={UNIT_OPTIONS} />
                </Form.Item>
              </Col>

              {/* 生效日期 */}
              <Col xs={12} sm={6} md={6} lg={4}>
                <Form.Item label="生效日期" name="effectDate" style={{ marginBottom: 12 }}>
                  <DatePicker size="small" style={{ width: '100%' }} placeholder="选择生效日期" />
                </Form.Item>
              </Col>

              {/* 备注 */}
              <Col xs={24} sm={12} md={10} lg={8}>
                <Form.Item label="备注" name="remark" style={{ marginBottom: 12 }}>
                  <Input size="small" placeholder="备注信息" />
                </Form.Item>
              </Col>

            </Row>
          </Form>
        </div>
      </div>

      {/* ══ 子件区 ══ */}
      <div className="detail-child-section">
        <div className="child-tabs-bar">
          <Tabs
            size="small"
            activeKey={activeChildTab}
            onChange={key => {
              setActiveChildTab(key);
              if (key === 'bom-tree') loadBomTree();
            }}
            items={[
              { key: 'materials', label: '物料信息' },
              { key: 'attachment', label: '附件' },
              {
                key: 'bom-tree',
                label: (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <ApartmentOutlined style={{ fontSize: 12 }} />
                    BOM多级展开
                  </span>
                ),
              },
            ]}
            tabBarStyle={{ margin: 0 }}
          />
          {isEditable && activeChildTab === 'materials' && (
            <div className="child-toolbar">
              <Button size="small" className="btn-outline-blue"
                icon={<PlusOutlined />}
                onClick={openAddChild}>新增物料行</Button>
              <Button size="small" className="toolbar-btn"
                icon={<CopyOutlined />}
                disabled={selectedChildKeys.length === 0}
                onClick={handleCopyChild}>复制</Button>
              <Popconfirm
                title={`确认删除选中的 ${selectedChildKeys.length} 行？`}
                onConfirm={() => handleDeleteChild(selectedChildKeys)}
                disabled={selectedChildKeys.length === 0}
                okText="确认" cancelText="取消"
                okButtonProps={{ danger: true }}>
                <Button size="small" danger className="toolbar-btn"
                  icon={<DeleteOutlined />}
                  disabled={selectedChildKeys.length === 0}>删除</Button>
              </Popconfirm>
            </div>
          )}
          {activeChildTab === 'bom-tree' && (
            <div className="child-toolbar">
              <Button size="small" className="toolbar-btn"
                icon={<PlusSquareOutlined />}
                onClick={() => {
                  const getAllKeys = (nodes: BomTreeNode[]): string[] =>
                    nodes.flatMap(n => [n.key, ...getAllKeys(n.children)]);
                  setBomTreeExpanded(getAllKeys(bomTreeData));
                }}>全部展开</Button>
              <Button size="small" className="toolbar-btn"
                icon={<MinusSquareOutlined />}
                onClick={() => setBomTreeExpanded([])}>全部折叠</Button>
              <Button size="small" className="toolbar-btn"
                icon={<ReloadOutlined />}
                loading={bomTreeLoading}
                onClick={() => {
                  bomTreeBuiltRef.current = undefined;
                  setBomTreeData([]);
                  loadBomTree();
                }}>刷新</Button>
            </div>
          )}
        </div>

        {/* 物料信息 tab */}
        {activeChildTab === 'materials' && (
          <div className="child-table-wrap">
            <Table
              rowKey="id"
              dataSource={children}
              columns={childColumns}
              rowSelection={isEditable ? {
                selectedRowKeys: selectedChildKeys,
                onChange: setSelectedChildKeys,
                columnWidth: 36,
              } : undefined}
              pagination={false}
              size="small"
              scroll={{ x: 960 }}
              className="child-table"
              locale={{ emptyText: '暂无子件，点击「新增物料行」添加' }}
              summary={rows => rows.length > 0 ? (
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={isEditable ? 7 : 6}
                    align="right">
                    <span style={{ fontSize: 11, color: '#909399', fontWeight: 600 }}>
                      合计（主数量）：
                    </span>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1} align="right">
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#303133', fontVariantNumeric: 'tabular-nums' }}>
                      {rows.reduce((s, r) => s + (Number(r.qty) || 0), 0).toFixed(2)}
                    </span>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2} colSpan={3} />
                </Table.Summary.Row>
              ) : null}
            />
          </div>
        )}

        {/* 附件 tab */}
        {activeChildTab === 'attachment' && (
          <div style={{ padding: '24px 16px', color: '#909399', fontSize: 13, textAlign: 'center' }}>
            附件功能开发中...
          </div>
        )}

        {/* BOM多级展开 tab */}
        {activeChildTab === 'bom-tree' && (
          <div className="bom-tree-wrap">
            {bomTreeLoading ? (
              <div style={{ padding: 40, textAlign: 'center' }}>
                <Spin tip="正在加载BOM多级结构..." size="large" />
              </div>
            ) : bomTreeData.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#909399', fontSize: 13 }}>
                <ApartmentOutlined style={{ fontSize: 36, marginBottom: 8, display: 'block' }} />
                暂无子件数据，或此BOM没有多级展开结构
              </div>
            ) : (
              <BomTreeTable
                nodes={bomTreeData}
                rootCode={data.code}
                rootName={data.name}
                expandedKeys={bomTreeExpanded}
                onExpandedChange={setBomTreeExpanded}
              />
            )}
          </div>
        )}

        {/* ── 底部审计信息 ── */}
        {data.createdAt && (
          <div className="detail-footer">
            <span>创建人：{data.createdBy}</span>
            <span>创建时间：{data.createdAt}</span>
            {data.auditedBy && (
              <>
                <span>审核人：{data.auditedBy}</span>
                <span>审核时间：{data.auditedAt}</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* ══ 子件编辑弹窗 ══ */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 4, height: 16, background: '#1677FF', borderRadius: 2 }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: '#303133' }}>
              {editingChild ? '编辑子件行' : '新增子件行'}
            </span>
          </div>
        }
        open={childModalOpen}
        onOk={handleSaveChild}
        onCancel={() => setChildModalOpen(false)}
        okText="保存" cancelText="取消"
        width={600}
        okButtonProps={{ style: { background: '#1677FF', borderColor: '#1677FF' } }}
        destroyOnClose
        styles={{ header: { borderBottom: '1px solid #ebeef5', paddingBottom: 12 } }}
      >
        <Form form={childForm} layout="vertical" size="middle" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="rowNo" label="行号" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={1} step={10} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="type" label="类型">
                <Select options={[
                  { value: '标准', label: '标准' },
                  { value: '替代', label: '替代' },
                  { value: '虚拟', label: '虚拟' },
                ]} />
              </Form.Item>
            </Col>
          </Row>

          {/* 子件联动 */}
          <Form.Item
            name="childCode"
            label={
              <span>
                <SearchOutlined style={{ marginRight: 4, color: '#1677FF' }} />
                子件编码
                <span style={{ fontSize: 11, color: '#909399', marginLeft: 8 }}>
                  （输入编码或名称搜索物料档案，选中后自动回填）
                </span>
              </span>
            }
            rules={[{ required: true, message: '请输入子件编码' }]}>
            <AutoComplete
              placeholder="输入编码/名称快速搜索..."
              filterOption={false}
              onSelect={handleSelectChild}
              options={materialOptions.map(o => ({
                value: o.value,
                label: (
                  <div style={{ fontSize: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ color: '#1677FF', fontWeight: 600, fontFamily: 'monospace' }}>
                      {o.material.code}
                    </span>
                    <span style={{ color: '#303133' }}>{o.material.name}</span>
                    {o.material.spec && (
                      <span style={{ color: '#909399', fontSize: 11 }}>{o.material.spec}</span>
                    )}
                  </div>
                ),
              }))}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="childName" label="子件名称"
                rules={[{ required: true, message: '请输入名称' }]}>
                <Input placeholder="选择物料后自动回填" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="spec" label="规格型号">
                <Input placeholder="选择物料后自动回填" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="qty" label="主数量" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={0} precision={5} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="unit" label="主单位" rules={[{ required: true }]}>
                <Select options={UNIT_OPTIONS} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="childQty" label="子件数量" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={0} precision={5} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="calcUnit" label="计算单位">
                <Select options={UNIT_OPTIONS} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="lossRate" label="损耗率%（倒扣用）">
                <InputNumber style={{ width: '100%' }} min={0} max={100} precision={2} placeholder="如 2.5" addonAfter="%" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="scrapRate" label="废品率%">
                <InputNumber style={{ width: '100%' }} min={0} max={100} precision={2} placeholder="如 1.0" addonAfter="%" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="minIssueQty" label="最小发料量">
                <InputNumber style={{ width: '100%' }} min={0} precision={3} placeholder="最小包装单位" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="issueMethod" label="领料方式">
                <Select allowClear placeholder="选择领料方式" options={[
                  { value: 'PUSH', label: '主动领料（PUSH）' },
                  { value: 'BACKFLUSH', label: '倒扣领料（BACKFLUSH）' },
                  { value: 'ON_SITE', label: '现场领料（ON_SITE）' },
                ]} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="consumeOp" label="倒扣关联工序">
                <Input placeholder="如 OP-40" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="wipWarehouse" label="目标线边仓">
                <Select allowClear placeholder="选择线边仓" options={[
                  { value: 'WIP-涂层', label: 'WIP-涂层线边仓' },
                  { value: 'WIP-磨削', label: 'WIP-磨削线边仓' },
                  { value: 'WIP-切割', label: 'WIP-切割线边仓' },
                  { value: 'WIP-包装', label: 'WIP-包装线边仓' },
                ]} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="keyMaterial" label="关键物料">
                <Select allowClear options={[
                  { value: true, label: '是（关键料）' },
                  { value: false, label: '否' },
                ]} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="substitute" label="替代料编码">
                <Input placeholder="替代料编码（可选）" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default BomDetailPage;

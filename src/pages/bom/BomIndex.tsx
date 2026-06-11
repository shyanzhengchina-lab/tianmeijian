import React, { useState, useCallback, useEffect } from 'react';
import { mockBomList, BomHeader, BomChild, BomType, BomStatus } from '../../store/bomData';
import BomListPage from './BomListPage';
import BomDetailPage from './BomDetailPage';
import { getBomList, getBomDetails } from '../../api/boms';

type PageView = 'list' | 'detail';

const BomIndex: React.FC = () => {
  const [bomList, setBomList] = useState<BomHeader[]>(mockBomList);
  const [view, setView]       = useState<PageView>('list');
  const [selected, setSelected] = useState<BomHeader | null>(null);
  const [detailMode, setDetailMode] = useState<'view' | 'edit' | 'new'>('view');

  // ── loadFromApi: 拉取后端BOM列表 + 所有子件明细 ──
  const loadFromApi = useCallback(async () => {
    try {
      const resp = await getBomList() as any;
      const apiList: any[] = resp?.data ?? [];
      if (apiList.length === 0) return;

      // 先建基础 BOM 对象（children 暂为空）
      const baseBoms: BomHeader[] = apiList.map((item: any) => ({
        id: `api-${item.id}`,
        code: item.code ?? '',
        name: item.materialName ?? item.code ?? '',
        spec: '',
        unit: item.unitName ?? '个',
        version: item.version ?? '1.00',
        bomType: (item.bomType as BomType) ?? '主BOM',
        status: (item.status === 'APPROVED' ? 'approved'
               : item.status === 'DRAFT' ? 'draft'
               : item.status === 'DISABLED' ? 'disabled'
               : 'draft') as BomStatus,
        mainQty: Number(item.quantity ?? 1),
        mainUnit: item.unitName ?? '个',
        batchQty: 1000,
        calcUnit: item.unitName ?? '个',
        effectDate: item.effectiveDate ?? '',
        createdBy: item.createBy ?? '',
        createdAt: item.createTime ?? '',
        remark: item.remark ?? '',
        children: [] as BomChild[],
      }));

      // 并行拉取每个 BOM 的子件明细
      const detailResults = await Promise.allSettled(
        apiList.map((item: any) => getBomDetails(item.id) as Promise<any>)
      );

      // 将子件合并到各 BOM
      const newBoms: BomHeader[] = baseBoms.map((bom, idx) => {
        const result = detailResults[idx];
        if (result.status !== 'fulfilled') return bom;
        const detailList: any[] = result.value?.data ?? [];
        const children: BomChild[] = detailList.map((d: any, di: number) => ({
          id:         String(d.id ?? `d-${di}`),
          rowNo:      d.lineNo ?? (di + 1) * 10,
          childCode:  d.materialCode ?? '',
          childName:  d.materialName ?? '',
          spec:       d.spec ?? '',
          freeDesc:   '',
          type:       '标准',
          qty:        Number(d.quantity ?? 1),
          unit:       d.unitName ?? '个',
          childQty:   Number(d.quantity ?? 1),
          calcUnit:   d.unitName ?? '个',
          scrapRate:  d.scrapRate ?? 0,
          issueMethod: d.issueMethod ?? undefined,
          remark:     d.remark ?? '',
        }));
        return { ...bom, children };
      });

      setBomList(newBoms);
    } catch { /* backend offline — keep mock data */ }
  }, []);

  useEffect(() => { loadFromApi(); }, [loadFromApi]);

  const handleView = (bom: BomHeader) => {
    const fresh = bomList.find(b => b.id === bom.id) || bom;
    setSelected(fresh);
    setDetailMode('view');
    setView('detail');
  };

  const handleEdit = (bom: BomHeader) => {
    const fresh = bomList.find(b => b.id === bom.id) || bom;
    setSelected(fresh);
    setDetailMode('edit');
    setView('detail');
  };

  const handleAdd = () => {
    setSelected(null);
    setDetailMode('new');
    setView('detail');
  };

  const handleBack = () => {
    setView('list');
    setSelected(null);
    loadFromApi();
  };

  const handleSave = (saved: BomHeader) => {
    setBomList(prev => {
      const idx = prev.findIndex(b => b.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [...prev, saved];
    });
    setSelected(saved);
    // 延迟刷新列表（让后端写入完成）
    setTimeout(() => loadFromApi(), 300);
  };

  const handleDelete = (id: string) => {
    setBomList(prev => prev.filter(b => b.id !== id));
  };

  const handleBomListChange = (list: BomHeader[]) => {
    setBomList(list);
  };

  if (view === 'list') {
    return (
      <BomListPage
        bomList={bomList}
        onView={handleView}
        onEdit={handleEdit}
        onAdd={handleAdd}
        onBomListChange={handleBomListChange}
      />
    );
  }

  return (
    <BomDetailPage
      bom={selected}
      mode={detailMode}
      onBack={handleBack}
      onSave={handleSave}
      onDelete={handleDelete}
    />
  );
};

export default BomIndex;

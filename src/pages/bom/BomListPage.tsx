import React, { useState, useMemo } from 'react';
import {
  Table, Button, Input, Select, Space, Popconfirm,
  message, Row, Col, Divider, Tooltip, Tag,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined, DeleteOutlined, SearchOutlined, ReloadOutlined,
  AuditOutlined, CheckCircleOutlined, CopyOutlined,
  ExclamationCircleOutlined, EyeOutlined, EditOutlined,
  RollbackOutlined, StopOutlined, SettingOutlined, PrinterOutlined,
  ExportOutlined, ImportOutlined,
} from '@ant-design/icons';
import { statusMap, BomHeader, BomStatus, normalizeStatus } from '../../store/bomData';
import './BomPage.css';

interface BomListPageProps {
  bomList: BomHeader[];
  onView: (bom: BomHeader) => void;
  onEdit: (bom: BomHeader) => void;
  onAdd: () => void;
  onBomListChange: (list: BomHeader[]) => void;
}

/* ── normalizeStatus is imported from bomData.ts ── */

/* ── Status Badge ── */
const StatusBadge = ({ status }: { status: any }) => {
  const normalized = normalizeStatus(status);
  const s = statusMap[normalized] || statusMap.draft;
  return (
    <span style={{
      display: 'inline-block',
      fontSize: 11, fontWeight: 600, padding: '1px 8px',
      borderRadius: 2, border: `1px solid ${s.border}`,
      background: s.bg, color: s.color, whiteSpace: 'nowrap',
    }}>{s.label}</span>
  );
};

const BomListPage: React.FC<BomListPageProps> = ({
  bomList, onView, onEdit, onAdd, onBomListChange,
}) => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [filterCode, setFilterCode]     = useState('');
  const [filterChild, setFilterChild]   = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [viewMode, setViewMode]         = useState<'detail' | 'header'>('detail');

  /* ── Normalize all BOM statuses so filtering/actions work with uppercase API values ── */
  const normalizedBomList = useMemo(() =>
    bomList.map(b => ({ ...b, status: normalizeStatus(b.status) })),
  [bomList]);

  /* ── Filter ── */
  const filtered = useMemo(() => normalizedBomList.filter(b => {
    const codeOk   = !filterCode   || b.code.toLowerCase().includes(filterCode.toLowerCase())   || b.name.includes(filterCode);
    const childOk  = !filterChild  || b.children.some(c => c.childCode.includes(filterChild) || c.childName.includes(filterChild));
    const statusOk = !filterStatus || b.status === filterStatus;
    return codeOk && childOk && statusOk;
  }), [normalizedBomList, filterCode, filterChild, filterStatus]);

  /* ── Flatten for 头+明细 view ── */
  const flatRows = useMemo(() => {
    if (viewMode === 'header') {
      return filtered.map(b => ({
        ...b, _childCode: '', _childName: '', _qty: '', _unit: '',
        _childQty: undefined, _calcUnit: '', _rowNo: '', _isChild: false, _childIdx: 0,
      }));
    }
    const rows: any[] = [];
    filtered.forEach(b => {
      if (b.children.length === 0) {
        rows.push({
          ...b, _childCode: '', _childName: '', _qty: '', _unit: '',
          _childQty: undefined, _calcUnit: '', _rowNo: '', _isChild: false, _childIdx: 0,
        });
      } else {
        b.children.forEach((c, ci) => {
          rows.push({
            ...b,
            _rowKey: `${b.id}-${c.id}`,
            _childCode: c.childCode,
            _childName: c.childName,
            _spec:      c.spec,
            _qty:       c.qty,
            _unit:      c.unit,
            _childQty:  c.childQty,
            _calcUnit:  c.calcUnit,
            _rowNo:     c.rowNo,
            _isChild:   true,
            _childIdx:  ci,
            _spanRows:  b.children.length,
          });
        });
      }
    });
    return rows;
  }, [filtered, viewMode]);

  /* ── Helpers ── */
  const getSelectedBoms = () => normalizedBomList.filter(b => selectedRowKeys.includes(b.id));

  const updateBoms = (ids: React.Key[], updater: (b: BomHeader) => BomHeader) => {
    onBomListChange(normalizedBomList.map(b => ids.includes(b.id) ? updater(b) : b));
    setSelectedRowKeys([]);
  };

  /* ── Bulk toolbar Actions ── */
  const handleDelete = (ids: React.Key[]) => {
    onBomListChange(bomList.filter(b => !ids.includes(b.id)));
    setSelectedRowKeys([]);
    message.success(`已删除 ${ids.length} 条BOM`);
  };

  const handleAudit = (ids: React.Key[]) => {
    const invalid = getSelectedBoms().filter(b => b.status !== 'draft');
    if (invalid.length > 0) { message.warning('只有草稿状态的BOM可以审核'); return; }
    updateBoms(ids, b => ({
      ...b, status: 'audited' as BomStatus,
      auditedBy: '当前用户', auditedAt: new Date().toLocaleString('zh-CN'),
    }));
    message.success('审核成功');
  };

  const handleUnaudit = (ids: React.Key[]) => {
    const invalid = getSelectedBoms().filter(b => b.status !== 'audited' && b.status !== 'approved');
    if (invalid.length > 0) { message.warning('只有已审核/已批准的BOM可以反审核'); return; }
    updateBoms(ids, b => ({ ...b, status: 'draft' as BomStatus, auditedBy: '', auditedAt: '' }));
    message.warning('已反审核，BOM退回草稿状态');
  };

  const handleApprove = (ids: React.Key[]) => {
    const invalid = getSelectedBoms().filter(b => b.status !== 'audited' && b.status !== 'draft');
    if (invalid.length > 0) { message.warning('只有草稿或已审核状态的BOM可以批准'); return; }
    updateBoms(ids, b => ({
      ...b, status: 'approved' as BomStatus,
      auditedBy: '当前用户', auditedAt: new Date().toLocaleString('zh-CN'),
    }));
    message.success('批准成功');
  };

  /* ── Per-row single actions ── */
  const handleRowAudit = (bom: BomHeader) => {
    onBomListChange(normalizedBomList.map(b => b.id === bom.id
      ? { ...b, status: 'audited' as BomStatus, auditedBy: '当前用户', auditedAt: new Date().toLocaleString('zh-CN') }
      : b));
    message.success(`BOM ${bom.code} 审核成功`);
  };

  const handleRowApprove = (bom: BomHeader) => {
    onBomListChange(normalizedBomList.map(b => b.id === bom.id
      ? { ...b, status: 'approved' as BomStatus, auditedBy: '当前用户', auditedAt: new Date().toLocaleString('zh-CN') }
      : b));
    message.success(`BOM ${bom.code} 批准成功`);
  };

  const handleRowUnaudit = (bom: BomHeader) => {
    onBomListChange(normalizedBomList.map(b => b.id === bom.id
      ? { ...b, status: 'draft' as BomStatus, auditedBy: '', auditedAt: '' }
      : b));
    message.warning(`BOM ${bom.code} 已退回草稿`);
  };

  const handleDisable = (ids: React.Key[]) => {
    updateBoms(ids, b => ({ ...b, status: 'disabled' as BomStatus }));
    message.success('已禁用');
  };

  const handleEnable = (ids: React.Key[]) => {
    updateBoms(ids, b => ({ ...b, status: 'draft' as BomStatus }));
    message.success('已启用，BOM退回草稿状态');
  };

  const handleReset = () => { setFilterCode(''); setFilterChild(''); setFilterStatus(''); };

  const hasSelected   = selectedRowKeys.length > 0;
  const selectedBoms  = getSelectedBoms();
  const canAudit   = hasSelected && selectedBoms.every(b => b.status === 'draft');
  const canUnaudit = hasSelected && selectedBoms.every(b => b.status === 'audited' || b.status === 'approved');
  const canApprove = hasSelected && selectedBoms.every(b => b.status === 'audited' || b.status === 'draft');
  const canDisable = hasSelected && selectedBoms.every(b => b.status !== 'disabled');
  const canEnable  = hasSelected && selectedBoms.every(b => b.status === 'disabled');

  /* ── Columns ── */
  const columns: ColumnsType<any> = [
    {
      title: '序号', width: 48, align: 'center', fixed: 'left',
      render: (_: any, __: any, i: number) => (
        <span style={{ color: '#909399', fontSize: 11 }}>{i + 1}</span>
      ),
    },
    {
      title: '行号', dataIndex: '_rowNo', width: 55, align: 'center',
      render: (_: any, r: any) => r._isChild
        ? <span style={{ color: '#606266', fontSize: 12 }}>{r._rowNo}</span>
        : null,
    },
    {
      title: '母件编码', dataIndex: 'code', width: 148,
      render: (v: string, r: any) => (
        !r._isChild || r._childIdx === 0
          ? <span className="link-cell" onClick={() => onView(r)}>{v}</span>
          : null
      ),
    },
    {
      title: '物料名称', dataIndex: 'name', width: 180, ellipsis: true,
      render: (v: string, r: any) => (
        !r._isChild || r._childIdx === 0
          ? <span style={{ fontSize: 12, color: '#303133' }}>{v}</span>
          : null
      ),
    },
    {
      title: '规格型号', dataIndex: 'spec', width: 110, ellipsis: true,
      render: (v: string, r: any) => (
        !r._isChild || r._childIdx === 0
          ? <span style={{ fontSize: 12, color: '#606266' }}>{v || '—'}</span>
          : null
      ),
    },
    {
      title: '版本号', dataIndex: 'version', width: 72, align: 'center',
      render: (v: string, r: any) => (
        !r._isChild || r._childIdx === 0
          ? <span style={{ fontSize: 12 }}>{v}</span>
          : null
      ),
    },
    {
      title: 'BOM类型', dataIndex: 'bomType', width: 88,
      render: (v: string, r: any) => (
        !r._isChild || r._childIdx === 0
          ? <span style={{ fontSize: 12, color: '#606266' }}>{v}</span>
          : null
      ),
    },
    {
      title: '状态', dataIndex: 'status', width: 85,
      render: (v: any, r: any) => (
        !r._isChild || r._childIdx === 0
          ? <StatusBadge status={v} />
          : null
      ),
    },
    {
      title: '子件编码', dataIndex: '_childCode', width: 138,
      render: (v: string) => v ? <span className="link-cell">{v}</span> : null,
    },
    {
      title: '子件名称', dataIndex: '_childName', width: 170, ellipsis: true,
      render: (v: string) => v ? <span style={{ fontSize: 12, color: '#1677FF' }}>{v}</span> : null,
    },
    {
      title: '规格', dataIndex: '_spec', width: 90, ellipsis: true,
      render: (v: string) => v ? <span style={{ fontSize: 12, color: '#606266' }}>{v}</span> : null,
    },
    {
      title: '主数量', dataIndex: '_qty', width: 82, align: 'right',
      render: (v: any) => v !== '' && v !== undefined
        ? <span style={{ fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>{Number(v).toFixed(2)}</span>
        : null,
    },
    {
      title: '主单位', dataIndex: '_unit', width: 72,
      render: (v: string) => v ? <span style={{ fontSize: 12 }}>{v}</span> : null,
    },
    {
      title: '子件数量', dataIndex: '_childQty', width: 82, align: 'right',
      render: (v: any) => v !== undefined && v !== null
        ? <span style={{ fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>{Number(v).toFixed(2)}</span>
        : null,
    },
    {
      title: '计算单位', dataIndex: '_calcUnit', width: 72,
      render: (v: string) => v ? <span style={{ fontSize: 12 }}>{v}</span> : null,
    },
    {
      title: '操作', width: 220, fixed: 'right',
      render: (_: any, record: any) => (!record._isChild || record._childIdx === 0) ? (
        <Space size={0} split={<span style={{ color: '#e4e7ed', margin: '0 1px' }}>|</span>}>
          <Button type="link" size="small"
            style={{ padding: '0 4px', fontSize: 12, color: '#1677FF' }}
            icon={<EyeOutlined />}
            onClick={() => onView(record)}>查看</Button>
          <Button type="link" size="small"
            style={{ padding: '0 4px', fontSize: 12, color: record.status === 'disabled' ? '#c0c4cc' : '#606266' }}
            icon={<EditOutlined />}
            onClick={() => onEdit(record)}
            disabled={record.status === 'disabled'}>编辑</Button>
          {/* 审核 — 草稿状态显示 */}
          {normalizeStatus(record.status) === 'draft' && (
            <Button type="link" size="small"
              style={{ padding: '0 4px', fontSize: 12, color: '#52C41A' }}
              icon={<AuditOutlined />}
              onClick={() => handleRowAudit(record)}>审核</Button>
          )}
          {/* 批准 — 草稿或已审核状态显示 */}
          {(normalizeStatus(record.status) === 'draft' || normalizeStatus(record.status) === 'audited') && (
            <Button type="link" size="small"
              style={{ padding: '0 4px', fontSize: 12, color: '#1677FF' }}
              icon={<CheckCircleOutlined />}
              onClick={() => handleRowApprove(record)}>批准</Button>
          )}
          {/* 反审核 — 已审核或已批准状态显示 */}
          {(normalizeStatus(record.status) === 'audited' || normalizeStatus(record.status) === 'approved') && (
            <Button type="link" size="small"
              style={{ padding: '0 4px', fontSize: 12, color: '#FAAD14' }}
              icon={<RollbackOutlined />}
              onClick={() => handleRowUnaudit(record)}>反审核</Button>
          )}
          <Popconfirm
            title="确认删除此BOM？"
            description="删除后数据不可恢复"
            onConfirm={() => handleDelete([record.id])}
            okText="确认删除" cancelText="取消"
            okButtonProps={{ danger: true }}
            icon={<ExclamationCircleOutlined style={{ color: '#E60012' }} />}
          >
            <Button type="link" danger size="small"
              style={{ padding: '0 4px', fontSize: 12 }}>删除</Button>
          </Popconfirm>
        </Space>
      ) : null,
    },
  ];

  return (
    <div className="bom-list-page">

      {/* ── 页头：标题 + 视图切换 ── */}
      <div className="bom-page-header">
        <span className="bom-page-title">物料清单维护</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, height: '100%' }}>
          {(['header', 'detail'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              style={{
                height: '100%',
                padding: '0 14px',
                border: 'none',
                borderBottom: viewMode === mode ? '2px solid #1677FF' : '2px solid transparent',
                background: 'transparent',
                color: viewMode === mode ? '#1677FF' : '#606266',
                fontSize: 12,
                fontWeight: viewMode === mode ? 600 : 400,
                cursor: 'pointer',
                transition: 'all .2s',
              }}
            >
              {mode === 'header' ? '仅表头' : '表头+明细'}
            </button>
          ))}
        </div>
      </div>

      {/* ── 筛选栏 ── */}
      <div className="bom-filter-bar">
        <Row gutter={8} align="middle" wrap={false}>
          <Col flex="none">
            <Select
              value={filterStatus || undefined}
              size="small" style={{ width: 108 }}
              placeholder="BOM状态" allowClear
              onChange={v => setFilterStatus(v || '')}
              options={Object.entries(statusMap).map(([k, v]) => ({ value: k, label: v.label }))}
            />
          </Col>
          <Col flex="none">
            <span className="search-label">母件</span>
            <Input
              size="small" style={{ width: 160 }}
              value={filterCode}
              onChange={e => setFilterCode(e.target.value)}
              placeholder="编码 / 名称" allowClear
              prefix={<SearchOutlined style={{ color: '#c0c4cc', fontSize: 11 }} />}
            />
          </Col>
          <Col flex="none">
            <span className="search-label">子件</span>
            <Input
              size="small" style={{ width: 160 }}
              value={filterChild}
              onChange={e => setFilterChild(e.target.value)}
              placeholder="编码 / 名称" allowClear
              prefix={<SearchOutlined style={{ color: '#c0c4cc', fontSize: 11 }} />}
            />
          </Col>
          <Col flex="none">
            <Button
              type="primary" size="small"
              icon={<SearchOutlined />}
              style={{ background: '#1677FF', borderColor: '#1677FF', height: 28, borderRadius: 3 }}
            >查询</Button>
          </Col>
          <Col flex="none">
            <Button size="small" icon={<ReloadOutlined />} onClick={handleReset}
              style={{ height: 28, borderRadius: 3 }}>重置</Button>
          </Col>
          {(filterStatus || filterCode || filterChild) && (
            <Col flex="auto">
              <div className="selected-conditions">
                已选条件：
                {filterStatus && <Tag closable onClose={() => setFilterStatus('')} style={{ fontSize: 11 }}>
                  状态: {statusMap[filterStatus as BomStatus]?.label}
                </Tag>}
                {filterCode && <Tag closable onClose={() => setFilterCode('')} style={{ fontSize: 11 }}>
                  母件: {filterCode}
                </Tag>}
                {filterChild && <Tag closable onClose={() => setFilterChild('')} style={{ fontSize: 11 }}>
                  子件: {filterChild}
                </Tag>}
              </div>
            </Col>
          )}
        </Row>
      </div>

      {/* ── 工具栏 ── */}
      <div className="bom-toolbar">
        <div className="toolbar-btns">
          {/* 新增 */}
          <Button icon={<PlusOutlined />} className="btn-primary-red" onClick={onAdd}>新增</Button>

          <Divider type="vertical" style={{ height: 20, margin: '0 3px', borderColor: '#e4e7ed' }} />

          {/* 修改 */}
          <Tooltip title={!hasSelected ? '请先选择一条记录' : (selectedRowKeys.length > 1 ? '只能选择一条记录进行修改' : '')}>
            <Button size="small" className="toolbar-btn"
              icon={<EditOutlined />}
              disabled={selectedRowKeys.length !== 1 || selectedBoms[0]?.status === 'disabled'}
              onClick={() => { if (selectedBoms[0]) onEdit(selectedBoms[0]); }}>
              修改
            </Button>
          </Tooltip>

          {/* 审核 */}
          <Tooltip title={!canAudit ? (!hasSelected ? '请先选择' : '只有草稿状态的BOM可审核') : ''}>
            <Button size="small" className="toolbar-btn" icon={<AuditOutlined />}
              disabled={!canAudit}
              onClick={() => handleAudit(selectedRowKeys)}>审核</Button>
          </Tooltip>

          {/* 反审核 */}
          <Tooltip title={!canUnaudit ? (!hasSelected ? '请先选择' : '只有已审核/已批准的BOM可反审核') : ''}>
            <Button size="small" className="toolbar-btn" icon={<RollbackOutlined />}
              disabled={!canUnaudit}
              onClick={() => handleUnaudit(selectedRowKeys)}>反审核</Button>
          </Tooltip>

          {/* 批准 */}
          <Tooltip title={!canApprove ? (!hasSelected ? '请先选择' : '只有草稿或已审核状态的BOM可批准') : ''}>
            <Button size="small" className="toolbar-btn" icon={<CheckCircleOutlined />}
              disabled={!canApprove}
              onClick={() => handleApprove(selectedRowKeys)}>批准</Button>
          </Tooltip>

          <Divider type="vertical" style={{ height: 20, margin: '0 3px', borderColor: '#e4e7ed' }} />

          {/* 状态变更 */}
          <Tooltip title={!canDisable ? (!hasSelected ? '请先选择' : '已是禁用状态') : ''}>
            <Button size="small" className="toolbar-btn" icon={<StopOutlined />}
              disabled={!canDisable}
              onClick={() => handleDisable(selectedRowKeys)}>禁用</Button>
          </Tooltip>

          <Tooltip title={!canEnable ? (!hasSelected ? '请先选择' : '只有禁用状态才能启用') : ''}>
            <Button size="small" className="toolbar-btn"
              icon={<CheckCircleOutlined />}
              disabled={!canEnable}
              style={canEnable ? { color: '#67c23a !important', borderColor: '#67c23a' } : {}}
              onClick={() => handleEnable(selectedRowKeys)}>启用</Button>
          </Tooltip>

          <Divider type="vertical" style={{ height: 20, margin: '0 3px', borderColor: '#e4e7ed' }} />

          {/* 复制/提版 */}
          <Button size="small" className="toolbar-btn" icon={<CopyOutlined />}
            disabled={selectedRowKeys.length !== 1}>复制</Button>

          {/* 打印 */}
          <Button size="small" className="toolbar-btn" icon={<PrinterOutlined />}
            disabled={!hasSelected}>打印</Button>

          {/* 导出 */}
          <Button size="small" className="toolbar-btn" icon={<ExportOutlined />}>导出</Button>

          {/* 导入 */}
          <Button size="small" className="toolbar-btn" icon={<ImportOutlined />}>导入</Button>

          <Divider type="vertical" style={{ height: 20, margin: '0 3px', borderColor: '#e4e7ed' }} />

          {/* 批量删除 */}
          <Popconfirm
            title={`确认删除选中的 ${selectedRowKeys.length} 条BOM？`}
            description="删除后数据不可恢复"
            onConfirm={() => handleDelete(selectedRowKeys)}
            disabled={!hasSelected}
            okText="确认删除" cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Button size="small" danger className="toolbar-btn" icon={<DeleteOutlined />}
              disabled={!hasSelected}>删除</Button>
          </Popconfirm>
        </div>

        {/* 右侧：列设置 + 刷新 + 计数 */}
        <div className="toolbar-right">
          <Tooltip title="列设置">
            <Button type="text" size="small" icon={<SettingOutlined />}
              style={{ color: '#909399', padding: '0 6px' }} />
          </Tooltip>
          <Tooltip title="刷新">
            <Button type="text" size="small" icon={<ReloadOutlined />}
              style={{ color: '#909399', padding: '0 6px' }} />
          </Tooltip>
          <span className="record-count">共 <b>{filtered.length}</b> 条</span>
        </div>
      </div>

      {/* ── 表格 ── */}
      <div className="bom-table-wrap">
        <Table
          rowKey={r => r._rowKey || r.id}
          dataSource={flatRows}
          columns={columns}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
            getCheckboxProps: r => ({ disabled: r._isChild && r._childIdx !== 0 }),
            columnWidth: 36,
          }}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            pageSizeOptions: ['20', '50', '100'],
            showTotal: t => `共 ${t} 条`,
            showQuickJumper: true,
            size: 'small',
          }}
          scroll={{ x: 1500, y: 'calc(100vh - 340px)' }}
          size="small"
          className="bom-table"
          rowClassName={r => {
            if (r.status === 'disabled') return 'bom-row-disabled';
            return r._isChild ? 'bom-child-row' : 'bom-parent-row';
          }}
          locale={{ emptyText: '暂无数据，点击「新增」创建BOM' }}
        />
      </div>
    </div>
  );
};

export default BomListPage;

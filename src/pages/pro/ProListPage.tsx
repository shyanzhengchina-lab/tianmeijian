import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Table, Button, Input, Select, Space, Tag, Popconfirm, message,
  Row, Col, Modal, Form, Tooltip, Badge, Divider,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined, DeleteOutlined, StopOutlined, CheckCircleOutlined,
  SearchOutlined, ReloadOutlined, EditOutlined, CopyOutlined,
  ApartmentOutlined, ExclamationCircleOutlined, EyeOutlined,
  AuditOutlined, RollbackOutlined, PlayCircleOutlined,
  ClockCircleOutlined, BranchesOutlined,
} from '@ant-design/icons';
import {
  ProcessRouting, RoutingStatus, ROUTING_STATUS_MAP,
  calcTotalTime, countAllSteps, canAudit, canUnaudit, canActivate,
  canDisable, canEnable, canObsolete, canEdit, canDelete,
} from './proData';
import {
  ProcessRoutingRecord,
  getProcessRoutingList,
  createProcessRouting,
  updateProcessRouting,
  deleteProcessRouting,
  batchDeleteProcessRoutings,
  getRoutingStepList,
} from '../../api/processRoutings';
import { getMaterialList } from '../../api/materials';
import './ProPage.css';

interface ProListPageProps {
  onViewDetail: (routing: ProcessRouting) => void;
}

// ── 将后端 ProcessRoutingRecord 映射为前端 ProcessRouting ──────────────
function mapApiToRouting(r: ProcessRoutingRecord): ProcessRouting {
  return {
    id:           String(r.id ?? ''),
    routingCode:  r.routingCode  ?? '',
    routingName:  r.routingName  ?? '',
    productCode:  r.productCode  ?? '',
    productName:  r.productName  ?? '',
    productModel: r.productModel ?? '',
    version:      r.version      ?? 'V1.0',
    isDefault:    (r.isDefault ?? 0) === 1,
    status:       (r.status ?? 'DRAFT') as RoutingStatus,
    remark:       r.description  ?? '',
    createdBy:    r.createBy     ?? '',
    createdAt:    r.createTime   ? r.createTime.slice(0, 10) : '',
    updatedAt:    r.updateTime   ? r.updateTime.slice(0, 10) : '',
    groups:       [],  // 步骤在详情页按需加载
  };
}

// ── 将后端 RoutingStep 列表转为 groups（每步一个 serialGroup）─────────
function buildGroupsFromSteps(steps: any[]): ProcessRouting['groups'] {
  if (!steps || steps.length === 0) return [];
  const sorted = [...steps].sort((a, b) => (a.stepNo ?? 0) - (b.stepNo ?? 0));
  return sorted.map((s, idx) => ({
    id: `G${s.id}`,
    seq: (idx + 1) * 10,
    steps: [{
      id:            `S${s.id}`,
      opId:          `op-${s.id}`,
      opCode:        s.stepCode  ?? `STEP-${s.stepNo ?? idx + 1}`,
      opName:        s.stepName  ?? '',
      opShort:       s.stepName  ?? '',
      workCenter:    '',
      stdTimeMin:    0,
      isKeyOp:       s.stepType === 'KEY',
      isQcPoint:     s.stepType === 'QC',
      isReportPoint: (s.reportPoint ?? 0) === 1,
      phaseCount:    0,
      remark:        s.description ?? '',
    }],
  }));
}

const ProListPage: React.FC<ProListPageProps> = ({ onViewDetail }) => {
  const [routings, setRoutings]             = useState<ProcessRouting[]>([]);
  const [apiLoading, setApiLoading]         = useState(false);
  const [searchCode, setSearchCode]         = useState('');
  const [searchName, setSearchName]         = useState('');
  const [filterStatus, setFilterStatus]     = useState<string | undefined>();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  // 产品物料下拉（用于新建路径时选择关联产品）
  const [materials, setMaterials]           = useState<{ code: string; name: string; spec: string }[]>([]);

  // 新建/编辑弹窗
  const [modalOpen, setModalOpen]           = useState(false);
  const [editingRouting, setEditingRouting] = useState<ProcessRouting | null>(null);
  const [form]                              = Form.useForm();
  const [saving, setSaving]                 = useState(false);

  // 审核弹窗
  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [auditTarget, setAuditTarget]       = useState<ProcessRouting | null>(null);
  const [auditForm]                         = Form.useForm();

  // 停用弹窗
  const [disableModalOpen, setDisableModalOpen] = useState(false);
  const [disableTarget, setDisableTarget]       = useState<ProcessRouting | null>(null);
  const [disableForm]                           = Form.useForm();

  // ── 从 API 加载列表 ─────────────────────────────────────────────────
  const loadFromApi = useCallback(async () => {
    setApiLoading(true);
    try {
      const resp = await getProcessRoutingList() as any;
      const records: ProcessRoutingRecord[] = resp?.data ?? resp ?? [];
      if (Array.isArray(records) && records.length > 0) {
        setRoutings(records.map(mapApiToRouting));
      }
    } catch {
      // graceful fallback: keep existing state (may be from prior load)
    } finally {
      setApiLoading(false);
    }
  }, []);

  // 加载物料列表（用于新建时选择产品）
  const loadMaterials = useCallback(async () => {
    try {
      const resp = await getMaterialList() as any;
      const list = resp?.data ?? resp ?? [];
      setMaterials(Array.isArray(list) ? list.map((m: any) => ({
        code: m.materialCode ?? m.code ?? '',
        name: m.materialName ?? m.name ?? '',
        spec: m.spec ?? m.model ?? '',
      })) : []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    loadFromApi();
    loadMaterials();
  }, [loadFromApi, loadMaterials]);

  // ── 过滤 ────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return routings.filter(r => {
      const codeMatch   = !searchCode   || r.routingCode.toLowerCase().includes(searchCode.toLowerCase());
      const nameMatch   = !searchName   || r.routingName.includes(searchName) || r.productName.includes(searchName);
      const statusMatch = !filterStatus || r.status === filterStatus;
      return codeMatch && nameMatch && statusMatch;
    });
  }, [routings, searchCode, searchName, filterStatus]);

  // ── 统计卡片 ────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total:    routings.length,
    active:   routings.filter(r => r.status === 'ACTIVE').length,
    pending:  routings.filter(r => r.status === 'PENDING').length,
    draft:    routings.filter(r => r.status === 'DRAFT').length,
    disabled: routings.filter(r => r.status === 'DISABLED').length,
  }), [routings]);

  // ── 新建 ────────────────────────────────────────────────────────────
  const handleAdd = () => {
    setEditingRouting(null);
    form.resetFields();
    form.setFieldsValue({ version: 'V1.0', status: 'DRAFT', isDefault: false });
    setModalOpen(true);
  };

  // ── 编辑 ────────────────────────────────────────────────────────────
  const handleEdit = (r: ProcessRouting) => {
    if (!canEdit(r.status)) {
      message.warning('仅草稿或已停用状态可编辑');
      return;
    }
    setEditingRouting(r);
    form.setFieldsValue({
      routingCode: r.routingCode,
      routingName: r.routingName,
      version:     r.version,
      productCode: r.productCode,
      productName: r.productName,
      productModel: r.productModel,
      workshop:    r.workshop,
      productLine: r.productLine,
      isDefault:   r.isDefault,
      applicableSpec: r.applicableSpec,
      remark:      r.remark,
    });
    setModalOpen(true);
  };

  // ── 复制（本地，新建草稿到后端）────────────────────────────────────
  const handleCopy = async (r: ProcessRouting) => {
    try {
      const payload: ProcessRoutingRecord = {
        routingCode:  r.routingCode + '-COPY',
        routingName:  r.routingName + '（复制）',
        productCode:  r.productCode,
        productName:  r.productName,
        productModel: r.productModel,
        version:      'V1.0',
        isDefault:    0,
        status:       'DRAFT',
        description:  r.remark,
        createBy:     'admin',
      };
      await createProcessRouting(payload);
      message.success('复制成功，新路径状态为草稿，请进入详情配置工序步骤');
      await loadFromApi();
    } catch {
      message.error('复制失败');
    }
  };

  // ── 删除 ────────────────────────────────────────────────────────────
  const handleDelete = async (ids: React.Key[]) => {
    const notDraft = routings.filter(r => ids.includes(r.id) && !canDelete(r.status));
    if (notDraft.length > 0) {
      message.error(`${notDraft.map(r => r.routingCode).join(', ')} 不是草稿状态，不可删除`);
      return;
    }
    try {
      const numIds = ids.map(id => Number(id)).filter(id => !isNaN(id) && id > 0);
      if (numIds.length > 0) {
        if (numIds.length === 1) {
          await deleteProcessRouting(numIds[0]);
        } else {
          await batchDeleteProcessRoutings(numIds);
        }
      }
      message.success(`已删除 ${ids.length} 条工艺路径`);
      setSelectedRowKeys([]);
      await loadFromApi();
    } catch {
      message.error('删除失败');
    }
  };

  // ── 保存新建/编辑 ────────────────────────────────────────────────────
  const handleSave = () => {
    form.validateFields().then(async values => {
      setSaving(true);
      try {
        const payload: ProcessRoutingRecord = {
          routingCode:  values.routingCode,
          routingName:  values.routingName,
          version:      values.version,
          productCode:  values.productCode,
          productName:  values.productName  ?? '',
          productModel: values.productModel ?? 'DEFAULT',
          status:       'DRAFT',
          isDefault:    values.isDefault ? 1 : 0,
          description:  values.remark ?? '',
          createBy:     'admin',
        };
        if (editingRouting) {
          await updateProcessRouting(Number(editingRouting.id), payload);
          message.success('修改成功');
        } else {
          await createProcessRouting(payload);
          message.success('新建成功，请进入详情配置工序步骤');
        }
        setModalOpen(false);
        await loadFromApi();
      } catch {
        message.error(editingRouting ? '修改失败' : '新建失败');
      } finally {
        setSaving(false);
      }
    }).catch((err: any) => { if (err?.errorFields) return; });
  };

  // ── 状态流转（提交审核 / 审核通过驳回 / 反审核 / 停用 / 启用 / 废止）全部调用后端 updateProcessRouting
  const patchStatus = async (r: ProcessRouting, patch: Partial<ProcessRoutingRecord>) => {
    try {
      await updateProcessRouting(Number(r.id), patch);
      await loadFromApi();
    } catch {
      message.error('操作失败');
    }
  };

  // ── 提交审核 ─────────────────────────────────────────────────────────
  const handleSubmitAudit = async (r: ProcessRouting) => {
    if (r.groups.length === 0) {
      // 从后端检查是否有步骤
      try {
        const resp = await getRoutingStepList({ routingId: Number(r.id) }) as any;
        const steps = resp?.data ?? resp ?? [];
        if (!Array.isArray(steps) || steps.length === 0) {
          message.error('工艺路径中没有配置工序，无法提交审核');
          return;
        }
      } catch { /* network error, allow submit */ }
    }
    await patchStatus(r, { status: 'PENDING' });
    message.success('已提交审核，等待质量工程师审核');
  };

  // ── 审核通过（生效） ─────────────────────────────────────────────────
  const openAuditModal = (r: ProcessRouting) => {
    setAuditTarget(r);
    auditForm.resetFields();
    setAuditModalOpen(true);
  };

  const handleAuditPass = () => {
    auditForm.validateFields().then(async values => {
      const now = new Date().toISOString().slice(0, 10);
      await patchStatus(auditTarget!, {
        status:      'ACTIVE',
        description: auditTarget!.remark,
        createBy:    values.auditBy,
      });
      setAuditModalOpen(false);
      message.success('审核通过，工艺路径已生效');
    }).catch((err: any) => { if (err?.errorFields) return; });
  };

  const handleAuditReject = () => {
    auditForm.validateFields(['auditBy', 'auditRemark']).then(async values => {
      await patchStatus(auditTarget!, {
        status:      'DRAFT',
        description: `[驳回] ${values.auditRemark || ''}`,
        createBy:    values.auditBy,
      });
      setAuditModalOpen(false);
      message.warning('审核驳回，路径退回草稿状态');
    });
  };

  // ── 反审核 ───────────────────────────────────────────────────────────
  const handleUnaudit = async (r: ProcessRouting) => {
    await patchStatus(r, { status: 'DRAFT' });
    message.info('已反审核，路径退回草稿状态');
  };

  // ── 停用 ────────────────────────────────────────────────────────────
  const openDisableModal = (r: ProcessRouting) => {
    setDisableTarget(r);
    disableForm.resetFields();
    setDisableModalOpen(true);
  };

  const handleDisable = () => {
    disableForm.validateFields().then(async values => {
      await patchStatus(disableTarget!, {
        status:      'DISABLED',
        description: values.reason,
      });
      setDisableModalOpen(false);
      message.success('已停用');
    }).catch((err: any) => { if (err?.errorFields) return; });
  };

  // ── 启用 ────────────────────────────────────────────────────────────
  const handleEnable = async (r: ProcessRouting) => {
    await patchStatus(r, { status: 'ACTIVE' });
    message.success('已启用，路径恢复生效状态');
  };

  // ── 废止 ────────────────────────────────────────────────────────────
  const handleObsolete = async (r: ProcessRouting) => {
    await patchStatus(r, { status: 'OBSOLETE' });
    message.warning('已废止，该版本路径不可再使用');
  };

  // ── 查看详情（先加载步骤，再打开详情页）────────────────────────────
  const handleViewDetail = async (r: ProcessRouting) => {
    try {
      const resp = await getRoutingStepList({ routingId: Number(r.id) }) as any;
      const steps = resp?.data ?? resp ?? [];
      const groups = buildGroupsFromSteps(Array.isArray(steps) ? steps : []);
      onViewDetail({ ...r, groups });
    } catch {
      onViewDetail(r); // fallback: open without steps
    }
  };

  const hasSelected = selectedRowKeys.length > 0;

  // ── 表格列 ──────────────────────────────────────────────────────────
  const columns: ColumnsType<ProcessRouting> = [
    {
      title: '序号', width: 50, align: 'center' as const,
      render: (_: any, __: any, i: number) => <span style={{ color: '#bbb', fontSize: 12 }}>{i + 1}</span>,
    },
    {
      title: '工艺路径编码', dataIndex: 'routingCode', width: 180,
      render: (v: string, r: ProcessRouting) => (
        <span className="code-link" onClick={() => handleViewDetail(r)}>
          <BranchesOutlined style={{ marginRight: 4, fontSize: 12 }} />{v}
        </span>
      ),
    },
    {
      title: '工艺路径名称', dataIndex: 'routingName', width: 200,
      render: (v: string, r: ProcessRouting) => (
        <div>
          <div style={{ fontWeight: 500, fontSize: 13, color: '#1a1a2e' }}>{v}</div>
          <div style={{ fontSize: 11, color: '#aaa', marginTop: 1 }}>{r.productName} · {r.productModel}</div>
        </div>
      ),
    },
    {
      title: '版本', dataIndex: 'version', width: 75, align: 'center' as const,
      render: (v: string, r: ProcessRouting) => (
        <div style={{ textAlign: 'center' }}>
          <span style={{ color: '#1677FF', fontWeight: 700, fontSize: 13 }}>{v}</span>
          {r.isDefault && <div><Tag color="blue" style={{ fontSize: 10, padding: '0 3px', marginTop: 2 }}>默认</Tag></div>}
        </div>
      ),
    },
    {
      title: '状态', dataIndex: 'status', width: 100, align: 'center' as const,
      render: (v: RoutingStatus) => {
        const s = ROUTING_STATUS_MAP[v] ?? ROUTING_STATUS_MAP['DRAFT'];
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
      },
    },
    {
      title: '工序步骤', width: 90, align: 'center' as const,
      render: (_: any, r: ProcessRouting) => {
        const total    = countAllSteps(r.groups);
        const parallel = r.groups.filter(g => g.steps.length > 1).length;
        return (
          <div style={{ textAlign: 'center' }}>
            <span style={{ color: total > 0 ? '#1677FF' : '#ccc', fontWeight: 700, fontSize: 14 }}>
              {total > 0 ? total : '—'}
            </span>
            {parallel > 0 && (
              <div style={{ fontSize: 10, color: '#722ED1' }}>{parallel}组并行</div>
            )}
          </div>
        );
      },
    },
    {
      title: '总工时(分)', width: 100, align: 'center' as const,
      render: (_: any, r: ProcessRouting) => {
        const t = calcTotalTime(r.groups);
        return t > 0
          ? <span style={{ color: '#333', fontWeight: 500 }}>{t.toFixed(1)}</span>
          : <span style={{ color: '#ccc' }}>—</span>;
      },
    },
    {
      title: '更新日期', dataIndex: 'updatedAt', width: 100,
      render: (v: string) => <span style={{ fontSize: 12, color: '#888' }}>{v || '—'}</span>,
    },
    {
      title: '操作', width: 260, fixed: 'right' as const,
      render: (_: any, r: ProcessRouting) => {
        const st = r.status;
        return (
          <Space size={0} wrap style={{ gap: '2px 0' }}>
            <Button type="link" size="small" icon={<EyeOutlined />}
              style={{ padding: '0 4px', fontSize: 12 }} onClick={() => handleViewDetail(r)}>
              查看
            </Button>

            {canEdit(st) && (
              <Button type="link" size="small" icon={<EditOutlined />}
                style={{ padding: '0 4px', fontSize: 12 }} onClick={() => handleEdit(r)}>
                编辑
              </Button>
            )}

            <Button type="link" size="small" icon={<CopyOutlined />}
              style={{ padding: '0 4px', fontSize: 12 }} onClick={() => handleCopy(r)}>
              复制
            </Button>

            <span style={{ color: '#f0f0f0', margin: '0 2px' }}>|</span>

            {st === 'DRAFT' && (
              <Tooltip title="提交给质量工程师审核">
                <Button type="link" size="small" icon={<AuditOutlined />}
                  style={{ padding: '0 4px', fontSize: 12, color: '#FA8C16' }}
                  onClick={() => handleSubmitAudit(r)}>
                  提交审核
                </Button>
              </Tooltip>
            )}

            {st === 'PENDING' && (
              <Tooltip title="审核此工艺路径">
                <Button type="link" size="small" icon={<AuditOutlined />}
                  style={{ padding: '0 4px', fontSize: 12, color: '#52C41A' }}
                  onClick={() => openAuditModal(r)}>
                  审核
                </Button>
              </Tooltip>
            )}

            {canUnaudit(st) && (
              <Tooltip title="撤回审核，退回草稿">
                <Button type="link" size="small" icon={<RollbackOutlined />}
                  style={{ padding: '0 4px', fontSize: 12, color: '#888' }}
                  onClick={() => handleUnaudit(r)}>
                  反审核
                </Button>
              </Tooltip>
            )}

            {canDisable(st) && (
              <Tooltip title="停用此工艺路径">
                <Button type="link" danger size="small" icon={<StopOutlined />}
                  style={{ padding: '0 4px', fontSize: 12 }}
                  onClick={() => openDisableModal(r)}>
                  停用
                </Button>
              </Tooltip>
            )}

            {canEnable(st) && (
              <Tooltip title="重新启用此工艺路径">
                <Button type="link" size="small" icon={<PlayCircleOutlined />}
                  style={{ padding: '0 4px', fontSize: 12, color: '#52C41A' }}
                  onClick={() => handleEnable(r)}>
                  启用
                </Button>
              </Tooltip>
            )}

            {canObsolete(st) && (
              <Popconfirm
                title="确认废止此工艺路径？"
                description="废止后不可恢复，不可再被生产订单引用"
                icon={<ExclamationCircleOutlined style={{ color: '#FF4D4F' }} />}
                okText="确认废止" cancelText="取消" okButtonProps={{ danger: true }}
                onConfirm={() => handleObsolete(r)}>
                <Button type="link" size="small"
                  style={{ padding: '0 4px', fontSize: 12, color: '#aaa' }}>
                  废止
                </Button>
              </Popconfirm>
            )}

            {canDelete(st) && (
              <Popconfirm
                title="确认删除此工艺路径？"
                icon={<ExclamationCircleOutlined style={{ color: '#E60012' }} />}
                okText="确认" cancelText="取消"
                onConfirm={() => handleDelete([r.id])}>
                <Button type="link" danger size="small" icon={<DeleteOutlined />}
                  style={{ padding: '0 4px', fontSize: 12 }}>
                  删除
                </Button>
              </Popconfirm>
            )}
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
          <span className="stat-label">全部路径</span>
        </div>
        <div className="pro-stat-divider" />
        <div
          className={`pro-stat-item pro-stat-clickable${filterStatus === 'ACTIVE' ? ' pro-stat-active pro-stat-active--active' : ''}`}
          onClick={() => setFilterStatus(prev => prev === 'ACTIVE' ? undefined : 'ACTIVE')}
        >
          <span className="stat-num" style={{ color: '#52C41A' }}>{stats.active}</span>
          <span className="stat-label">已生效</span>
        </div>
        <div className="pro-stat-divider" />
        <div
          className={`pro-stat-item pro-stat-clickable${filterStatus === 'PENDING' ? ' pro-stat-active pro-stat-active--pending' : ''}`}
          onClick={() => setFilterStatus(prev => prev === 'PENDING' ? undefined : 'PENDING')}
        >
          <span className="stat-num" style={{ color: '#FA8C16' }}>{stats.pending}</span>
          <span className="stat-label">待审核</span>
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
          className={`pro-stat-item pro-stat-clickable${filterStatus === 'DISABLED' ? ' pro-stat-active pro-stat-active--disabled' : ''}`}
          onClick={() => setFilterStatus(prev => prev === 'DISABLED' ? undefined : 'DISABLED')}
        >
          <span className="stat-num" style={{ color: '#FF4D4F' }}>{stats.disabled}</span>
          <span className="stat-label">已停用</span>
        </div>
        <div style={{ flex: 1 }} />
        <div className="pro-stat-flow">
          <span className="flow-step draft">草稿</span>
          <span className="flow-arrow">→</span>
          <span className="flow-step pending">待审核</span>
          <span className="flow-arrow">→</span>
          <span className="flow-step active">已生效</span>
          <span className="flow-arrow">↔</span>
          <span className="flow-step disabled">已停用</span>
        </div>
      </div>

      {/* ── 搜索栏 ── */}
      <div className="pro-search-bar">
        <Row gutter={8} align="middle" style={{ width: '100%' }}>
          <Col>
            <span className="search-label">编码</span>
            <Input size="small" style={{ width: 160 }} placeholder="工艺路径编码"
              value={searchCode} onChange={e => setSearchCode(e.target.value)} allowClear />
          </Col>
          <Col>
            <span className="search-label">名称/产品</span>
            <Input size="small" style={{ width: 160 }} placeholder="路径名称或产品名"
              value={searchName} onChange={e => setSearchName(e.target.value)} allowClear />
          </Col>
          <Col>
            <span className="search-label">状态</span>
            <Select size="small" style={{ width: 110 }} placeholder="全部" allowClear
              value={filterStatus} onChange={setFilterStatus}
              options={Object.entries(ROUTING_STATUS_MAP).map(([k, v]) => ({ value: k, label: v.label }))} />
          </Col>
          <Col>
            <Button type="primary" size="small" icon={<SearchOutlined />}
              style={{ background: '#C8000A', borderColor: '#C8000A' }}>查询</Button>
          </Col>
          <Col>
            <Button size="small" icon={<ReloadOutlined />} loading={apiLoading}
              onClick={() => { setSearchCode(''); setSearchName(''); setFilterStatus(undefined); loadFromApi(); }}>
              刷新
            </Button>
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
          loading={apiLoading}
          rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
          pagination={{ pageSize: 20, showTotal: (t) => `共${t}条`, showSizeChanger: true, size: 'small' }}
          scroll={{ x: 1300 }}
          size="small"
          rowClassName={(r) => r.status === 'DISABLED' ? 'row-disabled' : r.status === 'OBSOLETE' ? 'row-obsolete' : ''}
        />
      </div>

      {/* ══ 新建 / 编辑 弹窗 ══ */}
      <Modal
        title={
          <span>
            <span style={{ display: 'inline-block', width: 4, height: 16, background: '#C8000A', borderRadius: 2, marginRight: 8, verticalAlign: 'middle' }} />
            {editingRouting ? '编辑工艺路径基本信息' : '新建工艺路径'}
          </span>
        }
        open={modalOpen} onOk={handleSave} onCancel={() => setModalOpen(false)}
        okText="保存" cancelText="取消" width={640}
        okButtonProps={{ style: { background: '#C8000A', borderColor: '#C8000A' }, loading: saving }}
        destroyOnClose
      >
        <Form form={form} layout="vertical" size="middle" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="routingCode" label="工艺路径编码"
                rules={[{ required: true, message: '请输入编码' }]}>
                <Input placeholder="如：RT-RKQ-STD-001" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="version" label="版本号"
                rules={[{ required: true, message: '请输入版本号' }]}>
                <Input placeholder="如：V1.0" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="routingName" label="工艺路径名称"
                rules={[{ required: true, message: '请输入名称' }]}>
                <Input placeholder="如：机用根管锉标准工艺路径" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="productCode" label="关联产品（物料档案-成品）"
                rules={[{ required: true, message: '请选择关联产品' }]}>
                <Select
                  showSearch placeholder="搜索或选择成品物料" optionFilterProp="label"
                  filterOption={(input, opt) => ((opt?.label as string) ?? '').toLowerCase().includes(input.toLowerCase())}
                  onChange={(val: string) => {
                    const mat = materials.find(m => m.code === val);
                    if (mat) form.setFieldsValue({ productName: mat.name, productModel: mat.spec });
                  }}
                  options={materials.length > 0
                    ? materials.map(m => ({ value: m.code, label: `${m.code}  ${m.name}  ${m.spec}` }))
                    : [{ value: form.getFieldValue('productCode'), label: form.getFieldValue('productCode') }]}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="productName" label="产品名称">
                <Input readOnly style={{ background: '#fafafa', color: '#555' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="productModel" label="产品型号/规格">
                <Input placeholder="如：#25/04锥/25mm" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="isDefault" label="是否默认版本">
                <Select options={[{ value: true, label: '是（默认版本）' }, { value: false, label: '否' }]} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="applicableSpec" label="适用规格范围">
                <Input placeholder="如：#15~#40 / 04锥~06锥" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="remark" label="备注">
                <Input.TextArea rows={2} placeholder="工艺路径说明、适用条件等" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* ══ 审核弹窗 ══ */}
      <Modal
        title={
          <span>
            <AuditOutlined style={{ color: '#52C41A', marginRight: 8 }} />
            审核工艺路径 — {auditTarget?.routingCode}
          </span>
        }
        open={auditModalOpen}
        onCancel={() => setAuditModalOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setAuditModalOpen(false)}>取消</Button>,
          <Button key="reject" danger onClick={handleAuditReject} icon={<RollbackOutlined />}>
            驳回（退回草稿）
          </Button>,
          <Button key="pass" type="primary" onClick={handleAuditPass} icon={<CheckCircleOutlined />}
            style={{ background: '#52C41A', borderColor: '#52C41A' }}>
            审核通过（生效）
          </Button>,
        ]}
        width={500}
        destroyOnClose
      >
        {auditTarget && (
          <div style={{ marginBottom: 16, padding: '10px 14px', background: '#f6ffed', borderRadius: 6, border: '1px solid #b7eb8f' }}>
            <div style={{ fontWeight: 600, color: '#1a1a2e' }}>{auditTarget.routingName}</div>
            <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
              {auditTarget.productName} · {auditTarget.productModel} · {auditTarget.version}
            </div>
          </div>
        )}
        <Form form={auditForm} layout="vertical">
          <Form.Item name="auditBy" label="审核人" rules={[{ required: true, message: '请输入审核人姓名' }]}>
            <Input placeholder="请输入审核人姓名" />
          </Form.Item>
          <Form.Item name="auditRemark" label="审核意见">
            <Input.TextArea rows={3} placeholder="通过原因或驳回说明（驳回时必填）" />
          </Form.Item>
        </Form>
      </Modal>

      {/* ══ 停用弹窗 ══ */}
      <Modal
        title={
          <span>
            <StopOutlined style={{ color: '#FF4D4F', marginRight: 8 }} />
            停用工艺路径 — {disableTarget?.routingCode}
          </span>
        }
        open={disableModalOpen}
        onOk={handleDisable}
        onCancel={() => setDisableModalOpen(false)}
        okText="确认停用" cancelText="取消"
        okButtonProps={{ danger: true }}
        destroyOnClose
      >
        <div style={{ marginBottom: 16, padding: '10px 14px', background: '#fff2f0', borderRadius: 6, border: '1px solid #ffccc7' }}>
          <ExclamationCircleOutlined style={{ color: '#FF4D4F', marginRight: 6 }} />
          停用后，该工艺路径不可被新的生产订单引用（已下达订单不受影响）。
        </div>
        <Form form={disableForm} layout="vertical">
          <Form.Item name="reason" label="停用原因" rules={[{ required: true, message: '请输入停用原因' }]}>
            <Input.TextArea rows={3} placeholder="请说明停用原因" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProListPage;

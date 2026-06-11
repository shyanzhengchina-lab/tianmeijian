/**
 * 班组档案页面
 * 功能：新增 / 编辑 / 删除班组；班组关联班次和成员
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getTeamList, createTeam, updateTeam, deleteTeam } from '../../api/teams';
import { getWorkCenterList } from '../../api/workCenters';
import {
  Button, Input, Select, Modal, Form, message, Tag, Popconfirm,
  Tooltip, Drawer, Divider,
} from 'antd';
import {
  PlusOutlined, SearchOutlined, ReloadOutlined,
  EditOutlined, DeleteOutlined, EyeOutlined, TeamOutlined,
  UserOutlined, ClockCircleOutlined,
} from '@ant-design/icons';
import { SHIFTS, TEAMS, Team, Shift, OPERATORS, Operator } from '../workorder/workOrderData';
import { WORK_CENTER_LIST } from '../workcenter/workCenterData';
import { WORKSHOP_LIST } from './workshopArchiveData';

const { Option } = Select;
const { TextArea } = Input;

const genId = (p: string) => `${p}${Date.now()}${Math.floor(Math.random() * 1000)}`;

interface TeamEx extends Team {
  remark?: string;
  headCount?: number;
}

const SHIFT_COLOR_MAP: Record<string, string> = {
  SH01: '#fa8c16',
  SH02: '#531dab',
  SH03: '#0958d9',
  SH04: '#389e0d',
};

// ── 班组卡片 ────────────────────────────────────────────────────────
const TeamCard: React.FC<{
  team: TeamEx;
  shift: Shift | undefined;
  members: Operator[];
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}> = ({ team, shift, members, onClick, onEdit, onDelete }) => {
  const color = shift ? (SHIFT_COLOR_MAP[shift.id] || '#1677ff') : '#1677ff';

  return (
    <div
      onClick={onClick}
      style={{
        background: '#fff',
        border: '1px solid #e8ecf0',
        borderRadius: 10,
        marginBottom: 10,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'stretch',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        transition: 'box-shadow 0.2s, border-color 0.2s',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* 左侧色条 */}
      <div style={{ width: 5, background: color, flexShrink: 0, borderRadius: '10px 0 0 10px' }} />

      <div style={{ flex: 1, padding: '12px 14px' }}>
        {/* Row1 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: '#1d2939' }}>{team.name}</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#fff', background: color, padding: '2px 8px', borderRadius: 10 }}>
            {shift?.name || '—'}
          </span>
          <Tag color="blue" style={{ fontSize: 11 }}>
            <TeamOutlined style={{ marginRight: 3 }} />
            {members.length} 人
          </Tag>
        </div>
        {/* Row2 */}
        <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#667085', flexWrap: 'wrap' }}>
          <span>
            <UserOutlined style={{ marginRight: 4, color: '#1677ff' }} />
            组长：<b style={{ color: '#1d2939' }}>{team.leader}</b>
          </span>
          <span>
            <ClockCircleOutlined style={{ marginRight: 4 }} />
            班次时间：{shift ? `${shift.startTime} ~ ${shift.endTime}` : '—'}
          </span>
          <span>🏭 {WORK_CENTER_LIST.find(wc => wc.code === team.workCenter)?.name ?? team.workCenter}</span>
        </div>
        {/* Row3 成员 */}
        <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {members.slice(0, 5).map(m => (
            <span key={m.id} style={{
              fontSize: 11, padding: '2px 8px', borderRadius: 10,
              background: m.role === '班组长' ? '#fff7e6' : '#f0f7ff',
              color: m.role === '班组长' ? '#d46b08' : '#1677ff',
              border: `1px solid ${m.role === '班组长' ? '#ffd591' : '#bae0ff'}`,
            }}>
              {m.name}
              {m.role === '班组长' && <span style={{ marginLeft: 3, fontSize: 10 }}>★</span>}
            </span>
          ))}
          {members.length > 5 && (
            <span style={{ fontSize: 11, color: '#98a2b3' }}>…+{members.length - 5}人</span>
          )}
          {members.length === 0 && <span style={{ fontSize: 11, color: '#98a2b3' }}>暂无成员</span>}
        </div>
        {team.remark && (
          <div style={{ marginTop: 6, fontSize: 11, color: '#98a2b3' }}>📝 {team.remark}</div>
        )}
      </div>

      <div
        style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 6, padding: '8px 10px', borderLeft: '1px solid #f0f2f5' }}
        onClick={e => e.stopPropagation()}
      >
        <Tooltip title="查看详情">
          <Button size="small" type="text" icon={<EyeOutlined />} onClick={onClick} />
        </Tooltip>
        <Tooltip title="编辑">
          <Button size="small" type="text" icon={<EditOutlined />} onClick={onEdit} />
        </Tooltip>
        <Tooltip title="删除">
          <Popconfirm
            title="确认删除该班组？"
            description="删除后不可恢复，关联员工不受影响"
            onConfirm={onDelete}
            okText="确认删除" cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Button size="small" type="text" icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </Tooltip>
      </div>
    </div>
  );
};

// ── 班组详情抽屉 ────────────────────────────────────────────────────
const TeamDetailDrawer: React.FC<{
  team: TeamEx | null;
  shift: Shift | undefined;
  members: Operator[];
  open: boolean;
  onClose: () => void;
}> = ({ team, shift, members, open, onClose }) => {
  if (!team) return null;
  const color = shift ? (SHIFT_COLOR_MAP[shift.id] || '#1677ff') : '#1677ff';
  const leaders = members.filter(m => m.role === '班组长');
  const workers = members.filter(m => m.role === '操作工');
  const qcs = members.filter(m => m.role === 'QC');

  return (
    <Drawer
      open={open} onClose={onClose} width={420}
      title={<span><TeamOutlined style={{ marginRight: 6, color }} />班组详情</span>}
      styles={{ header: { background: '#fff', borderBottom: '1px solid #e8ecf0' }, body: { background: '#f5f7fa', padding: 16 } }}
    >
      {/* 基本信息 */}
      <div style={{ background: '#fff', borderRadius: 8, padding: 14, marginBottom: 12, border: '1px solid #e8ecf0' }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: '#1d2939', marginBottom: 10, borderBottom: '1px solid #f0f2f5', paddingBottom: 8 }}>📋 基本信息</div>
        {[
          ['班组名称', team.name],
          ['所属班次', shift ? `${shift.name}（${shift.startTime}~${shift.endTime}）` : '—'],
          ['班组组长', team.leader],
          ['上属工作中心', WORK_CENTER_LIST.find(wc => wc.code === team.workCenter)?.name ?? team.workCenter],
          ['所属车间', WORK_CENTER_LIST.find(wc => wc.code === team.workCenter)?.workshop ?? '—'],
          ['班组人数', `${members.length} 人`],
          ['备注', team.remark || '—'],
        ].map(([l, v]) => (
          <div key={l} style={{ display: 'flex', padding: '6px 0', borderBottom: '1px solid #f5f7fa' }}>
            <span style={{ width: 110, color: '#98a2b3', fontSize: 12, flexShrink: 0 }}>{l}</span>
            <span style={{ fontSize: 12, color: '#1d2939', fontWeight: l === '班组名称' ? 600 : 400 }}>{v as string}</span>
          </div>
        ))}
      </div>

      {/* 成员列表 */}
      <div style={{ background: '#fff', borderRadius: 8, padding: 14, border: '1px solid #e8ecf0' }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: '#1d2939', marginBottom: 10, borderBottom: '1px solid #f0f2f5', paddingBottom: 8 }}>
          👥 班组成员（{members.length} 人）
        </div>

        {leaders.length > 0 && (
          <>
            <div style={{ fontSize: 11, color: '#d46b08', fontWeight: 600, marginBottom: 6 }}>★ 班组长</div>
            {leaders.map(m => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 10px', background: '#fff7e6', borderRadius: 6, marginBottom: 6, border: '1px solid #ffd591' }}>
                <span style={{ fontWeight: 600, color: '#d46b08' }}>{m.name}</span>
                <span style={{ fontSize: 11, color: '#98a2b3' }}>{m.id}</span>
              </div>
            ))}
            <Divider style={{ margin: '8px 0' }} />
          </>
        )}

        {workers.length > 0 && (
          <>
            <div style={{ fontSize: 11, color: '#1677ff', fontWeight: 600, marginBottom: 6 }}>操作工</div>
            {workers.map(m => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: '#f0f7ff', borderRadius: 6, marginBottom: 4, border: '1px solid #bae0ff' }}>
                <span style={{ color: '#1d2939' }}>{m.name}</span>
                <span style={{ fontSize: 11, color: '#98a2b3' }}>{m.id}</span>
              </div>
            ))}
          </>
        )}

        {qcs.length > 0 && (
          <>
            <Divider style={{ margin: '8px 0' }} />
            <div style={{ fontSize: 11, color: '#389e0d', fontWeight: 600, marginBottom: 6 }}>QC检验员</div>
            {qcs.map(m => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: '#f6ffed', borderRadius: 6, marginBottom: 4, border: '1px solid #b7eb8f' }}>
                <span style={{ color: '#1d2939' }}>{m.name}</span>
                <span style={{ fontSize: 11, color: '#98a2b3' }}>{m.id}</span>
              </div>
            ))}
          </>
        )}

        {members.length === 0 && (
          <div style={{ textAlign: 'center', color: '#98a2b3', padding: '16px 0', fontSize: 13 }}>暂无成员</div>
        )}
      </div>
    </Drawer>
  );
};

// ── 新建/编辑班组弹窗 ───────────────────────────────────────────────
interface WcOption {
  id: number;
  code: string;
  name: string;
  workshopId?: number;
  workshopName?: string;
}

const TeamFormModal: React.FC<{
  open: boolean;
  editData: TeamEx | null;
  allOperators: Operator[];
  wcOptions: WcOption[];        // 从 API 加载的工作中心列表
  onClose: () => void;
  onSaved: (t: TeamEx) => void;
}> = ({ open, editData, allOperators, wcOptions, onClose, onSaved }) => {
  const [form] = Form.useForm();
  const isEdit = !!editData;

  // 当前选中的工作中心 → 联动显示所属车间
  const [selectedWcId, setSelectedWcId] = useState<number | undefined>(undefined);
  const selectedWc = useMemo(() => wcOptions.find(w => w.id === selectedWcId), [wcOptions, selectedWcId]);

  React.useEffect(() => {
    if (open) {
      if (isEdit && editData) {
        form.setFieldsValue({
          name:       editData.name,
          shiftId:    editData.shiftId,
          leader:     editData.leader,
          workCenter: editData.workCenter,
          members:    editData.members,
          remark:     editData.remark,
        });
        // 编辑时：根据 workCenter code 找到对应 id 以显示所属车间
        const matched = wcOptions.find(w => w.code === editData.workCenter);
        setSelectedWcId(matched?.id);
      } else {
        form.resetFields();
        setSelectedWcId(undefined);
      }
    }
  }, [open, editData, isEdit, form, wcOptions]);

  const handleOk = () => {
    form.validateFields().then(vals => {
      const shift = SHIFTS.find(s => s.id === vals.shiftId);
      // vals.workCenterId 是 id（number），需换算回 code
      const wc = wcOptions.find(w => w.id === vals.workCenterId);
      if (isEdit && editData) {
        onSaved({
          ...editData,
          ...vals,
          workCenter:  wc?.code ?? editData.workCenter,
          workshopId:   wc?.workshopId,
          workshopName: wc?.workshopName,
        } as any);
        message.success(`班组「${vals.name}」已更新`);
      } else {
        const team: TeamEx & { workshopId?: number; workshopName?: string } = {
          id:           genId('TM'),
          name:         vals.name,
          shiftId:      vals.shiftId,
          leader:       vals.leader,
          workCenter:   wc?.code ?? '',
          workshopId:   wc?.workshopId,
          workshopName: wc?.workshopName,
          members:      vals.members || [],
          remark:       vals.remark,
        };
        onSaved(team as TeamEx);
        message.success(`班组「${vals.name}」创建成功，所属班次: ${shift?.name}`);
      }
      onClose();
      form.resetFields();
      setSelectedWcId(undefined);
    }).catch((err: any) => { if (err?.errorFields) return; });
  };

  return (
    <Modal
      open={open}
      title={isEdit ? '✏️ 编辑班组' : '➕ 新建班组'}
      onCancel={() => { onClose(); form.resetFields(); setSelectedWcId(undefined); }}
      onOk={handleOk}
      okText={isEdit ? '保存修改' : '创建班组'}
      cancelText="取消"
      width={520}
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
          <Form.Item name="name" label="班组名称" rules={[{ required: true, message: '请输入班组名称' }]}>
            <Input placeholder="如 甲班A组" />
          </Form.Item>
          <Form.Item name="shiftId" label="所属班次" rules={[{ required: true, message: '请选择班次' }]}>
            <Select placeholder="选择班次">
              {SHIFTS.map(s => (
                <Option key={s.id} value={s.id}>
                  <span style={{ color: SHIFT_COLOR_MAP[s.id], fontWeight: 600 }}>⏰ {s.name}</span>
                  <span style={{ fontSize: 11, color: '#98a2b3', marginLeft: 6 }}>{s.startTime}~{s.endTime}</span>
                </Option>
              ))}
            </Select>
          </Form.Item>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
          <Form.Item name="leader" label="班组长" rules={[{ required: true, message: '请输入班组长姓名' }]}>
            <Input placeholder="如 张三" />
          </Form.Item>
          {/* 上属工作中心 — 从 API 加载 + 联动显示所属车间 */}
          <Form.Item name="workCenterId" label="上属工作中心" rules={[{ required: true, message: '请选择上属工作中心' }]}>
            <Select
              placeholder="请选择工作中心"
              showSearch
              allowClear
              filterOption={(input, opt) =>
                String((opt as any)?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              onChange={(id: number) => setSelectedWcId(id)}
              options={wcOptions.map(wc => ({
                value: wc.id,
                label: wc.name,
                // 右侧显示所属车间名
                extra: wc.workshopName,
              }))}
              optionRender={(opt) => (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{opt.data.label}</span>
                  <span style={{ fontSize: 11, color: '#98a2b3', marginLeft: 8 }}>{opt.data.extra}</span>
                </div>
              )}
            />
          </Form.Item>
        </div>
        {/* 联动：选了工作中心后显示所属车间（只读） */}
        {selectedWc && (
          <div style={{
            marginTop: -8, marginBottom: 16, padding: '6px 12px',
            background: '#f0f7ff', border: '1px solid #bae0ff',
            borderRadius: 6, fontSize: 12, color: '#1677ff',
          }}>
            🏭 所属车间：<b>{selectedWc.workshopName || '—'}</b>
          </div>
        )}
        <Form.Item name="members" label="成员工号（可多选）">
          <Select
            mode="multiple"
            placeholder="选择成员（可选）"
            allowClear
            showSearch
            optionFilterProp="children"
            maxTagCount={4}
          >
            {allOperators.map(op => (
              <Option key={op.id} value={op.id}>
                {op.name}（{op.id}）- {op.role}
              </Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item name="remark" label="备注（选填）">
          <TextArea rows={2} placeholder="如：主要负责机加工车间S1~S3工艺段" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

// ── 主页面 ────────────────────────────────────────────────────────
const TeamPage: React.FC = () => {
  const [teams, setTeams] = useState<TeamEx[]>([...TEAMS]);
  const [apiLoading, setApiLoading] = useState(false);
  const [operators] = useState<Operator[]>([...OPERATORS]);
  const [searchText, setSearchText] = useState('');
  const [filterShift, setFilterShift] = useState('ALL');

  // ── 工作中心列表（从 API 加载，兼容 mock 回退）────────────────
  const [wcOptions, setWcOptions] = useState<WcOption[]>(() =>
    WORK_CENTER_LIST.map((wc, i) => ({
      id:           i + 1,
      code:         wc.code,
      name:         wc.name,
      workshopName: wc.workshop,
    }))
  );

  const loadWorkCenters = useCallback(async () => {
    try {
      const resp = await getWorkCenterList() as any;
      const list: any[] = resp?.data ?? [];
      if (list.length > 0) {
        setWcOptions(list.map((w: any) => ({
          id:           Number(w.id),
          code:         w.code ?? '',
          name:         w.name ?? '',
          workshopId:   w.workshopId,
          workshopName: w.workshopName ?? '',
        })));
      }
    } catch { /* 保留 mock 回退 */ }
  }, []);

  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<TeamEx | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<TeamEx | null>(null);

  // ── 从后端加载班组数据 ────────────────────────────────────────
  const loadFromApi = useCallback(async () => {
    setApiLoading(true);
    try {
      const resp = await getTeamList() as any;
      const apiList: any[] = resp.data ?? [];
      if (apiList.length > 0) {
        const mapped: TeamEx[] = apiList.map((item: any) => ({
          id:         item.id?.toString() ?? genId('TM'),
          name:       item.name ?? '',
          shiftId:    'SH01',           // 后端暂未存储 shiftId，默认甲班
          leader:     item.leaderName ?? '',
          workCenter: '',
          members:    [],
          remark:     item.description ?? '',
          headCount:  item.headcount ?? 0,
        }));
        setTeams(mapped);
      }
    } catch { /* 后端不可用时保留本地 mock */ } finally { setApiLoading(false); }
  }, []);

  useEffect(() => {
    loadFromApi();
    loadWorkCenters();
  }, [loadFromApi, loadWorkCenters]);

  const getShift = (shiftId: string) => SHIFTS.find(s => s.id === shiftId);
  const getMembers = (team: TeamEx) => operators.filter(op => team.members.includes(op.id));

  const filtered = teams.filter(t => {
    const mt = !searchText
      || t.name.includes(searchText)
      || t.leader.includes(searchText)
      || t.workCenter.includes(searchText);
    const ms = filterShift === 'ALL' || t.shiftId === filterShift;
    return mt && ms;
  });

  const summary = {
    total: teams.length,
    byShift: SHIFTS.map(s => ({ ...s, count: teams.filter(t => t.shiftId === s.id).length })),
    totalMembers: operators.length,
  };

  const handleSave = async (team: TeamEx & { workshopId?: number; workshopName?: string }) => {
    const isExisting = teams.some(t => t.id === team.id);
    try {
      // 生成 code：用班组名称拼音首字母 + 时间戳后4位，保证唯一
      const autoCode = `TM-${team.name.slice(0, 4).toUpperCase().replace(/\s/g, '')}-${Date.now().toString().slice(-4)}`;
      const payload: any = {
        code:        isExisting ? undefined : autoCode,   // 新增时必须传 code
        name:        team.name,
        leaderName:  team.leader,
        workshopId:  (team as any).workshopId,
        workshopName: (team as any).workshopName,
        description: team.remark,
        headcount:   team.headCount ?? 0,
        status:      1,
      };
      if (!isExisting) payload.code = autoCode;  // 确保 code 非空
      if (isExisting) {
        const numId = Number(team.id);
        if (!isNaN(numId)) await updateTeam(numId, payload);
      } else {
        const resp = await createTeam(payload) as any;
        if (resp.data?.id) team = { ...team, id: resp.data.id.toString() };
      }
    } catch { /* 降级到本地 */ }
    setTeams(prev => prev.some(t => t.id === team.id)
      ? prev.map(t => t.id === team.id ? team : t)
      : [team, ...prev]);
  };

  const handleDelete = async (team: TeamEx) => {
    try {
      const numId = Number(team.id);
      if (!isNaN(numId)) await deleteTeam(numId);
    } catch { /* 降级到本地 */ }
    setTeams(prev => prev.filter(t => t.id !== team.id));
    message.success(`班组「${team.name}」已删除`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
      {/* 页头 */}
      <div style={{ background: '#fff', padding: '12px 16px', borderBottom: '1px solid #e8ecf0', flexShrink: 0 }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: '#1d2939' }}>
          <TeamOutlined style={{ color: '#1677ff', marginRight: 8 }} />
          班组档案管理
        </span>
        <span style={{ fontSize: 12, color: '#98a2b3', marginLeft: 12 }}>管理生产班组、班次归属、成员配置</span>
      </div>

      {/* KPI */}
      <div style={{ display: 'flex', gap: 10, padding: '10px 16px', background: '#fff', borderBottom: '1px solid #e8ecf0', flexShrink: 0, flexWrap: 'wrap' }}>
        <div
          onClick={() => { setFilterShift('ALL'); setSearchText(''); }}
          style={{
            padding: '8px 18px', borderRadius: 8, border: `1px solid ${filterShift === 'ALL' && !searchText ? '#1677ff' : '#e8ecf0'}`,
            textAlign: 'center', minWidth: 80, cursor: 'pointer', transition: 'all 0.2s', userSelect: 'none',
            background: filterShift === 'ALL' && !searchText ? '#e6f4ff' : '#f8faff',
          }}
        >
          <div style={{ fontSize: 20, fontWeight: 700, color: '#1677ff' }}>{summary.total}</div>
          <div style={{ fontSize: 11, color: filterShift === 'ALL' && !searchText ? '#1677ff' : '#98a2b3', fontWeight: filterShift === 'ALL' && !searchText ? 600 : 400 }}>
            班组总数{filterShift === 'ALL' && !searchText ? '' : ''}
          </div>
        </div>
        <div style={{ padding: '8px 18px', background: '#f8faff', borderRadius: 8, border: '1px solid #e8ecf0', textAlign: 'center', minWidth: 80 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#389e0d' }}>{summary.totalMembers}</div>
          <div style={{ fontSize: 11, color: '#98a2b3' }}>成员总数</div>
        </div>
        {summary.byShift.map(s => (
          <div key={s.id}
            onClick={() => setFilterShift(filterShift === s.id ? 'ALL' : s.id)}
            style={{
              padding: '8px 16px', borderRadius: 8, textAlign: 'center', cursor: 'pointer', minWidth: 80,
              background: filterShift === s.id ? SHIFT_COLOR_MAP[s.id] : `${SHIFT_COLOR_MAP[s.id]}15`,
              border: `1px solid ${SHIFT_COLOR_MAP[s.id]}40`,
              transition: 'all 0.2s',
            }}
          >
            <div style={{ fontSize: 20, fontWeight: 700, color: filterShift === s.id ? '#fff' : SHIFT_COLOR_MAP[s.id] }}>{s.count}</div>
            <div style={{ fontSize: 11, color: filterShift === s.id ? '#fff' : '#98a2b3' }}>{s.name}</div>
          </div>
        ))}
      </div>

      {/* 工具栏 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: '#fff', borderBottom: '1px solid #e8ecf0', flexShrink: 0, flexWrap: 'wrap' }}>
        <Input
          prefix={<SearchOutlined style={{ color: '#aaa' }} />}
          placeholder="搜索班组名称 / 组长 / 工作中心..."
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          style={{ width: 280 }}
          allowClear
        />
        <Select value={filterShift} onChange={setFilterShift} style={{ width: 130 }}>
          <Option value="ALL">全部班次</Option>
          {SHIFTS.map(s => (
            <Option key={s.id} value={s.id}>
              <span style={{ color: SHIFT_COLOR_MAP[s.id], fontWeight: 600 }}>⏰ {s.name}</span>
            </Option>
          ))}
        </Select>
        <div style={{ flex: 1 }} />
        <Button icon={<ReloadOutlined />} loading={apiLoading} onClick={() => { setSearchText(''); setFilterShift('ALL'); loadFromApi(); }}>刷新</Button>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingTeam(null); setFormOpen(true); }}>
          新建班组
        </Button>
      </div>

      {/* 班组列表 */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#98a2b3', padding: '60px 0', fontSize: 14 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
            暂无班组数据
          </div>
        ) : (
          filtered.map(team => (
            <TeamCard
              key={team.id}
              team={team}
              shift={getShift(team.shiftId)}
              members={getMembers(team)}
              onClick={() => { setSelectedTeam(team); setDetailOpen(true); }}
              onEdit={() => { setEditingTeam(team); setFormOpen(true); }}
              onDelete={() => handleDelete(team)}
            />
          ))
        )}
      </div>

      {/* 详情抽屉 */}
      <TeamDetailDrawer
        team={selectedTeam}
        shift={selectedTeam ? getShift(selectedTeam.shiftId) : undefined}
        members={selectedTeam ? getMembers(selectedTeam) : []}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
      />

      {/* 新建/编辑弹窗 */}
      <TeamFormModal
        open={formOpen}
        editData={editingTeam}
        allOperators={operators}
        wcOptions={wcOptions}
        onClose={() => setFormOpen(false)}
        onSaved={handleSave}
      />
    </div>
  );
};

export default TeamPage;

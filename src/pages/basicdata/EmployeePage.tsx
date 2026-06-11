/**
 * 员工档案页面
 * 功能：新增 / 编辑 / 删除员工；员工关联班组、角色、技能
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getEmployeeList } from '../../api/employees';
import {
  Button, Input, Select, Modal, Form, message, Tag, Popconfirm,
  Tooltip, Drawer, Badge,
} from 'antd';
import {
  PlusOutlined, SearchOutlined, ReloadOutlined,
  EditOutlined, DeleteOutlined, EyeOutlined, UserOutlined,
  TeamOutlined, ToolOutlined, IdcardOutlined,
} from '@ant-design/icons';
import { SHIFTS, TEAMS, OPERATORS, Operator, Team } from '../workorder/workOrderData';
import { WORKSHOP_LIST } from './workshopArchiveData';
import { WORK_CENTER_LIST } from '../workcenter/workCenterData';
import { getTeamList, TeamRecord } from '../../api/teams';

const { Option } = Select;
const { TextArea } = Input;

const genId = (p: string) => `${p}${Date.now()}${Math.floor(Math.random() * 1000)}`;

// 班组选项类型（来自 API）
interface TeamOption {
  id: string;          // 存为字符串，与 Employee.teamId 一致
  name: string;
  workshopName?: string;
  leaderName?: string;
}

type EmployeeRole = '班组长' | '操作工' | 'QC';
type EmployeeStatus = 'ACTIVE' | 'LEAVE' | 'RESIGNED';

interface Employee extends Operator {
  phone?: string;
  idCard?: string;
  entryDate?: string;
  workshopCode?: string;  // 所属车间编码（通过班组→工作中心→车间 可推导，也可直接指定）
  skills?: string[];      // 技能/资质：如 数控磨削, 热处理, PVD涂层
  certifications?: string[]; // 上岗证书
  status: EmployeeStatus;
  remark?: string;
}

const ROLE_COLOR: Record<EmployeeRole, { color: string; bg: string; border: string }> = {
  '班组长': { color: '#d46b08', bg: '#fff7e6', border: '#ffd591' },
  '操作工': { color: '#1677ff', bg: '#f0f7ff', border: '#bae0ff' },
  'QC':     { color: '#389e0d', bg: '#f6ffed', border: '#b7eb8f' },
};

const STATUS_MAP: Record<EmployeeStatus, { label: string; color: string }> = {
  ACTIVE:   { label: '在岗', color: '#52c41a' },
  LEAVE:    { label: '请假', color: '#faad14' },
  RESIGNED: { label: '离职', color: '#f5222d' },
};

const SKILL_OPTIONS = [
  '数控磨削', '螺纹滚压', '热处理', 'PVD涂层', '化学蚀刻',
  'ABS注塑', '柄部组装', '超声清洗', 'UDI赋码', 'OQC检验',
  '吸塑包装', '成品入库', '设备维护', '质量抽检', '生产看板操作',
];

const CERT_OPTIONS = [
  '机加工上岗证', '热处理操作证', '危化品操作证', '质量检验员资质',
  'GMP洁净操作', '设备维修资质', 'UDI操作授权',
];

// ── 员工卡片 ──────────────────────────────────────────────────────────
// 班组静态 mock 回退（当 API 不可用时使用）
const TEAM_MOCK_OPTIONS: TeamOption[] = TEAMS.map(t => ({
  id: t.id,
  name: t.name,
  workshopName: (() => { const wc = WORK_CENTER_LIST.find(w => w.code === t.workCenter); return wc?.workshop; })(),
  leaderName: t.leader,
}));

const EmployeeCard: React.FC<{
  emp: Employee;
  team: Team | undefined;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}> = ({ emp, team, onClick, onEdit, onDelete }) => {
  const rc = ROLE_COLOR[emp.role as EmployeeRole] || ROLE_COLOR['操作工'];
  const sc = STATUS_MAP[emp.status];

  return (
    <div
      onClick={onClick}
      style={{
        background: '#fff', border: '1px solid #e8ecf0', borderRadius: 10,
        marginBottom: 10, cursor: 'pointer', display: 'flex', alignItems: 'stretch',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)', transition: 'box-shadow 0.2s, border-color 0.2s',
        overflow: 'hidden',
      }}
    >
      {/* 左侧色条 */}
      <div style={{ width: 5, background: rc.color, flexShrink: 0, borderRadius: '10px 0 0 10px' }} />

      <div style={{ flex: 1, padding: '12px 14px' }}>
        {/* Row1 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: '#1d2939' }}>{emp.name}</span>
          <span style={{ fontSize: 12, color: '#98a2b3' }}>（{emp.id}）</span>
          <span style={{
            fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10,
            color: rc.color, background: rc.bg, border: `1px solid ${rc.border}`,
          }}>
            {emp.role === '班组长' ? '★ ' : ''}{emp.role}
          </span>
          <Badge
            status={emp.status === 'ACTIVE' ? 'success' : emp.status === 'LEAVE' ? 'warning' : 'error'}
            text={<span style={{ fontSize: 11, color: sc.color, fontWeight: 600 }}>{sc.label}</span>}
          />
        </div>
        {/* Row2 */}
        <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#667085', flexWrap: 'wrap', marginBottom: 6 }}>
          {team && (
            <span>
              <TeamOutlined style={{ marginRight: 4, color: '#1677ff' }} />
              <b style={{ color: '#1d2939' }}>{team.name}</b>
            </span>
          )}
          {emp.phone && (
            <span>📱 {emp.phone}</span>
          )}
          {emp.entryDate && (
            <span>📅 入职: {emp.entryDate}</span>
          )}
        </div>
        {/* 技能标签 */}
        {emp.skills && emp.skills.length > 0 && (
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {emp.skills.slice(0, 4).map(sk => (
              <Tag key={sk} color="geekblue" style={{ fontSize: 10 }}>
                <ToolOutlined style={{ marginRight: 2 }} />{sk}
              </Tag>
            ))}
            {emp.skills.length > 4 && (
              <Tag style={{ fontSize: 10, color: '#98a2b3' }}>+{emp.skills.length - 4}</Tag>
            )}
          </div>
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
        {emp.status !== 'RESIGNED' && (
          <Tooltip title="删除/离职">
            <Popconfirm
              title="确认删除该员工档案？"
              description="删除后不可恢复"
              onConfirm={onDelete}
              okText="确认" cancelText="取消"
              okButtonProps={{ danger: true }}
            >
              <Button size="small" type="text" icon={<DeleteOutlined />} danger />
            </Popconfirm>
          </Tooltip>
        )}
      </div>
    </div>
  );
};

// ── 员工详情抽屉 ─────────────────────────────────────────────────────
const EmployeeDetailDrawer: React.FC<{
  emp: Employee | null;
  team: Team | undefined;
  open: boolean;
  onClose: () => void;
}> = ({ emp, team, open, onClose }) => {
  if (!emp) return null;
  const rc = ROLE_COLOR[emp.role as EmployeeRole] || ROLE_COLOR['操作工'];
  const sc = STATUS_MAP[emp.status];
  const shift = team ? SHIFTS.find(s => s.id === team.shiftId) : undefined;

  return (
    <Drawer
      open={open} onClose={onClose} width={420}
      title={<span><UserOutlined style={{ marginRight: 6, color: rc.color }} />员工档案详情</span>}
      styles={{ header: { background: '#fff', borderBottom: '1px solid #e8ecf0' }, body: { background: '#f5f7fa', padding: 16 } }}
    >
      {/* 头像区 */}
      <div style={{ background: '#fff', borderRadius: 8, padding: 16, marginBottom: 12, border: '1px solid #e8ecf0', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%', background: rc.bg,
          border: `2px solid ${rc.border}`, display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: 22, color: rc.color, fontWeight: 700, flexShrink: 0,
        }}>
          {emp.name[0]}
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#1d2939' }}>{emp.name}</div>
          <div style={{ fontSize: 12, color: '#98a2b3' }}>{emp.id}</div>
          <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10, color: rc.color, background: rc.bg, border: `1px solid ${rc.border}` }}>
              {emp.role === '班组长' ? '★ ' : ''}{emp.role}
            </span>
            <span style={{ fontSize: 11, fontWeight: 600, color: sc.color }}>{sc.label}</span>
          </div>
        </div>
      </div>

      {/* 基本信息 */}
      <div style={{ background: '#fff', borderRadius: 8, padding: 14, marginBottom: 12, border: '1px solid #e8ecf0' }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: '#1d2939', marginBottom: 10, borderBottom: '1px solid #f0f2f5', paddingBottom: 8 }}>📋 基本信息</div>
        {[
          ['工号', emp.id],
          ['姓名', emp.name],
          ['角色', emp.role],
          ['所属班组', team?.name || '—'],
          ['所属班次', shift ? `${shift.name}（${shift.startTime}~${shift.endTime}）` : '—'],
          ['所属车间', (() => { const wc = WORK_CENTER_LIST.find(w => w.code === team?.workCenter); return wc ? wc.workshop : (emp.workshopCode ? WORKSHOP_LIST.find(ws => ws.workshopCode === emp.workshopCode)?.workshopName || emp.workshopCode : '—'); })()],
          ['联系电话', emp.phone || '—'],
          ['身份证号', emp.idCard ? `${emp.idCard.slice(0, 6)}****${emp.idCard.slice(-4)}` : '—'],
          ['入职日期', emp.entryDate || '—'],
          ['备注', emp.remark || '—'],
        ].map(([l, v]) => (
          <div key={l} style={{ display: 'flex', padding: '6px 0', borderBottom: '1px solid #f5f7fa' }}>
            <span style={{ width: 90, color: '#98a2b3', fontSize: 12, flexShrink: 0 }}>{l}</span>
            <span style={{ fontSize: 12, color: '#1d2939', fontWeight: l === '姓名' ? 600 : 400 }}>{v as string}</span>
          </div>
        ))}
      </div>

      {/* 技能 */}
      {emp.skills && emp.skills.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 8, padding: 14, marginBottom: 12, border: '1px solid #e8ecf0' }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#1d2939', marginBottom: 10, borderBottom: '1px solid #f0f2f5', paddingBottom: 8 }}>
            <ToolOutlined style={{ marginRight: 6, color: '#1677ff' }} />技能 & 资质（{emp.skills.length}）
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {emp.skills.map(sk => (
              <Tag key={sk} color="geekblue">{sk}</Tag>
            ))}
          </div>
        </div>
      )}

      {/* 上岗证书 */}
      {emp.certifications && emp.certifications.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 8, padding: 14, border: '1px solid #e8ecf0' }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#1d2939', marginBottom: 10, borderBottom: '1px solid #f0f2f5', paddingBottom: 8 }}>
            <IdcardOutlined style={{ marginRight: 6, color: '#389e0d' }} />上岗证书（{emp.certifications.length}）
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {emp.certifications.map(cert => (
              <Tag key={cert} color="green">{cert}</Tag>
            ))}
          </div>
        </div>
      )}
    </Drawer>
  );
};

// ── 新建/编辑员工弹窗 ─────────────────────────────────────────────────
const EmployeeFormModal: React.FC<{
  open: boolean;
  editData: Employee | null;
  teamOptions: TeamOption[];
  onClose: () => void;
  onSaved: (e: Employee) => void;
}> = ({ open, editData, teamOptions, onClose, onSaved }) => {
  const [form] = Form.useForm();
  const isEdit = !!editData;
  const [selectedTeamId, setSelectedTeamId] = useState<string | undefined>(undefined);

  React.useEffect(() => {
    if (open) {
      if (isEdit && editData) {
        setSelectedTeamId(editData.teamId ? String(editData.teamId) : undefined);
        form.setFieldsValue({
          name: editData.name,
          teamId: editData.teamId ? String(editData.teamId) : undefined,
          role: editData.role,
          status: editData.status,
          phone: editData.phone,
          idCard: editData.idCard,
          entryDate: editData.entryDate,
          skills: editData.skills,
          certifications: editData.certifications,
          remark: editData.remark,
        });
      } else {
        setSelectedTeamId(undefined);
        form.resetFields();
        form.setFieldsValue({ role: '操作工', status: 'ACTIVE' });
      }
    }
  }, [open, editData, isEdit, form]);

  const selectedTeam = useMemo(
    () => teamOptions.find(t => t.id === selectedTeamId),
    [teamOptions, selectedTeamId],
  );

  const handleOk = () => {
    form.validateFields().then(vals => {
      const emp: Employee = isEdit && editData
        ? { ...editData, ...vals }
        : {
            id: genId('OP'),
            name: vals.name,
            teamId: vals.teamId ?? '',  // string id from API
            role: vals.role,
            status: vals.status || 'ACTIVE',
            phone: vals.phone,
            idCard: vals.idCard,
            entryDate: vals.entryDate,
            skills: vals.skills || [],
            certifications: vals.certifications || [],
            remark: vals.remark,
          };
      onSaved(emp);
      message.success(isEdit ? `员工「${vals.name}」档案已更新` : `员工「${vals.name}」档案创建成功`);
      setSelectedTeamId(undefined);
      onClose();
      form.resetFields();
    }).catch((err: any) => { if (err?.errorFields) return; });
  };

  return (
    <Modal
      open={open}
      title={isEdit ? '✏️ 编辑员工档案' : '➕ 新建员工档案'}
      onCancel={() => { onClose(); form.resetFields(); }}
      onOk={handleOk}
      okText={isEdit ? '保存修改' : '创建档案'}
      cancelText="取消"
      width={580}
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
          <Form.Item name="name" label="员工姓名" rules={[{ required: true, message: '请输入姓名' }]}>
            <Input placeholder="如 张三" />
          </Form.Item>
          <Form.Item name="teamId" label="所属班组" rules={[{ required: true, message: '请选择班组' }]}>
            <Select
              placeholder="选择班组" showSearch allowClear
              filterOption={(input, opt) =>
                String((opt as any)?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              onChange={(val: string) => setSelectedTeamId(val)}
              options={teamOptions.map(t => ({
                value: t.id,
                label: t.name,
              }))}
              optionRender={option => {
                const t = teamOptions.find(x => x.id === option.value);
                if (!t) return option.label;
                return (
                  <div>
                    <b>{t.name}</b>
                    <span style={{ fontSize: 11, color: '#98a2b3', marginLeft: 6 }}>
                      {t.workshopName ? `[${t.workshopName}]` : ''}
                      {t.leaderName ? ` · 组长:${t.leaderName}` : ''}
                    </span>
                  </div>
                );
              }}
            />
          </Form.Item>
          {/* 联动信息条 */}
          {selectedTeam && (
            <div style={{
              gridColumn: '1 / -1', marginTop: -8, marginBottom: 8,
              padding: '6px 12px', background: '#f0f7ff',
              border: '1px solid #bae0ff', borderRadius: 6, fontSize: 12, color: '#1677ff',
            }}>
              👥 所属班组：<b>{selectedTeam.name}</b>
              {selectedTeam.workshopName && (
                <span style={{ marginLeft: 12 }}>🏭 所属车间：<b>{selectedTeam.workshopName}</b></span>
              )}
              {selectedTeam.leaderName && (
                <span style={{ marginLeft: 12 }}>👤 组长：<b>{selectedTeam.leaderName}</b></span>
              )}
            </div>
          )}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 16px' }}>
          <Form.Item name="role" label="岗位角色" rules={[{ required: true }]}>
            <Select>
              {(['班组长', '操作工', 'QC'] as EmployeeRole[]).map(r => (
                <Option key={r} value={r}>
                  <span style={{ color: ROLE_COLOR[r].color }}>{r === '班组长' ? '★ ' : ''}{r}</span>
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="status" label="在职状态">
            <Select>
              {Object.entries(STATUS_MAP).map(([k, v]) => (
                <Option key={k} value={k}><span style={{ color: v.color }}>● {v.label}</span></Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="entryDate" label="入职日期">
            <Input placeholder="2024-01-01" />
          </Form.Item>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
          <Form.Item name="phone" label="联系电话">
            <Input placeholder="138xxxx0000" />
          </Form.Item>
          <Form.Item name="idCard" label="身份证号">
            <Input placeholder="4401xxxx（可选）" />
          </Form.Item>
        </div>
        <Form.Item name="skills" label="技能 / 资质（可多选）">
          <Select mode="multiple" placeholder="选择员工掌握的技能" allowClear maxTagCount={4}>
            {SKILL_OPTIONS.map(sk => (
              <Option key={sk} value={sk}>{sk}</Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item name="certifications" label="上岗证书（可多选）">
          <Select mode="multiple" placeholder="选择持有的上岗证书" allowClear maxTagCount={4}>
            {CERT_OPTIONS.map(c => (
              <Option key={c} value={c}>{c}</Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item name="remark" label="备注（选填）">
          <TextArea rows={2} placeholder="如：擅长精磨锥，具有5年机加工经验" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

// ── 主页面 ────────────────────────────────────────────────────────────
const EmployeePage: React.FC = () => {
  const initEmployees: Employee[] = OPERATORS.map(op => ({
    ...op,
    status: 'ACTIVE' as EmployeeStatus,
    phone: op.role === '班组长' ? `138${Math.floor(10000000 + Math.random() * 89999999)}` : undefined,
    entryDate: '2022-03-15',
    skills: op.role === '班组长'
      ? ['数控磨削', '螺纹滚压', '热处理', 'GMP洁净操作']
      : op.teamId === 'TM01' || op.teamId === 'TM05'
        ? ['数控磨削', '螺纹滚压']
        : op.teamId === 'TM02'
          ? ['热处理', 'PVD涂层', '化学蚀刻']
          : op.teamId === 'TM03'
            ? ['ABS注塑', '柄部组装', '超声清洗']
            : ['UDI赋码', '吸塑包装', 'OQC检验'],
    certifications: op.role === '班组长' ? ['机加工上岗证', 'GMP洁净操作'] : ['机加工上岗证'],
  }));

  const [employees, setEmployees] = useState<Employee[]>(initEmployees);
  const [apiLoading, setApiLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filterTeam, setFilterTeam] = useState('ALL');
  const [filterRole, setFilterRole] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  const [teamOptions, setTeamOptions] = useState<TeamOption[]>(TEAM_MOCK_OPTIONS);

  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);

  // ── 从后端加载班组下拉数据 ────────────────────────────────────
  const loadTeams = useCallback(async () => {
    try {
      const resp = await getTeamList();
      const list: TeamRecord[] = resp.data ?? [];
      if (list.length > 0) {
        setTeamOptions(list.map(t => ({
          id: String(t.id ?? ''),
          name: t.name ?? '',
          workshopName: t.workshopName,
          leaderName: t.leaderName,
        })));
      }
    } catch { /* 保留 mock */ }
  }, []);

  // ── 从后端加载员工数据 ────────────────────────────────────────
  const loadFromApi = useCallback(async () => {
    setApiLoading(true);
    try {
      const resp = await getEmployeeList() as any;
      const apiList: any[] = resp.data ?? [];
      if (apiList.length > 0) {
        const mapped: Employee[] = apiList.map((item: any) => ({
          id:             item.employeeNo ?? item.id?.toString() ?? genId('E'),
          name:           item.name ?? '',
          role:           (item.position as any) ?? '操作工',
          teamId:         item.teamId?.toString() ?? '',
          status:         item.status === 0 ? 'RESIGNED' : 'ACTIVE',
          phone:          item.phone,
          entryDate:      item.entryDate,
          skills:         [],
          certifications: [],
        }));
        setEmployees(mapped);
      }
    } catch { /* 保留本地 mock */ } finally { setApiLoading(false); }
  }, []);

  useEffect(() => {
    loadTeams();
    loadFromApi();
  }, [loadTeams, loadFromApi]);

  // 根据 teamId 在 API 选项 中找到班组信息（同时兼容 mock Team 类型用于 Drawer 显示）
  const getTeam = (emp: Employee): Team | undefined => {
    // 先在 API teamOptions 中查找，若找到则构造一个最小兼容 Team 对象
    const opt = teamOptions.find(t => t.id === String(emp.teamId));
    if (opt) {
      return { id: opt.id, name: opt.name, leader: opt.leaderName ?? '', shiftId: '', workCenter: '' } as Team;
    }
    // 降级到 mock
    return TEAMS.find(t => t.id === emp.teamId);
  };

  const filtered = employees.filter(e => {
    const mt = !searchText
      || e.name.includes(searchText)
      || e.id.includes(searchText)
      || (e.phone || '').includes(searchText);
    const mteam = filterTeam === 'ALL' || e.teamId === filterTeam;
    const mrole = filterRole === 'ALL' || e.role === filterRole;
    const mstatus = filterStatus === 'ALL' || e.status === filterStatus;
    return mt && mteam && mrole && mstatus;
  });

  const summary = {
    total: employees.length,
    active: employees.filter(e => e.status === 'ACTIVE').length,
    leaders: employees.filter(e => e.role === '班组长').length,
    workers: employees.filter(e => e.role === '操作工').length,
    qcs: employees.filter(e => e.role === 'QC').length,
  };

  const handleSave = (emp: Employee) => {
    setEmployees(prev => prev.some(e => e.id === emp.id)
      ? prev.map(e => e.id === emp.id ? emp : e)
      : [emp, ...prev]);
  };

  const handleDelete = (emp: Employee) => {
    setEmployees(prev => prev.filter(e => e.id !== emp.id));
    message.success(`员工「${emp.name}」档案已删除`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
      {/* 页头 */}
      <div style={{ background: '#fff', padding: '12px 16px', borderBottom: '1px solid #e8ecf0', flexShrink: 0 }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: '#1d2939' }}>
          <UserOutlined style={{ color: '#1677ff', marginRight: 8 }} />
          员工档案管理
        </span>
        <span style={{ fontSize: 12, color: '#98a2b3', marginLeft: 12 }}>管理员工信息、班组归属、技能资质</span>
      </div>

      {/* KPI 统计（点击快速过滤） */}
      <div style={{ display: 'flex', gap: 10, padding: '10px 16px', background: '#fff', borderBottom: '1px solid #e8ecf0', flexShrink: 0, flexWrap: 'wrap' }}>
        {([
          { label: '员工总数', val: summary.total,   color: '#1677ff', action: () => { setFilterRole('ALL'); setFilterStatus('ALL'); } },
          { label: '在岗人数', val: summary.active,  color: '#52c41a', action: () => setFilterStatus(filterStatus === 'ACTIVE' ? 'ALL' : 'ACTIVE') },
          { label: '班组长',   val: summary.leaders, color: '#d46b08', action: () => setFilterRole(filterRole === '班组长' ? 'ALL' : '班组长') },
          { label: '操作工',   val: summary.workers, color: '#1677ff', action: () => setFilterRole(filterRole === '操作工' ? 'ALL' : '操作工') },
          { label: 'QC检验员', val: summary.qcs,     color: '#389e0d', action: () => setFilterRole(filterRole === 'QC' ? 'ALL' : 'QC') },
        ] as { label: string; val: number; color: string; action: () => void }[]).map(k => {
          const isActive =
            (k.label === '员工总数' && filterRole === 'ALL' && filterStatus === 'ALL') ||
            (k.label === '在岗人数' && filterStatus === 'ACTIVE') ||
            (k.label === '班组长'   && filterRole === '班组长') ||
            (k.label === '操作工'   && filterRole === '操作工') ||
            (k.label === 'QC检验员' && filterRole === 'QC');
          return (
            <div
              key={k.label}
              onClick={k.action}
              style={{
                padding: '8px 18px', borderRadius: 8, textAlign: 'center', minWidth: 72,
                cursor: 'pointer', transition: 'all 0.2s', userSelect: 'none',
                background: isActive ? `${k.color}15` : '#f8faff',
                border: `1px solid ${isActive ? k.color : '#e8ecf0'}`,
                boxShadow: isActive ? `0 0 0 2px ${k.color}30` : undefined,
              }}
            >
              <div style={{ fontSize: 20, fontWeight: 700, color: k.color }}>{k.val}</div>
              <div style={{ fontSize: 11, color: isActive ? k.color : '#98a2b3', fontWeight: isActive ? 600 : 400 }}>
                {k.label}{isActive && k.label !== '员工总数' ? ' ✓' : ''}
              </div>
            </div>
          );
        })}
      </div>

      {/* 工具栏 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: '#fff', borderBottom: '1px solid #e8ecf0', flexShrink: 0, flexWrap: 'wrap' }}>
        <Input
          prefix={<SearchOutlined style={{ color: '#aaa' }} />}
          placeholder="搜索姓名 / 工号 / 电话..."
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          style={{ width: 240 }}
          allowClear
        />
        <Select value={filterTeam} onChange={setFilterTeam} style={{ width: 130 }}>
          <Option value="ALL">全部班组</Option>
          {teamOptions.map(t => <Option key={t.id} value={t.id}>{t.name}</Option>)}
        </Select>
        <Select value={filterRole} onChange={setFilterRole} style={{ width: 110 }}>
          <Option value="ALL">全部角色</Option>
          {(['班组长', '操作工', 'QC'] as EmployeeRole[]).map(r => (
            <Option key={r} value={r}>
              <span style={{ color: ROLE_COLOR[r].color }}>{r}</span>
            </Option>
          ))}
        </Select>
        <Select value={filterStatus} onChange={setFilterStatus} style={{ width: 100 }}>
          <Option value="ALL">全部状态</Option>
          {Object.entries(STATUS_MAP).map(([k, v]) => (
            <Option key={k} value={k}><span style={{ color: v.color }}>● {v.label}</span></Option>
          ))}
        </Select>
        <div style={{ flex: 1 }} />
        <Button icon={<ReloadOutlined />} loading={apiLoading} onClick={() => { setSearchText(''); setFilterTeam('ALL'); setFilterRole('ALL'); setFilterStatus('ALL'); loadFromApi(); }}>刷新</Button>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingEmp(null); setFormOpen(true); }}>
          新增员工
        </Button>
      </div>

      {/* 员工列表 */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#98a2b3', padding: '60px 0', fontSize: 14 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>👤</div>
            暂无员工数据
          </div>
        ) : (
          filtered.map(emp => (
            <EmployeeCard
              key={emp.id}
              emp={emp}
              team={getTeam(emp)}
              onClick={() => { setSelectedEmp(emp); setDetailOpen(true); }}
              onEdit={() => { setEditingEmp(emp); setFormOpen(true); }}
              onDelete={() => handleDelete(emp)}
            />
          ))
        )}
      </div>

      {/* 详情抽屉 */}
      <EmployeeDetailDrawer
        emp={selectedEmp}
        team={selectedEmp ? getTeam(selectedEmp) : undefined}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
      />

      {/* 新建/编辑弹窗 */}
      <EmployeeFormModal
        open={formOpen}
        editData={editingEmp}
        teamOptions={teamOptions}
        onClose={() => setFormOpen(false)}
        onSaved={handleSave}
      />
    </div>
  );
};

export default EmployeePage;

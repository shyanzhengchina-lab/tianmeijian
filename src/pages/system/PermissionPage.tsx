/**
 * 权限管理页面 — PermissionPage.tsx
 * ================================================================
 * 基于 RBAC 模型，提供三大功能模块：
 *   Tab 1 角色管理     — 查看/新建/编辑/停用角色
 *   Tab 2 菜单权限配置 — 为指定角色配置7维操作权限矩阵
 *   Tab 3 员工-角色分配 — 为员工分配/移除角色
 * ================================================================
 */
import React, { useState, useMemo } from 'react';
import {
  Tabs, Table, Tag, Button, Space, Modal, Form, Input, Select,
  Switch, Tooltip, Badge, Drawer, Checkbox, Row, Col, message,
  Typography, Divider, Alert, Popconfirm, Card, Avatar,
} from 'antd';
import {
  PlusOutlined, EditOutlined, StopOutlined, CheckCircleOutlined,
  SafetyCertificateOutlined, UserSwitchOutlined, TeamOutlined,
  InfoCircleOutlined, KeyOutlined, CopyOutlined, UserOutlined,
  EyeOutlined, DeleteOutlined, LockOutlined,
} from '@ant-design/icons';
import {
  type Role, type MenuPermission, type UserRole, type DataScope, type OperationFlags,
  loadRoles, saveRoles, loadUserRoles, saveUserRoles,
  MENU_CATALOG, DEFAULT_ROLES, DATA_SCOPE_LABEL, DATA_SCOPE_COLOR,
  getUserEffectivePermissions, getUserMaxDataScope,
  loadUserFactories, saveUserFactories, FACTORIES, DEFAULT_USER_FACTORIES,
  type UserFactory,
} from '../../store/rbacData';
import { OPERATORS } from '../workorder/workOrderData';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

// ── 常量 ─────────────────────────────────────────────────────────
const OP_LABELS: Array<{ key: keyof OperationFlags; label: string; color: string }> = [
  { key: 'view',    label: '查看', color: '#8c8c8c' },
  { key: 'create',  label: '新增', color: '#52c41a' },
  { key: 'update',  label: '修改', color: '#1677ff' },
  { key: 'delete',  label: '删除', color: '#ff4d4f' },
  { key: 'audit',   label: '审核', color: '#722ed1' },
  { key: 'enable',  label: '启用', color: '#13c2c2' },
  { key: 'disable', label: '停用', color: '#fa8c16' },
  { key: 'print',   label: '打印', color: '#d4380d' },
];

const DATA_SCOPE_OPTIONS: Array<{ value: DataScope; label: string }> = [
  { value: 'PERSONAL', label: '本人' },
  { value: 'TEAM',     label: '本班组' },
  { value: 'WORKSHOP', label: '本车间' },
  { value: 'FACTORY',  label: '本工厂' },
  { value: 'ALL',      label: '全集团' },
];

const GROUP_ORDER = ['基础资料', '生产管理', '车间执行', '质量管理', '设备管理', '电子批记录', '系统管理'];

function emptyOps(): OperationFlags {
  return { view: false, create: false, update: false, delete: false, audit: false, enable: false, disable: false, print: false };
}

// ── 操作权限徽章 ─────────────────────────────────────────────────
const OpsBadge: React.FC<{ ops: OperationFlags }> = ({ ops }) => {
  const active = OP_LABELS.filter(o => ops[o.key]);
  if (active.length === 0) return <Text type="secondary" style={{ fontSize: 11 }}>—</Text>;
  if (active.length === OP_LABELS.length) {
    return <Tag color="red" style={{ fontSize: 10 }}>全部权限</Tag>;
  }
  return (
    <Space size={3} wrap>
      {active.map(o => (
        <Tag key={o.key} color={o.color} style={{ fontSize: 10, margin: 0 }}>{o.label}</Tag>
      ))}
    </Space>
  );
};

// ─────────────────────────────────────────────────────────────────
// Tab 1：角色管理
// ─────────────────────────────────────────────────────────────────
const RoleManageTab: React.FC<{
  roles: Role[];
  onRolesChange: (r: Role[]) => void;
  onEditPerms: (role: Role) => void;
}> = ({ roles, onRolesChange, onEditPerms }) => {
  const [form] = Form.useForm();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const openCreate = () => {
    setEditingId(null);
    form.resetFields();
    setModalOpen(true);
  };
  const openEdit = (role: Role) => {
    if (role.isBuiltin) { message.warning('内置角色不可编辑基本信息，可直接修改菜单权限'); return; }
    setEditingId(role.id);
    form.setFieldsValue({
      name: role.name, code: role.code,
      description: role.description, dataScope: role.dataScope, color: role.color,
    });
    setModalOpen(true);
  };
  const handleToggleStatus = (role: Role) => {
    if (role.isBuiltin) { message.error('内置角色不可停用'); return; }
    const updated = roles.map(r =>
      r.id === role.id ? { ...r, status: r.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE' } : r
    ) as Role[];
    onRolesChange(updated);
    message.success(`角色「${role.name}」已${role.status === 'ACTIVE' ? '停用' : '启用'}`);
  };
  const handleCopy = (role: Role) => {
    const newRole: Role = {
      ...role,
      id: `ROLE_COPY_${Date.now()}`,
      code: `${role.code}_COPY`,
      name: `${role.name}（副本）`,
      isBuiltin: false,
    };
    onRolesChange([...roles, newRole]);
    message.success(`已复制角色「${role.name}」，可在新副本上修改权限`);
  };
  const handleSubmit = () => {
    form.validateFields().then(vals => {
      if (editingId) {
        onRolesChange(roles.map(r => r.id === editingId ? { ...r, ...vals } : r));
        message.success('角色信息已更新');
      } else {
        const newRole: Role = {
          id: `ROLE_${Date.now()}`,
          ...vals,
          isBuiltin: false,
          status: 'ACTIVE',
          permissions: MENU_CATALOG.map(m => ({
            menuKey: m.key, menuLabel: m.label, menuGroup: m.group,
            ops: emptyOps(),
          })),
        };
        onRolesChange([...roles, newRole]);
        message.success('角色已创建，请前往「菜单权限配置」为其分配权限');
      }
      setModalOpen(false);
    }).catch((err: any) => { if (err?.errorFields) return; });
  };

  const cols = [
    {
      title: '角色名称',
      dataIndex: 'name',
      render: (name: string, r: Role) => (
        <Space>
          <Tag color={r.color} style={{ fontWeight: 600 }}>{name}</Tag>
          {r.isBuiltin && <Tag style={{ fontSize: 10 }} color="default"><LockOutlined /> 内置</Tag>}
          {r.status === 'DISABLED' && <Tag color="default">已停用</Tag>}
        </Space>
      ),
    },
    { title: '角色编码', dataIndex: 'code', render: (c: string) => <Text code style={{ fontSize: 11 }}>{c}</Text> },
    {
      title: '数据范围',
      dataIndex: 'dataScope',
      render: (s: DataScope) => <Tag color={DATA_SCOPE_COLOR[s]}>{DATA_SCOPE_LABEL[s]}</Tag>,
    },
    { title: '已配置菜单', dataIndex: 'permissions', render: (ps: MenuPermission[]) => {
        const cnt = ps.filter(p => p.ops.view).length;
        return <Badge count={cnt} showZero color={cnt > 0 ? '#1677ff' : '#d9d9d9'} />;
      },
    },
    { title: '说明', dataIndex: 'description', ellipsis: true },
    {
      title: '操作',
      render: (_: unknown, r: Role) => (
        <Space>
          <Button size="small" icon={<KeyOutlined />} onClick={() => onEditPerms(r)}>配权限</Button>
          <Button size="small" icon={<CopyOutlined />} onClick={() => handleCopy(r)}>复制</Button>
          {!r.isBuiltin && (
            <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)}>编辑</Button>
          )}
          <Button
            size="small"
            icon={r.status === 'ACTIVE' ? <StopOutlined /> : <CheckCircleOutlined />}
            danger={r.status === 'ACTIVE'}
            disabled={r.isBuiltin}
            onClick={() => handleToggleStatus(r)}
          >
            {r.status === 'ACTIVE' ? '停用' : '启用'}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space>
          <Text type="secondary">共 {roles.length} 个角色，其中 {roles.filter(r => r.isBuiltin).length} 个内置</Text>
        </Space>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新建角色</Button>
      </div>

      <Table
        dataSource={roles}
        columns={cols}
        rowKey="id"
        size="small"
        pagination={false}
        rowClassName={r => r.status === 'DISABLED' ? 'row-disabled' : ''}
      />

      <Modal
        title={editingId ? '编辑角色' : '新建角色'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        width={520}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="角色名称" name="name" rules={[{ required: true }]}>
                <Input placeholder="如：二车间主任" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="角色编码" name="code" rules={[{ required: true }]}>
                <Input placeholder="如：WORKSHOP_MGR_2" style={{ fontFamily: 'monospace' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="数据范围" name="dataScope" rules={[{ required: true }]}>
            <Select>
              {DATA_SCOPE_OPTIONS.map(o => (
                <Option key={o.value} value={o.value}>
                  <Tag color={DATA_SCOPE_COLOR[o.value]}>{o.label}</Tag>
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="角色说明" name="description">
            <Input.TextArea rows={2} placeholder="描述该角色的职责范围..." />
          </Form.Item>
          <Form.Item label="标签颜色" name="color" initialValue="#1677ff">
            <Select>
              {['#f5222d','#fa8c16','#52c41a','#1677ff','#722ed1','#13c2c2','#d4380d','#8c8c8c','#531dab','#0958d9'].map(c => (
                <Option key={c} value={c}><Tag color={c}>{c}</Tag></Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// Tab 2：菜单权限配置（权限矩阵）
// ─────────────────────────────────────────────────────────────────
const PermissionMatrixTab: React.FC<{
  roles: Role[];
  selectedRoleId: string | null;
  onRolesChange: (r: Role[]) => void;
}> = ({ roles, selectedRoleId: initRoleId, onRolesChange }) => {
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(initRoleId);
  const [dirty, setDirty] = useState(false);

  const role = roles.find(r => r.id === selectedRoleId);

  // 构建可编辑的权限 map
  const [permMap, setPermMap] = useState<Map<string, OperationFlags>>(new Map());

  const initPermMap = (r: Role) => {
    const m = new Map<string, OperationFlags>();
    r.permissions.forEach(p => m.set(p.menuKey, { ...p.ops }));
    // 补全缺失菜单
    MENU_CATALOG.forEach(mc => {
      if (!m.has(mc.key)) m.set(mc.key, emptyOps());
    });
    return m;
  };

  const handleSelectRole = (id: string) => {
    if (dirty && !window.confirm('有未保存的修改，是否放弃？')) return;
    const r = roles.find(x => x.id === id);
    if (r) { setPermMap(initPermMap(r)); setDirty(false); }
    setSelectedRoleId(id);
  };

  const handleCheckOp = (menuKey: string, opKey: keyof OperationFlags, val: boolean) => {
    setPermMap(prev => {
      const m = new Map(prev);
      const cur = m.get(menuKey) || emptyOps();
      const updated = { ...cur, [opKey]: val };
      // 开启任意操作时自动勾选 view
      if (opKey !== 'view' && val) updated.view = true;
      // 关闭 view 时清空所有操作
      if (opKey === 'view' && !val) {
        Object.keys(updated).forEach(k => (updated as any)[k] = false);
      }
      m.set(menuKey, updated);
      return m;
    });
    setDirty(true);
  };

  const handleCheckAll = (menuKey: string, all: boolean) => {
    setPermMap(prev => {
      const m = new Map(prev);
      m.set(menuKey, all
        ? { view: true, create: true, update: true, delete: true, audit: true, enable: true, disable: true, print: true }
        : emptyOps()
      );
      return m;
    });
    setDirty(true);
  };

  const handleSave = () => {
    if (!role) return;
    const newPerms: MenuPermission[] = MENU_CATALOG.map(mc => ({
      menuKey: mc.key,
      menuLabel: mc.label,
      menuGroup: mc.group,
      ops: permMap.get(mc.key) || emptyOps(),
    }));
    onRolesChange(roles.map(r => r.id === role.id ? { ...r, permissions: newPerms } : r));
    setDirty(false);
    message.success(`角色「${role.name}」权限配置已保存`);
  };

  const handleReset = () => {
    const orig = DEFAULT_ROLES.find(r => r.id === selectedRoleId);
    if (!orig) { message.warning('自定义角色无法重置为默认值'); return; }
    setPermMap(initPermMap(orig));
    setDirty(true);
    message.info('已恢复为系统默认权限配置，点击保存生效');
  };

  // 按组渲染权限行
  const groupedMenus = useMemo(() => {
    const map = new Map<string, typeof MENU_CATALOG>();
    GROUP_ORDER.forEach(g => map.set(g, []));
    MENU_CATALOG.forEach(m => {
      const arr = map.get(m.group) || [];
      arr.push(m);
      map.set(m.group, arr);
    });
    return map;
  }, []);

  return (
    <div>
      {/* 角色选择器 */}
      <div style={{ marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <Text strong>选择角色：</Text>
        <Select
          style={{ width: 240 }}
          placeholder="请选择要配置权限的角色"
          value={selectedRoleId}
          onChange={handleSelectRole}
        >
          {roles.map(r => (
            <Option key={r.id} value={r.id}>
              <Tag color={r.color}>{r.name}</Tag>
              {r.status === 'DISABLED' && <Text type="secondary">（已停用）</Text>}
            </Option>
          ))}
        </Select>
        {role && (
          <Space>
            <Tag color={DATA_SCOPE_COLOR[role.dataScope]}>
              数据范围：{DATA_SCOPE_LABEL[role.dataScope]}
            </Tag>
            {role.isBuiltin && <Tag><LockOutlined /> 内置</Tag>}
            <Button size="small" onClick={handleReset} disabled={!role.isBuiltin}>重置为默认</Button>
            <Button type="primary" size="small" disabled={!dirty} onClick={handleSave}>💾 保存配置</Button>
          </Space>
        )}
      </div>

      {!role && (
        <Alert
          type="info"
          showIcon
          message="请在左侧选择一个角色，然后在下方权限矩阵中配置菜单权限"
          description="✅ 勾选「查看」以开放该菜单的访问权限；额外勾选具体操作权限（新增/修改/删除/审核/启用/停用/打印）"
        />
      )}

      {role && (
        <div>
          {dirty && (
            <Alert
              type="warning"
              message="有未保存的权限修改，请记得点击「保存配置」"
              showIcon style={{ marginBottom: 12 }}
            />
          )}

          {/* 权限矩阵表格 */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#fafafa' }}>
                  <th style={TH_STYLE}>菜单模块</th>
                  <th style={TH_STYLE}>菜单名称</th>
                  {OP_LABELS.map(o => (
                    <th key={o.key} style={{ ...TH_STYLE, width: 56, textAlign: 'center' }}>
                      <Tag color={o.color} style={{ fontSize: 10, margin: 0 }}>{o.label}</Tag>
                    </th>
                  ))}
                  <th style={{ ...TH_STYLE, width: 72, textAlign: 'center' }}>全选/清空</th>
                </tr>
              </thead>
              <tbody>
                {GROUP_ORDER.map(group => {
                  const menus = groupedMenus.get(group) || [];
                  if (menus.length === 0) return null;
                  return (
                    <React.Fragment key={group}>
                      <tr>
                        <td colSpan={10}
                          style={{ background: '#f0f2f5', fontWeight: 700, padding: '4px 12px',
                            borderBottom: '1px solid #e8ecf0', color: '#1d2939', fontSize: 12 }}>
                          📂 {group}
                        </td>
                      </tr>
                      {menus.map((m, idx) => {
                        const ops = permMap.get(m.key) || emptyOps();
                        const allChecked = OP_LABELS.every(o => ops[o.key]);
                        const bg = idx % 2 === 0 ? '#fff' : '#fafafa';
                        return (
                          <tr key={m.key} style={{ background: bg }}>
                            <td style={TD_STYLE} />
                            <td style={{ ...TD_STYLE, fontWeight: ops.view ? 500 : 400, color: ops.view ? '#1d2939' : '#98a2b3' }}>
                              {m.label}
                            </td>
                            {OP_LABELS.map(o => (
                              <td key={o.key} style={{ ...TD_STYLE, textAlign: 'center' }}>
                                <Checkbox
                                  checked={ops[o.key]}
                                  onChange={e => handleCheckOp(m.key, o.key, e.target.checked)}
                                />
                              </td>
                            ))}
                            <td style={{ ...TD_STYLE, textAlign: 'center' }}>
                              <Switch
                                size="small"
                                checked={allChecked}
                                onChange={v => handleCheckAll(m.key, v)}
                                checkedChildren="全部"
                                unCheckedChildren="清空"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: 16, textAlign: 'right' }}>
            <Button type="primary" disabled={!dirty} onClick={handleSave} size="large">
              💾 保存角色「{role.name}」的权限配置
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

const TH_STYLE: React.CSSProperties = {
  padding: '8px 12px', border: '1px solid #e8ecf0',
  fontWeight: 600, background: '#fafafa', whiteSpace: 'nowrap',
};
const TD_STYLE: React.CSSProperties = {
  padding: '6px 12px', border: '1px solid #f0f2f5',
};

// ─────────────────────────────────────────────────────────────────
// Tab 3：员工-角色分配
// ─────────────────────────────────────────────────────────────────
const UserRoleTab: React.FC<{
  roles: Role[];
  userRoles: UserRole[];
  onUserRolesChange: (ur: UserRole[]) => void;
}> = ({ roles, userRoles, onUserRolesChange }) => {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [userFactories, setUserFactories] = useState<UserFactory[]>(loadUserFactories);

  const handleFactoryAssign = (userId: string, factoryIds: string[]) => {
    const existing = userFactories.find(u => u.userId === userId);
    let updated: UserFactory[];
    if (existing) {
      updated = userFactories.map(u =>
        u.userId === userId
          ? { ...u, factoryIds, defaultFactoryId: factoryIds[0] ?? 'F001' }
          : u
      );
    } else {
      updated = [...userFactories, { userId, factoryIds, defaultFactoryId: factoryIds[0] ?? 'F001' }];
    }
    setUserFactories(updated);
    saveUserFactories(updated);
    message.success('工厂权限已更新');
  };

  const handleAssign = (userId: string, roleIds: string[]) => {
    const ur = userRoles.find(u => u.userId === userId);
    const op = OPERATORS.find(o => o.id === userId);
    if (ur) {
      onUserRolesChange(userRoles.map(u => u.userId === userId ? { ...u, roleIds } : u));
    } else {
      onUserRolesChange([...userRoles, { userId, userName: op?.name || userId, roleIds }]);
    }
    message.success(`员工「${op?.name}」角色分配已更新`);
  };

  const previewUser = userRoles.find(u => u.userId === selectedUserId);
  const effectivePerms = useMemo(() =>
    selectedUserId ? getUserEffectivePermissions(selectedUserId, roles, userRoles) : new Map(),
    [selectedUserId, roles, userRoles]
  );
  const maxScope = selectedUserId ? getUserMaxDataScope(selectedUserId, roles, userRoles) : 'PERSONAL';

  const cols = [
    {
      title: '员工',
      render: (_: unknown, ur: UserRole) => {
        const op = OPERATORS.find(o => o.id === ur.userId);
        return (
          <Space>
            <Avatar size={28} style={{ background: '#1677ff' }}>{ur.userName[0]}</Avatar>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{ur.userName}</div>
              <div style={{ fontSize: 11, color: '#667085' }}>{ur.userId} · {op?.role || '—'}</div>
            </div>
          </Space>
        );
      },
    },
    {
      title: '已分配角色',
      dataIndex: 'roleIds',
      render: (roleIds: string[], ur: UserRole) => (
        <Select
          mode="multiple"
          value={roleIds}
          style={{ minWidth: 320 }}
          onChange={ids => handleAssign(ur.userId, ids)}
          optionLabelProp="label"
        >
          {roles.filter(r => r.status === 'ACTIVE').map(r => (
            <Option key={r.id} value={r.id} label={r.name}>
              <Tag color={r.color}>{r.name}</Tag>
              <Text type="secondary" style={{ fontSize: 11 }}> · {DATA_SCOPE_LABEL[r.dataScope]}</Text>
            </Option>
          ))}
        </Select>
      ),
    },
    {
      title: '可访问工厂',
      render: (_: unknown, ur: UserRole) => {
        const uf = userFactories.find(u => u.userId === ur.userId);
        const ids = uf?.factoryIds ?? ['F001'];
        return (
          <Select
            mode="multiple"
            value={ids}
            style={{ minWidth: 200 }}
            onChange={newIds => handleFactoryAssign(ur.userId, newIds)}
            options={FACTORIES.map(f => ({ value: f.id, label: f.name }))}
            placeholder="选择工厂"
          />
        );
      },
    },
    {
      title: '合并数据范围',
      render: (_: unknown, ur: UserRole) => {
        const scope = getUserMaxDataScope(ur.userId, roles, userRoles);
        return <Tag color={DATA_SCOPE_COLOR[scope]}>{DATA_SCOPE_LABEL[scope]}</Tag>;
      },
    },
    {
      title: '操作',
      render: (_: unknown, ur: UserRole) => (
        <Button
          size="small"
          icon={<EyeOutlined />}
          onClick={() => { setSelectedUserId(ur.userId); setPreviewOpen(true); }}
        >
          权限预览
        </Button>
      ),
    },
  ];

  // 合并所有员工到列表（包括未分配角色的）
  const allUsers: UserRole[] = OPERATORS.map(op => {
    const ur = userRoles.find(u => u.userId === op.id);
    return ur || { userId: op.id, userName: op.name, roleIds: [] };
  });

  return (
    <div>
      <Alert
        type="info"
        showIcon
        message="多角色员工权限取并集：任一角色拥有的权限，该员工最终均拥有；数据范围取多角色中最大范围。"
        style={{ marginBottom: 16 }}
      />

      <Table
        dataSource={allUsers}
        columns={cols}
        rowKey="userId"
        size="small"
        pagination={false}
      />

      {/* 权限预览抽屉 */}
      <Drawer
        title={
          <Space>
            <UserOutlined />
            <span>权限预览 — {previewUser?.userName}</span>
          </Space>
        }
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        width={520}
      >
        {selectedUserId && (
          <div>
            <div style={{ marginBottom: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Tag color={DATA_SCOPE_COLOR[maxScope]} style={{ fontSize: 13 }}>
                最大数据范围：{DATA_SCOPE_LABEL[maxScope]}
              </Tag>
              {(() => {
                const uf = userFactories.find(u => u.userId === selectedUserId);
                const ids = uf?.factoryIds ?? ['F001'];
                return ids.map(fid => {
                  const f = FACTORIES.find(x => x.id === fid);
                  return f ? (
                    <Tag key={fid} color="blue" style={{ fontSize: 13 }}>
                      🏭 {f.name}
                    </Tag>
                  ) : null;
                });
              })()}
            </div>
            <Divider>已拥有菜单权限（合并{previewUser?.roleIds.length || 0}个角色）</Divider>
            {GROUP_ORDER.map(group => {
              const menus = MENU_CATALOG.filter(m => m.group === group);
              const activeMenus = menus.filter(m => {
                const ops = effectivePerms.get(m.key);
                return ops && ops.view;
              });
              if (activeMenus.length === 0) return null;
              return (
                <div key={group} style={{ marginBottom: 12 }}>
                  <Text strong style={{ fontSize: 12, color: '#667085' }}>📂 {group}</Text>
                  <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {activeMenus.map(m => {
                      const ops = effectivePerms.get(m.key)!;
                      return (
                        <div key={m.key} style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          padding: '4px 8px', background: '#f9fafb', borderRadius: 6,
                        }}>
                          <Text style={{ minWidth: 100, fontSize: 12 }}>{m.label}</Text>
                          <OpsBadge ops={ops} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            {effectivePerms.size === 0 && (
              <Alert type="warning" message="该员工暂未分配任何角色，无访问权限" showIcon />
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// 主页面
// ─────────────────────────────────────────────────────────────────
const PermissionPage: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>(loadRoles);
  const [userRoles, setUserRoles] = useState<UserRole[]>(loadUserRoles);
  const [activeTab, setActiveTab] = useState('roles');
  const [permEditRoleId, setPermEditRoleId] = useState<string | null>(null);

  const handleRolesChange = (r: Role[]) => {
    setRoles(r);
    saveRoles(r);
  };
  const handleUserRolesChange = (ur: UserRole[]) => {
    setUserRoles(ur);
    saveUserRoles(ur);
  };
  const handleEditPerms = (role: Role) => {
    setPermEditRoleId(role.id);
    setActiveTab('matrix');
  };

  return (
    <div style={{ padding: 24, background: '#f0f2f5', minHeight: '100vh' }}>
      {/* 页头 */}
      <div style={{
        background: 'linear-gradient(135deg,#1a1a2e 0%,#16213e 100%)',
        borderRadius: 12, padding: '20px 28px', marginBottom: 20, color: '#fff',
      }}>
        <Space size={16} align="center">
          <SafetyCertificateOutlined style={{ fontSize: 32, color: '#faad14' }} />
          <div>
            <Title level={3} style={{ color: '#fff', margin: 0 }}>
              系统权限管理
            </Title>
            <Text style={{ color: '#c5cae9', fontSize: 13 }}>
              RBAC 权限模型 · 角色驱动 · 数据范围隔离 · 权限并集计算
            </Text>
          </div>
        </Space>
        <Row gutter={32} style={{ marginTop: 16 }}>
          {[
            { label: '角色总数', val: roles.length, color: '#fff' },
            { label: '内置角色', val: roles.filter(r => r.isBuiltin).length, color: '#faad14' },
            { label: '启用角色', val: roles.filter(r => r.status === 'ACTIVE').length, color: '#52c41a' },
            { label: '员工覆盖', val: userRoles.filter(u => u.roleIds.length > 0).length, color: '#40a9ff' },
          ].map(k => (
            <Col key={k.label}>
              <div style={{ fontSize: 22, fontWeight: 700, color: k.color }}>{k.val}</div>
              <div style={{ fontSize: 11, color: '#c5cae9' }}>{k.label}</div>
            </Col>
          ))}
        </Row>
      </div>

      <Card bodyStyle={{ padding: 0 }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          size="large"
          style={{ padding: '0 16px' }}
          tabBarStyle={{ borderBottom: '1px solid #f0f2f5', marginBottom: 0 }}
        >
          <TabPane
            tab={<span><TeamOutlined /> 角色管理 <Badge count={roles.length} color="#1677ff" /></span>}
            key="roles"
          >
            <div style={{ padding: '16px 0' }}>
              <RoleManageTab
                roles={roles}
                onRolesChange={handleRolesChange}
                onEditPerms={handleEditPerms}
              />
            </div>
          </TabPane>

          <TabPane
            tab={<span><KeyOutlined /> 菜单权限配置</span>}
            key="matrix"
          >
            <div style={{ padding: '16px 0' }}>
              <PermissionMatrixTab
                roles={roles}
                selectedRoleId={permEditRoleId}
                onRolesChange={handleRolesChange}
              />
            </div>
          </TabPane>

          <TabPane
            tab={<span><UserSwitchOutlined /> 员工-角色分配 <Badge count={userRoles.filter(u => u.roleIds.length > 0).length} color="#52c41a" /></span>}
            key="user-roles"
          >
            <div style={{ padding: '16px 0' }}>
              <UserRoleTab
                roles={roles}
                userRoles={userRoles}
                onUserRolesChange={handleUserRolesChange}
              />
            </div>
          </TabPane>
        </Tabs>
      </Card>

      {/* 说明卡片 */}
      <Card
        size="small"
        style={{ marginTop: 16, background: '#fffbe6', border: '1px solid #ffe58f' }}
        bodyStyle={{ padding: '12px 16px' }}
      >
        <Space wrap>
          <InfoCircleOutlined style={{ color: '#fa8c16' }} />
          <Text style={{ fontSize: 12, color: '#d46b08' }}>
            <strong>RBAC 权限规则：</strong>
            ① 员工可持有多个角色，权限取<strong>并集</strong>（任一角色有即拥有）；
            ② 数据范围取多角色中<strong>最大</strong>范围；
            ③ 查看权限是基础，关闭后其余操作权限自动失效；
            ④ 内置角色不可删除，可复制后调整；
            ⑤ 数据库表结构：sys_user → sys_user_role → sys_role → sys_role_permission → sys_menu。
          </Text>
        </Space>
      </Card>
    </div>
  );
};

export default PermissionPage;

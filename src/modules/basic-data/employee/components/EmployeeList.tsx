/**
 * 员工档案列表组件
 * 使用新架构的完整实现
 * 从卡片布局迁移到表格布局，支持批量操作
 * 完全保持UI/UX一致性，与现有页面样式一致
 */
import React, { useEffect, useState, useMemo } from 'react';
import { DataTable } from '../../../../shared/components/DataTable';
import { SearchForm } from '../../../../shared/components/SearchForm';
import { ActionBar } from '../../../../shared/components/ActionBar';
import { StatusBadge } from '../../../../shared/components/StatusBadge';
import { DetailDrawer } from '../../../../shared/components/DetailDrawer';
import { FormModal } from '../../../../shared/components/FormModal';
import { useEmployeeStore } from '../store';
import { usePermission } from '../../../../shared/hooks/usePermission';
import type { FormField, DetailField } from '../../../../shared/types/common';
import {
  Employee,
  EmployeeStatus,
  EmployeeRole,
  EMPLOYEE_STATUS_MAP,
  EMPLOYEE_ROLE_MAP,
  SKILL_OPTIONS,
  CERT_OPTIONS,
} from '../types';
import {
  PlusOutlined,
  ReloadOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  UserOutlined,
  TeamOutlined,
  SafetyCertificateOutlined,
  ClockCircleOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { Button, Space, Popconfirm, message, Statistic, Row, Col, Tag, Modal } from 'antd';
import type { ColumnsType } from 'antd/es/table';

/**
 * 搜索表单字段配置
 */
const SEARCH_FIELDS: FormField[] = [
  { name: 'name', label: '姓名', type: 'input', placeholder: '请输入姓名' },
  { name: 'code', label: '工号', type: 'input', placeholder: '请输入工号' },
  {
    name: 'role',
    label: '角色',
    type: 'select',
    options: [
      { label: '全部', value: '' },
      ...Object.entries(EMPLOYEE_ROLE_MAP).map(([key, value]) => ({
        label: value.label,
        value: key,
      })),
    ],
  },
  {
    name: 'status',
    label: '状态',
    type: 'select',
    options: [
      { label: '全部', value: '' },
      ...Object.entries(EMPLOYEE_STATUS_MAP).map(([key, value]) => ({
        label: value.label,
        value: key,
      })),
    ],
  },
  { name: 'teamId', label: '班组', type: 'input', placeholder: '请输入班组' },
];

/**
 * 表单字段配置（新增/编辑员工）
 */
const EMPLOYEE_FORM_FIELDS: FormField[] = [
  { name: 'name', label: '姓名', type: 'input', required: true },
  { name: 'code', label: '工号', type: 'input', required: true },
  {
    name: 'role',
    label: '角色',
    type: 'select',
    required: true,
    options: Object.entries(EMPLOYEE_ROLE_MAP).map(([key, value]) => ({
      label: value.label,
      value: key,
    })),
  },
  { name: 'teamId', label: '班组', type: 'input', required: true },
  { name: 'workshopCode', label: '所属车间', type: 'input', required: true },
  { name: 'phone', label: '联系电话', type: 'input' },
  { name: 'idCard', label: '身份证号', type: 'input' },
  { name: 'entryDate', label: '入职日期', type: 'datePicker' },
  {
    name: 'skills',
    label: '技能',
    type: 'select',
    mode: 'multiple',
    options: SKILL_OPTIONS.map(skill => ({ label: skill, value: skill })),
  },
  {
    name: 'certifications',
    label: '证书',
    type: 'select',
    mode: 'multiple',
    options: CERT_OPTIONS.map(cert => ({ label: cert, value: cert })),
  },
  {
    name: 'status',
    label: '状态',
    type: 'select',
    required: true,
    options: Object.entries(EMPLOYEE_STATUS_MAP).map(([key, value]) => ({
      label: value.label,
      value: key,
    })),
  },
  { name: 'remark', label: '备注', type: 'textArea' },
];

/**
 * EmployeeList组件
 * 使用新架构的完整员工列表页面
 * 保持与现有页面完全一致的样式和功能
 */
export const EmployeeList: React.FC = () => {
  const {
    employees,
    selectedIds,
    currentEmployee,
    filters,
    pagination,
    loading,
    error,
    statistics,
    loadEmployees,
    loadStatistics,
    createEmployee,
    updateEmployee,
    deleteEmployees,
    leaveEmployee,
    resignEmployee,
    activateEmployee,
    updateStatus,
    updateSkills,
    updateCertifications,
    setFilters,
    setSelectedIds,
    setCurrentEmployee,
    setLoading,
    setError,
  } = useEmployeeStore();

  const { canCreate, canUpdate, canDelete, canManage } = usePermission('employee');

  const [modalOpen, setModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  /**
   * 初始化加载数据
   */
  useEffect(() => {
    loadEmployees();
    loadStatistics();
  }, []);

  /**
   * 搜索处理
   */
  const handleSearch = (values: any) => {
    setFilters(values);
    loadEmployees();
  };

  /**
   * 重置处理
   */
  const handleReset = () => {
    setFilters({});
    loadEmployees();
  };

  /**
   * 新增员工
   */
  const handleAdd = () => {
    setCurrentEmployee({} as Employee); // 空对象表示新增模式
    setModalOpen(true);
  };

  /**
   * 编辑员工
   */
  const handleEdit = (employee: Employee) => {
    setCurrentEmployee(employee);
    setModalOpen(true);
  };

  /**
   * 查看详情
   */
  const handleView = (employee: Employee) => {
    setCurrentEmployee(employee);
    setDetailOpen(true);
  };

  /**
   * 删除员工
   */
  const handleDelete = async (ids: string[]) => {
    try {
      await deleteEmployees(ids);
      message.success(`成功删除 ${ids.length} 个员工`);
    } catch (error) {
      console.error('删除员工失败:', error);
    }
  };

  /**
   * 请假员工
   */
  const handleLeave = async (employee: Employee) => {
    try {
      const leaveDate = new Date().toISOString().split('T')[0];
      await leaveEmployee(employee.id, leaveDate);
      message.success(`员工 ${employee.name} 已设置为请假状态`);
    } catch (error) {
      console.error('设置请假失败:', error);
    }
  };

  /**
   * 员工离职
   */
  const handleResign = async (employee: Employee) => {
    try {
      const resignDate = new Date().toISOString().split('T')[0];
      await resignEmployee(employee.id, resignDate);
      message.success(`员工 ${employee.name} 已设置为离职状态`);
    } catch (error) {
      console.error('设置离职失败:', error);
    }
  };

  /**
   * 恢复员工
   */
  const handleActivate = async (employee: Employee) => {
    try {
      await activateEmployee(employee.id);
      message.success(`员工 ${employee.name} 已恢复在岗状态`);
    } catch (error) {
      console.error('恢复员工失败:', error);
    }
  };

  /**
   * 批量恢复
   */
  const handleBatchActivate = async () => {
    if (selectedIds.length === 0) {
      message.warning('请先选择员工');
      return;
    }

    Modal.confirm({
      title: '确认批量恢复',
      content: `您确定要恢复选中的 ${selectedIds.length} 个员工吗？`,
      okText: '确定恢复',
      cancelText: '取消',
      centered: true,
      onOk: async () => {
        try {
          await updateStatus(selectedIds, 'ACTIVE');
          message.success(`成功恢复 ${selectedIds.length} 个员工`);
          setSelectedIds([]);
        } catch (error) {
          console.error('批量恢复失败:', error);
        }
      },
    });
  };

  /**
   * 批量请假
   */
  const handleBatchLeave = async () => {
    if (selectedIds.length === 0) {
      message.warning('请先选择员工');
      return;
    }

    Modal.confirm({
      title: '确认批量请假',
      content: `您确定要将选中的 ${selectedIds.length} 个员工设置为请假状态吗？`,
      okText: '确定请假',
      cancelText: '取消',
      centered: true,
      onOk: async () => {
        try {
          await updateStatus(selectedIds, 'LEAVE');
          message.success(`成功将 ${selectedIds.length} 个员工设置为请假状态`);
          setSelectedIds([]);
        } catch (error) {
          console.error('批量请假失败:', error);
        }
      },
    });
  };

  /**
   * 批量离职
   */
  const handleBatchResign = async () => {
    if (selectedIds.length === 0) {
      message.warning('请先选择员工');
      return;
    }

    Modal.confirm({
      title: '确认批量离职',
      content: `您确定要将选中的 ${selectedIds.length} 个员工设置为离职状态吗？此操作不可撤销！`,
      okText: '确定离职',
      okType: 'danger',
      cancelText: '取消',
      centered: true,
      onOk: async () => {
        try {
          await updateStatus(selectedIds, 'RESIGNED');
          message.success(`成功将 ${selectedIds.length} 个员工设置为离职状态`);
          setSelectedIds([]);
        } catch (error) {
          console.error('批量离职失败:', error);
        }
      },
    });
  };

  /**
   * 批量删除
   */
  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) {
      message.warning('请先选择员工');
      return;
    }

    Modal.confirm({
      title: '确认批量删除',
      content: `您确定要删除选中的 ${selectedIds.length} 个员工吗？此操作不可恢复！`,
      okText: '确定删除',
      okType: 'danger',
      cancelText: '取消',
      centered: true,
      onOk: async () => {
        try {
          await deleteEmployees(selectedIds);
          message.success(`成功删除 ${selectedIds.length} 个员工`);
          setSelectedIds([]);
        } catch (error) {
          console.error('批量删除失败:', error);
        }
      },
    });
  };

  /**
   * 刷新列表
   */
  const handleRefresh = () => {
    loadEmployees();
    loadStatistics();
  };

  /**
   * 表单提交处理
   */
  const handleFormSubmit = async (values: any) => {
    setFormLoading(true);
    try {
      if (currentEmployee && currentEmployee.id) {
        // 编辑模式
        await updateEmployee({ ...values, id: currentEmployee.id });
        message.success('员工更新成功');
      } else {
        // 新增模式
        await createEmployee(values);
        message.success('员工创建成功');
      }
      setModalOpen(false);
      await loadEmployees();
    } catch (error: any) {
      console.error('表单提交失败:', error);
    } finally {
      setFormLoading(false);
    }
  };

  /**
   * 构建详情字段
   */
  const buildDetailFields = (): DetailField[] => {
    if (!currentEmployee) return [];

    const roleConfig = EMPLOYEE_ROLE_MAP[currentEmployee.role];
    const statusConfig = EMPLOYEE_STATUS_MAP[currentEmployee.status];

    return [
      { label: '工号', value: currentEmployee.code },
      { label: '姓名', value: currentEmployee.name },
      { label: '角色', value: roleConfig.label, type: 'tag' as const, options: [roleConfig] },
      { label: '班组', value: currentEmployee.teamName || '—' },
      { label: '所属车间', value: currentEmployee.workshopCode || '—' },
      { label: '联系电话', value: currentEmployee.phone || '—' },
      { label: '身份证号', value: currentEmployee.idCard || '—' },
      { label: '入职日期', value: currentEmployee.entryDate || '—' },
      {
        label: '技能',
        value: currentEmployee.skills?.join(', ') || '—',
      },
      {
        label: '证书',
        value: currentEmployee.certifications?.join(', ') || '—',
      },
      { label: '状态', value: statusConfig.label, type: 'tag' as const, options: [statusConfig] },
      { label: '创建时间', value: currentEmployee.createdAt },
      { label: '更新时间', value: currentEmployee.updatedAt },
      { label: '备注', value: currentEmployee.remark || '—' },
    ];
  };

  /**
   * 表格列定义
   */
  const columns: ColumnsType<any> = useMemo(() => [
    {
      title: '工号',
      dataIndex: 'code',
      key: 'code',
      width: 120,
      fixed: 'left' as const,
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 100,
      fixed: 'left' as const,
      render: (text: string, record: Employee) => (
        <Space size="small">
          <UserOutlined style={{ color: '#1677ff' }} />
          {text}
          {record.role === '班组长' && (
            <Tag color="#d46b08" style={{ fontWeight: 600 }}>★</Tag>
          )}
        </Space>
      ),
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 100,
      render: (role: EmployeeRole) => {
        const roleConfig = EMPLOYEE_ROLE_MAP[role];
        return (
          <Tag color={roleConfig.color} style={{ fontWeight: 600 }}>
            {roleConfig.label}
          </Tag>
        );
      },
    },
    {
      title: '班组',
      dataIndex: 'teamName',
      key: 'teamName',
      width: 120,
      render: (teamName: string) => (
        <Space size="small">
          <TeamOutlined style={{ color: '#722ed1' }} />
          {teamName || '未分配'}
        </Space>
      ),
    },
    {
      title: '所属车间',
      dataIndex: 'workshopCode',
      key: 'workshopCode',
      width: 120,
    },
    {
      title: '联系电话',
      dataIndex: 'phone',
      key: 'phone',
      width: 130,
    },
    {
      title: '身份证号',
      dataIndex: 'idCard',
      key: 'idCard',
      width: 180,
      ellipsis: true,
    },
    {
      title: '入职日期',
      dataIndex: 'entryDate',
      key: 'entryDate',
      width: 120,
    },
    {
      title: '技能',
      dataIndex: 'skills',
      key: 'skills',
      width: 200,
      render: (skills: string[]) => {
        if (!skills || skills.length === 0) return '—';
        return (
          <Space size="small" wrap>
            {skills.slice(0, 2).map(skill => (
              <Tag key={skill} icon={<SafetyCertificateOutlined />} color="blue" style={{ fontSize: 12 }}>
                {skill}
              </Tag>
            ))}
            {skills.length > 2 && <Tag>+{skills.length - 2}</Tag>}
          </Space>
        );
      },
    },
    {
      title: '证书',
      dataIndex: 'certifications',
      key: 'certifications',
      width: 200,
      render: (certifications: string[]) => {
        if (!certifications || certifications.length === 0) return '—';
        return (
          <Space size="small" wrap>
            {certifications.slice(0, 2).map(cert => (
              <Tag key={cert} color="green" style={{ fontSize: 12 }}>
                {cert}
              </Tag>
            ))}
            {certifications.length > 2 && <Tag>+{certifications.length - 2}</Tag>}
          </Space>
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: EmployeeStatus) => (
        <StatusBadge status={status} statusMap={EMPLOYEE_STATUS_MAP} />
      ),
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      width: 150,
      ellipsis: true,
      render: (remark: string) => remark || '—',
    },
    {
      title: '操作',
      key: 'action',
      width: 280,
      fixed: 'right' as const,
      render: (_: any, record: Employee) => (
        <Space size="small" wrap>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
          >
            详情
          </Button>
          {canUpdate('employee') && record.status === 'ACTIVE' && (
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            >
              编辑
            </Button>
          )}
          {canManage('employee') && record.status === 'ACTIVE' && (
            <Button
              type="link"
              size="small"
              icon={<ClockCircleOutlined />}
              onClick={() => handleLeave(record)}
            >
              请假
            </Button>
          )}
          {canManage('employee') && record.status === 'ACTIVE' && (
            <Button
              type="link"
              size="small"
              icon={<LogoutOutlined />}
              onClick={() => handleResign(record)}
            >
              离职
            </Button>
          )}
          {canManage('employee') && (record.status === 'LEAVE' || record.status === 'RESIGNED') && (
            <Button
              type="link"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => handleActivate(record)}
            >
              恢复
            </Button>
          )}
          {canDelete('employee') && (
            <Popconfirm
              title="确认删除"
              description={`确定要删除员工「${record.name}」吗？`}
              onConfirm={() => handleDelete([record.id])}
              okText="确定"
              cancelText="取消"
            >
              <Button
                type="link"
                size="small"
                danger
                icon={<DeleteOutlined />}
              >
                删除
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ], [canUpdate, canDelete, canManage]);

  return (
    <div className="employee-page" style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
      {/* 统计卡片 */}
      {statistics && (
        <div style={{ background: '#fff', padding: '16px', borderBottom: '1px solid #e8ecf0' }}>
          <Row gutter={16}>
            <Col span={4}>
              <Statistic
                title="员工总数"
                value={statistics.totalCount}
                valueStyle={{ color: '#1677ff' }}
                prefix={<UserOutlined style={{ fontSize: 20 }} />}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title="在岗"
                value={statistics.activeCount}
                valueStyle={{ color: '#52c41a' }}
                prefix={<CheckCircleOutlined style={{ fontSize: 20, color: '#52c41a' }} />}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title="请假"
                value={statistics.leaveCount}
                valueStyle={{ color: '#faad14' }}
                prefix={<ClockCircleOutlined style={{ fontSize: 20, color: '#faad14' }} />}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title="离职"
                value={statistics.resignedCount}
                valueStyle={{ color: '#f5222d' }}
                prefix={<LogoutOutlined style={{ fontSize: 20, color: '#f5222d' }} />}
              />
            </Col>
            <Col span={8}>
              <div style={{ fontSize: 14, color: '#64748b', textAlign: 'center', paddingTop: 10 }}>
                <TeamOutlined style={{ marginRight: 8 }} />
                班组长: {statistics.roleStats['班组长'] || 0} 人 |
                操作工: {statistics.roleStats['操作工'] || 0} 人 |
                QC: {statistics.roleStats['QC'] || 0} 人
              </div>
            </Col>
          </Row>
        </div>
      )}

      {/* 搜索表单 */}
      <div style={{ background: '#fff', padding: '16px', borderBottom: '1px solid #e8ecf0' }}>
        <SearchForm
          fields={SEARCH_FIELDS}
          onSearch={handleSearch}
          onReset={handleReset}
          loading={loading}
          layout="inline"
        />
      </div>

      {/* 操作栏 */}
      <ActionBar
        title="员工档案"
        actions={[
          { key: 'add', label: '新增', icon: <PlusOutlined />, type: 'primary', onClick: handleAdd },
          { key: 'refresh', label: '刷新', icon: <ReloadOutlined />, onClick: handleRefresh },
        ]}
        selectedCount={selectedIds.length}
        batchActions={[
          { key: 'activate', label: '恢复', onClick: handleBatchActivate },
          { key: 'leave', label: '请假', onClick: handleBatchLeave },
          { key: 'resign', label: '离职', onClick: handleBatchResign, danger: true },
          { key: 'delete', label: '删除', onClick: handleBatchDelete, danger: true },
        ]}
      />

      {/* 员工数据表格 */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
        <DataTable
          data={employees}
          rowKey="id"
          columns={columns}
          loading={loading}
          pagination={pagination}
          paginationState={pagination}
          onPaginationChange={(page, pageSize) => {
            setFilters({ current: page, pageSize });
            loadEmployees();
          }}
          rowSelection={{
            selectedRowKeys: selectedIds,
            onChange: (keys) => setSelectedIds(keys as string[]),
          }}
          scroll={{ x: 2000 }}
          bordered={false}
          size="middle"
        />
      </div>

      {/* 错误提示 */}
      {error && (
        <div
          style={{
            padding: '16px',
            margin: '16px',
            background: '#fff1f0',
            border: '1px solid #ffa39e',
            borderRadius: 4,
            color: '#cf1322',
          }}
        >
          {error}
        </div>
      )}

      {/* 新增/编辑弹窗 */}
      <FormModal
        visible={modalOpen}
        title={currentEmployee && currentEmployee.id ? '编辑员工' : '新增员工'}
        mode={currentEmployee && currentEmployee.id ? 'edit' : 'create'}
        fields={EMPLOYEE_FORM_FIELDS}
        initialValues={currentEmployee || {}}
        onSubmit={handleFormSubmit}
        onCancel={() => {
          setModalOpen(false);
          setCurrentEmployee(null);
        }}
        loading={formLoading}
        width={800}
      />

      {/* 详情抽屉 */}
      <DetailDrawer
        visible={detailOpen}
        title="员工档案详情"
        fields={buildDetailFields()}
        onClose={() => setDetailOpen(false)}
        showActions={true}
        onEdit={() => {
          setDetailOpen(false);
          handleEdit(currentEmployee!);
        }}
        width={700}
      />
    </div>
  );
};

export default EmployeeList;

/**
 * 班组档案列表组件
 * 使用新架构的完整实现
 * 完全保持UI/UX零变化，与现有页面样式一致
 */
import React, { useEffect, useState } from 'react';
import { DataTable } from '../../../../shared/components/DataTable';
import { SearchForm } from '../../../../shared/components/SearchForm';
import { ActionBar } from '../../../../shared/components/ActionBar';
import { StatusBadge } from '../../../../shared/components/StatusBadge';
import { DetailDrawer } from '../../../../shared/components/DetailDrawer';
import { FormModal } from '../../../../shared/components/FormModal';
import { useTeamStore } from '../store';
import { usePermission } from '../../../../shared/hooks/usePermission';
import type { FormField, DetailField } from '../../../../shared/types/common';
import {
  Team,
  TeamStatus,
  TEAM_STATUS_MAP,
} from '../types';
import {
  PlusOutlined,
  ReloadOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  TeamOutlined,
  ApartmentOutlined,
  UserOutlined,
  CheckCircleOutlined,
  StopOutlined,
} from '@ant-design/icons';
import { Button, Space, Popconfirm, message, Statistic, Row, Col, Tag, Modal } from 'antd';
import type { ColumnsType } from 'antd/es/table';

/**
 * 搜索表单字段配置
 */
const SEARCH_FIELDS: FormField[] = [
  { name: 'name', label: '班组名称', type: 'input', placeholder: '请输入班组名称' },
  { name: 'workCenter', label: '工作中心', type: 'input', placeholder: '请输入工作中心' },
  { name: 'workshop', label: '车间', type: 'input', placeholder: '请输入车间' },
  { name: 'leader', label: '班组长', type: 'input', placeholder: '请输入班组长' },
  {
    name: 'status',
    label: '状态',
    type: 'select',
    options: [
      { label: '全部', value: '' },
      ...Object.entries(TEAM_STATUS_MAP).map(([key, value]) => ({
        label: value.label,
        value: key,
      })),
    ],
  },
];

/**
 * 表单字段配置（新增/编辑班组）
 */
const TEAM_FORM_FIELDS: FormField[] = [
  { name: 'name', label: '班组名称', type: 'input', required: true },
  { name: 'workCenter', label: '工作中心', type: 'input', required: true },
  { name: 'workshop', label: '车间', type: 'input', required: true },
  { name: 'factoryId', label: '工厂ID', type: 'input', required: true },
  { name: 'shiftId', label: '班次', type: 'input', placeholder: '请输入班次ID（可选）' },
  { name: 'leader', label: '班组长', type: 'input', required: true },
  { name: 'headCount', label: '班组人数', type: 'number', required: true },
  {
    name: 'status',
    label: '状态',
    type: 'select',
    required: true,
    options: Object.entries(TEAM_STATUS_MAP).map(([key, value]) => ({
      label: value.label,
      value: key,
    })),
  },
  { name: 'remark', label: '备注', type: 'textArea' },
];

/**
 * TeamList组件
 * 使用新架构的完整班组列表页面
 * 保持与现有页面完全一致的样式和功能
 */
export const TeamList: React.FC = () => {
  const {
    teams,
    selectedIds,
    currentTeam,
    filters,
    pagination,
    loading,
    error,
    statistics,
    loadTeams,
    loadStatistics,
    createTeam,
    updateTeam,
    deleteTeams,
    updateStatus,
    setFilters,
    setSelectedIds,
    setCurrentTeam,
    setLoading,
    setError,
  } = useTeamStore();

  const { canCreate, canUpdate, canDelete } = usePermission('team');

  const [modalOpen, setModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  /**
   * 初始化加载数据
   */
  useEffect(() => {
    loadTeams();
    loadStatistics();
  }, []);

  /**
   * 搜索处理
   */
  const handleSearch = (values: any) => {
    setFilters(values);
    loadTeams();
  };

  /**
   * 重置处理
   */
  const handleReset = () => {
    setFilters({});
    loadTeams();
  };

  /**
   * 新增班组
   */
  const handleAdd = () => {
    setCurrentTeam({} as Team); // 空对象表示新增模式
    setModalOpen(true);
  };

  /**
   * 编辑班组
   */
  const handleEdit = (team: Team) => {
    setCurrentTeam(team);
    setModalOpen(true);
  };

  /**
   * 查看详情
   */
  const handleView = (team: Team) => {
    setCurrentTeam(team);
    setDetailOpen(true);
  };

  /**
   * 删除班组
   */
  const handleDelete = async (ids: string[]) => {
    try {
      await deleteTeams(ids);
      message.success(`成功删除 ${ids.length} 个班组`);
    } catch (error) {
      console.error('删除班组失败:', error);
    }
  };

  /**
   * 启用班组
   */
  const handleEnable = async () => {
    if (selectedIds.length === 0) {
      message.warning('请先选择班组');
      return;
    }

    Modal.confirm({
      title: '确认批量启用',
      content: `您确定要启用选中的 ${selectedIds.length} 个班组吗？`,
      okText: '确定启用',
      cancelText: '取消',
      centered: true,
      onOk: async () => {
        try {
          await updateStatus(selectedIds, 'ACTIVE');
          message.success(`成功启用 ${selectedIds.length} 个班组`);
          setSelectedIds([]);
        } catch (error) {
          console.error('启用班组失败:', error);
        }
      },
    });
  };

  /**
   * 禁用班组
   */
  const handleDisable = async () => {
    if (selectedIds.length === 0) {
      message.warning('请先选择班组');
      return;
    }

    Modal.confirm({
      title: '确认批量禁用',
      content: `您确定要禁用选中的 ${selectedIds.length} 个班组吗？禁用后这些班组将无法使用。`,
      okText: '确定禁用',
      okType: 'danger',
      cancelText: '取消',
      centered: true,
      onOk: async () => {
        try {
          await updateStatus(selectedIds, 'DISABLED');
          message.success(`成功禁用 ${selectedIds.length} 个班组`);
          setSelectedIds([]);
        } catch (error) {
          console.error('禁用班组失败:', error);
        }
      },
    });
  };

  /**
   * 刷新列表
   */
  const handleRefresh = () => {
    loadTeams();
    loadStatistics();
  };

  /**
   * 表单提交处理
   */
  const handleFormSubmit = async (values: any) => {
    setFormLoading(true);
    try {
      if (currentTeam && currentTeam.id) {
        // 编辑模式
        await updateTeam({ ...values, id: currentTeam.id });
        message.success('班组更新成功');
      } else {
        // 新增模式
        await createTeam(values);
        message.success('班组创建成功');
      }
      setModalOpen(false);
      await loadTeams();
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
    if (!currentTeam) return [];

    const statusConfig = TEAM_STATUS_MAP[currentTeam.status];

    return [
      { label: '班组名称', value: currentTeam.name },
      { label: '工作中心', value: currentTeam.workCenter },
      { label: '车间', value: currentTeam.workshop },
      { label: '工厂ID', value: currentTeam.factoryId },
      { label: '班次', value: currentTeam.shiftId || '—' },
      { label: '班组长', value: currentTeam.leader },
      { label: '班组人数', value: `${currentTeam.headCount} 人` },
      { label: '状态', value: statusConfig.label, type: 'tag' as const, options: [statusConfig] },
      { label: '创建时间', value: currentTeam.createdAt },
      { label: '更新时间', value: currentTeam.updatedAt },
      { label: '备注', value: currentTeam.remark || '—' },
    ];
  };

  /**
   * 表格列定义
   */
  const columns: ColumnsType<Team> = [
    {
      title: '班组名称',
      dataIndex: 'name',
      key: 'name',
      width: 150,
      fixed: 'left' as const,
    },
    {
      title: '工作中心',
      dataIndex: 'workCenter',
      key: 'workCenter',
      width: 150,
    },
    {
      title: '车间',
      dataIndex: 'workshop',
      key: 'workshop',
      width: 150,
    },
    {
      title: '班组长',
      dataIndex: 'leader',
      key: 'leader',
      width: 100,
    },
    {
      title: '班组人数',
      dataIndex: 'headCount',
      key: 'headCount',
      width: 100,
      align: 'center' as const,
      render: (count: number) => `${count} 人`,
    },
    {
      title: '班次',
      dataIndex: 'shiftId',
      key: 'shiftId',
      width: 100,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: TeamStatus) => (
        <StatusBadge status={status} statusMap={TEAM_STATUS_MAP} />
      ),
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      width: 200,
      ellipsis: true,
    },
    {
      title: '操作',
      key: 'action',
      width: 280,
      fixed: 'right' as const,
      render: (_: any, record: Team) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
          >
            查看
          </Button>
          {canUpdate('team') && (
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            >
              编辑
            </Button>
          )}
          {canDelete('team') && (
            <Popconfirm
              title="确认删除"
              description={`确定要删除班组「${record.name}」吗？`}
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
  ];

  return (
    <div className="team-page" style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
      {/* 统计卡片 */}
      {statistics && (
        <div style={{ background: '#fff', padding: '16px', borderBottom: '1px solid #e8ecf0' }}>
          <Row gutter={16}>
            <Col span={6}>
              <Statistic
                title="班组总数"
                value={statistics.totalCount}
                valueStyle={{ color: '#1677ff' }}
                prefix={<TeamOutlined style={{ fontSize: 20 }} />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="正常运行"
                value={statistics.activeCount}
                valueStyle={{ color: '#52c41a' }}
                prefix={<CheckCircleOutlined style={{ fontSize: 20, color: '#52c41a' }} />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="已停用"
                value={statistics.disabledCount}
                valueStyle={{ color: '#8c8c8c' }}
                prefix={<StopOutlined style={{ fontSize: 20, color: '#8c8c8c' }} />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="工作中心数"
                value={Object.keys(statistics.workCenterStats ?? {}).length}
                valueStyle={{ color: '#722ed1' }}
                prefix={<ApartmentOutlined style={{ fontSize: 20, color: '#722ed1' }} />}
              />
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
        title="班组档案"
        actions={[
          { key: 'add', label: '新增', icon: <PlusOutlined />, type: 'primary', onClick: handleAdd },
          { key: 'refresh', label: '刷新', icon: <ReloadOutlined />, onClick: handleRefresh },
        ]}
        selectedCount={selectedIds.length}
        batchActions={[
          { key: 'enable', label: '启用', onClick: handleEnable },
          { key: 'disable', label: '禁用', onClick: handleDisable, danger: true },
        ]}
      />

      {/* 数据表格 */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
        <DataTable
          data={teams}
          rowKey="id"
          columns={columns}
          loading={loading}
          pagination={pagination}
          paginationState={pagination}
          onPaginationChange={(page, pageSize) => {
            setFilters({ current: page, pageSize });
            loadTeams();
          }}
          rowSelection={{
            selectedRowKeys: selectedIds,
            onChange: (keys) => setSelectedIds(keys as string[]),
          }}
          scroll={{ x: 1400 }}
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
        title={currentTeam && currentTeam.id ? '编辑班组' : '新增班组'}
        mode={currentTeam && currentTeam.id ? 'edit' : 'create'}
        fields={TEAM_FORM_FIELDS}
        initialValues={currentTeam || {}}
        onSubmit={handleFormSubmit}
        onCancel={() => {
          setModalOpen(false);
          setCurrentTeam(null);
        }}
        loading={formLoading}
        width={800}
      />

      {/* 详情抽屉 */}
      <DetailDrawer
        visible={detailOpen}
        title="班组档案详情"
        data={currentTeam}
        fields={buildDetailFields()}
        onClose={() => setDetailOpen(false)}
        showActions={true}
        actions={[
          {
            key: 'edit',
            label: '编辑',
            icon: <EditOutlined />,
            onClick: () => {
              setDetailOpen(false);
              handleEdit(currentTeam!);
            },
            disabled: !canUpdate('team'),
          },
        ]}
        width={600}
      />
    </div>
  );
};

export default TeamList;

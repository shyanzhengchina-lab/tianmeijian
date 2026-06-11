/**
 * Employee List Component - Refactored
 * Main container component using composition of smaller sub-components
 * Reduced from 796 lines to ~150 lines
 */

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { DataTable } from '../../../../shared/components/DataTable';
import { ActionBar } from '../../../../shared/components/ActionBar';
import { DetailDrawer } from '../../../../shared/components/DetailDrawer';
import { FormModal } from '../../../../shared/components/FormModal';
import { useEmployeeStore } from '../store';
import { usePermission } from '../../../../shared/hooks/usePermission';
import type { FormField, DetailField } from '../../../../shared/types/common';
import type { Employee } from '../types';
import {
  PlusOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { message } from 'antd';

// Sub-components
import { EmployeeSearchAndFilter } from './EmployeeSearchAndFilter';
import { EmployeeStatistics } from './EmployeeStatistics';
import { getEmployeeColumns } from './EmployeeTableColumns';
import { EmployeeBatchActions } from './EmployeeBatchActions';

/**
 * Form fields configuration for employee creation/editing
 */
const EMPLOYEE_FORM_FIELDS: FormField[] = [
  { name: 'name', label: '姓名', type: 'input', required: true },
  { name: 'code', label: '工号', type: 'input', required: true },
  {
    name: 'role',
    label: '角色',
    type: 'select',
    required: true,
    options: [
      { label: '班组长', value: '班组长' },
      { label: '操作工', value: '操作工' },
      { label: 'QC', value: 'QC' },
      { label: '主管', value: '主管' },
    ],
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
    options: [
      { label: '机械操作', value: '机械操作' },
      { label: '焊接', value: '焊接' },
      { label: '装配', value: '装配' },
      { label: '检测', value: '检测' },
      { label: '包装', value: '包装' },
    ],
  },
  {
    name: 'certifications',
    label: '证书',
    type: 'select',
    mode: 'multiple',
    options: [
      { label: '特种作业证', value: '特种作业证' },
      { label: '安全员证', value: '安全员证' },
      { label: '质检员证', value: '质检员证' },
    ],
  },
  {
    name: 'status',
    label: '状态',
    type: 'select',
    required: true,
    options: [
      { label: '在职', value: 'ACTIVE' },
      { label: '请假', value: 'LEAVE' },
      { label: '离职', value: 'RESIGNED' },
    ],
  },
  { name: 'remark', label: '备注', type: 'textArea' },
];

/**
 * EmployeeList Component - Refactored
 */
export const EmployeeListRefactored: React.FC = () => {
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
    setFilters,
    setSelectedIds,
    setCurrentEmployee,
  } = useEmployeeStore();

  const { canCreate, canUpdate, canDelete, canManage } = usePermission('employee');

  const [modalOpen, setModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  // Initialize data
  useEffect(() => {
    loadEmployees();
    loadStatistics();
  }, []);

  // Event handlers
  const handleSearch = useCallback((values: any) => {
    setFilters(values);
    loadEmployees();
  }, [setFilters, loadEmployees]);

  const handleReset = useCallback(() => {
    setFilters({});
    loadEmployees();
  }, [setFilters, loadEmployees]);

  const handleAdd = useCallback(() => {
    setCurrentEmployee({} as Employee);
    setModalOpen(true);
  }, [setCurrentEmployee]);

  const handleEdit = useCallback((employee: Employee) => {
    setCurrentEmployee(employee);
    setModalOpen(true);
  }, [setCurrentEmployee]);

  const handleView = useCallback((employee: Employee) => {
    setCurrentEmployee(employee);
    setDetailOpen(true);
  }, [setCurrentEmployee]);

  const handleDelete = useCallback(async (ids: string[]) => {
    try {
      await deleteEmployees(ids);
      message.success(`成功删除 ${ids.length} 个员工`);
    } catch (error) {
      console.error('删除员工失败:', error);
    }
  }, [deleteEmployees]);

  const handleLeave = useCallback(async (employee: Employee) => {
    try {
      const leaveDate = new Date().toISOString().split('T')[0];
      await leaveEmployee(employee.id, leaveDate);
      message.success(`员工 ${employee.name} 已设置为请假状态`);
    } catch (error) {
      console.error('设置请假失败:', error);
    }
  }, [leaveEmployee]);

  const handleResign = useCallback(async (employee: Employee) => {
    try {
      const resignDate = new Date().toISOString().split('T')[0];
      await resignEmployee(employee.id, resignDate);
      message.success(`员工 ${employee.name} 已设置为离职状态`);
    } catch (error) {
      console.error('设置离职失败:', error);
    }
  }, [resignEmployee]);

  const handleActivate = useCallback(async (employee: Employee) => {
    try {
      await activateEmployee(employee.id);
      message.success(`员工 ${employee.name} 已恢复在岗状态`);
    } catch (error) {
      console.error('恢复员工失败:', error);
    }
  }, [activateEmployee]);

  const handleBatchActivate = useCallback(async () => {
    try {
      await updateStatus(selectedIds, 'ACTIVE');
      message.success(`成功恢复 ${selectedIds.length} 个员工`);
      setSelectedIds([]);
    } catch (error) {
      console.error('批量恢复失败:', error);
    }
  }, [selectedIds, updateStatus, setSelectedIds]);

  const handleBatchLeave = useCallback(async () => {
    try {
      await updateStatus(selectedIds, 'LEAVE');
      message.success(`成功将 ${selectedIds.length} 个员工设置为请假状态`);
      setSelectedIds([]);
    } catch (error) {
      console.error('批量请假失败:', error);
    }
  }, [selectedIds, updateStatus, setSelectedIds]);

  const handleBatchResign = useCallback(async () => {
    try {
      await updateStatus(selectedIds, 'RESIGNED');
      message.success(`成功将 ${selectedIds.length} 个员工设置为离职状态`);
      setSelectedIds([]);
    } catch (error) {
      console.error('批量离职失败:', error);
    }
  }, [selectedIds, updateStatus, setSelectedIds]);

  const handleBatchDelete = useCallback(async () => {
    try {
      await deleteEmployees(selectedIds);
      message.success(`成功删除 ${selectedIds.length} 个员工`);
      setSelectedIds([]);
    } catch (error) {
      console.error('批量删除失败:', error);
    }
  }, [selectedIds, deleteEmployees, setSelectedIds]);

  const handleRefresh = useCallback(() => {
    loadEmployees();
    loadStatistics();
  }, [loadEmployees, loadStatistics]);

  const handleFormSubmit = useCallback(async (values: any) => {
    setFormLoading(true);
    try {
      if (currentEmployee && currentEmployee.id) {
        await updateEmployee({ ...values, id: currentEmployee.id });
        message.success('员工更新成功');
      } else {
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
  }, [currentEmployee, updateEmployee, createEmployee, loadEmployees]);

  const buildDetailFields = useCallback((): DetailField[] => {
    if (!currentEmployee) return [];

    const roleConfig: Record<string, { label: string; color: string }> = {
      '班组长': { label: '班组长', color: '#d46b08' },
      '操作工': { label: '操作工', color: '#1677ff' },
      'QC': { label: 'QC', color: '#52c41a' },
      '主管': { label: '主管', color: '#722ed1' },
    };
    const roleInfo = roleConfig[currentEmployee.role] || { label: currentEmployee.role, color: 'default' };

    const statusConfig: Record<string, { label: string; color: string }> = {
      'ACTIVE': { label: '在职', color: '#52c41a' },
      'LEAVE': { label: '请假', color: '#faad14' },
      'RESIGNED': { label: '离职', color: '#f5222d' },
    };
    const statusInfo = statusConfig[currentEmployee.status] || { label: currentEmployee.status, color: 'default' };

    return [
      { label: '工号', value: currentEmployee.code },
      { label: '姓名', value: currentEmployee.name },
      { label: '角色', value: roleInfo.label, type: 'tag' as const, options: [{ label: roleInfo.label, value: currentEmployee.role, color: roleInfo.color }] },
      { label: '班组', value: currentEmployee.teamName || '—' },
      { label: '所属车间', value: currentEmployee.workshopCode || '—' },
      { label: '联系电话', value: currentEmployee.phone || '—' },
      { label: '身份证号', value: currentEmployee.idCard || '—' },
      { label: '入职日期', value: currentEmployee.entryDate || '—' },
      { label: '技能', value: currentEmployee.skills?.join(', ') || '—' },
      { label: '证书', value: currentEmployee.certifications?.join(', ') || '—' },
      { label: '状态', value: statusInfo.label, type: 'tag' as const, options: [{ label: statusInfo.label, value: currentEmployee.status, color: statusInfo.color }] },
      { label: '创建时间', value: currentEmployee.createdAt },
      { label: '更新时间', value: currentEmployee.updatedAt },
      { label: '备注', value: currentEmployee.remark || '—' },
    ];
  }, [currentEmployee]);

  // Memoized configurations
  const tableColumns = useMemo(() => {
    return getEmployeeColumns({
      canUpdate: canUpdate('employee'),
      canDelete: canDelete('employee'),
      canManage: canManage('employee'),
      onView: handleView,
      onUpdate: handleEdit,
      onDelete: handleDelete,
      onLeave: handleLeave,
      onResign: handleResign,
      onActivate: handleActivate,
    });
  }, [canUpdate, canDelete, canManage, handleView, handleEdit, handleDelete, handleLeave, handleResign, handleActivate]);

  return (
    <div className="employee-page" style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
      {/* Statistics */}
      {statistics && (
        <EmployeeStatistics
          totalCount={statistics.totalCount}
          activeCount={statistics.activeCount}
          leaveCount={statistics.leaveCount}
          resignedCount={statistics.resignedCount}
          roleStats={statistics.roleStats}
        />
      )}

      {/* Search and Filter */}
      <EmployeeSearchAndFilter
        onSearch={handleSearch}
        onReset={handleReset}
        loading={loading}
      />

      {/* Action Bar */}
      <ActionBar
        title="员工档案"
        actions={[
          { key: 'add', label: '新增', icon: <PlusOutlined />, type: 'primary', onClick: handleAdd },
          { key: 'refresh', label: '刷新', icon: <ReloadOutlined />, onClick: handleRefresh },
        ]}
        selectedCount={selectedIds.length}
        batchActions={EmployeeBatchActions({
          selectedCount: selectedIds.length,
          onBatchActivate: handleBatchActivate,
          onBatchLeave: handleBatchLeave,
          onBatchResign: handleBatchResign,
          onBatchDelete: handleBatchDelete,
        })}
      />

      {/* Data Table */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
        <DataTable
          data={employees}
          rowKey="id"
          columns={tableColumns}
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

      {/* Error Display */}
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

      {/* Create/Edit Modal */}
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

      {/* Detail Drawer */}
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

export default EmployeeListRefactored;
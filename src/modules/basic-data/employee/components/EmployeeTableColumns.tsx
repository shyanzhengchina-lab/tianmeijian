/**
 * Employee Table Columns Configuration
 * Defines table columns for employee list
 */

import { ColumnsType } from 'antd/es/table';
import { Space, Tag } from 'antd';
import { UserOutlined, TeamOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import type { Employee } from '../types';
import { StatusBadge } from '../../../../shared/components/StatusBadge';
import { EmployeeRowActions } from './EmployeeRowActions';

interface EmployeeColumnsProps {
  canUpdate: boolean;
  canDelete: boolean;
  canManage: boolean;
  onView: (employee: Employee) => void;
  onUpdate: (employee: Employee) => void;
  onDelete: (ids: string[]) => void;
  onLeave: (employee: Employee) => void;
  onResign: (employee: Employee) => void;
  onActivate: (employee: Employee) => void;
}

export const getEmployeeColumns = ({
  canUpdate,
  canDelete,
  canManage,
  onView,
  onUpdate,
  onDelete,
  onLeave,
  onResign,
  onActivate,
}: EmployeeColumnsProps): ColumnsType<Employee> => [
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
          <Tag color="#d46b08" style={{ fontWeight: 600 }}>
            ★
          </Tag>
        )}
      </Space>
    ),
  },
  {
    title: '角色',
    dataIndex: 'role',
    key: 'role',
    width: 100,
    render: (role: string) => {
      const roleConfig: Record<string, { label: string; color: string }> = {
        '班组长': { label: '班组长', color: '#d46b08' },
        '操作工': { label: '操作工', color: '#1677ff' },
        'QC': { label: 'QC', color: '#52c41a' },
        '主管': { label: '主管', color: '#722ed1' },
      };
      const config = roleConfig[role] || { label: role, color: 'default' };
      return (
        <Tag color={config.color} style={{ fontWeight: 600 }}>
          {config.label}
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
          {skills.slice(0, 2).map((skill) => (
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
          {certifications.slice(0, 2).map((cert) => (
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
    render: (status: string) => <StatusBadge status={status} statusMap={{}} />,
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
      <EmployeeRowActions
        employee={record}
        canUpdate={canUpdate}
        canDelete={canDelete}
        canManage={canManage}
        onView={onView}
        onUpdate={onUpdate}
        onDelete={onDelete}
        onLeave={onLeave}
        onResign={onResign}
        onActivate={onActivate}
      />
    ),
  },
];
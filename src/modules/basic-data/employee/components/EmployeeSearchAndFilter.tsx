/**
 * Employee Search and Filter Component
 * Handles search functionality and filtering for employee list
 */

import React, { useCallback } from 'react';
import { SearchForm } from '../../../../shared/components/SearchForm';
import type { FormField } from '../../../../shared/types/common';
import {
  EmployeeRole,
  EMPLOYEE_ROLE_MAP,
  EMPLOYEE_STATUS_MAP,
} from '../types';

/**
 * Search and filter fields configuration
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

interface EmployeeSearchAndFilterProps {
  onSearch: (values: any) => void;
  onReset: () => void;
  loading?: boolean;
}

export const EmployeeSearchAndFilter: React.FC<EmployeeSearchAndFilterProps> = ({
  onSearch,
  onReset,
  loading = false,
}) => {
  const handleSearch = useCallback(
    (values: any) => {
      onSearch(values);
    },
    [onSearch]
  );

  const handleReset = useCallback(() => {
    onReset();
  }, [onReset]);

  return (
    <div style={{ background: '#fff', padding: '16px', borderBottom: '1px solid #e8ecf0' }}>
      <SearchForm
        fields={SEARCH_FIELDS}
        onSearch={handleSearch}
        onReset={handleReset}
        loading={loading}
        layout="inline"
      />
    </div>
  );
};
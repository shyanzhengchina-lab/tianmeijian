/**
 * 员工管理 API
 */
import http from './http';

export interface EmployeeRecord {
  id?: number;
  employeeNo?: string;
  name?: string;
  gender?: string;
  department?: string;
  teamId?: number;
  teamName?: string;
  position?: string;
  phone?: string;
  email?: string;
  entryDate?: string;
  status?: number; // 1=在岗, 0=离职
  createTime?: string;
  updateTime?: string;
}

export interface PageResult<T> {
  list: T[];
  total: number;
  current: number;
  pageSize: number;
}

/** 分页查询员工 */
export const getEmployeePage = (current = 1, pageSize = 15): Promise<{ data: PageResult<EmployeeRecord> }> =>
  http.get(`/employees/page?current=${current}&pageSize=${pageSize}`, { silent: true });

/** 查询全部员工（不分页） */
export const getEmployeeList = (): Promise<{ data: EmployeeRecord[] }> =>
  http.get('/employees/list', { silent: true });

/** 根据 ID 查询员工 */
export const getEmployeeById = (id: number): Promise<{ data: EmployeeRecord }> =>
  http.get(`/employees/${id}`);

/** 新增员工 */
export const createEmployee = (data: EmployeeRecord): Promise<{ data: EmployeeRecord }> =>
  http.post('/employees', data);

/** 修改员工 */
export const updateEmployee = (id: number, data: EmployeeRecord): Promise<{ data: void }> =>
  http.put(`/employees/${id}`, data);

/** 删除员工 */
export const deleteEmployee = (id: number): Promise<{ data: void }> =>
  http.delete(`/employees/${id}`);

/** 批量删除员工 */
export const batchDeleteEmployees = (ids: number[]): Promise<{ data: void }> =>
  http.delete('/employees/batch', { data: ids });

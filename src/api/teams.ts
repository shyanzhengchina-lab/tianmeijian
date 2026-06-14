/**
 * 班组管理 API
 */
import http from './http';

export interface TeamRecord {
  id?: number;
  code?: string;
  name?: string;
  workshopId?: number;
  workshopName?: string;
  leaderName?: string;
  phone?: string;
  headcount?: number;
  description?: string;
  status?: number; // 1=启用, 0=停用
  createTime?: string;
  updateTime?: string;
}

export interface PageResult<T> {
  list: T[];
  total: number;
  current: number;
  pageSize: number;
}

/** 分页查询班组 */
export const getTeamPage = (current = 1, pageSize = 15): Promise<{ data: PageResult<TeamRecord> }> =>
  http.get(`/teams/page?current=${current}&pageSize=${pageSize}`, { silent: true });

/** 查询全部班组（不分页） */
export const getTeamList = (): Promise<{ data: TeamRecord[] }> =>
  http.get('/teams/list', { silent: true });

/** 根据 ID 查询班组 */
export const getTeamById = (id: number): Promise<{ data: TeamRecord }> =>
  http.get(`/teams/${id}`);

/** 新增班组 */
export const createTeam = (data: TeamRecord): Promise<{ data: TeamRecord }> =>
  http.post('/teams', data);

/** 修改班组 */
export const updateTeam = (id: number, data: TeamRecord): Promise<{ data: void }> =>
  http.put(`/teams/${id}`, data);

/** 删除班组 */
export const deleteTeam = (id: number): Promise<{ data: void }> =>
  http.delete(`/teams/${id}`);

/** 批量删除班组 */
export const batchDeleteTeams = (ids: number[]): Promise<{ data: void }> =>
  http.delete('/teams/batch', { data: ids });

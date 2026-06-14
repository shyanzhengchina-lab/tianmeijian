/**
 * 垫片发放管理 API
 */
import http from './http';

export interface PadIssuanceRecord {
  id?: number;
  issuanceNo?: string;
  padCode?: string;
  padName?: string;
  quantity?: number;
  recipientName?: string;
  recipientId?: string;
  workshopId?: number;
  workshopName?: string;
  issueDate?: string;
  status?: number; // 1=已发放, 0=待发放
  description?: string;
  createTime?: string;
  updateTime?: string;
}

export interface PageResult<T> {
  list: T[];
  total: number;
  current: number;
  pageSize: number;
}

/** 分页查询垫片发放 */
export const getPadIssuancePage = (current = 1, pageSize = 15): Promise<{ data: PageResult<PadIssuanceRecord> }> =>
  http.get(`/pad-issuances/page?current=${current}&pageSize=${pageSize}`, { silent: true });

/** 查询全部垫片发放（不分页） */
export const getPadIssuanceList = (): Promise<{ data: PadIssuanceRecord[] }> =>
  http.get('/pad-issuances/list', { silent: true });

/** 根据 ID 查询垫片发放 */
export const getPadIssuanceById = (id: number): Promise<{ data: PadIssuanceRecord }> =>
  http.get(`/pad-issuances/${id}`);

/** 新增垫片发放 */
export const createPadIssuance = (data: PadIssuanceRecord): Promise<{ data: PadIssuanceRecord }> =>
  http.post('/pad-issuances', data);

/** 修改垫片发放 */
export const updatePadIssuance = (id: number, data: PadIssuanceRecord): Promise<{ data: void }> =>
  http.put(`/pad-issuances/${id}`, data);

/** 删除垫片发放 */
export const deletePadIssuance = (id: number): Promise<{ data: void }> =>
  http.delete(`/pad-issuances/${id}`);

/** 批量删除垫片发放 */
export const batchDeletePadIssuances = (ids: number[]): Promise<{ data: void }> =>
  http.delete('/pad-issuances/batch', { data: ids });

import http from './http';

export interface FloatTicketRecord {
  id?: number;
  ticketNo?: string;
  productCode?: string;
  productName?: string;
  quantity?: number;
  status?: string;         // PENDING | PRINTED | ISSUED | IN_USE | RETURNED | ARCHIVED | LOST
  workOrderId?: number;
  workOrderNo?: string;
  workshopId?: number;
  workshopName?: string;
  operatorName?: string;
  remark?: string;
  createTime?: string;
  updateTime?: string;
}

export const getFloatTicketPage = (params?: {
  current?: number;
  pageSize?: number;
  ticketNo?: string;
  workOrderId?: number;
  status?: string;
}): Promise<any> => http.get('/float-tickets/page', { params, silent: true });

export const getFloatTicketList = (params?: {
  workOrderId?: number;
  status?: string;
}): Promise<any> => http.get('/float-tickets/list', { params, silent: true });

export const getFloatTicketById = (id: number): Promise<any> =>
  http.get(`/float-tickets/${id}`);

export const createFloatTicket = (data: FloatTicketRecord): Promise<any> =>
  http.post('/float-tickets', data);

export const batchCreateFloatTickets = (records: FloatTicketRecord[]): Promise<any> =>
  Promise.all(records.map(r => http.post('/float-tickets', r)));

export const updateFloatTicket = (id: number, data: FloatTicketRecord): Promise<any> =>
  http.put(`/float-tickets/${id}`, data);

export const deleteFloatTicket = (id: number): Promise<any> =>
  http.delete(`/float-tickets/${id}`);

export const batchDeleteFloatTickets = (ids: number[]): Promise<any> =>
  http.delete('/float-tickets/batch', { data: ids });

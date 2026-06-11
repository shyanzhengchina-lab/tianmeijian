/**
 * 领料单 API
 */
import http from './http';

export const getMaterialIssuanceList = (params?: { status?: string }) =>
  http.get('/material-issuances/list', { params });

export const getMaterialIssuancePage = (params?: { current?: number; pageSize?: number; status?: string }) =>
  http.get('/material-issuances/page', { params });

export const getMaterialIssuanceById = (id: number) =>
  http.get(`/material-issuances/${id}`);

export const getMaterialIssuanceDetails = (id: number) =>
  http.get(`/material-issuances/${id}/details`);

export const createMaterialIssuance = (data: any) =>
  http.post('/material-issuances', data);

export const updateMaterialIssuance = (id: number, data: any) =>
  http.put(`/material-issuances/${id}`, data);

export const updateMaterialIssuanceStatus = (id: number, body: Record<string, string>) =>
  http.put(`/material-issuances/${id}/status`, body);

export const deleteMaterialIssuance = (id: number) =>
  http.delete(`/material-issuances/${id}`);

export const getMaterialIssuanceDetailList = (issuanceId?: number) =>
  http.get('/material-issuance-details/list', { params: { issuanceId } });

export const createMaterialIssuanceDetail = (data: any) =>
  http.post('/material-issuance-details', data);

export const updateMaterialIssuanceDetail = (id: number, data: any) =>
  http.put(`/material-issuance-details/${id}`, data);

export const deleteMaterialIssuanceDetail = (id: number) =>
  http.delete(`/material-issuance-details/${id}`);

import axios from 'axios';
import { message } from 'antd';

const BASE_URL = process.env.REACT_APP_API_URL || '/api';

const request = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

// 请求拦截器
request.interceptors.request.use(config => {
  const token = localStorage.getItem('tmj_mes_token');
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  return config;
});

// 响应拦截器
request.interceptors.response.use(
  res => {
    if (res.data.code === 401) {
      localStorage.removeItem('tmj_mes_token');
      localStorage.removeItem('tmj_mes_user');
      window.location.href = '/login';
      return Promise.reject(new Error('登录已过期'));
    }
    return res.data;
  },
  err => {
    const msg = err.response?.data?.msg || err.message || '请求失败';
    message.error(msg);
    if (err.response?.status === 401) {
      localStorage.removeItem('tmj_mes_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default request;

// ===== API 模块 =====

// 认证
export const authApi = {
  login: (data) => request.post('/auth/login', data),
  userinfo: () => request.get('/auth/userinfo'),
};

// 系统管理
export const systemApi = {
  getUsers: (p) => request.get('/system/users', { params: p }),
  createUser: (d) => request.post('/system/users', d),
  updateUser: (id, d) => request.put(`/system/users/${id}`, d),
  deleteUser: (id) => request.delete(`/system/users/${id}`),
  resetPassword: (id, newPwd) => request.put(`/system/users/${id}/reset-password`, { new_password: newPwd }),
  getRoles: (p) => request.get('/system/roles', { params: p }),
  createRole: (d) => request.post('/system/roles', d),
  updateRole: (id, d) => request.put(`/system/roles/${id}`, d),
  deleteRole: (id) => request.delete(`/system/roles/${id}`),
  getFactories: () => request.get('/system/factories'),
  getAuditLogs: (p) => request.get('/system/audit-logs', { params: p }),
};

// 基础档案
export const baseApi = {
  // 基础档案 (non-paginated helpers for dropdowns)
  getMaterials: (p) => request.get('/base/materials', { params: p }),
  createMaterial: (d) => request.post('/base/materials', d),
  updateMaterial: (id, d) => request.put(`/base/materials/${id}`, d),
  deleteMaterial: (id) => request.delete(`/base/materials/${id}`),
  // 产品系列
  getProductSeries: () => request.get('/base/product-series'),
  createProductSeries: (d) => request.post('/base/product-series', d),
  // BOM
  getBoms: (p) => request.get('/base/boms', { params: p }),
  getBomById: (id) => request.get(`/base/boms/${id}`),
  getBomDetail: (id) => request.get(`/base/boms/${id}/details`),
  createBom: (d) => request.post('/base/boms', d),
  updateBom: (id, d) => request.put(`/base/boms/${id}`, d),
  deleteBom: (id) => request.delete(`/base/boms/${id}`),
  // 物料分类 (paginated)
  getMaterialCategories: (p) => request.get('/base/material-categories', { params: p }),
  // 单位 (paginated)
  getUnits: (p) => request.get('/base/units', { params: p }),
  // 工序
  getOperations: (p) => request.get('/base/operations', { params: p }),
  createOperation: (d) => request.post('/base/operations', d),
  // 工艺路线
  getRoutings: (p) => request.get('/base/process-routings', { params: p }),
  getRoutingById: (id) => request.get(`/base/process-routings/${id}`),
  getRoutingSteps: (id) => request.get(`/base/process-routings/${id}/steps`),
  createRouting: (d) => request.post('/base/process-routings', d),
  updateRouting: (id, d) => request.put(`/base/process-routings/${id}`, d),
  deleteRouting: (id) => request.delete(`/base/process-routings/${id}`),
  // 车间
  getWorkshops: (p) => request.get('/base/workshops', { params: p }),
  createWorkshop: (d) => request.post('/base/workshops', d),
  updateWorkshop: (id, d) => request.put(`/base/workshops/${id}`, d),
  deleteWorkshop: (id) => request.delete(`/base/workshops/${id}`),
  // 班组
  getTeams: (p) => request.get('/base/teams', { params: p }),
  createTeam: (d) => request.post('/base/teams', d),
  updateTeam: (id, d) => request.put(`/base/teams/${id}`, d),
  deleteTeam: (id) => request.delete(`/base/teams/${id}`),
  // 员工
  getEmployees: (p) => request.get('/base/employees', { params: p }),
  createEmployee: (d) => request.post('/base/employees', d),
  updateEmployee: (id, d) => request.put(`/base/employees/${id}`, d),
  deleteEmployee: (id) => request.delete(`/base/employees/${id}`),
  // 工作中心
  getWorkCenters: (p) => request.get('/base/work-centers', { params: p }),
  createWorkCenter: (d) => request.post('/base/work-centers', d),
};

// M01 计划管理
export const planApi = {
  getWorkOrders: (p) => request.get('/plan/work-orders', { params: p }),
  getWorkOrderById: (id) => request.get(`/plan/work-orders/${id}`),
  createWorkOrder: (d) => request.post('/plan/work-orders', d),
  updateWorkOrder: (id, d) => request.put(`/plan/work-orders/${id}`, d),
  updateWorkOrderStatus: (id, s) => request.put(`/plan/work-orders/${id}/status`, { status: s }),
  deleteWorkOrder: (id) => request.delete(`/plan/work-orders/${id}`),
};

// M02 生产执行
export const executionApi = {
  getTaskOrders: (p) => request.get('/execution/task-orders', { params: p }),
  assignTask: (id, d) => request.put(`/execution/task-orders/${id}/assign`, d),
  completeTask: (id) => request.put(`/execution/task-orders/${id}/complete`),
  submitReport: (d) => request.post('/execution/report', d),
  getReports: (p) => request.get('/execution/reports', { params: p }),
  getDeviations: (p) => request.get('/execution/deviations', { params: p }),
  createDeviation: (d) => request.post('/execution/deviations', d),
  closeDeviation: (id, d) => request.put(`/execution/deviations/${id}/close`, d),
};

// M03 质量管理
export const qualityApi = {
  getInspectionItems: (p) => request.get('/quality/inspection-items', { params: p }),
  createInspectionItem: (d) => request.post('/quality/inspection-items', d),
  getQcSchemes: (p) => request.get('/quality/qc-schemes', { params: p }),
  getQcSchemeById: (id) => request.get(`/quality/qc-schemes/${id}`),
  createQcScheme: (d) => request.post('/quality/qc-schemes', d),
  getInspections: (p) => request.get('/quality/inspections', { params: p }),
  getInspectionById: (id) => request.get(`/quality/inspections/${id}`),
  createInspection: (d) => request.post('/quality/inspections', d),
  submitResults: (id, d) => request.post(`/quality/inspections/${id}/results`, d),
  getNonconformances: (p) => request.get('/quality/nonconformances', { params: p }),
  createNc: (d) => request.post('/quality/nonconformances', d),
  disposeNc: (id, d) => request.put(`/quality/nonconformances/${id}/dispose`, d),
};

// M04 EBR
export const ebrApi = {
  getBatchRecords: (p) => request.get('/ebr/batch-records', { params: p }),
  getBatchRecordById: (id) => request.get(`/ebr/batch-records/${id}`),
  createBatchRecord: (d) => request.post('/ebr/batch-records', d),
  sign: (id, d) => request.put(`/ebr/batch-records/${id}/sign`, d),
  signBatchRecord: (id, d) => request.put(`/ebr/batch-records/${id}/sign`, d),
  archive: (id) => request.put(`/ebr/batch-records/${id}/archive`),
  archiveBatchRecord: (id) => request.put(`/ebr/batch-records/${id}/archive`),
  getStepRecords: (id) => request.get(`/ebr/batch-records/${id}/steps`),
  saveMaterialBalances: (d) => request.post('/ebr/material-balances', d),
};

// M05 仓储
export const warehouseApi = {
  getWarehouses: (p) => request.get('/warehouse/warehouses', { params: p }),
  createWarehouse: (d) => request.post('/warehouse/warehouses', d),
  getLots: (p) => request.get('/warehouse/lots', { params: p }),
  getLotById: (id) => request.get(`/warehouse/lots/${id}`),
  createLot: (d) => request.post('/warehouse/lots', d),
  updateLot: (id, d) => request.put(`/warehouse/lots/${id}`, d),
  deleteLot: (id) => request.delete(`/warehouse/lots/${id}`),
  updateLotStatus: (id, s) => request.put(`/warehouse/lots/${id}/status`, { status: s }),
  getIssuances: (p) => request.get('/warehouse/issuances', { params: p }),
  getIssuanceById: (id) => request.get(`/warehouse/issuances/${id}`),
  getIssuanceDetail: (id) => request.get(`/warehouse/issuances/${id}/details`),
  createIssuance: (d) => request.post('/warehouse/issuances', d),
  confirmIssuance: (id) => request.put(`/warehouse/issuances/${id}/confirm`),
  confirmIssuanceWithData: (id, d) => request.put(`/warehouse/issuances/${id}/confirm`, d),
  getInventoryLogs: (p) => request.get('/warehouse/inventory-logs', { params: p }),
  getInventorySummary: () => request.get('/warehouse/inventory-summary'),
};

// M06 设备管理
export const equipmentApi = {
  getEquipments: (p) => request.get('/equipment/list', { params: p }),
  getEquipmentById: (id) => request.get(`/equipment/${id}`),
  createEquipment: (d) => request.post('/equipment', d),
  updateEquipment: (id, d) => request.put(`/equipment/${id}`, d),
  deleteEquipment: (id) => request.delete(`/equipment/${id}`),
  updateStatus: (id, s) => request.put(`/equipment/${id}/status`, { eqStatus: s }),
  getOeeData: (p) => request.get('/equipment/oee', { params: p }),
  addOeeData: (d) => request.post('/equipment/oee', d),
  getMaintPlans: (p) => request.get('/equipment/maint-plans', { params: p }),
  createMaintPlan: (d) => request.post('/equipment/maint-plans', d),
  updateMaintPlan: (id, d) => request.put(`/equipment/maint-plans/${id}`, d),
  deleteMaintPlan: (id) => request.delete(`/equipment/maint-plans/${id}`),
  completeMaintPlan: (id, d) => request.put(`/equipment/maint-plans/${id}/complete`, d),
  getFaultRecords: (p) => request.get('/equipment/faults', { params: p }),
  createFaultRecord: (d) => request.post('/equipment/faults', d),
  updateFaultRecord: (id, d) => request.put(`/equipment/faults/${id}`, d),
  deleteFaultRecord: (id) => request.delete(`/equipment/faults/${id}`),
  resolveFaultRecord: (id, d) => request.put(`/equipment/faults/${id}/resolve`, d),
  getFaults: (p) => request.get('/equipment/faults', { params: p }),
  createFault: (d) => request.post('/equipment/faults', d),
  closeFault: (id, d) => request.put(`/equipment/faults/${id}/close`, d),
  getCalibrations: (id) => request.get(`/equipment/${id}/calibrations`),
  createCalibration: (d) => request.post('/equipment/calibrations', d),
};

// M07 追溯
export const traceApi = {
  forwardTrace: (lot_no) => request.get('/trace/forward', { params: { lot_no } }),
  backwardTrace: (lot_no) => request.get('/trace/backward', { params: { lot_no } }),
  queryBarcode: (barcode) => request.get('/trace/barcode', { params: { barcode } }),
  searchBarcode: (code) => request.get('/trace/barcode', { params: { code } }),
};

// M08 看板
export const dashboardApi = {
  getFactoryDashboard: (p) => request.get('/dashboard/factory', { params: p }),
  getWorkshopDashboard: (p) => request.get('/dashboard/workshop', { params: p }),
  getQualityDashboard: () => request.get('/dashboard/quality'),
  getCockpit: () => request.get('/dashboard/cockpit'),
};

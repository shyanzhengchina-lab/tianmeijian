import { organizationApi } from './organizationApi';
/**
 * 组织架构模块API导出
 */

export { organizationApi, OrganizationApiService } from './organizationApi';
export type {
  OrgTreeNode,
  OrgStatistics,
  OrgPath,
  EmployeeAssignment,
  PaginatedResponse,
} from './organizationApi';

export default organizationApi;

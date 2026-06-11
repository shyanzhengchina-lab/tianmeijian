// ===== 批生产浮票模块 - Mock 数据 =====

export type TicketStatus = 'CREATED' | 'PENDING' | 'RUNNING' | 'WAIT_INSPECT' | 'INSPECTING' | 'COMPLETED' | 'SCRAPPED';

export interface FloatTicket {
  id: string;
  ticketNo: string;             // 浮票编号
  batchNo: string;              // 生产批号
  productCode: string;          // 产品编码
  productName: string;          // 产品名称
  productSpec: string;          // 规格型号
  routingCode: string;          // 工艺路径编码
  routingName: string;          // 工艺路径名称
  planQty: number;              // 计划数量
  actualQty?: number;           // 实际数量
  scrapQty?: number;            // 报废数量
  status: TicketStatus;
  currentOperation?: string;    // 当前工序
  currentStation?: string;      // 当前工位
  startDate?: string;
  endDate?: string;
  createdAt: string;
  createdBy: string;
  steps: TicketStep[];          // 工序执行记录
  inspector?: string;           // 检验员
  inspectResult?: 'PASS' | 'FAIL' | 'PENDING';
  remark?: string;
}

export interface TicketStep {
  seq: number;
  operationCode: string;
  operationName: string;
  stationCode: string;
  stationName: string;
  status: 'PENDING' | 'RUNNING' | 'DONE' | 'SKIP';
  operator?: string;
  startTime?: string;
  endTime?: string;
  inputQty?: number;
  outputQty?: number;
  scrapQty?: number;
  checkResult?: string;
  stageRecords?: StageRecord[];
}

export interface StageRecord {
  stageName: string;
  stageCode: string;
  value?: string;
  operator: string;
  signTime: string;
  passed?: boolean;
}

// ── 状态配置 ─────────────────────────────────────────────────────────
export const TICKET_STATUS_MAP: Record<TicketStatus, { label: string; color: string; bgColor: string }> = {
  CREATED:      { label: '已创建',  color: '#8c8c8c', bgColor: 'rgba(140,140,140,0.15)' },
  PENDING:      { label: '待开工',  color: '#faad14', bgColor: 'rgba(250,173,20,0.15)' },
  RUNNING:      { label: '生产中',  color: '#52c41a', bgColor: 'rgba(82,196,26,0.15)' },
  WAIT_INSPECT: { label: '待检验',  color: '#1890ff', bgColor: 'rgba(24,144,255,0.15)' },
  INSPECTING:   { label: '检验中',  color: '#722ed1', bgColor: 'rgba(114,46,209,0.15)' },
  COMPLETED:    { label: '已完成',  color: '#13c2c2', bgColor: 'rgba(19,194,194,0.15)' },
  SCRAPPED:     { label: '已报废',  color: '#ff4d4f', bgColor: 'rgba(255,77,79,0.15)' },
};

// ── Mock 数据 ────────────────────────────────────────────────────────
export const mockTickets: FloatTicket[] = [];

export const ticketSummary = {
  total: mockTickets.length,
  running: mockTickets.filter(t => t.status === 'RUNNING').length,
  pending: mockTickets.filter(t => t.status === 'PENDING').length,
  waitInspect: mockTickets.filter(t => t.status === 'WAIT_INSPECT').length,
  completed: mockTickets.filter(t => t.status === 'COMPLETED').length,
  scrapped: mockTickets.filter(t => t.status === 'SCRAPPED').length,
};

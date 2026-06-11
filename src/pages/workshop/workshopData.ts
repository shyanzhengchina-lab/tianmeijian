// ================================================================
// 车间看板 Mock 数据 - 根管锉产线 16 工位
// 基于文档：批生产浮票 + 车间看板 PRD
// ================================================================

export type StationStatus = 'RUNNING' | 'WAIT_TRANSFER' | 'WAIT_INSPECT' | 'IDLE' | 'BLOCKED';

export interface StationCard {
  id: string;
  stationCode: string;
  stationName: string;
  deviceCode: string;
  status: StationStatus;
  batchNo?: string;
  productModel?: string;
  planQty?: number;
  finishQty?: number;
  currentStage?: string;
  operator?: string;
  // WAIT_TRANSFER
  waitTransferQty?: number;
  finishTime?: string;
  nextStation?: string;
  stayMinutes?: number;
  // WAIT_INSPECT
  reportQty?: number;
  reportTime?: string;
  inspectTicketNo?: string;
  // IDLE
  lastBatchNo?: string;
  maintainCountdown?: string;
  // BLOCKED
  anomalyDesc?: string;
  anomalyTicketNo?: string;
  reportPerson?: string;
  anomalyTime?: string;
}

export interface WorkshopSummary {
  totalStations: number;
  running: number;
  waitTransfer: number;
  waitInspect: number;
  idle: number;
  blocked: number;
  todayOutput: number;
  todayTarget: number;
  efficiency: number;
}

// 16个工位数据（根管锉产线）
export const mockStations: StationCard[] = [
  // P1-机加报工
  {
    id: 'S01', stationCode: 'OP-10-CUT', stationName: '切断', deviceCode: 'CM-01',
    status: 'RUNNING',
    batchNo: 'RKQ-20260425-001', productModel: '25mm/04',
    planQty: 5000, finishQty: 3200, currentStage: '数据采集', operator: '张三',
  },
  {
    id: 'S02', stationCode: 'OP-20-WASH1', stationName: '清洗一', deviceCode: 'XC-02',
    status: 'WAIT_TRANSFER',
    batchNo: 'RKQ-20260425-001', productModel: '25mm/04',
    waitTransferQty: 3200, finishTime: '14:02',
    nextStation: '研磨一', stayMinutes: 30,
  },
  // P2-研磨报工
  {
    id: 'S03', stationCode: 'OP-30-GRIND1', stationName: '研磨一', deviceCode: 'YM-01',
    status: 'WAIT_INSPECT',
    batchNo: 'RKQ-20260425-001', productModel: '25mm/04',
    reportQty: 1500, reportTime: '14:15',
    inspectTicketNo: 'JY-RKQ-001',
  },
  // P3-热处理报工
  {
    id: 'S04', stationCode: 'OP-40-HEAT', stationName: '热处理', deviceCode: 'RL-05',
    status: 'IDLE',
    lastBatchNo: 'RKQ-20260424-003', maintainCountdown: '12小时',
  },
  {
    id: 'S05', stationCode: 'OP-45-WASH2', stationName: '清洗二', deviceCode: 'XC-03',
    status: 'RUNNING',
    batchNo: 'RKQ-20260424-003', productModel: '21mm/06',
    planQty: 3000, finishQty: 2800, currentStage: '自检', operator: '赵六',
  },
  // P4-精加工报工
  {
    id: 'S06', stationCode: 'OP-50-LINE', stationName: '刻线', deviceCode: 'KX-01',
    status: 'BLOCKED',
    batchNo: 'RKQ-20260425-002', productModel: '31mm/04',
    anomalyDesc: '断丝率>5%（标准<2%）', anomalyTicketNo: 'NCR-20260425-004',
    reportPerson: '王五', anomalyTime: '14:28',
  },
  {
    id: 'S07', stationCode: 'OP-55-ASM', stationName: '组装', deviceCode: 'ZZ-02',
    status: 'RUNNING',
    batchNo: 'RKQ-20260425-001', productModel: '25mm/04',
    planQty: 5000, finishQty: 1200, currentStage: '首件确认', operator: '刘七',
  },
  {
    id: 'S08', stationCode: 'OP-60-RING', stationName: '环规适配', deviceCode: 'HG-01',
    status: 'WAIT_INSPECT',
    batchNo: 'RKQ-20260424-002', productModel: '21mm/06',
    reportQty: 2900, reportTime: '13:55',
    inspectTicketNo: 'JY-RKQ-002',
  },
  {
    id: 'S09', stationCode: 'OP-65-MEAS', stationName: '测量长度', deviceCode: 'CL-01',
    status: 'RUNNING',
    batchNo: 'RKQ-20260425-001', productModel: '25mm/04',
    planQty: 5000, finishQty: 4100, currentStage: '报工', operator: '孙八',
  },
  {
    id: 'S10', stationCode: 'OP-70-LIMIT', stationName: '装限位块', deviceCode: 'LW-02',
    status: 'RUNNING',
    batchNo: 'RKQ-20260424-001', productModel: '25mm/04',
    planQty: 4800, finishQty: 4800, currentStage: '后清场', operator: '周九',
  },
  // P5-入库报工
  {
    id: 'S11', stationCode: 'OP-90-INSPECT', stationName: '检测合格', deviceCode: 'QC-01',
    status: 'WAIT_INSPECT',
    batchNo: 'RKQ-20260424-001', productModel: '25mm/04',
    reportQty: 4795, reportTime: '13:30',
    inspectTicketNo: 'JY-RKQ-003',
  },
  {
    id: 'S12', stationCode: 'OP-95-STORE', stationName: '半成品入库', deviceCode: 'RK-01',
    status: 'IDLE',
    lastBatchNo: 'RKQ-20260423-005', maintainCountdown: '待入库',
  },
  // 其他工位
  {
    id: 'S13', stationCode: 'OP-15-MARK', stationName: '尾部修整', deviceCode: 'XZ-04',
    status: 'WAIT_TRANSFER',
    batchNo: 'RKQ-20260425-002', productModel: '31mm/04',
    waitTransferQty: 2100, finishTime: '14:20',
    nextStation: '清洗一', stayMinutes: 12,
  },
  {
    id: 'S14', stationCode: 'OP-25-GRIND2', stationName: '研磨二', deviceCode: 'YM-02',
    status: 'RUNNING',
    batchNo: 'RKQ-20260425-003', productModel: '25mm/06',
    planQty: 4000, finishQty: 800, currentStage: '进站', operator: '吴十',
  },
  {
    id: 'S15', stationCode: 'OP-35-PACK', stationName: '包装', deviceCode: 'BZ-01',
    status: 'IDLE',
    lastBatchNo: 'RKQ-20260424-004', maintainCountdown: '8小时',
  },
  {
    id: 'S16', stationCode: 'OP-80-LABEL', stationName: 'UDI赋码', deviceCode: 'UD-01',
    status: 'RUNNING',
    batchNo: 'RKQ-20260424-001', productModel: '25mm/04',
    planQty: 4795, finishQty: 2400, currentStage: '数据采集', operator: '郑一',
  },
];

export const workshopSummary: WorkshopSummary = {
  totalStations: 16,
  running: 7,
  waitTransfer: 2,
  waitInspect: 3,
  idle: 3,
  blocked: 1,
  todayOutput: 12580,
  todayTarget: 20000,
  efficiency: 78.5,
};

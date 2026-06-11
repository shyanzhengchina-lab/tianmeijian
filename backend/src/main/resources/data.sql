-- Minimal seed data for H2 demo
-- Users are already seeded in schema.sql via INSERT IGNORE
-- This file intentionally left minimal to avoid conflicts

-- Insert admin user if not exists (H2 compatible)
MERGE INTO sys_user (employee_id, username, password, role, status, deleted)
KEY (employee_id)
VALUES ('admin', 'admin', 'admin123', 'ADMIN', 1, 0);

MERGE INTO sys_user (employee_id, username, password, role, status, deleted)
KEY (employee_id)
VALUES ('op001', 'operator', 'op123456', 'OPERATOR', 1, 0);

MERGE INTO sys_user (employee_id, username, password, role, status, deleted)
KEY (employee_id)
VALUES ('qc001', 'qcuser', 'qc123456', 'QUALITY', 1, 0);

-- ================================================
-- PROD 模块种子数据
-- ================================================

-- 生产订单
INSERT IGNORE INTO production_order (id, order_no, order_type, customer_name, customer_code, delivery_date, priority, status, total_quantity, completed_quantity, create_by, remark) VALUES
(1, 'MO-20260101-001', 'STANDARD', '华南医疗器械有限公司', 'C001', '2026-02-15', 2, 'IN_PROGRESS', 50000, 18000, 'admin', '春季备货订单'),
(2, 'MO-20260105-002', 'STANDARD', '北京口腔医院集采', 'C002', '2026-02-28', 3, 'RELEASED',    30000, 0,     'admin', '集采框架订单'),
(3, 'MO-20260108-003', 'STANDARD', '上海医疗供应链', 'C003', '2026-03-10', 2, 'DRAFT',       20000, 0,     'admin', '待审批'),
(4, 'MO-20251220-004', 'STANDARD', '广东齿科耗材', 'C004',    '2026-01-20', 4, 'COMPLETED',   10000, 10000, 'admin', '年末紧急订单，已完成'),
(5, 'MO-20260110-005', 'STANDARD', '成都口腔医院', 'C005',     '2026-04-01', 1, 'DRAFT',       15000, 0,     'admin', '');

-- 生产工单
INSERT IGNORE INTO work_order (id, work_order_no, order_id, order_no, material_id, material_code, material_name, spec, plan_quantity, completed_quantity, qualified_quantity, unit_id, unit_name, status, progress, start_date, end_date, create_by, remark) VALUES
(1,  'WO-20260101-001', 1, 'MO-20260101-001', 4, 'FG001', '医用手套 S号', 'S码/灭菌', 5000, 5000, 4980, 12, '个', 'COMPLETED',  100.00, '2026-01-05', '2026-01-10', 'admin', '第1批'),
(2,  'WO-20260101-002', 1, 'MO-20260101-001', 4, 'FG001', '医用手套 S号', 'S码/灭菌', 5000, 4800, 4780, 12, '个', 'IN_PROGRESS', 96.00, '2026-01-10', '2026-01-18', 'admin', '第2批'),
(3,  'WO-20260101-003', 1, 'MO-20260101-001', 5, 'FG002', '医用手套 M号', 'M码/灭菌', 5000, 3200, 3180, 12, '个', 'IN_PROGRESS', 64.00, '2026-01-12', '2026-01-20', 'admin', '第3批'),
(4,  'WO-20260101-004', 1, 'MO-20260101-001', 5, 'FG002', '医用手套 M号', 'M码/灭菌', 5000, 5000, 4990, 12, '个', 'COMPLETED',  100.00, '2026-01-05', '2026-01-11', 'admin', '第4批'),
(5,  'WO-20260105-001', 2, 'MO-20260105-002', 4, 'FG001', '医用手套 S号', 'S码/灭菌', 5000, 0,    0,    12, '个', 'RELEASED',     0.00, '2026-01-20', '2026-01-28', 'admin', '已下达待启动'),
(6,  'WO-20260105-002', 2, 'MO-20260105-002', 5, 'FG002', '医用手套 M号', 'M码/灭菌', 5000, 0,    0,    12, '个', 'RELEASED',     0.00, '2026-01-22', '2026-01-30', 'admin', '已下达待启动'),
(7,  'WO-20260105-003', 2, 'MO-20260105-002', 6, 'FG003', '医用手套 L号', 'L码/灭菌', 5000, 0,    0,    12, '个', 'DRAFT',        0.00, '2026-01-25', '2026-02-05', 'admin', '草稿'),
(8,  'WO-20251220-001', 4, 'MO-20251220-004', 4, 'FG001', '医用手套 S号', 'S码/灭菌', 5000, 5000, 4980, 12, '个', 'COMPLETED',  100.00, '2025-12-22', '2025-12-28', 'admin', '年末紧急订单第1批'),
(9,  'WO-20251220-002', 4, 'MO-20251220-004', 5, 'FG002', '医用手套 M号', 'M码/灭菌', 5000, 5000, 4980, 12, '个', 'COMPLETED',  100.00, '2025-12-22', '2025-12-29', 'admin', '年末紧急订单第2批'),
(10, 'WO-20260101-005', 1, 'MO-20260101-001', 6, 'FG003', '医用手套 L号', 'L码/灭菌', 5000, 0,    0,    12, '个', 'DRAFT',        0.00, '2026-01-25', '2026-02-02', 'admin', '待排产');

-- 生产任务单
INSERT IGNORE INTO task_order (id, task_no, work_order_id, work_order_no, material_id, material_code, material_name, plan_quantity, completed_quantity, qualified_quantity, unit_id, unit_name, work_center_name, assigned_to_name, status, progress, equip_id, equip_code, create_by, remark) VALUES
(1,  'TO-20260101-001', 1, 'WO-20260101-001', 4, 'FG001', '医用手套 S号', 1000, 1000, 998,  12, '个', '浸胶车间A线', '张三', 'COMPLETED', 100.00, NULL, '', 'admin', '浸胶工序'),
(2,  'TO-20260101-002', 1, 'WO-20260101-001', 4, 'FG001', '医用手套 S号', 1000, 1000, 996,  12, '个', '硫化车间',    '李四', 'COMPLETED', 100.00, NULL, '', 'admin', '硫化工序'),
(3,  'TO-20260101-003', 1, 'WO-20260101-001', 4, 'FG001', '医用手套 S号', 1000, 1000, 1000, 12, '个', '脱模车间',    '王五', 'COMPLETED', 100.00, NULL, '', 'admin', '脱模工序'),
(4,  'TO-20260101-004', 1, 'WO-20260101-001', 4, 'FG001', '医用手套 S号', 1000, 1000, 995,  12, '个', '检验室',      '赵六', 'COMPLETED', 100.00, NULL, '', 'admin', 'QC检验'),
(5,  'TO-20260101-005', 1, 'WO-20260101-001', 4, 'FG001', '医用手套 S号', 1000, 1000, 991,  12, '个', '包装车间',    '孙七', 'COMPLETED', 100.00, NULL, '', 'admin', '包装入库'),
(6,  'TO-20260102-001', 2, 'WO-20260101-002', 4, 'FG001', '医用手套 S号', 1000, 1000, 998,  12, '个', '浸胶车间A线', '张三', 'COMPLETED', 100.00, NULL, '', 'admin', '浸胶工序'),
(7,  'TO-20260102-002', 2, 'WO-20260101-002', 4, 'FG001', '医用手套 S号', 1000, 980,  972,  12, '个', '硫化车间',    '李四', 'IN_PROGRESS', 98.00, NULL, '', 'admin', '进行中'),
(8,  'TO-20260102-003', 2, 'WO-20260101-002', 4, 'FG001', '医用手套 S号', 1000, 0,    0,    12, '个', '脱模车间',    '',     'PENDING',   0.00,  NULL, '', 'admin', '待分配'),
(9,  'TO-20260103-001', 3, 'WO-20260101-003', 5, 'FG002', '医用手套 M号', 1000, 1000, 997,  12, '个', '浸胶车间B线', '王五', 'COMPLETED', 100.00, NULL, '', 'admin', '浸胶完成'),
(10, 'TO-20260103-002', 3, 'WO-20260101-003', 5, 'FG002', '医用手套 M号', 1000, 800,  795,  12, '个', '硫化车间',    '赵六', 'IN_PROGRESS', 80.00, NULL, '', 'admin', '硫化进行中'),
(11, 'TO-20260103-003', 3, 'WO-20260101-003', 5, 'FG002', '医用手套 M号', 1000, 0,    0,    12, '个', '脱模车间',    '',     'PENDING',   0.00,  NULL, '', 'admin', '待上工序完成'),
(12, 'TO-20260105-001', 5, 'WO-20260105-001', 4, 'FG001', '医用手套 S号', 1000, 0,    0,    12, '个', '浸胶车间A线', '',     'PENDING',   0.00,  NULL, '', 'admin', '已下达未开始');

-- 根管锉专用任务单（关联设备ID，支持甘特图直接绑定）
INSERT IGNORE INTO task_order (id, task_no, work_order_id, work_order_no, material_id, material_code, material_name, plan_quantity, completed_quantity, qualified_quantity, unit_id, unit_name, work_center_name, assigned_to_name, status, progress, equip_id, equip_code, start_time, end_time, create_by, remark) VALUES
(13, 'TK-20260430-001', 1, 'WO-20260430-001', 4, 'FG-RKQ-2504', '机用根管锉25号', 500, 500, 498, 13, '支', '机加工-磨削区', '张操作', 'IN_PROGRESS', 60.00, 11, 'EQ-GRIND-01', '2026-04-30 08:00:00', '2026-04-30 14:00:00', 'admin', '数控磨削任务-数控磨削机1号'),
(14, 'TK-20260430-002', 1, 'WO-20260430-001', 4, 'FG-RKQ-2504', '机用根管锉25号', 500, 0,   0,   13, '支', '机加工-磨削区', '王操作', 'IN_PROGRESS', 0.00,  11, 'EQ-GRIND-01', '2026-04-30 12:00:00', '2026-04-30 18:00:00', 'admin', '数控磨削任务2-数控磨削机1号（冲突测试）'),
(15, 'TK-20260430-003', 2, 'WO-20260430-002', 4, 'FG-RKQ-2504', '机用根管锉25号', 300, 300, 298, 13, '支', '机加工-磨削区', '李操作', 'IN_PROGRESS', 100.00,12, 'EQ-GRIND-02', '2026-04-30 08:00:00', '2026-04-30 12:00:00', 'admin', '数控磨削任务-数控磨削机2号'),
(16, 'TK-20260430-004', 2, 'WO-20260430-002', 5, 'FG-RKQ-3006', '机用根管锉30号', 300, 0,   0,   13, '支', '热处理车间',    '张操作', 'IN_PROGRESS', 0.00,  14, 'EQ-HT-01',    '2026-04-30 08:00:00', '2026-04-30 12:00:00', 'admin', '热处理任务-热处理炉1号（冲突测试）'),
(17, 'TK-20260430-005', 3, 'WO-20260430-003', 5, 'FG-RKQ-3006', '机用根管锉30号', 400, 0,   0,   13, '支', '热处理车间',    '王操作', 'IN_PROGRESS', 0.00,  14, 'EQ-HT-01',    '2026-04-30 10:00:00', '2026-04-30 16:00:00', 'admin', '热处理任务2-热处理炉1号（冲突测试）');

-- ================================================
-- P12: 根管锉生产线数据
-- ================================================

-- 根管锉车间 (mes_workshop)
INSERT IGNORE INTO mes_workshop (id, code, name, type, manager_name, phone, address, description, status) VALUES
(4, 'WS-RKQ-001', '机加工车间',        '生产车间', '赵志远', '0532-66002001', '青岛市即墨区工业园区4号楼', '负责根管锉机加工工序：数控磨削、螺纹滚压、切断等精密加工', 1),
(5, 'WS-RKQ-002', '热处理/涂层车间',   '生产车间', '刘建国', '0532-66002002', '青岛市即墨区工业园区5号楼', '负责根管锉热处理定型（记忆合金相变激活）和PVD涂层工序', 1),
(6, 'WS-RKQ-003', '包装/检验车间',     '生产车间', '王晓红', '0532-66002003', '青岛市即墨区工业园区6号楼', '负责根管锉成品检验、超声清洗、EO灭菌、无菌包装及UDI打码', 1);

-- 根管锉工作中心 (mes_work_center)
INSERT IGNORE INTO mes_work_center (id, code, name, workshop_id, workshop_name, type, capacity, description, status) VALUES
(7,  'WC-RKQ-GRIND',  '机加工-磨削区',   4, '机加工车间',      '生产', 4, '数控磨削机组，负责根管锉锥度/直径精密磨削，关键工序', 1),
(8,  'WC-RKQ-THREAD', '机加工-螺纹区',   4, '机加工车间',      '生产', 2, '螺纹滚压机，负责根管锉螺旋槽加工', 1),
(9,  'WC-RKQ-CUT',    '机加工-切断区',   4, '机加工车间',      '生产', 2, '切断机，负责根管锉原材料截断', 1),
(10, 'WC-RKQ-HT',     '热处理车间',      5, '热处理/涂层车间', '生产', 3, '热处理炉，记忆合金NiTi相变激活处理，关键工序', 1),
(11, 'WC-RKQ-COAT',   '涂层车间',        5, '热处理/涂层车间', '生产', 2, 'PVD镀膜机，TiN/TiCN 0.5μm涂层处理', 1),
(12, 'WC-RKQ-CLEAN',  '清洗车间',        6, '包装/检验车间',   '生产', 3, '超声波清洗机，三段超声波清洗工序', 1),
(13, 'WC-RKQ-PACK',   '包装车间',        6, '包装/检验车间',   '生产', 4, '无菌包装线，含UDI打码机和吸塑热封设备', 1);

-- 根管锉设备 (mes_equipment) — id=11-20，对应 workOrderData.ts EQUIPMENTS EQ001-EQ010
INSERT IGNORE INTO mes_equipment (id, code, name, model, brand, work_center_id, work_center_name, serial_no, purchase_date, warranty_date, status, description) VALUES
(11, 'EQ-GRIND-01',  '数控磨削机1号', 'CNC-5000',    '科德数控', 7,  '机加工-磨削区', 'SN-GRIND-001', '2024-03-01', '2027-03-01', 'NORMAL',   '五轴数控磨削机，用于根管锉锥度精密磨削，精度±0.001mm'),
(12, 'EQ-GRIND-02',  '数控磨削机2号', 'CNC-5000',    '科德数控', 7,  '机加工-磨削区', 'SN-GRIND-002', '2024-03-01', '2027-03-01', 'NORMAL',   '五轴数控磨削机2号，与1号互为备份'),
(13, 'EQ-THREAD-01', '螺纹滚压机1号', 'RT-200',      '国产',     8,  '机加工-螺纹区', 'SN-THREAD-001','2023-06-01', '2026-06-01', 'NORMAL',   '精密螺纹滚压机，用于根管锉螺旋槽加工'),
(14, 'EQ-HT-01',     '热处理炉1号',   'HT-NTi-500',  '进口',     10, '热处理车间',    'SN-HT-001',    '2022-09-01', '2025-09-01', 'NORMAL',   'NiTi记忆合金热处理炉，精度±0.5℃，每炉独立批次号'),
(15, 'EQ-HT-02',     '热处理炉2号',   'HT-NTi-500',  '进口',     10, '热处理车间',    'SN-HT-002',    '2022-09-01', '2025-09-01', 'MAINTAIN', '计划性维护中，预计5天恢复'),
(16, 'EQ-PVD-01',    'PVD镀膜机1号',  'PVD-300C',    '德国进口', 11, '涂层车间',      'SN-PVD-001',   '2023-11-01', '2026-11-01', 'NORMAL',   'TiN/TiCN磁控溅射镀膜机，0.5μm精密涂层'),
(17, 'EQ-INJ-01',    '注塑机1号',     'HM-160',      '海天',     13, '包装车间',      'SN-INJ-001',   '2023-03-01', '2026-03-01', 'NORMAL',   '根管锉手柄注塑设备，160T锁模力'),
(18, 'EQ-CLEAN-01',  '超声波清洗机',  'USC-3000',    '洁盟',     12, '清洗车间',      'SN-CLEAN-001', '2023-07-01', '2026-07-01', 'NORMAL',   '三槽超声波清洗机，频率28/40kHz双频'),
(19, 'EQ-UDI-01',    'UDI打码机1号',  'LS-20W',      '创鑫激光', 13, '包装车间',      'SN-UDI-001',   '2024-01-01', '2027-01-01', 'NORMAL',   'UDI合规激光打标机，20W脉冲光纤激光器'),
(20, 'EQ-CUT-01',    '切断机1号',     'CP-100',      '国产',     9,  '机加工-切断区', 'SN-CUT-001',   '2023-04-01', '2026-04-01', 'NORMAL',   '精密切断机，用于根管锉原材料截断成型');

-- ================================================
-- P12: 根管锉物料分类树（material_category，id=12-36）
-- 对应 src/store/mockData.ts mockCategories
-- ================================================

-- 根节点（根管锉业务根，挂在 id=1 全部下）
INSERT IGNORE INTO material_category (id, parent_id, code, name, sort_no, status) VALUES
-- L2: 6个顶级分类（parent_id=1 即全部根节点）
(12, 1, '01',   '01 原材料',   10, 1),
(13, 1, '02',   '02 半成品',   20, 1),
(14, 1, '03',   '03 成品',     30, 1),
(15, 1, '04',   '04 包装材料', 40, 1),
(16, 1, '05',   '05 辅料耗材', 50, 1),
(17, 1, '06',   '06 模具工装', 60, 1),
-- L3: 01 原材料子类（parent_id=12）
(21, 12, '0101', '镍钛丝材',   1, 1),
(22, 12, '0102', '不锈钢材料', 2, 1),
(23, 12, '0103', '高分子材料', 3, 1),
(24, 12, '0104', '辅助化学品', 4, 1),
-- L3: 02 半成品子类（parent_id=13）
(31, 13, '0201', '机加工件',   1, 1),
(32, 13, '0202', '热处理件',   2, 1),
(33, 13, '0203', '涂层件',     3, 1),
(34, 13, '0204', '注塑件',     4, 1),
-- L3: 03 成品子类（parent_id=14）
(41, 14, '0301', '机用根管锉',   1, 1),
(42, 14, '0302', '手用根管锉',   2, 1),
(43, 14, '0303', '热牙胶充填针', 3, 1),
-- L3: 04 包装材料子类（parent_id=15）
(51, 15, '0401', '内包装', 1, 1),
(52, 15, '0402', '外包装', 2, 1),
(53, 15, '0403', '标签标识', 3, 1),
-- L3: 05 辅料耗材子类（parent_id=16）
(61, 16, '0501', '清洗耗材', 1, 1),
(62, 16, '0502', '检验耗材', 2, 1),
(63, 16, '0503', '润滑防锈', 3, 1),
-- L3: 06 模具工装子类（parent_id=17）
(71, 17, '0601', '螺纹滚压模', 1, 1),
(72, 17, '0602', '注塑模具',   2, 1),
(73, 17, '0603', '夹具工装',   3, 1);

-- 生产流转票 (L4)
INSERT IGNORE INTO mes_float_ticket (id, ticket_no, product_code, product_name, quantity, status, work_order_id, work_order_no, workshop_name, operator_name, remark) VALUES
(1,  'FT-20260101-001', 'FG001', '医用手套 S号', 1000, 'IN_USE',   1, 'WO-20260101-001', '浸胶车间A线', '张三', '第1批浸胶'),
(2,  'FT-20260101-002', 'FG001', '医用手套 S号', 1000, 'IN_USE',   1, 'WO-20260101-001', '硫化车间',    '李四', '第1批硫化'),
(3,  'FT-20260101-003', 'FG001', '医用手套 S号', 1000, 'RETURNED', 1, 'WO-20260101-001', '脱模车间',    '王五', '第1批脱模已完工'),
(4,  'FT-20260102-001', 'FG001', '医用手套 S号', 1000, 'ISSUED',   2, 'WO-20260101-002', '浸胶车间A线', '张三', '第2批浸胶'),
(5,  'FT-20260102-002', 'FG001', '医用手套 S号', 1000, 'PRINTED',  2, 'WO-20260101-002', '硫化车间',    '',     '待领用'),
(6,  'FT-20260103-001', 'FG002', '医用手套 M号', 1000, 'IN_USE',   3, 'WO-20260101-003', '浸胶车间B线', '王五', 'M号第1批'),
(7,  'FT-20260103-002', 'FG002', '医用手套 M号', 1000, 'ISSUED',   3, 'WO-20260101-003', '硫化车间',    '赵六', 'M号硫化'),
(8,  'FT-20260105-001', 'FG001', '医用手套 S号', 1000, 'PRINTED',  5, 'WO-20260105-001', '浸胶车间A线', '',     '待开工');

-- 电子批记录 (EBR)
INSERT IGNORE INTO ebr_record (id, batch_no, product_id, product_code, product_name, bom_id, bom_version, plan_quantity, unit_name, status, operator_name, completed_quantity, qualified_quantity, rejected_quantity, qualified_rate, create_by, remark) VALUES
(1, 'WO-20260101-001', 1, 'FG001', '医用手套 S号', 1, 'V1.0', 5000, '个', 'COMPLETED',   '张三', 5000, 4980, 20, 99.60, 'admin', '第1批全部工序已完成'),
(2, 'WO-20260101-002', 1, 'FG001', '医用手套 S号', 1, 'V1.0', 5000, '个', 'IN_PROGRESS', '张三', 2000, 1996,  4, 99.80, 'admin', '第2批浸胶/硫化已完成'),
(3, 'WO-20260101-003', 2, 'FG002', '医用手套 M号', 1, 'V1.0', 5000, '个', 'IN_PROGRESS', '王五', 1800, 1795,  5, 99.72, 'admin', 'M号第1批进行中'),
(4, 'WO-20251220-001', 1, 'FG001', '医用手套 S号', 1, 'V1.0', 5000, '个', 'APPROVED',    '李四', 5000, 4980, 20, 99.60, 'admin', '年末紧急批次已放行'),
(5, 'WO-20251220-002', 2, 'FG002', '医用手套 M号', 1, 'V1.0', 5000, '个', 'REVIEWED',    '王五', 5000, 4978, 22, 99.56, 'admin', '待QA最终签批');

-- ============================================================
-- P6 Seed Data: BOM / Routing / Quality
-- ============================================================

-- BOM 主表 (material_id NOT NULL → use 1/4/5)
INSERT IGNORE INTO bom (id, code, version, bom_type, status, material_id, material_code, material_name, quantity, unit_name, org_manage, org_use, remark, create_by) VALUES
(1, 'BOM-FG001-V1', '1.00', '主BOM', 'APPROVED', 4, 'FG001', '医用手套 S号', 1.0000, '个', '生产部', '成品仓', '标准主BOM，S号手套', 'admin'),
(2, 'BOM-FG002-V1', '1.00', '主BOM', 'APPROVED', 5, 'FG002', '医用手套 M号', 1.0000, '个', '生产部', '成品仓', 'M号手套主BOM', 'admin'),
(3, 'BOM-FG001-V2', '2.00', '主BOM', 'DRAFT',    4, 'FG001', '医用手套 S号', 1.0000, '个', '研发部', '成品仓', 'V2版本升级中', 'admin');

-- BOM 明细表 (bom_id NOT NULL, material_id NOT NULL) — schema cols: id,bom_id,line_no,material_id,material_code,material_name,spec,quantity,unit_name,remark
INSERT IGNORE INTO bom_detail (id, bom_id, line_no, material_id, material_code, material_name, spec, quantity, unit_name, remark) VALUES
(1,  1, 10, 1, 'RM001', '天然乳胶',     '医用级',    120.0000, 'g',  '主要原料'),
(2,  1, 20, 2, 'RM002', '硫磺粉',       '工业级',      3.5000, 'g',  '硫化剂'),
(3,  1, 30, 3, 'RM003', '氧化锌',       'ACS级',       2.0000, 'g',  '活化剂'),
(4,  1, 40, 1, 'RM001', '天然乳胶',     '医用级',      5.0000, 'g',  '涂层用'),
(5,  2, 10, 1, 'RM001', '天然乳胶',     '医用级',    130.0000, 'g',  'M号主料'),
(6,  2, 20, 2, 'RM002', '硫磺粉',       '工业级',      4.0000, 'g',  'M号硫化剂'),
(7,  2, 30, 3, 'RM003', '氧化锌',       'ACS级',       2.5000, 'g',  'M号活化剂'),
(8,  3, 10, 1, 'RM001', '天然乳胶',     '医用级V2',  125.0000, 'g',  'V2升级原料'),
(9,  3, 20, 2, 'RM002', '硫磺粉',       '工业级',      3.8000, 'g',  'V2配方'),
(10, 3, 30, 3, 'RM003', '氧化锌',       'ACS级',       2.2000, 'g',  'V2活化剂');

-- 工艺路径 (routing_code NOT NULL, product_model NOT NULL, version NOT NULL)
INSERT IGNORE INTO process_routing (id, routing_code, routing_name, product_model, product_code, product_name, version, is_default, status, description, create_by) VALUES
(1, 'RT-GLOVE-S-V1', '医用手套S号标准工艺路径', 'GLOVE-S', 'FG001', '医用手套 S号', 'V1.0', 1, 'ACTIVE', 'S号手套全流程工艺路径，含8个工序', 'admin'),
(2, 'RT-GLOVE-M-V1', '医用手套M号标准工艺路径', 'GLOVE-M', 'FG002', '医用手套 M号', 'V1.0', 1, 'ACTIVE', 'M号手套全流程工艺路径', 'admin');

-- 路径步骤 (routing_id NOT NULL, step_no NOT NULL)
INSERT IGNORE INTO routing_step (id, routing_id, step_no, step_name, step_code, report_point, step_type, description, create_by) VALUES
(1,  1, 10, '配料',     'ST-010', 1, 'NORMAL',      '乳胶配方称量配制', 'admin'),
(2,  1, 20, '浸胶',     'ST-020', 1, 'KEY',         '手模浸胶，3次浸浸工艺', 'admin'),
(3,  1, 30, '预硫化',   'ST-030', 1, 'NORMAL',      '55℃×20min预硫化', 'admin'),
(4,  1, 40, '硫化',     'ST-040', 1, 'KEY',         '125℃×45min主硫化', 'admin'),
(5,  1, 50, '脱模',     'ST-050', 1, 'NORMAL',      '湿法翻转脱模', 'admin'),
(6,  1, 60, '洗涤',     'ST-060', 1, 'NORMAL',      '去离子水漂洗3道', 'admin'),
(7,  1, 70, 'QC检验',   'ST-070', 1, 'QC',          '全检AQL 0.65', 'admin'),
(8,  1, 80, '包装入库', 'ST-080', 1, 'NORMAL',      '无菌内包装，灭菌后入成品仓', 'admin'),
(9,  2, 10, '配料',     'ST-010', 1, 'NORMAL',      'M号乳胶配方', 'admin'),
(10, 2, 20, '浸胶',     'ST-020', 1, 'KEY',         'M号浸胶工序', 'admin'),
(11, 2, 30, '硫化',     'ST-040', 1, 'KEY',         'M号硫化', 'admin'),
(12, 2, 40, '脱模',     'ST-050', 1, 'NORMAL',      'M号脱模', 'admin'),
(13, 2, 50, 'QC检验',   'ST-070', 1, 'QC',          'M号检验', 'admin'),
(14, 2, 60, '包装入库', 'ST-080', 1, 'NORMAL',      'M号包装', 'admin');

-- 工序 (routing_step_id NOT NULL, operation_code NOT NULL, operation_name NOT NULL)
INSERT IGNORE INTO operation (id, routing_step_id, operation_code, operation_name, seq_in_step, work_center_name, is_key_operation, standard_time, inspection_trigger, remark) VALUES
(1,  2, 'OP-DIPPING-1',   '第一次浸胶',   1, '浸胶工作站A', 1, 15.00, '',       '第1次浸胶，覆盖率≥95%'),
(2,  2, 'OP-DIPPING-2',   '第二次浸胶',   2, '浸胶工作站A', 0, 10.00, '',       '补强层浸胶'),
(3,  4, 'OP-CURE-MAIN',   '主硫化',       1, '硫化炉1号',   1, 45.00, 'AFTER',  '温度125℃，压力0.3MPa'),
(4,  7, 'OP-QC-VISUAL',   '外观检验',     1, '检验室',      1, 20.00, 'BEFORE', 'AQL 0.65全检'),
(5,  7, 'OP-QC-PHYSICAL', '物理性能检验', 2, '检验室',      1, 30.00, 'BEFORE', '拉伸强度/断裂伸长率'),
(6,  8, 'OP-PKG-INNER',   '内包装',       1, '包装线1',     0, 10.00, '',       '无菌单只包装'),
(7, 10, 'OP-DIPPING-M1',  'M号第一次浸胶',1, '浸胶工作站B', 1, 18.00, '',       'M号主浸胶'),
(8, 11, 'OP-CURE-M',      'M号硫化',      1, '硫化炉2号',   1, 45.00, 'AFTER',  'M号硫化工序');

-- 质检任务 (task_no NOT NULL, task_type NOT NULL, status NOT NULL DEFAULT PENDING)
INSERT IGNORE INTO inspection_task (id, task_no, task_type, source_type, source_no, material_id, material_code, material_name, batch_no, quantity, unit, sample_quantity, inspector_name, status, result, total_items, pass_items, fail_items, remark, create_by) VALUES
(1, 'QC-IQC-20260101-001', 'IQC',          'PO',       'PO-2026-001', 1, 'RM001', '天然乳胶',     '20260101-A', 500.0000,  'kg', 25.0000, '检验员王芳', 'COMPLETED', 'PASS',   8, 8, 0, '来料检验全部合格，符合医用标准', 'admin'),
(2, 'QC-IQC-20260102-001', 'IQC',          'PO',       'PO-2026-002', 2, 'RM002', '硫磺粉',       '20260102-A', 200.0000,  'kg', 10.0000, '检验员王芳', 'COMPLETED', 'PASS',   5, 5, 0, '硫磺纯度99.5%合格', 'admin'),
(3, 'QC-FQC-20260103-001', 'FQC',          'WO',       'WO-20260101-001', 4, 'FG001', '医用手套 S号', '20260101-B', 5000.0000, '个', 125.0000, '检验员赵明', 'COMPLETED', 'PASS',  10, 10, 0, '成品检验全部合格，AQL 0.65通过', 'admin'),
(4, 'QC-IPQC-20260104-001','IPQC_PATROL',  'WO',       'WO-20260101-002', 4, 'FG001', '医用手套 S号', '20260102-A', 1000.0000, '个', 25.0000,  '检验员赵明', 'DOING',     '',      10,  8, 2, '巡检发现2件外观缺陷，已隔离', 'admin'),
(5, 'QC-OQC-20260105-001', 'OQC',          'DELIVERY', 'DEL-2026-001', 4, 'FG001', '医用手套 S号', '20260101-B', 4980.0000, '个', 125.0000, '检验员李华', 'PENDING',   '',       0,  0, 0, '出货前最终检验，待开始', 'admin');

-- MRB记录 (mrb_no NOT NULL, status NOT NULL DEFAULT PENDING)
INSERT IGNORE INTO mrb_record (id, mrb_no, task_id, material_id, material_code, material_name, batch_no, quantity, unit, failure_type, failure_desc, reporter_name, report_time, status, disposition, disposition_desc, remark, create_by) VALUES
(1, 'MRB-20260104-001', 4, 4, 'FG001', '医用手套 S号', '20260102-A', 2.0000, '个', '外观缺陷', '表面有气泡，不符合外观标准QS-001第3.2条', '检验员赵明', '2026-01-04 14:30:00', 'PENDING',   '',        '',           '待MRB评审决议', 'admin'),
(2, 'MRB-20260103-001', 3, 4, 'FG001', '医用手套 S号', '20260101-B', 20.0000,'个', '物理性能', '5件拉伸强度略低于标准下限，属于边界值', '检验员赵明', '2026-01-03 16:00:00', 'CLOSED',    'REWORK',  '返工加固后重新检验，全部合格', '已关闭，批次放行', 'admin'),
(3, 'MRB-20260102-001', 1, 1, 'RM001', '天然乳胶',     '20260101-A', 50.0000,'kg', '供应商质量', '1箱乳胶颜色异常，疑似混批', '检验员王芳', '2026-01-02 10:00:00', 'CLOSED',    'RETURN',  '退货处理，供应商提供纠正措施', '已退货，CAR已提交', 'admin');

-- 质量放行 (release_no NOT NULL, release_type NOT NULL, batch_no NOT NULL, status NOT NULL DEFAULT PENDING)
INSERT IGNORE INTO quality_release (id, release_no, release_type, task_id, material_id, material_code, material_name, batch_no, quantity, unit, status, applicant_name, apply_time, approver_name, approve_time, approve_remark, remark, create_by) VALUES
(1, 'REL-20260103-001', 'FINISHED',      3, 4, 'FG001', '医用手套 S号', '20260101-B', 4980.0000, '个', 'RELEASED', '质检员赵明', '2026-01-03 17:00:00', 'QA主管陈玲', '2026-01-03 18:30:00', 'FQC全项合格，予以放行', '首批S号手套已放行入成品仓', 'admin'),
(2, 'REL-20260101-001', 'MATERIAL',      1, 1, 'RM001', '天然乳胶',     '20260101-A', 450.0000,  'kg', 'RELEASED', '质检员王芳', '2026-01-01 15:00:00', 'QA主管陈玲', '2026-01-01 16:00:00', 'IQC合格，准入生产', '天然乳胶批次放行', 'admin'),
(3, 'REL-20260105-001', 'FINISHED',      5, 4, 'FG001', '医用手套 S号', '20260105-C', 4980.0000, '个', 'PENDING',  '质检员李华', '2026-01-05 09:00:00', '',           NULL,                  '', '待OQC检验完成后放行', 'admin');

-- ================================================
-- P7: 基础档案种子数据
-- ================================================

-- 车间 (mes_workshop)
INSERT IGNORE INTO mes_workshop (id, code, name, type, manager_name, phone, address, description, status) VALUES
(1, 'WS-001', '乳胶手套生产车间', '生产车间', '陈志远', '021-66001001', '上海市嘉定区工业园区1号楼', '承担医用手套主体生产工序', 1),
(2, 'WS-002', '质量检验车间',     '检验车间', '刘秀英', '021-66001002', '上海市嘉定区工业园区2号楼', '负责IQC/IPQC/FQC/OQC全流程检验', 1),
(3, 'WS-003', '仓储物流车间',     '仓储车间', '杨大勇', '021-66001003', '上海市嘉定区工业园区3号楼', '原料仓、成品仓及WIP暂存区', 1);

-- 班组 (mes_team)
INSERT IGNORE INTO mes_team (id, code, name, workshop_id, workshop_name, leader_name, phone, headcount, description, status) VALUES
(1, 'TM-001', '配料组',   1, '乳胶手套生产车间', '王建军', '13800000001', 8,  '负责乳胶配方称量配制', 1),
(2, 'TM-002', '浸胶组',   1, '乳胶手套生产车间', '张丽华', '13800000002', 12, '手模浸胶工序', 1),
(3, 'TM-003', '硫化组',   1, '乳胶手套生产车间', '李国强', '13800000003', 6,  '预硫化和主硫化工序', 1),
(4, 'TM-004', '包装组',   1, '乳胶手套生产车间', '赵晓梅', '13800000004', 10, '脱模洗涤和包装入库', 1),
(5, 'TM-005', '质检一班', 2, '质量检验车间',     '王芳',   '13800000005', 5,  'IQC来料检验班', 1),
(6, 'TM-006', '质检二班', 2, '质量检验车间',     '赵明',   '13800000006', 4,  'IPQC和FQC检验班', 1);

-- 工作中心 (mes_work_center)
INSERT IGNORE INTO mes_work_center (id, code, name, workshop_id, workshop_name, type, capacity, description, status) VALUES
(1, 'WC-COMPOUND', '配料中心',   1, '乳胶手套生产车间', '生产',   4, '乳胶配方称量与混合设备', 1),
(2, 'WC-DIPPING',  '浸胶中心',   1, '乳胶手套生产车间', '生产',   8, '手模浸胶生产线', 1),
(3, 'WC-CURE',     '硫化中心',   1, '乳胶手套生产车间', '生产',   3, '硫化炉组', 1),
(4, 'WC-PACK',     '包装中心',   1, '乳胶手套生产车间', '生产',   6, '包装生产线', 1),
(5, 'WC-QC',       '质检中心',   2, '质量检验车间',     '检验',   5, '质量检验工作台', 1),
(6, 'WC-WAREHOUSE','仓储中心',   3, '仓储物流车间',     '仓储',  20, '原料仓和成品仓', 1);

-- 设备 (mes_equipment)
INSERT IGNORE INTO mes_equipment (id, code, name, model, brand, work_center_id, work_center_name, serial_no, purchase_date, warranty_date, status, description) VALUES
(1,  'EQ-MIXER-001',  '乳胶搅拌机',     'LX-500',    '国产',     1, '配料中心',   'SN-MIXER-001',  '2023-01-15', '2026-01-15', 'NORMAL',   '500L乳胶配方搅拌设备'),
(2,  'EQ-MIXER-002',  '硫化剂搅拌机',   'LX-200',    '国产',     1, '配料中心',   'SN-MIXER-002',  '2023-01-15', '2026-01-15', 'NORMAL',   '200L辅料搅拌设备'),
(3,  'EQ-DIP-LINE-1', '浸胶生产线A',    'DL-2000',   '进口',     2, '浸胶中心',   'SN-DIP-001',    '2022-06-01', '2025-06-01', 'NORMAL',   'S号手套浸胶线，产能2000双/h'),
(4,  'EQ-DIP-LINE-2', '浸胶生产线B',    'DL-2000',   '进口',     2, '浸胶中心',   'SN-DIP-002',    '2022-08-01', '2025-08-01', 'NORMAL',   'M号手套浸胶线，产能2000双/h'),
(5,  'EQ-CURE-01',    '硫化炉1号',      'KCF-1200',  '进口',     3, '硫化中心',   'SN-CURE-001',   '2021-03-01', '2024-03-01', 'NORMAL',   '125℃/0.3MPa主硫化炉'),
(6,  'EQ-CURE-02',    '硫化炉2号',      'KCF-1200',  '进口',     3, '硫化中心',   'SN-CURE-002',   '2021-05-01', '2024-05-01', 'MAINTAIN', '计划性维护中，预计3天恢复'),
(7,  'EQ-PACK-01',    '包装机1号',      'PK-500',    '国产',     4, '包装中心',   'SN-PACK-001',   '2023-09-01', '2026-09-01', 'NORMAL',   '单片包装机'),
(8,  'EQ-PACK-02',    '包装机2号',      'PK-500',    '国产',     4, '包装中心',   'SN-PACK-002',   '2023-09-01', '2026-09-01', 'NORMAL',   '单片包装机'),
(9,  'EQ-QC-MEASURE', '拉力测试仪',     'UTM-100',   '进口',     5, '质检中心',   'SN-QC-001',     '2022-11-01', '2025-11-01', 'NORMAL',   '医用手套拉伸强度测试'),
(10, 'EQ-QC-VISUAL',  '自动外观检测仪', 'AOI-V300',  '进口',     5, '质检中心',   'SN-QC-002',     '2024-01-01', '2027-01-01', 'NORMAL',   '全自动外观检测，AQL 0.65');

-- 员工 (mes_employee)
INSERT IGNORE INTO mes_employee (id, employee_no, name, gender, department, team_id, team_name, position, phone, email, entry_date, status) VALUES
(1,  'E001', '王建军', '男', '生产部', 1, '配料组',   '班组长', '13800100001', 'wjj@example.com', '2020-03-15', 1),
(2,  'E002', '李小花', '女', '生产部', 1, '配料组',   '操作工', '13800100002', '',                '2021-06-01', 1),
(3,  'E003', '刘强',   '男', '生产部', 1, '配料组',   '操作工', '13800100003', '',                '2022-02-01', 1),
(4,  'E004', '张丽华', '女', '生产部', 2, '浸胶组',   '班组长', '13800100004', 'zlh@example.com', '2019-08-01', 1),
(5,  'E005', '陈伟',   '男', '生产部', 2, '浸胶组',   '操作工', '13800100005', '',                '2021-03-01', 1),
(6,  'E006', '黄秀英', '女', '生产部', 2, '浸胶组',   '操作工', '13800100006', '',                '2021-05-01', 1),
(7,  'E007', '赵志明', '男', '生产部', 2, '浸胶组',   '操作工', '13800100007', '',                '2022-07-01', 1),
(8,  'E008', '李国强', '男', '生产部', 3, '硫化组',   '班组长', '13800100008', 'lgq@example.com', '2018-12-01', 1),
(9,  'E009', '孙玲',   '女', '生产部', 3, '硫化组',   '操作工', '13800100009', '',                '2020-09-01', 1),
(10, 'E010', '赵晓梅', '女', '生产部', 4, '包装组',   '班组长', '13800100010', 'zxm@example.com', '2020-01-15', 1),
(11, 'E011', '钱大志', '男', '生产部', 4, '包装组',   '操作工', '13800100011', '',                '2021-11-01', 1),
(12, 'E012', '王芳',   '女', '质量部', 5, '质检一班', 'QC',     '13800100012', 'wf@example.com',  '2019-04-01', 1),
(13, 'E013', '刘海燕', '女', '质量部', 5, '质检一班', 'QC',     '13800100013', '',                '2021-08-01', 1),
(14, 'E014', '赵明',   '男', '质量部', 6, '质检二班', 'QC',     '13800100014', 'zm@example.com',  '2020-06-01', 1),
(15, 'E015', '李华',   '男', '质量部', 6, '质检二班', 'QC',     '13800100015', '',                '2022-03-01', 1);

-- ================================================
-- P7: 领料单种子数据
-- ================================================

-- 领料单主表 (material_issuance)
INSERT IGNORE INTO material_issuance (id, issuance_no, issuance_type, work_center_id, work_center_name, requester_name, request_time, status, approval_status, approver_name, approval_time, approval_comment, issuer_name, issue_time, receiver_name, receive_time, remark, create_by) VALUES
(1, 'MI-20260103-001', 'PRODUCTION', 1, '配料中心', '王建军', '2026-01-03 08:00:00', 'COMPLETED', 'APPROVED', 'QA主管陈玲', '2026-01-03 08:30:00', '同意领料，按配方配制', '仓管员张华', '2026-01-03 09:00:00', '王建军', '2026-01-03 09:15:00', '第1批次S号手套配料领料单', 'admin'),
(2, 'MI-20260103-002', 'PRODUCTION', 2, '浸胶中心', '张丽华', '2026-01-03 10:00:00', 'PICKED',    'APPROVED', 'QA主管陈玲', '2026-01-03 10:20:00', '同意领料',             '仓管员张华', '2026-01-03 11:00:00', '',       NULL,                  '第1批次M号手套浸胶领料单', 'admin'),
(3, 'MI-20260104-001', 'PRODUCTION', 3, '硫化中心', '李国强', '2026-01-04 07:00:00', 'PENDING',   'PENDING',  '',           NULL,                  '',                    '',           NULL,          '',       NULL,                  '第2批次S号手套硫化领料单，待审批', 'admin'),
(4, 'MI-20260104-002', 'PRODUCTION', 4, '包装中心', '赵晓梅', '2026-01-04 14:00:00', 'PICKING',   'APPROVED', '生产主任陈志远', '2026-01-04 14:20:00', '同意',            '仓管员李明', '2026-01-04 15:00:00', '',       NULL,                  '第1批次S号包装材料领料单', 'admin');

-- 领料单明细表 (material_issuance_detail) - request_quantity NOT NULL
INSERT IGNORE INTO material_issuance_detail (id, issuance_id, line_no, material_id, material_code, material_name, spec, unit_name, request_quantity, approval_quantity, issued_quantity, batch_no, warehouse_name, remark) VALUES
(1,  1, 10, 1, 'RM001', '天然乳胶',   '医用级',   'kg',  120.0000, 120.0000, 120.0000, '20260101-A', '原料仓A区', '主要原料'),
(2,  1, 20, 2, 'RM002', '硫磺粉',     '工业级',   'kg',    3.5000,   3.5000,   3.5000, '20260102-A', '原料仓B区', '硫化剂'),
(3,  1, 30, 3, 'RM003', '氧化锌',     'ACS级',    'kg',    2.0000,   2.0000,   2.0000, '20260103-A', '原料仓B区', '活化剂'),
(4,  2, 10, 1, 'RM001', '天然乳胶',   '医用级',   'kg',  130.0000, 130.0000, 130.0000, '20260101-A', '原料仓A区', 'M号主料'),
(5,  2, 20, 2, 'RM002', '硫磺粉',     '工业级',   'kg',    4.0000,   4.0000,   4.0000, '20260102-A', '原料仓B区', 'M号硫化剂'),
(6,  3, 10, 1, 'RM001', '天然乳胶',   '医用级',   'kg',  120.0000,  0.0000,   0.0000, '',           '原料仓A区', '待审批'),
(7,  3, 20, 2, 'RM002', '硫磺粉',     '工业级',   'kg',    3.5000,  0.0000,   0.0000, '',           '原料仓B区', '待审批'),
(8,  4, 10, 4, 'PK001', '无菌包装袋', 'PP材质',   '片', 5000.0000, 5000.0000, 2500.0000,'20260104-A', '包材仓',   '单只包装袋'),
(9,  4, 20, 5, 'PK002', '纸盒',       '100支装',  '个',   50.0000,  50.0000,  20.0000, '20260104-B', '包材仓',   '产品纸盒');

-- ========== P8: inspection_item 种子数据（质检项目档案）==========
INSERT IGNORE INTO inspection_item (id, code, name, category, method, standard, unit, min_value, max_value, is_key_item, status) VALUES
(1,  'QCI-SZ-001', '原材直径',         'SIZE',     '千分尺',   '0.300±0.005',  'mm',   0.295, 0.305, 1, 1),
(2,  'QCI-SZ-002', '外径D1',           'SIZE',     '千分尺',   '0.250±0.005',  'mm',   0.245, 0.255, 1, 1),
(3,  'QCI-SZ-003', '外径D2',           'SIZE',     '千分尺',   '0.200±0.005',  'mm',   0.195, 0.205, 1, 1),
(4,  'QCI-SZ-004', '锉针总长度',       'SIZE',     '游标卡尺', '21±0.5',       'mm',  20.500,21.500, 1, 1),
(5,  'QCI-WT-001', '单支重量',         'WEIGHT',   '分析天平', '0.050±0.005',   'g',   0.045, 0.055, 0, 1),
(6,  'QCI-HB-001', '硬度值',           'HARDNESS', '洛氏硬度仪','HRC 64±2',    'HRC',  62.0,  66.0,  1, 1),
(7,  'QCI-FS-001', '弯曲角度',         'FUNCTION', '弯曲测试仪','45度不断裂',  '°',     null,  null,  1, 1),
(8,  'QCI-FS-002', '扭转圈数',         'FUNCTION', '扭力测试仪','≥360°不断裂', '圈',    null,  null,  1, 1),
(9,  'QCI-AP-001', '表面粗糙度',       'APPEAR',   '粗糙度仪', 'Ra≤0.4',       'μm',   null,  0.400, 0, 1),
(10, 'QCI-AP-002', '外观目视检',       'APPEAR',   '目视',     '无裂纹/毛刺',  null,   null,  null,  0, 1),
(11, 'QCI-BIO-001','无菌检测',         'BIOLOGY',  '微生物实验','SAL≤10^-6',   null,   null,  null,  1, 1),
(12, 'QCI-BIO-002','热原检测',         'BIOLOGY',  'LAL试验',  '合格',         null,   null,  null,  1, 1),
(13, 'QCI-LB-001', '标签内容',         'LABEL',    '目视',     '符合YY规范',   null,   null,  null,  0, 1),
(14, 'QCI-PK-001', '包装密封性',       'PACKAGE',  '泡泡法',   '无泄漏',       null,   null,  null,  1, 1),
(15, 'QCI-PK-002', '包装标识完整性',   'PACKAGE',  '目视',     '批号/效期清晰',null,   null,  null,  0, 1);

-- ========== P9: pad_task 种子数据 ==========
INSERT IGNORE INTO pad_task (id, task_no, task_name, product_id, product_code, product_name, bom_id, bom_version, plan_quantity, unit_name, routing_id, operation_id, operation_code, operation_name, work_center_id, work_center_name, status, priority, planned_start_time, planned_end_time, completed_quantity, qualified_quantity, rejected_quantity, progress) VALUES
(1, 'PT-20260103-001', '混炼胶制备-批次A', 1, 'RKQ-25-06-SS', '机用根管锉25号', 1, 'V1.0', 500.0000, '支', 1, 1, 'OP-10', '原材备料', 1, '配料中心', 'COMPLETED', 'NORMAL',  '2026-01-03 08:00:00', '2026-01-03 12:00:00', 500.0000, 498.0000, 2.0000,  100.00),
(2, 'PT-20260103-002', '热处理-批次A',      1, 'RKQ-25-06-SS', '机用根管锉25号', 1, 'V1.0', 498.0000, '支', 1, 2, 'OP-20', '线材拉拔', 1, '配料中心', 'IN_PROGRESS', 'HIGH', '2026-01-03 13:00:00', '2026-01-03 18:00:00', 300.0000, 298.0000, 2.0000,   60.24),
(3, 'PT-20260104-001', '包装-批次A',        1, 'RKQ-25-06-SS', '机用根管锉25号', 1, 'V1.0', 498.0000, '支', 1, 3, 'OP-30', '螺旋槽加工', 2, '成型中心',  'PENDING',      'NORMAL', '2026-01-04 08:00:00', '2026-01-04 12:00:00', 0.0000,   0.0000,   0.0000,    0.00),
(4, 'PT-20260104-002', '质检-批次B',        2, 'RKQ-30-06-SS', '机用根管锉30号', 2, 'V1.0', 300.0000, '支', 1, 4, 'OP-40', '螺纹研磨',  2, '成型中心',  'PENDING',      'URGENT','2026-01-04 09:00:00', '2026-01-04 11:00:00', 0.0000,   0.0000,   0.0000,    0.00),
(5, 'PT-20260104-003', '组装-批次B',        2, 'RKQ-30-06-SS', '机用根管锉30号', 2, 'V1.0', 300.0000, '支', 1, 5, 'OP-50', '电化学抛光', 3, '表面处理', 'PENDING',      'NORMAL', '2026-01-04 14:00:00', '2026-01-04 17:00:00', 0.0000,   0.0000,   0.0000,    0.00);

-- ========== P9: ebr_step 种子数据 ==========
INSERT IGNORE INTO ebr_step (id, ebr_id, step_no, step_name, operation_code, operation_name, status, operator_name, approval_status) VALUES
(1, 1, 10, '原材备料',     'OP-10', '原材备料',    'COMPLETED', '王建军', 'APPROVED'),
(2, 1, 20, '线材拉拔',     'OP-20', '线材拉拔',    'COMPLETED', '王建军', 'APPROVED'),
(3, 1, 30, '螺旋槽加工',   'OP-30', '螺旋槽加工',  'COMPLETED', '李明华', 'APPROVED'),
(4, 1, 40, '螺纹研磨',     'OP-40', '螺纹研磨',    'COMPLETED', '李明华', 'APPROVED'),
(5, 1, 50, '电化学抛光',   'OP-50', '电化学抛光',  'COMPLETED', '张晓燕', 'APPROVED'),
(6, 1, 60, '热处理',       'OP-60', '热处理',      'COMPLETED', '张晓燕', 'APPROVED'),
(7, 1, 70, '质检',         'OP-70', '质量检验',    'COMPLETED', '赵思源', 'APPROVED'),
(8, 1, 80, '包装',         'OP-80', '无菌包装',    'COMPLETED', '赵思源', 'APPROVED'),
(9, 2, 10, '原材备料',     'OP-10', '原材备料',    'COMPLETED', '王建军', 'APPROVED'),
(10,2, 20, '线材拉拔',     'OP-20', '线材拉拔',    'IN_PROGRESS','王建军', '');

-- ========== P9: ebr_equipment_usage 种子数据 ==========
INSERT IGNORE INTO ebr_equipment_usage (id, ebr_id, step_id, equipment_code, equipment_name, equipment_type, start_time, end_time, duration, operator_name, usage_status) VALUES
(1, 1, 1, 'EQ-001', '拉丝机001',     '拉丝设备',   '2026-01-03 08:00:00', '2026-01-03 10:00:00', 120, '王建军', 'NORMAL'),
(2, 1, 2, 'EQ-002', 'CNC磨槽机002', 'CNC加工',     '2026-01-03 10:30:00', '2026-01-03 14:00:00', 210, '李明华', 'NORMAL'),
(3, 1, 3, 'EQ-003', '热处理炉003',   '热处理设备', '2026-01-03 14:30:00', '2026-01-03 16:30:00', 120, '张晓燕', 'NORMAL'),
(4, 2, 9, 'EQ-001', '拉丝机001',     '拉丝设备',   '2026-01-04 08:00:00', '2026-01-04 10:30:00', 150, '王建军', 'NORMAL');

-- ========== P9: ebr_material_balance 种子数据 ==========
INSERT IGNORE INTO ebr_material_balance (id, ebr_id, material_id, material_code, material_name, spec, unit_name, plan_quantity, theoretical_quantity, actual_input, actual_output, difference, difference_rate, balance_status) VALUES
(1, 1, 1, 'RM001', '天然乳胶',   '医用级',   'kg',  120.0000, 120.0000, 121.5000, 119.8000, -1.7000, -1.42, 'BALANCED'),
(2, 1, 2, 'RM002', '硫磺粉',     '工业级',   'kg',    4.0000,   4.0000,   4.1000,   3.9500, -0.1500, -3.75, 'BALANCED'),
(3, 2, 1, 'RM001', '天然乳胶',   '医用级',   'kg',   80.0000,  80.0000,  81.0000,   0.0000, -81.0000,  0.00, 'IN_PROGRESS');

-- ═══════════════════════════════════════════════════════════════════
-- P10: 设备子模块 + 倒扣日志 种子数据
-- ═══════════════════════════════════════════════════════════════════

-- 维保计划
INSERT IGNORE INTO equipment_maint_plan (id, plan_no, equip_id, equip_code, equip_name, maint_type, maint_content, plan_date, plan_duration, assignee, status, actual_date, result, next_plan_date) VALUES
(1, 'MP-2026-001', 'EQ001', 'CNC-001', '数控车床#1', 'MONTHLY', '清洁导轨、润滑丝杠、检查夹具', '2026-06-01', 4.0, '李维保', 'DONE', '2026-06-01', '保养完成，设备运行正常', '2026-07-01'),
(2, 'MP-2026-002', 'EQ002', 'CNC-002', '数控车床#2', 'WEEKLY', '清洁切屑、检查冷却液', '2026-06-08', 1.0, '王维修', 'DONE', '2026-06-08', '已完成，更换冷却液', '2026-06-15'),
(3, 'MP-2026-003', 'EQ003', 'GRIND-001', '无心磨床#1', 'QUARTERLY', '检查砂轮磨损、校准加工精度', '2026-06-15', 8.0, '李维保', 'IN_PROGRESS', NULL, NULL, '2026-09-15'),
(4, 'MP-2026-004', 'EQ004', 'CLEAN-001', '超声波清洗机', 'MONTHLY', '更换清洗液、清洁超声振子', '2026-05-20', 2.0, '张操作', 'OVERDUE', NULL, NULL, NULL),
(5, 'MP-2026-005', 'EQ005', 'COAT-001', 'TiN涂层炉', 'ANNUAL', '全面检修、更换密封件、校准温度', '2026-07-01', 16.0, '外协厂商', 'PENDING', NULL, NULL, '2027-07-01');

-- 故障记录
INSERT IGNORE INTO equipment_fault (id, fault_no, equip_id, equip_code, equip_name, fault_time, reporter, fault_desc, fault_level, affected_batch, affected_wo_no, status, assignee, diagnose, repair_content, downtime, verifier) VALUES
(1, 'FT-2026-001', 'EQ001', 'CNC-001', '数控车床#1', '2026-05-15 09:23:00', '张操作', 'X轴丝杠异响，加工精度超差±0.02mm', 'HIGH', 'YS-RKQ-20260515-001', 'WO-20260515-001', 'CLOSED', '李维修', '丝杠磨损，预负荷丢失', '更换X轴丝杠及螺母，重新预紧调整精度', 240, 'QA王质检'),
(2, 'FT-2026-002', 'EQ003', 'GRIND-001', '无心磨床#1', '2026-05-28 14:10:00', '王操作', '磨削后尺寸偏大0.05mm，砂轮跳动超标', 'MEDIUM', NULL, NULL, 'CLOSED', '李维修', '砂轮不平衡，法兰变形', '重新修整砂轮，更换法兰', 180, '李工程师'),
(3, 'FT-2026-003', 'EQ006', 'LASER-001', '激光打标机', '2026-06-01 10:05:00', '刘操作', '打标能量不稳定，标记模糊', 'MEDIUM', NULL, 'WO-20260601-003', 'REPAIRING', '赵维修', '激光器老化，光路偏移', NULL, NULL, NULL),
(4, 'FT-2026-004', 'EQ002', 'CNC-002', '数控车床#2', '2026-06-03 08:30:00', '陈操作', '冷却泵不工作，加工时有过热警报', 'CRITICAL', 'YS-RKQ-20260603-002', 'WO-20260603-002', 'ASSIGNED', '李维修', NULL, NULL, 90, NULL);

-- 计量校准
INSERT IGNORE INTO equipment_calibration (id, calib_no, equip_id, equip_code, equip_name, calib_type, calib_org, calib_date, next_calib_date, calib_cycle, calib_result, cert_no, status, operator) VALUES
(1, 'CB-2026-001', 'EQ-M01', 'CMM-001', '三坐标测量机', 'EXTERNAL', '国家计量院', '2026-01-15', '2027-01-15', 12, 'PASS', 'CERT-2026-CMM-001', 'VALID', '计量员张'),
(2, 'CB-2026-002', 'EQ-M02', 'MICRO-001', '外径千分尺组', 'INTERNAL', NULL, '2026-04-01', '2026-10-01', 6, 'PASS', NULL, 'VALID', '质检李'),
(3, 'CB-2026-003', 'EQ-M03', 'FORCE-001', '扭矩测试仪', 'EXTERNAL', '省计量院', '2025-12-01', '2026-06-01', 6, 'PASS', 'CERT-2025-FT-003', 'EXPIRED', '计量员王'),
(4, 'CB-2026-004', 'EQ-M04', 'SURF-001', '粗糙度仪', 'INTERNAL', NULL, '2026-05-20', '2026-11-20', 6, 'CONDITIONAL', NULL, 'VALID', '质检赵'),
(5, 'CB-2026-005', 'EQ-M05', 'TEMP-001', '温度记录仪', 'EXTERNAL', '省计量院', '2026-06-10', '2027-06-10', 12, 'PASS', 'CERT-2026-TEMP-005', 'IN_CALIBRATION', '计量员陈');

-- 备件库存
INSERT IGNORE INTO equipment_spare_part (id, part_code, part_name, part_spec, applicable_equips, unit, current_stock, safety_stock, unit_cost, supplier, lead_time, location, status) VALUES
(1, 'SP-CNC-001', 'X轴丝杠', 'R32×5×700', 'EQ001,EQ002', '根', 2, 1, 1280.00, '精密丝杠厂', 15, 'A-01-03', 'NORMAL'),
(2, 'SP-CNC-002', '主轴轴承', 'SKF 7010ACD/P4', 'EQ001,EQ002', '套', 4, 2, 380.00, 'SKF中国', 20, 'A-01-05', 'NORMAL'),
(3, 'SP-GRD-001', '磨削砂轮', 'WA60K5V-350×40×127', 'EQ003', '片', 1, 3, 680.00, '郑州磨具', 7, 'B-02-01', 'LOW_STOCK'),
(4, 'SP-CLN-001', '超声波振子', '28kHz-600W', 'EQ004', '个', 0, 2, 450.00, '声达超声', 30, 'C-01-02', 'OUT_OF_STOCK'),
(5, 'SP-CMM-001', '测针红宝石球', 'Ø1mm-L30', 'EQ-M01', '支', 8, 5, 95.00, '雷尼绍', 10, 'D-03-01', 'NORMAL'),
(6, 'SP-LAS-001', '激光器模块', 'JPT 30W MOPA', 'EQ006', '个', 1, 1, 12800.00, '杰普特', 45, 'E-01-01', 'NORMAL');

-- 设备使用记录
INSERT IGNORE INTO equipment_usage (id, usage_no, equip_id, equip_code, equip_name, wo_no, task_no, batch_no, product_code, product_name, operator, start_time, end_time, duration, clean_before, clean_after, abnormal_flag) VALUES
(1, 'EU-20260603-001', 'EQ001', 'CNC-001', '数控车床#1', 'WO-20260603-001', 'TASK-001', 'YS-RKQ-20260603-001', 'RKQ-25-04', '根管锉25#04', '张操作', '2026-06-03 08:00:00', '2026-06-03 12:00:00', 240, 1, 1, 0),
(2, 'EU-20260603-002', 'EQ003', 'GRIND-001', '无心磨床#1', 'WO-20260603-001', 'TASK-002', 'YS-RKQ-20260603-001', 'RKQ-25-04', '根管锉25#04', '王操作', '2026-06-03 13:00:00', '2026-06-03 17:00:00', 240, 1, 1, 0),
(3, 'EU-20260603-003', 'EQ-M01', 'CMM-001', '三坐标测量机', 'WO-20260603-002', 'TASK-003', 'YS-RKQ-20260603-002', 'RKQ-30-04', '根管锉30#04', '李质检', '2026-06-03 09:00:00', '2026-06-03 10:30:00', 90, 1, 1, 0),
(4, 'EU-20260603-004', 'EQ006', 'LASER-001', '激光打标机', 'WO-20260603-003', 'TASK-004', 'YS-RKQ-20260602-003', 'RKQ-20-04', '根管锉20#04', '刘操作', '2026-06-03 14:00:00', NULL, NULL, 1, 0, 1);

-- 倒扣领料日志
INSERT IGNORE INTO backflush_log (id, log_no, work_order_id, wo_no, material_code, material_name, bom_qty, actual_qty, unit, batch_no, operation_code, operation_name, status, operator, exec_time) VALUES
(1, 'BF-20260603-001', 'WO001', 'WO-20260603-001', 'RM-NTi-W1', 'NiTi合金线材Ø0.5', 120.0000, 120.0000, 'kg', 'YS-RKQ-20260603-001', 'OP-10', '备料', 'SUCCESS', '系统自动', '2026-06-03 08:05:00'),
(2, 'BF-20260603-002', 'WO001', 'WO-20260603-001', 'PKG-FOIL-35', '铝箔袋35×60', 5000.0000, 5000.0000, '个', 'YS-RKQ-20260603-001', 'OP-90', '包装', 'SUCCESS', '系统自动', '2026-06-03 17:30:00'),
(3, 'BF-20260603-003', 'WO002', 'WO-20260603-002', 'RM-NTi-W2', 'NiTi合金线材Ø0.6', 80.0000, 82.5000, 'kg', 'YS-RKQ-20260603-002', 'OP-10', '备料', 'EXCEPTION', '系统自动', '2026-06-03 08:10:00'),
(4, 'BF-20260603-004', 'WO003', 'WO-20260603-003', 'LUB-COOL-01', '冷却润滑液', 5.0000, 5.0000, 'L', 'YS-RKQ-20260602-003', 'OP-25', '精车', 'SUCCESS', '系统自动', '2026-06-02 09:00:00'),
(5, 'BF-20260603-005', 'WO001', 'WO-20260603-001', 'PKG-LABEL-A', '产品标签A型', 5000.0000, 0.0000, '张', 'YS-RKQ-20260603-001', 'OP-90', '包装', 'FAILED', '系统自动', '2026-06-03 17:31:00');

-- 工艺路径（根管锉产品专属路径，匹配前端 proData.ts mock 数据）
INSERT IGNORE INTO process_routing (id, routing_code, routing_name, product_model, product_code, product_name, version, is_default, status, description, create_by) VALUES
(3, 'RT-RKQ-STD-001', '机用根管锉标准工艺路径',        '#25/04锥/25mm', 'FG-RKQ-2504-25', '机用根管锉', 'V2.1', 1, 'ACTIVE',   '根管锉标准生产工艺路径，符合ISO 3630-1，全流程PAD电子化执行', 'admin'),
(4, 'RT-RKQ-3006-002', '#30/06锥根管锉工艺路径',       '#30/06锥/21mm', 'FG-RKQ-3006-21', '机用根管锉', 'V1.0', 0, 'PENDING',  '基于标准路径，#30/06锥磨削参数调整，热处理温度提高5℃', 'admin'),
(5, 'RT-RKQ-STD-002', '机用根管锉标准工艺路径V2（#26/04锥）', '#26/04锥/25mm', 'FG-RKQ-2504-26', '机用根管锉', 'V1.0', 1, 'ACTIVE',   '机用根管锉#26/04锥/25mm完整生产工艺路径，含机床成型、研磨、热处理、组装、检测全流程', 'admin'),
(6, 'RT-RKQ-MINI-003', '根管锉简化工艺路径（试制）',   '#40/04锥/21mm', 'FG-RKQ-4004-21', '机用根管锉', 'V1.0', 0, 'DRAFT',    '试制品简化路径，不含灭菌步骤，仅用于内部测试', 'admin'),
(7, 'RT-RKQ-OLD-004',  '机用根管锉旧版工艺路径',       '#25/04锥/25mm', 'FG-RKQ-2504-25', '机用根管锉', 'V1.5', 0, 'DISABLED', '旧版工艺，V2.1版本发布后停用', 'admin');

-- 路径步骤（RT-RKQ-STD-001，routing_id=3，7步含1个并行组用stepType=PARALLEL标记）
INSERT IGNORE INTO routing_step (id, routing_id, step_no, step_name, step_code, report_point, step_type, description, create_by) VALUES
(15, 3, 10,  '数控磨削',   'OP-CUT-001',  1, 'KEY',      '瓶颈工序，锥度/直径精度关键控制点', 'admin'),
(16, 3, 20,  '热处理定型', 'OP-HT-001',   1, 'KEY',      '记忆合金相变激活，每炉独立批次号', 'admin'),
(17, 3, 25,  'PVD涂层',    'OP-COAT-001', 1, 'PARALLEL', 'TiN/TiCN 0.5μm涂层，与热处理并行', 'admin'),
(18, 3, 30,  '激光打标',   'OP-MARK-001', 0, 'NORMAL',   '产品追溯码激光刻印', 'admin'),
(19, 3, 40,  '超声清洗',   'OP-CLN-001',  0, 'NORMAL',   '三段超声波清洗', 'admin'),
(20, 3, 50,  '成品检验',   'OP-QC-001',   1, 'QC',       'OQC出厂终检，AQL抽样', 'admin'),
(21, 3, 60,  'EO灭菌',     'OP-STER-001', 1, 'NORMAL',   'EO环氧乙烷灭菌', 'admin'),
(22, 3, 70,  '无菌包装',   'OP-PACK-001', 1, 'NORMAL',   '吸塑热封+UDI赋码', 'admin'),
-- RT-RKQ-3006-002，routing_id=4，7步全串行
(23, 4, 10,  '数控磨削',   'OP-CUT-001',  1, 'KEY',      '#30/06锥磨削参数：转速3200rpm', 'admin'),
(24, 4, 20,  '热处理定型', 'OP-HT-001',   1, 'KEY',      '热处理温度较标准路径+5℃', 'admin'),
(25, 4, 30,  'PVD涂层',    'OP-COAT-001', 1, 'NORMAL',   'TiN/TiCN涂层', 'admin'),
(26, 4, 40,  '超声清洗',   'OP-CLN-001',  0, 'NORMAL',   '三段清洗', 'admin'),
(27, 4, 50,  '成品检验',   'OP-QC-001',   1, 'QC',       'AQL抽样检验', 'admin'),
(28, 4, 60,  'EO灭菌',     'OP-STER-001', 1, 'NORMAL',   'EO灭菌', 'admin'),
(29, 4, 70,  '无菌包装',   'OP-PACK-001', 1, 'NORMAL',   '吸塑热封', 'admin'),
-- RT-RKQ-STD-002，routing_id=5，14步全串行（Excel工艺路径定义）
(30, 5, 10,  '机床成型',   'OP-JC-001',   1, 'KEY',      '瓶颈工序：镍钛丝磨削成型，首件检验产品尺寸', 'admin'),
(31, 5, 20,  '清洗一',     'OP-QX1-001',  1, 'NORMAL',   '机床成型后超声波清洗', 'admin'),
(32, 5, 30,  '尾部修整',   'OP-WBX-001',  1, 'NORMAL',   '修整产品尾部，首件确认长度及尾部外观', 'admin'),
(33, 5, 40,  '尖部修整',   'OP-JPX-001',  1, 'NORMAL',   '修整产品尖部', 'admin'),
(34, 5, 50,  '研磨一',     'OP-YM1-001',  1, 'NORMAL',   '工作部研磨成形，自检QC检验', 'admin'),
(35, 5, 60,  '热处理',     'OP-RCL-001',  1, 'KEY',      '瓶颈工序：镍钛丝记忆合金相变激活热处理定型', 'admin'),
(36, 5, 70,  '清洗二',     'OP-QX2-001',  1, 'NORMAL',   '热处理后超声波清洗', 'admin'),
(37, 5, 80,  '刻线',       'OP-KX-001',   1, 'NORMAL',   '工作部深度刻线标识', 'admin'),
(38, 5, 90,  '组装',       'OP-ZZ-001',   1, 'NORMAL',   '锉针与手柄组装', 'admin'),
(39, 5, 100, '环规适配',   'OP-HG-001',   1, 'NORMAL',   '使用标准环规检验工作部锥度精度', 'admin'),
(40, 5, 110, '测量长度',   'OP-CL-001',   1, 'NORMAL',   '测量产品总长度', 'admin'),
(41, 5, 120, '装限位块',   'OP-XWK-001',  1, 'NORMAL',   '安装橡胶限位块', 'admin'),
(42, 5, 130, '检测合格',   'OP-JCHE-001', 1, 'QC',       '瓶颈工序：QC半成品综合检验，AQL抽样', 'admin'),
(43, 5, 140, '半成品入库', 'OP-BCR-001',  1, 'NORMAL',   '完成所有工序后由QC逐批次抽检', 'admin'),
-- RT-RKQ-OLD-004，routing_id=7，2步（旧版，已停用）
(44, 7, 10,  '数控磨削',   'OP-CUT-001',  1, 'KEY',      '旧版磨削参数', 'admin'),
(45, 7, 20,  '成品检验',   'OP-QC-001',   1, 'QC',       '旧版检验流程', 'admin');

-- ═══════════════════════════════════════════════════════════════════
-- P15: 产品系列 mes_product_series 种子数据（根管锉医疗器械系列）
-- ═══════════════════════════════════════════════════════════════════
INSERT INTO mes_product_series (code, name, category, description, specification, unit, manager, status, remark)
SELECT * FROM (VALUES
  ('RT-RKQ',     '机用根管锉标准系列',   '机用根管锉族', '机用镍钛根管锉标准产品系列，适用于常规根管预备', '#15-#40，锥度04/06，长21mm/25mm/31mm', '支', '张工', 1, '主力产品系列'),
  ('RT-RKQ-PRO', '机用根管锉专业系列',   '机用根管锉族', '机用镍钛根管锉专业系列，高扭矩高切削效率', '#25-#60，锥度06/08，长21mm/25mm',       '支', '张工', 1, '专业医院渠道'),
  ('RT-SRK',     '手用根管锉系列',       '手用根管锉族', '传统不锈钢手用根管锉，K型/H型', 'ISO #10-#80，长21mm/25mm/28mm/31mm',    '套', '李工', 1, '基础配套系列'),
  ('RT-GLZ',     '热牙胶充填针系列',     '热牙胶充填针族','热牙胶根管充填系统，GP尖+牙胶针', '细/中/粗，配套注射器', '盒', '李工', 1, '耗材配套系列'),
  ('RT-CXY',     '冲洗液系列',          '冲洗系列族',   '根管冲洗液，次氯酸钠/EDTA/生理盐水', '1%/3%/5.25%，250mL/500mL', '瓶', '王工', 1, '化学耗材'),
  ('RT-SFZZ',    '手柄组装件系列',       '机用根管锉族', '根管锉用塑料手柄，ISO颜色编码', '#10-#80 ISO标准色系', '只', '张工', 1, '配套组件'),
  ('RT-RKQ-OLD', '机用根管锉旧版系列',   '机用根管锉族', '已停产旧版本，仅供历史查询', '旧版规格', '支', '张工', 0, '已停产停用')
) AS v(code, name, category, description, specification, unit, manager, status, remark)
WHERE NOT EXISTS (SELECT 1 FROM mes_product_series WHERE deleted = 0 LIMIT 1);

-- ═══════════════════════════════════════════════════════════════════
-- 计量单位组 unit_group 种子数据（9组，对应 mockUnitGroups g1–g9）
-- ═══════════════════════════════════════════════════════════════════
INSERT IGNORE INTO unit_group (id, code, name, sort_no, status) VALUES
(1, 'PCS',   '个/套',   10, 1),
(2, 'SHEET', '张/张',   20, 1),
(3, 'GEN',   '根/根',   30, 1),
(4, 'M',     '米/毫米', 40, 1),
(5, 'KG',    '千克/克', 50, 1),
(6, 'L',     '升/毫升', 60, 1),
(7, 'ROLL',  '卷/卷',   70, 1),
(8, 'SET',   '套/套',   80, 1),
(9, 'ZHI',   '支/支',   90, 1);

-- ═══════════════════════════════════════════════════════════════════
-- 计量单位 unit 种子数据（14条，对应 mockUnitGroups 内嵌 units）
-- id 规则：同 group_id 百位，如 g1→id=101/102, g4→id=401/402 ...
-- ═══════════════════════════════════════════════════════════════════
INSERT IGNORE INTO unit (id, code, name, en_name, group_id, group_name, method, precision, is_base, status) VALUES
-- g1 (id=1): 个/套
(101, 'PC',    '个',   'Piece',      1, '个/套',   '四舍五入', 0, 1, 1),
(102, 'SET',   '套',   'Set',        1, '个/套',   '四舍五入', 0, 0, 1),
-- g2 (id=2): 张
(201, 'SHEET', '张',   'Sheet',      2, '张/张',   '四舍五入', 0, 1, 1),
-- g3 (id=3): 根
(301, 'GEN',   '根',   'Piece',      3, '根/根',   '四舍五入', 0, 1, 1),
-- g4 (id=4): 米/毫米
(401, 'M',     '米',   'Meter',      4, '米/毫米', '四舍五入', 3, 1, 1),
(402, 'MM',    '毫米', 'Millimeter', 4, '米/毫米', '四舍五入', 3, 0, 1),
-- g5 (id=5): 千克/克
(501, 'KG',    '千克', 'Kilogram',   5, '千克/克', '四舍五入', 3, 1, 1),
(502, 'G',     '克',   'Gram',       5, '千克/克', '四舍五入', 3, 0, 1),
-- g6 (id=6): 升/毫升
(601, 'L',     '升',   'Liter',      6, '升/毫升', '四舍五入', 3, 1, 1),
(602, 'ML',    '毫升', 'Milliliter', 6, '升/毫升', '四舍五入', 3, 0, 1),
-- g7 (id=7): 卷
(701, 'ROLL',  '卷',   'Roll',       7, '卷/卷',   '四舍五入', 0, 1, 1),
-- g8 (id=8): 套（第二套组，code 用 SET2 避免重复）
(801, 'SET2',  '套',   'Set',        8, '套/套',   '四舍五入', 0, 1, 1),
-- g9 (id=9): 支
(901, 'ZHI',   '支',   'Piece',      9, '支/支',   '四舍五入', 0, 1, 1);

-- ═══════════════════════════════════════════════════════════════════
-- 物料主数据 material 种子数据（35条，覆盖 mockMaterials M001–M503）
-- unit_id 对应上方 unit 表的 id（101=个, 201=张, 301=根, 401=米,
--   501=千克, 502=克, 601=升, 701=卷, 801=套, 901=支）
-- category_id 对应已有 material_category 种子（ids 21–73）
-- ═══════════════════════════════════════════════════════════════════
INSERT IGNORE INTO material (id, code, name, category_id, spec, unit_id, unit_name, type, brand, supplier, min_stock, max_stock, price, status, description) VALUES
-- ── 原材料：镍钛丝材（category_id=21）──
(1,  'RM-NTW-2504',    '镍钛丝材',               21, 'Φ0.32mm / ASTM F2063 / 盘装',                401, '米',   '原材料', 'FURUKAWA',   '古河科技（中国）',   5000,    50000,    8.50,  1, '符合ASTM F2063医疗级镍钛合金丝，用于#25/04锥根管锉'),
(2,  'RM-NTW-3006',    '镍钛丝材',               21, 'Φ0.38mm / ASTM F2063 / 盘装',                401, '米',   '原材料', 'FURUKAWA',   '古河科技（中国）',   3000,    30000,    9.20,  1, '符合ASTM F2063医疗级镍钛合金丝，用于#30/06锥根管锉'),
(3,  'RM-NTW-4004',    '镍钛丝材',               21, 'Φ0.45mm / ASTM F2063 / 盘装',                401, '米',   '原材料', 'FURUKAWA',   '古河科技（中国）',   2000,    20000,   10.80,  1, '符合ASTM F2063医疗级镍钛合金丝，用于#40/04锥根管锉'),
(4,  'RM-NTW-2506',    '镍钛丝材',               21, 'Φ0.35mm / ASTM F2063 / 盘装',                401, '米',   '原材料', 'FURUKAWA',   '古河科技（中国）',   3000,    30000,    8.80,  1, '符合ASTM F2063医疗级镍钛合金丝，用于#25/06锥根管锉'),
-- ── 原材料：不锈钢材料（category_id=22）──
(5,  'RM-SS-HANDLE',   '不锈钢柄部毛坯',         22, 'Φ11mm × 12mm / SUS304 / 镍钛接口',           101, '个',   '原材料', '',            '迈迪康配件厂',       10000,  100000,    0.35,  1, '不锈钢预成型柄部，用于与镍钛丝材激光焊接'),
-- ── 原材料：高分子材料（category_id=23）──
(6,  'RM-ABS-COLOR-R', 'ABS色母粒（红）',        23, '医用级ABS / ISO 10993-5合规 / 红色',          501, '千克', '原材料', 'BASF',        '巴斯夫（中国）',       50,      500,   65.00,  1, '用于#15/#20锥度标识色注塑柄，符合ISO 10993生物相容性'),
(7,  'RM-ABS-COLOR-Y', 'ABS色母粒（黄）',        23, '医用级ABS / ISO 10993-5合规 / 黄色',          501, '千克', '原材料', 'BASF',        '巴斯夫（中国）',       50,      500,   65.00,  1, '用于#25锥度标识色注塑柄，符合ISO 10993生物相容性'),
(8,  'RM-ABS-COLOR-G', 'ABS色母粒（绿）',        23, '医用级ABS / ISO 10993-5合规 / 绿色',          501, '千克', '原材料', 'BASF',        '巴斯夫（中国）',       30,      300,   65.00,  1, '用于#30锥度标识色注塑柄，符合ISO 10993生物相容性'),
(9,  'RM-ABS-COLOR-BK','ABS色母粒（黑）',        23, '医用级ABS / ISO 10993-5合规 / 黑色',          501, '千克', '原材料', 'BASF',        '巴斯夫（中国）',       30,      300,   65.00,  1, '用于#40锥度标识色注塑柄，符合ISO 10993生物相容性'),
-- ── 原材料：辅助化学品（category_id=24）──
(10, 'CH-ETCH-HF',     '化学蚀刻液（氢氟酸混合液）', 24, '工业级 / HF 5% / 20L桶装',              601, '升',   '原材料', '',            '苏州化工原料公司',     100,    1000,   28.00,  1, '用于镍钛丝材表面蚀刻处理，改善切削性能'),
(11, 'CH-NITRIDE',     '氮化钛涂层靶材',         24, 'TiN / 纯度99.9% / PVD用',                    502, '克',   '原材料', '',            '上海纳米技术公司',     500,    5000,  320.00,  1, '用于根管锉尖端PVD氮化钛涂层，提高耐磨性'),
-- ── 半成品：机加工件（category_id=31）──
(12, 'SA-CUT-2504',    '镍钛丝切断件',           31, 'Φ0.32mm × 32mm / #25/04锥',                  301, '根',   '半成品', '',            '',                      0,        0,    0.35,  1, '切断后未加工的镍钛丝段，工序件'),
(13, 'SA-GRIND-2504',  '磨锥半成品',             31, '#25/04锥/25mm / 锥度已成型',                  301, '根',   '半成品', '',            '',                      0,        0,    0.85,  1, '完成磨锥工序的半成品，待螺纹加工'),
(14, 'SA-THREAD-2504', '螺纹成型半成品',         31, '#25/04锥/25mm / 螺纹已成型',                  301, '根',   '半成品', '',            '',                      0,        0,    1.20,  1, '完成螺纹滚压的半成品，待热处理'),
-- ── 半成品：热处理件（category_id=32）──
(15, 'SA-HEAT-2504',   '热处理成品件',           32, '#25/04锥/25mm / 记忆合金激活',                301, '根',   '半成品', '',            '',                      0,        0,    2.50,  1, '完成热处理记忆合金相变激活，待涂层'),
-- ── 半成品：涂层件（category_id=33）──
(16, 'SA-COAT-2504',   'TiN涂层件',              33, '#25/04锥/25mm / TiN镀层0.5μm',               301, '根',   '半成品', '',            '',                      0,        0,    3.80,  1, '完成PVD氮化钛涂层，待注塑柄组装'),
-- ── 半成品：注塑件（category_id=34）──
(17, 'SA-MOLD-HANDLE-Y', '注塑柄（黄色）',       34, 'ABS / 黄色 / #25标识',                       101, '个',   '半成品', '',            '',                   5000,    50000,    0.18,  1, '黄色ABS注塑柄，用于#25型号锥度色标'),
(18, 'SA-MOLD-HANDLE-G', '注塑柄（绿色）',       34, 'ABS / 绿色 / #30标识',                       101, '个',   '半成品', '',            '',                   3000,    30000,    0.18,  1, '绿色ABS注塑柄，用于#30型号锥度色标'),
(19, 'SA-MOLD-HANDLE-BK','注塑柄（黑色）',       34, 'ABS / 黑色 / #40标识',                       101, '个',   '半成品', '',            '',                   2000,    20000,    0.18,  1, '黑色ABS注塑柄，用于#40型号锥度色标'),
-- ── 成品：机用根管锉（category_id=41）──
(20, 'FG-RKQ-2504-25', '机用根管锉',             41, '#25 / 04锥度 / 25mm',                         301, '根',   '成品',   '悦尚YS',      '',                   1000,    50000,   18.50,  1, '机用镍钛根管锉，黄色柄，ISO 3630-1合规，UDI已注册'),
(21, 'FG-RKQ-3006-21', '机用根管锉',             41, '#30 / 06锥度 / 21mm',                         301, '根',   '成品',   '悦尚YS',      '',                    500,    20000,   21.00,  1, '机用镍钛根管锉，绿色柄，ISO 3630-1合规，UDI已注册'),
(22, 'FG-RKQ-4004-21', '机用根管锉',             41, '#40 / 04锥度 / 21mm',                         301, '根',   '成品',   '悦尚YS',      '',                    300,    10000,   24.50,  1, '机用镍钛根管锉，黑色柄，ISO 3630-1合规，UDI已注册'),
(23, 'FG-RKQ-2506-25', '机用根管锉',             41, '#25 / 06锥度 / 25mm',                         301, '根',   '成品',   '悦尚YS',      '',                    500,    20000,   20.00,  1, '机用镍钛根管锉，黄色柄/06锥，ISO 3630-1合规'),
-- ── 包装材料：内包装（category_id=51）──
(24, 'PK-BLISTER-S',   '吸塑托盘（单支装）',     51, 'PET / 单根 / 113×22mm',                      101, '个',   '包装材料','',           '苏州包材公司',        50000,  500000,    0.05,  1, '单支根管锉吸塑内托，医用PET材质，符合ISO 11607'),
(25, 'PK-FOIL-SEAL',   '铝塑封口膜',             51, 'Al/PE 复合膜 / 宽30mm / 卷装500m',            701, '卷',   '包装材料','',           '苏州包材公司',           50,     200,  380.00,  1, '吸塑包装热封膜，符合YY/T 0698医疗器械包装要求'),
(26, 'PK-SILICAGEL',   '干燥剂',                 51, '硅胶 / 0.5g / 独立包',                        101, '个',   '包装材料','',           '上海干燥剂公司',       20000,  200000,    0.03,  1, '包装内干燥剂，防潮保护，符合医疗包装要求'),
-- ── 包装材料：外包装（category_id=52）──
(27, 'PK-BOX-6PCS',    '彩盒（6支装）',          52, '白卡纸 250g / 110×60×18mm / 彩印',            101, '个',   '包装材料','',           '苏州印刷公司',          5000,   50000,    0.45,  1, '6支装零售彩盒，含规格色标印刷及使用说明'),
(28, 'PK-BOX-MASTER',  '外箱（60盒/箱）',        52, '五层瓦楞 / B/E楞 / 340×200×150mm',            101, '个',   '包装材料','',           '苏州包材公司',           500,    5000,    3.50,  1, '成品外箱，每箱60小盒（360根），符合出口运输要求'),
-- ── 包装材料：标签标识（category_id=53）──
(29, 'PK-LABEL-UDI',   'UDI标签（单支）',        53, '铜版纸不干胶 / 50×20mm / 含GS1条码',          201, '张',   '包装材料','',           '苏州标签公司',         100000, 1000000,   0.02,  1, 'GS1 DI+PI UDI标签，含HIBC条码，符合MDR/FDA要求'),
(30, 'PK-INSERT',      '说明书',                 53, '双面彩印 / 折叠 / A4展开',                    201, '张',   '包装材料','',           '苏州印刷公司',          10000,  100000,    0.08,  1, '产品使用说明书，含中英文，符合CFDA/FDA注册要求'),
-- ── 辅料耗材（category_id=61/62/63）──
(31, 'AX-CLEAN-IPA',   '异丙醇（IPA）',          61, '电子级 99.7% / 20L桶',                        601, '升',   '辅料',   '',            '苏州化工原料公司',      200,    1000,   22.00,  1, '超声清洗用溶剂，清除加工油脂残留'),
(32, 'AX-CLEAN-EW',    '纯化水',                 61, '≥1MΩ·cm / 最终清洗用',                       601, '升',   '辅料',   '',            '自制（纯水机）',         500,    5000,    0.80,  1, '最终清洗纯化水，电阻率≥1MΩ·cm'),
(33, 'AX-CLEAN-ENZ',   '酶洗液',                 61, '医用多酶 / 1:200稀释 / 5L瓶',                 601, '升',   '辅料',   'Neodisher',  '上海医用清洗公司',       50,     200,  185.00,  1, '超声酶洗液，去除蛋白质残留，符合医疗器械清洁要求'),
(34, 'AX-LUBE-OIL',    '切削润滑液',             63, '水溶性 / 5% 使用浓度 / 20L桶',                601, '升',   '辅料',   '',            '苏州切削液公司',         100,     500,   45.00,  1, '镍钛丝磨削/切削冷却润滑液'),
(35, 'AX-INSPECT-GAUGE','锥度量规',              62, 'ISO 3630-1 / 04锥 / 精度±0.005mm',            101, '个',   '辅料',   '',            '精密量具公司',             5,      20,  850.00,  1, '根管锉锥度检测专用量规，ISO 3630-1标准'),
-- ── 模具工装（category_id=71/72）──
(36, 'MD-THREAD-2504', '螺纹滚压模（#25/04）',   71, '硬质合金 / 寿命5000次 / #25/04锥',            801, '套',   '模具工装','',           '精密模具公司',             2,      10, 3500.00,  1, '镍钛丝螺纹滚压成型模，每套寿命5000支，需寿命跟踪'),
(37, 'MD-THREAD-3006', '螺纹滚压模（#30/06）',   71, '硬质合金 / 寿命5000次 / #30/06锥',            801, '套',   '模具工装','',           '精密模具公司',             2,      10, 3500.00,  1, '镍钛丝螺纹滚压成型模，每套寿命5000支'),
(38, 'MD-INJ-HANDLE',  '注塑柄模具',             72, '1模8腔 / 寿命50万次 / ABS专用',               801, '套',   '模具工装','',           '精密模具公司',             1,       4, 45000.00, 1, '注塑柄1模8腔模具，寿命50万次');

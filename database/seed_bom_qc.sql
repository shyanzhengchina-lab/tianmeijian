-- ============================================================
-- 天美健MES — BOM物料清单 + QC质检方案演示数据
-- 覆盖截图中6个成品：
--   PROD-TAB-025  维C咀嚼片         (id=31)
--   PROD-CAP-026  钙维生素D软胶囊    (id=32)
--   PROD-PWD-027  乳清蛋白粉         (id=33)
--   PROD-LIQ-028  葡萄糖酸锌口服液   (id=34)
--   PROD-FIG-029  鱼油软胶囊         (需插入)
--   PROD-COL-030  胶原蛋白口服液     (id=36)
-- ============================================================

SET NAMES utf8mb4;
SET foreign_key_checks = 0;

-- ============================================================
-- 0. 补充缺失的成品：鱼油软胶囊 PROD-FIG-029
-- ============================================================
INSERT IGNORE INTO base_material
  (material_code, material_name, spec, category_id, unit_id, status, deleted, create_time)
VALUES
  ('PROD-FIG-029','鱼油软胶囊','1.0g×60粒/瓶', 9, 10, 1, 0, NOW());

-- ============================================================
-- 1. BOM 主表（base_bom）
--    batch_size = 1批次生产数量（瓶/盒）
-- ============================================================
DELETE FROM base_bom_detail WHERE bom_id IN (
  SELECT id FROM base_bom WHERE bom_code LIKE 'BOM-TMJ-%'
);
DELETE FROM base_bom WHERE bom_code LIKE 'BOM-TMJ-%';

INSERT INTO base_bom
  (bom_code, bom_version, material_id, material_code, material_name,
   batch_size, batch_unit, bom_status, effective_date, deleted, create_time, create_by)
VALUES
-- 维C咀嚼片  0.5g×60片/瓶  批量1000瓶
('BOM-TMJ-TAB-025','V1.0', 31,'PROD-TAB-025','维C咀嚼片',
  1000,'瓶','APPROVED','2026-01-01', 0, NOW(),'admin'),
-- 钙维生素D软胶囊  1.0g×60粒/瓶  批量1000瓶
('BOM-TMJ-CAP-026','V1.0', 32,'PROD-CAP-026','钙维生素D软胶囊',
  1000,'瓶','APPROVED','2026-01-01', 0, NOW(),'admin'),
-- 乳清蛋白粉  10g×30袋/盒  批量500盒
('BOM-TMJ-PWD-027','V1.0', 33,'PROD-PWD-027','乳清蛋白粉',
  500,'盒','APPROVED','2026-01-01', 0, NOW(),'admin'),
-- 葡萄糖酸锌口服液  10ml×30支/盒  批量500盒
('BOM-TMJ-LIQ-028','V1.0', 34,'PROD-LIQ-028','葡萄糖酸锌口服液',
  500,'盒','APPROVED','2026-01-01', 0, NOW(),'admin'),
-- 鱼油软胶囊  1.0g×60粒/瓶  批量1000瓶
('BOM-TMJ-FIG-029','V1.0',
  (SELECT id FROM base_material WHERE material_code='PROD-FIG-029' LIMIT 1),
  'PROD-FIG-029','鱼油软胶囊',
  1000,'瓶','APPROVED','2026-01-01', 0, NOW(),'admin'),
-- 胶原蛋白口服液  50ml×8瓶/盒  批量300盒
('BOM-TMJ-COL-030','V1.0', 36,'PROD-COL-030','胶原蛋白口服液',
  300,'盒','APPROVED','2026-01-01', 0, NOW(),'admin');

-- ============================================================
-- 2. BOM 明细（base_bom_detail）
--    qty = 每批次所需用量
-- ============================================================

-- ─── BOM-TMJ-TAB-025：维C咀嚼片 ───────────────────────────
-- 成分：维生素C（抗坏血酸）+ 山梨醇 + 硬脂酸镁 + 柠檬酸 + 橙味香精
-- 包材：HDPE瓶 + 铝盖 + 标签纸 + 折叠纸盒 + 纸箱
INSERT INTO base_bom_detail
  (bom_id, line_no, material_id, material_code, material_name, material_type,
   qty, unit_name, loss_rate, process_step, is_key_material, deleted, create_time)
SELECT b.id,
       v.line_no, v.mat_id, v.mat_code, v.mat_name, v.mat_type,
       v.qty, v.unit, v.loss_rate, v.step, v.is_key, 0, NOW()
FROM base_bom b
JOIN (VALUES
  ROW(10, 1, 'MAT-VC-001',  '维生素C（抗坏血酸）',  '原料', 15.00, 'kg', 0.02, '称量配料', 1),
  ROW(20, 0, 'AUX-SOR-001', '山梨醇（颗粒级）',     '辅料',180.00, 'kg', 0.01, '称量配料', 0),
  ROW(30, 0, 'AUX-MG-001',  '硬脂酸镁',             '辅料',  1.50, 'kg', 0.01, '称量配料', 0),
  ROW(40, 0, 'AUX-CIT-001', '柠檬酸（无水）',        '辅料',  3.00, 'kg', 0.01, '称量配料', 0),
  ROW(50, 0, 'AUX-ORA-001', '橙味香精',              '辅料',  0.80, 'kg', 0.005,'称量配料', 0),
  ROW(60, 26,'PKG-HDPE-026','HDPE高密度聚乙烯瓶',    '包材',1000, '只', 0.005,'内包装', 1),
  ROW(70, 27,'PKG-CAP-027', '铝盖',                  '包材',1000, '只', 0.005,'内包装', 0),
  ROW(80, 28,'PKG-LBL-028', '标签纸（不干胶）',       '包材',1000, '张', 0.005,'外包装', 0),
  ROW(90, 29,'PKG-BOX-029', '折叠纸盒',              '包材',  50, '只', 0.005,'外包装', 0),
  ROW(100,30,'PKG-CTN-030', '纸箱（瓦楞）',           '包材',  10, '只', 0.005,'外包装', 0)
) AS v(line_no, mat_id, mat_code, mat_name, mat_type, qty, unit, loss_rate, step, is_key)
  ON b.bom_code = 'BOM-TMJ-TAB-025';

-- 将AUX辅料和pkg material_id填入（先补充辅料到base_material若不存在）
INSERT IGNORE INTO base_material (material_code,material_name,spec,category_id,unit_id,status,deleted,create_time)
VALUES
  ('AUX-SOR-001','山梨醇（颗粒级）','食品级',7,2,1,0,NOW()),
  ('AUX-MG-001', '硬脂酸镁',        '药用级',7,2,1,0,NOW()),
  ('AUX-CIT-001','柠檬酸（无水）',  '食品级',7,2,1,0,NOW()),
  ('AUX-ORA-001','橙味香精',        '食品级',7,2,1,0,NOW()),
  ('AUX-GEL-001','明胶（软胶囊用）','药用级',7,2,1,0,NOW()),
  ('AUX-GLY-001','甘油',            '药用级',7,2,1,0,NOW()),
  ('AUX-VE-001', '维生素E油（载体）','食品级',7,2,1,0,NOW()),
  ('AUX-WPI-001','乳清蛋白分离物WPI90%','食品级',6,2,1,0,NOW()),
  ('AUX-COC-001','可可粉（荷兰式）','食品级',7,2,1,0,NOW()),
  ('AUX-STW-001','甜菊糖苷',        '食品级',7,2,1,0,NOW()),
  ('AUX-ZNG-001','葡萄糖酸锌原料液','食品级',5,2,1,0,NOW()),
  ('AUX-PWT-001','纯化水',          '制药用水',7,3,1,0,NOW()),
  ('AUX-SBT-001','山梨酸钾',        '食品级',7,2,1,0,NOW()),
  ('AUX-FLA-001','橙味调味料',      '食品级',7,2,1,0,NOW()),
  ('AUX-COL-LIQ-001','胶原蛋白肽液体原料','食品级',6,3,1,0,NOW()),
  ('AUX-VC-LIQ-001','维生素C（液体）','食品级',4,3,1,0,NOW()),
  ('AUX-HNY-001','蜂蜜',            '食品级',7,3,1,0,NOW());

-- 更新BOM明细中的material_id（通过code回填）
UPDATE base_bom_detail bd
JOIN base_bom b ON bd.bom_id = b.id
JOIN base_material m ON bd.material_code = m.material_code
SET bd.material_id = m.id
WHERE b.bom_code LIKE 'BOM-TMJ-%';

-- ─── BOM-TMJ-CAP-026：钙维生素D软胶囊 ─────────────────────
INSERT INTO base_bom_detail
  (bom_id, line_no, material_id, material_code, material_name, material_type,
   qty, unit_name, loss_rate, process_step, is_key_material, deleted, create_time)
SELECT b.id,
       v.line_no, 0, v.mat_code, v.mat_name, v.mat_type,
       v.qty, v.unit, v.loss_rate, v.step, v.is_key, 0, NOW()
FROM base_bom b
JOIN (VALUES
  ROW(10, 'MAT-CA-005',  '碳酸钙',             '原料', 60.00,'kg',0.02,'称量配料',1),
  ROW(20, 'MAT-VD-002',  '维生素D3（胆钙化醇）','原料',  0.01,'kg',0.02,'称量配料',1),
  ROW(30, 'AUX-GEL-001','明胶（软胶囊用）',    '辅料', 40.00,'kg',0.01,'制粒',0),
  ROW(40, 'AUX-GLY-001','甘油',                '辅料', 20.00,'kg',0.01,'制粒',0),
  ROW(50, 'AUX-VE-001', '维生素E油（载体）',   '辅料', 80.00,'kg',0.005,'称量配料',0),
  ROW(60, 'PKG-HDPE-026','HDPE高密度聚乙烯瓶', '包材',1000, '只',0.005,'内包装',1),
  ROW(70, 'PKG-CAP-027','铝盖',                '包材',1000, '只',0.005,'内包装',0),
  ROW(80, 'PKG-LBL-028','标签纸（不干胶）',    '包材',1000, '张',0.005,'外包装',0),
  ROW(90, 'PKG-BOX-029','折叠纸盒',            '包材',  50, '只',0.005,'外包装',0),
  ROW(100,'PKG-CTN-030','纸箱（瓦楞）',         '包材',  10, '只',0.005,'外包装',0)
) AS v(line_no, mat_code, mat_name, mat_type, qty, unit, loss_rate, step, is_key)
  ON b.bom_code = 'BOM-TMJ-CAP-026';

-- ─── BOM-TMJ-PWD-027：乳清蛋白粉 ──────────────────────────
INSERT INTO base_bom_detail
  (bom_id, line_no, material_id, material_code, material_name, material_type,
   qty, unit_name, loss_rate, process_step, is_key_material, deleted, create_time)
SELECT b.id,
       v.line_no, 0, v.mat_code, v.mat_name, v.mat_type,
       v.qty, v.unit, v.loss_rate, v.step, v.is_key, 0, NOW()
FROM base_bom b
JOIN (VALUES
  ROW(10, 'MAT-WPI-009','乳清蛋白粉（WPI90）', '原料',3500,'g',0.01,'称量配料',1),
  ROW(20, 'AUX-COC-001','可可粉（荷兰式）',    '辅料', 350,'g',0.01,'称量配料',0),
  ROW(30, 'AUX-STW-001','甜菊糖苷',            '辅料',  20,'g',0.01,'称量配料',0),
  ROW(40, 'AUX-VE-001', '维生素E油（载体）',   '辅料',  10,'g',0.005,'称量配料',0),
  ROW(50, 'PKG-ALU-025','铝塑复合膜（OPA/AL/PVC）','包材',500,'m',0.01,'内包装',1),
  ROW(60, 'PKG-BOX-029','折叠纸盒',            '包材',500,'只',0.005,'外包装',0),
  ROW(70, 'PKG-CTN-030','纸箱（瓦楞）',         '包材', 10,'只',0.005,'外包装',0)
) AS v(line_no, mat_code, mat_name, mat_type, qty, unit, loss_rate, step, is_key)
  ON b.bom_code = 'BOM-TMJ-PWD-027';

-- ─── BOM-TMJ-LIQ-028：葡萄糖酸锌口服液 ───────────────────
INSERT INTO base_bom_detail
  (bom_id, line_no, material_id, material_code, material_name, material_type,
   qty, unit_name, loss_rate, process_step, is_key_material, deleted, create_time)
SELECT b.id,
       v.line_no, 0, v.mat_code, v.mat_name, v.mat_type,
       v.qty, v.unit, v.loss_rate, v.step, v.is_key, 0, NOW()
FROM base_bom b
JOIN (VALUES
  ROW(10, 'MAT-ZN-006',  '葡萄糖酸锌',          '原料',  5.00,'kg',0.01,'称量配料',1),
  ROW(20, 'AUX-PWT-001', '纯化水',               '辅料',130.00,'L', 0.02,'配液',0),
  ROW(30, 'AUX-SBT-001', '山梨酸钾',             '辅料',  0.10,'kg',0.005,'配液',0),
  ROW(40, 'AUX-FLA-001', '橙味调味料',           '辅料',  0.50,'kg',0.005,'配液',0),
  ROW(50, 'AUX-STW-001', '甜菊糖苷',             '辅料',  0.08,'kg',0.005,'称量配料',0),
  ROW(60, 'PKG-ALU-025', '铝塑复合膜（OPA/AL/PVC）','包材',500,'m',0.01,'内包装',1),
  ROW(70, 'PKG-BOX-029', '折叠纸盒',             '包材',500,'只',0.005,'外包装',0),
  ROW(80, 'PKG-CTN-030', '纸箱（瓦楞）',          '包材', 10,'只',0.005,'外包装',0)
) AS v(line_no, mat_code, mat_name, mat_type, qty, unit, loss_rate, step, is_key)
  ON b.bom_code = 'BOM-TMJ-LIQ-028';

-- ─── BOM-TMJ-FIG-029：鱼油软胶囊 ──────────────────────────
INSERT INTO base_bom_detail
  (bom_id, line_no, material_id, material_code, material_name, material_type,
   qty, unit_name, loss_rate, process_step, is_key_material, deleted, create_time)
SELECT b.id,
       v.line_no, 0, v.mat_code, v.mat_name, v.mat_type,
       v.qty, v.unit, v.loss_rate, v.step, v.is_key, 0, NOW()
FROM base_bom b
JOIN (VALUES
  ROW(10, 'MAT-FO-012',  '深海鱼油（EPAX挪威）',  '原料', 700.00,'kg',0.015,'称量配料',1),
  ROW(20, 'MAT-MCT-013', 'MCT中链甘油三酯',       '原料', 200.00,'kg',0.01,'称量配料',0),
  ROW(30, 'MAT-VE-003',  '维生素E（d-α-生育酚）', '原料',   2.00,'kg',0.01,'称量配料',1),
  ROW(40, 'AUX-GEL-001', '明胶（软胶囊用）',       '辅料',  60.00,'kg',0.01,'制粒',0),
  ROW(50, 'AUX-GLY-001', '甘油',                  '辅料',  25.00,'kg',0.01,'制粒',0),
  ROW(60, 'PKG-HDPE-026','HDPE高密度聚乙烯瓶',    '包材',1000,'只',0.005,'内包装',1),
  ROW(70, 'PKG-CAP-027', '铝盖',                   '包材',1000,'只',0.005,'内包装',0),
  ROW(80, 'PKG-LBL-028', '标签纸（不干胶）',       '包材',1000,'张',0.005,'外包装',0),
  ROW(90, 'PKG-BOX-029', '折叠纸盒',              '包材',  50,'只',0.005,'外包装',0),
  ROW(100,'PKG-CTN-030', '纸箱（瓦楞）',            '包材',  10,'只',0.005,'外包装',0)
) AS v(line_no, mat_code, mat_name, mat_type, qty, unit, loss_rate, step, is_key)
  ON b.bom_code = 'BOM-TMJ-FIG-029';

-- ─── BOM-TMJ-COL-030：胶原蛋白口服液 ─────────────────────
INSERT INTO base_bom_detail
  (bom_id, line_no, material_id, material_code, material_name, material_type,
   qty, unit_name, loss_rate, process_step, is_key_material, deleted, create_time)
SELECT b.id,
       v.line_no, 0, v.mat_code, v.mat_name, v.mat_type,
       v.qty, v.unit, v.loss_rate, v.step, v.is_key, 0, NOW()
FROM base_bom b
JOIN (VALUES
  ROW(10, 'MAT-COL-011',    '胶原蛋白肽（海洋来源）','原料',  3.00,'kg',0.01,'称量配料',1),
  ROW(20, 'AUX-COL-LIQ-001','胶原蛋白肽液体原料',   '原料', 10.00,'L', 0.01,'称量配料',1),
  ROW(30, 'AUX-VC-LIQ-001', '维生素C（液体）',       '辅料',  0.30,'kg',0.005,'称量配料',0),
  ROW(40, 'AUX-HNY-001',    '蜂蜜',                  '辅料',  5.00,'kg',0.01,'配液',0),
  ROW(50, 'AUX-PWT-001',    '纯化水',                '辅料', 55.00,'L', 0.02,'配液',0),
  ROW(60, 'AUX-SBT-001',    '山梨酸钾',              '辅料',  0.05,'kg',0.005,'配液',0),
  ROW(70, 'PKG-HDPE-026',   'HDPE高密度聚乙烯瓶',   '包材', 300,'只',0.005,'内包装',1),
  ROW(80, 'PKG-CAP-027',    '铝盖',                  '包材', 300,'只',0.005,'内包装',0),
  ROW(90, 'PKG-LBL-028',    '标签纸（不干胶）',      '包材', 300,'张',0.005,'外包装',0),
  ROW(100,'PKG-BOX-029',    '折叠纸盒',             '包材', 300,'只',0.005,'外包装',0),
  ROW(110,'PKG-CTN-030',    '纸箱（瓦楞）',           '包材',  10,'只',0.005,'外包装',0)
) AS v(line_no, mat_code, mat_name, mat_type, qty, unit, loss_rate, step, is_key)
  ON b.bom_code = 'BOM-TMJ-COL-030';

-- 最终回填所有BOM明细的 material_id
UPDATE base_bom_detail bd
JOIN base_bom b ON bd.bom_id = b.id
JOIN base_material m ON bd.material_code = m.material_code
SET bd.material_id = m.id
WHERE b.bom_code LIKE 'BOM-TMJ-%' AND bd.material_id = 0;

-- ============================================================
-- 3. QC质检方案 + 质检项目（qms_qc_scheme + qms_qc_scheme_detail）
--    为6个成品各建一套成品出厂检验方案（FQC）
-- ============================================================

-- 删除已有的6成品FQC方案（避免重复）
DELETE FROM qms_qc_scheme_detail WHERE scheme_id IN (
  SELECT id FROM qms_qc_scheme WHERE scheme_code LIKE 'QCS-FQC-TMJ-%'
);
DELETE FROM qms_qc_scheme WHERE scheme_code LIKE 'QCS-FQC-TMJ-%';

-- 插入6个成品的FQC方案主表
INSERT INTO qms_qc_scheme
  (scheme_code, scheme_name, material_id, material_code, check_type, status, deleted, create_time)
VALUES
('QCS-FQC-TMJ-025','维C咀嚼片成品出厂检验方案',   31,'PROD-TAB-025', 3, 1, 0, NOW()),
('QCS-FQC-TMJ-026','钙维生素D软胶囊成品出厂检验方案',32,'PROD-CAP-026', 3, 1, 0, NOW()),
('QCS-FQC-TMJ-027','乳清蛋白粉成品出厂检验方案',   33,'PROD-PWD-027', 3, 1, 0, NOW()),
('QCS-FQC-TMJ-028','葡萄糖酸锌口服液成品出厂检验方案',34,'PROD-LIQ-028',3, 1, 0, NOW()),
('QCS-FQC-TMJ-029','鱼油软胶囊成品出厂检验方案',
  (SELECT id FROM base_material WHERE material_code='PROD-FIG-029' LIMIT 1),
  'PROD-FIG-029', 3, 1, 0, NOW()),
('QCS-FQC-TMJ-030','胶原蛋白口服液成品出厂检验方案',36,'PROD-COL-030', 3, 1, 0, NOW());

-- ─── QC明细：维C咀嚼片 QCS-FQC-TMJ-025 ────────────────────
INSERT INTO qms_qc_scheme_detail
  (scheme_id, item_id, item_code, item_name, spec_min, spec_max, spec_text, is_required, sort_no)
SELECT s.id, 0, v.item_code, v.item_name, v.spec_min, v.spec_max, v.spec_text, 1, v.sort_no
FROM qms_qc_scheme s
JOIN (VALUES
  ROW('QCI-TAB-001','外观检查',          NULL,NULL,'片面光滑，色泽均匀，无裂片、缺角，符合橙色外观',10),
  ROW('QCI-TAB-002','片重差异',          -5.0, 5.0,'平均片重±5%以内（RSD≤3%）',20),
  ROW('QCI-TAB-003','硬度',              3.0, 15.0,'3~15 N',30),
  ROW('QCI-TAB-004','崩解时限',          NULL, 5.0,'≤5 min（口腔崩解片标准）',40),
  ROW('QCI-TAB-005','维生素C含量',       90.0,110.0,'标示量的90%~110%（HPLC法）',50),
  ROW('QCI-TAB-006','水分',              NULL,  5.0,'≤5.0%（烘干法）',60),
  ROW('QCI-TAB-007','微生物限度-菌落总数',NULL,1000.0,'≤1000 CFU/g',70),
  ROW('QCI-TAB-008','微生物限度-霉菌和酵母菌',NULL,100.0,'≤100 CFU/g',80),
  ROW('QCI-TAB-009','大肠菌群',          NULL,  NULL,'不得检出（每g不得有大肠菌群）',90),
  ROW('QCI-TAB-010','净含量',            -3.0,  NULL,'负偏差≤3%（GB 14881）',100)
) AS v(item_code, item_name, spec_min, spec_max, spec_text, sort_no)
ON s.scheme_code = 'QCS-FQC-TMJ-025';

-- ─── QC明细：钙维生素D软胶囊 QCS-FQC-TMJ-026 ──────────────
INSERT INTO qms_qc_scheme_detail
  (scheme_id, item_id, item_code, item_name, spec_min, spec_max, spec_text, is_required, sort_no)
SELECT s.id, 0, v.item_code, v.item_name, v.spec_min, v.spec_max, v.spec_text, 1, v.sort_no
FROM qms_qc_scheme s
JOIN (VALUES
  ROW('QCI-SGC-001','外观检查',              NULL,NULL,'囊壳透明或半透明，无气泡、变形、泄漏',10),
  ROW('QCI-SGC-002','装量差异',              -7.5, 7.5,'平均装量±7.5%（药典规定）',20),
  ROW('QCI-SGC-003','崩解时限',              NULL,30.0,'≤30 min（37℃水中）',30),
  ROW('QCI-SGC-004','钙含量',                90.0,110.0,'标示量的90%~110%（EDTA滴定法）',40),
  ROW('QCI-SGC-005','维生素D3含量',          85.0,115.0,'标示量的85%~115%（HPLC法）',50),
  ROW('QCI-SGC-006','过氧化值',              NULL, 10.0,'≤10 meq/kg（鱼油/油脂质量控制）',60),
  ROW('QCI-SGC-007','水分（囊壳）',          NULL, 15.0,'≤15%（KF法）',70),
  ROW('QCI-SGC-008','微生物限度-菌落总数',   NULL,1000.0,'≤1000 CFU/g',80),
  ROW('QCI-SGC-009','净含量',                -3.0, NULL,'负偏差≤3%',90)
) AS v(item_code, item_name, spec_min, spec_max, spec_text, sort_no)
ON s.scheme_code = 'QCS-FQC-TMJ-026';

-- ─── QC明细：乳清蛋白粉 QCS-FQC-TMJ-027 ──────────────────
INSERT INTO qms_qc_scheme_detail
  (scheme_id, item_id, item_code, item_name, spec_min, spec_max, spec_text, is_required, sort_no)
SELECT s.id, 0, v.item_code, v.item_name, v.spec_min, v.spec_max, v.spec_text, 1, v.sort_no
FROM qms_qc_scheme s
JOIN (VALUES
  ROW('QCI-PWD-001','外观检查',         NULL,NULL,'粉末细腻均匀，无结块，色泽一致（乳白色至微黄色）',10),
  ROW('QCI-PWD-002','蛋白质含量',       75.0,NULL,'≥75%（凯氏定氮法，以干基计）',20),
  ROW('QCI-PWD-003','水分',             NULL, 6.0,'≤6.0%（烘干法 105℃/2h）',30),
  ROW('QCI-PWD-004','脂肪',             NULL, 8.0,'≤8.0%（索氏提取法）',40),
  ROW('QCI-PWD-005','灰分',             NULL, 4.0,'≤4.0%（550℃灼烧）',50),
  ROW('QCI-PWD-006','pH值',             6.0,  7.5,'6.0~7.5（1%水溶液）',60),
  ROW('QCI-PWD-007','溶解度',           95.0,NULL,'≥95%（30℃水中）',70),
  ROW('QCI-PWD-008','微生物限度-菌落总数',NULL,10000.0,'≤10000 CFU/g',80),
  ROW('QCI-PWD-009','沙门氏菌',         NULL,NULL,'每25g不得检出',90),
  ROW('QCI-PWD-010','净含量',           -3.0,NULL,'负偏差≤3%',100)
) AS v(item_code, item_name, spec_min, spec_max, spec_text, sort_no)
ON s.scheme_code = 'QCS-FQC-TMJ-027';

-- ─── QC明细：葡萄糖酸锌口服液 QCS-FQC-TMJ-028 ────────────
INSERT INTO qms_qc_scheme_detail
  (scheme_id, item_id, item_code, item_name, spec_min, spec_max, spec_text, is_required, sort_no)
SELECT s.id, 0, v.item_code, v.item_name, v.spec_min, v.spec_max, v.spec_text, 1, v.sort_no
FROM qms_qc_scheme s
JOIN (VALUES
  ROW('QCI-LIQ-001','外观检查',          NULL,NULL,'澄清液体，淡橙色，无沉淀，无异物',10),
  ROW('QCI-LIQ-002','pH值',              3.5,  5.5,'3.5~5.5',20),
  ROW('QCI-LIQ-003','锌含量',            90.0,110.0,'标示量的90%~110%（原子吸收分光光度法）',30),
  ROW('QCI-LIQ-004','相对密度',          1.02, 1.10,'1.02~1.10（密度计法，20℃）',40),
  ROW('QCI-LIQ-005','装量',              -3.0, NULL,'负偏差≤3%（每支10ml）',50),
  ROW('QCI-LIQ-006','微生物限度-菌落总数',NULL,100.0,'≤100 CFU/mL',60),
  ROW('QCI-LIQ-007','霉菌和酵母菌',      NULL, 10.0,'≤10 CFU/mL',70),
  ROW('QCI-LIQ-008','大肠菌群',          NULL, NULL,'不得检出',80),
  ROW('QCI-LIQ-009','密封性检验',        NULL, NULL,'模拟跌落试验，无泄漏（5支/批次）',90),
  ROW('QCI-LIQ-010','标签检查',          NULL, NULL,'批号、生产日期、保质期、执行标准印刷清晰',100)
) AS v(item_code, item_name, spec_min, spec_max, spec_text, sort_no)
ON s.scheme_code = 'QCS-FQC-TMJ-028';

-- ─── QC明细：鱼油软胶囊 QCS-FQC-TMJ-029 ──────────────────
INSERT INTO qms_qc_scheme_detail
  (scheme_id, item_id, item_code, item_name, spec_min, spec_max, spec_text, is_required, sort_no)
SELECT s.id, 0, v.item_code, v.item_name, v.spec_min, v.spec_max, v.spec_text, 1, v.sort_no
FROM qms_qc_scheme s
JOIN (VALUES
  ROW('QCI-FO-001','外观检查',             NULL,NULL,'囊壳透明光亮，内容物淡黄色，无气泡、变形',10),
  ROW('QCI-FO-002','装量差异',             -7.5, 7.5,'平均装量±7.5%',20),
  ROW('QCI-FO-003','崩解时限',             NULL,30.0,'≤30 min（37℃水中）',30),
  ROW('QCI-FO-004','EPA+DHA总含量',        90.0,NULL,'≥标示量×90%（GC法）',40),
  ROW('QCI-FO-005','过氧化值（POV）',      NULL, 6.0,'≤6 meq/kg（GB 5009.227）',50),
  ROW('QCI-FO-006','酸值',                 NULL, 2.0,'≤2.0 mg KOH/g',60),
  ROW('QCI-FO-007','维生素E含量',          85.0,115.0,'标示量的85%~115%（HPLC法）',70),
  ROW('QCI-FO-008','重金属-铅',            NULL, 0.5,'≤0.5 mg/kg（原子吸收法）',80),
  ROW('QCI-FO-009','重金属-汞',            NULL, 0.1,'≤0.1 mg/kg',90),
  ROW('QCI-FO-010','微生物限度-菌落总数',  NULL,1000.0,'≤1000 CFU/g',100)
) AS v(item_code, item_name, spec_min, spec_max, spec_text, sort_no)
ON s.scheme_code = 'QCS-FQC-TMJ-029';

-- ─── QC明细：胶原蛋白口服液 QCS-FQC-TMJ-030 ──────────────
INSERT INTO qms_qc_scheme_detail
  (scheme_id, item_id, item_code, item_name, spec_min, spec_max, spec_text, is_required, sort_no)
SELECT s.id, 0, v.item_code, v.item_name, v.spec_min, v.spec_max, v.spec_text, 1, v.sort_no
FROM qms_qc_scheme s
JOIN (VALUES
  ROW('QCI-COL-001','外观检查',            NULL,NULL,'澄清透明或微乳浊，淡黄色，无沉淀，无异物',10),
  ROW('QCI-COL-002','胶原蛋白肽含量',      90.0,NULL,'≥标示量×90%（BCA蛋白定量法）',20),
  ROW('QCI-COL-003','维生素C含量',         85.0,115.0,'标示量的85%~115%（HPLC法）',30),
  ROW('QCI-COL-004','pH值',                3.5,  5.0,'3.5~5.0',40),
  ROW('QCI-COL-005','相对密度',            1.05, 1.15,'1.05~1.15（20℃）',50),
  ROW('QCI-COL-006','装量',                -3.0, NULL,'负偏差≤3%（每瓶50ml）',60),
  ROW('QCI-COL-007','微生物限度-菌落总数', NULL, 100.0,'≤100 CFU/mL',70),
  ROW('QCI-COL-008','霉菌和酵母菌',        NULL,  10.0,'≤10 CFU/mL',80),
  ROW('QCI-COL-009','大肠菌群',            NULL,  NULL,'不得检出',90),
  ROW('QCI-COL-010','密封性检验',          NULL,  NULL,'外盖扭矩检测≥1.5 N·m，无泄漏',100),
  ROW('QCI-COL-011','标签核对',            NULL,  NULL,'批号、有效期、条形码与工单一致',110)
) AS v(item_code, item_name, spec_min, spec_max, spec_text, sort_no)
ON s.scheme_code = 'QCS-FQC-TMJ-030';

SET foreign_key_checks = 1;

-- ============================================================
-- 验证插入结果
-- ============================================================
SELECT '=== BOM汇总 ===' AS '';
SELECT b.bom_code, b.material_name, b.batch_size, b.batch_unit,
       COUNT(d.id) AS 明细行数
FROM base_bom b
LEFT JOIN base_bom_detail d ON d.bom_id = b.id
WHERE b.bom_code LIKE 'BOM-TMJ-%'
GROUP BY b.id
ORDER BY b.bom_code;

SELECT '=== QC方案汇总 ===' AS '';
SELECT s.scheme_code, s.scheme_name, COUNT(sd.id) AS 检验项目数
FROM qms_qc_scheme s
LEFT JOIN qms_qc_scheme_detail sd ON sd.scheme_id = s.id
WHERE s.scheme_code LIKE 'QCS-FQC-TMJ-%'
GROUP BY s.id
ORDER BY s.scheme_code;

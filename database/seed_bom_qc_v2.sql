-- ============================================================
-- 天美健MES — BOM物料清单 + FQC质检方案演示数据 v2
-- 覆盖截图中6个成品（使用实际数据库中已有的物料编码）：
--   id=31  PROD-TAB-025  维C咀嚼片          0.5g×60片/瓶
--   id=32  PROD-CAP-026  钙维生素D软胶囊     1.0g×60粒/瓶
--   id=33  PROD-PWD-027  乳清蛋白粉          10g×30袋/盒
--   id=34  PROD-LIQ-028  葡萄糖酸锌口服液    10ml×30支/盒
--   id=35  PROD-FIS-029  鱼油软胶囊          1.0g×60粒/瓶  (DB中code=FIS)
--   id=36  PROD-COL-030  胶原蛋白口服液      50ml×8瓶/盒
-- ============================================================

SET NAMES utf8mb4;
SET foreign_key_checks = 0;

-- ============================================================
-- 1. 补充缺失辅料（INSERT IGNORE 安全重入）
-- ============================================================
INSERT IGNORE INTO base_material
  (material_code, material_name, spec, category_id, unit_id, status, deleted, create_time)
VALUES
  ('AUX-SOR-001', '山梨醇（颗粒级）',       '食品级/药用级',   7,  2, 1, 0, NOW()),
  ('AUX-MG-001',  '硬脂酸镁',               '药用级',          7,  2, 1, 0, NOW()),
  ('AUX-CIT-001', '柠檬酸（无水）',          '食品级',          7,  2, 1, 0, NOW()),
  ('AUX-ORA-001', '橙味香精',               '食品级',          7,  2, 1, 0, NOW()),
  ('AUX-GEL-001', '明胶（软胶囊用）',        '药用级',          7,  2, 1, 0, NOW()),
  ('AUX-GLY-001', '甘油（药用）',            '药用级',          7,  3, 1, 0, NOW()),
  ('AUX-VE-001',  '维生素E油（载体）',        '食品级',          4,  2, 1, 0, NOW()),
  ('AUX-COC-001', '可可粉（荷兰式）',         '食品级',          7,  2, 1, 0, NOW()),
  ('AUX-STW-001', '甜菊糖苷',               '食品级',          7,  2, 1, 0, NOW()),
  ('AUX-PWT-001', '纯化水',                  '制药用水',        7,  3, 1, 0, NOW()),
  ('AUX-SBT-001', '山梨酸钾',               '食品级',          7,  2, 1, 0, NOW()),
  ('AUX-FLA-001', '橙味调味料',             '食品级',          7,  2, 1, 0, NOW()),
  ('AUX-ZNG-001', '葡萄糖酸锌原料液',        '食品级',          5,  3, 1, 0, NOW()),
  ('AUX-COL-LIQ-001','胶原蛋白肽液体原料',   '食品级',          6,  3, 1, 0, NOW()),
  ('AUX-VC-LIQ-001', '维生素C（液体）',      '食品级',          4,  3, 1, 0, NOW()),
  ('AUX-HNY-001', '蜂蜜',                   '食品级',          7,  3, 1, 0, NOW()),
  ('AUX-MCT-001', 'MCT中链甘油三酯（载体）', '食品级',          7,  2, 1, 0, NOW()),
  ('AUX-OAT-001', '燕麦油',                 '食品级',          7,  3, 1, 0, NOW());

-- ============================================================
-- 2. 清除旧BOM数据（幂等重入）
-- ============================================================
DELETE FROM base_bom_detail WHERE bom_id IN (
  SELECT id FROM base_bom WHERE bom_code LIKE 'BOM-TMJ-%'
);
DELETE FROM base_bom WHERE bom_code LIKE 'BOM-TMJ-%';

-- ============================================================
-- 3. BOM 主表
-- ============================================================
INSERT INTO base_bom
  (bom_code, bom_version, material_id, material_code, material_name,
   batch_size, batch_unit, bom_status, effective_date, deleted, create_time, create_by)
VALUES
('BOM-TMJ-TAB-025','V1.0', 31,'PROD-TAB-025','维C咀嚼片',
  1000,'瓶','APPROVED','2026-01-01', 0, NOW(),'admin'),
('BOM-TMJ-CAP-026','V1.0', 32,'PROD-CAP-026','钙维生素D软胶囊',
  1000,'瓶','APPROVED','2026-01-01', 0, NOW(),'admin'),
('BOM-TMJ-PWD-027','V1.0', 33,'PROD-PWD-027','乳清蛋白粉',
  500, '盒','APPROVED','2026-01-01', 0, NOW(),'admin'),
('BOM-TMJ-LIQ-028','V1.0', 34,'PROD-LIQ-028','葡萄糖酸锌口服液',
  500, '盒','APPROVED','2026-01-01', 0, NOW(),'admin'),
('BOM-TMJ-FIS-029','V1.0', 35,'PROD-FIS-029','鱼油软胶囊',
  1000,'瓶','APPROVED','2026-01-01', 0, NOW(),'admin'),
('BOM-TMJ-COL-030','V1.0', 36,'PROD-COL-030','胶原蛋白口服液',
  300, '盒','APPROVED','2026-01-01', 0, NOW(),'admin');

-- ============================================================
-- 4. BOM明细（分批插入，使用code回填material_id）
-- ============================================================

-- ─── BOM-TMJ-TAB-025：维C咀嚼片 ────────────────────────────
-- 批量：1000瓶  每瓶60片×0.5g=30g  原料：维C+山梨醇+硬脂酸镁+柠檬酸+橙味香精
INSERT INTO base_bom_detail
  (bom_id, line_no, material_id, material_code, material_name, material_type,
   qty, unit_name, loss_rate, process_step, is_key_material, deleted, create_time)
SELECT b.id,
       v.line_no,
       COALESCE((SELECT m.id FROM base_material m WHERE m.material_code = v.mat_code LIMIT 1), 0),
       v.mat_code, v.mat_name, v.mat_type,
       v.qty, v.unit, v.loss_rate, v.step, v.is_key, 0, NOW()
FROM base_bom b
CROSS JOIN (
  SELECT 10  AS line_no, 'MAT-VC-001'   AS mat_code, '维生素C（抗坏血酸）'    AS mat_name, '原料' AS mat_type, 15.00  AS qty, 'kg' AS unit, 0.020 AS loss_rate, '称量配料' AS step, 1 AS is_key UNION ALL
  SELECT 20, 'AUX-SOR-001','山梨醇（颗粒级）',    '辅料', 180.00,'kg', 0.010,'称量配料',0 UNION ALL
  SELECT 30, 'AUX-MG-001', '硬脂酸镁',            '辅料',   1.50,'kg', 0.010,'称量配料',0 UNION ALL
  SELECT 40, 'AUX-CIT-001','柠檬酸（无水）',       '辅料',   3.00,'kg', 0.010,'称量配料',0 UNION ALL
  SELECT 50, 'AUX-ORA-001','橙味香精',             '辅料',   0.80,'kg', 0.005,'称量配料',0 UNION ALL
  SELECT 60, 'PKG-HDPE-026','HDPE高密度聚乙烯瓶',  '包材',1000.00,'只', 0.005,'内包装',  1 UNION ALL
  SELECT 70, 'PKG-CAP-027', '铝盖',                '包材',1000.00,'只', 0.005,'内包装',  0 UNION ALL
  SELECT 80, 'PKG-LBL-028', '标签纸（不干胶）',    '包材',1000.00,'张', 0.005,'外包装',  0 UNION ALL
  SELECT 90, 'PKG-BOX-029', '折叠纸盒',            '包材',  50.00,'只', 0.005,'外包装',  0 UNION ALL
  SELECT 100,'PKG-CTN-030', '纸箱（瓦楞）',         '包材',  10.00,'只', 0.005,'外包装',  0
) v
WHERE b.bom_code = 'BOM-TMJ-TAB-025';

-- ─── BOM-TMJ-CAP-026：钙维生素D软胶囊 ─────────────────────
-- 批量：1000瓶  软胶囊：明胶+甘油+VE载体
INSERT INTO base_bom_detail
  (bom_id, line_no, material_id, material_code, material_name, material_type,
   qty, unit_name, loss_rate, process_step, is_key_material, deleted, create_time)
SELECT b.id,
       v.line_no,
       COALESCE((SELECT m.id FROM base_material m WHERE m.material_code = v.mat_code LIMIT 1), 0),
       v.mat_code, v.mat_name, v.mat_type,
       v.qty, v.unit, v.loss_rate, v.step, v.is_key, 0, NOW()
FROM base_bom b
CROSS JOIN (
  SELECT 10  AS line_no, 'MAT-CA-005'   AS mat_code, '碳酸钙'               AS mat_name, '原料' AS mat_type,  60.00 AS qty, 'kg' AS unit, 0.020 AS loss_rate, '称量配料' AS step, 1 AS is_key UNION ALL
  SELECT 20, 'MAT-VD-002',  '维生素D3（胆钙化醇）', '原料',  0.01,'kg', 0.020,'称量配料',1 UNION ALL
  SELECT 30, 'AUX-GEL-001','明胶（软胶囊用）',      '辅料', 40.00,'kg', 0.010,'制粒压片',0 UNION ALL
  SELECT 40, 'AUX-GLY-001','甘油（药用）',           '辅料', 20.00,'kg', 0.010,'制粒压片',0 UNION ALL
  SELECT 50, 'AUX-VE-001', '维生素E油（载体）',      '辅料', 80.00,'kg', 0.005,'称量配料',0 UNION ALL
  SELECT 60, 'PKG-HDPE-026','HDPE高密度聚乙烯瓶',   '包材',1000.00,'只',0.005,'内包装',  1 UNION ALL
  SELECT 70, 'PKG-CAP-027', '铝盖',                 '包材',1000.00,'只',0.005,'内包装',  0 UNION ALL
  SELECT 80, 'PKG-LBL-028', '标签纸（不干胶）',     '包材',1000.00,'张',0.005,'外包装',  0 UNION ALL
  SELECT 90, 'PKG-BOX-029', '折叠纸盒',             '包材',  50.00,'只',0.005,'外包装',  0 UNION ALL
  SELECT 100,'PKG-CTN-030', '纸箱（瓦楞）',          '包材',  10.00,'只',0.005,'外包装',  0
) v
WHERE b.bom_code = 'BOM-TMJ-CAP-026';

-- ─── BOM-TMJ-PWD-027：乳清蛋白粉 ──────────────────────────
-- 批量：500盒  每盒10g×30袋  分袋包装
INSERT INTO base_bom_detail
  (bom_id, line_no, material_id, material_code, material_name, material_type,
   qty, unit_name, loss_rate, process_step, is_key_material, deleted, create_time)
SELECT b.id,
       v.line_no,
       COALESCE((SELECT m.id FROM base_material m WHERE m.material_code = v.mat_code LIMIT 1), 0),
       v.mat_code, v.mat_name, v.mat_type,
       v.qty, v.unit, v.loss_rate, v.step, v.is_key, 0, NOW()
FROM base_bom b
CROSS JOIN (
  SELECT 10  AS line_no, 'MAT-WPI-009' AS mat_code, '乳清蛋白粉（WPI90）'  AS mat_name, '原料' AS mat_type, 3500.00 AS qty, 'g' AS unit, 0.010 AS loss_rate, '称量配料' AS step, 1 AS is_key UNION ALL
  SELECT 20, 'AUX-COC-001','可可粉（荷兰式）',  '辅料',  350.00,'g', 0.010,'称量配料',0 UNION ALL
  SELECT 30, 'AUX-STW-001','甜菊糖苷',          '辅料',   20.00,'g', 0.010,'称量配料',0 UNION ALL
  SELECT 40, 'AUX-VE-001', '维生素E油（载体）', '辅料',   10.00,'g', 0.005,'称量配料',0 UNION ALL
  SELECT 50, 'PKG-ALU-025','铝塑复合膜（OPA/AL/PVC）','包材',500.00,'m', 0.010,'内包装',1 UNION ALL
  SELECT 60, 'PKG-BOX-029','折叠纸盒',          '包材',  500.00,'只',0.005,'外包装',  0 UNION ALL
  SELECT 70, 'PKG-CTN-030','纸箱（瓦楞）',       '包材',   10.00,'只',0.005,'外包装',  0
) v
WHERE b.bom_code = 'BOM-TMJ-PWD-027';

-- ─── BOM-TMJ-LIQ-028：葡萄糖酸锌口服液 ───────────────────
-- 批量：500盒  每盒10ml×30支  口服液剂型
INSERT INTO base_bom_detail
  (bom_id, line_no, material_id, material_code, material_name, material_type,
   qty, unit_name, loss_rate, process_step, is_key_material, deleted, create_time)
SELECT b.id,
       v.line_no,
       COALESCE((SELECT m.id FROM base_material m WHERE m.material_code = v.mat_code LIMIT 1), 0),
       v.mat_code, v.mat_name, v.mat_type,
       v.qty, v.unit, v.loss_rate, v.step, v.is_key, 0, NOW()
FROM base_bom b
CROSS JOIN (
  SELECT 10  AS line_no, 'MAT-ZN-006'   AS mat_code, '葡萄糖酸锌'          AS mat_name, '原料' AS mat_type,  5.00 AS qty, 'kg' AS unit, 0.020 AS loss_rate, '称量配料' AS step, 1 AS is_key UNION ALL
  SELECT 20, 'AUX-PWT-001','纯化水',              '辅料',130.00,'L',  0.005,'配液',      0 UNION ALL
  SELECT 30, 'AUX-SBT-001','山梨酸钾',            '辅料',  0.05,'kg', 0.010,'称量配料',  0 UNION ALL
  SELECT 40, 'AUX-FLA-001','橙味调味料',          '辅料',  0.20,'kg', 0.010,'称量配料',  0 UNION ALL
  SELECT 50, 'PKG-ALU-025','铝塑复合膜（OPA/AL/PVC）','包材',500.00,'m',0.010,'内包装',  1 UNION ALL
  SELECT 60, 'PKG-BOX-029','折叠纸盒',            '包材',  500.00,'只',0.005,'外包装',   0 UNION ALL
  SELECT 70, 'PKG-CTN-030','纸箱（瓦楞）',         '包材',   10.00,'只',0.005,'外包装',   0
) v
WHERE b.bom_code = 'BOM-TMJ-LIQ-028';

-- ─── BOM-TMJ-FIS-029：鱼油软胶囊 ─────────────────────────
-- 批量：1000瓶  每瓶60粒×1g  深海鱼油+MCT+VE
INSERT INTO base_bom_detail
  (bom_id, line_no, material_id, material_code, material_name, material_type,
   qty, unit_name, loss_rate, process_step, is_key_material, deleted, create_time)
SELECT b.id,
       v.line_no,
       COALESCE((SELECT m.id FROM base_material m WHERE m.material_code = v.mat_code LIMIT 1), 0),
       v.mat_code, v.mat_name, v.mat_type,
       v.qty, v.unit, v.loss_rate, v.step, v.is_key, 0, NOW()
FROM base_bom b
CROSS JOIN (
  SELECT 10  AS line_no, 'MAT-FO-012'   AS mat_code, '深海鱼油（EPAX挪威）' AS mat_name, '原料' AS mat_type,  40.00 AS qty, 'kg' AS unit, 0.020 AS loss_rate, '称量配料' AS step, 1 AS is_key UNION ALL
  SELECT 20, 'AUX-MCT-001','MCT中链甘油三酯（载体）','辅料', 15.00,'kg', 0.010,'称量配料',0 UNION ALL
  SELECT 30, 'MAT-VE-003', '维生素E（d-α-生育酚）', '辅料',  0.50,'kg', 0.010,'称量配料',0 UNION ALL
  SELECT 40, 'AUX-GEL-001','明胶（软胶囊用）',       '辅料', 30.00,'kg', 0.010,'压丸',     0 UNION ALL
  SELECT 50, 'AUX-GLY-001','甘油（药用）',            '辅料', 15.00,'kg', 0.010,'压丸',     0 UNION ALL
  SELECT 60, 'PKG-HDPE-026','HDPE高密度聚乙烯瓶',    '包材',1000.00,'只',0.005,'内包装',   1 UNION ALL
  SELECT 70, 'PKG-CAP-027', '铝盖',                  '包材',1000.00,'只',0.005,'内包装',   0 UNION ALL
  SELECT 80, 'PKG-LBL-028', '标签纸（不干胶）',      '包材',1000.00,'张',0.005,'外包装',   0 UNION ALL
  SELECT 90, 'PKG-BOX-029', '折叠纸盒',              '包材',  50.00,'只',0.005,'外包装',   0 UNION ALL
  SELECT 100,'PKG-CTN-030', '纸箱（瓦楞）',           '包材',  10.00,'只',0.005,'外包装',   0
) v
WHERE b.bom_code = 'BOM-TMJ-FIS-029';

-- ─── BOM-TMJ-COL-030：胶原蛋白口服液 ─────────────────────
-- 批量：300盒  每盒50ml×8瓶  胶原蛋白肽+VC+蜂蜜
INSERT INTO base_bom_detail
  (bom_id, line_no, material_id, material_code, material_name, material_type,
   qty, unit_name, loss_rate, process_step, is_key_material, deleted, create_time)
SELECT b.id,
       v.line_no,
       COALESCE((SELECT m.id FROM base_material m WHERE m.material_code = v.mat_code LIMIT 1), 0),
       v.mat_code, v.mat_name, v.mat_type,
       v.qty, v.unit, v.loss_rate, v.step, v.is_key, 0, NOW()
FROM base_bom b
CROSS JOIN (
  SELECT 10  AS line_no, 'MAT-COL-011'     AS mat_code, '胶原蛋白肽（海洋来源）' AS mat_name, '原料' AS mat_type,  30.00 AS qty, 'kg' AS unit, 0.020 AS loss_rate, '称量配料' AS step, 1 AS is_key UNION ALL
  SELECT 20, 'MAT-VC-001',    '维生素C（抗坏血酸）', '原料',   2.00,'kg', 0.020,'称量配料',1 UNION ALL
  SELECT 30, 'AUX-HNY-001',  '蜂蜜',                '辅料',  10.00,'kg', 0.010,'称量配料',0 UNION ALL
  SELECT 40, 'AUX-PWT-001',  '纯化水',              '辅料',  60.00,'L',  0.005,'配液',     0 UNION ALL
  SELECT 50, 'AUX-SBT-001',  '山梨酸钾',            '辅料',   0.04,'kg', 0.010,'称量配料', 0 UNION ALL
  SELECT 60, 'PKG-ALU-025',  '铝塑复合膜（OPA/AL/PVC）','包材',300.00,'m',0.010,'内包装',  1 UNION ALL
  SELECT 70, 'PKG-BOX-029',  '折叠纸盒',            '包材',  300.00,'只',0.005,'外包装',   0 UNION ALL
  SELECT 80, 'PKG-LBL-028',  '标签纸（不干胶）',    '包材',  300.00,'张',0.005,'外包装',   0 UNION ALL
  SELECT 90, 'PKG-CTN-030',  '纸箱（瓦楞）',         '包材',   10.00,'只',0.005,'外包装',   0
) v
WHERE b.bom_code = 'BOM-TMJ-COL-030';

-- ============================================================
-- 5. 清除旧FQC方案（BOM-TMJ 对应的6个成品FQC，幂等）
-- ============================================================
DELETE FROM qms_qc_scheme_detail WHERE scheme_id IN (
  SELECT id FROM qms_qc_scheme WHERE scheme_code LIKE 'QCS-FQC-TMJ-%'
);
DELETE FROM qms_qc_scheme WHERE scheme_code LIKE 'QCS-FQC-TMJ-%';

-- ============================================================
-- 6. FQC 质检方案主表（6个成品各一套）
--    check_type: 3 = FQC 成品检验
-- ============================================================
INSERT INTO qms_qc_scheme
  (scheme_code, scheme_name, material_id, material_code, check_type, status, deleted, create_time)
VALUES
('QCS-FQC-TMJ-025','维C咀嚼片成品检验方案',             31,'PROD-TAB-025',3,1,0,NOW()),
('QCS-FQC-TMJ-026','钙维生素D软胶囊成品检验方案',       32,'PROD-CAP-026',3,1,0,NOW()),
('QCS-FQC-TMJ-027','乳清蛋白粉成品检验方案',            33,'PROD-PWD-027',3,1,0,NOW()),
('QCS-FQC-TMJ-028','葡萄糖酸锌口服液成品检验方案',      34,'PROD-LIQ-028',3,1,0,NOW()),
('QCS-FQC-TMJ-029','鱼油软胶囊成品检验方案',            35,'PROD-FIS-029',3,1,0,NOW()),
('QCS-FQC-TMJ-030','胶原蛋白口服液成品检验方案',        36,'PROD-COL-030',3,1,0,NOW());

-- ============================================================
-- 7. FQC 质检方案明细（每个成品 10~11 项检验指标）
--    item_id 直接用 0（无外键约束），item_code/name 手写
-- ============================================================

-- ── QCS-FQC-TMJ-025：维C咀嚼片 ──────────────────────────
INSERT INTO qms_qc_scheme_detail
  (scheme_id, item_id, item_code, item_name, spec_min, spec_max, spec_text, is_required, sort_no)
SELECT s.id,
       0, v.item_code, v.item_name, v.spec_min, v.spec_max, v.spec_text, v.is_required, v.sort_no
FROM qms_qc_scheme s
CROSS JOIN (
  SELECT 'QCI-ORG-001' AS item_code, '性状（外观）'      AS item_name, NULL AS spec_min, NULL AS spec_max, '橙色，圆形压制片，有橙味，无异臭'                    AS spec_text, 1 AS is_required,  1 AS sort_no UNION ALL
  SELECT 'QCI-WT-001',  '片重差异',                      NULL, NULL, '标示量的±5%以内',                                                                            1,  2 UNION ALL
  SELECT 'QCI-WT-002',  '平均片重',                      0.48,  0.52,'目标值0.50g，允差±0.02g',                                                                    1,  3 UNION ALL
  SELECT 'QCI-HAR-001', '硬度',                          30.00, NULL,'≥30N（牛顿）',                                                                               1,  4 UNION ALL
  SELECT 'QCI-FRI-001', '脆碎度',                        NULL,  1.00,'≤1.0%',                                                                                      1,  5 UNION ALL
  SELECT 'QCI-DIS-001', '崩解时限（口腔）',              NULL,  3.00,'≤3min（37℃水中）',                                                                           1,  6 UNION ALL
  SELECT 'QCI-VC-001',  '维生素C含量',                   95.00,105.00,'标示量的95%~105%（HPLC法）',                                                                 1,  7 UNION ALL
  SELECT 'QCI-MIC-001', '菌落总数',                      NULL,1000.00,'≤1000 CFU/g',                                                                               1,  8 UNION ALL
  SELECT 'QCI-MIC-002', '大肠菌群',                      NULL,  NULL, '不得检出（/g）',                                                                             1,  9 UNION ALL
  SELECT 'QCI-PKG-001', '净含量',                        NULL,  NULL, '每瓶60片，允差±2片',                                                                         1, 10 UNION ALL
  SELECT 'QCI-PKG-002', '标签合规',                      NULL,  NULL, '品名/批号/生产日期/有效期/执行标准/生产许可证号齐全',                                        1, 11
) v
WHERE s.scheme_code = 'QCS-FQC-TMJ-025';

-- ── QCS-FQC-TMJ-026：钙维生素D软胶囊 ────────────────────
INSERT INTO qms_qc_scheme_detail
  (scheme_id, item_id, item_code, item_name, spec_min, spec_max, spec_text, is_required, sort_no)
SELECT s.id,
       0, v.item_code, v.item_name, v.spec_min, v.spec_max, v.spec_text, v.is_required, v.sort_no
FROM qms_qc_scheme s
CROSS JOIN (
  SELECT 'QCI-ORG-001' AS item_code, '性状（外观）'     AS item_name, NULL AS spec_min, NULL AS spec_max, '淡黄色软胶囊，囊壳光滑无气泡，内容物流动性好'     AS spec_text, 1 AS is_required,  1 AS sort_no UNION ALL
  SELECT 'QCI-WT-003',  '粒重差异',                     NULL, NULL, '标示量的±8%以内',                                                                            1,  2 UNION ALL
  SELECT 'QCI-SEAM-001','囊壳厚度',                     NULL, NULL, '均匀，无裂缝，接缝平整',                                                                     1,  3 UNION ALL
  SELECT 'QCI-LK-001',  '渗漏检查',                     NULL,  0.00,'无渗漏（抽查20粒/批，0允许）',                                                               1,  4 UNION ALL
  SELECT 'QCI-CA-001',  '钙含量',                       95.00,105.00,'标示量的95%~105%（EDTA滴定法）',                                                             1,  5 UNION ALL
  SELECT 'QCI-VD-001',  '维生素D3含量',                 90.00,120.00,'标示量的90%~120%（HPLC法）',                                                                 1,  6 UNION ALL
  SELECT 'QCI-PERX-001','过氧化值',                     NULL,  5.00,'≤5 meq/kg（鱼油类）',                                                                        1,  7 UNION ALL
  SELECT 'QCI-MIC-001', '菌落总数',                     NULL,1000.00,'≤1000 CFU/g',                                                                               1,  8 UNION ALL
  SELECT 'QCI-MIC-002', '大肠菌群',                     NULL,  NULL, '不得检出（/g）',                                                                             1,  9 UNION ALL
  SELECT 'QCI-PKG-001', '净含量',                       NULL,  NULL, '每瓶60粒，允差±2粒',                                                                         1, 10
) v
WHERE s.scheme_code = 'QCS-FQC-TMJ-026';

-- ── QCS-FQC-TMJ-027：乳清蛋白粉 ─────────────────────────
INSERT INTO qms_qc_scheme_detail
  (scheme_id, item_id, item_code, item_name, spec_min, spec_max, spec_text, is_required, sort_no)
SELECT s.id,
       0, v.item_code, v.item_name, v.spec_min, v.spec_max, v.spec_text, v.is_required, v.sort_no
FROM qms_qc_scheme s
CROSS JOIN (
  SELECT 'QCI-ORG-001' AS item_code, '性状（外观）'      AS item_name, NULL AS spec_min, NULL AS spec_max, '浅棕色均匀粉末，具有可可香气，无结块'              AS spec_text, 1 AS is_required,  1 AS sort_no UNION ALL
  SELECT 'QCI-PRO-001', '蛋白质含量',                    80.00, NULL, '≥80g/100g（凯氏定氮法）',                                                                  1,  2 UNION ALL
  SELECT 'QCI-BCAA-001','BCAA含量',                      18.00, NULL, '≥18%（支链氨基酸，HPLC法）',                                                               0,  3 UNION ALL
  SELECT 'QCI-MOIS-001','水分',                          NULL,  8.00,'≤8.0%（干燥失重法）',                                                                       1,  4 UNION ALL
  SELECT 'QCI-GRAN-001','粒度（D90）',                   NULL,200.00,'≤200μm（激光衍射法）',                                                                      0,  5 UNION ALL
  SELECT 'QCI-FLOW-001','溶解性',                        NULL,  NULL, '25g加水100ml，搅拌1min，无明显沉淀',                                                         1,  6 UNION ALL
  SELECT 'QCI-MIC-001', '菌落总数',                      NULL,10000.00,'≤10000 CFU/g（粉剂）',                                                                    1,  7 UNION ALL
  SELECT 'QCI-MIC-002', '大肠菌群',                      NULL,  NULL, '不得检出（/g）',                                                                            1,  8 UNION ALL
  SELECT 'QCI-MIC-003', '霉菌和酵母菌',                  NULL, 100.00,'≤100 CFU/g',                                                                               1,  9 UNION ALL
  SELECT 'QCI-PKG-003', '袋重差异',                      NULL,  NULL, '每袋10g±5%',                                                                               1, 10 UNION ALL
  SELECT 'QCI-PKG-002', '标签合规',                      NULL,  NULL, '品名/批号/生产日期/有效期/执行标准/生产许可证号齐全',                                       1, 11
) v
WHERE s.scheme_code = 'QCS-FQC-TMJ-027';

-- ── QCS-FQC-TMJ-028：葡萄糖酸锌口服液 ───────────────────
INSERT INTO qms_qc_scheme_detail
  (scheme_id, item_id, item_code, item_name, spec_min, spec_max, spec_text, is_required, sort_no)
SELECT s.id,
       0, v.item_code, v.item_name, v.spec_min, v.spec_max, v.spec_text, v.is_required, v.sort_no
FROM qms_qc_scheme s
CROSS JOIN (
  SELECT 'QCI-ORG-001' AS item_code, '性状（外观）'     AS item_name, NULL AS spec_min, NULL AS spec_max, '无色至淡黄色澄清液体，有橙香，味甜'                AS spec_text, 1 AS is_required,  1 AS sort_no UNION ALL
  SELECT 'QCI-PH-001',  'pH值',                         3.50,  4.50,'3.5~4.5（pH计法，25℃）',                                                                    1,  2 UNION ALL
  SELECT 'QCI-VIS-001', '澄清度',                       NULL,  NULL, '按《中国药典》澄清度检查，不浑浊',                                                          1,  3 UNION ALL
  SELECT 'QCI-ZN-001',  '锌含量（锌元素）',              9.00, 11.00,'9.0~11.0 mg/支（原子吸收法）',                                                               1,  4 UNION ALL
  SELECT 'QCI-VOL-001', '装量',                         9.80, 10.20,'每支10ml，允差±2%（容量法）',                                                                 1,  5 UNION ALL
  SELECT 'QCI-PRE-001', '防腐剂（山梨酸钾）含量',       NULL,  0.10,'≤0.10%（HPLC法）',                                                                           1,  6 UNION ALL
  SELECT 'QCI-OSM-001', '渗透压摩尔浓度',               200.00,350.00,'200~350 mOsmol/kg',                                                                        0,  7 UNION ALL
  SELECT 'QCI-MIC-004', '细菌内毒素',                   NULL,  NULL, '≤0.25EU/mL（LAL法）',                                                                       1,  8 UNION ALL
  SELECT 'QCI-MIC-001', '菌落总数',                     NULL, 100.00,'≤100 CFU/mL（口服液）',                                                                     1,  9 UNION ALL
  SELECT 'QCI-MIC-002', '大肠菌群',                     NULL,  NULL, '不得检出（/mL）',                                                                            1, 10 UNION ALL
  SELECT 'QCI-PKG-002', '标签合规',                     NULL,  NULL, '品名/批号/生产日期/有效期/执行标准/生产许可证号齐全',                                        1, 11
) v
WHERE s.scheme_code = 'QCS-FQC-TMJ-028';

-- ── QCS-FQC-TMJ-029：鱼油软胶囊 ─────────────────────────
INSERT INTO qms_qc_scheme_detail
  (scheme_id, item_id, item_code, item_name, spec_min, spec_max, spec_text, is_required, sort_no)
SELECT s.id,
       0, v.item_code, v.item_name, v.spec_min, v.spec_max, v.spec_text, v.is_required, v.sort_no
FROM qms_qc_scheme s
CROSS JOIN (
  SELECT 'QCI-ORG-001' AS item_code, '性状（外观）'     AS item_name, NULL AS spec_min, NULL AS spec_max, '淡黄色椭圆形软胶囊，囊壳光滑，内容物为淡黄色油状物' AS spec_text, 1 AS is_required,  1 AS sort_no UNION ALL
  SELECT 'QCI-WT-003',  '粒重差异',                     NULL, NULL, '标示量±8%以内',                                                                              1,  2 UNION ALL
  SELECT 'QCI-LK-001',  '渗漏检查',                     NULL,  0.00,'无渗漏（抽查20粒/批）',                                                                       1,  3 UNION ALL
  SELECT 'QCI-EPA-001', 'EPA含量',                      95.00,105.00,'标示量的95%~105%（GC法）',                                                                   1,  4 UNION ALL
  SELECT 'QCI-DHA-001', 'DHA含量',                      95.00,105.00,'标示量的95%~105%（GC法）',                                                                   1,  5 UNION ALL
  SELECT 'QCI-PERX-001','过氧化值（POV）',              NULL,  5.00,'≤5 meq/kg',                                                                                   1,  6 UNION ALL
  SELECT 'QCI-ANISV-001','茴香胺值（p-AV）',            NULL, 20.00,'≤20',                                                                                         1,  7 UNION ALL
  SELECT 'QCI-TOTOX-001','TOTOX（总氧化值）',            NULL, 26.00,'≤26（2POV+AV）',                                                                              0,  8 UNION ALL
  SELECT 'QCI-MIC-001', '菌落总数',                     NULL,1000.00,'≤1000 CFU/g',                                                                               1,  9 UNION ALL
  SELECT 'QCI-MIC-002', '大肠菌群',                     NULL,  NULL, '不得检出（/g）',                                                                              1, 10 UNION ALL
  SELECT 'QCI-PKG-001', '净含量',                       NULL,  NULL, '每瓶60粒，允差±2粒',                                                                          1, 11
) v
WHERE s.scheme_code = 'QCS-FQC-TMJ-029';

-- ── QCS-FQC-TMJ-030：胶原蛋白口服液 ─────────────────────
INSERT INTO qms_qc_scheme_detail
  (scheme_id, item_id, item_code, item_name, spec_min, spec_max, spec_text, is_required, sort_no)
SELECT s.id,
       0, v.item_code, v.item_name, v.spec_min, v.spec_max, v.spec_text, v.is_required, v.sort_no
FROM qms_qc_scheme s
CROSS JOIN (
  SELECT 'QCI-ORG-001' AS item_code, '性状（外观）'     AS item_name, NULL AS spec_min, NULL AS spec_max, '淡琥珀色澄清液体，有蜂蜜香气，口感醇甜'            AS spec_text, 1 AS is_required,  1 AS sort_no UNION ALL
  SELECT 'QCI-PH-001',  'pH值',                         3.80,  5.20,'3.8~5.2（pH计法，25℃）',                                                                    1,  2 UNION ALL
  SELECT 'QCI-VIS-001', '澄清度',                       NULL,  NULL, '澄清，允许轻微乳光（胶原蛋白肽特性）',                                                       1,  3 UNION ALL
  SELECT 'QCI-COL-001', '胶原蛋白肽含量',               95.00,105.00,'标示量的95%~105%（凯氏定氮法）',                                                             1,  4 UNION ALL
  SELECT 'QCI-MWCOL-001','胶原蛋白肽分子量分布',        NULL,  NULL, '≥50%组分分子量<3000Da（GPC法）',                                                             0,  5 UNION ALL
  SELECT 'QCI-VC-001',  '维生素C含量',                  95.00,105.00,'标示量的95%~105%（2,6-二氯靛酚法）',                                                         1,  6 UNION ALL
  SELECT 'QCI-VOL-001', '装量',                         49.00, 51.00,'每瓶50ml，允差±2%',                                                                          1,  7 UNION ALL
  SELECT 'QCI-SBT-001', '山梨酸钾（防腐剂）',           NULL,  0.10,'≤0.10%（HPLC法）',                                                                            1,  8 UNION ALL
  SELECT 'QCI-MIC-001', '菌落总数',                     NULL, 100.00,'≤100 CFU/mL',                                                                               1,  9 UNION ALL
  SELECT 'QCI-MIC-002', '大肠菌群',                     NULL,  NULL, '不得检出（/mL）',                                                                             1, 10 UNION ALL
  SELECT 'QCI-PKG-002', '标签合规',                     NULL,  NULL, '品名/批号/生产日期/有效期/执行标准/生产许可证号齐全',                                        1, 11
) v
WHERE s.scheme_code = 'QCS-FQC-TMJ-030';

SET foreign_key_checks = 1;

-- ============================================================
-- 8. 验证查询
-- ============================================================
SELECT '=== 辅料补充结果 ===' AS '';
SELECT material_code, material_name FROM base_material WHERE material_code LIKE 'AUX-%' ORDER BY material_code;

SELECT '=== BOM主表汇总 ===' AS '';
SELECT b.bom_code, b.material_name, b.batch_size, b.batch_unit, b.bom_status,
       COUNT(d.id) AS 明细行数
FROM base_bom b
LEFT JOIN base_bom_detail d ON d.bom_id = b.id
WHERE b.bom_code LIKE 'BOM-TMJ-%'
GROUP BY b.id
ORDER BY b.bom_code;

SELECT '=== BOM明细示例（维C咀嚼片）===' AS '';
SELECT d.line_no, d.material_code, d.material_name, d.material_type, d.qty, d.unit_name, d.process_step
FROM base_bom_detail d
JOIN base_bom b ON d.bom_id = b.id
WHERE b.bom_code = 'BOM-TMJ-TAB-025'
ORDER BY d.line_no;

SELECT '=== FQC质检方案汇总 ===' AS '';
SELECT s.scheme_code, s.scheme_name, s.material_code, COUNT(sd.id) AS 检验项目数
FROM qms_qc_scheme s
LEFT JOIN qms_qc_scheme_detail sd ON sd.scheme_id = s.id
WHERE s.scheme_code LIKE 'QCS-FQC-TMJ-%'
GROUP BY s.id
ORDER BY s.scheme_code;

SELECT '=== FQC检验项示例（维C咀嚼片）===' AS '';
SELECT sd.sort_no, sd.item_code, sd.item_name, sd.spec_min, sd.spec_max, sd.spec_text
FROM qms_qc_scheme_detail sd
JOIN qms_qc_scheme s ON sd.scheme_id = s.id
WHERE s.scheme_code = 'QCS-FQC-TMJ-025'
ORDER BY sd.sort_no;

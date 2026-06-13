-- ============================================================
-- 天美健MES — 质检项目档案（qms_inspection_item）演示数据
-- 包含：原有QI-*/QCI-*系列 + 回填scheme_detail.item_id
-- ============================================================

SET NAMES utf8mb4;

-- ============================================================
-- 1. 清除旧质检项目（幂等重入）
-- ============================================================
DELETE FROM qms_inspection_item WHERE item_code LIKE 'QCI-%' OR item_code LIKE 'QI-%';

-- ============================================================
-- 2. 插入 QI-* 系列（原有方案用到的通用检验项）
-- ============================================================

-- ── A类：外观/感官检验项 ────────────────────────────
INSERT INTO qms_inspection_item (item_code, item_name, item_type, unit_name, spec_min, spec_max, spec_text, test_method, status, deleted, create_time) VALUES
('QI-A01', '外观性状',       '感官', '',    NULL,  NULL,  '外观符合标准描述，无异常', '目视检查', 1, 0, NOW()),
('QI-A02', '气味',           '感官', '',    NULL,  NULL,  '无异味，符合品种特征',     '嗅觉检查', 1, 0, NOW()),
('QI-A03', '色泽',           '感官', '',    NULL,  NULL,  '色泽均匀，符合标准色',     '目视对照', 1, 0, NOW()),
('QI-A04', '胶囊外观',       '感官', '',    NULL,  NULL,  '囊形饱满，封口严密，无变形/泄漏', '目视检查', 1, 0, NOW()),
('QI-A05', '口服液澄清度',   '感官', '',    NULL,  NULL,  '澄清，允许有轻微乳光，不得有异物', '目视检查', 1, 0, NOW());

-- ── C类：化学/成分检验项 ────────────────────────────
INSERT INTO qms_inspection_item (item_code, item_name, item_type, unit_name, spec_min, spec_max, spec_text, test_method, status, deleted, create_time) VALUES
('QI-C01', '主要功效成分',   '化学', '%',   NULL,  NULL,  '符合标示量要求',           'HPLC法',   1, 0, NOW()),
('QI-C02', '维生素C含量',    '化学', '%',   99.00, NULL,  '≥99.0%（以干燥品计）',    '2,6-二氯靛酚法', 1, 0, NOW()),
('QI-C05', 'DHA/EPA含量',    '化学', '%',   30.00, NULL,  'DHA+EPA≥30%',             'GC法',     1, 0, NOW()),
('QI-C06', '益生菌活菌数',   '化学', 'CFU/g', 1e11, NULL, '活菌数≥1×10¹¹CFU/g',    '稀释平板计数', 1, 0, NOW()),
('QI-C07', '总多糖含量',     '化学', '%',   NULL,  NULL,  '符合标示量≥90%',           '苯酚-硫酸法', 1, 0, NOW()),
('QI-C09', '总有机碳(TOC)',  '化学', 'ppm', NULL,  10.00, 'TOC≤10ppm（清洗水样品）', 'TOC测定仪', 1, 0, NOW());

-- ── H类：重金属检验项 ────────────────────────────────
INSERT INTO qms_inspection_item (item_code, item_name, item_type, unit_name, spec_min, spec_max, spec_text, test_method, status, deleted, create_time) VALUES
('QI-H01', '铅(Pb)',         '重金属', 'mg/kg', NULL, 1.50, '≤1.5mg/kg',  'ICP-MS法', 1, 0, NOW()),
('QI-H02', '砷(As)',         '重金属', 'mg/kg', NULL, 1.00, '≤1mg/kg',    'ICP-MS法', 1, 0, NOW()),
('QI-H03', '汞(Hg)',         '重金属', 'mg/kg', NULL, 0.10, '≤0.1mg/kg',  '原子荧光法', 1, 0, NOW()),
('QI-H04', '镉(Cd)',         '重金属', 'mg/kg', NULL, 0.50, '≤0.5mg/kg',  'ICP-MS法', 1, 0, NOW());

-- ── K类：包装/标签检验项 ────────────────────────────
INSERT INTO qms_inspection_item (item_code, item_name, item_type, unit_name, spec_min, spec_max, spec_text, test_method, status, deleted, create_time) VALUES
('QI-K01', '标签检查',        '包装', '',   NULL, NULL, '印刷清晰，内容完整，与审核样一致', '目视对照', 1, 0, NOW()),
('QI-K02', '封口密封性',      '包装', '',   NULL, NULL, '密封完好，无泄漏',             '挤压/水浸检查', 1, 0, NOW()),
('QI-K03', '包装重量',        '包装', 'g',  NULL, NULL, '符合规格要求，偏差≤±3%',       '称量', 1, 0, NOW()),
('QI-K04', '条码扫描验证',    '包装', '',   NULL, NULL, '条码可正常扫描识别',           '扫码枪验证', 1, 0, NOW()),
('QI-K05', '铝箔包装完整性',  '包装', '',   NULL, NULL, '铝箔无破损，热封完好',         '目视检查', 1, 0, NOW());

-- ── M类：微生物检验项 ────────────────────────────────
INSERT INTO qms_inspection_item (item_code, item_name, item_type, unit_name, spec_min, spec_max, spec_text, test_method, status, deleted, create_time) VALUES
('QI-M01', '菌落总数',        '微生物', 'CFU/g',  NULL, 1000.00, '≤1000CFU/g',        '平板计数法', 1, 0, NOW()),
('QI-M02', '大肠菌群',        '微生物', 'MPN/100g', NULL, 30.00, '≤30MPN/100g',      'MPN法', 1, 0, NOW()),
('QI-M03', '霉菌和酵母菌',   '微生物', 'CFU/g',   NULL, 25.00,  '≤25CFU/g',          '平板计数法', 1, 0, NOW()),
('QI-M04', '金黄色葡萄球菌', '微生物', '/g',      NULL, NULL,   '不得检出(/g)',       'GB 4789.10', 1, 0, NOW()),
('QI-M05', '沙门氏菌',       '微生物', '/25g',    NULL, NULL,   '不得检出(/25g)',     'GB 4789.4',  1, 0, NOW());

-- ── P类：物理/过程检验项 ────────────────────────────
INSERT INTO qms_inspection_item (item_code, item_name, item_type, unit_name, spec_min, spec_max, spec_text, test_method, status, deleted, create_time) VALUES
('QI-P01', '片重差异',        '物理', '%',  NULL, NULL,  '平均片重±5%以内',          '电子天平称量', 1, 0, NOW()),
('QI-P02', '硬度',            '物理', 'N',  30.00, NULL, '≥30N',                    '硬度仪', 1, 0, NOW()),
('QI-P03', '脆碎度',          '物理', '%',  NULL, 0.50,  '≤0.5%',                   '脆碎度测定仪', 1, 0, NOW()),
('QI-P04', '崩解时限',        '物理', 'min',NULL, 15.00, '≤15min（普通片）',         '崩解仪', 1, 0, NOW()),
('QI-P05', '装量差异',        '物理', '%',  NULL, NULL,  '符合《中国药典》装量差异限度', '称量法', 1, 0, NOW()),
('QI-P06', '水分',            '物理', '%',  NULL, 6.00,  '≤6.0%',                   '干燥失重法', 1, 0, NOW()),
('QI-P07', '粒度',            '物理', 'μm', NULL, NULL,  'D90符合工艺要求',          '激光衍射法', 1, 0, NOW()),
('QI-P08', 'pH值（过程）',    '物理', '',   3.00, 5.00,  '3.0~5.0',                 'pH计法', 1, 0, NOW()),
('QI-P09', '装量/净含量',     '物理', '%',  NULL, NULL,  '符合标示量±5%',            '容量法/称量法', 1, 0, NOW());

-- ── R类：综合评定 ────────────────────────────────────
INSERT INTO qms_inspection_item (item_code, item_name, item_type, unit_name, spec_min, spec_max, spec_text, test_method, status, deleted, create_time) VALUES
('QI-R01', '成品综合评定',     '综合', '', NULL, NULL, '综合判定：合格/不合格',      '综合评审', 1, 0, NOW()),
('QI-R03', '有效期/货架期核查','综合', '', NULL, NULL, '有效期标注清晰，未超期',      '目视核查', 1, 0, NOW());

-- ============================================================
-- 3. 插入 QCI-* 系列（保健品成品专用检验项，更详细规格）
-- ============================================================
INSERT INTO qms_inspection_item (item_code, item_name, item_type, unit_name, spec_min, spec_max, spec_text, test_method, status, deleted, create_time) VALUES
-- 外观
('QCI-ORG-001', '性状（外观）',          '感官', '', NULL, NULL, '符合品种标准外观描述',                '目视检查', 1, 0, NOW()),
-- 物理指标
('QCI-WT-001',  '片重差异',              '物理', '%', NULL, NULL, '标示量的±5%以内',                   '电子天平', 1, 0, NOW()),
('QCI-WT-002',  '平均片重',              '物理', 'g', 0.48, 0.52,'目标值0.50g，允差±0.02g',            '电子天平', 1, 0, NOW()),
('QCI-WT-003',  '粒重差异',              '物理', '%', NULL, NULL, '标示量±8%以内',                     '电子天平', 1, 0, NOW()),
('QCI-HAR-001', '硬度',                  '物理', 'N', 30.00,NULL, '≥30N（牛顿）',                     '片剂硬度仪', 1, 0, NOW()),
('QCI-FRI-001', '脆碎度',               '物理', '%', NULL, 1.00, '≤1.0%',                             '脆碎度仪', 1, 0, NOW()),
('QCI-DIS-001', '崩解时限（口腔）',      '物理', 'min', NULL, 3.00,'≤3min（37℃水中）',               '崩解仪', 1, 0, NOW()),
('QCI-SEAM-001','囊壳厚度',              '物理', '', NULL, NULL, '均匀，无裂缝，接缝平整',             '目视+卡尺', 1, 0, NOW()),
('QCI-LK-001',  '渗漏检查',              '物理', '粒', NULL, 0.00,'无渗漏（抽查20粒/批）',            '目视检查', 1, 0, NOW()),
('QCI-VOL-001', '装量',                  '物理', 'ml', NULL, NULL,'符合标示量±2%',                    '容量法', 1, 0, NOW()),
('QCI-PKG-001', '净含量',               '包装', '', NULL, NULL, '符合标示量，允差±2',                 '称量/计数', 1, 0, NOW()),
('QCI-PKG-002', '标签合规',              '包装', '', NULL, NULL, '品名/批号/生产日期/有效期齐全',      '目视对照', 1, 0, NOW()),
('QCI-PKG-003', '袋重差异',              '包装', 'g', NULL, NULL,'每袋10g±5%',                       '电子天平', 1, 0, NOW()),
-- 化学/含量
('QCI-VC-001',  '维生素C含量',           '化学', '%', 95.00,105.00,'标示量的95%~105%（HPLC法）',     'HPLC法', 1, 0, NOW()),
('QCI-VD-001',  '维生素D3含量',          '化学', '%', 90.00,120.00,'标示量的90%~120%（HPLC法）',     'HPLC法', 1, 0, NOW()),
('QCI-CA-001',  '钙含量',               '化学', '%', 95.00,105.00,'标示量的95%~105%（EDTA法）',     'EDTA滴定法', 1, 0, NOW()),
('QCI-ZN-001',  '锌含量（锌元素）',      '化学', 'mg/支', 9.00,11.00,'9.0~11.0 mg/支',              '原子吸收法', 1, 0, NOW()),
('QCI-EPA-001', 'EPA含量',              '化学', '%', 95.00,105.00,'标示量的95%~105%（GC法）',        'GC法', 1, 0, NOW()),
('QCI-DHA-001', 'DHA含量',              '化学', '%', 95.00,105.00,'标示量的95%~105%（GC法）',        'GC法', 1, 0, NOW()),
('QCI-COL-001', '胶原蛋白肽含量',        '化学', '%', 95.00,105.00,'标示量的95%~105%（凯氏定氮法）', '凯氏定氮法', 1, 0, NOW()),
('QCI-PRO-001', '蛋白质含量',            '化学', 'g/100g', 80.00,NULL,'≥80g/100g（凯氏定氮法）',    '凯氏定氮法', 1, 0, NOW()),
('QCI-BCAA-001','BCAA含量',             '化学', '%', 18.00,NULL, '≥18%（支链氨基酸，HPLC法）',       'HPLC法', 1, 0, NOW()),
('QCI-PRE-001', '防腐剂（山梨酸钾）含量','化学', '%', NULL, 0.10,'≤0.10%（HPLC法）',                'HPLC法', 1, 0, NOW()),
('QCI-SBT-001', '山梨酸钾（防腐剂）',   '化学', '%', NULL, 0.10,'≤0.10%（HPLC法）',                'HPLC法', 1, 0, NOW()),
-- 油脂氧化指标
('QCI-PERX-001','过氧化值（POV）',       '化学', 'meq/kg', NULL, 5.00,'≤5 meq/kg',                  '碘量法', 1, 0, NOW()),
('QCI-ANISV-001','茴香胺值（p-AV）',     '化学', '', NULL, 20.00,'≤20',                             '分光光度法', 1, 0, NOW()),
('QCI-TOTOX-001','TOTOX（总氧化值）',    '化学', '', NULL, 26.00,'≤26（2POV+AV）',                  '计算值', 1, 0, NOW()),
-- 液体指标
('QCI-PH-001',  'pH值',                  '物理', '', 3.50, 5.20,'3.5~5.2（品种依据）',             'pH计法25℃', 1, 0, NOW()),
('QCI-VIS-001', '澄清度',               '感官', '', NULL, NULL, '澄清或允许轻微乳光，无异物',        '目视检查', 1, 0, NOW()),
('QCI-OSM-001', '渗透压摩尔浓度',        '物理', 'mOsmol/kg', 200.00,350.00,'200~350 mOsmol/kg',  '冰点渗透压仪', 1, 0, NOW()),
-- 粉剂指标
('QCI-MOIS-001','水分',                  '物理', '%', NULL, 8.00,'≤8.0%（干燥失重法）',             '干燥失重法', 1, 0, NOW()),
('QCI-GRAN-001','粒度（D90）',           '物理', 'μm', NULL, 200.00,'≤200μm（激光衍射法）',         '激光衍射法', 1, 0, NOW()),
('QCI-FLOW-001','溶解性',               '物理', '', NULL, NULL, '25g加水100ml，搅拌1min，无明显沉淀','目视检查', 1, 0, NOW()),
-- 微生物
('QCI-MIC-001', '菌落总数',             '微生物', 'CFU/g', NULL, 1000.00,'≤1000 CFU/g',            '平板计数法', 1, 0, NOW()),
('QCI-MIC-002', '大肠菌群',             '微生物', '/g', NULL, NULL,'不得检出（/g）',                'GB4789.3', 1, 0, NOW()),
('QCI-MIC-003', '霉菌和酵母菌',         '微生物', 'CFU/g', NULL, 100.00,'≤100 CFU/g',              '平板计数法', 1, 0, NOW()),
('QCI-MIC-004', '细菌内毒素',           '微生物', 'EU/mL', NULL, NULL,'≤0.25EU/mL（LAL法）',       'LAL法', 1, 0, NOW()),
-- 特殊
('QCI-MWCOL-001','胶原蛋白肽分子量分布','化学', 'Da', NULL, NULL,'≥50%组分分子量<3000Da（GPC法）', 'GPC法', 1, 0, NOW());

-- ============================================================
-- 4. 回填 qms_qc_scheme_detail.item_id（通过 item_code 关联）
-- ============================================================
UPDATE qms_qc_scheme_detail sd
JOIN qms_inspection_item ii ON sd.item_code = ii.item_code
SET sd.item_id = ii.id
WHERE sd.item_id = 0 OR sd.item_id IS NULL;

-- ============================================================
-- 5. 验证查询
-- ============================================================
SELECT '=== 质检项目档案汇总 ===' AS '';
SELECT item_type, COUNT(*) AS 项目数
FROM qms_inspection_item WHERE deleted=0
GROUP BY item_type ORDER BY item_type;

SELECT '=== 总检验项数 ===' AS '';
SELECT COUNT(*) AS 总数 FROM qms_inspection_item WHERE deleted=0;

SELECT '=== scheme_detail item_id 回填验证 ===' AS '';
SELECT 
  COUNT(*) AS 总明细数,
  SUM(CASE WHEN item_id = 0 THEN 1 ELSE 0 END) AS 未关联数,
  SUM(CASE WHEN item_id > 0 THEN 1 ELSE 0 END) AS 已关联数
FROM qms_qc_scheme_detail;

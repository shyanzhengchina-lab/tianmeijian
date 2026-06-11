-- ================================================
-- QMS 模块：质量管理 / 质检 / MRB / 放行
-- ================================================

-- 1. 质检项目表
CREATE TABLE IF NOT EXISTS `inspection_item` (
    `id`          BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `code`        VARCHAR(50)  NOT NULL                COMMENT '项目编码',
    `name`        VARCHAR(100) NOT NULL                COMMENT '项目名称',
    `category`    VARCHAR(50)  DEFAULT ''              COMMENT '项目分类：外观/尺寸/性能/化学/微生物',
    `method`      VARCHAR(200) DEFAULT ''              COMMENT '检验方法',
    `standard`    TEXT         DEFAULT NULL            COMMENT '检验标准',
    `unit`        VARCHAR(20)  DEFAULT ''              COMMENT '计量单位',
    `min_value`   DECIMAL(18,6) DEFAULT NULL           COMMENT '下限值',
    `max_value`   DECIMAL(18,6) DEFAULT NULL           COMMENT '上限值',
    `is_key_item` TINYINT      DEFAULT 0               COMMENT '是否关键项：1是 0否',
    `status`      TINYINT      DEFAULT 1               COMMENT '状态：1启用 0禁用',
    `deleted`     TINYINT      DEFAULT 0               COMMENT '逻辑删除',
    `create_time` DATETIME     DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `create_by`   VARCHAR(50)  DEFAULT ''              COMMENT '创建人',
    `update_by`   VARCHAR(50)  DEFAULT ''              COMMENT '更新人',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_code` (`code`, `deleted`),
    KEY `idx_category` (`category`),
    KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='质检项目';

-- 2. 质检任务表
CREATE TABLE IF NOT EXISTS `inspection_task` (
    `id`                BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `task_no`           VARCHAR(50)  NOT NULL                COMMENT '任务编号',
    `task_type`         VARCHAR(50)  NOT NULL                COMMENT '任务类型：进料检验/过程检验/成品检验/出货检验',
    `source_type`       VARCHAR(50)  DEFAULT ''              COMMENT '来源类型：采购订单/生产订单/销售订单',
    `source_no`         VARCHAR(50)  DEFAULT ''              COMMENT '来源单号',
    `material_id`       BIGINT       DEFAULT NULL            COMMENT '物料ID',
    `material_code`     VARCHAR(50)  DEFAULT ''              COMMENT '物料编码（冗余）',
    `material_name`     VARCHAR(200) DEFAULT ''              COMMENT '物料名称（冗余）',
    `batch_no`          VARCHAR(50)  DEFAULT ''              COMMENT '批次号',
    `quantity`          DECIMAL(18,4) DEFAULT 0              COMMENT '检验数量',
    `unit`              VARCHAR(20)  DEFAULT ''              COMMENT '单位',
    `sample_quantity`   DECIMAL(18,4) DEFAULT 0              COMMENT '抽样数量',
    `inspect_date`      DATE         DEFAULT NULL            COMMENT '检验日期',
    `inspector_id`      BIGINT       DEFAULT NULL            COMMENT '质检员ID',
    `inspector_name`    VARCHAR(50)  DEFAULT ''              COMMENT '质检员姓名（冗余）',
    `status`            VARCHAR(20)  NOT NULL DEFAULT 'PENDING' COMMENT '状态：PENDING待检/INSPECTING检验中/COMPLETED已完成/CANCELLED已取消',
    `result`            VARCHAR(20)  DEFAULT ''              COMMENT '检验结果：PASS合格/FAIL不合格/CONDITIONAL有条件合格',
    `total_items`       INT          DEFAULT 0               COMMENT '总检验项数',
    `pass_items`        INT          DEFAULT 0               COMMENT '合格项数',
    `fail_items`        INT          DEFAULT 0               COMMENT '不合格项数',
    `remark`            TEXT         DEFAULT NULL            COMMENT '备注',
    `deleted`           TINYINT      DEFAULT 0               COMMENT '逻辑删除',
    `create_time`       DATETIME     DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time`       DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `create_by`         VARCHAR(50)  DEFAULT ''              COMMENT '创建人',
    `update_by`         VARCHAR(50)  DEFAULT ''              COMMENT '更新人',
    `complete_time`     DATETIME     DEFAULT NULL            COMMENT '完成时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_task_no` (`task_no`, `deleted`),
    KEY `idx_material_id` (`material_id`),
    KEY `idx_batch_no` (`batch_no`),
    KEY `idx_status` (`status`),
    KEY `idx_inspect_date` (`inspect_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='质检任务';

-- 3. 质检结果表
CREATE TABLE IF NOT EXISTS `inspection_result` (
    `id`                BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `task_id`           BIGINT       NOT NULL                COMMENT '质检任务ID',
    `item_id`           BIGINT       NOT NULL                COMMENT '质检项目ID',
    `item_code`         VARCHAR(50)  DEFAULT ''              COMMENT '项目编码（冗余）',
    `item_name`         VARCHAR(100) DEFAULT ''              COMMENT '项目名称（冗余）',
    `sample_no`         VARCHAR(50)  DEFAULT ''              COMMENT '样品编号',
    `actual_value`      DECIMAL(18,6) DEFAULT NULL           COMMENT '实际值',
    `result`            VARCHAR(20)  NOT NULL                COMMENT '结果：PASS合格/FAIL不合格',
    `unit`              VARCHAR(20)  DEFAULT ''              COMMENT '单位',
    `min_value`         DECIMAL(18,6) DEFAULT NULL           COMMENT '标准下限（冗余）',
    `max_value`         DECIMAL(18,6) DEFAULT NULL           COMMENT '标准上限（冗余）',
    `inspector_id`      BIGINT       DEFAULT NULL            COMMENT '质检员ID',
    `inspector_name`    VARCHAR(50)  DEFAULT ''              COMMENT '质检员姓名',
    `inspect_time`      DATETIME     DEFAULT NULL            COMMENT '检验时间',
    `remark`            VARCHAR(500) DEFAULT ''              COMMENT '备注',
    `deleted`           TINYINT      DEFAULT 0               COMMENT '逻辑删除',
    `create_time`       DATETIME     DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time`       DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    KEY `idx_task_id` (`task_id`),
    KEY `idx_item_id` (`item_id`),
    KEY `idx_result` (`result`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='质检结果';

-- 4. MRB评审记录表
CREATE TABLE IF NOT EXISTS `mrb_record` (
    `id`                BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `mrb_no`            VARCHAR(50)  NOT NULL                COMMENT 'MRB编号',
    `task_id`           BIGINT       DEFAULT NULL            COMMENT '关联质检任务ID',
    `material_id`       BIGINT       DEFAULT NULL            COMMENT '物料ID',
    `material_code`     VARCHAR(50)  DEFAULT ''              COMMENT '物料编码（冗余）',
    `material_name`     VARCHAR(200) DEFAULT ''              COMMENT '物料名称（冗余）',
    `batch_no`          VARCHAR(50)  DEFAULT ''              COMMENT '批次号',
    `quantity`          DECIMAL(18,4) DEFAULT 0              COMMENT '不合格数量',
    `unit`              VARCHAR(20)  DEFAULT ''              COMMENT '单位',
    `failure_type`      VARCHAR(50)  DEFAULT ''              COMMENT '不合格类型：外观缺陷/尺寸偏差/性能不达标/其他',
    `failure_desc`      TEXT         DEFAULT NULL            COMMENT '不合格描述',
    `reporter_id`       BIGINT       DEFAULT NULL            COMMENT '报告人ID',
    `reporter_name`     VARCHAR(50)  DEFAULT ''              COMMENT '报告人姓名（冗余）',
    `report_time`       DATETIME     DEFAULT NULL            COMMENT '报告时间',
    `status`            VARCHAR(20)  NOT NULL DEFAULT 'PENDING' COMMENT '状态：PENDING待评审/REVIEWING评审中/COMPLETED已完成/CANCELLED已取消',
    `disposition`       VARCHAR(50)  DEFAULT ''              COMMENT '处理方案：REWORK返工/SCRAP报废/RETURN退货/ACCEPT特采/CONCESSION让步接收',
    `disposition_desc`  TEXT         DEFAULT NULL            COMMENT '处理方案描述',
    `disposition_by`    VARCHAR(50)  DEFAULT ''              COMMENT '处理人',
    `disposition_time`  DATETIME     DEFAULT NULL            COMMENT '处理时间',
    `remark`            TEXT         DEFAULT NULL            COMMENT '备注',
    `deleted`           TINYINT      DEFAULT 0               COMMENT '逻辑删除',
    `create_time`       DATETIME     DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time`       DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `create_by`         VARCHAR(50)  DEFAULT ''              COMMENT '创建人',
    `update_by`         VARCHAR(50)  DEFAULT ''              COMMENT '更新人',
    `complete_time`     DATETIME     DEFAULT NULL            COMMENT '完成时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_mrb_no` (`mrb_no`, `deleted`),
    KEY `idx_task_id` (`task_id`),
    KEY `idx_material_id` (`material_id`),
    KEY `idx_batch_no` (`batch_no`),
    KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='MRB评审记录';

-- 5. MRB评审意见表
CREATE TABLE IF NOT EXISTS `mrb_review_opinion` (
    `id`                BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `mrb_id`            BIGINT       NOT NULL                COMMENT 'MRB记录ID',
    `reviewer_id`       BIGINT       NOT NULL                COMMENT '评审人ID',
    `reviewer_name`     VARCHAR(50)  DEFAULT ''              COMMENT '评审人姓名（冗余）',
    `role`              VARCHAR(50)  DEFAULT ''              COMMENT '评审角色：质量/生产/技术/采购/销售',
    `opinion`           TEXT         DEFAULT NULL            COMMENT '评审意见',
    `recommendation`    VARCHAR(50)  DEFAULT ''              COMMENT '建议方案：REWORK返工/SCRAP报废/RETURN退货/ACCEPT特采/CONCESSION让步接收',
    `review_time`       DATETIME     DEFAULT NULL            COMMENT '评审时间',
    `deleted`           TINYINT      DEFAULT 0               COMMENT '逻辑删除',
    `create_time`       DATETIME     DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time`       DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    KEY `idx_mrb_id` (`mrb_id`),
    KEY `idx_reviewer_id` (`reviewer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='MRB评审意见';

-- 6. MRB处理方案表
CREATE TABLE IF NOT EXISTS `mrb_disposition` (
    `id`                BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `mrb_id`            BIGINT       NOT NULL                COMMENT 'MRB记录ID',
    `disposition_type`  VARCHAR(50)  NOT NULL                COMMENT '处理类型：REWORK返工/SCRAP报废/RETURN退货/ACCEPT特采/CONCESSION让步接收',
    `description`       TEXT         DEFAULT NULL            COMMENT '处理描述',
    `quantity`          DECIMAL(18,4) DEFAULT 0              COMMENT '处理数量',
    `unit`              VARCHAR(20)  DEFAULT ''              COMMENT '单位',
    `handler_id`        BIGINT       DEFAULT NULL            COMMENT '处理人ID',
    `handler_name`      VARCHAR(50)  DEFAULT ''              COMMENT '处理人姓名（冗余）',
    `handle_time`       DATETIME     DEFAULT NULL            COMMENT '处理时间',
    `result`            VARCHAR(20)  DEFAULT ''              COMMENT '处理结果：SUCCESS成功/FAILED失败',
    `remark`            VARCHAR(500) DEFAULT ''              COMMENT '备注',
    `deleted`           TINYINT      DEFAULT 0               COMMENT '逻辑删除',
    `create_time`       DATETIME     DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time`       DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    KEY `idx_mrb_id` (`mrb_id`),
    KEY `idx_disposition_type` (`disposition_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='MRB处理方案';

-- 7. 质量放行表
CREATE TABLE IF NOT EXISTS `quality_release` (
    `id`                BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `release_no`        VARCHAR(50)  NOT NULL                COMMENT '放行编号',
    `release_type`      VARCHAR(50)  NOT NULL                COMMENT '放行类型：原材料放行/中间品放行/成品放行',
    `task_id`           BIGINT       DEFAULT NULL            COMMENT '关联质检任务ID',
    `material_id`       BIGINT       DEFAULT NULL            COMMENT '物料ID',
    `material_code`     VARCHAR(50)  DEFAULT ''              COMMENT '物料编码（冗余）',
    `material_name`     VARCHAR(200) DEFAULT ''              COMMENT '物料名称（冗余）',
    `batch_no`          VARCHAR(50)  NOT NULL                COMMENT '批次号',
    `quantity`          DECIMAL(18,4) DEFAULT 0              COMMENT '放行数量',
    `unit`              VARCHAR(20)  DEFAULT ''              COMMENT '单位',
    `warehouse_id`      BIGINT       DEFAULT NULL            COMMENT '仓库ID',
    `warehouse_name`    VARCHAR(100) DEFAULT ''              COMMENT '仓库名称（冗余）',
    `release_date`      DATE         DEFAULT NULL            COMMENT '放行日期',
    `status`            VARCHAR(20)  NOT NULL DEFAULT 'PENDING' COMMENT '状态：PENDING待审批/APPROVED已批准/REJECTED已拒绝',
    `applicant_id`      BIGINT       DEFAULT NULL            COMMENT '申请人ID',
    `applicant_name`    VARCHAR(50)  DEFAULT ''              COMMENT '申请人姓名（冗余）',
    `apply_time`        DATETIME     DEFAULT NULL            COMMENT '申请时间',
    `approver_id`       BIGINT       DEFAULT NULL            COMMENT '审批人ID',
    `approver_name`     VARCHAR(50)  DEFAULT ''              COMMENT '审批人姓名（冗余）',
    `approve_time`      DATETIME     DEFAULT NULL            COMMENT '审批时间',
    `approve_remark`    VARCHAR(500) DEFAULT ''              COMMENT '审批意见',
    `remark`            TEXT         DEFAULT NULL            COMMENT '备注',
    `deleted`           TINYINT      DEFAULT 0               COMMENT '逻辑删除',
    `create_time`       DATETIME     DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time`       DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `create_by`         VARCHAR(50)  DEFAULT ''              COMMENT '创建人',
    `update_by`         VARCHAR(50)  DEFAULT ''              COMMENT '更新人',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_release_no` (`release_no`, `deleted`),
    KEY `idx_task_id` (`task_id`),
    KEY `idx_material_id` (`material_id`),
    KEY `idx_batch_no` (`batch_no`),
    KEY `idx_status` (`status`),
    KEY `idx_release_date` (`release_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='质量放行';

-- 8. 放行证书表
CREATE TABLE IF NOT EXISTS `release_certificate` (
    `id`                BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `certificate_no`    VARCHAR(50)  NOT NULL                COMMENT '证书编号',
    `release_id`        BIGINT       NOT NULL                COMMENT '放行记录ID',
    `certificate_type`  VARCHAR(50)  DEFAULT 'COA'           COMMENT '证书类型：COA质量分析证书/COC合规证书',
    `issue_date`        DATE         DEFAULT NULL            COMMENT '签发日期',
    `expiry_date`       DATE         DEFAULT NULL            COMMENT '有效期至',
    `issuer_id`         BIGINT       DEFAULT NULL            COMMENT '签发人ID',
    `issuer_name`       VARCHAR(50)  DEFAULT ''              COMMENT '签发人姓名（冗余）',
    `content`           TEXT         DEFAULT NULL            COMMENT '证书内容（JSON格式）',
    `file_path`         VARCHAR(500) DEFAULT ''              COMMENT '证书文件路径',
    `status`            VARCHAR(20)  DEFAULT 'VALID'         COMMENT '状态：VALID有效/EXPIRED已过期/REVOKED已撤销',
    `deleted`           TINYINT      DEFAULT 0               COMMENT '逻辑删除',
    `create_time`       DATETIME     DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time`       DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_certificate_no` (`certificate_no`, `deleted`),
    KEY `idx_release_id` (`release_id`),
    KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='放行证书';

-- ================================================
-- 质量管理模块初始化数据
-- ================================================

-- 质检项目数据
INSERT IGNORE INTO `inspection_item` (`code`, `name`, `category`, `method`, `standard`, `unit`, `min_value`, `max_value`, `is_key_item`, `status`) VALUES
('IT001', '外观检查', '外观', '目测法', '无破损、无污渍、无异物', '', NULL, NULL, 1, 1),
('IT002', '长度', '尺寸', '游标卡尺', '符合图纸要求', 'mm', 245.0, 255.0, 1, 1),
('IT003', '宽度', '尺寸', '游标卡尺', '符合图纸要求', 'mm', 80.0, 90.0, 0, 1),
('IT004', '厚度', '尺寸', '测厚仪', '0.05-0.10mm', 'mm', 0.05, 0.10, 1, 1),
('IT005', '拉伸强度', '性能', '拉力试验机', '≥15MPa', 'MPa', 15.0, NULL, 1, 1),
('IT006', '断裂伸长率', '性能', '拉力试验机', '≥500%', '%', 500.0, NULL, 0, 1),
('IT007', '蛋白质含量', '化学', '凯氏定氮法', '≤10ppm', 'ppm', NULL, 10.0, 1, 1),
('IT008', '微生物限度', '微生物', '平板计数法', '≤100CFU/g', 'CFU/g', NULL, 100.0, 1, 1),
('IT009', '包装标识', '外观', '目测法', '清晰、完整、正确', '', NULL, NULL, 0, 1),
('IT010', '密封性', '性能', '真空测试', '无泄漏', '', NULL, NULL, 1, 1);

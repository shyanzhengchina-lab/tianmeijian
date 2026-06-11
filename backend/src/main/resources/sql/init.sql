-- ================================================
-- 迈迪康 MES 系统 数据库初始化脚本
-- 数据库：MySQL 8.0+
-- 字符集：utf8mb4
-- ================================================

CREATE DATABASE IF NOT EXISTS mes_db
    DEFAULT CHARACTER SET utf8mb4
    DEFAULT COLLATE utf8mb4_unicode_ci;

USE mes_db;

-- ================================================
-- 1. 物料分类表
-- ================================================
CREATE TABLE IF NOT EXISTS `material_category` (
    `id`          BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `parent_id`   BIGINT       DEFAULT 0               COMMENT '父分类ID，0为顶级',
    `code`        VARCHAR(50)  NOT NULL                COMMENT '分类编码',
    `name`        VARCHAR(100) NOT NULL                COMMENT '分类名称',
    `sort_no`     INT          DEFAULT 0               COMMENT '排序号',
    `status`      TINYINT      DEFAULT 1               COMMENT '状态：1启用 0禁用',
    `deleted`     TINYINT      DEFAULT 0               COMMENT '逻辑删除：0未删除 1已删除',
    `create_time` DATETIME     DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `create_by`   VARCHAR(50)  DEFAULT ''              COMMENT '创建人',
    `update_by`   VARCHAR(50)  DEFAULT ''              COMMENT '更新人',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_code` (`code`, `deleted`),
    KEY `idx_parent_id` (`parent_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='物料分类';

-- ================================================
-- 2. 物料档案表
-- ================================================
CREATE TABLE IF NOT EXISTS `material` (
    `id`          BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `code`        VARCHAR(50)  NOT NULL                COMMENT '物料编码',
    `name`        VARCHAR(200) NOT NULL                COMMENT '物料名称',
    `category_id` BIGINT       NOT NULL                COMMENT '分类ID',
    `spec`        VARCHAR(200) DEFAULT ''              COMMENT '规格型号',
    `unit_id`     BIGINT       DEFAULT NULL            COMMENT '计量单位ID',
    `unit_name`   VARCHAR(50)  DEFAULT ''              COMMENT '计量单位名称（冗余）',
    `type`        VARCHAR(50)  DEFAULT ''              COMMENT '物料类型：原材料/产品/中间品/包装材料',
    `brand`       VARCHAR(100) DEFAULT ''              COMMENT '品牌',
    `supplier`    VARCHAR(200) DEFAULT ''              COMMENT '供应商',
    `min_stock`   DECIMAL(18,4) DEFAULT 0              COMMENT '最小库存',
    `max_stock`   DECIMAL(18,4) DEFAULT 0              COMMENT '最大库存',
    `price`       DECIMAL(18,4) DEFAULT 0              COMMENT '参考价格',
    `status`      TINYINT      DEFAULT 1               COMMENT '状态：1启用 0禁用',
    `description` TEXT         DEFAULT NULL            COMMENT '备注',
    `deleted`     TINYINT      DEFAULT 0               COMMENT '逻辑删除',
    `create_time` DATETIME     DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `create_by`   VARCHAR(50)  DEFAULT ''              COMMENT '创建人',
    `update_by`   VARCHAR(50)  DEFAULT ''              COMMENT '更新人',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_code` (`code`, `deleted`),
    KEY `idx_category_id` (`category_id`),
    KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='物料档案';

-- ================================================
-- 3. 计量单位分组表
-- ================================================
CREATE TABLE IF NOT EXISTS `unit_group` (
    `id`          BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `code`        VARCHAR(50)  NOT NULL                COMMENT '分组编码',
    `name`        VARCHAR(100) NOT NULL                COMMENT '分组名称',
    `sort_no`     INT          DEFAULT 0               COMMENT '排序号',
    `status`      TINYINT      DEFAULT 1               COMMENT '状态：1启用 0禁用',
    `deleted`     TINYINT      DEFAULT 0               COMMENT '逻辑删除',
    `create_time` DATETIME     DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_code` (`code`, `deleted`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='计量单位分组';

-- ================================================
-- 4. 计量单位表
-- ================================================
CREATE TABLE IF NOT EXISTS `unit` (
    `id`          BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `code`        VARCHAR(50)  NOT NULL                COMMENT '单位编码',
    `name`        VARCHAR(100) NOT NULL                COMMENT '单位名称',
    `en_name`     VARCHAR(100) DEFAULT ''              COMMENT '英文名称',
    `group_id`    BIGINT       DEFAULT NULL            COMMENT '分组ID',
    `group_name`  VARCHAR(100) DEFAULT ''              COMMENT '分组名称（冗余）',
    `method`      VARCHAR(20)  DEFAULT '四舍五入'       COMMENT '单位方式：四舍五入/入位/去位',
    `precision`   INT          DEFAULT 0               COMMENT '单位精度',
    `is_base`     TINYINT      DEFAULT 0               COMMENT '是否基本单位：1是 0否',
    `status`      TINYINT      DEFAULT 1               COMMENT '状态：1启用 0禁用',
    `deleted`     TINYINT      DEFAULT 0               COMMENT '逻辑删除',
    `create_time` DATETIME     DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `create_by`   VARCHAR(50)  DEFAULT ''              COMMENT '创建人',
    `update_by`   VARCHAR(50)  DEFAULT ''              COMMENT '更新人',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_code` (`code`, `deleted`),
    KEY `idx_group_id` (`group_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='计量单位';

-- ================================================
-- 5. 物料清单(BOM)主表
-- ================================================
CREATE TABLE IF NOT EXISTS `bom` (
    `id`            BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `code`          VARCHAR(50)  NOT NULL                COMMENT 'BOM编码（通常与母件编码一致）',
    `version`       VARCHAR(20)  DEFAULT '1.00'          COMMENT '版本号',
    `bom_type`      VARCHAR(50)  DEFAULT '主生产'        COMMENT 'BOM类型',
    `status`        VARCHAR(20)  DEFAULT 'DRAFT'         COMMENT '状态：DRAFT草稿/REVIEWED已审核/APPROVED已批准',
    `material_id`   BIGINT       NOT NULL                COMMENT '母件物料ID',
    `material_code` VARCHAR(50)  DEFAULT ''              COMMENT '母件编码（冗余）',
    `material_name` VARCHAR(200) DEFAULT ''              COMMENT '母件名称（冗余）',
    `quantity`      DECIMAL(18,4) DEFAULT 1.0000         COMMENT '主批量',
    `unit_id`       BIGINT       DEFAULT NULL            COMMENT '主单位ID',
    `unit_name`     VARCHAR(50)  DEFAULT ''              COMMENT '主单位名称（冗余）',
    `org_manage`    VARCHAR(100) DEFAULT ''              COMMENT '管理组织',
    `org_use`       VARCHAR(100) DEFAULT ''              COMMENT '使用组织',
    `effective_date` DATE        DEFAULT NULL            COMMENT '生效日期',
    `expiry_date`   DATE         DEFAULT NULL            COMMENT '失效日期',
    `remark`        TEXT         DEFAULT NULL            COMMENT '备注',
    `deleted`       TINYINT      DEFAULT 0               COMMENT '逻辑删除',
    `create_time`   DATETIME     DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time`   DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `create_by`     VARCHAR(50)  DEFAULT ''              COMMENT '创建人',
    `update_by`     VARCHAR(50)  DEFAULT ''              COMMENT '更新人',
    `review_by`     VARCHAR(50)  DEFAULT ''              COMMENT '审核人',
    `review_time`   DATETIME     DEFAULT NULL            COMMENT '审核时间',
    `approve_by`    VARCHAR(50)  DEFAULT ''              COMMENT '批准人',
    `approve_time`  DATETIME     DEFAULT NULL            COMMENT '批准时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_code_version` (`code`, `version`, `deleted`),
    KEY `idx_material_id` (`material_id`),
    KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='物料清单主表';

-- ================================================
-- 6. 物料清单明细表
-- ================================================
CREATE TABLE IF NOT EXISTS `bom_detail` (
    `id`            BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `bom_id`        BIGINT       NOT NULL                COMMENT 'BOM主表ID',
    `line_no`       INT          DEFAULT 10              COMMENT '行号（10, 20, 30...）',
    `material_id`   BIGINT       NOT NULL                COMMENT '子件物料ID',
    `material_code` VARCHAR(50)  DEFAULT ''              COMMENT '子件编码（冗余）',
    `material_name` VARCHAR(200) DEFAULT ''              COMMENT '子件名称（冗余）',
    `spec`          VARCHAR(200) DEFAULT ''              COMMENT '规格型号',
    `quantity`      DECIMAL(18,6) DEFAULT 1.000000       COMMENT '主用量',
    `unit_id`       BIGINT       DEFAULT NULL            COMMENT '主单位ID',
    `unit_name`     VARCHAR(50)  DEFAULT ''              COMMENT '主单位名称（冗余）',
    `remark`        VARCHAR(500) DEFAULT ''              COMMENT '备注',
    `deleted`       TINYINT      DEFAULT 0               COMMENT '逻辑删除',
    `create_time`   DATETIME     DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time`   DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    KEY `idx_bom_id` (`bom_id`),
    KEY `idx_material_id` (`material_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='物料清单明细表';

-- ================================================
-- 7. 系统用户表
-- ================================================
CREATE TABLE IF NOT EXISTS `sys_user` (
    `id`          BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `employee_id` VARCHAR(50)  NOT NULL                COMMENT '工号',
    `username`    VARCHAR(100) NOT NULL                COMMENT '姓名',
    `password`    VARCHAR(200) DEFAULT NULL             COMMENT '密码（BCrypt哈希存储）',
    `role`        VARCHAR(50)  DEFAULT 'OPERATOR'      COMMENT '角色',
    `avatar`      VARCHAR(200) DEFAULT ''              COMMENT '头像URL',
    `status`      TINYINT      DEFAULT 1               COMMENT '状态：1启用 0禁用',
    `deleted`     TINYINT      DEFAULT 0               COMMENT '逻辑删除',
    `create_time` DATETIME     DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_employee_id` (`employee_id`, `deleted`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统用户';

-- ================================================
-- 初始化数据
-- ================================================

-- 用户数据（密码为 123456 的 BCrypt 哈希）
-- 原始密码：123456
-- BCrypt 哈希（cost=10）：$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
INSERT IGNORE INTO `sys_user` (`employee_id`, `username`, `password`, `role`) VALUES
('E001', '张伟',  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '管理员'),
('E002', '李娜',  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '质检员'),
('E003', '王芳',  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '操作员'),
('E010', 'admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '管理员');

-- 计量单位分组
INSERT IGNORE INTO `unit_group` (`id`, `code`, `name`, `sort_no`) VALUES
(1,  'TCM',     '中医药材',         1),
(2,  'STAT',    '统计学单位',       2),
(3,  'BARREL',  '标准桶',          3),
(4,  'SERVICE', 'FUWU 服务',       4),
(5,  'LENGTH',  'Length 长度',     5),
(6,  'OTHERS',  'Others 其他',     6),
(7,  'PARTS',   'PartsNumber 件数',7),
(8,  'TIME',    'Time 时间',       8),
(9,  'VOLUME',  'Volume 体积',     9),
(10, 'WEIGHT',  'Weight 质量',     10),
(11, 'LOGIS',   'YDW 物流单位',    11),
(12, 'PACK',    '包装规格',         12);

-- 计量单位
INSERT IGNORE INTO `unit` (`id`, `code`, `name`, `en_name`, `group_id`, `group_name`, `method`, `precision`, `is_base`, `status`) VALUES
(1,  'fy01',    '斤',    '',               10, 'Weight 质量',     '入位',   0, 0, 1),
(2,  'MTQ',     '立方米','Cubic Meters',    9, 'Volume 体积',     '四舍五入',3, 0, 1),
(3,  'KWh',     '千瓦时','Kilowatt-hour',   6, 'Others 其他',     '四舍五入',2, 0, 1),
(4,  'MA',      '毫安',  '',               8, 'Time 时间',       '入位',   0, 0, 1),
(5,  'KV',      '千伏',  '',               8, 'Time 时间',       '四舍五入',0, 1, 1),
(6,  'CMT',     '厘米',  'Centimeters',    5, 'Length 长度',     '四舍五入',0, 0, 1),
(7,  'DMT',     '分米',  'Decimeters',     5, 'Length 长度',     '四舍五入',0, 0, 1),
(8,  'kg',      'kg',   '',               10, 'Weight 质量',     '入位',   2, 0, 1),
(9,  'PCS',     'PCS',  'PCS',            7,  'PartsNumber 件数','入位',   0, 1, 1),
(10, 'g',       'g',    'Gram',           10, 'Weight 质量',     '入位',   5, 0, 1),
(11, 'ml',      '毫升', 'Milliliter',      9, 'Volume 体积',     '入位',   5, 0, 1),
(12, 'GE',      '个',   'Piece',          7,  'PartsNumber 件数','入位',   0, 1, 1),
(13, 'ZHI',     '支',   '',               7,  'PartsNumber 件数','入位',   0, 0, 1),
(14, 'HE',      '盒',   'Box',            12, '包装规格',         '入位',   0, 0, 1),
(15, 'TONG',    '桶',   'Barrel',          1, '中医药材',         '入位',   2, 0, 1);

-- 物料分类
INSERT IGNORE INTO `material_category` (`id`, `parent_id`, `code`, `name`, `sort_no`) VALUES
(1,  0,  'ROOT',    '全部',     0),
(2,  1,  'RM',      '原材料',   1),
(3,  1,  'FG',      '产品',     2),
(4,  1,  'WIP',     '中间品',   3),
(5,  1,  'PKG',     '包装材料', 4),
(6,  2,  'RM-LAT',  '乳胶原料', 1),
(7,  2,  'RM-CHEM', '化学试剂', 2),
(8,  3,  'FG-GLV',  '医用手套', 1),
(9,  3,  'FG-MASK', '口罩',    2),
(10, 5,  'PKG-BOX', '外箱',    1),
(11, 5,  'PKG-BAG', '内袋',    2);

-- 物料档案
INSERT IGNORE INTO `material` (`id`, `code`, `name`, `category_id`, `spec`, `unit_id`, `unit_name`, `type`, `brand`, `supplier`, `min_stock`, `max_stock`, `price`, `status`) VALUES
(1,  'RM001', '天然乳胶',     6,  '氨含量≥60%',   8,  'kg',  '原材料', 'TOPGLOVE',  '青岛诺邦橡胶',    1000, 10000, 18.5000, 1),
(2,  'RM002', '硫磺',        7,  '工业级99%',    8,  'kg',  '原材料', '国产',       '青岛化工',        500,  5000,  2.3000, 1),
(3,  'RM003', '氧化锌',      7,  '活性级',       8,  'kg',  '原材料', '国产',       '天津化工厂',      200,  2000,  8.8000, 1),
(4,  'FG001', '医用手套 S号', 8,  'S码/灭菌',    12, '个',  '产品',  '迈迪康',     '',                0,    0,    0.3500, 1),
(5,  'FG002', '医用手套 M号', 8,  'M码/灭菌',    12, '个',  '产品',  '迈迪康',     '',                0,    0,    0.3500, 1),
(6,  'FG003', '医用手套 L号', 8,  'L码/灭菌',    12, '个',  '产品',  '迈迪康',     '',                0,    0,    0.3500, 1),
(7,  'WIP001','胶膜 S号',    4,  'S码未硫化',    12, '个',  '中间品','迈迪康',     '',                0,    0,    0.1200, 1),
(8,  'PKG001','外包装箱',    10, '500只/箱',     14, '盒',  '包装材料','美信包装', '深圳美信',        1000, 5000,  1.5000, 1),
(9,  'PKG002','内包装袋',    11, '100只/袋',     14, '盒',  '包装材料','国产',      '广州包装厂',      5000, 20000, 0.0800, 1),
(10, 'RM004', '促进剂DM',    7,  '工业级',       8,  'kg',  '原材料', '国产',       '山东化工',        100,  1000,  45.0000, 1),
(11, 'FG004', '口罩 医用',    9,  '三层',        12, '个',  '产品',  '迈迪康',     '',                0,    0,    0.8000, 0);

-- BOM主表
INSERT IGNORE INTO `bom` (`id`, `code`, `version`, `bom_type`, `status`, `material_id`, `material_code`, `material_name`, `quantity`, `unit_id`, `unit_name`, `org_manage`, `org_use`) VALUES
(1, 'FG001', '1.00', '主生产', 'APPROVED', 4, 'FG001', '医用手套 S号', 1.0000, 12, '个', '迈迪康制造', '迈迪康制造'),
(2, 'FG002', '1.00', '主生产', 'APPROVED', 5, 'FG002', '医用手套 M号', 1.0000, 12, '个', '迈迪康制造', '迈迪康制造'),
(3, 'FG003', '1.00', '主生产', 'DRAFT',    6, 'FG003', '医用手套 L号', 1.0000, 12, '个', '迈迪康制造', '迈迪康制造');

-- BOM明细
INSERT IGNORE INTO `bom_detail` (`id`, `bom_id`, `line_no`, `material_id`, `material_code`, `material_name`, `spec`, `quantity`, `unit_id`, `unit_name`) VALUES
(1, 1, 10, 1, 'RM001', '天然乳胶',   '氨含量≥60%',  0.000500, 8,  'kg'),
(2, 1, 20, 2, 'RM002', '硫磺',      '工业级99%',   0.000010, 8,  'kg'),
(3, 1, 30, 3, 'RM003', '氧化锌',    '活性级',      0.000005, 8,  'kg'),
(4, 1, 40, 9, 'PKG002','内包装袋',   '100只/袋',    0.010000, 14, '盒'),
(5, 2, 10, 1, 'RM001', '天然乳胶',   '氨含量≥60%',  0.000520, 8,  'kg'),
(6, 2, 20, 2, 'RM002', '硫磺',      '工业级99%',   0.000010, 8,  'kg'),
(7, 3, 10, 1, 'RM001', '天然乳胶',   '氨含量≥60%',  0.000550, 8,  'kg'),
(8, 3, 20, 10,'RM004', '促进剂DM',   '工业级',      0.000008, 8,  'kg');

-- ================================================
-- PRO 模块：工艺路径 / 工序 / 阶段配置
-- ================================================

-- 工艺路径头表
CREATE TABLE IF NOT EXISTS `process_routing` (
    `id`              BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `routing_code`    VARCHAR(50)  NOT NULL COMMENT '工艺路径编码',
    `routing_name`    VARCHAR(100) DEFAULT '' COMMENT '工艺路径名称',
    `product_id`      BIGINT       DEFAULT NULL COMMENT '产品ID',
    `product_code`    VARCHAR(50)  DEFAULT '' COMMENT '产品编码',
    `product_model`   VARCHAR(50)  NOT NULL COMMENT '产品型号',
    `product_name`    VARCHAR(100) DEFAULT '' COMMENT '产品名称',
    `version`         VARCHAR(10)  NOT NULL DEFAULT 'V1.0' COMMENT '版本号',
    `is_default`      TINYINT      DEFAULT 0 COMMENT '是否默认路径：1是 0否',
    `status`          VARCHAR(20)  DEFAULT 'DRAFT' COMMENT '状态：DRAFT草稿/ACTIVE生效/OBSOLETE过期',
    `effective_date`  DATE         DEFAULT NULL COMMENT '生效日期',
    `expiry_date`     DATE         DEFAULT NULL COMMENT '失效日期',
    `description`     TEXT         DEFAULT NULL COMMENT '描述',
    `deleted`         TINYINT      DEFAULT 0 COMMENT '逻辑删除：0未删除 1已删除',
    `create_by`       VARCHAR(50)  DEFAULT '' COMMENT '创建人',
    `create_time`     DATETIME     DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_by`       VARCHAR(50)  DEFAULT '' COMMENT '更新人',
    `update_time`     DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_routing_ver` (`routing_code`, `version`, `deleted`),
    KEY `idx_product_id` (`product_id`),
    KEY `idx_product_model` (`product_model`),
    KEY `idx_status` (`status`),
    KEY `idx_is_default` (`is_default`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='工艺路径';

-- 报工点/路径步骤
CREATE TABLE IF NOT EXISTS `routing_step` (
    `id`             BIGINT      NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `routing_id`     BIGINT      NOT NULL COMMENT '工艺路径ID',
    `step_no`        INT         NOT NULL COMMENT '步骤序号（10, 20, 30...）',
    `step_name`      VARCHAR(50)  DEFAULT '' COMMENT '报工点名称',
    `step_code`      VARCHAR(50)  DEFAULT '' COMMENT '报工点编码',
    `report_point`   TINYINT     DEFAULT 1 COMMENT '是否报工点：1是 0否',
    `step_type`      VARCHAR(20) DEFAULT 'NORMAL' COMMENT '步骤类型：NORMAL普通/INSPECTION检验/STORE存储',
    `workshop_id`    BIGINT      DEFAULT NULL COMMENT '车间ID',
    `description`    VARCHAR(500) DEFAULT '' COMMENT '描述',
    `deleted`        TINYINT     DEFAULT 0 COMMENT '逻辑删除：0未删除 1已删除',
    `create_by`      VARCHAR(50)  DEFAULT '' COMMENT '创建人',
    `create_time`    DATETIME     DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_by`      VARCHAR(50)  DEFAULT '' COMMENT '更新人',
    `update_time`    DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_step` (`routing_id`, `step_no`, `deleted`),
    KEY `idx_routing_id` (`routing_id`),
    KEY `idx_step_type` (`step_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='工艺路径步骤';

-- 工序表
CREATE TABLE IF NOT EXISTS `operation` (
    `id`                  BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `routing_step_id`     BIGINT       NOT NULL COMMENT '工艺路径步骤ID',
    `operation_code`      VARCHAR(50)  NOT NULL COMMENT '工序编码',
    `operation_name`      VARCHAR(100) NOT NULL COMMENT '工序名称',
    `alias_name`          VARCHAR(100) DEFAULT '' COMMENT '工序别名',
    `seq_in_step`         INT          DEFAULT 1 COMMENT '步骤内序号',
    `work_center_id`      BIGINT       DEFAULT NULL COMMENT '工作中心ID',
    `work_center_name`    VARCHAR(100) DEFAULT '' COMMENT '工作中心名称（冗余）',
    `is_key_operation`    TINYINT      DEFAULT 0 COMMENT '是否关键工序：1是 0否',
    `material_trace_req`  TINYINT      DEFAULT 0 COMMENT '是否物料追溯：1是 0否',
    `inspection_trigger`  VARCHAR(50)  DEFAULT '' COMMENT '质检触发类型',
    `report_required`     TINYINT      DEFAULT 1 COMMENT '是否必须报工：1是 0否',
    `standard_time`       DECIMAL(10,2) DEFAULT 0 COMMENT '标准工时（分钟）',
    `description`         VARCHAR(500) DEFAULT '' COMMENT '工序描述',
    `remark`              VARCHAR(500) DEFAULT '' COMMENT '备注',
    `deleted`             TINYINT      DEFAULT 0 COMMENT '逻辑删除：0未删除 1已删除',
    `create_by`           VARCHAR(50)  DEFAULT '' COMMENT '创建人',
    `create_time`         DATETIME     DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_by`           VARCHAR(50)  DEFAULT '' COMMENT '更新人',
    `update_time`         DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_operation_code` (`operation_code`, `deleted`),
    KEY `idx_routing_step_id` (`routing_step_id`),
    KEY `idx_work_center_id` (`work_center_id`),
    KEY `idx_is_key` (`is_key_operation`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='工序';

-- 阶段模板池（9个标准阶段）
CREATE TABLE IF NOT EXISTS `stage_template` (
    `id`            BIGINT      NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `stage_code`    VARCHAR(30) NOT NULL COMMENT '阶段编码',
    `stage_name`    VARCHAR(50) NOT NULL COMMENT '阶段名称',
    `stage_type`    VARCHAR(20) NOT NULL COMMENT '阶段类型：CLEAN清场/IN进站/MATERIAL物料/FIRST首件/DATA数据/SELF_CHECK自检/REPORT报工/OUT出站',
    `is_default`    TINYINT     DEFAULT 1 COMMENT '是否默认启用：1是 0否',
    `sort_order`    INT         DEFAULT 0 COMMENT '排序号',
    `description`   VARCHAR(200) DEFAULT '' COMMENT '阶段描述',
    `deleted`       TINYINT     DEFAULT 0 COMMENT '逻辑删除：0未删除 1已删除',
    `create_time`   DATETIME     DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time`   DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_stage_code` (`stage_code`, `deleted`),
    KEY `idx_stage_type` (`stage_type`),
    KEY `idx_sort_order` (`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='阶段模板';

-- 工序阶段配置（开关矩阵）
CREATE TABLE IF NOT EXISTS `operation_stage_config` (
    `id`                  BIGINT      NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `operation_id`        BIGINT      NOT NULL COMMENT '工序ID',
    `stage_template_id`   BIGINT      NOT NULL COMMENT '阶段模板ID',
    `is_enabled`          TINYINT     DEFAULT 1 COMMENT '是否启用：1是 0否',
    `is_required`         TINYINT     DEFAULT 1 COMMENT '是否必填：1是 0否',
    `ui_config`           JSON        DEFAULT NULL COMMENT 'UI字段配置JSON（字段显示/隐藏/必填等）',
    `trigger_inspection`  TINYINT     DEFAULT 0 COMMENT '是否触发质检：1是 0否',
    `lock_until_inspect`  TINYINT     DEFAULT 0 COMMENT '是否锁定直到质检完成：1是 0否',
    `auto_pass`           TINYINT     DEFAULT 0 COMMENT '是否自动通过：1是 0否',
    `remark`              VARCHAR(200) DEFAULT '' COMMENT '备注',
    `create_time`         DATETIME     DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time`         DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_op_stage` (`operation_id`, `stage_template_id`),
    KEY `idx_operation_id` (`operation_id`),
    KEY `idx_stage_template_id` (`stage_template_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='工序阶段配置';

-- 初始化9个标准阶段
INSERT IGNORE INTO `stage_template` (`stage_code`, `stage_name`, `stage_type`, `sort_order`, `description`) VALUES
('PRE_CLEAN',    '前清场',     'CLEAN',      10, '生产前的设备和工作区域清洁'),
('CHECK_IN',     '进站',       'IN',         20, '进入工作站的登记和确认'),
('MAT_VERIFY',   '物料一致确认','MATERIAL',   30, '确认所使用的物料与要求一致'),
('FIRST_PIECE',  '首件确认',   'FIRST',      40, '首件产品质量确认'),
('DATA_COLLECT', '数据采集',   'DATA',       50, '生产过程数据的采集和记录'),
('SELF_CHECK',   '自检',       'SELF_CHECK', 60, '操作员自我检查'),
('POST_CLEAN',   '后清场',     'CLEAN',      70, '生产后的设备和工作区域清洁'),
('REPORT',       '报工',       'REPORT',     80, '生产完成后的报工确认'),
('CHECK_OUT',    '出站',       'OUT',        90, '离开工作站的确认和记录');

-- ================================================
-- PROD 模块：生产管理
-- ================================================

-- 生产订单表
CREATE TABLE IF NOT EXISTS `production_order` (
    `id`              BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `order_no`        VARCHAR(50)  NOT NULL                COMMENT '订单编号',
    `order_type`      VARCHAR(20)  DEFAULT 'STANDARD'      COMMENT '订单类型：STANDARD标准/EMERGENCY紧急/SAMPLE样品',
    `customer_name`   VARCHAR(200) DEFAULT ''              COMMENT '客户名称',
    `customer_code`   VARCHAR(50)  DEFAULT ''              COMMENT '客户编码',
    `delivery_date`   DATE         DEFAULT NULL            COMMENT '交货日期',
    `priority`        TINYINT      DEFAULT 3               COMMENT '优先级：1高 2中 3低',
    `status`          VARCHAR(20)  DEFAULT 'DRAFT'         COMMENT '状态：DRAFT草稿/RELEASED已下达/IN_PROGRESS生产中/COMPLETED已完成/CLOSED已关闭',
    `total_quantity`  DECIMAL(18,4) DEFAULT 0              COMMENT '总数量',
    `completed_quantity` DECIMAL(18,4) DEFAULT 0          COMMENT '已完成数量',
    `remark`          TEXT         DEFAULT NULL            COMMENT '备注',
    `deleted`         TINYINT      DEFAULT 0               COMMENT '逻辑删除',
    `create_time`     DATETIME     DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time`     DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `create_by`       VARCHAR(50)  DEFAULT ''              COMMENT '创建人',
    `update_by`       VARCHAR(50)  DEFAULT ''              COMMENT '更新人',
    `release_by`      VARCHAR(50)  DEFAULT ''              COMMENT '下达人',
    `release_time`    DATETIME     DEFAULT NULL            COMMENT '下达时间',
    `close_by`        VARCHAR(50)  DEFAULT ''              COMMENT '关闭人',
    `close_time`      DATETIME     DEFAULT NULL            COMMENT '关闭时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_order_no` (`order_no`, `deleted`),
    KEY `idx_status` (`status`),
    KEY `idx_delivery_date` (`delivery_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='生产订单';

-- 生产订单明细表
CREATE TABLE IF NOT EXISTS `production_order_detail` (
    `id`                BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `order_id`          BIGINT       NOT NULL                COMMENT '订单ID',
    `line_no`           INT          DEFAULT 10              COMMENT '行号',
    `material_id`       BIGINT       NOT NULL                COMMENT '物料ID',
    `material_code`     VARCHAR(50)  DEFAULT ''              COMMENT '物料编码',
    `material_name`     VARCHAR(200) DEFAULT ''              COMMENT '物料名称',
    `spec`              VARCHAR(200) DEFAULT ''              COMMENT '规格型号',
    `plan_quantity`     DECIMAL(18,4) DEFAULT 0              COMMENT '计划数量',
    `completed_quantity` DECIMAL(18,4) DEFAULT 0             COMMENT '已完成数量',
    `unit_id`           BIGINT       DEFAULT NULL            COMMENT '单位ID',
    `unit_name`         VARCHAR(50)  DEFAULT ''              COMMENT '单位名称',
    `bom_id`            BIGINT       DEFAULT NULL            COMMENT 'BOM ID',
    `bom_version`       VARCHAR(20)  DEFAULT ''              COMMENT 'BOM版本',
    `routing_id`        BIGINT       DEFAULT NULL            COMMENT '工艺路径ID',
    `remark`            VARCHAR(500) DEFAULT ''              COMMENT '备注',
    `deleted`           TINYINT      DEFAULT 0               COMMENT '逻辑删除',
    `create_time`       DATETIME     DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time`       DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    KEY `idx_order_id` (`order_id`),
    KEY `idx_material_id` (`material_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='生产订单明细';

-- 生产工单表
CREATE TABLE IF NOT EXISTS `work_order` (
    `id`                  BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `work_order_no`       VARCHAR(50)  NOT NULL                COMMENT '工单编号',
    `order_id`            BIGINT       DEFAULT NULL            COMMENT '生产订单ID',
    `order_no`            VARCHAR(50)  DEFAULT ''              COMMENT '生产订单编号',
    `order_detail_id`     BIGINT       DEFAULT NULL            COMMENT '订单明细ID',
    `material_id`         BIGINT       NOT NULL                COMMENT '物料ID',
    `material_code`       VARCHAR(50)  DEFAULT ''              COMMENT '物料编码',
    `material_name`       VARCHAR(200) DEFAULT ''              COMMENT '物料名称',
    `spec`                VARCHAR(200) DEFAULT ''              COMMENT '规格型号',
    `plan_quantity`       DECIMAL(18,4) DEFAULT 0              COMMENT '计划数量',
    `completed_quantity`  DECIMAL(18,4) DEFAULT 0              COMMENT '已完成数量',
    `qualified_quantity`  DECIMAL(18,4) DEFAULT 0              COMMENT '合格数量',
    `unqualified_quantity` DECIMAL(18,4) DEFAULT 0             COMMENT '不合格数量',
    `unit_id`             BIGINT       DEFAULT NULL            COMMENT '单位ID',
    `unit_name`           VARCHAR(50)  DEFAULT ''              COMMENT '单位名称',
    `bom_id`              BIGINT       DEFAULT NULL            COMMENT 'BOM ID',
    `bom_version`         VARCHAR(20)  DEFAULT ''              COMMENT 'BOM版本',
    `routing_id`          BIGINT       DEFAULT NULL            COMMENT '工艺路径ID',
    `work_center_id`      BIGINT       DEFAULT NULL            COMMENT '工作中心ID',
    `work_center_name`    VARCHAR(100) DEFAULT ''              COMMENT '工作中心名称',
    `start_date`          DATE         DEFAULT NULL            COMMENT '计划开始日期',
    `end_date`            DATE         DEFAULT NULL            COMMENT '计划结束日期',
    `actual_start_time`   DATETIME     DEFAULT NULL            COMMENT '实际开始时间',
    `actual_end_time`     DATETIME     DEFAULT NULL            COMMENT '实际结束时间',
    `status`              VARCHAR(20)  DEFAULT 'DRAFT'         COMMENT '状态：DRAFT草稿/RELEASED已下达/IN_PROGRESS执行中/COMPLETED已完成/CLOSED已关闭',
    `progress`            DECIMAL(5,2) DEFAULT 0.00            COMMENT '进度百分比',
    `remark`              TEXT         DEFAULT NULL            COMMENT '备注',
    `deleted`             TINYINT      DEFAULT 0               COMMENT '逻辑删除',
    `create_time`         DATETIME     DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time`         DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `create_by`           VARCHAR(50)  DEFAULT ''              COMMENT '创建人',
    `update_by`           VARCHAR(50)  DEFAULT ''              COMMENT '更新人',
    `release_by`          VARCHAR(50)  DEFAULT ''              COMMENT '下达人',
    `release_time`        DATETIME     DEFAULT NULL            COMMENT '下达时间',
    `close_by`            VARCHAR(50)  DEFAULT ''              COMMENT '关闭人',
    `close_time`          DATETIME     DEFAULT NULL            COMMENT '关闭时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_work_order_no` (`work_order_no`, `deleted`),
    KEY `idx_order_id` (`order_id`),
    KEY `idx_material_id` (`material_id`),
    KEY `idx_work_center_id` (`work_center_id`),
    KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='生产工单';

-- 工单工序表
CREATE TABLE IF NOT EXISTS `work_order_operation` (
    `id`                  BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `work_order_id`       BIGINT       NOT NULL                COMMENT '工单ID',
    `operation_id`        BIGINT       NOT NULL                COMMENT '工序ID',
    `operation_code`      VARCHAR(50)  DEFAULT ''              COMMENT '工序编码',
    `operation_name`      VARCHAR(100) DEFAULT ''              COMMENT '工序名称',
    `seq_no`              INT          DEFAULT 0               COMMENT '序号',
    `work_center_id`      BIGINT       DEFAULT NULL            COMMENT '工作中心ID',
    `work_center_name`    VARCHAR(100) DEFAULT ''              COMMENT '工作中心名称',
    `plan_quantity`       DECIMAL(18,4) DEFAULT 0              COMMENT '计划数量',
    `completed_quantity`  DECIMAL(18,4) DEFAULT 0              COMMENT '已完成数量',
    `qualified_quantity`  DECIMAL(18,4) DEFAULT 0              COMMENT '合格数量',
    `status`              VARCHAR(20)  DEFAULT 'PENDING'       COMMENT '状态：PENDING待开始/IN_PROGRESS进行中/COMPLETED已完成/SKIPPED跳过',
    `start_time`          DATETIME     DEFAULT NULL            COMMENT '开始时间',
    `end_time`            DATETIME     DEFAULT NULL            COMMENT '结束时间',
    `actual_work_hours`   DECIMAL(10,2) DEFAULT 0              COMMENT '实际工时',
    `remark`              VARCHAR(500) DEFAULT ''              COMMENT '备注',
    `deleted`             TINYINT      DEFAULT 0               COMMENT '逻辑删除',
    `create_time`         DATETIME     DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time`         DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    KEY `idx_work_order_id` (`work_order_id`),
    KEY `idx_operation_id` (`operation_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='工单工序';

-- 生产任务单表
CREATE TABLE IF NOT EXISTS `task_order` (
    `id`                  BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `task_no`             VARCHAR(50)  NOT NULL                COMMENT '任务编号',
    `work_order_id`       BIGINT       NOT NULL                COMMENT '工单ID',
    `work_order_no`       VARCHAR(50)  DEFAULT ''              COMMENT '工单编号',
    `work_order_operation_id` BIGINT    DEFAULT NULL            COMMENT '工单工序ID',
    `operation_code`      VARCHAR(50)  DEFAULT ''              COMMENT '工序编码',
    `operation_name`      VARCHAR(100) DEFAULT ''              COMMENT '工序名称',
    `material_id`         BIGINT       NOT NULL                COMMENT '物料ID',
    `material_code`       VARCHAR(50)  DEFAULT ''              COMMENT '物料编码',
    `material_name`       VARCHAR(200) DEFAULT ''              COMMENT '物料名称',
    `plan_quantity`       DECIMAL(18,4) DEFAULT 0              COMMENT '计划数量',
    `completed_quantity`  DECIMAL(18,4) DEFAULT 0              COMMENT '已完成数量',
    `qualified_quantity`  DECIMAL(18,4) DEFAULT 0              COMMENT '合格数量',
    `unqualified_quantity` DECIMAL(18,4) DEFAULT 0             COMMENT '不合格数量',
    `unit_id`             BIGINT       DEFAULT NULL            COMMENT '单位ID',
    `unit_name`           VARCHAR(50)  DEFAULT ''              COMMENT '单位名称',
    `work_center_id`      BIGINT       DEFAULT NULL            COMMENT '工作中心ID',
    `work_center_name`    VARCHAR(100) DEFAULT ''              COMMENT '工作中心名称',
    `assigned_to`         BIGINT       DEFAULT NULL            COMMENT '分配给（用户ID）',
    `assigned_to_name`    VARCHAR(100) DEFAULT ''              COMMENT '分配给（用户名）',
    `assign_time`         DATETIME     DEFAULT NULL            COMMENT '分配时间',
    `assign_by`           VARCHAR(50)  DEFAULT ''              COMMENT '分配人',
    `received_time`       DATETIME     DEFAULT NULL            COMMENT '接收时间',
    `received_by`         VARCHAR(50)  DEFAULT ''              COMMENT '接收人',
    `start_time`          DATETIME     DEFAULT NULL            COMMENT '开始时间',
    `end_time`            DATETIME     DEFAULT NULL            COMMENT '结束时间',
    `actual_work_hours`   DECIMAL(10,2) DEFAULT 0              COMMENT '实际工时',
    `status`              VARCHAR(20)  DEFAULT 'PENDING'       COMMENT '状态：PENDING待分配/ASSIGNED已分配/RECEIVED已接收/IN_PROGRESS进行中/COMPLETED已完成/CANCELLED已取消',
    `progress`            DECIMAL(5,2) DEFAULT 0.00            COMMENT '进度百分比',
    `remark`              TEXT         DEFAULT NULL            COMMENT '备注',
    `deleted`             TINYINT      DEFAULT 0               COMMENT '逻辑删除',
    `create_time`         DATETIME     DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time`         DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `create_by`           VARCHAR(50)  DEFAULT ''              COMMENT '创建人',
    `update_by`           VARCHAR(50)  DEFAULT ''              COMMENT '更新人',
    `complete_by`         VARCHAR(50)  DEFAULT ''              COMMENT '完成人',
    `complete_time`       DATETIME     DEFAULT NULL            COMMENT '完成时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_task_no` (`task_no`, `deleted`),
    KEY `idx_work_order_id` (`work_order_id`),
    KEY `idx_assigned_to` (`assigned_to`),
    KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='生产任务单';
-- ================================================
-- SYS 模块：系统管理
-- ================================================

-- 1. 组织架构表
CREATE TABLE IF NOT EXISTS `sys_organization` (
    `id`          BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `parent_id`   BIGINT       DEFAULT 0               COMMENT '父组织ID，0为顶级',
    `org_code`    VARCHAR(50)  NOT NULL                COMMENT '组织编码',
    `org_name`    VARCHAR(100) NOT NULL                COMMENT '组织名称',
    `org_type`    VARCHAR(20)  NOT NULL                COMMENT '组织类型：公司/部门/小组',
    `leader_id`   BIGINT       DEFAULT NULL            COMMENT '负责人ID',
    `leader_name` VARCHAR(50)  DEFAULT ''              COMMENT '负责人姓名（冗余）',
    `phone`       VARCHAR(20)  DEFAULT ''              COMMENT '联系电话',
    `address`     VARCHAR(200) DEFAULT ''              COMMENT '地址',
    `sort_no`     INT          DEFAULT 0               COMMENT '排序号',
    `status`      TINYINT      DEFAULT 1               COMMENT '状态：1启用 0禁用',
    `deleted`     TINYINT      DEFAULT 0               COMMENT '逻辑删除',
    `create_time` DATETIME     DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `create_by`   VARCHAR(50)  DEFAULT ''              COMMENT '创建人',
    `update_by`   VARCHAR(50)  DEFAULT ''              COMMENT '更新人',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_org_code` (`org_code`, `deleted`),
    KEY `idx_parent_id` (`parent_id`),
    KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='组织架构';

-- 2. 角色表
CREATE TABLE IF NOT EXISTS `sys_role` (
    `id`          BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `role_code`   VARCHAR(50)  NOT NULL                COMMENT '角色编码',
    `role_name`   VARCHAR(100) NOT NULL                COMMENT '角色名称',
    `description` VARCHAR(200) DEFAULT ''              COMMENT '角色描述',
    `sort_no`     INT          DEFAULT 0               COMMENT '排序号',
    `status`      TINYINT      DEFAULT 1               COMMENT '状态：1启用 0禁用',
    `deleted`     TINYINT      DEFAULT 0               COMMENT '逻辑删除',
    `create_time` DATETIME     DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `create_by`   VARCHAR(50)  DEFAULT ''              COMMENT '创建人',
    `update_by`   VARCHAR(50)  DEFAULT ''              COMMENT '更新人',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_role_code` (`role_code`, `deleted`),
    KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色';

-- 3. 权限表
CREATE TABLE IF NOT EXISTS `sys_permission` (
    `id`          BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `parent_id`   BIGINT       DEFAULT 0               COMMENT '父权限ID，0为顶级',
    `perm_code`   VARCHAR(100) NOT NULL                COMMENT '权限编码',
    `perm_name`   VARCHAR(100) NOT NULL                COMMENT '权限名称',
    `perm_type`   VARCHAR(20)  NOT NULL                COMMENT '权限类型：MENU/BUTTON/DATA',
    `menu_url`    VARCHAR(200) DEFAULT ''              COMMENT '菜单URL',
    `icon`        VARCHAR(50)  DEFAULT ''              COMMENT '图标',
    `sort_no`     INT          DEFAULT 0               COMMENT '排序号',
    `status`      TINYINT      DEFAULT 1               COMMENT '状态：1启用 0禁用',
    `deleted`     TINYINT      DEFAULT 0               COMMENT '逻辑删除',
    `create_time` DATETIME     DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `create_by`   VARCHAR(50)  DEFAULT ''              COMMENT '创建人',
    `update_by`   VARCHAR(50)  DEFAULT ''              COMMENT '更新人',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_perm_code` (`perm_code`, `deleted`),
    KEY `idx_parent_id` (`parent_id`),
    KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='权限';

-- 4. 角色权限关联表
CREATE TABLE IF NOT EXISTS `sys_role_permission` (
    `id`             BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `role_id`        BIGINT       NOT NULL                COMMENT '角色ID',
    `permission_id`  BIGINT       NOT NULL                COMMENT '权限ID',
    `create_time`    DATETIME     DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_role_perm` (`role_id`, `permission_id`),
    KEY `idx_role_id` (`role_id`),
    KEY `idx_permission_id` (`permission_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色权限关联';

-- 5. 用户角色关联表
CREATE TABLE IF NOT EXISTS `sys_user_role` (
    `id`          BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `user_id`     BIGINT       NOT NULL                COMMENT '用户ID',
    `role_id`     BIGINT       NOT NULL                COMMENT '角色ID',
    `create_time` DATETIME     DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_user_role` (`user_id`, `role_id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_role_id` (`role_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户角色关联';

-- 6. 工厂表
CREATE TABLE IF NOT EXISTS `sys_factory` (
    `id`          BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `factory_code` VARCHAR(50)  NOT NULL                COMMENT '工厂编码',
    `factory_name` VARCHAR(100) NOT NULL                COMMENT '工厂名称',
    `short_name`  VARCHAR(50)  DEFAULT ''              COMMENT '工厂简称',
    `org_id`      BIGINT       DEFAULT NULL            COMMENT '所属组织ID',
    `org_name`    VARCHAR(100) DEFAULT ''              COMMENT '所属组织名称（冗余）',
    `address`     VARCHAR(200) DEFAULT ''              COMMENT '地址',
    `contact`     VARCHAR(50)  DEFAULT ''              COMMENT '联系人',
    `phone`       VARCHAR(20)  DEFAULT ''              COMMENT '联系电话',
    `email`       VARCHAR(100) DEFAULT ''              COMMENT '邮箱',
    `is_default`  TINYINT      DEFAULT 0               COMMENT '是否默认工厂：1是 0否',
    `sort_no`     INT          DEFAULT 0               COMMENT '排序号',
    `status`      TINYINT      DEFAULT 1               COMMENT '状态：1启用 0禁用',
    `deleted`     TINYINT      DEFAULT 0               COMMENT '逻辑删除',
    `create_time` DATETIME     DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `create_by`   VARCHAR(50)  DEFAULT ''              COMMENT '创建人',
    `update_by`   VARCHAR(50)  DEFAULT ''              COMMENT '更新人',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_factory_code` (`factory_code`, `deleted`),
    KEY `idx_org_id` (`org_id`),
    KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='工厂';

-- 7. 用户工厂关联表
CREATE TABLE IF NOT EXISTS `sys_user_factory` (
    `id`          BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `user_id`     BIGINT       NOT NULL                COMMENT '用户ID',
    `factory_id`  BIGINT       NOT NULL                COMMENT '工厂ID',
    `is_default`  TINYINT      DEFAULT 0               COMMENT '是否默认工厂：1是 0否',
    `create_time` DATETIME     DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_user_factory` (`user_id`, `factory_id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_factory_id` (`factory_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户工厂关联';

-- ================================================
-- 系统管理模块初始化数据
-- ================================================

-- 组织架构数据
INSERT IGNORE INTO `sys_organization` (`id`, `parent_id`, `org_code`, `org_name`, `org_type`, `sort_no`) VALUES
(1, 0, 'MDK', '迈迪康集团', '公司', 1),
(2, 1, 'MDK-MFG', '制造中心', '部门', 1),
(3, 1, 'MDK-QC', '质量中心', '部门', 2),
(4, 1, 'MDK-ENG', '工程中心', '部门', 3),
(5, 1, 'MDK-SALE', '销售中心', '部门', 4),
(6, 2, 'MDK-MFG-01', '生产一部', '小组', 1),
(7, 2, 'MDK-MFG-02', '生产二部', '小组', 2),
(8, 3, 'MDK-QC-01', '质检一部', '小组', 1),
(9, 3, 'MDK-QC-02', '质检二部', '小组', 2);

-- 角色数据
INSERT IGNORE INTO `sys_role` (`id`, `role_code`, `role_name`, `description`, `sort_no`) VALUES
(1, 'SUPER_ADMIN', '超级管理员', '系统最高权限，可管理所有功能', 1),
(2, 'ADMIN', '管理员', '工厂管理员，可管理本工厂数据', 2),
(3, 'OPERATOR', '操作员', '普通操作员，可进行日常操作', 3),
(4, 'INSPECTOR', '质检员', '质量检验员，可进行质量检验', 4),
(5, 'ENGINEER', '工程师', '工艺工程师，可维护工艺路线', 5),
(6, 'VIEWER', '查看员', '只读权限，仅可查看数据', 6);

-- 权限数据
INSERT IGNORE INTO `sys_permission` (`id`, `parent_id`, `perm_code`, `perm_name`, `perm_type`, `menu_url`, `icon`, `sort_no`) VALUES
-- 一级菜单
(1,  0, 'SYSTEM',       '系统管理',        'MENU', '/system',      'SettingOutlined',  90),
(2,  0, 'BASIC_DATA',   '基础数据',        'MENU', '/basic-data',  'DatabaseOutlined', 10),
(3,  0, 'PRO',          '生产管理',        'MENU', '/production',  'ProductOutlined',   20),
(4,  0, 'QUALITY',      '质量管理',        'MENU', '/quality',     'SafetyOutlined',   30),
(5,  0, 'WAREHOUSE',    '仓储管理',        'MENU', '/warehouse',   'InboxOutlined',    40),
-- 系统管理子菜单
(11, 1, 'SYSTEM-ORG',   '组织架构',        'MENU', '/system/org',  'TeamOutlined',     11),
(12, 1, 'SYSTEM-ROLE',  '角色管理',        'MENU', '/system/role', 'UserOutlined',     12),
(13, 1, 'SYSTEM-PERM',  '权限管理',        'MENU', '/system/perm', 'KeyOutlined',      13),
(14, 1, 'SYSTEM-FACT',  '工厂管理',        'MENU', '/system/fact', 'ShopOutlined',     14),
-- 基础数据子菜单
(21, 2, 'BD-MAT',       '物料档案',        'MENU', '/basic-data/material',   'AppstoreOutlined', 21),
(22, 2, 'BD-BOM',       '物料清单',        'MENU', '/basic-data/bom',       'NodeIndexOutlined', 22),
(23, 2, 'BD-UNIT',      '计量单位',        'MENU', '/basic-data/unit',      'RulerOutlined',     23),
(24, 2, 'BD-WORKSHOP',  '车间管理',        'MENU', '/basic-data/workshop',  'HomeOutlined',      24),
(25, 2, 'BD-WORKCENTER','工作中心',        'MENU', '/basic-data/workcenter','ControlOutlined',   25),
-- 按钮权限
(101, 11, 'SYSTEM-ORG-ADD',    '组织架构-新增',    'BUTTON', '', '', 1),
(102, 11, 'SYSTEM-ORG-EDIT',   '组织架构-编辑',    'BUTTON', '', '', 2),
(103, 11, 'SYSTEM-ORG-DEL',    '组织架构-删除',    'BUTTON', '', '', 3),
(104, 12, 'SYSTEM-ROLE-ADD',   '角色管理-新增',    'BUTTON', '', '', 1),
(105, 12, 'SYSTEM-ROLE-EDIT',  '角色管理-编辑',    'BUTTON', '', '', 2),
(106, 12, 'SYSTEM-ROLE-DEL',   '角色管理-删除',    'BUTTON', '', '', 3),
(107, 12, 'SYSTEM-ROLE-PERM',  '角色管理-分配权限','BUTTON', '', '', 4),
(108, 13, 'SYSTEM-PERM-ADD',   '权限管理-新增',    'BUTTON', '', '', 1),
(109, 13, 'SYSTEM-PERM-EDIT',  '权限管理-编辑',    'BUTTON', '', '', 2),
(110, 13, 'SYSTEM-PERM-DEL',   '权限管理-删除',    'BUTTON', '', '', 3),
(111, 14, 'SYSTEM-FACT-ADD',   '工厂管理-新增',    'BUTTON', '', '', 1),
(112, 14, 'SYSTEM-FACT-EDIT',  '工厂管理-编辑',    'BUTTON', '', '', 2),
(113, 14, 'SYSTEM-FACT-DEL',   '工厂管理-删除',    'BUTTON', '', '', 3);

-- 工厂数据
INSERT IGNORE INTO `sys_factory` (`id`, `factory_code`, `factory_name`, `short_name`, `org_id`, `org_name`, `address`, `contact`, `phone`, `is_default`, `sort_no`) VALUES
(1, 'FACT-001', '迈迪康青岛工厂', '青岛工厂', 2, '制造中心', '青岛市即墨区智能制造产业园', '张经理', '0532-88888888', 1, 1),
(2, 'FACT-002', '迈迪康深圳工厂', '深圳工厂', 2, '制造中心', '深圳市宝安区高新科技园', '李经理', '0755-66666666', 0, 2),
(3, 'FACT-003', '迈迪康上海工厂', '上海工厂', 2, '制造中心', '上海市松江区工业园区', '王经理', '021-55555555', 0, 3);

-- 用户角色关联（为现有用户分配角色）
INSERT IGNORE INTO `sys_user_role` (`user_id`, `role_id`) VALUES
(1, 1),  -- E001 张伟 -> 超级管理员
(2, 4),  -- E002 李娜 -> 质检员
(3, 3),  -- E003 王芳 -> 操作员
(4, 1);  -- E010 admin -> 超级管理员

-- 用户工厂关联（为现有用户分配工厂）
INSERT IGNORE INTO `sys_user_factory` (`user_id`, `factory_id`, `is_default`) VALUES
(1, 1, 1),  -- E001 -> 青岛工厂（默认）
(1, 2, 0),  -- E001 -> 深圳工厂
(2, 1, 1),  -- E002 -> 青岛工厂
(3, 1, 1),  -- E003 -> 青岛工厂
(4, 1, 1);  -- E010 -> 青岛工厂

-- 角色权限关联（超级管理员拥有所有权限）
INSERT IGNORE INTO `sys_role_permission` (`role_id`, `permission_id`)
SELECT 1, id FROM `sys_permission`;

-- 管理员拥有部分权限
INSERT IGNORE INTO `sys_role_permission` (`role_id`, `permission_id`) VALUES
(2, 1), (2, 2), (2, 3), (2, 4), (2, 5),  -- 一级菜单
(2, 21), (2, 22), (2, 23), (2, 24), (2, 25),  -- 基础数据
(2, 101), (2, 102), (2, 103),  -- 组织架构按钮
(2, 111), (2, 112), (2, 113);  -- 工厂管理按钮

-- ================================================
-- 车间执行模块 (WIP - Work in Progress)
-- ================================================

-- 1. PAD任务表
CREATE TABLE IF NOT EXISTS `pad_task` (
    `id`                BIGINT       NOT NULL AUTO_INCREMENT COMMENT "主键ID",
    `task_no`           VARCHAR(50)  NOT NULL                COMMENT "任务编号",
    `task_name`         VARCHAR(200) NOT NULL                COMMENT "任务名称",
    `product_id`        BIGINT       NOT NULL                COMMENT "产品ID",
    `product_code`      VARCHAR(50)  DEFAULT ""              COMMENT "产品编码（冗余）",
    `product_name`      VARCHAR(200) DEFAULT ""              COMMENT "产品名称（冗余）",
    `bom_id`            BIGINT       NOT NULL                COMMENT "BOM ID",
    `bom_version`       VARCHAR(20)  DEFAULT ""              COMMENT "BOM版本",
    `plan_quantity`     DECIMAL(18,4) NOT NULL               COMMENT "计划数量",
    `unit_id`           BIGINT       DEFAULT NULL            COMMENT "单位ID",
    `unit_name`         VARCHAR(50)  DEFAULT ""              COMMENT "单位名称（冗余）",
    `routing_id`        BIGINT       DEFAULT NULL            COMMENT "工艺路径ID",
    `operation_id`      BIGINT       NOT NULL                COMMENT "工序ID",
    `operation_code`    VARCHAR(50)  DEFAULT ""              COMMENT "工序编码（冗余）",
    `operation_name`    VARCHAR(100) DEFAULT ""              COMMENT "工序名称（冗余）",
    `work_center_id`    BIGINT       DEFAULT NULL            COMMENT "工作中心ID",
    `work_center_name`  VARCHAR(100) DEFAULT ""              COMMENT "工作中心名称（冗余）",
    `status`            VARCHAR(20)  DEFAULT "PENDING"       COMMENT "状态：PENDING待开始/IN_PROGRESS进行中/PAUSED已暂停/COMPLETED已完成/CANCELLED已取消",
    `priority`          VARCHAR(20)  DEFAULT "NORMAL"        COMMENT "优先级：HIGH高/NORMAL中/LOW低",
    `planned_start_time`DATETIME     DEFAULT NULL            COMMENT "计划开始时间",
    `planned_end_time`  DATETIME     DEFAULT NULL            COMMENT "计划结束时间",
    `actual_start_time` DATETIME     DEFAULT NULL            COMMENT "实际开始时间",
    `actual_end_time`   DATETIME     DEFAULT NULL            COMMENT "实际结束时间",
    `operator_id`       BIGINT       DEFAULT NULL            COMMENT "操作员ID",
    `operator_name`     VARCHAR(50)  DEFAULT ""              COMMENT "操作员姓名（冗余）",
    `completed_quantity`DECIMAL(18,4) DEFAULT 0              COMMENT "完成数量",
    `qualified_quantity`DECIMAL(18,4) DEFAULT 0              COMMENT "合格数量",
    `rejected_quantity`DECIMAL(18,4) DEFAULT 0              COMMENT "不合格数量",
    `progress`          DECIMAL(5,2) DEFAULT 0              COMMENT "进度百分比",
    `remark`            TEXT         DEFAULT NULL            COMMENT "备注",
    `deleted`           TINYINT      DEFAULT 0               COMMENT "逻辑删除",
    `create_time`       DATETIME     DEFAULT CURRENT_TIMESTAMP COMMENT "创建时间",
    `update_time`       DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT "更新时间",
    `create_by`         VARCHAR(50)  DEFAULT ""              COMMENT "创建人",
    `update_by`         VARCHAR(50)  DEFAULT ""              COMMENT "更新人",
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_task_no` (`task_no`, `deleted`),
    KEY `idx_product_id` (`product_id`),
    KEY `idx_bom_id` (`bom_id`),
    KEY `idx_operation_id` (`operation_id`),
    KEY `idx_work_center_id` (`work_center_id`),
    KEY `idx_status` (`status`),
    KEY `idx_planned_start_time` (`planned_start_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT="PAD任务表";

-- 2. PAD操作记录表
CREATE TABLE IF NOT EXISTS `pad_operation_record` (
    `id`            BIGINT       NOT NULL AUTO_INCREMENT COMMENT "主键ID",
    `task_id`       BIGINT       NOT NULL                COMMENT "PAD任务ID",
    `operation_type` VARCHAR(50)  NOT NULL                COMMENT "操作类型：START开始/PAUSE暂停/RESUME恢复/COMPLETE完成/CANCEL取消",
    `operator_id`   BIGINT       DEFAULT NULL            COMMENT "操作员ID",
    `operator_name` VARCHAR(50)  DEFAULT ""              COMMENT "操作员姓名（冗余）",
    `operation_time`DATETIME     DEFAULT CURRENT_TIMESTAMP COMMENT "操作时间",
    `quantity`      DECIMAL(18,4) DEFAULT 0              COMMENT "操作数量",
    `status_before` VARCHAR(20)  DEFAULT ""              COMMENT "操作前状态",
    `status_after`  VARCHAR(20)  DEFAULT ""              COMMENT "操作后状态",
    `remark`        VARCHAR(500) DEFAULT ""              COMMENT "备注",
    `deleted`       TINYINT      DEFAULT 0               COMMENT "逻辑删除",
    `create_time`   DATETIME     DEFAULT CURRENT_TIMESTAMP COMMENT "创建时间",
    PRIMARY KEY (`id`),
    KEY `idx_task_id` (`task_id`),
    KEY `idx_operation_time` (`operation_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT="PAD操作记录表";

-- 3. PAD质检记录表
CREATE TABLE IF NOT EXISTS `pad_quality_check` (
    `id`                BIGINT       NOT NULL AUTO_INCREMENT COMMENT "主键ID",
    `task_id`           BIGINT       NOT NULL                COMMENT "PAD任务ID",
    `check_no`          VARCHAR(50)  NOT NULL                COMMENT "检验单号",
    `check_type`        VARCHAR(50)  NOT NULL                COMMENT "检验类型：FIRST首件/IPQC过程检验/FQC最终检验",
    `check_time`        DATETIME     DEFAULT CURRENT_TIMESTAMP COMMENT "检验时间",
    `inspector_id`      BIGINT       DEFAULT NULL            COMMENT "检验员ID",
    `inspector_name`    VARCHAR(50)  DEFAULT ""              COMMENT "检验员姓名（冗余）",
    `check_quantity`    DECIMAL(18,4) DEFAULT 0              COMMENT "检验数量",
    `qualified_quantity`DECIMAL(18,4) DEFAULT 0              COMMENT "合格数量",
    `rejected_quantity` DECIMAL(18,4) DEFAULT 0              COMMENT "不合格数量",
    `qualified_rate`    DECIMAL(5,2) DEFAULT 0              COMMENT "合格率",
    `check_result`      VARCHAR(20)  DEFAULT ""              COMMENT "检验结果：PASSED通过/FAILED未通过/PENDING待定",
    `defect_description` TEXT         DEFAULT NULL            COMMENT "缺陷描述",
    `rectification`     TEXT         DEFAULT NULL            COMMENT "整改措施",
    `deleted`           TINYINT      DEFAULT 0               COMMENT "逻辑删除",
    `create_time`       DATETIME     DEFAULT CURRENT_TIMESTAMP COMMENT "创建时间",
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_check_no` (`check_no`, `deleted`),
    KEY `idx_task_id` (`task_id`),
    KEY `idx_check_type` (`check_type`),
    KEY `idx_check_time` (`check_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT="PAD质检记录表";

-- 4. PAD物料使用记录表
CREATE TABLE IF NOT EXISTS `pad_material_usage` (
    `id`                BIGINT       NOT NULL AUTO_INCREMENT COMMENT "主键ID",
    `task_id`           BIGINT       NOT NULL                COMMENT "PAD任务ID",
    `material_id`       BIGINT       NOT NULL                COMMENT "物料ID",
    `material_code`     VARCHAR(50)  DEFAULT ""              COMMENT "物料编码（冗余）",
    `material_name`     VARCHAR(200) DEFAULT ""              COMMENT "物料名称（冗余）",
    `spec`              VARCHAR(200) DEFAULT ""              COMMENT "规格型号",
    `unit_id`           BIGINT       DEFAULT NULL            COMMENT "单位ID",
    `unit_name`         VARCHAR(50)  DEFAULT ""              COMMENT "单位名称（冗余）",
    `plan_quantity`     DECIMAL(18,6) DEFAULT 0              COMMENT "计划用量",
    `actual_quantity`   DECIMAL(18,6) DEFAULT 0              COMMENT "实际用量",
    `difference`        DECIMAL(18,6) DEFAULT 0              COMMENT "差异",
    `usage_time`        DATETIME     DEFAULT CURRENT_TIMESTAMP COMMENT "使用时间",
    `batch_no`          VARCHAR(50)  DEFAULT ""              COMMENT "批次号",
    `lot_no`            VARCHAR(50)  DEFAULT ""              COMMENT "批号",
    `operator_id`       BIGINT       DEFAULT NULL            COMMENT "操作员ID",
    `operator_name`     VARCHAR(50)  DEFAULT ""              COMMENT "操作员姓名（冗余）",
    `deleted`           TINYINT      DEFAULT 0               COMMENT "逻辑删除",
    `create_time`       DATETIME     DEFAULT CURRENT_TIMESTAMP COMMENT "创建时间",
    PRIMARY KEY (`id`),
    KEY `idx_task_id` (`task_id`),
    KEY `idx_material_id` (`material_id`),
    KEY `idx_usage_time` (`usage_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT="PAD物料使用记录表";
-- 5. 电子批记录表
CREATE TABLE IF NOT EXISTS `ebr_record` (
    `id`                BIGINT       NOT NULL AUTO_INCREMENT COMMENT "主键ID",
    `batch_no`          VARCHAR(50)  NOT NULL                COMMENT "批次号",
    `product_id`        BIGINT       NOT NULL                COMMENT "产品ID",
    `product_code`      VARCHAR(50)  DEFAULT ""              COMMENT "产品编码（冗余）",
    `product_name`      VARCHAR(200) DEFAULT ""              COMMENT "产品名称（冗余）",
    `bom_id`            BIGINT       NOT NULL                COMMENT "BOM ID",
    `bom_version`       VARCHAR(20)  DEFAULT ""              COMMENT "BOM版本",
    `routing_id`        BIGINT       DEFAULT NULL            COMMENT "工艺路径ID",
    `plan_quantity`     DECIMAL(18,4) NOT NULL               COMMENT "计划数量",
    `unit_id`           BIGINT       DEFAULT NULL            COMMENT "单位ID",
    `unit_name`         VARCHAR(50)  DEFAULT ""              COMMENT "单位名称（冗余）",
    `status`            VARCHAR(20)  DEFAULT "DRAFT"         COMMENT "状态：DRAFT草稿/IN_PROGRESS进行中/PAUSED已暂停/COMPLETED已完成/CANCELLED已取消",
    `start_time`        DATETIME     DEFAULT NULL            COMMENT "开始时间",
    `end_time`          DATETIME     DEFAULT NULL            COMMENT "结束时间",
    `operator_id`       BIGINT       DEFAULT NULL            COMMENT "操作员ID",
    `operator_name`     VARCHAR(50)  DEFAULT ""              COMMENT "操作员姓名（冗余）",
    `supervisor_id`     BIGINT       DEFAULT NULL            COMMENT "主管ID",
    `supervisor_name`   VARCHAR(50)  DEFAULT ""              COMMENT "主管姓名（冗余）",
    `completed_quantity`DECIMAL(18,4) DEFAULT 0              COMMENT "完成数量",
    `qualified_quantity`DECIMAL(18,4) DEFAULT 0              COMMENT "合格数量",
    `rejected_quantity`DECIMAL(18,4) DEFAULT 0              COMMENT "不合格数量",
    `qualified_rate`    DECIMAL(5,2) DEFAULT 0              COMMENT "合格率",
    `remark`            TEXT         DEFAULT NULL            COMMENT "备注",
    `deleted`           TINYINT      DEFAULT 0               COMMENT "逻辑删除",
    `create_time`       DATETIME     DEFAULT CURRENT_TIMESTAMP COMMENT "创建时间",
    `update_time`       DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT "更新时间",
    `create_by`         VARCHAR(50)  DEFAULT ""              COMMENT "创建人",
    `update_by`         VARCHAR(50)  DEFAULT ""              COMMENT "更新人",
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_batch_no` (`batch_no`, `deleted`),
    KEY `idx_product_id` (`product_id`),
    KEY `idx_bom_id` (`bom_id`),
    KEY `idx_status` (`status`),
    KEY `idx_start_time` (`start_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT="电子批记录表";
-- ================================================
-- 车间执行模块 (WIP) - 额外的表结构
-- ================================================

-- 6. 批记录步骤表
CREATE TABLE IF NOT EXISTS `ebr_step` (
    `id`                BIGINT       NOT NULL AUTO_INCREMENT COMMENT "主键ID",
    `ebr_id`            BIGINT       NOT NULL                COMMENT "批记录ID",
    `step_no`           INT          NOT NULL                COMMENT "步骤序号",
    `step_name`         VARCHAR(100) NOT NULL                COMMENT "步骤名称",
    `operation_code`    VARCHAR(50)  DEFAULT ""              COMMENT "工序编码",
    `operation_name`    VARCHAR(100) DEFAULT ""              COMMENT "工序名称",
    `status`            VARCHAR(20)  DEFAULT "PENDING"       COMMENT "状态：PENDING待开始/IN_PROGRESS进行中/PAUSED已暂停/COMPLETED已完成/SKIPPED已跳过",
    `start_time`        DATETIME     DEFAULT NULL            COMMENT "开始时间",
    `end_time`          DATETIME     DEFAULT NULL            COMMENT "结束时间",
    `operator_id`       BIGINT       DEFAULT NULL            COMMENT "操作员ID",
    `operator_name`     VARCHAR(50)  DEFAULT ""              COMMENT "操作员姓名（冗余）",
    `approval_status`   VARCHAR(20)  DEFAULT ""              COMMENT "审批状态：PENDING待审批/APPROVED已批准/REJECTED已拒绝",
    `approver_id`       BIGINT       DEFAULT NULL            COMMENT "审批人ID",
    `approver_name`     VARCHAR(50)  DEFAULT ""              COMMENT "审批人姓名（冗余）",
    `approval_time`     DATETIME     DEFAULT NULL            COMMENT "审批时间",
    `approval_comment`  VARCHAR(500) DEFAULT ""              COMMENT "审批意见",
    `data_record`       TEXT         DEFAULT NULL            COMMENT "数据记录（JSON格式）",
    `remark`            VARCHAR(500) DEFAULT ""              COMMENT "备注",
    `deleted`           TINYINT      DEFAULT 0               COMMENT "逻辑删除",
    `create_time`       DATETIME     DEFAULT CURRENT_TIMESTAMP COMMENT "创建时间",
    `update_time`       DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT "更新时间",
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_ebr_step` (`ebr_id`, `step_no`, `deleted`),
    KEY `idx_ebr_id` (`ebr_id`),
    KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT="批记录步骤表";

-- 7. 设备使用记录表
CREATE TABLE IF NOT EXISTS `ebr_equipment_usage` (
    `id`                BIGINT       NOT NULL AUTO_INCREMENT COMMENT "主键ID",
    `ebr_id`            BIGINT       NOT NULL                COMMENT "批记录ID",
    `step_id`           BIGINT       DEFAULT NULL            COMMENT "步骤ID",
    `equipment_code`    VARCHAR(50)  NOT NULL                COMMENT "设备编码",
    `equipment_name`    VARCHAR(200) DEFAULT ""              COMMENT "设备名称",
    `equipment_type`    VARCHAR(50)  DEFAULT ""              COMMENT "设备类型",
    `start_time`        DATETIME     NOT NULL                COMMENT "开始使用时间",
    `end_time`          DATETIME     DEFAULT NULL            COMMENT "结束使用时间",
    `duration`          INT          DEFAULT 0               COMMENT "使用时长（分钟）",
    `operator_id`       BIGINT       DEFAULT NULL            COMMENT "操作员ID",
    `operator_name`     VARCHAR(50)  DEFAULT ""              COMMENT "操作员姓名（冗余）",
    `usage_status`      VARCHAR(20)  DEFAULT ""              COMMENT "使用状态：NORMAL正常/ABNORMAL异常",
    `maintenance_record` TEXT         DEFAULT NULL            COMMENT "维护记录",
    `deleted`           TINYINT      DEFAULT 0               COMMENT "逻辑删除",
    `create_time`       DATETIME     DEFAULT CURRENT_TIMESTAMP COMMENT "创建时间",
    PRIMARY KEY (`id`),
    KEY `idx_ebr_id` (`ebr_id`),
    KEY `idx_step_id` (`step_id`),
    KEY `idx_equipment_code` (`equipment_code`),
    KEY `idx_start_time` (`start_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT="设备使用记录表";

-- 8. 物料平衡表
CREATE TABLE IF NOT EXISTS `ebr_material_balance` (
    `id`                BIGINT       NOT NULL AUTO_INCREMENT COMMENT "主键ID",
    `ebr_id`            BIGINT       NOT NULL                COMMENT "批记录ID",
    `material_id`       BIGINT       NOT NULL                COMMENT "物料ID",
    `material_code`     VARCHAR(50)  DEFAULT ""              COMMENT "物料编码（冗余）",
    `material_name`     VARCHAR(200) DEFAULT ""              COMMENT "物料名称（冗余）",
    `spec`              VARCHAR(200) DEFAULT ""              COMMENT "规格型号",
    `unit_id`           BIGINT       DEFAULT NULL            COMMENT "单位ID",
    `unit_name`         VARCHAR(50)  DEFAULT ""              COMMENT "单位名称（冗余）",
    `plan_quantity`     DECIMAL(18,6) NOT NULL               COMMENT "计划用量",
    `theoretical_quantity`DECIMAL(18,6) NOT NULL            COMMENT "理论用量",
    `actual_input`      DECIMAL(18,6) DEFAULT 0              COMMENT "实际投入",
    `actual_output`     DECIMAL(18,6) DEFAULT 0              COMMENT "实际产出",
    `difference`        DECIMAL(18,6) DEFAULT 0              COMMENT "差异",
    `difference_rate`   DECIMAL(5,2) DEFAULT 0              COMMENT "差异率（%）",
    `balance_status`    VARCHAR(20)  DEFAULT "BALANCED"      COMMENT "平衡状态：BALANCED平衡/UNBALANCED不平衡",
    `remark`            VARCHAR(500) DEFAULT ""              COMMENT "备注",
    `deleted`           TINYINT      DEFAULT 0               COMMENT "逻辑删除",
    `create_time`       DATETIME     DEFAULT CURRENT_TIMESTAMP COMMENT "创建时间",
    `update_time`       DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT "更新时间",
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_ebr_material` (`ebr_id`, `material_id`, `deleted`),
    KEY `idx_ebr_id` (`ebr_id`),
    KEY `idx_material_id` (`material_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT="物料平衡表";

-- 9. 领料单表
CREATE TABLE IF NOT EXISTS `material_issuance` (
    `id`                BIGINT       NOT NULL AUTO_INCREMENT COMMENT "主键ID",
    `issuance_no`       VARCHAR(50)  NOT NULL                COMMENT "领料单号",
    `issuance_type`     VARCHAR(50)  DEFAULT "PRODUCTION"   COMMENT "领料类型：PRODUCTION生产/REPAIR维修/OTHER其他",
    `department_id`     BIGINT       DEFAULT NULL            COMMENT "部门ID",
    `department_name`   VARCHAR(100) DEFAULT ""              COMMENT "部门名称（冗余）",
    `work_center_id`    BIGINT       DEFAULT NULL            COMMENT "工作中心ID",
    `work_center_name`  VARCHAR(100) DEFAULT ""              COMMENT "工作中心名称（冗余）",
    `requester_id`      BIGINT       DEFAULT NULL            COMMENT "申请人ID",
    `requester_name`    VARCHAR(50)  DEFAULT ""              COMMENT "申请人姓名（冗余）",
    `request_time`      DATETIME     DEFAULT CURRENT_TIMESTAMP COMMENT "申请时间",
    `status`            VARCHAR(20)  DEFAULT "PENDING"       COMMENT "状态：PENDING待审批/APPROVED已批准/REJECTED已拒绝/ISSUED已领料/COMPLETED已完成/CANCELLED已取消",
    `approval_status`   VARCHAR(20)  DEFAULT "PENDING"       COMMENT "审批状态：PENDING待审批/APPROVED已批准/REJECTED已拒绝",
    `approver_id`       BIGINT       DEFAULT NULL            COMMENT "审批人ID",
    `approver_name`     VARCHAR(50)  DEFAULT ""              COMMENT "审批人姓名（冗余）",
    `approval_time`     DATETIME     DEFAULT NULL            COMMENT "审批时间",
    `approval_comment`  VARCHAR(500) DEFAULT ""              COMMENT "审批意见",
    `issuer_id`         BIGINT       DEFAULT NULL            COMMENT "发料人ID",
    `issuer_name`       VARCHAR(50)  DEFAULT ""              COMMENT "发料人姓名（冗余）",
    `issue_time`        DATETIME     DEFAULT NULL            COMMENT "发料时间",
    `receiver_id`       BIGINT       DEFAULT NULL            COMMENT "收料人ID",
    `receiver_name`     VARCHAR(50)  DEFAULT ""              COMMENT "收料人姓名（冗余）",
    `receive_time`      DATETIME     DEFAULT NULL            COMMENT "收料时间",
    `remark`            TEXT         DEFAULT NULL            COMMENT "备注",
    `deleted`           TINYINT      DEFAULT 0               COMMENT "逻辑删除",
    `create_time`       DATETIME     DEFAULT CURRENT_TIMESTAMP COMMENT "创建时间",
    `update_time`       DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT "更新时间",
    `create_by`         VARCHAR(50)  DEFAULT ""              COMMENT "创建人",
    `update_by`         VARCHAR(50)  DEFAULT ""              COMMENT "更新人",
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_issuance_no` (`issuance_no`, `deleted`),
    KEY `idx_department_id` (`department_id`),
    KEY `idx_work_center_id` (`work_center_id`),
    KEY `idx_status` (`status`),
    KEY `idx_request_time` (`request_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT="领料单表";

-- 10. 领料单明细表
CREATE TABLE IF NOT EXISTS `material_issuance_detail` (
    `id`                BIGINT       NOT NULL AUTO_INCREMENT COMMENT "主键ID",
    `issuance_id`       BIGINT       NOT NULL                COMMENT "领料单ID",
    `line_no`           INT          DEFAULT 10              COMMENT "行号",
    `material_id`       BIGINT       NOT NULL                COMMENT "物料ID",
    `material_code`     VARCHAR(50)  DEFAULT ""              COMMENT "物料编码（冗余）",
    `material_name`     VARCHAR(200) DEFAULT ""              COMMENT "物料名称（冗余）",
    `spec`              VARCHAR(200) DEFAULT ""              COMMENT "规格型号",
    `unit_id`           BIGINT       DEFAULT NULL            COMMENT "单位ID",
    `unit_name`         VARCHAR(50)  DEFAULT ""              COMMENT "单位名称（冗余）",
    `request_quantity`  DECIMAL(18,4) NOT NULL               COMMENT "请领数量",
    `approval_quantity` DECIMAL(18,4) DEFAULT 0              COMMENT "批准数量",
    `issued_quantity`   DECIMAL(18,4) DEFAULT 0              COMMENT "实发数量",
    `returned_quantity` DECIMAL(18,4) DEFAULT 0              COMMENT "退料数量",
    `batch_no`          VARCHAR(50)  DEFAULT ""              COMMENT "批次号",
    `lot_no`            VARCHAR(50)  DEFAULT ""              COMMENT "批号",
    `warehouse_id`      BIGINT       DEFAULT NULL            COMMENT "仓库ID",
    `warehouse_name`    VARCHAR(100) DEFAULT ""              COMMENT "仓库名称（冗余）",
    `location`          VARCHAR(100) DEFAULT ""              COMMENT "库位",
    `unit_price`        DECIMAL(18,4) DEFAULT 0              COMMENT "单价",
    `total_price`       DECIMAL(18,4) DEFAULT 0              COMMENT "总价",
    `remark`            VARCHAR(500) DEFAULT ""              COMMENT "备注",
    `deleted`           TINYINT      DEFAULT 0               COMMENT "逻辑删除",
    `create_time`       DATETIME     DEFAULT CURRENT_TIMESTAMP COMMENT "创建时间",
    `update_time`       DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT "更新时间",
    PRIMARY KEY (`id`),
    KEY `idx_issuance_id` (`issuance_id`),
    KEY `idx_material_id` (`material_id`),
    KEY `idx_warehouse_id` (`warehouse_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT="领料单明细表";
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

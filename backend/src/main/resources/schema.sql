-- ================================================
-- 迈迪康 MES 系统 数据库初始化脚本
-- 数据库：MySQL 8.0+
-- 字符集：utf8mb4
-- ================================================

-- ================================================
-- 1. 物料分类表
-- ================================================
CREATE TABLE IF NOT EXISTS material_category (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    parent_id   BIGINT       DEFAULT 0,
    code        VARCHAR(50)  NOT NULL,
    name        VARCHAR(100) NOT NULL,
    sort_no     INT          DEFAULT 0,
    status      TINYINT      DEFAULT 1,
    deleted     TINYINT      DEFAULT 0,
    create_time DATETIME     DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME     DEFAULT CURRENT_TIMESTAMP,
    create_by   VARCHAR(50)  DEFAULT '',
    update_by   VARCHAR(50)  DEFAULT '',
    PRIMARY KEY (id)
);

-- ================================================
-- 2. 物料档案表
-- ================================================
CREATE TABLE IF NOT EXISTS material (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    code        VARCHAR(50)  NOT NULL,
    name        VARCHAR(200) NOT NULL,
    category_id BIGINT       NOT NULL,
    spec        VARCHAR(200) DEFAULT '',
    unit_id     BIGINT       DEFAULT NULL,
    unit_name   VARCHAR(50)  DEFAULT '',
    type        VARCHAR(50)  DEFAULT '',
    brand       VARCHAR(100) DEFAULT '',
    supplier    VARCHAR(200) DEFAULT '',
    min_stock   DECIMAL(18,4) DEFAULT 0,
    max_stock   DECIMAL(18,4) DEFAULT 0,
    price       DECIMAL(18,4) DEFAULT 0,
    status      TINYINT      DEFAULT 1,
    description TEXT         DEFAULT NULL,
    deleted     TINYINT      DEFAULT 0,
    create_time DATETIME     DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME     DEFAULT CURRENT_TIMESTAMP,
    create_by   VARCHAR(50)  DEFAULT '',
    update_by   VARCHAR(50)  DEFAULT '',
    PRIMARY KEY (id),
    UNIQUE KEY uk_material_code (code, deleted)
);

-- ================================================
-- 3. 计量单位分组表
-- ================================================
CREATE TABLE IF NOT EXISTS unit_group (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    code        VARCHAR(50)  NOT NULL,
    name        VARCHAR(100) NOT NULL,
    sort_no     INT          DEFAULT 0,
    status      TINYINT      DEFAULT 1,
    deleted     TINYINT      DEFAULT 0,
    create_time DATETIME     DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME     DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- ================================================
-- 4. 计量单位表
-- ================================================
CREATE TABLE IF NOT EXISTS unit (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    code        VARCHAR(50)  NOT NULL,
    name        VARCHAR(100) NOT NULL,
    en_name     VARCHAR(100) DEFAULT '',
    group_id    BIGINT       DEFAULT NULL,
    group_name  VARCHAR(100) DEFAULT '',
    method      VARCHAR(20)  DEFAULT '四舍五入',
    precision   INT          DEFAULT 0,
    is_base     TINYINT      DEFAULT 0,
    status      TINYINT      DEFAULT 1,
    deleted     TINYINT      DEFAULT 0,
    create_time DATETIME     DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME     DEFAULT CURRENT_TIMESTAMP,
    create_by   VARCHAR(50)  DEFAULT '',
    update_by   VARCHAR(50)  DEFAULT '',
    PRIMARY KEY (id)
);

-- ================================================
-- 5. 物料清单(BOM)主表
-- ================================================
CREATE TABLE IF NOT EXISTS bom (
    id            BIGINT       NOT NULL AUTO_INCREMENT,
    code          VARCHAR(50)  NOT NULL,
    version       VARCHAR(20)  DEFAULT '1.00',
    bom_type      VARCHAR(50)  DEFAULT '主生产',
    status        VARCHAR(20)  DEFAULT 'DRAFT',
    material_id   BIGINT       NOT NULL,
    material_code VARCHAR(50)  DEFAULT '',
    material_name VARCHAR(200) DEFAULT '',
    quantity      DECIMAL(18,4) DEFAULT 1.0000,
    unit_id       BIGINT       DEFAULT NULL,
    unit_name     VARCHAR(50)  DEFAULT '',
    org_manage    VARCHAR(100) DEFAULT '',
    org_use       VARCHAR(100) DEFAULT '',
    effective_date DATE        DEFAULT NULL,
    expiry_date   DATE         DEFAULT NULL,
    remark        TEXT         DEFAULT NULL,
    deleted       TINYINT      DEFAULT 0,
    create_time   DATETIME     DEFAULT CURRENT_TIMESTAMP,
    update_time   DATETIME     DEFAULT CURRENT_TIMESTAMP,
    create_by     VARCHAR(50)  DEFAULT '',
    update_by     VARCHAR(50)  DEFAULT '',
    review_by     VARCHAR(50)  DEFAULT '',
    review_time   DATETIME     DEFAULT NULL,
    approve_by    VARCHAR(50)  DEFAULT '',
    approve_time  DATETIME     DEFAULT NULL,
    PRIMARY KEY (id)
);

-- ================================================
-- 6. 物料清单明细表
-- ================================================
CREATE TABLE IF NOT EXISTS bom_detail (
    id            BIGINT       NOT NULL AUTO_INCREMENT,
    bom_id        BIGINT       NOT NULL,
    line_no       INT          DEFAULT 10,
    material_id   BIGINT       NOT NULL,
    material_code VARCHAR(50)  DEFAULT '',
    material_name VARCHAR(200) DEFAULT '',
    spec          VARCHAR(200) DEFAULT '',
    quantity      DECIMAL(18,6) DEFAULT 1.000000,
    unit_id       BIGINT       DEFAULT NULL,
    unit_name     VARCHAR(50)  DEFAULT '',
    remark        VARCHAR(500) DEFAULT '',
    deleted       TINYINT      DEFAULT 0,
    create_time   DATETIME     DEFAULT CURRENT_TIMESTAMP,
    update_time   DATETIME     DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- ================================================
-- 7. 系统用户表
-- ================================================
CREATE TABLE IF NOT EXISTS sys_user (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    employee_id VARCHAR(50)  NOT NULL,
    username    VARCHAR(100) NOT NULL,
    password    VARCHAR(200) DEFAULT '123456',
    role        VARCHAR(50)  DEFAULT 'OPERATOR',
    avatar      VARCHAR(200) DEFAULT '',
    status      TINYINT      DEFAULT 1,
    deleted     TINYINT      DEFAULT 0,
    create_time DATETIME     DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME     DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- ================================================
-- 初始化数据
-- ================================================

-- 用户数据
INSERT IGNORE INTO sys_user (employee_id, username, password, role) VALUES
('E001', '张伟', '123456', '管理员'),
('E002', '李娜', '123456', '质检员'),
('E003', '王芳', '123456', '操作员'),
('E010', 'admin', '123456', '管理员');

-- 计量单位分组
INSERT IGNORE INTO unit_group (id, code, name, sort_no) VALUES
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
INSERT IGNORE INTO unit (id, code, name, en_name, group_id, group_name, method, precision, is_base, status) VALUES
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
INSERT IGNORE INTO material_category (id, parent_id, code, name, sort_no) VALUES
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
INSERT IGNORE INTO material (id, code, name, category_id, spec, unit_id, unit_name, type, brand, supplier, min_stock, max_stock, price, status) VALUES
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
INSERT IGNORE INTO bom (id, code, version, bom_type, status, material_id, material_code, material_name, quantity, unit_id, unit_name, org_manage, org_use) VALUES
(1, 'FG001', '1.00', '主生产', 'APPROVED', 4, 'FG001', '医用手套 S号', 1.0000, 12, '个', '迈迪康制造', '迈迪康制造'),
(2, 'FG002', '1.00', '主生产', 'APPROVED', 5, 'FG002', '医用手套 M号', 1.0000, 12, '个', '迈迪康制造', '迈迪康制造'),
(3, 'FG003', '1.00', '主生产', 'DRAFT',    6, 'FG003', '医用手套 L号', 1.0000, 12, '个', '迈迪康制造', '迈迪康制造');

-- BOM明细
INSERT IGNORE INTO bom_detail (id, bom_id, line_no, material_id, material_code, material_name, spec, quantity, unit_id, unit_name) VALUES
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
CREATE TABLE IF NOT EXISTS process_routing (
    id              BIGINT       NOT NULL AUTO_INCREMENT,
    routing_code    VARCHAR(50)  NOT NULL,
    routing_name    VARCHAR(100) DEFAULT '',
    product_id      BIGINT       DEFAULT NULL,
    product_code    VARCHAR(50)  DEFAULT '',
    product_model   VARCHAR(50)  NOT NULL,
    product_name    VARCHAR(100) DEFAULT '',
    version         VARCHAR(10)  NOT NULL DEFAULT 'V1.0',
    is_default      TINYINT      DEFAULT 0,
    status          VARCHAR(20)  DEFAULT 'DRAFT',
    effective_date  DATE         DEFAULT NULL,
    expiry_date     DATE         DEFAULT NULL,
    description     TEXT         DEFAULT NULL,
    deleted         TINYINT      DEFAULT 0,
    create_by       VARCHAR(50)  DEFAULT '',
    create_time     DATETIME     DEFAULT CURRENT_TIMESTAMP,
    update_by       VARCHAR(50)  DEFAULT '',
    update_time     DATETIME     DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- 报工点/路径步骤
CREATE TABLE IF NOT EXISTS routing_step (
    id             BIGINT      NOT NULL AUTO_INCREMENT,
    routing_id     BIGINT      NOT NULL,
    step_no        INT         NOT NULL,
    step_name      VARCHAR(50)  DEFAULT '',
    step_code      VARCHAR(50)  DEFAULT '',
    report_point   TINYINT     DEFAULT 1,
    step_type      VARCHAR(20) DEFAULT 'NORMAL',
    workshop_id    BIGINT      DEFAULT NULL,
    description    VARCHAR(500) DEFAULT '',
    deleted        TINYINT     DEFAULT 0,
    create_by      VARCHAR(50)  DEFAULT '',
    create_time    DATETIME     DEFAULT CURRENT_TIMESTAMP,
    update_by      VARCHAR(50)  DEFAULT '',
    update_time    DATETIME     DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- 工序表
CREATE TABLE IF NOT EXISTS operation (
    id                  BIGINT       NOT NULL AUTO_INCREMENT,
    routing_step_id     BIGINT       NOT NULL,
    operation_code      VARCHAR(50)  NOT NULL,
    operation_name      VARCHAR(100) NOT NULL,
    alias_name          VARCHAR(100) DEFAULT '',
    seq_in_step         INT          DEFAULT 1,
    work_center_id      BIGINT       DEFAULT NULL,
    work_center_name    VARCHAR(100) DEFAULT '',
    is_key_operation    TINYINT      DEFAULT 0,
    material_trace_req  TINYINT      DEFAULT 0,
    inspection_trigger  VARCHAR(50)  DEFAULT '',
    report_required     TINYINT      DEFAULT 1,
    standard_time       DECIMAL(10,2) DEFAULT 0,
    description         VARCHAR(500) DEFAULT '',
    remark              VARCHAR(500) DEFAULT '',
    deleted             TINYINT      DEFAULT 0,
    create_by           VARCHAR(50)  DEFAULT '',
    create_time         DATETIME     DEFAULT CURRENT_TIMESTAMP,
    update_by           VARCHAR(50)  DEFAULT '',
    update_time         DATETIME     DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- 阶段模板池（9个标准阶段）
CREATE TABLE IF NOT EXISTS stage_template (
    id            BIGINT      NOT NULL AUTO_INCREMENT,
    stage_code    VARCHAR(30) NOT NULL,
    stage_name    VARCHAR(50) NOT NULL,
    stage_type    VARCHAR(20) NOT NULL,
    is_default    TINYINT     DEFAULT 1,
    sort_order    INT         DEFAULT 0,
    description   VARCHAR(200) DEFAULT '',
    deleted       TINYINT     DEFAULT 0,
    create_time   DATETIME     DEFAULT CURRENT_TIMESTAMP,
    update_time   DATETIME     DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- 工序阶段配置（开关矩阵）
CREATE TABLE IF NOT EXISTS operation_stage_config (
    id                  BIGINT      NOT NULL AUTO_INCREMENT,
    operation_id        BIGINT      NOT NULL,
    stage_template_id   BIGINT      NOT NULL,
    is_enabled          TINYINT     DEFAULT 1,
    is_required         TINYINT     DEFAULT 1,
    ui_config           JSON        DEFAULT NULL,
    trigger_inspection  TINYINT     DEFAULT 0,
    lock_until_inspect  TINYINT     DEFAULT 0,
    auto_pass           TINYINT     DEFAULT 0,
    remark              VARCHAR(200) DEFAULT '',
    create_time         DATETIME     DEFAULT CURRENT_TIMESTAMP,
    update_time         DATETIME     DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- 初始化9个标准阶段
INSERT IGNORE INTO stage_template (stage_code, stage_name, stage_type, sort_order, description) VALUES
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
CREATE TABLE IF NOT EXISTS production_order (
    id              BIGINT       NOT NULL AUTO_INCREMENT,
    order_no        VARCHAR(50)  NOT NULL,
    order_type      VARCHAR(20)  DEFAULT 'STANDARD',
    customer_name   VARCHAR(200) DEFAULT '',
    customer_code   VARCHAR(50)  DEFAULT '',
    delivery_date   DATE         DEFAULT NULL,
    priority        TINYINT      DEFAULT 3,
    status          VARCHAR(20)  DEFAULT 'DRAFT',
    total_quantity  DECIMAL(18,4) DEFAULT 0,
    completed_quantity DECIMAL(18,4) DEFAULT 0,
    remark          TEXT         DEFAULT NULL,
    deleted         TINYINT      DEFAULT 0,
    create_time     DATETIME     DEFAULT CURRENT_TIMESTAMP,
    update_time     DATETIME     DEFAULT CURRENT_TIMESTAMP,
    create_by       VARCHAR(50)  DEFAULT '',
    update_by       VARCHAR(50)  DEFAULT '',
    release_by      VARCHAR(50)  DEFAULT '',
    release_time    DATETIME     DEFAULT NULL,
    close_by        VARCHAR(50)  DEFAULT '',
    close_time      DATETIME     DEFAULT NULL,
    PRIMARY KEY (id)
);

-- 生产订单明细表
CREATE TABLE IF NOT EXISTS production_order_detail (
    id                BIGINT       NOT NULL AUTO_INCREMENT,
    order_id          BIGINT       NOT NULL,
    line_no           INT          DEFAULT 10,
    material_id       BIGINT       NOT NULL,
    material_code     VARCHAR(50)  DEFAULT '',
    material_name     VARCHAR(200) DEFAULT '',
    spec              VARCHAR(200) DEFAULT '',
    plan_quantity     DECIMAL(18,4) DEFAULT 0,
    completed_quantity DECIMAL(18,4) DEFAULT 0,
    unit_id           BIGINT       DEFAULT NULL,
    unit_name         VARCHAR(50)  DEFAULT '',
    bom_id            BIGINT       DEFAULT NULL,
    bom_version       VARCHAR(20)  DEFAULT '',
    routing_id        BIGINT       DEFAULT NULL,
    remark            VARCHAR(500) DEFAULT '',
    deleted           TINYINT      DEFAULT 0,
    create_time       DATETIME     DEFAULT CURRENT_TIMESTAMP,
    update_time       DATETIME     DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- 生产工单表
CREATE TABLE IF NOT EXISTS work_order (
    id                  BIGINT       NOT NULL AUTO_INCREMENT,
    work_order_no       VARCHAR(50)  NOT NULL,
    order_id            BIGINT       DEFAULT NULL,
    order_no            VARCHAR(50)  DEFAULT '',
    order_detail_id     BIGINT       DEFAULT NULL,
    material_id         BIGINT       NOT NULL,
    material_code       VARCHAR(50)  DEFAULT '',
    material_name       VARCHAR(200) DEFAULT '',
    spec                VARCHAR(200) DEFAULT '',
    plan_quantity       DECIMAL(18,4) DEFAULT 0,
    completed_quantity  DECIMAL(18,4) DEFAULT 0,
    qualified_quantity  DECIMAL(18,4) DEFAULT 0,
    unqualified_quantity DECIMAL(18,4) DEFAULT 0,
    unit_id             BIGINT       DEFAULT NULL,
    unit_name           VARCHAR(50)  DEFAULT '',
    bom_id              BIGINT       DEFAULT NULL,
    bom_version         VARCHAR(20)  DEFAULT '',
    routing_id          BIGINT       DEFAULT NULL,
    work_center_id      BIGINT       DEFAULT NULL,
    work_center_name    VARCHAR(100) DEFAULT '',
    start_date          DATE         DEFAULT NULL,
    end_date            DATE         DEFAULT NULL,
    actual_start_time   DATETIME     DEFAULT NULL,
    actual_end_time     DATETIME     DEFAULT NULL,
    status              VARCHAR(20)  DEFAULT 'DRAFT',
    progress            DECIMAL(5,2) DEFAULT 0.00,
    remark              TEXT         DEFAULT NULL,
    deleted             TINYINT      DEFAULT 0,
    create_time         DATETIME     DEFAULT CURRENT_TIMESTAMP,
    update_time         DATETIME     DEFAULT CURRENT_TIMESTAMP,
    create_by           VARCHAR(50)  DEFAULT '',
    update_by           VARCHAR(50)  DEFAULT '',
    release_by          VARCHAR(50)  DEFAULT '',
    release_time        DATETIME     DEFAULT NULL,
    close_by            VARCHAR(50)  DEFAULT '',
    close_time          DATETIME     DEFAULT NULL,
    PRIMARY KEY (id)
);

-- 工单工序表
CREATE TABLE IF NOT EXISTS work_order_operation (
    id                  BIGINT       NOT NULL AUTO_INCREMENT,
    work_order_id       BIGINT       NOT NULL,
    operation_id        BIGINT       NOT NULL,
    operation_code      VARCHAR(50)  DEFAULT '',
    operation_name      VARCHAR(100) DEFAULT '',
    seq_no              INT          DEFAULT 0,
    work_center_id      BIGINT       DEFAULT NULL,
    work_center_name    VARCHAR(100) DEFAULT '',
    plan_quantity       DECIMAL(18,4) DEFAULT 0,
    completed_quantity  DECIMAL(18,4) DEFAULT 0,
    qualified_quantity  DECIMAL(18,4) DEFAULT 0,
    status              VARCHAR(20)  DEFAULT 'PENDING',
    start_time          DATETIME     DEFAULT NULL,
    end_time            DATETIME     DEFAULT NULL,
    actual_work_hours   DECIMAL(10,2) DEFAULT 0,
    remark              VARCHAR(500) DEFAULT '',
    deleted             TINYINT      DEFAULT 0,
    create_time         DATETIME     DEFAULT CURRENT_TIMESTAMP,
    update_time         DATETIME     DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- 生产任务单表
CREATE TABLE IF NOT EXISTS task_order (
    id                  BIGINT       NOT NULL AUTO_INCREMENT,
    task_no             VARCHAR(50)  NOT NULL,
    work_order_id       BIGINT       NOT NULL,
    work_order_no       VARCHAR(50)  DEFAULT '',
    work_order_operation_id BIGINT    DEFAULT NULL,
    operation_code      VARCHAR(50)  DEFAULT '',
    operation_name      VARCHAR(100) DEFAULT '',
    material_id         BIGINT       NOT NULL,
    material_code       VARCHAR(50)  DEFAULT '',
    material_name       VARCHAR(200) DEFAULT '',
    plan_quantity       DECIMAL(18,4) DEFAULT 0,
    completed_quantity  DECIMAL(18,4) DEFAULT 0,
    qualified_quantity  DECIMAL(18,4) DEFAULT 0,
    unqualified_quantity DECIMAL(18,4) DEFAULT 0,
    unit_id             BIGINT       DEFAULT NULL,
    unit_name           VARCHAR(50)  DEFAULT '',
    work_center_id      BIGINT       DEFAULT NULL,
    work_center_name    VARCHAR(100) DEFAULT '',
    assigned_to         BIGINT       DEFAULT NULL,
    assigned_to_name    VARCHAR(100) DEFAULT '',
    assign_time         DATETIME     DEFAULT NULL,
    assign_by           VARCHAR(50)  DEFAULT '',
    received_time       DATETIME     DEFAULT NULL,
    received_by         VARCHAR(50)  DEFAULT '',
    start_time          DATETIME     DEFAULT NULL,
    end_time            DATETIME     DEFAULT NULL,
    equip_id            BIGINT       DEFAULT NULL,
    equip_code          VARCHAR(50)  DEFAULT '',
    actual_work_hours   DECIMAL(10,2) DEFAULT 0,
    status              VARCHAR(20)  DEFAULT 'PENDING',
    progress            DECIMAL(5,2) DEFAULT 0.00,
    remark              TEXT         DEFAULT NULL,
    deleted             TINYINT      DEFAULT 0,
    create_time         DATETIME     DEFAULT CURRENT_TIMESTAMP,
    update_time         DATETIME     DEFAULT CURRENT_TIMESTAMP,
    create_by           VARCHAR(50)  DEFAULT '',
    update_by           VARCHAR(50)  DEFAULT '',
    complete_by         VARCHAR(50)  DEFAULT '',
    complete_time       DATETIME     DEFAULT NULL,
    PRIMARY KEY (id)
);
-- ================================================
-- SYS 模块：系统管理
-- ================================================

-- 1. 组织架构表
CREATE TABLE IF NOT EXISTS sys_organization (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    parent_id   BIGINT       DEFAULT 0,
    org_code    VARCHAR(50)  NOT NULL,
    org_name    VARCHAR(100) NOT NULL,
    org_type    VARCHAR(20)  NOT NULL,
    leader_id   BIGINT       DEFAULT NULL,
    leader_name VARCHAR(50)  DEFAULT '',
    phone       VARCHAR(20)  DEFAULT '',
    address     VARCHAR(200) DEFAULT '',
    sort_no     INT          DEFAULT 0,
    status      TINYINT      DEFAULT 1,
    deleted     TINYINT      DEFAULT 0,
    create_time DATETIME     DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME     DEFAULT CURRENT_TIMESTAMP,
    create_by   VARCHAR(50)  DEFAULT '',
    update_by   VARCHAR(50)  DEFAULT '',
    PRIMARY KEY (id)
);

-- 2. 角色表
CREATE TABLE IF NOT EXISTS sys_role (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    role_code   VARCHAR(50)  NOT NULL,
    role_name   VARCHAR(100) NOT NULL,
    description VARCHAR(200) DEFAULT '',
    sort_no     INT          DEFAULT 0,
    status      TINYINT      DEFAULT 1,
    deleted     TINYINT      DEFAULT 0,
    create_time DATETIME     DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME     DEFAULT CURRENT_TIMESTAMP,
    create_by   VARCHAR(50)  DEFAULT '',
    update_by   VARCHAR(50)  DEFAULT '',
    PRIMARY KEY (id)
);

-- 3. 权限表
CREATE TABLE IF NOT EXISTS sys_permission (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    parent_id   BIGINT       DEFAULT 0,
    perm_code   VARCHAR(100) NOT NULL,
    perm_name   VARCHAR(100) NOT NULL,
    perm_type   VARCHAR(20)  NOT NULL,
    menu_url    VARCHAR(200) DEFAULT '',
    icon        VARCHAR(50)  DEFAULT '',
    sort_no     INT          DEFAULT 0,
    status      TINYINT      DEFAULT 1,
    deleted     TINYINT      DEFAULT 0,
    create_time DATETIME     DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME     DEFAULT CURRENT_TIMESTAMP,
    create_by   VARCHAR(50)  DEFAULT '',
    update_by   VARCHAR(50)  DEFAULT '',
    PRIMARY KEY (id)
);

-- 4. 角色权限关联表
CREATE TABLE IF NOT EXISTS sys_role_permission (
    id             BIGINT       NOT NULL AUTO_INCREMENT,
    role_id        BIGINT       NOT NULL,
    permission_id  BIGINT       NOT NULL,
    create_time    DATETIME     DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- 5. 用户角色关联表
CREATE TABLE IF NOT EXISTS sys_user_role (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    user_id     BIGINT       NOT NULL,
    role_id     BIGINT       NOT NULL,
    create_time DATETIME     DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- 6. 工厂表
CREATE TABLE IF NOT EXISTS sys_factory (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    factory_code VARCHAR(50)  NOT NULL,
    factory_name VARCHAR(100) NOT NULL,
    short_name  VARCHAR(50)  DEFAULT '',
    org_id      BIGINT       DEFAULT NULL,
    org_name    VARCHAR(100) DEFAULT '',
    address     VARCHAR(200) DEFAULT '',
    contact     VARCHAR(50)  DEFAULT '',
    phone       VARCHAR(20)  DEFAULT '',
    email       VARCHAR(100) DEFAULT '',
    is_default  TINYINT      DEFAULT 0,
    sort_no     INT          DEFAULT 0,
    status      TINYINT      DEFAULT 1,
    deleted     TINYINT      DEFAULT 0,
    create_time DATETIME     DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME     DEFAULT CURRENT_TIMESTAMP,
    create_by   VARCHAR(50)  DEFAULT '',
    update_by   VARCHAR(50)  DEFAULT '',
    PRIMARY KEY (id)
);

-- 7. 用户工厂关联表
CREATE TABLE IF NOT EXISTS sys_user_factory (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    user_id     BIGINT       NOT NULL,
    factory_id  BIGINT       NOT NULL,
    is_default  TINYINT      DEFAULT 0,
    create_time DATETIME     DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- ================================================
-- 系统管理模块初始化数据
-- ================================================

-- 组织架构数据
INSERT IGNORE INTO sys_organization (id, parent_id, org_code, org_name, org_type, sort_no) VALUES
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
INSERT IGNORE INTO sys_role (id, role_code, role_name, description, sort_no) VALUES
(1, 'SUPER_ADMIN', '超级管理员', '系统最高权限，可管理所有功能', 1),
(2, 'ADMIN', '管理员', '工厂管理员，可管理本工厂数据', 2),
(3, 'OPERATOR', '操作员', '普通操作员，可进行日常操作', 3),
(4, 'INSPECTOR', '质检员', '质量检验员，可进行质量检验', 4),
(5, 'ENGINEER', '工程师', '工艺工程师，可维护工艺路线', 5),
(6, 'VIEWER', '查看员', '只读权限，仅可查看数据', 6);

-- 权限数据
INSERT IGNORE INTO sys_permission (id, parent_id, perm_code, perm_name, perm_type, menu_url, icon, sort_no) VALUES
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
INSERT IGNORE INTO sys_factory (id, factory_code, factory_name, short_name, org_id, org_name, address, contact, phone, is_default, sort_no) VALUES
(1, 'FACT-001', '迈迪康青岛工厂', '青岛工厂', 2, '制造中心', '青岛市即墨区智能制造产业园', '张经理', '0532-88888888', 1, 1),
(2, 'FACT-002', '迈迪康深圳工厂', '深圳工厂', 2, '制造中心', '深圳市宝安区高新科技园', '李经理', '0755-66666666', 0, 2),
(3, 'FACT-003', '迈迪康上海工厂', '上海工厂', 2, '制造中心', '上海市松江区工业园区', '王经理', '021-55555555', 0, 3);

-- 用户角色关联（为现有用户分配角色）
INSERT IGNORE INTO sys_user_role (user_id, role_id) VALUES
(1, 1),  -- E001 张伟 -> 超级管理员
(2, 4),  -- E002 李娜 -> 质检员
(3, 3),  -- E003 王芳 -> 操作员
(4, 1);  -- E010 admin -> 超级管理员

-- 用户工厂关联（为现有用户分配工厂）
INSERT IGNORE INTO sys_user_factory (user_id, factory_id, is_default) VALUES
(1, 1, 1),  -- E001 -> 青岛工厂（默认）
(1, 2, 0),  -- E001 -> 深圳工厂
(2, 1, 1),  -- E002 -> 青岛工厂
(3, 1, 1),  -- E003 -> 青岛工厂
(4, 1, 1);  -- E010 -> 青岛工厂

-- 角色权限关联（超级管理员拥有所有权限）
INSERT IGNORE INTO sys_role_permission (role_id, permission_id)
SELECT 1, id FROM sys_permission;

-- 管理员拥有部分权限
INSERT IGNORE INTO sys_role_permission (role_id, permission_id) VALUES
(2, 1), (2, 2), (2, 3), (2, 4), (2, 5),  -- 一级菜单
(2, 21), (2, 22), (2, 23), (2, 24), (2, 25),  -- 基础数据
(2, 101), (2, 102), (2, 103),  -- 组织架构按钮
(2, 111), (2, 112), (2, 113);  -- 工厂管理按钮

-- ================================================
-- 车间执行模块 (WIP - Work in Progress)
-- ================================================

-- 1. PAD任务表
CREATE TABLE IF NOT EXISTS pad_task (
    id                BIGINT       NOT NULL AUTO_INCREMENT,
    task_no           VARCHAR(50)  NOT NULL,
    task_name         VARCHAR(200) NOT NULL,
    product_id        BIGINT       NOT NULL,
    product_code      VARCHAR(50)  DEFAULT '',
    product_name      VARCHAR(200) DEFAULT '',
    bom_id            BIGINT       NOT NULL,
    bom_version       VARCHAR(20)  DEFAULT '',
    plan_quantity     DECIMAL(18,4) NOT NULL,
    unit_id           BIGINT       DEFAULT NULL,
    unit_name         VARCHAR(50)  DEFAULT '',
    routing_id        BIGINT       DEFAULT NULL,
    operation_id      BIGINT       NOT NULL,
    operation_code    VARCHAR(50)  DEFAULT '',
    operation_name    VARCHAR(100) DEFAULT '',
    work_center_id    BIGINT       DEFAULT NULL,
    work_center_name  VARCHAR(100) DEFAULT '',
    status            VARCHAR(20)  DEFAULT 'PENDING',
    priority          VARCHAR(20)  DEFAULT 'NORMAL',
    planned_start_time DATETIME     DEFAULT NULL,
    planned_end_time  DATETIME     DEFAULT NULL,
    actual_start_time DATETIME     DEFAULT NULL,
    actual_end_time   DATETIME     DEFAULT NULL,
    operator_id       BIGINT       DEFAULT NULL,
    operator_name     VARCHAR(50)  DEFAULT '',
    completed_quantity DECIMAL(18,4) DEFAULT 0,
    qualified_quantity DECIMAL(18,4) DEFAULT 0,
    rejected_quantity DECIMAL(18,4) DEFAULT 0,
    progress          DECIMAL(5,2) DEFAULT 0,
    remark            TEXT         DEFAULT NULL,
    deleted           TINYINT      DEFAULT 0,
    create_time       DATETIME     DEFAULT CURRENT_TIMESTAMP,
    update_time       DATETIME     DEFAULT CURRENT_TIMESTAMP,
    create_by         VARCHAR(50)  DEFAULT '',
    update_by         VARCHAR(50)  DEFAULT '',
    PRIMARY KEY (id)
);

-- 2. PAD操作记录表
CREATE TABLE IF NOT EXISTS pad_operation_record (
    id            BIGINT       NOT NULL AUTO_INCREMENT,
    task_id       BIGINT       NOT NULL,
    operation_type VARCHAR(50)  NOT NULL,
    operator_id   BIGINT       DEFAULT NULL,
    operator_name VARCHAR(50)  DEFAULT '',
    operation_time DATETIME     DEFAULT CURRENT_TIMESTAMP,
    quantity      DECIMAL(18,4) DEFAULT 0,
    status_before VARCHAR(20)  DEFAULT '',
    status_after  VARCHAR(20)  DEFAULT '',
    remark        VARCHAR(500) DEFAULT '',
    deleted       TINYINT      DEFAULT 0,
    create_time   DATETIME     DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- 3. PAD质检记录表
CREATE TABLE IF NOT EXISTS pad_quality_check (
    id                BIGINT       NOT NULL AUTO_INCREMENT,
    task_id           BIGINT       NOT NULL,
    check_no          VARCHAR(50)  NOT NULL,
    check_type        VARCHAR(50)  NOT NULL,
    check_time        DATETIME     DEFAULT CURRENT_TIMESTAMP,
    inspector_id      BIGINT       DEFAULT NULL,
    inspector_name    VARCHAR(50)  DEFAULT '',
    check_quantity    DECIMAL(18,4) DEFAULT 0,
    qualified_quantity DECIMAL(18,4) DEFAULT 0,
    rejected_quantity DECIMAL(18,4) DEFAULT 0,
    qualified_rate    DECIMAL(5,2) DEFAULT 0,
    check_result      VARCHAR(20)  DEFAULT '',
    defect_description TEXT         DEFAULT NULL,
    rectification     TEXT         DEFAULT NULL,
    deleted           TINYINT      DEFAULT 0,
    create_time       DATETIME     DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- 4. PAD物料使用记录表
CREATE TABLE IF NOT EXISTS pad_material_usage (
    id                BIGINT       NOT NULL AUTO_INCREMENT,
    task_id           BIGINT       NOT NULL,
    material_id       BIGINT       NOT NULL,
    material_code     VARCHAR(50)  DEFAULT '',
    material_name     VARCHAR(200) DEFAULT '',
    spec              VARCHAR(200) DEFAULT '',
    unit_id           BIGINT       DEFAULT NULL,
    unit_name         VARCHAR(50)  DEFAULT '',
    plan_quantity     DECIMAL(18,6) DEFAULT 0,
    actual_quantity   DECIMAL(18,6) DEFAULT 0,
    difference        DECIMAL(18,6) DEFAULT 0,
    usage_time        DATETIME     DEFAULT CURRENT_TIMESTAMP,
    batch_no          VARCHAR(50)  DEFAULT '',
    lot_no            VARCHAR(50)  DEFAULT '',
    operator_id       BIGINT       DEFAULT NULL,
    operator_name     VARCHAR(50)  DEFAULT '',
    deleted           TINYINT      DEFAULT 0,
    create_time       DATETIME     DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);
-- 5. 电子批记录表
CREATE TABLE IF NOT EXISTS ebr_record (
    id                BIGINT       NOT NULL AUTO_INCREMENT,
    batch_no          VARCHAR(50)  NOT NULL,
    product_id        BIGINT       NOT NULL,
    product_code      VARCHAR(50)  DEFAULT '',
    product_name      VARCHAR(200) DEFAULT '',
    bom_id            BIGINT       NOT NULL,
    bom_version       VARCHAR(20)  DEFAULT '',
    routing_id        BIGINT       DEFAULT NULL,
    plan_quantity     DECIMAL(18,4) NOT NULL,
    unit_id           BIGINT       DEFAULT NULL,
    unit_name         VARCHAR(50)  DEFAULT '',
    status            VARCHAR(20)  DEFAULT 'DRAFT',
    start_time        DATETIME     DEFAULT NULL,
    end_time          DATETIME     DEFAULT NULL,
    operator_id       BIGINT       DEFAULT NULL,
    operator_name     VARCHAR(50)  DEFAULT '',
    supervisor_id     BIGINT       DEFAULT NULL,
    supervisor_name   VARCHAR(50)  DEFAULT '',
    completed_quantity DECIMAL(18,4) DEFAULT 0,
    qualified_quantity DECIMAL(18,4) DEFAULT 0,
    rejected_quantity DECIMAL(18,4) DEFAULT 0,
    qualified_rate    DECIMAL(5,2) DEFAULT 0,
    remark            TEXT         DEFAULT NULL,
    deleted           TINYINT      DEFAULT 0,
    create_time       DATETIME     DEFAULT CURRENT_TIMESTAMP,
    update_time       DATETIME     DEFAULT CURRENT_TIMESTAMP,
    create_by         VARCHAR(50)  DEFAULT '',
    update_by         VARCHAR(50)  DEFAULT '',
    PRIMARY KEY (id)
);
-- ================================================
-- 车间执行模块 (WIP) - 额外的表结构
-- ================================================

-- 6. 批记录步骤表
CREATE TABLE IF NOT EXISTS ebr_step (
    id                BIGINT       NOT NULL AUTO_INCREMENT,
    ebr_id            BIGINT       NOT NULL,
    step_no           INT          NOT NULL,
    step_name         VARCHAR(100) NOT NULL,
    operation_code    VARCHAR(50)  DEFAULT '',
    operation_name    VARCHAR(100) DEFAULT '',
    status            VARCHAR(20)  DEFAULT 'PENDING',
    start_time        DATETIME     DEFAULT NULL,
    end_time          DATETIME     DEFAULT NULL,
    operator_id       BIGINT       DEFAULT NULL,
    operator_name     VARCHAR(50)  DEFAULT '',
    approval_status   VARCHAR(20)  DEFAULT '',
    approver_id       BIGINT       DEFAULT NULL,
    approver_name     VARCHAR(50)  DEFAULT '',
    approval_time     DATETIME     DEFAULT NULL,
    approval_comment  VARCHAR(500) DEFAULT '',
    data_record       TEXT         DEFAULT NULL,
    remark            VARCHAR(500) DEFAULT '',
    deleted           TINYINT      DEFAULT 0,
    create_time       DATETIME     DEFAULT CURRENT_TIMESTAMP,
    update_time       DATETIME     DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- 7. 设备使用记录表
CREATE TABLE IF NOT EXISTS ebr_equipment_usage (
    id                BIGINT       NOT NULL AUTO_INCREMENT,
    ebr_id            BIGINT       NOT NULL,
    step_id           BIGINT       DEFAULT NULL,
    equipment_code    VARCHAR(50)  NOT NULL,
    equipment_name    VARCHAR(200) DEFAULT '',
    equipment_type    VARCHAR(50)  DEFAULT '',
    start_time        DATETIME     NOT NULL,
    end_time          DATETIME     DEFAULT NULL,
    duration          INT          DEFAULT 0,
    operator_id       BIGINT       DEFAULT NULL,
    operator_name     VARCHAR(50)  DEFAULT '',
    usage_status      VARCHAR(20)  DEFAULT '',
    maintenance_record TEXT         DEFAULT NULL,
    deleted           TINYINT      DEFAULT 0,
    create_time       DATETIME     DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- 8. 物料平衡表
CREATE TABLE IF NOT EXISTS ebr_material_balance (
    id                BIGINT       NOT NULL AUTO_INCREMENT,
    ebr_id            BIGINT       NOT NULL,
    material_id       BIGINT       NOT NULL,
    material_code     VARCHAR(50)  DEFAULT '',
    material_name     VARCHAR(200) DEFAULT '',
    spec              VARCHAR(200) DEFAULT '',
    unit_id           BIGINT       DEFAULT NULL,
    unit_name         VARCHAR(50)  DEFAULT '',
    plan_quantity     DECIMAL(18,6) NOT NULL,
    theoretical_quantity DECIMAL(18,6) NOT NULL,
    actual_input      DECIMAL(18,6) DEFAULT 0,
    actual_output     DECIMAL(18,6) DEFAULT 0,
    difference        DECIMAL(18,6) DEFAULT 0,
    difference_rate   DECIMAL(5,2) DEFAULT 0,
    balance_status    VARCHAR(20)  DEFAULT 'BALANCED',
    remark            VARCHAR(500) DEFAULT '',
    deleted           TINYINT      DEFAULT 0,
    create_time       DATETIME     DEFAULT CURRENT_TIMESTAMP,
    update_time       DATETIME     DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- 9. 领料单表
CREATE TABLE IF NOT EXISTS material_issuance (
    id                BIGINT       NOT NULL AUTO_INCREMENT,
    issuance_no       VARCHAR(50)  NOT NULL,
    issuance_type     VARCHAR(50)  DEFAULT 'PRODUCTION',
    department_id     BIGINT       DEFAULT NULL,
    department_name   VARCHAR(100) DEFAULT '',
    work_center_id    BIGINT       DEFAULT NULL,
    work_center_name  VARCHAR(100) DEFAULT '',
    requester_id      BIGINT       DEFAULT NULL,
    requester_name    VARCHAR(50)  DEFAULT '',
    request_time      DATETIME     DEFAULT CURRENT_TIMESTAMP,
    status            VARCHAR(20)  DEFAULT 'PENDING',
    approval_status   VARCHAR(20)  DEFAULT 'PENDING',
    approver_id       BIGINT       DEFAULT NULL,
    approver_name     VARCHAR(50)  DEFAULT '',
    approval_time     DATETIME     DEFAULT NULL,
    approval_comment  VARCHAR(500) DEFAULT '',
    issuer_id         BIGINT       DEFAULT NULL,
    issuer_name       VARCHAR(50)  DEFAULT '',
    issue_time        DATETIME     DEFAULT NULL,
    receiver_id       BIGINT       DEFAULT NULL,
    receiver_name     VARCHAR(50)  DEFAULT '',
    receive_time      DATETIME     DEFAULT NULL,
    remark            TEXT         DEFAULT NULL,
    deleted           TINYINT      DEFAULT 0,
    create_time       DATETIME     DEFAULT CURRENT_TIMESTAMP,
    update_time       DATETIME     DEFAULT CURRENT_TIMESTAMP,
    create_by         VARCHAR(50)  DEFAULT '',
    update_by         VARCHAR(50)  DEFAULT '',
    PRIMARY KEY (id)
);

-- 10. 领料单明细表
CREATE TABLE IF NOT EXISTS material_issuance_detail (
    id                BIGINT       NOT NULL AUTO_INCREMENT,
    issuance_id       BIGINT       NOT NULL,
    line_no           INT          DEFAULT 10,
    material_id       BIGINT       NOT NULL,
    material_code     VARCHAR(50)  DEFAULT '',
    material_name     VARCHAR(200) DEFAULT '',
    spec              VARCHAR(200) DEFAULT '',
    unit_id           BIGINT       DEFAULT NULL,
    unit_name         VARCHAR(50)  DEFAULT '',
    request_quantity  DECIMAL(18,4) NOT NULL,
    approval_quantity DECIMAL(18,4) DEFAULT 0,
    issued_quantity   DECIMAL(18,4) DEFAULT 0,
    returned_quantity DECIMAL(18,4) DEFAULT 0,
    batch_no          VARCHAR(50)  DEFAULT '',
    lot_no            VARCHAR(50)  DEFAULT '',
    warehouse_id      BIGINT       DEFAULT NULL,
    warehouse_name    VARCHAR(100) DEFAULT '',
    location          VARCHAR(100) DEFAULT '',
    unit_price        DECIMAL(18,4) DEFAULT 0,
    total_price       DECIMAL(18,4) DEFAULT 0,
    remark            VARCHAR(500) DEFAULT '',
    deleted           TINYINT      DEFAULT 0,
    create_time       DATETIME     DEFAULT CURRENT_TIMESTAMP,
    update_time       DATETIME     DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);
-- ================================================
-- QMS 模块：质量管理 / 质检 / MRB / 放行
-- ================================================

-- 1. 质检项目表
CREATE TABLE IF NOT EXISTS inspection_item (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    code        VARCHAR(50)  NOT NULL,
    name        VARCHAR(100) NOT NULL,
    category    VARCHAR(50)  DEFAULT '',
    method      VARCHAR(200) DEFAULT '',
    standard    TEXT         DEFAULT NULL,
    unit        VARCHAR(20)  DEFAULT '',
    min_value   DECIMAL(18,6) DEFAULT NULL,
    max_value   DECIMAL(18,6) DEFAULT NULL,
    is_key_item TINYINT      DEFAULT 0,
    status      TINYINT      DEFAULT 1,
    deleted     TINYINT      DEFAULT 0,
    create_time DATETIME     DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME     DEFAULT CURRENT_TIMESTAMP,
    create_by   VARCHAR(50)  DEFAULT '',
    update_by   VARCHAR(50)  DEFAULT '',
    PRIMARY KEY (id)
);

-- 2. 质检任务表
CREATE TABLE IF NOT EXISTS inspection_task (
    id                BIGINT       NOT NULL AUTO_INCREMENT,
    task_no           VARCHAR(50)  NOT NULL,
    task_type         VARCHAR(50)  NOT NULL,
    source_type       VARCHAR(50)  DEFAULT '',
    source_no         VARCHAR(50)  DEFAULT '',
    material_id       BIGINT       DEFAULT NULL,
    material_code     VARCHAR(50)  DEFAULT '',
    material_name     VARCHAR(200) DEFAULT '',
    batch_no          VARCHAR(50)  DEFAULT '',
    quantity          DECIMAL(18,4) DEFAULT 0,
    unit              VARCHAR(20)  DEFAULT '',
    sample_quantity   DECIMAL(18,4) DEFAULT 0,
    inspect_date      DATE         DEFAULT NULL,
    inspector_id      BIGINT       DEFAULT NULL,
    inspector_name    VARCHAR(50)  DEFAULT '',
    status            VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    result            VARCHAR(20)  DEFAULT '',
    total_items       INT          DEFAULT 0,
    pass_items        INT          DEFAULT 0,
    fail_items        INT          DEFAULT 0,
    remark            TEXT         DEFAULT NULL,
    deleted           TINYINT      DEFAULT 0,
    create_time       DATETIME     DEFAULT CURRENT_TIMESTAMP,
    update_time       DATETIME     DEFAULT CURRENT_TIMESTAMP,
    create_by         VARCHAR(50)  DEFAULT '',
    update_by         VARCHAR(50)  DEFAULT '',
    complete_time     DATETIME     DEFAULT NULL,
    PRIMARY KEY (id)
);

-- 3. 质检结果表
CREATE TABLE IF NOT EXISTS inspection_result (
    id                BIGINT       NOT NULL AUTO_INCREMENT,
    task_id           BIGINT       NOT NULL,
    item_id           BIGINT       NOT NULL,
    item_code         VARCHAR(50)  DEFAULT '',
    item_name         VARCHAR(100) DEFAULT '',
    sample_no         VARCHAR(50)  DEFAULT '',
    actual_value      DECIMAL(18,6) DEFAULT NULL,
    result            VARCHAR(20)  NOT NULL,
    unit              VARCHAR(20)  DEFAULT '',
    min_value         DECIMAL(18,6) DEFAULT NULL,
    max_value         DECIMAL(18,6) DEFAULT NULL,
    inspector_id      BIGINT       DEFAULT NULL,
    inspector_name    VARCHAR(50)  DEFAULT '',
    inspect_time      DATETIME     DEFAULT NULL,
    remark            VARCHAR(500) DEFAULT '',
    deleted           TINYINT      DEFAULT 0,
    create_time       DATETIME     DEFAULT CURRENT_TIMESTAMP,
    update_time       DATETIME     DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- 4. MRB评审记录表
CREATE TABLE IF NOT EXISTS mrb_record (
    id                BIGINT       NOT NULL AUTO_INCREMENT,
    mrb_no            VARCHAR(50)  NOT NULL,
    task_id           BIGINT       DEFAULT NULL,
    material_id       BIGINT       DEFAULT NULL,
    material_code     VARCHAR(50)  DEFAULT '',
    material_name     VARCHAR(200) DEFAULT '',
    batch_no          VARCHAR(50)  DEFAULT '',
    quantity          DECIMAL(18,4) DEFAULT 0,
    unit              VARCHAR(20)  DEFAULT '',
    failure_type      VARCHAR(50)  DEFAULT '',
    failure_desc      TEXT         DEFAULT NULL,
    reporter_id       BIGINT       DEFAULT NULL,
    reporter_name     VARCHAR(50)  DEFAULT '',
    report_time       DATETIME     DEFAULT NULL,
    status            VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    disposition       VARCHAR(50)  DEFAULT '',
    disposition_desc  TEXT         DEFAULT NULL,
    disposition_by    VARCHAR(50)  DEFAULT '',
    disposition_time  DATETIME     DEFAULT NULL,
    remark            TEXT         DEFAULT NULL,
    deleted           TINYINT      DEFAULT 0,
    create_time       DATETIME     DEFAULT CURRENT_TIMESTAMP,
    update_time       DATETIME     DEFAULT CURRENT_TIMESTAMP,
    create_by         VARCHAR(50)  DEFAULT '',
    update_by         VARCHAR(50)  DEFAULT '',
    complete_time     DATETIME     DEFAULT NULL,
    PRIMARY KEY (id)
);

-- 5. MRB评审意见表
CREATE TABLE IF NOT EXISTS mrb_review_opinion (
    id                BIGINT       NOT NULL AUTO_INCREMENT,
    mrb_id            BIGINT       NOT NULL,
    reviewer_id       BIGINT       NOT NULL,
    reviewer_name     VARCHAR(50)  DEFAULT '',
    role              VARCHAR(50)  DEFAULT '',
    opinion           TEXT         DEFAULT NULL,
    recommendation    VARCHAR(50)  DEFAULT '',
    review_time       DATETIME     DEFAULT NULL,
    deleted           TINYINT      DEFAULT 0,
    create_time       DATETIME     DEFAULT CURRENT_TIMESTAMP,
    update_time       DATETIME     DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- 6. MRB处理方案表
CREATE TABLE IF NOT EXISTS mrb_disposition (
    id                BIGINT       NOT NULL AUTO_INCREMENT,
    mrb_id            BIGINT       NOT NULL,
    disposition_type  VARCHAR(50)  NOT NULL,
    description       TEXT         DEFAULT NULL,
    quantity          DECIMAL(18,4) DEFAULT 0,
    unit              VARCHAR(20)  DEFAULT '',
    handler_id        BIGINT       DEFAULT NULL,
    handler_name      VARCHAR(50)  DEFAULT '',
    handle_time       DATETIME     DEFAULT NULL,
    result            VARCHAR(20)  DEFAULT '',
    remark            VARCHAR(500) DEFAULT '',
    deleted           TINYINT      DEFAULT 0,
    create_time       DATETIME     DEFAULT CURRENT_TIMESTAMP,
    update_time       DATETIME     DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- 7. 质量放行表
CREATE TABLE IF NOT EXISTS quality_release (
    id                BIGINT       NOT NULL AUTO_INCREMENT,
    release_no        VARCHAR(50)  NOT NULL,
    release_type      VARCHAR(50)  NOT NULL,
    task_id           BIGINT       DEFAULT NULL,
    material_id       BIGINT       DEFAULT NULL,
    material_code     VARCHAR(50)  DEFAULT '',
    material_name     VARCHAR(200) DEFAULT '',
    batch_no          VARCHAR(50)  NOT NULL,
    quantity          DECIMAL(18,4) DEFAULT 0,
    unit              VARCHAR(20)  DEFAULT '',
    warehouse_id      BIGINT       DEFAULT NULL,
    warehouse_name    VARCHAR(100) DEFAULT '',
    release_date      DATE         DEFAULT NULL,
    status            VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    applicant_id      BIGINT       DEFAULT NULL,
    applicant_name    VARCHAR(50)  DEFAULT '',
    apply_time        DATETIME     DEFAULT NULL,
    approver_id       BIGINT       DEFAULT NULL,
    approver_name     VARCHAR(50)  DEFAULT '',
    approve_time      DATETIME     DEFAULT NULL,
    approve_remark    VARCHAR(500) DEFAULT '',
    remark            TEXT         DEFAULT NULL,
    deleted           TINYINT      DEFAULT 0,
    create_time       DATETIME     DEFAULT CURRENT_TIMESTAMP,
    update_time       DATETIME     DEFAULT CURRENT_TIMESTAMP,
    create_by         VARCHAR(50)  DEFAULT '',
    update_by         VARCHAR(50)  DEFAULT '',
    PRIMARY KEY (id)
);

-- 8. 放行证书表
CREATE TABLE IF NOT EXISTS release_certificate (
    id                BIGINT       NOT NULL AUTO_INCREMENT,
    certificate_no    VARCHAR(50)  NOT NULL,
    release_id        BIGINT       NOT NULL,
    certificate_type  VARCHAR(50)  DEFAULT 'COA',
    issue_date        DATE         DEFAULT NULL,
    expiry_date       DATE         DEFAULT NULL,
    issuer_id         BIGINT       DEFAULT NULL,
    issuer_name       VARCHAR(50)  DEFAULT '',
    content           TEXT         DEFAULT NULL,
    file_path         VARCHAR(500) DEFAULT '',
    status            VARCHAR(20)  DEFAULT 'VALID',
    deleted           TINYINT      DEFAULT 0,
    create_time       DATETIME     DEFAULT CURRENT_TIMESTAMP,
    update_time       DATETIME     DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- ================================================
-- 质量管理模块初始化数据
-- ================================================

-- 质检项目数据
INSERT IGNORE INTO inspection_item (code, name, category, method, standard, unit, min_value, max_value, is_key_item, status) VALUES
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

-- ================================================
-- QMS 模块：质量管理 / 质检 / MRB / 放行
-- ================================================

-- 1. 质检项目表
CREATE TABLE IF NOT EXISTS inspection_item (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    code        VARCHAR(50)  NOT NULL,
    name        VARCHAR(100) NOT NULL,
    category    VARCHAR(50)  DEFAULT '',
    method      VARCHAR(200) DEFAULT '',
    standard    TEXT         DEFAULT NULL,
    unit        VARCHAR(20)  DEFAULT '',
    min_value   DECIMAL(18,6) DEFAULT NULL,
    max_value   DECIMAL(18,6) DEFAULT NULL,
    is_key_item TINYINT      DEFAULT 0,
    status      TINYINT      DEFAULT 1,
    deleted     TINYINT      DEFAULT 0,
    create_time DATETIME     DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME     DEFAULT CURRENT_TIMESTAMP,
    create_by   VARCHAR(50)  DEFAULT '',
    update_by   VARCHAR(50)  DEFAULT '',
    PRIMARY KEY (id)
);

-- 2. 质检任务表
CREATE TABLE IF NOT EXISTS inspection_task (
    id                BIGINT       NOT NULL AUTO_INCREMENT,
    task_no           VARCHAR(50)  NOT NULL,
    task_type         VARCHAR(50)  NOT NULL,
    source_type       VARCHAR(50)  DEFAULT '',
    source_no         VARCHAR(50)  DEFAULT '',
    material_id       BIGINT       DEFAULT NULL,
    material_code     VARCHAR(50)  DEFAULT '',
    material_name     VARCHAR(200) DEFAULT '',
    batch_no          VARCHAR(50)  DEFAULT '',
    quantity          DECIMAL(18,4) DEFAULT 0,
    unit              VARCHAR(20)  DEFAULT '',
    sample_quantity   DECIMAL(18,4) DEFAULT 0,
    inspect_date      DATE         DEFAULT NULL,
    inspector_id      BIGINT       DEFAULT NULL,
    inspector_name    VARCHAR(50)  DEFAULT '',
    status            VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    result            VARCHAR(20)  DEFAULT '',
    total_items       INT          DEFAULT 0,
    pass_items        INT          DEFAULT 0,
    fail_items        INT          DEFAULT 0,
    remark            TEXT         DEFAULT NULL,
    deleted           TINYINT      DEFAULT 0,
    create_time       DATETIME     DEFAULT CURRENT_TIMESTAMP,
    update_time       DATETIME     DEFAULT CURRENT_TIMESTAMP,
    create_by         VARCHAR(50)  DEFAULT '',
    update_by         VARCHAR(50)  DEFAULT '',
    complete_time     DATETIME     DEFAULT NULL,
    PRIMARY KEY (id)
);

-- 3. 质检结果表
CREATE TABLE IF NOT EXISTS inspection_result (
    id                BIGINT       NOT NULL AUTO_INCREMENT,
    task_id           BIGINT       NOT NULL,
    item_id           BIGINT       NOT NULL,
    item_code         VARCHAR(50)  DEFAULT '',
    item_name         VARCHAR(100) DEFAULT '',
    sample_no         VARCHAR(50)  DEFAULT '',
    actual_value      DECIMAL(18,6) DEFAULT NULL,
    result            VARCHAR(20)  NOT NULL,
    unit              VARCHAR(20)  DEFAULT '',
    min_value         DECIMAL(18,6) DEFAULT NULL,
    max_value         DECIMAL(18,6) DEFAULT NULL,
    inspector_id      BIGINT       DEFAULT NULL,
    inspector_name    VARCHAR(50)  DEFAULT '',
    inspect_time      DATETIME     DEFAULT NULL,
    remark            VARCHAR(500) DEFAULT '',
    deleted           TINYINT      DEFAULT 0,
    create_time       DATETIME     DEFAULT CURRENT_TIMESTAMP,
    update_time       DATETIME     DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- 4. MRB评审记录表
CREATE TABLE IF NOT EXISTS mrb_record (
    id                BIGINT       NOT NULL AUTO_INCREMENT,
    mrb_no            VARCHAR(50)  NOT NULL,
    task_id           BIGINT       DEFAULT NULL,
    material_id       BIGINT       DEFAULT NULL,
    material_code     VARCHAR(50)  DEFAULT '',
    material_name     VARCHAR(200) DEFAULT '',
    batch_no          VARCHAR(50)  DEFAULT '',
    quantity          DECIMAL(18,4) DEFAULT 0,
    unit              VARCHAR(20)  DEFAULT '',
    failure_type      VARCHAR(50)  DEFAULT '',
    failure_desc      TEXT         DEFAULT NULL,
    reporter_id       BIGINT       DEFAULT NULL,
    reporter_name     VARCHAR(50)  DEFAULT '',
    report_time       DATETIME     DEFAULT NULL,
    status            VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    disposition       VARCHAR(50)  DEFAULT '',
    disposition_desc  TEXT         DEFAULT NULL,
    disposition_by    VARCHAR(50)  DEFAULT '',
    disposition_time  DATETIME     DEFAULT NULL,
    remark            TEXT         DEFAULT NULL,
    deleted           TINYINT      DEFAULT 0,
    create_time       DATETIME     DEFAULT CURRENT_TIMESTAMP,
    update_time       DATETIME     DEFAULT CURRENT_TIMESTAMP,
    create_by         VARCHAR(50)  DEFAULT '',
    update_by         VARCHAR(50)  DEFAULT '',
    complete_time     DATETIME     DEFAULT NULL,
    PRIMARY KEY (id)
);

-- 5. MRB评审意见表
CREATE TABLE IF NOT EXISTS mrb_review_opinion (
    id                BIGINT       NOT NULL AUTO_INCREMENT,
    mrb_id            BIGINT       NOT NULL,
    reviewer_id       BIGINT       NOT NULL,
    reviewer_name     VARCHAR(50)  DEFAULT '',
    role              VARCHAR(50)  DEFAULT '',
    opinion           TEXT         DEFAULT NULL,
    recommendation    VARCHAR(50)  DEFAULT '',
    review_time       DATETIME     DEFAULT NULL,
    deleted           TINYINT      DEFAULT 0,
    create_time       DATETIME     DEFAULT CURRENT_TIMESTAMP,
    update_time       DATETIME     DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- 6. MRB处理方案表
CREATE TABLE IF NOT EXISTS mrb_disposition (
    id                BIGINT       NOT NULL AUTO_INCREMENT,
    mrb_id            BIGINT       NOT NULL,
    disposition_type  VARCHAR(50)  NOT NULL,
    description       TEXT         DEFAULT NULL,
    quantity          DECIMAL(18,4) DEFAULT 0,
    unit              VARCHAR(20)  DEFAULT '',
    handler_id        BIGINT       DEFAULT NULL,
    handler_name      VARCHAR(50)  DEFAULT '',
    handle_time       DATETIME     DEFAULT NULL,
    result            VARCHAR(20)  DEFAULT '',
    remark            VARCHAR(500) DEFAULT '',
    deleted           TINYINT      DEFAULT 0,
    create_time       DATETIME     DEFAULT CURRENT_TIMESTAMP,
    update_time       DATETIME     DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- 7. 质量放行表
CREATE TABLE IF NOT EXISTS quality_release (
    id                BIGINT       NOT NULL AUTO_INCREMENT,
    release_no        VARCHAR(50)  NOT NULL,
    release_type      VARCHAR(50)  NOT NULL,
    task_id           BIGINT       DEFAULT NULL,
    material_id       BIGINT       DEFAULT NULL,
    material_code     VARCHAR(50)  DEFAULT '',
    material_name     VARCHAR(200) DEFAULT '',
    batch_no          VARCHAR(50)  NOT NULL,
    quantity          DECIMAL(18,4) DEFAULT 0,
    unit              VARCHAR(20)  DEFAULT '',
    warehouse_id      BIGINT       DEFAULT NULL,
    warehouse_name    VARCHAR(100) DEFAULT '',
    release_date      DATE         DEFAULT NULL,
    status            VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    applicant_id      BIGINT       DEFAULT NULL,
    applicant_name    VARCHAR(50)  DEFAULT '',
    apply_time        DATETIME     DEFAULT NULL,
    approver_id       BIGINT       DEFAULT NULL,
    approver_name     VARCHAR(50)  DEFAULT '',
    approve_time      DATETIME     DEFAULT NULL,
    approve_remark    VARCHAR(500) DEFAULT '',
    remark            TEXT         DEFAULT NULL,
    deleted           TINYINT      DEFAULT 0,
    create_time       DATETIME     DEFAULT CURRENT_TIMESTAMP,
    update_time       DATETIME     DEFAULT CURRENT_TIMESTAMP,
    create_by         VARCHAR(50)  DEFAULT '',
    update_by         VARCHAR(50)  DEFAULT '',
    PRIMARY KEY (id)
);

-- 8. 放行证书表
CREATE TABLE IF NOT EXISTS release_certificate (
    id                BIGINT       NOT NULL AUTO_INCREMENT,
    certificate_no    VARCHAR(50)  NOT NULL,
    release_id        BIGINT       NOT NULL,
    certificate_type  VARCHAR(50)  DEFAULT 'COA',
    issue_date        DATE         DEFAULT NULL,
    expiry_date       DATE         DEFAULT NULL,
    issuer_id         BIGINT       DEFAULT NULL,
    issuer_name       VARCHAR(50)  DEFAULT '',
    content           TEXT         DEFAULT NULL,
    file_path         VARCHAR(500) DEFAULT '',
    status            VARCHAR(20)  DEFAULT 'VALID',
    deleted           TINYINT      DEFAULT 0,
    create_time       DATETIME     DEFAULT CURRENT_TIMESTAMP,
    update_time       DATETIME     DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- ================================================
-- 质量管理模块初始化数据
-- ================================================

-- 质检项目数据
INSERT IGNORE INTO inspection_item (code, name, category, method, standard, unit, min_value, max_value, is_key_item, status) VALUES
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

-- ================================================
-- 车间执行模块 (WIP) - 额外的表结构
-- ================================================

-- 6. 批记录步骤表
CREATE TABLE IF NOT EXISTS ebr_step (
    id                BIGINT       NOT NULL AUTO_INCREMENT,
    ebr_id            BIGINT       NOT NULL,
    step_no           INT          NOT NULL,
    step_name         VARCHAR(100) NOT NULL,
    operation_code    VARCHAR(50)  DEFAULT '',
    operation_name    VARCHAR(100) DEFAULT '',
    status            VARCHAR(20)  DEFAULT 'PENDING',
    start_time        DATETIME     DEFAULT NULL,
    end_time          DATETIME     DEFAULT NULL,
    operator_id       BIGINT       DEFAULT NULL,
    operator_name     VARCHAR(50)  DEFAULT '',
    approval_status   VARCHAR(20)  DEFAULT '',
    approver_id       BIGINT       DEFAULT NULL,
    approver_name     VARCHAR(50)  DEFAULT '',
    approval_time     DATETIME     DEFAULT NULL,
    approval_comment  VARCHAR(500) DEFAULT '',
    data_record       TEXT         DEFAULT NULL,
    remark            VARCHAR(500) DEFAULT '',
    deleted           TINYINT      DEFAULT 0,
    create_time       DATETIME     DEFAULT CURRENT_TIMESTAMP,
    update_time       DATETIME     DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- 7. 设备使用记录表
CREATE TABLE IF NOT EXISTS ebr_equipment_usage (
    id                BIGINT       NOT NULL AUTO_INCREMENT,
    ebr_id            BIGINT       NOT NULL,
    step_id           BIGINT       DEFAULT NULL,
    equipment_code    VARCHAR(50)  NOT NULL,
    equipment_name    VARCHAR(200) DEFAULT '',
    equipment_type    VARCHAR(50)  DEFAULT '',
    start_time        DATETIME     NOT NULL,
    end_time          DATETIME     DEFAULT NULL,
    duration          INT          DEFAULT 0,
    operator_id       BIGINT       DEFAULT NULL,
    operator_name     VARCHAR(50)  DEFAULT '',
    usage_status      VARCHAR(20)  DEFAULT '',
    maintenance_record TEXT         DEFAULT NULL,
    deleted           TINYINT      DEFAULT 0,
    create_time       DATETIME     DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- 8. 物料平衡表
CREATE TABLE IF NOT EXISTS ebr_material_balance (
    id                BIGINT       NOT NULL AUTO_INCREMENT,
    ebr_id            BIGINT       NOT NULL,
    material_id       BIGINT       NOT NULL,
    material_code     VARCHAR(50)  DEFAULT '',
    material_name     VARCHAR(200) DEFAULT '',
    spec              VARCHAR(200) DEFAULT '',
    unit_id           BIGINT       DEFAULT NULL,
    unit_name         VARCHAR(50)  DEFAULT '',
    plan_quantity     DECIMAL(18,6) NOT NULL,
    theoretical_quantity DECIMAL(18,6) NOT NULL,
    actual_input      DECIMAL(18,6) DEFAULT 0,
    actual_output     DECIMAL(18,6) DEFAULT 0,
    difference        DECIMAL(18,6) DEFAULT 0,
    difference_rate   DECIMAL(5,2) DEFAULT 0,
    balance_status    VARCHAR(20)  DEFAULT 'BALANCED',
    remark            VARCHAR(500) DEFAULT '',
    deleted           TINYINT      DEFAULT 0,
    create_time       DATETIME     DEFAULT CURRENT_TIMESTAMP,
    update_time       DATETIME     DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- 9. 领料单表
CREATE TABLE IF NOT EXISTS material_issuance (
    id                BIGINT       NOT NULL AUTO_INCREMENT,
    issuance_no       VARCHAR(50)  NOT NULL,
    issuance_type     VARCHAR(50)  DEFAULT 'PRODUCTION',
    department_id     BIGINT       DEFAULT NULL,
    department_name   VARCHAR(100) DEFAULT '',
    work_center_id    BIGINT       DEFAULT NULL,
    work_center_name  VARCHAR(100) DEFAULT '',
    requester_id      BIGINT       DEFAULT NULL,
    requester_name    VARCHAR(50)  DEFAULT '',
    request_time      DATETIME     DEFAULT CURRENT_TIMESTAMP,
    status            VARCHAR(20)  DEFAULT 'PENDING',
    approval_status   VARCHAR(20)  DEFAULT 'PENDING',
    approver_id       BIGINT       DEFAULT NULL,
    approver_name     VARCHAR(50)  DEFAULT '',
    approval_time     DATETIME     DEFAULT NULL,
    approval_comment  VARCHAR(500) DEFAULT '',
    issuer_id         BIGINT       DEFAULT NULL,
    issuer_name       VARCHAR(50)  DEFAULT '',
    issue_time        DATETIME     DEFAULT NULL,
    receiver_id       BIGINT       DEFAULT NULL,
    receiver_name     VARCHAR(50)  DEFAULT '',
    receive_time      DATETIME     DEFAULT NULL,
    remark            TEXT         DEFAULT NULL,
    deleted           TINYINT      DEFAULT 0,
    create_time       DATETIME     DEFAULT CURRENT_TIMESTAMP,
    update_time       DATETIME     DEFAULT CURRENT_TIMESTAMP,
    create_by         VARCHAR(50)  DEFAULT '',
    update_by         VARCHAR(50)  DEFAULT '',
    PRIMARY KEY (id)
);

-- 10. 领料单明细表
CREATE TABLE IF NOT EXISTS material_issuance_detail (
    id                BIGINT       NOT NULL AUTO_INCREMENT,
    issuance_id       BIGINT       NOT NULL,
    line_no           INT          DEFAULT 10,
    material_id       BIGINT       NOT NULL,
    material_code     VARCHAR(50)  DEFAULT '',
    material_name     VARCHAR(200) DEFAULT '',
    spec              VARCHAR(200) DEFAULT '',
    unit_id           BIGINT       DEFAULT NULL,
    unit_name         VARCHAR(50)  DEFAULT '',
    request_quantity  DECIMAL(18,4) NOT NULL,
    approval_quantity DECIMAL(18,4) DEFAULT 0,
    issued_quantity   DECIMAL(18,4) DEFAULT 0,
    returned_quantity DECIMAL(18,4) DEFAULT 0,
    batch_no          VARCHAR(50)  DEFAULT '',
    lot_no            VARCHAR(50)  DEFAULT '',
    warehouse_id      BIGINT       DEFAULT NULL,
    warehouse_name    VARCHAR(100) DEFAULT '',
    location          VARCHAR(100) DEFAULT '',
    unit_price        DECIMAL(18,4) DEFAULT 0,
    total_price       DECIMAL(18,4) DEFAULT 0,
    remark            VARCHAR(500) DEFAULT '',
    deleted           TINYINT      DEFAULT 0,
    create_time       DATETIME     DEFAULT CURRENT_TIMESTAMP,
    update_time       DATETIME     DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- ================================================
-- 9 新增模块表
-- ================================================

CREATE TABLE IF NOT EXISTS mes_workshop (
    id           BIGINT       NOT NULL AUTO_INCREMENT,
    code         VARCHAR(50)  NOT NULL,
    name         VARCHAR(100) NOT NULL,
    type         VARCHAR(50)  DEFAULT '',
    manager_name VARCHAR(100) DEFAULT '',
    phone        VARCHAR(50)  DEFAULT '',
    address      VARCHAR(200) DEFAULT '',
    description  VARCHAR(500) DEFAULT '',
    status       TINYINT      DEFAULT 1,
    factory_id   BIGINT       DEFAULT NULL,
    create_time  DATETIME     DEFAULT CURRENT_TIMESTAMP,
    update_time  DATETIME     DEFAULT CURRENT_TIMESTAMP,
    deleted      TINYINT      DEFAULT 0,
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS mes_team (
    id            BIGINT       NOT NULL AUTO_INCREMENT,
    code          VARCHAR(50)  NOT NULL,
    name          VARCHAR(100) NOT NULL,
    workshop_id   BIGINT       DEFAULT NULL,
    workshop_name VARCHAR(100) DEFAULT '',
    leader_name   VARCHAR(100) DEFAULT '',
    phone         VARCHAR(50)  DEFAULT '',
    headcount     INT          DEFAULT 0,
    description   VARCHAR(500) DEFAULT '',
    status        TINYINT      DEFAULT 1,
    create_time   DATETIME     DEFAULT CURRENT_TIMESTAMP,
    update_time   DATETIME     DEFAULT CURRENT_TIMESTAMP,
    deleted       TINYINT      DEFAULT 0,
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS mes_employee (
    id           BIGINT       NOT NULL AUTO_INCREMENT,
    employee_no  VARCHAR(50)  NOT NULL,
    name         VARCHAR(100) NOT NULL,
    gender       VARCHAR(10)  DEFAULT '',
    department   VARCHAR(100) DEFAULT '',
    team_id      BIGINT       DEFAULT NULL,
    team_name    VARCHAR(100) DEFAULT '',
    position     VARCHAR(100) DEFAULT '',
    phone        VARCHAR(50)  DEFAULT '',
    email        VARCHAR(200) DEFAULT '',
    entry_date   VARCHAR(20)  DEFAULT '',
    status       TINYINT      DEFAULT 1,
    create_time  DATETIME     DEFAULT CURRENT_TIMESTAMP,
    update_time  DATETIME     DEFAULT CURRENT_TIMESTAMP,
    deleted      TINYINT      DEFAULT 0,
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS mes_work_center (
    id            BIGINT       NOT NULL AUTO_INCREMENT,
    code          VARCHAR(50)  NOT NULL,
    name          VARCHAR(100) NOT NULL,
    workshop_id   BIGINT       DEFAULT NULL,
    workshop_name VARCHAR(100) DEFAULT '',
    type          VARCHAR(50)  DEFAULT '',
    capacity      INT          DEFAULT 0,
    description   VARCHAR(500) DEFAULT '',
    status        TINYINT      DEFAULT 1,
    create_time   DATETIME     DEFAULT CURRENT_TIMESTAMP,
    update_time   DATETIME     DEFAULT CURRENT_TIMESTAMP,
    deleted       TINYINT      DEFAULT 0,
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS mes_equipment (
    id               BIGINT       NOT NULL AUTO_INCREMENT,
    code             VARCHAR(50)  NOT NULL,
    name             VARCHAR(100) NOT NULL,
    model            VARCHAR(100) DEFAULT '',
    brand            VARCHAR(100) DEFAULT '',
    work_center_id   BIGINT       DEFAULT NULL,
    work_center_name VARCHAR(100) DEFAULT '',
    serial_no        VARCHAR(100) DEFAULT '',
    purchase_date    VARCHAR(20)  DEFAULT '',
    warranty_date    VARCHAR(20)  DEFAULT '',
    status           VARCHAR(50)  DEFAULT 'NORMAL',
    description      VARCHAR(500) DEFAULT '',
    create_time      DATETIME     DEFAULT CURRENT_TIMESTAMP,
    update_time      DATETIME     DEFAULT CURRENT_TIMESTAMP,
    deleted          TINYINT      DEFAULT 0,
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS mes_float_ticket (
    id            BIGINT       NOT NULL AUTO_INCREMENT,
    ticket_no     VARCHAR(50)  NOT NULL,
    product_code  VARCHAR(50)  DEFAULT '',
    product_name  VARCHAR(200) DEFAULT '',
    quantity      INT          DEFAULT 0,
    status        VARCHAR(50)  DEFAULT 'PENDING',
    work_order_id BIGINT       DEFAULT NULL,
    work_order_no VARCHAR(50)  DEFAULT '',
    workshop_id   BIGINT       DEFAULT NULL,
    workshop_name VARCHAR(100) DEFAULT '',
    operator_name VARCHAR(100) DEFAULT '',
    remark        VARCHAR(500) DEFAULT '',
    create_time   DATETIME     DEFAULT CURRENT_TIMESTAMP,
    update_time   DATETIME     DEFAULT CURRENT_TIMESTAMP,
    deleted       TINYINT      DEFAULT 0,
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS mes_pad_issuance (
    id             BIGINT       NOT NULL AUTO_INCREMENT,
    issuance_no    VARCHAR(50)  NOT NULL,
    product_code   VARCHAR(50)  DEFAULT '',
    product_name   VARCHAR(200) DEFAULT '',
    batch_no       VARCHAR(50)  DEFAULT '',
    quantity       INT          DEFAULT 0,
    status         VARCHAR(50)  DEFAULT 'PENDING',
    work_order_id  BIGINT       DEFAULT NULL,
    work_order_no  VARCHAR(50)  DEFAULT '',
    applicant_name VARCHAR(100) DEFAULT '',
    apply_date     VARCHAR(20)  DEFAULT '',
    approver_name  VARCHAR(100) DEFAULT '',
    approve_date   VARCHAR(20)  DEFAULT '',
    remark         VARCHAR(500) DEFAULT '',
    create_time    DATETIME     DEFAULT CURRENT_TIMESTAMP,
    update_time    DATETIME     DEFAULT CURRENT_TIMESTAMP,
    deleted        TINYINT      DEFAULT 0,
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS mes_qc_scheme (
    id           BIGINT       NOT NULL AUTO_INCREMENT,
    code         VARCHAR(50)  NOT NULL,
    name         VARCHAR(100) NOT NULL,
    type         VARCHAR(50)  DEFAULT '',
    product_code VARCHAR(50)  DEFAULT '',
    product_name VARCHAR(200) DEFAULT '',
    check_items  VARCHAR(2000) DEFAULT '',
    standard     VARCHAR(2000) DEFAULT '',
    version      VARCHAR(20)  DEFAULT '1.0',
    status       TINYINT      DEFAULT 1,
    remark       VARCHAR(500) DEFAULT '',
    create_time  DATETIME     DEFAULT CURRENT_TIMESTAMP,
    update_time  DATETIME     DEFAULT CURRENT_TIMESTAMP,
    deleted      TINYINT      DEFAULT 0,
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS mes_product_series (
    id            BIGINT       NOT NULL AUTO_INCREMENT,
    code          VARCHAR(50)  NOT NULL,
    name          VARCHAR(100) NOT NULL,
    category      VARCHAR(100) DEFAULT '',
    description   VARCHAR(500) DEFAULT '',
    specification VARCHAR(500) DEFAULT '',
    unit          VARCHAR(50)  DEFAULT '',
    manager       VARCHAR(100) DEFAULT '',
    status        TINYINT      DEFAULT 1,
    remark        VARCHAR(500) DEFAULT '',
    create_time   DATETIME     DEFAULT CURRENT_TIMESTAMP,
    update_time   DATETIME     DEFAULT CURRENT_TIMESTAMP,
    deleted       TINYINT      DEFAULT 0,
    PRIMARY KEY (id)
);

-- ═══════════════════════════════════════════════════════════════════
-- P10: 设备子模块 + 倒扣监控 表定义
-- ═══════════════════════════════════════════════════════════════════

-- 1. 设备维保计划
CREATE TABLE IF NOT EXISTS equipment_maint_plan (
    id              BIGINT       NOT NULL AUTO_INCREMENT,
    plan_no         VARCHAR(50)  NOT NULL,
    equip_id        VARCHAR(50)  DEFAULT '',
    equip_code      VARCHAR(50)  NOT NULL,
    equip_name      VARCHAR(200) DEFAULT '',
    maint_type      VARCHAR(20)  NOT NULL COMMENT 'DAILY/WEEKLY/MONTHLY/QUARTERLY/ANNUAL/SPECIAL',
    maint_content   TEXT         DEFAULT NULL,
    plan_date       DATE         NOT NULL,
    plan_duration   DECIMAL(6,2) DEFAULT 0 COMMENT '计划工时(小时)',
    assignee        VARCHAR(100) DEFAULT '',
    status          VARCHAR(20)  DEFAULT 'PENDING' COMMENT 'PENDING/IN_PROGRESS/DONE/OVERDUE/SKIPPED',
    actual_date     DATE         DEFAULT NULL,
    actual_duration DECIMAL(6,2) DEFAULT NULL,
    result          VARCHAR(500) DEFAULT NULL,
    next_plan_date  DATE         DEFAULT NULL,
    remark          VARCHAR(500) DEFAULT '',
    deleted         TINYINT      DEFAULT 0,
    create_time     DATETIME     DEFAULT CURRENT_TIMESTAMP,
    update_time     DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- 2. 设备故障记录
CREATE TABLE IF NOT EXISTS equipment_fault (
    id              BIGINT       NOT NULL AUTO_INCREMENT,
    fault_no        VARCHAR(50)  NOT NULL,
    equip_id        VARCHAR(50)  DEFAULT '',
    equip_code      VARCHAR(50)  NOT NULL,
    equip_name      VARCHAR(200) DEFAULT '',
    fault_time      DATETIME     NOT NULL,
    reporter        VARCHAR(100) NOT NULL,
    fault_desc      TEXT         DEFAULT NULL,
    fault_level     VARCHAR(20)  DEFAULT 'MEDIUM' COMMENT 'LOW/MEDIUM/HIGH/CRITICAL',
    affected_batch  VARCHAR(100) DEFAULT NULL,
    affected_wo_no  VARCHAR(100) DEFAULT NULL,
    status          VARCHAR(30)  DEFAULT 'REPORTED' COMMENT 'REPORTED/ASSIGNED/REPAIRING/PENDING_VERIFY/CLOSED/CANCELLED',
    assignee        VARCHAR(100) DEFAULT NULL,
    diagnose        TEXT         DEFAULT NULL,
    repair_content  TEXT         DEFAULT NULL,
    spare_parts     VARCHAR(500) DEFAULT NULL,
    repair_start    DATETIME     DEFAULT NULL,
    repair_end      DATETIME     DEFAULT NULL,
    downtime        INT          DEFAULT NULL COMMENT '停机时长(分钟)',
    root_cause      TEXT         DEFAULT NULL,
    capa_action     TEXT         DEFAULT NULL,
    verifier        VARCHAR(100) DEFAULT NULL,
    verify_time     DATETIME     DEFAULT NULL,
    verify_result   VARCHAR(200) DEFAULT NULL,
    remark          VARCHAR(500) DEFAULT '',
    deleted         TINYINT      DEFAULT 0,
    create_time     DATETIME     DEFAULT CURRENT_TIMESTAMP,
    update_time     DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- 3. 计量校准记录
CREATE TABLE IF NOT EXISTS equipment_calibration (
    id              BIGINT       NOT NULL AUTO_INCREMENT,
    calib_no        VARCHAR(50)  NOT NULL,
    equip_id        VARCHAR(50)  DEFAULT '',
    equip_code      VARCHAR(50)  NOT NULL,
    equip_name      VARCHAR(200) DEFAULT '',
    calib_type      VARCHAR(20)  DEFAULT 'INTERNAL' COMMENT 'INTERNAL/EXTERNAL',
    calib_org       VARCHAR(200) DEFAULT NULL,
    calib_date      DATE         NOT NULL,
    next_calib_date DATE         NOT NULL,
    calib_cycle     INT          DEFAULT 12 COMMENT '周期(月)',
    calib_result    VARCHAR(20)  DEFAULT 'PASS' COMMENT 'PASS/FAIL/CONDITIONAL',
    cert_no         VARCHAR(100) DEFAULT NULL,
    uncertainty     VARCHAR(100) DEFAULT NULL,
    status          VARCHAR(30)  DEFAULT 'VALID' COMMENT 'VALID/EXPIRED/PENDING/IN_CALIBRATION/FAILED',
    measured_value  VARCHAR(200) DEFAULT NULL,
    standard_value  VARCHAR(200) DEFAULT NULL,
    deviation       VARCHAR(100) DEFAULT NULL,
    operator        VARCHAR(100) DEFAULT NULL,
    remark          VARCHAR(500) DEFAULT '',
    deleted         TINYINT      DEFAULT 0,
    create_time     DATETIME     DEFAULT CURRENT_TIMESTAMP,
    update_time     DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- 4. 备件库存
CREATE TABLE IF NOT EXISTS equipment_spare_part (
    id                  BIGINT       NOT NULL AUTO_INCREMENT,
    part_code           VARCHAR(50)  NOT NULL,
    part_name           VARCHAR(200) NOT NULL,
    part_spec           VARCHAR(200) DEFAULT '',
    applicable_equips   VARCHAR(500) DEFAULT '' COMMENT '适用设备ID列表(逗号分隔)',
    unit                VARCHAR(20)  DEFAULT '个',
    current_stock       DECIMAL(12,4) DEFAULT 0,
    safety_stock        DECIMAL(12,4) DEFAULT 0,
    unit_cost           DECIMAL(12,4) DEFAULT 0,
    supplier            VARCHAR(200) DEFAULT NULL,
    lead_time           INT          DEFAULT NULL COMMENT '采购周期(天)',
    location            VARCHAR(200) DEFAULT NULL,
    status              VARCHAR(20)  DEFAULT 'NORMAL' COMMENT 'NORMAL/LOW_STOCK/OUT_OF_STOCK',
    last_used_date      DATE         DEFAULT NULL,
    remark              VARCHAR(500) DEFAULT '',
    deleted             TINYINT      DEFAULT 0,
    create_time         DATETIME     DEFAULT CURRENT_TIMESTAMP,
    update_time         DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- 5. 设备使用记录（工序批生产记录）
CREATE TABLE IF NOT EXISTS equipment_usage (
    id              BIGINT       NOT NULL AUTO_INCREMENT,
    usage_no        VARCHAR(50)  NOT NULL,
    equip_id        VARCHAR(50)  DEFAULT '',
    equip_code      VARCHAR(50)  NOT NULL,
    equip_name      VARCHAR(200) DEFAULT '',
    wo_id           VARCHAR(50)  DEFAULT NULL,
    wo_no           VARCHAR(100) DEFAULT NULL,
    task_id         VARCHAR(50)  DEFAULT NULL,
    task_no         VARCHAR(100) DEFAULT NULL,
    batch_no        VARCHAR(100) DEFAULT NULL,
    product_code    VARCHAR(50)  DEFAULT NULL,
    product_name    VARCHAR(200) DEFAULT NULL,
    operator        VARCHAR(100) NOT NULL,
    start_time      DATETIME     NOT NULL,
    end_time        DATETIME     DEFAULT NULL,
    duration        INT          DEFAULT NULL COMMENT '使用时长(分钟)',
    setup_params    TEXT         DEFAULT NULL,
    clean_before    TINYINT      DEFAULT 1,
    clean_after     TINYINT      DEFAULT 1,
    abnormal_flag   TINYINT      DEFAULT 0,
    abnormal_desc   TEXT         DEFAULT NULL,
    operator_sign   VARCHAR(200) DEFAULT NULL,
    remark          VARCHAR(500) DEFAULT '',
    deleted         TINYINT      DEFAULT 0,
    create_time     DATETIME     DEFAULT CURRENT_TIMESTAMP,
    update_time     DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- 6. 倒扣领料日志
CREATE TABLE IF NOT EXISTS backflush_log (
    id              BIGINT       NOT NULL AUTO_INCREMENT,
    log_no          VARCHAR(50)  NOT NULL,
    work_order_id   VARCHAR(50)  DEFAULT '',
    wo_no           VARCHAR(100) NOT NULL,
    material_code   VARCHAR(50)  NOT NULL,
    material_name   VARCHAR(200) DEFAULT '',
    bom_qty         DECIMAL(12,4) DEFAULT 0 COMMENT 'BOM标准用量',
    actual_qty      DECIMAL(12,4) DEFAULT 0 COMMENT '实际倒扣量',
    unit            VARCHAR(20)  DEFAULT '个',
    batch_no        VARCHAR(100) DEFAULT NULL,
    operation_code  VARCHAR(50)  DEFAULT NULL,
    operation_name  VARCHAR(200) DEFAULT NULL,
    status          VARCHAR(20)  DEFAULT 'SUCCESS' COMMENT 'SUCCESS/FAILED/EXCEPTION/PENDING',
    exception_desc  VARCHAR(500) DEFAULT NULL,
    operator        VARCHAR(100) DEFAULT '',
    exec_time       DATETIME     DEFAULT CURRENT_TIMESTAMP,
    remark          VARCHAR(500) DEFAULT '',
    deleted         TINYINT      DEFAULT 0,
    create_time     DATETIME     DEFAULT CURRENT_TIMESTAMP,
    update_time     DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

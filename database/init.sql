-- ============================================================
-- 天美健大自然生物工程有限公司 MES系统 数据库初始化脚本
-- 数据库：tmj_mes_db (独立数据库，不与旧系统混用)
-- 字符集：utf8mb4
-- 版本：V1.0 | 2026-06-11
-- ============================================================

USE tmj_mes_db;

-- ============================================================
-- M09 系统管理模块
-- ============================================================

-- 工厂/组织表
CREATE TABLE IF NOT EXISTS sys_factory (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    factory_code VARCHAR(20) NOT NULL COMMENT '工厂编码 (NJ=南京, LS=溧水)',
    factory_name VARCHAR(100) NOT NULL COMMENT '工厂名称',
    address     VARCHAR(200) DEFAULT '',
    contact     VARCHAR(50)  DEFAULT '',
    phone       VARCHAR(20)  DEFAULT '',
    status      TINYINT      DEFAULT 1 COMMENT '1启用 0禁用',
    deleted     TINYINT      DEFAULT 0,
    create_time DATETIME     DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_factory_code (factory_code)
) COMMENT='工厂档案';

-- 角色表
CREATE TABLE IF NOT EXISTS sys_role (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    role_code   VARCHAR(50)  NOT NULL COMMENT '角色编码',
    role_name   VARCHAR(100) NOT NULL COMMENT '角色名称',
    description VARCHAR(200) DEFAULT '',
    status      TINYINT      DEFAULT 1,
    deleted     TINYINT      DEFAULT 0,
    create_time DATETIME     DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_role_code (role_code)
) COMMENT='角色表';

-- 用户表
CREATE TABLE IF NOT EXISTS sys_user (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    username    VARCHAR(50)  NOT NULL COMMENT '用户名',
    password    VARCHAR(255) NOT NULL COMMENT '密码(BCrypt)',
    real_name   VARCHAR(50)  NOT NULL COMMENT '真实姓名',
    employee_no VARCHAR(30)  DEFAULT '' COMMENT '员工编号',
    factory_code VARCHAR(20) DEFAULT '' COMMENT '所属工厂',
    role_id     BIGINT       DEFAULT NULL COMMENT '角色ID',
    role_code   VARCHAR(50)  DEFAULT '' COMMENT '角色编码',
    phone       VARCHAR(20)  DEFAULT '',
    email       VARCHAR(100) DEFAULT '',
    avatar      VARCHAR(255) DEFAULT '',
    status      TINYINT      DEFAULT 1 COMMENT '1启用 0禁用',
    last_login  DATETIME     DEFAULT NULL,
    deleted     TINYINT      DEFAULT 0,
    create_time DATETIME     DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_username (username)
) COMMENT='系统用户';

-- 权限/菜单表
CREATE TABLE IF NOT EXISTS sys_permission (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    parent_id   BIGINT       DEFAULT 0,
    perm_code   VARCHAR(100) NOT NULL COMMENT '权限编码',
    perm_name   VARCHAR(100) NOT NULL COMMENT '权限名称',
    perm_type   VARCHAR(20)  DEFAULT 'MENU' COMMENT 'MENU/BUTTON/API',
    path        VARCHAR(200) DEFAULT '' COMMENT '路由路径',
    icon        VARCHAR(100) DEFAULT '',
    sort_no     INT          DEFAULT 0,
    status      TINYINT      DEFAULT 1,
    deleted     TINYINT      DEFAULT 0,
    PRIMARY KEY (id)
) COMMENT='系统权限';

-- 角色权限关联表
CREATE TABLE IF NOT EXISTS sys_role_permission (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    role_id     BIGINT       NOT NULL,
    perm_id     BIGINT       NOT NULL,
    PRIMARY KEY (id),
    KEY idx_role_id (role_id),
    KEY idx_perm_id (perm_id)
) COMMENT='角色权限';

-- 操作审计日志
CREATE TABLE IF NOT EXISTS sys_audit_log (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    user_id     BIGINT       DEFAULT NULL,
    username    VARCHAR(50)  DEFAULT '',
    factory_code VARCHAR(20) DEFAULT '',
    module      VARCHAR(50)  DEFAULT '' COMMENT '模块',
    action      VARCHAR(50)  DEFAULT '' COMMENT '操作',
    target_type VARCHAR(50)  DEFAULT '' COMMENT '对象类型',
    target_id   VARCHAR(50)  DEFAULT '' COMMENT '对象ID',
    detail      TEXT         COMMENT '操作详情',
    ip_address  VARCHAR(50)  DEFAULT '',
    checksum    VARCHAR(64)  DEFAULT '' COMMENT 'SHA-256校验(21CFR Part11)',
    create_time DATETIME     DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_user_id (user_id),
    KEY idx_create_time (create_time),
    KEY idx_module (module)
) COMMENT='操作审计日志(21 CFR Part 11)';

-- ============================================================
-- 基础档案
-- ============================================================

-- 计量单位表
CREATE TABLE IF NOT EXISTS base_unit (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    unit_code   VARCHAR(30)  NOT NULL,
    unit_name   VARCHAR(50)  NOT NULL,
    status      TINYINT      DEFAULT 1,
    deleted     TINYINT      DEFAULT 0,
    create_time DATETIME     DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_unit_code (unit_code)
) COMMENT='计量单位';

-- 车间档案
CREATE TABLE IF NOT EXISTS base_workshop (
    id           BIGINT      NOT NULL AUTO_INCREMENT,
    workshop_code VARCHAR(30) NOT NULL COMMENT '车间编码',
    workshop_name VARCHAR(100) NOT NULL COMMENT '车间名称',
    factory_code  VARCHAR(20) NOT NULL COMMENT '所属工厂',
    workshop_type VARCHAR(30) DEFAULT '' COMMENT '车间类型:固体/软胶囊/液体',
    manager       VARCHAR(50) DEFAULT '',
    status        TINYINT     DEFAULT 1,
    deleted       TINYINT     DEFAULT 0,
    create_time   DATETIME    DEFAULT CURRENT_TIMESTAMP,
    update_time   DATETIME    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_workshop_code (workshop_code)
) COMMENT='车间档案';

-- 工作中心/产线
CREATE TABLE IF NOT EXISTS base_work_center (
    id            BIGINT      NOT NULL AUTO_INCREMENT,
    wc_code       VARCHAR(30) NOT NULL COMMENT '工作中心编码',
    wc_name       VARCHAR(100) NOT NULL,
    workshop_id   BIGINT      DEFAULT NULL,
    workshop_code VARCHAR(30) DEFAULT '',
    factory_code  VARCHAR(20) DEFAULT '',
    wc_type       VARCHAR(30) DEFAULT '' COMMENT '产线类型',
    capacity      DECIMAL(10,2) DEFAULT 0 COMMENT '产能',
    status        TINYINT     DEFAULT 1,
    deleted       TINYINT     DEFAULT 0,
    create_time   DATETIME    DEFAULT CURRENT_TIMESTAMP,
    update_time   DATETIME    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_wc_code (wc_code)
) COMMENT='工作中心';

-- 班组
CREATE TABLE IF NOT EXISTS base_team (
    id           BIGINT      NOT NULL AUTO_INCREMENT,
    team_code    VARCHAR(30) NOT NULL,
    team_name    VARCHAR(100) NOT NULL,
    workshop_id  BIGINT      DEFAULT NULL,
    factory_code VARCHAR(20) DEFAULT '',
    leader_id    BIGINT      DEFAULT NULL COMMENT '班长',
    status       TINYINT     DEFAULT 1,
    deleted      TINYINT     DEFAULT 0,
    create_time  DATETIME    DEFAULT CURRENT_TIMESTAMP,
    update_time  DATETIME    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_team_code (team_code)
) COMMENT='班组';

-- 员工档案
CREATE TABLE IF NOT EXISTS base_employee (
    id           BIGINT      NOT NULL AUTO_INCREMENT,
    emp_no       VARCHAR(30) NOT NULL COMMENT '员工编号',
    emp_name     VARCHAR(50) NOT NULL COMMENT '姓名',
    factory_code VARCHAR(20) DEFAULT '',
    workshop_id  BIGINT      DEFAULT NULL,
    team_id      BIGINT      DEFAULT NULL,
    emp_type     VARCHAR(20) DEFAULT '正式' COMMENT '正式/临时',
    position     VARCHAR(50) DEFAULT '' COMMENT '岗位',
    phone        VARCHAR(20) DEFAULT '',
    status       TINYINT     DEFAULT 1,
    deleted      TINYINT     DEFAULT 0,
    create_time  DATETIME    DEFAULT CURRENT_TIMESTAMP,
    update_time  DATETIME    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_emp_no (emp_no)
) COMMENT='员工档案';

-- ============================================================
-- 物料与BOM
-- ============================================================

-- 物料分类
CREATE TABLE IF NOT EXISTS base_material_category (
    id           BIGINT      NOT NULL AUTO_INCREMENT,
    parent_id    BIGINT      DEFAULT 0,
    cat_code     VARCHAR(30) NOT NULL,
    cat_name     VARCHAR(100) NOT NULL,
    sort_no      INT         DEFAULT 0,
    status       TINYINT     DEFAULT 1,
    deleted      TINYINT     DEFAULT 0,
    create_time  DATETIME    DEFAULT CURRENT_TIMESTAMP,
    update_time  DATETIME    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) COMMENT='物料分类';

-- 物料档案
CREATE TABLE IF NOT EXISTS base_material (
    id              BIGINT      NOT NULL AUTO_INCREMENT,
    material_code   VARCHAR(50) NOT NULL COMMENT '物料编码',
    material_name   VARCHAR(200) NOT NULL COMMENT '物料名称',
    category_id     BIGINT      DEFAULT NULL,
    material_type   VARCHAR(30) DEFAULT '' COMMENT '原料/辅料/包材/半成品/成品',
    spec            VARCHAR(200) DEFAULT '' COMMENT '规格',
    unit_id         BIGINT      DEFAULT NULL,
    unit_name       VARCHAR(30) DEFAULT '',
    brand           VARCHAR(100) DEFAULT '',
    supplier        VARCHAR(200) DEFAULT '',
    shelf_life      INT         DEFAULT 0 COMMENT '保质期(天)',
    storage_cond    VARCHAR(100) DEFAULT '' COMMENT '储存条件',
    min_stock       DECIMAL(18,4) DEFAULT 0,
    max_stock       DECIMAL(18,4) DEFAULT 0,
    status          TINYINT     DEFAULT 1,
    deleted         TINYINT     DEFAULT 0,
    create_time     DATETIME    DEFAULT CURRENT_TIMESTAMP,
    update_time     DATETIME    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    create_by       VARCHAR(50) DEFAULT '',
    update_by       VARCHAR(50) DEFAULT '',
    PRIMARY KEY (id),
    UNIQUE KEY uk_material_code (material_code)
) COMMENT='物料档案';

-- 产品系列
CREATE TABLE IF NOT EXISTS base_product_series (
    id           BIGINT      NOT NULL AUTO_INCREMENT,
    series_code  VARCHAR(30) NOT NULL,
    series_name  VARCHAR(100) NOT NULL,
    description  TEXT        COMMENT '系列说明',
    status       TINYINT     DEFAULT 1,
    deleted      TINYINT     DEFAULT 0,
    create_time  DATETIME    DEFAULT CURRENT_TIMESTAMP,
    update_time  DATETIME    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) COMMENT='产品系列';

-- BOM主表
CREATE TABLE IF NOT EXISTS base_bom (
    id              BIGINT      NOT NULL AUTO_INCREMENT,
    bom_code        VARCHAR(50) NOT NULL,
    bom_version     VARCHAR(20) DEFAULT '1.00',
    material_id     BIGINT      NOT NULL COMMENT '产品物料ID',
    material_code   VARCHAR(50) DEFAULT '',
    material_name   VARCHAR(200) DEFAULT '',
    batch_size      DECIMAL(18,4) DEFAULT 1000 COMMENT '批次量',
    batch_unit      VARCHAR(30) DEFAULT '',
    bom_status      VARCHAR(20) DEFAULT 'DRAFT' COMMENT 'DRAFT/ACTIVE/OBSOLETE',
    effective_date  DATE        DEFAULT NULL,
    expiry_date     DATE        DEFAULT NULL,
    deleted         TINYINT     DEFAULT 0,
    create_time     DATETIME    DEFAULT CURRENT_TIMESTAMP,
    update_time     DATETIME    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    create_by       VARCHAR(50) DEFAULT '',
    PRIMARY KEY (id),
    UNIQUE KEY uk_bom_code_ver (bom_code, bom_version)
) COMMENT='BOM主表';

-- BOM明细
CREATE TABLE IF NOT EXISTS base_bom_detail (
    id              BIGINT      NOT NULL AUTO_INCREMENT,
    bom_id          BIGINT      NOT NULL,
    line_no         INT         DEFAULT 0 COMMENT '行号',
    material_id     BIGINT      NOT NULL,
    material_code   VARCHAR(50) DEFAULT '',
    material_name   VARCHAR(200) DEFAULT '',
    material_type   VARCHAR(30) DEFAULT '',
    qty             DECIMAL(18,4) NOT NULL COMMENT '用量',
    unit_id         BIGINT      DEFAULT NULL,
    unit_name       VARCHAR(30) DEFAULT '',
    loss_rate       DECIMAL(10,4) DEFAULT 0 COMMENT '损耗率%',
    process_step    VARCHAR(50) DEFAULT '' COMMENT '工序',
    is_key_material TINYINT     DEFAULT 0 COMMENT '是否关键物料',
    deleted         TINYINT     DEFAULT 0,
    create_time     DATETIME    DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_bom_id (bom_id)
) COMMENT='BOM明细';

-- ============================================================
-- 工艺路线
-- ============================================================

-- 工序档案
CREATE TABLE IF NOT EXISTS base_operation (
    id              BIGINT      NOT NULL AUTO_INCREMENT,
    op_code         VARCHAR(30) NOT NULL COMMENT '工序编码',
    op_name         VARCHAR(100) NOT NULL COMMENT '工序名称',
    op_type         VARCHAR(30) DEFAULT '' COMMENT '工序类型',
    factory_code    VARCHAR(20) DEFAULT '',
    workshop_type   VARCHAR(30) DEFAULT '' COMMENT '适用车间类型',
    std_time        DECIMAL(10,2) DEFAULT 0 COMMENT '标准工时(分钟)',
    description     TEXT,
    status          TINYINT     DEFAULT 1,
    deleted         TINYINT     DEFAULT 0,
    create_time     DATETIME    DEFAULT CURRENT_TIMESTAMP,
    update_time     DATETIME    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_op_code (op_code)
) COMMENT='工序档案';

-- 工艺路线主表
CREATE TABLE IF NOT EXISTS base_process_routing (
    id              BIGINT      NOT NULL AUTO_INCREMENT,
    route_code      VARCHAR(50) NOT NULL COMMENT '路线编码',
    route_name      VARCHAR(100) NOT NULL,
    material_id     BIGINT      DEFAULT NULL COMMENT '适用产品',
    factory_code    VARCHAR(20) DEFAULT '',
    workshop_type   VARCHAR(30) DEFAULT '',
    route_status    VARCHAR(20) DEFAULT 'ACTIVE' COMMENT 'ACTIVE/INACTIVE',
    version         VARCHAR(20) DEFAULT '1.0',
    effective_date  DATE        DEFAULT NULL,
    deleted         TINYINT     DEFAULT 0,
    create_time     DATETIME    DEFAULT CURRENT_TIMESTAMP,
    update_time     DATETIME    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_route_code (route_code)
) COMMENT='工艺路线';

-- 路线工序步骤
CREATE TABLE IF NOT EXISTS base_routing_step (
    id              BIGINT      NOT NULL AUTO_INCREMENT,
    route_id        BIGINT      NOT NULL,
    step_no         INT         DEFAULT 0 COMMENT '工序步骤号',
    op_id           BIGINT      NOT NULL,
    op_code         VARCHAR(30) DEFAULT '',
    op_name         VARCHAR(100) DEFAULT '',
    wc_id           BIGINT      DEFAULT NULL COMMENT '工作中心',
    std_time        DECIMAL(10,2) DEFAULT 0,
    is_key_step     TINYINT     DEFAULT 0 COMMENT '是否关键工序',
    require_qc      TINYINT     DEFAULT 0 COMMENT '是否需要质检',
    require_ebr     TINYINT     DEFAULT 1 COMMENT '是否需要电子批记录',
    deleted         TINYINT     DEFAULT 0,
    PRIMARY KEY (id),
    KEY idx_route_id (route_id)
) COMMENT='路线工序步骤';

-- ============================================================
-- M01 计划管理
-- ============================================================

-- 生产计划/工单主表
CREATE TABLE IF NOT EXISTS mes_work_order (
    id              BIGINT      NOT NULL AUTO_INCREMENT,
    wo_code         VARCHAR(50) NOT NULL COMMENT '工单号',
    erp_task_id     VARCHAR(50) DEFAULT '' COMMENT 'ERP任务ID',
    factory_code    VARCHAR(20) NOT NULL COMMENT '工厂编码',
    workshop_code   VARCHAR(30) DEFAULT '',
    product_code    VARCHAR(50) NOT NULL COMMENT '产品编码',
    product_name    VARCHAR(200) DEFAULT '',
    batch_no        VARCHAR(50) NOT NULL COMMENT '生产批号',
    bom_id          BIGINT      DEFAULT NULL COMMENT 'BOM ID',
    bom_version     VARCHAR(20) DEFAULT '',
    route_id        BIGINT      DEFAULT NULL COMMENT '工艺路线ID',
    route_code      VARCHAR(50) DEFAULT '',
    plan_qty        DECIMAL(18,4) NOT NULL COMMENT '计划数量',
    actual_qty      DECIMAL(18,4) DEFAULT 0 COMMENT '实际数量',
    unit_name       VARCHAR(30) DEFAULT '',
    wo_status       TINYINT     DEFAULT 1 COMMENT '1待执行 2执行中 3待检 4检验中 5完成 6关闭 7暂停',
    order_type      VARCHAR(20) DEFAULT 'NORMAL' COMMENT 'NORMAL/URGENT/RD',
    channel_type    VARCHAR(20) DEFAULT '' COMMENT '渠道:EC/OFFLINE/OEM/CLINIC/RD',
    priority        TINYINT     DEFAULT 3 COMMENT 'P0-P5优先级',
    plan_start      DATETIME    DEFAULT NULL COMMENT '计划开始',
    plan_end        DATETIME    DEFAULT NULL COMMENT '计划结束',
    actual_start    DATETIME    DEFAULT NULL COMMENT '实际开始',
    actual_end      DATETIME    DEFAULT NULL COMMENT '实际结束',
    remark          VARCHAR(500) DEFAULT '',
    deleted         TINYINT     DEFAULT 0,
    create_time     DATETIME    DEFAULT CURRENT_TIMESTAMP,
    update_time     DATETIME    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    create_by       VARCHAR(50) DEFAULT '',
    update_by       VARCHAR(50) DEFAULT '',
    PRIMARY KEY (id),
    UNIQUE KEY uk_wo_code (wo_code),
    KEY idx_batch_no (batch_no),
    KEY idx_wo_status (wo_status),
    KEY idx_factory_code (factory_code),
    KEY idx_plan_start (plan_start)
) COMMENT='生产工单';

-- ============================================================
-- M02 生产执行
-- ============================================================

-- 工序任务单（流转单）
CREATE TABLE IF NOT EXISTS mes_task_order (
    id              BIGINT      NOT NULL AUTO_INCREMENT,
    task_code       VARCHAR(50) NOT NULL COMMENT '任务单号',
    wo_id           BIGINT      NOT NULL COMMENT '工单ID',
    wo_code         VARCHAR(50) DEFAULT '',
    step_id         BIGINT      NOT NULL COMMENT '路线步骤ID',
    step_no         INT         DEFAULT 0,
    op_id           BIGINT      DEFAULT NULL,
    op_code         VARCHAR(30) DEFAULT '',
    op_name         VARCHAR(100) DEFAULT '',
    wc_id           BIGINT      DEFAULT NULL,
    team_id         BIGINT      DEFAULT NULL,
    plan_qty        DECIMAL(18,4) DEFAULT 0,
    actual_qty      DECIMAL(18,4) DEFAULT 0,
    scrap_qty       DECIMAL(18,4) DEFAULT 0,
    task_status     TINYINT     DEFAULT 1 COMMENT '1待分配 2进行中 3完成 4异常',
    plan_start      DATETIME    DEFAULT NULL,
    plan_end        DATETIME    DEFAULT NULL,
    actual_start    DATETIME    DEFAULT NULL,
    actual_end      DATETIME    DEFAULT NULL,
    operator_id     BIGINT      DEFAULT NULL COMMENT '操作人',
    operator_name   VARCHAR(50) DEFAULT '',
    remark          VARCHAR(500) DEFAULT '',
    deleted         TINYINT     DEFAULT 0,
    create_time     DATETIME    DEFAULT CURRENT_TIMESTAMP,
    update_time     DATETIME    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_task_code (task_code),
    KEY idx_wo_id (wo_id),
    KEY idx_task_status (task_status)
) COMMENT='工序任务单';

-- 报工记录
CREATE TABLE IF NOT EXISTS mes_report_record (
    id              BIGINT      NOT NULL AUTO_INCREMENT,
    task_id         BIGINT      NOT NULL COMMENT '任务单ID',
    wo_id           BIGINT      NOT NULL,
    wo_code         VARCHAR(50) DEFAULT '',
    op_code         VARCHAR(30) DEFAULT '',
    op_name         VARCHAR(100) DEFAULT '',
    report_qty      DECIMAL(18,4) DEFAULT 0 COMMENT '报工数量',
    scrap_qty       DECIMAL(18,4) DEFAULT 0 COMMENT '报废数量',
    report_time     DATETIME    DEFAULT CURRENT_TIMESTAMP COMMENT '报工时间',
    operator_id     BIGINT      DEFAULT NULL,
    operator_name   VARCHAR(50) DEFAULT '',
    scan_code       VARCHAR(100) DEFAULT '' COMMENT '扫描码',
    remark          VARCHAR(300) DEFAULT '',
    deleted         TINYINT     DEFAULT 0,
    create_time     DATETIME    DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_task_id (task_id),
    KEY idx_wo_id (wo_id)
) COMMENT='报工记录';

-- 生产前确认清单
CREATE TABLE IF NOT EXISTS mes_pre_confirm (
    id              BIGINT      NOT NULL AUTO_INCREMENT,
    wo_id           BIGINT      NOT NULL,
    task_id         BIGINT      DEFAULT NULL,
    confirm_type    VARCHAR(20) DEFAULT 'PRE' COMMENT 'PRE=开线前 CLEAN=清场',
    check_items     JSON        COMMENT '检查项目JSON',
    all_passed      TINYINT     DEFAULT 0 COMMENT '0未完成 1全部通过',
    operator_id     BIGINT      DEFAULT NULL,
    operator_name   VARCHAR(50) DEFAULT '',
    confirm_time    DATETIME    DEFAULT NULL,
    deleted         TINYINT     DEFAULT 0,
    create_time     DATETIME    DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_wo_id (wo_id)
) COMMENT='生产前确认清单';

-- 异常/偏差记录
CREATE TABLE IF NOT EXISTS mes_deviation (
    id              BIGINT      NOT NULL AUTO_INCREMENT,
    deviation_code  VARCHAR(50) NOT NULL COMMENT '偏差编号',
    wo_id           BIGINT      DEFAULT NULL,
    task_id         BIGINT      DEFAULT NULL,
    batch_no        VARCHAR(50) DEFAULT '',
    deviation_type  VARCHAR(30) DEFAULT '' COMMENT '类型:设备/物料/工艺/环境',
    severity        VARCHAR(20) DEFAULT 'MINOR' COMMENT 'MINOR/MAJOR/CRITICAL',
    description     TEXT        COMMENT '偏差描述',
    root_cause      TEXT        COMMENT '根本原因',
    capa            TEXT        COMMENT '纠正预防措施',
    status          VARCHAR(20) DEFAULT 'OPEN' COMMENT 'OPEN/CLOSED',
    reporter_id     BIGINT      DEFAULT NULL,
    reporter_name   VARCHAR(50) DEFAULT '',
    handler_id      BIGINT      DEFAULT NULL,
    handler_name    VARCHAR(50) DEFAULT '',
    close_time      DATETIME    DEFAULT NULL,
    deleted         TINYINT     DEFAULT 0,
    create_time     DATETIME    DEFAULT CURRENT_TIMESTAMP,
    update_time     DATETIME    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_deviation_code (deviation_code)
) COMMENT='偏差记录';

-- ============================================================
-- M03 质量管理
-- ============================================================

-- 检验项目
CREATE TABLE IF NOT EXISTS qms_inspection_item (
    id              BIGINT      NOT NULL AUTO_INCREMENT,
    item_code       VARCHAR(50) NOT NULL,
    item_name       VARCHAR(100) NOT NULL,
    item_type       VARCHAR(30) DEFAULT '' COMMENT '类型:计量/计数/感官',
    unit_name       VARCHAR(30) DEFAULT '',
    spec_min        DECIMAL(18,4) DEFAULT NULL COMMENT '规格下限',
    spec_max        DECIMAL(18,4) DEFAULT NULL COMMENT '规格上限',
    spec_text       VARCHAR(200) DEFAULT '' COMMENT '文字规格',
    test_method     VARCHAR(200) DEFAULT '' COMMENT '检测方法',
    status          TINYINT     DEFAULT 1,
    deleted         TINYINT     DEFAULT 0,
    create_time     DATETIME    DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_item_code (item_code)
) COMMENT='检验项目';

-- 质检方案
CREATE TABLE IF NOT EXISTS qms_qc_scheme (
    id              BIGINT      NOT NULL AUTO_INCREMENT,
    scheme_code     VARCHAR(50) NOT NULL,
    scheme_name     VARCHAR(100) NOT NULL,
    material_id     BIGINT      DEFAULT NULL COMMENT '适用物料',
    material_code   VARCHAR(50) DEFAULT '',
    check_type      TINYINT     NOT NULL COMMENT '1=来料IQC 2=过程IPQC 3=成品FQC 4=在线 5=清洁',
    status          TINYINT     DEFAULT 1,
    deleted         TINYINT     DEFAULT 0,
    create_time     DATETIME    DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) COMMENT='质检方案';

-- 质检方案明细
CREATE TABLE IF NOT EXISTS qms_qc_scheme_detail (
    id              BIGINT      NOT NULL AUTO_INCREMENT,
    scheme_id       BIGINT      NOT NULL,
    item_id         BIGINT      NOT NULL,
    item_code       VARCHAR(50) DEFAULT '',
    item_name       VARCHAR(100) DEFAULT '',
    spec_min        DECIMAL(18,4) DEFAULT NULL,
    spec_max        DECIMAL(18,4) DEFAULT NULL,
    spec_text       VARCHAR(200) DEFAULT '',
    is_required     TINYINT     DEFAULT 1,
    sort_no         INT         DEFAULT 0,
    PRIMARY KEY (id),
    KEY idx_scheme_id (scheme_id)
) COMMENT='质检方案明细';

-- 检验任务单
CREATE TABLE IF NOT EXISTS qms_inspection_order (
    id              BIGINT      NOT NULL AUTO_INCREMENT,
    io_code         VARCHAR(50) NOT NULL COMMENT '检验单号',
    io_type         TINYINT     NOT NULL COMMENT '1=IQC 2=IPQC 3=FQC 4=在线 5=清洁',
    wo_id           BIGINT      DEFAULT NULL,
    wo_code         VARCHAR(50) DEFAULT '',
    batch_no        VARCHAR(50) DEFAULT '',
    material_id     BIGINT      DEFAULT NULL,
    material_code   VARCHAR(50) DEFAULT '',
    material_name   VARCHAR(200) DEFAULT '',
    lot_id          BIGINT      DEFAULT NULL COMMENT '物料批次ID',
    scheme_id       BIGINT      DEFAULT NULL,
    sample_qty      DECIMAL(18,4) DEFAULT 0 COMMENT '取样数量',
    io_status       TINYINT     DEFAULT 1 COMMENT '1待检 2检验中 3完成',
    overall_result  VARCHAR(20) DEFAULT NULL COMMENT 'PASS/FAIL/CONDITIONAL',
    coa_path        VARCHAR(255) DEFAULT '' COMMENT 'COA报告路径',
    inspector_id    BIGINT      DEFAULT NULL,
    inspector_name  VARCHAR(50) DEFAULT '',
    reviewer_id     BIGINT      DEFAULT NULL,
    reviewer_name   VARCHAR(50) DEFAULT '',
    inspect_time    DATETIME    DEFAULT NULL,
    remark          VARCHAR(500) DEFAULT '',
    deleted         TINYINT     DEFAULT 0,
    create_time     DATETIME    DEFAULT CURRENT_TIMESTAMP,
    update_time     DATETIME    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_io_code (io_code),
    KEY idx_wo_id (wo_id),
    KEY idx_io_type (io_type),
    KEY idx_io_status (io_status)
) COMMENT='检验任务单';

-- 检验结果明细
CREATE TABLE IF NOT EXISTS qms_inspection_result (
    id              BIGINT      NOT NULL AUTO_INCREMENT,
    io_id           BIGINT      NOT NULL,
    item_id         BIGINT      NOT NULL,
    item_code       VARCHAR(50) DEFAULT '',
    item_name       VARCHAR(100) DEFAULT '',
    actual_value    VARCHAR(100) DEFAULT '' COMMENT '实测值',
    spec_min        DECIMAL(18,4) DEFAULT NULL,
    spec_max        DECIMAL(18,4) DEFAULT NULL,
    spec_text       VARCHAR(200) DEFAULT '',
    is_pass         TINYINT     DEFAULT NULL COMMENT '1=合格 0=不合格',
    remark          VARCHAR(200) DEFAULT '',
    create_time     DATETIME    DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_io_id (io_id)
) COMMENT='检验结果明细';

-- 不合格品记录
CREATE TABLE IF NOT EXISTS qms_nonconformance (
    id              BIGINT      NOT NULL AUTO_INCREMENT,
    nc_code         VARCHAR(50) NOT NULL COMMENT 'NC编号',
    wo_id           BIGINT      DEFAULT NULL,
    io_id           BIGINT      DEFAULT NULL,
    batch_no        VARCHAR(50) DEFAULT '',
    material_code   VARCHAR(50) DEFAULT '',
    material_name   VARCHAR(200) DEFAULT '',
    nc_qty          DECIMAL(18,4) DEFAULT 0,
    nc_reason       TEXT        COMMENT '不合格原因',
    disposition     VARCHAR(30) DEFAULT '' COMMENT '处置方式:返工/报废/让步',
    status          VARCHAR(20) DEFAULT 'OPEN',
    deviation_id    BIGINT      DEFAULT NULL COMMENT '关联偏差',
    deleted         TINYINT     DEFAULT 0,
    create_time     DATETIME    DEFAULT CURRENT_TIMESTAMP,
    update_time     DATETIME    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_nc_code (nc_code)
) COMMENT='不合格品记录';

-- ============================================================
-- M04 电子批记录(EBR)
-- ============================================================

-- 批记录主表
CREATE TABLE IF NOT EXISTS ebr_batch_record (
    id              BIGINT      NOT NULL AUTO_INCREMENT,
    ebr_code        VARCHAR(50) NOT NULL COMMENT '批记录编号',
    wo_id           BIGINT      NOT NULL,
    wo_code         VARCHAR(50) DEFAULT '',
    batch_no        VARCHAR(50) NOT NULL,
    product_code    VARCHAR(50) DEFAULT '',
    product_name    VARCHAR(200) DEFAULT '',
    factory_code    VARCHAR(20) DEFAULT '',
    plan_qty        DECIMAL(18,4) DEFAULT 0,
    actual_qty      DECIMAL(18,4) DEFAULT 0,
    material_balance_rate DECIMAL(8,4) DEFAULT NULL COMMENT '物料平衡率% (96~102)',
    yield_rate      DECIMAL(8,4) DEFAULT NULL COMMENT '成品率% (96~100)',
    ebr_status      VARCHAR(20) DEFAULT 'DRAFT' COMMENT 'DRAFT/REVIEWING/SIGNED/ARCHIVED',
    operator_sign   VARCHAR(50) DEFAULT '' COMMENT '操作者电子签名',
    operator_sign_time DATETIME DEFAULT NULL,
    reviewer_sign   VARCHAR(50) DEFAULT '' COMMENT '复核者签名',
    reviewer_sign_time DATETIME DEFAULT NULL,
    qa_sign         VARCHAR(50) DEFAULT '' COMMENT 'QA签名',
    qa_sign_time    DATETIME    DEFAULT NULL,
    archive_time    DATETIME    DEFAULT NULL,
    deleted         TINYINT     DEFAULT 0,
    create_time     DATETIME    DEFAULT CURRENT_TIMESTAMP,
    update_time     DATETIME    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_ebr_code (ebr_code),
    KEY idx_wo_id (wo_id),
    KEY idx_batch_no (batch_no)
) COMMENT='电子批记录主表';

-- 批记录工序明细
CREATE TABLE IF NOT EXISTS ebr_step_record (
    id              BIGINT      NOT NULL AUTO_INCREMENT,
    ebr_id          BIGINT      NOT NULL,
    task_id         BIGINT      DEFAULT NULL,
    step_no         INT         DEFAULT 0,
    op_code         VARCHAR(30) DEFAULT '',
    op_name         VARCHAR(100) DEFAULT '',
    params          JSON        COMMENT '工艺参数JSON',
    operator_id     BIGINT      DEFAULT NULL,
    operator_name   VARCHAR(50) DEFAULT '',
    start_time      DATETIME    DEFAULT NULL,
    end_time        DATETIME    DEFAULT NULL,
    step_status     VARCHAR(20) DEFAULT 'PENDING',
    remark          VARCHAR(500) DEFAULT '',
    create_time     DATETIME    DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_ebr_id (ebr_id)
) COMMENT='批记录工序明细';

-- 物料平衡记录
CREATE TABLE IF NOT EXISTS ebr_material_balance (
    id              BIGINT      NOT NULL AUTO_INCREMENT,
    ebr_id          BIGINT      NOT NULL,
    batch_no        VARCHAR(50) DEFAULT '',
    material_id     BIGINT      NOT NULL,
    material_code   VARCHAR(50) DEFAULT '',
    material_name   VARCHAR(200) DEFAULT '',
    theoretical_qty DECIMAL(18,4) DEFAULT 0 COMMENT '理论用量',
    actual_input    DECIMAL(18,4) DEFAULT 0 COMMENT '实际投入',
    actual_output   DECIMAL(18,4) DEFAULT 0 COMMENT '实际产出',
    waste_qty       DECIMAL(18,4) DEFAULT 0 COMMENT '废弃量',
    balance_rate    DECIMAL(8,4) DEFAULT NULL COMMENT '平衡率%',
    is_pass         TINYINT     DEFAULT NULL COMMENT '1=在范围内 0=超范围',
    remark          VARCHAR(300) DEFAULT '',
    create_time     DATETIME    DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_ebr_id (ebr_id)
) COMMENT='物料平衡记录';

-- 设备使用记录(EBR关联)
CREATE TABLE IF NOT EXISTS ebr_equipment_usage (
    id              BIGINT      NOT NULL AUTO_INCREMENT,
    ebr_id          BIGINT      NOT NULL,
    task_id         BIGINT      DEFAULT NULL,
    equipment_id    BIGINT      NOT NULL,
    equipment_code  VARCHAR(30) DEFAULT '',
    equipment_name  VARCHAR(100) DEFAULT '',
    use_start       DATETIME    DEFAULT NULL,
    use_end         DATETIME    DEFAULT NULL,
    clean_status    TINYINT     DEFAULT 0 COMMENT '0未清洁 1已清洁',
    clean_by        VARCHAR(50) DEFAULT '',
    clean_time      DATETIME    DEFAULT NULL,
    operator_name   VARCHAR(50) DEFAULT '',
    create_time     DATETIME    DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_ebr_id (ebr_id)
) COMMENT='设备使用记录';

-- ============================================================
-- M05 物料仓储
-- ============================================================

-- 仓库/库区
CREATE TABLE IF NOT EXISTS wms_warehouse (
    id              BIGINT      NOT NULL AUTO_INCREMENT,
    wh_code         VARCHAR(30) NOT NULL,
    wh_name         VARCHAR(100) NOT NULL,
    factory_code    VARCHAR(20) DEFAULT '',
    wh_type         VARCHAR(20) DEFAULT '' COMMENT 'RAW/SEMI/FINISH/WIP/SIDE',
    status          TINYINT     DEFAULT 1,
    deleted         TINYINT     DEFAULT 0,
    create_time     DATETIME    DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_wh_code (wh_code)
) COMMENT='仓库档案';

-- 库位
CREATE TABLE IF NOT EXISTS wms_location (
    id              BIGINT      NOT NULL AUTO_INCREMENT,
    location_code   VARCHAR(50) NOT NULL,
    location_name   VARCHAR(100) DEFAULT '',
    warehouse_id    BIGINT      NOT NULL,
    wh_code         VARCHAR(30) DEFAULT '',
    row_no          VARCHAR(10) DEFAULT '',
    col_no          VARCHAR(10) DEFAULT '',
    layer_no        VARCHAR(10) DEFAULT '',
    status          TINYINT     DEFAULT 1,
    deleted         TINYINT     DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY uk_location_code (location_code)
) COMMENT='库位';

-- 物料批次(库存)
CREATE TABLE IF NOT EXISTS wms_material_lot (
    id              BIGINT      NOT NULL AUTO_INCREMENT,
    lot_code        VARCHAR(50) NOT NULL COMMENT '批次号',
    material_id     BIGINT      NOT NULL,
    material_code   VARCHAR(50) DEFAULT '',
    material_name   VARCHAR(200) DEFAULT '',
    vendor_batch    VARCHAR(50) DEFAULT '' COMMENT '供应商批号',
    lot_type        TINYINT     DEFAULT 1 COMMENT '1=原料 2=半成品 3=成品',
    qty_total       DECIMAL(18,4) DEFAULT 0 COMMENT '总数量',
    qty_available   DECIMAL(18,4) DEFAULT 0 COMMENT '可用量',
    qty_reserved    DECIMAL(18,4) DEFAULT 0 COMMENT '已预留',
    qty_consumed    DECIMAL(18,4) DEFAULT 0 COMMENT '已消耗',
    unit_name       VARCHAR(30) DEFAULT '',
    location_id     BIGINT      DEFAULT NULL,
    location_code   VARCHAR(50) DEFAULT '',
    warehouse_code  VARCHAR(30) DEFAULT '',
    lot_status      TINYINT     DEFAULT 1 COMMENT '1待检 2合格 3冻结 4不合格 5已消耗',
    mfg_date        DATE        DEFAULT NULL COMMENT '生产日期',
    exp_date        DATE        DEFAULT NULL COMMENT '有效期',
    receipt_date    DATE        DEFAULT NULL COMMENT '入库日期',
    supplier        VARCHAR(200) DEFAULT '',
    wo_id           BIGINT      DEFAULT NULL COMMENT '关联工单(半成品/成品)',
    deleted         TINYINT     DEFAULT 0,
    create_time     DATETIME    DEFAULT CURRENT_TIMESTAMP,
    update_time     DATETIME    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_lot_code (lot_code),
    KEY idx_material_id (material_id),
    KEY idx_lot_status (lot_status),
    KEY idx_wo_id (wo_id)
) COMMENT='物料批次(库存)';

-- 物料发料单
CREATE TABLE IF NOT EXISTS wms_issuance (
    id              BIGINT      NOT NULL AUTO_INCREMENT,
    issue_code      VARCHAR(50) NOT NULL COMMENT '发料单号',
    wo_id           BIGINT      NOT NULL,
    wo_code         VARCHAR(50) DEFAULT '',
    issue_type      VARCHAR(20) DEFAULT 'NORMAL' COMMENT 'NORMAL/BACK',
    issue_status    TINYINT     DEFAULT 1 COMMENT '1待发 2已发 3部分 4关闭',
    plan_date       DATE        DEFAULT NULL,
    actual_date     DATE        DEFAULT NULL,
    operator_id     BIGINT      DEFAULT NULL,
    operator_name   VARCHAR(50) DEFAULT '',
    deleted         TINYINT     DEFAULT 0,
    create_time     DATETIME    DEFAULT CURRENT_TIMESTAMP,
    update_time     DATETIME    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_issue_code (issue_code),
    KEY idx_wo_id (wo_id)
) COMMENT='物料发料单';

-- 发料明细
CREATE TABLE IF NOT EXISTS wms_issuance_detail (
    id              BIGINT      NOT NULL AUTO_INCREMENT,
    issue_id        BIGINT      NOT NULL,
    material_id     BIGINT      NOT NULL,
    material_code   VARCHAR(50) DEFAULT '',
    material_name   VARCHAR(200) DEFAULT '',
    lot_id          BIGINT      DEFAULT NULL,
    lot_code        VARCHAR(50) DEFAULT '',
    plan_qty        DECIMAL(18,4) DEFAULT 0,
    actual_qty      DECIMAL(18,4) DEFAULT 0,
    unit_name       VARCHAR(30) DEFAULT '',
    detail_status   TINYINT     DEFAULT 1,
    create_time     DATETIME    DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_issue_id (issue_id)
) COMMENT='发料明细';

-- 库存流水
CREATE TABLE IF NOT EXISTS wms_inventory_log (
    id              BIGINT      NOT NULL AUTO_INCREMENT,
    lot_id          BIGINT      NOT NULL,
    lot_code        VARCHAR(50) DEFAULT '',
    material_code   VARCHAR(50) DEFAULT '',
    trans_type      VARCHAR(30) NOT NULL COMMENT 'IN/OUT/ADJUST/TRANSFER/CONSUME/RETURN',
    qty_change      DECIMAL(18,4) NOT NULL COMMENT '变化量(正入负出)',
    qty_before      DECIMAL(18,4) DEFAULT 0,
    qty_after       DECIMAL(18,4) DEFAULT 0,
    ref_code        VARCHAR(50) DEFAULT '' COMMENT '关联单号',
    ref_type        VARCHAR(20) DEFAULT '' COMMENT '关联类型',
    operator_id     BIGINT      DEFAULT NULL,
    operator_name   VARCHAR(50) DEFAULT '',
    remark          VARCHAR(300) DEFAULT '',
    create_time     DATETIME    DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_lot_id (lot_id),
    KEY idx_trans_type (trans_type),
    KEY idx_create_time (create_time)
) COMMENT='库存流水';

-- ============================================================
-- M06 设备管理
-- ============================================================

-- 设备档案
CREATE TABLE IF NOT EXISTS eqp_equipment (
    id              BIGINT      NOT NULL AUTO_INCREMENT,
    eq_code         VARCHAR(30) NOT NULL COMMENT '设备编码',
    eq_name         VARCHAR(100) NOT NULL COMMENT '设备名称',
    eq_model        VARCHAR(100) DEFAULT '' COMMENT '型号规格',
    eq_type         VARCHAR(30) DEFAULT '' COMMENT '设备类型',
    factory_code    VARCHAR(20) DEFAULT '',
    workshop_id     BIGINT      DEFAULT NULL,
    wc_id           BIGINT      DEFAULT NULL,
    manufacturer    VARCHAR(100) DEFAULT '' COMMENT '制造商',
    purchase_date   DATE        DEFAULT NULL,
    install_date    DATE        DEFAULT NULL,
    rated_speed     DECIMAL(10,2) DEFAULT 0 COMMENT '额定速率',
    plc_ip          VARCHAR(50) DEFAULT '' COMMENT 'PLC IP地址',
    plc_protocol    VARCHAR(20) DEFAULT '' COMMENT 'OPC UA/Modbus TCP',
    plc_config      JSON        COMMENT 'PLC配置JSON',
    eq_status       VARCHAR(20) DEFAULT 'STANDBY' COMMENT 'RUN/STANDBY/STOP/FAULT/MAINTENANCE',
    oee_target      DECIMAL(8,4) DEFAULT 85.00 COMMENT 'OEE目标%',
    last_maint_date DATE        DEFAULT NULL,
    next_maint_date DATE        DEFAULT NULL,
    deleted         TINYINT     DEFAULT 0,
    create_time     DATETIME    DEFAULT CURRENT_TIMESTAMP,
    update_time     DATETIME    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_eq_code (eq_code)
) COMMENT='设备档案';

-- 设备OEE数据
CREATE TABLE IF NOT EXISTS eqp_oee_data (
    id              BIGINT      NOT NULL AUTO_INCREMENT,
    equipment_id    BIGINT      NOT NULL,
    eq_code         VARCHAR(30) DEFAULT '',
    stat_date       DATE        NOT NULL COMMENT '统计日期',
    shift           VARCHAR(20) DEFAULT '' COMMENT '班次',
    available_time  DECIMAL(10,2) DEFAULT 0 COMMENT '计划运行时间(min)',
    run_time        DECIMAL(10,2) DEFAULT 0 COMMENT '实际运行时间(min)',
    downtime        DECIMAL(10,2) DEFAULT 0 COMMENT '停机时间(min)',
    availability    DECIMAL(8,4) DEFAULT 0 COMMENT '时间开动率%',
    performance     DECIMAL(8,4) DEFAULT 0 COMMENT '性能开动率%',
    quality_rate    DECIMAL(8,4) DEFAULT 0 COMMENT '合格率%',
    oee             DECIMAL(8,4) DEFAULT 0 COMMENT 'OEE%',
    create_time     DATETIME    DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_equipment_id (equipment_id),
    KEY idx_stat_date (stat_date)
) COMMENT='设备OEE数据';

-- 设备维护计划
CREATE TABLE IF NOT EXISTS eqp_maint_plan (
    id              BIGINT      NOT NULL AUTO_INCREMENT,
    plan_code       VARCHAR(50) NOT NULL,
    equipment_id    BIGINT      NOT NULL,
    eq_code         VARCHAR(30) DEFAULT '',
    maint_type      VARCHAR(20) DEFAULT 'DAILY' COMMENT 'DAILY/WEEKLY/MONTHLY/QUARTERLY/YEARLY',
    maint_content   TEXT        COMMENT '维护内容',
    plan_date       DATE        NOT NULL,
    actual_date     DATE        DEFAULT NULL,
    maint_status    VARCHAR(20) DEFAULT 'PENDING' COMMENT 'PENDING/DONE/OVERDUE',
    maintainer_id   BIGINT      DEFAULT NULL,
    maintainer_name VARCHAR(50) DEFAULT '',
    remark          VARCHAR(300) DEFAULT '',
    deleted         TINYINT     DEFAULT 0,
    create_time     DATETIME    DEFAULT CURRENT_TIMESTAMP,
    update_time     DATETIME    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_plan_code (plan_code)
) COMMENT='设备维护计划';

-- 设备故障记录
CREATE TABLE IF NOT EXISTS eqp_fault_record (
    id              BIGINT      NOT NULL AUTO_INCREMENT,
    fault_code      VARCHAR(50) NOT NULL,
    equipment_id    BIGINT      NOT NULL,
    eq_code         VARCHAR(30) DEFAULT '',
    fault_type      VARCHAR(30) DEFAULT '' COMMENT '故障类型',
    fault_desc      TEXT        COMMENT '故障描述',
    fault_time      DATETIME    NOT NULL,
    recover_time    DATETIME    DEFAULT NULL,
    downtime_min    INT         DEFAULT 0 COMMENT '停机时长(分钟)',
    fault_status    VARCHAR(20) DEFAULT 'OPEN' COMMENT 'OPEN/REPAIRING/CLOSED',
    reporter_id     BIGINT      DEFAULT NULL,
    repairer_id     BIGINT      DEFAULT NULL,
    repair_record   TEXT,
    deleted         TINYINT     DEFAULT 0,
    create_time     DATETIME    DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_fault_code (fault_code)
) COMMENT='设备故障记录';

-- PLC采集数据
CREATE TABLE IF NOT EXISTS eqp_plc_data (
    id              BIGINT      NOT NULL AUTO_INCREMENT,
    equipment_id    BIGINT      NOT NULL,
    eq_code         VARCHAR(30) DEFAULT '',
    tag_name        VARCHAR(50) DEFAULT '' COMMENT '数据点名称',
    tag_value       VARCHAR(100) DEFAULT '' COMMENT '采集值',
    data_time       DATETIME    NOT NULL COMMENT '采集时间',
    unit            VARCHAR(20) DEFAULT '',
    create_time     DATETIME    DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_equipment_id (equipment_id),
    KEY idx_data_time (data_time)
) COMMENT='PLC采集数据';

-- 设备校验记录
CREATE TABLE IF NOT EXISTS eqp_calibration (
    id              BIGINT      NOT NULL AUTO_INCREMENT,
    cal_code        VARCHAR(50) NOT NULL,
    equipment_id    BIGINT      NOT NULL,
    eq_code         VARCHAR(30) DEFAULT '',
    cal_type        VARCHAR(30) DEFAULT '' COMMENT '校验类型',
    cal_date        DATE        NOT NULL,
    next_cal_date   DATE        DEFAULT NULL,
    cal_result      VARCHAR(20) DEFAULT 'PASS' COMMENT 'PASS/FAIL',
    cal_agency      VARCHAR(100) DEFAULT '' COMMENT '校验机构',
    cert_no         VARCHAR(50) DEFAULT '' COMMENT '证书号',
    operator_name   VARCHAR(50) DEFAULT '',
    deleted         TINYINT     DEFAULT 0,
    create_time     DATETIME    DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) COMMENT='设备校验记录';

-- ============================================================
-- M07 追溯管理
-- ============================================================

-- 批次关系追溯表
CREATE TABLE IF NOT EXISTS trc_lot_relation (
    id              BIGINT      NOT NULL AUTO_INCREMENT,
    parent_lot_id   BIGINT      NOT NULL COMMENT '上级批次ID',
    parent_lot_code VARCHAR(50) DEFAULT '',
    child_lot_id    BIGINT      NOT NULL COMMENT '下级批次ID',
    child_lot_code  VARCHAR(50) DEFAULT '',
    wo_id           BIGINT      DEFAULT NULL,
    op_code         VARCHAR(30) DEFAULT '' COMMENT '转换工序',
    qty_used        DECIMAL(18,4) DEFAULT 0,
    create_time     DATETIME    DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_parent_lot (parent_lot_id),
    KEY idx_child_lot (child_lot_id)
) COMMENT='批次追溯关系';

-- 条码关联(三级码)
CREATE TABLE IF NOT EXISTS trc_barcode_relation (
    id              BIGINT      NOT NULL AUTO_INCREMENT,
    product_code    VARCHAR(50) NOT NULL COMMENT '产品码',
    box_code        VARCHAR(50) DEFAULT '' COMMENT '箱码',
    pallet_code     VARCHAR(50) DEFAULT '' COMMENT '托盘码',
    lot_id          BIGINT      DEFAULT NULL,
    batch_no        VARCHAR(50) DEFAULT '',
    wo_id           BIGINT      DEFAULT NULL,
    create_time     DATETIME    DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_product_code (product_code),
    KEY idx_batch_no (batch_no)
) COMMENT='三级条码关联';

-- ============================================================
-- 初始数据
-- ============================================================

-- 工厂数据
INSERT IGNORE INTO sys_factory (factory_code, factory_name, address) VALUES
('NJ', '南京天美健工厂', '南京市'),
('LS', '溧水每日营养工厂', '南京市溧水区');

-- 角色数据
INSERT IGNORE INTO sys_role (role_code, role_name, description) VALUES
('PLANNER', '生产计划员', 'PC端排产与优先级管理'),
('WORKSHOP_DIRECTOR', '车间主任', '工单监控与偏差审批'),
('TEAM_LEADER', '班组长', '任务分配与确认'),
('OPERATOR', '操作员', '移动扫码与报工'),
('QA_QC', '质检人员', '检验录入与EBR签名'),
('WH_MANAGER', '仓库管理员', '物料收发与线边仓管理'),
('EQP_MANAGER', '设备管理员', '维护计划与OEE监控'),
('MANAGEMENT', '管理层', '驾驶舱查看'),
('ADMIN', '系统管理员', '系统配置与权限管理');

-- 管理员用户 (密码: Admin@2026)
INSERT IGNORE INTO sys_user (username, password, real_name, factory_code, role_code) VALUES
('admin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EH', '系统管理员', 'NJ', 'ADMIN'),
('planner01', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EH', '张计划', 'NJ', 'PLANNER'),
('qc01', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EH', '李质检', 'NJ', 'QA_QC'),
('operator01', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EH', '王操作', 'NJ', 'OPERATOR');

-- 计量单位
INSERT IGNORE INTO base_unit (unit_code, unit_name) VALUES
('PCS', '粒'), ('BOX', '盒'), ('BAG', '袋'), ('KG', '千克'), 
('G', '克'), ('MG', '毫克'), ('ML', '毫升'), ('L', '升'),
('BTL', '瓶'), ('PAL', '托'), ('CTN', '箱');

-- 车间数据
INSERT IGNORE INTO base_workshop (workshop_code, workshop_name, factory_code, workshop_type) VALUES
('NJ-SOLID', '南京固体车间', 'NJ', '固体'),
('NJ-SOFTGEL', '南京软胶囊车间', 'NJ', '软胶囊'),
('LS-SOLID', '溧水固体车间', 'LS', '固体'),
('LS-LIQUID', '溧水液体车间', 'LS', '液体');

COMMIT;

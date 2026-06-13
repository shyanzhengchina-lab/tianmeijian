# 天美健 · 保健品MES生产执行系统

医疗器械 & 保健品GMP 双模式制造执行系统（Manufacturing Execution System）

## 技术架构

```
┌─────────────────────────────────────────────────┐
│           前端 (React 18 + TypeScript)           │
│   Ant Design 5 + Axios + localStorage持久化     │
│   nginx 静态服务  端口：80                        │
└──────────────────┬──────────────────────────────┘
                   │  HTTP / REST API (/api/*)
┌──────────────────▼──────────────────────────────┐
│           后端 (Node.js + Express)              │
│   PM2 守护进程                                   │
│   端口：8088                                     │
└──────────────────┬──────────────────────────────┘
                   │  MySQL
┌──────────────────▼──────────────────────────────┐
│           数据库 (MariaDB utf8mb4)               │
│   数据库名：tmj_mes_db                           │
│   48张表，含 sys_user/base_*/qms_* 等模块        │
└─────────────────────────────────────────────────┘
```

## 已完成功能

### ✅ PAD工序执行（核心）
- **双模式切换**：医疗器械（NiTi根管锉）⟺ 保健品GMP（固体制剂）
- **9个标准阶段**：PRE_CLEAN → CHECK_IN → MAT_VERIFY → FIRST_PIECE → DATA_COLLECT → SELF_CHECK → POST_CLEAN → REPORT → CHECK_OUT
- **医疗器械工序**（VISIBLE_OPERATIONS）：OP-10～OP-110，11道工序
- **保健品GMP工序**（GMP_OPERATIONS）：称量配料/混合/制粒干燥/内包装/内包清场/外包装，6道工序
- **过程数据采集**（DataCollectStage）：按工序配置字段，含规格限值校验、mock数据
- execMap 持久化到 localStorage（`bip_pad_exec_map`）

### ✅ 批包装EBR报告（只读自动生成）
- **数据流**：PAD执行 → execMap → BatchPackagingEbrPage 自动汇总
- **7个Tab**：批次概览 / 称量配料 / 混合 / 内包装 / 外包装 / 物料平衡 / 执行时间线
- **物料平衡**：GMP规则 96.0%~102.0% 自动计算并标记 PASS/FAIL
- **空状态提示**：未执行PAD时显示正确数据流说明
- 路由：`/batch-pkg-ebr` 菜单：电子批记录 → 批包装记录(EBR)

### ✅ 电子批记录（医疗器械EBR）
- EBR列表页、增强版详情页、物料平衡表
- 从 execMap 自动 `buildEbrFromExecMap()` 生成 EBR
- EBR 状态：DRAFT → IN_PROGRESS → COMPLETED → APPROVED

### ✅ 基础数据管理
- 物料档案、BOM、工艺路线、工序档案、计量单位
- 员工、班组、设备、工作中心、车间管理
- **BOM物料清单**：6个成品BOM已入库，含53条明细（原料/辅料/包材）
- **FQC质检方案**：6套成品质检方案，共65条检验项（含spec范围值）
- QC检验项管理（含 IQC/IPQC/FQC/在线/清洁 等5类共19条方案）

### ✅ 生产计划与执行
- 工单管理（与后端联通，200 OK）
- 工艺路线管理（200 OK）
- 任务池、PAD领料执行

### ✅ 系统基础
- 登录认证（JWT Token，localStorage 存储）
- 中文编码：nginx utf-8 + MariaDB utf8mb4
- 角色：admin（系统管理员）/ op001（生产操作员）/ qc001（质量检验员）

## 关键 API 状态

| API | 状态 | 说明 |
|-----|------|------|
| `/api/auth/login` | ✅ 200 | 认证 |
| `/api/work-orders/list` | ✅ 200 | 工单列表 |
| `/api/process-routings/list` | ✅ 200 | 工艺路线 |
| `/api/routing-steps/list` | ✅ 200 | 工序步骤 |
| `/api/materials/list` | ✅ 200 | 物料列表 |
| `/api/boms/list` | ✅ 200 | BOM物料清单（6条） |
| `/api/boms/{id}/details` | ✅ 200 | BOM明细（原料/辅料/包材） |
| `/api/qc-schemes/list` | ✅ 200 | 质检方案（19条） |
| `/api/qc-schemes/{id}` | ✅ 200 | 质检方案详情+检验项 |
| `/api/float-tickets/list` | ⚠️ 404 | 流转票（后端未实现，前端已静默处理） |
| `/api/base/employee/list` | ⚠️ 404 | 员工（后端未实现） |
| `/api/base/team/list` | ⚠️ 404 | 班组（后端未实现） |
| `/api/base/equipment/list` | ⚠️ 404 | 设备（后端未实现） |

## 数据架构

### localStorage 持久化键
| Key | 内容 |
|-----|------|
| `bip_pad_exec_map` | PAD执行数据 `Record<opCode, OperationExecution>` |
| `bip_pad_selected_wo` | 当前选中工单 |
| `bip_pad_view` | 当前视图（list/execution） |
| `bip_pad_current_op_code` | 当前执行工序代码 |
| `bip_ebr_records` | EBR记录列表 |

### GMP工序 → EBR Tab 对应关系
```
OP-GMP-WEIGH    → Tab: 称量配料
OP-GMP-MIX      → Tab: 混合（RSD ≤5%）
OP-GMP-GRANULATE → 物料平衡计算
OP-GMP-INNERPACK → Tab: 内包装（每小时检查）
OP-GMP-INNERCLEAN → 批次概览 Timeline
OP-GMP-OUTERPACK → Tab: 外包装
```

## 快速启动

```bash
# 后端（已由PM2守护，通常无需手动启动）
pm2 status
pm2 restart tmj-mes-backend   # 如需重启

# 前端构建并部署
cd /home/user/webapp
GENERATE_SOURCEMAP=false CI=false npm run build
sudo nginx -s reload

# 数据库
mysql -u root -ptmj_mes_2026 tmj_mes_db
```

## 默认账号

| 账号 | 密码 | 角色 |
|------|------|------|
| admin | admin123 | 系统管理员 |
| op001 | 123456 | 生产操作员 |
| qc001 | 123456 | 质量检验员 |

## PAD演示工牌

| 工牌号 | 姓名 | 角色 |
|--------|------|------|
| 1001 | 张三 | 操作员 |
| 1002 | 李四 | 检验员 |
| 1003 | 王五 | 操作员 |
| 1004 | 赵六 | 班长 |
| 9999 | QA王 | QA |

## 待实现 / 建议下一步

- [ ] 后端实现 `/api/float-tickets/list`（流转票）
- [ ] 后端实现 `/api/base/employee/list` 等基础数据 API
- [ ] GMP工序执行完毕后，自动跳转至批包装EBR页面的引导提示
- [ ] PAD操作员登录改为真实后端用户认证（当前为 mock）
- [ ] EBR打印/导出 PDF 功能完善
- [ ] 物料平衡偏差自动触发偏差记录工作流

## 最近更新

| 版本 | 内容 |
|------|------|
| 2026-06-13 | fix: PAD页面空白+请求失败两个bug（currentOp查GMP_OPERATIONS / float-tickets 静默处理） |
| 2026-06-13 | feat: GMP模式切换+批包装EBR自动报表 |
| 2026-06-13 | feat: 完善生产业务流程+1:1批包装记录EBR |
| 2026-06-12 | fix: 数据库 utf8mb4 编码重建，修复中文乱码 |

# MES系统测试运维任务核心分解方案

## 概述
本文档提供测试运维相关任务的核心分解方案，作为Agent #3详细分析的补充和快速执行指南。

---

## Task #72: 前后端联调测试 ⚡ 核心分解

### 任务目标
确保前后端API对接正确，业务流程完整运行，系统功能稳定可靠。

### 核心子任务分解

#### 72.1 API接口连接测试 (1-2天)
**测试范围**: 25个API服务类，396个API方法

**测试策略**:
```bash
# 1. 基础连接测试
- 测试所有Controller的HTTP状态码
- 验证请求/响应格式正确性
- 检查错误处理机制

# 2. 重点模块测试
P0 (必须通过):
- MaterialApiService: 15个方法
- ProductionOrderApiService: 13个方法
- WorkOrderApiService: 14个方法
- EbrApiService: 28个方法

P1 (重要):
- PadApiService: 26个方法
- MaterialIssuanceApiService: 24个方法
- InspectionApiService: 12个方法
```

**测试用例模板**:
```typescript
// API连接测试用例
describe('API Connection Tests', () => {
  test('MaterialApi - 分页查询', async () => {
    const result = await MaterialApiService.page({
      page: 1,
      pageSize: 10
    });
    expect(result.code).toBe(200);
    expect(result.data).toBeDefined();
    expect(result.data.records).toBeInstanceOf(Array);
  });

  test('MaterialApi - 新增物料', async () => {
    const material = {
      code: 'TEST001',
      name: '测试物料',
      categoryId: 1,
      type: 'RAW',
      unit: 'KG'
    };
    const result = await MaterialApiService.add(material);
    expect(result.code).toBe(200);
  });
});
```

**验收标准**:
- ✅ 所有P0接口测试通过率100%
- ✅ 所有P1接口测试通过率≥95%
- ✅ 错误响应格式统一
- ✅ 超时处理正确

#### 72.2 业务流程端到端测试 (2-3天)
**测试场景**: 完整的生产执行流程

**核心流程测试**:
```
流程1: 生产订单→工单→浮票→执行
1. 创建生产订单 (ProductionOrder)
2. 下达生产订单
3. 下推生成工单 (WorkOrder)
4. 创建浮票 (FloatTicket)
5. 分配到工作中心
6. 开始执行
7. 完成执行
8. 质检
9. 完成

流程2: 物料需求→领料→发放
1. 计算物料需求
2. 创建领料单
3. 审批领料单
4. 仓库发放
5. 确认接收

流程3: EBR批记录执行
1. 创建批记录
2. 开始批次
3. 执行步骤
4. 记录数据
5. 完成批次
```

**E2E测试脚本示例**:
```typescript
// E2E测试流程
describe('Production Flow E2E', () => {
  test('完整生产流程', async () => {
    // 1. 创建生产订单
    const order = await createProductionOrder({
      orderNo: 'PO20260503001',
      productCode: 'PROD001',
      quantity: 100
    });
    expect(order.status).toBe('DRAFT');

    // 2. 下达订单
    await releaseOrder(order.id);
    const releasedOrder = await getOrder(order.id);
    expect(releasedOrder.status).toBe('RELEASED');

    // 3. 生成工单
    const workOrder = await generateWorkOrder(order.id);
    expect(workOrder).toBeDefined();
    expect(workOrder.status).toBe('DRAFT');

    // 4. 下达工单
    await releaseWorkOrder(workOrder.id);
    // ... 继续后续流程
  });
});
```

**验收标准**:
- ✅ 核心业务流程100%通过
- ✅ 异常场景处理正确
- ✅ 数据一致性保证
- ✅ 状态转换正确

#### 72.3 数据一致性验证 (1天)
**验证重点**:
```typescript
// 数据一致性检查
describe('Data Consistency Tests', () => {
  test('订单→工单数据一致性', async () => {
    const order = await createOrder({ quantity: 100 });
    const workOrder = await generateWorkOrder(order.id);

    // 验证数量一致性
    expect(workOrder.planQuantity).toBe(order.quantity);
    // 验证产品信息一致性
    expect(workOrder.productCode).toBe(order.productCode);
  });

  test('库存数据一致性', async () => {
    const beforeStock = await getMaterialStock('MAT001');
    await issueMaterial('MAT001', 10);
    const afterStock = await getMaterialStock('MAT001');

    expect(afterStock).toBe(beforeStock - 10);
  });
});
```

**验收标准**:
- ✅ 关联数据100%一致
- ✅ 库存数据准确
- ✅ 状态同步正确

---

## Task #73: 扩大测试覆盖 ⚡ 核心分解

### 当前状态
- 测试覆盖率: 60%
- 单元测试: 3个类 (MaterialService, ProductionOrderService, ValidationUtils)
- 集成测试: 2个类 (MaterialController, HealthCheckController)

### 目标
- 测试覆盖率: ≥80%
- 单元测试: ≥15个Service类
- 集成测试: ≥10个Controller类

### 核心子任务分解

#### 73.1 Service单元测试扩展 (3-4天)
**优先级P0 - 必须测试的Service**:
```java
// 1. BomService (BOM管理)
@Test
void testAddBom_WithDetails() {
    Bom bom = new Bom();
    bom.setMaterialCode("PROD001");
    bom.setDetails(Arrays.asList(
        createBomDetail("MAT001", 10.0),
        createBomDetail("MAT002", 5.0)
    ));

    bomService.add(bom);

    Bom saved = bomService.getById(bom.getId());
    assertEquals(2, saved.getDetails().size());
}

// 2. WorkOrderService (工单管理)
@Test
void testReleaseWorkOrder_WithOperations() {
    WorkOrder workOrder = createWorkOrder();
    workOrderService.add(workOrder);

    // 添加工序
    addOperation(workOrder.getId(), "OP001", "称重");
    addOperation(workOrder.getId(), "OP002", "包装");

    // 下达工单
    workOrderService.release(workOrder.getId());

    WorkOrder released = workOrderService.getById(workOrder.getId());
    assertEquals("RELEASED", released.getStatus());
}

// 3. EbrRecordService (EBR管理)
@Test
void testCompleteBatch_WithAllStepsCompleted() {
    EbrRecord record = createEbrRecord();
    ebrRecordService.startBatch(record.getId(), 1L, "操作员");

    // 完成所有步骤
    List<EbrStep> steps = ebrRecordService.getSteps(record.getId());
    for (EbrStep step : steps) {
        ebrRecordService.startStep(step.getId(), 1L, "操作员");
        ebrRecordService.completeStep(step.getId(), 1L, "操作员", "测试数据");
    }

    // 完成批次
    ebrRecordService.completeBatch(record.getId(), 1L, "操作员");

    EbrRecord completed = ebrRecordService.getById(record.getId());
    assertEquals("COMPLETED", completed.getStatus());
}
```

**测试覆盖清单**:
- [ ] MaterialService - ✅ 已完成
- [ ] ProductionOrderService - ✅ 已完成
- [ ] WorkOrderService - 待添加
- [ ] TaskOrderService - 待添加
- [ ] BomService - 待添加
- [ ] EbrRecordService - 待添加
- [ ] PadTaskService - 待添加
- [ ] MaterialIssuanceService - 待添加
- [ ] InspectionTaskService - 待添加
- [ ] MrbRecordService - 待添加
- [ ] QualityReleaseService - 待添加

#### 73.2 Controller集成测试扩展 (2-3天)
**核心Controller测试**:
```java
@SpringBootTest
@AutoConfigureMockMvc
class WorkOrderControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void testCreateWorkOrder_Success() throws Exception {
        WorkOrder workOrder = createTestWorkOrder();
        String json = objectMapper.writeValueAsString(workOrder);

        mockMvc.perform(post("/api/workOrder/add")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.workOrderNo").exists());
    }

    @Test
    void testReleaseWorkOrder_Success() throws Exception {
        // 先创建工单
        WorkOrder workOrder = createAndSaveWorkOrder();

        mockMvc.perform(put("/api/workOrder/release/{id}", workOrder.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("RELEASED"));
    }
}
```

**测试覆盖清单**:
- [ ] MaterialController - ✅ 已完成
- [ ] ProductionOrderController - 待添加
- [ ] WorkOrderController - 待添加
- [ ] BomController - 待添加
- [ ] EbrRecordController - 待添加
- [ ] PadTaskController - 待添加
- [ ] MaterialIssuanceController - 待添加
- [ ] InspectionTaskController - 待添加

#### 73.3 测试工具和Mock数据 (1天)
**测试数据构建工具**:
```java
// 扩展TestDataBuilder
public class TestDataBuilder {
    // 添加更多构建方法
    public static WorkOrder buildWorkOrder() {
        WorkOrder workOrder = new WorkOrder();
        workOrder.setWorkOrderNo("WO" + System.currentTimeMillis());
        workOrder.setOrderNo("PO20260503001");
        workOrder.setMaterialCode("MAT001");
        workOrder.setPlanQuantity(new BigDecimal("100"));
        workOrder.setStatus("DRAFT");
        return workOrder;
    }

    public static EbrRecord buildEbrRecord() {
        EbrRecord record = new EbrRecord();
        record.setBatchNo("BATCH" + System.currentTimeMillis());
        record.setProductId(1L);
        record.setPlanQuantity(new BigDecimal("100"));
        record.setStatus("DRAFT");
        return record;
    }
}
```

**验收标准**:
- ✅ 单元测试覆盖率≥80%
- ✅ 集成测试覆盖所有主要Controller
- ✅ 所有P0功能都有测试覆盖
- ✅ 测试可以在CI/CD中自动运行

---

## Task #76: 监控告警系统搭建 ⚡ 核心分解

### 架构设计
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Application │───▶│ Prometheus  │───▶│  Grafana    │
│  (Metrics)  │    │  (Collect)  │    │ (Visualize) │
└─────────────┘    └─────────────┘    └─────────────┘
                            │
                            ▼
                    ┌─────────────┐
                    │ Alertmanager│
                    │  (Alert)   │
                    └─────────────┘
```

### 核心子任务分解

#### 76.1 Prometheus集成 (1-2天)
**配置文件**: `prometheus.yml`
```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'mes-application'
    metrics_path: '/actuator/prometheus'
    static_configs:
      - targets: ['localhost:8080']
    relabel_configs:
      - source_labels: [__address__]
        target_label: instance
        replacement: 'mes-server'

  - job_name: 'jvm'
    metrics_path: '/actuator/prometheus'
    static_configs:
      - targets: ['localhost:8080']
```

**Spring Boot Actuator配置**: `application.yml`
```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus
  metrics:
    export:
      prometheus:
        enabled: true
    tags:
      application: ${spring.application.name}
```

**业务指标暴露**:
```java
@RestController
@RequestMapping("/actuator/prometheus")
public class MetricsController {

    private final MeterRegistry meterRegistry;
    private final BusinessMetricsCollector metricsCollector;

    @GetMapping("/business-metrics")
    public Map<String, Object> getBusinessMetrics() {
        Map<String, Object> metrics = new HashMap<>();

        // 计数器指标
        metricsCollector.getCounters().forEach((name, value) -> {
            Counter.builder(name)
                .tag("type", "business")
                .register(meterRegistry)
                .increment(value);
        });

        return metrics;
    }
}
```

#### 76.2 Grafana仪表盘配置 (1天)
**核心仪表盘**: MES系统监控
```json
{
  "dashboard": {
    "title": "MES System Monitor",
    "panels": [
      {
        "title": "API请求量",
        "targets": [
          {
            "expr": "rate(http_server_requests_seconds_count[5m])",
            "legendFormat": "{{method}} {{uri}}"
          }
        ]
      },
      {
        "title": "API响应时间",
        "targets": [
          {
            "expr": "rate(http_server_requests_seconds_sum[5m]) / rate(http_server_requests_seconds_count[5m])",
            "legendFormat": "{{method}} {{uri}}"
          }
        ]
      },
      {
        "title": "JVM内存使用",
        "targets": [
          {
            "expr": "jvm_memory_used_bytes{area=\"heap\"}",
            "legendFormat": "Heap Used"
          }
        ]
      }
    ]
  }
}
```

#### 76.3 告警规则配置 (1天)
**告警规则**: `alerts.yml`
```yaml
groups:
  - name: mes_alerts
    rules:
      # API响应时间告警
      - alert: HighAPILatency
        expr: rate(http_server_requests_seconds_sum[5m]) / rate(http_server_requests_seconds_count[5m]) > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "API响应时间过高"
          description: "API {{ $labels.uri }} 响应时间超过1秒"

      # 错误率告警
      - alert: HighErrorRate
        expr: rate(http_server_requests_seconds_count{status=~"5.."}[5m]) / rate(http_server_requests_seconds_count[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "错误率过高"
          description: "错误率超过5%"

      # JVM内存告警
      - alert: HighMemoryUsage
        expr: jvm_memory_used_bytes{area="heap"} / jvm_memory_max_bytes{area="heap"} > 0.8
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "JVM内存使用率过高"
          description: "堆内存使用率超过80%"
```

**验收标准**:
- ✅ Prometheus成功采集应用指标
- ✅ Grafana仪表盘正常显示
- ✅ 告警规则正确触发
- ✅ 告警通知正常发送

---

## Task #78: 部署和运维准备 ⚡ 核心分解

### 核心子任务分解

#### 78.1 Docker容器化 (1-2天)
**后端Dockerfile**: `backend/Dockerfile`
```dockerfile
FROM openjdk:17-jdk-slim

WORKDIR /app

# 复制应用文件
COPY target/mes-backend.jar app.jar

# 暴露端口
EXPOSE 8080

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8080/actuator/health || exit 1

# 启动应用
ENTRYPOINT ["java", "-jar", "app.jar"]
```

**前端Dockerfile**: `frontend/Dockerfile`
```dockerfile
FROM node:18-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Docker Compose**: `docker-compose.yml`
```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: mes_db
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  backend:
    build: ./backend
    ports:
      - "8080:8080"
    depends_on:
      - mysql
      - redis
    environment:
      SPRING_DATASOURCE_URL: jdbc:mysql://mysql:3306/mes_db
      SPRING_REDIS_HOST: redis

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana
    ports:
      - "3000:3000"
    environment:
      GF_SECURITY_ADMIN_PASSWORD: admin
    volumes:
      - grafana_data:/var/lib/grafana

volumes:
  mysql_data:
  redis_data:
  grafana_data:
```

#### 78.2 CI/CD流水线 (1-2天)
**GitHub Actions配置**: `.github/workflows/ci-cd.yml`
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Set up JDK 17
        uses: actions/setup-java@v3
        with:
          java-version: '17'
          distribution: 'temurin'

      - name: Run backend tests
        run: |
          cd backend
          mvn test

      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Run frontend tests
        run: |
          cd frontend
          npm ci
          npm test

  build:
    needs: test
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Build backend
        run: |
          cd backend
          mvn clean package -DskipTests

      - name: Build frontend
        run: |
          cd frontend
          npm ci
          npm run build

      - name: Build Docker images
        run: |
          docker-compose build

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - name: Deploy to production
        run: |
          docker-compose up -d
          docker-compose ps
```

#### 78.3 数据库备份策略 (1天)
**备份脚本**: `scripts/backup.sh`
```bash
#!/bin/bash

# 数据库备份脚本
BACKUP_DIR="/backups/mysql"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/mes_backup_$DATE.sql"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 执行备份
docker exec mes-mysql mysqldump -uroot -proot mes_db > $BACKUP_FILE

# 压缩备份文件
gzip $BACKUP_FILE

# 删除7天前的备份
find $BACKUP_DIR -name "mes_backup_*.sql.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_FILE.gz"
```

**恢复脚本**: `scripts/restore.sh`
```bash
#!/bin/bash

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <backup_file>"
    exit 1
fi

# 解压备份文件
gunzip -c $BACKUP_FILE | docker exec -i mes-mysql mysql -uroot -proot mes_db

echo "Restore completed from: $BACKUP_FILE"
```

**定时任务**: `crontab`
```
# 每天凌晨2点执行备份
0 2 * * * /path/to/backup.sh >> /var/log/backup.log 2>&1
```

**验收标准**:
- ✅ Docker镜像构建成功
- ✅ Docker Compose一键启动
- ✅ CI/CD流水线正常运行
- ✅ 数据库备份和恢复正常

---

## 📊 测试运维任务总览

| 任务 | 子任务数 | 预计工期 | 优先级 | 状态 |
|------|----------|----------|--------|------|
| **Task #72: 联调测试** | 3个 | 4-5天 | P0 | 🟡 待执行 |
| **Task #73: 测试覆盖** | 3个 | 6-7天 | P0 | 🟡 待执行 |
| **Task #76: 监控告警** | 3个 | 3-4天 | P1 | 🟡 待执行 |
| **Task #78: 部署运维** | 3个 | 4-5天 | P1 | 🟡 待执行 |
| **总计** | **12个** | **17-21天** | - | - |

---

## 🎯 快速执行检查清单

### Week 1: 联调测试周
- [ ] 72.1 完成API接口连接测试
- [ ] 72.2 完成业务流程E2E测试
- [ ] 72.3 完成数据一致性验证
- [ ] 生成联调测试报告

### Week 2: 测试覆盖周
- [ ] 73.1 完成8个Service单元测试
- [ ] 73.2 完成6个Controller集成测试
- [ ] 73.3 完善测试工具和Mock数据
- [ ] 测试覆盖率达到80%+

### Week 3: 监控部署周
- [ ] 76.1 完成Prometheus集成
- [ ] 76.2 完成Grafana仪表盘配置
- [ ] 76.3 完成告警规则配置
- [ ] 78.1 完成Docker容器化
- [ ] 78.2 完成CI/CD流水线
- [ ] 78.3 完成数据库备份策略

---

## 💡 执行建议

### 1. 并行执行策略
- **Week 1**: 专注联调测试，确保功能正确
- **Week 2**: 专注测试覆盖，提升代码质量
- **Week 3**: 专注监控部署，准备生产环境

### 2. 关键里程碑
- **Day 5**: 联调测试通过，系统功能验证完成
- **Day 12**: 测试覆盖率达标，代码质量保证
- **Day 21**: 监控部署完成，生产环境就绪

### 3. 风险控制
- **测试环境**: 确保测试环境稳定，数据充足
- **测试数据**: 准备完整的测试数据集
- **回滚方案**: 准备快速回滚方案
- **监控告警**: 部署前完成监控配置

---

**文档状态**: ✅ 核心分解完成
**下一步**: 等待Agent #3详细分析结果，然后整合生成完整执行计划

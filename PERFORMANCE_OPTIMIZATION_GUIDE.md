# MES系统性能优化实施指南

## 概述

本文档提供了MES系统性能优化的具体实施方案，包括前端和后端的优化代码示例和配置建议。

---

## 前端优化实施

### 1. 优化列表组件渲染性能

#### 1.1 使用React.memo优化列表项

**问题**: 列表项组件每次父组件更新都会重新渲染

**解决方案**:

```tsx
import React, { memo } from 'react';

interface ListRowProps {
  data: any;
  index: number;
}

// 使用React.memo避免不必要的重新渲染
const ListRow = memo<ListRowProps>(({ data, index }) => {
  console.log(`Rendering row ${index}`); // 只在数据变化时打印

  return (
    <div className="list-row">
      <span>{data.code}</span>
      <span>{data.name}</span>
      <span>{data.status}</span>
    </div>
  );
}, (prevProps, nextProps) => {
  // 自定义比较函数，只在数据变化时重新渲染
  return (
    prevProps.data.code === nextProps.data.code &&
    prevProps.data.name === nextProps.data.name &&
    prevProps.data.status === nextProps.data.status
  );
});

export default ListRow;
```

#### 1.2 使用useMemo缓存计算结果

```tsx
import React, { useMemo } from 'react';

const DataList: React.FC<{ items: any[] }> = ({ items }) => {
  // 使用useMemo缓存过滤后的数据
  const filteredItems = useMemo(() => {
    console.log('Filtering items...');
    return items.filter(item => item.status === 'active');
  }, [items]);

  // 使用useMemo缓存排序后的数据
  const sortedItems = useMemo(() => {
    console.log('Sorting items...');
    return [...filteredItems].sort((a, b) => a.code.localeCompare(b.code));
  }, [filteredItems]);

  return (
    <div>
      {sortedItems.map(item => (
        <ListRow key={item.id} data={item} />
      ))}
    </div>
  );
};
```

#### 1.3 使用虚拟滚动优化大数据列表

```tsx
import { FixedSizeList as List } from 'react-window';

const VirtualList: React.FC<{ items: any[] }> = ({ items }) => {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const item = items[index];

    return (
      <div style={style} className="list-item">
        <span>{item.code}</span>
        <span>{item.name}</span>
      </div>
    );
  };

  return (
    <List
      height={600}
      itemCount={items.length}
      itemSize={60}
      width="100%"
      itemKey={(index) => items[index].id}
    >
      {Row}
    </List>
  );
};
```

### 2. 优化组件加载性能

#### 2.1 实现代码分割和懒加载

```tsx
import React, { lazy, Suspense } from 'react';

// 使用React.lazy懒加载组件
const HeavyComponent = lazy(() => import('./HeavyComponent'));
const AnotherComponent = lazy(() => import('./AnotherComponent'));

// 加载指示器
const LoadingSpinner = () => (
  <div className="loading-spinner">Loading...</div>
);

const App: React.FC = () => {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <HeavyComponent />
      <Suspense fallback={<LoadingSpinner />}>
        <AnotherComponent />
      </Suspense>
    </Suspense>
  );
};
```

#### 2.2 路由级代码分割

```tsx
import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// 懒加载页面组件
const HomePage = lazy(() => import('./pages/HomePage'));
const MaterialPage = lazy(() => import('./pages/material/MaterialPage'));
const BOMPage = lazy(() => import('./pages/bom/BomListPage'));
const ProductionOrderPage = lazy(() => import('./pages/workorder/ProductionOrderPage'));

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<div>Loading...</div>}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/material" element={<MaterialPage />} />
          <Route path="/bom" element={<BOMPage />} />
          <Route path="/production-order" element={<ProductionOrderPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};
```

### 3. 优化内存使用

#### 3.1 使用WeakMap存储临时数据

```typescript
// 使用WeakMap自动清理不再需要的引用
const weakDataCache = new WeakMap<object, any>();

function processData(data: object): any {
  // 检查缓存
  if (weakDataCache.has(data)) {
    return weakDataCache.get(data);
  }

  // 处理数据
  const result = expensiveProcessing(data);

  // 存储到WeakMap
  weakDataCache.set(data, result);

  return result;
}

// 当data对象不再被引用时，WeakMap会自动清理
```

#### 3.2 及时清理事件监听器

```tsx
import React, { useEffect, useRef } from 'react';

const ComponentWithEventListeners: React.FC = () => {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // 添加事件监听器
    const handleClick = (e: MouseEvent) => {
      console.log('Element clicked', e);
    };

    element.addEventListener('click', handleClick);

    // 清理函数：组件卸载时移除监听器
    return () => {
      element.removeEventListener('click', handleClick);
    };
  }, []);

  return <div ref={elementRef}>Click me</div>;
};
```

#### 3.3 优化数据结构

```typescript
// 不好的做法：嵌套对象占用大量内存
interface BadDataStructure {
  items: Array<{
    id: number;
    data: {
      level1: {
        level2: {
          level3: {
            value: number;
          };
        };
      };
    };
  }>;
}

// 好的做法：扁平化数据结构
interface GoodDataStructure {
  items: Array<{
    id: number;
    value: number;
  }>;
}
```

### 4. 优化动画性能

#### 4.1 使用CSS transform替代top/left

```css
/* 不好：使用top/left导致重排 */
.bad-animation {
  position: absolute;
  top: 0;
  left: 0;
  transition: top 0.3s, left 0.3s;
}

/* 好：使用transform使用GPU加速 */
.good-animation {
  position: absolute;
  transform: translate(0, 0);
  transition: transform 0.3s;
  will-change: transform;
}
```

#### 4.2 使用requestAnimationFrame

```tsx
import React, { useRef, useEffect } from 'react';

const AnimatedComponent: React.FC = () => {
  const animationRef = useRef<number>();
  const elementRef = useRef<HTMLDivElement>(null);

  const animate = () => {
    const element = elementRef.current;
    if (!element) return;

    // 更新动画状态
    const time = performance.now();
    const position = Math.sin(time / 1000) * 100;

    element.style.transform = `translateY(${position}px)`;

    // 请求下一帧
    animationRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    // 开始动画
    animationRef.current = requestAnimationFrame(animate);

    // 清理：取消动画帧
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return <div ref={elementRef}>Animated Element</div>;
};
```

### 5. 优化网络请求

#### 5.1 实现请求缓存

```typescript
import { requestCache } from './performanceUtils';

// 缓存API请求
export async function fetchMaterials(params?: any): Promise<any[]> {
  return requestCache.getOrSet(
    'materials',
    () => apiClient.get('/api/materials', { params }),
    params,
    5000 // 缓存5秒
  );
}
```

#### 5.2 实现请求防抖和节流

```typescript
import { debounce, throttle } from './performanceUtils';

// 搜索输入防抖
const debouncedSearch = debounce(async (keyword: string) => {
  const results = await apiClient.get('/api/search', { params: { keyword } });
  return results;
}, 300);

// 滚动加载节流
const throttledLoad = throttle(async (page: number) => {
  const results = await apiClient.get('/api/items', { params: { page } });
  return results;
}, 500);
```

---

## 后端优化实施

### 1. 数据库优化

#### 1.1 添加索引

```sql
-- 为常用查询字段添加索引
CREATE INDEX idx_material_code ON material(code);
CREATE INDEX idx_material_category ON material(category_id);
CREATE INDEX idx_material_status ON material(status);

-- 为外键添加索引
CREATE INDEX idx_material_category_fk ON material(category_id);
CREATE INDEX idx_bom_material_fk ON bom_detail(material_id);

-- 为组合查询添加复合索引
CREATE INDEX idx_material_category_status ON material(category_id, status);
```

#### 1.2 优化SQL查询

```java
// 不好的做法：N+1查询
List<Material> materials = materialMapper.selectList(null);
for (Material material : materials) {
    Category category = categoryMapper.selectById(material.getCategoryId());
    material.setCategory(category);
}

// 好的做法：使用JOIN查询
List<Material> materials = materialMapper.selectList(
    new QueryWrapper<Material>()
        .select("m.*", "c.name as category_name")
        .alias("m")
        .leftJoin("category c", "m.category_id = c.id")
);

// 或者使用MyBatis-Plus的关联查询
@TableName("material")
public class Material {
    @TableId
    private Long id;

    private String code;

    private String name;

    @TableField(exist = false)
    private Category category;
}
```

#### 1.3 使用分页查询

```java
// 使用MyBatis-Plus的分页
@GetMapping("/materials")
public Result<PageResult<Material>> getMaterials(
    @RequestParam(defaultValue = "1") int page,
    @RequestParam(defaultValue = "20") int size
) {
    Page<Material> pageParam = new Page<>(page, size);

    QueryWrapper<Material> wrapper = new QueryWrapper<Material>()
        .eq("status", "active")
        .orderByDesc("create_time");

    Page<Material> result = materialMapper.selectPage(pageParam, wrapper);

    return Result.success(PageResult.of(result));
}
```

### 2. 缓存优化

#### 2.1 使用Redis缓存

```java
@Service
public class MaterialServiceImpl implements MaterialService {

    @Autowired
    private MaterialMapper materialMapper;

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    @Override
    public Material getById(Long id) {
        String key = "material:" + id;

        // 先从Redis获取
        Material material = (Material) redisTemplate.opsForValue().get(key);
        if (material != null) {
            return material;
        }

        // Redis中没有，从数据库获取
        material = materialMapper.selectById(id);

        // 存入Redis，缓存1小时
        if (material != null) {
            redisTemplate.opsForValue().set(key, material, 1, TimeUnit.HOURS);
        }

        return material;
    }

    @Override
    public void updateById(Material material) {
        materialMapper.updateById(material);

        // 清除缓存
        String key = "material:" + material.getId();
        redisTemplate.delete(key);
    }
}
```

### 3. 并发优化

#### 3.1 配置线程池

```java
@Configuration
public class AsyncConfig {

    @Bean(name = "taskExecutor")
    public Executor taskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(10);
        executor.setMaxPoolSize(50);
        executor.setQueueCapacity(200);
        executor.setThreadNamePrefix("async-");
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        executor.initialize();
        return executor;
    }
}
```

#### 3.2 使用异步处理

```java
@Service
public class MaterialImportService {

    @Autowired
    private TaskExecutor taskExecutor;

    @Autowired
    private MaterialMapper materialMapper;

    public void importMaterials(List<Material> materials) {
        // 异步处理大批量导入
        taskExecutor.execute(() -> {
            try {
                // 分批插入
                int batchSize = 1000;
                for (int i = 0; i < materials.size(); i += batchSize) {
                    int end = Math.min(i + batchSize, materials.size());
                    List<Material> batch = materials.subList(i, end);
                    materialMapper.insertBatch(batch);
                }
            } catch (Exception e) {
                log.error("导入失败", e);
            }
        });
    }
}
```

### 4. 连接池优化

#### 4.1 配置HikariCP连接池

```yaml
# application.yml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/mes?useSSL=false&serverTimezone=UTC
    username: root
    password: password
    driver-class-name: com.mysql.cj.jdbc.Driver
    hikari:
      maximum-pool-size: 20
      minimum-idle: 10
      connection-timeout: 30000
      idle-timeout: 600000
      max-lifetime: 1800000
      connection-test-query: SELECT 1
```

---

## 监控和诊断

### 1. 前端性能监控

```tsx
// 使用PerformanceMonitor组件
import PerformanceMonitor from '@/shared/components/PerformanceMonitor';

const App: React.FC = () => {
  return (
    <>
      <MainLayout />
      <PerformanceMonitor />
    </>
  );
};
```

### 2. 后端性能监控

```java
// 使用性能监控切面
@Aspect
@Component
@Slf4j
public class PerformanceMonitorAspect {

    @Around("@annotation(MetricsAnnotation)")
    public Object monitorPerformance(ProceedingJoinPoint joinPoint) throws Throwable {
        String methodName = joinPoint.getSignature().getName();
        long startTime = System.currentTimeMillis();

        try {
            Object result = joinPoint.proceed();
            long duration = System.currentTimeMillis() - startTime;

            log.info("Method {} executed in {}ms", methodName, duration);

            // 记录性能指标
            performanceMonitor.record(methodName, duration);

            return result;
        } catch (Exception e) {
            long duration = System.currentTimeMillis() - startTime;
            log.error("Method {} failed after {}ms", methodName, duration, e);
            throw e;
        }
    }
}
```

---

## 测试和验证

### 1. 前端性能测试

```bash
# 运行前端性能测试
npm run test:performance

# 或在浏览器中
# 打开 http://localhost:3000/performance-test
# 在控制台执行: window.runFrontendPerformanceTests()
```

### 2. 后端性能测试

```bash
# 使用JMeter进行压力测试
jmeter -n -t test-plan.jmx -l results.jtl -e -o report/

# 使用ab进行简单测试
ab -n 1000 -c 10 http://localhost:8080/api/materials
```

---

## 总结

本文档提供了MES系统性能优化的具体实施方案。建议按照优先级逐步实施优化措施，并在每次优化后运行性能测试验证效果。

关键优化点:
1. 前端: 虚拟滚动 + 组件优化 + 内存管理
2. 后端: 数据库索引 + 缓存策略 + 并发处理
3. 监控: 建立完整的性能监控体系

预期效果:
- 首屏加载时间: 2.5s → 1.5s (40%改善)
- API响应时间: 500ms → 300ms (40%改善)
- 大数据渲染: 4.2s → 0.55s (87%改善)
- 内存使用: 180MB → 130MB (28%改善)

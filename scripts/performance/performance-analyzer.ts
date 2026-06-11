/**
 * 性能分析器
 * 识别性能瓶颈并提供优化建议
 */

interface PerformanceIssue {
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: 'frontend' | 'backend' | 'database' | 'network';
  title: string;
  description: string;
  impact: string;
  recommendation: string;
  codeExample?: string;
}

interface OptimizationSuggestion {
  category: string;
  priority: 'high' | 'medium' | 'low';
  description: string;
  implementationSteps: string[];
  expectedImprovement: string;
}

/**
 * 性能分析器类
 */
class PerformanceAnalyzer {
  private issues: PerformanceIssue[] = [];
  private suggestions: OptimizationSuggestion[] = [];

  /**
   * 分析前端性能问题
   */
  analyzeFrontend(results: any): void {
    console.log('分析前端性能问题...\n');

    // 1. 列表渲染性能
    this.analyzeListRendering(results);

    // 2. 内存使用
    this.analyzeMemoryUsage(results);

    // 3. 组件加载
    this.analyzeComponentLoading(results);

    // 4. FPS和渲染
    this.analyzeFPS(results);

    // 5. 网络请求
    this.analyzeNetworkRequests(results);
  }

  /**
   * 分析后端性能问题
   */
  analyzeBackend(results: any): void {
    console.log('分析后端性能问题...\n');

    // 1. API响应时间
    this.analyzeAPIResponseTime(results);

    // 2. 数据库查询
    this.analyzeDatabaseQueries(results);

    // 3. 并发处理
    this.analyzeConcurrency(results);

    // 4. 错误率
    this.analyzeErrorRate(results);

    // 5. 导入导出
    this.analyzeImportExport(results);
  }

  /**
   * 分析列表渲染性能
   */
  private analyzeListRendering(results: any): void {
    const listRenderResults = results['大数据列表渲染测试 - 虚拟滚动'] ||
                              results['Large List Rendering - Virtual Table'];

    if (!listRenderResults) return;

    for (const result of listRenderResults) {
      const dataSize = result.dataSize;
      const renderTime = result.renderTime;

      // 1000条数据应该<500ms
      if (dataSize >= 1000 && renderTime > 500) {
        this.addIssue({
          severity: 'high',
          category: 'frontend',
          title: '列表渲染性能瓶颈',
          description: `渲染${dataSize}条数据耗时${renderTime.toFixed(2)}ms，超过500ms阈值`,
          impact: '用户在浏览大数据列表时会感受到明显的卡顿和延迟',
          recommendation: '使用虚拟滚动技术，只渲染可视区域内的元素',
          codeExample: `
import { FixedSizeList as List } from 'react-window';

const Row = ({ index, style }) => (
  <div style={style}>
    {data[index].content}
  </div>
);

<List
  height={600}
  itemCount={data.length}
  itemSize={35}
  width="100%"
>
  {Row}
</List>
`,
        });
      }

      // 10000条数据应该<1000ms
      if (dataSize >= 10000 && renderTime > 1000) {
        this.addIssue({
          severity: 'critical',
          category: 'frontend',
          title: '超大数据列表渲染性能严重不足',
          description: `渲染${dataSize}条数据耗时${renderTime.toFixed(2)}ms，超过1000ms阈值`,
          impact: '用户在浏览超大数据列表时会遇到严重的性能问题',
          recommendation: '必须使用虚拟滚动 + 分页 + 数据懒加载的组合方案',
        });
      }
    }

    // 添加优化建议
    this.addSuggestion({
      category: '列表渲染优化',
      priority: 'high',
      description: '实施虚拟滚动和分页策略',
      implementationSteps: [
        '使用react-window或react-virtualized实现虚拟滚动',
        '实现服务端分页，默认每页20-50条记录',
        '添加快速搜索和过滤功能减少数据量',
        '使用React.memo和useMemo优化列表项渲染',
        '考虑使用Web Worker处理大数据计算',
      ],
      expectedImprovement: '列表渲染时间从秒级降低到毫秒级，内存使用减少80%以上',
    });
  }

  /**
   * 分析内存使用
   */
  private analyzeMemoryUsage(results: any): void {
    const memoryResults = results['内存使用测试'] || results['Memory Usage Test'];

    if (!memoryResults) return;

    let hasMemoryLeak = false;

    for (const result of memoryResults) {
      const dataSize = result.dataSize;
      const memoryUsed = result.memoryUsed;
      const memoryLeaked = result.memoryLeaked;

      // 内存使用超过200MB
      if (memoryUsed > 200) {
        this.addIssue({
          severity: 'high',
          category: 'frontend',
          title: '内存使用过高',
          description: `处理${dataSize}条数据时内存使用${memoryUsed.toFixed(2)}MB，超过200MB阈值`,
          impact: '可能导致浏览器崩溃，特别是在低内存设备上',
          recommendation: '优化数据结构，及时释放不需要的数据，使用懒加载',
        });
      }

      // 检测内存泄漏
      if (memoryLeaked > 10) {
        hasMemoryLeak = true;
        this.addIssue({
          severity: 'critical',
          category: 'frontend',
          title: '检测到内存泄漏',
          description: `处理${dataSize}条数据后内存泄漏${memoryLeaked.toFixed(2)}MB`,
          impact: '长时间使用会导致浏览器内存占用持续增长，最终崩溃',
          recommendation: '检查事件监听器是否正确清理，避免闭包引用，使用WeakMap/WeakSet',
        });
      }
    }

    if (hasMemoryLeak) {
      this.addSuggestion({
        category: '内存优化',
        priority: 'critical',
        description: '修复内存泄漏问题',
        implementationSteps: [
          '使用React DevTools Profiler识别内存泄漏',
          '确保所有useEffect清理函数正确返回cleanup函数',
          '避免在组件状态中存储大量不必要的数据',
          '使用useCallback和useMemo缓存函数和计算结果',
          '定期清理缓存数据',
          '使用WeakMap和WeakSet存储临时引用',
        ],
        expectedImprovement: '内存使用稳定，长时间运行无内存增长',
      });
    }
  }

  /**
   * 分析组件加载性能
   */
  private analyzeComponentLoading(results: any): void {
    const componentResults = results['组件加载时间测试'] || results['Component Loading Time'];

    if (!componentResults) return;

    for (const result of componentResults) {
      const componentName = result.componentName;
      const loadTime = result.loadTime;

      // 组件加载超过500ms
      if (loadTime > 500) {
        this.addIssue({
          severity: 'medium',
          category: 'frontend',
          title: '组件加载时间过长',
          description: `组件${componentName}加载耗时${loadTime.toFixed(2)}ms，超过500ms阈值`,
          impact: '用户打开页面时会感到明显的延迟',
          recommendation: '使用React.lazy进行代码分割，实现组件懒加载',
          codeExample: `
// 使用React.lazy懒加载组件
const HeavyComponent = React.lazy(() => import('./HeavyComponent'));

// 在渲染时使用Suspense
<Suspense fallback={<Loading />}>
  <HeavyComponent />
</Suspense>
`,
        });
      }
    }

    this.addSuggestion({
      category: '组件加载优化',
      priority: 'medium',
      description: '实施代码分割和懒加载',
      implementationSteps: [
        '使用React.lazy和Suspense实现组件懒加载',
        '使用import()动态导入大组件',
        '实现路由级别的代码分割',
        '优化打包配置，提取公共代码',
        '使用webpack的splitChunks配置',
      ],
      expectedImprovement: '首屏加载时间减少30-50%，首包大小减少40%以上',
    });
  }

  /**
   * 分析FPS性能
   */
  private analyzeFPS(results: any): void {
    const fpsResults = results['FPS帧率测试'] || results['FPS Test'];

    if (!fpsResults) return;

    const avgFPS = fpsResults.avgFPS;
    const droppedFrameRate = fpsResults.droppedFrameRate;

    // 平均FPS低于55
    if (avgFPS < 55) {
      this.addIssue({
        severity: 'high',
        category: 'frontend',
        title: '帧率不足',
        description: `平均FPS为${avgFPS.toFixed(1)}，低于55fps目标`,
        impact: '动画和交互不流畅，用户体验差',
        recommendation: '优化渲染性能，减少不必要的重排和重绘',
      });
    }

    // 掉帧率超过10%
    if (droppedFrameRate > 10) {
      this.addIssue({
        severity: 'medium',
        category: 'frontend',
        title: '掉帧率过高',
        description: `掉帧率为${droppedFrameRate.toFixed(1)}%，超过10%阈值`,
        impact: '频繁的卡顿和延迟，影响用户体验',
        recommendation: '使用requestAnimationFrame进行动画，避免长时间阻塞主线程',
      });
    }

    this.addSuggestion({
      category: '渲染性能优化',
      priority: 'high',
      description: '提高渲染帧率',
      implementationSteps: [
        '使用Chrome DevTools Performance分析渲染瓶颈',
        '避免强制同步布局（FSL）',
        '使用CSS transform和opacity进行动画（硬件加速）',
        '减少DOM操作，使用虚拟DOM',
        '使用React DevTools Profiler识别渲染瓶颈',
        '实现节流和防抖函数减少不必要渲染',
      ],
      expectedImprovement: '平均FPS稳定在60fps，掉帧率降低到5%以下',
    });
  }

  /**
   * 分析网络请求
   */
  private analyzeNetworkRequests(results: any): void {
    const apiResults = results['API Call Performance'] || results['API调用性能测试'];

    if (!apiResults) return;

    const avgResponseTime = apiResults.average;

    // API平均响应时间超过500ms
    if (avgResponseTime > 500) {
      this.addIssue({
        severity: 'medium',
        category: 'network',
        title: 'API响应时间过长',
        description: `API平均响应时间为${avgResponseTime.toFixed(2)}ms，超过500ms阈值`,
        impact: '用户等待时间长，影响体验',
        recommendation: '实施请求缓存、CDN加速、服务端优化',
      });
    }

    this.addSuggestion({
      category: '网络请求优化',
      priority: 'medium',
      description: '优化API请求性能',
      implementationSteps: [
        '实现请求缓存（使用Redis、localStorage）',
        '使用CDN加速静态资源',
        '启用HTTP/2和gzip压缩',
        '实现请求合并和批量处理',
        '使用GraphQL减少过度获取',
        '实现乐观更新提升用户体验',
      ],
      expectedImprovement: 'API响应时间减少40-60%，网络流量减少30%以上',
    });
  }

  /**
   * 分析API响应时间
   */
  private analyzeAPIResponseTime(results: any): void {
    for (const [testName, result] of Object.entries(results)) {
      const resultData = result as any;

      if (resultData.average && resultData.average > 1000) {
        this.addIssue({
          severity: 'high',
          category: 'backend',
          title: 'API响应时间过长',
          description: `接口${testName}平均响应时间为${resultData.average.toFixed(2)}ms，超过1000ms阈值`,
          impact: '用户等待时间长，可能导致超时',
          recommendation: '优化数据库查询、添加缓存、优化业务逻辑',
        });
      }
    }

    this.addSuggestion({
      category: 'API性能优化',
      priority: 'high',
      description: '优化后端API性能',
      implementationSteps: [
        '添加数据库索引优化查询',
        '实现Redis缓存热点数据',
        '优化SQL查询，避免N+1问题',
        '使用连接池管理数据库连接',
        '实现异步处理和消息队列',
        '优化序列化和反序列化',
      ],
      expectedImprovement: 'API平均响应时间从秒级降低到毫秒级，吞吐量提升5-10倍',
    });
  }

  /**
   * 分析数据库查询
   */
  private analyzeDatabaseQueries(results: any): void {
    // 检查是否有慢查询
    for (const [testName, result] of Object.entries(results)) {
      const resultData = result as any;

      // P95超过2000ms说明有慢查询
      if (resultData.p95 && resultData.p95 > 2000) {
        this.addIssue({
          severity: 'critical',
          category: 'database',
          title: '检测到慢查询',
          description: `接口${testName}的P95响应时间为${resultData.p95.toFixed(2)}ms，存在慢查询`,
          impact: '部分用户体验极差，可能导致超时',
          recommendation: '使用EXPLAIN分析慢查询，添加适当索引，优化查询语句',
        });
      }
    }

    this.addSuggestion({
      category: '数据库优化',
      priority: 'critical',
      description: '优化数据库查询性能',
      implementationSteps: [
        '使用EXPLAIN分析慢查询执行计划',
        '为常用查询字段添加索引',
        '优化复杂查询，拆分为多个简单查询',
        '使用分页避免大量数据查询',
        '实现读写分离',
        '定期维护数据库（ANALYZE、OPTIMIZE）',
        '监控慢查询日志',
      ],
      expectedImprovement: '慢查询减少90%以上，数据库响应时间提升5-20倍',
    });
  }

  /**
   * 分析并发处理能力
   */
  private analyzeConcurrency(results: any): void {
    const concurrentTests = Object.entries(results).filter(([name]) =>
      name.includes('并发') || name.includes('concurrent')
    );

    for (const [testName, result] of concurrentTests) {
      const resultData = result as any;

      // 并发测试错误率超过5%
      if (resultData.errorRate && resultData.errorRate > 5) {
        this.addIssue({
          severity: 'high',
          category: 'backend',
          title: '并发处理能力不足',
          description: `并发测试${testName}错误率为${resultData.errorRate.toFixed(2)}%，超过5%阈值`,
          impact: '高并发场景下系统不稳定，可能出现大量失败请求',
          recommendation: '优化服务器配置，增加连接池大小，实现限流和熔断',
        });
      }
    }

    this.addSuggestion({
      category: '并发性能优化',
      priority: 'high',
      description: '提升系统并发处理能力',
      implementationSteps: [
        '增加服务器资源（CPU、内存）',
        '优化线程池和连接池配置',
        '实现限流和熔断机制',
        '使用负载均衡分发请求',
        '实现异步非阻塞处理',
        '优化数据库连接池配置',
      ],
      expectedImprovement: '支持并发用户数提升5-10倍，错误率降低到1%以下',
    });
  }

  /**
   * 分析错误率
   */
  private analyzeErrorRate(results: any): void {
    for (const [testName, result] of Object.entries(results)) {
      const resultData = result as any;

      // 错误率超过1%
      if (resultData.errorRate && resultData.errorRate > 1) {
        this.addIssue({
          severity: 'high',
          category: 'backend',
          title: '错误率过高',
          description: `接口${testName}错误率为${resultData.errorRate.toFixed(2)}%，超过1%阈值`,
          impact: '用户体验差，可能出现数据不一致问题',
          recommendation: '检查日志分析错误原因，优化异常处理，增加重试机制',
        });
      }
    }

    this.addSuggestion({
      category: '错误处理优化',
      priority: 'medium',
      description: '降低API错误率',
      implementationSteps: [
        '完善异常处理机制',
        '实现请求重试和幂等性',
        '添加详细的日志记录',
        '实现健康检查和自动恢复',
        '优化超时配置',
        '实现降级方案',
      ],
      expectedImprovement: '错误率降低到0.1%以下，系统稳定性显著提升',
    });
  }

  /**
   * 分析导入导出性能
   */
  private analyzeImportExport(results: any): void {
    const importTests = Object.entries(results).filter(([name]) =>
      name.includes('导入') || name.includes('import')
    );

    const exportTests = Object.entries(results).filter(([name]) =>
      name.includes('导出') || name.includes('export')
    );

    for (const [testName, result] of importTests) {
      const resultData = result as any;

      // 导入1000条超过10秒
      if (resultData.average && resultData.average > 10000) {
        this.addIssue({
          severity: 'high',
          category: 'backend',
          title: '数据导入性能不足',
          description: `导入测试${testName}平均耗时${(resultData.average / 1000).toFixed(2)}秒，超过10秒阈值`,
          impact: '大批量数据导入耗时过长，影响用户工作效率',
          recommendation: '使用批量插入、事务优化、异步处理',
        });
      }
    }

    for (const [testName, result] of exportTests) {
      const resultData = result as any;

      // 导出10000条超过30秒
      if (resultData.average && resultData.average > 30000) {
        this.addIssue({
          severity: 'high',
          category: 'backend',
          title: '数据导出性能不足',
          description: `导出测试${testName}平均耗时${(resultData.average / 1000).toFixed(2)}秒，超过30秒阈值`,
          impact: '大批量数据导出耗时过长，可能导致超时',
          recommendation: '使用流式导出、分页查询、压缩文件',
        });
      }
    }

    this.addSuggestion({
      category: '导入导出优化',
      priority: 'high',
      description: '优化数据导入导出性能',
      implementationSteps: [
        '使用批量插入代替单条插入',
        '实现异步导入导出，支持进度查询',
        '使用流式处理减少内存占用',
        '优化Excel/CSV读写性能',
        '实现文件压缩减少传输时间',
        '添加导入数据验证和错误处理',
        '支持分批导入和断点续传',
      ],
      expectedImprovement: '导入导出速度提升5-10倍，支持更大数据量处理',
    });
  }

  /**
   * 添加性能问题
   */
  private addIssue(issue: PerformanceIssue): void {
    this.issues.push(issue);
  }

  /**
   * 添加优化建议
   */
  private addSuggestion(suggestion: OptimizationSuggestion): void {
    this.suggestions.push(suggestion);
  }

  /**
   * 生成分析报告
   */
  generateReport(): string {
    const report = {
      timestamp: new Date().toISOString(),
      summary: this.generateSummary(),
      issues: this.issues,
      suggestions: this.suggestions,
    };

    return JSON.stringify(report, null, 2);
  }

  /**
   * 生成摘要
   */
  private generateSummary(): any {
    const criticalIssues = this.issues.filter(i => i.severity === 'critical').length;
    const highIssues = this.issues.filter(i => i.severity === 'high').length;
    const mediumIssues = this.issues.filter(i => i.severity === 'medium').length;
    const lowIssues = this.issues.filter(i => i.severity === 'low').length;

    const totalIssues = this.issues.length;
    const highPrioritySuggestions = this.suggestions.filter(s => s.priority === 'high').length;

    return {
      totalIssues,
      criticalIssues,
      highIssues,
      mediumIssues,
      lowIssues,
      totalSuggestions: this.suggestions.length,
      highPrioritySuggestions,
      overallStatus: criticalIssues === 0 ? '良好' : '需要优化',
    };
  }

  /**
   * 打印分析报告
   */
  printReport(): void {
    const summary = this.generateSummary();

    console.log('='.repeat(80));
    console.log('性能分析报告');
    console.log('='.repeat(80));
    console.log('');
    console.log('摘要:');
    console.log(`  总问题数: ${summary.totalIssues}`);
    console.log(`  严重问题: ${summary.criticalIssues}`);
    console.log(`  高优先级问题: ${summary.highIssues}`);
    console.log(`  中优先级问题: ${summary.mediumIssues}`);
    console.log(`  低优先级问题: ${summary.lowIssues}`);
    console.log(`  优化建议数: ${summary.totalSuggestions}`);
    console.log(`  高优先级建议: ${summary.highPrioritySuggestions}`);
    console.log(`  总体状态: ${summary.overallStatus}`);
    console.log('');

    if (this.issues.length > 0) {
      console.log('发现的问题:');
      console.log('-'.repeat(80));

      // 按严重程度排序
      const severityOrder = ['critical', 'high', 'medium', 'low'];
      const sortedIssues = [...this.issues].sort((a, b) =>
        severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity)
      );

      for (const issue of sortedIssues) {
        const icon = issue.severity === 'critical' ? '🔴' :
                     issue.severity === 'high' ? '🟠' :
                     issue.severity === 'medium' ? '🟡' : '🟢';

        console.log(`\n${icon} [${issue.severity.toUpperCase()}] ${issue.title}`);
        console.log(`   类别: ${issue.category}`);
        console.log(`   描述: ${issue.description}`);
        console.log(`   影响: ${issue.impact}`);
        console.log(`   建议: ${issue.recommendation}`);

        if (issue.codeExample) {
          console.log(`   代码示例:`);
          console.log('```');
          console.log(issue.codeExample);
          console.log('```');
        }
      }
    }

    if (this.suggestions.length > 0) {
      console.log('\n' + '='.repeat(80));
      console.log('优化建议');
      console.log('='.repeat(80));

      const priorityOrder = ['high', 'medium', 'low'];
      const sortedSuggestions = [...this.suggestions].sort((a, b) =>
        priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority)
      );

      for (const suggestion of sortedSuggestions) {
        const icon = suggestion.priority === 'high' ? '🔴' :
                     suggestion.priority === 'medium' ? '🟡' : '🟢';

        console.log(`\n${icon} [${suggestion.priority.toUpperCase()}] ${suggestion.category}`);
        console.log(`   描述: ${suggestion.description}`);
        console.log(`   预期改善: ${suggestion.expectedImprovement}`);
        console.log(`   实施步骤:`);
        suggestion.implementationSteps.forEach((step, index) => {
          console.log(`     ${index + 1}. ${step}`);
        });
      }
    }
  }
}

/**
 * 执行性能分析
 */
function analyzePerformance(frontendResults: any, backendResults: any): PerformanceAnalyzer {
  const analyzer = new PerformanceAnalyzer();

  console.log('='.repeat(80));
  console.log('开始性能分析');
  console.log('='.repeat(80));
  console.log('');

  // 分析前端
  if (frontendResults) {
    analyzer.analyzeFrontend(frontendResults);
  }

  // 分析后端
  if (backendResults) {
    analyzer.analyzeBackend(backendResults);
  }

  // 生成报告
  analyzer.printReport();

  return analyzer;
}

export { PerformanceAnalyzer, analyzePerformance };

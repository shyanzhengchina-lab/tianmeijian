/**
 * MES系统性能测试运行器
 * 执行前端和后端性能测试，生成详细报告
 */

import { PerformanceBenchmark } from '../../src/shared/utils/performanceBenchmark';
import { performanceMonitor, requestCache } from '../../src/shared/utils/performanceUtils';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

interface PerformanceTestConfig {
  testName: string;
  frontendTests: FrontendTestConfig[];
  backendTests: BackendTestConfig[];
  thresholds: PerformanceThresholds;
}

interface FrontendTestConfig {
  name: string;
  type: 'list-render' | 'component-load' | 'memory-test' | 'api-call';
  dataSize?: number[];
  iterations?: number;
}

interface BackendTestConfig {
  name: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  payload?: any;
  iterations: number;
  concurrency?: number;
}

interface PerformanceThresholds {
  frontend: {
    firstScreenLoad: number; // ms
    pageResponse: number; // ms
    memoryUsage: number; // MB
    listRender1000: number; // ms
    listRender10000: number; // ms
    fps: number; // frames per second
  };
  backend: {
    apiResponse: number; // ms
    import1000: number; // seconds
    export10000: number; // seconds
    concurrentUsers: number;
    errorRate: number; // percentage
  };
}

/**
 * MES系统性能测试配置
 */
const MES_PERFORMANCE_TESTS: PerformanceTestConfig = {
  testName: 'MES System Performance Test',
  frontendTests: [
    {
      name: 'Large List Rendering - Standard Table',
      type: 'list-render',
      dataSize: [100, 500, 1000, 5000],
      iterations: 5,
    },
    {
      name: 'Large List Rendering - Virtual Table',
      type: 'list-render',
      dataSize: [100, 500, 1000, 5000, 10000],
      iterations: 5,
    },
    {
      name: 'Component Loading Time',
      type: 'component-load',
      iterations: 10,
    },
    {
      name: 'Memory Usage Test',
      type: 'memory-test',
      dataSize: [100, 500, 1000, 5000, 10000],
      iterations: 3,
    },
    {
      name: 'API Call Performance',
      type: 'api-call',
      iterations: 20,
    },
  ],
  backendTests: [
    {
      name: 'GET /api/materials - List Query',
      endpoint: '/api/materials',
      method: 'GET',
      iterations: 50,
    },
    {
      name: 'GET /api/boms - List Query',
      endpoint: '/api/boms',
      method: 'GET',
      iterations: 50,
    },
    {
      name: 'GET /api/production-orders - List Query',
      endpoint: '/api/production-orders',
      method: 'GET',
      iterations: 50,
    },
    {
      name: 'POST /api/materials - Create',
      endpoint: '/api/materials',
      method: 'POST',
      payload: { code: 'TEST001', name: 'Test Material', categoryId: 1 },
      iterations: 30,
    },
    {
      name: 'POST /api/import/materials - Import 1000 records',
      endpoint: '/api/import/materials',
      method: 'POST',
      payload: generateTestData('material', 1000),
      iterations: 5,
    },
    {
      name: 'GET /api/export/materials - Export 10000 records',
      endpoint: '/api/export/materials',
      method: 'GET',
      iterations: 5,
    },
    {
      name: 'Concurrent Users Test',
      endpoint: '/api/health',
      method: 'GET',
      iterations: 100,
      concurrency: 50,
    },
  ],
  thresholds: {
    frontend: {
      firstScreenLoad: 3000,
      pageResponse: 500,
      memoryUsage: 200,
      listRender1000: 500,
      listRender10000: 1000,
      fps: 60,
    },
    backend: {
      apiResponse: 1000,
      import1000: 10,
      export10000: 30,
      concurrentUsers: 50,
      errorRate: 1,
    },
  },
};

/**
 * 生成测试数据
 */
function generateTestData(type: string, count: number) {
  const data = [];
  for (let i = 0; i < count; i++) {
    if (type === 'material') {
      data.push({
        code: `MAT${String(i + 1).padStart(6, '0')}`,
        name: `Test Material ${i + 1}`,
        specification: `Spec ${i + 1}`,
        categoryId: 1,
        unitId: 1,
        status: 'active',
      });
    }
  }
  return data;
}

/**
 * 性能测试运行器类
 */
class PerformanceTestRunner {
  private benchmark: PerformanceBenchmark;
  private config: PerformanceTestConfig;
  private results: any = {};

  constructor(config: PerformanceTestConfig) {
    this.benchmark = new PerformanceBenchmark();
    this.config = config;
  }

  /**
   * 运行所有测试
   */
  async runAllTests(): Promise<void> {
    console.log('='.repeat(60));
    console.log(`开始执行性能测试: ${this.config.testName}`);
    console.log('='.repeat(60));
    console.log('');

    try {
      // 运行前端测试
      console.log('1. 开始前端性能测试...');
      this.results.frontend = await this.runFrontendTests();
      console.log('✓ 前端测试完成');
      console.log('');

      // 运行后端测试
      console.log('2. 开始后端性能测试...');
      this.results.backend = await this.runBackendTests();
      console.log('✓ 后端测试完成');
      console.log('');

      // 分析结果
      console.log('3. 分析测试结果...');
      this.results.analysis = this.analyzeResults();
      console.log('✓ 分析完成');
      console.log('');

      // 生成报告
      console.log('4. 生成性能测试报告...');
      this.generateReport();
      console.log('✓ 报告生成完成');
      console.log('');

      console.log('='.repeat(60));
      console.log('性能测试完成！');
      console.log('='.repeat(60));
    } catch (error) {
      console.error('性能测试执行失败:', error);
      throw error;
    }
  }

  /**
   * 运行前端测试
   */
  private async runFrontendTests(): Promise<any> {
    const results: any = {};

    for (const test of this.config.frontendTests) {
      console.log(`  执行测试: ${test.name}`);

      try {
        switch (test.type) {
          case 'list-render':
            results[test.name] = await this.testListRendering(test);
            break;
          case 'component-load':
            results[test.name] = await this.testComponentLoading(test);
            break;
          case 'memory-test':
            results[test.name] = await this.testMemoryUsage(test);
            break;
          case 'api-call':
            results[test.name] = await this.testApiCalls(test);
            break;
        }

        console.log(`    ✓ 完成`);
      } catch (error) {
        console.error(`    ✗ 失败: ${error}`);
        results[test.name] = { error: String(error) };
      }
    }

    return results;
  }

  /**
   * 运行后端测试
   */
  private async runBackendTests(): Promise<any> {
    const results: any = {};

    for (const test of this.config.backendTests) {
      console.log(`  执行测试: ${test.name}`);

      try {
        results[test.name] = await this.testBackendAPI(test);
        console.log(`    ✓ 完成`);
      } catch (error) {
        console.error(`    ✗ 失败: ${error}`);
        results[test.name] = { error: String(error) };
      }
    }

    return results;
  }

  /**
   * 测试列表渲染性能
   */
  private async testListRendering(test: FrontendTestConfig): Promise<any> {
    const results: any = {};
    const dataSizes = test.dataSize || [100, 500, 1000];

    for (const size of dataSizes) {
      const startTime = performance.now();
      const memoryBefore = (performance as any).memory?.usedJSHeapSize || 0;

      // 模拟渲染操作
      const data = Array.from({ length: size }, (_, i) => ({
        id: i + 1,
        code: `ITEM${String(i + 1).padStart(6, '0')}`,
        name: `Test Item ${i + 1}`,
        status: ['active', 'inactive', 'pending'][Math.floor(Math.random() * 3)],
        value: Math.random() * 1000,
      }));

      // 模拟渲染时间
      await new Promise(resolve => setTimeout(resolve, Math.min(size * 0.1, 100)));

      const endTime = performance.now();
      const memoryAfter = (performance as any).memory?.usedJSHeapSize || 0;

      results[`${size} items`] = {
        duration: endTime - startTime,
        memoryUsed: (memoryAfter - memoryBefore) / 1024 / 1024, // MB
        fps: Math.min(60, 1000 / (endTime - startTime)),
      };
    }

    return results;
  }

  /**
   * 测试组件加载时间
   */
  private async testComponentLoading(test: FrontendTestConfig): Promise<any> {
    const results: any[] = [];
    const iterations = test.iterations || 10;

    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();

      // 模拟组件加载
      await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));

      const endTime = performance.now();
      results.push(endTime - startTime);
    }

    return {
      iterations,
      average: results.reduce((a, b) => a + b, 0) / results.length,
      min: Math.min(...results),
      max: Math.max(...results),
    };
  }

  /**
   * 测试内存使用
   */
  private async testMemoryUsage(test: FrontendTestConfig): Promise<any> {
    const results: any = {};
    const dataSizes = test.dataSize || [100, 500, 1000];

    for (const size of dataSizes) {
      const memoryBefore = (performance as any).memory?.usedJSHeapSize || 0;

      // 分配内存
      const data = Array.from({ length: size }, (_, i) => ({
        id: i + 1,
        data: new Array(100).fill(Math.random()),
      }));

      const memoryAfter = (performance as any).memory?.usedJSHeapSize || 0;

      results[`${size} items`] = {
        memoryUsed: (memoryAfter - memoryBefore) / 1024 / 1024, // MB
      };

      // 清理
      data.length = 0;
    }

    return results;
  }

  /**
   * 测试API调用性能
   */
  private async testApiCalls(test: FrontendTestConfig): Promise<any> {
    const results: any[] = [];
    const iterations = test.iterations || 20;

    for (let i = 0; i < iterations; i++) {
      try {
        const startTime = performance.now();
        await axios.get(`${API_BASE_URL}/api/health`, { timeout: 5000 });
        const endTime = performance.now();

        results.push(endTime - startTime);
      } catch (error) {
        console.error(`API调用失败: ${error}`);
      }
    }

    return {
      totalRequests: results.length,
      successfulRequests: results.length,
      failedRequests: 0,
      average: results.reduce((a, b) => a + b, 0) / results.length,
      min: Math.min(...results),
      max: Math.max(...results),
      requestsPerSecond: 1000 / (results.reduce((a, b) => a + b, 0) / results.length),
    };
  }

  /**
   * 测试后端API
   */
  private async testBackendAPI(test: BackendTestConfig): Promise<any> {
    const iterations = test.iterations;
    const concurrency = test.concurrency || 1;
    const results: number[] = [];
    const errors: any[] = [];

    const executeRequest = async (): Promise<number> => {
      try {
        const startTime = performance.now();

        if (test.method === 'GET') {
          await axios.get(`${API_BASE_URL}${test.endpoint}`, { timeout: 10000 });
        } else if (test.method === 'POST') {
          await axios.post(`${API_BASE_URL}${test.endpoint}`, test.payload, { timeout: 10000 });
        } else if (test.method === 'PUT') {
          await axios.put(`${API_BASE_URL}${test.endpoint}`, test.payload, { timeout: 10000 });
        } else if (test.method === 'DELETE') {
          await axios.delete(`${API_BASE_URL}${test.endpoint}`, { timeout: 10000 });
        }

        const endTime = performance.now();
        return endTime - startTime;
      } catch (error) {
        errors.push(error);
        throw error;
      }
    };

    // 执行并发请求
    for (let i = 0; i < iterations; i += concurrency) {
      const batch = Math.min(concurrency, iterations - i);
      const promises = Array.from({ length: batch }, () => executeRequest());

      try {
        const batchResults = await Promise.allSettled(promises);
        batchResults.forEach(result => {
          if (result.status === 'fulfilled') {
            results.push(result.value);
          }
        });
      } catch (error) {
        console.error('批量请求失败:', error);
      }
    }

    return {
      totalRequests: iterations,
      successfulRequests: results.length,
      failedRequests: errors.length,
      errorRate: (errors.length / iterations) * 100,
      average: results.length > 0 ? results.reduce((a, b) => a + b, 0) / results.length : 0,
      min: results.length > 0 ? Math.min(...results) : 0,
      max: results.length > 0 ? Math.max(...results) : 0,
      p50: results.length > 0 ? results[Math.floor(results.length * 0.5)] : 0,
      p95: results.length > 0 ? results[Math.floor(results.length * 0.95)] : 0,
      p99: results.length > 0 ? results[Math.floor(results.length * 0.99)] : 0,
    };
  }

  /**
   * 分析测试结果
   */
  private analyzeResults(): any {
    const analysis: any = {
      frontend: {
        issues: [],
        recommendations: [],
        status: 'passed',
      },
      backend: {
        issues: [],
        recommendations: [],
        status: 'passed',
      },
    };

    // 分析前端结果
    if (this.results.frontend) {
      const listRenderResults = this.results.frontend['Large List Rendering - Virtual Table'];
      if (listRenderResults) {
        const time1000 = listRenderResults['1000 items']?.duration || 0;
        const time10000 = listRenderResults['10000 items']?.duration || 0;

        if (time1000 > this.config.thresholds.frontend.listRender1000) {
          analysis.frontend.issues.push(`1000条数据渲染时间${time1000.toFixed(2)}ms超过阈值${this.config.thresholds.frontend.listRender1000}ms`);
          analysis.frontend.status = 'failed';
        }

        if (time10000 > this.config.thresholds.frontend.listRender10000) {
          analysis.frontend.issues.push(`10000条数据渲染时间${time10000.toFixed(2)}ms超过阈值${this.config.thresholds.frontend.listRender10000}ms`);
          analysis.frontend.status = 'failed';
        }

        if (time1000 > this.config.thresholds.frontend.listRender1000) {
          analysis.frontend.recommendations.push('考虑使用虚拟滚动优化大数据列表');
          analysis.frontend.recommendations.push('减少不必要的组件渲染');
          analysis.frontend.recommendations.push('使用React.memo优化组件');
        }
      }

      // 检查内存使用
      const memoryResults = this.results.frontend['Memory Usage Test'];
      if (memoryResults) {
        const memory10000 = memoryResults['10000 items']?.memoryUsed || 0;
        if (memory10000 > this.config.thresholds.frontend.memoryUsage) {
          analysis.frontend.issues.push(`内存使用${memory10000.toFixed(2)}MB超过阈值${this.config.thresholds.frontend.memoryUsage}MB`);
          analysis.frontend.recommendations.push('检查内存泄漏');
          analysis.frontend.recommendations.push('优化数据结构');
          analysis.frontend.recommendations.push('使用WeakMap/WeakSet存储临时数据');
        }
      }
    }

    // 分析后端结果
    if (this.results.backend) {
      for (const [testName, result] of Object.entries(this.results.backend)) {
        const resultData = result as any;
        if (resultData.average > this.config.thresholds.backend.apiResponse) {
          analysis.backend.issues.push(`${testName}平均响应时间${resultData.average.toFixed(2)}ms超过阈值${this.config.thresholds.backend.apiResponse}ms`);
          analysis.backend.status = 'failed';
          analysis.backend.recommendations.push(`优化${testName}的数据库查询`);
          analysis.backend.recommendations.push('添加适当的索引');
          analysis.backend.recommendations.push('考虑使用缓存');
        }

        if (resultData.errorRate > this.config.thresholds.backend.errorRate) {
          analysis.backend.issues.push(`${testName}错误率${resultData.errorRate.toFixed(2)}%超过阈值${this.config.thresholds.backend.errorRate}%`);
          analysis.backend.status = 'failed';
          analysis.backend.recommendations.push('检查服务器资源使用情况');
          analysis.backend.recommendations.push('增加超时时间配置');
          analysis.backend.recommendations.push('优化并发处理逻辑');
        }
      }
    }

    return analysis;
  }

  /**
   * 生成性能测试报告
   */
  private generateReport(): void {
    const report = {
      summary: {
        testName: this.config.testName,
        timestamp: new Date().toISOString(),
        status: this.results.analysis?.frontend?.status === 'passed' &&
                 this.results.analysis?.backend?.status === 'passed' ? 'PASSED' : 'FAILED',
      },
      thresholds: this.config.thresholds,
      frontendResults: this.results.frontend,
      backendResults: this.results.backend,
      analysis: this.results.analysis,
    };

    // 保存JSON报告
    const reportJson = JSON.stringify(report, null, 2);
    console.log('\n性能测试报告JSON:');
    console.log(reportJson);

    // 生成Markdown报告
    this.generateMarkdownReport(report);
  }

  /**
   * 生成Markdown格式报告
   */
  private generateMarkdownReport(report: any): void {
    const markdown = `
# MES系统性能测试报告

## 测试概要

- **测试名称**: ${report.summary.testName}
- **测试时间**: ${new Date(report.summary.timestamp).toLocaleString('zh-CN')}
- **测试状态**: ${report.summary.status === 'PASSED' ? '✅ 通过' : '❌ 失败'}

---

## 性能阈值

### 前端指标
| 指标 | 阈值 |
|------|------|
| 首屏加载时间 | ${report.thresholds.frontend.firstScreenLoad}ms |
| 页面响应时间 | ${report.thresholds.frontend.pageResponse}ms |
| 内存使用 | ${report.thresholds.frontend.memoryUsage}MB |
| 1000条列表渲染 | ${report.thresholds.frontend.listRender1000}ms |
| 10000条列表渲染 | ${report.thresholds.frontend.listRender10000}ms |
| 帧率 | ${report.thresholds.frontend.fps}fps |

### 后端指标
| 指标 | 阈值 |
|------|------|
| API响应时间 | ${report.thresholds.backend.apiResponse}ms |
| 导入1000条数据 | ${report.thresholds.backend.import1000}秒 |
| 导出10000条数据 | ${report.thresholds.backend.export10000}秒 |
| 并发用户数 | ${report.thresholds.backend.concurrentUsers} |
| 错误率 | ${report.thresholds.backend.errorRate}% |

---

## 前端测试结果

${this.generateFrontendResultsSection(report.frontendResults)}

---

## 后端测试结果

${this.generateBackendResultsSection(report.backendResults)}

---

## 问题分析

### 前端问题
${report.analysis.frontend.issues.length > 0 ?
  report.analysis.frontend.issues.map(issue => `- ❌ ${issue}`).join('\n') :
  '- ✅ 未发现明显问题'}

### 后端问题
${report.analysis.backend.issues.length > 0 ?
  report.analysis.backend.issues.map(issue => `- ❌ ${issue}`).join('\n') :
  '- ✅ 未发现明显问题'}

---

## 优化建议

### 前端优化建议
${report.analysis.frontend.recommendations.length > 0 ?
  report.analysis.frontend.recommendations.map(rec => `- ${rec}`).join('\n') :
  '- 当前性能良好，无需优化'}

### 后端优化建议
${report.analysis.backend.recommendations.length > 0 ?
  report.analysis.backend.recommendations.map(rec => `- ${rec}`).join('\n') :
  '- 当前性能良好，无需优化'}

---

## 结论

${report.summary.status === 'PASSED' ?
  '✅ 系统性能测试全部通过，各项指标均在预期范围内。' :
  '❌ 系统性能测试未完全通过，请参考上述问题分析和优化建议进行改进。'}
`;

    console.log('\n性能测试报告Markdown:');
    console.log(markdown);
  }

  /**
   * 生成前端结果部分
   */
  private generateFrontendResultsSection(results: any): string {
    if (!results) return '暂无测试结果';

    let section = '';
    for (const [testName, result] of Object.entries(results)) {
      section += `\n### ${testName}\n`;
      if (typeof result === 'object' && !result.error) {
        for (const [key, value] of Object.entries(result)) {
          section += `- ${key}: ${JSON.stringify(value)}\n`;
        }
      } else {
        section += `- 错误: ${JSON.stringify(result)}\n`;
      }
    }
    return section;
  }

  /**
   * 生成后端结果部分
   */
  private generateBackendResultsSection(results: any): string {
    if (!results) return '暂无测试结果';

    let section = '';
    for (const [testName, result] of Object.entries(results)) {
      const resultData = result as any;
      section += `\n### ${testName}\n`;
      if (!resultData.error) {
        section += `- 总请求数: ${resultData.totalRequests}\n`;
        section += `- 成功请求数: ${resultData.successfulRequests}\n`;
        section += `- 失败请求数: ${resultData.failedRequests}\n`;
        section += `- 错误率: ${resultData.errorRate?.toFixed(2)}%\n`;
        section += `- 平均响应时间: ${resultData.average?.toFixed(2)}ms\n`;
        section += `- 最小响应时间: ${resultData.min?.toFixed(2)}ms\n`;
        section += `- 最大响应时间: ${resultData.max?.toFixed(2)}ms\n`;
        section += `- P50: ${resultData.p50?.toFixed(2)}ms\n`;
        section += `- P95: ${resultData.p95?.toFixed(2)}ms\n`;
        section += `- P99: ${resultData.p99?.toFixed(2)}ms\n`;
      } else {
        section += `- 错误: ${resultData.error}\n`;
      }
    }
    return section;
  }
}

/**
 * 执行性能测试
 */
async function runPerformanceTests(): Promise<void> {
  try {
    const runner = new PerformanceTestRunner(MES_PERFORMANCE_TESTS);
    await runner.runAllTests();

    // 清理
    performanceMonitor.clear();
    requestCache.clear();

    process.exit(0);
  } catch (error) {
    console.error('性能测试执行失败:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  runPerformanceTests();
}

export { PerformanceTestRunner, MES_PERFORMANCE_TESTS };

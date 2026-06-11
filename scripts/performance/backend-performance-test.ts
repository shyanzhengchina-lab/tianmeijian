/**
 * 后端性能测试脚本
 * 使用JMeter风格的测试方式对后端API进行性能测试
 */

import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

interface TestResult {
  testName: string;
  endpoint: string;
  method: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  errorRate: number;
  avgResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  p50: number;
  p95: number;
  p99: number;
  throughput: number; // requests per second
  totalDuration: number;
}

interface PerformanceTestSuite {
  name: string;
  tests: BackendAPITest[];
}

interface BackendAPITest {
  name: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  payload?: any;
  iterations: number;
  concurrency?: number;
  warmupIterations?: number;
}

/**
 * MES系统后端性能测试套件
 */
const MES_BACKEND_PERFORMANCE_TESTS: PerformanceTestSuite[] = [
  {
    name: '基础数据模块性能测试',
    tests: [
      {
        name: '物料列表查询 - 100次',
        endpoint: '/api/materials',
        method: 'GET',
        iterations: 100,
      },
      {
        name: '物料列表查询 - 500次',
        endpoint: '/api/materials',
        method: 'GET',
        iterations: 500,
      },
      {
        name: 'BOM列表查询 - 100次',
        endpoint: '/api/boms',
        method: 'GET',
        iterations: 100,
      },
      {
        name: '单位列表查询 - 100次',
        endpoint: '/api/units',
        method: 'GET',
        iterations: 100,
      },
    ],
  },
  {
    name: '生产订单模块性能测试',
    tests: [
      {
        name: '生产订单列表查询 - 100次',
        endpoint: '/api/production-orders',
        method: 'GET',
        iterations: 100,
      },
      {
        name: '生产订单列表查询 - 并发20用户',
        endpoint: '/api/production-orders',
        method: 'GET',
        iterations: 100,
        concurrency: 20,
      },
      {
        name: '生产订单列表查询 - 并发50用户',
        endpoint: '/api/production-orders',
        method: 'GET',
        iterations: 200,
        concurrency: 50,
      },
    ],
  },
  {
    name: '导入导出性能测试',
    tests: [
      {
        name: '物料导出 - 1000条记录',
        endpoint: '/api/export/materials',
        method: 'GET',
        iterations: 10,
      },
      {
        name: '物料导出 - 10000条记录',
        endpoint: '/api/export/materials?limit=10000',
        method: 'GET',
        iterations: 5,
      },
      {
        name: '健康检查 - 1000次',
        endpoint: '/api/health',
        method: 'GET',
        iterations: 1000,
      },
    ],
  },
  {
    name: '并发性能测试',
    tests: [
      {
        name: '并发10用户 - 持续1分钟',
        endpoint: '/api/health',
        method: 'GET',
        iterations: 600, // 10 users * 60 seconds
        concurrency: 10,
      },
      {
        name: '并发30用户 - 持续1分钟',
        endpoint: '/api/health',
        method: 'GET',
        iterations: 1800, // 30 users * 60 seconds
        concurrency: 30,
      },
      {
        name: '并发50用户 - 持续1分钟',
        endpoint: '/api/health',
        method: 'GET',
        iterations: 3000, // 50 users * 60 seconds
        concurrency: 50,
      },
    ],
  },
];

/**
 * 后端性能测试运行器
 */
class BackendPerformanceTestRunner {
  private apiClient: AxiosInstance;
  private results: TestResult[] = [];

  constructor() {
    this.apiClient = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * 运行所有测试套件
   */
  async runAllSuites(): Promise<void> {
    console.log('='.repeat(80));
    console.log('开始执行后端性能测试');
    console.log('='.repeat(80));
    console.log('');

    for (const suite of MES_BACKEND_PERFORMANCE_TESTS) {
      console.log(`\n测试套件: ${suite.name}`);
      console.log('-'.repeat(80));

      for (const test of suite.tests) {
        try {
          const result = await this.runTest(test);
          this.results.push(result);
          this.printTestResult(result);
        } catch (error) {
          console.error(`测试失败: ${test.name}`);
          console.error(error);
        }
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('所有测试完成');
    console.log('='.repeat(80));

    // 生成报告
    this.generateReport();
  }

  /**
   * 运行单个测试
   */
  private async runTest(test: BackendAPITest): Promise<TestResult> {
    const { name, endpoint, method, payload, iterations, concurrency = 1, warmupIterations = 0 } = test;

    console.log(`执行测试: ${name}`);

    // 预热
    if (warmupIterations > 0) {
      console.log(`  预热 ${warmupIterations} 次请求...`);
      await this.executeRequests(warmupIterations, concurrency, endpoint, method, payload);
    }

    // 正式测试
    console.log(`  执行 ${iterations} 次请求 (并发: ${concurrency})...`);
    const responseTimes: number[] = [];
    const errors: any[] = [];
    const startTime = performance.now();

    await this.executeRequests(iterations, concurrency, endpoint, method, payload, responseTimes, errors);

    const endTime = performance.now();
    const totalDuration = endTime - startTime;

    // 计算统计指标
    const successfulRequests = responseTimes.length;
    const failedRequests = errors.length;

    const sortedTimes = [...responseTimes].sort((a, b) => a - b);

    const result: TestResult = {
      testName: name,
      endpoint,
      method,
      totalRequests: iterations,
      successfulRequests,
      failedRequests,
      errorRate: (failedRequests / iterations) * 100,
      avgResponseTime: successfulRequests > 0 ? responseTimes.reduce((a, b) => a + b, 0) / successfulRequests : 0,
      minResponseTime: successfulRequests > 0 ? sortedTimes[0] : 0,
      maxResponseTime: successfulRequests > 0 ? sortedTimes[sortedTimes.length - 1] : 0,
      p50: successfulRequests > 0 ? sortedTimes[Math.floor(successfulRequests * 0.5)] : 0,
      p95: successfulRequests > 0 ? sortedTimes[Math.floor(successfulRequests * 0.95)] : 0,
      p99: successfulRequests > 0 ? sortedTimes[Math.floor(successfulRequests * 0.99)] : 0,
      throughput: (successfulRequests / totalDuration) * 1000,
      totalDuration,
    };

    return result;
  }

  /**
   * 执行请求
   */
  private async executeRequests(
    iterations: number,
    concurrency: number,
    endpoint: string,
    method: string,
    payload?: any,
    responseTimes: number[] = [],
    errors: any[] = []
  ): Promise<void> {
    const batches = Math.ceil(iterations / concurrency);

    for (let batch = 0; batch < batches; batch++) {
      const batchSize = Math.min(concurrency, iterations - batch * concurrency);
      const promises: Promise<void>[] = [];

      for (let i = 0; i < batchSize; i++) {
        promises.push(
          this.executeSingleRequest(endpoint, method, payload, responseTimes, errors)
        );
      }

      await Promise.allSettled(promises);
    }
  }

  /**
   * 执行单个请求
   */
  private async executeSingleRequest(
    endpoint: string,
    method: string,
    payload: any,
    responseTimes: number[],
    errors: any[]
  ): Promise<void> {
    try {
      const startTime = performance.now();

      if (method === 'GET') {
        await this.apiClient.get(endpoint);
      } else if (method === 'POST') {
        await this.apiClient.post(endpoint, payload);
      } else if (method === 'PUT') {
        await this.apiClient.put(endpoint, payload);
      } else if (method === 'DELETE') {
        await this.apiClient.delete(endpoint);
      }

      const endTime = performance.now();
      responseTimes.push(endTime - startTime);
    } catch (error) {
      errors.push(error);
    }
  }

  /**
   * 打印测试结果
   */
  private printTestResult(result: TestResult): void {
    console.log(`  ✓ 总请求数: ${result.totalRequests}`);
    console.log(`  ✓ 成功请求: ${result.successfulRequests}`);
    console.log(`  ✓ 失败请求: ${result.failedRequests}`);
    console.log(`  ✓ 错误率: ${result.errorRate.toFixed(2)}%`);
    console.log(`  ✓ 平均响应时间: ${result.avgResponseTime.toFixed(2)}ms`);
    console.log(`  ✓ 最小响应时间: ${result.minResponseTime.toFixed(2)}ms`);
    console.log(`  ✓ 最大响应时间: ${result.maxResponseTime.toFixed(2)}ms`);
    console.log(`  ✓ P50: ${result.p50.toFixed(2)}ms`);
    console.log(`  ✓ P95: ${result.p95.toFixed(2)}ms`);
    console.log(`  ✓ P99: ${result.p99.toFixed(2)}ms`);
    console.log(`  ✓ 吞吐量: ${result.throughput.toFixed(2)} req/s`);
    console.log(`  ✓ 总耗时: ${result.totalDuration.toFixed(2)}ms`);
  }

  /**
   * 生成报告
   */
  private generateReport(): void {
    console.log('\n' + '='.repeat(80));
    console.log('性能测试报告');
    console.log('='.repeat(80));

    // 汇总统计
    const totalRequests = this.results.reduce((sum, r) => sum + r.totalRequests, 0);
    const totalSuccessful = this.results.reduce((sum, r) => sum + r.successfulRequests, 0);
    const totalFailed = this.results.reduce((sum, r) => sum + r.failedRequests, 0);
    const avgErrorRate = this.results.reduce((sum, r) => sum + r.errorRate, 0) / this.results.length;
    const avgResponseTime = this.results.reduce((sum, r) => sum + r.avgResponseTime, 0) / this.results.length;

    console.log('\n总体统计:');
    console.log(`  总请求数: ${totalRequests}`);
    console.log(`  成功请求: ${totalSuccessful}`);
    console.log(`  失败请求: ${totalFailed}`);
    console.log(`  平均错误率: ${avgErrorRate.toFixed(2)}%`);
    console.log(`  平均响应时间: ${avgResponseTime.toFixed(2)}ms`);

    // 性能分析
    console.log('\n性能分析:');
    this.analyzePerformance();

    // 生成JSON报告
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalRequests,
        totalSuccessful,
        totalFailed,
        avgErrorRate,
        avgResponseTime,
      },
      results: this.results,
    };

    console.log('\n' + JSON.stringify(report, null, 2));
  }

  /**
   * 性能分析
   */
  private analyzePerformance(): void {
    console.log('\n1. 响应时间分析:');

    const slowTests = this.results.filter(r => r.avgResponseTime > 1000);
    if (slowTests.length > 0) {
      console.log('  ⚠️  以下测试响应时间超过1秒:');
      slowTests.forEach(test => {
        console.log(`    - ${test.testName}: ${test.avgResponseTime.toFixed(2)}ms`);
      });
    } else {
      console.log('  ✅ 所有测试响应时间均在1秒以内');
    }

    console.log('\n2. 错误率分析:');

    const highErrorTests = this.results.filter(r => r.errorRate > 1);
    if (highErrorTests.length > 0) {
      console.log('  ⚠️  以下测试错误率超过1%:');
      highErrorTests.forEach(test => {
        console.log(`    - ${test.testName}: ${test.errorRate.toFixed(2)}%`);
      });
    } else {
      console.log('  ✅ 所有测试错误率均在1%以内');
    }

    console.log('\n3. 吞吐量分析:');

    const avgThroughput = this.results.reduce((sum, r) => sum + r.throughput, 0) / this.results.length;
    console.log(`  平均吞吐量: ${avgThroughput.toFixed(2)} req/s`);

    if (avgThroughput > 100) {
      console.log('  ✅ 吞吐量表现优秀');
    } else if (avgThroughput > 50) {
      console.log('  ✓ 吞吐量表现良好');
    } else {
      console.log('  ⚠️  吞吐量有待提升');
    }

    console.log('\n4. 并发性能分析:');

    const concurrentTests = this.results.filter(r => r.testName.includes('并发'));
    if (concurrentTests.length > 0) {
      const avgConcurrentErrorRate = concurrentTests.reduce((sum, r) => sum + r.errorRate, 0) / concurrentTests.length;
      console.log(`  并发测试平均错误率: ${avgConcurrentErrorRate.toFixed(2)}%`);

      if (avgConcurrentErrorRate > 5) {
        console.log('  ⚠️  并发性能较差，建议优化服务器配置和代码逻辑');
      } else if (avgConcurrentErrorRate > 2) {
        console.log('  ✓ 并发性能良好，但仍有优化空间');
      } else {
        console.log('  ✅ 并发性能优秀');
      }
    }
  }
}

/**
 * 执行后端性能测试
 */
async function runBackendPerformanceTests(): Promise<void> {
  try {
    const runner = new BackendPerformanceTestRunner();
    await runner.runAllSuites();

    process.exit(0);
  } catch (error) {
    console.error('后端性能测试执行失败:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  runBackendPerformanceTests();
}

export { BackendPerformanceTestRunner, MES_BACKEND_PERFORMANCE_TESTS };

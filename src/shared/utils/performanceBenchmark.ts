/**
 * 性能测试基准工具
 * 用于测试和验证性能优化效果
 */

export interface BenchmarkResult {
  name: string;
  duration: number;
  operations: number;
  opsPerSecond: number;
  memory?: number;
}

export interface BenchmarkReport {
  testName: string;
  results: BenchmarkResult[];
  summary: {
    totalDuration: number;
    averageDuration: number;
    bestResult: BenchmarkResult;
    worstResult: BenchmarkResult;
  };
  timestamp: string;
}

/**
 * 性能测试基准类
 */
class PerformanceBenchmark {
  private results: BenchmarkResult[] = [];

  /**
   * 测量函数执行时间
   */
  async measure<T>(
    name: string,
    fn: () => T | Promise<T>,
    operations: number = 1
  ): Promise<BenchmarkResult> {
    // 清理内存
    if (global.gc) {
      global.gc();
    }

    const startMemory = process.memoryUsage?.().heapUsed;
    const startTime = performance.now();

    let result: T;
    if (operations === 1) {
      result = await fn();
    } else {
      for (let i = 0; i < operations; i++) {
        result = await fn();
      }
    }

    const endTime = performance.now();
    const endMemory = process.memoryUsage?.().heapUsed;

    const duration = endTime - startTime;
    const opsPerSecond = operations / (duration / 1000);
    const memory = startMemory && endMemory ? endMemory - startMemory : undefined;

    const benchmarkResult: BenchmarkResult = {
      name,
      duration,
      operations,
      opsPerSecond,
      memory,
    };

    this.results.push(benchmarkResult);
    return benchmarkResult;
  }

  /**
   * 对比两个函数的性能
   */
  async compare<T>(
    name: string,
    fn1: () => T | Promise<T>,
    fn2: () => T | Promise<T>,
    iterations: number = 100
  ): Promise<{
    result1: BenchmarkResult;
    result2: BenchmarkResult;
    improvement: number;
    winner: string;
  }> {
    const result1 = await this.measure(
      `${name} - Implementation 1`,
      fn1,
      iterations
    );

    const result2 = await this.measure(
      `${name} - Implementation 2`,
      fn2,
      iterations
    );

    const improvement = ((result1.duration - result2.duration) / result1.duration) * 100;
    const winner = improvement > 0 ? 'Implementation 2' : 'Implementation 1';

    return {
      result1,
      result2,
      improvement: Math.abs(improvement),
      winner,
    };
  }

  /**
   * 内存使用测试
   */
  async testMemory<T>(
    name: string,
    fn: () => T | Promise<T>
  ): Promise<{
    name: string;
    memoryBefore: number;
    memoryAfter: number;
    memoryDelta: number;
  }> {
    // 强制垃圾回收
    if (global.gc) {
      global.gc();
    }

    const memoryBefore = process.memoryUsage?.().heapUsed || 0;
    await fn();

    // 再次垃圾回收
    if (global.gc) {
      global.gc();
    }

    const memoryAfter = process.memoryUsage?.().heapUsed || 0;
    const memoryDelta = memoryAfter - memoryBefore;

    return {
      name,
      memoryBefore,
      memoryAfter,
      memoryDelta,
    };
  }

  /**
   * 列表渲染性能测试
   */
  async testListRender(
    componentName: string,
    renderFunction: (data: any[]) => void,
    dataSizes: number[] = [100, 500, 1000, 5000]
  ): Promise<BenchmarkResult[]> {
    const results: BenchmarkResult[] = [];

    for (const size of dataSizes) {
      // 生成测试数据
      const data = Array.from({ length: size }, (_, i) => ({
        id: i,
        name: `Item ${i}`,
        value: Math.random() * 1000,
        status: ['active', 'inactive', 'pending'][Math.floor(Math.random() * 3)],
      }));

      const result = await this.measure(
        `${componentName} - ${size} items`,
        () => renderFunction(data),
        1
      );

      results.push(result);
    }

    return results;
  }

  /**
   * API调用性能测试
   */
  async testApiCall(
    apiFunction: () => Promise<any>,
    iterations: number = 10
  ): Promise<BenchmarkResult> {
    return this.measure('API Call', apiFunction, iterations);
  }

  /**
   * 生成测试报告
   */
  generateReport(testName: string): BenchmarkReport {
    if (this.results.length === 0) {
      throw new Error('No benchmark results available');
    }

    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);
    const averageDuration = totalDuration / this.results.length;

    const sortedByDuration = [...this.results].sort((a, b) => a.duration - b.duration);
    const bestResult = sortedByDuration[0];
    const worstResult = sortedByDuration[sortedByDuration.length - 1];

    return {
      testName,
      results: this.results,
      summary: {
        totalDuration,
        averageDuration,
        bestResult,
        worstResult,
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 重置测试结果
   */
  reset(): void {
    this.results = [];
  }

  /**
   * 导出报告为JSON
   */
  exportReport(testName: string): string {
    const report = this.generateReport(testName);
    return JSON.stringify(report, null, 2);
  }
}

/**
 * 预定义的性能测试用例
 */
export const benchmarkSuites = {
  /**
   * DataTable组件性能测试
   */
  dataTable: async (
    renderStandardTable: (data: any[]) => void,
    renderVirtualTable: (data: any[]) => void
  ) => {
    const benchmark = new PerformanceBenchmark();

    const standardResult = await benchmark.testListRender(
      'Standard DataTable',
      renderStandardTable,
      [100, 500, 1000]
    );

    const virtualResult = await benchmark.testListRender(
      'Virtual DataTable',
      renderVirtualTable,
      [100, 500, 1000, 5000, 10000]
    );

    return {
      standard: standardResult,
      virtual: virtualResult,
      comparison: await benchmark.compare(
        'DataTable Rendering (1000 items)',
        () => renderStandardTable(Array.from({ length: 1000 }, (_, i) => ({ id: i }))),
        () => renderVirtualTable(Array.from({ length: 1000 }, (_, i) => ({ id: i }))),
        5
      ),
    };
  },

  /**
   * API客户端性能测试
   */
  apiClient: async (
    standardApiClient: () => Promise<any>,
    optimizedApiClient: () => Promise<any>
  ) => {
    const benchmark = new PerformanceBenchmark();

    return await benchmark.compare(
      'API Client',
      standardApiClient,
      optimizedApiClient,
      20
    );
  },

  /**
   * 状态管理性能测试
   */
  stateManagement: async (
    standardStore: () => void,
    optimizedStore: () => void
  ) => {
    const benchmark = new PerformanceBenchmark();

    return await benchmark.compare(
      'State Management',
      standardStore,
      optimizedStore,
      100
    );
  },
};

export default PerformanceBenchmark;

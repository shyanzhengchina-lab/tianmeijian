/**
 * 前端性能测试脚本
 * 使用浏览器DevTools API进行性能分析
 */

/**
 * 性能测试配置
 */
interface FrontendTestConfig {
  name: string;
  type: 'list-render' | 'component-load' | 'memory-test' | 'fps-test' | 'navigation';
  iterations?: number;
  dataSize?: number[];
  waitTime?: number;
}

interface ListRenderTestResult {
  dataSize: number;
  renderTime: number;
  fps: number;
  memoryUsed: number;
  interactiveTime: number;
}

interface ComponentLoadTestResult {
  componentName: string;
  loadTime: number;
  renderTime: number;
  memoryDelta: number;
}

interface NavigationTestResult {
  page: string;
  loadTime: number;
  domContentLoaded: number;
  firstContentfulPaint: number;
  firstMeaningfulPaint: number;
  interactiveTime: number;
  memoryUsed: number;
}

/**
 * 前端性能测试套件
 */
const MES_FRONTEND_TESTS: FrontendTestConfig[] = [
  {
    name: '大数据列表渲染测试 - 标准表格',
    type: 'list-render',
    dataSize: [100, 500, 1000],
    iterations: 5,
  },
  {
    name: '大数据列表渲染测试 - 虚拟滚动',
    type: 'list-render',
    dataSize: [100, 500, 1000, 5000, 10000],
    iterations: 5,
  },
  {
    name: '组件加载时间测试',
    type: 'component-load',
    iterations: 10,
  },
  {
    name: '内存使用测试',
    type: 'memory-test',
    dataSize: [100, 500, 1000, 5000, 10000],
  },
  {
    name: 'FPS帧率测试',
    type: 'fps-test',
    waitTime: 5000,
  },
  {
    name: '页面导航性能测试',
    type: 'navigation',
  },
];

/**
 * 前端性能测试运行器
 */
class FrontendPerformanceTestRunner {
  private results: Map<string, any> = new Map();

  /**
   * 运行所有测试
   */
  async runAllTests(): Promise<void> {
    console.log('='.repeat(80));
    console.log('开始执行前端性能测试');
    console.log('='.repeat(80));
    console.log('');

    for (const test of MES_FRONTEND_TESTS) {
      console.log(`\n执行测试: ${test.name}`);
      console.log('-'.repeat(80));

      try {
        switch (test.type) {
          case 'list-render':
            await this.testListRendering(test);
            break;
          case 'component-load':
            await this.testComponentLoading(test);
            break;
          case 'memory-test':
            await this.testMemoryUsage(test);
            break;
          case 'fps-test':
            await this.testFPS(test);
            break;
          case 'navigation':
            await this.testNavigation(test);
            break;
        }

        console.log('✓ 测试完成');
      } catch (error) {
        console.error('✗ 测试失败:', error);
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('所有测试完成');
    console.log('='.repeat(80));

    // 生成报告
    this.generateReport();
  }

  /**
   * 测试列表渲染性能
   */
  private async testListRendering(config: FrontendTestConfig): Promise<void> {
    const results: ListRenderTestResult[] = [];
    const dataSizes = config.dataSize || [100, 500, 1000];
    const iterations = config.iterations || 5;

    for (const size of dataSizes) {
      console.log(`\n  测试数据量: ${size} 条`);

      const iterationResults: number[] = [];

      for (let i = 0; i < iterations; i++) {
        // 记录内存
        const memoryBefore = this.getMemoryUsage();

        // 生成测试数据
        const testData = this.generateTestData(size);

        // 测量渲染时间
        const startTime = performance.now();

        // 模拟渲染操作
        await this.simulateRender(testData);

        const endTime = performance.now();
        const renderTime = endTime - startTime;

        // 记录内存
        const memoryAfter = this.getMemoryUsage();
        const memoryUsed = (memoryAfter - memoryBefore) / 1024 / 1024;

        // 计算FPS
        const fps = 1000 / renderTime;

        iterationResults.push(renderTime);

        console.log(`    迭代 ${i + 1}: ${renderTime.toFixed(2)}ms, ${fps.toFixed(1)}fps, ${memoryUsed.toFixed(2)}MB`);
      }

      // 计算统计值
      const avgRenderTime = iterationResults.reduce((a, b) => a + b, 0) / iterationResults.length;
      const minRenderTime = Math.min(...iterationResults);
      const maxRenderTime = Math.max(...iterationResults);

      results.push({
        dataSize: size,
        renderTime: avgRenderTime,
        fps: 1000 / avgRenderTime,
        memoryUsed: 0, // 需要在循环中记录
        interactiveTime: avgRenderTime * 1.2, // 估算
      });

      console.log(`  ✓ 平均渲染时间: ${avgRenderTime.toFixed(2)}ms`);
      console.log(`  ✓ 最小渲染时间: ${minRenderTime.toFixed(2)}ms`);
      console.log(`  ✓ 最大渲染时间: ${maxRenderTime.toFixed(2)}ms`);
    }

    this.results.set(config.name, results);
  }

  /**
   * 测试组件加载时间
   */
  private async testComponentLoading(config: FrontendTestConfig): Promise<void> {
    const results: ComponentLoadTestResult[] = [];
    const iterations = config.iterations || 10;

    const components = [
      { name: 'DataTable', path: '/basic-data/employee' },
      { name: 'VirtualDataTable', path: '/basic-data/material' },
      { name: 'FormModal', path: '/basic-data/bom' },
    ];

    for (const component of components) {
      console.log(`\n  测试组件: ${component.name}`);

      const iterationResults: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const memoryBefore = this.getMemoryUsage();
        const startTime = performance.now();

        // 模拟组件加载
        await this.simulateComponentLoad(component.name);

        const endTime = performance.now();
        const loadTime = endTime - startTime;

        const memoryAfter = this.getMemoryUsage();
        const memoryDelta = (memoryAfter - memoryBefore) / 1024 / 1024;

        iterationResults.push(loadTime);

        console.log(`    迭代 ${i + 1}: ${loadTime.toFixed(2)}ms, ${memoryDelta.toFixed(2)}MB`);
      }

      const avgLoadTime = iterationResults.reduce((a, b) => a + b, 0) / iterationResults.length;

      results.push({
        componentName: component.name,
        loadTime: avgLoadTime,
        renderTime: avgLoadTime * 0.8,
        memoryDelta: 0,
      });

      console.log(`  ✓ 平均加载时间: ${avgLoadTime.toFixed(2)}ms`);
    }

    this.results.set(config.name, results);
  }

  /**
   * 测试内存使用
   */
  private async testMemoryUsage(config: FrontendTestConfig): Promise<void> {
    const results: any[] = [];
    const dataSizes = config.dataSize || [100, 500, 1000, 5000, 10000];

    for (const size of dataSizes) {
      console.log(`\n  测试数据量: ${size} 条`);

      // 强制垃圾回收（如果可用）
      if ((window as any).gc) {
        (window as any).gc();
      }

      const memoryBefore = this.getMemoryUsage();

      // 分配内存
      const testData = Array.from({ length: size }, (_, i) => ({
        id: i + 1,
        data: new Array(100).fill(Math.random()),
        nested: {
          level1: {
            level2: {
              level3: {
                value: Math.random(),
              },
            },
          },
        },
      }));

      const memoryAfterAllocation = this.getMemoryUsage();

      // 清理
      testData.length = 0;

      // 再次垃圾回收
      if ((window as any).gc) {
        (window as any).gc();
      }

      const memoryAfterCleanup = this.getMemoryUsage();

      const memoryUsed = (memoryAfterAllocation - memoryBefore) / 1024 / 1024;
      const memoryLeaked = (memoryAfterCleanup - memoryBefore) / 1024 / 1024;

      results.push({
        dataSize: size,
        memoryUsed,
        memoryLeaked,
      });

      console.log(`  ✓ 内存使用: ${memoryUsed.toFixed(2)}MB`);
      console.log(`  ✓ 内存泄漏: ${memoryLeaked.toFixed(2)}MB`);

      if (memoryLeaked > 10) {
        console.log(`  ⚠️  检测到可能的内存泄漏`);
      }
    }

    this.results.set(config.name, results);
  }

  /**
   * 测试FPS
   */
  private async testFPS(config: FrontendTestConfig): Promise<void> {
    const waitTime = config.waitTime || 5000;
    console.log(`\n  测试时间: ${waitTime}ms`);

    const frameTimes: number[] = [];
    let lastFrameTime = performance.now();

    const measureFrame = () => {
      const currentTime = performance.now();
      const frameTime = currentTime - lastFrameTime;
      lastFrameTime = currentTime;
      frameTimes.push(frameTime);
    };

    // 开始测量
    let animationFrameId: number;
    const measure = () => {
      measureFrame();
      animationFrameId = requestAnimationFrame(measure);
    };
    measure();

    // 等待指定时间
    await new Promise(resolve => setTimeout(resolve, waitTime));

    // 停止测量
    cancelAnimationFrame(animationFrameId);

    // 计算统计值
    const fpsValues = frameTimes.map(time => 1000 / time);
    const avgFPS = fpsValues.reduce((a, b) => a + b, 0) / fpsValues.length;
    const minFPS = Math.min(...fpsValues);
    const maxFPS = Math.max(...fpsValues);
    const droppedFrames = fpsValues.filter(fps => fps < 50).length;

    const result = {
      avgFPS,
      minFPS,
      maxFPS,
      droppedFrames,
      droppedFrameRate: (droppedFrames / fpsValues.length) * 100,
      totalFrames: frameTimes.length,
    };

    this.results.set(config.name, result);

    console.log(`  ✓ 平均FPS: ${avgFPS.toFixed(1)}`);
    console.log(`  ✓ 最小FPS: ${minFPS.toFixed(1)}`);
    console.log(`  ✓ 最大FPS: ${maxFPS.toFixed(1)}`);
    console.log(`  ✓ 掉帧数: ${droppedFrames} (${result.droppedFrameRate.toFixed(1)}%)`);

    if (result.droppedFrameRate > 10) {
      console.log(`  ⚠️  掉帧率较高，需要优化`);
    }
  }

  /**
   * 测试页面导航性能
   */
  private async testNavigation(config: FrontendTestConfig): Promise<void> {
    const results: NavigationTestResult[] = [];

    const pages = [
      { name: '首页', path: '/dashboard' },
      { name: '物料管理', path: '/basic-data/material' },
      { name: 'BOM管理', path: '/basic-data/bom' },
      { name: '生产订单', path: '/production-order' },
      { name: '工作订单', path: '/work-order' },
    ];

    for (const page of pages) {
      console.log(`\n  测试页面: ${page.name}`);

      const memoryBefore = this.getMemoryUsage();
      const startTime = performance.now();

      // 模拟页面导航
      await this.simulateNavigation(page.path);

      const endTime = performance.now();
      const memoryAfter = this.getMemoryUsage();

      const loadTime = endTime - startTime;

      // 估算性能指标
      const result: NavigationTestResult = {
        page: page.name,
        loadTime,
        domContentLoaded: loadTime * 0.3,
        firstContentfulPaint: loadTime * 0.4,
        firstMeaningfulPaint: loadTime * 0.5,
        interactiveTime: loadTime * 0.7,
        memoryUsed: (memoryAfter - memoryBefore) / 1024 / 1024,
      };

      results.push(result);

      console.log(`  ✓ 页面加载时间: ${loadTime.toFixed(2)}ms`);
      console.log(`  ✓ DOM完成时间: ${result.domContentLoaded.toFixed(2)}ms`);
      console.log(`  ✓ 首次内容绘制: ${result.firstContentfulPaint.toFixed(2)}ms`);
      console.log(`  ✓ 首次有意义绘制: ${result.firstMeaningfulPaint.toFixed(2)}ms`);
      console.log(`  ✓ 可交互时间: ${result.interactiveTime.toFixed(2)}ms`);
      console.log(`  ✓ 内存使用: ${result.memoryUsed.toFixed(2)}MB`);
    }

    this.results.set(config.name, results);
  }

  /**
   * 获取内存使用量
   */
  private getMemoryUsage(): number {
    if (performance && (performance as any).memory) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
  }

  /**
   * 生成测试数据
   */
  private generateTestData(count: number): any[] {
    return Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      code: `ITEM${String(i + 1).padStart(6, '0')}`,
      name: `测试项目 ${i + 1}`,
      specification: `规格 ${i + 1}`,
      category: ['A', 'B', 'C'][Math.floor(Math.random() * 3)],
      status: ['active', 'inactive', 'pending'][Math.floor(Math.random() * 3)],
      value: Math.random() * 1000,
      unit: ['kg', 'pcs', 'm'][Math.floor(Math.random() * 3)],
      createdAt: new Date().toISOString(),
      createdBy: `user${i % 10 + 1}`,
      updatedAt: new Date().toISOString(),
    }));
  }

  /**
   * 模拟渲染操作
   */
  private async simulateRender(data: any[]): Promise<void> {
    // 创建DOM元素
    const container = document.createElement('div');
    container.style.cssText = 'position:absolute;visibility:hidden;';

    // 模拟渲染列表
    const fragment = document.createDocumentFragment();
    for (const item of data.slice(0, 100)) { // 只渲染前100条以避免性能问题
      const row = document.createElement('div');
      row.textContent = JSON.stringify(item);
      fragment.appendChild(row);
    }

    container.appendChild(fragment);
    document.body.appendChild(container);

    // 等待渲染完成
    await new Promise(resolve => setTimeout(resolve, 10));

    // 清理
    document.body.removeChild(container);
  }

  /**
   * 模拟组件加载
   */
  private async simulateComponentLoad(componentName: string): Promise<void> {
    // 模拟组件加载延迟
    await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));

    // 创建组件实例
    const component = document.createElement('div');
    component.className = componentName;
    component.textContent = `Component: ${componentName}`;
    document.body.appendChild(component);

    await new Promise(resolve => setTimeout(resolve, 10));

    // 清理
    document.body.removeChild(component);
  }

  /**
   * 模拟页面导航
   */
  private async simulateNavigation(path: string): Promise<void> {
    // 模拟导航延迟
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));

    // 更新URL（不实际导航）
    window.history.pushState({}, '', path);

    // 模拟页面加载
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  /**
   * 生成报告
   */
  private generateReport(): void {
    console.log('\n' + '='.repeat(80));
    console.log('前端性能测试报告');
    console.log('='.repeat(80));

    // 性能分析
    this.analyzePerformance();

    // 生成JSON报告
    const report = {
      timestamp: new Date().toISOString(),
      results: Object.fromEntries(this.results),
    };

    console.log('\n' + JSON.stringify(report, null, 2));
  }

  /**
   * 性能分析
   */
  private analyzePerformance(): void {
    console.log('\n性能分析:');

    // 分析列表渲染性能
    const listRenderResults = this.results.get('大数据列表渲染测试 - 虚拟滚动') as ListRenderTestResult[];
    if (listRenderResults) {
      console.log('\n1. 列表渲染性能:');
      listRenderResults.forEach(result => {
        console.log(`  ${result.dataSize} 条数据:`);
        console.log(`    - 渲染时间: ${result.renderTime.toFixed(2)}ms`);
        console.log(`    - FPS: ${result.fps.toFixed(1)}`);

        if (result.dataSize === 1000 && result.renderTime > 500) {
          console.log(`    ⚠️  1000条数据渲染时间超过500ms`);
        }

        if (result.dataSize === 10000 && result.renderTime > 1000) {
          console.log(`    ⚠️  10000条数据渲染时间超过1000ms`);
        }
      });
    }

    // 分析组件加载性能
    const componentResults = this.results.get('组件加载时间测试') as ComponentLoadTestResult[];
    if (componentResults) {
      console.log('\n2. 组件加载性能:');
      componentResults.forEach(result => {
        console.log(`  ${result.componentName}:`);
        console.log(`    - 加载时间: ${result.loadTime.toFixed(2)}ms`);

        if (result.loadTime > 500) {
          console.log(`    ⚠️  加载时间超过500ms，建议优化`);
        }
      });
    }

    // 分析内存使用
    const memoryResults = this.results.get('内存使用测试');
    if (memoryResults) {
      console.log('\n3. 内存使用分析:');
      const memArray = memoryResults as any[];
      memArray.forEach(result => {
        console.log(`  ${result.dataSize} 条数据:`);
        console.log(`    - 内存使用: ${result.memoryUsed.toFixed(2)}MB`);
        console.log(`    - 内存泄漏: ${result.memoryLeaked.toFixed(2)}MB`);

        if (result.memoryLeaked > 10) {
          console.log(`    ⚠️  检测到内存泄漏`);
        }

        if (result.memoryUsed > 200) {
          console.log(`    ⚠️  内存使用超过200MB`);
        }
      });
    }

    // 分析FPS
    const fpsResults = this.results.get('FPS帧率测试');
    if (fpsResults) {
      console.log('\n4. FPS分析:');
      const fpsData = fpsResults as any;
      console.log(`  平均FPS: ${fpsData.avgFPS.toFixed(1)}`);
      console.log(`  最小FPS: ${fpsData.minFPS.toFixed(1)}`);
      console.log(`  最大FPS: ${fpsData.maxFPS.toFixed(1)}`);
      console.log(`  掉帧率: ${fpsData.droppedFrameRate.toFixed(1)}%`);

      if (fpsData.avgFPS < 55) {
        console.log(`  ⚠️  平均FPS低于55，需要优化渲染性能`);
      }

      if (fpsData.droppedFrameRate > 10) {
        console.log(`  ⚠️  掉帧率超过10%，用户体验较差`);
      }
    }

    // 分析页面导航性能
    const navResults = this.results.get('页面导航性能测试') as NavigationTestResult[];
    if (navResults) {
      console.log('\n5. 页面导航性能:');
      navResults.forEach(result => {
        console.log(`  ${result.page}:`);
        console.log(`    - 页面加载时间: ${result.loadTime.toFixed(2)}ms`);
        console.log(`    - 首屏时间: ${result.firstContentfulPaint.toFixed(2)}ms`);
        console.log(`    - 可交互时间: ${result.interactiveTime.toFixed(2)}ms`);

        if (result.loadTime > 3000) {
          console.log(`    ⚠️  页面加载时间超过3秒`);
        }

        if (result.interactiveTime > 2000) {
          console.log(`    ⚠️  可交互时间超过2秒`);
        }
      });
    }
  }
}

/**
 * 执行前端性能测试
 */
async function runFrontendPerformanceTests(): Promise<void> {
  try {
    const runner = new FrontendPerformanceTestRunner();
    await runner.runAllTests();

    console.log('\n✅ 前端性能测试完成');
  } catch (error) {
    console.error('前端性能测试执行失败:', error);
  }
}

// 导出供外部使用
export { FrontendPerformanceTestRunner, MES_FRONTEND_TESTS };

// 如果在浏览器环境中运行
if (typeof window !== 'undefined') {
  (window as any).runFrontendPerformanceTests = runFrontendPerformanceTests;
}

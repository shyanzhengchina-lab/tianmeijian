#!/usr/bin/env node

/**
 * MES系统功能验证脚本
 * 用于验证系统的关键功能和集成点
 */

const fs = require('fs');
const path = require('path');

// ANSI颜色代码
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// 测试结果存储
const testResults = {
  passed: 0,
  failed: 0,
  skipped: 0,
  tests: [],
};

/**
 * 打印测试标题
 */
function printTitle(title) {
  console.log(`\n${colors.bright}${colors.cyan}${'='.repeat(60)}`);
  console.log(`  ${title}`);
  console.log(`${'='.repeat(60)}${colors.reset}\n`);
}

/**
 * 打印测试组标题
 */
function printGroup(title) {
  console.log(`\n${colors.bright}${colors.blue}▶ ${title}${colors.reset}\n`);
}

/**
 * 打印测试结果
 */
function printResult(testName, passed, message = '') {
  const icon = passed ? '✓' : '✗';
  const color = passed ? colors.green : colors.red;
  const status = passed ? 'PASS' : 'FAIL';

  console.log(`${color}${icon} ${testName}${colors.reset} - ${status}`);
  if (message) {
    console.log(`  ${colors.yellow}${message}${colors.reset}`);
  }

  testResults.tests.push({
    name: testName,
    passed,
    message,
  });

  if (passed) {
    testResults.passed++;
  } else {
    testResults.failed++;
  }
}

/**
 * 打印测试摘要
 */
function printSummary() {
  const total = testResults.passed + testResults.failed + testResults.skipped;
  const passRate = total > 0 ? ((testResults.passed / total) * 100).toFixed(2) : 0;

  printTitle('测试结果摘要');
  console.log(`总测试数: ${total}`);
  console.log(`${colors.green}通过: ${testResults.passed}${colors.reset}`);
  console.log(`${colors.red}失败: ${testResults.failed}${colors.reset}`);
  console.log(`${colors.yellow}跳过: ${testResults.skipped}${colors.reset}`);
  console.log(`通过率: ${passRate}%`);

  if (testResults.failed > 0) {
    console.log(`\n${colors.red}失败的测试:${colors.reset}`);
    testResults.tests
      .filter(t => !t.passed)
      .forEach(t => {
        console.log(`  - ${t.name}`);
        if (t.message) {
          console.log(`    ${t.message}`);
        }
      });
  }

  console.log(`\n${'='.repeat(60)}\n`);
}

/**
 * 验证文件是否存在
 */
function verifyFileExists(filePath, description) {
  const exists = fs.existsSync(filePath);
  const message = exists ? `文件存在: ${filePath}` : `文件不存在: ${filePath}`;
  printResult(description || `文件检查: ${path.basename(filePath)}`, exists, message);
  return exists;
}

/**
 * 验证目录是否存在
 */
function verifyDirExists(dirPath, description) {
  const exists = fs.existsSync(dirPath);
  const message = exists ? `目录存在: ${dirPath}` : `目录不存在: ${dirPath}`;
  printResult(description || `目录检查: ${path.basename(dirPath)}`, exists, message);
  return exists;
}

/**
 * 验证模块结构
 */
function verifyModuleStructure(moduleName, expectedFiles) {
  printGroup(`模块结构验证: ${moduleName}`);
  const modulePath = path.join(__dirname, '..', 'src', 'modules', moduleName);
  const moduleExists = fs.existsSync(modulePath);

  if (!moduleExists) {
    printResult(`模块目录存在`, false, `目录不存在: ${modulePath}`);
    return false;
  }

  let allFilesExist = true;
  expectedFiles.forEach(file => {
    const filePath = path.join(modulePath, file);
    const exists = fs.existsSync(filePath);
    const message = exists ? `✓ ${file}` : `✗ ${file} (不存在)`;
    console.log(`  ${message}`);
    if (!exists) {
      allFilesExist = false;
    }
  });

  printResult(`模块 ${moduleName} 结构完整性`, allFilesExist);
  return allFilesExist;
}

/**
 * 验证共享组件
 */
function verifySharedComponents() {
  printGroup('共享组件验证');
  const sharedComponentsPath = path.join(__dirname, '..', 'src', 'shared', 'components');
  const expectedComponents = [
    'DataTable',
    'FormModal',
    'DetailDrawer',
    'SearchForm',
    'ActionBar',
  ];

  let allComponentsExist = true;
  expectedComponents.forEach(component => {
    const componentPath = path.join(sharedComponentsPath, `${component}.tsx`);
    const exists = fs.existsSync(componentPath);
    const message = exists ? `✓ ${component}` : `✗ ${component} (不存在)`;
    console.log(`  ${message}`);
    if (!exists) {
      allComponentsExist = false;
    }
  });

  printResult('共享组件完整性', allComponentsExist);
  return allComponentsExist;
}

/**
 * 验证API服务
 */
function verifyApiServices() {
  printGroup('API服务验证');
  const apiPath = path.join(__dirname, '..', 'src', 'shared', 'api');
  const expectedApis = [
    'apiClient.ts',
    'materialApi.ts',
    'workshopApi.ts',
    'teamApi.ts',
    'employeeApi.ts',
    'equipmentApi.ts',
    'operationApi.ts',
    'bomApi.ts',
  ];

  let allApisExist = true;
  expectedApis.forEach(api => {
    const apiFilePath = path.join(apiPath, api);
    const exists = fs.existsSync(apiFilePath);
    const message = exists ? `✓ ${api}` : `✗ ${api} (不存在)`;
    console.log(`  ${message}`);
    if (!exists) {
      allApisExist = false;
    }
  });

  printResult('API服务完整性', allApisExist);
  return allApisExist;
}

/**
 * 验证测试文件
 */
function verifyTestFiles() {
  printGroup('测试文件验证');
  const testPattern = /(\.test\.(ts|tsx|js|jsx)|\.spec\.(ts|tsx|js|jsx))$/;
  let testCount = 0;
  const testDirectories = [
    path.join(__dirname, '..', 'src', 'shared', 'utils', '__tests__'),
    path.join(__dirname, '..', 'src', 'shared', 'components', '__tests__'),
    path.join(__dirname, '..', 'src', 'modules', 'basic-data', 'material', '__tests__'),
    path.join(__dirname, '..', 'src', 'modules', 'basic-data', 'employee', '__tests__'),
  ];

  testDirectories.forEach(dir => {
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir);
      const testFiles = files.filter(file => testPattern.test(file));
      testFiles.forEach(file => {
        console.log(`  ✓ ${path.join(dir, file)}`);
        testCount++;
      });
    }
  });

  printResult('测试文件存在', testCount > 0, `找到 ${testCount} 个测试文件`);
  return testCount > 0;
}

/**
 * 验证配置文件
 */
function verifyConfigFiles() {
  printGroup('配置文件验证');
  const rootPath = path.join(__dirname, '..');
  const configFiles = [
    { file: 'package.json', desc: '项目配置' },
    { file: 'tsconfig.json', desc: 'TypeScript配置' },
    { file: 'jest.config.js', desc: 'Jest测试配置' },
    { file: 'vite.config.ts', desc: 'Vite构建配置' },
    { file: 'craco.config.js', desc: 'Craco配置' },
    { file: '.env', desc: '环境变量配置' },
  ];

  let allConfigsExist = true;
  configFiles.forEach(({ file, desc }) => {
    const filePath = path.join(rootPath, file);
    const exists = fs.existsSync(filePath);
    const message = exists ? `✓ ${file}` : `✗ ${file} (不存在)`;
    console.log(`  ${message}`);
    if (!exists) {
      allConfigsExist = false;
    }
  });

  printResult('配置文件完整性', allConfigsExist);
  return allConfigsExist;
}

/**
 * 验证后端服务
 */
function verifyBackendServices() {
  printGroup('后端服务验证');
  const backendPath = path.join(__dirname, '..', 'backend');

  if (!fs.existsSync(backendPath)) {
    printResult('后端目录存在', false, '后端目录不存在');
    return false;
  }

  const expectedBackendFiles = [
    'package.json',
    'server.js',
  ];

  let allBackendFilesExist = true;
  expectedBackendFiles.forEach(file => {
    const filePath = path.join(backendPath, file);
    const exists = fs.existsSync(filePath);
    const message = exists ? `✓ ${file}` : `✗ ${file} (不存在)`;
    console.log(`  ${message}`);
    if (!exists) {
      allBackendFilesExist = false;
    }
  });

  printResult('后端服务文件完整性', allBackendFilesExist);
  return allBackendFilesExist;
}

/**
 * 验证文档完整性
 */
function verifyDocumentation() {
  printGroup('文档完整性验证');
  const rootPath = path.join(__dirname, '..');
  const requiredDocs = [
    { file: 'README.md', desc: '项目说明文档' },
    { file: 'ARCHITECTURE.md', desc: '架构文档' },
    { file: 'TESTING_REPORT.md', desc: '测试报告' },
    { file: 'TESTING_SUMMARY.md', desc: '测试总结' },
    { file: 'SYSTEM_INTEGRATION_TEST_PLAN.md', desc: '集成测试计划' },
  ];

  let allDocsExist = true;
  requiredDocs.forEach(({ file, desc }) => {
    const filePath = path.join(rootPath, file);
    const exists = fs.existsSync(filePath);
    const message = exists ? `✓ ${file} (${desc})` : `✗ ${file} (${desc})`;
    console.log(`  ${message}`);
    if (!exists) {
      allDocsExist = false;
    }
  });

  printResult('文档完整性', allDocsExist);
  return allDocsExist;
}

/**
 * 验证依赖包
 */
function verifyDependencies() {
  printGroup('依赖包验证');
  const packageJsonPath = path.join(__dirname, '..', 'package.json');

  if (!fs.existsSync(packageJsonPath)) {
    printResult('package.json存在', false);
    return false;
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

  const requiredDependencies = [
    { name: 'react', version: '^19.0.0' },
    { name: 'react-dom', version: '^19.0.0' },
    { name: 'antd', version: '^6.0.0' },
    { name: 'zustand', version: '^5.0.0' },
    { name: '@testing-library/react', version: '^16.0.0' },
    { name: '@testing-library/jest-dom', version: '^6.0.0' },
  ];

  let allDepsSatisfied = true;
  requiredDependencies.forEach(({ name, version }) => {
    const installed = dependencies[name];
    const satisfied = installed !== undefined;
    const message = satisfied
      ? `✓ ${name}@${installed}`
      : `✗ ${name} (未安装，期望: ${version})`;
    console.log(`  ${message}`);
    if (!satisfied) {
      allDepsSatisfied = false;
    }
  });

  printResult('依赖包完整性', allDepsSatisfied);
  return allDepsSatisfied;
}

/**
 * 验证模块完整性
 */
function verifyModulesIntegrity() {
  printGroup('模块完整性验证');
  const modulesPath = path.join(__dirname, '..', 'src', 'modules');

  if (!fs.existsSync(modulesPath)) {
    printResult('模块目录存在', false);
    return false;
  }

  const expectedModules = [
    'basic-data',
    'production',
    'quality',
    'execution',
    'issuance',
    'routing',
    'system',
  ];

  let allModulesExist = true;
  expectedModules.forEach(module => {
    const modulePath = path.join(modulesPath, module);
    const exists = fs.existsSync(modulePath);
    const message = exists ? `✓ ${module}` : `✗ ${module} (不存在)`;
    console.log(`  ${message}`);
    if (!exists) {
      allModulesExist = false;
    }
  });

  printResult('模块目录完整性', allModulesExist);
  return allModulesExist;
}

/**
 * 主测试函数
 */
function runTests() {
  printTitle('MES系统功能验证');
  console.log('开始时间:', new Date().toLocaleString());

  // 1. 配置文件验证
  verifyConfigFiles();

  // 2. 依赖包验证
  verifyDependencies();

  // 3. 模块完整性验证
  verifyModulesIntegrity();

  // 4. 共享组件验证
  verifySharedComponents();

  // 5. API服务验证
  verifyApiServices();

  // 6. 测试文件验证
  verifyTestFiles();

  // 7. 后端服务验证
  verifyBackendServices();

  // 8. 文档完整性验证
  verifyDocumentation();

  // 9. 具体模块结构验证
  verifyModuleStructure('basic-data/material', [
    'components/MaterialForm.tsx',
    'components/MaterialList.tsx',
    'components/MaterialDetail.tsx',
    'api/materialApi.ts',
  ]);

  verifyModuleStructure('basic-data/employee', [
    'components/EmployeeForm.tsx',
    'components/EmployeeList.tsx',
    'components/EmployeeDetail.tsx',
    'api/employeeApi.ts',
  ]);

  verifyModuleStructure('production/production-order', [
    'components/ProductionOrderForm.tsx',
    'components/ProductionOrderList.tsx',
    'components/ProductionOrderDetail.tsx',
  ]);

  verifyModuleStructure('quality/inspection', [
    'components/InspectionForm.tsx',
    'components/InspectionList.tsx',
    'components/InspectionDetail.tsx',
  ]);

  // 打印测试摘要
  console.log('\n结束时间:', new Date().toLocaleString());
  printSummary();

  // 返回退出码
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// 运行测试
if (require.main === module) {
  runTests();
}

module.exports = {
  runTests,
  verifyFileExists,
  verifyDirExists,
  printResult,
  testResults,
};

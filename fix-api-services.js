/**
 * API服务修复脚本
 * 批量修复API服务中的方法调用问题
 */

const fs = require('fs');
const path = require('path');

const apiServicePaths = [
  '/c/NEWMES/deca/src/modules/basic-data/workcenter/api/workCenterApi.ts',
  '/c/NEWMES/deca/src/modules/basic-data/workshop/api/workshopApi.ts',
  '/c/NEWMES/deca/src/modules/basic-data/team/api/teamApi.ts',
  '/c/NEWMES/deca/src/modules/basic-data/employee/api/employeeApi.ts',
  '/c/NEWMES/deca/src/modules/basic-data/qc-item/api/qcItemApi.ts',
  '/c/NEWMES/deca/src/modules/basic-data/qc-scheme/api/qcSchemeApi.ts',
];

// 需要修复的模式
const fixPatterns = [
  // 移除 showSuccess 和 successText
  {
    pattern: /,\s*\{\s*showSuccess:\s*true,\s*successText:\s*['"][^'"]*['"]\s*\}\s*\)/g,
    replacement: ')'
  },
  // 修复直接传递对象为参数的情况
  {
    pattern: /return apiClient\.get\(`\$\{this\.baseUrl\}\/[^`]+`,\s*\{\s*([^}]+)\s*\}\s*\)/g,
    replacement: 'return apiClient.get(`${this.baseUrl}/$1`, { params: { $2 } })'
  },
  // 修复导入配置的传递
  {
    pattern: /return apiClient\.post\(`\$\{this\.baseUrl\}\/import`, formData, requestConfig\)/g,
    replacement: 'return apiClient.post(`${this.baseUrl}/import`, formData, { params })'
  },
];

function fixApiService(filePath) {
  console.log(`正在修复: ${filePath}`);

  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;

    // 应用所有修复模式
    fixPatterns.forEach(({ pattern, replacement }) => {
      const newContent = content.replace(pattern, replacement);
      if (newContent !== content) {
        hasChanges = true;
        content = newContent;
      }
    });

    if (hasChanges) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✓ 已修复: ${filePath}`);
    } else {
      console.log(`- 无需修复: ${filePath}`);
    }
  } catch (error) {
    console.error(`✗ 修复失败: ${filePath}`, error.message);
  }
}

// 执行修复
apiServicePaths.forEach(fixApiService);

console.log('\n修复完成！');

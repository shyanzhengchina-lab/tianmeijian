/**
 * Zustand Store Type Inference Fix Script
 *
 * 批量修复所有store文件中的TypeScript类型推断问题
 * 主要问题：嵌套set()调用导致类型推断失败
 */

const fs = require('fs');
const path = require('path');

/**
 * 需要修复的文件列表
 */
const STORE_FILES = [
  'src/modules/basic-data/bom/store/bomStore.ts',
  'src/modules/basic-data/material/store/materialStore.ts',
  'src/modules/basic-data/unit/store/unitStore.ts',
  'src/modules/basic-data/workshop/store/workshopStore.ts',
  'src/modules/basic-data/workcenter/store/workCenterStore.ts',
  'src/modules/basic-data/operation/store/operationStore.ts',
  'src/modules/basic-data/equipment/store/equipmentStore.ts',
  'src/modules/basic-data/team/store/teamStore.ts',
  'src/modules/basic-data/employee/store/employeeStore.ts',
  'src/modules/basic-data/qc-scheme/store/qcSchemeStore.ts',
  'src/modules/basic-data/qc-item/store/qcItemStore.ts',
];

/**
 * 修复函数：将有问题的嵌套set()调用改为正确的状态更新方式
 */
const fixNestedSetCalls = (content) => {
  return content.replace(/set\(\(state\) => \{([^}]+?)\)/gm, (match, p1) => {
    const fullMatch = match;
    const setStateCalls = fullMatch[2]; // 修复外层set调用
    const newContent = content.replace(fullMatch[0], `set(state => ({\\n${p1}\\n${setStateCalls}\\n  }))`);
    return newContent;
  });
};

/**
 * 主处理函数
 */
function processFiles() {
  console.log(`🔍 Processing ${STORE_FILES.length} store files...`);

  let fixedCount = 0;
  let issueCount = 0;

  STORE_FILES.forEach(filePath => {
    try {
      let originalContent = fs.readFileSync(filePath, 'utf8');

      // 检查是否需要修复
      const needsFix = /set\((state) => \{[\s\S]+?\)/gm.test(originalContent) ||
                        /await\s+get\(\)\.\)/gm.test(originalContent);

      if (needsFix) {
        console.log(`  ⚠️  Found issues in: ${filePath}`);
        issueCount++;

        // 应用修复
        const fixedContent = fixNestedSetCalls(originalContent);

        // 写入文件
        fs.writeFileSync(filePath, fixedContent, 'utf8');
        fixedCount++;

        console.log(`  ✅ Fixed: ${filePath}`);
      } else {
        console.log(`  ✓ No issues in: ${filePath}`);
        fixedCount++;
      }
    } catch (error) {
      console.error(`  ❌ Error processing ${filePath}:`, error.message);
    }
  });

  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Fixed files: ${fixedCount}`);
  console.log(`   ⚠️  Files with issues: ${issueCount}`);
  console.log(`   📁 Total files: ${STORE_FILES.length}`);
}

// 执行处理
processFiles();
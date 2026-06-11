const fs = require('fs');
const path = require('path');

// 递归查找所有store.ts文件
function findStoreFiles(dir, files = []) {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    if (fs.statSync(fullPath).isDirectory()) {
      findStoreFiles(fullPath, files);
    } else if (item === 'store.ts') {
      files.push(fullPath);
    }
  }
  return files;
}

// 修复单个文件
function fixStoreFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    // 获取最后几行来检查问题模式
    const lines = content.split('\n');
    const lastLines = lines.slice(-5);

    let fixed = false;

    // 检查并修复 "  }));" 模式
    for (let i = 0; i < lastLines.length; i++) {
      if (lastLines[i].includes('}))') {
        lastLines[i] = lastLines[i].replace('}})', '})');
        fixed = true;
        console.log(`  Found and fixed line: "${lastLines[i]}"`);
      }
    }

    if (fixed) {
      const newContent = [...lines.slice(0, -5), ...lastLines].join('\n');
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`✅ Fixed: ${filePath}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

// 主执行函数
function main() {
  const projectRoot = process.cwd();
  const srcDir = path.join(projectRoot, 'src');
  const storeFiles = findStoreFiles(srcDir);

  console.log(`Found ${storeFiles.length} store files\n`);

  let fixedCount = 0;
  for (const file of storeFiles) {
    console.log(`\nChecking: ${file}`);
    if (fixStoreFile(file)) {
      fixedCount++;
    }
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`✅ Total fixed: ${fixedCount}/${storeFiles.length}`);
  console.log(`${'='.repeat(50)}`);
}

main();

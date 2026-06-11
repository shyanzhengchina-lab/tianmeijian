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

    // 修复 "  }));" 为 "  })" - 尝试多种模式
    content = content.replace(/  \}\)\);/g, '  })');  // 精确模式
    content = content.replace(/\}\)\);/g, '})');       // 宽松模式

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
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

  console.log(`Found ${storeFiles.length} store files`);

  let fixedCount = 0;
  for (const file of storeFiles) {
    if (fixStoreFile(file)) {
      fixedCount++;
    }
  }

  console.log(`\n✅ Total fixed: ${fixedCount}/${storeFiles.length}`);
}

main();

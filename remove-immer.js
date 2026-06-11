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

// 修复单个store文件
function fixStoreFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    // 移除immer导入行
    content = content.replace(/import \{ immer \} from ['"]zustand\/middleware\/immer['"];?\n?/g, '');

    // 将 immer((set, get) => ({ 替换为 (set, get) => ({
    content = content.replace(/immer\(\(set, get\) => \(\{/g, '(set, get) => ({');

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

  console.log(`Found ${storeFiles.length} store files\n`);

  let fixedCount = 0;
  for (const file of storeFiles) {
    if (fixStoreFile(file)) {
      fixedCount++;
    }
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`✅ Total fixed: ${fixedCount}/${storeFiles.length}`);
  console.log(`${'='.repeat(50)}`);
}

main();

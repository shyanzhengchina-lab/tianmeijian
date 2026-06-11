const fs = require('fs');
const path = require('path');

// 查找所有包含immer的文件
function findAllFilesWithImmer(dir, files = []) {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    if (fs.statSync(fullPath).isDirectory()) {
      findAllFilesWithImmer(fullPath, files);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes("import { immer } from 'zustand/middleware/immer'") ||
            content.includes('import { immer } from "zustand/middleware/immer"')) {
          files.push(fullPath);
        }
      } catch (error) {
        // 忽略无法读取的文件
      }
    }
  }
  return files;
}

// 移除immer导入
function removeImmerImport(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    // 移除单引号版本的immer导入
    content = content.replace(/import \{ immer \} from 'zustand\/middleware\/immer';\n?/g, '');
    // 移除双引号版本的immer导入
    content = content.replace(/import \{ immer \} from "zustand\/middleware\/immer";\n?/g, '');

    // 移除immer((set, get) => ({ 包装器
    content = content.replace(/immer\(\(set, get\) => \(\{/g, '(set, get) => ({');

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Removed immer: ${filePath}`);
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
  const filesWithImmer = findAllFilesWithImmer(srcDir);

  console.log(`Found ${filesWithImmer.length} files with immer import\n`);

  let fixedCount = 0;
  for (const file of filesWithImmer) {
    if (removeImmerImport(file)) {
      fixedCount++;
    }
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`✅ Total fixed: ${fixedCount}/${filesWithImmer.length}`);
  console.log(`${'='.repeat(50)}`);
}

main();

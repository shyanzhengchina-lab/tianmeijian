# GitHub CLI 安装和认证指南

## 📥 第一步：下载 GitHub CLI

**下载链接**：
```
https://github.com/cli/gh-cli/releases/latest/download/gh-cli_windows_amd64.exe
```

**操作步骤**：
1. 点击上方链接下载 `gh-cli_windows_amd64.exe`
2. 将文件保存到项目根目录：`C:\NEWMES\deca\`
3. 将文件重命名为 `gh.exe`（可选，便于使用）

---

## 🚀 第二步：运行认证

**打开新的终端**（或 PowerShell），切换到项目目录：
```bash
cd C:\NEWMES\deca
```

**执行认证命令**：
```bash
.\gh.exe auth login
```

**认证流程**：
1. 命令会输出一个临时码
2. 浏览器自动打开到：`https://github.com/login/device`
3. 在浏览器中点击 "Authorize shyanzhengchina-lab"
4. 终端会自动完成认证

---

## ✅ 认证成功的标志

认证成功后，您会看到类似输出：
```
✓ Logged in as shyanzhengchina-lab
✓ Configured git protocol
✓ Configured git credential helper
```

---

## 🔄 第三步：认证完成后的操作

一旦您看到上述成功信息，**请回复我**，我将立即执行：

1. ✅ 设置默认仓库
2. ✅ 推送所有代码更改
3. ✅ 验证推送成功

---

## 📝 当前代码状态

**✅ 已准备推送的内容**：
- 新组件：`WorkOrdersTab.tsx`、`RoutingDetailsTab.tsx`
- 重构的文件：`ProductionOrderDetail.tsx`
- 修复的 JSX 错误：共 7+ 个文件
- Git 状态：已初始化和提交

---

**等待您的认证完成，我将立即推送代码！** 🚀

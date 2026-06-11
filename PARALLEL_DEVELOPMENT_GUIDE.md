# Git Worktrees 并行开发指南

## 当前状态
已成功创建3个并行工作环境：

```
C:/NEWMES/deca         [feature/architecture-refactoring] - 主工作目录
C:/NEWMES/feature-api  [feature/api] - API功能开发
C:/NEWMES/feature-auth [feature/auth] - 认证功能开发  
C:/NEWMES/feature-ui   [feature/ui] - UI功能开发
```

## 如何使用

### 1. 启动多个 Claude Code 实例
```bash
# 终端1 - 认证功能
cd ../feature-auth
claude

# 终端2 - API功能
cd ../feature-api
claude

# 终端3 - UI功能
cd ../feature-ui
claude
```

### 2. 任务分配建议
- **feature/auth**: 用户认证、权限管理、登录注册
- **feature/api**: 后端API接口、数据层、业务逻辑
- **feature/ui**: 前端界面、交互体验、响应式设计

### 3. 并行开发优势
- ✅ **完全隔离**: 每个worktree独立，不会冲突
- ✅ **低成本**: 不需要额外的协调开销
- ✅ **稳定**: 不是实验功能，久经考验
- ✅ **简单**: 几条命令就能搞定

## 最佳实践

### 1. 任务拆分原则
- 确保任务之间低耦合
- 避免多个实例编辑同一文件
- 每个任务有清晰的边界和产出

### 2. 定期同步
```bash
# 查看所有worktree状态
git worktree list

# 删除不需要的worktree
git worktree remove ../feature-xxx

# 清理过期的worktree
git worktree prune
```

### 3. 合并策略
```bash
# 并行开发完成后，统一合并
git checkout main
git merge feature/auth
git merge feature/api
git merge feature/ui
```

## 效率提升数据
基于文章实测，并行开发可提升：
- 完成时间: 4x 提升
- 代码Review: 4.5x 提升  
- Bug修复: 5x 提升

整体效率提升约 **3-5倍**

## 注意事项
- 每个 Claude Code 实例消耗独立的 Token
- 建议最多使用 3-5 个并发实例
- 定期检查 worktree 状态，避免混乱
- 重要改动及时提交，防止丢失

## 与其他方案对比
- **Agent Teams**: 需要协作讨论的复杂任务
- **Git Worktrees**: 独立任务并行（当前方案）
- **Nested Tmux**: 批量自动化任务

---

基于孟健AI编程的《AI编程效率翻10倍》文章实践
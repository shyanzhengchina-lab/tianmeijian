# deca & deka-backcode 并行开发指南

## 🎯 项目关系

```
deka-backcode  →  旧项目（参考）
    ↓ 业务逻辑迁移
deca           →  新架构（目标）
```

## 🔄 并行开发模式

### 模式 1: 参考开发（推荐）
适用于：将旧功能迁移到新架构

```bash
# 终端1 - 业务分析
cd ../deka-backcode
# 查看 MaterialPage.tsx 了解业务需求
# 查看 MaterialController.java 了解API设计

# 终端2 - 新架构实现
cd C:/NEWMES/deca
# 按模块化架构实现相同功能
```

### 模式 2: 功能分工
适用于：多人协作开发

```bash
# 开发者A - 基础数据模块
cd C:/NEWMES/deca
# 开发：material、unit、bom 等

# 开发者B - 生产管理模块
cd ../deka-backcode
# 分析：production-order、work-order 等
# 准备迁移方案
```

## 📋 模块迁移清单

### ✅ 已迁移
- [x] Workshop（车间管理）
- [x] WorkCenter（工作中心）
- [x] Unit（计量单位）
- [x] Material（物料档案）

### 🚧 进行中
- [ ] BOM（物料清单）
- [ ] Operation（工序）
- [ ] Equipment（设备）
- [ ] Team（班组）
- [ ] Employee（员工）

### 📅 计划中
- [ ] 生产订单
- [ ] 生产工单
- [ ] 质检管理
- [ ] 电子批记录 (EBR)
- [ ] 领料管理

## ⚠️ 注意事项

### Git 操作限制
1. **不能在两个 worktree 中修改同一文件**
2. **共享同一个 `.git` 目录**
3. **在不同分支上独立开发**

### 开发原则
1. **deka-backcode 作为参考库**
   - 只读业务逻辑分析
   - 不进行新功能开发
   - 保持代码不变

2. **deca 作为主开发环境**
   - 所有新功能在此实现
   - 按新架构规范开发
   - 定期提交到 main 分支

### 工作流程
```
1. 在 deka-backcode 中分析需求
   ↓
2. 在 deca 中设计新架构方案
   ↓
3. 在 deca 中实现功能
   ↓
4. 测试对比新旧功能
   ↓
5. 合并到 main 分支
   ↓
6. 标记迁移完成
```

## 🚀 快速开始

### 查看旧代码
```bash
cd ../deka-backcode
# 查看页面组件
find src/pages -name "*.tsx"

# 查看API接口
find src/api -name "*.ts"

# 查看后端Controller
find backend/src/main/java -name "*Controller.java"
```

### 在新架构中实现
```bash
cd C:/NEWMES/deca
# 按模块结构创建文件
# 例如：src/modules/basic-data/material/
```

### 合并策略
```bash
# 1. 确保所有模块已测试
cd C:/NEWMES/deca
npm test

# 2. 切换到主分支
git checkout main

# 3. 合并开发分支
git merge feature/architecture-refactoring

# 4. 推送到远程
git push origin main
```

## 📊 进度追踪

### 迁移完成度
- **基础数据模块**: 60% (4/10)
- **生产管理模块**: 0%
- **质量管理模块**: 0%
- **设备管理模块**: 0%
- **其他模块**: 0%

### 下一步行动
1. 完成 BOM 模块迁移
2. 开始生产订单模块分析
3. 制定完整的迁移时间表

---

## 🔧 常用命令

### Worktree 管理
```bash
# 查看所有 worktrees
git worktree list

# 删除 worktree
git worktree remove ../deka-backcode

# 清理过期的 worktree
git worktree prune
```

### 分支切换
```bash
# 切换到旧项目分支
git checkout backcode

# 切换到新架构分支
git checkout feature/architecture-refactoring

# 切换到主分支
git checkout main
```

---

**最后更新**: 2026-05-02
**维护者**: shyanzhengchina-lab
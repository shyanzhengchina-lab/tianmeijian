package com.mdk.mes.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.mdk.mes.common.Result;
import com.mdk.mes.entity.MaterialCategory;
import com.mdk.mes.service.MaterialCategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 物料分类 Controller
 * GET  /material-categories/list              — 查询全部（flat list, not nested）
 * GET  /material-categories/tree              — 查询全部（tree, parentId组装）
 * POST /material-categories                   — 新增
 * PUT  /material-categories/{id}              — 修改
 * DELETE /material-categories/{id}            — 删除（逻辑删除）
 * DELETE /material-categories/batch           — 批量删除
 */
@RestController
@RequestMapping("/material-categories")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class MaterialCategoryController {

    private final MaterialCategoryService categoryService;

    /** 查询全部分类（flat，前端自行组树） */
    @GetMapping("/list")
    public Result<List<MaterialCategory>> list(
            @RequestParam(required = false) Long parentId,
            @RequestParam(required = false) Integer status) {
        LambdaQueryWrapper<MaterialCategory> wrapper = new LambdaQueryWrapper<MaterialCategory>()
                .eq(MaterialCategory::getDeleted, 0)
                .orderByAsc(MaterialCategory::getSortNo)
                .orderByAsc(MaterialCategory::getId);
        if (parentId != null) wrapper.eq(MaterialCategory::getParentId, parentId);
        if (status   != null) wrapper.eq(MaterialCategory::getStatus,   status);
        return Result.success(categoryService.list(wrapper));
    }

    /** 新增分类 */
    @PostMapping
    public Result<MaterialCategory> create(@RequestBody MaterialCategory entity) {
        if (entity.getStatus() == null)  entity.setStatus(1);
        if (entity.getSortNo() == null)  entity.setSortNo(0);
        if (entity.getParentId() == null) entity.setParentId(0L);
        categoryService.save(entity);
        return Result.success(entity);
    }

    /** 修改分类 */
    @PutMapping("/{id}")
    public Result<Void> update(@PathVariable Long id, @RequestBody MaterialCategory entity) {
        entity.setId(id);
        categoryService.updateById(entity);
        return Result.success();
    }

    /** 删除（逻辑删除） */
    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        categoryService.removeById(id);
        return Result.success();
    }

    /** 批量删除 */
    @DeleteMapping("/batch")
    public Result<Void> batchDelete(@RequestBody List<Long> ids) {
        categoryService.removeByIds(ids);
        return Result.success();
    }
}

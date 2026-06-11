package com.mdk.mes.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.mdk.mes.common.PageResult;
import com.mdk.mes.common.Result;
import com.mdk.mes.entity.Material;
import com.mdk.mes.service.MaterialService;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 物料档案 Controller
 */
@RestController
@RequestMapping("/materials")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class MaterialController {

    private final MaterialService materialService;

    /** 分页查询 */
    @GetMapping("/page")
    public Result<PageResult<Material>> page(
            @RequestParam(defaultValue = "1") Integer current,
            @RequestParam(defaultValue = "20") Integer pageSize,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) Integer status) {
        LambdaQueryWrapper<Material> wrapper = new LambdaQueryWrapper<Material>()
                .orderByDesc(Material::getCreateTime);
        if (categoryId != null) wrapper.eq(Material::getCategoryId, categoryId);
        if (StringUtils.hasText(keyword)) {
            wrapper.and(w -> w.like(Material::getName, keyword)
                    .or().like(Material::getCode, keyword)
                    .or().like(Material::getSpec, keyword)
                    .or().like(Material::getSupplier, keyword));
        }
        if (StringUtils.hasText(type)) wrapper.eq(Material::getType, type);
        if (status != null) wrapper.eq(Material::getStatus, status);
        IPage<Material> pageResult = materialService.page(new Page<>(current, pageSize), wrapper);
        return Result.success(PageResult.of(pageResult.getRecords(), pageResult.getTotal(), current, pageSize));
    }

    /** 查询全部（不分页） */
    @GetMapping("/list")
    public Result<List<Material>> list(
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Integer status) {
        LambdaQueryWrapper<Material> wrapper = new LambdaQueryWrapper<Material>()
                .orderByDesc(Material::getCreateTime);
        if (categoryId != null) wrapper.eq(Material::getCategoryId, categoryId);
        if (status != null) wrapper.eq(Material::getStatus, status);
        return Result.success(materialService.list(wrapper));
    }

    /** 根据ID查询 */
    @GetMapping("/{id}")
    public Result<Material> getById(@PathVariable Long id) {
        Material entity = materialService.getById(id);
        if (entity == null) return Result.fail(404, "记录不存在");
        return Result.success(entity);
    }

    /** 新增 */
    @PostMapping
    public Result<Material> create(@RequestBody Material entity) {
        // 检查编码唯一性
        long count = materialService.count(
            new LambdaQueryWrapper<Material>()
                .eq(Material::getCode, entity.getCode())
                .eq(Material::getDeleted, 0));
        if (count > 0) {
            return Result.fail(400, "物料编码「" + entity.getCode() + "」已存在，请使用其他编码");
        }
        materialService.save(entity);
        return Result.success(entity);
    }

    /** 修改 */
    @PutMapping("/{id}")
    public Result<Void> update(@PathVariable Long id, @RequestBody Material entity) {
        // 检查编码唯一性（排除自身）
        long count = materialService.count(
            new LambdaQueryWrapper<Material>()
                .eq(Material::getCode, entity.getCode())
                .ne(Material::getId, id)
                .eq(Material::getDeleted, 0));
        if (count > 0) {
            return Result.fail(400, "物料编码「" + entity.getCode() + "」已被其他物料使用");
        }
        entity.setId(id);
        materialService.updateById(entity);
        return Result.success();
    }

    /** 删除（逻辑删除） */
    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        materialService.removeById(id);
        return Result.success();
    }

    /** 批量删除 */
    @DeleteMapping("/batch")
    public Result<Void> batchDelete(@RequestBody List<Long> ids) {
        materialService.removeByIds(ids);
        return Result.success();
    }
}

package com.mdk.mes.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.mdk.mes.common.PageResult;
import com.mdk.mes.common.Result;
import com.mdk.mes.entity.Unit;
import com.mdk.mes.service.UnitService;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 计量单位 Controller
 */
@RestController
@RequestMapping("/units")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class UnitController {

    private final UnitService unitService;

    /** 分页查询 */
    @GetMapping("/page")
    public Result<PageResult<Unit>> page(
            @RequestParam(defaultValue = "1") Integer current,
            @RequestParam(defaultValue = "20") Integer pageSize,
            @RequestParam(required = false) Long groupId,
            @RequestParam(required = false) String code,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) Integer status) {
        LambdaQueryWrapper<Unit> wrapper = new LambdaQueryWrapper<Unit>()
                .orderByAsc(Unit::getId);
        if (groupId != null) wrapper.eq(Unit::getGroupId, groupId);
        if (StringUtils.hasText(code)) wrapper.like(Unit::getCode, code);
        if (StringUtils.hasText(name)) wrapper.like(Unit::getName, name);
        if (status != null) wrapper.eq(Unit::getStatus, status);
        IPage<Unit> pageResult = unitService.page(new Page<>(current, pageSize), wrapper);
        return Result.success(PageResult.of(pageResult.getRecords(), pageResult.getTotal(), current, pageSize));
    }

    /** 查询全部（不分页） */
    @GetMapping("/list")
    public Result<List<Unit>> list(
            @RequestParam(required = false) Long groupId,
            @RequestParam(required = false) Integer status) {
        LambdaQueryWrapper<Unit> wrapper = new LambdaQueryWrapper<Unit>()
                .orderByAsc(Unit::getId);
        if (groupId != null) wrapper.eq(Unit::getGroupId, groupId);
        if (status != null) wrapper.eq(Unit::getStatus, status);
        return Result.success(unitService.list(wrapper));
    }

    /** 根据ID查询 */
    @GetMapping("/{id}")
    public Result<Unit> getById(@PathVariable Long id) {
        Unit entity = unitService.getById(id);
        if (entity == null) return Result.fail(404, "记录不存在");
        return Result.success(entity);
    }

    /** 新增 */
    @PostMapping
    public Result<Unit> create(@RequestBody Unit entity) {
        unitService.save(entity);
        return Result.success(entity);
    }

    /** 修改 */
    @PutMapping("/{id}")
    public Result<Void> update(@PathVariable Long id, @RequestBody Unit entity) {
        entity.setId(id);
        unitService.updateById(entity);
        return Result.success();
    }

    /** 删除（逻辑删除） */
    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        unitService.removeById(id);
        return Result.success();
    }

    /** 批量删除 */
    @DeleteMapping("/batch")
    public Result<Void> batchDelete(@RequestBody List<Long> ids) {
        unitService.removeByIds(ids);
        return Result.success();
    }
}

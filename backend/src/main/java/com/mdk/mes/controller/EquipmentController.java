package com.mdk.mes.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.mdk.mes.common.PageResult;
import com.mdk.mes.common.Result;
import com.mdk.mes.entity.Equipment;
import com.mdk.mes.service.EquipmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 设备管理 Controller
 */
@RestController
@RequestMapping("/equipment")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class EquipmentController {

    private final EquipmentService equipmentService;

    /** 分页查询 */
    @GetMapping("/page")
    public Result<PageResult<Equipment>> page(
            @RequestParam(defaultValue = "1") Integer current,
            @RequestParam(defaultValue = "15") Integer pageSize) {
        IPage<Equipment> pageResult = equipmentService.page(
                new Page<>(current, pageSize),
                new LambdaQueryWrapper<Equipment>().eq(Equipment::getDeleted, 0).orderByDesc(Equipment::getCreateTime));
        return Result.success(PageResult.of(pageResult.getRecords(), pageResult.getTotal(), current, pageSize));
    }

    /** 查询全部（不分页） */
    @GetMapping("/list")
    public Result<List<Equipment>> list() {
        List<Equipment> list = equipmentService.list(
                new LambdaQueryWrapper<Equipment>().eq(Equipment::getDeleted, 0).orderByDesc(Equipment::getCreateTime));
        return Result.success(list);
    }

    /** 根据ID查询 */
    @GetMapping("/{id}")
    public Result<Equipment> getById(@PathVariable Long id) {
        Equipment entity = equipmentService.getById(id);
        if (entity == null) return Result.fail(404, "记录不存在");
        return Result.success(entity);
    }

    /** 新增 */
    @PostMapping
    public Result<Equipment> create(@RequestBody Equipment entity) {
        equipmentService.save(entity);
        return Result.success(entity);
    }

    /** 修改 */
    @PutMapping("/{id}")
    public Result<Void> update(@PathVariable Long id, @RequestBody Equipment entity) {
        entity.setId(id);
        equipmentService.updateById(entity);
        return Result.success();
    }

    /** 删除（逻辑删除） */
    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        equipmentService.removeById(id);
        return Result.success();
    }

    /** 批量删除 */
    @DeleteMapping("/batch")
    public Result<Void> batchDelete(@RequestBody List<Long> ids) {
        equipmentService.removeByIds(ids);
        return Result.success();
    }
}

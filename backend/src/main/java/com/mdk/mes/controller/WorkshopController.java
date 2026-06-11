package com.mdk.mes.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.mdk.mes.common.PageResult;
import com.mdk.mes.common.Result;
import com.mdk.mes.entity.Workshop;
import com.mdk.mes.service.WorkshopService;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 车间管理 Controller
 */
@RestController
@RequestMapping("/workshops")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class WorkshopController {

    private final WorkshopService workshopService;

    /** 分页查询 */
    @GetMapping("/page")
    public Result<PageResult<Workshop>> page(
            @RequestParam(defaultValue = "1") Integer current,
            @RequestParam(defaultValue = "15") Integer pageSize) {
        IPage<Workshop> pageResult = workshopService.page(
                new Page<>(current, pageSize),
                new LambdaQueryWrapper<Workshop>().eq(Workshop::getDeleted, 0).orderByDesc(Workshop::getCreateTime));
        return Result.success(PageResult.of(pageResult.getRecords(), pageResult.getTotal(), current, pageSize));
    }

    /** 查询全部（不分页） */
    @GetMapping("/list")
    public Result<List<Workshop>> list() {
        List<Workshop> list = workshopService.list(
                new LambdaQueryWrapper<Workshop>().eq(Workshop::getDeleted, 0).orderByDesc(Workshop::getCreateTime));
        return Result.success(list);
    }

    /** 根据ID查询 */
    @GetMapping("/{id}")
    public Result<Workshop> getById(@PathVariable Long id) {
        Workshop entity = workshopService.getById(id);
        if (entity == null) return Result.fail(404, "记录不存在");
        return Result.success(entity);
    }

    /** 新增 */
    @PostMapping
    public Result<Workshop> create(@RequestBody Workshop entity) {
        workshopService.save(entity);
        return Result.success(entity);
    }

    /** 修改 */
    @PutMapping("/{id}")
    public Result<Void> update(@PathVariable Long id, @RequestBody Workshop entity) {
        entity.setId(id);
        workshopService.updateById(entity);
        return Result.success();
    }

    /** 删除（逻辑删除） */
    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        workshopService.removeById(id);
        return Result.success();
    }

    /** 批量删除 */
    @DeleteMapping("/batch")
    public Result<Void> batchDelete(@RequestBody List<Long> ids) {
        workshopService.removeByIds(ids);
        return Result.success();
    }
}

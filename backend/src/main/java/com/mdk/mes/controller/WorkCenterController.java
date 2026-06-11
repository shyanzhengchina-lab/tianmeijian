package com.mdk.mes.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.mdk.mes.common.PageResult;
import com.mdk.mes.common.Result;
import com.mdk.mes.entity.WorkCenter;
import com.mdk.mes.service.WorkCenterService;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 工作中心管理 Controller
 */
@RestController
@RequestMapping("/work-centers")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class WorkCenterController {

    private final WorkCenterService workCenterService;

    /** 分页查询 */
    @GetMapping("/page")
    public Result<PageResult<WorkCenter>> page(
            @RequestParam(defaultValue = "1") Integer current,
            @RequestParam(defaultValue = "15") Integer pageSize) {
        IPage<WorkCenter> pageResult = workCenterService.page(
                new Page<>(current, pageSize),
                new LambdaQueryWrapper<WorkCenter>().eq(WorkCenter::getDeleted, 0).orderByDesc(WorkCenter::getCreateTime));
        return Result.success(PageResult.of(pageResult.getRecords(), pageResult.getTotal(), current, pageSize));
    }

    /** 查询全部（不分页） */
    @GetMapping("/list")
    public Result<List<WorkCenter>> list() {
        List<WorkCenter> list = workCenterService.list(
                new LambdaQueryWrapper<WorkCenter>().eq(WorkCenter::getDeleted, 0).orderByDesc(WorkCenter::getCreateTime));
        return Result.success(list);
    }

    /** 根据ID查询 */
    @GetMapping("/{id}")
    public Result<WorkCenter> getById(@PathVariable Long id) {
        WorkCenter entity = workCenterService.getById(id);
        if (entity == null) return Result.fail(404, "记录不存在");
        return Result.success(entity);
    }

    /** 新增 */
    @PostMapping
    public Result<WorkCenter> create(@RequestBody WorkCenter entity) {
        workCenterService.save(entity);
        return Result.success(entity);
    }

    /** 修改 */
    @PutMapping("/{id}")
    public Result<Void> update(@PathVariable Long id, @RequestBody WorkCenter entity) {
        entity.setId(id);
        workCenterService.updateById(entity);
        return Result.success();
    }

    /** 删除（逻辑删除） */
    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        workCenterService.removeById(id);
        return Result.success();
    }

    /** 批量删除 */
    @DeleteMapping("/batch")
    public Result<Void> batchDelete(@RequestBody List<Long> ids) {
        workCenterService.removeByIds(ids);
        return Result.success();
    }
}

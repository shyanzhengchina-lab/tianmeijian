package com.mdk.mes.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.mdk.mes.common.PageResult;
import com.mdk.mes.common.Result;
import com.mdk.mes.entity.TaskOrder;
import com.mdk.mes.service.TaskOrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 生产任务单 Controller (L3)
 */
@RestController
@RequestMapping("/task-orders")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class TaskOrderController {

    private final TaskOrderService taskOrderService;

    /** 分页查询 */
    @GetMapping("/page")
    public Result<PageResult<TaskOrder>> page(
            @RequestParam(defaultValue = "1") Integer current,
            @RequestParam(defaultValue = "20") Integer pageSize,
            @RequestParam(required = false) String taskNo,
            @RequestParam(required = false) Long workOrderId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String assignedToName) {
        LambdaQueryWrapper<TaskOrder> wrapper = new LambdaQueryWrapper<TaskOrder>()
                .orderByDesc(TaskOrder::getCreateTime);
        if (StringUtils.hasText(taskNo)) wrapper.like(TaskOrder::getTaskNo, taskNo);
        if (workOrderId != null) wrapper.eq(TaskOrder::getWorkOrderId, workOrderId);
        if (StringUtils.hasText(status)) wrapper.eq(TaskOrder::getStatus, status);
        if (StringUtils.hasText(assignedToName)) wrapper.like(TaskOrder::getAssignedToName, assignedToName);
        IPage<TaskOrder> pageResult = taskOrderService.page(new Page<>(current, pageSize), wrapper);
        return Result.success(PageResult.of(pageResult.getRecords(), pageResult.getTotal(), current, pageSize));
    }

    /** 查询全部（不分页） */
    @GetMapping("/list")
    public Result<List<TaskOrder>> list(
            @RequestParam(required = false) Long workOrderId,
            @RequestParam(required = false) String status) {
        LambdaQueryWrapper<TaskOrder> wrapper = new LambdaQueryWrapper<TaskOrder>()
                .orderByDesc(TaskOrder::getCreateTime);
        if (workOrderId != null) wrapper.eq(TaskOrder::getWorkOrderId, workOrderId);
        if (StringUtils.hasText(status)) wrapper.eq(TaskOrder::getStatus, status);
        return Result.success(taskOrderService.list(wrapper));
    }

    /** 根据ID查询 */
    @GetMapping("/{id}")
    public Result<TaskOrder> getById(@PathVariable Long id) {
        TaskOrder entity = taskOrderService.getById(id);
        if (entity == null) return Result.fail(404, "记录不存在");
        return Result.success(entity);
    }

    /** 新增 */
    @PostMapping
    public Result<TaskOrder> create(@RequestBody TaskOrder entity) {
        if (!StringUtils.hasText(entity.getStatus())) entity.setStatus("PENDING");
        // material_id is NOT NULL in schema; default to 1 if not provided
        if (entity.getMaterialId() == null) entity.setMaterialId(1L);
        taskOrderService.save(entity);
        return Result.success(entity);
    }

    /** 修改 */
    @PutMapping("/{id}")
    public Result<Void> update(@PathVariable Long id, @RequestBody TaskOrder entity) {
        entity.setId(id);
        taskOrderService.updateById(entity);
        return Result.success();
    }

    /** 删除（逻辑删除） */
    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        taskOrderService.removeById(id);
        return Result.success();
    }

    /** 批量删除 */
    @DeleteMapping("/batch")
    public Result<Void> batchDelete(@RequestBody List<Long> ids) {
        taskOrderService.removeByIds(ids);
        return Result.success();
    }
}

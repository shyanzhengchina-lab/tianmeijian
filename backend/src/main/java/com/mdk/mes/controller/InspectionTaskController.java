package com.mdk.mes.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.mdk.mes.common.PageResult;
import com.mdk.mes.common.Result;
import com.mdk.mes.entity.InspectionTask;
import com.mdk.mes.service.InspectionTaskService;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/inspection-tasks")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class InspectionTaskController {
    private final InspectionTaskService inspectionTaskService;

    @GetMapping("/page")
    public Result<PageResult<InspectionTask>> page(
            @RequestParam(defaultValue = "1") Integer current,
            @RequestParam(defaultValue = "20") Integer pageSize,
            @RequestParam(required = false) String taskNo,
            @RequestParam(required = false) String taskType,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String materialName) {
        LambdaQueryWrapper<InspectionTask> wrapper = new LambdaQueryWrapper<InspectionTask>()
                .orderByDesc(InspectionTask::getCreateTime);
        if (StringUtils.hasText(taskNo)) wrapper.like(InspectionTask::getTaskNo, taskNo);
        if (StringUtils.hasText(taskType)) wrapper.eq(InspectionTask::getTaskType, taskType);
        if (StringUtils.hasText(status)) wrapper.eq(InspectionTask::getStatus, status);
        if (StringUtils.hasText(materialName)) wrapper.like(InspectionTask::getMaterialName, materialName);
        IPage<InspectionTask> pageResult = inspectionTaskService.page(new Page<>(current, pageSize), wrapper);
        return Result.success(PageResult.of(pageResult.getRecords(), pageResult.getTotal(), current, pageSize));
    }

    @GetMapping("/list")
    public Result<List<InspectionTask>> list(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String taskType) {
        LambdaQueryWrapper<InspectionTask> wrapper = new LambdaQueryWrapper<InspectionTask>()
                .orderByDesc(InspectionTask::getCreateTime);
        if (StringUtils.hasText(status)) wrapper.eq(InspectionTask::getStatus, status);
        if (StringUtils.hasText(taskType)) wrapper.eq(InspectionTask::getTaskType, taskType);
        return Result.success(inspectionTaskService.list(wrapper));
    }

    @GetMapping("/{id}")
    public Result<InspectionTask> getById(@PathVariable Long id) {
        InspectionTask entity = inspectionTaskService.getById(id);
        if (entity == null) return Result.fail(404, "记录不存在");
        return Result.success(entity);
    }

    @PostMapping
    public Result<InspectionTask> create(@RequestBody InspectionTask entity) {
        if (!StringUtils.hasText(entity.getStatus())) entity.setStatus("PENDING");
        if (!StringUtils.hasText(entity.getTaskNo())) entity.setTaskNo("QC-" + System.currentTimeMillis());
        if (!StringUtils.hasText(entity.getTaskType())) entity.setTaskType("IQC");
        inspectionTaskService.save(entity);
        return Result.success(entity);
    }

    @PutMapping("/{id}")
    public Result<Void> update(@PathVariable Long id, @RequestBody InspectionTask entity) {
        entity.setId(id);
        inspectionTaskService.updateById(entity);
        return Result.success();
    }

    @PutMapping("/{id}/status")
    public Result<Void> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        InspectionTask entity = new InspectionTask();
        entity.setId(id);
        entity.setStatus(body.get("status"));
        if (StringUtils.hasText(body.get("result"))) entity.setResult(body.get("result"));
        inspectionTaskService.updateById(entity);
        return Result.success();
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        inspectionTaskService.removeById(id);
        return Result.success();
    }

    @DeleteMapping("/batch")
    public Result<Void> batchDelete(@RequestBody List<Long> ids) {
        inspectionTaskService.removeByIds(ids);
        return Result.success();
    }
}

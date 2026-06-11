package com.mdk.mes.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.mdk.mes.common.PageResult;
import com.mdk.mes.common.Result;
import com.mdk.mes.entity.PadOperationRecord;
import com.mdk.mes.entity.PadTask;
import com.mdk.mes.service.PadOperationRecordService;
import com.mdk.mes.service.PadTaskService;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@RestController
@RequestMapping("/pad-tasks")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PadTaskController {

    private final PadTaskService padTaskService;
    private final PadOperationRecordService padOperationRecordService;

    /** 全量列表 */
    @GetMapping("/list")
    public Result<List<PadTask>> list(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String operationCode) {
        LambdaQueryWrapper<PadTask> qw = new LambdaQueryWrapper<>();
        if (StringUtils.hasText(status)) qw.eq(PadTask::getStatus, status);
        if (StringUtils.hasText(operationCode)) qw.eq(PadTask::getOperationCode, operationCode);
        qw.orderByDesc(PadTask::getCreateTime);
        return Result.success(padTaskService.list(qw));
    }

    /** 分页查询 */
    @GetMapping("/page")
    public Result<PageResult<PadTask>> page(
            @RequestParam(defaultValue = "1") int current,
            @RequestParam(defaultValue = "20") int pageSize,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String taskNo) {
        LambdaQueryWrapper<PadTask> qw = new LambdaQueryWrapper<>();
        if (StringUtils.hasText(status)) qw.eq(PadTask::getStatus, status);
        if (StringUtils.hasText(taskNo)) qw.like(PadTask::getTaskNo, taskNo);
        qw.orderByDesc(PadTask::getCreateTime);
        Page<PadTask> page = padTaskService.page(new Page<>(current, pageSize), qw);
        return Result.success(PageResult.of(page.getRecords(), page.getTotal(), current, pageSize));
    }

    /** 根据ID查询 */
    @GetMapping("/{id}")
    public Result<PadTask> getById(@PathVariable Long id) {
        return Result.success(padTaskService.getById(id));
    }

    /** 查询任务的操作记录 */
    @GetMapping("/{id}/records")
    public Result<List<PadOperationRecord>> getRecords(@PathVariable Long id) {
        LambdaQueryWrapper<PadOperationRecord> qw = new LambdaQueryWrapper<>();
        qw.eq(PadOperationRecord::getTaskId, id).orderByAsc(PadOperationRecord::getOperationTime);
        return Result.success(padOperationRecordService.list(qw));
    }

    /** 新增 */
    @PostMapping
    public Result<PadTask> create(@RequestBody PadTask entity) {
        if (!StringUtils.hasText(entity.getTaskNo())) {
            entity.setTaskNo("PT-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss")));
        }
        if (!StringUtils.hasText(entity.getStatus()))   entity.setStatus("PENDING");
        if (!StringUtils.hasText(entity.getPriority())) entity.setPriority("NORMAL");
        if (entity.getPlanQuantity() == null)            entity.setPlanQuantity(BigDecimal.ONE);
        if (entity.getOperationId() == null)             entity.setOperationId(1L);
        if (entity.getProductId() == null)               entity.setProductId(1L);
        if (entity.getBomId() == null)                   entity.setBomId(1L);
        if (entity.getCompletedQuantity() == null)       entity.setCompletedQuantity(BigDecimal.ZERO);
        if (entity.getQualifiedQuantity() == null)       entity.setQualifiedQuantity(BigDecimal.ZERO);
        if (entity.getRejectedQuantity() == null)        entity.setRejectedQuantity(BigDecimal.ZERO);
        if (entity.getProgress() == null)                entity.setProgress(BigDecimal.ZERO);
        padTaskService.save(entity);
        return Result.success(entity);
    }

    /** 修改 */
    @PutMapping("/{id}")
    public Result<Boolean> update(@PathVariable Long id, @RequestBody PadTask entity) {
        entity.setId(id);
        return Result.success(padTaskService.updateById(entity));
    }

    /** 更新状态 */
    @PutMapping("/{id}/status")
    public Result<Boolean> updateStatus(@PathVariable Long id, @RequestBody java.util.Map<String, String> body) {
        PadTask entity = new PadTask();
        entity.setId(id);
        if (body.containsKey("status")) entity.setStatus(body.get("status"));
        if (body.containsKey("operatorName")) entity.setOperatorName(body.get("operatorName"));
        if ("IN_PROGRESS".equals(body.get("status"))) entity.setActualStartTime(LocalDateTime.now());
        if ("COMPLETED".equals(body.get("status"))) entity.setActualEndTime(LocalDateTime.now());
        boolean ok = padTaskService.updateById(entity);
        // 写操作记录
        if (ok && body.containsKey("status")) {
            PadOperationRecord rec = new PadOperationRecord();
            rec.setTaskId(id);
            rec.setOperationType("STATUS_CHANGE");
            rec.setOperatorName(body.getOrDefault("operatorName", ""));
            rec.setStatusAfter(body.get("status"));
            rec.setOperationTime(LocalDateTime.now());
            rec.setQuantity(BigDecimal.ZERO);
            padOperationRecordService.save(rec);
        }
        return Result.success(ok);
    }

    /** 删除 */
    @DeleteMapping("/{id}")
    public Result<Boolean> delete(@PathVariable Long id) {
        return Result.success(padTaskService.removeById(id));
    }

    /** 批量删除 */
    @DeleteMapping("/batch")
    public Result<Boolean> batchDelete(@RequestBody List<Long> ids) {
        return Result.success(padTaskService.removeByIds(ids));
    }
}

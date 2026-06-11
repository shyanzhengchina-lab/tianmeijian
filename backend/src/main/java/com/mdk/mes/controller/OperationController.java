package com.mdk.mes.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.mdk.mes.common.PageResult;
import com.mdk.mes.common.Result;
import com.mdk.mes.entity.Operation;
import com.mdk.mes.service.OperationService;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/operations")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class OperationController {
    private final OperationService operationService;

    @GetMapping("/page")
    public Result<PageResult<Operation>> page(
            @RequestParam(defaultValue = "1") Integer current,
            @RequestParam(defaultValue = "20") Integer pageSize,
            @RequestParam(required = false) String operationCode,
            @RequestParam(required = false) String operationName,
            @RequestParam(required = false) Long routingStepId) {
        LambdaQueryWrapper<Operation> wrapper = new LambdaQueryWrapper<Operation>()
                .orderByDesc(Operation::getCreateTime);
        if (StringUtils.hasText(operationCode)) wrapper.like(Operation::getOperationCode, operationCode);
        if (StringUtils.hasText(operationName)) wrapper.like(Operation::getOperationName, operationName);
        if (routingStepId != null) wrapper.eq(Operation::getRoutingStepId, routingStepId);
        IPage<Operation> pageResult = operationService.page(new Page<>(current, pageSize), wrapper);
        return Result.success(PageResult.of(pageResult.getRecords(), pageResult.getTotal(), current, pageSize));
    }

    @GetMapping("/list")
    public Result<List<Operation>> list(
            @RequestParam(required = false) Long routingStepId,
            @RequestParam(required = false) String operationCode) {
        LambdaQueryWrapper<Operation> wrapper = new LambdaQueryWrapper<Operation>()
                .orderByAsc(Operation::getSeqInStep);
        if (routingStepId != null) wrapper.eq(Operation::getRoutingStepId, routingStepId);
        if (StringUtils.hasText(operationCode)) wrapper.like(Operation::getOperationCode, operationCode);
        return Result.success(operationService.list(wrapper));
    }

    @GetMapping("/{id}")
    public Result<Operation> getById(@PathVariable Long id) {
        Operation entity = operationService.getById(id);
        if (entity == null) return Result.fail(404, "记录不存在");
        return Result.success(entity);
    }

    @PostMapping
    public Result<Operation> create(@RequestBody Operation entity) {
        if (!StringUtils.hasText(entity.getOperationCode())) entity.setOperationCode("OP-" + System.currentTimeMillis());
        if (!StringUtils.hasText(entity.getOperationName())) entity.setOperationName("工序");
        operationService.save(entity);
        return Result.success(entity);
    }

    @PutMapping("/{id}")
    public Result<Void> update(@PathVariable Long id, @RequestBody Operation entity) {
        entity.setId(id);
        operationService.updateById(entity);
        return Result.success();
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        operationService.removeById(id);
        return Result.success();
    }

    @DeleteMapping("/batch")
    public Result<Void> batchDelete(@RequestBody List<Long> ids) {
        operationService.removeByIds(ids);
        return Result.success();
    }
}

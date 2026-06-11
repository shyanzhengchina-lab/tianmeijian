package com.mdk.mes.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.mdk.mes.common.Result;
import com.mdk.mes.entity.RoutingStep;
import com.mdk.mes.service.RoutingStepService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/routing-steps")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class RoutingStepController {
    private final RoutingStepService routingStepService;

    @GetMapping("/list")
    public Result<List<RoutingStep>> list(@RequestParam(required = false) Long routingId) {
        LambdaQueryWrapper<RoutingStep> wrapper = new LambdaQueryWrapper<RoutingStep>()
                .orderByAsc(RoutingStep::getRoutingId, RoutingStep::getStepNo);
        if (routingId != null) wrapper.eq(RoutingStep::getRoutingId, routingId);
        return Result.success(routingStepService.list(wrapper));
    }

    @GetMapping("/{id}")
    public Result<RoutingStep> getById(@PathVariable Long id) {
        RoutingStep entity = routingStepService.getById(id);
        if (entity == null) return Result.fail(404, "记录不存在");
        return Result.success(entity);
    }

    @PostMapping
    public Result<RoutingStep> create(@RequestBody RoutingStep entity) {
        if (entity.getStepNo() == null) entity.setStepNo(10);
        if (entity.getReportPoint() == null) entity.setReportPoint(1);
        routingStepService.save(entity);
        return Result.success(entity);
    }

    @PutMapping("/{id}")
    public Result<Void> update(@PathVariable Long id, @RequestBody RoutingStep entity) {
        entity.setId(id);
        routingStepService.updateById(entity);
        return Result.success();
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        routingStepService.removeById(id);
        return Result.success();
    }

    @DeleteMapping("/batch")
    public Result<Void> batchDelete(@RequestBody List<Long> ids) {
        routingStepService.removeByIds(ids);
        return Result.success();
    }
}

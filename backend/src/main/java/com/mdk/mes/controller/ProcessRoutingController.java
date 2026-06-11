package com.mdk.mes.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.mdk.mes.common.PageResult;
import com.mdk.mes.common.Result;
import com.mdk.mes.entity.ProcessRouting;
import com.mdk.mes.service.ProcessRoutingService;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/process-routings")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ProcessRoutingController {
    private final ProcessRoutingService processRoutingService;

    @GetMapping("/page")
    public Result<PageResult<ProcessRouting>> page(
            @RequestParam(defaultValue = "1") Integer current,
            @RequestParam(defaultValue = "20") Integer pageSize,
            @RequestParam(required = false) String routingCode,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String productModel) {
        LambdaQueryWrapper<ProcessRouting> wrapper = new LambdaQueryWrapper<ProcessRouting>()
                .orderByDesc(ProcessRouting::getCreateTime);
        if (StringUtils.hasText(routingCode)) wrapper.like(ProcessRouting::getRoutingCode, routingCode);
        if (StringUtils.hasText(status)) wrapper.eq(ProcessRouting::getStatus, status);
        if (StringUtils.hasText(productModel)) wrapper.like(ProcessRouting::getProductModel, productModel);
        IPage<ProcessRouting> pageResult = processRoutingService.page(new Page<>(current, pageSize), wrapper);
        return Result.success(PageResult.of(pageResult.getRecords(), pageResult.getTotal(), current, pageSize));
    }

    @GetMapping("/list")
    public Result<List<ProcessRouting>> list(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String routingCode) {
        LambdaQueryWrapper<ProcessRouting> wrapper = new LambdaQueryWrapper<ProcessRouting>()
                .orderByDesc(ProcessRouting::getCreateTime);
        if (StringUtils.hasText(status)) wrapper.eq(ProcessRouting::getStatus, status);
        if (StringUtils.hasText(routingCode)) wrapper.like(ProcessRouting::getRoutingCode, routingCode);
        return Result.success(processRoutingService.list(wrapper));
    }

    @GetMapping("/{id}")
    public Result<ProcessRouting> getById(@PathVariable Long id) {
        ProcessRouting entity = processRoutingService.getById(id);
        if (entity == null) return Result.fail(404, "记录不存在");
        return Result.success(entity);
    }

    @PostMapping
    public Result<ProcessRouting> create(@RequestBody ProcessRouting entity) {
        if (!StringUtils.hasText(entity.getStatus())) entity.setStatus("DRAFT");
        if (!StringUtils.hasText(entity.getVersion())) entity.setVersion("V1.0");
        if (!StringUtils.hasText(entity.getProductModel())) entity.setProductModel("DEFAULT");
        processRoutingService.save(entity);
        return Result.success(entity);
    }

    @PutMapping("/{id}")
    public Result<Void> update(@PathVariable Long id, @RequestBody ProcessRouting entity) {
        entity.setId(id);
        processRoutingService.updateById(entity);
        return Result.success();
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        processRoutingService.removeById(id);
        return Result.success();
    }

    @DeleteMapping("/batch")
    public Result<Void> batchDelete(@RequestBody List<Long> ids) {
        processRoutingService.removeByIds(ids);
        return Result.success();
    }
}

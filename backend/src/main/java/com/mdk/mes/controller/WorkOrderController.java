package com.mdk.mes.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.mdk.mes.common.PageResult;
import com.mdk.mes.common.Result;
import com.mdk.mes.entity.WorkOrder;
import com.mdk.mes.service.WorkOrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 生产工单 Controller (L2)
 */
@RestController
@RequestMapping("/work-orders")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class WorkOrderController {

    private final WorkOrderService workOrderService;

    /** 分页查询 */
    @GetMapping("/page")
    public Result<PageResult<WorkOrder>> page(
            @RequestParam(defaultValue = "1") Integer current,
            @RequestParam(defaultValue = "20") Integer pageSize,
            @RequestParam(required = false) String workOrderNo,
            @RequestParam(required = false) Long orderId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String materialName) {
        LambdaQueryWrapper<WorkOrder> wrapper = new LambdaQueryWrapper<WorkOrder>()
                .orderByDesc(WorkOrder::getCreateTime);
        if (StringUtils.hasText(workOrderNo)) wrapper.like(WorkOrder::getWorkOrderNo, workOrderNo);
        if (orderId != null) wrapper.eq(WorkOrder::getOrderId, orderId);
        if (StringUtils.hasText(status)) wrapper.eq(WorkOrder::getStatus, status);
        if (StringUtils.hasText(materialName)) wrapper.like(WorkOrder::getMaterialName, materialName);
        IPage<WorkOrder> pageResult = workOrderService.page(new Page<>(current, pageSize), wrapper);
        return Result.success(PageResult.of(pageResult.getRecords(), pageResult.getTotal(), current, pageSize));
    }

    /** 查询全部（不分页） */
    @GetMapping("/list")
    public Result<List<WorkOrder>> list(
            @RequestParam(required = false) Long orderId,
            @RequestParam(required = false) String status) {
        LambdaQueryWrapper<WorkOrder> wrapper = new LambdaQueryWrapper<WorkOrder>()
                .orderByDesc(WorkOrder::getCreateTime);
        if (orderId != null) wrapper.eq(WorkOrder::getOrderId, orderId);
        if (StringUtils.hasText(status)) wrapper.eq(WorkOrder::getStatus, status);
        return Result.success(workOrderService.list(wrapper));
    }

    /** 根据ID查询 */
    @GetMapping("/{id}")
    public Result<WorkOrder> getById(@PathVariable Long id) {
        WorkOrder entity = workOrderService.getById(id);
        if (entity == null) return Result.fail(404, "记录不存在");
        return Result.success(entity);
    }

    /** 新增 */
    @PostMapping
    public Result<WorkOrder> create(@RequestBody WorkOrder entity) {
        if (!StringUtils.hasText(entity.getStatus())) entity.setStatus("DRAFT");
        // material_id is NOT NULL in schema; default to 1 if not provided
        if (entity.getMaterialId() == null) entity.setMaterialId(1L);
        workOrderService.save(entity);
        return Result.success(entity);
    }

    /** 修改 */
    @PutMapping("/{id}")
    public Result<Void> update(@PathVariable Long id, @RequestBody WorkOrder entity) {
        entity.setId(id);
        workOrderService.updateById(entity);
        return Result.success();
    }

    /** 删除（逻辑删除） */
    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        workOrderService.removeById(id);
        return Result.success();
    }

    /** 批量删除 */
    @DeleteMapping("/batch")
    public Result<Void> batchDelete(@RequestBody List<Long> ids) {
        workOrderService.removeByIds(ids);
        return Result.success();
    }
}

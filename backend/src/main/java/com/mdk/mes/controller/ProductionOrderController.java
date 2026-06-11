package com.mdk.mes.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.mdk.mes.common.PageResult;
import com.mdk.mes.common.Result;
import com.mdk.mes.entity.ProductionOrder;
import com.mdk.mes.service.ProductionOrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 生产订单 Controller (L1)
 */
@RestController
@RequestMapping("/production-orders")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ProductionOrderController {

    private final ProductionOrderService productionOrderService;

    /** 分页查询 */
    @GetMapping("/page")
    public Result<PageResult<ProductionOrder>> page(
            @RequestParam(defaultValue = "1") Integer current,
            @RequestParam(defaultValue = "20") Integer pageSize,
            @RequestParam(required = false) String orderNo,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String customerName) {
        LambdaQueryWrapper<ProductionOrder> wrapper = new LambdaQueryWrapper<ProductionOrder>()
                .orderByDesc(ProductionOrder::getCreateTime);
        if (StringUtils.hasText(orderNo)) wrapper.like(ProductionOrder::getOrderNo, orderNo);
        if (StringUtils.hasText(status)) wrapper.eq(ProductionOrder::getStatus, status);
        if (StringUtils.hasText(customerName)) wrapper.like(ProductionOrder::getCustomerName, customerName);
        IPage<ProductionOrder> pageResult = productionOrderService.page(new Page<>(current, pageSize), wrapper);
        return Result.success(PageResult.of(pageResult.getRecords(), pageResult.getTotal(), current, pageSize));
    }

    /** 查询全部（不分页） */
    @GetMapping("/list")
    public Result<List<ProductionOrder>> list(
            @RequestParam(required = false) String status) {
        LambdaQueryWrapper<ProductionOrder> wrapper = new LambdaQueryWrapper<ProductionOrder>()
                .orderByDesc(ProductionOrder::getCreateTime);
        if (StringUtils.hasText(status)) wrapper.eq(ProductionOrder::getStatus, status);
        return Result.success(productionOrderService.list(wrapper));
    }

    /** 根据ID查询 */
    @GetMapping("/{id}")
    public Result<ProductionOrder> getById(@PathVariable Long id) {
        ProductionOrder entity = productionOrderService.getById(id);
        if (entity == null) return Result.fail(404, "记录不存在");
        return Result.success(entity);
    }

    /** 新增 */
    @PostMapping
    public Result<ProductionOrder> create(@RequestBody ProductionOrder entity) {
        if (!StringUtils.hasText(entity.getStatus())) entity.setStatus("DRAFT");
        productionOrderService.save(entity);
        return Result.success(entity);
    }

    /** 修改 */
    @PutMapping("/{id}")
    public Result<Void> update(@PathVariable Long id, @RequestBody ProductionOrder entity) {
        entity.setId(id);
        productionOrderService.updateById(entity);
        return Result.success();
    }

    /** 删除（逻辑删除） */
    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        productionOrderService.removeById(id);
        return Result.success();
    }

    /** 批量删除 */
    @DeleteMapping("/batch")
    public Result<Void> batchDelete(@RequestBody List<Long> ids) {
        productionOrderService.removeByIds(ids);
        return Result.success();
    }
}

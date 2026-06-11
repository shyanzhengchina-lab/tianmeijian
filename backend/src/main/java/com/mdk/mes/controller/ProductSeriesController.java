package com.mdk.mes.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.mdk.mes.common.PageResult;
import com.mdk.mes.common.Result;
import com.mdk.mes.entity.ProductSeries;
import com.mdk.mes.service.ProductSeriesService;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 产品系列管理 Controller
 */
@RestController
@RequestMapping("/product-series")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ProductSeriesController {

    private final ProductSeriesService productSeriesService;

    /** 分页查询 */
    @GetMapping("/page")
    public Result<PageResult<ProductSeries>> page(
            @RequestParam(defaultValue = "1") Integer current,
            @RequestParam(defaultValue = "15") Integer pageSize) {
        IPage<ProductSeries> pageResult = productSeriesService.page(
                new Page<>(current, pageSize),
                new LambdaQueryWrapper<ProductSeries>().eq(ProductSeries::getDeleted, 0).orderByDesc(ProductSeries::getCreateTime));
        return Result.success(PageResult.of(pageResult.getRecords(), pageResult.getTotal(), current, pageSize));
    }

    /** 查询全部（不分页） */
    @GetMapping("/list")
    public Result<List<ProductSeries>> list() {
        List<ProductSeries> list = productSeriesService.list(
                new LambdaQueryWrapper<ProductSeries>().eq(ProductSeries::getDeleted, 0).orderByDesc(ProductSeries::getCreateTime));
        return Result.success(list);
    }

    /** 根据ID查询 */
    @GetMapping("/{id}")
    public Result<ProductSeries> getById(@PathVariable Long id) {
        ProductSeries entity = productSeriesService.getById(id);
        if (entity == null) return Result.fail(404, "记录不存在");
        return Result.success(entity);
    }

    /** 新增 */
    @PostMapping
    public Result<ProductSeries> create(@RequestBody ProductSeries entity) {
        productSeriesService.save(entity);
        return Result.success(entity);
    }

    /** 修改 */
    @PutMapping("/{id}")
    public Result<Void> update(@PathVariable Long id, @RequestBody ProductSeries entity) {
        entity.setId(id);
        productSeriesService.updateById(entity);
        return Result.success();
    }

    /** 删除（逻辑删除） */
    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        productSeriesService.removeById(id);
        return Result.success();
    }

    /** 批量删除 */
    @DeleteMapping("/batch")
    public Result<Void> batchDelete(@RequestBody List<Long> ids) {
        productSeriesService.removeByIds(ids);
        return Result.success();
    }
}

package com.mdk.mes.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.mdk.mes.common.PageResult;
import com.mdk.mes.common.Result;
import com.mdk.mes.entity.InspectionItem;
import com.mdk.mes.service.InspectionItemService;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/inspection-items")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class InspectionItemController {

    private final InspectionItemService inspectionItemService;

    /** 全量列表（不分页） */
    @GetMapping("/list")
    public Result<List<InspectionItem>> list(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Integer status) {
        LambdaQueryWrapper<InspectionItem> qw = new LambdaQueryWrapper<>();
        if (StringUtils.hasText(category)) qw.eq(InspectionItem::getCategory, category);
        if (status != null) qw.eq(InspectionItem::getStatus, status);
        qw.orderByAsc(InspectionItem::getCode);
        return Result.success(inspectionItemService.list(qw));
    }

    /** 分页查询 */
    @GetMapping("/page")
    public Result<PageResult<InspectionItem>> page(
            @RequestParam(defaultValue = "1") int current,
            @RequestParam(defaultValue = "20") int pageSize,
            @RequestParam(required = false) String code,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Integer status) {
        LambdaQueryWrapper<InspectionItem> qw = new LambdaQueryWrapper<>();
        if (StringUtils.hasText(code)) qw.like(InspectionItem::getCode, code);
        if (StringUtils.hasText(category)) qw.eq(InspectionItem::getCategory, category);
        if (status != null) qw.eq(InspectionItem::getStatus, status);
        qw.orderByAsc(InspectionItem::getCode);
        Page<InspectionItem> page = inspectionItemService.page(new Page<>(current, pageSize), qw);
        return Result.success(PageResult.of(page.getRecords(), page.getTotal(), current, pageSize));
    }

    /** 根据ID查询 */
    @GetMapping("/{id}")
    public Result<InspectionItem> getById(@PathVariable Long id) {
        return Result.success(inspectionItemService.getById(id));
    }

    /** 新增 */
    @PostMapping
    public Result<InspectionItem> create(@RequestBody InspectionItem entity) {
        if (!StringUtils.hasText(entity.getCode())) entity.setCode("QCI-" + System.currentTimeMillis());
        if (!StringUtils.hasText(entity.getName())) entity.setName("质检项目");
        if (entity.getStatus() == null) entity.setStatus(1);
        if (entity.getIsKeyItem() == null) entity.setIsKeyItem(0);
        inspectionItemService.save(entity);
        return Result.success(entity);
    }

    /** 修改 */
    @PutMapping("/{id}")
    public Result<Boolean> update(@PathVariable Long id, @RequestBody InspectionItem entity) {
        entity.setId(id);
        return Result.success(inspectionItemService.updateById(entity));
    }

    /** 删除 */
    @DeleteMapping("/{id}")
    public Result<Boolean> delete(@PathVariable Long id) {
        return Result.success(inspectionItemService.removeById(id));
    }

    /** 批量删除 */
    @DeleteMapping("/batch")
    public Result<Boolean> batchDelete(@RequestBody List<Long> ids) {
        return Result.success(inspectionItemService.removeByIds(ids));
    }
}

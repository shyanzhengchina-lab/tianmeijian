package com.mdk.mes.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.mdk.mes.common.Result;
import com.mdk.mes.entity.BomDetail;
import com.mdk.mes.service.BomDetailService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/bom-details")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class BomDetailController {
    private final BomDetailService bomDetailService;

    @GetMapping("/list")
    public Result<List<BomDetail>> list(@RequestParam(required = false) Long bomId) {
        LambdaQueryWrapper<BomDetail> wrapper = new LambdaQueryWrapper<BomDetail>()
                .orderByAsc(BomDetail::getBomId, BomDetail::getLineNo);
        if (bomId != null) wrapper.eq(BomDetail::getBomId, bomId);
        return Result.success(bomDetailService.list(wrapper));
    }

    @GetMapping("/{id}")
    public Result<BomDetail> getById(@PathVariable Long id) {
        BomDetail entity = bomDetailService.getById(id);
        if (entity == null) return Result.fail(404, "记录不存在");
        return Result.success(entity);
    }

    @PostMapping
    public Result<BomDetail> create(@RequestBody BomDetail entity) {
        if (entity.getMaterialId() == null) entity.setMaterialId(1L);
        if (entity.getLineNo() == null) entity.setLineNo(10);
        bomDetailService.save(entity);
        return Result.success(entity);
    }

    @PutMapping("/{id}")
    public Result<Void> update(@PathVariable Long id, @RequestBody BomDetail entity) {
        entity.setId(id);
        bomDetailService.updateById(entity);
        return Result.success();
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        bomDetailService.removeById(id);
        return Result.success();
    }

    @DeleteMapping("/batch")
    public Result<Void> batchDelete(@RequestBody List<Long> ids) {
        bomDetailService.removeByIds(ids);
        return Result.success();
    }
}

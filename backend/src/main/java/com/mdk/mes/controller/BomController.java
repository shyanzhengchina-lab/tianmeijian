package com.mdk.mes.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.mdk.mes.common.PageResult;
import com.mdk.mes.common.Result;
import com.mdk.mes.entity.Bom;
import com.mdk.mes.entity.BomDetail;
import com.mdk.mes.service.BomService;
import com.mdk.mes.service.BomDetailService;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/boms")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class BomController {
    private final BomService bomService;
    private final BomDetailService bomDetailService;

    @GetMapping("/page")
    public Result<PageResult<Bom>> page(
            @RequestParam(defaultValue = "1") Integer current,
            @RequestParam(defaultValue = "20") Integer pageSize,
            @RequestParam(required = false) String code,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String materialName) {
        LambdaQueryWrapper<Bom> wrapper = new LambdaQueryWrapper<Bom>()
                .orderByDesc(Bom::getCreateTime);
        if (StringUtils.hasText(code)) wrapper.like(Bom::getCode, code);
        if (StringUtils.hasText(status)) wrapper.eq(Bom::getStatus, status);
        if (StringUtils.hasText(materialName)) wrapper.like(Bom::getMaterialName, materialName);
        IPage<Bom> pageResult = bomService.page(new Page<>(current, pageSize), wrapper);
        return Result.success(PageResult.of(pageResult.getRecords(), pageResult.getTotal(), current, pageSize));
    }

    @GetMapping("/list")
    public Result<List<Bom>> list(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String code) {
        LambdaQueryWrapper<Bom> wrapper = new LambdaQueryWrapper<Bom>()
                .orderByDesc(Bom::getCreateTime);
        if (StringUtils.hasText(status)) wrapper.eq(Bom::getStatus, status);
        if (StringUtils.hasText(code)) wrapper.like(Bom::getCode, code);
        return Result.success(bomService.list(wrapper));
    }

    @GetMapping("/{id}")
    public Result<Bom> getById(@PathVariable Long id) {
        Bom entity = bomService.getById(id);
        if (entity == null) return Result.fail(404, "记录不存在");
        return Result.success(entity);
    }

    @GetMapping("/{id}/details")
    public Result<List<BomDetail>> getDetails(@PathVariable Long id) {
        LambdaQueryWrapper<BomDetail> wrapper = new LambdaQueryWrapper<BomDetail>()
                .eq(BomDetail::getBomId, id)
                .orderByAsc(BomDetail::getLineNo);
        return Result.success(bomDetailService.list(wrapper));
    }

    @PostMapping
    public Result<Bom> create(@RequestBody Bom entity) {
        if (!StringUtils.hasText(entity.getStatus())) entity.setStatus("DRAFT");
        if (entity.getMaterialId() == null) entity.setMaterialId(1L);
        bomService.save(entity);
        return Result.success(entity);
    }

    @PutMapping("/{id}")
    public Result<Void> update(@PathVariable Long id, @RequestBody Bom entity) {
        entity.setId(id);
        bomService.updateById(entity);
        return Result.success();
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        bomService.removeById(id);
        return Result.success();
    }

    @DeleteMapping("/batch")
    public Result<Void> batchDelete(@RequestBody List<Long> ids) {
        bomService.removeByIds(ids);
        return Result.success();
    }
}

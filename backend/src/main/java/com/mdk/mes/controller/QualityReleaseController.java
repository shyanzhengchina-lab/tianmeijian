package com.mdk.mes.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.mdk.mes.common.PageResult;
import com.mdk.mes.common.Result;
import com.mdk.mes.entity.QualityRelease;
import com.mdk.mes.service.QualityReleaseService;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/quality-releases")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class QualityReleaseController {
    private final QualityReleaseService qualityReleaseService;

    @GetMapping("/page")
    public Result<PageResult<QualityRelease>> page(
            @RequestParam(defaultValue = "1") Integer current,
            @RequestParam(defaultValue = "20") Integer pageSize,
            @RequestParam(required = false) String releaseNo,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String releaseType,
            @RequestParam(required = false) String materialName) {
        LambdaQueryWrapper<QualityRelease> wrapper = new LambdaQueryWrapper<QualityRelease>()
                .orderByDesc(QualityRelease::getCreateTime);
        if (StringUtils.hasText(releaseNo)) wrapper.like(QualityRelease::getReleaseNo, releaseNo);
        if (StringUtils.hasText(status)) wrapper.eq(QualityRelease::getStatus, status);
        if (StringUtils.hasText(releaseType)) wrapper.eq(QualityRelease::getReleaseType, releaseType);
        if (StringUtils.hasText(materialName)) wrapper.like(QualityRelease::getMaterialName, materialName);
        IPage<QualityRelease> pageResult = qualityReleaseService.page(new Page<>(current, pageSize), wrapper);
        return Result.success(PageResult.of(pageResult.getRecords(), pageResult.getTotal(), current, pageSize));
    }

    @GetMapping("/list")
    public Result<List<QualityRelease>> list(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String releaseType) {
        LambdaQueryWrapper<QualityRelease> wrapper = new LambdaQueryWrapper<QualityRelease>()
                .orderByDesc(QualityRelease::getCreateTime);
        if (StringUtils.hasText(status)) wrapper.eq(QualityRelease::getStatus, status);
        if (StringUtils.hasText(releaseType)) wrapper.eq(QualityRelease::getReleaseType, releaseType);
        return Result.success(qualityReleaseService.list(wrapper));
    }

    @GetMapping("/{id}")
    public Result<QualityRelease> getById(@PathVariable Long id) {
        QualityRelease entity = qualityReleaseService.getById(id);
        if (entity == null) return Result.fail(404, "记录不存在");
        return Result.success(entity);
    }

    @PostMapping
    public Result<QualityRelease> create(@RequestBody QualityRelease entity) {
        if (!StringUtils.hasText(entity.getStatus())) entity.setStatus("PENDING");
        if (!StringUtils.hasText(entity.getReleaseNo())) entity.setReleaseNo("REL-" + System.currentTimeMillis());
        if (!StringUtils.hasText(entity.getReleaseType())) entity.setReleaseType("FINISHED");
        if (!StringUtils.hasText(entity.getBatchNo())) entity.setBatchNo("BATCH-" + System.currentTimeMillis());
        qualityReleaseService.save(entity);
        return Result.success(entity);
    }

    @PutMapping("/{id}")
    public Result<Void> update(@PathVariable Long id, @RequestBody QualityRelease entity) {
        entity.setId(id);
        qualityReleaseService.updateById(entity);
        return Result.success();
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        qualityReleaseService.removeById(id);
        return Result.success();
    }

    @DeleteMapping("/batch")
    public Result<Void> batchDelete(@RequestBody List<Long> ids) {
        qualityReleaseService.removeByIds(ids);
        return Result.success();
    }
}

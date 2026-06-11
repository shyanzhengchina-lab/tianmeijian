package com.mdk.mes.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.mdk.mes.common.PageResult;
import com.mdk.mes.common.Result;
import com.mdk.mes.entity.MrbRecord;
import com.mdk.mes.service.MrbRecordService;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/mrb-records")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class MrbRecordController {
    private final MrbRecordService mrbRecordService;

    @GetMapping("/page")
    public Result<PageResult<MrbRecord>> page(
            @RequestParam(defaultValue = "1") Integer current,
            @RequestParam(defaultValue = "20") Integer pageSize,
            @RequestParam(required = false) String mrbNo,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String materialName) {
        LambdaQueryWrapper<MrbRecord> wrapper = new LambdaQueryWrapper<MrbRecord>()
                .orderByDesc(MrbRecord::getCreateTime);
        if (StringUtils.hasText(mrbNo)) wrapper.like(MrbRecord::getMrbNo, mrbNo);
        if (StringUtils.hasText(status)) wrapper.eq(MrbRecord::getStatus, status);
        if (StringUtils.hasText(materialName)) wrapper.like(MrbRecord::getMaterialName, materialName);
        IPage<MrbRecord> pageResult = mrbRecordService.page(new Page<>(current, pageSize), wrapper);
        return Result.success(PageResult.of(pageResult.getRecords(), pageResult.getTotal(), current, pageSize));
    }

    @GetMapping("/list")
    public Result<List<MrbRecord>> list(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String mrbNo) {
        LambdaQueryWrapper<MrbRecord> wrapper = new LambdaQueryWrapper<MrbRecord>()
                .orderByDesc(MrbRecord::getCreateTime);
        if (StringUtils.hasText(status)) wrapper.eq(MrbRecord::getStatus, status);
        if (StringUtils.hasText(mrbNo)) wrapper.like(MrbRecord::getMrbNo, mrbNo);
        return Result.success(mrbRecordService.list(wrapper));
    }

    @GetMapping("/{id}")
    public Result<MrbRecord> getById(@PathVariable Long id) {
        MrbRecord entity = mrbRecordService.getById(id);
        if (entity == null) return Result.fail(404, "记录不存在");
        return Result.success(entity);
    }

    @PostMapping
    public Result<MrbRecord> create(@RequestBody MrbRecord entity) {
        if (!StringUtils.hasText(entity.getStatus())) entity.setStatus("PENDING");
        if (!StringUtils.hasText(entity.getMrbNo())) entity.setMrbNo("MRB-" + System.currentTimeMillis());
        mrbRecordService.save(entity);
        return Result.success(entity);
    }

    @PutMapping("/{id}")
    public Result<Void> update(@PathVariable Long id, @RequestBody MrbRecord entity) {
        entity.setId(id);
        mrbRecordService.updateById(entity);
        return Result.success();
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        mrbRecordService.removeById(id);
        return Result.success();
    }

    @DeleteMapping("/batch")
    public Result<Void> batchDelete(@RequestBody List<Long> ids) {
        mrbRecordService.removeByIds(ids);
        return Result.success();
    }
}

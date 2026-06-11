package com.mdk.mes.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.mdk.mes.common.PageResult;
import com.mdk.mes.common.Result;
import com.mdk.mes.entity.PadIssuance;
import com.mdk.mes.service.PadIssuanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * PAD发放管理 Controller
 */
@RestController
@RequestMapping("/pad-issuances")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PadIssuanceController {

    private final PadIssuanceService padIssuanceService;

    /** 分页查询 */
    @GetMapping("/page")
    public Result<PageResult<PadIssuance>> page(
            @RequestParam(defaultValue = "1") Integer current,
            @RequestParam(defaultValue = "15") Integer pageSize) {
        IPage<PadIssuance> pageResult = padIssuanceService.page(
                new Page<>(current, pageSize),
                new LambdaQueryWrapper<PadIssuance>().eq(PadIssuance::getDeleted, 0).orderByDesc(PadIssuance::getCreateTime));
        return Result.success(PageResult.of(pageResult.getRecords(), pageResult.getTotal(), current, pageSize));
    }

    /** 查询全部（不分页） */
    @GetMapping("/list")
    public Result<List<PadIssuance>> list() {
        List<PadIssuance> list = padIssuanceService.list(
                new LambdaQueryWrapper<PadIssuance>().eq(PadIssuance::getDeleted, 0).orderByDesc(PadIssuance::getCreateTime));
        return Result.success(list);
    }

    /** 根据ID查询 */
    @GetMapping("/{id}")
    public Result<PadIssuance> getById(@PathVariable Long id) {
        PadIssuance entity = padIssuanceService.getById(id);
        if (entity == null) return Result.fail(404, "记录不存在");
        return Result.success(entity);
    }

    /** 新增 */
    @PostMapping
    public Result<PadIssuance> create(@RequestBody PadIssuance entity) {
        padIssuanceService.save(entity);
        return Result.success(entity);
    }

    /** 修改 */
    @PutMapping("/{id}")
    public Result<Void> update(@PathVariable Long id, @RequestBody PadIssuance entity) {
        entity.setId(id);
        padIssuanceService.updateById(entity);
        return Result.success();
    }

    /** 删除（逻辑删除） */
    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        padIssuanceService.removeById(id);
        return Result.success();
    }

    /** 批量删除 */
    @DeleteMapping("/batch")
    public Result<Void> batchDelete(@RequestBody List<Long> ids) {
        padIssuanceService.removeByIds(ids);
        return Result.success();
    }
}

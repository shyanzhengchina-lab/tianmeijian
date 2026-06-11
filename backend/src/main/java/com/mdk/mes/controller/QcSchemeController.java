package com.mdk.mes.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.mdk.mes.common.PageResult;
import com.mdk.mes.common.Result;
import com.mdk.mes.entity.QcScheme;
import com.mdk.mes.service.QcSchemeService;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 质检方案管理 Controller
 */
@RestController
@RequestMapping("/qc-schemes")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class QcSchemeController {

    private final QcSchemeService qcSchemeService;

    /** 分页查询 */
    @GetMapping("/page")
    public Result<PageResult<QcScheme>> page(
            @RequestParam(defaultValue = "1") Integer current,
            @RequestParam(defaultValue = "15") Integer pageSize) {
        IPage<QcScheme> pageResult = qcSchemeService.page(
                new Page<>(current, pageSize),
                new LambdaQueryWrapper<QcScheme>().eq(QcScheme::getDeleted, 0).orderByDesc(QcScheme::getCreateTime));
        return Result.success(PageResult.of(pageResult.getRecords(), pageResult.getTotal(), current, pageSize));
    }

    /** 查询全部（不分页） */
    @GetMapping("/list")
    public Result<List<QcScheme>> list() {
        List<QcScheme> list = qcSchemeService.list(
                new LambdaQueryWrapper<QcScheme>().eq(QcScheme::getDeleted, 0).orderByDesc(QcScheme::getCreateTime));
        return Result.success(list);
    }

    /** 根据ID查询 */
    @GetMapping("/{id}")
    public Result<QcScheme> getById(@PathVariable Long id) {
        QcScheme entity = qcSchemeService.getById(id);
        if (entity == null) return Result.fail(404, "记录不存在");
        return Result.success(entity);
    }

    /** 新增 */
    @PostMapping
    public Result<QcScheme> create(@RequestBody QcScheme entity) {
        qcSchemeService.save(entity);
        return Result.success(entity);
    }

    /** 修改 */
    @PutMapping("/{id}")
    public Result<Void> update(@PathVariable Long id, @RequestBody QcScheme entity) {
        entity.setId(id);
        qcSchemeService.updateById(entity);
        return Result.success();
    }

    /** 删除（逻辑删除） */
    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        qcSchemeService.removeById(id);
        return Result.success();
    }

    /** 批量删除 */
    @DeleteMapping("/batch")
    public Result<Void> batchDelete(@RequestBody List<Long> ids) {
        qcSchemeService.removeByIds(ids);
        return Result.success();
    }
}

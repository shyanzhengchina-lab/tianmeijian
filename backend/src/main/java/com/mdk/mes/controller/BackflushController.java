package com.mdk.mes.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.mdk.mes.common.Result;
import com.mdk.mes.entity.BackflushLog;
import com.mdk.mes.service.BackflushLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 倒扣领料日志 Controller  — /backflush-logs
 */
@RestController
@RequestMapping("/backflush-logs")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class BackflushController {

    private final BackflushLogService backflushLogService;

    /** 全量列表（支持按 woNo / materialCode / status 过滤） */
    @GetMapping("/list")
    public Result<List<BackflushLog>> list(
            @RequestParam(required = false) String woNo,
            @RequestParam(required = false) String materialCode,
            @RequestParam(required = false) String status) {
        LambdaQueryWrapper<BackflushLog> qw = new LambdaQueryWrapper<>();
        if (StringUtils.hasText(woNo))          qw.eq(BackflushLog::getWoNo, woNo);
        if (StringUtils.hasText(materialCode))  qw.like(BackflushLog::getMaterialCode, materialCode);
        if (StringUtils.hasText(status))        qw.eq(BackflushLog::getStatus, status);
        qw.orderByDesc(BackflushLog::getExecTime);
        return Result.success(backflushLogService.list(qw));
    }

    /** 新增倒扣日志 */
    @PostMapping
    public Result<BackflushLog> create(@RequestBody BackflushLog e) {
        if (!StringUtils.hasText(e.getLogNo()))        e.setLogNo("BF-" + System.currentTimeMillis());
        if (!StringUtils.hasText(e.getWoNo()))         e.setWoNo("WO-UNKNOWN");
        if (!StringUtils.hasText(e.getMaterialCode())) e.setMaterialCode("MAT-UNKNOWN");
        if (e.getBomQty() == null)    e.setBomQty(BigDecimal.ZERO);
        if (e.getActualQty() == null) e.setActualQty(BigDecimal.ZERO);
        if (!StringUtils.hasText(e.getUnit()))   e.setUnit("个");
        if (!StringUtils.hasText(e.getStatus())) e.setStatus("SUCCESS");
        if (e.getExecTime() == null)  e.setExecTime(LocalDateTime.now());
        backflushLogService.save(e);
        return Result.success(e);
    }

    /** 修改 */
    @PutMapping("/{id}")
    public Result<Boolean> update(@PathVariable Long id, @RequestBody BackflushLog e) {
        e.setId(id);
        return Result.success(backflushLogService.updateById(e));
    }

    /** 删除 */
    @DeleteMapping("/{id}")
    public Result<Boolean> delete(@PathVariable Long id) {
        return Result.success(backflushLogService.removeById(id));
    }
}

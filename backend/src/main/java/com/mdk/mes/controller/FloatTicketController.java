package com.mdk.mes.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.mdk.mes.common.PageResult;
import com.mdk.mes.common.Result;
import com.mdk.mes.entity.FloatTicket;
import com.mdk.mes.service.FloatTicketService;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 生产流转票管理 Controller (L4)
 */
@RestController
@RequestMapping("/float-tickets")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class FloatTicketController {

    private final FloatTicketService floatTicketService;

    /** 分页查询 */
    @GetMapping("/page")
    public Result<PageResult<FloatTicket>> page(
            @RequestParam(defaultValue = "1") Integer current,
            @RequestParam(defaultValue = "20") Integer pageSize,
            @RequestParam(required = false) String ticketNo,
            @RequestParam(required = false) Long workOrderId,
            @RequestParam(required = false) String status) {
        LambdaQueryWrapper<FloatTicket> wrapper = new LambdaQueryWrapper<FloatTicket>()
                .orderByDesc(FloatTicket::getCreateTime);
        if (StringUtils.hasText(ticketNo))   wrapper.like(FloatTicket::getTicketNo, ticketNo);
        if (workOrderId != null)             wrapper.eq(FloatTicket::getWorkOrderId, workOrderId);
        if (StringUtils.hasText(status))     wrapper.eq(FloatTicket::getStatus, status);
        IPage<FloatTicket> pageResult = floatTicketService.page(new Page<>(current, pageSize), wrapper);
        return Result.success(PageResult.of(pageResult.getRecords(), pageResult.getTotal(), current, pageSize));
    }

    /** 查询全部（不分页） */
    @GetMapping("/list")
    public Result<List<FloatTicket>> list(
            @RequestParam(required = false) Long workOrderId,
            @RequestParam(required = false) String status) {
        LambdaQueryWrapper<FloatTicket> wrapper = new LambdaQueryWrapper<FloatTicket>()
                .orderByDesc(FloatTicket::getCreateTime);
        if (workOrderId != null)         wrapper.eq(FloatTicket::getWorkOrderId, workOrderId);
        if (StringUtils.hasText(status)) wrapper.eq(FloatTicket::getStatus, status);
        return Result.success(floatTicketService.list(wrapper));
    }

    /** 根据ID查询 */
    @GetMapping("/{id}")
    public Result<FloatTicket> getById(@PathVariable Long id) {
        FloatTicket entity = floatTicketService.getById(id);
        if (entity == null) return Result.fail(404, "记录不存在");
        return Result.success(entity);
    }

    /** 新增 */
    @PostMapping
    public Result<FloatTicket> create(@RequestBody FloatTicket entity) {
        if (!StringUtils.hasText(entity.getStatus())) entity.setStatus("PENDING");
        floatTicketService.save(entity);
        return Result.success(entity);
    }

    /** 修改 */
    @PutMapping("/{id}")
    public Result<Void> update(@PathVariable Long id, @RequestBody FloatTicket entity) {
        entity.setId(id);
        floatTicketService.updateById(entity);
        return Result.success();
    }

    /** 删除（逻辑删除） */
    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        floatTicketService.removeById(id);
        return Result.success();
    }

    /** 批量删除 */
    @DeleteMapping("/batch")
    public Result<Void> batchDelete(@RequestBody List<Long> ids) {
        floatTicketService.removeByIds(ids);
        return Result.success();
    }
}

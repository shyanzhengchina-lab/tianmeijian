package com.mdk.mes.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.mdk.mes.common.PageResult;
import com.mdk.mes.common.Result;
import com.mdk.mes.entity.MaterialIssuance;
import com.mdk.mes.entity.MaterialIssuanceDetail;
import com.mdk.mes.service.MaterialIssuanceDetailService;
import com.mdk.mes.service.MaterialIssuanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

/**
 * 领料单管理 Controller
 */
@RestController
@RequestMapping("/material-issuances")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class MaterialIssuanceController {

    private final MaterialIssuanceService materialIssuanceService;
    private final MaterialIssuanceDetailService materialIssuanceDetailService;

    /** 分页查询 */
    @GetMapping("/page")
    public Result<PageResult<MaterialIssuance>> page(
            @RequestParam(defaultValue = "1") Integer current,
            @RequestParam(defaultValue = "15") Integer pageSize,
            @RequestParam(required = false) String status) {
        LambdaQueryWrapper<MaterialIssuance> wrapper = new LambdaQueryWrapper<MaterialIssuance>()
                .eq(MaterialIssuance::getDeleted, 0)
                .eq(StringUtils.hasText(status), MaterialIssuance::getStatus, status)
                .orderByDesc(MaterialIssuance::getCreateTime);
        IPage<MaterialIssuance> pageResult = materialIssuanceService.page(new Page<>(current, pageSize), wrapper);
        return Result.success(PageResult.of(pageResult.getRecords(), pageResult.getTotal(), current, pageSize));
    }

    /** 查询全部（不分页） */
    @GetMapping("/list")
    public Result<List<MaterialIssuance>> list(@RequestParam(required = false) String status) {
        LambdaQueryWrapper<MaterialIssuance> wrapper = new LambdaQueryWrapper<MaterialIssuance>()
                .eq(MaterialIssuance::getDeleted, 0)
                .eq(StringUtils.hasText(status), MaterialIssuance::getStatus, status)
                .orderByDesc(MaterialIssuance::getCreateTime);
        return Result.success(materialIssuanceService.list(wrapper));
    }

    /** 根据ID查询主单 + 明细 */
    @GetMapping("/{id}")
    public Result<MaterialIssuance> getById(@PathVariable Long id) {
        MaterialIssuance entity = materialIssuanceService.getById(id);
        if (entity == null) return Result.fail(404, "记录不存在");
        return Result.success(entity);
    }

    /** 查询领料单明细列表 */
    @GetMapping("/{id}/details")
    public Result<List<MaterialIssuanceDetail>> getDetails(@PathVariable Long id) {
        List<MaterialIssuanceDetail> details = materialIssuanceDetailService.list(
                new LambdaQueryWrapper<MaterialIssuanceDetail>()
                        .eq(MaterialIssuanceDetail::getIssuanceId, id)
                        .eq(MaterialIssuanceDetail::getDeleted, 0)
                        .orderByAsc(MaterialIssuanceDetail::getLineNo));
        return Result.success(details);
    }

    /** 新增领料单 */
    @PostMapping
    public Result<MaterialIssuance> create(@RequestBody MaterialIssuance entity) {
        // 自动生成领料单号
        if (!StringUtils.hasText(entity.getIssuanceNo())) {
            String no = "MI-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss"));
            entity.setIssuanceNo(no);
        }
        if (!StringUtils.hasText(entity.getStatus()))         entity.setStatus("PENDING");
        if (!StringUtils.hasText(entity.getApprovalStatus())) entity.setApprovalStatus("PENDING");
        if (!StringUtils.hasText(entity.getIssuanceType()))   entity.setIssuanceType("PRODUCTION");
        materialIssuanceService.save(entity);
        return Result.success(entity);
    }

    /** 更新领料单 */
    @PutMapping("/{id}")
    public Result<Void> update(@PathVariable Long id, @RequestBody MaterialIssuance entity) {
        entity.setId(id);
        materialIssuanceService.updateById(entity);
        return Result.success();
    }

    /** 更新领料单状态（审批/发料/收料） */
    @PutMapping("/{id}/status")
    public Result<Void> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        MaterialIssuance entity = new MaterialIssuance();
        entity.setId(id);
        if (StringUtils.hasText(body.get("status")))         entity.setStatus(body.get("status"));
        if (StringUtils.hasText(body.get("approvalStatus"))) entity.setApprovalStatus(body.get("approvalStatus"));
        if (StringUtils.hasText(body.get("approverName")))   entity.setApproverName(body.get("approverName"));
        if (StringUtils.hasText(body.get("approvalComment")))entity.setApprovalComment(body.get("approvalComment"));
        if (StringUtils.hasText(body.get("issuerName")))     entity.setIssuerName(body.get("issuerName"));
        if (StringUtils.hasText(body.get("receiverName")))   entity.setReceiverName(body.get("receiverName"));
        materialIssuanceService.updateById(entity);
        return Result.success();
    }

    /** 删除 */
    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        materialIssuanceService.removeById(id);
        return Result.success();
    }

    /** 批量删除 */
    @DeleteMapping("/batch")
    public Result<Void> batchDelete(@RequestBody List<Long> ids) {
        materialIssuanceService.removeByIds(ids);
        return Result.success();
    }
}

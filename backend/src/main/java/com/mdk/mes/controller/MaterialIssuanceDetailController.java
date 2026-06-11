package com.mdk.mes.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.mdk.mes.common.Result;
import com.mdk.mes.entity.MaterialIssuanceDetail;
import com.mdk.mes.service.MaterialIssuanceDetailService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

/**
 * 领料单明细 Controller
 */
@RestController
@RequestMapping("/material-issuance-details")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class MaterialIssuanceDetailController {

    private final MaterialIssuanceDetailService detailService;

    /** 按领料单ID查全部明细 */
    @GetMapping("/list")
    public Result<List<MaterialIssuanceDetail>> list(@RequestParam(required = false) Long issuanceId) {
        LambdaQueryWrapper<MaterialIssuanceDetail> wrapper = new LambdaQueryWrapper<MaterialIssuanceDetail>()
                .eq(MaterialIssuanceDetail::getDeleted, 0)
                .eq(issuanceId != null, MaterialIssuanceDetail::getIssuanceId, issuanceId)
                .orderByAsc(MaterialIssuanceDetail::getIssuanceId)
                .orderByAsc(MaterialIssuanceDetail::getLineNo);
        return Result.success(detailService.list(wrapper));
    }

    /** 新增明细行 */
    @PostMapping
    public Result<MaterialIssuanceDetail> create(@RequestBody MaterialIssuanceDetail entity) {
        if (entity.getIssuanceId() == null)     entity.setIssuanceId(0L);
        if (entity.getMaterialId() == null)     entity.setMaterialId(1L);
        if (entity.getLineNo() == null)         entity.setLineNo(10);
        if (entity.getRequestQuantity() == null) entity.setRequestQuantity(BigDecimal.ZERO);
        detailService.save(entity);
        return Result.success(entity);
    }

    /** 更新明细行 */
    @PutMapping("/{id}")
    public Result<Void> update(@PathVariable Long id, @RequestBody MaterialIssuanceDetail entity) {
        entity.setId(id);
        detailService.updateById(entity);
        return Result.success();
    }

    /** 删除明细行 */
    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        detailService.removeById(id);
        return Result.success();
    }
}

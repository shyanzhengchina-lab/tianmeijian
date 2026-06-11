package com.mdk.mes.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.mdk.mes.common.Result;
import com.mdk.mes.entity.EbrEquipmentUsage;
import com.mdk.mes.entity.EbrMaterialBalance;
import com.mdk.mes.entity.EbrStep;
import com.mdk.mes.service.EbrEquipmentUsageService;
import com.mdk.mes.service.EbrMaterialBalanceService;
import com.mdk.mes.service.EbrStepService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/ebr-sub")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class EbrSubController {

    private final EbrStepService ebrStepService;
    private final EbrEquipmentUsageService ebrEquipmentUsageService;
    private final EbrMaterialBalanceService ebrMaterialBalanceService;

    // ─── EBR Steps ────────────────────────────────────────────────────────

    @GetMapping("/steps")
    public Result<List<EbrStep>> listSteps(@RequestParam(required = false) Long ebrId) {
        LambdaQueryWrapper<EbrStep> qw = new LambdaQueryWrapper<>();
        if (ebrId != null) qw.eq(EbrStep::getEbrId, ebrId);
        qw.orderByAsc(EbrStep::getStepNo);
        return Result.success(ebrStepService.list(qw));
    }

    @PostMapping("/steps")
    public Result<EbrStep> createStep(@RequestBody EbrStep entity) {
        if (entity.getEbrId() == null)   entity.setEbrId(1L);
        if (entity.getStepNo() == null)  entity.setStepNo(10);
        if (entity.getStepName() == null || entity.getStepName().isBlank()) entity.setStepName("工步");
        if (entity.getStatus() == null || entity.getStatus().isBlank()) entity.setStatus("PENDING");
        ebrStepService.save(entity);
        return Result.success(entity);
    }

    @PutMapping("/steps/{id}")
    public Result<Boolean> updateStep(@PathVariable Long id, @RequestBody EbrStep entity) {
        entity.setId(id);
        return Result.success(ebrStepService.updateById(entity));
    }

    @DeleteMapping("/steps/{id}")
    public Result<Boolean> deleteStep(@PathVariable Long id) {
        return Result.success(ebrStepService.removeById(id));
    }

    // ─── Equipment Usage ──────────────────────────────────────────────────

    @GetMapping("/equipment-usages")
    public Result<List<EbrEquipmentUsage>> listEquipmentUsages(@RequestParam(required = false) Long ebrId) {
        LambdaQueryWrapper<EbrEquipmentUsage> qw = new LambdaQueryWrapper<>();
        if (ebrId != null) qw.eq(EbrEquipmentUsage::getEbrId, ebrId);
        qw.orderByAsc(EbrEquipmentUsage::getStartTime);
        return Result.success(ebrEquipmentUsageService.list(qw));
    }

    @PostMapping("/equipment-usages")
    public Result<EbrEquipmentUsage> createEquipmentUsage(@RequestBody EbrEquipmentUsage entity) {
        if (entity.getEbrId() == null)          entity.setEbrId(1L);
        if (entity.getEquipmentCode() == null || entity.getEquipmentCode().isBlank()) entity.setEquipmentCode("EQ-DEFAULT");
        if (entity.getStartTime() == null)       entity.setStartTime(LocalDateTime.now());
        if (entity.getDuration() == null)        entity.setDuration(0);
        ebrEquipmentUsageService.save(entity);
        return Result.success(entity);
    }

    @PutMapping("/equipment-usages/{id}")
    public Result<Boolean> updateEquipmentUsage(@PathVariable Long id, @RequestBody EbrEquipmentUsage entity) {
        entity.setId(id);
        return Result.success(ebrEquipmentUsageService.updateById(entity));
    }

    @DeleteMapping("/equipment-usages/{id}")
    public Result<Boolean> deleteEquipmentUsage(@PathVariable Long id) {
        return Result.success(ebrEquipmentUsageService.removeById(id));
    }

    // ─── Material Balance ─────────────────────────────────────────────────

    @GetMapping("/material-balances")
    public Result<List<EbrMaterialBalance>> listMaterialBalances(@RequestParam(required = false) Long ebrId) {
        LambdaQueryWrapper<EbrMaterialBalance> qw = new LambdaQueryWrapper<>();
        if (ebrId != null) qw.eq(EbrMaterialBalance::getEbrId, ebrId);
        qw.orderByAsc(EbrMaterialBalance::getMaterialCode);
        return Result.success(ebrMaterialBalanceService.list(qw));
    }

    @PostMapping("/material-balances")
    public Result<EbrMaterialBalance> createMaterialBalance(@RequestBody EbrMaterialBalance entity) {
        if (entity.getEbrId() == null)           entity.setEbrId(1L);
        if (entity.getMaterialId() == null)      entity.setMaterialId(1L);
        if (entity.getPlanQuantity() == null)    entity.setPlanQuantity(BigDecimal.ZERO);
        if (entity.getTheoreticalQuantity() == null) entity.setTheoreticalQuantity(BigDecimal.ZERO);
        if (entity.getActualInput() == null)     entity.setActualInput(BigDecimal.ZERO);
        if (entity.getActualOutput() == null)    entity.setActualOutput(BigDecimal.ZERO);
        if (entity.getDifference() == null)      entity.setDifference(BigDecimal.ZERO);
        if (entity.getDifferenceRate() == null)  entity.setDifferenceRate(BigDecimal.ZERO);
        if (entity.getBalanceStatus() == null || entity.getBalanceStatus().isBlank()) entity.setBalanceStatus("BALANCED");
        ebrMaterialBalanceService.save(entity);
        return Result.success(entity);
    }

    @PutMapping("/material-balances/{id}")
    public Result<Boolean> updateMaterialBalance(@PathVariable Long id, @RequestBody EbrMaterialBalance entity) {
        entity.setId(id);
        return Result.success(ebrMaterialBalanceService.updateById(entity));
    }

    @DeleteMapping("/material-balances/{id}")
    public Result<Boolean> deleteMaterialBalance(@PathVariable Long id) {
        return Result.success(ebrMaterialBalanceService.removeById(id));
    }
}

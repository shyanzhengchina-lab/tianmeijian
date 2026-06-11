package com.mdk.mes.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.mdk.mes.common.Result;
import com.mdk.mes.entity.*;
import com.mdk.mes.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 设备子模块统一 Controller
 * 路由前缀 /equipment-sub
 *   /maint-plans        维保计划
 *   /faults             故障记录
 *   /calibrations       计量校准
 *   /spare-parts        备件管理
 *   /usages             设备使用记录
 */
@RestController
@RequestMapping("/equipment-sub")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class EquipmentSubController {

    private final EquipmentMaintPlanService maintPlanService;
    private final EquipmentFaultService faultService;
    private final EquipmentCalibrationService calibrationService;
    private final EquipmentSparePartService sparePartService;
    private final EquipmentUsageService usageService;

    // ─── 维保计划 ─────────────────────────────────────────────────────────────

    @GetMapping("/maint-plans")
    public Result<List<EquipmentMaintPlan>> listMaintPlans(
            @RequestParam(required = false) String equipCode,
            @RequestParam(required = false) String status) {
        LambdaQueryWrapper<EquipmentMaintPlan> qw = new LambdaQueryWrapper<>();
        if (StringUtils.hasText(equipCode)) qw.eq(EquipmentMaintPlan::getEquipCode, equipCode);
        if (StringUtils.hasText(status))    qw.eq(EquipmentMaintPlan::getStatus, status);
        qw.orderByDesc(EquipmentMaintPlan::getPlanDate);
        return Result.success(maintPlanService.list(qw));
    }

    @PostMapping("/maint-plans")
    public Result<EquipmentMaintPlan> createMaintPlan(@RequestBody EquipmentMaintPlan e) {
        if (!StringUtils.hasText(e.getPlanNo())) e.setPlanNo("MP-" + System.currentTimeMillis());
        if (!StringUtils.hasText(e.getEquipCode())) e.setEquipCode("EQ-DEFAULT");
        if (!StringUtils.hasText(e.getMaintType())) e.setMaintType("MONTHLY");
        if (e.getPlanDate() == null) e.setPlanDate(java.time.LocalDate.now());
        if (!StringUtils.hasText(e.getStatus())) e.setStatus("PENDING");
        maintPlanService.save(e);
        return Result.success(e);
    }

    @PutMapping("/maint-plans/{id}")
    public Result<Boolean> updateMaintPlan(@PathVariable Long id, @RequestBody EquipmentMaintPlan e) {
        e.setId(id);
        return Result.success(maintPlanService.updateById(e));
    }

    @DeleteMapping("/maint-plans/{id}")
    public Result<Boolean> deleteMaintPlan(@PathVariable Long id) {
        return Result.success(maintPlanService.removeById(id));
    }

    // ─── 故障记录 ─────────────────────────────────────────────────────────────

    @GetMapping("/faults")
    public Result<List<EquipmentFault>> listFaults(
            @RequestParam(required = false) String equipCode,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String faultLevel) {
        LambdaQueryWrapper<EquipmentFault> qw = new LambdaQueryWrapper<>();
        if (StringUtils.hasText(equipCode))  qw.eq(EquipmentFault::getEquipCode, equipCode);
        if (StringUtils.hasText(status))     qw.eq(EquipmentFault::getStatus, status);
        if (StringUtils.hasText(faultLevel)) qw.eq(EquipmentFault::getFaultLevel, faultLevel);
        qw.orderByDesc(EquipmentFault::getFaultTime);
        return Result.success(faultService.list(qw));
    }

    @PostMapping("/faults")
    public Result<EquipmentFault> createFault(@RequestBody EquipmentFault e) {
        if (!StringUtils.hasText(e.getFaultNo())) e.setFaultNo("FT-" + System.currentTimeMillis());
        if (!StringUtils.hasText(e.getEquipCode())) e.setEquipCode("EQ-DEFAULT");
        if (!StringUtils.hasText(e.getReporter())) e.setReporter("系统");
        if (e.getFaultTime() == null) e.setFaultTime(LocalDateTime.now());
        if (!StringUtils.hasText(e.getFaultLevel())) e.setFaultLevel("MEDIUM");
        if (!StringUtils.hasText(e.getStatus())) e.setStatus("REPORTED");
        faultService.save(e);
        return Result.success(e);
    }

    @PutMapping("/faults/{id}")
    public Result<Boolean> updateFault(@PathVariable Long id, @RequestBody EquipmentFault e) {
        e.setId(id);
        return Result.success(faultService.updateById(e));
    }

    @DeleteMapping("/faults/{id}")
    public Result<Boolean> deleteFault(@PathVariable Long id) {
        return Result.success(faultService.removeById(id));
    }

    // ─── 计量校准 ─────────────────────────────────────────────────────────────

    @GetMapping("/calibrations")
    public Result<List<EquipmentCalibration>> listCalibrations(
            @RequestParam(required = false) String equipCode,
            @RequestParam(required = false) String status) {
        LambdaQueryWrapper<EquipmentCalibration> qw = new LambdaQueryWrapper<>();
        if (StringUtils.hasText(equipCode)) qw.eq(EquipmentCalibration::getEquipCode, equipCode);
        if (StringUtils.hasText(status))    qw.eq(EquipmentCalibration::getStatus, status);
        qw.orderByDesc(EquipmentCalibration::getCalibDate);
        return Result.success(calibrationService.list(qw));
    }

    @PostMapping("/calibrations")
    public Result<EquipmentCalibration> createCalibration(@RequestBody EquipmentCalibration e) {
        if (!StringUtils.hasText(e.getCalibNo())) e.setCalibNo("CB-" + System.currentTimeMillis());
        if (!StringUtils.hasText(e.getEquipCode())) e.setEquipCode("EQ-DEFAULT");
        if (e.getCalibDate() == null) e.setCalibDate(java.time.LocalDate.now());
        if (e.getNextCalibDate() == null) e.setNextCalibDate(java.time.LocalDate.now().plusMonths(12));
        if (e.getCalibCycle() == null) e.setCalibCycle(12);
        if (!StringUtils.hasText(e.getCalibResult())) e.setCalibResult("PASS");
        if (!StringUtils.hasText(e.getStatus())) e.setStatus("VALID");
        calibrationService.save(e);
        return Result.success(e);
    }

    @PutMapping("/calibrations/{id}")
    public Result<Boolean> updateCalibration(@PathVariable Long id, @RequestBody EquipmentCalibration e) {
        e.setId(id);
        return Result.success(calibrationService.updateById(e));
    }

    @DeleteMapping("/calibrations/{id}")
    public Result<Boolean> deleteCalibration(@PathVariable Long id) {
        return Result.success(calibrationService.removeById(id));
    }

    // ─── 备件管理 ─────────────────────────────────────────────────────────────

    @GetMapping("/spare-parts")
    public Result<List<EquipmentSparePart>> listSpareParts(
            @RequestParam(required = false) String partCode,
            @RequestParam(required = false) String status) {
        LambdaQueryWrapper<EquipmentSparePart> qw = new LambdaQueryWrapper<>();
        if (StringUtils.hasText(partCode)) qw.like(EquipmentSparePart::getPartCode, partCode);
        if (StringUtils.hasText(status))   qw.eq(EquipmentSparePart::getStatus, status);
        qw.orderByAsc(EquipmentSparePart::getPartCode);
        return Result.success(sparePartService.list(qw));
    }

    @PostMapping("/spare-parts")
    public Result<EquipmentSparePart> createSparePart(@RequestBody EquipmentSparePart e) {
        if (!StringUtils.hasText(e.getPartCode())) e.setPartCode("SP-" + System.currentTimeMillis());
        if (!StringUtils.hasText(e.getPartName())) e.setPartName("备件");
        if (!StringUtils.hasText(e.getUnit())) e.setUnit("个");
        if (e.getCurrentStock() == null) e.setCurrentStock(java.math.BigDecimal.ZERO);
        if (e.getSafetyStock() == null)  e.setSafetyStock(java.math.BigDecimal.ZERO);
        if (e.getUnitCost() == null)     e.setUnitCost(java.math.BigDecimal.ZERO);
        if (!StringUtils.hasText(e.getStatus())) e.setStatus("NORMAL");
        sparePartService.save(e);
        return Result.success(e);
    }

    @PutMapping("/spare-parts/{id}")
    public Result<Boolean> updateSparePart(@PathVariable Long id, @RequestBody EquipmentSparePart e) {
        e.setId(id);
        return Result.success(sparePartService.updateById(e));
    }

    @DeleteMapping("/spare-parts/{id}")
    public Result<Boolean> deleteSparePart(@PathVariable Long id) {
        return Result.success(sparePartService.removeById(id));
    }

    // ─── 设备使用记录 ─────────────────────────────────────────────────────────

    @GetMapping("/usages")
    public Result<List<EquipmentUsage>> listUsages(
            @RequestParam(required = false) String equipCode,
            @RequestParam(required = false) String batchNo,
            @RequestParam(required = false) String woNo) {
        LambdaQueryWrapper<EquipmentUsage> qw = new LambdaQueryWrapper<>();
        if (StringUtils.hasText(equipCode)) qw.eq(EquipmentUsage::getEquipCode, equipCode);
        if (StringUtils.hasText(batchNo))   qw.eq(EquipmentUsage::getBatchNo, batchNo);
        if (StringUtils.hasText(woNo))      qw.eq(EquipmentUsage::getWoNo, woNo);
        qw.orderByDesc(EquipmentUsage::getStartTime);
        return Result.success(usageService.list(qw));
    }

    @PostMapping("/usages")
    public Result<EquipmentUsage> createUsage(@RequestBody EquipmentUsage e) {
        if (!StringUtils.hasText(e.getUsageNo())) e.setUsageNo("EU-" + System.currentTimeMillis());
        if (!StringUtils.hasText(e.getEquipCode())) e.setEquipCode("EQ-DEFAULT");
        if (!StringUtils.hasText(e.getOperator())) e.setOperator("未知");
        if (e.getStartTime() == null) e.setStartTime(LocalDateTime.now());
        if (e.getCleanBefore() == null) e.setCleanBefore(1);
        if (e.getCleanAfter() == null)  e.setCleanAfter(1);
        if (e.getAbnormalFlag() == null) e.setAbnormalFlag(0);
        usageService.save(e);
        return Result.success(e);
    }

    @PutMapping("/usages/{id}")
    public Result<Boolean> updateUsage(@PathVariable Long id, @RequestBody EquipmentUsage e) {
        e.setId(id);
        return Result.success(usageService.updateById(e));
    }

    @DeleteMapping("/usages/{id}")
    public Result<Boolean> deleteUsage(@PathVariable Long id) {
        return Result.success(usageService.removeById(id));
    }
}

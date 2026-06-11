package com.mdk.mes.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.mdk.mes.common.PageResult;
import com.mdk.mes.common.Result;
import com.mdk.mes.entity.Employee;
import com.mdk.mes.service.EmployeeService;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 员工管理 Controller
 */
@RestController
@RequestMapping("/employees")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class EmployeeController {

    private final EmployeeService employeeService;

    /** 分页查询 */
    @GetMapping("/page")
    public Result<PageResult<Employee>> page(
            @RequestParam(defaultValue = "1") Integer current,
            @RequestParam(defaultValue = "15") Integer pageSize) {
        IPage<Employee> pageResult = employeeService.page(
                new Page<>(current, pageSize),
                new LambdaQueryWrapper<Employee>().eq(Employee::getDeleted, 0).orderByDesc(Employee::getCreateTime));
        return Result.success(PageResult.of(pageResult.getRecords(), pageResult.getTotal(), current, pageSize));
    }

    /** 查询全部（不分页） */
    @GetMapping("/list")
    public Result<List<Employee>> list() {
        List<Employee> list = employeeService.list(
                new LambdaQueryWrapper<Employee>().eq(Employee::getDeleted, 0).orderByDesc(Employee::getCreateTime));
        return Result.success(list);
    }

    /** 根据ID查询 */
    @GetMapping("/{id}")
    public Result<Employee> getById(@PathVariable Long id) {
        Employee entity = employeeService.getById(id);
        if (entity == null) return Result.fail(404, "记录不存在");
        return Result.success(entity);
    }

    /** 新增 */
    @PostMapping
    public Result<Employee> create(@RequestBody Employee entity) {
        employeeService.save(entity);
        return Result.success(entity);
    }

    /** 修改 */
    @PutMapping("/{id}")
    public Result<Void> update(@PathVariable Long id, @RequestBody Employee entity) {
        entity.setId(id);
        employeeService.updateById(entity);
        return Result.success();
    }

    /** 删除（逻辑删除） */
    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        employeeService.removeById(id);
        return Result.success();
    }

    /** 批量删除 */
    @DeleteMapping("/batch")
    public Result<Void> batchDelete(@RequestBody List<Long> ids) {
        employeeService.removeByIds(ids);
        return Result.success();
    }
}

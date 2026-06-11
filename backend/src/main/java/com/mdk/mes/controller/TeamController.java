package com.mdk.mes.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.mdk.mes.common.PageResult;
import com.mdk.mes.common.Result;
import com.mdk.mes.entity.Team;
import com.mdk.mes.service.TeamService;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 班组管理 Controller
 */
@RestController
@RequestMapping("/teams")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class TeamController {

    private final TeamService teamService;

    /** 分页查询 */
    @GetMapping("/page")
    public Result<PageResult<Team>> page(
            @RequestParam(defaultValue = "1") Integer current,
            @RequestParam(defaultValue = "15") Integer pageSize) {
        IPage<Team> pageResult = teamService.page(
                new Page<>(current, pageSize),
                new LambdaQueryWrapper<Team>().eq(Team::getDeleted, 0).orderByDesc(Team::getCreateTime));
        return Result.success(PageResult.of(pageResult.getRecords(), pageResult.getTotal(), current, pageSize));
    }

    /** 查询全部（不分页） */
    @GetMapping("/list")
    public Result<List<Team>> list() {
        List<Team> list = teamService.list(
                new LambdaQueryWrapper<Team>().eq(Team::getDeleted, 0).orderByDesc(Team::getCreateTime));
        return Result.success(list);
    }

    /** 根据ID查询 */
    @GetMapping("/{id}")
    public Result<Team> getById(@PathVariable Long id) {
        Team entity = teamService.getById(id);
        if (entity == null) return Result.fail(404, "记录不存在");
        return Result.success(entity);
    }

    /** 新增 */
    @PostMapping
    public Result<Team> create(@RequestBody Team entity) {
        teamService.save(entity);
        return Result.success(entity);
    }

    /** 修改 */
    @PutMapping("/{id}")
    public Result<Void> update(@PathVariable Long id, @RequestBody Team entity) {
        entity.setId(id);
        teamService.updateById(entity);
        return Result.success();
    }

    /** 删除（逻辑删除） */
    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        teamService.removeById(id);
        return Result.success();
    }

    /** 批量删除 */
    @DeleteMapping("/batch")
    public Result<Void> batchDelete(@RequestBody List<Long> ids) {
        teamService.removeByIds(ids);
        return Result.success();
    }
}

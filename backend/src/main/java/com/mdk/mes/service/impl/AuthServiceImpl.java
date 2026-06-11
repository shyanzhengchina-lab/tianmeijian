package com.mdk.mes.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.mdk.mes.common.BusinessException;
import com.mdk.mes.dto.LoginDTO;
import com.mdk.mes.entity.SysUser;
import com.mdk.mes.mapper.SysUserMapper;
import com.mdk.mes.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final SysUserMapper sysUserMapper;

    @Override
    public SysUser login(LoginDTO dto) {
        SysUser user = sysUserMapper.selectOne(
            new LambdaQueryWrapper<SysUser>()
                .eq(SysUser::getEmployeeId, dto.getEmployeeId())
                .eq(SysUser::getDeleted, 0));
        if (user == null) {
            throw new BusinessException(401, "用户不存在");
        }
        if (!dto.getPassword().equals(user.getPassword())) {
            throw new BusinessException(401, "密码错误");
        }
        if (user.getStatus() != null && user.getStatus() == 0) {
            throw new BusinessException(403, "账号已禁用");
        }
        return user;
    }
}

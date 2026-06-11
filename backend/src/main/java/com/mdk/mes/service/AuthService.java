package com.mdk.mes.service;

import com.mdk.mes.dto.LoginDTO;
import com.mdk.mes.entity.SysUser;

public interface AuthService {
    SysUser login(LoginDTO dto);
}

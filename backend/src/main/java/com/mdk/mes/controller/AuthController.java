package com.mdk.mes.controller;

import com.mdk.mes.common.Result;
import com.mdk.mes.dto.LoginDTO;
import com.mdk.mes.entity.SysUser;
import com.mdk.mes.service.AuthService;
import jakarta.validation.Valid;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.UUID;

/**
 * 认证接口
 */
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AuthController {

    private final AuthService authService;

    /**
     * 登录响应DTO
     */
    @Data
    public static class LoginResponseDTO {
        private String token;
        private String refreshToken;
        private String tokenType = "Bearer";
        private Long expiresIn = 86400L;
        private UserDTO user;
    }

    @Data
    public static class UserDTO {
        private String id;
        private String username;
        private String realName;
        private String avatar;
        private java.util.List<String> roleIds;
        private java.util.List<String> roleNames;
        private java.util.List<String> factoryIds;
        private String defaultFactoryId = "F001";
        private java.util.List<String> permissions;
        private String status = "active";
    }

    /**
     * 登录
     * POST /api/auth/login
     */
    @PostMapping("/login")
    public Result<LoginResponseDTO> login(@Valid @RequestBody LoginDTO dto) {
        SysUser user = authService.login(dto);

        // 构建前端期望的响应格式
        LoginResponseDTO resp = new LoginResponseDTO();
        resp.setToken("demo-token-" + UUID.randomUUID().toString().replace("-", "").substring(0, 16));
        resp.setRefreshToken("refresh-" + UUID.randomUUID().toString().replace("-", "").substring(0, 16));

        UserDTO userDTO = new UserDTO();
        userDTO.setId(user.getId() != null ? user.getId().toString() : "1");
        userDTO.setUsername(user.getEmployeeId());
        userDTO.setRealName(user.getUsername() != null ? user.getUsername() : user.getEmployeeId());
        userDTO.setAvatar(user.getAvatar());
        String role = user.getRole() != null ? user.getRole() : "OPERATOR";
        userDTO.setRoleIds(Collections.singletonList(role));
        userDTO.setRoleNames(Collections.singletonList(role));
        userDTO.setFactoryIds(Collections.singletonList("F001"));
        userDTO.setPermissions(Collections.singletonList("*:*:*"));  // 演示：全权限
        resp.setUser(userDTO);

        return Result.success(resp);
    }

    /**
     * 登出
     */
    @PostMapping("/logout")
    public Result<Void> logout() {
        return Result.success();
    }

    /**
     * 获取当前用户信息
     */
    @GetMapping("/user/info")
    public Result<UserDTO> getUserInfo() {
        UserDTO userDTO = new UserDTO();
        userDTO.setId("1");
        userDTO.setUsername("admin");
        userDTO.setRealName("系统管理员");
        userDTO.setRoleIds(Collections.singletonList("ADMIN"));
        userDTO.setRoleNames(Collections.singletonList("系统管理员"));
        userDTO.setFactoryIds(Collections.singletonList("F001"));
        userDTO.setPermissions(Collections.singletonList("*:*:*"));
        return Result.success(userDTO);
    }
}

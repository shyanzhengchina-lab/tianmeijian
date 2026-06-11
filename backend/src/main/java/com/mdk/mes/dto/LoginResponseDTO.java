package com.mdk.mes.dto;

import com.mdk.mes.entity.SysUser;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 登录响应 DTO
 * 与前端 authApi.ts 中 LoginResponse 结构保持一致
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponseDTO {

    /** 访问 Token */
    private String token;

    /** 刷新 Token */
    private String refreshToken;

    /** Token 类型 */
    private String tokenType = "Bearer";

    /** Token 过期时间（毫秒） */
    private long expiresIn;

    /** 用户信息（不含密码） */
    private UserInfoDTO user;

    /**
     * 用户信息 DTO（嵌套，匹配前端 UserInfo 接口）
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserInfoDTO {
        private String id;
        private String username;
        private String realName;
        private String avatar;
        private String role;
        private String employeeId;
        private Integer status;
    }

    /**
     * 从 SysUser 构建 UserInfoDTO
     */
    public static UserInfoDTO toUserInfo(SysUser user) {
        UserInfoDTO dto = new UserInfoDTO();
        dto.setId(String.valueOf(user.getId()));
        dto.setUsername(user.getEmployeeId());
        dto.setRealName(user.getUsername());
        dto.setAvatar(user.getAvatar());
        dto.setRole(user.getRole());
        dto.setEmployeeId(user.getEmployeeId());
        dto.setStatus(user.getStatus());
        return dto;
    }
}

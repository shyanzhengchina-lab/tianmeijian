package com.mdk.mes.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginDTO {
    @NotBlank(message = "工号不能为空")
    private String employeeId;
    @NotBlank(message = "密码不能为空")
    private String password;
}

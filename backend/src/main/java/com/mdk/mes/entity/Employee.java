package com.mdk.mes.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("mes_employee")
public class Employee {
    @TableId(type = IdType.AUTO)
    private Long id;

    private String employeeNo;
    private String name;
    private String gender;
    private String department;
    private Long teamId;
    private String teamName;
    private String position;
    private String phone;
    private String email;
    private String entryDate;
    private Integer status;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;

    @TableLogic
    private Integer deleted;
}

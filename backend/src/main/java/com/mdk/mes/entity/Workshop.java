package com.mdk.mes.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("mes_workshop")
public class Workshop {
    @TableId(type = IdType.AUTO)
    private Long id;

    private String code;
    private String name;
    private String type;
    private String managerName;
    private String phone;
    private String address;
    private String description;
    private Integer status;
    private Long factoryId;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;

    @TableLogic
    private Integer deleted;
}

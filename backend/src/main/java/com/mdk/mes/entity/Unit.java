package com.mdk.mes.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("unit")
public class Unit {
    @TableId(type = IdType.AUTO)
    private Long id;

    private String code;
    private String name;
    private String enName;
    private Long groupId;
    private String groupName;
    private String method;
    @TableField("`precision`")
    private Integer precision;
    private Integer isBase;
    private Integer status;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;

    @TableLogic
    private Integer deleted;
}

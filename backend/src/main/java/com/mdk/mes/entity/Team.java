package com.mdk.mes.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("mes_team")
public class Team {
    @TableId(type = IdType.AUTO)
    private Long id;

    private String code;
    private String name;
    private Long workshopId;
    private String workshopName;
    private String leaderName;
    private String phone;
    private Integer headcount;
    private String description;
    private Integer status;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;

    @TableLogic
    private Integer deleted;
}

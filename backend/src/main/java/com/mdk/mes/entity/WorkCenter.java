package com.mdk.mes.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("mes_work_center")
public class WorkCenter {
    @TableId(type = IdType.AUTO)
    private Long id;

    private String code;
    private String name;
    private Long workshopId;
    private String workshopName;
    private String type;
    private Integer capacity;
    private String description;
    private Integer status;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;

    @TableLogic
    private Integer deleted;
}

package com.mdk.mes.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("routing_step")
public class RoutingStep {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long routingId;
    private Integer stepNo;
    private String stepName;
    private String stepCode;
    private Integer reportPoint;
    private String stepType;
    private Long workshopId;
    private String description;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
    private String createBy;
    private String updateBy;
    @TableLogic
    private Integer deleted;
}

package com.mdk.mes.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("operation")
public class Operation {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long routingStepId;
    private String operationCode;
    private String operationName;
    private String aliasName;
    private Integer seqInStep;
    private Long workCenterId;
    private String workCenterName;
    private Integer isKeyOperation;
    private Integer materialTraceReq;
    private String inspectionTrigger;
    private Integer reportRequired;
    private BigDecimal standardTime;
    private String description;
    private String remark;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
    private String createBy;
    private String updateBy;
    @TableLogic
    private Integer deleted;
}

package com.mdk.mes.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("task_order")
public class TaskOrder {
    @TableId(type = IdType.AUTO)
    private Long id;

    private String taskNo;
    private Long workOrderId;
    private String workOrderNo;
    private Long workOrderOperationId;
    private String operationCode;
    private String operationName;
    private Long materialId;
    private String materialCode;
    private String materialName;
    private BigDecimal planQuantity;
    private BigDecimal completedQuantity;
    private BigDecimal qualifiedQuantity;
    private BigDecimal unqualifiedQuantity;
    private Long unitId;
    private String unitName;
    private Long workCenterId;
    private String workCenterName;
    private Long assignedTo;
    private String assignedToName;
    private LocalDateTime assignTime;
    private String assignBy;
    private LocalDateTime receivedTime;
    private String receivedBy;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Long equipId;
    private String equipCode;
    private BigDecimal actualWorkHours;
    private String status;
    private BigDecimal progress;
    private String remark;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;

    private String createBy;
    private String updateBy;
    private String completeBy;
    private LocalDateTime completeTime;

    @TableLogic
    private Integer deleted;
}

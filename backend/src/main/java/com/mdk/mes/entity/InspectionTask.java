package com.mdk.mes.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@TableName("inspection_task")
public class InspectionTask {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String taskNo;
    private String taskType;
    private String sourceType;
    private String sourceNo;
    private Long materialId;
    private String materialCode;
    private String materialName;
    private String batchNo;
    private BigDecimal quantity;
    private String unit;
    private BigDecimal sampleQuantity;
    private LocalDate inspectDate;
    private Long inspectorId;
    private String inspectorName;
    private String status;
    private String result;
    private Integer totalItems;
    private Integer passItems;
    private Integer failItems;
    private String remark;
    private LocalDateTime completeTime;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
    private String createBy;
    private String updateBy;
    @TableLogic
    private Integer deleted;
}

package com.mdk.mes.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@TableName("quality_release")
public class QualityRelease {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String releaseNo;
    private String releaseType;
    private Long taskId;
    private Long materialId;
    private String materialCode;
    private String materialName;
    private String batchNo;
    private BigDecimal quantity;
    private String unit;
    private Long warehouseId;
    private String warehouseName;
    private LocalDate releaseDate;
    private String status;
    private Long applicantId;
    private String applicantName;
    private LocalDateTime applyTime;
    private Long approverId;
    private String approverName;
    private LocalDateTime approveTime;
    private String approveRemark;
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

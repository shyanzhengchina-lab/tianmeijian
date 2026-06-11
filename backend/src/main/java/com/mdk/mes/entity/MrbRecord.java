package com.mdk.mes.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("mrb_record")
public class MrbRecord {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String mrbNo;
    private Long taskId;
    private Long materialId;
    private String materialCode;
    private String materialName;
    private String batchNo;
    private BigDecimal quantity;
    private String unit;
    private String failureType;
    private String failureDesc;
    private Long reporterId;
    private String reporterName;
    private LocalDateTime reportTime;
    private String status;
    private String disposition;
    private String dispositionDesc;
    private String dispositionBy;
    private LocalDateTime dispositionTime;
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

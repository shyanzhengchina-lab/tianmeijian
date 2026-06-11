package com.mdk.mes.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@TableName("bom")
public class Bom {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String code;
    private String version;
    private String bomType;
    private String status;
    private Long materialId;
    private String materialCode;
    private String materialName;
    private BigDecimal quantity;
    private Long unitId;
    private String unitName;
    private String orgManage;
    private String orgUse;
    private LocalDate effectiveDate;
    private LocalDate expiryDate;
    private String remark;
    private String reviewBy;
    private LocalDateTime reviewTime;
    private String approveBy;
    private LocalDateTime approveTime;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
    private String createBy;
    private String updateBy;
    @TableLogic
    private Integer deleted;
}

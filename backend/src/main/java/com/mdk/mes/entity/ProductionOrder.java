package com.mdk.mes.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@TableName("production_order")
public class ProductionOrder {
    @TableId(type = IdType.AUTO)
    private Long id;

    private String orderNo;
    private String orderType;
    private String customerName;
    private String customerCode;
    private LocalDate deliveryDate;
    private Integer priority;
    private String status;
    private BigDecimal totalQuantity;
    private BigDecimal completedQuantity;
    private String remark;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;

    private String createBy;
    private String updateBy;
    private String releaseBy;
    private LocalDateTime releaseTime;
    private String closeBy;
    private LocalDateTime closeTime;

    @TableLogic
    private Integer deleted;
}

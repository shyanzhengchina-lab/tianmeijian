package com.mdk.mes.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@TableName("work_order")
public class WorkOrder {
    @TableId(type = IdType.AUTO)
    private Long id;

    private String workOrderNo;
    private Long orderId;
    private String orderNo;
    private Long orderDetailId;
    private Long materialId;
    private String materialCode;
    private String materialName;
    private String spec;
    private BigDecimal planQuantity;
    private BigDecimal completedQuantity;
    private BigDecimal qualifiedQuantity;
    private BigDecimal unqualifiedQuantity;
    private Long unitId;
    private String unitName;
    private Long bomId;
    private String bomVersion;
    private Long routingId;
    private Long workCenterId;
    private String workCenterName;
    private LocalDate startDate;
    private LocalDate endDate;
    private LocalDateTime actualStartTime;
    private LocalDateTime actualEndTime;
    private String status;
    private BigDecimal progress;
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

package com.mdk.mes.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@TableName("process_routing")
public class ProcessRouting {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String routingCode;
    private String routingName;
    private Long productId;
    private String productCode;
    private String productModel;
    private String productName;
    private String version;
    private Integer isDefault;
    private String status;
    private LocalDate effectiveDate;
    private LocalDate expiryDate;
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

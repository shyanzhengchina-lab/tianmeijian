package com.mdk.mes.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("inspection_item")
public class InspectionItem {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String code;
    private String name;
    private String category;
    private String method;
    private String standard;
    private String unit;
    private BigDecimal minValue;
    private BigDecimal maxValue;
    private Integer isKeyItem;
    private Integer status;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
    private String createBy;
    private String updateBy;

    @TableLogic
    private Integer deleted;
}

package com.mdk.mes.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("material")
public class Material {
    @TableId(type = IdType.AUTO)
    private Long id;

    private String code;
    private String name;
    private Long categoryId;
    private String spec;
    private Long unitId;
    private String unitName;
    private String type;
    private String brand;
    private String supplier;
    private BigDecimal minStock;
    private BigDecimal maxStock;
    private BigDecimal price;
    private Integer status;
    private String description;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;

    @TableLogic
    private Integer deleted;
}

package com.mdk.mes.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("mes_product_series")
public class ProductSeries {
    @TableId(type = IdType.AUTO)
    private Long id;

    private String code;
    private String name;
    private String category;
    private String description;
    private String specification;
    private String unit;
    private String manager;
    private Integer status;
    private String remark;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;

    @TableLogic
    private Integer deleted;
}

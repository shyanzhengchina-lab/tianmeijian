package com.mdk.mes.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("bom_detail")
public class BomDetail {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long bomId;
    private Integer lineNo;
    private Long materialId;
    private String materialCode;
    private String materialName;
    private String spec;
    private BigDecimal quantity;
    private Long unitId;
    private String unitName;
    private String remark;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
    @TableLogic
    private Integer deleted;
}

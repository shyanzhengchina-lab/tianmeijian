package com.mdk.mes.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("mes_qc_scheme")
public class QcScheme {
    @TableId(type = IdType.AUTO)
    private Long id;

    private String code;
    private String name;
    private String type;
    private String productCode;
    private String productName;
    private String checkItems;
    private String standard;
    private String version;
    private Integer status;
    private String remark;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;

    @TableLogic
    private Integer deleted;
}

package com.mdk.mes.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("mes_equipment")
public class Equipment {
    @TableId(type = IdType.AUTO)
    private Long id;

    private String code;
    private String name;
    private String model;
    private String brand;
    private Long workCenterId;
    private String workCenterName;
    private String serialNo;
    private String purchaseDate;
    private String warrantyDate;
    private String status;
    private String description;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;

    @TableLogic
    private Integer deleted;
}

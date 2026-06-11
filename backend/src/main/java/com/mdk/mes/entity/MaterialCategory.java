package com.mdk.mes.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("material_category")
public class MaterialCategory {
    @TableId(type = IdType.AUTO)
    private Long id;

    private Long parentId;
    private String code;
    private String name;
    private Integer sortNo;
    private Integer status;   // 1=启用, 0=停用
    private String createBy;
    private String updateBy;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;

    @TableLogic
    private Integer deleted;
}

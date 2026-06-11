package com.mdk.mes.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("material_issuance_detail")
public class MaterialIssuanceDetail {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long issuanceId;
    private Integer lineNo;
    private Long materialId;
    private String materialCode;
    private String materialName;
    private String spec;
    private Long unitId;
    private String unitName;
    private BigDecimal requestQuantity;
    private BigDecimal approvalQuantity;
    private BigDecimal issuedQuantity;
    private BigDecimal returnedQuantity;
    private String batchNo;
    private String lotNo;
    private Long warehouseId;
    private String warehouseName;
    private String location;
    private BigDecimal unitPrice;
    private BigDecimal totalPrice;
    private String remark;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
    @TableLogic
    private Integer deleted;
}

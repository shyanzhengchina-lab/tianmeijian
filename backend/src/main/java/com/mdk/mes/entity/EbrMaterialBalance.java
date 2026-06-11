package com.mdk.mes.entity;
import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
@Data
@TableName("ebr_material_balance")
public class EbrMaterialBalance {
    @TableId(type = IdType.AUTO) private Long id;
    private Long ebrId;
    private Long materialId;
    private String materialCode;
    private String materialName;
    private String spec;
    private Long unitId;
    private String unitName;
    private BigDecimal planQuantity;
    private BigDecimal theoreticalQuantity;
    private BigDecimal actualInput;
    private BigDecimal actualOutput;
    private BigDecimal difference;
    private BigDecimal differenceRate;
    private String balanceStatus;
    private String remark;
    @TableField(fill = FieldFill.INSERT) private LocalDateTime createTime;
    @TableField(fill = FieldFill.INSERT_UPDATE) private LocalDateTime updateTime;
    @TableLogic private Integer deleted;
}

package com.mdk.mes.entity;
import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
@Data
@TableName("equipment_spare_part")
public class EquipmentSparePart {
    @TableId(type = IdType.AUTO) private Long id;
    private String partCode;
    private String partName;
    private String partSpec;
    private String applicableEquips;
    private String unit;
    private BigDecimal currentStock;
    private BigDecimal safetyStock;
    private BigDecimal unitCost;
    private String supplier;
    private Integer leadTime;
    private String location;
    private String status;
    private LocalDate lastUsedDate;
    private String remark;
    @TableLogic private Integer deleted;
    @TableField(fill = FieldFill.INSERT) private LocalDateTime createTime;
    @TableField(fill = FieldFill.INSERT_UPDATE) private LocalDateTime updateTime;
}

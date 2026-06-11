package com.mdk.mes.entity;
import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
@Data
@TableName("equipment_maint_plan")
public class EquipmentMaintPlan {
    @TableId(type = IdType.AUTO) private Long id;
    private String planNo;
    private String equipId;
    private String equipCode;
    private String equipName;
    private String maintType;
    private String maintContent;
    private LocalDate planDate;
    private BigDecimal planDuration;
    private String assignee;
    private String status;
    private LocalDate actualDate;
    private BigDecimal actualDuration;
    private String result;
    private LocalDate nextPlanDate;
    private String remark;
    @TableLogic private Integer deleted;
    @TableField(fill = FieldFill.INSERT) private LocalDateTime createTime;
    @TableField(fill = FieldFill.INSERT_UPDATE) private LocalDateTime updateTime;
}

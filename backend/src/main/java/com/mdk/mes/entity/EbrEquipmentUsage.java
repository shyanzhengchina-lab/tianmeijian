package com.mdk.mes.entity;
import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;
@Data
@TableName("ebr_equipment_usage")
public class EbrEquipmentUsage {
    @TableId(type = IdType.AUTO) private Long id;
    private Long ebrId;
    private Long stepId;
    private String equipmentCode;
    private String equipmentName;
    private String equipmentType;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Integer duration;
    private Long operatorId;
    private String operatorName;
    private String usageStatus;
    private String maintenanceRecord;
    @TableField(fill = FieldFill.INSERT) private LocalDateTime createTime;
    @TableLogic private Integer deleted;
}

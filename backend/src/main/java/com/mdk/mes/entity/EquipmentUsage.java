package com.mdk.mes.entity;
import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;
@Data
@TableName("equipment_usage")
public class EquipmentUsage {
    @TableId(type = IdType.AUTO) private Long id;
    private String usageNo;
    private String equipId;
    private String equipCode;
    private String equipName;
    private String woId;
    private String woNo;
    private String taskId;
    private String taskNo;
    private String batchNo;
    private String productCode;
    private String productName;
    private String operator;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Integer duration;
    private String setupParams;
    private Integer cleanBefore;
    private Integer cleanAfter;
    private Integer abnormalFlag;
    private String abnormalDesc;
    private String operatorSign;
    private String remark;
    @TableLogic private Integer deleted;
    @TableField(fill = FieldFill.INSERT) private LocalDateTime createTime;
    @TableField(fill = FieldFill.INSERT_UPDATE) private LocalDateTime updateTime;
}

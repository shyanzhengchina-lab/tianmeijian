package com.mdk.mes.entity;
import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;
@Data
@TableName("equipment_fault")
public class EquipmentFault {
    @TableId(type = IdType.AUTO) private Long id;
    private String faultNo;
    private String equipId;
    private String equipCode;
    private String equipName;
    private LocalDateTime faultTime;
    private String reporter;
    private String faultDesc;
    private String faultLevel;
    private String affectedBatch;
    private String affectedWoNo;
    private String status;
    private String assignee;
    private String diagnose;
    private String repairContent;
    private String spareParts;
    private LocalDateTime repairStart;
    private LocalDateTime repairEnd;
    private Integer downtime;
    private String rootCause;
    private String capaAction;
    private String verifier;
    private LocalDateTime verifyTime;
    private String verifyResult;
    private String remark;
    @TableLogic private Integer deleted;
    @TableField(fill = FieldFill.INSERT) private LocalDateTime createTime;
    @TableField(fill = FieldFill.INSERT_UPDATE) private LocalDateTime updateTime;
}

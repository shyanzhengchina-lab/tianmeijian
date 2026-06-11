package com.mdk.mes.entity;
import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;
@Data
@TableName("ebr_step")
public class EbrStep {
    @TableId(type = IdType.AUTO) private Long id;
    private Long ebrId;
    private Integer stepNo;
    private String stepName;
    private String operationCode;
    private String operationName;
    private String status;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Long operatorId;
    private String operatorName;
    private String approvalStatus;
    private Long approverId;
    private String approverName;
    private LocalDateTime approvalTime;
    private String approvalComment;
    private String dataRecord;
    private String remark;
    @TableField(fill = FieldFill.INSERT) private LocalDateTime createTime;
    @TableField(fill = FieldFill.INSERT_UPDATE) private LocalDateTime updateTime;
    @TableLogic private Integer deleted;
}

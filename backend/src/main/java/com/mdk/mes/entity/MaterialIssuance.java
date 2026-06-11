package com.mdk.mes.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("material_issuance")
public class MaterialIssuance {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String issuanceNo;
    private String issuanceType;
    private Long departmentId;
    private String departmentName;
    private Long workCenterId;
    private String workCenterName;
    private Long requesterId;
    private String requesterName;
    private LocalDateTime requestTime;
    private String status;
    private String approvalStatus;
    private Long approverId;
    private String approverName;
    private LocalDateTime approvalTime;
    private String approvalComment;
    private Long issuerId;
    private String issuerName;
    private LocalDateTime issueTime;
    private Long receiverId;
    private String receiverName;
    private LocalDateTime receiveTime;
    private String remark;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
    private String createBy;
    private String updateBy;
    @TableLogic
    private Integer deleted;
}

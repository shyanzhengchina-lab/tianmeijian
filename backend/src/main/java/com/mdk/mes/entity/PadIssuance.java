package com.mdk.mes.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("mes_pad_issuance")
public class PadIssuance {
    @TableId(type = IdType.AUTO)
    private Long id;

    private String issuanceNo;
    private String productCode;
    private String productName;
    private String batchNo;
    private Integer quantity;
    private String status;
    private Long workOrderId;
    private String workOrderNo;
    private String applicantName;
    private String applyDate;
    private String approverName;
    private String approveDate;
    private String remark;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;

    @TableLogic
    private Integer deleted;
}

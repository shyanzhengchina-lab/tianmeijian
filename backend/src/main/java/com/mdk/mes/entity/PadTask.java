package com.mdk.mes.entity;
import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
@Data
@TableName("pad_task")
public class PadTask {
    @TableId(type = IdType.AUTO) private Long id;
    private String taskNo;
    private String taskName;
    private Long productId;
    private String productCode;
    private String productName;
    private Long bomId;
    private String bomVersion;
    private BigDecimal planQuantity;
    private Long unitId;
    private String unitName;
    private Long routingId;
    private Long operationId;
    private String operationCode;
    private String operationName;
    private Long workCenterId;
    private String workCenterName;
    private String status;
    private String priority;
    private LocalDateTime plannedStartTime;
    private LocalDateTime plannedEndTime;
    private LocalDateTime actualStartTime;
    private LocalDateTime actualEndTime;
    private Long operatorId;
    private String operatorName;
    private BigDecimal completedQuantity;
    private BigDecimal qualifiedQuantity;
    private BigDecimal rejectedQuantity;
    private BigDecimal progress;
    private String remark;
    @TableField(fill = FieldFill.INSERT) private LocalDateTime createTime;
    @TableField(fill = FieldFill.INSERT_UPDATE) private LocalDateTime updateTime;
    private String createBy;
    private String updateBy;
    @TableLogic private Integer deleted;
}

package com.mdk.mes.entity;
import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
@Data
@TableName("pad_operation_record")
public class PadOperationRecord {
    @TableId(type = IdType.AUTO) private Long id;
    private Long taskId;
    private String operationType;
    private Long operatorId;
    private String operatorName;
    private LocalDateTime operationTime;
    private BigDecimal quantity;
    private String statusBefore;
    private String statusAfter;
    private String remark;
    @TableLogic private Integer deleted;
    @TableField(fill = FieldFill.INSERT) private LocalDateTime createTime;
}

package com.mdk.mes.entity;
import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
@Data
@TableName("backflush_log")
public class BackflushLog {
    @TableId(type = IdType.AUTO) private Long id;
    private String logNo;
    private String workOrderId;
    private String woNo;
    private String materialCode;
    private String materialName;
    private BigDecimal bomQty;
    private BigDecimal actualQty;
    private String unit;
    private String batchNo;
    private String operationCode;
    private String operationName;
    private String status;
    private String exceptionDesc;
    private String operator;
    private LocalDateTime execTime;
    private String remark;
    @TableLogic private Integer deleted;
    @TableField(fill = FieldFill.INSERT) private LocalDateTime createTime;
    @TableField(fill = FieldFill.INSERT_UPDATE) private LocalDateTime updateTime;
}

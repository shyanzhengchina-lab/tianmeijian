package com.mdk.mes.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("mes_float_ticket")
public class FloatTicket {
    @TableId(type = IdType.AUTO)
    private Long id;

    private String ticketNo;
    private String productCode;
    private String productName;
    private Integer quantity;
    private String status;
    private Long workOrderId;
    private String workOrderNo;
    private Long workshopId;
    private String workshopName;
    private String operatorName;
    private String remark;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;

    @TableLogic
    private Integer deleted;
}

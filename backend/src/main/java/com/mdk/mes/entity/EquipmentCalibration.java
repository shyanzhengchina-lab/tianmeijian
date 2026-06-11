package com.mdk.mes.entity;
import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;
@Data
@TableName("equipment_calibration")
public class EquipmentCalibration {
    @TableId(type = IdType.AUTO) private Long id;
    private String calibNo;
    private String equipId;
    private String equipCode;
    private String equipName;
    private String calibType;
    private String calibOrg;
    private LocalDate calibDate;
    private LocalDate nextCalibDate;
    private Integer calibCycle;
    private String calibResult;
    private String certNo;
    private String uncertainty;
    private String status;
    private String measuredValue;
    private String standardValue;
    private String deviation;
    private String operator;
    private String remark;
    @TableLogic private Integer deleted;
    @TableField(fill = FieldFill.INSERT) private LocalDateTime createTime;
    @TableField(fill = FieldFill.INSERT_UPDATE) private LocalDateTime updateTime;
}

package com.mdk.mes.service.impl;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.mdk.mes.entity.PadOperationRecord;
import com.mdk.mes.mapper.PadOperationRecordMapper;
import com.mdk.mes.service.PadOperationRecordService;
import org.springframework.stereotype.Service;
@Service
public class PadOperationRecordServiceImpl extends ServiceImpl<PadOperationRecordMapper, PadOperationRecord>
    implements PadOperationRecordService {}

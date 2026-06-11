package com.mdk.mes.service.impl;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.mdk.mes.entity.MrbRecord;
import com.mdk.mes.mapper.MrbRecordMapper;
import com.mdk.mes.service.MrbRecordService;
import org.springframework.stereotype.Service;
@Service
public class MrbRecordServiceImpl extends ServiceImpl<MrbRecordMapper, MrbRecord> implements MrbRecordService {}

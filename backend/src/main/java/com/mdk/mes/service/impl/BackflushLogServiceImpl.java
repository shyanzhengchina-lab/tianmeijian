package com.mdk.mes.service.impl;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.mdk.mes.entity.BackflushLog;
import com.mdk.mes.mapper.BackflushLogMapper;
import com.mdk.mes.service.BackflushLogService;
import org.springframework.stereotype.Service;
@Service
public class BackflushLogServiceImpl extends ServiceImpl<BackflushLogMapper, BackflushLog> implements BackflushLogService {}

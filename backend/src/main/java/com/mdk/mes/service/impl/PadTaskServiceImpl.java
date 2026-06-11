package com.mdk.mes.service.impl;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.mdk.mes.entity.PadTask;
import com.mdk.mes.mapper.PadTaskMapper;
import com.mdk.mes.service.PadTaskService;
import org.springframework.stereotype.Service;
@Service
public class PadTaskServiceImpl extends ServiceImpl<PadTaskMapper, PadTask>
    implements PadTaskService {}

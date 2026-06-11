package com.mdk.mes.service.impl;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.mdk.mes.entity.InspectionTask;
import com.mdk.mes.mapper.InspectionTaskMapper;
import com.mdk.mes.service.InspectionTaskService;
import org.springframework.stereotype.Service;
@Service
public class InspectionTaskServiceImpl extends ServiceImpl<InspectionTaskMapper, InspectionTask> implements InspectionTaskService {}

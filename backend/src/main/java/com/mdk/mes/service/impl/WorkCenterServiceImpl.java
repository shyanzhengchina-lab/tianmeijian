package com.mdk.mes.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.mdk.mes.entity.WorkCenter;
import com.mdk.mes.mapper.WorkCenterMapper;
import com.mdk.mes.service.WorkCenterService;
import org.springframework.stereotype.Service;

@Service
public class WorkCenterServiceImpl extends ServiceImpl<WorkCenterMapper, WorkCenter> implements WorkCenterService {}

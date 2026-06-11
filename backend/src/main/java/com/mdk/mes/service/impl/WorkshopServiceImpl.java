package com.mdk.mes.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.mdk.mes.entity.Workshop;
import com.mdk.mes.mapper.WorkshopMapper;
import com.mdk.mes.service.WorkshopService;
import org.springframework.stereotype.Service;

@Service
public class WorkshopServiceImpl extends ServiceImpl<WorkshopMapper, Workshop> implements WorkshopService {}

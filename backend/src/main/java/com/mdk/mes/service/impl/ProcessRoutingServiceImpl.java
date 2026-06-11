package com.mdk.mes.service.impl;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.mdk.mes.entity.ProcessRouting;
import com.mdk.mes.mapper.ProcessRoutingMapper;
import com.mdk.mes.service.ProcessRoutingService;
import org.springframework.stereotype.Service;
@Service
public class ProcessRoutingServiceImpl extends ServiceImpl<ProcessRoutingMapper, ProcessRouting> implements ProcessRoutingService {}

package com.mdk.mes.service.impl;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.mdk.mes.entity.RoutingStep;
import com.mdk.mes.mapper.RoutingStepMapper;
import com.mdk.mes.service.RoutingStepService;
import org.springframework.stereotype.Service;
@Service
public class RoutingStepServiceImpl extends ServiceImpl<RoutingStepMapper, RoutingStep> implements RoutingStepService {}

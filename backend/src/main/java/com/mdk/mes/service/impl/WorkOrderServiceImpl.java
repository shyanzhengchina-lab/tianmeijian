package com.mdk.mes.service.impl;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.mdk.mes.entity.WorkOrder;
import com.mdk.mes.mapper.WorkOrderMapper;
import com.mdk.mes.service.WorkOrderService;
import org.springframework.stereotype.Service;
@Service
public class WorkOrderServiceImpl extends ServiceImpl<WorkOrderMapper, WorkOrder> implements WorkOrderService {}

package com.mdk.mes.service.impl;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.mdk.mes.entity.TaskOrder;
import com.mdk.mes.mapper.TaskOrderMapper;
import com.mdk.mes.service.TaskOrderService;
import org.springframework.stereotype.Service;
@Service
public class TaskOrderServiceImpl extends ServiceImpl<TaskOrderMapper, TaskOrder> implements TaskOrderService {}

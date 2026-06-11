package com.mdk.mes.service.impl;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.mdk.mes.entity.Operation;
import com.mdk.mes.mapper.OperationMapper;
import com.mdk.mes.service.OperationService;
import org.springframework.stereotype.Service;
@Service
public class OperationServiceImpl extends ServiceImpl<OperationMapper, Operation> implements OperationService {}

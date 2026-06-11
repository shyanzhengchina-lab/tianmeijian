package com.mdk.mes.service.impl;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.mdk.mes.entity.EquipmentFault;
import com.mdk.mes.mapper.EquipmentFaultMapper;
import com.mdk.mes.service.EquipmentFaultService;
import org.springframework.stereotype.Service;
@Service
public class EquipmentFaultServiceImpl extends ServiceImpl<EquipmentFaultMapper, EquipmentFault> implements EquipmentFaultService {}

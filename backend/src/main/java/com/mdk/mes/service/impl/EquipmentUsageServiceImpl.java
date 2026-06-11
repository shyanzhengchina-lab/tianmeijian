package com.mdk.mes.service.impl;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.mdk.mes.entity.EquipmentUsage;
import com.mdk.mes.mapper.EquipmentUsageMapper;
import com.mdk.mes.service.EquipmentUsageService;
import org.springframework.stereotype.Service;
@Service
public class EquipmentUsageServiceImpl extends ServiceImpl<EquipmentUsageMapper, EquipmentUsage> implements EquipmentUsageService {}

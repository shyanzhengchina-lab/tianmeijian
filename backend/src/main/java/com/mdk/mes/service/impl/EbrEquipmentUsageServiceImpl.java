package com.mdk.mes.service.impl;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.mdk.mes.entity.EbrEquipmentUsage;
import com.mdk.mes.mapper.EbrEquipmentUsageMapper;
import com.mdk.mes.service.EbrEquipmentUsageService;
import org.springframework.stereotype.Service;
@Service
public class EbrEquipmentUsageServiceImpl extends ServiceImpl<EbrEquipmentUsageMapper, EbrEquipmentUsage>
    implements EbrEquipmentUsageService {}

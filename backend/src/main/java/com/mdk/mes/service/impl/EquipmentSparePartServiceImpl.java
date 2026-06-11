package com.mdk.mes.service.impl;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.mdk.mes.entity.EquipmentSparePart;
import com.mdk.mes.mapper.EquipmentSparePartMapper;
import com.mdk.mes.service.EquipmentSparePartService;
import org.springframework.stereotype.Service;
@Service
public class EquipmentSparePartServiceImpl extends ServiceImpl<EquipmentSparePartMapper, EquipmentSparePart> implements EquipmentSparePartService {}

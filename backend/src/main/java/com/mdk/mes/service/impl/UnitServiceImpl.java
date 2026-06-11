package com.mdk.mes.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.mdk.mes.entity.Unit;
import com.mdk.mes.mapper.UnitMapper;
import com.mdk.mes.service.UnitService;
import org.springframework.stereotype.Service;

@Service
public class UnitServiceImpl extends ServiceImpl<UnitMapper, Unit> implements UnitService {}

package com.mdk.mes.service.impl;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.mdk.mes.entity.ProductionOrder;
import com.mdk.mes.mapper.ProductionOrderMapper;
import com.mdk.mes.service.ProductionOrderService;
import org.springframework.stereotype.Service;
@Service
public class ProductionOrderServiceImpl extends ServiceImpl<ProductionOrderMapper, ProductionOrder> implements ProductionOrderService {}

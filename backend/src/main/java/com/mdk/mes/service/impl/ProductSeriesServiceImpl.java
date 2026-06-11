package com.mdk.mes.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.mdk.mes.entity.ProductSeries;
import com.mdk.mes.mapper.ProductSeriesMapper;
import com.mdk.mes.service.ProductSeriesService;
import org.springframework.stereotype.Service;

@Service
public class ProductSeriesServiceImpl extends ServiceImpl<ProductSeriesMapper, ProductSeries> implements ProductSeriesService {}

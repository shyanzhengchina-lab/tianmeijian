package com.mdk.mes.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.mdk.mes.entity.MaterialCategory;
import com.mdk.mes.mapper.MaterialCategoryMapper;
import com.mdk.mes.service.MaterialCategoryService;
import org.springframework.stereotype.Service;

@Service
public class MaterialCategoryServiceImpl
        extends ServiceImpl<MaterialCategoryMapper, MaterialCategory>
        implements MaterialCategoryService {}

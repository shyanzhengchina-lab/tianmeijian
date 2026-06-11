package com.mdk.mes.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.mdk.mes.entity.Material;
import com.mdk.mes.mapper.MaterialMapper;
import com.mdk.mes.service.MaterialService;
import org.springframework.stereotype.Service;

@Service
public class MaterialServiceImpl extends ServiceImpl<MaterialMapper, Material> implements MaterialService {}

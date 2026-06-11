package com.mdk.mes.service.impl;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.mdk.mes.entity.Bom;
import com.mdk.mes.mapper.BomMapper;
import com.mdk.mes.service.BomService;
import org.springframework.stereotype.Service;
@Service
public class BomServiceImpl extends ServiceImpl<BomMapper, Bom> implements BomService {}

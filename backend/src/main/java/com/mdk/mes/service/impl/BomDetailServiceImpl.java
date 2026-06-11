package com.mdk.mes.service.impl;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.mdk.mes.entity.BomDetail;
import com.mdk.mes.mapper.BomDetailMapper;
import com.mdk.mes.service.BomDetailService;
import org.springframework.stereotype.Service;
@Service
public class BomDetailServiceImpl extends ServiceImpl<BomDetailMapper, BomDetail> implements BomDetailService {}

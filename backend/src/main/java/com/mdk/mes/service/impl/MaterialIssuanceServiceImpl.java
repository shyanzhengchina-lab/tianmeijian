package com.mdk.mes.service.impl;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.mdk.mes.entity.MaterialIssuance;
import com.mdk.mes.mapper.MaterialIssuanceMapper;
import com.mdk.mes.service.MaterialIssuanceService;
import org.springframework.stereotype.Service;
@Service
public class MaterialIssuanceServiceImpl extends ServiceImpl<MaterialIssuanceMapper, MaterialIssuance> implements MaterialIssuanceService {}

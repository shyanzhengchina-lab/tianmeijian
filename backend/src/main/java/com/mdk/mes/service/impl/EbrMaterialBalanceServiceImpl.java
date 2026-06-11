package com.mdk.mes.service.impl;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.mdk.mes.entity.EbrMaterialBalance;
import com.mdk.mes.mapper.EbrMaterialBalanceMapper;
import com.mdk.mes.service.EbrMaterialBalanceService;
import org.springframework.stereotype.Service;
@Service
public class EbrMaterialBalanceServiceImpl extends ServiceImpl<EbrMaterialBalanceMapper, EbrMaterialBalance>
    implements EbrMaterialBalanceService {}

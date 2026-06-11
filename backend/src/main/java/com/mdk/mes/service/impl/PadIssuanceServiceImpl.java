package com.mdk.mes.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.mdk.mes.entity.PadIssuance;
import com.mdk.mes.mapper.PadIssuanceMapper;
import com.mdk.mes.service.PadIssuanceService;
import org.springframework.stereotype.Service;

@Service
public class PadIssuanceServiceImpl extends ServiceImpl<PadIssuanceMapper, PadIssuance> implements PadIssuanceService {}

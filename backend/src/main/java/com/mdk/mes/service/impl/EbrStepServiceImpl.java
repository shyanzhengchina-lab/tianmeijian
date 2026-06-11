package com.mdk.mes.service.impl;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.mdk.mes.entity.EbrStep;
import com.mdk.mes.mapper.EbrStepMapper;
import com.mdk.mes.service.EbrStepService;
import org.springframework.stereotype.Service;
@Service
public class EbrStepServiceImpl extends ServiceImpl<EbrStepMapper, EbrStep>
    implements EbrStepService {}

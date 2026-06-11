package com.mdk.mes.service.impl;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.mdk.mes.entity.MaterialIssuanceDetail;
import com.mdk.mes.mapper.MaterialIssuanceDetailMapper;
import com.mdk.mes.service.MaterialIssuanceDetailService;
import org.springframework.stereotype.Service;
@Service
public class MaterialIssuanceDetailServiceImpl extends ServiceImpl<MaterialIssuanceDetailMapper, MaterialIssuanceDetail> implements MaterialIssuanceDetailService {}

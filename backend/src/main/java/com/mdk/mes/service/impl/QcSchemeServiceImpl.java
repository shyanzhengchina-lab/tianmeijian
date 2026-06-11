package com.mdk.mes.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.mdk.mes.entity.QcScheme;
import com.mdk.mes.mapper.QcSchemeMapper;
import com.mdk.mes.service.QcSchemeService;
import org.springframework.stereotype.Service;

@Service
public class QcSchemeServiceImpl extends ServiceImpl<QcSchemeMapper, QcScheme> implements QcSchemeService {}

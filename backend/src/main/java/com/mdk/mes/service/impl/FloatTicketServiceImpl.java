package com.mdk.mes.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.mdk.mes.entity.FloatTicket;
import com.mdk.mes.mapper.FloatTicketMapper;
import com.mdk.mes.service.FloatTicketService;
import org.springframework.stereotype.Service;

@Service
public class FloatTicketServiceImpl extends ServiceImpl<FloatTicketMapper, FloatTicket> implements FloatTicketService {}

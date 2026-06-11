package com.mdk.mes.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.mdk.mes.entity.Team;
import com.mdk.mes.mapper.TeamMapper;
import com.mdk.mes.service.TeamService;
import org.springframework.stereotype.Service;

@Service
public class TeamServiceImpl extends ServiceImpl<TeamMapper, Team> implements TeamService {}

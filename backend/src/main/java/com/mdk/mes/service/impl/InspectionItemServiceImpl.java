package com.mdk.mes.service.impl;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.mdk.mes.entity.InspectionItem;
import com.mdk.mes.mapper.InspectionItemMapper;
import com.mdk.mes.service.InspectionItemService;
import org.springframework.stereotype.Service;
@Service
public class InspectionItemServiceImpl extends ServiceImpl<InspectionItemMapper, InspectionItem>
    implements InspectionItemService {}

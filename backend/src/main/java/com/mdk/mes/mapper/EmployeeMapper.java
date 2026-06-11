package com.mdk.mes.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.mdk.mes.entity.Employee;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface EmployeeMapper extends BaseMapper<Employee> {}

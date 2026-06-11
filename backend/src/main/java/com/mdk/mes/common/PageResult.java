package com.mdk.mes.common;

import lombok.Data;
import java.util.List;

@Data
public class PageResult<T> {
    private List<T> list;
    private Long total;
    private Integer current;
    private Integer pageSize;

    public static <T> PageResult<T> of(List<T> list, long total) {
        PageResult<T> p = new PageResult<>();
        p.list = list;
        p.total = total;
        return p;
    }

    public static <T> PageResult<T> of(List<T> list, long total, int current, int pageSize) {
        PageResult<T> p = new PageResult<>();
        p.list = list;
        p.total = total;
        p.current = current;
        p.pageSize = pageSize;
        return p;
    }
}

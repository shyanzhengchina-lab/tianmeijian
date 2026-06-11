/**
 * 统一响应工具
 */
const ok = (res, data = null, msg = '操作成功') => {
  res.json({ code: 200, msg, data });
};

const fail = (res, msg = '操作失败', code = 400) => {
  res.status(code).json({ code, msg, data: null });
};

const page = (res, list, total, pageNum = 1, pageSize = 20) => {
  res.json({
    code: 200, msg: '查询成功',
    data: { list, total, pageNum, pageSize, pages: Math.ceil(total / pageSize) }
  });
};

module.exports = { ok, fail, page };

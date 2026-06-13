/**
 * 天美健大自然生物工程有限公司 MES系统后端
 * Node.js + Express + MySQL (tmj_mes_db)
 * 端口: 8088
 */
const express = require('express');
const cors = require('cors');
const app = express();

// 中间件
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 请求日志
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// 路由
const systemRouter = require('./routes/system');
const baseRouter = require('./routes/base');
const planRouter = require('./routes/planExecution');
const qualityEbrRouter = require('./routes/qualityEbr');
const warehouseRouter = require('./routes/warehouse');
const equipmentRouter = require('./routes/equipment');
const traceRouter = require('./routes/traceAndDashboard');
const gmpPrdRouter = require('./routes/gmpPrd');   // PRD §8/§10/§11/§13/§15/§17

app.use('/api', systemRouter);
app.use('/api', baseRouter);
app.use('/api', planRouter);
app.use('/api', qualityEbrRouter);
app.use('/api', warehouseRouter);
app.use('/api', equipmentRouter);
app.use('/api', traceRouter);
app.use('/api', gmpPrdRouter);

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'TMJ-MES Backend', db: 'tmj_mes_db', time: new Date() });
});

app.get('/', (req, res) => {
  res.json({
    name: '天美健MES系统后端API',
    version: '1.0.0',
    database: 'tmj_mes_db (独立数据库)',
    modules: [
      'M01-计划管理', 'M02-生产执行', 'M03-质量管理',
      'M04-电子批记录', 'M05-物料仓储', 'M06-设备管理',
      'M07-追溯管理', 'M08-可视化看板', 'M09-系统管理'
    ],
    docs: '/api-docs'
  });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ code: 500, msg: err.message || '服务器内部错误' });
});

const PORT = process.env.PORT || 8088;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 天美健MES系统后端启动成功！`);
  console.log(`📡 服务端口: ${PORT}`);
  console.log(`🗄️  数据库: tmj_mes_db (独立，不与旧系统混用)`);
  console.log(`📋 9大功能模块已就绪`);
  console.log(`🔑 默认账号: admin / Admin@2026`);
});

module.exports = app;

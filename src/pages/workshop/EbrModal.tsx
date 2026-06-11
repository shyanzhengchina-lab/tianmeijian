import React, { useState } from 'react';
import {
  Modal, Steps, Button, Select, Input, message, Tag, Progress,
  Checkbox, Divider, Space,
} from 'antd';
import {
  CameraOutlined, CheckCircleOutlined, UploadOutlined,
  ArrowRightOutlined, ArrowLeftOutlined,
  ExclamationCircleOutlined, SafetyOutlined, FileTextOutlined,
  CheckSquareOutlined, PlayCircleOutlined,
} from '@ant-design/icons';
import { StationCard } from './workshopData';

const { Option } = Select;

// ── 阶段定义 ────────────────────────────────────────────────────
const STAGES = [
  { key: 'PRE_CLEAN',    title: '前清场',   icon: <SafetyOutlined />,      color: '#13c2c2' },
  { key: 'CHECK_IN',     title: '进站确认', icon: <CheckSquareOutlined />, color: '#1677FF' },
  { key: 'MAT_VERIFY',   title: '物料确认', icon: <FileTextOutlined />,    color: '#722ed1' },
  { key: 'FIRST_PIECE',  title: '首件确认', icon: <ExclamationCircleOutlined />, color: '#fa8c16' },
  { key: 'REPORT',       title: '报工出站', icon: <PlayCircleOutlined />,  color: '#52c41a' },
];

// ── 前清场检查项 ─────────────────────────────────────────────────
const PRE_CLEAN_ITEMS = [
  { key: 'last_batch',      label: '上批产品是否已完全转移', options: ['正常', '已转移', '需补充'] },
  { key: 'device_clean',    label: '设备/工位台面是否已清洁', options: ['正常', '已清洁', '不合格'] },
  { key: 'tool_check',      label: '工装夹具是否已归位', options: ['正常', '未归位', 'N/A'] },
  { key: 'waste_removal',   label: '废料/边角料是否已清除', options: ['正常', '已清除', '有残余'] },
  { key: 'label_removal',   label: '上批产品标识标签是否已撤除', options: ['正常', '已撤除', 'N/A'] },
  { key: 'device_safety',   label: '设备安全状态检查', options: ['正常', '异常', '待修'] },
];

// ── 进站确认项 ──────────────────────────────────────────────────
const CHECK_IN_ITEMS = [
  { key: 'work_order',      label: '生产工单确认（工单号与批号一致）', required: true },
  { key: 'batch_qty',       label: '本批数量是否核对', required: true },
  { key: 'op_qualification',label: '操作员资质确认（持证上岗）', required: true },
  { key: 'device_status',   label: '设备点检完成确认', required: true },
  { key: 'process_doc',     label: '工艺文件/SOP已确认可及', required: false },
];

// ── 物料确认项 ──────────────────────────────────────────────────
const MAT_VERIFY_ITEMS = [
  { key: 'mat_code',   label: '原材料编码是否匹配BOM', type: 'input', placeholder: '扫描物料条码...' },
  { key: 'mat_batch',  label: '原材料批号', type: 'input', placeholder: '输入或扫描原料批号...' },
  { key: 'mat_qty',    label: '物料数量是否符合', type: 'select', options: ['正常', '缺料', '多料'] },
  { key: 'mat_expire', label: '原材料有效期确认', type: 'select', options: ['在效期内', '临近到期', '已过期'] },
];

interface EbrModalProps {
  open: boolean;
  station: StationCard | null;
  onClose: () => void;
}

const EbrModal: React.FC<EbrModalProps> = ({ open, station, onClose }) => {
  const [currentStage, setCurrentStage] = useState(0);
  const [preCleanValues, setPreCleanValues] = useState<Record<string, string>>({});
  const [preCleanPhotos, setPreCleanPhotos] = useState<string[]>([]);
  const [checkInValues, setCheckInValues] = useState<Record<string, boolean>>({});
  const [matValues, setMatValues] = useState<Record<string, string>>({});
  const [firstPieceResult, setFirstPieceResult] = useState<'PASS' | 'FAIL' | ''>('');
  const [firstPieceRemark, setFirstPieceRemark] = useState('');
  const [reportQty, setReportQty] = useState<number | ''>('');
  const [reportRemark, setReportRemark] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!station) return null;

  const stageTitle = STAGES[currentStage];

  // 验证当前阶段是否完成
  const canProceed = (): boolean => {
    if (currentStage === 0) {
      return PRE_CLEAN_ITEMS.every(item => !!preCleanValues[item.key]);
    }
    if (currentStage === 1) {
      return CHECK_IN_ITEMS.filter(i => i.required).every(i => checkInValues[i.key]);
    }
    if (currentStage === 2) {
      return !!matValues['mat_code'] && !!matValues['mat_batch'];
    }
    if (currentStage === 3) {
      return firstPieceResult !== '';
    }
    if (currentStage === 4) {
      return !!reportQty && Number(reportQty) > 0;
    }
    return true;
  };

  const handleNext = () => {
    if (!canProceed()) {
      message.warning('请完成本阶段所有必填项后再继续');
      return;
    }
    if (currentStage < STAGES.length - 1) {
      setCurrentStage(prev => prev + 1);
      message.success(`${STAGES[currentStage].title} 阶段确认完成`);
    }
  };

  const handlePrev = () => {
    if (currentStage > 0) setCurrentStage(prev => prev - 1);
  };

  const handleSubmit = () => {
    if (!canProceed()) {
      message.warning('请完成报工信息填写');
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      message.success(`批次 ${station.batchNo} 本道工序报工成功，已推送至下工序`);
      handleClose();
    }, 1200);
  };

  const handleClose = () => {
    setCurrentStage(0);
    setPreCleanValues({});
    setPreCleanPhotos([]);
    setCheckInValues({});
    setMatValues({});
    setFirstPieceResult('');
    setFirstPieceRemark('');
    setReportQty('');
    setReportRemark('');
    onClose();
  };

  // ── 渲染各阶段内容 ──────────────────────────────────────────────
  const renderStageContent = () => {
    // 阶段0：前清场
    if (currentStage === 0) {
      return (
        <div className="ebr-stage-content">
          <div className="ebr-stage-header">
            <SafetyOutlined style={{ color: '#13c2c2', fontSize: 20, marginRight: 8 }} />
            <span className="ebr-stage-title" style={{ color: '#13c2c2' }}>前清场检查清单</span>
            <span className="ebr-stage-desc">进入本工序前，请逐项确认清场状态</span>
          </div>

          <div className="ebr-checklist">
            {PRE_CLEAN_ITEMS.map((item, idx) => (
              <div key={item.key} className="ebr-check-row">
                <div className="ebr-check-index">{idx + 1}</div>
                <div className="ebr-check-label">{item.label}</div>
                <Select
                  size="small"
                  style={{ width: 140 }}
                  placeholder="请选择"
                  value={preCleanValues[item.key] || undefined}
                  onChange={val => setPreCleanValues(prev => ({ ...prev, [item.key]: val }))}
                  className="ebr-check-select"
                >
                  {item.options.map(opt => (
                    <Option key={opt} value={opt}>
                      <span style={{
                        color: opt === '正常' || opt === '已转移' || opt === '已清洁' ||
                               opt === '已归位' || opt === '已清除' || opt === '已撤除'
                          ? '#52c41a'
                          : opt.includes('异常') || opt.includes('不合格') || opt.includes('残余')
                          ? '#ff4d4f'
                          : '#fa8c16'
                      }}>
                        {opt === '正常' || opt === '已转移' || opt === '已清洁' ||
                         opt === '已清除' || opt === '已撤除' ? '✅ ' : 
                         opt.includes('异常') || opt.includes('不合格') ? '❌ ' : '⚠️ '}
                        {opt}
                      </span>
                    </Option>
                  ))}
                </Select>
                {preCleanValues[item.key] && (
                  <CheckCircleOutlined style={{ color: '#52c41a', marginLeft: 8 }} />
                )}
              </div>
            ))}
          </div>

          <Divider style={{ margin: '16px 0 12px' }} />

          <div className="ebr-photo-section">
            <div className="ebr-photo-label">
              <CameraOutlined style={{ marginRight: 6, color: '#1677ff' }} />
              拍照上传（现场清场照片）
            </div>
            <div className="ebr-photo-area">
              {preCleanPhotos.map((_, i) => (
                <div key={i} className="ebr-photo-thumb">
                  <img
                    src={`https://picsum.photos/80/60?random=${i + 10}`}
                    alt="清场照片"
                    style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 4 }}
                  />
                </div>
              ))}
              <Button
                icon={<UploadOutlined />}
                size="small"
                style={{ height: 60, width: 80, border: '1px dashed #d9d9d9' }}
                onClick={() => {
                  setPreCleanPhotos(prev => [...prev, `photo_${Date.now()}`]);
                  message.success('照片已上传（模拟）');
                }}
              >
                上传
              </Button>
            </div>
          </div>

          <div className="ebr-completion-badge">
            <Progress
              percent={Math.round(Object.keys(preCleanValues).length / PRE_CLEAN_ITEMS.length * 100)}
              size="small"
              format={p => `${Object.keys(preCleanValues).length}/${PRE_CLEAN_ITEMS.length} 项完成`}
              strokeColor="#13c2c2"
            />
          </div>
        </div>
      );
    }

    // 阶段1：进站确认
    if (currentStage === 1) {
      return (
        <div className="ebr-stage-content">
          <div className="ebr-stage-header">
            <CheckSquareOutlined style={{ color: '#1677FF', fontSize: 20, marginRight: 8 }} />
            <span className="ebr-stage-title" style={{ color: '#1677FF' }}>进站确认</span>
            <span className="ebr-stage-desc">核对工单信息和操作资质</span>
          </div>

          <div className="ebr-info-card">
            <div className="ebr-info-row"><span className="ebr-info-label">工位</span><span className="ebr-info-val blue">{station.stationCode} {station.stationName}</span></div>
            <div className="ebr-info-row"><span className="ebr-info-label">批号</span><span className="ebr-info-val blue">{station.batchNo}</span></div>
            <div className="ebr-info-row"><span className="ebr-info-label">产品型号</span><span className="ebr-info-val">{station.productModel}</span></div>
            <div className="ebr-info-row"><span className="ebr-info-label">计划数量</span><span className="ebr-info-val">{station.planQty?.toLocaleString()} 支</span></div>
            <div className="ebr-info-row"><span className="ebr-info-label">操作员</span><span className="ebr-info-val">{station.operator || '—'}</span></div>
          </div>

          <Divider style={{ margin: '12px 0' }} />
          <div className="ebr-checklist">
            {CHECK_IN_ITEMS.map((item, idx) => (
              <div key={item.key} className="ebr-checkbox-row">
                <Checkbox
                  checked={!!checkInValues[item.key]}
                  onChange={e => setCheckInValues(prev => ({ ...prev, [item.key]: e.target.checked }))}
                >
                  <span>
                    {item.required && <Tag color="red" style={{ fontSize: 10, padding: '0 3px', marginRight: 6 }}>必选</Tag>}
                    {item.label}
                  </span>
                </Checkbox>
              </div>
            ))}
          </div>

          <div className="ebr-completion-badge" style={{ marginTop: 16 }}>
            <Progress
              percent={Math.round(Object.values(checkInValues).filter(Boolean).length / CHECK_IN_ITEMS.filter(i => i.required).length * 100)}
              size="small"
              strokeColor="#1677FF"
              format={() => `${Object.values(checkInValues).filter(Boolean).length}/${CHECK_IN_ITEMS.length} 项已确认`}
            />
          </div>
        </div>
      );
    }

    // 阶段2：物料一致确认
    if (currentStage === 2) {
      return (
        <div className="ebr-stage-content">
          <div className="ebr-stage-header">
            <FileTextOutlined style={{ color: '#722ed1', fontSize: 20, marginRight: 8 }} />
            <span className="ebr-stage-title" style={{ color: '#722ed1' }}>物料一致确认</span>
            <span className="ebr-stage-desc">核对投入物料与BOM要求一致</span>
          </div>

          <div className="ebr-mat-grid">
            {MAT_VERIFY_ITEMS.map(item => (
              <div key={item.key} className="ebr-mat-row">
                <label className="ebr-mat-label">{item.label}</label>
                {item.type === 'input' ? (
                  <Input
                    size="small"
                    placeholder={item.placeholder}
                    value={matValues[item.key] || ''}
                    onChange={e => setMatValues(prev => ({ ...prev, [item.key]: e.target.value }))}
                    prefix={item.key === 'mat_code' ? '🔍' : undefined}
                    style={{ width: '100%' }}
                  />
                ) : (
                  <Select
                    size="small"
                    style={{ width: '100%' }}
                    placeholder="请选择"
                    value={matValues[item.key] || undefined}
                    onChange={val => setMatValues(prev => ({ ...prev, [item.key]: val }))}
                  >
                    {(item.options || []).map(opt => (
                      <Option key={opt} value={opt}>
                        <span style={{ color: opt === '正常' || opt === '在效期内' ? '#52c41a' : opt.includes('异常') || opt.includes('过期') ? '#ff4d4f' : '#fa8c16' }}>
                          {opt}
                        </span>
                      </Option>
                    ))}
                  </Select>
                )}
              </div>
            ))}
          </div>

          {matValues['mat_code'] && (
            <div className="ebr-mat-scan-result">
              <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
              物料编码已扫描：<strong>{matValues['mat_code']}</strong>，BOM匹配 ✅
            </div>
          )}
        </div>
      );
    }

    // 阶段3：首件确认
    if (currentStage === 3) {
      return (
        <div className="ebr-stage-content">
          <div className="ebr-stage-header">
            <ExclamationCircleOutlined style={{ color: '#fa8c16', fontSize: 20, marginRight: 8 }} />
            <span className="ebr-stage-title" style={{ color: '#fa8c16' }}>首件确认</span>
            <span className="ebr-stage-desc">对本工序首件进行质量确认</span>
          </div>

          <div className="ebr-first-piece">
            <div className="ebr-first-piece-guide">
              <div className="ebr-guide-step">1. 制作首件产品（第1支）</div>
              <div className="ebr-guide-step">2. 按图纸规格逐项检测</div>
              <div className="ebr-guide-step">3. 填写检测结果并判定</div>
            </div>

            <Divider style={{ margin: '12px 0' }} />

            <div className="ebr-first-piece-table">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#fafafa' }}>
                    <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #f0f0f0' }}>检测项目</th>
                    <th style={{ padding: '8px 12px', textAlign: 'center', borderBottom: '1px solid #f0f0f0' }}>规格要求</th>
                    <th style={{ padding: '8px 12px', textAlign: 'center', borderBottom: '1px solid #f0f0f0' }}>实测值</th>
                    <th style={{ padding: '8px 12px', textAlign: 'center', borderBottom: '1px solid #f0f0f0' }}>判定</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { item: '外径', spec: 'Φ0.25±0.01mm', measured: '0.249', pass: true },
                    { item: '长度', spec: '25.0±0.5mm', measured: '25.1', pass: true },
                    { item: '锥度', spec: '04锥', measured: '0.040', pass: true },
                    { item: '外观', spec: '无划痕裂纹', measured: '目检OK', pass: true },
                  ].map((row, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '7px 12px' }}>{row.item}</td>
                      <td style={{ padding: '7px 12px', textAlign: 'center', fontFamily: 'monospace', fontSize: 12 }}>{row.spec}</td>
                      <td style={{ padding: '7px 12px', textAlign: 'center', fontFamily: 'monospace', fontSize: 12, color: '#1677ff' }}>{row.measured}</td>
                      <td style={{ padding: '7px 12px', textAlign: 'center' }}>
                        <Tag color={row.pass ? 'success' : 'error'}>{row.pass ? '合格' : '不合格'}</Tag>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="ebr-first-piece-result">
              <span className="ebr-result-label">首件判定结果：</span>
              <Space>
                <Button
                  size="small"
                  type={firstPieceResult === 'PASS' ? 'primary' : 'default'}
                  style={firstPieceResult === 'PASS' ? { background: '#52c41a', borderColor: '#52c41a' } : {}}
                  onClick={() => setFirstPieceResult('PASS')}
                  icon={<CheckCircleOutlined />}
                >
                  合格 — 允许批量生产
                </Button>
                <Button
                  size="small"
                  danger
                  type={firstPieceResult === 'FAIL' ? 'primary' : 'default'}
                  onClick={() => setFirstPieceResult('FAIL')}
                >
                  不合格 — 需调整参数
                </Button>
              </Space>
            </div>

            {firstPieceResult === 'FAIL' && (
              <div style={{ marginTop: 12 }}>
                <Input.TextArea
                  rows={2}
                  placeholder="请说明不合格原因及整改措施..."
                  value={firstPieceRemark}
                  onChange={e => setFirstPieceRemark(e.target.value)}
                />
              </div>
            )}

            {firstPieceResult === 'PASS' && (
              <div className="ebr-first-piece-pass-badge">
                <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 18, marginRight: 8 }} />
                首件合格，允许正式批量投产
              </div>
            )}
          </div>
        </div>
      );
    }

    // 阶段4：报工出站
    if (currentStage === 4) {
      const progress = station.planQty && station.finishQty
        ? Math.round((station.finishQty / station.planQty) * 100) : 0;
      return (
        <div className="ebr-stage-content">
          <div className="ebr-stage-header">
            <PlayCircleOutlined style={{ color: '#52c41a', fontSize: 20, marginRight: 8 }} />
            <span className="ebr-stage-title" style={{ color: '#52c41a' }}>报工出站</span>
            <span className="ebr-stage-desc">填写本工序完工数量，提交报工</span>
          </div>

          <div className="ebr-report-summary">
            <div className="ebr-summary-item">
              <div className="ebr-summary-val">{station.planQty?.toLocaleString()}</div>
              <div className="ebr-summary-label">计划数量</div>
            </div>
            <div className="ebr-summary-item green">
              <div className="ebr-summary-val">{station.finishQty?.toLocaleString()}</div>
              <div className="ebr-summary-label">已完成</div>
            </div>
            <div className="ebr-summary-item blue">
              <div className="ebr-summary-val">{progress}%</div>
              <div className="ebr-summary-label">进度</div>
            </div>
          </div>

          <Progress
            percent={progress}
            strokeColor="#52c41a"
            style={{ margin: '8px 0 16px' }}
          />

          <div className="ebr-report-form">
            <div className="ebr-report-row">
              <label className="ebr-report-label">本次完工数量 <span style={{ color: 'red' }}>*</span></label>
              <input
                type="number"
                className="ebr-report-input"
                placeholder="请输入完工数量（支）"
                value={reportQty}
                min={0}
                onChange={e => setReportQty(Number(e.target.value) || '')}
              />
            </div>
            <div className="ebr-report-row">
              <label className="ebr-report-label">报废数量</label>
              <input
                type="number"
                className="ebr-report-input"
                placeholder="报废支数（无则填0）"
                defaultValue={0}
                min={0}
              />
            </div>
            <div className="ebr-report-row">
              <label className="ebr-report-label">下工序</label>
              <div className="ebr-report-next-op">
                <Tag color="blue" style={{ fontSize: 13, padding: '2px 10px' }}>
                  → {station.nextStation || '研磨一'}
                </Tag>
                <span style={{ fontSize: 12, color: '#888', marginLeft: 8 }}>（自动推送）</span>
              </div>
            </div>
            <div className="ebr-report-row">
              <label className="ebr-report-label">备注</label>
              <textarea
                className="ebr-report-textarea"
                rows={2}
                placeholder="可填写本次生产注意事项..."
                value={reportRemark}
                onChange={e => setReportRemark(e.target.value)}
              />
            </div>
          </div>

          <div className="ebr-report-confirm-box">
            <ExclamationCircleOutlined style={{ color: '#fa8c16', marginRight: 8 }} />
            <span>报工后将自动更新工单进度，并向下工序推送待处理通知。请确认数量无误后提交。</span>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      footer={null}
      width={640}
      title={
        <div className="ebr-modal-title">
          <FileTextOutlined style={{ color: '#1677ff', marginRight: 8 }} />
          <span>EBR 电子批生产记录</span>
          <Tag color="blue" style={{ marginLeft: 12, fontSize: 12 }}>{station.stationCode}</Tag>
          <Tag color="green" style={{ fontSize: 12 }}>{station.batchNo}</Tag>
        </div>
      }
      className="ebr-modal"
      destroyOnClose
    >
      {/* 工序信息栏 */}
      <div className="ebr-top-info">
        <span>工位：<strong>{station.stationName}</strong></span>
        <span>产品：<strong>{station.productModel}</strong></span>
        <span>当前阶段：<Tag color="processing">{station.currentStage || '—'}</Tag></span>
        <span>操作员：<strong>{station.operator || '—'}</strong></span>
      </div>

      {/* 阶段步骤条 */}
      <Steps
        current={currentStage}
        size="small"
        style={{ margin: '12px 0 16px', padding: '0 8px' }}
        items={STAGES.map((s, i) => ({
          title: s.title,
          icon: currentStage > i
            ? <CheckCircleOutlined style={{ color: '#52c41a' }} />
            : <span style={{ color: currentStage === i ? s.color : '#d9d9d9', fontSize: 18 }}>{s.icon}</span>,
        }))}
      />

      {/* 阶段内容 */}
      <div className="ebr-content-area">
        {renderStageContent()}
      </div>

      {/* 底部按钮 */}
      <div className="ebr-footer">
        <Button icon={<ArrowLeftOutlined />} onClick={handlePrev} disabled={currentStage === 0}>
          上一阶段
        </Button>
        <div className="ebr-footer-center">
          <span style={{ color: '#888', fontSize: 12 }}>
            阶段 {currentStage + 1} / {STAGES.length}：{stageTitle.title}
          </span>
        </div>
        {currentStage < STAGES.length - 1 ? (
          <Button
            type="primary"
            icon={<ArrowRightOutlined />}
            onClick={handleNext}
            style={{ background: stageTitle.color, borderColor: stageTitle.color }}
          >
            确认进入下阶段
          </Button>
        ) : (
          <Button
            type="primary"
            icon={<CheckCircleOutlined />}
            onClick={handleSubmit}
            loading={submitting}
            style={{ background: '#52c41a', borderColor: '#52c41a' }}
          >
            提交报工出站
          </Button>
        )}
      </div>
    </Modal>
  );
};

export default EbrModal;

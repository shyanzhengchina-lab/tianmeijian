import React, { useState } from 'react';
import { Button, Card, Checkbox, Select, Space, Typography, Tag, Alert, Divider, Row, Col, message } from 'antd';
import { CheckCircleOutlined, EditOutlined, ScanOutlined, WarningOutlined } from '@ant-design/icons';
import type { StageExecution } from '../padExecutionData';
import PadNumPad from '../components/PadNumPad';
import PadCamera, { CapturedPhoto } from '../components/PadCamera';

const { Text } = Typography;
const { Option } = Select;

interface PostCleanStageProps {
  opCode?: string;
  content?: string;
  nextOpName?: string;
  execution: StageExecution;
  onComplete: (data: Record<string, unknown>) => void;
  onESign: (cb: () => void) => void;
}

// 按工序配置后清场的额外专项检查项
interface ExtraCheck {
  key: string;
  label: string;
  hint?: string;
  warn?: string;
}

const EXTRA_CHECKS_BY_OP: Record<string, ExtraCheck[]> = {
  // OP-10 机床成型：冷却液处理、刀具归位
  'OP-10-GRIND': [
    { key: 'coolant', label: '冷却液/切削液排放并清洁机床内腔', hint: '需将冷却液残液清理干净' },
    { key: 'tool_return', label: '刀具/量具归位并记录使用次数', hint: '刀具磨损记录签名确认' },
    { key: 'chip_clear', label: '铁屑/切屑清理完毕，放入专用回收箱' },
  ],
  // OP-30 尾部修整：切削废屑清理
  'OP-30-TAIL': [
    { key: 'chip_clear', label: '尾部切削废屑收集，分类放入废料桶' },
    { key: 'tool_check', label: '修整刀具检查：磨损情况记录' },
  ],
  // OP-50 研磨一：磨料废液处理
  'OP-50-GRIND1': [
    { key: 'abrasive', label: '研磨废液/废磨料收集，按规定处置', warn: '研磨液属危险废物，须按规定处理' },
    { key: 'fixture_clean', label: '研磨夹具清洁归位' },
    { key: 'filter_check', label: '过滤网检查，必要时更换' },
  ],
  // OP-70 清洗二：清洗液排放、超声波机台清洁
  'OP-70-WASH2': [
    { key: 'wash_liquid', label: '清洗液更换/液位检查，记录换液日期', hint: '清洗液使用次数超过20次须更换' },
    { key: 'ultrasonic', label: '超声波机台清洁：槽内残留清理' },
    { key: 'drying', label: '烘干设备清洁、温度复位' },
  ],
  // OP-100 组装：装配台清场
  'OP-100-ASM': [
    { key: 'fixture_asm', label: '装配治具清洁归位，无物料残留' },
    { key: 'leftover_parts', label: '余料/多余零件退库并标识', hint: '多余零件务必退回仓库' },
  ],
  // OP-130 装限位块：小零件特别清场
  'OP-130-LIMIT': [
    { key: 'small_parts', label: '限位块/小零件全部归位，无遗失', warn: '限位块为高价值小零件，需逐一清点' },
    { key: 'jig_clean', label: '装配夹具清洁，小孔/槽位确认无残留' },
  ],
  // OP-150 半成品入库：仓储前最终清场
  'OP-150-STORE': [
    { key: 'label_all', label: '所有产品标签/包装核对完毕' },
    { key: 'shelf_clear', label: '暂存区域清场，无遗留物品' },
  ],
};

const PostCleanStage: React.FC<PostCleanStageProps> = ({
  opCode = '',
  content,
  nextOpName,
  execution,
  onComplete,
  onESign,
}) => {
  const extraChecks = EXTRA_CHECKS_BY_OP[opCode] || [];

  const [checks, setChecks] = useState({
    workbenchClear: false,
    deviceClear: false,
    wasteClear: false,
    infoMatch: '' as '' | 'consistent' | 'inconsistent',
    transferDone: false,
  });
  const [extraDone, setExtraDone] = useState<Record<string, boolean>>(
    Object.fromEntries(extraChecks.map(c => [c.key, false]))
  );
  const [badQty, setBadQty] = useState<number | null>(0);
  const [scrapQty, setScrapQty] = useState<number | null>(0);
  const [tailQty, setTailQty] = useState<number | null>(0);
  const [photos, setPhotos] = useState<CapturedPhoto[]>([]);
  const [conclusion, setConclusion] = useState<'' | 'pass' | 'fail'>('');
  const [signed, setSigned] = useState(false);
  const isCompleted = execution.status === 'completed';

  const allExtraDone = extraChecks.every(c => extraDone[c.key]);

  const canSubmit =
    checks.workbenchClear &&
    checks.deviceClear &&
    checks.wasteClear &&
    checks.infoMatch === 'consistent' &&
    checks.transferDone &&
    allExtraDone &&
    photos.length >= 1 &&
    conclusion === 'pass' &&
    signed;

  const handleSign = () => {
    onESign(() => {
      setSigned(true);
      message.success('电子签名完成');
    });
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    onComplete({
      post_op: opCode,
      post_1: checks.workbenchClear,
      post_2: checks.deviceClear,
      post_3: checks.wasteClear,
      post_bad_qty: badQty ?? 0,
      post_scrap_qty: scrapQty ?? 0,
      post_tail_qty: tailQty ?? 0,
      post_4: checks.infoMatch,
      post_5: checks.transferDone,
      post_extra: extraDone,
      post_photo: photos.length,
      post_photos: photos.map(p => p.timestamp),
      post_result: conclusion,
      post_operator: '张三(1001)',
    });
  };

  if (isCompleted) {
    return (
      <Card style={{ background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 10 }}>
        <Space>
          <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 20 }} />
          <Text strong style={{ color: '#52c41a' }}>后清场已完成</Text>
        </Space>
      </Card>
    );
  }

  return (
    <div>
      <Card
        title={
          <Space>
            <span>🧹</span>
            <span>后清场</span>
            {content && (
              <Tag color="orange" style={{ fontWeight: 'normal', fontSize: 12 }}>
                {content}
              </Tag>
            )}
          </Space>
        }
        style={{ marginBottom: 16, borderRadius: 10 }}
      >
        <Space direction="vertical" style={{ width: '100%' }} size={14}>
          {content && <Alert message={content} type="info" showIcon />}

          {/* 1. 工作台清场 + 拍照 */}
          <Card
            size="small"
            style={{ background: checks.workbenchClear ? '#f6ffed' : '#fff', borderRadius: 8 }}
          >
            <Space direction="vertical" style={{ width: '100%' }} size={10}>
              <Checkbox
                checked={checks.workbenchClear}
                onChange={e => setChecks(p => ({ ...p, workbenchClear: e.target.checked }))}
              >
                <Text strong>1. 清理工作台本批次产品，确认无残留</Text>
              </Checkbox>
              <div style={{ paddingLeft: 24 }}>
                <PadCamera
                  photos={photos}
                  onChange={setPhotos}
                  minCount={1}
                  maxCount={6}
                  label="拍照留证（至少1张）"
                />
              </div>
            </Space>
          </Card>

          {/* 2. 设备清场 */}
          <Card
            size="small"
            style={{ background: checks.deviceClear ? '#f6ffed' : '#fff', borderRadius: 8 }}
          >
            <Checkbox
              checked={checks.deviceClear}
              onChange={e => setChecks(p => ({ ...p, deviceClear: e.target.checked }))}
            >
              <Text strong>2. 清理设备台面/内部，确认无残留</Text>
            </Checkbox>
          </Card>

          {/* 3. 废料分类 + 数量 */}
          <Card
            size="small"
            style={{ background: checks.wasteClear ? '#f6ffed' : '#fff', borderRadius: 8 }}
          >
            <Space direction="vertical" style={{ width: '100%' }} size={10}>
              <Checkbox
                checked={checks.wasteClear}
                onChange={e => setChecks(p => ({ ...p, wasteClear: e.target.checked }))}
              >
                <Text strong>3. 不合格品/废料/尾料分类、标识清理</Text>
              </Checkbox>
              <Row gutter={[20, 8]} style={{ paddingLeft: 24 }} align="middle">
                <Col>
                  <Space direction="vertical" size={4}>
                    <Text style={{ fontSize: 12 }}>不合格品（件）</Text>
                    <PadNumPad
                      value={badQty}
                      onChange={setBadQty}
                      precision={0}
                      allowDecimal={false}
                      unit="件"
                      label="不合格品数量"
                      min={0}
                      width={120}
                      height={48}
                      fontSize={15}
                    />
                  </Space>
                </Col>
                <Col>
                  <Space direction="vertical" size={4}>
                    <Text style={{ fontSize: 12 }}>废料（件）</Text>
                    <PadNumPad
                      value={scrapQty}
                      onChange={setScrapQty}
                      precision={0}
                      allowDecimal={false}
                      unit="件"
                      label="废料数量"
                      min={0}
                      width={120}
                      height={48}
                      fontSize={15}
                    />
                  </Space>
                </Col>
                <Col>
                  <Space direction="vertical" size={4}>
                    <Text style={{ fontSize: 12 }}>尾料（件）</Text>
                    <PadNumPad
                      value={tailQty}
                      onChange={setTailQty}
                      precision={0}
                      allowDecimal={false}
                      unit="件"
                      label="尾料数量"
                      min={0}
                      width={120}
                      height={48}
                      fontSize={15}
                    />
                  </Space>
                </Col>
              </Row>
            </Space>
          </Card>

          {/* 工序专属额外清场项 */}
          {extraChecks.length > 0 && (
            <Card
              size="small"
              title={
                <Space>
                  <span>⚙️</span>
                  <Text strong style={{ fontSize: 13 }}>
                    工序专项清场（{opCode}）
                  </Text>
                  <Tag color={allExtraDone ? 'success' : 'warning'} style={{ fontSize: 11 }}>
                    {extraChecks.filter(c => extraDone[c.key]).length}/{extraChecks.length} 已完成
                  </Tag>
                </Space>
              }
              style={{ background: allExtraDone ? '#f6ffed' : '#fffbe6', borderRadius: 8 }}
            >
              <Space direction="vertical" style={{ width: '100%' }} size={10}>
                {extraChecks.map((ec, idx) => (
                  <div key={ec.key}>
                    {ec.warn && (
                      <Alert
                        message={ec.warn}
                        type="warning"
                        showIcon
                        icon={<WarningOutlined />}
                        style={{ marginBottom: 6, fontSize: 12 }}
                      />
                    )}
                    <Checkbox
                      checked={extraDone[ec.key]}
                      onChange={e =>
                        setExtraDone(prev => ({ ...prev, [ec.key]: e.target.checked }))
                      }
                    >
                      <Text strong>
                        {idx + 4}. {ec.label}
                      </Text>
                    </Checkbox>
                    {ec.hint && (
                      <div style={{ paddingLeft: 24 }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          💡 {ec.hint}
                        </Text>
                      </div>
                    )}
                  </div>
                ))}
              </Space>
            </Card>
          )}

          {/* 4/N+1. 信息核对 */}
          <Card
            size="small"
            style={{
              background: checks.infoMatch === 'consistent' ? '#f6ffed' : '#fff',
              borderRadius: 8,
            }}
          >
            <Space>
              <Checkbox checked={checks.infoMatch === 'consistent'} onChange={() => {}}>
                <Text strong>核对产品实物与工序转移单信息一致</Text>
              </Checkbox>
              <Select
                size="large"
                style={{ width: 140 }}
                placeholder="选择"
                value={checks.infoMatch || undefined}
                onChange={v =>
                  setChecks(p => ({ ...p, infoMatch: v as 'consistent' | 'inconsistent' }))
                }
              >
                <Option value="consistent">✓ 一致</Option>
                <Option value="inconsistent">✗ 不一致</Option>
              </Select>
            </Space>
          </Card>

          {/* 产品转移 */}
          <Card
            size="small"
            style={{ background: checks.transferDone ? '#f6ffed' : '#fff', borderRadius: 8 }}
          >
            <Space direction="vertical" style={{ width: '100%' }} size={8}>
              <Checkbox
                checked={checks.transferDone}
                onChange={e => setChecks(p => ({ ...p, transferDone: e.target.checked }))}
              >
                <Text strong>产品标识并按流程转移至下工序</Text>
              </Checkbox>
              {nextOpName && (
                <div style={{ paddingLeft: 24 }}>
                  <Text type="secondary">下工序：</Text>
                  <Tag color="blue">{nextOpName}</Tag>
                  <Button
                    icon={<ScanOutlined />}
                    size="large"
                    style={{ marginLeft: 12, height: 44 }}
                    onClick={() => message.info('接收人工牌扫码功能（演示）')}
                  >
                    扫码接收人工牌
                  </Button>
                </div>
              )}
            </Space>
          </Card>

          <Divider />

          {/* 结论 + 签名 */}
          <Row gutter={24} align="middle">
            <Col span={10}>
              <Space>
                <Text strong style={{ fontSize: 15 }}>
                  清场结论：
                </Text>
                <Select
                  size="large"
                  style={{ width: 140 }}
                  placeholder="选择"
                  value={conclusion || undefined}
                  onChange={v => setConclusion(v as 'pass' | 'fail')}
                >
                  <Option value="pass">✓ 合格</Option>
                  <Option value="fail">✗ 不合格</Option>
                </Select>
              </Space>
            </Col>
            <Col span={14}>
              <Space>
                <Text strong style={{ fontSize: 15 }}>
                  操作员签名：
                </Text>
                {signed ? (
                  <Tag color="success" style={{ fontSize: 14 }}>
                    ✓ 张三 已签名
                  </Tag>
                ) : (
                  <Button
                    icon={<EditOutlined />}
                    size="large"
                    style={{
                      height: 40,
                      fontSize: 15,
                      background: '#722ed1',
                      color: '#fff',
                      border: 'none',
                    }}
                    onClick={handleSign}
                  >
                    电子签名
                  </Button>
                )}
              </Space>
            </Col>
          </Row>
        </Space>
      </Card>

      <div style={{ textAlign: 'right' }}>
        <Button
          type="primary"
          size="large"
          disabled={!canSubmit}
          onClick={handleSubmit}
          style={{ height: 52, fontSize: 17, paddingInline: 36 }}
        >
          ✅ 提交后清场
        </Button>
      </div>
    </div>
  );
};

export default PostCleanStage;

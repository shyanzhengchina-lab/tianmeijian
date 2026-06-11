import React, { useState } from 'react';
import {
  Button, Card, Checkbox, Select, Space, Typography, Tag, Alert,
  Divider, Row, Col, message, Input
} from 'antd';
import { SafetyOutlined, CheckCircleOutlined, EditOutlined } from '@ant-design/icons';
import type { StageExecution } from '../padExecutionData';
import PadCamera, { CapturedPhoto } from '../components/PadCamera';

const { Text } = Typography;
const { Option } = Select;

interface PreCleanStageProps {
  opName: string;
  opCode: string;
  content?: string;
  execution: StageExecution;
  onComplete: (data: Record<string, unknown>) => void;
  onESign: (cb: () => void) => void;
}

const PRE_CLEAN_ITEMS: Record<string, Array<{
  key: string; label: string; method: string; requirePhoto?: boolean; type: 'bool' | 'enum'; options?: string[];
}>> = {
  default: [
    { key: 'surfaceClear', label: '设备台面无上批遗留产品', method: '目视检查，拍照上传', requirePhoto: true, type: 'bool' },
    { key: 'internalClear', label: '设备内部无上批遗留产品', method: '打开防护门目视', type: 'bool' },
    { key: 'safetyDoor', label: '设备急停/安全门完好有效', method: '按压测试', type: 'enum', options: ['正常', '异常'] },
    { key: 'transferDone', label: '上一批产品工序转移单已转移', method: '核对浮漂状态', type: 'enum', options: ['已转移', '未转移'] },
  ],
  'OP-20-WASH1': [
    { key: 'surfaceClear', label: '设备台面无上批遗留产品', method: '目视检查，拍照上传', requirePhoto: true, type: 'bool' },
    { key: 'internalClear', label: '设备内部无上批遗留产品', method: '打开清洗机检查', type: 'bool' },
    { key: 'transferDone', label: '上一批产品工序转移单已转移', method: '核对浮漂状态', type: 'enum', options: ['已转移', '未转移'] },
    { key: 'productMatch', label: '本批产品实物与工序转移单信息一致', method: '核对产品规格、数量', type: 'enum', options: ['一致', '不一致'] },
  ],
  'OP-70-WASH2': [
    { key: 'surfaceClear', label: '设备台面无上批遗留产品', method: '目视检查，拍照上传', requirePhoto: true, type: 'bool' },
    { key: 'internalClear', label: '超声波清洗机内部无残留', method: '目视检查清洗槽', type: 'bool' },
    { key: 'transferDone', label: '上一批产品工序转移单已转移', method: '核对浮漂状态', type: 'enum', options: ['已转移', '未转移'] },
    { key: 'productMatch', label: '本批产品实物与工序转移单信息一致', method: '核对产品规格、数量', type: 'enum', options: ['一致', '不一致'] },
    { key: 'cleanSolution', label: '清洗液浓度/更换日期确认', method: '查看清洗液记录本', type: 'enum', options: ['合格', '需更换'] },
  ],
  // OP-10 机床成型：机床检查 + 冷却液 + 刀具状态
  'OP-10-GRIND': [
    { key: 'surfaceClear', label: '机床台面及内腔无上批遗留产品/切屑', method: '目视检查，拍照上传', requirePhoto: true, type: 'bool' },
    { key: 'coolantCheck', label: '冷却液液位及浓度正常', method: '观察液位计，测量浓度', type: 'enum', options: ['正常', '需补充/更换'] },
    { key: 'toolCheck', label: '刀具状态确认（无崩刃/磨损超限）', method: '目视检查刀具', type: 'enum', options: ['正常', '需更换'] },
    { key: 'safetyDoor', label: '设备急停/安全门完好有效', method: '按压测试', type: 'enum', options: ['正常', '异常'] },
    { key: 'transferDone', label: '上一批产品工序转移单已转移', method: '核对浮漂状态', type: 'enum', options: ['已转移', '未转移'] },
    { key: 'productMatch', label: '本批镍钛丝与工单物料批号一致', method: '核对物料批号标签', type: 'enum', options: ['一致', '不一致'] },
  ] as Array<{ key: string; label: string; method: string; requirePhoto?: boolean; type: 'bool' | 'enum'; options?: string[] }>,
  // OP-30 尾部修整：修整刀具/夹具检查
  'OP-30-TAIL': [
    { key: 'surfaceClear', label: '修整台面无上批遗留产品和切屑', method: '目视检查，拍照上传', requirePhoto: true, type: 'bool' },
    { key: 'toolCheck', label: '修整刀具状态（无崩刃/磨损超限）', method: '目视检查刀具', type: 'enum', options: ['正常', '需更换'] },
    { key: 'fixtureCheck', label: '夹具固定状态正常', method: '手动检查夹具固定', type: 'enum', options: ['正常', '异常'] },
    { key: 'transferDone', label: '上一批产品工序转移单已转移', method: '核对浮漂状态', type: 'enum', options: ['已转移', '未转移'] },
    { key: 'productMatch', label: '本批产品实物与工序转移单信息一致', method: '核对产品规格、数量', type: 'enum', options: ['一致', '不一致'] },
  ] as Array<{ key: string; label: string; method: string; requirePhoto?: boolean; type: 'bool' | 'enum'; options?: string[] }>,
  // OP-50 研磨一：砂轮/研磨液/设备检查
  'OP-50-GRIND1': [
    { key: 'surfaceClear', label: '研磨设备台面无上批遗留产品', method: '目视检查，拍照上传', requirePhoto: true, type: 'bool' },
    { key: 'wheelCheck', label: '砂轮状态正常，无破损/偏心', method: '目视+运行检查', type: 'enum', options: ['正常', '需更换'] },
    { key: 'abrasiveCheck', label: '研磨液浓度在规格范围内', method: '测量研磨液浓度', type: 'enum', options: ['合格', '需调整'] },
    { key: 'safetyDoor', label: '研磨机防护门完好', method: '目视检查', type: 'enum', options: ['正常', '异常'] },
    { key: 'transferDone', label: '上一批产品工序转移单已转移', method: '核对浮漂状态', type: 'enum', options: ['已转移', '未转移'] },
    { key: 'productMatch', label: '本批产品实物与工序转移单信息一致', method: '核对产品规格、数量', type: 'enum', options: ['一致', '不一致'] },
  ] as Array<{ key: string; label: string; method: string; requirePhoto?: boolean; type: 'bool' | 'enum'; options?: string[] }>,
  'OP-100-ASM': [
    { key: 'surfaceClear', label: '工作台面无上批遗留产品和手柄', method: '目视检查，拍照上传', requirePhoto: true, type: 'bool' },
    { key: 'transferDone', label: '上一批产品工序转移单已转移', method: '核对浮漂状态', type: 'enum', options: ['已转移', '未转移'] },
    { key: 'toolReady', label: '组装工具（扭矩扳手等）已准备就绪', method: '目视检查', type: 'bool' },
    { key: 'productMatch', label: '本批产品实物与工序转移单信息一致', method: '核对产品规格、数量', type: 'enum', options: ['一致', '不一致'] },
  ],
  'OP-130-LIMIT': [
    { key: 'surfaceClear', label: '工作台面无上批遗留产品和限位块', method: '目视检查，拍照上传', requirePhoto: true, type: 'bool' },
    { key: 'transferDone', label: '上一批产品工序转移单已转移', method: '核对浮漂状态', type: 'enum', options: ['已转移', '未转移'] },
    { key: 'productMatch', label: '本批产品实物与工序转移单信息一致', method: '核对产品规格、数量', type: 'enum', options: ['一致', '不一致'] },
  ],
  'OP-80-INSPECT1': [
    { key: 'surfaceClear', label: '检验台面无上批遗留产品', method: '目视检查，拍照上传', requirePhoto: true, type: 'bool' },
    { key: 'transferDone', label: '上一批产品工序转移单已转移', method: '核对浮漂状态', type: 'enum', options: ['已转移', '未转移'] },
    { key: 'instrumentReady', label: '检验量具已校准且在有效期内', method: '查看校准标签', type: 'enum', options: ['有效', '已过期'] },
  ],
  'OP-110-RING': [
    { key: 'surfaceClear', label: '检验台面无上批遗留产品', method: '目视检查，拍照上传', requirePhoto: true, type: 'bool' },
    { key: 'transferDone', label: '上一批产品工序转移单已转移', method: '核对浮漂状态', type: 'enum', options: ['已转移', '未转移'] },
    { key: 'ringGaugeReady', label: '环规清洁且无损伤', method: '目视检查环规表面', type: 'enum', options: ['正常', '异常'] },
  ],
  'OP-120-MEAS': [
    { key: 'surfaceClear', label: '测量台面无上批遗留产品', method: '目视检查，拍照上传', requirePhoto: true, type: 'bool' },
    { key: 'transferDone', label: '上一批产品工序转移单已转移', method: '核对浮漂状态', type: 'enum', options: ['已转移', '未转移'] },
    { key: 'measureTool', label: '测量量具校准有效', method: '查看量具校准标签', type: 'enum', options: ['有效', '已过期'] },
  ],
  'OP-140-INSPECT2': [
    { key: 'surfaceClear', label: '检验台面无上批遗留产品', method: '目视检查，拍照上传', requirePhoto: true, type: 'bool' },
    { key: 'transferDone', label: '上一批产品工序转移单已转移', method: '核对浮漂状态', type: 'enum', options: ['已转移', '未转移'] },
    { key: 'instrumentReady', label: '检验设备已开机预热完成', method: '查看设备状态', type: 'enum', options: ['就绪', '未就绪'] },
  ],
  'OP-160-HANDLE': [
    { key: 'surfaceClear', label: '打码台面无上批遗留产品和手柄', method: '目视检查，拍照上传', requirePhoto: true, type: 'bool' },
    { key: 'transferDone', label: '上一批产品工序转移单已转移', method: '核对浮漂状态', type: 'enum', options: ['已转移', '未转移'] },
    { key: 'printReady', label: '打码机已就绪，参数确认', method: '查看打码机状态', type: 'enum', options: ['就绪', '未就绪'] },
  ],
  'OP-170-COLOR': [
    { key: 'surfaceClear', label: '上色台面无上批遗留产品', method: '目视检查，拍照上传', requirePhoto: true, type: 'bool' },
    { key: 'transferDone', label: '上一批产品工序转移单已转移', method: '核对浮漂状态', type: 'enum', options: ['已转移', '未转移'] },
    { key: 'colorReady', label: '涂料/色料状态确认（无沉淀、在效期内）', method: '目视检查涂料', type: 'enum', options: ['合格', '不合格'] },
  ],
};

const PreCleanStage: React.FC<PreCleanStageProps> = ({ opName, opCode, content, execution, onComplete, onESign }) => {
  const items = PRE_CLEAN_ITEMS[opCode] || PRE_CLEAN_ITEMS.default;

  const [checkValues, setCheckValues] = useState<Record<string, string | boolean>>(
    Object.fromEntries(items.map(i => [i.key, i.type === 'bool' ? false : '']))
  );
  const [photos, setPhotos] = useState<CapturedPhoto[]>([]);
  const [conclusion, setConclusion] = useState<'' | 'pass' | 'fail'>('');
  const [signed, setSigned] = useState(false);
  const [operatorNote, setOperatorNote] = useState('');

  const startTime = execution.startTime
    || new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const isCompleted = execution.status === 'completed';

  const photoRequired = items.some(i => i.requirePhoto);

  const allItemsOk = items.every(item => {
    const val = checkValues[item.key];
    if (item.type === 'bool') return val === true;
    if (item.type === 'enum') return val === item.options![0];
    return false;
  });

  const hasAbnormal = items.some(item => {
    const val = checkValues[item.key];
    if (item.type === 'enum') return val !== '' && val !== item.options![0];
    return false;
  });

  const canSubmit = allItemsOk && (!photoRequired || photos.length >= 2) && conclusion === 'pass' && signed;

  const handleSetValue = (key: string, val: string | boolean) => {
    setCheckValues(prev => ({ ...prev, [key]: val }));
  };

  const handleSign = () => {
    onESign(() => { setSigned(true); message.success('电子签名完成'); });
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    onComplete({
      pre_items: checkValues,
      pre_photo: photos.length,
      pre_photos: photos.map(p => p.timestamp),
      pre_result: conclusion,
      pre_start: startTime,
      pre_end: new Date().toLocaleTimeString('zh-CN'),
      pre_operator: '张三(1001)',
      pre_note: operatorNote,
      pre_esig: '张三(1001)',
    });
  };

  if (isCompleted) {
    return (
      <Card style={{ background: '#f6ffed', border: '2px solid #b7eb8f', borderRadius: 10 }}>
        <Space>
          <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 20 }} />
          <Text strong style={{ color: '#52c41a', fontSize: 14 }}>前清场已完成</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>完成时间：{execution.endTime}</Text>
        </Space>
      </Card>
    );
  }

  return (
    <div>
      <Card
        title={
          <Space>
            <SafetyOutlined style={{ color: '#1890ff' }} />
            <span>前清场检查清单</span>
            <Tag color="blue" style={{ fontWeight: 'normal', fontSize: 11 }}>{opName}</Tag>
          </Space>
        }
        extra={<Text type="secondary" style={{ fontSize: 12 }}>开始时间：{startTime}</Text>}
        style={{ marginBottom: 14, borderRadius: 10 }}
      >
        {content && (
          <Alert message={content} type="info" showIcon style={{ marginBottom: 12, fontSize: 12 }} />
        )}

        <Space direction="vertical" style={{ width: '100%' }} size={10}>
          {items.map((item, idx) => {
            const val = checkValues[item.key];
            const isOk = item.type === 'bool' ? val === true : (val !== '' && val === item.options![0]);
            const isAbnorm = item.type === 'enum' && val !== '' && val !== item.options![0];

            return (
              <Card
                key={item.key}
                size="small"
                style={{
                  background: isOk ? '#f6ffed' : isAbnorm ? '#fff2f0' : '#fff',
                  border: isOk ? '1px solid #b7eb8f' : isAbnorm ? '1px solid #ffccc7' : '1px solid #f0f0f0',
                  borderRadius: 8,
                  transition: 'all 0.2s',
                }}
              >
                <Space direction="vertical" style={{ width: '100%' }} size={8}>
                  <Row align="middle" gutter={8}>
                    <Col>
                      {item.type === 'bool' ? (
                        <Checkbox
                          checked={val as boolean}
                          onChange={e => handleSetValue(item.key, e.target.checked)}
                        >
                          <Text strong style={{ fontSize: 13 }}>{idx + 1}. {item.label}</Text>
                        </Checkbox>
                      ) : (
                        <Text strong style={{ fontSize: 13 }}>
                          {isOk ? '☑' : isAbnorm ? '⚠' : '□'} {idx + 1}. {item.label}
                        </Text>
                      )}
                    </Col>
                  </Row>

                  <Text type="secondary" style={{ paddingLeft: 24, fontSize: 12 }}>
                    确认方法：{item.method}
                  </Text>

                  <div style={{ paddingLeft: 24 }}>
                    {item.type === 'enum' && (
                      <Select
                        size="large"
                        style={{ width: 160, fontSize: 14 }}
                        placeholder="请选择"
                        value={(val as string) || undefined}
                        onChange={v => handleSetValue(item.key, v)}
                      >
                        {item.options!.map(opt => (
                          <Option key={opt} value={opt}>
                            <Text style={{ color: opt === item.options![0] ? '#52c41a' : '#ff4d4f' }}>
                              {opt === item.options![0] ? '✓ ' : '✗ '}{opt}
                            </Text>
                          </Option>
                        ))}
                      </Select>
                    )}

                    {/* 拍照上传 — 调用设备摄像头 */}
                    {item.requirePhoto && (
                      <div style={{ marginTop: item.type === 'enum' ? 10 : 0 }}>
                        <PadCamera
                          photos={photos}
                          onChange={setPhotos}
                          minCount={2}
                          maxCount={6}
                          label="拍照上传"
                        />
                      </div>
                    )}

                    {isAbnorm && (
                      <Alert
                        message={`${item.label}状态异常！请停止生产并上报。`}
                        type="error"
                        showIcon
                        style={{ marginTop: 8, fontSize: 12 }}
                      />
                    )}
                  </div>
                </Space>
              </Card>
            );
          })}

          {hasAbnormal && (
            <Alert
              message="存在异常检查项！前清场异常时禁止开始生产，请处理后重新确认。"
              type="error" showIcon
            />
          )}

          <Divider style={{ margin: '8px 0' }} />

          {/* 照片总结、结论、签名 */}
          <Row gutter={16} align="middle">
            {photoRequired && (
              <Col span={7}>
                <Space>
                  <Text strong style={{ fontSize: 13 }}>清场照片：</Text>
                  <Tag color={photos.length >= 2 ? 'success' : 'warning'} style={{ fontSize: 12 }}>
                    {photos.length >= 2 ? `✓ 已拍 ${photos.length} 张` : `⚠ 需≥2张（当前${photos.length}张）`}
                  </Tag>
                </Space>
              </Col>
            )}
            <Col span={8}>
              <Space>
                <Text strong style={{ fontSize: 13 }}>清场结论：</Text>
                <Select
                  size="large"
                  style={{ width: 120 }}
                  placeholder="选择"
                  value={conclusion || undefined}
                  onChange={v => setConclusion(v as 'pass' | 'fail')}
                  disabled={!allItemsOk || hasAbnormal}
                >
                  <Option value="pass"><Text style={{ color: '#52c41a' }}>✓ 合格</Text></Option>
                  <Option value="fail"><Text style={{ color: '#ff4d4f' }}>✗ 不合格</Text></Option>
                </Select>
              </Space>
            </Col>
            <Col span={9}>
              <Space>
                <Text strong style={{ fontSize: 13 }}>电子签名：</Text>
                {signed ? (
                  <Tag color="success" style={{ fontSize: 12, padding: '3px 10px' }}>✓ 张三 已签名</Tag>
                ) : (
                  <Button
                    icon={<EditOutlined />}
                    size="large"
                    style={{ height: 40, fontSize: 14, background: '#722ed1', color: '#fff', border: 'none' }}
                    onClick={handleSign}
                    disabled={conclusion !== 'pass'}
                  >
                    电子签名
                  </Button>
                )}
              </Space>
            </Col>
          </Row>

          <Row>
            <Col span={24}>
              <Space direction="vertical" style={{ width: '100%' }} size={4}>
                <Text style={{ fontSize: 12, color: '#8c8c8c' }}>备注（可选）：</Text>
                <Input
                  placeholder="如有特殊情况请填写备注"
                  value={operatorNote}
                  onChange={e => setOperatorNote(e.target.value)}
                  size="large"
                  style={{ fontSize: 13 }}
                />
              </Space>
            </Col>
          </Row>

          {!canSubmit && !hasAbnormal && (
            <Alert
              message="请完成所有检查项（如需拍照至少2张）、填写清场结论并完成电子签名"
              type="warning" showIcon style={{ fontSize: 12 }}
            />
          )}
        </Space>
      </Card>

      <div style={{ textAlign: 'right' }}>
        <Button
          type="primary"
          size="large"
          disabled={!canSubmit}
          onClick={handleSubmit}
          style={{ height: 52, fontSize: 16, paddingInline: 36, fontWeight: 700 }}
        >
          ✅ 提交前清场
        </Button>
      </div>
    </div>
  );
};

export default PreCleanStage;

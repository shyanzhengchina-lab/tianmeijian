import React, { useState } from 'react';
import {
  Button, Card, Checkbox, Select, Space, Typography, Tag, Alert,
  Divider, Row, Col, message, Input, Badge, Steps
} from 'antd';
import {
  SafetyOutlined, CheckCircleOutlined, EditOutlined,
  ClockCircleOutlined, WarningOutlined, ExclamationCircleOutlined
} from '@ant-design/icons';
import type { StageExecution } from '../padExecutionData';
import PadCamera, { CapturedPhoto } from '../components/PadCamera';

const { Text } = Typography;
const { Option } = Select;

// ── GMP工序：有效期规则（小时） ──────────────────────────────────────
const CLEANUP_VALID_HOURS: Record<string, number> = {
  'OP-GMP-WEIGH': 72, 'OP-GMP-MIX': 72, 'OP-GMP-GRANULATE': 72,
  'OP-GMP-INNERPACK': 72, 'OP-GMP-INNERCLEAN': 72, 'OP-GMP-OUTERPACK': 24,
};

const GMP_OP_CODES = Object.keys(CLEANUP_VALID_HOURS);

// ── 生产前再确认9项清单（适用所有GMP工序） ─────────────────────────
const PRE_CONFIRM_ITEMS = [
  { key: 'pc_wo',       label: '批生产指令已发放并经复核', required: true },
  { key: 'pc_bom',      label: 'BOM配方中各物料已按规定领料/复核', required: true },
  { key: 'pc_equip',    label: '所用设备/仪器已通过维保验证，状态标识"合格"', required: true },
  { key: 'pc_cert',     label: '清场合格证在有效期内，车间已移除上批遗留物', required: true },
  { key: 'pc_env',      label: '洁净室温湿度/压差记录已确认并符合规定', required: true },
  { key: 'pc_ppe',      label: '操作人员着装符合GMP洁净级别要求', required: true },
  { key: 'pc_record',   label: '批记录已打印/调出，首页信息填写正确', required: true },
  { key: 'pc_material', label: '所有物料状态标签为"合格"或"已取样"', required: true },
  { key: 'pc_qapprove', label: '本工序已通过QA开工前审批（或授权豁免）', required: false },
];

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
  // ─── 保健品GMP工序清场条目 ──────────────────────────────────────────
  'OP-GMP-WEIGH': [
    { key: 'surfaceClear', label: '称量间台面无上批遗留物料', method: '目视检查，拍照留存', requirePhoto: true, type: 'bool' },
    { key: 'certValid', label: '清场合格证在有效期内（固体车间≤72h）', method: '查看清场合格证签发时间', type: 'enum', options: ['有效期内', '已过期/无证'] },
    { key: 'balanceCalib', label: '天平/地秤校验合格证在有效期内', method: '查看校验标签', type: 'enum', options: ['有效', '已过期'] },
    { key: 'envCheck', label: '称量间温湿度符合规定（18-26℃，45-65%RH）', method: '查看温湿度计', type: 'enum', options: ['合格', '不合格'] },
    { key: 'productMatch', label: '本批产品批包装指令与实物批号一致', method: '核对批包装指令', type: 'enum', options: ['一致', '不一致'] },
  ] as Array<{ key: string; label: string; method: string; requirePhoto?: boolean; type: 'bool' | 'enum'; options?: string[] }>,
  'OP-GMP-MIX': [
    { key: 'surfaceClear', label: '混合机内壁及外表面无上批遗留物', method: '打开混合机检查内腔，拍照', requirePhoto: true, type: 'bool' },
    { key: 'certValid', label: '清场合格证在有效期内（固体车间≤72h）', method: '查看清场合格证签发时间', type: 'enum', options: ['有效期内', '已过期/无证'] },
    { key: 'equipStatus', label: '三维混合机运行状态正常', method: '空机试运行确认', type: 'enum', options: ['正常', '异常'] },
    { key: 'productMatch', label: '本批投料量与批包装指令一致', method: '核对称量记录单', type: 'enum', options: ['一致', '不一致'] },
  ] as Array<{ key: string; label: string; method: string; requirePhoto?: boolean; type: 'bool' | 'enum'; options?: string[] }>,
  'OP-GMP-GRANULATE': [
    { key: 'surfaceClear', label: '制粒机/干燥机内腔无上批遗留颗粒', method: '打开设备检查，拍照', requirePhoto: true, type: 'bool' },
    { key: 'certValid', label: '清场合格证在有效期内（固体车间≤72h）', method: '查看清场合格证签发时间', type: 'enum', options: ['有效期内', '已过期/无证'] },
    { key: 'sieveCheck', label: '筛网完好无损、规格正确', method: '目视检查筛网', type: 'enum', options: ['正常', '破损/规格不符'] },
    { key: 'productMatch', label: '本批混合物与批记录批号一致', method: '核对批记录', type: 'enum', options: ['一致', '不一致'] },
  ] as Array<{ key: string; label: string; method: string; requirePhoto?: boolean; type: 'bool' | 'enum'; options?: string[] }>,
  'OP-GMP-INNERPACK': [
    { key: 'surfaceClear', label: '内包装线设备及输送带无上批遗留品', method: '目视检查全线，拍照', requirePhoto: true, type: 'bool' },
    { key: 'certValid', label: '清场合格证在有效期内（固体车间≤72h）', method: '查看清场合格证签发时间', type: 'enum', options: ['有效期内', '已过期/无证'] },
    { key: 'printCheck', label: '批号/生产日期/有效期打印参数已确认', method: '打印测试件核对', type: 'enum', options: ['已确认', '未确认'] },
    { key: 'materialCheck', label: '内包材（铝箔/PVC/瓶）批号与包装指令一致', method: '核对包材标签', type: 'enum', options: ['一致', '不一致'] },
  ] as Array<{ key: string; label: string; method: string; requirePhoto?: boolean; type: 'bool' | 'enum'; options?: string[] }>,
  'OP-GMP-INNERCLEAN': [
    { key: 'surfaceClear', label: '内包装线及工作区域清洁完毕', method: '目视检查各区域，拍照', requirePhoto: true, type: 'bool' },
    { key: 'productRemoved', label: '所有成品/在制品已转移或入库', method: '实物清点确认', type: 'enum', options: ['已清空', '仍有遗留'] },
    { key: 'wasteRemoved', label: '废料/不合格品已按规定处置', method: '查看废料袋', type: 'enum', options: ['已处置', '未处置'] },
    { key: 'equipCleaned', label: '设备清洁记录填写完整', method: '查看清洁记录', type: 'enum', options: ['已填写', '未填写'] },
  ] as Array<{ key: string; label: string; method: string; requirePhoto?: boolean; type: 'bool' | 'enum'; options?: string[] }>,
  'OP-GMP-OUTERPACK': [
    { key: 'surfaceClear', label: '外包装区域无上批遗留产品/纸箱', method: '目视检查，拍照', requirePhoto: true, type: 'bool' },
    { key: 'certValid', label: '清场合格证在有效期内（包装区≤24h）', method: '查看清场合格证签发时间', type: 'enum', options: ['有效期内', '已过期/无证'] },
    { key: 'printCheck', label: '外箱批号/生产日期/有效期打印参数已确认', method: '打印测试件核对', type: 'enum', options: ['已确认', '未确认'] },
    { key: 'materialCheck', label: '外包材（纸箱/说明书/封箱带）批号与包装指令一致', method: '核对包材标签', type: 'enum', options: ['一致', '不一致'] },
  ] as Array<{ key: string; label: string; method: string; requirePhoto?: boolean; type: 'bool' | 'enum'; options?: string[] }>,
};

const PreCleanStage: React.FC<PreCleanStageProps> = ({ opName, opCode, content, execution, onComplete, onESign }) => {
  const items = PRE_CLEAN_ITEMS[opCode] || PRE_CLEAN_ITEMS.default;
  const isGmpOp = GMP_OP_CODES.includes(opCode);
  const validHours = CLEANUP_VALID_HOURS[opCode] ?? 72;

  const [checkValues, setCheckValues] = useState<Record<string, string | boolean>>(
    Object.fromEntries(items.map(i => [i.key, i.type === 'bool' ? false : '']))
  );
  const [photos, setPhotos] = useState<CapturedPhoto[]>([]);
  const [conclusion, setConclusion] = useState<'' | 'pass' | 'fail'>('');
  const [signed, setSigned] = useState(false);
  const [operatorNote, setOperatorNote] = useState('');

  // GMP：清场合格证有效期输入
  const [certIssueTime, setCertIssueTime] = useState('');
  const [certExpired, setCertExpired] = useState<boolean | null>(null);

  // GMP：生产前再确认9项清单
  const [preConfirmChecks, setPreConfirmChecks] = useState<Record<string, boolean>>(
    Object.fromEntries(PRE_CONFIRM_ITEMS.map(i => [i.key, false]))
  );

  const handleCertTimeChange = (val: string) => {
    setCertIssueTime(val);
    if (!val) { setCertExpired(null); return; }
    const issued = new Date(val.replace(/\//g, '-'));
    const hoursElapsed = (Date.now() - issued.getTime()) / 3600000;
    setCertExpired(hoursElapsed > validHours);
  };

  const requiredPreConfirm = PRE_CONFIRM_ITEMS.filter(i => i.required);
  const allPreConfirmDone = requiredPreConfirm.every(i => preConfirmChecks[i.key]);

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

  const certOk = !isGmpOp || (certIssueTime !== '' && certExpired === false);

  const canSubmit = allItemsOk && (!photoRequired || photos.length >= 2)
    && conclusion === 'pass' && signed
    && certOk
    && (!isGmpOp || allPreConfirmDone);

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
      // GMP专属
      cert_issue_time: certIssueTime,
      cert_valid_hours: validHours,
      cert_expired: certExpired,
      pre_confirm_checks: preConfirmChecks,
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

          {/* ── GMP专属：清场合格证有效期验证 ── */}
          {isGmpOp && (
            <Card
              size="small"
              title={
                <Space>
                  <ClockCircleOutlined style={{ color: certExpired === false ? '#52c41a' : certExpired === true ? '#ff4d4f' : '#faad14' }} />
                  <Text strong style={{ fontSize: 13 }}>清场合格证有效期验证</Text>
                  <Tag color={certExpired === false ? 'success' : certExpired === true ? 'error' : 'warning'} style={{ fontSize: 11 }}>
                    {opCode === 'OP-GMP-OUTERPACK' ? '包装区≤24h' : '固体车间≤72h'}
                  </Tag>
                </Space>
              }
              style={{
                borderRadius: 8,
                border: certExpired === false ? '1px solid #b7eb8f' : certExpired === true ? '2px solid #ff4d4f' : '1px solid #ffe58f',
                background: certExpired === false ? '#f6ffed' : certExpired === true ? '#fff2f0' : '#fffbe6',
              }}
            >
              <Space direction="vertical" style={{ width: '100%' }} size={8}>
                <Row gutter={16} align="middle">
                  <Col span={14}>
                    <Space direction="vertical" size={4} style={{ width: '100%' }}>
                      <Text style={{ fontSize: 12 }}>清场合格证签发时间：</Text>
                      <Input
                        size="large"
                        placeholder="例: 2026-06-13 08:30"
                        value={certIssueTime}
                        onChange={e => handleCertTimeChange(e.target.value)}
                        style={{ fontSize: 14, fontFamily: 'monospace' }}
                        prefix={<ClockCircleOutlined style={{ color: '#8c8c8c' }} />}
                      />
                      <Text type="secondary" style={{ fontSize: 11 }}>格式：YYYY-MM-DD HH:mm</Text>
                    </Space>
                  </Col>
                  <Col span={10}>
                    {certExpired === false && (
                      <Alert
                        message={<Text style={{ fontSize: 12 }}>✓ 证件有效，距过期还有{Math.floor(validHours - (Date.now() - new Date(certIssueTime.replace(/\//g,'-')).getTime())/3600000)}小时</Text>}
                        type="success" style={{ padding: '4px 10px' }}
                      />
                    )}
                    {certExpired === true && (
                      <Alert
                        message={<Text style={{ fontSize: 12 }}>✗ 清场合格证已超期！禁止开工，需重新清场</Text>}
                        type="error" style={{ padding: '4px 10px' }}
                      />
                    )}
                    {certExpired === null && certIssueTime === '' && (
                      <Alert
                        message={<Text style={{ fontSize: 12 }}>⚠ 请输入清场合格证签发时间</Text>}
                        type="warning" style={{ padding: '4px 10px' }}
                      />
                    )}
                  </Col>
                </Row>
              </Space>
            </Card>
          )}

          {/* ── GMP专属：生产前再确认9项清单 ── */}
          {isGmpOp && (
            <Card
              size="small"
              title={
                <Space>
                  <CheckCircleOutlined style={{ color: allPreConfirmDone ? '#52c41a' : '#faad14' }} />
                  <Text strong style={{ fontSize: 13 }}>开工前再确认清单（PRD §7）</Text>
                  <Tag color={allPreConfirmDone ? 'success' : 'warning'} style={{ fontSize: 11 }}>
                    {PRE_CONFIRM_ITEMS.filter(i => i.required && preConfirmChecks[i.key]).length}/{requiredPreConfirm.length} 必填项已确认
                  </Tag>
                </Space>
              }
              style={{
                borderRadius: 8,
                border: allPreConfirmDone ? '1px solid #b7eb8f' : '1px solid #ffe58f',
                background: allPreConfirmDone ? '#f6ffed' : '#fffbe6',
              }}
            >
              {!allPreConfirmDone && (
                <Alert
                  message="⚠ 所有必填项（★）未全部确认时禁止开始生产！"
                  type="warning" showIcon
                  style={{ marginBottom: 10, padding: '4px 10px', fontSize: 12 }}
                />
              )}
              <Space direction="vertical" style={{ width: '100%' }} size={6}>
                {PRE_CONFIRM_ITEMS.map((item, idx) => (
                  <div
                    key={item.key}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '7px 12px', borderRadius: 6,
                      background: preConfirmChecks[item.key] ? '#f6ffed' : '#fff',
                      border: preConfirmChecks[item.key] ? '1px solid #b7eb8f' : '1px solid #f0f0f0',
                      transition: 'all 0.2s',
                    }}
                  >
                    <Checkbox
                      checked={preConfirmChecks[item.key]}
                      onChange={e => setPreConfirmChecks(prev => ({ ...prev, [item.key]: e.target.checked }))}
                    >
                      <Text style={{ fontSize: 13 }}>
                        {idx + 1}. {item.label}
                        {item.required && <Text style={{ color: '#ff4d4f', marginLeft: 4, fontSize: 12 }}>★</Text>}
                      </Text>
                    </Checkbox>
                  </div>
                ))}
              </Space>
            </Card>
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
              message={
                isGmpOp
                  ? "请完成：①所有清场检查项（≥2张照片）②清场合格证有效期验证③开工前再确认（必填★项）④清场结论⑤电子签名"
                  : "请完成所有检查项（如需拍照至少2张）、填写清场结论并完成电子签名"
              }
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

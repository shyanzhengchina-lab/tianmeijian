# FloatTicket模块技术实现指南

## 🏗️ 架构设计

### 整体架构
```
┌─────────────────────────────────────────────────────────────┐
│                     Presentation Layer                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │ FloatTicket  │  │ FloatTicket  │  │ FloatTicket  │        │
│  │    List      │  │    Detail    │  │    Form      │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Business Logic Layer                       │
│  ┌────────────────────────────────────────────────────────┐  │
│  │           FloatTicket Store (Zustand)                   │  │
│  │  - State Management                                     │  │
│  │  - Business Logic                                       │  │
│  │  - Data Caching                                         │  │
│  └────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Data Access Layer                        │
│  ┌────────────────────────────────────────────────────────┐  │
│  │           FloatTicket API Service                       │  │
│  │  - HTTP Requests                                        │  │
│  │  - Data Transformation                                  │  │
│  │  - Error Handling                                       │  │
│  └────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Backend API                             │
│           /float-ticket/* endpoints                         │
└─────────────────────────────────────────────────────────────┘
```

### 组件层次结构
```
FloatTicketModule/
├── components/
│   ├── FloatTicketList/          # 主列表组件
│   │   ├── SearchForm            # 搜索表单
│   │   ├── ActionBar             # 操作栏
│   │   ├── DataTable             # 数据表格
│   │   └── BatchActions          # 批量操作
│   ├── FloatTicketDetail/        # 详情组件
│   │   ├── BasicInfo             # 基本信息
│   │   ├── ProcessProgress       # 工序进度
│   │   ├── MaterialUsage         # 物料使用
│   │   ├── QcHistory             # 质检历史
│   │   └── TransferTimeline      # 流转轨迹
│   ├── FloatTicketForm/          # 表单组件
│   │   ├── BasicInfoForm         # 基本信息表单
│   │   ├── ProductInfoForm       # 产品信息表单
│   │   └── ProcessInfoForm       # 工序信息表单
│   ├── FloatTicketQcForm/        # 质检表单（新增）
│   ├── StepRecordList/           # 工序记录列表（新增）
│   ├── StepRecordForm/           # 工序记录表单（新增）
│   ├── MaterialUsageList/        # 物料使用列表（新增）
│   ├── MaterialUsageForm/        # 物料使用表单（新增）
│   ├── TransferTimeline/         # 流转轨迹（新增）
│   ├── BatchActionConfirm/       # 批量操作确认（新增）
│   ├── FloatTicketPrintPreview/  # 浮票打印预览（新增）
│   ├── LabelPrintPreview/        # 标签打印预览（新增）
│   ├── ImportTemplateDownload/   # 导入模板（新增）
│   ├── ImportPreview/            # 导入预览（新增）
│   ├── ExportConfig/             # 导出配置（新增）
│   └── StatisticsPanel/          # 统计面板（新增）
├── store/
│   └── index.ts                  # Zustand Store
├── api/
│   └── index.ts                  # API Service
├── types/
│   └── index.ts                  # TypeScript Types
└── utils/
    ├── validators.ts             # 表单验证器
    ├── formatters.ts             # 数据格式化
    └── constants.ts              # 常量定义
```

---

## 💻 核心组件实现示例

### 1. 质检表单组件 (FloatTicketQcForm.tsx)

```typescript
/**
 * 浮票质检表单组件
 * 支持质检结果录入、抽样数量管理、质检详情描述
 */
import React, { useEffect } from 'react';
import { Form, Select, InputNumber, Input, DatePicker, Row, Col, Card, message } from 'antd';
import { SafetyOutlined, CheckCircleOutlined, CloseCircleOutlined, WarningOutlined } from '@ant-design/icons';
import type { FloatTicket, QcRecord } from '../types';

const { Option } = Select;
const { TextArea } = Input;

interface FloatTicketQcFormProps {
  floatTicket: FloatTicket;
  onFinish: (values: any) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

const QC_RESULT_OPTIONS = [
  { value: 'PASS', label: '合格', color: '#52c41a', icon: <CheckCircleOutlined /> },
  { value: 'FAIL', label: '不合格', color: '#ff4d4f', icon: <CloseCircleOutlined /> },
  { value: 'CONDITIONAL', label: '有条件', color: '#faad14', icon: <WarningOutlined /> },
];

export const FloatTicketQcForm: React.FC<FloatTicketQcFormProps> = ({
  floatTicket,
  onFinish,
  onCancel,
  loading = false,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    form.setFieldsValue({
      ticketId: floatTicket.id,
      ticketNo: floatTicket.ticketNo,
      planQty: floatTicket.planQty,
      actualQty: floatTicket.actualQty,
    });
  }, [floatTicket, form]);

  const handleSubmit = async (values: any) => {
    try {
      await onFinish(values);
      message.success('质检提交成功');
    } catch (error) {
      message.error('质检提交失败');
      throw error;
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={{
        result: 'PASS',
        sampleQty: Math.min(10, Math.ceil(floatTicket.actualQty * 0.1)),
      }}
    >
      {/* 质检基本信息 */}
      <Card title="质检信息" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item label="浮票号" name="ticketNo">
              <Input disabled />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="计划数量" name="planQty">
              <InputNumber disabled style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="实际数量" name="actualQty">
              <InputNumber disabled style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="检验员"
              name="inspector"
              rules={[{ required: true, message: '请输入检验员' }]}
            >
              <Input placeholder="请输入检验员姓名" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="检验时间"
              name="inspectionTime"
              rules={[{ required: true, message: '请选择检验时间' }]}
            >
              <DatePicker
                showTime
                style={{ width: '100%' }}
                placeholder="请选择检验时间"
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="质检方案"
              name="qcSchemeId"
              rules={[{ required: true, message: '请选择质检方案' }]}
            >
              <Select placeholder="请选择质检方案">
                <Option value="SCHEME001">常规质检方案</Option>
                <Option value="SCHEME002">严格质检方案</Option>
                <Option value="SCHEME003">快速质检方案</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
      </Card>

      {/* 质检结果 */}
      <Card title="质检结果" style={{ marginBottom: 16 }}>
        <Form.Item
          label="质检结果"
          name="result"
          rules={[{ required: true, message: '请选择质检结果' }]}
        >
          <Select placeholder="请选择质检结果" size="large">
            {QC_RESULT_OPTIONS.map(option => (
              <Option key={option.value} value={option.value}>
                <Space>
                  <span style={{ color: option.color }}>{option.icon}</span>
                  <span>{option.label}</span>
                </Space>
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="抽样数量"
              name="sampleQty"
              rules={[
                { required: true, message: '请输入抽样数量' },
                { type: 'number', min: 1, message: '抽样数量必须大于0' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    const actualQty = getFieldValue('actualQty');
                    if (value > actualQty) {
                      return Promise.reject(new Error('抽样数量不能超过实际数量'));
                    }
                    return Promise.resolve();
                  },
                }),
              ]}
            >
              <InputNumber
                min={1}
                max={floatTicket.actualQty}
                style={{ width: '100%' }}
                placeholder="请输入抽样数量"
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="合格数量"
              name="qualifiedQty"
              dependencies={['sampleQty']}
              rules={[
                { required: true, message: '请输入合格数量' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    const sampleQty = getFieldValue('sampleQty');
                    if (value > sampleQty) {
                      return Promise.reject(new Error('合格数量不能超过抽样数量'));
                    }
                    return Promise.resolve();
                  },
                }),
              ]}
            >
              <InputNumber
                min={0}
                style={{ width: '100%' }}
                placeholder="请输入合格数量"
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="不合格数量"
              name="unqualifiedQty"
              dependencies={['sampleQty', 'qualifiedQty']}
            >
              <InputNumber
                disabled
                style={{ width: '100%' }}
                placeholder="自动计算"
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          label="质检详情"
          name="resultDetails"
          rules={[{ required: true, message: '请输入质检详情' }]}
        >
          <TextArea
            rows={4}
            placeholder="请详细描述质检过程和结果"
            maxLength={1000}
            showCount
          />
        </Form.Item>

        <Form.Item
          label="备注"
          name="remark"
        >
          <TextArea
            rows={2}
            placeholder="请输入备注信息（可选）"
            maxLength={500}
            showCount
          />
        </Form.Item>
      </Card>

      {/* 操作按钮 */}
      <Row gutter={16} justify="end">
        <Col>
          <Button onClick={onCancel}>
            取消
          </Button>
        </Col>
        <Col>
          <Button type="primary" htmlType="submit" loading={loading} icon={<SafetyOutlined />}>
            提交质检
          </Button>
        </Col>
      </Row>
    </Form>
  );
};

export default FloatTicketQcForm;
```

### 2. 工序记录列表组件 (StepRecordList.tsx)

```typescript
/**
 * 工序执行记录列表组件
 * 展示浮票的工序执行情况，支持工序完成操作
 */
import React, { useEffect, useState } from 'react';
import { Table, Tag, Button, Space, Progress, Modal, InputNumber, message } from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  PlayCircleOutlined,
  ToolOutlined,
  UserOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import type { FloatTicketStepRecord } from '../types';

interface StepRecordListProps {
  ticketId: string;
  stepRecords: FloatTicketStepRecord[];
  loading?: boolean;
  onCompleteStep?: (stepCode: string, outputQty: number, qualifiedQty: number) => Promise<void>;
  onEditStep?: (record: FloatTicketStepRecord) => void;
}

const STEP_STATUS_CONFIG = {
  'PENDING': { color: 'default', icon: <ClockCircleOutlined />, label: '待执行' },
  'RUNNING': { color: 'processing', icon: <PlayCircleOutlined />, label: '执行中' },
  'COMPLETED': { color: 'success', icon: <CheckCircleOutlined />, label: '已完成' },
};

export const StepRecordList: React.FC<StepRecordListProps> = ({
  ticketId,
  stepRecords,
  loading = false,
  onCompleteStep,
  onEditStep,
}) => {
  const [completeModalVisible, setCompleteModalVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState<FloatTicketStepRecord | null>(null);
  const [formValues, setFormValues] = useState({ outputQty: 0, qualifiedQty: 0 });

  const handleCompleteClick = (record: FloatTicketStepRecord) => {
    setCurrentStep(record);
    setFormValues({
      outputQty: record.inputQty,
      qualifiedQty: record.inputQty,
    });
    setCompleteModalVisible(true);
  };

  const handleCompleteConfirm = async () => {
    if (!currentStep || !onCompleteStep) return;

    try {
      await onCompleteStep(
        currentStep.stepCode,
        formValues.outputQty,
        formValues.qualifiedQty
      );
      message.success('工序完成成功');
      setCompleteModalVisible(false);
    } catch (error) {
      message.error('工序完成失败');
    }
  };

  const columns = [
    {
      title: '工序编码',
      dataIndex: 'stepCode',
      width: 120,
      fixed: 'left' as const,
    },
    {
      title: '工序名称',
      dataIndex: 'stepName',
      width: 150,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      align: 'center' as const,
      render: (status: string) => {
        const config = STEP_STATUS_CONFIG[status as keyof typeof STEP_STATUS_CONFIG];
        return (
          <Tag color={config.color} icon={config.icon}>
            {config.label}
          </Tag>
        );
      },
    },
    {
      title: '投入数量',
      dataIndex: 'inputQty',
      width: 100,
      align: 'right' as const,
      render: (qty: number) => qty.toLocaleString(),
    },
    {
      title: '产出数量',
      dataIndex: 'outputQty',
      width: 100,
      align: 'right' as const,
      render: (qty: number) => qty?.toLocaleString() || '-',
    },
    {
      title: '合格数量',
      dataIndex: 'qualifiedQty',
      width: 100,
      align: 'right' as const,
      render: (qty: number) => qty?.toLocaleString() || '-',
    },
    {
      title: '合格率',
      width: 120,
      align: 'center' as const,
      render: (_: any, record: FloatTicketStepRecord) => {
        if (!record.outputQty || record.outputQty === 0) return '-';
        const rate = ((record.qualifiedQty || 0) / record.outputQty * 100).toFixed(1);
        const percent = parseFloat(rate);
        return (
          <Progress
            percent={percent}
            size="small"
            status={percent >= 95 ? 'success' : percent >= 90 ? 'active' : 'exception'}
            format={() => `${rate}%`}
          />
        );
      },
    },
    {
      title: '操作员',
      dataIndex: 'operator',
      width: 100,
      render: (operator: string) => (
        <Space>
          <UserOutlined />
          {operator || '-'}
        </Space>
      ),
    },
    {
      title: '开始时间',
      dataIndex: 'startTime',
      width: 160,
      render: (time: string) => time || '-',
    },
    {
      title: '结束时间',
      dataIndex: 'endTime',
      width: 160,
      render: (time: string) => time || '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right' as const,
      align: 'center' as const,
      render: (_: any, record: FloatTicketStepRecord) => (
        <Space size="small">
          {record.status === 'RUNNING' && onCompleteStep && (
            <Button
              type="link"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => handleCompleteClick(record)}
            >
              完成
            </Button>
          )}
          {record.status === 'COMPLETED' && onEditStep && (
            <Button
              type="link"
              size="small"
              onClick={() => onEditStep(record)}
            >
              查看
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <>
      <Table
        columns={columns}
        dataSource={stepRecords}
        rowKey="id"
        loading={loading}
        pagination={false}
        scroll={{ x: 1400 }}
        size="middle"
      />

      {/* 工序完成确认对话框 */}
      <Modal
        title="完成工序确认"
        open={completeModalVisible}
        onOk={handleCompleteConfirm}
        onCancel={() => setCompleteModalVisible(false)}
        okText="确认完成"
        cancelText="取消"
      >
        {currentStep && (
          <div>
            <p><strong>工序：</strong>{currentStep.stepName} ({currentStep.stepCode})</p>
            <p><strong>投入数量：</strong>{currentStep.inputQty.toLocaleString()}</p>

            <div style={{ marginTop: 16 }}>
              <label style={{ display: 'block', marginBottom: 8 }}>
                <strong>产出数量：</strong>
              </label>
              <InputNumber
                min={0}
                max={currentStep.inputQty}
                value={formValues.outputQty}
                onChange={(value) => setFormValues({ ...formValues, outputQty: value || 0 })}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ marginTop: 16 }}>
              <label style={{ display: 'block', marginBottom: 8 }}>
                <strong>合格数量：</strong>
              </label>
              <InputNumber
                min={0}
                max={formValues.outputQty}
                value={formValues.qualifiedQty}
                onChange={(value) => setFormValues({ ...formValues, qualifiedQty: value || 0 })}
                style={{ width: '100%' }}
              />
            </div>

            {formValues.outputQty > 0 && (
              <div style={{ marginTop: 16 }}>
                <p>
                  <strong>预计合格率：</strong>
                  {((formValues.qualifiedQty / formValues.outputQty) * 100).toFixed(1)}%
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
};

export default StepRecordList;
```

### 3. 流转轨迹组件 (TransferTimeline.tsx)

```typescript
/**
 * 流转轨迹时间线组件
 * 展示浮票在工作中心和操作员之间的流转历史
 */
import React from 'react';
import { Timeline, Tag, Space, Card, Empty } from 'antd';
import {
  HistoryOutlined,
  UserOutlined,
  ApartmentOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  SyncOutlined,
} from '@ant-design/icons';

interface TransferRecord {
  id: string;
  time: string;
  workcenter: string;
  operator: string;
  action: string;
  remark?: string;
}

interface TransferTimelineProps {
  transferHistory: TransferRecord[];
  loading?: boolean;
}

const ACTION_CONFIG = {
  'CREATE': { color: 'blue', icon: <CheckCircleOutlined />, label: '创建' },
  'RELEASE': { color: 'green', icon: <CheckCircleOutlined />, label: '发布' },
  'START': { color: 'cyan', icon: <PlayCircleOutlined />, label: '开始' },
  'TRANSFER': { color: 'orange', icon: <SyncOutlined />, label: '流转' },
  'COMPLETE': { color: 'green', icon: <CheckCircleOutlined />, label: '完成' },
  'CANCEL': { color: 'red', icon: <CloseCircleOutlined />, label: '取消' },
};

export const TransferTimeline: React.FC<TransferTimelineProps> = ({
  transferHistory,
  loading = false,
}) => {
  if (loading) {
    return <Card loading={loading} />;
  }

  if (!transferHistory || transferHistory.length === 0) {
    return (
      <Card>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="暂无流转记录"
        />
      </Card>
    );
  }

  const timelineItems = transferHistory.map((record, index) => {
    const config = ACTION_CONFIG[record.action as keyof typeof ACTION_CONFIG] || {
      color: 'default',
      icon: <ClockCircleOutlined />,
      label: record.action,
    };

    return {
      color: config.color,
      dot: config.icon,
      children: (
        <div>
          <div style={{ marginBottom: 8 }}>
            <Space>
              <Tag color={config.color} icon={config.icon}>
                {config.label}
              </Tag>
              <span style={{ color: '#666', fontSize: 12 }}>
                <CalendarOutlined /> {record.time}
              </span>
            </Space>
          </div>

          <div style={{ marginBottom: 4 }}>
            <Space size="large">
              <span>
                <ApartmentOutlined style={{ color: '#1677ff' }} />
                <strong> 工作中心：</strong>{record.workcenter}
              </span>
              <span>
                <UserOutlined style={{ color: '#52c41a' }} />
                <strong> 操作员：</strong>{record.operator}
              </span>
            </Space>
          </div>

          {record.remark && (
            <div style={{ color: '#666', fontSize: 13, marginTop: 4 }}>
              <strong>备注：</strong>{record.remark}
            </div>
          )}
        </div>
      ),
    };
  });

  return (
    <Card
      title={
        <Space>
          <HistoryOutlined style={{ color: '#1677ff' }} />
          <span>流转轨迹</span>
        </Space>
      }
    >
      <Timeline items={timelineItems} />
    </Card>
  );
};

export default TransferTimeline;
```

### 4. 性能优化 - 虚拟滚动表格

```typescript
/**
 * 虚拟滚动数据表格组件
 * 使用react-window实现大数据量列表的高性能渲染
 */
import React, { useMemo, useRef } from 'react';
import { FixedSizeList as List, ListChildComponentProps } from 'react-window';
import { Table } from 'antd';

interface VirtualDataTableProps<T> {
  data: T[];
  columns: any[];
  rowKey: string | ((record: T) => string);
  height: number;
  itemSize: number;
}

const ROW_HEIGHT = 54; // 每行高度

export const VirtualDataTable = <T extends Record<string, any>>({
  data,
  columns,
  rowKey,
  height = 600,
  itemSize = ROW_HEIGHT,
}: VirtualDataTableProps<T>) => {
  const listRef = useRef<List>(null);

  // 计算每列宽度
  const columnWidths = useMemo(() => {
    const totalWidth = columns.reduce((sum, col) => sum + (col.width || 150), 0);
    return columns.map(col => ({
      ...col,
      width: col.width || (totalWidth / columns.length),
    }));
  }, [columns]);

  // 渲染单行
  const Row = ({ index, style }: ListChildComponentProps) => {
    const record = data[index];
    const key = typeof rowKey === 'function' ? rowKey(record) : record[rowKey];

    return (
      <div style={style} className="virtual-row">
        <div className="virtual-row-content">
          {columnWidths.map((col, colIndex) => (
            <div
              key={`${key}-${colIndex}`}
              className="virtual-cell"
              style={{ width: col.width }}
            >
              {col.render ? col.render(record[col.dataIndex], record, index) : record[col.dataIndex]}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 渲染表头
  const renderHeader = () => (
    <div className="virtual-header" style={{ display: 'flex' }}>
      {columnWidths.map((col, index) => (
        <div
          key={index}
          className="virtual-header-cell"
          style={{ width: col.width }}
        >
          {col.title}
        </div>
      ))}
    </div>
  );

  return (
    <div className="virtual-table-container">
      {renderHeader()}
      <List
        ref={listRef}
        height={height}
        itemCount={data.length}
        itemSize={itemSize}
        width="100%"
        itemData={data}
      >
        {Row}
      </List>
    </div>
  );
};

export default VirtualDataTable;
```

### 5. Zustand Store 优化示例

```typescript
/**
 * 优化后的FloatTicket Store
 * 使用选择器模式避免不必要的重渲染
 */
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { shallow } from 'zustand/shallow';

interface FloatTicketStore {
  // State
  floatTickets: FloatTicket[];
  selectedIds: string[];
  loading: boolean;
  error: string | null;

  // Actions
  loadFloatTickets: () => Promise<void>;
  selectFloatTicket: (id: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
}

// 创建Store
export const useFloatTicketStore = create<FloatTicketStore>()(
  immer((set, get) => ({
    // 初始状态
    floatTickets: [],
    selectedIds: [],
    loading: false,
    error: null,

    // Actions
    loadFloatTickets: async () => {
      set({ loading: true, error: null });
      try {
        const result = await floatTicketApi.getFloatTickets();
        set({ floatTickets: result.list, loading: false });
      } catch (error: any) {
        set({ error: error?.message, loading: false });
      }
    },

    selectFloatTicket: (id: string) => {
      set(state => {
        const index = state.selectedIds.indexOf(id);
        if (index === -1) {
          state.selectedIds.push(id);
        } else {
          state.selectedIds.splice(index, 1);
        }
      });
    },

    selectAll: () => {
      set(state => {
        state.selectedIds = state.floatTickets.map(ft => ft.id);
      });
    },

    clearSelection: () => {
      set({ selectedIds: [] });
    },
  }))
);

// 选择器 - 避免不必要的重渲染
export const useFloatTickets = () =>
  useFloatTicketStore(state => state.floatTickets, shallow);

export const useSelectedFloatTickets = () =>
  useFloatTicketStore(state => {
    const { floatTickets, selectedIds } = state;
    return floatTickets.filter(ft => selectedIds.includes(ft.id));
  }, shallow);

export const useFloatTicketActions = () =>
  useFloatTicketStore(state => ({
    loadFloatTickets: state.loadFloatTickets,
    selectFloatTicket: state.selectFloatTicket,
    selectAll: state.selectAll,
    clearSelection: state.clearSelection,
  }), shallow);
```

---

## 🎨 样式规范

### 颜色系统
```css
:root {
  /* 品牌色 */
  --color-primary: #1677ff;
  --color-success: #52c41a;
  --color-warning: #faad14;
  --color-error: #ff4d4f;
  --color-info: #1677ff;

  /* 中性色 */
  --color-text-primary: #262626;
  --color-text-secondary: #595959;
  --color-text-tertiary: #8c8c8c;
  --color-text-quaternary: #bfbfbf;

  /* 背景色 */
  --color-bg-primary: #ffffff;
  --color-bg-secondary: #f5f5f5;
  --color-bg-tertiary: #fafafa;

  /* 边框色 */
  --color-border-primary: #d9d9d9;
  --color-border-secondary: #f0f0f0;

  /* 间距 */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  --spacing-xxl: 48px;

  /* 圆角 */
  --border-radius-sm: 2px;
  --border-radius-md: 4px;
  --border-radius-lg: 8px;
  --border-radius-xl: 12px;

  /* 阴影 */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
}
```

### 组件样式示例
```css
/* 虚拟表格样式 */
.virtual-table-container {
  border: 1px solid var(--color-border-primary);
  border-radius: var(--border-radius-md);
  overflow: hidden;
}

.virtual-header {
  display: flex;
  background: var(--color-bg-tertiary);
  border-bottom: 1px solid var(--color-border-primary);
  font-weight: 500;
}

.virtual-header-cell {
  padding: var(--spacing-md);
  border-right: 1px solid var(--color-border-secondary);
}

.virtual-row {
  border-bottom: 1px solid var(--color-border-secondary);
}

.virtual-row:hover {
  background: var(--color-bg-secondary);
}

.virtual-row-content {
  display: flex;
  height: 100%;
}

.virtual-cell {
  padding: var(--spacing-md);
  border-right: 1px solid var(--color-border-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 统计卡片样式 */
.statistics-card {
  background: var(--color-bg-primary);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
  transition: all 0.3s ease;
}

.statistics-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.statistic-value {
  font-size: 28px;
  font-weight: 600;
  color: var(--color-primary);
  margin: var(--spacing-sm) 0;
}

.statistic-label {
  font-size: 14px;
  color: var(--color-text-secondary);
}

/* 时间线样式 */
.transfer-timeline {
  padding: var(--spacing-lg);
}

.timeline-item {
  position: relative;
  padding-left: var(--spacing-xl);
  margin-bottom: var(--spacing-lg);
}

.timeline-item::before {
  content: '';
  position: absolute;
  left: 6px;
  top: 24px;
  bottom: -24px;
  width: 2px;
  background: var(--color-border-secondary);
}

.timeline-item:last-child::before {
  display: none;
}

.timeline-dot {
  position: absolute;
  left: 0;
  top: 0;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--color-primary);
  border: 2px solid var(--color-bg-primary);
  box-shadow: 0 0 0 2px var(--color-primary);
}
```

---

## 🔧 工具函数

### 表单验证器 (validators.ts)
```typescript
/**
 * 表单验证器
 */
import { Form } from 'antd';

// 浮票号验证
export const validateTicketNo = async (_: any, value: string) => {
  if (!value) {
    return Promise.reject(new Error('请输入浮票号'));
  }
  if (!/^FT-\d{4,}$/.test(value)) {
    return Promise.reject(new Error('浮票号格式不正确，应为FT-开头加数字'));
  }
  return Promise.resolve();
};

// 批号验证
export const validateBatchNo = async (_: any, value: string) => {
  if (!value) {
    return Promise.reject(new Error('请输入批号'));
  }
  if (!/^\d{10,}$/.test(value)) {
    return Promise.reject(new Error('批号格式不正确，应为10位以上数字'));
  }
  return Promise.resolve();
};

// 数量验证
export const validateQuantity = (min: number = 1, max?: number) => {
  return async (_: any, value: number) => {
    if (value === undefined || value === null) {
      return Promise.reject(new Error('请输入数量'));
    }
    if (value < min) {
      return Promise.reject(new Error(`数量不能小于${min}`));
    }
    if (max !== undefined && value > max) {
      return Promise.reject(new Error(`数量不能大于${max}`));
    }
    return Promise.resolve();
  };
};

// 合格率验证
export const validateQualifiedRate = async (_: any, value: number) => {
  if (value === undefined || value === null) {
    return Promise.reject(new Error('请输入合格数量'));
  }
  if (value < 0 || value > 100) {
    return Promise.reject(new Error('合格率必须在0-100之间'));
  }
  return Promise.resolve();
};
```

### 数据格式化器 (formatters.ts)
```typescript
/**
 * 数据格式化器
 */
import dayjs from 'dayjs';

// 格式化日期时间
export const formatDateTime = (date: string | Date, format = 'YYYY-MM-DD HH:mm:ss') => {
  if (!date) return '-';
  return dayjs(date).format(format);
};

// 格式化日期
export const formatDate = (date: string | Date) => {
  return formatDateTime(date, 'YYYY-MM-DD');
};

// 格式化时间
export const formatTime = (date: string | Date) => {
  return formatDateTime(date, 'HH:mm:ss');
};

// 格式化数量
export const formatQuantity = (qty: number) => {
  if (qty === undefined || qty === null) return '-';
  return qty.toLocaleString();
};

// 格式化百分比
export const formatPercent = (value: number, decimals = 1) => {
  if (value === undefined || value === null) return '-';
  return `${value.toFixed(decimals)}%`;
};

// 格式化状态
export const formatStatus = (status: string, statusMap: Record<string, any>) => {
  const config = statusMap[status];
  if (!config) return status;
  return config.label || status;
};

// 格式化文件大小
export const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
};

// 截断文本
export const truncateText = (text: string, maxLength: number) => {
  if (!text || text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};
```

---

## 📊 性能监控

### 性能监控组件
```typescript
/**
 * 性能监控组件
 * 监控页面加载时间、渲染性能等
 */
import React, { useEffect, useState } from 'react';
import { Card, Statistic, Row, Col } from 'antd';
import {
  ClockCircleOutlined,
  DashboardOutlined,
  ThunderboltOutlined,
  DatabaseOutlined,
} from '@ant-design/icons';

interface PerformanceMetrics {
  pageLoadTime: number;
  renderTime: number;
  memoryUsage: number;
  apiResponseTime: number;
}

export const PerformanceMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    pageLoadTime: 0,
    renderTime: 0,
    memoryUsage: 0,
    apiResponseTime: 0,
  });

  useEffect(() => {
    // 监控页面加载时间
    const pageLoadTime = performance.now();

    // 监控内存使用
    const checkMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        setMetrics(prev => ({
          ...prev,
          memoryUsage: memory.usedJSHeapSize / 1024 / 1024, // MB
        }));
      }
    };

    // 定期检查内存
    const memoryInterval = setInterval(checkMemory, 5000);

    // 监控API响应时间
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const start = performance.now();
      const response = await originalFetch(...args);
      const end = performance.now();
      setMetrics(prev => ({
        ...prev,
        apiResponseTime: end - start,
      }));
      return response;
    };

    // 设置页面加载时间
    setMetrics(prev => ({
      ...prev,
      pageLoadTime: pageLoadTime,
    }));

    return () => {
      clearInterval(memoryInterval);
      window.fetch = originalFetch;
    };
  }, []);

  return (
    <Card title="性能监控" size="small">
      <Row gutter={16}>
        <Col span={6}>
          <Statistic
            title="页面加载时间"
            value={metrics.pageLoadTime.toFixed(0)}
            suffix="ms"
            prefix={<ClockCircleOutlined />}
            valueStyle={{ color: '#1677ff' }}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="内存使用"
            value={metrics.memoryUsage.toFixed(1)}
            suffix="MB"
            prefix={<DatabaseOutlined />}
            valueStyle={{ color: '#52c41a' }}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="API响应时间"
            value={metrics.apiResponseTime.toFixed(0)}
            suffix="ms"
            prefix={<ThunderboltOutlined />}
            valueStyle={{ color: '#faad14' }}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="渲染时间"
            value={metrics.renderTime.toFixed(0)}
            suffix="ms"
            prefix={<DashboardOutlined />}
            valueStyle={{ color: '#722ed1' }}
          />
        </Col>
      </Row>
    </Card>
  );
};

export default PerformanceMonitor;
```

---

## 🧪 测试策略

### 单元测试示例
```typescript
/**
 * FloatTicket Store 单元测试
 */
import { act, renderHook } from '@testing-library/react';
import { useFloatTicketStore } from '../store';

describe('FloatTicket Store', () => {
  beforeEach(() => {
    // 重置Store状态
    useFloatTicketStore.getState().reset();
  });

  test('should load float tickets successfully', async () => {
    const { result } = renderHook(() => useFloatTicketStore());

    await act(async () => {
      await result.current.loadFloatTickets();
    });

    expect(result.current.floatTickets).toHaveLength(1);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  test('should handle load errors', async () => {
    const { result } = renderHook(() => useFloatTicketStore());

    // Mock API错误
    jest.spyOn(floatTicketApi, 'getFloatTickets').mockRejectedValue(
      new Error('Network error')
    );

    await act(async () => {
      await result.current.loadFloatTickets();
    });

    expect(result.current.error).toBe('Network error');
    expect(result.current.loading).toBe(false);
  });

  test('should select float ticket', () => {
    const { result } = renderHook(() => useFloatTicketStore());

    act(() => {
      result.current.selectFloatTicket('FT-001');
    });

    expect(result.current.selectedIds).toContain('FT-001');
  });

  test('should select all float tickets', () => {
    const { result } = renderHook(() => useFloatTicketStore());

    act(() => {
      result.current.selectAll();
    });

    expect(result.current.selectedIds).toHaveLength(
      result.current.floatTickets.length
    );
  });
});
```

---

## 📚 最佳实践

### 1. 组件设计原则
- **单一职责**：每个组件只做一件事
- **可复用性**：通过props实现组件复用
- **性能优化**：使用memo、useMemo、useCallback
- **类型安全**：充分利用TypeScript类型系统

### 2. 状态管理原则
- **最小化状态**：只存储必要的状态
- **派生状态**：使用选择器计算派生状态
- **状态归一化**：避免状态冗余
- **不可变更新**：使用immer简化不可变更新

### 3. API调用原则
- **统一错误处理**：在API层统一处理错误
- **请求取消**：使用AbortController取消未完成的请求
- **请求缓存**：对相同请求进行缓存
- **请求重试**：对失败请求进行重试

### 4. 性能优化原则
- **代码分割**：使用动态导入分割代码
- **虚拟滚动**：大数据量列表使用虚拟滚动
- **图片优化**：使用懒加载和合适的图片格式
- **缓存策略**：合理使用浏览器缓存和本地存储

---

*本技术实现指南提供了FloatTicket模块的详细实现方案，包括架构设计、组件实现、样式规范、工具函数、性能监控和测试策略，为开发团队提供完整的技术参考。*
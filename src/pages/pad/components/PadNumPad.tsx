/**
 * PadNumPad — 工业PAD触屏数字键盘组件
 * 点击输入框弹出全屏数字键盘，支持小数点、退格、确认
 * 适用于所有数量/尺寸/参数输入场景
 */
import React, { useState, useCallback, useEffect } from 'react';
import { Modal, Button, Typography, Tag, Space } from 'antd';
import { CheckOutlined, DeleteOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;

export interface PadNumPadProps {
  value: number | null;
  onChange: (v: number | null) => void;
  /** 显示精度，默认 3 */
  precision?: number;
  /** 允许小数点，默认 true */
  allowDecimal?: boolean;
  /** 单位标签，显示在输入框右侧 */
  unit?: string;
  /** 字段标签，显示在键盘弹窗标题 */
  label?: string;
  /** 合格范围描述，显示在键盘弹窗副标题 */
  spec?: string;
  /** 最小值 */
  min?: number;
  /** 最大值 */
  max?: number;
  /** 是否禁用 */
  disabled?: boolean;
  /** 占位符 */
  placeholder?: string;
  /** 触发按钮宽度 */
  width?: number | string;
  /** 触发按钮高度 */
  height?: number;
  /** 字体大小 */
  fontSize?: number;
  /** 验证结果标签 */
  validTag?: React.ReactNode;
}

const PadNumPad: React.FC<PadNumPadProps> = ({
  value,
  onChange,
  precision = 3,
  allowDecimal = true,
  unit,
  label,
  spec,
  min,
  max,
  disabled = false,
  placeholder = '点击输入',
  width = 140,
  height = 52,
  fontSize = 16,
  validTag,
}) => {
  const [open, setOpen] = useState(false);
  const [inputStr, setInputStr] = useState('');

  // 打开时初始化
  const handleOpen = () => {
    if (disabled) return;
    setInputStr(value !== null && value !== undefined ? String(value) : '');
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const handleConfirm = useCallback(() => {
    const num = parseFloat(inputStr);
    if (inputStr === '' || isNaN(num)) {
      onChange(null);
    } else {
      onChange(parseFloat(num.toFixed(precision)));
    }
    setOpen(false);
  }, [inputStr, onChange, precision]);

  // 键盘按键处理
  const handleKey = useCallback((key: string) => {
    setInputStr(prev => {
      if (key === 'DEL') {
        return prev.slice(0, -1);
      }
      if (key === 'CLR') {
        return '';
      }
      if (key === '.') {
        if (!allowDecimal || prev.includes('.')) return prev;
        return prev === '' ? '0.' : prev + '.';
      }
      // 数字键
      if (prev === '0' && key !== '.') return key;
      // 精度限制
      const dotIdx = prev.indexOf('.');
      if (dotIdx !== -1 && prev.length - dotIdx - 1 >= precision) return prev;
      return prev + key;
    });
  }, [allowDecimal, precision]);

  // 快捷键支持（实际PAD使用外接键盘时）
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') handleKey(e.key);
      else if (e.key === '.' && allowDecimal) handleKey('.');
      else if (e.key === 'Backspace') handleKey('DEL');
      else if (e.key === 'Escape') handleClose();
      else if (e.key === 'Enter') handleConfirm();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, handleKey, handleConfirm, allowDecimal]);

  const parsedNum = parseFloat(inputStr);
  const isValid = !isNaN(parsedNum) && inputStr !== ''
    && (min === undefined || parsedNum >= min)
    && (max === undefined || parsedNum <= max);
  const isOutOfRange = !isNaN(parsedNum) && inputStr !== '' && !isValid;

  // ── 触发按钮样式 ──────────────────────────────────────────────
  const displayText = value !== null && value !== undefined
    ? `${value.toFixed(precision)}${unit ? ' ' + unit : ''}`
    : placeholder;
  const hasValue = value !== null && value !== undefined;

  const btnStyle: React.CSSProperties = {
    width,
    height,
    fontSize,
    fontFamily: 'monospace',
    fontWeight: hasValue ? 700 : 400,
    color: hasValue ? '#1a1a1a' : '#bfbfbf',
    background: disabled ? '#f5f5f5' : hasValue ? '#e6f7ff' : '#fff',
    border: `2px solid ${disabled ? '#d9d9d9' : hasValue ? '#1890ff' : '#d9d9d9'}`,
    borderRadius: 8,
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    transition: 'all 0.2s',
    userSelect: 'none',
    boxShadow: hasValue ? '0 0 0 2px rgba(24,144,255,0.15)' : 'none',
  };

  // ── 键盘布局 ─────────────────────────────────────────────────
  const KEYS = [
    ['7', '8', '9'],
    ['4', '5', '6'],
    ['1', '2', '3'],
    ['.', '0', 'DEL'],
  ];

  const keyStyle = (key: string): React.CSSProperties => ({
    width: '100%',
    height: 72,
    fontSize: key === 'DEL' ? 22 : 28,
    fontWeight: 600,
    fontFamily: 'monospace',
    background: key === 'DEL' ? '#fff1f0' : key === '.' ? '#f6f0ff' : '#fff',
    border: `1px solid ${key === 'DEL' ? '#ffccc7' : '#e8e8e8'}`,
    borderRadius: 10,
    color: key === 'DEL' ? '#ff4d4f' : key === '.' ? '#722ed1' : '#1a1a1a',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
    transition: 'all 0.1s',
    userSelect: 'none',
    WebkitTapHighlightColor: 'transparent',
  });

  return (
    <>
      {/* 触发按钮 */}
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <div style={btnStyle} onClick={handleOpen}>
          <span style={{ fontSize: 18, opacity: hasValue ? 1 : 0.4 }}>⌨</span>
          <span>{displayText}</span>
        </div>
        {validTag}
      </div>

      {/* 数字键盘弹窗 */}
      <Modal
        open={open}
        onCancel={handleClose}
        footer={null}
        centered
        width={380}
        title={null}
        closable={false}
        styles={{
          body: { padding: '0' },
          mask: { background: 'rgba(0,0,0,0.6)' },
        }}
      >
        <div style={{ background: '#f0f2f5', borderRadius: 12, overflow: 'hidden' }}>
          {/* 标题区 */}
          <div style={{
            background: 'linear-gradient(135deg, #C8000A 0%, #a50008 100%)',
            padding: '16px 20px 14px',
          }}>
            <Title level={5} style={{ color: '#fff', margin: 0, fontSize: 15 }}>
              ⌨ {label || '数值输入'}
            </Title>
            {spec && (
              <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12 }}>
                合格范围：{spec}
              </Text>
            )}
          </div>

          {/* 显示区 */}
          <div style={{
            background: '#fff',
            margin: '12px 16px 8px',
            borderRadius: 10,
            padding: '12px 16px',
            minHeight: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            border: `2px solid ${isOutOfRange ? '#ff4d4f' : isValid ? '#52c41a' : '#d9d9d9'}`,
            boxShadow: isOutOfRange
              ? '0 0 0 3px rgba(255,77,79,0.15)'
              : isValid ? '0 0 0 3px rgba(82,196,26,0.15)' : 'none',
            transition: 'all 0.2s',
          }}>
            <Text style={{
              fontSize: 32,
              fontFamily: 'monospace',
              fontWeight: 700,
              color: isOutOfRange ? '#ff4d4f' : isValid ? '#1a1a1a' : '#8c8c8c',
              letterSpacing: 2,
              flex: 1,
            }}>
              {inputStr || <span style={{ color: '#d9d9d9', fontSize: 22 }}>0.000</span>}
            </Text>
            <Space direction="vertical" align="end" size={2}>
              {unit && (
                <Tag color="blue" style={{ fontSize: 13, margin: 0 }}>{unit}</Tag>
              )}
              {isOutOfRange && (
                <Tag color="error" style={{ fontSize: 11, margin: 0 }}>超出范围</Tag>
              )}
              {isValid && (
                <Tag color="success" style={{ fontSize: 11, margin: 0 }}>✓ 有效</Tag>
              )}
            </Space>
          </div>

          {/* 键盘区 */}
          <div style={{ padding: '4px 16px 16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {KEYS.flat().map((key, i) => (
                <div
                  key={i}
                  style={keyStyle(key)}
                  onPointerDown={e => { e.preventDefault(); handleKey(key); }}
                >
                  {key === 'DEL' ? <DeleteOutlined /> : key}
                </div>
              ))}
            </div>

            {/* 操作行 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10, marginTop: 10 }}>
              {/* 清空 */}
              <Button
                size="large"
                danger
                block
                style={{ height: 60, fontSize: 16, fontWeight: 600, borderRadius: 10 }}
                onPointerDown={e => { e.preventDefault(); setInputStr(''); }}
              >
                清空
              </Button>
              {/* 确认 */}
              <Button
                type="primary"
                size="large"
                block
                icon={<CheckOutlined />}
                style={{
                  height: 60,
                  fontSize: 18,
                  fontWeight: 700,
                  borderRadius: 10,
                  background: isOutOfRange ? '#faad14' : '#52c41a',
                  borderColor: isOutOfRange ? '#faad14' : '#52c41a',
                }}
                onPointerDown={e => { e.preventDefault(); handleConfirm(); }}
              >
                {isOutOfRange ? '强制确认' : '确认'}
              </Button>
            </div>

            {isOutOfRange && (
              <div style={{
                marginTop: 8,
                padding: '6px 10px',
                background: '#fff7e6',
                borderRadius: 6,
                border: '1px solid #ffd591',
                fontSize: 12,
                color: '#d46b08',
                textAlign: 'center',
              }}>
                ⚠ 当前值超出规格范围，确认将标记为不合格
              </div>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
};

export default PadNumPad;

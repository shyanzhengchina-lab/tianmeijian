/**
 * PadCamera — 工业PAD摄像头拍照上传组件
 * 调用设备 camera API (getUserMedia)，实时预览，拍照后以 base64 存储
 * 支持多张拍摄、删除、最低张数校验
 */
import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Modal, Button, Typography, Tag, Space, Row, Col, message, Spin } from 'antd';
import {
  CameraOutlined, DeleteOutlined, CheckCircleOutlined,
  CloseOutlined, ReloadOutlined, WarningOutlined,
} from '@ant-design/icons';

const { Text, Title } = Typography;

export interface CapturedPhoto {
  id: string;
  dataUrl: string;
  timestamp: string;
  width: number;
  height: number;
}

export interface PadCameraProps {
  /** 已拍摄照片列表 */
  photos: CapturedPhoto[];
  /** 照片变更回调 */
  onChange: (photos: CapturedPhoto[]) => void;
  /** 最少拍摄张数，默认 2 */
  minCount?: number;
  /** 最多拍摄张数，默认 6 */
  maxCount?: number;
  /** 按钮标签，默认"拍照上传" */
  label?: string;
  /** 是否禁用 */
  disabled?: boolean;
}

const PadCamera: React.FC<PadCameraProps> = ({
  photos,
  onChange,
  minCount = 2,
  maxCount = 6,
  label = '拍照上传',
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<CapturedPhoto | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const count = photos.length;
  const isSatisfied = count >= minCount;

  // ── 开启摄像头 ────────────────────────────────────────────────
  const startCamera = useCallback(async (facing: 'environment' | 'user' = 'environment') => {
    setLoading(true);
    setCameraError(null);
    // 先停止已有流
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setStreaming(true);
    } catch (err: unknown) {
      const error = err as Error;
      console.error('Camera error:', error);
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setCameraError('摄像头权限被拒绝，请在浏览器设置中允许摄像头访问。');
      } else if (error.name === 'NotFoundError') {
        setCameraError('未检测到摄像头设备，请确认设备已连接。');
      } else if (error.name === 'NotReadableError') {
        setCameraError('摄像头被其他程序占用，请关闭其他使用摄像头的程序后重试。');
      } else {
        setCameraError(`摄像头初始化失败：${error.message || '未知错误'}`);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // ── 关闭摄像头 ────────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setStreaming(false);
  }, []);

  // ── 打开弹窗 ──────────────────────────────────────────────────
  const handleOpen = () => {
    if (disabled) return;
    if (count >= maxCount) {
      message.warning(`最多拍摄 ${maxCount} 张`);
      return;
    }
    setOpen(true);
    setFacingMode('environment');
  };

  // ── 弹窗挂载后启动摄像头 ─────────────────────────────────────
  useEffect(() => {
    if (open) {
      startCamera(facingMode);
    }
    return () => {
      if (!open) stopCamera();
    };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 切换前/后摄 ───────────────────────────────────────────────
  const handleFlip = () => {
    const next = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(next);
    startCamera(next);
  };

  // ── 拍照 ─────────────────────────────────────────────────────
  const handleCapture = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !streaming) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // 水印：时间戳
    const ts = new Date().toLocaleString('zh-CN');
    ctx.font = 'bold 22px monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillRect(0, canvas.height - 40, canvas.width, 40);
    ctx.fillStyle = '#C8000A';
    ctx.fillText(`YonBIP/SY 医疗器械  ${ts}`, 10, canvas.height - 12);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
    const photo: CapturedPhoto = {
      id: `ph_${Date.now()}`,
      dataUrl,
      timestamp: ts,
      width: canvas.width,
      height: canvas.height,
    };

    onChange([...photos, photo]);
    message.success(`第 ${photos.length + 1} 张照片已拍摄`);

    // 闪光动画
    setFlash(true);
    setTimeout(() => setFlash(false), 200);

    // 拍满后自动关闭
    if (photos.length + 1 >= maxCount) {
      setTimeout(() => {
        stopCamera();
        setOpen(false);
        message.info('已达最大拍摄数量，摄像头已关闭');
      }, 400);
    }
  }, [streaming, photos, onChange, maxCount, stopCamera]);

  // ── 关闭弹窗 ─────────────────────────────────────────────────
  const handleClose = () => {
    stopCamera();
    setOpen(false);
    setCameraError(null);
  };

  // ── 删除照片 ─────────────────────────────────────────────────
  const handleDelete = (id: string) => {
    onChange(photos.filter(p => p.id !== id));
  };

  // ── 按钮颜色 ─────────────────────────────────────────────────
  const btnColor = isSatisfied ? '#52c41a' : count > 0 ? '#faad14' : '#1890ff';
  const btnBg = isSatisfied ? '#f6ffed' : count > 0 ? '#fffbe6' : '#e6f7ff';
  const btnBorder = isSatisfied ? '#b7eb8f' : count > 0 ? '#ffe58f' : '#91d5ff';

  return (
    <div>
      {/* ── 触发区 ── */}
      <Space size={10} wrap>
        <Button
          icon={<CameraOutlined />}
          size="large"
          disabled={disabled || count >= maxCount}
          onClick={handleOpen}
          style={{
            height: 52,
            fontSize: 15,
            fontWeight: 600,
            background: btnBg,
            borderColor: btnBorder,
            color: btnColor,
            paddingInline: 20,
          }}
        >
          {label}
        </Button>

        <Tag
          color={isSatisfied ? 'success' : count > 0 ? 'warning' : 'default'}
          style={{ fontSize: 13, padding: '4px 10px', height: 32, display: 'flex', alignItems: 'center', gap: 4 }}
        >
          {isSatisfied ? <CheckCircleOutlined /> : <WarningOutlined />}
          已拍：{count}/{minCount}（至少{minCount}张）
        </Tag>
      </Space>

      {/* ── 缩略图列表 ── */}
      {photos.length > 0 && (
        <Row gutter={[8, 8]} style={{ marginTop: 10 }}>
          {photos.map((p, idx) => (
            <Col key={p.id}>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <img
                  src={p.dataUrl}
                  alt={`照片 ${idx + 1}`}
                  style={{
                    width: 80,
                    height: 60,
                    objectFit: 'cover',
                    borderRadius: 6,
                    border: '2px solid #52c41a',
                    cursor: 'pointer',
                    display: 'block',
                  }}
                  onClick={() => setPreviewPhoto(p)}
                />
                <Button
                  type="primary"
                  danger
                  shape="circle"
                  size="small"
                  icon={<DeleteOutlined />}
                  style={{
                    position: 'absolute',
                    top: -8,
                    right: -8,
                    width: 20,
                    height: 20,
                    minWidth: 20,
                    fontSize: 10,
                  }}
                  onClick={() => handleDelete(p.id)}
                />
                <div style={{
                  position: 'absolute',
                  bottom: 2,
                  left: 2,
                  background: 'rgba(0,0,0,0.55)',
                  color: '#fff',
                  fontSize: 9,
                  padding: '0 3px',
                  borderRadius: 3,
                }}>
                  {idx + 1}
                </div>
              </div>
            </Col>
          ))}
        </Row>
      )}

      {/* ── 摄像头弹窗 ── */}
      <Modal
        open={open}
        onCancel={handleClose}
        footer={null}
        centered
        width={740}
        title={null}
        closable={false}
        styles={{
          body: { padding: 0 },
          mask: { background: 'rgba(0,0,0,0.85)' },
        }}
        destroyOnClose
      >
        <div style={{ background: '#1a1a1a', borderRadius: 12, overflow: 'hidden' }}>
          {/* 顶栏 */}
          <div style={{
            background: 'linear-gradient(135deg, #C8000A 0%, #a50008 100%)',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <Space size={10}>
              <CameraOutlined style={{ color: '#fff', fontSize: 20 }} />
              <Title level={5} style={{ color: '#fff', margin: 0 }}>
                现场拍照记录
              </Title>
              <Tag color="rgba(255,255,255,0.2)" style={{ color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }}>
                {count}/{maxCount} 张
              </Tag>
            </Space>
            <Button
              icon={<CloseOutlined />}
              onClick={handleClose}
              style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff' }}
            />
          </div>

          {/* 视频预览 */}
          <div style={{ position: 'relative', background: '#000', minHeight: 380 }}>
            {loading && (
              <div style={{
                position: 'absolute', inset: 0, display: 'flex',
                flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                color: '#fff', gap: 12, zIndex: 2,
              }}>
                <Spin size="large" />
                <Text style={{ color: '#fff', fontSize: 14 }}>正在启动摄像头…</Text>
              </div>
            )}

            {cameraError ? (
              <div style={{
                minHeight: 380, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16,
              }}>
                <div style={{ fontSize: 56 }}>📷</div>
                <Text style={{ color: '#ff7875', fontSize: 14, textAlign: 'center' }}>
                  {cameraError}
                </Text>
                <Button
                  type="primary"
                  icon={<ReloadOutlined />}
                  size="large"
                  onClick={() => startCamera(facingMode)}
                >
                  重新连接摄像头
                </Button>
                {/* 降级：允许手动上传文件 */}
                <div style={{ marginTop: 8 }}>
                  <Text style={{ color: '#8c8c8c', fontSize: 12 }}>或使用文件上传（降级模式）：</Text>
                  <label style={{ display: 'inline-block', marginLeft: 8 }}>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      style={{ display: 'none' }}
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = ev => {
                          const dataUrl = ev.target?.result as string;
                          const ts = new Date().toLocaleString('zh-CN');
                          const photo: CapturedPhoto = {
                            id: `ph_${Date.now()}`,
                            dataUrl,
                            timestamp: ts,
                            width: 0,
                            height: 0,
                          };
                          onChange([...photos, photo]);
                          message.success('照片已上传（文件模式）');
                          if (photos.length + 1 >= minCount) handleClose();
                        };
                        reader.readAsDataURL(file);
                      }}
                    />
                    <Button size="large" icon={<CameraOutlined />}>
                      选择照片文件
                    </Button>
                  </label>
                </div>
              </div>
            ) : (
              <>
                {/* 闪光效果 */}
                {flash && (
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: '#fff', opacity: 0.85,
                    zIndex: 10, borderRadius: 0,
                    pointerEvents: 'none',
                    transition: 'opacity 0.2s',
                  }} />
                )}
                {/* 取景框对焦线 */}
                {streaming && (
                  <div style={{
                    position: 'absolute',
                    top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 200, height: 150,
                    border: '2px solid rgba(255,255,255,0.6)',
                    borderRadius: 6,
                    pointerEvents: 'none',
                    zIndex: 3,
                    boxShadow: '0 0 0 9999px rgba(0,0,0,0.2)',
                  }}>
                    {/* 四角标记 */}
                    {[
                      { top: -2, left: -2, borderTop: '3px solid #52c41a', borderLeft: '3px solid #52c41a' },
                      { top: -2, right: -2, borderTop: '3px solid #52c41a', borderRight: '3px solid #52c41a' },
                      { bottom: -2, left: -2, borderBottom: '3px solid #52c41a', borderLeft: '3px solid #52c41a' },
                      { bottom: -2, right: -2, borderBottom: '3px solid #52c41a', borderRight: '3px solid #52c41a' },
                    ].map((s, i) => (
                      <div key={i} style={{ position: 'absolute', width: 20, height: 20, ...s }} />
                    ))}
                  </div>
                )}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    width: '100%',
                    maxHeight: 420,
                    objectFit: 'cover',
                    display: 'block',
                    opacity: loading ? 0 : 1,
                    transition: 'opacity 0.3s',
                  }}
                />
              </>
            )}
            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </div>

          {/* 底部操作栏 */}
          <div style={{
            background: '#111',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}>
            {/* 切换摄像头 */}
            <Button
              icon={<ReloadOutlined />}
              size="large"
              onClick={handleFlip}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#fff',
                height: 52,
                fontSize: 13,
              }}
              disabled={loading || !!cameraError}
            >
              翻转摄像头
            </Button>

            {/* 拍照按钮 */}
            <Button
              type="primary"
              size="large"
              icon={<CameraOutlined />}
              disabled={!streaming || loading || count >= maxCount || !!cameraError}
              onClick={handleCapture}
              style={{
                height: 68,
                width: 200,
                fontSize: 20,
                fontWeight: 700,
                borderRadius: 12,
                background: streaming ? '#C8000A' : '#595959',
                borderColor: streaming ? '#C8000A' : '#595959',
                boxShadow: streaming ? '0 0 20px rgba(200,0,10,0.5)' : 'none',
                flex: '0 0 auto',
              }}
            >
              📷 拍照
            </Button>

            {/* 完成按钮 */}
            <Button
              size="large"
              icon={<CheckCircleOutlined />}
              onClick={handleClose}
              style={{
                background: isSatisfied ? '#52c41a' : 'rgba(255,255,255,0.1)',
                border: isSatisfied ? 'none' : '1px solid rgba(255,255,255,0.2)',
                color: '#fff',
                height: 52,
                fontSize: 14,
                fontWeight: isSatisfied ? 700 : 400,
              }}
            >
              {isSatisfied ? `完成 (${count}张)` : `还需${minCount - count}张`}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── 照片大图预览 ── */}
      <Modal
        open={!!previewPhoto}
        onCancel={() => setPreviewPhoto(null)}
        footer={null}
        centered
        width={800}
        title={
          <Space>
            <CameraOutlined />
            <span>照片预览</span>
            {previewPhoto && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                {previewPhoto.timestamp} | {previewPhoto.width}×{previewPhoto.height}
              </Text>
            )}
          </Space>
        }
      >
        {previewPhoto && (
          <img
            src={previewPhoto.dataUrl}
            alt="预览"
            style={{ width: '100%', borderRadius: 8, border: '1px solid #e8e8e8' }}
          />
        )}
      </Modal>
    </div>
  );
};

export default PadCamera;

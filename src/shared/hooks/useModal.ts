/**
 * 弹窗状态管理Hook
 * 封装弹窗常用的状态和逻辑
 */
import { useState, useCallback } from 'react';

interface UseModalResult {
  visible: boolean;
  loading: boolean;
  data: any;
  error: string | null;

  // Actions
  openModal: (data?: any) => void;
  closeModal: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  toggleModal: () => void;
}

export function useModal(initialVisible = false): UseModalResult {
  const [visible, setVisible] = useState(initialVisible);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const openModal = useCallback((modalData?: any) => {
    setData(modalData || null);
    setError(null);
    setVisible(true);
  }, []);

  const closeModal = useCallback(() => {
    setVisible(false);
    setLoading(false);
    setData(null);
    setError(null);
  }, []);

  const toggleModal = useCallback(() => {
    setVisible(prev => !prev);
    if (!visible) {
      setError(null);
    }
  }, [visible]);

  return {
    visible,
    loading,
    data,
    error,
    openModal,
    closeModal,
    setLoading,
    setError,
    toggleModal,
  };
}
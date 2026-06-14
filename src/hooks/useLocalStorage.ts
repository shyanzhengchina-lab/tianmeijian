import { useState, useEffect, useCallback } from 'react';

/**
 * useLocalStorage — 将 state 自动同步到 localStorage
 * 用法与 useState 完全相同，但数据在页面刷新后依然保留。
 *
 * @param key       localStorage 的键名（全局唯一）
 * @param initial   初始默认值（仅在 localStorage 中没有数据时使用）
 */
export function useLocalStorage<T>(key: string, initial: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored !== null) {
        return JSON.parse(stored) as T;
      }
    } catch (e) {
      console.warn(`[useLocalStorage] Failed to parse key "${key}"`, e);
    }
    return initial;
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn(`[useLocalStorage] Failed to save key "${key}"`, e);
    }
  }, [key, value]);

  // 监听外部 localStorage 变更（例如演示数据注入后触发重渲染）
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key !== key) return;
      try {
        const newVal = e.newValue !== null ? JSON.parse(e.newValue) as T : initial;
        setValue(newVal);
      } catch {
        /* ignore parse errors */
      }
    };
    // 同时监听同页面内的自定义事件（同源 storage 事件不触发自身页面）
    const handleCustom = (e: Event) => {
      const ce = e as CustomEvent;
      if (ce.detail?.key !== key) return;
      try {
        const stored = localStorage.getItem(key);
        if (stored !== null) setValue(JSON.parse(stored) as T);
      } catch { /* ignore */ }
    };
    window.addEventListener('storage', handleStorage);
    window.addEventListener('bip-storage-updated', handleCustom);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('bip-storage-updated', handleCustom);
    };
  }, [key, initial]);

  const setValueWrapped = useCallback<React.Dispatch<React.SetStateAction<T>>>(
    (action) => setValue(action),
    []
  );

  return [value, setValueWrapped];
}

/**
 * clearAllAppStorage — 清除所有本应用的 localStorage 数据
 * 可在「重置数据」功能中调用
 */
export function clearAllAppStorage(prefix = 'bip_') {
  Object.keys(localStorage)
    .filter(k => k.startsWith(prefix))
    .forEach(k => localStorage.removeItem(k));
}

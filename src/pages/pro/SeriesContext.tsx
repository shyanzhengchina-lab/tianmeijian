// ================================================================
// SeriesContext — 共享产品系列列表 & 产品族列表
// ProductSeriesPage 和 RoutingMasterListPage 均从此 Context 读写
// ================================================================
import React, { createContext, useContext, ReactNode } from 'react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { ProductSeries, mockProductSeries } from './seriesData';

// ── 产品族初始值（天美健保健品行业）────────────────────────────────
export const DEFAULT_FAMILIES = ['维生素/矿物质族', '植物提取物族', '益生菌族', '功能性食品族'];

// ── Context 类型 ──────────────────────────────────────────────────
interface SeriesContextType {
  // 产品系列
  seriesList: ProductSeries[];
  setSeriesList: React.Dispatch<React.SetStateAction<ProductSeries[]>>;
  // 产品族枚举
  families: string[];
  setFamilies: React.Dispatch<React.SetStateAction<string[]>>;
}

const SeriesContext = createContext<SeriesContextType | null>(null);

// ── Provider ──────────────────────────────────────────────────────
export const SeriesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [seriesList, setSeriesList] = useLocalStorage<ProductSeries[]>('bip_product_series', []);
  const [families, setFamilies]     = useLocalStorage<string[]>('bip_product_families', DEFAULT_FAMILIES);
  return (
    <SeriesContext.Provider value={{ seriesList, setSeriesList, families, setFamilies }}>
      {children}
    </SeriesContext.Provider>
  );
};

// ── Hook ──────────────────────────────────────────────────────────
export const useSeriesContext = (): SeriesContextType => {
  const ctx = useContext(SeriesContext);
  if (!ctx) throw new Error('useSeriesContext must be used inside <SeriesProvider>');
  return ctx;
};

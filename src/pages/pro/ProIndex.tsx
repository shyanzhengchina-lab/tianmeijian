import React, { useState } from 'react';
import { Segmented } from 'antd';
import { BranchesOutlined, ApartmentOutlined } from '@ant-design/icons';
import ProListPage from './ProListPage';
import ProDetailPage from './ProDetailPage';
import RoutingMasterListPage from './RoutingMasterListPage';
import RMDetailPage from './RMDetailPage';
import { ProcessRouting } from './proData';
import { RoutingMaster } from './seriesData';
import './ProPage.css';

type SubView = 'series' | 'product';
type MainView = 'list' | 'detail' | 'rm-detail';

interface ProIndexProps {
  onNavigateToSeries?: () => void;  // App 层注入，用于跳转「产品系列档案」页
  initialHighlightCode?: string;    // 从工单跳转时高亮指定工艺路径编码
}

const ProIndex: React.FC<ProIndexProps> = ({ onNavigateToSeries, initialHighlightCode }) => {
  const [subView, setSubView]               = useState<SubView>('series');
  const [mainView, setMainView]             = useState<MainView>('list');
  const [detailRouting, setDetailRouting]   = useState<ProcessRouting | null>(null);
  const [rmDetailRouting, setRmDetailRouting] = useState<RoutingMaster | null>(null);

  // 产品专属路径 → 详情页
  const handleViewDetail = (routing: ProcessRouting) => {
    setDetailRouting(routing);
    setMainView('detail');
  };

  // 产品系列路径 → 工序详情页
  const handleViewRMDetail = (rm: RoutingMaster) => {
    setRmDetailRouting(rm);
    setMainView('rm-detail');
  };

  const handleBack = () => {
    setMainView('list');
    setDetailRouting(null);
    setRmDetailRouting(null);
  };

  /* ── 产品专属路径详情（工序配置） ── */
  if (mainView === 'detail' && detailRouting) {
    return <ProDetailPage routing={detailRouting} onBack={handleBack} />;
  }

  /* ── 产品系列路径详情（工序配置） ── */
  if (mainView === 'rm-detail' && rmDetailRouting) {
    return <RMDetailPage routing={rmDetailRouting} onBack={handleBack} />;
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>

      {/* ── 顶部切换栏 ── */}
      <div style={{
        background: '#fff',
        borderBottom: '1px solid #f0f0f0',
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        flexShrink: 0,
      }}>
        <Segmented
          value={subView}
          onChange={v => { setSubView(v as SubView); setMainView('list'); }}
          options={[
            { value: 'series',  icon: <BranchesOutlined />,  label: '产品系列路径' },
            { value: 'product', icon: <ApartmentOutlined />, label: '产品专属路径' },
          ]}
        />
        <span style={{ fontSize: 12, color: '#aaa' }}>
          {subView === 'series'
            ? '针对产品系列定义标准工艺路径，支持版本管理与变体派生'
            : '针对具体产品（成品物料）定义专属工艺路径，含审核流程与工序步骤配置'}
        </span>
      </div>

      {/* ── 内容区 ── */}
      <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
        {subView === 'series' ? (
          <RoutingMasterListPage
            onViewDetail={handleViewRMDetail}
            onNavigateToSeries={onNavigateToSeries}
            initialHighlightCode={initialHighlightCode}
          />
        ) : (
          <ProListPage onViewDetail={handleViewDetail} />
        )}
      </div>
    </div>
  );
};

export default ProIndex;

import React, { useState } from 'react';
import { Segmented, Tag, Tooltip } from 'antd';
import {
  BranchesOutlined, ApartmentOutlined,
  BankOutlined, PartitionOutlined,
} from '@ant-design/icons';
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

// 双工厂 + 四车间简介卡片
const FACTORY_SUMMARY = [
  {
    factory: 'NJ', name: '南京工厂', sub: '天美健大自然生物工程',
    color: '#C8000A',
    workshops: [
      { code: 'GD', name: '固体车间', products: '维C咀嚼片', icon: '💊' },
      { code: 'RN', name: '软胶囊车间', products: '钙维D/鱼油软胶囊', icon: '🔵' },
    ],
  },
  {
    factory: 'LS', name: '溧水工厂', sub: '每日营养',
    color: '#7B3FA0',
    workshops: [
      { code: 'GD', name: '固体车间', products: '乳清蛋白粉', icon: '💊' },
      { code: 'YQ', name: '液体车间', products: '葡萄糖酸锌/胶原蛋白口服液', icon: '🧪' },
    ],
  },
];

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

      {/* ── 顶部：双工厂概览 + 切换栏 ── */}
      <div style={{
        background: '#fff',
        borderBottom: '1px solid #f0f0f0',
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        flexShrink: 0,
        flexWrap: 'wrap',
      }}>
        {/* 主切换器 */}
        <Segmented
          value={subView}
          onChange={v => { setSubView(v as SubView); setMainView('list'); }}
          options={[
            { value: 'series',  icon: <BranchesOutlined />,  label: '产品系列路径' },
            { value: 'product', icon: <ApartmentOutlined />, label: '产品专属路径' },
          ]}
        />

        {/* 说明文字 */}
        <span style={{ fontSize: 12, color: '#aaa', flex: 1, minWidth: 200 }}>
          {subView === 'series'
            ? '针对产品系列定义标准工艺路径，支持版本管理与变体派生'
            : '针对具体产品（成品物料）定义专属工艺路径 | 编码规则：[工厂]-[车间]-[剂型]-[流水号]'}
        </span>

        {/* 双工厂快速信息标签 */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {FACTORY_SUMMARY.map(f => (
            <Tooltip
              key={f.factory}
              title={
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{f.name}（{f.sub}）</div>
                  {f.workshops.map(w => (
                    <div key={w.code} style={{ fontSize: 11, marginBottom: 2 }}>
                      {w.icon} {w.name}（{w.code}）：{w.products}
                    </div>
                  ))}
                  <div style={{ fontSize: 10, color: '#ccc', marginTop: 4 }}>
                    编码前缀：{f.factory}
                  </div>
                </div>
              }
            >
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '3px 10px', borderRadius: 16,
                border: `1px solid ${f.color}30`,
                background: f.color + '08',
                cursor: 'default',
              }}>
                <BankOutlined style={{ fontSize: 12, color: f.color }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: f.color }}>{f.factory}</span>
                <span style={{ fontSize: 11, color: '#888' }}>{f.name}</span>
                <div style={{ display: 'flex', gap: 3 }}>
                  {f.workshops.map(w => (
                    <Tag key={w.code} style={{ fontSize: 10, padding: '0 4px', margin: 0, lineHeight: '16px' }}>
                      {w.code}
                    </Tag>
                  ))}
                </div>
              </div>
            </Tooltip>
          ))}
        </div>
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

import React, { useState, useEffect } from 'react';
import { Table, Card, Typography, Tag } from 'antd';
import { qualityApi } from '../../api';
const { Title, Text } = Typography;
const CHECK_TYPE = { 1: 'IQC来料', 2: 'IPQC过程', 3: 'FQC成品', 4: '在线', 5: '清洁' };
export default function QcSchemePage() {
  const [list, setList] = useState([]); const [loading, setLoading] = useState(false);
  useEffect(() => { setLoading(true); qualityApi.getQcSchemes({}).then(r => { if (r.code === 200) setList(r.data); }).finally(() => setLoading(false)); }, []);
  const cols = [
    { title: '方案编码', dataIndex: 'scheme_code', width: 130 }, { title: '方案名称', dataIndex: 'scheme_name', ellipsis: true },
    { title: '适用物料', dataIndex: 'material_code', width: 120 },
    { title: '检验类型', dataIndex: 'check_type', width: 110, render: v => <Tag color="blue">{CHECK_TYPE[v] || v}</Tag> },
    { title: '状态', dataIndex: 'status', width: 80, render: v => <Tag color={v === 1 ? 'green' : 'default'}>{v === 1 ? '启用' : '禁用'}</Tag> },
  ];
  return (
    <div className="page-container">
      <Card bordered={false} title={<Title level={5} style={{margin:0}}>质检方案</Title>}>
        <Table columns={cols} dataSource={list} rowKey="id" loading={loading} size="small" />
      </Card>
    </div>
  );
}

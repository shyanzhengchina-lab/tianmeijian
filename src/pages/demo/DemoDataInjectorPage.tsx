/**
 * 演示数据注入工具页面
 * 天美健保健品MES — 完整演示测试用例注入
 * 覆盖：BOM→生产订单→生产工单→工序任务→PAD执行→批记录→检验→放行→偏差
 */
import React, { useState } from 'react';
import {
  Card, Button, Steps, Tag, Alert, Divider, Space, Table, Typography,
  Row, Col, Statistic, Progress, Modal, Timeline, Badge, Tabs, message,
} from 'antd';
import {
  CheckCircleOutlined, ExperimentOutlined, FileTextOutlined,
  WarningOutlined, SafetyOutlined, ApartmentOutlined, DatabaseOutlined,
  PlayCircleOutlined, ReloadOutlined, DeleteOutlined, InfoCircleOutlined,
  FileDoneOutlined, AuditOutlined, AlertOutlined, BoxPlotOutlined,
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

// ==================== 天美健演示批次定义 ====================
const DEMO_BATCH = {
  // 生产订单
  poId: 'PO-TMJ-2026-001',
  poNo: 'MO-20260614-001',
  soNo: 'SO-20260610-188',
  // 工单
  woId: 'WO-TMJ-2026-001',
  woNo: 'WO-20260614-001',
  batchNo: 'BN-20260614-001',
  // 产品
  productCode: 'FG-VitC-1000-120',
  productName: '天美健维生素C咀嚼片',
  productSpec: '1000mg×120片/瓶',
  planQty: 3000, // 3000瓶
  // 关键日期
  productionDate: '2026-06-14',
  expiryDate: '2028-06-13',
  deliveryDate: '2026-06-25',
  // 人员
  operators: {
    weighOp: '李梅（称量工）',
    mixOp: '张文（混合工）',
    granOp: '陈涛（制粒工）',
    innerOp: '王芳（内包装工）',
    outerOp: '刘勇（外包装工）',
    qaOp: 'QA赵敏',
    qcOp: 'QC孙静',
    warehouseOp: '仓管周军',
    supervisor: '班组长吴晓',
    qaMgr: 'QA经理林总',
    qm: '质量负责人陈总',
  },
};

// ==================== GMP PAD execMap 完整数据 ====================
function buildDemoExecMap() {
  const now = '2026-06-14';
  return {
    'OP-GMP-WEIGH': {
      opCode: 'OP-GMP-WEIGH',
      status: 'completed',
      inTime: `${now} 07:30`,
      outTime: `${now} 09:00`,
      finishQty: 3000,
      goodQty: 3000,
      badQty: 0,
      scrapQty: 0,
      reportRecords: [],
      firstPiecePassed: true,
      preCleanDone: true,
      stages: {
        PRE_CLEAN: {
          code: 'PRE_CLEAN', status: 'completed',
          startTime: `${now} 07:30`, endTime: `${now} 07:50`,
          operator: DEMO_BATCH.operators.weighOp,
          data: {
            pc_wo: true, pc_bom: true, pc_cert: true, pc_material: true,
            pc_equip: true, pc_ppe: true, pc_env: true, pc_record: true, pc_qapprove: true,
            clean_cert_no: 'CC-GD-20260614-001',
            clean_cert_expiry: `${now} 07:30 → 2026-06-17 07:30`,
            temp: '22.5', humidity: '45',
          },
        },
        CHECK_IN: {
          code: 'CHECK_IN', status: 'completed',
          startTime: `${now} 07:50`, endTime: `${now} 07:55`,
          operator: DEMO_BATCH.operators.weighOp,
          data: { in_barcode: DEMO_BATCH.batchNo, in_operator: DEMO_BATCH.operators.weighOp },
        },
        MAT_VERIFY: {
          code: 'MAT_VERIFY', status: 'completed',
          startTime: `${now} 07:55`, endTime: `${now} 08:05`,
          operator: DEMO_BATCH.operators.weighOp,
          data: {
            mat_table: [
              { mat_name: '维生素C（抗坏血酸）', mat_code: 'RM-VitC-001', mat_lotno: 'VitC-20260601-A', mat_qty: '360000g', mat_plan_qty: '360000g', mat_status: '合格', mat_check: true },
              { mat_name: '木糖醇', mat_code: 'RM-XYL-001', mat_lotno: 'XYL-20260602-B', mat_qty: '60000g', mat_plan_qty: '60000g', mat_status: '合格', mat_check: true },
              { mat_name: '柠檬酸', mat_code: 'RM-CIT-001', mat_lotno: 'CIT-20260603-A', mat_qty: '12000g', mat_plan_qty: '12000g', mat_status: '合格', mat_check: true },
              { mat_name: '二氧化硅（助流剂）', mat_code: 'RM-SIO2-001', mat_lotno: 'SIO2-20260601-C', mat_qty: '6000g', mat_plan_qty: '6000g', mat_status: '合格', mat_check: true },
              { mat_name: '硬脂酸镁（润滑剂）', mat_code: 'RM-MgSt-001', mat_lotno: 'MgSt-20260604-A', mat_qty: '1800g', mat_plan_qty: '1800g', mat_status: '合格', mat_check: true },
            ],
          },
        },
        FIRST_PIECE: { code: 'FIRST_PIECE', status: 'skipped', data: {} },
        DATA_COLLECT: {
          code: 'DATA_COLLECT', status: 'completed',
          startTime: `${now} 08:05`, endTime: `${now} 08:50`,
          operator: DEMO_BATCH.operators.weighOp,
          data: {
            dc_table: [
              { material_name: '维生素C（抗坏血酸）', batch_no: 'VitC-20260601-A', plan_qty: '360000', actual_qty: '360012', balance_check: '合格', temp: '22.5', humidity: '45' },
              { material_name: '木糖醇', batch_no: 'XYL-20260602-B', plan_qty: '60000', actual_qty: '59998', balance_check: '合格', temp: '22.5', humidity: '45' },
              { material_name: '柠檬酸', batch_no: 'CIT-20260603-A', plan_qty: '12000', actual_qty: '12001', balance_check: '合格', temp: '22.5', humidity: '45' },
              { material_name: '二氧化硅', batch_no: 'SIO2-20260601-C', plan_qty: '6000', actual_qty: '6000', balance_check: '合格', temp: '22.5', humidity: '45' },
              { material_name: '硬脂酸镁', batch_no: 'MgSt-20260604-A', plan_qty: '1800', actual_qty: '1800', balance_check: '合格', temp: '22.5', humidity: '45' },
            ],
            weigh_operator: DEMO_BATCH.operators.weighOp,
            verify_operator: DEMO_BATCH.operators.supervisor,
            balance_id: 'BAL-001',
            total_weigh: '439811g',
            temp: '22.5', humidity: '45',
          },
        },
        SELF_CHECK: { code: 'SELF_CHECK', status: 'skipped', data: {} },
        POST_CLEAN: { code: 'POST_CLEAN', status: 'skipped', data: {} },
        REPORT: {
          code: 'REPORT', status: 'completed',
          startTime: `${now} 08:50`, endTime: `${now} 09:00`,
          operator: DEMO_BATCH.operators.weighOp,
          data: {
            rpt_finish: 3000, rpt_good: 3000, rpt_bad: 0, rpt_scrap: 0,
            rpt_operator: DEMO_BATCH.operators.weighOp,
            rpt_equip: 'BAL-001', rpt_equip_name: '十万分之一天平',
            rpt_params: [
              { label: '称量总质量', value: '439811', unit: 'g' },
              { label: '天平编号', value: 'BAL-001', unit: '' },
              { label: '复核人', value: DEMO_BATCH.operators.supervisor, unit: '' },
            ],
          },
        },
        CHECK_OUT: {
          code: 'CHECK_OUT', status: 'completed',
          startTime: `${now} 09:00`, endTime: `${now} 09:00`,
          operator: DEMO_BATCH.operators.weighOp,
          data: { out_operator: DEMO_BATCH.operators.weighOp },
        },
      },
    },

    'OP-GMP-MIX': {
      opCode: 'OP-GMP-MIX',
      status: 'completed',
      inTime: `${now} 09:05`,
      outTime: `${now} 11:30`,
      finishQty: 3000,
      goodQty: 3000,
      badQty: 0,
      scrapQty: 0,
      reportRecords: [],
      firstPiecePassed: true,
      preCleanDone: true,
      stages: {
        PRE_CLEAN: {
          code: 'PRE_CLEAN', status: 'completed',
          startTime: `${now} 09:05`, endTime: `${now} 09:20`,
          operator: DEMO_BATCH.operators.mixOp,
          data: {
            pc_wo: true, pc_bom: true, pc_cert: true, pc_material: true,
            pc_equip: true, pc_ppe: true, pc_env: true, pc_record: true, pc_qapprove: true,
            clean_cert_no: 'CC-GD-20260614-002',
            clean_cert_expiry: `${now} 09:00 → 2026-06-17 09:00`,
            temp: '23.0', humidity: '46',
          },
        },
        CHECK_IN: {
          code: 'CHECK_IN', status: 'completed',
          startTime: `${now} 09:20`, endTime: `${now} 09:25`,
          operator: DEMO_BATCH.operators.mixOp,
          data: { in_barcode: DEMO_BATCH.batchNo },
        },
        MAT_VERIFY: { code: 'MAT_VERIFY', status: 'skipped', data: {} },
        FIRST_PIECE: { code: 'FIRST_PIECE', status: 'skipped', data: {} },
        DATA_COLLECT: {
          code: 'DATA_COLLECT', status: 'completed',
          startTime: `${now} 09:30`, endTime: `${now} 11:15`,
          operator: DEMO_BATCH.operators.mixOp,
          data: {
            dc_table: [
              { equip_no: 'MIX-3D-001', mix_speed: '15', mix_time: '30', mix_rsd: '2.8', temp: '23.0', humidity: '46' },
            ],
            mix_equip: 'MIX-3D-001',
            mix_speed: '15',
            mix_time: '30',
            mix_rsd: '2.8',
            rsd_pass: true,
            temp: '23.0',
            humidity: '46',
          },
        },
        SELF_CHECK: { code: 'SELF_CHECK', status: 'skipped', data: {} },
        POST_CLEAN: { code: 'POST_CLEAN', status: 'skipped', data: {} },
        REPORT: {
          code: 'REPORT', status: 'completed',
          startTime: `${now} 11:15`, endTime: `${now} 11:30`,
          operator: DEMO_BATCH.operators.mixOp,
          data: {
            rpt_finish: 3000, rpt_good: 3000, rpt_bad: 0, rpt_scrap: 0,
            rpt_operator: DEMO_BATCH.operators.mixOp,
            rpt_equip: 'MIX-3D-001', rpt_equip_name: '三维混合机',
            rpt_params: [
              { label: '混合转速', value: '15', unit: 'rpm' },
              { label: '混合时间', value: '30', unit: 'min' },
              { label: '混合均匀性RSD', value: '2.8', unit: '%（≤5% 合格）' },
            ],
          },
        },
        CHECK_OUT: {
          code: 'CHECK_OUT', status: 'completed',
          startTime: `${now} 11:30`, endTime: `${now} 11:30`,
          operator: DEMO_BATCH.operators.mixOp,
          data: { out_operator: DEMO_BATCH.operators.mixOp },
        },
      },
    },

    'OP-GMP-GRANULATE': {
      opCode: 'OP-GMP-GRANULATE',
      status: 'completed',
      inTime: `${now} 11:35`,
      outTime: `${now} 14:00`,
      finishQty: 3000,
      goodQty: 2988,
      badQty: 0,
      scrapQty: 12,
      reportRecords: [],
      firstPiecePassed: true,
      preCleanDone: true,
      stages: {
        PRE_CLEAN: {
          code: 'PRE_CLEAN', status: 'completed',
          startTime: `${now} 11:35`, endTime: `${now} 11:50`,
          operator: DEMO_BATCH.operators.granOp,
          data: {
            pc_wo: true, pc_bom: true, pc_cert: true, pc_material: true,
            pc_equip: true, pc_ppe: true, pc_env: true, pc_record: true, pc_qapprove: true,
            clean_cert_no: 'CC-GD-20260614-003',
            clean_cert_expiry: `${now} 11:30 → 2026-06-17 11:30`,
            temp: '22.8', humidity: '44',
          },
        },
        CHECK_IN: {
          code: 'CHECK_IN', status: 'completed',
          startTime: `${now} 11:50`, endTime: `${now} 11:55`,
          operator: DEMO_BATCH.operators.granOp,
          data: { in_barcode: DEMO_BATCH.batchNo },
        },
        MAT_VERIFY: { code: 'MAT_VERIFY', status: 'skipped', data: {} },
        FIRST_PIECE: { code: 'FIRST_PIECE', status: 'skipped', data: {} },
        DATA_COLLECT: {
          code: 'DATA_COLLECT', status: 'completed',
          startTime: `${now} 12:00`, endTime: `${now} 13:45`,
          operator: DEMO_BATCH.operators.granOp,
          data: {
            dc_table: [
              { inlet_temp: '80', outlet_temp: '45', dry_time: '40', moisture: '1.8', mesh: '20目', equip_no: 'GRA-001', temp: '22.8', humidity: '44' },
            ],
            inlet_temp: '80',
            outlet_temp: '45',
            dry_time: '40',
            moisture: '1.8',
            moisture_pass: true,
            mesh: '20目',
            granule_equip: 'GRA-001',
            temp: '22.8',
            humidity: '44',
          },
        },
        SELF_CHECK: { code: 'SELF_CHECK', status: 'skipped', data: {} },
        POST_CLEAN: { code: 'POST_CLEAN', status: 'skipped', data: {} },
        REPORT: {
          code: 'REPORT', status: 'completed',
          startTime: `${now} 13:45`, endTime: `${now} 14:00`,
          operator: DEMO_BATCH.operators.granOp,
          data: {
            rpt_finish: 3000, rpt_good: 2988, rpt_bad: 0, rpt_scrap: 12,
            rpt_operator: DEMO_BATCH.operators.granOp,
            rpt_equip: 'GRA-001', rpt_equip_name: '流化床制粒机',
            rpt_params: [
              { label: '进风温度', value: '80', unit: '℃' },
              { label: '出风温度', value: '45', unit: '℃' },
              { label: '干燥时间', value: '40', unit: 'min' },
              { label: '颗粒水分', value: '1.8', unit: '%（≤3.0% 合格）' },
              { label: '过筛目数', value: '20', unit: '目' },
            ],
          },
        },
        CHECK_OUT: {
          code: 'CHECK_OUT', status: 'completed',
          startTime: `${now} 14:00`, endTime: `${now} 14:00`,
          operator: DEMO_BATCH.operators.granOp,
          data: { out_operator: DEMO_BATCH.operators.granOp },
        },
      },
    },

    'OP-GMP-INNERPACK': {
      opCode: 'OP-GMP-INNERPACK',
      status: 'completed',
      inTime: `${now} 14:10`,
      outTime: `${now} 17:30`,
      finishQty: 2988,
      goodQty: 2975,
      badQty: 8,
      scrapQty: 5,
      reportRecords: [],
      firstPiecePassed: true,
      preCleanDone: true,
      stages: {
        PRE_CLEAN: {
          code: 'PRE_CLEAN', status: 'completed',
          startTime: `${now} 14:10`, endTime: `${now} 14:25`,
          operator: DEMO_BATCH.operators.innerOp,
          data: {
            pc_wo: true, pc_bom: true, pc_cert: true, pc_material: true,
            pc_equip: true, pc_ppe: true, pc_env: true, pc_record: true, pc_qapprove: true,
            clean_cert_no: 'CC-PK-20260614-001',
            clean_cert_expiry: `${now} 14:00 → 2026-06-17 14:00`,
            temp: '22.0', humidity: '43',
          },
        },
        CHECK_IN: {
          code: 'CHECK_IN', status: 'completed',
          startTime: `${now} 14:25`, endTime: `${now} 14:30`,
          operator: DEMO_BATCH.operators.innerOp,
          data: { in_barcode: DEMO_BATCH.batchNo },
        },
        MAT_VERIFY: {
          code: 'MAT_VERIFY', status: 'completed',
          startTime: `${now} 14:30`, endTime: `${now} 14:45`,
          operator: DEMO_BATCH.operators.innerOp,
          data: {
            mat_table: [
              { mat_name: 'HDPE瓶（120片装）', mat_code: 'PM-HDPE-120', mat_lotno: 'BTL-20260612-A', mat_qty: '3000个', mat_status: '合格', mat_check: true },
              { mat_name: '铝箔垫片', mat_code: 'PM-ALF-001', mat_lotno: 'ALF-20260610-B', mat_qty: '3000片', mat_status: '合格', mat_check: true },
              { mat_name: 'PE瓶盖（白色防盗盖）', mat_code: 'PM-CAP-W', mat_lotno: 'CAP-20260611-C', mat_qty: '3000个', mat_status: '合格', mat_check: true },
            ],
          },
        },
        FIRST_PIECE: {
          code: 'FIRST_PIECE', status: 'completed',
          startTime: `${now} 14:45`, endTime: `${now} 15:00`,
          operator: DEMO_BATCH.operators.innerOp,
          data: {
            fp_fill_weight: '120.2',
            fp_fill_target: '120.0',
            fp_fill_pass: true,
            fp_seal_check: '合格',
            fp_label_check: '合格',
            fp_verifier: DEMO_BATCH.operators.supervisor,
            fp_qa_sign: DEMO_BATCH.operators.qaOp,
          },
        },
        DATA_COLLECT: {
          code: 'DATA_COLLECT', status: 'completed',
          startTime: `${now} 15:00`, endTime: `${now} 17:15`,
          operator: DEMO_BATCH.operators.innerOp,
          data: {
            dc_table: [
              { check_time: `${now} 15:00`, fill_qty: '5', fill_weight: '120.2', seal_check: '合格', label_check: '合格', temp: '22.0', humidity: '43' },
              { check_time: `${now} 16:00`, fill_qty: '5', fill_weight: '119.8', seal_check: '合格', label_check: '合格', temp: '22.1', humidity: '43' },
              { check_time: `${now} 17:00`, fill_qty: '5', fill_weight: '120.1', seal_check: '合格', label_check: '合格', temp: '22.0', humidity: '44' },
            ],
            pack_line: 'PK-LINE-01',
            fill_spec: '120片/瓶（120.0g±6.0g）',
            temp: '22.0', humidity: '43',
          },
        },
        SELF_CHECK: { code: 'SELF_CHECK', status: 'skipped', data: {} },
        POST_CLEAN: {
          code: 'POST_CLEAN', status: 'completed',
          startTime: `${now} 17:15`, endTime: `${now} 17:25`,
          operator: DEMO_BATCH.operators.innerOp,
          data: {
            post_clean_operator: DEMO_BATCH.operators.innerOp,
            post_clean_supervisor: DEMO_BATCH.operators.supervisor,
            post_clean_qa: DEMO_BATCH.operators.qaOp,
            material_balance_bottles: '3000/2988/12（计划/实际/差异）',
            clean_cert_applied: true,
          },
        },
        REPORT: {
          code: 'REPORT', status: 'completed',
          startTime: `${now} 17:25`, endTime: `${now} 17:30`,
          operator: DEMO_BATCH.operators.innerOp,
          data: {
            rpt_finish: 2988, rpt_good: 2975, rpt_bad: 8, rpt_scrap: 5,
            rpt_operator: DEMO_BATCH.operators.innerOp,
            rpt_equip: 'PK-LINE-01', rpt_equip_name: '瓶装生产线',
            rpt_params: [
              { label: '装量规格', value: '120片/瓶', unit: '' },
              { label: '装量差异范围', value: '119.8~120.2', unit: 'g（±5%范围内）' },
              { label: '密封检查', value: '全部合格', unit: '' },
            ],
          },
        },
        CHECK_OUT: {
          code: 'CHECK_OUT', status: 'completed',
          startTime: `${now} 17:30`, endTime: `${now} 17:30`,
          operator: DEMO_BATCH.operators.innerOp,
          data: { out_operator: DEMO_BATCH.operators.innerOp },
        },
      },
    },

    'OP-GMP-INNERCLEAN': {
      opCode: 'OP-GMP-INNERCLEAN',
      status: 'completed',
      inTime: `${now} 17:35`,
      outTime: `${now} 18:00`,
      finishQty: 2975,
      goodQty: 2975,
      badQty: 0,
      scrapQty: 0,
      reportRecords: [],
      firstPiecePassed: true,
      preCleanDone: true,
      stages: {
        PRE_CLEAN: { code: 'PRE_CLEAN', status: 'skipped', data: {} },
        CHECK_IN: {
          code: 'CHECK_IN', status: 'completed',
          startTime: `${now} 17:35`, endTime: `${now} 17:40`,
          operator: DEMO_BATCH.operators.qaOp,
          data: { in_barcode: DEMO_BATCH.batchNo },
        },
        MAT_VERIFY: { code: 'MAT_VERIFY', status: 'skipped', data: {} },
        FIRST_PIECE: { code: 'FIRST_PIECE', status: 'skipped', data: {} },
        DATA_COLLECT: { code: 'DATA_COLLECT', status: 'skipped', data: {} },
        SELF_CHECK: { code: 'SELF_CHECK', status: 'skipped', data: {} },
        POST_CLEAN: {
          code: 'POST_CLEAN', status: 'completed',
          startTime: `${now} 17:40`, endTime: `${now} 17:55`,
          operator: DEMO_BATCH.operators.innerOp,
          data: {
            clean_op: DEMO_BATCH.operators.innerOp,
            clean_supervisor: DEMO_BATCH.operators.supervisor,
            clean_qa: DEMO_BATCH.operators.qaOp,
            clean_result: '合格',
            clean_cert_no: 'CC-PK-20260614-002',
            clean_cert_expiry: `${now} 18:00 → 2026-06-17 18:00`,
          },
        },
        REPORT: {
          code: 'REPORT', status: 'completed',
          startTime: `${now} 17:55`, endTime: `${now} 18:00`,
          operator: DEMO_BATCH.operators.qaOp,
          data: {
            rpt_finish: 2975, rpt_good: 2975, rpt_bad: 0, rpt_scrap: 0,
            rpt_operator: DEMO_BATCH.operators.qaOp,
            rpt_equip: '', rpt_equip_name: '',
            rpt_params: [
              { label: '清场合格证编号', value: 'CC-PK-20260614-002', unit: '' },
              { label: '清场有效期', value: '72小时', unit: '' },
            ],
          },
        },
        CHECK_OUT: { code: 'CHECK_OUT', status: 'skipped', data: {} },
      },
    },

    'OP-GMP-OUTERPACK': {
      opCode: 'OP-GMP-OUTERPACK',
      status: 'completed',
      inTime: `2026-06-15 08:00`,
      outTime: `2026-06-15 11:30`,
      finishQty: 2975,
      goodQty: 2970,
      badQty: 3,
      scrapQty: 2,
      reportRecords: [],
      firstPiecePassed: true,
      preCleanDone: true,
      stages: {
        PRE_CLEAN: {
          code: 'PRE_CLEAN', status: 'completed',
          startTime: `2026-06-15 08:00`, endTime: `2026-06-15 08:15`,
          operator: DEMO_BATCH.operators.outerOp,
          data: {
            pc_wo: true, pc_bom: true, pc_cert: true, pc_material: true,
            pc_equip: true, pc_ppe: true, pc_env: true, pc_record: true, pc_qapprove: true,
            clean_cert_no: 'CC-PK-20260614-002',
            clean_cert_expiry: `2026-06-14 18:00 → 2026-06-17 18:00（剩余有效期内）`,
            temp: '22.5', humidity: '44',
          },
        },
        CHECK_IN: {
          code: 'CHECK_IN', status: 'completed',
          startTime: `2026-06-15 08:15`, endTime: `2026-06-15 08:20`,
          operator: DEMO_BATCH.operators.outerOp,
          data: { in_barcode: DEMO_BATCH.batchNo },
        },
        MAT_VERIFY: {
          code: 'MAT_VERIFY', status: 'completed',
          startTime: `2026-06-15 08:20`, endTime: `2026-06-15 08:35`,
          operator: DEMO_BATCH.operators.outerOp,
          data: {
            mat_table: [
              { mat_name: '外包纸盒', mat_code: 'PM-BOX-VitC', mat_lotno: 'BOX-20260612-A', mat_qty: '2975个', mat_status: '合格', mat_check: true },
              { mat_name: '产品说明书', mat_code: 'PM-INS-VitC', mat_lotno: 'INS-2026-V3.0', mat_qty: '2975张', mat_status: '合格', mat_check: true },
              { mat_name: '合格证', mat_code: 'PM-CERT-VitC', mat_lotno: 'CERT-2026-B', mat_qty: '2975张', mat_status: '合格', mat_check: true },
              { mat_name: '大箱（12瓶/箱）', mat_code: 'PM-CTN-12', mat_lotno: 'CTN-20260613-C', mat_qty: '250箱', mat_status: '合格', mat_check: true },
            ],
          },
        },
        FIRST_PIECE: { code: 'FIRST_PIECE', status: 'skipped', data: {} },
        DATA_COLLECT: {
          code: 'DATA_COLLECT', status: 'completed',
          startTime: `2026-06-15 08:40`, endTime: `2026-06-15 11:15`,
          operator: DEMO_BATCH.operators.outerOp,
          data: {
            dc_table: [
              { check_time: `2026-06-15 09:00`, bottles_per_box: '12', insert_check: '合格', batch_print: 'BN-20260614-001', seal_check: '合格', code_verify: '合格' },
              { check_time: `2026-06-15 10:00`, bottles_per_box: '12', insert_check: '合格', batch_print: 'BN-20260614-001', seal_check: '合格', code_verify: '合格' },
              { check_time: `2026-06-15 11:00`, bottles_per_box: '12', insert_check: '合格', batch_print: 'BN-20260614-001', seal_check: '合格', code_verify: '合格' },
            ],
            carton_spec: '12瓶/箱',
            batch_print_check: '合格',
            manual_version: 'V3.0（2026-01-01）',
            temp: '22.5', humidity: '44',
          },
        },
        SELF_CHECK: { code: 'SELF_CHECK', status: 'skipped', data: {} },
        POST_CLEAN: {
          code: 'POST_CLEAN', status: 'completed',
          startTime: `2026-06-15 11:15`, endTime: `2026-06-15 11:25`,
          operator: DEMO_BATCH.operators.outerOp,
          data: {
            post_clean_operator: DEMO_BATCH.operators.outerOp,
            post_clean_supervisor: DEMO_BATCH.operators.supervisor,
            post_clean_qa: DEMO_BATCH.operators.qaOp,
            material_balance_boxes: '250/247/3（计划/实际/差异）',
            clean_cert_applied: true,
          },
        },
        REPORT: {
          code: 'REPORT', status: 'completed',
          startTime: `2026-06-15 11:25`, endTime: `2026-06-15 11:30`,
          operator: DEMO_BATCH.operators.outerOp,
          data: {
            rpt_finish: 2975, rpt_good: 2970, rpt_bad: 3, rpt_scrap: 2,
            rpt_operator: DEMO_BATCH.operators.outerOp,
            rpt_equip: 'PKG-LINE-02', rpt_equip_name: '外包装线',
            rpt_params: [
              { label: '装箱规格', value: '12瓶/箱', unit: '' },
              { label: '说明书版本', value: 'V3.0（2026-01-01）', unit: '' },
              { label: '批号打印', value: 'BN-20260614-001', unit: '' },
              { label: '有效期打印', value: '2028-06-13', unit: '' },
            ],
          },
        },
        CHECK_OUT: {
          code: 'CHECK_OUT', status: 'completed',
          startTime: `2026-06-15 11:30`, endTime: `2026-06-15 11:30`,
          operator: DEMO_BATCH.operators.outerOp,
          data: { out_operator: DEMO_BATCH.operators.outerOp },
        },
      },
    },
  };
}

// ==================== 生产订单数据 ====================
function buildDemoPO() {
  return {
    id: DEMO_BATCH.poId,
    orderNo: DEMO_BATCH.poNo,
    soNo: DEMO_BATCH.soNo,
    productCode: DEMO_BATCH.productCode,
    productName: DEMO_BATCH.productName,
    productSpec: DEMO_BATCH.productSpec,
    bomVersion: 'V1.0',
    routingCode: 'GMP-PACKAGE-V1',
    totalQty: 3000,
    completedQty: 2970,
    scrapQty: 30,
    deliveryDate: DEMO_BATCH.deliveryDate,
    priority: 'HIGH',
    status: 'COMPLETED',
    isAudited: true,
    auditedBy: DEMO_BATCH.operators.supervisor,
    auditedAt: '2026-06-13 16:30',
    remark: '天美健维生素C咀嚼片，出口日本市场，交货期紧',
    createdAt: '2026-06-13 09:00',
    createdBy: '生产计划员小方',
    workOrders: [DEMO_BATCH.woId],
  };
}

// ==================== 生产工单数据 ====================
function buildDemoWO() {
  return {
    id: DEMO_BATCH.woId,
    woNo: DEMO_BATCH.woNo,
    poId: DEMO_BATCH.poId,
    poNo: DEMO_BATCH.poNo,
    batchNo: DEMO_BATCH.batchNo,
    productCode: DEMO_BATCH.productCode,
    productName: DEMO_BATCH.productName,
    productSpec: DEMO_BATCH.productSpec,
    bomVersion: 'V1.0',
    routingCode: 'GMP-PACKAGE-V1',
    routingName: '天美健保健品GMP包装路线 V1.0',
    planQty: 3000,
    actualQty: 2970,
    scrapQty: 30,
    status: 'COMPLETED',
    priority: 'HIGH',
    releaseTime: '2026-06-13 17:00',
    planStart: '2026-06-14 07:00',
    planEnd: '2026-06-15 18:00',
    actualStart: '2026-06-14 07:30',
    actualEnd: '2026-06-15 11:30',
    currentOp: 'OP-GMP-OUTERPACK',
    progressPct: 100,
    createdAt: '2026-06-13 09:00',
    createdBy: '生产计划员小方',
    remark: '按批指令执行，批号BN-20260614-001，质量合格后放行',
  };
}

// ==================== 生产领料单 ====================
function buildPickList() {
  return {
    id: 'PK-20260614-001',
    pickNo: 'PICK-20260614-001',
    woNo: DEMO_BATCH.woNo,
    batchNo: DEMO_BATCH.batchNo,
    productName: DEMO_BATCH.productName,
    reqDate: '2026-06-14',
    requiredBy: DEMO_BATCH.operators.weighOp,
    approvedBy: DEMO_BATCH.operators.supervisor,
    status: 'ISSUED',
    items: [
      { seq: 1, matCode: 'RM-VitC-001', matName: '维生素C（抗坏血酸）', spec: '食品级，含量≥99.7%', unit: 'g', planQty: 360000, actualQty: 360012, lotNo: 'VitC-20260601-A', location: 'WH-A-01', pickOp: DEMO_BATCH.operators.weighOp },
      { seq: 2, matCode: 'RM-XYL-001', matName: '木糖醇', spec: '食品级，纯度≥99%', unit: 'g', planQty: 60000, actualQty: 59998, lotNo: 'XYL-20260602-B', location: 'WH-A-02', pickOp: DEMO_BATCH.operators.weighOp },
      { seq: 3, matCode: 'RM-CIT-001', matName: '柠檬酸', spec: '食品级，含量≥99.5%', unit: 'g', planQty: 12000, actualQty: 12001, lotNo: 'CIT-20260603-A', location: 'WH-A-03', pickOp: DEMO_BATCH.operators.weighOp },
      { seq: 4, matCode: 'RM-SIO2-001', matName: '二氧化硅（助流剂）', spec: '药用辅料级', unit: 'g', planQty: 6000, actualQty: 6000, lotNo: 'SIO2-20260601-C', location: 'WH-B-01', pickOp: DEMO_BATCH.operators.weighOp },
      { seq: 5, matCode: 'RM-MgSt-001', matName: '硬脂酸镁（润滑剂）', spec: '药用辅料级', unit: 'g', planQty: 1800, actualQty: 1800, lotNo: 'MgSt-20260604-A', location: 'WH-B-02', pickOp: DEMO_BATCH.operators.weighOp },
      { seq: 6, matCode: 'PM-HDPE-120', matName: 'HDPE瓶（120片装）', spec: '120mL白色HDPE，含硅胶干燥剂', unit: '个', planQty: 3000, actualQty: 3000, lotNo: 'BTL-20260612-A', location: 'WH-C-01', pickOp: DEMO_BATCH.operators.innerOp },
      { seq: 7, matCode: 'PM-ALF-001', matName: '铝箔垫片', spec: '电磁感应铝箔，Φ38mm', unit: '片', planQty: 3000, actualQty: 3000, lotNo: 'ALF-20260610-B', location: 'WH-C-02', pickOp: DEMO_BATCH.operators.innerOp },
      { seq: 8, matCode: 'PM-CAP-W', matName: 'PE瓶盖（白色防盗盖）', spec: 'Φ38mm白色', unit: '个', planQty: 3000, actualQty: 3000, lotNo: 'CAP-20260611-C', location: 'WH-C-03', pickOp: DEMO_BATCH.operators.innerOp },
      { seq: 9, matCode: 'PM-BOX-VitC', matName: '外包纸盒', spec: '天美健维生素C咀嚼片专用', unit: '个', planQty: 2975, actualQty: 2980, lotNo: 'BOX-20260612-A', location: 'WH-D-01', pickOp: DEMO_BATCH.operators.outerOp },
      { seq: 10, matCode: 'PM-INS-VitC', matName: '产品说明书', spec: 'V3.0（2026-01-01），双面印刷', unit: '张', planQty: 2975, actualQty: 2980, lotNo: 'INS-2026-V3.0', location: 'WH-D-02', pickOp: DEMO_BATCH.operators.outerOp },
    ],
  };
}

// ==================== 半成品入库单 ====================
function buildSemiGoodsReceipt() {
  return {
    id: 'WR-SEMI-20260614-001',
    receiptNo: 'SGR-20260614-001',
    woNo: DEMO_BATCH.woNo,
    batchNo: DEMO_BATCH.batchNo,
    productName: `${DEMO_BATCH.productName}（颗粒半成品）`,
    productSpec: '1000mg规格，制粒完成，待内包',
    qty: 2988,
    unit: '批（约439kg颗粒）',
    qualityResult: 'PASS',
    inspectionNo: 'QC-SEMI-20260614-001',
    warehouseLocation: 'WH-SEMI-01',
    receiptTime: '2026-06-14 14:05',
    receiptBy: DEMO_BATCH.operators.warehouseOp,
    qcApproved: DEMO_BATCH.operators.qcOp,
    remark: '颗粒水分1.8%合格，粒径20目通过，待内包装',
  };
}

// ==================== 成品入库单 ====================
function buildFinishedGoodsReceipt() {
  return {
    id: 'WR-FG-20260615-001',
    receiptNo: 'FGR-20260615-001',
    woNo: DEMO_BATCH.woNo,
    batchNo: DEMO_BATCH.batchNo,
    productCode: DEMO_BATCH.productCode,
    productName: DEMO_BATCH.productName,
    productSpec: DEMO_BATCH.productSpec,
    qty: 2970,
    unit: '瓶',
    boxes: 247,
    cartonSpec: '12瓶/箱',
    qualityResult: 'APPROVED',
    inspectionNo: 'QC-FG-20260615-001',
    releaseNo: 'REL-20260615-001',
    warehouseLocation: 'WH-FG-A03',
    receiptTime: '2026-06-15 16:00',
    receiptBy: DEMO_BATCH.operators.warehouseOp,
    qaApproved: DEMO_BATCH.operators.qaMgr,
    expiryDate: '2028-06-13',
    productionDate: '2026-06-14',
    remark: '质量放行后入库，出口日本，需冷链储存',
  };
}

// ==================== 检验数据 ====================
function buildInspectionData() {
  return {
    // 过程检验1：混合均匀性
    ipqc1: {
      id: 'QC-IPQC-20260614-001',
      taskNo: 'IT-20260614-001',
      type: '过程检验（混合均匀性）',
      schemeCode: 'ISP-IPQC-MIX-001',
      schemeName: '混合均匀性检验',
      opNo: 'OP-GMP-MIX',
      batchNo: DEMO_BATCH.batchNo,
      inspector: DEMO_BATCH.operators.qcOp,
      checker: DEMO_BATCH.operators.qaOp,
      startTime: '2026-06-14 11:00',
      endTime: '2026-06-14 11:30',
      conclusion: 'PASS',
      items: [
        { name: '取样方式', standard: '上/中/下三点各取5g', actual: '按规定取样', result: 'PASS' },
        { name: '混合均匀性RSD', standard: '≤5.0%', actual: '2.8%', result: 'PASS', isCritical: true },
        { name: '维生素C含量（含量均匀度）', standard: '80%~120%标示量', actual: '98.5%', result: 'PASS', isCritical: true },
        { name: '外观', standard: '粉末均匀，无结块', actual: '合格', result: 'PASS' },
        { name: '环境温度', standard: '18~26℃', actual: '23.0℃', result: 'PASS' },
        { name: '环境湿度', standard: '≤60%', actual: '46%', result: 'PASS' },
      ],
    },
    // 过程检验2：颗粒中间体
    ipqc2: {
      id: 'QC-IPQC-20260614-002',
      taskNo: 'IT-20260614-002',
      type: '半成品检验（颗粒中间体）',
      schemeCode: 'ISP-SEMI-GRA-001',
      schemeName: '颗粒中间体检验',
      opNo: 'OP-GMP-GRANULATE',
      batchNo: DEMO_BATCH.batchNo,
      inspector: DEMO_BATCH.operators.qcOp,
      checker: DEMO_BATCH.operators.qaOp,
      startTime: '2026-06-14 13:50',
      endTime: '2026-06-14 14:08',
      conclusion: 'PASS',
      items: [
        { name: '颗粒水分（LOD）', standard: '≤3.0%', actual: '1.8%', result: 'PASS', isCritical: true },
        { name: '颗粒粒径', standard: '20目通过≥95%', actual: '97.2%', result: 'PASS', isCritical: true },
        { name: '颗粒外观', standard: '均匀，无异色，无结块', actual: '合格', result: 'PASS' },
        { name: '颗粒松密度', standard: '0.3~0.5g/mL', actual: '0.42g/mL', result: 'PASS' },
        { name: '颗粒流动性（休止角）', standard: '≤40°', actual: '32°', result: 'PASS' },
      ],
    },
    // 过程检验3：内包装装量差异
    ipqc3: {
      id: 'QC-IPQC-20260614-003',
      taskNo: 'IT-20260614-003',
      type: '过程检验（内包装装量差异）',
      schemeCode: 'ISP-IPQC-INNER-001',
      schemeName: '内包装装量差异检验',
      opNo: 'OP-GMP-INNERPACK',
      batchNo: DEMO_BATCH.batchNo,
      inspector: DEMO_BATCH.operators.qcOp,
      checker: DEMO_BATCH.operators.qaOp,
      startTime: '2026-06-14 15:00',
      endTime: '2026-06-14 17:20',
      conclusion: 'PASS',
      items: [
        { name: '装量（15:00抽5瓶）', standard: '120g±6g（±5%）', actual: '120.2/119.9/120.1/120.0/120.3g', result: 'PASS', isCritical: true },
        { name: '装量（16:00抽5瓶）', standard: '120g±6g（±5%）', actual: '119.8/120.2/120.1/119.9/120.2g', result: 'PASS', isCritical: true },
        { name: '装量（17:00抽5瓶）', standard: '120g±6g（±5%）', actual: '120.1/120.0/119.8/120.3/120.1g', result: 'PASS', isCritical: true },
        { name: '密封检查', standard: '铝箔封口完整', actual: '合格', result: 'PASS' },
        { name: '标签检查', standard: '批号/有效期印刷清晰正确', actual: '合格，BN-20260614-001', result: 'PASS' },
        { name: '瓶盖扭力', standard: '≥1.5N·m', actual: '1.8N·m', result: 'PASS' },
      ],
    },
    // 成品检验
    fqc: {
      id: 'QC-FQC-20260615-001',
      taskNo: 'IT-20260615-001',
      type: '成品检验（FQC）',
      schemeCode: 'ISP-FQC-VitC-001',
      schemeName: '天美健维生素C咀嚼片成品检验',
      batchNo: DEMO_BATCH.batchNo,
      sampleQty: 30,
      inspector: DEMO_BATCH.operators.qcOp,
      checker: DEMO_BATCH.operators.qaOp,
      startTime: '2026-06-15 12:00',
      endTime: '2026-06-15 15:30',
      conclusion: 'PASS',
      items: [
        { name: '外观', standard: '白色或类白色，圆形咀嚼片，无裂片', actual: '合格', result: 'PASS', isCritical: true },
        { name: '重量差异', standard: '±5%（1000mg±50mg）', actual: '最大偏差2.8%', result: 'PASS', isCritical: true },
        { name: '崩解时限', standard: '≤3分钟（咀嚼片）', actual: '2分15秒', result: 'PASS', isCritical: true },
        { name: '含量（维生素C）', standard: '标示量的90%~110%（900mg~1100mg）', actual: '972mg（97.2%）', result: 'PASS', isCritical: true },
        { name: '含量均匀度', standard: 'AV≤15', actual: 'AV=4.2', result: 'PASS', isCritical: true },
        { name: '硬度', standard: '≥40N', actual: '65N', result: 'PASS' },
        { name: '脆碎度', standard: '≤0.8%', actual: '0.12%', result: 'PASS' },
        { name: '微生物限度（总需氧菌）', standard: '≤1000CFU/g', actual: '<10CFU/g', result: 'PASS', isCritical: true },
        { name: '标签/批号核查', standard: 'BN-20260614-001', actual: '已核对，正确', result: 'PASS' },
        { name: '包装完整性', standard: '铝箔封口完整，无渗漏', actual: '合格', result: 'PASS' },
      ],
    },
  };
}

// ==================== 质量放行数据 ====================
function buildReleaseData() {
  return {
    id: 'REL-20260615-001',
    releaseNo: 'REL-20260615-001',
    batchNo: DEMO_BATCH.batchNo,
    productName: DEMO_BATCH.productName,
    productSpec: DEMO_BATCH.productSpec,
    planQty: 3000,
    actualQty: 2970,
    yieldRate: 99.0,
    materialBalanceRate: 99.0,
    fqcResult: 'PASS',
    deviationCount: 0,
    status: 'APPROVED',
    reviewLevel: [
      { level: '第一级', role: 'QC检验员', person: DEMO_BATCH.operators.qcOp, time: '2026-06-15 15:30', action: '审核通过', remark: '全部检验项目符合标准，建议放行' },
      { level: '第二级', role: 'QA专员', person: DEMO_BATCH.operators.qaOp, time: '2026-06-15 15:50', action: '审核通过', remark: '批记录完整，工艺参数合规，无偏差，建议放行' },
      { level: '第三级', role: 'QA经理', person: DEMO_BATCH.operators.qaMgr, time: '2026-06-15 16:00', action: '批准放行', remark: '产品质量符合企业标准，批准放行' },
    ],
    releaseTime: '2026-06-15 16:00',
    releasedBy: DEMO_BATCH.operators.qaMgr,
    warehouseEntryTime: '2026-06-15 16:30',
    nextAction: '安排发货，交货日期2026-06-25',
  };
}

// ==================== 偏差数据 ====================
function buildDeviationData() {
  return {
    // 正常批次（无偏差），作为对比
    normalBatch: {
      batchNo: DEMO_BATCH.batchNo,
      deviations: [],
      conclusion: '无偏差',
    },
    // 偏差场景1：混合RSD超标（演示用）
    deviation1: {
      id: 'DEV-20260614-DEMO-001',
      devNo: 'DEV-20260614-001',
      type: '工艺偏差',
      title: '混合均匀性RSD超标',
      batchNo: 'BN-20260614-DEVTEST',
      opNo: 'OP-GMP-MIX',
      opName: '混合',
      description: '混合工序三维混合机混合30分钟后，取样检测混合均匀性RSD=6.8%，超出规定值≤5.0%，偏差发生。',
      discoveredAt: '2026-06-14 11:20',
      discoveredBy: DEMO_BATCH.operators.qcOp,
      severity: '重大偏差（影响产品质量）',
      immediateAction: [
        '立即停机，暂停生产',
        '对混合后物料进行隔离标识（待评估）',
        '通知QA专员',
        '保留偏差样品',
      ],
      rootCause: '混合机料斗装料量超出设计容量（超出规定装料量的110%），导致混合不均匀',
      capa: [
        { type: '纠正措施', action: '将物料分为两批次重新混合，每批次混合量控制在规定量80%以内' },
        { type: '纠正措施', action: '复检RSD，结果2.3%，合格，继续生产' },
        { type: '预防措施', action: '修订批生产记录，增加称量前料斗容量核查步骤' },
        { type: '预防措施', action: '更新SOP，明确每批最大装料量' },
        { type: '验证措施', action: '下3批次加强混合均匀性监控，收集数据' },
      ],
      status: '已关闭',
      closedAt: '2026-06-15 10:00',
      closedBy: DEMO_BATCH.operators.qaMgr,
      closureRemark: '偏差已处理，重混后产品合格，已更新SOP，CAPA措施已完成',
      impactAssessment: '偏差批次物料经重混后RSD合格，不影响产品质量，无需销毁',
    },
    // 偏差场景2：物料平衡率异常
    deviation2: {
      id: 'DEV-20260615-DEMO-002',
      devNo: 'DEV-20260615-001',
      type: '工艺偏差',
      title: '物料平衡率低于下限（外包装）',
      batchNo: 'BN-20260614-DEVTEST',
      opNo: 'OP-GMP-OUTERPACK',
      opName: '外包装',
      description: '外包装工序结束后，物料平衡核算：实际装盒数2800盒，投入纸盒2975个，物料平衡率=2800/2975×100%=94.1%，低于规定下限96.0%。',
      discoveredAt: '2026-06-15 11:30',
      discoveredBy: DEMO_BATCH.operators.outerOp,
      severity: '主要偏差（物料平衡异常）',
      immediateAction: [
        '停止外包装，暂不入库',
        '重新清点成品数量（全清点）',
        '检查废品/退料记录',
        '通知QA处理',
      ],
      rootCause: '经全清点发现，实际成品2968瓶，另有8瓶在QC留样室（未计入），纸盒废品7个（封口不良），纸盒发货多领5个未退还（已找回）。重新核算：2968+8=2976瓶/产出（99.9%），7个废纸盒已销毁，偏差消除',
      capa: [
        { type: '纠正措施', action: 'QC留样品纳入物料平衡统计，重新核算物料平衡率=99.9%，合格' },
        { type: '纠正措施', action: '补充填写QC留样登记表，在物料平衡表中体现' },
        { type: '预防措施', action: '修订物料平衡SOP，明确QC留样计入物料平衡的操作规程' },
        { type: '预防措施', action: '增加外包装前领料核对步骤（多领/少领必须当班退还）' },
      ],
      status: '已关闭',
      closedAt: '2026-06-15 15:00',
      closedBy: DEMO_BATCH.operators.qaMgr,
      closureRemark: '偏差系统性误差所致，重新核算后物料平衡率99.9%，合格，CAPA已完成',
      impactAssessment: '不影响产品质量，物料无实际损失',
    },
  };
}

// ==================== 完整演示测试用例步骤 ====================
const DEMO_STEPS = [
  {
    key: 'bom',
    title: 'BOM基础档案',
    icon: <DatabaseOutlined />,
    desc: '天美健维生素C咀嚼片BOM',
    details: [
      '成品代码: FG-VitC-1000-120',
      '原料5种: 维生素C(360kg)、木糖醇(60kg)、柠檬酸(12kg)、二氧化硅(6kg)、硬脂酸镁(1.8kg)',
      '内包材3种: HDPE瓶、铝箔垫片、PE瓶盖',
      '外包材4种: 纸盒、说明书、合格证、大箱',
      '工艺路线: 称量配料→混合→制粒干燥→内包装→内包清场→外包装',
    ],
    storageKey: 'bip_demo_bom',
    color: '#1890ff',
  },
  {
    key: 'po',
    title: '生产订单',
    icon: <FileTextOutlined />,
    desc: 'MO-20260614-001（含领料/入库单）',
    details: [
      '订单号: MO-20260614-001',
      '计划数量: 3000瓶',
      '交货日期: 2026-06-25',
      '优先级: 紧急',
      '关联销售订单: SO-20260610-188',
      '生产领料单: PICK-20260614-001（10种物料）',
    ],
    storageKey: 'bip_production_orders',
    color: '#52c41a',
  },
  {
    key: 'wo',
    title: '生产工单',
    icon: <ApartmentOutlined />,
    desc: 'WO-20260614-001 / BN-20260614-001',
    details: [
      '工单号: WO-20260614-001',
      '批号: BN-20260614-001',
      '计划开始: 2026-06-14 07:00',
      '实际完成: 2026-06-15 11:30',
      '工艺路线: GMP-PACKAGE-V1（6道工序）',
    ],
    storageKey: 'bip_work_orders',
    color: '#13c2c2',
  },
  {
    key: 'pad',
    title: 'PAD工序执行',
    icon: <PlayCircleOutlined />,
    desc: '6道GMP工序全部完成',
    details: [
      'OP-GMP-WEIGH: 称量配料（07:30-09:00）✓',
      'OP-GMP-MIX: 混合（09:05-11:30）RSD=2.8% ✓',
      'OP-GMP-GRANULATE: 制粒干燥（11:35-14:00）水分1.8% ✓',
      'OP-GMP-INNERPACK: 内包装（14:10-17:30）装量±5% ✓',
      'OP-GMP-INNERCLEAN: 内包清场（17:35-18:00）✓',
      'OP-GMP-OUTERPACK: 外包装（次日08:00-11:30）✓',
    ],
    storageKey: 'bip_pad_exec_map',
    color: '#722ed1',
  },
  {
    key: 'inspection',
    title: '检验记录',
    icon: <ExperimentOutlined />,
    desc: '过程/半成品/成品检验全部PASS',
    details: [
      'IT-001: 混合均匀性检验（RSD=2.8% PASS）',
      'IT-002: 颗粒中间体检验（水分1.8% PASS）',
      'IT-003: 内包装装量差异（±5% PASS）',
      'IT-004: 成品检验FQC（含量97.2% PASS）',
    ],
    storageKey: 'bip_demo_inspections',
    color: '#fa8c16',
  },
  {
    key: 'ebr',
    title: '批记录（EBR）',
    icon: <FileDoneOutlined />,
    desc: '自动生成SOR-MF-PE-02-05格式',
    details: [
      '§1 批包装指令（BOM物料清单）',
      '§2 瓶包线岗位记录（装量检查×3次）',
      '§3 外包装岗位记录（批号/说明书/装箱）',
      '§4 QA监控记录',
      '§5 物料平衡表（99.0% 合格）',
      '§6 成品检验报告',
      '§7 放行审核单（三级签名）',
    ],
    storageKey: 'bip_ebr_records',
    color: '#eb2f96',
  },
  {
    key: 'release',
    title: '质量放行',
    icon: <AuditOutlined />,
    desc: '三级审核，REL-20260615-001',
    details: [
      'QC检验员: 孙静 → 15:30 审核通过',
      'QA专员: 赵敏 → 15:50 审核通过',
      'QA经理: 林总 → 16:00 批准放行',
      '成品入库: WH-FG-A03',
      '入库单: FGR-20260615-001',
    ],
    storageKey: 'bip_demo_release',
    color: '#52c41a',
  },
  {
    key: 'deviation',
    title: '偏差测试（选做）',
    icon: <AlertOutlined />,
    desc: '2个偏差场景演示（不注入正常批次）',
    details: [
      '偏差1: 混合RSD超标（6.8%→重混2.3%，已关闭）',
      '偏差2: 物料平衡率低于下限（94.1%→重计99.9%，已关闭）',
      '以上为演示数据，不影响正常批次BN-20260614-001',
    ],
    storageKey: 'bip_demo_deviations',
    color: '#ff4d4f',
  },
];

// ==================== 主页面组件 ====================
const DemoDataInjectorPage: React.FC = () => {
  const [injectedKeys, setInjectedKeys] = useState<Set<string>>(new Set());
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [confirmVisible, setConfirmVisible] = useState(false);

  // 注入单个步骤数据
  const injectStep = async (stepKey: string) => {
    setLoadingKey(stepKey);
    await new Promise(r => setTimeout(r, 600));

    try {
      const execMap = buildDemoExecMap();
      const po = buildDemoPO();
      const wo = buildDemoWO();
      const pickList = buildPickList();
      const semiReceipt = buildSemiGoodsReceipt();
      const fgReceipt = buildFinishedGoodsReceipt();
      const inspections = buildInspectionData();
      const release = buildReleaseData();
      const deviations = buildDeviationData();

      switch (stepKey) {
        case 'bom': {
          // ── 1. 物料分类（flat数组，供MaterialCategoryPage读取）─────
          const demoMaterialCategories = [
            { id: '10', code: '01', name: '原材料', parentId: undefined },
            { id: '11', code: '0101', name: '主原料', parentId: '10' },
            { id: '12', code: '0102', name: '辅料', parentId: '10' },
            { id: '20', code: '02', name: '半成品', parentId: undefined },
            { id: '21', code: '0201', name: '颗粒中间品', parentId: '20' },
            { id: '22', code: '0202', name: '压片中间品', parentId: '20' },
            { id: '30', code: '03', name: '成品', parentId: undefined },
            { id: '31', code: '0301', name: '内包装成品', parentId: '30' },
            { id: '32', code: '0302', name: '外包装成品', parentId: '30' },
            { id: '40', code: '04', name: '包装材料', parentId: undefined },
            { id: '41', code: '0401', name: '内包材', parentId: '40' },
            { id: '42', code: '0402', name: '外包材', parentId: '40' },
          ];
          localStorage.setItem('bip_material_categories', JSON.stringify(demoMaterialCategories));

          // ── 2. 物料档案（供MaterialPage读取）──────────────────────
          const demoMaterials = [
            { id: 'M001', code: 'RM-VitC-001',  name: '维生素C（抗坏血酸）',  categoryId: '11', type: '原材料', unit: 'kg',   spec: '药用级 USP',          brand: 'DSM',     supplier: '荷兰帝斯曼',       status: 'active', minStock: 500,  maxStock: 5000, price: 85.00 },
            { id: 'M002', code: 'RM-XYL-001',   name: '木糖醇',               categoryId: '11', type: '原材料', unit: 'kg',   spec: '食品级',              brand: '',        supplier: '山东福田药业',     status: 'active', minStock: 200,  maxStock: 2000, price: 18.50 },
            { id: 'M003', code: 'RM-CIT-001',   name: '柠檬酸',               categoryId: '12', type: '辅料',  unit: 'kg',   spec: '食品级 GB/T 8269',    brand: '',        supplier: '安徽柠檬生化',     status: 'active', minStock: 100,  maxStock: 1000, price: 7.20  },
            { id: 'M004', code: 'RM-SIO2-001',  name: '二氧化硅（助流剂）',   categoryId: '12', type: '辅料',  unit: 'kg',   spec: '气相法 SiO2≥99%',    brand: '科宁',    supplier: '广州科宁',         status: 'active', minStock: 50,   maxStock: 500,  price: 32.00 },
            { id: 'M005', code: 'RM-MgSt-001',  name: '硬脂酸镁（润滑剂）',   categoryId: '12', type: '辅料',  unit: 'kg',   spec: '药用级 CP2020',       brand: '',        supplier: '山东信谊',         status: 'active', minStock: 20,   maxStock: 200,  price: 45.00 },
            { id: 'M006', code: 'RM-MCC-001',   name: '微晶纤维素（MCC）',    categoryId: '12', type: '辅料',  unit: 'kg',   spec: 'PH-102',              brand: 'FMC',     supplier: '美国FMC',          status: 'active', minStock: 100,  maxStock: 1000, price: 22.00 },
            { id: 'S001', code: 'WIP-GRAN-001', name: 'VitC制粒中间品',       categoryId: '21', type: '半成品', unit: 'kg',   spec: '粒径20~60目',         brand: '',        supplier: '',                 status: 'active', minStock: 0,    maxStock: 0,    price: 0     },
            { id: 'S002', code: 'WIP-TAB-001',  name: 'VitC压片中间品',       categoryId: '22', type: '半成品', unit: '万片', spec: '直径14mm 重量1.2g',   brand: '',        supplier: '',                 status: 'active', minStock: 0,    maxStock: 0,    price: 0     },
            { id: 'F001', code: DEMO_BATCH.productCode, name: DEMO_BATCH.productName, categoryId: '32', type: '成品', unit: '瓶',  spec: DEMO_BATCH.productSpec, brand: '天美健',  supplier: '',                 status: 'active', minStock: 1000, maxStock: 50000, price: 58.00 },
            { id: 'P001', code: 'PKG-BOTTLE-001', name: 'HDPE白色圆瓶',       categoryId: '41', type: '包装材料', unit: '个', spec: '500ml 带干燥剂孔',     brand: '',        supplier: '广州申菱',         status: 'active', minStock: 5000, maxStock: 50000, price: 1.20 },
            { id: 'P002', code: 'PKG-CAP-001',  name: '防儿童安全盖',         categoryId: '41', type: '包装材料', unit: '个', spec: '53mm 白色 PP',         brand: '',        supplier: '广州申菱',         status: 'active', minStock: 5000, maxStock: 50000, price: 0.35 },
            { id: 'P003', code: 'PKG-LABEL-001', name: '产品标签',            categoryId: '41', type: '包装材料', unit: '张', spec: '100×80mm 铜版纸',      brand: '',        supplier: '深圳正方形印刷',   status: 'active', minStock: 5000, maxStock: 50000, price: 0.08 },
            { id: 'P004', code: 'PKG-BOX-001',  name: '彩色纸盒',             categoryId: '42', type: '包装材料', unit: '个', spec: '105×105×110mm E瓦',   brand: '',        supplier: '深圳正方形印刷',   status: 'active', minStock: 1000, maxStock: 20000, price: 0.65 },
            { id: 'P005', code: 'PKG-CATON-001', name: '外箱纸箱',            categoryId: '42', type: '包装材料', unit: '个', spec: '600×400×400mm 五层B瓦', brand: '',       supplier: '东莞兴宇包装',     status: 'active', minStock: 200,  maxStock: 2000, price: 3.20 },
          ];
          localStorage.setItem('bip_materials', JSON.stringify(demoMaterials));

          // ── 3. BOM列表（BomHeader[]格式，供BomIndex读取）───────────
          const demoBomList = [
            {
              id: 'BOM-VitC-001',
              code: 'BOM-VitC-1000-120',
              name: DEMO_BATCH.productName,
              spec: DEMO_BATCH.productSpec,
              unit: '瓶',
              version: 'V1.0',
              bomType: '主BOM',
              status: 'approved',
              mainQty: 1000,
              mainUnit: '瓶',
              batchQty: 3000,
              calcUnit: '瓶',
              effectDate: '2026-01-01',
              createdBy: '工艺员林工',
              createdAt: '2026-01-01 09:00:00',
              remark: '天美健维生素C咀嚼片标准BOM V1.0',
              children: [
                { id: 'BC001', rowNo: 10, childCode: 'RM-VitC-001', childName: '维生素C（抗坏血酸）', spec: '药用级 USP', freeDesc: '', type: '标准', qty: 120, unit: 'g', childQty: 120, calcUnit: 'g', scrapRate: 0, issueMethod: undefined, remark: '每片120mg，3000瓶×1000片=360000g' },
                { id: 'BC002', rowNo: 20, childCode: 'RM-XYL-001',  childName: '木糖醇',              spec: '食品级',     freeDesc: '', type: '标准', qty: 20,  unit: 'g', childQty: 20,  calcUnit: 'g', scrapRate: 0, issueMethod: undefined, remark: '甜味剂' },
                { id: 'BC003', rowNo: 30, childCode: 'RM-CIT-001',  childName: '柠檬酸',              spec: '食品级',     freeDesc: '', type: '标准', qty: 4,   unit: 'g', childQty: 4,   calcUnit: 'g', scrapRate: 0, issueMethod: undefined, remark: '酸味调节' },
                { id: 'BC004', rowNo: 40, childCode: 'RM-SIO2-001', childName: '二氧化硅（助流剂）',  spec: '气相法',     freeDesc: '', type: '标准', qty: 2,   unit: 'g', childQty: 2,   calcUnit: 'g', scrapRate: 0, issueMethod: undefined, remark: '助流' },
                { id: 'BC005', rowNo: 50, childCode: 'RM-MgSt-001', childName: '硬脂酸镁（润滑剂）',  spec: '药用级',     freeDesc: '', type: '标准', qty: 0.6, unit: 'g', childQty: 0.6, calcUnit: 'g', scrapRate: 0, issueMethod: undefined, remark: '润滑剂' },
                { id: 'BC006', rowNo: 60, childCode: 'PKG-BOTTLE-001', childName: 'HDPE白色圆瓶',     spec: '500ml',      freeDesc: '', type: '标准', qty: 1,   unit: '个', childQty: 1,   calcUnit: '个', scrapRate: 0.5, issueMethod: undefined, remark: '内包装' },
                { id: 'BC007', rowNo: 70, childCode: 'PKG-CAP-001',  childName: '防儿童安全盖',        spec: '53mm',       freeDesc: '', type: '标准', qty: 1,   unit: '个', childQty: 1,   calcUnit: '个', scrapRate: 0.5, issueMethod: undefined, remark: '' },
                { id: 'BC008', rowNo: 80, childCode: 'PKG-LABEL-001', childName: '产品标签',           spec: '100×80mm',   freeDesc: '', type: '标准', qty: 1,   unit: '张', childQty: 1,   calcUnit: '张', scrapRate: 1,   issueMethod: undefined, remark: '' },
                { id: 'BC009', rowNo: 90, childCode: 'PKG-BOX-001',  childName: '彩色纸盒',            spec: '105×105×110mm', freeDesc: '', type: '标准', qty: 1, unit: '个', childQty: 1,   calcUnit: '个', scrapRate: 0.5, issueMethod: undefined, remark: '' },
              ],
            },
          ];
          localStorage.setItem('bip_demo_bom', JSON.stringify(demoBomList));

          // ── 4. 工艺路径（供RoutingMasterListPage读取，key=bip_routings）
          const demoRoutings = [
            {
              routingCode: 'GMP-PACKAGE-V1',
              routingName: '天美健保健品GMP包装路线 V1.0',
              seriesCode: 'TMJ-VitC',
              status: 'ENABLED',
              variantType: 'STANDARD',
              currentVersion: 'V1.0',
              remark: '适用于维生素C咀嚼片保健品GMP生产全工序',
              steps: [
                { stepNo: 10, opCode: 'OP-GMP-WEIGH',  opName: '称量配料', leadTime: 90,  workCenter: '称量间-GMP' },
                { stepNo: 20, opCode: 'OP-GMP-MIX',    opName: '混合',     leadTime: 120, workCenter: '混合间-GMP' },
                { stepNo: 30, opCode: 'OP-GMP-GRAN',   opName: '制粒干燥', leadTime: 180, workCenter: '制粒间-GMP' },
                { stepNo: 40, opCode: 'OP-GMP-INNER',  opName: '内包装',   leadTime: 120, workCenter: '内包装间-GMP' },
                { stepNo: 50, opCode: 'OP-GMP-OUTER',  opName: '外包装',   leadTime: 90,  workCenter: '外包装间-GMP' },
              ],
              createdAt: '2026-01-01 09:00:00',
              updatedAt: '2026-06-01 09:00:00',
            },
          ];
          localStorage.setItem('bip_routings', JSON.stringify(demoRoutings));

          // ── 5. 产品系列（供ProductSeriesPage/SeriesContext读取，key=bip_product_series）
          const demoProductSeries = [
            {
              id: 'PS-TMJ-001',
              seriesCode: 'TMJ-VitC',
              seriesName: '天美健维生素C系列',
              productFamily: '维生素类保健品',
              defaultRoutingCode: 'GMP-PACKAGE-V1',
              status: 'active',
              remark: '核心产品系列，含咀嚼片、泡腾片等多个规格',
              createdAt: '2026-01-01',
              updatedAt: '2026-06-14',
            },
          ];
          localStorage.setItem('bip_product_series', JSON.stringify(demoProductSeries));
          // 同步产品族枚举
          const existingFamilies: string[] = JSON.parse(localStorage.getItem('bip_product_families') || '[]');
          if (!existingFamilies.includes('维生素类保健品')) {
            localStorage.setItem('bip_product_families', JSON.stringify([...existingFamilies, '维生素类保健品']));
          }
          break;
        }

        case 'po': {
          const existingPOs = JSON.parse(localStorage.getItem('bip_production_orders') || '[]');
          const filtered = existingPOs.filter((p: { id: string }) => p.id !== po.id);
          localStorage.setItem('bip_production_orders', JSON.stringify([po, ...filtered]));
          localStorage.setItem('bip_demo_pick_list', JSON.stringify(pickList));
          break;
        }

        case 'wo': {
          const existingWOs = JSON.parse(localStorage.getItem('bip_work_orders') || '[]');
          const filteredWOs = existingWOs.filter((w: { id: string }) => w.id !== wo.id);
          localStorage.setItem('bip_work_orders', JSON.stringify([wo, ...filteredWOs]));
          localStorage.setItem('bip_demo_semi_receipt', JSON.stringify(semiReceipt));
          localStorage.setItem('bip_demo_fg_receipt', JSON.stringify(fgReceipt));
          break;
        }

        case 'pad':
          localStorage.setItem('bip_pad_exec_map', JSON.stringify(execMap));
          break;

        case 'inspection':
          localStorage.setItem('bip_demo_inspections', JSON.stringify(inspections));
          break;

        case 'ebr': {
          const ebrRecord = {
            id: `EBR_DEMO_${DEMO_BATCH.batchNo}`,
            ebrNo: `EBR-20260614-001`,
            status: 'COMPLETED',
            woId: wo.id, woNo: wo.woNo, batchNo: DEMO_BATCH.batchNo,
            productCode: DEMO_BATCH.productCode,
            productName: DEMO_BATCH.productName,
            productSpec: DEMO_BATCH.productSpec,
            planQty: 3000,
            priority: 'HIGH',
            routingCode: 'GMP-PACKAGE-V1',
            routingName: '天美健保健品GMP包装路线 V1.0',
            bomVersion: 'V1.0',
            startTime: '2026-06-14 07:30',
            endTime: '2026-06-15 11:30',
            createdAt: '2026-06-14 07:30',
            updatedAt: '2026-06-15 11:30',
            routingSteps: [],
            tasks: [],
            floatTickets: [],
            inspectionRecords: [],
            deviations: [],
            signatures: [
              { role: '称量配料操作员', name: DEMO_BATCH.operators.weighOp, signedAt: '2026-06-14 09:00' },
              { role: '混合操作员', name: DEMO_BATCH.operators.mixOp, signedAt: '2026-06-14 11:30' },
              { role: '制粒操作员', name: DEMO_BATCH.operators.granOp, signedAt: '2026-06-14 14:00' },
              { role: '内包装操作员', name: DEMO_BATCH.operators.innerOp, signedAt: '2026-06-14 17:30' },
              { role: '外包装操作员', name: DEMO_BATCH.operators.outerOp, signedAt: '2026-06-15 11:30' },
              { role: 'QA监控', name: DEMO_BATCH.operators.qaOp, signedAt: '2026-06-15 11:30' },
            ],
            planQtyTotal: 3000, reportQtyTotal: 2970, goodQtyTotal: 2970, scrapQtyTotal: 30,
            yieldRate: 99.0,
          };
          const existingEBR = JSON.parse(localStorage.getItem('bip_ebr_records') || '[]');
          const filteredEBR = existingEBR.filter((e: { id: string }) => e.id !== ebrRecord.id);
          localStorage.setItem('bip_ebr_records', JSON.stringify([ebrRecord, ...filteredEBR]));
          localStorage.removeItem('bip_ebr_version'); // 强制刷新
          break;
        }

        case 'release':
          localStorage.setItem('bip_demo_release', JSON.stringify(release));
          break;

        case 'deviation':
          localStorage.setItem('bip_demo_deviations', JSON.stringify(deviations));
          break;
      }

      setInjectedKeys(prev => new Set([...prev, stepKey]));
      // 同步版本号，防止 mesStore 下次加载时清除演示数据
      localStorage.setItem('bip_demo_injected', 'true');
      localStorage.setItem('bip_data_version', 'v20260606_e');
      // 通知 useLocalStorage 监听者（同页面内 storage 事件不触发自身）
      const keysToNotify = ['bip_routings', 'bip_product_series', 'bip_product_families',
                            'bip_materials', 'bip_material_categories', 'bip_demo_bom'];
      keysToNotify.forEach(k => {
        if (localStorage.getItem(k)) {
          window.dispatchEvent(new CustomEvent('bip-storage-updated', { detail: { key: k } }));
        }
      });
      message.success(`✅ ${DEMO_STEPS.find(s => s.key === stepKey)?.title} 数据注入成功！`);
    } catch (e) {
      message.error('注入失败: ' + String(e));
    } finally {
      setLoadingKey(null);
    }
  };

  // 一键注入全部
  const injectAll = async () => {
    setConfirmVisible(false);
    for (const step of DEMO_STEPS) {
      await injectStep(step.key);
    }
    // 写入演示数据标记 + 同步版本号，防止 mesStore ensureVersion 在下次加载时清除演示数据
    localStorage.setItem('bip_demo_injected', 'true');
    localStorage.setItem('bip_data_version', 'v20260606_e'); // 与 mesStore.ts DATA_VERSION 保持一致
    message.success('🎉 全部演示数据注入完成！请前往各功能模块验证。');
  };

  // 清除演示数据
  const clearAll = () => {
    const keys = [
      'bip_demo_bom', 'bip_production_orders', 'bip_work_orders',
      'bip_pad_exec_map', 'bip_demo_inspections', 'bip_ebr_records',
      'bip_demo_release', 'bip_demo_deviations', 'bip_demo_pick_list',
      'bip_demo_semi_receipt', 'bip_demo_fg_receipt',
      // 基础资料（bom step注入的）
      'bip_materials', 'bip_material_categories',
      'bip_routings', 'bip_product_series', 'bip_product_families',
      'bip_demo_injected', // 清除演示标记
    ];
    keys.forEach(k => localStorage.removeItem(k));
    setInjectedKeys(new Set());
    message.warning('演示数据已清除');
  };

  const progressPct = Math.round((injectedKeys.size / DEMO_STEPS.length) * 100);

  // ---- 领料单列 ----
  const pickColumns = [
    { title: '序号', dataIndex: 'seq', width: 50 },
    { title: '物料名称', dataIndex: 'matName', width: 180 },
    { title: '物料编码', dataIndex: 'matCode', width: 120 },
    { title: '规格', dataIndex: 'spec', width: 200 },
    { title: '计划量', dataIndex: 'planQty', width: 80, render: (v: number, r: { unit: string }) => `${v}${r.unit}` },
    { title: '实领量', dataIndex: 'actualQty', width: 80, render: (v: number, r: { unit: string }) => `${v}${r.unit}` },
    { title: '批号', dataIndex: 'lotNo', width: 160 },
    { title: '库位', dataIndex: 'location', width: 80 },
    { title: '领料人', dataIndex: 'pickOp', width: 100 },
  ];

  const pickList = buildPickList();
  const inspData = buildInspectionData();
  const deviationData = buildDeviationData();

  const tabItems = [
    {
      key: 'overview',
      label: '📋 演示概览',
      children: (
        <div>
          <Alert
            type="info"
            showIcon
            icon={<InfoCircleOutlined />}
            message="天美健维生素C咀嚼片 — 完整演示测试用例"
            description={
              <div>
                <Text>本工具将注入完整的GMP生产演示数据，覆盖从BOM到质量放行的完整流程。</Text>
                <br />
                <Text type="secondary">批号: <Text code>BN-20260614-001</Text> | 产品: 天美健维生素C咀嚼片 1000mg×120片/瓶 | 计划数量: 3000瓶</Text>
              </div>
            }
            style={{ marginBottom: 16 }}
          />

          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={6}>
              <Card size="small">
                <Statistic title="注入进度" value={progressPct} suffix="%" valueStyle={{ color: progressPct === 100 ? '#52c41a' : '#1890ff' }} />
                <Progress percent={progressPct} size="small" style={{ marginTop: 8 }} />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Statistic title="已注入步骤" value={injectedKeys.size} suffix={`/ ${DEMO_STEPS.length}`} valueStyle={{ color: '#52c41a' }} />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Statistic title="计划数量" value={3000} suffix="瓶" />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Statistic title="实际产出" value={2970} suffix="瓶" valueStyle={{ color: '#52c41a' }} />
              </Card>
            </Col>
          </Row>

          <Row gutter={12} style={{ marginBottom: 16 }}>
            <Col>
              <Button
                type="primary" size="large"
                icon={<PlayCircleOutlined />}
                onClick={() => setConfirmVisible(true)}
                style={{ background: '#52c41a', borderColor: '#52c41a' }}
              >
                一键注入全部演示数据
              </Button>
            </Col>
            <Col>
              <Button size="large" icon={<DeleteOutlined />} danger onClick={clearAll}>
                清除所有演示数据
              </Button>
            </Col>
          </Row>

          <Divider>演示流程步骤</Divider>
          <Steps
            direction="vertical"
            current={injectedKeys.size}
            size="small"
            items={DEMO_STEPS.map(step => ({
              key: step.key,
              title: (
                <Space>
                  <Text strong>{step.title}</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>{step.desc}</Text>
                  {injectedKeys.has(step.key) && <Tag color="success">✓ 已注入</Tag>}
                </Space>
              ),
              description: (
                <div style={{ marginTop: 4 }}>
                  <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: '#666' }}>
                    {step.details.map((d, i) => <li key={i}>{d}</li>)}
                  </ul>
                  <Button
                    size="small" type="dashed"
                    loading={loadingKey === step.key}
                    disabled={injectedKeys.has(step.key)}
                    onClick={() => injectStep(step.key)}
                    style={{ marginTop: 8 }}
                  >
                    {injectedKeys.has(step.key) ? '已注入' : '单独注入此步骤'}
                  </Button>
                </div>
              ),
              status: injectedKeys.has(step.key) ? 'finish' as const : 'wait' as const,
              icon: injectedKeys.has(step.key) ? <CheckCircleOutlined style={{ color: '#52c41a' }} /> : step.icon,
            }))}
          />
        </div>
      ),
    },
    {
      key: 'pick',
      label: '📦 生产领料单',
      children: (
        <div>
          <Card size="small" style={{ marginBottom: 12 }}>
            <Row gutter={16}>
              <Col span={6}><Text strong>领料单号：</Text><Text code>PICK-20260614-001</Text></Col>
              <Col span={6}><Text strong>生产工单：</Text><Text>{DEMO_BATCH.woNo}</Text></Col>
              <Col span={6}><Text strong>批号：</Text><Text>{DEMO_BATCH.batchNo}</Text></Col>
              <Col span={6}><Text strong>状态：</Text><Tag color="blue">已发料</Tag></Col>
            </Row>
          </Card>
          <Table
            dataSource={pickList.items} columns={pickColumns}
            rowKey="seq" size="small" pagination={false}
            scroll={{ x: 900 }}
          />
          <Divider />
          <Row gutter={16}>
            <Col span={12}>
              <Card size="small" title="半成品入库单" extra={<Tag color="success">已入库</Tag>}>
                <Text><strong>入库单号：</strong>SGR-20260614-001</Text><br />
                <Text><strong>品名：</strong>维生素C咀嚼片（颗粒半成品）</Text><br />
                <Text><strong>入库量：</strong>2988批（约439kg颗粒）</Text><br />
                <Text><strong>QC结果：</strong><Tag color="success">合格</Tag></Text><br />
                <Text><strong>库位：</strong>WH-SEMI-01</Text><br />
                <Text><strong>时间：</strong>2026-06-14 14:05</Text>
              </Card>
            </Col>
            <Col span={12}>
              <Card size="small" title="成品入库单" extra={<Tag color="success">已入库</Tag>}>
                <Text><strong>入库单号：</strong>FGR-20260615-001</Text><br />
                <Text><strong>品名：</strong>天美健维生素C咀嚼片 1000mg×120片/瓶</Text><br />
                <Text><strong>入库量：</strong>2970瓶 / 247箱（12瓶/箱）</Text><br />
                <Text><strong>质量状态：</strong><Tag color="success">已放行</Tag></Text><br />
                <Text><strong>库位：</strong>WH-FG-A03</Text><br />
                <Text><strong>时间：</strong>2026-06-15 16:00</Text>
              </Card>
            </Col>
          </Row>
        </div>
      ),
    },
    {
      key: 'inspection',
      label: '🔬 检验测试用例',
      children: (
        <div>
          <Tabs
            size="small"
            items={[
              {
                key: 'ipqc1',
                label: '过程检验-混合',
                children: <InspectionCard data={inspData.ipqc1} />,
              },
              {
                key: 'ipqc2',
                label: '半成品检验-颗粒',
                children: <InspectionCard data={inspData.ipqc2} />,
              },
              {
                key: 'ipqc3',
                label: '过程检验-内包装',
                children: <InspectionCard data={inspData.ipqc3} />,
              },
              {
                key: 'fqc',
                label: '成品检验FQC',
                children: <InspectionCard data={inspData.fqc} />,
              },
            ]}
          />
        </div>
      ),
    },
    {
      key: 'release',
      label: '✅ 质量放行',
      children: <ReleaseCard data={buildReleaseData()} />,
    },
    {
      key: 'deviation',
      label: '⚠️ 偏差测试',
      children: <DeviationCard data={deviationData} />,
    },
    {
      key: 'guide',
      label: '📖 演示操作指引',
      children: <DemoGuide />,
    },
  ];

  return (
    <div style={{ padding: '0 4px' }}>
      <Card
        title={
          <Space>
            <BoxPlotOutlined style={{ color: '#1890ff', fontSize: 20 }} />
            <span>演示数据注入工具 — 天美健维生素C咀嚼片完整测试用例</span>
          </Space>
        }
        extra={
          <Space>
            <Badge count={injectedKeys.size} style={{ backgroundColor: '#52c41a' }}>
              <Button icon={<ReloadOutlined />} onClick={() => setInjectedKeys(new Set())}>重置状态</Button>
            </Badge>
          </Space>
        }
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
      </Card>

      <Modal
        title="确认注入演示数据"
        open={confirmVisible}
        onOk={injectAll}
        onCancel={() => setConfirmVisible(false)}
        okText="确认注入"
        cancelText="取消"
      >
        <Alert
          type="warning"
          message="此操作将覆盖localStorage中的相关数据"
          description="将注入天美健维生素C咀嚼片完整演示数据，包括：生产订单、工单、PAD执行数据、检验记录、批记录、放行数据、偏差数据。现有演示数据将被覆盖。是否继续？"
          showIcon
        />
      </Modal>
    </div>
  );
};

// ==================== 子组件 ====================

interface InspectionItem {
  name: string;
  standard?: string;
  actual?: string;
  result: string;
  isCritical?: boolean;
}

interface InspectionData {
  taskNo: string;
  type: string;
  schemeName: string;
  batchNo: string;
  inspector: string;
  checker?: string;
  startTime: string;
  endTime: string;
  conclusion: string;
  items: InspectionItem[];
  sampleQty?: number;
  opNo?: string;
}

const InspectionCard: React.FC<{ data: InspectionData }> = ({ data }) => (
  <div>
    <Card size="small" style={{ marginBottom: 12 }}>
      <Row gutter={16}>
        <Col span={6}><Text strong>检验单号：</Text><Text code>{data.taskNo}</Text></Col>
        <Col span={6}><Text strong>检验类型：</Text><Text>{data.type}</Text></Col>
        <Col span={6}><Text strong>批号：</Text><Text>{data.batchNo}</Text></Col>
        <Col span={6}><Text strong>结论：</Text><Tag color={data.conclusion === 'PASS' ? 'success' : 'error'}>{data.conclusion === 'PASS' ? '合格' : '不合格'}</Tag></Col>
      </Row>
      <Row gutter={16} style={{ marginTop: 8 }}>
        <Col span={6}><Text strong>检验员：</Text><Text>{data.inspector}</Text></Col>
        {data.checker && <Col span={6}><Text strong>复核员：</Text><Text>{data.checker}</Text></Col>}
        <Col span={6}><Text strong>开始时间：</Text><Text>{data.startTime}</Text></Col>
        <Col span={6}><Text strong>完成时间：</Text><Text>{data.endTime}</Text></Col>
      </Row>
    </Card>
    <Table
      dataSource={data.items}
      rowKey="name"
      size="small"
      pagination={false}
      columns={[
        {
          title: '检验项目', dataIndex: 'name', width: 200,
          render: (v: string, r: InspectionItem) => (
            <Space>
              {r.isCritical && <Tag color="red" style={{ fontSize: 10 }}>关键</Tag>}
              {v}
            </Space>
          ),
        },
        { title: '标准/规格', dataIndex: 'standard', width: 200 },
        { title: '实测值', dataIndex: 'actual', width: 250 },
        {
          title: '判定', dataIndex: 'result', width: 80,
          render: (v: string) => <Tag color={v === 'PASS' ? 'success' : v === 'FAIL' ? 'error' : 'default'}>{v === 'PASS' ? '合格' : v === 'FAIL' ? '不合格' : '待定'}</Tag>,
        },
      ]}
    />
  </div>
);

interface ReleaseLevel {
  level: string;
  role: string;
  person: string;
  time: string;
  action: string;
  remark: string;
}

interface ReleaseData {
  releaseNo: string;
  batchNo: string;
  productName: string;
  productSpec: string;
  planQty: number;
  actualQty: number;
  yieldRate: number;
  materialBalanceRate: number;
  fqcResult: string;
  deviationCount: number;
  status: string;
  reviewLevel: ReleaseLevel[];
  releaseTime: string;
  releasedBy: string;
  nextAction: string;
}

const ReleaseCard: React.FC<{ data: ReleaseData }> = ({ data }) => (
  <div>
    <Alert
      type="success"
      showIcon
      icon={<SafetyOutlined />}
      message={`批次 ${data.batchNo} 已批准放行`}
      description={`放行单号: ${data.releaseNo} | 放行时间: ${data.releaseTime} | 放行人: ${data.releasedBy}`}
      style={{ marginBottom: 16 }}
    />
    <Row gutter={16} style={{ marginBottom: 16 }}>
      <Col span={6}><Card size="small"><Statistic title="计划数量" value={data.planQty} suffix="瓶" /></Card></Col>
      <Col span={6}><Card size="small"><Statistic title="实际产出" value={data.actualQty} suffix="瓶" valueStyle={{ color: '#52c41a' }} /></Card></Col>
      <Col span={6}><Card size="small"><Statistic title="成品良率" value={data.yieldRate} suffix="%" valueStyle={{ color: '#52c41a' }} /></Card></Col>
      <Col span={6}><Card size="small"><Statistic title="偏差记录" value={data.deviationCount} suffix="项" valueStyle={{ color: data.deviationCount > 0 ? '#ff4d4f' : '#52c41a' }} /></Card></Col>
    </Row>
    <Card title="三级审核签名链" size="small">
      <Timeline
        items={data.reviewLevel.map(r => ({
          color: 'green',
          dot: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
          children: (
            <div>
              <Text strong>{r.level} — {r.role}</Text>
              <br />
              <Text>操作人: {r.person} | 时间: {r.time}</Text>
              <br />
              <Text type="secondary">{r.remark}</Text>
            </div>
          ),
        }))}
      />
    </Card>
    <Alert type="info" message={`后续操作: ${data.nextAction}`} style={{ marginTop: 12 }} />
  </div>
);

interface CAPAItem {
  type: string;
  action: string;
}

interface DeviationItem {
  devNo: string;
  type: string;
  title: string;
  batchNo: string;
  opName: string;
  description: string;
  discoveredAt: string;
  discoveredBy: string;
  severity: string;
  immediateAction: string[];
  rootCause: string;
  capa: CAPAItem[];
  status: string;
  closedAt: string;
  closedBy: string;
  closureRemark: string;
  impactAssessment: string;
}

const DeviationCard: React.FC<{ data: { deviation1: DeviationItem; deviation2: DeviationItem } }> = ({ data }) => {
  const renderDev = (dev: DeviationItem) => (
    <div>
      <Alert
        type="warning"
        showIcon
        icon={<WarningOutlined />}
        message={`${dev.devNo}: ${dev.title}`}
        description={`批号: ${dev.batchNo} | 工序: ${dev.opName} | 发现时间: ${dev.discoveredAt} | 严重程度: ${dev.severity}`}
        style={{ marginBottom: 12 }}
      />
      <Card size="small" title="偏差描述" style={{ marginBottom: 8 }}>
        <Paragraph>{dev.description}</Paragraph>
      </Card>
      <Card size="small" title="即时措施" style={{ marginBottom: 8 }}>
        <ul style={{ margin: 0, paddingLeft: 16 }}>
          {dev.immediateAction.map((a, i) => <li key={i}>{a}</li>)}
        </ul>
      </Card>
      <Card size="small" title="根本原因" style={{ marginBottom: 8 }}>
        <Paragraph>{dev.rootCause}</Paragraph>
      </Card>
      <Card size="small" title="CAPA措施" style={{ marginBottom: 8 }}>
        <Table
          dataSource={dev.capa} rowKey="action" size="small" pagination={false}
          columns={[
            { title: '类型', dataIndex: 'type', width: 100, render: (v: string) => <Tag color={v === '纠正措施' ? 'blue' : v === '预防措施' ? 'green' : 'orange'}>{v}</Tag> },
            { title: '措施内容', dataIndex: 'action' },
          ]}
        />
      </Card>
      <Alert
        type="success"
        message={`状态: ${dev.status} | 关闭时间: ${dev.closedAt} | 关闭人: ${dev.closedBy}`}
        description={dev.closureRemark}
      />
    </div>
  );

  return (
    <Tabs
      size="small"
      items={[
        { key: '1', label: '偏差1: 混合RSD超标', children: renderDev(data.deviation1) },
        { key: '2', label: '偏差2: 物料平衡率低于下限', children: renderDev(data.deviation2) },
      ]}
    />
  );
};

const DemoGuide: React.FC = () => (
  <div>
    <Title level={4}>完整演示操作指引</Title>
    <Alert type="info" showIcon message="按照以下步骤进行端到端演示" style={{ marginBottom: 16 }} />

    <Card size="small" title="Step 1：注入演示数据" style={{ marginBottom: 12 }}>
      <ol style={{ paddingLeft: 20 }}>
        <li>点击"一键注入全部演示数据"按钮</li>
        <li>等待所有步骤完成（约5秒）</li>
        <li>确认进度条显示100%</li>
      </ol>
    </Card>

    <Card size="small" title="Step 2：验证生产订单（生产管理→生产订单）" style={{ marginBottom: 12 }}>
      <ol style={{ paddingLeft: 20 }}>
        <li>进入"生产管理"→"生产订单"</li>
        <li>查看订单 MO-20260614-001（天美健维生素C咀嚼片）</li>
        <li>验证：状态"已完成"，计划3000瓶，优先级"紧急"</li>
        <li>查看关联领料单 PICK-20260614-001（10种物料）</li>
      </ol>
    </Card>

    <Card size="small" title="Step 3：验证生产工单（生产管理→生产工单）" style={{ marginBottom: 12 }}>
      <ol style={{ paddingLeft: 20 }}>
        <li>进入"生产管理"→"生产工单"</li>
        <li>查看工单 WO-20260614-001，批号 BN-20260614-001</li>
        <li>验证：状态"已完成"，完成2970瓶，报废30瓶</li>
      </ol>
    </Card>

    <Card size="small" title="Step 4：PAD工序执行（车间执行→PAD工序执行）" style={{ marginBottom: 12 }}>
      <ol style={{ paddingLeft: 20 }}>
        <li>进入"车间执行"→"PAD工序执行"</li>
        <li>可查看6道GMP工序全部完成状态</li>
        <li>点击各工序查看详情（称量/混合/制粒/内包装/内包清场/外包装）</li>
        <li>验证：PRE_CLEAN、DATA_COLLECT、REPORT等阶段数据</li>
      </ol>
    </Card>

    <Card size="small" title="Step 5：批记录自动生成（电子批记录→批记录自动生成打印）" style={{ marginBottom: 12 }}>
      <ol style={{ paddingLeft: 20 }}>
        <li>进入"电子批记录"→"批记录自动生成打印"</li>
        <li>系统自动从PAD执行数据生成SOR-MF-PE-02-05格式批记录</li>
        <li>验证7个章节：封面/§1批包装指令/§2瓶包线记录/§3外包装记录/§4QA监控/§5物料平衡/§6成品检验/§7放行审核</li>
        <li>点击"打印"测试打印预览</li>
      </ol>
    </Card>

    <Card size="small" title="Step 6：偏差演示（质量管理→偏差管理）" style={{ marginBottom: 12 }}>
      <ol style={{ paddingLeft: 20 }}>
        <li>查看"偏差测试"标签页中的两个偏差场景</li>
        <li>偏差1：混合RSD超标 → 重混处理 → 关闭</li>
        <li>偏差2：物料平衡率低于下限 → 重新核算 → 关闭</li>
      </ol>
    </Card>

    <Card size="small" title="数据清除" style={{ marginBottom: 12 }}>
      <Paragraph type="secondary">演示结束后，点击"清除所有演示数据"可恢复系统至演示前状态。</Paragraph>
    </Card>
  </div>
);

export default DemoDataInjectorPage;

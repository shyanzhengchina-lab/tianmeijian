/**
 * Material Store 单元测试
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useMaterialStore } from '../materialStore';
import { materialApi } from '../../api/materialApi';

// Mock API
jest.mock('../../api/materialApi');

describe('useMaterialStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    // 清理 localStorage
    localStorage.clear();
  });

  describe('初始状态', () => {
    it('应该有正确的初始状态', () => {
      const { result } = renderHook(() => useMaterialStore());

      expect(result.current.materials).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.query).toEqual({
        current: 1,
        pageSize: 15,
      });
    });
  });

  describe('loadMaterials', () => {
    it('应该成功加载物料列表', async () => {
      const mockData = [
        { id: '1', name: '物料1' },
        { id: '2', name: '物料2' },
      ];

      (materialApi.getMaterials as jest.Mock).mockResolvedValue({
        code: 200,
        data: { list: mockData, total: 2 },
      });

      const { result } = renderHook(() => useMaterialStore());

      await act(async () => {
        await result.current.loadMaterials();
      });

      expect(result.current.materials).toEqual(mockData);
      expect(result.current.total).toBe(2);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('应该处理加载失败', async () => {
      const mockError = new Error('加载失败');
      (materialApi.getMaterials as jest.Mock).mockRejectedValue(mockError);

      const { result } = renderHook(() => useMaterialStore());

      await act(async () => {
        await result.current.loadMaterials();
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('加载失败');
    });
  });

  describe('createMaterial', () => {
    it('应该成功创建物料', async () => {
      const newMaterial = {
        id: '3',
        name: '新物料',
      };

      (materialApi.createMaterial as jest.Mock).mockResolvedValue({
        code: 200,
        data: newMaterial,
      });

      const { result } = renderHook(() => useMaterialStore());

      await act(async () => {
        await result.current.createMaterial(newMaterial as any);
      });

      expect(materialApi.createMaterial).toHaveBeenCalledWith(newMaterial);
    });

    it('创建后应该重新加载列表', async () => {
      const newMaterial = {
        id: '3',
        name: '新物料',
      };

      (materialApi.createMaterial as jest.Mock).mockResolvedValue({
        code: 200,
        data: newMaterial,
      });

      const { result } = renderHook(() => useMaterialStore());

      await act(async () => {
        await result.current.createMaterial(newMaterial as any);
      });

      await waitFor(() => {
        expect(materialApi.getMaterials).toHaveBeenCalled();
      });
    });
  });

  describe('updateMaterial', () => {
    it('应该成功更新物料', async () => {
      const updateData = {
        id: '1',
        name: '更新后的物料',
      };

      (materialApi.updateMaterial as jest.Mock).mockResolvedValue({
        code: 200,
        data: updateData,
      });

      const { result } = renderHook(() => useMaterialStore());

      await act(async () => {
        await result.current.updateMaterial(updateData);
      });

      expect(materialApi.updateMaterial).toHaveBeenCalledWith(updateData);
    });
  });

  describe('deleteMaterial', () => {
    it('应该成功删除物料', async () => {
      const ids = ['1', '2'];

      (materialApi.deleteMaterial as jest.Mock).mockResolvedValue({
        code: 200,
      });

      const { result } = renderHook(() => useMaterialStore());

      await act(async () => {
        await result.current.deleteMaterial(ids as any);
      });

      expect(materialApi.deleteMaterial).toHaveBeenCalledWith(ids);
    });

    it('删除后应该重新加载列表', async () => {
      const ids = ['1', '2'];

      (materialApi.deleteMaterial as jest.Mock).mockResolvedValue({
        code: 200,
      });

      const { result } = renderHook(() => useMaterialStore());

      await act(async () => {
        await result.current.deleteMaterial(ids as any);
      });

      await waitFor(() => {
        expect(materialApi.getMaterials).toHaveBeenCalled();
      });
    });

    it('应该清除选择', async () => {
      const ids = ['1', '2'];

      (materialApi.deleteMaterial as jest.Mock).mockResolvedValue({
        code: 200,
      });

      const { result } = renderHook(() => useMaterialStore());

      // 先设置一些选择的ID
      act(() => {
        result.current.setSelectedIds(['1', '3']);
      });

      expect(result.current.selectedIds).toEqual(['1', '3']);

      await act(async () => {
        await result.current.deleteMaterial(ids as any);
      });

      // 删除后应该清除选择
      expect(result.current.selectedIds).toEqual([]);
    });
  });

  describe('setQuery', () => {
    it('应该正确设置查询参数', () => {
      const { result } = renderHook(() => useMaterialStore());

      act(() => {
        result.current.setQuery({ pageSize: 20 });
      });

      expect(result.current.query).toEqual({
        current: 1,
        pageSize: 20,
      });
    });

    it('设置查询应该重置页码', () => {
      const { result } = renderHook(() => useMaterialStore());

      // 先设置一些查询参数
      act(() => {
        result.current.setQuery({ current: 5, pageSize: 15 });
      });

      expect(result.current.query.current).toBe(5);

      // 更新查询应该重置页码
      act(() => {
        result.current.setQuery({ name: '测试' });
      });

      expect(result.current.query.current).toBe(1);
    });
  });

  describe('setSelectedIds', () => {
    it('应该正确设置选中的ID', () => {
      const mockData = [
        { id: '1', name: '物料1' },
        { id: '2', name: '物料2' },
        { id: '3', name: '物料3' },
      ];

      const { result } = renderHook(() => useMaterialStore());

      act(() => {
        result.current.setMaterials(mockData as any, 3); // 设置数据和总数
        result.current.setSelectedIds(['1', '2']);
      });

      expect(result.current.selectedIds).toEqual(['1', '2']);
      expect(result.current.selectedMaterials).toEqual([
        mockData[0],
        mockData[1],
      ]);
    });

    it('清除选择应该清空所有选择状态', () => {
      const { result } = renderHook(() => useMaterialStore());

      act(() => {
        result.current.setSelectedIds(['1', '2']);
        result.current.clearSelection();
      });

      expect(result.current.selectedIds).toEqual([]);
      expect(result.current.selectedMaterials).toEqual([]);
    });
  });

  describe('持久化', () => {
    it('应该持久化状态到 localStorage', () => {
      const mockData = [
        { id: '1', name: '物料1' },
      ];

      const { result } = renderHook(() => useMaterialStore());

      act(() => {
        result.current.setMaterials(mockData as any, 2);
      });

      // 检查 localStorage 是否包含持久化的数据
      const storedData = localStorage.getItem('material-store');
      expect(storedData).toBeTruthy();
    });
  });

  describe('并发处理', () => {
    it('应该正确处理并发操作', async () => {
      const { result } = renderHook(() => useMaterialStore());

      // 模拟多个并发操作
      await Promise.all([
        act(async () => {
          await result.current.loadMaterials();
        }),
        act(async () => {
          await result.current.setQuery({ name: '测试' });
        }),
      ]);

      // 状态应该是最后的操作结果
      expect(result.current.loading).toBe(false);
      expect(result.current.query.name).toBe('测试');
    });
  });
});
/**
 * 表单管理Hook
 * 封装表单常用的状态和逻辑
 */

import { useState, useCallback, useEffect } from 'react';
import { FormInstance, message } from 'antd';
import type { FormProps } from 'antd/es/form';

/**
 * 表单提交响应
 */
export interface FormSubmitResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

/**
 * 表单验证规则
 */
export interface FormValidationRule {
  required?: boolean;
  message?: string;
  [key: string]: any;
}

/**
 * 表单字段配置
 */
export interface FormField {
  name: string;
  label?: string;
  rules?: FormValidationRule[];
  valuePropName?: string;
  [key: string]: any;
}

/**
 * useForm Hook属性
 */
export interface UseFormOptions<T, R = any> {
  // 提交函数
  onSubmit: (values: T) => Promise<R>;

  // 初始值
  initialValues?: Partial<T>;

  // 成功回调
  onSuccess?: (response: R) => void;

  // 错误回调
  onError?: (error: Error) => void;

  // 验证成功回调
  onValidateSuccess?: (values: T) => void;

  // 验证失败回调
  onValidateFail?: (error: any) => void;

  // 是否自动提交
  autoSubmit?: boolean;

  // 表单实例
  formInstance?: FormInstance;
}

/**
 * useForm Hook返回值
 */
export interface UseFormReturn<T, R = any> {
  // 表单实例
  form: FormInstance;

  // 状态
  loading: boolean;
  submitting: boolean;
  error: string | null;
  touched: boolean;
  valid: boolean;

  // 操作
  handleSubmit: () => Promise<R | undefined>;
  handleReset: () => void;
  setValues: (values: Partial<T>) => void;
  setFieldValue: (name: string, value: any) => void;
  getValues: () => T;
  validateFields: () => Promise<T>;
  resetFields: () => void;
  setFields: (fields: FormField[]) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
}

/**
 * 表单管理Hook
 */
export function useForm<T extends Record<string, any>, R = any>({
  onSubmit,
  initialValues,
  onSuccess,
  onError,
  onValidateSuccess,
  onValidateFail,
  autoSubmit = false,
  formInstance,
}: UseFormOptions<T, R>): UseFormReturn<T, R> {
  const [loading, setLoadingState] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setErrorState] = useState<string | null>(null);
  const [touched, setTouched] = useState<boolean>(false);
  const [valid, setValid] = useState<boolean>(false);

  // 创建表单实例
  const [form] = useState<FormInstance>(() => {
    if (formInstance) {
      return formInstance;
    }
    return (window as any).antd?.Form?.useForm?.(initialValues)?.[0] ||
           (window as any).React?.useForm?.(initialValues)?.[0] ||
           { getFieldsValue: () => ({}), setFieldsValue: () => {}, resetFields: () => {}, validateFields: () => Promise.resolve({}) } as any;
  });

  /**
   * 处理表单提交
   */
  const handleSubmit = useCallback(async () => {
    try {
      setSubmitting(true);
      setErrorState(null);

      // 验证表单
      const values = await form.validateFields();
      setValid(true);
      setTouched(true);

      // 验证成功回调
      onValidateSuccess?.(values);

      // 提交数据
      const response = await onSubmit(values);

      // 成功回调
      onSuccess?.(response);
      message.success('操作成功');

      // 重置表单（如果需要）
      // form.resetFields();

      return response;
    } catch (error: any) {
      console.error('表单提交失败:', error);

      // 处理验证错误
      if (error.errorFields) {
        setValid(false);
        onValidateFail?.(error);
        return;
      }

      // 处理提交错误
      const errorMessage = error?.message || error?.data?.message || '操作失败';
      setErrorState(errorMessage);
      onError?.(error);
      message.error(errorMessage);

      throw error;
    } finally {
      setSubmitting(false);
    }
  }, [form, onSubmit, onSuccess, onError, onValidateSuccess, onValidateFail]);

  /**
   * 处理表单重置
   */
  const handleReset = useCallback(() => {
    form.resetFields();
    setTouched(false);
    setValid(false);
    setErrorState(null);
  }, [form]);

  /**
   * 设置表单值
   */
  const setValues = useCallback((values: Partial<T>) => {
    form.setFieldsValue(values);
  }, [form]);

  /**
   * 设置单个字段值
   */
  const setFieldValue = useCallback((name: string, value: any) => {
    form.setFieldValue(name, value);
  }, [form]);

  /**
   * 获取表单值
   */
  const getValues = useCallback((): T => {
    return form.getFieldsValue();
  }, [form]);

  /**
   * 验证表单字段
   */
  const validateFields = useCallback((): Promise<T> => {
    return form.validateFields();
  }, [form]);

  /**
   * 重置表单字段
   */
  const resetFields = useCallback(() => {
    form.resetFields();
    setTouched(false);
    setValid(false);
    setErrorState(null);
  }, [form]);

  /**
   * 设置字段
   */
  const setFields = useCallback((fields: FormField[]) => {
    form.setFields(fields);
  }, [form]);

  /**
   * 设置错误
   */
  const setError = useCallback((errorMessage: string | null) => {
    setErrorState(errorMessage);
  }, []);

  /**
   * 设置加载状态
   */
  const setLoading = useCallback((isLoading: boolean) => {
    setLoadingState(isLoading);
  }, []);

  /**
   * 初始化表单值
   */
  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue(initialValues);
    }
  }, [form, initialValues]);

  /**
   * 自动提交
   */
  useEffect(() => {
    if (autoSubmit) {
      handleSubmit();
    }
  }, [autoSubmit]);

  return {
    form,
    loading,
    submitting,
    error,
    touched,
    valid,
    handleSubmit,
    handleReset,
    setValues,
    setFieldValue,
    getValues,
    validateFields,
    resetFields,
    setFields,
    setError,
    setLoading,
  };
}

export default useForm;

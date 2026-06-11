/**
 * 数组工具函数
 * 提供常用的数组处理、转换、操作等工具函数
 */

/**
 * 数组去重
 */
export const unique = <T>(array: T[]): T[] => {
  return [...new Set(array)];
};

/**
 * 数组去重（基于对象属性）
 */
export const uniqueBy = <T, K extends keyof T>(array: T[], key: K): T[] => {
  const seen = new Set();
  return array.filter(item => {
    const value = item[key];
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
};

/**
 * 数组去重（基于比较函数）
 */
export const uniqueWith = <T>(array: T[], compareFn: (a: T, b: T) => boolean): T[] => {
  const result: T[] = [];
  for (const item of array) {
    if (!result.some(existing => compareFn(existing, item))) {
      result.push(item);
    }
  }
  return result;
};

/**
 * 数组交集
 */
export const intersection = <T>(...arrays: T[][]): T[] => {
  if (arrays.length === 0) return [];
  if (arrays.length === 1) return arrays[0];

  const [first, ...rest] = arrays;
  return first.filter(item => rest.every(arr => arr.includes(item)));
};

/**
 * 数组并集
 */
export const union = <T>(...arrays: T[][]): T[] => {
  return unique(arrays.flat());
};

/**
 * 数组差集（在第一个数组中但不在其他数组中）
 */
export const difference = <T>(first: T[], ...others: T[][]): T[] => {
  const otherItems = new Set(others.flat());
  return first.filter(item => !otherItems.has(item));
};

/**
 * 数组对称差集（在任一数组中但不在所有数组中）
 */
export const symmetricDifference = <T>(...arrays: T[][]): T[] => {
  if (arrays.length === 0) return [];
  if (arrays.length === 1) return arrays[0];

  const counts = new Map<T, number>();
  arrays.flat().forEach(item => {
    counts.set(item, (counts.get(item) || 0) + 1);
  });

  return [...counts.entries()]
    .filter(([_, count]) => count === 1)
    .map(([item]) => item);
};

/**
 * 数组分块
 */
export const chunk = <T>(array: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

/**
 * 数组展平
 */
export const flatten = <T>(array: (T | T[])[]): T[] => {
  return (array as any[]).flat() as T[];
};

/**
 * 数组深度展平
 */
export const flattenDeep = <T>(array: any[]): T[] => {
  const result: T[] = [];
  const stack = [...array];

  while (stack.length > 0) {
    const item = stack.shift();
    if (Array.isArray(item)) {
      stack.unshift(...item);
    } else {
      result.push(item as T);
    }
  }

  return result;
};

/**
 * 数组压缩（移除 falsy 值）
 */
export const compact = <T>(array: (T | null | undefined | false | '' | 0)[]): T[] => {
  return array.filter(Boolean) as T[];
};

/**
 * 数组分组
 */
export const groupBy = <T, K extends keyof T>(array: T[], key: K): Record<string, T[]> => {
  return array.reduce((result, item) => {
    const groupKey = String(item[key]);
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {} as Record<string, T[]>);
};

/**
 * 数组分组（基于函数）
 */
export const groupByFn = <T>(array: T[], fn: (item: T) => string): Record<string, T[]> => {
  return array.reduce((result, item) => {
    const groupKey = fn(item);
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {} as Record<string, T[]>);
};

/**
 * 数组按键分组（转换为 Map）
 */
export const keyBy = <T, K extends keyof T>(array: T[], key: K): Record<string, T> => {
  return array.reduce((result, item) => {
    const itemKey = String(item[key]);
    result[itemKey] = item;
    return result;
  }, {} as Record<string, T>);
};

/**
 * 数组按键分组（转换为 Map）
 */
export const toMap = <T, K extends keyof T>(array: T[], key: K): Map<string, T> => {
  const map = new Map<string, T>();
  array.forEach(item => {
    map.set(String(item[key]), item);
  });
  return map;
};

/**
 * 数组洗牌
 */
export const shuffle = <T>(array: T[]): T[] => {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

/**
 * 数组采样
 */
export const sample = <T>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

/**
 * 数组采样多个
 */
export const sampleSize = <T>(array: T[], n: number): T[] => {
  const shuffled = shuffle(array);
  return shuffled.slice(0, Math.min(n, array.length));
};

/**
 * 数组移动元素
 */
export const move = <T>(array: T[], from: number, to: number): T[] => {
  const result = [...array];
  const [removed] = result.splice(from, 1);
  result.splice(to, 0, removed);
  return result;
};

/**
 * 数组交换元素
 */
export const swap = <T>(array: T[], i: number, j: number): T[] => {
  const result = [...array];
  [result[i], result[j]] = [result[j], result[i]];
  return result;
};

/**
 * 数组删除元素
 */
export const remove = <T>(array: T[], index: number): T[] => {
  const result = [...array];
  result.splice(index, 1);
  return result;
};

/**
 * 数组删除多个元素
 */
export const removeMany = <T>(array: T[], indices: number[]): T[] => {
  const sortedIndices = [...indices].sort((a, b) => b - a);
  const result = [...array];
  for (const index of sortedIndices) {
    result.splice(index, 1);
  }
  return result;
};

/**
 * 数组删除匹配的元素
 */
export const removeBy = <T>(array: T[], predicate: (item: T) => boolean): T[] => {
  return array.filter(item => !predicate(item));
};

/**
 * 数组插入元素
 */
export const insert = <T>(array: T[], index: number, item: T): T[] => {
  const result = [...array];
  result.splice(index, 0, item);
  return result;
};

/**
 * 数组插入多个元素
 */
export const insertMany = <T>(array: T[], index: number, items: T[]): T[] => {
  const result = [...array];
  result.splice(index, 0, ...items);
  return result;
};

/**
 * 数组替换元素
 */
export const replace = <T>(array: T[], index: number, item: T): T[] => {
  const result = [...array];
  result[index] = item;
  return result;
};

/**
 * 数组查找元素索引
 */
export const indexOf = <T>(array: T[], item: T, fromIndex: number = 0): number => {
  return array.indexOf(item, fromIndex);
};

/**
 * 数组从后查找元素索引
 */
export const lastIndexOf = <T>(array: T[], item: T, fromIndex?: number): number => {
  return array.lastIndexOf(item, fromIndex);
};

/**
 * 数组查找元素（基于条件）
 */
export const findIndexBy = <T>(array: T[], predicate: (item: T) => boolean): number => {
  return array.findIndex(predicate);
};

/**
 * 数组从后查找元素（基于条件）
 */
export const findLastIndexBy = <T>(array: T[], predicate: (item: T) => boolean): number => {
  for (let i = array.length - 1; i >= 0; i--) {
    if (predicate(array[i])) {
      return i;
    }
  }
  return -1;
};

/**
 * 数组第一个元素
 */
export const first = <T>(array: T[]): T | undefined => {
  return array[0];
};

/**
 * 数组最后一个元素
 */
export const last = <T>(array: T[]): T | undefined => {
  return array[array.length - 1];
};

/**
 * 数组第N个元素
 */
export const nth = <T>(array: T[], n: number): T | undefined => {
  const index = n < 0 ? array.length + n : n;
  return array[index];
};

/**
 * 数组头部元素（前n个）
 */
export const head = <T>(array: T[], n: number = 1): T[] => {
  return array.slice(0, n);
};

/**
 * 数组尾部元素（后n个）
 */
export const tail = <T>(array: T[], n: number = 1): T[] => {
  return array.slice(-n);
};

/**
 * 数组初始元素（除最后一个）
 */
export const initial = <T>(array: T[]): T[] => {
  return array.slice(0, -1);
};

/**
 * 数组剩余元素（除第一个）
 */
export const rest = <T>(array: T[]): T[] => {
  return array.slice(1);
};

/**
 * 数组反转
 */
export const reverse = <T>(array: T[]): T[] => {
  return [...array].reverse();
};

/**
 * 数组排序
 */
export const sort = <T>(array: T[], compareFn?: (a: T, b: T) => number): T[] => {
  return [...array].sort(compareFn);
};

/**
 * 数组按属性排序
 */
export const sortBy = <T, K extends keyof T>(array: T[], key: K, order: 'asc' | 'desc' = 'asc'): T[] => {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];

    if (aVal < bVal) return order === 'asc' ? -1 : 1;
    if (aVal > bVal) return order === 'asc' ? 1 : -1;
    return 0;
  });
};

/**
 * 数组检查是否包含
 */
export const includes = <T>(array: T[], item: T): boolean => {
  return array.includes(item);
};

/**
 * 数组检查是否有任意元素满足条件
 */
export const some = <T>(array: T[], predicate: (item: T) => boolean): boolean => {
  return array.some(predicate);
};

/**
 * 数组检查是否所有元素满足条件
 */
export const every = <T>(array: T[], predicate: (item: T) => boolean): boolean => {
  return array.every(predicate);
};

/**
 * 数组查找元素
 */
export const find = <T>(array: T[], predicate: (item: T) => boolean): T | undefined => {
  return array.find(predicate);
};

/**
 * 数组从后查找元素
 */
export const findLast = <T>(array: T[], predicate: (item: T) => boolean): T | undefined => {
  for (let i = array.length - 1; i >= 0; i--) {
    if (predicate(array[i])) {
      return array[i];
    }
  }
  return undefined;
};

/**
 * 数组过滤
 */
export const filter = <T>(array: T[], predicate: (item: T) => boolean): T[] => {
  return array.filter(predicate);
};

/**
 * 数组映射
 */
export const map = <T, R>(array: T[], fn: (item: T, index: number) => R): R[] => {
  return array.map(fn);
};

/**
 * 数组归约
 */
export const reduce = <T, R>(array: T[], fn: (acc: R, item: T, index: number) => R, initial: R): R => {
  return array.reduce(fn, initial);
};

/**
 * 数组归约（从右到左）
 */
export const reduceRight = <T, R>(array: T[], fn: (acc: R, item: T, index: number) => R, initial: R): R => {
  return array.reduceRight(fn, initial);
};

/**
 * 数组迭代
 */
export const forEach = <T>(array: T[], fn: (item: T, index: number) => void): void => {
  array.forEach(fn);
};

/**
 * 数组连接
 */
export const concat = <T>(...arrays: T[][]): T[] => {
  return arrays.flat();
};

/**
 * 数组切片
 */
export const slice = <T>(array: T[], start: number, end?: number): T[] => {
  return array.slice(start, end);
};

/**
 * 数组拼接
 */
export const join = <T>(array: T[], separator: string = ','): string => {
  return array.map(String).join(separator);
};

/**
 * 数组求和
 */
export const sum = (array: number[]): number => {
  return array.reduce((acc, num) => acc + num, 0);
};

/**
 * 数组求平均值
 */
export const average = (array: number[]): number => {
  if (array.length === 0) return 0;
  return sum(array) / array.length;
};

/**
 * 数组求最大值
 */
export const max = <T>(array: T[]): T | undefined => {
  if (array.length === 0) return undefined;
  return array.reduce((acc, item) => (acc > item ? acc : item));
};

/**
 * 数组求最小值
 */
export const min = <T>(array: T[]): T | undefined => {
  if (array.length === 0) return undefined;
  return array.reduce((acc, item) => (acc < item ? acc : item));
};

/**
 * 数组按属性求最大值
 */
export const maxBy = <T, K extends keyof T>(array: T[], key: K): T | undefined => {
  if (array.length === 0) return undefined;
  return array.reduce((acc, item) => (acc[key] > item[key] ? acc : item));
};

/**
 * 数组按属性求最小值
 */
export const minBy = <T, K extends keyof T>(array: T[], key: K): T | undefined => {
  if (array.length === 0) return undefined;
  return array.reduce((acc, item) => (acc[key] < item[key] ? acc : item));
};

/**
 * 数组求长度
 */
export const size = <T>(array: T[]): number => {
  return array.length;
};

/**
 * 数组是否为空
 */
export const isEmpty = <T>(array: T[]): boolean => {
  return array.length === 0;
};

/**
 * 数组是否不为空
 */
export const isNotEmpty = <T>(array: T[]): boolean => {
  return array.length > 0;
};

/**
 * 数组相等比较
 */
export const equals = <T>(array1: T[], array2: T[]): boolean => {
  if (array1.length !== array2.length) return false;
  return array1.every((item, index) => item === array2[index]);
};

/**
 * 数组深度相等比较
 */
export const deepEquals = <T>(array1: T[], array2: T[]): boolean => {
  if (array1.length !== array2.length) return false;

  for (let i = 0; i < array1.length; i++) {
    const a = array1[i];
    const b = array2[i];

    if (Array.isArray(a) && Array.isArray(b)) {
      if (!deepEquals(a, b)) return false;
    } else if (typeof a === 'object' && typeof b === 'object' && a !== null && b !== null) {
      if (JSON.stringify(a) !== JSON.stringify(b)) return false;
    } else if (a !== b) {
      return false;
    }
  }

  return true;
};

/**
 * 数组分割（在指定索引处）
 */
export const splitAt = <T>(array: T[], index: number): [T[], T[]] => {
  return [array.slice(0, index), array.slice(index)];
};

/**
 * 数组分割（基于条件）
 */
export const splitBy = <T>(array: T[], predicate: (item: T) => boolean): [T[], T[]] => {
  const truthy: T[] = [];
  const falsy: T[] = [];

  for (const item of array) {
    if (predicate(item)) {
      truthy.push(item);
    } else {
      falsy.push(item);
    }
  }

  return [truthy, falsy];
};

/**
 * 数组分割成N份
 */
export const partition = <T>(array: T[], n: number): T[][] => {
  const result: T[][] = [];
  const chunkSize = Math.ceil(array.length / n);

  for (let i = 0; i < n; i++) {
    const start = i * chunkSize;
    const end = start + chunkSize;
    result.push(array.slice(start, end));
  }

  return result;
};

/**
 * 数组范围生成
 */
export const range = (start: number, end: number, step: number = 1): number[] => {
  const result: number[] = [];
  for (let i = start; i < end; i += step) {
    result.push(i);
  }
  return result;
};

/**
 * 数组填充
 */
export const fill = <T>(array: T[], value: T, start?: number, end?: number): T[] => {
  const result = [...array];
  result.fill(value, start, end);
  return result;
};

/**
 * 数组元素计数
 */
export const count = <T>(array: T[], predicate: (item: T) => boolean): number => {
  return array.filter(predicate).length;
};

/**
 * 数组元素出现次数统计
 */
export const countBy = <T>(array: T[], keyExtractor: (item: T) => string): Record<string, number> => {
  return array.reduce((acc, item) => {
    const key = keyExtractor(item);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
};

/**
 * 数组去重后计数
 */
export const countUnique = <T>(array: T[]): number => {
  return unique(array).length;
};

/**
 * 数组分隔符连接
 */
export const intersperse = <T>(array: T[], separator: T): T[] => {
  const result: T[] = [];
  for (let i = 0; i < array.length; i++) {
    if (i > 0) result.push(separator);
    result.push(array[i]);
  }
  return result;
};

/**
 * 数组合并（保留顺序，去重）
 */
export const merge = <T>(...arrays: T[][]): T[] => {
  return union(...arrays);
};

/**
 * 数组差值
 */
export const diff = <T>(a: T[], b: T[]): T[] => {
  return a.filter(x => !b.includes(x));
};

/**
 * 数组对称差值
 */
export const xor = <T>(...arrays: T[][]): T[] => {
  return symmetricDifference(...arrays);
};

/**
 * 数组检查是否为子集
 */
export const isSubset = <T>(subset: T[], superset: T[]): boolean => {
  return subset.every(item => superset.includes(item));
};

/**
 * 数组检查是否为超集
 */
export const isSuperset = <T>(superset: T[], subset: T[]): boolean => {
  return isSubset(subset, superset);
};

/**
 * 数组转换为对象
 */
export const toObject = <T, K extends string | number>(
  array: T[],
  keyFn: (item: T, index: number) => K,
  valueFn?: (item: T, index: number) => T
): Record<K, T> => {
  return array.reduce((acc, item, index) => {
    const key = keyFn(item, index);
    acc[key] = valueFn ? valueFn(item, index) : item;
    return acc;
  }, {} as Record<K, T>);
};

/**
 * 数组转换为键值对
 */
export const toPairs = <T>(array: T[]): Array<[T, T]> => {
  const pairs: Array<[T, T]> = [];
  for (let i = 0; i < array.length - 1; i += 2) {
    pairs.push([array[i], array[i + 1]]);
  }
  return pairs;
};

/**
 * 数组从键值对生成
 */
export const fromPairs = <T>(pairs: Array<[T, T]>): T[] => {
  return pairs.flat();
};

/**
 * 数组窗口滑动
 */
export const window = <T>(array: T[], size: number): T[][] => {
  const windows: T[][] = [];
  for (let i = 0; i <= array.length - size; i++) {
    windows.push(array.slice(i, i + size));
  }
  return windows;
};

/**
 * 数组查找重复元素
 */
export const duplicates = <T>(array: T[]): T[] => {
  const seen = new Set<T>();
  const dupes = new Set<T>();

  for (const item of array) {
    if (seen.has(item)) {
      dupes.add(item);
    } else {
      seen.add(item);
    }
  }

  return [...dupes];
};

/**
 * 数组查找唯一元素
 */
export const uniques = <T>(array: T[]): T[] => {
  const counts = new Map<T, number>();
  array.forEach(item => {
    counts.set(item, (counts.get(item) || 0) + 1);
  });

  return [...counts.entries()]
    .filter(([_, count]) => count === 1)
    .map(([item]) => item);
};

export default {
  unique,
  uniqueBy,
  uniqueWith,
  intersection,
  union,
  difference,
  symmetricDifference,
  chunk,
  flatten,
  flattenDeep,
  compact,
  groupBy,
  groupByFn,
  keyBy,
  toMap,
  shuffle,
  sample,
  sampleSize,
  move,
  swap,
  remove,
  removeMany,
  removeBy,
  insert,
  insertMany,
  replace,
  indexOf,
  lastIndexOf,
  findIndexBy,
  findLastIndexBy,
  first,
  last,
  nth,
  head,
  tail,
  initial,
  rest,
  reverse,
  sort,
  sortBy,
  includes,
  some,
  every,
  find,
  findLast,
  filter,
  map,
  reduce,
  reduceRight,
  forEach,
  concat,
  slice,
  join,
  sum,
  average,
  max,
  min,
  maxBy,
  minBy,
  size,
  isEmpty,
  isNotEmpty,
  equals,
  deepEquals,
  splitAt,
  splitBy,
  partition,
  range,
  fill,
  count,
  countBy,
  countUnique,
  intersperse,
  merge,
  diff,
  xor,
  isSubset,
  isSuperset,
  toObject,
  toPairs,
  fromPairs,
  window,
  duplicates,
  uniques,
};

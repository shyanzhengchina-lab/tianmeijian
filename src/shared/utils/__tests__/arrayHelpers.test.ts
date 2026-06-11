/**
 * Array Helpers 单元测试
 */

import {
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
  removeBy,
  insert,
  replace,
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
} from '../arrayHelpers';

describe('Array Helpers', () => {
  describe('unique functions', () => {
    it('should remove duplicates', () => {
      expect(unique([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3]);
    });

    it('should remove duplicates by key', () => {
      const data = [
        { id: 1, name: 'a' },
        { id: 2, name: 'b' },
        { id: 1, name: 'c' },
      ];
      expect(uniqueBy(data, 'id')).toHaveLength(2);
    });

    it('should remove duplicates with compare function', () => {
      const data = [
        { id: 1, value: 'a' },
        { id: 2, value: 'b' },
        { id: 1, value: 'a' },
      ];
      const result = uniqueWith(data, (a, b) => a.id === b.id && a.value === b.value);
      expect(result).toHaveLength(2);
    });
  });

  describe('set operations', () => {
    it('should compute intersection', () => {
      expect(intersection([1, 2, 3], [2, 3, 4])).toEqual([2, 3]);
    });

    it('should compute union', () => {
      expect(union([1, 2], [2, 3])).toEqual([1, 2, 3]);
    });

    it('should compute difference', () => {
      expect(difference([1, 2, 3], [2, 3, 4])).toEqual([1]);
    });

    it('should compute symmetric difference', () => {
      expect(symmetricDifference([1, 2, 3], [2, 3, 4])).toEqual([1, 4]);
    });
  });

  describe('chunking and flattening', () => {
    it('should chunk array', () => {
      expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    });

    it('should flatten array', () => {
      expect(flatten([1, [2, [3]]])).toEqual([1, 2, [3]]);
    });

    it('should flatten deep array', () => {
      expect(flattenDeep([1, [2, [3, [4]]]])).toEqual([1, 2, 3, 4]);
    });

    it('should compact array', () => {
      expect(compact([0, 1, false, 2, '', 3, null, undefined])).toEqual([1, 2, 3]);
    });
  });

  describe('grouping', () => {
    it('should group by key', () => {
      const data = [
        { id: 1, type: 'a' },
        { id: 2, type: 'b' },
        { id: 3, type: 'a' },
      ];
      const result = groupBy(data, 'type');
      expect(result['a']).toHaveLength(2);
      expect(result['b']).toHaveLength(1);
    });

    it('should group by function', () => {
      const data = [1, 2, 3, 4, 5, 6];
      const result = groupByFn(data, n => (n % 2 === 0 ? 'even' : 'odd'));
      expect(result['even']).toEqual([2, 4, 6]);
      expect(result['odd']).toEqual([1, 3, 5]);
    });

    it('should key by', () => {
      const data = [
        { id: 1, name: 'a' },
        { id: 2, name: 'b' },
      ];
      const result = keyBy(data, 'id');
      expect(result['1']).toEqual(data[0]);
      expect(result['2']).toEqual(data[1]);
    });

    it('should convert to map', () => {
      const data = [
        { id: 1, name: 'a' },
        { id: 2, name: 'b' },
      ];
      const map = toMap(data, 'id');
      expect(map.get('1')).toEqual(data[0]);
      expect(map.get('2')).toEqual(data[1]);
    });
  });

  describe('sampling and shuffling', () => {
    it('should shuffle array', () => {
      const arr = [1, 2, 3, 4, 5];
      const shuffled = shuffle(arr);
      expect(shuffled).toHaveLength(5);
      expect(shuffled).toContain(1);
      expect(shuffled).toContain(5);
    });

    it('should sample one element', () => {
      const arr = [1, 2, 3, 4, 5];
      const sampled = sample(arr);
      expect(arr).toContain(sampled);
    });

    it('should sample multiple elements', () => {
      const arr = [1, 2, 3, 4, 5];
      const sampled = sampleSize(arr, 3);
      expect(sampled).toHaveLength(3);
    });
  });

  describe('array manipulation', () => {
    it('should move element', () => {
      expect(move([1, 2, 3, 4], 0, 2)).toEqual([2, 3, 1, 4]);
    });

    it('should swap elements', () => {
      expect(swap([1, 2, 3, 4], 0, 2)).toEqual([3, 2, 1, 4]);
    });

    it('should remove element', () => {
      expect(remove([1, 2, 3, 4], 2)).toEqual([1, 2, 4]);
    });

    it('should remove by predicate', () => {
      expect(removeBy([1, 2, 3, 4, 5], x => x % 2 === 0)).toEqual([1, 3, 5]);
    });

    it('should insert element', () => {
      expect(insert([1, 2, 4], 2, 3)).toEqual([1, 2, 3, 4]);
    });

    it('should replace element', () => {
      expect(replace([1, 2, 3], 1, 10)).toEqual([1, 10, 3]);
    });
  });

  describe('element access', () => {
    it('should get first element', () => {
      expect(first([1, 2, 3])).toBe(1);
      expect(first([])).toBeUndefined();
    });

    it('should get last element', () => {
      expect(last([1, 2, 3])).toBe(3);
      expect(last([])).toBeUndefined();
    });

    it('should get nth element', () => {
      expect(nth([1, 2, 3], 1)).toBe(2);
      expect(nth([1, 2, 3], -1)).toBe(3);
    });

    it('should get head', () => {
      expect(head([1, 2, 3, 4], 2)).toEqual([1, 2]);
    });

    it('should get tail', () => {
      expect(tail([1, 2, 3, 4], 2)).toEqual([3, 4]);
    });

    it('should get initial', () => {
      expect(initial([1, 2, 3])).toEqual([1, 2]);
    });

    it('should get rest', () => {
      expect(rest([1, 2, 3])).toEqual([2, 3]);
    });
  });

  describe('sorting', () => {
    it('should reverse array', () => {
      expect(reverse([1, 2, 3])).toEqual([3, 2, 1]);
    });

    it('should sort array', () => {
      expect(sort([3, 1, 2])).toEqual([1, 2, 3]);
    });

    it('should sort by key', () => {
      const data = [
        { id: 3, name: 'c' },
        { id: 1, name: 'a' },
        { id: 2, name: 'b' },
      ];
      expect(sortBy(data, 'id')).toEqual([
        { id: 1, name: 'a' },
        { id: 2, name: 'b' },
        { id: 3, name: 'c' },
      ]);
    });
  });

  describe('array queries', () => {
    it('should check if includes', () => {
      expect(includes([1, 2, 3], 2)).toBe(true);
      expect(includes([1, 2, 3], 4)).toBe(false);
    });

    it('should check if some', () => {
      expect(some([1, 2, 3], x => x > 2)).toBe(true);
      expect(some([1, 2, 3], x => x > 5)).toBe(false);
    });

    it('should check if every', () => {
      expect(every([1, 2, 3], x => x > 0)).toBe(true);
      expect(every([1, 2, 3], x => x > 2)).toBe(false);
    });

    it('should find element', () => {
      expect(find([1, 2, 3], x => x > 1)).toBe(2);
    });

    it('should find last element', () => {
      expect(findLast([1, 2, 3, 2], x => x === 2)).toBe(2);
    });

    it('should filter array', () => {
      expect(filter([1, 2, 3, 4], x => x % 2 === 0)).toEqual([2, 4]);
    });

    it('should map array', () => {
      expect(map([1, 2, 3], x => x * 2)).toEqual([2, 4, 6]);
    });

    it('should reduce array', () => {
      expect(reduce([1, 2, 3], (acc, x) => acc + x, 0)).toBe(6);
    });
  });

  describe('math operations', () => {
    it('should sum array', () => {
      expect(sum([1, 2, 3, 4])).toBe(10);
    });

    it('should average array', () => {
      expect(average([1, 2, 3, 4])).toBe(2.5);
      expect(average([])).toBe(0);
    });

    it('should find max', () => {
      expect(max([1, 2, 3, 4])).toBe(4);
      expect(max([])).toBeUndefined();
    });

    it('should find min', () => {
      expect(min([1, 2, 3, 4])).toBe(1);
      expect(min([])).toBeUndefined();
    });

    it('should find max by key', () => {
      const data = [
        { id: 1, value: 10 },
        { id: 2, value: 20 },
        { id: 3, value: 15 },
      ];
      expect(maxBy(data, 'value')).toEqual(data[1]);
    });

    it('should find min by key', () => {
      const data = [
        { id: 1, value: 10 },
        { id: 2, value: 20 },
        { id: 3, value: 15 },
      ];
      expect(minBy(data, 'value')).toEqual(data[0]);
    });
  });

  describe('array properties', () => {
    it('should get size', () => {
      expect(size([1, 2, 3])).toBe(3);
    });

    it('should check if empty', () => {
      expect(isEmpty([])).toBe(true);
      expect(isEmpty([1])).toBe(false);
    });

    it('should check if not empty', () => {
      expect(isNotEmpty([1])).toBe(true);
      expect(isNotEmpty([])).toBe(false);
    });

    it('should check equality', () => {
      expect(equals([1, 2, 3], [1, 2, 3])).toBe(true);
      expect(equals([1, 2, 3], [1, 2, 4])).toBe(false);
    });

    it('should check deep equality', () => {
      expect(deepEquals([1, [2, 3]], [1, [2, 3]])).toBe(true);
      expect(deepEquals([1, [2, 3]], [1, [2, 4]])).toBe(false);
    });
  });

  describe('array splitting', () => {
    it('should split at index', () => {
      expect(splitAt([1, 2, 3, 4], 2)).toEqual([[1, 2], [3, 4]]);
    });

    it('should split by predicate', () => {
      expect(splitBy([1, 2, 3, 4], x => x % 2 === 0)).toEqual([[2, 4], [1, 3]]);
    });

    it('should partition array', () => {
      expect(partition([1, 2, 3, 4, 5], 2)).toEqual([
        [1, 2],
        [3, 4],
        [5],
      ]);
    });
  });

  describe('range and fill', () => {
    it('should create range', () => {
      expect(range(0, 5)).toEqual([0, 1, 2, 3, 4]);
      expect(range(0, 10, 2)).toEqual([0, 2, 4, 6, 8]);
    });

    it('should fill array', () => {
      expect(fill([1, 2, 3], 0)).toEqual([0, 0, 0]);
      expect(fill([1, 2, 3], 0, 1, 2)).toEqual([1, 0, 3]);
    });
  });

  describe('counting', () => {
    it('should count by predicate', () => {
      expect(count([1, 2, 3, 4, 5], x => x % 2 === 0)).toBe(2);
    });

    it('should count by key extractor', () => {
      const data = [
        { type: 'a' },
        { type: 'b' },
        { type: 'a' },
        { type: 'b' },
        { type: 'c' },
      ];
      const result = countBy(data, x => x.type);
      expect(result['a']).toBe(2);
      expect(result['b']).toBe(2);
      expect(result['c']).toBe(1);
    });

    it('should count unique', () => {
      expect(countUnique([1, 2, 2, 3, 3, 3])).toBe(3);
    });
  });

  describe('array transformation', () => {
    it('should intersperse separator', () => {
      expect(intersperse([1, 2, 3], 0)).toEqual([1, 0, 2, 0, 3]);
    });

    it('should merge arrays', () => {
      expect(merge([1, 2], [2, 3], [3, 4])).toEqual([1, 2, 3, 4]);
    });

    it('should diff arrays', () => {
      expect(diff([1, 2, 3], [2, 3, 4])).toEqual([1]);
    });

    it('should xor arrays', () => {
      expect(xor([1, 2, 3], [2, 3, 4])).toEqual([1, 4]);
    });

    it('should check if subset', () => {
      expect(isSubset([1, 2], [1, 2, 3])).toBe(true);
      expect(isSubset([1, 4], [1, 2, 3])).toBe(false);
    });

    it('should check if superset', () => {
      expect(isSuperset([1, 2, 3], [1, 2])).toBe(true);
      expect(isSuperset([1, 2], [1, 2, 3])).toBe(false);
    });

    it('should convert to object', () => {
      expect(toObject([1, 2, 3], x => `key${x}`)).toEqual({
        key1: 1,
        key2: 2,
        key3: 3,
      });
    });

    it('should convert to pairs', () => {
      expect(toPairs([1, 2, 3, 4])).toEqual([[1, 2], [3, 4]]);
    });

    it('should convert from pairs', () => {
      expect(fromPairs([[1, 2], [3, 4]])).toEqual([1, 2, 3, 4]);
    });
  });

  describe('window operations', () => {
    it('should create sliding windows', () => {
      expect(window([1, 2, 3, 4], 2)).toEqual([
        [1, 2],
        [2, 3],
        [3, 4],
      ]);
    });

    it('should find duplicates', () => {
      expect(duplicates([1, 2, 2, 3, 3, 3, 4])).toEqual([2, 3]);
    });

    it('should find uniques', () => {
      expect(uniques([1, 2, 2, 3, 3, 3, 4])).toEqual([1, 4]);
    });
  });
});

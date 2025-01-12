export const ITEM_KEY = "id";
export const ITEM_NAME = "label";

export const EVENT_NAME_UP_MAX = "emitUpMax";
export const MAX_LENGTH = Infinity;

/**
 * 将数据源格式化为包含id和label的对象数组
 * @param dataSource
 * @param itemKey
 * @param itemName
 * @returns {*[]}
 */
export function normalizeList(
  dataSource,
  itemKey = ITEM_KEY,
  itemName = ITEM_NAME
) {
  if (!Array.isArray(dataSource) || dataSource.length === 0) {
    return [];
  }
  if (ITEM_NAME === itemName && itemKey === ITEM_KEY) return dataSource;
  const list = [];
  for (let i = 0; i < dataSource.length; i++) {
    const item = dataSource[i];
    if (item[itemKey] === undefined) {
      // 可以为0，但是不允许是 undefined
      console.error(`数据源中没有找到itemKey为${itemKey}的字段，请检查数据`);
    }
    const name = item[itemName];
    if (!name) {
      console.error(`数据源中没有找到itemName为${itemName}的字段，请检查数据`);
    }
    list.push({
      ...item,
      [ITEM_KEY]: item[itemKey],
      [ITEM_NAME]: typeof name === "number" ? String(name) : name,
    });
  }
  return list;
}

/**
 * 比较两个数组，返回新增、删除和相等的keys
 * @param nextValues
 * @param preValues
 * @returns {{data: *, type: string}|{data, type: string}}
 */
export const compare = (nextValues, preValues) => {
  if (nextValues.length > preValues.length) {
    // 新增了
    return {
      type: "add",
      data: nextValues.filter((item) => !preValues.includes(item)),
    };
  } else if (nextValues.length < preValues.length) {
    // 删除了
    return {
      type: "del",
      data: preValues.filter((item) => !nextValues.includes(item)),
    };
  } else if (nextValues.length === preValues.length) {
    return {
      type: "equal",
      data: nextValues,
    };
  }
};

/**
 * 获取当前页选中的keys
 * @param visibleList
 * @param checkedLabelKeys
 * @returns {*}
 */
export function getCurrentPageCheckedKeys(visibleList, checkedLabelKeys) {
  const visibleIds = visibleList.map((item) => item.id);
  const result = [];
  for (let i = 0; i < checkedLabelKeys.length; i++) {
    const key = checkedLabelKeys[i];
    if (visibleIds.includes(key)) {
      result.push(key);
    }
  }
  return result;
}

/**
 * 获取选中的前指定数量的keys
 * @param filteredLabelList
 * @param maxLength
 * @returns {*}
 */
export function getLimitKeys(filteredLabelList, maxLength) {
  return filteredLabelList.slice(0, maxLength).map((item) => item.id);
}

/**
 * 判断数组是否相等，不考虑顺序
 */
export function isEqualArray(arr1, arr2) {
  const arr1Str = arr1.sort().toString();
  const arr2Str = arr2.sort().toString();
  return arr1Str === arr2Str;
}

/**
 * 判断当前页是否全选
 * @param currentPageKeys
 * @param checkedLabelKeys
 * @param visibleList
 * @returns {*|boolean}
 */
export function calcIfCurrentPageCheckedAll(
  currentPageKeys,
  checkedLabelKeys,
  visibleList
) {
  const currentPageKeysLength = currentPageKeys.length;
  const checkedCount = checkedLabelKeys.length;
  if (currentPageKeysLength === 0 || checkedCount === 0) {
    return false;
  }
  const currentPageCheckedKeys = getCurrentPageCheckedKeys(
    visibleList,
    checkedLabelKeys
  );
  // console.log("currentPageCheckedKeys", currentPageCheckedKeys);
  if (currentPageCheckedKeys.length !== currentPageKeysLength) {
    return false;
  } else {
    return currentPageKeys.every((key) => currentPageCheckedKeys.includes(key));
  }
}

/**
 * 判断当前页是否全选
 * @param visibleList
 * @param checkedLabelKeys
 * @returns {boolean}
 */
export function calcIfCurrentPageCheckedAllNew(visibleList, checkedLabelKeys) {
  const currentPageKeysLength = visibleList.length;
  const checkedCount = checkedLabelKeys.length;
  if (currentPageKeysLength === 0 || checkedCount === 0) {
    return {
      isChecked: false,
      currentPageCheckedKeys: [],
    };
  }
  const currentPageCheckedKeys = [];
  visibleList.forEach((item) => {
    if (checkedLabelKeys.includes(item.id)) {
      currentPageCheckedKeys.push(item.id);
    }
  });
  const isChecked = currentPageCheckedKeys.length === visibleList.length;
  return {
    isChecked,
    currentPageCheckedKeys,
  };
}

export function calcIfCurrentPageCheckedAllBySet(
  visibleList,
  checkedLabelKeys
) {
  const currentPageKeysLength = visibleList.length;
  const checkedCount = checkedLabelKeys.size;
  if (currentPageKeysLength === 0 || checkedCount === 0) {
    return {
      isChecked: false,
      currentPageCheckedKeys: [],
    };
  }
  const currentPageCheckedKeys = [];
  visibleList.forEach((item) => {
    if (checkedLabelKeys.has(item.id)) {
      currentPageCheckedKeys.push(item.id);
    }
  });
  const isChecked = currentPageCheckedKeys.length === visibleList.length;
  return {
    isChecked,
    currentPageCheckedKeys,
  };
}

/**
 * 判断是否勾选限制数量
 * @param checkedLabelKeys
 * @param maxLimitList
 * @returns {{currentLimitCheckedKeys: *[], isChecked: boolean}|boolean}
 */
export function calcIfCheckLimit(checkedLabelKeys, maxLimitList) {
  const checkedCount = checkedLabelKeys.length;
  const maxLimitListLength = maxLimitList.length;
  if (checkedCount === 0 || maxLimitListLength === 0) {
    return false;
  }
  const currentLimitCheckedKeys = [];
  for (let i = 0; i < maxLimitList.length; i++) {
    const limit = maxLimitList[i];
    if (checkedLabelKeys.includes(limit.id)) {
      currentLimitCheckedKeys.push(limit.id);
    }
  }
  const isCheckedLimit = currentLimitCheckedKeys.length === maxLimitListLength;
  return {
    isCheckedLimit,
    currentLimitCheckedKeys,
  };
}

export function calcIfCheckLimitBySet(checkedLabelKeys, maxLimitList) {
  const checkedCount = checkedLabelKeys.size;
  const maxLimitListLength = maxLimitList.length;
  if (checkedCount === 0 || maxLimitListLength === 0) {
    return false;
  }
  const currentLimitCheckedKeys = [];
  for (let i = 0; i < maxLimitList.length; i++) {
    const limit = maxLimitList[i];
    if (checkedLabelKeys.has(limit.id)) {
      currentLimitCheckedKeys.push(limit.id);
    }
  }
  const isCheckedLimit = currentLimitCheckedKeys.length === maxLimitListLength;
  return {
    isCheckedLimit,
    currentLimitCheckedKeys,
  };
}

/**
 * 判断是否全选所有
 * @param allCheckedCount
 * @param filterLength
 * @returns {{isCheckedAll: boolean, isIndeterminate: boolean}}
 */
export function calcIfCheckedAll(allCheckedCount, filterLength) {
  return {
    isCheckedAll: allCheckedCount > 0 && allCheckedCount === filterLength,
    isIndeterminate: allCheckedCount > 0 && allCheckedCount < filterLength,
  };
}

/**
 * 数组差集 在arr1中，不在arr2中的元素
 * @param arr1
 * @param arr2
 */

export function difference(arr1, arr2) {
  return Array.from(new Set(arr1.filter((item) => !arr2.includes(item))));
}

/**
 * 计算当前页选中的keys
 * @param currentPageKeys
 * @param checkedLabelKeys
 * @returns {*}
 */
export function calcCurrenPageCheckedKeys(currentPageKeys, checkedLabelKeys) {
  const _currentPageKeys = currentPageKeys;
  return checkedLabelKeys.filter((item) => _currentPageKeys.includes(item));
}

/**
 * 获取当前页的keys
 * @param visibleList
 * @returns {*}
 */
export function getCurrentPageKeys(visibleList) {
  return visibleList.map((item) => item?.id);
}

/**
 * 数组差集 在set中的元素 但不在arr中
 * @param checkedLabelKeysSet
 * @param arr
 * @returns {Set<any>}
 */
export function filterNotInSet(checkedLabelKeysSet, arr) {
  // 将 data 转换为 Set，以提高查找效率
  const dataSet = new Set(arr);

  // 创建一个新的 Set 来存储过滤后的结果
  const filteredSet = new Set();

  // 遍历 checkedLabelKeysSet，过滤出不包含在 dataSet 中的元素
  for (const item of checkedLabelKeysSet) {
    if (!dataSet.has(item)) {
      filteredSet.add(item);
    }
  }
  return filteredSet;
}

/**
 * 计算当前页允许勾选的数量
 * TIP: 其实当前页允许勾选的数量，最大不能超过 当前页的数量和配置的最大允许勾选数量 中的最小值
 * 不过这里简单处理了，不考虑当前页的数量
 * @param isCheckedLimit
 * @param currentPageCheckedKeys
 * @param maxLength
 * @param checkedLabelKeys
 * @returns {number|undefined|*}
 */
export function calcCurrentPageMaxLength(
  isCheckedLimit,
  currentPageCheckedKeys,
  maxLength,
  checkedLabelKeys
) {
  // 若开启了限制,允许勾选的数量，就是当前选中的数量
  if (isCheckedLimit) {
    // 若当前页选中数量为0，则返回undefined，即使用disabled整页禁用
    // 之所以不使用0，是因为max设置为0，样式会有bug，组件要求max必须大于0
    return currentPageCheckedKeys.length || undefined;
  }
  // 无勾选时，允许勾选的数量，就是最大数量
  if (checkedLabelKeys === 0) return maxLength;
  // 计算除了当前页选中的keys，剩余已选中的keys
  const remainingSelections = filterNotInSet(
    checkedLabelKeys,
    currentPageCheckedKeys
  );

  // 否则，允许勾选的数量，就是最大数量 - 剩余的数量
  return maxLength - remainingSelections.size || undefined;
}

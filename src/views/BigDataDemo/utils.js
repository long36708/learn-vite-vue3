/**
 * @Author: longmo
 * @Date: 2025-01-05 10:32:25
 * @LastEditTime: 2025-01-05 10:36:43
 * @FilePath: src/views/BigDataDemo/utils.js
 * @Description:
 */
export const compare = (nextList, prevList) => {
  if (nextList.length > prevList.length) {
    return {
      type: "add",
      data: nextList.filter((item) => !prevList.includes(item)),
    };
  } else if (nextList.length < prevList.length) {
    return {
      type: "del",
      data: prevList.filter((item) => !nextList.includes(item)),
    };
  } else if (nextList.length === prevList.length) {
    const sameData = nextList.filter((item) => prevList.includes(item));
    if (sameData.length !== nextList.length) {
      console.error("数据异常");
    }
    return {
      type: "same",
      data: sameData,
    };
  }
};

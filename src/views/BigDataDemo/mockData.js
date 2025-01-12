/**
 * @Author: longmo
 * @Date: 2025-01-05 10:30:38
 * @LastEditTime: 2025-01-05 11:02:52
 * @FilePath: src/views/BigDataDemo/mockData.js
 * @Description:
 */
export const mockBigData = () => {
  // const count = 1_000_000;
  // const count = 250;
  const count = 250_000;
  const data = [];
  for (let i = 0; i < count; i++) {
    data.push({
      id: i,
      label: `标签${i}`,
    });
  }
  return data;
};

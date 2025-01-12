// export const INIT_COUNT= 300_000;
export const INIT_COUNT = 250_000
// export const INIT_COUNT = 1_000_000;
export const mockBigData = count => {
  // const count = 1_000_000;
  // const count = 250;
  // const count = 250_000;
  const data = []
  for (let i = 0; i < count; i++) {
    data.push({
      key: i,
      label: `标签${i}`,
    })
  }
  return data
}

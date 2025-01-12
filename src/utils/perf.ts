/**
 * @Author: longmo
 * @Date: 2025-01-05 10:31:16
 * @LastEditTime: 2025-01-05 10:31:31
 * @FilePath: src/utils/perf.ts
 * @Description:
 */
/**
 * 性能监视器类，用于测量代码块的执行时间
 * 注意：打印功能支持链式调用，打印后记得调用reset()方法重置监视器
 */
export class PerformanceMonitor {
  constructor(
    options = {
      unitFn: (duration) => duration,
      unitLabel: "ms",
    }
  ) {
    this.performance = performance;
    this.measurements = [];
    this.unitFn = options.unitFn;
    this.unitLabel = options.unitLabel;
  }

  start(label) {
    if (!label) {
      throw new Error("Invalid label");
    }
    this.performance.mark(`${label}-start`);
  }

  stop(label) {
    if (!label) {
      throw new Error("Invalid label");
    }

    this.performance.mark(`${label}-end`);
    this.performance.measure(label, `${label}-start`, `${label}-end`);
    const entry = this.performance.getEntriesByName(label)[0];
    this.measurements.push(entry);
    console.log(
      `Performance measurement for ${label}: ${this.unitFn(entry.duration)} ${
        this.unitLabel
      }`
    );
  }

  clear(label) {
    this.performance.clearMarks(`${label}-start`);
    this.performance.clearMarks(`${label}-end`);
    this.performance.clearMeasures(label);
  }

  getMeasurements() {
    return this.measurements;
  }

  getFirstMeasurement() {
    return {
      ...this.measurements[0],
      duration: this.getFirstMeasurementDuration(),
    };
  }

  getFirstMeasurementDuration() {
    return this.unitFn(this.measurements[0].duration);
  }

  /**
   * 以表格形式打印所有性能测量结果
   * @returns {PerformanceMonitor}
   */
  logMeasurements() {
    const measurements = JSON.parse(JSON.stringify(this.measurements));
    const table = measurements.map((item) => ({
      ...item,
      duration: this.unitFn(item.duration),
      startTime: this.unitFn(item.startTime),
    }));
    console.table(table);
    return this;
  }

  /**
   * 打印第一个性能测量结果的耗时
   * @returns {PerformanceMonitor}
   */
  logFirstMeasurementDuration() {
    const taskName = this.measurements[0].name;
    console.log(
      `${taskName}任务耗时 ==> ${this.getFirstMeasurementDuration()} ${
        this.unitLabel
      }`
    );
    return this;
  }

  /**
   * 打印所有性能测量结果的耗时
   * @returns {PerformanceMonitor}
   */
  logMeasurementsDuration() {
    const measurements = this.measurements;
    const labels = [...new Set(measurements.map((m) => m.name))];
    labels.forEach((label) => {
      const durations = measurements
        .filter((m) => m.name === label)
        .map((m) => this.unitFn(m.duration));
      console.log(`${label}任务耗时 ==>`, durations);
    });
    return this;
  }

  /**
   * 打印指定标签的耗时
   * @param label
   * @returns {PerformanceMonitor}
   */
  logMeasurementsDurationBy(label) {
    const measurements = this.measurements;
    const durations = measurements
      .filter((m) => m.name === label)
      .map((m) => this.unitFn(m.duration));
    console.log(`${label}任务耗时 ==> ${durations} ${this.unitLabel}`);
    return this;
  }

  /**
   * 重置性能监视器，以防止内存泄漏或意外行为
   */
  reset() {
    this.measurements = [];
    this.performance.clearMarks();
    this.performance.clearMeasures();
  }
}

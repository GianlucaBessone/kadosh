/**
 * Wrapper for the native Performance API.
 */
export class PerformanceMonitor {
  static start(name: string): void {
    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark(`${name}_start`);
    }
  }

  static end(name: string): number | null {
    if (typeof performance !== 'undefined' && performance.mark && performance.measure) {
      performance.mark(`${name}_end`);
      try {
        const measure = performance.measure(name, `${name}_start`, `${name}_end`);
        performance.clearMarks(`${name}_start`);
        performance.clearMarks(`${name}_end`);
        performance.clearMeasures(name);
        return measure.duration;
      } catch (e) {
        console.warn(`Failed to measure performance for ${name}`, e);
      }
    }
    return null;
  }
}

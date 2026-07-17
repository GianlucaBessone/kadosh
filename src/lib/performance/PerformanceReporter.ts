export interface MetricRecord {
  name: string;
  category: 'dexie' | 'react' | 'navigation' | 'crypto' | 'projection';
  duration: number;
  details?: any;
  timestamp: number;
}

class Reporter {
  private metrics: MetricRecord[] = [];

  record(metric: Omit<MetricRecord, 'timestamp'>) {
    this.metrics.push({
      ...metric,
      timestamp: Date.now(),
    });
  }

  getMetrics() {
    return this.metrics;
  }

  clear() {
    this.metrics = [];
  }

  printReport() {
    console.group('📊 Performance Audit Report');
    const aggregated = this.metrics.reduce((acc, curr) => {
      if (!acc[curr.name]) {
        acc[curr.name] = { count: 0, totalDuration: 0, maxDuration: 0, category: curr.category };
      }
      acc[curr.name].count += 1;
      acc[curr.name].totalDuration += curr.duration;
      acc[curr.name].maxDuration = Math.max(acc[curr.name].maxDuration, curr.duration);
      return acc;
    }, {} as Record<string, { count: number, totalDuration: number, maxDuration: number, category: string }>);

    const tableData = Object.keys(aggregated).map(key => ({
      Name: key,
      Category: aggregated[key].category,
      Count: aggregated[key].count,
      'Avg Duration (ms)': (aggregated[key].totalDuration / aggregated[key].count).toFixed(2),
      'Max Duration (ms)': aggregated[key].maxDuration.toFixed(2),
      'Total Duration (ms)': aggregated[key].totalDuration.toFixed(2),
    }));

    console.table(tableData);
    console.groupEnd();
  }
}

export const PerformanceReporter = new Reporter();

if (typeof window !== 'undefined') {
  (window as any).dumpPerformanceMetrics = () => PerformanceReporter.printReport();
}

import { PerformanceMonitor } from './PerformanceMonitor';
import { PerformanceReporter } from './PerformanceReporter';
import Dexie from 'dexie';

export function createDexieProfiler(db: Dexie) {
  // Use Dexie's hook system or wrap methods to profile.
  // For simplicity and breadth, we wrap common table operations on the DB instance.
  
  const originalTable = db.table.bind(db);
  
  (db as any).table = function(tableName: string) {
    const table = originalTable(tableName);
    
    // Intercept common methods
    const methodsToWrap = ['get', 'where', 'toArray', 'count', 'filter', 'put', 'add', 'bulkPut', 'bulkAdd', 'bulkGet'];
    
    methodsToWrap.forEach(method => {
      const origMethod = (table as any)[method];
      if (typeof origMethod === 'function') {
        (table as any)[method] = function(...args: any[]) {
          const operationName = `dexie_${tableName}_${method}`;
          PerformanceMonitor.start(operationName);
          
          const result = origMethod.apply(this, args);
          
          if (result && typeof result.then === 'function') {
            return result.then((res: any) => {
              const duration = PerformanceMonitor.end(operationName);
              if (duration !== null) {
                PerformanceReporter.record({
                  name: `${tableName}.${method}`,
                  category: 'dexie',
                  duration,
                  details: { args }
                });
              }
              return res;
            });
          } else if (result && result.clone) { // Like Collection
              // Dealing with collections is harder to wrap deeply here without full proxy,
              // but we can wrap `toArray` on the collection
              const origToArray = result.toArray;
              if (origToArray) {
                 result.toArray = function() {
                    const toArrayOpName = `dexie_${tableName}_collection_toArray`;
                    PerformanceMonitor.start(toArrayOpName);
                    return origToArray.apply(this).then((res: any) => {
                        const duration = PerformanceMonitor.end(toArrayOpName);
                        if (duration !== null) {
                            PerformanceReporter.record({
                              name: `${tableName}.${method}.toArray`,
                              category: 'dexie',
                              duration,
                              details: { items: res?.length }
                            });
                        }
                        return res;
                    });
                 }
              }
          }
          
          return result;
        };
      }
    });
    
    return table;
  };
}

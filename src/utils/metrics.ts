import type { BenchmarkResult, ReducerType } from '../types';

export function measureTime<T>(fn: () => T): { result: T; time: number } {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  return { result, time: end - start };
}

export function calculateStats(times: number[]): {
  average: number;
  variance: number;
  min: number;
  max: number;
} {
  if (times.length === 0) {
    return { average: 0, variance: 0, min: 0, max: 0 };
  }

  const sum = times.reduce((acc, t) => acc + t, 0);
  const average = sum / times.length;
  const variance =
    times.reduce((acc, t) => acc + Math.pow(t - average, 2), 0) / times.length;
  const min = Math.min(...times);
  const max = Math.max(...times);

  return { average, variance, min, max };
}

export function createBenchmarkResult(
  reducerType: ReducerType,
  dataSize: number,
  operationType: string,
  times: number[]
): BenchmarkResult {
  const stats = calculateStats(times);
  return {
    reducerType,
    dataSize,
    operationType,
    times,
    ...stats,
  };
}

export function formatMs(ms: number): string {
  return `${ms.toFixed(3)}ms`;
}

export function formatResult(result: BenchmarkResult): string {
  return `[${result.reducerType.toUpperCase()}] ${result.operationType} (${result.dataSize} items)
  Average: ${formatMs(result.average)}
  Variance: ${result.variance.toFixed(4)}
  Min: ${formatMs(result.min)}
  Max: ${formatMs(result.max)}
  Samples: ${result.times.length}`;
}

// Long Task observer
let longTaskObserver: PerformanceObserver | null = null;
let longTaskCount = 0;

export function startLongTaskObserver(): void {
  if (typeof PerformanceObserver === 'undefined') return;

  try {
    longTaskObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > 50) {
          longTaskCount++;
          console.warn(`Long Task detected: ${entry.duration.toFixed(2)}ms`);
        }
      }
    });
    longTaskObserver.observe({ entryTypes: ['longtask'] });
  } catch {
    console.warn('Long Task observer not supported');
  }
}

export function stopLongTaskObserver(): number {
  if (longTaskObserver) {
    longTaskObserver.disconnect();
    longTaskObserver = null;
  }
  const count = longTaskCount;
  longTaskCount = 0;
  return count;
}

export function getLongTaskCount(): number {
  return longTaskCount;
}

export function resetLongTaskCount(): void {
  longTaskCount = 0;
}

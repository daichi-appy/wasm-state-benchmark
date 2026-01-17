import { useMemo } from 'react';
import type { Metrics, ReducerType } from '../types';
import { calculateStats, formatMs, getLongTaskCount } from '../utils';

type Props = {
  metrics: Metrics[];
  reducerType: ReducerType;
  itemCount: number;
};

export function MetricsPanel({ metrics, reducerType, itemCount }: Props) {
  const stats = useMemo(() => {
    if (metrics.length === 0) return null;
    const times = metrics.map((m) => m.dispatchTime);
    return calculateStats(times);
  }, [metrics]);

  const longTaskCount = getLongTaskCount();

  return (
    <div className="metrics-panel">
      <h3>Performance Metrics</h3>
      <div className="metrics-grid">
        <div className="metric">
          <span className="metric-label">Reducer Type</span>
          <span className="metric-value">{reducerType.toUpperCase()}</span>
        </div>
        <div className="metric">
          <span className="metric-label">Items</span>
          <span className="metric-value">{itemCount.toLocaleString()}</span>
        </div>
        <div className="metric">
          <span className="metric-label">Dispatches</span>
          <span className="metric-value">{metrics.length}</span>
        </div>
        <div className="metric">
          <span className="metric-label">Long Tasks</span>
          <span className="metric-value">{longTaskCount}</span>
        </div>
      </div>

      {stats && (
        <div className="metrics-stats">
          <h4>Dispatch Time Stats</h4>
          <div className="metrics-grid">
            <div className="metric">
              <span className="metric-label">Average</span>
              <span className="metric-value">{formatMs(stats.average)}</span>
            </div>
            <div className="metric">
              <span className="metric-label">Variance</span>
              <span className="metric-value">{stats.variance.toFixed(4)}</span>
            </div>
            <div className="metric">
              <span className="metric-label">Min</span>
              <span className="metric-value">{formatMs(stats.min)}</span>
            </div>
            <div className="metric">
              <span className="metric-label">Max</span>
              <span className="metric-value">{formatMs(stats.max)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

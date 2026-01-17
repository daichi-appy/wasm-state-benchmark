import { useReducer, useCallback, useMemo, useRef } from 'react';
import type { State, Action, ReducerType, Metrics } from '../types';
import { jsReducer, createInitialState, wasmReducer, isWasmLoaded } from '../reducers';
import { measureTime } from '../utils/metrics';

type MetricsCallback = (metrics: Metrics) => void;

export function useVideoStore(
  reducerType: ReducerType,
  itemsPerPage: number = 20,
  onMetrics?: MetricsCallback
) {
  const metricsRef = useRef<Metrics[]>([]);

  const reducer = useCallback(
    (state: State, action: Action): State => {
      if (reducerType === 'wasm' && isWasmLoaded()) {
        const { result, time } = measureTime(() => wasmReducer(state, action));
        const metrics = { dispatchTime: time, timestamp: performance.now() };
        metricsRef.current.push(metrics);
        onMetrics?.(metrics);
        return result;
      } else {
        const { result, time } = measureTime(() => jsReducer(state, action));
        const metrics = { dispatchTime: time, timestamp: performance.now() };
        metricsRef.current.push(metrics);
        onMetrics?.(metrics);
        return result;
      }
    },
    [reducerType, onMetrics]
  );

  const [state, dispatch] = useReducer(reducer, itemsPerPage, createInitialState);

  const currentPageItems = useMemo(() => {
    const start = state.currentPage * state.itemsPerPage;
    const end = start + state.itemsPerPage;
    return state.filteredItems.slice(start, end);
  }, [state.filteredItems, state.currentPage, state.itemsPerPage]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(state.filteredItems.length / state.itemsPerPage));
  }, [state.filteredItems.length, state.itemsPerPage]);

  const getMetrics = useCallback(() => [...metricsRef.current], []);
  const clearMetrics = useCallback(() => {
    metricsRef.current = [];
  }, []);

  return {
    state,
    dispatch,
    currentPageItems,
    totalPages,
    getMetrics,
    clearMetrics,
  };
}

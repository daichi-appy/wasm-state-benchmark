import { useState, useEffect, useCallback, useMemo } from 'react';
import type { State, Action, Item, Metrics } from './types';
import type { DataSize } from './utils';
import {
  generateItems,
  startLongTaskObserver,
  resetLongTaskCount,
  measureTime,
  calculateStats,
  formatMs,
  DATA_SIZES,
} from './utils';
import {
  loadWasmModule,
  isWasmLoaded,
  wasmInitStore,
  wasmSetItems,
  wasmFilterByTag,
  wasmFilterByPlayable,
  wasmSortByRating,
  wasmSortByTitle,
  wasmToggleSortOrder,
  wasmNextPage,
  wasmPrevPage,
  wasmGetPageItems,
  wasmGetViewState,
  jsReducer,
  createInitialState,
} from './reducers';
import { ItemCard } from './components';
import './App.css';

type ReducerType = 'js' | 'wasm';

type BenchmarkResult = {
  operation: string;
  jsTime: number;
  wasmTime: number;
  speedup: number;
};

function App() {
  const [reducerType, setReducerType] = useState<ReducerType>('js');
  const [dataSize, setDataSize] = useState<DataSize>(1000);
  const [wasmLoaded, setWasmLoaded] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  // JS State
  const [jsState, setJsState] = useState<State>(() => createInitialState(20));

  // WASM View State (lightweight)
  const [wasmViewState, setWasmViewState] = useState({
    filteredCount: 0,
    currentPage: 0,
    totalItems: 0,
    filterTag: null as string | null,
    filterPlayable: null as boolean | null,
    sortBy: null as string | null,
    sortOrder: 'asc',
  });
  const [wasmPageItems, setWasmPageItems] = useState<Item[]>([]);

  // Metrics
  const [metrics, setMetrics] = useState<Metrics[]>([]);
  const [benchmarkResults, setBenchmarkResults] = useState<BenchmarkResult[]>([]);
  const [benchmarkRunning, setBenchmarkRunning] = useState(false);

  // Load WASM module on mount
  useEffect(() => {
    loadWasmModule()
      .then(() => {
        wasmInitStore(20);
        setWasmLoaded(true);
      })
      .catch((err) => console.error('WASM load failed:', err));
    startLongTaskObserver();
  }, []);

  // Dispatch for JS
  const jsDispatch = useCallback((action: Action) => {
    const { result, time } = measureTime(() => jsReducer(jsState, action));
    setJsState(result);
    setMetrics((prev) => [...prev, { dispatchTime: time, timestamp: performance.now() }]);
    return time;
  }, [jsState]);

  // Current display items
  const currentPageItems = useMemo(() => {
    if (reducerType === 'js') {
      const start = jsState.currentPage * jsState.itemsPerPage;
      return jsState.filteredItems.slice(start, start + jsState.itemsPerPage);
    }
    return wasmPageItems;
  }, [reducerType, jsState, wasmPageItems]);

  const totalPages = useMemo(() => {
    if (reducerType === 'js') {
      return Math.max(1, Math.ceil(jsState.filteredItems.length / jsState.itemsPerPage));
    }
    return Math.max(1, Math.ceil(wasmViewState.filteredCount / 20));
  }, [reducerType, jsState, wasmViewState]);

  const filteredCount = reducerType === 'js' ? jsState.filteredItems.length : wasmViewState.filteredCount;
  const totalItems = reducerType === 'js' ? jsState.items.length : wasmViewState.totalItems;
  const currentPage = reducerType === 'js' ? jsState.currentPage : wasmViewState.currentPage;

  // Load data handler
  const handleLoadData = useCallback(() => {
    const items = generateItems(dataSize);
    setMetrics([]);
    resetLongTaskCount();

    // Load into JS state
    const { time: jsTime } = measureTime(() => {
      const newState = jsReducer(jsState, { type: 'SET_ITEMS', payload: items });
      setJsState(newState);
    });

    // Load into WASM state
    let wasmTime = 0;
    if (isWasmLoaded()) {
      const { time } = measureTime(() => {
        const viewState = wasmSetItems(items);
        setWasmViewState(viewState);
        setWasmPageItems(wasmGetPageItems());
      });
      wasmTime = time;
    }

    setDataLoaded(true);
    console.log(`Data loaded - JS: ${formatMs(jsTime)}, WASM: ${formatMs(wasmTime)}`);
  }, [dataSize, jsState]);

  // Run comparison benchmark
  const runBenchmark = useCallback(async () => {
    if (!dataLoaded || !isWasmLoaded()) return;

    setBenchmarkRunning(true);
    const results: BenchmarkResult[] = [];
    const iterations = 20;

    // Test operations
    const operations = [
      {
        name: 'Filter by Tag',
        jsAction: { type: 'FILTER_BY_TAG' as const, payload: 'Action' },
        wasmFn: () => wasmFilterByTag('Action'),
      },
      {
        name: 'Filter by Playable',
        jsAction: { type: 'FILTER_BY_PLAYABLE' as const, payload: true },
        wasmFn: () => wasmFilterByPlayable(true),
      },
      {
        name: 'Sort by Rating',
        jsAction: { type: 'SORT_BY_RATING' as const },
        wasmFn: () => wasmSortByRating(),
      },
      {
        name: 'Sort by Title',
        jsAction: { type: 'SORT_BY_TITLE' as const },
        wasmFn: () => wasmSortByTitle(),
      },
      {
        name: 'Toggle Sort Order',
        jsAction: { type: 'TOGGLE_SORT_ORDER' as const },
        wasmFn: () => wasmToggleSortOrder(),
      },
      {
        name: 'Next Page',
        jsAction: { type: 'NEXT_PAGE' as const },
        wasmFn: () => wasmNextPage(),
      },
    ];

    for (const op of operations) {
      const jsTimes: number[] = [];
      const wasmTimes: number[] = [];

      // Reset state before each operation test
      let testJsState = jsState;

      for (let i = 0; i < iterations; i++) {
        // JS test
        const { result: newJsState, time: jsTime } = measureTime(() =>
          jsReducer(testJsState, op.jsAction)
        );
        jsTimes.push(jsTime);
        testJsState = newJsState;

        // WASM test (state is internal, just measure the operation)
        const { time: wasmTime } = measureTime(() => op.wasmFn());
        wasmTimes.push(wasmTime);
      }

      const jsAvg = calculateStats(jsTimes).average;
      const wasmAvg = calculateStats(wasmTimes).average;

      results.push({
        operation: op.name,
        jsTime: jsAvg,
        wasmTime: wasmAvg,
        speedup: jsAvg / wasmAvg,
      });

      // Small delay between operations
      await new Promise((r) => setTimeout(r, 10));
    }

    setBenchmarkResults(results);
    setBenchmarkRunning(false);
  }, [dataLoaded, jsState]);

  // UI handlers
  const handleFilterByTag = useCallback((tag: string | null) => {
    if (reducerType === 'js') {
      jsDispatch({ type: 'FILTER_BY_TAG', payload: tag });
    } else {
      const { time } = measureTime(() => {
        const viewState = wasmFilterByTag(tag);
        setWasmViewState(viewState);
        setWasmPageItems(wasmGetPageItems());
      });
      setMetrics((prev) => [...prev, { dispatchTime: time, timestamp: performance.now() }]);
    }
  }, [reducerType, jsDispatch]);

  const handleFilterByPlayable = useCallback((playable: boolean | null) => {
    if (reducerType === 'js') {
      jsDispatch({ type: 'FILTER_BY_PLAYABLE', payload: playable });
    } else {
      const { time } = measureTime(() => {
        const viewState = wasmFilterByPlayable(playable);
        setWasmViewState(viewState);
        setWasmPageItems(wasmGetPageItems());
      });
      setMetrics((prev) => [...prev, { dispatchTime: time, timestamp: performance.now() }]);
    }
  }, [reducerType, jsDispatch]);

  const handleSortByRating = useCallback(() => {
    if (reducerType === 'js') {
      jsDispatch({ type: 'SORT_BY_RATING' });
    } else {
      const { time } = measureTime(() => {
        const viewState = wasmSortByRating();
        setWasmViewState(viewState);
        setWasmPageItems(wasmGetPageItems());
      });
      setMetrics((prev) => [...prev, { dispatchTime: time, timestamp: performance.now() }]);
    }
  }, [reducerType, jsDispatch]);

  const handleSortByTitle = useCallback(() => {
    if (reducerType === 'js') {
      jsDispatch({ type: 'SORT_BY_TITLE' });
    } else {
      const { time } = measureTime(() => {
        const viewState = wasmSortByTitle();
        setWasmViewState(viewState);
        setWasmPageItems(wasmGetPageItems());
      });
      setMetrics((prev) => [...prev, { dispatchTime: time, timestamp: performance.now() }]);
    }
  }, [reducerType, jsDispatch]);

  const handleToggleSortOrder = useCallback(() => {
    if (reducerType === 'js') {
      jsDispatch({ type: 'TOGGLE_SORT_ORDER' });
    } else {
      const { time } = measureTime(() => {
        const viewState = wasmToggleSortOrder();
        setWasmViewState(viewState);
        setWasmPageItems(wasmGetPageItems());
      });
      setMetrics((prev) => [...prev, { dispatchTime: time, timestamp: performance.now() }]);
    }
  }, [reducerType, jsDispatch]);

  const handleNextPage = useCallback(() => {
    if (reducerType === 'js') {
      jsDispatch({ type: 'NEXT_PAGE' });
    } else {
      const { time } = measureTime(() => {
        const viewState = wasmNextPage();
        setWasmViewState(viewState);
        setWasmPageItems(wasmGetPageItems());
      });
      setMetrics((prev) => [...prev, { dispatchTime: time, timestamp: performance.now() }]);
    }
  }, [reducerType, jsDispatch]);

  const handlePrevPage = useCallback(() => {
    if (reducerType === 'js') {
      jsDispatch({ type: 'PREV_PAGE' });
    } else {
      const { time } = measureTime(() => {
        const viewState = wasmPrevPage();
        setWasmViewState(viewState);
        setWasmPageItems(wasmGetPageItems());
      });
      setMetrics((prev) => [...prev, { dispatchTime: time, timestamp: performance.now() }]);
    }
  }, [reducerType, jsDispatch]);

  const handleReducerTypeChange = useCallback((type: ReducerType) => {
    setReducerType(type);
    setMetrics([]);
    resetLongTaskCount();

    // Sync WASM page items when switching to WASM
    if (type === 'wasm' && isWasmLoaded()) {
      setWasmViewState(wasmGetViewState());
      setWasmPageItems(wasmGetPageItems());
    }
  }, []);

  // Metrics stats
  const metricsStats = useMemo(() => {
    if (metrics.length === 0) return null;
    return calculateStats(metrics.map((m) => m.dispatchTime));
  }, [metrics]);

  const TAGS = ['Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi', 'Romance', 'Thriller', 'Documentary', 'Animation', 'Fantasy'];

  return (
    <div className="app">
      <header className="app-header">
        <h1>WASM Performance Test</h1>
        <p>React + WebAssembly State Management Comparison</p>
      </header>

      <main className="app-main">
        <aside className="sidebar">
          {/* Reducer Type */}
          <div className="control-panel">
            <h3>Reducer Type</h3>
            <div className="button-group">
              <button className={reducerType === 'js' ? 'active' : ''} onClick={() => handleReducerTypeChange('js')}>
                JavaScript
              </button>
              <button
                className={reducerType === 'wasm' ? 'active' : ''}
                onClick={() => handleReducerTypeChange('wasm')}
                disabled={!wasmLoaded}
              >
                WebAssembly
              </button>
            </div>
          </div>

          {/* Data Size */}
          <div className="control-panel">
            <h3>Data Size</h3>
            <div className="button-group">
              {DATA_SIZES.map((size) => (
                <button key={size} className={dataSize === size ? 'active' : ''} onClick={() => setDataSize(size)}>
                  {size.toLocaleString()}
                </button>
              ))}
            </div>
            <button className="load-button" onClick={handleLoadData}>
              Load Data
            </button>
          </div>

          {/* Filters */}
          <div className="control-panel">
            <h3>Filter by Tag</h3>
            <select
              value={reducerType === 'js' ? jsState.filterTag ?? '' : wasmViewState.filterTag ?? ''}
              onChange={(e) => handleFilterByTag(e.target.value || null)}
            >
              <option value="">All Tags</option>
              {TAGS.map((tag) => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>

            <h3>Filter by Playable</h3>
            <div className="button-group">
              <button onClick={() => handleFilterByPlayable(null)}>All</button>
              <button onClick={() => handleFilterByPlayable(true)}>Playable</button>
              <button onClick={() => handleFilterByPlayable(false)}>Not Playable</button>
            </div>

            <h3>Sort</h3>
            <div className="button-group">
              <button onClick={handleSortByRating}>Rating</button>
              <button onClick={handleSortByTitle}>Title</button>
              <button onClick={handleToggleSortOrder}>
                {(reducerType === 'js' ? jsState.sortOrder : wasmViewState.sortOrder) === 'asc' ? '↑ Asc' : '↓ Desc'}
              </button>
            </div>
          </div>

          {/* Metrics */}
          <div className="metrics-panel">
            <h3>Performance Metrics</h3>
            <div className="metrics-grid">
              <div className="metric">
                <span className="metric-label">Type</span>
                <span className="metric-value">{reducerType.toUpperCase()}</span>
              </div>
              <div className="metric">
                <span className="metric-label">Items</span>
                <span className="metric-value">{totalItems.toLocaleString()}</span>
              </div>
              <div className="metric">
                <span className="metric-label">Dispatches</span>
                <span className="metric-value">{metrics.length}</span>
              </div>
            </div>
            {metricsStats && (
              <div className="metrics-stats">
                <h4>Dispatch Time</h4>
                <div className="metrics-grid">
                  <div className="metric">
                    <span className="metric-label">Avg</span>
                    <span className="metric-value">{formatMs(metricsStats.average)}</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Variance</span>
                    <span className="metric-value">{metricsStats.variance.toFixed(4)}</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Min</span>
                    <span className="metric-value">{formatMs(metricsStats.min)}</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Max</span>
                    <span className="metric-value">{formatMs(metricsStats.max)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Benchmark */}
          <div className="benchmark-panel">
            <h3>Benchmark Comparison</h3>
            <button onClick={runBenchmark} disabled={!dataLoaded || !wasmLoaded || benchmarkRunning}>
              {benchmarkRunning ? 'Running...' : 'Run Benchmark'}
            </button>
            {benchmarkResults.length > 0 && (
              <div className="benchmark-results">
                <table>
                  <thead>
                    <tr>
                      <th>Operation</th>
                      <th>JS</th>
                      <th>WASM</th>
                      <th>Speedup</th>
                    </tr>
                  </thead>
                  <tbody>
                    {benchmarkResults.map((r) => (
                      <tr key={r.operation}>
                        <td>{r.operation}</td>
                        <td>{formatMs(r.jsTime)}</td>
                        <td>{formatMs(r.wasmTime)}</td>
                        <td style={{ color: r.speedup > 1 ? 'green' : 'red' }}>
                          {r.speedup.toFixed(2)}x
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </aside>

        <section className="content">
          <div className="content-header">
            <h2>Items ({filteredCount.toLocaleString()} shown)</h2>
            <div className="pagination">
              <button onClick={handlePrevPage} disabled={currentPage === 0}>← Prev</button>
              <span className="page-info">Page {currentPage + 1} / {totalPages}</span>
              <button onClick={handleNextPage} disabled={currentPage >= totalPages - 1}>Next →</button>
            </div>
          </div>

          <div className="item-grid">
            {currentPageItems.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>

          {currentPageItems.length === 0 && (
            <div className="empty-state">
              <p>No items to display. Load data or adjust filters.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;

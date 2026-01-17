import type { Action, State, ReducerType } from '../types';
import type { DataSize } from '../utils';
import { DATA_SIZES } from '../utils';

type Props = {
  state: State;
  dispatch: React.Dispatch<Action>;
  reducerType: ReducerType;
  onReducerTypeChange: (type: ReducerType) => void;
  dataSize: DataSize;
  onDataSizeChange: (size: DataSize) => void;
  onLoadData: () => void;
  wasmLoaded: boolean;
};

const TAGS = [
  'Action',
  'Comedy',
  'Drama',
  'Horror',
  'Sci-Fi',
  'Romance',
  'Thriller',
  'Documentary',
  'Animation',
  'Fantasy',
];

export function ControlPanel({
  state,
  dispatch,
  reducerType,
  onReducerTypeChange,
  dataSize,
  onDataSizeChange,
  onLoadData,
  wasmLoaded,
}: Props) {
  return (
    <div className="control-panel">
      <div className="control-section">
        <h3>Reducer Type</h3>
        <div className="button-group">
          <button
            className={reducerType === 'js' ? 'active' : ''}
            onClick={() => onReducerTypeChange('js')}
          >
            JavaScript
          </button>
          <button
            className={reducerType === 'wasm' ? 'active' : ''}
            onClick={() => onReducerTypeChange('wasm')}
            disabled={!wasmLoaded}
            title={!wasmLoaded ? 'WASM module not loaded' : ''}
          >
            WebAssembly
          </button>
        </div>
      </div>

      <div className="control-section">
        <h3>Data Size</h3>
        <div className="button-group">
          {DATA_SIZES.map((size) => (
            <button
              key={size}
              className={dataSize === size ? 'active' : ''}
              onClick={() => onDataSizeChange(size)}
            >
              {size.toLocaleString()}
            </button>
          ))}
        </div>
        <button className="load-button" onClick={onLoadData}>
          Load Data
        </button>
      </div>

      <div className="control-section">
        <h3>Filter by Tag</h3>
        <select
          value={state.filterTag ?? ''}
          onChange={(e) =>
            dispatch({
              type: 'FILTER_BY_TAG',
              payload: e.target.value || null,
            })
          }
        >
          <option value="">All Tags</option>
          {TAGS.map((tag) => (
            <option key={tag} value={tag}>
              {tag}
            </option>
          ))}
        </select>
      </div>

      <div className="control-section">
        <h3>Filter by Playable</h3>
        <div className="button-group">
          <button
            className={state.filterPlayable === null ? 'active' : ''}
            onClick={() => dispatch({ type: 'FILTER_BY_PLAYABLE', payload: null })}
          >
            All
          </button>
          <button
            className={state.filterPlayable === true ? 'active' : ''}
            onClick={() => dispatch({ type: 'FILTER_BY_PLAYABLE', payload: true })}
          >
            Playable
          </button>
          <button
            className={state.filterPlayable === false ? 'active' : ''}
            onClick={() => dispatch({ type: 'FILTER_BY_PLAYABLE', payload: false })}
          >
            Not Playable
          </button>
        </div>
      </div>

      <div className="control-section">
        <h3>Sort</h3>
        <div className="button-group">
          <button
            className={state.sortBy === 'rating' ? 'active' : ''}
            onClick={() => dispatch({ type: 'SORT_BY_RATING' })}
          >
            Rating
          </button>
          <button
            className={state.sortBy === 'title' ? 'active' : ''}
            onClick={() => dispatch({ type: 'SORT_BY_TITLE' })}
          >
            Title
          </button>
          <button onClick={() => dispatch({ type: 'TOGGLE_SORT_ORDER' })}>
            {state.sortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
          </button>
        </div>
      </div>
    </div>
  );
}

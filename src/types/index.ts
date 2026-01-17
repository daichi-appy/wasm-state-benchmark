export type Item = {
  id: string;
  title: string;
  tags: string[];
  rating: number;
  isPlayable: boolean;
};

export type State = {
  items: Item[];
  filteredItems: Item[];
  currentPage: number;
  itemsPerPage: number;
  filterTag: string | null;
  filterPlayable: boolean | null;
  sortBy: 'rating' | 'title' | null;
  sortOrder: 'asc' | 'desc';
};

export type Action =
  | { type: 'SET_ITEMS'; payload: Item[] }
  | { type: 'FILTER_BY_TAG'; payload: string | null }
  | { type: 'FILTER_BY_PLAYABLE'; payload: boolean | null }
  | { type: 'SORT_BY_RATING' }
  | { type: 'SORT_BY_TITLE' }
  | { type: 'TOGGLE_SORT_ORDER' }
  | { type: 'SET_PAGE'; payload: number }
  | { type: 'NEXT_PAGE' }
  | { type: 'PREV_PAGE' };

export type ReducerType = 'js' | 'wasm';

export type Metrics = {
  dispatchTime: number;
  timestamp: number;
};

export type BenchmarkResult = {
  reducerType: ReducerType;
  dataSize: number;
  operationType: string;
  times: number[];
  average: number;
  variance: number;
  min: number;
  max: number;
};

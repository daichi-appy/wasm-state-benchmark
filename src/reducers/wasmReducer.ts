import type { Item } from '../types';

export type WasmViewState = {
  filteredCount: number;
  currentPage: number;
  itemsPerPage: number;
  filterTag: string | null;
  filterPlayable: boolean | null;
  sortBy: 'rating' | 'title' | null;
  sortOrder: 'asc' | 'desc';
  totalItems: number;
};

// WASM module will be loaded dynamically
let wasmModule: {
  init_store: (itemsPerPage: number) => void;
  set_items: (items: Item[]) => WasmViewState;
  filter_by_tag: (tag: string | undefined) => WasmViewState;
  filter_by_playable: (playable: boolean | undefined) => WasmViewState;
  sort_by_rating: () => WasmViewState;
  sort_by_title: () => WasmViewState;
  toggle_sort_order: () => WasmViewState;
  set_page: (page: number) => WasmViewState;
  next_page: () => WasmViewState;
  prev_page: () => WasmViewState;
  get_page_items: () => Item[];
  get_view_state: () => WasmViewState;
} | null = null;

let wasmLoadPromise: Promise<void> | null = null;

export async function loadWasmModule(): Promise<void> {
  if (wasmModule) return;
  if (wasmLoadPromise) return wasmLoadPromise;

  wasmLoadPromise = (async () => {
    try {
      const module = await import('../../wasm-reducer/pkg/wasm_reducer');
      await module.default();
      wasmModule = module;
    } catch (error) {
      console.error('Failed to load WASM module:', error);
      throw error;
    }
  })();

  return wasmLoadPromise;
}

export function isWasmLoaded(): boolean {
  return wasmModule !== null;
}

export function wasmInitStore(itemsPerPage: number): void {
  if (!wasmModule) throw new Error('WASM not loaded');
  wasmModule.init_store(itemsPerPage);
}

export function wasmSetItems(items: Item[]): WasmViewState {
  if (!wasmModule) throw new Error('WASM not loaded');
  return wasmModule.set_items(items);
}

export function wasmFilterByTag(tag: string | null): WasmViewState {
  if (!wasmModule) throw new Error('WASM not loaded');
  return wasmModule.filter_by_tag(tag ?? undefined);
}

export function wasmFilterByPlayable(playable: boolean | null): WasmViewState {
  if (!wasmModule) throw new Error('WASM not loaded');
  return wasmModule.filter_by_playable(playable ?? undefined);
}

export function wasmSortByRating(): WasmViewState {
  if (!wasmModule) throw new Error('WASM not loaded');
  return wasmModule.sort_by_rating();
}

export function wasmSortByTitle(): WasmViewState {
  if (!wasmModule) throw new Error('WASM not loaded');
  return wasmModule.sort_by_title();
}

export function wasmToggleSortOrder(): WasmViewState {
  if (!wasmModule) throw new Error('WASM not loaded');
  return wasmModule.toggle_sort_order();
}

export function wasmSetPage(page: number): WasmViewState {
  if (!wasmModule) throw new Error('WASM not loaded');
  return wasmModule.set_page(page);
}

export function wasmNextPage(): WasmViewState {
  if (!wasmModule) throw new Error('WASM not loaded');
  return wasmModule.next_page();
}

export function wasmPrevPage(): WasmViewState {
  if (!wasmModule) throw new Error('WASM not loaded');
  return wasmModule.prev_page();
}

export function wasmGetPageItems(): Item[] {
  if (!wasmModule) throw new Error('WASM not loaded');
  return wasmModule.get_page_items();
}

export function wasmGetViewState(): WasmViewState {
  if (!wasmModule) throw new Error('WASM not loaded');
  return wasmModule.get_view_state();
}

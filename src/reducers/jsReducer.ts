import type { State, Action, Item } from '../types';

function applyFilters(state: State): Item[] {
  let result = [...state.items];

  // Filter by tag
  if (state.filterTag !== null) {
    result = result.filter((item) => item.tags.includes(state.filterTag!));
  }

  // Filter by playable
  if (state.filterPlayable !== null) {
    result = result.filter((item) => item.isPlayable === state.filterPlayable);
  }

  // Sort
  if (state.sortBy !== null) {
    const asc = state.sortOrder === 'asc';
    if (state.sortBy === 'rating') {
      result.sort((a, b) => (asc ? a.rating - b.rating : b.rating - a.rating));
    } else if (state.sortBy === 'title') {
      result.sort((a, b) =>
        asc ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title)
      );
    }
  }

  return result;
}

export function jsReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_ITEMS': {
      const newState = { ...state, items: action.payload };
      return {
        ...newState,
        filteredItems: applyFilters(newState),
        currentPage: 0,
      };
    }

    case 'FILTER_BY_TAG': {
      const newState = { ...state, filterTag: action.payload };
      return {
        ...newState,
        filteredItems: applyFilters(newState),
        currentPage: 0,
      };
    }

    case 'FILTER_BY_PLAYABLE': {
      const newState = { ...state, filterPlayable: action.payload };
      return {
        ...newState,
        filteredItems: applyFilters(newState),
        currentPage: 0,
      };
    }

    case 'SORT_BY_RATING': {
      const newState = { ...state, sortBy: 'rating' as const };
      return { ...newState, filteredItems: applyFilters(newState) };
    }

    case 'SORT_BY_TITLE': {
      const newState = { ...state, sortBy: 'title' as const };
      return { ...newState, filteredItems: applyFilters(newState) };
    }

    case 'TOGGLE_SORT_ORDER': {
      const newState = {
        ...state,
        sortOrder: state.sortOrder === 'asc' ? ('desc' as const) : ('asc' as const),
      };
      return { ...newState, filteredItems: applyFilters(newState) };
    }

    case 'SET_PAGE': {
      const maxPage = Math.max(
        0,
        Math.floor((state.filteredItems.length - 1) / state.itemsPerPage)
      );
      return { ...state, currentPage: Math.min(action.payload, maxPage) };
    }

    case 'NEXT_PAGE': {
      const maxPage = Math.max(
        0,
        Math.floor((state.filteredItems.length - 1) / state.itemsPerPage)
      );
      if (state.currentPage < maxPage) {
        return { ...state, currentPage: state.currentPage + 1 };
      }
      return state;
    }

    case 'PREV_PAGE': {
      if (state.currentPage > 0) {
        return { ...state, currentPage: state.currentPage - 1 };
      }
      return state;
    }

    default:
      return state;
  }
}

export function createInitialState(itemsPerPage: number = 20): State {
  return {
    items: [],
    filteredItems: [],
    currentPage: 0,
    itemsPerPage,
    filterTag: null,
    filterPlayable: null,
    sortBy: null,
    sortOrder: 'asc',
  };
}

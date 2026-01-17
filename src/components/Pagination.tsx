import type { Action, State } from '../types';

type Props = {
  state: State;
  dispatch: React.Dispatch<Action>;
  totalPages: number;
};

export function Pagination({ state, dispatch, totalPages }: Props) {
  return (
    <div className="pagination">
      <button
        onClick={() => dispatch({ type: 'PREV_PAGE' })}
        disabled={state.currentPage === 0}
      >
        ← Prev
      </button>
      <span className="page-info">
        Page {state.currentPage + 1} / {totalPages}
      </span>
      <button
        onClick={() => dispatch({ type: 'NEXT_PAGE' })}
        disabled={state.currentPage >= totalPages - 1}
      >
        Next →
      </button>
    </div>
  );
}

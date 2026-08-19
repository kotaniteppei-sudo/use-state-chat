import type { HistoryState } from "../hooks/useMessageHistory";
type LoadStateViewProps = {
  state: HistoryState;
  onRetry: () => void;
};

export function LoadStateView({ state, onRetry }: LoadStateViewProps) {
  switch (state.status) {
    case "idle":
      return <p>読み込み前です。</p>;
    case "loading":
      return (
        <p aria-live="polite" role="status">
          読み込み中...
        </p>
      );
    case "error":
      return (
        <div className="api-error" role="alert">
          <p>{state.message}</p>
          <button type="button" onClick={onRetry}>
            再試行
          </button>
        </div>
      );
    case "success":
      return state.data.length === 0 ? (
        <p>履歴はありません。</p>
      ) : (
        <ul>
          {state.data.map((item) => (
            <li key={item.id}>{item.text}</li>
          ))}
        </ul>
      );
  }
}

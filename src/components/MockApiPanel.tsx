import type { MockMode } from "../api/fakeMessageApi";
import type { HistoryState } from "../hooks/useMessageHistory";
import { LoadStateView } from "./LoadStateView";

type MockApiPanelProps = {
  mode: MockMode;
  state: HistoryState;
  onModeChange: (mode: MockMode) => void;
  onRetry: () => void;
};

const MODES: MockMode[] = ["success", "empty", "error"];

export function MockApiPanel({
  mode,
  state,
  onModeChange,
  onRetry,
}: MockApiPanelProps) {
  return (
    <section className="api-panel" aria-labelledby="api-heading">
      <h2 id="api-heading">模擬APIの状態確認</h2>
      <fieldset>
        <legend>読み込み結果</legend>
        {MODES.map((item) => (
          <label key={item}>
            <input
              type="radio"
              name="mock-mode"
              value={item}
              checked={mode === item}
              onChange={() => onModeChange(item)}
            />
            {item}
          </label>
        ))}
      </fieldset>
      <LoadStateView state={state} onRetry={onRetry} />
    </section>
  );
}

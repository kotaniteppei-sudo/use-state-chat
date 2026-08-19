type MessageSearchProps = {
  value: string;
  visibleCount: number;
  totalCount: number;
  onChange: (value: string) => void;
};

export function MessageSearch({
  value,
  visibleCount,
  totalCount,
  onChange,
}: MessageSearchProps) {
  return (
    <section className="search-panel" aria-labelledby="search-heading">
      <h2 id="search-heading">メッセージ検索</h2>
      <div className="search-row">
        <label htmlFor="message-search" className="sr-only">
          本文を検索
        </label>
        <p aria-label="検索結果件数" aria-live="polite" role="status">
          {visibleCount} / {totalCount}件
        </p>
        <input
          id="message-search"
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        <button
          type="button"
          disabled={value.length === 0}
          onClick={() => onChange("")}
        >
          クリア
        </button>
      </div>
    </section>
  );
}

type MessageSearchProps = {
  searchText: string;
  onSearchTextChange: (value: string) => void;
  totalCount: number;
  filteredCount: number;
};

export function MessageSearch({
  searchText,
  onSearchTextChange,
  totalCount,
  filteredCount,
}: MessageSearchProps) {
  return (
    <div className="search-section">
      <label htmlFor="search-input" className="sr-only1">
        メッセージを検索
      </label>
      <input
        id="search-input"
        type="text"
        name="searchText"
        placeholder="メッセージを検索"
        value={searchText}
        onChange={(e) => onSearchTextChange(e.target.value)}
      />
      <div
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >{`${filteredCount}件のメッセージが見つかりました。`}</div>

      <button
        type="button"
        onClick={() => onSearchTextChange("")}
        disabled={!searchText}
      >
        クリア
      </button>
      {searchText ? (
        <p className="textCount">
          該当 {filteredCount}/ {totalCount}件
        </p>
      ) : (
        ""
      )}
    </div>
  );
}

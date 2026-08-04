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
      <input
        type="text"
        name="searchText"
        placeholder="メッセージを検索"
        value={searchText}
        onChange={(e) => onSearchTextChange(e.target.value)}
      />
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

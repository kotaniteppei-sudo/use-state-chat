type SortOrderProps = {
  order: string;
  toggleOrder: () => void;
};

export function SortOrder({ order, toggleOrder }: SortOrderProps) {
  return (
    <button type="button" className="sort" onClick={() => toggleOrder()}>
      並び順：{order === "oldest" ? "古い順" : "新しい順"}
    </button>
  );
}

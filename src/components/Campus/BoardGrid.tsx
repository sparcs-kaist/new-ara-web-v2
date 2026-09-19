interface BoardGridProps {
  isPending: boolean;
  isEmpty: boolean;
  emptyText: string;
  children: React.ReactNode;
}

export default function BoardGrid({ isPending, isEmpty, emptyText, children }: BoardGridProps) {
  if (isPending || isEmpty)
    return <p className="text-[#808080] text-base">{isPending ? "불러오는 중..." : emptyText}</p>;

  return <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">{children}</div>;
}

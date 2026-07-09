interface CitizenBadgeProps {
  value?: boolean;
}

export function CitizenBadge({ value }: CitizenBadgeProps) {
  const label = value == null
    ? "민원인 선택"
    : value
      ? "민원인 판정: 해당"
      : "민원인 판정: 미해당";
  const colorClass = (value == null || value)
    ? "bg-blue-50 border-blue-200 text-blue-700"
    : "bg-muted border-border text-muted-foreground";
  return (
    <span className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[11px] font-medium shrink-0 whitespace-nowrap ${colorClass}`}>
      {label}
    </span>
  );
}

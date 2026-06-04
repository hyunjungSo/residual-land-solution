/**
 * 날짜/시간 포맷팅 유틸리티
 */

// 날짜+시간 포맷 (YYYY-MM-DD HH:mm:ss)
export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// 날짜만 포맷 (YYYY-MM-DD)
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date
    .toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    .replace(/\. /g, "-")
    .replace(".", "");
}

// 시간만 포맷 (HH:mm)
export function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

// 상대적 시간 표시 (방금 전, 5분 전, 1시간 전 등)
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "방금 전";
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHour < 24) return `${diffHour}시간 전`;
  if (diffDay < 7) return `${diffDay}일 전`;
  return formatDate(dateString);
}

// 숫자 포맷 (천 단위 콤마)
export function formatNumber(num: number): string {
  return num.toLocaleString("ko-KR");
}

// 퍼센트 포맷
export function formatPercent(value: number, decimals: number = 0): string {
  return `${value.toFixed(decimals)}%`;
}

// 면적 포맷 (㎡)
export function formatArea(area: number): string {
  return `${formatNumber(area)}㎡`;
}

// 금액 포맷 (원)
export function formatCurrency(amount: number): string {
  return `${formatNumber(amount)}원`;
}

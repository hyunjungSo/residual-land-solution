"use client";

interface ReasonMemoDisplayProps {
  changeReason?: string | null;
  memo?: string | null;
  className?: string;
  variant?: "card" | "inline";
}

/**
 * 변경 사유 및 메모 표시 컴포넌트
 */
export function ReasonMemoDisplay({ 
  changeReason, 
  memo, 
  className = "",
  variant = "card"
}: ReasonMemoDisplayProps) {
  if (!changeReason && !memo) return null;

  if (variant === "inline") {
    return (
      <div className={`text-[15px] space-y-1 ${className}`}>
        {changeReason && (
          <p>
            <strong>변경 사유:</strong> {changeReason}
          </p>
        )}
        {memo && (
          <p>
            <strong>메모:</strong> {memo}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {changeReason && (
        <div className="space-y-1">
          <label className="text-xs font-semibold" style={{ color: "rgb(26, 26, 26)" }}>
            변경 사유
          </label>
          <div 
            className="rounded-lg min-h-[80px] overflow-y-auto text-[15px] whitespace-pre-wrap break-words" 
            style={{ backgroundColor: "rgb(251, 251, 251)", padding: "8px" }}
          >
            {changeReason}
          </div>
        </div>
      )}
      {memo && (
        <div className="space-y-1">
          <label className="text-xs font-semibold" style={{ color: "rgb(26, 26, 26)" }}>
            메모
          </label>
          <div 
            className="rounded-lg min-h-[80px] overflow-y-auto text-[15px] whitespace-pre-wrap break-words" 
            style={{ backgroundColor: "rgb(251, 251, 251)", padding: "8px" }}
          >
            {memo}
          </div>
        </div>
      )}
    </div>
  );
}

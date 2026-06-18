"use client";

import { Switch } from "@/components/ui/switch";

interface PublishRadioCellProps {
  id: string;
  isPublished: boolean;
  onPublishChange: (published: boolean) => void;
}

export function PublishRadioCell({ 
  id, 
  isPublished, 
  onPublishChange 
}: PublishRadioCellProps) {
  return (
    <div className="flex items-center gap-2">
      <Switch 
        checked={isPublished}
        onCheckedChange={onPublishChange}
      />
      <span className={`text-[15px] font-medium ${isPublished ? "text-emerald-600" : "text-muted-foreground"}`}>
        {isPublished ? "노출" : "미노출"}
      </span>
    </div>
  );
}

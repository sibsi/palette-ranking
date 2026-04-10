import { LoaderCircle } from "lucide-react";

export default function BootState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6">
      <div className="relative flex items-center justify-center">
        <div className="absolute size-12 animate-ping rounded-full bg-blue-500/20" />
        <LoaderCircle className="size-10 animate-spin stroke-[1.25] text-blue-500" />
      </div>
      <p className="text-xs font-medium text-(--text-faint)">
        Restoring your folders...
      </p>
    </div>
  );
}

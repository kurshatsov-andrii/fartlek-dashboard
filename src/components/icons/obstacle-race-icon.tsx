import { cn } from "@/lib/utils";

/** OCR / перешкоди: широка планка, геометричний центр у середині viewBox. */
export function ObstacleRaceIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("shrink-0", className)}
      aria-hidden
    >
      <path d="M2 15V9M22 15V9M2 9h20" />
    </svg>
  );
}

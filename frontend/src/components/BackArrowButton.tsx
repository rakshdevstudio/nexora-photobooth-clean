import { useRef } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type BackArrowButtonProps = {
  onBack: () => void;
  ariaLabel?: string;
  className?: string;
  disabled?: boolean;
};

/**
 * Touch-friendly back button with basic double-tap guard.
 */
export default function BackArrowButton({
  onBack,
  ariaLabel = "Back",
  className,
  disabled,
}: BackArrowButtonProps) {
  const lastTapRef = useRef(0);

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn(
        "h-11 w-11 rounded-2xl touch-manipulation select-none",
        className,
      )}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => {
        const now = Date.now();
        if (now - lastTapRef.current < 450) return;
        lastTapRef.current = now;
        onBack();
      }}
    >
      <ArrowLeft className="h-5 w-5" />
    </Button>
  );
}

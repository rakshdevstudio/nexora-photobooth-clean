import KioskChrome from "@/booth/components/KioskChrome";
import { useBoothFlow } from "@/booth/flow/BoothFlowProvider";

export default function StepPaymentLoading() {
  const { back } = useBoothFlow();
  return (
    <KioskChrome title="Payment" subtitle="Opening payment… Please wait." showBack onBack={back}>
      <div className="flex min-h-[320px] flex-col items-center justify-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-border border-t-ring" aria-hidden="true" />
        <div className="text-sm text-muted-foreground">Opening Payment…</div>
        <div className="text-xs text-muted-foreground">Background interaction is disabled for kiosk safety.</div>
      </div>
    </KioskChrome>
  );
}
